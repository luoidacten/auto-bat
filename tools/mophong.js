#!/usr/bin/env node
'use strict';
// ===== BỘ MÔ PHỎNG KHÔNG GIAO DIỆN — đấu trường sinh tồn 10 tướng =====
// Chạy hàng loạt trận (song song nhiều luồng) và in báo cáo nhịp trận / cân bằng.
//   node tools/mophong.js --tran 24 --hat gd6b --luong 4 --txt docs/GD6B_MO_PHONG.txt
// Tham số:
//   --tran N      số trận (mặc định 40)
//   --hat S       tiền tố hạt giống (mặc định "mp") — trận i dùng hạt giống "S-i"
//   --luong K     số luồng chạy song song (mặc định = số nhân CPU)
//   --json F      ghi kết quả thô ra tệp JSON
//   --txt F       ghi báo cáo ra tệp văn bản
//   --kiemtra     chỉ kiểm tra tính tất định (chạy 1 trận 2 lần, so dấu vân tay trạng thái)
const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

function args() {
  const a = process.argv.slice(2), o = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const k = a[i].slice(2), v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
    o[k] = v;
  }
  return o;
}

// ---- chạy một trận (dùng chung cho luồng chính và luồng phụ) ----
function runOne(G, seed, opts) {
  const cfg = G.arenaConfig(seed);
  const m = new G.Match(cfg);
  const eng = trackFights(m);
  const t0 = Date.now();
  const r = m.runToEnd();
  eng.close();
  r.fights = eng.done.map((e) => ({ dur: Math.round((e.t1 - e.t0) * 10) / 10, end: e.end, sk: e.sk, duel: e.duel }));
  r.firstFight = eng.first;
  r.pots = m.heroes.reduce((a, h) => a + (h.stats.pots || 0), 0);
  r.duels = m.duelSt ? m.duelSt.history.map((d) => Math.round(d.dur)) : [];
  r.duelGates = m.duelSt ? m.duelSt.n : 0;
  r.souls = m.heroes.map((h) => (h.souls || []).length);
  r.winTier = Math.max(0, ...m.heroes.filter((h) => h.place === 1).map((h) => h.soulTier || 0));
  r.soulDrop = m.stats.soulsDropped || 0; r.soulLoot = m.heroes.reduce((a, h) => a + (h.stats.soulsLooted || 0), 0);
  r.ms = Date.now() - t0;
  r.out = m.ranking.filter((x) => x.place > 1).map((x) => x.t);
  r.deaths10 = m.heroes.filter((h) => h.revived).length;               // số người đã dùng lượt hồi sinh
  if (opts && opts.hash) r.hash = stateHash(m);
  return r;
}
// giao tranh: mỗi cặp tướng đánh nhau là một "trận nhỏ" — bắt đầu từ đòn đầu, kết thúc khi một người gục ("chết")
// hoặc 8s không ai đánh ai ("tách"); đếm số chiêu hai bên tung ra trong lúc đó
function trackFights(m) {
  const live = new Map(), done = [], key = (a, b) => (a.id < b.id ? a.id + '_' + b.id : b.id + '_' + a.id);
  const st = { done, first: null };
  const dmg = m.damage.bind(m), kl = m.kill.bind(m), cs = m.castSkill.bind(m);
  m.damage = function (owner, tgt, a, type, o) {
    const r = dmg(owner, tgt, a, type, o);
    const h = owner && owner.kind !== 'hero' && owner.owner ? owner.owner : owner;
    if (r > 0 && h && h.kind === 'hero' && tgt.kind === 'hero' && h !== tgt) {
      if (st.first == null) st.first = m.time;
      const k = key(h, tgt); let e = live.get(k);
      if (e && m.time - e.last > 8) { e.end = 'tách'; e.t1 = e.last; done.push(e); live.delete(k); e = null; }
      if (!e) { e = { a: h, b: tgt, t0: m.time, last: m.time, dmg: 0, sk: 0, duel: !!h.duel }; live.set(k, e); }
      e.last = m.time; e.dmg += r;
    }
    return r;
  };
  m.castSkill = function (u, k, t, p) { const r = cs(u, k, t, p); if (r && u.kind === 'hero') for (const e of live.values()) if (e.a === u || e.b === u) e.sk++; return r; };
  m.kill = function (tgt, owner, src) {
    if (tgt.kind === 'hero') for (const [k, e] of live) if (e.a === tgt || e.b === tgt) { e.end = 'chết'; e.t1 = m.time; done.push(e); live.delete(k); }
    return kl(tgt, owner, src);
  };
  st.close = () => { for (const e of live.values()) { e.end = 'tách'; e.t1 = e.last; done.push(e); } live.clear(); done.splice(0, done.length, ...done.filter((e) => e.dmg > 300)); };
  return st;
}
function stateHash(m) {
  let h = 0;
  const mix = (v) => { const s = String(Math.round(v * 1000)); for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; };
  mix(m.time); mix(m.winner);
  for (const u of m.heroes) { mix(u.x); mix(u.y); mix(u.hp); mix(u.level); mix(u.gold); mix(u.stats.k); mix(u.stats.d); mix(u.place || 0); }
  mix(m.zoneSt.cur.x); mix(m.zoneSt.cur.y); mix(m.zoneSt.cur.r);
  return (h >>> 0).toString(16);
}

