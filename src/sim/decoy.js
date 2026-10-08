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
    if (d.runTo) { d.attackTarget = null; d.goal = d.runTo; return; }
    let best = null, bd = 10;
    for (const h of m.heroes) if (h.alive && h.team !== d.team && h.vis[d.team]) { const x = M.dist(h, d); if (x < bd) { bd = x; best = h; } }
    if (best) { d.attackTarget = best; d.goal = null; }
    else { d.attackTarget = null; d.goal = d.home || null; }
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
