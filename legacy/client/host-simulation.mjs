import {
  ArenaSession,
  ENGINE_VERSION,
  cleanInput,
  neutralInput,
} from "../engine/runtime.mjs";
import { INPUT_TIMEOUT_MS } from "../protocol/version.mjs";

export function benchmarkHost(clock = () => performance.now()) {
  const engine = new ArenaSession({
    mode: "online",
    heroes: ["bachdiep", "tsukiyo"],
    seed: "host-benchmark-v1",
  });
  engine.match.state = "fight";
  engine.match.fighters[0].x = -70;
  engine.match.fighters[1].x = 70;
  const step = (i) => {
    for (const fighter of engine.match.fighters) fighter.rage = 100;
    const key = ["A", "B", "C", "D", "U"][Math.floor(i / 24) % 5];
    engine.step(
      [0, 1].map((team) => ({
        ...neutralInput(i, team ? Math.PI : 0),
        pressed: i % 24 === 0 ? [key] : [],
      })),
    );
  };
  for (let i = 0; i < 128; i++) step(i);
  const samples = [];
  for (let batch = 0; batch < 16; batch++) {
    const begin = clock();
    for (let tick = 0; tick < 32; tick++) step(128 + batch * 32 + tick);
    samples.push(Math.max(0.00001, (clock() - begin) / 32));
  }
  samples.sort((a, b) => a - b);
  return {
    ticks: 512,
    meanMs: samples.reduce((a, b) => a + b, 0) / samples.length,
    p95Ms: samples[15],
  };
}

export class HostSimulation {
  constructor(descriptor, checkpoint = null) {
    this.descriptor = descriptor;
    this.session = new ArenaSession({
      mode: "online",
      heroes: descriptor.heroes,
      arena: descriptor.arena,
      seed: descriptor.seed,
    });
    this.queues = [[], []];
    this.lastReceived = [-1, -1];
    this.lastInputAt = [-Infinity, -Infinity];
    this.log = [];
    this.result = null;
    if (checkpoint) {
      if (
        checkpoint.version !== ENGINE_VERSION ||
        checkpoint.matchId !== descriptor.id ||
        !Array.isArray(checkpoint.log) ||
        checkpoint.log.length > 18_000
      )
        throw new Error("Invalid host checkpoint");
      for (const event of checkpoint.log) {
        if (
          !Array.isArray(event.frames) ||
          event.frames.length !== 2 ||
          !Array.isArray(event.cancelled) ||
          event.cancelled.some((team) => team !== 0 && team !== 1)
        )
          throw new Error("Invalid replay event");
        const frames = event.frames.map((frame) =>
          frame === null ? null : cleanInput(frame),
        );
        if (event.frames.some((frame, team) => frame !== null && !frames[team]))
          throw new Error("Invalid replay input");
        for (const team of event.cancelled) this.session.cancelInput(team);
        this.session.step(frames);
        this.log.push({ frames, cancelled: event.cancelled });
      }
      this.lastReceived = [...this.session.lastSeq];
      if (checkpoint.result) {
        this.session.forfeit(1 - checkpoint.result.winner);
        this.result = checkpoint.result;
      }
    }
  }
  input(team, value, now) {
    if (team !== 0 && team !== 1) return false;
    const frame = cleanInput(value);
    if (
      !frame ||
      frame.seq <= this.lastReceived[team] ||
      this.queues[team].length >= 8 ||
      this.result
    )
      return false;
    this.lastReceived[team] = frame.seq;
    this.lastInputAt[team] = now;
    this.queues[team].push(frame);
    return true;
  }
  resetPeer(team) {
    this.queues[team] = [];
    this.lastInputAt[team] = -Infinity;
    this.lastReceived[team] = this.session.lastSeq[team];
  }
  step(now) {
    if (this.result) return;
    const cancelled = [];
    const frames = [0, 1].map((team) => {
      if (now - this.lastInputAt[team] > INPUT_TIMEOUT_MS) {
        this.queues[team] = [];
        this.session.cancelInput(team);
        cancelled.push(team);
        return null;
      }
      return this.queues[team].shift() || null;
    });
    this.session.step(frames);
    this.log.push({ frames, cancelled });
    if (this.session.match.state === "over")
      this.result = { winner: this.session.match.winner, reason: "match" };
    if (this.log.length >= 18_000 && !this.result) {
      this.session.match.checkEnd(true);
      this.result = { winner: this.session.match.winner, reason: "time-limit" };
    }
  }
  forfeit(team, reason = "left") {
    if (this.result) return;
    this.session.forfeit(team);
    this.result = { winner: 1 - team, reason };
  }
  snapshot() {
    return this.session.snapshot();
  }
  checkpoint() {
    return {
      version: ENGINE_VERSION,
      matchId: this.descriptor.id,
      log: this.log,
      result: this.result,
    };
  }
}
