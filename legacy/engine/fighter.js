'use strict';
// ===== Đấu sĩ =====
// cfg: { name, weapon, color, charId, stats{}, skills{}, tech{}, equip{slot:id} }
function computeMods(cfg) {
  const mods = { dmg: 0, kb: 0, weight: 0, taken: 0, speed: 0, cdr: 0, rage: 0, trust: 0, wis: 0 };
  for (const id of Object.values(cfg.equip || {})) {
    const it = ITEM_BY_ID[id];
    if (it && it.mods) for (const k in it.mods) mods[k] += it.mods[k];
    const cm = it && it.charMods && it.charMods[cfg.charId]; if (cm) for (const k in cm) mods[k] += cm[k];
  }
  return mods;
}

// Hệ số cân bằng theo tướng (chỉnh bằng mô phỏng hàng loạt): dmg = điểm văng gây ra, kb = lực đánh văng, w = trụ vững
const BALANCE = {
  // mạnh → giảm
  death: { dmg: 0.87, kb: 0.88, w: 0.92 }, roxie: { dmg: 0.68, kb: 0.7 }, valerius: { kb: 0.84, w: 0.95 }, ignatius: { kb: 0.87 },
  florian: { kb: 0.93 }, aria: { kb: 0.94 }, victoria: { dmg: 0.76, kb: 0.76 }, // Victoria: áp cả lên lính
  // yếu → tăng
  raven: { dmg: 1.2, kb: 1.2 }, songluc: { dmg: 1.2, kb: 1.18 }, zero: { dmg: 1.18, kb: 1.12 }, jack: { dmg: 1.14, kb: 1.22 },
  alice: { dmg: 1.14, kb: 1.1 }, koda: { kb: 1.14, w: 1.08 }, theron: { kb: 1.05 }, wukong: { dmg: 1.05, kb: 1.1 }, clint: { kb: 1.1 }, percy: { dmg: 1.06, kb: 1.04 }, vesper: { kb: 1.06 }, thanhphong: { dmg: 1.08, kb: 1.08 },
};
// Hệ số cân bằng RIÊNG cho chế độ đội (nhân thêm trên BALANCE): Hỗn Chiến ưu ái đòn diện rộng, Xa Luân bất lợi cho tướng cần thời gian tích tài nguyên
const MODE_BALANCE = {
  brawl: { ignatius: { dmg: 0.86, kb: 0.86 }, valerius: { kb: 0.76 }, wukong: { dmg: 0.9, kb: 0.8 }, aria: { dmg: 0.9, kb: 0.8 }, thanhphong: { dmg: 0.9, kb: 0.8 }, gideon: { kb: 0.95 },
    alice: { kb: 0.95 }, galo: { kb: 0.94 }, theron: { kb: 0.95 },
    florian: { dmg: 1.22, kb: 1.45 }, koda: { kb: 1.35, w: 1.15 }, zero: { dmg: 1.08, kb: 1.15 }, elara: { dmg: 1.2, kb: 1.2 }, joker: { dmg: 1.08, kb: 1.2 }, jack: { kb: 1.08 },
    ryoma: { kb: 1.06 }, victoria: { kb: 1.06 }, death: { kb: 1.05 } },
  gauntlet: { roxie: { dmg: 1.8, kb: 1.6, w: 1.2 }, jack: { kb: 1.3 }, koda: { kb: 1.28 }, aria: { kb: 0.92 }, elara: { kb: 1.06 }, theron: { kb: 0.94 }, ignatius: { kb: 1.06 }, clint: { kb: 1.06 }, raven: { kb: 1.06 } },
};
// chiêu cơ động (lướt/dịch chuyển) — bị khóa khi Cấm Lướt
function isMobility(sk) { return !!(sk.mobility || (sk.ai && (sk.ai.mob || sk.ai.type === "mob"))); }

