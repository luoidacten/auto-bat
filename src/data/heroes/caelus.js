'use strict';
// ===== Dr. Caelus — Tiên Tri Thuật Toán • pháp sư trận địa / kiểm soát tọa độ • Năng Lượng (mana) + Điểm Xác Suất • phép =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const HIST = 3.5;
  const cageR = (u) => (H.T(u, '3a') ? 6 : 4);
  function prob(u, v) { u.ws.prob = Math.max(0, Math.min(100, u.ws.prob + v)); }
  // ghi lại vị trí / máu / Hộ Giáp của mọi tướng mỗi 0.25s (cho Nghịch Đảo Dữ Liệu Thời Không)
  function record(m, u) {
    const H0 = u.ws.hist || (u.ws.hist = new Map());
    for (const h of m.heroes) {
      if (!h.alive) { H0.delete(h.id); continue; }
      const L = H0.get(h.id) || []; L.push({ t: m.time, x: h.x, y: h.y, hp: h.hp, ga: h.ga || 0 });
      while (L.length && L[0].t < m.time - HIST - 0.3) L.shift();
      H0.set(h.id, L);
    }
  }
  const past = (u, h) => { const L = u.ws.hist && u.ws.hist.get(h.id); return L && L.length && L[0]; };
  function rewind(m, u, t) {
    const p = past(u, t); if (!p) return false;
    m.blink(t, p.x, p.y);
    t.hp = Math.max(1, Math.min(t.st.maxHp, p.hp)); t.ga = Math.min(t.st.maxGa, p.ga);
    if (t.team !== u.team && H.T(u, '6a')) m.addStatus(t, 'nodash', 2.5, 1, { src: u });
    if (m.fxOn) m.fx({ type: 'callout', id: t.id, text: '⏪ Tua ngược', color: '#6ad8ff' });
    return true;
  }
  // Quá Tải Phân Tích: chiêu kế tiếp không tốn năng lượng và +25% sát thương phép
  function overload(m, u, key) {
    if (u.ws.prob < 100) return 1;
    u.ws.prob = 0; u.mp += m.costOf(u, key);
    return 1.25;
  }
  H.def({
    id: 'caelus', name: 'Dr. Caelus', color: '#4ad0ff', gfx: 'orb', kit: 'mage', pos: ['mid'], dmgType: 'magic',
    ranged: true, projSpeed: 20, projKind: 'data', r: 0.56, resource: 'mana',
    stats: { range: 5.8, hp: 545, ms: 3.35 },
    gauge: (u) => ({ v: u.ws.prob || 0, max: 100, label: 'Xác Suất', color: '#6ad8ff' }),
    passive: {
      name: 'Thuật Toán Sinh Tồn • Nhãn Cảm Lượng Tử',
      desc: 'Kẻ địch di chuyển / lướt trong 35 đv: +2 Điểm Xác Suất mỗi giây. Mỗi 25 điểm: giảm 5% sát thương nhận. Đủ 100 (Quá Tải Phân Tích): chiêu kế tiếp không tốn năng lượng và +25% sát thương phép. Đòn đánh lén đầu tiên từ kẻ rình trong bụi / trên cao không bao giờ bất ngờ được hắn (giảm 50%, mỗi 20s).',
      init(m, u) { u.ws.prob = 0; u.ws.hist = new Map(); u.ws.loopT = 0; },
      update(m, u) {
        if (m.tick % 5 === 0) record(m, u);
        if (m.tick % 10 !== 0) return;
        const mv = m.heroes.some((h) => h.alive && h !== u && M.dist(h, u) < 35 && (h.moved || h.dash));
        if (mv) prob(u, (H.T(u, '1a') ? 1.5 : 1) * 1);
        const k = Math.floor(u.ws.prob / 25), s = u.hasKey('cae_red');
        if (!s || s.n !== k) { m.removeStatus(u, 'reduce', 'cae_red'); if (k) { const st = m.addStatus(u, 'reduce', 9999, 0.05 * k, { key: 'cae_red' }); if (st) st.n = k; } }
        // Khởi Động Lại Hệ Thống
        if (H.T(u, '9c') && u.hpPct < 0.2 && m.time >= u.ws.loopT && m.time - (u.lastDmgT || -99) < 1) { u.ws.loopT = m.time + 120; rewind(m, u, u); }
      },
      onTake(m, u, att, info) {
        const a = att && (G.ownerOf ? G.ownerOf(att) : att);
        if (a && a.kind === 'hero' && a.team !== u.team && (a.bush >= 0 || a.hi) && !a.vis[u.team] && H.ready(m, u, 'ambush', 20)) info.amt *= 0.5;
      },
      onDeal(m, u, t, info) { if (H.T(u, '6b') && t.kind === 'hero' && (t.yNiem || 0) > (u.yNiem || 0)) info.amt *= 1.15; },
    },
    skills: {
      s1: {
        name: 'Ma Trận Khóa Tọa Độ', desc: 'Cắm Quả Cầu Lượng Tử xuống điểm cách tối đa 14 đv: lưới điện cảnh báo 0.6s rồi kích hoạt ma trận bán kính 4 đv — kẻ địch bên trong nhận sát thương phép và choáng 1.25s. Ma trận tồn tại 3.5s: kẻ địch trong vùng bị bẻ gãy lướt / dây móc.',
        cd: [12, 11, 10, 9, 9], cost: [50, 50, 50, 50, 50], castTime: 0.15,
        use(m, u, ctx) {
          const k = overload(m, u, 's1'), R = cageR(u), p = H.toward(u, ctx.pt, 14, true);
          const dmg = H.amt(u, ctx.v([70, 110, 150, 190, 230]), 0, 0.6) * k;
          m.telegraph({ x: p.x, y: p.y, r: R, life: 0.6, team: u.team });
          m.later(0.6, (mm) => {
            mm.hitCircle(u, p.x, p.y, R, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's1', aoe: true }); mm.addStatus(e, 'stun', 1.25, 1, { src: u }); }, { color: '#4ad0ff' });
            const cage = mm.zone({ owner: u, x: p.x, y: p.y, r: R, life: 3.5, every: 0.1, kind: 'cage', tick: (m3, z) => {
              m3.hitCircle(u, z.x, z.y, z.r, (e) => { m3.addStatus(e, 'nodash', 0.2, 1, { src: u, key: 'cae_cage' }); if (e.dash && !e.dash.cc) { e.dash = null; } }, { noFx: true });
            } });
            (u.ws.cages || (u.ws.cages = [])).push(cage);
            if (mm.fxOn) mm.fx({ type: 'ring', x: p.x, y: p.y, r: R, color: '#4ad0ff', life: 3.5 });
          });
        },
        ai: { use: 'cc', range: 13, aim: 'point', speed: 0, delay: 0.6 },
      },
      s2: {
        name: 'Phản Xạ Lượng Tử', desc: 'Khiên năng lượng chắn trước mặt 2.5s: chặn mọi đạn đạo tầm xa bay tới từ phía trước, 40% sát thương chặn được chuyển thành Hộ Giáp. Dùng lại khi khiên còn: phát nổ đẩy lùi kẻ cận chiến 5 đv, gây sát thương phép và làm chậm 40% 2s.',
        cd: [14, 13, 12, 11, 11], cost: [65, 65, 65, 65, 65],
        use(m, u, ctx) {
          const k = overload(m, u, 's2'), dmg = H.amt(u, ctx.v([60, 90, 120, 150, 180]), 0, 0.5) * k, conv = H.T(u, '3c') ? 0.65 : 0.4;
          const z = m.zone({ owner: u, x: u.x, y: u.y, r: 3, life: 2.5, every: 0.05, follow: u, kind: 'deflect', tick: (mm) => {
            for (const p of mm.projs) {
              if (p.dead || p.team === u.team || M.dist(p, u) > 2.5) continue;
              const dx = p.x - u.x, dy = p.y - u.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
              if (!H.T(u, '6c') && (dx * u.fx + dy * u.fy) / L < 0.2) continue;
              p.dead = true;
              const est = p.owner && p.owner.st ? p.owner.st.ad : 50;
              u.ga = Math.min(u.st.maxGa, (u.ga || 0) + est * conv);
            }
          } });
          m.allowRecast(u, 's2', 2.5, (mm, uu) => {
            z.dead = true;
            mm.hitCircle(uu, uu.x, uu.y, 3.5, (e) => { mm.damage(uu, e, dmg, 'magic', { tag: 's2', aoe: true }); mm.addStatus(e, 'slow', 2, 0.4, { src: uu }); const v = H.dirTo(uu, e); mm.knock(uu, e, v.x, v.y, 5, 0.35); }, { color: '#6ad8ff' });
          });
        },
        ai: { use: 'custom', aim: 'self', recastWhen: (m, u) => m.enemiesIn(u.team, u.x, u.y, 3.2, { heroesOnly: true }).some((e) => !e.ranged),
          pick: (m, u) => {
            const shots = m.projs.filter((p) => !p.dead && p.team !== u.team && M.dist(p, u) < 8).length;
            const melee = m.enemiesIn(u.team, u.x, u.y, 4, { heroesOnly: true }).some((e) => !e.ranged);
            return shots >= 1 || melee ? { pt: { x: u.x, y: u.y } } : null;
          } },
      },
      s3: {
        name: 'Tia Laser Phân Rã', desc: 'Tích năng lượng rồi bắn tia laser xuyên thấu dài 18 đv: sát thương phép lớn mọi mục tiêu trên đường, bỏ qua 50% Hộ Giáp. Trúng kẻ đang kẹt trong Ma Trận: nổ diện rộng và kéo dài ma trận thêm 1.5s.',
        cd: [8, 7.5, 7, 6.5, 6.5], cost: [45, 45, 45, 45, 45], castTime: 0.4,
        use(m, u, ctx) {
          const k = overload(m, u, 's3'), dmg = H.amt(u, ctx.v([80, 125, 170, 215, 260]), 0, 0.7) * k, v = H.dirTo(u, ctx.pt);
          m.hitLine(u, u.x, u.y, v.x, v.y, 18, 1.1, (e) => {
            m.damage(u, e, dmg, 'magic', { tag: 's3', byp: H.T(u, '9a') ? 0.8 : 0.5 });
            const c = (u.ws.cages || []).find((z) => !z.dead && M.dist(z, e) <= z.r);
            if (c) { c.life += 1.5; m.hitCircle(u, e.x, e.y, 2.5, (x) => { if (x !== e) m.damage(u, x, dmg * 0.5, 'magic', { tag: 's3', aoe: true }); }, { color: '#4ad0ff' }); }
          }, { color: '#4ad0ff' });
        },
        ai: { use: 'poke', range: 16, aim: 'point', speed: 0, delay: 0.4 },
      },
      s4: {
        name: 'Nghịch Đảo Dữ Liệu Thời Không', desc: 'Khóa một kẻ địch trong 16 đv (hoặc chính mình): sau 0.5s, mục tiêu bị cưỡng chế dịch chuyển về đúng vị trí và lượng Máu / Hộ Giáp của 3.5s trước — kẻ vừa uống bình hay vừa đu dây trốn bị giật về họng súng; dùng lên bản thân là mạng bảo hiểm.',
        cd: [90, 75, 60], cost: [100, 100, 100],
        use(m, u, ctx) {
          const k = overload(m, u, 's4');
          const t = ctx.tgt && ctx.tgt.kind === 'hero' && ctx.tgt !== u && M.dist(u, ctx.tgt) <= 16.5 ? ctx.tgt : u;
          if (m.fxOn) m.fx({ type: 'ring', x: t.x, y: t.y, r: 1.5, color: '#6ad8ff', life: 0.5 });
          m.later(0.5, (mm) => {
            if (!t.alive) return;
            rewind(mm, u, t);
            if (t !== u) mm.damage(u, t, H.amt(u, 100 + 20 * u.level, 0, 0.4) * k, 'magic', { tag: 's4' });
          });
        },
        ai: { use: 'custom', aim: 'unit', pick: (m, u, t) => {
          const me = past(u, u);
          if (me && u.hpPct < 0.3 && me.hp > u.hp + u.st.maxHp * 0.25 && m.time - (u.lastDmgT || -99) < 1.5) return { tgt: u, pt: { x: u.x, y: u.y } };
          if (!t || t.kind !== 'hero' || M.dist(u, t) > 16) return null;
          const p = past(u, t); if (!p) return null;
          const healed = t.hp > p.hp + t.st.maxHp * 0.2, fled = M.dist(u, t) - M.dist(u, p) > 6;
          return healed || fled ? { tgt: t, pt: { x: t.x, y: t.y } } : null;
        } },
      },
    },
    ai: { order: ['s3', 's1', 's2'], engageRange: 9, role: 'mage' },
    tags: ['cc', 'poke'],
  });
  G.HEROES.caelus.tree = [
    [
      { name: 'Thu Thập Dữ Liệu', desc: 'Tích Điểm Xác Suất nhanh hơn 50%.' },
      { name: 'Bước Nhảy Không Gian', desc: '+10% tốc chạy.', stats: { msPct: 0.1 } },
      { name: 'Máy Quét Rác Thải', desc: '+30% tầm nhìn.', stats: { visPct: 0.3 } },
    ],
    [
      { name: 'Lưới Điện Cường Hóa', desc: 'Ma Trận rộng 6 đv.' },
      { name: 'Tia Laser Phản Xạ', desc: '+15% sát thương phép.', stats: { magicAmp: 0.15 } },
      { name: 'Gia Cố Hộ Giáp', desc: 'Phản Xạ Lượng Tử chuyển 65% sát thương chặn được thành Hộ Giáp.' },
    ],
    [
      { name: 'Khóa Nghịch Đảo', desc: 'Kẻ bị tua ngược cấm lướt / dây móc 2.5s.' },
      { name: 'Phân Tích Điểm Yếu', desc: '+15% sát thương lên kẻ có vũ khí cấp cao hơn.' },
      { name: 'Tường Lửa Lượng Tử', desc: 'Khiên Phản Xạ chắn cả hai bên sườn.' },
    ],
    [
      { name: 'Laser Bào Mòn', desc: 'Tia Phân Rã bỏ qua 80% Hộ Giáp.' },
      { name: 'Dữ Liệu Vòng Bo', desc: 'Nhận ít hơn 30% sát thương bo.', stats: { zoneRed: 0.3 } },
      { name: 'Khởi Động Lại Hệ Thống', desc: 'Dưới 20% máu: tự tua ngược bản thân (120s).' },
    ],
    [
      { name: 'Kiến Trúc Sư Tuyệt Đối', desc: 'Phong cách: Ma Trận hồi nhanh hơn 40%.', stats: { cdr: 0.1 }, onSkill(m, u, k) { if (k === 's1' && u.cd.s1 > 0) u.cd.s1 *= 0.6; } },
      { name: 'Vòng Lặp Vô Tận', desc: 'Phong cách: hạ gục tướng bằng Tia Phân Rã hoặc chiêu cuối làm mới mọi hồi chiêu.', onKill(m, u, v) { if (v.kind === 'hero') for (const k of ['s1', 's2', 's3', 's4']) u.cd[k] = 0; } },
      { name: 'Tối Ưu Năng Lượng', desc: '+25% hồi năng lượng, −10% hồi chiêu.', stats: { cdr: 0.1 } },
    ],
  ];
})();
