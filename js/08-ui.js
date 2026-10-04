'use strict';
// ===== Giao diện =====
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const G = { match: null, demo: null, speed: 1, paused: false, series: null };

const UI = {
  cur: null,
  root() { return $('#ui'); },
  render(html, cls = '') { const r = this.root(); r.className = cls; r.innerHTML = html; r.scrollTop = 0; },
  toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 1800);
  },
  modal(html) {
    const m = $('#modal'); m.innerHTML = `<div class="modal-box">${html}</div>`; m.classList.add('show');
    m.onclick = (e) => { if (e.target === m) this.closeModal(); };
  },
  closeModal() { $('#modal').classList.remove('show'); },

  // ---------- MENU CHÍNH ----------
  menu() {
    this.cur = 'menu';
    startDemo();
    Sound.music('menu');
    $('#match-ui').classList.add('hidden');
    const has = Career.load() && !Career.d.runOver;
    this.render(`
      <div class="menu">
        <div class="logo">⚔️ <span>ĐẤU TRƯỜNG</span><b>HUẤN LUYỆN VIÊN</b></div>
        <p class="tag">Bạn không điều khiển đấu sĩ — bạn là HLV. Huấn luyện, trang bị, ra chiến thuật<br>và đưa học trò trở thành kẻ mạnh nhất thiên hạ! <b>Thua một giải là hết hành trình.</b></p>
        <div class="menu-btns">
          ${has ? `<button class="btn big gold" onclick="UI.continueCareer()">▶ Tiếp tục hành trình — ${esc(Career.f.name)} Lv${Career.f.level}</button>` : ''}
          <button class="btn big ${has ? '' : 'gold'}" onclick="UI.newCareer()">🧭 Bắt đầu hành trình</button>
          <button class="btn big ghost" onclick="UI.exhibition()">🎮 Đấu thử (xem AI)</button>
          <button class="btn big ghost" onclick="UI.howto()">📖 Cách chơi</button>
        </div>
      </div>`, 'center');
  },
  howto() {
    this.modal(`<h2>📖 Cách chơi</h2>
      <ul class="howto">
        <li><b>Không có máu!</b> Mỗi đòn đánh tăng <b>điểm văng %</b>. Điểm càng cao, bị đánh càng văng xa. Rơi khỏi sàn = mất 1 mạng ❤️.</li>
        <li>Mỗi ván có 2 mạng. Mỗi trận đấu <b>Bo3</b> (thắng 2 ván).</li>
        <li>Bạn là <b>Huấn Luyện Viên</b>: đấu sĩ do AI điều khiển. Bạn nâng chỉ số, kỹ năng, kỹ thuật, mua trang bị, chọn nội tại và chiến thuật.</li>
        <li><b>Bộ chiêu:</b> <b>A</b> đánh tích (dồn điểm văng) • <b>B</b> kết liễu (đánh văng) • <b>C</b> thủ / né / cơ động / trụ sân • <b>D</b> đặc kỹ (hỗ trợ chiêu khác, xử lý tình huống) • <b>Nộ</b> chiêu tối thượng.</li>
        <li><b>Mệnh lệnh:</b> mỗi nhân vật có 3 lệnh cơ bản (Tiến lên, Rút lui, Tung Nộ) + lệnh riêng (Aria chọn bản nhạc, Valerius giơ khiên, Jack bị kìm Cò Quay Nga...). Mang tối đa <b>3 lệnh</b> vào mỗi ván (phím 1/2/3, hồi 8s). HLV đối thủ cũng ra lệnh!</li>
        <li><b>Biến đổi sân đấu:</b> trước mỗi ván có 3 lựa chọn — bạn chọn 1, HLV đối thủ chọn 1 (bí mật), cả hai cùng có hiệu lực. Hãy chọn thứ có lợi cho lối đánh của mình.</li>
        <li>Hết chiêu, AI sẽ tự lùi lại chờ hồi.</li>
        <li><b>Hành trình:</b> thua (hoặc bỏ) một giải đấu là <b>hết hành trình</b> — chọn đấu sĩ và bắt đầu lại từ đầu. Vô địch Đại Hội Võ Thần để chinh phục.</li>
        <li>Mỗi trận thắng trong giải = lên <b>1 cấp</b>. Ở <b>Lv1, Lv3, Lv6, Lv9, Lv12</b> chọn 1 trong 3 <b>nội tại</b> (Nền tảng → Biến chuyển → Chiêu mới → Thức tỉnh → Phong cách).</li>
        <li><b>Chiến thuật</b> dùng chung cho mọi nhân vật; chiến thuật nâng cao <b>tự mở khóa khi nâng 🧠 Chiến thuật (Tư duy)</b> đủ cấp. Mang theo tối đa <b>5</b>, chọn cái dùng trước mỗi ván.</li>
        <li><b>Trang bị 3 bậc:</b> mua bao nhiêu cũng được nhưng mỗi ván chỉ <b>mang 3 món</b> (đổi được trước trận và giữa các hiệp). Bậc II mở khi vô địch giải đầu tiên, Bậc III khi vô địch giải thứ 3. Trang bị kích hoạt được AI tự dùng — và sinh ra <b>lệnh dùng trang bị</b> để HLV ra lệnh đúng lúc.</li>
        <li><b>Mỗi sàn có đặc trưng riêng</b>: gió giật, đá lở, bão tuyết, dung nham, bệ mây, ấn Võ Thần, bụi rậm, sóng tràn, sét đánh, cát lún, cột xoay… Mỗi vòng giải đấu ở một sàn khác nhau.</li>
        <li>Khi đối thủ <b>BẤT TỬ</b> 👑, AI sẽ tự né xa thay vì phí đòn vào hắn.</li>
        <li>Elara, Aria và Koda là người một nhà — gặp nhau thì <b>hòa</b>. Gặp kẻ đã hạ Aria, Koda sẽ <b>hóa điên</b> và không nghe lệnh HLV.</li>
        <li>Hiệu ứng: 💫 Choáng • 🐌 Làm chậm • 🔇 Câm lặng (chỉ dùng được A) • ⛓️ Trói chân • 🔥 Thiêu đốt • ☠️ Độc • 🚫 Không thể cản phá.</li>
        <li>Phím tắt trong trận: <b>1/2/3</b> hô lệnh • <b>Space</b> tạm dừng. Nút 🎵/🔊 góc màn hình bật/tắt nhạc và hiệu ứng.</li>
      </ul><button class="btn" onclick="UI.closeModal()">Đã hiểu</button>`);
  },

  // ---------- BẮT ĐẦU HÀNH TRÌNH ----------
  newCareer() {
    if (Career.load() && !Career.d.runOver && !confirm('Đang có một hành trình dở dang. Bắt đầu hành trình mới sẽ bỏ hành trình hiện tại. Tiếp tục?')) return;
    const prevCoach = Career.d ? Career.d.coach : `HLV ${pick(['Tuấn', 'Minh', 'Long', 'Hà', 'Nam'])}`;
    this.cur = 'new';
    this._pickCh = this._pickCh || 'valerius';
    this.render(`
      <div class="panel wide">
        <h1>🧭 Bắt đầu hành trình</h1>
        <div class="row2">
          <label>Tên HLV <input id="in-coach" maxlength="18" value="${esc(prevCoach)}"></label>
        </div>
        <h3>Chọn 1 đấu sĩ để huấn luyện <small>(không thể đổi trong hành trình này)</small></h3>
        <div id="cgrid">${this.charCards(this._pickCh, 'UI.pickStartChar')}</div>
        <div id="cdetail">${this.charDetail(this._pickCh)}</div>
        <div class="actions">
          <button class="btn ghost" onclick="UI.menu()">← Quay lại</button>
          <button class="btn gold big" onclick="UI.createCareer()">Lên đường ▶</button>
        </div>
      </div>`);
  },
  pickStartChar(id) { this._pickCh = id; $('#cgrid').innerHTML = this.charCards(id, 'UI.pickStartChar'); $('#cdetail').innerHTML = this.charDetail(id); },
  createCareer() {
    const coach = $('#in-coach').value.trim() || 'HLV';
    Career.newGame(coach, this._pickCh);
    this.talentPick();
  },
  continueCareer() { if (Career.load()) this.hub('map'); },
  charCards(sel, fn) {
    const groups = [...new Set(ROSTER.map((c) => c.group))];
    return groups.map((g) => `<div class="cgroup">${g}</div><div class="wgrid">${ROSTER.filter((c) => c.group === g).map((c) => {
      const w = WEAPONS[c.weapon];
      return `<div class="wcard ${c.id === sel ? 'on' : ''}" onclick="${fn}('${c.id}')" style="--wc:${c.color}">
        <div class="wi">${w.icon}</div><div class="wn">${esc(c.name)}</div><div class="wr">${w.name}</div><div class="wrole">${esc(c.role || '')}</div></div>`;
    }).join('')}</div>`).join('');
  },
  charDetail(id) {
    const c = ROSTER_BY_ID[id], pool = tacticPool(id);
    return `<div class="bio" style="--wc:${c.color}"><b>${esc(c.name)}</b> <small>— ${c.style}</small> <span class="wrole">${esc(c.role || '')} • ${esc(c.group)}</span> <span class="wrole">🤝 ${mindBase(c.id)[0]} • 🦉 ${mindBase(c.id)[1]}</span><p>${esc(c.bio)}</p>
      <p class="note">📣 Mệnh lệnh riêng: ${(CHAR_COMMANDS[id] || []).map((k) => `${COMMANDS[k].icon} ${COMMANDS[k].name}`).join(' • ')} <small>(+ 3 lệnh cơ bản)</small></p></div>
      ${this.weaponDetail(c.weapon)}${this.talentTree(id, null)}`;
  },
  // cây nội tại 1-3-9 (sel: { tier: id } các nội tại đã chọn; onPick: tên hàm khi bấm chọn)
  talentTree(charId, sel, onPick, level) {
    const rows = TALENTS[charId]; if (!rows) return '';
    const tierName = { 1: 'Nền tảng', 3: 'Biến chuyển', 6: 'Chiêu mới', 9: 'Thức tỉnh', 12: 'Phong cách' };
    return `<div class="ttree">${rows.map((row) => {
      const tier = row[0].tier, chosen = sel && sel[tier], open = onPick && level >= tier && !chosen;
      return `<div class="trow ${sel && level < tier ? 'locked' : ''}"><div class="tlv">Lv${tier}<small>${tierName[tier]}</small></div>${row.map((t) =>
        `<div class="tal ${chosen === t.id ? 'on' : chosen ? 'off' : ''} ${open ? 'pick' : ''}" ${open ? `onclick="${onPick}(${tier},'${t.id}')"` : ''}>
          <b>${esc(t.name)}</b><small>${esc(t.desc)}</small></div>`).join('')}</div>`;
    }).join('')}</div>`;
  },
  // màn hình chọn nội tại khi lên mốc cấp
  talentPick(after) {
    const f = Career.f, tier = Career.nextTier();
    if (!tier) { (after || (() => this.hub('map')))(); return; }
    this._afterPick = after;
    this.cur = 'talent';
    this.render(`
      <div class="panel wide">
        <h1>✨ ${esc(f.name)} đạt Lv${f.level} — chọn nội tại mốc Lv${tier}</h1>
        <p class="sub">Chọn 1 trong 3. Lựa chọn là vĩnh viễn trong hành trình này.</p>
        ${this.talentTree(f.charId, f.talents, 'UI.doPickTalent', f.level)}
      </div>`);
  },
  doPickTalent(tier, id) {
    if (!Career.pickTalent(tier, id)) return;
    this.toast(`Đã lĩnh hội: ${TALENT_BY_ID[id].name}`);
    this.talentPick(this._afterPick);
  },
  weaponCards(sel, fn) {
    return WEAPON_IDS.map((id) => {
      const w = WEAPONS[id];
      return `<div class="wcard ${id === sel ? 'on' : ''}" onclick="${fn}('${id}')" style="--wc:${w.color}">
        <div class="wi">${w.icon}</div><div class="wn">${w.name}</div><div class="wr">${w.role}</div></div>`;
    }).join('');
  },
  weaponDetail(id) {
    const w = WEAPONS[id];
    const keys = ['E', 'A', 'B', 'C', 'D', 'U'].filter((k) => w.skills[k]);
    return `<div class="wdetail" style="--wc:${w.color}">
      <div class="wd-head"><span class="wi">${w.icon}</span><div><b>${w.name}</b><br><small>${w.role} • Trọng lượng ${w.weight} • Tốc độ ${w.speed}</small></div></div>
      <div class="sk passive"><span class="key">Nội tại</span><div><b>${w.passive.name}</b><p>${esc(w.passive.desc).replace(/\n/g, '<br>')}</p></div></div>
      ${keys.map((k) => { const s = w.skills[k], role = SKILL_ROLE[k]; return `<div class="sk"><span class="key ${k === 'U' ? 'ult' : ''}">${k === 'U' ? 'NỘ' : k}</span><div><b>${s.name}</b> ${role ? `<span class="role r${k}">${role}</span>` : ''}${s.cd ? ` <small>⏱ ${+(s.cd * CD_SCALE).toFixed(1)}s${s.shared ? ` (chung với ${s.shared})` : ''}${s.group ? ' (A/B/C chung)' : ''}</small>` : ''}<p>${esc(skillDesc(s.desc))}</p></div></div>`; }).join('')}
      ${w.noRage && !w.skills.U ? '<p class="note">Không có Nộ.</p>' : ''}
    </div>`;
  },

  // ---------- TRUNG TÂM (HUB) ----------
  hub(tab = 'map') {
    this.cur = 'hub'; this.tab = tab;
    Sound.music('hub');
    startDemo();
    $('#match-ui').classList.add('hidden');
    const d = Career.d, f = d.fighter, w = WEAPONS[f.weapon];
    if (d.runOver) { this.runOver(); return; }
    if (Career.nextTier()) { this.talentPick(() => this.hub(tab)); return; }
    const tabs = [['map', '🗺️ Bản đồ giải'], ['train', '🏋️ Huấn luyện'], ['shop', '🛒 Trang bị'], ['talent', '🧬 Nội tại'], ['weapon', '📣 Lệnh & Chiến thuật'], ['team', '👥 Đội hình'], ['trophy', '🏆 Thành tích']];
    let body = '';
    if (tab === 'map') body = this.tabMap();
    if (tab === 'train') body = this.tabTrain();
    if (tab === 'shop') body = this.tabShop();
    if (tab === 'talent') body = this.tabTalent();
    if (tab === 'weapon') body = this.tabWeapon();
    if (tab === 'trophy') body = this.tabTrophy();
    if (tab === 'team') body = this.tabTeam();
    this.render(`
      <div class="topbar">
        <div class="tb-left"><span class="avatar" style="background:${f.color}">${w.icon}</span>
          <div><b>${esc(f.name)} <span class="lv">Lv${f.level}</span></b><small>${esc(d.coach)} • ${w.name}</small></div></div>
        <div class="tb-stats">
          <span title="Lực chiến">⚡ <b>${ratingOf(Career.cfg())}</b></span>
          <span title="Vàng">💰 <b>${fmt(d.gold)}</b></span>
          <span title="Điểm huấn luyện">⭐ <b>${d.tp}</b> ĐHL</span>
          <span title="Thắng - Thua">📊 ${d.record.w}-${d.record.l}</span>
          <button class="btn sm ghost" onclick="UI.menu()">☰ Menu</button>
        </div>
      </div>
      <div class="tabs">${tabs.map(([k, n]) => `<button class="tab ${k === tab ? 'on' : ''}" onclick="UI.hub('${k}')">${n}</button>`).join('')}</div>
      <div class="tab-body">${body}</div>`, 'hub');
  },
  tabMap() {
    const d = Career.d;
    const tour = d.tour;
    const pts = TOURNAMENTS.map((t) => `${t.x},${t.y}`).join(' ');
    return `
      ${tour && !tour.done ? `<div class="banner">🏟️ Đang tham dự <b>${Tour.def(tour.id).name}</b> — <button class="btn sm gold" onclick="UI.bracket()">Vào nhánh đấu ▶</button></div>` : ''}
      <div class="map">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="map-path"><polyline points="${pts}" /></svg>
        ${TOURNAMENTS.map((t, i) => {
          const locked = i + 1 > d.unlocked, best = d.best[t.id];
          const champ = best && best.wins;
          return `<div class="node ${locked ? 'locked' : ''} ${champ ? 'champ' : ''}" style="left:${t.x}%;top:${t.y}%" onclick="${locked ? "UI.toast('🔒 Vô địch giải trước để mở khóa')" : `UI.tourInfo('${t.id}')`}">
            <div class="node-ic">${locked ? '🔒' : champ ? '🏆' : ARENA_ICON[t.arena]}</div>
            <div class="node-name">${t.name}</div>
            <div class="node-sub">${locked ? '' : FORMATS[tourFormat(t.id)].icon + ' '}Cấp ${t.tier} • ${t.size} đấu sĩ${champ ? ` • 🏆x${best.wins}` : ''}</div></div>`;
        }).join('')}
      </div>
      <div class="cards">
        <div class="card">
          <h3>🥊 Đấu tập <small>(còn ${d.sparLeft} lượt)</small></h3><p>Đấu Bo3 với đối thủ ngang sức để kiếm chút vàng và ĐHL. Thua đấu tập không mất hành trình. Vô địch một giải để nhận lại 2 lượt.</p>
          <button class="btn" ${d.sparLeft > 0 && !(tour && !tour.done) ? '' : 'disabled'} onclick="UI.sparring()">Tìm đối thủ</button>
        </div>
        <div class="card">
          <h3>💡 Mẹo HLV</h3><p>${pick(TIPS)}</p>
        </div>
      </div>`;
  },
  tourInfo(id) {
    const t = Tour.def(id), d = Career.d, A = ARENA_DEFS[t.arena];
    const active = d.tour && !d.tour.done;
    this.modal(`<h2>${ARENA_ICON[t.arena]} ${t.name}</h2>
      <p>${t.desc}</p>
      <p>${t.size} đấu sĩ • Cấp độ ${t.tier}</p>
      ${(() => { const F = FORMATS[tourFormat(id)]; return `<div class="banner">📜 Quy tắc đấu trường: ${F.icon} <b>${F.name}</b><br><small>${F.desc}${F.team ? ' Bạn ra sân cùng 2 đồng đội ở tab 👥 Đội hình.' : ''}</small></div>`; })()}
      <h3>🗺️ Sàn đấu theo vòng</h3>
      ${(t.arenas || [t.arena]).map((k, r) => `<div class="arena-feat">${ARENA_ICON[k]} <b>${Tour.roundName(r, t.size)}: ${ARENA_DEFS[k].name}</b><br>${ARENA_DEFS[k].feature}</div>`).join('')}
      <p>Phần thưởng vô địch: 💰 ~${fmt(150 * t.tier + 3 * (30 + 28 * t.tier))} • ⭐ ~${3 * t.tier + 3 * (1 + t.tier)} ĐHL</p>
      ${d.best[id] ? `<p>Thành tích tốt nhất: <b>${d.best[id].place || '-'}</b>${d.best[id].wins ? ` • Vô địch ${d.best[id].wins} lần (giải sẽ khó hơn)` : ''}</p>` : ''}
      <div class="actions">
        <button class="btn ghost" onclick="UI.closeModal()">Đóng</button>
        ${active ? `<button class="btn" disabled>Đang dự giải khác</button>` : `<button class="btn gold" onclick="if(confirm('Thua giải này sẽ KẾT THÚC hành trình. Đăng ký?')){UI.closeModal();Tour.start('${id}');UI.bracket()}">Đăng ký tham gia ▶</button>`}
      </div>`);
  },
  // đội hình 3 người cho các giải thể thức đội
  tabTeam() {
    const d = Career.d, f = d.fighter;
    if (!d.allies || d.allies.length < 2) { d.allies = defaultAllies(f.charId); Career.save(); }
    const lv = allyLevel(), row = (id, i) => { const c = ROSTER_BY_ID[id]; return `<div class="card"><h3>${WEAPONS[c.weapon].icon} ${esc(i === 0 ? f.name : c.name)} ${i === 0 ? '<small>⭐ học trò</small>' : `<small>Đồng đội ${i}</small>`}</h3><p>${esc(c.role || '')} • ${esc(c.group)}<br><small>${esc(c.style)}</small></p></div>`; };
    return `<p class="sub">👥 Giải thể thức đội (🌪️ Hỗn Chiến 3v3 • 🔁 Xa Luân Chiến • 🎯 Quyết Đấu) cần 3 đấu sĩ: học trò của bạn + 2 đồng đội. Đồng đội tự luyện theo lực chiến của học trò (≈ cấp ${lv.toFixed(1)}). Bấm 1 nhân vật bên dưới để đưa vào đội (thay người đồng đội cũ nhất).</p>
      <div class="cards">${[f.charId].concat(d.allies).map(row).join('')}</div>
      <h3>Chọn đồng đội</h3>${this.charCards(d.allies[1], 'UI.pickAlly')}`;
  },
  pickAlly(id) {
    const d = Career.d;
    if (id === d.fighter.charId) { this.toast('Đây là học trò của bạn rồi'); return; }
    if (d.allies.includes(id)) { this.toast('Đã có trong đội'); return; }
    d.allies = [d.allies[1], id]; Career.save(); this.hub('team');
  },
  tabTrain() {
    const d = Career.d, f = d.fighter;
    const row = (kind, key, def, lv, max, cost) => `
      <div class="up-row">
        <span class="up-ic">${def.icon}</span>
        <div class="up-info"><b>${def.name}</b> <small>${def.desc}</small>
          <div class="pips">${Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
        <span class="up-lv">Cấp ${lv}</span>
        <button class="btn sm ${d.tp >= cost && lv < max ? 'gold' : ''}" ${lv >= max || d.tp < cost ? 'disabled' : ''} onclick="UI.up('${kind}','${key}')">${lv >= max ? 'TỐI ĐA' : `+1 (⭐${cost})`}</button>
      </div>`;
    const w = WEAPONS[f.weapon];
    return `<div class="cols3">
      <div class="col"><h3>💪 Chỉ số thể chất</h3>
        ${Object.entries(STAT_DEFS).map(([k, def]) => row('stat', k, def, f.stats[k], def.max, Career.costStat(f.stats[k]))).join('')}</div>
      <div class="col"><h3>🧠 Kỹ thuật (trí tuệ AI)</h3>
        ${Object.entries(TECH_DEFS).map(([k, def]) => row('tech', k, def, f.tech[k], def.max, Career.costTech(f.tech[k]))).join('')}
        <p class="note">Kỹ thuật càng cao, đấu sĩ càng thông minh: phản ứng nhanh, né đòn, dồn đối thủ ra mép sàn và ngắm bắn đón đầu.</p>
        <h3>🧭 Tâm trí</h3>${this.mindRows(Career.cfg())}
        <p class="note">Không mua bằng ĐHL: 🤝 Tín Nhiệm tăng khi thắng, giảm khi thua • 🦉 Trí Tuệ tăng theo 🧠 Chiến thuật. Cả hai đều cộng thêm được bằng trang bị (loại "Tâm trí"). Gốc mỗi tướng khác nhau.</p></div>
      <div class="col"><h3>📜 Cấp kỹ năng</h3>
        ${SKILL_KEYS.map((k) => row('skill', k, { icon: `<span class="key ${k === 'U' ? 'ult' : ''}">${k === 'U' ? 'NỘ' : k}</span>`, name: w.skills[k].name, desc: '+8% điểm văng, -3% hồi chiêu mỗi cấp' }, f.skills[k], 10, Career.costSkill(f.skills[k]))).join('')}
        <p class="note">Cấp kỹ năng áp dụng cho mọi vũ khí (theo phím A/B/C/D/Nộ).</p></div>
    </div>`;
  },
  // Tín Nhiệm / Trí Tuệ thực tế (gồm trang bị đang mang)
  mind(cfg) {
    const mods = computeMods(cfg), b = mindBase(cfg.charId);
    return { trust: clamp((cfg.trust ?? b[0]) + mods.trust, 0, 100), wis: wisOf(cfg.charId, cfg.tech, mods.wis), b };
  },
  mindRows(cfg) {
    const M = this.mind(cfg), T = MIND_DEFS.trust, W = MIND_DEFS.wis;
    const obey = M.trust >= 80 ? 'làm ngay lập tức' : M.trust >= 60 ? 'nghe lời' : M.trust >= 40 ? 'hơi chần chừ' : 'hay chần chừ, có lúc phớt lờ';
    return `<div class="up-row"><span class="up-ic">${T.icon}</span><div class="up-info"><b>${T.name}</b> <small>${T.desc} — hiện: <b>${obey}</b> (gốc ${M.b[0]})</small>
        <div class="cmp"><i style="width:${M.trust}%" class="me"></i></div></div><span class="up-lv">${Math.round(M.trust)}/100</span></div>
      <div class="up-row"><span class="up-ic">${W.icon}</span><div class="up-info"><b>${W.name}</b> <small>${W.desc} (gốc ${M.b[1]})</small>
        <div class="cmp"><i style="width:${(M.wis / W.max) * 100}%" class="me"></i></div></div><span class="up-lv">${M.wis.toFixed(1)}/${W.max}</span></div>`;
  },
  up(kind, key) {
    if (!Career.upgrade(kind, key)) { this.toast('Không đủ Điểm Huấn Luyện'); return; }
    const n = Career.newTactics || [];
    if (n.length) this.toast(`🔓 Mở khóa chiến thuật: ${n.map((k) => TACTICS[k].icon + ' ' + TACTICS[k].name).join(', ')}`);
    this.hub('train');
  },
  tabShop() {
    const d = Career.d, f = d.fighter;
    return `<p class="sub">🎒 Mua bao nhiêu cũng được, nhưng mỗi ván chỉ <b>mang theo ${itemMax()} món</b> (đổi được trước trận và giữa các hiệp). Đang mang: <b>${f.equip.length}/${itemMax()}</b>${f.equip.length ? ' — ' + f.equip.map((id) => ITEM_BY_ID[id].icon + ' ' + ITEM_BY_ID[id].name).join(' • ') : ''}. Trang bị kích hoạt sinh ra <b>lệnh dùng trang bị</b> trong bể mệnh lệnh.</p>
      <div class="shop">${[1, 2, 3].map((tier) => {
      const open = Career.tierOpen(tier);
      return `<div class="col"><h3>${EQUIP_SLOTS[tier]}${open ? '' : ` <small>🔒 ${tier === 2 ? 'vô địch giải đầu tiên' : 'vô địch giải thứ 3'}</small>`}</h3>
        ${ITEMS.filter((e) => e.tier === tier).map((e) => this.itemCard(e, f, open)).join('')}
      </div>`;
    }).join('')}</div>`;
  },
  itemCard(e, f, open) {
    const own = f.owned.includes(e.id), on = f.equip.includes(e.id), d = Career.d, broken = (f.broken || []).includes(e.id), rc = broken ? Career.repairCost(e.id) : 0;
    return `<div class="item ${on ? 'on' : ''} ${open ? '' : 'locked'}">
      <span class="it-ic">${e.icon}</span>
      <div class="it-info"><b>${e.name}</b> <em class="it-kind">${e.kind}</em>${broken ? ' <em class="it-kind" style="color:#ff7a7a">💔 Đã vỡ</em>' : ''}<small>${esc(e.desc)}</small></div>
      ${broken ? `<button class="btn sm" ${d.gold < rc ? 'disabled' : ''} onclick="UI.repair('${e.id}')">🔧 Sửa 💰${fmt(rc)}</button>`
            : own ? `<button class="btn sm ${on ? 'gold' : 'ghost'}" onclick="UI.equipItem('${e.id}','shop')">${on ? '✔ Mang theo' : 'Mang theo'}</button>`
            : `<button class="btn sm" ${!open || d.gold < e.price ? 'disabled' : ''} onclick="UI.buy('${e.id}')">💰 ${fmt(e.price)}</button>`}
    </div>`;
  },
  repair(id) { if (Career.repair(id)) { this.toast('🔧 Đã sửa xong — đang mang theo nếu còn chỗ'); this.hub('shop'); } else this.toast('Không đủ vàng'); },
  equipItem(id, back) {
    const r = Career.equip(id);
    if (r === 'full') this.toast(`Chỉ mang tối đa ${itemMax()} trang bị — cất bớt một món`);
    if (r === 'broken') this.toast('💔 Trang bị đã vỡ — sửa ở tab 🛒 Trang bị');
    if (back === 'shop') this.hub('shop');
    else if (back === 'pre') { if ($('#spells')) $('#spells').innerHTML = this.spellPicker(Career.d.spells.slice(0, spellSlots({ equip: Career.f.equip })), 'UI.preSpell'); $('#items').innerHTML = this.itemPicker(Career.f.owned, Career.f.equip, 'UI.preItem'); $('#cmds').innerHTML = this.cmdBtns(Career.f.charId, Career.d.cmds, 'UI.preCmd'); }
  },
  preItem(id) { this.equipItem(id, 'pre'); },
  // ô chọn trang bị mang theo (trước trận / giữa hiệp)
  itemPicker(owned, sel, fn) {
    if (!owned.length) return '<p class="note">Chưa có trang bị nào — mua ở tab 🛒 Trang bị.</p>';
    return owned.map((id) => { const e = ITEM_BY_ID[id], br = Career.d && (Career.f.broken || []).includes(id); return `<button class="tac itm ${sel.includes(id) ? 'on' : ''}" ${br ? 'style="opacity:.45"' : ''} onclick="${fn}('${id}')" title="${esc(e.desc)}"><span>${e.icon}</span><b>${e.name}</b><small>${br ? '💔 Đã vỡ' : e.kind}</small></button>`; }).join('');
  },
  buy(id) { if (Career.buy(id)) { this.toast(Career.f.equip.includes(id) ? 'Đã mua & mang theo!' : `Đã mua! (đang mang đủ ${itemMax()} món)`); this.hub('shop'); } else this.toast('Không đủ vàng'); },
  tabTalent() {
    const f = Career.f;
    const next = TALENT_TIERS.find((t) => t > f.level);
    return `<p class="sub">Cấp hiện tại: <b>Lv${f.level}</b> — mỗi trận thắng trong giải lên 1 cấp (+2 ĐHL). ${next ? `Mốc nội tại kế tiếp: <b>Lv${next}</b>.` : 'Đã mở đủ 5 mốc nội tại.'}</p>
      ${this.talentTree(f.charId, f.talents, null, f.level)}`;
  },
  tabWeapon() {
    const f = Career.f, d = Career.d, pool = tacticPool(f.charId);
    return `<div class="cols2">
      <div class="col">${this.charDetail(f.charId).split('<div class="wdetail"')[0]}
        <h3>📣 Mệnh lệnh mang theo <small>(${d.cmds.length}/${CMD_MAX} — đổi được trước mỗi ván)</small></h3>
        <div class="cmds" id="cmds">${this.cmdBtns(f.charId, d.cmds, 'UI.hubCmd')}</div>
        <h3>📋 Chiến thuật <small>(dùng chung — mang theo ${d.loadout.length}/${LOADOUT_MAX})</small></h3>
        <div class="tactics">${pool.map((k) => {
          const t = TACTICS[k], open = Career.isUnlocked(k), inL = d.loadout.includes(k);
          return `<button class="tac ${inL ? 'on' : ''} ${open ? '' : 'locked'}" onclick="${open ? `UI.toggleTac('${k}')` : `UI.toast('🔒 Cần 🧠 Chiến thuật cấp ${t.need}')`}">
            <span>${open ? t.icon : '🔒'}</span><b>${t.name}</b><small>${t.desc}</small>
            <em>${open ? (inL ? '✔ Mang theo' : 'Bấm để mang theo') : `🔒 Cần 🧠 Chiến thuật cấp ${t.need}`}</em></button>`;
        }).join('')}</div>
        <p class="note">Bấm để thêm/bỏ chiến thuật khỏi hành trang (tối đa ${LOADOUT_MAX}). Trước mỗi ván bạn chọn 1 trong số đã mang theo. Chiến thuật 🔒 tự mở khi nâng 🧠 Chiến thuật (Tư duy) đủ cấp ở tab Huấn luyện (hiện: cấp ${f.tech.tactic}).</p>
      </div>
      <div class="col">${this.weaponDetail(f.weapon)}</div>
    </div>`;
  },
  hubCmd(id) { this.cmdToast(Career.toggleCmd(id)); this.hub('weapon'); },
  toggleTac(k) {
    const r = Career.toggleLoadout(k);
    if (r === 'full') this.toast(`Chỉ mang theo tối đa ${LOADOUT_MAX} chiến thuật`);
    if (r === 'min') this.toast('Phải mang theo ít nhất 1 chiến thuật');
    this.hub('weapon');
  },
  // nút chọn chiến thuật (chỉ trong số mang theo)
  tacticBtns(sel, fn, list) {
    return (list || Career.d.loadout).map((k) => { const t = TACTICS[k]; return `<button class="tac ${k === sel ? 'on' : ''}" onclick="${fn}('${k}')"><span>${t.icon}</span><b>${t.name}</b><small>${t.desc}</small></button>`; }).join('');
  },
  // ---------- KẾT THÚC HÀNH TRÌNH ----------
  runOver() {
    this.cur = 'runover';
    startDemo();
    Sound.music('menu');
    $('#match-ui').classList.add('hidden');
    const d = Career.d, f = d.fighter;
    this.render(`
      <div class="panel result ${d.runWon ? 'won' : 'lost'}">
        <h1>${d.runWon ? '👑 CHINH PHỤC! KẺ MẠNH NHẤT THIÊN HẠ' : '💀 HẾT HÀNH TRÌNH'}</h1>
        <p>${esc(f.name)} • Lv${f.level} • ${d.trophies.length} cúp • Thắng/Thua ${d.record.w}-${d.record.l}</p>
        <p class="note">Nội tại: ${Object.values(f.talents).map((id) => TALENT_BY_ID[id].name).join(' • ') || '—'}</p>
        <div class="actions">
          <button class="btn ghost" onclick="UI.menu()">☰ Menu</button>
          <button class="btn gold big" onclick="UI.newCareer()">🧭 Bắt đầu hành trình mới ▶</button>
        </div>
      </div>`, 'center');
  },
  tabTrophy() {
    const d = Career.d;
    return `<div class="cols2">
      <div class="col"><h3>🏆 Tủ cúp (${d.trophies.length})</h3>
        <div class="trophies">${d.trophies.length ? d.trophies.map((t) => `<div class="trophy">🏆<small>${t.name}</small></div>`).join('') : '<p class="note">Chưa có cúp nào. Hãy vô địch giải đầu tiên!</p>'}</div>
        ${d.best.t6 && d.best.t6.wins ? '<div class="banner gold">👑 Học trò của bạn là KẺ MẠNH NHẤT THIÊN HẠ!</div>' : ''}
      </div>
      <div class="col"><h3>📊 Thống kê</h3>
        <p>Trận thắng/thua: <b>${d.record.w} - ${d.record.l}</b></p>
        <p>Ván thắng/thua: <b>${d.record.gw} - ${d.record.gl}</b></p>
        <p>Tổng KO: <b>${d.record.kos}</b></p>
        <h3>📜 Lịch sử giải</h3>
        ${d.history.map((h) => `<p>${h.name}: <b>${h.place}</b></p>`).join('') || '<p class="note">Chưa tham gia giải nào.</p>'}
        <button class="btn sm ghost danger" onclick="if(confirm('Xoá toàn bộ dữ liệu?')){Career.wipe();UI.menu()}">Xoá dữ liệu</button>
      </div></div>`;
  },

  // ---------- NHÁNH ĐẤU ----------
  bracket() {
    this.cur = 'bracket';
    Sound.music('tour');
    startDemo();
    $('#match-ui').classList.add('hidden');
    const t = Career.d.tour, T = Tour.def(t.id);
    const nR = Math.log2(T.size);
    const cols = [];
    for (let r = 0; r < nR; r++) {
      const ms = t.rounds[r] || Array.from({ length: T.size / 2 ** (r + 1) }, () => null);
      cols.push(`<div class="bcol"><div class="bhead">${Tour.roundName(r, T.size)}</div>${ms.map((m) => {
        if (!m) return `<div class="bm"><div class="bp tbd">?</div><div class="bp tbd">?</div></div>`;
        const pa = t.players[m.a], pb = t.players[m.b];
        const pl = (p, i) => `<div class="bp ${p.me ? 'me' : ''} ${m.w === i ? 'win' : m.w !== null ? 'lose' : ''}"><span style="color:${p.color}">${WEAPONS[p.weapon].icon}</span> ${esc(p.name)}${p.boss ? ' 👑' : ''}<small>${p.rating}</small></div>`;
        return `<div class="bm">${pl(pa, m.a)}${pl(pb, m.b)}</div>`;
      }).join('')}</div>`);
    }
    const champ = t.done && t.result.place === 'VÔ ĐỊCH';
    const opp = Tour.opponent();
    this.render(`
      <div class="panel wide">
        <h1>${ARENA_ICON[T.arena]} ${T.name}</h1>
        <p class="sub">Sàn vòng này: ${ARENA_ICON[Tour.curArena()]} ${ARENA_DEFS[Tour.curArena()].name} • Đã nhận: 💰${fmt(t.earned.gold)} ⭐${t.earned.tp}</p>
        <div class="bracket">${cols.join('')}${champ ? `<div class="bcol"><div class="bhead">Vô địch</div><div class="bm champ">🏆 ${esc(Career.f.name)}</div></div>` : ''}</div>
        ${t.done ? `<div class="banner ${champ ? 'gold' : 'red'}">${champ ? `🏆 VÔ ĐỊCH ${T.name.toUpperCase()}!` : `💀 Bị loại ở ${t.result.place} — hành trình kết thúc.`}</div>` : ''}
        <div class="actions">
          ${t.done ? (Career.d.runOver ? `<button class="btn gold big" onclick="UI.runOver()">Tổng kết hành trình ▶</button>` : `<button class="btn gold big" onclick="Tour.leave();UI.hub('map')">Về bản đồ ▶</button>`)
                   : `<button class="btn ghost" onclick="UI.hub('train')">🏋️ Huấn luyện trước</button>
                      <button class="btn ghost danger" onclick="if(confirm('Bỏ giải sẽ bị xử thua và KẾT THÚC hành trình. Chắc chứ?')){Tour.report(false);UI.bracket()}">Bỏ giải</button>
                      <button class="btn gold big" onclick="UI.prematch()">⚔️ Trận kế: ${esc(opp.name)} ▶</button>`}
        </div>
      </div>`);
  },

  // ---------- TRƯỚC TRẬN ----------
  prematch(opts) {
    this.cur = 'pre';
    const spar = opts && opts.spar;
    const T = spar ? null : Tour.def(Career.d.tour.id);
    const opp = spar ? opts.opp : Tour.opponent();
    const cfg = opp.cfg, me = Career.cfg(), w = WEAPONS[cfg.weapon];
    const L = Career.d.loadout;
    this._pre = { spar, opp, arena: spar ? opts.arena : Tour.curArena(), boss: !spar && !!opp.boss, final: !spar && Career.d.tour.rounds[Career.d.tour.round].length === 1, tactic: L.includes(Career.d.tactic) ? Career.d.tactic : L[0], berserk: spar ? null : Tour.berserkFlags() };
    // giải theo thể thức đội: bốc dãy luật cho loạt này (công khai trước trận)
    const fmt = spar ? 'solo' : (Career.d.tour.fmt || 'solo');
    this._pre.rules = rollRules(fmt); this._pre.fmt = fmt;
    if (fmt !== 'solo') { this._pre.teamMe = myTeam(); this._pre.teamOpp = opp.team || oppTeam(cfg, opp.lv || 3); }
    const bar = (a, b, mx) => `<div class="cmp"><i style="width:${(a / mx) * 100}%" class="me"></i><i style="width:${(b / mx) * 100}%" class="op"></i></div>`;
    this.render(`
      <div class="panel wide">
        <h1>⚔️ ${spar ? 'Đấu tập' : `${T.name} — ${Tour.roundName(Career.d.tour.round, T.size)}`}</h1>
        <p class="sub">Sàn: ${ARENA_ICON[this._pre.arena]} ${ARENA_DEFS[this._pre.arena].name} • Thể thức Bo3 (thắng 2 ván) • 2 mạng mỗi ván</p>
        <div class="arena-feat">${ARENA_DEFS[this._pre.arena].feature}</div>
        ${this._pre.fmt !== 'solo' ? `<div class="banner">${FORMATS[this._pre.fmt].icon} <b>${FORMATS[this._pre.fmt].name}</b> — Bo${this._pre.rules.length} (thắng ${Math.ceil(this._pre.rules.length / 2)} ván)<div class="rules-row">${rulesLabel(this._pre.rules)}</div><small>👥 Đội bạn: ${this._pre.teamMe.map((c) => WEAPONS[c.weapon].icon + ' ' + esc(c.name)).join(' • ')} &nbsp;|&nbsp; Đội đối thủ: ${this._pre.teamOpp.map((c) => WEAPONS[c.weapon].icon + ' ' + esc(c.name)).join(' • ')}</small></div>` : ''}
        <div class="vs">
          <div class="vs-card me"><div class="vs-ic" style="background:${Career.f.color}">${WEAPONS[me.weapon].icon}</div><b>${esc(me.name)}</b><small>${WEAPONS[me.weapon].name}</small><div class="rate">⚡ ${ratingOf(me)}</div></div>
          <div class="vs-mid">VS</div>
          <div class="vs-card op"><div class="vs-ic" style="background:${cfg.color}">${w.icon}</div><b>${esc(cfg.name)}</b><small>${w.name}</small><div class="rate">⚡ ${ratingOf(cfg)}</div></div>
        </div>
        <div class="scout">
          <h3>🔍 Báo cáo trinh sát</h3>
          ${Object.entries(STAT_DEFS).map(([k, d]) => `<div class="sc-row"><span>${d.icon} ${d.name}</span>${bar(me.stats[k], cfg.stats[k], 20)}<small>${me.stats[k]} / ${cfg.stats[k]}</small></div>`).join('')}
          ${Object.entries(TECH_DEFS).map(([k, d]) => `<div class="sc-row"><span>${d.icon} ${d.name}</span>${bar(me.tech[k], cfg.tech[k], 10)}<small>${me.tech[k]} / ${cfg.tech[k]}</small></div>`).join('')}
          ${(() => { const a = this.mind(me), b = this.mind(cfg); return `<div class="sc-row"><span>🤝 Tín Nhiệm</span>${bar(a.trust, b.trust, 100)}<small>${Math.round(a.trust)} / ${Math.round(b.trust)}</small></div><div class="sc-row"><span>🦉 Trí Tuệ</span>${bar(a.wis, b.wis, 12)}<small>${a.wis.toFixed(1)} / ${b.wis.toFixed(1)}</small></div>`; })()}
          <p class="note">Nội tại đối thủ — <b>${w.passive.name}</b>: ${esc(w.passive.desc.split('\n')[0])}</p>
          <p class="note">🧬 Đối thủ Lv${cfg.level || 1}: ${(cfg.talents || []).map((id) => `<b title="${esc(TALENT_BY_ID[id].desc)}">${esc(TALENT_BY_ID[id].name)}</b>`).join(' • ') || 'chưa có nội tại'} &nbsp;|&nbsp; Của bạn (Lv${Career.f.level}): ${Object.values(Career.f.talents).map((id) => esc(TALENT_BY_ID[id].name)).join(' • ') || '—'}</p>
          <p class="note">🎒 Trang bị đối thủ: ${Object.values(cfg.equip || {}).map((id) => ITEM_BY_ID[id] ? `<b title="${esc(ITEM_BY_ID[id].desc)}">${ITEM_BY_ID[id].icon} ${ITEM_BY_ID[id].name}</b>` : '').join(' • ') || 'không có'}</p>
          ${ROSTER_BY_ID[cfg.charId] ? `<p class="note">🧠 Lối đánh: <b>${ROSTER_BY_ID[cfg.charId].style}</b> — ${esc(ROSTER_BY_ID[cfg.charId].bio)}</p>` : ''}
        </div>
        ${isFamilyPair(me.weapon, cfg.weapon) ? `<div class="banner">👪 Hai bên là người một nhà — không ai ra tay, trận này HÒA. ${spar ? '' : 'Ban tổ chức sẽ bốc thăm người đi tiếp.'}</div>` : ''}
        ${this._pre.berserk && this._pre.berserk.me ? '<div class="banner red">🔴 Đối thủ là kẻ đã hạ Aria! Koda sẽ HÓA ĐIÊN ngay từ đầu — HLV không thể ra lệnh.</div>' : ''}
        ${this._pre.berserk && this._pre.berserk.opp ? '<div class="banner red">🔴 Học trò của bạn đã hạ Aria — Koda sẽ HÓA ĐIÊN truy sát!</div>' : ''}
        <h3>📋 Chiến thuật ván 1</h3>
        <div class="tactics" id="tacs">${this.tacticBtns(this._pre.tactic, 'UI.preTactic')}</div>
        <h3>🎒 Trang bị mang theo <small>(${Career.f.equip.length}/${itemMax()} — đổi được giữa các hiệp)</small></h3>
        <div class="tactics" id="items">${this.itemPicker(Career.f.owned, Career.f.equip, 'UI.preItem')}</div>
        <h3>📣 Mệnh lệnh mang theo <small>(tối đa ${CMD_MAX} — bấm để chọn)</small></h3>
        <div class="cmds" id="cmds">${this.cmdBtns(Career.f.charId, Career.d.cmds, 'UI.preCmd')}</div>
        <h3>✨ Phép bổ trợ <small>(mang ${spellSlots({ equip: Career.f.equip })} — 🔮 Bùa Song Phép cho mang 2 • đổi được giữa các hiệp)</small></h3>
        <div class="cmds" id="spells">${this.spellPicker(Career.d.spells, 'UI.preSpell')}</div>
        <div class="actions">
          <button class="btn ghost" onclick="${spar ? "UI.hub('map')" : 'UI.bracket()'}">← Quay lại</button>
          <button class="btn gold big" onclick="UI.beginSeries()">VÀO TRẬN ▶</button>
        </div>
      </div>`);
  },
  preTactic(id) { this._pre.tactic = id; Career.d.tactic = id; Career.save(); $('#tacs').innerHTML = this.tacticBtns(id, 'UI.preTactic'); },
  preCmd(id) { this.cmdToast(Career.toggleCmd(id)); $('#cmds').innerHTML = this.cmdBtns(Career.f.charId, Career.d.cmds, 'UI.preCmd'); },
  cmdToast(r) { if (r === 'full') this.toast(`Chỉ mang tối đa ${CMD_MAX} mệnh lệnh`); if (r === 'min') this.toast('Phải mang ít nhất 1 mệnh lệnh'); },
  // nút mệnh lệnh: toàn bộ bể lệnh của nhân vật, nút sáng = đang mang theo
  cmdBtns(charId, sel, fn, items) {
    return commandPool(charId, items || (Career.d && Career.f.charId === charId ? Career.f.equip : [])).map((id) => { const C = COMMANDS[id]; return `<button class="tac cmd ${sel.includes(id) ? 'on' : ''} ${C.basic ? '' : 'own'}" onclick="${fn}('${id}')"><span>${C.icon}</span><b>${C.name}</b><small>${C.desc}</small>${C.basic ? '' : C.combo ? '<em>⚡ Combo</em>' : C.corner ? '<em>📐 Kẹp góc</em>' : C.item ? '<em>🎒 Trang bị</em>' : '<em>Lệnh riêng</em>'}</button>`; }).join('');
  },
  sparring() {
    if (Career.d.sparLeft <= 0) { this.toast('Hết lượt đấu tập — vô địch một giải để nhận thêm'); return; }
    const lv = Math.max(0, (ratingOf(Career.cfg()) - 100) / 3 / 9);
    const cfg = genOpponent(lv, { charId: pick(ROSTER.filter((c) => c.id !== Career.f.charId)).id });
    const arena = pick(TOURNAMENTS.slice(0, Career.d.unlocked).flatMap((t) => t.arenas || [t.arena]));
    this.prematch({ spar: true, opp: { cfg, name: cfg.name }, arena });
  },
  beginSeries() {
    const p = this._pre;
    if (p.spar) { Career.d.sparLeft--; Career.save(); }
    Series.start({
      me: Career.cfg(), opp: p.opp.cfg, arena: p.arena, tactic: p.tactic, loadout: Career.d.loadout.slice(), cmds: Career.d.cmds, pickMods: true,
      title: p.spar ? "Đấu tập" : Tour.def(Career.d.tour.id).name, berserk: p.berserk, boss: p.boss, final: p.final,
      rules: p.rules, teamMe: p.teamMe, teamOpp: p.teamOpp,
      onDone: (won, s) => this.seriesDone(won, s),
    });
  },
  seriesDone(won, s) {
    const d = Career.d;
    const draw = won === null;
    d.record.gw += s.wins[0]; d.record.gl += s.wins[1]; d.record.kos += s.kos;
    let rew, lucky = null;
    if (this._pre.spar) {
      rew = draw ? { gold: 15, tp: 0 } : won ? { gold: 25 + Math.round(ratingOf(Career.cfg()) / 10), tp: 1 } : { gold: 10, tp: 0 };
      d.gold += rew.gold; d.tp += rew.tp;
      if (!draw) won ? d.record.w++ : d.record.l++;
      if (!draw) rew.trust = Career.addTrust(trustDelta(Career.f.charId, won));
      if (won && Career.f.charId === 'joker') rew.gold = Math.round(rew.gold * (Career.hasTal('joker_1c') ? 1.6 : 1.35));
      Career.save();
    } else if (draw) {
      lucky = Math.random() < 0.5;
      rew = Tour.report(lucky, true);
    } else rew = Tour.report(won);
    $('#match-ui').classList.add('hidden');
    const cls = draw ? '' : won ? 'won' : 'lost';
    if (won) Sound.play('applause');
    this.render(`
      <div class="panel result ${cls}">
        <h1>${draw ? '🤝 HÒA — NGƯỜI MỘT NHÀ' : won ? '🏅 CHIẾN THẮNG!' : '💀 THẤT BẠI'}</h1>
        <div class="score">${s.wins[0]} - ${s.wins[1]}</div>
        <p>${esc(s.me)} vs ${esc(s.opp)}</p>
        ${lucky !== null ? `<div class="banner">🎲 Bốc thăm: ${lucky ? `<b>${esc(s.me)}</b> được đi tiếp!` : `<b>${esc(s.opp)}</b> đi tiếp.`}</div>` : ''}
        <div class="rew">💰 +${fmt(rew.gold)} &nbsp; ⭐ +${rew.tp} ĐHL${rew.trust ? ` &nbsp; 🤝 ${rew.trust > 0 ? '+' : ''}${rew.trust} Tín Nhiệm` : ''}</div>
        ${rew.levels ? `<div class="banner">⬆️ LÊN CẤP! ${esc(s.me)} đạt <b>Lv${Career.f.level}</b> (+2 ĐHL)${Career.nextTier() ? ' — mở mốc nội tại mới ✨' : ''}</div>` : ''}
        ${rew.champion ? '<div class="banner gold">🏆 VÔ ĐỊCH GIẢI ĐẤU!</div>' : ''}
        ${rew.runOver ? `<div class="banner red">💀 Bị loại — HÀNH TRÌNH KẾT THÚC.</div>` : ''}
        ${rew.runWon ? `<div class="banner gold">👑 CHINH PHỤC HÀNH TRÌNH!</div>` : ''}
        <div class="actions">${this._pre.spar ? `<button class="btn gold big" onclick="UI.hub('map')">Về trung tâm ▶</button>`
          : rew.runOver || rew.runWon ? `<button class="btn gold big" onclick="UI.runOver()">Tổng kết hành trình ▶</button>`
          : Career.nextTier() ? `<button class="btn gold big" onclick="UI.talentPick(()=>UI.bracket())">✨ Chọn nội tại mới ▶</button>`
          : `<button class="btn gold big" onclick="UI.bracket()">Xem nhánh đấu ▶</button>`}</div>
      </div>`, 'center');
  },

  // ---------- GIỮA HIỆP ----------
  between(s, r) {
    $('#match-ui').classList.add('hidden');
    const won = r.winner === 0;
    this.render(`
      <div class="panel result ${won ? 'won' : 'lost'}">
        <h2>Ván ${s.game} — ${won ? 'THẮNG' : 'THUA'}</h2>
        <div class="score">${s.wins[0]} - ${s.wins[1]}</div>
        ${s.teamMode && s.rules[s.game] ? `<div class="rules-row">${rulesLabel(s.rules)}</div><p class="note">⏭️ Ván tiếp theo: <b>${RULES[s.rules[s.game]].icon} ${RULES[s.rules[s.game]].name}</b> — ${RULES[s.rules[s.game]].desc}</p>` : ""}
        <div class="gstats">
          <div><b>${esc(s.me)}</b><p>Gây ${Math.round(r.a.dealt)}% • Trúng ${r.a.hits} đòn • KO ${r.a.kos}</p></div>
          <div><b>${esc(s.opp)}</b><p>Gây ${Math.round(r.b.dealt)}% • Trúng ${r.b.hits} đòn • KO ${r.b.kos}</p></div>
        </div>
        <p class="note">💬 Trợ lý: ${this.advice(s, r)}</p>
        <h3>📋 Chiến thuật ván ${s.game + 1}</h3>
        <div class="tactics" id="tacs">${this.tacticBtns(s.tactic, 'UI.betweenTactic', s.loadout)}</div>
        ${s.exhibition ? '' : `<h3>🎒 Trang bị ván ${s.game + 1} <small>(tối đa ${itemMax()})</small></h3><div class="tactics" id="items">${this.itemPicker(Career.f.owned, s.meCfg.equip, 'UI.betweenItem')}</div>`}
        <h3>📣 Mệnh lệnh ván ${s.game + 1} <small>(tối đa ${CMD_MAX})</small></h3>
        <div class="cmds" id="cmds">${this.cmdBtns(s.meCfg.charId, s.cmds, 'UI.betweenCmd', s.meCfg.equip)}</div>
        ${s.exhibition ? '' : `<h3>✨ Phép bổ trợ ván ${s.game + 1} <small>(mang ${spellSlots(s.meCfg)})</small></h3><div class="cmds" id="spells">${this.spellPicker(s.meCfg.spells || [], 'UI.betweenSpell')}</div>`}
        <div class="actions"><button class="btn gold big" onclick="UI.closeBetween()">Ván tiếp theo ▶</button></div>
      </div>`, 'center');
  },
  betweenTactic(id) { G.series.tactic = id; $('#tacs').innerHTML = this.tacticBtns(id, 'UI.betweenTactic', G.series.loadout); },
  betweenCmd(id) {
    const s = G.series;
    if (!s.exhibition && Career.d) { this.cmdToast(Career.toggleCmd(id)); s.cmds = Career.d.cmds; }
    else if (s.cmds.includes(id)) { if (s.cmds.length > 1) s.cmds = s.cmds.filter((k) => k !== id); }
    else if (s.cmds.length < CMD_MAX) s.cmds.push(id); else this.cmdToast('full');
    $('#cmds').innerHTML = this.cmdBtns(s.meCfg.charId, s.cmds, 'UI.betweenCmd', s.meCfg.equip);
  },
  // ô chọn phép bổ trợ (trước trận / giữa hiệp)
  spellPicker(sel, fn) {
    return SPELL_IDS.map((id) => { const S = SPELLS[id]; return `<button class="tac cmd ${sel.includes(id) ? 'on' : ''}" onclick="${fn}('${id}')"><span>${S.icon}</span><b>${S.name}</b><small>${S.desc} • hồi ${S.cd}s</small></button>`; }).join('');
  },
  preSpell(id) { Career.toggleSpell(id); $('#spells').innerHTML = this.spellPicker(Career.d.spells, 'UI.preSpell'); },
  betweenSpell(id) {
    const s = G.series;
    Career.toggleSpell(id); s.meCfg.spells = Career.d.spells.slice(0, spellSlots(s.meCfg));
    $('#spells').innerHTML = this.spellPicker(s.meCfg.spells, 'UI.betweenSpell');
  },
  betweenItem(id) {
    const s = G.series, r = Career.equip(id);
    if (r === 'full') this.toast(`Chỉ mang tối đa ${itemMax()} trang bị`);
    if (r === 'broken') this.toast('💔 Trang bị đã vỡ — sửa ở tab 🛒 Trang bị');
    s.meCfg.equip = Career.f.equip.slice(); s.cmds = Career.d.cmds.slice();
    s.meCfg.spells = Career.d.spells.slice(0, spellSlots(s.meCfg)); if ($('#spells')) $('#spells').innerHTML = this.spellPicker(s.meCfg.spells, 'UI.betweenSpell');
    $('#items').innerHTML = this.itemPicker(Career.f.owned, s.meCfg.equip, 'UI.betweenItem');
    $('#cmds').innerHTML = this.cmdBtns(s.meCfg.charId, s.cmds, 'UI.betweenCmd', s.meCfg.equip);
  },
  closeBetween() { this.render('', ''); Series.nextGame(); },
  // ---------- CHỌN BIẾN ĐỔI SÂN ĐẤU (trước mỗi ván) ----------
  modPick(s) {
    this.cur = 'mods';
    $('#match-ui').classList.add('hidden');
    const A = ARENA_DEFS[s.arena];
    this.render(`
      <div class="panel wide">
        <h1>🎴 Ván ${s.game} — Biến đổi sân đấu</h1>
        <p class="sub">${ARENA_ICON[s.arena]} ${A.name} • Hai HLV mỗi người chọn 1 trong 3 biến đổi. Cả hai lựa chọn đều có hiệu lực trong ván này — HLV đối thủ cũng đang tính toán!</p>
        <div class="arena-feat">${A.feature}</div>
        <div class="mods">${s.offer.map((id) => { const M = ARENA_MODS[id]; return `<button class="mod" onclick="UI.chooseMod('${id}')"><span>${M.icon}</span><b>${M.name}</b><small>${M.desc}</small></button>`; }).join('')}</div>
        <p class="note">💡 Đấu sĩ của bạn: ${WEAPONS[s.meCfg.weapon].name} (${isRanged(s.meCfg) ? 'tầm xa' : 'cận chiến'}, nặng ${WEAPONS[s.meCfg.weapon].weight}) • Đối thủ: ${WEAPONS[s.oppCfg.weapon].name} (${isRanged(s.oppCfg) ? 'tầm xa' : 'cận chiến'}, nặng ${WEAPONS[s.oppCfg.weapon].weight}).</p>
      </div>`);
  },
  chooseMod(id) {
    const s = G.series, ai = s.oppMod;
    s.mods = id === ai ? [id] : [id, ai];
    s.modTags = id === ai ? { [id]: 'cả hai' } : { [id]: 'bạn', [ai]: 'đối thủ' };
    this.toast(`HLV đối thủ chọn: ${ARENA_MODS[ai].icon} ${ARENA_MODS[ai].name}${id === ai ? ' — trùng lựa chọn!' : ''}`);
    Series.launch();
  },
  advice(s, r) {
    const ow = WEAPONS[s.oppCfg.weapon];
    if (r.winner === 0) return 'Làm tốt lắm! Giữ vững nhịp độ.';
    if (ow.ai.ranged) return `Đối thủ dùng ${ow.name} tầm xa — chiến thuật "Tấn công" giúp áp sát nhanh hơn.`;
    if (r.a.kos === 0 && r.b.kos > 0) return 'Chúng ta bị đẩy ra mép quá nhiều. Thử "Phòng thủ" để giữ giữa sân.';
    if (ow.weight >= 1.25) return `${ow.name} rất nặng — "Thả diều" để tránh những đòn uy lực.`;
    return pick(['Đọc đòn kỹ hơn, đừng vội lao vào.', 'Thử thay đổi nhịp độ để bất ngờ đối thủ.', 'Hãy ra lệnh "Tung Nộ!" khi đối thủ đang ở điểm văng cao.']);
  },

  // ---------- ĐẤU THỬ ----------
  exhibition() {
    this.cur = 'exh';
    this._ex = this._ex || { a: 'valerius', b: 'ryoma', lv: 4, arena: 'go' };
    const e = this._ex;
    this.render(`
      <div class="panel wide">
        <h1>🎮 Đấu thử — xem AI đối đầu</h1>
        <div class="cols2 small-cards">
          <div class="col"><h3 style="color:#9fd3ff">Đội Xanh: ${esc(ROSTER_BY_ID[e.a].name)}</h3>${this.charCards(e.a, "UI.exPick.bind(UI,'a')")}</div>
          <div class="col"><h3 style="color:#ffb0b0">Đội Đỏ: ${esc(ROSTER_BY_ID[e.b].name)}</h3>${this.charCards(e.b, "UI.exPick.bind(UI,'b')")}</div>
        </div>
        <h3>🏟️ Thể thức</h3>
        <div class="tactics">${Object.entries(FORMATS).map(([k, F]) => `<button class="tac ${(e.fmt || 'solo') === k ? 'on' : ''}" onclick="UI._ex.fmt='${k}';UI.exhibition()"><span>${F.icon}</span><b>${F.name}</b><small>${F.desc}</small></button>`).join('')}</div>
        ${(e.fmt || 'solo') !== 'solo' ? (() => { const ta = e.ta || (e.ta = defaultAllies(e.a)), tb = e.tb || (e.tb = defaultAllies(e.b)); const nm = (id) => `${WEAPONS[ROSTER_BY_ID[id].weapon].icon} ${esc(ROSTER_BY_ID[id].name)}`;
          return `<p class="note">👥 Đội Xanh: <b>${nm(e.a)}</b> + ${ta.map(nm).join(' + ')} &nbsp;|&nbsp; Đội Đỏ: <b>${nm(e.b)}</b> + ${tb.map(nm).join(' + ')} <button class="btn sm ghost" onclick="UI.exReroll()">🎲 Đổi đồng đội</button></p>`; })() : ''}
        <div class="row2">
          <label>Cấp độ hai bên: <b id="exlv">${e.lv}</b><input type="range" min="0" max="16" value="${e.lv}" oninput="UI._ex.lv=+this.value;$('#exlv').textContent=this.value"></label>
          <label>Sàn đấu <select onchange="UI._ex.arena=this.value">${Object.entries(ARENA_DEFS).map(([k, a]) => `<option value="${k}" ${k === e.arena ? 'selected' : ''}>${a.name}</option>`).join('')}</select></label>
        </div>
        <div class="actions">
          <button class="btn ghost" onclick="UI.menu()">← Quay lại</button>
          <button class="btn ghost" onclick="UI._ex.a=pick(ROSTER).id;UI._ex.b=pick(ROSTER).id;UI.exhibition()">🎲 Ngẫu nhiên</button>
          <button class="btn gold big" onclick="UI.startExhibition()">Bắt đầu ▶</button>
        </div>
      </div>`);
  },
  exPick(side, id) { this._ex[side] = id; this._ex.ta = this._ex.tb = null; this.exhibition(); },
  exReroll() { const e = this._ex, r = (me) => shuffle(ROSTER.filter((c) => c.id !== me)).slice(0, 2).map((c) => c.id); e.ta = r(e.a); e.tb = r(e.b); this.exhibition(); },
  startExhibition() {
    const e = this._ex;
    const a = genOpponent(e.lv, { charId: e.a }), b = genOpponent(e.lv, { charId: e.b });
    // cân bằng chỉ số hai bên để so sánh vũ khí công bằng
    b.stats = { ...a.stats }; b.skills = { ...a.skills }; b.tech = { ...a.tech }; b.equip = { ...a.equip };
    b.level = a.level; b.talents = randomTalents(b.charId, b.level);
    const fmt = e.fmt || 'solo', team = fmt !== 'solo';
    const mk = (id) => { const c = genOpponent(e.lv, { charId: id }); c.stats = { ...a.stats }; c.skills = { ...a.skills }; c.tech = { ...a.tech }; return c; };
    Series.start({ me: a, opp: b, arena: e.arena, tactic: tacticPool(a.charId)[0], title: team ? `Đấu thử • ${FORMATS[fmt].name}` : 'Đấu thử', exhibition: true,
      rules: rollRules(fmt), teamMe: team ? [a].concat((e.ta || defaultAllies(e.a)).map(mk)) : null, teamOpp: team ? [b].concat((e.tb || defaultAllies(e.b)).map(mk)) : null,
      onDone: (won, s) => {
        $('#match-ui').classList.add('hidden');
        this.render(`<div class="panel result ${won ? 'won' : won === null ? '' : 'lost'}"><h1>${won === null ? '🤝 Hòa — người một nhà không đánh nhau' : `${won ? esc(s.me) : esc(s.opp)} thắng!`}</h1>
          <div class="score">${s.wins[0]} - ${s.wins[1]}</div>
          <div class="actions"><button class="btn ghost" onclick="UI.exhibition()">Đấu lại</button><button class="btn gold" onclick="UI.menu()">Menu</button></div></div>`, 'center');
      } });
  },
};
// vai trò từng phím chiêu
const SKILL_ROLE = { E: 'Cơ động', A: 'Đánh tích', B: 'Kết liễu', C: 'Thủ • Né • Cơ động', D: 'Đặc kỹ', U: 'Tối thượng' };
// bỏ tiền tố vai trò trong mô tả (đã có nhãn riêng) rồi viết hoa chữ đầu
function skillDesc(s) { const t = s.replace(/^(Đánh tích|Kết liễu|Thủ|Né|Đặc kỹ)\s*[:—-]\s*/, ''); return t.charAt(0).toUpperCase() + t.slice(1); }
const ARENA_ICON = { go: '🌾', da: '🏛️', bang: '❄️', lava: '🌋', troi: '☁️', ngai: '👑', rung: '🌳', cang: '⚓', dien: '⚡', sa: '🏜️', xoay: '🌀' };
const TIPS = [
  'Đấu sĩ nặng hưởng lợi từ Mép Sụp, Sàn Trơn, Trọng Lực Thấp — đấu sĩ nhẹ nên chọn Từ Trường hoặc Trọng Lực Nặng.',
  'Đối thủ dùng vũ khí tầm xa? Chọn Sương Mù để rút tầm ngắm của chúng còn 280.',
  'Mang lệnh riêng của nhân vật (vd Aria chọn bản nhạc) để điều khiển lối đánh ngay giữa trận.',
  'Kỹ thuật "Chiến thuật" giúp đấu sĩ đứng phía trong sân, đánh văng đối thủ ra mép.',
  'Kiếm Dài đánh trúng bằng mũi kiếm sẽ văng gấp đôi — chiến thuật "Thả diều" rất hợp.',
  'Trụ vững giảm độ văng — cực quan trọng ở sàn băng trơn trượt.',
  'Hô "Tung nộ!" đúng lúc đối thủ đang ở điểm văng cao để kết liễu.',
  'Dao Găm đánh sau lưng gây gấp đôi — nâng "Chiến thuật" để nó biết vòng ra sau.',
  'Rapier phá đủ 4 ấn sẽ gây choáng lâu và đòn kế tiếp đẩy cực mạnh.',
  'Đấu tập để kiếm thêm vàng và Điểm Huấn Luyện khi bị kẹt.',
  'Giải đã vô địch có thể đánh lại — đối thủ sẽ mạnh hơn nhưng thưởng vẫn hấp dẫn.',
];

