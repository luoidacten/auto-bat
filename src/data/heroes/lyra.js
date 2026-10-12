'use strict';
// ===== Lyra — Chuột Lũi Của Đại Dương • pháp sư khống chế bằng sóng nước, giữ mạng trên hết • mana • phép =====
// GĐ10: làm lại theo tài liệu bổ sung (đánh thường làm chậm, S1 choáng nếu đã chậm, S2 giáp bong bóng, S4 tầm xa 10/20/30 + vực xoáy).
// TƯỚNG MỚI (GĐ5): unreleased + release — G.Patch.make tự đưa vào hàng chờ.
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const TIDE = 'lyra_tide';
  const bushy = (u) => u.bush >= 0;
  const lateZone = (m) => m.zoneSt && m.zoneSt.phase >= 4;
  // Thủy Triều: chiêu trúng tướng tích 1 tầng; đủ 3 tầng → trói chân 0.75s (mỗi mục tiêu tối đa 1 lần/6s)
  function tide(m, u, e) {
    if (!e || !e.alive || e.kind !== 'hero') return;
    const s = m.addStatus(e, 'mark', 4, 1, { key: TIDE, stack: 'add', max: 3, src: u });
    if (s && (s.n || 1) >= 3 && H.ready(m, u, 'tide' + e.id, 6)) {
      m.removeStatus(e, 'mark', TIDE);
      m.addStatus(e, 'root', 0.75, 1, { src: u });
      if (m.fxOn) m.fx({ type: 'burst', x: e.x, y: e.y, color: '#5ac8ff' });
    }
  }
  function bubbleTrap(m, u, x, y) {
    let used = false;
    m.zone({ owner: u, x, y, r: 0.9, life: 6, every: 0.1, kind: 'trap', tick: (mm, z) => {
      if (used) return; const L = mm.enemiesIn(u.team, x, y, 0.9); if (!L.length) return; used = true; z.life = 0;
      for (const e of L) mm.addStatus(e, 'root', 0.75, 1, { src: u });
    } });
  }
  H.def({
    id: 'lyra', name: 'Lyra', color: '#4ab8e8', gfx: 'tidestaff', kit: 'mage', pos: ['mid', 'sup'], dmgType: 'magic',
    ranged: true, projSpeed: 15, projKind: 'water', r: 0.6, resource: 'mana',
    stats: { range: 5.5, hp: 550, hpG: 84, mp: 420, mpG: 50, ad: 52, adG: 3, armor: 22, armorG: 3.6, mr: 30, mrG: 1.4, as: 0.63, asG: 0.015, ms: 3.35 },
    unreleased: true, release: 2, tagline: 'chuột lũi đại dương — khống chế chuỗi, giữ mạng, thả cột nước từ xa',
    passive: {
      name: 'Thủy Triều',
      desc: 'Đánh thường gây sát thương phép và làm chậm 15% 1s. Chiêu trúng tướng địch tích 1 tầng Thủy Triều (4s); đủ 3 tầng: trói chân 0.75s (mỗi mục tiêu 1 lần/6s).',
      init(m, u) { u.ws.stealthOut = false; u.ws.fast = 0; },
      update(m, u) {
        if (m.tick % 10 !== 0) return;
        // Ẩn Ngư Dưới Cát: rời giao tranh 4s thì ngụy trang (ven bụi / nước / đá)
        if (H.T(u, '6a')) {
          const ooc = m.time - (u.combatT || -99) > 4 && m.time - (u.lastDmgT || -99) > 4;
          if (ooc && !u.has('stealth') && !m.heroes.some((e) => e.alive && e.team !== u.team && M.dist(e, u) < 3)) { m.addStatus(u, 'stealth', 1.2, 1, { key: 'lyra_camo' }); u.ws.stealthOut = true; }
        }
        // Vua Bụi Rậm Biển Sâu: bo 5–6 trong bụi hồi chiêu nhanh hơn 40%
        if (H.T(u, '12b') && lateZone(m) && bushy(u)) for (const k of ['s1', 's2', 's3', 's4']) if (u.cd[k] > 0) u.cd[k] = Math.max(0, u.cd[k] - 0.4 * 0.5);
        // Chuột Bụi Thủy Tộc: trong bụi +1 tầm đánh
        const want = H.T(u, '1a') && bushy(u);
        if (want && !u.hasKey('lyra_bush')) m.addStatus(u, 'buff', 9999, 1, { key: 'lyra_bush', mods: { range: 1 } });
        else if (!want && u.hasKey('lyra_bush')) m.removeStatus(u, 'buff', 'lyra_bush');
      },
      onAuto(m, u, t, info) {
        info.type = 'magic'; info.amt = u.st.ad * 0.8 + u.st.ap * 0.3;
        const slow = H.T(u, '1a') && bushy(u) ? 0.3 : 0.15;
        info.extra.push(() => t.alive && m.addStatus(t, 'slow', 1, slow, { src: u, key: 'lyra_auto' }));
        if (u.ws.stealthOut && u.hasKey('lyra_camo')) { u.ws.stealthOut = false; m.removeStatus(u, 'stealth', 'lyra_camo'); info.extra.push(() => t.alive && t.kind === 'hero' && m.addStatus(t, 'stun', 1, 1, { src: u })); }
        if (H.T(u, '1c') && t.kind === 'hero') { u.ws.fast = Math.min(3, (u.ws.fast || 0) + 1); m.addStatus(u, 'haste', 2, 0.05 * u.ws.fast, { key: 'lyra_fast' }); }
        if (H.T(u, '12b') && lateZone(m) && bushy(u)) info.extra.push(() => t.alive && m.damage(u, t, info.amt * 0.6, 'magic', { tag: 'p' }));
      },
      onFatal(m, u) {
        if (!H.T(u, '12c') || !H.ready(m, u, 'tears', 180)) return false;
        u.hp = 1; m.addStatus(u, 'invuln', 2.5, 1, { key: 'lyra_tears' }); m.addStatus(u, 'root', 2.5, 1, { key: 'lyra_tears' });
        m.later(2.5, (mm) => { if (!u.alive) return; mm.heal(u, u, u.st.maxHp * 0.4); mm.hitCircle(u, u.x, u.y, 4, (e) => { const v = H.dirTo(u, e); mm.knock(u, e, v.x, v.y, 4, 0.3); }, { color: '#7ad8ff' }); });
        if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '💧 Nước Mắt Nữ Thần', color: '#7ad8ff' });
        return true;
      },
    },
    skills: {
      s1: {
        name: 'Bong Bóng Nước', desc: 'Bắn bong bóng 8 đv: 60/95/130/165/200 (+60% SMPT) sát thương phép lên kẻ đầu tiên trúng, làm chậm 25% 1s. Mục tiêu đã bị làm chậm từ trước: thành choáng 1s.',
        cd: [6, 5.5, 5, 4.5, 4], cost: [50, 55, 60, 65, 70], castTime: 0.2,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0, 0.6);
          const hitOne = (mm, e, k) => { const wasSlow = e.has('slow'); mm.damage(u, e, dmg * k, 'magic', { tag: 's1' }); if (wasSlow) mm.addStatus(e, 'stun', 1, 1, { src: u }); else mm.addStatus(e, 'slow', 1, 0.25, { src: u }); tide(mm, u, e); };
          H.shoot(m, u, ctx.pt, { speed: 15, range: 8, r: 0.5, kind: 'star',
            onHit: (mm, p, e) => {
              p.dead = true; hitOne(mm, e, 1);
              if (H.T(u, '1b')) { const o = mm.enemiesIn(u.team, e.x, e.y, 4).filter((x) => x !== e).sort((a, b) => M.dist2(a, e) - M.dist2(b, e) || a.id - b.id)[0]; if (o) mm.later(0.15, (m2) => o.alive && hitOne(m2, o, 0.6)); }
            } });
        },
        ai: { use: 'poke', range: 7.8, aim: 'point', speed: 15, farm: 3, skillshot: true },
      },
      s2: {
        name: 'Sóng Dâng', desc: 'Đẩy con sóng 7 đv (rộng 1.4): 50/80/110/140/170 (+45% SMPT) sát thương phép, đẩy lùi 1.5/2/2.5/3/3.5 đv. Lyra nhận giáp bong bóng 8% máu tối đa; giáp vỡ hoặc hết hạn thì nổ sóng xung kích đẩy lùi kẻ địch quanh 2 đv.',
        cd: [11, 10.5, 10, 9.5, 9], cost: [60, 65, 70, 75, 80], castTime: 0.2,
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0, 0.45), push = ctx.v([1.5, 2, 2.5, 3, 3.5]), W = H.T(u, '3c') ? 2.8 : 1.4;
          let first = true;
          m.hitLine(u, u.x, u.y, v.x, v.y, 7, W, (e) => {
            m.damage(u, e, dmg, 'magic', { tag: 's2', aoe: true }); m.knock(u, e, v.x, v.y, push, 0.25); tide(m, u, e);
            if (first && H.T(u, '3c')) { first = false; m.knockup(u, e, 0.3); }
            if (H.T(u, '6b')) m.later(0.3, (mm) => { if (e.alive && G.MAP.inWall(e.x + v.x * (e.r + 0.5), e.y + v.y * (e.r + 0.5), 0.2)) { mm.addStatus(e, 'stun', 1, 1, { src: u }); if (e.ga > 0) e.ga = Math.max(0, e.ga - 200); } });
          }, { color: '#5ac8ff' });
          const sh = m.shield(u, u, u.st.maxHp * 0.08, 3);
          if (sh) { let done = false; const pop = (mm) => { if (done || !u.alive) return; done = true; mm.hitCircle(u, u.x, u.y, 2, (e) => { const d = H.dirTo(u, e); mm.knock(u, e, d.x, d.y, 2, 0.2); }, { color: '#7ad8ff' }); if (H.T(u, '3a')) for (let i = 0; i < 3; i++) { const a = i * 2.094; bubbleTrap(mm, u, u.x + M.cos(a) * 1.8, u.y + M.sin(a) * 1.8); } };
            for (let i = 1; i <= 15; i++) m.later(i * 0.2, (mm) => { if (sh.v <= 1 || i === 15) pop(mm); }); }
        },
        ai: { use: 'cc', range: 6.5, aim: 'point', speed: 0, alsoEscape: true },
      },
      s3: {
        name: 'Dòng Chảy', desc: 'Lyra và đồng minh thấp máu nhất trong 10 đv nhận khiên 50/80/110/140/170 (+35/35/40/40/45% SMPT) trong 2.5/3/3/3/3.5s, +30% tốc chạy 2s và hồi ngay 20% máu đã mất.',
        cd: [14, 13, 12, 11, 10], cost: [60, 60, 60, 60, 60],
        use(m, u, ctx) {
          const amt = H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0, ctx.v([0.35, 0.35, 0.4, 0.4, 0.45])), T = ctx.v([2.5, 3, 3, 3, 3.5]);
          const al = H.alliesNear(m, u, 10).sort((a, b) => a.hpPct - b.hpPct)[0];
          for (const t of al ? [u, al] : [u]) {
            m.shield(u, t, amt, T); m.addStatus(t, 'haste', 2, 0.3);
            const k = H.T(u, '3b') && t.hpPct < 0.3 ? 0.35 : 0.2; m.heal(u, t, (t.st.maxHp - t.hp) * k);
          }
          if (H.T(u, '6c')) u.ws.manaShieldT = m.time + T;
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#7ad8ff', life: 1.5 });
        },
        ai: { use: 'custom', aim: 'self', pick(m, u) {
          const hurt = m.time - (u.lastDmgT || -99) < 1 && u.hpPct < 0.75, al = H.alliesNear(m, u, 10).some((a) => a.hpPct < 0.5);
          return hurt || al ? { pt: { x: u.x, y: u.y } } : null;
        } },
      },
      s4: {
        name: 'Đại Hồng Thủy', desc: 'Niệm 0.75s (vùng cảnh báo), gọi cột nước vào điểm trong 10/20/30 đv: bán kính 3.5/5/8, 180/270/360 (+80% SMPT) sát thương phép, hất tung 1s. Để lại vực xoáy 4s: hút nhẹ về tâm, chậm 40%, sát thương mỗi 0.5s và tích Thủy Triều; Lyra và đồng minh trong xoáy hồi 3% máu mỗi giây.',
        cd: [110, 95, 80], cost: [100, 100, 100], castTime: 0.25,
        use(m, u, ctx) {
          const far = H.T(u, '12a') ? 60 : ctx.v([10, 20, 30]), R = H.T(u, '12a') ? 8 : ctx.v([3.5, 5, 8]);
          const pick = u.ctl ? null : H.bestAoe(m, u, far, R, 0.9), p = pick || H.toward(u, ctx.pt, far, true), dmg = H.amt(u, ctx.v([180, 270, 360]), 0, 0.8);   // GĐ11: chọn nơi đông địch nhất (hoặc kẻ gần nhất), đón đầu 0.9s; trước đây luôn rơi ở tầm tối đa nên trượt
          m.telegraph({ team: u.team, x: p.x, y: p.y, r: R, life: 0.75, color: '#3a9ad8' });
          let ward = null;
          if (H.T(u, '9a')) { ward = m.shield(u, u, u.st.maxHp * 0.3, 0.8); m.addStatus(u, 'unstop', 0.75, 1, { key: 'lyra_ward' }); }
          if (H.T(u, '9b')) for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.785; const x = u.x + M.cos(a) * 2, y = u.y + M.sin(a) * 2;
            m.later(0.4, (mm) => mm.hitCircle(u, x, y, 2, (e) => { mm.damage(u, e, dmg * 0.5, 'magic', { tag: 's4', aoe: true }); const d = H.dirTo(u, e); mm.knock(u, e, d.x, d.y, 3, 0.3); }, { color: '#4ab8e8' })); }
          m.later(0.75, (mm) => {
            if (ward && ward.v > 1) u.mp = Math.min(u.st.maxMp, u.mp + mm.costOf(u, 's4') * 0.5);
            mm.hitCircle(u, p.x, p.y, R, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's4', aoe: true }); mm.knockup(u, e, 1); tide(mm, u, e); }, { color: '#4ab8e8' });
            if (mm.fxOn) mm.fx({ type: 'boom', x: p.x, y: p.y, big: true });
            const VR = Math.min(R, 5);
            mm.zone({ owner: u, x: p.x, y: p.y, r: VR, life: 4, every: 0.5, kind: 'vortex', tick: (m2) => {
              m2.hitCircle(u, p.x, p.y, VR, (e) => {
                m2.damage(u, e, dmg * 0.08, 'magic', { tag: 's4', aoe: true }); m2.addStatus(e, 'slow', 0.6, 0.4, { src: u, key: 'lyra_vortex' }); tide(m2, u, e);
                if (H.T(u, '9c')) m2.addStatus(e, 'nodash', 0.6, 1, { src: u, key: 'lyra_vortex' });
                const d = M.dist(e, p); if (d > 0.6 && !e.has('unstop')) { e.x += (p.x - e.x) / d * 0.35; e.y += (p.y - e.y) / d * 0.35; }
              }, { noFx: true });
              for (const a of [u].concat(H.alliesNear(m2, u, 30))) if (a.alive && M.dist(a, p) <= VR) m2.heal(u, a, a.st.maxHp * 0.015);
            } });
          });
        },
        ai: { use: 'ult', range: 10, aim: 'point', speed: 0, delay: 1, aoe: 3.5,
          // GĐ11: tầm thật theo cấp chiêu (10/20/30, nhánh 12a: 60); chỉ tung khi có tướng địch lọt vùng
          rangeFn: (m, u) => (H.T(u, '12a') ? 60 : [10, 20, 30][Math.max(0, Math.min(2, m.rankOf(u, 's4') - 1))]),
          cond: (m, u) => { const far = H.T(u, '12a') ? 60 : [10, 20, 30][Math.max(0, Math.min(2, m.rankOf(u, 's4') - 1))]; return !!H.bestAoe(m, u, far, H.T(u, '12a') ? 8 : [3.5, 5, 8][Math.max(0, Math.min(2, m.rankOf(u, 's4') - 1))], 0.9); } },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 6.5, role: 'mage' },
    tags: ['cc', 'poke'],
  });
  // Thủy Giáp Phản Hồi: khiên Dòng Chảy chuyển 30% sát thương phép nhận vào thành mana
  const P = G.HEROES.lyra.passive;
  P.afterTake = function (m, u, owner, info, dealt) { if (u.ws.manaShieldT > m.time && info.type === 'magic' && dealt > 0) u.mp = Math.min(u.st.maxMp, u.mp + dealt * 0.3); };
  // AI: thả cột nước từ xa theo tầm của cấp chiêu
  G.HEROES.lyra.skills.s4.ai.range = 10;
  G.HEROES.lyra.skills.s4.ai.rangeFn = (m, u) => (H.T(u, '12a') ? 40 : [10, 20, 30][Math.max(0, u.ranks.s4 - 1)]);
  G.HEROES.lyra.tree = [
    [
      { name: 'Chuột Bụi Thủy Tộc', desc: 'Trong bụi: +1 tầm đánh, đòn đánh làm chậm 30% (thay vì 15%).' },
      { name: 'Bong Bóng Bật Nảy', desc: 'Bong Bóng trúng đích nảy sang 1 mục tiêu khác trong 4 đv (60% sát thương, làm chậm).' },
      { name: 'Bọt Tốc Hành', desc: 'Đánh trúng tướng: +5% tốc chạy 2s (cộng dồn 3 lần).' },
    ],
    [
      { name: 'Bọt Khí Chắn Lối', desc: 'Giáp bong bóng của Sóng Dâng vỡ: để lại 3 bong bóng bẫy 6s, trói chân 0.75s.' },
      { name: 'Mạch Nước Ngầm', desc: 'Dòng Chảy hồi 35% máu đã mất nếu người nhận dưới 30% máu.' },
      { name: 'Triều Cường Cắt Góc', desc: 'Sóng Dâng rộng 2.8 đv, hất tung nhẹ 0.3s kẻ đầu tiên trúng.' },
    ],
    [
      { name: 'Ẩn Ngư Dưới Cát', desc: 'Rời giao tranh 4s: ngụy trang; đòn đánh đầu tiên sau khi lộ diện choáng 1s.' },
      { name: 'Sóng Thần Xuyên Phá', desc: 'Sóng Dâng đẩy kẻ địch vào tường: choáng 1s và phá 200 Hộ Giáp.' },
      { name: 'Thủy Giáp Phản Hồi', desc: 'Khiên Dòng Chảy chuyển 30% sát thương phép nhận vào thành mana.' },
    ],
    [
      { name: 'Thủy Thuẫn Niệm Chú', desc: 'Lúc niệm Đại Hồng Thủy: giáp ảo 30% máu tối đa, miễn khống chế; giáp chưa vỡ thì hoàn 50% mana chiêu cuối.' },
      { name: 'Quần Thể Thủy Trụ', desc: 'Đại Hồng Thủy kèm 4 cột nước phụ quanh Lyra (bán kính 2): hất văng kẻ áp sát 3 đv, 50% sát thương chiêu cuối.' },
      { name: 'Vực Xoáy Tử Địa', desc: 'Vực xoáy cấm lướt và dây móc.' },
    ],
    [
      { name: 'Đại Dương Bao La', desc: 'Phong cách: Đại Hồng Thủy không giới hạn tầm, bán kính luôn 8 đv.' },
      { name: 'Vua Bụi Rậm Biển Sâu', desc: 'Phong cách: bo 5–6, đứng trong bụi hồi chiêu nhanh hơn 40%, đòn đánh bắn 2 tia nước.' },
      { name: 'Nước Mắt Nữ Thần', desc: 'Phong cách: đòn chí tử → bọc bong bóng bất tử 2.5s, hồi 40% máu rồi nổ hất văng kẻ địch 4 đv (180s).' },
    ],
  ];
})();
