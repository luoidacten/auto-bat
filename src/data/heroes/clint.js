'use strict';
// ===== Clint — Súng Săn • Đi rừng / Đường trên • bắn tầm gần • mana • vật lý =====
(function () {
  const G = globalThis.G, H = G.H;
  const RELOAD = 1.0;
  const reload = (u) => H.rlTime(u, H.T(u, '1a') ? 0.75 : RELOAD);   // GĐ9: nạp từng viên, nhanh hơn theo tốc đánh + Tốc Nạp
  const magSize = () => 2;   // GĐ12: băng đạn KHÓA CỨNG 2 viên
  // mọi chỉ số / mảnh hồn / nhánh tăng sức chứa băng đạn → quy đổi: +1 viên = +18% Công Vật Lý
  const extraMag = (u) => Math.max(0, H.mag(u, 2) - 2) + (H.T(u, '9b') ? 1 : 0);
  H.def({
    id: 'clint', name: 'Clint', color: '#d0a060', gfx: 'shotgun', kit: 'fighter', pos: ['jungle', 'top'], dmgType: 'phys',
    ranged: true, projSpeed: 26, projKind: 'pellet', r: 0.65, resource: 'mana',
    gun: (m, u) => ({ n: u.ws.ammo, max: magSize(u), rl: u.ws.reload, rlMax: u.ws.rlMax || RELOAD, shell: true }),
    gunSet(m, u, n) { u.ws.ammo = n; if (n >= magSize(u) && u.ws.reload > 0) { u.ws.reload = 0; H.reloadDone(m, u); } if (n > 0) u.atkT = Math.min(u.atkT, Math.max(0.15, u.atkT > 0.5 ? 0.15 : u.atkT)); },
    stats: { hp: 655, hpG: 98, mp: 300, mpG: 38, mpr: 1.5, mprG: 0.08, ad: 69, adG: 4.0, armor: 33, armorG: 4.0, as: 0.75, ms: 3.5, range: 3.4 },
    passive: {
      name: '2 Viên Đạn & Phản Lực Hỏa Lực',
      desc: 'Đánh thường là chùm đạn ghém tỏa nón: kẻ đứng sát (≤ 1.8 đv) nhận ×1.5, ở rìa tầm ×0.8, kẻ khác trong nón nhận 35%; mỗi phát trúng đẩy lùi 0.5 đv. Băng đạn KHÓA CỨNG 2 viên (tự nạp 1.0s/viên); mọi chỉ số tăng sức chứa băng đạn quy đổi: mỗi viên thêm = +18% Công Vật Lý.',
      init(m, u) { u.ws.ammo = 2; u.ws.reload = 0; u.ws.crit = false; },
      update(m, u, dt) {
        if (m.tick % 20 === 0) { const x = extraMag(u), st = u.hasKey('clint_conv'); if ((st ? st.n : 0) !== x) { m.removeStatus(u, 'buff', 'clint_conv'); if (x > 0) { const b = m.addStatus(u, 'buff', 1e6, 1, { key: 'clint_conv', persist: true, mods: { adPct: 0.18 * x } }); if (b) b.n = x; } } }
        const mag = magSize(u);
        if (u.ws.ammo < mag) {
          if (!H.rlHold(m, u, 'reload')) u.ws.reload -= dt;
          if (u.ws.reload <= 0) { u.ws.ammo++; if (u.ws.ammo < mag) u.ws.reload = u.ws.rlMax = reload(u); else { u.ws.reload = 0; H.reloadDone(m, u); } }
        }
        if (u.ws.ammo <= 0) u.atkT = Math.max(u.atkT, u.ws.reload);
      },
      onAuto(m, u, t, info) {
        u.ws.ammo = Math.max(0, u.ws.ammo - 1); if (u.ws.reload <= 0) { u.ws.reload = u.ws.rlMax = reload(u); H.reloadStart(m, u); }
        const d = G.M.dist(u, t) - t.r;
        info.amt *= d <= 1.8 ? 1.5 : d > 2.6 && !H.T(u, '12b') && !u.st.noFall ? 0.8 : 1;   // GĐ9: Tuyệt Đích Bất Suy bỏ suy hao
        if (u.ws.crit) { u.ws.crit = false; info.crit = true; info.amt *= 1.75; }
        if (d < 1.4 && t.kind === 'hero') {
          if (H.T(u, '6c') && H.ready(m, u, 'hcn' + t.id, 5)) info.extra.push(() => m.addStatus(t, 'stun', 0.4, 1, { src: u }));   // Hạt Chì Nặng
          if (H.T(u, '9c')) info.extra.push(() => m.removeStatus(t, 'shield'));                                                     // Điểm Hỏa Khắc Tinh
        }
        if (H.T(u, '12b') && t.kind === 'hero') info.extra.push(() => m.heal(u, u, u.st.maxHp * 0.02, true));
        // Đạn Xuyên Phá Cỡ Lớn: viên đặc chế
        if (u.ws.slug) {
          u.ws.slug = false; info.amt *= 2;
          const v = H.dirTo(u, t);
          info.extra.push(() => { m.removeStatus(t, 'shield'); m.knock(u, t, v.x, v.y, 2, 0.2); });
        }
        // Hơi Thở Rồng: phun lửa nón dài thay cho phát bắn
        if (u.ws.dragon > m.time && u.ws.dragonShots > 0) {
          u.ws.dragonShots--;
          const v = H.dirTo(u, t), dmg = info.amt + H.amt(u, u.ws.dragonDmg, 0.2);
          info.amt = 0;
          const L = u.ws.dragonLen || 6;
          info.extra.push(() => m.hitCone(u, u.x, u.y, v.x, v.y, L, 0.707, (e) => {   // nón 90°
            if (e.ga > 0) e.ga *= 0.7;                                            // phá 30% Hộ Giáp hiện tại
            m.damage(u, e, dmg, 'phys', { tag: 's4', aoe: true });
            m.dot(u, e, 12 + 3 * u.level, 3, 'magic', 'clint_burn');
            const w = H.dirTo(u, e); m.knock(u, e, w.x, w.y, 2.5, 0.25);
          }, { color: '#ff8a2a' }));
          return;
        }
        const v = H.dirTo(u, t), side = info.amt * 0.35;
        info.extra.push(() => t.alive && t.kind !== 'monster' && m.knock(u, t, v.x, v.y, 0.5, 0.08));   // phản lực: đẩy lùi 0.5 đv
        info.extra.push(() => m.hitCone(u, u.x, u.y, v.x, v.y, 3.6, 0.8, (e) => { if (e !== t) m.damage(u, e, side, 'phys', { tag: 'p', aoe: true }); }, { noFx: true }));
      },
    },
    skills: {
      s1: {
        name: 'Báng Súng', desc: 'Nện báng súng trước mặt (1.8 đv): sát thương vật lý, choáng 0.25s và làm chậm 30/40/45/50/55% trong 1.5/1.5/1.75/2/2s. Trúng tướng hoặc quái lớn: nạp ngay 1 viên.',
        cd: [6, 5.5, 5, 4.5, 4], cost: [35, 35, 35, 35, 35], castTime: 0.12,
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt);
          const R = H.T(u, '1b') ? 2.4 : 1.8;
          let big = false;
          m.hitCone(u, u.x, u.y, v.x, v.y, R + 0.4, 0.5, (e) => {
            if (e.kind === 'hero' || e.big || e.boss || e.roamBoss) big = true;
            m.damage(u, e, H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0.7) * (H.T(u, '6a') ? 1.2 : 1), 'phys', { tag: 's1' });
            m.addStatus(e, 'stun', 0.25, 1, { src: u });
            if (H.T(u, '6a')) m.knock(u, e, v.x, v.y, 3, 0.25);           // Đoạt Mệnh Cận Chiến: tọng họng súng, hất văng
            else m.addStatus(e, 'slow', ctx.v([1.5, 1.5, 1.75, 2, 2]), ctx.v([0.3, 0.4, 0.45, 0.5, 0.55]), { src: u });
          }, { color: '#d0a060' });
          if (big) u.ws.ammo = Math.min(magSize(u), u.ws.ammo + (H.T(u, '3c') || H.T(u, '6a') ? 2 : 1));
        },
        // GĐ12: xả đạn đan chiêu — dùng Báng Súng khi vừa hết đạn (bắn 2 phát → báng súng nạp 1)
        ai: { use: 'burst', range: 2.0, aim: 'unit', cond: (m, u, t) => u.ws.ammo <= 0 || t.hpPct < 0.25 },
      },
      s2: {
        name: 'Nạp Đạn Khẩn Cấp', desc: 'Ném vỏ đạn vào mục tiêu trong 5 đv: choáng 0.5s; nạp đầy 2 viên; phát kế tiếp chắc chắn chí mạng.',
        cd: [12, 11.5, 11, 10.5, 10], cost: [50, 50, 50, 50, 50], castTime: 0.1,
        use(m, u, ctx) {
          u.ws.ammo = magSize(u); u.ws.reload = 0; u.ws.crit = true; u.atkT = 0;
          if (H.T(u, '12a')) u.ws.slug = true;
          const t = ctx.tgt;
          if (t && t.alive && G.M.dist(u, t) < 5.5) H.homing(m, u, t, { speed: 22, kind: 'shell', onHit: (mm, p, e) => {
            mm.damage(u, e, H.amt(u, ctx.v([40, 60, 80, 100, 120]), 0.4), 'phys', { tag: 's2' });
            mm.addStatus(e, 'stun', H.T(u, '3b') ? 1 : 0.5, 1, { src: u });
          } });
        },
        ai: { use: 'cc', range: 5, aim: 'unit', cond: (m, u, t) => u.ws.ammo <= 0 || !!(t.cast && t.cast.total > 0.4) },
      },
      s3: {
        name: 'Bắn Nhảy', desc: 'Chĩa súng xuống sàn: kẻ địch quanh chân (2 đv) nhận sát thương, để lại Vùng Lửa thiêu 2.5% máu tối đa mỗi giây trong 3s; bật nhảy vượt chướng ngại 4–8 đv theo hướng chọn; tiếp đất nạp lại 1 viên.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [45, 45, 45, 45, 45],
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([40, 65, 90, 115, 140]), 0.5), c = { x: u.x, y: u.y };
          m.hitCircle(u, c.x, c.y, 2, (e) => {
            m.damage(u, e, dmg, 'phys', { tag: 's3' });
            if (H.T(u, '3a')) m.addStatus(e, 'stun', 0.6, 1, { src: u });
          }, { color: '#ff9a3a' });
          m.zone({ owner: u, x: c.x, y: c.y, r: 2, life: 3, every: 0.5, kind: 'fire', tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => mm.damage(u, e, e.st.maxHp * 0.025 * 0.5, 'magic', { tag: 's3', aoe: true, noHook: true }), { noFx: true }) });
          const want = ctx.pt ? G.M.dist(u, ctx.pt) : 6, far = H.T(u, '1c') ? 9.5 : 8;
          const p = H.toward(u, ctx.pt || { x: u.x + u.fx, y: u.y + u.fy }, Math.max(4, Math.min(far, want)), false);
          G.MAP.pushOut(p, u.r);
          m.dashTo(u, p.x, p.y, 18, { wall: true, onEnd: () => { u.ws.ammo = Math.min(magSize(u), u.ws.ammo + 1); } });
          // Dậm Gót Tử Thần: dùng lại để bổ gót xuống tướng địch gần nhất
          if (H.T(u, '6b')) m.allowRecast(u, 's3', 1.5, (mm, uu) => {
            const t = H.nearestEnemyHero(mm, uu, 4); if (!t) return;
            mm.dashTo(uu, t.x, t.y, 22, { onContact: (m3, u3, e) => { if (e !== t) return; m3.damage(u3, e, dmg * 0.6, 'phys', { tag: 's3' }); m3.addStatus(e, 'stun', 1, 1, { src: u3 }); return 'stop'; } });
          });
        },
        ai: { use: 'escape', range: 8, aim: 'away', alsoEngage: true, wall: true },
      },
      s4: {
        name: "Dragon's Breath", desc: 'Nạp 2 viên Đạn Rồng Hỏa Ngục trong 10s: mỗi phát phun bão lửa hình nón 90° dài 6/12/18 đv — thiêu đốt, phá 30% Hộ Giáp hiện tại, sát thương diện rộng và hất văng 2.5 đv (ép đối thủ ra ngoài bo).',
        cd: [100, 85, 70], cost: [100, 100, 100],
        use(m, u, ctx) {
          const big = H.T(u, '9a');
          u.ws.dragon = m.time + 10; u.ws.dragonShots = big ? 3 : 2; u.ws.dragonDmg = ctx.v([60, 100, 140]); u.ws.dragonLen = ctx.v([6, 12, 18]);
          u.ws.ammo = Math.max(magSize(u), u.ws.dragonShots); u.ws.reload = 0; u.atkT = 0;
          if (big) m.addStatus(u, 'unstop', 6, 1, { key: 'clint_db' });
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ff6a1a', life: 1 });
        },
        ai: { use: 'ult', aim: 'self', range: 6 },
      },
    },
    ai: { order: ['s1', 's3', 's2'], engageRange: 3.8, role: 'fighter', noKite: true, bait: true },
    tags: ['autos'],
  });
  G.HEROES.clint.tree = [
    [
      { name: 'Cò Kép Nhanh', desc: 'Tự nạp đạn 0.75s/viên (thay vì 1.0s).' },
      { name: 'Báng Súng Thép', desc: 'Báng Súng (S1) tầm đập rộng hơn 30%.' },
      { name: 'Phản Lực Nhảy', desc: 'Bắn Nhảy (S3) bật xa hơn 30%.' },
    ],
    [
      { name: 'Dập Lửa Dưới Chân', desc: 'Kẻ địch ở chỗ dậm của Bắn Nhảy bị choáng 0.6s.' },
      { name: 'Vỏ Đạn Gây Mù', desc: 'Nạp Đạn Khẩn Cấp (S2) choáng 1s (thay vì 0.5s).' },
      { name: 'Nạp Kép Cận Chiến', desc: 'Báng Súng trúng: nạp 2 viên (thay vì 1).' },
    ],
    [
      { name: 'Đoạt Mệnh Cận Chiến', desc: 'Báng Súng thành tọng họng súng: +20% sát thương, hất văng 3 đv (thay cho làm chậm), nạp 2 viên.' },
      { name: 'Dậm Gót Tử Thần', desc: 'Sau Bắn Nhảy, trong 1.5s dùng lại: bổ gót xuống tướng địch gần nhất trong 4 đv, choáng 1s.' },
      { name: 'Hạt Chì Nặng', desc: 'Phát bắn sát người (dưới 1.4 đv) lên tướng: choáng 0.4s (mỗi mục tiêu 5s).' },
    ],
    [
      { name: "Dragon's Breath Bất Tận", desc: "Dragon's Breath có 3 viên (thay vì 2) và không thể cản phá trong 6s." },
      { name: 'Băng Ba Viên', desc: 'Băng đạn vẫn khóa 2 viên: quy đổi thành +18% Công Vật Lý.' },
      { name: 'Điểm Hỏa Khắc Tinh', desc: 'Phát bắn sát người phá tan mọi lá chắn của mục tiêu.' },
    ],
    [
      { name: 'Đạn Xuyên Phá Cỡ Lớn', desc: 'Nạp Đạn Khẩn Cấp nạp 1 viên đặc chế: phát kế tiếp gây gấp đôi sát thương, phá khiên và đẩy lùi 2 đv.' },
      { name: 'Thợ Săn Bất Tử', desc: '+0.8 tầm bắn, không còn bị giảm sát thương khi bắn xa; mỗi phát trúng tướng hồi 2% máu tối đa.', stats: { range: 0.8 } },
      { name: 'Băng Đạn Vô Tận', desc: 'Hạ gục tướng: nạp đầy đạn, hồi ngay Bắn Nhảy và Báng Súng.',
        onKill(m, u, v) { if (v.kind !== 'hero') return; u.ws.ammo = magSize(u); u.ws.reload = 0; u.cd.s1 = 0; u.cd.s3 = 0; } },
    ],
  ];
})();
