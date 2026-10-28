import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ArenaSession,
  NEW_HERO_IDS,
  ROSTER,
  WEAPONS,
  neutralInput,
  arenaTeleport,
  lucaSwitch,
} from "../engine/runtime.mjs";
const setup = (id) => {
  const s = new ArenaSession({
    mode: "training",
    heroes: [id, "zero"],
    seed: "mechanic-" + id,
  });
  s.match.state = "fight";
  const [f, t] = s.match.fighters;
  f.x = -100;
  t.x = 100;
  return { s, m: s.match, f, t, seq: 0 };
};
const cast = (a, key) =>
  a.s.step([{ ...neutralInput(++a.seq), pressed: [key] }]);
const advance = (a, n) => {
  for (let i = 0; i < n; i++) a.s.step([{ ...neutralInput(++a.seq) }]);
};

test("Luca switching books does not refill copied ammo or reset ultimate cooldown", () => {
  const a = setup("luca");
  a.f.ws.copyId = "vector";
  a.f.ws.copyUntil = 20;
  lucaSwitch(a.f, "vector");
  a.f.ws.ammo = 2;
  a.f.cd.U = 15;
  cast(a, "D");
  advance(a, 130);
  cast(a, "D");
  assert.equal(a.f.ws.ammo, 2);
  assert.ok(a.f.cd.U > 10);
  assert.equal(a.f.form, "luca_copy_vector");
});

