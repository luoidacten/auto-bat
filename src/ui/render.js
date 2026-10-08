'use strict';
// ===== VẼ TRẬN ĐẤU — góc nhìn TRỌNG TÀI (thấy hết, không sương mù) (chỉ ĐỌC trạng thái logic) =====
// Nền đấu trường vẽ theo ô (map_art.js). Vị trí đơn vị được nội suy giữa 2 bước logic để mượt.
// Mỗi tướng một màu riêng (G.SLOT_COL theo ô xuất phát) cho vòng chân, thanh máu, tên, chấm trên bản đồ nhỏ.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const MAP = G.MAP, C = G.C, TAU = Math.PI * 2;
  const SLOT = G.SLOT_COL || ['#4aa3ff', '#ff5a5a'];
  const TEAM = new Proxy([], { get: (_, k) => (k === 'length' ? SLOT.length : SLOT[k] || '#d8c890') });
  const TEAM_L = new Proxy([], { get: (_, k) => (SLOT[k] ? G.Draw.lighten(SLOT[k], 0.55) : '#f0e8d0') });
  const IS_MOBILE = typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent));
  const BG_SCALE = IS_MOBILE ? 7 : 10; // px/đv của nền vẽ sẵn

  function hexA(c, a) { const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
  // ---------- nền dự phòng (khi không có map_art): cỏ, đá, bụi, bãi quái ----------
  function buildBackground(scale) {
    const S = C.MAP * scale;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.fillStyle = '#25432b'; g.fillRect(0, 0, S, S);
    for (const cp of MAP.camps) { g.fillStyle = 'rgba(70,58,40,0.55)'; g.beginPath(); g.arc(cp.x * scale, cp.y * scale, 2.6 * scale, 0, TAU); g.fill(); }
    g.lineCap = 'round';
    for (const w of MAP.walls) { g.strokeStyle = '#4c5843'; g.lineWidth = w.r * 2 * scale; g.beginPath(); g.moveTo(w.ax * scale, w.ay * scale); g.lineTo(w.bx * scale + 0.01, w.by * scale); g.stroke(); }
    for (const b of MAP.bushes) { g.fillStyle = 'rgba(20,60,25,0.85)'; g.beginPath(); g.arc(b.x * scale, b.y * scale, b.r * scale, 0, TAU); g.fill(); }
    return c;
  }

  class Renderer {
    constructor(canvas, m) {
      this.cv = canvas; this.ctx = canvas.getContext('2d');
      this.m = m;
      this.tiles = null; this.bg = null;   // nền: tạo ở khung hình đầu tiên (không làm chậm lúc mở game)
      this.prev = new Map();
      this.vfx = G.VFX ? new G.VFX() : null;   // hiệu ứng hình ảnh bản cũ (vệt chém, nổ, tia lửa…)
      this.uMap = new Map(); this.uMapT = -1;
      this.cam = { x: C.MAP / 2, y: C.MAP / 2, zoom: 20, follow: true, target: null, focusId: null };
      this.view = -1;         // trọng tài: luôn toàn cảnh
      this.anims = new Map(); // id → { anim, t0, dur }
      this.fx = [];           // hiệu ứng đang chạy
      this.dpr = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2);
      this.hot = null; this.hotN = 0;
      this.resize();
    }
    setMatch(m) { this.m = m; this.prev.clear(); this.anims.clear(); this.fx = []; if (this.vfx) this.vfx.clear(); this.uMapT = -1; }
    // tra đơn vị theo id (bảng dựng lại mỗi bước logic)
    unitById(id) {
      const m = this.m; if (!m) return null;
      if (this.uMapT !== m.tick) { this.uMap.clear(); for (const u of m.units) this.uMap.set(u.id, u); this.uMapT = m.tick; }
      return this.uMap.get(id) || null;
    }
    resize() {
      const w = this.cv.clientWidth || window.innerWidth, h = this.cv.clientHeight || window.innerHeight;
      this.W = w; this.H = h;
      this.cv.width = Math.round(w * this.dpr); this.cv.height = Math.round(h * this.dpr);
      const units = IS_MOBILE ? 30 : 42;
      this.baseZoom = Math.max(w, h * 1.6) / units;
      if (!this.zoomSet) this.cam.zoom = this.baseZoom;
    }
    // lưu vị trí trước bước logic (để nội suy)
    snap() { for (const u of this.m.units) { let p = this.prev.get(u.id); if (!p) { p = { x: u.x, y: u.y }; this.prev.set(u.id, p); } p.x = u.x; p.y = u.y; } }
    pos(u, a) {
      const p = this.prev.get(u.id);
      if (!p) return { x: u.x, y: u.y };
      const dx = u.x - p.x, dy = u.y - p.y;
      if (dx * dx + dy * dy > 36) return { x: u.x, y: u.y }; // dịch chuyển tức thời: không nội suy
      return { x: p.x + dx * a, y: p.y + dy * a };
    }
    // hướng mặt hiển thị (GĐ5c): xoay dần về hướng thật (tối đa ~12 rad/s) — đỡ giật khi tướng đổi hướng liên tục; chỉ để vẽ
    faceAng(u, now) {
      const want = Math.atan2(u.fy, u.fx), f = this.faces || (this.faces = new Map());
      let o = f.get(u.id);
      if (!o) { o = { a: want, t: now }; f.set(u.id, o); return want; }
      const dt = Math.min(0.1, Math.max(0, now - o.t)); o.t = now;
      let d = want - o.a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      const mx = (u.windup || u.cast ? 30 : 12) * dt;
      o.a += Math.abs(d) <= mx ? d : Math.sign(d) * mx;
      return o.a;
    }
    w2s(x, y) { const z = this.cam.zoom; return { x: (x - this.cam.x) * z + this.W / 2, y: (y - this.cam.y) * z + this.H / 2 }; }
    s2w(x, y) { const z = this.cam.zoom; return { x: (x - this.W / 2) / z + this.cam.x, y: (y - this.H / 2) / z + this.cam.y }; }
    seen() { return true; }                                          // trọng tài thấy hết
    nameOf(h) { return h.player && h.player.name ? h.player.name : h.hero ? h.hero.name : h.name || ''; }

    // ---------- camera "tiên tri" — chấm điểm các điểm nóng (đang và SẮP xảy ra), lia tới trước khi pha bóng nổ ra ----------
    // Trọng tài thấy hết: dùng cả ý định của AI (đi săn ai, rình kền kền ở đâu, tranh thính nào).
    hotspots() {
      const m = this.m, out = [], D = G.M.dist;
      const vel = (h) => { const p = this.prev.get(h.id); return p ? { x: (h.x - p.x) / C.TICK, y: (h.y - p.y) / C.TICK } : { x: 0, y: 0 }; };
      const fut = (h, t) => { const v = vel(h); return { x: h.x + v.x * t, y: h.y + v.y * t }; };
      const add = (x, y, s, label, units) => {
        for (const o of out) if (Math.hypot(o.x - x, o.y - y) < 10) { if (s > o.s) { o.s = s; o.label = label; } o.x = (o.x + x) / 2; o.y = (o.y + y) / 2; if (units) for (const u of units) o.units.add(u); return; }
        out.push({ x, y, s, label, units: new Set(units || []) });
      };
      const H = m.heroes.filter((h) => h.alive);
      // 1) đang giao tranh: tướng vừa đánh / bị đánh bởi tướng khác
      for (const h of H) {
        if (m.time - (h.combatT || -99) > 2.5) continue;
        const grp = H.filter((o) => D(o, h) < 12 && m.time - (o.combatT || -99) < 3);
        if (grp.length < 2) continue;
        let sx = 0, sy = 0; for (const o of grp) { const f = fut(o, 0.5); sx += f.x; sy += f.y; }
        const low = grp.filter((o) => o.hpPct < 0.3).length;
        const lurk = H.filter((o) => o.ai && o.ai.act === 'vulture' && D(o, h) < 22).length;
        add(sx / grp.length, sy / grp.length, 1.3 + 0.45 * grp.length + 0.5 * low + 0.4 * lurk, lurk ? '🦅 Kền kền đang rình' : grp.length >= 3 ? '⚔ Hỗn chiến' : '⚔ Giao tranh', grp);
      }
      // 2) sắp chạm trán: hai tướng đang lao vào nhau (dự đoán 1.2s tới)
      for (let i = 0; i < H.length; i++) for (let j = i + 1; j < H.length; j++) {
        const a = H[i], b = H[j];
        const d = D(a, b); if (d > 24 || d < 3) continue;
        const fa = fut(a, 1.2), fb = fut(b, 1.2), d2 = Math.hypot(fa.x - fb.x, fa.y - fb.y);
        if (d - d2 < 1.2) continue;
        add((fa.x + fb.x) / 2, (fa.y + fb.y) / 2, 1.0 + 1.2 * (1 - d / 24) + 0.15 * (d - d2), '⚡ Sắp chạm trán', [a, b]);
      }
      // 3) đi săn: kẻ săn đã tới gần con mồi
      for (const h of H) {
        const ai = h.ai; if (!ai || ai.act !== 'hunt' || !ai.actDir || !ai.actDir.target || !ai.actDir.target.alive) continue;
        const e = ai.actDir.target, d = D(h, e); if (d > 30) continue;
        add((h.x + e.x) / 2, (h.y + e.y) / 2, 1.2 + 0.8 * (1 - d / 30), '🎯 Đang bị săn', [h, e]);
      }
      // 4) boss đang bị đánh / thính đang mở hoặc sắp rơi
      const B = m.bossSt && m.bossSt.unit;
      if (B && B.alive) {
        const near = H.filter((h) => D(h, B) < 16);
        if (m.time - (B.lastDmgT || -99) < 3) add(B.x, B.y, 1.7 + 1.6 * (1 - B.hpPct) + 0.25 * near.length, '👑 Đánh Boss Tân Thế', near);
      }
      for (const d of m.drops || []) {
        if (!d.warned || d.taken) continue;
        const near = H.filter((h) => D(h, d) < 14);
        if (d.landed && (d.openT > 0 || near.length)) add(d.x, d.y, 1.5 + 0.3 * near.length + (d.openT > 0 ? 0.8 : 0), d.openT > 0 ? '📦 Đang mở thính' : '📦 Tranh thính', near);
        else if (!d.landed && d.at - m.time < 8 && near.length) add(d.x, d.y, 1.1 + 0.3 * near.length, '📦 Thính sắp rơi', near);
      }
      // 5) truy đuổi: tướng máu thấp đang bị đuổi
      for (const h of H) {
        if (!h.ai || !h.ai.evade || h.hpPct > 0.5) continue;
        const ch = H.filter((o) => o !== h && D(o, h) < 9);
        if (!ch.length) continue;
        const f = fut(h, 0.8);
        add(f.x, f.y, 1.3 + (1 - h.hpPct) + 0.2 * ch.length, '🏃 Truy đuổi', [h].concat(ch));
      }
      // 7) cổng quyết đấu: đang đấu (rất đáng xem) / có người ghi danh và người thứ hai đang tới
      const dg = m.duelSt && m.duelSt.gate;
      if (dg && dg.state === 'fight') add(dg.x, dg.y, 3.0 + (1 - Math.min(dg.a.hpPct, dg.b.hpPct)), '⚔ Quyết đấu', [dg.a, dg.b]);
      else if (dg && dg.state === 'open') { const near = H.filter((h) => D(h, dg) < 18); if (near.length >= 2 || (dg.a && near.length)) add(dg.x, dg.y, 1.2 + 0.3 * near.length, '⚔ Cổng quyết đấu', near); }
      // 9) tranh mảnh hồn rơi trên đất
      for (const o of m.soulOrbs || []) { const near = H.filter((h) => D(h, o) < 12); if (near.length >= 2) add(o.x, o.y, 1.1 + 0.25 * o.tier + 0.2 * near.length, '💠 Tranh mảnh hồn', near); }
      // 8) Raven đang bắn tỉa qua mắt quạ
      for (const h of H) if (h.ws && h.ws.scope && h.attackTarget && h.attackTarget.alive) add((h.x + h.attackTarget.x) / 2, (h.y + h.attackTarget.y) / 2, 1.6, '🎯 Bắn tỉa qua mắt quạ', [h, h.attackTarget]);
      // 6) cuối trận: ai đang ngoài bo
      if (m.zoneSt && m.zoneSt.dps > 0) for (const h of H) if (!m.inZone(h)) add(h.x, h.y, 0.9 + (1 - h.hpPct), '🌀 Kẹt ngoài bo', [h]);
      return out;
    }
    updateCamera(dtReal, speed) {
      const m = this.m, cam = this.cam;
      // số tướng trong cụm giao tranh đông nhất (để tự chậm lại khi giao tranh lớn)
      let bn = 0, best = null;
      const fighting = m.heroes.filter((h) => h.alive && m.time - (h.combatT || -99) < 3);
      for (const h of fighting) {
        let n = 0, sx = 0, sy = 0;
        for (const o of fighting) if (G.M.dist(h, o) < 12) { n++; sx += o.x; sy += o.y; }
        if (n > bn) { bn = n; best = { x: sx / n, y: sy / n }; }
      }
      if (!cam.follow) { this.camWhy = null; return; }
      if (m.soloArena) {
        const h0 = m.heroes[0], h1 = m.heroes[1];
        let midX = m.soloArena.cx, midY = m.soloArena.cy;
        let d = 16;
        if (h0 && h1 && (h0.alive || h1.alive)) {
          if (h0.alive && h1.alive) {
            midX = (h0.x + h1.x) / 2;
            midY = (h0.y + h1.y) / 2;
            d = G.M.dist(h0, h1);
          } else {
            const aliveH = h0.alive ? h0 : h1;
            midX = aliveH.x; midY = aliveH.y;
          }
        }
        const dx = midX - cam.x, dy = midY - cam.y;
        cam.x += dx * Math.min(1, dtReal * 4.5);
        cam.y += dy * Math.min(1, dtReal * 4.5);
        if (!this.zoomSet) {
          const arenaSpan = Math.max(28, Math.min(54, d + 14));
          const wantZoom = Math.min(this.W, this.H) / arenaSpan;
          cam.zoom += (wantZoom - cam.zoom) * Math.min(1, dtReal * 3.5);
        }
        this.camWhy = '⚔️ Võ Đài Độc Đấu';
        return;
      }
      let tgt = null, spread = 0;
      if (cam.focusId) { const h = m.heroes.find((x) => x.id === cam.focusId); if (h && h.alive) { tgt = h; this.camWhy = '🎥 Theo ' + this.nameOf(h); } }
      if (!tgt) {
        // chấm lại điểm nóng mỗi 0.25s; giữ điểm đang chiếu (cộng điểm bám) để không lia qua lại
        if (!this.dirT || m.time >= this.dirT || m.time < this.dirT - 5) {
          this.dirT = m.time + 0.25;
          const spots = this.hotspots(), cur = this.spot;
          let curS = -1, curM = null;
          if (cur) for (const o of spots) { const d = Math.hypot(o.x - cur.x, o.y - cur.y); if (d < 14 && o.s > curS) { curS = o.s; curM = o; } }
          let bs = null; for (const o of spots) if (!bs || o.s > bs.s) bs = o;
          const held = cur && m.time - cur.t0 < 2.5;
          if (curM && (!bs || bs === curM || bs.s < curS * 1.15 + 0.35 || (held && bs.s < curS * 1.6))) { cur.x = curM.x; cur.y = curM.y; cur.s = curS; cur.label = curM.label; cur.units = curM.units; cur.seen = m.time; }
          else if (bs && bs.s >= 1.1) this.spot = { x: bs.x, y: bs.y, s: bs.s, label: bs.label, units: bs.units, t0: m.time, seen: m.time };
          else if (cur && m.time - cur.seen > 3) this.spot = null;              // điểm nóng đã nguội
        }
        const sp = this.spot;
        if (sp) {
          tgt = sp; this.camWhy = '🎥 ' + sp.label;
          for (const u of sp.units || []) if (u.alive) spread = Math.max(spread, G.M.dist(u, sp));
        }
      }
      if (!tgt) {
        // không có gì nóng: theo dõi một tướng phe đang xem, đổi người mỗi 12s
        if (!this.idleT || performance.now() > this.idleT) {
          const pool = m.heroes.filter((h) => h.alive);
          this.idleHero = pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
          this.idleT = performance.now() + 12000;
        }
        const h = m.heroes.find((x) => x.id === this.idleHero && x.alive);
        if (h) { tgt = h; this.camWhy = '🎥 Dạo quanh: ' + this.nameOf(h); }
      }
      if (tgt) {
        const dx = tgt.x - cam.x, dy = tgt.y - cam.y;
        if (dx * dx + dy * dy > 40 * 40) { cam.x = tgt.x; cam.y = tgt.y; }
        else { const k = 1 - Math.pow(0.03, dtReal * Math.max(1, Math.min(4, speed || 1))); cam.x += dx * k; cam.y += dy * k; }
      }
      // thu phóng tự động: giao tranh trải rộng thì lùi camera ra (người chơi tự thu phóng thì thôi)
      if (!this.zoomSet) {
        const half = Math.min(this.W, this.H * 1.6) / 2 / this.baseZoom;     // nửa khung nhìn (đv) ở mức thu phóng gốc
        const want = this.baseZoom * Math.max(0.7, Math.min(1, half * 0.8 / Math.max(1, spread + 4)));
        cam.zoom += (want - cam.zoom) * Math.min(1, dtReal * 2.5);
      }
      this.clampCam();
    }
    clampCam() {
      const cam = this.cam, hw = this.W / 2 / cam.zoom, hh = this.H / 2 / cam.zoom;
      const isRealm = cam.x > 800 || cam.y > 800 || (this.m && this.m.duelActive && this.m.duelActive() && this.m.duelSt?.gate?.realm && (this.camWhy?.includes('Quyết') || (cam.focusId && this.m.isDuelist && this.m.isDuelist(this.m.heroById(cam.focusId)))));
      if (isRealm && C.DUEL_REALM) {
        const rcx = C.DUEL_REALM.cx, rcy = C.DUEL_REALM.cy, rr = Math.max(C.DUEL_REALM.r + 8, Math.max(hw, hh));
        cam.x = Math.max(rcx - rr, Math.min(rcx + rr, cam.x));
        cam.y = Math.max(rcy - rr, Math.min(rcy + rr, cam.y));
        return;
      }
      cam.x = Math.max(hw - 1, Math.min(C.MAP + 1 - hw, cam.x)); cam.y = Math.max(hh - 1, Math.min(C.MAP + 1 - hh, cam.y));
      if (hw * 2 > C.MAP + 8) cam.x = C.MAP / 2; if (hh * 2 > C.MAP + 8) cam.y = C.MAP / 2;
    }

    // ---------- đọc hiệu ứng mới từ logic ----------
    pullFx(onSound) {
      const q = this.m.fxq;
      if (q.length) {
        this.m.fxq = [];
        for (const e of q) {
          if (e.type === 'swing' || e.type === 'cast') {
            const u = this.m.units.find((x) => x.id === e.id);
            if (u) { const an = animFor(u, e, this.anims.get(u.id)); this.anims.set(u.id, { anim: an, t0: this.m.time, dur: ANIM_DUR[an] && e.type === 'cast' ? ANIM_DUR[an] : e.type === 'cast' ? 0.35 : Math.min(0.4, u.atkPeriod * 0.6), n: (this.anims.get(u.id) || { n: 0 }).n + 1 }); }
          }
          if (onSound) onSound(e);
          if (this.vfx) this.vfx.fromEvent(e, this.m, this.m.time, (id) => this.unitById(id));
          if (e.type === 'swing' || e.type === 'sfx' || e.type === 'note') continue;
          this.fx.push(e);
        }
      }
      const t = this.m.time;
      if (this.fx.length) this.fx = this.fx.filter((f) => t - f.t < fxLife(f));
    }

    // ---------- vẽ một khung hình ----------
    draw(alpha) {
      const ctx = this.ctx, m = this.m, z = this.cam.zoom, now = m.time;
      this.alpha = alpha;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.fillStyle = '#0b1018'; ctx.fillRect(0, 0, this.W, this.H);
      // rung màn hình (đòn nặng, vụ nổ)
      const tr = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000, dtR = Math.min(0.1, Math.max(0, tr - (this.lastReal || tr))); this.lastReal = tr;
      if (this.vfx) { this.vfx.update(now, dtR); const sh = this.vfx.shakeOffset(tr); if (sh.x || sh.y) ctx.translate(sh.x, sh.y); }
      // nền
      if (m.soloArena) {
        this.drawSoloLegacyArena(now, z);
      } else if (this.cam.x > 800 || this.cam.y > 800) {
        this.drawDuelRealmBackdrop(now, z);
      } else {
        const o = this.w2s(0, 0);
        ctx.imageSmoothingEnabled = true;
        if (this.bg && this.bgVer !== G.MAP.version) this.bg = null;   // GĐ7: trận mới trên bản đồ mới → dựng lại nền
        if (!this.bg) { this.bgVer = G.MAP.version; this.tiles = G.MapTiles ? new G.MapTiles(IS_MOBILE) : null; this.bg = this.tiles ? this.tiles.overview : buildBackground(BG_SCALE); }
        if (this.tiles) this.tiles.draw(ctx, this);   // nền theo ô, đúng độ phân giải của mức phóng
        else {
          const k = this.bg.width / C.MAP, x0 = Math.max(0, -o.x / z), y0 = Math.max(0, -o.y / z), x1 = Math.min(C.MAP, (this.W - o.x) / z), y1 = Math.min(C.MAP, (this.H - o.y) / z);
          if (x1 > x0 && y1 > y0) ctx.drawImage(this.bg, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k, o.x + x0 * z, o.y + y0 * z, (x1 - x0) * z, (y1 - y0) * z);
        }
      }
      this.drawStorm(now, z);
      // vùng (lửa, liềm…)
      for (const zn of m.zones) {
        if (zn.dead) continue;
        const p = this.w2s(zn.x, zn.y);
        if (p.x < -zn.r * z - 40 || p.y < -zn.r * z - 40 || p.x > this.W + zn.r * z + 40 || p.y > this.H + zn.r * z + 40) continue;
        ctx.fillStyle = zoneColor(zn); ctx.beginPath(); ctx.arc(p.x, p.y, zn.r * z, 0, TAU); ctx.fill();
        this.drawZoneFx(zn, p, z, now);
      }
      // hiệu ứng dưới chân (vòng phù văn chiêu cuối, biến về…)
      if (this.vfx) this.vfx.draw(ctx, this, now, true);
      if (!m.soloArena) this.drawArena(now, z);
      // lính, quái, vật triệu hồi & tướng (sắp theo y để vật dưới đè vật trên)
      const list = m.units.filter((u) => u.alive);
      list.sort((a, b) => a.y - b.y || a.id - b.id);
      for (const u of list) {
        const p = this.pos(u, alpha);
        const sp = this.w2s(p.x, p.y);
        if (sp.x < -60 || sp.y < -60 || sp.x > this.W + 60 || sp.y > this.H + 60) continue;
        if (u.leapT > now) sp.y -= Math.sin(Math.max(0, Math.min(1, 1 - (u.leapT - now) / 0.45)) * Math.PI) * 1.6 * z;   // GĐ9: Oktava nhảy vồng
        if (u.kind === 'monster') this.drawMonster(u, sp, z, now);
        else if (u.kind === 'patrol') this.drawPatrol(u, sp, z, now);
        else {
          // ảo ảnh: trọng tài biết đâu là thật (vẽ mờ, có dấu ✦); tướng trong bụi vẽ hơi mờ
          const fake = u.decoy;
          const inBush = u.kind === 'hero' && u.bush >= 0;
          if (fake || inBush) this.ctx.globalAlpha = fake ? 0.5 : 0.72;
          if (u.gfx === 'crow') this.drawCrow(u, sp, z, now);
          else this.drawUnitHero(u, sp, z, now);
          this.ctx.globalAlpha = 1;
          if (fake) { this.ctx.fillStyle = '#e0c0ff'; this.ctx.font = 'bold 12px sans-serif'; this.ctx.textAlign = 'center'; this.ctx.fillText('✦', sp.x, sp.y - u.r * z - 18); }
        }
      }
      // đạn
      for (const pj of m.projs) {
        if (pj.dead) continue;
        this.drawProj(pj, z);
      }
      // hiệu ứng
      this.drawFx(now, z);
      if (this.vfx) this.vfx.draw(ctx, this, now, false);
      // thanh máu & tên vẽ sau cùng (trên sương mù)
      for (const u of list) {
        const p = this.pos(u, alpha), sp = this.w2s(p.x, p.y);
        if (sp.x < -60 || sp.y < -60 || sp.x > this.W + 60 || sp.y > this.H + 60) continue;
        if (u.gfx === 'crow') continue;
        if (u.kind === 'hero' || u.kind === 'pet') this.drawHeroBars(u, sp, z);
        else if (u.kind === 'monster') this.drawMonsterBar(u, sp, z);
        else if (u.hp < u.st.maxHp) this.drawBar(sp.x, sp.y - u.r * z - 5, Math.max(14, u.r * z * 2), 3, u.hp / u.st.maxHp, TEAM[u.team] || '#ddd');
      }
      this.drawTexts(now, z);
      if (this.vfx) { ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.vfx.drawFlash(ctx, this); }
    }
    // hoạt cảnh trong vùng chiêu (lửa lập lòe, mây khí, gió xoáy, lưỡi kiếm, mưa thương, hoa hồi máu…)
    drawZoneFx(zn, p, z, now) {
      const ctx = this.ctx, D = G.VfxDraw, R = zn.r * z, id = zn.id || 1;
      const life = zn.life || 3, k = Math.min(1, (zn.age || 0) / life), fadeIn = Math.min(1, (zn.age || 0) * 4), fade = Math.min(1, (life - (zn.age || 0)) * 3);
      const al = Math.max(0, Math.min(fadeIn, fade));
      const spot = (i, n) => { const a = id * 2.399 + i * TAU / n + now * 0.4, d = R * (0.25 + 0.55 * (((id * 7 + i * 13) % 10) / 10)); return { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d * 0.9 }; };
      ctx.save();
      switch (zn.kind) {
        case 'fire': case 'bigfire': {
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 6; i++) {
            const q = spot(i, 6), f = 0.6 + 0.4 * Math.sin(now * 13 + i * 1.7), s = R * 0.28 * f;
            const g = ctx.createRadialGradient(q.x, q.y - s * 0.3, 0, q.x, q.y, s);
            g.addColorStop(0, 'rgba(255,240,170,0.75)'); g.addColorStop(0.5, 'rgba(255,130,40,0.45)'); g.addColorStop(1, 'rgba(200,40,0,0)');
            ctx.globalAlpha = al; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, s, 0, TAU); ctx.fill();
          }
          break;
        }
        case 'gas': case 'acid': case 'smoke': case 'well': case 'miasma': case 'poison': {
          if (!D) break;
          const row = zn.kind === 'smoke' || zn.kind === 'miasma' ? 5 : zn.kind === 'well' ? 1 : 3;
          for (let i = 0; i < 4; i++) { const q = spot(i, 4); D.sprite(ctx, 'cloud', q.x, q.y, R * 0.9, ((now * 0.5 + i * 0.23) % 1) * 0.8, { row, alpha: 0.55 * al }); }
          break;
        }
        case 'wind': case 'storm': case 'spin': case 'scythe': {
          ctx.strokeStyle = zn.kind === 'scythe' ? 'rgba(200,180,255,0.75)' : 'rgba(220,255,240,0.6)'; ctx.lineCap = 'round';
          for (let i = 0; i < 3; i++) { ctx.globalAlpha = al * 0.8; ctx.lineWidth = Math.max(2, 0.12 * z); const rr = R * (0.45 + 0.2 * i), a0 = now * (6 - i) + i * 2.1; ctx.beginPath(); ctx.arc(p.x, p.y, rr, a0, a0 + 1.6); ctx.stroke(); }
          break;
        }
        case 'blades': {
          if (!D) break;
          for (let i = 0; i < 4; i++) { const q = spot(i, 4), a = now * 9 + i * 1.6; ctx.globalAlpha = al * 0.8; D.crescent(ctx, q.x, q.y, 0.9 * z, a, 2.2, 0.35 * z, '#bfe4ff', 0.6 * al); }
          break;
        }
        case 'spears': {
          ctx.strokeStyle = '#f0d890'; ctx.lineCap = 'round';
          for (let i = 0; i < 7; i++) {
            const t = (now * 2.2 + i / 7) % 1, q = spot(i, 7), h = (1 - t) * 3 * z;
            ctx.globalAlpha = al * (t < 0.85 ? 0.9 : (1 - t) * 6); ctx.lineWidth = Math.max(2, 0.12 * z);
            ctx.beginPath(); ctx.moveTo(q.x + h * 0.25, q.y - h - 1.2 * z); ctx.lineTo(q.x + h * 0.25, q.y - h); ctx.stroke();
            if (t > 0.8) { ctx.globalAlpha = al * 0.5; ctx.fillStyle = '#c8b088'; ctx.beginPath(); ctx.ellipse(q.x, q.y, 0.4 * z, 0.15 * z, 0, 0, TAU); ctx.fill(); }
          }
          break;
        }
        case 'heal': {
          if (!D) break;
          for (let i = 0; i < 3; i++) { const q = spot(i, 3); D.sprite(ctx, 'flower', q.x, q.y, 1.2 * z, ((now * 0.8 + i * 0.33) % 1), { color: '#7aff9a', alpha: 0.7 * al }); }
          break;
        }
        case 'ice': {
          ctx.strokeStyle = 'rgba(220,245,255,0.7)'; ctx.lineWidth = 1.5;
          for (let i = 0; i < 5; i++) { const q = spot(i, 5), s = 0.35 * z; ctx.globalAlpha = al * 0.8; ctx.beginPath(); for (let j = 0; j < 3; j++) { const a = j * Math.PI / 3; ctx.moveTo(q.x - Math.cos(a) * s, q.y - Math.sin(a) * s); ctx.lineTo(q.x + Math.cos(a) * s, q.y + Math.sin(a) * s); } ctx.stroke(); }
          break;
        }
        case 'arena': case 'flag': case 'barrier': case 'field': case 'lotus': {
          ctx.globalAlpha = al * (0.55 + 0.25 * Math.sin(now * 4)); ctx.strokeStyle = zn.kind === 'arena' ? '#ff9a6a' : zn.kind === 'flag' ? '#ff6a6a' : zn.kind === 'field' ? '#4ae0d0' : zn.kind === 'lotus' ? '#8ac8ff' : '#bfffe0';
          ctx.lineWidth = Math.max(2, 0.14 * z); ctx.setLineDash([R * 0.12, R * 0.08]);
          ctx.beginPath(); ctx.arc(p.x, p.y, R, now * 0.8, now * 0.8 + TAU); ctx.stroke(); ctx.setLineDash([]);
          break;
        }
        default: break;
      }
      ctx.restore();
      void k;
    }
    // ---------- bo: ngoài vòng an toàn phủ bão tím, viền phát sáng; vòng kế tiếp nét đứt trắng ----------
    drawStorm(now, z) {
      if (this.cam.x > 800 || this.cam.y > 800) return;
      const ctx = this.ctx, zs = this.m.zoneSt; if (!zs) return;
      const cur = zs.cur, c = this.w2s(cur.x, cur.y), R = cur.r * z;
      ctx.save();
      ctx.beginPath(); ctx.rect(-10, -10, this.W + 20, this.H + 20); ctx.arc(c.x, c.y, Math.max(0, R), 0, TAU, true);
      ctx.fillStyle = zs.dps > 0 ? 'rgba(110,40,170,0.30)' : 'rgba(110,40,170,0.16)'; ctx.fill('evenodd');
      ctx.strokeStyle = 'rgba(200,120,255,0.85)'; ctx.lineWidth = 3 + Math.sin(now * 3) * 0.8;
      ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(0, R), 0, TAU); ctx.stroke();
      if (zs.next && (zs.next.r !== cur.r || zs.next.x !== cur.x)) {
        const n = this.w2s(zs.next.x, zs.next.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.arc(n.x, n.y, Math.max(1, zs.next.r * z), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
    }
    // ---------- sàn đấu Legacy Solo 1v1: hư không vũ trụ, đài nổi 3D, hoa văn chủ đề, cột trụ ----------
    drawSoloLegacyArena(now, z) {
      const ctx = this.ctx, m = this.m;
      const sa = m.soloArena;
      if (!sa) return;
      const theme = sa.theme || {};
      const c = theme.c || { top: '#7d7f86', top2: '#5f6168', rim: '#d4d6dc', side: '#33343a', bg1: '#1a1622', bg2: '#08060d', deco: 'tiles' };
      const W = this.W, H = this.H;

      // 1. Không gian hư không vũ trụ (Cosmic Void Backdrop)
      const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, Math.max(W, H) * 0.8);
      bgGrad.addColorStop(0, c.bg1 || '#181224');
      bgGrad.addColorStop(1, c.bg2 || '#06030a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Ngôi sao lấp lánh
      if (!this.stars) {
        this.stars = Array.from({ length: 80 }, () => ({
          x: Math.random(),
          y: Math.random(),
          s: 1 + Math.random() * 2,
          p: Math.random() * Math.PI * 2,
        }));
      }
      for (const st of this.stars) {
        const sx = (st.x * W + (sa.cx - this.cam.x) * 4) % W;
        const sy = (st.y * H + (sa.cy - this.cam.y) * 4) % H;
        const al = 0.25 + 0.35 * Math.sin(now * 2.5 + st.p);
        ctx.fillStyle = `rgba(255,255,255,${al})`;
        ctx.fillRect(sx >= 0 ? sx : sx + W, sy >= 0 ? sy : sy + H, st.s, st.s);
      }

      // 2. Tọa độ tâm và bán kính sàn đấu trên màn hình
      const cp = this.w2s(sa.cx, sa.cy);
      const R = sa.r * z;

      // 3. Bóng đổ phía dưới sàn (Drop Shadow)
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath();
      ctx.ellipse(cp.x, cp.y + 28, R * 1.04, R * 0.98, 0, 0, TAU);
      ctx.fill();

      // 4. Thân nổi 3D của sàn (3D Extruded Depth)
      for (let dy = 24; dy > 0; dy -= 2) {
        ctx.fillStyle = dy > 16 ? 'rgba(0,0,0,0.5)' : c.side;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y + dy, R, 0, TAU);
        ctx.fill();
      }

      // 5. Mặt sàn đấu (Top Platform Surface)
      const topGrad = ctx.createRadialGradient(cp.x, cp.y - R * 0.35, R * 0.1, cp.x, cp.y, R * 1.05);
      topGrad.addColorStop(0, c.top);
      topGrad.addColorStop(1, c.top2);
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, R, 0, TAU);
      ctx.fill();

      // 6. Chi tiết hoa văn mặt sàn theo chủ đề Legacy (Deco)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, R, 0, TAU);
      ctx.clip();

      if (c.deco === 'tiles') {
        // Gạch đá phiến
        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 1.5;
        const step = 3.6 * z;
        for (let yy = cp.y - R; yy < cp.y + R; yy += step) {
          ctx.beginPath(); ctx.moveTo(cp.x - R, yy); ctx.lineTo(cp.x + R, yy); ctx.stroke();
        }
        for (let xx = cp.x - R; xx < cp.x + R; xx += step) {
          ctx.beginPath(); ctx.moveTo(xx, cp.y - R); ctx.lineTo(xx, cp.y + R); ctx.stroke();
        }
      } else if (c.deco === 'planks') {
        // Ván gỗ đấu trường
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        const plankH = 2.4 * z;
        for (let yy = cp.y - R; yy < cp.y + R; yy += plankH) {
          ctx.beginPath(); ctx.moveTo(cp.x - R, yy); ctx.lineTo(cp.x + R, yy); ctx.stroke();
          const offset = ((yy / plankH) % 2) * (plankH * 2.5);
          for (let xx = cp.x - R + offset; xx < cp.x + R; xx += plankH * 5) {
            ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + plankH); ctx.stroke();
          }
        }
      } else if (c.deco === 'ice') {
        // Vết nứt băng pha lê
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 2;
        const angles = [0.4, 1.2, 2.1, 3.2, 4.3, 5.2];
        for (const a of angles) {
          const l1 = R * 0.35, l2 = R * 0.75;
          ctx.beginPath();
          ctx.moveTo(cp.x + Math.cos(a) * l1, cp.y + Math.sin(a) * l1);
          ctx.lineTo(cp.x + Math.cos(a + 0.15) * l2, cp.y + Math.sin(a + 0.15) * l2);
          ctx.lineTo(cp.x + Math.cos(a - 0.1) * (l2 + R * 0.2), cp.y + Math.sin(a - 0.1) * (l2 + R * 0.2));
          ctx.stroke();
        }
      } else if (c.deco === 'cracks') {
        // Khe nứt dung nham rực lửa
        ctx.strokeStyle = 'rgba(255,110,30,0.75)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff5a00';
        ctx.shadowBlur = 10;
        const angles = [0.6, 1.7, 2.8, 4.0, 5.0];
        for (const a of angles) {
          const l1 = R * 0.25, l2 = R * 0.8;
          ctx.beginPath();
          ctx.moveTo(cp.x + Math.cos(a) * l1, cp.y + Math.sin(a) * l1);
          ctx.lineTo(cp.x + Math.cos(a + 0.2) * (l1 + l2) * 0.6, cp.y + Math.sin(a + 0.2) * (l1 + l2) * 0.6);
          ctx.lineTo(cp.x + Math.cos(a - 0.1) * l2, cp.y + Math.sin(a - 0.1) * l2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else if (c.deco === 'runes') {
        // Phù văn Ngai Võ Thần
        ctx.strokeStyle = 'rgba(255,215,106,0.35)';
        ctx.lineWidth = 2.5;
        for (const rad of [R * 0.35, R * 0.65, R * 0.9]) {
          ctx.beginPath(); ctx.arc(cp.x, cp.y, rad, 0, TAU); ctx.stroke();
        }
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(cp.x + Math.cos(a) * (R * 0.2), cp.y + Math.sin(a) * (R * 0.2));
          ctx.lineTo(cp.x + Math.cos(a) * (R * 0.9), cp.y + Math.sin(a) * (R * 0.9));
          ctx.stroke();
        }
      }

      // Vòng tròn trung tâm
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 4.5 * z, 0, TAU);
      ctx.stroke();
      ctx.restore();

      // 7. Viền sáng bảo vệ sàn đấu (Glowing Rim)
      ctx.save();
      ctx.strokeStyle = c.rim;
      ctx.lineWidth = 4;
      ctx.shadowColor = c.rim;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, R, 0, TAU);
      ctx.stroke();
      ctx.restore();

      // 8. Các cột trụ chiến thuật (Tactical Pillars)
      for (const p of sa.worldPillars) {
        const pp = this.w2s(p.x, p.y);
        const pr = p.r * z;
        const pillarH = 1.6 * z;

        // Bóng đổ chân cột
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(pp.x + 4, pp.y + 6, pr * 1.15, pr * 0.75, 0, 0, TAU);
        ctx.fill();

        // Thân cột
        ctx.fillStyle = c.side;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, pr, 0, TAU);
        ctx.fill();
        ctx.fillRect(pp.x - pr, pp.y - pillarH, pr * 2, pillarH);

        // Nắp đỉnh cột
        const g2 = ctx.createRadialGradient(pp.x - pr * 0.25, pp.y - pillarH - pr * 0.25, 2, pp.x, pp.y - pillarH, pr);
        g2.addColorStop(0, c.rim);
        g2.addColorStop(1, c.top2);
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y - pillarH, pr, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    // ---------- không gian quyết đấu riêng (Pocket Dimension 1v1) ----------
    drawDuelRealmBackdrop(now, z) {
      const ctx = this.ctx, W = this.W, H = this.H;
      const realm = C.DUEL_REALM || { cx: 1200, cy: 1200, r: 24, name: 'Không Gian Quyết Đấu' };
      // 1. Vũ trụ huyền ảo sâu thẳm
      const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, Math.max(W, H) * 0.85);
      bgGrad.addColorStop(0, '#160e29');
      bgGrad.addColorStop(0.6, '#090714');
      bgGrad.addColorStop(1, '#030206');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Bụi sao tinh tú
      if (!this.realmStars) {
        this.realmStars = Array.from({ length: 90 }, () => ({
          x: Math.random(),
          y: Math.random(),
          s: 1 + Math.random() * 2.2,
          p: Math.random() * Math.PI * 2,
        }));
      }
      for (const st of this.realmStars) {
        const sx = (st.x * W + (realm.cx - this.cam.x) * 3) % W;
        const sy = (st.y * H + (realm.cy - this.cam.y) * 3) % H;
        const al = 0.25 + 0.45 * Math.sin(now * 2.2 + st.p);
        ctx.fillStyle = `rgba(220,200,255,${al})`;
        ctx.fillRect(sx >= 0 ? sx : sx + W, sy >= 0 ? sy : sy + H, st.s, st.s);
      }

      // 2. Tọa độ và bán kính sàn đấu
      const cp = this.w2s(realm.cx, realm.cy);
      const R = realm.r * z;

      // 3. Bóng đổ phía dưới sàn (Drop Shadow)
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.ellipse(cp.x, cp.y + 30, R * 1.05, R * 0.96, 0, 0, TAU);
      ctx.fill();

      // 4. Thân nổi 3D của sàn (3D Extruded Depth)
      for (let dy = 22; dy > 0; dy -= 2) {
        ctx.fillStyle = dy > 14 ? 'rgba(0,0,0,0.6)' : '#231d36';
        ctx.beginPath();
        ctx.arc(cp.x, cp.y + dy, R, 0, TAU);
        ctx.fill();
      }

      // 5. Mặt sàn đá phù văn vũ trụ
      const topGrad = ctx.createRadialGradient(cp.x, cp.y - R * 0.2, R * 0.05, cp.x, cp.y, R * 1.02);
      topGrad.addColorStop(0, '#2e274a');
      topGrad.addColorStop(0.7, '#1b162f');
      topGrad.addColorStop(1, '#100c1e');
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, R, 0, TAU);
      ctx.fill();

      // 6. Phù văn và họa tiết mặt sàn
      ctx.save();
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, R, 0, TAU);
      ctx.clip();

      // Vòng tròn đồng tâm cổ ngữ
      ctx.strokeStyle = 'rgba(255, 210, 74, 0.22)';
      ctx.lineWidth = 2;
      for (const rad of [R * 0.32, R * 0.62, R * 0.88]) {
        ctx.beginPath(); ctx.arc(cp.x, cp.y, rad, 0, TAU); ctx.stroke();
      }

      // Các tia trận đồ bát quái / sao 8 cánh
      ctx.strokeStyle = 'rgba(180, 130, 255, 0.25)';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + now * 0.04;
        ctx.beginPath();
        ctx.moveTo(cp.x + Math.cos(a) * (R * 0.15), cp.y + Math.sin(a) * (R * 0.15));
        ctx.lineTo(cp.x + Math.cos(a) * (R * 0.88), cp.y + Math.sin(a) * (R * 0.88));
        ctx.stroke();
      }

      // Vòng tròn trung tâm
      ctx.strokeStyle = 'rgba(255, 210, 74, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 4 * z, 0, TAU);
      ctx.stroke();
      ctx.restore();

      // 7. Viền sáng bảo vệ sàn đấu (Glowing Rim)
      ctx.save();
      ctx.strokeStyle = '#ffd24a';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffd24a';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, R, 0, TAU);
      ctx.stroke();
      ctx.restore();

      // 8. 4 Cột ngọc tinh thể lơ lửng ở 4 hướng
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const px = cp.x + Math.cos(ang) * (R * 1.08);
        const py = cp.y + Math.sin(ang) * (R * 1.08) + Math.sin(now * 3 + i) * 4;
        const pr = Math.max(5, 1.2 * z);
        const cryGrad = ctx.createRadialGradient(px, py - 3, 1, px, py, pr * 1.5);
        cryGrad.addColorStop(0, '#ffffff');
        cryGrad.addColorStop(0.4, '#ffd24a');
        cryGrad.addColorStop(1, '#9333ea');
        ctx.fillStyle = cryGrad;
        ctx.beginPath();
        ctx.moveTo(px, py - pr * 1.8);
        ctx.lineTo(px + pr, py);
        ctx.lineTo(px, py + pr * 1.8);
        ctx.lineTo(px - pr, py);
        ctx.closePath();
        ctx.fill();
      }
    }
    // ---------- đấu trường: Thương Nhân, thính, đồng hồ bãi quái / boss ----------
    drawArena(now, z) {
      const ctx = this.ctx, m = this.m, off = (p, r) => p.x < -r || p.y < -r || p.x > this.W + r || p.y > this.H + r;
      ctx.textAlign = 'center';
      const far = z < 6;   // thu nhỏ xem toàn cảnh: bớt chữ cho đỡ rối
      for (const t of MAP.merchants) {
        const p = this.w2s(t.x, t.y - 4.2); if (off(p, 60)) continue;
        if (far) { ctx.font = '14px sans-serif'; ctx.fillText('🛒', p.x, p.y + 4.2 * z); continue; }
        ctx.font = 'bold 11px system-ui,sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeText('🛒 Thương Nhân', p.x, p.y); ctx.fillStyle = '#ffe9b0'; ctx.fillText('🛒 Thương Nhân', p.x, p.y);
      }
      // thính: báo trước (vòng đếm ngược trên mặt đất) → rơi (thùng phát sáng) → đang mở (vòng tiến độ)
      for (const d of m.drops || []) {
        if (!d.warned || d.taken) continue;
        const p = this.w2s(d.x, d.y); if (off(p, 80)) continue;
        const R = C.DROP.r * z;
        if (!d.landed) {
          const left = d.at - now, k = 1 - Math.max(0, Math.min(1, left / C.DROP.warn));
          ctx.strokeStyle = 'rgba(255,210,74,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
          ctx.beginPath(); ctx.arc(p.x, p.y, R * 1.6, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,210,74,0.18)'; ctx.beginPath(); ctx.arc(p.x, p.y, R * 1.6 * k, 0, TAU); ctx.fill();
          // bóng thùng đang rơi
          const h = (1 - k) * 6 * z; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, R * 0.5 * (0.4 + 0.6 * k), R * 0.25 * (0.4 + 0.6 * k), 0, 0, TAU); ctx.fill();
          if (left < 6) this.drawCrate(p.x, p.y - h, z, now);
          ctx.font = 'bold 12px system-ui,sans-serif'; ctx.fillStyle = '#ffe07a'; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
          const txt = '📦 ' + Math.ceil(left) + 's'; ctx.strokeText(txt, p.x, p.y + R * 1.6 + 14); ctx.fillText(txt, p.x, p.y + R * 1.6 + 14);
        } else {
          const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, R * 2.2); glow.addColorStop(0, 'rgba(255,220,100,0.55)'); glow.addColorStop(1, 'rgba(255,220,100,0)');
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, R * 2.2, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(255,220,100,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.stroke();
          this.drawCrate(p.x, p.y, z, now);
          if (d.openT > 0 && d.openBy) {
            ctx.strokeStyle = TEAM[d.openBy.team]; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(p.x, p.y, R * 1.25, -Math.PI / 2, -Math.PI / 2 + TAU * d.openT / C.DROP.open); ctx.stroke();
          }
        }
      }
      // bãi quái đã bị dọn: giờ hồi
      ctx.font = 'bold 10px system-ui,sans-serif';
      for (const c of far ? [] : m.camps || []) {
        if (c.unit && c.unit.alive) continue;
        const left = c.nextAt - now; if (left <= 0) continue;
        const p = this.w2s(c.x, c.y); if (off(p, 30)) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(p.x - 15, p.y - 7, 30, 13);
        ctx.fillStyle = '#e8dcc0'; ctx.fillText(G.U.mmss(left), p.x, p.y + 3);
      }
      this.drawDuel(now, z, off);
      this.drawChests(now, z, off, far);
      this.drawSoulOrbs(now, z, off);
      // tên 6 vùng khi thu nhỏ xem toàn cảnh
      if (z < 9 && MAP.REGIONS) {
        ctx.font = `bold ${Math.round(Math.max(12, Math.min(22, z * 2.6)))}px system-ui,sans-serif`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.globalAlpha = Math.min(1, (9 - z) / 3);
        for (const R of MAP.REGIONS) {
          const w = R.id === (MAP.CENTER != null ? MAP.CENTER : 5) ? { x: MAP.center.x, y: MAP.center.y + 42 * (MAP.K || 1) } : MAP.polar(R.special ? 178 : 200, MAP.SEC(R.id) + (R.special ? (MAP.HALF || 36) * 0.42 : 0)), p = this.w2s(w.x, w.y);
          if (off(p, 120)) continue;
          const t = R.icon + ' ' + R.name; ctx.strokeText(t, p.x, p.y); ctx.fillStyle = 'rgba(255,250,235,0.92)'; ctx.fillText(t, p.x, p.y);
        }
        ctx.globalAlpha = 1;
      }
      // GĐ8: 4 ổ boss — tên ổ + boss sắp ra + đếm ngược
      for (const S of m.lairSt || []) {
        if (S.unit && S.unit.alive) continue;
        const L = S.lair, P = G.LAIR_PLAN && G.LAIR_PLAN[L.id], id = S.forceId || (P && P.list[S.i % P.list.length]), D = id && G.BOSSES[id];
        const p = this.w2s(L.x, L.y); if (off(p, 80)) continue;
        const left = S.nextAt - now, t = (D ? D.icon + (far ? '' : ' ' + D.name) : '👑' + (far ? '' : ' Boss')) + (left > 0 ? ' ' + G.U.mmss(left) : '');
        ctx.font = `bold ${far ? 10 : 12}px system-ui,sans-serif`; const tw = ctx.measureText(t).width + 10, ty = far ? p.y + 14 : p.y;
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(p.x - tw / 2, ty - 9, tw, far ? 14 : 17); ctx.fillStyle = D ? D.color : '#ffb090'; ctx.textAlign = 'center'; ctx.fillText(t, p.x, ty + (far ? 2 : 4));
        if (z >= 6) { ctx.font = '10px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,240,220,0.75)'; ctx.fillText((L.icon || '') + ' ' + (L.name || ''), p.x, p.y + 18); }
      }
    }
    // cổng quyết đấu: cổng đá phát sáng (đang mở: vòng ghi danh + đếm ngược; người đã ghi danh) → vòng đấu vàng khi hai người vào
    drawDuel(now, z, off) {
      const ctx = this.ctx, g = this.m.duelSt && this.m.duelSt.gate;
      if (!g) return;
      const D = C.DUEL;

      // Nếu đang quyết đấu trong không gian riêng: vẽ cổng không gian trên bản đồ chính nếu camera đang ở bản đồ chính
      if (g.state === 'fight' && g.realm && g.gateOrig) {
        const gp = this.w2s(g.gateOrig.x, g.gateOrig.y);
        if (!off(gp, 90)) {
          ctx.save();
          const pr = 4.5 * z;
          const vg = ctx.createRadialGradient(gp.x, gp.y, 2, gp.x, gp.y, pr * 1.8);
          vg.addColorStop(0, 'rgba(255, 210, 74, 0.85)');
          vg.addColorStop(0.5, 'rgba(168, 85, 247, 0.5)');
          vg.addColorStop(1, 'rgba(100, 30, 200, 0)');
          ctx.fillStyle = vg;
          ctx.beginPath(); ctx.arc(gp.x, gp.y, pr * 1.8, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(gp.x, gp.y, pr, 0, TAU); ctx.stroke();
          ctx.font = 'bold 11px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          const tPort = '🌌 Cổng Không Gian (Đang solo 1v1)';
          ctx.strokeText(tPort, gp.x, gp.y - pr - 8); ctx.fillStyle = '#ffd24a'; ctx.fillText(tPort, gp.x, gp.y - pr - 8);
          ctx.restore();
        }
      }

      const p = this.w2s(g.x, g.y);
      const curR = g.realm ? (C.DUEL_REALM ? C.DUEL_REALM.r : 24) : D.ring;
      if (off(p, curR * z + 80)) return;
      ctx.save();
      if (g.state === 'open') {
        const R = D.r * z, pulse = 0.5 + 0.5 * Math.sin(now * 3);
        const gl = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, R * 2.4); gl.addColorStop(0, 'rgba(255,200,80,' + (0.35 + 0.2 * pulse) + ')'); gl.addColorStop(1, 'rgba(255,160,40,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, R * 2.4, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,214,110,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([7, 5]); ctx.lineDashOffset = -now * 12;
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        // hai cột đá + vòm cổng
        const w = Math.max(10, 1.3 * z), h = Math.max(16, 2.2 * z);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(p.x - w - 3, p.y - 2, w * 2 + 8, 6);
        ctx.fillStyle = '#8a8070'; ctx.strokeStyle = '#2a261e'; ctx.lineWidth = 1.5;
        for (const sx of [-1, 1]) { ctx.fillRect(p.x + sx * w - w * 0.22, p.y - h, w * 0.44, h); ctx.strokeRect(p.x + sx * w - w * 0.22, p.y - h, w * 0.44, h); }
        ctx.lineWidth = Math.max(3, w * 0.35); ctx.strokeStyle = '#a89a80'; ctx.beginPath(); ctx.arc(p.x, p.y - h, w, Math.PI, TAU); ctx.stroke();
        const vg = ctx.createLinearGradient(p.x, p.y - h - w, p.x, p.y); vg.addColorStop(0, 'rgba(255,240,180,0.9)'); vg.addColorStop(1, 'rgba(255,150,40,0.5)');
        ctx.fillStyle = vg; ctx.globalAlpha = 0.55 + 0.35 * pulse; ctx.beginPath(); ctx.moveTo(p.x - w * 0.78, p.y); ctx.lineTo(p.x - w * 0.78, p.y - h); ctx.arc(p.x, p.y - h, w * 0.78, Math.PI, TAU); ctx.lineTo(p.x + w * 0.78, p.y); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        // tiến độ ghi danh của từng tướng đứng cạnh cổng
        for (const h2 of this.m.heroes) {
          const v = g.prog.get(h2.id) || 0; if (!h2.alive || v <= 0) continue;
          const q = this.w2s(h2.x, h2.y); ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(q.x, q.y, h2.r * z + 9, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, v / D.join)); ctx.stroke();
        }
        ctx.font = 'bold 12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        const t1 = '⚔ Cổng Quyết Đấu ' + G.U.mmss(Math.max(0, g.until - this.m.time));
        ctx.strokeText(t1, p.x, p.y - h - w - 8); ctx.fillStyle = '#ffe07a'; ctx.fillText(t1, p.x, p.y - h - w - 8);
        if (g.a) { const t2 = 'Đang chờ: ' + (g.a.hero ? g.a.hero.name : ''); ctx.font = '11px system-ui,sans-serif'; ctx.strokeText(t2, p.x, p.y + 18); ctx.fillStyle = TEAM[g.a.team] || '#fff'; ctx.fillText(t2, p.x, p.y + 18); }
      } else if (g.state === 'fight') {
        if (g.realm) {
          const R = curR * z;
          const dur = this.m.time - g.t0;
          const maxD = g.maxDur || 55;
          const rem = Math.max(0, maxD - dur);
          const late = rem < 12;

          ctx.fillStyle = late ? 'rgba(255,60,40,0.12)' : 'rgba(168,85,247,0.08)';
          ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.fill();

          ctx.strokeStyle = late ? 'rgba(255,80,50,0.95)' : 'rgba(255,214,110,0.95)';
          ctx.lineWidth = 4;
          ctx.shadowColor = late ? '#ff4a2a' : '#ffd24a'; ctx.shadowBlur = 16;
          ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0;

          // ngọn lửa ma thuật quanh vòng
          for (let i = 0; i < 20; i++) {
            const a = i / 20 * TAU + now * 0.45;
            const q = { x: p.x + Math.cos(a) * R, y: p.y + Math.sin(a) * R };
            const f = 0.6 + 0.4 * Math.sin(now * 10 + i);
            const fg = ctx.createRadialGradient(q.x, q.y - 3, 0, q.x, q.y, 10 * f);
            fg.addColorStop(0, late ? 'rgba(255,120,80,0.95)' : 'rgba(255,235,150,0.95)');
            fg.addColorStop(0.5, late ? 'rgba(255,40,20,0.6)' : 'rgba(168,85,247,0.6)');
            fg.addColorStop(1, 'rgba(120,30,200,0)');
            ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(q.x, q.y, 10 * f, 0, TAU); ctx.fill();
          }

          // Tiêu đề & thời gian
          ctx.font = 'bold 14px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
          const nameA = g.a?.hero?.name || 'Thí Sinh A';
          const nameB = g.b?.hero?.name || 'Thí Sinh B';
          const headerTxt = '🌌 KHÔNG GIAN QUYẾT ĐẤU (SOLO 1v1)';
          ctx.strokeText(headerTxt, p.x, p.y - R - 26);
          ctx.fillStyle = '#e9d5ff'; ctx.fillText(headerTxt, p.x, p.y - R - 26);

          ctx.font = 'bold 13px system-ui,sans-serif';
          const subTxt = `⚔ ${nameA} vs ${nameB} · ⏱ Còn: ${G.U.mmss(rem)}`;
          ctx.strokeText(subTxt, p.x, p.y - R - 8);
          ctx.fillStyle = late ? '#ff7a7a' : '#ffe07a';
          ctx.fillText(subTxt, p.x, p.y - R - 8);

          if (late) {
            ctx.font = 'bold 11px system-ui,sans-serif';
            ctx.strokeText('⚠️ Sắp hết giờ quyết đấu (Hòa nếu không ai tử trận)!', p.x, p.y - R + 12);
            ctx.fillStyle = '#ff6a6a';
            ctx.fillText('⚠️ Sắp hết giờ quyết đấu (Hòa nếu không ai tử trận)!', p.x, p.y - R + 12);
          }
        } else {
          const R = D.ring * z, late = this.m.time - g.t0 > D.max;
          ctx.fillStyle = late ? 'rgba(255,60,40,0.10)' : 'rgba(255,210,90,0.07)'; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.fill();
          ctx.strokeStyle = late ? 'rgba(255,80,50,0.95)' : 'rgba(255,214,110,0.95)'; ctx.lineWidth = 4;
          ctx.shadowColor = late ? '#ff4a2a' : '#ffc24a'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0;
          // cột lửa quanh vòng
          for (let i = 0; i < 16; i++) {
            const a = i / 16 * TAU + now * 0.4, q = { x: p.x + Math.cos(a) * R, y: p.y + Math.sin(a) * R }, f = 0.6 + 0.4 * Math.sin(now * 9 + i);
            const fg = ctx.createRadialGradient(q.x, q.y - 4, 0, q.x, q.y, 9 * f); fg.addColorStop(0, 'rgba(255,240,170,0.9)'); fg.addColorStop(1, 'rgba(255,120,30,0)');
            ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(q.x, q.y, 9 * f, 0, TAU); ctx.fill();
          }
          ctx.font = 'bold 13px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          const tt = '⚔ ' + (g.a.hero ? g.a.hero.name : '') + ' vs ' + (g.b.hero ? g.b.hero.name : '') + ' · ' + G.U.mmss(this.m.time - g.t0);
          ctx.strokeText(tt, p.x, p.y - R - 10); ctx.fillStyle = '#ffe07a'; ctx.fillText(tt, p.x, p.y - R - 10);
        }
      }
      ctx.restore();
    }
    // quạ cơ giới Oca: bay cao (bóng dưới đất lệch xuống), vỗ cánh, mắt xanh phát sáng; vòng tầm nhìn 8 đv mờ
    drawCrow(u, p, z, now) {
      const ctx = this.ctx, s = Math.max(9, u.r * z * 1.25), lift = Math.max(14, 1.3 * z), flap = Math.sin(now * 14 + u.id), ang = this.faceAng(u, now);
      // vòng tầm nhìn của quạ (trọng tài thấy)
      if (u.visionR) { ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#8ad0ff'; ctx.lineWidth = 1; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.arc(p.x, p.y, u.visionR * z, 0, TAU); ctx.stroke(); ctx.restore(); }
      // bóng dưới đất
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, s * (0.9 + 0.25 * Math.abs(flap)), s * 0.35, 0, 0, TAU); ctx.fill(); ctx.restore();
      const y = p.y - lift + Math.sin(now * 3 + u.id) * 2;
      ctx.save(); ctx.translate(p.x, y); ctx.rotate(ang);
      const hurt = now - u.lastDmgT < 0.1;
      // cánh (hai bên, vỗ lên xuống)
      for (const sd of [-1, 1]) {
        const wy = sd * s * (0.9 + 0.55 * flap), tip = sd * s * (1.6 + 0.5 * flap);
        ctx.fillStyle = hurt ? '#ffb0b0' : '#1c222e'; ctx.strokeStyle = '#5a6a88'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(s * 0.35, 0); ctx.quadraticCurveTo(s * 0.1, wy, -s * 0.45, tip); ctx.lineTo(-s * 0.2, wy * 0.45); ctx.lineTo(-s * 0.55, tip * 0.75); ctx.lineTo(-s * 0.5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(120,200,255,0.55)'; ctx.beginPath(); ctx.moveTo(s * 0.2, 0); ctx.lineTo(-s * 0.3, wy * 0.8); ctx.stroke();   // khớp kim loại
      }
      // thân + đuôi + mỏ
      ctx.fillStyle = hurt ? '#ffd0d0' : '#2a3140'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.34, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1f2a'; ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(-s * 1.05, -s * 0.28); ctx.lineTo(-s * 1.0, s * 0.28); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.moveTo(s * 0.6, -s * 0.1); ctx.lineTo(s * 0.95, 0); ctx.lineTo(s * 0.6, s * 0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7ae8ff'; ctx.shadowColor = '#7ae8ff'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(s * 0.38, -s * 0.12, Math.max(1.4, s * 0.09), 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      ctx.restore();
      // thanh máu nhỏ + tên
      const w = Math.max(22, s * 2.2);
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(p.x - w / 2 - 1, y - s - 9, w + 2, 5);
      ctx.fillStyle = TEAM[u.team]; ctx.fillRect(p.x - w / 2, y - s - 8, w * u.hpPct, 3);
      if (z >= 6) { ctx.font = 'bold 10px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText('🐦 Oca', p.x, y - s - 12); ctx.fillStyle = '#cfe0ff'; ctx.fillText('🐦 Oca', p.x, y - s - 12); }
    }
    // mảnh hồn rơi trên đất: viên pha lê màu theo bậc, lơ lửng phát sáng; lúc rơi văng từ xác ra; sắp hết hạn thì nhấp nháy
    drawSoulOrbs(now, z, off) {
      const ctx = this.ctx, O = this.m.soulOrbs; if (!O || !O.length) return;
      for (const o of O) {
        const k = Math.min(1, (now - o.t0) / 0.45), e = 1 - Math.pow(1 - k, 2);
        const wx = o.ox + (o.x - o.ox) * e, wy = o.oy + (o.y - o.oy) * e;
        const p = this.w2s(wx, wy); if (off(p, 40)) continue;
        const left = o.until - now; if (left < 10 && ((now * 4) | 0) % 2) continue;
        const T = G.SOUL_TIER[o.tier], R = Math.max(5, (0.32 + 0.05 * o.tier) * z), hop = (k < 1 ? Math.sin(k * Math.PI) * 1.4 * z : 0) + Math.sin(now * 3 + o.id) * 0.12 * z;
        ctx.save();
        const gl = ctx.createRadialGradient(p.x, p.y - hop, 1, p.x, p.y - hop, R * 2.6); gl.addColorStop(0, T.color); gl.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.55; ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y - hop, R * 2.6, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(p.x, p.y + R * 0.7, R * 0.8, R * 0.3, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1; ctx.translate(p.x, p.y - hop); ctx.rotate(Math.sin(now * 1.5 + o.id) * 0.25);
        ctx.fillStyle = T.color; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, -R); ctx.lineTo(R * 0.62, 0); ctx.lineTo(0, R); ctx.lineTo(-R * 0.62, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.moveTo(0, -R * 0.75); ctx.lineTo(R * 0.25, -R * 0.1); ctx.lineTo(-R * 0.2, -R * 0.2); ctx.closePath(); ctx.fill();
        ctx.restore();
        if (z >= 8) { const SD = o.sh && G.SHARDS[o.sh.id], PK = SD && SD.perk && G.SOUL_PERK[SD.perk], lb = G.shardIcon(o.sh) + ' ' + (PK ? PK.icon + ' ' : '') + (o.tier >= 3 ? T.name : ''); ctx.font = 'bold 10px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(lb, p.x, p.y - hop - R - 5); ctx.fillStyle = T.color; ctx.fillText(lb, p.x, p.y - hop - R - 5); }
      }
    }
    // GĐ7: rương đồ (rương gỗ viền vàng, nắp hé sáng) + bẫy kẹp (người xem thấy mờ mờ)
    drawChests(now, z, off, far) {
      const ctx = this.ctx, m = this.m;
      for (const c of m.chests || []) {
        if (c.opened) continue;
        const p = this.w2s(c.x, c.y); if (off(p, 30)) continue;
        if (far) { ctx.fillStyle = '#ffcf5a'; ctx.strokeStyle = '#3a2408'; ctx.lineWidth = 1; ctx.fillRect(p.x - 3, p.y - 2.5, 6, 5); ctx.strokeRect(p.x - 3, p.y - 2.5, 6, 5); continue; }
        const s = Math.max(9, 1.15 * z), h = s * 0.7;
        ctx.save();
        const gl = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, s * 1.4); gl.addColorStop(0, 'rgba(255,214,90,0.45)'); gl.addColorStop(1, 'rgba(255,214,90,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, s * 1.4, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + h * 0.55, s * 0.6, h * 0.25, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8a5424'; ctx.strokeStyle = '#3a2008'; ctx.lineWidth = 1.4;
        ctx.fillRect(p.x - s / 2, p.y - h * 0.15, s, h * 0.65); ctx.strokeRect(p.x - s / 2, p.y - h * 0.15, s, h * 0.65);
        ctx.fillStyle = '#a8682e'; ctx.beginPath(); ctx.moveTo(p.x - s / 2, p.y - h * 0.15); ctx.quadraticCurveTo(p.x, p.y - h * 0.75, p.x + s / 2, p.y - h * 0.15); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = Math.max(1.2, s * 0.09);
        ctx.beginPath(); ctx.moveTo(p.x - s / 2, p.y - h * 0.15); ctx.lineTo(p.x + s / 2, p.y - h * 0.15); ctx.moveTo(p.x - s * 0.28, p.y - h * 0.5); ctx.lineTo(p.x - s * 0.28, p.y + h * 0.5); ctx.moveTo(p.x + s * 0.28, p.y - h * 0.5); ctx.lineTo(p.x + s * 0.28, p.y + h * 0.5); ctx.stroke();
        ctx.fillStyle = '#ffe9a0'; ctx.fillRect(p.x - s * 0.08, p.y - h * 0.22, s * 0.16, h * 0.2);
        if (((now * 2 + c.id) | 0) % 4 === 0) { ctx.globalAlpha = 0.8; ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(p.x + s * 0.35, p.y - h * 0.6, Math.max(1.2, s * 0.07), 0, TAU); ctx.fill(); }
        ctx.restore();
      }
      // GĐ7: cánh cối xay gió (quay chậm) + thùng thuốc nổ (đang cháy ngòi thì nhấp nháy, tóe lửa)
      for (const st of MAP.structs || []) if (st.type === 'mill') {
        const p = this.w2s(st.x, st.y); if (off(p, 8 * z)) continue;
        const a0 = st.a0 + now * 0.6, L = 4.2 * z;
        ctx.save(); ctx.translate(p.x, p.y); ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 2; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(2, 0.45 * z); ctx.beginPath(); ctx.moveTo(4, 6); ctx.lineTo(Math.cos(a) * L + 4, Math.sin(a) * L + 6); ctx.stroke(); }
        for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 2, c = Math.cos(a), sn = Math.sin(a); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = Math.max(1.5, 0.18 * z); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(c * L, sn * L); ctx.stroke(); ctx.fillStyle = 'rgba(240,232,210,0.92)'; ctx.beginPath(); ctx.moveTo(c * L * 0.25, sn * L * 0.25); ctx.lineTo(c * L, sn * L); ctx.lineTo(c * L - sn * 0.7 * z, sn * L + c * 0.7 * z); ctx.lineTo(c * L * 0.25 - sn * 0.7 * z, sn * L * 0.25 + c * 0.7 * z); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(0, 0, Math.max(2, 0.3 * z), 0, TAU); ctx.fill();
        ctx.restore();
      }
      for (const b of m.barrels || []) {
        if (!b.alive) continue;
        const p = this.w2s(b.x, b.y); if (off(p, 20)) continue;
        if (far) { ctx.fillStyle = b.toxic ? '#9ad040' : '#d0402a'; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); continue; }
        const r = Math.max(4, 0.55 * z), lit = b.fuse && ((now * 10) | 0) % 2;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(p.x + r * 0.3, p.y + r * 0.6, r, r * 0.45, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = lit ? '#ffd27a' : b.toxic ? '#6a9a2a' : '#b8321e'; ctx.strokeStyle = b.toxic ? '#1e2e08' : '#3a0e06'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = Math.max(1, r * 0.16); ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.72, 0, TAU); ctx.stroke();
        ctx.fillStyle = b.toxic ? '#e8ff70' : '#ffd24a'; ctx.font = `bold ${Math.round(r * 1.1)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.toxic ? '☣' : '!', p.x, p.y + 1); ctx.textBaseline = 'alphabetic';
        if (b.fuse) { ctx.fillStyle = '#fff2a0'; for (let i = 0; i < 3; i++) { const a = now * 20 + i * 2.1; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * r * 0.6, p.y - r - 2 + Math.sin(a) * 2, 1.5, 0, TAU); ctx.fill(); } }
        ctx.restore();
      }
      if (far) return;
      // GĐ8: khói ống xả độc (lờ mờ liên tục) + bánh răng Roxie rơi trên đất
      for (const v of MAP.vents || []) {
        const p = this.w2s(v.x, v.y); if (off(p, 40)) continue;
        ctx.save(); ctx.globalAlpha = 0.35;
        for (let i = 0; i < 3; i++) { const t = (now * 0.5 + i / 3) % 1; ctx.fillStyle = `rgba(160,220,60,${0.5 * (1 - t)})`; ctx.beginPath(); ctx.arc(p.x + Math.sin(now + i * 2) * 0.4 * z, p.y - t * 2.2 * z, (0.5 + t * 0.9) * z, 0, TAU); ctx.fill(); }
        ctx.restore();
      }
      for (const g of m.gearDrops || []) {
        const p = this.w2s(g.x, g.y); if (off(p, 20)) continue;
        const r = Math.max(3.5, 0.32 * z), a0 = now * 2 + g.x;
        ctx.save(); ctx.translate(p.x, p.y + Math.sin(now * 4 + g.y) * 1.5); ctx.rotate(a0);
        ctx.fillStyle = '#ffb030'; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = i % 2 ? r : r * 1.3; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#6a3a08'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#6a3a08'; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.fill();
        ctx.restore();
      }
      // GĐ7b: liên minh tạm thời (nét đứt xanh + 🤝) và vệ sĩ → người được bảo vệ (nét chấm mờ)
      const link = (a, b, col, dash, icon) => {
        if (!a.alive || !b.alive) return; const pa = this.w2s(a.x, a.y), pb = this.w2s(b.x, b.y); if (off(pa, 200) && off(pb, 200)) return;
        ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); ctx.restore();
        if (icon) { ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(icon, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2); }
      };
      for (const t of m.truces || []) if (!t.broken && t.until > m.time && G.M.dist(t.a, t.b) < 30) link(t.a, t.b, '#9fd8ff', [6, 4], '🤝');
      for (const h of m.heroes) if (h.persId === 'vesi' && h.ai && h.ai.ward && G.M.dist(h, h.ai.ward) < 35) link(h, h.ai.ward, '#e0d8a0', [2, 5], null);
      for (const t of m.traps || []) {
        const p = this.w2s(t.x, t.y); if (off(p, 20)) continue;
        const r = Math.max(4, t.r * z * 0.8), col = t.ice ? '#60c0ff' : (t.owner && t.owner.hero ? t.owner.hero.color : '#c8a060');
        ctx.save(); ctx.globalAlpha = 0.65; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = t.ice ? '#a0e8ff' : '#9a9a9a'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * r * 0.35, p.y + Math.sin(a) * r * 0.35); ctx.lineTo(p.x + Math.cos(a) * r * 0.8, p.y + Math.sin(a) * r * 0.8); ctx.stroke(); }
        if (t.ice) { ctx.font = `${Math.round(r * 0.9)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('❄', p.x, p.y); }
        ctx.restore();
      }
      for (const d of m.itemDrops || []) {
        const p = this.w2s(d.x, d.y); if (off(p, 20)) continue;
        const itemDef = G.CONSUMABLES[d.id];
        ctx.save();
        ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(itemDef ? itemDef.icon : '📦', p.x, p.y + Math.sin(now * 3) * 2);
        ctx.restore();
      }
      for (const w of m.wards || []) {
        if (w.until <= m.time) continue;
        const p = this.w2s(w.x, w.y); if (off(p, 40)) continue;
        ctx.save();
        ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(w.scout ? '📡' : '👁️', p.x, p.y);
        if (w.scout) {
          ctx.strokeStyle = 'rgba(100, 210, 255, 0.25)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(p.x, p.y, (w.r || 16) * z, 0, TAU); ctx.stroke();
        }
        ctx.restore();
      }
    }
    drawCrate(x, y, z, now) {
      const ctx = this.ctx, s = Math.max(8, 0.9 * z), bob = Math.sin(now * 3) * 0.06 * z;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - s * 0.5 + 2, y - s * 0.5 + 3, s, s);
      ctx.fillStyle = '#b07a3a'; ctx.strokeStyle = '#4a2e10'; ctx.lineWidth = 1.5;
      ctx.fillRect(x - s * 0.5, y - s * 0.5 + bob, s, s); ctx.strokeRect(x - s * 0.5, y - s * 0.5 + bob, s, s);
      ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = Math.max(1.5, s * 0.12);
      ctx.beginPath(); ctx.moveTo(x - s * 0.5, y + bob); ctx.lineTo(x + s * 0.5, y + bob); ctx.moveTo(x, y - s * 0.5 + bob); ctx.lineTo(x, y + s * 0.5 + bob); ctx.stroke();
    }
    drawMonster(u, p, z, now) {
      if (u.bossId) return this.drawBoss(u, p, z, now);
      const ctx = this.ctx, r = Math.max(5, u.r * z), sub = u.sub;
      const PAL = { red: ['#a02a1e', '#ff7a5a'], blue: ['#1e4aa0', '#7ab0ff'], gold: ['#8a6a10', '#ffd24a'], small: ['#5a5a50', '#b8b8a0'], scout: ['#2a7a8a', '#9ff0ff'],
        hunter: ['#6a3a1a', '#e09a5a'], caller: ['#4a2a6a', '#c09aff'], crystal: ['#2a6a7a', '#a0ffff'], necro: ['#2a1a3a', '#b080ff'], doom: ['#3a0a0a', '#ff4a2a'], ghost: ['#4a4a6a', '#d0d0ff'] };
      // GĐ8: quái nhỏ đổi dáng theo vùng (skin), quái tuần tra quanh ổ boss có màu riêng
      const skinCol = (u.skin && u.skin.color) || (u.guard && u.color) || null;
      let [dark, light] = PAL[sub] || ['#555', '#ccc'];
      if (skinCol) { light = skinCol; dark = shade(skinCol, 0.45); }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + r * 0.6, r * 1.05, r * 0.45, 0, 0, TAU); ctx.fill();
      const hurt = now - u.lastDmgT < 0.08;
      // nhịp vồ khi đánh (thân nhô về phía mục tiêu)
      const f = u.attackTarget ? G.M.dir(u, u.attackTarget) : { x: u.fx || 0, y: u.fy || 1 };
      const lunge = u.attackTarget && now - (u.lastAtkT || -9) < 0.2 ? Math.sin((now - u.lastAtkT) / 0.2 * Math.PI) * r * 0.35 : 0;
      const bx = p.x + f.x * lunge, by = p.y + f.y * lunge;
      ctx.fillStyle = hurt ? '#ffffff' : dark; ctx.strokeStyle = light; ctx.lineWidth = Math.max(1.5, r * 0.12);
      if (sub === 'crystal') { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + now * 0.4; ctx.lineTo(bx + Math.cos(a) * r, by + Math.sin(a) * r * 1.15); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else if (u.guard) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = i % 2 ? r * 0.8 : r * 1.05; ctx.lineTo(bx + Math.cos(a) * rr, by + Math.sin(a) * rr * 0.9); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else { ctx.beginPath(); ctx.ellipse(bx, by, r, r * 0.85, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      if (u.skin && u.skin.name === 'Hồn Ma') { ctx.fillStyle = 'rgba(200,210,255,0.25)'; ctx.beginPath(); ctx.arc(bx, by, r * 1.3, 0, TAU); ctx.fill(); }
      if (u.skin && u.skin.boom) { ctx.fillStyle = 'rgba(160,230,60,0.6)'; for (let i = 0; i < 3; i++) { const a = now * 2 + i * 2.1; ctx.beginPath(); ctx.arc(bx + Math.cos(a) * r * 0.5, by + Math.sin(a) * r * 0.4, r * 0.18, 0, TAU); ctx.fill(); } }
      // mắt hướng về mục tiêu
      ctx.fillStyle = light;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(bx + f.x * r * 0.45 - f.y * sd * r * 0.3, by + f.y * r * 0.45 + f.x * sd * r * 0.3, Math.max(1.5, r * 0.12), 0, TAU); ctx.fill(); }
      // vệt cào khi vừa đánh trúng (quái nhỏ trước đây thiếu hiệu ứng đánh)
      if (u.attackTarget && now - (u.lastAtkT || -9) < 0.18 && z > 5) {
        const t = u.attackTarget, q = this.w2s(t.x, t.y), k = (now - u.lastAtkT) / 0.18;
        ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = light; ctx.lineWidth = Math.max(1.5, 0.08 * z); ctx.lineCap = 'round';
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(q.x - f.y * i * 0.25 * z - f.x * 0.4 * z, q.y + f.x * i * 0.25 * z - f.y * 0.4 * z); ctx.lineTo(q.x - f.y * i * 0.25 * z + f.x * 0.3 * z, q.y + f.x * i * 0.25 * z + f.y * 0.3 * z); ctx.stroke(); }
        ctx.restore();
      }
      if (u.big) { ctx.strokeStyle = 'rgba(255,220,120,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.25 + Math.sin(now * 3) * 2, 0, TAU); ctx.stroke(); }
    }
    // GĐ8: mỗi boss một dáng riêng
    drawBoss(u, p, z, now) {
      const ctx = this.ctx, r = Math.max(8, u.r * z), id = u.bossId, col = u.color || '#ff6a5a', hurt = now - u.lastDmgT < 0.08;
      const f = u.attackTarget ? G.M.dir(u, u.attackTarget) : { x: u.fx || 0, y: u.fy || 1 }, ang = Math.atan2(f.y, f.x);
      const casting = u.cast && u.cast.key === 'boss', ck = casting ? 1 - u.cast.t / Math.max(0.01, u.cast.total) : 0;
      const fly = id === 'phuong_hoang' || id === 'rong' || id === 'thien_hon', hov = fly ? Math.sin(now * 2.2) * r * 0.12 - r * 0.25 : 0;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + r * 0.7, r * (fly ? 0.9 : 1.15), r * 0.45, 0, 0, TAU); ctx.fill();
      // hào quang nền + vòng tụ chiêu
      const gl = ctx.createRadialGradient(p.x, p.y + hov, r * 0.4, p.x, p.y + hov, r * 2.1); gl.addColorStop(0, hexA(col, 0.35 + 0.25 * ck)); gl.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y + hov, r * 2.1, 0, TAU); ctx.fill();
      if (casting) { ctx.strokeStyle = hexA(col, 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y + hov, r * 1.45, -Math.PI / 2, -Math.PI / 2 + TAU * ck); ctx.stroke(); }
      ctx.translate(p.x, p.y + hov);
      const body = hurt ? '#ffffff' : col, dk = shade(col, 0.4), lt = shade(col, 1.35);
      if (id === 'phuong_hoang' || id === 'rong') {
        // cánh vỗ
        const flap = Math.sin(now * (id === 'rong' ? 4 : 7)) * 0.35, W = r * (id === 'rong' ? 2.3 : 2.0);
        ctx.rotate(ang + Math.PI / 2);
        for (const sd of [-1, 1]) {
          ctx.save(); ctx.scale(sd, 1); ctx.rotate(flap);
          const wg = ctx.createLinearGradient(0, 0, W, 0); wg.addColorStop(0, id === 'rong' ? '#5a1010' : '#ff5a10'); wg.addColorStop(1, id === 'rong' ? '#a02818' : '#ffd060');
          ctx.fillStyle = hurt ? '#fff' : wg; ctx.beginPath(); ctx.moveTo(r * 0.2, -r * 0.2);
          if (id === 'rong') { ctx.lineTo(W, -r * 0.9); ctx.lineTo(W * 0.8, r * 0.1); ctx.lineTo(W * 0.55, -r * 0.1); ctx.lineTo(W * 0.4, r * 0.4); ctx.lineTo(r * 0.3, r * 0.4); }
          else { for (let i = 0; i <= 5; i++) { const t = i / 5; ctx.lineTo(r * 0.3 + (W - r * 0.3) * t, -r * 0.6 + Math.sin(t * Math.PI) * -r * 0.5 + t * r * 0.9); } ctx.lineTo(r * 0.3, r * 0.5); }
          ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
        }
        // thân + đầu (hướng về mục tiêu = phía -y sau khi xoay)
        ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.6, r * 0.95, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = id === 'rong' ? dk : '#ffe080'; ctx.beginPath(); ctx.ellipse(0, -r * 0.95, r * 0.38, r * 0.45, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = id === 'rong' ? '#ffd040' : '#fff6c0'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * r * 0.15, -r * 1.05, r * 0.08, 0, TAU); ctx.fill(); }
        if (id === 'rong') { ctx.strokeStyle = '#2a0808'; ctx.lineWidth = r * 0.08; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * r * 0.2, -r * 1.25); ctx.lineTo(sd * r * 0.38, -r * 1.6); ctx.stroke(); } }
        // đuôi lửa
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) { const t = (now * 2 + i * 0.25) % 1, yy = r * (0.9 + t * 1.3); ctx.fillStyle = `rgba(255,${140 + i * 25},40,${0.5 * (1 - t)})`; ctx.beginPath(); ctx.arc(Math.sin(now * 5 + i) * r * 0.2, yy, r * 0.35 * (1 - t * 0.5), 0, TAU); ctx.fill(); }
      } else if (id === 'thien_hon') {
        ctx.globalAlpha = 0.82;
        const bg = ctx.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r * 1.2); bg.addColorStop(0, hurt ? '#fff' : '#f0fbff'); bg.addColorStop(1, 'rgba(120,180,240,0.35)');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.9, Math.PI, 0);
        for (let i = 0; i <= 6; i++) { const x = r * 0.9 - i * r * 0.3, y = r * 0.7 + Math.sin(now * 6 + i * 1.3) * r * 0.15 + (i % 2 ? -r * 0.15 : 0); ctx.lineTo(x, y); }
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1; ctx.fillStyle = '#1a2a4a'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * r * 0.3 + f.x * r * 0.15, -r * 0.3 + f.y * r * 0.1, r * 0.14, r * 0.22, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(190,230,255,0.85)'; for (let i = 0; i < 5; i++) { const a = now * 1.6 + i * TAU / 5; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.1, r * 0.12, 0, TAU); ctx.fill(); }
      } else if (id === 'thiet_minh') {
        ctx.rotate(ang + Math.PI / 2);
        ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = r * 0.14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r * 0.8, r * 0.6); ctx.lineTo(r * 0.8, -r * 1.7); ctx.stroke();   // kích
        ctx.fillStyle = '#c0c0d0'; ctx.beginPath(); ctx.moveTo(r * 0.8, -r * 1.7); ctx.lineTo(r * 1.2, -r * 1.2); ctx.lineTo(r * 0.8, -r * 1.3); ctx.closePath(); ctx.fill();
        for (const sd of [-1, 1]) { ctx.fillStyle = hurt ? '#fff' : '#5a5a6a'; ctx.beginPath(); ctx.ellipse(sd * r * 0.75, -r * 0.05, r * 0.4, r * 0.32, 0, 0, TAU); ctx.fill(); }
        const bg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); bg.addColorStop(0, hurt ? '#fff' : '#d8d8e4'); bg.addColorStop(1, '#4a4a58');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#ff2a2a'; ctx.fillRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.12);   // khe mũ giáp
        ctx.fillStyle = '#a01818'; ctx.beginPath(); ctx.moveTo(0, -r * 0.85); ctx.lineTo(r * 0.15, -r * 1.25); ctx.lineTo(-r * 0.15, -r * 1.25); ctx.closePath(); ctx.fill();
      } else if (id === 'quai_thu') {
        ctx.rotate(ang + Math.PI / 2);
        ctx.fillStyle = hurt ? '#fff' : '#b8860b'; ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, rr = i % 2 ? r * 0.95 : r * 1.25; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
        const bg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); bg.addColorStop(0, '#fff0a0'); bg.addColorStop(1, '#d0a020');
        ctx.fillStyle = hurt ? '#fff' : bg; ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#5a3a08'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * r * 0.4, -r * 0.7); ctx.quadraticCurveTo(sd * r * 0.9, -r * 1.3, sd * r * 0.5, -r * 1.6); ctx.stroke(); }
        ctx.fillStyle = '#ff3a1a'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * r * 0.3, -r * 0.45, r * 0.1, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#fff6c0'; for (let i = 0; i < 4; i++) { const a = now * 2 + i * 1.6, d = r * (1.3 + 0.2 * Math.sin(now * 3 + i)); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(now * 6 + i); ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.08, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
      } else if (id === 'kiem_su') {
        ctx.rotate(ang + Math.PI / 2);
        const sw = u.attackTarget && now - (u.lastAtkT || -9) < 0.25 ? -1.2 + (now - u.lastAtkT) / 0.25 * 2.4 : 0.4;
        ctx.fillStyle = hurt ? '#fff' : '#e8f0ff'; ctx.beginPath(); ctx.moveTo(-r * 0.9, r * 0.9); ctx.lineTo(0, -r * 0.4); ctx.lineTo(r * 0.9, r * 0.9); ctx.closePath(); ctx.fill();   // áo choàng
        ctx.fillStyle = '#2a3a5a'; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f0d8b8'; ctx.beginPath(); ctx.arc(0, -r * 0.55, r * 0.35, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(r * 0.4, -r * 0.2); ctx.rotate(sw); ctx.strokeStyle = '#f8fcff'; ctx.lineWidth = Math.max(2, r * 0.12); ctx.shadowColor = '#bfe4ff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 2.6); ctx.stroke(); ctx.restore();
      } else {
        // Boss Tân Thế: khổng lồ đá, vết nứt phát sáng
        ctx.rotate(ang + Math.PI / 2);
        const bg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.1); bg.addColorStop(0, hurt ? '#fff' : '#a8a090'); bg.addColorStop(1, '#3a3630');
        ctx.fillStyle = bg; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; ctx.lineTo(Math.cos(a) * r * 1.05, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
        for (const sd of [-1, 1]) { ctx.fillStyle = '#5a544a'; ctx.beginPath(); ctx.arc(sd * r * 1.0, -r * 0.2, r * 0.42, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = this.m.bossSt && this.m.bossSt.empowered ? '#ff3a6a' : '#ffa040'; ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 4);
        ctx.beginPath(); ctx.moveTo(-r * 0.4, r * 0.5); ctx.lineTo(-r * 0.1, 0); ctx.lineTo(-r * 0.3, -r * 0.4); ctx.moveTo(r * 0.3, r * 0.6); ctx.lineTo(r * 0.15, r * 0.1); ctx.lineTo(r * 0.45, -r * 0.2); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffb040'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * r * 0.28, -r * 0.55, r * 0.1, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      ctx.strokeStyle = hexA(col, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.3 + Math.sin(now * 3) * 2, 0, TAU); ctx.stroke();
    }
    drawMonsterBar(u, p, z) {
      const r = Math.max(5, u.r * z), w = Math.max(28, r * 2.6), y = p.y - r - 10 - (u.bossId ? r * 0.5 : 0);
      if (u.hp < u.st.maxHp || u.big) this.drawBar(p.x, y, w, u.big ? 5 : 3, u.hp / u.st.maxHp, u.boss ? '#ff6a3a' : u.big ? '#ffb84a' : '#d8c890');
      if (u.big || u.guard) {
        const D = u.bossDef, ctx = this.ctx, nm = u.boss ? ((D && D.icon ? D.icon + ' ' : '') + (u.name || C.BOSS.name || 'Boss')) : u.name || '';
        ctx.font = `bold ${u.guard ? 9 : 11}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.strokeText(nm, p.x, y - 4); ctx.fillStyle = u.boss ? '#ffb090' : '#ffe0a0'; ctx.fillText(nm, p.x, y - 4);
        // boss đang tụ chiêu: thanh niệm dưới thanh máu
        if (u.cast && u.cast.key === 'boss' && u.cast.total > 0) { const k = 1 - u.cast.t / u.cast.total; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(p.x - w / 2, y + 6, w, 3); ctx.fillStyle = '#ffe070'; ctx.fillRect(p.x - w / 2, y + 6, w * k, 3); }
      }
    }
    drawPatrol(u, p, z, now) {
      const ctx = this.ctx, r = Math.max(4, u.r * z);
      ctx.fillStyle = u.team === 0 ? 'rgba(120,190,255,0.85)' : 'rgba(255,140,140,0.85)';
      ctx.beginPath(); ctx.arc(p.x, p.y + Math.sin(now * 4 + u.id) * 2, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    }
    visiblePoint() { return true; }
    drawBar(x, y, w, h, pct, col, back) {
      const ctx = this.ctx;
      ctx.fillStyle = back || 'rgba(0,0,0,0.65)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = col; ctx.fillRect(x - w / 2, y, w * Math.max(0, Math.min(1, pct)), h);
    }
    drawUnitHero(u, p, z, now) {
      const ctx = this.ctx, rp = Math.max(6, u.r * z);
      const an = this.anims.get(u.id);
      let anim = null;
      if (an) { const k = (now - an.t0) / an.dur; if (k >= 0 && k <= 1) anim = { anim: an.anim, p: k }; else this.anims.delete(u.id); }
      if (u.cast && u.cast.total > 0.3 && u.cast.key !== 'recall' && u.cast.key !== 'potion' && u.cast.key !== 'chest' && u.cast.key !== 'tp') anim = { anim: u.hero && u.hero.gfx === 'bow' ? 'draw' : 'raise', p: 0.3, charge: 1 - u.cast.t / u.cast.total };
      const rings = [];
      if (u.has('undying')) rings.push('#ffd700');
      if (u.has('shield')) rings.push('#9effd0');
      if (u.has('unstop')) rings.push('#ff9a3a');
      if (u.has('reduce')) rings.push('#d0a070');
      const st = u.statuses;
      const stunned = st.some((s) => s.type === 'stun' || s.type === 'knockup' || s.type === 'sleep');
      // biến về
      if (u.cast && (u.cast.key === 'recall' || u.cast.key === 'tp')) {
        const k = 1 - u.cast.t / u.cast.total;
        ctx.strokeStyle = u.cast.key === 'tp' ? 'rgba(200,140,255,0.9)' : 'rgba(120,200,255,0.8)'; ctx.lineWidth = 3;
        if (u.cast.key === 'tp' && u.cast.dest) { const q = this.w2s(u.cast.dest.x, u.cast.dest.y); ctx.fillStyle = 'rgba(200,140,255,' + (0.25 + 0.4 * k) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, (0.6 + 0.6 * k) * z, 0, TAU); ctx.fill(); }
        ctx.beginPath(); ctx.arc(p.x, p.y, rp + 8, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
        ctx.fillStyle = 'rgba(120,200,255,0.18)'; ctx.fillRect(p.x - rp * 0.8, p.y - rp * 3, rp * 1.6, rp * 3);
      }
      const lift = u.has('knockup') ? -rp * 0.8 : 0;
      // GĐ7b — "múa": bóng mờ nối đuôi khi tự lướt (màu tướng), bị hất thì bóng xám
      if (u.dash && (Math.abs(u.dash.vx) + Math.abs(u.dash.vy)) > 4) {
        const col = u.dash.cc ? 'rgba(200,200,210,' : (u.hero ? u.hero.color : '#ffffff');
        for (let i = 3; i >= 1; i--) {
          const gx = p.x - u.dash.vx * 0.028 * i * z, gy = p.y - u.dash.vy * 0.028 * i * z;
          ctx.save(); ctx.globalAlpha = 0.32 - i * 0.08;
          ctx.fillStyle = u.dash.cc ? col + '0.8)' : col; ctx.beginPath(); ctx.arc(gx, gy + lift, rp * (1 - i * 0.08), 0, TAU); ctx.fill();
          ctx.restore();
        }
      }
      G.Draw.drawHero(ctx, p.x, p.y + lift, rp, {
        color: u.hero ? u.hero.color : u.color || '#3a8a5a', gfx: u.ws && u.ws.scope ? 'sniper' : u.hero ? u.hero.gfx : u.gfx || 'guardian', team: u.team,
        ang: this.faceAng(u, now), anim, hurt: now - u.lastDmgT < 0.08, stunned, stealth: !!u.has('stealth') || !!u.has('untarget'),
        st: u.ws, time: now, rings, soul: u.yNiem || 0,   // GĐ7: vũ khí đổi màu theo Ý NIỆM
      });
      // Raven đang ngắm: tia laser đỏ tới mục tiêu (bắn qua tầm nhìn của quạ)
      if (u.ws && u.ws.scope && u.attackTarget && u.attackTarget.alive) {
        const q = this.pos(u.attackTarget, this.alpha || 1), t2 = this.w2s(q.x, q.y);
        ctx.save(); ctx.strokeStyle = 'rgba(255,60,60,' + (0.45 + 0.25 * Math.sin(now * 12)) + ')'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(t2.x, t2.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,60,60,0.9)'; ctx.beginPath(); ctx.arc(t2.x, t2.y, 3, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,90,90,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(t2.x, t2.y, Math.max(8, u.attackTarget.r * z + 5), 0, TAU); ctx.stroke();
        ctx.restore();
      }
      // hộ vệ (Oktava, Lính Tinh Nhuệ) đang nhắm kẻ đánh chủ: vạch nét đứt tới mục tiêu + dấu "!"
      if (u.kind === 'pet' && u.guard && u.guard.alive) {
        const q = this.pos(u.guard, this.alpha || 1), t2 = this.w2s(q.x, q.y);
        ctx.save(); ctx.globalAlpha = 0.45; ctx.strokeStyle = TEAM[u.team]; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(t2.x, t2.y); ctx.stroke(); ctx.restore();
        ctx.font = 'bold 12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd24a'; ctx.fillText('!', p.x, p.y - rp - 6);
      } else if (u.kind === 'pet' && u.returning) { ctx.font = '11px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('↩', p.x, p.y - rp - 6); }
      // uống bình: vòng tiến độ đỏ/xanh + lọ thuốc trên đầu
      if (u.cast && u.cast.key === 'potion') {
        const k = 1 - u.cast.t / u.cast.total, hp = u.cast.kind === 'hp';
        ctx.strokeStyle = hp ? 'rgba(255,90,120,0.95)' : 'rgba(90,160,255,0.95)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, rp + 7, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
        const sz = u.cast.size === 'l' ? 1.25 : u.cast.size === 's' ? 0.8 : 1;
        ctx.font = Math.round(Math.max(10, rp * 0.9 * sz)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(hp ? '🧪' : '💧', p.x, p.y - rp - 10);
      }
      // GĐ7: mở rương / Dịch Chuyển: vòng tiến độ vàng / tím + biểu tượng
      if (u.cast && (u.cast.key === 'chest' || u.cast.key === 'tp')) {
        const k = 1 - u.cast.t / u.cast.total, ch = u.cast.key === 'chest';
        ctx.strokeStyle = ch ? 'rgba(255,210,74,0.95)' : 'rgba(176,112,255,0.95)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, rp + 7, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
        ctx.font = Math.round(Math.max(11, rp * 0.9)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ch ? '🎁' : '🌀', p.x, p.y - rp - 10);
      }
      // phù hộ mệnh đang dán: vòng xanh nhạt mảnh
      if (u.statuses.length && u.hasKey('fu_ho')) { ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = '#7fd8ff'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(p.x, p.y, rp + 3.5, 0, TAU); ctx.stroke(); ctx.restore(); }
      // hiệu ứng trạng thái
      let icons = '';
      if (stunned) icons += '💫'; if (u.has('root')) icons += '⛓'; if (u.has('silence')) icons += '🔇'; if (u.has('charm')) icons += '💗';
      if (u.has('slow')) icons += '🐌'; if (u.has('blind')) icons += '🕶';
      if (icons) { ctx.font = `${Math.max(10, rp * 0.7)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(icons, p.x, p.y + rp + Math.max(12, rp * 0.9)); }
    }
    drawAIDebug(u, x, y) {
      const ctx = this.ctx, ai = u.ai;
      const lines = ai.top3.map((t, i) => `${i + 1}. ${t.icon} ${t.name} ${t.s.toFixed(2)}`);
      if (ai.tgtInfo && ai.mode === 'fight') { const e = this.m.heroById(ai.tgtInfo.id); if (e) lines.push(`🎯 ${this.nameOf(e)}: ${ai.tgtInfo.why}`); }
      // GĐ5e: bị đuổi (3 lựa chọn điểm cao nhất) và lần dùng chiêu Utility gần nhất (ăn lính / lướt / vượt tường)
      if (ai.evade && ai.evTop && this.m.time - (ai.evT || 0) < 2.5) lines.push('🏃 ' + ai.evTop.map((e) => `${e.name} ${e.s.toFixed(2)}`).join(' > '));
      if (ai.skLast && this.m.time - ai.skLast.t < 2) lines.push(`✨ ${ai.skLast.name} ${ai.skLast.s.toFixed(2)}`);
      ctx.font = '10px system-ui,sans-serif'; ctx.textAlign = 'left';
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 8, h = lines.length * 12 + 4;
      ctx.fillStyle = 'rgba(8,12,20,0.78)'; ctx.fillRect(x - w / 2, y - h, w, h);
      lines.forEach((l, i) => { ctx.fillStyle = i === 0 ? '#ffe9a0' : i < 3 ? '#cfd8e3' : '#ff9a8a'; ctx.fillText(l, x - w / 2 + 4, y - h + 12 + i * 12); });
    }
    drawHeroBars(u, p, z) {
      const ctx = this.ctx, rp = Math.max(6, u.r * z);
      if (z < 6 && u.kind === 'hero') {   // toàn cảnh: chỉ chấm màu + thanh máu nhỏ
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(p.x - 13, p.y - rp - 8, 26, 5);
        ctx.fillStyle = TEAM[u.team]; ctx.fillRect(p.x - 12, p.y - rp - 7, 24 * u.hpPct, 3);
        return;
      }
      const w = Math.max(34, rp * 3.2), y = p.y - rp - Math.max(14, rp * 0.9);
      const shield = u.statuses.reduce((a, s) => a + (s.type === 'shield' ? s.v : 0), 0);
      const tot = Math.max(u.st.maxHp, u.hp + shield);
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(p.x - w / 2 - 1, y - 1, w + 2, 7);
      ctx.fillStyle = TEAM[u.team]; ctx.fillRect(p.x - w / 2, y, w * u.hp / tot, 5);
      // GĐ8: Hộ Giáp — thanh bạc mảnh ngay trên thanh máu
      const gaM = u.st.maxGa || 0;
      if (gaM > 0 && u.kind === 'hero') { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(p.x - w / 2 - 1, y - 4, w + 2, 3); ctx.fillStyle = '#d8e2f0'; ctx.fillRect(p.x - w / 2, y - 3.5, w * Math.max(0, Math.min(1, (u.ga || 0) / gaM)), 2); }
      if (shield > 0) { ctx.fillStyle = '#e8f6ff'; ctx.fillRect(p.x - w / 2 + w * u.hp / tot, y, w * shield / tot, 5); }
      // vạch mỗi 200 máu
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let v = 200; v < tot; v += 200) ctx.fillRect(p.x - w / 2 + w * v / tot, y, 1, 5);
      if (u.kind === 'hero') {
        if (u.st.maxMp > 0) { ctx.fillStyle = '#5a8cff'; ctx.fillRect(p.x - w / 2, y + 6, w * u.mp / u.st.maxMp, 2); }
        // GĐ9: băng đạn (tướng súng) — mỗi viên một vạch; đang nạp: thanh vàng chạy
        const GN = u.hero.gun && u.ws && u.hero.gun(this.m, u);
        if (GN && GN.max) {
          const yy = y + (u.st.maxMp > 0 ? 9 : 7), n = Math.max(0, Math.floor(GN.n || 0)), MX = GN.max;
          ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(p.x - w / 2 - 1, yy - 1, w + 2, 4);
          if (GN.rl > 0 && (n <= 0 || GN.shell)) { const k = 1 - Math.max(0, Math.min(1, GN.rl / (GN.rlMax || 1))); ctx.fillStyle = 'rgba(255,210,74,0.35)'; ctx.fillRect(p.x - w / 2, yy, w, 2); ctx.fillStyle = '#ffd24a'; ctx.fillRect(p.x - w / 2, yy, w * k, 2); }
          if (n > 0) {
            if (MX <= 12) { const pw = (w - (MX - 1)) / MX; for (let i = 0; i < MX; i++) { ctx.fillStyle = i < n ? '#f4e6b0' : 'rgba(255,255,255,0.12)'; ctx.fillRect(p.x - w / 2 + i * (pw + 1), yy, pw, 2); } }
            else { ctx.fillStyle = '#f4e6b0'; ctx.fillRect(p.x - w / 2, yy, w * n / MX, 2); }
          }
        }
        ctx.fillStyle = '#1b2230'; ctx.fillRect(p.x - w / 2 - 13, y - 2, 12, 11);
        ctx.fillStyle = '#ffe9a0'; ctx.font = 'bold 9px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(u.level), p.x - w / 2 - 7, y + 7);
        ctx.font = `bold ${IS_MOBILE ? 10 : 11}px system-ui,sans-serif`;
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        const nm = (u.pers ? u.pers.icon + ' ' : '') + this.nameOf(u);
        ctx.strokeText(nm, p.x, y - 6); ctx.fillStyle = TEAM_L[u.team]; ctx.fillText(nm, p.x, y - 6);
        // GĐ5d — chế độ gỡ lỗi AI: 3 hành động điểm cao nhất + mục tiêu giao tranh đang nhắm
        if (this.debugAI && u.ai && u.ai.top3 && u.ai.top3.length) this.drawAIDebug(u, p.x, y - 16);
        // bùa đang mang
        let bx = p.x + w / 2 + 4;
        for (const [k, col] of [['buff_red', '#ff5a3a'], ['buff_blue', '#4a9aff'], ['buff_gold', '#ffd24a']]) {
          if (!u.statuses.some((s) => s.key === k)) continue;
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx, y + 2, 3, 0, TAU); ctx.fill(); bx += 7;
        }
        // GĐ8: bùa lợi boss (biểu tượng + vầng màu) — ai nhìn cũng biết người này đang mang gì
        const BB = G.BOSS_BUFFS;
        if (BB) for (const s of u.statuses) { const B0 = s.key && BB[s.key]; if (!B0) continue; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(B0.icon, bx - 2, y + 6); ctx.textAlign = 'center'; bx += 12; }
        const nd = u.stats && u.stats.drops; if (nd) { ctx.font = 'bold 9px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#ffd24a'; ctx.fillText('📦' + (nd > 1 ? nd : ''), bx, y + 6); ctx.textAlign = 'center'; }
      } else if (u.decoy) {
        ctx.font = `bold ${IS_MOBILE ? 10 : 11}px system-ui,sans-serif`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        const nm = u.owner ? this.nameOf(u.owner) : u.name;
        ctx.strokeText(nm + ' ✦', p.x, y - 3); ctx.fillStyle = TEAM_L[u.team]; ctx.fillText(nm + ' ✦', p.x, y - 3);
      }
    }
    drawProj(pj, z) {
      const ctx = this.ctx, p = this.w2s(pj.x, pj.y);
      if (p.x < -40 || p.y < -40 || p.x > this.W + 40 || p.y > this.H + 40) return;
      const dx = pj.dx || 1, dy = pj.dy || 0, r = Math.max(2, (pj.r || 0.3) * z), now = this.m.time, D = G.VfxDraw, V = this.vfx;
      const k = pj.kind, ang = Math.atan2(dy, dx);
      // vệt đuôi mờ dần sau viên đạn
      const trail = (len, w, col) => { const g = ctx.createLinearGradient(p.x - dx * len * z, p.y - dy * len * z, p.x, p.y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, col); ctx.strokeStyle = g; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x - dx * len * z, p.y - dy * len * z); ctx.lineTo(p.x, p.y); ctx.stroke(); };
      ctx.save();
      switch (k) {
        case 'arrow': case 'bigarrow': case 'giantarrow': {
          const L = (k === 'giantarrow' ? 3 : k === 'bigarrow' ? 1.6 : 0.9) * z, glow = k !== 'arrow';
          if (glow) trail(k === 'giantarrow' ? 5 : 2.5, k === 'giantarrow' ? 10 : 5, 'rgba(160,255,180,0.55)');
          ctx.strokeStyle = k === 'giantarrow' ? '#c8ffd0' : '#e8e0c0'; ctx.lineWidth = k === 'giantarrow' ? 6 : k === 'bigarrow' ? 3 : 2;
          if (glow) { ctx.shadowColor = '#9fffb0'; ctx.shadowBlur = 12; }
          ctx.beginPath(); ctx.moveTo(p.x - dx * L, p.y - dy * L); ctx.lineTo(p.x, p.y); ctx.stroke();
          // mũi tên + lông đuôi
          ctx.fillStyle = '#f4f0e0'; ctx.beginPath(); ctx.moveTo(p.x + dx * 4, p.y + dy * 4); ctx.lineTo(p.x - dy * 3, p.y + dx * 3); ctx.lineTo(p.x + dy * 3, p.y - dx * 3); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#d06060'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - dx * L - dy * 3, p.y - dy * L + dx * 3); ctx.lineTo(p.x - dx * (L - 5), p.y - dy * (L - 5)); ctx.lineTo(p.x - dx * L + dy * 3, p.y - dy * L - dx * 3); ctx.stroke();
          break;
        }
        case 'bullet': case 'pellet': {
          trail(k === 'pellet' ? 0.5 : 0.9, Math.max(2, r * 0.6), 'rgba(255,230,140,0.9)');
          ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.5, r * 0.4), 0, TAU); ctx.fill(); break;
        }
        case 'shell':
          if (D && D.bullet(ctx, 'ringA', p.x, p.y, r * 3.2, now)) break;
          ctx.fillStyle = '#ffe07a'; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2, r * 0.5), 0, TAU); ctx.fill(); break;
        case 'fire': case 'fireball': case 'bigfire': {
          const R = r * (k === 'fire' ? 0.7 : k === 'bigfire' ? 1.3 : 1);
          if (V && (now * 60 | 0) % 2 === 0) V.burstParts(now, pj.x - dx * 0.3, pj.y - dy * 0.3, 1, { color: '#ff9a3a', speed: 1.2, life: 0.35, size: 0.18, a: ang + Math.PI, spread: 1.2 });
          const g = ctx.createRadialGradient(p.x, p.y, R * 0.1, p.x, p.y, R * 1.6);
          g.addColorStop(0, '#fff6d0'); g.addColorStop(0.35, '#ffb04a'); g.addColorStop(0.7, 'rgba(255,90,20,0.6)'); g.addColorStop(1, 'rgba(255,60,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, R * 1.6, 0, TAU); ctx.fill();
          break;
        }
        case 'tower': {
          const col = pj.team === 0 ? 'rgba(140,200,255,0.9)' : 'rgba(255,140,140,0.9)';
          trail(1.2, 6, col);
          ctx.shadowColor = pj.team === 0 ? '#7ac0ff' : '#ff7a7a'; ctx.shadowBlur = 14; ctx.fillStyle = pj.team === 0 ? '#e8f4ff' : '#ffe0e0';
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(4, 0.35 * z), 0, TAU); ctx.fill(); break;
        }
        case 'hook': {
          const o = pj.owner && pj.owner.alive ? this.w2s(pj.owner.x, pj.owner.y) : null;
          if (o) { ctx.strokeStyle = '#a8a0c0'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]); }
          ctx.strokeStyle = '#e0e0f0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, r, ang - 2.2, ang + 1.4); ctx.stroke(); break;
        }
        case 'darkorb':
          if (V && (now * 60 | 0) % 2 === 0) V.burstParts(now, pj.x, pj.y, 1, { color: '#8a4ac0', speed: 1, life: 0.35, size: 0.16 });
          if (D && D.bullet(ctx, 'swirlP', p.x, p.y, r * 3.4, now)) break;
          ctx.shadowColor = '#a070ff'; ctx.shadowBlur = 14; ctx.fillStyle = '#5a3a8a'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill(); break;
        case 'star':
          trail(0.8, Math.max(2, r * 0.7), 'rgba(160,230,255,0.6)');
          if (D && D.bullet(ctx, 'starA', p.x, p.y, r * 3.0, now)) break;
          ctx.fillStyle = '#bff4ff'; ctx.shadowColor = '#7fd3ff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.8, 0, TAU); ctx.fill(); break;
        case 'sniper': {   // đạn súng ngắm: vệt sáng dài, mảnh
          trail(3.2, Math.max(2, r * 0.5), 'rgba(255,230,190,0.85)');
          ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ffd8a0'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.8, r * 0.35), 0, TAU); ctx.fill(); break;
        }
        case 'bomb': {     // bom mini của quạ: quả bom đen có ngòi lửa
          const R = Math.max(3, r * 0.8);
          ctx.fillStyle = '#20242e'; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#8aa0c8'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = (now * 20 | 0) % 2 ? '#ffd24a' : '#ff7a2a'; ctx.beginPath(); ctx.arc(p.x + R * 0.6, p.y - R * 0.8, R * 0.35, 0, TAU); ctx.fill(); break;
        }
        case 'slashwave': case 'phantom': {
          const col = k === 'phantom' ? '#ff9ab0' : pj.owner && pj.owner.hero ? pj.owner.hero.color : '#ffd0dc';
          ctx.translate(p.x, p.y); ctx.rotate(ang + Math.PI / 2);
          ctx.globalAlpha = 0.9;
          if (!(D && D.Slash.draw(ctx, 3, col, (now * 3) % 1 * 0.3 + 0.35, r * 3.2, r * 2.4))) { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, r, r * 1.6, Math.PI + 0.6, -0.6); ctx.stroke(); }
          if (k === 'phantom') { ctx.globalAlpha = 0.35; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, r * 1.4, 0.6 * z, 0, TAU); ctx.fill(); }
          break;
        }
        case 'note':
          ctx.fillStyle = '#7ae0a0'; ctx.shadowColor = '#7ae0a0'; ctx.shadowBlur = 10; ctx.font = `bold ${Math.max(12, 0.8 * z)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', p.x, p.y); break;
        case 'card':
          ctx.translate(p.x, p.y); ctx.rotate(ang + now * 12);
          ctx.fillStyle = '#fff8e0'; ctx.strokeStyle = '#c03030'; ctx.lineWidth = 1; ctx.fillRect(-r * 0.5, -r * 0.7, r, r * 1.4); ctx.strokeRect(-r * 0.5, -r * 0.7, r, r * 1.4); break;
        case 'minion':
          trail(0.5, 2, hexA(TEAM[pj.team], 0.7));
          ctx.fillStyle = TEAM_L[pj.team]; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2, 0.15 * z), 0, TAU); ctx.fill(); break;
        default:
          if (D && D.bullet(ctx, pj.team % 2 ? 'swirlA' : 'swirlB', p.x, p.y, r * 2.6, now)) break;
          ctx.fillStyle = TEAM_L[pj.team]; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2, r * 0.6), 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    // GĐ8: vùng cảnh báo nhiều hình dạng — tròn, vành khăn (donut), đường thẳng (chữ nhật), hình nón.
    // Viền nét đứt = vùng sắp trúng; phần tô đậm dần từ trong ra = thời gian còn lại trước khi nổ.
    drawWarn(f, p, z, k) {
      const ctx = this.ctx, col = f.color || '#ff4a1a', boss = !!f.boss, sh = f.shape || 'circle';
      ctx.save(); ctx.globalAlpha = 0.95;
      ctx.strokeStyle = col; ctx.lineWidth = boss ? 2.5 : 2; ctx.setLineDash([6, 5]);
      const fill = hexA(col.length === 7 ? col : '#ff4a1a', boss ? 0.16 : 0.12), fill2 = hexA(col.length === 7 ? col : '#ff4a1a', boss ? 0.3 : 0.2);
      if (sh === 'ring') {
        const R0 = (f.r0 || 0) * z, R = f.r * z;
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(p.x, p.y, R0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.arc(p.x, p.y, R0, 0, TAU, true); ctx.fill('evenodd');
        ctx.fillStyle = fill2; ctx.beginPath(); ctx.arc(p.x, p.y, R0 + (R - R0) * k, 0, TAU); ctx.arc(p.x, p.y, R0, 0, TAU, true); ctx.fill('evenodd');
      } else if (sh === 'line') {
        const q = this.w2s(f.x2, f.y2), a = Math.atan2(q.y - p.y, q.x - p.x), L = Math.hypot(q.x - p.x, q.y - p.y), W = (f.w || 1) * z;
        ctx.translate(p.x, p.y); ctx.rotate(a);
        ctx.strokeRect(0, -W / 2, L, W); ctx.setLineDash([]);
        ctx.fillStyle = fill; ctx.fillRect(0, -W / 2, L, W);
        ctx.fillStyle = fill2; ctx.fillRect(0, -W / 2, L * k, W);
      } else if (sh === 'cone') {
        const a = Math.atan2(f.dy, f.dx), h = Math.acos(Math.max(-1, Math.min(1, f.c))), R = f.r * z;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, R, a - h, a + h); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = fill; ctx.fill();
        ctx.fillStyle = fill2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, R * k, a - h, a + h); ctx.closePath(); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, f.r * z, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = fill; ctx.fill();
        ctx.fillStyle = fill2; ctx.beginPath(); ctx.arc(p.x, p.y, f.r * z * k, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    drawFx(now, z) {
      const ctx = this.ctx;
      for (const f of this.fx) {
        const k = (now - f.t) / fxLife(f);
        if (k < 0 || k > 1) continue;
        const p = f.x !== undefined ? this.w2s(f.x, f.y) : null;
        if (this.vfx && f.type !== 'warn' && f.type !== 'chain') continue;   // phần còn lại do VFX vẽ
        ctx.globalAlpha = 1 - k;
        switch (f.type) {
          case 'ring':
            ctx.strokeStyle = f.color || TEAM_L[f.team]; ctx.lineWidth = 3 + 4 * (1 - k);
            ctx.beginPath(); ctx.arc(p.x, p.y, f.r * z * (0.6 + 0.4 * k), 0, TAU); ctx.stroke(); break;
          case 'line': {
            const q = this.w2s(f.x2, f.y2);
            ctx.strokeStyle = f.color || '#ffffff'; ctx.lineWidth = Math.max(2, f.w * z * (1 - k));
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); break;
          }
          case 'cone': {
            const a = Math.atan2(f.dy, f.dx), h = Math.acos(Math.max(-1, Math.min(1, f.c)));
            ctx.fillStyle = f.color || '#ffffff'; ctx.globalAlpha = (1 - k) * 0.35;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, f.r * z, a - h, a + h); ctx.closePath(); ctx.fill(); break;
          }
          case 'warn': this.drawWarn(f, p, z, k); break;
          case 'boom': case 'quake': {
            const R = (f.big ? 4 : f.r || 2.5) * z;
            const rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * (0.5 + k));
            rg.addColorStop(0, 'rgba(255,240,180,0.9)'); rg.addColorStop(0.5, 'rgba(255,140,40,0.6)'); rg.addColorStop(1, 'rgba(255,60,0,0)');
            ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(p.x, p.y, R * (0.5 + k), 0, TAU); ctx.fill(); break;
          }
          case 'burst': case 'slash':
            ctx.strokeStyle = f.color || '#ffffff'; ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) { const a = i * 1.57 + f.t * 7; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * 0.3 * z, p.y + Math.sin(a) * 0.3 * z); ctx.lineTo(p.x + Math.cos(a) * (0.6 + k) * z, p.y + Math.sin(a) * (0.6 + k) * z); ctx.stroke(); }
            break;
          case 'blink': {
            const q = this.w2s(f.x2, f.y2);
            ctx.strokeStyle = 'rgba(200,180,255,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.setLineDash([]); break;
          }
          case 'death':
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = `${Math.max(16, z)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('💀', p.x, p.y - k * z * 2); break;
          case 'lvl':
            ctx.strokeStyle = '#ffe07a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, (0.8 + k * 1.5) * z, 0, TAU); ctx.stroke(); break;
          case 'chain': {
            const a = this.m.units.find((x) => x.id === f.a), b = this.m.units.find((x) => x.id === f.b);
            if (a && b) { const pa = this.w2s(a.x, a.y), pb = this.w2s(b.x, b.y); ctx.strokeStyle = '#c8c0e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); }
            break;
          }
          default: break;
        }
        ctx.globalAlpha = 1;
      }
    }
    // chữ nổi: sát thương, hồi máu, vàng
    drawTexts(now, z) {
      const ctx = this.ctx;
      if (z < 6) return;                                  // toàn cảnh: không hiện số sát thương
      ctx.textAlign = 'center';
      for (const f of this.fx) {
        if (f.type !== 'dmg' && f.type !== 'heal' && f.type !== 'gold') continue;
        const k = (now - f.t) / fxLife(f);
        if (k < 0 || k > 1) continue;
        const p = this.w2s(f.x, f.y);
        const rise = 1 - Math.pow(1 - k, 3), y = p.y - z * (1.1 + rise * 1.5), pop = k < 0.12 ? 1.45 - k * 3.75 : 1;
        ctx.globalAlpha = k > 0.65 ? (1 - k) / 0.35 : 1;
        let size = 12, col = '#ffffff';
        if (f.type === 'dmg') {
          if (!f.hero && f.v < 30) continue;
          size = f.crit ? 17 : f.v > 200 ? 15 : f.hero ? 13 : 11;
          col = f.dt === 'magic' ? '#d6a8ff' : f.dt === 'true' ? '#ffffff' : f.crit ? '#ffb030' : '#ff8a6a';
        } else if (f.type === 'heal') { size = 12; col = '#7aff9a'; }
        else { size = 11; col = '#ffd24a'; }
        ctx.font = `900 ${Math.round(size * pop)}px system-ui,"Segoe UI",sans-serif`;
        const txt = f.type === 'gold' ? `+${Math.round(f.v)}` : f.type === 'heal' ? `+${Math.round(f.v)}` : String(Math.round(f.v)) + (f.crit ? '!' : '');
        const x = p.x + ((f.t * 37) % 1 - 0.5) * 18;
        ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(txt, x, y); ctx.fillStyle = col; ctx.fillText(txt, x, y);
      }
      ctx.globalAlpha = 1;
    }

    // ---------- bản đồ nhỏ: bo, bãi quái, boss, thính, Thương Nhân, 10 tướng ----------
    drawMinimap(mc) {
      if (this.m && this.m.soloArena) {
        if (!mc || !mc.width || !mc.height) return;
        const g = mc.getContext('2d'), S = mc.width, m = this.m, sa = m.soloArena;
        g.fillStyle = '#060912'; g.fillRect(0, 0, S, S);
        const cx = S / 2, cy = S / 2;
        const R = sa.r, scale = (S * 0.40) / R;
        const theme = sa.theme || {};
        const col = theme.c || { top: '#7d7f86', rim: '#ffd24a' };
        // Mặt sàn mini
        g.fillStyle = col.top; g.beginPath(); g.arc(cx, cy, R * scale, 0, TAU); g.fill();
        g.strokeStyle = col.rim; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R * scale, 0, TAU); g.stroke();
        // Cột trụ
        for (const p of sa.worldPillars) {
          const px = cx + (p.x - sa.cx) * scale;
          const py = cy + (p.y - sa.cy) * scale;
          g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(px, py, p.r * scale, 0, TAU); g.fill();
        }
        // Vòng bo nếu có co
        const zs = m.zoneSt;
        if (zs && zs.cur && zs.cur.r < R) {
          g.save();
          g.beginPath(); g.rect(0, 0, S, S);
          const zx = cx + (zs.cur.x - sa.cx) * scale;
          const zy = cy + (zs.cur.y - sa.cy) * scale;
          g.arc(zx, zy, Math.max(0, zs.cur.r * scale), 0, TAU, true);
          g.fillStyle = 'rgba(110,40,170,0.45)'; g.fill('evenodd');
          g.strokeStyle = 'rgba(210,140,255,0.95)'; g.lineWidth = 1.5;
          g.beginPath(); g.arc(zx, zy, Math.max(0, zs.cur.r * scale), 0, TAU); g.stroke();
          g.restore();
        }
        // 2 Tướng
        for (const h of m.heroes) {
          if (!h.alive) continue;
          const hx = cx + (h.x - sa.cx) * scale;
          const hy = cy + (h.y - sa.cy) * scale;
          g.fillStyle = h.team === 0 ? '#4aa3ff' : '#ff5a5a';
          g.strokeStyle = '#ffffff'; g.lineWidth = 2;
          g.beginPath(); g.arc(hx, hy, 5.5, 0, TAU); g.fill(); g.stroke();
        }
        return;
      }
      if (!this.bg || !mc || !mc.width || !mc.height || !this.bg.width || !this.bg.height) return;
      const g = mc.getContext('2d'), S = mc.width, k = S / C.MAP, m = this.m;
      if (!this.miniBg || this.miniBg.width !== S || this.miniVer !== this.bgVer) { this.miniVer = this.bgVer; this.miniBg = document.createElement('canvas'); this.miniBg.width = S; this.miniBg.height = S; this.miniBg.getContext('2d').drawImage(this.bg, 0, 0, S, S); }
      g.drawImage(this.miniBg, 0, 0);
      const zs = m.zoneSt;
      if (zs) {
        g.save(); g.beginPath(); g.rect(0, 0, S, S); g.arc(zs.cur.x * k, zs.cur.y * k, Math.max(0, zs.cur.r * k), 0, TAU, true);
        g.fillStyle = 'rgba(110,40,170,0.4)'; g.fill('evenodd');
        g.strokeStyle = 'rgba(210,140,255,0.95)'; g.lineWidth = 1.5; g.beginPath(); g.arc(zs.cur.x * k, zs.cur.y * k, Math.max(0, zs.cur.r * k), 0, TAU); g.stroke();
        if (zs.next) { g.strokeStyle = 'rgba(255,255,255,0.85)'; g.setLineDash([4, 3]); g.beginPath(); g.arc(zs.next.x * k, zs.next.y * k, Math.max(0.5, zs.next.r * k), 0, TAU); g.stroke(); g.setLineDash([]); }
        g.restore();
      }
      for (const c of m.camps || []) {
        const alive = c.unit && c.unit.alive;
        g.fillStyle = alive ? (c.type === 'red' ? '#ff6a4a' : c.type === 'blue' ? '#5aa0ff' : c.type === 'gold' ? '#ffd24a' : '#c8c0a0') : 'rgba(120,120,120,0.45)';
        g.beginPath(); g.arc(c.x * k, c.y * k, c.type === 'small' ? 1.4 : 2.1, 0, TAU); g.fill();
      }
      for (const t of MAP.merchants) { g.fillStyle = '#ffe9b0'; g.fillRect(t.x * k - 2, t.y * k - 2, 4, 4); g.strokeStyle = '#000'; g.lineWidth = 0.8; g.strokeRect(t.x * k - 2, t.y * k - 2, 4, 4); }
      const B = m.bossSt && m.bossSt.unit;
      if (B && B.alive) { g.fillStyle = m.bossSt.empowered ? '#ff2a6a' : '#ff5a2a'; g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.arc(B.x * k, B.y * k, 4.5, 0, TAU); g.fill(); g.stroke(); }
      for (const c of m.chests || []) if (!c.opened) { g.fillStyle = '#d8a040'; g.fillRect(c.x * k - 1.6, c.y * k - 1.3, 3.2, 2.6); }
      for (const o of m.soulOrbs || []) { const T = G.SOUL_TIER[o.tier]; g.fillStyle = T.color; g.strokeStyle = '#000'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(o.x * k, o.y * k - 3); g.lineTo(o.x * k + 2.4, o.y * k); g.lineTo(o.x * k, o.y * k + 3); g.lineTo(o.x * k - 2.4, o.y * k); g.closePath(); g.fill(); g.stroke(); }
      for (const d of m.drops || []) if (d.warned && !d.taken) { g.fillStyle = '#ffd24a'; g.strokeStyle = '#000'; g.lineWidth = 1; g.fillRect(d.x * k - 3, d.y * k - 3, 6, 6); g.strokeRect(d.x * k - 3, d.y * k - 3, 6, 6); }
      for (const h of m.heroes) {
        if (!h.alive || (h.duel && h.x > 800)) continue;
        g.fillStyle = h.hero.color; g.strokeStyle = TEAM[h.team]; g.lineWidth = 2;
        g.beginPath(); g.arc(h.x * k, h.y * k, Math.max(3.2, S / 44), 0, TAU); g.fill(); g.stroke();
      }
      // Cổng/Không gian quyết đấu trên minimap
      const dg = m.duelSt && m.duelSt.gate;
      if (dg && dg.state === 'fight') {
        const gx = ((dg.gateOrig ? dg.gateOrig.x : dg.x) * k);
        const gy = ((dg.gateOrig ? dg.gateOrig.y : dg.y) * k);
        g.fillStyle = '#ffd24a'; g.strokeStyle = '#a855f7'; g.lineWidth = 2;
        g.beginPath(); g.arc(gx, gy, 5.5, 0, TAU); g.fill(); g.stroke();
        g.fillStyle = '#1c1028'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center';
        g.fillText('⚔', gx, gy + 3);
      }
      // khung camera
      if (this.cam.x > 800 || this.cam.y > 800) {
        g.fillStyle = 'rgba(20, 10, 36, 0.88)';
        g.fillRect(4, 4, S - 8, 18);
        g.strokeStyle = '#ffd24a'; g.lineWidth = 1;
        g.strokeRect(4, 4, S - 8, 18);
        g.fillStyle = '#ffe08a'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center';
        g.fillText('🌌 Đang xem Không Gian 1v1', S / 2, 16);
      } else {
        const hw = this.W / 2 / this.cam.zoom, hh = this.H / 2 / this.cam.zoom;
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5;
        g.strokeRect((this.cam.x - hw) * k, (this.cam.y - hh) * k, hw * 2 * k, hh * 2 * k);
        if (this.spot) { g.strokeStyle = '#ffd24a'; g.beginPath(); g.arc(this.spot.x * k, this.spot.y * k, 7, 0, TAU); g.stroke(); }
      }
    }
  }
  // GĐ7b — "múa": động tác theo loại chiêu (lướt / đập khống chế / chém / đâm / xoay chiêu cuối / giơ hỗ trợ / thế thủ);
  // đánh thường cận chiến chém xen kẽ trái–phải; chiêu nối nhau trong chuỗi thì đổi tay cho liền mạch
  const ANIM_DUR = { dash: 0.3, slam: 0.42, spin: 0.5, guard: 0.45, raise: 0.4, swing: 0.32, swing2: 0.32, thrust: 0.3, draw: 0.35 };
  const GUN = { pistol: 1, shotgun: 1, revolver: 1, rifle: 1, sniper: 1, dual: 1 };
  function animFor(u, e, prev) {
    const gfx = u.hero ? u.hero.gfx : u.gfx, alt = prev && (prev.anim === 'swing') && (u.hero ? 1 : 0);
    if (e.type === 'cast') {
      const def = u.hero && u.hero.skills[e.key], use = def && def.ai ? def.ai.use : null;
      if (e.key === 's4' || use === 'ult') return gfx === 'bow' ? 'draw' : 'spin';
      if (use === 'engage' || use === 'escape') return 'dash';
      if (use === 'defend') return 'guard';
      if (use === 'support') return 'raise';
      if (gfx === 'bow') return 'draw';
      if (GUN[gfx] || gfx === 'staff' || gfx === 'cards' || gfx === 'flask' || gfx === 'voice') return use === 'cc' ? 'raise' : 'thrust';
      if (use === 'cc') return 'slam';
      return alt ? 'swing2' : 'swing';
    }
    if (gfx === 'spear' || gfx === 'rapier' || GUN[gfx]) return 'thrust';
    if (gfx === 'bow') return 'draw';
    return alt ? 'swing2' : 'swing';
  }
  function fxLife(f) {
    switch (f.type) {
      case 'dmg': case 'heal': case 'gold': return 0.9;
      case 'warn': return f.life || 1;
      case 'death': return 1.5;
      case 'boom': return f.big ? 0.8 : 0.5;
      case 'chain': return f.life || 0.35;
      case 'lvl': return 0.6;
      case 'aura': case 'lock': case 'shades': return 0;
      default: return 0.35;
    }
  }
  const ZONE_COL = { gas: 'rgba(120,220,80,0.22)', acid: 'rgba(140,240,60,0.22)', ice: 'rgba(170,230,255,0.25)', smoke: 'rgba(140,140,150,0.4)', storm: 'rgba(120,220,190,0.2)',
    oca: 'rgba(0,0,0,0)', arena: 'rgba(255,120,70,0.12)', flag: 'rgba(230,70,70,0.14)', heal: 'rgba(120,255,160,0.2)', spears: 'rgba(224,192,112,0.18)', blades: 'rgba(154,208,255,0.2)',
    field: 'rgba(74,224,208,0.12)', oil: 'rgba(40,30,20,0.4)', spring: 'rgba(255,220,90,0.3)', barrier: 'rgba(190,255,224,0.18)', drone: 'rgba(0,0,0,0)', lotus: 'rgba(110,190,255,0.12)',
    crack: 'rgba(120,90,50,0.3)', spin: 'rgba(255,200,100,0.2)', wind: 'rgba(190,255,224,0.25)', eye: 'rgba(0,0,0,0)',
    miasma: 'rgba(120,80,160,0.28)', poison: 'rgba(150,220,50,0.26)', goldsand: 'rgba(230,190,70,0.28)' };
  // nhân độ sáng màu hex (k < 1 tối đi, k > 1 sáng lên)
  function shade(c, k) { const n = parseInt(c.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; }
  function zoneColor(z) {
    if (z.kind === 'fire') return 'rgba(255,110,30,0.22)';
    if (z.kind === 'scythe') return 'rgba(140,110,200,0.22)';
    if (ZONE_COL[z.kind]) return ZONE_COL[z.kind];
    return hexA(TEAM[z.team], 0.15);
  }
  G.Renderer = Renderer;
  G.buildBackground = buildBackground;
  G.IS_MOBILE = IS_MOBILE;
})();
