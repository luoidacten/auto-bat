'use strict';
// ===== THÙNG THUỐC NỔ (GĐ7) — gắn vào Match.prototype =====
// Vị trí lấy từ bản đồ (MAP.barrels). Kích nổ khi: trúng đạn bay qua, nằm trong chiêu diện rộng, bị tướng đánh trực tiếp
// (m.hitBarrel), hoặc thùng bên cạnh nổ (dây chuyền). Cháy ngòi C.BARREL.fuse giây rồi nổ: tướng trong bán kính mất
// C.BARREL.dmg máu tối đa (sát thương chuẩn, tính công cho kẻ kích nổ) và bị hất văng; quái mất C.BARREL.mon máu.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, MAP = G.MAP;
  const Props = {
    setupProps() { this.barrels = MAP.barrels.map((b, i) => ({ id: i, x: b.x, y: b.y, alive: true, fuse: 0, by: null, toxic: !!b.toxic })); this.barrelN = 0; },
    // kích nổ (bắt đầu cháy ngòi); by: kẻ gây ra (được tính công)
    igniteBarrel(b, by, delay) {
      if (!b || !b.alive || b.fuse) return false;
      b.fuse = this.time + (delay != null ? delay : C.BARREL.fuse);
      const o = by ? G.ownerOf(by) : null;
      b.by = o && o.kind === 'hero' ? o : null;
      return true;
    },
    hitBarrel(u, b) { if (!b || !b.alive || G.M.dist(u, b) > u.st.range + u.r + 1.2) return false; return this.igniteBarrel(b, u); },
    barrelsIn(x, y, R, by) {
      for (const b of this.barrels) if (b.alive && !b.fuse) { const dx = b.x - x, dy = b.y - y; if (dx * dx + dy * dy <= (R + 0.6) * (R + 0.6)) this.igniteBarrel(b, by); }
    },
    explodeBarrel(b) {
      const B = C.BARREL, src = b.by && b.by.alive !== undefined ? b.by : null;
      b.alive = false; this.barrelN++;
      let hit = 0;
      const list = [];
      this.grid.query(b.x, b.y, B.r + 1.5, (u) => { if (u.alive && u.targetable && G.M.dist(u, b) <= B.r + u.r) list.push(u); });
      list.sort((p, q) => p.id - q.id);
      for (const u of list) {
        if (!u.alive) continue;
        if (u.kind === 'hero') { this.damage(src, u, u.st.maxHp * B.dmg / (src ? C.PVP_DMG : 1), 'true', { tag: 'barrel', aoe: true }); hit++; }
        else if (u.kind === 'monster') this.damage(src, u, B.mon, 'true', { tag: 'barrel', aoe: true });
        else this.damage(src, u, u.st.maxHp * 0.35, 'true', { tag: 'barrel', aoe: true });
        if (u.alive && !(u.kind === 'monster' && (u.big || u.boss))) { const d = G.M.dist(b, u) || 1; this.knock(src, u, (u.x - b.x) / d, (u.y - b.y) / d, B.knock, 0.25); }
      }
      // dây chuyền
      for (const o of this.barrels) if (o.alive && !o.fuse && G.M.dist(o, b) <= B.r + 1.5) this.igniteBarrel(o, src, B.chain);
      if (b.toxic && this.toxicCloud) this.toxicCloud(b.x, b.y, src);   // GĐ8: thùng độc (Trạm Khí Độc) để lại mây độc 5s
      if (hit || src) this.addFeed({ type: 'barrel', by: src, hit });
      if (this.fxOn) { this.fx({ type: 'boom', x: b.x, y: b.y, r: B.r, color: '#ff8a2a' }); this.fx({ type: 'quake', x: b.x, y: b.y, r: B.r }); }
      if (src) src.stats.barrels = (src.stats.barrels || 0) + 1;
    },
    updateProps() {
      const Bs = this.barrels; if (!Bs || !Bs.length || this.barrelN >= Bs.length) return;
      // đạn bay qua thùng
      if (this.projs.length) for (const p of this.projs) {
        if (p.dead || p.kind === 'bomb') continue;
        for (const b of Bs) if (b.alive && !b.fuse) { const dx = p.x - b.x, dy = p.y - b.y; if (dx * dx + dy * dy < 0.8) { this.igniteBarrel(b, p.owner); if (!p.pierce) { p.dead = true; if (p.onEnd) this.hook(p.onEnd, this, p); } break; } }
      }
      for (const b of Bs) if (b.alive && b.fuse && this.time >= b.fuse) this.explodeBarrel(b);
    },
  };
  G.PropMix = Props;
})();
