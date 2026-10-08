'use strict';
// ===== HIỆU ỨNG HÌNH ẢNH (lấy lại từ bản cũ) =====
// Vệt chém trăng khuyết / đâm / lốc xoáy (img/slash.png + vệt sáng vẽ tay thon hai đầu, ease-out), vụ nổ (img/explosion.png),
// bộ sprite "Free" (tia lửa trúng đòn, tia nổ, vầng chấn động, đầu lâu, hào quang, phù văn, xoáy, tia điện, hoa, mây khí),
// khói/bụi (Free Smoke Fx), đạn dạng ảnh (500 Bullet), hạt (tia lửa, tàn lửa, bụi), rung màn hình, chớp sáng, chữ nổi.
// Mọi hiệu ứng neo theo tọa độ bản đồ (đv) và thời gian trận (nhanh/chậm theo tốc độ xem, dừng khi tạm dừng).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

  // ---------- ảnh ----------
  const IMG = {};
  function img(src) {
    if (typeof Image === 'undefined') return null;
    let im = IMG[src];
    if (!im) { im = IMG[src] = new Image(); im.src = encodeURI((G.ASSET_MAP && G.ASSET_MAP[src]) || src); }
    return im.complete && im.naturalWidth ? im : null;
  }
  // màu → hàng màu của bộ sprite "Free" (0 đỏ hồng • 1 tím • 2 xanh nhạt • 3 xanh lá • 4 vàng • 5 trắng • 6 nâu • 7 lửa • 8 xanh dương)
  function vfxRow(color) {
    if (!color || color[0] !== '#' || color.length < 7) return 7;
    const r = parseInt(color.slice(1, 3), 16) / 255, g = parseInt(color.slice(3, 5), 16) / 255, b = parseInt(color.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d < 0.18) return mx > 0.55 ? 5 : 6;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
    if (h < 15 || h >= 340) return 0;
    if (h < 42) return 7;
    if (h < 70) return 4;
    if (h < 165) return 3;
    if (h < 200) return 2;
    if (h < 255) return 8;
    return 1;
  }
  function isFire(c) {
    const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return true;
    const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 40) return false;
    let h = mx === r ? ((g - b) / (mx - mn)) * 60 : mx === g ? (2 + (b - r) / (mx - mn)) * 60 : (4 + (r - g) / (mx - mn)) * 60;
    if (h < 0) h += 360;
    return h <= 55 && b < 140;
  }

  // ---------- vệt chém (img/slash.png) ----------
  // hàng: 0 vệt dài (đâm) • 1 vầng trăng mảnh • 2 quạt xoáy • 3 trăng khuyết lớn • 4 mũi nhọn (đâm nhanh)
  const SLASH_ROWS = [{ y: 0, w: 110, h: 36, n: 8 }, { y: 36, w: 91, h: 83, n: 8 }, { y: 119, w: 96, h: 89, n: 8 }, { y: 208, w: 90, h: 127, n: 8 }, { y: 335, w: 104, h: 42, n: 5 }];
  const Slash = {
    cache: new Map(),
    row(ri, color) {
      const key = ri + '|' + color;
      let c = this.cache.get(key); if (c) return c;
      const im = img('img/slash.png'); if (!im) return null;
      const R = SLASH_ROWS[ri];
      c = document.createElement('canvas'); c.width = R.w * R.n; c.height = R.h;
      const x = c.getContext('2d');
      x.drawImage(im, 0, R.y, R.w * R.n, R.h, 0, 0, R.w * R.n, R.h);
      x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.6; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
      x.globalAlpha = 0.25; x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
      if (this.cache.size > 80) this.cache.clear();
      this.cache.set(key, c);
      return c;
    },
    // vẽ khung theo tiến độ k, tâm (0,0), kích thước w×h px
    draw(ctx, ri, color, k, w, h) {
      const sheet = this.row(ri, color); if (!sheet) return false;
      const R = SLASH_ROWS[ri], fi = Math.min(R.n - 1, Math.floor(clamp(k, 0, 0.999) * R.n));
      ctx.drawImage(sheet, fi * R.w, 0, R.w, R.h, -w / 2, -h / 2, w, h);
      return true;
    },
  };
  // vệt chém vầng trăng thon hai đầu (tọa độ màn hình)
  function crescent(ctx, x, y, r, a0, sweep, thick, color, alpha) {
    if (sweep < 0.02 || r < 1) return;
    const N = 18;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const a = a0 + sweep * i / N; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    for (let i = N; i >= 0; i--) { const u = i / N, a = a0 + sweep * u, t = thick * Math.sin(Math.PI * Math.pow(u, 0.8)); ctx.lineTo(x + Math.cos(a) * (r - t), y + Math.sin(a) * (r - t)); }
    ctx.closePath();
    ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fill();
  }

  // ---------- vụ nổ (img/explosion.png: 9 khung 160px) ----------
  const Expl = {
    cache: new Map(), N: 9, S: 160,
    sheet(color) {
      const im = img('img/explosion.png'); if (!im) return null;
      if (!color || isFire(color)) return im;
      let c = this.cache.get(color); if (c) return c;
      c = document.createElement('canvas'); c.width = this.S * this.N; c.height = this.S;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.55; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
      if (this.cache.size > 40) this.cache.clear();
      this.cache.set(color, c);
      return c;
    },
    // D: đường kính lúc nổ to nhất (px)
    draw(ctx, x, y, D, k, color) {
      const sh = this.sheet(color); if (!sh) return false;
      const fi = Math.min(this.N - 1, Math.floor(clamp(k, 0, 0.999) * this.N)), s = D * this.S / 156;
      ctx.drawImage(sh, fi * this.S, 0, this.S, this.S, x - s / 2, y - s / 2, s, s);
      return true;
    },
  };

  // ---------- bộ sprite "Free" + khói ----------
  const DEF = {
    ring: { src: 'img/Free/Part 1/03.png', n: 13 },     // vòng năng lượng (sóng xung kích)
    rune: { src: 'img/Free/Part 1/26.png', n: 14 },     // vòng phù văn (chiêu cuối)
    swirl: { src: 'img/Free/Part 6/296.png', n: 9 },    // xoáy (dịch chuyển)
    burst: { src: 'img/Free/Part 6/293.png', n: 9 },    // tia nổ (đòn nặng)
    spark: { src: 'img/Free/Part 7/315.png', n: 7 },    // tia lửa trúng đòn
    sun: { src: 'img/Free/Part 12/586.png', n: 14 },    // vầng chấn động
    skull: { src: 'img/Free/Part 13/633.png', n: 15 },  // đầu lâu (hạ gục)
    halo: { src: 'img/Free/Part 9/439.png', n: 10 },    // hào quang (khiên, hồi sinh, thanh tẩy)
    bolt: { src: 'img/Free/Part 9/448.png', n: 10 },    // tia điện
    flower: { src: 'img/Free/Part 7/335.png', n: 9 },   // hoa (hồi máu)
    cloud: { src: 'img/Free/Part 10/476.png', n: 12 },  // mây khí (độc, khói)
    smoke: { src: 'img/Free Smoke Fx  Pixel 05.png', n: 10, row: 0, white: true },
    puff: { src: 'img/Free Smoke Fx  Pixel 05.png', n: 10, row: 8, white: true },
    dust: { src: 'img/Free Smoke Fx  Pixel 07.png', n: 14, row: 16, white: true },
  };
  const TINT = {};
  function tinted(def, color) {
    const im = img(def.src); if (!im) return null;
    if (!color) return im;
    const k = def.src + color;
    if (TINT[k]) return TINT[k];
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = color; x.globalAlpha = 0.7; x.fillRect(0, 0, c.width, c.height);
    return (TINT[k] = c);
  }
  // vẽ sprite key tại (x,y) px, cạnh s px, tiến độ k
  function sprite(ctx, key, x, y, s, k, o) {
    const def = DEF[key]; if (!def) return false;
    o = o || {};
    const im = def.white ? tinted(def, o.tint) : img(def.src); if (!im) return false;
    const fr = Math.min(def.n - 1, Math.floor(clamp(k, 0, 0.999) * def.n));
    const row = def.row != null ? def.row : o.row != null ? o.row : vfxRow(o.color);
    ctx.save();
    ctx.translate(x, y); if (o.a) ctx.rotate(o.a);
    ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * (k > 0.85 ? (1 - k) / 0.15 : 1);
    ctx.imageSmoothingEnabled = false;
    if (o.add) ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(im, fr * 64, row * 64, 64, 64, -s / 2, -s / 2, s, s);
    ctx.restore();
    return true;
  }
  // đạn dạng ảnh: [hàng, cột đầu] (8 khung, ô 24px)
  const BULLET = 'img/500 Bullet 24x24 Free/Bullet 24x24 Free Part 1A.png';
  const BULLET_ANIM = { swirlA: [0, 0], ringA: [0, 8], swirlB: [5, 0], ringB: [5, 8], swirlP: [10, 0], ringP: [10, 8], starA: [3, 16] };
  function bullet(ctx, anim, x, y, s, t) {
    const im = img(BULLET), a = BULLET_ANIM[anim]; if (!im || !a) return false;
    const fr = Math.floor(t * 16) % 8;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(im, (a[1] + fr) * 24, a[0] * 24, 24, 24, x - s / 2, y - s / 2, s, s);
    ctx.restore();
    return true;
  }
  function preload() { if (typeof Image === 'undefined') return; for (const k in DEF) img(DEF[k].src); img(BULLET); img('img/slash.png'); img('img/explosion.png'); }
  preload();

  // ---------- quản lý hiệu ứng ----------
  // mỗi hiệu ứng: { k: loại, t0, life, x, y (đv) ... }; hạt: { x, y, vx, vy, t0, life, s, c, g }
  class VFX {
    constructor() { this.list = []; this.parts = []; this.shakeA = 0; this.shakeT = 0; this.flashA = 0; this.flashC = '#ffffff'; this.seed = 1; }
    rnd() { this.seed = (this.seed * 16807) % 2147483647; return this.seed / 2147483647; }
    clear() { this.list = []; this.parts = []; this.shakeA = 0; this.flashA = 0; }
    add(now, o) { o.t0 = now; if (this.list.length > 320) this.list.splice(0, 60); this.list.push(o); return o; }
    shake(a) { this.shakeA = Math.max(this.shakeA, a); }
    flash(a, c) { this.flashA = Math.max(this.flashA, a); this.flashC = c || '#ffffff'; }
    burstParts(now, x, y, n, o) {
      o = o || {};
      for (let i = 0; i < n; i++) {
        if (this.parts.length > 520) this.parts.shift();
        const a = (o.a != null ? o.a + (this.rnd() - 0.5) * (o.spread || TAU) : this.rnd() * TAU), sp = (o.speed || 4) * (0.4 + this.rnd() * 0.8);
        this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t0: now, life: (o.life || 0.45) * (0.6 + this.rnd() * 0.6), s: (o.size || 0.12) * (0.6 + this.rnd() * 0.8), c: o.color || '#ffd890', g: o.drag || 3 });
      }
    }
    // ----- chuyển sự kiện của trận thành hiệu ứng -----
    fromEvent(e, m, now, unitOf) {
      const col = e.color || (G.SLOT_COL && G.SLOT_COL[e.team]) || '#ffffff';
      switch (e.type) {
        case 'swing': {
          const u = unitOf(e.id); if (!u) return;
          const gfx = u.hero ? u.hero.gfx : u.gfx, a = Math.atan2(e.ty - e.y, e.tx - e.x), c = (u.hero && u.hero.color) || u.color || '#ffffff';
          if (e.ranged) {
            if (gfx === 'pistol' || gfx === 'revolver' || gfx === 'rifle' || gfx === 'shotgun' || gfx === 'dual' || gfx === 'crossbow')
              this.add(now, { k: 'muzzle', x: e.x + Math.cos(a) * u.r * 1.3, y: e.y + Math.sin(a) * u.r * 1.3, a, life: 0.12, c: '#ffe9a0', big: gfx === 'shotgun' });
            return;
          }
          const reach = (u.st ? u.st.range : 1.6) + u.r;
          if (gfx === 'spear' || gfx === 'rapier') this.add(now, { k: 'thrust', x: e.x, y: e.y, a, len: reach + 0.4, w: 0.55, c, life: 0.22 });
          else if (gfx === 'fist' || gfx === 'claw') this.add(now, { k: 'spr', key: 'spark', x: e.tx, y: e.ty, s: 1.3, c, life: 0.22 });
          else if (gfx === 'guardian') { this.add(now, { k: 'spr', key: 'burst', x: e.tx, y: e.ty, s: 1.8, c: '#9fe0b0', life: 0.3 }); this.add(now, { k: 'slash', x: e.x, y: e.y, a, r: reach * 0.85, arc: 1.4, w: 0.55, c: '#7ae0a0', life: 0.24, flip: (now * 7 | 0) & 1 }); }   // GĐ9: Oktava vồ / dậm
          else this.add(now, { k: 'slash', x: e.x, y: e.y, a, r: reach * 0.78, arc: 1.9, w: 0.42, c, life: 0.26, flip: (now * 7 | 0) & 1 });
          return;
        }
        case 'cone': {
          const a = Math.atan2(e.dy, e.dx), arc = clamp(2 * Math.acos(clamp(e.c, -1, 1)), 0.6, TAU);
          if (e.fx === 'flame') { this.add(now, { k: 'flame', x: e.x, y: e.y, a, r: e.r, arc, c: col, life: 0.55 }); this.burstParts(now, e.x, e.y, 12, { a, spread: arc, color: '#ffb04a', speed: e.r * 3, life: 0.5, size: 0.16 }); return; }
          if (e.fx === 'roar') { this.add(now, { k: 'spr', key: 'sun', x: e.x + Math.cos(a) * e.r * 0.4, y: e.y + Math.sin(a) * e.r * 0.4, s: e.r * 1.6, c: col, life: 0.5 }); this.shake(4); return; }
          if (e.fx === 'punch') { this.add(now, { k: 'spr', key: 'burst', x: e.x + Math.cos(a) * e.r * 0.6, y: e.y + Math.sin(a) * e.r * 0.6, s: 2.2, c: col, life: 0.3 }); this.shake(3); return; }
          if (arc > 5.2) { this.add(now, { k: 'whirl', x: e.x, y: e.y, a, r: e.r * 0.85, w: 0.5, c: col, life: 0.4 }); return; }
          this.add(now, { k: 'slash', x: e.x, y: e.y, a, r: e.r * 0.8, arc, w: Math.max(0.35, e.r * 0.2), c: col, heavy: e.r > 2.9 || e.fx === 'slash', life: 0.34 });
          return;
        }
        case 'line': {
          const a = Math.atan2(e.y2 - e.y, e.x2 - e.x), len = Math.hypot(e.x2 - e.x, e.y2 - e.y);
          if (e.fx === 'quake') { this.add(now, { k: 'crack', x: e.x, y: e.y, a, len, w: e.w, c: col, life: 0.6 }); for (let i = 1; i <= 3; i++) this.add(now, { k: 'spr', key: 'dust', x: e.x + Math.cos(a) * len * i / 3.5, y: e.y + Math.sin(a) * len * i / 3.5, s: e.w * 1.8, tint: '#c8b088', life: 0.6 }); this.shake(4); return; }
          if (e.fx === 'wave') { this.add(now, { k: 'wave', x: e.x, y: e.y, a, len, w: e.w, c: col, life: 0.45 }); return; }
          if (e.fx === 'thrust' || e.w <= 1.5) { this.add(now, { k: 'thrust', x: e.x, y: e.y, a, len, w: Math.max(0.5, e.w), c: col, life: 0.3, heavy: len > 4.5 }); return; }
          this.add(now, { k: 'beam', x: e.x, y: e.y, a, len, w: e.w, c: col, life: 0.35 });
          return;
        }
        case 'ring': {
          if (e.fx === 'whirl') { this.add(now, { k: 'whirl', x: e.x, y: e.y, a: now * 3, r: e.r * 0.85, w: 0.5, c: col, life: 0.42 }); return; }
          if (e.fx === 'boom' || e.fx === 'firering') { this.add(now, { k: 'expl', x: e.x, y: e.y, d: e.r * 2.1, c: e.fx === 'firering' ? '#ff7a2a' : col, life: 0.5 }); this.burstParts(now, e.x, e.y, 10, { color: '#ffcf7a', speed: e.r * 2.5 }); this.shake(e.r > 2.5 ? 4 : 2); return; }
          if (e.fx === 'quake') { this.add(now, { k: 'spr', key: 'sun', x: e.x, y: e.y, s: e.r * 2.2, c: col, life: 0.55 }); this.add(now, { k: 'spr', key: 'dust', x: e.x, y: e.y, s: e.r * 2.4, tint: '#c8b088', life: 0.7, alpha: 0.7 }); this.shake(5); return; }
          if (e.fx === 'roar') { this.add(now, { k: 'spr', key: 'sun', x: e.x, y: e.y, s: e.r * 2.2, c: col, life: 0.5 }); this.shake(4); return; }
          this.add(now, { k: 'spr', key: 'ring', x: e.x, y: e.y, s: e.r * 2.3, c: col, life: 0.42, alpha: 0.9 });
          this.add(now, { k: 'ringline', x: e.x, y: e.y, r: e.r, c: col, life: 0.3 });
          return;
        }
        case 'boom': {
          const R = e.big ? 4.5 : e.r || 2.4;
          this.add(now, { k: 'expl', x: e.x, y: e.y, d: R * 2, c: e.color || null, life: e.big ? 0.7 : 0.5 });
          this.burstParts(now, e.x, e.y, e.big ? 22 : 10, { color: e.color && !isFire(e.color) ? e.color : '#ffc060', speed: R * 2.4, life: 0.55 });
          this.shake(e.big ? 7 : 3); if (e.big) this.flash(0.25, '#fff2d0');
          return;
        }
        case 'quake': this.add(now, { k: 'spr', key: 'sun', x: e.x, y: e.y, s: (e.r || 3) * 2.2, c: '#ffd88a', life: 0.6 }); this.add(now, { k: 'spr', key: 'dust', x: e.x, y: e.y, s: (e.r || 3) * 2.4, tint: '#c8b088', life: 0.8, alpha: 0.75 }); this.shake(6); return;
        case 'burst': this.add(now, { k: 'spr', key: 'burst', x: e.x, y: e.y, s: 2.4, c: col, life: 0.35 }); this.burstParts(now, e.x, e.y, 8, { color: col, speed: 5 }); return;
        case 'spark': this.add(now, { k: 'spr', key: 'spark', x: e.x, y: e.y, s: 1.2, c: col, life: 0.25 }); return;
        case 'slash': this.add(now, { k: 'slash', x: e.x - Math.cos(e.a || 0) * 0.8, y: e.y - Math.sin(e.a || 0) * 0.8, a: e.a != null ? e.a : now * 9, r: e.big ? 2.0 : 1.4, arc: 2.2, w: 0.5, c: col, heavy: true, life: 0.3 }); this.add(now, { k: 'spr', key: 'spark', x: e.x, y: e.y, s: 1.3, c: col, life: 0.25 }); return;
        case 'phantom': {
          const a = e.a || 0, gx = e.x - Math.cos(a) * 1.6, gy = e.y - Math.sin(a) * 1.6;
          this.add(now, { k: 'ghost', x: gx, y: gy, r: 0.6, c: col, life: 0.4 });
          this.add(now, { k: 'slash', x: gx, y: gy, a, r: 1.6, arc: 2.0, w: 0.45, c: col, heavy: true, life: 0.3 });
          return;
        }
        case 'shadeHit': {
          const base = Math.atan2(e.sy - e.y, e.sx - e.x), n = e.n || 2;
          for (let i = 1; i <= n; i++) {
            const a = base + i * TAU / (n + 1), gx = e.x + Math.cos(a) * 1.7, gy = e.y + Math.sin(a) * 1.7;
            this.add(now, { k: 'ghost', x: gx, y: gy, r: 0.65, c: '#8a7aa8', life: 0.45, scythe: true });
            this.add(now, { k: 'slash', x: gx, y: gy, a: a + Math.PI, r: 1.7, arc: 2.1, w: 0.45, c: '#b0a0ff', heavy: true, life: 0.32 });
          }
          return;
        }
        case 'dashtrail': {
          const n = 4;
          for (let i = 0; i < n; i++) this.add(now, { k: 'ghost', x: e.x + (e.x2 - e.x) * i / n, y: e.y + (e.y2 - e.y) * i / n, r: 0.55, c: col, life: 0.25 + 0.06 * i });
          this.add(now, { k: 'spr', key: 'puff', x: e.x, y: e.y + 0.3, s: 1.6, tint: '#d8d0c0', life: 0.45, alpha: 0.8 });
          return;
        }
        case 'blink': this.add(now, { k: 'spr', key: 'swirl', x: e.x, y: e.y, s: 2.2, c: '#b070ff', life: 0.45 }); this.add(now, { k: 'spr', key: 'swirl', x: e.x2, y: e.y2, s: 2.2, c: '#b070ff', life: 0.45 }); return;
        case 'parry': this.add(now, { k: 'spr', key: 'burst', x: e.x, y: e.y, s: 2.6, c: '#ffffff', life: 0.3 }); this.add(now, { k: 'text', id: e.id, text: '⚔ ĐỠ!', c: '#bfe4ff', life: 0.9, big: true }); this.flash(0.12); return;
        case 'combo': this.add(now, { k: 'text', id: e.id, text: '✦ COMBO ' + e.name, c: '#ffd0e0', life: 0.9, big: true }); return;
        case 'callout': this.add(now, { k: 'text', id: e.id, text: e.text, c: e.color || '#ffd24a', life: 1.0, big: true }); return;
        case 'miss': this.add(now, { k: 'text', x: e.x, y: e.y, text: 'TRƯỢT', c: '#c8c8c8', life: 0.6 }); return;
        case 'harmony': {
          const u = unitOf(e.id); if (!u) return;
          const hc = e.k === 's1' ? '#ff7a7a' : e.k === 's2' ? '#7ab8ff' : e.k === 's3' ? '#ffe07a' : '#d0a0ff';
          this.add(now, { k: 'spr', key: 'ring', x: u.x, y: u.y, s: 5, c: hc, life: 0.6 });
          this.add(now, { k: 'text', id: e.id, text: e.k === 'lull' ? '♪ KHÚC CA RU NGỦ' : '♪ HÒA ÂM', c: hc, life: 1 });
          return;
        }
        case 'note': {
          if (e.id == null) return;
          const nc = e.k === 's1' ? '#ff7a7a' : e.k === 's2' ? '#7ab8ff' : e.k === 's3' ? '#ffe07a' : '#ffd24a';
          this.add(now, { k: 'text', id: e.id, text: e.k === 's1' || e.k === 's2' || e.k === 's3' ? '♪' : '🃏', c: nc, life: 0.7, dx: (this.rnd() - 0.5) * 1.2 });
          return;
        }
        case 'dmg': {
          // như bản Legacy: mỗi đòn trúng có tia sáng theo màu người đánh (tia nhỏ → bùng → mặt trời theo độ nặng),
          // hạt văng xen trắng / màu người đánh, đòn nặng thì rung màn hình + chớp trắng
          if (!(e.v >= 1)) return;
          const mag = e.v * (e.crit ? 1.6 : 1), big = e.crit || mag > 120, huge = mag > 260;
          const ac = e.c || (e.dt === 'magic' ? '#c070ff' : e.dt === 'true' ? '#ffffff' : '#ffb050');
          if (e.hero || e.v >= 25) {
            const key = huge ? 'sun' : big ? 'burst' : 'spark';
            this.add(now, { k: 'spr', key, x: e.x + (this.rnd() - 0.5) * 0.4, y: e.y - 0.15 + (this.rnd() - 0.5) * 0.4, s: huge ? 2.6 : big ? 1.9 : 1.25, c: ac, life: key === 'spark' ? 0.28 : 0.45 });
          }
          if (e.hero || e.v >= 40) {
            const n = Math.min(14, 3 + Math.round(mag / 18)), a = e.ox != null ? Math.atan2(e.y - e.oy, e.x - e.ox) : null;
            for (let i = 0; i < n; i++) this.burstParts(now, e.x, e.y, 1, { color: i % 2 ? '#ffffff' : ac, speed: 8, life: 0.36, size: 0.13, a, spread: a != null ? 2.6 : TAU, drag: 5 });
          }
          if (e.hero && big) { this.shake(Math.min(6, 1.5 + mag / 90)); if (huge) this.add(now, { k: 'flash', x: e.x, y: e.y, r: 1.2 + mag / 200, life: 0.12 }); }
          return;
        }
        case 'heal': if (e.v >= 40) this.add(now, { k: 'spr', key: 'flower', x: e.x, y: e.y, s: 1.6, c: '#7aff9a', life: 0.5, alpha: 0.8 }); return;
        case 'death': this.add(now, { k: 'spr', key: 'skull', x: e.x, y: e.y, s: 2.6, c: '#ffffff', life: 1.0 }); this.add(now, { k: 'spr', key: 'smoke', x: e.x, y: e.y, s: 3, tint: '#9a9aa8', life: 0.8, alpha: 0.7 }); this.shake(3); return;
        case 'aura': if (e.id != null) this.add(now, { k: 'aura', id: e.id, c: e.color || '#ffffff', life: Math.max(0.35, Math.min(e.life || 0.5, 6)) }); return;
        case 'lock': if (e.id != null) this.add(now, { k: 'lock', id: e.id, c: e.color || '#e0e0ff', life: Math.min(e.life || 3, 8) }); return;
        case 'shades': if (e.id != null) this.add(now, { k: 'shades', id: e.id, c: '#8a7aa8', life: Math.min(e.life || 5, 8) }); return;
        case 'cast': {
          const u = unitOf(e.id); if (!u) return;
          // như bản Legacy: tên chiêu bật lên trên đầu tướng (chiêu cuối: chữ to, màu tướng)
          const sk = u.hero && u.hero.skills && u.hero.skills[e.key];
          if (sk && sk.name && u.kind === 'hero') this.add(now, { k: 'text', id: e.id, text: (e.key === 's4' ? '✦ ' : '') + sk.name + (e.key === 's4' ? '!' : ''), c: e.key === 's4' ? (u.hero.color || '#ffd24a') : '#f4ecd0', life: e.key === 's4' ? 1.4 : 0.9, big: e.key === 's4', dy: e.key === 's4' ? -0.6 : 0 });
          if (e.key !== 's4') return;
          this.add(now, { k: 'spr', key: 'rune', x: e.x, y: e.y, s: 3.6, c: (u.hero && u.hero.color) || '#ffffff', life: 0.8, under: true });
          this.flash(0.08, (u.hero && u.hero.color) || '#ffffff');
          return;
        }
        case 'soulpick': {   // nhặt mảnh hồn: vầng sáng màu bậc + chữ bay lên trên đầu người nhặt
          const T = G.SOUL_TIER && G.SOUL_TIER[e.tier]; if (!T) return;
          this.add(now, { k: 'spr', key: 'halo', x: e.x, y: e.y, s: 1.6 + 0.3 * e.tier, c: T.color, life: 0.5 });
          const SD = G.SHARDS && G.SHARDS[e.soulType];
          if (e.id != null) this.add(now, { k: 'text', id: e.id, text: '+' + (SD ? G.shardIcon(SD.id) + ' ' + SD.n.replace(/^Hồn /, '') : '💠 ' + T.name), c: T.color, life: 1.1, big: e.tier >= 4, dy: -0.3 });
          return;
        }
        case 'lvl': this.add(now, { k: 'spr', key: 'halo', x: e.x, y: e.y, s: 2.6, c: '#ffe07a', life: 0.6 }); return;
        case 'recallStart': this.add(now, { k: 'spr', key: 'rune', x: e.x, y: e.y, s: 2.6, c: '#7ac0ff', life: 1.2, under: true }); return;
        case 'recall': this.add(now, { k: 'spr', key: 'swirl', x: e.x, y: e.y, s: 2.6, c: '#7ac0ff', life: 0.5 }); return;
        case 'spell': {
          const S = { flash: ['swirl', '#b070ff'], heal: ['flower', '#7aff9a'], ignite: ['burst', '#ff7a2a'], smite: ['bolt', '#ffd24a'], cleanse: ['halo', '#ffffff'], barrier: ['halo', '#ffe07a'], exhaust: ['skull', '#c070ff'], ghost: ['swirl', '#9fd0ff'] }[e.name] || ['ring', '#ffffff'];
          if (e.x != null) this.add(now, { k: 'spr', key: S[0], x: e.x, y: e.y, s: 2.2, c: S[1], life: 0.45 });
          return;
        }
        case 'item': if (e.x != null) this.add(now, { k: 'spr', key: 'halo', x: e.x, y: e.y, s: 2, c: '#ffd24a', life: 0.4 }); return;
        default: return;
      }
    }
    // ----- cập nhật hạt + bỏ hiệu ứng hết hạn -----
    update(now, dtReal) {
      if (this.list.length) this.list = this.list.filter((f) => now - f.t0 < f.life && now >= f.t0 - 0.05);
      if (this.parts.length) this.parts = this.parts.filter((p) => now - p.t0 < p.life && now >= p.t0 - 0.05);
      this.shakeA *= Math.pow(0.0015, dtReal); if (this.shakeA < 0.3) this.shakeA = 0;
      this.flashA *= Math.pow(0.002, dtReal); if (this.flashA < 0.01) this.flashA = 0;
    }
    shakeOffset(time) { if (!this.shakeA) return { x: 0, y: 0 }; return { x: Math.sin(time * 91) * this.shakeA, y: Math.cos(time * 77) * this.shakeA * 0.8 }; }
    // ----- vẽ (under = lớp dưới chân đơn vị) -----
    draw(ctx, r, now, under) {
      const z = r.cam.zoom;
      for (const f of this.list) {
        if (!!f.under !== under) continue;
        const k = clamp((now - f.t0) / f.life, 0, 1);
        let x = f.x, y = f.y;
        if (f.id != null) { const u = r.unitById(f.id); if (!u || !u.alive || !r.seen(u)) continue; const q = r.pos(u, r.alpha || 1); x = q.x; y = q.y; }
        if (x == null) continue;
        const p = r.w2s(x, y);
        if (p.x < -200 || p.y < -200 || p.x > r.W + 200 || p.y > r.H + 200) continue;
        if (r.view >= 0 && f.id == null && !r.visiblePoint(x, y)) continue;
        ctx.save();
        this.drawOne(ctx, f, p, k, z, now, r);
        ctx.restore();
      }
      if (!under) this.drawParts(ctx, r, now);
      ctx.globalAlpha = 1;
    }
    drawParts(ctx, r, now) {
      const z = r.cam.zoom;
      for (const q of this.parts) {
        const t = now - q.t0, k = t / q.life; if (k < 0 || k > 1) continue;
        const f = (1 - Math.exp(-q.g * t)) / q.g, x = q.x + q.vx * f, y = q.y + q.vy * f;
        const p = r.w2s(x, y), s = Math.max(1.2, q.s * z * (1 - k * 0.5));
        ctx.globalAlpha = 1 - k; ctx.fillStyle = q.c;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }
    drawOne(ctx, f, p, k, z, now, r) {
      const fade = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
      switch (f.k) {
        case 'slash': {
          const R = f.r * z, W = f.w * z, pp = easeOut(k / 0.55), tail = Math.max(0, pp - 0.55) * f.arc;
          // vệt sáng quét từ mép này sang mép kia của cung chém (f.flip: quét ngược chiều)
          let lo, hi;
          if (!f.flip) { lo = f.a - f.arc / 2 + tail; hi = f.a - f.arc / 2 + f.arc * pp; }
          else { hi = f.a + f.arc / 2 - tail; lo = f.a + f.arc / 2 - f.arc * pp; }
          crescent(ctx, p.x, p.y, R + W * 0.35, lo, hi - lo, W * (f.heavy ? 1.15 : 0.85), f.c, 0.55 * fade);
          crescent(ctx, p.x, p.y, R + W * 0.3, lo, hi - lo, W * 0.35, '#ffffff', 0.75 * fade);
          const chord = Math.max(0.8 * z, 2 * R * Math.sin(Math.min(f.arc, Math.PI * 0.95) / 2));
          ctx.globalAlpha = 0.85 * fade;
          if (f.heavy) { ctx.translate(p.x + Math.cos(f.a) * R * 0.55, p.y + Math.sin(f.a) * R * 0.55); ctx.rotate(f.a); Slash.draw(ctx, 3, f.c, k, chord * 0.82, chord * 1.15); }
          else { ctx.translate(p.x + Math.cos(f.a) * R * 0.62, p.y + Math.sin(f.a) * R * 0.62); ctx.rotate(f.a + Math.PI / 2); Slash.draw(ctx, 1, f.c, k, chord, chord * 0.9); }
          break;
        }
        case 'thrust': {
          const pp = easeOut(k / 0.5), L = f.len * z * (0.25 + 0.75 * pp), w = Math.max(5, f.w * z * 0.55) * (1 - k * 0.6);
          ctx.translate(p.x, p.y); ctx.rotate(f.a);
          const s0 = Math.max(6, L * k * 0.6);
          ctx.globalAlpha = 0.55 * fade; ctx.fillStyle = f.c;
          ctx.beginPath(); ctx.moveTo(s0, -w / 2); ctx.quadraticCurveTo(L * 0.7, -w * 0.6, L + 6, 0); ctx.quadraticCurveTo(L * 0.7, w * 0.6, s0, w / 2); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 0.85 * fade; ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.moveTo(s0 + 3, -w * 0.15); ctx.lineTo(L + 3, 0); ctx.lineTo(s0 + 3, w * 0.15); ctx.closePath(); ctx.fill();
          ctx.translate(L * 0.6, 0); ctx.globalAlpha = 0.8 * fade;
          Slash.draw(ctx, f.len < 3 ? 4 : 0, f.c, k, Math.max(0.6 * z, f.len * z * 0.8), Math.max(0.5 * z, f.w * z * 0.9));
          break;
        }
        case 'whirl': {
          const pp = easeOut(k / 0.7), rot = f.a + pp * Math.PI * 1.6, R = f.r * z * (0.85 + 0.15 * pp), W = f.w * z;
          for (let i = 0; i < 2; i++) {
            const a0 = rot + i * Math.PI;
            crescent(ctx, p.x, p.y, R, a0, Math.PI * 0.8, W * 1.4, f.c, 0.5 * fade);
            crescent(ctx, p.x, p.y, R, a0 + 0.1, Math.PI * 0.7, W * 0.45, '#ffffff', 0.7 * fade);
          }
          ctx.globalAlpha = 0.25 * fade; ctx.strokeStyle = f.c; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(p.x, p.y, f.r * z * (0.9 + 0.15 * k), 0, TAU); ctx.stroke();
          ctx.globalAlpha = 0.8 * fade; Slash.draw(ctx, 2, f.c, k, f.r * z * 2, f.r * z * 2);
          break;
        }
        case 'expl':
          if (!Expl.draw(ctx, p.x, p.y, f.d * z, k, f.c)) {
            const R = f.d * z / 2 * (0.5 + k * 0.6), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
            g.addColorStop(0, 'rgba(255,240,180,0.95)'); g.addColorStop(0.5, 'rgba(255,120,30,0.7)'); g.addColorStop(1, 'rgba(120,30,0,0)');
            ctx.globalAlpha = 1 - k; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.fill();
          }
          break;
        case 'spr':
          if (!sprite(ctx, f.key, p.x, p.y, f.s * z, k, { color: f.c, tint: f.tint, alpha: f.alpha, a: f.a })) {
            ctx.globalAlpha = (1 - k) * 0.7; ctx.strokeStyle = f.c || f.tint || '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(p.x, p.y, f.s * z * 0.4 * (0.6 + k), 0, TAU); ctx.stroke();
          }
          break;
        case 'flash':
          ctx.globalAlpha = (1 - k) * 0.8; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p.x, p.y, f.r * z * (1 + k), 0, TAU); ctx.fill();
          break;
        case 'ringline':
          ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = f.c; ctx.lineWidth = 2 + 3 * (1 - k);
          ctx.beginPath(); ctx.arc(p.x, p.y, f.r * z * (0.7 + 0.3 * easeOut(k)), 0, TAU); ctx.stroke();
          break;
        case 'beam': {
          const L = f.len * z, w = f.w * z * (1 - k * 0.5);
          ctx.translate(p.x, p.y); ctx.rotate(f.a);
          const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.15, '#ffffff'); g.addColorStop(1, f.c);
          ctx.globalAlpha = 0.6 * (1 - k); ctx.fillStyle = g; ctx.fillRect(0, -w / 2, L * easeOut(k * 2.5), w);
          ctx.globalAlpha = 0.85 * (1 - k); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -w * 0.12, L * easeOut(k * 2.5), w * 0.24);
          break;
        }
        case 'wave': {
          const L = f.len * z, pp = easeOut(k), x0 = L * pp;
          ctx.translate(p.x, p.y); ctx.rotate(f.a);
          ctx.strokeStyle = f.c; ctx.lineCap = 'round';
          for (let i = 0; i < 3; i++) { const xx = x0 - i * 0.7 * z; if (xx < 0) continue; ctx.globalAlpha = (1 - k) * (0.9 - i * 0.25); ctx.lineWidth = Math.max(2, 0.18 * z); ctx.beginPath(); ctx.arc(xx - f.w * z * 0.5, 0, f.w * z * 0.5, -0.9, 0.9); ctx.stroke(); }
          break;
        }
        case 'crack': {
          const L = f.len * z * easeOut(k * 2);
          ctx.translate(p.x, p.y); ctx.rotate(f.a);
          ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = Math.max(2, 0.18 * z); ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(0, 0);
          for (let i = 1; i <= 8; i++) ctx.lineTo(L * i / 8, ((i * 37) % 7 - 3) * 0.06 * z);
          ctx.stroke();
          ctx.globalAlpha = (1 - k) * 0.5; ctx.strokeStyle = f.c; ctx.lineWidth = Math.max(1, 0.08 * z); ctx.stroke();
          break;
        }
        case 'flame': {
          // nón lửa: quạt gradient lập lòe + lưỡi lửa liếm ra theo thời gian
          const R = f.r * z * (0.55 + 0.45 * easeOut(k * 3)), h = f.arc / 2;
          ctx.translate(p.x, p.y); ctx.rotate(f.a);
          const g = ctx.createRadialGradient(0, 0, R * 0.05, 0, 0, R);
          g.addColorStop(0, 'rgba(255,250,210,0.95)'); g.addColorStop(0.3, 'rgba(255,190,70,0.85)'); g.addColorStop(0.7, 'rgba(255,90,20,0.55)'); g.addColorStop(1, 'rgba(160,30,0,0)');
          ctx.globalAlpha = (1 - k) * (0.85 + 0.15 * Math.sin(now * 40));
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, -h, h); ctx.closePath(); ctx.fill();
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 7; i++) {
            const t = (k * 2.2 + i / 7) % 1, d = R * (0.2 + 0.8 * t), off = Math.sin(i * 2.4 + now * 6) * d * Math.tan(h) * 0.7, s2 = (0.25 + 0.45 * t) * z;
            ctx.globalAlpha = (1 - t) * (1 - k) * 0.7; ctx.fillStyle = i & 1 ? '#ffd27a' : '#ff8a3a';
            ctx.beginPath(); ctx.arc(d, off, s2, 0, TAU); ctx.fill();
          }
          break;
        }
        case 'muzzle': {
          ctx.translate(p.x, p.y); ctx.rotate(f.a);
          const s = (f.big ? 1.2 : 0.7) * z;
          ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fff6c0';
          ctx.beginPath(); ctx.moveTo(0, -s * 0.25); ctx.lineTo(s, 0); ctx.lineTo(0, s * 0.25); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,200,90,0.8)'; ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, TAU); ctx.fill();
          break;
        }
        case 'ghost': {
          const R = f.r * z;
          ctx.globalAlpha = (1 - k) * 0.45; ctx.fillStyle = f.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.fill();
          ctx.globalAlpha = (1 - k) * 0.7; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
          if (f.scythe) { ctx.strokeStyle = '#d0c8ff'; ctx.lineWidth = Math.max(1.5, 0.1 * z); ctx.beginPath(); ctx.arc(p.x + R * 0.6, p.y - R * 1.3, R * 0.9, Math.PI * 0.9, Math.PI * 1.7); ctx.stroke(); }
          break;
        }
        case 'aura': {
          const u = r.unitById(f.id), R = (u ? u.r : 0.6) * z;
          const pulse = 0.85 + 0.15 * Math.sin(now * 10);
          ctx.globalAlpha = Math.min(1, (1 - k) * 3) * 0.55; ctx.strokeStyle = f.c; ctx.lineWidth = Math.max(2, 0.12 * z);
          ctx.beginPath(); ctx.arc(p.x, p.y, R * 1.45 * pulse, 0, TAU); ctx.stroke();
          ctx.globalAlpha = Math.min(1, (1 - k) * 3) * 0.18; ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(p.x, p.y, R * 1.45 * pulse, 0, TAU); ctx.fill();
          if (k < 0.25) sprite(ctx, 'halo', p.x, p.y, R * 4, k * 4, { color: f.c, alpha: 0.8 });
          break;
        }
        case 'lock': {
          const R = 1.3 * z;
          ctx.globalAlpha = Math.min(1, (1 - k) * 4) * 0.8; ctx.strokeStyle = f.c; ctx.lineWidth = 2; ctx.setLineDash([R * 0.35, R * 0.25]);
          ctx.beginPath(); ctx.arc(p.x, p.y, R, now * 2, now * 2 + TAU); ctx.stroke(); ctx.setLineDash([]);
          break;
        }
        case 'shades': {
          const n = 2, R = 1.7 * z;
          for (let i = 0; i < n; i++) {
            const a = now * 1.6 + i * Math.PI, x = p.x + Math.cos(a) * R, y = p.y + Math.sin(a) * R * 0.8;
            ctx.globalAlpha = Math.min(1, (1 - k) * 4) * 0.4; ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(x, y, 0.55 * z, 0, TAU); ctx.fill();
            ctx.globalAlpha *= 1.5; ctx.strokeStyle = '#d0c8ff'; ctx.lineWidth = Math.max(1.5, 0.1 * z); ctx.beginPath(); ctx.arc(x + 0.3 * z, y - 0.6 * z, 0.6 * z, Math.PI * 0.9, Math.PI * 1.7); ctx.stroke();
          }
          break;
        }
        case 'text': {
          if (z < 6) break;                                  // toàn cảnh: bớt chữ
          let x = p.x, y = p.y;
          const up = (0.8 + easeOut(k) * 1.6 + (f.big ? 0.4 : 0)) * z;
          x += (f.dx || 0) * z; y += (f.dy || 0) * z;
          const sc = k < 0.15 ? 1.35 - k * 2.3 : 1;
          ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
          ctx.font = `900 ${Math.round((f.big ? 15 : 12) * sc)}px system-ui,"Segoe UI",sans-serif`; ctx.textAlign = 'center';
          ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(f.text, x, y - up); ctx.fillStyle = f.c; ctx.fillText(f.text, x, y - up);
          break;
        }
        default: break;
      }
    }
    // chớp sáng toàn màn hình
    drawFlash(ctx, r) {
      if (!this.flashA) return;
      ctx.globalAlpha = Math.min(0.5, this.flashA); ctx.fillStyle = this.flashC; ctx.fillRect(0, 0, r.W, r.H); ctx.globalAlpha = 1;
    }
  }
  G.VFX = VFX;
  G.VfxDraw = { crescent, sprite, bullet, Slash, Expl, vfxRow };
})();
