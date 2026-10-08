'use strict';
// ===== Jack "Sáu Lỗ" — Súng Lục Xoay • Xạ thủ • may rủi • mana • vật lý =====
// Xúc xắc và viên Định Mệnh dùng bộ sinh số chiến đấu của trận (tất định theo hạt giống).
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const mag = (u) => H.mag(u, H.T(u, '12b') ? 8 : 6);
  function roll(m, u) {
    let d;
    if (H.T(u, '12b')) d = 3 + m.rng.int(0, 3);
    else if (H.T(u, '3a')) { const r = m.rng.int(1, 7); d = r >= 6 ? 6 : r; }   // ⚅ gấp đôi
    else d = m.rng.int(1, 6);
    if (d === 1 && H.T(u, '6c')) d = m.rng.int(1, 6);                            // Tẩy Bài: gieo lại
    u.ws.die = d;
    if (d === 1 && !H.T(u, '1a')) u.hp = Math.max(1, u.hp - u.st.maxHp * 0.04);
    if (m.fxOn) m.fx({ type: 'note', id: u.id, k: FACE[d] });
  }
  function reload(m, u) { u.ws.ammo = mag(u); u.ws.rl = 0; roll(m, u); H.reloadDone(m, u); }
  // GĐ9: bắt đầu nạp ổ — 2s gốc, nhanh hơn theo tốc đánh + Tốc Nạp
  function startRl(m, u) { u.ws.rl = u.ws.rlMax = H.rlTime(u, 2); H.reloadStart(m, u); }
  H.def({
    id: 'jack', name: 'Jack "Sáu Lỗ"', color: '#c0a080', gfx: 'revolver', kit: 'marksman', pos: ['adc'], dmgType: 'phys',
    ranged: true, projSpeed: 28, projKind: 'bullet', r: 0.6, resource: 'mana',
    gun: (m, u) => ({ n: u.ws.ammo, max: mag(u), rl: u.ws.rl, rlMax: u.ws.rlMax || 2 }),
    gunSet(m, u, n) { u.ws.ammo = n; if (n > 0 && u.ws.rl > 0) { u.ws.rl = 0; H.reloadDone(m, u); u.atkT = Math.min(u.atkT, 0.15); } },
    stats: { range: 5.5, ad: 61, adG: 3.8, as: 0.72, asG: 0.03 },
    passive: {
      name: 'Gieo Xúc Xắc',
      desc: 'Ổ 6 viên, nạp 2s; mỗi lần nạp gieo xúc xắc: ⚀ tự mất 4% máu • ⚁–⚄ cả ổ +5/10/15/20% sát thương • ⚅ cả ổ chí mạng và choáng 0.25s.',
      init(m, u) { u.ws.ammo = 6; u.ws.rl = 0; u.ws.die = 3; u.ws.bonus = 0; u.ws.fate = -1; },
      update(m, u, dt) {
        if (u.ws.rl > 0) { u.ws.rl -= dt; if (u.ws.rl <= 0) reload(m, u); }
        if (u.ws.ammo <= 0) { if (u.ws.rl <= 0) startRl(m, u); u.atkT = Math.max(u.atkT, u.ws.rl); }
        if (H.T(u, '1b') && u.ws.rl > 0 && m.tick % 10 === 0) m.addStatus(u, 'haste', 0.6, 0.35, { key: 'jack_rl' });
        if (u.ws.ammo < mag(u) && u.ws.rl <= 0 && m.time - u.combatT > 4) startRl(m, u);
      },
      onAuto(m, u, t, info) {
        u.ws.ammo = Math.max(0, u.ws.ammo - 1);
        const d = u.ws.house > m.time ? 6 : u.ws.die;
        if (d >= 2 && d <= 5) info.amt *= 1 + 0.05 * (d - 1);
        if (d === 6) { if (!info.crit) { info.crit = true; info.amt *= G.C.CRIT_MULT + (u.bonus.critMult || 0); } info.extra.push(() => t.kind === 'hero' && m.addStatus(t, 'stun', 0.25, 1, { src: u })); }
        if (H.T(u, '1c')) info.amt *= 1.1;
        info.amt *= 1 + 0.04 * (u.ws.bonus || 0);
        // Tất Tay: dưới 40% máu, 50% cơ hội chí mạng thêm
        if (H.T(u, '9c') && u.hpPct < 0.4 && !info.crit && m.rng.chance(0.5)) { info.crit = true; info.amt *= G.C.CRIT_MULT; }
        // Cò Quay Nga: viên Định Mệnh
        if (u.ws.fate >= 0) {
          if (u.ws.fate === 0) {
            u.ws.fate = -1;
            const k = H.T(u, '9a') ? 5 : 3.5, base = u.st.ad * k;
            info.amt = 0;
            info.extra.push(() => {
              if (H.T(u, '9a') && t.kind === 'hero' && t.hpPct < 0.3) m.damage(u, t, t.hp * 3, 'true', { tag: 's2' });
              else m.damage(u, t, base, 'true', { tag: 's2' });
              m.addStatus(t, 'stun', 1, 1, { src: u });
              if (m.fxOn) m.fx({ type: 'burst', x: t.x, y: t.y, color: '#ff3a3a' });
              // Cược Tất Tay: ném luôn khẩu súng phát nổ
              if (H.T(u, '12a')) m.allowRecast(u, 's2', 2, (mm, uu) => { mm.hitCircle(uu, t.x, t.y, 4, (e) => mm.damage(uu, e, uu.st.ad * 2.5, 'phys', { tag: 's2', aoe: true }), { color: '#ff7a1a' }); uu.atkT = 3; });
            });
          } else {
            u.ws.fate--;
            if (H.T(u, '3c')) info.extra.push(() => m.shield(u, u, 40 + 5 * u.level, 1));
          }
        }
      },
      onKill(m, u, v) {
        if (v.kind === 'hero' && u.ws.house > m.time && (u.ws.bonus || 0) < 5) { u.ws.bonus = (u.ws.bonus || 0) + 1; u.cd.s4 *= 0.5; }
      },
      onFatal(m, u) {
        if (!H.T(u, '12c') || u.ws.second) return false;
        u.ws.second = true; u.hp = 1; m.shield(u, u, 150 + 15 * u.level, 2);
        const e = H.nearestEnemyHero(m, u, 8), v = e ? H.dirTo(e, u) : { x: -u.fx, y: -u.fy };
        m.dashTo(u, u.x + v.x * 5, u.y + v.y * 5, 22, {});
        return true;
      },
    },
    skills: {
      s1: {
        name: 'Quạt Cò', desc: 'Xả hết đạn còn lại theo hình nón (5 đv), mỗi viên 70% SMVL + 10/15/20/25/30. Rồi nạp đạn.',
        cd: [8, 7.5, 7, 6.5, 6], cost: [45, 45, 45, 45, 45], castTime: 0.05,
        can(m, u) { return u.ws.ammo >= 2 && u.ws.fate < 0; },
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt), per = u.st.ad * 0.7 + ctx.v([10, 15, 20, 25, 30]);
          if (H.T(u, '6b')) {   // Bắn Nhanh: 3 viên liên thanh theo đường thẳng, giật lùi
            for (let i = 0; i < 3; i++) m.later(0.06 * i, (mm) => H.shoot(mm, u, { x: u.x + v.x * 5, y: u.y + v.y * 5 }, { speed: 34, range: 6.5, r: 0.35, kind: 'bullet', onHit: (m3, p, e) => m3.damage(u, e, per * 1.1, 'phys', { tag: 's1' }) }));
            u.ws.ammo = Math.max(0, u.ws.ammo - 3); m.dashTo(u, u.x - v.x * 2, u.y - v.y * 2, 14, {});
            return;
          }
          const n = u.ws.ammo; u.ws.ammo = 0; startRl(m, u);
          for (let i = 0; i < n; i++) {
            const a = n > 1 ? -0.5 + i / (n - 1) : 0, c = M.cos(a), s = M.sin(a), last = i === n - 1;
            m.proj({ owner: u, x: u.x, y: u.y, dx: v.x * c - v.y * s, dy: v.x * s + v.y * c, speed: 30, range: 5, r: 0.35, kind: 'bullet', onHit: (mm, p, e) => { mm.damage(u, e, per, 'phys', { tag: 's1' }); if (last && H.T(u, '3b')) mm.addStatus(e, 'stun', 0.75, 1, { src: u }); } });
          }
        },
        ai: { use: 'burst', range: 4, aim: 'unit', cond: (m, u, t) => u.ws.ammo >= 3 || t.hpPct < 0.3 },
      },
      s2: {
        name: 'Cò Quay Nga', desc: 'Nạp 1 Viên Định Mệnh rồi xoay ổ: một trong 6 phát kế tiếp gây 350% SMVL sát thương chuẩn và choáng 1s; trong lúc đó không dùng được Quạt Cò và Lăn Né.',
        cd: [18, 17, 16, 15, 14], cost: [60, 60, 60, 60, 60],
        can(m, u) { return u.ws.fate < 0; },
        use(m, u) { u.ws.fate = m.rng.int(0, 5); if (m.fxOn) m.fx({ type: 'note', id: u.id, k: '🎲' }); },
        ai: { use: 'burst', range: 6, aim: 'self', heroOnly: true },
      },
      s3: {
        name: 'Lăn Né', desc: 'Lăn 3.5 đv (miễn sát thương khi lăn), nhét thêm 2 viên.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [40, 40, 40, 40, 40],
        can(m, u) { return u.ws.fate < 0; },
        use(m, u, ctx) {
          if (H.T(u, '6a')) {   // Nạp Đạn Liều Lĩnh: nạp đầy ổ + xoay súng xả đạn mù quanh người
            reload(m, u);
            m.hitCircle(u, u.x, u.y, 3, (e) => m.damage(u, e, u.st.ad * 0.9, 'phys', { tag: 's3', aoe: true }), { color: '#c0a080' });
            return;
          }
          const p = H.toward(u, ctx.pt, 3.5, false);
          m.dashTo(u, p.x, p.y, 18, { invuln: true });
          u.ws.ammo = Math.min(mag(u), u.ws.ammo + 2);
        },
        ai: { use: 'escape', range: 3.5, aim: 'away' },
      },
      s4: {
        name: 'Nhà Cái Trả Thưởng', desc: '6s mọi đòn đánh là ⚅ (chí mạng + choáng 0.25s); hạ gục tướng trong lúc đó: +4% sát thương tới hết trận (tối đa 5 lần) và hoàn 50% hồi chiêu.',
        cd: [100, 85, 70], cost: [100, 100, 100],
        use(m, u) {
          u.ws.house = m.time + 6; reload(m, u); u.ws.die = 6;
          if (H.T(u, '9b')) u.cd.s4 *= 0.67;
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffd24a', life: 6 });
        },
        ai: { use: 'ult', aim: 'self', range: 6 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 5.5, role: 'adc' },
    tags: ['autos', 'crit'],
  });
  G.HEROES.jack.tree = [
    [
      { name: 'Tay Cờ Bạc Chuyên Nghiệp', desc: 'Xúc xắc ra ⚀ không còn tự mất máu.' },
      { name: 'Thay Đạn Nhanh', desc: '+35% tốc chạy trong lúc nạp đạn.' },
      { name: 'Đạn Nặng', desc: 'Đánh thường +10% sát thương.' },
    ],
    [
      { name: 'Tăng Tỷ Lệ Nhà Cái', desc: 'Tỉ lệ xúc xắc ra ⚅ tăng gấp đôi.' },
      { name: 'Xả Hết Vốn', desc: 'Viên cuối của Quạt Cò chắc chắn choáng 0.75s.' },
      { name: 'Thần May Mắn Hộ Mệnh', desc: 'Mỗi phát trượt ở Cò Quay Nga cho lá chắn nhỏ 1s.' },
    ],
    [
      { name: 'Nạp Đạn Liều Lĩnh', desc: 'Lăn Né thành nạp đầy ổ và xoay súng xả đạn quanh người (3 đv).' },
      { name: 'Bắn Nhanh', desc: 'Quạt Cò thành 3 viên liên thanh theo đường thẳng, lực giật đẩy Jack lùi 2 đv.' },
      { name: 'Tẩy Bài Cờ Bạc', desc: 'Xúc xắc ra ⚀: được gieo lại 1 lần.' },
    ],
    [
      { name: 'Viên Đạn Sinh Tử', desc: 'Viên Định Mệnh gây 500% (thay vì 350%); kết liễu tướng dưới 30% máu.' },
      { name: 'Ván Bài Lật Ngửa', desc: 'Nhà Cái Trả Thưởng hồi chiêu nhanh hơn 33%.' },
      { name: 'Tất Tay', desc: 'Dưới 40% máu: mỗi phát có thêm 50% cơ hội chí mạng.' },
    ],
    [
      { name: 'Cược Tất Tay', desc: 'Viên Định Mệnh nổ: dùng lại Cò Quay Nga để ném luôn khẩu súng phát nổ (bán kính 4), rồi mất 3s nhặt súng.' },
      { name: 'Thần Bạc Gian Lận', desc: 'Ổ 8 viên; xúc xắc luôn từ ⚂ tới ⚅.' },
      { name: 'Mạng Thứ Hai', desc: 'Đòn chí tử: kích phản lực bay lùi 5 đv với 1 máu và lá chắn (1 lần mỗi trận).' },
    ],
  ];
})();
