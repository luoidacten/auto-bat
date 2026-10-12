// GĐ13: node tools/nhip_giao_tranh.js [dau|giua|cuoi] — đo nhịp 1v1 giữa tướng máu giấy theo giai đoạn
// đo nhịp giao tranh 1v1 giữa tướng máu giấy theo giai đoạn: thời gian từ đòn đầu tới khi 1 bên chết, và cú dồn 1s lớn nhất (% máu tối đa)
const G = require('./nap.js');
const PAIRS = [['raven', 'ignatius'], ['zero', 'alice'], ['elara', 'lyra'], ['jack', 'mirage'], ['percy', 'dahlia'], ['chrononeo', 'joker'], ['vector', 'thanhphong'], ['caelus', 'bachdiep']];
const STAGES = { dau: { lv: 3, n: 0, yn: 0 }, giua: { lv: 9, n: 3, yn: 2 }, cuoi: { lv: 16, n: 6, yn: 4 } };
const only = process.argv[2];
const items = (id, n) => { const b = G.buildsOf(id)[0]; return [b.boots].concat(b.core).slice(0, n); };
const res = {};
for (const [sk, st] of Object.entries(STAGES)) {
  if (only && only !== sk) continue;
  const durs = [], bursts = [];
  for (const [a, b] of PAIRS) for (const sw of [0, 1]) {
    const [x, y] = sw ? [b, a] : [a, b];
    const pk = (h) => ({ hero: h, level: st.lv, yNiem: st.yn, tree: [0, 0, 0, 0, 0], items: items(h, st.n), pots: [], gold: 0, mastery: 100, pers: 'hieuchien' });
    const m = new G.Match({ seed: 'ttk-' + sk + x + y, mode: 'solo', soloArena: 'legacy_da', soloTheme: 'da', soloCenter: true, soloZoneR: 38, noRevive: true, fx: false, picks: [pk(x), pk(y)] });
    const H = m.heroes; let t0 = null; const log = H.map(() => []);
    const hp0 = H.map((h) => h.hp);
    while (!m.over && m.time < 240) {
      const before = H.map((h) => h.hp + (h.ga || 0));
      m.step();
      H.forEach((h, i) => { const d = before[i] - (h.hp + (h.ga || 0)); if (d > 0) { if (t0 == null) t0 = m.time; log[i].push([m.time, d]); } });
      if (H.some((h) => !h.alive)) break;
    }
    const dead = H.findIndex((h) => !h.alive);
    if (dead < 0 || t0 == null) { durs.push(null); continue; }
    durs.push(m.time - t0);
    // cú dồn 1s lớn nhất lên kẻ chết (theo % máu+giáp tối đa)
    const L = log[dead], mx = H[dead].st.maxHp + (H[dead].st.maxGa || 0); let best = 0, j = 0, sum = 0;
    for (let i = 0; i < L.length; i++) { sum += L[i][1]; while (L[i][0] - L[j][0] > 1) { sum -= L[j][1]; j++; } best = Math.max(best, sum); }
    bursts.push(best / mx);
  }
  const ok = durs.filter((d) => d != null).sort((a, b) => a - b);
  res[sk] = { n: ok.length + '/' + durs.length, med: ok[ok.length >> 1] && ok[ok.length >> 1].toFixed(1), min: ok[0] && ok[0].toFixed(1), max: ok[ok.length - 1] && ok[ok.length - 1].toFixed(1), burst1s: (bursts.reduce((a, b) => a + b, 0) / Math.max(1, bursts.length) * 100).toFixed(0) + '%' };
}
console.log(JSON.stringify(res));
