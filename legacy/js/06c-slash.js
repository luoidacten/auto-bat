'use strict';
// ===== Hiệu ứng chém mượt: sprite sheet (img/slash.png) + vệt sáng vẽ tay có độ thon & ease-out =====
// Hàng sprite: 0 vệt dài (đâm) • 1 vầng trăng mảnh (chém nhẹ) • 2 quạt xoáy • 3 trăng khuyết lớn (chém mạnh) • 4 mũi nhọn (đâm nhanh)
const SLASH_ROWS = [{ y: 0, w: 110, h: 36, n: 8 }, { y: 36, w: 91, h: 83, n: 8 }, { y: 119, w: 96, h: 89, n: 8 }, { y: 208, w: 90, h: 127, n: 8 }, { y: 335, w: 104, h: 42, n: 5 }];
const SlashSprite = {
  img: null, ok: false, cache: new Map(),
  load() {
    if (this.img) return;
    this.img = new Image();
    this.img.onload = () => { this.ok = true; };
    this.img.src = '../img/slash.png';
  },
  // một hàng sprite đã nhuộm theo màu vũ khí (giữ được sắc độ gốc)
  row(ri, color) {
    const key = ri + '|' + color;
    let c = this.cache.get(key);
    if (c) return c;
    const R = SLASH_ROWS[ri];
    c = document.createElement('canvas'); c.width = R.w * R.n; c.height = R.h;
    const x = c.getContext('2d');
    x.drawImage(this.img, 0, R.y, R.w * R.n, R.h, 0, 0, R.w * R.n, R.h);
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.6; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.25; x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
    if (this.cache.size > 80) this.cache.clear();
    this.cache.set(key, c);
    return c;
  },
  // vẽ khung theo tiến độ k (0..1), tâm (0,0) trong hệ tọa độ hiện tại
  draw(ctx, ri, color, k, sx, sy) {
    if (!this.ok) return false;
    const R = SLASH_ROWS[ri], fi = Math.min(R.n - 1, Math.floor(k * R.n));
    const sheet = this.row(ri, color);
    ctx.drawImage(sheet, fi * R.w, 0, R.w, R.h, -R.w * sx / 2, -R.h * sy / 2, R.w * sx, R.h * sy);
    return true;
  },
};
SlashSprite.load();
const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

