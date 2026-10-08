'use strict';
// ===== Đơn vị trên bản đồ: tướng, lính, trụ, nhà chính, vật triệu hồi =====
// Chỉ chứa dữ liệu + các phép tính chỉ số. Hành vi chiến đấu nằm trong combat.js / match.js.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C;

  // các trạng thái hiệu ứng
  // cc: true = khống chế (bị Kháng Hiệu Ứng rút ngắn, bị chặn khi Không Thể Cản Phá)
  const STATUS = {
    stun:     { name: 'Choáng', cc: true, hard: true },
    sleep:    { name: 'Ngủ', cc: true, hard: true },
    knockup:  { name: 'Hất tung', cc: true, hard: true, noTenacity: true },
    root:     { name: 'Trói chân', cc: true },
    slow:     { name: 'Làm chậm', cc: true },
    silence:  { name: 'Câm lặng', cc: true },
    charm:    { name: 'Mê hoặc', cc: true, hard: true },
    blind:    { name: 'Mù', cc: true },
    nodash:   { name: 'Cấm lướt', cc: true },
    haste:    { name: 'Tăng tốc' },
    buff:     { name: 'Cường hóa' },
    shield:   { name: 'Khiên' },
    invuln:   { name: 'Miễn sát thương' },
    untarget: { name: 'Không thể bị chọn' },
    unstop:   { name: 'Không thể cản phá' },
    stealth:  { name: 'Tàng hình' },
    dot:      { name: 'Sát thương theo thời gian' },
    wound:    { name: 'Vết Thương Sâu' },          // giảm hồi máu
    mark:     { name: 'Dấu' },                      // dấu riêng của từng tướng (dùng v.key)
    reduce:   { name: 'Giảm sát thương nhận' },
    regen:    { name: 'Hồi máu (bình)' },
    mregen:   { name: 'Hồi mana (bình)' },
    undying:  { name: 'Bất tử (máu không xuống dưới 1)' },
    vuln:     { name: 'Dễ tổn thương' },                // nhận thêm v% sát thương
  };

  let ID = 1;
  class Unit {
    constructor(m, o) {
      this.id = m ? m.nextId++ : ID++;
      this.kind = o.kind;            // hero | minion | tower | nexus | pet
      this.sub = o.sub || null;      // melee/ranged/siege/attacker • tier của trụ
      this.team = o.team;
      this.x = o.x; this.y = o.y; this.r = o.r || 0.6;
      this.fx = this.team === 0 ? 0.707 : -0.707; this.fy = this.team === 0 ? -0.707 : 0.707; // hướng nhìn (vector đơn vị)
      this.alive = true;
      this.base = o.base;            // chỉ số gốc (đã gồm cấp)
      this.bonus = {};               // cộng thêm cố định (trang bị GĐ2…)
      this.st = {};                  // chỉ số hiện hành
      this.statuses = [];
      this.cd = {};
      this.atkT = 0; this.windup = null; this.attackTarget = null;
      this.cast = null;              // đang niệm / vận chiêu
      this.dash = null;              // đang lướt / bị đẩy
      this.goal = null; this.navT = 0; this.navP = null;
      this.ranged = !!o.ranged;
      this.projSpeed = o.projSpeed || 0;
      this.dmgBy = new Map();        // tướng địch đã gây sát thương/khống chế → thời điểm (tính hỗ trợ)
      this.lastDmgT = -99; this.lastAtkHeroT = -99; this.combatT = -99;
      this.lane = null; this.q = 0; this.tier = 0; this.key = null; this.home = null; this.ramp = 0; this.rampTgt = null; this.respawnAt = 0;
      this.hero = null; this.heroId = null; this.ai = null; this.owner = null; this.player = null; this.pos = null; this.slot = 0;
      this.level = 1; this.xp = 0; this.gold = 0; this.ranks = null; this.points = 0; this.respawnT = 0; this.recast = null; this.ws = null;
      this.stats = null; this.resource = 'none'; this.thinkT = 0; this.vx = 0; this.vy = 0; this.vis = null; this.visT = null;
      this.revealedT = 0; this.bush = -1; this.camp = null; this.mons = null; this.aggro = null; this.lastHitT = -99; this.slamT = 0;
      this.big = false; this.boss = false; this.scout = false; this.pit = null; this.resetting = false; this.life = 0; this.dirUp = false; this.ghost = false; this.necro = false; this.navGoalX = 0; this.navGoalY = 0; this.moved = false; this.dirty = false; this.charmBy = null;
      this.petThink = null; this.onAuto = null; this.onDeath = null; this.dropGear = null; this.keep = false; this.name = null; this.gfx = null; this.color = null; this.tilt = 0;
      this.sepT = -1; this.ch = {}; this.chT = {}; this.noCollide = false; this.off = 0; this.leashT = 0;
      this.streak = 0; this.deathStreak = 0; this.anchorT = 0; this.deflectT = 0; this.spells = null; this.scd = null; this.smiteCharges = 0; this.smiteT = 0;
      this.items = null; this.icd = null; this.istate = null; this.fxl = null; this.itemGold = 0; this.buildPlan = null; this.planT = 0; this.shopT = 0; this.cursedT = 0; this.tfx = null; this.tree = null; this.tset = null; this.treeOn = 0; this.decoy = false; this.turret = false; this.box = false; this.lifeT = 0; this.runTo = null; this.onExpire = null;
      this.calc();
      this.hp = this.st.maxHp; this.mp = this.st.maxMp || 0; this.ga = this.st.maxGa || 0;
    }
    // tính lại chỉ số hiện hành từ gốc + cộng thêm + trạng thái
    calc() {
      const b = this.base, k = this.bonus, s = this.st;
      s.maxHp = (b.hp || 1) + (k.hp || 0);
      s.maxMp = (b.mp || 0) + (k.mp || 0);
      s.hpr = (b.hpr || 0) + (k.hpr || 0);
      s.mpr = (b.mpr || 0) + (k.mpr || 0);
      s.ad = (b.ad || 0) + (k.ad || 0);
      s.ap = (b.ap || 0) + (k.ap || 0);
      s.armor = (b.armor || 0) + (k.armor || 0);
      s.mr = (b.mr || 0) + (k.mr || 0);
      s.asBonus = (b.asBonus || 0) + (k.asPct || 0);
      s.crit = (b.crit || 0) + (k.crit || 0);
      // GĐ8: may mắn = % đồ hiếm (rương / quái / boss / thính ra đồ bậc cao hơn); phần chí mạng của may mắn cộng thẳng vào crit
      s.loot = k.loot || 0;
      s.physAmp = k.physAmp || 0; s.magicAmp = k.magicAmp || 0;             // GĐ8: Công Vật Lý % / Công Phép %
      s.bypass = k.bypass || 0; s.antiByp = k.antiByp || 0; s.dotByp = k.dotByp || 0;   // GĐ8: Xuyên Thủng / Chống Xuyên Hộ Giáp
      s.armorPen = (k.armorPen || 0); s.armorPenFlat = (k.armorPenFlat || 0);
      s.magicPen = (k.magicPen || 0); s.magicPenFlat = (k.magicPenFlat || 0);
      s.cdr = Math.min(0.4, (k.cdr || 0));
      s.lifesteal = k.lifesteal || 0;
      s.goldPct = k.goldPct || 0;
      s.tenacity = k.tenacity || 0;
      s.reload = k.reloadPct || 0;                                            // GĐ9: Tốc Nạp đạn (tướng súng)
      s.magPct = k.magPct || 0; s.projSpd = k.projSpd || 0;                    // GĐ9: băng đạn lớn hơn, đạn bay nhanh hơn
      s.visPct = Math.min(1, k.visPct || 0); s.noFog = !!k.noFog;             // GĐ9: tầm nhìn (trần +100%), bỏ qua sương mù
      s.passSoft = !!k.passSoft; s.noFall = !!k.noFall;                         // GĐ9: đạn xuyên tường gỗ, không suy hao theo khoảng cách
      // GĐ9: tầm đánh — tầm xa: +% trên tầm gốc (trần +100%); cận chiến: + tầm với (đv)
      s.range = (b.range || 1) * (this.ranged ? 1 + Math.min(1, k.rangePct || 0) : 1) + (k.range || 0) + (this.ranged ? 0 : Math.min(1.6, k.reach || 0));
      let msFlat = (b.ms || 3) + (k.ms || 0), msPct = k.msPct || 0, slow = 0, dmgAmp = 0, dmgRed = 0, armorPct = 0, mrPct = 0, vuln = 0, hpPct = 0, hpFlat = k.hpFlat || 0;
      for (const st of this.statuses) {
        if (st.type === 'slow') { if (st.v > slow) slow = st.v; }
        else if (st.type === 'haste') msPct += st.v;
        else if (st.type === 'buff' && st.mods) {
          const md = st.mods;
          if (md.ad) s.ad += md.ad; if (md.ap) s.ap += md.ap; if (md.armor) s.armor += md.armor; if (md.mr) s.mr += md.mr;
          if (md.asPct) s.asBonus += md.asPct; if (md.msPct) msPct += md.msPct; if (md.dmgAmp) dmgAmp += md.dmgAmp;
          if (md.range) s.range += md.range; if (md.lifesteal) s.lifesteal += md.lifesteal; if (md.tenacity) s.tenacity += md.tenacity; if (md.crit) s.crit += md.crit; if (md.loot) s.loot += md.loot;
          if (md.adPct) s.ad *= 1 + md.adPct; if (md.armorPct) armorPct += md.armorPct; if (md.armorPen) s.armorPen += md.armorPen; if (md.mrPct) mrPct += md.mrPct;
          if (md.mpr) s.mpr += md.mpr; if (md.hpr) s.hpr += md.hpr; if (md.cdr) s.cdr = Math.min(0.4, s.cdr + md.cdr); if (md.goldPct) s.goldPct += md.goldPct;
          if (md.hpPct) hpPct += md.hpPct; if (md.hpFlat) hpFlat += md.hpFlat; if (md.physAmp) s.physAmp += md.physAmp; if (md.bypass) s.bypass += md.bypass;
          if (md.reloadPct) s.reload += md.reloadPct;
        } else if (st.type === 'reduce') dmgRed = 1 - (1 - dmgRed) * (1 - st.v);
        else if (st.type === 'vuln') vuln += st.v;
      }
      if (hpPct) s.maxHp *= 1 + hpPct;
      if (this.kind === 'hero') s.maxHp *= C.HERO_HP_MULT * (this.fstyle === 'allin' ? C.ALLIN_HP : 1);   // tướng "Lì đòn" (không bỏ chạy) trâu hơn
      s.maxHp += hpFlat;                                                                                    // GĐ8: máu phẳng từ mảnh hồn (sau hệ số tướng)
      // GĐ8: HỘ GIÁP — thanh giáp phụ gánh sát thương trước máu: nền theo cấp + mảnh hồn (+ Giáp Hoàng Kim ×2); không tự hồi
      if (this.kind === 'hero') { const GA = C.GA; s.maxGa = ((GA.base + GA.perLvl * ((this.level || 1) - 1)) + (k.gaMax || 0)) * (1 + (k.gaPct || 0)); }
      else s.maxGa = 0;
      if (k.reduceAll) dmgRed = 1 - (1 - dmgRed) * (1 - k.reduceAll);
      if (k.apPct) s.ap *= 1 + k.apPct;
      if (armorPct) s.armor *= Math.max(0.2, 1 + armorPct);
      if (mrPct) s.mr *= Math.max(0.2, 1 + mrPct);
      s.as = Math.max(C.MIN_AS, Math.min(C.MAX_AS + (k.asCap || 0), (b.as || 0.6) * (1 + s.asBonus)));   // GĐ9: mảnh Thần Tốc phá trần tốc đánh
      // GĐ9: vũ khí tốc đánh cố định (Đại Trường Kiếm của Gideon): mọi % tốc đánh cộng thêm chuyển thành % sát thương đòn đánh
      if (this.hero && this.hero.fixedAs) { s.asConv = Math.max(0, s.asBonus); s.as = Math.max(C.MIN_AS, b.as || 0.6); } else s.asConv = 0;
      s.ms = msFlat * (1 + msPct) * (1 - slow);
      s.dmgAmp = dmgAmp; s.dmgRed = dmgRed; s.vuln = vuln;
      s.tenacity = Math.min(0.6, s.tenacity);
      if (this.hp > s.maxHp) this.hp = s.maxHp;
      if (this.ga > s.maxGa) this.ga = s.maxGa;
      if (this.mp > s.maxMp) this.mp = s.maxMp;
    }
    has(type) { for (const s of this.statuses) if (s.type === type) return s; return null; }
    hasKey(key) { for (const s of this.statuses) if (s.key === key) return s; return null; }
    // không thể hành động (đánh/dùng chiêu)
    get disabled() { for (const s of this.statuses) { const d = STATUS[s.type]; if (d && d.hard) return true; } return !!(this.dash && this.dash.cc); }
    get rooted() { return !!this.has('root') || this.disabled; }
    get silenced() { return !!this.has('silence') || this.disabled; }
    get targetable() { return this.alive && !this.has('untarget'); }
    get hpPct() { return this.hp / this.st.maxHp; }
    // chu kỳ đánh thường
    get atkPeriod() { return 1 / this.st.as; }
    face(x, y) { const dx = x - this.x, dy = y - this.y, L = Math.sqrt(dx * dx + dy * dy); if (L > 1e-6) { this.fx = dx / L; this.fy = dy / L; } }
    faceU(u) { this.face(u.x, u.y); }
  }
  G.Unit = Unit;
  G.STATUS = STATUS;
})();
