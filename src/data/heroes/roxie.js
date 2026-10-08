'use strict';
// ===== Roxie & T-Zero — Cờ Lê • kỹ sư ụ pháo, gọi máy • KHÔNG MANA (Bánh Răng) • phép =====
// GĐ8: làm lại theo bản Di sản — bánh răng liên tục rơi quanh Roxie (đi nhặt, mỗi cái +3% tốc chạy, tối đa 9);
// Khai Hỏa đủ bánh răng thì dựng Ụ Pháo; Khai Tâm kích nổ ụ, nhận lại 2 bánh răng, tăng mạnh tốc chạy + sát thương 4s;
// Gia Công ghép 3 bánh răng thành 1 Mảnh cơ giới; ĐỦ 3 MẢNH thì gọi được Thiết Vệ T-Zero (không chờ hồi chiêu dài).
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const TZ = 'tzero';
  const riding = (m, u) => u.ws.ride > m.time;
  const gearCost = (u) => (H.T(u, '1b') ? 1 : 2);
  const maxTur = (u) => (H.T(u, '9b') ? 2 : 1);
  function addGear(u, v) { u.ws.gears = Math.min(9, u.ws.gears + v); }
  // ---- bánh răng rơi trên đất quanh Roxie (mỗi 4s một cái, tối đa 4 cái nằm chờ, 25s thì mất) ----
  const GEAR = { every: 4, max: 4, life: 25, near: 3, far: 7, pick: 1.6 };
  const myGears = (m, u) => (m.gearDrops || []).filter((g) => g.owner === u);
  function updateGears(m, u) {
    const L = m.gearDrops || (m.gearDrops = []);
    for (let i = L.length - 1; i >= 0; i--) {
      const g = L[i];
      if (g.owner !== u) continue;
      if (m.time >= g.until) { L.splice(i, 1); continue; }
      if (u.alive && u.ws.gears < 9 && M.dist(u, g) <= GEAR.pick + (H.T(u, '1a') ? 1.6 : 0)) { L.splice(i, 1); addGear(u, 1); if (m.fxOn) m.fx({ type: 'ring', x: g.x, y: g.y, r: 0.9, color: '#ffb030' }); }
    }
    if (!u.alive || m.time < (u.ws.gearT || 0)) return;
    u.ws.gearT = m.time + GEAR.every;
    if (myGears(m, u).length >= GEAR.max) return;
    const a = m.rng.range(0, Math.PI * 2), r = m.rng.range(GEAR.near, GEAR.far);
    const p = { x: u.x + M.cos(a) * r, y: u.y + M.sin(a) * r }; G.MAP.pushOut(p, 0.5);
    if (m.zoneSt && !m.inZone(p, 1)) return;
    L.push({ id: m.nextId++, x: p.x, y: p.y, owner: u, until: m.time + GEAR.life });
  }
  function turrets(m, u) { return m.pets.filter((p) => p.alive && p.owner === u && p.turret); }
  function turretThink(m, p) {
    if (m.time >= p.lifeT) { p.alive = false; p.hp = 0; return; }
    if (p.thinkT > m.time) return;
    p.thinkT = m.time + 0.25;
    let best = null, bs = -1e9;
    m.grid.query(p.x, p.y, p.st.range + 0.5, (e) => {
      if (!e.alive || e.team === p.team || e.team === G.C.NEUTRAL || !e.targetable || !m.canHit(p, e)) return;
      const s = (e.kind === 'hero' ? 100 : 0) - M.dist(e, p);
      if (s > bs) { bs = s; best = e; }
    }, true);
    p.attackTarget = best; p.goal = null;
  }
  function placeTurret(m, u, x, y) {
    const list = turrets(m, u);
    while (list.length >= maxTur(u)) { const t = list.shift(); t.alive = false; }
    const p = { x, y }; G.MAP.pushOut(p, 0.6);
    const t = new G.Unit(m, { kind: 'pet', team: u.team, x: p.x, y: p.y, r: 0.6, ranged: true, projSpeed: 18,
      base: { hp: 300 + 40 * u.level, armor: 30, mr: 30, ad: 15 + 4 * u.level + 0.25 * u.st.ap, as: 1.0, ms: 0, range: 6 } });
    t.owner = u; t.turret = true; t.name = 'Ụ Pháo'; t.gfx = 'turret'; t.color = '#ffb030'; t.lifeT = m.time + 20; t.petThink = turretThink;
    m.addUnit(t); m.pets.push(t);
    return t;
  }
  function endRide(m, u) {
    if (!u.ws.ride) return;
    u.ws.ride = 0; u.ranged = true;
    m.removeStatus(u, 'buff', TZ); m.removeStatus(u, 'shield', TZ); m.removeStatus(u, 'unstop', TZ); m.removeStatus(u, 'root', 'tz_fort');
  }
  function selfDestruct(m, u, rank) {
    const big = H.T(u, '9a'), R = big ? 5.25 : 3.5;
    m.hitCircle(u, u.x, u.y, R, (e) => {
      m.damage(u, e, H.amt(u, [150, 250, 350][Math.max(0, rank - 1)], 0, 0.8), 'magic', { tag: 's4', aoe: true });
      if (big) { const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 3, 0.3); }
    }, { color: '#ff7a1a' });
    if (m.fxOn) m.fx({ type: 'boom', x: u.x, y: u.y, big: true });
    endRide(m, u);
  }
  // ---- T-Zero tự hành (Thiết Vệ khi Roxie không lái): tự đánh, Đấm / Phun Lửa / Húc, hết giờ tự hủy ----
  const tzPet = (m, u) => m.pets.find((p) => p.alive && p.owner === u && p.tzero) || null;
  function petBoom(m, u, p) {
    const rank = u.ranks.s4 || 1, R = H.T(u, '9a') ? 5.25 : 3.5;
    m.hitCircle(p, p.x, p.y, R, (e) => {
      m.damage(p, e, H.amt(u, [150, 250, 350][Math.max(0, rank - 1)], 0, 0.8), 'magic', { tag: 's4', aoe: true });
      if (H.T(u, '9a')) { const v = H.dirTo(p, e); m.knock(p, e, v.x, v.y, 3, 0.3); }
    }, { color: '#ff7a1a', fx: 'boom' });
    if (m.fxOn) m.fx({ type: 'boom', x: p.x, y: p.y, big: true });
    p.alive = false; p.hp = 0;
  }
  function tzeroThink(m, p) {
    const u = p.owner;
    if (!u || !u.alive || m.time >= p.lifeT) { if (p.alive && u) petBoom(m, u, p); return; }
    if (p.thinkT > m.time || p.dash) return;
    p.thinkT = m.time + 0.2;
    if (M.dist(p, u) > 11) { p.attackTarget = null; p.goal = { x: u.x, y: u.y }; return; }
    let t = null;
    const at = u.ai && u.ai.target;
    if (at && at.alive && at.team !== u.team && M.dist(at, p) < 8 && m.canHit(p, at)) t = at;
    if (!t) { let bd = 7.5; for (const h of m.heroes) if (h.alive && h.team !== u.team && h.vis[u.team] && m.canHit(p, h)) { const d = M.dist(h, p); if (d < bd) { bd = d; t = h; } } }
    if (!t) { let bd = 5; m.grid.query(p.x, p.y, 5, (e) => { if (e.alive && e.kind === 'monster' && u.attackTarget === e && m.canHit(p, e)) { const d = M.dist(e, p); if (d < bd) { bd = d; t = e; } } }, true); }
    p.attackTarget = t;
    if (!t) { p.goal = M.dist(p, u) > 3 ? { x: u.x - u.fx * 1.5, y: u.y - u.fy * 1.5 } : null; return; }
    if (t.kind !== 'hero') return;
    const d = M.dist(p, t), v = H.dirTo(p, t), r = u.ranks.s4 || 1, k = p.pk || 1;
    if (d < 2.9 && p.ws.punch <= m.time) {                               // Đấm: nón đẩy lùi
      p.ws.punch = m.time + 4;
      m.hitCone(p, p.x, p.y, v.x, v.y, 2.8, 0.5, (e) => { m.damage(p, e, H.amt(u, 60 + 30 * r, 0, 0.4) * k, 'magic', { tag: 's4' }); m.knock(p, e, v.x, v.y, 1.5, 0.2); }, { color: '#ffb030', fx: 'punch' });
    } else if (d < 4.6 && p.ws.fire <= m.time) {                         // Phun Lửa: nón thiêu đốt
      p.ws.fire = m.time + 6;
      m.hitCone(p, p.x, p.y, v.x, v.y, 4.6, 0.55, (e) => { m.damage(p, e, H.amt(u, 40 + 20 * r, 0, 0.3) * k, 'magic', { tag: 's4', aoe: true }); m.dot(p, e, (10 + 3 * u.level) * k, 3, 'magic', 'rox_fire'); }, { color: '#ff7a1a', fx: 'flame' });
    } else if (d > 2.4 && d < 5.5 && p.ws.ram <= m.time) {               // Húc: lao tới hất tung
      p.ws.ram = m.time + 8;
      m.dashTo(p, p.x + v.x * Math.min(5, d + 0.5), p.y + v.y * Math.min(5, d + 0.5), 18, { onContact: (mm, pp, e) => { mm.damage(p, e, H.amt(u, 50 + 25 * r, 0, 0.3) * k, 'magic', { tag: 's4' }); mm.knockup(p, e, 0.5); } });
    }
  }
  function spawnTZero(m, u, T, k) {
    const q = { x: u.x + u.fx * 1.5, y: u.y + u.fy * 1.5 }; G.MAP.pushOut(q, 1);
    const hp = (700 + 110 * u.level) * (H.T(u, '3b') ? 1.3 : 1) * k;
    const p = new G.Unit(m, { kind: 'pet', team: u.team, x: q.x, y: q.y, r: 0.95, ranged: false,
      base: { hp, armor: 30 + 2 * u.level, mr: 30 + 2 * u.level, ad: (30 + 5 * u.level + 0.3 * u.st.ap) * k, as: 0.8, ms: u.st.ms * 0.95, range: 1.8 } });
    p.owner = u; p.tzero = true; p.name = 'T-Zero'; p.gfx = 'fist'; p.color = '#ffb030'; p.lifeT = m.time + T; p.pk = k;
    p.ws = { punch: 0, fire: m.time + 1, ram: 0 }; p.petThink = tzeroThink;
    if (H.T(u, '9c')) m.addStatus(p, 'unstop', T, 1, { key: TZ });
    m.addUnit(p); m.pets.push(p);
    if (m.fxOn) m.fx({ type: 'boom', x: q.x, y: q.y, color: '#ffb030' });
    return p;
  }
  H.def({
    id: 'roxie', name: 'Roxie & T-Zero', color: '#ffb030', gfx: 'wrench', kit: 'mage', pos: ['mid', 'top'], dmgType: 'magic',
    ranged: true, projSpeed: 18, projKind: 'shell', r: 0.56, resource: 'none',
    stats: { range: 5.0, hp: 590, hpG: 94, armor: 28, ad: 58 },
    passive: {
      name: 'Bánh Răng & Sáng Tạo',
      desc: 'Bánh răng liên tục rơi quanh Roxie (mỗi 4s một cái, tối đa 4 cái nằm chờ) — đi qua là nhặt; quái và tướng bị hạ gần Roxie cũng rơi bánh răng. Mỗi bánh răng +3% tốc chạy (tối đa 9). Ụ Pháo tốn 2 bánh răng; Gia Công tốn 3 bánh răng để ghép 1 Mảnh cơ giới; đủ 3 Mảnh thì gọi được Thiết Vệ T-Zero.',
      init(m, u) { u.ws.gears = 2; u.ws.ride = 0; u.ws.parts = 0; u.ws.gearT = m.time + 2; },
      update(m, u) {
        if (m.tick % 2 === 0) updateGears(m, u);
        // Gia Công: rảnh tay thì ghép ngay; đang đánh mà bánh răng dư nhiều (≥ 7) cũng ghép
        if (u.ai && m.tick % 10 === 7 && !riding(m, u) && u.ws.gears >= 3 && u.ws.parts < 3 && !u.cast && m.canCast(u, 'sub')) {
          const busy = m.enemiesIn(u.team, u.x, u.y, 7, { heroesOnly: true }).length;
          const wantTur = busy && turrets(m, u).length < maxTur(u);
          if ((!busy && u.ws.gears >= 3 + (turrets(m, u).length ? 0 : gearCost(u))) || (busy && !wantTur && u.ws.gears >= 5) || u.ws.gears >= 8) m.castSkill(u, 'sub', null, { x: u.x, y: u.y });
        }
        if (m.tick % 10 === 0) m.addStatus(u, 'haste', 0.6, 0.03 * u.ws.gears, { key: 'rox_gear' });
        if (u.ws.ride && (m.time >= u.ws.ride || !u.hasKey(TZ) || !u.statuses.some((s) => s.type === 'shield' && s.key === TZ && s.v > 0))) endRide(m, u);
        if (riding(m, u)) u.ranged = !!H.T(u, '12a');
        // Thiết Vệ Pháo Đài: nã pháo khắp bản đồ
        if (riding(m, u) && H.T(u, '12a') && H.ready(m, u, 'fort', 1.5)) {
          const t = m.heroes.filter((h) => h.alive && h.team !== u.team && h.vis[u.team] && M.dist(h, u) < 15).sort((a, b) => a.hpPct - b.hpPct || a.id - b.id)[0];
          if (t) { const p = { x: t.x, y: t.y }; m.telegraph({ team: u.team, x: p.x, y: p.y, r: 2, life: 0.6, color: '#ff7a1a' }); m.later(0.6, (mm) => mm.hitCircle(u, p.x, p.y, 2, (e) => mm.damage(u, e, 60 + 15 * u.level + 0.4 * u.st.ap, 'magic', { tag: 's4', aoe: true }), { color: '#ff7a1a' })); }
        }
      },
      onMinionDeath(m, u, mn) { if (u.alive && M.dist(u, mn) <= (H.T(u, '1a') ? 11 : 7)) addGear(u, 0.5); },
      onKill(m, u, v) {
        addGear(u, v.kind === 'hero' ? 2 : 1);
        const p = v ? { x: v.x, y: v.y } : { x: u.x, y: u.y };
        (m.gearDrops || (m.gearDrops = [])).push({ id: m.nextId++, x: p.x, y: p.y, owner: u, until: m.time + GEAR.life });
      },
      onMonsterKill(m, u, mon) {
        addGear(u, 1);
        const p = mon ? { x: mon.x, y: mon.y } : { x: u.x, y: u.y };
        (m.gearDrops || (m.gearDrops = [])).push({ id: m.nextId++, x: p.x, y: p.y, owner: u, until: m.time + GEAR.life });
      },
      afterDeal(m, u, t, info) { if (H.T(u, '6c') && t.kind === 'hero' && G.ITEM_IS_SKILL(info) && H.ready(m, u, 'magnet', 4)) addGear(u, 1); },
      onTake(m, u, att, info) {
        if (u.ws.armorT > m.time && info.auto && att && att.kind === 'hero' && !att.ranged && H.ready(m, u, 'refl' + att.id, 1)) { const v = H.dirTo(u, att); m.knock(u, att, v.x, v.y, 1.5, 0.2); }
      },
    },
    skills: {
      s1: {
        name: 'Khai Hỏa / Pháo Kích', desc: 'Đủ 2 bánh răng (và chưa đủ ụ): dựng Ụ Pháo tại điểm trong 5 đv (tự bắn 20s, tối đa 1 ụ). Còn lại: bắn 1 viên pháo 7 đv. Cưỡi T-Zero: Đấm — nón 2.5 đv đẩy lùi.',
        cd: [3, 3, 3, 3, 3], castTime: 0.12,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([50, 75, 100, 125, 150]), 0, 0.5);
          if (riding(m, u)) {
            const v = H.dirTo(u, ctx.pt);
            m.hitCone(u, u.x, u.y, v.x, v.y, 2.6, 0.5, (e) => { m.damage(u, e, dmg * 1.2, 'magic', { tag: 's1' }); m.knock(u, e, v.x, v.y, 1.5, 0.2); }, { color: '#ffb030' });
            return;
          }
          if (u.ws.gears >= gearCost(u) && turrets(m, u).length < maxTur(u)) { u.ws.gears -= gearCost(u); const p = H.toward(u, ctx.pt, 5, true); placeTurret(m, u, p.x, p.y); if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: 'Ụ PHÁO!', color: '#ffb030' }); return; }
          if (H.T(u, '6b')) {   // Bệ Phóng Lò Xo
            const p = H.toward(u, ctx.pt, 5, true); let used = false;
            m.zone({ owner: u, x: p.x, y: p.y, r: 1.4, life: 6, every: 0.1, kind: 'spring', tick: (mm, z) => {
              if (used) return;
              mm.hitCircle(u, z.x, z.y, z.r, (e) => { if (used || e.kind !== 'hero') return; used = true; z.age = z.life; const v = H.dirTo(u, e); mm.knock(u, e, v.x, v.y, 3, 0.35); mm.knockup(u, e, 0.5); }, { noFx: true });
            } });
            return;
          }
          H.shoot(m, u, ctx.pt, { speed: 18, range: 7, r: 0.45, kind: 'shell', onHit: (mm, p, e) => mm.damage(u, e, dmg, 'magic', { tag: 's1' }) });
        },
        ai: { use: 'poke', range: 5.5, aim: 'point', speed: 18, farm: 2 },
      },
      s2: {
        name: 'Khai Tâm', desc: 'Kích nổ Ụ Pháo gần nhất: sát thương bán kính 2.5 đẩy lùi, nhận lại 2 bánh răng, +50% tốc chạy và +30% sát thương 4s. Cưỡi T-Zero: Phun Lửa — nón 4.5 đv thiêu đốt.',
        cd: [6, 5.5, 5, 4.5, 4], castTime: 0.1,
        can(m, u) { return riding(m, u) || turrets(m, u).length > 0; },
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([100, 150, 200, 250, 300]), 0, 0.6);
          if (riding(m, u)) {
            const v = H.dirTo(u, ctx.pt);
            // Vòng Xoáy Lửa: vừa Húc xong → xoay tròn quét lửa
            if (H.T(u, '12b') && m.time - (u.ws.ramT || -9) < 1.5) { m.hitCircle(u, u.x, u.y, 3, (e) => { m.damage(u, e, dmg * 0.8, 'magic', { tag: 's2', aoe: true }); m.knockup(u, e, 1); }, { color: '#ff7a1a' }); return; }
            m.hitCone(u, u.x, u.y, v.x, v.y, 4.5, 0.55, (e) => { m.damage(u, e, dmg * 0.6, 'magic', { tag: 's2', aoe: true }); m.dot(u, e, 10 + 3 * u.level, 3, 'magic', 'rox_fire'); if (H.T(u, '9c')) m.addStatus(e, 'slow', 1.5, 0.4, { src: u }); }, { color: '#ff7a1a' });
            return;
          }
          const ts = turrets(m, u).sort((a, b) => M.dist2(a, u) - M.dist2(b, u) || a.id - b.id);
          const t = ts[0]; if (!t) return;
          if (H.T(u, '6a')) { t.alive = false; m.shield(u, u, 150 + 30 * u.level, 3); u.ws.armorT = m.time + 3; addGear(u, 2); return; }   // Giáp Phản Lực
          t.alive = false; t.hp = 0;
          m.hitCircle(u, t.x, t.y, 2.5, (e) => { m.damage(u, e, dmg, 'magic', { tag: 's2', aoe: true }); const v = H.dirTo(t, e); m.knock(u, e, v.x, v.y, 2, 0.2); }, { color: '#ffb030' });
          if (H.T(u, '3a')) m.zone({ owner: u, x: t.x, y: t.y, r: 2.5, life: 3, every: 0.25, kind: 'oil', tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => mm.addStatus(e, 'slow', 0.4, 0.5, { src: u, key: 'rox_oil' }), { noFx: true }) });
          if (m.fxOn) m.fx({ type: 'boom', x: t.x, y: t.y });
          addGear(u, 2); m.addStatus(u, 'haste', 4, 0.5, { key: 'rox_ks' }); m.addStatus(u, 'buff', 4, 1, { key: 'rox_ks_d', mods: { dmgAmp: 0.3 } });
        },
        ai: { use: 'burst', range: 9, aim: 'unit', cond: (m, u, t) => riding(m, u) ? M.dist(u, t) < 4.5 : turrets(m, u).some((p) => M.dist(p, t) < 2.8 || p.lifeT - m.time < 2) },
      },
      s3: {
        name: 'Bất Ngờ Chưa', desc: 'Lộn ra sau 3 đv, nổ choáng 0.8s tại chỗ cũ. Dùng được cả khi đang bị khống chế. Cưỡi T-Zero: Húc — lao 4 đv hất tung 0.5s.',
        cd: [12, 11, 10, 9, 8], whileDisabled: true,
        use(m, u, ctx) {
          if (riding(m, u)) {
            const v = H.dirTo(u, ctx.pt); u.ws.ramT = m.time;
            m.dashTo(u, u.x + v.x * 4, u.y + v.y * 4, 18, { onContact: (mm, uu, e) => { mm.damage(u, e, H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0, 0.4), 'magic', { tag: 's3' }); mm.knockup(u, e, 0.5); } });
            return;
          }
          const c = { x: u.x, y: u.y };
          m.cleanse(u); u.dash = null;
          const e = H.nearestEnemyHero(m, u, 8), v = e ? H.dirTo(e, u) : { x: -u.fx, y: -u.fy }, L = H.T(u, '1c') ? 3.9 : 3;
          m.dashTo(u, u.x + v.x * L, u.y + v.y * L, 18, {});
          m.later(0.1, (mm) => mm.hitCircle(u, c.x, c.y, 2, (x) => { mm.damage(u, x, H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0, 0.4), 'magic', { tag: 's3', aoe: true }); mm.addStatus(x, 'stun', H.T(u, '3c') ? 1.3 : 0.8, 1, { src: u }); }, { color: '#ffe060' }));
        },
        ai: { use: 'escape', range: 4, aim: 'away', alsoEngage: true },
      },
      sub: {
        name: 'Gia Công / Tự Hủy', desc: 'Gia Công: dùng 3 bánh răng ghép 1 Mảnh cơ giới (tối đa 3) — đủ 3 Mảnh thì gọi được Thiết Vệ T-Zero. Khi đang lái T-Zero hoặc T-Zero đang tự hành: Tự Hủy — T-Zero phát nổ bán kính 3.5 (sát thương theo cấp S4).',
        cd: 3,
        can(m, u) {
          if (riding(m, u)) return !H.T(u, '12a') && !H.T(u, '12c');
          if (tzPet(m, u)) return true;
          return u.ws.gears >= 3 && u.ws.parts < 3;
        },
        use(m, u) {
          if (riding(m, u)) { selfDestruct(m, u, u.ranks.s4 || 1); u.cd.sub = 8; return; }
          const p = tzPet(m, u); if (p) { petBoom(m, u, p); u.cd.sub = 8; return; }
          u.ws.gears -= 3; u.ws.parts++;
          if (m.fxOn) { m.fx({ type: 'aura', id: u.id, color: '#ffb030', life: 0.5 }); m.fx({ type: 'callout', id: u.id, text: `🔧 Mảnh cơ giới ${u.ws.parts}/3`, color: '#ffb030' }); }
        },
        ai: { use: 'custom', pick(m, u, t) {
          if (riding(m, u)) { const s = u.statuses.find((x) => x.key === TZ && x.type === 'shield'); return s && s.v < 150 && t && M.dist(u, t) < 3.2 ? { pt: { x: u.x, y: u.y } } : null; }
          const p = tzPet(m, u); if (p) return p.hpPct < 0.25 && m.enemiesIn(u.team, p.x, p.y, 3, { heroesOnly: true }).length ? { pt: { x: u.x, y: u.y } } : null;
          return null;
        } },
      },
      s4: {
        name: 'Thiết Vệ T-Zero', desc: 'Cần đủ 3 Mảnh cơ giới (Gia Công). Gọi T-Zero 15s (tiêu 3 Mảnh). Bị áp sát hoặc máu thấp: tự lái — T-Zero gánh đòn (lá chắn 700 +110/cấp, +45%), bộ chiêu đổi thành Đấm / Phun Lửa / Húc, skill phụ thành Tự Hủy. Còn lại: T-Zero tự hành chiến đấu (Đấm, Phun Lửa, Húc), Roxie vẫn bắn bên ngoài; hết giờ T-Zero tự hủy.',
        cd: [25, 20, 15], castTime: 0.2,
        can(m, u) { return u.ws.parts >= 3 && !riding(m, u) && !tzPet(m, u); },
        use(m, u, ctx) {
          const T = H.T(u, '12c') ? 18 : H.T(u, '12a') ? 16 : 15;
          const pk = 1.45;
          u.ws.parts = 0;
          if (H.T(u, '12c')) {   // Cyborg Tự Thân
            m.addStatus(u, 'buff', T, 1, { key: 'rox_cyborg', mods: { armor: 40, mr: 40, ad: 20 + 4 * u.level, armorPen: 0.3 } });
            if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffb030', life: T }); return;
          }
          const melee = m.enemiesIn(u.team, u.x, u.y, 3, { heroesOnly: true }).some((e) => !e.ranged);
          if (!H.T(u, '12a') && u.hpPct >= 0.5 && !melee) { spawnTZero(m, u, T, pk); return; }
          u.ws.ride = m.time + T;
          const hp = (700 + 110 * u.level) * (H.T(u, '3b') ? 1.3 : 1) * pk;
          m.addStatus(u, 'shield', T, hp, { key: TZ });
          if (H.T(u, '12a')) { m.addStatus(u, 'root', T, 1, { key: 'tz_fort' }); m.addStatus(u, 'buff', T, 1, { key: TZ, mods: { range: 3 } }); }
          else m.addStatus(u, 'buff', T, 1, { key: TZ, mods: { range: -3.2, ad: 30 + 4 * u.level, armor: 30, mr: 30 } });
          if (H.T(u, '9c')) m.addStatus(u, 'unstop', T, 1, { key: TZ });
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffb030', life: 1 });
        },
        ai: { use: 'ult', aim: 'self', range: 7, cond: (m, u, t) => u.ws.parts >= 3 && (u.hpPct < 0.5 || !!(t && t.kind === 'hero')) },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 5.5, role: 'mage',
      // rảnh tay (không có địch trong 10 đv, không đánh, không chạy bo): đi nhặt bánh răng gần nhất trong 8 đv
      micro(ai, enemies) {
        const m = ai.m, u = ai.u;
        if (u.ws.gears >= 9 || ai.mode === 'fight' || ai.act === 'retreat' || ai.act === 'zone' || u.cast || u.dash) return false;
        if (enemies.some((e) => M.dist(e, u) < 10)) return false;
        let best = null, bd = 8;
        for (const g of myGears(m, u)) { const d = M.dist(u, g); if (d < bd && (!m.zoneSt || m.inZone(g, 1))) { bd = d; best = g; } }
        if (!best) return false;
        ai.goTo(best); return true;
      } },
    tags: ['poke'],
  });
  G.HEROES.roxie.tree = [
    [
      { name: 'Từ Tính', desc: 'Hút bánh răng xa hơn (3.2 đv thay vì 1.6); quái và tướng bị hạ trong 11 đv (thay vì 7) cũng rơi bánh răng.' },
      { name: 'Lắp Ráp Nhanh', desc: 'Ụ Pháo chỉ tốn 1 bánh răng.' },
      { name: 'Phản Pháo', desc: 'Bất Ngờ Chưa lộn xa hơn 30%.' },
    ],
    [
      { name: 'Vết Dầu Loang', desc: 'Khai Tâm để lại vũng dầu làm chậm 50% trong 3s.' },
      { name: 'Gia Cố Khung Gầm', desc: 'T-Zero +30% máu.' },
      { name: 'Xung Điện Cao Áp', desc: 'Bất Ngờ Chưa choáng 1.3s (thay vì 0.8s).' },
    ],
    [
      { name: 'Giáp Phản Lực', desc: 'Khai Tâm thay bằng hút Ụ Pháo vào người: lá chắn 150 (+30/cấp) 3s, kẻ đánh cận chiến bị đẩy lùi.' },
      { name: 'Bệ Phóng Lò Xo', desc: 'Thiếu bánh răng: Khai Hỏa đặt bệ lò xo — tướng địch giẫm vào bị bật văng 3 đv và hất tung 0.5s.' },
      { name: 'Từ Trường Thu Gom', desc: 'Chiêu trúng tướng cũng rơi bánh răng (mỗi 4s).' },
    ],
    [
      { name: 'Lõi Quá Tải', desc: 'Tự Hủy rộng gấp rưỡi và đẩy lùi 3 đv.' },
      { name: 'Tự Động Hóa Tối Tân', desc: 'Duy trì tối đa 2 Ụ Pháo.' },
      { name: 'Cơ Giới Thần Tốc', desc: 'Khi lái T-Zero: không thể cản phá; Phun Lửa làm chậm 40%.' },
    ],
    [
      { name: 'Thiết Vệ Pháo Đài', desc: 'T-Zero thành pháo đài đứng yên 16s: nã đạn nổ vào tướng địch thấp máu nhất trong 15 đv mỗi 1.5s.' },
      { name: 'Vòng Xoáy Lửa', desc: 'Khi lái T-Zero: dùng Phun Lửa ngay sau Húc để xoay tròn quét lửa, hất tung 1s.' },
      { name: 'Cyborg Tự Thân', desc: 'Không gọi robot: lắp bánh răng thành giáp 18s — +40 giáp/kháng phép, +SMVL, xuyên 30% giáp.' },
    ],
  ];
})();
