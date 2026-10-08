'use strict';
// ===== Ứng dụng: màn hình chính, giới thiệu 10 tướng, xem trận (góc nhìn trọng tài), mô phỏng nhanh, bảng xếp hạng =====
// KẺ ĐẶT CƯỢC — đấu trường sinh tồn 10 tướng do máy điều khiển; GĐ9b: vòng chơi chính — nhà cái & đặt cược (src/ui/bet_ui.js).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const U = G.U, esc = (s) => G.esc(s);
  const $ = (s) => document.querySelector(s);
  const PREF_KEY = 'kdc_pref_v1';

  const App = {
    speed: 2, autoSlow: true, m: null, r: null, hud: null, running: false, acc: 0, lastT: 0, slowUntil: 0,
    pref: { speed: 2, autoSlow: true },
    init() {
      try { Object.assign(this.pref, JSON.parse(localStorage.getItem(PREF_KEY)) || {}); } catch (e) { /* bỏ qua */ }
      this.speed = this.pref.speed; this.autoSlow = this.pref.autoSlow;
      G.Sound.init();
      this.cv = $('#cv');
      this.r = new G.Renderer(this.cv, null);
      this.hud = new G.Hud($('#hud'), this);
      window.addEventListener('resize', () => { this.r.resize(); this.hud.resize(); });
      this.bindInput();
      this.showErrors();
      this.menu();
      requestAnimationFrame((t) => this.loop(t));
    },
    // lỗi bất ngờ hiện ngay trên màn hình (dễ chụp gửi lại khi chơi trên điện thoại)
    showErrors() {
      let last = 0;
      const show = (msg) => {
        const now = Date.now(); if (now - last < 3000) return; last = now;
        let d = document.getElementById('errbox');
        if (!d) { d = document.createElement('div'); d.id = 'errbox'; d.onclick = () => d.classList.add('hidden'); document.body.appendChild(d); }
        d.textContent = '⚠ Lỗi: ' + String(msg).slice(0, 240) + ' — chạm để ẩn (chụp màn hình gửi lại giúp mình)';
        d.classList.remove('hidden');
      };
      window.addEventListener('error', (e) => show((e.message || 'lỗi') + (e.filename ? ' @ ' + e.filename.split('/').slice(-2).join('/') + ':' + e.lineno : '')));
      window.addEventListener('unhandledrejection', (e) => show(e.reason && e.reason.message ? e.reason.message : e.reason));
    },
    savePref() { this.pref.speed = this.speed || this.pref.speed; this.pref.autoSlow = this.autoSlow; try { localStorage.setItem(PREF_KEY, JSON.stringify(this.pref)); } catch (e) { /* bỏ qua */ } },
    show(id) { for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id); document.body.classList.toggle('in-match', id === 'match'); },
    newSeed() { return 'kdc-' + Math.floor(Math.random() * 1e9).toString(36); },

    // ---------- màn hình chính ----------
    menu() {
      this.running = false; this.m = null; this.bk = null; this.afterReplay = null;
      if (G.BetUI) G.BetUI.unmountHud();
      this.show('menu');
      G.Sound.music('menu');
      const sv = G.BetUI && G.BetUI.saved();
      $('#menu').innerHTML = `
        <div class="title"><h1>🎲 Kẻ Đặt Cược</h1><p>Đấu trường sinh tồn 10 tướng — bạn đứng ngoài nhìn như một trọng tài… và đặt cược</p></div>
        <div class="menu-btns">
          ${sv ? `<button class="big" id="mResume">▶ Tiếp tục ván cược <small>(chặng ${sv.stage + 1}, trận ${sv.matchNo()} • 💰 ${U.fmt(sv.money)})</small></button>` : ''}
          <button class="${sv ? '' : 'big'}" id="mRun">🎲 Ván cược mới</button>
          <button id="mWatch">👁 Xem một trận tự do (không cược)</button>
          <button id="mSolo">⚔ Solo 1v1 • 2 tướng</button>
          <button id="mSim">⏩ Mô phỏng nhanh 1 trận</button>
          <a class="btn" href="legacy/index.html">📜 Chơi bản cũ</a>
        </div>
        <div class="note"><b>Bạn là kẻ mắc nợ nhà cái.</b> Trả nợ bằng cách đặt cược vào đấu trường sinh tồn của 10 tướng do máy điều khiển: 3 chặng × 3 trận,
          hết mỗi chặng phải đạt mốc tiền, chặng cuối trả hết nợ. Nhà cái hỏi câu đầu (ai sống tới cuối, ai Top 1, Top 3), mời ký Giao Kèo ×10, dừng trận để hỏi giữa chừng (ai thắng giao tranh,
          ai giết boss, ai lấy thính…), bán charm, tặng quà có mặt trái, cho vay. <b>Nhà cái không trung thực</b> — có người của hắn trong đấu trường, có tin đồn giả,
          có điều khoản chữ nhỏ. Bạn thấy hết như trọng tài (cả suy nghĩ của từng tướng): đọc người, đừng đoán mò.</div>
        <div class="audio"><button id="mMus">${G.Sound.cfg.muteMusic ? '🔇' : '🎵'} Nhạc</button><button id="mSfx">${G.Sound.cfg.muteSfx ? '🔇' : '🔊'} Âm thanh</button><button id="mFull">⛶ Toàn màn hình</button></div>`;
      $('#mWatch').onclick = () => this.lineup(G.arenaConfig(this.newSeed()));
      $('#mSolo').onclick = () => (G.SoloUI ? G.SoloUI.open(this) : this.lineup(Object.assign(G.arenaConfig(this.newSeed()), { mode: 'solo' })));
      $('#mRun').onclick = () => { if (sv) G.Dlg.confirm('Bắt đầu ván mới sẽ xóa ván đang chơi. Chắc chứ?', 'Ván mới', 'Thôi').then((ok) => { if (ok) G.BetUI.newRun(); }); else G.BetUI.newRun(); };
      if ($('#mResume')) $('#mResume').onclick = () => G.BetUI.resume();
      $('#mSim').onclick = () => this.quickSim(G.arenaConfig(this.newSeed()));
      $('#mMus').onclick = () => { G.Sound.toggleMusic(); this.menu(); };
      $('#mSfx').onclick = () => { G.Sound.toggleSfx(); this.menu(); };
      $('#mFull').onclick = () => goFullscreen();
    },

    // ---------- giới thiệu 10 tướng trước trận ----------
    lineup(cfg) {
      this.lastCfg = cfg;
      this.show('setup');
      const N = G.SUMMONER_STAT_NAME, keys = ['meca', 'fight', 'map', 'disc'];
      const cards = cfg.picks.map((pk, i) => {
        const H = G.HEROES[pk.hero], P = pk.player || G.heroChar(pk.hero), pers = G.personalityOf(pk.hero), col = G.SLOT_COL[i];
        const st = keys.map((k) => `<span title="${esc(N[k])}"><small>${esc(N[k])}</small> ${P.stats[k]}</span>`).join('');
        return `<div class="lcard" style="--slot:${col}">
          <div class="lh"><span class="dot" style="background:${H.color};box-shadow:0 0 0 2px ${col}"></span><b>${esc(H.name)}</b></div>
          <div class="lp" title="${esc(pers.desc)}">${pers.icon} ${esc(pers.name)}</div>
          <div class="ls">${st}</div></div>`;
      }).join('');
      // GĐ7: bản đồ sinh theo hạt giống — dựng trước để xem 5 vùng ngoài là biome nào
      G.buildMap(cfg.mapSeed != null ? cfg.mapSeed : cfg.seed);
      const MP = G.MAP, cnt = {}; for (const s of MP.structs) cnt[s.type] = (cnt[s.type] || 0) + 1;
      const SN = { house: '🏠 nhà', ruin: '🏛 đền đổ', plateau: '⛰ cao nguyên', tower: '🗼 tháp canh', bridge: '🌉 cầu', canyon: '🏜 hẻm núi', mill: '🌬 cối xay', barrels: '💥 cụm thùng nổ', graves: '🪦 nghĩa địa', tanks: '☣ bồn khí độc', pipes: '🛢 đường ống độc' };
      const NO = MP.NSEC || 5;
      const mapInfo = `<div class="mapinfo"><b>🗺 Bản đồ</b> ${MP.REGIONS.slice(0, NO).map((r) => `<span title="${esc(r.feat || '')}">${r.icon} ${esc(r.name)}</span>`).join(' • ')} • 🏛 Phế Tích ở giữa
        <br><small>👑 Ổ boss: ${(MP.lairs || [MP.bossLair]).map((L) => `${L.icon || '👑'} ${esc(L.name || 'Ổ Boss')}`).join(' • ')}</small>
        <br><small>${Object.keys(SN).filter((k) => cnt[k]).map((k) => `${SN[k]} ×${cnt[k]}`).join(' • ')}${MP.fallback ? ' • (bản đồ cổ điển)' : ''}</small></div>`;
      $('#setup').innerHTML = `
        <h2>🏟 ${cfg.mode === 'solo' ? 'Solo 1v1 • chỉ hai tướng đối đầu' : 'Dàn tướng trận này'}</h2>
        <div class="lgrid">${cards}</div>
        ${mapInfo}
        <div class="row">
          <label>Hạt giống <input id="sSeed" value="${esc(cfg.seed)}"></label>
          <button id="sLoad">↻ Dùng hạt giống này</button>
        </div>
        <div class="row btns">
          <button id="sRand">🎲 Dàn tướng khác</button>
          <button class="big" id="sGo">▶ Xem trận</button>
          <button id="sFast">⏩ Mô phỏng nhanh</button>
          <button id="sBack">← Quay lại</button>
        </div>
        <p class="hint">Cùng hạt giống → cùng dàn tướng, cùng bản đồ và trận đấu diễn ra giống hệt. Tính cách cố định theo tướng.</p>`;
      $('#sLoad').onclick = () => this.lineup(G.arenaConfig($('#sSeed').value.trim() || this.newSeed()));
      $('#sRand').onclick = () => this.lineup(G.arenaConfig(this.newSeed()));
      $('#sGo').onclick = () => this.startMatch(cfg);
      $('#sFast').onclick = () => this.quickSim(cfg);
      $('#sBack').onclick = () => this.menu();
    },

    // ---------- xem trận ----------
    startMatch(cfg, built) {
      this.lastCfg = cfg; this.bk = null;
      this.m = built || new G.Match(Object.assign({}, cfg, { fx: true }));
      this.r.setMatch(this.m);
      this.r.cam.follow = true; this.r.cam.focusId = null; this.r.spot = null;
      this.r.cam.x = G.MAP.center.x; this.r.cam.y = G.MAP.center.y;
      this.hud.setMatch(this.m);
      this.show('match');
      this.r.resize(); this.hud.resize();
      this.running = true; this.acc = 0; this.ended = false;
      if (!this.speed) this.speed = this.pref.speed || 2;
      G.Sound.play('fight'); G.Sound.music('battle', true);
    },
    // GĐ9b: trận có nhà cái — trận đã dựng sẵn (m), nhà cái bk theo dõi từng bước
    startBetMatch(m, bk) {
      this.afterReplay = null;
      this.startMatch(m.cfg, m);
      this.bk = bk;
    },
    setSpeed(s) { this.speed = s; if (s) this.savePref(); this.hud.refreshCtrl(); },
    quitMatch(sure) {
      if (this.bk && this.m && !this.m.over) {   // GĐ9b: trận có cược — không thoát ngang, chỉ tua nhanh tới hết (mọi câu hỏi bị bỏ qua)
        const sp = this.speed; this.setSpeed(0);
        G.Dlg.confirm('Đang có cược. Tua nhanh tới hết trận? (mọi câu hỏi còn lại sẽ bị bỏ qua — đang giao kèo thì vỡ)', 'Tua nhanh', 'Ở lại').then((ok) => { if (ok) this.fastForward(); else this.setSpeed(sp || this.pref.speed || 2); });
        return;
      }
      if (!sure && this.m && !this.m.over) {
        const sp = this.speed; this.setSpeed(0);
        G.Dlg.confirm('Thoát trận đang xem?', 'Thoát', 'Ở lại').then((ok) => { if (ok) this.quitMatch(true); else this.setSpeed(sp || this.pref.speed || 2); });
        return;
      }
      this.running = false;
      if (this.afterReplay) { const f = this.afterReplay; this.afterReplay = null; return f(); }
      this.lineup(this.lastCfg);
    },
    loop(t) {
      requestAnimationFrame((tt) => this.loop(tt));
      const dt = Math.min(0.1, (t - (this.lastT || t)) / 1000); this.lastT = t;
      if (!this.running || !this.m) return;
      const m = this.m;
      // tự chậm lại khi có giao tranh đông (≥ 3 tướng)
      let sp = this.speed;
      if (this.autoSlow && sp > 1 && this.r.hotN >= 3) { this.slowUntil = t + 2500; }
      if (this.autoSlow && t < this.slowUntil && sp > 1) { sp = 1; if (!this.slowShown) { this.hud.banner('⚔ Hỗn chiến!', 'gold'); this.slowShown = true; } } else this.slowShown = false;
      if (!m.over && sp > 0) {
        this.acc += dt * sp;
        let n = 0;
        while (this.acc >= G.C.TICK && n < 40) {
          this.r.snap(); m.step(); this.acc -= G.C.TICK; n++;
          if (this.bk) { const q = this.bk.tick(); if (q) { this.acc = 0; G.BetUI.onQuestion(q); break; } }
          if (m.over) break;
        }
        if (n >= 40) this.acc = 0;
      }
      this.r.pullFx((e) => { this.hud.onFx(e); this.sound(e); });
      this.r.updateCamera(dt, sp);
      this.r.draw(sp > 0 && !m.over ? Math.min(1, this.acc / G.C.TICK) : 1);
      if (!this.hudT || t > this.hudT) { this.hud.update(); this.r.drawMinimap(this.hud.mini); this.hudT = t + 160; if (this.bk) G.BetUI.notify(); }
      if (m.over && !this.ended) { this.ended = true; setTimeout(() => (this.bk && this.bk.m === m ? G.BetUI.after(m) : this.result(m)), 2200); G.Sound.play('applause'); }
    },
    // âm thanh theo sự kiện (chỉ những gì gần khung nhìn)
    sound(e) {
      if (e.x !== undefined) {
        const r = this.r, hw = r.W / 2 / r.cam.zoom + 4, hh = r.H / 2 / r.cam.zoom + 4;
        if (Math.abs(e.x - r.cam.x) > hw || Math.abs(e.y - r.cam.y) > hh) return;
      }
      const S = G.Sound;
      if (e.type === 'cast') { if (e.key === 's4') S.play('magic_burst'); else S.play(e.hero === 'ignatius' ? 'boom_small' : e.hero === 'aria' ? 'note_' + (1 + (Math.floor(e.t * 10) % 4)) : 'magic_spell', { vol: 0.6 }); }
      else if (e.type === 'swing') {
        const h = this.m.heroes.find((x) => x.id === e.id); if (!h) return;
        const g = h.hero.gfx;
        S.play(g === 'bow' ? 'bow_shoot' : g === 'pistol' ? 'gun_shot' : g === 'shotgun' ? 'shotgun' : g === 'staff' ? 'boom_small' : g === 'voice' ? 'note_2' : g === 'greatsword' ? 'slash_heavy' : 'slash_light', { vol: 0.5 });
      } else if (e.type === 'death') S.play('explosion', { vol: 0.6 });
      else if (e.type === 'boom') S.play(e.big ? 'boom_big' : 'boom_small');
      else if (e.type === 'sfx') S.play(e.name);
    },
    bindInput() {
      // kéo để di chuyển camera, lăn chuột / chụm 2 ngón để phóng to thu nhỏ
      const cv = this.cv, ptrs = new Map();
      let pinch0 = 0, zoom0 = 0;
      cv.addEventListener('pointerdown', (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); cv.setPointerCapture(e.pointerId); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = this.r.cam.zoom; } });
      cv.addEventListener('pointermove', (e) => {
        const p = ptrs.get(e.pointerId); if (!p) return;
        if (ptrs.size === 1) {
          const dx = e.clientX - p.x, dy = e.clientY - p.y;
          if (Math.abs(dx) + Math.abs(dy) > 2) { this.r.cam.follow = false; this.r.cam.x -= dx / this.r.cam.zoom; this.r.cam.y -= dy / this.r.cam.zoom; this.r.clampCam(); this.hud.refreshCtrl(); }
        }
        p.x = e.clientX; p.y = e.clientY;
        if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; this.zoomTo(zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch0); }
      });
      const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomTo(this.r.cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1)); }, { passive: false });
      window.addEventListener('keydown', (e) => {
        if (!this.running) return;
        if (e.key === ' ') { this.setSpeed(this.speed ? 0 : this.pref.speed || 2); e.preventDefault(); }
        else if (['1', '2', '4', '8'].includes(e.key)) this.setSpeed(+e.key);
        else if (e.key === 'Tab') { this.hud.$('board').classList.toggle('hidden'); e.preventDefault(); }
      });
    },
    zoomTo(z) { const b = this.r.baseZoom, lo = Math.min(b * 0.3, Math.min(this.r.W, this.r.H) / G.C.MAP * 0.95); this.r.cam.zoom = Math.max(lo, Math.min(b * 2.2, z)); this.r.zoomSet = true; this.r.clampCam(); },

    // ---------- mô phỏng nhanh ----------
    fastForward() { if (this.m && !this.m.over) this.quickSim(null, this.m); },
    quickSim(cfg, existing) {
      this.running = false;
      const m = existing || new G.Match(Object.assign({}, cfg, { fx: false }));
      if (!existing) this.lastCfg = cfg;
      m.fxOn = false; m.fxq = [];
      this.show('busy');
      $('#busy').innerHTML = `<div class="busy"><h2>⏩ Đang mô phỏng…</h2><div class="bar"><i id="bBar"></i></div><p id="bTxt">0:00</p></div>`;
      const t0 = performance.now();
      const chunk = () => {
        const until = performance.now() + 30;
        while (!m.over && performance.now() < until) { m.step(); if (this.bk && this.bk.m === m && this.bk.tick()) this.bk.skip(); }
        $('#bBar').style.width = Math.min(100, m.time / G.C.MATCH_TIME * 100) + '%';
        $('#bTxt').textContent = `Giờ game ${U.mmss(m.time)} • còn ${m.aliveCount()} người`;
        if (!m.over) setTimeout(chunk, 0);
        else if (this.bk && this.bk.m === m) G.BetUI.after(m);
        else this.result(m, (performance.now() - t0) / 1000);
      };
      chunk();
    },

    // ---------- bảng xếp hạng sau trận ----------
    result(m, simSec) {
      this.running = false; this.m = m;
      this.show('result');
      G.Sound.music('hub');
      const r = m.result();
      const tops = m.heroes.filter((h) => h.place === 1);
      const nm = (h) => esc(h.player && h.player.name ? h.player.name : h.hero.name);
      const list = m.heroes.slice().sort((a, b) => (a.place || 99) - (b.place || 99) || b.stats.k - a.stats.k);
      const rows = list.map((h) => `<tr class="${h.place === 1 ? 'win' : ''}"><td>${h.place === 1 ? '🏆' : h.place}</td>
        <td><span class="dot" style="background:${h.hero.color};box-shadow:0 0 0 2px ${G.SLOT_COL[h.team]}"></span>${nm(h)}</td>
        <td>${h.pers ? h.pers.icon + ' ' + esc(h.pers.name) : ''}</td><td>${h.level}</td><td>${h.stats.k}${h.stats.vulture ? ` <small>🦅${h.stats.vulture}</small>` : ''}</td><td>${h.stats.d}</td>
        <td>${h.stats.camps || 0}</td><td>${h.stats.boss || 0}</td><td>${h.stats.drops || 0}</td><td>${U.fmt(h.stats.goldEarned)}</td><td>${U.fmt(h.stats.dmgHero)}</td></tr>`).join('');
      const vPct = r.kills ? Math.round(100 * r.vultureKills / r.kills) : 0;
      $('#result').innerHTML = `
        <h2 class="gold">🏆 ${tops.length > 1 ? `${tops.map(nm).join(', ')} ĐỒNG HẠNG 1` : tops.length ? `${nm(tops[0])} VÔ ĐỊCH` : 'KHÔNG AI SỐNG SÓT'}</h2>
        <p>Thời lượng ${U.mmss(r.time)}${r.timeout ? ' (hết giờ — người còn sống đồng hạng)' : ''} • ${r.kills} lần hạ gục • kền kền ${r.vultureKills} (${vPct}%) • chết trong bo ${r.zoneDeaths} • boss bị hạ ${r.bossKills}${simSec ? ` • mô phỏng mất ${simSec.toFixed(1)}s` : ''}</p>
        <table class="score"><thead><tr><th>Hạng</th><th>Tướng</th><th>Tính cách</th><th>Cấp</th><th>Mạng</th><th>Chết</th><th>Quái</th><th>Boss</th><th>Thính</th><th>Vàng</th><th>ST tướng</th></tr></thead>
        <tbody>${rows}</tbody></table>
        ${r.errors.length ? `<p class="warn">Lỗi kích hoạt ghi nhận: ${r.errors.length} (trận vẫn chạy tiếp)</p>` : ''}
        <div class="row btns"><button id="rReplay">🔁 Xem lại trận này</button><button id="rNew">🎲 Trận mới</button><button id="rMenu">← Màn hình chính</button></div>
        <p class="hint">Hạt giống: <code>${esc(m.seed)}</code> — xem lại sẽ diễn ra giống hệt.</p>`;
      if (this.afterReplay) { const f = this.afterReplay; $('#rReplay').textContent = '← Về ván cược'; $('#rReplay').onclick = () => { this.afterReplay = null; f(); }; } else
      $('#rReplay').onclick = () => this.startMatch(this.lastCfg || G.arenaConfig(m.seed));
      if (this.lastCfg && this.lastCfg.mode === 'solo') {
        $('#rNew').textContent = '⚔ Chỉnh Solo';
        $('#rNew').onclick = () => (G.SoloUI ? G.SoloUI.open(this) : this.lineup(G.arenaConfig(this.newSeed())));
      } else {
        $('#rNew').onclick = () => this.lineup(G.arenaConfig(this.newSeed()));
      }
      $('#rMenu').onclick = () => this.menu();
    },
  };
  function goFullscreen() {
    const d = document.documentElement;
    const f = d.requestFullscreen || d.webkitRequestFullscreen;
    if (f) f.call(d).then(() => { try { screen.orientation.lock('landscape'); } catch (e) { /* bỏ qua */ } }).catch(() => {});
  }
  G.App = App;
  // khởi động khi mọi tệp đã nạp
  if (typeof window !== 'undefined') window.addEventListener('load', () => { if (document.getElementById('cv')) App.init(); });
})();
