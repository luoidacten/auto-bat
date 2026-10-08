'use strict';
// ===== GĐ9b: thống kê gốc cho tỷ lệ cược (sinh bởi tools/tyle.js từ 64 trận mô phỏng — đừng sửa tay) =====
// n: số trận có mặt • w: số lần hạng 1 • t3: số lần vào top 3 • p: hạng trung bình
(function () {
  const G = globalThis.G || (globalThis.G = {});
  G.HERO_ODDS = {
    alice: { n: 25, w: 0, t3: 8, p: 5.32 },
    aria: { n: 21, w: 5, t3: 18, p: 2.14 },
    borg: { n: 24, w: 0, t3: 0, p: 7.96 },
    chrononeo: { n: 23, w: 1, t3: 6, p: 6.26 },
    clint: { n: 19, w: 1, t3: 4, p: 5.84 },
    death: { n: 25, w: 0, t3: 1, p: 6.92 },
    elara: { n: 24, w: 3, t3: 8, p: 4.75 },
    florian: { n: 22, w: 10, t3: 13, p: 3.23 },
    galo: { n: 17, w: 0, t3: 3, p: 5.71 },
    gideon: { n: 18, w: 0, t3: 3, p: 7.17 },
    ignatius: { n: 33, w: 3, t3: 4, p: 6.97 },
    jack: { n: 18, w: 3, t3: 4, p: 5.44 },
    joker: { n: 27, w: 2, t3: 8, p: 5.56 },
    kazuki: { n: 24, w: 1, t3: 4, p: 6.46 },
    koda: { n: 23, w: 4, t3: 9, p: 4.39 },
    lyra: { n: 29, w: 2, t3: 23, p: 3.03 },
    percy: { n: 19, w: 0, t3: 2, p: 6.74 },
    raven: { n: 28, w: 0, t3: 7, p: 5.39 },
    roxie: { n: 25, w: 5, t3: 18, p: 3.16 },
    ryoma: { n: 25, w: 14, t3: 16, p: 3.60 },
    thanhphong: { n: 26, w: 0, t3: 1, p: 7.50 },
    theron: { n: 26, w: 0, t3: 3, p: 6.85 },
    valerius: { n: 23, w: 0, t3: 2, p: 6.91 },
    vesper: { n: 26, w: 2, t3: 8, p: 4.69 },
    victoria: { n: 22, w: 3, t3: 8, p: 4.73 },
    wukong: { n: 26, w: 3, t3: 4, p: 6.50 },
    zero: { n: 22, w: 2, t3: 7, p: 5.23 },
  };
})();