test("Boran caps Băng Cổ and consumes it for a finite shield", () => {
  const a = setup("boran");
  for (let i = 0; i < 20; i++)
    a.m.applyHit(a.f, a.t, { dmg: 1, noKnock: true, tag: "A", quiet: true });
  assert.equal(a.f.ws.ice, 12);
  cast(a, "D");
  assert.equal(a.f.ws.ice, 0);
  assert.equal(a.f.status.shield.p, 14);
});
test("Ariston prayer consumes faith and reduces percent without restoring stock", () => {
  const a = setup("ariston");
  a.f.ws.faith = 50;
  a.f.percent = 50;
  cast(a, "D");
  advance(a, 100);
  assert.equal(a.f.ws.faith, 30);
  assert.equal(a.f.percent, 38);
  assert.equal(a.f.stocks, 2);
});
test("Vector cannot fire an empty magazine and manually reloads", () => {
  const a = setup("vector");
  a.f.ws.ammo = 0;
  cast(a, "A");
  assert.equal(a.m.projs.length, 0);
  cast(a, "D");
  assert.equal(a.f.ws.ammo, 8);
  cast(a, "A");
  assert.equal(a.f.ws.ammo, 7);
});
test("Lyra consumes four tide stacks; support recovery remains bounded", () => {
  const a = setup("lyra");
  for (let i = 0; i < 4; i++)
    a.m.applyHit(a.f, a.t, { dmg: 1, noKnock: true, tag: "A", quiet: true });
  assert.equal(a.f.ws.tide, 4);
  cast(a, "D");
  assert.equal(a.f.ws.tide, 0);
  assert.equal(a.f.status.shield.p, 14);
});
test("Ratok hook recast pulls a living target and can be released", () => {
  const a = setup("ratok");
  cast(a, "A");
  for (let i = 0; i < 60 && !a.f.ws.hook; i++) advance(a, 1);
  assert.equal(a.f.ws.hook.target, a.t);
  const x = a.t.x;
  cast(a, "A");
  advance(a, 10);
  assert.ok(a.t.x < x);
  assert.equal(a.f.ws.hook, null);
  cast(a, "D");
  assert.equal(a.f.ws.hook, null);
});
test("Kip anchor consumes a point and recasts back, never revives a KO", () => {
  const a = setup("kip");
  const x = a.f.x;
  cast(a, "C");
  assert.equal(a.f.ws.void, 2);
  assert.ok(a.f.x > x + 100);
  cast(a, "C");
  assert.ok(Math.abs(a.f.x - x) < 0.01);
  a.f.dead = true;
  assert.equal(arenaTeleport(a.f, a.m, { x: 0, y: 0 }), false);
});
test("Olivia prayer can be interrupted and cannot restore stock", () => {
  const a = setup("olivia");
  a.f.percent = 50;
  cast(a, "D");
  advance(a, 20);
  a.m.applyHit(a.t, a.f, { dmg: 2, noKnock: true, tag: "A", quiet: true });
  const p = a.f.percent;
  advance(a, 100);
  assert.equal(a.f.percent, p);
  assert.equal(a.f.stocks, 2);
});
test("Justus channel is interrupted by stun", () => {
  const a = setup("justus");
  cast(a, "B");
  advance(a, 20);
  assert.ok(a.t.percent > 0);
  a.f.addStatus("stun", 1);
  const p = a.t.percent;
  advance(a, 100);
  assert.equal(a.t.percent, p);
});
test("Mirage swap requires a living marked target and echo count is capped", () => {
  const a = setup("mirage");
  cast(a, "B");
  for (let i = 0; i < 60 && !a.f.ws.knife; i++) advance(a, 1);
  assert.equal(a.f.ws.knife.target, a.t);
  a.t.dead = true;
  const x = a.f.x;
  cast(a, "B");
  assert.equal(a.f.x, x);
  for (let i = 0; i < 8; i++) {
    a.f.cd.D = 0;
    cast(a, "D");
  }
  assert.ok(a.m.minions.length <= 3);
});
test("Dahlia summons do not replace a human controller", () => {
  const a = setup("dahlia");
  for (let i = 0; i < 6; i++) {
    a.f.cd.A = 0;
    cast(a, "A");
  }
  assert.ok(a.m.minions.length <= 3);
  assert.ok(a.m.fighters.every((f) => f.human && !f.brain));
  assert.ok(a.m.minions.every((e) => e.owner === a.f));
});
test("Luca has declared copy forms for all other heroes without copying player identity", async (t) => {
  for (const hero of ROSTER.filter((h) => h.id !== "luca"))
    await t.test(hero.id, () => {
      const a = setup("luca");
      const target = WEAPONS[hero.weapon];
      const form = WEAPONS["luca_copy_" + hero.id];
      assert.equal(form.skills.A, target.skills.A);
      a.t.cfg.charId = hero.id;
      a.t.charId = hero.id;
      a.t.weaponId = hero.weapon;
      a.t.weapon = target;
      a.t.ws = {};
      target.init?.(a.t);
      for (let attempt = 0; attempt < 6 && !a.f.ws.copyId; attempt++) {
        a.f.rage = 100;
        a.f.cd.U = 0;
        cast(a, "U");
        for (let i = 0; i < 60 && !a.f.ws.copyId; i++) advance(a, 1);
      }
      assert.equal(a.f.ws.copyId, hero.id);
      assert.ok(a.f.human && !a.f.brain);
      assert.equal(a.f.stocks, 2);
      for (const key of ["A", "B", "C"]) {
        a.f.action = null;
        a.f.cancelDash();
        a.f.cd[key] = 0;
        cast(a, key);
        advance(a, 50);
      }
      assert.ok([a.f.x, a.f.y, a.f.percent].every(Number.isFinite));
    });
});
test("Caelus rewinds within a life but cannot restore stock across a KO", () => {
  const a = setup("caelus");
  advance(a, 215);
  a.f.x = 80;
  a.f.percent = 70;
  a.f.rage = 100;
  cast(a, "U");
  assert.equal(a.f.x, -100);
  assert.equal(a.f.percent, 0);
  a.f.cd.U = 0;
  a.f.rage = 100;
  a.f.stocks = 1;
  a.f.x = 70;
  a.f.percent = 60;
  a.t.x = 300;
  cast(a, "U");
  assert.equal(a.f.stocks, 1);
  assert.equal(a.f.percent, 60);
  assert.equal(a.f.x, 70);
});
test("Bạch Diệp caps projectiles and exposes three deliberate ultimate stances", () => {
  const a = setup("bachdiep");
  a.f.ws.swords = 30;
  for (let i = 0; i < 40; i++) a.f.weapon.skills.A.use(a.f, a.m);
  assert.ok(a.m.projs.length <= 160);
  cast(a, "D");
  assert.equal(a.f.ws.stance, 1);
  a.f.rage = 100;
  cast(a, "U");
  assert.equal(a.m.rings.length, 1);
});
test("Tsukiyo changes schools without refreshing cooldowns; reflections cannot recurse", () => {
  const a = setup("tsukiyo");
  cast(a, "A");
  const cd = a.f.cd.A;
  cast(a, "D");
  assert.equal(a.f.ws.school, 1);
  assert.ok(a.f.cd.A > 0 && a.f.cd.A <= cd);
  a.f.ws.school = 2;
  cast(a, "C");
  const before = a.m.projs.length;
  a.m.applyHit(a.t, a.f, {
    tag: "A",
    proj: true,
    dmg: 5,
    kb: 100,
    reflected: true,
  });
  assert.equal(a.m.projs.length, before);
});
test("every new hero can act as an offline bot, not an online slot substitute", async (t) => {
  for (const id of NEW_HERO_IDS)
    await t.test(id, () => {
      const s = new ArenaSession({
        heroes: ["valerius", id],
        mode: "offline",
        seed: "bot-" + id,
      });
      s.match.state = "fight";
      s.match.fighters[0].x = -60;
      s.match.fighters[1].x = 60;
      for (let i = 0; i < 1200; i++) {
        s.match.fighters[1].rage = 100;
        s.step();
        if (s.match.state === "over") break;
      }
      const bot = s.match.fighters[1];
      assert.ok(bot.brain);
      assert.ok(Number.isFinite(bot.percent));
      assert.ok(
        bot.stats.dealt > 0 ||
          s.match.projs.length > 0 ||
          s.match.minions.length > 0,
        id + " must actually act",
      );
    });
});
