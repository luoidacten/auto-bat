'use strict';
// ===== VẼ NỀN ĐẤU TRƯỜNG (GĐ6, GĐ6b: 6 vùng) =====
// Mỗi vùng một bảng màu & kiểu trang trí: Rừng Thông (thông sẫm, lá kim), Đầm Lầy Sương (vũng nước, lau sậy, liễu),
// Núi Đá Đỏ (đất đỏ, sỏi, vách đá đỏ), Đồng Cỏ Vàng (lúa mì, hoa), Tuyết Sơn (tuyết, thông phủ tuyết), Phế Tích Tân Thế
// (đá lát vỡ, rêu, cột đổ). Ranh giới giữa các vùng hòa màu mềm.
// Cảnh được dựng 1 lần thành danh sách "nét vẽ" có khung bao (cỏ, vách đá + tán cây, bụi, ổ boss, bãi quái, quầy
// Thương Nhân, điểm xuất phát…), rồi VẼ THEO Ô 16×16 đv ở đúng độ phân giải của mức phóng → gần vẫn sắc nét.
// Ô chưa vẽ kịp thì tạm dùng ảnh tổng quan độ phân giải thấp. Bộ sinh số cố định → bản đồ luôn trông giống nhau.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const TAU = Math.PI * 2;
  function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function segD(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    let t = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + dx * t - px, qy = ay + dy * t - py; return Math.sqrt(qx * qx + qy * qy);
  }
  const rgba = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
  function hexA(c, a) { const n = parseInt(c.slice(1), 16); return rgba((n >> 16) & 255, (n >> 8) & 255, n & 255, a); }

  const T = 16;   // cạnh ô (đv)
  // bảng màu vùng: nền đất, độ sẫm khi rậm, lá cây (sáng, giữa, tối), vách (tối, sáng), bụi
  const REG = [
    { base: [54, 100, 58], dark: 0.5, leaf: [[64, 128, 74], [30, 76, 44], [12, 34, 20]], wall: ['#3a3d33', '#575b4e'], bush: [[26, 80, 40], [40, 70, 34]] },          // Rừng Thông
    { base: [80, 100, 74], dark: 0.42, leaf: [[120, 150, 80], [70, 100, 52], [30, 48, 26]], wall: ['#3a4038', '#5a6656'], bush: [[34, 84, 66], [30, 60, 40]] },      // Đầm Lầy Sương
    { base: [150, 96, 64], dark: 0.36, leaf: [[170, 120, 70], [120, 80, 44], [60, 36, 22]], wall: ['#5a3022', '#8e5038'], bush: [[96, 98, 40], [70, 54, 24]] },     // Núi Đá Đỏ
    { base: [158, 150, 74], dark: 0.4, leaf: [[120, 170, 70], [70, 120, 44], [30, 60, 24]], wall: ['#4a4636', '#6e6a54'], bush: [[80, 128, 40], [60, 80, 24]] },    // Đồng Cỏ Vàng
    { base: [212, 220, 232], dark: 0.16, leaf: [[60, 104, 96], [34, 70, 70], [16, 36, 40]], wall: ['#6c7686', '#aab6c6'], bush: [[90, 130, 130], [60, 70, 80]] },  // Tuyết Sơn
    { base: [116, 110, 96], dark: 0.36, leaf: [[90, 130, 80], [56, 90, 52], [24, 44, 26]], wall: ['#46433c', '#78746a'], bush: [[44, 100, 50], [40, 60, 30]] },     // Phế Tích Tân Thế
    { base: [206, 176, 120], dark: 0.18, leaf: [[150, 170, 90], [100, 120, 60], [50, 64, 30]], wall: ['#7a5a36', '#b08a5a'], bush: [[120, 130, 60], [50, 50, 20]] },  // Sa Mạc Cát (GĐ7)
    { base: [78, 72, 82], dark: 0.4, leaf: [[118, 108, 104], [76, 66, 70], [36, 30, 36]], wall: ['#2c282e', '#4c4650'], bush: [[72, 66, 60], [40, 30, 34]] },          // Vùng Tử Khí (GĐ8)
    { base: [132, 136, 80], dark: 0.32, leaf: [[150, 172, 70], [98, 122, 42], [44, 60, 22]], wall: ['#3a3e36', '#646a5c'], bush: [[104, 132, 40], [50, 60, 20]] },    // Trạm Khí Độc (GĐ8)
  ];
  const BIO = (k) => (G.MAP.REGIONS[k] ? G.MAP.REGIONS[k].bio : k);   // vùng → biome (GĐ7: mỗi bản đồ xáo biome cho 5 vùng ngoài)
  const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
  // GĐ8: số vùng ngoài lấy từ bản đồ (7 vùng ≈51°), vùng giữa có id MAP.CENTER
  const NS = () => G.MAP.NSEC || 5, CEN = () => (G.MAP.CENTER != null ? G.MAP.CENTER : 5);
  // trọng số các vùng tại (x, y): hòa mềm ~10° ở ranh giới góc và ~14 đv ở ranh giới Phế Tích
  function regionW(x, y, out) {
    const MAP = G.MAP, n = NS(), step = 360 / n, half = step / 2 + 5, dx = x - MAP.center.x, dy = y - MAP.center.y, d = Math.sqrt(dx * dx + dy * dy);
    const wIn = smooth((MAP.INNER_R + 7 - d) / 14);
    let a = Math.atan2(dy, dx) * 180 / Math.PI + 90; a = ((a % 360) + 360) % 360;
    let sum = 0;
    for (let k = 0; k < n; k++) { let da = Math.abs(a - step * k); if (da > 180) da = 360 - da; out[k] = smooth((half - da) / 10); sum += out[k]; }
    for (let k = 0; k < n; k++) out[k] = out[k] / (sum || 1) * (1 - wIn);
    out[CEN()] = wIn;
    return out;
  }
  // chọn một vùng theo trọng số (để trang trí ở ranh giới trộn lẫn)
  function pickRegion(x, y, r, buf) { regionW(x, y, buf); let k = r; for (let i = 0; i <= NS(); i++) { k -= buf[i]; if (k <= 0) return i; } return CEN(); }
  const lairList = () => G.MAP.lairs || [G.MAP.bossLair];
  const Art = {
    built: false, prims: [], cell: 8, buckets: null, cols: 0, mobile: false, gcv: null, GP: 4, grain: null,
    // ---------- mặt đất: màu nền theo vùng (hòa mềm ở ranh giới), rậm thì sẫm hơn, loang lổ ----------
    groundInit() {
      const C = G.C, MAP = G.MAP, MS = C.MS || 1;
      const N = this.gN = Math.ceil(C.MAP / 2) + 3;
      const forest = this.forest = new Float32Array(N * N), nA = this.nA = new Float32Array(64 * 64), nB = this.nB = new Float32Array(64 * 64);
      const bR = this.bR = new Float32Array(N * N), bG = this.bG = new Float32Array(N * N), bB = this.bB = new Float32Array(N * N), wet = this.wet = new Float32Array(N * N), snow = this.snow = new Float32Array(N * N), sand = this.sand = new Float32Array(N * N);
      const dead = this.dead = new Float32Array(N * N), tox = this.tox = new Float32Array(N * N), NR = NS() + 1, KS = MAP.K || 1;
      const ids = Array.from({ length: NR }, (_, k) => k);
      const PB = ids.map((k) => REG[BIO(k)] || REG[5]), isB = (b) => ids.map((k) => (BIO(k) === b ? 1 : 0));
      const kWet = isB(1), kSnow = isB(4), kSand = isB(6), kDead = isB(7), kTox = isB(8);
      const rnd = prng(777);
      for (let i = 0; i < 64 * 64; i++) { nA[i] = rnd(); nB[i] = rnd(); }
      const cx = MAP.center.x, cy = MAP.center.y, w = new Array(NR).fill(0);
      const clear = [].concat(MAP.camps.map((c) => [c.x, c.y, 7 * MS]), MAP.merchants.map((t) => [t.x, t.y, 8 * MS]), MAP.spawns.map((p) => [p.x, p.y, 6 * MS]), lairList().map((L) => [L.x, L.y, L.r + 8]));
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = i * 2, y = j * 2, d = Math.hypot(x - cx, y - cy), o = j * N + i;
        regionW(x, y, w);
        let r = 0, g = 0, b = 0, dk = 0;
        let wt = 0, sn = 0, sd = 0, de = 0, tx = 0;
        for (let k = 0; k < NR; k++) { const P = PB[k]; r += P.base[0] * w[k]; g += P.base[1] * w[k]; b += P.base[2] * w[k]; dk += P.dark * w[k]; wt += kWet[k] * w[k]; sn += kSnow[k] * w[k]; sd += kSand[k] * w[k]; de += kDead[k] * w[k]; tx += kTox[k] * w[k]; }
        bR[o] = r; bG[o] = g; bB[o] = b; wet[o] = wt; snow[o] = sn; sand[o] = sd; dead[o] = de; tox[o] = tx;
        // rậm dần ra rìa + đám rậm theo nhiễu; quanh bãi quái / Thương Nhân / điểm xuất phát / ổ boss là khoảng trống
        const clump = this.sampN(nA, x * 0.05 + 3, y * 0.05 + 9);
        let f = smooth((d - 60 * KS) / (140 * KS)) * 0.55 + smooth((clump - 0.45) / 0.3) * 0.45 + smooth((d - 240 * KS) / 30) * 0.3;
        for (const [qx, qy, R] of clear) { const dd = Math.hypot(x - qx, y - qy); if (dd < R * 1.6) f *= smooth((dd - R) / (R * 0.6)); }
        forest[o] = Math.max(0, Math.min(1, f)) * dk * 2;
      }
    },
    samp(A, x, y) {
      const N = this.gN, fx = Math.max(0, Math.min(N - 1.001, x / 2)), fy = Math.max(0, Math.min(N - 1.001, y / 2));
      const i0 = Math.floor(fx), j0 = Math.floor(fy), tx = fx - i0, ty = fy - j0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = A[j0 * N + i0], b = A[j0 * N + i0 + 1], c = A[(j0 + 1) * N + i0], d = A[(j0 + 1) * N + i0 + 1];
      return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
    },
    sampF(x, y) { return this.samp(this.forest, x, y); },
    // nhiễu lặp (ô 64×64), x/y theo ô nhiễu
    sampN(A, x, y) {
      const fx = ((x % 64) + 64) % 64, fy = ((y % 64) + 64) % 64, i0 = Math.floor(fx), j0 = Math.floor(fy), i1 = (i0 + 1) & 63, j1 = (j0 + 1) & 63, tx = fx - i0, ty = fy - j0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      return (A[j0 * 64 + i0] * (1 - sx) + A[j0 * 64 + i1] * sx) * (1 - sy) + (A[j1 * 64 + i0] * (1 - sx) + A[j1 * 64 + i1] * sx) * sy;
    },
    groundRGB(x, y, out) {
      const f = this.sampF(x, y), n1 = this.sampN(this.nA, x * 0.14, y * 0.14), n2 = this.sampN(this.nB, x * 0.6, y * 0.6), n3 = this.sampN(this.nB, x * 2.2 + 17, y * 2.2 + 5);
      const k = 0.8 + n1 * 0.26 + n2 * 0.12 + n3 * 0.06;
      let r = this.samp(this.bR, x, y) * k, g = this.samp(this.bG, x, y) * k, b = this.samp(this.bB, x, y) * k;
      // đầm lầy: vũng nước tối ánh xanh
      const wt = this.samp(this.wet, x, y);
      if (wt > 0.05) { const pd = this.sampN(this.nB, x * 0.09 + 31, y * 0.09 + 7), q = smooth((pd - 0.56) / 0.08) * wt; r += (40 - r) * q * 0.85; g += (70 - g) * q * 0.85; b += (82 - b) * q * 0.85; }
      // sa mạc: gợn cát
      const sd = this.samp(this.sand, x, y);
      if (sd > 0.05) { const rp = Math.sin(x * 1.7 + n1 * 6 + y * 0.35) * 0.5 + 0.5, q = smooth((rp - 0.7) / 0.3) * sd * 0.14; r -= 46 * q; g -= 40 * q; b -= 30 * q; }
      // GĐ8 — Vùng Tử Khí: mảng tro xám tím + vệt nứt tối
      const de = this.samp(this.dead, x, y);
      if (de > 0.05) { const pd = this.sampN(this.nA, x * 0.07 + 11, y * 0.07 + 23), q = smooth((pd - 0.55) / 0.1) * de; r += (52 - r) * q * 0.6; g += (44 - g) * q * 0.6; b += (62 - b) * q * 0.6; const cr = Math.abs(Math.sin(x * 0.9 + n2 * 5) * Math.cos(y * 0.8 - n1 * 4)), qc = smooth((0.06 - cr) / 0.06) * de * 0.35; r -= 30 * qc; g -= 30 * qc; b -= 26 * qc; }
      // GĐ8 — Trạm Khí Độc: vũng độc xanh vàng loang
      const tx = this.samp(this.tox, x, y);
      if (tx > 0.05) { const pd = this.sampN(this.nB, x * 0.08 + 41, y * 0.08 + 3), q = smooth((pd - 0.6) / 0.06) * tx; r += (118 - r) * q * 0.75; g += (176 - g) * q * 0.75; b += (40 - b) * q * 0.75; const rim = smooth((pd - 0.57) / 0.03) * (1 - smooth((pd - 0.6) / 0.03)) * tx; r += 40 * rim; g += 50 * rim; }
      // tuyết: vệt bóng xanh nhạt
      const sn = this.samp(this.snow, x, y);
      if (sn > 0.05) { const sh = smooth((n1 - 0.55) / 0.2) * sn * 0.18; r -= 40 * sh; g -= 26 * sh; b -= 4 * sh; }
      r *= 1 - f * 0.46; g *= 1 - f * 0.34; b *= 1 - f * 0.22;
      out[0] = r; out[1] = g; out[2] = b;
    },
    // ---------- dựng cảnh: danh sách nét vẽ theo thứ tự lớp ----------
    emit(x0, y0, x1, y1, fn) {
      const i = this.prims.length;
      this.prims.push({ x0, y0, x1, y1, fn });
      const c = this.cell, cols = this.cols;
      for (let cy = Math.max(0, Math.floor(y0 / c)); cy <= Math.min(cols - 1, Math.floor(y1 / c)); cy++)
        for (let cx = Math.max(0, Math.floor(x0 / c)); cx <= Math.min(cols - 1, Math.floor(x1 / c)); cx++) this.buckets[cy * cols + cx].push(i);
    },
    build() {
      if (this.built) return;
      const C = G.C, MAP = G.MAP, MS = C.MS || 1;
      this.cols = Math.ceil(C.MAP / this.cell) + 1;
      this.buckets = Array.from({ length: this.cols * this.cols }, () => []);
      this.groundInit();
      const rnd = prng(20261005);
      const E = (x0, y0, x1, y1, fn) => this.emit(x0, y0, x1, y1, fn);
      // 1) trang trí mặt đất theo vùng: cỏ, lá kim, lau sậy, sỏi đỏ, lúa mì, hoa, lấp lánh tuyết, đá lát vỡ
      const wb = new Array(NS() + 1).fill(0);
      const blade = (x, y, col, h, lw) => { const dx = (rnd() - 0.5) * 0.3; E(x - 0.3, y - h - 0.1, x + 0.3, y + 0.1, (g) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dx * 0.3, y - h * 0.6, x + dx, y - h); g.stroke(); }); };
      const dot = (x, y, col, r) => E(x - r, y - r, x + r, y + r, (g) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
      const oval = (x, y, col, rx, ry, a) => E(x - rx - 0.1, y - rx - 0.1, x + rx + 0.1, y + rx + 0.1, (g) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill(); });
      for (let i = 0; i < C.MAP * C.MAP * 0.3; i++) {
        const x = rnd() * C.MAP, y = rnd() * C.MAP, f = this.sampF(x, y), k = rnd(), reg = BIO(pickRegion(x, y, rnd(), wb));
        if (reg === 7) {                                                                    // Vùng Tử Khí (GĐ8)
          if (k < 0.3) blade(x, y, rgba(100 + rnd() * 30, 92 + rnd() * 20, 80, 0.55), 0.2 + rnd() * 0.25, 0.05);   // cỏ chết
          else if (k < 0.36) { const a = rnd() * TAU, L = 0.22 + rnd() * 0.2; E(x - L, y - L, x + L, y + L, (g) => { g.strokeStyle = 'rgba(220,214,196,0.7)'; g.lineWidth = 0.07; g.beginPath(); g.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); g.fillStyle = 'rgba(220,214,196,0.7)'; for (const s of [-1, 1]) { g.beginPath(); g.arc(x + Math.cos(a) * L * s, y + Math.sin(a) * L * s, 0.06, 0, TAU); g.fill(); } }); }   // xương
          else if (k < 0.37) E(x - 0.3, y - 0.3, x + 0.3, y + 0.3, (g) => { g.fillStyle = 'rgba(215,208,190,0.75)'; g.beginPath(); g.arc(x, y, 0.18, 0, TAU); g.fill(); g.fillStyle = 'rgba(30,24,30,0.8)'; g.beginPath(); g.arc(x - 0.07, y - 0.02, 0.045, 0, TAU); g.arc(x + 0.07, y - 0.02, 0.045, 0, TAU); g.fill(); });   // sọ
          else if (k < 0.45) oval(x, y, rgba(110 + rnd() * 30, 80, 130 + rnd() * 30, 0.16), 0.4 + rnd() * 0.6, 0.2 + rnd() * 0.2, rnd() * TAU);   // vệt tử khí tím
          else if (k < 0.5) oval(x, y, rgba(60, 56, 64, 0.6), 0.08 + rnd() * 0.12, 0.06 + rnd() * 0.08, rnd() * TAU);
        } else if (reg === 8) {                                                             // Trạm Khí Độc (GĐ8)
          if (k < 0.32) blade(x, y, rgba(150 + rnd() * 40, 160 + rnd() * 30, 50, 0.55), 0.2 + rnd() * 0.25, 0.05);   // cỏ úa vàng
          else if (k < 0.4) { const r = 0.12 + rnd() * 0.2; E(x - r - 0.1, y - r - 0.1, x + r + 0.1, y + r + 0.1, (g) => { g.fillStyle = 'rgba(150,210,50,0.55)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = 'rgba(230,255,160,0.45)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, TAU); g.fill(); }); }   // vũng độc nhỏ
          else if (k < 0.45) { const a = rnd() * TAU, w = 0.25 + rnd() * 0.25, kk = rnd(); E(x - w, y - w, x + w, y + w, (g) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = rgba(120 + kk * 40, 70 + kk * 20, 40, 0.75); g.fillRect(-w / 2, -w / 5, w, w / 2.5); g.restore(); }); }   // mảnh sắt gỉ
          else if (k < 0.5) dot(x, y, 'rgba(90,96,84,0.7)', 0.05 + rnd() * 0.05);
        } else if (reg === 6) {                                                             // Sa Mạc Cát
          if (k < 0.25) oval(x, y, rgba(170 + rnd() * 40, 140 + rnd() * 30, 96 + rnd() * 20, 0.7), 0.06 + rnd() * 0.1, 0.05 + rnd() * 0.06, rnd() * TAU);
          else if (k < 0.33) blade(x, y, rgba(160 + rnd() * 30, 150 + rnd() * 20, 80, 0.6), 0.2 + rnd() * 0.2, 0.05);
          else if (k < 0.36) { const a = rnd() * TAU, L = 0.5 + rnd() * 0.6; E(x - L, y - L, x + L, y + L, (g) => { g.strokeStyle = 'rgba(150,110,60,0.35)'; g.lineWidth = 0.06; g.beginPath(); g.arc(x, y, L, a, a + 1.2); g.stroke(); }); }
        } else if (reg === 0) {                                                             // Rừng Thông
          if (k < 0.6) blade(x, y, rgba(24 + rnd() * 30, 66 + rnd() * 40, 30 + rnd() * 20, 0.55), 0.3 + rnd() * 0.3, 0.07);
          else if (k < 0.8) { const a = rnd() * TAU, col = rgba(110 + rnd() * 40, 70 + rnd() * 30, 30, 0.55); E(x - 0.3, y - 0.3, x + 0.3, y + 0.3, (g) => { g.strokeStyle = col; g.lineWidth = 0.05; g.beginPath(); g.moveTo(x - Math.cos(a) * 0.22, y - Math.sin(a) * 0.22); g.lineTo(x + Math.cos(a) * 0.22, y + Math.sin(a) * 0.22); g.stroke(); }); }
          else if (k < 0.84) oval(x, y, rgba(120, 80, 40, 0.8), 0.14, 0.09, rnd() * TAU);  // quả thông
        } else if (reg === 1) {                                                             // Đầm Lầy Sương
          if (k < 0.45) { const h = 0.5 + rnd() * 0.5, col = rgba(80 + rnd() * 40, 110 + rnd() * 30, 60, 0.6); blade(x, y, col, h, 0.06); if (rnd() < 0.3) oval(x, y - h, 'rgba(90,60,30,0.8)', 0.05, 0.13, 0); }
          else if (k < 0.55) { const r = 0.2 + rnd() * 0.15, a = rnd() * TAU; E(x - r, y - r, x + r, y + r, (g) => { g.fillStyle = 'rgba(70,130,70,0.75)'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, a, a + TAU - 0.6); g.closePath(); g.fill(); }); }   // lá súng
          else if (k < 0.7) blade(x, y, rgba(50, 80 + rnd() * 30, 50, 0.5), 0.25 + rnd() * 0.2, 0.06);
        } else if (reg === 2) {                                                             // Núi Đá Đỏ
          if (k < 0.35) oval(x, y, rgba(120 + rnd() * 50, 66 + rnd() * 30, 44 + rnd() * 20, 0.75), 0.08 + rnd() * 0.14, 0.06 + rnd() * 0.08, rnd() * TAU);
          else if (k < 0.5) blade(x, y, rgba(170 + rnd() * 40, 140 + rnd() * 30, 70, 0.5), 0.2 + rnd() * 0.2, 0.06);
          else if (k < 0.56) { const a = rnd() * TAU, L = 0.4 + rnd() * 0.6; E(x - L, y - L, x + L, y + L, (g) => { g.strokeStyle = 'rgba(60,30,20,0.35)'; g.lineWidth = 0.05; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5 + 0.1); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }); }
        } else if (reg === 3) {                                                             // Đồng Cỏ Vàng
          if (k < 0.55) { const h = 0.35 + rnd() * 0.35; blade(x, y, rgba(190 + rnd() * 40, 160 + rnd() * 40, 70, 0.6), h, 0.06); if (rnd() < 0.35) oval(x, y - h, 'rgba(230,190,90,0.85)', 0.05, 0.12, 0); }
          else if (k < 0.66 && f < 0.4) {
            const col = ['#ffe36a', '#ffffff', '#ff9ad5', '#9ad0ff', '#ffb070'][Math.floor(rnd() * 5)], r = 0.09 + rnd() * 0.07;
            E(x - 0.3, y - 0.3, x + 0.3, y + 0.3, (g) => { g.fillStyle = col; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, 0, TAU); g.fill(); } g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(x, y, r * 0.6, 0, TAU); g.fill(); });
          } else if (k < 0.8) blade(x, y, rgba(110 + rnd() * 30, 150 + rnd() * 30, 60, 0.5), 0.25 + rnd() * 0.2, 0.06);
        } else if (reg === 4) {                                                             // Tuyết Sơn
          if (k < 0.3) dot(x, y, 'rgba(255,255,255,0.8)', 0.05 + rnd() * 0.05);
          else if (k < 0.45) oval(x, y, 'rgba(150,175,210,0.25)', 0.3 + rnd() * 0.4, 0.12 + rnd() * 0.12, rnd() * 0.4);
          else if (k < 0.52) blade(x, y, 'rgba(170,190,180,0.6)', 0.2 + rnd() * 0.2, 0.05);
        } else {                                                                            // Phế Tích Tân Thế
          if (k < 0.12) { const a = (rnd() - 0.5) * 0.4, w = 0.6 + rnd() * 0.6, h = 0.4 + rnd() * 0.5, kk = rnd(); E(x - w, y - w, x + w, y + w, (g) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = rgba(130 + kk * 30, 126 + kk * 28, 112 + kk * 26, 0.8); g.fillRect(-w / 2, -h / 2, w, h); g.strokeStyle = 'rgba(40,38,32,0.5)'; g.lineWidth = 0.05; g.strokeRect(-w / 2, -h / 2, w, h); g.restore(); }); }   // đá lát
          else if (k < 0.3) oval(x, y, rgba(60, 100 + rnd() * 30, 50, 0.45), 0.2 + rnd() * 0.3, 0.12 + rnd() * 0.15, rnd() * TAU);   // rêu
          else if (k < 0.5) blade(x, y, rgba(70 + rnd() * 30, 110 + rnd() * 30, 60, 0.5), 0.2 + rnd() * 0.25, 0.06);
          else if (k < 0.54) oval(x, y, 'rgba(150,146,134,0.8)', 0.1 + rnd() * 0.12, 0.07 + rnd() * 0.08, rnd() * TAU);
        }
      }
      // 3b) GĐ7 — nền công trình & địa hình: ao bùn / mặt băng / cát lún, cao nguyên, sàn nhà, sàn đền, suối dưới cầu
      for (const t of MAP.terrain || []) {
        const R0 = t.r, blobs = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + rnd() * 0.3; blobs.push([t.x + Math.cos(a) * R0 * 0.55, t.y + Math.sin(a) * R0 * 0.55, R0 * (0.45 + rnd() * 0.15)]); }
        const cracks = []; for (let i = 0; i < 7; i++) { let a = rnd() * TAU, x = t.x + Math.cos(a) * R0 * rnd() * 0.6, y = t.y + Math.sin(a) * R0 * rnd() * 0.6; const pts = [[x, y]]; for (let q = 0; q < 4; q++) { a += (rnd() - 0.5) * 1.4; x += Math.cos(a) * 1.2; y += Math.sin(a) * 1.2; pts.push([x, y]); } cracks.push(pts); }
        const col = t.type === 'ice' ? ['rgba(190,225,250,0.85)', 'rgba(150,200,240,0.9)', 'rgba(255,255,255,0.55)'] : t.type === 'sand' ? ['rgba(196,160,96,0.85)', 'rgba(170,130,70,0.9)', 'rgba(120,86,40,0.35)'] : ['rgba(70,58,40,0.85)', 'rgba(52,44,30,0.92)', 'rgba(150,170,120,0.25)'];
        E(t.x - R0 - 1, t.y - R0 - 1, t.x + R0 + 1, t.y + R0 + 1, (g) => {
          g.fillStyle = col[0]; g.beginPath(); for (const [bx, by, br] of blobs) { g.moveTo(bx + br, by); g.arc(bx, by, br, 0, TAU); } g.arc(t.x, t.y, R0 * 0.7, 0, TAU); g.fill();
          g.fillStyle = col[1]; g.beginPath(); g.arc(t.x, t.y, R0 * 0.5, 0, TAU); g.fill();
          g.strokeStyle = col[2]; g.lineWidth = t.type === 'ice' ? 0.07 : 0.12;
          if (t.type === 'sand') { for (let r = 0.8; r < R0 * 0.8; r += 0.9) { g.beginPath(); g.arc(t.x, t.y, r, r * 1.3, r * 1.3 + 4.2); g.stroke(); } }
          else if (t.type === 'ice') for (const c of cracks) { g.beginPath(); c.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
          if (t.type === 'ice') { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.14; g.beginPath(); g.arc(t.x - R0 * 0.2, t.y - R0 * 0.25, R0 * 0.35, 3.6, 4.6); g.stroke(); }
          if (t.type === 'mud') {
            g.strokeStyle = 'rgba(200,190,150,0.18)'; g.lineWidth = 0.18; g.beginPath(); g.arc(t.x - R0 * 0.15, t.y - R0 * 0.2, R0 * 0.38, 3.5, 4.7); g.stroke();
            for (let i = 0; i < 6; i++) { const [bx, by] = blobs[i]; g.strokeStyle = 'rgba(150,140,100,0.45)'; g.lineWidth = 0.06; g.beginPath(); g.arc((bx + t.x) / 2, (by + t.y) / 2, 0.22 + (i % 3) * 0.08, 0, TAU); g.stroke(); }
          }
        });
      }
      for (const st of MAP.structs || []) {
        if (st.type === 'plateau' || st.type === 'tower') {
          // cao nguyên: mặt trên sáng hơn, vách đá liền mạch quanh mép (chừa dốc), bóng đổ về phía nam-đông, dốc lên có bậc
          const pr = st.r, k = rnd(), rr = st.ramps.map((d) => d * Math.PI / 180), half = 2.7 / pr + 0.07;
          const gaps = rr.map((a) => [a - half, a + half]).sort((p, q) => p[0] - q[0]);
          const arcs = []; // các cung vách (ngoài dốc)
          { const g0 = gaps.map(([a0, a1]) => [((a0 % TAU) + TAU) % TAU, ((a1 % TAU) + TAU) % TAU]); let pts = []; for (let i = 0; i < 96; i++) { const a = i / 96 * TAU; const inGap = g0.some(([a0, a1]) => (a0 < a1 ? a >= a0 && a <= a1 : a >= a0 || a <= a1)); pts.push(inGap ? null : a); } let cur = null; for (let i = 0; i < 97; i++) { const a = pts[i % 96]; if (a == null) { if (cur && cur.length > 1) arcs.push(cur); cur = null; } else { (cur || (cur = [])).push(i / 96 * TAU); } } if (cur && cur.length > 1) arcs.push(cur); }
          E(st.x - pr - 3, st.y - pr - 3, st.x + pr + 4, st.y + pr + 4, (g) => {
            g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(st.x + 0.9, st.y + 1.3, pr + 0.9, pr + 0.7, 0, 0, TAU); g.fill();
            const rg = g.createRadialGradient(st.x - pr * 0.35, st.y - pr * 0.4, pr * 0.1, st.x, st.y, pr);
            rg.addColorStop(0, 'rgba(255,250,230,0.34)'); rg.addColorStop(0.8, 'rgba(255,245,220,0.16)'); rg.addColorStop(1, 'rgba(255,240,210,0.10)');
            g.fillStyle = rg; g.beginPath(); g.arc(st.x, st.y, pr, 0, TAU); g.fill();
            // dốc lên: dải đất + bậc
            for (const a of rr) {
              const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, w0 = 2.7;
              g.fillStyle = 'rgba(150,130,96,0.55)'; g.beginPath(); g.moveTo(st.x + ux * (pr - 1.5) - vx * w0, st.y + uy * (pr - 1.5) - vy * w0); g.lineTo(st.x + ux * (pr + 2.6) - vx * (w0 + 0.6), st.y + uy * (pr + 2.6) - vy * (w0 + 0.6)); g.lineTo(st.x + ux * (pr + 2.6) + vx * (w0 + 0.6), st.y + uy * (pr + 2.6) + vy * (w0 + 0.6)); g.lineTo(st.x + ux * (pr - 1.5) + vx * w0, st.y + uy * (pr - 1.5) + vy * w0); g.closePath(); g.fill();
              g.strokeStyle = 'rgba(70,56,36,0.55)'; g.lineWidth = 0.12;
              for (let i = 0; i < 5; i++) { const d = pr - 1.1 + i * 0.85, w = w0 + i * 0.12; g.beginPath(); g.moveTo(st.x + ux * d - vx * w, st.y + uy * d - vy * w); g.lineTo(st.x + ux * d + vx * w, st.y + uy * d + vy * w); g.stroke(); }
            }
            // vách đá: dải tối dày + mép trên sáng + khối đá lởm chởm
            g.lineCap = 'round';
            for (const A of arcs) {
              const path = () => { g.beginPath(); A.forEach((a, i) => { const x = st.x + Math.cos(a) * pr, y = st.y + Math.sin(a) * pr; i ? g.lineTo(x, y) : g.moveTo(x, y); }); };
              g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.9; g.save(); g.translate(0.35, 0.5); path(); g.stroke(); g.restore();
              g.strokeStyle = '#4a4234'; g.lineWidth = 1.6; path(); g.stroke();
              g.strokeStyle = '#7a705c'; g.lineWidth = 0.8; g.save(); g.translate(-0.25, -0.3); path(); g.stroke(); g.restore();
              g.strokeStyle = 'rgba(255,245,215,0.35)'; g.lineWidth = 0.18; g.save(); g.translate(-0.45, -0.55); path(); g.stroke(); g.restore();
              g.strokeStyle = 'rgba(30,24,16,0.45)'; g.lineWidth = 0.08;
              for (let i = 0; i < A.length; i += 2) { const a = A[i], x = st.x + Math.cos(a) * pr, y = st.y + Math.sin(a) * pr; g.beginPath(); g.moveTo(x - Math.cos(a) * 0.7, y - Math.sin(a) * 0.7); g.lineTo(x + Math.cos(a) * 0.7, y + Math.sin(a) * 0.7); g.stroke(); }
            }
            if (st.type === 'tower') { g.fillStyle = rgba(120 + k * 20, 100 + k * 16, 70, 0.9); for (const [ox, oy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.fillRect(st.x + ox * pr * 0.5 - 0.35, st.y + oy * pr * 0.5 - 0.35, 0.7, 0.7); g.strokeStyle = 'rgba(80,60,36,0.8)'; g.lineWidth = 0.15; g.strokeRect(st.x - pr * 0.5, st.y - pr * 0.5, pr, pr); g.fillStyle = 'rgba(200,60,40,0.8)'; g.beginPath(); g.moveTo(st.x, st.y - 0.2); g.lineTo(st.x + 1.1, st.y - 0.6); g.lineTo(st.x, st.y - 1.0); g.closePath(); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 0.1; g.beginPath(); g.moveTo(st.x, st.y + 0.6); g.lineTo(st.x, st.y - 1.0); g.stroke(); }
            else { g.fillStyle = 'rgba(90,80,64,0.5)'; for (let i = 0; i < 3; i++) { const a = k * 6 + i * 2.1, d = pr * 0.45; g.beginPath(); g.arc(st.x + Math.cos(a) * d, st.y + Math.sin(a) * d, 0.5 + i * 0.15, 0, TAU); g.fill(); } }
          });
        } else if (st.type === 'house' || st.type === 'ruin') {
          const hw = st.type === 'house' ? st.w / 2 : st.L / 2, hh = st.type === 'house' ? st.h / 2 : st.L / 2, ang = st.ang, wood = st.style === 'wood' && st.type === 'house', metal = st.style === 'metal' && st.type === 'house';
          const cracks = []; for (let i = 0; i < 5; i++) cracks.push([(rnd() - 0.5) * hw * 1.6, (rnd() - 0.5) * hh * 1.6, rnd() * TAU, 0.6 + rnd()]);
          const B = Math.max(hw, hh) + 1.5;
          E(st.x - B, st.y - B, st.x + B, st.y + B, (g) => {
            g.save(); g.translate(st.x, st.y); g.rotate(ang);
            g.fillStyle = wood ? '#7a5a38' : metal ? '#5e665e' : st.type === 'ruin' ? 'rgba(140,134,118,0.92)' : '#8a8478'; g.fillRect(-hw, -hh, hw * 2, hh * 2);
            g.strokeStyle = wood ? 'rgba(50,30,14,0.45)' : 'rgba(40,36,30,0.35)'; g.lineWidth = 0.06;
            if (metal) { for (let y = -hh; y < hh; y += 1.6) for (let x = -hw; x < hw; x += 2.2) { g.strokeRect(x, y, 2.2, 1.6); g.fillStyle = 'rgba(200,210,190,0.35)'; for (const [ox, oy] of [[0.2, 0.2], [2, 0.2], [0.2, 1.4], [2, 1.4]]) g.fillRect(x + ox - 0.05, y + oy - 0.05, 0.1, 0.1); } g.fillStyle = 'rgba(160,200,60,0.18)'; g.beginPath(); g.arc(hw * 0.3, hh * 0.2, 1.2, 0, TAU); g.fill(); }
            else if (wood) { for (let y = -hh + 0.7; y < hh; y += 0.7) { g.beginPath(); g.moveTo(-hw, y); g.lineTo(hw, y); g.stroke(); } }
            else { g.save(); g.beginPath(); g.rect(-hw, -hh, hw * 2, hh * 2); g.clip(); for (let y = -hh; y < hh; y += 1.1) for (let x = -hw - ((Math.round((y + hh) / 1.1) % 2) ? 0.55 : 0); x < hw; x += 1.1) g.strokeRect(x, y, 1.1, 1.1); g.restore(); }
            if (st.type === 'ruin') { g.strokeStyle = 'rgba(20,18,14,0.45)'; g.lineWidth = 0.08; for (const [x, y, a, L] of cracks) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.lineTo(x + Math.cos(a + 0.6) * L * 1.6, y + Math.sin(a + 0.6) * L * 1.6); g.stroke(); } g.fillStyle = 'rgba(70,120,60,0.4)'; g.beginPath(); g.arc(-hw * 0.5, hh * 0.4, 0.9, 0, TAU); g.arc(hw * 0.6, -hh * 0.5, 0.6, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,215,140,0.25)'; g.beginPath(); g.arc(0, 0, 1.4, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,215,140,0.45)'; g.lineWidth = 0.12; g.beginPath(); g.arc(0, 0, 1.4, 0, TAU); g.stroke(); }
            else { g.fillStyle = 'rgba(160,60,40,0.5)'; g.fillRect(-hw * 0.35, -hh * 0.25, hw * 0.7, hh * 0.5); g.strokeStyle = 'rgba(240,200,120,0.4)'; g.lineWidth = 0.08; g.strokeRect(-hw * 0.35, -hh * 0.25, hw * 0.7, hh * 0.5); }
            g.restore();
          });
        } else if (st.type === 'bridge') {
          const ux = Math.cos(st.ang), uy = Math.sin(st.ang), Lo = st.gap / 2 + st.wr * 2 + st.L, L = Lo - st.wr;
          E(st.x - Lo - 3, st.y - Lo - 3, st.x + Lo + 3, st.y + Lo + 3, (g) => {
            // suối liền mạch dưới cầu (hai đầu bo tròn khớp với vùng nước chặn đường)
            g.lineCap = 'round'; g.strokeStyle = '#5a4a30'; g.lineWidth = st.wr * 2 + 0.9; g.beginPath(); g.moveTo(st.x - ux * L, st.y - uy * L); g.lineTo(st.x + ux * L, st.y + uy * L); g.stroke();
            g.strokeStyle = '#2f6a8a'; g.lineWidth = st.wr * 2; g.stroke();
            g.strokeStyle = '#3f7fa8'; g.lineWidth = st.wr * 1.4; g.stroke();
            g.strokeStyle = 'rgba(160,210,240,0.35)'; g.lineWidth = 0.12; for (let i = -L; i < L; i += 1.6) { g.beginPath(); g.moveTo(st.x + ux * i - uy * 0.5, st.y + uy * i + ux * 0.5); g.lineTo(st.x + ux * (i + 0.7) - uy * 0.5, st.y + uy * (i + 0.7) + ux * 0.5); g.stroke(); }
            // mặt cầu gỗ (đi ngang qua suối)
            g.save(); g.translate(st.x, st.y); g.rotate(st.ang);
            const bw = st.gap / 2 - 0.25, bl = st.wr + 1.2;
            g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-bw + 0.2, -bl + 0.3, bw * 2, bl * 2);
            g.fillStyle = '#9a6a3a'; g.fillRect(-bw, -bl, bw * 2, bl * 2);
            g.strokeStyle = 'rgba(60,36,16,0.6)'; g.lineWidth = 0.07; for (let y = -bl + 0.5; y < bl; y += 0.5) { g.beginPath(); g.moveTo(-bw, y); g.lineTo(bw, y); g.stroke(); }
            g.strokeStyle = '#5a3a1e'; g.lineWidth = 0.22; g.beginPath(); g.moveTo(-bw, -bl); g.lineTo(-bw, bl); g.moveTo(bw, -bl); g.lineTo(bw, bl); g.stroke();
            g.restore();
          });
        }
      }
      // 4) ổ boss (GĐ8: 4 ổ, mỗi ổ một kiểu sàn): Tân Thế (đá + phù văn cam), Hang Tử Khí (đá tím + sọ),
      //    Lò Khí Độc (sàn lưới sắt + vạch cảnh báo vàng đen), Kho Báu Hoàng Kim (sàn vàng + đồng xu)
      const LAIR_ST = [
        { c: ['#57534a', '#3f3b34', 'rgba(36,33,28,0)'], rune: 'rgba(255,196,110,0.32)', txt: 'rgba(255,205,130,0.4)' },
        { c: ['#4a4252', '#2e2834', 'rgba(26,22,30,0)'], rune: 'rgba(170,120,255,0.36)', txt: 'rgba(190,150,255,0.45)' },
        { c: ['#5a6050', '#3a3e34', 'rgba(30,34,26,0)'], rune: 'rgba(170,230,60,0.36)', txt: 'rgba(190,240,90,0.45)' },
        { c: ['#8a7240', '#5a4824', 'rgba(50,40,20,0)'], rune: 'rgba(255,224,110,0.5)', txt: 'rgba(255,230,140,0.55)' },
      ];
      for (const p of lairList()) {
        const id = p.id || 0, S0 = LAIR_ST[id] || LAIR_ST[0];
        const cracks = [];
        for (let i = 0; i < 10; i++) { let a = rnd() * TAU, r0 = rnd() * p.r * 0.55, x = p.x + Math.cos(a) * r0, y = p.y + Math.sin(a) * r0; const pts = [[x, y]]; for (let q = 0; q < 4; q++) { a += (rnd() - 0.5) * 1.2; x += Math.cos(a) * 1.1; y += Math.sin(a) * 1.1; pts.push([x, y]); } cracks.push(pts); }
        const bits = []; for (let i = 0; i < 18; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * p.r * 0.9; bits.push([p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, rnd(), rnd() * TAU]); }
        E(p.x - p.r * 1.4, p.y - p.r * 1.4, p.x + p.r * 1.4, p.y + p.r * 1.4, (g) => {
          const rg = g.createRadialGradient(p.x, p.y, p.r * 0.2, p.x, p.y, p.r * 1.3);
          rg.addColorStop(0, S0.c[0]); rg.addColorStop(0.7, S0.c[1]); rg.addColorStop(1, S0.c[2]);
          g.fillStyle = rg; g.beginPath(); g.arc(p.x, p.y, p.r * 1.3, 0, TAU); g.fill();
          g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.08;
          if (id === 2) {   // lưới sắt
            g.save(); g.beginPath(); g.arc(p.x, p.y, p.r * 0.95, 0, TAU); g.clip();
            for (let x = p.x - p.r; x < p.x + p.r; x += 1.2) { g.beginPath(); g.moveTo(x, p.y - p.r); g.lineTo(x, p.y + p.r); g.stroke(); }
            for (let y = p.y - p.r; y < p.y + p.r; y += 1.2) { g.beginPath(); g.moveTo(p.x - p.r, y); g.lineTo(p.x + p.r, y); g.stroke(); }
            g.restore();
            for (let i = 0; i < 24; i++) { const a0 = i / 24 * TAU; g.strokeStyle = i & 1 ? 'rgba(30,30,24,0.7)' : 'rgba(230,200,40,0.7)'; g.lineWidth = 0.5; g.beginPath(); g.arc(p.x, p.y, p.r * 0.9, a0, a0 + TAU / 24); g.stroke(); }
          } else {
            for (let r = 1.2; r < p.r * 0.95; r += 1.3) { g.beginPath(); g.arc(p.x, p.y, r, 0, TAU); g.stroke(); }
            for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.beginPath(); g.moveTo(p.x + Math.cos(a) * 1.2, p.y + Math.sin(a) * 1.2); g.lineTo(p.x + Math.cos(a) * p.r * 0.95, p.y + Math.sin(a) * p.r * 0.95); g.stroke(); }
          }
          g.strokeStyle = S0.rune; g.lineWidth = 0.22; g.beginPath(); g.arc(p.x, p.y, p.r * 0.82, 0, TAU); g.stroke();
          g.fillStyle = S0.txt; g.font = '0.9px serif'; g.textAlign = 'center';
          for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; g.save(); g.translate(p.x + Math.cos(a) * p.r * 0.72, p.y + Math.sin(a) * p.r * 0.72); g.rotate(a + Math.PI / 2); g.fillText('ᚱᚢᚾᛖᛟᛞ'[i % 6], 0, 0.3); g.restore(); }
          g.strokeStyle = 'rgba(10,8,6,0.45)'; g.lineWidth = 0.09;
          for (const c of cracks) { g.beginPath(); c.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
          if (id === 1) for (const [x, y, k, a] of bits) { if (k < 0.5) continue; g.fillStyle = 'rgba(214,206,190,0.75)'; g.beginPath(); g.arc(x, y, 0.32, 0, TAU); g.fill(); g.fillStyle = 'rgba(30,20,36,0.85)'; g.beginPath(); g.arc(x - 0.12, y - 0.04, 0.08, 0, TAU); g.arc(x + 0.12, y - 0.04, 0.08, 0, TAU); g.fill(); }
          if (id === 2) for (const [x, y, k] of bits) { if (k < 0.6) continue; g.fillStyle = 'rgba(150,220,50,0.5)'; g.beginPath(); g.arc(x, y, 0.5 + k * 0.4, 0, TAU); g.fill(); }
          if (id === 3) for (const [x, y, k, a] of bits) { g.fillStyle = k < 0.5 ? 'rgba(255,214,90,0.9)' : 'rgba(220,170,50,0.9)'; g.beginPath(); g.ellipse(x, y, 0.28, 0.2, a, 0, TAU); g.fill(); g.strokeStyle = 'rgba(120,80,20,0.6)'; g.lineWidth = 0.05; g.stroke(); }
        });
      }
      // GĐ8 — ống xả khí độc: nắp lưới tròn trên mặt đất (làn độc phun ra vẽ ở render)
      for (const v of MAP.vents || []) {
        E(v.x - 2, v.y - 2, v.x + 2, v.y + 2, (g) => {
          g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(v.x + 0.15, v.y + 0.2, 1.3, 0, TAU); g.fill();
          g.fillStyle = '#4a5046'; g.beginPath(); g.arc(v.x, v.y, 1.2, 0, TAU); g.fill();
          g.strokeStyle = '#2a2e26'; g.lineWidth = 0.1; g.stroke();
          g.strokeStyle = 'rgba(20,24,18,0.8)'; g.lineWidth = 0.12; for (let i = -2; i <= 2; i++) { const h = Math.sqrt(Math.max(0, 1 - (i * 0.4) * (i * 0.4))) * 1.0; g.beginPath(); g.moveTo(v.x + i * 0.4, v.y - h); g.lineTo(v.x + i * 0.4, v.y + h); g.stroke(); }
          g.fillStyle = 'rgba(160,230,60,0.35)'; g.beginPath(); g.arc(v.x, v.y, 0.5, 0, TAU); g.fill();
        });
      }
      // 5) bãi quái: khoảng đất, vòng đá, xương
      for (const c of MAP.camps) {
        const r = (c.type === 'small' ? 2.6 : 3.4) * MS, ring = c.type === 'red' ? '#e05a40' : c.type === 'blue' ? '#5a96f0' : c.type === 'gold' ? '#f0c850' : '#b0a888';
        const stones = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + rnd() * 0.4, d = r * (0.78 + rnd() * 0.18); stones.push([c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, 0.28 + rnd() * 0.25, rnd() * TAU, rnd()]); }
        E(c.x - r - 1, c.y - r - 1, c.x + r + 1, c.y + r + 1, (g) => {
          const rg = g.createRadialGradient(c.x, c.y, r * 0.15, c.x, c.y, r);
          rg.addColorStop(0, 'rgba(118,96,60,0.9)'); rg.addColorStop(0.8, 'rgba(96,80,50,0.6)'); rg.addColorStop(1, 'rgba(80,66,40,0)');
          g.fillStyle = rg; g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.fill();
          g.strokeStyle = hexA(ring, 0.45); g.lineWidth = 0.16; g.setLineDash([0.55, 0.45]); g.beginPath(); g.arc(c.x, c.y, r * 0.62, 0, TAU); g.stroke(); g.setLineDash([]);
          for (const [x, y, sr, a, k] of stones) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x + 0.07, y + 0.1, sr, sr * 0.7, a, 0, TAU); g.fill(); g.fillStyle = rgba(120 + k * 30, 116 + k * 25, 104 + k * 25, 1); g.beginPath(); g.ellipse(x, y, sr, sr * 0.7, a, 0, TAU); g.fill(); }
        });
      }
      // 6) quầy Thương Nhân (sân lát đá + lều vải) và điểm xuất phát (vòng phù văn nhỏ)
      for (const t of MAP.merchants) {
        const R0 = 4.2 * MS, cx = t.x, cy = t.y, col = ['#d0a050', '#5ab0a0', '#c06a8a', '#7a8ad0'][t.id % 4];
        E(cx - R0 - 2, cy - R0 - 2, cx + R0 + 2, cy + R0 + 2, (g) => {
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(cx + 0.4, cy + 0.6, R0 + 0.6, 0, TAU); g.fill();
          const rg = g.createRadialGradient(cx - R0 * 0.3, cy - R0 * 0.3, 1, cx, cy, R0 * 1.1);
          rg.addColorStop(0, '#8a8578'); rg.addColorStop(1, '#5a564c');
          g.fillStyle = rg; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8; g.lineTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); } g.closePath(); g.fill();
          g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 0.08;
          for (let r = 1.4; r < R0; r += 1.4) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); }
          // lều: mái vải sọc
          const w = 2.6, h = 1.8, tx = cx, ty = cy - 0.8;
          g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(tx + 0.3, ty + h * 0.6, w * 0.75, 0.6, 0, 0, TAU); g.fill();
          g.fillStyle = '#6a4a2a'; g.fillRect(tx - w * 0.6, ty, 0.18, h * 0.9); g.fillRect(tx + w * 0.6 - 0.18, ty, 0.18, h * 0.9);
          for (let k = 0; k < 6; k++) { g.fillStyle = k & 1 ? '#f0e8d0' : col; g.beginPath(); g.moveTo(tx - w * 0.7 + k * w * 1.4 / 6, ty); g.lineTo(tx - w * 0.7 + (k + 1) * w * 1.4 / 6, ty); g.lineTo(tx, ty - h * 0.55); g.closePath(); g.fill(); }
          g.fillStyle = '#7a5530'; g.fillRect(tx - w * 0.55, ty + h * 0.45, w * 1.1, 0.5);
          // thùng hàng
          for (const [ox, oy] of [[-2.4, 1.6], [2.2, 1.9], [2.9, 0.6]]) { g.fillStyle = '#8a6438'; g.fillRect(cx + ox - 0.45, cy + oy - 0.45, 0.9, 0.9); g.strokeStyle = '#4a3418'; g.lineWidth = 0.08; g.strokeRect(cx + ox - 0.45, cy + oy - 0.45, 0.9, 0.9); }
        });
      }
      for (const sp of MAP.spawns) {
        E(sp.x - 3, sp.y - 3, sp.x + 3, sp.y + 3, (g) => {
          g.strokeStyle = 'rgba(200,220,255,0.3)'; g.lineWidth = 0.14; g.beginPath(); g.arc(sp.x, sp.y, 1.8, 0, TAU); g.stroke();
          g.strokeStyle = 'rgba(200,220,255,0.18)'; g.beginPath(); g.arc(sp.x, sp.y, 1.2, 0, TAU); g.stroke();
          for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.fillStyle = 'rgba(210,230,255,0.3)'; g.beginPath(); g.arc(sp.x + Math.cos(a) * 1.8, sp.y + Math.sin(a) * 1.8, 0.14, 0, TAU); g.fill(); }
        });
      }
      // 7) tường: tảng đá tròn / vách đá + rặng cây (mỗi cây là cụm tán lá có bóng đổ)
      const tree = (x, y, cr, sd, reg) => {
        if (reg === 2 || reg === 6) return redRock(x, y, cr, sd, reg === 6);
        if (reg === 5 && sd() < 0.6) return pillar(x, y, cr, sd);
        if (reg === 7) return deadTree(x, y, cr, sd);
        if (reg === 8 && sd() < 0.45) return scrap(x, y, cr, sd);
        const P = REG[reg == null ? 3 : reg], L0 = P.leaf[0], L1 = P.leaf[1], L2 = P.leaf[2], snowy = reg === 4;
        const parts = [], n = 3 + Math.floor(sd() * 3);
        for (let i = 0; i < n; i++) { const a = sd() * TAU, d = cr * 0.35 * sd(); parts.push([x + Math.cos(a) * d, y + Math.sin(a) * d, cr * (0.55 + sd() * 0.25)]); }
        const base = 62 + sd() * 40, hue = sd(), leaves = [];
        for (const [px, py, pr] of parts) for (let i = 0; i < 7; i++) { const a = sd() * TAU, d = Math.sqrt(sd()) * pr * 0.8, dark = sd() < 0.5; leaves.push([px + Math.cos(a) * d + (dark ? pr * 0.12 : -pr * 0.12), py + Math.sin(a) * d + (dark ? pr * 0.12 : -pr * 0.12), pr * (0.12 + sd() * 0.12), dark]); }
        E(x - cr * 1.4, y - cr * 1.4, x + cr * 1.6, y + cr * 1.6, (g) => {
          g.fillStyle = 'rgba(0,0,0,0.32)'; for (const [px, py, pr] of parts) { g.beginPath(); g.arc(px + cr * 0.28, py + cr * 0.34, pr, 0, TAU); g.fill(); }
          for (const [px, py, pr] of parts) {
            const tg = g.createRadialGradient(px - pr * 0.35, py - pr * 0.4, pr * 0.1, px, py, pr);
            const v = (base - 80) * 0.4;
            tg.addColorStop(0, rgba(L0[0] + hue * 20, L0[1] + v, L0[2], 1)); tg.addColorStop(0.65, rgba(L1[0] + hue * 10, L1[1] + v, L1[2], 1)); tg.addColorStop(1, rgba(L2[0], L2[1], L2[2], 1));
            g.fillStyle = tg; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
          }
          for (const [lx2, ly2, lr, dark] of leaves) { g.fillStyle = dark ? 'rgba(10,34,14,0.28)' : 'rgba(170,230,130,0.16)'; g.beginPath(); g.arc(lx2, ly2, lr, 0, TAU); g.fill(); }
          g.fillStyle = 'rgba(190,240,150,0.12)'; for (const [px, py, pr] of parts) { g.beginPath(); g.arc(px - pr * 0.3, py - pr * 0.35, pr * 0.3, 0, TAU); g.fill(); }
          if (snowy) { g.fillStyle = 'rgba(245,250,255,0.85)'; for (const [px, py, pr] of parts) { g.beginPath(); g.ellipse(px - pr * 0.2, py - pr * 0.3, pr * 0.55, pr * 0.32, -0.3, 0, TAU); g.fill(); } }
        });
      };
      // Núi Đá Đỏ: tảng đá đỏ thay cây
      const redRock = (x, y, cr, sd, sandy) => {
        const pts = []; for (let i = 0; i < 9; i++) pts.push(cr * (0.8 + sd() * 0.3));
        const k = sd();
        if (sandy) return E(x - cr * 1.4, y - cr * 1.4, x + cr * 1.6, y + cr * 1.6, (g) => {
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x + cr * 0.25, y + cr * 0.32, cr, cr * 0.85, 0, 0, TAU); g.fill();
          const rg = g.createRadialGradient(x - cr * 0.4, y - cr * 0.45, cr * 0.1, x, y, cr * 1.05);
          rg.addColorStop(0, rgba(240, 214 + k * 20, 160, 1)); rg.addColorStop(0.55, rgba(190, 150 + k * 10, 96, 1)); rg.addColorStop(1, '#5a4020');
          g.fillStyle = rg; g.beginPath(); pts.forEach((rr, i) => { const a = i / 9 * TAU; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(70,46,20,0.45)'; g.lineWidth = 0.1; g.stroke();
          g.strokeStyle = 'rgba(120,80,40,0.35)'; g.beginPath(); g.moveTo(x - cr * 0.6, y + cr * 0.1); g.lineTo(x + cr * 0.6, y + cr * 0.05); g.moveTo(x - cr * 0.5, y + cr * 0.4); g.lineTo(x + cr * 0.5, y + cr * 0.38); g.stroke();
        });
        E(x - cr * 1.4, y - cr * 1.4, x + cr * 1.6, y + cr * 1.6, (g) => {
          g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x + cr * 0.25, y + cr * 0.32, cr, cr * 0.85, 0, 0, TAU); g.fill();
          const rg = g.createRadialGradient(x - cr * 0.4, y - cr * 0.45, cr * 0.1, x, y, cr * 1.05);
          rg.addColorStop(0, rgba(214 + k * 20, 140 + k * 20, 96, 1)); rg.addColorStop(0.55, rgba(160, 84 + k * 10, 56, 1)); rg.addColorStop(1, '#4a2216');
          g.fillStyle = rg; g.beginPath(); pts.forEach((rr, i) => { const a = i / 9 * TAU; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(40,16,8,0.5)'; g.lineWidth = 0.1; g.stroke();
          g.strokeStyle = 'rgba(255,210,170,0.25)'; g.beginPath(); g.moveTo(x - cr * 0.5, y - cr * 0.2); g.lineTo(x + cr * 0.1, y - cr * 0.55); g.stroke();
        });
      };
      // GĐ8 — Vùng Tử Khí: cây chết trơ cành (thân xám, cành khẳng khiu, vài đốm tử khí tím)
      const deadTree = (x, y, cr, sd) => {
        const br = []; const n = 5 + Math.floor(sd() * 3);
        for (let i = 0; i < n; i++) { const a = i / n * TAU + sd() * 0.6, L = cr * (0.7 + sd() * 0.5), bend = (sd() - 0.5) * 0.8; br.push([a, L, bend, sd()]); }
        const k = sd();
        E(x - cr * 1.6, y - cr * 1.6, x + cr * 1.8, y + cr * 1.8, (g) => {
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x + cr * 0.3, y + cr * 0.35, cr * 0.9, cr * 0.7, 0, 0, TAU); g.fill();
          g.fillStyle = 'rgba(120,80,160,0.12)'; g.beginPath(); g.arc(x, y, cr * 1.05, 0, TAU); g.fill();
          g.lineCap = 'round';
          for (const [a, L, bend, t] of br) {
            const mx = x + Math.cos(a + bend) * L * 0.5, my = y + Math.sin(a + bend) * L * 0.5, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
            g.strokeStyle = '#2a2428'; g.lineWidth = cr * 0.16; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
            g.strokeStyle = rgba(110 + k * 20, 100 + k * 16, 98, 1); g.lineWidth = cr * 0.1; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
            g.lineWidth = cr * 0.05; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(a + 0.9) * L * 0.35, my + Math.sin(a + 0.9) * L * 0.35); g.moveTo(ex, ey); g.lineTo(ex + Math.cos(a - 0.7) * L * 0.25, ey + Math.sin(a - 0.7) * L * 0.25); g.stroke();
          }
          const tg = g.createRadialGradient(x - cr * 0.1, y - cr * 0.1, 0, x, y, cr * 0.32);
          tg.addColorStop(0, '#8a8080'); tg.addColorStop(1, '#3a3236'); g.fillStyle = tg; g.beginPath(); g.arc(x, y, cr * 0.3, 0, TAU); g.fill();
        });
      };
      // GĐ8 — Trạm Khí Độc: đống sắt vụn gỉ (thay một phần cây)
      const scrap = (x, y, cr, sd) => {
        const parts = []; const n = 2 + Math.floor(sd() * 3);
        for (let i = 0; i < n; i++) parts.push([x + (sd() - 0.5) * cr, y + (sd() - 0.5) * cr, cr * (0.35 + sd() * 0.3), cr * (0.25 + sd() * 0.2), sd() * TAU, sd()]);
        E(x - cr * 1.6, y - cr * 1.6, x + cr * 1.8, y + cr * 1.8, (g) => {
          for (const [px, py, w, h, a] of parts) { g.save(); g.translate(px + cr * 0.15, py + cr * 0.2); g.rotate(a); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-w, -h, w * 2, h * 2); g.restore(); }
          for (const [px, py, w, h, a, k] of parts) {
            g.save(); g.translate(px, py); g.rotate(a);
            g.fillStyle = rgba(110 + k * 50, 70 + k * 30, 40 + k * 10, 1); g.fillRect(-w, -h, w * 2, h * 2);
            g.fillStyle = 'rgba(80,90,80,0.55)'; g.fillRect(-w, -h, w * 2, h * 0.6);
            g.strokeStyle = 'rgba(30,20,14,0.7)'; g.lineWidth = 0.07; g.strokeRect(-w, -h, w * 2, h * 2);
            g.fillStyle = 'rgba(40,30,20,0.8)'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * w * 0.7, 0, 0.07, 0, TAU); g.fill(); }
            g.restore();
          }
        });
      };
      // Phế Tích: cột đá đổ / khối đá vuông
      const pillar = (x, y, cr, sd) => {
        const a = (sd() - 0.5) * 0.6, w = cr * 1.4, h = cr * 1.1, k = sd(), broken = sd() < 0.5;
        E(x - cr * 1.6, y - cr * 1.6, x + cr * 1.8, y + cr * 1.8, (g) => {
          g.save(); g.translate(x, y); g.rotate(a);
          g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-w / 2 + 0.25, -h / 2 + 0.35, w, h);
          g.fillStyle = rgba(150 + k * 30, 144 + k * 28, 128 + k * 24, 1); g.fillRect(-w / 2, -h / 2, w, h);
          g.fillStyle = 'rgba(255,255,240,0.18)'; g.fillRect(-w / 2, -h / 2, w, h * 0.22);
          g.strokeStyle = 'rgba(40,36,30,0.55)'; g.lineWidth = 0.08; g.strokeRect(-w / 2, -h / 2, w, h);
          g.beginPath(); for (let i = 1; i < 3; i++) { g.moveTo(-w / 2 + w * i / 3, -h / 2); g.lineTo(-w / 2 + w * i / 3, h / 2); } g.stroke();
          if (broken) { g.fillStyle = 'rgba(30,28,24,0.6)'; g.beginPath(); g.moveTo(w / 2, -h / 2); g.lineTo(w / 2 - w * 0.3, -h / 2); g.lineTo(w / 2, -h / 2 + h * 0.4); g.closePath(); g.fill(); }
          g.fillStyle = 'rgba(70,120,60,0.5)'; g.beginPath(); g.arc(-w * 0.3, h * 0.35, cr * 0.25, 0, TAU); g.fill();
          g.restore();
        });
      };
      // GĐ7: tường có kiểu riêng
      const capsule = (w, outer, inner, hi, extra) => E(Math.min(w.ax, w.bx) - w.r * 1.6, Math.min(w.ay, w.by) - w.r * 1.6, Math.max(w.ax, w.bx) + w.r * 1.9, Math.max(w.ay, w.by) + w.r * 1.9, (g) => {
        g.lineCap = 'round';
        g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = w.r * 2.2; g.beginPath(); g.moveTo(w.ax + w.r * 0.3, w.ay + w.r * 0.4); g.lineTo(w.bx + w.r * 0.3 + 0.001, w.by + w.r * 0.4); g.stroke();
        g.strokeStyle = outer; g.lineWidth = w.r * 2; g.beginPath(); g.moveTo(w.ax, w.ay); g.lineTo(w.bx + 0.001, w.by); g.stroke();
        if (inner) { g.strokeStyle = inner; g.lineWidth = w.r * 1.2; g.beginPath(); g.moveTo(w.ax - w.r * 0.15, w.ay - w.r * 0.2); g.lineTo(w.bx - w.r * 0.15 + 0.001, w.by - w.r * 0.2); g.stroke(); }
        if (hi) { g.strokeStyle = hi; g.lineWidth = w.r * 0.35; g.beginPath(); g.moveTo(w.ax - w.r * 0.4, w.ay - w.r * 0.5); g.lineTo(w.bx - w.r * 0.4 + 0.001, w.by - w.r * 0.5); g.stroke(); }
        if (extra) extra(g);
      });
      const ticks = (w, step, col, lw) => (g) => { const L = Math.hypot(w.bx - w.ax, w.by - w.ay) || 1, ux = (w.bx - w.ax) / L, uy = (w.by - w.ay) / L; g.strokeStyle = col; g.lineWidth = lw; for (let t = step; t < L; t += step) { g.beginPath(); g.moveTo(w.ax + ux * t - uy * w.r, w.ay + uy * t + ux * w.r); g.lineTo(w.ax + ux * t + uy * w.r, w.ay + uy * t - ux * w.r); g.stroke(); } };
      const disc = (w, cols, extra) => E(w.ax - w.r * 1.5, w.ay - w.r * 1.5, w.ax + w.r * 1.8, w.ay + w.r * 1.8, (g) => {
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(w.ax + w.r * 0.3, w.ay + w.r * 0.4, w.r, w.r * 0.9, 0, 0, TAU); g.fill();
        const rg = g.createRadialGradient(w.ax - w.r * 0.4, w.ay - w.r * 0.45, w.r * 0.1, w.ax, w.ay, w.r);
        rg.addColorStop(0, cols[0]); rg.addColorStop(0.6, cols[1]); rg.addColorStop(1, cols[2]);
        g.fillStyle = rg; g.beginPath(); g.arc(w.ax, w.ay, w.r, 0, TAU); g.fill();
        if (extra) extra(g);
      });
      const rivets = (w, step) => (g) => { const L = Math.hypot(w.bx - w.ax, w.by - w.ay) || 1, ux = (w.bx - w.ax) / L, uy = (w.by - w.ay) / L; g.fillStyle = 'rgba(210,220,200,0.55)'; for (let t = step / 2; t < L; t += step) { g.beginPath(); g.arc(w.ax + ux * t - uy * w.r * 0.5, w.ay + uy * t + ux * w.r * 0.5, w.r * 0.12, 0, TAU); g.fill(); } };
      const STYLED = {
        // GĐ8 — bia mộ (tròn) / hàng rào đá nghĩa địa (đoạn, quanh Hang Tử Khí)
        grave: (w) => (w.round ? E(w.ax - w.r * 1.6, w.ay - w.r * 2, w.ax + w.r * 1.8, w.ay + w.r * 1.6, (g) => {
          const r = w.r, x = w.ax, y = w.ay;
          g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x + r * 0.3, y + r * 0.5, r * 1.1, r * 0.6, 0, 0, TAU); g.fill();
          g.fillStyle = '#6c6670'; g.beginPath(); g.moveTo(x - r * 0.8, y + r * 0.7); g.lineTo(x - r * 0.8, y - r * 0.5); g.arc(x, y - r * 0.5, r * 0.8, Math.PI, 0); g.lineTo(x + r * 0.8, y + r * 0.7); g.closePath(); g.fill();
          g.strokeStyle = '#2e2a30'; g.lineWidth = 0.07; g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x - r * 0.7, y - r * 0.6, r * 0.3, r * 1.2);
          g.strokeStyle = 'rgba(30,26,32,0.8)'; g.lineWidth = 0.08; g.beginPath(); g.moveTo(x, y - r * 0.8); g.lineTo(x, y + r * 0.2); g.moveTo(x - r * 0.35, y - r * 0.45); g.lineTo(x + r * 0.35, y - r * 0.45); g.stroke();
          g.fillStyle = 'rgba(110,140,80,0.5)'; g.beginPath(); g.arc(x + r * 0.5, y + r * 0.55, r * 0.25, 0, TAU); g.fill();
        }) : capsule(w, '#2e2a30', '#5a5460', 'rgba(200,190,220,0.22)', ticks(w, 1.2, 'rgba(20,16,22,0.6)', 0.08))),
        // GĐ8 — bồn khí độc: trụ kim loại tròn, vạch cảnh báo, nắp van
        tank: (w) => disc(w, ['#b8c0ae', '#7a8270', '#3a3e34'], (g) => {
          const x = w.ax, y = w.ay, r = w.r;
          for (let i = 0; i < 16; i++) { const a0 = i / 16 * TAU; g.strokeStyle = i & 1 ? 'rgba(30,30,24,0.85)' : 'rgba(230,200,40,0.85)'; g.lineWidth = r * 0.12; g.beginPath(); g.arc(x, y, r * 0.86, a0, a0 + TAU / 16); g.stroke(); }
          g.strokeStyle = 'rgba(30,34,28,0.6)'; g.lineWidth = 0.08; g.beginPath(); g.arc(x, y, r * 0.55, 0, TAU); g.stroke();
          g.fillStyle = '#4a5046'; g.beginPath(); g.arc(x, y, r * 0.25, 0, TAU); g.fill();
          g.fillStyle = 'rgba(160,230,60,0.8)'; g.beginPath(); g.arc(x, y, r * 0.12, 0, TAU); g.fill();
          g.fillStyle = '#d8c030'; g.font = `${r * 0.5}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('☣', x, y - r * 0.5);
        }),
        // GĐ8 — đường ống (thấp: đạn bay qua), mặt bích theo nhịp
        pipe: (w) => capsule(w, '#3a4038', '#6a7464', 'rgba(220,235,200,0.35)', (g) => { ticks(w, 1.8, 'rgba(24,28,22,0.75)', 0.16)(g); rivets(w, 1.8)(g); }),
        // GĐ8 — tường nhà xưởng bằng thép
        metal: (w) => capsule(w, '#30362e', '#5a625a', 'rgba(200,215,190,0.3)', rivets(w, 1.0)),
        wood: (w) => capsule(w, '#4a2e16', '#7a5230', 'rgba(220,170,110,0.35)', ticks(w, 0.9, 'rgba(40,24,10,0.6)', 0.06)),
        stone: (w) => (w.round ? disc(w, ['#d8d2c4', '#9a9486', '#4a463e'], (g) => { g.strokeStyle = 'rgba(40,36,30,0.5)'; g.lineWidth = 0.08; g.beginPath(); g.arc(w.ax, w.ay, w.r * 0.6, 0, TAU); g.stroke(); }) : capsule(w, '#5a564c', '#9a9486', 'rgba(255,250,235,0.3)', ticks(w, 1.1, 'rgba(30,28,22,0.55)', 0.07))),
        cliff: () => null,   // vách cao nguyên: vẽ liền mạch cùng cao nguyên (3b)
        water: () => null,   // suối: vẽ liền một dải cùng cây cầu (3b)
        log: (w) => capsule(w, '#4a2e14', '#7a5028', 'rgba(200,150,90,0.3)', (g) => { ticks(w, 1.3, 'rgba(30,18,8,0.5)', 0.05)(g); g.fillStyle = '#c09060'; for (const [x, y] of [[w.ax, w.ay], [w.bx, w.by]]) { g.beginPath(); g.arc(x, y, w.r * 0.85, 0, TAU); g.fill(); g.strokeStyle = 'rgba(90,60,30,0.7)'; g.lineWidth = 0.05; g.beginPath(); g.arc(x, y, w.r * 0.5, 0, TAU); g.stroke(); } }),
        mill: (w) => disc(w, ['#efe6d4', '#b8ae98', '#5a5444'], (g) => { g.fillStyle = '#8a3a2a'; g.beginPath(); g.arc(w.ax, w.ay, w.r * 0.62, 0, TAU); g.fill(); g.strokeStyle = 'rgba(40,14,8,0.6)'; g.lineWidth = 0.07; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.moveTo(w.ax, w.ay); g.lineTo(w.ax + Math.cos(a) * w.r * 0.62, w.ay + Math.sin(a) * w.r * 0.62); g.stroke(); } }),
        cactus: (w) => disc(w, ['#8ad070', '#4a8a3a', '#1e4a18'], (g) => { g.strokeStyle = 'rgba(20,60,16,0.6)'; g.lineWidth = 0.05; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.moveTo(w.ax, w.ay); g.lineTo(w.ax + Math.cos(a) * w.r * 0.9, w.ay + Math.sin(a) * w.r * 0.9); g.stroke(); } g.fillStyle = '#ff9ad5'; g.beginPath(); g.arc(w.ax - w.r * 0.2, w.ay - w.r * 0.3, w.r * 0.18, 0, TAU); g.fill(); }),
      };
      const cactusDeco = (x, y, h, k) => E(x - h, y - h * 1.6, x + h, y + 0.3, (g) => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + 0.1, y + 0.05, h * 0.5, h * 0.18, 0, 0, TAU); g.fill(); g.strokeStyle = rgba(60 + k * 30, 130, 60, 1); g.lineCap = 'round'; g.lineWidth = h * 0.35; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h * 1.3); g.moveTo(x, y - h * 0.6); g.lineTo(x - h * 0.45, y - h * 0.75); g.lineTo(x - h * 0.45, y - h * 1.05); g.moveTo(x, y - h * 0.8); g.lineTo(x + h * 0.4, y - h * 0.9); g.lineTo(x + h * 0.4, y - h * 1.15); g.stroke(); });
      const rockDeco = (x, y) => { const rx = 0.25 + rnd() * 0.35, ry = 0.18 + rnd() * 0.2, a = rnd() * TAU, kk = rnd(); E(x - 0.8, y - 0.8, x + 0.8, y + 0.8, (g) => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + 0.06, y + 0.08, rx, ry, a, 0, TAU); g.fill(); g.fillStyle = rgba(200 + kk * 30, 170 + kk * 24, 120, 0.95); g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill(); }); };
      const hay = (b) => { const straws = []; for (let i = 0; i < 40; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * b.r * 0.85; straws.push([b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, rnd() * TAU, rnd()]); }
        E(b.x - b.r - 1, b.y - b.r - 1, b.x + b.r + 1, b.y + b.r + 1, (g) => {
          g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(b.x + 0.3, b.y + 0.4, b.r, 0, TAU); g.fill();
          const rg = g.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
          rg.addColorStop(0, '#f2d27a'); rg.addColorStop(0.7, '#c89a40'); rg.addColorStop(1, '#7a5a20');
          g.fillStyle = rg; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill();
          g.lineWidth = 0.05; for (const [x, y, a, k] of straws) { g.strokeStyle = k < 0.5 ? 'rgba(255,240,170,0.6)' : 'rgba(120,80,20,0.45)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 0.45, y + Math.sin(a) * 0.45); g.stroke(); }
        }); };
      // GĐ8 — bụi gai khô (nghĩa địa): đám cành xám rối, vẫn che thân như bụi thường
      const thorn = (b) => { const tw = []; for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * b.r * 0.85, L = 0.5 + rnd() * 0.7, ta = rnd() * TAU; tw.push([b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, L, ta, rnd()]); }
        E(b.x - b.r - 1, b.y - b.r - 1, b.x + b.r + 1, b.y + b.r + 1, (g) => {
          g.fillStyle = 'rgba(30,24,34,0.55)'; g.beginPath(); g.arc(b.x + 0.2, b.y + 0.3, b.r * 1.02, 0, TAU); g.fill();
          g.fillStyle = 'rgba(70,62,70,0.75)'; g.beginPath(); g.arc(b.x, b.y, b.r * 0.92, 0, TAU); g.fill();
          g.lineCap = 'round';
          for (const [x, y, L, a, k] of tw) { g.strokeStyle = rgba(120 + k * 40, 104 + k * 30, 96 + k * 30, 0.9); g.lineWidth = 0.07; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.lineTo(x + Math.cos(a + 0.6) * L * 1.4, y + Math.sin(a + 0.6) * L * 1.4); g.stroke(); }
          g.strokeStyle = 'rgba(170,130,220,0.25)'; g.lineWidth = 0.07; g.beginPath(); g.arc(b.x, b.y, b.r * 0.97, 0, TAU); g.stroke();
        }); };
      for (const w of MAP.walls) {
        const r = w.r, L = Math.max(0.01, Math.hypot(w.bx - w.ax, w.by - w.ay));
        const reg = BIO(G.MAP.regionAt((w.ax + w.bx) / 2, (w.ay + w.by) / 2).id), P = REG[reg] || REG[5];
        if (w.style && STYLED[w.style]) { STYLED[w.style](w, reg, P); continue; }
        if (w.round) {
          const cA = reg === 2 ? ['#e0a070', '#a05a3a', '#4a2216'] : reg === 4 ? ['#e8eef6', '#9aa6b6', '#4a5262'] : reg === 6 ? ['#e8c890', '#b08850', '#5a4020'] : reg === 7 ? ['#8a8290', '#5a5260', '#26222a'] : reg === 8 ? ['#a0a090', '#6a6a58', '#30302a'] : ['#a4a49a', '#6e6f66', '#3a3b34'];
          const pts = []; for (let i = 0; i < 11; i++) pts.push(r * (0.86 + rnd() * 0.2));
          const lines = []; for (let i = 0; i < 4; i++) lines.push(rnd() * TAU);
          const moss = []; for (let i = 0; i < 7; i++) moss.push([rnd() * TAU, r * (0.16 + rnd() * 0.16), rnd()]);
          E(w.ax - r * 1.4, w.ay - r * 1.4, w.ax + r * 1.6, w.ay + r * 1.6, (g) => {
            g.fillStyle = 'rgba(0,0,0,0.38)'; g.beginPath(); g.ellipse(w.ax + r * 0.28, w.ay + r * 0.36, r * 1.05, r * 0.95, 0, 0, TAU); g.fill();
            const rg = g.createRadialGradient(w.ax - r * 0.4, w.ay - r * 0.45, r * 0.1, w.ax, w.ay, r * 1.05);
            rg.addColorStop(0, cA[0]); rg.addColorStop(0.55, cA[1]); rg.addColorStop(1, cA[2]);
            g.fillStyle = rg; g.beginPath(); pts.forEach((rr, i) => { const a = i / 11 * TAU; g.lineTo(w.ax + Math.cos(a) * rr, w.ay + Math.sin(a) * rr); }); g.closePath(); g.fill();
            g.strokeStyle = 'rgba(18,18,14,0.6)'; g.lineWidth = 0.12; g.stroke();
            g.strokeStyle = 'rgba(18,18,14,0.35)'; g.lineWidth = 0.08;
            for (const a of lines) { g.beginPath(); g.moveTo(w.ax + Math.cos(a) * r * 0.15, w.ay + Math.sin(a) * r * 0.15); g.lineTo(w.ax + Math.cos(a + 0.5) * r * 0.75, w.ay + Math.sin(a + 0.5) * r * 0.75); g.stroke(); }
            for (const [a, mr, k] of moss) { g.fillStyle = reg === 4 ? 'rgba(250,252,255,0.9)' : reg === 2 || reg === 6 ? rgba(150 + k * 30, 120, 60, 0.7) : reg === 7 ? rgba(110 + k * 30, 80, 140 + k * 30, 0.6) : reg === 8 ? rgba(150 + k * 30, 200, 50, 0.7) : rgba(40 + k * 30, 92 + k * 40, 36 + k * 20, 0.8); g.beginPath(); g.arc(w.ax + Math.cos(a) * r * 0.92, w.ay + Math.sin(a) * r * 0.92, mr, 0, TAU); g.fill(); }
          });
          continue;
        }
        E(Math.min(w.ax, w.bx) - r * 1.5, Math.min(w.ay, w.by) - r * 1.5, Math.max(w.ax, w.bx) + r * 1.8, Math.max(w.ay, w.by) + r * 1.8, (g) => {
          g.lineCap = 'round';
          g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = r * 2.3; g.beginPath(); g.moveTo(w.ax + r * 0.28, w.ay + r * 0.36); g.lineTo(w.bx + r * 0.28 + 0.001, w.by + r * 0.36); g.stroke();
          g.strokeStyle = P.wall[0]; g.lineWidth = r * 2; g.beginPath(); g.moveTo(w.ax, w.ay); g.lineTo(w.bx + 0.001, w.by); g.stroke();
          g.strokeStyle = P.wall[1]; g.lineWidth = r * 1.3; g.beginPath(); g.moveTo(w.ax - r * 0.12, w.ay - r * 0.16); g.lineTo(w.bx - r * 0.12 + 0.001, w.by - r * 0.16); g.stroke();
        });
        const n = Math.max(3, Math.round(L / (r * 0.95)) + 2), sd = prng(Math.floor(w.ax * 131 + w.ay * 17 + w.bx * 7));
        for (let i = 0; i < n; i++) {
          const t = i / (n - 1), x = w.ax + (w.bx - w.ax) * t + (sd() - 0.5) * r * 0.8, y = w.ay + (w.by - w.ay) * t + (sd() - 0.5) * r * 0.8;
          tree(x, y, r * (0.78 + sd() * 0.45), sd, reg);
        }
      }
      // 8) cây & đá lẻ trong rừng (chỉ trang trí, không chặn đường)
      for (let i = 0; i < C.MAP * C.MAP / 110; i++) {
        const x = rnd() * C.MAP, y = rnd() * C.MAP, f = this.sampF(x, y); if (f < 0.5) continue;
        const reg = BIO(pickRegion(x, y, rnd(), wb));
        if (MAP.inWall(x, y, 1.4) || MAP.bushAt(x, y) >= 0 || (MAP.terrainAt && MAP.terrainAt(x, y)) || (MAP.heightAt && MAP.plateauAt(x, y))) continue;
        if (reg === 6 && rnd() < 0.5) continue;
        let near = false; for (const c of MAP.camps) if (Math.hypot(c.x - x, c.y - y) < 5 * MS) near = true; for (const t of MAP.merchants) if (Math.hypot(t.x - x, t.y - y) < 7 * MS) near = true; for (const L of lairList()) if (Math.hypot(L.x - x, L.y - y) < L.r + 3) near = true; if (near) continue;
        const k = rnd();
        if (reg === 6) { if (k < 0.5) cactusDeco(x, y, 0.35 + rnd() * 0.3, rnd()); else rockDeco(x, y, reg); continue; }
        if (reg === 7 && k < 0.5) continue;   // Tử Khí thưa cây
        if (reg === 7 || reg === 8) { if (k < 0.7) tree(x, y, 0.7 + rnd() * 0.7, prng(i * 7919), reg); else rockDeco(x, y, reg); continue; }
        if (k < 0.35) { const rx = 0.25 + rnd() * 0.35, ry = 0.18 + rnd() * 0.2, a = rnd() * TAU, kk = rnd(), col = reg === 2 ? rgba(170 + kk * 36, 96 + kk * 30, 66, 0.9) : reg === 4 ? rgba(220 + kk * 30, 228 + kk * 24, 240, 0.9) : rgba(108 + kk * 36, 104 + kk * 34, 96 + kk * 30, 0.9); E(x - 0.8, y - 0.8, x + 0.8, y + 0.8, (g) => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + 0.06, y + 0.08, rx, ry, a, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill(); }); }
        else if (k < 0.5) { const cap = ['#c8503a', '#d8a050', '#e8e0d0'][Math.floor(rnd() * 3)]; E(x - 0.5, y - 0.5, x + 0.5, y + 0.5, (g) => { g.fillStyle = '#e8dcc8'; g.fillRect(x - 0.05, y - 0.1, 0.1, 0.25); g.fillStyle = cap; g.beginPath(); g.ellipse(x, y - 0.12, 0.2, 0.12, 0, Math.PI, TAU); g.fill(); }); }
        else tree(x, y, 0.7 + rnd() * 0.7, prng(i * 7919), reg);
      }
      // 9) bụi cỏ: lá rậm nhiều lớp
      for (const b of MAP.bushes) {
        if (b.kind === 'hay') { hay(b); continue; }
        if (b.kind === 'dead') { thorn(b); continue; }
        const bb = BIO(G.MAP.regionAt(b.x, b.y).id), BP = (REG[bb] || REG[5]).bush, snowB = bb === 4;
        const leaves = []; for (let i = 0; i < 34 * MS; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * b.r * 0.86; leaves.push([b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 0.32 + rnd() * 0.42, rnd() * TAU, rnd()]); }
        E(b.x - b.r - 1, b.y - b.r - 1, b.x + b.r + 1, b.y + b.r + 1, (g) => {
          g.fillStyle = 'rgba(8,36,12,0.6)'; g.beginPath(); g.arc(b.x + 0.2, b.y + 0.3, b.r * 1.03, 0, TAU); g.fill();
          for (const [x, y, lr, a, k] of leaves) { g.fillStyle = rgba(BP[0][0] + k * BP[1][0], BP[0][1] + k * BP[1][1], BP[0][2] + k * BP[1][2], 1); g.beginPath(); g.ellipse(x, y, lr, lr * 0.55, a, 0, TAU); g.fill(); }
          if (snowB) { g.fillStyle = 'rgba(250,252,255,0.75)'; for (let q = 0; q < leaves.length; q += 3) { const [x, y, lr] = leaves[q]; g.beginPath(); g.arc(x - lr * 0.2, y - lr * 0.2, lr * 0.45, 0, TAU); g.fill(); } }
          g.strokeStyle = 'rgba(160,230,120,0.22)'; g.lineWidth = 0.07; g.beginPath(); g.arc(b.x, b.y, b.r * 0.97, 0, TAU); g.stroke();
        });
      }
      this.built = true;
    },
    // ảnh mặt đất toàn bản đồ (tính 1 lần ở GP px/đv, các ô chỉ cắt & phóng lên) + lớp hạt mịn
    groundCanvas() {
      if (this.gcv) return this.gcv;
      const C = G.C, GP = this.GP = Math.min(this.mobile ? 3 : 4, (this.mobile ? 1296 : 1728) / C.MAP), N = Math.ceil(C.MAP * GP);   // GĐ8: bản đồ to hơn → giữ ảnh nền cỡ cũ
      const cv = document.createElement('canvas'); cv.width = N; cv.height = N;
      const g = cv.getContext('2d'), img = g.createImageData(N, N), px = img.data, out = [0, 0, 0];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        this.groundRGB(x / GP, y / GP, out);
        const o = (y * N + x) * 4; px[o] = out[0]; px[o + 1] = out[1]; px[o + 2] = out[2]; px[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      const gr = this.grain = document.createElement('canvas'); gr.width = gr.height = 96;
      const gg = gr.getContext('2d'), gi = gg.createImageData(96, 96), rnd = prng(4242);
      for (let i = 0; i < 96 * 96; i++) { const v = rnd() < 0.5 ? 0 : 255; gi.data[i * 4] = gi.data[i * 4 + 1] = gi.data[i * 4 + 2] = v; gi.data[i * 4 + 3] = Math.floor(rnd() * 60); }
      gg.putImageData(gi, 0, 0);
      return (this.gcv = cv);
    },
    // vẽ một vùng [x0,y0]–[x0+w,y0+h] (đv) ra canvas ở ppu px/đv
    render(x0, y0, w, h, ppu) {
      this.build();
      const W = Math.max(1, Math.round(w * ppu)), H = Math.max(1, Math.round(h * ppu));
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d'), gc = this.groundCanvas(), GP = this.GP;
      g.imageSmoothingEnabled = true;
      g.drawImage(gc, x0 * GP, y0 * GP, w * GP, h * GP, 0, 0, W, H);
      g.globalAlpha = 0.5; g.fillStyle = g.createPattern(this.grain, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      g.save(); g.scale(ppu, ppu); g.translate(-x0, -y0);
      // nét vẽ chạm vùng này (theo thứ tự dựng)
      const c = this.cell, cols = this.cols, seen = new Set(), list = [];
      for (let cy = Math.max(0, Math.floor(y0 / c)); cy <= Math.min(cols - 1, Math.floor((y0 + h) / c)); cy++)
        for (let cx = Math.max(0, Math.floor(x0 / c)); cx <= Math.min(cols - 1, Math.floor((x0 + w) / c)); cx++)
          for (const i of this.buckets[cy * cols + cx]) if (!seen.has(i)) { seen.add(i); list.push(i); }
      list.sort((a, b) => a - b);
      for (const i of list) { const p = this.prims[i]; if (p.x1 < x0 || p.y1 < y0 || p.x0 > x0 + w || p.y0 > y0 + h) continue; g.save(); p.fn(g); g.restore(); }
      // viền bản đồ tối dần
      const C = G.C, vg = g.createRadialGradient(C.MAP / 2, C.MAP / 2, C.MAP * 0.44, C.MAP / 2, C.MAP / 2, C.MAP * 0.76);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)');
      g.fillStyle = vg; g.fillRect(x0, y0, w, h);
      g.restore();
      return cv;
    },
  };
  // GĐ7: đổi bản đồ → dựng lại cảnh
  Art.reset = function () { this.built = false; this.prims = []; this.buckets = null; this.gcv = null; };
  // ---------- bộ đệm ô nền cho renderer ----------
  class MapTiles {
    constructor(mobile) {
      this.mobile = mobile; this.cache = new Map(); this.queue = []; this.max = mobile ? 30 : 48; Art.mobile = mobile;
      if (Art.mapVer !== G.MAP.version) { Art.reset(); Art.mapVer = G.MAP.version; }
      const C = G.C;
      this.overview = Art.render(0, 0, C.MAP, C.MAP, Math.min(mobile ? 3 : 4, (mobile ? 1296 : 1728) / C.MAP));   // ảnh tổng quan (bản đồ nhỏ + tạm thời)
    }
    level(pxPerUnit) { return pxPerUnit <= 9 ? 8 : pxPerUnit <= 17 ? 16 : pxPerUnit <= 25 ? 24 : 32; }
    // vẽ nền vùng nhìn thấy; tạo ô còn thiếu trong giới hạn thời gian
    draw(ctx, r) {
      const C = G.C, z = r.cam.zoom, lv = this.level(z * r.dpr), o = r.w2s(0, 0);
      const x0 = Math.max(0, Math.floor(-o.x / z / T)), y0 = Math.max(0, Math.floor(-o.y / z / T));
      const x1 = Math.min(Math.ceil(C.MAP / T) - 1, Math.floor((r.W - o.x) / z / T)), y1 = Math.min(Math.ceil(C.MAP / T) - 1, Math.floor((r.H - o.y) / z / T));
      const ov = this.overview, k = ov.width / C.MAP;
      // phóng rất xa (xem toàn đấu trường): vẽ thẳng ảnh tổng quan, không dựng ô
      if (z * r.dpr <= k * 1.25) {
        const X0 = Math.max(0, -o.x / z), Y0 = Math.max(0, -o.y / z), X1 = Math.min(C.MAP, (r.W - o.x) / z), Y1 = Math.min(C.MAP, (r.H - o.y) / z);
        if (X1 > X0 && Y1 > Y0) ctx.drawImage(ov, X0 * k, Y0 * k, (X1 - X0) * k, (Y1 - Y0) * k, o.x + X0 * z, o.y + Y0 * z, (X1 - X0) * z, (Y1 - Y0) * z);
        return;
      }
      const t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
      let made = 0;
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const key = tx + ',' + ty + ',' + lv;
        let tile = this.cache.get(key);
        if (!tile && (made === 0 || performance.now() - t0 < 10)) {
          const w = Math.min(T, C.MAP - tx * T), h = Math.min(T, C.MAP - ty * T);
          tile = Art.render(tx * T, ty * T, w, h, lv); this.cache.set(key, tile); made++;
          if (this.cache.size > this.max) this.cache.delete(this.cache.keys().next().value);
        } else if (tile) { this.cache.delete(key); this.cache.set(key, tile); }   // dùng gần đây → giữ lại
        const sx = o.x + tx * T * z, sy = o.y + ty * T * z, w = Math.min(T, C.MAP - tx * T), h = Math.min(T, C.MAP - ty * T);
        if (tile) ctx.drawImage(tile, sx, sy, w * z + 0.6, h * z + 0.6);
        else ctx.drawImage(ov, tx * T * k, ty * T * k, w * k, h * k, sx, sy, w * z + 0.6, h * z + 0.6);
      }
    }
  }
  G.MapArt = Art; G.MapTiles = MapTiles; G.MapArt.REG = REG; G.MapArt.regionW = regionW;
})();
