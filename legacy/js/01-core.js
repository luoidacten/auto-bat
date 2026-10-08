'use strict';
// ===== Tiện ích chung, hằng số vật lý, sàn đấu =====
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const angDiff = (a, b) => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};
const fromAng = (a, l = 1) => ({ x: Math.cos(a) * l, y: Math.sin(a) * l });
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const fmt = (n) => Math.round(n).toLocaleString('vi-VN');

const KB_FRICTION = 2.4; // tốc độ tắt dần lực văng (1/s)
const BASE_SPEED = 205;  // tốc độ chạy cơ bản (px/s)
const GRAVITY = 1500;
const KG_SCALE = 0.64;   // hệ số tăng lực văng theo điểm văng %
const DMG_SCALE = 0.75;  // hệ số điểm văng gây ra (đánh đau)
const CD_SCALE = 0.85;   // hồi chiêu toàn cục (nhịp nhanh)
const LEDGE = 34;        // khoảng chênh vênh ngoài mép vẫn bám được

// ===== Điện thoại =====
const IS_MOBILE = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const PART_CAP = IS_MOBILE ? 180 : 500;   // giới hạn hạt hiệu ứng (đỡ nặng máy)
// tỉ lệ HUD theo cả chiều rộng lẫn chiều cao (màn ngang điện thoại thấp)
function hudScale(W, H) { return clamp(Math.min(W / 860, H / 560), 0.42, 1); }

// ===== Sàn đấu: hình tròn / elip / đa giác lồi =====
class Arena {
  constructor(def) {
    Object.assign(this, def);
    if (def.shape === 'rect') {
      const w = def.w / 2, h = def.h / 2;
      this.poly = [[-w, -h], [w, -h], [w, h], [-w, h]];
    } else if (def.shape === 'octa' || def.shape === 'ngon') {
      const n = def.n || 8;
      this.poly = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + TAU / (2 * n) + (def.rot || 0);
        this.poly.push([Math.cos(a) * def.r, Math.sin(a) * def.r * (def.squash || 0.72)]);
      }
    } else if (def.shape === 'circle') {
      this.a = this.b = def.r;
    }
    if (this.poly) {
      this.edges = this.poly.map((p, i) => {
        const q = this.poly[(i + 1) % this.poly.length];
        const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
        return { x: p[0], y: p[1], nx: -dy / L, ny: dx / L };
      });
      this.hx = Math.max(...this.poly.map((p) => Math.abs(p[0])));
      this.hy = Math.max(...this.poly.map((p) => Math.abs(p[1])));
    } else {
      this.hx = this.a; this.hy = this.b;
    }
    this.pillars = (def.pillars || []).map((p) => ({ ...p }));
  }
  // cột/tường gần nhất trong khoảng gap tính từ mép cột
  nearPillar(p, gap = 0) {
    let best = null, bd = Infinity;
    for (const c of this.pillars) {
      const d = Math.hypot(p.x - c.x, p.y - c.y) - c.r - (p.r || 0);
      if (d < gap && d < bd) { bd = d; best = c; }
    }
    return best;
  }
  // đoạn thẳng a→b có bị cột che không
  blocked(ax, ay, bx, by, pad = 0) {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    for (const c of this.pillars) {
      const t = clamp(((c.x - ax) * dx + (c.y - ay) * dy) / L2, 0, 1);
      if (Math.hypot(ax + dx * t - c.x, ay + dy * t - c.y) < c.r + pad) return c;
    }
    return null;
  }
  // khoảng cách tới mép (dương = bên trong)
  edgeDist(x, y) {
    if (this.poly) {
      let m = Infinity;
      for (const e of this.edges) {
        const d = (x - e.x) * e.nx + (y - e.y) * e.ny;
        if (d < m) m = d;
      }
      return m;
    }
    const L = Math.hypot(x, y);
    if (L < 1e-6) return Math.min(this.a, this.b);
    const c = x / L, s = y / L;
    const rdir = 1 / Math.sqrt((c / this.a) ** 2 + (s / this.b) ** 2);
    return rdir - L;
  }
  inside(x, y, margin = 0) { return this.edgeDist(x, y) >= margin; }
  clamp(p, margin = 0) {
    if (this.poly) {
      for (let k = 0; k < 3; k++) {
        for (const e of this.edges) {
          const d = (p.x - e.x) * e.nx + (p.y - e.y) * e.ny;
          if (d < margin) { p.x += e.nx * (margin - d); p.y += e.ny * (margin - d); }
        }
      }
      return p;
    }
    const L = Math.hypot(p.x, p.y);
    if (L < 1e-6) return p;
    const c = p.x / L, s = p.y / L;
    const rdir = 1 / Math.sqrt((c / this.a) ** 2 + (s / this.b) ** 2);
    if (L > rdir - margin) { const k = Math.max(0, rdir - margin) / L; p.x *= k; p.y *= k; }
    return p;
  }
  path(ctx, dy = 0, grow = 0) {
    ctx.beginPath();
    if (this.poly) {
      // phóng to nhẹ theo tâm để vẽ viền
      const k = grow ? 1 + grow / Math.max(this.hx, this.hy) : 1;
      this.poly.forEach((p, i) => (i ? ctx.lineTo(p[0] * k, p[1] * k + dy) : ctx.moveTo(p[0] * k, p[1] * k + dy)));
      ctx.closePath();
    } else {
      ctx.ellipse(0, dy, this.a + grow, this.b + grow, 0, 0, TAU);
    }
  }
}
