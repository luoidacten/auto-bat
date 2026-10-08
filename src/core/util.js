'use strict';
// ===== Tiện ích chung + toán TẤT ĐỊNH =====
// Logic trận chỉ được dùng + − × ÷, Math.sqrt, Math.floor/abs/min/max (kết quả giống hệt trên mọi trình duyệt).
// sin/cos/atan2 dưới đây viết bằng đa thức để phát lại trận giống nhau ở mọi nơi (Math.sin có thể lệch chữ số cuối).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const PI = 3.141592653589793, TAU = 2 * PI, HALF = PI / 2;

  function sin(x) {
    x = x - TAU * Math.floor((x + PI) / TAU); // về [-π, π)
    if (x > HALF) x = PI - x; else if (x < -HALF) x = -PI - x; // về [-π/2, π/2]
    const x2 = x * x;
    return x * (1 + x2 * (-1 / 6 + x2 * (1 / 120 + x2 * (-1 / 5040 + x2 * (1 / 362880 + x2 * (-1 / 39916800 + x2 * (1 / 6227020800)))))));
  }
  function cos(x) { return sin(x + HALF); }
  function atanSmall(x) { // |x| ≤ 0.42
    const x2 = x * x;
    let s = 0, p = x, k = 1;
    for (let i = 0; i < 9; i++) { s += (i & 1 ? -p : p) / k; p *= x2; k += 2; }
    return s;
  }
  function atan(x) {
    const neg = x < 0; if (neg) x = -x;
    let r;
    if (x > 1) r = HALF - atan1(1 / x); else r = atan1(x);
    return neg ? -r : r;
  }
  function atan1(x) { // 0 ≤ x ≤ 1: rút gọn một lần atan(x) = 2·atan(x / (1 + √(1+x²)))
    return 2 * atanSmall(x / (1 + Math.sqrt(1 + x * x)));
  }
  function atan2(y, x) {
    if (x > 0) return atan(y / x);
    if (x < 0) return y >= 0 ? atan(y / x) + PI : atan(y / x) - PI;
    if (y > 0) return HALF;
    if (y < 0) return -HALF;
    return 0;
  }

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const len = (x, y) => Math.sqrt(x * x + y * y);
  const dist = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); };
  const dist2 = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };
  // vector đơn vị từ a tới b (nếu trùng nhau trả về (1,0))
  function dir(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy);
    return L > 1e-9 ? { x: dx / L, y: dy / L } : { x: 1, y: 0 };
  }
  // khoảng cách điểm p tới đoạn ab, kèm tham số t ∈ [0,1]
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    let t = L2 > 1e-12 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
    t = clamp(t, 0, 1);
    const qx = ax + dx * t - px, qy = ay + dy * t - py;
    return Math.sqrt(qx * qx + qy * qy);
  }
  // làm tròn hiển thị
  const fmt = (n) => Math.round(n).toLocaleString('vi-VN');
  function mmss(t) { t = Math.max(0, Math.floor(t)); const m = Math.floor(t / 60), s = t % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; }

  G.M = { PI, TAU, HALF, sin, cos, atan2, atan, clamp, lerp, len, dist, dist2, dir, segDist };
  G.U = { clamp, lerp, fmt, mmss };
})();