if (!isMainThread) {
  const G = require('./nap.js');
  const out = [];
  for (const seed of workerData.seeds) {
    try { out.push(runOne(G, seed)); } catch (e) { out.push({ seed, crash: String(e && e.stack || e) }); }
    if (out.length >= 4) parentPort.postMessage({ results: out.splice(0) });
  }
  parentPort.postMessage({ results: out, done: true });
  return;
}

// ===================== luồng chính =====================
const o = args();
const N = +(o.tran || 40), prefix = o.hat || 'mp', K = Math.max(1, Math.min(+(o.luong || os.cpus().length), N));

if (o.kiemtra) {
  const G = require('./nap.js');
  const a = runOne(G, prefix + '-0', { hash: true }), b = runOne(G, prefix + '-0', { hash: true });
  console.log('Lần 1:', a.hash, (a.time / 60).toFixed(2), 'phút');
  console.log('Lần 2:', b.hash, (b.time / 60).toFixed(2), 'phút');
  console.log(a.hash === b.hash ? '✔ TẤT ĐỊNH: hai lần chạy giống hệt nhau' : '✘ KHÔNG TẤT ĐỊNH!');
  process.exit(a.hash === b.hash ? 0 : 1);
}

const seeds = Array.from({ length: N }, (_, i) => `${prefix}-${i}`);
const chunks = Array.from({ length: K }, () => []);
seeds.forEach((s, i) => chunks[i % K].push(s));
const results = [];
let doneW = 0;
const t0 = Date.now();
process.stderr.write(`Đang chạy ${N} trận trên ${K} luồng…\n`);
for (const c of chunks) {
  const w = new Worker(__filename, { workerData: { seeds: c } });
  w.on('message', (msg) => {
    results.push(...msg.results);
    process.stderr.write(`  ${results.length}/${N}\r`);
    if (msg.done && ++doneW === K) report();
  });
  w.on('error', (e) => { console.error('Luồng lỗi:', e); });
}