// vệt chém vầng trăng thon hai đầu, quét theo ease-out
function crescent(ctx, x, y, r, a0, sweep, thick, color, alpha) {
  const N = 18;
  if (sweep < 0.02) return;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) { const u = i / N, a = a0 + sweep * u; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  for (let i = N; i >= 0; i--) { const u = i / N, a = a0 + sweep * u, t = thick * Math.sin(Math.PI * Math.pow(u, 0.8)); ctx.lineTo(x + Math.cos(a) * (r - t), y + Math.sin(a) * (r - t)); }
  ctx.closePath();
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fill();
}
function drawSlashFx(ctx, o, k, m) {
  const fade = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
  if (o.type === 'slash') {
    // vệt sáng quét từ mép này sang mép kia của cung chém
    const p = easeOut(k / 0.55), a0 = o.a - o.arc / 2, sw = o.arc * p;
    const tail = Math.max(0, p - 0.55) * o.arc;
    crescent(ctx, o.x, o.y, o.r + o.w * 0.35, a0 + tail, sw - tail, o.w * (o.heavy ? 1.15 : 0.85), o.color, 0.55 * fade);
    crescent(ctx, o.x, o.y, o.r + o.w * 0.3, a0 + tail, sw - tail, o.w * 0.35, '#ffffff', 0.75 * fade);
    // sprite chồng lên (trăng khuyết mạnh / vầng trăng mảnh)
    ctx.save();
    const chord = Math.max(40, 2 * o.r * Math.sin(Math.min(o.arc, Math.PI * 0.95) / 2));
    if (o.heavy) {
      ctx.translate(o.x + Math.cos(o.a) * o.r * 0.55, o.y + Math.sin(o.a) * o.r * 0.55); ctx.rotate(o.a);
      const s = chord / 110; ctx.globalAlpha = 0.9 * fade;
      SlashSprite.draw(ctx, 3, o.color, k, s * 0.9, s);
    } else {
      ctx.translate(o.x + Math.cos(o.a) * o.r * 0.62, o.y + Math.sin(o.a) * o.r * 0.62); ctx.rotate(o.a + Math.PI / 2);
      const s = chord / 80; ctx.globalAlpha = 0.85 * fade;
      SlashSprite.draw(ctx, 1, o.color, k, s, s * 0.85);
    }
    ctx.restore();
  } else if (o.type === 'thrust') {
    // mũi sáng phóng ra rồi co lại
    const p = easeOut(k / 0.5), L = o.len * (0.25 + 0.75 * p), w = Math.max(6, o.w * 0.55) * (1 - k * 0.6);
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a);
    const s0 = Math.max(10, L * k * 0.6);
    ctx.globalAlpha = 0.55 * fade; ctx.fillStyle = o.color;
    ctx.beginPath(); ctx.moveTo(s0, -w / 2); ctx.quadraticCurveTo(L * 0.7, -w * 0.6, L + 8, 0); ctx.quadraticCurveTo(L * 0.7, w * 0.6, s0, w / 2); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.85 * fade; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(s0 + 4, -w * 0.15); ctx.lineTo(L + 4, 0); ctx.lineTo(s0 + 4, w * 0.15); ctx.closePath(); ctx.fill();
    ctx.translate(L * 0.6, 0);
    const sx = Math.max(0.6, o.len / 105), sy = Math.max(0.7, o.w / 30);
    ctx.globalAlpha = 0.8 * fade;
    SlashSprite.draw(ctx, o.len < 120 ? 4 : 0, o.color, k, sx, sy);
    ctx.restore();
  } else if (o.type === 'whirl') {
    // lốc xoáy: 2 vầng trăng xoay quanh tâm + vòng mờ lan ra
    const p = easeOut(k / 0.7), rot = o.a + p * Math.PI * 1.6;
    for (let i = 0; i < 2; i++) {
      const a0 = rot + i * Math.PI;
      crescent(ctx, o.x, o.y, o.r * (0.85 + 0.15 * p), a0, Math.PI * 0.8, o.w * 1.4, o.color, 0.5 * fade);
      crescent(ctx, o.x, o.y, o.r * (0.85 + 0.15 * p), a0 + 0.1, Math.PI * 0.7, o.w * 0.45, '#ffffff', 0.7 * fade);
    }
    ctx.globalAlpha = 0.25 * fade; ctx.strokeStyle = o.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r * (0.9 + 0.15 * k), 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ===== Sprite vụ nổ (img/explosion.png: 9 khung 160px, khung 6 là lúc nổ to nhất) =====
const ExplSprite = {
  img: null, ok: false, cache: new Map(), N: 9, S: 160, PEAK_R: 78,
  load() { if (this.img) return; this.img = new Image(); this.img.onload = () => { this.ok = true; }; this.img.src = '../img/explosion.png'; },
  // màu lửa → giữ nguyên; màu khác (phép, ảo thuật, băng...) → nhuộm theo màu của đòn
  sheet(color) {
    const fire = !color || isFireColor(color);
    if (fire) return this.img;
    let c = this.cache.get(color);
    if (c) return c;
    c = document.createElement('canvas'); c.width = this.S * this.N; c.height = this.S;
    const x = c.getContext('2d');
    x.drawImage(this.img, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.55; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    if (this.cache.size > 40) this.cache.clear();
    this.cache.set(color, c);
    return c;
  },
  // vẽ vụ nổ tâm (x,y), bán kính lúc to nhất r, tiến độ k (0..1)
  draw(ctx, x, y, r, k, color) {
    if (!this.ok) return false;
    const fi = Math.min(this.N - 1, Math.floor(clamp(k, 0, 0.999) * this.N));
    const D = this.S * (r / this.PEAK_R);
    ctx.save(); ctx.globalAlpha = 1;
    ctx.drawImage(this.sheet(color), fi * this.S, 0, this.S, this.S, x - D / 2, y - D / 2, D, D);
    ctx.restore();
    return true;
  },
};
ExplSprite.load();
// màu thuộc dải lửa (đỏ → cam → vàng) thì giữ sprite gốc
function isFireColor(c) {
  const m = /^#([0-9a-f]{6})$/i.exec(c); if (!m) return true;
  const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 40) return false;
  let h = mx === r ? ((g - b) / (mx - mn)) * 60 : mx === g ? (2 + (b - r) / (mx - mn)) * 60 : (4 + (r - g) / (mx - mn)) * 60;
  if (h < 0) h += 360;
  return h <= 55 && b < 140;
}
