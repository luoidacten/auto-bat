import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ArenaSession,
  ROSTER,
  cleanInput,
  neutralInput,
  hydrateView,
  standardConfig,
} from "../engine/runtime.mjs";
import { LocalSession } from "../offline/session.mjs";

const frame = (seq, extra = {}) => ({ ...neutralInput(seq), ...extra });
const fight = (options) => {
  const session = new ArenaSession({ mode: "training", ...options });
  session.match.state = "fight";
  return session;
};

test("headless human fighters never acquire a Brain or attack without input", () => {
  const s = fight();
  for (let i = 0; i < 240; i++) s.step();
  assert.ok(s.match.fighters.every((f) => !f.brain && f.human));
  assert.ok(
    s.match.fighters.every((f) => f.percent === 0 && f.stats.dealt === 0),
  );
  const opponentX = s.match.fighters[1].x;
  const x = s.match.fighters[0].x;
  for (let i = 0; i < 30; i++) s.step([frame(i, { x: 1 })]);
  assert.ok(s.match.fighters[0].x > x + 70);
  assert.equal(s.match.fighters[1].x, opponentX);
});

test("human aim, hits, cooldowns, input sequence and rage use engine validation", () => {
  const s = fight({ heroes: ["zero", "valerius"] });
  const [a, b] = s.match.fighters;
  a.x = -90;
  b.x = 90;
  s.step([frame(1, { pressed: ["A"], aim: 0 })]);
  const cooldown = a.cd.A;
  assert.ok(cooldown > 0);
  s.step([frame(1, { pressed: ["U"], aim: 0 })]);
  assert.equal(s.lastSeq[0], 1);
  for (let i = 0; i < 60; i++) s.step([frame(i + 2)]);
  assert.ok(b.percent > 0, "manually fired bullet hits the opponent");
  assert.equal(a.rageNeed, 100);
  assert.equal(a.cd.U, 0, "an uncharged ultimate was not cast");
  assert.equal(cleanInput(frame(1, { x: Infinity })), null);
  assert.equal(cleanInput(frame(1, { pressed: ["WIN"] })), null);
  assert.equal(cleanInput(frame(1, { seq: -1 })), null);
  assert.throws(() => standardConfig("__proto__"));
});

test("seeded sessions remain deterministic when interleaved with other matches", () => {
  const a = new ArenaSession({ seed: "same" }),
    b = new ArenaSession({ seed: "same" }),
    noise = new ArenaSession({ seed: "different" });
  for (let i = 0; i < 500; i++) {
    const input = frame(i, {
      x: i % 120 < 60 ? 0.25 : -0.25,
      pressed: i % 40 === 0 ? ["A"] : [],
    });
    a.step([input]);
    for (let n = 0; n < 3; n++) noise.step();
    b.step([input]);
  }
  assert.deepEqual(a.snapshot(), b.snapshot());
});

test("offline bot is active and replay restores exactly the authoritative state", async () => {
  const local = new LocalSession({
    heroes: ["valerius", "zero"],
    arena: "go",
    seed: "offline-test",
  });
  for (let i = 0; i < 400; i++)
    local.step(frame(i, { pressed: i % 60 === 0 ? ["A"] : [] }));
  assert.equal(local.engine.match.fighters[0].brain, undefined);
  assert.ok(local.engine.match.fighters[1].brain);
  assert.ok(local.engine.match.fighters[1].stats.dealt > 0);
  const restored = await LocalSession.restore(local.serialize());
  assert.deepEqual(restored.engine.snapshot(), local.engine.snapshot());
  await assert.rejects(
    LocalSession.restore(JSON.stringify({ schemaVersion: 100 })),
  );
});

test("ring-out removes stock, respawns, then produces a single final winner", () => {
  const s = fight();
  const f = s.match.fighters[0];
  s.match.startFall(f);
  for (let i = 0; i < 150; i++) s.step();
  assert.equal(f.stocks, 1);
  for (let i = 0; i < 150; i++) s.step();
  assert.ok(f.alive);
  s.match.startFall(f);
  for (let i = 0; i < 150; i++) s.step();
  assert.equal(f.stocks, 0);
  assert.equal(s.match.winner, 1);
  assert.equal(s.match.state, "over");
});

