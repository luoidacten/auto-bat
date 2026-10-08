'use strict';
// ===== Thanh thông tin trong trận (DOM) — góc nhìn TRỌNG TÀI cho đấu trường sinh tồn 10 tướng =====
// Đồng hồ, số người còn trong trận, bo (vòng nào, co lúc nào), thính, boss; danh sách 10 tướng (máu, cấp, mạng, việc
// đang làm, lượt hồi sinh / hạng); dòng sự kiện; thông báo hạ gục / bị loại; bảng xếp hạng. Cập nhật ~6 lần/giây.
// Trọng tài thấy hết: cả ý định của AI (top 3 hành động + lý do) — chạm tên tướng để xem.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const U = G.U;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const slot = (h) => (G.SLOT_COL && G.SLOT_COL[h.team]) || '#ccc';
  // GĐ8: tên boss / ổ / bùa lợi cho dòng sự kiện
  const bossNm = (id) => { const D = G.BOSSES && G.BOSSES[id]; return D ? `${D.icon} <b style="color:${D.color}">${esc(D.name)}</b>` : '👑 Boss'; };
  const lairNm = (i) => { const L = G.MAP.lairs && G.MAP.lairs[i]; return L ? esc(L.name) : 'ổ boss'; };
  const bossTx = (id) => { const D = G.BOSSES && G.BOSSES[id]; return D ? D.icon + ' ' + D.name : '👑 Boss'; };
  const buffNm = (id) => { const D = G.BOSSES && G.BOSSES[id], B0 = D && D.buff && G.BOSS_BUFFS[D.buff]; return B0 ? `${B0.icon} ${esc(B0.name)}` : ''; };
  const nameOf = (h) => (h.player && h.player.name ? h.player.name : h.hero.name);

  class Hud {
    constructor(root, app) {
      this.root = root; this.app = app;
      this.feedN = 0;
      root.innerHTML = `
        <div class="topbar br">
          <div class="mid"><div id="clock">0:00</div><div class="alive" id="alive">10/10 còn sống</div></div>
          <div class="zinfo" id="zinfo"></div>
        </div>
        <div class="ctrl" id="ctrl">
          <button data-sp="0" title="Tạm dừng (Space)">⏸</button><button class="spd" data-sp="0.5">x0.5</button><button class="spd" data-sp="1">x1</button><button class="spd" data-sp="2">x2</button><button class="spd" data-sp="4">x4</button><button class="spd" data-sp="8">x8</button>
          <button class="spc" id="bSpc" title="Đổi tốc độ">x2</button>
          <button id="bBoard" title="Bảng xếp hạng (Tab)">📋</button>
          <button id="bMore" title="Thêm">⋯</button>
        </div>
        <div class="more hidden" id="more">
          <button id="bSlow">🐢 Tự chậm khi giao tranh</button>
          <button id="bCam">🎥 Camera tự bám điểm nóng</button>
          <button id="bDbg">🧠 Hiện suy nghĩ AI trên sân</button>
          <button id="bFast">⏩ Mô phỏng nhanh tới hết trận</button>
          <button id="bMenu">✕ Thoát trận</button>
        </div>
        <div class="strip roster" id="roster"></div>
        <button class="sfold" id="bFold" title="Thu gọn / mở danh sách tướng (đỡ che sân)">◂</button>
        <canvas id="mini"></canvas>
        <div class="feed" id="feed"></div>
        <div class="banner" id="banner"></div>
        <div class="ann" id="ann"></div>
        <button class="camtag hidden" id="camtag" title="Camera tự động: chạm để bật/tắt"></button>
        <div class="pop hidden" id="pop"></div>
        <div class="board hidden" id="board"></div>`;
      this.$ = (id) => root.querySelector('#' + id);
      this.mini = this.$('mini');
      root.querySelector('#ctrl').addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.sp !== undefined) app.setSpeed(+b.dataset.sp === 0 && app.speed === 0 ? (app.pref.speed || 2) : +b.dataset.sp);
        else if (b.id === 'bSpc') { const L = [0.5, 1, 2, 4, 8], i = L.indexOf(app.speed); app.setSpeed(L[(i + 1) % L.length]); }
        else if (b.id === 'bBoard') this.$('board').classList.toggle('hidden');
        else if (b.id === 'bMore') this.$('more').classList.toggle('hidden');
        this.refreshCtrl();
      });
      this.$('more').addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.id === 'bSlow') app.autoSlow = !app.autoSlow;
        else if (b.id === 'bCam') { app.r.cam.follow = true; app.r.cam.focusId = null; }
        else if (b.id === 'bDbg') { app.r.debugAI = !app.r.debugAI; }
        else if (b.id === 'bFast') { this.$('more').classList.add('hidden'); app.fastForward(); }
        else if (b.id === 'bMenu') { this.$('more').classList.add('hidden'); app.quitMatch(); }
        this.refreshCtrl();
      });
      this.$('camtag').addEventListener('click', () => { app.r.cam.follow = !app.r.cam.follow; app.r.cam.focusId = null; this.refreshCtrl(); });
      // thu gọn danh sách tướng (chỉ còn chấm màu + thanh máu) — đỡ che sân trên điện thoại; nhớ lựa chọn trên máy này
      this.fold = false;
      try { this.fold = localStorage.getItem('kdc_fold') === '1'; } catch (e) { /* không có bộ nhớ trình duyệt */ }
      // chạm bản đồ nhỏ để nhảy camera
      const jump = (e) => {
        const r = this.mini.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width * G.C.MAP, y = (e.clientY - r.top) / r.height * G.C.MAP;
        app.r.cam.x = x; app.r.cam.y = y; app.r.cam.follow = false; app.r.clampCam();
        e.preventDefault(); e.stopPropagation();
      };
      this.mini.addEventListener('pointerdown', (e) => { jump(e); this.miniDrag = true; });
      this.mini.addEventListener('pointermove', (e) => { if (this.miniDrag) jump(e); });
      window.addEventListener('pointerup', () => { this.miniDrag = false; });
      // chạm một tướng: camera theo dõi + thẻ thông tin (bản lĩnh, tính cách, ý định AI)
      this.$('bFold').addEventListener('click', () => { this.fold = !this.fold; this.applyFold(); try { localStorage.setItem('kdc_fold', this.fold ? '1' : '0'); } catch (er) { /* bỏ qua */ } });
      this.$('roster').addEventListener('click', (e) => {
        const row = e.target.closest('[data-id]'); if (!row || !this.m) return;
        const h = this.m.heroById(+row.dataset.id); if (!h) return;
        if (h.alive) { app.r.cam.follow = true; app.r.cam.focusId = h.id; }
        this.openCard(h);
        this.refreshCtrl();
      });
      this.$('pop').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) this.closePop(); });
      this.$('board').addEventListener('click', (e) => { const row = e.target.closest('[data-id]'); if (row && this.m) this.openCard(this.m.heroById(+row.dataset.id)); });
      this.resize();
    }
    applyFold() {
      this.$('roster').classList.toggle('fold', this.fold);
      this.root.classList.toggle('rfold', this.fold);
      this.$('bFold').textContent = this.fold ? '▸' : '◂';
    }
    // ===================== THÔNG BÁO HẠ GỤC / BỊ LOẠI =====================
    announce(e) {
      const a = e.ann || {};
      const MULTI = { 2: 'HẠ GỤC KÉP', 3: 'HẠ GỤC BA', 4: 'HẠ GỤC BỐN', 5: 'HẠ GỤC NĂM' };
      const STREAK = { 3: 'ĐANG HỦY DIỆT', 4: 'KHÔNG THỂ CẢN PHÁ', 5: 'THỐNG TRỊ', 6: 'NHƯ THẦN THÁNH' };
      let title = '', big = true, snd = null;
      if (e.vulture) { title = '🦅 KỀN KỀN!'; snd = 'magic_strike'; }
      else if (a.multi >= 2) { title = MULTI[Math.min(5, a.multi)]; snd = a.multi >= 3 ? 'boss_sting' : 'magic_burst'; }
      else if (a.first) { title = 'CHIẾN CÔNG ĐẦU'; snd = 'magic_burst'; }
      else if (a.shut) { title = `CHẤM DỨT CHUỖI ${a.shut} MẠNG${a.bounty ? ` (+${a.bounty} truy nã)` : ''}`; snd = 'magic_strike'; }
      else if (a.streak >= 3) { title = STREAK[Math.min(6, a.streak)] || 'HUYỀN THOẠI'; snd = 'magic_strike'; }
      else big = false;
      const sub2 = e.out ? `${esc(nameOf(e.victim))} BỊ LOẠI${e.victim.place ? ' — hạng ' + e.victim.place : ''}` : e.victim.reviving ? 'còn 1 lượt hồi sinh' : '';
      if (e.out) big = true;
      const nm = (h) => `<span class="pp"><i style="background:${h.hero.color};box-shadow:0 0 0 2px ${slot(h)}"></i>${esc(nameOf(h))}</span>`;
      const how = e.cause === 'zone' ? ' <small>(bo)</small>' : e.cause === 'monster' ? ' <small>(quái)</small>' : '';
      const line = e.killer ? `${nm(e.killer)}<b class="x">⚔</b>${nm(e.victim)}${how}` : `${nm(e.victim)} <small>gục ngã${e.cause === 'zone' ? ' trong bo' : ''}</small>`;
      const q = this.annQ || (this.annQ = []);
      if (!big && q.length >= 2) return;
      q.push({ html: `${title ? `<div class="tt">${title}</div>` : ''}${sub2 ? `<div class="t2">${sub2}</div>` : ''}<div class="ln">${line}</div>`, cls: (e.out ? 'red' : 'blue') + (big ? ' big' : ''), dur: big ? 2600 : 1600, snd });
      if (!this.annBusy) this.nextAnn();
    }
    nextAnn() {
      const q = this.annQ || [], box = this.$('ann');
      const it = q.shift();
      if (!it) { this.annBusy = false; box.className = 'ann'; return; }
      this.annBusy = true;
      box.innerHTML = it.html; box.className = 'ann ' + it.cls; void box.offsetWidth; box.classList.add('show');
      if (it.snd && G.Sound) G.Sound.play(it.snd);
      clearTimeout(this.annT); this.annT = setTimeout(() => { box.classList.remove('show'); this.annT = setTimeout(() => this.nextAnn(), 220); }, it.dur);
    }
    resize() {
      const S = Math.round(Math.min(window.innerHeight * 0.34, window.innerWidth * 0.22, 210));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.mini.style.width = S + 'px'; this.mini.style.height = S + 'px';
      this.mini.width = Math.round(S * dpr); this.mini.height = Math.round(S * dpr);
      this.root.style.setProperty('--mini', S + 'px');
    }
    setMatch(m) {
      this.m = m; this.feedN = 0;
      this.closePop();
      this.annQ = []; this.annBusy = false; clearTimeout(this.annT); this.$('ann').className = 'ann';
      this.$('feed').innerHTML = ''; this.$('board').classList.add('hidden'); this.$('more').classList.add('hidden');
      const box = this.$('roster'); box.innerHTML = '';
      for (const h of m.heroes) {
        const row = el('div', 'hrow');
        row.dataset.id = h.id; row.style.setProperty('--slot', slot(h));
        row.innerHTML = `<div class="av" style="background:${h.hero.color}"><span class="lv">1</span></div>
          <div class="info"><div class="nm">${h.pers ? h.pers.icon : ''} ${esc(nameOf(h))} <small class="hn">${h.pers ? esc(h.pers.name) : ''}</small><span class="lf"></span><span class="tl"></span></div>
          <div class="hp"><i></i></div><div class="sub"><span class="kda">⚔ 0</span><span class="pt"></span><span class="it"></span></div></div>`;
        box.appendChild(row);
      }
      this.rows = new Map([...box.querySelectorAll('.hrow')].map((r) => [+r.dataset.id, r]));
      this.applyFold();
      this.refreshCtrl();
    }
    refreshCam() {
      const r = this.app.r, t = this.$('camtag');
      const txt = r.cam.follow ? (r.camWhy || '🎥 Camera tự động') : '🎥 Camera tự do — chạm để tự động';
      if (t.textContent !== txt) t.textContent = txt;
      t.classList.toggle('hidden', !this.m);
      t.classList.toggle('off', !r.cam.follow);
    }
    refreshCtrl() {
      const app = this.app;
      for (const b of this.root.querySelectorAll('#ctrl [data-sp]')) b.classList.toggle('on', +b.dataset.sp === app.speed);
      const p = this.root.querySelector('#ctrl [data-sp="0"]'); p.textContent = app.speed ? '⏸' : '▶';
      this.$('bSpc').textContent = 'x' + (app.speed || app.pref.speed || 2);
      this.$('bSlow').classList.toggle('on', app.autoSlow);
      this.$('bCam').classList.toggle('on', app.r.cam.follow);
      this.$('bDbg').classList.toggle('on', !!app.r.debugAI);
      this.refreshCam();
    }
    onFx() { /* hiệu ứng chỉ để vẽ */ }
    banner(txt, cls) {
      const b = this.$('banner'); b.textContent = txt; b.className = 'banner show ' + (cls || '');
      clearTimeout(this.bT); this.bT = setTimeout(() => { b.className = 'banner'; }, 2400);
    }
    openPop(html) { const p = this.$('pop'); p.innerHTML = html; p.classList.remove('hidden'); }
    closePop() { this.$('pop').classList.add('hidden'); this.cardId = null; }
    // thẻ một tướng: tính cách, chỉ số bản lĩnh, ý định AI (trọng tài thấy hết)
    openCard(h) {
      if (!h) return;
      this.cardId = h.id;
      const S = h.player.stats || {}, N = G.SUMMONER_STAT_NAME || {};
      const stats = (G.SUMMONER_STATS || Object.keys(S)).map((k) => `<span class="st"><small>${esc(N[k] || k)}</small> <b>${S[k] == null ? '-' : S[k]}</b></span>`).join('');
      const life = h.out ? `bị loại — hạng ${h.place}` : h.reviving ? `đang chờ hồi sinh (${Math.ceil(h.respawnT)}s)` : h.revived || this.m.time >= G.C.REVIVE_UNTIL ? 'mạng cuối' : 'còn 1 lượt hồi sinh';
      const top = h.alive && h.ai && h.ai.top3 && h.ai.top3.length ? `<div class="intent"><b>🧠 Đang nghĩ</b>${h.ai.top3.map((t, i) => `<div class="${i ? '' : 'top'}">${i + 1}. ${t.icon} ${esc(t.name)} <small>${t.s.toFixed(2)}</small><br><small class="dim">${esc(t.why)}</small></div>`).join('')}</div>` : '';
      this.openPop(`<div class="card"><div class="ch"><span class="dot" style="background:${h.hero.color};box-shadow:0 0 0 2px ${slot(h)}"></span><b>${esc(nameOf(h))}</b> <small>cấp ${h.level} • ${life}</small> <button data-close="1">✕</button></div>
        ${h.pers ? `<div class="pers">${h.pers.icon} <b>${esc(h.pers.name)}</b> — ${esc(h.pers.desc)}</div>` : ''}
        <div class="stats">${stats}<span class="st"><small>Bình tĩnh</small> <b>${100 - Math.round((h.tilt || 0) * 100)}%</b></span></div>
        <div class="kd">${(() => { const FS = G.FIGHT_STYLE && G.FIGHT_STYLE[h.fstyle]; return FS ? `${FS.icon} <b>${esc(FS.name)}</b> <small>${esc(FS.desc)}</small><br>` : ''; })()}📍 ${h.alive ? esc(G.MAP.regionAt(h.x, h.y).icon + ' ' + G.MAP.regionAt(h.x, h.y).name) + (h.hi ? ' • ⛰ <b>trên cao</b>' : '') + (h.terr ? ' • ' + esc(G.MAP.TERRAIN[h.terr].name) : '') : '-'}${h.stats.pots ? ` • 🧪 <small>đã uống ${h.stats.pots} bình</small>` : ''}${h.stats.duels ? ` • ⚔ thắng ${h.stats.duels} quyết đấu` : ''}<br>
        🗡 Ý niệm vũ khí: ${h.yNiem ? `<b style="color:${G.SOUL_TIER[h.yNiem].color}">${G.YNIEM_NAME[h.yNiem]}</b> <small>(+${Math.round(h.yNiem * G.C.YNIEM.dmg * 100)}% sát thương)</small>` : '<small>Thường</small>'}<br>
        ${(() => { const P = G.Persona; if (!P || !this.m) return ''; const w = h.persId === 'vesi' && h.ai ? h.ai.ward : null, pt = P.partnerOf(this.m, h); return (w ? `🛡 Bảo vệ: <b>${esc(nameOf(w))}</b> <small>(tạm thời — chờ cốt truyện)</small><br>` : '') + (pt ? `🤝 Liên minh tạm với <b>${esc(nameOf(pt))}</b> <small>(còn ${Math.ceil(h.allyRec.until - this.m.time)}s${h.allyRec.betray === h ? ' • đang chờ thời phản bội' : ''})</small><br>` : ''); })()}🎒 Balo cấp ${h.bag ? h.bag.lv : 1} <small>(${h.bag ? h.bag.slots.length : 0}/${h.bag ? G.BAG.slots[h.bag.lv - 1] : 3} ô)</small>: ${h.bag && h.bag.slots.length ? (() => { const cnt = new Map(); for (const x of h.bag.slots) cnt.set(x.id, (cnt.get(x.id) || 0) + x.n); return [...cnt].map(([id, n]) => { const I = G.CONSUMABLES[id]; return `<span title="${esc(I.desc)}">${I.icon}<small>${esc(I.name)}${n > 1 ? ' ×' + n : ''}</small></span>`; }).join(' '); })() : '<small>trống</small>'}${h.stats.bagUsed ? ` <small>(đã dùng ${h.stats.bagUsed})</small>` : ''}${h.stats.chests ? ` • 🎁 ${h.stats.chests} rương` : ''}<br>
        ${(() => { const st = h.st, pc = (v) => Math.round((v || 0) * 100) + '%';
          return `🛡 Hộ Giáp <b>${Math.round(h.ga || 0)}/${Math.round(st.maxGa || 0)}</b> • 🎯 Chí mạng ${pc(st.crit)} • 🍀 May mắn ${pc(st.loot)} • ⏳ Hồi chiêu −${pc(st.cdr)} • 🩸 Hút máu ${pc(st.lifesteal)} • 🪨 Kháng HU ${pc(st.tenacity)}${st.bypass ? ` • 🗡 Xuyên Thủng ${pc(st.bypass)}` : ''}${st.antiByp ? ` • 🧱 Chống Xuyên ${pc(st.antiByp)}` : ''}${(() => { const GN = h.hero.gun && h.ws && h.hero.gun(this.m, h); return GN ? ` • 🔫 Đạn <b>${Math.floor(GN.n)}/${GN.max}</b>${GN.rl > 0 ? ` <small>(đang nạp ${GN.rl.toFixed(1)}s)</small>` : ''} • ⚙ Tốc Nạp +${pc(Math.max(0, st.asBonus - (h.base.asBonus || 0)) + (st.reload || 0))}` : ''; })()}<br>`; })()}
        ${(() => { const BB = G.BOSS_BUFFS || {}, bufs = h.statuses.filter((x) => x.key && BB[x.key]).map((x) => `<b style="color:${BB[x.key].color}" title="${esc(BB[x.key].desc)}">${BB[x.key].icon} ${esc(BB[x.key].name)}</b> <small>(${Math.ceil(x.t)}s)</small>`);
          const gold = (h.golden || []).map((id) => G.GOLDEN && G.GOLDEN[id]).filter(Boolean).map((I) => `<b style="color:#fff099" title="${esc(I.desc)}">${I.icon} ${esc(I.name)}</b>`);
          if (h.goldenYn) gold.push(`<b style="color:#fff099">💠 Ý Niệm Hoàng Kim</b>`);
          return (bufs.length ? `🔥 Bùa lợi boss: ${bufs.join(' • ')}<br>` : '') + (gold.length ? `✨ Đồ Hoàng Kim: ${gold.join(' • ')}<br>` : ''); })()}
        💠 Mảnh hồn <small>(gắn ${(h.souls || []).filter((x) => x.on).length}/${h.yNiem || 0} ô — mảnh bậc cao hơn Ý Niệm hoặc thừa ô thì cất trong túi)</small>: ${h.souls && h.souls.length ? '<br>' + h.souls.slice().sort((a, b) => (b.on - a.on) || b.tier - a.tier).map((x) => { const D = G.SHARDS[x.id], T = G.SOUL_TIER[x.tier], PK = D && D.perk && G.SOUL_PERK[D.perk]; if (!D) return ''; return `<span class="soul${x.on ? '' : ' off'}" title="${esc(G.shardText(x))}">${x.on ? '✅' : '💤'} <b style="color:${T.color}">${G.shardIcon(x.id)} ${esc(D.n)}</b> <small>[${esc(T.name)}] ${esc(G.shardText(x))}</small>${PK ? ` <b class="perk" title="${esc(PK.desc)}">${PK.icon} ${esc(PK.name)}${h.perkCd && h.perkCd[D.perk] > this.m.time ? ` <small>(hồi ${Math.ceil(h.perkCd[D.perk] - this.m.time)}s)</small>` : ''}</b>` : ''}</span>`; }).join('<br>') : '<small>chưa có</small>'}</div>
        ${this.buildHtml(h)}
        <div class="kd">⚔ ${h.stats.k} mạng${h.stats.vulture ? ` (🦅 ${h.stats.vulture} kền kền)` : ''} • 🌲 ${h.stats.camps || 0} bãi quái • 👑 ${h.stats.boss || 0} boss • 📦 ${h.stats.drops || 0} thính • 💰 ${U.fmt(h.gold)} vàng</div>
        ${top}</div>`);
      const dt = this.$('pop').querySelector('details.tree'); if (dt) dt.ontoggle = () => { this.treeOpen = dt.open; };   // GĐ9: giữ trạng thái mở cây kỹ năng khi thẻ làm mới
    }
    // GĐ9: lối build đang theo + mảnh hồn yêu thích + cây kỹ năng đã nâng (mốc đã mở / chưa mở, nhánh đã chọn)
    buildHtml(h) {
      const B = h.buildPref, own = new Set((h.items || []).map((it) => it.id || it));
      const bl = B ? `🧭 Lối build: <b>${esc(B.name)}</b>${h.pers && h.pers.strict ? ' <small>(cầu toàn — theo đúng bộ sở trường)</small>' : ''}<br><small>${[B.start, B.core[0], B.boots, ...B.core.slice(1)].filter(Boolean).map((id) => { const I = G.ITEMS[id]; if (!I) return ''; const st = own.has(id) ? 'got' : own.has(id + '_p') ? '' : 'dim'; return `<span class="${st}">${own.has(id) ? '✔' : own.has(id + '_p') ? '◐' : '·'} ${esc(I.name)}</span>`; }).join(' → ')}</small><br>` : '';
      const fav = G.favShards ? G.favShards(h.heroId) : [];
      const fl = fav.length ? `❤ Mảnh yêu thích: ${fav.map((id) => { const D = G.SHARDS[id]; if (!D) return ''; const on = h.shOn && h.shOn.has(id), has = (h.souls || []).some((x) => x.id === id); return `<span class="${on ? 'got' : has ? '' : 'dim'}" title="${esc(D.desc || '')}">${on ? '✅' : has ? '💤' : '·'} <b style="color:${G.SOUL_TIER[D.t].color}">${G.shardIcon(id)} ${esc(D.n)}</b></span>`; }).join(' ')}<br>` : '';
      const tree = h.hero.tree, T = G.TREE_TIERS || [];
      let tr = '';
      if (tree && h.tree) {
        const rows = T.map((lv, i) => {
          const open = (h.treeOn || 0) > i;
          const br = (tree[i] || []).map((b, j) => { if (!b) return ''; const cd = lv + 'abc'[j], on = h.tset && h.tset[cd], pick = h.tree[i] === j;
            return `<div class="br${on ? ' on' : pick ? ' pick' : ''}" title="${esc(b.desc || '')}">${on ? '✅' : pick ? '🔒' : '·'} <b>${esc(b.name)}</b> <small>${esc(b.desc || '')}</small></div>`; }).join('');
          return `<div class="tier${open ? '' : ' lock'}"><small>Mốc cấp ${lv}${open ? '' : ' — chưa mở'}</small>${br}</div>`;
        }).join('');
        const ex = (h.treeX || []).map((x) => `<div class="br on">✨ cấp ${x.lv}: <b>${esc(x.name)}</b></div>`).join('');
        const n = Object.keys(h.tset || {}).length + (h.treeX || []).filter((x) => G.TREE_GEN && G.TREE_GEN[x.code]).length;
        tr = `<details class="tree"${this.treeOpen ? ' open' : ''}><summary>🌳 Cây kỹ năng <small>(đã nâng ${n} nhánh — chạm để xem)</small></summary>${rows}${ex}</details>`;
      }
      const sk = h.pers && h.pers.trader ? `📦 Kho hàng (${(h.stock || []).length}/4): ${(h.stock || []).length ? h.stock.map((x) => { const D = G.SHARDS[x.id]; return D ? `<b style="color:${G.SOUL_TIER[x.tier].color}">${G.shardIcon(x.id)} ${esc(D.n)}</b>` : ''; }).join(' ') : '<small>trống</small>'}${h.stats.trades ? ` <small>• ${h.stats.trades} lần mua bán</small>` : ''}${h.stats.bluffs ? ` <small>• 🃏 ${h.stats.bluffs} lần bịp</small>` : ''}<br>` : '';
      return bl || fl || tr || sk ? `<div class="kd">${sk}${bl}${fl}${tr}</div>` : '';
    }
    // trạng thái bo cho thanh trên
    zoneText() {
      const m = this.m, z = m.zoneSt; if (!z) return '';
      const n = G.C.ZONE.length;
      if (z.shrinking) return `🌀 Bo ${z.started}/${n} đang co — còn ${U.mmss(Math.max(0, z.shrinkEnd - m.time))}`;
      if (z.next && z.phase >= 0 && z.shrinkAt > m.time) return `🌀 Bo ${z.phase + 1}/${n} co sau ${U.mmss(z.shrinkAt - m.time)}`;
      return `🌀 Bo cuối — hết giờ sau ${U.mmss(Math.max(0, G.C.MATCH_TIME - m.time))}`;
    }
    update() {
      const m = this.m;
      if (!m) return;
      this.$('clock').textContent = U.mmss(m.time);
      const alive = m.aliveCount();
      this.$('alive').textContent = `👥 ${alive}/${m.heroes.length} còn trong trận`;
      // bo • thính • boss
      const parts = [this.zoneText()];
      const d = (m.drops || []).find((x) => !x.taken && (x.warned || x.at - m.time < 60));
      if (d) parts.push(d.landed ? '📦 Thính đã rơi!' : d.warned ? `📦 Thính rơi sau ${Math.ceil(d.at - m.time)}s` : `📦 Thính sau ${U.mmss(d.at - m.time)}`);
      // GĐ8: boss đang sống ở các ổ (biểu tượng + % máu); không có thì boss sắp ra sớm nhất
      const LS = m.lairSt || [], liveB = LS.filter((S) => S.unit && S.unit.alive);
      if (liveB.length) parts.push(liveB.map((S) => `${(G.BOSSES[S.unit.bossId] || {}).icon || '👑'} ${Math.round(S.unit.hpPct * 100)}%`).join(' '));
      else { const nx = LS.filter((S) => S.nextAt > m.time).sort((a, b) => a.nextAt - b.nextAt)[0]; if (nx) { const P = G.LAIR_PLAN[nx.lair.id], id = nx.forceId || P.list[nx.i % P.list.length], D = G.BOSSES[id]; parts.push(`${D.icon} ${D.name} sau ${U.mmss(nx.nextAt - m.time)}`); } }
      const dg = m.duelSt && m.duelSt.gate;
      if (dg) parts.push(dg.state === 'fight' ? `⚔ ${nameOf(dg.a)} vs ${nameOf(dg.b)}` : `⚔ Cổng quyết đấu ${U.mmss(Math.max(0, dg.until - m.time))}${dg.a ? ' • chờ ' + nameOf(dg.a) : ''}`);
      const zt = parts.filter(Boolean).map((t) => `<span>${esc(t)}</span>`).join('');
      if (zt !== this.zHtml) { this.zHtml = zt; this.$('zinfo').innerHTML = zt; }
      // danh sách tướng
      for (const h of m.heroes) {
        const row = this.rows && this.rows.get(h.id); if (!row) continue;
        row.querySelector('.lv').textContent = h.level;
        row.classList.toggle('dead', !h.alive);
        row.classList.toggle('out', !!h.out);
        row.querySelector('.hp i').style.width = (h.alive ? Math.round(h.hpPct * 100) : 0) + '%';
        row.querySelector('.kda').textContent = h.out ? `🏁 Hạng ${h.place}` : h.reviving ? `♻ hồi sinh ${Math.ceil(h.respawnT)}s` : `⚔ ${h.stats.k}${h.stats.vulture ? ' 🦅' + h.stats.vulture : ''}`;
        row.querySelector('.lf').textContent = h.out ? '' : h.revived || m.time >= G.C.REVIVE_UNTIL ? '' : '♻';
        // bình máu/mana còn lại + mảnh hồn (vòng ảnh đại diện đổi màu theo bậc cao nhất)
        const ptTxt = h.alive && h.pots ? `🧪${h.pots.hp}${h.resource === 'mana' ? ' 💧' + h.pots.mp : ''}${h.bag && h.bag.slots.some((x) => !G.CONSUMABLES[x.id].pot) ? ' 🎒' + h.bag.slots.filter((x) => !G.CONSUMABLES[x.id].pot).reduce((a, x) => a + x.n, 0) : ''}${h.souls && h.souls.length ? ' 💠' + h.souls.length : ''}` : '';   // balo chi tiết ở thẻ tướng
        const ptEl = row.querySelector('.pt'); if (ptEl.textContent !== ptTxt) ptEl.textContent = ptTxt;
        const sc = h.yNiem && G.SOUL_TIER ? G.SOUL_TIER[h.yNiem].color : '';   // viền ảnh = màu ý niệm vũ khí
        if (row.dataset.soul !== sc) { row.dataset.soul = sc; const av = row.querySelector('.av'); av.style.borderColor = sc || ''; av.style.boxShadow = sc ? `0 0 6px 1px ${sc}` : ''; }
        row.classList.toggle('duel', !!h.duel);
        const tl = h.tilt || 0;
        row.querySelector('.tl').textContent = tl > 0.35 ? (tl > 0.6 ? '😡' : '😠') : '';
        const itEl = row.querySelector('.it'), A = G.UtilityAI && h.ai && h.alive && G.UtilityAI.ACT[h.ai.act];
        const itTxt = !h.alive ? '' : h.duel ? '⚔ Đang quyết đấu' : h.cast && h.cast.key === 'potion' ? (G.CONSUMABLES[h.cast.id] ? (h.cast.kind === 'hp' ? '🧪 ' : '💧 ') + 'Uống ' + G.CONSUMABLES[h.cast.id].name.toLowerCase() : '🧪 Uống bình') : h.ai && h.ai.mode === 'fight' && h.ai.target ? `⚔ Đánh ${nameOf(h.ai.target)}` : A ? `${A.icon} ${A.name}` : '';
        if (itEl.textContent !== itTxt) itEl.textContent = itTxt;
      }
      if (this.cardId != null && !this.$('pop').classList.contains('hidden') && (!this.cardT || m.time > this.cardT)) { this.cardT = m.time + 1; this.openCard(m.heroById(this.cardId)); }
      // dòng sự kiện
      const feed = this.$('feed'), total = m.feedTotal || m.feed.length, base = total - m.feed.length;
      if (this.feedN < base) this.feedN = base;
      while (this.feedN < total) {
        const e = m.feed[this.feedN - base]; this.feedN++;
        if (!e) continue;
        const line = this.feedLine(e);
        if (line) {
          feed.prepend(el('div', 'fl' + (e.type === 'out' || e.type === 'end' ? ' red' : e.type === 'kill' && e.vulture ? ' gold' : ''), `<span class="t">${U.mmss(e.t)}</span> ${line}`));
          while (feed.children.length > 6) feed.lastChild.remove();
        }
        const fresh = m.time - e.t < 6;
        if (!fresh) continue;
        if (e.type === 'kill') this.announce(e);
        else if (e.type === 'zone_shrink') this.banner(`🌀 Bo ${e.phase}/${G.C.ZONE.length} bắt đầu co!`, 'purple');
        else if (e.type === 'drop_warn') this.banner(`📦 Thính sắp rơi — ${G.C.DROP.warn} giây!`, 'gold');
        else if (e.type === 'boss_up') this.banner(`${bossTx(e.boss)} đã xuất hiện ở ${lairNm(e.lair)}!`, e.boss === 'rong' ? 'red' : 'gold');
        else if (e.type === 'boss_power') this.banner('🐉 Tân Thế bay đi — Rồng Cổ Đại sắp hạ cánh ở tâm bo!', 'red');
        else if (e.type === 'boss_hit' && e.hero) this.banner(`⚠ ${nameOf(e.hero)} đang đánh ${bossTx(e.boss)}!`, 'purple');
        else if (e.type === 'boss_kill' && e.hero) this.banner(`👑 ${nameOf(e.hero)} hạ ${bossTx(e.boss)}!${buffNm(e.boss) ? ' Nhận ' + buffNm(e.boss) : ''}`, 'gold');
        else if (e.type === 'buff_save') { const B0 = G.BOSS_BUFFS[e.buff]; this.banner(`${B0.icon} ${nameOf(e.hero)}: ${B0.name.toUpperCase()}!`, 'red'); }
        else if (e.type === 'treasure') this.banner(`✨ ${nameOf(e.hero)} nhận đồ Hoàng Kim!`, 'gold');
        else if (e.type === 'drop_take' && e.hero) this.banner(`📦 ${nameOf(e.hero)} lấy được thính!`, 'gold');
        else if (e.type === 'duel_gate') this.banner(`⚔ Cổng Quyết Đấu mở ở ${G.MAP.regionAt(e.x, e.y).name}!`, 'gold');
        else if (e.type === 'duel_start') { this.banner(`⚔ QUYẾT ĐẤU: ${nameOf(e.a)} vs ${nameOf(e.b)}`, 'gold'); if (G.Sound) G.Sound.play('boss_sting'); }
        else if (e.type === 'duel_end' && e.winner) this.banner(`🏆 ${nameOf(e.winner)} thắng quyết đấu (${Math.round(e.dur)}s) — nhận thưởng lớn!`, 'gold');
        else if (e.type === 'soul_drop' && e.best >= 4) this.banner(`💠 ${nameOf(e.hero)} rơi ${e.n} mảnh hồn — có mảnh ${G.SOUL_TIER[e.best].name}!`, e.best >= 5 ? 'red' : 'gold');
        else if (e.type === 'backstab') this.banner(`🎭 ${nameOf(e.hero)} đâm sau lưng ${nameOf(e.other)}!`, 'red');
        else if (e.type === 'perk_revive') this.banner(`${G.SOUL_PERK[e.perk].icon} ${nameOf(e.hero)}: ${G.SOUL_PERK[e.perk].name.toUpperCase()}!`, e.perk === 'thien_menh' ? 'red' : 'gold');
        else if (e.type === 'fu_ho') this.banner(`🧿 Phù Hộ Mệnh cứu ${nameOf(e.hero)} khỏi cái chết!`, 'gold');
        else if (e.type === 'yniem' && e.tier >= 4) this.banner(`🗡 ${nameOf(e.hero)}: vũ khí lên ý niệm ${G.YNIEM_NAME[e.tier]}!`, e.tier >= 5 ? 'red' : 'gold');
        else if (e.type === 'soul' && e.tier >= 4) this.banner(`💠 ${nameOf(e.hero)} nhận mảnh hồn ${G.SOUL_TIER[e.tier].name}!`, e.tier >= 5 ? 'red' : 'gold');
      }
      this.refreshCam();
      if (!this.$('board').classList.contains('hidden')) this.renderBoard();
    }
    feedLine(e) {
      const nm = (h) => `<b style="color:${G.Draw ? G.Draw.lighten(slot(h), 0.35) : slot(h)}">${esc(nameOf(h))}</b>`;
      switch (e.type) {
        case 'kill': {
          const how = e.cause === 'zone' ? ' 🌀' : e.cause === 'monster' ? ' 🐾' : '';
          const tail = e.out ? ' <small class="outx">— bị loại</small>' : '';
          return e.killer ? `${nm(e.killer)} ${e.vulture ? '🦅' : '⚔'} ${nm(e.victim)}${how}${tail}` : `${nm(e.victim)} gục ngã${how}${tail}`;
        }
        case 'out': return `🏁 ${nm(e.hero)} bị loại — hạng ${e.place}`;
        case 'revive': return `♻ ${nm(e.hero)} hồi sinh (lượt duy nhất)`;
        case 'zone_next': return `🌀 bo ${e.phase} sẽ co lúc ${U.mmss(e.at)}`;
        case 'zone_shrink': return `🌀 bo ${e.phase} đang co`;
        case 'drop_warn': return `📦 thính sắp rơi (${U.mmss(e.at)})`;
        case 'drop': return '📦 thính đã rơi';
        case 'drop_take': return `📦 ${nm(e.hero)} lấy thính`;
        case 'boss_warn': return `${bossNm(e.boss)} sẽ ra ở ${lairNm(e.lair)} lúc ${U.mmss(e.at)}`;
        case 'boss_up': return `${bossNm(e.boss)} xuất hiện ở ${lairNm(e.lair)}`;
        case 'boss_power': return '🐉 Rồng Cổ Đại sắp hạ cánh ở tâm bo';
        case 'boss_hit': return e.hero ? `⚠ ${nm(e.hero)} bắt đầu đánh ${bossNm(e.boss)} — cả bản đồ đều biết` : null;
        case 'boss_kill': return e.hero ? `👑 ${nm(e.hero)} hạ ${bossNm(e.boss)}${buffNm(e.boss) ? ' → ' + buffNm(e.boss) : ''}` : `👑 ${bossNm(e.boss)} bị hạ`;
        case 'buff_save': { const B0 = G.BOSS_BUFFS[e.buff]; return B0 ? `${B0.icon} ${nm(e.hero)} thoát chết nhờ <b>${esc(B0.name)}</b>` : null; }
        case 'treasure': return `✨ ${nm(e.hero)} nhận: ${(e.items || []).map((id) => { const I = (G.GOLDEN && G.GOLDEN[id]) || (G.SHARDS && G.SHARDS[id] && { icon: '✨', name: G.SHARDS[id].n }); return I ? `<b style="color:#fff099">${I.icon} ${esc(I.name)}</b>` : ''; }).join(', ')}`;
        case 'tree_x': return `🌟 ${nm(e.hero)} (Ý Niệm Rực Rỡ) mở thêm lựa chọn cấp ${e.lv}: <b>${esc(e.name || '')}</b>`;
        case 'duel_gate': return `⚔ cổng quyết đấu mở (${esc(G.MAP.regionAt(e.x, e.y).name)})`;
        case 'duel_join': return `⚔ ${nm(e.hero)} ghi danh quyết đấu`;
        case 'duel_start': return `⚔ quyết đấu: ${nm(e.a)} vs ${nm(e.b)}`;
        case 'duel_end': return e.winner ? `🏆 ${nm(e.winner)} thắng quyết đấu ${nm(e.loser)} (${Math.round(e.dur)}s)` : '⚔ quyết đấu hòa';
        case 'duel_close': return '⚔ cổng quyết đấu đóng';
        case 'soul_drop': { const T = G.SOUL_TIER[e.best]; return `💠 ${nm(e.hero)} rơi ${e.n} mảnh hồn${T ? ` (cao nhất <b style="color:${T.color}">${T.name}</b>)` : ''}`; }
        case 'soul': { const T = G.SOUL_TIER[e.tier], D = G.SHARDS[e.shard]; return `<span style="color:${T.color}">💠</span> ${nm(e.hero)} nhận <b style="color:${T.color}">${D ? G.shardIcon(e.shard) + ' ' + esc(D.n) : 'mảnh hồn'} [${T.name}]</b>${e.perk && G.SOUL_PERK[e.perk] ? ` + ${G.SOUL_PERK[e.perk].icon} <b>${esc(G.SOUL_PERK[e.perk].name)}</b>` : ''}${e.on === false ? ' <small>(cất túi — chưa đủ ô Ý Niệm)</small>' : ''}${e.from ? ' <small>(' + esc(e.from) + ')</small>' : ''}`; }
        case 'chest': return `🎁 ${nm(e.hero)} mở rương${e.items && e.items.length ? ': ' + e.items.map((id) => G.CONSUMABLES[id].icon + ' ' + esc(G.CONSUMABLES[id].name)).join(', ') : ''}${e.extra === 'bag' ? ' <b>+ nâng balo</b>' : e.extra === 'yniem' ? ' <b>+ ý niệm</b>' : ''}`;
        case 'truce': return e.trade ? `⚖ ${nm(e.hero)} gạ ${nm(e.other)} đình chiến mua bán` : `🤝 ${nm(e.hero)} và ${nm(e.other)} kết liên minh tạm thời`;
        case 'truce_no': return `🤝 ${nm(e.other)} từ chối liên minh với ${nm(e.hero)}`;
        case 'truce_end': return `💔 liên minh ${nm(e.hero)} – ${nm(e.other)} tan${e.reason === 'time' ? ' (hết hạn)' : e.reason === 'few' ? ' (chỉ còn ít người)' : e.reason === 'hit' ? ` (${e.by ? nm(e.by) : 'một bên'} đánh trúng đồng minh)` : e.reason === 'dead' ? ' (một bên đã gục)' : e.reason === 'bluff' ? ` (${e.by ? nm(e.by) : 'một bên'} bị phát hiện bịp)` : ''}`;
        case 'soul_eject': { const T = G.SOUL_TIER[e.tier], D = G.SHARDS[e.shard], B = e.by && G.SHARDS[e.by]; return `💠 ${nm(e.hero)}${B ? ` gắn <b>${G.shardIcon(e.by)} ${esc(B.n)}</b> —` : ''} mảnh <b style="color:${T.color}">${D ? G.shardIcon(e.shard) + ' ' + esc(D.n) : ''} [${T.name}]</b> văng ra đất`; }
        case 'trade': { const sh = (id, t) => { const D = G.SHARDS[id], T = G.SOUL_TIER[t]; return D ? `<b style="color:${T.color}">${G.shardIcon(id)} ${esc(D.n)}</b>` : ''; }; const it = (id) => (G.CONSUMABLES[id] ? G.CONSUMABLES[id].icon + ' ' + esc(G.CONSUMABLES[id].name) : '');
          if (e.merchant) return e.merchant === 'buy' ? `⚖ ${nm(e.hero)} mua ${sh(e.shard, e.tier)} của ${nm(e.other)} giá ${e.price} vàng` : `⚖ ${nm(e.hero)} bán ${e.item ? it(e.item) : sh(e.shard, e.tier)} cho ${nm(e.other)} giá ${e.price} vàng`;
          if (e.sell) return `💰 ${nm(e.other)} mua ${e.sell.shard ? sh(e.sell.shard, e.sell.tier) : it(e.sell.item)} của ${nm(e.hero)} giá ${e.price} vàng`;
          return e.bag ? `🔄 ${nm(e.hero)} và ${nm(e.other)} đổi đồ${e.bag.ia ? ': ' + it(e.bag.ia) : ''}${e.bag.ib ? ' ⇄ ' + it(e.bag.ib) : ''}` : `🔄 ${nm(e.hero)} đổi ${sh(e.give, e.gt)} lấy ${sh(e.take, e.tt)} của ${nm(e.other)} — cả hai cùng lợi`; }
        case 'bluff': { const sh = (id, t) => { const D = G.SHARDS[id], T = G.SOUL_TIER[t]; return D ? `<b style="color:${T.color}">${G.shardIcon(id)} ${esc(D.n)}</b>` : ''; };
          if (e.kind === 'sell') return `🃏 ${nm(e.hero)} <b>bán mảnh dỏm</b> ${sh(e.give, e.gt)} cho ${nm(e.other)} giá ${e.price} vàng`;
          return e.kind === 'trade' ? `🃏 ${nm(e.hero)} <b>bịp</b> ${nm(e.other)}: đổi ${sh(e.give, e.gt)} lấy ${sh(e.take, e.tt)}` : `🃏 ${nm(e.hero)} <b>báo tin giả</b> cho ${nm(e.other)} để ôm ${esc(e.what || 'của')} một mình`; }
        case 'bluff_caught': return `🤨 ${nm(e.other)} nhìn thấu trò ${e.kind === 'trade' ? 'đổi gian' : e.kind === 'sell' ? 'bán hàng dỏm' : 'tin giả'} của ${nm(e.hero)}`;
        case 'bluff_found': return `😤 ${nm(e.other)} vỡ lẽ bị ${nm(e.hero)} ${e.kind === 'trade' ? 'đổi gian' : e.kind === 'sell' ? 'bán hàng dỏm' : 'lừa đi chỗ khác'}`;
        case 'house_split': return `⚡ ${nm(e.hero)} bất ngờ trở mặt với ${nm(e.other)}${e.why === 'drop' ? ' — vì thính' : e.why === 'final' ? ' — vòng cuối' : ''}`;
        case 'interv': { const I = G.INTERV && G.INTERV[e.kind]; return I ? `💸 Bạn can thiệp: ${I.icon} <b>${esc(I.name)}</b>` : null; }
        case 'backstab': return `🎭 ${nm(e.hero)} đâm sau lưng ${nm(e.other)}!`;
        case 'kamikaze': return `💣 ${nm(e.hero)} liều mạng — tung hết mọi thứ!`;
        case 'ward': return `🛡 ${nm(e.hero)} âm thầm bảo vệ ${nm(e.ward)}`;
        case 'barrel': return `💥 thùng thuốc nổ phát nổ${e.by ? ' (' + nm(e.by) + ' kích nổ)' : ''}${e.hit ? ` — trúng ${e.hit} tướng` : ''}`;
        case 'perk_revive': { const PK = G.SOUL_PERK[e.perk]; return `${PK.icon} ${nm(e.hero)} hồi sinh nhờ <b>${esc(PK.name)}</b>${e.perk === 'van_menh' ? ' — mảnh hồn vỡ' : ' — bất tử 90s'}`; }
        case 'chest_wave': return `🎁 ${e.n} rương đồ mới xuất hiện trong bo`;
        case 'trap': return `🪤 ${nm(e.hero)} dính bẫy của ${nm(e.by)}`;
        case 'fu_ho': return `🧿 Phù Hộ Mệnh cứu ${nm(e.hero)} khỏi cái chết${e.by ? ' (' + nm(e.by) + ')' : ''}`;
        case 'yniem': { const T = G.SOUL_TIER[e.tier]; return `🗡 ${nm(e.hero)} lên ý niệm <b style="color:${T.color}">${G.YNIEM_NAME[e.tier]}</b>${e.from ? ' <small>(' + esc(e.from) + ')</small>' : ''}`; }
        case 'end': return `🏆 hết trận — ${e.heroes.map(nm).join(', ')}${e.heroes.length > 1 ? ' đồng hạng 1' : ' vô địch'}`;
        default: return null;
      }
    }
    renderBoard() {
      const m = this.m;
      const CAT = { ad: '⚔', ap: '✨', def: '🛡', sup: '💠', boots: '👢', active: '⚡' };
      const items = (h) => h.items.map((id) => { const it = G.ITEMS[id]; return it ? `<span class="it${it.isComp ? ' comp' : ''}" title="${esc(it.name + (it.desc ? ' — ' + it.desc : ''))}">${CAT[it.cat] || '•'}${esc((it.short || it.name).split(' ').map((w) => w[0]).join(''))}</span>` : ''; }).join('');
      // thứ tự: còn trong trận (theo mạng, máu) rồi tới người bị loại (theo hạng)
      const list = m.heroes.slice().sort((a, b) => (a.out ? 1 : 0) - (b.out ? 1 : 0) || (a.out ? a.place - b.place : (b.stats.k - a.stats.k) || (b.alive ? b.hpPct : 0) - (a.alive ? a.hpPct : 0)));
      const rows = list.map((h) => `<tr class="${h.out ? 'dead' : ''}" data-id="${h.id}"><td>${h.out ? h.place : '–'}</td><td><span class="dot" style="background:${h.hero.color};box-shadow:0 0 0 2px ${slot(h)}"></span>${esc(nameOf(h))}</td>
        <td>${h.pers ? h.pers.icon + ' ' + esc(h.pers.name) : ''}</td><td>${h.level}</td><td>${h.stats.k}${h.stats.vulture ? ' <small>🦅' + h.stats.vulture + '</small>' : ''}</td><td>${h.stats.d}</td>
        <td>${h.stats.camps || 0}</td><td>${h.stats.drops || 0}</td><td>${(h.souls || []).map((x) => `<i class="sdot" style="background:${G.SOUL_TIER[x.tier].color}"></i>`).join('')}</td><td>${U.fmt(h.gold)}</td><td>${U.fmt(h.stats.dmgHero || 0)}</td><td class="its">${items(h)}</td></tr>`).join('');
      this.$('board').innerHTML = `<table><thead><tr><th>Hạng</th><th>Tướng</th><th>Tính cách</th><th>Cấp</th><th>Mạng</th><th>Chết</th><th>Quái</th><th>Thính</th><th>Mảnh hồn</th><th>Vàng</th><th>ST tướng</th><th>Trang bị</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
  }
  G.Hud = Hud;
  G.esc = esc;
})();
