'use strict';
const BULLET_SHEET = '../img/500 Bullet 24x24 Free/Bullet 24x24 Free Part 1A.png';
const BULLET_ANIM = { swirlA: [0, 0], ringA: [0, 8], swirlB: [5, 0], ringB: [5, 8], swirlP: [10, 0], ringP: [10, 8], starA: [3, 16] };
const VFX_IMG = {};
function vfxImg(src) {
  let im = VFX_IMG[src];
  if (!im) { im = VFX_IMG[src] = new Image(); im.src = encodeURI(src); }
  return im.complete && im.naturalWidth ? im : null;
}
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
function drawBulletSprite(ctx, anim, r, t) {
  const im = vfxImg(BULLET_SHEET), a = BULLET_ANIM[anim]; if (!im || !a) return false;
  const fr = Math.floor(t * 16) % 8, s = r * 2.6;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(im, (a[1] + fr) * 24, a[0] * 24, 24, 24, -s / 2, -s / 2, s, s);
  return true;
}
if (typeof document !== 'undefined') preloadVfx();
