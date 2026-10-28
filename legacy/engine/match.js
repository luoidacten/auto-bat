'use strict';
// ===== Một ván đấu (1 game trong loạt Bo3) =====
// opts: { arena, a:{cfg, tactic, berserk}, b:{...}, stocks, timeLimit, header, onEnd(result) }
class Match {
  constructor(opts) {
    this.opts = opts;
    this.nextEntityId = 0; this.audioEvents = [];
    this.arena = new Arena(ARENA_DEFS[opts.arena] || ARENA_DEFS.go);
    this.fighters = []; this.minions = [];
    this.projs = []; this.zones = []; this.fxs = []; this.parts = []; this.texts = []; this.timers = [];
    this.rings = []; this.gears = []; this.gearT = 1.5; this.walls = [];
    // biến đổi sân đấu (cả hai HLV chọn)
    this.kbK = 1; this.dmgK = 1; this.rageK = 1; this.cdK = 1; this.spdK = 1; this.weightK = 1; this.sizeK = 1;
    this.ledge = LEDGE; this.aimRange = Infinity; this.crit = 0; this.reloadK = 1; this.regen = 0; this.hazK = 1; this.startPct = 0; this.magnet = 0;
    this.mods = (opts.mods || []).filter((id) => ARENA_MODS[id]);
    for (const id of this.mods) ARENA_MODS[id].apply(this);
    // đội hình: opts.teams = [[side...], [side...]] (3v3) hoặc opts.a / opts.b (1v1)
    // mode: 'solo' (1v1) • 'brawl' (Hỗn Chiến: cả đội lên sàn) • 'gauntlet' (Xa Luân Chiến: từng người một)
    const T = opts.teams || [[opts.a], [opts.b]];
    this.mode = opts.mode || (T[0].length > 1 ? 'brawl' : 'solo');
    this.teamSize = [T[0].length, T[1].length];
    this.queue = [[], []]; this.leaders = [null, null];
    // phép bổ trợ: ai chưa chọn thì HLV máy chọn theo đối thủ đầu đội bên kia
    T.forEach((side, i) => side.forEach((s) => { if (s.cfg.spells == null) s.cfg.spells = coachPickSpells(s.cfg, T[1 - i][0].cfg, spellSlots(s.cfg)); }));
    const lead = T.map((side, i) => (opts.leaders ? opts.leaders[i] : 0) || 0);
    T.forEach((side, i) => side.forEach((s, j) => {
      if (this.mode === 'gauntlet' && j > 0) { this.queue[i].push(s); return; }
      const f = this.spawnSide(s, i, j, this.mode === 'brawl' ? side.length : 1);
      if (j === (this.mode === 'brawl' ? lead[i] : 0)) this.leaders[i] = f;
    }));
    // mệnh lệnh mang theo của 2 phía (lệnh của Leader); HLV máy tự ra lệnh
    const ls = T.map((side, i) => side[this.mode === 'brawl' ? lead[i] : 0]);
    this.cmds = [ls[0].commands || ['attack', 'retreat', 'ult'], ls[1].commands || aiCommands(ls[1].cfg.charId)];
    for (let i = 0; i < 2; i++) {
      for (const id of this.leaders[i].spells || []) this.cmds[i] = this.cmds[i].concat('sp_' + id);
      if (this.mode === 'brawl') this.cmds[i] = this.cmds[i].concat(TEAM_CMDS.brawl);
      if (this.mode === 'gauntlet') this.cmds[i] = this.cmds[i].concat(TEAM_CMDS.gauntlet);
    }
    this.cmdCd = [{}, {}];
    this.aiCoach = [!!ls[0].aiCoach, ls[1].aiCoach !== false];
    this.coachT = [rand(2, 4), rand(2, 4)];
    this.time = 0; this.clock = 0; this.shakeAmt = 0;
    this.state = 'intro'; this.introT = 2.2; this.overT = 0;
    this.timeLimit = opts.timeLimit || 150;
    this.log = [];
    this.stars = Array.from({ length: IS_MOBILE ? 35 : 90 }, () => ({ x: rand(-1, 1), y: rand(-1, 1), s: rand(0.5, 2), p: rand(0, TAU) }));
    this.platformCache = null;
    this.hasHand = this.fighters.some((f) => f.weaponId === 'hand');
    // đặc trưng sàn
    this.dangers = []; this.hz = {}; this.rune = null;
    this.haz = HAZARDS[this.arena.hazard] || null;
    if (this.haz && this.haz.init) this.haz.init(this);
  }
  place(f) {
    const dx = Math.min(this.arena.hx * 0.45, 220);
    f.x = f.team === 0 ? -dx : dx; f.y = 0;
    f.facing = f.team === 0 ? 0 : Math.PI;
  }
  // đưa 1 đấu sĩ lên sàn (slot/n: vị trí trong đội để dàn hàng)
  spawnSide(side, team, slot = 0, n = 1) {
    const f = new Fighter(side.cfg, team);
    f.id = ++this.nextEntityId;
    f.human = side.controller === 'human';
    const mb = MODE_BALANCE[this.mode] && MODE_BALANCE[this.mode][side.cfg.charId];
    if (mb) { f.dmgMult *= mb.dmg || 1; f.kbMult *= mb.kb || 1; f.weightFactor *= mb.w || 1; }
    f.stocks = this.opts.stocks || 2;
    // Thủy Tinh Sinh Mệnh: +1 mạng, vỡ ở lần rơi đài đầu tiên
    if (f.T('it_lifecrystal')) { f.stocks++; f.crystal = true; }
    f.maxStocks = f.stocks; f.slot = slot; f.side = side;
    f.cdG = this.cdK; f.spdG = this.spdK; f.wG = this.weightK; f.rlG = this.reloadK;
    if (this.sizeK !== 1) { f.sizeK = this.sizeK; f.r *= this.sizeK; }
    if (!f.human) new Brain(f, side.cfg.tech, side.tactic, side.cfg.charId);
    if (side.berserk) f.addStatus('berserk', 9999);
    this.fighters.push(f);
    this.place(f);
    if (n > 1) f.y = (slot - (n - 1) / 2) * 120;
    f.percent = side.percent ?? this.startPct;
    if (side.rage) f.rage = side.rage;
    for (const id in f.variants) this.texts.push({ x: f.x, y: f.y - 80, s: '🎲 ' + f.variants[id].name, color: '#ffe08a', size: 15, t: 0, life: 3 });
    return f;
  }
  // đấu sĩ đang nhận lệnh của HLV: Leader (Hỗn Chiến) / người đang trên sàn (Xa Luân) / đấu sĩ duy nhất (1v1)
  lead(team) {
    const L = this.leaders[team];
    if (L && !L.dead) return L;
    return this.fighters.find((f) => f.team === team && !f.dead) || L;
  }
  teamOf(team) { return this.fighters.filter((f) => f.team === team); }
  // Xa Luân Chiến: người kế tiếp bước lên sàn
  nextInLine(team) {
    const s = this.queue[team].shift(); if (!s) { this.checkEnd(); return; }
    const f = this.spawnSide(s, team, 0, 1);
    this.leaders[team] = f; f.invulnT = 1.2;
    vfx(this, 'halo', f.x, f.y, 50, team === 0 ? '#5aa9ff' : '#ff5a5a', { life: 0.8 });
    this.text(f.x, f.y - 80, `⚔️ ${f.name} BƯỚC LÊN SÀN!`, team === 0 ? '#9fd3ff' : '#ffb0b0', 20);
    this.sfx('fight', { vol: 0.6 });
    this.onRosterChange?.();
  }
  // Xa Luân Chiến: rút người đang đấu về cuối hàng (giữ nguyên điểm văng), người kế tiếp vào thay
  tagOut(team) {
    const f = this.lead(team);
    if (!f || !f.alive || !this.queue[team].length) return false;
    this.queue[team].push(Object.assign({}, f.side, { percent: f.percent, rage: f.rage }));
    this.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#ffffff', life: 0.4, w: 5 });
    this.text(f.x, f.y - 70, `🔁 ${f.name} lui về`, '#ffffff', 16);
    f.dead = true; f.tagged = true;
    for (const mn of this.minions.slice()) if (mn.owner === f) this.removeMinion(mn);
    this.nextInLine(team);
    return true;
  }
  // ---------- truy vấn ----------
  get bodies() { return this.minions.length ? this.fighters.concat(this.minions) : this.fighters; }
  enemiesOf(f) { return this.bodies.filter((e) => e.team !== f.team && e.alive && !e.hidden); }
  // đối thủ chính (không tính thực thể triệu hồi)
  nearestEnemy(f) {
    // bị khiêu khích / bị ảo ảnh dụ: buộc phải nhắm vào kẻ đó
    const fo = this.focusOf(f);
    if (fo) return fo;
    let best = null, bd = Infinity;
    for (const e of this.fighters) {
      if (e.team === f.team || !e.alive) continue;
      const d = dist(f, e); if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  focusOf(f) {
    const fo = f.focus;
    if (!fo) return null;
    if (fo.by.dead || !fo.by.alive || this.time > fo.until || (fo.taunt && !f.has('taunt'))) { f.focus = null; return null; }
    return fo.by;
  }
  autoTarget(f, range) {
    if (f.human) {
      const candidates = this.enemiesOf(f).filter(e => !e.has('untargetable') && dist(f, e) <= range);
      if (f.controlTarget != null) return candidates.find(e => e.id === f.controlTarget) || null;
      return candidates.filter(e => Math.abs(angDiff(f.castAngle, angTo(f, e))) < 0.32).sort((a,b) => dist(f,a)-dist(f,b))[0] || null;
    }
    if (f.has && f.has('blind')) range = Math.min(range, 150);
    // Màn Đêm Vĩnh Cửu (Raven): đối thủ mất 70% tầm nhìn
    if (this.dark && this.dark.t > 0 && this.dark.owner.team !== f.team) range = Math.min(range, 170);
    range = Math.min(range, this.aimRange);
    const fo = f.focus && this.focusOf(f);
    if (fo && Math.hypot(fo.x - f.x, fo.y - f.y) <= range) return fo;
    const seer = f.T && (f.T('it_ir') || f.T('elara_12c') || f._seeAll > this.time || (f.weaponId === 'co_lenh' && f.ws.stance === 'flag'));
    let best = null, bd = range, bm = null, bmd = range;
    for (const e of this.enemiesOf(f)) {
      const see = seer || (e.ocaMark && e.ocaMark.owner === f && e.ocaMark.until > this.time) || (e.weaponId === 'ao_thuat' && ['sung', 'ban_tia', 'cung'].includes(f.weaponId) && random() < 0.5);
      if (e.has('untargetable') && !(see && !e.has('invuln'))) continue;
      const d = Math.hypot(e.x - f.x, e.y - f.y);
      if (e.isMinion) { if (d <= bmd) { bmd = d; bm = e; } }
      else if (d <= bd) { bd = d; best = e; }
    }
    return best || bm;
  }
  aimAngle(f, t, speed) {
    if (f.human) return f.castAngle;
    const acc = f.brain ? f.brain.accuracy : 0.7;
    const d = dist(f, t), tt = d / speed;
    const mv = t.canMove() && !t.busy ? t.speed : 0;
    const px = t.x + (t.moveDir.x * mv + t.vx * 0.6) * tt * acc;
    const py = t.y + (t.moveDir.y * mv + t.vy * 0.6) * tt * acc;
    return Math.atan2(py - f.y, px - f.x) + rand(-1, 1) * (1 - acc) * 0.18;
  }
  addMinion(mn) { mn.id = ++this.nextEntityId; this.minions.push(mn); return mn; }
  removeMinion(mn) {
    const i = this.minions.indexOf(mn);
    if (i >= 0) this.minions.splice(i, 1);
    mn.dead = true;
  }
  // ---------- vùng đánh ----------
  hitArc(f, o) {
    if (f.T && f.T('it_shackle') && (o.tag === 'A' || o.tag === 'B')) o = Object.assign({}, o, { range: o.range * 1.3 });
    const x = o.x ?? f.x, y = o.y ?? f.y, a = o.angle ?? f.facing, half = (o.arc * Math.PI / 180) / 2;
    const hits = [];
    for (const t of this.enemiesOf(f)) {
      if (t.z > 40) continue;
      const d = Math.hypot(t.x - x, t.y - y);
      if (d - t.r > o.range) continue;
      const da = Math.abs(angDiff(a, Math.atan2(t.y - y, t.x - x)));
      if (d > t.r && da > half + Math.atan2(t.r, d)) continue;
      if (this.applyHit(f, t, Object.assign({}, o, { src: { x, y }, dist: d, range: o.range }))) hits.push(t);
    }
    if (!o.quiet) this.fx({ type: 'slash', x, y, r: o.range * 0.85, a, arc: half * 2, color: o.fxColor || f.weapon.color, life: 0.26, w: Math.min(26, o.range * 0.22), heavy: o.tag === 'B' || o.tag === 'U' || o.range > 125 || (o.kb || 0) >= 165 });
    return hits;
  }
  hitLine(f, o) {
    if (f.T && f.T('it_shackle') && (o.tag === 'A' || o.tag === 'B')) o = Object.assign({}, o, { len: o.len * 1.3, w: o.w * 1.3 });
    const x = o.x ?? f.x, y = o.y ?? f.y, a = o.angle ?? f.facing, c = Math.cos(a), s = Math.sin(a);
    const hits = [];
    for (const t of this.enemiesOf(f)) {
      if (t.z > 40) continue;
      const dx = t.x - x, dy = t.y - y, along = dx * c + dy * s, perp = Math.abs(-dx * s + dy * c);
      if (along < -t.r || along > o.len + t.r || perp > o.w / 2 + t.r) continue;
      if (this.applyHit(f, t, Object.assign({}, o, { angle: o.angle ?? a, src: { x, y }, dist: along, range: o.len }))) hits.push(t);
    }
    if (!o.quiet) this.fx({ type: 'thrust', x, y, a, len: o.len, w: o.w, color: o.fxColor || f.weapon.color, life: 0.24 });
    return hits;
  }
  hitCircle(f, o) {
    if (f.T && f.T('it_shackle') && (o.tag === 'A' || o.tag === 'B')) o = Object.assign({}, o, { r: o.r * 1.3 });
    const x = o.x ?? f.x, y = o.y ?? f.y;
    const hits = [];
    for (const t of this.enemiesOf(f)) {
      if (t.z > 40) continue;
      const d = Math.hypot(t.x - x, t.y - y);
      if (d - t.r > o.r) continue;
      const h = Object.assign({}, o, { src: o.src || { x, y }, dist: d, range: o.r });
      if (o.angle === undefined) h.angle = d < 2 ? f.facing : Math.atan2(t.y - y, t.x - x);
      if (this.applyHit(f, t, h)) hits.push(t);
    }
    if (!o.quiet && o.x === undefined) this.fx({ type: 'whirl', x, y, r: o.r, a: f.facing || 0, color: o.fxColor || f.weapon.color, life: 0.3, w: 8 });
    return hits;
  }
  // ---------- áp dụng đòn đánh ----------
  applyHit(att, t, hit) {
    if (!t || t.isEnv || !t.alive) return false;
    if (storyProtected(att, t)) return false;
    if (t.invulnT > 0 || t.has('invuln')) {
      if (!hit.quiet) { this.text(t.x, t.y - 40, 'NÉ!', '#cfd8e0', 13); if (!att.isEnv) { talEach(t, 'onDodge', t, att, this); if (t.weapon.onDodge) t.weapon.onDodge(t, att, this); } }
      return false;
    }
    if (t.weapon.onIncoming && t.weapon.onIncoming(t, att, hit, this) === false) return false;
    if (!talEach(t, 'onIncoming', t, att, hit, this)) return false;
    if (!spellIncoming(t, att, hit, this)) return false;
    const info = { mult: 1, kbMult: 1, taken: 1, extra: [], delayKnock: 0, fixedKb: null };
    if (att.weapon.onDeal) att.weapon.onDeal(att, t, hit, info, this);
    talEach(att, 'onDeal', att, t, hit, info, this);
    spellDeal(att, t, hit, info, this);
    // Hỗn Chiến: hào quang chỉ huy — đứng gần Leader còn sống +10% sát thương
    if (this.mode === 'brawl') { const a0 = att.owner || att, L = this.leaders[a0.team]; if (L && L.alive && L !== a0 && dist(L, a0) < 240) info.mult *= 1.1; }
    if (t.weapon.onTake) t.weapon.onTake(t, att, hit, info, this);
    talEach(t, 'onTake', t, att, hit, info, this);
    const pierce = hit.trueDmg, unblock = hit.trueDmg || hit.unblockable;
    let dmg = (hit.dmg || 0) * DMG_SCALE * att.dmgMult * att.skillMult(hit.tag) * info.mult * (pierce ? Math.max(1, info.taken) : info.taken) * (pierce ? Math.max(1, t.takenMult) : t.takenMult);
    const emp = att.has('empower'); if (emp) dmg *= 1 + emp.p;
    dmg *= this.dmgK;
    const block = !unblock && t.has('block'), stance = !pierce && t.has('stance'), immortal = t.has('immortal');
    if (block) dmg *= 0.2;
    const stK = t.T('gideon_3c') ? 0.3 : 0.45;
    if (stance) dmg *= stK;
    let shieldFull = false;
    const sh = !unblock && t.has('shield');
    if (sh && dmg > 0) {
      const ab = Math.min(dmg, sh.p);
      sh.p -= ab; dmg -= ab;
      if (sh.p <= 0.01) t.removeStatus('shield');
      shieldFull = dmg <= 0.01;
      if (!hit.quiet) this.text(t.x, t.y - 46, `🔰-${ab.toFixed(1)}`, '#9effd0', 12);
    }
    if (immortal) { dmg = 0; if (!hit.quiet) this.text(t.x, t.y - 44, 'BẤT TỬ', '#ffd700', 14); }
    t.percent += dmg;
    if (dmg > 0.3) { t.lastHurtT = this.time; att.lastDealT = this.time; }
    att.stats.dealt += dmg; t.stats.taken += dmg; att.stats.hits++;
    if (!att.isEnv) t.lastHitBy = att.owner || att;
    let mag = 0;
    if (!hit.noKnock && !immortal) {
      const src = hit.src || att;
      const ang = hit.angle ?? Math.atan2(t.y - src.y, t.x - src.x);
      if (info.fixedKb != null) mag = info.fixedKb;
      else mag = ((hit.kb || 0) + (hit.kg || 0) * KG_SCALE * t.percent) * att.kbMult * info.kbMult * Math.sqrt(att.skillMult(hit.tag)) / t.weight;
      if (block) mag *= 0.08;
      if (stance) mag *= stK;
      if (shieldFull) mag *= 0.35;
      if (t.has('ironbody')) mag *= 0.6;
      mag *= this.kbK;
      if (this.crit && !att.isEnv && mag > 1 && !hit.quiet && random() < this.crit) { mag *= 1.7; this.text(t.x, t.y - 70, '🎲 CHÍ MẠNG!', '#ffd700', 18); }
      if (mag > 1) {
        const vx = Math.cos(ang) * mag, vy = Math.sin(ang) * mag;
        let hs = hit.hitstun ?? (0.08 + mag * 0.00042);
        if (t.superArmor) hs = 0;
        if (info.delayKnock) t.pendingKnock = { vx, vy, t: info.delayKnock, hs };
        else { t.vx = vx; t.vy = vy; t.hitstun = Math.max(t.hitstun, hs); }
        if (!t.superArmor) { t.action = null; t.cancelDash(); }
      }
      if (hit.knockup && !t.superArmor) { t.vz = hit.knockup; t.z = Math.max(t.z, 1); }
    }
    const hardCC = !(block || stance || immortal);
    if (hit.stun && hardCC) { t.addStatus('stun', hit.stun); if (hit.trip && !hit.quiet) this.text(t.x, t.y - 44, 'NGÃ!', '#e0c070', 16); }
    if (hit.slow) t.addStatus('slow', hit.slow[1], hit.slow[0]);
    if (hit.root && hardCC) t.addStatus('root', hit.root);
    if (hit.silence && hardCC) t.addStatus('silence', hit.silence);
    if (hit.burn) t.addStatus('burn', hit.burn[1], hit.burn[0]);
    if (hit.poison) t.addStatus('poison', hit.poison[1], hit.poison[0]);
    for (const fn of info.extra) fn();
    if (!att.weapon.noRage) att.rage = Math.min(100, att.rage + dmg * 0.29 * att.rageMult * this.rageK);
    if (!t.weapon.noRage) t.rage = Math.min(100, t.rage + dmg * 0.2 * t.rageMult * this.rageK);
    if (att.weapon.afterDeal) att.weapon.afterDeal(att, t, hit, this);
    talEach(att, 'afterDeal', att, t, hit, this);
    if (t.weapon.afterTake) t.weapon.afterTake(t, att, hit, this);
    if (att.brain && att.brain.onLanded) att.brain.onLanded(this, t, mag);
    t.hurtFlash = 0.12;
    if (!hit.quiet && dmg > 0.3 && true) { const vk = mag > 650 ? 'sun' : mag > 320 ? 'burst' : 'spark'; vfx(this, vk, t.x, t.y - 4, vk === 'sun' ? 46 : vk === 'burst' ? 32 : 20, (att.owner || att).weapon.color, { life: vk === 'spark' ? 0.28 : 0.45 }); }
    if (!hit.quiet) {
      const n = Math.min(14, 3 + mag / 80);
      for (let i = 0; i < n; i++) this.particle(t.x, t.y, { color: i % 2 ? '#ffffff' : att.weapon.color, life: rand(0.2, 0.45), size: rand(2, 4), vx: rand(-260, 260), vy: rand(-260, 260) });
      if (dmg >= 0.5) this.text(t.x + rand(-12, 12), t.y - 30, `+${dmg.toFixed(dmg < 3 ? 1 : 0)}%`, percentColor(t.percent), 12 + Math.min(10, dmg));
    }
    if (mag > 550) { this.shake(Math.min(16, mag / 110)); this.fx({ type: 'flash', x: t.x, y: t.y, r: 30 + mag / 30, color: '#ffffff', life: 0.12 }); }
    this.hitSound(att, t, hit, mag, block || stance || immortal || shieldFull);
    return true;
  }
  // ---------- tường, cột, dây đài ----------
  collideWalls(f) {
    if (f.z > 40 || f.falling > 0) return;
    // Đâm Xuyên Vạn Quân: xuyên qua cột (cả người ủi lẫn kẻ bị ủi)
    const phase = (f.dash && f.dash.phase) || (f.carry && f.carry.phase);
    if (!phase) for (const p of this.arena.pillars) {
      const dx = f.x - p.x, dy = f.y - p.y, d = Math.hypot(dx, dy), min = p.r + f.r;
      if (d >= min) continue;
      const nx = d > 0.01 ? dx / d : 1, ny = d > 0.01 ? dy / d : 0;
      f.x = p.x + nx * min; f.y = p.y + ny * min;
      // bị ủi vào cột → ghim
      if (f.carry) {
        const by = f.carry.by;
        f.carry = null; by.ws.carry = null; by.cancelDash();
        const vg = by.T('theron_3a');
        if (vg) for (const k of ['shield', 'block', 'stance', 'absorb', 'ironbody']) f.removeStatus(k);
        this.applyHit(by, f, { dmg: 8, noKnock: true, stun: vg ? 2.5 : 1.5, trueDmg: true, tag: 'B' });
        this.text(f.x, f.y - 56, '📌 GHIM TƯỜNG!', '#ffe066', 22); this.shake(14);
        this.fx({ type: 'ring', x: f.x, y: f.y, r: 44, color: '#ffe066', life: 0.4, w: 6 });
        continue;
      }
      if (f.dash && f.dash.onWall) { const cb = f.dash.onWall; f.dash.onWall = null; cb(p); }
      const vn = f.vx * nx + f.vy * ny;
      if (vn < 0) {
        const sp = Math.hypot(f.vx, f.vy);
        f.vx -= 1.6 * vn * nx; f.vy -= 1.6 * vn * ny;
        f.vx *= 0.55; f.vy *= 0.55;
        // Valerius (Áp Chế Tuyệt Đối): bị húc khiên vào tường → câm lặng
        if (f.wallMark && f.wallMark.until > this.time && sp > 120) {
          f.wallMark = null; f.addStatus('silence', 2); this.text(f.x, f.y - 56, '🔇 ÁP CHẾ!', '#c58bff', 17);
        }
        // Thúc Gãy Xương (Wukong): bị đâm B vào tường → choáng
        if (f.wallStun && f.wallStun.until > this.time && sp > 120) { f.addStatus('stun', f.wallStun.stun); f.wallStun = null; this.text(f.x, f.y - 56, '🦴 GÃY XƯƠNG!', '#ffd27a', 16); }
        if (sp > 380) {
          f.addStatus('stun', 0.25); f.percent += 1.5; this.sfx('impact', { rate: 0.8 });
          // Hồ Băng: đập vào cột băng bị đóng băng
          if (this.arena.hazard === 'blizzard') { f.addStatus('stun', 0.85); this.text(f.x, f.y - 56, '🧊 ĐÓNG BĂNG!', '#bff0ff', 16); }
          this.text(f.x, f.y - 40, 'ĐẬP TƯỜNG!', '#cccccc', 13); this.shake(5);
          for (let i = 0; i < 6; i++) this.particle(f.x - nx * f.r, f.y - ny * f.r, { color: '#bbbbbb', life: 0.35, size: 4, vx: rand(-150, 150), vy: rand(-150, 150) });
        }
      }
    }
    for (const r of this.rings) {
      if (f.team === r.owner.team && !(f === r.owner && f.T('borg_12c'))) continue;
      const dx = f.x - r.x, dy = f.y - r.y, d = Math.hypot(dx, dy), max = r.r - f.r;
      if (d <= max || d < 0.01) continue;
      const nx = dx / d, ny = dy / d;
      f.x = r.x + nx * max; f.y = r.y + ny * max;
      const vn = f.vx * nx + f.vy * ny;
      if (vn > 0) {
        f.vx -= 2 * vn * nx; f.vy -= 2 * vn * ny; f.vx *= 1.05; f.vy *= 1.05;
        if (vn > 250) { f.percent += 2; this.text(f.x, f.y - 40, 'NẢY DÂY!', '#ff9a6a', 14); this.shake(4); }
      }
    }
  }
  // ---------- đối tượng ----------
  proj(o) {
    const p = Object.assign({ r: 5, speed: 600, range: 400, pierce: false, kind: 'arrow', color: '#fff' }, o);
    const ow = p.owner && (p.owner.owner || p.owner);
    if (ow && ow.T && ow.T('it_scope')) { p.speed *= 1.15; p.range *= 1.15; }
    p.vx = Math.cos(o.angle) * p.speed; p.vy = Math.sin(o.angle) * p.speed;
    p.ang = o.angle; p.traveled = 0; p.hitSet = new Set(); p.dead = false;
    this.projs.push(p);
    if (!o.silent) {
      const w = p.owner && p.owner.weaponId, s = PROJ_SOUND[p.kind];
      const ow = p.owner, bs = p.kind === 'bullet' && (w === 'linh' || (w === 'co_lenh' && ow.ws.stance === 'ar') ? ['rifle_ar', w === 'linh' ? 0.45 : 0.9] : w === 'song_luc' && ow.ws.stance === 'neo' ? ['smg', 0.8] : ['cannon', 'mech', 'tzero', 'siege'].includes(w) ? ['plasma', 0.7] : null);
      if (bs) this.sfx(bs[0], { vol: bs[1] });
      else if (w === 'luc_xoay' && p.kind === 'bigarrow') this.sfx('shotgun', { rate: 0.7 });
      else if (s) this.sfx(s[0], { vol: s[1], rate: s[2] ? s[2] * rand(0.94, 1.06) : undefined });
    }
    return p;
  }
  zone(o) { const z = Object.assign({ acc: 0, every: 0.5, t: 0 }, o); this.zones.push(z); return z; }
  later(t, fn) { this.timers.push({ t, fn }); }
  fx(o) { o.t = 0; if (o.type === 'boom') o.life = Math.max(o.life * 1.5, 0.45); if (o.type === 'slash') { o.arc = o.arc ?? 1.8; o.w = o.w ?? 10; } this.fxs.push(o); }
  text(x, y, s, color = '#fff', size = 14) { if (this.texts.length < 60) this.texts.push({ x, y, s, color, size, t: 0, life: 0.9 }); }
  particle(x, y, o) { if (this.parts.length < PART_CAP) this.parts.push(Object.assign({ x, y, t: 0 }, o)); }
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }
  onSkill(f, k) {}
  // âm thanh chỉ phát cho trận đang xem (không phát cho trận nền ở menu)
  sfx(name, o) { this.audioEvents?.push({ name, options: o || {} }); }
  hitSound(att, t, hit, mag, guarded) {
    if (att.isEnv) return;
    if (hit.quiet && mag < 300) return;
    if (guarded) return this.sfx('sword_clash', { vol: 0.8 });
    if (mag > 620) this.sfx('armor_hit');
    const w = att.weaponId;
    if (BLADE_WEAPONS.has(w)) this.sfx(hit.tag === 'B' || mag > 420 ? 'slash_heavy' : pick(['slash_light', 'sword_cut']), { vol: 0.8 });
    else if (w === 'vuot') this.sfx('flesh_hit');
    else this.sfx(mag > 300 ? 'impact' : 'flesh_hit', { vol: 0.65 });
  }
  onUlt(f) {
    f._ultAt = this.time;
    this.text(f.x, f.y - 70, `⚡ ${f.weapon.skills.U.name.toUpperCase()}`, '#ffe066', 20);
    this.fx({ type: 'flash', x: f.x, y: f.y, r: 90, color: f.weapon.color, life: 0.3 });
    vfx(this, 'rune', f.x, f.y, 95, f.weapon.color, { life: 0.9, alpha: 0.85 });
    this.ultBanner = { f, t: 0 };
    this.sfx('magic_burst');
  }
  // HLV ra lệnh (team 0 = bạn, team 1 = HLV đối thủ)
  command(team, id) {
    if (this.state !== 'fight' || !this.cmds[team].includes(id)) return false;
    const cds = this.cmdCd[team];
    if ((cds[id] || 0) > 0) return false;
    const f = this.lead(team), C = COMMANDS[id];
    if (!f || !f.brain || !f.alive) return false;
    if (f.has('berserk') && !f.brain.tame) { this.text(f.x, f.y - 80, '🔴 Không nghe lệnh!', '#ff6a6a', 16); cds[id] = 2; return false; }
    if (C.needUlt && !f.ultReady()) return false;
    if (C.spellUse && !spellReady(f, C.spellUse)) return false;
    if (C.tagOut && !this.queue[team].length) return false;
    cds[id] = C.cd ?? CMD_CD;
    const tag = team === 0 ? '📣' : '📣 HLV đối thủ:';
    this.text(f.x, f.y - 84, `${tag} ${C.icon} ${C.name}`, team === 0 ? '#9fd3ff' : '#ffb0b0', team === 0 ? 18 : 15);
    // lệnh phối hợp đội: mọi thành viên còn trên sàn cùng nhận
    if (C.team) { teamOrder(this, team, C); return true; }
    if (C.tagOut) return this.tagOut(team);
    f.brain.order(id, this);
    // Hỗn Chiến: lệnh cơ bản (Tiến lên / Rút lui) Leader hô cho cả đội
    if (this.mode === 'brawl' && C.basic && id !== 'ult') for (const o of this.teamOf(team)) if (o !== f && o.alive && o.brain) o.brain.order(id, this);
    return true;
  }
  shout(id) { return this.command(0, id); }
  // HLV máy: cân nhắc lệnh theo tình huống (có độ trễ và ngẫu hứng)
  coachThink(team, dt) {
    this.coachT[team] -= dt;
    if (this.coachT[team] > 0) return;
    this.coachT[team] = rand(0.9, 1.8);
    const f = this.lead(team), t = f && f.brain && f.brain.target && f.brain.target.alive ? f.brain.target : this.lead(1 - team);
    if (!f || !t) return;
    if (!f.alive || !t.alive || f.has('berserk')) return;
    const d = dist(f, t);
    const ok = shuffle(this.cmds[team].slice()).filter((id) => !(this.cmdCd[team][id] > 0) && COMMANDS[id].ai && COMMANDS[id].ai(f, t, this, d));
    if (ok.length && random() < 0.55) this.command(team, ok[0]);
  }
  // ---------- rơi / KO ----------
  startFall(f) {
    if (f.falling > 0) return;
    // bảo hiểm rơi đài (Mạng Thứ Hai, Phượng Hoàng, Vòng Lặp, Võ Đài Vĩnh Cửu...)
    if (!f.isMinion && !talEach(f, 'onFall', f, this)) return;
    if (!f.isMinion && f.weapon.onFall && f.weapon.onFall(f, this) === false) return;
    if (!f.isMinion && f.spells && f.spells.length && !spellOnFall(f, this)) return;
    // Xích Hồn Đồng Quy: kẻ bị liên kết bị kéo văng theo cùng góc
    const ch = f._chain;
    if (ch && this.time < ch.until && ch.t.alive) {
      f._chain = null;
      const t = ch.t, sp = Math.max(700, Math.hypot(f.vx, f.vy)), a = Math.atan2(f.vy, f.vx);
      if (!t.has('immortal')) { t.vx = Math.cos(a) * sp; t.vy = Math.sin(a) * sp; t.hitstun = Math.max(t.hitstun, 0.6); t.action = null; t.cancelDash(); }
      this.fx({ type: 'line', x1: f.x, y1: f.y, x2: t.x, y2: t.y, color: '#b0a0ff', life: 0.6, w: 6 });
      this.text(t.x, t.y - 60, '🔗 ĐỒNG QUY!', '#b0a0ff', 20);
    }
    f.falling = 0.8; f.action = null; f.cancelDash(); f.pull = null; f.carry = null; f.arcPull = null; f.hover = 0;
    if (!f.isMinion) { const p = this.arena.clamp({ x: f.x, y: f.y }, 20); vfx(this, 'skull', p.x, p.y - 10, 46, '#ff4a4a', { life: 1.1 }); vfx(this, 'dust', p.x, p.y, 70, null, { life: 0.8, tint: '#c0c0c0' }); }
    if (f.ws.cling) f.ws.cling = null;
    const sp = Math.hypot(f.vx, f.vy);
    if (sp < 120) { const a = Math.atan2(f.y, f.x); f.vx = Math.cos(a) * 120; f.vy = Math.sin(a) * 120; }
    const a = Math.atan2(f.vy, f.vx);
    this.fx({ type: 'kobeam', x: f.x, y: f.y, a, color: f.team === 0 ? '#5aa9ff' : '#ff5a5a', life: 0.9 });
    this.shake(f.isMinion ? 8 : 18);
    this.sfx(f.isMinion ? 'boom_small' : 'explosion', { vol: f.isMinion ? 0.6 : 1 });
    this.text(f.x, f.y - 30, f.isMinion ? `${f.name} rơi đài!` : 'KO!', '#ffffff', f.isMinion ? 18 : 34);
    if (!f.isMinion && f.lastHitBy && f.lastHitBy !== f) { f.lastHitBy.stats.kos++; talEach(f.lastHitBy, 'onKill', f.lastHitBy, f, this); if (f.lastHitBy.weapon && f.lastHitBy.weapon.onKill) f.lastHitBy.weapon.onKill(f.lastHitBy, f, this); }
    this.log.push({ t: this.clock, ko: f.name });
  }
  onKO(f) {
    f.falling = 0;
    if (f.isMinion) {
      this.removeMinion(f);
      const o = f.owner;
      if (o && o.weapon.onMinionDead) o.weapon.onMinionDead(o, f, this);
      else if (o && WEAPONS[o.weaponId].onMinionDead) WEAPONS[o.weaponId].onMinionDead(o, f, this);
      return;
    }
    f.stocks--;
    if (f.crystal) {
      f.crystal = false;
      if (Array.isArray(f.cfg.equip)) f.cfg.equip = f.cfg.equip.filter((k) => k !== 'it_lifecrystal');
      this.text(f.x, f.y - 60, '💎 THỦY TINH VỠ — giữ được mạng!', '#9affea', 18); this.sfx('magic_burst', { vol: 0.6 });
      this.opts.onBreak && this.opts.onBreak(f.team, 'it_lifecrystal');
    }
    if (f.stocks <= 0) {
      f.dead = true;
      // Xa Luân Chiến: người kế tiếp bước lên sàn
      if (this.mode === 'gauntlet' && this.queue[f.team].length) { this.later(1.3, () => this.nextInLine(f.team)); this.text(0, -150, `☠️ ${f.name} bị loại!`, '#ffffff', 22); return; }
      if (this.mode === 'brawl') this.text(f.x, f.y - 50, `☠️ ${f.name} bị loại!`, '#ffffff', 18);
      this.checkEnd(); return;
    }
    f.respawnT = 1.3;
  }
  respawn(f) {
    const rage = f.rage, stats = f.stats, berserk = f.has('berserk');
    const guard = f.ws.guard;
    f.reset();
    f.rage = rage; f.stats = stats;
    if (berserk) f.addStatus('berserk', 9999);
    // Oktava vẫn còn trên sàn thì giữ lại
    if (guard && guard.alive) { f.ws.guard = guard; f.ws.needSpawn = false; }
    this.place(f);
    vfx(this, 'halo', f.x, f.y, 48, '#ffffff', { life: 0.8 }); this.sfx('energy_charge2', { vol: 0.35 });
    f.y = -40; f.invulnT = 2; f.percent = this.startPct;
    if (this.sizeK !== 1) f.r = (f.weapon.radius || 18) * this.sizeK * (f.bodyK || 1);
    this.fx({ type: 'ring', x: f.x, y: f.y, r: 50, color: '#ffffff', life: 0.5, w: 4 });
  }
  checkEnd(timeUp = false) {
    if (this.state === 'over') return;
    // còn người: đang trên sàn + đang chờ (Xa Luân Chiến)
    const alive = [0, 1].map((tm) => this.fighters.filter((f) => f.team === tm && !f.dead).length + this.queue[tm].length);
    let winner = null;
    if (!alive[0] && alive[1]) winner = 1;
    else if (!alive[1] && alive[0]) winner = 0;
    else if (timeUp) {
      // hết giờ: đội còn nhiều người hơn → nhiều mạng hơn → ít điểm văng hơn
      const lives = (tm) => this.teamOf(tm).filter((x) => !x.dead).reduce((n, x) => n + x.stocks, 0) + this.queue[tm].length;
      const pct = (tm) => this.teamOf(tm).filter((x) => !x.dead).reduce((n, x) => n + x.percent, 0);
      if (alive[0] !== alive[1]) winner = alive[0] > alive[1] ? 0 : 1;
      else if (lives(0) !== lives(1)) winner = lives(0) > lives(1) ? 0 : 1;
      else winner = pct(0) <= pct(1) ? 0 : 1;
    }
    if (winner === null) return;
    this.state = 'over'; this.overT = 0; this.winner = winner;
    if (winner === 0) this.sfx('applause', { vol: 0.7 });
  }
  // ---------- vòng lặp ----------
  update(dt) {
    this.time += dt; this._dt = dt;
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 40);
    if (this.state === 'intro') {
      this.introT -= dt;
      if (this.introT <= 0) { this.state = 'fight'; this.sfx('fight'); }
      this.updateFx(dt);
      return;
    }
    if (this.state === 'over') {
      this.overT += dt;
      dt *= 0.3;
      if (this.overT > 2.2 && !this.ended) {
        this.ended = true;
        const sum = (tm) => { const s = { dealt: 0, taken: 0, hits: 0, kos: 0 }; for (const x of this.teamOf(tm)) for (const k in s) s[k] += x.stats[k] || 0; return s; };
        const a = { stats: sum(0), stocks: this.teamOf(0).reduce((n, x) => n + Math.max(0, x.stocks), 0) }, b = { stats: sum(1), stocks: this.teamOf(1).reduce((n, x) => n + Math.max(0, x.stocks), 0) };
        this.opts.onEnd && this.opts.onEnd({ winner: this.winner, time: this.clock, a: a.stats, b: b.stats, stocks: [a.stocks, b.stocks] });
      }
    } else {
      this.clock += dt;
      if (this.clock >= this.timeLimit) this.checkEnd(true);
    }
    for (const cd of this.cmdCd) for (const k in cd) cd[k] = Math.max(0, cd[k] - dt);
    if (this.state === 'fight') for (let tm = 0; tm < 2; tm++) if (this.aiCoach[tm]) this.coachThink(tm, dt);
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i]; tm.t -= dt;
      if (tm.t <= 0) { this.timers.splice(i, 1); tm.fn(); }
    }
    const fighting = this.state === 'fight';
    if (this.dark && fighting) { this.dark.t -= dt; if (this.dark.t <= 0) this.dark = null; }
    if (fighting) {
      for (const d of this.dangers) d.t -= dt;
      this.dangers = this.dangers.filter((d) => d.t > 0);
      if (this.haz && this.haz.update && this.hazK > 0) this.haz.update(this, dt * this.hazK);
      for (const f of this.fighters) {
        if (!f.alive) continue;
        if (this.regen && this.time - (f.lastHurtT || 0) > 3 && f.percent > 0) f.percent = Math.max(0, f.percent - this.regen * dt);
        if (this.magnet && f.z <= 0) { const L = Math.hypot(f.x, f.y) || 1; f.vx -= (f.x / L) * this.magnet * dt * 2.4; f.vy -= (f.y / L) * this.magnet * dt * 2.4; }
      }
    }
    for (const f of this.fighters) if (f.brain && fighting) f.brain.update(dt, this);
    for (const mn of this.minions.slice()) if (fighting && mn.alive && mn.weapon.mind) mn.weapon.mind(mn, this, dt);
    for (const f of this.fighters) f.update(dt, this);
    for (const mn of this.minions.slice()) mn.update(dt, this);
    // đẩy tách nhau
    const B = this.bodies;
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
      const a = B[i], b = B[j];
      if (!a.alive || !b.alive || a.hidden || b.hidden || a.z > 20 || b.z > 20) continue;
      if (a.carry || b.carry || a.has('feral') || b.has('feral')) continue;
      if ((a.dash && a.dash.through) || (b.dash && b.dash.through)) continue;
      const d = dist(a, b), min = a.r + b.r;
      if (d >= min || d < 0.01) continue;
      const wa = a.weight, wb = b.weight, ka = wb / (wa + wb), kb = wa / (wa + wb);
      const push = min - d, nx = (b.x - a.x) / d, ny = (b.y - a.y) / d;
      if (this.arena.inside(a.x - nx * push * ka, a.y - ny * push * ka, 2)) { a.x -= nx * push * ka; a.y -= ny * push * ka; }
      if (this.arena.inside(b.x + nx * push * kb, b.y + ny * push * kb, 2)) { b.x += nx * push * kb; b.y += ny * push * kb; }
    }
    // dây đài
    for (const r of this.rings) r.t -= dt;
    this.rings = this.rings.filter((r) => r.t > 0 && r.owner.alive);
    // bánh răng
    if (this.hasHand && fighting) {
      this.gearT -= dt;
      if (this.gearT <= 0 && this.gears.length < 5) {
        this.gearT = rand(1.6, 2.6);
        const a = rand(0, TAU), rr = Math.sqrt(random()) * Math.min(this.arena.hx, this.arena.hy) * 0.8;
        const p = { x: Math.cos(a) * rr, y: Math.sin(a) * rr };
        if (!this.arena.nearPillar({ ...p, r: 10 }, 10)) this.gears.push({ x: p.x, y: p.y, t: 0 });
      }
      for (const f of this.fighters) {
        if (f.weaponId !== 'hand' || !f.alive || f.ws.gears >= 9) continue;
        const mag = f.T('roxie_1a'), mk = f.T('it_magnet') ? 2 : 1, roll = f.T('roxie_6c');
        for (let i = this.gears.length - 1; i >= 0; i--) {
          const g = this.gears[i];
          const gd = Math.hypot(g.x - f.x, g.y - f.y);
          // Từ Tính: hút bánh răng lại gần
          if (mag && gd < 200 * mk && gd > 1) { const k = Math.min(1, 260 * dt / gd); g.x += (f.x - g.x) * k; g.y += (f.y - g.y) * k; }
          // Từ Trường Thu Gom: bánh răng tự lăn về Roxie sau 1s
          else if (roll && g.t > 1 && gd > 1) { const k = Math.min(1, 150 * dt / gd); g.x += (f.x - g.x) * k; g.y += (f.y - g.y) * k; }
          // bánh răng trong bán kính 3m tự bay về Roxie (đỡ phải bỏ vị trí đi nhặt)
          else if (gd < 120 && gd > 1) { const k = Math.min(1, 300 * dt / gd); g.x += (f.x - g.x) * k; g.y += (f.y - g.y) * k; }
          if (gd < f.r + (mag ? 40 : 16) * mk) {
            this.gears.splice(i, 1); f.ws.gears++;
            this.text(g.x, g.y - 20, '+⚙️', '#ffb030', 14);
            if (f.ws.gears >= 9) break;
          }
        }
      }
      for (const g of this.gears) g.t += dt;
    }
    // tường lửa (Ignatius): thiêu kẻ địch chạm vào
    for (const w of this.walls) {
      w.t += dt; w.acc = (w.acc || 0) + dt;
      if (w.acc >= 0.3) {
        w.acc = 0;
        if (w.kind !== 'mag') for (const e of this.enemiesOf(w.owner)) if (segDist(e.x, e.y, w) < e.r + 10) this.applyHit(w.owner, e, { dmg: 1.4, kb: 70, kg: 0.6, burn: [1.6, 3], tag: 'D', quiet: true, angle: Math.atan2(e.y - (w.y1 + w.y2) / 2, e.x - (w.x1 + w.x2) / 2) });
      }
    }
    if (fighting) { spellWalls(this); for (const f of this.fighters) if (f.alive || f.falling > 0) spellUpdate(f, this, dt); }
    this.walls = this.walls.filter((w) => w.t < w.life);
    this.updateProjs(dt);
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i]; z.t += dt; z.acc += dt;
      while (z.acc >= z.every) { z.acc -= z.every; z.tick && z.tick(this, z); }
      if (z.t >= z.life) this.zones.splice(i, 1);
    }
    this.updateFx(dt);
  }
  updateProjs(dt) {
    for (const p of this.projs) {
      if (p.dead) continue;
      if (p.curve) { p.ang += p.curve * dt; p.vx = Math.cos(p.ang) * p.speed; p.vy = Math.sin(p.ang) * p.speed; }
      // đạn tầm nhiệt (Raven): bẻ cong đuổi theo mục tiêu bị đánh dấu
      if (p.home && p.home.alive) { const w = Math.atan2(p.home.y - p.y, p.home.x - p.x); p.ang += clamp(angDiff(p.ang, w), -p.turn * dt, p.turn * dt); p.vx = Math.cos(p.ang) * p.speed; p.vy = Math.sin(p.ang) * p.speed; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.traveled += p.speed * dt;
      if ((p.kind === 'phantom' || p.kind === 'sonic') && random() < 0.7) this.fx({ type: 'ghost', x: p.x, y: p.y, r: p.r * (p.kind === 'sonic' ? 0.6 : 1), color: p.color, life: 0.15 });
      if (p.breaker) {
        for (const q of this.projs) {
          if (q === p || q.dead || q.breaker || q.owner.team === p.owner.team || q.kind === 'phantom') continue;
          if (Math.hypot(q.x - p.x, q.y - p.y) < p.r + q.r + 6) {
            q.dead = true;
            if (q.onEnd && q.kind === 'mark') q.onEnd(this, q);
            for (let i = 0; i < 5; i++) this.particle(q.x, q.y, { color: '#ffffff', life: 0.25, size: 3, vx: rand(-200, 200), vy: rand(-200, 200) });
          }
        }
      }
      // tường lửa chặn đạn của phe địch
      if (this.walls.length && p.kind !== 'phantom' && this.walls.some((w) => w.owner.team !== p.owner.team && segDist(p.x, p.y, w) < p.r + 8)) {
        p.dead = true;
        for (let i = 0; i < 4; i++) this.particle(p.x, p.y, { color: '#ff8a2a', life: 0.3, size: 3, vx: rand(-120, 120), vy: rand(-160, 40) });
        continue;
      }
      // cột chắn đạn (trừ các đòn xuyên phá lớn)
      if (!p.breaker && !p.ghost && p.kind !== 'phantom') {
        const c = this.arena.nearPillar({ x: p.x, y: p.y, r: p.r }, 0);
        if (c) {
          p.dead = true;
          for (let i = 0; i < 4; i++) this.particle(p.x, p.y, { color: '#cccccc', life: 0.25, size: 3, vx: rand(-150, 150), vy: rand(-150, 150) });
          if (p.onEnd) p.onEnd(this, p);
          continue;
        }
      }
      for (const t of this.enemiesOf(p.owner)) {
        if (p.hitSet.has(t) || t.z > 40) continue;
        if (Math.hypot(t.x - p.x, t.y - p.y) < t.r + p.r) {
          p.hitSet.add(t);
          let landed = false;
          if (p.hit) landed = this.applyHit(p.owner, t, Object.assign({}, p.hit, { angle: p.ang, proj: true, src: { x: p.x - Math.cos(p.ang) * 25, y: p.y - Math.sin(p.ang) * 25 } }));
          if (p.onHit && (landed || !p.hit) && !storyProtected(p.owner, t)) p.onHit(this, p, t);
          if (!p.pierce) { p.dead = true; p.hitDone = true; break; }
        }
      }
      if (!p.dead && p.traveled >= p.range) { p.dead = true; if (p.onEnd) p.onEnd(this, p); }
    }
    this.projs = this.projs.filter((p) => !p.dead);
  }
  updateFx(dt) {
    for (const o of this.fxs) o.t += dt;
    this.fxs = this.fxs.filter((o) => o.t < o.life);
    for (const p of this.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; }
    this.parts = this.parts.filter((p) => p.t < p.life);
    for (const t of this.texts) { t.t += dt; t.y -= 30 * dt; }
    this.texts = this.texts.filter((t) => t.t < t.life);
    if (this.ultBanner) { this.ultBanner.t += dt; if (this.ultBanner.t > 1.4) this.ultBanner = null; }
  }

  // ---------- vẽ ----------







  // dải thành viên đội (Hỗn Chiến: cả đội • Xa Luân: người đã đấu / đang đấu / đang chờ)


}
// khoảng cách từ điểm tới đoạn thẳng {x1,y1,x2,y2}
function segDist(px, py, s) {
  const vx = s.x2 - s.x1, vy = s.y2 - s.y1, L2 = vx * vx + vy * vy || 1;
  const k = clamp(((px - s.x1) * vx + (py - s.y1) * vy) / L2, 0, 1);
  return Math.hypot(s.x1 + vx * k - px, s.y1 + vy * k - py);
}

// âm thanh theo loại vũ khí / loại đạn: [tên, âm lượng, tốc độ phát]
const BLADE_WEAPONS = new Set(['kiem_khien', 'katana', 'kiem_dai', 'rapier', 'dao', 'liem', 'thuong']);
const PROJ_SOUND = {
  arrow: ['bow_shoot', 0.8], bigarrow: ['bow_shoot', 1.2, 0.8], bolt: ['bow_shoot', 0.5, 1.35], hook: ['bow_shoot', 0.7, 0.7],
  bullet: ['gun_shot', 1], fireball: ['magic_spell', 0.6, 1.2], star: ['magic_spell', 0.5, 1.5], mark: ['magic_spell', 0.6],
  knife: ['slash_light', 0.6, 1.3], wave: ['sword_cut', 0.9], phantom: ['sword_cut', 0.7, 1.2], sonic: ['magic_burst', 0.9],
  scythe: ['spin', 0.7],
};
