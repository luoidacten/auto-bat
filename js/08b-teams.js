'use strict';
// ===== Chế độ đội 3 người: Luật đấu & Thể thức giải =====
// Mỗi ván trong loạt (Bo3/Bo5) theo 1 luật:
//   brawl    — Hỗn Chiến 3v3: cả 6 đấu sĩ lên sàn, mỗi người 2 mạng; chọn 1 Leader nhận lệnh (đứng gần Leader +10% sát thương)
//   gauntlet — Xa Luân Chiến: 1v1 lần lượt, rơi đài là bị loại, người thắng ở lại sàn giữ nguyên điểm văng
//   duel     — Quyết Đấu: mỗi bên chọn 1 trong 3 người đấu 1v1 (2 mạng); người đã quyết đấu trong loạt không được chọn lại
const RULES = {
  brawl:    { name: 'Hỗn Chiến 3v3', icon: '🌪️', desc: 'Cả 6 đấu sĩ lên sàn cùng lúc, mỗi người 2 mạng — đội nào còn người cuối cùng thắng. Chọn 1 Leader nhận lệnh — đứng gần Leader +10% sát thương. Lệnh đội: Tập trung hỏa lực, Hạ thủ lĩnh, Bảo vệ Leader, Bao vây, Tập hợp.' },
  gauntlet: { name: 'Xa Luân Chiến', icon: '🔁', desc: 'Đấu 1v1 lần lượt như KOF: rơi đài là bị loại, người kế tiếp bước lên; người thắng ở lại sàn và giữ nguyên điểm văng. Xếp thứ tự ra sân hợp lý. Lệnh "Đổi người!" 1 lần mỗi ván.' },
  duel:     { name: 'Quyết Đấu', icon: '🎯', desc: 'Mỗi bên chọn 1 trong 3 đấu sĩ, đấu 1v1 (2 mạng) — thắng là thắng ván. Người đã quyết đấu trong loạt không được chọn lại.' },
};
// Thể thức giải (công khai trước khi đăng ký)
const FORMATS = {
  solo:     { name: 'Đơn Đấu', icon: '⚔️', desc: 'Đấu sĩ của bạn đấu 1v1, Bo3 như truyền thống.', team: false },
  brawl:    { name: 'Bảng Hỗn Chiến Thuần', icon: '🌪️', desc: 'Pure 3v3 Tri-Brawl: mọi ván đều là Hỗn Chiến 3v3 (Bo3).', team: true },
  gauntlet: { name: 'Bảng Xa Luân Chiến Thuần', icon: '🔁', desc: 'Pure 1v1 Gauntlet: mọi ván đều là Xa Luân Chiến — đấu lần lượt tới khi quét sạch đội hình đối phương (Bo3).', team: true },
  hybrid:   { name: 'Bảng Hỗn Hợp', icon: '🎲', desc: 'Hybrid: mỗi ván một luật ngẫu nhiên (Hỗn Chiến / Xa Luân / Quyết Đấu), Bo3 hoặc Bo5 — luật từng ván được công bố trước.', team: true },
};
// sinh dãy luật cho 1 loạt đấu
function rollRules(fmt) {
  if (fmt === 'brawl' || fmt === 'gauntlet') return [fmt, fmt, fmt];
  if (fmt === 'hybrid') {
    // thường gặp: Bo5 = 1 Hỗn Chiến + 2 Xa Luân + 2 Quyết Đấu; nhưng không cố định
    if (Math.random() < 0.45) return shuffle(['brawl', 'gauntlet', 'gauntlet', 'duel', 'duel']);
    const bo = Math.random() < 0.5 ? 5 : 3, L = [];
    while (L.length < bo) { const r = pick(['brawl', 'brawl', 'gauntlet', 'gauntlet', 'duel']); if (r === 'duel' && L.filter((x) => x === 'duel').length >= 3) continue; L.push(r); }
    return L;
  }
  return ['solo', 'solo', 'solo'];
}
function rulesLabel(rules) { return rules.map((r, i) => `<span class="rule-chip">${i + 1}. ${r === 'solo' ? '⚔️ Đơn đấu' : RULES[r].icon + ' ' + RULES[r].name}</span>`).join(''); }
// thể thức của giải: cấp 1 luôn Đơn Đấu; còn lại bốc ngẫu nhiên (lưu lại tới khi giải kết thúc)
function tourFormat(id) {
  const d = Career.d; d.formats = d.formats || {};
  if (!d.formats[id]) {
    const T = TOURNAMENTS.find((x) => x.id === id);
    d.formats[id] = T.tier <= 1 ? 'solo' : pick(['solo', 'solo', 'brawl', 'gauntlet', 'hybrid', 'hybrid']);
    Career.save();
  }
  return d.formats[id];
}
// đồng đội của HLV (2 người, chọn ở tab Đội hình) — cấp độ theo lực chiến của đấu sĩ chính
function allyLevel() { return Math.max(0, (ratingOf(Career.cfg()) - 100) / 3 / 9); }
function defaultAllies(charId) {
  const me = ROSTER_BY_ID[charId], same = ROSTER.filter((c) => c.id !== charId && c.group === me.group).map((c) => c.id);
  const rest = shuffle(ROSTER.filter((c) => c.id !== charId && !same.includes(c.id)).map((c) => c.id));
  return same.concat(rest).slice(0, 2);
}
function myTeam() {
  const d = Career.d;
  if (!d.allies || d.allies.length < 2) { d.allies = defaultAllies(d.fighter.charId); Career.save(); }
  const lv = allyLevel();
  return [Career.cfg()].concat(d.allies.map((id) => { const c = genOpponent(lv, { charId: id }); c.equip = []; c.ally = true; return c; }));
}
// đội của đối thủ máy: đấu sĩ chính + 2 người khác cấp
function oppTeam(cfg, lv) {
  const used = new Set([cfg.charId]), team = [cfg];
  while (team.length < 3) { const c = pick(ROSTER); if (used.has(c.id)) continue; used.add(c.id); team.push(genOpponent(lv, { charId: c.id })); }
  return team;
}
// HLV máy: chọn người quyết đấu / xếp thứ tự xa luân
function aiDuelPick(team, used, foe) {
  const ok = team.map((c, i) => i).filter((i) => !used.includes(i));
  return ok.sort((a, b) => ratingOf(team[b]) - ratingOf(team[a]) + rand(-15, 15))[0] ?? 0;
}
// Xa Luân: người mạnh nhất ra sau cùng làm "chốt chặn" (người thắng ở lại sàn, nên giữ át chủ bài tới cuối)
function aiOrder(team) { return team.map((c, i) => [i, ratingOf(c) + rand(-12, 12)]).sort((a, b) => a[1] - b[1]).map((x) => x[0]); }

