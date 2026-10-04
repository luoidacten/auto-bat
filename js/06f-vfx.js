'use strict';
// ===== VFX dạng ảnh (sprite sheet) =====
// Gói "Free": mỗi sheet 9 hàng màu × N khung 64px (0 đỏ hồng • 1 tím • 2 xanh lam nhạt • 3 xanh lá • 4 vàng cam • 5 trắng xám • 6 nâu • 7 lửa • 8 xanh dương)
// Khói "Free Smoke Fx": nét trắng 64px, mỗi hàng là 1 hiệu ứng • Đạn "500 Bullet": ô 24px, mỗi hàng 3 hoạt ảnh × 8 khung
const VFX_DEF = {
  ring:     { src: 'img/Free/Part 1/03.png', n: 13 },   // vòng xoáy năng lượng (sóng xung kích)
  rune:     { src: 'img/Free/Part 1/26.png', n: 14 },   // vòng phù văn (tung Nộ, Thấu Thị)
  swirl:    { src: 'img/Free/Part 6/296.png', n: 9 },   // xoáy (dịch chuyển, tốc biến)
  burst:    { src: 'img/Free/Part 6/293.png', n: 9 },   // tia nổ (đòn nặng)
  spark:    { src: 'img/Free/Part 7/315.png', n: 7 },   // tia lửa trúng đòn
  sun:      { src: 'img/Free/Part 12/586.png', n: 14 }, // vầng chấn động (đòn văng cực mạnh)
  skull:    { src: 'img/Free/Part 13/633.png', n: 15 }, // đầu lâu (rơi đài)
  halo:     { src: 'img/Free/Part 9/439.png', n: 10 },  // vầng hào quang (hồi sinh, thanh tẩy)
  bolt:     { src: 'img/Free/Part 9/448.png', n: 10 },  // tia điện (tê liệt, quá tải)
  flower:   { src: 'img/Free/Part 7/335.png', n: 9 },   // hoa (hồi phục)
  cloud:    { src: 'img/Free/Part 10/476.png', n: 12 }, // mây khí (độc, khói)
  smoke:    { src: 'img/Free Smoke Fx  Pixel 05.png', n: 10, row: 0, white: true },  // khói bung
  puff:     { src: 'img/Free Smoke Fx  Pixel 05.png', n: 10, row: 8, white: true },  // bụi chân
  dust:     { src: 'img/Free Smoke Fx  Pixel 07.png', n: 14, row: 16, white: true }, // mây bụi lớn
};
// đạn dạng ảnh: [sheet, hàng, cột bắt đầu] (8 khung, ô 24px)
const BULLET_SHEET = 'img/500 Bullet 24x24 Free/Bullet 24x24 Free Part 1A.png';
const BULLET_ANIM = { swirlA: [0, 0], ringA: [0, 8], swirlB: [5, 0], ringB: [5, 8], swirlP: [10, 0], ringP: [10, 8], starA: [3, 16] };
const VFX_IMG = {};
function vfxImg(src) {
  let im = VFX_IMG[src];
  if (!im) { im = VFX_IMG[src] = new Image(); im.src = encodeURI(src); }
  return im.complete && im.naturalWidth ? im : null;
}
// chọn hàng màu gần với màu chủ đạo
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
// cache ảnh trắng đã tô màu (khói)
const VFX_TINT = {};
function vfxTinted(def, color) {
  const im = vfxImg(def.src); if (!im) return null;
  if (!color) return im;
  const k = def.src + color;
  if (VFX_TINT[k]) return VFX_TINT[k];
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = color; x.globalAlpha = 0.7; x.fillRect(0, 0, c.width, c.height);
  return (VFX_TINT[k] = c);
}
function preloadVfx() { for (const k in VFX_DEF) vfxImg(VFX_DEF[k].src); vfxImg(BULLET_SHEET); }
// vẽ 1 sprite VFX (k = tiến độ 0..1)
function drawVfx(ctx, o, k) {
  const def = VFX_DEF[o.key]; if (!def) return;
  const im = def.white ? vfxTinted(def, o.tint) : vfxImg(def.src); if (!im) return;
  const fr = Math.min(def.n - 1, Math.floor(k * def.n)), row = def.row ?? o.row ?? 7, s = o.r * 2;
  ctx.save();
  ctx.translate(o.x, o.y); if (o.a) ctx.rotate(o.a);
  ctx.globalAlpha = (o.alpha ?? 1) * (k > 0.85 ? (1 - k) / 0.15 : 1);
  ctx.imageSmoothingEnabled = false;
  if (o.add) ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(im, fr * 64, row * 64, 64, 64, -s / 2, -s / 2, s, s);
  ctx.restore();
}
// vẽ 1 viên đạn dạng ảnh
function drawBulletSprite(ctx, anim, r, t) {
  const im = vfxImg(BULLET_SHEET), a = BULLET_ANIM[anim]; if (!im || !a) return false;
  const fr = Math.floor(t * 16) % 8, s = r * 2.6;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(im, (a[1] + fr) * 24, a[0] * 24, 24, 24, -s / 2, -s / 2, s, s);
  return true;
}
// lối tắt: tạo hiệu ứng sprite trong trận
function vfx(m, key, x, y, r, color, o = {}) {
  const def = VFX_DEF[key]; if (!def || !m || m.fxs.length > 220) return;
  m.fx(Object.assign({ type: 'sprite', key, x, y, r, row: def.white ? def.row : vfxRow(color), tint: def.white ? o.tint : null, life: o.life || 0.5 }, o));
}
// hiệu ứng phép bổ trợ
const SPELL_VFX = { flash: ['swirl', '#b070ff'], anchor: ['halo', '#a0a0a0'], pulse: ['ring', '#ffb030'], cleanse: ['halo', '#ffffff'], grapple: ['spark', '#a0d0ff'], purge: ['flower', '#60d0ff'],
  deflect: ['halo', '#5a8aff'], sight: ['rune', '#ffffff'], exhaust: ['skull', '#c070ff'], well: ['swirl', '#7050c0'], wall: ['bolt', '#5a8aff'], overclock: ['bolt', '#ffb030'] };
if (typeof document !== 'undefined') preloadVfx();
