'use strict';
// ===== Percy — Nỏ • Xạ thủ • dồn sát thương, trận địa súng máy • mana • vật lý =====
// GĐ8: làm lại theo bản Di sản.
//   • Dồn Dập: sát thương gốc yếu nhưng chạy nhanh; mỗi phát trúng (đánh thường hoặc tên Trận Địa) +10% sát thương (tối đa 8 tầng),
//     mất hết nếu 2.5s không bắn trúng.
//   • Trận Địa Nỏ: ĐỨNG YÊN, tự bắn mọi kẻ địch trong vùng mỗi 0.15s (tối đa 5s) — đi là dừng. Chỉ hồi chiêu khi trận địa kết thúc.
//     Lướt Chiến Thuật dời trận địa theo; Móc & Đạp dùng được khi đang mở trận địa.
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const RUSH = 'percy_rush';
  const keep = (u) => (H.T(u, '6c') ? 4 : H.T(u, '1a') ? 3.5 : 2.5);
  const fieldR = (u) => {
    const rks = [10, 15, 18, 20, 25];
    const rk = Math.min(4, Math.max(0, (u.ranks && u.ranks.s1 ? u.ranks.s1 : 1) - 1));
    return rks[rk] * (H.T(u, '1b') ? 1.25 : 1);
  };
  const fieldDur = (u) => {
    const durs = [5, 8, 8, 8, 10];
    const rk = Math.min(4, Math.max(0, (u.ranks && u.ranks.s1 ? u.ranks.s1 : 1) - 1));
    return durs[rk];
  };
  const PER = 0.1, MAXS = 8;
  // một tầng Dồn Dập (mỗi phát trúng)
  function stack(m, u) {
    u.ws.lastHit = m.time;
    u.ws.stacks = Math.min(MAXS, (u.ws.stacks || 0) + 1);
    const s = m.addStatus(u, 'buff', 30, 1, { key: RUSH, mods: {} }); if (s) s.n = u.ws.stacks;
  }
  const rushK = (u) => 1 + PER * (u.ws.stacks || 0);
  function bolt(m, u, e, k, slow) {
    H.homing(m, u, e, { speed: 28, kind: 'arrow', onHit: (mm, p, x) => {
      mm.damage(u, x, u.st.ad * 0.24 * k * rushK(u), 'phys', { tag: 's1' });
      stack(mm, u);
      if (slow || H.T(u, '3c')) mm.addStatus(x, 'slow', 1, 0.4, { src: u, key: 'percy_rust' });
      if (H.T(u, '9c') && (x.ws && x.ws.hookedT > mm.time)) mm.addStatus(x, 'nodash', 3, 1, { src: u });
    } });
  }
  // một loạt của Trận Địa: tên vào kẻ địch gần nhất trong vùng (tướng trước); Liên Châu: 3 mũi tỏa sang kẻ địch gần đó
  function volley(m, u, x, y, k) {
    const list = m.enemiesIn(u.team, x, y, fieldR(u)).filter((e) => (e.kind !== 'monster' || e.aggro === u || u.attackTarget === e) && m.canHit(u, e))
      .sort((a, b) => (b.kind === 'hero') - (a.kind === 'hero') || M.dist2(a, { x, y }) - M.dist2(b, { x, y }) || a.id - b.id);
    if (!list.length) return;
    const multi = u.ws.ult > m.time ? (H.T(u, '9a') ? 5 : 3) : 1;
    for (let i = 0; i < multi; i++) bolt(m, u, list[i % Math.min(list.length, 3)], (i === 0 ? 1 : 0.6) * (k || 1));
  }
  function endField(m, u) {
    if (!(u.ws.field > m.time)) return;
    u.ws.field = 0; u.ws.hold = 0;
    if ((u.cd.s1 || 0) > 50) u.cd.s1 = m.cdOf(u, 's1');
    if (H.T(u, '3b')) { const x = u.x, y = u.y; m.zone({ owner: u, x, y, r: fieldR(u), life: 2, every: 0.15, kind: 'field', tick: (mm) => volley(mm, u, x, y, 0.7) }); }
  }
  H.def({
    id: 'percy', name: 'Percy', color: '#4ae0d0', gfx: 'crossbow', kit: 'marksman', pos: ['adc'], dmgType: 'phys',
    ranged: true, projSpeed: 26, projKind: 'arrow', r: 0.58, resource: 'mana',
    stats: { range: 6.0, hp: 560, hpG: 88, mp: 320, mpG: 40, ad: 54, adG: 3.3, armor: 26, armorG: 3.8, mr: 30, mrG: 1.3, as: 0.7, asG: 0.03, ms: 3.62 },
    passive: {
      name: 'Dồn Dập',
      desc: 'Sát thương gốc yếu nhưng chạy nhanh. Mỗi phát bắn trúng (đánh thường hoặc tên Trận Địa) +10% sát thương (tối đa 8 tầng = +80%); 2.5s không bắn trúng thì mất hết.',
      init(m, u) { u.ws.field = 0; u.ws.lastHit = -9; u.ws.stacks = 0; },
      update(m, u) {
        if (u.ws.stacks && m.time - u.ws.lastHit > keep(u)) { u.ws.stacks = 0; m.removeStatus(u, 'buff', RUSH); }
        // Trận Địa Nỏ: tự bắn khi đứng yên; đi thì dừng (trừ khi đang Lướt Chiến Thuật hoặc Pháo Thủ Biến Hóa)
        if (u.ws.field > 0) {
          if (m.time >= u.ws.field || !u.alive) { endField(m, u); return; }
          if (u.goal && !u.dash && !H.T(u, '12c')) { endField(m, u); return; }
          if (m.tick % (H.T(u, '12c') && u.goal ? 4 : 3) === 0) volley(m, u, u.x, u.y);
        }
      },
      onAuto(m, u, t, info) {
        info.amt *= rushK(u);
        stack(m, u);
        // Liên Châu: mỗi phát bắn ra 3 mũi (2 mũi phụ 60% tỏa sang kẻ địch gần đó, không có thì cùng vào mục tiêu)
        if (u.ws.ult > m.time) info.extra.push(() => { const others = m.enemiesIn(u.team, t.x, t.y, 3).filter((e) => e !== t); for (let i = 0; i < 2; i++) bolt(m, u, others[i] || t, 2.5); });
        if (H.T(u, '12b')) { const v = H.dirTo(u, t), amt = info.amt * 0.5; info.extra.push(() => m.hitLine(u, t.x, t.y, v.x, v.y, 5, 0.9, (e) => { if (e !== t) { m.damage(u, e, amt, 'phys', { tag: 'p', aoe: true }); m.knock(u, e, v.x, v.y, 0.8, 0.12); } }, { noFx: true })); }
      },
    },
    skills: {
      s1: {
        name: 'Trận Địa Nỏ', desc: 'ĐỨNG YÊN mở trận địa bán kính [10, 15, 18, 20, 25] tối đa [5, 8, 8, 8, 10]s: mỗi 0.15s tự bắn một mũi tên (24% SMVL, cộng Dồn Dập) vào kẻ địch gần nhất trong vùng. Di chuyển thì dừng (Lướt Chiến Thuật dời trận địa theo). Chỉ hồi chiêu khi trận địa kết thúc.',
        cd: [8, 7.5, 7, 6.5, 6], cost: [50, 50, 50, 50, 50], manualCd: true,
        can(m, u) { return !(u.ws.field > m.time); },
        use(m, u) {
          const dur = fieldDur(u), rad = fieldR(u);
          u.ws.field = m.time + dur; u.ws.hold = m.time + dur; u.goal = null; u.cd.s1 = 99;
          if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: rad, color: '#4ae0d0', life: dur, follow: u.id });
          // Phát Bắn Bùng Nổ: dùng lại để bắn phát pháo cuối, giật lùi và thả khói
          if (H.T(u, '6a')) m.allowRecast(u, 's1', dur, (mm, uu) => {
            const t = H.nearestEnemyHero(mm, uu, 7), v = t ? H.dirTo(uu, t) : { x: uu.fx, y: uu.fy };
            mm.hitCone(uu, uu.x, uu.y, v.x, v.y, 5, 0.5, (e) => { mm.damage(uu, e, H.amt(uu, 60 + 12 * uu.level, 0.8), 'phys', { tag: 's1', aoe: true }); mm.knock(uu, e, v.x, v.y, 2.5, 0.25); }, { color: '#4ae0d0' });
            endField(mm, uu); mm.dashTo(uu, uu.x - v.x * 3, uu.y - v.y * 3, 16, {}); mm.addStatus(uu, 'stealth', 1, 1, { key: 'percy_smoke' });
          });
        },
        ai: { use: 'burst', range: 10, aim: 'self', cond: (m, u, t) => { const d = M.dist(u, t); return d > 2.2 && d < fieldR(u) + t.r && !(u.ai && u.ai.fleeing); },
          recastWhen: (m, u, t) => t && t.kind === 'hero' && M.dist(u, t) < 3 },
      },
      s2: {
        name: 'Móc & Đạp', desc: 'Bắn móc 7 đv: kéo kẻ trúng về sát Percy, choáng 0.75s rồi đạp văng 3.5 đv. Dùng được khi đang mở Trận Địa.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [50, 50, 50, 50, 50], castTime: 0.12,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0.6);
          const go = (mm, pt) => H.shoot(mm, u, pt, { speed: 24, range: 7, r: 0.5, kind: 'hook', onHit: (m3, p, e) => {
            m3.damage(u, e, dmg * 0.4, 'phys', { tag: 's2' });
            if (e.ws) e.ws.hookedT = m3.time + 3;
            if (H.T(u, '6b')) { m3.addStatus(e, 'root', 1.5, 1, { src: u }); m3.addStatus(e, 'nodash', 3, 1, { src: u }); return; }   // Lưới Điện Trói Buộc
            if (H.T(u, '3a') && (e.dash || e.has('haste'))) { m3.addStatus(e, 'silence', 2, 1, { src: u }); m3.addStatus(e, 'stun', 1, 1, { src: u }); }
            const d = M.dist(u, e) - u.r - e.r - 0.4, v = H.dirTo(e, u);
            if (d > 0.2) m3.knock(u, e, v.x, v.y, d, 0.25);
            m3.addStatus(e, 'stun', 0.75, 1, { src: u });
            // đạp văng khi kéo tới nơi
            m3.later(0.42, (m4) => { if (!e.alive || !u.alive || M.dist(u, e) > 3.5) return; const w = H.dirTo(u, e); m4.damage(u, e, dmg * 0.6, 'phys', { tag: 's2' }); m4.knock(u, e, w.x, w.y, 3.5, 0.25); });
          } });
          go(m, ctx.pt);
          if (H.T(u, '9b')) m.allowRecast(u, 's2', 3, (mm, uu, c) => go(mm, c.pt));
        },
        ai: { use: 'cc', range: 6.6, aim: 'point', speed: 24, heroOnly: true, recastWhen: (m, u, t) => !!t },
      },
      s3: {
        name: 'Lướt Chiến Thuật', desc: 'Lướt 4 đv theo hướng chỉ định; dùng khi đang mở Trận Địa thì dời trận địa theo (không làm dừng).',
        cd: [6, 6, 5.5, 5.5, 5], cost: [30, 30, 30, 30, 30],
        use(m, u, ctx) {
          if (H.T(u, '1c')) u.cd.s3 = Math.max(0.5, u.cd.s3 - 1.5);
          const p = H.toward(u, ctx.pt, 4, false); m.dashTo(u, p.x, p.y, 20, { invuln: true });
          // Drone Phòng Vệ: bắn hạ đạn bay vào Percy trong 3s
          if (H.T(u, '12a')) m.zone({ owner: u, x: u.x, y: u.y, r: 3, life: 3, every: 0.1, follow: u, kind: 'drone',
            tick: (mm, z) => { for (const p of mm.projs) if (!p.dead && p.team !== u.team && M.dist(p, u) < 3 && (p.target === u || !p.target)) p.dead = true; } });
        },
        ai: { use: 'escape', range: 4, aim: 'away' },
      },
      s4: {
        name: 'Liên Châu', desc: '4s: mỗi phát đánh thường và mỗi loạt Trận Địa bắn ra 3 mũi tên thay vì 1 (mũi phụ 60%).',
        cd: [80, 70, 60], cost: [100, 100, 100],
        use(m, u) { u.ws.ult = m.time + 4; if (m.fxOn) { m.fx({ type: 'aura', id: u.id, color: '#4ae0d0', life: 4 }); m.fx({ type: 'callout', id: u.id, text: 'LIÊN CHÂU!', color: '#ffb84a' }); } },
        ai: { use: 'ult', aim: 'self', range: 6 },
      },
    },
    ai: { order: ['s1', 's3', 's2'], engageRange: 5.8, role: 'adc' },
    tags: ['autos'],
  });
  G.HEROES.percy.tree = [
    [
      { name: 'Bộ Đếm Tinh Vi', desc: 'Dồn Dập giữ được 3.5s (thay vì 2.5s) khi không bắn trúng.' },
      { name: 'Tầm Bắn Thần Tốc', desc: '+0.6 tầm bắn; Trận Địa Nỏ rộng hơn 25%.', stats: { range: 0.6 } },
      { name: 'Cơ Động Lách Trận', desc: 'Lướt Chiến Thuật hồi chiêu nhanh hơn 1.5s.' },
    ],
    [
      { name: 'Dây Cáp Điện Cao Thế', desc: 'Móc & Đạp trúng kẻ đang lướt hoặc tăng tốc: câm lặng 2s và choáng 1s.' },
      { name: 'Ụ Súng Gia Cố', desc: 'Rời Trận Địa Nỏ: trận địa vẫn tự bắn thêm 2s tại chỗ cũ.' },
      { name: 'Mũi Tên Gỉ Sét', desc: 'Tên của Trận Địa Nỏ làm chậm 40%.' },
    ],
    [
      { name: 'Phát Bắn Bùng Nổ', desc: 'Đang mở Trận Địa: dùng lại để bắn phát pháo cuối nổ hình nón đẩy lùi 2.5 đv; Percy giật lùi 3 đv và tàng hình 1s trong khói.' },
      { name: 'Lưới Điện Trói Buộc', desc: 'Móc & Đạp thành lưới điện: trói chân 1.5s và cấm lướt 3s (không kéo lại).' },
      { name: 'Hộp Đạn Dự Trữ', desc: 'Dồn Dập giữ được 4s khi bắn trượt.' },
    ],
    [
      { name: 'Bão Tên Vô Hạn', desc: 'Trong Liên Châu, mỗi loạt Trận Địa bắn 5 mũi (thay vì 3).' },
      { name: 'Móc Kép Tinh Xảo', desc: 'Móc & Đạp dùng được 2 lần liên tiếp (trong 3s).' },
      { name: 'Công Nghệ Áp Chế', desc: 'Kẻ vừa dính Móc & Đạp mà trúng tên Trận Địa trong 3s: cấm lướt 3s.' },
    ],
    [
      { name: 'Drone Phòng Vệ', desc: 'Lướt Chiến Thuật thả drone 3s, bắn hạ mọi đạn bay vào Percy.' },
      { name: 'Đạn Xuyên Phá', desc: 'Tên đánh thường xuyên qua mục tiêu: kẻ phía sau nhận 50% và bị đẩy nhẹ.' },
      { name: 'Pháo Thủ Biến Hóa', desc: 'Trận Địa Nỏ không bị dừng khi di chuyển (nhưng bắn chậm hơn 25% khi đang đi).' },
    ],
  ];
})();