// ===== Loạt trận Bo3 =====
const Series = {
  start(o) {
    const meLoad = o.loadout || tacticPool(o.me.charId), oppPool = tacticPool(o.opp.charId).filter((k) => !TACTICS[k].need || (o.opp.tech && o.opp.tech.tactic >= TACTICS[k].need));
    G.series = { ...o, wins: [0, 0], game: 0, me: o.me.name, opp: o.opp.name, meCfg: o.me, oppCfg: o.opp, tactic: meLoad.includes(o.tactic) ? o.tactic : meLoad[0], loadout: meLoad, oppPool, oppTactic: pick(oppPool), kos: 0,
      cmds: o.cmds || aiCommands(o.me.charId, o.me.equip), oppCmds: aiCommands(o.opp.charId, o.opp.equip), mods: [], modTags: {} };
    const s = G.series;
    // chế độ đội: dãy luật từng ván (Bo3/Bo5), cần thắng quá nửa
    s.rules = o.rules || ['solo', 'solo', 'solo'];
    s.need = Math.ceil(s.rules.length / 2);
    s.teamMode = s.rules.some((r) => r !== 'solo');
    if (s.teamMode) {
      s.teamMe = o.teamMe; s.teamOpp = o.teamOpp; s.usedMe = []; s.usedOpp = []; s.leaderMe = 0;
      s.orderMe = [0, 1, 2];
      s.me = `Đội ${o.me.name}`; s.opp = `Đội ${o.opp.name}`;
    }
    // nhạc trận: 1 bài lặp suốt cả loạt
    s.track = Sound.pickSeriesTrack(o.boss || o.final);
    // người một nhà (Elara, Aria, Koda) không đánh nhau → hòa (chỉ áp dụng đơn đấu)
    if (!s.teamMode && isFamilyPair(o.me.weapon, o.opp.weapon)) { startDemo(); G.match = null; o.onDone(null, G.series); return; }
    stopDemo();
    this.nextGame();
  },
  rule() { const s = G.series; return s.rules[s.game - 1] || 'solo'; },
  // chế độ đội: chọn người xong → chọn biến đổi sân → vào trận
  afterTeamPick() {
    const s = G.series;
    if (s.pickMods) { UI.modPick(s); return; }
    this.autoMods(); this.launch();
  },
  autoMods() {
    const s = G.series, mine = coachPickMod(s.offer, s.meCfg, s.oppCfg);
    s.mods = mine === s.oppMod ? [mine] : [mine, s.oppMod];
    s.modTags = mine === s.oppMod ? { [mine]: 'cả hai' } : { [mine]: 'Xanh', [s.oppMod]: 'Đỏ' };
  },
  // trước mỗi ván: đưa ra 3 biến đổi sân; HLV đối thủ chọn trước (bí mật), bạn chọn sau
  nextGame() {
    const s = G.series;
    s.game++;
    s.offer = offerMods(3);
    s.oppMod = coachPickMod(s.offer, s.oppCfg, s.meCfg);
    // HLV đối thủ đổi bộ lệnh mỗi ván
    s.oppCmds = aiCommands(s.oppCfg.charId, s.oppCfg.equip);
    // HLV đối thủ đổi phép bổ trợ mỗi hiệp theo đấu sĩ của bạn
    s.oppCfg.spells = coachPickSpells(s.oppCfg, s.meCfg, spellSlots(s.oppCfg));
    if (s.exhibition) s.meCfg.spells = coachPickSpells(s.meCfg, s.oppCfg, spellSlots(s.meCfg));
    if (s.teamMode) {
      const rule = this.rule();
      // HLV đối thủ chọn người (bí mật)
      if (rule === 'duel') { s.pickOpp = aiDuelPick(s.teamOpp, s.usedOpp); s.pickMe = s.teamMe.map((c, i) => i).find((i) => !s.usedMe.includes(i)) ?? 0; }
      if (rule === 'gauntlet') s.orderOpp = aiOrder(s.teamOpp);
      if (s.exhibition) { if (rule === 'duel') s.pickMe = aiDuelPick(s.teamMe, s.usedMe); if (rule === 'gauntlet') s.orderMe = aiOrder(s.teamMe); this.afterTeamPick(); return; }
      UI.teamPick(s); return;
    }
    if (s.pickMods) { UI.modPick(s); return; }
    // đấu thử: cả hai bên đều do máy chọn
    this.autoMods();
    this.launch();
  },
  // gói 1 đấu sĩ cho trận đấu (mine: phe bạn)
  side(cfg, mine, main) {
    const s = G.series;
    return { cfg, tactic: mine ? s.tactic : s.oppTactic, aiCoach: !mine,
      commands: main ? (mine ? s.cmds.slice() : s.oppCmds) : mine ? ['attack', 'retreat', 'ult'] : aiCommands(cfg.charId, cfg.equip) };
  },
  launch() {
    const s = G.series, rule = this.rule();
    UI.render('', '');
    UI.cur = 'match';
    G.paused = false;
    const o = {
      arena: s.arena, stocks: 2, timeLimit: 150, mods: s.mods, modTags: s.modTags,
      header: `${s.title} • Ván ${s.game}${rule !== 'solo' ? ` ${RULES[rule].icon} ${RULES[rule].name}` : ''} • ${s.wins[0]} - ${s.wins[1]}`,
      onBreak: (team, id) => { const c = team === 0 ? s.meCfg : s.oppCfg; c.equip = (c.equip || []).filter((k) => k !== id); if (team === 0 && !s.exhibition && Career.d) Career.breakItem(id); },
      onTrust: (team, n) => { if (team === 0 && !s.exhibition && Career.d) Career.addTrust(n); },
      onEnd: (r) => this.gameOver(r),
    };
    if (rule === 'solo') {
      o.a = { cfg: s.meCfg, tactic: s.tactic, berserk: !!(s.berserk && s.berserk.me), commands: s.cmds.slice() };
      o.b = { cfg: s.oppCfg, tactic: s.oppTactic, berserk: !!(s.berserk && s.berserk.opp), commands: s.oppCmds, aiCoach: true };
    } else if (rule === 'duel') {
      o.a = this.side(s.teamMe[s.pickMe], true, s.pickMe === 0); o.b = this.side(s.teamOpp[s.pickOpp], false, s.pickOpp === 0);
      s.usedMe.push(s.pickMe); s.usedOpp.push(s.pickOpp);
    } else if (rule === 'gauntlet') {
      o.mode = 'gauntlet'; o.stocks = 1; o.timeLimit = 240;
      o.teams = [s.orderMe.map((i) => this.side(s.teamMe[i], true, i === 0)), s.orderOpp.map((i) => this.side(s.teamOpp[i], false, i === 0))];
    } else {
      o.mode = 'brawl'; o.stocks = 2; o.timeLimit = 180; o.leaders = [s.leaderMe, 0];
      o.teams = [s.teamMe.map((c, i) => this.side(c, true, i === s.leaderMe)), s.teamOpp.map((c, i) => this.side(c, false, i === 0))];
    }
    G.match = new Match(o);
    Sound.seriesMusic(s.track);
    if (s.game === 1 && (s.boss || s.final)) Sound.play('boss_sting');
    $('#match-ui').classList.remove('hidden');
    MatchUI.refresh();
  },
  gameOver(r) {
    const s = G.series;
    s.wins[r.winner]++;
    s.kos += r.a.kos;
    // AI đối thủ đổi chiến thuật khi thua
    if (r.winner === 0 && s.oppPool.length > 1) s.oppTactic = pick(s.oppPool.filter((k) => k !== s.oppTactic));
    G.match = null;
    if (s.wins[0] >= s.need || s.wins[1] >= s.need) { startDemo(); s.onDone(s.wins[0] >= s.need, s); return; }
    startDemo();
    UI.between(s, r);
  },
};

