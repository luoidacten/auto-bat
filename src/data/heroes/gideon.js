'use strict';
// ===== Gideon — Kiếm Dài • Đường trên / Đi rừng • đỡ đòn tầm với, mở giao tranh • mana • vật lý =====
(function () {
  const G = globalThis.G, H = G.H;
  // "Điểm Ngọt": trúng bằng mũi kiếm (phần ngoài cùng của tầm) mạnh hơn, trúng bằng cán yếu hơn
  function sweet(u, e, reach) {
    const d = G.M.dist(u, e) - e.r;
    const hi = (H.T(u, '9c') && e.hpPct < 0.5) ? 1.6 : 1.3;
    if (H.T(u, '12b')) return hi;                                   // Kiếm Đế: cả thân kiếm là điểm ngọt
    if (d >= reach * (H.T(u, '1a') ? 0.6 : 0.7)) return hi;
    if (d <= reach * 0.25) return 0.7;
    return 1;
  }
  // trúng điểm ngọt: làm chậm (Thế Nặng Ngàn Cân: 40% + cấm lướt)
  function sweetSlow(m, u, e) {
    if (H.T(u, '6c')) { m.addStatus(e, 'slow', 1, 0.4, { src: u }); m.addStatus(e, 'nodash', 1.5, 1, { src: u }); }
    else m.addStatus(e, 'slow', 1, 0.2, { src: u });
  }
  // Trảm Khí Khai Thiên: đòn cường hóa sau Thế Thủ phóng sóng kiếm khí
  function wave(m, u, v, dmg) {
    H.shoot(m, u, { x: u.x + v.x, y: u.y + v.y }, { speed: 20, range: 7, r: 0.6, pierce: true, kind: 'slashwave', onHit: (mm, p, e) => mm.damage(u, e, dmg * 0.8, 'phys', { tag: 's1' }) });
  }
  H.def({
    id: 'gideon', name: 'Gideon', color: '#ffd24a', gfx: 'greatsword', kit: 'tank', pos: ['top', 'jungle'], dmgType: 'phys',
    ranged: false, r: 0.75, resource: 'mana', fixedAs: true,
    stats: { range: 2.7, hp: 575, ad: 58, ms: 3.4, armorG: 3.6 },
    passive: {
      name: 'Điểm Ngọt & Đại Trường Kiếm',
      desc: 'Đại Trường Kiếm (GĐ9): đánh thường với tới xa bằng cả lưỡi kiếm (tầm 2.7 thay vì 2.1); tốc đánh CỐ ĐỊNH — mọi % tốc đánh cộng thêm (cấp, đồ, mảnh hồn, bùa) chuyển thành % sát thương đòn đánh. Điểm Ngọt: trúng bằng mũi kiếm (30% ngoài cùng tầm) +30% sát thương và làm chậm 20%; trúng bằng cán (quá gần) −30%. Kháng đẩy: bị đẩy lùi/kéo ngắn hơn 30%.',
      init(m, u) { u.ws.hilt = 0; u.ws.emp = 0; },
      onAuto(m, u, t, info) {
        const k = sweet(u, t, u.st.range + u.r);
        info.amt *= k * (1 + (u.st.asConv || 0));   // tốc đánh cộng thêm → sát thương
        if (k > 1) info.extra.push(() => sweetSlow(m, u, t));
      },
      // Khiên Kiếm Đỡ Gạt: chặn đòn đánh thường đầu tiên của tướng địch mỗi 8s, hất kẻ đánh ra đúng tầm mũi kiếm
      onTake(m, u, att, info) {
        if (!H.T(u, '6b') || !info.auto || !att || att.kind !== 'hero' || m.time < u.ws.hilt) return;
        u.ws.hilt = m.time + 8; info.amt = 0;
        const d = G.M.dist(u, att), want = u.st.range + u.r + att.r - 0.3;
        if (d < want) { const v = H.dirTo(u, att); m.knock(u, att, v.x, v.y, want - d, 0.2); }
        if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffe08a', life: 0.4 });
      },
    },
    skills: {
      s1: {
        name: 'Quét Ngang', desc: 'Gồng 0.3s rồi vung kiếm 180°. Điểm ngọt áp dụng.',
        cd: [7, 6.5, 6, 5.5, 5], cost: [45, 45, 45, 45, 45], castTime: (m, u) => (u.ws.emp > m.time ? 0.05 : H.T(u, '1b') ? 0.15 : 0.3),
        use(m, u, ctx) {
          const emp = u.ws.emp > m.time; u.ws.emp = 0;
          const R = 3.4 * (emp ? 1.25 : 1), v = H.dirTo(u, ctx.pt), base = H.amt(u, ctx.v([55, 90, 125, 160, 195]), 0.75);
          m.hitCone(u, u.x, u.y, v.x, v.y, R, 0, (e) => {
            const k = sweet(u, e, R);
            m.damage(u, e, base * k, 'phys', { tag: 's1' });
            if (k > 1) sweetSlow(m, u, e);
          }, { color: '#ffe08a' });
          if (emp && H.T(u, '9a')) wave(m, u, v, base);
          // Quét Ngược Trừng Phạt: vung ngược kéo kẻ địch về gần
          if (H.T(u, '6a')) m.allowRecast(u, 's1', 2, (mm, uu) => {
            const w = { x: -v.x, y: -v.y };
            mm.hitCone(uu, uu.x, uu.y, v.x, v.y, R, 0, (e) => {
              mm.damage(uu, e, base * 0.6, 'phys', { tag: 's1' });
              const d = G.M.dist(uu, e) - uu.r - e.r - 0.5; if (d > 0.2) mm.knock(uu, e, w.x, w.y, Math.min(1.5, d), 0.2);
            }, { color: '#ffe08a' });
          });
        },
        ai: { use: 'burst', range: 3.1, aim: 'unit', farm: 3 },
      },
      s2: {
        name: 'Bổ Dọc', desc: 'Bổ kiếm theo đường thẳng 5.5 đv. Trúng điểm ngọt: trói chân 0.6s.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [55, 55, 55, 55, 55], castTime: (m, u) => (u.ws.emp > m.time ? 0.05 : 0.35),
        use(m, u, ctx) {
          const emp = u.ws.emp > m.time; u.ws.emp = 0;
          const L = 5.5 * (emp ? 1.25 : 1), v = H.dirTo(u, ctx.pt), base = H.amt(u, ctx.v([70, 110, 150, 190, 230]), 0.85);
          m.hitLine(u, u.x, u.y, v.x, v.y, L, 1.4, (e) => {
            const k = sweet(u, e, L);
            m.damage(u, e, base * k, 'phys', { tag: 's2' });
            if (k > 1) { m.addStatus(e, 'root', H.T(u, '3a') ? 1.1 : 0.6, 1, { src: u }); if (H.T(u, '6c')) m.addStatus(e, 'nodash', 1.5, 1, { src: u }); }
          }, { color: '#ffe08a' });
          if (emp && H.T(u, '9a')) wave(m, u, v, base);
        },
        ai: { use: 'poke', range: 5.0, aim: 'point', speed: 0, farm: 3 },
      },
      s3: {
        name: 'Thế Thủ Tụ Lực', desc: 'Gồng 1.6s: giảm 40% sát thương, không thể cản phá. Sau đó S1/S2 kế tiếp +25% tầm và ra đòn ngay (trong 5s).',
        cd: [16, 15, 14, 13, 12], cost: [50, 50, 50, 50, 50],
        use(m, u) {
          m.addStatus(u, 'reduce', 1.6, H.T(u, '3c') ? 0.6 : 0.4, { key: 'gid_guard' }); m.addStatus(u, 'unstop', 1.6, 1);
          u.ws.emp = m.time + 5;
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#d0a070', life: 1.6 });
          // Cự Kiếm Xung Trận: hết thế thủ thì lao 5 đv ủi kẻ địch, ghim vào tường
          if (H.T(u, '12a')) m.later(1.6, (mm) => {
            if (!u.alive || u.disabled) return;
            const t = H.nearestEnemyHero(mm, u, 6), v = t ? H.dirTo(u, t) : { x: u.fx, y: u.fy };
            mm.dashTo(u, u.x + v.x * 5, u.y + v.y * 5, 18, { unstop: true, onContact: (m3, uu, e) => {
              m3.damage(u, e, H.amt(u, 40 + 10 * u.level, 0.5), 'phys', { tag: 's3' });
              m3.knock(u, e, v.x, v.y, 2.5, 0.25, { onWall: (m4, ee) => m4.addStatus(ee, 'stun', 1.25, 1, { src: u }) });
            } });
          });
        },
        ai: { use: 'defend', aim: 'self', range: 5 },
      },
      sub: {
        name: 'Cán Kiếm', desc: 'Húc cán kiếm vào kẻ địch sát người (tầm 1.9): 30 (+6/cấp, +40% SMVL) sát thương, choáng 0.4s và đẩy nó ra đúng tầm mũi kiếm — mở đường cho Bổ Dọc.',
        cd: 9, cost: 25, castTime: 0.05,
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.alive && G.M.dist(u, ctx.tgt) < 2.8 + ctx.tgt.r ? ctx.tgt : H.nearestEnemyHero(m, u, 2.8);
          const v = H.dirTo(u, t || ctx.pt), far = H.T(u, '3b');
          m.hitCone(u, u.x, u.y, v.x, v.y, 1.9 + u.r, 0.5, (e) => {
            m.damage(u, e, H.amt(u, 30 + 6 * u.level, 0.4), 'phys', { tag: 'sub' });
            m.addStatus(e, 'stun', 0.4, 1, { src: u });
            const d = G.M.dist(u, e), want = (far ? 3.2 : u.st.range - 0.3) + u.r + e.r;
            if (d < want) m.knock(u, e, (e.x - u.x) / (d || 1), (e.y - u.y) / (d || 1), want - d, 0.2);
            if (far) m.addStatus(e, 'silence', 1, 1, { src: u });
          }, { color: '#ffe08a', fx: 'thrust' });
        },
        ai: { use: 'cc', range: 1.4, aim: 'unit', heroOnly: true },
      },
      s4: {
        name: 'Khai Thiên Lập Địa', desc: 'Nhảy tới điểm trong 6 đv, cắm kiếm tạo chấn động bán kính 5: ở tâm (2.5 đv) hất tung 1s, ở rìa làm chậm 40%.',
        cd: [120, 100, 80], cost: [100, 100, 100], castTime: 0.15,
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 6, true);
          m.dashTo(u, p.x, p.y, 16, { unstop: true, onEnd: (mm) => {
            const dmg = H.amt(u, ctx.v([150, 250, 350]), 1.0);
            mm.hitCircle(u, u.x, u.y, 5, (e) => {
              mm.damage(u, e, dmg, 'phys', { tag: 's4', aoe: true });
              if (G.M.dist(u, e) <= 2.5 + e.r) mm.knockup(u, e, 1.0);
              else if (H.T(u, '9b')) mm.addStatus(e, 'stun', 0.75, 1, { src: u });
              else mm.addStatus(e, 'slow', 1.5, 0.4, { src: u });
            }, { color: '#ffd24a' });
            if (mm.fxOn) mm.fx({ type: 'quake', x: u.x, y: u.y, r: 5 });
          } });
        },
        ai: { use: 'ult', aim: 'point', range: 6.5, aoe: 5, minTargets: 2 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 3.5, role: 'tank', bait: true, tip: true, guard: (m, u) => { const s = u.hasKey('gid_guard'); return s ? { t: s.t, punish: false } : null; } },
    tags: ['cc', 'tank'],
  });
  G.HEROES.gideon.tree = [
    [
      { name: 'Mũi Kiếm Chuẩn Xác', desc: 'Điểm Ngọt mở rộng: 40% ngoài cùng tầm kiếm (thay vì 30%).' },
      { name: 'Khúc Trọng Lực', desc: 'Quét Ngang (S1) gồng 0.15s (thay vì 0.3s).' },
      { name: 'Thiết Thân', desc: 'Đứng yên: +15 giáp và kháng phép.', tick(m, u) { if (!H.moving(u)) m.addStatus(u, 'buff', 0.6, 1, { key: 'gid_tt', mods: { armor: 15, mr: 15 } }); } },
    ],
    [
      { name: 'Trói Đinh Ngàn Cân', desc: 'Bổ Dọc (S2) trúng Điểm Ngọt trói chân 1.1s (thay vì 0.6s).' },
      { name: 'Húc Văng Cán Kiếm', desc: 'Cán Kiếm đẩy xa gấp đôi (3.2 đv) và câm lặng 1s.' },
      { name: 'Kiên Cố Tuyệt Đối', desc: 'Thế Thủ (S3) giảm 60% sát thương (thay vì 40%).' },
    ],
    [
      { name: 'Quét Ngược Trừng Phạt', desc: 'Sau Quét Ngang, trong 2s dùng lại: vung ngược kéo kẻ địch trúng về phía Gideon (60% sát thương).' },
      { name: 'Khiên Kiếm Đỡ Gạt', desc: 'Chặn hoàn toàn đòn đánh thường đầu tiên của tướng địch (mỗi 8s), hất kẻ đánh ra đúng tầm mũi kiếm.' },
      { name: 'Thế Nặng Ngàn Cân', desc: 'Trúng Điểm Ngọt: làm chậm 40% (thay vì 20%) và cấm lướt 1.5s.' },
    ],
    [
      { name: 'Trảm Khí Khai Thiên', desc: 'Đòn cường hóa sau Thế Thủ phóng thêm sóng kiếm khí 7 đv xuyên thấu (80% sát thương).' },
      { name: 'Đại Địa Chấn', desc: 'Khai Thiên Lập Địa: kẻ địch ở rìa bị choáng 0.75s (thay vì làm chậm).' },
      { name: 'Chém Gãy Thần Binh', desc: 'Điểm Ngọt lên mục tiêu dưới 50% máu: +60% sát thương (thay vì +30%).' },
    ],
    [
      { name: 'Cự Kiếm Xung Trận', desc: 'Hết Thế Thủ: lao về trước 5 đv ủi mọi kẻ địch, đẩy lùi 2.5 đv; đập tường bị choáng 1.25s.' },
      { name: 'Kiếm Đế Cuồng Nộ', desc: '+12% tốc chạy, +20% tốc đánh; toàn bộ thân kiếm đều tính là Điểm Ngọt.', stats: { msPct: 0.12, asPct: 0.2 } },
      { name: 'Trấn Áp Vực Thẳm', desc: 'Đòn trúng kẻ địch đứng sát tường (1.5 đv): +40% sát thương và choáng 0.5s (mỗi mục tiêu 4s).',
        onDeal(m, u, t, info) {
          if (t.kind !== 'hero' || info.tag === 'dot' || !G.MAP.nearWall(t, 1.5)) return;
          info.amt *= 1.4;
          if (H.ready(m, u, 'tavt' + t.id, 4)) m.later(0, (mm) => mm.addStatus(t, 'stun', 0.5, 1, { src: u }));
        } },
    ],
  ];
})();
