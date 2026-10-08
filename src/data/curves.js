'use strict';
// ===== GIAI ĐOẠN MẠNH CỦA TƯỚNG (GĐ5c) =====
// Mỗi tướng: mạnh đầu trận (early) / giữa trận (mid) / cuối trận (late) + độ phụ thuộc trang bị (high / med / low).
// Hệ số sát thương theo cấp (nội suy giữa cấp 3 → 9 → 15) và theo vàng trang bị đang có; AI biết điều này:
//   tuyển thủ dám đánh hơn khi tướng mình đang ở giai đoạn mạnh hơn tướng địch; đội trưởng ép giao tranh/trụ khi đội đang "tới thì",
//   đội mạnh về cuối thì giữ an toàn chờ thời.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const CURVES = {
    valerius: ['mid', 'low'], gideon: ['mid', 'low'], koda: ['early', 'med'], clint: ['early', 'med'], ignatius: ['mid', 'med'],
    ryoma: ['mid', 'high'], elara: ['late', 'high'], zero: ['late', 'high'], aria: ['mid', 'low'], death: ['early', 'low'],
    borg: ['early', 'low'], florian: ['mid', 'med'], kazuki: ['late', 'high'], theron: ['early', 'med'], wukong: ['mid', 'med'],
    vesper: ['early', 'high'], galo: ['mid', 'med'], alice: ['mid', 'med'], thanhphong: ['mid', 'low'], roxie: ['late', 'high'],
    joker: ['mid', 'low'], percy: ['late', 'high'], chrononeo: ['late', 'high'], jack: ['mid', 'high'], victoria: ['early', 'low'],
    raven: ['early', 'med'], lyra: ['mid', 'low'],
  };
  // sát thương thêm ở cấp 3 / 9 / 15
  const LV = { early: [0.06, 0.02, -0.04], mid: [-0.02, 0.05, 0], late: [-0.05, 0, 0.06] };
  const NAME = { early: 'Mạnh đầu trận', mid: 'Mạnh giữa trận', late: 'Mạnh cuối trận' };
  const DEP = { high: 'Cần đồ', med: 'Cần đồ vừa phải', low: 'Ít cần đồ' };
  function curveOf(id) { return CURVES[id] || ['mid', 'med']; }
  // hệ số cộng thêm (−0.09..+0.12) cho tướng u
  function heroCurve(u) {
    if (!u || !u.heroId) return 0;
    const [c, dep] = curveOf(u.heroId), v = LV[c], L = u.level || 1;
    const lv = L <= 3 ? v[0] : L <= 9 ? v[0] + (v[1] - v[0]) * (L - 3) / 6 : L <= 15 ? v[1] + (v[2] - v[1]) * (L - 9) / 6 : v[2];
    const k = Math.min(1, (u.itemGold || 0) / 12000);
    const it = dep === 'high' ? (k - 0.4) * 0.1 : dep === 'low' ? (0.4 - k) * 0.06 : 0;
    return lv + it;
  }
  function teamCurve(list) { const a = list.filter((h) => h.alive !== false); return a.length ? a.reduce((s, h) => s + heroCurve(h), 0) / a.length : 0; }
  G.CURVES = CURVES; G.CURVE_LV = LV; G.CURVE_NAME = NAME; G.CURVE_DEP = DEP; G.curveOf = curveOf; G.heroCurve = heroCurve; G.teamCurve = teamCurve;
})();
