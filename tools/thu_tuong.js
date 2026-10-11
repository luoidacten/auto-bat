#!/usr/bin/env node
'use strict';
// ===== GĐ10: chạy thử trận có chỉ định tướng (kiểm tra lỗi + số liệu nhanh) =====
//   node tools/thu_tuong.js --tuong luca,kip --tran 3 [--hat t] [--phut 20]
const G = require('./nap.js');
const a = process.argv.slice(2), o = {};
for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) { const k = a[i].slice(2), v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; o[k] = v; }
const want = String(o.tuong || '').split(',').filter(Boolean), N = +(o.tran || 3), HAT = o.hat || 'thu', MAXT = (+(o.phut || 40)) * 60;
for (const id of want) if (!G.HEROES[id]) { console.error('Không có tướng: ' + id); process.exit(1); }
const agg = {}; let errs = 0;
const casts = {};   // số lần dùng chiêu của tướng được thử
const orig = G.Match.prototype.castSkill;
G.Match.prototype.castSkill = function (u, key, tgt, pt) { const ok = orig.call(this, u, key, tgt, pt); if (ok && want.includes(u.heroId)) { const c = casts[u.heroId] || (casts[u.heroId] = {}); c[key] = (c[key] || 0) + 1; } return ok; };
for (let k = 0; k < N; k++) {
  const cfg = G.arenaConfig(HAT + '-' + k);
  const have = new Set(cfg.picks.map((p) => p.hero));
  let j = 0;
  for (const id of want) if (!have.has(id)) { while (want.includes(cfg.picks[j].hero)) j++; cfg.picks[j] = { hero: id, player: G.heroChar(id) }; j++; }
  const m = new G.Match(cfg);
  while (!m.over && m.time < MAXT) m.step();
  errs += m.errors.length;
  if (m.errors.length) console.log('LỖI', HAT + '-' + k, m.errors.slice(0, 3).map((e) => JSON.stringify(e).slice(0, 300)).join('\n'));
  for (const h of m.heroes) {
    const s = agg[h.heroId] || (agg[h.heroId] = { n: 0, place: 0, k: 0, dmg: 0, win: 0 });
    s.n++; s.place += h.place || 10; s.k += h.stats.k; s.dmg += h.stats.dmgHero; if (h.place === 1) s.win++;
  }
  console.log(`trận ${k}: ${(m.time / 60).toFixed(1)} phút • thắng ${m.heroes.filter((h) => h.place === 1).map((h) => h.heroId).join('+')} • ` + want.map((id) => { const h = m.heroes.find((x) => x.heroId === id); return `${id} hạng ${h.place} ${h.stats.k}/${h.stats.d} st ${Math.round(h.stats.dmgHero)}`; }).join(' • '));
}
console.log('Lỗi:', errs);
for (const id of want) { const s = agg[id]; console.log(`${id}: hạng TB ${(s.place / s.n).toFixed(1)} • vô địch ${s.win}/${s.n} • mạng TB ${(s.k / s.n).toFixed(1)} • sát thương TB ${Math.round(s.dmg / s.n)} • chiêu/trận ${Object.entries(casts[id] || {}).map(([k, v]) => k + ' ' + (v / s.n).toFixed(1)).join(' ')}`); }
