'use strict';
// ===== Gideon — Lãnh Chúa Cứ Điểm 2.0 • Thiết Kiếm Trọng Thần • pháo đài di động, khống chế tầm với • mana • vật lý =====
// GĐ10: làm lại theo tài liệu bổ sung — S1 gồng hấp thụ đòn, S2 trói tới 1.6s, S3 thành Địa Chấn, S4 nhảy 12/18/24 đv, kháng đẩy 30%.
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  // "Điểm Ngọt": trúng bằng mũi kiếm (30% ngoài cùng tầm) mạnh hơn, trúng bằng cán (sát thân) yếu hơn
  function sweet(u, e, reach) {
    const d = M.dist(u, e) - e.r;
    if (d >= reach * 0.7) return H.T(u, '1a') ? 1.45 : 1.3;
    if (d <= reach * 0.25) return 0.7;
    return 1;
  }
  function sweetHit(m, u, e) {
    m.addStatus(e, 'slow', 1, H.T(u, '1b') ? 0.35 : 0.2, { src: u, key: 'gid_sweet' });
    if (H.T(u, '9c') && e.kind === 'hero') m.addStatus(e, 'buff', 3, 1, { key: 'gid_break', mods: { adPct: -0.3 } });
  }
  // Trấn Áp Vực Thẳm: mọi đòn trúng phá vĩnh viễn 15% Hộ Giáp
  function crush(u, e) { if (H.T(u, '12b') && e.ga > 0) e.ga = Math.max(0, e.ga - (e.st.maxGa || 0) * 0.15); }
  // gồng: giảm sát thương, miễn choáng, hấp thụ sát thương nhận vào
  function brace(m, u, key, dur, red) {
    u.ws.brace = { key, t0: m.time, end: m.time + dur, taken: 0 };
    m.addStatus(u, 'reduce', dur, red, { key: 'gid_brace' }); m.addStatus(u, 'unstop', dur, 1, { key: 'gid_brace' });
  }
  function unbrace(m, u) { u.ws.brace = null; m.removeStatus(u, 'reduce', 'gid_brace'); m.removeStatus(u, 'unstop', 'gid_brace'); }
  H.def({
    id: 'gideon', name: 'Gideon', color: '#ffd24a', gfx: 'greatsword', kit: 'tank', pos: ['top', 'jungle'], dmgType: 'phys',
    ranged: false, r: 0.75, resource: 'mana', fixedAs: true,
    stats: { range: 2.7, hp: 575, hpG: 98, mp: 300, mpG: 40, ad: 58, adG: 3.6, armor: 34, armorG: 3.6, mr: 32, mrG: 2.0, as: 0.66, ms: 3.4 },
    knockRes: (u) => (H.T(u, '1c') ? 0.5 : 0.3),
    passive: {
      name: 'Điểm Ngọt & Đại Trường Kiếm',
      desc: 'Đại Trường Kiếm: tầm đánh 2.7 đv; tốc đánh CỐ ĐỊNH — mọi % tốc đánh cộng thêm (cấp, đồ, mảnh hồn, bùa) chuyển thành % sát thương đòn đánh. Điểm Ngọt: trúng bằng mũi kiếm (30% ngoài cùng tầm) +30% sát thương và làm chậm 20%; trúng bằng cán (sát thân) −30%. Kháng đẩy: bị đẩy lùi / kéo ngắn hơn 30%.',
      init(m, u) { u.ws.brace = null; },
      update(m, u, dt) {
        if (u.ws.brace && H.T(u, '3c')) m.heal(u, u, u.st.maxHp * 0.03 * dt);
        if (u.ws.brace && m.time > u.ws.brace.end + 0.2) u.ws.brace = null;
      },
      onAuto(m, u, t, info) {
        const k = sweet(u, t, u.st.range + u.r);
        info.amt *= k * (1 + (u.st.asConv || 0) * (H.T(u, '6c') ? 1.25 : 1));
        if (k > 1) info.extra.push(() => t.alive && sweetHit(m, u, t));
        info.extra.push(() => crush(u, t));
      },
      afterTake(m, u, owner, info, dealt) { if (u.ws.brace && dealt > 0) u.ws.brace.taken += dealt; },
    },
    skills: {
      s1: {
        name: 'Quét Ngang', desc: 'Gồng 0.5/0.5/0.5/0.75/1s (dùng lại để vung sớm): giảm 40% sát thương nhận vào, miễn choáng, hấp thụ đòn đánh để tăng tới 10/20/25/30/40% sát thương. Rồi chém vòng cung 180° phía trước. Điểm Ngọt áp dụng.',
        cd: [7, 6.5, 6, 5.5, 5], cost: [45, 45, 45, 45, 45], castTime: 0.05,
        use(m, u, ctx) {
          const T = ctx.v([0.5, 0.5, 0.5, 0.75, 1]), cap = ctx.v([0.1, 0.2, 0.25, 0.3, 0.4]), v = H.dirTo(u, ctx.pt), base = H.amt(u, ctx.v([55, 90, 125, 160, 195]), 0.75);
          brace(m, u, 's1', T, H.T(u, '6b') ? 0.6 : 0.4);
          m.telegraph({ shape: 'cone', x: u.x, y: u.y, dx: v.x, dy: v.y, r: 3.4, c: 0, life: T, team: u.team, color: '#ffe08a' });
          let done = false;
          const swing = (mm) => {
            if (done || !u.alive) return; done = true;
            const b = u.ws.brace, bonus = b ? cap * Math.min(1, b.taken / (u.st.maxHp * 0.12)) : 0; unbrace(mm, u);
            mm.hitCone(u, u.x, u.y, v.x, v.y, 3.4, 0, (e) => {
              const k = sweet(u, e, 3.4);
              mm.damage(u, e, base * k * (1 + bonus), 'phys', { tag: 's1' });
              if (k > 1) sweetHit(mm, u, e); crush(u, e);
            }, { color: '#ffe08a' });
          };
          m.later(T, swing);
          m.allowRecast(u, 's1', T, (mm) => swing(mm));
        },
        ai: { use: 'burst', range: 3.1, aim: 'unit', farm: 3, recastWhen: (m, u) => !!(u.ws.brace && u.ws.brace.taken > u.st.maxHp * 0.1) },
      },
      s2: {
        name: 'Bổ Dọc', desc: 'Bổ kiếm theo đường thẳng 5.5 đv, sát thương vật lý nặng. Trúng Điểm Ngọt (chóp mũi kiếm): +30% sát thương và trói chân 0.6/1/1.2/1.4/1.6s.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [55, 55, 55, 55, 55], castTime: 0.35,
        use(m, u, ctx) {
          const L = 5.5, v = H.dirTo(u, ctx.pt), base = H.amt(u, ctx.v([70, 110, 150, 190, 230]), 0.85);
          m.hitLine(u, u.x, u.y, v.x, v.y, L, 1.4, (e) => {
            const k = sweet(u, e, L);
            m.damage(u, e, base * k, 'phys', { tag: 's2' }); crush(u, e);
            if (k > 1) { m.addStatus(e, 'root', ctx.v([0.6, 1, 1.2, 1.4, 1.6]), 1, { src: u }); sweetHit(m, u, e); if (H.T(u, '3a')) m.addStatus(e, 'nodash', 1.5 + ctx.v([0.6, 1, 1.2, 1.4, 1.6]), 1, { src: u }); }
          }, { color: '#ffe08a' });
        },
        ai: { use: 'poke', range: 5.0, aim: 'point', speed: 0, farm: 3 },
      },
      s3: {
        name: 'Địa Chấn', desc: 'Cắm cự kiếm gồng tối đa 1.6s (dùng lại để kích nổ sớm): giảm 40% sát thương, không thể cản phá; vòng cảnh báo lan rộng dần. Kích nổ hất tung mọi kẻ trong vòng — gồng càng lâu và nhận càng nhiều sát thương thì nổ càng đau, hất tung càng lâu; phá ngay 30% Hộ Giáp.',
        cd: [10, 10, 9, 9, 8], cost: [50, 50, 50, 50, 50],
        use(m, u, ctx) {
          brace(m, u, 's3', 1.6, 0.4);
          const t0 = m.time, base = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0.6);
          m.telegraph({ shape: 'circle', x: u.x, y: u.y, r: 4, life: 1.6, team: u.team, color: '#d0a070' });
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#d0a070', life: 1.6 });
          let done = false;
          const slam = (mm) => {
            if (done || !u.alive) return; done = true;
            const b = u.ws.brace, f = Math.min(1, (mm.time - t0) / 1.6), tk = b ? Math.min(1, b.taken / (u.st.maxHp * 0.15)) : 0; unbrace(mm, u);
            const R = 2 + 2 * f, dmg = base * (1 + 0.6 * f + 0.8 * tk), up = 0.5 + 0.5 * f + 0.5 * tk;
            mm.hitCircle(u, u.x, u.y, R, (e) => { mm.damage(u, e, dmg, 'phys', { tag: 's3', aoe: true }); mm.knockup(u, e, up); if (e.ga > 0) e.ga *= 0.7; crush(u, e); }, { color: '#d0a070' });
            if (H.T(u, '6a')) { const x = u.x, y = u.y; mm.zone({ owner: u, x, y, r: R, life: 4, every: 0.3, kind: 'rubble', tick: (m2) => m2.hitCircle(u, x, y, R, (e) => m2.addStatus(e, 'slow', 0.4, 0.4, { src: u, key: 'gid_rubble' }), { noFx: true }) }); }
            if (mm.fxOn) mm.fx({ type: 'quake', x: u.x, y: u.y, r: R });
          };
          m.later(1.6, slam);
          m.allowRecast(u, 's3', 1.6, (mm) => slam(mm));
        },
        ai: { use: 'defend', aim: 'self', range: 3.5, recastWhen: (m, u) => !!(u.ws.brace && (u.ws.brace.taken > u.st.maxHp * 0.15 || m.time - u.ws.brace.t0 > 1.2)) },
      },
      sub: {
        name: 'Cán Kiếm', desc: 'Húc chuôi kiếm vào kẻ địch sát người (tầm 1.9): 30 (+6/cấp, +40% Công Vật Lý) sát thương, choáng 0.4/0.6/0.8s (theo cấp) và đẩy văng ra đúng 2.7 đv — vào thẳng Điểm Ngọt của Bổ Dọc. Hồi 9 → 8/7/6s theo cấp.',
        cd: (m, u) => (u.level >= 15 ? 6 : u.level >= 10 ? 7 : u.level >= 5 ? 8 : 9), cost: 25, castTime: 0.05,
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.alive && M.dist(u, ctx.tgt) < 2.8 + ctx.tgt.r ? ctx.tgt : H.nearestEnemyHero(m, u, 2.8);
          const v = H.dirTo(u, t || ctx.pt), st = u.level >= 15 ? 0.8 : u.level >= 9 ? 0.6 : 0.4;
          m.hitCone(u, u.x, u.y, v.x, v.y, 1.9 + u.r, 0.5, (e) => {
            m.damage(u, e, H.amt(u, 30 + 6 * u.level, 0.4), 'phys', { tag: 'sub' }); crush(u, e);
            m.addStatus(e, 'stun', st, 1, { src: u });
            const d = M.dist(u, e), want = 2.7 + u.r + e.r - 0.2;
            if (d < want) m.knock(u, e, (e.x - u.x) / (d || 1), (e.y - u.y) / (d || 1), want - d, 0.2, H.T(u, '3b') ? { onWall: (mm, ee) => mm.addStatus(ee, 'stun', 1.5, 1, { src: u }) } : undefined);
          }, { color: '#ffe08a', fx: 'thrust' });
        },
        ai: { use: 'cc', range: 1.4, aim: 'unit', heroOnly: true },
      },
      s4: {
        name: 'Khai Thiên Lập Địa', desc: 'Nhảy vút lên, giáng cự kiếm xuống điểm trong 12/18/24 đv (vòng cảnh báo cực lớn). Tâm chấn (bán kính 6/9/12... thu gọn 3/4/5 đv trong đấu trường): hất tung, sát thương vật lý lớn kèm sát thương chuẩn bỏ qua Giáp và Hộ Giáp. Vùng rìa (gấp đôi bán kính): sát thương lan, làm chậm 40/60/80% 3s.',
        cd: (m, u) => [120, 100, 80][Math.max(0, u.ranks.s4 - 1)] - (H.T(u, '12a') ? 30 : 0), cost: [100, 100, 100], castTime: 0.15,
        use(m, u, ctx) {
          const far = ctx.v([12, 18, 24]), p = H.toward(u, ctx.pt, far, true), Rc = ctx.v([3, 4, 5]), Re = Rc * 2;
          const d = M.dist(u, p), sp = Math.max(18, d / 0.7);
          m.telegraph({ shape: 'circle', x: p.x, y: p.y, r: Re, life: d / sp + 0.1, team: u.team, color: '#ffd24a' });
          m.dashTo(u, p.x, p.y, sp, { unstop: true, untarget: true, onEnd: (mm) => {
            const dmg = H.amt(u, ctx.v([150, 250, 350]), 1.0), tru = H.amt(u, ctx.v([60, 100, 140]), 0.3);
            mm.hitCircle(u, u.x, u.y, Re, (e) => {
              if (M.dist(u, e) <= Rc + e.r) {
                mm.damage(u, e, dmg, 'phys', { tag: 's4', aoe: true });
                if (e.alive) mm.damage(u, e, tru * (H.T(u, '9b') && e.ga > e.hp ? 1.3 : 1), 'true', { tag: 's4', aoe: true, byp: 1 });
                mm.knockup(u, e, 1.0);
              } else { mm.damage(u, e, dmg * 0.5, 'phys', { tag: 's4', aoe: true }); mm.addStatus(e, 'slow', 3, ctx.v([0.4, 0.6, 0.8]), { src: u }); }
              crush(u, e);
            }, { color: '#ffd24a' });
            if (H.T(u, '9a')) { const cx = u.x, cy = u.y; mm.zone({ owner: u, x: cx, y: cy, r: Rc + 1, life: 3, every: 0.1, kind: 'rockring', tick: (m2) => {
              for (const e of m2.enemiesIn(u.team, cx, cy, Rc + 3)) { const dd = M.dist(e, { x: cx, y: cy }); if (dd > Rc && dd < Rc + 2.5) { const k = Rc / dd; e.x = cx + (e.x - cx) * k; e.y = cy + (e.y - cy) * k; } }
            } }); }
            if (H.T(u, '12a')) { u.cd.s1 = 0; u.cd.s2 = 0; u.cd.s3 = 0; }
            if (mm.fxOn) mm.fx({ type: 'quake', x: u.x, y: u.y, r: Re });
          } });
        },
        ai: { use: 'ult', aim: 'point', range: 12, rangeFn: (m, u) => [12, 18, 24][Math.max(0, u.ranks.s4 - 1)] * 0.8, aoe: 5 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 3.5, role: 'tank', bait: true, tip: true, guard: (m, u) => { const s = u.hasKey('gid_brace'); return s ? { t: s.t, punish: false } : null; } },
    tags: ['cc', 'tank'],
  });
  G.HEROES.gideon.tree = [
    [
      { name: 'Mũi Kiếm Chuẩn Xác', desc: 'Điểm Ngọt +45% sát thương (thay vì +30%).' },
      { name: 'Khúc Trọng Lực', desc: 'Đòn Điểm Ngọt làm chậm 35% (thay vì 20%).' },
      { name: 'Thiết Thân', desc: '+150 Hộ Giáp vĩnh viễn, kháng đẩy 50%.', stats: { gaMax: 150 } },
    ],
    [
      { name: 'Trói Đinh Ngàn Cân', desc: 'Bổ Dọc trúng Điểm Ngọt khóa lướt và dây móc thêm 1.5s.' },
      { name: 'Húc Văng Cán Kiếm', desc: 'Cán Kiếm đẩy kẻ địch đập vào tường: choáng 1.5s.' },
      { name: 'Kiên Cố Tuyệt Đối', desc: 'Đang gồng Quét Ngang hoặc Địa Chấn: hồi 3% máu tối đa mỗi giây.' },
    ],
    [
      { name: 'Địa Chấn Bộc Phá', desc: 'Địa Chấn nổ để lại bãi đá nham nhở làm chậm 40% trong 4s.' },
      { name: 'Khiên Kiếm Đỡ Gạt', desc: 'Gồng Quét Ngang giảm 60% sát thương nhận vào (thay vì 40%).' },
      { name: 'Thế Nặng Ngàn Cân', desc: 'Tốc đánh quy đổi sang sát thương ×1.25.' },
    ],
    [
      { name: 'Trảm Khí Khai Thiên', desc: 'Khai Thiên Lập Địa dựng vòng vách đá quanh tâm chấn 3s, nhốt kẻ địch bên trong.' },
      { name: 'Đại Địa Chấn', desc: 'Sát thương chuẩn của chiêu cuối +30% lên kẻ có Hộ Giáp dày hơn Máu Đỏ.' },
      { name: 'Chém Gãy Thần Binh', desc: 'Đòn Điểm Ngọt làm gãy vũ khí đối phương: −30% công 3s.' },
    ],
    [
      { name: 'Cự Kiếm Xung Trận', desc: 'Phong cách: chiêu cuối hồi nhanh hơn 30s; đáp xuống làm mới Quét Ngang, Bổ Dọc, Địa Chấn.' },
      { name: 'Trấn Áp Vực Thẳm', desc: 'Phong cách: mọi đòn trúng phá vĩnh viễn 15% Hộ Giáp tối đa của đối phương.' },
      { name: 'Kiếm Đế Cuồng Nộ', desc: '+12% tốc chạy, +20% tốc đánh (quy đổi sát thương).', stats: { msPct: 0.12, asPct: 0.2 } },
    ],
  ];
})();
