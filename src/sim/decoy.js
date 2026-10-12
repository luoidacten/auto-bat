'use strict';
// ===== ẢO ẢNH / PHÂN THÂN (Alice, Vesper, Chrono & Neo…) =====
// Ảo ảnh là vật triệu hồi trông y hệt tướng gốc. AI đối phương có thể bị lừa: mỗi tuyển thủ tự "đoán" một lần cho mỗi ảo ảnh,
// tỉ lệ bị lừa giảm theo chỉ số Đọc Bản Đồ (map). Ảo ảnh không gây sát thương (trừ khi o.dmg).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const M = G.M;
  function decoyThink(m, d) {
    if (m.time >= d.lifeT) { d.alive = false; d.hp = 0; if (d.onExpire) m.hook(d.onExpire, m, d); return; }
    if (d.thinkT > m.time) return;
    d.thinkT = m.time + 0.25;
    let best = null, bd = 10;
    for (const h of m.heroes) if (h.alive && h.team !== d.team && h.vis[d.team]) { const x = M.dist(h, d); if (x < bd) { bd = x; best = h; } }
    // GĐ12: đang bước theo đường định sẵn — tới nơi, hoặc có tướng địch trong tầm đánh (+1.5) thì bỏ đường, quay sang đánh
    if (d.runTo && (M.dist(d, d.runTo) < 1 || (best && d.st.ad > 0 && bd < d.st.range + d.r + best.r + 1.5))) d.runTo = null;
    if (d.runTo) { d.attackTarget = null; d.goal = d.runTo; return; }
    // GĐ11: PHÂN THÂN LỪA ĐẢO — ảo ảnh không đứng ì như bia:
    //  • chủ đang bỏ chạy (máu < 35%) → ảo ảnh chạy theo hướng NGƯỢC chủ, lạng lách, kéo kẻ đuổi đi sai đường
    //  • ảo ảnh tụt dưới 40% máu → giả vờ tháo chạy (như tướng thật sắp chết) để dụ kẻ địch đuổi theo
    //  • còn lại: đánh kẻ gần nhất nhưng lạng trái/phải giữa hai đòn như tướng thật
    const o = d.owner, zig = (Math.floor(m.time / 0.5) + d.id) % 2 ? 1 : -1;
    const flee = (from) => {
      const v = M.dir(from, d), g = { x: d.x + v.x * 4 - v.y * 1.6 * zig, y: d.y + v.y * 4 + v.x * 1.6 * zig };
      G.MAP.pushOut(g, d.r); d.attackTarget = null; d.goal = g;
    };
    if (o && o.alive && o.hpPct < 0.35 && best && M.dist(o, d) < 14) { flee(o); d.fake = 'flee'; return; }
    if (best && d.hp < d.st.maxHp * 0.4) { flee(best); d.fake = 'flee'; return; }
    d.fake = null;
    if (best) {
      const reach = d.st.range + d.r + best.r;
      // GĐ12: đánh-rồi-lùi (hit & run) — giữa hai đòn lùi ra mép tầm (+1 đv nếu là ảo ảnh cận chiến) và lạng ngang
      const back = d.ranged ? reach - 0.3 : reach + 1;
      if (d.atkT > 0.2 && bd < reach + 0.3) { const v = M.dir(best, d), g = { x: best.x + v.x * back - v.y * 1.2 * zig, y: best.y + v.y * back + v.x * 1.2 * zig }; G.MAP.pushOut(g, d.r); d.attackTarget = null; d.goal = g; return; }
      d.attackTarget = best; d.goal = null;
    } else { d.attackTarget = null; d.goal = d.home || null; }
  }
  const DecoyMix = {
    // o: { life, hp (tỉ lệ máu tối đa của tướng gốc), runTo {x,y}, onDeath(m,d,k), onExpire(m,d), dmg (tỉ lệ sát thương) }
    makeDecoy(owner, x, y, o) {
      o = o || {};
      const st = owner.st;
      const d = new G.Unit(this, { kind: 'pet', team: owner.team, x, y, r: owner.r, ranged: owner.ranged, projSpeed: owner.projSpeed,
        base: { hp: st.maxHp * (o.hp || 0.35), armor: st.armor, mr: st.mr, ad: st.ad * (o.dmg || 0), as: st.as, ms: st.ms * (o.ms || 1), range: st.range } });
      d.decoy = true; d.owner = owner; d.hero = owner.hero; d.heroId = owner.heroId; d.name = owner.hero.name; d.gfx = owner.hero.gfx; d.color = owner.hero.color;
      d.ranks = owner.ranks; d.cd = {}; d.level = owner.level; d.resource = owner.resource; d.mp = owner.mp;
      d.hp = d.st.maxHp * Math.max(0.3, owner.hpPct);
      d.lifeT = this.time + (o.life || 6); d.runTo = o.runTo || null; d.home = { x, y };
      d.petThink = decoyThink;
      if (o.onDeath) d.onDeath = (mm, kk) => mm.hook(o.onDeath, mm, d, kk);
      if (o.onExpire) d.onExpire = o.onExpire;
      this.addUnit(d); this.pets.push(d);
      if (this.fxOn) this.fx({ type: 'blink', x, y, x2: x, y2: y, team: owner.team });
      return d;
    },
    decoysOf(owner) { return this.pets.filter((p) => p.decoy && p.alive && p.owner === owner); },
  };
  G.DecoyMix = DecoyMix;
})();
