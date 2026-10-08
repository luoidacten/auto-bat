'use strict';
// ===== Bộ sinh số ngẫu nhiên có hạt giống (sfc32) =====
// Mọi ngẫu nhiên trong trận PHẢI lấy từ đây. Giao diện dùng Math.random cho hiệu ứng thuần hình ảnh, không đụng vào bộ này.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  // băm chuỗi/số thành 4 số 32 bit (cyrb128)
  function hash128(str) {
    str = String(str);
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
  }
  class Rng {
    constructor(seed) {
      const s = hash128(seed);
      this.a = s[0]; this.b = s[1]; this.c = s[2]; this.d = s[3];
      for (let i = 0; i < 12; i++) this.u32();
    }
    u32() {
      let a = this.a >>> 0, b = this.b >>> 0, c = this.c >>> 0, d = this.d >>> 0;
      const t = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      c = (c + t) | 0;
      this.a = a; this.b = b; this.c = c; this.d = d;
      return t >>> 0;
    }
    next() { return this.u32() / 4294967296; }            // [0,1)
    range(a, b) { return a + this.next() * (b - a); }
    int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); } // [a,b]
    chance(p) { return this.next() < p; }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
    // tách một luồng con độc lập (để thêm/bớt nơi rút số không làm lệch luồng khác)
    fork(tag) { return new Rng(`${this.u32()}:${tag}`); }
    state() { return [this.a, this.b, this.c, this.d]; }
  }
  G.Rng = Rng;
  G.hash128 = hash128;
})();
