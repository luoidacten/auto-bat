'use strict';
// ===== Sự nghiệp Huấn Luyện Viên =====
const SAVE_KEY = 'ai_battle_coach_v3';
const LEVEL_MAX = 15;
const ITEM_MAX = 3; // số trang bị mang vào mỗi ván
// Joker: Trộm Vặt (Lv1) +1 ô, Vui Thôi Nào! (Lv6) +1 ô
function itemMax() { const f = Career.d && Career.d.fighter; return ITEM_MAX + (f ? Object.values(f.talents || {}).filter((id) => id === 'joker_1b' || id === 'joker_6a').length : 0); }


const Career = {
  d: null,
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } },
  load() {
    try { const s = localStorage.getItem(SAVE_KEY); if (s) { this.d = JSON.parse(s); this.fix(); return true; } } catch (e) {}
    return false;
  },
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.d)); } catch (e) {} },
  // làm sạch save cũ (chiến thuật riêng đã chuyển thành mệnh lệnh)
  fix() {
    const d = this.d;
    d.tactics = (d.tactics || []).filter((k) => TACTICS[k]);
    if (typeof d.fighter.trust !== 'number') d.fighter.trust = mindBase(d.fighter.charId)[0];
    d.fighter.broken = (d.fighter.broken || []).filter((id) => ITEM_BY_ID[id]);
    d.spells = (d.spells || ['flash']).filter((id) => SPELLS[id]); if (!d.spells.length) d.spells = ['flash'];
    // trang bị kiểu cũ (4 ô × 4 bậc) → hoàn tiền; trang bị mới: mua nhiều, mang 3
    const f = d.fighter, OLD = { w1: 120, w2: 360, w3: 900, w4: 2200, a1: 100, a2: 330, a3: 850, a4: 2100, b1: 90, b2: 300, b3: 800, b4: 2000, c1: 110, c2: 340, c3: 900, c4: 2300 };
    f.owned = (f.owned || []).filter((id) => { if (OLD[id]) { d.gold += OLD[id]; return false; } return !!ITEM_BY_ID[id]; });
    f.equip = (Array.isArray(f.equip) ? f.equip : Object.values(f.equip || {})).filter((id) => f.owned.includes(id) && !f.broken.includes(id)).slice(0, itemMax());
    d.loadout = (d.loadout || []).filter((k) => TACTICS[k] && this.isUnlocked(k));
    if (!d.loadout.length) d.loadout = GENERAL_TACTICS.filter((k) => this.isUnlocked(k)).slice(0, LOADOUT_MAX);
    d.tactics = d.tactics.filter((k) => this.isUnlocked(k)); this.checkTacticUnlocks();
    if (!TACTICS[d.tactic]) d.tactic = d.loadout[0];
    const pool = commandPool(d.fighter.charId, f.equip);
    d.cmds = (d.cmds || []).filter((k) => pool.includes(k)).slice(0, CMD_MAX);
    if (!d.cmds.length) d.cmds = defaultCommands(d.fighter.charId);
  },
  wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} this.d = null; },
  newGame(coach, charId) {
    const ch = ROSTER_BY_ID[charId];
    this.d = {
      coach, gold: 150, tp: 6,
      fighter: {
        charId, name: ch.name, weapon: ch.weapon, color: ch.color,
        stats: { power: 1, knock: 1, weight: 1, speed: 1, haste: 1, rage: 1 },
        skills: { A: 1, B: 1, C: 1, D: 1, U: 1 },
        tech: { reflex: 1, dodge: 1, tactic: 1, aim: 1 },
        equip: [], owned: [], broken: [], trust: mindBase(charId)[0],
        level: 1, talents: {}, pendingTier: 1,
      },
      loadout: [], tactic: null, cmds: defaultCommands(charId), spells: ['flash'],
      record: { w: 0, l: 0, gw: 0, gl: 0, kos: 0 },
      trophies: [], best: {}, unlocked: 1, tour: null, history: [], sparLeft: 2,
      runOver: false, runWon: false, tactics: [],
    };
    // bộ chiến thuật mang theo: tối đa 5 cái đã mở khóa
    this.d.loadout = tacticPool(charId).filter((k) => this.isUnlocked(k)).slice(0, LOADOUT_MAX);
    this.d.tactic = this.d.loadout[0];
    this.save();
  },
  get f() { return this.d.fighter; },
  // Tín Nhiệm: thắng +4, thua -6 (0–100)
  addTrust(n) { const f = this.f; const b = f.trust; f.trust = clamp(Math.round(b + n), 0, 100); return f.trust - b; },
  cfg() {
    const f = this.f;
    return { charId: f.charId, name: f.name, weapon: f.weapon, color: f.color, stats: { ...f.stats }, skills: { ...f.skills }, tech: { ...f.tech }, equip: f.equip.slice(), trust: f.trust, spells: (this.d.spells || ['flash']).slice(0, spellSlots({ equip: f.equip })),
      level: f.level, talents: Object.values(f.talents) };
  },
  // ---- cấp độ & nội tại ----
  nextTier() { const f = this.f; return TALENT_TIERS.find((tr) => tr <= f.level && !f.talents[tr]) || null; },
  pickTalent(tier, id) {
    const f = this.f, T = TALENT_BY_ID[id];
    if (!T || T.tier !== tier || f.talents[tier] || tier > f.level || !id.startsWith(f.charId + '_')) return false;
    f.talents[tier] = id; f.pendingTier = this.nextTier();
    // Trộm Vặt: nhận ngay 1 trang bị ngẫu nhiên
    if (id === 'joker_1b') { const pool = ITEMS.filter((e) => !f.owned.includes(e.id) && this.tierOpen(e.tier)); if (pool.length) { const it = pick(pool); f.owned.push(it.id); if (f.equip.length < itemMax()) f.equip.push(it.id); this.gotItem = it; } }
    this.save(); return true;
  },
  levelUp(n = 1) {
    const f = this.f, before = f.level;
    f.level = Math.min(LEVEL_MAX, f.level + n);
    const gained = f.level - before;
    if (gained > 0) this.d.tp += 2 * gained;
    f.pendingTier = this.nextTier();
    this.save();
    return gained;
  },
  // ---- chiến thuật ----
  // mệnh lệnh mang theo vào trận (tối đa 3, đổi được giữa các ván)
  toggleCmd(id) {
    const d = this.d, L = d.cmds;
    if (!commandPool(this.f.charId, this.f.equip).includes(id)) return 'bad';
    if (L.includes(id)) { if (L.length <= 1) return 'min'; d.cmds = L.filter((k) => k !== id); }
    else { if (L.length >= CMD_MAX) return 'full'; L.push(id); }
    this.save(); return 'ok';
  },
  toggleLoadout(tac) {
    const d = this.d, L = d.loadout;
    if (!this.isUnlocked(tac)) return 'locked';
    if (L.includes(tac)) { if (L.length <= 1) return 'min'; d.loadout = L.filter((k) => k !== tac); if (d.tactic === tac) d.tactic = d.loadout[0]; }
    else { if (L.length >= LOADOUT_MAX) return 'full'; L.push(tac); }
    this.save(); return 'ok';
  },
  // chiến thuật nâng cao: tự mở khóa khi chỉ số Tư duy (kỹ thuật Chiến thuật) đạt yêu cầu
  isUnlocked(tac) { const T = TACTICS[tac]; return !!T && (!T.need || (!!this.d && this.f.tech.tactic >= T.need)); },
  // mở mới sau khi nâng Tư duy: tự thêm vào hành trang nếu còn chỗ
  checkTacticUnlocks() {
    const d = this.d, fresh = [];
    for (const k of GENERAL_TACTICS) if (this.isUnlocked(k) && !(d.tactics || []).includes(k) && TACTICS[k].need) {
      (d.tactics = d.tactics || []).push(k); fresh.push(k);
      if (d.loadout.length < LOADOUT_MAX && !d.loadout.includes(k)) d.loadout.push(k);
    }
    return fresh;
  },
  // ---- kết thúc hành trình ----
  endRun(won) {
    const d = this.d; if (d.runOver) return;
    d.runOver = true; d.runWon = !!won;
    this.save();
  },
  // ---- giá nâng cấp (Điểm Huấn Luyện) ----
  costStat(lv) { return lv; },
  costSkill(lv) { return lv + 1; },
  costTech(lv) { return lv * 2; },
  upgrade(kind, key) {
    const f = this.f;
    const tbl = kind === 'stat' ? f.stats : kind === 'skill' ? f.skills : f.tech;
    const max = kind === 'stat' ? 20 : 10;
    const lv = tbl[key];
    if (lv >= max) return false;
    const c = kind === 'stat' ? this.costStat(lv) : kind === 'skill' ? this.costSkill(lv) : this.costTech(lv);
    if (this.d.tp < c) return false;
    this.d.tp -= c; tbl[key]++;
    this.newTactics = kind === 'tech' && key === 'tactic' ? this.checkTacticUnlocks() : [];
    this.save();
    return true;
  },
  buy(id) {
    const it = ITEM_BY_ID[id], f = this.f;
    if (!it || f.owned.includes(id) || this.d.gold < it.price || !this.tierOpen(it.tier)) return false;
    this.d.gold -= it.price; f.owned.push(id);
    if (f.equip.length < itemMax()) f.equip.push(id);
    this.pruneCmds(); this.save(); return true;
  },
  // phép bổ trợ mang theo (1 ô, có Bùa Song Phép thì 2): chọn phép mới khi đã đủ ô sẽ thay phép cũ nhất
  toggleSpell(id) {
    const d = this.d, n = spellSlots({ equip: this.f.equip });
    let L = (d.spells || []).slice(0, n);
    if (!SPELLS[id]) return 'bad';
    if (L.includes(id)) { if (L.length <= 1) return 'min'; L = L.filter((k) => k !== id); } else { if (L.length >= n) L.shift(); L.push(id); }
    d.spells = L; this.save(); return 'ok';
  },
  hasTal(id) { return Object.values(this.f.talents || {}).includes(id); },
  // mang theo / cất trang bị (tối đa 3 món mỗi ván)
  equip(id) {
    const f = this.f;
    if (!ITEM_BY_ID[id] || !f.owned.includes(id)) return 'bad';
    if ((f.broken || []).includes(id) && !f.equip.includes(id)) return 'broken';
    if (f.equip.includes(id)) f.equip = f.equip.filter((k) => k !== id);
    else { if (f.equip.length >= itemMax()) return 'full'; f.equip.push(id); }
    this.pruneCmds(); this.save(); return 'ok';
  },
  // trang bị dễ vỡ (Thủy Tinh Sinh Mệnh): vỡ trong trận → hỏng, phải sửa mới mang lại được
  breakItem(id) {
    const f = this.f;
    if (!f.owned.includes(id)) return;
    f.broken = f.broken || [];
    if (!f.broken.includes(id)) f.broken.push(id);
    f.equip = f.equip.filter((k) => k !== id);
    this.pruneCmds(); this.save();
  },
  repairCost(id) { const it = ITEM_BY_ID[id]; return it.repair || Math.round(it.price * 0.4); },
  repair(id) {
    const f = this.f, c = this.repairCost(id);
    if (!(f.broken || []).includes(id) || this.d.gold < c) return false;
    this.d.gold -= c; f.broken = f.broken.filter((k) => k !== id);
    if (f.equip.length < itemMax()) f.equip.push(id);
    this.pruneCmds(); this.save(); return true;
  },
  tierOpen(tier) { return (this.d.unlocked || 1) >= EQUIP_UNLOCK[tier]; },
  // bỏ các lệnh trang bị không còn mang theo
  pruneCmds() {
    const d = this.d, pool = commandPool(d.fighter.charId, d.fighter.equip);
    d.cmds = (d.cmds || []).filter((k) => pool.includes(k));
    if (!d.cmds.length) d.cmds = defaultCommands(d.fighter.charId);
  },
};

