'use strict';
// ===== Kazuki — Song Kiếm • Đường trên / Đi rừng • đấu sĩ phản đòn • KHÔNG MANA (Ý Niệm) • vật lý =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const COST = { s1: 10, s2: 15, s3: 25 };
  const regen = (u) => (H.T(u, '1a') ? 3.5 : 2);
  const memo = (u) => (H.T(u, '1b') ? 3 : 2);
  function spend(u, k) { u.ws.yn = Math.max(0, u.ws.yn - COST[k]); }
  function push(m, u, letter) {
    u.ws.seq = (u.ws.seq || []).filter((x) => m.time - x.t <= memo(u));
    u.ws.seq.push({ c: letter, t: m.time }); if (u.ws.seq.length > 2) u.ws.seq.shift();
  }
  // chém trúng đạn bay tới: phá hủy (Đoạt Mệnh Trảm Đạn: +8 Ý Niệm mỗi viên)
  function cutProj(m, u, v, R) {
    for (const p of m.projs) {
      if (p.dead || p.team === u.team) continue;
      const dx = p.x - u.x, dy = p.y - u.y;
      if (dx * dx + dy * dy > R * R || dx * v.x + dy * v.y < 0) continue;
      p.dead = true; if (H.T(u, '6c')) u.ws.yn = Math.min(100, u.ws.yn + 8);
    }
  }
  // Nghịch Trảm thành công: choáng kẻ tấn công, lướt xuyên qua, ảo ảnh chém liên hoàn, 2s sau vết chém nổ
  function parry(m, u, att) {
    m.addStatus(att, 'stun', 1, 1, { src: u });
    u.cd.s3 = 0; u.ws.ky = Math.min(10, (u.ws.ky || 0) + 5);
    if (m.fxOn) m.fx({ type: 'parry', id: u.id, x: u.x, y: u.y, color: '#bfe4ff' });
    const d = M.dist(u, att), v = H.dirTo(u, att);
    if (d < 4.5) { const L = Math.min(4.5, d + att.r + u.r + 0.8); m.later(0.05, (mm) => { if (u.alive && !u.disabled) mm.dashTo(u, u.x + v.x * L, u.y + v.y * L, 26, { untarget: true }); }); }
    for (let i = 0; i < 3; i++) m.later(0.1 + 0.12 * i, (mm) => {
      if (!att.alive) return;
      mm.damage(u, att, u.st.ad * 0.25, 'phys', { tag: 'sub' });
      if (mm.fxOn) mm.fx({ type: 'slash', x: att.x, y: att.y, a: i * 2.1, color: '#bfe4ff' });
    });
    m.later(2, (mm) => {
      if (!att.alive) return;
      mm.damage(u, att, H.amt(u, 60 + 10 * u.level, 0.6), 'phys', { tag: 'sub' });
      const w = H.dirTo(u, att); mm.knock(u, att, w.x, w.y, 1.5, 0.2);
      if (mm.fxOn) mm.fx({ type: 'boom', x: att.x, y: att.y, color: '#bfe4ff' });
    });
    if (H.T(u, '9b')) m.heal(u, u, u.st.maxHp * 0.1);
    if (H.T(u, '6a')) H.shoot(m, u, att, { speed: 22, range: 6, r: 0.7, pierce: true, kind: 'slashwave', onHit: (mm, p, e) => mm.damage(u, e, H.amt(u, 60 + 10 * u.level, 0.6), 'phys', { tag: 'sub' }) });
  }
  // Loạn Vũ Hư Ảnh: 5 ảo ảnh chém từ 5 hướng, khóa mục tiêu 1.5s rồi hất tung
  function loanVu(m, u, t, dmg) {
    u.ws.ky -= 5;
    m.addStatus(t, 'stun', 1.5, 1, { src: u });
    for (let i = 0; i < 5; i++) m.later(0.25 * i, (mm) => {
      if (!t.alive) return;
      mm.damage(u, t, dmg * 0.22, 'phys', { tag: 's3' });
      if (mm.fxOn) mm.fx({ type: 'phantom', x: t.x, y: t.y, a: i * 1.2566, color: '#9ad0ff' });
    });
    m.later(1.4, (mm) => { if (!t.alive) return; mm.knockup(u, t, 0.75); mm.damage(u, t, dmg * 0.5, 'phys', { tag: 's3' }); if (mm.fxOn) mm.fx({ type: 'boom', x: t.x, y: t.y, color: '#9ad0ff' }); });
  }
  H.def({
    id: 'kazuki', name: 'Kazuki', color: '#9ad0ff', gfx: 'twinblades', kit: 'fighter', pos: ['top', 'jungle'], dmgType: 'phys',
    ranged: false, r: 0.6, resource: 'none',
    stats: { hp: 595, hpG: 93, ad: 63, adG: 4.0, armor: 30, armorG: 3.9, as: 0.72, asG: 0.025, ms: 3.55, range: 1.6 },
    passive: {
      name: 'Song Kiếm Vô Niệm',
      desc: 'Đánh thường luân phiên tay trái (nhanh, 85%) / tay phải (nặng, 125%). Ý Niệm (0–100) tự hồi 2/giây, chiêu tốn Ý Niệm (S1 10 • S2 15 • S3 25). Kiếm Ý (0–10): +1 mỗi Kiếm Thế Quyết, +5 mỗi lần Nghịch Trảm thành công — đủ 5 thì Kiếm Thế Quyết đổi thành Loạn Vũ Hư Ảnh.',
      init(m, u) { u.ws.yn = 100; u.ws.hand = 0; u.ws.seq = []; u.ws.ky = 0; u.ws.guard = 0; },
      update(m, u, dt) { if (u.ws.yn < 100) u.ws.yn = Math.min(100, u.ws.yn + regen(u) * dt); },
      onAuto(m, u, t, info) {
        u.ws.hand ^= 1;
        if (u.ws.hand) { info.amt *= 0.85; info.extra.push(() => { u.atkT *= 0.6; }); } else info.amt *= 1.25;
      },
      // đang thủ thế Vô Tướng: đỡ đòn của tướng địch phía trước
      onTake(m, u, att, info) {
        if (!(u.ws.guard > m.time) || !att || att.team === u.team || (att.kind !== 'hero' && att.kind !== 'pet')) return;
        const v = { x: att.x - u.x, y: att.y - u.y }, L = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
        if ((v.x * u.fx + v.y * u.fy) / L < -0.2) return;                  // chỉ đỡ phía trước (nửa mặt trước)
        info.amt = 0;
        if (u.ws.guarded) return;
        u.ws.guarded = true; u.ws.guard = m.time + 0.2;                     // chặn nốt phần còn lại của cùng đòn
        parry(m, u, att);
      },
    },
    skills: {
      s1: {
        name: 'Tả Trảm', desc: 'Chém nhanh hình nón, gạt đạn nhỏ bay tới. Ghi nhịp "A" cho Kiếm Thế Quyết. Tốn 10 Ý Niệm.',
        cd: [3, 3, 3, 3, 3], castTime: 0.08,
        can(m, u) { return u.ws.yn >= COST.s1; },
        use(m, u, ctx) {
          spend(u, 's1'); push(m, u, 'A');
          const v = H.dirTo(u, ctx.pt), R = H.T(u, '1c') ? 3.1 : 2.6;
          m.hitCone(u, u.x, u.y, v.x, v.y, R, 0.45, (e) => m.damage(u, e, H.amt(u, ctx.v([40, 60, 80, 100, 120]), 0.5), 'phys', { tag: 's1' }), { color: '#bfe4ff' });
          cutProj(m, u, v, R);
        },
        ai: { use: 'burst', range: 2.4, aim: 'unit', farm: 3 },
      },
      s2: {
        name: 'Hữu Trảm', desc: 'Chém nặng, tầm rộng. Ghi nhịp "B". Tốn 15 Ý Niệm.',
        cd: [6, 5.75, 5.5, 5.25, 5], castTime: 0.18,
        can(m, u) { return u.ws.yn >= COST.s2; },
        use(m, u, ctx) {
          spend(u, 's2'); push(m, u, 'B');
          const v = H.dirTo(u, ctx.pt), R = H.T(u, '1c') ? 3.6 : 3.0;
          m.hitCone(u, u.x, u.y, v.x, v.y, R, 0.15, (e) => m.damage(u, e, H.amt(u, ctx.v([70, 105, 140, 175, 210]), 0.8), 'phys', { tag: 's2' }), { color: '#9ad0ff' });
          if (H.T(u, '6c')) cutProj(m, u, v, R);
        },
        ai: { use: 'burst', range: 2.8, aim: 'unit', farm: 3 },
      },
      s3: {
        name: 'Kiếm Thế Quyết', desc: 'Theo 2 nhịp trước: AA xoay 360° • AB đâm 4.5 đv choáng 1s • BA chém chữ X gây Vết Thương Sâu • BB lướt xuyên 4 đv choáng 1s; không có nhịp thì chém thường. Đủ 5 Kiếm Ý: tốn 5 để tung Loạn Vũ Hư Ảnh — 5 ảo ảnh chém từ 5 hướng, khóa mục tiêu 1.5s rồi hất tung. Mỗi lần dùng giảm 4s hồi chiêu S4. Tốn 25 Ý Niệm.',
        cd: [10, 9.5, 9, 8.5, 8], castTime: 0.12,
        can(m, u) { return u.ws.yn >= COST.s3; },
        use(m, u, ctx) {
          spend(u, 's3');
          const seq = (u.ws.seq || []).filter((x) => m.time - x.t <= memo(u)).map((x) => x.c).join('');
          u.ws.seq = [];
          u.cd.s4 = Math.max(0, (u.cd.s4 || 0) - (H.T(u, '12c') ? 8 : 4));
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0.8);
          // đủ 5 Kiếm Ý và có tướng địch trong tầm: Loạn Vũ Hư Ảnh
          const lt = ctx.tgt && ctx.tgt.kind === 'hero' && ctx.tgt.alive && M.dist(u, ctx.tgt) < 3.6 + ctx.tgt.r ? ctx.tgt : null;
          if (u.ws.ky >= 5 && lt) { loanVu(m, u, lt, dmg); return; }
          u.ws.ky = Math.min(10, (u.ws.ky || 0) + 1);
          const iaido = H.T(u, '12a');
          const form = iaido ? 'BB' : seq;
          if (form === 'AA') {
            const R = H.T(u, '9c') ? 3.9 : 2.8;
            m.hitCircle(u, u.x, u.y, R, (e) => {
              m.damage(u, e, dmg, 'phys', { tag: 's3', aoe: true });
              if (H.T(u, '9c')) { const w = H.dirTo(e, u), d = M.dist(e, u) - 1.5; if (d > 0.2) m.knock(u, e, w.x, w.y, Math.min(1.2, d), 0.2); }
            }, { color: '#bfe4ff' });
          } else if (form === 'AB') {
            m.hitLine(u, u.x, u.y, v.x, v.y, 4.5, 1.1, (e) => {
              m.damage(u, e, dmg, 'phys', { tag: 's3' }); m.addStatus(e, 'stun', 1, 1, { src: u });
              if (H.T(u, '3a')) { m.removeStatus(e, 'shield'); m.addStatus(e, 'buff', 3, 1, { key: 'kaz_pg', mods: { armorPct: -0.2 } }); }
            }, { color: '#9ad0ff' });
          } else if (form === 'BA') {
            m.hitCone(u, u.x, u.y, v.x, v.y, 3, 0.5, (e) => {
              m.damage(u, e, dmg * 1.15, 'phys', { tag: 's3' }); m.addStatus(e, 'wound', 3, 1, { src: u });
              if (H.T(u, '3b')) m.dot(u, e, e.st.maxHp * 0.02, 3, 'phys', 'kaz_bleed');
            }, { color: '#bfe4ff' });
          } else if (form === 'BB') {
            const L = iaido ? 5 : 4, st = iaido ? 0.75 : 1;
            m.dashTo(u, u.x + v.x * L, u.y + v.y * L, 22, { onContact: (mm, uu, e) => { mm.damage(u, e, dmg, 'phys', { tag: 's3' }); mm.addStatus(e, 'stun', st, 1, { src: u }); } });
          } else m.hitCone(u, u.x, u.y, v.x, v.y, 2.6, 0.4, (e) => m.damage(u, e, dmg * 0.7, 'phys', { tag: 's3' }), { color: '#bfe4ff' });
          // Vạn Kiếm Quy Nhất: dùng lại để lướt ngược chém kết liễu từ trên không
          if (H.T(u, '6b')) m.allowRecast(u, 's3', 1.5, (mm, uu) => {
            const t = H.nearestEnemyHero(mm, uu, 5); if (!t) return;
            mm.dashTo(uu, t.x, t.y, 24, { onContact: (m3, u3, e) => { if (e !== t) return; m3.damage(u3, e, H.amt(u3, 40 + 8 * u3.level, 0.6) + (e.st.maxHp - e.hp) * 0.1, 'phys', { tag: 's3' }); return 'stop'; } });
          });
        },
        ai: { use: 'burst', range: 2.8, aim: 'unit', recastWhen: (m, u, t) => t && t.kind === 'hero' && t.hpPct < 0.3 },
      },
      sub: {
        name: 'Vô Tướng Nghịch Trảm', desc: 'Thủ thế song kiếm 0.6s. Đỡ trúng đòn đánh hay chiêu của tướng địch phía trước: chặn sát thương, CHOÁNG kẻ đó 1s, lướt xuyên qua để ảo ảnh chém liên hoàn — 2s sau vết chém nổ tung (60 +10/cấp, +60% SMVL) và đẩy văng; hồi ngay Kiếm Thế Quyết, +5 Kiếm Ý. Đỡ hụt: khựng 0.3s.',
        cd: (m, u) => (H.T(u, '3c') ? 10 : 14), cdText: 14,
        use(m, u, ctx) {
          u.ws.guard = m.time + 0.6; u.ws.guarded = false;
          m.addStatus(u, 'root', 0.6, 1, { key: 'kaz_guard' });
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#bfe4ff', life: 0.6 });
          m.later(0.62, (mm) => { if (u.alive && !u.ws.guarded) mm.addStatus(u, 'slow', 0.3, 0.6, { key: 'kaz_stagger' }); });
        },
        // đọc đòn: tướng địch phía trước đang vung đòn/niệm chiêu vào mình, hoặc đạn sắp trúng
        ai: { use: 'custom', pick(m, u, t, fleeing, ai) {
          for (const e of ai.enemiesNear || []) {
            const d = M.dist(u, e); if (d > 5) continue;
            const atk = (e.windup && e.windup.target === u && d < 3.5) || (e.cast && e.cast.key !== 'recall' && d < 4.5 && ((u.x - e.x) * e.fx + (u.y - e.y) * e.fy) > 0);
            if (atk && m.rngAI.next() < 0.25 + 0.6 * ai.sk('meca')) return { pt: { x: e.x, y: e.y }, tgt: e };
          }
          for (const p of m.projs) {
            if (p.dead || p.team === u.team || !p.owner || p.owner.kind !== 'hero') continue;
            const dx = u.x - p.x, dy = u.y - p.y, d2 = dx * dx + dy * dy;
            if (d2 > 9) continue;
            if (p.target ? p.target === u : (dx * p.dx + dy * p.dy) > 0 && Math.abs(dx * p.dy - dy * p.dx) < p.r + u.r) return { pt: { x: p.x, y: p.y } };
          }
          return null;
        } },
      },
      s4: {
        name: 'Vạn Cảnh Trảm Vực', desc: 'Lướt 6 đv, để lại vùng loạn kiếm bán kính 3 trong 4s: sát thương liên tục, hút nhẹ về tâm, cấm lướt.',
        cd: [110, 90, 75], castTime: 0.1,
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 6, true), from = { x: u.x, y: u.y };
          const c = { x: (from.x + p.x) / 2, y: (from.y + p.y) / 2 };
          const tick = H.amt(u, ctx.v([30, 45, 60]), 0.2);
          m.dashTo(u, p.x, p.y, 24, { untarget: true, onContact: (mm, uu, e) => mm.damage(u, e, tick * 2, 'phys', { tag: 's4' }) });
          // Trảm Đoạn Thời Không: mục tiêu yếu → đóng băng vùng 1s
          if (H.T(u, '12b')) for (const e of m.enemiesIn(u.team, c.x, c.y, 3.5, { heroesOnly: true })) if (e.hpPct < 0.5) m.addStatus(e, 'stun', 1, 1, { src: u });
          let n = 0;
          m.zone({ owner: u, x: c.x, y: c.y, r: 3, life: 4, every: 0.5, kind: 'blades',
            tick: (mm, z) => {
              n++;
              mm.hitCircle(u, z.x, z.y, z.r, (e) => {
                mm.damage(u, e, tick, 'phys', { tag: 's4', aoe: true });
                mm.addStatus(e, 'nodash', 0.6, 1, { src: u });
                const v = H.dirTo(e, z), d = M.dist(e, z); if (d > 0.6) mm.knock(u, e, v.x, v.y, Math.min(0.5, d), 0.1);
                if (H.T(u, '9a') && n % 2 === 0 && e.kind === 'hero') mm.addStatus(e, 'silence', 0.5, 1, { src: u });
              }, { noFx: true });
            } });
        },
        ai: { use: 'ult', aim: 'point', speed: 0, range: 6, aoe: 3 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 4, role: 'fighter', bait: true, guard: (m, u) => (u.ws.guard > m.time ? { t: u.ws.guard - m.time, punish: true } : null) },
    tags: ['dive'],
  });
  G.HEROES.kazuki.tree = [
    [
      { name: 'Tĩnh Tâm', desc: 'Ý Niệm tự hồi 3.5/giây (thay vì 2).' },
      { name: 'Kéo Dài Nhịp', desc: 'Chuỗi nhịp kiếm thế được nhớ 3s (thay vì 2s).' },
      { name: 'Kiếm Phong', desc: 'Tả Trảm và Hữu Trảm quét xa hơn 20%.' },
    ],
    [
      { name: 'Phá Giáp Xung Kích', desc: 'Thế đâm AB phá mọi lá chắn và giảm 20% giáp mục tiêu 3s.' },
      { name: 'Huyết Trảm', desc: 'Thế chữ X BA gây Chảy Máu 2% máu tối đa/giây trong 3s.' },
      { name: 'Thấu Thị', desc: 'Vô Tướng Nghịch Trảm (skill phụ) hồi 10s (thay vì 14s).' },
    ],
    [
      { name: 'Trảm Khí Nghịch Chuyển', desc: 'Nghịch Trảm thành công: phóng kiếm khí chữ X 6 đv về phía kẻ tấn công.' },
      { name: 'Vạn Kiếm Quy Nhất', desc: 'Sau Kiếm Thế Quyết, trong 1.5s dùng lại: lướt ngược chém kết liễu từ trên không (+10% máu đã mất).' },
      { name: 'Đoạt Mệnh Trảm Đạn', desc: 'Tả Trảm và Hữu Trảm chém tan đạn bay tới, mỗi viên hồi 8 Ý Niệm.' },
    ],
    [
      { name: 'Kiếm Vực Giam Cầm', desc: 'Vùng loạn kiếm của S4 câm lặng tướng bên trong mỗi giây.' },
      { name: 'Bất Diệt Ý Niệm', desc: 'Nghịch Trảm thành công hồi 10% máu tối đa.' },
      { name: 'Bát Hướng Phân Thân', desc: 'Thế xoay AA rộng hơn 40% và hút kẻ địch vào.' },
    ],
    [
      { name: 'Tuyệt Kỹ Iaido', desc: '+12% tốc chạy; Kiếm Thế Quyết không cần nhịp mồi: luôn lướt chém xuyên 5 đv choáng 0.75s.', stats: { msPct: 0.12 } },
      { name: 'Trảm Đoạn Thời Không', desc: 'Vạn Cảnh Trảm Vực: tướng địch dưới 50% máu trong vùng bị đóng băng (choáng) 1s ngay khi đặt.' },
      { name: 'Đạo Kiếm Hợp Nhất', desc: 'Mỗi lần dùng Kiếm Thế Quyết giảm 8s hồi chiêu S4 (thay vì 4s).' },
    ],
  ];
})();