function pct(x) { return (x * 100).toFixed(0) + '%'; }
function q(a, p) { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(p * (s.length - 1))] : 0; }
function report() {
  const wall = (Date.now() - t0) / 1000;
  const ok = results.filter((r) => !r.crash), crashes = results.filter((r) => r.crash);
  const n = ok.length;
  const L = [], p = (...a) => L.push(a.join(' '));
  p('══════════ BÁO CÁO MÔ PHỎNG ĐẤU TRƯỜNG ══════════');
  p(`Số trận: ${n} (văng: ${crashes.length}) • chạy ${wall.toFixed(1)}s • trung bình ${(ok.reduce((a, r) => a + r.ms, 0) / Math.max(1, n) / 1000).toFixed(2)}s/trận/luồng`);
  const mins = ok.map((r) => r.time / 60);
  const avg = mins.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const b = [0, 0, 0, 0, 0];
  for (const x of mins) b[x < 30 ? 0 : x < 40 ? 1 : x < 50 ? 2 : x < 59.9 ? 3 : 4]++;
  p('');
  p(`THỜI LƯỢNG: trung bình ${avg.toFixed(1)} phút • trung vị ${q(mins, 0.5).toFixed(1)} • ngắn nhất ${q(mins, 0).toFixed(1)} • dài nhất ${q(mins, 1).toFixed(1)} • mục tiêu 30–60 (bo 6 đóng lúc 46:30, hết giờ 60:00)`);
  p(`  <30: ${pct(b[0] / n)} | 30–40: ${pct(b[1] / n)} | 40–50: ${pct(b[2] / n)} | 50–60: ${pct(b[3] / n)} | hết 60:00: ${pct(b[4] / n)}`);
  const ff = ok.map((r) => r.firstFight).filter((x) => x != null);
  p(`  Lần đầu hai tướng đánh nhau: giữa ${q(ff, 0.5).toFixed(0)}s (25% ${q(ff, 0.25).toFixed(0)}s • 75% ${q(ff, 0.75).toFixed(0)}s)`);
  const ties = ok.filter((r) => r.heroes.filter((h) => h.place === 1).length > 1).length;
  p(`  Hết giờ (người còn sống đồng hạng 1): ${ok.filter((r) => r.timeout).length} trận • có đồng hạng 1: ${ties} trận`);
  const outs = [].concat(...ok.map((r) => r.out)).map((t) => t / 60);
  p(`  Thời điểm bị loại (phút): 25% ${q(outs, 0.25).toFixed(1)} • giữa ${q(outs, 0.5).toFixed(1)} • 75% ${q(outs, 0.75).toFixed(1)}`);
  // nhịp giao tranh
  const kills = ok.reduce((a, r) => a + r.kills, 0), vult = ok.reduce((a, r) => a + r.vultureKills, 0);
  p('');
  p(`GIAO TRANH: ${(kills / n).toFixed(1)} lần hạ gục/trận (${(kills / n / avg).toFixed(2)}/phút) • kền kền ${pct(vult / Math.max(1, kills))} số mạng (mục tiêu 20–30%)`);
  p(`  Chết trong bo: ${(ok.reduce((a, r) => a + r.zoneDeaths, 0) / n).toFixed(2)}/trận • đã dùng lượt hồi sinh: ${(ok.reduce((a, r) => a + r.deaths10, 0) / n).toFixed(1)} người/trận`);
  p(`  Boss bị hạ: ${(ok.reduce((a, r) => a + r.bossKills, 0) / n).toFixed(2)}/trận • thính được lấy: ${(ok.reduce((a, r) => a + r.drops.filter(Boolean).length, 0) / n).toFixed(1)}/${ok[0] ? ok[0].drops.length : 4} mỗi trận`);
  // thời lượng giao tranh (cặp tướng, > 300 sát thương)
  const F = [].concat(...ok.map((r) => r.fights || []));
  for (const end of ['chết', 'tách']) {
    const d = F.filter((f) => f.end === end && !f.duel).map((f) => f.dur), sk = F.filter((f) => f.end === end && !f.duel).reduce((a, f) => a + f.sk, 0);
    p(`  Giao tranh kết thúc "${end}": ${(d.length / n).toFixed(1)}/trận • thời lượng 25% ${q(d, 0.25).toFixed(0)}s • giữa ${q(d, 0.5).toFixed(0)}s • 75% ${q(d, 0.75).toFixed(0)}s • 90% ${q(d, 0.9).toFixed(0)}s • ${(sk / Math.max(1, d.length)).toFixed(0)} chiêu/giao tranh (mục tiêu 20–120s)`);
  }
  const DU = [].concat(...ok.map((r) => r.duels || []));
  p(`  Cổng quyết đấu: ${(ok.reduce((a, r) => a + r.duelGates, 0) / n).toFixed(1)} cổng/trận • ${(DU.length / n).toFixed(1)} trận quyết đấu/trận • thời lượng giữa ${q(DU, 0.5).toFixed(0)}s (25% ${q(DU, 0.25).toFixed(0)}s • 75% ${q(DU, 0.75).toFixed(0)}s)`);
  p(`  Bình đã uống: ${(ok.reduce((a, r) => a + r.pots, 0) / n).toFixed(0)}/trận • mảnh hồn: ${(ok.reduce((a, r) => a + r.souls.reduce((x, y) => x + y, 0), 0) / n).toFixed(1)}/trận • nhà vô địch có mảnh hồn bậc cao nhất trung bình ${(ok.reduce((a, r) => a + r.winTier, 0) / n).toFixed(1)}`);
  p(`  Mảnh hồn rơi khi bị hạ: ${(ok.reduce((a, r) => a + r.soulDrop, 0) / n).toFixed(1)}/trận • được nhặt lại: ${(ok.reduce((a, r) => a + r.soulLoot, 0) / n).toFixed(1)}/trận`);
  // tướng
  const H = {};
  for (const r of ok) for (const h of r.heroes) {
    const s = H[h.hero] || (H[h.hero] = { n: 0, pl: 0, w: 0, t3: 0, k: 0, d: 0, v: 0, lvl: 0, pers: h.pers });
    s.n++; s.pl += h.place; if (h.place === 1) s.w++; if (h.place <= 3) s.t3++; s.k += h.k; s.d += h.d; s.v += h.vulture; s.lvl += h.level;
  }
  p('');
  p('TƯỚNG (hạng trung bình; kỳ vọng ~5.5; vô địch kỳ vọng ~10%):');
  p('  Tướng        Tính cách  Trận  Hạng TB  Vô địch  Top 3   Mạng  Chết  Kền kền  Cấp');
  for (const [id, s] of Object.entries(H).sort((x, y) => x[1].pl / x[1].n - y[1].pl / y[1].n)) {
    const flag = s.n >= 6 && (s.pl / s.n < 3.5 || s.pl / s.n > 7.5) ? ' ⚠' : '';
    p(`  ${id.padEnd(12)} ${String(s.pers).padEnd(9)} ${String(s.n).padStart(5)}  ${(s.pl / s.n).toFixed(1).padStart(6)}  ${pct(s.w / s.n).padStart(6)}  ${pct(s.t3 / s.n).padStart(5)}  ${(s.k / s.n).toFixed(1).padStart(5)} ${(s.d / s.n).toFixed(1).padStart(5)} ${(s.v / s.n).toFixed(1).padStart(7)} ${(s.lvl / s.n).toFixed(1).padStart(5)}${flag}`);
  }
  // tính cách
  const P = {};
  for (const r of ok) for (const h of r.heroes) { const s = P[h.pers] || (P[h.pers] = { n: 0, pl: 0, w: 0, k: 0, v: 0 }); s.n++; s.pl += h.place; if (h.place === 1) s.w++; s.k += h.k; s.v += h.vulture; }
  p('');
  p('TÍNH CÁCH: ' + Object.entries(P).sort((x, y) => x[1].pl / x[1].n - y[1].pl / y[1].n).map(([k, s]) => `${k} hạng ${(s.pl / s.n).toFixed(1)}, vô địch ${pct(s.w / s.n)}, ${(s.k / s.n).toFixed(1)} mạng (🦅${(s.v / s.n).toFixed(1)})`).join(' • '));
  const errs = ok.filter((r) => r.errors.length);
  p('');
  p(`LỖI TRONG TRẬN: ${errs.length} trận có lỗi kích hoạt${errs.length ? ' — ví dụ hạt giống ' + errs.slice(0, 3).map((r) => r.seed).join(', ') + ': ' + errs[0].errors[0] : ''}`);
  if (crashes.length) p(`VĂNG: ${crashes.slice(0, 3).map((r) => r.seed + ' ' + r.crash.split('\n')[0]).join(' | ')}`);
  const txt = L.join('\n');
  console.log(txt);
  if (o.json) require('fs').writeFileSync(o.json, JSON.stringify({ args: o, heroes: H, pers: P, results: ok.map((r) => ({ seed: r.seed, t: r.time, k: r.kills, v: r.vultureKills, h: r.heroes.map((h) => [h.hero, h.place, h.k, h.d, h.vulture, h.level]) })) }, null, 1));
  if (o.txt) require('fs').writeFileSync(o.txt, txt + '\n');
  process.exit(0);
}
