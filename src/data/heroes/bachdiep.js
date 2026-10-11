'use strict';
// ===== Bạch Diệp — Kiếm Vương Rotava • pháp sư / đấu sĩ ngự kiếm, tích kiếm vô hạn • mana + Kiếm Khí • phép =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const per = (u) => (H.T(u, '6a') ? 0.013 : 0.01);
  const AMP_CAP = 0.6;   // trần cộng sát thương từ kiếm (vẫn tích kiếm vô hạn cho Giáp Ảo / Vạn Kiếm Quy Tông)
  function addSw(m, u, n) {
    const before = u.ws.sw; u.ws.sw += n; u.ws.swT = m.time;
    if (H.T(u, '12b') && u.ws.sw > 25) { const k = u.ws.sw - Math.max(25, before); if (k > 0) { u.ws.swArm += 2 * k; u.dirty = true; } }
  }
  function domainTick(m, u) {
    const z = u.ws.dom; if (!z) return;
    m.hitCircle(u, z.x, z.y, 3.5, (e) => {
      m.damage(u, e, H.amt(u, 14 + 3 * u.level, 0, 0.12), 'magic', { tag: 's2', aoe: true });
      m.addStatus(e, 'slow', 0.6, 0.25, { src: u, key: 'bd_dom' });
      if (e.ga > 0) e.ga = Math.max(0, e.ga - 12);
      if (H.T(u, '3b') && m.time - z.t0 < 2) m.addStatus(e, 'nodash', 0.4, 1, { src: u, key: 'bd_dom' });
      if (H.T(u, '6c') && e.kind === 'hero') u.mp = Math.min(u.st.maxMp, u.mp + 8);
    }, { noFx: true });
    if (m.fxOn) m.fx({ type: 'ring', x: z.x, y: z.y, r: 3.5, color: '#bfe8ff', life: 0.35 });
  }
  H.def({
    id: 'bachdiep', name: 'Bạch Diệp', color: '#bfe8ff', gfx: 'flysword', kit: 'mage', pos: ['mid'], dmgType: 'magic',
    ranged: true, projSpeed: 22, projKind: 'sword', r: 0.56, resource: 'mana',
    stats: { range: 4.5, hp: 580, hpG: 90, mp: 460, mpG: 58, armor: 28, armorG: 3.8, mr: 32, mrG: 1.8, ms: 3.45 },
    gauge: (u) => ({ v: u.ws.sw || 0, max: Math.max(10, Math.ceil((u.ws.sw || 0) / 10) * 10), label: 'Kiếm Khí', color: '#bfe8ff' }),
    passive: {
      name: 'Vạn Kiếm Triệu • Mưa Kiếm Thức Thời',
      desc: 'Đánh thường gây sát thương phép. Mỗi phi kiếm Loạn Trảm trúng: +1 Kiếm; mỗi 5 đòn đánh trúng: +1 Kiếm. KHÔNG GIỚI HẠN số kiếm; mỗi kiếm +1% sát thương phép mọi đòn (tối đa +60%). Rời giao tranh 4s: mất 2 kiếm mỗi giây. Mỗi 10s, đòn đánh kế tiếp thành Mưa Kiếm: 6 phi kiếm rơi xuống bán kính 2 đv, làm chậm 30% 1.5s.',
      init(m, u) { u.ws.sw = 0; u.ws.swT = -99; u.ws.swArm = 0; u.ws.hitN = 0; u.ws.rainT = 0; u.ws.chain = 0; u.ws.chainT = -99; u.ws.dom = null; },
      update(m, u, dt) {
        if (u.ws.dom) {
          u.mp -= 20 * dt * (u.ws.sixUntil > m.time ? 0.7 : 1);
          if (u.mp <= 0 || !u.alive) { u.mp = Math.max(0, u.mp); u.ws.dom = null; }
          else if (m.time >= u.ws.dom.next) { u.ws.dom.next += 0.35; domainTick(m, u); }
        }
        if (m.tick % 10 !== 0) return;
        const hold = H.T(u, '9a') ? 8 : 4, rate = H.T(u, '9a') ? 1 : 2;
        if (u.ws.sw > 0 && m.time - Math.max(u.ws.swT, u.combatT || -99) > hold) { u.ws.sw = Math.max(0, u.ws.sw - rate); if (u.ws.sw <= 25 && u.ws.swArm) { u.ws.swArm = 0; u.dirty = true; } }
        const amp = Math.min(AMP_CAP * (H.T(u, '6a') ? 1.3 : 1), u.ws.sw * per(u)), a = u.statuses.find((s) => s.key === 'bd_sw');
        if (!a || Math.abs(a.mods.dmgAmp - amp) > 0.005 || a.mods.armor !== u.ws.swArm) { if (a) m.removeStatus(u, 'buff', 'bd_sw'); if (amp > 0 || u.ws.swArm) m.addStatus(u, 'buff', 9999, 1, { key: 'bd_sw', mods: { dmgAmp: amp, armor: u.ws.swArm, mr: u.ws.swArm } }); }
      },
      onAuto(m, u, t, info) {
        info.type = 'magic'; info.amt = u.st.ad * 0.6 + u.st.ap * 0.45 + 10 + 3 * u.level;
        u.ws.hitN++; if (u.ws.hitN >= (H.T(u, '1a') ? 3 : 5)) { u.ws.hitN = 0; addSw(m, u, 1); }
        if (u.ws.wing > m.time) { info.extra.push(() => { if (t.alive) m.damage(u, t, info.amt * 0.6, 'magic', { tag: 's4' }); if (t.ga > 0) t.ga *= 0.7; }); }
        if (m.time >= u.ws.rainT) {
          u.ws.rainT = m.time + (H.T(u, '3a') ? 6 : 10);
          const x = t.x, y = t.y, dmg = H.amt(u, 18 + 5 * u.level, 0, 0.15);
          for (let i = 0; i < 6; i++) m.later(0.1 + i * 0.08, (mm) => mm.hitCircle(u, x, y, 2, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 'p', aoe: true }); mm.addStatus(e, 'slow', 1.5, 0.3, { src: u, key: 'bd_rain' }); }, { color: '#bfe8ff', noFx: i > 0 }));
        }
      },
    },
    skills: {
      s1: {
        name: 'Kiếm Vũ: Loạn Trảm', desc: 'Hồi 0.25s. Phóng chuỗi phi kiếm bay thẳng 7.5 đv: số kiếm = 1 + 2 × số lần kích hoạt liên tiếp (trong 2s). Tốn 25 mana, mỗi lần liên tiếp +15 mana. Mỗi kiếm trúng: +1 Kiếm Khí; kiếm sau trúng cùng mục tiêu gây 50% và phá 20 Hộ Giáp.',
        cd: 0.25, cost: 25,
        can(m, u) { const n = m.time - u.ws.chainT < 2 ? u.ws.chain : 0; return u.ws.freeS1 > m.time || u.mp >= (25 + n * (H.T(u, '1b') ? 8 : 15)) * G.C.MANA_COST; },
        use(m, u, ctx) {
          const n = m.time - u.ws.chainT < 2 ? u.ws.chain : 0;
          const extra = n * (H.T(u, '1b') ? 8 : 15) * G.C.MANA_COST;
          if (u.ws.freeS1 > m.time) u.mp += m.costOf(u, 's1'); else u.mp = Math.max(0, u.mp - extra * (u.ws.sixUntil > m.time ? 0.7 : 1));
          if (u.ws.sixUntil > m.time && !(u.ws.freeS1 > m.time)) u.mp += m.costOf(u, 's1') * 0.3;
          u.ws.chain = Math.min(n + 1, 8); u.ws.chainT = m.time;
          const cnt = Math.min(11, 1 + n * 2), v = H.dirTo(u, ctx.pt), dmg = H.amt(u, 10 + 2 * u.level, 0, 0.1), hit = new Map();
          for (let i = 0; i < cnt; i++) {
            const a = Math.atan2(v.y, v.x) + (i - (cnt - 1) / 2) * 0.03;
            m.later(i * 0.03, (mm) => H.shoot(mm, u, { x: u.x + Math.cos(a) * 7.5, y: u.y + Math.sin(a) * 7.5 }, { speed: 26, range: 7.5, r: 0.35, kind: 'arrow', hitMinions: true,
              onHit: (m2, p, e) => {
                const k = hit.get(e.id) || 0; hit.set(e.id, k + 1);
                m2.damage(u, e, dmg * (k ? 0.5 : 1), 'magic', { tag: 's1', byp: H.T(u, '6b') ? 0.35 : 0 });
                if (k && e.ga > 0) e.ga = Math.max(0, e.ga - 20);
                if (e.kind === 'hero' || e.kind === 'monster') addSw(m2, u, 1);
              } }));
          }
        },
        ai: { use: 'poke', range: 7.5, aim: 'point', speed: 26, skillshot: true, cond: (m, u, t) => !!t && (u.ws.freeS1 > m.time || u.mp > u.st.maxMp * 0.3) },
      },
      s2: {
        name: 'Kiếm Trận Vạn Cổ', desc: 'Bật / tắt: chọn vùng trong 8 đv (bán kính 3.5); sau 0.3s kiếm cổ rơi mỗi 0.35s: sát thương phép, chậm 25%, đốt Hộ Giáp. Tốn 30 mana, sau đó 20 mana mỗi giây.',
        cd: 2, cost: 30,
        use(m, u, ctx) {
          if (u.ws.dom) { u.ws.dom = null; u.mp += m.costOf(u, 's2'); return; }
          const p = H.toward(u, ctx.pt, 8, false);
          m.telegraph({ shape: 'circle', x: p.x, y: p.y, r: 3.5, life: 0.3, team: u.team, color: '#bfe8ff' });
          u.ws.dom = { x: p.x, y: p.y, t0: m.time, next: m.time + 0.3 };
        },
        ai: { use: 'custom', aim: 'point', pick(m, u, t) {
          if (u.ws.dom) { const far = !t || M.dist(t, u.ws.dom) > 4.5; return (u.mp < u.st.maxMp * 0.25 || far) ? { pt: { x: u.x, y: u.y } } : null; }
          if (t && M.dist(u, t) < 9 && u.mp > u.st.maxMp * 0.6) return { pt: { x: t.x, y: t.y }, tgt: t };
          return null;
        } },
      },
      s3: {
        name: 'Kiếm Hộ Pháp', desc: 'Lướt lùi 4 đv, né mọi đòn bay tới. Giáp ảo = 100 (+15/cấp) + 30 × số Kiếm. Từ 15 Kiếm: miễn làm chậm, +25% tốc chạy 2.5s. Từ 30 Kiếm: Không Thể Cản Phá khi còn khiên.',
        cd: [11, 10, 9.5, 9, 8.5], cost: 50,
        use(m, u, ctx) {
          const e = H.nearestEnemyHero(m, u, 10), v = e ? H.dirTo(e, u) : H.dirTo(ctx.pt, u);
          if (H.T(u, '3c') && u.ws.sw >= 10) { u.ws.sw -= 5; m.hitCircle(u, u.x, u.y, 3, (x) => { m.damage(u, x, H.amt(u, 60 + 10 * u.level, 0, 0.4), 'magic', { tag: 's3', aoe: true }); m.knock(x, u.x, u.y, 3); }, { color: '#bfe8ff' }); }
          m.dashTo(u, u.x + v.x * 4, u.y + v.y * 4, 18, { untarget: true });
          const sh = m.shield(u, u, 100 + 15 * u.level + 30 * u.ws.sw, 4);
          if (u.ws.sw >= 15) { m.cleanse(u); m.addStatus(u, 'haste', 2.5, 0.25, { key: 'bd_s3' }); m.addStatus(u, 'buff', 2.5, 1, { key: 'bd_s3', mods: { tenacity: 0.5 } }); }
          if (u.ws.sw >= 30 && sh) m.addStatus(u, 'unstop', 4, 1, { key: 'bd_s3' });
        },
        ai: { use: 'escape', range: 4, aim: 'away', alsoEscape: true },
      },
      s4: {
        name: 'Thiên Kiếm Trận', desc: 'Chọn 1 trong 3 thế: • Lục Tinh Kiếm Trận (nhiều địch): bán kính 7.5, sát thương phép lớn + choáng 1s; Bạch Diệp đứng trong trận: −30% tiêu hao mana, +30% kháng mọi sát thương, +20% Công Phép 6s. • Phong Ấn Kiếm Vực (một đối thủ trong 6 đv): giam cả hai trong kiếm giới 4s, Bạch Diệp hồi 35 mana/giây, mỗi 0.5s 2 phi kiếm đâm xuống (+1 Kiếm mỗi nhịp). • Thiên Vũ Thăng Hoa (ít mana): +10 Kiếm, +70% tốc đánh 8s, hồi 40% mana, đòn đánh bắn 2 tia xé 30% Hộ Giáp.',
        cd: [90, 75, 60], cost: 100,
        use(m, u, ctx) {
          if (H.T(u, '12a')) u.ws.freeS1 = m.time + 4;
          const foes = m.enemiesIn(u.team, u.x, u.y, 7.5, { heroesOnly: true });
          const t = ctx.tgt && ctx.tgt.kind === 'hero' && M.dist(u, ctx.tgt) <= 6 ? ctx.tgt : null;
          if (foes.length >= 2) {
            const R = H.T(u, '9b') ? 10 : 7.5, life = H.T(u, '9b') ? 8 : 6, x = u.x, y = u.y;
            m.telegraph({ shape: 'circle', x, y, r: R, life: 0.4, team: u.team, color: '#bfe8ff' });
            m.later(0.4, (mm) => mm.hitCircle(u, x, y, R, (e) => { mm.damage(u, e, H.amt(u, [250, 380, 520][ctx.rank - 1], 0, 0.9), 'magic', { tag: 's4', aoe: true }); mm.addStatus(e, 'stun', 1, 1, { src: u }); }, { color: '#bfe8ff' }));
            u.ws.sixUntil = m.time + life;
            m.addStatus(u, 'reduce', life, 0.3, { key: 'bd_six' }); m.addStatus(u, 'buff', life, 1, { key: 'bd_six', mods: { dmgAmp: 0.2 } });
            if (m.fxOn) { m.fx({ type: 'ring', x, y, r: R, color: '#bfe8ff', life }); m.fx({ type: 'callout', id: u.id, text: '⚔ Lục Tinh Kiếm Trận!', color: '#bfe8ff' }); }
          } else if (t && u.mp > u.st.maxMp * 0.2) {
            const cx = (u.x + t.x) / 2, cy = (u.y + t.y) / 2, until = m.time + 4;
            m.addStatus(t, 'root', 0.6, 1, { src: u });
            m.zone({ owner: u, x: cx, y: cy, r: 4, life: 4, every: 0.5, kind: 'seal', tick: (mm) => {
              if (!t.alive) return;
              for (const h of [u, t]) { const d = M.dist(h, { x: cx, y: cy }); if (d > 3.8) { const k = 3.6 / d; h.x = cx + (h.x - cx) * k; h.y = cy + (h.y - cy) * k; } }
              u.mp = Math.min(u.st.maxMp, u.mp + 17.5);
              mm.damage(u, t, H.amt(u, 20 + 4 * u.level, 0, 0.2) * 2, 'magic', { tag: 's4' }); addSw(mm, u, 1);
              if (!t.alive && H.T(u, '9c')) { u.mp = u.st.maxMp; mm.heal(u, u, u.st.maxHp * 0.3); }
            } });
            m.addStatus(t, 'buff', 4, 1, { key: 'bd_seal', mods: {} }); u.ws.sealT = until;
            if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '⚔ Phong Ấn Kiếm Vực!', color: '#bfe8ff' });
          } else {
            addSw(m, u, 10); u.mp = Math.min(u.st.maxMp, u.mp + u.st.maxMp * 0.4); u.ws.wing = m.time + 8;
            m.addStatus(u, 'buff', 8, 1, { key: 'bd_wing', mods: { asPct: 0.7 } });
            if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '⚔ VẠN KIẾM NGHE LỆNH TA!', color: '#bfe8ff' });
          }
        },
        ai: { use: 'ult', range: 6, aim: 'unit', heroOnly: true },
      },
    },
    ai: { order: ['s2', 's1', 's3'], engageRange: 6, role: 'mage' },
    tags: ['stack'],
  });
  G.HEROES.bachdiep.tree = [
    [
      { name: 'Tụ Kiếm Thần Tốc', desc: 'Chỉ cần 3 đòn đánh để tích 1 Kiếm.' },
      { name: 'Loạn Trảm Tiết Kiệm', desc: 'Loạn Trảm tăng tiêu hao +8 mỗi lần (thay vì +15).' },
      { name: 'Kiếm Khí Tầm Xa', desc: 'Tầm đánh 5.5 đv.', stats: { range: 1 } },
    ],
    [
      { name: 'Mưa Kiếm Liên Hoàn', desc: 'Mưa Kiếm hồi 6s.' },
      { name: 'Kiếm Trận Trọng Lực', desc: 'Kiếm Trận cấm lướt và dây móc 2s đầu.' },
      { name: 'Hộ Pháp Bộc Phá', desc: 'Kiếm Hộ Pháp khi có ≥10 Kiếm: tiêu 5 Kiếm nổ kiếm khí đẩy lùi kẻ địch 3 đv.' },
    ],
    [
      { name: 'Kiếm Khí Bất Tận', desc: 'Mỗi Kiếm +1.3% sát thương (tối đa +78%).' },
      { name: 'Loạn Trảm Xuyên Giáp', desc: 'Loạn Trảm xuyên 35% Hộ Giáp.' },
      { name: 'Hấp Năng Kiếm Trận', desc: 'Mỗi nhịp Kiếm Trận trúng tướng: hồi 8 mana.' },
    ],
    [
      { name: 'Kiếm Ý Bất Diệt', desc: 'Kiếm giữ 8s ngoài giao tranh, mất 1 kiếm mỗi giây.' },
      { name: 'Lục Tinh Cực Hạn', desc: 'Lục Tinh bán kính 10 đv, kéo dài 8s.' },
      { name: 'Phong Ấn Đoạt Hồn', desc: 'Hạ địch trong Phong Ấn: hồi đầy mana và 30% máu.' },
    ],
    [
      { name: 'Vô Tận Kiếm Hải', desc: 'Phong cách: sau chiêu cuối, Loạn Trảm miễn phí mana 4s.' },
      { name: 'Vạn Kiếm Quy Tông', desc: 'Phong cách: trên 25 Kiếm, mỗi kiếm thêm +2 Giáp và +2 Kháng Phép.' },
      { name: 'Đại Sư Huynh Rotava', desc: '+12% Công Phép, +8% tốc chạy.', stats: { magicAmp: 0.12, msPct: 0.08 } },
    ],
  ];
})();
