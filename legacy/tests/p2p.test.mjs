import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBenchmark, selectHost } from "../protocol/host-selection.mjs";
import { encodePacket, PacketReader } from "../protocol/rtc-framing.mjs";
import { HostSimulation, benchmarkHost } from "../client/host-simulation.mjs";
import { ENGINE_VERSION, neutralInput } from "../engine/runtime.mjs";
const descriptor = {
  id: "fixture-match",
  hostTeam: 1,
  heroes: ["vector", "ariston"],
  arena: "go",
  seed: "peer-fixture",
};

test("host selection favors steady low tick cost and rejects fabricated non-finite metrics", () => {
  const slow = { ticks: 512, meanMs: 2, p95Ms: 4 },
    fast = { ticks: 512, meanMs: 0.1, p95Ms: 0.2 };
  assert.equal(selectHost([slow, fast]), 1);
  assert.equal(selectHost([fast, slow]), 0);
  assert.equal(selectHost([fast, fast]), 0);
  assert.equal(validateBenchmark({ ...fast, p95Ms: NaN }), null);
  assert.equal(validateBenchmark({ ...fast, ticks: 0 }), null);
  assert.throws(() => selectHost([fast, {}]));
  const measured = benchmarkHost();
  assert.equal(measured.ticks, 512);
  assert.ok(validateBenchmark(measured));
});
test("RTC framing reassembles large Unicode snapshots out of order and limits malformed traffic", () => {
  const packet = { type: "state", text: "Tướng ✦ ".repeat(20_000) };
  const chunks = encodePacket(packet, 7);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 12 * 1024 + 16));
  const reader = new PacketReader();
  let result;
  for (const chunk of [...chunks].reverse()) {
    const decoded = reader.accept(chunk.buffer, 0);
    if (decoded) result = decoded;
  }
  assert.deepEqual(result, packet);
  assert.equal(reader.accept(new Uint8Array(10).buffer), null);
  const partial = new PacketReader();
  partial.accept(chunks[0].buffer, 0);
  for (const chunk of chunks.slice(1))
    assert.equal(partial.accept(chunk.buffer, 3000), null);
  for (let i = 0; i < 10; i++)
    partial.accept(encodePacket(packet, i)[0].buffer, 4000);
  assert.ok(partial.pending.size <= 4);
  assert.throws(() => encodePacket({ text: "x".repeat(600_000) }, 1));
});
test("a host on team one owns the same human-only simulation, validates input and restores a checkpoint", () => {
  const host = new HostSimulation(descriptor);
  assert.ok(host.session.match.fighters.every((f) => f.human && !f.brain));
  for (let i = 0; i < 300; i++) {
    const now = (i * 1000) / 60;
    host.input(0, { ...neutralInput(i), x: i % 80 < 40 ? 0.2 : -0.2 }, now);
    host.input(1, neutralInput(i, Math.PI), now);
    host.step(now);
  }
  const saved = JSON.parse(JSON.stringify(host.checkpoint()));
  const restored = new HostSimulation(descriptor, saved);
  assert.deepEqual(restored.snapshot(), host.snapshot());
  assert.equal(
    restored.input(0, { ...neutralInput(300), x: 999 }, 5100),
    false,
  );
  assert.equal(restored.input(0, neutralInput(10), 5100), false);
  restored.resetPeer(0);
  restored.input(0, { ...neutralInput(301), x: 1 }, 5100);
  restored.step(5100);
  restored.step(5500);
  assert.equal(restored.session.inputs[0].x, 0);
  restored.forfeit(0, "left");
  assert.equal(restored.result.winner, 1);
  assert.throws(
    () =>
      new HostSimulation(descriptor, {
        ...saved,
        version: ENGINE_VERSION + "-wrong",
      }),
  );
});
