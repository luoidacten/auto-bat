'use strict';
// ===== ĐẤU TRƯỜNG: bo (vùng an toàn), hồi sinh, loại khỏi trận, xếp hạng, kết thúc =====
// Gắn vào Match.prototype.
//   • Bo: 6 vòng (C.ZONE). Mỗi vòng chờ rồi co về vòng kế; tâm vòng kế chọn ngẫu nhiên theo hạt giống, nằm trọn trong vòng cũ.
//     Vòng kế được báo ngay khi vòng trước co xong (ai cũng biết). Ngoài bo mất % máu tối đa mỗi giây (sát thương chuẩn).
//   • Hồi sinh: chết trong 10 phút đầu thì được hồi sinh 1 lần (sau 12s, ở chỗ an toàn trong bo, xa người khác nhất).
//   • Bị loại: theo thứ tự; cùng một bước logic thì đồng hạng. Còn ≤ 1 người thì hết trận.
//   • Hết 30:00 (bo 6 không co về 0): những ai còn sống ĐỒNG HẠNG 1.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, MAP = G.MAP, M = G.M;
  const { dist } = M;

  const Arena = {
    setupZone() {
      const c = MAP.center;
      if (this.soloArena) {
        const r0 = this.soloArena.r + 0.5;
        this.zoneSt = {
          cur: { x: this.soloArena.cx, y: this.soloArena.cy, r: r0 },
          from: null,
          next: { x: this.soloArena.cx, y: this.soloArena.cy, r: 10 },
          phase: 0,
          started: 0,
          shrinking: false,
          dps: C.ZONE[2].dps,
          shrinkAt: this.time + (this.cfg.soloWait || 45),
          shrinkEnd: this.time + (this.cfg.soloWait || 45) + 35,
        };
        return;
      }
      if (this.cfg.mode === 'solo' && this.cfg.soloCenter) {
        const r0 = this.cfg.soloZoneR || 42;
        this.zoneSt = { cur: { x: c.x, y: c.y, r: r0 }, from: null, next: { x: c.x, y: c.y, r: Math.max(14, r0 * 0.45) }, phase: 0, started: 0, shrinking: false, dps: C.ZONE[2].dps, shrinkAt: this.time + (this.cfg.soloWait || 35), shrinkEnd: this.time + (this.cfg.soloWait || 35) + 40 };
        return;
      }
      this.zoneSt = { cur: { x: c.x, y: c.y, r: C.ZONE_R0 }, from: null, next: null, phase: -1, started: 0, shrinking: false, dps: 0, shrinkAt: 0, shrinkEnd: 0 };
      this.planZone(0);
    },
    // chọn vòng thứ i (tính từ 0): tâm ngẫu nhiên sao cho vòng mới nằm trọn trong vòng hiện tại và trong bản đồ
    planZone(i) {
      const z = this.zoneSt, P = C.ZONE[i];
      if (!P) { z.next = null; return; }
      const base = z.cur, slack = Math.max(0, base.r - P.r), mg = Math.min(P.r, 40) + 4;
      let cx = base.x, cy = base.y;
      for (let k = 0; k < 12; k++) {
        const a = this.rngArena.range(0, Math.PI * 2), rr = slack * Math.sqrt(this.rngArena.next()) * 0.85;
        const x = base.x + M.cos(a) * rr, y = base.y + M.sin(a) * rr;
        if (x < mg || y < mg || x > C.MAP - mg || y > C.MAP - mg) continue;
        if (P.r < 6 && MAP.inWall(x, y, 3)) continue;               // vòng cuối không rơi vào trong đá
        cx = x; cy = y; break;
      }
      z.next = { x: Math.round(cx * 100) / 100, y: Math.round(cy * 100) / 100, r: P.r };
      z.phase = i; z.shrinkAt = this.time + P.wait; z.shrinkEnd = z.shrinkAt + P.shrink;
      if (i > 0) this.addFeed({ type: 'zone_next', phase: i + 1, at: z.shrinkAt });
    },
    updateZone() {
      const z = this.zoneSt, t = this.time;
      if (z.next && !z.shrinking && t >= z.shrinkAt) {
        z.shrinking = true; z.from = { x: z.cur.x, y: z.cur.y, r: z.cur.r }; z.started++; z.dps = C.ZONE[z.phase].dps;
        this.addFeed({ type: 'zone_shrink', phase: z.started });
      }
      if (z.shrinking) {
        const k = Math.min(1, (t - z.shrinkAt) / Math.max(0.001, z.shrinkEnd - z.shrinkAt));
        z.cur = { x: z.from.x + (z.next.x - z.from.x) * k, y: z.from.y + (z.next.y - z.from.y) * k, r: z.from.r + (z.next.r - z.from.r) * k };
        if (k >= 1) { z.shrinking = false; z.cur = { x: z.next.x, y: z.next.y, r: z.next.r }; this.planZone(z.phase + 1); }
      }
      // sát thương bo mỗi 0.5s
      if (this.tick % 10 === 0) {
        const dps = z.dps;
        if (dps > 0) for (const h of this.heroes) if (h.alive && !h.duel && !this.inZone(h)) {
          h.zoneT = t;
          this.damage(null, h, h.st.maxHp * dps * 0.5 * (h.statuses.length && h.hasKey('fu_doc') ? 1 - C.FU_DOC : 1) * (1 - Math.min(0.8, h.bonus.zoneRed || 0)), 'true', { tag: 'zone', noHook: true });   // GĐ7: Phù Kháng Độc • GĐ8: mảnh hồn Kháng Độc Bão Tố
        }
      }
    },
    inZone(p, pad) { const z = this.zoneSt.cur; return dist(p, z) <= z.r - (pad || 0); },
    // vòng sắp tới (nếu đang chờ/co) hoặc vòng hiện tại
    safeCircle() { const z = this.zoneSt; return z.next || z.cur; },
    // chỗ hồi sinh: điểm xuất phát trong bo xa người khác nhất; không có thì một điểm trong vòng kế tiếp
    revivePoint(h) {
      const tgt = this.safeCircle();
      let best = null, bs = -1;
      for (const s of MAP.spawns) {
        if (dist(s, tgt) > tgt.r - 2 || !this.inZone(s, 2)) continue;
        let md = 999; for (const o of this.heroes) if (o !== h && o.alive) md = Math.min(md, dist(o, s));
        if (md > bs) { bs = md; best = s; }
      }
      if (best) return { x: best.x, y: best.y };
      const p = { x: tgt.x, y: tgt.y }; MAP.pushOut(p, 1);
      return p;
    },
    // tướng gục ngã: còn lượt hồi sinh (10 phút đầu) thì chờ hồi sinh, không thì bị loại
    heroDown(u) {
      if (u.duel) {
        // người thua quyết đấu sẽ được hồi sinh ngay khi kết thúc quyết đấu
        return false;
      }
      if (!this.cfg.noRevive && this.time < C.REVIVE_UNTIL && !u.revived) {
        u.revived = true; u.reviving = true; u.respawnT = C.REVIVE_DELAY;
        return false;
      }
      u.out = true; u.outT = this.time; u.reviving = false;
      this.outBatch.push(u);
      return true;
    },
    // xếp hạng những người bị loại trong bước này (cùng bước = đồng hạng)
    settleOut() {
      if (!this.outBatch.length) return;
      const remainBefore = this.heroes.filter((h) => !h.out).length + this.outBatch.length;
      const place = remainBefore - this.outBatch.length + 1;
      for (const h of this.outBatch) { h.place = place; this.ranking.push({ hero: h, place, t: this.time }); this.addFeed({ type: 'out', hero: h, place }); }
      this.outBatch = [];
      const left = this.heroes.filter((h) => !h.out);
      if (left.length <= 1) this.finish(left);
    },
    finish(left) {
      for (const h of left) { h.place = 1; this.ranking.push({ hero: h, place: 1, t: this.time }); }
      const first = this.ranking.find((r) => r.place === 1);
      this.winner = left.length === 1 ? left[0].team : first ? first.hero.team : -1;
      this.over = true;
      this.addFeed({ type: 'end', heroes: this.ranking.filter((r) => r.place === 1).map((r) => r.hero) });
    },
    // hết giờ: ai còn trong trận (kể cả đang chờ hồi sinh) đồng hạng 1
    endByTime() {
      this.timeout = true;
      this.finish(this.heroes.filter((h) => !h.out));
    },
    aliveCount() { let n = 0; for (const h of this.heroes) if (!h.out) n++; return n; },
  };
  G.ArenaMix = Arena;
})();
