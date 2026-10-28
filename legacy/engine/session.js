"use strict";
const ENGINE_VERSION = "legacy-online-1";
const FIXED_DT = 1 / 60;
function standardConfig(id) {
  const hero = Object.hasOwn(ROSTER_BY_ID, id) ? ROSTER_BY_ID[id] : null;
  if (!hero) throw new Error("Unknown fighter: " + id);
  return {
    charId: id,
    name: hero.name,
    weapon: hero.weapon,
    color: hero.color,
    level: 1,
    stats: { power: 3, knock: 3, weight: 3, speed: 3, haste: 3, rage: 3 },
    skills: { A: 1, B: 1, C: 1, D: 1, U: 1 },
    tech: { reflex: 4, dodge: 4, tactic: 4, aim: 4 },
    talents: [],
    equip: {},
    spells: [],
  };
}

class ArenaSession {
  constructor({
    heroes = ["valerius", "zero"],
    mode = "offline",
    seed = "legacy",
    arena = "go",
    timeLimit = 150,
    stocks = 2,
  } = {}) {
    if (
      !["offline", "online", "training"].includes(mode) ||
      heroes.length !== 2 ||
      !Object.hasOwn(ARENA_DEFS, arena)
    )
      throw new Error("Invalid match configuration");
    this.mode = mode;
    this.seed = seed;
    this.tick = 0;
    this.lastSeq = [-1, -1];
    this.inputs = [neutralInput(), neutralInput(0, Math.PI)];
    this.rng = seededRandom(seed);
    this.match = withRandom(
      this.rng,
      () =>
        new Match({
          arena,
          stocks,
          timeLimit,
          noHud: true,
          a: {
            cfg: standardConfig(heroes[0]),
            tactic: "balanced",
            controller: "human",
            aiCoach: false,
          },
          b: {
            cfg: standardConfig(heroes[1]),
            tactic: "balanced",
            controller: mode === "offline" ? "bot" : "human",
            aiCoach: false,
          },
        }),
    );
    for (const f of this.match.fighters) f.competitive = true;
    this.match.aiCoach = [false, false];
  }
  step(frames = []) {
    return withRandom(this.rng, () => {
      for (let team = 0; team < 2; team++) {
        const f = this.match.lead(team);
        if (!f || !f.human) continue;
        const next = frames[team] && cleanInput(frames[team]);
        const fresh = !!next && next.seq > this.lastSeq[team];
        if (fresh) {
          this.inputs[team] = next;
          this.lastSeq[team] = next.seq;
        }
        applyHumanInput(f, this.inputs[team], this.match, fresh);
      }
      if (this.match.state !== "over" || !this.match.ended)
        this.match.update(FIXED_DT);
      this.tick++;
      // Audio is an event stream, not a dependency on Audio/DOM.
      if (this.match.audioEvents.length > 32)
        this.match.audioEvents.splice(0, this.match.audioEvents.length - 32);
      return this.match;
    });
  }
  forfeit(team) {
    if (this.match.state === "over") return;
    this.match.winner = 1 - team;
    this.match.state = "over";
    this.match.ended = true;
  }
  cancelInput(team) {
    this.inputs[team] = neutralInput(
      Math.max(0, this.lastSeq[team]),
      this.inputs[team].aim,
    );
    const fighter = this.match.lead(team);
    if (fighter?.human) stopHumanInput(fighter);
  }
  snapshot() {
    return viewSnapshot(this);
  }
}

// This is a render projection. Live simulation callbacks stay on the authoritative host.
// Reconnect sends this projection; it never deserializes client-provided simulation state.
function viewSnapshot(session) {
  const m = session.match,
    entities = [...m.fighters, ...m.minions];
  const entitySet = new Set(entities);
  function encode(value, seen = new Set(), depth = 0) {
    if (value == null || ["string", "boolean"].includes(typeof value))
      return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "function" || depth > 8) return undefined;
    if (entitySet.has(value)) return { $entity: value.id };
    if (value instanceof Set)
      return { $set: [...value].map((v) => encode(v, seen, depth + 1)) };
    if (seen.has(value)) return undefined;
    const nextSeen = new Set(seen);
    nextSeen.add(value);
    if (Array.isArray(value))
      return value.slice(0, 600).map((v) => encode(v, nextSeen, depth + 1));
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === "history") continue;
      const encoded = encode(item, nextSeen, depth + 1);
      if (encoded !== undefined) result[key] = encoded;
    }
    return result;
  }
  const skip = new Set([
    "channelAction",
    "weapon",
    "brain",
    "cfg",
    "side",
    "talFx",
    "timers",
    "holdSince",
  ]);
  const fighters = entities.map((f) => {
    const data = {};
    for (const [key, value] of Object.entries(f))
      if (!skip.has(key)) data[key] = encode(value);
    data.renderWeapon =
      Object.keys(WEAPONS).find((k) => WEAPONS[k] === f.weapon) || f.weaponId;
    return data;
  });
  const view = {};
  for (const key of [
    "time",
    "clock",
    "timeLimit",
    "state",
    "introT",
    "overT",
    "stars",
    "winner",
    "projs",
    "zones",
    "fxs",
    "parts",
    "texts",
    "rings",
    "gears",
    "walls",
    "dangers",
    "hz",
    "dark",
    "ultBanner",
    "shakeAmt",
    "mode",
    "mods",
  ])
    view[key] = encode(m[key]);
  return {
    version: ENGINE_VERSION,
    tick: session.tick,
    lastSeq: [...session.lastSeq],
    seed: session.seed,
    arena: m.opts.arena,
    pillars: encode(m.arena.pillars),
    fighters,
    fighterIds: m.fighters.map((f) => f.id),
    view,
  };
}

function hydrateView(snapshot) {
  if (snapshot.version !== ENGINE_VERSION)
    throw new Error("Content version mismatch");
  const entities = new Map(
    snapshot.fighters.map((data) => [
      data.id,
      Object.create(data.isMinion ? Minion.prototype : Fighter.prototype),
    ]),
  );
  function decode(value) {
    if (value == null || typeof value !== "object") return value;
    if ("$entity" in value) return entities.get(value.$entity) || null;
    if ("$set" in value) return new Set(value.$set.map(decode));
    if (Array.isArray(value)) return value.map(decode);
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, decode(v)]),
    );
  }
  for (const data of snapshot.fighters) {
    const f = entities.get(data.id);
    Object.assign(f, decode(data));
    f.weapon = WEAPONS[data.renderWeapon];
    f.cfg = {};
    f.talFx = [];
  }
  const match = Object.create(Match.prototype);
  Object.assign(match, decode(snapshot.view));
  match.opts = { arena: snapshot.arena, noHud: true };
  match.arena = new Arena(ARENA_DEFS[snapshot.arena]);
  match.arena.pillars = snapshot.pillars;
  match.fighters = snapshot.fighterIds.map((id) => entities.get(id));
  match.minions = [...entities.values()].filter((f) => f.isMinion);
  match.leaders = [
    match.fighters.find((f) => f.team === 0),
    match.fighters.find((f) => f.team === 1),
  ];
  return match;
}
