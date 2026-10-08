'use strict';
// ===== Bộ não AI của đấu sĩ (HLV không điều khiển trực tiếp) =====
// Tâm trạng: điểm văng bản thân cao → thận trọng, giữ giữa sân; đối thủ điểm cao → dồn ép kết liễu.
// Mỗi nhân vật trong ROSTER có thêm thói quen riêng (profile).
// Cấp "Tư duy" = kỹ thuật Chiến thuật (tech.tactic 1-10): càng cao càng biết dụ đòn, kẹp góc, phá tụ lực, lấy góc bắn.

// Chiêu tiếp cận (lướt / dịch chuyển / vồ / tăng tốc): dùng để áp sát, không cần phải vào tầm đánh. self = buff không cần hướng
const BRAIN_OFF = {};
// vũ khí hợp lối dụ đòn — bắt bài (giữ khoảng cách rồi phản công)
const BAITERS = new Set(['kiem_khien', 'kiem_dai', 'rapier', 'katana', 'thuong', 'nam_tay', 'liem', 'sung_san']); // công tắc thử nghiệm (tắt từng hành vi khi mô phỏng cân bằng)
const GAP_SKILLS = {
  katana: [{ k: 'C', min: 100, max: 330 }],
  rapier: [{ k: 'E', min: 90, max: 240 }, { k: 'A', min: 140, max: 300 }],
  dao: [{ k: 'C', min: 150, max: 420, self: true }, { k: 'B', min: 90, max: 230 }],
  vuot: [{ k: 'D', min: 70, max: 300 }],
  nam_tay: [{ k: 'D', min: 60, max: 250 }],
  thuong: [{ k: 'B', min: 130, max: 360 }],
  kiem_khien: [{ k: 'D', min: 110, max: 230, self: true }],
  liem: [{ k: 'D', min: 130, max: 300 }],
  song_luc: [{ k: 'C', min: 120, max: 320, when: (f) => f.ws.stance === 'chrono' }],
  sung_san: [{ k: 'C', min: 150, max: 380 }],
  mech: [{ k: 'C', min: 130, max: 340 }],
};
// Chiêu tầm xa (để kẹp góc / phá tụ lực)
const POKE_SKILLS = {
  katana: [{ k: 'D', max: 440 }],
  liem: [{ k: 'D', min: 100, max: 290 }],
  rapier: [{ k: 'D', max: 440 }, { k: 'B', max: 220 }],
  dao: [{ k: 'D', min: 50, max: 400 }],
  sung_san: [{ k: 'D', max: 340 }],
  cung: [{ k: 'B', min: 140, max: 600 }, { k: 'A', max: 460 }],
  no: [{ k: 'A', max: 480 }],
  truong: [{ k: 'B', min: 120, max: 470 }, { k: 'A', max: 430 }],
  sung: [{ k: 'A', max: 520 }],
  luc_xoay: [{ k: 'A', max: 480 }],
  song_luc: [{ k: 'A', max: 470 }],
  hand: [{ k: 'A', max: 450 }],
  ban_tia: [{ k: 'B', min: 150, max: 740 }, { k: 'A', max: 450 }],
  ao_thuat: [{ k: 'A', max: 320 }],
  con: [{ k: 'B', min: 60, max: 150 }],
};
// pháp tuyến hướng ra ngoài mép sàn tại điểm p (dùng để biết đánh hướng nào thì đẩy đối thủ ra mép)
function edgeNormal(A, p) {
  const gx = A.edgeDist(p.x + 6, p.y) - A.edgeDist(p.x - 6, p.y), gy = A.edgeDist(p.x, p.y + 6) - A.edgeDist(p.x, p.y - 6);
  const L = Math.hypot(gx, gy) || 1;
  return { x: -gx / L, y: -gy / L };
}
class Brain {
  constructor(f, tech, tactic, charId) {
    this.f = f;
    this.tech = Object.assign({ reflex: 1, dodge: 1, tactic: 1, aim: 1 }, tech);
    this.setTactic(tactic || 'balanced');
    this.pid = charId || (CHAR_BY_WEAPON[f.weaponId] && CHAR_BY_WEAPON[f.weaponId].id) || null;
    this.thinkT = rand(0, 0.2);
    this.strafe = Math.random() < 0.5 ? 1 : -1;
    this.strafeT = rand(1, 3);
    this.shout = null;
    this.lastSeen = null;
    this.idleT = 0; this.retreatT = 0;
    this.danger = 0; this.opp = 0; this.moodAggr = 1; this.moodDef = 1;
    f.brain = this;
  }
  setTactic(id) { this.tacticId = id; this.tac = TACTICS[id] || TACTICS.balanced; }
  // Trí Tuệ: phản ứng nhanh hơn (Trí Tuệ 5 = chuẩn), đọc đòn tốt hơn
  get wis() { return this.f.wis ?? 5; }
  // Tiến lên!: phớt lờ mọi thứ (né, lùi, sợ mép, thế thủ đối phương), lao vào đánh tới cùng
  get allIn() { return !!(this.shout && this.shout.type === 'attack') || (this.f.weaponId === 'binh_doc' && this.f.ws.beast > 0 && !this.f.T('galo_12a')); }
  // Koda mang Bản Nhạc Của Aria: vẫn nghe lệnh khi Hóa Điên
  get tame() { return this.f.charId === 'koda' && this.f.T('it_ariasong'); }
  get wisK() { return 0.85 + this.wis * 0.03; }
  get interval() { return clamp((0.36 - this.tech.reflex * 0.026) * (1.12 - this.wis * 0.024), 0.08, 0.42); }
  get accuracy() { return this.f.has('blind') ? 0.2 : clamp(0.25 + this.tech.aim * 0.075, 0.25, 1); }
  get flag() { return this.tacEff.flag; }
  holdTime(max, f) {
    const t = f && this.target;
    if ((this.flag === 'fullCharge' || this._fullCharge || (this.cmd && this.cmd.full)) && !(t && dist(f, t) < 110)) return max;
    let k = rand(0.45, 1);
    if (t && dist(f, t) < 120) k = rand(0.25, 0.5);
    k = Math.min(1, k + this.tech.aim * 0.03);
    return max * k;
  }
  // nhận mệnh lệnh của HLV
  // Tín Nhiệm: <40 có thể phớt lờ • <60 chần chừ (tối đa ~1.2s) • ≥80 làm ngay lập tức
  order(id, m) {
    const f = this.f, tr = f.trust ?? 60;
    if (Math.random() < Math.max(0, (40 - tr) / 100)) { m.text(f.x, f.y - 70, '🙄 Không nghe!', '#ffb030', 15); return false; }
    const lag = Math.max(0, (60 - tr) / 60) * rand(0.7, 1.3) * 1.2;
    if (lag > 0.1) { this.pendOrder = { id, at: m.time + lag }; m.text(f.x, f.y - 70, '…', '#cccccc', 16); return true; }
    return this.exec(id, m);
  }
  exec(id, m) {
    const C = COMMANDS[id] || { basic: true };
    // lệnh dùng trang bị kích hoạt: dùng ngay nếu sẵn sàng, không thì chờ tối đa 4s
    if (C.itemUse) { this.itemOrder = { id: C.itemUse, until: m.time + 4 }; this.useItems(m, this.target || m.nearestEnemy(this.f), true); return true; }
    if (C.spellUse) {
      this.spellOrder = { id: C.spellUse, until: m.time + 3 }; this.useSpells(m, this.target || m.nearestEnemy(this.f), true);
      // Joker mê phép: HLV càng hay dùng phép, cô càng tin HLV
      if (this.f.charId === 'joker') { m._joy = (m._joy || 0) + 1; m.text(this.f.x, this.f.y - 92, '🃏 Joker thích lắm!', '#ffd24a', 14); if (m._joy <= 3 && m.opts.onTrust) m.opts.onTrust(this.f.team, 1); }
      return true;
    }
    if (C.mode) { this.cmd = Object.assign({ id }, C, { t: C.dur || 8 }); return true; }
    if (C.basic) {
      this.shout = { type: id, t: id === 'ult' ? 3 : id === 'attack' ? 8 : 4, ko: m.fighters.reduce((s, x) => s + x.stocks, 0) };
      if (id === 'attack') { this.retreatT = 0; this.bait = null; this.seq = null; m.text(this.f.x, this.f.y - 70, '🔥 TẤT TAY!', '#ff6a3a', 16); }
      return true;
    }
    if (C.disobey && Math.random() < C.disobey) { if (m) m.text(this.f.x, this.f.y - 70, '🎲 Phớt lờ HLV!', '#ffb030', 15); return false; }
    // lệnh combo: tiếp cận rồi tung đúng chuỗi chiêu
    if (C.seq) { this.startSeq(C.seq, m, { anyRange: C.anyRange, full: C.full, label: C.name, wait: 5 }); return true; }
    this.cmd = Object.assign({ id }, C, { t: C.dur || 3 });
    // Tín Nhiệm cao: tung chiêu ngay trong khung hình này
    if (this.f.trust >= 80 && this.target && this.f.alive) this.runCommand(m, this.target, dist(this.f, this.target));
    return true;
  }
  // ----- chuỗi combo -----
  startSeq(keys, m, o = {}) {
    this.seq = { keys, i: 0, until: m.time + (o.wait || 2.5), anyRange: !!o.anyRange, full: !!o.full, label: o.label || keys.join('') };
  }
  // thực hiện bước kế tiếp của combo; trả true nếu đã ra chiêu
  runSeq(m, t, d) {
    const f = this.f, s = this.seq, W = f.weapon;
    if (m.time > s.until) { this.seq = null; return false; }
    const k = s.keys[s.i], sk = W.skills[k];
    if (!sk) { this.seq = null; return false; }
    if (!f.canUse(k, m)) return false;
    const recast = sk.recast && sk.recast(f);
    // bước đầu cần vào tầm của chiêu (trừ combo tầm xa / chiêu lướt / tái kích hoạt)
    if (!s.anyRange && !recast && !isMobility(sk) && sk.ai && sk.ai.max && (d > sk.ai.max + 25 + (6 - this.wis) * 6 || d < (sk.ai.min || 0) - 30)) return false; // Trí Tuệ cao: chỉ mở combo khi chắc vào tầm
    const opt = {};
    if (isMobility(sk)) opt.cast = angTo(f, t);
    if (s.full) this._fullCharge = true;
    const ok = this.use(m, k, opt);
    this._fullCharge = false;
    if (!ok) return false;
    s.i++; s.until = m.time + 1.7;
    if (s.i >= s.keys.length) { this.seq = null; m.text(f.x, f.y - 66, `✔ ${s.label}`, f.team === 0 ? '#9fd3ff' : '#ffb0b0', 14); }
    return true;
  }
  get tacEff() { return this.f.has('berserk') ? TACTICS.aggressive : this.tac; }

