'use strict';
// ===== QUÁI, BOSS TÂN THẾ & THÍNH (tiếp tế) =====
// Gắn vào Match.prototype. Quái thuộc phe trung lập (C.NEUTRAL).
//   • 45 bãi quái (5 vùng × 9): hạ được thì người ra đòn cuối nhận vàng + KN (bãi bùa cho thêm bùa 90s)
//   • Boss Tân Thế ở ổ giữa: có từ 2:00; người ra đòn cuối nhận Ấn Tân Thế (tăng mạnh sát thương).
//     Từ bo 4: boss còn sống thì mạnh lên; đã chết thì hồi sinh ngay bản mạnh.
//   • Thính: báo trước 30s (ai cũng biết chỗ rơi), rơi trong vòng bo kế tiếp; đứng một mình cạnh thính đủ 3s
//     không trúng đòn thì mở được (đông người tranh thì không ai mở được).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, MAP = G.MAP, M = G.M, Unit = G.Unit;
  const { dist } = M;
  const BUFF_KEYS = { red: 'buff_red', blue: 'buff_blue', gold: 'buff_gold' };
  const BUFF_NAME = { red: 'Bùa Đỏ', blue: 'Bùa Xanh', gold: 'Bùa Vàng' };

  const Neutral = {
    setupNeutral() {
      this.camps = MAP.camps.map((c) => ({ id: c.id, type: c.type, ring: c.ring, region: c.region, x: c.x, y: c.y, unit: null, nextAt: C.CAMP_FIRST }));
      this.setupBosses();                                 // GĐ8: 4 ổ boss, quái tuần tra, nguy hiểm vùng (bosses.js)
      this.drops = C.DROP.times.map((t, i) => ({ id: i, at: t, warned: false, landed: false, taken: false, x: 0, y: 0, openBy: null, openT: 0, by: null }));
    },
    spawnMonster(sub, def, x, y, extra) {
      const min = this.time / 60;
      const u = new Unit(this, { kind: 'monster', sub, team: C.NEUTRAL, x, y, r: def.r || 1, ranged: false,
        base: { hp: def.hp + (def.hpMin || 0) * min, ad: (def.ad || 0) + (def.adMin || 0) * min, as: def.as || 0.7, ms: def.ms || 3.2, range: def.range || 1.8, armor: def.armor || 0, mr: def.mr || 0 } });
      u.home = { x, y }; u.mons = def; u.aggro = null; u.lastHitT = -99; u.slamT = 0;
      Object.assign(u, extra || {});
      // GĐ8: quái nhỏ theo vùng (Sói Xám, Ếch Độc, Bọ Đá, Gấu Tuyết, Hồn Ma, Chuột Đột Biến…)
      const sk = u.skin;
      if (sk) {
        if (sk.hp) u.base.hp *= sk.hp; if (sk.ad) u.base.ad *= sk.ad; if (sk.armor) u.base.armor += sk.armor; if (sk.mr) u.base.mr += sk.mr; if (sk.ms) u.base.ms = sk.ms;
        u.name = sk.name; u.color = sk.color; u.calc(); u.hp = u.st.maxHp;
        if (sk.hit) u.onAuto = (m, mon, t, info) => info.extra.push(() => G.skinHit(m, mon, t, info));
      }
      this.addUnit(u);
      return u;
    },
    updateNeutral(dt) {
      const t = this.time;
      // bãi quái
      for (const c of this.camps) {
        if (c.unit && !c.unit.alive) { c.unit = null; c.nextAt = t + C.CAMP[c.type].respawn; }
        if (!c.unit && t >= c.nextAt) c.unit = this.spawnMonster(c.type, C.CAMP[c.type], c.x, c.y, { camp: c, skin: c.type === 'small' ? G.MON_SKIN[MAP.REGIONS[c.region].bio] : null });
      }
      // GĐ8: boss ở 4 ổ, quái tuần tra, nguy hiểm vùng
      this.updateBosses(dt);
      // thính
      for (const d of this.drops) this.updateDrop(d, dt);
    },
    empowerBoss(u) {
      const E = C.BOSS.empower;
      u.base.hp *= E.hp; u.base.ad *= E.ad; const pct = u.hpPct; u.calc(); u.hp = u.st.maxHp * pct; u.empowered = true;
      if (this.fxOn) this.fx({ type: 'ring', x: u.x, y: u.y, r: 6, color: '#ff4a6a' });
    },
    // chỗ rơi thính: điểm ngẫu nhiên (theo hạt giống) trong vòng bo kế tiếp, tránh tường
    dropSpot() {
      const z = this.zoneSt, tgt = z ? z.next || z.cur : { x: MAP.center.x, y: MAP.center.y, r: 60 };
      const R = Math.max(4, tgt.r * 0.75);
      for (let i = 0; i < 12; i++) {
        const a = this.rngArena.range(0, Math.PI * 2), rr = R * Math.sqrt(this.rngArena.next());
        const p = { x: tgt.x + M.cos(a) * rr, y: tgt.y + M.sin(a) * rr };
        MAP.pushOut(p, 1.5);
        if (!MAP.inWall(p.x, p.y, 2) && MAP.lairs.every((L) => dist(p, L) > L.r + 4)) return p;
      }
      return { x: tgt.x, y: tgt.y };
    },
    updateDrop(d, dt) {
      const t = this.time, D = C.DROP;
      if (d.taken) return;
      if (!d.warned && t >= d.at - D.warn) {
        d.warned = true; const p = this.dropSpot(); d.x = p.x; d.y = p.y;
        this.addFeed({ type: 'drop_warn', id: d.id, x: d.x, y: d.y, at: d.at });
      }
      if (!d.warned) return;
      if (!d.landed) {
        if (t < d.at) return;
        d.landed = true; this.addFeed({ type: 'drop', id: d.id, x: d.x, y: d.y });
        if (this.fxOn) this.fx({ type: 'boom', x: d.x, y: d.y, big: false });
      }
      // mở thính: đúng một tướng đứng cạnh, không trúng đòn trong 0.6s gần nhất
      let who = null, n = 0;
      for (const h of this.heroes) if (h.alive && dist(h, d) <= D.r + h.r) { n++; who = h; }
      if (n === 1 && this.time - who.lastDmgT > 0.6 && !who.cast) {
        if (d.openBy !== who) { d.openBy = who; d.openT = 0; }
        d.openT += dt;
        if (d.openT >= D.open) this.takeDrop(d, who);
      } else { d.openT = Math.max(0, d.openT - dt * 2); if (!d.openT) d.openBy = null; }
    },
    takeDrop(d, h) {
      const D = C.DROP;
      d.taken = true; d.by = h; d.openBy = null;
      this.gainGold(h, D.gold); this.gainXP(h, D.xp);
      this.heal(h, h, h.st.maxHp * D.heal);
      // GĐ6b: thính là nguồn duy nhất của mảnh hồn Vàng; hai lần thính cuối có 40% ra mảnh hồn Đỏ (GĐ8 thêm ý niệm vàng)
      const luck = h.st.loot || 0, roll = this.rng.next();
      const red = !d.extra && d.id >= D.times.length - 2 ? roll < 0.4 + luck * 0.3 : roll < luck * 0.15;   // GĐ8: may mắn (đồ hiếm) tăng cơ hội ra Đỏ
      this.giveSoul(h, red ? 5 : 4, 'thính');
      this.setYNiem(h, red ? 5 : 4, 'thính');            // GĐ7: thính nâng vũ khí lên ít nhất ý niệm Vàng (cuối trận có thể Đỏ)
      if (h.bag) this.bagAdd(h, 'hp_l', 2);   // GĐ7b: thính cho 2 bình máu to (tối đa 3 bình)
      h.stats.drops = (h.stats.drops || 0) + 1;
      this.addFeed({ type: 'drop_take', id: d.id, hero: h });
      if (this.fxOn) this.fx({ type: 'ring', x: d.x, y: d.y, r: 3, color: '#ffd24a' });
    },
    // quái bị đánh: nhắm vào kẻ đánh (tướng/vật triệu hồi)
    monsterHit(u, owner, amt) {
      if (!owner || owner.team === C.NEUTRAL) return;
      u.lastHitT = this.time;
      if (u.bossDef) { this.bossHit(u, owner, amt || 0); return; }
      if (!u.aggro || !u.aggro.alive || dist(u.aggro, u.home) > C.LEASH + 2) u.aggro = owner;
    },
    monsterThink(u) {
      if (u.bossDef) return this.bossThink(u);
      const t = this.time;
      if (u.thinkT > t) return;
      u.thinkT = t + 0.2;
      if (u.patrol && (!u.aggro || !u.aggro.alive)) this.patrolStep(u);      // GĐ8: quái tuần tra đi vòng quanh ổ boss
      const a = u.aggro;
      const far = dist(u, u.home);
      const lost = !a || !a.alive || !a.targetable || dist(a, u.home) > C.LEASH + (u.big ? 3 : 1)
        || (t - u.lastHitT > C.LEASH_RESET && dist(a, u) > u.st.range + 1.5);
      if (lost) {
        u.aggro = null; u.attackTarget = null;
        if (far > 0.4) u.goal = { x: u.home.x, y: u.home.y }; else u.goal = null;
        u.resetting = far > 0.4;
        if (u.hp < u.st.maxHp) u.hp = Math.min(u.st.maxHp, u.hp + u.st.maxHp * 0.25 * 0.2);
        return;
      }
      u.resetting = false;
      u.attackTarget = a; u.goal = null;
      // boss: đòn dậm diện rộng mỗi 6s
      if (u.big && t >= u.slamT && dist(u, a) < 4) {
        u.slamT = t + 6;
        const R = 4;
        this.later(0.6, (m) => {
          if (!u.alive) return;
          m.hitCircle(u, u.x, u.y, R, (e) => {
            m.damage(u, e, u.st.ad * 1.2, 'phys', { tag: 'slam', aoe: true });
            const v = M.dir(u, e); m.knock(u, e, v.x, v.y, 1.5, 0.2);
          }, { color: '#ffcc66' });
          m.telegraph({ team: u.team, x: u.x, y: u.y, r: R, life: 0.3, color: '#ffcc66' });
        });
        this.telegraph({ team: u.team, x: u.x, y: u.y, r: R, life: 0.6, color: '#ffcc66' });
      }
    },
    // ---------- phần thưởng ----------
    // KN đuổi kịp: thấp cấp hơn trung bình những người còn trong trận thì +20% KN quái mỗi cấp (tối đa ×1.6);
    // vượt trung bình hơn 2 cấp thì giảm 8% mỗi cấp (tối thiểu ×0.75)
    catchUp(h) {
      let s = 0, n = 0; for (const o of this.heroes) if (!o.out) { s += o.level; n++; }
      const gap = n ? s / n - h.level : 0;
      return gap > 0 ? Math.min(1 + C.CATCHUP_XP * gap, 1.6) : gap < -2 ? Math.max(0.75, 1 + 0.08 * (gap + 2)) : 1;
    },
    onMonsterDeath(u, k) {
      const hero = k && k.kind === 'hero' ? k : k && k.owner && k.owner.kind === 'hero' ? k.owner : null;
      if (hero && hero.fxl && hero.fxl.onMonsterKill) this.heroHook(hero, 'onMonsterKill', u);
      const min = this.time / 60;
      if (u.camp) {
        const D = C.CAMP[u.camp.type];
        if (hero) {
          this.gainGold(hero, D.gold + C.CAMP_GOLD_MIN * min);
          this.gainXP(hero, (D.xp + C.CAMP_XP_MIN * min) * this.catchUp(hero));
          hero.stats.camps = (hero.stats.camps || 0) + 1;
          if (u.camp.type !== 'small') this.giveBuff(hero, u.camp.type, C.BUFF_TIME);
          this.campSoul(hero, u.camp.type);
        }
        // GĐ8: Chuột Đột Biến (Trạm Khí Độc) chết thì nổ mây độc
        if (u.skin && u.skin.boom) { const NE = { team: C.NEUTRAL, alive: true }; this.hitCircle(NE, u.x, u.y, 2.5, (e) => { if (e.kind === 'hero') this.damage(null, e, e.st.maxHp * 0.03, 'true', { tag: 'hazard', noHook: true }); }, { color: '#9ad040', fx: 'boom' }); this.toxicCloud(u.x, u.y, null); }
        if (this.fxOn) this.fx({ type: 'death', x: u.x, y: u.y, team: C.NEUTRAL });
        return;
      }
      if (u.bossDef) { this.bossDeath(u, hero); return; }
      // GĐ8: quái tuần tra quanh ổ boss: như bãi vàng + cơ hội mảnh hồn
      if (u.guard) {
        if (hero) { this.gainGold(hero, 120 + 4 * min); this.gainXP(hero, (220 + 6 * min) * this.catchUp(hero)); hero.stats.camps = (hero.stats.camps || 0) + 1; this.campSoul(hero, 'gold'); }
        if (this.fxOn) this.fx({ type: 'death', x: u.x, y: u.y, team: C.NEUTRAL });
        return;
      }
    },
    giveBuff(h, type, dur) {
      const key = BUFF_KEYS[type];
      const mods = type === 'red' ? { dmgAmp: C.BUFF.red.dmgAmp } : type === 'blue'
        ? (h.resource === 'mana' ? { mpr: C.BUFF.blue.mpr, cdr: C.BUFF.blue.cdr } : { cdr: C.BUFF.blue.cdrNoMana }) : { goldPct: C.BUFF.gold.goldPct };
      this.addStatus(h, 'buff', dur, 1, { key, mods });
      if (this.fxOn) this.fx({ type: 'lvl', x: h.x, y: h.y, team: h.team });
    },
    // bùa chuyển sang kẻ hạ gục khi người mang bị hạ
    transferBuffs(victim, killer) {
      for (const type of ['red', 'blue', 'gold']) {
        const s = victim.hasKey(BUFF_KEYS[type]);
        if (!s || s.t <= 0) continue;
        if (killer && killer.alive) this.giveBuff(killer, type, Math.max(20, s.t));
      }
    },
  };
  G.Neutral = Neutral;
  G.BUFF_KEYS = BUFF_KEYS; G.BUFF_NAME = BUFF_NAME;
})();
