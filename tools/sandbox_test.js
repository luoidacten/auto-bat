'use strict';
// GĐ11: chạy bộ kịch bản kiểm thử mẫu của Phòng Thử Nghiệm Sandbox không cần giao diện
//   node tools/sandbox_test.js            — chạy cả 5 kịch bản
//   node tools/sandbox_test.js sweet snap — chỉ chạy các kịch bản chỉ định
//   node tools/sandbox_test.js --dps ryoma 12  — đo DPS 10s của tướng lên Bao Cát Tĩnh (AI tự đánh)
const G = require('./nap.js');
const args = process.argv.slice(2);
if (args[0] === '--dps') {
  const id = args[1] || 'ryoma', lv = +args[2] || 12;
  const m = new G.Match(G.Sandbox.cfg(id, 'sbx-dps', { dummies: ['static'], level: lv }));
  for (let i = 0; i < 10 / G.C.TICK; i++) m.step();
  const s = m.sbStatsRaw();
  console.log(`${id} cấp ${lv}: tổng ${Math.round(s.total)} trong ${s.dur.toFixed(1)}s • DPS TB ${Math.round(s.dpsAvg)} • đòn cao nhất ${Math.round(s.peak)} • ${s.n} đòn, ${s.crit} chí mạng`);
  console.log('  ' + s.parts.filter((p) => p.v > 0).map((p) => `${p.k} ${Math.round(p.v)} (${Math.round(p.pct * 100)}%)`).join(' • '));
  console.log('  khống chế: ' + (s.cc.map((c) => `${c.k} ${c.v.toFixed(2)}s`).join(' • ') || '—'));
  console.log('  nhật ký: ' + m.sbx.log.slice(-5).map((l) => `[${G.U.mmss(l.t)}] ${l.txt}`).join('\n           '));
  if (m.errors.length) console.log('LỖI', m.errors.slice(0, 3));
  process.exit(0);
}
const ids = args.length ? args : G.Sandbox.SUITE.map((s) => s.id);
let fail = 0;
for (const id of ids) {
  const r = G.Sandbox.runSuite(id);
  if (!r) { console.log('Không có kịch bản', id); continue; }
  console.log(`${r.pass ? '✔' : '✘'} ${r.name}`);
  for (const [ok, txt] of r.out) console.log(`   ${ok ? '✔' : '✘'} ${txt}`);
  if (r.m.errors.length) console.log('   LỖI:', r.m.errors.slice(0, 3).join(' | '));
  if (!r.pass) fail++;
}
console.log(fail ? `${fail} kịch bản chưa đạt` : 'Tất cả kịch bản đạt');