class Fighter {
  constructor(cfg, team) {
    this.cfg = cfg;
    this.name = cfg.name;
    this.team = team;
    this.charId = cfg.charId || null;
    this.weaponId = cfg.weapon;
    this.weapon = WEAPONS[cfg.weapon];
    this.color = cfg.color || this.weapon.color;
    const s = cfg.stats, mods = computeMods(cfg);
    this.dmgMult = (1 + 0.06 * (s.power - 1)) * (1 + mods.dmg);
    this.kbMult = (1 + 0.05 * (s.knock - 1)) * (1 + mods.kb);
    this.weightFactor = (1 + 0.06 * (s.weight - 1)) * (1 + mods.weight);
    this.takenMult = 1 + mods.taken;
    this.speedFactor = (1 + 0.04 * (s.speed - 1)) * (1 + mods.speed);
    this.cdMult = 1 / ((1 + 0.05 * (s.haste - 1)) * (1 + mods.cdr));
    this.rageMult = (1 + 0.08 * (s.rage - 1)) * (1 + mods.rage);
    const bal = BALANCE[cfg.charId || cfg.balOf]; if (bal) { this.dmgMult *= bal.dmg || 1; this.kbMult *= bal.kb || 1; this.weightFactor *= bal.w || 1; }
    // tâm trí: Tín Nhiệm (nghe lệnh) • Trí Tuệ (phản ứng, khoảng cách, nhìn thấu ảo ảnh)
    this.trust = clamp((cfg.trust ?? mindBase(cfg.charId)[0]) + mods.trust, 0, 100);
    this.wis = wisOf(cfg.charId, cfg.tech, mods.wis);
    // phép bổ trợ mang theo (1, có Bùa Song Phép thì 2)
    this.spells = (cfg.spells || []).filter((id) => SPELLS[id]).slice(0, spellSlots(cfg)); this.scd = {};
    this.skillLv = Object.assign({ A: 1, B: 1, C: 1, D: 1, U: 1 }, cfg.skills);
    this.stocks = 2;
    // nội tại 1-3-6-9-12 + trang bị (cùng cơ chế móc hiệu ứng; f.T('it_xxx') để kiểm tra trang bị)
    this.items = Object.values(cfg.equip || {}).filter((id) => ITEM_BY_ID[id]);
    this.tal = new Set([...(cfg.talents || []), ...this.items]);
    // biến thể ngẫu nhiên của nội tại (bốc lại mỗi hiệp)
    this.variants = {};
    for (const id of cfg.talents || []) if (TALENT_VARIANTS[id]) { const v = pick(TALENT_VARIANTS[id]); this.variants[id] = v; this.tal.add(id + ':' + v.k); }
    this.talFx = [...(cfg.talents || [])].map((id) => TALENT_FX[id]).concat(this.items.map((id) => ITEM_FX[id])).filter(Boolean);
    this.actives = this.items.filter((id) => ITEM_BY_ID[id].active);
    this.icd = {};
    this.cdK = {}; this.rageNeed = 100; this.stillT = 0;
    talEach(this, "setup", this);
    this.reset();
  }
  reset() {
    this.lifeEpoch = (this.lifeEpoch || 0) + 1;
    this.holdSince = {}; this.cancelledCharge = {}; this.charging = null; this.channelKey = null; this.channelAction = null; this.basicHeldActive = false;
    this.weapon = WEAPONS[this.weaponId];
    this.r = (this.weapon.radius || 18) * (this.sizeK || 1) * (this.bodyK || 1);
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.z = 0; this.vz = 0; this.hover = 0;
    this.facing = 0; this.percent = 0; this.rage = this.rage || 0; this.form = null;
    this.cd = { A: 0, B: 0, C: 0, D: 0, U: 0, E: 0 };
    this.status = {};
    this.action = null; this.dash = null; this.pull = null; this.pendingKnock = null; this.carry = null; this.arcPull = null;
    this.hitstun = 0; this.invulnT = 0; this.falling = 0; this.respawnT = 0; this.dead = false;
    this.moveDir = { x: 0, y: 0 }; this.castAngle = 0; this.frameSpeed = 1; this.frameWeight = 1;
    this.marks = null; this.gunMark = null; this.intent = null;
    this.ws = {};
    if (this.weapon.init) this.weapon.init(this);
    talEach(this, "life", this);
    this.anim = null; this.hurtFlash = 0;
    this.stats = this.stats || { dealt: 0, taken: 0, kos: 0, hits: 0 };
  }
  get weight() { return this.weapon.weight * this.weightFactor * this.frameWeight * (this.wG || 1) * (this.venomK || 1); }
  get speedMult() { return this.weapon.speed * this.speedFactor; }
  get alive() { return !this.dead && this.falling <= 0 && this.respawnT <= 0; }
  get speed() {
    let s = BASE_SPEED * this.speedMult * this.frameSpeed * (this.spdG || 1);
    const h = this.status.haste; if (h) s *= 1 + h.p;
    const sl = this.status.slow; if (sl) s *= 1 - sl.p;
    if (this.status.poison) s *= 0.9;
    const bl = this.status.bleed; if (bl && bl.hunt) s *= 1 - 0.06 * bl.n;
    const bu = this.status.burn; if (bu && bu.ign) s *= 0.75;
    return s;
  }
  // đổi dạng (lái Thiết Vệ...) — giữ nguyên ws
  setForm(id) {
    this.weapon = WEAPONS[id]; this.r = (this.weapon.radius || 18) * (this.sizeK || 1) * (this.bodyK || 1); this.form = id;
    for (const k in this.cd) this.cd[k] = 0;
    this.action = null;
  }
  clearForm() {
    this.weapon = WEAPONS[this.weaponId]; this.r = (this.weapon.radius || 18) * (this.sizeK || 1) * (this.bodyK || 1); this.form = null;
    for (const k in this.cd) this.cd[k] = Math.min(this.cd[k], 1);
  }
  T(id) { return this.tal ? this.tal.has(id) : false; }
  skillMult(tag) { const lv = this.skillLv[tag === 'E' ? 'C' : tag] || 1; return 1 + 0.08 * (lv - 1); }
  cdOf(k) {
    const sk = this.weapon.skills[k];
    if (!sk || !sk.cd) return 0;
    const lv = this.skillLv[k === 'E' ? 'C' : k] || 1;
    return sk.cd * CD_SCALE * this.cdMult * (1 - 0.03 * (lv - 1)) * (this.cdK[k] || 1) * (this.cdG || 1) * (this._coreOn && k !== 'U' ? 0.5 : 1);
  }
  // ---- trạng thái ----
  has(t) { return this.status[t]; }
  addStatus(type, dur, p = 0, cap) {
    if (this.dead) return;
    const def = STATUS[type];
    if (def && def.bad && (this.has('immortal') || this.has('invuln'))) return;
    if (CC_TYPES.has(type) && this.has('unstoppable')) return;
    if (type === 'slow' && this.has('feral') && this.T('koda_9a')) return;
    if ((type === 'root' || type === 'charm') && this.T('theron_12c')) return;
    if (this.T('it_titan') && (type === 'slow' || (type === 'stun' && dur <= 0.5))) return;
    if (type === 'regen' && this.has('wound')) return;
    if ((type === 'slow' || type === 'root') && this.T('it_oil')) dur *= 0.7;
    if ((type === 'stun' || type === 'silence') && this.T('it_fury')) dur *= 1.25;
    const s = this.status[type];
    if (type === 'burn' || type === 'poison') {
      if (s) { s.t = Math.max(s.t, dur); s.p = Math.min(s.p + p, p * 3); } else this.status[type] = { t: dur, p, max: dur };
      return;
    }
    if (type === 'bleed') {
      const c = cap || (s && s.cap) || 5, n = Math.min(c, (s ? s.n : 0) + (p || 1));
      this.status.bleed = { t: dur, n, p: 0.55 * n, max: dur, cap: c, hunt: s && s.hunt };
      return;
    }
    if (type === 'shield') {
      if (s) { s.p = Math.min(s.p + p, Math.max(p, 14)); s.t = Math.max(s.t, dur); } else this.status.shield = { t: dur, p, max: dur };
      return;
    }
    if (s) { s.t = Math.max(s.t, dur); s.p = Math.max(s.p, p); s.max = Math.max(s.max, dur); }
    else this.status[type] = { t: dur, p, max: dur };
    if (type === 'stun' || type === 'charm') { this.action = null; this.cancelDash(); }
  }
  removeStatus(t) { delete this.status[t]; }
  cleanse() { for (const k in this.status) if (STATUS[k] && STATUS[k].bad) delete this.status[k]; this.pull = null; this.arcPull = null; }
  get superArmor() {
    return this.has('block') || this.has('stance') || this.has('ironbody') || this.has('immortal') || this.has('absorb') || this.has('unstoppable') || (this.action && this.action.super)
      || (this.form === 'mech' && this.T('roxie_9c')) || (this.ws.mounted > 0 && this.T('aria_9b')) || this.T('it_titan') || this.has('rarmor') || this.ws.hka > 0 || (this.weaponId === 'binh_doc' && this.ws.beast > 0);
  }

