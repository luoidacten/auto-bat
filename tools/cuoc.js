#!/usr/bin/env node
'use strict';
// ===== GĐ9b: NGƯỜI CHƠI MÁY — đo nhà cái (không giao diện) =====
//   node tools/cuoc.js --tran 8 --hat cuoc --kieu ngau|tren|duoi [--giaokeo 0.3] [--txt F]
// Mỗi trận: một run mới (đủ tiền), người chơi máy trả lời mọi câu hỏi với tiền cược cố định 100:
//   ngau = chọn ngẫu nhiên • tren = luôn chọn cửa trên (tỷ lệ thấp nhất) • duoi = luôn chọn cửa dưới.
// In: số câu hỏi / trận theo loại, tỉ lệ thắng / hủy, tiền về / tiền cược (lợi thế nhà cái), giao kèo thành công, người của nhà cái.
const fs = require('fs');
const G = require('./nap.js');
const a = process.argv.slice(2), o = {};
for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) { const k = a[i].slice(2), v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; o[k] = v; }
const N = +(o.tran || 6), HAT = o.hat || 'cuoc', KIEU = o.kieu || 'ngau', GK = +(o.giaokeo || 0.3);
const R = new G.Rng('cuoc-policy:' + HAT);
const choose = (opts) => {
  if (KIEU === 'tren' || KIEU === 'doc') return opts.slice().sort((x, y) => x.odds - y.odds)[0];
  if (KIEU === 'duoi') return opts.slice().sort((x, y) => y.odds - x.odds)[0];
  return opts[R.int(0, opts.length - 1)];
};
const T = {}, add = (k, f, v) => { const s = T[k] || (T[k] = { n: 0, won: 0, lost: 0, void: 0, stake: 0, back: 0 }); s[f] += v == null ? 1 : v; };
let gk = 0, gkOk = 0, houseN = 0, houseTop = 0, houseTie = 0, qPer = [], errs = 0, t0 = Date.now();
for (let k = 0; k < N; k++) {
  const run = new G.Run(HAT + '-' + k); run.money = 1e6; run.stage = k % 3;
  const cfg = run.nextConfig(), m = new G.Match(cfg), bk = new G.Bookie(m, run);
  bk.startQuestion();
  const rows = bk.pre.rows, mode = ['survive', 'top1', 'top3'][R.int(0, 2)];
  let ids = null;
  const H = cfg.house || [];
  if (KIEU === 'doc') {   // "người đọc vị": biết người của nhà cái (đọc dấu hiệu / Tình Báo), tránh tướng bị thổi phồng
    const pool = rows.filter((r) => r.id !== bk.pre.bait).sort((x, y) => (H.includes(y.id) - H.includes(x.id)) || y.p1 - x.p1);
    ids = mode === 'top3' ? pool.slice(0, 3).map((r) => r.id) : [pool[0].id];
  } else if (mode === 'top3') ids = (KIEU === 'tren' ? rows.slice().sort((x, y) => y.p1 - x.p1) : KIEU === 'duoi' ? rows.slice().sort((x, y) => x.p1 - y.p1) : R.shuffle(rows.slice())).slice(0, 3).map((r) => r.id);
  else if (!ids) ids = [choose(rows.map((r) => ({ id: r.id, odds: mode === 'top1' ? r.o1 : r.oS }))).id];
  const sign = R.next() < GK;
  bk.answerStart({ mode, ids, stake: 100, contract: sign ? 100 : 0 });
  if (sign) gk++;
  let nq = 1;
  while (!m.over) {
    m.step();
    const q = bk.tick();
    if (q) { nq++; bk.answer(choose(q.opts).key, 100); }
  }
  bk.finish();
  qPer.push(nq);
  if (bk.contract && bk.contract.ok) gkOk++;
  for (const b of bk.bets) { const key = b.start ? b.mode : b.q.type; add(key, 'n'); add(key, b.status === 'won' ? 'won' : b.status === 'void' ? 'void' : 'lost'); add(key, 'stake', b.stake); add(key, 'back', b.status === 'won' ? b.payout : b.status === 'void' ? b.stake : 0); }
  for (const q of bk.qs) if (q.mid) add('hỏi:' + q.type, 'n');
  const HM = m.heroes.filter((h) => (cfg.house || []).includes(h.heroId));
  houseN += HM.length; houseTop += HM.filter((h) => h.place === 1).length;
  if (m.heroes.filter((h) => h.place === 1).length > 1) houseTie++;
  errs += m.errors.length;
}
const L = [];
L.push(`══════ NGƯỜI CHƠI MÁY "${KIEU}" — ${N} trận (${((Date.now() - t0) / 1000).toFixed(0)}s), lỗi ${errs} ══════`);
L.push(`Câu hỏi / trận (kể cả câu đầu): TB ${(qPer.reduce((x, y) => x + y, 0) / N).toFixed(1)} • ít nhất ${Math.min(...qPer)} • nhiều nhất ${Math.max(...qPer)}`);
L.push('Loại        Cược  Thắng  Thua  Hủy   Tiền về / tiền cược');
let S = 0, Bk = 0;
for (const [k, s] of Object.entries(T)) {
  if (k.startsWith('hỏi:')) continue;
  S += s.stake; Bk += s.back;
  L.push(`${k.padEnd(10)} ${String(s.n).padStart(5)} ${String(s.won).padStart(6)} ${String(s.lost).padStart(5)} ${String(s.void).padStart(4)}   ${(s.back / Math.max(1, s.stake) * 100).toFixed(0)}%`);
}
L.push(`TỔNG: tiền về ${(Bk / Math.max(1, S) * 100).toFixed(0)}% tiền cược (nhà cái giữ ${(100 - Bk / Math.max(1, S) * 100).toFixed(0)}%)`);
L.push(`Số câu đã hỏi theo loại: ${Object.entries(T).filter(([k]) => k.startsWith('hỏi:')).map(([k, s]) => k.slice(4) + ' ' + s.n).join(' • ')}`);
L.push(`Giao kèo: ký ${gk}, trọn vẹn ${gkOk}`);
L.push(`Người của nhà cái: ${houseN} lượt có mặt, vô địch ${houseTop} (${(houseTop / Math.max(1, houseN) * 100).toFixed(0)}% mỗi lượt; kỳ vọng ~10%) • trận đồng hạng 1: ${houseTie}`);
const txt = L.join('\n');
console.log(txt);
if (o.txt) fs.writeFileSync(o.txt, txt + '\n', { flag: o.them ? 'a' : 'w' });