// Lực chiến của một cấu hình đấu sĩ
function ratingOf(cfg) {
  let r = 0;
  for (const v of Object.values(cfg.stats)) r += (v - 1) * 1;
  for (const v of Object.values(cfg.skills)) r += (v - 1) * 1.4;
  for (const v of Object.values(cfg.tech)) r += (v - 1) * 2.2;
  for (const id of Object.values(cfg.equip || {})) { const it = ITEM_BY_ID[id]; if (it) r += it.tier * 5; }
  r += (cfg.talents || []).length * 3 + ((cfg.level || 1) - 1) * 0.6;
  if (cfg.charId) r += ((cfg.trust ?? mindBase(cfg.charId)[0]) - 50) * 0.05 + (mindBase(cfg.charId)[1] - 5) * 0.8;
  return Math.round(100 + r * 3);
}

// Sinh đối thủ AI theo cấp độ (theo nhân vật trong ROSTER)
function genOpponent(level, opts = {}) {
  const L = Math.max(0, level);
  const st = (k) => clamp(Math.round(1 + L * rand(0.55, 1.0) * k), 1, 20);
  const sk = () => clamp(Math.round(1 + L * 0.42 * rand(0.6, 1.15)), 1, 10);
  const te = () => clamp(Math.round(1 + L * 0.48 * rand(0.65, 1.1)), 1, 10);
  const ch = opts.charId ? ROSTER_BY_ID[opts.charId] : opts.weapon ? CHAR_BY_WEAPON[opts.weapon] : pick(ROSTER);
  const cfg = {
    charId: ch.id, name: opts.name || ch.name, weapon: ch.weapon, color: opts.color || ch.color,
    stats: { power: st(1), knock: st(1), weight: st(1), speed: st(0.8), haste: st(0.8), rage: st(0.8) },
    skills: { A: sk(), B: sk(), C: sk(), D: sk(), U: sk() },
    tech: { reflex: te(), dodge: te(), tactic: te(), aim: te() },
    equip: {},
  };
  cfg.level = clamp(1 + Math.floor(L * 0.75 + rand(0, 0.8)), 1, LEVEL_MAX);
  cfg.talents = randomTalents(ch.id, cfg.level);
  cfg.equip = randomItems(L);
  cfg.trust = clamp(Math.round(mindBase(ch.id)[0] + L * 2.5 + rand(-8, 8)), 0, 100);
  return cfg;
}

