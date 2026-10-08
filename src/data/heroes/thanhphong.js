'use strict';
// ===== Diệp Thanh Phong — Thiết Phiến • Đường giữa / Hỗ trợ • khống chế gió, ru ngủ • KHÔNG MANA (Thước Gió) • phép =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const MIST = 'tp_mist';
  const state = (u) => (H.T(u, '12a') ? 'nghich' : u.ws.wind <= 35 ? 'thuan' : u.ws.wind >= 65 ? 'nghich' : 'bao');
  function wind(u, d) { if (!H.T(u, '12a')) u.ws.wind = Math.max(0, Math.min(100, u.ws.wind + d)); }
  // Gió Mê (Bão Hòa): 3 tầng thì ngủ 1s
  function mist(m, u, e) {
    if (state(u) !== 'bao' || !e.alive || e.kind !== 'hero') return;
    const s = m.addStatus(e, 'mark', 4, 1, { key: MIST, src: u, stack: 'add', max: 3 });
    if (s && s.n >= 3 && H.ready(m, u, 'mist' + e.id, 8)) { m.removeStatus(e, 'mark', MIST); m.addStatus(e, 'sleep', 1, 1.2, { src: u }); }
  }
  const behind = (t, d) => ({ x: t.x - t.fx * (t.r + d), y: t.y - t.fy * (t.r + d) });
  H.def({
    id: 'thanhphong', name: 'Diệp Thanh Phong', color: '#7ad0b0', gfx: 'fan', kit: 'mage', pos: ['mid', 'sup'], dmgType: 'magic',
    ranged: true, projSpeed: 18, projKind: 'note', r: 0.58, resource: 'none',
    stats: { range: 4.8, hp: 560, hpG: 88, armor: 24, ms: 3.45 },
    passive: {
      name: 'Khí Áp Phong Vũ',
      desc: 'Thước Gió 0–100 (S1 kéo −15, S2 đẩy +15). Thuận (≤35): +15% tốc chạy, Giáp Phong Hộ chặn 1 đòn mỗi 10s • Bão Hòa (36–64): đòn đánh và chiêu gây Gió Mê, đủ 3 tầng thì ngủ 1s • Nghịch (≥65): +20% sát thương.',
      init(m, u) { u.ws.wind = 50; u.ws.guard = 0; },
      update(m, u) {
        const st = state(u);
        if (st === 'thuan' && m.tick % 10 === 0) m.addStatus(u, 'haste', 0.6, H.T(u, '1a') ? 0.25 : 0.15, { key: 'tp_thuan' });
        if (st === 'bao' && H.T(u, '9c') && m.tick % 10 === 0) { u.anchorT = m.time + 0.6; m.addStatus(u, 'reduce', 0.6, 0.15, { key: 'tp_tam' }); }
      },
      onDeal(m, u, t, info) { if (state(u) === 'nghich') info.amt *= H.T(u, '1b') ? 1.3 : 1.2; },
      afterDeal(m, u, t, info) { if (info.auto || G.ITEM_IS_SKILL(info)) mist(m, u, t); },
      onTake(m, u, att, info) {
        if (state(u) !== 'thuan' || !att || att.team === u.team || att.kind === 'tower') return;
        if (!H.ready(m, u, 'phongho', H.T(u, '1c') ? 7 : 10)) return;
        info.amt = 0; if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#bfffe0', life: 0.4 });
      },
      onKill(m, u, v) { if (H.T(u, '12c') && v.kind === 'hero' && m.time - (v.ws && v.ws.sleptT || -99) < 3) u.cd.s4 = (u.cd.s4 || 0) * 0.5; },
    },
    skills: {
      s1: {
        name: 'Toàn Phong Quy', desc: 'Lốc xoáy thẳng 7 đv hất tung 0.6s (gió −15). Thuận: thành vực xoáy giữ kẻ địch 1.5s ở cuối đường • Nghịch: Thanh Phong lướt theo lốc.',
        cd: [7, 6.5, 6, 5.5, 5], castTime: 0.15,
        use(m, u, ctx) {
          const st = state(u); wind(u, -15);
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0, 0.6);
          if (H.T(u, '6b')) {   // Phiến Khí Bát Đoạn: 5 luồng khí
            for (const a of [-0.5, -0.25, 0, 0.25, 0.5]) { const c = M.cos(a), s = M.sin(a); m.proj({ owner: u, x: u.x, y: u.y, dx: v.x * c - v.y * s, dy: v.x * s + v.y * c, speed: 20, range: 6, r: 0.4, kind: 'note', onHit: (mm, p, e) => { mm.damage(u, e, dmg * 0.6, 'magic', { tag: 's1' }); mm.addStatus(e, 'slow', 1.5, 0.3, { src: u }); } }); }
            return;
          }
          let hitHero = false;
          const end = { x: u.x + v.x * 7, y: u.y + v.y * 7 };
          H.shoot(m, u, end, { speed: 16, range: 7, r: 0.8, pierce: true, kind: 'note',
            onHit: (mm, p, e) => { mm.damage(u, e, dmg, 'magic', { tag: 's1' }); if (st !== 'thuan') mm.knockup(u, e, 0.6); if (e.kind === 'hero') hitHero = true; },
            onEnd: (mm, p) => {
              if (st === 'thuan') {
                const hold = H.T(u, '3b') ? 2 : 1.5, pull = H.T(u, '3b') ? 1.2 : 0.6;
                mm.zone({ owner: u, x: p.x, y: p.y, r: 2.2, life: hold, every: 0.25, kind: 'wind', tick: (m3, z) => m3.hitCircle(u, z.x, z.y, z.r, (e) => {
                  m3.addStatus(e, 'root', 0.3, 1, { src: u }); const w = H.dirTo(e, z), d = M.dist(e, z); if (d > 0.4) m3.knock(u, e, w.x, w.y, Math.min(pull * 0.25, d), 0.1);
                }, { noFx: true }) });
              }
              if (H.T(u, '9b') && st === 'nghich' && hitHero && H.ready(mm, u, 'lgvh', 6)) u.cd.s1 = 0;
            } });
          if (st === 'nghich') m.dashTo(u, u.x + v.x * 6, u.y + v.y * 6, 18, {});
        },
        ai: { use: 'poke', range: 6.6, aim: 'point', speed: 16, farm: 3 },
      },
      s2: {
        name: 'Bát Diện Phong Trận', desc: 'Đẩy dạt 360° 2 đv bán kính 3 (gió +15). Thuận: màng chắn đạn 3s quanh mình • Nghịch: phóng lưỡi gió rồi dịch chuyển ra sau lưng tướng gần nhất đâm chí mạng (×1.5).',
        cd: [10, 9.5, 9, 8.5, 8], castTime: 0.1,
        use(m, u, ctx) {
          const st = state(u); wind(u, 15);
          const dmg = H.amt(u, ctx.v([55, 85, 115, 145, 175]), 0, 0.5);
          m.hitCircle(u, u.x, u.y, 3, (e) => { m.damage(u, e, dmg, 'magic', { tag: 's2', aoe: true }); const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 2, 0.2); }, { color: '#bfffe0' });
          if (st === 'thuan') {
            m.zone({ owner: u, x: u.x, y: u.y, r: 3, life: 3, every: 0.1, follow: u, kind: 'barrier', tick: (mm, z) => {
              for (const p of mm.projs) if (!p.dead && p.team !== u.team && M.dist(p, z) < z.r) {
                p.dead = true;
                if (H.T(u, '3c') && p.owner && p.owner.alive && p.owner.kind === 'hero') mm.damage(u, p.owner, 40 + 8 * u.level, 'magic', { tag: 'p', noHook: true });
              }
            } });
          } else if (st === 'nghich') {
            const t = H.nearestEnemyHero(m, u, 7);
            if (t) m.later(0.25, (mm) => {
              if (!t.alive || !u.alive) return;
              const bp = behind(t, 0.9); mm.blink(u, bp.x, bp.y); u.face(t.x, t.y);
              mm.damage(u, t, dmg * 1.5, 'magic', { tag: 's2', crit: true });
              if (H.T(u, '6a')) mm.allowRecast(u, 's2', 1.5, (m3, u3) => m3.hitCircle(u3, u3.x, u3.y, 2.5, (e) => m3.knockup(u3, e, 0.75), { color: '#bfffe0' }));
            });
          }
        },
        ai: { use: 'burst', range: 3, aim: 'self', alsoEscape: true },
      },
      s3: {
        name: 'Mê Tung Phong Vực', desc: 'Vùng gió độc bán kính 2.8 tại chỗ đứng trong 3s: kẻ bước vào bị mù + câm lặng 1.25s (1 lần); bản thân lướt 4 đv.',
        cd: [15, 14, 13, 12, 11], castTime: 0.05,
        use(m, u, ctx) {
          const c = { x: u.x, y: u.y }, seen = new Set();
          m.zone({ owner: u, x: c.x, y: c.y, r: 2.8, life: 3, every: 0.25, kind: 'gas', tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => {
            if (!seen.has(e.id)) { seen.add(e.id); mm.addStatus(e, 'blind', 1.25, 1, { src: u }); if (e.kind === 'hero') mm.addStatus(e, 'silence', 1.25, 1, { src: u }); }
            if (H.T(u, '3a') && e.has('blind') && mm.tick % 10 === 0) mm.damage(u, e, H.amt(u, 10 + 3 * u.level, 0, 0.1), 'magic', { tag: 's3', aoe: true });
          }, { noFx: true }) });
          const p = H.toward(u, ctx.pt, 4, false); m.dashTo(u, p.x, p.y, 16, {});
        },
        ai: { use: 'escape', range: 4, aim: 'away', alsoEngage: true },
      },
      sub: {
        name: 'Nghịch Chuyển Canh Khí', desc: 'Thuận ↔ Nghịch (đảo thước gió). Ở Bão Hòa: kích nổ cơn gió (đẩy lùi kẻ địch quanh mình 2 đv) và thanh tẩy khống chế.',
        cd: 12,
        can(m, u) { return !H.T(u, '12a'); },
        use(m, u) {
          if (state(u) === 'bao') {
            m.cleanse(u);
            m.hitCircle(u, u.x, u.y, 3, (e) => { const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 2, 0.2); m.damage(u, e, 30 + 8 * u.level, 'magic', { tag: 'sub', aoe: true }); }, { color: '#bfffe0' });
            u.ws.wind = u.ws.wind < 50 ? 20 : 80;
          } else u.ws.wind = 100 - u.ws.wind;
          if (H.T(u, '6c')) m.heal(u, u, u.st.maxHp * 0.08);
        },
        // AI: đổi sang Nghịch khi giao tranh, Thuận khi bị đuổi
        ai: { use: 'defend', aim: 'self', range: 7, alsoEscape: true, cond: (m, u, t) => (u.ai && u.ai.fleeing ? state(u) !== 'thuan' : state(u) !== 'nghich') || u.disabled },
      },
      s4: {
        name: 'Cơn Gió Đưa Giấc', desc: 'Vùng bão bán kính 4.5 tại điểm trong 9 đv suốt 5s: chậm 50%; đứng trong vùng quá 2s thì ngủ 1.5s; đòn đầu tiên đánh thức gây ×1.5.',
        cd: [120, 100, 80], castTime: 0.2,
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 9, true), stay = {}, slept = new Set();
          const T = H.T(u, '9a') ? 2.5 : 1.5, amp = H.T(u, '9a') ? 2 : 1.5;
          // Long Quyển Phong Bạo: vòi rồng ở tâm hất tung kẻ yếu
          if (H.T(u, '12b')) m.hitCircle(u, p.x, p.y, 2, (e) => { if (e.hpPct < 0.6) m.knockup(u, e, 1.5); }, { color: '#bfffe0' });
          m.zone({ owner: u, x: p.x, y: p.y, r: 4.5, life: 5, every: 0.25, kind: 'storm', tick: (mm, z) => {
            const inside = new Set();
            mm.hitCircle(u, z.x, z.y, z.r, (e) => {
              inside.add(e.id);
              mm.addStatus(e, 'slow', 0.4, 0.5, { src: u, key: 'tp_storm' });
              if (e.kind !== 'hero') return;
              stay[e.id] = (stay[e.id] || 0) + 0.25;
              if (stay[e.id] >= 2 && !slept.has(e.id)) { slept.add(e.id); mm.addStatus(e, 'sleep', T, amp, { src: u }); e.ws && (e.ws.sleptT = mm.time + T); }
              if (mm.tick % 20 === 0) mm.damage(u, e, H.amt(u, ctx.v([25, 40, 55]), 0, 0.15), 'magic', { tag: 's4', aoe: true, noHook: true });
            }, { noFx: true });
            for (const k in stay) if (!inside.has(+k)) stay[k] = 0;
          } });
          m.telegraph({ team: u.team, x: p.x, y: p.y, r: 4.5, life: 5, color: '#7ad0b0' });
        },
        ai: { use: 'ult', aim: 'point', speed: 0, range: 9, aoe: 4.5, minTargets: 2 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 6, role: 'mage' },
    tags: ['cc'],
  });
  G.HEROES.thanhphong.tree = [
    [
      { name: 'Khí Lưu Thuận Chiều', desc: 'Thuận: +25% tốc chạy (thay vì 15%).' },
      { name: 'Cắt Gió Tàn Bạo', desc: 'Nghịch: +30% sát thương (thay vì 20%).' },
      { name: 'Phong Hộ Tái Sinh', desc: 'Giáp Phong Hộ hồi 7s (thay vì 10s).' },
    ],
    [
      { name: 'Phong Độc Hôn Mê', desc: 'Vùng Mê Tung gây sát thương liên tục lên kẻ đang bị mù.' },
      { name: 'Kình Phong Xuyên Thấu', desc: 'Vực xoáy của Toàn Phong Quy (Thuận) hút mạnh gấp đôi và giữ 2s.' },
      { name: 'Bão Thuẫn Phản Hồi', desc: 'Màng chắn của Bát Diện (Thuận) dội ngược: mỗi viên đạn bị chặn gây 40 (+8/cấp) sát thương phép lên kẻ bắn.' },
    ],
    [
      { name: 'Lốc Xoáy Kép', desc: 'Sau cú đâm sau lưng (Bát Diện Nghịch), trong 1.5s dùng lại: xoay quạt hất tung 0.75s quanh mình.' },
      { name: 'Phiến Khí Bát Đoạn', desc: 'Toàn Phong Quy thay bằng 5 luồng khí rẻ quạt, làm chậm 30% (không đổi gió theo trạng thái).' },
      { name: 'Hơi Thở Của Gió', desc: 'Mỗi lần dùng Nghịch Chuyển Canh Khí hồi 8% máu tối đa.' },
    ],
    [
      { name: 'Giấc Mộng Không Đáy', desc: 'Ngủ của Cơn Gió Đưa Giấc kéo dài 2.5s; đòn đánh thức ×2.' },
      { name: 'Lướt Gió Vô Hạn', desc: 'Toàn Phong Quy ở Nghịch trúng tướng: hồi ngay (6s).' },
      { name: 'Tâm Bão Bất Khả Xâm Phạm', desc: 'Ở Bão Hòa: miễn nhiễm đẩy lùi và giảm 15% sát thương nhận.' },
    ],
    [
      { name: 'Tuyệt Ảnh Ám Sát', desc: 'Khóa thước gió ở Nghịch vĩnh viễn (luôn +sát thương, Bát Diện luôn đâm sau lưng); mất Nghịch Chuyển Canh Khí.' },
      { name: 'Long Quyển Phong Bạo', desc: 'Cơn Gió Đưa Giấc thêm vòi rồng ở tâm: hất tung 1.5s kẻ dưới 60% máu.' },
      { name: 'Lời Ru Vĩnh Cửu', desc: 'Hạ gục tướng vừa ngủ trong 3s: hồi chiêu S4 giảm một nửa.' },
    ],
  ];
})();
