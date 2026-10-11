'use strict';
// ===== Ratok — Đao Phủ Rỉ Sét • đỡ đòn / tiên phong mở giao tranh • mana • vật lý =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const bludgeonCd = (u) => (H.T(u, '3c') ? 8 : 12);
  const hooked = (m, u) => (u.ws.hook && u.ws.hook.e.alive && u.ws.hook.until > m.time ? u.ws.hook.e : null);
  H.def({
    id: 'ratok', name: 'Ratok', color: '#a0582a', gfx: 'hookchain', kit: 'tank', pos: ['sup', 'top'], dmgType: 'phys',
    ranged: false, r: 0.66, resource: 'mana',
    stats: { range: 1.8, hp: 660, hpG: 100, ms: 3.4 },
    passive: {
      name: 'Ràng Buộc Thép • Thiết Phá',
      desc: '+12 Giáp và +12 Kháng Phép với mỗi tướng địch trong 4 đv; từ 3 tướng địch trở lên: +25% kháng hiệu ứng. Mỗi 12s đòn đánh kế tiếp được cường hóa: thêm 6% máu tối đa sát thương vật lý và choáng 0.75s; mỗi đòn đánh trúng giảm 1s hồi chiêu nội tại này.',
      init(m, u) { u.ws.bludT = 0; u.ws.hook = null; },
      update(m, u) {
        if (m.tick % 5 !== 0) return;
        const n = m.enemiesIn(u.team, u.x, u.y, 4, { heroesOnly: true }).length, per = H.T(u, '1b') ? 17 : 12;
        const s = u.hasKey('ratok_chain');
        if (!s || s.n !== n) { m.removeStatus(u, 'buff', 'ratok_chain'); if (n) { const st = m.addStatus(u, 'buff', 9999, 1, { key: 'ratok_chain', mods: { armor: per * n, mr: per * n, tenacity: n >= 3 ? 0.25 : 0 } }); if (st) st.n = n; } }
        // Bước Chân Thợ Săn: +20% tốc chạy về phía kẻ bị móc
        const e = hooked(m, u); if (e && H.T(u, '1c')) m.addStatus(u, 'haste', 0.3, 0.2, { key: 'ratok_hunt' });
        // Bền Bỉ Vô Song
        if (H.T(u, '9c') && u.hpPct < 0.3 && H.ready(m, u, 'endure', 60)) { m.cleanse(u); m.addStatus(u, 'regen', 4, (u.st.maxHp - u.hp) * 0.05, { key: 'ratok_endure' }); }
      },
      onAuto(m, u, t, info) {
        if (t.kind === 'hero' && H.T(u, '1a')) u.cd.s1 = Math.max(0, (u.cd.s1 || 0) - 1.5);
        if (m.time >= u.ws.bludT) {
          u.ws.bludT = m.time + bludgeonCd(u);
          info.amt += u.st.maxHp * 0.06;
          info.extra.push(() => m.addStatus(t, 'stun', 0.75, 1, { src: u }));
          if (m.fxOn) m.fx({ type: 'boom', x: t.x, y: t.y, color: '#a0582a' });
        } else u.ws.bludT -= 1;
      },
    },
    skills: {
      s1: {
        name: 'Móc Sắt Rỉ Sét', desc: 'Phóng móc xích 8.5 đv: trúng kẻ đầu tiên gây sát thương vật lý và móc chặt 1s (kẻ bị móc không đi xa hơn được). Dùng lại trong lúc móc: giật mạnh kéo nạn nhân bay về sát Ratok, thêm sát thương và làm chậm 30% 1.5s.',
        cd: [14, 13, 12, 11, 11], cost: [70, 70, 70, 70, 70], castTime: 0.2,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0.6), keep = H.T(u, '3a') ? 1.5 : 1, R = H.T(u, '12a') ? 12 : 8.5;
          H.shoot(m, u, ctx.pt, { speed: 24, range: R, r: 0.5, kind: 'hook', onHit: (mm, p, e) => {
            mm.damage(u, e, dmg, 'phys', { tag: 's1' });
            const lim = M.dist(u, e) + 0.3;
            u.ws.hook = { e, until: mm.time + keep };
            mm.zone({ owner: u, x: u.x, y: u.y, r: 1, life: keep, every: 0.05, kind: 'tether', tick: (m3) => {
              if (!e.alive || !u.alive || !u.ws.hook || u.ws.hook.e !== e) return;
              const d = M.dist(u, e); if (d > lim) { const v = H.dirTo(u, e); e.x = u.x + v.x * lim; e.y = u.y + v.y * lim; if (e.dash && !e.dash.cc) e.dash = null; }
            } });
            if (mm.fxOn) mm.fx({ type: 'chain', a: u.id, b: e.id, life: keep });
            mm.allowRecast(u, 's1', keep, (m3, u3) => {
              if (!e.alive) return;
              u3.ws.hook = null;
              const d = M.dist(u3, e) - u3.r - e.r - 0.4, v = H.dirTo(e, u3);
              if (d > 0.2) m3.knock(u3, e, v.x, v.y, d, 0.3);
              m3.damage(u3, e, dmg * 0.6, 'phys', { tag: 's1' }); m3.addStatus(e, 'slow', 1.5, 0.3, { src: u3 });
              if (H.T(u3, '12a') && e.kind === 'hero') m3.addStatus(e, 'nodash', 2, 1, { src: u3 });
              if (H.T(u3, '9a') && e.kind === 'hero') u3.cd.s1 *= 0.5;
            });
          } });
        },
        ai: { use: 'engage', range: 8.2, aim: 'point', speed: 24, skillshot: true, heroOnly: true,
          cond: (m, u, t) => !(t.decoy && m.rngAI.next() < 0.6),
          recastWhen: (m, u, t) => !!(t && t.kind === 'hero' && (u.ranks.s2 === 0 || (u.cd.s2 || 0) > 0.5)) },
      },
      s2: {
        name: 'Bộc Phá Húc', desc: 'Lao 3.5 đv húc văng kẻ đầu tiên: sát thương vật lý, choáng 0.75s. Nếu có kẻ đang dính Móc Sắt: thành Đột Kích Điểm Nổ — co xích lao thẳng tới nạn nhân bất kể khoảng cách, dậm nổ choáng 1.25s mọi kẻ địch quanh đó.',
        cd: [10, 9.5, 9, 8.5, 8.5], cost: [50, 50, 50, 50, 50],
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([55, 85, 115, 145, 175]), 0.5), e = hooked(m, u);
          if (H.T(u, '6c')) m.addStatus(u, 'buff', 1, 1, { key: 'ratok_charge', mods: { tenacity: 0.6 } });
          if (e) {
            u.ws.hook = null; u.recast.s1 = null;
            const v = H.dirTo(e, u), R = e.r + u.r + 0.3;
            m.dashTo(u, e.x + v.x * R, e.y + v.y * R, 26, { unstop: true, onEnd: (mm) => {
              mm.hitCircle(u, e.x, e.y, 2.8, (x) => { mm.damage(u, x, dmg * 1.2, 'phys', { tag: 's2', aoe: true }); mm.addStatus(x, 'stun', 1.25, 1, { src: u }); }, { color: '#a0582a' });
              if (H.T(u, '6a')) mm.shield(u, u, u.st.maxHp * 0.15, 3);
            } });
            return;
          }
          let hit = false;
          const p = H.toward(u, ctx.pt, 3.5, false);
          m.dashTo(u, p.x, p.y, 18, { onContact: (mm, uu, x) => { if (hit) return; hit = true; mm.damage(u, x, dmg, 'phys', { tag: 's2' }); mm.addStatus(x, 'stun', 0.75, 1, { src: u }); const v = H.dirTo(u, x); mm.knock(u, x, v.x, v.y, 1.5, 0.2); return 'stop'; } });
        },
        ai: { use: 'engage', range: 4, aim: 'point', speed: 18 },
      },
      s3: {
        name: 'Tử Xích Toàn Phong', desc: 'Vung xích quay tròn bán kính 3 đv: sát thương vật lý, hút mọi kẻ địch trúng chiêu về sát Ratok và ngắt chiêu đang niệm.',
        cd: [9, 8, 7, 6, 6], cost: [60, 60, 60, 60, 60],
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0.5);
          m.hitCircle(u, u.x, u.y, 3, (e) => {
            m.damage(u, e, dmg, 'phys', { tag: 's3', aoe: true });
            const d = M.dist(u, e) - u.r - e.r - 0.3, v = H.dirTo(e, u); if (d > 0.2) m.knock(u, e, v.x, v.y, d, 0.2);
            if (e.cast) m.interrupt(e);
          }, { color: '#a0582a' });
          if (H.T(u, '3b')) { const x = u.x, y = u.y; m.zone({ owner: u, x, y, r: 3, life: 2, every: 0.25, kind: 'oil', tick: (mm, z) => mm.hitCircle(u, x, y, 3, (e) => mm.addStatus(e, 'slow', 0.4, 0.5, { src: u, key: 'ratok_oil' }), { noFx: true }) }); }
        },
        ai: { use: 'cc', range: 3, aim: 'self' },
      },
      s4: {
        name: 'Tàn Phá Thế Giới', desc: 'Quay đại xích rồi cắm móc neo vào điểm cách tối đa 11 đv (cảnh báo đỏ 0.75s), sau đó kéo thân mình bay như đạn pháo tới, dộng sập mặt đất: sát thương vật lý lớn diện rộng và hất tung 1.5s.',
        cd: [100, 85, 70], cost: [100, 100, 100],
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 11, true), dmg = H.amt(u, ctx.v([180, 280, 380]), 0.9) + u.st.maxHp * 0.06, warn = H.T(u, '12b') ? 0.4 : 0.75;
          m.telegraph({ x: p.x, y: p.y, r: 3.5, life: warn, team: u.team });
          m.addStatus(u, 'unstop', warn + 0.6, 1, { key: 'ratok_ult' });
          m.later(warn, (mm) => {
            if (!u.alive) return;
            mm.dashTo(u, p.x, p.y, 30, { unstop: true, wall: true, onEnd: (m3) => {
              let n = 0;
              m3.hitCircle(u, p.x, p.y, 3.5, (e) => { m3.damage(u, e, dmg, 'phys', { tag: 's4', aoe: true }); m3.knockup(u, e, 1.5); if (e.kind === 'hero') n++; if (H.T(u, '9b')) m3.addStatus(e, 'nodash', 3, 1, { src: u }); }, { color: '#ff5a2a' });
              if (H.T(u, '12b') && n >= 2) for (const k of ['s1', 's2', 's3']) u.cd[k] = (u.cd[k] || 0) * 0.5;
              if (m3.fxOn) m3.fx({ type: 'quake', x: p.x, y: p.y, r: 3.5 });
            } });
          });
        },
        ai: { use: 'ult', aim: 'point', speed: 0, range: 10.5, aoe: 3.5 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 8, role: 'tank' },
    tags: ['cc', 'engage', 'hook'],
  });
  G.HEROES.ratok.tree = [
    [
      { name: 'Khí Áp Cống Ngầm', desc: 'Đánh thường trúng tướng giảm 1.5s hồi chiêu Móc Sắt.' },
      { name: 'Bảo Hộ Gai Góc', desc: 'Ràng Buộc Thép +17 Giáp / Kháng Phép mỗi tướng địch (thay vì 12).' },
      { name: 'Bước Chân Thợ Săn', desc: '+20% tốc chạy khi có kẻ đang dính Móc Sắt.' },
    ],
    [
      { name: 'Xích Nặng', desc: 'Giữ xích 1.5s.' },
      { name: 'Dư Chấn Quét Sàn', desc: 'Tử Xích để lại vũng nhớt làm chậm 50% trong 2s.' },
      { name: 'Đập Phá Liên Hoàn', desc: 'Thiết Phá hồi 8s.' },
    ],
    [
      { name: 'Khiên Bộc Phá', desc: 'Đột Kích Điểm Nổ cho giáp ảo 15% máu tối đa 3s.' },
      { name: 'Thịt Dày', desc: '+400 máu tối đa.', stats: { hp: 400 } },
      { name: 'Xuyên Đột', desc: 'Bộc Phá Húc miễn làm chậm.' },
    ],
    [
      { name: 'Móc Đoạt Mệnh', desc: 'Kéo trúng tướng: hoàn 50% hồi chiêu Móc Sắt.' },
      { name: 'Vực Sâu Sụp Đổ', desc: 'Chiêu cuối cấm lướt / dịch chuyển kẻ địch bên trong 3s.' },
      { name: 'Bền Bỉ Vô Song', desc: 'Dưới 30% máu: xóa khống chế và hồi 20% máu đã mất trong 4s (60s).' },
    ],
    [
      { name: 'Đao Phủ Bắt Lẻ', desc: 'Phong cách: Móc Sắt xa 12 đv, kéo trúng cấm lướt / tốc biến 2s.' },
      { name: 'Cỗ Máy Mở Giao Tranh', desc: 'Phong cách: chiêu cuối cảnh báo 0.4s; hất tung ≥2 tướng thì giảm nửa hồi chiêu S1–S3.' },
      { name: 'Xích Neo Ngàn Cân', desc: '+15% kháng hiệu ứng.', stats: { tenacity: 0.15 } },
    ],
  ];
})();
