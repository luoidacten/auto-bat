'use strict';
// ===== Boran — Cuồng Nộ Băng Cổ • đấu sĩ càn quét • Nộ Khí Băng Giá (0–100) • vật lý =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  function fury(m, u, v) { u.ws.fury = Math.max(0, Math.min(100, u.ws.fury + v)); u.ws.furyT = m.time; }
  const juggernaut = (m, u) => u.ws.jugUntil > m.time;
  H.def({
    id: 'boran', name: 'Boran', color: '#8ad8ff', gfx: 'axes', kit: 'fighter', pos: ['top', 'jungle'], dmgType: 'phys',
    ranged: false, r: 0.64, resource: 'none', zoneRed: 0.3,
    stats: { hp: 600, hpG: 94, ad: 62, adG: 3.8, armor: 31, armorG: 3.8, as: 0.7, asG: 0.025, ms: 3.55, range: 1.6 },
    gauge: (u) => ({ v: u.ws.fury || 0, max: 100, label: 'Nộ Khí', color: '#8ad8ff' }),
    passive: {
      name: 'Huyết Mạch Băng Cổ • Thể Trọng Băng Hóa',
      desc: 'Chém trúng +8 Nộ Khí, nhận sát thương +4; tụt dần sau 5s ngoài giao tranh. Mỗi 10 Nộ: +2.5% tốc đánh, +1.5% tốc chạy. 100 Nộ (Thấu Cốt): đòn đánh thêm 15% sát thương chuẩn, hút máu 15%. Giảm 30% sát thương bo. Hộ Giáp vỡ: Kiên Cường (không thể bị hất tung / cản phá) 2.5s (40s).',
      init(m, u) { u.ws.fury = 0; u.ws.furyT = 0; u.ws.jugUntil = 0; },
      update(m, u) {
        // Cắt Đứt Tẩu Thoát: kẻ dính rìu mà lướt / dây móc bị kéo ngược lại
        if (H.T(u, '9a')) for (const e of m.heroes) if (e.alive && e.ws.boranAxeT > m.time && e.dash && !e.dash.cc) { e.dash = null; e.ws.boranAxeT = 0; m.damage(u, e, 300, 'true', { tag: 's1' }); if (m.fxOn) m.fx({ type: 'chain', a: u.id, b: e.id, life: 0.4 }); }
        if (m.tick % 10 !== 0) return;
        if (m.time - u.ws.furyT > 5 && u.ws.fury > 0 && !(H.T(u, '9b') && !m.inZone(u, 0))) u.ws.fury = Math.max(0, u.ws.fury - 5);
        if (H.T(u, '9b') && !m.inZone(u, 0)) u.ws.fury = 100;
        const k = Math.floor(u.ws.fury / 10), full = u.ws.fury >= 100, s = u.hasKey('boran_fury');
        if (!s || s.n !== k * 10 + (full ? 1 : 0)) {
          m.removeStatus(u, 'buff', 'boran_fury');
          if (k) { const st = m.addStatus(u, 'buff', 9999, 1, { key: 'boran_fury', mods: { asPct: 0.025 * k, msPct: 0.015 * k, lifesteal: full ? (H.T(u, '9c') ? 0.3 : 0.15) : 0, bypass: full && H.T(u, '6a') ? 0.3 : 0 } }); if (st) st.n = k * 10 + (full ? 1 : 0); }
        }
        if (H.T(u, '1a')) { const e = m.heroes.find((h) => h.alive && h !== u && h.hpPct < 0.5 && M.dist(h, u) < 30 && h.vis[u.team]); if (e) m.addStatus(u, 'haste', 0.6, 0.15, { key: 'boran_hunt' }); }
      },
      onAuto(m, u, t, info) {
        fury(m, u, H.T(u, '3c') ? 16 : 8);
        if (u.ws.fury >= 100) { const tr = info.amt * 0.15; info.extra.push(() => m.damage(u, t, tr, 'true', { tag: 'p' })); }
      },
      afterTake(m, u, att) { if (att && att.team !== u.team) fury(m, u, 4); },
      onGaBreak(m, u) { if (H.ready(m, u, 'husk', 40)) m.addStatus(u, 'unstop', 2.5, 1, { key: 'boran_husk' }); },
      onDeal(m, u, t, info) { if (juggernaut(m, u) && (info.auto || G.ITEM_IS_SKILL(info))) info.byp = Math.max(info.byp || 0, 0.4); },
      onKill(m, u, v) { if (v.kind === 'hero' && juggernaut(m, u)) { u.ws.jugUntil += 4; u.hp = u.st.maxHp; if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🩸 Cuồng Huyết!', color: '#ff5a5a' }); } },
      onFatal(m, u) {
        if (!H.T(u, '12b') || !juggernaut(m, u) || !H.ready(m, u, 'lastrage', 90)) return false;
        u.hp = 1; m.addStatus(u, 'invuln', 4, 1, { key: 'boran_last' }); u.ws.lastRage = { until: m.time + 4, by: u.lastAtt };
        if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '❄ Cơn Thịnh Nộ Cuối Cùng', color: '#8ad8ff' });
        return true;
      },
    },
    skills: {
      s1: {
        name: 'Song Rìu Phi Phao', desc: 'Ném liên tiếp 2 rìu bay thẳng 12 đv: rìu 1 gây sát thương vật lý và làm chậm 40% 2s; rìu 2 trúng cùng mục tiêu thì choáng 1s. Trong 2.5s dùng lại: giật xích kéo thân mình bay tới nạn nhân, tung cú đạp gây sát thương và nhặt rìu (hồi 3s hồi chiêu).',
        cd: [9, 8.5, 8, 7.5, 7.5], castTime: 0.1,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([55, 85, 115, 145, 175]), 0.6), sp = 24 * (H.T(u, '1b') ? 1.35 : 1);
          let first = null;
          const throwAxe = (mm, n) => H.shoot(mm, u, ctx.pt, { speed: sp, range: 12, r: 0.45, kind: 'axe', onHit: (m3, p, e) => {
            m3.damage(u, e, dmg * (n === 1 ? 1 : 0.6), 'phys', { tag: 's1' }); fury(m3, u, 15);
            if (n === 1) { first = e; m3.addStatus(e, 'slow', 2, 0.4, { src: u }); if (H.T(u, '9a') && e.kind === 'hero') e.ws.boranAxeT = m3.time + 2.5; }
            else if (first === e) m3.addStatus(e, 'stun', 1, 1, { src: u });
            if (n === 1) m3.allowRecast(u, 's1', 2.5, (m4, u4) => {
              if (!e.alive) return;
              const v = H.dirTo(e, u4), R = e.r + u4.r + 0.3;
              m4.dashTo(u4, e.x + v.x * R, e.y + v.y * R, 26, { onEnd: (m5) => {
                if (!e.alive) return;
                m5.damage(u4, e, dmg * 0.8, 'phys', { tag: 's1' }); u4.cd.s1 = Math.max(0, (u4.cd.s1 || 0) - 3);
                if (H.T(u4, '6b')) m5.shield(u4, u4, u4.st.maxHp * 0.15, 4);
              } });
            });
          } });
          throwAxe(m, 1); m.later(0.15, (mm) => u.alive && throwAxe(mm, 2));
        },
        ai: { use: 'engage', range: 11, aim: 'point', speed: 24, skillshot: true, recastWhen: (m, u, t) => !!t },
      },
      s2: {
        name: 'Cuồng Phong Băng Trảm', desc: 'Xoay song rìu 360° liên tục 2s (vừa xoay vừa chạy, +15% tốc chạy): 6 nhịp chém vật lý mọi kẻ địch trong 3.5 đv, mỗi nhịp gọt 8% Hộ Giáp (tối đa 48%). Đang xoay miễn làm chậm.',
        cd: [11, 10, 9, 8, 8],
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([22, 32, 42, 52, 62]), 0.28), R = H.T(u, '3a') ? 4.8 : 3.5;
          m.addStatus(u, 'haste', 2, 0.15, { key: 'boran_spin' });
          m.zone({ owner: u, x: u.x, y: u.y, r: R, life: 2, every: 1 / 3, follow: u, kind: 'spin', tick: (mm) => {
            mm.removeStatus(u, 'slow');
            mm.hitCircle(u, u.x, u.y, R, (e) => {
              mm.damage(u, e, dmg, 'phys', { tag: 's2', aoe: true }); fury(mm, u, 5);
              if (e.ga > 0) e.ga *= 0.92;
              if (H.T(u, '6c')) u.cd.s3 = Math.max(0, (u.cd.s3 || 0) - 0.5);
            }, { color: '#8ad8ff' });
          } });
        },
        ai: { use: 'burst', range: 3.2, aim: 'self' },
      },
      s3: {
        name: 'Tuyết Lở Áp Sát', desc: 'Gầm lên nhảy vọt tới điểm cách tối đa 9 đv (vòng cảnh báo đỏ 0.55s): dậm nổ gây sát thương vật lý nặng, hất tung 0.75s mọi mục tiêu trong 3 đv và để lại băng trơn 3s (kẻ địch −35% tốc chạy).',
        cd: [12, 11, 10, 9.5, 9.5],
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 9, true), dmg = H.amt(u, ctx.v([80, 120, 160, 200, 240]), 0.8);
          m.telegraph({ x: p.x, y: p.y, r: 3, life: 0.55, team: u.team });
          m.dashTo(u, p.x, p.y, 9 / 0.55, { unstop: true, wall: true, onEnd: (mm) => {
            mm.hitCircle(u, p.x, p.y, 3, (e) => { mm.damage(u, e, dmg, 'phys', { tag: 's3', aoe: true }); mm.knockup(u, e, 0.75); fury(mm, u, 20); if (H.T(u, '3b')) mm.addStatus(e, 'nodash', 2, 1, { src: u }); }, { color: '#8ad8ff' });
            mm.zone({ owner: u, x: p.x, y: p.y, r: 3, life: 3, every: 0.25, kind: 'ice', tick: (m3, z) => m3.hitCircle(u, z.x, z.y, z.r, (e) => m3.addStatus(e, 'slow', 0.4, 0.35, { src: u, key: 'boran_ice' }), { noFx: true }) });
          } });
        },
        ai: { use: 'engage', range: 9, aim: 'point', speed: 0, delay: 0.55 },
      },
      s4: {
        name: 'Thức Tỉnh Cổ Thần: Băng Ma Thao Túng', desc: 'Cần ít nhất 50 Nộ Khí (tiêu sạch): hóa dã thú cổ đại 10s — miễn khống chế cứng, mọi đòn đánh và chiêu thêm 40% xuyên Hộ Giáp; hạ gục / hỗ trợ hạ gục tướng: +4s và hồi đầy máu.',
        cd: [85, 70, 55],
        can(m, u) { return u.ws.fury >= 50; },
        use(m, u) {
          u.ws.fury = 0; u.ws.jugUntil = m.time + 10;
          m.addStatus(u, 'unstop', 10, 1, { key: 'boran_jug' });
          m.addStatus(u, 'buff', 10, 1, { key: 'boran_jug', mods: { adPct: 0.2, armor: 30, mr: 30 } });
          m.hitCircle(u, u.x, u.y, 3.5, (e) => m.damage(u, e, H.amt(u, 120 + 20 * u.level, 0.6), 'phys', { tag: 's4', aoe: true }), { color: '#8ad8ff' });
          if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '❄ BĂNG MA THỨC TỈNH', color: '#8ad8ff' });
        },
        ai: { use: 'custom', aim: 'self', pick: (m, u, t) => (t && t.kind === 'hero' && M.dist(u, t) < 6 && (u.hpPct < 0.4 || t.hpPct < 0.6) ? { pt: { x: u.x, y: u.y } } : null) },
      },
    },
    ai: { order: ['s1', 's3', 's2'], engageRange: 12, role: 'fighter' },
    tags: ['dive', 'engage'],
  });
  G.HEROES.boran.tree = [
    [
      { name: 'Săn Mồi Đói Khát', desc: '+15% tốc chạy khi thấy kẻ địch dưới 50% máu trong 30 đv.' },
      { name: 'Rìu Cắt Gió', desc: 'Rìu bay nhanh hơn 35%.' },
      { name: 'Băng Thể Tráng Kiện', desc: '+250 máu tối đa.', stats: { hp: 250 } },
    ],
    [
      { name: 'Lưỡi Rìu Mở Rộng', desc: 'Cuồng Phong Băng Trảm rộng 4.8 đv.' },
      { name: 'Băng Gai Ghìm Chân', desc: 'Kẻ dính cú dậm bị cấm dây móc / lướt 2s.' },
      { name: 'Nộ Khí Dâng Trào', desc: 'Chém trúng +16 Nộ Khí.' },
    ],
    [
      { name: 'Xuyên Thủng Tàn Bạo', desc: '100 Nộ Khí: +30% xuyên Hộ Giáp.' },
      { name: 'Băng Khôi Tái Tạo', desc: 'Đu tới bằng Song Rìu: giáp ảo 15% máu tối đa 4s.' },
      { name: 'Đồ Tể Nhịp Nhanh', desc: 'Mỗi nhịp chém của Cuồng Phong giảm 0.5s hồi chiêu Tuyết Lở.' },
    ],
    [
      { name: 'Cắt Đứt Tẩu Thoát', desc: 'Kẻ dính Song Rìu mà lướt / dây móc thì bị kéo ngược và nhận 300 sát thương chuẩn.' },
      { name: 'Trái Tim Băng Hà', desc: 'Kháng thêm 40% sát thương bo; ngoài bo luôn đầy Nộ Khí.', stats: { zoneRed: 0.4 } },
      { name: 'Khát Máu Vô Tận', desc: 'Thấu Cốt hút máu 30%.' },
    ],
    [
      { name: 'Cỗ Máy Xay Thịt', desc: 'Phong cách: Cuồng Phong hồi nhanh hơn 50%.', onSkill(m, u, k) { if (k === 's2' && u.cd.s2 > 0) u.cd.s2 *= 0.5; } },
      { name: 'Cổ Ma Bất Tử', desc: 'Phong cách: đang Băng Ma mà nhận đòn kết liễu → bất tử 4s.' },
      { name: 'Thân Băng Ngàn Năm', desc: '+25 Giáp, +25 Kháng Phép.', stats: { armor: 25, mr: 25 } },
    ],
  ];
})();
