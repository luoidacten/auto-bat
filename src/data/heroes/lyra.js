'use strict';
// ===== Lyra — Thủy Triều • Đường giữa / Hỗ trợ • pháp sư khống chế bằng sóng nước • mana • phép =====
// TƯỚNG MỚI (GĐ5): chưa có trong game lúc bắt đầu sự nghiệp; một bản cập nhật từ mùa 2 trở đi sẽ phát hành
// (unreleased + release: mùa sớm nhất). Khung thêm tướng mới: đặt unreleased: true, release: N — G.Patch.make tự đưa vào hàng chờ.
(function () {
  const G = globalThis.G, H = G.H;
  const TIDE = 'lyra_tide';
  // Thủy Triều: chiêu trúng tướng tích 1 tầng; đủ 3 tầng → trói chân (mỗi mục tiêu tối đa 1 lần/6s)
  function tide(m, u, e) {
    if (!e || !e.alive || e.kind !== 'hero') return;
    const need = H.T(u, '3a') ? 2 : 3;
    const s = m.addStatus(e, 'mark', 4, 1, { key: TIDE, stack: 'add', max: need, src: u });
    if (s && (s.n || 1) >= need && H.ready(m, u, 'tide' + e.id, 6)) {
      m.removeStatus(e, 'mark', TIDE);
      m.addStatus(e, 'root', H.T(u, '9a') ? 1.1 : 0.75, 1, { src: u });
      if (m.fxOn) m.fx({ type: 'burst', x: e.x, y: e.y, color: '#5ac8ff' });
    }
  }
  H.def({
    id: 'lyra', name: 'Lyra', color: '#4ab8e8', gfx: 'staff', kit: 'mage', pos: ['mid', 'sup'], dmgType: 'magic',
    ranged: true, projSpeed: 15, projKind: 'star', r: 0.6, resource: 'mana',
    stats: { range: 5.5, hp: 550 },
    unreleased: true, release: 2, tagline: 'pháp sư sóng nước — khống chế, che chắn đồng đội',
    passive: {
      name: 'Thủy Triều',
      desc: 'Chiêu trúng tướng địch tích 1 tầng Thủy Triều (4s). Đủ 3 tầng: trói chân 0.75s (mỗi mục tiêu 1 lần/6s).',
    },
    skills: {
      s1: {
        name: 'Bong Bóng Nước', desc: 'Bắn bong bóng 8 đv: 60/95/130/165/200 (+60% SMPT) sát thương phép lên kẻ đầu tiên trúng, làm chậm 25% 1s.',
        cd: [6, 5.5, 5, 4.5, 4], cost: [50, 55, 60, 65, 70], castTime: 0.2,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0, 0.6);
          H.shoot(m, u, ctx.pt, { speed: H.T(u, '1a') ? 21 : 15, range: 8, r: 0.5, kind: 'star',
            onHit: (mm, p, e) => { p.dead = true; mm.damage(u, e, dmg, 'magic', { tag: 's1' }); mm.addStatus(e, 'slow', 1, 0.25, { src: u }); tide(mm, u, e); } });
        },
        ai: { use: 'poke', range: 7.8, aim: 'point', speed: 15, farm: 3, skillshot: true },
      },
      s2: {
        name: 'Sóng Dâng', desc: 'Đẩy một con sóng 7 đv (rộng 1.4): 50/80/110/140/170 (+45% SMPT) sát thương phép và đẩy lùi 1.5 đv theo hướng sóng.',
        cd: [11, 10.5, 10, 9.5, 9], cost: [60, 65, 70, 75, 80], castTime: 0.2,
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0, 0.45), push = H.T(u, '6a') ? 2.5 : 1.5;
          m.hitLine(u, u.x, u.y, v.x, v.y, 7, 1.4, (e) => { m.damage(u, e, dmg, 'magic', { tag: 's2', aoe: true }); m.knock(u, e, v.x, v.y, push, 0.25); tide(m, u, e); }, { color: '#5ac8ff' });
        },
        ai: { use: 'cc', range: 6.5, aim: 'point', speed: 0, alsoEscape: true },
      },
      s3: {
        name: 'Dòng Chảy', desc: 'Lyra và đồng minh thấp máu nhất trong 6 đv nhận khiên 50/80/110/140/170 (+35% SMPT) 2.5s và +30% tốc chạy 2s.',
        cd: [14, 13, 12, 11, 10], cost: [60, 60, 60, 60, 60],
        use(m, u, ctx) {
          const amt = H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0, 0.35);
          const al = H.alliesNear(m, u, 6).sort((a, b) => a.hpPct - b.hpPct)[0];
          for (const t of al ? [u, al] : [u]) { m.shield(u, t, amt * (H.T(u, '6b') ? 1.3 : 1), 2.5); m.addStatus(t, 'haste', 2, 0.3); }
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#7ad8ff', life: 1.5 });
        },
        ai: { use: 'support', aim: 'self', range: 6, alsoEscape: true },
      },
      s4: {
        name: 'Đại Hồng Thủy', desc: 'Gọi cột nước vào điểm trong 10 đv, dâng sau 0.75s: bán kính 3.5, 180/270/360 (+80% SMPT) sát thương phép, hất tung 1s.',
        cd: [110, 95, 80], cost: [100, 100, 100], castTime: 0.25,
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 10, true), R = H.T(u, '12a') ? 4.3 : 3.5;
          m.telegraph({ team: u.team, x: p.x, y: p.y, r: R, life: 0.75, color: '#3a9ad8' });
          m.later(0.75, (mm) => {
            mm.hitCircle(u, p.x, p.y, R, (e) => { mm.damage(u, e, H.amt(u, ctx.v([180, 270, 360]), 0, 0.8), 'magic', { tag: 's4', aoe: true }); mm.knockup(u, e, 1); tide(mm, u, e); }, { color: '#4ab8e8' });
            if (mm.fxOn) mm.fx({ type: 'boom', x: p.x, y: p.y, big: true });
          });
        },
        ai: { use: 'ult', range: 10, aim: 'point', speed: 0, delay: 1, aoe: 3.5, minTargets: 2 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 6.5, role: 'mage' },
    tags: ['cc', 'poke'],
  });
  G.HEROES.lyra.tree = [
    [
      { name: 'Bọt Tốc Hành', desc: 'Bong Bóng Nước (S1) bay nhanh hơn 40%.' },
      { name: 'Linh Lực Thủy Triều', desc: '+20 SMPT.', stats: { ap: 20 } },
      { name: 'Áo Choàng Sương', desc: '+120 máu.', stats: { hp: 120 } },
    ],
    [
      { name: 'Triều Cường', desc: 'Thủy Triều chỉ cần 2 tầng để trói chân (thay vì 3).' },
      { name: 'Mạch Nước Ngầm', desc: '+10% giảm hồi chiêu.', stats: { cdr: 0.1 } },
      { name: 'Giáp Bọt Biển', desc: '+15 giáp, +15 kháng phép.', stats: { armor: 15, mr: 15 } },
    ],
    [
      { name: 'Sóng Thần', desc: 'Sóng Dâng (S2) đẩy lùi 2.5 đv (thay vì 1.5).' },
      { name: 'Che Chở', desc: 'Khiên của Dòng Chảy (S3) mạnh hơn 30%.' },
      { name: 'Tinh Thủy', desc: '+40 SMPT.', stats: { ap: 40 } },
    ],
    [
      { name: 'Xoáy Nước', desc: 'Trói chân của Thủy Triều kéo dài 1.1s.' },
      { name: 'Thủy Lưu Tốc', desc: '+8% tốc chạy.', stats: { msPct: 0.08 } },
      { name: 'Ngọc Trai Biển Sâu', desc: '+15% xuyên phép.', stats: { magicPen: 0.15 } },
    ],
    [
      { name: 'Hồng Thủy Diệt Thế', desc: 'Đại Hồng Thủy (S4) rộng 4.3 đv.' },
      { name: 'Đại Dương Bao La', desc: '+300 máu, +40 SMPT.', stats: { hp: 300, ap: 40 } },
      { name: 'Nước Mắt Nữ Thần', desc: '+15% giảm hồi chiêu, +5 hồi mana/s.', stats: { cdr: 0.15, mpr: 5 } },
    ],
  ];
})();
