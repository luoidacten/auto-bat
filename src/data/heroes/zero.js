'use strict';
// ===== Zero — Súng • Xạ thủ • dồn băng đạn • mana • vật lý =====
(function () {
  const G = globalThis.G, H = G.H;
  const MAG = 9, RELOAD = 1.6, MARK = 'zero_mark';
  const mag = (u) => H.mag(u, H.T(u, '12b') ? 14 : MAG);
  // GĐ9: thời gian nạp theo tốc đánh + Tốc Nạp (H.rlTime)
  const reload = (u) => (u.ws.fastRl > 0 ? 0.5 : H.rlTime(u, H.T(u, '1a') ? 1.2 : RELOAD));
  const startReload = (m, u) => { u.ws.ammo = 0; u.ws.reload = u.ws.rlMax = reload(u); if (u.ws.fastRl > 0) u.ws.fastRl--; H.reloadStart(m, u); };
  const hitsNeed = (u) => (H.T(u, '3a') ? 4 : 5);
  H.def({
    id: 'zero', name: 'Zero', color: '#9aa0a8', gfx: 'pistol', kit: 'marksman', pos: ['adc'], dmgType: 'phys',
    ranged: true, projSpeed: 30, projKind: 'bullet', r: 0.6, resource: 'mana',
    gun: (m, u) => ({ n: u.ws.ammo, max: mag(u), rl: u.ws.reload, rlMax: u.ws.rlMax || RELOAD }),
    gunSet(m, u, n) { u.ws.ammo = n; if (n > 0 && u.ws.reload > 0) { u.ws.reload = 0; H.reloadDone(m, u); u.atkT = Math.min(u.atkT, 0.15); } },
    stats: { range: 6.2, ad: 71, adG: 4.2, as: 0.68, asG: 0.028 },
    passive: {
      name: 'Vũ Trang Hiện Đại',
      desc: 'Đánh thường dùng băng 9 viên; hết đạn phải nạp 1.6s. Đạn mạnh.',
      init(m, u) { u.ws.ammo = MAG; u.ws.reload = 0; u.ws.hits = 0; u.ws.emp = false; u.ws.fastRl = 0; },
      update(m, u, dt) {
        if (u.ws.reload > 0) { u.ws.reload -= dt; if (u.ws.reload <= 0) { u.ws.ammo = mag(u); H.reloadDone(m, u); } }
        if (u.ws.ammo <= 0) u.atkT = Math.max(u.atkT, u.ws.reload);
        // tự nạp khi rảnh tay lâu
        if (u.ws.ammo < mag(u) && u.ws.reload <= 0 && m.time - (u.combatT || -99) > 4) startReload(m, u);
      },
      onAuto(m, u, t, info) {
        u.ws.ammo--; if (u.ws.ammo <= 0) startReload(m, u);
        if (H.T(u, '12b')) info.amt *= 0.9;
        if (t.hasKey(MARK)) { info.amt *= 1.1; u.ws.hits++; if (u.ws.hits >= hitsNeed(u)) u.ws.emp = true; }
        if (u.ws.boom > m.time) {
          const dmg = info.amt * (1 + u.ws.boomAmp) * 0.5, R = H.T(u, '9a') ? 2.2 : 1.5;
          info.amt *= 1 + u.ws.boomAmp;
          info.extra.push(() => m.hitCircle(u, t.x, t.y, R, (e) => {
            if (e !== t) m.damage(u, e, dmg, 'phys', { tag: 's4', aoe: true });
            if (H.T(u, '9a') && e.kind === 'hero' && H.ready(m, u, 'bd' + e.id, 2)) m.addStatus(e, 'silence', 0.5, 1, { src: u });
          }, { color: '#ffb84a' }));
        }
      },
      // Phản Xạ Điệp Viên: bị tướng cận chiến đánh khi dưới 50% máu → tự lướt né
      onTake(m, u, att, info) {
        if (!H.T(u, '6c') || !info.auto || !att || att.kind !== 'hero' || att.ranged || u.hpPct > 0.5 || u.disabled || u.dash) return;
        if (!H.ready(m, u, 'pxdv', 15)) return;
        const v = H.dirTo(att, u); m.dashTo(u, u.x + v.x * 3, u.y + v.y * 3, 18, {});
      },
    },
    skills: {
      s1: {
        name: 'Khóa Mục Tiêu', desc: 'Đánh dấu một tướng trong 9 đv trong 6s: +10% sát thương đánh thường lên nó và lộ hình. Bắn trúng 5 lần thì S3 kế tiếp được cường hóa.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [30, 30, 30, 30, 30],
        can(m, u) { const t = u.ai && u.ai.target; return !!(t && t.kind === 'hero' && G.M.dist(u, t) < 9); },
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.kind === 'hero' ? ctx.tgt : u.ai && u.ai.target; if (!t) return;
          m.addStatus(t, 'mark', 6, 1, { key: MARK, src: u }); t.revealedT = m.time + 6; u.ws.hits = 0;
          if (H.T(u, '12c')) m.addStatus(t, 'vuln', 6, 0.15, { key: 'zero_vuln', src: u });     // Triệt Tiêu Hoàn Toàn
          if (m.fxOn) m.fx({ type: 'lock', id: t.id, life: 6 });
          // Kích Nổ Dấu Ấn: dùng lại để kích nổ dấu
          if (H.T(u, '6b')) m.allowRecast(u, 's1', 6, (mm, uu) => {
            if (!t.alive || !t.hasKey(MARK)) return;
            mm.removeStatus(t, 'mark', MARK);
            mm.damage(uu, t, H.amt(uu, 60 + 10 * uu.level, 0.5), 'phys', { tag: 's1' });
            mm.addStatus(t, 'silence', 1.2, 1, { src: uu });
            const v = H.dirTo(uu, t); mm.knock(uu, t, v.x, v.y, 1.5, 0.2);
            if (mm.fxOn) mm.fx({ type: 'burst', x: t.x, y: t.y, color: '#ffb84a' });
          });
        },
        ai: { use: 'burst', range: 8.5, aim: 'unit', heroOnly: true, recastWhen: (m, u, t) => t && t.hasKey(MARK) && (G.M.dist(u, t) < 3.5 || t.hpPct < 0.25) },
      },
      s2: {
        name: 'Xả Băng', desc: 'Xả toàn bộ đạn còn lại thật nhanh vào mục tiêu (mỗi viên 80% sát thương đánh thường), rồi nạp đạn.',
        cd: [9, 8.5, 8, 7.5, 7], cost: [50, 50, 50, 50, 50],
        can(m, u) { return u.ws.ammo >= 2; },
        use(m, u, ctx) {
          const t = ctx.tgt; if (!t) return;
          const n = u.ws.ammo; startReload(m, u);
          const per = u.st.ad * 0.8 + ctx.v([6, 10, 14, 18, 22]);
          m.addStatus(u, 'root', 0.06 * n + 0.1, 1, { key: 'zero_spray' });
          const pen = H.T(u, '9c') ? 0.3 : 0;
          const hitB = (m3, e, last) => {
            u.st.armorPen += pen; m3.damage(u, e, per * (e.hasKey(MARK) ? 1.1 : 1), 'phys', { tag: 's2' }); u.st.armorPen -= pen;
            if (last && H.T(u, '3b') && e.kind === 'hero') m3.addStatus(e, 'stun', 0.6, 1, { src: u });
          };
          const v0 = H.dirTo(u, t);
          for (let i = 0; i < n; i++) m.later(0.06 * i, (mm) => {
            if (!u.alive) return;
            const last = i === n - 1;
            // Đạn Chùm Càn Quét: tỏa hình quạt 90°
            if (H.T(u, '6a')) {
              const a = -0.785 + 1.57 * (n > 1 ? i / (n - 1) : 0.5), c = G.M.cos(a), s2 = G.M.sin(a);
              mm.proj({ owner: u, x: u.x, y: u.y, dx: v0.x * c - v0.y * s2, dy: v0.x * s2 + v0.y * c, speed: 30, range: 6.5, r: 0.35, kind: 'bullet', onHit: (m3, p, e) => hitB(m3, e, last) });
              return;
            }
            if (!t.alive) return;
            H.homing(mm, u, t, { speed: 34, kind: 'bullet', onHit: (m3, p, e) => hitB(m3, e, last) });
          });
        },
        ai: { use: 'burst', range: 6.0, aim: 'unit', cond: (m, u, t) => u.ws.ammo >= 4 || t.hpPct < 0.35 },
      },
      s3: {
        name: 'Nhảy Lùi', desc: 'Nhảy lùi 3 đv, giảm 25% sát thương nhận 1s. Cường hóa: lướt 5 đv tức thì và nạp đầy đạn.',
        cd: [12, 11, 10, 9, 8], cost: [40, 40, 40, 40, 40],
        use(m, u, ctx) {
          const t = H.nearestEnemyHero(m, u, 9);
          const from = t || { x: u.x + u.fx, y: u.y + u.fy };
          const back = H.dirTo(from, u);
          m.addStatus(u, 'reduce', H.T(u, '1b') ? 2 : 1, 0.25, { key: 'zero_hop' });
          if (H.T(u, '3c')) m.addStatus(u, 'stealth', 1.5, 1, { key: 'zero_smoke' });               // Khói Ngụy Trang
          if (u.ws.emp) {
            u.ws.emp = false; u.ws.ammo = mag(u); u.ws.reload = 0; u.atkT = 0;
            if (H.T(u, '9b')) u.ws.fastRl = 2;                                                       // Nạp Đạn Thần Tốc
            // Dịch Chuyển Ám Sát: ra sau lưng mục tiêu bị khóa, tự xả 3 viên
            const mk = H.T(u, '12a') ? m.heroes.find((h) => h.alive && h.team !== u.team && G.M.dist(h, u) < 8 && h.hasKey(MARK)) : null;
            if (mk) {
              const v = H.dirTo(u, mk); m.blink(u, mk.x + v.x * 1.5, mk.y + v.y * 1.5); u.face(mk.x, mk.y);
              for (let i = 0; i < 3; i++) m.later(0.08 * i, (mm) => { if (mk.alive && u.alive) H.homing(mm, u, mk, { speed: 34, kind: 'bullet', onHit: (m3, p, e) => m3.damage(u, e, u.st.ad * 0.8, 'phys', { tag: 's3' }) }); });
            } else m.blink(u, u.x + back.x * 5, u.y + back.y * 5);
          } else m.dashTo(u, u.x + back.x * 3, u.y + back.y * 3, 16, {});
        },
        ai: { use: 'escape', range: 3, aim: 'away' },
      },
      s4: {
        name: 'Băng Đạn Nổ', desc: 'Nạp ngay băng đạn nổ trong 8s: +30% tốc đánh, đạn mạnh hơn 30/40/50% và nổ lan bán kính 1.5 (50%).',
        cd: [90, 75, 60], cost: [100, 100, 100],
        use(m, u, ctx) {
          u.ws.boom = m.time + 8; u.ws.boomAmp = ctx.v([0.3, 0.4, 0.5]);
          m.addStatus(u, 'buff', 8, 1, { key: 'zero_ult', mods: { asPct: 0.3 } });
          u.ws.ammo = mag(u); u.ws.reload = 0; u.atkT = 0;
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffb84a', life: 8 });
        },
        ai: { use: 'ult', aim: 'self', range: 6.5 },
      },
    },
    ai: { order: ['s2', 's1', 's3'], engageRange: 6.0, role: 'adc' },
    tags: ['autos', 'crit'],
  });
  G.HEROES.zero.tree = [
    [
      { name: 'Thay Đạn Chiến Thuật', desc: 'Nạp đạn 1.2s (thay vì 1.6s).' },
      { name: 'Giáp Phản Phản Ứng', desc: 'Nhảy Lùi (S3) giảm 25% sát thương trong 2s (thay vì 1s).' },
      { name: 'Đạn Gia Tốc', desc: 'Đạn bay nhanh hơn 40%, +0.4 tầm bắn.', stats: { range: 0.4 }, init(m, u) { u.projSpeed *= 1.4; } },
    ],
    [
      { name: 'Khóa Họng Súng', desc: 'Chỉ cần 4 phát trúng mục tiêu bị Khóa (thay vì 5) để cường hóa Nhảy Lùi.' },
      { name: 'Viên Đạn Áp Chế', desc: 'Viên cuối của Xả Băng (S2) choáng 0.6s.' },
      { name: 'Khói Ngụy Trang', desc: 'Nhảy Lùi để lại màn khói: Zero tàng hình 1.5s.' },
    ],
    [
      { name: 'Đạn Chùm Càn Quét', desc: 'Xả Băng tỏa hình quạt 90° thay vì bắn thẳng một mục tiêu.' },
      { name: 'Kích Nổ Dấu Ấn', desc: 'Mục tiêu đang bị Khóa: dùng lại Khóa Mục Tiêu để kích nổ — 60 (+10/cấp) sát thương, câm lặng 1.2s, đẩy lùi 1.5 đv.' },
      { name: 'Phản Xạ Điệp Viên', desc: 'Bị tướng cận chiến đánh trúng khi dưới 50% máu: tự lướt né 3 đv (hồi 15s).' },
    ],
    [
      { name: 'Băng Đạn Hủy Diệt', desc: 'Đạn nổ của Băng Đạn Nổ (S4) lan rộng 2.2 đv và câm lặng tướng 0.5s.' },
      { name: 'Nạp Đạn Thần Tốc', desc: 'Nhảy Lùi cường hóa: 2 lần nạp đạn kế tiếp chỉ mất 0.5s.' },
      { name: 'Xuyên Giáp Quân Dụng', desc: 'Đạn của Xả Băng bỏ qua 30% giáp.' },
    ],
    [
      { name: 'Dịch Chuyển Ám Sát', desc: 'Nhảy Lùi cường hóa dịch chuyển ra sau lưng mục tiêu bị Khóa (trong 8 đv) và tự xả 3 viên.' },
      { name: 'Hỏa Lực Tuyệt Mật', desc: 'Băng đạn 14 viên, +20% tốc đánh; mỗi viên −10% sát thương.', stats: { asPct: 0.2 } },
      { name: 'Triệt Tiêu Hoàn Toàn', desc: 'Mục tiêu bị Khóa nhận thêm 15% sát thương từ mọi nguồn.' },
    ],
  ];
})();
