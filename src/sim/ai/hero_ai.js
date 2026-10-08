'use strict';
// ===== AI TƯỚNG (tầng chiến thuật) — đấu trường sinh tồn 10 tướng đánh đơn =====
// Tầng chiến lược (hành động lớn: ăn quái, đi săn, tranh boss/thính, chạy bo, núp, hồi máu, kền kền…) ở utility.js;
// chiêu lên quái / lướt di chuyển / xử lý khi bị đuổi ở skill_ai.js. Tầng này: đánh ai, dùng chiêu gì, tiến hay lùi, đỡ hay né.
// Chỉ dùng thông tin tướng THẤY bằng mắt mình (u.vis[team]). Chỉ số người triệu gọi (1–20) ảnh hưởng trực tiếp:
//   meca (Kỹ Năng): ngắm chiêu, né chiêu, combo • map (Đọc Bản Đồ): nhận thức, nhận ra ảo ảnh • fight (Giao Tranh): chọn mục tiêu, vị trí
//   disc (Kỷ Luật): không đuổi quá đà, ít bốc đồng • refl (Phản Xạ): nhịp nghĩ, né, đọc đòn • mental (Tâm Lý) • stam (Thể Lực)
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, M = G.M, MAP = G.MAP;
  const { dist } = M;
  const MS = G.C.MS || 1;

  class HeroAI {
    constructor(m, u) {
      this.m = m; this.u = u;
      this.mode = 'idle'; this.target = null; this.targetT = 0;
      this.lastCharge = 1; this.fleeing = false;
      this.dodgeUntil = 0; this.dodgeGoal = null; this.seenProj = new Set();
      this.readyT = 0;           // thời điểm được phép ra chiêu tiếp (nhịp combo)
      this.dir = null;           // việc đang làm (do tầng chiến lược chọn)
      this.danger = 0;
      // thành thạo tướng (0..1): tướng lạ thì ra chiêu chậm, hay lóng ngóng bỏ lỡ nhịp combo
      this.mastK = Math.max(0, Math.min(1, (u.player.mastery == null ? 70 : u.player.mastery) / 100));
      // hệ số chỉ số theo thành thạo: 0 → 0.455, 70 → 0.91, 100 → 1.0
      this.mastF = this.mastK >= 0.7 ? 0.91 + 0.3 * (this.mastK - 0.7) : 0.91 - 0.65 * (0.7 - this.mastK);
      this.synAvg = 0.5; this.synF = 1;                       // đánh đơn: không có đồng đội
      this.nextTick = u.slot % C.AI_TICK; this.thinkAcc = 0;
      // nhịp quyết định lớn 0.3–0.5s, lệch pha giữa các tướng
      this.decPeriod = 0.3 + 0.2 * (((u.slot * 7) % 10) / 10); this.decT = (u.slot % 10) * 0.045;
      this.act = null; this.actT = 0; this.actDir = null; this.top3 = [];
      this.skDmg = {}; this.evade = null; this.turnT = 0; this.turnTgt = null;
      this.grudges = new Map();                              // thù dai: id tướng → lần cuối bị nó đánh (bị nó hạ thì nhớ lâu hơn)
      this.roamPt = null; this.roamT = 0;
      this.judge = 1; this.judgeT = 0;                       // sai số đánh giá giao tranh (Giao Tranh)
      this.strafe = (u.id % 2) ? 1 : -1; this.strafeT = 0;
      this.bait = null; this.baitCd = 0; this.punishT = 0; this.retreatT = 0; this.threatT = 0; this.callT = 0; this.reading = false;
      this.mem = new Map();                                  // ghi nhớ vị trí thấy cuối cùng của đối thủ
    }
    callout(text, color) {
      const m = this.m; if (!m.fxOn || m.time < this.callT) return;
      this.callT = m.time + 4; m.fx({ type: 'callout', id: this.u.id, text, color: color || '#cfd8e0' });
    }
    // chỉ số tuyển thủ đã quy về 0..1 (kèm thành thạo tướng & thể lực cuối trận)
    sk(k) {
      const p = this.u.player, raw = (p.stats[k] || 10) / 20;
      let v = raw * this.mastF;
      if (k === 'fight' || k === 'map') v *= this.synF;
      const min = this.m.time / 60;
      if (min > 15 && k !== 'stam') v *= 1 - Math.max(0, 0.6 - (p.stats.stam || 10) / 20) * Math.min(1, (min - 15) / 15) * 0.3;
      if (this.u.tilt) v *= 1 - this.u.tilt * 0.25;
      return Math.max(0.03, Math.min(1, v));
    }
    // thời gian phản ứng (giây): Kỹ Năng Cá Nhân cao → nghĩ dày hơn (né, lùi, ra chiêu kịp); 12/thành thạo 70 ≈ 0.1s như trước
    // GĐ5c: chủ yếu theo Phản Xạ (70%) + Kỹ Năng Cá Nhân (30%)
    reactTime() { const v = 0.1 + 0.32 * (0.55 - (0.7 * this.sk('refl') + 0.3 * this.sk('meca'))); return v < 0.06 ? 0.06 : v > 0.25 ? 0.25 : v; }
    scheduleNext(tick) {
      // hiệu suất ra đòn: tay kém thì giữa hai đòn đánh thường hụt nhịp (0–25% chu kỳ đánh)
      const lag = (0.62 - this.sk('meca')) * 0.5;
      this.u.atkLag = lag < 0 ? 0 : lag > 0.25 ? 0.25 : lag;
      this.thinkAcc += (this.seq ? C.TICK : this.reactTime()) / C.TICK;   // GĐ7b: đang múa combo thì nghĩ mỗi nhịp
      const n = Math.max(1, Math.floor(this.thinkAcc)); this.thinkAcc -= n;
      return tick + n;
    }
    // hệ số đánh giá sai tương quan lực lượng (đổi mỗi 2.5s): Giao Tranh thấp → hay lao vào trận thua / bỏ lỡ trận thắng
    judgeK() {
      const m = this.m;
      if (m.time >= this.judgeT) { this.judgeT = m.time + 2.5; const e = (1 - this.sk('fight')) * 0.7 * m.rngAI.range(-1, 1); this.judge = 1 + e + e * e * 0.5; }
      return this.u.player.fix ? this.judge * 1.5 : this.judge;      // bán độ: cố tình lao vào giao tranh thua (chết vô lý)
    }
    // ăn ý với một đồng đội cụ thể (0..1)
    synWith() { return 0.5; }
    // độ hổ báo: theo tính cách tướng, mất bình tĩnh thì liều hơn, đang chuỗi hạ gục thì tự tin hơn
    get aggr() {
      const u = this.u;
      return (u.pers ? u.pers.aggr : 1) * (1 + 0.3 * (u.tilt || 0)) * (1 + 0.04 * Math.min(4, u.streak || 0)) * (G.Persona ? G.Persona.aggrMul(this) : 1);
    }
    // GĐ5e: ghi nhớ sát thương thật của chiêu lên lính/quái (trung bình trượt)
    noteSkill(k, a) { const L = this.skDmg[k] || (this.skDmg[k] = { v: a, n: 0 }); L.v = L.n ? L.v * 0.7 + a * 0.3 : a; L.n++; }
    // tướng chưa quen tay (thành thạo < 70): nhịp combo chậm hơn
    onCast() { this.readyT = this.m.time + (0.5 - 0.4 * this.sk('meca')) * (1 + 1.3 * Math.max(0, 0.7 - this.mastK)); }
    onDeath(killer) { this.seq = null; this.target = null; this.mode = 'dead'; this.act = null; this.actDir = null; this.evade = null; this.turnT = 0; if (killer) this.grudges.set(killer.id, this.m.time + 60); }
    onRespawn() { this.mode = 'idle'; this.target = null; this.decT = 0; }
    // thời gian tích chiêu (Ignatius S2, Elara S2)
    chargeTime(max) {
      const t = this.target, d = t ? dist(this.u, t) : 6;
      const c = d > 6.5 ? max : d > 4 ? max * 0.7 : max * 0.4;
      this.lastCharge = Math.max(0.3, Math.min(max, c));
      return this.lastCharge;
    }
    // đoán vị trí mục tiêu khi chiêu bay tới (người giỏi đoán chuẩn hơn)
    lead(t, speed, extra) {
      const u = this.u, d = dist(u, t), tt = (speed ? d / speed : 0) + (extra || 0);
      const acc = 0.35 + 0.6 * this.sk('meca');
      const noise = (1 - this.sk('meca')) * 2.2;
      return {
        x: t.x + (t.vx || 0) * tt * acc + this.m.rngAI.range(-noise, noise),
        y: t.y + (t.vy || 0) * tt * acc + this.m.rngAI.range(-noise, noise),
      };
    }


    // ===================== vòng nghĩ =====================
    think() {
      const m = this.m, u = this.u;
      if (!u.alive) return;
      if (u.disabled) {
        this.tryItems(true);
        if (u.bag && m.bagCount(u, 'cleanse')) G.BagAI.tryBag(this, this.visibleEnemyHeroes(9));   // Thanh Tẩy dùng được khi bị khống chế
        // chiêu phản xạ dùng được khi bị khống chế
        for (const k of ['s1', 's2', 's3', 'sub']) {
          const d = u.hero.skills[k];
          if (d && d.whileDisabled && m.canCast(u, k) && this.visibleEnemyHeroes(6).length) { const e = this.visibleEnemyHeroes(6)[0]; if (m.castSkill(u, k, e, { x: e.x, y: e.y })) break; }
        }
        return;
      }
      this.think2();
      if (u.alive) this.tryItems(false);
      if (u.alive && m.time >= (this.bagT || 0)) { this.bagT = m.time + 0.25; G.BagAI.tryBag(this, this.enemiesNear || []); }   // GĐ7: vật phẩm trong balo
    }
    think2() {
      const m = this.m, u = this.u;
      if (u.dash) return;
      this.fleeing = false;
      if (this.seq && (this.mode !== 'fight' || this.act === 'retreat')) this.seq = null;   // GĐ7b: rời giao tranh thì bỏ chuỗi combo
      const enemies = this.visibleEnemyHeroes(13);
      const allies = [u];
      this.enemiesNear = enemies; this.alliesNear = allies;
      const mem = this.mem || (this.mem = new Map());
      for (const e of enemies) {
        mem.set(e.id, { x: e.x, y: e.y, t: m.time, vx: e.vx || 0, vy: e.vy || 0 });
      }
      for (const [id, t] of u.dmgBy) { const g = this.grudges.get(id); if (g == null || g < t) this.grudges.set(id, t); }   // thù dai
      // né chiêu định hướng & vùng sắp trúng chiêu
      if (this.dodge()) return;
      if (this.avoidDanger()) return;
      this.tryRecasts();
      // ---- đánh giá thế trận (đánh đơn) ----
      const fight = this.evalFight(enemies, allies);
      const raw = Math.min(4, fight.ratio * this.judgeK());
      this.ratioS = this.ratioS == null || !enemies.length ? raw : this.ratioS * 0.6 + raw * 0.4;
      fight.ratio = this.ratioS;
      this.fightRatio = fight.ratio;
      const threat = this.threat(enemies);
      this.threatV = threat;
      this.updateAnnoy();
      // ---- đang quyết đấu: đánh tới cùng với đối thủ trong vòng ----
      if (u.duel && u.duel.state === 'fight') {
        const o = u.duel.a === u ? u.duel.b : u.duel.a;
        if (o && o.alive) { this.mode = 'fight'; this.target = o; this.act = 'duel'; this.fightMicro(o, [o], allies, true); return; }
      }
      // ---- QUYẾT ĐỊNH LỚN bằng Utility AI (mỗi 0.3–0.5s, lệch pha; nguy cấp / đang bị bo đốt thì quyết ngay) ----
      const burning = m.zoneSt.dps > 0 && !m.inZone(u, 0) && this.act !== 'zone';
      const urgent = (enemies.length && u.hpPct < this.retreatHp() && this.act !== 'retreat') || burning;
      if (m.time >= (this.decT || 0) || urgent) { G.UtilityAI.decide(this, urgent); this.decT = m.time + this.decPeriod; }
      this.dir = this.actDir || { type: 'roam', point: this.roamPoint() };
      // GĐ7: vi mô theo tính cách (Đổi Mạng liều mạng, Quấy Nhiễu chuồn, Gieo Hỗn Loạn bắn thùng nổ, Ngụy Quân Tử đình chiến…)
      if (G.Persona && this.turnT <= m.time && G.Persona.micro(this, enemies, fight)) return;
      // AI riêng của tướng (vd Raven: tìm chỗ an toàn, thả quạ, đứng bắn súng ngắm qua tầm nhìn của quạ)
      if (u.hero.ai.micro && this.turnT <= m.time && this.hook2(u.hero.ai.micro, enemies, fight)) return;
      // đang bị đuổi mà đã quyết quay lại đánh → đánh hết mình trong ~2s
      if (this.turnT > m.time) {
        const t = this.turnTgt;
        if (t && t.alive && t.vis[u.team] && dist(t, u) < 10) { this.mode = 'fight'; this.target = t; this.fightMicro(t, enemies, allies); return; }
        this.turnT = 0; this.evade = null;
      }
      if (this.act === 'retreat') { this.mode = 'retreat'; this.retreat(enemies); return; }
      if (this.mode === 'retreat') this.mode = 'idle';
      // ---- uống bình: máu thấp và không có ai áp sát (đang đánh mà máu rất thấp thì liều uống) ----
      if (this.tryPotions(enemies)) return;
      // ---- giao tranh ----
      const tgt = this.pickTarget(enemies, fight);
      if (tgt) { this.mode = 'fight'; this.target = tgt; this.track = null; this.fightMicro(tgt, enemies, allies); return; }
      if (this.mode === 'fight') {
        // GĐ9: đối thủ đang đánh dở vừa biến mất (vào bụi, tàng hình, khuất tường) → nhớ vị trí và tìm ở đó
        const lt = this.target;
        if (lt && lt.kind === 'hero' && lt.alive && !lt.vis[u.team] && !this.track && this.act !== 'retreat' && u.hpPct > 0.2) this.startTrack(lt);
        this.mode = 'idle';
      }
      this.target = null;
      if (this.track && this.trackStep(enemies)) return;
      // ---- vật bay trinh sát của đối phương (quạ Oca…) ở gần: bắn hạ ----
      const scout = this.enemyScout();
      if (scout) { u.attackTarget = scout; u.goal = null; this.callout('🐦 Bắn hạ quạ', '#ffd0a0'); return; }
      // ---- quái đang đánh mình ----
      const mon = this.monsterOnMe();
      if (mon && this.act !== 'farm' && this.act !== 'boss') {
        // GĐ8: boss đang nhắm mình mà mình không định đánh boss → rời khỏi ổ (ra ngoài dây xích của boss)
        if (mon.big) { const v = M.dir(mon.home || mon, u), p = { x: (mon.home || mon).x + v.x * (C.LEASH + mon.r + 10), y: (mon.home || mon).y + v.y * (C.LEASH + mon.r + 10) }; MAP.pushOut(p, 1); this.goTo(p); return; }
        if (u.hpPct > 0.15) { u.attackTarget = mon; u.goal = null; return; }
        this.goTo(this.safeSpot()); return;
      }
      // ---- làm việc đã chọn ----
      this.doWork(enemies);
      // phải đi xa, không có ai quanh → lướt theo hướng đi (xuyên tường nếu rút ngắn được đường)
      if (u.goal && !u.attackTarget) G.SkillAI.travel(this);
    }
    // gọi hàm AI riêng của tướng an toàn (lỗi trong bộ chiêu không làm treo trận)
    hook2(fn, enemies, fight) { try { return !!fn(this, enemies, fight); } catch (e) { this.m.error('ai.micro', e); return false; } }
    // vật bay trinh sát của đối phương trong tầm đánh (+3 đv), thấy được
    enemyScout() {
      const m = this.m, u = this.u;
      for (const p of m.pets) if (p.alive && p.scoutPet && p.team !== u.team && m.canHit(u, p) && G.M.dist(p, u) < u.st.range + u.r + p.r + 3) return p;
      return null;
    }
    tryItems(react) {
      const m = this.m, u = this.u;
      // GĐ8: Lưỡi Kiếm Sắc Bén (độc quyền Kiếm Sư): mục tiêu tướng trong 12 đv, đang giao tranh
      if (!react && u.golden && u.golden.length && this.mode === 'fight' && this.target && this.target.kind === 'hero' && dist(u, this.target) < 12 && m.useBlade(u, this.target)) return;
      if (!u.items.length || m.time < (this.itemT || 0)) return;
      const c = { enemies: this.enemiesNear || this.visibleEnemyHeroes(13), allies: this.alliesNear || [], target: this.target, fleeing: this.fleeing, fight: this.mode === 'fight' };
      for (const id of u.items) {
        const it = G.ITEMS[id];
        if (!it.active || (react && !it.active.react) || !m.canItem(u, id)) continue;
        const o = m.hook(it.active.ai, m, u, c);
        if (!o) continue;
        if (m.rngAI.next() > 0.4 + 0.6 * this.sk('refl')) { this.itemT = m.time + 0.3; return; }
        if (m.castItem(u, id, o)) { this.itemT = m.time + 0.25; return; }
      }
    }

    // ===================== làm việc đã chọn (tầng chiến lược) =====================
    doWork() {
      const d = this.dir || {};
      switch (d.type) {
        case 'farm': return this.farmMicro(d);
        case 'boss': return this.bossMicro(d);
        case 'drop': return this.dropMicro(d);
        case 'hunt': return this.huntMicro(d);
        case 'hide': return this.stayAt(d.point, d.bush ? d.bush.r * 0.5 : 1.5);
        case 'heal': if (this.m.canDrink(this.u, 'hp') && this.u.hpPct < 0.8 && this.m.time - this.u.lastDmgT > 0.8) { this.m.drink(this.u, 'hp'); return; } return this.stayAt(d.point, 1.5);
        case 'duel': return this.stayAt(d.point, C.DUEL.r - 0.8);
        case 'chest': { const c = d.chest; if (!c || c.opened) { this.decT = 0; return; } if (this.u.cast && this.u.cast.key === 'chest') return; if (dist(this.u, c) <= C.CHEST.r + this.u.r - 0.2) { if (this.m.time - this.u.lastDmgT < 1.5 || (this.enemiesNear || []).some((e) => dist(e, this.u) < 8)) { this.decT = 0; return; } this.m.openChest(this.u, c); return; } this.u.attackTarget = null; return this.goTo(c); }
        case 'loot': { const O = this.m.soulOrbs || []; if (!O.includes(d.orb)) { this.decT = 0; return; } this.u.attackTarget = null; return this.goTo(d.orb); }
        case 'vulture': return this.vultureMicro(d);
        case 'shop': return this.stayAt(d.point, C.SHOP_R - 1);
        case 'zone': return this.goTo(d.point);
        default: if (G.Persona && G.Persona.work(this, d)) return; return this.stayAt(d.point || this.roamPoint(), 3);
      }
    }
    stayAt(p, R) { const u = this.u; if (dist(u, p) > R) this.soft(p, 1.2); else { u.attackTarget = null; u.goal = null; } }
    farmMicro(d) {
      const u = this.u, c = d.camp, mon = c && c.unit && c.unit.alive ? c.unit : null;
      if (!mon) return this.stayAt(d.point, 2.5);               // chờ bãi hồi
      // đứng trong dây xích của quái (đứng xa quá thì quái đuổi ra ngoài, về hồi đầy máu → đánh mãi không chết)
      const home = mon.home || c;
      if (dist(u, home) > C.LEASH - 1.5) { this.goTo(home); return; }
      if (dist(u, mon) > u.st.range + u.r + mon.r + 0.5) { this.goTo(mon); return; }
      this.hitMonster(mon);
    }
    bossMicro(d) {
      const u = this.u, B = d.target;
      if (!B || !B.alive) return this.stayAt(d.point, 3);
      // GĐ8: máu thấp mà boss còn khỏe → lùi ra ngoài dây xích uống bình rồi quay lại (không đánh tới chết)
      if (u.hpPct < 0.3 && B.hpPct > 0.12 && !(u.statuses.length && (u.hasKey('buff_hon') || u.hasKey('buff_phoenix')))) {
        const H0 = B.home || d.point, v = M.dir(H0, u), p = { x: H0.x + v.x * (C.LEASH + B.r + 8), y: H0.y + v.y * (C.LEASH + B.r + 8) }; MAP.pushOut(p, 1);
        if (dist(u, H0) > C.LEASH + B.r + 6 && this.m.canDrink(u, 'hp') && this.m.time - u.lastDmgT > 0.8) { this.m.drink(u, 'hp'); return; }
        this.goTo(p); return;
      }
      const home = B.home || d.point;
      if (dist(u, home) > C.LEASH + 1) { this.goTo(home); return; }
      if (dist(u, B) > u.st.range + u.r + B.r + 0.5) { this.goTo(B); return; }
      this.hitMonster(B);
    }
    dropMicro(d) {
      const u = this.u, dr = d.drop;
      if (!dr || dr.taken) { this.decT = 0; return; }
      if (!dr.landed) return this.stayAt(dr, 2.6);             // chờ ngay chỗ thính rơi
      if (dist(u, dr) > C.DROP.r - 0.4) { this.goTo(dr); return; }
      u.attackTarget = null; u.goal = null;                      // đứng yên để mở thính
    }
    // GĐ9: TRUY VẾT khi mất dấu — nhớ vị trí cuối cùng thấy đối thủ và tìm ở đó; tới nơi không thấy thì lục các bụi gần đó
    startTrack(t) {
      const k = this.mem && this.mem.get(t.id); if (!k) return;
      this.track = { id: t.id, x: k.x, y: k.y, vx: k.vx || 0, vy: k.vy || 0, kt: k.t, until: this.m.time + 6 + 4 * this.sk('map'), searched: [], p: { x: k.x, y: k.y }, reachedLast: false };
      this.callout('👣 Tìm vị trí cuối', '#ffd0a0');
    }
    trackStep(enemies) {
      const m = this.m, u = this.u, tr = this.track, t = m.heroById(tr.id);
      if (!t || !t.alive || m.time > tr.until || t.vis[u.team] || enemies.length || this.act === 'retreat' || this.act === 'zone') { this.track = null; return false; }
      const k = this.mem && this.mem.get(tr.id);
      if (k && k.t > tr.kt) { tr.x = k.x; tr.y = k.y; tr.vx = k.vx || 0; tr.vy = k.vy || 0; tr.kt = k.t; }
      // Bước 1: đi đến đúng vị trí thấy cuối cùng
      if (!tr.reachedLast) {
        if (dist(u, tr.p) > 1.5) { u.attackTarget = null; this.goTo(tr.p); return true; }
        tr.reachedLast = true;
      }
      // Bước 2: tìm trong các bụi rậm gần vị trí đó
      let b = null, bd = 9;
      if (tr.searched.length < 2) for (const bs of MAP.bushes) { if (tr.searched.includes(bs.id)) continue; const d = dist(bs, tr.p); if (d < bd) { bd = d; b = bs; } }
      if (b) { tr.searched.push(b.id); this.callout('🔍 Lục bụi tìm đối thủ', '#ffd0a0'); this.goTo({ x: b.x, y: b.y }); return true; }
      this.track = null; return false;
    }
    huntMicro(d) {
      const u = this.u, e = d.target;
      if (!e || !e.alive) { this.decT = 0; return; }
      if (e.vis[u.team]) { this.goTo(e); return; }               // thấy rồi: áp sát (vào tầm thì tầng giao tranh ra tay)
      const k = this.mem && this.mem.get(e.id), age = k ? Math.min(2, this.m.time - k.t) : 0;
      const p = k ? { x: k.x + (k.vx || 0) * age * 0.8, y: k.y + (k.vy || 0) * age * 0.8 } : d.point;   // GĐ9: ngoại suy theo hướng chạy cuối
      if (dist(u, p) < 3) { this.decT = 0; return; }            // mất dấu ở chỗ thấy lần cuối: quyết lại
      this.goTo(p);
    }
    // kền kền: đứng ngoài rìa giao tranh của hai người khác (ưu tiên bụi gần đó), chờ cả hai kiệt sức rồi mới vào
    vultureMicro(d) {
      const u = this.u, a = d.a, b = d.b;
      if (!a || !b || !a.alive || !b.alive) { this.decT = 0; return; }
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      let p = null, bd = 11;
      for (const bs of MAP.bushes) { const dm = dist(bs, mid); if (dm > 5 && dm < bd) { bd = dm; p = { x: bs.x, y: bs.y }; } }
      if (!p) { const v = M.dir(mid, u); p = { x: mid.x + v.x * 8.5, y: mid.y + v.y * 8.5 }; MAP.pushOut(p, 1); }
      this.stayAt(p, 1.5);
    }
    // thù dai: nhớ ai từng đánh mình (60s), ai hạ mình (nhớ thêm 60s)
    grudge(e) { const t = this.grudges.get(e.id); return t != null && this.m.time - t < 60; }
    // chỗ nghỉ hồi máu: tránh xa đối thủ đã thấy, trong bo, ưu tiên bụi gần đó
    restSpot(X) {
      const u = this.u, s = X ? X.safe : this.m.safeCircle();
      let ax = 0, ay = 0, n = 0;
      for (const p of (X ? X.per : [])) if (p.age < 6 && Math.hypot(p.x - u.x, p.y - u.y) < 25) { ax += u.x - p.x; ay += u.y - p.y; n++; }
      let p = { x: u.x, y: u.y };
      if (n) { const L = Math.hypot(ax, ay) || 1; p = { x: u.x + ax / L * 10, y: u.y + ay / L * 10 }; }
      const d = dist(p, s), lim = Math.max(0, s.r - 4);
      if (d > lim) { const k = lim / d; p = { x: s.x + (p.x - s.x) * k, y: s.y + (p.y - s.y) * k }; }
      for (const b of MAP.bushes) if (dist(b, p) < 8 && dist(b, s) < s.r - 3) { p = { x: b.x, y: b.y }; break; }
      MAP.pushOut(p, 1);
      return p;
    }
    // điểm đi tuần: ngẫu nhiên (theo hạt giống) trong bo, đổi mỗi 12s hoặc khi tới nơi
    roamPoint(X) {
      const m = this.m, u = this.u, s = X ? X.safe : m.safeCircle();
      if (!this.roamPt || m.time > this.roamT || dist(u, this.roamPt) < 3 || dist(this.roamPt, s) > s.r - 2) {
        const a = m.rngAI.range(0, Math.PI * 2), r = Math.sqrt(m.rngAI.next()) * Math.max(2, s.r * 0.6);
        const p = { x: s.x + M.cos(a) * r, y: s.y + M.sin(a) * r }; MAP.pushOut(p, 1);
        this.roamPt = p; this.roamT = m.time + 12;
      }
      return this.roamPt;
    }
    goTo(p) { const u = this.u; u.attackTarget = null; u.goal = { x: p.x, y: p.y }; }
    // chỗ an toàn khi lùi: ngược hướng các đối thủ gần (gần thì nặng hơn), kéo vào trong bo nếu đang sát mép
    safeSpot() {
      const m = this.m, u = this.u, cur = m.zoneSt.cur, s = m.safeCircle();
      let ax = 0, ay = 0, n = 0;
      for (const e of this.enemiesNear || []) { const d = dist(e, u); if (d > 16) continue; const w = 1 / Math.max(2, d); ax += (u.x - e.x) * w; ay += (u.y - e.y) * w; n++; }
      m.grid.query(u.x, u.y, 7, (v) => { if (v.kind === 'monster' && v.alive && v.aggro === u) { ax += (u.x - v.x) * 0.2; ay += (u.y - v.y) * 0.2; n++; } });
      let vx, vy;
      if (n) { const L = Math.hypot(ax, ay) || 1; vx = ax / L; vy = ay / L; } else { const v = M.dir(u, s); vx = v.x; vy = v.y; }
      if (dist(u, cur) > cur.r * 0.7) { const v2 = M.dir(u, cur); vx = vx * 0.5 + v2.x * 0.5; vy = vy * 0.5 + v2.y * 0.5; }
      const L = Math.hypot(vx, vy) || 1;
      const p = { x: u.x + vx / L * 10, y: u.y + vy / L * 10 };
      MAP.pushOut(p, 1);
      return p;
    }
    // ===================== lùi khi bị đuổi =====================
    retreat(enemies) {
      const m = this.m, u = this.u;
      this.fleeing = true;
      this.target = null;
      // bị đuổi → chấm điểm chạy / chiêu thoát thân / cắt đuôi qua bụi / quay lại đánh
      const ev = G.SkillAI.evade(this, enemies);
      if (ev === 'fight') { this.fleeing = false; this.mode = 'fight'; this.target = this.turnTgt; this.fightMicro(this.turnTgt, enemies, this.alliesNear || []); return; }
      let chaser = null, cd = 99; for (const e of enemies) { const d = dist(e, u); if (d < cd) { cd = d; chaser = e; } }
      // vừa chạy vừa xả chiêu vào kẻ đuổi gần nhất (cấu rỉa, khống chế, dồn sát thương, chiêu thoát thân)
      if (chaser && cd < 8 && !u.cast && !u.dash) {
        if (this.useSkills(chaser, null, true)) return;
        // tầm xa: quay lại bắn một phát khi kẻ đuổi trong tầm và đòn đã sẵn
        if (u.ranged && u.atkT <= 0 && cd - u.r - chaser.r <= u.st.range) { u.attackTarget = chaser; u.goal = null; return; }
      }
      if (ev) return;
      // đã cắt đuôi (không ai trong 9 đv): uống bình
      if ((!chaser || cd > 10) && m.canDrink(u, 'hp') && m.time - u.lastDmgT > 0.8) { m.drink(u, 'hp', !!chaser); return; }
      this.soft(this.safeSpot(), 2);
    }
    // uống bình máu / mana đúng lúc (nếu thấp máu tìm cách dùng chiêu lấy vị trí đẹp để hồi máu)
    tryPotions(enemies) {
      const m = this.m, u = this.u;
      if (u.cast || u.dash) return false;
      let cd = 99; for (const e of enemies) cd = Math.min(cd, dist(e, u) - (e.st.range + e.r + u.r));
      const fighting = m.time - (u.combatT || -99) < 4;
      const careful = u.perks && u.perks.has('can_than'), hitRecent = m.time - u.lastDmgT < 4;

      // NẾU THẤP MÁU: tìm cách dùng chiêu lấy vị trí đẹp (bụi rậm / vượt tường / lướt ra xa) để hồi máu
      if (u.hpPct < 0.5 && m.canDrink(u, 'hp')) {
        const inBush = u.bush >= 0;
        // nếu đã núp trong bụi rậm an toàn: uống ngay
        if (inBush && (!hitRecent || careful)) {
          if (m.drink(u, 'hp')) { this.callout('🧪 Núp bụi hồi máu', '#ff8aa0'); return true; }
        }
        // nếu đang bị đánh hoặc địch quá gần: dùng chiêu di chuyển tìm vị trí đẹp (bụi hoặc góc an toàn)
        if ((fighting || hitRecent || cd <= 4) && !u.cast && !u.dash && m.time >= (this.healMobT || 0)) {
          this.healMobT = m.time + 1.2;
          const bush = G.SkillAI.jukeSpot(this, enemies.length ? enemies : [u], this.safeSpot());
          const targetPos = bush ? { x: bush.x, y: bush.y } : this.safeSpot();
          const opts = G.SkillAI.mobility(this, false);
          if (opts.length) {
            const v = M.dir(u, targetPos);
            const land = G.SkillAI.landing(u, v.x, v.y, opts[0].r, opts[0].wall);
            if (G.SkillAI.castMob(this, opts[0], land)) {
              this.callout('💨 Lướt tìm góc hồi máu', '#7fe0ff');
              return true;
            }
          }
          if (bush && dist(u, bush) > 1.2) {
            this.goTo(bush);
            this.callout('🌿 Vào bụi hồi máu', '#a0ffb0');
            return true;
          }
        }
      }

      if (m.canDrink(u, 'hp') && !hitRecent) {
        // chỉ uống ngoài giao tranh, không nhận sát thương 4s và mọi địch ngoài tầm đánh
        if (!fighting && !hitRecent && cd > 4 && u.hpPct < 0.6) { if (m.drink(u, 'hp')) { this.callout('🧪 Uống bình máu', '#ff8aa0'); return true; } }
      }
      if (u.resource === 'mana' && u.st.maxMp > 0 && m.canDrink(u, 'mp') && !hitRecent && u.mp < u.st.maxMp * 0.2 && cd > 4) { if (m.drink(u, 'mp', cd < 7)) return true; }
      // GĐ8: bình Hộ Vệ — Hộ Giáp dưới 40% (và đáng kể), không ai sắp với tới, máu không nguy (máu ưu tiên trước)
      if (u.st.maxGa >= 150 && u.ga < u.st.maxGa * 0.4 && m.canDrink(u, 'ga') && !fighting && !hitRecent && cd > 5 && (u.hpPct >= 0.5 || !m.canDrink(u, 'hp'))) { if (m.drink(u, 'ga')) { this.callout('🛡 Uống bình Hộ Vệ', '#bfe8ff'); return true; } }
      return false;
    }
    // KHÓ CHỊU: bị ai đánh thì bực người đó (theo % máu mất) — đủ ngưỡng thì bỏ mục tiêu đang đánh để quay sang; nguôi dần
    updateAnnoy() {
      const m = this.m, u = this.u, A = this.annoy || (this.annoy = new Map());
      for (const [id, v] of A) { const nv = v * 0.985; if (nv < 1) A.delete(id); else A.set(id, nv); }
      if (u.dmgLog) {
        const seen = this.annoySeen || (this.annoySeen = new Map());
        for (const [id, r] of u.dmgLog) {
          const last = seen.get(id), add = last && r.amt >= last ? r.amt - last : r.amt;
          seen.set(id, r.amt);
          if (add > 0) A.set(id, Math.min(200, (A.get(id) || 0) + add / u.st.maxHp * 100 * (1.3 - 0.6 * this.sk('mental'))));
        }
        for (const id of seen.keys()) if (!u.dmgLog.has(id)) seen.delete(id);
      }
    }
    annoyOf(e) { return (this.annoy && this.annoy.get(e.id)) || 0; }
    // ngưỡng khó chịu để đổi mục tiêu: Tâm Lý cao thì chịu được nhiều hơn (≈ 15–40)
    annoyTol() { return 15 + 25 * this.sk('mental'); }
    // máu mất ước tính khi dọn một con quái (lượng sức trước khi ăn bãi)
    campCost(mon) {
      const u = this.u, my = this.dps(u), md = mon.st.ad * mon.st.as * 100 / (100 + u.st.armor);
      return mon.hp / Math.max(1, my) * md;
    }
    // ===================== đánh giá giao tranh (đánh đơn) =====================
    // kẻ đang nhắm/đánh mình tính đủ sức, kẻ đang bận đánh người khác chỉ tính một phần; quái đang đánh mình cũng tính
    evalFight(enemies) {
      const m = this.m, u = this.u;
      const A = this.power(u);
      let E = 0;
      for (const e of enemies) {
        const d = dist(e, u);
        if (d >= 13) continue;
        const onMe = e.attackTarget === u || (u.dmgBy.has(e.id) && m.time - u.dmgBy.get(e.id) < 3);
        const busy = !onMe && e.attackTarget && e.attackTarget !== u && e.attackTarget.kind === 'hero';
        // 10–13 đv: chỉ tính kẻ đang hướng về phía mình (đang tới săn mình)
        const toward = d < 10 || onMe || ((u.x - e.x) * (e.fx || 0) + (u.y - e.y) * (e.fy || 0)) / Math.max(0.1, d) > 0.7;
        if (!toward) continue;
        E += this.power(e) * (onMe ? 1 : busy ? 0.35 : 0.7) * (d < 10 ? 1 : 0.8);
      }
      m.grid.query(u.x, u.y, 6, (v) => { if (v.kind === 'monster' && v.alive && v.aggro === u) E += v.hp * v.st.ad * v.st.as / 100 * 0.5; });
      return { A, E, ratio: E > 0 ? A / E : 99 };
    }
    // chọn tướng để đánh (hoặc null nếu không nên đánh). Điểm từng phần có tên (gỡ lỗi hiện lý do).
    // GĐ6b: bám mục tiêu đang đánh; chỉ đổi khi kẻ khác làm mình KHÓ CHỊU quá ngưỡng (Tâm Lý) hoặc có mạng ngon để KS.
    pickTarget(enemies, fight) {
      const m = this.m, u = this.u;
      if (!enemies.length) return null;
      const dir = this.dir || {};
      const aggr = this.aggr;
      const engR = (u.hero.ai.engageRange || 4) + 3 + (dir.type === 'hunt' ? 3 : 0);
      const burstOf = (e) => G.SkillAI.burstOf(this, e) * C.PVP_DMG;
      let best = null, bs = -Infinity, cur = null, curS = -Infinity, curParts = null;
      // đang đánh boss sắp chết → chỉ đánh kẻ áp sát / đang đánh mình
      const objT = dir.type === 'boss' && dir.target && dir.target.alive ? dir.target : null;
      const busyObj = objT && objT.hpPct < 0.5 && dist(u, objT) < 9;
      for (const e of enemies) {
        const d = dist(u, e);
        if (d > engR + 4) continue;
        if (this.giveUp && this.giveUp.id === e.id && this.giveUp.until > m.time && e.hpPct > 0.12) continue;   // vừa bỏ đuổi
        if (busyObj && d > 4 && !(m.time - u.lastDmgT < 1 && e.attackTarget === u)) continue;
        const parts = [];
        const add = (name, v) => { if (v) parts.push([name, v]); };
        // KS: mục tiêu càng ít máu càng hấp dẫn (tăng nhanh dưới 40%); hạ được bằng một đợt dồn chiêu thì rất hấp dẫn
        add('máu thấp', Math.pow(1 - e.hpPct, 1.6) * (1.2 + this.sk('fight')));
        if (e.hp < burstOf(e)) add('hạ được ngay', 1.3);
        add('xa', -d * 0.06);
        if (e.hero && (e.hero.ai.role === 'adc' || e.hero.ai.role === 'mage')) add('mỏng manh', 0.2 * this.sk('fight'));
        if (e === this.target) add('đang đánh', 0.6);
        if (e.disabled) add('bị khống chế', 0.3 + 0.2 * this.mastK);
        if (e.attackTarget === u || (u.dmgBy.has(e.id) && m.time - u.dmgBy.get(e.id) < 2)) add('đang đánh mình', 0.5);
        const an = this.annoyOf(e);
        if (an > 0) add('khó chịu', Math.min(1.6, an / 25));
        if (this.grudge(e)) add('thù dai', 0.35);
        // GĐ8: mang mảnh xuyên thủng cao (≥ 70%) → ưu tiên kẻ có Hộ Giáp dày (bỏ qua giáp, gọt thẳng máu)
        if ((u.penLv || 0) >= 0.7 && e.ga > 200) add('giáp dày (xuyên thủng)', Math.min(0.8, e.ga / Math.max(1, e.st.maxHp) * 2));
        if (dir.type === 'hunt' && dir.target === e) add('con mồi', 0.7);
        const busyE = e.attackTarget && e.attackTarget !== u && e.attackTarget.kind === 'hero';
        if (busyE) add('đang bận đánh người khác', u.persId === 'kenken' ? 0.6 : 0.3);
        if (busyE && e.hpPct < 0.35) add('cướp mạng', 0.7);
        if (G.Persona && !G.Persona.tgt(this, e, add)) continue;           // GĐ7: tính cách bỏ / ưu tiên mục tiêu
        // GĐ8: kẻ mang bùa Rồng → AI tinh ý không chủ động đánh (trừ khi nó đánh mình / sắp chết)
        if (e.statuses.length && e.hasKey('buff_long') && this.smart() && !(e.attackTarget === u || (u.dmgBy.has(e.id) && m.time - u.dmgBy.get(e.id) < 2)) && e.hpPct > 0.3) continue;
        const sc = parts.reduce((a, x) => a + x[1], 0);
        if (e === this.target) { cur = e; curS = sc; curParts = parts; }
        if (sc > bs) { bs = sc; best = e; this.tgtParts = parts; }
      }
      if (!best) { this.tgtInfo = null; return null; }
      // bám mục tiêu hiện tại: chỉ đổi khi kẻ kia làm mình khó chịu quá ngưỡng, hoặc là mạng ngon (hạ được ngay / ≤ 15% máu)
      if (cur && best !== cur && cur.alive) {
        const ks = best.hpPct < 0.15 || best.hp < burstOf(best);
        if (!ks && this.annoyOf(best) < this.annoyTol()) { best = cur; bs = curS; this.tgtParts = curParts; }
        else if (best !== cur) this.callout(ks ? '💀 Cướp mạng!' : '😠 Đổi mục tiêu', '#ffb08a');
      }
      this.tgtInfo = { id: best.id, s: Math.round(bs * 100) / 100, why: this.tgtParts.filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]).join(', ') };
      // có nên đánh không
      const r = fight.ratio * aggr;
      const killable = (best.hpPct < 0.3 || best.hp < burstOf(best) * 1.3) && u.hpPct > 0.2;
      const committed = this.mode === 'fight' && this.target === best;
      const d = dist(u, best), early = m.time < 420;
      const onMe = best.attackTarget === u || m.time - (u.dmgBy.get(best.id) || -99) < 2;
      // kền kền: chờ hai bên kiệt sức rồi mới vào (trừ khi bị đánh trước)
      if (dir.type === 'vulture' && !committed && !onMe) {
        const a = dir.a, b = dir.b;
        const ready = !(a && b && a.alive && b.alive) || (a.hpPct + b.hpPct) / 2 < 0.45 || best.hpPct < 0.3;
        if (!ready) return null;
      }
      // GĐ7: tính cách quyết có lao vào không (Hòa Bình không ra tay trước, Vệ Sĩ can thiệp, Lãnh Chúa giữ cứ điểm…)
      const pe = G.Persona ? G.Persona.engage(this, best, { onMe, killable, r, d, engR }) : null;
      if (pe === true) return best;
      if (pe === false && !(committed && onMe)) return null;
      // máu quá thấp (ngưỡng bỏ chạy) thì ưu tiên giữ mạng / rút lui
      if (u.hpPct <= this.retreatHp() && !committed && !onMe) return null;
      // đã vào trận thì đánh tới cùng
      if (committed) return best;
      // Các đối thủ thường thấy là đánh nhau luôn (trừ vài tính cách hoặc trường hợp ngoại lệ)
      if (d <= Math.max(engR + 4, 13)) return best;
      const need = (early ? 1.2 : this.lastLife() ? 1.1 : 1.0) - (dir.type === 'hunt' && dir.target === best ? 0.25 : 0) - this.curveEdge(best) * 0.3
        + (dir.type === 'farm' || dir.type === 'heal' || dir.type === 'shop' ? 0.15 : 0);
      if (r > need && d < engR) return best;
      return best;
    }
    visibleEnemyHeroes(R) {
      const m = this.m, u = this.u, out = [];
      if (m.soloArena) R = Math.max(R, 36);
      for (const h of m.heroes) if (h.alive && h.team !== u.team && h.vis[u.team] && h.targetable && dist(h, u) <= R) out.push(h);
      // ảo ảnh: bị lừa hay không tùy Đọc Bản Đồ (mỗi tuyển thủ đoán 1 lần cho mỗi ảo ảnh)
      if (m.pets.length) for (const p of m.pets) {
        if (!p.decoy || !p.alive || p.team === u.team || !p.vis[u.team] || dist(p, u) > R) continue;
        if (this.fooled(p)) out.push(p);
      }
      return out;
    }
    fooled(p) {
      const f = this.fool || (this.fool = new Map());
      if (!f.has(p.id)) { f.set(p.id, this.m.rngAI.next() < 0.8 - 0.65 * this.sk('map')); if (f.size > 40) f.delete(f.keys().next().value); }
      return f.get(p.id);
    }
    threat(enemies) {
      const m = this.m, u = this.u;
      let t = 0;
      for (const e of enemies) {
        const d = dist(e, u);
        if (d > 9) continue;
        let ready = 0;
        for (const k of ['s1', 's2', 's3']) if (e.ranks[k] > 0 && (e.cd[k] || 0) <= 0.5) ready++;
        const ult = e.ranks.s4 > 0 && (e.cd.s4 || 0) <= 0.5 ? 1 : 0;
        const auto = m.mitigate(e, u, e.st.ad, 'phys') * e.st.as * 3;
        t += auto + ready * (45 + 18 * e.level) + ult * (90 + 35 * e.level);
      }
      // quái / boss đang đánh mình
      m.grid.query(u.x, u.y, 6, (v) => { if (v.kind === 'monster' && v.alive && v.aggro === u) t += v.st.ad * v.st.as * 3; });
      return t;
    }
    // ngưỡng máu để bỏ chạy: tướng lì đòn không chạy; còn lại ~10% (Kỷ Luật cao giữ đúng ngưỡng, hổ báo liều hơn)
    retreatHp() {
      const u = this.u;
      if (u.duel && u.duel.state === 'fight') return 0;
      let base = u.fstyle === 'allin' ? 0 : Math.max(0.06, 0.1 + 0.03 * (this.sk('disc') - 0.5) - 0.02 * Math.max(0, this.aggr - 1));
      // GĐ8: đối thủ mang xuyên thủng cao → Hộ Giáp không còn che chắn → bỏ chạy sớm hơn
      if (base > 0 && (this.enemiesNear || []).some((e) => (e.penLv || 0) >= 0.5 && dist(e, u) < 10)) base += 0.05;
      return G.Persona ? G.Persona.retreatHp(this, base) : base;   // GĐ7: Thoát Xác rút ở 75%, Chuột Lũi / Hòa Bình 45%…
    }
    // mạng cuối: đã dùng lượt hồi sinh hoặc đã quá thời gian hồi sinh
    lastLife() { return this.u.revived || this.m.time >= C.REVIVE_UNTIL; }
    // sát thương/giây ước lượng của một tướng (đánh thường + chiêu đã học)
    dps(h) {
      const st = h.st;
      let d = st.ad * st.as * (1 + 0.75 * (st.crit || 0));
      let n = 0; if (h.ranks) for (const k of ['s1', 's2', 's3']) if (h.ranks[k] > 0) n += h.ranks[k];
      d += (12 + 4 * h.level) * n * (1 + (st.ap || 0) / 160 + Math.max(0, st.ad - 60) / 400) * 0.35;
      if (h.ranks && h.ranks.s4 > 0 && (h.cd.s4 || 0) <= 0) d *= 1.2;
      if (h.resource === 'mana' && st.maxMp > 0 && h.mp < st.maxMp * 0.15) d *= 0.75;
      return d * (1 + (st.dmgAmp || 0));
    }
    // máu hiệu dụng (máu + khiên, tính cả giáp/kháng phép)
    ehp(h, hpPct) {
      let s = 0; for (const st of h.statuses) if (st.type === 'shield') s += st.v;
      const hp = hpPct == null ? h.hp : hpPct * h.st.maxHp;
      return (hp + s + (h.ga || 0) * 0.9) * (1 + ((h.st.armor || 0) + (h.st.mr || 0)) / 200) * (1 - (h.st.dmgRed || 0) * 0.5);   // GĐ8: + Hộ Giáp
    }
    // SỨC MẠNH = máu hiệu dụng × sát thương/giây (hai tướng đấu tay đôi: ai có tích lớn hơn sẽ thắng)
    // GĐ8: AI biết bùa lợi của mình và của người khác — có mạng bảo hiểm (Hồn Thần / Niết Bàn) ×1.7, Long Hỏa ×1.4, Minh Tướng ×1.15
    power(h, hpPct) {
      let k = 1;
      if (h.statuses && h.statuses.length) { if (h.hasKey('buff_hon') || h.hasKey('buff_phoenix')) k *= 1.7; if (h.hasKey('buff_long')) k *= 1.4; if (h.hasKey('buff_minh')) k *= 1.15; }
      return this.ehp(h, hpPct) * this.dps(h) / 100 * k;
    }
    // GĐ8: AI "tinh ý" (đọc trận tốt): câu giờ chờ bùa Rồng của đối thủ hết hạn
    smart() { const id = this.u.heroId; return id === 'alice' || id === 'chrononeo' || id === 'raven' || id === 'lyra' || (this.u.player.stats.map || 10) >= 16; }
    curveEdge(e) { const m = this.m; return G.heroCurve ? (G.heroCurve(this.u, m) - G.heroCurve(e, m)) * 4 : 0; }
    soft(p, tol) {
      const m = this.m, u = this.u;
      u.attackTarget = null;
      if (this.sg && m.time < this.sgT && dist(this.sg, p) < (tol || 1.4)) p = this.sg;
      else { this.sg = { x: p.x, y: p.y }; this.sgT = m.time + 0.9; }
      u.goal = dist(u, p) < 0.45 ? null : p;
    }

    // ===================== né chiêu =====================
    dodge() {
      const m = this.m, u = this.u;
      if (this.dodgeUntil > m.time) { u.goal = this.dodgeGoal; u.attackTarget = null; return true; }
      if (u.cast) return false;
      if (u.ws.hold > m.time && u.hpPct > 0.35) return false;          // GĐ8: đang giữ trận địa thì không bước né đạn lẻ (đi là mất trận địa)
      for (const p of m.projs) {
        if (p.dead || p.team === u.team || p.target || p.auto) continue;
        if (this.seenProj.has(p.id)) continue;
        const rx = u.x - p.x, ry = u.y - p.y;
        const along = rx * p.dx + ry * p.dy;
        if (along < 0) continue;
        const t = along / p.speed;
        if (t > 1.1) continue;
        const lat = Math.abs(rx * p.dy - ry * p.dx);
        if (lat > p.r + u.r + 0.4) continue;
        this.seenProj.add(p.id);
        if (this.seenProj.size > 200) this.seenProj.clear();
        // GĐ5c: né theo Phản Xạ, đạn tới càng sát càng khó né
        const chance = 0.12 + 0.6 * this.sk('refl') - (t < 0.25 ? 0.2 : 0);
        if (m.rngAI.next() >= chance) continue;
        // bước ngang tránh đường đạn
        const side = (rx * p.dy - ry * p.dx) >= 0 ? 1 : -1;
        const g = { x: u.x + p.dy * side * 2, y: u.y - p.dx * side * 2 };
        MAP.pushOut(g, u.r);
        // có chiêu lướt né được (Lướt, Lăn Né…): lướt ngang qua đường đạn
        for (const k of ['sub', 's3', 's2', 's1']) {
          const def = u.hero.skills[k];
          if (def && def.ai && def.ai.dodge && m.canCast(u, k) && m.castSkill(u, k, null, { x: u.x + p.dy * side * 3, y: u.y - p.dx * side * 3 })) return true;
        }
        this.dodgeGoal = g; this.dodgeUntil = m.time + 0.35;
        u.goal = g; u.attackTarget = null;
        return true;
      }
      return false;
    }
    // vùng sắp trúng chiêu của đối phương (thiên thạch, pháo kích, dậm đất…): chạy ra khỏi vòng (tùy Kỹ Năng Cá Nhân)
    // GĐ8: vùng cảnh báo nhiều hình (vòng, vành khăn, dải, quạt): dải/quạt → dạt ngang theo pháp tuyến; vòng quanh boss → chạy ra
    // ngoài bán kính (xa thì dùng chiêu lướt / dây móc / Lưu Vân); vành khăn → gần tâm thì lao vào sát chân boss, xa thì chạy ra ngoài
    avoidDanger() {
      const m = this.m, u = this.u;
      if (!m.dangers.length || u.cast || u.dash || u.disabled) return false;
      const seen = this.seenDanger || (this.seenDanger = new Set());
      for (const z of m.dangers) {
        if (z.until <= m.time || z.team === u.team) continue;
        if (seen.has(z.id) || !G.Danger.inside(z, u.x, u.y, u.r + 0.2)) continue;
        seen.add(z.id); if (seen.size > 80) seen.clear();
        if (m.rngAI.next() > (z.boss ? 0.45 + 0.5 : 0.25 + 0.7) * (z.boss ? Math.max(0.5, this.sk('refl')) : this.sk('refl')) + (z.boss ? 0.2 : 0)) continue;
        const g = G.Danger.escape(z, u); MAP.pushOut(g, u.r);
        const need = dist(u, g), left = z.until - m.time;
        // chạy bộ không kịp → chiêu lướt / dây móc / Lưu Vân
        if (need > Math.max(1.5, u.st.ms * left * 0.9)) {
          if (m.perkReady(u, 'luu_van') && !u.has('nodash') && m.useLuuVan(u, g)) { this.callout('☁ Lướt né', '#ffd24a'); return true; }
          const v0 = M.dir(u, g);
          for (const o of G.SkillAI.mobility(this, true)) { const land = G.SkillAI.landing(u, v0.x, v0.y, o.r, o.wall); if (!o.back && !G.Danger.inside(z, land.x, land.y, u.r) && G.SkillAI.castMob(this, o, land)) { this.callout('💨 Lướt né', '#ffd24a'); return true; } }
          if (u.bag && m.bagCount(u, 'hook') && need > 3 && !u.has('nodash')) { const v = M.dir(u, g), land = G.SkillAI.landing(u, v.x, v.y, Math.min(9, need + 1.5), true); if (!G.Danger.inside(z, land.x, land.y, u.r) && m.useBag(u, 'hook', null, land)) { this.callout('🪝 Đu né', '#ffd24a'); return true; } }
        }
        this.dodgeGoal = g; this.dodgeUntil = m.time + Math.min(2, need / Math.max(1, u.st.ms) + 0.15);
        u.goal = g; u.attackTarget = null;
        this.callout('⚠ Né!', '#ffd24a');
        return true;
      }
      return false;
    }
    tryRecasts() {
      const m = this.m, u = this.u;
      for (const k in u.recast) {
        const rc = u.recast[k]; if (!rc || rc.until <= m.time) continue;
        const def = u.hero.skills[k];
        const w = def.ai && def.ai.recastWhen;
        const t = this.target || this.visibleEnemyHeroes(8)[0] || null;
        if (!w || w(m, u, t) || rc.until - m.time < 0.15) m.castSkill(u, k, t, t ? { x: t.x, y: t.y } : null);
      }
    }

    fightMicro(t, enemies, allies, duel) {
      const m = this.m, u = this.u;
      const d = dist(u, t);
      // đánh hết mình: quay lại đánh khi bị đuổi, đang quyết đấu, tướng lì đòn, hoặc đối thủ sắp chết
      const allIn = !!duel || this.turnT > m.time || u.fstyle === 'allin' || t.hpPct < 0.2 || (G.Persona && G.Persona.allIn(this));
      // 1) phá tụ lực: kẻ địch đang niệm/tích chiêu dài (Đại Hỏa Cầu, Kéo Căng Dây, ngắm tỉa…) → khống chế/cấu rỉa cắt ngang
      if (!u.cast && !u.dash && m.time >= this.readyT) {
        const ch = enemies.find((e) => e.cast && e.cast.key !== 'recall' && e.cast.total >= 0.5 && e.cast.t > 0.2 && dist(e, u) < 7.5);
        if (ch && m.rngAI.next() < 0.2 + 0.6 * this.sk('fight') && this.useSkills(ch, ['cc', 'engage', 'poke'], false)) { this.callout('✂️ Phá tụ lực!', '#ffe9a0'); return; }
      }
      // 2) đọc đòn: kẻ địch trước mặt đang vung đòn nặng / niệm chiêu vào mình → chiêu phòng thủ hoặc bước tránh
      if (!allIn && this.readThreat(enemies)) return;
      // 3) đối phương đang thủ thế (Thế Thủ, Nghịch Trảm, Khiên Chắn, Gồng Mình, Hộp Ảo Thuật): đừng đánh vào, lùi khỏi tầm
      const gd = t.kind === 'hero' && t.ws && t.hero.ai.guard ? t.hero.ai.guard(m, t) : null;
      if (gd && gd.t > 0.1 && !allIn && m.rngAI.next() < 0.35 + 0.6 * this.sk('fight')) {
        const reach = t.st.range + t.r + u.r + (gd.punish ? 1.0 : 0.5);
        this.callout('✋ Né đòn thủ', '#cfd8e0');
        if (d < reach + 0.4 || gd.punish) { u.attackTarget = null; u.goal = this.strafeGoal(t, Math.max(reach + 0.6, u.ranged ? this.prefDist(t) : 0), allies, enemies); return; }
      }
      // 4) chiêu — GĐ7b: đang/đủ điều kiện "múa" thì đi theo chuỗi combo, không thì chiêu lẻ như cũ
      if (this.comboStep(t, enemies)) return;
      this.useSkills(t, this.holdT && m.time < this.holdT ? ['defend', 'support', 'escape', 'custom'] : null, false);   // đang gom chiêu: chỉ dùng chiêu thủ / hỗ trợ
      if (u.cast || u.dash) return;
      // GĐ8: đang giữ trận địa (Percy Trận Địa Nỏ…): đứng yên, chỉ đánh khi mục tiêu trong tầm — đi là mất trận địa
      if (u.ws.hold > m.time && !allIn) { u.goal = null; u.attackTarget = d - u.r - t.r <= u.st.range + 0.05 ? t : null; return; }
      // 5) dụ đòn / bắt bài (tướng cận chiến giỏi đọc đòn)
      if (u.hero.ai.bait && !u.ranged && !allIn) this.updateBait(t, d);
      // 6) đánh xong lùi chờ hồi chiêu (sát thủ): chiêu đang hồi mà mục tiêu còn khỏe
      if (u.hero.ai.hitRun && this.punishT <= m.time && this.retreatT <= m.time && !allIn) {
        const down = ['s1', 's2', 's3'].filter((k) => u.ranks[k] > 0 && (u.cd[k] || 0) > 1.5).length;
        if (down >= 2 && t.hpPct > 0.4 && u.hpPct < 0.75 && d < 4 && m.rngAI.next() < 0.3 + 0.5 * this.sk('fight')) { this.retreatT = m.time + 0.5 + 0.5 * this.sk('fight'); this.callout('↩ Lùi chờ hồi chiêu', '#cfd8e0'); }
      }
      if (this.retreatT > m.time) { u.attackTarget = null; u.goal = this.strafeGoal(t, Math.max(4.5, this.prefDist(t) + 2), allies, enemies); this.fleeing = true; return; }
      // GĐ9: tướng súng hết đạn — đang nạp: có Xả Chiêu Tiếp Đạn thì tung chiêu ngay (nạp nửa băng + phát chí mạng);
      // không thì lùi giữ cự ly / nấp góc trong lúc nạp (Tĩnh Tâm: tránh bị trúng đòn 1s trước khi nạp)
      const GN = G.H && G.H.gun(m, u);
      if (GN && GN.n <= 0 && GN.rl > 0.25 && !allIn) {
        if (u.shOn && u.shOn.has('G_RL_04') && this.useSkills(t, ['poke', 'cc', 'burst', 'engage'], false)) return;
        const near = enemies.some((e) => !e.ranged && dist(e, u) < e.st.range + e.r + u.r + 2.5);
        if (near || (u.shOn && u.shOn.has('P_RL_02'))) { u.attackTarget = null; u.goal = this.strafeGoal(t, Math.max(this.prefDist(t), (t.ranged ? 4 : t.st.range + t.r + u.r + 2.5)), allies, enemies); this.fleeing = near; return; }
      }
      // 7) đánh thường xen kẽ di chuyển: sẵn sàng thì ra đòn, giữa hai đòn thì đi vòng giữ cự ly riêng của tướng
      const ready = u.atkT <= 0.15, inReach = d - u.r - t.r <= u.st.range + 0.05;
      if (u.windup || (ready && inReach && !(this.bait && this.bait.until > m.time))) { u.attackTarget = t; u.goal = null; }
      else if (ready && !u.ranged && !(this.bait && this.bait.until > m.time) && d > u.st.range + u.r + t.r + 2.5) { u.attackTarget = t; u.goal = null; }   // còn xa: lao thẳng tới
      else if (ready && !(this.bait && this.bait.until > m.time)) { u.attackTarget = null; u.goal = this.strafeGoal(t, Math.min(this.prefDist(t), u.st.range + u.r + t.r - 0.35), allies, enemies); }   // áp sát theo góc riêng (không chen chân đồng đội)
      else { u.attackTarget = null; u.goal = this.strafeGoal(t, this.prefDist(t), allies, enemies); }
      // thả diều (tướng tầm xa kiểu "Thả diều"): giữa hai phát bắn giữ đối thủ ở mép tầm, đi lên xuống; bị áp sát thì lướt né
      if ((u.ranged || u.hero.ai.role === 'mage') && !u.hero.ai.noKite && !(u.ws.hold > m.time) && !u.windup) this.kite(t, enemies, ready, d);
      // biết buông (GĐ6b: truy đuổi tới cùng) — chỉ bỏ khi mất dấu, hoặc bị đối thủ trả đòn quá đau trong lúc đuổi
      if (!allIn && t.kind === 'hero') {
        const ch = this.chase;
        if (!ch || ch.id !== t.id) this.chase = { id: t.id, t0: m.time, d0: d, best: d, hp0: u.hp };
        else {
          if (d < ch.best - 0.4) { ch.best = d; ch.tb = m.time; }
          const lostSight = !t.vis[u.team] && m.time - (t.visT ? t.visT[u.team] : m.time) > 1.5 + 2 * this.sk('disc');
          const hurt = (ch.hp0 - u.hp) / u.st.maxHp > 0.45 && u.hpPct < t.hpPct - 0.15;            // bị trả đau quá
          const stuck = d > u.st.range + u.r + t.r + 3 && m.time - (ch.tb || ch.t0) > 7 && t.hpPct > 0.35;  // chạy mãi không đuổi kịp
          if (lostSight && !hurt && !stuck && u.hpPct > 0.35 && !this.track) { this.startTrack(t); this.chase = null; this.target = null; this.mode = 'idle'; }   // GĐ9: mất dấu → truy vết
          else if (lostSight || hurt || stuck) {
            this.giveUp = { id: t.id, until: m.time + 4 }; this.chase = null; this.target = null;
            this.callout(hurt ? '✋ Đau quá, buông' : '✋ Buông', '#cfd8e0'); this.mode = 'idle';
          }
        }
      }
    }
    // thả diều: giữ đối thủ ở mép tầm bắn giữa hai phát, đi lên xuống (vòng ngang), áp sát quá thì lùi; cận chiến sát người thì lướt né
    kite(t, enemies, ready, d) {
      const m = this.m, u = this.u, reach = u.st.range + u.r + t.r;
      const want = reach - 0.45 - 0.3 * (1 - this.sk('meca'));
      const inReach = d <= reach + 0.05;
      if (ready && inReach) return;                                      // sẵn đòn và trong tầm: để đòn đánh ra
      const meleeOn = !t.ranged && d < t.st.range + t.r + u.r + 0.9;
      if (meleeOn && !u.cast && !u.dash && m.time >= (this.kiteDashT || 0) && m.rngAI.next() < 0.25 + 0.6 * this.sk('meca')) {
        const opts = G.SkillAI.mobility(this, false);
        if (opts.length) {
          const esc = G.SkillAI.bestEscape(this, [t], this.safeSpot(), false);
          if (esc && G.SkillAI.castMob(this, esc.o, esc.land)) { this.kiteDashT = m.time + 2; this.callout('💨 Lướt né', '#cfe8ff'); return; }
        }
        this.kiteDashT = m.time + 1;
      }
      if (m.time >= (this.kiteT || 0)) { this.kiteSide = m.rngAI.next() < 0.5 ? -1 : 1; this.kiteT = m.time + 0.8 + 1.2 * m.rngAI.next(); }
      const v = M.dir(t, u);                                               // hướng từ đối thủ ra mình
      const side = this.kiteSide || 1, k = d < want - 0.3 ? 0.35 : 0.8;   // gần quá: lùi là chính; vừa tầm: đi ngang là chính
      const tx = -v.y * side, ty = v.x * side;
      const dx = v.x * (1 - k) + tx * k, dy = v.y * (1 - k) + ty * k, L = Math.hypot(dx, dy) || 1;
      let gx = t.x + v.x * want + dx / L * 1.6, gy = t.y + v.y * want + dy / L * 1.6;
      if (d > reach + 0.2) { gx = t.x + v.x * (want - 0.3); gy = t.y + v.y * (want - 0.3); }   // ra ngoài tầm: áp lại
      const g = { x: gx, y: gy }; MAP.pushOut(g, u.r);
      if (m.zoneSt.dps > 0 && !m.inZone(g, 1)) return;                    // không thả diều ra ngoài bo
      u.attackTarget = null; u.goal = g;
    }
    // cự ly ưa thích quanh mục tiêu (từng tướng): tầm xa đứng sát mép tầm bắn, cận chiến ngay trong tầm với
    prefDist(t) {
      const m = this.m, u = this.u, reach = u.st.range + u.r + t.r;
      let p = u.ranged ? reach - 0.5 : reach - 0.35;
      if (u.hero.ai.tip) p = reach - 0.12;                                   // Gideon: giữ đối thủ ở mũi kiếm
      if (this.bait && this.bait.until > m.time) p = this.bait.dist;
      if (this.punishT > m.time) p = Math.min(p, reach - 0.6);
      p *= 1 + 0.2 * Math.max(0, 0.5 - u.hpPct) - 0.12 * Math.max(0, 0.5 - t.hpPct);
      return Math.max(u.r + t.r + 0.25, p);
    }
    // điểm đứng giữa các đòn: đi vòng quanh mục tiêu (đổi chiều mỗi 1–3s), tầm xa đứng về phía đồng đội,
    // đánh lén vòng ra sau lưng, dãn cách đồng đội để không dính chung chiêu diện rộng, tránh tầm với của cận chiến địch
    strafeGoal(t, pref, allies, enemies) {
      const m = this.m, u = this.u;
      if (m.time >= this.strafeT) { this.strafe = m.rngAI.next() < 0.5 ? -1 : 1; this.strafeT = m.time + 1 + 2 * m.rngAI.next(); }
      const blend = (a, b, w) => { let dlt = b - a; while (dlt > Math.PI) dlt -= Math.PI * 2; while (dlt < -Math.PI) dlt += Math.PI * 2; return a + dlt * w; };
      let a = M.atan2(u.y - t.y, u.x - t.x) + this.strafe * (u.ranged ? 0.45 : 0.32);
      if (u.ranged && allies.length > 1) {
        let cx = 0, cy = 0, n = 0;
        for (const al of allies) if (al !== u && !al.ranged) { cx += al.x; cy += al.y; n++; }
        if (!n) for (const al of allies) if (al !== u) { cx += al.x; cy += al.y; n++; }
        if (n) a = blend(a, M.atan2(cy / n - t.y, cx / n - t.x), 0.35);
      }
      // cận chiến: kẹp mục tiêu từ phía đối diện đồng đội cận chiến đang đánh nó
      if (!u.ranged) {
        const mate = allies.find((al) => al !== u && !al.ranged && al.ai && al.ai.target === t && dist(al, t) < al.st.range + al.r + t.r + 1);
        if (mate) a = blend(a, M.atan2(t.y - mate.y, t.x - mate.x), 0.5);
      }
      const fl = u.hero.ai.flank;
      if (fl === 'behind' && t.kind === 'hero') a = blend(a, M.atan2(-t.fy, -t.fx), 0.65);
      else if (typeof fl === 'function') { const fa = fl(m, u, t); if (fa != null) a = blend(a, fa, 0.75); }
      let gx = t.x + M.cos(a) * pref, gy = t.y + M.sin(a) * pref;
      for (const al of allies) {
        if (al === u) continue;
        const dx = gx - al.x, dy = gy - al.y, dd = Math.sqrt(dx * dx + dy * dy), R = 1.7;
        if (dd < R && dd > 0.01) { gx += dx / dd * (R - dd); gy += dy / dd * (R - dd); }
      }
      if (u.ranged) for (const e of enemies) {
        if (e === t || e.ranged) continue;
        const dx = gx - e.x, dy = gy - e.y, dd = Math.sqrt(dx * dx + dy * dy), R = e.st.range + e.r + u.r + 0.8;
        if (dd < R && dd > 0.01) { gx += dx / dd * (R - dd) * 0.8; gy += dy / dd * (R - dd) * 0.8; }
      }
      // không đứng trong vùng chiêu của đối phương (lửa, khí độc, lưỡi kiếm…)
      for (const z of m.zones) {
        if (z.dead || z.team === u.team || !(z.r > 0) || z.r > 7 || z.kind === 'arena' || z.kind === 'eye' || z.kind === 'oca' || z.kind === 'drone' || z.kind === 'heal') continue;
        const dx = gx - z.x, dy = gy - z.y, dd = Math.sqrt(dx * dx + dy * dy), R = z.r + u.r + 0.3;
        if (dd < R) { const k = dd > 0.05 ? 1 / dd : 0; gx = z.x + (dd > 0.05 ? dx * k : 1) * R; gy = z.y + (dd > 0.05 ? dy * k : 0) * R; }
      }
      const g = { x: gx, y: gy }; MAP.pushOut(g, u.r);
      return g;
    }
    // đọc đòn: tướng địch trước mặt đang vung đòn nặng hoặc niệm chiêu vào mình
    readThreat(enemies) {
      const m = this.m, u = this.u;
      if (u.cast || u.dash || m.time < this.threatT) return false;
      for (const e of enemies) {
        const d = dist(e, u); if (d > 6 || e.kind !== 'hero') continue;
        const facing = ((u.x - e.x) * e.fx + (u.y - e.y) * e.fy) / (d || 1) > 0.5;
        const casting = !!(e.cast && e.cast.key !== 'recall' && facing && d < 5.5 && e.cast.t > 0.08);
        const heavy = !!(e.windup && e.windup.target === u && !e.ranged && d < e.st.range + e.r + u.r + 0.4 && e.st.ad > u.hp * 0.1);
        if (!casting && !heavy) continue;
        this.threatT = m.time + 0.45;
        if (m.rngAI.next() > 0.1 + 0.6 * this.sk('refl')) return false;
        this.reading = true;
        const used = this.useSkills(e, ['defend', 'custom'], false);
        this.reading = false;
        if (used) return true;
        // không có chiêu đỡ: cận chiến vung tới → lùi khỏi tầm; chiêu niệm → bước ngang
        if (!heavy && !(e.cast && e.cast.total >= 0.3)) return false;
        const v = M.dir(e, u), side = (u.id & 1) ? 1 : -1;
        const g = heavy ? { x: u.x + v.x * 1.7, y: u.y + v.y * 1.7 } : { x: u.x - v.y * side * 1.9 + v.x * 0.4, y: u.y + v.x * side * 1.9 + v.y * 0.4 };
        MAP.pushOut(g, u.r);
        this.dodgeGoal = g; this.dodgeUntil = m.time + 0.3; this.goTo(g);
        return true;
      }
      return false;
    }
    // dụ đòn: lởn vởn ngay ngoài tầm đối thủ; nó vung trượt hoặc xả hết chiêu → bắt bài (lao vào dồn sát thương)
    updateBait(t, d) {
      const m = this.m, u = this.u, reach = u.st.range + u.r + t.r;
      if (this.bait) {
        const whiff = (t.windup || (t.cast && t.cast.key !== 'recall')) && d > this.bait.dist - 0.5;
        const spent = ['s1', 's2', 's3'].filter((k) => t.ranks && t.ranks[k] > 0 && (t.cd[k] || 0) > 1).length >= 2;
        if (whiff || spent || d < reach - 0.3) {
          this.bait = null; this.punishT = m.time + 1.4;
          this.callout('🎯 Bắt bài!', '#9fd3ff');
          this.useSkills(t, ['engage', 'burst', 'cc'], false);
          return;
        }
        if (m.time > this.bait.until) { this.bait = null; this.baitCd = m.time + 3 + 3 * m.rngAI.next(); }
        return;
      }
      if (m.time < this.baitCd || this.punishT > m.time || t.ranged || t.kind !== 'hero' || t.disabled || t.hpPct < 0.3) return;
      const tReach = t.st.range + t.r + u.r;
      if (d > reach - 0.4 && d < Math.max(tReach, reach) + 3 && m.rngAI.next() < 0.015 + 0.05 * this.sk('fight')) {
        this.bait = { until: m.time + 1.2 + m.rngAI.next(), dist: Math.max(tReach + 0.7, reach + 0.4) };
        this.callout('🎣 Dụ đòn', '#9fd3ff');
      }
    }
    // dùng chiêu lên mục tiêu t. kinds: chỉ các loại chiêu này (null = mọi loại phù hợp)
    // kế hoạch dùng một chiêu lên t: trả { tgt, pt } nếu nên dùng lúc này, không thì null
    skillPlan(k, t, fleeing, kinds, skilled, ccLeft) {
      const m = this.m, u = this.u;
      const def = u.hero.skills[k]; if (!def || !def.ai) return null;
      const ai = def.ai, d = dist(u, t);
      if (kinds && !kinds.includes(ai.use) && !(fleeing && ai.alsoEscape)) return null;
      if (!m.canCast(u, k)) return null;
      if (skilled && ai.use === 'cc' && ccLeft > 0.6 && !fleeing) return null;      // chờ khống chế trước hết rồi mới nối
      if (ai.heroOnly && t.kind !== 'hero') return null;
      if (ai.cond && !ai.cond(m, u, t)) return null;
      let ok = false, pt = null, tgt = t;
      switch (ai.use) {
        case 'burst': case 'poke': case 'cc':
          ok = d <= (ai.range || 3) + t.r;
          // chiêu khống chế: không phí lên mục tiêu đang bị khống chế dài (trừ khi đang chạy)
          if (ok && ai.use === 'cc' && !fleeing && ccLeft > 0.8) ok = false;
          break;
        case 'engage':
          ok = !fleeing && d <= (ai.range || 4) + t.r && (d > u.st.range * 0.8 || ai.skillshot) && (this.mode === 'fight' || this.fightRatio * this.aggr > 1.0); break;
        case 'escape':
          ok = fleeing && d < 5 || (ai.alsoEngage && !fleeing && d <= (ai.range || 4) + u.st.range && d > u.st.range + 0.5 && t.hpPct < 0.35); break;
        case 'defend':
          ok = d < 6 && (this.reading || ((m.time - u.lastDmgT < 1) && u.hpPct < 0.75)); break;
        case 'support': {
          const hurt = (this.alliesNear || []).some((a) => a.hpPct < 0.6 && dist(a, u) < (ai.range || 6));
          ok = d < 7 && (hurt || (ai.alsoCc && d < 3)); break;
        }
        case 'ult': ok = this.ultOk(k, ai, t, d, fleeing); break;
        // chiêu có logic riêng của tướng (vd Lướt vòng ra điểm yếu, thế đỡ đọc đòn): pick trả về { pt, tgt } hoặc null
        case 'custom': { const r = ai.pick ? ai.pick(m, u, t, fleeing, this) : null; if (r) { ok = true; pt = r.pt || null; if (r.tgt) tgt = r.tgt; } break; }
        default: ok = false;
      }
      if (!ok) return null;
      if (pt) { /* đã chọn điểm */ }
      else if (ai.aim === 'point') pt = ai.speed === 0 ? (ai.delay ? this.lead(t, 0, ai.delay) : { x: t.x, y: t.y }) : this.lead(t, ai.speed || 16, 0.15);
      else if (ai.aim === 'away') pt = this.awayPoint(t, ai.range || 4, fleeing);
      else if (ai.aim === 'self') pt = { x: u.x, y: u.y };
      else pt = { x: t.x, y: t.y };
      return { tgt, pt };
    }
    ccLeftOf(t) { return t.statuses ? t.statuses.reduce((a, s) => (s.type === 'stun' || s.type === 'root' || s.type === 'knockup' || s.type === 'charm' || s.type === 'sleep' ? Math.max(a, s.t) : a), 0) : 0; }
    useSkills(t, kinds, fleeing) {
      const m = this.m, u = this.u;
      if (m.time < this.readyT || u.cast || u.dash) return false;
      // tướng lạ tay: đôi khi lóng ngóng, lỡ nhịp ra chiêu
      const fb = Math.max(0, 0.6 - this.sk('meca')) * 0.5 + Math.max(0, 0.7 - this.mastK) * 0.3;
      if (fb > 0 && m.rngAI.next() < fb) { this.readyT = m.time + 0.3; return false; }
      // GĐ5c — combo theo thành thạo: tướng quen tay mở bằng khống chế rồi mới dồn sát thương; không chồng khống chế lên mục tiêu đang bị khống chế
      const skilled = m.rngAI.next() < 0.2 + 0.7 * this.mastK * (0.5 + 0.5 * this.sk('fight'));
      const ccLeft = this.ccLeftOf(t);
      const keys = skilled && !fleeing && t.kind === 'hero' && !ccLeft ? ['s1', 's2', 's3', 'sub', 's4'].sort((a, b) => ((u.hero.skills[b] && u.hero.skills[b].ai && u.hero.skills[b].ai.use === 'cc') ? 1 : 0) - ((u.hero.skills[a] && u.hero.skills[a].ai && u.hero.skills[a].ai.use === 'cc') ? 1 : 0))
        : ['s4', 's1', 's2', 's3', 'sub'];
      for (const k of keys) {
        const pl = this.skillPlan(k, t, fleeing, kinds, skilled, ccLeft);
        if (pl && m.castSkill(u, k, pl.tgt, pl.pt)) return true;
      }
      return false;
    }
    // ===== GĐ7b: "MÚA" — chuỗi combo như bản Di sản =====
    // Đủ ≥ 2 chiêu tấn công sẵn sàng lên mục tiêu → lên chuỗi theo thứ tự: mở màn (lướt áp sát) → khống chế → dồn sát thương
    // → chiêu cuối (nếu đáng). Giữa hai chiêu chen một đòn đánh thường nếu đòn đã sẵn và trong tầm (đánh xen chiêu).
    // Khoảng nghỉ giữa các bước 0.08–0.3s theo Kỹ Năng; đang combo thì nghĩ mỗi nhịp, không chen việc khác.
    comboOrder(t, d) {
      const u = this.u, S = u.hero.skills, R = { engage: 0, cc: 1, burst: 2, poke: 3, ult: 4 };
      // GĐ8: mảnh Ý Chí (Khai Trận Trảm ×2 đòn mở màn) sẵn sàng → mở giao tranh bằng đòn mạnh nhất (chiêu cuối / dồn sát thương)
      if (u.souls && u.souls.some((s) => s.id === 'Y_CHI' && s.on) && G.shardReady(this.m, u, 'ychi1') && t.kind === 'hero') { R.ult = -1; R.burst = 0.5; }
      const keys = ['s1', 's2', 's3', 'sub', 's4'].filter((k) => S[k] && S[k].ai && R[S[k].ai.use] != null && this.m.canCast(u, k));
      return keys.sort((a, b) => (R[S[a].ai.use] - R[S[b].ai.use]) || (a < b ? -1 : 1)).filter((k) => S[k].ai.use !== 'engage' || d > u.st.range + u.r + t.r);
    }
    comboStep(t, enemies) {
      const m = this.m, u = this.u, S = u.hero.skills;
      if (u.cast || u.dash || t.kind !== 'hero') return false;
      let sq = this.seq;
      if (sq && (sq.t !== t || !t.alive || m.time > sq.until)) { this.seq = sq = null; }
      if (!sq) {
        if (m.time < (this.seqCd || 0) || m.time < this.readyT) return false;
        const d = dist(u, t), list = this.comboOrder(t, d);
        // chỉ lên chuỗi khi chiêu đầu với tới được và có ít nhất 2 bước
        const ccLeft = this.ccLeftOf(t);
        const ready = list.filter((k) => this.skillPlan(k, t, false, null, true, ccLeft) || (S[k].ai.use !== 'ult' && d <= (S[k].ai.range || 3) + t.r + 2.5));
        if (!ready.length || !this.skillPlan(ready[0], t, false, null, true, ccLeft)) return false;
        if (ready.length < 2) {
          // gom chiêu: chiêu nối tiếp sắp hồi (≤ 1.2s) → giữ chiêu đang có một chút để ra thành chuỗi (đối thủ còn khỏe, mình không nguy)
          const soon = ['s1', 's2', 's3', 'sub', 's4'].some((k) => k !== ready[0] && S[k] && S[k].ai && ['cc', 'burst', 'poke'].includes(S[k].ai.use) && (k === 'sub' || u.ranks[k] > 0) && (u.cd[k] || 0) > 0 && (u.cd[k] || 0) < 1.2);
          if (soon && t.hpPct > 0.25 && u.hpPct > 0.35 && !this.holdT) this.holdT = m.time + 1.2;
          if (this.holdT && m.time < this.holdT) { if (!u.windup && !u.attackTarget) u.attackTarget = t; return false; }   // chờ gom chiêu: vẫn đánh thường / di chuyển như thường, chỉ chưa xả chiêu lẻ

          this.holdT = 0;
          return false;
        }
        this.holdT = 0;
        if (m.rngAI.next() > 0.35 + 0.6 * this.mastK * (0.4 + 0.6 * this.sk('meca'))) { this.seqCd = m.time + 1.5; return false; }   // lạ tay: không nối được chuỗi
        this.seq = sq = { t, keys: ready.slice(0, 4), i: 0, until: m.time + 2.6, gapT: 0, weave: false, n: 0 };
      }
      // đánh xen chiêu: đòn thường đã sẵn và trong tầm → để nó ra rồi mới bước tiếp
      const reach = u.st.range + u.r + t.r;
      if (u.windup) return true;
      if (sq.weave && u.atkT <= 0 && dist(u, t) <= reach && m.canHit(u, t)) { sq.weave = false; u.attackTarget = t; u.goal = null; return true; }
      if (m.time < sq.gapT) { if (dist(u, t) > reach) { u.attackTarget = t; } return true; }
      sq.weave = false;
      while (sq.i < sq.keys.length) {
        const k = sq.keys[sq.i];
        const pl = this.skillPlan(k, t, false, null, true, this.ccLeftOf(t));
        if (pl && m.castSkill(u, k, pl.tgt, pl.pt)) {
          sq.i++; sq.n++; sq.until = m.time + 1.6;
          sq.gapT = m.time + 0.08 + 0.22 * (1 - this.sk('meca'));
          sq.weave = !u.ranged || reach > 3;
          this.readyT = m.time;                                           // không bị nhịp "chờ ra chiêu" thường lệ chặn chuỗi
          if (sq.i >= sq.keys.length) { if (sq.n >= 3 && m.fxOn) m.fx({ type: 'combo', id: u.id, name: '×' + sq.n }); this.seq = null; this.seqCd = m.time + 0.6; u.stats.combos = (u.stats.combos || 0) + (sq.n >= 2 ? 1 : 0); }
          return true;
        }
        // chiêu chưa dùng được (hết hồi / không hợp lúc này): ngoài tầm thì áp sát chờ, còn lại bỏ qua bước này
        const def = S[k];
        if (!m.canCast(u, k) || (def.ai.use !== 'engage' && dist(u, t) <= (def.ai.range || 3) + t.r)) { sq.i++; continue; }
        u.attackTarget = t; return true;                                  // tiến vào tầm chiêu kế tiếp
      }
      if (sq.n >= 2) u.stats.combos = (u.stats.combos || 0) + 1;
      if (sq.n >= 3 && m.fxOn) m.fx({ type: 'combo', id: u.id, name: '×' + sq.n });
      this.seq = null; this.seqCd = m.time + 0.6;
      return false;
    }
    ultOk(k, ai, t, d, fleeing) {
      const m = this.m, u = this.u;
      if (t.kind !== 'hero') return false;
      if (d > (ai.range || 5) + t.r) return false;
      if (fleeing) return !!(ai.cond && ai.cond(m, u, t));
      // giao tranh đáng dùng chiêu cuối: mục tiêu ít máu, hoặc đông người, hoặc đang thắng thế
      const many = this.enemiesNear.filter((e) => dist(e, t) < (ai.aoe || 3)).length;
      if (ai.minTargets && many < ai.minTargets && t.hpPct > 0.35) return false;
      const fightK = this.sk('fight');
      if (t.hpPct < 0.55 || many >= 2 || u.hpPct < 0.45) return m.rngAI.next() < 0.4 + 0.6 * fightK;
      // GĐ5c: mục tiêu đang bị đồng đội khống chế → tung chiêu cuối theo (ăn ý + thành thạo cao thì theo chắc hơn)
      const cc = t.statuses && t.statuses.find((s) => (s.type === 'stun' || s.type === 'knockup' || s.type === 'root' || s.type === 'charm' || s.type === 'sleep') && s.t > 0.3 && s.src && s.src.team === u.team);
      if (cc && t.hpPct < 0.85) return m.rngAI.next() < 0.25 + 0.4 * this.mastK + 0.35 * (cc.src === u ? 1 : this.synWith(cc.src));
      return false;
    }

    awayPoint(t, range, fleeing) {
      const u = this.u;
      if (!fleeing) return { x: t.x, y: t.y }; // lướt vào mục tiêu (dùng như chiêu áp sát)
      const sp = this.safeSpot();
      const a = M.dir(t, u), b = M.dir(u, sp);
      const v = { x: a.x * 0.6 + b.x * 0.4, y: a.y * 0.6 + b.y * 0.4 };
      const L = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
      return { x: u.x + v.x / L * range, y: u.y + v.y / L * range };
    }
    autoDmg(v) { return this.m.mitigate(this.u, v, this.u.st.ad, 'phys'); }
    monsterOnMe() {
      const m = this.m, u = this.u;
      let found = null;
      m.grid.query(u.x, u.y, 4, (v) => { if (!found && v.kind === 'monster' && v.alive && v.aggro === u) found = v; });
      return found;
      }
    // đánh một con quái: đánh thường + chiêu (không phí chiêu cuối) — Trừng Trị do trySpells lo
    hitMonster(mon) {
      const m = this.m, u = this.u;
      u.attackTarget = mon; u.goal = null;
      if (m.time < this.readyT || u.cast || u.dash) return;
      if (u.resource === 'mana' && u.mp < u.st.maxMp * 0.25) return;
      for (const k of ['s1', 's2', 's3']) {
        const def = u.hero.skills[k]; if (!def || !def.ai || def.ai.heroOnly) continue;
        if (def.ai.use === 'escape' || def.ai.use === 'support' || def.ai.use === 'defend' || def.ai.noMonster) continue;
        if (!m.canCast(u, k)) continue;
        if (dist(u, mon) > (def.ai.range || 3) + mon.r) continue;
        if (m.castSkill(u, k, mon, { x: mon.x, y: mon.y })) return;
      }
      }

    // dùng chiêu lên quái theo Utility (SkillAI.farm)
    farmSkill() { return G.SkillAI.farm(this, 'jungle'); }
  }
  G.HeroAI = HeroAI;
})();
