import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PeerRoom,
  parseRoomToken,
  peerRoomId,
} from "../protocol/peer-room.mjs";
import { roomTransport } from "../client/room-transport.mjs";
import { ENGINE_VERSION } from "../engine/runtime.mjs";
import { PROTOCOL_VERSION } from "../protocol/version.mjs";

const weak = { ticks: 512, meanMs: 2, p95Ms: 3 };
const strong = { ticks: 512, meanMs: 0.1, p95Ms: 0.2 };
function fixture(saved = null) {
  const packets = [[], []];
  let persisted;
  const room = new PeerRoom({
    code: "ABC123",
    saved,
    iceServers: [],
    emit: (team, message) => packets[team].push(message),
    persist: (value) => {
      persisted = structuredClone(value);
    },
  });
  const send = (team, message) =>
    room.receive(team, {
      v: PROTOCOL_VERSION,
      version: ENGINE_VERSION,
      ...message,
    });
  const latest = (team, type) => packets[team].findLast((m) => m.type === type);
  return { room, packets, send, latest, saved: () => persisted };
}
function joined() {
  const f = fixture();
  f.send(0, { type: "create", hero: "vector" });
  f.send(1, { type: "join", code: "ABC123", hero: "ariston" });
  return f;
}
function started() {
  const f = joined();
  f.send(0, { type: "ready", benchmark: weak });
  f.send(1, { type: "ready", benchmark: strong });
  return f;
}

test("GitHub Pages automatically uses peer rooms rather than /socket; deployments can override", () => {
  assert.equal(
    roomTransport({ hostname: "luoidacten.github.io", search: "" }),
    "peer",
  );
  assert.equal(roomTransport({ hostname: "127.0.0.1", search: "" }), "server");
  assert.equal(
    roomTransport({ hostname: "example.test", search: "?rooms=peer" }),
    "peer",
  );
  assert.equal(
    roomTransport(
      { hostname: "luoidacten.github.io", search: "" },
      { transport: "server" },
    ),
    "server",
  );
  assert.ok(peerRoomId("ABC123").includes(ENGINE_VERSION));
});

test("peer lobby waits for two measured humans and selects the faster guest as game host", () => {
  const { room, send, latest } = joined();
  send(0, { type: "ready", benchmark: weak });
  assert.equal(room.match, null);
  send(1, { type: "ready", benchmark: { ...strong, p95Ms: NaN } });
  assert.equal(room.match, null);
  send(1, { type: "ready", benchmark: strong });
  assert.equal(room.match.hostTeam, 1);
  assert.deepEqual(room.match.heroes, ["vector", "ariston"]);
  assert.equal(
    latest(0, "peer-start").descriptor.id,
    latest(1, "peer-start").descriptor.id,
  );
  assert.equal(room.session, undefined);
  assert.equal(room.phase, "connecting");
});

test("peer lobby only relays bounded current-generation SDP/ICE, never gameplay frames", () => {
  const { room, send, packets, latest } = started();
  const base = { matchId: room.match.id, generation: room.match.generation };
  const offer = { type: "offer", sdp: "v=0\r\ntest" };
  send(0, { type: "signal", ...base, data: offer });
  assert.deepEqual(latest(1, "signal").data, offer);
  const count = packets.map((p) => p.length);
  assert.equal(send(1, { type: "signal", ...base, data: offer }), false);
  assert.equal(
    send(0, { type: "signal", ...base, generation: 0, data: offer }),
    false,
  );
  assert.equal(
    send(0, {
      type: "signal",
      ...base,
      data: { type: "offer", sdp: "v=0" + "x".repeat(24_000) },
    }),
    false,
  );
  assert.equal(send(0, { type: "input", ...base, frame: {} }), false);
  assert.equal(send(0, { type: "state", ...base, state: {} }), false);
  assert.deepEqual(
    packets.map((p) => p.length),
    count,
  );
});

test("peer seat tokens prevent a third player or incorrect resume from taking a slot", () => {
  const { room, send, latest } = joined();
  const token = latest(1, "seat").token;
  assert.deepEqual(parseRoomToken(token), { code: "ABC123", team: 1, token });
  assert.equal(parseRoomToken("invalid"), null);
  room.detach(1);
  assert.equal(send(1, { type: "join", code: "ABC123", hero: "zero" }), false);
  assert.equal(
    send(1, { type: "resume", token: token.replace(/.$/, "Z") }),
    false,
  );
  assert.equal(send(1, { type: "resume", token }), true);
  assert.equal(room.players[1].hero, "ariston");
});

test("metadata loss does not forfeit P2P; creator reload restores the room and advances negotiation", () => {
  const f = started();
  const token = f.latest(0, "seat").token;
  const id = f.room.match.id;
  f.send(0, { type: "peer-connected", matchId: id });
  f.send(1, { type: "peer-connected", matchId: id });
  f.room.detach(1);
  assert.equal(f.room.phase, "playing");
  assert.equal(f.room.result, null);
  const restored = fixture(f.saved());
  restored.send(0, { type: "resume", token });
  assert.equal(restored.room.match.id, id);
  assert.equal(restored.room.match.hostTeam, 1);
  assert.equal(restored.room.match.generation, 2);
  assert.equal(restored.latest(0, "peer-start").descriptor.resuming, true);
});

test("reload while the first RTC connection is pending does not require a nonexistent host checkpoint", () => {
  const f = started();
  assert.equal(f.room.match.started, false);
  f.room.reset();
  assert.equal(f.latest(0, "peer-start").descriptor.resuming, false);
});

test("only the measured host reports results and rematch measures both machines again", () => {
  const { room, send } = started();
  const id = room.match.id;
  assert.equal(send(0, { type: "peer-result", matchId: id, winner: 0 }), false);
  send(1, { type: "peer-result", matchId: id, winner: 1 });
  assert.equal(room.phase, "finished");
  send(0, { type: "ready", benchmark: strong });
  assert.equal(room.match, null);
  send(1, { type: "ready", benchmark: weak });
  assert.notEqual(room.match.id, id);
  assert.equal(room.match.hostTeam, 0);
});