  update(dt, m) {
    const f = this.f;
    if (!f.alive) { f.moveDir = { x: 0, y: 0 }; return; }
    if (this.shout) { this.shout.t -= dt; if (this.shout.t <= 0) this.shout = null; }
    if (this.cmd) { this.cmd.t -= dt; if (this.cmd.t <= 0) this.cmd = null; }
    if (f.has('berserk') && !this.tame) { this.shout = null; this.cmd = null; this.pendOrder = null; }
    // Tiến lên!: tất tay tới khi có người rơi đài (tối đa 8s)
    if (this.shout && this.shout.type === 'attack' && m.fighters.reduce((s, x) => s + x.stocks, 0) !== this.shout.ko) this.shout = null;
    if (this.pendOrder && m.time >= this.pendOrder.at) { const id = this.pendOrder.id; this.pendOrder = null; this.target = m.nearestEnemy(f); this.exec(id, m); }
    const t = this.teamTarget(m) || this.coopTarget(m) || m.nearestEnemy(f);
    this.target = t;
    // bị mê hoặc: tự đi về phía kẻ điều khiển
    if (f.has('charm') && f.charmTo && f.charmTo.alive) {
      const a = angTo(f, f.charmTo);
      f.moveDir = { x: Math.cos(a) * 0.75, y: Math.sin(a) * 0.75 }; f.facing = a;
      return;
    }
    if (this.idleT > 0) { this.idleT -= dt; f.moveDir = { x: 0, y: 0 }; return; }
    if (this.retreatT > 0) this.retreatT = this.allIn ? 0 : this.retreatT - dt;
    this.imm = this.findImmortal(m);
    if (t && f.actives && f.actives.length) this.useItems(m, t, true);
    if (f.spells && f.spells.length) this.useSpells(m, t, true);
    if (t) {
      const dark = m.dark && m.dark.owner.team !== f.team && dist(f, t) > 170;
      if (!t.has('untargetable') && !dark && !(f.has('blind') && dist(f, t) > 150)) this.lastSeen = { x: t.x, y: t.y };
      const look = this.lastSeen || t;
      if (!f.dash && !f.busy && (f.canMove() || f.ws.turret || f.ws.cling)) {
        const want = angTo(f, look);
        const turn = (7 + this.tech.reflex * 0.6) * dt;
        f.facing += clamp(angDiff(f.facing, want), -turn, turn);
      }
    }
    this.strafeT -= dt;
    if (this.strafeT <= 0) { this.strafe *= -1; this.strafeT = rand(0.8, 2.6); }
    this.thinkT -= dt;
    if (this.thinkT <= 0) {
      this.thinkT = this.interval * rand(0.8, 1.2);
      // Trí Tuệ thấp: canh khoảng cách lệch (đứng hụt tầm / lấn quá sâu); Trí Tuệ ≥9 canh chuẩn
      if ((this.spaceT = (this.spaceT || 0) - 1) <= 0) { this.spaceT = 4; this.spaceErr = rand(-1, 1) * Math.max(0, 9 - this.wis) * 0.035; }
      if (t) this.think(m, t);
    }
    if (t) this.steer(m, t, dt); else steerToward(f, m, 0, 0, 30);
  }

  // ----- dùng chiêu -----
  use(m, k, opt = {}) {
    const f = this.f, t = this.target, look = this.lastSeen || t;
    if (!f.canUse(k, m)) return false;
    if (this.cmd && this.cmd.block === k) return false;
    // không phí đòn tấn công khi đang né kẻ bất tử
    const sk0 = f.weapon.skills[k];
    if (this.imm && sk0 && sk0.ai && sk0.ai.type === 'atk' && !(sk0.recast && sk0.recast(f))) return false;
    if (look && !opt.keepFacing) f.facing = this.aimNoise(angTo(f, look));
    f.castAngle = opt.cast ?? f.facing;
    f.intent = opt.hold ? { hold: true } : null;
    const ok = f.tryUse(k, m);
    f.intent = null;
    // Đánh & Rút: tung xong đòn kết liễu thì lùi hẳn ra
    if (ok && k === 'B' && this.flag === 'hitrun' && !this.allIn) this.retreatT = 0.9;
    return ok;
  }
  aimNoise(a) { return a + rand(-1, 1) * (1 - this.accuracy) * 0.35; }
  // trang bị kích hoạt: reactOnly = chỉ xét các món phản xạ (gọi mỗi khung hình, kể cả khi đang bị đánh bay/choáng)
  useItems(m, t, reactOnly) {
    const f = this.f;
    if (!f.actives || !f.actives.length || !f.alive) return false;
    const ord = this.itemOrder && m.time < this.itemOrder.until ? this.itemOrder.id : null;
    for (const id of f.actives) {
      const A = ITEM_BY_ID[id].active;
      if ((f.icd[id] || 0) > 0) continue;
      if (reactOnly && !A.react && id !== ord) continue;
      const d = t ? dist(f, t) : 999;
      // lệnh HLV: dùng ngay (vẫn cần điều kiện tối thiểu để có tác dụng với các món phản xạ)
      const ok = id === ord ? (!A.react || A.when(f, t, m, d, this) || !['it_anchor', 'it_hourglass'].includes(id)) : (t && A.when(f, t, m, d, this) && Math.random() < 0.55 + this.tech.reflex * 0.04);
      if (!ok) continue;
      if (!A.react && !id.includes('mercury') && (f.has('stun') || f.has('charm'))) continue;
      f.icd[id] = A.cd;
      A.use(f, m, t); noteActive(f, m, 'item', id);
      if (id === ord) { this.itemOrder = null; m.text(f.x, f.y - 76, '✔', f.team === 0 ? '#9fd3ff' : '#ffb0b0', 15); }
      return true;
    }
    return false;
  }

  // ===== Hỗn Chiến: AI tự phối hợp với đồng đội (khi HLV không ra lệnh đội) =====
  // mặc định đánh kẻ gần nhất; chỉ đổi mục tiêu để CỨU đồng đội đang nguy / Leader, hoặc KẾT LIỄU kẻ bị khống chế / sát mép
  coopTarget(m) {
    const f = this.f;
    if (m.mode !== 'brawl' || m.focusOf(f) || BRAIN_OFF.coopTarget) return null;
    if (this._ct && m.time < this._ct.until) return this._ct.t && this._ct.t.alive ? this._ct.t : null;
    const foes = m.fighters.filter((e) => e.team !== f.team && e.alive && !e.has('untargetable'));
    if (!foes.length) return null;
    const allies = m.fighters.filter((a) => a.team === f.team && a.alive && a !== f);
    let pickT = null, why = '';
    // 1) cứu đồng đội: kẻ đang áp sát đồng đội điểm văng cao (hoặc Leader) trong tầm 280
    if (!BRAIN_OFF.coopRescue) for (const a of allies) {
      if (a.percent < 90 && a !== m.leaders[f.team]) continue;
      const atk = foes.filter((e) => dist(e, a) < 130 && dist(e, f) < 280).sort((x, y) => dist(x, a) - dist(y, a))[0];
      if (atk) { pickT = atk; why = '🛡️ cứu đồng đội'; break; }
    }
    // 2) kết liễu: kẻ đang bị khống chế hoặc điểm văng cao sát mép trong tầm 260
    if (!pickT) pickT = foes.filter((e) => dist(e, f) < 260 && (e.has('stun') || e.has('root') || e._stoneUntil > m.time || e._sleepT > m.time || (e.percent > 100 && m.arena.edgeDist(e.x, e.y) < 140)))
      .sort((x, y) => y.percent - x.percent)[0];
    if (pickT && !why) why = '🎯 kết liễu';
    this._ct = { t: pickT || null, until: m.time + 0.8 };
    if (pickT && why && (!this._ctSaid || m.time > this._ctSaid)) { this._ctSaid = m.time + 5; m.text(f.x, f.y - 56, why, '#cfd8e0', 12); }
    return pickT;
  }
  // vị trí phối hợp: kẹp mục tiêu từ phía đối diện đồng đội (ép ra mép) • lẻ loi & nguy hiểm thì rút về chỗ đồng đội
  coopGoal(m, t, pref) {
    const f = this.f;
    const allies = m.fighters.filter((a) => a.team === f.team && a.alive && a !== f);
    if (!allies.length) return null;
    const foesNear = m.fighters.filter((e) => e.team !== f.team && e.alive && dist(e, f) < 300).length;
    const friendsNear = allies.filter((a) => dist(a, f) < 260).length;
    if (!BRAIN_OFF.coopRegroup && f.percent > 100 && foesNear >= 2 && friendsNear === 0) {
      const cx = allies.reduce((s, a) => s + a.x, 0) / allies.length, cy = allies.reduce((s, a) => s + a.y, 0) / allies.length;
      if (!this._grpSaid || m.time > this._grpSaid) { this._grpSaid = m.time + 4; m.text(f.x, f.y - 56, '🫂 về với đồng đội', '#cfd8e0', 12); }
      return { x: cx, y: cy };
    }
    // tướng đánh xa: đứng hàng sau, lấy đồng đội cận chiến làm lá chắn
    if (f.weapon.ai.ranged && BRAIN_OFF.coopBack === 0) { // hàng sau: đo được bất lợi nên mặc định tắt
      const tank = allies.filter((a) => !a.weapon.ai.ranged && dist(a, t) < 260).sort((a, b) => dist(a, t) - dist(b, t))[0];
      if (tank) { const a = angTo(t, tank); return { x: tank.x + Math.cos(a) * Math.max(110, pref - dist(t, tank)), y: tank.y + Math.sin(a) * Math.max(110, pref - dist(t, tank)) }; }
    }
    const mate = allies.find((a) => a.brain && a.brain.target === t && dist(a, t) < dist(f, t) + 40);
    if (mate && !f.weapon.ai.ranged && !BRAIN_OFF.coopPincer) {
      // đứng phía trong sân so với mục tiêu, đối diện đồng đội → hai bên kẹp, đòn nào cũng đẩy ra mép
      const away = angTo(mate, t), inward = Math.atan2(-t.y, -t.x);
      const a = Math.atan2(Math.sin(away) * 0.5 + Math.sin(inward), Math.cos(away) * 0.5 + Math.cos(inward));
      return { x: t.x + Math.cos(a) * pref * 0.85, y: t.y + Math.sin(a) * pref * 0.85 };
    }
    return null;
  }
  // chế độ 3v3: mục tiêu theo lệnh phối hợp của Leader (bị khiêu khích / bị ảo ảnh dụ thì vẫn ưu tiên những thứ đó)
  teamTarget(m) {
    const o = this.teamOrder, f = this.f;
    if (!o || m.time > o.until || m.focusOf(f)) return null;
    if ((o.type === 'focus' || o.type === 'leader' || o.type === 'surround') && o.target && o.target.alive) return o.target;
    if (o.type === 'protect' && o.leader && o.leader.alive && o.leader !== f) {
      let best = null, bd = Infinity;
      for (const e of m.fighters) if (e.team !== f.team && e.alive) { const d = dist(e, o.leader); if (d < bd) { bd = d; best = e; } }
      return best;
    }
    return null;
  }
  // phép bổ trợ: reactOnly = chỉ xét phép phản xạ (gọi mỗi khung hình, kể cả khi đang bị đánh bay/choáng)
  useSpells(m, t, reactOnly) {
    const f = this.f;
    if (!f.spells || !f.spells.length || f.dead) return false;
    const ord = this.spellOrder && m.time < this.spellOrder.until ? this.spellOrder.id : null;
    for (const id of f.spells) {
      const S = SPELLS[id];
      if (!spellReady(f, id)) continue;
      if (!f.alive && !(S.react && f.falling > 0)) continue;
      if (id !== ord) {
        if (reactOnly && !S.react) continue;
        if (!S.react && (f.has('stun') || f.has('charm'))) continue;
        const d = t ? dist(f, t) : 999;
        if (!S.when(f, t, m, d, this) || Math.random() > 0.5 + this.tech.reflex * 0.04) continue;
      }
      if (castSpell(f, m, id, t)) { if (id === ord) this.spellOrder = null; return true; }
    }
    return false;
  }
  updateMood(t) {
    const f = this.f;
    this.danger = clamp(f.percent / 130, 0, 1.3);
    this.opp = clamp(t.percent / 130, 0, 1.3);
    let aggr = 1 + 0.45 * this.opp - 0.4 * this.danger;
    if (this.pid === 'borg') aggr = 1 + 0.6 * this.danger + 0.3 * this.opp;
    if (f.has('berserk')) aggr *= 1.6;
    if (this.pid === 'elara' && t.weaponId === 'nam_tay') aggr *= 1.5;
    this.moodAggr = aggr;
    this.moodDef = 1 + 0.6 * this.danger * (this.pid === 'borg' ? 0.3 : 1);
  }

