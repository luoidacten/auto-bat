'use strict';
// ===== Tìm đường: lưới nút cố định + đường ngắn nhất tính sẵn (Dijkstra từ mỗi nút) =====
// Đi thẳng nếu không có tường chắn; nếu bị chắn thì đi qua nút trung gian tốt nhất.
// GĐ7: bản đồ sinh theo hạt giống → G.NAV.rebuild() dựng lại lưới mỗi khi đổi bản đồ (G.buildMap gọi).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const MAP = G.MAP;
  const S = G.C.MS || 1, STEP = 10 * S, PAD = 0.9;      // GĐ6b: bản đồ 432 → lưới thưa 16 đv (≈ 700 nút)
  const nodes = [];
  let N = 0, D = new Float64Array(0), NX = new Int32Array(0);
  function rebuild() {
    nodes.length = 0;
    const addNode = (x, y) => { if (x > 2 && y > 2 && x < G.C.MAP - 2 && y < G.C.MAP - 2 && !MAP.inWall(x, y, 1.3)) nodes.push({ x, y, i: nodes.length }); };
    for (let y = 4; y <= G.C.MAP - 4; y += STEP) for (let x = 4; x <= G.C.MAP - 4; x += STEP) addNode(x, y);
    // thêm nút ở hai đầu mỗi bức tường dài (để đi vòng qua lối hẹp) và quanh tảng đá lớn
    for (const w of MAP.walls) {
      if (w.round) { if (w.r >= 5) for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; addNode(w.ax + Math.cos(a) * (w.r + 2), w.ay + Math.sin(a) * (w.r + 2)); } continue; }
      const dx = w.bx - w.ax, dy = w.by - w.ay, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, k = w.r + 1.6;
      addNode(w.ax - ux * k, w.ay - uy * k); addNode(w.bx + ux * k, w.by + uy * k);
    }
    // GĐ7: nút trong nhà / trước cửa, trên cao nguyên / chân dốc, hai đầu cầu & hẻm núi
    for (const p of MAP.navPts || []) {
      if (p.x > 2 && p.y > 2 && p.x < G.C.MAP - 2 && p.y < G.C.MAP - 2 && !MAP.inWall(p.x, p.y, 0.9)) nodes.push({ x: p.x, y: p.y, i: nodes.length, fine: true });
    }
    N = nodes.length;
    // cạnh: nút gần nhau (≤ 1.8 bước) không bị tường chắn
    const adj = Array.from({ length: N }, () => []);
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y;
      if (Math.abs(dx) > STEP * 1.8 || Math.abs(dy) > STEP * 1.8) continue;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= STEP * 1.8 && !MAP.blocked(a.x, a.y, b.x, b.y, (a.fine || b.fine) ? PAD * 0.7 : PAD)) { adj[i].push(j, d); adj[j].push(i, d); }
    }
    // đường ngắn nhất mọi cặp: Dijkstra từ từng nút (đồ thị thưa) — D: độ dài, NX: nút kế tiếp đầu tiên trên đường đi
    D = new Float64Array(N * N).fill(Infinity); NX = new Int32Array(N * N).fill(-1);
    let E = N; for (const A of adj) E += A.length / 2;
    const heapK = new Float64Array(E), heapV = new Int32Array(E), first = new Int32Array(N);
    for (let src = 0; src < N; src++) {
      const base = src * N;
      let hn = 0;
      const push = (k, v) => { let i = hn++; while (i > 0) { const p = (i - 1) >> 1; if (heapK[p] <= k) break; heapK[i] = heapK[p]; heapV[i] = heapV[p]; i = p; } heapK[i] = k; heapV[i] = v; };
      const pop = () => { const v = heapV[0], k = heapK[--hn], x = heapV[hn]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= hn) break; if (c + 1 < hn && heapK[c + 1] < heapK[c]) c++; if (heapK[c] >= k) break; heapK[i] = heapK[c]; heapV[i] = heapV[c]; i = c; } heapK[i] = k; heapV[i] = x; return v; };
      D[base + src] = 0; NX[base + src] = src; first[src] = src;
      push(0, src);
      while (hn > 0) {
        const dk = heapK[0], u = pop();
        if (dk > D[base + u]) continue;
        const A = adj[u];
        for (let e = 0; e < A.length; e += 2) {
          const v = A[e], nd = dk + A[e + 1];
          if (nd < D[base + v]) { D[base + v] = nd; first[v] = u === src ? v : first[u]; NX[base + v] = first[v]; push(nd, v); }
        }
      }
    }
    // kiểm tra liên thông: mọi nút phải tới được nút đầu tiên
    let unreachable = 0;
    for (let i = 1; i < N; i++) if (D[i] === Infinity) unreachable++;
    if (unreachable) MAP.problems.push(`tìm đường: ${unreachable} nút bị cô lập`);
    return unreachable;
  }
  // các nút nhìn thấy (không bị chắn) quanh điểm p, gần nhất trước
  function visibleNodes(p, max) {
    const out = [];
    for (const n of nodes) {
      const dx = n.x - p.x, dy = n.y - p.y, d2 = dx * dx + dy * dy;
      if (d2 > STEP * STEP * 2.6) continue;
      out.push({ n, d: Math.sqrt(d2) });
    }
    out.sort((a, b) => a.d - b.d || a.n.i - b.n.i);
    const res = [];
    for (const o of out) {
      if (!MAP.blocked(p.x, p.y, o.n.x, o.n.y, PAD * 0.7)) res.push(o);
      if (res.length >= max) break;
    }
    return res;
  }
  // điểm kế tiếp nên đi tới để đến "to"
  function nextPoint(from, to) {
    if (!MAP.blocked(from.x, from.y, to.x, to.y, PAD * 0.7)) return { x: to.x, y: to.y };
    const A = visibleNodes(from, 4), B = visibleNodes(to, 4);
    let best = null, bc = Infinity;
    for (const a of A) for (const b of B) {
      const c = a.d + D[a.n.i * N + b.n.i] + b.d;
      if (c < bc) { bc = c; best = { a: a.n, b: b.n }; }
    }
    if (!best) return { x: to.x, y: to.y };
    // nếu đã nhìn thấy nút kế tiếp sau a thì đi thẳng tới nút đó (đỡ đi zíc zắc)
    let cur = best.a;
    for (let guard = 0; guard < 6 && cur !== best.b; guard++) {
      const nx = nodes[NX[cur.i * N + best.b.i]];
      if (!nx || MAP.blocked(from.x, from.y, nx.x, nx.y, PAD * 0.7)) break;
      cur = nx;
    }
    if (cur === best.b && !MAP.blocked(from.x, from.y, to.x, to.y, PAD * 0.7)) return { x: to.x, y: to.y };
    return { x: cur.x, y: cur.y };
  }
  // GĐ5e: độ dài đường đi bộ ngắn nhất từ from tới to (đi thẳng nếu không bị tường chắn) — dùng để chấm điểm vượt tường / cắt đuôi
  function pathLen(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y, d = Math.sqrt(dx * dx + dy * dy);
    if (!MAP.blocked(from.x, from.y, to.x, to.y, PAD * 0.7)) return d;
    const A = visibleNodes(from, 4), B = visibleNodes(to, 4);
    let bc = Infinity;
    for (const a of A) for (const b of B) { const c = a.d + D[a.n.i * N + b.n.i] + b.d; if (c < bc) bc = c; }
    return bc === Infinity ? d * 1.6 : bc;
  }
  G.NAV = { nodes, nextPoint, pathLen, rebuild, dist: (i, j) => D[i * N + j] };
  rebuild(); MAP.ready = true;
})();