test("human hold/release scales Elara charge using server tick time", () => {
  function arrow(ticks) {
    const s = fight({ heroes: ["elara", "zero"] });
    s.step([frame(0, { pressed: ["B"], held: ["B"] })]);
    for (let i = 1; i <= ticks; i++) s.step([frame(i, { held: ["B"] })]);
    assert.equal(s.match.projs.length, 0);
    s.step([frame(ticks + 1, { released: ["B"] })]);
    return s.match.projs[0].hit.dmg;
  }
  assert.ok(arrow(60) > arrow(6));
});

test("cancelling or timing out held input stops charge and guard without firing", () => {
  const archer = fight({ heroes: ["elara", "zero"] });
  archer.step([frame(0, { pressed: ["B"], held: ["B"] })]);
  for (let i = 1; i < 20; i++) archer.step([frame(i, { held: ["B"] })]);
  archer.step([frame(20, { cancelled: true })]);
  archer.step([frame(21, { released: ["B"] })]);
  assert.equal(archer.match.projs.length, 0);
  assert.equal(archer.match.fighters[0].charging, null);
  const guard = fight({ heroes: ["gideon", "zero"] });
  guard.step([frame(0, { pressed: ["C"], held: ["C"] })]);
  guard.cancelInput(0);
  guard.step();
  assert.ok(!guard.match.fighters[0].has("stance"));
});

test("releasing a rejected guard does not cancel a different action", () => {
  const s = fight({ heroes: ["gideon", "zero"] }),
    f = s.match.fighters[0];
  f.cd.C = 10;
  f.act(1, { move: 0 });
  const action = f.action;
  s.step([frame(0, { pressed: ["C"], held: ["C"] })]);
  s.step([frame(1, { released: ["C"] })]);
  assert.equal(f.action, action);
  assert.ok(f.action.t < 0.1);
});

test("human holding Roxie A builds a turret and releasing a guard ends it", () => {
  const s = fight({ heroes: ["roxie", "zero"] });
  const f = s.match.fighters[0];
  f.ws.gears = 2;
  s.step([frame(0, { pressed: ["A"], held: ["A"] })]);
  for (let i = 1; i <= 25; i++) s.step([frame(i, { held: ["A"] })]);
  assert.equal(s.match.minions.length, 0);
  s.step([frame(26, { released: ["A"] })]);
  assert.ok(s.match.minions.some((m) => m.kind === "cannon"));
  assert.equal(f.ws.gears, 0);
  const guard = fight({ heroes: ["gideon", "zero"] });
  guard.step([frame(0, { pressed: ["C"], held: ["C"] })]);
  assert.ok(guard.match.fighters[0].has("stance"));
  guard.step([frame(1, { released: ["C"] })]);
  assert.ok(!guard.match.fighters[0].has("stance"));
});

test("every registered hero has executable direct-control skills and render projections", async (t) => {
  for (const hero of ROSTER)
    await t.test(hero.id, () => {
      const s = fight({ heroes: [hero.id, "zero"], seed: "roster-" + hero.id });
      const [f, target] = s.match.fighters;
      f.x = -65;
      target.x = 65;
      assert.ok(
        (hero.id === "roxie"
          ? ["A", "B", "C", "D"]
          : ["A", "B", "C", "D", "U"]
        ).every((k) => f.weapon.skills[k]?.name),
      );
      for (let i = 0; i < 900; i++) {
        f.rage = 100;
        s.step([
          frame(i, {
            aim: 0,
            pressed:
              i % 30 === 0
                ? [["A", "B", "C", "D", "U"][Math.floor(i / 30) % 5]]
                : [],
          }),
        ]);
        assert.ok(
          [f.x, f.y, f.percent, target.x, target.y, target.percent].every(
            Number.isFinite,
          ),
        );
        if (s.match.state === "over") break;
      }
      const snapshot = JSON.parse(JSON.stringify(s.snapshot()));
      const view = hydrateView(snapshot);
      assert.equal(view.fighters[0].charId, hero.id);
      assert.ok(!f.brain);
    });
});
