'use strict';
// ===== Dahlia — Ảo Thuật Gia Mũ Đen • pháp sư / đấu sĩ đánh lừa, thao túng quái & vật triệu hồi • mana + Cuồng Nhiệt • phép =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const frenzy = (m, u) => u.ws.frenzyUntil > m.time;
  function gain(m, u, v) { if (frenzy(m, u)) return; u.ws.fz = Math.min(100, u.ws.fz + v); if (u.ws.fz >= 100) { u.ws.fz = 0; u.ws.frenzyUntil = m.time + (H.T(u, '9a') ? 12 : 8); if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🎩 CUỒNG NHIỆT!', color: '#c040ff' }); } }
  const nonHeroNear = (m, u, R) => m.units.filter((x) => x.alive && x.kind !== 'hero' && (x.kind === 'monster' || x.kind === 'pet') && !(x.kind === 'monster' && (x.big || x.boss)) && M.dist(x, u) <= R);
  const inStage = (m, u) => !!(u.ws.stage && u.ws.stage.until > m.time && M.dist(u, u.ws.stage) <= u.ws.stage.r);
  const HAT = (m, x, y, r) => { if (m.fxOn) m.fx({ type: 'tophat', x, y, r: r || 1.2, color: '#c040ff' }); };
  // GĐ12: vật triệu hồi cấp cao (phân ảnh Mirage S4, lính Victoria, Oktava, P-Zero) & quái lớn/boss: KHÔNG biến được thành ảo ảnh — chỉ ăn sát thương lớn
  const highTier = (x) => !!(x && (x.boss || x.big || (x.kind === 'pet' && x.owner && ['mirage', 'victoria', 'aria', 'roxie'].includes(x.owner.heroId))));
  function cloud(m, u, x, y) {
    m.zone({ owner: u, x, y, r: 2.5, life: 3.5, every: 0.5, kind: 'miasma', tick: (mm, z) => mm.hitCircle(u, x, y, 2.5, (e) => {
      mm.addStatus(e, 'blind', 0.6, 1, { src: u, key: 'dah_cloud' });
      if (H.T(u, '3a') && z.age < 0.8) mm.addStatus(e, 'silence', 0.75, 1, { src: u, key: 'dah_cloud' });
      mm.damage(u, e, e.st.maxHp * 0.01, 'magic', { tag: 'p', aoe: true });
      if (e.ga > 0) e.ga *= 0.85;
    }, { noFx: true }) });
  }
  function phantom(m, u, x, y, o) {
    o = o || {};
    const dmg = H.T(u, '9b') ? 0.55 : 0.35, stage = inStage(m, u);
    return m.makeDecoy(u, x, y, { life: o.life || 6, hp: 0.35 * (stage ? 1.5 : 1), dmg, runTo: o.runTo || null,
      onDeath: (mm, d) => { cloud(mm, u, d.x, d.y); gain(mm, u, H.T(u, '1a') ? 14 : 8); },
      onExpire: (mm, d) => { cloud(mm, u, d.x, d.y); gain(mm, u, H.T(u, '1a') ? 14 : 8); } });
  }
  H.def({
    id: 'dahlia', name: 'Dahlia', color: '#c040ff', gfx: 'blackcane', kit: 'mage', pos: ['mid', 'jungle'], dmgType: 'magic',
    ranged: true, projSpeed: 20, projKind: 'rose', r: 0.56, resource: 'mana',
    stats: { range: 5.0, hp: 555, hpG: 88, mp: 400, mpG: 48, armor: 25, armorG: 3.7, ms: 3.45 },
    gauge: (u, m) => ({ v: u.ws.frenzyUntil > (m ? m.time : 0) ? 100 : u.ws.fz || 0, max: 100, label: 'Cuồng Nhiệt', color: '#c040ff' }),
    passive: {
      name: 'Náo Nhiệt & Cuồng Nhiệt • Chiếc Mũ Thoát Hiểm • Ảo Ảnh Chết Chóc • Gậy Đen',
      desc: 'Có ai lướt / dịch chuyển gần đó: +5 Náo Nhiệt; quái, vật triệu hồi, ảo ảnh bị hạ: +8; có đơn vị không phải tướng trong 6 đv: +3/giây. Đủ 100 → Cuồng Nhiệt 8s: +40% tốc đánh, +25% sát thương phép, +20% tốc chạy, cường hóa mọi chiêu. Tụt xuống 50% máu (90s): mũ cao chụp xuống, Dahlia dịch chuyển 5.5 đv, chiếc mũ phát nổ choáng 1s quanh chỗ cũ. Ảo ảnh của Dahlia tự đánh (35%) và khi tan để lại khói độc 3.5s (mù, độc, gọt Hộ Giáp). Đánh thường gây sát thương phép, đòn thứ 3 liên tiếp nổ lan 2 đv.',
      init(m, u) { u.ws.fz = 0; u.ws.frenzyUntil = 0; u.ws.hatT = 0; u.ws.hits = { id: 0, n: 0 }; u.ws.stageHits = 0; },
      update(m, u) {
        if (m.tick % 10 !== 0) return;
        if (nonHeroNear(m, u, 6).length) gain(m, u, 1.5);
        if (m.heroes.some((h) => h.alive && h !== u && h.dash && !h.dash.cc && M.dist(h, u) < 12)) gain(m, u, 2.5);
        const on = frenzy(m, u), s = u.hasKey('dah_frenzy');
        if (on && !s) { m.addStatus(u, 'buff', u.ws.frenzyUntil - m.time, 1, { key: 'dah_frenzy', mods: { asPct: 0.4, msPct: 0.2, dmgAmp: 0.25 } }); }
        // Chiếc Mũ Thoát Hiểm
        if (u.hpPct < 0.5 && m.time >= u.ws.hatT && m.time - (u.lastDmgT || -99) < 1.2) {
          u.ws.hatT = m.time + 90 * (H.T(u, '12b') ? 0.5 : 1);
          const from = { x: u.x, y: u.y }, e = H.nearestEnemyHero(m, u, 10), v = e ? H.dirTo(e, u) : { x: -u.fx, y: -u.fy };
          HAT(m, from.x, from.y, 1.6); m.blink(u, u.x + v.x * 5.5, u.y + v.y * 5.5);
          m.later(0.5, (mm) => mm.hitCircle(u, from.x, from.y, 3, (x) => { mm.damage(u, x, H.amt(u, 60 + 12 * u.level, 0, 0.5), 'magic', { tag: 'p', aoe: true }); mm.addStatus(x, 'stun', 1, 1, { src: u }); }, { color: '#c040ff' }));
          if (H.T(u, '3b')) m.shield(u, u, u.st.maxHp * 0.2, 3);
          if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🎩 Để xem đêm nay sẽ thú vị như nào!', color: '#c040ff' });
        }
      },
      onAuto(m, u, t, info) {
        info.type = 'magic'; info.amt = u.st.ad * 0.7 + u.st.ap * 0.35;
        if (inStage(m, u)) { info.amt *= 1.3; u.ws.stageHits++; }
        const h = u.ws.hits; if (h.id !== t.id) { h.id = t.id; h.n = 0; } h.n++;
        if (h.n >= 3) { h.n = 0; const R = H.T(u, '3c') ? 3.5 : 2, amt = H.amt(u, 30 + 8 * u.level, 0, 0.4); info.extra.push(() => m.hitCircle(u, t.x, t.y, R, (e) => m.damage(u, e, amt, 'magic', { tag: 'p', aoe: true }), { color: '#c040ff' })); if (H.T(u, '1b')) u.cd.s1 = Math.max(0, (u.cd.s1 || 0) - 0.5); }
        if (u.ranks.s3 > 0) info.extra.push(() => m.addStatus(t, 'slow', 1.5, 0.25, { src: u, key: 'dah_slow' }));
        this_stageSpawn(m, u, t);
      },
      onDeal(m, u, t, info) {
        // đòn đánh của ảo ảnh: làm chậm, trong sân khấu chắc chắn gây độc; đếm đòn để sinh ảo ảnh mới
        if (info.auto && info.src && info.src.decoy) {
          if (u.ranks.s3 > 0) m.addStatus(t, 'slow', 1.5, 0.25, { src: u, key: 'dah_slow' });
          if (inStage(m, u)) { m.dot(u, t, 6 + u.level, 2, 'magic', 'dah_poison'); u.ws.stageHits++; this_stageSpawn(m, u, t); }
        }
      },
      onTake(m, u, att, info) {
        if (!(u.ws.trick > m.time)) return;
        const a = att && (G.ownerOf ? G.ownerOf(att) : att); if (!a || a.team === u.team || a.kind !== 'hero') return;
        info.amt = 0; u.ws.trick = 0;
        const fz = frenzy(m, u), dmg = u.ws.trickDmg * (fz ? 1.5 : 1);
        m.later(0, (mm) => {
          if (!a.alive || !u.alive) return;
          HAT(mm, a.x, a.y, 1.9); mm.addStatus(a, 'root', 0.6, 1, { src: u }); mm.damage(u, a, dmg, 'magic', { tag: 's2' });
          if (fz) mm.addStatus(a, 'stun', 1.25, 1, { src: u });
          if (H.T(u, '6b') && a.ga > 0) a.ga = Math.max(0, a.ga - 300);
          const v = H.dirTo(a, u); mm.blink(u, u.x + v.x * 3.5, u.y + v.y * 3.5);
          if (mm.fxOn) mm.fx({ type: 'callout', id: a.id, text: '🎩 Màn Ảo Thuật!', color: '#c040ff' });
        });
      },
      onFatal(m, u) {
        if (!H.ready(m, u, 'maiden', 120 * (H.T(u, '12b') ? 0.5 : 1))) return false;
        const sw = m.units.filter((x) => x.alive && x !== u && x.kind !== 'hero' && M.dist(x, u) < 12).sort((a, b) => M.dist(a, u) - M.dist(b, u))[0];
        if (!sw) return false;
        u.hp = 1; const x = u.x, y = u.y; m.blink(u, sw.x, sw.y); sw.x = x; sw.y = y;
        m.addStatus(u, 'stealth', 2, 1, { key: 'dah_swap' }); m.addStatus(u, 'invuln', 0.5, 1, { key: 'dah_swap' });
        return true;
      },
    },
    skills: {
      s1: {
        name: 'Thoát Nguy', desc: 'Hoán đổi vị trí tức thì với một đơn vị không phải tướng (quái, vật triệu hồi, ảo ảnh) trong 8 đv; tàng hình 1.5s, +30% tốc đánh và +20% sát thương phép 3s. Cuồng Nhiệt: chụp Mũ Đen lên tối đa 3 đơn vị không phải tướng trong 6 đv, biến chúng thành bản sao Dahlia 6s. Trong Sân Khấu Chết Chóc: thành Hư Ảnh Bước (dịch chuyển 2.5 đv, tàng hình 0.75s, hồi 1.2s).',
        cd: [9, 8.5, 8, 7.5, 7], cost: [50, 50, 50, 50, 50], manualCd: true,
        can(m, u) { return inStage(m, u) || nonHeroNear(m, u, H.T(u, '6c') ? 11.5 : 8).length > 0 || m.decoysOf(u).length > 0; },
        use(m, u, ctx) {
          if (inStage(m, u)) { HAT(m, u.x, u.y, 1); u.cd.s1 = 1.2; u.mp += m.costOf(u, 's1'); const p = H.toward(u, ctx.pt, 2.5, false); m.blink(u, p.x, p.y); m.addStatus(u, 'stealth', 0.75, 1, { key: 'dah_step' }); return; }
          u.cd.s1 = m.cdOf(u, 's1');
          if (frenzy(m, u)) {
            const all = m.units.filter((x) => x.alive && x.kind !== 'hero' && (x.kind === 'monster' || x.kind === 'pet') && x.owner !== u && M.dist(x, u) <= 6).slice(0, H.T(u, '6a') ? 5 : 3);
            const L = all.filter((x) => !highTier(x));
            for (const x of L) { const px = x.x, py = x.y; HAT(m, px, py, 1.1); m.damage(u, x, x.hp + 1, 'true', { tag: 's1' }); phantom(m, u, px, py, { life: 6 }); }
            for (const x of all) if (highTier(x)) { HAT(m, x.x, x.y, 1.4); m.damage(u, x, Math.min(x.st.maxHp * 0.2, 400) + H.amt(u, 120 + 20 * u.level, 0, 1), 'magic', { tag: 's1' }); }
            if (all.length && !L.length) return;
            if (L.length) return;
          }
          const R = H.T(u, '6c') ? 11.5 : 8;
          const cand = nonHeroNear(m, u, R).concat(m.decoysOf(u)).sort((a, b) => M.dist(a, ctx.pt) - M.dist(b, ctx.pt) || a.id - b.id)[0];
          if (!cand) return;
          const x = u.x, y = u.y; HAT(m, x, y, 1.1); HAT(m, cand.x, cand.y, 1.1); m.blink(u, cand.x, cand.y); cand.x = x; cand.y = y;
          m.addStatus(u, 'stealth', 1.5, 1, { key: 'dah_s1' });
          m.addStatus(u, 'buff', 3, 1, { key: 'dah_s1', mods: { asPct: 0.3, dmgAmp: 0.2, tenacity: H.T(u, '1c') ? 0.35 : 0 } });
        },
        ai: { use: 'engage', range: 8, aim: 'point', speed: 0, alsoEscape: true, skillshot: true },
      },
      s2: {
        name: 'Hoán Vị & Màn Ảo Thuật', desc: 'Thế "Màn Ảo Thuật" 1.2s: tướng địch nào ra đòn vào Dahlia bị Mũ Cao khổng lồ chụp xuống giam lại, kiếm ma thuật đâm xuyên (sát thương phép lớn); Dahlia biến mất và hiện ra cách đó 3.5 đv. Cuồng Nhiệt: +50% sát thương và choáng nạn nhân 1.25s. Nội tại: nhận đòn chí tử thì đổi chỗ với đơn vị gần nhất và tàng hình 2s (120s).',
        cd: [14, 13, 12, 11, 10], cost: [60, 60, 60, 60, 60],
        use(m, u, ctx) { u.ws.trick = m.time + 1.2; u.ws.trickDmg = H.amt(u, ctx.v([100, 150, 200, 250, 300]), 0, 0.8); if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#c040ff', life: 1.2 }); },
        ai: { use: 'defend', range: 6, aim: 'self' },
      },
      s3: {
        name: 'Đôi Ảnh Quấy Nhiễu', desc: 'Tạo 2 ảo ảnh bước đều về phía trước hình chữ V (7 đv) tự đánh tướng địch trên đường; Dahlia +35% tốc đánh, +25% tốc chạy 3.5s. Nội tại: đòn đánh của Dahlia và ảo ảnh làm chậm 25% 1.5s.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [55, 55, 55, 55, 55],
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt);
          for (const s of [-1, 1]) { const a = Math.atan2(v.y, v.x) + s * 0.35; phantom(m, u, u.x, u.y, { life: 6, runTo: { x: u.x + Math.cos(a) * 7, y: u.y + Math.sin(a) * 7 } }); }
          m.addStatus(u, 'buff', 3.5, 1, { key: 'dah_s3', mods: { asPct: 0.35 } }); m.addStatus(u, 'haste', 3.5, 0.25, { key: 'dah_s3' });
        },
        ai: { use: 'burst', range: 7, aim: 'point', speed: 0 },
      },
      s4: {
        name: 'Sân Khấu Chết Chóc', desc: 'Cắm gậy mở vũ đài bóng tối bán kính 10/15/20 đv trong 8/10/12s (thấy rõ vành rèm nhung tím): Thoát Nguy thành Hư Ảnh Bước; +60% tốc đánh, +30% sát thương đòn đánh; mỗi 10 đòn trúng (của Dahlia và ảo ảnh) sinh một ảo ảnh mới cạnh mục tiêu; ảo ảnh trong sân khấu +50% máu và đánh chắc chắn gây độc. Dahlia cố đánh trong vòng sân khấu.',
        cd: [90, 75, 60], cost: [100, 100, 100],
        use(m, u, ctx) {
          const R = ctx.v([10, 15, 20]), life = ctx.v([8, 10, 12]) + (H.T(u, '9c') ? 3 : 0);
          u.ws.stage = { x: u.x, y: u.y, r: R, until: m.time + life }; u.ws.stageHits = 0;
          m.addStatus(u, 'buff', life, 1, { key: 'dah_stage', mods: { asPct: 0.6 } });
          m.zone({ owner: u, x: u.x, y: u.y, r: R, life, every: 1, kind: 'darkstage', tick: () => {} });
          m.hitCircle(u, u.x, u.y, Math.min(R, 9), (e) => m.damage(u, e, H.amt(u, 100 + 15 * u.level, 0, 0.5), 'magic', { tag: 's4', aoe: true }), { color: '#c040ff' });
          HAT(m, u.x, u.y, 2.2);
          if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🎩 Màn diễn bắt đầu!', color: '#c040ff' });
        },
        ai: { use: 'ult', aim: 'self', range: 7, aoe: 8 },
      },
    },
    ai: { order: ['s3', 's1', 's2'], engageRange: 6, role: 'mage',
      // GĐ12: đang mở Sân Khấu — kéo giao tranh về trong vòng (mục tiêu chạy ra ngoài thì không đuổi quá mép)
      micro(ai, enemies) { if (G.T12 && G.T12.dahliaEscape(ai, enemies)) return true; const m = ai.m, u = ai.u, st = u.ws.stage; if (!st || st.until <= m.time || u.cast || u.dash) return false; const d = M.dist(u, st); if (d > st.r - 1.2 && d < st.r + 8) { const v = H.dirTo(u, st); u.goal = { x: u.x + v.x * 3, y: u.y + v.y * 3 }; u.attackTarget = null; return true; } return false; } },
    tags: ['illusion', 'stealth'],
  });
  // Cỗ Máy Sinh Ảnh: đủ số đòn trong sân khấu thì sinh ảo ảnh mới cạnh mục tiêu
  function this_stageSpawn(m, u, t) {
    if (!inStage(m, u)) return;
    const need = H.T(u, '12a') ? 5 : 10;
    if (u.ws.stageHits >= need) { u.ws.stageHits = 0; phantom(m, u, t.x + 1, t.y + 1, { life: 6 }); }
  }
  G.HEROES.dahlia.tree = [
    [
      { name: 'Khán Giả Quái Vật', desc: 'Đơn vị không phải tướng bị hạ: +14 Náo Nhiệt (thay vì 8).' },
      { name: 'Gậy Phép Tốc Độ', desc: 'Đòn đánh thứ 3 giảm 0.5s hồi chiêu Thoát Nguy.' },
      { name: 'Bồ Câu Lướt Gió', desc: 'Sau Thoát Nguy: +35% kháng làm chậm 3s.' },
    ],
    [
      { name: 'Độc Khí Tê Liệt', desc: 'Khói độc của ảo ảnh câm lặng 0.75s đầu.' },
      { name: 'Chiếc Mũ Gia Cố', desc: 'Mũ Thoát Hiểm cho giáp ảo 20% máu tối đa.' },
      { name: 'Tia Sáng Liên Hoàn', desc: 'Đòn thứ 3 nổ lan 3.5 đv.' },
    ],
    [
      { name: 'Đại Đội Ảo Ảnh', desc: 'Cuồng Nhiệt: Thoát Nguy biến tối đa 5 đơn vị.' },
      { name: 'Màn Ảo Thuật Phá Giáp', desc: 'Kiếm đâm của Màn Ảo Thuật phá 300 Hộ Giáp.' },
      { name: 'Thoát Nguy Tầm Xa', desc: 'Thoát Nguy với tới 11.5 đv.' },
    ],
    [
      { name: 'Cuồng Nhiệt Vô Tận', desc: 'Cuồng Nhiệt kéo dài 12s.' },
      { name: 'Ảo Ảnh Đao Phong', desc: 'Ảo ảnh đánh 55% sát thương.' },
      { name: 'Sân Khấu Kéo Dài', desc: 'Sân Khấu Chết Chóc kéo dài thêm 3s.' },
    ],
    [
      { name: 'Vua Bầy Ảo Ảnh', desc: 'Phong cách: trong sân khấu chỉ cần 5 đòn để sinh ảo ảnh.' },
      { name: 'Ảo Thuật Gia Bất Tử', desc: 'Phong cách: Mũ Thoát Hiểm và Hoán Vị chí tử hồi nhanh gấp đôi.' },
      { name: 'Đệ Tử Cống Ngầm', desc: '+15% tốc đánh, +10% tốc chạy.', stats: { asPct: 0.15, msPct: 0.1 } },
    ],
  ];
})();
