'use strict';
// ===== Ryoma — Katana • Đường giữa / Đường trên • kiếm sĩ combo • KHÔNG MANA • vật lý =====
(function () {
  const G = globalThis.G, H = G.H;
  // ---- 6 biến thể Combo (cặp chiêu không phân thứ tự; order giữ thứ tự thật cho nhánh tiến hóa) ----
  function combo(m, u, pair, order) {
    const t = u.ai && u.ai.target && u.ai.target.alive && G.M.dist(u, u.ai.target) < 6 ? u.ai.target : H.nearestEnemyHero(m, u, 5);
    const v = t ? H.dirTo(u, t) : { x: u.fx, y: u.fy };
    const base = H.amt(u, 20 + 8 * u.level, 0.35);
    const ghost = pair.includes('C') && H.T(u, '3a');                       // Hư Ảnh Trùng Kích
    const up = H.T(u, '6b') && order[0] === 's2' && order[1] === 's1';       // Ngược Gió Chém Sát
    const ring = (x, y, R, k, extra, fx) => m.hitCircle(u, x, y, R * (ghost ? 1.35 : 1), (e) => {
      m.damage(u, e, base * k * (ghost ? 1.5 : 1), 'phys', { tag: 'combo', aoe: true });
      if (up) m.knockup(u, e, 0.75);
      if (extra) extra(e);
    }, { color: '#ff9ab0', fx: fx || 'whirl' });
    if (m.fxOn) m.fx({ type: 'combo', id: u.id, x: u.x, y: u.y, name: pair, color: '#ff5a7a' });
    if (pair === 'AA') ring(u.x, u.y, 3.0, 1.3);                                             // chém tròn rộng
    else if (pair === 'AB') {                                                                 // lướt chém rồi chém tròn nhỏ
      const p = t ? H.toward(u, t, Math.max(0, Math.min(2.5, G.M.dist(u, t) - 1)), true) : { x: u.x + v.x * 2.5, y: u.y + v.y * 2.5 };
      m.dashTo(u, p.x, p.y, 22, { onContact: (mm, uu, e) => mm.damage(u, e, base * 0.6, 'phys', { tag: 'combo' }), onEnd: () => ring(u.x, u.y, 2.0, 1) });
    } else if (pair === 'AC') {                                                               // hư ảnh cùng chém tròn
      const f = u.ws.s3from || { x: u.x - v.x * 2, y: u.y - v.y * 2 };
      ring(u.x, u.y, 2.3, 1);
      ring(f.x, f.y, 2.3, 0.8, null, 'phantom');
    } else if (pair === 'BB') {                                                               // đâm lần nữa gây choáng
      m.hitLine(u, u.x, u.y, v.x, v.y, 4.5, 1.2, (e) => { m.damage(u, e, base * 1.2, 'phys', { tag: 'combo' }); m.addStatus(e, 'stun', 0.75, 1, { src: u }); }, { color: '#ffd0dc', fx: 'thrust' });
      if (H.T(u, '3c')) u.ws.heavy = true;
    } else if (pair === 'BC') {                                                               // phóng dư ảnh lao tới
      H.shoot(m, u, { x: u.x + v.x, y: u.y + v.y }, { speed: 20, range: 6, r: 0.8, pierce: true, kind: 'phantom',
        onHit: (mm, p, e) => { mm.damage(u, e, base * 1.1 * (ghost ? 1.5 : 1), 'phys', { tag: 'combo' }); mm.addStatus(e, 'slow', 1, 0.3, { src: u }); if (up) mm.knockup(u, e, 0.75); } });
    } else if (pair === 'CC') {                                                               // gió xoáy làm chậm
      m.zone({ owner: u, x: u.x, y: u.y, r: 2.6 * (ghost ? 1.35 : 1), life: 1.6, every: 0.4, kind: 'wind',
        tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => { mm.damage(u, e, base * 0.3, 'phys', { tag: 'combo', aoe: true, noHook: true }); mm.addStatus(e, 'slow', 0.6, 0.35, { src: u }); }, { noFx: true }) });
    }
  }
  H.def({
    id: 'ryoma', name: 'Ryoma', color: '#ff5a7a', gfx: 'katana', kit: 'fighter', pos: ['mid', 'top'], dmgType: 'phys',
    ranged: false, r: 0.62, resource: 'none',
    stats: { hp: 560, hpG: 86, ad: 60, adG: 3.7, armor: 30, as: 0.7, ms: 3.55, range: 1.6 },
    passive: {
      name: 'Liên Hoàn',
      desc: 'Nhất Đao, Đột Thích, Thuấn Bộ mỗi chiêu có 2 lượt dùng. Cứ 2 chiêu liên tiếp trong 2s kích hoạt Combo theo cặp: AA chém tròn rộng • AB lướt chém rồi chém tròn nhỏ • AC hư ảnh cùng chém tròn • BB đâm thêm nhát nữa gây CHOÁNG • BC phóng dư ảnh lao tới • CC gió xoáy làm chậm (A = Nhất Đao, B = Đột Thích, C = Thuấn Bộ). Mỗi Combo hồi 1 lượt Nhất Đao, nạp 1 Kiếm Khí (tối đa 3) và giảm 3s hồi chiêu Vô Ảnh Trảm.',
      init(m, u) { u.ws.last = null; u.ws.lastT = -9; u.ws.kk = 0; u.ws.combos = 0; },
      onSkill(m, u, key) {
        if (key !== 's1' && key !== 's2' && key !== 's3') return;
        if (u.ws.last && m.time - u.ws.lastT <= 2) {
          const order = [u.ws.last, key];
          u.ws.last = null; u.ws.combos++;
          m.refund(u, 's1');
          if (H.T(u, '12c')) m.refund(u, 's2');                                 // Tâm Kiếm Hợp Nhất
          u.cd.s4 = Math.max(0, (u.cd.s4 || 0) - (H.T(u, '9a') ? 6 : 3));
          u.ws.kk = Math.min(3, u.ws.kk + 1);
          u.ws.freeS1 = m.time + 3;                                              // Đao Phách Vô Tận
          const pair = order.map((k) => ({ s1: 'A', s2: 'B', s3: 'C' })[k]).sort().join('');
          m.later(0.2, (mm) => { if (u.alive && !u.disabled) combo(mm, u, pair, order); });
        } else { u.ws.last = key; u.ws.lastT = m.time; }
      },
      onAuto(m, u, t, info) { if (u.ws.heavy) { u.ws.heavy = false; info.amt *= 1.4; } },
    },
    skills: {
      s1: {
        name: 'Nhất Đao', desc: 'Chém hình vòng cung trước mặt. 2 lượt dùng.',
        cd: [4, 3.75, 3.5, 3.25, 3], charges: 2, castTime: 0.12,
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt);
          let R = H.T(u, '1b') ? 3.1 : 2.6;
          if (H.T(u, '6c') && u.ws.freeS1 > m.time) { R *= 1.3; u.ws.freeS1 = 0; }
          m.hitCone(u, u.x, u.y, v.x, v.y, R, 0.35, (e) => m.damage(u, e, H.amt(u, ctx.v([45, 70, 95, 120, 145]), 0.55), 'phys', { tag: 's1' }), { color: '#ffd0dc', fx: 'slash' });
        },
        ai: { use: 'burst', range: 2.3, aim: 'unit', farm: 3 },
      },
      s2: {
        name: 'Đột Thích', desc: 'Đâm thẳng 4 đv. 2 lượt dùng.',
        cd: [7, 6.5, 6, 5.5, 5], charges: 2, castTime: (m, u) => (H.T(u, '12b') ? 0.6 : 0.18),
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, ctx.v([50, 75, 100, 125, 150]), 0.65);
          // Kiếm Cư Hợp (Iaido): tụ lực rồi lướt chém 7 đv xuyên qua kẻ địch
          if (H.T(u, '12b')) {
            m.dashTo(u, u.x + v.x * 7, u.y + v.y * 7, 30, { untarget: true, onContact: (mm, uu, e) => mm.damage(u, e, dmg * 1.6, 'phys', { tag: 's2' }) });
            if (m.fxOn) m.fx({ type: 'line', x: u.x, y: u.y, x2: u.x + v.x * 7, y2: u.y + v.y * 7, w: 0.4, color: '#ffd0dc', fx: 'thrust' });
            return;
          }
          m.hitLine(u, u.x, u.y, v.x, v.y, H.T(u, '1c') ? 5 : 4, 1.0, (e) => m.damage(u, e, dmg, 'phys', { tag: 's2' }), { color: '#ffd0dc', fx: 'thrust' });
        },
        ai: { use: 'poke', range: 3.8, aim: 'point', speed: 0, farm: 3 },
      },
      s3: {
        name: 'Thuấn Bộ', desc: 'Lướt ngắn 3.5 đv về phía trước, chém kẻ địch trên đường. 2 lượt dùng.',
        cd: [8, 7.5, 7, 6.5, 6], charges: 2,
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 3.5, false), dmg = H.amt(u, ctx.v([35, 55, 75, 95, 115]), 0.45), from = { x: u.x, y: u.y };
          u.ws.s3from = from;
          if (H.T(u, '1a')) u.chT.s3 = Math.max(0.5, (u.chT.s3 || 0) - 1.5);
          m.dashTo(u, p.x, p.y, 18, { onContact: (mm, uu, e) => { mm.damage(u, e, dmg, 'phys', { tag: 's3' }); } });
          if (m.fxOn) m.fx({ type: 'dashtrail', id: u.id, x: from.x, y: from.y, x2: p.x, y2: p.y, color: '#ffb0c0' });
          // Thuật Thế Thân: dùng lại để giật về điểm xuất phát, để lại tàn ảnh chém quét
          if (H.T(u, '6a')) m.allowRecast(u, 's3', 1.5, (mm, uu) => {
            const x = uu.x, y = uu.y;
            mm.blink(uu, from.x, from.y);
            mm.hitCircle(uu, x, y, 2.2, (e) => mm.damage(uu, e, dmg, 'phys', { tag: 's3', aoe: true }), { color: '#ffb0c0', fx: 'whirl' });
          });
        },
        ai: { use: 'engage', range: 4.5, aim: 'unit', alsoEscape: true, recastWhen: (m, u) => u.hpPct < 0.35 },
      },
      sub: {
        name: 'Kiếm Khí', desc: 'Chỉ dùng được khi có Kiếm Khí (mỗi Combo nạp 1, tối đa 3): chém ra một luồng kiếm khí xuyên thấu 7 đv — 25 (+6/cấp, +80% SMVL) sát thương, PHÁ HỦY đạn của đối thủ trên đường bay.',
        cd: 1,
        can(m, u) { return u.ws.kk > 0; },
        use(m, u, ctx) {
          u.ws.kk--;
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, 25 + 6 * u.level, 0.8);
          const sil = H.T(u, '3b') || H.T(u, '12a');
          const wave = (dir) => {
            const p = H.shoot(m, u, { x: u.x + dir.x, y: u.y + dir.y }, { speed: H.T(u, '3b') ? 33 : 22, range: 7, r: 0.6, pierce: true, kind: 'slashwave',
              onHit: (mm, pp, e) => { mm.damage(u, e, dmg, 'phys', { tag: 'kk' }); if (sil && e.kind === 'hero') mm.addStatus(e, 'silence', 1, 1, { src: u }); } });
            p.cutsProj = true;                                                  // phá đạn của đối thủ
            return p;
          };
          wave(v);
          if (H.T(u, '12a')) for (const a of [-0.4, 0.4]) { const c = G.M.cos(a), s2 = G.M.sin(a); wave({ x: v.x * c - v.y * s2, y: v.x * s2 + v.y * c }); }
          if (H.T(u, '9c')) m.refund(u, 's3');                                   // Kiếm Vô Tận
        },
        ai: { use: 'poke', range: 6.8, aim: 'point', speed: 22, farm: 99 },
      },
      s4: {
        name: 'Vô Ảnh Trảm', desc: 'Lao vào tướng trong 5 đv, không thể bị chọn 1.2s, chém 5 lần rồi tung nhát kết liễu cộng 10% máu đã mất.',
        cd: [100, 85, 70], castTime: 0.05,
        can(m, u) { return !!(u.ai && u.ai.target && u.ai.target.kind === 'hero' && G.M.dist(u, u.ai.target) < 5.5); },
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.kind === 'hero' ? ctx.tgt : u.ai && u.ai.target;
          if (!t || !t.alive) return;
          m.addStatus(u, 'untarget', 1.2, 1); m.addStatus(u, 'unstop', 1.2, 1);
          if (H.T(u, '9b')) for (const e of m.enemiesIn(u.team, t.x, t.y, 4, { heroesOnly: true })) m.addStatus(e, 'root', 1, 1, { src: u });
          const hit = H.amt(u, ctx.v([30, 45, 60]), 0.25);
          for (let i = 0; i < 5; i++) m.later(0.18 * i, (mm) => {
            if (!t.alive || !u.alive) return;
            const a = i * 1.2566;
            u.x = t.x + G.M.cos(a) * 1.4; u.y = t.y + G.M.sin(a) * 1.4; G.MAP.pushOut(u, u.r);
            mm.damage(u, t, hit, 'phys', { tag: 's4' });
            if (mm.fxOn) mm.fx({ type: 'slash', x: t.x, y: t.y, color: '#ff5a7a' });
          });
          m.later(1.0, (mm) => {
            if (!t.alive || !u.alive) return;
            mm.damage(u, t, H.amt(u, ctx.v([100, 150, 200]), 0.6) + (t.st.maxHp - t.hp) * 0.1, 'phys', { tag: 's4' });
            if (mm.fxOn) mm.fx({ type: 'burst', x: t.x, y: t.y, color: '#ff2a5a' });
          });
        },
        ai: { use: 'ult', aim: 'unit', range: 5, cond: (m, u, t) => t.kind === 'hero' && t.hpPct < 0.6 },
      },
    },
    ai: { order: ['s1', 's3', 's2'], engageRange: 4, role: 'fighter', bait: true },
    tags: ['dive'],
  });
  G.HEROES.ryoma.tree = [
    [
      { name: 'Lưu Thủy', desc: 'Thuấn Bộ (S3) nạp lượt nhanh hơn 1.5s.' },
      { name: 'Khai Kiếm', desc: 'Nhất Đao (S1) chém xa hơn 20%.' },
      { name: 'Thấu Kính', desc: 'Đột Thích (S2) đâm xa hơn 25%.' },
    ],
    [
      { name: 'Hư Ảnh Trùng Kích', desc: 'Combo có Thuấn Bộ (AC, BC, CC) rộng hơn 35% và mạnh hơn 50%.' },
      { name: 'Trảm Khí Xuyên Giác', desc: 'Kiếm Khí (skill phụ) bay nhanh hơn 50% và câm lặng tướng trúng 1s.' },
      { name: 'Chấn Xung Lực', desc: 'Sau Combo BB, đòn đánh kế tiếp +40% sát thương.' },
    ],
    [
      { name: 'Thuật Thế Thân', desc: 'Trong 1.5s sau Thuấn Bộ: dùng lại để giật về điểm xuất phát, để lại tàn ảnh chém quét.' },
      { name: 'Ngược Gió Chém Sát', desc: 'Combo Đột Thích → Nhất Đao (đúng thứ tự): đòn combo hất tung 0.75s.' },
      { name: 'Đao Phách Vô Tận', desc: 'Nhất Đao dùng trong 3s sau Combo chém xa hơn 30%.' },
    ],
    [
      { name: 'Tâm Kiếm Độc Tôn', desc: 'Mỗi Combo giảm 6s hồi chiêu Vô Ảnh Trảm (thay vì 3s).' },
      { name: 'Nhất Kiếm Định Âm', desc: 'Vô Ảnh Trảm trói chân 1s mọi tướng địch trong 4 đv quanh mục tiêu.' },
      { name: 'Kiếm Vô Tận', desc: 'Tung Kiếm Khí xong lập tức hồi 1 lượt Thuấn Bộ.' },
    ],
    [
      { name: 'Tam Trọng Trảm Khí', desc: 'Kiếm Khí phóng 3 luồng hình quạt, câm lặng 1s.' },
      { name: 'Kiếm Cư Hợp (Iaido)', desc: 'Đột Thích thành thế tra kiếm: tụ 0.6s rồi lướt chém 7 đv xuyên qua kẻ địch (không thể bị chọn), sát thương ×1.6.' },
      { name: 'Tâm Kiếm Hợp Nhất', desc: 'Combo hồi 1 lượt cả Nhất Đao lẫn Đột Thích.' },
    ],
  ];
})();
