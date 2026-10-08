'use strict';
// ===== Valerius — Kiếm & Khiên • Đường trên / Hỗ trợ • đỡ đòn khống chế • mana • vật lý =====
(function () {
  const G = globalThis.G, H = G.H;
  H.def({
    id: 'valerius', name: 'Valerius', color: '#5aa9ff', gfx: 'swordshield', kit: 'tank', pos: ['top', 'sup'], dmgType: 'phys',
    ranged: false, r: 0.72, resource: 'mana',
    stats: { range: 1.7 },
    passive: {
      name: 'Công Thủ',
      desc: 'Giảm 6% sát thương nhận. Mỗi lần trúng đòn của tướng tích 1 Phản Kích (tối đa 3): đòn đánh kế tiếp +12 (+2/cấp) sát thương mỗi tầng.',
      init(m, u) { u.ws.counter = 0; u.ws.cntT = 0; },
      onTake(m, u, att, info) {
        const tb = H.T(u, '12b');
        if (!tb) info.amt *= 0.94;
        // đang giơ Khiên Chắn: giảm 60% sát thương (Đấu Sĩ Trảm Sát: không còn khiên)
        if (u.cast && u.cast.key === 's3' && !tb) {
          const raw = info.amt; info.amt *= 0.4;
          u.ws.blocked = (u.ws.blocked || 0) + raw * 0.6;
          if (H.T(u, '1b') && !u.ws.pxbn) { u.ws.pxbn = true; u.cd.s1 = Math.max(0, (u.cd.s1 || 0) - 1); u.cd.s2 = Math.max(0, (u.cd.s2 || 0) - 1); }
          if (H.T(u, '3a') && att && att.kind === 'hero' && att.alive) m.damage(u, att, raw * 0.4, 'magic', { tag: 'item', noHook: true });
        }
        if (att && att.kind === 'hero' && m.time >= u.ws.cntT) { u.ws.counter = Math.min(3, u.ws.counter + 1); u.ws.cntT = m.time + 0.4; }
      },
      onAuto(m, u, t, info) {
        if (u.ws.counter) { info.amt += (12 + 2 * u.level) * u.ws.counter; u.ws.counter = 0; }
      },
    },
    skills: {
      s1: {
        name: 'Chém Vòng Cung', desc: 'Chém hình quạt 130° trước mặt, làm chậm 20% trong 1s.',
        cd: [7, 6.5, 6, 5.5, 5], cost: [40, 40, 40, 40, 40], castTime: 0.15,
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0.7);
          if (H.T(u, '6a')) {   // Khiên Húc Phá Trận: lướt húc 4 đv, gom và đẩy lùi
            m.dashTo(u, u.x + v.x * 4, u.y + v.y * 4, 16, { onContact: (mm, uu, e) => { mm.damage(u, e, dmg, 'phys', { tag: 's1' }); mm.knock(u, e, v.x, v.y, 1.6, 0.25); mm.addStatus(e, 'slow', 1, 0.2, { src: u }); } });
            u.cd.s1 += 2; return;
          }
          m.hitCone(u, u.x, u.y, v.x, v.y, 3.0, 0.42, (e) => { m.damage(u, e, dmg, 'phys', { tag: 's1' }); m.addStatus(e, 'slow', 1, 0.2, { src: u }); }, { color: '#9ec9ff' });
          m.sfx && m.sfx('slash_light');
        },
        ai: { use: 'burst', range: 2.8, aim: 'unit', farm: 3 },
      },
      s2: {
        name: 'Đâm Thẳng', desc: 'Đâm thẳng 5 đv; cộng 8% máu đã mất của mục tiêu.',
        cd: [9, 8.5, 8, 7.5, 7], cost: [50, 50, 50, 50, 50], castTime: 0.2,
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt), base = H.amt(u, ctx.v([70, 110, 150, 190, 230]), 0.8);
          m.hitLine(u, u.x, u.y, v.x, v.y, 5, 1.2, (e) => m.damage(u, e, base + (e.kind === 'hero' ? (e.st.maxHp - e.hp) * 0.08 : 0), 'phys', { tag: 's2' }), { color: '#cfe4ff' });
        },
        ai: { use: 'poke', range: 4.6, aim: 'point', speed: 0, farm: 3 },
      },
      s3: {
        name: 'Khiên Chắn', desc: 'Giơ khiên 1s giảm 60% sát thương nhận; kết thúc bằng cú húc: choáng 0.75s + câm lặng 1s.',
        cd: [14, 13, 12, 11, 10], cost: [60, 60, 60, 60, 60], castTime: 1.0, castMove: 0.35, castUnstop: true,
        use(m, u, ctx) {
          const t = H.nearestEnemyHero(m, u, 3.5);
          const pt = t || ctx.pt;
          const v = H.dirTo(u, pt);
          const blocked = u.ws.blocked || 0; u.ws.blocked = 0; u.ws.pxbn = false;
          const big = H.T(u, '3b');
          const hit = (e) => {
            m.damage(u, e, H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0.5) + (H.T(u, '6b') && e.kind === 'hero' ? blocked * 0.3 : 0), 'phys', { tag: 's3' });
            m.addStatus(e, 'stun', 0.75, 1, { src: u }); m.addStatus(e, 'silence', 1.0, 1, { src: u });
            if (H.T(u, '9c')) m.knock(u, e, v.x, v.y, 1.5, 0.2, { onWall: (mm, ee) => { mm.addStatus(ee, 'silence', 1.5, 1, { src: u }); mm.damage(u, ee, 60 + 8 * u.level, 'phys', { tag: 's3' }); } });
          };
          if (H.T(u, '12b')) { m.dashTo(u, u.x + v.x * 4, u.y + v.y * 4, 18, { onContact: (mm, uu, e) => hit(e) }); return; }
          m.hitLine(u, u.x, u.y, v.x, v.y, big ? 4.2 : 2.8, big ? 4.4 : 2.2, hit, { color: '#9ec9ff' });
        },
        ai: { use: 'cc', range: 2.4, aim: 'unit' },
      },
      sub: {
        name: 'Cuồng Phong', desc: '+45% tốc chạy trong 1.5s và chém một vòng quanh người (bán kính 2.4): 40 (+8/cấp, +40% SMVL) sát thương, làm chậm 30% trong 1.5s.',
        cd: 10, cost: 30,
        use(m, u, ctx) {
          m.addStatus(u, 'haste', 1.5, 0.45, { key: 'val_cp' });
          const dmg = H.amt(u, 40 + 8 * u.level, 0.4);
          m.hitCircle(u, u.x, u.y, 2.4, (e) => { m.damage(u, e, dmg, 'phys', { tag: 'sub', aoe: true }); m.addStatus(e, 'slow', 1.5, 0.3, { src: u }); }, { color: '#9ec9ff', fx: 'whirl' });
          // Địa Chấn Khiên Binh: nện khiên tạo vết nứt phía trước, hất tung
          if (H.T(u, '12a')) {
            const t = H.nearestEnemyHero(m, u, 6), v = t ? H.dirTo(u, t) : { x: u.fx, y: u.fy };
            m.hitLine(u, u.x, u.y, v.x, v.y, 4.5, 1.6, (e) => { m.damage(u, e, 40 + 10 * u.level, 'phys', { tag: 'sub', aoe: true }); m.knockup(u, e, 0.75); }, { color: '#c8a070', fx: 'quake' });
          }
        },
        ai: { use: 'burst', range: 2.3, aim: 'self', alsoEscape: true, farm: 3 },
      },
      s4: {
        name: 'Chiến Thần Bất Tử', desc: '4s máu không xuống dưới 1, +30% tốc chạy, +20% sát thương.',
        cd: [110, 95, 80], cost: [100, 100, 100],
        use(m, u) {
          m.addStatus(u, 'undying', 4, 1); m.addStatus(u, 'haste', 4, 0.3);
          m.addStatus(u, 'buff', 4, 1, { key: 'val_ult', mods: { dmgAmp: 0.2 } });
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffd700', life: 4 });
        },
        // chỉ phản ứng khi giao tranh thật sự sắp chết (sau giây ra chiêu có ý nghĩa)
        ai: { use: 'ult', aim: 'self', range: 4, cond: (m, u, t) => u.hpPct < 0.4 && t && t.kind === 'hero' },
      },
    },
    ai: { order: ['s1', 's3', 's2'], engageRange: 3.2, role: 'tank', bait: true, guard: (m, u) => (u.cast && u.cast.key === 's3' ? { t: u.cast.t, punish: true } : null) },
    tags: ['cc', 'tank'],
  });
  // ---- cây tiến hóa ----
  G.HEROES.valerius.tree = [
    [
      { name: 'Trụ Vững', desc: '+10% kháng hiệu ứng và +8 giáp.', stats: { tenacity: 0.1, armor: 8 } },
      { name: 'Phản Xạ Binh Nghiệp', desc: 'Khiên Chắn (S3) đỡ được đòn: giảm 1s hồi chiêu S1 và S2 (1 lần mỗi lần giơ khiên).' },
      { name: 'Xung Kích', desc: '+20% tốc chạy khi tiến về phía tướng địch trong 8 đv.', tick(m, u) { if (H.chasing(m, u, 8)) m.addStatus(u, 'haste', 0.6, 0.2, { key: 'val_xk' }); } },
    ],
    [
      { name: 'Khiên Gai', desc: 'Đang giơ Khiên Chắn: phản lại 40% sát thương nhận vào cho tướng tấn công (sát thương phép).' },
      { name: 'Chấn Địa', desc: 'Cú húc kết thúc Khiên Chắn rộng gấp đôi và dài hơn 50%.' },
      { name: 'Giáp Bất Diệt', desc: 'Khi đứng yên hoặc đang ra đòn tại chỗ: giảm thêm 15% sát thương nhận vào.', onTake(m, u, att, info) { if (!H.moving(u)) info.amt *= 0.85; } },
    ],
    [
      { name: 'Khiên Húc Phá Trận', desc: 'S1 đổi thành lướt húc khiên 4 đv về trước, gom mọi kẻ địch trên đường và đẩy lùi 1.6 đv (hồi chiêu +2s).' },
      { name: 'Khiên Phản Kích', desc: 'Cú húc của Khiên Chắn cộng thêm 30% tổng sát thương đã chặn trong lúc giơ khiên.' },
      { name: 'Hộ Vệ Bất Bại', desc: 'Đứng yên quá 1s: vòng bảo hộ giảm 15% sát thương cho bản thân và đồng minh trong 3 đv.',
        tick(m, u) {
          if (H.moving(u)) { u.ws.stillT = m.time; return; }
          if (m.time - (u.ws.stillT || 0) < 1) return;
          for (const a of H.alliesNear(m, u, 3, true)) m.addStatus(a, 'reduce', 0.6, 0.15, { key: 'val_hv' });
        } },
    ],
    [
      { name: 'Bất Khuất', desc: 'Máu xuống dưới 25%: tự nhận lá chắn 150 (+20/cấp) trong 2.5s và miễn khống chế 1s (hồi 45s).',
        afterTake(m, u) { if (u.hpPct < 0.25 && H.ready(m, u, 'bk', 45)) { m.shield(u, u, 150 + 20 * u.level, 2.5); m.addStatus(u, 'unstop', 1, 1); } } },
      { name: 'Chiến Ý Hoàng Gia', desc: 'Trong Chiến Thần Bất Tử (S4): đòn đánh thường gây choáng 0.5s (mỗi mục tiêu 1 lần mỗi 1.5s).',
        onAuto(m, u, t, info) { if (t.kind === 'hero' && u.hasKey('val_ult') && H.ready(m, u, 'cy' + t.id, 1.5)) info.extra.push(() => m.addStatus(t, 'stun', 0.5, 1, { src: u })); } },
      { name: 'Áp Chế Tuyệt Đối', desc: 'Cú húc Khiên Chắn đẩy lùi 1.5 đv; đập vào tường: câm lặng thêm 1.5s và 60 (+8/cấp) sát thương.' },
    ],
    [
      { name: 'Địa Chấn Khiên Binh', desc: 'Cuồng Phong (skill phụ) nện khiên tạo vết nứt 4.5 đv về phía tướng địch gần nhất, hất tung 0.75s.' },
      { name: 'Đấu Sĩ Trảm Sát', desc: 'Vứt khiên, kiếm hai tay: +25% tốc đánh, +15% sát thương. Mất giảm sát thương của nội tại và của Khiên Chắn; Khiên Chắn thành lướt chém 4 đv (vẫn choáng + câm lặng).',
        stats: { asPct: 0.25 }, onDeal(m, u, t, info) { info.amt *= 1.15; } },
      { name: 'Ý Chí Bất Diệt', desc: 'Đòn chí tử: sống lại với 1 máu, miễn sát thương 1s (hồi 90s).',
        onFatal(m, u) { if (!H.ready(m, u, 'ycbd', 90)) return false; u.hp = 1; m.addStatus(u, 'invuln', 1, 1); if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffd700', life: 1 }); return true; } },
    ],
  ];
})();
