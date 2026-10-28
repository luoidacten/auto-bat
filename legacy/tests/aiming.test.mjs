import { test } from "node:test";
import assert from "node:assert/strict";
import { ArenaSession, ENGINE_VERSION, ROSTER } from "../engine/runtime.mjs";
import {
  aimTarget,
  validAimTarget,
  targetAtPoint,
  worldToScreen,
  skillGuide,
} from "../client/aiming.mjs";
import { SKILL_GUIDES, GUIDE_VERSION } from "../client/skill-guides.mjs";

test("touch aim ignores dead, falling, invisible and untargetable enemies", () => {
  const own = { team: 0 };
  const target = { id: 2, team: 1, alive: true, has: () => false };
  assert.equal(validAimTarget(own, target), true);
  for (const changes of [
    { team: 0 },
    { alive: false },
    { dead: true },
    { falling: 0.5 },
    { respawnT: 1 },
    { hidden: true },
    { has: () => true },
  ])
    assert.equal(validAimTarget(own, { ...target, ...changes }), false);
});

test("target lock stays on the selected live hero and reacquires after KO", () => {
  const own = { team: 0, alive: true, x: 0, y: 0 };
  const a = { team: 1, alive: true, id: 2, x: 50, y: 0 };
  const b = { team: 1, alive: true, id: 3, x: 100, y: 0 };
  const match = { lead: () => own, fighters: [own, a, b] };
  assert.equal(aimTarget(match, 0), a);
  assert.equal(aimTarget(match, 0, 3), b);
  b.alive = false;
  assert.equal(aimTarget(match, 0, 3), a);
  own.alive = false;
  assert.equal(aimTarget(match, 0), null);
});

test("tap targeting follows the arena projection in landscape and portrait", () => {
  const own = { team: 0, alive: true, x: -100, y: 0 };
  const target = { team: 1, alive: true, id: 2, x: 80, y: -40, r: 18, z: 0 };
  const match = { zoom: 0.45, lead: () => own, fighters: [own, target] };
  for (const [width, height] of [
    [900, 420],
    [390, 844],
  ]) {
    const p = worldToScreen(match, target.x, target.y, width, height);
    assert.equal(
      targetAtPoint({ match, team: 0, width, height }, p.x, p.y),
      target,
    );
    assert.equal(targetAtPoint({ match, team: 0, width, height }, 0, 0), null);
  }
});

test("the 40-hero guide catalog matches engine version and contains bounded finite geometry", () => {
  assert.equal(GUIDE_VERSION, ENGINE_VERSION);
  assert.deepEqual(
    Object.keys(SKILL_GUIDES).sort(),
    ROSTER.map((h) => h.id).sort(),
  );
  for (const hero of ROSTER) {
    const fighter = new ArenaSession({
      mode: "training",
      heroes: [hero.id, "zero"],
    }).match.lead(0);
    for (const key of Object.keys(fighter.weapon.skills)) {
      const guide = skillGuide(fighter, key);
      assert.ok(
        ["line", "cone", "circle", "area", "dash"].includes(guide.shape),
        hero.id + key,
      );
      for (const field of [
        "range",
        ...("width" in guide ? ["width"] : []),
        ...("arc" in guide ? ["arc"] : []),
        ...("radius" in guide ? ["radius"] : []),
      ])
        assert.ok(
          Number.isFinite(guide[field]) &&
            guide[field] > 0 &&
            guide[field] <= 2200,
          hero.id + key + field,
        );
    }
  }
});

test("base melee and line guides use actual effect dimensions instead of the bot's engagement distance", () => {
  assert.deepEqual(SKILL_GUIDES.valerius.A, {
    shape: "cone",
    range: 86,
    arc: 130,
  });
  assert.deepEqual(SKILL_GUIDES.valerius.B, {
    shape: "line",
    range: 150,
    width: 36,
  });
  assert.deepEqual(SKILL_GUIDES.valerius.D, { shape: "circle", range: 104 });
});

test("Luca copied A/B/C use the copied hero's guides", () => {
  const fighter = new ArenaSession({
    mode: "training",
    heroes: ["luca", "zero"],
  }).match.lead(0);
  fighter.form = "luca_copy_valerius";
  fighter.ws.copyId = "valerius";
  assert.equal(skillGuide(fighter, "B"), SKILL_GUIDES.valerius.B);
  assert.equal(skillGuide(fighter, "D"), SKILL_GUIDES.luca.D);
});