  // thi hành lệnh đang chờ: trả true nếu đã hành động
  runCommand(m, t, d) {
    const f = this.f, c = this.cmd;
    if (c.stance && f.ws.stance !== c.stance) return f.canUse('D', m) ? this.use(m, 'D') : false;
    if (!c.key) return false;
    const k = c.key, sk = f.weapon.skills[k];
    if (!sk || !f.canUse(k, m)) return false;
    // Tín Nhiệm ≥80: HLV bảo là làm, không đợi vào tầm
    const now = f.trust >= 80;
    if (!now && c.near && d > c.near) return false;
    if (!now && c.far && d < c.far) return false;
    if (c.minBleed && !(t.has('bleed') && t.has('bleed').n >= c.minBleed)) return false;
    if (c.id === 'turret' && !(f.ws.gears >= 2)) return false;
    const opt = {};
    if (c.hold) opt.hold = true;
    if (c.cast === 'center') { opt.cast = Math.atan2(-f.y, -f.x); opt.keepFacing = true; }
    else if (isMobility(sk)) opt.cast = sk.ai && sk.ai.mob === 'escape' ? escapeAngle(f, t, m) : angTo(f, t);
    if (!this.use(m, k, opt)) return false;
    this.cmd = null;
    m.text(f.x, f.y - 64, '✔', f.team === 0 ? '#9fd3ff' : '#ffb0b0', 15);
    return true;
  }
  // ===== TƯ DUY (tech.tactic): các quyết định thông minh =====
  smart(m, t, d) {
    const f = this.f, tl = this.tech.tactic, W = f.weapon, melee = !W.ai.ranged, reach = W.ai.range || 80;
    if (f.has('berserk')) { this.bait = null; return false; }
    // a) Phá tụ lực: đối thủ đang gồng/kéo/tích chiêu → bắn tầm xa hoặc lao vào cắt ngang
    const charging = t.action && t.action.charge && t.action.t < t.action.charge;
    if (!BRAIN_OFF.charge && charging && tl >= 4 && d > reach * 0.8 && Math.random() < 0.25 + tl * 0.06) {
      if (this.tryPoke(m, t, d) || (f.weaponId === 'katana' && this.katanaRanged(m, t, d)) || this.tryGap(m, t, d, true)) {
        m.text(f.x, f.y - 58, '✂️ Phá tụ lực!', '#ffe9a0', 13); return true;
      }
    }
    // b) Tiến công / truy đuổi: dùng chiêu tiếp cận (lướt, dịch chuyển, vồ, tăng tốc) — không cần vào hẳn tầm đánh
    const chasing = melee && d > reach + 50;
    this.chaseT = chasing ? (this.chaseT || 0) + this.interval : 0;
    const ordered = this.shout && this.shout.type === 'attack';
    if (!BRAIN_OFF.gap && chasing && !this.bait && (ordered || this.punishT > m.time || (tl >= 3 && this.chaseT > 1.6 - tl * 0.1 && Math.random() < 0.2 + tl * 0.05))) {
      if (this.tryGap(m, t, d, ordered)) return true;
    }
    // c) Kẹp góc: theo lệnh, hoặc tự làm khi Tư duy cao và đối thủ đang sát mép
    // (chỉ nhân vật có chiêu tầm xa mới đứng lùi để kẹp góc; cận chiến thuần thì lao vào kết liễu như thường)
    const hasPoke = (POKE_SKILLS[f.weaponId] || []).length > 0;
    this.cornering = hasPoke && ((this.cmd && this.cmd.corner) || (!BRAIN_OFF.corner && tl >= 6 && t.percent > 55 && m.arena.edgeDist(t.x, t.y) < 240));
    if (this.cornering && this.pushAligned(m, t)) {
      if (this.tryPoke(m, t, d)) return true;
      if (f.weaponId === 'katana' && tl >= 5 && d > 150 && d < 360 && this.katanaRanged(m, t, d)) return true;
    }
    // d) Dụ đòn (cận chiến, Tư duy ≥5): đứng sát ngoài tầm, chờ đối thủ vung trượt rồi bắt bài
    if (melee && tl >= 5 && !BRAIN_OFF.bait && BAITERS.has(f.weaponId)) {
      this.updateBait(m, t, d);
      if (this.bait) return true;
    } else this.bait = null;
    return false;
  }
  // dùng 1 chiêu tiếp cận phù hợp khoảng cách
  tryGap(m, t, d, force) {
    const f = this.f, list = GAP_SKILLS[f.form === 'mech' ? 'mech' : f.weaponId] || [];
    for (const g of list) {
      if ((g.when && !g.when(f)) || d < g.min || d > g.max + (force ? 90 : 30) || !f.canUse(g.k, m)) continue;
      if (m.arena.edgeDist(f.x, f.y) < 60 && !g.self) continue;
      if (this.use(m, g.k, g.self ? {} : { cast: angTo(f, t) })) return true;
    }
    return false;
  }
  // dùng 1 chiêu tầm xa (không bắn khi bị cột che)
  tryPoke(m, t, d) {
    const f = this.f, list = POKE_SKILLS[f.weaponId] || [];
    if (f.form === 'mech') return false;
    for (const p of list) {
      if (d > p.max || d < (p.min || 0) || !f.canUse(p.k, m)) continue;
      if (m.arena.blocked(f.x, f.y, t.x, t.y, 5)) return false;
      if (this.use(m, p.k)) return true;
    }
    return false;
  }
  // Katana: combo tầm xa — Kiếm Khí nếu có, không thì BC (đâm hụt + Thuấn Bộ → phóng dư ảnh xuyên thấu)
  katanaRanged(m, t, d) {
    const f = this.f;
    if (f.ws.wave && f.canUse('D', m) && d < 440) return this.use(m, 'D');
    if (!this.seq && f.canUse('B', m) && f.cd.C <= 0.3 && d > 130 && d < 380) {
      this.startSeq(['B', 'C'], m, { anyRange: true, label: 'Combo BC tầm xa' });
      return this.runSeq(m, t, d);
    }
    return false;
  }
  // hướng đánh từ mình tới đối thủ có đẩy họ về phía mép gần nhất không
  pushAligned(m, t) {
    const f = this.f, A = m.arena, e = A.edgeDist(t.x, t.y);
    if (e > 320) return false;
    const n = edgeNormal(A, t), a = angTo(f, t);
    return Math.cos(a) * n.x + Math.sin(a) * n.y > 0.55;
  }
  // tầm đánh xa nhất của đối thủ (các chiêu cận chiến) — đứng ngoài tầm này mới là dụ đòn an toàn
  threatReach(t) {
    let r = (t.weapon.ai && t.weapon.ai.range) || 80;
    for (const k of ['A', 'B', 'D']) { const sk = t.weapon.skills[k]; if (sk && sk.ai && sk.ai.type === 'atk' && sk.ai.max && sk.ai.max < 320) r = Math.max(r, sk.ai.max); }
    return r;
  }
  updateBait(m, t, d) {
    const f = this.f, reach = f.weapon.ai.range || 80;
    if (this.bait) {
      // đối thủ vung trượt (ra đòn khi mình đứng ngoài tầm) hoặc vừa dùng hết chiêu chính → bắt bài
      const tReach = (t.weapon.ai && t.weapon.ai.range) || 80;
      const whiff = t.action && t.action.atk && d > this.bait.dist - 30;
      const spent = (t.cd.B || 0) > 0.8 && (t.cd.A || 0) > 0.2;
      if (whiff || spent || d < reach + 5) {
        this.bait = null; this.punishT = m.time + 1.4;
        m.text(f.x, f.y - 60, '🎯 Bắt bài!', '#9fd3ff', 14);
        this.tryGap(m, t, d, true);
        return;
      }
      if (m.time > this.bait.until) { this.bait = null; this.baitCd = m.time + rand(3, 6); }
      return;
    }
    if (m.time < (this.baitCd || 0) || this.punishT > m.time || t.weapon.ai.ranged) return;
    if (t.has('stun') || t.has('root') || t.percent > 110 || (this.shout && this.shout.type === 'attack') || this.seq || this.cmd) return;
    const tReach = this.threatReach(t);
    if (d > reach && d < Math.max(tReach, reach) + 230 && Math.random() < 0.06 + (this.tech.tactic - 5) * 0.03) {
      this.bait = { until: m.time + rand(1.2, 2.2), dist: Math.max(tReach + 40, reach + 30) };
      m.text(f.x, f.y - 56, '🎣 Dụ đòn', '#9fd3ff', 12);
    }
  }
  // chọn chỗ đứng bắn đẹp: không bị cột che, hướng bắn đẩy đối thủ ra mép, bản thân xa mép, ít phải chạy
  shooterGoal(m, t, pref, pushW) {
    if (this._sg && m.time < this._sgT) return this._sg;
    const f = this.f, A = m.arena, n = edgeNormal(A, t), near = 1 - clamp(A.edgeDist(t.x, t.y) / 420, 0, 1);
    const safe = 80 + this.danger * 40;
    let best = null, bs = -Infinity;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU, p = A.clamp({ x: t.x + Math.cos(a) * pref, y: t.y + Math.sin(a) * pref }, safe);
      const ux = t.x - p.x, uy = t.y - p.y, uL = Math.hypot(ux, uy) || 1;
      const push = (ux / uL) * n.x + (uy / uL) * n.y;
      let s = push * pushW * near + Math.min(A.edgeDist(p.x, p.y), 220) * 0.5 - Math.hypot(p.x - f.x, p.y - f.y) * 0.16;
      if (A.blocked(p.x, p.y, t.x, t.y, 6)) s -= 170;
      for (const dz of m.dangers) if (Math.hypot(p.x - dz.x, p.y - dz.y) < dz.r + 40) s -= 120;
      // không phải chạy băng qua mặt đối thủ để tới chỗ đứng
      const vx = p.x - f.x, vy = p.y - f.y, L2 = vx * vx + vy * vy || 1, k = clamp(((t.x - f.x) * vx + (t.y - f.y) * vy) / L2, 0, 1);
      if (Math.hypot(f.x + vx * k - t.x, f.y + vy * k - t.y) < 90) s -= 90;
      if (s > bs) { bs = s; best = p; }
    }
    this._sg = best; this._sgT = m.time + 0.45;
    return best;
  }
  // thời điểm hợp để tung đòn kết liễu (B)
  finishWindow(m, t) {
    const at = this.tacEff.finishAt || 70;
    return t.percent >= at || (t.percent >= at * 0.6 && m.arena.edgeDist(t.x, t.y) < 200) || t.has('stun') || t.has('root') || t.has('charm');
  }
  // còn chiêu tấn công nào dùng được không (hết chiêu / hết đạn → lùi lại chờ hồi)
  hasAttack(m) {
    const f = this.f, W = f.weapon;
    for (const k of ['A', 'B', 'D']) {
      const sk = W.skills[k];
      if (sk && sk.ai && sk.ai.type === 'atk' && f.canUse(k, m)) return true;
    }
    return false;
  }
  // Kẻ địch đang BẤT TỬ ở gần → né, không phí đòn vào hắn (trừ khi đang hóa điên hoặc chính mình cũng bất tử)
  findImmortal(m) {
    const f = this.f;
    if (f.has('berserk') || f.has('immortal')) return null;
    let best = null, bd = Infinity;
    for (const e of m.enemiesOf(f)) {
      const s = e.has('immortal');
      if (!s || s.t < 0.25) continue;
      const d = dist(f, e);
      if (e.isMinion && d > 300) continue;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  // chạy trốn cục bộ: thử 16 hướng quanh mình, không bao giờ chạy băng qua kẻ địch, bị dồn góc thì trượt dọc mép
  fleeGoal(m, e) {
    const f = this.f, A = m.arena, step = 170, safe = 75 + this.danger * 35;
    const away = angTo(e, f);
    let best = null, bs = -Infinity;
    for (let i = 0; i < 16; i++) {
      const a = away + (i / 16) * TAU;
      const p = A.clamp({ x: f.x + Math.cos(a) * step, y: f.y + Math.sin(a) * step }, safe);
      // khoảng cách gần nhất từ kẻ địch tới đoạn đường chạy
      const vx = p.x - f.x, vy = p.y - f.y, L2 = vx * vx + vy * vy || 1;
      const k = clamp(((e.x - f.x) * vx + (e.y - f.y) * vy) / L2, 0, 1);
      const pass = Math.hypot(f.x + vx * k - e.x, f.y + vy * k - e.y);
      const moved = Math.sqrt(L2);
      let s = Math.hypot(p.x - e.x, p.y - e.y) + Math.min(A.edgeDist(p.x, p.y), 160) * 0.35 + moved * 0.3;
      if (pass < 110) s -= (110 - pass) * 4;
      if (m.arena.nearPillar({ x: p.x, y: p.y, r: f.r }, 6)) s -= 60;
      // giữ hướng chạy cũ cho đỡ giật
      if (this._fleeA !== undefined) s -= Math.abs(angDiff(a, this._fleeA)) * 12;
      if (s > bs) { bs = s; best = { x: p.x, y: p.y, a }; }
    }
    this._fleeA = best.a;
    return best;
  }

  // ----- Ra quyết định -----
  think(m, t) {
    const f = this.f, d = dist(f, t);
    this.updateMood(t);
    // 0) Lật kèo khi bị khống chế (The Hand: Bất Ngờ Chưa)
    const C = f.weapon.skills.C;
    if (C && C.breakCC && (f.has('stun') || f.has('charm') || f.has('root') || f.hitstun > 0.2) && f.cd.C <= 0 && Math.random() < 0.3 + this.tech.dodge * 0.07) {
      if (this.use(m, 'C', { cast: escapeAngle(f, t, m), keepFacing: true })) return;
    }
    // Thanh Phong: D ở Bão Hòa thanh tẩy khống chế
    const Dk = f.weapon.skills.D;
    if (Dk && Dk.breakCC && (f.has('stun') || f.has('root') || f.has('charm')) && f.canUse('D', m) && Math.random() < 0.3 + this.tech.dodge * 0.07) { if (this.use(m, 'D')) return; }
    // Koda hóa điên khi bị dồn quá 120%
    if (this.pid === 'koda' && !f.has('berserk') && f.percent > 120) {
      f.addStatus('berserk', 9999); m.text(f.x, f.y - 70, '🔴 KODA HÓA ĐIÊN!', '#ff3030', 22); m.shake(8);
    }
    // 0d) Tái kích hoạt chiêu (đòn nối của nội tại): dùng đúng thời điểm
    for (const k of ['A', 'B', 'C', 'D']) {
      const s = f.weapon.skills[k];
      if (s && s.recast && s.recastAi && s.recast(f) && f.canUse(k, m) && s.recastAi(f, t, m, d) && Math.random() < 0.5 + this.tech.reflex * 0.05) {
        if (this.use(m, k, { keepFacing: k === 'C' && f.weaponId === 'katana' })) return;
      }
    }
    if (!this.imm && this.useItems(m, t, false)) return;
    if (!this.imm && this.useSpells(m, t, false)) return;
    if (!f.canAct() && !f.ws.turret && !f.ws.cling && !(f.ws.vault > 0)) return;
    // 0b) Thi hành mệnh lệnh riêng của HLV
    if (this.cmd && !this.imm && this.runCommand(m, t, d)) return;
    // 0c) Đang tung combo: ra bước kế tiếp; giữa combo thì không chen chiêu khác
    if (this.seq && !this.imm) {
      if (this.runSeq(m, t, d)) return;
      if (this.seq && this.seq.i > 0) return;
    }
    if (!this.imm && this.profilePre(m, t, d)) return;
    // 0e) Đối thủ đang giơ khiên / thế thủ: đừng đánh vào, lùi ra khỏi tầm phản đòn
    const guard = t.has('block') || (this.tech.tactic >= 3 && (t.has('parry') || (t.has('absorb') && t.weaponId === 'nam_tay')));
    if (guard && !f.has('berserk') && !this.allIn && Math.random() < 0.6 + this.tech.tactic * 0.04) {
      const g = t.has('block') || t.has('parry') || t.has('absorb');
      this.retreatT = Math.max(this.retreatT, Math.min(1.2, (g ? g.t : 0.5) + 0.2));
      if (!this._guardSaid || m.time > this._guardSaid) { this._guardSaid = m.time + 3; m.text(f.x, f.y - 56, '✋ Né đòn thủ', '#cfd8e0', 12); }
      return;
    }
    // 1) Phòng thủ khi bị đe dọa
    const threat = this.findThreat(m);
    if (threat) this.lastThreat = m.time;
    if (threat && !this.allIn) {
      let mult = this.tacEff.def * this.moodDef;
      if (this.pid === 'aria' || this.pid === 'florian') mult *= 1.5;
      if (this.pid === 'percy') mult *= 1.4;
      if (this.pid === 'zero') mult *= 1.6;
      if (this.pid === 'valerius' && threat.enemy && threat.enemy.action && (threat.enemy.action.windup || threat.enemy.action.charge)) mult *= 1.8;
      const chance = clamp((0.12 + this.tech.dodge * 0.075) * mult * this.wisK, 0, 0.95);
      if (Math.random() < chance) {
        for (const k of f.weapon.ai.defend || []) {
          if (!f.canUse(k, m)) continue;
          const sk = f.weapon.skills[k];
          if (sk.ai && sk.ai.max && d > sk.ai.max && !threat.proj) continue;
          if (sk.group === 'note' && f.ws.notes && f.ws.notes.length === 2 && this.desiredNote(m, t) !== k) continue;
          const cast = this.dodgeAngle(m, threat, t);
          if (this.use(m, k, { cast })) { this.counterT = m.time + 1.5; return; }
        }
      }
    }
    // 1b) Vũ khí tầm xa bị áp sát: lướt thoát thân
    if (!this.allIn && f.weapon.ai.ranged && d < (this.pid === 'percy' ? 120 : 90) && Math.random() < (0.15 + this.tech.tactic * 0.05) * this.moodDef) {
      for (const k of f.weapon.ai.defend || []) {
        const sk = f.weapon.skills[k];
        if (!sk || !sk.ai || sk.ai.mob !== 'escape' || !f.canUse(k, m)) continue;
        if (this.use(m, k, { cast: escapeAngle(f, t, m) })) return;
      }
    }
    if (this.shout && this.shout.type === 'retreat') return;
    if (this.retreatT > 0) return;
    // 1c) Né kẻ đang bất tử: chỉ dùng chiêu thoát thân khi hắn áp sát
    if (this.imm) {
      const di = dist(f, this.imm);
      if (di < 170 && Math.random() < 0.3 + this.tech.dodge * 0.06) {
        for (const k of ['C', 'E', 'B', 'D']) {
          const sk = f.weapon.skills[k];
          if (!sk || !sk.ai || !isMobility(sk) || !f.canUse(k, m)) continue;
          if (this.use(m, k, { cast: escapeAngle(f, this.imm, m), keepFacing: true })) return;
        }
      }
      if (!this._immSaid || m.time > this._immSaid) { this._immSaid = m.time + 4; m.text(f.x, f.y - 56, '😨 Né kẻ bất tử!', '#ffd700', 13); }
      return;
    }
    // 1d) Trụ sân: sát mép thì dùng chiêu cơ động (C) quay vào giữa
    const eSelf = m.arena.edgeDist(f.x, f.y);
    const tl = this.tech.tactic;
    if (!this.allIn && (this.flag === 'stand' ? eSelf < 140 : tl >= 6 ? eSelf < 95 && this.danger > 0.6 && !(f.weapon.skills.C && f.weapon.skills.C.breakCC) : eSelf < 70 && this.danger > 0.6) && Math.random() < 0.6) {
      const sk = f.weapon.skills.C;
      if (sk && isMobility(sk) && f.canUse('C', m) && this.use(m, 'C', { cast: Math.atan2(-f.y, -f.x), keepFacing: true })) return;
    }
    // 1d') Tư duy: phá tụ lực, tiếp cận, kẹp góc, dụ đòn
    if (this.smart(m, t, d)) return;
    // 1e) Đặc kỹ: ưu tiên chiêu D mỗi khi hồi
    if (this.flag === 'sig' && !this.imm) {
      const sk = f.weapon.skills.D;
      if (sk && sk.ai && f.canUse('D', m) && d <= (sk.ai.max || 400) && d >= (sk.ai.min || 0) && (!sk.ai.when || sk.ai.when(f, t, m)) && this.use(m, 'D')) return;
    }
    // 1f) Hết chiêu tấn công (đang hồi / hết đạn): lùi ra chờ hồi thay vì đứng chịu đòn
    if (!f.has('berserk') && f.weaponId !== 'voice' && !this.hasAttack(m) && d < 300 && !(this.shout && this.shout.type === 'attack')) {
      const k = (this.flag === 'evasive' || this.flag === 'hitrun' ? 1.7 : 1) * (0.6 + this.tech.tactic * 0.06);
      this.retreatT = rand(0.35, 0.65) * k;
      return;
    }
    // 2) Tái kích hoạt (dao găm, thương)
    for (const k of ['D', 'B']) { const s = f.weapon.skills[k]; if (s && s.recast && s.recast(f) && f.weaponId === 'dao') { if (this.use(m, k)) return; } }
    // 3) Nộ theo lệnh HLV
    if (this.shout && this.shout.type === 'ult' && f.canUse('U', m)) { if (this.use(m, 'U')) return; }
    // 4) Tấn công
    let aggr = this.allIn ? 3 : this.tacEff.aggr * this.moodAggr;
    if (this.flag === 'counter' && m.time < (this.counterT || 0)) aggr *= 2;
    if (this.punishT > m.time) aggr *= 2;
    if (f.has('immortal')) aggr *= 1.8;
    // chiến thuật Kết Liễu: giữ Nộ tới khi đối thủ đủ điểm văng
    if (this.tacEff.ult === 'finisher') this._holdUlt = t.percent < 85 && f.percent < 140 && !(this.shout && this.shout.type === 'ult');
    if (Math.random() > clamp(0.5 * aggr + this.tech.reflex * 0.03, 0.15, 0.98)) return;
    const ch = this.choose(m, t, d);
    if (ch === 'wait') return;
    if (ch) { if (this.use(m, ch.k, ch)) return; }
    this.generic(m, t, d, aggr);
  }

  generic(m, t, d, aggr) {
    const f = this.f, W = f.weapon;
    const blocked = W.ai.ranged && d > 90 && m.arena.blocked(f.x, f.y, t.x, t.y, 4);
    let best = null, bestS = 0;
    for (const k of ['U', 'D', 'B', 'A', 'C']) {
      const sk = W.skills[k];
      if (!sk || !sk.ai || sk.ai.type === 'def') continue;
      if (k === 'U' && this._holdUlt) continue;
      if (!f.canUse(k, m)) continue;
      const ai = sk.ai;
      if (ai.type === 'mob') {
        if (ai.mob === 'engage' && ai.max && d > (ai.min || 0) && d < ai.max && m.arena.edgeDist(f.x, f.y) > 40) {
          const s = ai.pri * rand(0.5, 1.1) * (aggr > 1 ? 1.3 : 1);
          if (s > bestS) { best = k; bestS = s; }
        }
        continue;
      }
      const slop = (1 - this.accuracy) * 40;
      if (d < (ai.min || 0) - slop || d > ai.max + slop) continue;
      if (ai.when && !ai.when(f, t, m)) continue;
      if (blocked && ai.type === 'atk' && k !== 'U') continue;
      if ((t.has('immortal') || t.has('parry') || t.has('absorb')) && ai.type === 'atk' && Math.random() < this.tech.dodge * 0.09) continue;
      let s = ai.pri * rand(0.6, 1.2) * ((this.tacEff.pref && this.tacEff.pref[k]) || 1) * ((this.cmd && this.cmd.pref && this.cmd.pref[k]) || 1);
      // vai trò: A đánh tích khi đối thủ còn ít điểm văng • B kết liễu khi đối thủ cao điểm / sát mép / bị khống chế
      if (k === 'A') s *= this.finishWindow(m, t) ? 0.8 : 1.35;
      if (k === 'B') s *= this.finishWindow(m, t) ? 1.8 : 0.5;
      if (k === 'U') s *= 1.5;
      if (s > bestS) { best = k; bestS = s; }
    }
    if (best) {
      const sk = W.skills[best];
      this.use(m, best, sk.ai.type === 'mob' ? { cast: angTo(f, this.lastSeen || t) } : {});
    }
  }

  // ----- Thói quen riêng từng nhân vật (trả true nếu đã hành động) -----
  profilePre(m, t, d) {
    const f = this.f, atk = t.action && t.action.atk;
    // hành vi theo chiến thuật riêng của HLV
    switch (this.flag) {
      case 'punisher': // Gideon: gồng mỗi khi đối thủ vung đòn
        if (atk && d < 230 && f.canUse('C', m) && Math.random() < 0.9) return this.use(m, 'C');
        break;
      case 'pain': // Borg: lao vào đòn đối thủ để Gồng
        if ((atk || d < 110) && f.ws.charge === 0 && f.canUse('C', m) && Math.random() < 0.75) return this.use(m, 'C');
        break;
      case 'phantom': // Vesper: ẩn thân liên tục, chỉ ra tay sau lưng
        if (!f.has('untargetable') && f.canUse('C', m) && d < 380) return this.use(m, 'C');
        if (d < 90 && Math.abs(angDiff(t.facing, angTo(t, f))) < 1.6 && !f.has('untargetable')) { this.retreatT = 0.35; return true; }
        break;
      case 'fortress': // Percy: cắm trận địa ngay khi có thể
        if (!f.ws.turret && f.canUse('D', m) && d > 70 && d < turretRange(f) + 60 && m.arena.edgeDist(f.x, f.y) > 90) return this.use(m, 'D');
        if (f.ws.turret && d < 90 && f.canUse('B', m)) return false;
        break;
      case 'mill': // Death: liềm xoay khóa vùng
        if (f.canUse('C', m) && d > 90 && d < 250 && (t.percent > 50 || Math.random() < 0.45)) return this.use(m, 'C');
        break;
      case 'execute': // Zero: chỉ xả băng khi đã khóa hoặc mục tiêu yếu
        if (f.canUse('B', m) && d < 340 && ((t.gunMark && t.gunMark.owner === f) || t.percent > 60)) return this.use(m, 'B');
        break;
    }
    switch (this.pid) {
      case 'elara':
        if (d < 230 && f.canUse('C', m) && Math.random() < 0.7) return this.use(m, 'C', { cast: escapeAngle(f, t, m) });
        break;
      case 'percy':
        if (t.weaponId === 'cung' && Math.random() < 0.7) return true;
        break;
      case 'jack':
        if (f.canUse('D', m) && !(this.cmd && this.cmd.block === 'D')) return this.use(m, 'D');
        break;
      case 'zero':
        if (this.flag !== 'execute' && t.gunMark && t.gunMark.owner === f && f.canUse('B', m) && d < 360) return this.use(m, 'B');
        if (f.ws.ammo === 0 && f.canUse('C', m)) return this.use(m, 'C', { cast: escapeAngle(f, t, m) });
        if (d < 95 && !t.weapon.ai.ranged && f.canUse('C', m) && Math.random() < 0.5) return this.use(m, 'C', { cast: escapeAngle(f, t, m) });
        if (!t.gunMark && f.canUse('D', m) && d < 520) return this.use(m, 'D');
        break;
      case 'death':
        if (t.percent > deathLine(f) && d < 186 && f.canUse('B', m)) return this.use(m, 'B');
        break;
      case 'borg':
        if (t.weaponId === 'voice' && m.time > (this._idleCd || 0) && Math.random() < 0.3) { this._idleCd = m.time + 3; this.idleT = 0.5; m.text(f.x, f.y - 50, '...?', '#cccccc', 14); return true; }
        if (t.weaponId === 'cung' && t.action && t.action.atk && f.canUse('C', m)) return this.use(m, 'C');
        break;
      case 'florian':
        if (this.tacticId === 'duelist' && f.canUse('D', m) && d < 440) return this.use(m, 'D');
        // không bao giờ đánh lén sau lưng
        if (Math.abs(angDiff(t.facing, angTo(t, f))) > 2.1 && d < 230) return true;
        break;
      case 'vesper':
        if (!f.has('untargetable') && d < 110 && Math.abs(angDiff(t.facing, angTo(t, f))) < 0.6) {
          // bị nhìn thẳng mặt: ẩn thân / phi dao áp sát từ phía sau, nếu không được thì rút lui
          if (f.canUse('C', m)) return this.use(m, 'C');
          if (f.canUse('D', m) && d > 50) return this.use(m, 'D');
          if (Math.random() < 0.45) { this.retreatT = 0.5; return true; }
        }
        if (f.canUse('C', m) && d > 160 && d < 330 && Math.random() < 0.35) return this.use(m, 'C');
        break;
      case 'ignatius':
        if (f.ultReady() && !(m.arena.edgeDist(t.x, t.y) < 230 || t.percent > 90 || (this.shout && this.shout.type === 'ult'))) {
          // giữ Thiên Thạch cho tới khi ép được đối thủ vào góc
          if (this.f.weapon.skills.U) this._holdUlt = true;
        } else this._holdUlt = false;
        break;
      case 'gideon':
        if (t.action && t.action.atk && d < 210 && f.canUse('C', m) && Math.random() < 0.5) return this.use(m, 'C');
        if (d < 64 && f.canUse('D', m) && !f.T('gideon_6b')) return this.use(m, 'D');
        if (f.T('gideon_6b') && t.action && t.action.atk && d < 200 && f.canUse('D', m)) return this.use(m, 'D');
        break;
    }
    return false;
  }
  onLanded(m, t, mag) {
    const f = this.f;
    if (this.pid === 'florian' && (mag > 480 || (f.ws.empNext && !this._emp))) {
      m.text(f.x, f.y - 56, '😏', '#ffffff', 20); // chỉ cười khẩy, không còn đứng khựng 0.8s
    }
    this._emp = f.ws.empNext;
  }

  // ----- Bộ chọn chiêu theo vũ khí -----
  choose(m, t, d) {
    const f = this.f, can = (k) => f.canUse(k, m);
    if (this._holdUlt && f.weapon.skills.U) { /* Ignatius giữ nộ */ }
    // Chrono & Neo: Chuyển Thế ngay trước khi tung Nộ để Liên Hoa nở to gấp đôi
    else if (f.weaponId === 'song_luc' && can('U') && m.time - (f.ws.swapT || -9) > 1.3 && can('D') && d < 420) return { k: 'D' };
    else if (can('U') && f.weapon.skills.U.ai && d <= (f.weapon.skills.U.ai.max || 400) && (Math.random() < 0.6 || (f.weaponId === 'song_luc' && m.time - (f.ws.swapT || -9) < 1.3))) return { k: 'U' };
    if (f.form === 'mech') {
      if (f.T('roxie_12b') && m.time - (f.ws.cEnd || -9) < 0.7 && can('B') && d < 185) return { k: 'B' };
      if (f.ws.mechHp < 30 && d < 175 && can('D')) return { k: 'D', hold: true };
      if (d > 180 && d < 430 && can('D')) return { k: 'D' };
      if (d < 175 && can('B')) return { k: 'B' };
      if (d < 108 && can('A')) return { k: 'A' };
      if (d > 150 && d < 450 && can('A')) return { k: 'A', hold: true };
      if (d > 120 && d < 320 && can('C')) return { k: 'C', cast: angTo(f, t) };
      return null;
    }
    if (f.form === 'oktaform' || f.form === 'cyborg') return null;
    switch (f.weaponId) {
      case 'katana': {
        if (f.ws.wave && can('D') && d > 60 && d < 430) return { k: 'D' };
        const last = f.ws.last && f.ws.lastT < 1.8;
        if (d <= 92 && can('A')) return { k: 'A' };
        if (d > 45 && d < 118 && can('B')) return { k: 'B' };
        if (f.T('ryoma_12b') && can('B') && d > 110 && d < 330 && !m.arena.blocked(f.x, f.y, t.x, t.y, 4)) return { k: 'B' };
        if (can('C') && !(f.ws.backT > 0) && ((last && d > 60 && d < 240) || (d > 110 && d < 260))) return { k: 'C', cast: angTo(f, t) };
        return null;
      }
      case 'voice': {
        const g = f.ws.guard;
        if (f.T('aria_12b') && g && g.alive && dist(f, g) > 230 && can('D') && (d < 150 || f.percent > 80 || m.arena.edgeDist(f.x, f.y) < 80)) return { k: 'D' };
        if (can('D') && (d < 120 || (f.percent > 80 && d < 220)) && !(f.T('aria_12b') && g && dist(f, g) > 230)) return { k: 'D' };
        const note = this.desiredNote(m, t);
        if (can(note)) return { k: note };
        return 'wait';
      }
      case 'hand': {
        const gc = gearCost(f), battery = this.flag === 'battery', room = f.ws.cannons.length < cannonMax(f);
        if (f.ws.parts >= 3 && !f.ws.mech && can('D')) return { k: 'D', hold: d > 230 };
        if (f.T('roxie_6b') && (f.ws.padCd || 0) < m.time && d > 50 && d < 320 && !(f.ws.gears >= 2 && room) && can('A')) return { k: 'A', hold: true };
        if (battery && room && f.ws.gears >= 2 && d > 90 && d < 420 && can('A')) return { k: 'A', hold: true };
        if (!battery && f.ws.parts < 3 && f.ws.gears >= gc && can('D') && !(f.ws.gears < gc + 2 && !f.ws.cannon && d < 350)) return { k: 'D' };
        if (f.ws.cannon && can('B') && (f.T('roxie_6a') ? d < 140 && f.percent > 40 : dist(f.ws.cannon, t) < 110)) return { k: 'B' };
        if (room && f.ws.gears >= 2 && d > 110 && d < 360 && can('A') && Math.random() < 0.45) return { k: 'A', hold: true };
        if (d < 450 && can('A') && !m.arena.blocked(f.x, f.y, t.x, t.y, 4)) return { k: 'A' };
        return 'wait';
      }
      case 'vuot': {
        // Koda: A cào tích Chảy Máu • D Vồ Mồi áp sát • B Xé Toạc kết liễu khi đủ tầng
        if (f.ws.cling) {
          if ((d < 290 || f.ws.cling.t < 0.4) && (can('D') || can('A'))) return { k: can('D') ? 'D' : 'A' };
          return 'wait';
        }
        const b = t.has('bleed');
        if (b && b.n >= bleedCap(f) - (f.has('berserk') ? 2 : 1) && can('B')) return { k: 'B' };
        if (can('C') && d > 140 && Math.random() < 0.7) return { k: 'C' };
        if (d < 62 && can('A')) return { k: 'A' };
        if (d > 55 && d < 220 && can('D')) return { k: 'D' };
        return null;
      }
      case 'thuong': {
        // Theron: A đâm tích • B Xung Phong ghim tường • C nhảy né • D quét chân ngắt chiêu
        if (f.ws.vault > 0) {
          if (d < 80 || f.ws.vault < 0.25) return { k: 'C' };
          return 'wait';
        }
        if (can('B') && d < 300 && (this.pinAligned(m, f, t) || (t.percent > 90 && d < 200))) return { k: 'B' };
        if (can('D') && d < 115 && ((t.action && t.action.atk) || Math.random() < 0.3)) return { k: 'D' };
        if (can('A') && d > 50 && d < 182) return { k: 'A' };
        return null;
      }
      case 'liem': {
        // Death: A gặt tích • D kéo liềm • B Phán Quyết kết liễu
        if (f.ws.thrown) { this.retreatT = 0.3; return 'wait'; }
        if (t.percent > deathLine(f) && can('B') && d < 186) return { k: 'B' };
        if (can('D') && d > 120 && d < 285) return { k: 'D' };
        const aR = f.T('death_12b') ? 196 : 142;
        if (can('A') && d > 55 && d < aR) return { k: 'A' };
        if (can('C') && d > 170 && d < 320 && Math.random() < 0.3) return { k: 'C' };
        if (can('B') && d > 90 && d < 182 && t.percent > 60) return { k: 'B' };
        return null;
      }
      case 'nam_tay': {
        // Borg: A đấm tích • C gồng hút • B Trả Đòn kết liễu • D chộp quật
        if (f.ws.charge > 0 && can('B') && d < 104) return { k: 'B' };
        if (can('C') && f.ws.charge === 0 && t.action && t.action.atk && d < 170) return { k: 'C' };
        if (f.T('borg_12a') && f.ws.charge === 0 && can('B') && d > 110 && d < 270) return { k: 'B', hold: true };
        if (can('D') && d > 30 && d < 170 && (f.T('borg_6a') ? this.pushAligned(m, t) || t.percent > 90 : Math.random() < 0.55)) return { k: 'D' };
        if ((t.has('stun') || t.percent > 80) && can('B') && d < 80) return { k: 'B' };
        if (can('A') && d < 62) return { k: 'A' };
        return null;
      }
      case 'sung_san': {
        // Clint: A báng súng (tích + nạp đạn) • B bắn kết liễu
        if (f.ws.shells > 0 && d < 115 && can('B')) return { k: 'B' };
        if (f.ws.shells === 0 && d < 64 && can('A')) return { k: 'A' };
        if (f.ws.shells === 0 && f.cd.A > 0 && can('D') && d < 340) return { k: 'D' };
        return null;
      }
      case 'song_luc': {
        // Chrono áp sát san bằng tất cả; Neo giữ khoảng cách cấu rỉa. Hết đạn thế này thì đổi sang thế kia.
        const chrono = f.ws.stance === 'chrono', fl = this.flag;
        const empty = chrono ? f.ws.ammoC <= 0 : f.ws.ammoN <= 0, otherOk = chrono ? f.ws.ammoN > 0 : f.ws.ammoC > 0;
        // chiến thuật Chấp Niệm / Thao Túng: chỉ đổi thế khi thế ưa thích hết đạn
        const cs = this.cmd && this.cmd.stance;
        const want = cs ? (cs === 'chrono' ? !chrono && f.ws.ammoC > 0 : chrono && f.ws.ammoN > 0) : fl === 'chrono' ? !chrono && f.ws.ammoC > 0 : fl === 'neo' ? chrono && f.ws.ammoN > 0 : (d < 170 && !chrono && f.ws.ammoC > 0) || (d > 260 && chrono);
        if (can('D') && ((empty && otherOk) || want)) return { k: 'D' };
        if (chrono && can('B') && d < 330 && (f.percent < 120 || t.percent > 80)) return { k: 'B' };
        if (!chrono && can('B') && d < 300 && t.percent > 70) return { k: 'B' };
        return null;
      }
      case 'kiem_dai': {
        // Gideon: luôn giữ đối thủ ở mũi kiếm (Điểm Ngọt). Quá gần thì lùi / húc cán kiếm thay vì chém bằng phần cán.
        const emp = f.ws.emp > 0, all = f.T('gideon_12b');
        if (!all && d < 88 && !emp && !(t.has('stun') || t.has('root'))) {
          if (!f.T('gideon_6b') && can('D') && d < 74) return { k: 'D' };
          this.backoff = m.time + 0.35;
          return 'wait';
        }
        if (can('B') && d > 140 && d < (emp ? 245 : 205) && (this.finishWindow(m, t) || Math.random() < 0.55)) return { k: 'B' };
        if (can('A') && d > (all ? 50 : 88) && d < (emp ? 195 : 162)) return { k: 'A' };
        return 'wait';
      }
      case 'truong': {
        // Ignatius: dịch chuyển áp sát phía trong sân để vụ nổ điểm đến đẩy đối thủ ra mép
        if (can('C') && d > 150 && d < 300 && this.tech.tactic >= 3 && m.arena.edgeDist(t.x, t.y) < 200 && this.pushAligned(m, t) && Math.random() < 0.5) {
          f.castDist = d - 70; return { k: 'C', cast: angTo(f, t) };
        }
        if (f.T('ignatius_6a') && can('D') && ((t.weapon.ai.ranged && d < 520) || (d < 230 && !t.weapon.ai.ranged))) return { k: 'D' };
        return null;
      }
      case 'ban_tia': {
        // Raven: Oca luôn ưu tiên • bị áp sát → khói + lăn lùi • Chế độ Thợ Săn khi mục tiêu bị đánh dấu
        if (can('D') && d < 760) return { k: 'D' };
        if (d < 100 && can('C')) { this.retreatT = 0.8; return { k: 'C', cast: escapeAngle(f, t, m) }; }
        const hunt = t.ocaMark && t.ocaMark.owner === f && t.ocaMark.until > m.time;
        if (hunt) return can('B') ? { k: 'B' } : 'wait';
        if (m.arena.blocked(f.x, f.y, t.x, t.y, 4)) return null;
        if (can('B') && (d > 200 || f.T('raven_12a')) && (this.finishWindow(m, t) || t.percent > 55 || f.T('raven_12a') || Math.random() < 0.45)) return { k: 'B' };
        if (can('A') && d < 460) return { k: 'A' };
        return null;
      }
      case 'ao_thuat': {
        // Alice: đứng xa phi dao + giữ ảo ảnh làm mồi; CHỈ áp sát khi chắc hạ được đối thủ
        const ills = aliceIllusions(f, m), hype = f.ws.hype || 0, kill = aliceKillable(f, t, m);
        if (f.percent >= 900) return can('A') && d < 330 ? { k: 'A' } : 'wait';
        if (can('D') && ills.length && ((d < 110 && t.action && t.action.atk) || (m.arena.edgeDist(f.x, f.y) < 80 && d < 240) || (d < 130 && !kill))) return { k: 'D' };
        // C: giữ ảo ảnh làm mồi; đủ 50 Náo Nhiệt thì đổi chỗ khi đối thủ trong tầm (vừa thoát thân vừa ép đối thủ ra chỗ mình đứng)
        if (can('C') && (hype < 50 || d < 300)) return { k: 'C', cast: escapeAngle(f, t, m) };
        const fooled = t.focus && t.focus.by && t.focus.by.kind === 'illusion';
        const back = Math.abs(angDiff(t.facing, angTo(t, f))) > 1.6;
        if (kill && can('B') && d < 140 && (fooled || back || t.has('stun') || t.has('root') || f.T('alice_6b'))) return { k: 'B' };
        // bị áp sát mà chưa thể kết liễu: xả vòng phi dao đẩy lùi rồi tiếp tục giữ khoảng cách
        if (!kill && d < 120 && hype >= 20 && can('A')) return { k: 'A' };
        if (can('A') && d < 340) return { k: 'A' };
        return null;
      }
      case 'con': {
        // Wukong: A hút (Khí Ấn 1) → B đâm xuyên (Khí Ấn 2) → D Định Thân → C gồng tối đa đập mục tiêu đang hóa đá
        if (qiTarget(f, m) && can('D')) return { k: 'D' };
        if (t._stoneUntil > m.time && can('C') && d < 230) { f.ws.holdWant = Math.max(0.5, t._stoneUntil - m.time - 0.15); return { k: 'C', cast: angTo(f, t) }; }
        // gặp Borg: bị áp sát thì đứng lên ngọn côn gồng 3s thả diều
        if (t.weaponId === 'nam_tay' && d < 100 && can('C')) { f.ws.holdWant = 3; return { k: 'C', cast: escapeAngle(f, t, m) }; }
        // kiếm sĩ phản đòn đang thủ thế: không đâm B thẳng mặt, nhảy C đánh úp từ trên xuống
        const guarded = (t.weaponId === 'song_kiem' || t.weaponId === 'katana' || t.weaponId === 'rapier') && (t.has('parry') || !(t.moveDir.x || t.moveDir.y));
        if (guarded && can('C') && d < 200 && Math.random() < 0.5) return { k: 'C', cast: angTo(f, t) };
        const emp = f.ws.focus >= 50 || f.ws.ultT > 0;
        if (can('A') && d < (emp ? 220 : 130)) return { k: 'A' };
        if (can('B') && !guarded && d > 50 && d < (emp ? 300 : 155)) return { k: 'B' };
        return null;
      }
      case 'song_kiem': {
        // Kazuki: phản đòn chỉ khi đối thủ ra đòn nặng • chọn Kiếm Thế theo tình huống
        const act = t.action;
        const heavy = act && act.atk && (act.windup || act.charge || act.dur >= 0.4);
        const ryoNext = t.weaponId === 'katana' && t.ws.last && t.ws.lastT < 1.8 && act && act.atk;
        if (can('D') && d < 190 && (ryoNext || (heavy && Math.random() < 0.5))) return { k: 'D' };
        const n = kzNeed(f);
        if (can('C') && f.ws.si >= 5 && f.percent > 70 && d < 240) return { k: 'C', hold: true };
        if (f.T('kazuki_12a')) { if (can('C') && d < 200) return { k: 'C', cast: angTo(f, t) }; return can('A') && d < 96 ? { k: 'A' } : null; }
        const crowd = m.enemiesOf(f).filter((e) => dist(e, f) < 130).length > 1;
        const want = t.weapon.ai.ranged || d > 170 ? 'BB' : t.percent > 80 ? (m.arena.edgeDist(t.x, t.y) < 220 ? 'AB' : 'BB') : crowd ? 'AA' : 'BA';
        const form = kzForm(f, m);
        if (can('C') && form === want && d < (want === 'BB' ? 210 : 130)) return { k: 'C', cast: angTo(f, t) };
        if (can('C') && form && d < 120 && Math.random() < 0.3) return { k: 'C', cast: angTo(f, t) };
        if (!can('C') && f.cd.C > 1.2) return can('A') && d < 92 ? { k: 'A' } : can('B') && d < 106 ? { k: 'B' } : null;
        const win = f.T('kazuki_1b') ? 2.5 : 1.5, last = m.time - (f.ws.lastT || -9) <= win ? f.ws.seq[f.ws.seq.length - 1] : null;
        const next = last === want[0] && form !== want ? want[1] : want[0];
        if (can(next) && d < (want === 'BB' ? 230 : 104)) return { k: next };
        void n;
        return null;
      }
      case 'co_lenh': {
        // Victoria: sát mép / bị dồn → Lục lướt vào giữa • mục tiêu 2–3.5m → Cờ: B cắm cờ đẩy ra rìa + choáng → A Donut • xa >4.5m & ≥2 lính → AR: C bão lửa → A
        const mode = f.ws.stance, n = vicSold(f).length, edge = m.arena.edgeDist(f.x, f.y);
        const dead = vicMax(f) - n;
        if (f.ultReady() && can('U') && (dead >= 2 || t.percent > 80)) return { k: 'U' };
        let want = mode;
        if (t.weaponId === 'nam_tay') want = d < 110 && mode === 'ar' ? 'ar' : 'ar';
        else if (t.weaponId === 'ao_thuat' && m.minions.some((x) => x.team !== f.team && x.kind === 'illusion')) want = 'flag';
        else if (edge < 100 || (f.percent > 110 && d < 150)) want = 'pistol';
        else if (d >= 70 && d <= 150) want = 'flag';
        else if (d > 180 && n >= 2) want = 'ar';
        // gặp Borg áp sát đúng lúc đang AR: bấm D xoay sang Cờ là mất Flash — ưu tiên giữ AR, lùi lại
        if (want !== mode && can('D') && !(t.weaponId === 'nam_tay' && mode === 'ar')) return { k: 'D', cast: edge < 100 ? Math.atan2(-f.y, -f.x) : angTo(f, t) };
        if (mode === 'pistol') {
          if (edge < 100 && can('B')) return { k: 'B', cast: Math.atan2(-f.y, -f.x) };
          if (can('C') && d < 520) return { k: 'C' };
          return can('A') && d < 440 ? { k: 'A' } : null;
        }
        if (mode === 'ar') {
          if (can('C') && d < 430 && n >= 1) return { k: 'C' };
          if (can('B') && d > 110 && d < 360) return { k: 'B' };
          return can('A') && d < 420 ? { k: 'A' } : null;
        }
        if (can('B') && d < 125) return { k: 'B' };
        if (can('A') && d < 160 && (t.has('stun') || (d > 62 && d < 150))) return { k: 'A' };
        if (can('C') && n >= 2 && d < 400) return { k: 'C' };
        return null;
      }
      case 'bai': {
        // Joker: rút bài liên tục • tay trắng → C tráo • cầm Bích + đối thủ sát mép → ném • cầm Joker → chờ địch sát mép rồi đổi chỗ
        const card = f.ws.card, edgeT = m.arena.edgeDist(t.x, t.y);
        if (t.weaponId === 'luc_xoay' && t.ws.rr && can('C') && d < 500) return { k: 'C', cast: angTo(f, t) + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) };
        if (f.ws.stolen && can('D') && d < 380) return { k: 'D' };
        if (f.ultReady() && can('U') && ((f.percent > 85 && t.percent < 40) || t.percent > 95 || f.T('joker_12b') && t.percent > 70)) return { k: 'U' };
        if (!card && can('B')) return { k: 'B' };
        if (!card && can('C') && !(m.time - (f.ws.cFail || -9) < 1)) return { k: 'C', cast: d < 150 ? escapeAngle(f, t, m) : angTo(f, t) + Math.PI / 2 };
        if (card === 'heart' && f.percent < 8 && can('C')) return { k: 'C', cast: escapeAngle(f, t, m) };
        if (card === 'joker' && edgeT > 140 && t.percent < 70 && m.time - (f.ws.drawT || 0) < 4) return 'wait';
        if (can('A') && d < 410) return { k: 'A' };
        return null;
      }
      case 'thiet_phien': {
        // Diệp Thanh Phong: nguy hiểm → về Thuận + khiên gió + C dịch chuyển vào trong • mục tiêu >70% trong 4m → Nghịch + B ám sát sau lưng
        const st = tpState(f), edge = m.arena.edgeDist(f.x, f.y);
        if (edge < 80 || f.percent > 80) {
          if (st === 'nghich' && can('D')) return { k: 'D' };
          if (st === 'thuan' && can('B') && !(f.ws.shieldT > 0) && d < 300) return { k: 'B' };
          if (can('C') && (edge < 80 || d < 110)) return { k: 'C', cast: Math.atan2(-f.y, -f.x) };
        }
        // Vesper ẩn thân áp sát: bung gió 360° đẩy văng
        if (t.weaponId === 'dao' && (t.has('invis') || t.has('untargetable') || d < 90) && d < 170 && can('B') && st !== 'nghich') return { k: 'B' };
        // Alice: vùng gió mù vô hiệu tầm nhìn
        if (t.weaponId === 'ao_thuat' && can('C') && d < 120) return { k: 'C', cast: angTo(f, t) + Math.PI / 2 };
        if (f.ultReady() && can('U') && d < 190 && (t.has('stun') || t.has('slow') || t.percent > 60 || f.T('thanhphong_12b'))) return { k: 'U' };
        if (t._sleepT > m.time) {
          if (st === 'nghich' && can('B') && d < 320) return { k: 'B' };
          if (can('A') && d < 380) return { k: 'A' };
        }
        if (t.percent > 70 && d < 170) {
          if (st !== 'nghich' && can('D')) return { k: 'D' };
          if (st === 'nghich' && can('B')) return { k: 'B' };
        }
        if (st === 'nghich' && can('B') && d < 300 && Math.random() < 0.5) return { k: 'B' };
        if (can('A') && d < 380) return { k: 'A' };
        if (st !== 'nghich' && can('B') && d < 100) return { k: 'B' };
        if (can('D') && Math.random() < 0.12) return { k: 'D' };
        return null;
      }
      case 'binh_doc': {
        // Galo: Người (Tư duy cao) thả diều 4–6m tích độc → đủ 6 tầng thì "Quá Liều" hóa Thú • Thú (Tư duy 20): lao vào cắn xé
        const beast = galoBeast(f), v = galoN(f, t, m);
        if (!beast) {
          if (d < 80 && can('C')) return { k: 'C', cast: escapeAngle(f, t, m) };
          if (f.ultReady() && can('U') && (f.T('galo_12b') ? d < 220 : ((t.weaponId === 'ao_thuat' || t.weaponId === 'dao') || v >= 2))) return { k: 'U' };
          if (can('D') && (v >= 6 || (v >= 4 && t.percent > 80) || f.percent > 120)) return { k: 'D' };
          if (can('B') && d > 90 && d < 300) return { k: 'B' };
          if (can('A') && d < (f.T('galo_6b') ? 150 : 340)) return { k: 'A' };
          return null;
        }
        if (f.ultReady() && can('U') && (t.percent > 50 || f.T('galo_12b'))) return { k: 'U' };
        if (can('C') && d > 80 && d < 220) return { k: 'C', cast: angTo(f, t) };
        if (can('D') && d < 140) return { k: 'D' };
        if (can('B') && d < 170) return { k: 'B', cast: angTo(f, t) };
        if (can('A') && d < 85) return { k: 'A' };
        return null;
      }
      case 'luc_xoay': {
        // đang chơi Cò Quay Nga: chỉ còn cách bóp cò
        if (f.ws.rr) return can('A') && d < 600 && !m.arena.blocked(f.x, f.y, t.x, t.y, 6) ? { k: 'A' } : 'wait';
        if (f.ultReady() && can('U')) return { k: 'U' };
        if (f.T('jack_6b') && f.ws.cyl >= 3 && d < 230 && can('A') && Math.random() < 0.5) return { k: 'A', hold: true };
        return null;
      }
    }
    return null;
  }
  desiredNote(m, t) {
    const f = this.f, d = dist(f, t);
    const notes = f.ws.notes || [];
    let want;
    if (this.cmd && this.cmd.note) return this.cmd.note;
    // Khúc Ca Ru Ngủ: gõ đúng chuỗi A → B → C
    if (f.T('aria_12a') && d < 650 && notes.every((n, i) => n === 'ABC'[i]) && f.percent < 140) return 'ABC'[notes.length];
    if (this.flag === 'noteA' && f.percent < 130) return 'A';
    if (this.flag === 'noteB' && f.percent < 130) return 'B';
    if (f.percent > 80) want = 'C';
    else if (d < 130 || t.percent > 90) want = 'A';
    else if (d > 220) want = 'B';
    else want = notes[0] || 'A';
    if (notes.length && notes[0] !== want && notes.length === 2 && notes[0] === notes[1]) want = notes[0];
    return want;
  }
  pinAligned(m, f, t) {
    const a = angTo(f, t);
    for (const p of m.arena.pillars) {
      const dx = p.x - t.x, dy = p.y - t.y, along = dx * Math.cos(a) + dy * Math.sin(a), perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
      if (along > 0 && along < 260 && perp < p.r + t.r) return true;
    }
    const q = { x: t.x + Math.cos(a) * 130, y: t.y + Math.sin(a) * 130 };
    return m.arena.edgeDist(q.x, q.y) < 0 && t.percent > 40;
  }

  findThreat(m) {
    const f = this.f;
    for (const p of m.projs) {
      if (p.owner.team === f.team || p.dead) continue;
      const dx = f.x - p.x, dy = f.y - p.y, dd = Math.hypot(dx, dy);
      if (dd > 320) continue;
      const along = (dx * p.vx + dy * p.vy) / p.speed;
      if (along < 0) continue;
      if (along / p.speed > 0.45) continue;
      const perp = Math.abs(dx * p.vy - dy * p.vx) / p.speed;
      if (perp < f.r + p.r + 10) return { proj: p, angle: Math.atan2(p.vy, p.vx), x: p.x, y: p.y };
    }
    for (const e of m.enemiesOf(f)) {
      const a = e.action;
      if (!a || !a.atk) continue;
      const d = dist(f, e);
      const reach = (e.weapon.ai && e.weapon.ai.ranged ? 160 : ((e.weapon.ai && e.weapon.ai.range) || 80) + 75);
      if (d < reach && Math.abs(angDiff(e.facing, angTo(e, f))) < 1.3) return { enemy: e, angle: angTo(e, f), x: e.x, y: e.y };
    }
    return null;
  }

  dodgeAngle(m, threat, t) {
    const f = this.f;
    const options = [threat.angle + Math.PI / 2, threat.angle - Math.PI / 2, angTo(threat, f)];
    let best = options[0], bs = -Infinity;
    for (const a of options) {
      const p = { x: f.x + Math.cos(a) * 120, y: f.y + Math.sin(a) * 120 };
      const s = m.arena.edgeDist(p.x, p.y) - (m.arena.nearPillar({ ...p, r: f.r }, 0) ? 80 : 0) + rand(0, 30);
      if (s > bs) { bs = s; best = a; }
    }
    return best;
  }

  // ----- Di chuyển -----
  steer(m, t, dt) {
    const f = this.f, W = f.weapon, A = m.arena;
    if (f.ws.turret && !f.T('percy_12c:gatling') && !(f.T('percy_12c:overheat') && f.ws.turret.t > 5 && dist(f, t) > turretRange(f))) {
      const d = dist(f, t);
      if (d > 85 || Math.random() < 0.6) { f.moveDir = { x: 0, y: 0 }; return; }
    }
    if (f.ws.cling) { f.moveDir = { x: 0, y: 0 }; return; }
    const look = this.lastSeen || t;
    const tacLv = this.tech.tactic, tac = this.tacEff;
    const d = dist(f, t);
    let pref = (W.ai.range || 80) * tac.dist * (1 + 0.25 * this.danger - 0.15 * this.opp);
    if (this.pid === 'elara') pref = Math.max(pref, 380);
    if (this.pid === 'raven') pref = Math.max(pref, 430);
    if (this.pid === 'wukong') pref = t.weaponId === 'nam_tay' ? 240 : 120;
    if (this.pid === 'alice') pref = f.percent >= 900 ? 420 : aliceKillable(f, t, m) ? 110 : 290;
    if (this.pid === 'victoria') pref = t.weaponId === 'nam_tay' ? 300 : f.ws.stance === 'flag' ? 100 : f.ws.stance === 'ar' ? 300 : 210;
    if (this.pid === 'joker') pref = JK_FEM.has(t.charId) ? 330 : JK_LOW.includes(t.charId) ? 100 : 180;
    if (this.pid === 'thanhphong') pref = tpState(f) === 'nghich' ? 110 : tpState(f) === 'thuan' ? 220 : 150;
    if (this.pid === 'galo') pref = galoBeast(f) ? 40 : t.weaponId === 'nam_tay' ? 280 : 200;
    if (this.spaceErr) pref *= 1 + this.spaceErr;
    if (this.allIn) pref = Math.min(pref, (W.ai.range || 80) * 0.6, W.ai.ranged ? 200 : 999);
    // Gideon: giữ đối thủ ở mũi kiếm; bị áp sát thì lùi gấp
    if (f.weaponId === 'kiem_dai') { pref = f.T('gideon_12b') ? 120 : 150; if (d < 100 && !f.T('gideon_12b')) pref = 170; }
    // dụ đòn: lởn vởn ngay ngoài tầm đối thủ • bắt bài: lao vào • combo: tiến vào tầm chiêu đầu tiên
    if (this.bait) pref = this.bait.dist;
    if (this.punishT > m.time) pref *= 0.55;
    if (f.has('immortal')) pref *= 0.5;
    if (this.seq && this.seq.i === 0 && !this.seq.anyRange) {
      const sk = W.skills[this.seq.keys[0]];
      if (sk && sk.ai && sk.ai.max && !isMobility(sk)) pref = Math.min(pref, sk.ai.max * 0.75);
    }
    let gx, gy;
    let custom = this.imm ? ((this.goalPillar = null), this.fleeGoal(m, this.imm)) : this.allIn ? null : this.customGoal(m, t);
    // chế độ 3v3: vị trí theo lệnh đội
    const to = this.teamOrder && m.time < this.teamOrder.until ? this.teamOrder : null;
    if (to && !this.imm) {
      const Ld = to.leader, sl = ((f.slot || 0) - 1);
      if (to.type === 'regroup' && Ld && Ld.alive && Ld !== f) custom = { x: Ld.x + Math.cos(sl * 2.1) * 60, y: Ld.y + Math.sin(sl * 2.1) * 60 };
      else if (to.type === 'protect' && Ld && Ld.alive && Ld !== f && dist(t, Ld) > 200) custom = { x: Ld.x + Math.cos(angTo(Ld, t) + sl) * 70, y: Ld.y + Math.sin(angTo(Ld, t) + sl) * 70 };
      else if (to.type === 'surround' && t && t === to.target) { const a = Math.atan2(t.y, t.x) + Math.PI + sl * 1.1; custom = { x: t.x + Math.cos(a) * pref * 0.9, y: t.y + Math.sin(a) * pref * 0.9 }; }
    }
    // Hỗn Chiến (tự phối hợp khi không có lệnh): kẹp hai phía • bị lẻ loi & điểm văng cao thì rút về đồng đội
    else if (m.mode === 'brawl' && !this.imm && !this.allIn && t) { const cg = this.coopGoal(m, t, pref); if (cg) custom = cg; }
    const retreating = (this.shout && this.shout.type === 'retreat') || this.retreatT > 0;
    // xạ thủ (Tư duy ≥3) và khi kẹp góc: chủ động chọn góc bắn đẹp
    if (!custom && !retreating && !this.bait && !this.allIn && ((W.ai.ranged && f.weaponId !== 'voice' && tacLv >= 3 && !BRAIN_OFF.shooter) || this.cornering)) {
      const melee = !W.ai.ranged;
      custom = this.shooterGoal(m, t, melee ? 230 : pref, this.cornering ? 160 : 25 + tacLv * 7);
    }
    if (custom) { gx = custom.x; gy = custom.y; }
    else if ((this.shout && this.shout.type === 'retreat') || this.retreatT > 0) {
      const a = angTo(t, f);
      gx = Math.cos(a) * 80; gy = Math.sin(a) * 80;
    } else {
      // đứng phía trong sân so với đối thủ để đánh văng họ ra mép
      const side = angTo(look, f);
      const inward = Math.atan2(-look.y, -look.x);
      const w = clamp(tacLv * 0.09 * tac.edge + this.opp * 0.2, 0, 0.9);
      const vx = Math.cos(side) * (1 - w) + Math.cos(inward) * w, vy = Math.sin(side) * (1 - w) + Math.sin(inward) * w;
      const a = Math.atan2(vy, vx) + this.strafe * (W.ai.ranged ? 0.5 : this.bait ? 0.75 : 0.25);
      gx = look.x + Math.cos(a) * pref; gy = look.y + Math.sin(a) * pref;
      // chủ động đi vào giữa sân: khi chưa giao tranh hoặc đang nguy hiểm
      const cw = this.allIn ? 0 : clamp((d > 360 ? 0.55 : 0) + 0.12 + 0.45 * this.danger - 0.25 * this.opp, 0, 0.75);
      gx *= 1 - cw * 0.6; gy *= 1 - cw * 0.6;
      gx = lerp(gx, 0, cw * 0.5); gy = lerp(gy, 0, cw * 0.5);
    }
    // Tư duy cao không có nghĩa là sợ mép hơn: mức thận trọng mép chỉ tăng tới Tư duy 5 rồi giữ nguyên
    const caut = this.allIn ? 0 : Math.min(tacLv, 5);
    const safe = 70 + caut * 8 * tac.edge + this.danger * 40;
    const g = A.clamp({ x: gx, y: gy }, safe);
    let dx = g.x - f.x, dy = g.y - f.y;
    const L = Math.hypot(dx, dy);
    if (L < 10) { dx = 0; dy = 0; } else { dx /= L; dy /= L; }
    // đội hình: không đứng dồn cục với đồng đội (tránh dính chung 1 đòn diện rộng)
    if (m.mode === 'brawl') for (const a of m.fighters) { if (a === f || a.team !== f.team || !a.alive) continue; const q = dist(a, f); if (q < 70 && q > 0.1) { const k = (70 - q) / 70 * 0.9; dx += (f.x - a.x) / q * k; dy += (f.y - a.y) / q * k; } }
    // né mép sàn (càng nhiều điểm văng càng sợ mép)
    const e = A.edgeDist(f.x, f.y);
    const danger = this.allIn ? 45 : 85 + caut * 10 * tac.edge + this.danger * 60;
    if (e < (this.imm ? Math.min(danger, 60) : danger)) {
      const k = clamp(1 - e / danger, 0, 1) * (0.6 + tacLv * 0.06);
      const cx = -f.x, cy = -f.y, cl = Math.hypot(cx, cy) || 1;
      dx = dx * (1 - k) + (cx / cl) * k; dy = dy * (1 - k) + (cy / cl) * k;
    }
    [dx, dy] = avoidPillars(f, m, dx, dy, this.goalPillar);
    [dx, dy] = this.avoidHazards(m, dx, dy);
    const n = Math.hypot(dx, dy);
    const spd = L < 30 ? L / 30 : 1;
    f.moveDir = n > 0.01 ? { x: (dx / n) * spd, y: (dy / n) * spd } : { x: 0, y: 0 };
  }

  // né vùng nguy hiểm của sàn (đá rơi, sét, dung nham, cát lún), chống gió & sóng
  avoidHazards(m, dx, dy) {
    const f = this.f, sense = 0.5 + this.tech.dodge * 0.06;
    for (const d of m.dangers) {
      const px = f.x - d.x, py = f.y - d.y, dd = Math.hypot(px, py), R = d.r + f.r + 35;
      if (dd > R || dd < 0.01) continue;
      const k = (1 - dd / R) * 2.2 * sense;
      dx += (px / dd) * k; dy += (py / dd) * k;
    }
    const h = m.hz || {};
    // gió giật: đi ngược chiều gió khi sắp bị thổi ra mép
    if (m.arena.hazard === 'wind' && (h.gust > 0 || h.warn)) {
      const ahead = { x: f.x + Math.cos(h.dir) * 160, y: f.y + Math.sin(h.dir) * 160 };
      if (m.arena.edgeDist(ahead.x, ahead.y) < 60) { dx -= Math.cos(h.dir) * 1.2 * sense; dy -= Math.sin(h.dir) * 1.2 * sense; }
    }
    // sóng tràn: chạy về phía con sóng đến (đầu nguồn) để không bị cuốn ra mép
    if (m.arena.hazard === 'waves' && (h.warn || h.front !== null)) {
      const target = -h.dir * m.arena.hx * 0.35;
      dx += Math.sign(target - f.x) * 1.3 * sense;
    }
    return [dx, dy];
  }

  customGoal(m, t) {
    const f = this.f, id = f.weaponId;
    this.goalPillar = null;
    // Ấn Võ Thần: tranh ấn nếu đang ở gần và không quá nguy hiểm
    if (m.rune && dist(f, m.rune) < 380 && this.danger < 1.1 && !f.has('berserk')) return { x: m.rune.x, y: m.rune.y };
    // Percy gặp Elara: bỏ chạy
    if (this.pid === 'percy' && t.weaponId === 'cung') { const a = angTo(t, f); return { x: f.x + Math.cos(a) * 200, y: f.y + Math.sin(a) * 200 }; }
    // Aria trên 80%: chạy về phía Oktava tìm bảo bọc
    const mode = this.cmd && this.cmd.mode, g = f.ws.guard;
    if (id === 'voice' && mode === 'split') {
      // Tách ra: Aria đứng xa, tránh cả đối thủ lẫn chỗ Oktava đang giao chiến
      let a = angTo(t, f);
      if (g && g.alive) { const ag = angTo(t, g); if (Math.abs(angDiff(a, ag)) < 1) a = ag + Math.PI * 0.75 * (angDiff(ag, a) >= 0 ? 1 : -1); }
      return m.arena.clamp({ x: t.x + Math.cos(a) * 330, y: t.y + Math.sin(a) * 330 }, 90);
    }
    if (id === 'voice' && mode === 'gather' && g && g.alive && f.ws.mounted <= 0) {
      // Tập hợp: nép sau lưng Oktava (Oktava chắn giữa Aria và đối thủ)
      const a = angTo(t, g); return m.arena.clamp({ x: g.x + Math.cos(a) * 75, y: g.y + Math.sin(a) * 75 }, 80);
    }
    if (id === 'voice' && f.T('aria_12c') && dist(f, t) < 280) { const a = angTo(t, f); return m.arena.clamp({ x: t.x + Math.cos(a) * 320, y: t.y + Math.sin(a) * 320 }, 90); }
    if (id === 'voice' && f.percent > 80 && f.ws.guard && f.ws.guard.alive && f.ws.mounted <= 0) return { x: f.ws.guard.x, y: f.ws.guard.y };
    // The Hand: ưu tiên nhặt bánh răng (giai đoạn 1)
    if (id === 'hand' && f.form !== 'mech' && m.gears.length && f.ws.gears < 9 && !(f.ws.parts >= 3)) {
      let best = null, bd = Infinity;
      for (const g of m.gears) {
        const dd = Math.hypot(g.x - f.x, g.y - f.y) + Math.hypot(g.x - t.x, g.y - t.y) < 120 ? 400 : 0;
        const s = Math.hypot(g.x - f.x, g.y - f.y) + dd;
        if (s < bd) { bd = s; best = g; }
      }
      // chỉ cần lại gần 3m là bánh răng tự bay về → không phải chạy hẳn tới chỗ bánh răng
      if (best && bd < 420 && this.danger < 1) { const L = Math.hypot(f.x - best.x, f.y - best.y); if (L < 110) return null; return { x: best.x + (f.x - best.x) / L * 100, y: best.y + (f.y - best.y) / L * 100 }; }
    }
    // Koda: tìm cột để bám rình rập
    if (id === 'vuot' && !f.T('koda_12a') && !f.ws.cling && f.cd.C <= 0 && dist(f, t) > 150 && !f.has('berserk')) {
      const p = m.arena.pillars.slice().sort((a, b) => dist(a, f) - dist(b, f))[0];
      if (p && dist(p, f) < 320) { this.goalPillar = p; const a = Math.atan2(f.y - p.y, f.x - p.x); return { x: p.x + Math.cos(a) * (p.r + f.r + 6), y: p.y + Math.sin(a) * (p.r + f.r + 6) }; }
    }
    // Theron: canh góc để đối thủ nằm giữa mình và cột
    if (id === 'thuong' && f.cd.B <= 0 && m.arena.pillars.length) {
      const p = m.arena.pillars.slice().sort((a, b) => dist(a, t) - dist(b, t))[0];
      if (dist(p, t) < (this.flag === 'pin' ? 420 : 260)) { const a = Math.atan2(t.y - p.y, t.x - p.x); return { x: t.x + Math.cos(a) * 170, y: t.y + Math.sin(a) * 170 }; }
    }
    // Rapier: tới hướng của ấn chưa phá (Florian: đứng phía trước nếu đang ở sau lưng)
    if (id === 'rapier' && t.marks && t.marks.owner === f) {
      const cur = angTo(t, f);
      let best = null, bd = 9;
      t.marks.list.forEach((on, i) => {
        if (!on) return;
        const a = i * Math.PI / 2;
        if (this.pid === 'florian' && Math.abs(angDiff(t.facing, a)) > 2.1) return;
        const dd = Math.abs(angDiff(cur, a));
        if (dd < bd) { bd = dd; best = a; }
      });
      if (best !== null) {
        const r = bd < 0.4 ? 120 : 150;
        const step = clamp(angDiff(cur, best), -0.9, 0.9);
        const a = Math.abs(angDiff(cur, best)) < 0.4 ? best : cur + step;
        return { x: t.x + Math.cos(a) * r, y: t.y + Math.sin(a) * r };
      }
    }
    if (this.pid === 'florian' && Math.abs(angDiff(t.facing, angTo(t, f))) > 2.1) {
      const a = t.facing; return { x: t.x + Math.cos(a) * 140, y: t.y + Math.sin(a) * 140 };
    }
    // Dao găm: vòng ra sau lưng đối thủ
    if (id === 'dao' && this.tech.tactic >= 2 && Math.random() < 0.9) {
      const back = t.facing + Math.PI;
      const cur = angTo(t, f);
      const step = clamp(angDiff(cur, back), -0.8, 0.8);
      const r = dist(f, t) > 120 ? 85 : 50;
      return { x: t.x + Math.cos(cur + step) * r, y: t.y + Math.sin(cur + step) * r };
    }
    // Death: kẻ địch quá 100% → áp sát kết liễu
    if (id === 'liem' && t.percent > 100) { const a = angTo(t, f); return { x: t.x + Math.cos(a) * 150, y: t.y + Math.sin(a) * 150 }; }
    return null;
  }
}

