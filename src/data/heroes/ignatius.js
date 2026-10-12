'use strict';
// ===== Ignatius — Trượng Lửa • Đường giữa • pháp sư dồn sát thương • mana • phép =====
(function () {
  const G = globalThis.G, H = G.H;
  const BURN = 'ign_burn';
  // GĐ12: HỎA ẤN CỘNG DỒN VÔ HẠN — mỗi tầng trên mục tiêu; thiêu đốt 3s với (7 + 2/cấp + 0.5 × số tầng) sát thương phép/giây;
  // đủ mỗi bội số 6 tầng (6, 12, 18…) → Hỏa Bạo nổ bán kính 2.5 + trừ 25% Kháng Phép 4s; ấn tự tan sau 5s + 0.25s/cấp không nhận tầng mới
  function burn(m, u, e, n) {
    if (!e || !e.alive || e.kind === 'tower' || e.kind === 'nexus') return;
    n = n || 1;
    // Pháp Sư Trọng Lực: không thiêu, tích tầng Trọng Lực (nhận thêm sát thương, chậm dần)
    if (H.T(u, '12b')) {
      const s = m.addStatus(e, 'vuln', 5, 0, { key: 'ign_grav', src: u, stack: 'add', max: 6 });
      if (s) s.v = 0.06 * s.n;
      m.addStatus(e, 'slow', 5, 0.05 * (s ? s.n : 1), { src: u, key: 'ign_grav_s' });
      return;
    }
    const life = 5 + 0.25 * u.level;
    let mk = e.statuses.find((x) => x.key === 'ign_mark' && x.src === u);
    const before = mk ? mk.n || 0 : 0;
    if (!mk) mk = m.addStatus(e, 'mark', life, 1, { key: 'ign_mark', src: u });
    if (!mk) return;
    mk.n = before + n; mk.t = life; mk.dur = Math.max(mk.dur || 0, life);
    const dps = (7 + 2 * u.level + 0.5 * mk.n) * (H.T(u, '1b') ? 1.25 : 1);
    m.removeStatus(e, 'dot', BURN);
    m.addStatus(e, 'dot', H.T(u, '9a') ? 6 : 3, dps, { key: BURN, src: u, tick: 0.5, dtype: 'magic' });
    if (H.T(u, '6c')) m.addStatus(e, 'slow', 3, 0.2, { src: u, key: 'ign_soul' });
    if (Math.floor(mk.n / 6) > Math.floor(before / 6)) {
      const x = e.x, y = e.y;
      m.later(0, (mm) => {
        mm.hitCircle(u, x, y, 2.5, (o) => mm.damage(u, o, H.amt(u, 60 + 18 * u.level, 0, 0.6), 'magic', { tag: 'p', aoe: true, noHook: true }), { color: '#ff3a0a' });
        if (e.alive) mm.addStatus(e, 'buff', 4, 1, { key: 'ign_mrdown', mods: { mrPct: -0.25 } });
        if (mm.fxOn) mm.fx({ type: 'boom', x, y, big: false });
      });
      u.stats.ignBoom = (u.stats.ignBoom || 0) + 1;
    }
  }
  H.def({
    id: 'ignatius', name: 'Ignatius', color: '#ff7a3a', gfx: 'staff', kit: 'mage', pos: ['mid'], dmgType: 'magic',
    ranged: true, projSpeed: 16, projKind: 'fire', r: 0.62, resource: 'mana',
    stats: { range: 5.5, hp: 540, hpG: 84, mp: 420, mpG: 50, ad: 52, adG: 3, armor: 22, armorG: 3.6, mr: 30, mrG: 1.4, as: 0.63, asG: 0.015, ms: 3.35 },
    passive: {
      name: 'Hỏa Ấn & Bộc Phá Vô Tận',
      desc: 'Đòn đánh thường gây sát thương phép và găm 1 tầng Hỏa Ấn; chiêu găm thêm tầng. Hỏa Ấn cộng dồn VÔ HẠN: thiêu (7 +2/cấp +0.5 × số tầng) sát thương phép/giây trong 3s. Mỗi khi đủ bội số 6 tầng (6, 12, 18…): Hỏa Bạo nổ bán kính 2.5 và trừ 25% Kháng Phép nạn nhân 4s. Ấn tự tan sau 5s +0.25s/cấp nếu không nhận tầng mới. Vừa đi vừa niệm phép.',
      onAuto(m, u, t, info) { info.type = 'magic'; info.extra.push(() => burn(m, u, t, 1)); },
    },
    skills: {
      s1: {
        name: 'Cầu Lửa', desc: 'Ném cầu lửa cực nhanh tầm 10 đv, nổ lan bán kính 1.8/2.0/2.2/2.2/2.6, găm 2 tầng Hỏa Ấn lên mọi kẻ địch trong vùng.',
        cd: [5.5, 5, 4.5, 4, 3.5], cost: [50, 55, 60, 65, 70], castTime: 0.2, castMove: 1,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([65, 100, 135, 170, 205]), 0, 0.6);
          const R = ctx.v([1.8, 2.0, 2.2, 2.2, 2.6]);
          const boom = (mm, p) => { if (p.boomed) return; p.boomed = true; p.dead = true; mm.hitCircle(u, p.x, p.y, R, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's1', aoe: true }); burn(mm, u, e, 2); }, { color: '#ff8a2a' }); };
          const pr = H.shoot(m, u, ctx.pt, { speed: H.T(u, '1a') ? 30 : 22, range: 10, r: 0.5, kind: 'fireball', onHit: boom, onEnd: boom });
          // Kích Nổ Cầu Lửa: dùng lại để nổ ngay giữa đường bay
          if (H.T(u, '6b')) { u.ws.fb = pr; m.allowRecast(u, 's1', 0.6, (mm) => { if (!pr.dead) boom(mm, pr); }); }
        },
        ai: { use: 'poke', range: 10, aim: 'point', speed: 22, farm: 3,
          recastWhen: (m, u, t) => { const p = u.ws.fb; return !!(p && !p.dead && t && G.M.dist(p, t) < 1.9); } },
      },
      s2: {
        name: 'Đại Hỏa Cầu', desc: 'Tích tụ tối đa 2s (vẫn đi được, chậm 50%): càng tích càng to, đau và bay xa — tầm 10→20 đv (cấp 1) tới 20→50 đv (cấp tối đa), bán kính nổ 1.8–2.6 lên 3/4/5/6/8 đv, sát thương 80–100% lên 200/225/225/250/300% SMPT; +25% lên mục tiêu dưới 30% máu. Điểm nổ để lại Biển Lửa 4s găm Hỏa Ấn.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [70, 75, 80, 85, 90], castMove: 0.5,
        castTime: (m, u) => (u.ai ? u.ai.chargeTime(2) : 1),
        use(m, u, ctx) {
          const c = Math.min(1, (u.ai ? u.ai.lastCharge : 1) / 2), rk = ctx.rank || 1;
          const r0 = [10, 12.5, 15, 17.5, 20][rk - 1], r1 = [20, 27.5, 35, 42.5, 50][rk - 1];
          const far = r0 + (r1 - r0) * c, R = 1.8 + 0.8 * Math.min(1, c * 2) * 0 + (ctx.v([3, 4, 5, 6, 8]) - 1.8) * c + 0.8 * (1 - c) * 0;
          const ap = 0.8 + 0.2 * Math.min(1, c * 2) + (ctx.v([2, 2.25, 2.25, 2.5, 3]) - 1) * c;
          const dmg = H.amt(u, ctx.v([60, 90, 120, 150, 180]) * (0.6 + 0.4 * c), 0, ap);
          const t = ctx.tgt && ctx.tgt.alive ? ctx.tgt : null;
          const aim = t && u.ai && !u.ctl ? u.ai.lead(t, 16) : ctx.pt;
          const hit = (mm, p) => {
            mm.hitCircle(u, p.x, p.y, R, (e) => { mm.damage(u, e, dmg * (e.hpPct < 0.3 ? 1.25 : 1), 'magic', { tag: 's2', aoe: true }); burn(mm, u, e, 2); }, { color: '#ff5a1a' });
            mm.zone({ owner: u, x: p.x, y: p.y, r: Math.max(1.8, R * 0.7), life: 4, every: 0.5, kind: 'fire',
              tick: (m3, z) => m3.hitCircle(u, z.x, z.y, z.r, (e) => { m3.damage(u, e, 8 + 2 * u.level, 'magic', { tag: 's2', aoe: true, noHook: true }); if (m3.tick % 20 === 0) burn(m3, u, e, 1); }, { noFx: true }) });
          };
          const boom = (mm, p) => {
            if (p.boomed) return; p.boomed = true; p.dead = true;
            // Hố Đen Tro Tàn: tích tối đa → hút kẻ địch trong 4 đv vào tâm rồi mới nổ
            if (H.T(u, '12a') && c >= 0.9) {
              for (const e of mm.enemiesIn(u.team, p.x, p.y, 4)) { const d = G.M.dist(e, p); if (d > 0.6) { const v = H.dirTo(e, p); mm.knock(u, e, v.x, v.y, d - 0.5, 0.4); } }
              const q = { x: p.x, y: p.y }; mm.later(0.45, (m3) => hit(m3, q));
              mm.telegraph({ team: u.team, x: p.x, y: p.y, r: 4, life: 0.45, color: '#601010' });
              return;
            }
            hit(mm, p);
          };
          const tgtD = aim ? Math.min(far, G.M.dist(u, aim)) : far;
          H.shoot(m, u, aim, { speed: 16, range: Math.max(4, tgtD), r: 0.6 + 0.6 * c, kind: 'bigfire', onHit: boom, onEnd: boom,
            // Đại Hỏa Cầu Phá Đạn: thiêu hủy đạn địch bay qua
            onTick: H.T(u, '3c') ? (mm, p) => { for (const q of mm.projs) if (!q.dead && q.team !== u.team && Math.abs(q.x - p.x) < p.r + 0.5 && Math.abs(q.y - p.y) < p.r + 0.5) q.dead = true; } : null });
        },
        ai: { use: 'burst', range: 14, aim: 'point', speed: 16, farm: 4 },
      },
      s3: {
        name: 'Dịch Chuyển', desc: 'Dịch chuyển tức thời 5 đv; điểm đến nổ sóng nhiệt đẩy lùi 1.5 đv, +30% tốc chạy 1s. Tích trữ tối đa 2/2/3/3/4 lần dùng (hồi 1 lần mỗi 14→10s).',
        cd: [14, 13, 12, 11, 10], cost: [60, 60, 60, 60, 60], charges: (u) => [2, 2, 3, 3, 4][Math.max(0, (u.ranks.s3 || 1) - 1)],
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, H.T(u, '1c') ? 6.5 : 5, true), from = { x: u.x, y: u.y };
          const dmg = H.amt(u, ctx.v([40, 60, 80, 100, 120]), 0, 0.3);
          m.blink(u, p.x, p.y);
          m.hitCircle(u, u.x, u.y, 2, (e) => { m.damage(u, e, dmg, 'magic', { tag: 's3' }); const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 1.5, 0.2); burn(m, u, e); }, { color: '#ffb05a' });
          m.addStatus(u, 'haste', 1, 0.3);
          if (H.T(u, '3b')) m.later(0.3, (mm) => mm.hitCircle(u, from.x, from.y, 2, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's3', aoe: true }); burn(mm, u, e); }, { color: '#ff9a3a' }));   // Hư Ảnh Cháy Bùng
          if (H.T(u, '9c')) u.cd.s1 = 0;                                                                                                                                                    // Tia Lửa Ma Thuật
        },
        ai: { use: 'escape', range: 5, aim: 'away' },
      },
      sub: {
        name: 'Vòng Lửa', desc: 'Bùng vòng lửa tự vệ quanh thân (bán kính 3): 30 (+8/cấp, +30% SMPT) sát thương phép, găm Hỏa Ấn, hất tung và đẩy kẻ áp sát văng xa 4 đv +0.3 đv/cấp — tạo khoảng trống an toàn để tích Đại Hỏa Cầu.',
        cd: 12, cost: 40,
        use(m, u, ctx) {
          const close = m.enemiesIn(u.team, u.x, u.y, 3, { heroesOnly: true });
          if (H.T(u, '6a') && close.length) {   // Tường Lửa Chắn Lối: dựng tường lửa giữa Ignatius và kẻ áp sát
            const v = H.dirTo(u, close[0]), n = { x: -v.y, y: v.x }, c = { x: u.x + v.x * 1.6, y: u.y + v.y * 1.6 };
            m.tempWalls.push({ team: u.team, ax: c.x - n.x * 3, ay: c.y - n.y * 3, bx: c.x + n.x * 3, by: c.y + n.y * 3, r: 0.5, until: m.time + 4 });
            m.zone({ owner: u, x: c.x, y: c.y, r: 3, life: 4, every: 0.5, kind: 'fire',
              tick: (mm, z) => mm.hitCircle(u, z.x, z.y, 3, (e) => { if (G.M.segDist(e.x, e.y, z.x - n.x * 3, z.y - n.y * 3, z.x + n.x * 3, z.y + n.y * 3) < 1.4) { mm.damage(u, e, 10 + 3 * u.level, 'magic', { tag: 'sub', aoe: true, noHook: true }); burn(mm, u, e); } }, { noFx: true }) });
          }
          m.hitCircle(u, u.x, u.y, 3, (e) => {
            m.damage(u, e, H.amt(u, 30 + 8 * u.level, 0, 0.3), 'magic', { tag: 'sub', aoe: true });
            burn(m, u, e);
            const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 4 + 0.3 * u.level, 0.3);
            if (H.T(u, '3a')) m.addStatus(e, 'root', 0.75, 1, { src: u });
          }, { color: '#ff7a3a', fx: 'firering' });
        },
        ai: { use: 'cc', range: 2.6, aim: 'self', alsoEscape: true, cond: (m, u, t) => !t.ranged || G.M.dist(u, t) < 2.2 + t.r },
      },
      s4: {
        name: 'Thiên Thạch', desc: 'Gọi thiên thạch giáng xuống điểm trong 20 đv sau 1s cảnh báo: bán kính 8/10/16 đv (trùm cả ổ boss), sát thương phép 125/150/200% SMPT, hất tung 0.75/1/1.5s và găm ngay 6 tầng Hỏa Ấn (kích nổ nội tại). Để lại biển dung nham 6/8/12s.',
        cd: [110, 90, 70], cost: [100, 100, 100], castTime: 0.25, castMove: 1,
        use(m, u, ctx) {
          const pick = H.bestAoe && !u.ctl ? H.bestAoe(m, u, 20, ctx.v([8, 10, 16]), 1.1) : null;   // GĐ13: người chơi — rơi đúng chỗ ngắm
          const p = pick || H.toward(u, ctx.pt, 20, true), big = H.T(u, '9b'), R = ctx.v([8, 10, 16]) * (big ? 1.2 : 1);
          m.telegraph({ team: u.team, x: p.x, y: p.y, r: R, life: 1, color: '#ff4a1a' });
          m.dangers.push({ x: p.x, y: p.y, r: R, until: m.time + 1.1, team: u.team });
          m.later(1, (mm) => {
            mm.hitCircle(u, p.x, p.y, R, (e) => {
              mm.damage(u, e, H.amt(u, ctx.v([150, 220, 300]), 0, ctx.v([1.25, 1.5, 2])), 'magic', { tag: 's4', aoe: true });
              if (big && G.M.dist(e, p) < 2 + e.r) mm.addStatus(e, 'stun', 1.5, 1, { src: u }); else mm.knockup(u, e, ctx.v([0.75, 1, 1.5]));
              burn(mm, u, e, 6);
            }, { color: '#ff3a0a' });
            if (mm.fxOn) mm.fx({ type: 'boom', x: p.x, y: p.y, big: true });
            mm.zone({ owner: u, x: p.x, y: p.y, r: R * 0.6, life: ctx.v([6, 8, 12]), every: 0.5, kind: 'fire',
              tick: (m3, z) => m3.hitCircle(u, z.x, z.y, z.r, (e) => m3.damage(u, e, ctx.v([30, 45, 60]) * 0.5, 'magic', { tag: 's4', aoe: true, noHook: true }), { noFx: true }) });
          });
        },
        ai: { use: 'ult', range: 20, aim: 'point', speed: 0, delay: 1.25, aoe: 8,
          cond: (m, u) => !!(H.bestAoe && H.bestAoe(m, u, 20, [8, 10, 16][Math.max(0, Math.min(2, m.rankOf(u, 's4') - 1))], 1.1)) },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 9, role: 'mage', artillery: true,
      // GĐ12: AI Pháo Binh — (1) kẻ áp sát: Vòng Lửa đẩy văng TRƯỚC, chưa xả Dịch Chuyển; (2) không thấy ai mà nghe tiếng giao tranh ≤ 35 đv:
      // tích Đại Hỏa Cầu bắn mù dọc trục âm thanh
      micro(ai, enemies) {
        const m = ai.m, u = ai.u; if (u.cast || u.dash) return false;
        const close = enemies.find((e) => !e.ranged && G.M.dist(e, u) < 2.6 + e.r);
        if (close && m.canCast(u, 'sub')) { if (m.castSkill(u, 'sub', close, { x: u.x, y: u.y })) { ai.callout('🔥 Vòng Lửa đẩy văng', '#ffb070'); return true; } }
        if (!enemies.length && m.canCast(u, 's2') && m.time >= (ai.blindT || 0)) {
          ai.blindT = m.time + 6;
          for (let i = m.heroHit.length - 1; i >= 0; i--) {
            const h = m.heroHit[i]; if (m.time - h.t > 2) break;
            if (h.att === u || h.vic === u || !h.vic.alive) continue;
            const p = { x: (h.att.x + h.vic.x) / 2, y: (h.att.y + h.vic.y) / 2 }, d = G.M.dist(u, p);
            if (d < 9 || d > 35) continue;
            u.face(p.x, p.y);
            if (m.castSkill(u, 's2', null, p)) { ai.callout('☄ Pháo mù theo tiếng giao tranh', '#ffb070'); u.stats.blindArty = (u.stats.blindArty || 0) + 1; return true; }
          }
        }
        return false;
      } },
    tags: ['poke'],
  });
  G.HEROES.ignatius.tree = [
    [
      { name: 'Hỏa Tốc', desc: 'Cầu Lửa (S1) bay nhanh hơn 40%.' },
      { name: 'Thiêu Rụi', desc: 'Thiêu Đốt mạnh hơn 25%.' },
      { name: 'Bộ Pháp Chớp Nhoáng', desc: 'Dịch Chuyển (S3) xa hơn 30%.' },
    ],
    [
      { name: 'Biển Lửa Giam Cầm', desc: 'Vòng Lửa (skill phụ) trói chân thêm 0.75s.' },
      { name: 'Hư Ảnh Cháy Bùng', desc: 'Vị trí cũ sau khi Dịch Chuyển phát nổ (bán kính 2, sát thương như Dịch Chuyển).' },
      { name: 'Đại Hỏa Cầu Phá Đạn', desc: 'Đại Hỏa Cầu (S2) thiêu hủy mọi đạn đạo của đối phương bay qua nó.' },
    ],
    [
      { name: 'Tường Lửa Chắn Lối', desc: 'Vòng Lửa (skill phụ) dựng thêm tường lửa dài 6 đv chắn giữa Ignatius và kẻ áp sát trong 4s, thiêu kẻ đứng sát tường.' },
      { name: 'Kích Nổ Cầu Lửa', desc: 'Dùng lại Cầu Lửa trong 0.6s để nổ ngay giữa đường bay.' },
      { name: 'Hỏa Hồn Bùng Cháy', desc: 'Kẻ địch đang bị Thiêu Đốt chậm 20%.' },
    ],
    [
      { name: 'Hỏa Ngục Bất Diệt', desc: 'Thiêu Đốt của Hỏa Ấn kéo dài 6s (thay vì 3s).' },
      { name: 'Thiên Thạch Tận Thế', desc: 'Thiên Thạch rộng hơn 20%; kẻ địch ở tâm (2 đv) bị choáng 1.5s.' },
      { name: 'Tia Lửa Ma Thuật', desc: 'Dịch Chuyển lập tức hồi lại Cầu Lửa.' },
    ],
    [
      { name: 'Hố Đen Tro Tàn', desc: 'Đại Hỏa Cầu tích tối đa: hút mọi kẻ địch trong 4 đv vào tâm rồi mới phát nổ.' },
      { name: 'Pháp Sư Trọng Lực', desc: 'Đổi hệ Lửa sang Trọng Lực: không gây Thiêu Đốt; mỗi chiêu trúng tích 1 tầng (tối đa 6, 5s), mỗi tầng +6% sát thương nhận vào và chậm 5%.' },
      { name: 'Phượng Hoàng Tái Sinh', desc: 'Đòn chí tử: hóa trứng lửa 2s (bất động, miễn sát thương) rồi sống lại với 40% máu. 1 lần mỗi trận.',
        onFatal(m, u) {
          if (u.ws.phoenix) return false;
          u.ws.phoenix = true; u.hp = 1;
          m.addStatus(u, 'invuln', 2, 1); m.addStatus(u, 'stun', 2, 1, { key: 'egg' });
          m.later(2, (mm) => { if (u.alive) mm.heal(u, u, u.st.maxHp * 0.4); });
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ff7a1a', life: 2 });
          return true;
        } },
    ],
  ];
})();
