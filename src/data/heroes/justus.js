'use strict';
// ===== Justus — Đại Giáo Trưởng • pháp sư hỗ trợ / hộ vệ trận địa • Đức Tin (thay mana) • phép =====
// Bản tài liệu bổ sung: Tam Kiếm Trừng Phạt • Thánh Quang Hộ Thể • Tia Phán Quyết Liên Tục • Trận Địa Thanh Tẩy Vạn Năng.
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  function faith(u, v) { u.ws.faith = Math.max(0, Math.min(100, u.ws.faith + v)); }
  function spendF(u, v) { if (u.ws.faith < v) return false; u.ws.faith -= v; return true; }
  const allies = (m, u, R) => H.friendsNear(m, u, R, true);
  const willCd = (u) => (H.T(u, '6c') ? 45 : 60);
  function refund(m, u) { if (H.ready(m, u, 'jfb', 1.5)) faith(u, 10); }
  H.def({
    id: 'justus', name: 'Justus', color: '#f0d27a', gfx: 'tome', kit: 'mage', pos: ['sup', 'mid'], dmgType: 'magic',
    ranged: true, projSpeed: 22, projKind: 'star', r: 0.58, resource: 'none',
    stats: { range: 5.0, hp: 570, hpG: 88, armor: 28, armorG: 3.8, mr: 32, mrG: 2.0, ms: 3.35 },
    gauge: (u) => ({ v: u.ws.faith || 0, max: 100, label: 'Đức Tin', color: '#ffe08a' }),
    passive: {
      name: 'Đức Tin Cứu Rỗi • Ý Chí Kiên Định • Hộ Vệ Thánh Đình',
      desc: 'Chiêu tốn Đức Tin (100, tự hồi 2.5/giây ngoài giao tranh, 1/giây trong giao tranh); giáp ảo của Justus bị vỡ, được hồi máu hay ban giáp mới: +10 Đức Tin (mỗi 1.5s). Ý Chí Kiên Định (60s): chặn trọn chiêu đầu tiên của tướng địch, rồi tỏa sóng làm chậm 40% trong 4.5 đv 2s. Hộ Vệ Thánh Đình (100s): dưới 25% máu, Thiên Sứ gánh đòn thay (35% máu tối đa của Justus, Justus không thể chết khi Thiên Sứ còn), +50 Đức Tin.',
      init(m, u) { u.ws.faith = 100; u.ws.willT = 0; u.ws.angelT = 0; },
      update(m, u) {
        if (m.tick % 10 !== 0) return;
        const fight = m.time - (u.lastDmgT || -99) < 4 || m.time - (u.lastAtkT || -99) < 4;
        faith(u, (fight ? 1 : 2.5) * (H.T(u, '1a') ? 1.35 : 1) * 0.5);
        const full = u.ws.faith >= 100 && H.T(u, '9a');
        if (full && !u.hasKey('jus_full')) m.addStatus(u, 'reduce', 9999, 0.2, { key: 'jus_full' }); else if (!full && u.hasKey('jus_full')) m.removeStatus(u, 'reduce', 'jus_full');
        // Hộ Vệ Thánh Đình
        if (u.hpPct < 0.25 && m.time >= u.ws.angelT && m.time - (u.lastDmgT || -99) < 1.5) {
          u.ws.angelT = m.time + (H.T(u, '12b') ? 50 : 100);
          const s = m.addStatus(u, 'shield', 6, u.st.maxHp * 0.35 / 1.25, { key: 'jus_angel', src: u });
          m.addStatus(u, 'undying', 6, 1, { key: 'jus_angel' });
          u.ws.angel = s; faith(u, 50);
          if (H.T(u, '6b')) m.hitCircle(u, u.x, u.y, 4, (e) => { const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 4, 0.3); }, { color: '#fff4c0' });
          if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '👼 Thiên Sứ Hộ Vệ', color: '#fff4c0' });
        }
        if (u.ws.angel) {
          const s = u.ws.angel;
          if (s.v <= 1 || s.t <= 0.1) { if (s.v > 1 && H.T(u, '9b')) m.heal(u, u, s.v * 0.5); u.ws.angel = null; m.removeStatus(u, 'undying', 'jus_angel'); }
        }
      },
      onTake(m, u, att, info) {
        const a = att && (G.ownerOf ? G.ownerOf(att) : att);
        if (!a || a.team === u.team || a.kind !== 'hero' || !G.ITEM_IS_SKILL(info)) return;
        if (m.time < u.ws.willT) return;
        u.ws.willT = m.time + willCd(u); info.amt = 0; u.istate.blockT = m.time + 0.25;
        const R = H.T(u, '1b') ? 6 : 4.5;
        m.later(0, (mm) => mm.hitCircle(u, u.x, u.y, R, (e) => mm.addStatus(e, 'slow', 2, 0.4, { src: u }), { color: '#ffe08a' }));
        if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '✝ Ý Chí Kiên Định', color: '#ffe08a' });
      },
      afterTake(m, u) { if (u.ws.angel && u.ws.angel.v <= 1) refund(m, u); },
      onAuto(m, u, t) { if (H.T(u, '1c') && t.kind === 'hero') faith(u, 2); },
    },
    skills: {
      s1: {
        name: 'Tam Kiếm Trừng Phạt', desc: 'Không có thời gian niệm (vừa chạy vừa dùng). Tốn 20 Đức Tin: đánh dấu vòng đỏ bán kính 1.6 đv lên 3 tướng địch gần nhất trong 8 đv; sau 0.25s ba thanh kiếm thánh cắm xuống: sát thương phép và choáng 1s.',
        cd: [9, 8.5, 8, 7.5, 7],
        can(m, u) { return u.ws.faith >= 20 && m.enemiesIn(u.team, u.x, u.y, 8, { heroesOnly: true }).length > 0; },
        use(m, u, ctx) {
          if (!spendF(u, 20)) return;
          const dmg = H.amt(u, ctx.v([70, 105, 140, 175, 210]), 0, 0.6), delay = H.T(u, '3a') ? 0.15 : 0.25;
          const tg = m.enemiesIn(u.team, u.x, u.y, 8, { heroesOnly: true }).filter((e) => e.vis[u.team]).sort((a, b) => M.dist(a, u) - M.dist(b, u) || a.id - b.id).slice(0, 3);
          for (const e of tg) {
            const p = { x: e.x, y: e.y };
            m.telegraph({ x: p.x, y: p.y, r: 1.6, life: delay, team: u.team });
            m.later(delay, (mm) => mm.hitCircle(u, p.x, p.y, 1.6, (x) => { mm.damage(u, x, dmg, 'magic', { tag: 's1' }); mm.addStatus(x, 'stun', 1, 1, { src: u }); }, { color: '#ffe08a' }));
          }
        },
        ai: { use: 'cc', range: 8, aim: 'self' },
      },
      s2: {
        name: 'Thánh Quang Hộ Thể', desc: 'Tốn 25 Đức Tin: Justus và đồng minh trong 6 đv nhận Giáp Ảo = 20% máu tối đa trong 4s và được thanh tẩy mọi khống chế, hiệu ứng xấu, vết thương sâu. Giáp bị phá trước khi hết giờ: hoàn 25 Đức Tin.',
        cd: [12, 11, 10, 9, 8.5],
        can(m, u) { return u.ws.faith >= 25; },
        use(m, u) {
          if (!spendF(u, 25)) return;
          for (const a of allies(m, u, 6)) {
            m.cleanse(a); m.removeStatus(a, 'wound'); m.removeStatus(a, 'dot');
            const s = m.shield(u, a, a.st.maxHp * 0.2 * (a !== u && H.T(u, '3b') ? 1.3 : 1), 4);
            if (s && a === u) (u.ws.myShields || (u.ws.myShields = [])).push(s);
          }
          refund(m, u);
          m.later(0.1, (mm) => { const L = u.ws.myShields || []; u.ws.myShields = []; for (const s of L) mm.later(3.8, () => { if (s.v <= 1) faith(u, 25); }); });
          if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: 6, color: '#ffe08a' });
        },
        ai: { use: 'custom', aim: 'self', pick: (m, u) => {
          const cc = u.statuses.some((s) => s.type === 'stun' || s.type === 'root' || s.type === 'silence' || s.type === 'slow' || s.type === 'charm');
          const hurt = allies(m, u, 6).some((a) => (a.hpPct < 0.5 && m.time - (a.lastDmgT || -99) < 1.5) || (a !== u && a.disabled));
          return cc || hurt ? { pt: { x: u.x, y: u.y } } : null;
        } },
        whileDisabled: true,
      },
      s3: {
        name: 'Tia Phán Quyết Liên Tục', desc: 'Chiếu tia laser thánh dài 10 đv (khởi đầu 10 Đức Tin, +6 mỗi giây duy trì, tối đa 4s): vừa chiếu vừa đi chậm (−30%); bị choáng / hóa đá là ngắt. Mỗi 0.5s trúng tướng: sát thương +15% (tối đa +60%). Mỗi giây trúng: Ý Chí Kiên Định hồi nhanh 0.25s × số tướng trúng.',
        cd: [6, 5.5, 5, 4.5, 4],
        can(m, u) { return u.ws.faith >= 10; },
        use(m, u, ctx) {
          if (!spendF(u, 10)) return;
          const base = H.amt(u, ctx.v([20, 30, 40, 50, 60]), 0, 0.18);
          let ramp = 0, t0 = m.time, tgt = ctx.tgt && ctx.tgt.kind === 'hero' ? ctx.tgt : null;
          m.addStatus(u, 'slow', 4, 0.3, { key: 'jus_beam' });
          const z = m.zone({ owner: u, x: u.x, y: u.y, r: 10, life: 4, every: 0.25, follow: u, kind: 'beam',
            tick: (mm, zz) => {
              if (!u.alive || u.disabled || u.ws.faith < 1.5) { zz.life = 0; zz.dead = true; mm.removeStatus(u, 'slow', 'jus_beam'); return; }
              faith(u, -1.5);
              const t = tgt && tgt.alive && M.dist(u, tgt) < 10.5 ? tgt : (u.ai && u.ai.target && u.ai.target.alive ? u.ai.target : null);
              if (!t || M.dist(u, t) > 10.5) return;
              const v = H.dirTo(u, t); u.face(t.x, t.y);
              let n = 0;
              mm.hitLine(u, u.x, u.y, v.x, v.y, 10, 0.9, (e) => {
                mm.damage(u, e, base * (1 + ramp), 'magic', { tag: 's3', byp: H.T(u, '6a') ? 0.5 : 0 }); if (e.kind === 'hero') n++;
              }, { noFx: true });
              if (n && mm.time - t0 >= 0.5) { ramp = Math.min(0.6, ramp + 0.15); t0 = mm.time; u.ws.willT -= 0.125 * n; }
              if (mm.fxOn) mm.fx({ type: 'line', x: u.x, y: u.y, x2: u.x + v.x * 10, y2: u.y + v.y * 10, w: 0.5, color: '#fff4a0', team: u.team });
            } });
          void z;
        },
        ai: { use: 'poke', range: 9.5, aim: 'unit' },
      },
      s4: {
        name: 'Trận Địa Thanh Tẩy Vạn Năng', desc: 'Tốn 40 Đức Tin: cắm Kinh Thánh mở Pháp Trận bán kính 9 đv trong 6s. Kẻ địch trong trận bị thiêu mỗi 0.5s (mỗi nhịp +2 Đức Tin), mất 40% Kháng Phép và 30 Hộ Giáp mỗi giây. Mỗi 1.5s cấp Giáp Ảo 8% máu tối đa cho Justus và đồng minh trong trận, thanh tẩy làm chậm.',
        cd: [90, 75, 60],
        can(m, u) { return u.ws.faith >= 40; },
        use(m, u, ctx) {
          if (!spendF(u, 40)) return;
          const x = u.x, y = u.y, life = H.T(u, '12a') ? 9 : 6, dmg = H.amt(u, ctx.v([40, 60, 80]), 0, 0.2);
          let k = 0;
          if (H.T(u, '12a')) m.hitCircle(u, x, y, 9, (e) => m.addStatus(e, 'silence', 1.5, 1, { src: u }));
          m.zone({ owner: u, x, y, r: 9, life, every: 0.5, kind: 'sanctum', tick: (mm, z) => {
            k++;
            mm.hitCircle(u, x, y, 9, (e) => {
              mm.damage(u, e, dmg, 'magic', { tag: 's4', aoe: true }); faith(u, 2);
              mm.addStatus(e, 'buff', 0.6, 1, { key: 'jus_sanct', mods: { mrPct: -0.4, asPct: H.T(u, '9c') ? -0.4 : 0 } });
              if (H.T(u, '9c')) mm.addStatus(e, 'nodash', 0.6, 1, { src: u });
              if (e.ga > 0) e.ga = Math.max(0, e.ga - 15);
            }, { noFx: true });
            if (k % 3 === 0) for (const a of allies(mm, u, 30)) if (M.dist(a, z) <= 9) { mm.shield(u, a, a.st.maxHp * 0.08, 1.6); mm.removeStatus(a, 'slow'); if (H.T(u, '3c') && a !== u) mm.addStatus(a, 'haste', 1.6, 0.25, { key: 'jus_field' }); }
          } });
          if (m.fxOn) m.fx({ type: 'ring', x, y, r: 9, color: '#ffe08a', life });
        },
        ai: { use: 'ult', aim: 'self', range: 7, aoe: 8 },
      },
    },
    ai: { order: ['s1', 's3', 's2'], engageRange: 7, role: 'support' },
    tags: ['cc', 'shield'],
  });
  G.HEROES.justus.tree = [
    [
      { name: 'Tâm Niệm Thuần Khiết', desc: 'Đức Tin tự hồi nhanh hơn 35%.' },
      { name: 'Ý Chí Cương Nhu', desc: 'Sóng làm chậm của Ý Chí rộng 6 đv.' },
      { name: 'Đòn Đánh Cổ Ngữ', desc: 'Đánh thường trúng tướng hồi 2 Đức Tin.' },
    ],
    [
      { name: 'Kiếm Thánh Rơi Nhanh', desc: 'Tam Kiếm rơi sau 0.15s.' },
      { name: 'Hộ Thể Cường Hóa', desc: 'Giáp của Thánh Quang Hộ Thể cho đồng minh +30%.' },
      { name: 'Quang Trận Tiếp Tốc', desc: 'Đồng minh trong Pháp Trận +25% tốc chạy.' },
    ],
    [
      { name: 'Tia Laser Xuyên Thấu', desc: 'Tia Phán Quyết bỏ qua 50% Hộ Giáp.' },
      { name: 'Hộ Vệ Bất Khuất', desc: 'Thiên Sứ xuất hiện hất văng mọi kẻ địch áp sát 4 đv.' },
      { name: 'Lời Cầu Nguyện Vô Tận', desc: 'Ý Chí Kiên Định hồi 45s.' },
    ],
    [
      { name: 'Đức Tin Bất Hoại', desc: 'Đầy 100 Đức Tin: giảm 20% sát thương nhận.' },
      { name: 'Hộ Vệ Hồi Sinh', desc: 'Thiên Sứ hết giờ mà chưa vỡ: 50% máu còn lại hồi cho Justus.' },
      { name: 'Trận Địa Giam Cầm', desc: 'Kẻ địch trong Pháp Trận −40% tốc đánh, không thể lướt / dây móc.' },
    ],
    [
      { name: 'Giáo Hoàng Thánh Đình', desc: 'Phong cách: Pháp Trận 9s, câm lặng kẻ địch bên trong 1.5s đầu.' },
      { name: 'Vô Tận Hộ Thần', desc: 'Phong cách: Hộ Vệ Thánh Đình hồi 50s.' },
      { name: 'Giáo Lý Vững Bền', desc: '+20 Giáp và Kháng Phép.', stats: { armor: 20, mr: 20 } },
    ],
  ];
})();
