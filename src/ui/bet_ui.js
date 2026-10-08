'use strict';
// ===== GĐ9b: GIAO DIỆN CƯỢC — ván (run), trước trận, câu hỏi giữa trận, can thiệp, sau trận, cửa hàng, chỉ tiêu, kết thúc =====
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const $ = (s) => document.querySelector(s);
  const esc = (s) => G.esc(String(s == null ? '' : s));
  const fmt = (n) => (G.U && G.U.fmt ? G.U.fmt(Math.round(n)) : String(Math.round(n)));
  const KEY = 'kdc_run_v1';
  const hn = (id) => (G.HEROES[id] ? G.HEROES[id].name : id);
  const dot = (id) => `<span class="dot" style="background:${G.HEROES[id] ? G.HEROES[id].color : '#888'}"></span>`;
  const Q = () => G.BET_Q, CHm = () => G.CHARMS;

  const BetUI = {
    run: null, bk: null, sel: null,
    // ---------- lưu / tải ----------
    load() { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); return o && o.v ? G.Run.from(o) : null; } catch (e) { return null; } },
    save() { try { if (this.run && !this.run.over) localStorage.setItem(KEY, JSON.stringify(this.run)); else localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ } },
    saved() { const r = this.load(); return r && !r.over ? r : null; },
    newRun() { this.run = new G.Run('run-' + Math.floor(Math.random() * 1e9).toString(36)); this.run.lastLine = G.HOUSE_LINES.greet[0]; this.save(); this.hub(); },
    resume() {
      this.run = this.load(); if (!this.run) return G.App.menu();
      // thoát giữa trận = bỏ trận (tiền cược đã trừ, không được hoàn)
      if (this.run.live) { const n = this.run.live; this.run.live = null; this.run.log.push({ t: n, txt: `Trận ${n}: bạn ta bỏ ngang — tiền đã cược nhà cái giữ.` }); this.run.afterMatch({ delta: 0 }); this.save(); return this.shop(); }
      if (this.run.shop && this.run.idx > 0 && !this.run.shopLeft) return this.shop();
      this.hub();
    },
    screen(html) {
      if (!$('#run')) { const d = document.createElement('div'); d.id = 'run'; d.className = 'screen hidden'; document.body.appendChild(d); }
      G.App.show('run'); $('#run').innerHTML = html; $('#run').scrollTop = 0; },
    houseBox(line) {
      const r = this.run, mood = G.HOUSE_LINES.mood[r.mood()];
      return `<div class="house"><div class="hface">🎩<span class="hm">${mood}</span></div><div class="hsay">“${esc(line || r.lastLine || '')}”<small>— Nhà cái</small></div></div>`;
    },
    statusBar() {
      const r = this.run, B = G.BET, q = r.quotaNeed(), k = Math.min(1, r.money / Math.max(1, q));
      const left = B.stages.slice(r.stage).reduce((a, s, i, arr) => a + Math.round((i ? s.quota : r.quota()) * (r.stage + i >= B.stages.length - 1 ? 1 : B.installment)), 0) + r.loanDue();
      return `<div class="bstat"><span>💰 <b>${fmt(r.money)}</b></span>${r.final ? '<span>⚠ <b>TRẬN CỦA NHÀ CÁI</b></span>' : `<span>Chặng <b>${r.stage + 1}/${B.stages.length}</b> • trận <b>${Math.min(r.idx + 1, B.perStage)}/${B.perStage}</b></span>
        <span>🎯 Cần có khi hết chặng: <b>${fmt(q)}</b> <i class="qbar"><i style="width:${Math.round(k * 100)}%"></i></i> <small class="dim">${r.quotaPay() ? `(nộp ${fmt(r.quotaPay())})` : '(chỉ cần đạt mốc)'}</small></span><span class="dim">Nợ còn phải trả ${fmt(left)}</span>`}
        ${r.loans.length ? `<span>🧾 Vay ${r.loans.map((l) => fmt(l.due)).join(' + ')}</span>` : ''}</div>`;
    },
    charmRow(canDrop) {
      const r = this.run, B = G.BET, cells = [];
      for (let i = 0; i < B.slots; i++) {
        const id = r.charms[i], C = id && CHm()[id];
        cells.push(C ? `<div class="charm ${C.kind}" title="${esc(C.desc)}"><span class="ci">${C.icon}</span><b>${esc(C.name)}</b><small>${esc(C.desc)}</small>${canDrop && C.kind !== 'bad' ? `<button data-drop="${id}">bỏ</button>` : ''}</div>` : '<div class="charm empty">ô trống</div>');
      }
      return `<div class="charms">${cells.join('')}</div>`;
    },
    bindDrop() { for (const b of document.querySelectorAll('#run [data-drop]')) b.onclick = () => { this.run.drop(b.dataset.drop); this.save(); this.refreshCur(); }; },
    refreshCur() { if (this.cur === 'shop') this.shop(); else this.hub(); },
    // ---------- màn chờ giữa các trận ----------
    hub() {
      const r = this.run; this.cur = 'hub';
      if (r.over) return this.end();
      const log = r.log.slice(-12).reverse().map((x) => `<li>${esc(x.txt)}</li>`).join('');
      this.screen(`${this.houseBox()}${this.statusBar()}
        <h3>🧿 Charm <small class="dim">(${r.charms.length}/${G.BET.slots} ô)</small></h3>${this.charmRow(true)}
        <div class="row btns"><button class="big" id="hGo">▶ ${r.final ? 'Vào trận của nhà cái' : `Vào trận ${r.matchNo()}/${r.totalMatches()}`}</button><button id="hMenu">← Màn hình chính</button><button id="hQuit" class="red">🏳 Bỏ ván</button></div>
        <details class="blog"><summary>📖 Nhật ký nhà cái (${r.log.length})</summary><ul>${log || '<li class="dim">chưa có gì</li>'}</ul></details>
        <details class="blog"><summary>📜 Luật chơi</summary><div class="hint">Bạn nợ nhà cái. Mỗi chặng 3 trận; hết chặng phải <b>có đủ chỉ tiêu</b> (thiếu là thua); chặng cuối trả hết nợ (kể cả tiền vay) thì được tự do. Trước trận nhà cái hỏi câu đầu (Ai sống tới cuối / Ai Top 1 / Top 3) và có thể mời ký <b>Giao Kèo N câu</b> (N câu tiếp theo trong trận đều đúng thì ×10 tiền giao kèo; các câu này ở dạng dễ hơn — có / không — nhưng hay có điều khoản chữ nhỏ; sai một câu, kể cả bỏ qua, là mất sạch; không được hủy). Giữa trận, khi có giao tranh / boss / thính… nhà cái tạm dừng để hỏi tiếp. Có thể trả tiền để <b>can thiệp</b> (gọi thính, hồi boss, thu bo) — làm thế khi đang có kèo là "Phô Mai", nhà cái không vui. Nhà cái <b>không trung thực</b>: sức mạnh ước lượng có sai số, có tướng bị thổi phồng, tin đồn có tin giả, và một số tướng là <b>người của nhà cái</b> (không đánh nhau, có thể cùng sống tới cuối → đồng hạng). Luật luôn được ghi ra — kể cả điều khoản chữ nhỏ. Sau mỗi trận: cửa hàng charm (chọn 1 trong 3), quà của nhà cái (có mặt trái), vay tiền (nhận charm xấu).</div></details>`);
      this.bindDrop();
      $('#hGo').onclick = () => this.pre();
      $('#hMenu').onclick = () => G.App.menu();
      $('#hQuit').onclick = () => G.Dlg.confirm('Bỏ ván cược này? Mất hết tiến độ.', 'Bỏ ván', 'Thôi').then((ok) => { if (ok) { this.run.over = true; this.run.result = 'quit'; this.save(); G.App.menu(); } });
    },
    // ---------- trước trận ----------
    pre() {
      const r = this.run; this.cur = 'pre';
      if (r.final) r.lastLine = G.HOUSE_LINES.finalIntro[0];
      const cfg = r.nextConfig();
      const m = new G.Match(Object.assign({}, cfg, { fx: true }));
      const bk = new G.Bookie(m, r);
      if (r.final) bk.say(G.HOUSE_LINES.finalIntro[0]);
      bk.startQuestion();
      this.bk = bk; this.m = m; this.cfg = cfg;
      this.sel = { mode: 'survive', ids: [], stake: Math.min(r.money, Math.max(G.BET.minBet, Math.round(r.money * 0.1 / 10) * 10)), contract: false, cstake: Math.max(G.BET.minBet, Math.round(r.money * 0.05 / 10) * 10) };
      this.renderPre();
    },
    renderPre() {
      const r = this.run, bk = this.bk, P = bk.pre, S = this.sel, doc = r.has('doc_chu');
      const mode = S.mode, rows = P.rows;
      const cards = rows.map((row) => {
        const i = S.ids.indexOf(row.id), on = i >= 0;
        const odd = mode === 'top1' ? row.o1 : mode === 'survive' ? row.oS : null;
        return `<div class="bcard${on ? ' on' : ''}" data-id="${row.id}" style="--slot:${G.SLOT_COL[row.slot]}">
          <div class="bh">${dot(row.id)}<b>${esc(hn(row.id))}</b>${on && mode === 'top3' ? `<span class="ord">${i + 1}</span>` : ''}${P.spy === row.id ? '<span class="spy" title="Tình Báo">🕵 người của nhà cái</span>' : ''}</div>
          <div class="bp">${row.pers.icon} ${esc(row.pers.name)}</div>
          <div class="be"><small>Sức mạnh (nhà cái ước)</small> <i class="ebar"><i style="width:${Math.min(100, row.est)}%"></i></i> <b>${row.est}</b></div>
          <div class="bo">${odd ? `<b>×${odd.toFixed(2)}</b>` : `<small>Top 3 ~${Math.round(row.p3 * 100)}%</small>`}</div></div>`;
      }).join('');
      const stakeMax = r.money - (S.contract ? S.cstake : 0);
      const pay = this.prePay();
      const fine = mode === 'top1' ? `<div class="fine${doc ? ' doc' : ''}">* ${esc(G.BET_FINE.top1.solo)}</div>` : mode === 'top3' ? `<div class="fine${doc ? ' doc' : ''}">* Đúng cả 3 đúng thứ tự ×6 • đúng 2 vị trí ×3 • đủ 3 người sai thứ tự ×2 • đúng 1 vị trí ×1 (hoàn tiền) • còn lại mất. Hệ số nhân thêm độ khó; chọn toàn cửa trên thì giảm một nửa.</div>` : '';
      this.screen(`${this.houseBox(bk.talk.length ? bk.talk[bk.talk.length - 1].txt : '')}${this.statusBar()}
        <div class="qq">${Q()[mode].icon} <b>${esc(bk.pending.text)}</b></div>
        <div class="row btns modes">${['survive', 'top1', 'top3'].map((k) => `<button data-mode="${k}" class="${k === mode ? 'on' : ''}">${Q()[k].icon} ${Q()[k].short}</button>`).join('')}<span class="hint">${mode === 'top3' ? 'Chạm 3 tướng theo thứ tự hạng 1 → 3' : 'Chạm 1 tướng'}</span></div>
        <div class="bgrid">${cards}</div>
        ${fine}
        <div class="row stake"><label>💵 Tiền cược <input id="pStake" type="number" min="${G.BET.minBet}" step="10" value="${S.stake}"></label>${this.quick('p', stakeMax)}<span>→ thắng được <b id="pPay">${pay ? fmt(pay) : '—'}</b></span></div>
        <div class="contract${S.contract ? ' on' : ''}"><label><input type="checkbox" id="pCon" ${S.contract ? 'checked' : ''}> 📜 Ký <b>Giao Kèo ${bk.pending.contractN} câu</b>: ${bk.pending.contractN} câu hỏi tiếp theo trong trận (dạng dễ: có / không) đều đúng → nhận <b>×10</b> tiền giao kèo + tiền thắng từng câu. Sai 1 câu (kể cả bỏ qua) là mất sạch. Không được hủy.</label>
          ${S.contract ? `<label>Tiền giao kèo <input id="pCst" type="number" min="${G.BET.minBet}" step="10" value="${S.cstake}"></label>` : ''}</div>
        <details class="blog" open><summary>🗣 Tin đồn trước trận</summary><ul>${P.rumors.map((x) => `<li>${esc(x.txt)}</li>`).join('')}</ul></details>
        <div class="row btns"><button class="big" id="pGo">✅ Chốt kèo & vào trận</button><button id="pSkip">⏭ Không cược câu đầu</button><button id="pBack">← Quay lại</button></div>
        <p class="hint">Tỷ lệ là của nhà cái (đã trừ phần ăn chia ~${Math.round(P.margin * 100)}%). Sức mạnh ước lượng có sai số${r.has('kinh_lup') ? ' — Kính Lúp: số thật' : ''}.</p>`);
      for (const b of document.querySelectorAll('#run [data-mode]')) b.onclick = () => { S.mode = b.dataset.mode; S.ids = S.mode === 'top3' ? S.ids.slice(0, 3) : S.ids.slice(0, 1); this.renderPre(); };
      for (const c of document.querySelectorAll('#run .bcard')) c.onclick = () => {
        const id = c.dataset.id, i = S.ids.indexOf(id);
        if (i >= 0) S.ids.splice(i, 1); else if (S.mode === 'top3') { if (S.ids.length < 3) S.ids.push(id); } else S.ids = [id];
        this.renderPre();
      };
      const st = $('#pStake'); st.oninput = () => { S.stake = +st.value || 0; $('#pPay').textContent = this.prePay() ? fmt(this.prePay()) : '—'; };
      this.bindQuick('p', (v) => { S.stake = v; this.renderPre(); });
      $('#pCon').onchange = (e) => { S.contract = e.target.checked; this.renderPre(); };
      if ($('#pCst')) $('#pCst').oninput = (e) => { S.cstake = +e.target.value || 0; };
      $('#pGo').onclick = () => this.commitPre(false);
      $('#pSkip').onclick = () => this.commitPre(true);
      $('#pBack').onclick = () => this.hub();
    },
    prePay() {
      const S = this.sel, P = this.bk.pre;
      if (S.mode === 'top3') return S.ids.length === 3 ? S.stake * 6 : 0;
      const row = P.rows.find((x) => x.id === S.ids[0]); if (!row) return 0;
      return S.stake * (S.mode === 'top1' ? row.o1 : row.oS);
    },
    quick(pfx, max) {
      const B = G.BET, v = [B.minBet, Math.round(max * 0.1 / 10) * 10, Math.round(max * 0.25 / 10) * 10, Math.round(max * 0.5 / 10) * 10, Math.floor(max / 10) * 10].filter((x, i, a) => x >= B.minBet && a.indexOf(x) === i);
      return `<span class="quick">${v.map((x, i) => `<button data-q${pfx}="${x}">${i === v.length - 1 ? 'Tất tay ' : ''}${fmt(x)}</button>`).join('')}</span>`;
    },
    bindQuick(pfx, fn) { for (const b of document.querySelectorAll(`[data-q${pfx}]`)) b.onclick = () => fn(+b.dataset['q' + pfx]); },
    commitPre(skip) {
      const S = this.sel, bk = this.bk, r = this.run;
      const pick = skip ? { skip: true } : { mode: S.mode, ids: S.ids, stake: S.stake };
      if (S.contract) pick.contract = S.cstake;
      if (!skip && (S.mode === 'top3' ? S.ids.length !== 3 : S.ids.length !== 1)) return G.Dlg.alert(S.mode === 'top3' ? 'Chọn đủ 3 tướng theo thứ tự.' : 'Chọn một tướng.');
      if (!skip && S.stake + (S.contract ? S.cstake : 0) > r.money) return G.Dlg.alert('Không đủ tiền.');
      const err = bk.answerStart(pick);
      if (err) return G.Dlg.alert(err);
      r.live = r.matchNo(); this.save();
      G.App.startBetMatch(this.m, bk);
      this.mountHud();
    },
    // ---------- trong trận ----------
    mountHud() {
      const root = $('#match');
      let bar = $('#betbar'); if (!bar) { bar = document.createElement('div'); bar.id = 'betbar'; root.appendChild(bar); }
      let qb = $('#qbox'); if (!qb) { qb = document.createElement('div'); qb.id = 'qbox'; qb.className = 'hidden'; root.appendChild(qb); }
      bar.classList.remove('hidden');
      this.barHtml = ''; this.updateBar();
    },
    unmountHud() { for (const id of ['#betbar', '#qbox', '#qinspect-bar']) { const e = $(id); if (e) e.classList.add('hidden'); } },
    updateBar() {
      const bk = this.bk, bar = $('#betbar'); if (!bk || !bar) return;
      const open = bk.bets.filter((b) => b.status === 'open');
      const c = bk.contract;
      const html = `<span class="bm">💰 ${fmt(this.run.money)}</span>${c ? `<span class="bc${c.ok ? '' : ' bad'}">📜 ${c.ok ? `Giao kèo ${c.n}/${c.need}${c.n >= c.need ? ' ✔' : ''}` : 'Giao kèo vỡ'}</span>` : ''}
        <span class="bo" title="${esc(open.map((b) => this.betText(b)).join(' • '))}">🎟 ${open.length} kèo</span>`;
      if (html !== this.barHtml) { this.barHtml = html; bar.innerHTML = html; }
      // đánh dấu tướng đang có kèo trên danh sách tướng
      const ids = new Set();
      for (const b of open) { if (b.start) for (const id of b.ids) { const h = bk.m.heroes.find((x) => x.heroId === id); if (h) ids.add(h.id); } else { const o = b.q.opts.find((x) => x.key === b.key); if (o && o.hero) ids.add(o.hero.id); } }
      const rows = G.App.hud && G.App.hud.rows; if (rows) for (const [id, row] of rows) row.classList.toggle('betOn', ids.has(id));
    },
    betText(b) {
      if (b.start) return `${Q()[b.mode].short}: ${b.ids.map(hn).join(' > ')} (${fmt(b.stake)})`;
      const o = b.q.opts.find((x) => x.key === b.key);
      return `${Q()[b.q.type].short}: ${o.hero ? o.hero.hero.name : o.label} ×${o.odds.toFixed(2)} (${fmt(b.stake)})`;
    },
    // câu hỏi giữa trận: dừng trận, hiện hộp câu hỏi
    onQuestion(q) {
      const app = G.App; this.prevSpeed = app.speed || app.pref.speed || 2; app.setSpeed(0);
      const r = app.r;
      if (q.a) { r.cam.follow = true; r.cam.focusId = q.a.id; } else if (q.x != null) { r.cam.follow = false; r.cam.x = q.x; r.cam.y = q.y; r.clampCam(); }
      this.qStake = Math.min(this.run.money, Math.max(G.BET.minBet, Math.round(this.run.money * 0.05 / 10) * 10));
      this.qKey = null;
      this.renderQ();
      G.Sound && G.Sound.play && G.Sound.play('magic_spell', { vol: 0.4 });
    },
    renderQ() {
      const q = this.bk.pending, qb = $('#qbox'); if (!q || !qb) return;
      const run = this.run, doc = run.has('doc_chu'), T = Q()[q.type] || { icon: '❓', name: 'Câu hỏi' };
      let title = T.name;
      if (q.type === 'fight' || q.type === 'vulture') title += ` <small>${esc(q.a.hero.name)} ⚔ ${esc(q.b.hero.name)}</small>`;
      else if (q.type === 'solo_duel') title += ` <small>${esc(q.a.hero.name)} ⚔ ${esc(q.b.hero.name)} (Không Gian Riêng)</small>`;
      if (q.type === 'boss') title += ` <small>${esc((G.BOSSES[q.bossId] || {}).name || 'boss')}</small>`;
      const spy = (q.type === 'fight' || q.type === 'solo_duel') && run.has('ong_nhom') ? `<div class="hint">🔭 ${[q.a, q.b].map((h) => `${esc(h.hero.name)}: cấp ${h.level}, máu ${Math.round(h.hpPct * 100)}%, sức mạnh ${Math.round(this.bk.power(h))}`).join(' • ')} • tỷ lệ thật ~${Math.round(q.opts[0].p * 100)}/${Math.round(q.opts[1].p * 100)}</div>` : '';
      const opts = q.opts.map((o) => `<button class="qo${this.qKey === o.key ? ' on' : ''}" data-k="${o.key}">${o.hero ? `${dot(o.hero.heroId)} ${esc(o.hero.hero.name)} <small>${Math.round(o.hero.hpPct * 100)}%</small>` : esc(o.label)} <b>×${o.odds.toFixed(2)}</b></button>`).join('');
      const say = q.type === 'fight' ? 'Giao tranh nổ ra rồi, bạn ta. Ai sẽ là người thắng chung cuộc?' : q.type === 'solo_duel' ? 'Nhà cái bắt 2 thí sinh vào Không Gian Riêng solo! Ai sẽ thắng? Hay hòa/hết giờ?' : q.type === 'boss' ? 'Có kẻ động vào boss. Ai ra đòn cuối?' : q.type === 'drop' ? 'Thính sắp rơi. Ai mở được?' : q.type === 'death' ? 'Đoán xem — ai gục tiếp theo?' : 'Hai kẻ đánh nhau lâu quá… có con kền kền nào không?';
      qb.innerHTML = `<div class="qin">${this.houseBoxMini(say)}
        <div class="qq">${T.icon} <b>${title}</b>${q.contract ? ' <span class="tagc">📜 trong giao kèo</span>' : ''}</div>${spy}
        <div class="qopts">${opts}</div>
        ${q.fine ? `<div class="fine${doc ? ' doc' : ''}">* ${esc(q.fine)}</div>` : ''}
        <div class="row stake"><label>💵 <input id="qStake" type="number" min="${G.BET.minBet}" step="10" value="${this.qStake}"></label>${this.quick('q', run.money)}</div>
        <div class="row btns"><button class="big" id="qGo" ${this.qKey ? '' : 'disabled'}>✅ Đặt</button><button id="qSkip">${q.contract ? '⏭ Bỏ qua (VỠ giao kèo!)' : '⏭ Bỏ qua'}</button><button type="button" id="qInspect">👁 Xem tình hình trận đấu</button>${run.has('lat_cau') && !this.bk.rerolled ? '<button id="qRe">🔄 Lật câu hỏi</button>' : ''}</div></div>`;
      qb.classList.remove('hidden');
      for (const b of qb.querySelectorAll('.qo')) b.onclick = () => { this.qKey = b.dataset.k; this.renderQ(); };
      $('#qStake').oninput = (e) => { this.qStake = +e.target.value || 0; };
      this.bindQuick('q', (v) => { this.qStake = v; this.renderQ(); });
      $('#qGo').onclick = () => { const err = this.bk.answer(this.qKey, this.qStake); if (err) return G.Dlg.alert(err); this.closeQ(); };
      $('#qSkip').onclick = () => { this.bk.skip(); this.closeQ(); };
      $('#qInspect').onclick = () => this.inspectMatch();
      if ($('#qRe')) $('#qRe').onclick = () => { const n = this.bk.reroll(); if (n) this.onQuestion(n); };
    },
    inspectMatch() {
      $('#qbox').classList.add('hidden');
      let bar = $('#qinspect-bar');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'qinspect-bar';
        $('#match').appendChild(bar);
      }
      bar.className = 'qinspect-bar';
      bar.innerHTML = `<span class="qinspect-txt">⏸ <b>Trận đấu đang tạm dừng</b> — Chạm thí sinh hoặc kéo bản đồ để xem tình hình</span><button id="qResumeBet" class="big">📋 Quay lại đặt cược</button>`;
      $('#qResumeBet').onclick = () => {
        bar.remove();
        $('#qbox').classList.remove('hidden');
      };
      G.App.setSpeed(0);
    },
    houseBoxMini(say) { return `<div class="house mini"><div class="hface">🎩<span class="hm">${G.HOUSE_LINES.mood[this.run.mood()]}</span></div><div class="hsay">“${esc(say)}”</div></div>`; },
    closeQ() {
      const q = this.bk && this.bk.pending;
      const jumpHero = q && (q.type === 'fight' || q.type === 'solo_duel') && q.a ? q.a : null;
      $('#qbox').classList.add('hidden');
      const ibar = $('#qinspect-bar'); if (ibar) ibar.remove();
      G.App.setSpeed(this.prevSpeed || 2);
      if (jumpHero) {
        G.App.r.cam.follow = true;
        G.App.r.cam.focusId = jumpHero.id;
      } else {
        G.App.r.cam.focusId = null;
        G.App.r.cam.follow = true;
      }
      this.updateBar();
    },
    // thông báo kết quả kèo vừa phân xử
    notify() {
      const bk = this.bk; if (!bk) return;
      for (const b of bk.bets) if (b.status !== 'open' && !b.shown) {
        b.shown = true;
        if (b.start) continue;
        const qName = Q()[b.q.type] ? Q()[b.q.type].short : 'Kèo';
        if (b.status === 'won') {
          const t = `🎉 CHÚC MỪNG! BẠN ĐÃ THẮNG KÈO "${qName}" +${fmt(b.payout)}${b.contract ? ' (giữ trong giao kèo)' : ''}`;
          G.App.hud.banner(t, 'gold');
          G.Sound && G.Sound.play && G.Sound.play('applause');
        } else if (b.status === 'void') {
          G.App.hud.banner(`↩ Kèo "${qName}" hủy — hoàn ${fmt(b.stake)}`, 'blue');
        } else {
          G.App.hud.banner(`❌ Thua kèo "${qName}" −${fmt(b.stake)}`, 'red');
        }
      }
      const last = bk.talk[bk.talk.length - 1];
      if (last && last !== this.lastTalk) { this.lastTalk = last; if (last.t > 0) G.App.hud.banner('🎩 ' + last.txt, last.kind === 'cheese' ? 'red' : 'gold'); }
      this.updateBar();
    },
    // ---------- sau trận ----------
    after(m) {
      const r = this.run, bk = this.bk;
      this.unmountHud();
      const sum = bk.finish();
      r.live = null;
      r.lastLine = bk.talk.length ? bk.talk[bk.talk.length - 1].txt : '';
      const extra = r.afterMatch(sum);
      this.save();
      const tops = m.heroes.filter((h) => h.place === 1).map((h) => h.hero.name);
      const rows = bk.bets.map((b) => `<tr class="${b.status}"><td>${b.start ? '🎯' : Q()[b.q.type].icon}</td><td>${esc(this.betText(b))}</td><td>${b.status === 'won' ? `✅ +${fmt(b.payout)}` : b.status === 'void' ? '↩ hoàn tiền' : b.status === 'lost' ? '❌ thua' : '…'}</td></tr>`).join('');
      const rank = m.heroes.slice().sort((a, b) => (a.place || 99) - (b.place || 99)).map((h) => `<span class="rk">${h.place === 1 ? '🏆' : h.place}. ${dot(h.heroId)} ${esc(h.hero.name)}${(bk.house.includes(h.heroId)) ? ' <small title="người của nhà cái">🎩</small>' : ''}</span>`).join('');
      const L = [...sum.lines, ...extra];
      this.screen(`${this.houseBox(r.lastLine)}
        <h2 class="gold">🏁 ${tops.length > 1 ? `${tops.join(', ')} ĐỒNG HẠNG 1` : tops.length ? tops[0] + ' VÔ ĐỊCH' : 'Không ai sống sót'}</h2>
        <div class="ranks">${rank}</div>
        <p class="hint">${bk.house.length ? '🎩 = người của nhà cái trận này (giờ mới lộ).' : 'Trận này nhà cái không cài người.'}</p>
        <table class="score bets"><tbody>${rows || '<tr><td colspan="3" class="dim">Không đặt kèo nào</td></tr>'}</tbody></table>
        ${L.length ? `<ul class="blines">${L.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <h3>Trận này: <span class="${sum.delta >= 0 ? 'gold' : 'warn'}">${sum.delta >= 0 ? '+' : ''}${fmt(sum.delta)}</span> • 💰 còn ${fmt(r.money)}</h3>
        <div class="row btns"><button class="big" id="aNext">${r.over ? 'Xem kết cục' : '→ Cửa hàng'}</button><button id="aReplay">🔁 Xem lại trận</button></div>`);
      $('#aNext').onclick = () => (r.over ? this.end() : this.shop());
      $('#aReplay').onclick = () => { G.App.afterReplay = () => this.after2(); G.App.startMatch(Object.assign({}, this.cfg, { interv: m.intervLog.slice() })); };
      this.lastAfter = { m, sum, extra };
    },
    after2() { return this.run.over ? this.end() : this.shop(); },
    // ---------- cửa hàng ----------
    shop() {
      const r = this.run; this.cur = 'shop';
      if (!r.shop) r.shop = r.makeShop();
      const S = r.shop;
      const offers = S.offer.map((o) => { const C = CHm()[o.id], owned = r.has(o.id); return `<div class="charm shop"><span class="ci">${C.icon}</span><b>${esc(C.name)}</b><small>${esc(C.desc)}</small><button data-buy="${o.id}" ${S.bought || owned || r.money < o.price ? 'disabled' : ''}>${owned ? 'đã mua' : `Mua ${fmt(o.price)}`}</button></div>`; }).join('');
      const gift = S.gift && !S.giftDone ? (() => { const C = CHm()[S.gift]; return `<div class="gift">${this.houseBoxMini(G.HOUSE_LINES.gift[0])}<div class="charm gift"><span class="ci">${C.icon}</span><b>${esc(C.name)}</b><small>${esc(C.desc)}</small></div><div class="row btns"><button id="gYes">🎁 Nhận quà</button><button id="gNo">Từ chối</button></div></div>`; })() : '';
      const loans = `<div class="row btns">🏦 Vay: ${G.BET.loans.map((a) => `<button data-loan="${a}">${fmt(a)} <small>(trả ${fmt(a * G.BET.loanRate)})</small></button>`).join('')}</div>
        ${r.loans.map((l, i) => `<div class="row">🧾 Nợ ${fmt(l.amt)} → trả ${fmt(l.due)} (đang mang ${CHm()[l.charm].icon} ${esc(CHm()[l.charm].name)}) <button data-repay="${i}" ${r.money < l.due ? 'disabled' : ''}>Trả nợ</button></div>`).join('')}`;
      const stageEnd = r.stageEnd();
      this.screen(`${this.houseBox(G.HOUSE_LINES.shop[0])}${this.statusBar()}
        <h3>🛒 Cửa hàng charm <small class="dim">— chọn 1 trong 3</small></h3><div class="charms">${offers}</div>
        ${gift}
        <h3>🧿 Charm của bạn</h3>${this.charmRow(true)}
        <h3>🏦 Vay nhà cái <small class="dim">— nhận một charm xấu, chỉ gỡ khi trả nợ (×${G.BET.loanRate})</small></h3>${loans}
        <div class="row btns"><button class="big" id="shGo">${stageEnd ? `→ Nộp chỉ tiêu chặng ${r.stage + 1}` : '→ Trận tiếp theo'}</button></div>`);
      this.bindDrop();
      for (const b of document.querySelectorAll('[data-buy]')) b.onclick = () => { const e = r.buy(b.dataset.buy); if (e) G.Dlg.alert(e); this.save(); this.shop(); };
      for (const b of document.querySelectorAll('[data-loan]')) b.onclick = () => { const e = r.borrow(+b.dataset.loan); if (e) G.Dlg.alert(e); else r.lastLine = G.HOUSE_LINES.loan[0]; this.save(); this.shop(); };
      for (const b of document.querySelectorAll('[data-repay]')) b.onclick = () => { const e = r.repay(+b.dataset.repay); if (e) G.Dlg.alert(e); this.save(); this.shop(); };
      if ($('#gYes')) { $('#gYes').onclick = () => { r.takeGift(true); this.save(); this.shop(); }; $('#gNo').onclick = () => { r.takeGift(false); this.save(); this.shop(); }; }
      $("#shGo").onclick = () => { r.shop = null; this.save(); if (stageEnd) this.quota(); else this.hub(); };
    },
    // ---------- cuối chặng ----------
    quota() {
      const r = this.run, q = r.quotaNeed(), pay = r.quotaPay(), ok = r.money >= q;
      this.screen(`${this.houseBox(ok ? G.HOUSE_LINES.stagePass[0] : G.HOUSE_LINES.stageFail[0])}${this.statusBar()}
        <h2>🎯 Cuối chặng ${r.stage + 1}: phải có ${fmt(q)}${r.isLast() ? ' (trả hết nợ, kể cả tiền vay)' : pay ? ` — nộp góp ${fmt(pay)}` : ' (đạt mốc là qua)'}</h2>
        <p>${ok ? `Bạn có ${fmt(r.money)} — đủ.${pay ? ` Nộp ${fmt(pay)}, còn ${fmt(r.money - pay)}.` : ''}` : `Bạn chỉ có ${fmt(r.money)} — thiếu ${fmt(q - r.money)}.${r.isLast() ? '' : ' Có thể quay lại vay nhà cái.'}`}</p>
        <div class="row btns">${ok ? '<button class="big" id="qPay">💸 Nộp chỉ tiêu</button>' : '<button id="qLoan">🏦 Quay lại vay</button><button class="red" id="qGive">Chịu thua</button>'}</div>`);
      if ($('#qPay') && !pay) $('#qPay').textContent = r.isLast() ? '💸 Trả hết nợ' : '✅ Qua chặng';
      if ($('#qPay')) $('#qPay').onclick = () => { r.payQuota(); r.lastLine = r.final ? G.HOUSE_LINES.finalIntro[0] : G.HOUSE_LINES.stagePass[0]; this.save(); r.over ? this.end() : this.hub(); };
      if ($('#qLoan')) $('#qLoan').onclick = () => { r.shop = r.shop || { offer: [], gift: null, bought: true, giftDone: true }; this.shop(); };
      if ($('#qGive')) $('#qGive').onclick = () => { r.payQuota(); this.save(); this.end(); };
    },
    // ---------- kết cục ----------
    end() {
      const r = this.run, res = r.result;
      const txt = res === 'free' ? (r.final ? G.HOUSE_LINES.finalWin[0] : G.HOUSE_LINES.endClean[0]) : res === 'house' ? G.HOUSE_LINES.finalLose[0] : res === 'debt' ? G.HOUSE_LINES.stageFail[0] : 'Bạn ta bỏ cuộc giữa chừng.';
      const title = res === 'free' ? '🕊 TỰ DO' : res === 'house' ? '🎩 NHÀ CÁI THẮNG' : res === 'debt' ? '⛓ VỠ NỢ' : '🏳 BỎ CUỘC';
      const H = r.hist.map((h) => `<span class="rk">Trận ${h.n}${h.final ? ' (nhà cái)' : ''}: <b class="${h.delta >= 0 ? 'gold' : 'warn'}">${h.delta >= 0 ? '+' : ''}${fmt(h.delta)}</b></span>`).join('');
      this.save();
      this.screen(`${this.houseBox(txt)}<h1 class="${res === 'free' ? 'gold' : 'warn'}">${title}</h1>
        <p>💰 Cuối cùng: ${fmt(r.money)} • đã qua ${r.hist.length} trận • nhà cái ${G.HOUSE_LINES.mood[r.mood()]}</p><div class="ranks">${H}</div>
        <details class="blog"><summary>📖 Nhật ký nhà cái</summary><ul>${r.log.slice().reverse().map((x) => `<li>${esc(x.txt)}</li>`).join('')}</ul></details>
        <div class="row btns"><button class="big" id="eNew">🎲 Ván mới</button><button id="eMenu">← Màn hình chính</button></div>`);
      $('#eNew').onclick = () => this.newRun();
      $('#eMenu').onclick = () => G.App.menu();
    },
  };
  G.BetUI = BetUI;
})();
