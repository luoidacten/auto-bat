'use strict';
// ===== Elara — Cung • Xạ thủ • thả diều • mana • vật lý =====
(function () {
  const G = globalThis.G, H = G.H;
  H.def({
    id: 'elara', name: 'Elara', color: '#7ad67a', gfx: 'bow', kit: 'marksman', pos: ['adc'], dmgType: 'phys',
    ranged: true, projSpeed: 22, projKind: 'arrow', r: 0.6, resource: 'mana',
    stats: { range: 6.2, ad: 54, as: 0.65 },
    passive: {
      name: 'Linh Hoạt',
      desc: '+20% tốc chạy khi đang lùi xa khỏi địch. 5s không tấn công thì đòn kế tiếp được Tập Trung: +25% sát thương, tên bay nhanh hơn.',
      init(m, u) { u.ws.lastAtk = -9; },
      update(m, u) {
        const flee = u.ai && u.ai.fleeing;
        if (flee && !u.hasKey('ela_flee')) m.addStatus(u, 'haste', 0.3, H.T(u, '1a') ? 0.35 : 0.2, { key: 'ela_flee' });
      },
      onAuto(m, u, t, info) {
        // Tập Trung: Tập Trung Tuyệt Đối (3s, +40%) • Cung Thủ Tối Thượng (luôn +15%)
        if (H.T(u, '9c')) info.amt *= 1.15;
        else if (m.time - u.ws.lastAtk >= (H.T(u, '9a') ? 3 : 5)) info.amt *= H.T(u, '9a') ? 1.4 : 1.25;
        u.ws.lastAtk = m.time;
      },
    },
    skills: {
      s1: {
        name: 'Liên Xạ', desc: 'Bắn 3 mũi tên liên tiếp vào mục tiêu, mỗi mũi 50% sát thương đánh thường + 15/25/35/45./55',
        cd: [7, 6.5, 6, 5.5, 5], cost: [40, 40, 40, 40, 40],
        use(m, u, ctx) {
          const t = ctx.tgt; if (!t) return;
          const n = H.T(u, '12b') ? 5 : H.T(u, '1c') ? 4 : 3, gap = H.T(u, '12b') ? 0.05 : 0.12;
          for (let i = 0; i < n; i++) m.later(gap * i, (mm) => {
            if (!t.alive || !u.alive) return;
            H.homing(mm, u, t, { speed: 24, kind: 'arrow', onHit: (m3, p, e) => m3.damage(u, e, u.st.ad * 0.5 + ctx.v([15, 25, 35, 45, 55]), 'phys', { tag: 's1' }) });
          });
          u.ws.lastAtk = m.time;
          // Tiễn Trùng Khí: dùng lại bắn mũi tên xé gió đẩy lùi
          if (H.T(u, '6b')) m.allowRecast(u, 's1', 2, (mm, uu) => {
            if (!t.alive) return;
            H.homing(mm, uu, t, { speed: 28, kind: 'bigarrow', onHit: (m3, p, e) => { m3.damage(uu, e, uu.st.ad, 'phys', { tag: 's1' }); const v = H.dirTo(uu, e); m3.knock(uu, e, v.x, v.y, 2, 0.25); } });
          });
        },
        ai: { use: 'burst', range: 6.3, aim: 'unit', recastWhen: (m, u, t) => t && t.kind === 'hero' && G.M.dist(u, t) < 3.5 },
      },
      s2: {
        name: 'Kéo Căng Dây', desc: 'Tích tối đa 1.5s (đi chậm 50%), bắn mũi tên xuyên thấu bay 12 đv. Sát thương 50% → 100% theo thời gian tích.',
        cd: [12, 11, 10, 9, 8], cost: [60, 60, 60, 60, 60], castMove: (m, u) => (H.T(u, '6c') ? 1 : 0.5),
        castTime: (m, u) => (u.ai ? u.ai.chargeTime(1.5) : 1),
        use(m, u, ctx) {
          const c = Math.min(1, (u.ai ? u.ai.lastCharge : 1) / 1.5);
          const dmg = H.amt(u, ctx.v([80, 125, 170, 215, 260]), 0.9) * (0.5 + 0.5 * c);
          const t = ctx.tgt && ctx.tgt.alive ? ctx.tgt : null;
          const aim = t && u.ai ? u.ai.lead(t, 24) : ctx.pt;
          const xp = H.T(u, '3b'), hole = H.T(u, '12a') && c >= 0.9;
          H.shoot(m, u, aim, { speed: 24, range: H.T(u, '1b') ? 13.8 : 12, r: 0.45, pierce: true, kind: 'bigarrow', passWall: xp,
            onHit: (mm, p, e) => mm.damage(u, e, e.kind === 'minion' && !xp ? dmg * 0.6 : dmg, 'phys', { tag: 's2' }),
            // Mũi Tên Hư Không: hút kẻ địch quanh đường bay
            onTick: hole ? (mm, p) => { if (mm.tick % 4) return; for (const e of mm.enemiesIn(u.team, p.x, p.y, 2.5)) { if (e.dash || p.hit.has('pull' + e.id)) continue; p.hit.add('pull' + e.id); const v = H.dirTo(e, p); mm.knock(u, e, v.x, v.y, Math.min(1.5, G.M.dist(e, p)), 0.3); } } : null });
          u.ws.lastAtk = m.time;
        },
        ai: { use: 'poke', range: 11, aim: 'point', speed: 24, farm: 4 },
      },
      s3: {
        name: 'Sao Băng Lùi', desc: 'Nhảy lùi 3.5 đv rồi bắn 3 sao băng hình nón, làm chậm 40% 1.5s.',
        cd: [14, 13, 12, 11, 10], cost: [50, 50, 50, 50, 50],
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.alive ? ctx.tgt : H.nearestEnemyHero(m, u, 8);
          const from = t || { x: u.x + u.fx, y: u.y + u.fy };
          const back = H.dirTo(from, u);
          const start = { x: u.x, y: u.y };
          m.dashTo(u, u.x + back.x * 3.5, u.y + back.y * 3.5, 16, { onEnd: (mm) => {
            const v = t ? H.dirTo(u, t) : { x: -back.x, y: -back.y };
            const dmg = H.amt(u, ctx.v([30, 50, 70, 90, 110]), 0.3);
            if (H.T(u, '3c')) u.cd.s1 = 0;                                       // Thuận Phong
            if (H.T(u, '6a')) {                                                  // Mưa Băng Rải Thảm
              mm.zone({ owner: u, x: start.x, y: start.y, r: 3, life: 2.5, every: 0.5, kind: 'ice',
                tick: (m3, z) => m3.hitCircle(u, z.x, z.y, z.r, (e) => { m3.damage(u, e, dmg * 0.3, 'phys', { tag: 's3', aoe: true }); m3.addStatus(e, 'slow', 0.6, 0.5, { src: u }); }, { noFx: true }) });
              return;
            }
            const slowV = H.T(u, '3a') ? 0.6 : 0.4, slowT = H.T(u, '3a') ? 2 : 1.5;
            for (const a of [-0.3, 0, 0.3]) {
              const c = G.M.cos(a), s = G.M.sin(a);
              const d = { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
              mm.proj({ owner: u, x: u.x, y: u.y, dx: d.x, dy: d.y, speed: 18, range: 6, r: 0.4, kind: 'star',
                onHit: (m3, p, e) => { m3.damage(u, e, dmg, 'phys', { tag: 's3' }); m3.addStatus(e, 'slow', slowT, slowV, { src: u }); } });
            }
          } });
        },
        ai: { use: 'escape', range: 3.5, aim: 'away' },
      },
      sub: {
        name: 'Tên Hình Nón', desc: 'Bắn 3 mũi tên tỏa hình nón (3.4 đv): mỗi mũi 30 (+6/cấp, +35% SMVL) sát thương và đẩy lùi kẻ áp sát 1.6 đv — tạo khoảng trống để kéo cung.',
        cd: 10, cost: 30,
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, 30 + 6 * u.level, 0.35);
          for (const a of [-0.35, 0, 0.35]) {
            const c = Math.cos(a), s = Math.sin(a), d = { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
            H.shoot(m, u, { x: u.x + d.x, y: u.y + d.y }, { speed: 26, range: 3.4, r: 0.45, kind: 'arrow', onHit: (mm, p, e) => { p.dead = true; mm.damage(u, e, dmg, 'phys', { tag: 'sub' }); mm.knock(u, e, d.x, d.y, 1.6, 0.2); } });
          }
          u.ws.lastAtk = m.time;
        },
        ai: { use: 'cc', range: 2.6, aim: 'unit', alsoEscape: true, cond: (m, u, t) => !t.ranged || G.M.dist(u, t) < 2.2 + t.r },
      },
      s4: {
        name: 'Thần Tiễn Phá Không', desc: 'Mũi tên khổng lồ bay hết bản đồ, trúng tướng địch đầu tiên: choáng 0.5–1.5s theo quãng bay.',
        cd: [100, 85, 70], cost: [100, 100, 100], castTime: 0.25,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([200, 300, 400]), 1.0);
          const p0 = { x: u.x, y: u.y };
          const ice = H.T(u, '9b');
          H.shoot(m, u, ctx.pt, { speed: 20, range: 80, r: 0.8, hitMinions: false, kind: 'giantarrow', ghost: true, passWall: true, pierce: ice,
            onHit: (mm, p, e) => {
              // Băng Phong Toàn Vực: xuyên qua, mọi tướng phía sau bị trói chân + câm lặng 1s
              if (ice && p.first) { mm.damage(u, e, dmg * 0.5, 'phys', { tag: 's4' }); mm.addStatus(e, 'root', 1, 1, { src: u }); mm.addStatus(e, 'silence', 1, 1, { src: u }); return; }
              p.first = true;
              const d = G.M.dist(p0, e);
              mm.damage(u, e, dmg, 'phys', { tag: 's4' });
              mm.addStatus(e, 'stun', Math.min(1.5, 0.5 + d / 15), 1, { src: u });
              mm.hitCircle(u, e.x, e.y, 2.5, (x) => { if (x !== e) mm.damage(u, x, dmg * 0.4, 'phys', { tag: 's4', aoe: true }); }, { color: '#bfffbf' });
            } });
        },
        ai: { use: 'ult', range: 30, aim: 'point', speed: 20, heroOnly: true },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 6.3, role: 'adc' },
    tags: ['autos', 'poke'],
  });
  G.HEROES.elara.tree = [
    [
      { name: 'Bộ Pháp Tinh Linh', desc: 'Tốc chạy khi lùi xa khỏi địch tăng lên +35% (thay vì +20%).' },
      { name: 'Ưng Nhãn', desc: '+0.6 tầm bắn; Kéo Căng Dây bay xa hơn 15%.', stats: { range: 0.6 } },
      { name: 'Liên Xạ Thần Tốc', desc: 'Liên Xạ (S1) bắn 4 mũi tên (thay vì 3).' },
    ],
    [
      { name: 'Băng Vĩnh Cửu', desc: 'Sao băng của Sao Băng Lùi (S3) làm chậm 60% trong 2s.' },
      { name: 'Mũi Tên Xuyên Phá', desc: 'Kéo Căng Dây bay xuyên tường và không giảm sát thương lên lính.' },
      { name: 'Thuận Phong', desc: 'Sao Băng Lùi lập tức hồi lại Liên Xạ.' },
    ],
    [
      { name: 'Mưa Băng Rải Thảm', desc: 'Sao Băng Lùi thay 3 sao băng bằng vùng mưa băng bán kính 3 tại chỗ cũ: làm chậm 50% liên tục 2.5s.' },
      { name: 'Tiễn Trùng Khí', desc: 'Sau Liên Xạ, trong 2s dùng lại: mũi tên xé gió (100% SMVL) đẩy lùi 2 đv.' },
      { name: 'Cung Pháp Du Mục', desc: 'Tích Kéo Căng Dây không còn bị chậm.' },
    ],
    [
      { name: 'Tập Trung Tuyệt Đối', desc: 'Đòn Tập Trung sẵn sàng sau 3s không tấn công (thay vì 5s) và gây +40% (thay vì +25%).' },
      { name: 'Băng Phong Toàn Vực', desc: 'Thần Tiễn xuyên qua tướng đầu tiên: mọi tướng phía sau bị trói chân + câm lặng 1s (50% sát thương).' },
      { name: 'Cung Thủ Tối Thượng', desc: 'Luôn ở trạng thái Tập Trung: mọi đòn đánh +15%.' },
    ],
    [
      { name: 'Mũi Tên Hư Không', desc: 'Kéo Căng Dây tích tối đa: mũi tên hút kẻ địch trong 2.5 đv quanh đường bay về phía nó.' },
      { name: 'Cung Thủ Thần Tốc', desc: '−1 tầm bắn, +30% tốc đánh; Liên Xạ xả liên thanh 5 mũi.', stats: { range: -1, asPct: 0.3 } },
      { name: 'Cảm Ứng Rừng Già', desc: 'Phát hiện tướng địch tàng hình hoặc trong bụi trong 7 đv quanh Elara (cả đội cùng thấy).',
        tick(m, u) { for (const e of m.heroes) if (e.alive && e.team !== u.team && G.M.dist(e, u) <= 7) e.revealedT = Math.max(e.revealedT, m.time + 0.6); } },
    ],
  ];
})();
