'use strict';
// ===== ĐẤU TRƯỜNG SINH TỒN (KẺ ĐẶT CƯỢC) — BẢN ĐỒ SINH THEO HẠT GIỐNG (GĐ7, GĐ8) =====
// GĐ8: đấu trường vuông 612×612 (diện tích ×2), 8 vùng: Phế Tích Tân Thế ở giữa (ổ Boss Tân Thế / Rồng) và 7 vùng ngoài —
// 5 vùng biome (mỗi vùng 2 điểm xuất phát) + Vùng Tử Khí (ổ boss Hang Tử Khí) + Trạm Khí Độc (ổ boss Lò Khí Độc);
// vùng biome ở phía trên (giữa hai vùng biome khác) có thêm ổ boss Kho Báu Hoàng Kim → 4 ổ boss, vùng biome nào cũng kề một ổ.
// KHUNG CỐ ĐỊNH (công bằng cho mọi điểm xuất phát): ổ boss, vách núi ở ranh giới vùng (có khe), bãi quái, Thương Nhân,
// điểm xuất phát, bụi cỏ gốc, tảng đá che giữa hai điểm xuất phát.
// PHẦN NGẪU NHIÊN (mỗi trận một bản đồ, theo hạt giống): 5 vùng ngoài lấy 5 trong 6 biome (xáo thứ tự), mỗi vùng 6–8
// công trình / địa hình rút từ "túi" của biome đó: nhà, đền đổ, hẻm núi, cao nguyên (dốc lên), cầu qua suối, ao bùn /
// mặt băng / cát lún, thùng thuốc nổ, rặng cây đổ, cối xay gió, xương rồng, bụi rậm thêm.
// KIỂM TRA HỢP LỆ: công trình giữ khoảng cách tối thiểu với nhau và với các điểm quan trọng; loang tìm vùng kín (mọi điểm
// xuất phát, bãi quái, Thương Nhân, trong nhà, trên cao nguyên phải đi tới được); lưới tìm đường phải liên thông.
// Hỏng → thử hạt giống phụ (tối đa 6 lần) → vẫn hỏng thì dùng bản đồ cổ điển (không công trình ngẫu nhiên).
// Toạ độ tính bằng lượng giác tự viết (G.M.cos/sin) và làm tròn → mọi máy cho cùng một bản đồ với cùng hạt giống.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const { segDist } = G.M;
  const S = G.C.MS || 1;
  const N = G.C.MAP, CX = N / 2, CY = N / 2;
  const K = N / 432;                                     // GĐ8: cạnh bản đồ ×1.42 (diện tích ×2) — bán kính bố cục nhân K
  const NSEC = 7, CENTER = NSEC, STEP = 360 / NSEC, HALF = STEP / 2;   // 7 vùng ngoài (mỗi vùng ≈51°), vùng giữa có id 7
  const SPECIAL = { 2: 7, 5: 8 };                        // vùng 2 = Vùng Tử Khí (biome 7), vùng 5 = Trạm Khí Độc (biome 8) — không có điểm xuất phát
  const AK = HALF / 36;                                  // hệ số góc so với bố cục 5 vùng cũ (72°/vùng)
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const DEG = Math.PI / 180;
  const cosd = (d) => G.M.cos(d * DEG), sind = (d) => G.M.sin(d * DEG);
  const polar = (r, deg) => ({ x: r3(CX + r * K * cosd(deg)), y: r3(CY + r * K * sind(deg)) });   // r theo bố cục gốc (432), tự nhân K
  const center = { x: CX, y: CY };

  // ---- biome: 5 vùng ngoài lấy ngẫu nhiên 5 trong 6 biome (trừ Phế Tích luôn ở giữa) ----
  const BIOMES = [
    { key: 'forest', name: 'Rừng Thông', icon: '🌲', feat: 'nhiều bụi rậm, thân cây đổ, nhà gỗ' },
    { key: 'swamp', name: 'Đầm Lầy Sương', icon: '🐸', fog: 0.8, feat: 'sương mù (tầm nhìn −20%), vũng bùn làm chậm, cầu gỗ' },
    { key: 'red', name: 'Núi Đá Đỏ', icon: '⛰', feat: 'nhiều cao nguyên, hẻm núi, thùng thuốc nổ' },
    { key: 'fields', name: 'Đồng Cỏ Vàng', icon: '🌾', feat: 'nhà dân, cối xay gió, ụ rơm' },
    { key: 'snow', name: 'Tuyết Sơn', icon: '❄', feat: 'mặt băng trơn (chạy nhanh hơn), cao nguyên' },
    { key: 'ruins', name: 'Phế Tích Tân Thế', icon: '🏛', feat: 'đền đổ, cột đá, tháp canh' },
    { key: 'desert', name: 'Sa Mạc Cát', icon: '🏜', feat: 'cát lún làm chậm, đền cổ, xương rồng' },
    // GĐ8: 2 vùng đặc biệt (không có điểm xuất phát, mỗi vùng một ổ boss)
    { key: 'tukhi', name: 'Vùng Tử Khí', icon: '💀', fog: 0.7, feat: 'tử khí mù mịt (tầm nhìn −30%), mây tử khí rút máu bất chợt, nghĩa địa, Hang Tử Khí' },
    { key: 'khidoc', name: 'Trạm Khí Độc', icon: '☣', feat: 'bồn khí độc nổ ra mây độc, ống xả phun độc định kỳ, Lò Khí Độc' },
  ];
  // địa hình mặt đất: hệ số tốc chạy
  const TERRAIN = { mud: { name: 'Bùn', ms: 0.7 }, sand: { name: 'Cát lún', ms: 0.65 }, ice: { name: 'Mặt băng', ms: 1.2 } };
  const REGIONS = Array.from({ length: NSEC + 1 }, (_, id) => ({ id, bio: id === CENTER ? 5 : 0, name: '', icon: '', fog: 0, special: !!SPECIAL[id] }));
  const INNER_R = Math.round(105 * K);                   // trong bán kính này là Phế Tích
  const SEC = (s) => -90 + STEP * s;                     // góc giữa vùng s
  function regionAt(x, y) {
    const dx = x - CX, dy = y - CY;
    if (dx * dx + dy * dy < INNER_R * INNER_R) return REGIONS[CENTER];
    let a = Math.atan2(dy, dx) / DEG + 90; a = ((a % 360) + 360) % 360;
    return REGIONS[Math.round(a / STEP) % NSEC];
  }

  // ---- dữ liệu bản đồ (mảng giữ nguyên đối tượng, chỉ làm rỗng & đổ lại khi dựng bản đồ mới) ----
  const walls = [], bushes = [], terrain = [], plateaus = [], barrels = [], structs = [], navPts = [], problems = [], vents = [];
  // tường: "viên thuốc" (đoạn a→b bán kính r); tường tròn là a = b. style: kiểu vẽ (wood / stone / cliff / water / log / mill / cactus)
  // tường thấp (nước, thân cây đổ, mép cao nguyên): chặn đi lại nhưng đạn bay qua được
  const LOW = { water: 1, log: 1, cliff: 1, pipe: 1, grave: 1 };
  const mkWall = (ax, ay, bx, by, r, style) => ({ ax: r3(ax), ay: r3(ay), bx: r3(bx), by: r3(by), r, style: style || null, low: !!LOW[style], x: (ax + bx) / 2, y: (ay + by) / 2, round: ax === bx && ay === by,
    x0: Math.min(ax, bx) - r, x1: Math.max(ax, bx) + r, y0: Math.min(ay, by) - r, y1: Math.max(ay, by) + r });
  const rock = (p, r, st) => walls.push(mkWall(p.x, p.y, p.x, p.y, r, st));
  const seg = (p, q, r, st) => walls.push(mkWall(p.x, p.y, q.x, q.y, r, st));
  const radial = (deg, r0, r1, w) => seg(polar(r0, deg), polar(r1, deg), w);
  const tangent = (r, deg, len, w) => { const c = polar(r, deg), tx = -sind(deg), ty = cosd(deg); seg({ x: c.x - tx * len / 2, y: c.y - ty * len / 2 }, { x: c.x + tx * len / 2, y: c.y + ty * len / 2 }, w); };
  const bush = (p, r, kind) => bushes.push({ x: r3(p.x), y: r3(p.y), r, kind: kind || null });

  // ---- phần cố định ----
  // GĐ8: 4 ổ boss — giữa (Ổ Tân Thế: Boss Tân Thế, cuối trận là Rồng) • Hang Tử Khí • Lò Khí Độc • Kho Báu Hoàng Kim (vùng biome phía trên)
  const lp = (r, deg) => polar(r, deg);
  const lairs = [
    Object.assign({ id: 0, r: 16 * K, name: 'Ổ Tân Thế', icon: '🏛', region: CENTER }, { x: CX, y: CY }),
    Object.assign({ id: 1, r: 13 * K, name: 'Hang Tử Khí', icon: '💀', region: 2 }, lp(160, SEC(2))),
    Object.assign({ id: 2, r: 13 * K, name: 'Lò Khí Độc', icon: '☣', region: 5 }, lp(160, SEC(5))),
    Object.assign({ id: 3, r: 12 * K, name: 'Kho Báu Hoàng Kim', icon: '💰', region: 0 }, lp(122, SEC(0))),
  ];
  const bossLair = lairs[0];
  //   bãi quái mỗi vùng biome 9 bãi: 2 bãi "nhà" cạnh mỗi điểm xuất phát (165 & 200) • 1 bãi vàng giữa vùng (140)
  //   • 2 bãi nhỏ vòng giữa (112) • bãi đỏ + bãi xanh ở rìa Phế Tích (82); vùng đặc biệt: 4 bãi nhỏ + bãi vàng + đỏ/xanh
  //   (bán kính theo bố cục gốc, tự nhân K; góc lệch nhân AK)
  const camps = [];
  const camp = (type, r, deg, ring, region) => { const p = polar(r, deg); camps.push({ type, x: p.x, y: p.y, ring, region }); };
  for (let s = 0; s < NSEC; s++) {
    const a = SEC(s);
    if (SPECIAL[s]) {
      camp('small', 200, a - 15 * AK, 2, s); camp('small', 200, a + 15 * AK, 2, s);
      camp('gold', 128, a - 18 * AK, 1, s); camp('small', 112, a + 20 * AK, 1, s);
    } else {
      camp('small', 165, a - 27 * AK, 2, s); camp('small', 165, a + 27 * AK, 2, s);
      camp('small', 200, a - 14 * AK, 2, s); camp('small', 200, a + 14 * AK, 2, s);
      if (s !== 0) { camp('gold', 140, a, 1, s); camp('small', 112, a - 20 * AK, 1, s); camp('small', 112, a + 20 * AK, 1, s); }
      else { camp('gold', 140, a - 22 * AK, 1, s); camp('small', 140, a + 22 * AK, 1, s); }   // vùng có Kho Báu: bãi lệch sang hai bên ổ
    }
    camp('red', 82, a - 14 * AK, 0, CENTER); camp('blue', 82, a + 14 * AK, 0, CENTER);
  }
  camps.forEach((c, i) => { c.id = i; });
  const merchants = [];
  for (let s = 0; s < NSEC; s++) { const p = polar(112, SEC(s) + HALF); merchants.push({ id: s, x: p.x, y: p.y }); }
  const spawns = [];
  for (let s = 0; s < NSEC; s++) if (!SPECIAL[s]) { spawns.push(polar(180, SEC(s) - 15 * AK)); spawns.push(polar(180, SEC(s) + 15 * AK)); }

  // khung cố định: ổ boss, Phế Tích, vách ranh giới, đá che giữa 2 điểm xuất phát, đá góc bản đồ, bụi gốc
  // vòng tường quanh ổ boss: n cung, giữa các cung là lối vào rộng gap độ
  function lairRing(L, n, gap, a0, w) {
    const R = L.r + 2.5;
    for (let j = 0; j < n; j++) {
      const c = a0 + j * 360 / n, h = (360 / n - gap) / 2;
      const steps = Math.max(2, Math.round(h / 12));
      for (let q = 0; q < steps; q++) {
        const t0 = c - h + (2 * h) * q / steps, t1 = c - h + (2 * h) * (q + 1) / steps;
        seg({ x: L.x + cosd(t0) * R, y: L.y + sind(t0) * R }, { x: L.x + cosd(t1) * R, y: L.y + sind(t1) * R }, w || 1.4, L.id === 1 ? 'grave' : L.id === 2 ? 'pipe' : null);
      }
    }
  }
  function skeleton(classic) {
    for (let j = 0; j < 5; j++) { const a = -90 + 72 * j; seg(polar(21, a - 22), polar(21, a + 22), 1.6); }   // ổ giữa: 5 cung, lối vào giữa các cung
    lairRing(lairs[1], 3, 46, SEC(2) + 180, 1.4); lairRing(lairs[2], 3, 46, SEC(5) + 180, 1.4); lairRing(lairs[3], 4, 40, SEC(0) + 45, 1.3);
    for (let s = 0; s < NSEC; s++) {
      const a = SEC(s), b = a + HALF;
      rock(polar(46, a - 18 * AK), 3.4); rock(polar(46, a + 18 * AK), 3.4);   // Phế Tích: cột đá đổ, tường đổ nát
      tangent(72, b, 22, 1.5);
      tangent(92, a, 16, 1.4);
      radial(b, 128, 150, 2.4); radial(b, 166, 214, 2.4);             // vách ranh giới (khe ở 150–166)
      if (!SPECIAL[s]) rock(polar(176, a), 6);                        // tảng đá giữa hai điểm xuất phát
      if (classic) {
        rock(polar(122, a - 26 * AK), 3.6); rock(polar(122, a + 26 * AK), 3.6);
        rock(polar(196, a - 30 * AK), 4.2); rock(polar(196, a + 30 * AK), 4.2);
        if (!SPECIAL[s] && s !== 0) tangent(150, a, 20, 1.5);
      }
    }
    for (let k = 0; k < 4; k++) rock(polar(268, 45 + k * 90), 12 * K);    // góc bản đồ (ngoài bo vòng 1)
    for (let s = 0; s < NSEC; s++) {
      const a = SEC(s), b = a + HALF;
      bush(polar(150, a - 11 * AK), 2.6); bush(polar(150, a + 11 * AK), 2.6);
      bush(polar(188, a - 6 * AK), 2.4); bush(polar(188, a + 6 * AK), 2.4);
      bush(polar(128, a - 38 * AK), 2.6); bush(polar(128, a + 38 * AK), 2.6);
      bush(polar(98, a - 26 * AK), 2.4); bush(polar(98, a + 26 * AK), 2.4);
      bush(polar(60, a), 2.2); bush(polar(34, b), 2.0);
      bush(polar(178, b - 14 * AK), 2.6); bush(polar(178, b + 14 * AK), 2.6);
      bush(polar(212, a - 20 * AK), 2.6); bush(polar(212, a + 20 * AK), 2.6);
    }
  }

  // ---- CÔNG TRÌNH & ĐỊA HÌNH NGẪU NHIÊN ----
  // bán kính chiếm chỗ (để giữ khoảng cách) của từng loại
  const SIZE = { rock: 6, logs: 6, grove: 6, house: 8, ruin: 10, canyon: 15, plateau: 12, tower: 7, pond: 9, bridge: 14, barrels: 4.5, mill: 5, cactus: 6, graves: 7, tanks: 8, pipes: 9 };
  // túi công trình theo biome (trọng số) + công trình "đặc trưng" luôn có ít nhất 1
  const POOL = {
    0: { sig: 'logs', w: { rock: 2, logs: 3, grove: 3, house: 1.5, plateau: 1, bridge: 1 } },
    1: { sig: 'pond', w: { pond: 4, bridge: 2, grove: 2, rock: 1, ruin: 1 } },
    2: { sig: 'plateau', w: { plateau: 3, canyon: 2, barrels: 3, rock: 2, house: 1, tower: 1 } },
    3: { sig: 'house', w: { house: 3, mill: 1.2, grove: 2, rock: 1, barrels: 1, bridge: 1 } },
    4: { sig: 'pond', w: { pond: 3, rock: 2, plateau: 2, ruin: 1, logs: 1 } },
    5: { sig: 'ruin', w: { ruin: 2, rock: 1, barrels: 1, tower: 1.2, house: 0.6 } },
    6: { sig: 'ruin', w: { pond: 3, ruin: 2, canyon: 1, cactus: 2, barrels: 1.2, plateau: 1 } },
    7: { sig: 'graves', w: { graves: 3, ruin: 2, rock: 1.5, grove: 1, pond: 1, tower: 0.6 } },        // Vùng Tử Khí: nghĩa địa, đền đổ, cây chết
    8: { sig: 'tanks', w: { tanks: 3, pipes: 2.5, barrels: 2, house: 1.2, rock: 1 } },                // Trạm Khí Độc: bồn khí, đường ống, thùng độc, nhà xưởng
  };
  const STONE = { 4: 'stone', 5: 'stone', 6: 'stone', 7: 'stone', 8: 'metal' };
  let R = null;   // bộ sinh số của lần dựng hiện tại
  const pickW = (w) => { let t = 0; for (const k in w) t += w[k]; let x = R.next() * t; for (const k in w) { x -= w[k]; if (x <= 0) return k; } return Object.keys(w)[0]; };
  const rot = (p, ox, oy, ang) => ({ x: p.x + ox * Math.cos(ang) - oy * Math.sin(ang), y: p.y + ox * Math.sin(ang) + oy * Math.cos(ang) });
  // nhà / tường có cửa: một cạnh từ A tới B, cửa rộng `door` ở giữa (door = 0: kín)
  function wallWithDoor(A, B, r, st, door) {
    if (!door) return seg(A, B, r, st);
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, h = (L - door) / 2;
    seg(A, { x: A.x + ux * h, y: A.y + uy * h }, r, st);
    seg({ x: B.x - ux * h, y: B.y - uy * h }, B, r, st);
  }
  const BUILD = {
    rock(p, bio) { const n = R.int(1, 3); for (let i = 0; i < n; i++) { const a = R.range(0, 360), d = i ? R.range(2.5, 4) : 0; rock({ x: p.x + cosd(a) * d, y: p.y + sind(a) * d }, R.range(1.8, i ? 2.6 : 4)); } structs.push({ type: 'rock', x: p.x, y: p.y, bio }); },
    logs(p, bio) { const n = R.int(1, 2); for (let i = 0; i < n; i++) { const a = R.range(0, 180), L = R.range(6, 9), c = { x: p.x + R.range(-2.5, 2.5), y: p.y + R.range(-2.5, 2.5) }; seg({ x: c.x - cosd(a) * L / 2, y: c.y - sind(a) * L / 2 }, { x: c.x + cosd(a) * L / 2, y: c.y + sind(a) * L / 2 }, 0.8, 'log'); } structs.push({ type: 'logs', x: p.x, y: p.y, bio }); },
    grove(p, bio) { const n = R.int(2, 3), kind = bio === 3 ? 'hay' : null; for (let i = 0; i < n; i++) { const a = i * 120 + R.range(-30, 30), d = R.range(2.2, 3.6); bush({ x: p.x + cosd(a) * d, y: p.y + sind(a) * d }, R.range(2.1, 2.7), kind); } structs.push({ type: 'grove', x: p.x, y: p.y, bio }); },
    house(p, bio, a) {
      const w = R.range(8, 11), h = R.range(6.5, 8.5), ang = (a + 90) * DEG + R.range(-0.5, 0.5), st = STONE[bio] || 'wood', r = 0.55;
      const c = [rot(p, -w / 2, -h / 2, ang), rot(p, w / 2, -h / 2, ang), rot(p, w / 2, h / 2, ang), rot(p, -w / 2, h / 2, ang)];
      const d1 = R.int(0, 3), d2 = R.chance(0.6) ? (d1 + 2) % 4 : -1, doors = [d1, d2].filter((x) => x >= 0);
      for (let i = 0; i < 4; i++) wallWithDoor(c[i], c[(i + 1) % 4], r, st, doors.includes(i) ? 4.6 : 0);
      navPts.push({ x: p.x, y: p.y });
      for (const i of doors) { const mx = (c[i].x + c[(i + 1) % 4].x) / 2, my = (c[i].y + c[(i + 1) % 4].y) / 2, vx = mx - p.x, vy = my - p.y, L = Math.hypot(vx, vy) || 1; navPts.push({ x: mx + vx / L * 3, y: my + vy / L * 3 }, { x: mx - vx / L * 2.2, y: my - vy / L * 2.2 }); }
      structs.push({ type: 'house', x: p.x, y: p.y, w, h, ang, style: st, doors, bio, inside: true });
    },
    ruin(p, bio) {
      const L = R.range(11, 14), ang = R.range(0, Math.PI / 2), st = 'stone';
      const c = [rot(p, -L / 2, -L / 2, ang), rot(p, L / 2, -L / 2, ang), rot(p, L / 2, L / 2, ang), rot(p, -L / 2, L / 2, ang)];
      for (const q of c) rock(q, 1.3, st);
      for (let i = 0; i < 4; i++) {                                     // mỗi cạnh: 1 đoạn tường đổ dài 30–45% cạnh, sát một góc
        if (R.chance(0.25)) continue;
        const A = c[i], B = c[(i + 1) % 4], k = R.range(0.3, 0.45), fromA = R.chance(0.5);
        const P0 = fromA ? A : B, P1 = { x: P0.x + (fromA ? B.x - A.x : A.x - B.x) * k, y: P0.y + (fromA ? B.y - A.y : A.y - B.y) * k };
        seg(P0, P1, 0.75, st);
      }
      navPts.push({ x: p.x, y: p.y });
      structs.push({ type: 'ruin', x: p.x, y: p.y, L, ang, bio, inside: true });
    },
    canyon(p, bio, a) {
      const L = R.range(20, 26), sep = 7.5, ang = (R.chance(0.5) ? a : a + 90) * DEG + R.range(-0.3, 0.3), ux = Math.cos(ang), uy = Math.sin(ang);
      for (const sd of [-1, 1]) { const ox = -uy * sep / 2 * sd, oy = ux * sep / 2 * sd; seg({ x: p.x + ox - ux * L / 2, y: p.y + oy - uy * L / 2 }, { x: p.x + ox + ux * L / 2, y: p.y + oy + uy * L / 2 }, 1.9, 'canyon'); }
      navPts.push({ x: p.x, y: p.y }, { x: p.x + ux * (L / 2 + 3), y: p.y + uy * (L / 2 + 3) }, { x: p.x - ux * (L / 2 + 3), y: p.y - uy * (L / 2 + 3) });
      structs.push({ type: 'canyon', x: p.x, y: p.y, L, ang, sep, bio });
    },
    plateau(p, bio, a, small) {
      const pr = small ? R.range(4.6, 5.6) : R.range(7, 10), nR = small ? 1 : R.int(1, 2), ramps = [R.range(0, 360)];
      if (nR > 1) ramps.push(ramps[0] + R.range(140, 220));
      const half = 2.7 / pr / DEG + 4;                                  // nửa góc của dốc (cửa rộng ~5.4 đv)
      const n = Math.max(10, Math.round(2 * Math.PI * pr / 3));
      for (let i = 0; i < n; i++) {
        const t0 = i * 360 / n, t1 = (i + 1) * 360 / n, tm = (t0 + t1) / 2;
        if (ramps.some((ra) => { let d = Math.abs(((tm - ra) % 360 + 540) % 360 - 180); return d < half; })) continue;
        seg({ x: p.x + cosd(t0) * pr, y: p.y + sind(t0) * pr }, { x: p.x + cosd(t1) * pr, y: p.y + sind(t1) * pr }, 0.7, 'cliff');
      }
      navPts.push({ x: p.x, y: p.y });
      for (const ra of ramps) navPts.push({ x: p.x + cosd(ra) * (pr + 3), y: p.y + sind(ra) * (pr + 3) }, { x: p.x + cosd(ra) * Math.max(1, pr - 2.5), y: p.y + sind(ra) * Math.max(1, pr - 2.5) });
      plateaus.push({ x: r3(p.x), y: r3(p.y), r: pr, ramps, small: !!small });
      structs.push({ type: small ? 'tower' : 'plateau', x: p.x, y: p.y, r: pr, ramps, bio, inside: true });
    },
    tower(p, bio, a) { return BUILD.plateau(p, bio, a, true); },
    pond(p, bio) {
      const type = bio === 1 || bio === 7 ? 'mud' : bio === 4 ? 'ice' : bio === 6 ? 'sand' : 'mud', r = R.range(5, 8);
      terrain.push({ x: r3(p.x), y: r3(p.y), r, type });
      structs.push({ type: 'pond', x: p.x, y: p.y, r, terr: type, bio });
    },
    bridge(p, bio, a) {
      const ang = (a + R.range(-40, 40)) * DEG, ux = Math.cos(ang), uy = Math.sin(ang), gap = 4.4, L = R.range(9, 12), wr = 2.1;
      for (const sd of [-1, 1]) { const s0 = gap / 2 + wr, s1 = s0 + L; seg({ x: p.x + ux * s0 * sd, y: p.y + uy * s0 * sd }, { x: p.x + ux * s1 * sd, y: p.y + uy * s1 * sd }, wr, 'water'); }
      navPts.push({ x: p.x - uy * 4, y: p.y + ux * 4 }, { x: p.x + uy * 4, y: p.y - ux * 4 }, { x: p.x, y: p.y });
      structs.push({ type: 'bridge', x: p.x, y: p.y, ang, gap, L, wr, bio });
    },
    barrels(p, bio) { const n = R.int(2, 4), toxic = bio === 8; for (let i = 0; i < n; i++) { const a = i * 360 / n + R.range(-20, 20), d = n > 1 ? R.range(1.1, 2.2) : 0; barrels.push({ x: r3(p.x + cosd(a) * d), y: r3(p.y + sind(a) * d), toxic }); } structs.push({ type: 'barrels', x: p.x, y: p.y, bio, toxic }); },
    // GĐ8 — Vùng Tử Khí: nghĩa địa (bia mộ nhỏ chắn đường, cây chết, bụi gai)
    graves(p, bio) {
      const n = R.int(5, 8);
      for (let i = 0; i < n; i++) { const a = i * 360 / n + R.range(-15, 15), d = R.range(3.4, 6); rock({ x: p.x + cosd(a) * d, y: p.y + sind(a) * d }, R.range(0.45, 0.7), 'grave'); }
      bush({ x: p.x, y: p.y }, R.range(1.9, 2.3), 'dead');
      structs.push({ type: 'graves', x: p.x, y: p.y, bio });
    },
    // GĐ8 — Trạm Khí Độc: bồn khí (trụ tròn lớn) + thùng độc + ống xả độc (điểm phun độc định kỳ)
    tanks(p, bio) {
      const n = R.int(2, 3), a0 = R.range(0, 360);
      for (let i = 0; i < n; i++) { const a = a0 + i * 360 / n, d = n > 1 ? 4 : 0; rock({ x: p.x + cosd(a) * d, y: p.y + sind(a) * d }, R.range(2.2, 2.9), 'tank'); }
      for (let i = 0; i < 2; i++) { const a = a0 + 180 / n + i * 180, d = 6.2; barrels.push({ x: r3(p.x + cosd(a) * d), y: r3(p.y + sind(a) * d), toxic: true }); }
      vents.push({ x: r3(p.x), y: r3(p.y), r: 4 });
      structs.push({ type: 'tanks', x: p.x, y: p.y, bio, n, a0 });
    },
    pipes(p, bio, a) {
      const ang = (a + 90 + R.range(-30, 30)) * DEG, L = R.range(12, 18), ux = Math.cos(ang), uy = Math.sin(ang);
      seg({ x: p.x - ux * L / 2, y: p.y - uy * L / 2 }, { x: p.x + ux * L / 2, y: p.y + uy * L / 2 }, 0.75, 'pipe');
      vents.push({ x: r3(p.x + ux * L / 2 + uy * 2.5), y: r3(p.y + uy * L / 2 - ux * 2.5), r: 3.5 });
      navPts.push({ x: p.x + uy * 3, y: p.y - ux * 3 }, { x: p.x - uy * 3, y: p.y + ux * 3 });
      structs.push({ type: 'pipes', x: p.x, y: p.y, ang, L, bio });
    },
    mill(p, bio) { rock(p, 2.3, 'mill'); structs.push({ type: 'mill', x: p.x, y: p.y, bio, a0: R.range(0, 6.28) }); },
    cactus(p, bio) { const n = R.int(3, 5); for (let i = 0; i < n; i++) { const a = R.range(0, 360), d = R.range(0.5, 4.5); rock({ x: p.x + cosd(a) * d, y: p.y + sind(a) * d }, R.range(0.55, 0.8), 'cactus'); } structs.push({ type: 'cactus', x: p.x, y: p.y, bio }); },
  };
  // chỗ trống cho công trình bán kính sz tại p?
  const placed = [];
  function clearOf(p, sz) {
    if (p.x < sz + 6 || p.y < sz + 6 || p.x > N - sz - 6 || p.y > N - sz - 6) return false;
    for (const s of spawns) if (Math.hypot(s.x - p.x, s.y - p.y) < sz + 11) return false;
    for (const c of camps) if (Math.hypot(c.x - p.x, c.y - p.y) < sz + 6.5) return false;
    for (const t of merchants) if (Math.hypot(t.x - p.x, t.y - p.y) < sz + 10) return false;
    for (const b of bushes) if (Math.hypot(b.x - p.x, b.y - p.y) < sz * 0.7 + b.r + 1) return false;
    for (const o of placed) if (Math.hypot(o.x - p.x, o.y - p.y) < sz + o.sz + 3) return false;
    for (const w of walls) if (segDist(p.x, p.y, w.ax, w.ay, w.bx, w.by) - w.r < sz + 1.5) return false;
    for (const L of lairs) if (Math.hypot(p.x - L.x, p.y - L.y) < L.r + 14 + sz) return false;
    return true;
  }
  function place(type, p, bio, a) { const sz = SIZE[type]; if (!clearOf(p, sz)) return false; const n0 = navPts.length; BUILD[type](p, bio, a); for (let i = n0; i < navPts.length; i++) navPts[i].t = type; placed.push({ x: p.x, y: p.y, sz }); return true; }
  // vùng ngoài s: 8–11 công trình trong vành 112–222 (bố cục gốc), cách vách ranh giới đủ xa
  function genSector(s) {
    const a = SEC(s), bio = REGIONS[s].bio, P = POOL[bio], want = R.int(8, 11);
    let got = 0;
    for (let tries = 0; got < want && tries < 220; tries++) {
      const type = got === 0 ? P.sig : pickW(P.w), sz = SIZE[type];
      const rr = R.range(114 + sz / K, 222 - sz / K), da = R.range(-(HALF - 4), HALF - 4);
      if (rr * K * Math.sin((HALF - Math.abs(da)) * DEG) < sz + 4) continue;   // xa vách ranh giới
      if (place(type, polar(rr, a + da), bio, a + da)) got++;
    }
  }
  // Phế Tích: thêm 5–6 công trình ở vành 52–96 (bố cục gốc)
  function genCenter() {
    const want = R.int(5, 6), P = POOL[5];
    let got = 0;
    for (let tries = 0; got < want && tries < 120; tries++) {
      const type = pickW(P.w), sz = SIZE[type], rr = R.range(52 + sz * 0.5 / K, 98 - sz / K), da = R.range(0, 360);
      if (place(type, polar(rr, da), 5, da)) got++;
    }
  }

  // ---- lưới tra tường (ô 32 đv) để tra va chạm nhanh trên bản đồ lớn ----
  const CELL = 32, GW = Math.ceil(N / CELL);
  let wgrid = [], seen = new Int32Array(1), stamp = 0;
  function indexWalls() {
    wgrid = Array.from({ length: GW * GW }, () => []);
    walls.forEach((w, i) => {
      w.i = i;
      for (let cy = Math.max(0, Math.floor(w.y0 / CELL)); cy <= Math.min(GW - 1, Math.floor(w.y1 / CELL)); cy++)
        for (let cx = Math.max(0, Math.floor(w.x0 / CELL)); cx <= Math.min(GW - 1, Math.floor(w.x1 / CELL)); cx++) wgrid[cy * GW + cx].push(w);
    });
    seen = new Int32Array(walls.length + 1); stamp = 0;
  }
  // các tường có khung bao chạm hình chữ nhật [x0,x1]×[y0,y1]
  function wallsIn(x0, y0, x1, y1, fn) {
    stamp++;
    const cx0 = Math.max(0, Math.floor(x0 / CELL)), cx1 = Math.min(GW - 1, Math.floor(x1 / CELL)), cy0 = Math.max(0, Math.floor(y0 / CELL)), cy1 = Math.min(GW - 1, Math.floor(y1 / CELL));
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) for (const w of wgrid[cy * GW + cx]) {
      if (seen[w.i] === stamp) continue; seen[w.i] = stamp;
      const r = fn(w); if (r) return r;
    }
    return null;
  }

  // khoảng cách giữa 2 đoạn thẳng
  function segSeg(ax, ay, bx, by, cx, cy, dx, dy) {
    const cross = (ox, oy, px, py, qx, qy) => (px - ox) * (qy - oy) - (py - oy) * (qx - ox);
    const d1 = cross(cx, cy, dx, dy, ax, ay), d2 = cross(cx, cy, dx, dy, bx, by);
    const d3 = cross(ax, ay, bx, by, cx, cy), d4 = cross(ax, ay, bx, by, dx, dy);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
    return Math.min(segDist(ax, ay, cx, cy, dx, dy), segDist(bx, by, cx, cy, dx, dy), segDist(cx, cy, ax, ay, bx, by), segDist(dx, dy, ax, ay, bx, by));
  }
  // khoảng cách từ điểm tới mép tường (âm = bên trong tường)
  const wallDist = (w, x, y) => segDist(x, y, w.ax, w.ay, w.bx, w.by) - w.r;

  // va chạm tường: đẩy điểm (bán kính r) ra khỏi mọi tường; trả về tường đã chạm (nếu có)
  function pushOut(p, r) {
    let hit = null;
    const fix = (w) => {
      if (p.x + r < w.x0 || p.x - r > w.x1 || p.y + r < w.y0 || p.y - r > w.y1) return null;
      const dx = w.bx - w.ax, dy = w.by - w.ay, L2 = dx * dx + dy * dy;
      let t = L2 > 1e-9 ? ((p.x - w.ax) * dx + (p.y - w.ay) * dy) / L2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = w.ax + dx * t, qy = w.ay + dy * t;
      const ex = p.x - qx, ey = p.y - qy, d2 = ex * ex + ey * ey, R2 = w.r + r;
      if (d2 < R2 * R2) {
        const d = Math.sqrt(d2);
        if (d > 1e-6) { p.x = qx + ex / d * R2; p.y = qy + ey / d * R2; }
        else { const nx = L2 > 1e-9 ? -dy / Math.sqrt(L2) : 1, ny = L2 > 1e-9 ? dx / Math.sqrt(L2) : 0; p.x = qx + nx * R2; p.y = qy + ny * R2; }
        hit = w;
      }
      return null;
    };
    for (let pass = 0; pass < 2; pass++) wallsIn(p.x - r, p.y - r, p.x + r, p.y + r, fix);
    const lo = 1, hi = N - 1;
    if (p.x < lo) p.x = lo; else if (p.x > hi) p.x = hi;
    if (p.y < lo) p.y = lo; else if (p.y > hi) p.y = hi;
    return hit;
  }
  // tường gần nhất trong khoảng gap tính từ mép tường
  function nearWall(p, gap) {
    let best = null, bd = Infinity;
    wallsIn(p.x - gap - 16, p.y - gap - 16, p.x + gap + 16, p.y + gap + 16, (w) => { const d = wallDist(w, p.x, p.y); if (d < gap && d < bd) { bd = d; best = w; } });
    return best;
  }
  // đoạn thẳng a→b có bị tường chắn không (pad: nới bán kính tường; proj: đạn bay — bỏ qua tường thấp)
  function blocked(ax, ay, bx, by, pad, proj) {
    const sx0 = (ax < bx ? ax : bx) - pad, sx1 = (ax > bx ? ax : bx) + pad, sy0 = (ay < by ? ay : by) - pad, sy1 = (ay > by ? ay : by) + pad;
    return wallsIn(sx0, sy0, sx1, sy1, (w) => {
      if (w.x1 < sx0 || w.x0 > sx1 || w.y1 < sy0 || w.y0 > sy1) return null;
      if (proj && w.low) return null;
      return segSeg(ax, ay, bx, by, w.ax, w.ay, w.bx, w.by) < w.r + pad ? w : null;
    });
  }
  // điểm có nằm trong (hoặc sát) tường không
  function inWall(x, y, pad) { return wallsIn(x - pad - 1, y - pad - 1, x + pad + 1, y + pad + 1, (w) => (wallDist(w, x, y) < pad ? w : null)); }
  function bushAt(x, y) {
    for (const b of bushes) { const dx = x - b.x, dy = y - b.y; if (dx * dx + dy * dy <= b.r * b.r) return b.id; }
    return -1;
  }
  // độ cao: 1 = trên cao nguyên / tháp canh, 0 = mặt đất
  function heightAt(x, y) {
    for (const p of plateaus) { const dx = x - p.x, dy = y - p.y, r = p.r - 0.35; if (dx > -r && dx < r && dy > -r && dy < r && dx * dx + dy * dy < r * r) return 1; }
    return 0;
  }
  function plateauAt(x, y) { for (const p of plateaus) { const dx = x - p.x, dy = y - p.y; if (dx * dx + dy * dy < (p.r - 0.35) * (p.r - 0.35)) return p; } return null; }
  // địa hình mặt đất (bùn / cát lún / băng) tại điểm, hoặc null
  function terrainAt(x, y) {
    for (const t of terrain) { const dx = x - t.x, dy = y - t.y; if (dx > -t.r && dx < t.r && dy > -t.r && dy < t.r && dx * dx + dy * dy < t.r * t.r) return t.type; }
    return null;
  }

  // ---- kiểm tra hợp lệ ----
  function validate(classic) {
    for (const c of camps) for (const w of walls) if (wallDist(w, c.x, c.y) < 2.2 * S) problems.push(`bãi quái ${c.type} (${c.x},${c.y}) quá sát tường`);
    for (const t of merchants) for (const w of walls) if (wallDist(w, t.x, t.y) < 3) problems.push(`Thương Nhân (${t.x},${t.y}) quá sát tường`);
    for (const s of spawns) for (const w of walls) if (wallDist(w, s.x, s.y) < 2) problems.push(`điểm xuất phát (${s.x},${s.y}) quá sát tường`);
    for (const b of bushes) for (const w of walls) if (wallDist(w, b.x, b.y) < b.r * 0.5) problems.push(`bụi (${b.x},${b.y}) đè lên tường`);
    for (const p of [...camps, ...merchants, ...spawns, ...bushes]) if (p.x < 3 || p.y < 3 || p.x > N - 3 || p.y > N - 3) problems.push(`(${p.x},${p.y}) sát mép bản đồ`);
    if (classic) return;
    // loang trên lưới 2 đv: mọi chỗ quan trọng phải tới được; không có vùng kín lớn
    const K = 2, W = Math.ceil(N / K), open = new Uint8Array(W * W), mark = new Uint8Array(W * W);
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) { const x = i * K + 1, y = j * K + 1; open[j * W + i] = x > 2 && y > 2 && x < N - 2 && y < N - 2 && !inWall(x, y, 0.6) ? 1 : 0; }
    const cellOf = (p) => { const i = Math.max(0, Math.min(W - 1, Math.floor(p.x / K))), j = Math.max(0, Math.min(W - 1, Math.floor(p.y / K))); return j * W + i; };
    const st = cellOf(spawns[0]); if (!open[st]) { problems.push('điểm xuất phát 0 bị kẹt'); return; }
    const q = new Int32Array(W * W); let qh = 0, qt = 0; q[qt++] = st; mark[st] = 1;
    while (qh < qt) { const c = q[qh++], i = c % W, j = (c / W) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= W) continue; const n = nj * W + ni; if (open[n] && !mark[n]) { mark[n] = 1; q[qt++] = n; } } }
    const near = (p) => { const c = cellOf(p), i = c % W, j = (c / W) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ni = i + di, nj = j + dj; if (ni >= 0 && nj >= 0 && ni < W && nj < W && mark[nj * W + ni]) return true; } return false; };
    for (const p of [...spawns, ...camps, ...merchants, ...navPts, ...lairs]) if (!near(p)) problems.push(`${p.t || p.name || 'điểm'} (${Math.round(p.x)},${Math.round(p.y)}) không đi tới được`);
    for (const p of plateaus) if (!near(p)) problems.push(`cao nguyên (${Math.round(p.x)},${Math.round(p.y)}) không có lối lên`);
    let pocket = 0; for (let c = 0; c < W * W; c++) if (open[c] && !mark[c]) pocket++;
    if (pocket > 40) problems.push(`có ${pocket} ô bị kín`);
  }

  // ---- dựng bản đồ theo hạt giống ----
  let curSeed = 'classic';
  function build(seed) {
    walls.length = 0; bushes.length = 0; terrain.length = 0; plateaus.length = 0; barrels.length = 0; structs.length = 0; navPts.length = 0; problems.length = 0; placed.length = 0; vents.length = 0;
    const classic = seed == null || seed === 'classic';
    R = classic ? null : new G.Rng('map:' + seed);
    const bios = classic ? [0, 1, 2, 3, 4] : R.shuffle([0, 1, 2, 3, 4, 6]).slice(0, 5);
    let bi = 0;
    for (let s = 0; s <= NSEC; s++) { const b = s === CENTER ? 5 : SPECIAL[s] || bios[bi++], B = BIOMES[b]; Object.assign(REGIONS[s], { bio: b, name: B.name, icon: B.icon, fog: B.fog || 0, feat: B.feat }); }
    skeleton(classic);
    if (!classic) { for (let s = 0; s < NSEC; s++) genSector(s); genCenter(); }
    else for (const s of [2, 5]) { const R0 = R; R = new G.Rng('classic:' + s); genSector(s); R = R0; }   // vùng đặc biệt luôn có công trình riêng
    bushes.forEach((b, i) => { b.id = i; });
    indexWalls();
    validate(classic);
    curSeed = classic ? 'classic' : String(seed);
    MAP.seed = curSeed; MAP.classic = classic;
  }
  // dựng + dựng lại lưới tìm đường; hỏng thì thử hạt giống phụ, cuối cùng dùng bản đồ cổ điển
  function buildMap(seed) {
    seed = seed == null ? 'classic' : String(seed);
    if (seed === MAP.seed && MAP.ready) return MAP;
    let ok = false;
    for (let k = 0; k < 6 && !ok; k++) {
      build(k ? seed + '#' + k : seed);
      if (!problems.length && G.NAV && G.NAV.rebuild) G.NAV.rebuild();
      ok = !problems.length;
      if (seed === 'classic') break;
    }
    if (!ok) { const why = problems.slice(0, 3); build('classic'); if (G.NAV && G.NAV.rebuild) G.NAV.rebuild(); MAP.fallback = why; } else MAP.fallback = null;
    MAP.seed = seed; MAP.ready = true; MAP.version = (MAP.version || 0) + 1;
    return MAP;
  }

  const MAP = { center, polar, walls, bushes, bushAt, camps, merchants, bossLair, lairs, vents, spawns, pushOut, nearWall, blocked, inWall, wallDist, segSeg, problems, S, REGIONS, regionAt, INNER_R, SEC, NSEC, CENTER, SPECIAL, HALF, K,
    terrain, plateaus, barrels, structs, navPts, heightAt, plateauAt, terrainAt, BIOMES, TERRAIN, seed: 'classic', classic: true, ready: false, version: 0 };
  G.MAP = MAP; G.buildMap = buildMap;
  build('classic');
})();
