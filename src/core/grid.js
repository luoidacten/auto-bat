'use strict';
// ===== Lưới không gian: truy vấn đơn vị trong bán kính nhanh =====
// Dựng lại mỗi bước (rẻ: vài trăm đơn vị). Thứ tự trả về ổn định theo thứ tự chèn → tất định.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  class Grid {
    constructor(w, h, cell) {
      this.cell = cell; this.cols = Math.ceil(w / cell); this.rows = Math.ceil(h / cell);
      this.buckets = new Array(this.cols * this.rows);
      for (let i = 0; i < this.buckets.length; i++) this.buckets[i] = [];
      this.used = [];
    }
    clear() { for (const i of this.used) this.buckets[i].length = 0; this.used.length = 0; }
    idx(x, y) {
      let c = Math.floor(x / this.cell), r = Math.floor(y / this.cell);
      if (c < 0) c = 0; else if (c >= this.cols) c = this.cols - 1;
      if (r < 0) r = 0; else if (r >= this.rows) r = this.rows - 1;
      return r * this.cols + c;
    }
    insert(u) { const i = this.idx(u.x, u.y), b = this.buckets[i]; if (!b.length) this.used.push(i); b.push(u); }
    // gọi fn(u) cho mọi đơn vị có tâm trong bán kính R (+ bán kính đơn vị nếu withR)
    query(x, y, R, fn, withR) {
      const pad = withR ? 1.5 : 0;
      const c0 = Math.max(0, Math.floor((x - R - pad) / this.cell)), c1 = Math.min(this.cols - 1, Math.floor((x + R + pad) / this.cell));
      const r0 = Math.max(0, Math.floor((y - R - pad) / this.cell)), r1 = Math.min(this.rows - 1, Math.floor((y + R + pad) / this.cell));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const b = this.buckets[r * this.cols + c];
        for (let i = 0; i < b.length; i++) {
          const u = b[i], dx = u.x - x, dy = u.y - y, rr = R + (withR ? u.r : 0);
          if (dx * dx + dy * dy <= rr * rr) fn(u);
        }
      }
    }
  }
  G.Grid = Grid;
})();
