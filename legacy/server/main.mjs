import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import {
  ROSTER_BY_ID,
  ARENA_DEFS,
  ENGINE_VERSION,
} from "../engine/runtime.mjs";
import { PROTOCOL_VERSION, RECONNECT_MS } from "../protocol/version.mjs";
import { validateBenchmark, selectHost } from "../protocol/host-selection.mjs";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};
export function readIceServers(
  text = process.env.RTC_ICE_SERVERS ||
    (process.env.RTC_ICE_SERVERS_FILE
      ? fs.readFileSync(process.env.RTC_ICE_SERVERS_FILE, "utf8")
      : "[]"),
) {
  const servers = JSON.parse(text);
  if (!Array.isArray(servers) || servers.length > 8)
    throw new Error(
      "RTC_ICE_SERVERS must be an array with at most eight servers",
    );
  return servers.map((server) => {
    const urls = typeof server.urls === "string" ? [server.urls] : server.urls;
    if (
      !Array.isArray(urls) ||
      !urls.length ||
      urls.length > 4 ||
      urls.some(
        (url) =>
          typeof url !== "string" ||
          url.length > 2048 ||
          !/^stuns?:[^\s]+$|^turns?:[^\s]+$/.test(url),
      )
    )
      throw new Error("Invalid ICE server URL");
    const result = { urls };
    if (urls.some((url) => /^turns?:/.test(url))) {
      if (
        typeof server.username !== "string" ||
        !server.username ||
        typeof server.credential !== "string" ||
        !server.credential ||
        server.username.length > 1024 ||
        server.credential.length > 4096
      )
        throw new Error("TURN needs provider-issued username and credential");
      result.username = server.username;
      result.credential = server.credential;
    }
    return result;
  });
}
function validSignal(data, team) {
  if (!data || typeof data !== "object") return null;
  if (data.type === "offer" || data.type === "answer") {
    if (
      (data.type === "offer" && team !== 0) ||
      (data.type === "answer" && team !== 1) ||
      typeof data.sdp !== "string" ||
      data.sdp.length > 24_000 ||
      !data.sdp.startsWith("v=0")
    )
      return null;
    return { type: data.type, sdp: data.sdp };
  }
  if (data.type === "candidate") {
    const candidate = data.candidate;
    if (
      !candidate ||
      typeof candidate.candidate !== "string" ||
      candidate.candidate.length > 4096 ||
      !candidate.candidate.startsWith("candidate:")
    )
      return null;
    if (
      candidate.sdpMid != null &&
      (typeof candidate.sdpMid !== "string" || candidate.sdpMid.length > 64)
    )
      return null;
    if (
      candidate.sdpMLineIndex != null &&
      (!Number.isInteger(candidate.sdpMLineIndex) ||
        candidate.sdpMLineIndex < 0 ||
        candidate.sdpMLineIndex > 8)
    )
      return null;
    return {
      type: "candidate",
      candidate: {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid ?? null,
        sdpMLineIndex: candidate.sdpMLineIndex ?? null,
        usernameFragment:
          typeof candidate.usernameFragment === "string"
            ? candidate.usernameFragment.slice(0, 256)
            : undefined,
      },
    };
  }
  return null;
}
export function createArenaServer({
  root = path.join(project, "dist"),
  reconnectMs = RECONNECT_MS,
  maxRooms = 100,
  iceServers = readIceServers(),
} = {}) {
  const rooms = new Map(),
    tokens = new Map();
  const send = (socket, message) => {
    if (
      socket?.readyState === WebSocket.OPEN &&
      socket.bufferedAmount < 128 * 1024
    )
      socket.send(JSON.stringify({ v: PROTOCOL_VERSION, ...message }));
  };
  const broadcast = (room, message) =>
    room.players.forEach((player) => player && send(player.socket, message));
  const roomState = (room) => ({
    type: "room",
    code: room.code,
    phase: room.phase,
    arena: room.arena,
    hostTeam: room.match?.hostTeam ?? null,
    players: room.players.map((player) =>
      player
        ? { hero: player.hero, ready: player.ready, connected: !!player.socket }
        : null,
    ),
  });
  function descriptor(room, resuming = false) {
    return { ...room.match, resuming, iceServers };
  }
  function resetPeer(room) {
    if (!room.match || room.phase === "finished") return;
    room.match.generation++;
    room.connected.clear();
    room.lastReset = Date.now();
    room.phase = "connecting";
    broadcast(room, roomState(room));
    broadcast(room, { type: "peer-start", descriptor: descriptor(room, true) });
  }
  function start(room) {
    if (
      room.players.some(
        (player) => !player?.socket || !player.ready || !player.benchmark,
      )
    )
      return;
    const hostTeam = selectHost(room.players.map((player) => player.benchmark));
    room.match = {
      id: crypto.randomBytes(12).toString("hex"),
      generation: 1,
      version: ENGINE_VERSION,
      heroes: room.players.map((player) => player.hero),
      arena: room.arena,
      seed: crypto.randomBytes(12).toString("hex"),
      hostTeam,
      benchmarks: room.players.map((player) => player.benchmark),
    };
    room.phase = "connecting";
    room.connected = new Set();
    room.updated = Date.now();
    room.lastReset = Date.now();
    room.result = null;
    broadcast(room, roomState(room));
    broadcast(room, { type: "peer-start", descriptor: descriptor(room) });
  }
  function seat(socket, room, team, existing, preservePeer = false) {
    const player = existing || {
      token: crypto.randomBytes(24).toString("base64url"),
      hero: "valerius",
      ready: false,
      benchmark: null,
    };
    if (player.socket && player.socket !== socket)
      player.socket.close(4001, "Session resumed elsewhere");
    player.socket = socket;
    player.offlineSince = null;
    socket.room = room;
    socket.team = team;
    room.players[team] = player;
    tokens.set(player.token, { room, team });
    room.updated = Date.now();
    send(socket, {
      type: "seat",
      room: room.code,
      team,
      token: player.token,
      version: ENGINE_VERSION,
    });
    broadcast(room, roomState(room));
    if (existing && room.match) {
      if (room.phase === "finished") {
        send(socket, {
          type: "peer-start",
          descriptor: descriptor(room, true),
        });
        if (room.result) send(socket, { type: "peer-result", ...room.result });
      } else if (preservePeer)
        send(socket, {
          type: "peer-start",
          descriptor: descriptor(room, true),
        });
      else resetPeer(room);
    }
  }
  function detach(socket, leave = false) {
    const room = socket.room,
      team = socket.team;
    if (!room || room.players[team]?.socket !== socket) return;
    const player = room.players[team];
    player.socket = null;
    player.offlineSince = Date.now();
    if (!room.match) player.ready = false;
    if (leave) {
      tokens.delete(player.token);
      room.players[team] = null;
      if (room.match) {
        broadcast(room, { type: "peer-left", matchId: room.match.id, team });
        room.phase = "finished";
        room.result = { winner: 1 - team, reason: "left" };
      }
    }
    socket.room = null;
    broadcast(room, roomState(room));
  }
  const server = http.createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          status: "ok",
          mode: "p2p-signaling",
          rooms: rooms.size,
          version: ENGINE_VERSION,
        }),
      );
      return;
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405);
      response.end();
      return;
    }
    let name;
    try {
      name = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
    } catch {
      response.writeHead(400);
      response.end();
      return;
    }
    if (name === "/") name = "/index.html";
    const file = path.resolve(root, "." + name);
    if (
      !file.startsWith(path.resolve(root) + path.sep) ||
      path.basename(file).startsWith(".")
    ) {
      response.writeHead(403);
      response.end();
      return;
    }
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Content-Length": stat.size,
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      if (request.method === "HEAD") response.end();
      else fs.createReadStream(file).pipe(response);
    });
  });
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 32 * 1024,
    perMessageDeflate: false,
  });
  server.on("upgrade", (request, socket, head) => {
    const origin = request.headers.origin;
    if (
      request.url !== "/socket" ||
      (origin &&
        origin !== "http://" + request.headers.host &&
        origin !== "https://" + request.headers.host)
    ) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) =>
      wss.emit("connection", ws),
    );
  });
  wss.on("connection", (socket) => {
    socket.count = 0;
    socket.window = Date.now();
    socket.alive = true;
    socket.on("pong", () => {
      socket.alive = true;
    });
    socket.on("error", () => {});
    socket.on("close", () => detach(socket));
    send(socket, {
      type: "hello",
      version: ENGINE_VERSION,
      transport: "webrtc",
    });
    socket.on("message", (data) => {
      if (Date.now() - socket.window >= 1000) {
        socket.window = Date.now();
        socket.count = 0;
      }
      if (++socket.count > 100) {
        socket.close(1008, "Too many signaling messages");
        return;
      }
      let message;
      try {
        message = JSON.parse(data.toString());
      } catch {
        send(socket, { type: "error", message: "Gói tin không hợp lệ." });
        return;
      }
      if (
        !message ||
        message.v !== PROTOCOL_VERSION ||
        message.version !== ENGINE_VERSION
      ) {
        send(socket, {
          type: "error",
          message: "Phiên bản game khác nhau. Hãy tải lại trang.",
        });
        return;
      }
      if (message.type === "resume") {
        if (socket.room) return;
        const binding = tokens.get(message.token);
        const player = binding?.room.players[binding.team];
        if (
          !binding ||
          !player ||
          (!binding.room.match &&
            player.offlineSince &&
            Date.now() - player.offlineSince > reconnectMs)
        ) {
          send(socket, {
            type: "error",
            message: "Phiên kết nối đã hết hạn.",
            expired: true,
          });
          return;
        }
        seat(
          socket,
          binding.room,
          binding.team,
          player,
          message.peerAlive === true,
        );
        return;
      }
      if (message.type === "create" || message.type === "join") {
        if (socket.room) {
          send(socket, {
            type: "error",
            message: "Bạn đang ở trong một phòng.",
          });
          return;
        }
        if (message.type === "create") {
          if (rooms.size >= maxRooms) {
            send(socket, { type: "error", message: "Máy chủ đã đủ phòng." });
            return;
          }
          let code;
          do {
            code = crypto
              .randomBytes(4)
              .toString("hex")
              .slice(0, 6)
              .toUpperCase();
          } while (rooms.has(code));
          const room = {
            code,
            players: [null, null],
            phase: "lobby",
            arena: Object.hasOwn(ARENA_DEFS, message.arena)
              ? message.arena
              : "go",
            updated: Date.now(),
            match: null,
            connected: new Set(),
          };
          rooms.set(code, room);
          seat(socket, room, 0);
        } else {
          const room = rooms.get(String(message.code || "").toUpperCase());
          if (!room || room.phase !== "lobby" || room.players.every(Boolean)) {
            send(socket, {
              type: "error",
              message: "Không tìm thấy phòng trống.",
            });
            return;
          }
          seat(socket, room, room.players[0] ? 1 : 0);
        }
        if (Object.hasOwn(ROSTER_BY_ID, message.hero))
          socket.room.players[socket.team].hero = message.hero;
        broadcast(socket.room, roomState(socket.room));
        return;
      }
      const room = socket.room,
        team = socket.team,
        player = room?.players[team];
      if (!player || player.socket !== socket) return;
      room.updated = Date.now();
      if (message.type === "leave") {
        detach(socket, true);
        return;
      }
      if (message.type === "pick" && room.phase === "lobby") {
        if (Object.hasOwn(ROSTER_BY_ID, message.hero)) {
          player.hero = message.hero;
          player.ready = false;
          player.benchmark = null;
          broadcast(room, roomState(room));
        }
        return;
      }
      if (
        message.type === "ready" &&
        ["lobby", "finished"].includes(room.phase)
      ) {
        const benchmark = validateBenchmark(message.benchmark);
        if (!benchmark) {
          send(socket, {
            type: "error",
            message: "Cần đo hiệu năng cả hai máy trước khi chọn host.",
          });
          return;
        }
        if (room.phase === "finished") {
          room.phase = "lobby";
          room.match = null;
          room.result = null;
          room.connected.clear();
          for (const p of room.players)
            if (p) {
              p.ready = false;
              p.benchmark = null;
            }
        }
        player.ready = true;
        player.benchmark = benchmark;
        broadcast(room, roomState(room));
        start(room);
        return;
      }
      if (!room.match || message.matchId !== room.match.id) return;
      if (
        message.type === "signal" &&
        message.generation === room.match.generation
      ) {
        const payload = validSignal(message.data, team);
        if (payload)
          send(room.players[1 - team]?.socket, {
            type: "signal",
            matchId: room.match.id,
            generation: room.match.generation,
            data: payload,
          });
        return;
      }
      if (message.type === "renegotiate" && room.phase !== "finished") {
        if (Date.now() - room.lastReset > 2000) resetPeer(room);
        return;
      }
      if (message.type === "peer-connected") {
        room.connected.add(team);
        if (room.connected.size === 2) {
          room.phase = "playing";
          broadcast(room, roomState(room));
        }
        return;
      }
      if (
        message.type === "peer-result" &&
        team === room.match.hostTeam &&
        [0, 1].includes(message.winner) &&
        ["match", "left", "disconnect", "host-reload", "time-limit"].includes(
          message.reason,
        )
      ) {
        room.phase = "finished";
        room.result = { winner: message.winner, reason: message.reason };
        broadcast(room, roomState(room));
        return;
      }
      if (message.type === "input" || message.type === "snapshot")
        send(socket, {
          type: "error",
          message:
            "Dữ liệu trận đấu chỉ được gửi qua kết nối WebRTC giữa hai máy.",
        });
    });
  });
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      // Loss of the signaling socket alone must never end an established P2P game.
      if (!room.match)
        for (let team = 0; team < 2; team++) {
          const player = room.players[team];
          if (
            player &&
            !player.socket &&
            now - player.offlineSince > reconnectMs
          ) {
            tokens.delete(player.token);
            room.players[team] = null;
          }
        }
      if (
        room.players.every((player) => !player) ||
        now - room.updated > 20 * 60_000
      ) {
        for (const player of room.players)
          if (player) {
            tokens.delete(player.token);
            player.socket?.close(4000, "Room expired");
          }
        rooms.delete(code);
      }
    }
  }, 1000);
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.alive) socket.terminate();
      else {
        socket.alive = false;
        socket.ping();
      }
    }
  }, 15_000);
  server.on("close", () => {
    clearInterval(cleanup);
    clearInterval(heartbeat);
  });
  return {
    server,
    wss,
    rooms,
    close: async () => {
      for (const socket of wss.clients) socket.terminate();
      await new Promise((resolve) => wss.close(resolve));
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const instance = createArenaServer();
  const port = Number(process.env.PORT || 8002),
    host = process.env.HOST || "127.0.0.1";
  instance.server.listen(port, host, () =>
    console.log(`Legacy P2P signaling server running on ${host}:${port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => instance.close().then(() => process.exit()));
}