  // ---- hành động ----
  act(dur, opts = {}, events = []) {
    this.action = { t: 0, dur, move: opts.move ?? 0, lock: opts.lock ?? true, anim: opts.anim, atk: opts.atk, super: opts.super,
      charge: opts.charge, windup: opts.windup, onEnd: opts.onEnd, events: events.slice().sort((a, b) => a[0] - b[0]), ei: 0 };
  }
  startDash(o) {
    const a = o.angle;
    this.cancelDash();
    this.dash = { vx: Math.cos(a) * o.dist / o.dur, vy: Math.sin(a) * o.dist / o.dur, t: 0, dur: o.dur, onContact: o.onContact,
      onEnd: o.onEnd, onWall: o.onWall, stopAtEdge: o.stopAtEdge ?? true, trail: o.trail, through: o.through, phase: o.phase };
    if (o.invuln) this.invulnT = Math.max(this.invulnT, o.dur + 0.04);
  }
  cancelDash() { const d = this.dash; this.dash = null; if (d && d.onEnd) d.onEnd(); }
  get busy() { return !!(this.action && this.action.lock) || !!this.dash; }
  get grounded() { return this.z <= 0 || this.hover > 0; }
  canAct() {
    return this.alive && this.hitstun <= 0 && !this.has('stun') && !this.has('charm') && this.grounded && !this.pull && !this.arcPull && !this.carry && !this.busy;
  }
  canMove() {
    return !this.has('stun') && !this.has('root') && this.hitstun <= 0 && (this.z <= 0 || this.ws.vault > 0) && !this.pull && !this.arcPull && !this.carry && !(this.ws.turret && !this.T('percy_12c:gatling')) && !this.ws.cling && !this.ws.burrow;
  }
  ultReady() { return this.weapon.skills.U && (this.weapon.ultReady ? this.weapon.ultReady(this) : this.rage >= this.rageNeed); }
  canUse(k, m) {
    const sk = this.weapon.skills[k];
    if (!sk) return false;
    if (sk.recast && sk.recast(this)) return this.alive && this.hitstun <= 0 && !this.has('stun') && (!this.busy || !!sk.recastBusy);
    if (k === 'C' && this.T('it_titan') && isMobility(sk)) return false;
    // kỹ năng phá khống chế (Bất Ngờ Chưa): dùng được cả khi bị choáng
    if (sk.breakCC) {
      if (!this.alive || this.z > 0 || this.cd[k] > 0 || this.carry) return false;
      return !(sk.can && !sk.can(this, m));
    }
    if (!this.canAct()) return false;
    if (this.hover > 0 && !sk.airOk) return false;
    if (this.cd[k] > 0) return false;
    if (this.has('silence') && k !== 'A' && k !== 'E') return false;
    if (this.has('nodash') && isMobility(sk)) return false;
    if (k === 'U' && !this.ultReady()) return false;
    if (sk.can && !sk.can(this, m)) return false;
    return true;
  }
  tryUse(k, m) {
    if (!this.canUse(k, m)) return false;
    const sk = this.weapon.skills[k];
    if (sk.recast && sk.recast(this)) { sk.recastUse(this, m); return true; }
    if (sk.breakCC) { delete this.status.stun; delete this.status.root; delete this.status.charm; this.hitstun = 0; this.action = null; this.cancelDash(); }
    const W = this.weapon;
    if (k === 'U') { if (!W.noRage) this.rage = 0; m.onUlt(this); }
    sk.use(this, m);
    if (!sk.manualCd && sk.cd) {
      this.cd[k] = this.cdOf(k);
      if (sk.shared) this.cd[sk.shared] = Math.max(this.cd[sk.shared], this.cdOf(sk.shared));
      if (sk.group) for (const q in W.skills) if (W.skills[q].group === sk.group) this.cd[q] = Math.max(this.cd[q], this.cdOf(q));
    }
    if (W.onUse) W.onUse(this, k, m);
    talEach(this, 'onUse', this, k, m);
    this.intent = null;
    m.onSkill(this, k);
    if (this.action && this.action.anim === 'spin' && m.sfx) m.sfx('spin', { vol: 0.55 });
    if (this.action && this.action.charge > 0.5 && m.sfx) m.sfx('energy_charge', { vol: 0.5 });
    return true;
  }

