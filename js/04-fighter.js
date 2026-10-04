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
      if (d.t === 0 && d.trail && (m === G.match || m === G.demo)) vfx(m, 'puff', this.x, this.y + this.r * 0.5, 22, null, { life: 0.4, tint: '#e0d8c8', alpha: 0.8 });
      mx = d.vx; my = d.vy; d.t += dt;
      if (d.trail && Math.random() < 0.6) m.fx({ type: 'ghost', x: this.x, y: this.y, r: this.r, color: this.color, life: 0.18 });
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
      if (this.hitstun > 0 && Math.hypot(this.vx, this.vy) > 500 && Math.random() < 0.5)
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
  draw(ctx, m) {
    if (this.dead || this.respawnT > 0 || this.hidden) return;
    const fall = this.falling > 0 ? clamp(this.falling / 0.8, 0, 1) : 1;
    const zy = this.z * 0.6;
    ctx.save();
    if (this.falling <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(this.x, this.y + 6, this.r * (1 - Math.min(this.z, 200) / 400), this.r * 0.55, 0, 0, TAU); ctx.fill();
    }
    ctx.translate(this.x, this.y - zy);
    ctx.scale(fall, fall);
    ctx.globalAlpha = fall * (this.has('invis') ? 0.13 : this.invulnT > 0 || this.has('untargetable') ? 0.55 : 1);
    if (this.has('berserk') || this.has('feral')) {
      ctx.fillStyle = this.has('feral') ? 'rgba(20,0,10,0.55)' : 'rgba(255,30,30,0.25)';
      ctx.beginPath(); ctx.arc(0, 0, this.r + 10 + Math.sin(m.time * 15) * 3, 0, TAU); ctx.fill();
    }
    const ring = this.has('immortal') ? '#ffd700' : this.has('parry') ? '#ffffff' : this.has('block') ? '#9ec9ff' : this.has('stance') ? '#d0a070'
      : this.has('absorb') ? '#ffb07a' : this.has('rarmor') ? '#ffb030' : this.has('shield') ? '#9effd0'
      : this.T('valerius_6c') && this.stillT > 1 ? '#c0e0ff' : null;
    if (ring) {
      ctx.strokeStyle = ring; ctx.lineWidth = 3; ctx.globalAlpha *= 0.8;
      ctx.beginPath(); ctx.arc(0, 0, this.r + 8 + Math.sin(m.time * 12) * 2, 0, TAU); ctx.stroke();
      ctx.globalAlpha = fall;
    }
    if (this.action && this.action.charge) {
      const p = clamp(this.action.t / this.action.charge, 0, 1);
      ctx.strokeStyle = this.weapon.color; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, this.r + 14, -Math.PI / 2, -Math.PI / 2 + TAU * p); ctx.stroke();
      if (p >= 1) { ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(0, 0, this.r + 14, 0, TAU); ctx.fill(); }
    }
    if (this.action && this.action.windup && this.action.t < this.action.windup) {
      ctx.strokeStyle = 'rgba(255,230,120,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, this.r + 4 + (this.action.t / this.action.windup) * 12, 0, TAU); ctx.stroke();
    }
    ctx.rotate(this.facing);
    drawWeapon(ctx, this, m);
    const hurt = this.hurtFlash > 0;
    const g = ctx.createRadialGradient(-5, -6, 3, 0, 0, this.r);
    g.addColorStop(0, hurt ? '#ffffff' : lighten(this.color, 0.45));
    g.addColorStop(1, hurt ? '#ffbbbb' : this.has('feral') ? '#201018' : this.color);
    ctx.fillStyle = g;
    if (this.weapon.boxy) { roundRect(ctx, -this.r, -this.r, this.r * 2, this.r * 2, 8); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, 0, this.r, 0, TAU); ctx.fill(); }
    ctx.lineWidth = 3; ctx.strokeStyle = this.team === 0 ? '#ffffff' : '#20232a'; ctx.stroke();
    // hóa đá (Định Thân Thuật)
    if (this._stoneUntil > m.time) { ctx.fillStyle = 'rgba(150,150,150,0.75)'; ctx.fill(); ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = this.has('berserk') ? '#ff2020' : '#111';
    const ey = this.r * 0.33;
    ctx.beginPath(); ctx.arc(this.r * 0.5, -ey, 3, 0, TAU); ctx.arc(this.r * 0.5, ey, 3, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
    if (this.falling > 0) return;
    // linh hồn hộ thân (Death) • drone phòng vệ (Percy)
    if (this.ws.souls > 0) for (let i = 0; i < this.ws.souls; i++) {
      const p = fromAng(m.time * 3 + i * TAU / this.ws.souls, this.r + 16);
      ctx.globalAlpha = 0.75; ctx.fillStyle = '#c0b0ff'; ctx.beginPath(); ctx.arc(this.x + p.x, this.y - zy + p.y * 0.7, 6, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (this.ws.droneT > 0) {
      const dx = this.x + Math.cos(m.time * 4) * 14, dy = this.y - zy - this.r - 30 + Math.sin(m.time * 6) * 3;
      ctx.fillStyle = '#4ae0d0'; ctx.fillRect(dx - 8, dy - 3, 16, 6); ctx.strokeStyle = '#cff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(dx - 12, dy - 5); ctx.lineTo(dx - 4, dy - 5); ctx.moveTo(dx + 4, dy - 5); ctx.lineTo(dx + 12, dy - 5); ctx.stroke();
    }
    // Quạ Oca (Raven) bay lượn & quét laser đánh dấu
    const oca = this.ws.oca;
    if (oca) {
      const ox = oca.x + Math.cos(m.time * 2.2) * 26, oy = oca.y - 74 + Math.sin(m.time * 4) * 5, flap = Math.sin(m.time * 18) * 6;
      if (oca.target && oca.target.alive && Math.hypot(oca.target.x - oca.x, oca.target.y - oca.y) < 140) {
        ctx.strokeStyle = 'rgba(255,60,60,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(oca.target.x, oca.target.y); ctx.stroke();
      }
      ctx.fillStyle = '#20232e'; ctx.strokeStyle = '#8aa0c8'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ox - 16, oy - flap); ctx.lineTo(ox - 4, oy - 2); ctx.lineTo(ox + 10, oy); ctx.lineTo(ox - 4, oy + 3); ctx.lineTo(ox + 16, oy - flap); ctx.lineTo(ox + 2, oy - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(ox + 8, oy - 1, 1.8, 0, TAU); ctx.fill();
    }
    if (this.ocaMark && this.ocaMark.until > m.time) {
      ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(this.x, this.y - zy, this.r + 12, m.time * 2, m.time * 2 + TAU); ctx.stroke(); ctx.setLineDash([]);
    }
    // Hộp Ảo Thuật (Alice)
    if (this.ws.boxOn) {
      const s = this.r + 14;
      ctx.save(); ctx.translate(this.x, this.y - zy); ctx.rotate(Math.sin(m.time * 9) * 0.06);
      ctx.fillStyle = 'rgba(120,40,160,0.85)'; ctx.strokeStyle = '#ffe07a'; ctx.lineWidth = 3;
      ctx.fillRect(-s, -s, s * 2, s * 2); ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.fillStyle = '#ffe07a'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 1);
      ctx.restore();
    }
    if (this.has('invis')) return;
    if (this.marks) {
      for (let i = 0; i < 4; i++) {
        if (!this.marks.list[i]) continue;
        const p = fromAng(i * Math.PI / 2, 44);
        ctx.save(); ctx.translate(this.x + p.x, this.y + p.y - zy); ctx.rotate(m.time * 3);
        ctx.strokeStyle = '#ff9ad5'; ctx.lineWidth = 3;
        ctx.beginPath(); for (let j = 0; j < 4; j++) { const q = fromAng(j * Math.PI / 2, 9); j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.closePath(); ctx.stroke();
        ctx.restore();
      }
    }
    if (this.gunMark) {
      ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = 2;
      const R = 30;
      ctx.beginPath(); ctx.arc(this.x, this.y, R, 0, TAU);
      ctx.moveTo(this.x - R - 6, this.y); ctx.lineTo(this.x - R + 8, this.y); ctx.moveTo(this.x + R + 6, this.y); ctx.lineTo(this.x + R - 8, this.y);
      ctx.moveTo(this.x, this.y - R - 6); ctx.lineTo(this.x, this.y - R + 8); ctx.moveTo(this.x, this.y + R + 6); ctx.lineTo(this.x, this.y + R - 8);
      ctx.stroke();
      ctx.fillStyle = '#ff4a4a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${this.gunMark.hits}/${this.gunMark.need || 5}`, this.x + R + 4, this.y - R);
    }
    const y0 = this.y - zy - this.r - 16;
    ctx.textAlign = 'center';
    const small = this.isMinion && !this.fakeMain;
    ctx.font = `bold ${small ? 11 : 13}px "Segoe UI", sans-serif`;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(this.name, this.x, y0 - 14);
    ctx.fillStyle = this.team === 0 ? '#9fd3ff' : '#ffb0b0';
    ctx.fillText(this.name, this.x, y0 - 14);
    ctx.font = `bold ${small ? 13 : 17}px "Segoe UI", sans-serif`;
    const pc = `${Math.floor(this.percent)}%`;
    ctx.strokeText(pc, this.x, y0 + 2);
    ctx.fillStyle = percentColor(this.percent);
    ctx.fillText(pc, this.x, y0 + 2);
    const icons = Object.keys(this.status).filter((k) => STATUS[k] && k !== 'berserk').map((k) => k === 'bleed' ? `🩸${this.status.bleed.n}` : STATUS[k].icon);
    if (this.pull || this.arcPull) icons.push('🪝');
    if (icons.length) {
      ctx.font = '13px sans-serif';
      const w = icons.length * 17;
      icons.forEach((ic, i) => ctx.fillText(ic, this.x - w / 2 + 8 + i * 17, this.y + this.r + 18));
    }
  }
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

function percentColor(p) {
  if (p < 40) return '#ffffff';
  if (p < 80) return '#ffe066';
  if (p < 120) return '#ff9a3a';
  if (p < 170) return '#ff4a3a';
  return '#c01020';
}
function lighten(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * k); g = Math.round(g + (255 - g) * k); b = Math.round(b + (255 - b) * k);
  return `rgb(${r},${g},${b})`;
}

// Vẽ vũ khí trong hệ tọa độ của đấu sĩ (đã xoay theo hướng nhìn)
function drawWeapon(ctx, f, m) {
  const a = f.action, an = a && a.anim;
  const p = a ? clamp(a.t / Math.max(0.01, a.dur), 0, 1) : 0;
  let rot = 0, ext = 0;
  // vung mượt: tăng tốc nhanh rồi hãm dần (ease-out), cuối đòn thu kiếm về
  const eo = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  if (an === 'swing') rot = p < 0.6 ? lerp(-1.25, 1.25, eo(p / 0.45)) : lerp(1.25, 0.2, eo((p - 0.6) / 0.4));
  else if (an === 'thrust') ext = p < 0.35 ? eo(p / 0.35) * 18 : 18 * (1 - eo((p - 0.35) / 0.65));
  else if (an === 'spin') rot = eo(p * 1.15) * TAU;
  else if (an === 'raise') rot = p < 0.45 ? -1.4 * (p / 0.45) : lerp(-1.4, 0.3, Math.min(1, (p - 0.45) * 4));
  if (a && a.windup && a.t < a.windup) { rot = -1.3 * (a.t / a.windup); ext = 0; }
  const R = f.r / 18;
  ctx.save();
  ctx.scale(R, R);
  ctx.lineCap = 'round';
  switch (f.weapon.gfx) {
    case 'swordshield': {
      if (f.T('valerius_12b')) { ctx.rotate(rot); ctx.translate(ext, 0); blade(ctx, 6, 6, 58, 5, '#f4f6ff'); break; }
      ctx.save();
      const guard = an === 'guard';
      ctx.translate(guard ? 20 : 6, guard ? 0 : -16);
      ctx.fillStyle = '#4a78c0'; ctx.strokeStyle = '#d8e8ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 6, guard ? 18 : 13, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.rotate(rot); ctx.translate(ext, 0);
      blade(ctx, 10, 14, 44, 4, '#e8eef8');
      break;
    }
    case 'bow': {
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(10, 0, 20, -1.2, 1.2); ctx.stroke();
      const pull = an === 'draw' ? 8 + (a.charge ? clamp(a.t / a.charge, 0, 1) * 10 : 0) : 0;
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      const e1 = fromAng(-1.2, 20), e2 = fromAng(1.2, 20);
      ctx.beginPath(); ctx.moveTo(10 + e1.x, e1.y); ctx.lineTo(10 + e1.x - pull, 0); ctx.lineTo(10 + e2.x, e2.y); ctx.stroke();
      break;
    }
    case 'staff': {
      ctx.rotate(rot * 0.5);
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(34 + ext, 14); ctx.stroke();
      const ch = a && a.charge ? clamp(a.t / a.charge, 0, 1) : 0;
      ctx.fillStyle = '#ff8a2a'; ctx.shadowColor = '#ff6a1a'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(36 + ext, 14, 6 + ch * 8, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    case 'rapier':
      ctx.rotate(rot * 0.6); ctx.translate(ext * 1.4, 0);
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(14, 10, 5, 0, TAU); ctx.stroke();
      blade(ctx, 14, 10, 56, 2, '#f4f4ff');
      break;
    case 'dagger':
      ctx.rotate(rot); ctx.translate(ext, 0);
      blade(ctx, 12, 14, 24, 3, '#d8c8ff');
      blade(ctx, 12, -14, 22, 3, '#d8c8ff');
      break;
    case 'katana':
      ctx.rotate(rot); ctx.translate(ext, 0);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(8, 14); ctx.lineTo(18, 14); ctx.stroke();
      ctx.strokeStyle = '#f0f0f8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(18, 14); ctx.quadraticCurveTo(40, 16, 58, 8); ctx.stroke();
      break;
    case 'greatsword':
      ctx.rotate(rot); ctx.translate(ext, 0);
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(20, 14); ctx.stroke();
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, 5); ctx.lineTo(20, 23); ctx.stroke();
      blade(ctx, 20, 14, 92, 7, '#f0e8c8');
      ctx.strokeStyle = 'rgba(255,220,100,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(90, 14); ctx.lineTo(112, 14); ctx.stroke();
      break;
    case 'pistol': case 'revolver':
      ctx.translate(-ext * 0.3, 0);
      ctx.fillStyle = '#3a3d44'; ctx.fillRect(14, 8, 22, 7); ctx.fillStyle = '#6a5040'; ctx.fillRect(12, 12, 6, 10);
      ctx.fillStyle = f.weapon.gfx === 'revolver' ? '#c0a080' : '#9aa0a8'; ctx.fillRect(34, 9, 6, 4);
      if (f.weapon.gfx === 'revolver') { ctx.beginPath(); ctx.arc(22, 11, 5, 0, TAU); ctx.fillStyle = '#8a7050'; ctx.fill(); }
      break;
    case 'staff': {
      // Côn Kim Cô: thân đỏ, 2 đầu bịt vàng; đứng trên đỉnh côn thì côn dựng đứng và dài ra
      const pole = f.ws.pole;
      if (pole) { const L = 40 + 60 * clamp(pole.t / 3, 0, 1); ctx.rotate(-f.facing); ctx.fillStyle = '#b02a1a'; ctx.fillRect(-3, 0, 6, L); ctx.fillStyle = '#ffd24a'; ctx.fillRect(-4, L - 6, 8, 8); break; }
      ctx.rotate(rot); ctx.translate(ext, 0);
      ctx.fillStyle = '#b02a1a'; ctx.fillRect(-26, -3, 92, 6);
      ctx.fillStyle = '#ffd24a'; ctx.fillRect(-30, -4, 9, 8); ctx.fillRect(60, -4, 9, 8);
      break;
    }
    case 'twinblades':
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(0, s * 11); ctx.rotate(rot * (s > 0 ? 1 : -1) * (an === 'spin' ? 1 : 0.8)); ctx.translate(ext, 0);
        blade(ctx, 8, 0, 36, 3, s > 0 ? '#e8f4ff' : '#b8d8ff');
        ctx.restore();
      }
      break;
    case 'rifle':
      ctx.translate(-ext * 0.4, 0);
      ctx.fillStyle = '#2a2e38'; ctx.fillRect(6, 5, 46, 6); ctx.fillRect(10, 9, 8, 9);
      ctx.fillStyle = '#4a5468'; ctx.fillRect(20, 1, 14, 4);
      ctx.fillStyle = '#8aa0c8'; ctx.fillRect(50, 6, 8, 3);
      if (an === 'aim') { ctx.strokeStyle = 'rgba(255,60,60,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(58, 7); ctx.lineTo(260, 7); ctx.stroke(); }
      break;
    case 'gloves': {
      const k = an === 'throw' ? Math.sin(p * Math.PI) * 14 : 0;
      for (const s of [-1, 1]) {
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#c070e0'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(14 + ext + (s > 0 ? k : 0), s * 13, 6, 0, TAU); ctx.fill(); ctx.stroke();
      }
      if (an === 'throw' || an === 'thrust') { ctx.fillStyle = '#ffe07a'; ctx.fillRect(22 + ext + k, 9, 9, 6); }
      break;
    }
    case 'dual':
      ctx.fillStyle = '#3a3d44'; ctx.fillRect(14, 8, 20, 6); ctx.fillRect(14, -14, 20, 6);
      ctx.fillStyle = f.ws.stance === 'neo' ? '#6af0ff' : '#d0a050'; ctx.fillRect(32, 9, 5, 4); ctx.fillRect(32, -13, 5, 4);
      break;
    case 'crossbow': {
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(10, -3, 30, 6);
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(30, 0, 16, -1.3, 1.3); ctx.stroke();
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath();
      const e1 = fromAng(-1.3, 16), e2 = fromAng(1.3, 16);
      ctx.moveTo(30 + e1.x, e1.y); ctx.lineTo(20, 0); ctx.lineTo(30 + e2.x, e2.y); ctx.stroke();
      break;
    }
    case 'fist': {
      const punch = an === 'thrust' || an === 'swing' ? Math.sin(Math.min(1, p * 2) * Math.PI) * 14 : 0;
      ctx.fillStyle = '#ff9a6a'; ctx.strokeStyle = '#5a2a1a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(18 + punch, 11, 7, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(16, -11, 7, 0, TAU); ctx.fill(); ctx.stroke();
      break;
    }
    case 'claw':
      ctx.rotate(rot * 0.7);
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 2;
      for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(16, s * 12 + i * 3); ctx.lineTo(30 + ext, s * 12 + i * 5); ctx.stroke(); }
      break;
    case 'shotgun':
      ctx.translate(-ext * 0.4, 0);
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(4, 8, 14, 8);
      ctx.fillStyle = '#2a2a30'; ctx.fillRect(16, 7, 26, 5); ctx.fillRect(16, 12, 26, 4);
      break;
    case 'scythe':
      ctx.rotate(rot);
      if (f.ws.thrown) break;
      ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(60, 14); ctx.stroke();
      ctx.strokeStyle = '#d0d0e0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(46, -8, 24, -0.2, 1.2); ctx.stroke();
      break;
    case 'spear':
      ctx.rotate(rot * 0.4); ctx.translate(ext * 1.6, 0);
      ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-20, 12); ctx.lineTo(80, 12); ctx.stroke();
      ctx.fillStyle = '#e0e0e8'; ctx.beginPath(); ctx.moveTo(96, 12); ctx.lineTo(80, 5); ctx.lineTo(80, 19); ctx.fill();
      break;
    case 'voice':
      ctx.fillStyle = '#7ae0a0'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('♪', 24, -10 + Math.sin(m.time * 6) * 3); ctx.fillText('♫', 22, 18 + Math.cos(m.time * 6) * 3);
      break;
    case 'wrench':
      ctx.rotate(rot * 0.6);
      ctx.strokeStyle = '#a0a8b0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, 14); ctx.lineTo(34, 14); ctx.stroke();
      ctx.beginPath(); ctx.arc(36, 14, 5, 0.6, TAU - 0.6); ctx.stroke();
      ctx.fillStyle = '#3a3d44'; ctx.fillRect(12, -16, 18, 6);
      break;
    case 'commander': {
      const md = f.ws.stance;
      if (md === 'flag') {
        ctx.rotate(rot * 0.8); ctx.translate(ext, 0);
        ctx.strokeStyle = '#d0b070'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, 10); ctx.lineTo(52, 10); ctx.stroke();
        ctx.fillStyle = '#e04a4a'; ctx.beginPath(); ctx.moveTo(52, 10); ctx.lineTo(36, -12); ctx.lineTo(30, 6); ctx.fill();
        ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(40, -2, 3, 0, TAU); ctx.fill();
      } else if (md === 'ar') {
        ctx.translate(-ext * 0.4, 0);
        ctx.fillStyle = '#2a2e38'; ctx.fillRect(6, 6, 40, 6); ctx.fillRect(12, 10, 7, 8); ctx.fillStyle = '#e04a4a'; ctx.fillRect(22, 3, 10, 3);
      } else {
        ctx.translate(-ext * 0.3, 0);
        ctx.fillStyle = '#3a3d44'; ctx.fillRect(12, 8, 22, 6); ctx.fillRect(12, 12, 6, 8); ctx.fillStyle = '#c0c8d8'; ctx.fillRect(32, 9, 5, 4);
      }
      break;
    }
    case 'trooper': {
      const o = f.owner, md = o && o.ws.stance, rage = f.ws.rage > (m ? m.time : 0);
      if (f.ws.heavy) { ctx.fillStyle = '#4a4a50'; ctx.fillRect(6, 4, 34, 9); ctx.fillStyle = '#ff7a3a'; ctx.fillRect(38, 5, 4, 7); }
      else if (md === 'ar' && !rage) { ctx.fillStyle = '#2a2e38'; ctx.fillRect(6, 6, 30, 5); ctx.fillRect(10, 9, 5, 6); }
      else { ctx.rotate(rot); ctx.translate(ext, 0); blade(ctx, 6, 8, md === 'flag' || rage ? 40 : 30, md === 'flag' || rage ? 5 : 3, '#e8eef8'); }
      break;
    }
    case 'cards': {
      const k = an === 'throw' ? Math.sin(p * Math.PI) * 12 : 0, card = f.ws.card;
      ctx.translate(16 + ext + k, 8); ctx.rotate(0.3);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#806020'; ctx.lineWidth = 1; ctx.fillRect(i * 3, -i * 2, 9, 13); ctx.strokeRect(i * 3, -i * 2, 9, 13); }
      if (card) { ctx.fillStyle = JK_COL[card]; ctx.fillRect(8, -2, 5, 5); }
      break;
    }
    case 'fan': {
      ctx.rotate(rot * 0.9); ctx.translate(ext + 14, 6);
      const open = an === 'swing' || an === 'spin' ? 1.3 : 0.7;
      ctx.fillStyle = '#9ad0c0'; ctx.strokeStyle = '#2a4a40'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 24, -open, open); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#e0f0ea'; ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) { const q = fromAng(i * open / 2.2, 24); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      break;
    }
    case 'flask': {
      if (f.ws.beast > 0 || f.T('galo_12a')) {
        ctx.rotate(rot * 0.7); ctx.strokeStyle = '#a0ff6a'; ctx.lineWidth = 2.5;
        for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(14, s * 12 + i * 3); ctx.lineTo(32 + ext, s * 12 + i * 6); ctx.stroke(); }
      } else {
        const k = an === 'throw' ? Math.sin(p * Math.PI) * 12 : 0;
        ctx.fillStyle = 'rgba(120,230,70,0.85)'; ctx.strokeStyle = '#d0ffd0'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(20 + ext + k, 10, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#806040'; ctx.fillRect(18 + ext + k, 0, 4, 5);
      }
      break;
    }
    case 'mech': {
      const punch = an === 'swing' || an === 'thrust' ? Math.sin(Math.min(1, p * 2) * Math.PI) * 10 : 0;
      ctx.fillStyle = '#6a7080'; ctx.strokeStyle = '#20232a'; ctx.lineWidth = 2;
      ctx.fillRect(10 + punch, 12, 18, 12); ctx.strokeRect(10 + punch, 12, 18, 12);
      ctx.fillRect(10, -24, 18, 12); ctx.strokeRect(10, -24, 18, 12);
      if (f.ws.flame > 0) { ctx.fillStyle = 'rgba(255,140,40,0.7)'; ctx.beginPath(); ctx.moveTo(28, -18); ctx.lineTo(80, -40); ctx.lineTo(80, 4); ctx.fill(); }
      break;
    }
    case 'cannon':
      ctx.fillStyle = '#444a55'; ctx.fillRect(4, -5, 22, 10);
      break;
    case 'guardian': {
      const punch = an === 'swing' || an === 'thrust' ? Math.sin(Math.min(1, p * 2) * Math.PI) * 10 : 0;
      ctx.fillStyle = '#3a8a5a'; ctx.beginPath(); ctx.arc(16 + punch, 12, 7, 0, TAU); ctx.arc(16, -12, 7, 0, TAU); ctx.fill();
      break;
    }
    case 'cyborg': {
      const punch = an === 'swing' || an === 'thrust' ? Math.sin(Math.min(1, p * 2) * Math.PI) * 12 : 0;
      ctx.fillStyle = '#c08a30'; ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 2;
      ctx.fillRect(12 + punch, 6, 14, 12); ctx.strokeRect(12 + punch, 6, 14, 12);
      ctx.fillRect(12, -18, 14, 12); ctx.strokeRect(12, -18, 14, 12);
      ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(-4, 0, 5, 0, TAU); ctx.fill();
      break;
    }
    case 'siege':
      ctx.fillStyle = '#4a4f5a'; ctx.fillRect(4, -14, 34, 9); ctx.fillRect(4, 5, 34, 9);
      ctx.fillStyle = '#ffb030'; ctx.fillRect(36, -13, 4, 7); ctx.fillRect(36, 6, 4, 7);
      break;
  }
  ctx.restore();
}
function blade(ctx, x, y, len, w, color) {
  ctx.strokeStyle = '#333'; ctx.lineWidth = w + 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
}
