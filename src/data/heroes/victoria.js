'use strict';
// ===== Victoria — Cờ Lệnh • Hỗ trợ / Đường giữa • hào quang + lính tinh nhuệ • mana • vật lý =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const MODES = ['co', 'ar', 'luc'];
  const MODE_NAME = { co: '🚩 Cờ', ar: '🔥 AR', luc: '🔫 Lục' };
  const nSoldiers = (u) => (H.T(u, '9c') ? 4 : 3);
  const respawnT = (u) => (H.T(u, '12a') ? 20 : H.T(u, '1a') ? 22 : 30);
  function soldierThink(m, p) {
    const u = p.owner;
    if (!u || !u.alive) { p.goal = null; p.attackTarget = null; return; }
    if (p.thinkT > m.time) return;
    p.thinkT = m.time + 0.2;
    // Lính Tinh Nhuệ ở thế Cờ: tăng 25% tốc chạy, giảm 43% thời gian dính khống chế
    const isFlag = u.ws.mode === 'co';
    if (isFlag) {
      for (const s of p.statuses) {
        if (s.type === 'stun' || s.type === 'slow' || s.type === 'root' || s.type === 'silence') s.t = Math.max(0, s.t - 0.08);
      }
    }
    if (p.charge && p.charge.alive && m.time < p.chargeT) { p.attackTarget = p.charge; return; }
    // Hộ vệ & chia sẻ mục tiêu: nhắm đối thủ thật của Victoria, bao vây mục tiêu
    H.guardThink(m, p, {
      leash: 13, near: 7,
      follow: (mm, pp, uu) => {
        const t = uu.attackTarget;
        if (isFlag && t && t.alive && M.dist(uu, t) < 8) {
          const at = M.atan2(uu.y - t.y, uu.x - t.x), side = [0, 1.1, -1.1, 0][pp.slotI || 0];
          return { x: t.x + M.cos(at + Math.PI + side * 0.6) * 1.8, y: t.y + M.sin(at + Math.PI + side * 0.6) * 1.8 };
        }
        const a = pp.slotA;
        return { x: uu.x - uu.fx * 1.5 + M.cos(a) * 1.4, y: uu.y - uu.fy * 1.5 + M.sin(a) * 1.4 };
      }
    });
    // Trong thế Cờ cự ly gần: quét cận chiến
    if (isFlag && p.attackTarget && p.attackTarget.alive && M.dist(p, p.attackTarget) <= 2.2) {
      p.ranged = false; p.st.range = 2.2;
    } else {
      p.ranged = true; p.st.range = 4.0;
    }
  }
  function soldierBase(u) {
    const iron = u.ws.iron > 0, k = iron ? 2 : 1, cmd = H.T(u, '12a') ? 1.6 : 1;
    const isFlag = u.ws.mode === 'co';
    const msBonus = isFlag ? 1.25 : 1.0;
    return { hp: (165 + 27 * u.level) * k, armor: 16 + u.level, mr: 16 + u.level, ad: (10 + 2.1 * u.level + 0.1 * u.st.ad) * k * cmd, as: isFlag ? 1.0 : 0.8, ms: u.st.ms * msBonus, range: isFlag ? 2.2 : 4 };
  }
  function makeSoldier(m, u, i) {
    const a = i * 2.1;
    const isFlag = u.ws.mode === 'co';
    const p = new G.Unit(m, { kind: 'pet', team: u.team, x: u.x + M.cos(a), y: u.y + M.sin(a), r: 0.42, ranged: !isFlag, projSpeed: 22, base: soldierBase(u) });
    p.owner = u; p.name = 'Lính Tinh Nhuệ'; p.gfx = 'rifle'; p.color = '#e04a4a'; p.slotA = a; p.slotI = i; p.petThink = soldierThink;
    p.onDeath = (mm) => { u.ws.dead.push({ i, at: mm.time + respawnT(u) }); };
    m.addUnit(p); m.pets.push(p);
    return p;
  }
  const soldiers = (m, u) => m.pets.filter((p) => p.alive && p.owner === u && p.name === 'Lính Tinh Nhuệ');
  function reviveAll(m, u) {
    for (const d of u.ws.dead) makeSoldier(m, u, d.i);
    u.ws.dead = [];
  }
  function aura(m, u) {
    const md = u.ws.mode, k = 1 + u.level * 0.1;
    for (const a of H.alliesNear(m, u, 6, true)) {
      if (md === 'luc') m.addStatus(a, 'buff', 0.6, 1, { key: 'vic_aura', mods: { armor: 5 * k, mr: 5 * k } });
      else if (md === 'ar') m.addStatus(a, 'buff', 0.6, 1, { key: 'vic_aura', mods: { dmgAmp: 0.05 } });
      else { m.addStatus(a, 'haste', 0.6, 0.12, { key: 'vic_aura' }); m.addStatus(a, 'buff', 0.6, 1, { key: 'vic_aura', mods: { tenacity: 0.25 } }); }
    }
  }
  H.def({
    id: 'victoria', name: 'Victoria', color: '#e04a4a', gfx: 'flag', kit: 'support', pos: ['sup', 'mid'], dmgType: 'phys',
    ranged: false, projSpeed: 24, projKind: 'bullet', r: 0.58, resource: 'mana',
    stats: { range: 2.4, ad: 56, adG: 3.2, hp: 580 },
    passive: {
      name: 'Quân Lệnh & Cờ Chiến',
      desc: '3 Lính Tinh Nhuệ hộ vệ và chiến đấu cùng Victoria (chết thì 30s sau hồi sinh). Ưu tiên thế Cờ: Victoria và lính đánh cận chiến càn lướt, lính +25% tốc chạy và kháng khống chế. Hào quang (đồng minh trong 6 đv): 🚩 Cờ +12% tốc chạy, −25% thời gian bị khống chế • 🔥 AR +10% sát thương • 🔫 Lục +giáp/kháng phép.',
      init(m, u) { u.ws.mode = 'co'; u.ws.dead = []; u.ws.iron = 0; for (let i = 0; i < nSoldiers(u); i++) makeSoldier(m, u, i); },
      respawn(m, u) { reviveAll(m, u); },
      update(m, u) {
        if (u.ws.dead.length && u.ws.dead[0].at <= m.time) { const d = u.ws.dead.shift(); makeSoldier(m, u, d.i); }
        if (m.tick % 10 === 0) aura(m, u);
        const isFlag = u.ws.mode === 'co';
        u.ranged = !isFlag; u.st.range = isFlag ? 2.4 : 5.0;
        if (m.tick % 20 === 0) for (const p of soldiers(m, u)) { const keep = p.hpPct; p.base = soldierBase(u); p.calc(); p.hp = p.st.maxHp * keep; p.r = u.ws.iron > m.time ? 0.6 : 0.42; }
        if (u.ws.iron && m.time > u.ws.iron) u.ws.iron = 0;
        // Mệnh Lệnh Tuyệt Đối: tên lửa nã kẻ địch thấp máu nhất trong tầm nhìn mỗi 2s
        if (u.ws.iron > m.time && H.ready(m, u, 'missile', 2)) {
          const t = m.heroes.filter((h) => h.alive && h.team !== u.team && h.vis[u.team] && M.dist(h, u) < 15).sort((a, b) => a.hpPct - b.hpPct || a.id - b.id)[0];
          if (t) H.homing(m, u, t, { speed: 18, kind: 'shell', onHit: (mm, p, e) => mm.damage(u, e, 80 + 20 * u.level + 0.5 * u.st.ad, 'phys', { tag: 's4' }) });
        }
      },
      onAuto(m, u, t, info) { if (H.T(u, '12a')) info.amt *= 0.5; },
      onKill(m, u, v) { if (H.T(u, '12c') && v.kind === 'hero') reviveAll(m, u); },
      onFatal(m, u) {
        if (!H.T(u, '3b') || !H.ready(m, u, 'guard', 45)) return false;
        const s = soldiers(m, u).sort((a, b) => M.dist2(a, u) - M.dist2(b, u) || a.id - b.id)[0];
        if (!s) return false;
        s.hp = 0; m.kill(s, null); u.hp = 1; m.shield(u, u, 120 + 15 * u.level, 2);
        return true;
      },
    },
    skills: {
      s1: {
        name: 'Hỏa Lực Theo Dạng', desc: '🔫 Lục: 1 phát súng lục mạnh • 🔥 AR: loạt 5 viên hình nón • 🚩 Cờ: quét cờ hình vành khuyên (1.5–3.5 đv) làm chậm 30%.',
        cd: [6, 5.5, 5, 4.5, 4], cost: [40, 40, 40, 40, 40], castTime: 0.1,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([70, 105, 140, 175, 210]), 0.7), md = u.ws.mode, v = H.dirTo(u, ctx.pt);
          if (md === 'luc') {
            const t = ctx.tgt;
            if (H.T(u, '6b')) { H.shoot(m, u, ctx.pt, { speed: 30, range: 7, r: 0.4, pierce: true, kind: 'bullet', onHit: (mm, p, e) => { mm.damage(u, e, dmg, 'phys', { tag: 's1' }); mm.addStatus(e, 'vuln', 3, 0.2, { key: 'vic_crack', src: u }); } }); return; }
            if (t && t.alive) H.homing(m, u, t, { speed: 30, kind: 'bullet', onHit: (mm, p, e) => mm.damage(u, e, dmg, 'phys', { tag: 's1' }) });
          } else if (md === 'ar') {
            for (let i = 0; i < 5; i++) { const a = -0.3 + 0.15 * i, c = M.cos(a), s = M.sin(a); m.later(0.05 * i, (mm) => mm.proj({ owner: u, x: u.x, y: u.y, dx: v.x * c - v.y * s, dy: v.x * s + v.y * c, speed: 30, range: 6, r: 0.35, kind: 'bullet', onHit: (m3, p, e) => m3.damage(u, e, dmg * 0.32, 'phys', { tag: 's1' }) })); }
          } else {
            const amp = H.T(u, '9a') ? 1.4 : 1;
            m.hitCircle(u, u.x, u.y, 3.5, (e) => {
              if (M.dist(u, e) < 1.5) return;
              m.damage(u, e, dmg * 0.8 * amp * (H.T(u, '9a') && e.has('stun') ? 2 : 1), 'phys', { tag: 's1', aoe: true }); m.addStatus(e, 'slow', 1.5, 0.3, { src: u });
            }, { color: '#e04a4a' });
          }
        },
        ai: { use: 'poke', range: 5.5, aim: 'unit', farm: 3 },
      },
      s2: {
        name: 'Thiết Lập Thế Trận', desc: '🔫 Lục: lướt 3 đv + lá chắn • 🔥 AR: lựu đạn bán kính 2 đẩy lùi • 🚩 Cờ: cắm cờ trong 6 đv — đẩy lùi 1.5 đv và choáng 0.75s, tạo Vùng Đất Quân Lệnh 5s (đồng minh bên trong +15% tốc đánh).',
        cd: [12, 11.5, 11, 10.5, 10], cost: [60, 60, 60, 60, 60], castTime: 0.1,
        use(m, u, ctx) {
          const md = u.ws.mode, dmg = H.amt(u, ctx.v([60, 90, 120, 150, 180]), 0.5);
          if (md === 'luc') {
            const from = { x: u.x, y: u.y }, p = H.toward(u, ctx.pt, 3, false);
            m.dashTo(u, p.x, p.y, 18, {}); m.shield(u, u, 80 + 15 * u.level, 2);
            if (H.T(u, '6c')) m.zone({ owner: u, x: from.x, y: from.y, r: 2.5, life: 2.5, every: 0.25, kind: 'smoke', tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => mm.addStatus(e, 'blind', 0.4, 1, { src: u }), { noFx: true }) });
          } else if (md === 'ar') {
            const p = H.toward(u, ctx.pt, 6, true);
            m.later(0.4, (mm) => mm.hitCircle(u, p.x, p.y, 2, (e) => { mm.damage(u, e, dmg, 'phys', { tag: 's2', aoe: true }); const v = H.dirTo(p, e); mm.knock(u, e, v.x, v.y, 1.5, 0.2); }, { color: '#ff7a1a' }));
          } else {
            const p = H.toward(u, ctx.pt, 6, true);
            m.hitCircle(u, p.x, p.y, 2.5, (e) => { m.damage(u, e, dmg, 'phys', { tag: 's2', aoe: true }); const v = H.dirTo(p, e); m.knock(u, e, v.x, v.y, 1.5, 0.2); m.addStatus(e, 'stun', 0.75, 1, { src: u }); }, { color: '#e04a4a' });
            const z = m.zone({ owner: u, x: p.x, y: p.y, r: 3.5, life: 5, every: 0.25, kind: 'flag', tick: (mm, zz) => {
              for (const a of mm.heroes) if (a.alive && a.team === u.team && M.dist(a, zz) <= zz.r) mm.addStatus(a, 'buff', 0.4, 1, { key: 'vic_flag', mods: H.T(u, '3c') ? { asPct: 0.15, cdr: 0.2 } : { asPct: 0.15 } });
            } });
            // Thu Hồi Cờ Lệnh: nhổ cờ, giật kẻ địch gần cờ về phía Victoria
            if (H.T(u, '6a')) m.allowRecast(u, 's2', 5, (mm, uu) => {
              z.dead = true;
              for (const e of mm.enemiesIn(uu.team, z.x, z.y, 3.5)) { const v = H.dirTo(e, uu), d = Math.min(3, M.dist(e, uu) - 1.5); if (d > 0.3) mm.knock(uu, e, v.x, v.y, d, 0.3); }
            });
          }
        },
        ai: { use: 'cc', range: 6, aim: 'point', speed: 0, recastWhen: (m, u, t) => t && t.kind === 'hero' && M.dist(u, t) > 4 },
      },
      s3: {
        name: 'Tổng Lực Tác Chiến', desc: '🔫 Lục: pháo điện từ rơi sau 2s, bán kính 3, choáng 1s • 🔥 AR: bão lửa bán kính 3 trong 3s • 🚩 Cờ: lính xung phong vào mục tiêu, mỗi lính choáng 0.5s.',
        cd: [16, 15, 14, 13, 12], cost: [70, 70, 70, 70, 70], castTime: 0.15,
        use(m, u, ctx) {
          const md = u.ws.mode, dmg = H.amt(u, ctx.v([80, 120, 160, 200, 240]), 0.6), p = H.toward(u, ctx.pt, 8, true);
          if (md === 'luc') {
            const T = H.T(u, '9b') ? 1 : 2;
            m.telegraph({ team: u.team, x: p.x, y: p.y, r: 3, life: T, color: '#8ac0ff' });
            m.later(T, (mm) => mm.hitCircle(u, p.x, p.y, 3, (e) => { mm.damage(u, e, dmg, 'phys', { tag: 's3', aoe: true }); mm.addStatus(e, 'stun', 1, 1, { src: u }); }, { color: '#8ac0ff' }));
          } else if (md === 'ar') {
            m.zone({ owner: u, x: p.x, y: p.y, r: 3, life: 3, every: 0.5, kind: 'fire', tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => {
              mm.damage(u, e, dmg * 0.2, 'phys', { tag: 's3', aoe: true });
              if (H.T(u, '3a')) { mm.addStatus(e, 'slow', 0.6, 0.6, { src: u, key: 'vic_ar' }); mm.addStatus(e, 'nodash', 0.6, 1, { src: u }); }
            }, { noFx: true }) });
          } else {
            const t = ctx.tgt && ctx.tgt.alive ? ctx.tgt : H.nearestEnemyHero(m, u, 8);
            if (!t) return;
            for (const s of soldiers(m, u)) { s.charge = t; s.chargeT = m.time + 3; m.dashTo(s, t.x, t.y, 16, { onContact: (mm, ss, e) => { if (e !== t) return; mm.addStatus(e, 'stun', 0.5, 1, { src: u }); mm.damage(u, e, dmg * 0.25, 'phys', { tag: 's3' }); return 'stop'; } }); }
          }
        },
        ai: { use: 'cc', range: 7.5, aim: 'point', speed: 0, delay: 1.5 },
      },
      sub: {
        name: 'Chuyển Đổi Quân Lệnh', desc: 'Xoay Cờ → AR → Lục. Ưu tiên thế Cờ càn lướt cận chiến: gọi pháo kích • Sang AR: ném flash làm mù 1s • Sang Lục: lướt 2.5 đv + lá chắn.',
        cd: 4,
        use(m, u, ctx) {
          const next = MODES[(MODES.indexOf(u.ws.mode) + 1) % 3]; u.ws.mode = next;
          const t = H.nearestEnemyHero(m, u, 7);
          if (next === 'ar' && t) m.addStatus(t, 'blind', H.T(u, '1c') ? 1.75 : 1, 1, { src: u });
          else if (next === 'co' && t) { const p = { x: t.x, y: t.y }; m.later(0.6, (mm) => mm.hitCircle(u, p.x, p.y, 2, (e) => mm.damage(u, e, 40 + 10 * u.level + 0.3 * u.st.ad, 'phys', { tag: 'sub', aoe: true }), { color: '#e04a4a' })); }
          else if (next === 'luc') { const p = H.toward(u, ctx.pt, 2.5, false); m.dashTo(u, p.x, p.y, 16, {}); m.shield(u, u, 50 + 10 * u.level, 2); }
          if (m.fxOn) m.fx({ type: 'note', id: u.id, k: MODE_NAME[next] });
        },
        ai: { use: 'burst', aim: 'unit', range: 7, cond: (m, u, t) => {
          // Ưu tiên thế Cờ khi đối thủ ở cự ly gần (< 4 đv)
          if (t && M.dist(u, t) < 4 && u.ws.mode !== 'co') return true;
          return u.ws.mode !== 'co';
        } },
      },
      s4: {
        name: 'Mệnh Lệnh Tuyệt Đối', desc: 'Hồi sinh toàn bộ lính; 8s lính hóa Thiết Binh (gấp đôi máu và sát thương); tên lửa nã tướng địch thấp máu nhất trong tầm nhìn (15 đv) mỗi 2s.',
        cd: [120, 100, 80], cost: [100, 100, 100],
        use(m, u, ctx) {
          reviveAll(m, u); u.ws.iron = m.time + 8;
          for (const p of soldiers(m, u)) { p.base = soldierBase(u); p.calc(); p.hp = p.st.maxHp; }
          // Pháo Đài Di Động: laser quét 180° phía trước
          if (H.T(u, '12b')) { const v = H.dirTo(u, ctx.pt); m.hitCone(u, u.x, u.y, v.x, v.y, 7, 0, (e) => m.damage(u, e, H.amt(u, ctx.v([150, 250, 350]), 0.8), 'phys', { tag: 's4', aoe: true }), { color: '#ff3a3a' }); }
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#e04a4a', life: 8 });
        },
        ai: { use: 'ult', aim: 'unit', range: 8 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 3.5, role: 'support' },
    tags: ['cc'],
  });
  G.HEROES.victoria.modeName = MODE_NAME;
  G.HEROES.victoria.tree = [
    [
      { name: 'Tiếp Viện Khẩn Cấp', desc: 'Lính hồi sinh sau 22s (thay vì 30s).' },
      { name: 'Giáp Chống Bạo Động', desc: 'Lính +30% giáp và kháng phép.', tick(m, u) { for (const p of soldiers(m, u)) m.addStatus(p, 'buff', 0.6, 1, { key: 'vic_riot', mods: { armorPct: 0.3, mrPct: 0.3 } }); } },
      { name: 'Flash Cường Quang', desc: 'Flash khi đổi sang AR làm mù lâu hơn 0.75s.' },
    ],
    [
      { name: 'Lưới Đạn AR', desc: 'Bão lửa (S3 dạng AR) làm chậm 60% và cấm lướt.' },
      { name: 'Lá Chắn Thị Vệ', desc: 'Đòn chí tử: lính gần nhất lao vào chịu đòn thay và hy sinh (hồi 45s).' },
      { name: 'Cờ Khải Hoàn', desc: 'Đứng trong Vùng Đất Quân Lệnh: đồng minh hồi chiêu nhanh hơn 20%.' },
    ],
    [
      { name: 'Thu Hồi Cờ Lệnh', desc: 'Sau khi cắm cờ: dùng lại để nhổ cờ, giật kẻ địch gần cờ về phía Victoria.' },
      { name: 'Đạn Phá Giáp', desc: 'Phát súng lục (S1 dạng Lục) xuyên thấu và làm nứt giáp 3s: mục tiêu nhận thêm 20% sát thương từ cả đội.' },
      { name: 'Bọc Lót Chiến Thuật', desc: 'Lướt của Thiết Lập Thế Trận (dạng Lục) để lại khói làm mù kẻ địch.' },
    ],
    [
      { name: 'Trận Địa Donut Tử Thần', desc: 'Vành quét cờ +40% sát thương; mục tiêu đang choáng nhận gấp đôi.' },
      { name: 'Pháo Điện Từ Xuyên Âm', desc: 'Pháo điện từ rơi sau 1s (thay vì 2s).' },
      { name: 'Quân Đội Thép', desc: 'Thêm 1 Lính Tinh Nhuệ (tối đa 4).' },
    ],
    [
      { name: 'Bậc Thầy Chỉ Huy', desc: 'Victoria tự bắn yếu đi một nửa nhưng lính +60% sát thương và hồi sinh sau 20s.' },
      { name: 'Pháo Đài Di Động', desc: 'Mệnh Lệnh Tuyệt Đối thêm laser quét 180° phía trước (7 đv).' },
      { name: 'Kỷ Luật Sắt', desc: 'Hạ gục tướng: lập tức hồi sinh toàn bộ lính đã chết.' },
    ],
  ];
})();
