'use strict';
// ===== Ignatius — Trượng Lửa • Đường giữa • pháp sư dồn sát thương • mana • phép =====
(function () {
  const G = globalThis.G, H = G.H;
  const BURN = 'ign_burn';
  function burn(m, u, e) {
    if (!e || !e.alive || e.kind === 'tower' || e.kind === 'nexus') return;
    // Pháp Sư Trọng Lực: không thiêu, tích tầng Trọng Lực (nhận thêm sát thương, chậm dần)
    if (H.T(u, '12b')) {
      const s = m.addStatus(e, 'vuln', 5, 0, { key: 'ign_grav', src: u, stack: 'add', max: 6 });
      if (s) s.v = 0.06 * s.n;
      m.addStatus(e, 'slow', 5, 0.05 * (s ? s.n : 1), { src: u, key: 'ign_grav_s' });
      return;
    }
    const dur = H.T(u, '9a') ? 6 : 3, dps = (7 + 2 * u.level) * (H.T(u, '1b') ? 1.25 : 1);
    m.addStatus(e, 'dot', dur, dps, { key: BURN, stack: 'add', max: 3, src: u, tick: 0.5, dtype: 'magic' });
    if (H.T(u, '6c')) m.addStatus(e, 'slow', dur, 0.2, { src: u, key: 'ign_soul' });
  }
  H.def({
    id: 'ignatius', name: 'Ignatius', color: '#ff7a3a', gfx: 'staff', kit: 'mage', pos: ['mid'], dmgType: 'magic',
    ranged: true, projSpeed: 16, projKind: 'fire', r: 0.62, resource: 'mana',
    stats: { range: 5.5 },
    passive: {
      name: 'Hỏa Ấn',
      desc: 'Mọi chiêu gây Thiêu Đốt (cộng dồn 3, mỗi tầng 7 +2/cấp sát thương phép/giây trong 3s). Có thể vừa đi vừa niệm phép.',
    },
    skills: {
      s1: {
        name: 'Cầu Lửa', desc: 'Ném cầu lửa 7.5 đv, nổ lan bán kính 1.8.',
        cd: [5.5, 5, 4.5, 4, 3.5], cost: [50, 55, 60, 65, 70], castTime: 0.2,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([65, 100, 135, 170, 205]), 0, 0.6);
          const boom = (mm, p) => { if (p.boomed) return; p.boomed = true; p.dead = true; mm.hitCircle(u, p.x, p.y, 1.8, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's1', aoe: true }); burn(mm, u, e); }, { color: '#ff8a2a' }); };
          const pr = H.shoot(m, u, ctx.pt, { speed: H.T(u, '1a') ? 22 : 16, range: 7.5, r: 0.5, kind: 'fireball', onHit: boom, onEnd: boom });
          // Kích Nổ Cầu Lửa: dùng lại để nổ ngay giữa đường bay
          if (H.T(u, '6b')) { u.ws.fb = pr; m.allowRecast(u, 's1', 0.6, (mm) => { if (!pr.dead) boom(mm, pr); }); }
        },
        ai: { use: 'poke', range: 7.5, aim: 'point', speed: 16, farm: 3,
          recastWhen: (m, u, t) => { const p = u.ws.fb; return !!(p && !p.dead && t && G.M.dist(p, t) < 1.9); } },
      },
      s2: {
        name: 'Đại Hỏa Cầu', desc: 'Tích tối đa 1.5s (vẫn đi được, chậm 50%): càng tích càng to và đau; +25% sát thương lên mục tiêu dưới 30% máu.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [70, 75, 80, 85, 90], castMove: 0.5,
        castTime: (m, u) => (u.ai ? u.ai.chargeTime(1.5) : 1),
        use(m, u, ctx) {
          const c = Math.min(1, (u.ai ? u.ai.lastCharge : 1) / 1.5);
          const R = 2.2 + 0.8 * c, dmg = H.amt(u, ctx.v([90, 135, 180, 225, 270]), 0, 0.8) * (0.6 + 0.4 * c);
          const t = ctx.tgt && ctx.tgt.alive ? ctx.tgt : null;
          const aim = t && u.ai ? u.ai.lead(t, 14) : ctx.pt;
          const hit = (mm, p) => mm.hitCircle(u, p.x, p.y, R, (e) => { mm.damage(u, e, dmg * (e.hpPct < 0.3 ? 1.25 : 1), 'magic', { tag: 's2', aoe: true }); burn(mm, u, e); }, { color: '#ff5a1a' });
          const boom = (mm, p) => {
            if (p.boomed) return; p.boomed = true; p.dead = true;
            // Hố Đen Tro Tàn: tích tối đa → hút kẻ địch trong 4 đv vào tâm rồi mới nổ
            if (H.T(u, '12a') && c >= 0.9) {
              for (const e of mm.enemiesIn(u.team, p.x, p.y, 4)) { const d = G.M.dist(e, p); if (d > 0.6) { const v = H.dirTo(e, p); mm.knock(u, e, v.x, v.y, d - 0.5, 0.4); } }
              const q = { x: p.x, y: p.y }; mm.later(0.45, (m3) => hit(m3, q));
              mm.telegraph({ team: u.team, x: p.x, y: p.y, r: 4, life: 0.45, color: '#601010' });
              return;
            }
            hit(mm, p);
          };
          H.shoot(m, u, aim, { speed: 14, range: 9, r: 0.6 + 0.4 * c, kind: 'bigfire', onHit: boom, onEnd: boom,
            // Đại Hỏa Cầu Phá Đạn: thiêu hủy đạn địch bay qua
            onTick: H.T(u, '3c') ? (mm, p) => { for (const q of mm.projs) if (!q.dead && q.team !== u.team && Math.abs(q.x - p.x) < p.r + 0.5 && Math.abs(q.y - p.y) < p.r + 0.5) q.dead = true; } : null });
        },
        ai: { use: 'burst', range: 8.5, aim: 'point', speed: 14, farm: 4 },
      },
      s3: {
        name: 'Dịch Chuyển', desc: 'Dịch chuyển tới 5 đv; điểm đến nổ đẩy lùi 1.5 đv, tăng tốc 30% trong 1s.',
        cd: [16, 15, 14, 13, 12], cost: [60, 60, 60, 60, 60],
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, H.T(u, '1c') ? 6.5 : 5, true), from = { x: u.x, y: u.y };
          const dmg = H.amt(u, ctx.v([40, 60, 80, 100, 120]), 0, 0.3);
          m.blink(u, p.x, p.y);
          m.hitCircle(u, u.x, u.y, 2, (e) => { m.damage(u, e, dmg, 'magic', { tag: 's3' }); const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 1.5, 0.2); burn(m, u, e); }, { color: '#ffb05a' });
          m.addStatus(u, 'haste', 1, 0.3);
          if (H.T(u, '3b')) m.later(0.3, (mm) => mm.hitCircle(u, from.x, from.y, 2, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's3', aoe: true }); burn(mm, u, e); }, { color: '#ff9a3a' }));   // Hư Ảnh Cháy Bùng
          if (H.T(u, '9c')) u.cd.s1 = 0;                                                                                                                                                    // Tia Lửa Ma Thuật
        },
        ai: { use: 'escape', range: 5, aim: 'away' },
      },
      sub: {
        name: 'Vòng Lửa', desc: 'Bùng một vòng lửa quanh người (bán kính 2.4): 30 (+8/cấp, +30% SMPT) sát thương phép, thiêu đốt và đẩy kẻ áp sát ra xa 2 đv — tạo chỗ để tích Đại Hỏa Cầu.',
        cd: 12, cost: 40,
        use(m, u, ctx) {
          const close = m.enemiesIn(u.team, u.x, u.y, 3, { heroesOnly: true });
          if (H.T(u, '6a') && close.length) {   // Tường Lửa Chắn Lối: dựng tường lửa giữa Ignatius và kẻ áp sát
            const v = H.dirTo(u, close[0]), n = { x: -v.y, y: v.x }, c = { x: u.x + v.x * 1.6, y: u.y + v.y * 1.6 };
            m.tempWalls.push({ team: u.team, ax: c.x - n.x * 3, ay: c.y - n.y * 3, bx: c.x + n.x * 3, by: c.y + n.y * 3, r: 0.5, until: m.time + 4 });
            m.zone({ owner: u, x: c.x, y: c.y, r: 3, life: 4, every: 0.5, kind: 'fire',
              tick: (mm, z) => mm.hitCircle(u, z.x, z.y, 3, (e) => { if (G.M.segDist(e.x, e.y, z.x - n.x * 3, z.y - n.y * 3, z.x + n.x * 3, z.y + n.y * 3) < 1.4) { mm.damage(u, e, 10 + 3 * u.level, 'magic', { tag: 'sub', aoe: true, noHook: true }); burn(mm, u, e); } }, { noFx: true }) });
          }
          m.hitCircle(u, u.x, u.y, 2.4, (e) => {
            m.damage(u, e, H.amt(u, 30 + 8 * u.level, 0, 0.3), 'magic', { tag: 'sub', aoe: true });
            burn(m, u, e);
            const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 2, 0.25);
            if (H.T(u, '3a')) m.addStatus(e, 'root', 0.75, 1, { src: u });
          }, { color: '#ff7a3a', fx: 'firering' });
        },
        ai: { use: 'cc', range: 1.9, aim: 'self', alsoEscape: true, cond: (m, u, t) => !t.ranged || G.M.dist(u, t) < 1.6 + t.r },
      },
      s4: {
        name: 'Thiên Thạch', desc: 'Gọi thiên thạch vào điểm trong 20 đv, rơi sau 1s: bán kính 3.2, hất tung 0.75s, để lại vùng lửa 4s.',
        cd: [110, 90, 70], cost: [100, 100, 100], castTime: 0.25,
        use(m, u, ctx) {
          const p = { x: ctx.pt.x, y: ctx.pt.y }, big = H.T(u, '9b'), R = big ? 4.5 : 3.2;
          m.telegraph({ team: u.team, x: p.x, y: p.y, r: R, life: 1, color: '#ff4a1a' });
          m.later(1, (mm) => {
            mm.hitCircle(u, p.x, p.y, R, (e) => {
              mm.damage(u, e, H.amt(u, ctx.v([200, 300, 400]), 0, 1), 'magic', { tag: 's4', aoe: true });
              if (big && G.M.dist(e, p) < 1.5 + e.r) mm.addStatus(e, 'stun', 1.5, 1, { src: u }); else mm.knockup(u, e, 0.75);
              burn(mm, u, e);
            }, { color: '#ff3a0a' });
            if (mm.fxOn) mm.fx({ type: 'boom', x: p.x, y: p.y, big: true });
            mm.zone({ owner: u, x: p.x, y: p.y, r: 3, life: 4, every: 0.5, kind: 'fire',
              tick: (m3, z) => m3.hitCircle(u, z.x, z.y, z.r, (e) => m3.damage(u, e, ctx.v([30, 45, 60]) * 0.5, 'magic', { tag: 's4', aoe: true, noHook: true }), { noFx: true }) });
          });
        },
        ai: { use: 'ult', range: 20, aim: 'point', speed: 0, delay: 1.25, aoe: 3.2 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 6.5, role: 'mage' },
    tags: ['poke'],
  });
  G.HEROES.ignatius.tree = [
    [
      { name: 'Hỏa Tốc', desc: 'Cầu Lửa (S1) bay nhanh hơn 40%.' },
      { name: 'Thiêu Rụi', desc: 'Thiêu Đốt mạnh hơn 25%.' },
      { name: 'Bộ Pháp Chớp Nhoáng', desc: 'Dịch Chuyển (S3) xa hơn 30%.' },
    ],
    [
      { name: 'Biển Lửa Giam Cầm', desc: 'Vòng Lửa (skill phụ) trói chân thêm 0.75s.' },
      { name: 'Hư Ảnh Cháy Bùng', desc: 'Vị trí cũ sau khi Dịch Chuyển phát nổ (bán kính 2, sát thương như Dịch Chuyển).' },
      { name: 'Đại Hỏa Cầu Phá Đạn', desc: 'Đại Hỏa Cầu (S2) thiêu hủy mọi đạn đạo của đối phương bay qua nó.' },
    ],
    [
      { name: 'Tường Lửa Chắn Lối', desc: 'Vòng Lửa (skill phụ) dựng thêm tường lửa dài 6 đv chắn giữa Ignatius và kẻ áp sát trong 4s, thiêu kẻ đứng sát tường.' },
      { name: 'Kích Nổ Cầu Lửa', desc: 'Dùng lại Cầu Lửa trong 0.6s để nổ ngay giữa đường bay.' },
      { name: 'Hỏa Hồn Bùng Cháy', desc: 'Kẻ địch đang bị Thiêu Đốt chậm 20%.' },
    ],
    [
      { name: 'Hỏa Ngục Bất Diệt', desc: 'Thiêu Đốt kéo dài 6s (thay vì 3s).' },
      { name: 'Thiên Thạch Tận Thế', desc: 'Thiên Thạch rộng hơn 40%; kẻ địch ở tâm (1.5 đv) bị choáng 1.5s.' },
      { name: 'Tia Lửa Ma Thuật', desc: 'Dịch Chuyển lập tức hồi lại Cầu Lửa.' },
    ],
    [
      { name: 'Hố Đen Tro Tàn', desc: 'Đại Hỏa Cầu tích tối đa: hút mọi kẻ địch trong 4 đv vào tâm rồi mới phát nổ.' },
      { name: 'Pháp Sư Trọng Lực', desc: 'Đổi hệ Lửa sang Trọng Lực: không gây Thiêu Đốt; mỗi chiêu trúng tích 1 tầng (tối đa 6, 5s), mỗi tầng +6% sát thương nhận vào và chậm 5%.' },
      { name: 'Phượng Hoàng Tái Sinh', desc: 'Đòn chí tử: hóa trứng lửa 2s (bất động, miễn sát thương) rồi sống lại với 40% máu. 1 lần mỗi trận.',
        onFatal(m, u) {
          if (u.ws.phoenix) return false;
          u.ws.phoenix = true; u.hp = 1;
          m.addStatus(u, 'invuln', 2, 1); m.addStatus(u, 'stun', 2, 1, { key: 'egg' });
          m.later(2, (mm) => { if (u.alive) mm.heal(u, u, u.st.maxHp * 0.4); });
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ff7a1a', life: 2 });
          return true;
        } },
    ],
  ];
})();