// ===== Điều khiển trong trận =====
const MatchUI = {
  refresh() {
    const m = G.match, cmds = m ? m.cmds[0] : [];
    $('#match-ui').innerHTML = `
      <div class="mu-left">
        ${cmds.map((id, i) => { const C = COMMANDS[id]; return `<button class="shout ${C.basic ? '' : 'own'} ${C.team || C.tagOut ? 'team' : ''} ${C.spell ? 'spell' : ''}" id="sh-${id}" title="${esc(C.desc)}" onclick="G.match&&G.match.command(0,'${id}')"><kbd>${(i + 1) % 10}</kbd> ${C.icon} ${C.name}</button>`; }).join('')}
      </div>
      <div class="mu-right">
        ${[1, 2, 4].map((v) => `<button class="spd ${G.speed === v ? 'on' : ''}" onclick="G.speed=${v};MatchUI.refresh()">x${v}</button>`).join('')}
        <button class="spd" onclick="G.paused=!G.paused;this.textContent=G.paused?'▶':'⏸'">${G.paused ? '▶' : '⏸'}</button>
        <button class="spd ${Sound.cfg.muteMusic ? 'off' : ''}" title="Nhạc nền" onclick="Sound.toggleMusic();audioBtns();MatchUI.refresh()">🎵</button>
        <button class="spd ${Sound.cfg.muteSfx ? 'off' : ''}" title="Hiệu ứng" onclick="Sound.toggleSfx();audioBtns();MatchUI.refresh()">🔊</button>
        ${IS_MOBILE ? '<button class="spd" title="Toàn màn hình" onclick="goFullscreen()">⛶</button>' : ''}
      </div>`;
  },
  tick() {
    const m = G.match; if (!m) return;
    const f = m.lead(0);
    for (const id of m.cmds[0]) {
      const b = document.getElementById('sh-' + id); if (!b) continue;
      const cd = m.cmdCd[0][id] || 0;
      const ic = COMMANDS[id].itemUse;
      b.disabled = cd > 0 || m.state !== 'fight' || !f || !f.alive || (COMMANDS[id].tagOut && !m.queue[0].length) || f.has('berserk') || (COMMANDS[id].needUlt && !f.ultReady()) || (ic && (f.icd[ic] || 0) > 0);
      if (ic && !(cd > 0) && (f.icd[ic] || 0) > 0) { b.dataset.cd = Math.ceil(f.icd[ic]) + 's'; continue; }
      b.dataset.cd = cd > 0 ? Math.ceil(cd) + 's' : '';
    }
  },
};