  // ---- cập nhật ----
  update(dt, m) {
    if (this.dead) return;
    if (this.falling > 0) {
      this.falling -= dt; this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.falling <= 0) m.onKO(this);
      return;
    }
    if (this.respawnT > 0) { this.respawnT -= dt; if (this.respawnT <= 0) m.respawn(this); return; }
    this.frameSpeed = 1; this.frameWeight = 1;
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    // trạng thái
    for (const k in this.status) {
      const s = this.status[k];
      s.t -= dt;
      if (k === 'burn' || k === 'poison' || k === 'bleed' || k === 'hellfire' || k === 'ash') {
        const d = s.p * dt * this.takenMult;
        this.percent += d; this.stats.taken += d;
      }
      if (k === 'regen' && !this.status.wound) this.percent = Math.max(0, this.percent - s.p * dt);
      if (s.t <= 0) {
        if (k === 'shield' && s.p > 0.5 && this.T('aria_3c')) { this.percent = Math.max(0, this.percent - s.p); m.text(this.x, this.y - 44, `💚 -${s.p.toFixed(0)}%`, '#7aff9a', 14); }
        delete this.status[k];
      }
    }
    // Hỏa Hồn Bùng Cháy (Ignatius): đang cháy thì hồi chiêu chậm 25%
    const cdt = this.status.burn && this.status.burn.ign ? dt * 0.75 : dt;
    for (const k in this.cd) if (this.cd[k] > 0 && this.cd[k] < 90) this.cd[k] = Math.max(0, this.cd[k] - cdt);
    for (const k in this.icd) if (this.icd[k] > 0) this.icd[k] -= dt;
    if (this.hitstun > 0) this.hitstun -= dt;
    if (this.invulnT > 0) this.invulnT -= dt;
    if (this.marks) { this.marks.t -= dt; if (this.marks.t <= 0) { const o = this.marks.owner; this.marks = null; if (o.weapon.marksEnd) o.weapon.marksEnd(o, this, m); } }
    if (this.gunMark) { this.gunMark.t -= dt; if (this.gunMark.t <= 0) this.gunMark = null; }
    if (this.weapon.update) this.weapon.update(this, m, dt);
    talEach(this, 'update', this, m, dt);
    const still = !this.dash && Math.abs(this.vx) + Math.abs(this.vy) < 30 && (!(this.moveDir.x || this.moveDir.y) || (this.action && this.action.move === 0));
    this.stillT = still ? this.stillT + dt : 0;
    if (this.dead || this.falling > 0) return;
    // hành động theo dòng thời gian
    const a = this.action;
    if (a) {
      a.t += dt;
      while (a.ei < a.events.length && a.events[a.ei][0] <= a.t) { const ev = a.events[a.ei++]; ev[1](); if (this.action !== a) break; }
      if (this.action === a && a.t >= a.dur) {
        this.action = null;
        if (a.onEnd) a.onEnd();
        if (a.then) a.then();
      }
    }
    // lực văng bị trì hoãn (đóng đinh)
    if (this.pendingKnock) {
      this.pendingKnock.t -= dt;
      if (this.pendingKnock.t <= 0) { this.vx = this.pendingKnock.vx; this.vy = this.pendingKnock.vy; this.hitstun = Math.max(this.hitstun, this.pendingKnock.hs); this.pendingKnock = null; }
    }
    // trục z (bị hất tung / nhảy / bám tường / chống thương bay)
    if (this.hover > 0) { this.z = lerp(this.z, this.hover, Math.min(1, dt * 12)); this.vz = 0; }
    else if (this.z > 0 || this.vz !== 0) {
      this.vz -= GRAVITY * dt; this.z += this.vz * dt;
      if (this.z <= 0) { this.z = 0; this.vz = 0; }
    }
    // bị ủi theo (Trường Thương)
    if (this.carry) {
      const by = this.carry.by;
      if (!by.dash || !by.alive || this.carry.t <= 0) { this.carry = null; }
      else {
        this.carry.t -= dt;
        const p = fromAng(by.facing, by.r + this.r + 4);
        this.x = by.x + p.x; this.y = by.y + p.y; this.vx = this.vy = 0;
        m.collideWalls(this);
        return;
      }
    }
    // bị kéo theo vòng cung (Liềm)
    if (this.arcPull) {
      const p = this.arcPull, by = p.by;
      p.t += dt;
      const k = Math.min(1, p.t / p.dur);
      const ang = p.a0 + p.da * k, r = lerp(p.r0, p.r1, k);
      const q = m.arena.clamp({ x: by.x + Math.cos(ang) * r, y: by.y + Math.sin(ang) * r }, 8);
      this.x = q.x; this.y = q.y; this.vx = this.vy = 0;
      if (k >= 1 || !by.alive) this.arcPull = null;
      m.collideWalls(this);
      return;
    }
    // di chuyển chủ động (bị chặn ở mép sàn)
    let mx = 0, my = 0;
    if (this.dash) {
      const d = this.dash;
      if (d.t === 0 && d.trail && true) vfx(m, 'puff', this.x, this.y + this.r * 0.5, 22, null, { life: 0.4, tint: '#e0d8c8', alpha: 0.8 });
      mx = d.vx; my = d.vy; d.t += dt;
      if (d.trail && random() < 0.6) m.fx({ type: 'ghost', x: this.x, y: this.y, r: this.r, color: this.color, life: 0.18 });
      if (d.onContact) {
        for (const e of m.enemiesOf(this)) {
          if (e.z > 30 || e === this.ws.carry) continue;
          if (Math.hypot(e.x - this.x, e.y - this.y) < this.r + e.r + 6) { if (d.onContact(e)) { this.cancelDash(); break; } }
        }
      }
      if (this.dash === d && d.t >= d.dur) this.cancelDash();
    } else if (this.pull) {
      const p = this.pull, by = p.by;
      p.t -= dt;
      const dd = dist(this, by);
      if (dd <= p.stop || p.t <= 0 || !by.alive) this.pull = null;
      else { const a2 = angTo(this, by); mx = Math.cos(a2) * p.speed; my = Math.sin(a2) * p.speed; }
    } else if (this.canMove()) {
      const mult = this.action ? this.action.move : 1;
      const sp = this.speed * mult;
      mx = this.moveDir.x * sp; my = this.moveDir.y * sp;
    }
    if (mx || my) {
      const inside = m.arena.inside(this.x, this.y, 0);
      const nx = this.x + mx * dt, ny = this.y + my * dt;
      if (inside) {
        const margin = this.pull ? 0 : 4;
        if (!m.arena.inside(nx, ny, margin)) {
          const p = m.arena.clamp({ x: nx, y: ny }, margin);
          this.x = p.x; this.y = p.y;
          if (this.dash && this.dash.stopAtEdge) this.cancelDash();
        } else { this.x = nx; this.y = ny; }
      }
    }
    // lực văng
    if (this.vx || this.vy) {
      this.x += this.vx * dt; this.y += this.vy * dt;
      const k = Math.exp(-KB_FRICTION * m.arena.fric * dt);
      this.vx *= k; this.vy *= k;
      if (Math.abs(this.vx) + Math.abs(this.vy) < 4) { this.vx = 0; this.vy = 0; }
      if (this.hitstun > 0 && Math.hypot(this.vx, this.vy) > 500 && random() < 0.5)
        m.particle(this.x, this.y, { color: '#ffffff', life: 0.35, size: 4, vx: rand(-30, 30), vy: rand(-30, 30) });
    }
    m.collideWalls(this);
    // rơi khỏi sàn
    if (this.z <= 0) {
      const e = m.arena.edgeDist(this.x, this.y);
      if (e < 0) {
        // vùng chênh vênh: lọt ra ngoài chưa quá LEDGE px thì còn bám mép leo lên được
        const sp = Math.hypot(this.vx, this.vy);
        if (e < -(m.ledge ?? LEDGE)) m.startFall(this);
        else if (sp < 70 && !this.pendingKnock) {
          const p = m.arena.clamp({ x: this.x, y: this.y }, 6); this.x = p.x; this.y = p.y; this.vx = this.vy = 0;
          this.act(0.3, { move: 0 }); m.text(this.x, this.y - 34, 'bám mép!', '#cfd8e0', 12);
        }
      }
    }
  }

  // ---- vẽ ----

}

// ===== Thực thể triệu hồi (Oktava, Ụ pháo, T-Zero) =====
class Minion extends Fighter {
  constructor(owner, kind, x, y, name) {
    const oc = owner.cfg;
    super({ name: name || WEAPONS[kind].name, weapon: kind, color: WEAPONS[kind].color, stats: oc.stats, skills: oc.skills, tech: oc.tech, equip: {}, balOf: owner.charId }, owner.team);
    this.owner = owner; this.isMinion = true; this.kind = kind;
    this.x = x; this.y = y; this.stocks = 1; this.life = WEAPONS[kind].life || Infinity;
    this.facing = owner.facing;
  }
}




// Vẽ vũ khí trong hệ tọa độ của đấu sĩ (đã xoay theo hướng nhìn)
