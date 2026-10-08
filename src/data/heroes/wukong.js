'use strict';
// ===== Wukong — Côn • Đi rừng / Đường trên • đấu sĩ khống chế diện rộng • KHÔNG MANA (Côn Thức) • vật lý =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const MARK = 'wk_mark';
  const SMALL = { arrow: 1, bullet: 1, pellet: 1, note: 1, star: 1, fire: 1, auto: 1, minion: 1, shell: 1 };
  function gain(m, u, v) {
    const before = u.ws.kt;
    u.ws.kt = Math.min(100, u.ws.kt + v);
    // Côn Khí Tự Sinh: chạm mốc 100 → hồi ngay S1–S3 (20s)
    if (H.T(u, '9a') && before < 100 && u.ws.kt >= 100 && H.ready(m, u, 'ckts', 20)) { u.cd.s1 = 0; u.cd.s2 = 0; u.cd.s3 = 0; }
  }
  // mức cường hóa của chiêu sắp dùng (0/1/2) — tiêu Côn Thức
  function empower(m, u) {
    if (u.ws.ult > m.time) return Math.max(1, u.ws.kt >= 100 ? 2 : 1);
    const e = u.ws.kt >= 100 ? 2 : u.ws.kt >= 50 ? 1 : 0;
    u.ws.kt -= e * 50;
    return e;
  }
  function mark(m, u, e, lv) {
    if (!lv || !e.alive || e.kind !== 'hero') return;
    m.addStatus(e, 'mark', 4, 1, { key: MARK, src: u, stack: 'add', max: 2 });
  }
  const reach = (u) => (H.T(u, '1c') ? 1.2 : 1);
  H.def({
    id: 'wukong', name: 'Wukong', color: '#e0a030', gfx: 'pole', kit: 'fighter', pos: ['jungle', 'top'], dmgType: 'phys',
    ranged: false, r: 0.62, resource: 'none',
    stats: { hp: 615, hpG: 97, ad: 65, adG: 3.9, armor: 31, armorG: 4.0, as: 0.68, asG: 0.024, ms: 3.55, range: 2.0 },
    passive: {
      name: 'Côn Thức Vũ',
      desc: 'Côn Thức (0–100) tích khi đánh trúng (+6), bị tướng đánh (+4), chiêu trúng tướng (+8). Đủ 50: chiêu kế tiếp được cường hóa; đủ 100: cường hóa tối đa. Chiêu cường hóa gắn Khí Ấn lên tướng trúng (tối đa 2, 4s).',
      init(m, u) { u.ws.kt = 0; },
      onAuto(m, u) { gain(m, u, H.T(u, '1a') ? 11 : 8); },
      afterDeal(m, u, t, info) { if (t.kind === 'hero' && G.ITEM_IS_SKILL(info) && H.ready(m, u, 'ktsk', 0.5)) gain(m, u, 8); },
      onTake(m, u, att, info) {
        if (att && att.kind === 'hero') gain(m, u, 4);
        // Hộ Thân Kim Cang: lồng chuông chặn 1 đòn
        if (u.ws.bell > m.time && att && att.team !== u.team) {
          u.ws.bell = 0; info.amt = 0;
          if (att.kind === 'hero' && M.dist(u, att) < 4) { const v = H.dirTo(u, att); m.knock(u, att, v.x, v.y, 2, 0.2); }
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffe080', life: 0.4 });
        }
        if (u.ws.ult > m.time && H.T(u, '12c')) info.amt *= 0.7;
      },
    },
    skills: {
      s1: {
        name: 'Toàn Phong Côn', desc: 'Xoay côn 0.5s quanh người (2 nhịp), gạt đạn nhỏ bay tới. Cường hóa: hút kẻ địch vào tâm.',
        cd: [7, 6.5, 6, 5.5, 5], castTime: 0.05,
        use(m, u, ctx) {
          if (H.T(u, '6b')) { u.ws.bell = m.time + 1.5; if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffe080', life: 1.5 }); return; }
          const e = empower(m, u), R = 2.6 * reach(u), dmg = H.amt(u, ctx.v([35, 52, 69, 86, 103]), 0.4);
          const big = H.T(u, '3a');
          for (let i = 0; i < 2; i++) m.later(0.25 * i, (mm) => {
            if (!u.alive) return;
            mm.hitCircle(u, u.x, u.y, R, (x) => {
              mm.damage(u, x, dmg * (1 + 0.25 * e), 'phys', { tag: 's1', aoe: true }); mark(mm, u, x, e);
              if (e) { const v = H.dirTo(x, u), d = M.dist(x, u) - 1.2; if (d > 0.2) mm.knock(u, x, v.x, v.y, Math.min(e === 2 ? 1.6 : 0.9, d), 0.15); }
            }, { color: '#ffd080' });
            for (const p of mm.projs) if (!p.dead && p.team !== u.team && (big || SMALL[p.kind]) && M.dist(p, u) < (big ? 3.2 : 2.2)) p.dead = true;
          });
        },
        ai: { use: 'burst', range: 2.3, aim: 'self', farm: 3 },
      },
      s2: {
        name: 'Trực Thích', desc: 'Thúc côn thẳng 4 đv, đẩy lùi kẻ trúng đầu tiên 2 đv. Cường hóa: dài gấp đôi và xuyên qua mọi kẻ địch.',
        cd: [9, 8.5, 8, 7.5, 7], castTime: 0.15,
        use(m, u, ctx) {
          const e = empower(m, u), v = H.dirTo(u, ctx.pt), L = (e ? 8 : 4) * reach(u), dmg = H.amt(u, ctx.v([70, 105, 140, 175, 210]), 0.8) * (1 + 0.2 * e);
          let first = null;
          const hit = (x) => {
            m.damage(u, x, dmg, 'phys', { tag: 's2' }); mark(m, u, x, e);
            m.knock(u, x, v.x, v.y, 2, 0.2, { onWall: H.T(u, '3c') ? (mm, xx) => mm.addStatus(xx, 'stun', 1.25, 1, { src: u }) : null });
            if (!first && x.kind === 'hero') first = x;
          };
          if (e) m.hitLine(u, u.x, u.y, v.x, v.y, L, 1.2, hit, { color: '#ffd080' });
          else {
            const list = m.enemiesIn(u.team, u.x + v.x * L / 2, u.y + v.y * L / 2, L / 2 + 1).filter((x) => M.segDist(x.x, x.y, u.x, u.y, u.x + v.x * L, u.y + v.y * L) < 0.6 + x.r)
              .sort((a, b) => M.dist2(a, u) - M.dist2(b, u) || a.id - b.id);
            if (list[0]) hit(list[0]);
            if (m.fxOn) m.fx({ type: 'line', x: u.x, y: u.y, x2: u.x + v.x * L, y2: u.y + v.y * L, w: 0.4, color: '#ffd080' });
          }
          // Hoành Tảo Đoạt Mệnh: dùng lại trượt tới quét ngang hất ngã
          if (H.T(u, '6a') && first) m.allowRecast(u, 's2', 2, (mm, uu) => {
            if (!first.alive) return;
            mm.dashTo(uu, first.x, first.y, 20, { onContact: (m3, u3, x) => { if (x !== first) return; m3.damage(u3, x, dmg * 0.5, 'phys', { tag: 's2' }); m3.knockup(u3, x, 1); return 'stop'; } });
          });
        },
        ai: { use: 'poke', range: 3.8, aim: 'point', speed: 0, farm: 3, recastWhen: (m, u, t) => t && t.kind === 'hero' && M.dist(u, t) < 5 },
      },
      s3: {
        name: 'Kình Thiên Trụ', desc: 'Chống gậy bật lên không thể bị chọn 0.8s; trong lúc trên không TỰ CHỌN điểm đáp bất kỳ trong vùng 5 đv quanh chỗ chống gậy (bám theo kẻ địch đang né), 0.3s trước khi bổ xuống mới lộ điểm đáp: hất tung 0.75s bán kính 2.5. Cường hóa: gồng thêm, choáng 1s (tối đa 1.5s) bán kính 3.5.',
        cd: [14, 13, 12, 11, 10], castTime: 0.05,
        use(m, u, ctx) {
          const e = empower(m, u);
          const range = 5 * (H.T(u, '1b') ? 1.25 : 1) + (H.T(u, '6c') ? 2.5 : 0);
          let p = H.toward(u, ctx.pt, range, true);
          const from = { x: u.x, y: u.y }, aim = ctx.tgt && ctx.tgt.alive ? ctx.tgt : (u.ai && u.ai.target);
          const air = 0.8 + (e === 2 ? 0.6 : e ? 0.3 : 0), Rh = e ? 3.5 : 2.5;
          m.addStatus(u, 'untarget', air, 1); m.addStatus(u, 'root', air, 1, { key: 'wk_air' });
          // GĐ9: vùng có thể đáp (cả vòng quanh chỗ chống gậy) — kẻ địch không biết chắc Wukong sẽ bổ xuống đâu
          m.telegraph({ team: u.team, x: from.x, y: from.y, r: range + Rh * 0.5, life: air - 0.3, color: '#e0b060' });
          // 0.3s trước khi đáp: chọn điểm đáp — bám kẻ địch (mục tiêu đang nhắm, không thì kẻ gần điểm cũ nhất) còn trong vùng
          m.later(Math.max(0.05, air - 0.3), (mm) => {
            if (!u.alive) return;
            let t = aim && aim.alive && aim.team !== u.team && M.dist(aim, from) <= range + Rh ? aim : null;
            if (!t) { let bd = range + Rh; for (const h of mm.heroes) if (h.alive && h.team !== u.team && h.vis[u.team]) { const d = M.dist(h, p); if (d < bd && M.dist(h, from) <= range + Rh) { bd = d; t = h; } } }
            if (t) { const lead = { x: t.x + (t.vx || 0) * 0.3, y: t.y + (t.vy || 0) * 0.3 }; p = H.toward(from, lead, range, true); }
            mm.telegraph({ team: u.team, x: p.x, y: p.y, r: Rh, life: 0.3, color: '#ffd080' });
          });
          // Phân Thân Hầu Vương: phân thân xoay côn tại chỗ cũ
          if (H.T(u, '12a')) m.zone({ owner: u, x: from.x, y: from.y, r: 2.5, life: 1.5, every: 0.5, kind: 'spin',
            tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (x) => { mm.damage(u, x, H.amt(u, 15 + 4 * u.level, 0.2), 'phys', { tag: 's3', aoe: true }); const v = H.dirTo(x, z), d = M.dist(x, z); if (d > 0.5) mm.knock(u, x, v.x, v.y, Math.min(0.8, d), 0.12); }, { noFx: true }) });
          m.later(air, (mm) => {
            if (!u.alive) return;
            mm.removeStatus(u, 'root', 'wk_air');
            mm.blink(u, p.x, p.y);
            const R = e === 2 && H.T(u, '9c') ? 5 : e ? 3.5 : 2.5, dmg = H.amt(u, ctx.v([70, 110, 150, 190, 230]), 0.8) * (1 + 0.2 * e) * (e === 2 ? 1.2 : 1);
            mm.hitCircle(u, u.x, u.y, R, (x) => {
              mm.damage(u, x, dmg, 'phys', { tag: 's3', aoe: true }); mark(mm, u, x, e);
              if (e) mm.addStatus(x, 'stun', e === 2 ? 1.8 : 1, 1, { src: u }); else mm.knockup(u, x, 0.75);
              if (e === 2 && H.T(u, '9c')) mm.removeStatus(x, 'shield');
            }, { color: '#ffb040' });
            if (H.T(u, '3b')) mm.zone({ owner: u, x: u.x, y: u.y, r: R, life: 3, every: 0.5, kind: 'crack',
              tick: (m3, z) => m3.hitCircle(u, z.x, z.y, z.r, (x) => m3.addStatus(x, 'slow', 0.6, 0.5, { src: u, key: 'wk_crack' }), { noFx: true }) });
            if (mm.fxOn) mm.fx({ type: 'quake', x: u.x, y: u.y, r: R });
          });
        },
        ai: { use: 'engage', range: 5, aim: 'point', speed: 0, delay: 0.8, skillshot: true },
      },
      sub: {
        name: 'Định Thân Thuật', desc: 'Chỉ dùng được lên tướng địch trong 5 đv đang có 2 Khí Ấn: hóa đá 1.5s.',
        cd: 20,
        can(m, u) { return !!m.heroes.find((h) => h.alive && h.team !== u.team && M.dist(h, u) < 5 && H.stacks(h, MARK) >= 2); },
        use(m, u) {
          const t = m.heroes.filter((h) => h.alive && h.team !== u.team && M.dist(h, u) < 5 && H.stacks(h, MARK) >= 2).sort((a, b) => M.dist2(a, u) - M.dist2(b, u) || a.id - b.id)[0];
          if (!t) return;
          m.removeStatus(t, 'mark', MARK);
          m.addStatus(t, 'stun', 1.5, 1, { src: u, key: 'petrify' });
          if (H.T(u, '9b')) for (const x of m.enemiesIn(u.team, t.x, t.y, 2, { heroesOnly: true })) if (x !== t) m.addStatus(x, 'stun', 1, 1, { src: u });
          if (m.fxOn) m.fx({ type: 'aura', id: t.id, color: '#a0a0a0', life: 1.5 });
        },
        ai: { use: 'cc', aim: 'self', range: 5, heroOnly: true },
      },
      s4: {
        name: 'Đại Thánh Hàng Thế', desc: 'Sóng côn 360° đẩy lùi 2.5 đv bán kính 3.5; 6s không thể cản phá, +30% tốc chạy, Toàn Phong Côn và Trực Thích tự cường hóa.',
        cd: [120, 100, 85], castTime: 0.1,
        use(m, u, ctx) {
          m.hitCircle(u, u.x, u.y, 3.5, (x) => {
            m.damage(u, x, H.amt(u, ctx.v([120, 200, 280]), 0.8), 'phys', { tag: 's4', aoe: true });
            const v = H.dirTo(u, x); m.knock(u, x, v.x, v.y, 2.5, 0.25);
          }, { color: '#ffb040' });
          u.ws.ult = m.time + 6;
          m.addStatus(u, 'unstop', 6, 1, { key: 'wk_ult' }); m.addStatus(u, 'haste', 6, 0.3, { key: 'wk_ult' });
          m.addStatus(u, 'buff', 6, 1, { key: 'wk_ult_combat', mods: { lifesteal: 0.2, crit: 0.2, armor: 25 } });
          // Vạn Trượng Kim Bổng: côn khổng lồ đè xuống phía trước
          if (H.T(u, '12b')) {
            const v = H.dirTo(u, ctx.pt);
            m.later(0.4, (mm) => mm.hitLine(u, u.x, u.y, v.x, v.y, 8, 3, (x) => { mm.damage(u, x, H.amt(u, ctx.v([100, 160, 220]), 0.6), 'phys', { tag: 's4' }); mm.addStatus(x, 'stun', 1, 1, { src: u }); }, { color: '#ffd080' }));
          }
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffb040', life: 6 });
        },
        ai: { use: 'ult', aim: 'unit', range: 3.2, aoe: 3.5 },
      },
    },
    ai: { order: ['s1', 's3', 's2'], engageRange: 5, role: 'fighter', bait: true },
    tags: ['cc'],
  });
  G.HEROES.wukong.tree = [
    [
      { name: 'Côn Pháp Nhập Môn', desc: 'Côn Thức tích từ đòn đánh +9 (thay vì +6).' },
      { name: 'Thân Pháp Khỉ Đột', desc: 'Kình Thiên Trụ bổ xuống xa hơn 25%.' },
      { name: 'Sải Côn Dài', desc: 'Toàn Phong Côn và Trực Thích tăng 20% tầm với.' },
    ],
    [
      { name: 'Phong Áp Cản Đạn', desc: 'Toàn Phong Côn triệt tiêu mọi đạn bay vào (kể cả đạn hạng nặng) trong 3.2 đv.' },
      { name: 'Rung Chấn Địa Tầng', desc: 'Cú bổ của Kình Thiên Trụ để lại vùng nứt 3s làm chậm 50%.' },
      { name: 'Thúc Gãy Xương', desc: 'Trực Thích đẩy kẻ địch va vào tường: choáng thêm 1.25s.' },
    ],
    [
      { name: 'Hoành Tảo Đoạt Mệnh', desc: 'Trực Thích trúng tướng: trong 2s dùng lại để trượt tới quét ngang, hất ngã 1s.' },
      { name: 'Hộ Thân Kim Cang', desc: 'Toàn Phong Côn thành lồng chuông 1.5s: chặn 1 đòn bất kỳ và đẩy bật kẻ tấn công 2 đv.' },
      { name: 'Đẩu Vân Đạp Tuyết', desc: 'Kình Thiên Trụ lướt thêm 2.5 đv trên không trước khi bổ xuống.' },
    ],
    [
      { name: 'Côn Khí Tự Sinh', desc: 'Côn Thức chạm 100: hồi ngay S1–S3 (20s).' },
      { name: 'Định Thân Lan Tỏa', desc: 'Định Thân Thuật choáng 1s các tướng địch khác trong 2 đv quanh nạn nhân.' },
      { name: 'Cột Trụ Trời Chấn Động', desc: 'Kình Thiên Trụ cường hóa tối đa: rộng 5 đv và phá mọi lá chắn.' },
    ],
    [
      { name: 'Phân Thân Hầu Vương', desc: 'Kình Thiên Trụ để lại phân thân xoay côn tại chỗ cũ 1.5s, hút kẻ địch.' },
      { name: 'Vạn Trượng Kim Bổng', desc: 'Đại Thánh Hàng Thế thêm côn khổng lồ đè 8×3 đv phía trước: choáng 1s.' },
      { name: 'Kim Cang Bất Hoại', desc: 'Trong Đại Thánh Hàng Thế: giảm 30% sát thương nhận.' },
    ],
  ];
})();
