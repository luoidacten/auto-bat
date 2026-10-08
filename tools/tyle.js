#!/usr/bin/env node
'use strict';
// ===== GĐ9b: sinh src/data/odds.js (thống kê gốc cho tỷ lệ cược của nhà cái) từ kết quả mô phỏng =====
//   node tools/mophong.js --tran 64 --hat tyle --json /tmp/tyle.json
//   node tools/tyle.js /tmp/tyle.json [thêm.json …]
// Mỗi tướng: n = số trận có mặt, w = số lần hạng 1, t3 = số lần vào top 3, p = hạng trung bình.
const fs = require('fs');
const path = require('path');
const files = process.argv.slice(2);
if (!files.length) { console.error('Cần tệp JSON kết quả mô phỏng'); process.exit(1); }
const S = {};
let nMatch = 0;
for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
  // bản tổng hợp của tools/mophong.js --json: heroes = { id: { n, pl (tổng hạng), w, t3 } }
  if (raw.heroes && !Array.isArray(raw.heroes)) {
    nMatch += (raw.results || []).length;
    for (const [id, h] of Object.entries(raw.heroes)) { const s = S[id] || (S[id] = { n: 0, w: 0, t3: 0, sp: 0 }); s.n += h.n; s.w += h.w; s.t3 += h.t3; s.sp += h.pl; }
    continue;
  }
  const list = Array.isArray(raw) ? raw : raw.results || raw.matches || [];
  for (const r of list) {
    if (!r || !r.heroes) continue;
    nMatch++;
    for (const h of r.heroes) {
      const s = S[h.hero] || (S[h.hero] = { n: 0, w: 0, t3: 0, sp: 0 });
      s.n++; if (h.place === 1) s.w++; if (h.place <= 3) s.t3++; s.sp += h.place || 10;
    }
  }
}
const ids = Object.keys(S).sort();
const body = ids.map((id) => { const s = S[id]; return `    ${id}: { n: ${s.n}, w: ${s.w}, t3: ${s.t3}, p: ${(s.sp / s.n).toFixed(2)} },`; }).join('\n');
const out = `'use strict';
// ===== GĐ9b: thống kê gốc cho tỷ lệ cược (sinh bởi tools/tyle.js từ ${nMatch} trận mô phỏng — đừng sửa tay) =====
// n: số trận có mặt • w: số lần hạng 1 • t3: số lần vào top 3 • p: hạng trung bình
(function () {
  const G = globalThis.G || (globalThis.G = {});
  G.HERO_ODDS = {
${body}
  };
})();
`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'odds.js'), out);
console.log(`Đã ghi src/data/odds.js — ${nMatch} trận, ${ids.length} tướng`);
