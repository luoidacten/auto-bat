import {
  ARENA_DEFS,
  ENGINE_VERSION,
  ROSTER_BY_ID,
} from "../engine/runtime.mjs";
import { PROTOCOL_VERSION } from "./version.mjs";
import { selectHost, validateBenchmark } from "./host-selection.mjs";

const randomHex = (bytes) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
export const roomCode = () => randomHex(3).toUpperCase();
export const peerRoomId = (code) =>
  "legacy-arena-" + ENGINE_VERSION + "-" + code;
export function parseRoomToken(token) {
  if (
    typeof token !== "string" ||
    !/^[A-F0-9]{6}\.[01]\.[a-f0-9]{48}$/.test(token)
  )
    return null;
  const [code, team] = token.split(".");
  return { code, team: Number(team), token };
}

// The room creator coordinates lobby metadata; it need not host the simulation.
// Gameplay never enters this coordinator, the public broker, or this channel.
export class PeerRoom {
  constructor({
    code,
    arena = "go",
    iceServers = [],
    emit,
    persist = () => {},
    saved = null,
  }) {
    this.emit = (team, message) =>
      emit(team, { v: PROTOCOL_VERSION, ...message });
    this.persist = persist;
    this.iceServers = iceServers;
    this.code = code;
    this.arena = Object.hasOwn(ARENA_DEFS, arena) ? arena : "go";
    this.players = [null, null];
    this.phase = "lobby";
    this.match = null;
    this.result = null;
    this.connected = new Set();
    this.lastReset = 0;
    if (
      saved?.version === ENGINE_VERSION &&
      saved.code === code &&
      Date.now() - saved.at < 20 * 60_000 &&
      Array.isArray(saved.players) &&
      saved.players.length === 2 &&
      saved.players.every(
        (p, team) =>
          p === null ||
          (Object.hasOwn(ROSTER_BY_ID, p.hero) &&
            parseRoomToken(p.token)?.team === team &&
            p.token.startsWith(code + ".")),
      ) &&
      ["lobby", "connecting", "playing", "finished"].includes(saved.phase)
    ) {
      this.arena = saved.arena;
      this.players = saved.players.map((p) =>
        p ? { ...p, online: false } : null,
      );
      this.phase = saved.phase;
      this.match = saved.match;
      this.result = saved.result;
    }
  }
  save() {
    this.persist({
      version: ENGINE_VERSION,
      at: Date.now(),
      code: this.code,
      arena: this.arena,
      players: this.players,
      phase: this.phase,
      match: this.match,
      result: this.result,
    });
  }
  state() {
    return {
      type: "room",
      code: this.code,
      phase: this.phase,
      arena: this.arena,
      hostTeam: this.match?.hostTeam ?? null,
      players: this.players.map((p) =>
        p ? { hero: p.hero, ready: p.ready, connected: p.online } : null,
      ),
    };
  }
  broadcast(message) {
    for (let team = 0; team < 2; team++)
      if (this.players[team]?.online) this.emit(team, message);
  }
  update() {
    this.save();
    this.broadcast(this.state());
  }
  descriptor(resuming = false) {
    return {
      ...this.match,
      iceServers: this.iceServers,
      resuming: resuming && this.match.started === true,
    };
  }
  reset() {
    if (!this.match || this.phase === "finished") return;
    this.match.generation++;
    this.phase = "connecting";
    this.lastReset = Date.now();
    this.connected.clear();
    this.update();
    this.broadcast({ type: "peer-start", descriptor: this.descriptor(true) });
  }
  start() {
    if (!this.players.every((p) => p?.online && p.ready && p.benchmark)) return;
    this.match = {
      id: randomHex(12),
      generation: 1,
      version: ENGINE_VERSION,
      started: false,
      heroes: this.players.map((p) => p.hero),
      arena: this.arena,
      seed: randomHex(12),
      hostTeam: selectHost(this.players.map((p) => p.benchmark)),
      benchmarks: this.players.map((p) => p.benchmark),
    };
    this.phase = "connecting";
    this.result = null;
    this.lastReset = Date.now();
    this.connected.clear();
    this.update();
    this.broadcast({ type: "peer-start", descriptor: this.descriptor() });
  }
  detach(team, leave = false) {
    const player = this.players[team];
    if (!player) return;
    player.online = false;
    if (!this.match) player.ready = false;
    if (leave) {
      this.players[team] = null;
      if (this.match) {
        this.phase = "finished";
        this.result = { winner: 1 - team, reason: "left" };
        this.broadcast({ type: "peer-left", matchId: this.match.id, team });
      }
    }
    this.update();
  }
  receive(team, message) {
    const error = (text, expired = false) =>
      this.emit(team, { type: "error", message: text, expired });
    if (
      ![0, 1].includes(team) ||
      !message ||
      message.v !== PROTOCOL_VERSION ||
      message.version !== ENGINE_VERSION
    ) {
      error("Phiên bản game khác nhau. Hãy tải lại cả hai trang.");
      return false;
    }
    if (["create", "join", "resume"].includes(message.type)) {
      const existing = this.players[team];
      if (message.type === "resume") {
        if (!existing || message.token !== existing.token) {
          error("Phiên kết nối đã hết hạn.", true);
          return false;
        }
      } else if (
        existing ||
        (team === 0) !== (message.type === "create") ||
        (team === 1 && message.code !== this.code) ||
        this.phase !== "lobby"
      ) {
        error("Phòng không còn chỗ trống hoặc trận đã bắt đầu.");
        return false;
      }
      const player = existing || {
        hero: Object.hasOwn(ROSTER_BY_ID, message.hero)
          ? message.hero
          : "valerius",
        ready: false,
        benchmark: null,
        token: this.code + "." + team + "." + randomHex(24),
      };
      player.online = true;
      this.players[team] = player;
      this.emit(team, {
        type: "seat",
        room: this.code,
        team,
        token: player.token,
        version: ENGINE_VERSION,
      });
      this.update();
      if (existing && this.match) {
        if (this.phase === "finished" || message.peerAlive === true) {
          this.emit(team, {
            type: "peer-start",
            descriptor: this.descriptor(true),
          });
          if (this.result)
            this.emit(team, { type: "peer-result", ...this.result });
        } else this.reset();
      }
      return true;
    }
    const player = this.players[team];
    if (!player?.online) return false;
    if (message.type === "leave") {
      this.detach(team, true);
      return true;
    }
    if (
      message.type === "pick" &&
      this.phase === "lobby" &&
      Object.hasOwn(ROSTER_BY_ID, message.hero)
    ) {
      player.hero = message.hero;
      player.ready = false;
      player.benchmark = null;
      this.update();
      return true;
    }
    if (
      message.type === "ready" &&
      ["lobby", "finished"].includes(this.phase)
    ) {
      const benchmark = validateBenchmark(message.benchmark);
      if (!benchmark) {
        error("Cần đo hiệu năng cả hai máy trước khi chọn host.");
        return false;
      }
      if (this.phase === "finished") {
        this.phase = "lobby";
        this.match = null;
        this.result = null;
        this.connected.clear();
        for (const p of this.players)
          if (p) {
            p.ready = false;
            p.benchmark = null;
          }
      }
      player.ready = true;
      player.benchmark = benchmark;
      this.update();
      this.start();
      return true;
    }
    if (!this.match || message.matchId !== this.match.id) return false;
    if (
      message.type === "signal" &&
      message.generation === this.match.generation
    ) {
      const data = message.data;
      const valid =
        data &&
        ((((data.type === "offer" && team === 0) ||
          (data.type === "answer" && team === 1)) &&
          typeof data.sdp === "string" &&
          data.sdp.startsWith("v=0") &&
          data.sdp.length <= 24_000) ||
          (data.type === "candidate" &&
            typeof data.candidate?.candidate === "string" &&
            data.candidate.candidate.startsWith("candidate:") &&
            data.candidate.candidate.length <= 4096));
      if (!valid) return false;
      this.emit(1 - team, {
        type: "signal",
        matchId: this.match.id,
        generation: this.match.generation,
        data,
      });
      return true;
    }
    if (message.type === "peer-connected") {
      this.connected.add(team);
      if (this.connected.size === 2) {
        this.match.started = true;
        this.phase = "playing";
        this.update();
      }
      return true;
    }
    if (message.type === "renegotiate" && Date.now() - this.lastReset > 2000) {
      this.reset();
      return true;
    }
    if (
      message.type === "peer-result" &&
      team === this.match.hostTeam &&
      [0, 1].includes(message.winner)
    ) {
      this.phase = "finished";
      this.result = {
        winner: message.winner,
        reason: [
          "match",
          "left",
          "disconnect",
          "host-reload",
          "time-limit",
        ].includes(message.reason)
          ? message.reason
          : "match",
      };
      this.update();
      this.broadcast({ type: "peer-result", ...this.result });
      return true;
    }
    return false;
  }
}