// Né cột trên đường đi
function avoidPillars(f, m, dx, dy, except) {
  for (const p of m.arena.pillars) {
    if (p === except) continue;
    const px = p.x - f.x, py = p.y - f.y, dd = Math.hypot(px, py);
    if (dd > p.r + f.r + 80) continue;
    const along = px * dx + py * dy;
    if (along <= 0) continue;
    const perp = -px * dy + py * dx;
    if (Math.abs(perp) > p.r + f.r + 8) continue;
    const s = perp > 0 ? -1 : 1;
    const k = clamp(1 - (dd - p.r - f.r) / 80, 0.3, 1);
    const tx = -((p.y - f.y) / dd) * s, ty = ((p.x - f.x) / dd) * s;
    dx = dx * (1 - k) + tx * k * 1.2; dy = dy * (1 - k) + ty * k * 1.2;
  }
  return [dx, dy];
}
// Di chuyển đơn giản cho thực thể triệu hồi
function steerToward(f, m, gx, gy, stop = 20) {
  if (f.dash || f.busy && f.action && f.action.move === 0) return;
  let dx = gx - f.x, dy = gy - f.y;
  const L = Math.hypot(dx, dy);
  if (L < stop) { f.moveDir = { x: 0, y: 0 }; return; }
  dx /= L; dy /= L;
  const e = m.arena.edgeDist(f.x, f.y);
  if (e < 90) { const k = clamp(1 - e / 90, 0, 1), cl = Math.hypot(f.x, f.y) || 1; dx = dx * (1 - k) - (f.x / cl) * k; dy = dy * (1 - k) - (f.y / cl) * k; }
  [dx, dy] = avoidPillars(f, m, dx, dy);
  const n = Math.hypot(dx, dy) || 1;
  f.moveDir = { x: dx / n, y: dy / n };
}
