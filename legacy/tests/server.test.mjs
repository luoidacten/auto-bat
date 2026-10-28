import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { WebSocket } from "ws";
import { createArenaServer, readIceServers } from "../server/main.mjs";
import { ENGINE_VERSION } from "../engine/runtime.mjs";
import { PROTOCOL_VERSION } from "../protocol/version.mjs";
const weak = { ticks: 512, meanMs: 1, p95Ms: 2 },
  strong = { ticks: 512, meanMs: 0.1, p95Ms: 0.2 };
async function client(url) {
  const socket = new WebSocket(url),
    messages = [],
    waiters = [];
  socket.on("message", (data) => {
    const message = JSON.parse(data.toString());
    const index = waiters.findIndex(
      (waiter) => waiter.type === message.type && waiter.predicate(message),
    );
    if (index >= 0) {
      const waiter = waiters.splice(index, 1)[0];
      clearTimeout(waiter.timer);
      waiter.resolve(message);
    } else messages.push(message);
  });
  await once(socket, "open");
  return {
    socket,
    messages,
    next: (type, predicate = () => true) => {
      const index = messages.findIndex((m) => m.type === type && predicate(m));
      if (index >= 0) return Promise.resolve(messages.splice(index, 1)[0]);
      return new Promise((resolve, reject) => {
        const waiter = { type, predicate, resolve };
        waiter.timer = setTimeout(
          () => reject(new Error("Timed out waiting for " + type)),
          5000,
        );
        waiters.push(waiter);
      });
    },
    send: (message) =>
      socket.send(
        JSON.stringify({
          v: PROTOCOL_VERSION,
          version: ENGINE_VERSION,
          ...message,
        }),
      ),
  };
}

test("signaling chooses the faster machine, routes only peer setup and preserves P2P on socket loss", async () => {
  const app = createArenaServer({ reconnectMs: 25, iceServers: [] });
  app.server.listen(0, "127.0.0.1");
  await once(app.server, "listening");
  const url = "ws://127.0.0.1:" + app.server.address().port + "/socket";
  const sockets = [];
  try {
    const a = await client(url);
    sockets.push(a.socket);
    a.send({ type: "create", hero: "zero" });
    const seat = await a.next("seat");
    const b = await client(url);
    sockets.push(b.socket);
    b.send({ type: "join", code: seat.room, hero: "valerius" });
    const bSeat = await b.next("seat");
    const third = await client(url);
    sockets.push(third.socket);
    third.send({ type: "join", code: seat.room });
    assert.match((await third.next("error")).message, /trống/);
    a.send({ type: "ready" });
    assert.match((await a.next("error")).message, /hiệu năng/);
    a.send({ type: "ready", benchmark: weak });
    b.send({ type: "ready", benchmark: strong });
    const start = await a.next("peer-start");
    await b.next("peer-start");
    const descriptor = start.descriptor;
    assert.equal(descriptor.hostTeam, 1, "creator is not automatically host");
    const room = app.rooms.get(seat.room);
    assert.equal(room.session, undefined, "signaling has no game simulation");
    const offer = { type: "offer", sdp: "v=0\r\ns=fixture\r\n" };
    a.send({
      type: "signal",
      matchId: descriptor.id,
      generation: 1,
      data: offer,
    });
    assert.equal((await b.next("signal")).data.type, "offer");
    b.send({
      type: "signal",
      matchId: descriptor.id,
      generation: 1,
      data: offer,
    });
    b.send({
      type: "signal",
      matchId: descriptor.id,
      generation: 1,
      data: {
        type: "candidate",
        candidate: {
          candidate: "candidate:fixture",
          sdpMid: "0",
          sdpMLineIndex: 0,
        },
      },
    });
    assert.equal((await a.next("signal")).data.type, "candidate");
    assert.ok(
      !a.messages.some((m) => m.type === "signal" && m.data.type === "offer"),
    );
    a.send({
      type: "input",
      matchId: descriptor.id,
      frame: { seq: 0, x: 1, y: 0 },
    });
    assert.match((await a.next("error")).message, /WebRTC/);
    a.send({ type: "peer-connected", matchId: descriptor.id });
    b.send({ type: "peer-connected", matchId: descriptor.id });
    await b.next("room", (m) => m.phase === "playing");
    a.socket.close();
    await once(a.socket, "close");
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.equal(
      room.phase,
      "playing",
      "signaling loss never forfeits a live P2P match",
    );
    const resumed = await client(url);
    sockets.push(resumed.socket);
    resumed.send({ type: "resume", token: seat.token });
    await resumed.next("seat");
    const restart = await resumed.next("peer-start");
    assert.equal(restart.descriptor.id, descriptor.id);
    assert.equal(restart.descriptor.generation, 2);
    const stolen = await client(url);
    sockets.push(stolen.socket);
    stolen.send({ type: "resume", token: "wrong-token" });
    assert.equal((await stolen.next("error")).expired, true);
    resumed.send({
      type: "peer-result",
      matchId: descriptor.id,
      winner: 0,
      reason: "match",
    });
    resumed.send({
      type: "signal",
      matchId: descriptor.id,
      generation: 2,
      data: offer,
    });
    await b.next("signal", (m) => m.generation === 2);
    assert.notEqual(room.phase, "finished", "non-host cannot report a result");
    b.send({
      type: "peer-result",
      matchId: descriptor.id,
      winner: 1,
      reason: "match",
    });
    await resumed.next("room", (m) => m.phase === "finished");
    resumed.send({ type: "ready", benchmark: strong });
    b.send({ type: "ready", benchmark: weak });
    const rematch = await resumed.next(
      "peer-start",
      (m) => m.descriptor.id !== descriptor.id,
    );
    assert.equal(
      rematch.descriptor.hostTeam,
      0,
      "host is reselected before a rematch",
    );
    const health = await fetch(
      "http://127.0.0.1:" + app.server.address().port + "/health",
    ).then((r) => r.json());
    assert.equal(health.mode, "p2p-signaling");
  } finally {
    for (const socket of sockets) socket.terminate();
    await app.close();
  }
});

test("ICE configuration validates destinations without silently disabling TURN authentication", () => {
  assert.deepEqual(readIceServers("[]"), []);
  assert.equal(
    readIceServers('[{"urls":"stun:stun.example.test:3478"}]')[0].urls.length,
    1,
  );
  assert.throws(() => readIceServers('[{"urls":"https://example.test"}]'));
  assert.throws(() =>
    readIceServers('[{"urls":"turn:turn.example.test:3478"}]'),
  );
  assert.throws(() => readIceServers("{}"));
});
