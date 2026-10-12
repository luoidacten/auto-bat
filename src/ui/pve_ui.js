'use strict';
// ===== GĐ12: GIAO DIỆN CHẾ ĐỘ PvE SINH TỒN — bạn tự điều khiển 1 tướng, 9 tướng còn lại do máy =====
// • Bàn phím: WASD di chuyển • chuột: ngắm (chiêu bay về phía con trỏ) • Q/E/R chiêu 1–3 • F chiêu cuối • Space chiêu phụ
//   • H bình máu • G bình mana / giáp • T đổi mục tiêu khóa • Esc thoát.
// • Điện thoại: cần ảo bên trái (kéo để đi), nút chiêu bên phải (bấm = tung về mục tiêu khóa; kéo khỏi nút = ngắm theo hướng kéo),
//   nút 🎯 đổi mục tiêu, nút bình 1 chạm. Đứng yên là tự đánh thường mục tiêu khóa (khóa thông minh: tướng địch gần nhất, rồi quái).
// • Bị loại → camera chuyển sang góc nhìn trọng tài, trận chạy tiếp tới khi có người thắng.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const esc = (s) => G.esc(s);
  const $ = (s) => document.querySelector(s);
  const KEYS = { q: 's1', e: 's2', r: 's3', f: 's4', ' ': 'sub' };

  const PveUI = {
    open(app) {
      this.app = app;
      app.show('setup');
      const ids = Object.keys(G.HEROES).filter((id) => !G.HEROES[id].hidden).sort((a, b) => G.HEROES[a].name.localeCompare(G.HEROES[b].name));
      const pick = this.last || ids[0];
      $('#setup').innerHTML = `
        <h2>🕹 Sinh Tồn PvE — chọn tướng của bạn</h2>
        <p class="hint">Bạn điều khiển 1 tướng giữa 9 tướng máy. WASD/cần ảo để đi, Q/E/R/F + Space để tung chiêu (chuột để ngắm), H/G uống bình, T đổi mục tiêu. Đứng yên là tự đánh mục tiêu đang khóa.</p>
        <div class="pve-grid">${ids.map((id) => { const H = G.HEROES[id]; return `<button class="pve-hero${id === pick ? ' on' : ''}" data-id="${id}"><span class="dot" style="background:${H.color}"></span>${esc(H.name)}<small>${esc(H.kit || '')}</small></button>`; }).join('')}</div>
        <div class="row btns"><button class="big" id="pvGo">▶ Vào trận</button><button id="pvBack">← Quay lại</button></div>`;
      let sel = pick;
      for (const b of document.querySelectorAll('.pve-hero')) b.onclick = () => { sel = b.dataset.id; for (const x of document.querySelectorAll('.pve-hero')) x.classList.toggle('on', x === b); };
      $('#pvGo').onclick = () => { this.last = sel; this.start(sel); };
      $('#pvBack').onclick = () => app.menu();
    },
    start(heroId) {
      const app = this.app, cfg = G.arenaConfig(app.newSeed());
      // đưa tướng của người chơi vào ô đầu (nếu đã có trong dàn thì đổi chỗ)
      const i = cfg.picks.findIndex((p) => p.hero === heroId);
      if (i > 0) { const t = cfg.picks[0]; cfg.picks[0] = cfg.picks[i]; cfg.picks[i] = t; }
      else if (i < 0) cfg.picks[0] = { hero: heroId, player: G.heroChar(heroId) };
      cfg.pve = heroId;
      app.startMatch(cfg);
      const u = app.m.pveOn(heroId);
      app.autoSlow = false; app.pveMode = true; app.setSpeed(1);
      app.r.cam.follow = true; app.r.cam.focusId = u.id;
      this.mount();
    },
    mount() {
      this.unmount();
      const el = document.createElement('div'); el.id = 'pvePad'; el.className = 'pve-pad';
      el.innerHTML = `
        <div class="pve-stick" id="pvStick"><i id="pvKnob"></i></div>
        <div class="pve-btns">
          ${['s1', 's2', 's3', 's4', 'sub'].map((k) => `<button class="pve-sk pve-${k}" data-k="${k}"><b>${{ s1: 'Q', s2: 'E', s3: 'R', s4: 'F', sub: '␣' }[k]}</b><span></span><em></em></button>`).join('')}
          <button class="pve-sm" data-a="lock" title="Đổi mục tiêu (T)">🎯</button>
          <button class="pve-sm" data-a="hp" title="Bình máu (H)">❤<em></em></button>
          <button class="pve-sm" data-a="mp" title="Bình mana / giáp (G)">💧<em></em></button>
        </div>
        <div class="pve-info" id="pvInfo"></div>`;
      $('#match').appendChild(el); this.el = el; document.body.classList.add('pve-on');
      this.keys = {}; this.mouse = null;
      this.kd = (e) => this.onKey(e, true); this.ku = (e) => this.onKey(e, false);
      window.addEventListener('keydown', this.kd); window.addEventListener('keyup', this.ku);
      const cv = this.app.cv;
      this.mm = (e) => { const r = cv.getBoundingClientRect(); this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; };
      cv.addEventListener('pointermove', this.mm);
      // cần ảo
      const st = $('#pvStick'), kn = $('#pvKnob'); this.stick = { x: 0, y: 0 };
      const mv = (e) => { const r = st.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2; let dx = (e.clientX - cx) / R, dy = (e.clientY - cy) / R; const L = Math.hypot(dx, dy); if (L > 1) { dx /= L; dy /= L; } this.stick = { x: dx, y: dy }; kn.style.transform = `translate(${dx * R * 0.6}px,${dy * R * 0.6}px)`; };
      st.addEventListener('pointerdown', (e) => { st.setPointerCapture(e.pointerId); mv(e); e.stopPropagation(); });
      st.addEventListener('pointermove', (e) => { if (st.hasPointerCapture(e.pointerId)) mv(e); });
      const rel = () => { this.stick = { x: 0, y: 0 }; kn.style.transform = ''; };
      st.addEventListener('pointerup', rel); st.addEventListener('pointercancel', rel);
      // nút chiêu: bấm = về mục tiêu khóa; kéo ra khỏi nút = ngắm theo hướng kéo
      for (const b of el.querySelectorAll('.pve-sk')) {
        let d0 = null;
        b.addEventListener('pointerdown', (e) => { d0 = { x: e.clientX, y: e.clientY }; b.setPointerCapture(e.pointerId); e.stopPropagation(); });
        b.addEventListener('pointerup', (e) => {
          const k = b.dataset.k, dx = e.clientX - (d0 ? d0.x : e.clientX), dy = e.clientY - (d0 ? d0.y : e.clientY); d0 = null;
          const u = this.unit(); if (!u) return;
          const L = Math.hypot(dx, dy), def = u.hero.skills[k], R = (def && def.ai && def.ai.range) || 5;
          const aim = L > 24 ? { x: u.x + dx / L * Math.min(R, L / 18), y: u.y + dy / L * Math.min(R, L / 18) } : null;
          this.cast(k, aim);
        });
      }
      for (const b of el.querySelectorAll('.pve-sm')) b.onclick = (e) => { e.stopPropagation(); const a = b.dataset.a; if (a === 'lock') this.cycle(); else this.drink(a); };
      this.raf = requestAnimationFrame(() => this.tick());
    },
    unmount() {
      document.body.classList.remove('pve-on');
      if (this.el) this.el.remove(); this.el = null;
      if (this.kd) { window.removeEventListener('keydown', this.kd); window.removeEventListener('keyup', this.ku); }
      if (this.mm && this.app) this.app.cv.removeEventListener('pointermove', this.mm);
      this.kd = this.ku = this.mm = null;
      if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0;
      if (this.app) this.app.pveMode = false;
    },
    unit() { const m = this.app.m; return m && m.pve ? m.pveUnit() : null; },
    aimWorld() { const r = this.app.r; return this.mouse ? r.s2w(this.mouse.x, this.mouse.y) : null; },
    cast(k, aim) { const m = this.app.m; if (!m || !m.pve) return; m.pve.aim = aim || null; m.pve.queue.push({ k }); },
    cycle() {
      const m = this.app.m, u = this.unit(); if (!u) return;
      const L = m.heroes.filter((h) => h.alive && h !== u && h.vis && h.vis[u.team] !== false && Math.hypot(h.x - u.x, h.y - u.y) < 12).sort((a, b) => a.id - b.id);
      if (!L.length) return;
      const i = L.findIndex((h) => h.id === m.pve.lockId); m.pve.lockId = L[(i + 1) % L.length].id;
    },
    drink(kind) {
      const m = this.app.m, u = this.unit(); if (!u || !u.bag) return;
      const C = G.CONSUMABLES, want = kind === 'hp' ? ['hp'] : ['mp', 'ga'];
      const s = u.bag.slots.find((x) => C[x.id] && want.includes(C[x.id].pot) && x.n > 0);
      if (s) m.pve.queue.push({ bag: s.id });
    },
    onKey(e, down) {
      if (!this.app.m || !this.app.m.pve) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { this.keys[k] = down; e.preventDefault(); return; }
      if (!down) return;
      if (KEYS[k]) { e.preventDefault(); this.cast(KEYS[k], this.aimWorld()); }
      else if (k === 't') this.cycle();
      else if (k === 'h') this.drink('hp');
      else if (k === 'g') this.drink('mp');
      else if (k === 'escape') { this.unmount(); this.app.quitMatch(); }
    },
    // mỗi khung hình: đẩy véc-tơ di chuyển vào lõi trận, cập nhật nút hồi chiêu; bị loại → góc nhìn trọng tài
    tick() {
      this.raf = requestAnimationFrame(() => this.tick());
      const m = this.app.m; if (!m || !m.pve || !this.el) return;
      const K = this.keys, u = this.unit();
      let x = (K.d || K.arrowright ? 1 : 0) - (K.a || K.arrowleft ? 1 : 0) + this.stick.x, y = (K.s || K.arrowdown ? 1 : 0) - (K.w || K.arrowup ? 1 : 0) + this.stick.y;
      m.pve.mv = { x, y };
      if (!u) return;
      if (m.pve.out || (u.out && !u.alive)) {
        if (!this.outShown) { this.outShown = true; this.app.hud.banner(`💀 Bạn bị loại — hạng ${u.place || '?'} • chuyển sang góc nhìn trọng tài`, 'red'); this.app.r.cam.focusId = null; this.app.speed = this.app.pref.speed || 2; this.el.classList.add('pve-dead'); }
        return;
      }
      for (const b of this.el.querySelectorAll('.pve-sk')) {
        const k = b.dataset.k, def = u.hero.skills[k];
        if (!def || (k !== 'sub' && !(u.ranks[k] > 0))) { b.classList.add('off'); b.querySelector('em').textContent = def ? '🔒' : ''; continue; }
        const cd = u.recast[k] ? 0 : Math.max(0, u.cd[k] || 0), ready = !!u.recast[k] || m.canCast(u, k);
        b.classList.toggle('off', !ready); b.classList.toggle('re', !!u.recast[k]);
        b.querySelector('span').textContent = def.name.split(/[\s/]/)[0];
        b.querySelector('em').textContent = cd > 0.05 ? cd.toFixed(cd < 3 ? 1 : 0) : '';
      }
      const pots = u.pots || {}; const em = this.el.querySelectorAll('.pve-sm em'); if (em[0]) em[0].textContent = pots.hp || 0; if (em[1]) em[1].textContent = (pots.mp || 0) + (pots.ga || 0);
      const t = m.pve.lockId != null ? m.units.find((v) => v.id === m.pve.lockId) : null;
      $('#pvInfo').innerHTML = `❤ ${Math.round(u.hp)}/${Math.round(u.st.maxHp)}${u.resource === 'mana' ? ` • 💧 ${Math.round(u.mp)}` : ''} • Cấp ${u.level} • 💰 ${Math.round(u.gold)}${t && t.alive ? ` • 🎯 ${esc(t.hero ? t.hero.name : t.name || 'quái')}` : ''}`;
    },
  };
  G.PveUI = PveUI;
})();
