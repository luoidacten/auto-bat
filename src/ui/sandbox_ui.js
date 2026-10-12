'use strict';
// ===== GĐ11: GIAO DIỆN PHÒNG THỬ NGHIỆM SANDBOX =====
// Màn chuẩn bị (chọn tướng, cấp, bù nhìn) → xem trận Sandbox với bảng điều khiển nổi:
//   Tướng [▼] Cấp [−][n][+] [Đặt lại hồi chiêu] • Bật/tắt: Bất Tử (F1 Không Hồi Chiêu, F2 Vô Hạn Tài Nguyên)
//   F3 nhảy cấp 1→3→6→9→12→18 • F4 đổi tướng • F5 lớp vẽ gỡ lỗi (hitbox, nón nhìn 180°, vòng tầm) • F6 tốc độ 0.1x→2x
//   Thả bù nhìn: 🎯 Bao Cát • 🛡 Siêu Giáp • 🔫 Máy Xả Đạn (3 chế độ) • 🏃 Thả Diều • 👻 Ẩn Thân • ⚔ Đối thủ tướng thật • 🧹 Dọn
//   🔒 Lồng Solo 14 đv • ☣ Bo giả lập • Bảng đo: DPS 1s / DPS chuỗi / đòn cao nhất / phân rã sát thương / khống chế / nhật ký
//   🧪 Kịch bản kiểm thử mẫu (5 kịch bản) — chạy và hiện ✔/✘ ngay trong bảng.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const SPEEDS = [0.1, 0.25, 0.5, 1, 2];
  const cs = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`; };
  const heroList = () => Object.values(G.HEROES).filter((h) => !h.dummy).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const opts = (sel) => heroList().map((h) => `<option value="${h.id}"${h.id === sel ? ' selected' : ''}>${esc(h.name)}</option>`).join('');

  const SandboxUI = {
    app: null, el: null, suiteOut: null, pick: { hero: 'gideon', level: 12, dummies: ['static'], rival: 'ryoma' },
    // ---------- màn chuẩn bị ----------
    open(app) {
      this.app = app;
      app.show('setup');
      const P = this.pick, D = G.Sandbox.DUMMY;
      $('#setup').innerHTML = `
        <h2>🧪 Phòng Thử Nghiệm (Sandbox)</h2>
        <p class="hint">Bản đồ thật (vách đá, bụi rậm, công trình) nhưng không quái, không bo, không ai chết. Tướng do AI điều khiển tự dùng chiêu lên bù nhìn;
          bảng đo ghi DPS, phân rã sát thương, thời gian khống chế và từng đòn.</p>
        <div class="row"><label>Tướng thử <select id="sbH">${opts(P.hero)}</select></label>
          <label>Cấp <select id="sbL">${G.Sandbox.LEVELS.map((l) => `<option${l === P.level ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
        <div class="row sbx-dummies">${Object.keys(D).map((k) => `<label title="${esc(D[k].desc)}"><input type="checkbox" value="${k}"${P.dummies.includes(k) ? ' checked' : ''}> ${D[k].icon} ${esc(D[k].name)}</label>`).join('')}
          <label title="Tướng thật do AI điều khiển — test giữ cự ly, Solo"><input type="checkbox" value="rival"${P.dummies.includes('rival') ? ' checked' : ''}> ⚔ Đối thủ</label>
          <select id="sbR">${opts(P.rival)}</select></div>
        <div class="row btns"><button class="big" id="sbGo">▶ Vào phòng thử nghiệm</button><button id="sbSuite">🧪 Chạy 5 kịch bản kiểm thử</button><button id="sbBack">← Quay lại</button></div>
        <div id="sbSuiteOut" class="sbx-suite"></div>`;
      const read = () => { P.hero = $('#sbH').value; P.level = +$('#sbL').value; P.rival = $('#sbR').value; P.dummies = [...document.querySelectorAll('.sbx-dummies input:checked')].map((x) => x.value); };
      $('#sbGo').onclick = () => { read(); this.start(); };
      $('#sbBack').onclick = () => app.menu();
      $('#sbSuite').onclick = () => this.suite($('#sbSuiteOut'));
    },
    start(built) {
      const P = this.pick;
      const cfg = G.Sandbox.cfg(P.hero, 'sbx-' + Math.floor(Math.random() * 1e6).toString(36), { dummies: P.dummies.length ? P.dummies : ['static'], level: P.level, rival: P.rival });
      this.app.startMatch(cfg, built || null);
      this.app.speed = 1; this.app.autoSlow = false;
      this.mount();
    },
    // chạy bộ kịch bản (không giao diện) rồi in kết quả
    suite(box) {
      box.innerHTML = '<p>⏳ Đang chạy…</p>';
      setTimeout(() => {
        const rows = [];
        for (const T of G.Sandbox.SUITE) {
          const r = G.Sandbox.runSuite(T.id);
          rows.push(`<div class="sbx-case ${r.pass ? 'ok' : 'bad'}"><b>${r.pass ? '✔' : '✘'} ${esc(r.name)}</b>${r.out.map(([ok, t]) => `<div>${ok ? '✔' : '✘'} ${esc(t)}</div>`).join('')}${r.m.errors.length ? `<div class="err">${esc(r.m.errors[0])}</div>` : ''}
            <button data-id="${T.id}">👁 Xem lại tình huống</button></div>`);
          this.lastRuns = this.lastRuns || {}; this.lastRuns[T.id] = r;
        }
        box.innerHTML = rows.join('');
        for (const b of box.querySelectorAll('button[data-id]')) b.onclick = () => { const r = this.lastRuns[b.dataset.id]; this.pick.hero = r.m.sbx.hero.heroId; this.start(r.m); };
      }, 30);
    },
    // ---------- bảng điều khiển trong trận ----------
    mount() {
      this.unmount();
      const el = document.createElement('div'); el.id = 'sbxPanel'; el.className = 'sbx-panel';
      $('#match').appendChild(el); this.el = el; document.body.classList.add('sbx-on');
      this.render();
      this.keys = (e) => this.onKey(e);
      window.addEventListener('keydown', this.keys);
    },
    unmount() { document.body.classList.remove('sbx-on'); if (this.el) this.el.remove(); this.el = null; if (this.keys) window.removeEventListener('keydown', this.keys); this.keys = null; },
    render() {
      const m = this.app.m, S = m && m.sbx; if (!S || !this.el) return;
      const h = S.hero, D = G.Sandbox.DUMMY, sp = this.app.speed;
      if (h) { this.app.r.cam.follow = true; this.app.r.cam.focusId = h.id; }
      const tg = (k, label, key) => `<button class="tg${S[k] ? ' on' : ''}" data-tg="${k}" title="${key || ''}">${label}</button>`;
      this.el.innerHTML = `
        <div class="sbx-head"><b>🧪 SANDBOX</b><button data-a="min">${this.min ? '▣' : '▭'}</button><button data-a="quit">✕</button></div>
        <div class="sbx-body${this.min ? ' hidden' : ''}">
          <div class="sbx-row">Tướng <select data-a="hero">${opts(h && h.heroId)}</select> Cấp <button data-a="lv-">−</button><b>${h ? h.level : '-'}</b><button data-a="lv+">+</button> <button data-a="cd">↺ Hồi chiêu</button></div>
          <div class="sbx-row">🎮 Lệnh ${[['auto', '🤖 AI tự đánh'], ['idle', '⏸ Đứng yên'], ['atk', '🗡 Chỉ đánh thường']].concat(['s1', 's2', 's3', 's4', 'sub'].filter((k) => h && h.hero.skills[k]).map((k) => [k, k.toUpperCase()])).map(([c, t]) => `<button class="tg${S.cmd === c ? ' on' : ''}" data-cmd="${c}" title="${c.startsWith('s') && h ? esc('Chỉ dùng: ' + h.hero.skills[c].name) : ''}">${t}</button>`).join('')}</div>
          ${S.dummies.some((x) => x.sbRival && x.alive) ? `<div class="sbx-row">⚔ Lệnh đối thủ ${[['auto', '🤖 AI'], ['idle', '⏸ Đứng yên'], ['atk', '🗡 Đánh thường'], ['s1', 'S1'], ['s2', 'S2'], ['s3', 'S3'], ['s4', 'S4'], ['sub', 'Phụ']].map(([c, t]) => `<button class="tg${(S.rcmd || 'auto') === c ? ' on' : ''}" data-rcmd="${c}">${t}</button>`).join('')}</div>` : ''}
          <div class="sbx-row">${tg('god', '🛡 Bất Tử')}${tg('noCd', '⏱ Không hồi chiêu', 'F1')}${tg('infRes', '♾ Vô hạn tài nguyên', 'F2')}</div>
          <div class="sbx-row">${tg('hitbox', '◯ Hitbox', 'F5')}${tg('fov', '◔ Nón nhìn 180°', 'F5')}${tg('rings', '◎ Vòng tầm', 'F5')}${tg('cage', '🔒 Lồng Solo')}${tg('zone', '☣ Bo giả lập')}</div>
          <div class="sbx-row">${Object.keys(D).map((k) => `<button data-sp="${k}" title="${esc(D[k].desc)}">${D[k].icon}</button>`).join('')}<button data-sp="rival" title="Đối thủ tướng thật">⚔</button><select data-a="rival">${opts(this.pick.rival)}</select><button data-a="clear">🧹</button></div>
          <div class="sbx-row">🔫 <select data-a="spit">${[['snipe', 'Tỉa đơn 2s'], ['burst', 'Liên thanh 20'], ['orb', 'Cầu chậm']].map(([v, t]) => `<option value="${v}"${S.spitMode === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
            <button data-a="armor">🛡 ${S.armorMode === 'ga' ? '1500 Hộ Giáp' : '100 Giáp'}</button></div>
          <div class="sbx-row">⏩ ${SPEEDS.map((x) => `<button class="tg${Math.abs(sp - x) < 1e-6 ? ' on' : ''}" data-speed="${x}">${x}x</button>`).join('')} <small>F6</small></div>
          <div class="sbx-metrics"></div>
          <div class="sbx-log"></div>
        </div>`;
      this.el.onclick = (e) => this.onClick(e);
      this.el.onchange = (e) => this.onChange(e);
      this.update(m);
    },
    onClick(e) {
      const b = e.target.closest('button'); if (!b) return;
      const m = this.app.m; if (!m || !m.sbx) return;
      if (b.dataset.tg) { m.sbToggle(b.dataset.tg); this.render(); return; }
      if (b.dataset.cmd) { m.sbCmd(b.dataset.cmd); this.render(); return; }
      if (b.dataset.rcmd) { m.sbRcmd(b.dataset.rcmd); this.render(); return; }
      if (b.dataset.sp) { m.sbSpawn(b.dataset.sp === 'rival' ? this.pick.rival : b.dataset.sp); return; }
      if (b.dataset.speed) { this.app.speed = +b.dataset.speed; this.app.hud.refreshCtrl && this.app.hud.refreshCtrl(); this.render(); return; }
      const a = b.dataset.a;
      if (a === 'min') { this.min = !this.min; this.render(); }
      else if (a === 'quit') { this.unmount(); this.app.menu(); }
      else if (a === 'lv-' || a === 'lv+') { m.sbLevel(a === 'lv+' ? 1 : -1); this.app.r.cam.focusId = m.sbx.hero.id; this.render(); }
      else if (a === 'cd') { const h = m.sbx.hero; h.cd = {}; h.recast = {}; m.sbLog('↺ Đặt lại hồi chiêu'); }
      else if (a === 'clear') m.sbClear();
      else if (a === 'armor') { m.sbArmorMode(); this.render(); }
    },
    onChange(e) {
      const m = this.app.m, a = e.target.dataset.a; if (!m || !m.sbx) return;
      if (a === 'hero') { m.sbSwap(e.target.value); this.pick.hero = e.target.value; this.app.r.cam.focusId = m.sbx.hero.id; this.render(); }
      else if (a === 'rival') this.pick.rival = e.target.value;
      else if (a === 'spit') m.sbSpitMode(e.target.value);
    },
    onKey(e) {
      const m = this.app.m; if (!m || !m.sbx || !/^F[1-6]$/.test(e.key)) return;
      e.preventDefault();
      if (e.key === 'F1') m.sbToggle('noCd');
      else if (e.key === 'F2') m.sbToggle('infRes');
      else if (e.key === 'F3') { const L = G.Sandbox.LEVELS, i = L.indexOf(m.sbx.hero.level); m.sbSwap(m.sbx.hero.heroId, L[(i + 1) % L.length]); }
      else if (e.key === 'F4') { const H = heroList(), i = H.findIndex((x) => x.id === m.sbx.hero.heroId); m.sbSwap(H[(i + 1) % H.length].id); }
      else if (e.key === 'F5') { const on = !(m.sbx.hitbox && m.sbx.fov && m.sbx.rings); m.sbx.hitbox = m.sbx.fov = m.sbx.rings = on; }
      else if (e.key === 'F6') { const i = SPEEDS.findIndex((x) => Math.abs(x - this.app.speed) < 1e-6); this.app.speed = SPEEDS[(i + 1) % SPEEDS.length]; }
      this.render();
    },
    // gọi mỗi ~160ms từ vòng lặp ứng dụng
    update(m) {
      if (!this.el || !m || !m.sbx) return;
      const st = m.sbStats(), box = this.el.querySelector('.sbx-metrics'), lg = this.el.querySelector('.sbx-log');
      if (box) box.innerHTML = `
        <div class="sbx-dps"><span>DPS 1s <b>${Math.round(st.dps1)}</b></span><span>DPS chuỗi <b>${Math.round(st.dpsAvg)}</b></span><span>Đòn cao nhất <b>${Math.round(st.peak)}</b></span></div>
        <div class="sbx-sub">${Math.round(st.total)} sát thương • ${st.n} đòn • ${st.crit} chí mạng • ${st.dur.toFixed(1)}s</div>
        ${st.parts.filter((p) => p.v > 0).map((p) => `<div class="sbx-bar"><i style="width:${Math.round(p.pct * 100)}%"></i><span>${p.k} ${Math.round(p.v)} (${Math.round(p.pct * 100)}%)</span></div>`).join('')}
        <div class="sbx-sub">⛓ ${st.cc.length ? st.cc.map((c) => `${c.k} ${c.v.toFixed(2)}s`).join(' • ') : 'chưa khống chế'}</div>`;
      if (lg) lg.innerHTML = m.sbx.log.slice(-9).reverse().map((l) => `<div>[${cs(l.t)}] ${esc(l.txt)}</div>`).join('');
    },
    // ---------- lớp vẽ gỡ lỗi (gọi từ Renderer.draw) ----------
    drawOverlay(r, ctx, m, alpha, z) {
      const S = m.sbx; if (!S) return;
      const C = G.C;
      if (m.soloArena && m.soloArena.overlay) { const p = r.w2s(m.soloArena.cx, m.soloArena.cy); ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.arc(p.x, p.y, m.soloArena.r * z, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      for (const u of m.units) {
        if (!u.alive || (u.kind !== 'hero' && u.kind !== 'pet')) continue;
        const q = r.pos ? r.pos(u, alpha) : u, p = r.w2s(q.x, q.y);
        if (S.hitbox) { ctx.strokeStyle = u.team === 0 ? '#5aff8a' : '#ff6a6a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, u.r * z, 0, Math.PI * 2); ctx.stroke(); }
        if (u !== S.hero) continue;
        if (S.fov) {
          const a = Math.atan2(u.fy || 0, u.fx || 1), R = (u.st.vision || C.VISION || 14) * z;
          ctx.fillStyle = 'rgba(255,255,160,0.07)'; ctx.strokeStyle = 'rgba(255,255,160,0.35)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, R, a - Math.PI / 2, a + Math.PI / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        if (S.rings) {
          const ring = (rr, col, label) => { ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(p.x, p.y, rr * z, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, p.x, p.y - rr * z - 3); };
          ring(u.st.range + u.r, '#ffffff', 'Đánh thường ' + u.st.range.toFixed(1));
          const cols = { s1: '#7ad0ff', s2: '#a0ff7a', s3: '#ffb07a', s4: '#ff7ad0' };
          for (const k of ['s1', 's2', 's3', 's4']) { const d = u.hero.skills[k]; const R = d && d.ai && (d.ai.rangeFn ? d.ai.rangeFn(m, u) : d.ai.range); if (R && R > 0.5) ring(R, cols[k], k.toUpperCase() + ' ' + (+R).toFixed(1)); }
        }
      }
    },
  };
  G.SandboxUI = SandboxUI;
})();
