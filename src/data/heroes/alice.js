'use strict';
// ===== Alice — Ảo Thuật • Đường giữa / Đi rừng • ảo thuật, đánh lừa • mana • phép =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const cap = (u) => (H.T(u, '9b') ? 150 : 100);
  function hype(u, v) { u.ws.nn = Math.min(cap(u), u.ws.nn + v * (H.T(u, '9b') ? 1.3 : 1)); }
  function spend(u, v) { if (u.ws.nn < v) return false; u.ws.nn -= v; return true; }
  // ảo ảnh: bị phá thì "Bị Lừa Rồi Nha!" phát nổ
  function illusion(m, u, x, y, o) {
    o = o || {};
    const keep = H.T(u, '12a') ? 3 : 1;
    const mine = m.decoysOf(u).filter((d) => !d.box);
    while (mine.length >= keep + (o.extra ? 1 : 0)) { const d = mine.shift(); d.alive = false; }
    return m.makeDecoy(u, x, y, { life: o.life || 8, hp: 0.35 * (H.T(u, '1c') ? 1.5 : 1), runTo: o.runTo || null, dmg: H.T(u, '9c') ? 0.4 : 0,
      onDeath: (mm, d, k) => {
        const boom = (40 + 8 * u.level + 0.3 * u.st.ap) * (H.T(u, '3a') ? 1.4 : 1);
        let hit = 0;
        mm.hitCircle(u, d.x, d.y, 2.2, (e) => { mm.damage(u, e, boom, 'magic', { tag: 'p', aoe: true }); if (H.T(u, '3a')) mm.addStatus(e, 'stun', 0.5, 1, { src: u }); if (e.kind === 'hero') hit++; }, { color: '#e0a0ff' });
        if (H.T(u, '6c') && k && k.kind === 'hero' && !k.ranged && M.dist(k, d) < 3) mm.damage(u, k, H.amt(u, 50 + 8 * u.level, 0, 0.3), 'magic', { tag: 'p' });
        if (H.T(u, '12c') && hit) u.cd.s4 = Math.max(0, (u.cd.s4 || 0) - 10);
        hype(u, H.T(u, '1a') ? 35 : 25);
      } });
  }
  // Mạo Hiểm: phi dao đánh dấu rồi tự nhốt vào Hộp Ảo Thuật 1.5s. Bị đánh: đổi chỗ với kẻ đánh, trả lại ×2 sát thương và đẩy văng.
  // Không ai đánh: xuất hiện sau lưng kẻ bị đánh dấu, đâm một nhát choáng 1s.
  function boxStun(m, u, c) { if (H.T(u, '12b')) for (const e of m.enemiesIn(u.team, c.x, c.y, 5, { heroesOnly: true })) m.addStatus(e, 'stun', 1, 1, { src: u }); }
  function magicBox(m, u, t, dmg) {
    m.damage(u, t, dmg * 0.4, 'magic', { tag: 's4' });
    m.addStatus(t, 'mark', 2, 1, { key: 'alice_mark', src: u });
    if (m.fxOn) m.fx({ type: 'line', x: u.x, y: u.y, x2: t.x, y2: t.y, w: 0.3, color: '#ff9ad5', fx: 'thrust', team: u.team });
    u.ws.boxOn = true; u.ws.boxDmg = dmg; u.ws.boxMark = t;
    m.addStatus(u, 'root', 1.5, 1, { key: 'alice_box' });
    m.later(1.5, (mm) => {
      if (!u.alive || !u.ws.boxOn) return;
      u.ws.boxOn = false; mm.removeStatus(u, 'root', 'alice_box');
      if (!t.alive || M.dist(u, t) > 12) return;
      const R = t.r + u.r + 0.4;
      mm.blink(u, t.x - t.fx * R, t.y - t.fy * R); u.face(t.x, t.y);
      mm.damage(u, t, dmg * 0.8, 'magic', { tag: 's4' }); mm.addStatus(t, 'stun', 1, 1, { src: u });
      boxStun(mm, u, t);
    });
  }
  H.def({
    id: 'alice', name: 'Alice', color: '#d070ff', gfx: 'gloves', kit: 'mage', pos: ['mid', 'jungle'], dmgType: 'magic',
    ranged: true, projSpeed: 18, projKind: 'star', r: 0.58, resource: 'mana',
    stats: { range: 5.0, hp: 590, armor: 26, ms: 3.5 },
    passive: {
      name: 'Náo Nhiệt',
      desc: 'Náo Nhiệt (0–100) tích khi đánh trúng tướng (+8) và khi ảo ảnh bị phá (+25); Phi Dao và Lướt Đâm tự tiêu 20 để cường hóa. Bị Lừa Rồi Nha!: ảo ảnh bị phá thì phát nổ. Thoát Hiểm Ảo Ảnh (180s): đòn chí tử bị thay bằng tàng hình 1.5s với 1 máu.',
      init(m, u) { u.ws.nn = 0; u.ws.boxOn = false; },
      // đang trong Hộp Ảo Thuật: bị đánh thì đổi chỗ và trả đòn ×2
      onTake(m, u, att, info) {
        if (!u.ws.boxOn || !att || att.team === u.team || (att.kind !== 'hero' && att.kind !== 'pet')) return;
        const a = info.amt; info.amt = 0;
        u.ws.boxOn = false; m.removeStatus(u, 'root', 'alice_box');
        const x = u.x, y = u.y; m.blink(u, att.x, att.y); att.x = x; att.y = y; att.navP = null; att.dash = null;
        const back = Math.min(u.ws.boxDmg * 2, Math.max(u.ws.boxDmg * 0.6, a * 2));
        m.later(0.05, (mm) => {
          if (!att.alive) return;
          mm.damage(u, att, back, 'magic', { tag: 's4' });
          const v = H.dirTo(u, att); mm.knock(u, att, v.x, v.y, 2.5, 0.25); mm.addStatus(att, 'stun', 1, 1, { src: u });
          boxStun(mm, u, att);
          if (mm.fxOn) mm.fx({ type: 'boom', x: att.x, y: att.y, color: '#d070ff' });
        });
      },
      afterDeal(m, u, t, info) { if (t.kind === 'hero' && (info.auto || G.ITEM_IS_SKILL(info)) && H.ready(m, u, 'nn', 0.5)) hype(u, 8); },
      onFatal(m, u) {
        if (!H.ready(m, u, 'thoat', H.T(u, '9a') ? 120 : 180)) return false;
        u.hp = 1; m.addStatus(u, 'stealth', H.T(u, '9a') ? 3 : 1.5, 1, { key: 'alice_escape' });
        if (H.T(u, '9a')) m.addStatus(u, 'invuln', 1, 1);
        const e = H.nearestEnemyHero(m, u, 8); if (e) { const v = H.dirTo(e, u); m.dashTo(u, u.x + v.x * 3, u.y + v.y * 3, 18, {}); }
        illusion(m, u, u.x, u.y, { life: 3, extra: true });
        return true;
      },
    },
    skills: {
      s1: {
        name: 'Phi Dao Ảo Thuật', desc: 'Phi dao 7 đv. Tốn 20 Náo Nhiệt: 8 dao tỏa 360°, mỗi dao 60% sát thương.',
        cd: [5, 4.75, 4.5, 4.25, 4], cost: [45, 50, 55, 60, 65], castTime: 0.12,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([70, 110, 150, 190, 230]), 0, 0.65), fast = H.T(u, '1b') ? 1.25 : 1;
          if (spend(u, 20)) {
            for (let i = 0; i < 8; i++) { const a = i * 0.7853982; m.proj({ owner: u, x: u.x, y: u.y, dx: M.cos(a), dy: M.sin(a), speed: 18 * fast, range: 5.5 * fast, r: 0.4, kind: 'star', onHit: (mm, p, e) => mm.damage(u, e, dmg * 0.6, 'magic', { tag: 's1', aoe: true }) }); }
            return;
          }
          const pr = H.shoot(m, u, ctx.pt, { speed: 20 * fast, range: 7 * fast, r: 0.4, kind: 'star', onHit: (mm, p, e) => {
            mm.damage(u, e, dmg, 'magic', { tag: 's1' });
            // Phi Dao Hoán Vị: dịch chuyển tới chỗ dao
            if (H.T(u, '6a')) { const q = { x: p.x, y: p.y }; mm.allowRecast(u, 's1', 1, (m3, u3) => m3.blink(u3, q.x, q.y)); }
          } });
          return pr;
        },
        ai: { use: 'poke', range: 6.8, aim: 'point', speed: 20, farm: 3, recastWhen: (m, u, t) => !!(t && t.kind === 'hero' && t.hpPct < 0.3 && u.hpPct > 0.5) },
      },
      s2: {
        name: 'Lướt Đâm', desc: 'Lướt 4 đv đâm kẻ địch trên đường. Tốn 20 Náo Nhiệt: tàng hình 1.5s và để lại ảo ảnh ở chỗ cũ.',
        cd: [9, 8.5, 8, 7.5, 7], cost: [50, 50, 50, 50, 50],
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([80, 120, 160, 200, 240]), 0, 0.55);
          if (H.T(u, '6b')) {   // Chim Bồ Câu Quấy Nhiễu
            const v = H.dirTo(u, ctx.pt);
            m.hitCone(u, u.x, u.y, v.x, v.y, 4, 0.5, (e) => { m.damage(u, e, dmg * 0.8, 'magic', { tag: 's2', aoe: true }); m.knockup(u, e, 0.4); m.addStatus(e, 'silence', 1.25, 1, { src: u }); }, { color: '#ffffff' });
            return;
          }
          const from = { x: u.x, y: u.y }, p = H.toward(u, ctx.pt, 4, false);
          m.dashTo(u, p.x, p.y, 20, { onContact: (mm, uu, e) => mm.damage(u, e, dmg, 'magic', { tag: 's2' }) });
          if (spend(u, 20)) { m.addStatus(u, 'stealth', H.T(u, '3c') ? 2.5 : 1.5, 1, { key: 'alice_s2' }); illusion(m, u, from.x, from.y, { life: 6 }); }
        },
        ai: { use: 'escape', range: 4, aim: 'away', alsoEngage: true },
      },
      s3: {
        name: 'Ảo Ảnh Độc Lập', desc: 'Tạo ảo ảnh 10s tự chạy lại gần địch; Alice tàng hình 1.5s và lướt đi. Đủ 50 Náo Nhiệt: tốn 50, hoán đổi vị trí với tướng địch gần nhất trong 6 đv, 5 ảo ảnh đứng vây quanh nạn nhân 5s, Alice tàng hình 2s.',
        cd: [16, 15, 14, 13, 12],
        cost: [60, 60, 60, 60, 60],
        use(m, u, ctx) {
          if (H.T(u, '12a')) u.cd.s3 *= 0.5;
          const t = H.nearestEnemyHero(m, u, 6);
          if (t && u.ws.nn >= 50) {
            spend(u, 50);
            const x = u.x, y = u.y; m.blink(u, t.x, t.y); t.x = x; t.y = y; t.navP = null; t.dash = null;
            m.addStatus(t, 'root', 0.6, 1, { src: u });
            for (let i = 0; i < 5; i++) { const a = i * 1.2566; const d = illusion(m, u, t.x + M.cos(a) * 2, t.y + M.sin(a) * 2, { life: 5, extra: true }); d.box = true; }
            m.addStatus(u, 'stealth', 2, 1, { key: 'alice_s3' });
            if (H.T(u, '3b')) m.zone({ owner: u, x: t.x, y: t.y, r: 3, life: 2, every: 0.5, kind: 'smoke', tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => mm.addStatus(e, 'slow', 0.6, 0.4, { src: u, key: 'alice_smoke' }), { noFx: true }) });
            return;
          }
          const e = H.nearestEnemyHero(m, u, 12);
          illusion(m, u, u.x, u.y, { life: 10, runTo: e ? { x: e.x, y: e.y } : H.toward(u, ctx.pt, 8, false) });
          // Alice tàng hình 1.5s và lướt đi (ảo ảnh ở lại thu hút đòn)
          m.addStatus(u, 'stealth', 1.5, 1, { key: 'alice_s3' });
          const v = e ? H.dirTo(e, u) : { x: -u.fx, y: -u.fy }, side = (u.id & 1) ? 1 : -1;
          const q = { x: u.x + (v.x * 0.6 - v.y * 0.8 * side) * 3, y: u.y + (v.y * 0.6 + v.x * 0.8 * side) * 3 }; G.MAP.pushOut(q, u.r);
          m.dashTo(u, q.x, q.y, 16, {});
        },
        ai: { use: 'burst', range: 6, aim: 'self', alsoEscape: true },
      },
      sub: {
        name: 'Tẩu Thoát, Ohh!', desc: 'Đổi chỗ với ảo ảnh xa kẻ địch nhất.',
        cd: 12,
        can(m, u) { return m.decoysOf(u).length > 0; },
        use(m, u) {
          const ds = m.decoysOf(u); if (!ds.length) return;
          const score = (d) => { const e = H.nearestEnemyHero(m, d, 15); return e ? M.dist(e, d) : 15; };
          const d = ds.sort((a, b) => score(b) - score(a) || a.id - b.id)[0];
          const x = u.x, y = u.y; m.blink(u, d.x, d.y); d.x = x; d.y = y;
          if (H.T(u, '12a')) u.cd.sub = 3;
        },
        ai: { use: 'defend', aim: 'self', range: 6, alsoEscape: true },
      },
      s4: {
        name: 'Rực Rỡ, Cùng Vui Nào!', desc: 'Tự chọn 1 trong 3 biến thể theo tình huống: Chương Trình Thoát Hiểm (máu thấp: 5 ảo ảnh chạy toán loạn, Alice tàng hình 3s, +50% tốc chạy) • Mạo Hiểm (bị cận chiến áp sát hoặc có mồi: phi dao đánh dấu rồi tự nhốt vào Hộp Ảo Thuật 1.5s — bị đánh thì đổi chỗ với kẻ đánh, trả lại ×2 sát thương, đẩy văng và choáng; không bị đánh thì xuất hiện sau lưng kẻ bị đánh dấu, choáng 1s) • Vạn Biến (chiêu đang hồi: Náo Nhiệt tràn tới 150, làm mới mọi hồi chiêu).',
        cd: [110, 90, 70], cost: [100, 100, 100], castTime: 0.1,
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.kind === 'hero' && ctx.tgt.alive && M.dist(u, ctx.tgt) < 6.5 ? ctx.tgt : null;
          const near = m.enemiesIn(u.team, u.x, u.y, 6, { heroesOnly: true });
          const melee = near.find((e) => !e.ranged && M.dist(e, u) < 3.2);
          // Chương Trình Thoát Hiểm: 5 ảo ảnh chạy toán loạn, Alice tàng hình 3s về chỗ an toàn
          if (u.hpPct < 0.4 && near.length && !(melee && melee.hpPct < 0.25)) {
            m.addStatus(u, 'stealth', 3, 1, { key: 'alice_ult' }); m.addStatus(u, 'haste', 3, 0.5, { key: 'alice_ult' });
            for (let i = 0; i < 5; i++) { const a = i * 1.2566 + m.rng.next() * 0.6; illusion(m, u, u.x, u.y, { life: 3, extra: true, runTo: { x: u.x + M.cos(a) * 9, y: u.y + M.sin(a) * 9 } }); }
            return;
          }
          // Mạo Hiểm: bị cận chiến áp sát (hoặc có mồi ngon) → Hộp Ảo Thuật
          const victim = melee || t;
          const down = ['s1', 's2', 's3'].filter((k) => (u.cd[k] || 0) > 2).length;
          if (victim && (melee || !(down >= 2 && victim.hpPct > 0.5))) { magicBox(m, u, victim, H.amt(u, ctx.v([150, 250, 350]), 0, 0.7)); return; }
          // Vạn Biến: Náo Nhiệt tràn tới 150, làm mới mọi hồi chiêu
          u.cd.s1 = 0; u.cd.s2 = 0; u.cd.s3 = 0; u.cd.sub = 0; u.ws.nn = Math.max(u.ws.nn, 150);
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffd24a', life: 1 });
        },
        ai: { use: 'ult', aim: 'unit', range: 6, cond: (m, u, t) => u.hpPct < 0.4 || !!(t && t.kind === 'hero' && t.hpPct < 0.65) },
      },
    },
    ai: { order: ['s1', 's3', 's2'], engageRange: 6, role: 'mage', guard: (m, u) => (u.ws.boxOn ? { t: 1, punish: true } : null) },
    tags: ['stealth'],
  });
  G.HEROES.alice.tree = [
    [
      { name: 'Khán Giả Cuồng Nhiệt', desc: 'Ảo ảnh bị phá cho 35 Náo Nhiệt (thay vì 25).' },
      { name: 'Phi Dao Sắc Lẹm', desc: 'Phi Dao bay xa và nhanh hơn 25%.' },
      { name: 'Ảo Ảnh Bền Bỉ', desc: 'Ảo ảnh có thêm 50% máu.' },
    ],
    [
      { name: 'Bẫy Hoa Lửa', desc: 'Bị Lừa Rồi Nha! nổ mạnh hơn 40% và choáng 0.5s.' },
      { name: 'Khói Ảo Thuật', desc: 'Biến thể hoán đổi của S3 thả khói làm chậm 40% trong 2s.' },
      { name: 'Vô Ảnh Thần Bộ', desc: 'Tàng hình của Lướt Đâm cường hóa kéo dài 2.5s.' },
    ],
    [
      { name: 'Phi Dao Hoán Vị', desc: 'Phi Dao trúng đích: trong 1s dùng lại để dịch chuyển tới chỗ dao.' },
      { name: 'Chim Bồ Câu Quấy Nhiễu', desc: 'Lướt Đâm thay bằng thả đàn bồ câu hình nón: hất tung nhẹ và câm lặng 1.25s.' },
      { name: 'Ảo Ảnh Phản Kích', desc: 'Ảo ảnh bị tướng cận chiến phá: đâm trả một nhát trước khi nổ.' },
    ],
    [
      { name: 'Đại Ảo Thuật Gia', desc: 'Thoát Hiểm Ảo Ảnh: tàng hình 3s + miễn sát thương 1s, hồi 120s (thay vì 180s).' },
      { name: 'Náo Nhiệt Vô Tận', desc: 'Náo Nhiệt tối đa 150 và tích nhanh hơn 30%.' },
      { name: 'Ảo Ảnh Chân Thực', desc: 'Ảo ảnh gây 40% sát thương thật.' },
    ],
    [
      { name: 'Bậc Thầy Phân Thân', desc: 'S3 giữ tối đa 3 ảo ảnh và hồi nhanh gấp đôi; Tẩu Thoát hồi 3s.' },
      { name: 'Chiếc Hộp Biến Mất', desc: 'Hộp Ảo Thuật kết thúc (đổi chỗ hoặc xuất hiện sau lưng): choáng 1s mọi tướng địch trong 5 đv quanh nạn nhân.' },
      { name: 'Nụ Cười Gã Hề', desc: 'Mỗi ảo ảnh nổ trúng tướng: giảm 10s hồi chiêu S4.' },
    ],
  ];
})();