// ===== Giải đấu (nhánh loại trực tiếp) =====
const Tour = {
  get t() { return Career.d.tour; },
  def(id) { return TOURNAMENTS.find((x) => x.id === id); },
  // mỗi vòng đấu một sàn (chung kết luôn ở sàn đặc trưng của giải)
  arenaAt(id, round) { const T = this.def(id), L = T.arenas || [T.arena]; return L[Math.min(round, L.length - 1)]; },
  curArena() { const t = this.t; return this.arenaAt(t.id, t.round); },
  start(id) {
    const T = this.def(id);
    const loops = Career.d.best[id] ? Math.min(3, (Career.d.best[id].wins || 0)) : 0; // giải đã vô địch sẽ khó hơn
    const base = (T.tier - 1) * 2.6 + loops * 1.2;
    const me = { me: true, name: Career.f.name, weapon: Career.f.weapon, color: Career.f.color, charId: Career.f.charId };
    const pool = shuffle(ROSTER.filter((c) => c.id !== Career.f.charId)).slice(0, T.size - 1);
    const others = pool.map((c, i) => {
      const lv = base + rand(0, 1.6) + (i < 2 ? 1 : 0);
      const cfg = genOpponent(lv, { charId: c.id });
      return { name: cfg.name, weapon: cfg.weapon, color: cfg.color, charId: c.id, cfg, lv };
    });
    // trùm cuối của Đại Hội Võ Thần: cao thủ mạnh nhất được phong Võ Thần
    if (T.id === 't6') {
      const b = others.reduce((x, y) => (y.lv > x.lv ? y : x));
      b.lv += 4.5; b.cfg = genOpponent(b.lv, { charId: b.charId, name: `${ROSTER_BY_ID[b.charId].name} 👑` }); b.name = b.cfg.name; b.boss = true;
    }
    others.sort((a, b) => a.lv - b.lv);
    const size = T.size, slots = new Array(size).fill(null);
    slots[0] = me;
    const pos = []; for (let i = 1; i < size; i++) pos.push(i);
    pos.sort((a, b) => bracketDistance(0, a) - bracketDistance(0, b) || Math.random() - 0.5);
    others.forEach((p, i) => (slots[pos[i]] = p));
    slots.forEach((p) => (p.rating = p.me ? ratingOf(Career.cfg()) : ratingOf(p.cfg)));
    const first = [];
    for (let i = 0; i < size; i += 2) first.push({ a: i, b: i + 1, w: null });
    // thể thức đội: mỗi đối thủ ra sân cùng 2 đồng đội cùng cấp
    const fmt = tourFormat(id);
    if (FORMATS[fmt].team) for (const p of slots) if (!p.me) p.team = oppTeam(p.cfg, p.lv);
    Career.d.tour = { id, players: slots, rounds: [first], round: 0, done: false, result: null, earned: { gold: 0, tp: 0 }, ariaSlayer: null };
    Career.d.tour.fmt = fmt;
    Career.save();
  },
  myMatch() {
    const t = this.t; if (!t || t.done) return null;
    return t.rounds[t.round].find((m) => m.w === null && (t.players[m.a].me || t.players[m.b].me));
  },
  opponent() {
    const m = this.myMatch(); if (!m) return null;
    const t = this.t;
    return t.players[m.a].me ? t.players[m.b] : t.players[m.a];
  },
  opponentIdx() { const m = this.myMatch(), t = this.t; return t.players[m.a].me ? m.b : m.a; },
  meIdx() { return 0; },
  // Koda hóa điên khi gặp kẻ đã hạ Aria trong giải này
  berserkFlags() {
    const t = this.t, oi = this.opponentIdx(), op = t.players[oi];
    return { me: Career.f.charId === 'koda' && t.ariaSlayer === oi, opp: op.charId === 'koda' && t.ariaSlayer === 'me' };
  },
  roundName(r, size) {
    const n = Math.log2(size) - r;
    return n === 1 ? 'Chung kết' : n === 2 ? 'Bán kết' : n === 3 ? 'Tứ kết' : 'Vòng 1/8';
  },
  noteResult(t, wi, li) {
    const L = t.players[li];
    if (L.charId === 'aria') t.ariaSlayer = t.players[wi].me ? 'me' : wi;
  },
  // ghi kết quả trận của người chơi (won: true/false; draw: trận hòa gia đình → bốc thăm) và mô phỏng các trận khác
  report(won, draw = false) {
    const t = this.t, T = this.def(t.id), m = this.myMatch();
    const meIdx = t.players[m.a].me ? m.a : m.b, opIdx = meIdx === m.a ? m.b : m.a;
    m.w = won ? meIdx : opIdx;
    if (draw) m.draw = true;
    this.noteResult(t, m.w, m.w === meIdx ? opIdx : meIdx);
    for (const o of t.rounds[t.round]) if (o.w === null) {
      const pa = t.players[o.a], pb = t.players[o.b];
      if (isFamilyPair(pa.weapon, pb.weapon)) { o.w = Math.random() < 0.5 ? o.a : o.b; o.draw = true; }
      else {
        const p = 1 / (1 + Math.exp(-(pa.rating - pb.rating) / 18));
        o.w = Math.random() < p ? o.a : o.b;
      }
      this.noteResult(t, o.w, o.w === o.a ? o.b : o.a);
    }
    const rew = { gold: 0, tp: 0, champion: false, draw, levels: 0 };
    if (draw) { rew.gold = 15 + 14 * T.tier; rew.tp = 1; }
    else if (won) { rew.gold = 30 + 28 * T.tier + 12 * t.round; rew.tp = 1 + T.tier; }
    else { rew.gold = 12 * T.tier; rew.tp = 1; }
    if (won) Career.d.record.w++; else if (!draw) Career.d.record.l++;
    if (!draw) rew.trust = Career.addTrust(trustDelta(Career.f.charId, won));
    // mỗi trận thắng (kể cả thắng bốc thăm) lên 1 cấp
    if (won) rew.levels = Career.levelUp(1);
    const lastRound = t.rounds[t.round].length === 1;
    if (!won) { t.done = true; t.result = { place: this.roundName(t.round, T.size) }; rew.runOver = true; }
    else if (lastRound) {
      t.done = true; rew.champion = true;
      rew.gold += 150 * T.tier; rew.tp += 3 * T.tier;
      t.result = { place: 'VÔ ĐỊCH' };
      Career.d.sparLeft = 2;
      if (T.id === 't6') rew.runWon = true;
      Career.d.trophies.push({ id: T.id, name: T.name, date: Date.now() });
      const b = Career.d.best[T.id] || { wins: 0 };
      b.wins = (b.wins || 0) + 1; Career.d.best[T.id] = b;
      const idx = TOURNAMENTS.findIndex((x) => x.id === T.id);
      Career.d.unlocked = Math.max(Career.d.unlocked, Math.min(TOURNAMENTS.length, idx + 2));
    } else {
      const prev = t.rounds[t.round], next = [];
      for (let i = 0; i < prev.length; i += 2) next.push({ a: prev[i].w, b: prev[i + 1].w, w: null });
      t.rounds.push(next); t.round++;
    }
    if (Career.f.equip.includes('it_magnet')) rew.gold = Math.round(rew.gold * 1.15);
    // Nhà Cái (Joker): +35% vàng khi thắng (+60% với Nhà Cái Kiếm Tiền)
    if (won && Career.f.charId === 'joker') rew.gold = Math.round(rew.gold * (Career.hasTal('joker_1c') ? 1.6 : 1.35));
    Career.d.gold += rew.gold; Career.d.tp += rew.tp;
    t.earned.gold += rew.gold; t.earned.tp += rew.tp;
    if (t.done) {
      const best = Career.d.best[T.id] || {};
      Career.d.history.unshift({ name: T.name, place: t.result.place, date: Date.now() });
      if (Career.d.formats) delete Career.d.formats[T.id]; // lần sau bốc thể thức mới
      Career.d.history = Career.d.history.slice(0, 20);
      Career.d.best[T.id] = Object.assign(best, { place: best.place === 'VÔ ĐỊCH' ? best.place : t.result.place });
    }
    Career.save();
    // thua giải = hết hành trình • vô địch Đại Hội Võ Thần = chinh phục hành trình
    if (rew.runOver || rew.runWon) Career.endRun(rew.runWon);
    return rew;
  },
  leave() { Career.d.tour = null; Career.save(); },
};
function bracketDistance(a, b) { let d = 0; while (a !== b) { a >>= 1; b >>= 1; d++; } return d; }
