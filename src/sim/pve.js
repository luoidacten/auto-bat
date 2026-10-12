'use strict';
// ===== GĐ12: CHẾ ĐỘ PvE SINH TỒN — người chơi tự điều khiển 1 tướng giữa 9 tướng máy =====
// Lõi mô phỏng (không giao diện): m.pveOn(heroId) gắn quyền điều khiển cho tướng đó (AI của nó ngừng nghĩ).
// Mỗi nhịp, pveStep(u) đọc trạng thái điều khiển m.pve:
//   • mv {x,y}   — véc-tơ di chuyển (phím WASD / cần ảo), độ dài 0..1; khác 0 thì đi theo hướng đó, hủy đánh thường
//   • aim {x,y}  — điểm ngắm trên bản đồ (chuột / hướng cần ảo); null thì tự ngắm theo mục tiêu khóa
//   • lockId     — mục tiêu đang khóa; tự khóa thông minh: tướng địch gần nhất trong 9 đv, không có thì quái gần nhất trong tầm
//   • queue      — lệnh chờ: { k: 's1'|'s2'|'s3'|'s4'|'sub' } hoặc { bag: id } (bình / vật phẩm balo, 1 chạm)
// Không tự đánh: đánh thường chỉ theo lệnh (nút ⚔ / click / kéo khóa), giữ lệnh tới khi di chuyển hoặc mất mục tiêu. Bị loại → pve.out = true, giao diện chuyển
// sang góc nhìn trọng tài.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const M = G.M, MAP = G.MAP;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const PveMix = {
    pveOn(heroId) {
      const u = this.heroes.find((h) => h.heroId === heroId) || this.heroes[0];
      u.ctl = true; this.pve = { id: u.id, mv: { x: 0, y: 0 }, aim: null, lockId: null, queue: [], out: false, atkId: null };
      // GĐ12: XÓA AI TỰ HÀNH của tướng này — không nghĩ, không tự dùng chiêu / bình / balo, không tự liên minh, không phản xạ / hoảng loạn;
      // điểm chiêu và mua đồ đều do người chơi tự làm (nút + trên chiêu, cửa hàng 🛒)
      if (u.ai) { u.ai.seq = null; u.ai.act = null; u.ai.mode = 'player'; }
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
    // ===== ĐƯỜNG THỰC THI THỐNG NHẤT (Unified Action Pipeline) =====
    // Người chơi (HUD cảm ứng / chuột-phím) và AI (lấy mẫu không gian, gom cụm, đón đầu) cùng đổ về 2 hàm này.
    executeSkill(u, slot, pos, ent) { return this.castSkill(u, slot, ent || null, pos || { x: u.x + u.fx * 3, y: u.y + u.fy * 3 }); },
    // target có sẵn → đánh; không có → chọn theo ưu tiên (tướng thấp máu nhất trong tầm → tướng gần nhất → quái đang giao tranh);
    // vẫn không có → bước ngắn 1.5 đv về phía kẻ địch gần nhất trong 9 đv (hoặc theo hướng dir / hướng mặt)
    executeBasicAttack(u, target, dir) {
      const inR = (e) => Math.hypot(e.x - u.x, e.y - u.y) - e.r - u.r <= u.st.range + 0.15;
      const ok = (e) => e && e.alive && e.team !== u.team && (!e.vis || e.vis[u.team] !== false) && !(e.statuses.length && e.has('untarget'));
      let t = ok(target) ? target : null;
      if (!t) {
        const hs = this.heroes.filter((h) => h !== u && ok(h) && inR(h));
        t = hs.sort((a, b) => a.hp / a.st.maxHp - b.hp / b.st.maxHp || a.id - b.id)[0] || null;
        if (!t) { let bd = 1e9; this.grid.query(u.x, u.y, u.st.range + 3, (v) => { if ((v.kind === 'monster' || v.kind === 'pet') && ok(v) && inR(v)) { const d = Math.hypot(v.x - u.x, v.y - u.y) - (v.aggro === u ? 5 : 0); if (d < bd) { bd = d; t = v; } } }); }
      }
      if (t) { if (this.pve) { this.pve.lockId = t.id; this.pve.atkId = t.id; } u.attackTarget = t; u.goal = null; return t; }
      let e = null, bd = 9; for (const h of this.heroes) if (h !== u && ok(h)) { const d = Math.hypot(h.x - u.x, h.y - u.y); if (d < bd) { bd = d; e = h; } }
      const v = e ? { x: (e.x - u.x) / bd, y: (e.y - u.y) / bd } : dir || { x: u.fx, y: u.fy };
      const g = { x: u.x + v.x * 1.5, y: u.y + v.y * 1.5 }; MAP.pushOut(g, u.r); u.goal = g; u.attackTarget = null;
      if (this.pve) this.pve.stepUntil = this.time + 0.45;
      return null;
    },
    pveStep(u) {
      const P = this.pve; if (!P || !u.alive) { if (P && !u.alive && !this.over && (u.out || this.lastLifeGone(u))) P.out = true; return; }
      const t = this.pveTarget(u);
      if (u.ai) u.ai.target = t && t.kind === 'hero' ? t : null;   // chỉ là dữ liệu cho chiêu đọc ai.target (Florian S4…), không phải AI quyết định
      // lệnh: chiêu (vị trí ngắm từ chỉ thị), đánh thường (mục tiêu khóa / ưu tiên), vật phẩm balo
      while (P.queue.length) {
        const c = P.queue.shift();
        if (c.learn) { if (this.canLearn(u, c.learn)) { u.ranks[c.learn]++; u.points--; if (this.fxOn) this.fx({ type: 'lvl', x: u.x, y: u.y, team: u.team }); } continue; }
        if (c.shop) { this.pveShop(u, c.shop); continue; }
        if (c.chest) { const ch = this.pveChest(u, 2.5); if (ch) { u.attackTarget = null; P.atkId = null; P.chestId = ch.id; } continue; }
        if (c.bag) { const pt = c.pt || (t ? { x: t.x, y: t.y } : { x: u.x + u.fx * 3, y: u.y + u.fy * 3 }); this.useBag(u, c.bag, t, pt); continue; }
        if (c.atk !== undefined) { P.chestId = null; const tg = c.atk != null ? this.units.find((x) => x.id === c.atk) : null; this.executeBasicAttack(u, tg, c.dir); continue; }
        const def = u.hero.skills[c.k]; if (!def) continue;
        const a = def.ai || {};
        const ent = c.tgt != null ? this.units.find((x) => x.id === c.tgt) : t;
        let pt = c.pt;
        if (!pt) {                                              // bấm nhanh: tự lấy mục tiêu ưu tiên + đón đầu nhẹ 0.25s
          if (a.aim === 'self') pt = { x: u.x, y: u.y };
          else if (ent && ent.alive) pt = { x: ent.x + (ent.vx || 0) * 0.25, y: ent.y + (ent.vy || 0) * 0.25 };
          else pt = { x: u.x + u.fx * (a.range || 4), y: u.y + u.fy * (a.range || 4) };
        }
        if (u.recast[c.k] || this.canCast(u, c.k)) { this.executeSkill(u, c.k, pt, ent && ent.alive ? ent : null); u.stats.pveCasts = (u.stats.pveCasts || 0) + 1; }
      }
      const L = Math.hypot(P.mv.x, P.mv.y);
      if (u.cast && u.cast.key === 'chest' && L > 0.15) u.cast = null;   // di chuyển = bỏ mở rương
      if (u.cast || u.dash || u.disabled) return;
      if (L > 0.15) {
        const g = { x: u.x + P.mv.x / L * 2.5, y: u.y + P.mv.y / L * 2.5 }; MAP.pushOut(g, u.r);
        u.attackTarget = null; u.goal = g; u.navP = null; P.atkId = null; P.chestId = null;   // di chuyển = hủy lệnh đánh / mở rương
        u.face(g.x, g.y);
        return;
      }
      // đi tới rương đã chọn (≤ 2.5 đv ngoài tầm với) rồi tự mở
      if (P.chestId != null) {
        const ch = (this.chests || []).find((c) => c.id === P.chestId && !c.opened);
        if (!ch) P.chestId = null;
        else if (dist(u, ch) <= G.C.CHEST.r + u.r - 0.1) { P.chestId = null; u.goal = null; this.openChest(u, ch); return; }
        else { u.goal = { x: ch.x, y: ch.y }; u.attackTarget = null; return; }
      }
      if (P.stepUntil > this.time) return;                       // đang bước ngắn tới kẻ địch (đánh thường hụt tầm)
      u.goal = null;
      // chỉ đánh theo LỆNH (nút ⚔ / click / kéo khóa): bám mục tiêu đã ra lệnh tới khi di chuyển, mục tiêu chết, khuất tầm nhìn hoặc xa > 12 đv
      const a = P.atkId != null ? this.units.find((x) => x.id === P.atkId) : null;
      if (a && a.alive && (!a.vis || a.vis[u.team] !== false) && Math.hypot(a.x - u.x, a.y - u.y) < 12) u.attackTarget = a;
      else { P.atkId = null; u.attackTarget = null; }
    },
    // ===== CỬA HÀNG THỦ CÔNG (GĐ12 PvE) — mua ở cạnh Thương Nhân (hoặc mọi nơi nếu có mảnh "Cửa Hàng Online") =====
    pveCanShop(u) { return !!(this.atShop(u) || (u.perks && u.perks.has('cua_hang') && this.time - (u.combatT || -99) > 4)); },
    pveShop(u, o) {
      if (!this.pveCanShop(u)) return false;
      if (o.buy) {
        const it = G.ITEMS[o.buy]; if (!it) return false;
        if (this.canBuy(u, o.buy)) return this.buy(u, o.buy);
        // đã đủ 6 ô: bán món khởi điểm để lấy chỗ (nếu có)
        const si = u.items.findIndex((x) => G.ITEMS[x].starter); if (si >= 0 && !(it.comp && u.items.includes(it.comp))) { this.sell(u, si); return this.canBuy(u, o.buy) && this.buy(u, o.buy); }
        return false;
      }
      if (o.sell != null) return this.sell(u, o.sell);
      if (o.bagBuy) { const d = G.CONSUMABLES[o.bagBuy]; if (!d || d.noBuy || u.gold < d.cost || this.bagRoom(u, o.bagBuy) <= 0) return false; u.gold -= d.cost; this.bagAdd(u, o.bagBuy, 1); return true; }
      if (o.bagUp) { const B = G.BAG; if (!u.bag || u.bag.lv >= 5 || u.gold < B.upgrade[u.bag.lv]) return false; u.gold -= B.upgrade[u.bag.lv]; this.upgradeBag(u); return true; }
      if (o.forge) return this.forgeYNiem ? this.forgeYNiem(u, 0) : false;
      return false;
    },
    // rương chưa mở gần nhất trong tầm với (mở bằng nút 🎁 / phím V — đứng yên 1.5s, bị đánh hoặc di chuyển thì hỏng)
    pveChest(u, ext) { let best = null, bd = G.C.CHEST.r + u.r + (ext || 0); for (const c of this.chests || []) if (!c.opened) { const d = dist(u, c); if (d < bd) { bd = d; best = c; } } return best; },
    lastLifeGone(u) { return !!(u.place || u.out); },
  };
  G.PveMix = PveMix;
})();
