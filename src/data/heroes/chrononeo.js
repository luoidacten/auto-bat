'use strict';
// ===== Chrono & Neo — Song Súng • Xạ thủ / Đường giữa • đổi thế • mana • vật lý =====
// Chrono (Quá Khứ): 4 viên nặng, chậm, đau, xuyên giáp • Neo (Tương Lai): 10 viên nhẹ, nhanh, +8% tốc chạy.
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const ST = 'cn_stance';
  const isC = (u) => u.ws.stance === 'chrono';
  const magOf = (u, s) => H.mag(u, (s === 'chrono' ? 4 : 10) + (H.T(u, '1a') ? 1 : 0));
  const rlOf = (u, s) => H.rlTime(u, (s === 'chrono' ? 2.5 : 1.5) * (H.T(u, '1b') ? 0.75 : 1));   // GĐ9: theo tốc đánh + Tốc Nạp
  function applyStance(m, u) {
    const c = isC(u);
    m.addStatus(u, 'buff', 1e6, 1, { key: ST, persist: true, mods: c ? { asPct: -0.25, armorPen: 0.2 } : { asPct: 0.25, msPct: 0.08 } });
  }
  function swap(m, u, free) {
    const to = isC(u) ? 'neo' : 'chrono';
    u.ws.stance = to; u.ws.swapT = m.time; applyStance(m, u);
    if (H.T(u, '6c')) { u.ws.ammo.chrono = magOf(u, 'chrono'); u.ws.ammo.neo = magOf(u, 'neo'); u.ws.rl = 0; }
    if (H.T(u, '9a')) u.ws.ammo[to] = Math.min(magOf(u, to), u.ws.ammo[to] + 1);
    if (to === 'chrono') {
      m.hitCircle(u, u.x, u.y, 2.5, (e) => { const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 1.5, 0.2); }, { color: '#d0a050' });
      m.addStatus(u, 'reduce', 1, 0.25, { key: 'cn_wave' });
    } else m.addStatus(u, 'haste', 1.5, 0.4, { key: 'cn_neo' });
    if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: to === 'chrono' ? '#d0a050' : '#6af0ff', life: 0.5 });
  }
  H.def({
    id: 'chrononeo', name: 'Chrono & Neo', color: '#6ac0ff', gfx: 'dual', kit: 'marksman', pos: ['adc', 'mid'], dmgType: 'phys',
    ranged: true, projSpeed: 26, projKind: 'bullet', r: 0.6, resource: 'mana',
    gunSet(m, u, n) { u.ws.ammo[u.ws.stance] = n; if (n > 0 && u.ws.rl > 0) { u.ws.rl = 0; H.reloadDone(m, u); u.atkT = Math.min(u.atkT, 0.15); } },
    gun: (m, u) => ({ n: u.ws.ammo[u.ws.stance], max: magOf(u, u.ws.stance), rl: u.ws.rl, rlMax: u.ws.rlMax || 1.5, alt: { n: u.ws.ammo[isC(u) ? 'neo' : 'chrono'], max: magOf(u, isC(u) ? 'neo' : 'chrono') } }),
    stats: { range: 6.0, ad: 60, adG: 3.7, as: 0.68, asG: 0.03 },
    passive: {
      name: 'Hai Thời Đại',
      desc: 'Hai thế, mỗi thế một băng đạn: Chrono 4 viên nặng (×1.5 sát thương, −25% tốc đánh, xuyên 20% giáp, nạp 2.5s) • Neo 10 viên nhẹ (×0.75 sát thương, +25% tốc đánh, +8% tốc chạy, nạp 1.5s).',
      init(m, u) { u.ws.stance = 'neo'; u.ws.ammo = { chrono: magOf(u, 'chrono'), neo: magOf(u, 'neo') }; u.ws.rl = 0; u.ws.hist = []; applyStance(m, u); },
      update(m, u, dt) {
        const s = u.ws.stance;
        if (u.ws.rl > 0) { u.ws.rl -= dt; if (u.ws.rl <= 0) { u.ws.ammo[s] = magOf(u, s); H.reloadDone(m, u); } }
        if (u.ws.ammo[s] <= 0) { if (u.ws.rl <= 0) { u.ws.rl = u.ws.rlMax = rlOf(u, s); H.reloadStart(m, u); } u.atkT = Math.max(u.atkT, u.ws.rl); }
        if (m.tick % 10 === 0) { u.ws.hist.push({ x: u.x, y: u.y, hp: u.hp, t: m.time }); if (u.ws.hist.length > 8) u.ws.hist.shift(); }
        // Thời Khắc của Chrono: Liên Xạ
        if (u.ws.barrage > m.time) u.atkT = Math.min(u.atkT, u.atkPeriod * 0.5);
      },
      onAuto(m, u, t, info) {
        const s = u.ws.stance;
        u.ws.ammo[s] = Math.max(0, u.ws.ammo[s] - 1);
        // Nghịch Lý Thời Gian: bắn cả đạn quá khứ lẫn tương lai
        if (H.T(u, '12b')) info.amt *= 1.4;
        else info.amt *= s === 'chrono' ? 1.5 : 0.75;
        if (u.ws.barrage > m.time && H.T(u, '3a')) info.extra.push(() => m.dot(u, t, 8 + 2 * u.level, 2, 'magic', 'cn_burn'));
      },
      onFatal(m, u) {
        if (!H.T(u, '12c') || u.ws.loop) return false;
        u.ws.loop = true;
        const h = u.ws.hist[0] || { x: u.x, y: u.y };
        m.blink(u, h.x, h.y); u.hp = u.st.maxHp * 0.3; m.addStatus(u, 'invuln', 0.5, 1);
        if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#6ac0ff', life: 1 });
        return true;
      },
    },
    skills: {
      s1: {
        name: 'Phát Bắn Cường Hóa', desc: 'Chrono: 1 viên nặng xuyên thấu 8 đv, đẩy lùi 1.5 đv • Neo: 2 viên nhanh, làm chậm 30% 1s.',
        cd: [6, 5.5, 5, 4.5, 4], cost: [40, 40, 40, 40, 40], castTime: 0.12,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0.8);
          if (isC(u)) {
            const v = H.dirTo(u, ctx.pt);
            H.shoot(m, u, ctx.pt, { speed: 30, range: 8, r: 0.5, pierce: true, kind: 'bullet', onHit: (mm, p, e) => { mm.damage(u, e, dmg * 1.3, 'phys', { tag: 's1' }); mm.knock(u, e, v.x, v.y, 1.5, 0.2); } });
            return;
          }
          const t = ctx.tgt; if (!t) return;
          for (let i = 0; i < 2; i++) m.later(0.1 * i, (mm) => t.alive && u.alive && H.homing(mm, u, t, { speed: 34, kind: 'bullet', onHit: (m3, p, e) => { m3.damage(u, e, dmg * 0.6, 'phys', { tag: 's1' }); m3.addStatus(e, 'slow', 1, 0.3, { src: u }); } }));
        },
        ai: { use: 'poke', range: 6.5, aim: 'point', speed: 30, farm: 99 },
      },
      s2: {
        name: 'Thời Khắc', desc: 'Chrono: Liên Xạ 3s — bắn nhanh gấp đôi, đi chậm 30%, không thể cản phá • Neo: mưa đạn 7 viên hình nón 6 đv.',
        cd: [14, 13, 12, 11, 10], cost: [60, 60, 60, 60, 60], castTime: 0.1,
        use(m, u, ctx) {
          if (H.T(u, '3c')) u.cd.s2 *= 0.7;
          if (isC(u)) {
            u.ws.barrage = m.time + 3; u.ws.ammo.chrono = magOf(u, 'chrono') + 4; u.ws.rl = 0;
            m.addStatus(u, 'unstop', 3, 1, { key: 'cn_bar' }); m.addStatus(u, 'slow', 3, 0.3, { key: 'cn_bar' });
            if (H.T(u, '9c')) m.addStatus(u, 'undying', 2.5, 1, { key: 'cn_tank' });
            // Giao Thoa Không Gian: dùng lại để kéo kẻ địch quanh về trước nòng súng
            if (H.T(u, '12a')) m.allowRecast(u, 's2', 3, (mm, uu) => {
              const f = { x: uu.x + uu.fx * 2.5, y: uu.y + uu.fy * 2.5 };
              for (const e of mm.enemiesIn(uu.team, uu.x, uu.y, 6, { heroesOnly: true })) { const v = H.dirTo(e, f), d = M.dist(e, f); if (d > 0.5) mm.knock(uu, e, v.x, v.y, d, 0.3); }
            });
            return;
          }
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, ctx.v([30, 45, 60, 75, 90]), 0.45);
          for (let i = 0; i < 7; i++) { const a = -0.45 + 0.15 * i, c = M.cos(a), s = M.sin(a); m.proj({ owner: u, x: u.x, y: u.y, dx: v.x * c - v.y * s, dy: v.x * s + v.y * c, speed: 28, range: 6, r: 0.35, kind: 'bullet', onHit: (mm, p, e) => mm.damage(u, e, dmg, 'phys', { tag: 's2' }) }); }
        },
        ai: { use: 'burst', range: 5.5, aim: 'unit', recastWhen: (m, u, t) => t && t.kind === 'hero' && M.dist(u, t) > 3 && M.dist(u, t) < 6 },
      },
      s3: {
        name: 'Bước Thời Gian', desc: 'Chrono: bước lên 2.5 đv, giảm 30% sát thương 2s • Neo: lướt 4 đv để lại ảo ảnh; trong 3s dùng lại để quay về chỗ ảo ảnh.',
        cd: [12, 11, 10, 9, 8], cost: [45, 45, 45, 45, 45],
        use(m, u, ctx) {
          const far = H.T(u, '1c') ? 1.25 : 1, from = { x: u.x, y: u.y };
          if (isC(u)) {
            const p = H.toward(u, ctx.pt, 2.5 * far, false); m.dashTo(u, p.x, p.y, 14, {});
            m.addStatus(u, 'reduce', 2, 0.3, { key: 'cn_step' });
            if (H.T(u, '6a')) m.allowRecast(u, 's3', 2.5, (mm, uu) => mm.hitCircle(uu, from.x, from.y, 2.5, (e) => { mm.damage(uu, e, H.amt(uu, 40 + 10 * uu.level, 0.5), 'phys', { tag: 's3', aoe: true }); const v = H.dirTo(from, e); mm.knock(uu, e, v.x, v.y, 2, 0.2); }, { color: '#d0a050' }));
            return;
          }
          const hp0 = u.hp, t0 = m.time;
          const d = m.makeDecoy(u, from.x, from.y, { life: 3, hp: 0.3 });
          const p = H.toward(u, ctx.pt, 4 * far, false); m.dashTo(u, p.x, p.y, 20, {});
          m.allowRecast(u, 's3', 3, (mm, uu) => {
            if (!d.alive) return;
            const back = { x: d.x, y: d.y };
            if (H.T(uu, '6b')) { d.x = uu.x; d.y = uu.y; for (let i = 0; i < 3; i++) { const t = H.nearestEnemyHero(mm, uu, 7); if (t) mm.later(0.08 * i, (m3) => H.homing(m3, uu, t, { speed: 34, kind: 'bullet', onHit: (m4, pp, e) => { m4.damage(uu, e, uu.st.ad * 0.5, 'phys', { tag: 's3' }); m4.addStatus(e, 'slow', 1, 0.3, { src: uu }); } })); } }
            else d.alive = false;
            mm.blink(uu, back.x, back.y);
            if (H.T(uu, '3b')) mm.hitCircle(uu, uu.x, uu.y, 2, (e) => mm.addStatus(e, 'stun', 0.75, 1, { src: uu }), { color: '#6af0ff' });
            if (H.T(uu, '9b')) { const h = uu.ws.hist.find((x) => mm.time - x.t <= 2.2); if (h && h.hp > uu.hp) mm.heal(uu, uu, h.hp - uu.hp); }
          });
        },
        ai: { use: 'escape', range: 4, aim: 'away', recastWhen: (m, u) => !!(u.ai && u.ai.fleeing && u.hpPct < 0.3) },
      },
      sub: {
        name: 'Chuyển Thế', desc: 'Đổi thế. Sang Chrono: sóng đẩy lùi 1.5 đv quanh người + giảm 25% sát thương 1s • Sang Neo: +40% tốc chạy 1.5s.',
        cd: 4,
        use(m, u) { swap(m, u); if (H.T(u, '9a')) u.cd.sub = 1.5; },
        ai: { use: 'defend', aim: 'self', range: 6, alsoEscape: true, cond: (m, u, t) => {
          const d = M.dist(u, t);
          if (u.ai && u.ai.fleeing) return isC(u);                       // chạy thì sang Neo
          return isC(u) ? d > 4.5 && u.ws.ammo.chrono === 0 : d < 3.5 || u.ws.ammo.neo === 0;   // áp sát thì Chrono, xa thì Neo
        } },
      },
      s4: {
        name: 'Liên Hoa Thời Không', desc: '5s hợp nhất: mỗi 0.5s xả 8 viên hoa sen tỏa quanh người (6 đv). Dùng ngay sau Chuyển Thế (1.5s): hoa to gấp đôi.',
        cd: [110, 90, 70], cost: [100, 100, 100],
        use(m, u, ctx) {
          const big = m.time - (u.ws.swapT || -9) <= 1.5, R = big ? 12 : 6, dmg = H.amt(u, ctx.v([30, 45, 60]), 0.3);
          let k = 0;
          m.zone({ owner: u, x: u.x, y: u.y, r: R, life: 5, every: 0.5, follow: u, kind: 'lotus', tick: (mm) => {
            k++;
            for (let i = 0; i < 8; i++) { const a = i * 0.785 + k * 0.39; mm.proj({ owner: u, x: u.x, y: u.y, dx: M.cos(a), dy: M.sin(a), speed: 20, range: R, r: 0.4, kind: 'bullet', onHit: (m3, p, e) => m3.damage(u, e, dmg, 'phys', { tag: 's4', aoe: true }) }); }
          } });
        },
        ai: { use: 'ult', aim: 'self', range: 5.5, aoe: 6 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 6, role: 'adc' },
    tags: ['autos'],
  });
  G.HEROES.chrononeo.tree = [
    [
      { name: 'Cò Súng Đôi', desc: 'Mỗi khẩu thêm 1 viên (Chrono 5, Neo 11).' },
      { name: 'Hồi Nhịp Nhanh', desc: 'Nạp đạn của cả hai thế nhanh hơn 25%.' },
      { name: 'Lướt Xuyên Không', desc: 'Bước Thời Gian xa hơn 25%.' },
    ],
    [
      { name: 'Nhiệt Hỏa Quá Khứ', desc: 'Liên Xạ của Chrono gây thiêu đốt.' },
      { name: 'Nghịch Ảnh Tương Lai', desc: 'Neo quay về chỗ ảo ảnh: choáng 0.75s kẻ địch xung quanh.' },
      { name: 'Đẩy Nhanh Chu Kỳ', desc: 'Thời Khắc hồi chiêu nhanh hơn 30%.' },
    ],
    [
      { name: 'Vụ Nổ Quá Khứ', desc: 'Chrono: sau Bước Thời Gian, dùng lại để kích nổ điểm xuất phát, hất văng kẻ truy đuổi.' },
      { name: 'Hoán Đổi Ảo Ảnh', desc: 'Neo: dùng lại Bước Thời Gian thì hoán đổi với ảo ảnh (ảo ảnh ở lại dụ địch) và nã 3 viên làm chậm.' },
      { name: 'Đồng Hồ Cát Đồng Bộ', desc: 'Chuyển Thế nạp đầy đạn cho cả hai khẩu.' },
    ],
    [
      { name: 'Thời Gian Tự Do', desc: 'Chuyển Thế hồi 1.5s; mỗi lần đổi thế nạp ngay 1 viên cho thế mới.' },
      { name: 'Nghịch Lý Sinh Tồn', desc: 'Neo quay về chỗ ảo ảnh: hồi lại lượng máu đã mất trong 2s qua.' },
      { name: 'Cỗ Xe Tăng Thời Gian', desc: '2.5s đầu của Liên Xạ (Chrono): máu không xuống dưới 1.' },
    ],
    [
      { name: 'Giao Thoa Không Gian', desc: 'Trong Liên Xạ: dùng lại Thời Khắc để kéo mọi tướng địch trong 6 đv về trước nòng súng.' },
      { name: 'Nghịch Lý Thời Gian', desc: 'Mỗi phát đánh thường bắn cùng lúc đạn Quá Khứ lẫn Tương Lai: luôn ×1.4 sát thương ở cả hai thế.' },
      { name: 'Vòng Lặp Vĩnh Cửu', desc: 'Đòn chí tử: tua ngược về vị trí 3–4s trước với 30% máu (1 lần mỗi trận).' },
    ],
  ];
})();
