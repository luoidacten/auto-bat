'use strict';
// ===== Koda — Găng Vuốt • Đi rừng • sát thủ chảy máu, bám tường • KHÔNG MANA • vật lý =====
(function () {
  const G = globalThis.G, H = G.H;
  const BLEED = 'koda_bleed';
  const maxStacks = (u) => (H.T(u, '9b') ? 8 : 5);
  function bleed(m, u, t) {
    if (!t || !t.alive || t.kind === 'tower' || t.kind === 'nexus') return;
    const dur = H.T(u, '1b') ? 6 : 4;
    const s = m.addStatus(t, 'dot', dur, 3.6 + 1.2 * u.level, { key: BLEED, stack: 'add', max: maxStacks(u), src: u, tick: 0.5, dtype: 'phys' });
    if (s && H.T(u, '3c')) m.addStatus(t, 'slow', dur, 0.05 * (s.n || 1), { src: u, key: 'koda_trace' });   // Vết Cắn Truy Lùng
    if (H.T(u, '12b') && t.kind === 'hero') m.addStatus(t, 'wound', 3, 1, { src: u, key: 'koda_wound' });    // Sói Đầu Đàn
  }
  // bám tường: không thể bị chọn, bấm lại để lao xuống tướng địch (Cào Loạn Xạ kế tiếp ×1.5)
  function cling(m, u) {
    const hold = H.T(u, '1a') ? 4 : 3, reach = H.T(u, '1a') ? 9 : 7;
    m.addStatus(u, 'untarget', hold, 1); m.addStatus(u, 'root', hold, 1, { key: 'koda_wall' });
    u.ws.onWall = m.time + hold;
    if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#8a5a3a', life: 0.5 });
    const drop = (m3, u3) => { m3.removeStatus(u3, 'untarget'); m3.removeStatus(u3, 'root', 'koda_wall'); u3.ws.onWall = 0; };
    const fn = (m3, u3, c3) => {
      drop(m3, u3); u3.recast.s3 = null; u3.recast.sub = null;
      const t = c3 && c3.tgt && c3.tgt.alive && c3.tgt.team !== u3.team && G.M.dist(u3, c3.tgt) < reach ? c3.tgt : H.nearestEnemyHero(m3, u3, reach);
      if (!t) return;
      u3.ws.leap = m3.time + 2;
      m3.dashTo(u3, t.x, t.y, 20 * 1.5, { onContact: (m4, u4, e) => {
        if (e !== t) return;
        m4.damage(u4, e, H.amt(u4, 60 + 6 * u4.level, 0.6) * 1.5, 'phys', { tag: 's3' }); bleed(m4, u4, e);
        if (H.T(u4, '3a')) m4.addStatus(e, 'stun', 1, 1, { src: u4 });
        if (m4.fxOn) m4.fx({ type: 'slash', x: e.x, y: e.y, a: 0.8, color: '#ff7a5a', big: true });
        return 'stop';
      } });
    };
    // lao xuống: dùng lại Vồ Mồi hoặc Bám Tường
    m.allowRecast(u, 's3', hold, fn); m.allowRecast(u, 'sub', hold, fn);
    m.later(hold, () => { if (u.ws.onWall) { drop(m, u); u.recast.s3 = null; u.recast.sub = null; } });
  }
  H.def({
    id: 'koda', name: 'Koda', color: '#c0563a', gfx: 'claw', kit: 'fighter', pos: ['jungle'], dmgType: 'phys',
    ranged: false, r: 0.6, resource: 'none',
    stats: { hp: 570, hpG: 88, ad: 61, adG: 3.7, as: 0.7, ms: 3.6, range: 1.4 },
    passive: {
      name: 'Vết Thương Sâu',
      desc: 'Đòn đánh và chiêu gây 1 tầng Chảy Máu (tối đa 5): mỗi tầng 6 (+1.8/cấp) sát thương vật lý mỗi giây trong 4s.',
      init(m, u) { u.ws.leap = 0; },
      onAuto(m, u, t, info) { info.extra.push(() => bleed(m, u, t)); },
    },
    skills: {
      s1: {
        name: 'Cào Loạn Xạ', desc: '2 nhát cào nhanh trước mặt, mỗi nhát gây 1 tầng Chảy Máu. Vừa lao xuống từ tường: ×1.5.',
        cd: [5, 4.5, 4, 3.5, 3], castTime: 0.1,
        use(m, u, ctx) {
          const k = u.ws.leap > m.time ? 1.5 : 1; u.ws.leap = 0;
          if (H.T(u, '1c')) u.cd.s1 = Math.max(0.5, u.cd.s1 - 1);
          const dmg = H.amt(u, ctx.v([35, 55, 75, 95, 115]), 0.45) * k;
          const swipe = () => {
            if (!u.alive) return;
            if (H.T(u, '6b')) { m.hitCircle(u, u.x, u.y, 2.4, (e) => { m.damage(u, e, dmg * 0.85, 'phys', { tag: 's1', aoe: true }); bleed(m, u, e); }, { color: '#ff7a5a' }); return; }
            const t = ctx.tgt && ctx.tgt.alive ? ctx.tgt : null;
            const v = t ? H.dirTo(u, t) : { x: u.fx, y: u.fy };
            m.hitCone(u, u.x, u.y, v.x, v.y, 2.4, 0.5, (e) => { m.damage(u, e, dmg, 'phys', { tag: 's1' }); bleed(m, u, e); }, { color: '#ff7a5a' });
          };
          swipe(); m.later(0.2, swipe);
        },
        ai: { use: 'burst', range: 2.0, aim: 'unit', farm: 2 },
      },
      s2: {
        name: 'Xé Toạc', desc: 'Kích nổ toàn bộ Chảy Máu trên mục tiêu thành sát thương tức thì. Đủ 5 tầng: làm chậm 60% 1.5s và cộng 10% máu đã mất.',
        cd: [9, 8.5, 8, 7.5, 7], castTime: 0.1,
        can(m, u) { return !!(u.ai && u.ai.target && H.stacks(u.ai.target, BLEED) > 0 && G.M.dist(u, u.ai.target) < 3.2); },
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.alive ? ctx.tgt : u.ai && u.ai.target;
          if (!t || !t.alive || G.M.dist(u, t) > 3.4) return;
          const n = H.stacks(t, BLEED);
          let dmg = H.amt(u, ctx.v([30, 42, 54, 66, 78]), 0.3) * Math.max(1, n);
          const full = n >= 5;
          if (full) {
            dmg += (t.st.maxHp - t.hp) * (H.T(u, '9c') ? 0.18 : 0.1);
            if (H.T(u, '3b')) m.addStatus(t, 'root', 1.25, 1, { src: u }); else m.addStatus(t, 'slow', 1.5, 0.6, { src: u });
          }
          m.removeStatus(t, 'dot', BLEED); m.removeStatus(t, 'slow', 'koda_trace');
          const dealt = m.damage(u, t, dmg, 'phys', { tag: 's2' });
          if (full && H.T(u, '9c')) m.heal(u, u, dealt * 0.5);
          if (m.fxOn) m.fx({ type: 'burst', x: t.x, y: t.y, color: '#ff3a4a' });
        },
        ai: { use: 'burst', range: 3.0, aim: 'unit', cond: (m, u, t) => H.stacks(t, BLEED) >= 3 || t.hpPct < 0.3 },
      },
      s3: {
        name: 'Vồ Mồi', desc: 'Nhảy vồ tới 5 đv. Chạm tướng địch: đè xuống (trói chân cả hai 0.5s) rồi cào vào mặt. Chạm tường/vách: bám luôn vào tường (như Bám Tường).',
        cd: [12, 11, 10, 9, 8],
        use(m, u, ctx) {
          // Độn Thổ Rình Rập: chui xuống đất lướt tới tướng địch gần nhất, trồi lên hất tung
          if (H.T(u, '12a')) {
            const t = ctx.tgt && ctx.tgt.kind === 'hero' && G.M.dist(u, ctx.tgt) < 7.5 ? ctx.tgt : H.nearestEnemyHero(m, u, 7);
            const p = t ? { x: t.x, y: t.y } : H.toward(u, ctx.pt, 7, true);
            m.dashTo(u, p.x, p.y, 15, { untarget: true, wall: true, onEnd: (mm) => mm.hitCircle(u, u.x, u.y, 2, (e) => {
              mm.damage(u, e, H.amt(u, ctx.v([40, 65, 90, 115, 140]), 0.5), 'phys', { tag: 's3' }); bleed(mm, u, e); mm.knockup(u, e, 0.75);
            }, { color: '#8a5a3a' }) });
            return;
          }
          const p = H.toward(u, ctx.pt, 5, true);
          let hit = false;
          m.dashTo(u, p.x, p.y, 17, {
            onContact: (mm, uu, e) => {
              if (e.kind !== 'hero' && e.kind !== 'pet') return;
              hit = true;
              mm.damage(u, e, H.amt(u, ctx.v([40, 65, 90, 115, 140]), 0.5), 'phys', { tag: 's3' }); bleed(mm, u, e);
              mm.addStatus(e, 'root', 0.5, 1, { src: u }); mm.addStatus(u, 'root', 0.4, 1);
              // Cắn Xé Cuồng Loạn: dùng lại để ngoạm và quăng mục tiêu ra sau lưng
              if (H.T(u, '6a') && e.kind === 'hero') mm.allowRecast(u, 's3', 2, (m3, u3) => {
                if (!e.alive || G.M.dist(u3, e) > 3) return;
                const v = H.dirTo(e, u3);
                m3.damage(u3, e, H.amt(u3, 40 + 8 * u3.level, 0.5), 'phys', { tag: 's3' });
                m3.knock(u3, e, v.x, v.y, G.M.dist(u3, e) + 3, 0.3);
              });
              return 'stop';
            },
            onEnd: (mm) => { if (!hit && G.MAP.nearWall(u, 1.4)) cling(mm, u); },
          });
        },
        ai: { use: 'engage', range: 5.2, aim: 'unit', recastWhen: (m, u, t) => t && G.M.dist(u, t) < 7 },
      },
      sub: {
        name: 'Bám Tường', desc: 'Khi đứng cạnh tường/vách đá/rặng cây (1.6 đv): bám lên đó tối đa 3s — không thể bị chọn làm mục tiêu. Bấm lại (hoặc dùng Vồ Mồi): lao xuống tướng địch trong 7 đv nhanh gấp rưỡi, gây 60 (+6/cấp, +60% SMVL) ×1.5 sát thương; Cào Loạn Xạ kế tiếp ×1.5.',
        cd: 12,
        can(m, u) { return !!G.MAP.nearWall(u, 1.6) && !u.ws.onWall; },
        use(m, u) { cling(m, u); },
        ai: { use: 'custom', pick(m, u, t, fleeing, ai) {
          if (!t || t.kind !== 'hero') return null;
          const d = G.M.dist(u, t);
          // bị đuổi sát: trèo lên tường né đòn (chờ đồng đội / hết chiêu của địch)
          if (fleeing) return d < 4 && u.hpPct < 0.6 ? { pt: { x: u.x, y: u.y } } : null;
          // đang bị dồn sát thương: trèo lên né rồi lao xuống kết liễu
          if (u.hpPct < 0.35 && d < 3 && m.time - u.lastDmgT < 0.6) return { pt: { x: u.x, y: u.y } };
          // rình mồi: đang tiếp cận tướng địch từ cạnh tường → bám rồi lao xuống
          return d > 2.2 && d < 6.5 && ai.fightRatio * ai.aggr > 0.9 ? { pt: { x: u.x, y: u.y } } : null;
        }, recastWhen: (m, u, t) => !!(t && t.alive && G.M.dist(u, t) < 6.5 && (u.ws.onWall - m.time < 2.2 || t.hpPct < 0.5)) },
      },
      s4: {
        name: 'Thú Tính', desc: '5s hóa bóng đen: +50% tốc chạy, đi xuyên người; mỗi lần lướt qua tướng địch gây 1 tầng Chảy Máu (mỗi tướng 1 lần/0.5s).',
        cd: [100, 85, 70],
        use(m, u) {
          const T = H.T(u, '9a') ? 7 : 5;
          m.addStatus(u, 'haste', T, 0.5); m.addStatus(u, 'buff', T, 1, { key: 'koda_feral', mods: { asPct: 0.3 } });
          u.ws.feral = m.time + T; u.ws.feralHit = {};
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#401020', life: 5 });
        },
        ai: { use: 'ult', aim: 'self', range: 6 },
      },
    },
    ai: { order: ['s1', 's3', 's2'], engageRange: 5, role: 'assassin', hitRun: true },
    tags: ['dive'],
  });
  // Thú Tính: kiểm tra lướt qua người
  const P = G.HEROES.koda.passive;
  P.update = function (m, u) {
    if (!(u.ws.feral > m.time)) return;
    if (H.T(u, '9a') && u.statuses.length) m.removeStatus(u, 'slow');
    for (const e of m.enemiesIn(u.team, u.x, u.y, 1.1, { heroesOnly: true })) {
      if ((u.ws.feralHit[e.id] || 0) > m.time) continue;
      u.ws.feralHit[e.id] = m.time + 0.5; bleed(m, u, e);
    }
  };
  G.HEROES.koda.tree = [
    [
      { name: 'Bản Năng Leo Trèo', desc: 'Bám tường tối đa 4s (thay vì 3s), lao xuống tướng trong 9 đv (thay vì 7).' },
      { name: 'Móng Vuốt Sắc Bén', desc: 'Chảy Máu kéo dài 6s (thay vì 4s).' },
      { name: 'Cào Cuồng Bạo', desc: 'Cào Loạn Xạ (S1) hồi chiêu nhanh hơn 1s.' },
    ],
    [
      { name: 'Vồ Mồi Từ Trên Cao', desc: 'Lao xuống từ tường gây choáng 1s.' },
      { name: 'Đứt Gân Toàn Phần', desc: 'Xé Toạc (S2) khi đủ tầng Chảy Máu tối đa: trói chân 1.25s (thay vì làm chậm).' },
      { name: 'Vết Cắn Truy Lùng', desc: 'Mỗi tầng Chảy Máu làm nạn nhân chậm 5%.' },
    ],
    [
      { name: 'Cắn Xé Cuồng Loạn', desc: 'Vồ Mồi đè trúng tướng: trong 2s dùng lại để ngoạm và quăng mục tiêu ra sau lưng Koda 3 đv.' },
      { name: 'Vuốt Quét 360', desc: 'Cào Loạn Xạ thành xoay tròn: cào mọi kẻ địch xung quanh (85% sát thương), mỗi kẻ 1 tầng Chảy Máu.' },
      { name: 'Đánh Hơi Con Mồi', desc: '+25% tốc chạy khi đuổi theo tướng có từ 3 tầng Chảy Máu.',
        tick(m, u) { const e = H.chasing(m, u, 10); if (e && H.stacks(e, BLEED) >= 3) m.addStatus(u, 'haste', 0.6, 0.25, { key: 'koda_hunt' }); } },
    ],
    [
      { name: 'Thú Tính Bất Diệt', desc: 'Thú Tính (S4) kéo dài thêm 2s và miễn nhiễm làm chậm.' },
      { name: 'Cơn Đói Khát Máu', desc: 'Chảy Máu tối đa 8 tầng (thay vì 5).' },
      { name: 'Xé Toạc Sinh Mệnh', desc: 'Xé Toạc khi đủ tầng tối đa: +18% máu đã mất (thay vì 10%) và hồi cho Koda 50% sát thương gây ra.' },
    ],
    [
      { name: 'Độn Thổ Rình Rập', desc: 'Vồ Mồi thành chui xuống đất (không thể bị chọn, xuyên tường) lướt tới tướng địch trong 7 đv, trồi lên hất tung 0.75s.' },
      { name: 'Sói Đầu Đàn', desc: '+300 máu; Chảy Máu gây Vết Thương Sâu lên tướng.', stats: { hp: 300 } },
      { name: 'Hộ Chủ Cuồng Bạo', desc: 'Mất hơn 20% máu trong 2s: không thể cản phá và +30% sát thương trong 3s (hồi 12s).',
        afterTake(m, u, att, info, dealt) {
          if (m.time - (u.ws.hcT || -9) > 2) { u.ws.hcT = m.time; u.ws.hcD = 0; }
          u.ws.hcD += dealt;
          if (u.ws.hcD > u.st.maxHp * 0.2 && H.ready(m, u, 'hccb', 12)) { m.addStatus(u, 'unstop', 3, 1); m.addStatus(u, 'buff', 3, 1, { key: 'koda_hc', mods: { dmgAmp: 0.3 } }); }
        } },
    ],
  ];
})();
