#!/usr/bin/env node
'use strict';
// ===== GĐ9b: chơi trọn VÁN (run) bằng người chơi máy — đo tỉ lệ qua chặng / thắng ván =====
//   node tools/van.js --van 8 --hat van --kieu doc|ngau --luong 4 [--txt F]
// Người chơi máy: câu đầu cược 15% tiền (Sống tới cuối), câu giữa trận 5% tiền; giao kèo: "doc" ký mọi trận 10% tiền, "ngau" 25% số trận 5%;
// cửa hàng: mua charm rẻ nhất có ích nếu còn dư > 2× chỉ tiêu…; nhận quà; thiếu chỉ tiêu thì vay.
//   doc  = "người đọc vị": biết người của nhà cái, tránh tướng bị thổi phồng, giữa trận chọn cửa trên
//   ngau = chọn ngẫu nhiên
const os = require('os');
const fs = require('fs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

function playRun(G, seed, kieu) {
  const run = new G.Run(seed), R = new G.Rng('van-policy:' + seed), B = G.BET;
  const out = { seed, stages: 0, result: null, money: [], matches: 0, annoy: 0 };
  let guard = 0;
  while (!run.over && guard++ < 20) {
    const cfg = run.nextConfig(), m = new G.Match(cfg), bk = new G.Bookie(m, run);
    bk.startQuestion();
    const rows = bk.pre.rows, H = cfg.house || [];
    let id;
    if (kieu === 'doc') { const pool = rows.filter((r) => r.id !== bk.pre.bait).sort((x, y) => (H.includes(y.id) - H.includes(x.id)) || y.p1 - x.p1); id = pool[0].id; }
    else id = rows[R.int(0, rows.length - 1)].id;
    const st = Math.max(B.minBet, Math.round(run.money * (kieu === 'doc' && H.length ? 0.15 : 0.1) / 10) * 10);
    const sign = run.money > 400 && (kieu === 'doc' || R.next() < 0.25);
    const pick = run.money >= st + (sign ? 100 : 0) ? { mode: 'survive', ids: [id], stake: st } : { skip: true };
    if (sign) pick.contract = Math.max(B.minBet, Math.round(run.money * (kieu === 'doc' ? 0.1 : 0.05) / 10) * 10);
    if (bk.answerStart(pick)) bk.answerStart({ skip: true });
    while (!m.over) {
      m.step();
      const q = bk.tick();
      if (q) {
        const s2 = Math.max(B.minBet, Math.round(run.money * 0.05 / 10) * 10);
        if (run.money < s2) { bk.skip(); continue; }
        const fav = q.opts.slice().sort((x, y) => x.odds - y.odds)[0];
        // "doc": chỉ cược khi đang giao kèo (bắt buộc) hoặc cửa trên khá chắc (×≤1.8); còn lại bỏ qua (không mất gì)
        if (kieu === 'doc' && !q.contract && fav.odds > 1.8) { bk.skip(); continue; }
        const o = kieu === 'doc' ? fav : q.opts[R.int(0, q.opts.length - 1)];
        if (bk.answer(o.key, s2)) bk.skip();
      }
    }
    const sum = bk.finish();
    run.afterMatch(sum); out.matches++;
    out.money.push(run.money);
    if (run.over) break;
    // cửa hàng
    const S = run.shop;
    if (S.gift && !S.giftDone) run.takeGift(true);
    const want = ['dong_xu', 'luoi_an_toan', 'ket_sat', 'bao_hiem'];
    for (const o of S.offer) if (want.includes(o.id) && run.money - o.price > run.quota() * 0.6) { run.buy(o.id); break; }
    if (run.stageEnd()) {
      while (run.money < run.quota() && run.freeSlots() > 0 && run.loans.length < 3) { const amt = B.loans.find((a) => run.money + a >= run.quota()) || B.loans[B.loans.length - 1]; if (run.borrow(amt)) break; }
      run.shop = null;
      if (!run.payQuota()) break;
      out.stages++;
    } else run.shop = null;
  }
  out.result = run.result; out.annoy = run.annoy; out.final = run.final || run.hist.some((h) => h.final);
  return out;
}

if (isMainThread) {
  const a = process.argv.slice(2), o = {};
  for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) { const k = a[i].slice(2), v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; o[k] = v; }
  const N = +(o.van || 8), HAT = o.hat || 'van', KIEU = o.kieu || 'doc', T = Math.min(+(o.luong || os.cpus().length), N);
  const seeds = Array.from({ length: N }, (_, i) => HAT + '-' + i);
  const res = []; let next = 0, done = 0; const t0 = Date.now();
  const report = () => {
    const L = [];
    L.push(`══════ VÁN CƯỢC — người chơi máy "${KIEU}", ${N} ván (${((Date.now() - t0) / 1000).toFixed(0)}s) ══════`);
    const cnt = (r) => res.filter((x) => x.result === r).length;
    L.push(`Kết cục: tự do ${cnt('free')} • vỡ nợ ${cnt('debt')} • thua trận nhà cái ${cnt('house')} • gặp trận của nhà cái ${res.filter((x) => x.final).length}`);
    L.push(`Qua chặng: ${[0, 1, 2, 3].map((k) => `${k} chặng ${res.filter((x) => x.stages === k).length}`).join(' • ')}`);
    L.push(`Bực bội cuối ván: TB ${(res.reduce((s, x) => s + x.annoy, 0) / Math.max(1, res.length)).toFixed(1)}`);
    for (const r of res) L.push(`  ${r.seed}: ${r.result} • ${r.stages} chặng • ${r.matches} trận • tiền ${r.money.join(' → ')}`);
    const txt = L.join('\n'); console.log(txt);
    if (o.txt) fs.writeFileSync(o.txt, txt + '\n', { flag: o.them ? 'a' : 'w' });
  };
  for (let t = 0; t < T; t++) {
    const w = new Worker(__filename, { workerData: { KIEU } });
    const feed = () => { if (next < N) w.postMessage(seeds[next++]); else w.postMessage(null); };
    w.on('message', (r) => { res.push(r); done++; process.stdout.write(`  ${done}/${N}`); if (done === N) { console.log(''); report(); } feed(); });
    w.on('error', (e) => { console.error(e); });
    feed();
  }
} else {
  const G = require('./nap.js');
  parentPort.on('message', (seed) => { if (seed == null) { process.exit(0); } parentPort.postMessage(playRun(G, seed, workerData.KIEU)); });
}
