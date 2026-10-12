'use strict';
// ===== GĐ12: CHẾ ĐỘ PvE SINH TỒN — người chơi tự điều khiển 1 tướng giữa 9 tướng máy =====
// Lõi mô phỏng (không giao diện): m.pveOn(heroId) gắn quyền điều khiển cho tướng đó (AI của nó ngừng nghĩ).
// Mỗi nhịp, pveStep(u) đọc trạng thái điều khiển m.pve:
//   • mv {x,y}   — véc-tơ di chuyển (phím WASD / cần ảo), độ dài 0..1; khác 0 thì đi theo hướng đó, hủy đánh thường
//   • aim {x,y}  — điểm ngắm trên bản đồ (chuột / hướng cần ảo); null thì tự ngắm theo mục tiêu khóa
//   • lockId     — mục tiêu đang khóa; tự khóa thông minh: tướng địch gần nhất trong 9 đv, không có thì quái gần nhất trong tầm
//   • queue      — lệnh chờ: { k: 's1'|'s2'|'s3'|'s4'|'sub' } hoặc { bag: id } (bình / vật phẩm balo, 1 chạm)
// Đứng yên + có mục tiêu khóa trong tầm → tự đánh thường (như đánh thường giữ nút). Bị loại → pve.out = true, giao diện chuyển
// sang góc nhìn trọng tài.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const M = G.M, MAP = G.MAP;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const PveMix = {
    pveOn(heroId) {
      const u = this.heroes.find((h) => h.heroId === heroId) || this.heroes[0];
      u.ctl = true; this.pve = { id: u.id, mv: { x: 0, y: 0 }, aim: null, lockId: null, queue: [], out: false, autoAtk: true };
      u.isPlayer = true;
      return u;
    },
    pveUnit() { return this.pve ? this.heroById(this.pve.id) : null; },
    // khóa mục tiêu thông minh: giữ mục tiêu cũ nếu còn thấy & trong 11 đv; không thì tướng địch gần nhất 9 đv; rồi quái trong tầm đánh + 2
    pveTarget(u) {
      const P = this.pve, vis = (e) => e && e.alive && e.team !== u.team && (!e.vis || e.vis[u.team] !== false) && !(e.statuses.length && e.has('untarget'));
      const cur = P.lockId != null ? this.units.find((x) => x.id === P.lockId) : null;
      if (vis(cur) && dist(cur, u) < 11) return cur;
      let best = null, bd = 9;
      for (const h of this.heroes) if (h !== u && vis(h) && !(h.allyRec && h.allyRec.get && h.allyRec.get(u.id))) { const d = dist(h, u); if (d < bd) { bd = d; best = h; } }
      if (!best) { bd = u.st.range + u.r + 2; this.grid.query(u.x, u.y, bd + 2, (v) => { if ((v.kind === 'monster' || v.kind === 'pet') && vis(v)) { const d = dist(v, u) - v.r; if (d < bd) { bd = d; best = v; } } }); }
      P.lockId = best ? best.id : null;
      return best;
    },
    pveStep(u) {
      const P = this.pve; if (!P || !u.alive) { if (P && !u.alive && !this.over && (u.out || this.lastLifeGone(u))) P.out = true; return; }
      const t = this.pveTarget(u);
      if (u.ai) { u.ai.target = t && t.kind === 'hero' ? t : null; u.ai.mode = t ? 'fight' : 'idle'; }   // chiêu đọc ai.target (Florian S4…)
      // lệnh chiêu / vật phẩm
      while (P.queue.length) {
        const c = P.queue.shift();
        if (c.bag) { const pt = P.aim || (t ? { x: t.x, y: t.y } : { x: u.x + u.fx * 3, y: u.y + u.fy * 3 }); this.useBag(u, c.bag, t, pt); continue; }
        const def = u.hero.skills[c.k]; if (!def) continue;
        const a = def.ai || {};
        let pt = P.aim;
        if (!pt) pt = a.aim === 'self' ? { x: u.x, y: u.y } : t ? { x: t.x, y: t.y } : { x: u.x + u.fx * (a.range || 4), y: u.y + u.fy * (a.range || 4) };
        const tgt = a.aim === 'unit' ? (t && dist(t, pt) < 3 ? t : t) : t;
        if (u.recast[c.k] || this.canCast(u, c.k)) { this.castSkill(u, c.k, tgt, pt); u.stats.pveCasts = (u.stats.pveCasts || 0) + 1; }
      }
      if (u.cast || u.dash || u.disabled) return;
      const L = Math.hypot(P.mv.x, P.mv.y);
      if (L > 0.15) {
        const g = { x: u.x + P.mv.x / L * 2.5, y: u.y + P.mv.y / L * 2.5 }; MAP.pushOut(g, u.r);
        u.attackTarget = null; u.goal = g; u.navP = null;
        u.face(g.x, g.y);
        return;
      }
      u.goal = null;
      if (P.autoAtk && t && dist(t, u) - t.r - u.r <= u.st.range + 0.1) u.attackTarget = t; else u.attackTarget = null;
    },
    lastLifeGone(u) { return !!(u.place || u.out); },
  };
  G.PveMix = PveMix;
})();