// ===== Giao diện chọn người trước mỗi ván đội =====
Object.assign(UI, {
  teamPick(s) {
    this.cur = 'teampick';
    $('#match-ui').classList.add('hidden');
    const rule = s.rules[s.game - 1], R = RULES[rule], me = s.teamMe;
    const card = (c, i, on, dis, fn, extra = '') => `<button class="tac ${on ? 'on' : ''}" ${dis ? 'disabled' : ''} onclick="${fn}(${i})"><span>${WEAPONS[c.weapon].icon}</span><b>${esc(c.name)}${i === 0 && !s.exhibition ? ' ⭐' : ''}</b><small>${esc(ROSTER_BY_ID[c.charId].role || '')} • ⚡${ratingOf(c)}${extra}</small></button>`;
    let body = '';
    if (rule === 'duel') {
      body = `<h3>Chọn người Quyết Đấu</h3><div class="tactics">${me.map((c, i) => card(c, i, s.pickMe === i, s.usedMe.includes(i), 'UI.tpDuel', s.usedMe.includes(i) ? ' • đã đấu' : '')).join('')}</div>`;
    } else if (rule === 'gauntlet') {
      body = `<h3>Thứ tự ra sân <small>(bấm để đưa lên đầu hàng)</small></h3><div class="tactics">${s.orderMe.map((i, k) => card(me[i], i, k === 0, false, 'UI.tpOrder', ` • #${k + 1}`)).join('')}</div>`;
    } else {
      body = `<h3>Chọn Leader <small>(nhận lệnh của bạn; đồng đội đứng gần Leader +10% sát thương)</small></h3><div class="tactics">${me.map((c, i) => card(c, i, s.leaderMe === i, false, 'UI.tpLeader', s.leaderMe === i ? ' • 👑' : '')).join('')}</div>`;
    }
    const opp = s.teamOpp.map((c) => `${WEAPONS[c.weapon].icon} ${esc(c.name)}`).join(' • ');
    this.render(`
      <div class="panel wide">
        <h1>${R.icon} Ván ${s.game}: ${R.name}</h1>
        <p class="sub">${R.desc}</p>
        <div class="rules-row">${rulesLabel(s.rules)}</div>
        <p class="note">Đội đối thủ: ${opp} • Tỉ số ${s.wins[0]} - ${s.wins[1]} (cần ${s.need} ván)</p>
        ${body}
        <div class="actions"><button class="btn gold big" onclick="UI.tpGo()">Tiếp tục ▶</button></div>
      </div>`);
  },
  tpDuel(i) { G.series.pickMe = i; this.teamPick(G.series); },
  tpLeader(i) { G.series.leaderMe = i; this.teamPick(G.series); },
  tpOrder(i) { const s = G.series; s.orderMe = [i].concat(s.orderMe.filter((k) => k !== i)); this.teamPick(s); },
  tpGo() { Series.afterTeamPick(); },
});
