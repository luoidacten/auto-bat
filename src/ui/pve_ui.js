'use strict';
// ===== GĐ12: GIAO DIỆN CHẾ ĐỘ PvE SINH TỒN — bạn tự điều khiển 1 tướng, 9 tướng còn lại do máy =====
// Đường thực thi thống nhất: mọi thao tác của người chơi (cảm ứng hay chuột-phím) cuối cùng chỉ sinh ra lệnh
//   { k: slot, pt: vị trí ngắm, tgt: id }  → m.executeSkill(u, slot, pos, ent)
//   { atk: id | null, dir }                → m.executeBasicAttack(u, target, dir)
// đúng như AI (AI tính vị trí bằng lấy mẫu không gian / gom cụm / đón đầu rồi gọi cùng castSkill).
//
// BỘ ĐIỀU HỢP NHẬP LIỆU (Input Adapter):
//  • PC: WASD di chuyển • chuột ngắm (chiêu rơi đúng con trỏ) • GIỮ Q/E/R/F/Space = hiện vòng chỉ thị bám con trỏ, NHẢ = tung
//    (bấm nhanh < 0.15s cũng tung tại con trỏ) • chuột phải / Esc khi đang giữ = hủy • click trái vào kẻ địch = khóa & đánh •
//    con trỏ sát mép màn hình (5%) = camera trôi về phía đó tối đa 8 đv • H/G bình • B bánh xe balo • T đổi mục tiêu.
//  • Điện thoại: cần ảo NỔI (chạm bất kỳ đâu nửa trái màn hình) • nút chiêu: CHẠM NHANH = tung vào mục tiêu ưu tiên (đón đầu nhẹ),
//    GIỮ & KÉO = vòng chỉ thị (Đường thẳng / Hình nón / Vòng rơi), kéo vào ô [✕ HỦY] góc trên phải = hủy • NAM CHÂM NGẮM: dải ngắm
//    lệch ≤ 12° so với một tướng địch thì tự hút vào điểm đón đầu của nó; kéo mạnh vượt góc thì ngắm tự do • chiêu tầm > 10 đv:
//    camera trôi theo hướng ngắm (tầm × 0.6) • NÚT ĐÁNH THƯỜNG: chạm = tự chọn (tướng thấp máu nhất trong tầm → tướng gần nhất →
//    quái đang đánh; không có thì bước ngắn về phía địch), kéo = đường vàng, rê qua mục tiêu nào thì vòng khóa đỏ ghim vào nó;
//    lệnh đánh giữ tới khi di chuyển / mục tiêu chết / khuất tầm nhìn — KHÔNG có tự đánh khi đứng yên •
//    BÁNH XE BALO: giữ 🎒 → bung tối đa 6 ô quanh ngón tay, quẹt về món cần dùng rồi thả.
//  • Tầm nhìn như người chơi thường (sương mù ngoài tầm nhìn đội mình) + CHỈ BÁO ÂM THANH: ⚔ tiếng giao tranh (30 đv), 💨 tiếng lướt
//    (18 đv), 👣 tiếng bước chân ngoài bụi (9 đv) của kẻ địch khuất tầm nhìn — vị trí hơi lệch, ngoài màn hình thì thành mũi tên ở mép.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const esc = (s) => G.esc(s);
  const $ = (s) => document.querySelector(s);
  const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const KEYS = { q: 's1', e: 's2', r: 's3', f: 's4', ' ': 'sub' };
  const TAU = Math.PI * 2;
  const MAXDRAG = 85;
  const cap = (el, id) => { try { el.setPointerCapture(id); } catch (e) { /* con trỏ giả lập / đã nhả */ } };

  // loại vòng chỉ thị theo dữ liệu chiêu
  function indicator(def) {
    const a = def.ai || {}, t = ((def.name || '') + ' ' + (def.desc || '')).toLowerCase();
    if (a.aim === 'self') return { type: 'self', R: a.aoe || a.range || 3 };
    const R = a.rangeFn ? 8 : a.range || 5;
    if (a.cone || /hình nón|hình quạt|nón đạn|quạt|180°|90°/.test(t)) return { type: 'cone', R, half: a.coneHalf || 0.75 };
    if (a.aoe || ((a.aim === 'point' || a.aim === 'unit') && !a.speed && !a.skillshot && /vùng|bán kính|rơi|thiên thạch|cột nước|mưa|hộp|bão/.test(t))) return { type: 'circle', R, r: a.aoe || 2.5 };
    return { type: 'line', R, w: a.w || 1.1, unit: a.aim === 'unit' };
  }

  const PveUI = {
    open(app) {
      this.app = app;
      app.show('setup');
      const ids = Object.keys(G.HEROES).filter((id) => !G.HEROES[id].hidden && !id.startsWith('dummy')).sort((a, b) => G.HEROES[a].name.localeCompare(G.HEROES[b].name));
      const pick = this.last || ids[0];
      $('#setup').innerHTML = `
        <h2>🕹 Sinh Tồn PvE — chọn tướng của bạn</h2>
        <p class="hint">Bạn điều khiển 1 tướng giữa 9 tướng máy — <b>AI của tướng bạn bị tắt hoàn toàn</b> (không tự đánh, tự dùng chiêu, tự uống bình hay tự liên minh), tầm nhìn như người chơi thường (có chỉ báo âm thanh). <b>PC (kiểu LoL)</b>: <b>chuột phải</b> lên đất = đi tới (giữ để đi theo con trỏ), lên kẻ địch = đánh • WASD cũng đi được • giữ Q/E/R/F/Space để ngắm theo chuột, nhả để tung (chuột phải lúc ngắm = hủy) • U bật/tắt tự ngắm (bật: bấm nhanh chiêu chỉ nhắm kẻ địch TRONG TẦM chiêu; tắt: tung theo hướng mặt) • I bảng chiêu & chỉ số (rê chuột lên nút chiêu để xem nhanh) • Y khóa/thả camera (thả rồi mới kéo mép màn hình) • P cửa hàng • V mở rương • 1–4 ô dùng nhanh (phép bổ trợ / vật phẩm balo, hướng theo con trỏ) • Alt+1/2/3 chọn nhánh cây tiến hóa • Ctrl+Q/E/R/F nâng chiêu • H/G bình • B balo • T đổi mục tiêu.
          <b>Điện thoại</b>: chạm nhanh lên bản đồ = đi tới / đánh • chạm nửa trái để hiện cần ảo • chạm nhanh nút chiêu = tung tự động • giữ & kéo = vòng chỉ thị, kéo vào ✕ để hủy • nút ⚔ chạm để đánh, kéo để khóa mục tiêu • giữ 🎒 để mở bánh xe balo.</p>
        <div class="pve-grid">${ids.map((id) => { const H = G.HEROES[id]; return `<button class="pve-hero${id === pick ? ' on' : ''}" data-id="${id}"><span class="dot" style="background:${H.color}"></span>${esc(H.name)}<small>${esc(H.kit || '')}</small></button>`; }).join('')}</div>
        <div class="row btns"><button class="big" id="pvGo">▶ Vào trận</button><button id="pvBack">← Quay lại</button></div>`;
      let sel = pick;
      for (const b of document.querySelectorAll('.pve-hero')) b.onclick = () => { sel = b.dataset.id; for (const x of document.querySelectorAll('.pve-hero')) x.classList.toggle('on', x === b); };
      $('#pvGo').onclick = () => { this.last = sel; this.start(sel); };
      $('#pvBack').onclick = () => app.menu();
    },
    start(heroId) {
      const app = this.app, cfg = G.arenaConfig(app.newSeed());
      const i = cfg.picks.findIndex((p) => p.hero === heroId);
      if (i > 0) { const t = cfg.picks[0]; cfg.picks[0] = cfg.picks[i]; cfg.picks[i] = t; }
      else if (i < 0) cfg.picks[0] = { hero: heroId, player: G.heroChar(heroId) };
      cfg.pve = heroId;
      app.startMatch(cfg);
      const u = app.m.pveOn(heroId);
      app.autoSlow = false; app.pveMode = true; app.setSpeed(1);
      app.r.cam.follow = true; app.r.cam.focusId = u.id; app.r.pov = u.team; app.r.cam.push = null;
      this.outShown = false; this.sounds = new Map();
      this.mount();
    },
    mount() {
      this.unmount(true);
      const el = document.createElement('div'); el.id = 'pvePad'; el.className = 'pve-pad';
      el.innerHTML = `
        <div class="pve-left" id="pvLeft"><div class="pve-stick" id="pvStick"><i id="pvKnob"></i></div></div>
        <div class="pve-cancel" id="pvCancel">✕ HỦY</div>
        <div class="pve-btns">
          ${['s1', 's2', 's3', 's4', 'sub'].map((k) => `<button class="pve-sk pve-${k}" data-k="${k}"><b>${{ s1: 'Q', s2: 'E', s3: 'R', s4: 'F', sub: '␣' }[k]}</b><span></span><em></em>${k !== 'sub' ? `<i class="pve-up hidden" data-up="${k}" title="Nâng chiêu (Ctrl + phím)">+</i><small class="pve-rk"></small>` : ''}</button>`).join('')}
          <button class="pve-atk" id="pvAtk">⚔</button>
          <button class="pve-sm" data-a="lock" title="Đổi mục tiêu (T)">🎯</button>
          <button class="pve-sm" data-a="bag" id="pvBag" title="Giữ để mở bánh xe balo (B)">🎒</button>
          <button class="pve-sm" data-a="hp" title="Bình máu (H)">❤<em></em></button>
          <button class="pve-sm" data-a="mp" title="Bình mana / giáp (G)">💧<em></em></button>
          <button class="pve-sm" data-a="shop" id="pvShopBtn" title="Cửa hàng (P)">🛒</button>
        </div>
        <button class="pve-chest hidden" id="pvChest" title="Mở rương (V)">🎁 Mở rương</button>
        <div class="pve-quick" id="pvQuick"></div>
        <div class="pve-wheel hidden" id="pvWheel"></div>
        <button class="pve-cam on" id="pvCam" title="Khóa / thả camera (Y)">🔒 Camera</button>
        <div class="pve-pts hidden" id="pvPts"></div>
        <div class="pve-tree hidden" id="pvTree"></div>
        <div class="pve-shop hidden" id="pvShop"></div>
        <div class="pve-info" id="pvInfo"></div>
        <div class="pve-gauge" id="pvGauge"></div>
        <button class="pve-infobtn" id="pvInfoBtn" title="Bộ chiêu & chỉ số (I)">📖 Chiêu</button>
        <button class="pve-aimbtn on" id="pvAimBtn" title="Tự ngắm khi bấm nhanh — chỉ nhắm kẻ địch TRONG TẦM chiêu (U)">🎯 Tự ngắm: BẬT</button>
        <div class="pve-book hidden" id="pvBook"></div>
        <div class="pve-tip hidden" id="pvTip"></div>`;
      $('#match').appendChild(el); this.el = el; document.body.classList.add('pve-on');
      this.keys = {}; this.mouse = null; this.aim = null; this.held = {};
      this.kd = (e) => this.onKey(e, true); this.ku = (e) => this.onKey(e, false);
      window.addEventListener('keydown', this.kd); window.addEventListener('keyup', this.ku);
      const cv = this.app.cv;
      this.mm = (e) => {
        const r = cv.getBoundingClientRect(); this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top, W: r.width, H: r.height, t: performance.now() };
        if (this.aim && this.aim.pc) this.aimFromMouse();
        if (this.rHeld && e.pointerType === 'mouse' && (e.buttons & 2) && performance.now() - this.rT > 120) { this.rT = performance.now(); this.order(e, false); }   // giữ chuột phải: đi theo con trỏ
        else if (this.rHeld && !(e.buttons & 2)) this.rHeld = false;
      };
      // LoL: chuột PHẢI = đi tới / đánh kẻ địch dưới con trỏ (giữ chuột phải để đi theo con trỏ) • chuột trái vào địch = đánh
      // • điện thoại: chạm nhanh lên bản đồ = đi tới / đánh (không kéo camera khi camera đang khóa)
      this.md = (e) => {
        if (e.pointerType !== 'mouse') { this.tap0 = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; return; }
        if (e.button === 2) { e.preventDefault(); if (this.aim) { this.aim.cancel = true; this.release(); return; } this.rHeld = true; this.rT = performance.now(); this.order(e, true); return; }
        if (e.button === 0 && !this.aim) this.clickAttack(e);
      };
      this.mu = (e) => {
        if (e.pointerType === 'mouse') { if (e.button === 2) this.rHeld = false; return; }
        const t = this.tap0; this.tap0 = null;
        if (t && t.id === e.pointerId && performance.now() - t.t < 350 && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 14) this.order(e, true);
      };
      this.cm = (e) => e.preventDefault();
      cv.addEventListener('pointermove', this.mm); cv.addEventListener('pointerdown', this.md); cv.addEventListener('pointerup', this.mu); cv.addEventListener('contextmenu', this.cm);
      this.bindStick(); this.bindSkills(); this.bindAtk(); this.bindBag();
      for (const b of el.querySelectorAll('.pve-sm')) if (b.dataset.a !== 'bag') b.onclick = (e) => { e.stopPropagation(); const a = b.dataset.a; if (a === 'lock') this.cycle(); else if (a === 'shop') this.toggleShop(); else this.drink(a); };
      $('#pvCam').onclick = (e) => { e.stopPropagation(); this.toggleCam(); };
      $('#pvQuick').addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-q]'); if (!b) return; e.stopPropagation(); e.preventDefault(); this.quick(+b.dataset.q); });
      $('#pvInfoBtn').onclick = (e) => { e.stopPropagation(); this.toggleBook(); };
      $('#pvAimBtn').onclick = (e) => { e.stopPropagation(); this.toggleAutoAim(); };
      $('#pvBook').addEventListener('click', (e) => {
        e.stopPropagation(); if (e.target.closest('[data-close]')) { this.toggleBook(); return; }
        const b = e.target.closest('[data-choice]'); if (!b || b.disabled || !this.app.m.pve) return;
        const choice = { id: b.dataset.choice, v: b.dataset.v };
        this.app.m.pve.queue.push(b.dataset.learn ? { learn: b.dataset.learn, choice } : { choice });
        setTimeout(() => this.renderBook(), 80);
      });
      // PC: rê chuột lên nút chiêu → thẻ mô tả (không cần mở bảng)
      for (const b of el.querySelectorAll('.pve-sk')) { b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') this.showTip(b.dataset.k, b); }); b.addEventListener('pointerleave', () => this.hideTip()); }
      $('#pvChest').onclick = (e) => { e.stopPropagation(); this.openChest(); };
      // nút không giữ focus — tránh phím cách / Enter "bấm lại" nút vừa chạm (vd. nút tốc độ)
      this.blur = (e) => { if (e.target.closest && e.target.closest('button')) setTimeout(() => { const a = document.activeElement; if (a && a.tagName === 'BUTTON') a.blur(); }, 0); };
      document.addEventListener('click', this.blur, true);
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
      $('#pvShop').addEventListener('click', (e) => this.shopClick(e));
      $('#pvTree').addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-tree]'); if (b) this.pickTree(+b.dataset.tree); });
      this.treeKey = null;
      this.raf = requestAnimationFrame(() => this.tick());
    },
    // keep = dọn giao diện cũ để dựng lại (giữ cờ pveMode + góc nhìn người chơi r.pov — trước đây bị xóa nhầm khiến phím cách = tạm dừng, minimap thấy hết tướng)
    unmount(keep) {
      document.body.classList.remove('pve-on', 'pve-dead');
      if (this.blur) document.removeEventListener('click', this.blur, true); this.blur = null;
      if (this.el) this.el.remove(); this.el = null;
      if (this.kd) { window.removeEventListener('keydown', this.kd); window.removeEventListener('keyup', this.ku); }
      if (this.mm && this.app) { const cv = this.app.cv; cv.removeEventListener('pointermove', this.mm); cv.removeEventListener('pointerdown', this.md); cv.removeEventListener('pointerup', this.mu); cv.removeEventListener('contextmenu', this.cm); }
      this.kd = this.ku = this.mm = this.md = this.mu = null;
      if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0;
      if (this.app && !keep) { this.app.pveMode = false; if (this.app.r) { this.app.r.pov = null; this.app.r.cam.push = null; } }
    },
    unit() { const m = this.app.m; return m && m.pve ? m.pveUnit() : null; },
    w2s(x, y) { return this.app.r.w2s(x, y); },
    s2w(x, y) { return this.app.r.s2w(x, y); },

    // ---------- cần ảo nổi (nửa trái màn hình) ----------
    bindStick() {
      const L = $('#pvLeft'), st = $('#pvStick'), kn = $('#pvKnob'); this.stick = { x: 0, y: 0 };
      let c = null, id = null;
      L.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; id = e.pointerId; cap(L, id); c = { x: e.clientX, y: e.clientY }; const r = L.getBoundingClientRect(); st.style.left = (c.x - r.left - 64) + 'px'; st.style.top = (c.y - r.top - 64) + 'px'; st.classList.add('on'); e.stopPropagation(); });
      L.addEventListener('pointermove', (e) => { if (e.pointerId !== id || !c) return; let dx = (e.clientX - c.x) / 64, dy = (e.clientY - c.y) / 64; const n = Math.hypot(dx, dy); if (n > 1) { dx /= n; dy /= n; } this.stick = { x: dx, y: dy }; kn.style.transform = `translate(${dx * 40}px,${dy * 40}px)`; });
      const rel = (e) => { if (e.pointerId !== id) return; c = null; id = null; this.stick = { x: 0, y: 0 }; kn.style.transform = ''; st.classList.remove('on'); };
      L.addEventListener('pointerup', rel); L.addEventListener('pointercancel', rel);
    },
    // ---------- nút chiêu: chạm nhanh / giữ & kéo vòng chỉ thị ----------
    bindSkills() {
      for (const b of this.el.querySelectorAll('.pve-sk')) {
        b.addEventListener('pointerdown', (e) => {
          const up = e.target.closest('.pve-up');
          if (up) { e.stopPropagation(); e.preventDefault(); this.learn(up.dataset.up); return; }   // nút + nâng chiêu
          e.stopPropagation(); e.preventDefault(); cap(b, e.pointerId);
          const r = b.getBoundingClientRect();
          this.beginAim(b.dataset.k, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, false);
          if (this.aim) this.aim.pid = e.pointerId;
        });
        b.addEventListener('pointermove', (e) => { if (this.aim && this.aim.pid === e.pointerId) this.dragAim(e.clientX, e.clientY); });
        b.addEventListener('pointerup', (e) => { if (this.aim && this.aim.pid === e.pointerId) this.release(); });
        b.addEventListener('pointercancel', () => { if (this.aim) { this.aim.cancel = true; this.release(); } });
      }
    },
    beginAim(k, origin, pc) {
      const u = this.unit(); if (!u) return;
      const def = u.hero.skills[k]; if (!def) return;
      this.aim = { kind: 'skill', k, def, ind: indicator(def), t0: performance.now(), origin, cur: origin, dir: { x: u.fx, y: u.fy }, mag: 0, pc, cancel: false, pt: null, magnet: null };
      if (pc) this.aimFromMouse();
      $('#pvCancel').classList.add('on');
    },
    dragAim(x, y) {
      const A = this.aim; if (!A) return;
      A.cur = { x, y };
      const dx = x - A.origin.x, dy = y - A.origin.y, L = Math.hypot(dx, dy);
      if (L > 6) { A.dir = { x: dx / L, y: dy / L }; A.mag = Math.min(1, L / MAXDRAG); A.dragged = true; }
      const c = $('#pvCancel').getBoundingClientRect(); A.cancel = x >= c.left && x <= c.right && y >= c.top && y <= c.bottom;
      $('#pvCancel').classList.toggle('hot', A.cancel);
      this.solveAim();
    },
    aimFromMouse() {
      const A = this.aim, u = this.unit(); if (!A || !u || !this.mouse) return;
      const w = this.s2w(this.mouse.x, this.mouse.y), dx = w.x - u.x, dy = w.y - u.y, L = Math.hypot(dx, dy) || 1;
      A.dir = { x: dx / L, y: dy / L }; A.mag = Math.min(1, L / Math.max(1, A.ind.R)); A.dragged = true; A.mouseW = w;
      this.solveAim();
    },
    // từ hướng + độ kéo → điểm ngắm; nam châm hút về điểm đón đầu khi lệch ≤ 12°
    solveAim() {
      const A = this.aim, u = this.unit(), m = this.app.m; if (!A || !u) return;
      const I = A.ind, prev = A.magnet; A.magnet = null;
      if (I.type === 'self') { A.pt = { x: u.x, y: u.y }; return; }
      // GĐ13: nam châm nhẹ (chỉ cảm ứng): bắt khi lệch ≤ 7°, giữ tới 12° (trễ) — không còn "khóa góc" khi lia ngón tay qua kẻ địch
      let dir = A.dir, best = null, ba = 0;
      if (!A.pc && this.autoAimOn()) for (const h of m.heroes) {   // tắt tự ngắm = không nam châm
        if (!h.alive || h === u || h.team === u.team || (h.vis && h.vis[u.team] === false)) continue;
        const dx = h.x - u.x, dy = h.y - u.y, d = Math.hypot(dx, dy); if (d > I.R + 1.5 || d < 0.5) continue;
        const ang = Math.acos(Math.max(-1, Math.min(1, (dx * dir.x + dy * dir.y) / d))), lim = h === prev ? 0.2094 : 0.122;
        if (ang < lim && (!best || ang < ba)) { ba = ang; best = h; }
      }
      if (best && !A.pc) {
        const sp = (A.def.ai && A.def.ai.speed) || 0, tt = Math.min(0.6, (sp ? Math.hypot(best.x - u.x, best.y - u.y) / sp : 0.25) + (A.def.castTime || 0));
        const lp = { x: best.x + (best.vx || 0) * tt, y: best.y + (best.vy || 0) * tt }, L = Math.hypot(lp.x - u.x, lp.y - u.y) || 1;
        dir = { x: (lp.x - u.x) / L, y: (lp.y - u.y) / L }; A.magnet = best;
        if (I.type === 'circle') { A.pt = Math.hypot(lp.x - u.x, lp.y - u.y) <= I.R ? lp : { x: u.x + dir.x * I.R, y: u.y + dir.y * I.R }; A.dirS = dir; return; }
      }
      A.dirS = dir;
      if (I.type === 'circle') { const k = A.pc && A.mouseW ? Math.min(1, Math.hypot(A.mouseW.x - u.x, A.mouseW.y - u.y) / I.R) : A.mag; A.pt = { x: u.x + dir.x * I.R * k, y: u.y + dir.y * I.R * k }; }
      else A.pt = { x: u.x + dir.x * I.R, y: u.y + dir.y * I.R };
      if (A.pc && A.mouseW && I.type !== 'circle') { const dm = Math.hypot(A.mouseW.x - u.x, A.mouseW.y - u.y); if (dm < I.R) A.pt = A.mouseW; }   // PC: chiêu rơi đúng con trỏ
    },
    release() {
      const A = this.aim; this.aim = null; $('#pvCancel').classList.remove('on', 'hot');
      this.app.r.cam.push = null;
      if (!A || A.cancel) return;
      const m = this.app.m; if (!m || !m.pve) return;
      const quick = !A.pc && (!A.dragged || performance.now() - A.t0 < 150 && Math.hypot(A.cur.x - A.origin.x, A.cur.y - A.origin.y) < 14);
      if (A.kind === 'atk') { m.pve.queue.push({ atk: A.lock ? A.lock.id : null, dir: A.dir }); return; }
      if (quick) { m.pve.queue.push({ k: A.k }); return; }                      // bấm nhanh: mục tiêu ưu tiên + đón đầu nhẹ
      m.pve.queue.push({ k: A.k, pt: A.pt, tgt: A.magnet ? A.magnet.id : (A.ind.unit && m.pve.lockId != null ? m.pve.lockId : undefined) });
    },
    // ---------- nút đánh thường: chạm / kéo khóa ----------
    bindAtk() {
      const b = $('#pvAtk');
      b.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); cap(b, e.pointerId); const r = b.getBoundingClientRect(); const u = this.unit(); this.aim = { kind: 'atk', t0: performance.now(), origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, cur: null, dir: u ? { x: u.fx, y: u.fy } : { x: 1, y: 0 }, mag: 0, pid: e.pointerId, lock: null }; this.aim.cur = this.aim.origin; });
      b.addEventListener('pointermove', (e) => {
        const A = this.aim; if (!A || A.kind !== 'atk' || A.pid !== e.pointerId) return;
        const dx = e.clientX - A.origin.x, dy = e.clientY - A.origin.y, L = Math.hypot(dx, dy); A.cur = { x: e.clientX, y: e.clientY };
        if (L < 10) return; A.dir = { x: dx / L, y: dy / L }; A.dragged = true;
        const u = this.unit(), m = this.app.m; if (!u) return;
        const len = u.st.range + u.r + 5; let best = null, bs = 1.6;
        for (const v of m.units) {
          if (!v.alive || v.team === u.team || (v.kind !== 'hero' && v.kind !== 'monster' && v.kind !== 'pet') || (v.vis && v.vis[u.team] === false)) continue;
          const px = v.x - u.x, py = v.y - u.y, along = px * A.dir.x + py * A.dir.y; if (along < 0 || along > len) continue;
          const off = Math.abs(px * A.dir.y - py * A.dir.x) - v.r - (v.kind === 'hero' ? 0.6 : 0);   // ưu tiên tướng hơn quái
          if (off < bs) { bs = off; best = v; }
        }
        A.lock = best;
      });
      b.addEventListener('pointerup', (e) => { const A = this.aim; if (A && A.kind === 'atk' && A.pid === e.pointerId) { if (A.lock && this.app.m.pve) this.app.m.pve.lockId = A.lock.id; this.release(); } });
      b.addEventListener('pointercancel', () => { this.aim = null; });
    },
    // lệnh kiểu LoL tại vị trí con trỏ / ngón tay: có kẻ địch nhìn thấy dưới đó → khóa & đánh; không thì đi tới điểm đó
    order(e, mark) {
      const u = this.unit(), m = this.app.m; if (!u || !m.pve || m.pve.out) return;
      const r = this.app.cv.getBoundingClientRect(), w = this.s2w(e.clientX - r.left, e.clientY - r.top);
      let best = null, bd = 1.2;
      for (const v of m.units) { if (!v.alive || v.team === u.team || !v.targetable || (v.kind !== 'hero' && v.kind !== 'monster' && v.kind !== 'pet') || (v.vis && v.vis[u.team] === false)) continue; const d = Math.hypot(v.x - w.x, v.y - w.y) - v.r; if (d < bd) { bd = d; best = v; } }
      if (best) { m.pve.lockId = best.id; m.pve.queue.push({ atk: best.id }); if (mark) this.mark = { x: best.x, y: best.y, t: performance.now(), atk: true }; return; }
      m.pve.queue.push({ move: { x: w.x, y: w.y } });
      if (mark) this.mark = { x: w.x, y: w.y, t: performance.now(), atk: false };
    },
    clickAttack(e) {
      const u = this.unit(), m = this.app.m; if (!u || !m.pve) return;
      const r = this.app.cv.getBoundingClientRect(), w = this.s2w(e.clientX - r.left, e.clientY - r.top);
      let best = null, bd = 1.6;
      for (const v of m.units) { if (!v.alive || v.team === u.team || (v.vis && v.vis[u.team] === false)) continue; const d = Math.hypot(v.x - w.x, v.y - w.y) - v.r; if (d < bd) { bd = d; best = v; } }
      if (best) { m.pve.lockId = best.id; m.pve.queue.push({ atk: best.id }); }
    },
    // ---------- bánh xe balo ----------
    bindBag() {
      const b = $('#pvBag'), W = $('#pvWheel');
      let c = null, items = [], sel = -1, id = null;
      const open = (x, y) => {
        const u = this.unit(); if (!u || !u.bag) return false;
        items = u.bag.slots.filter((s) => s.n > 0).slice(0, 6); if (!items.length) return false;
        const C = G.CONSUMABLES, n = items.length;
        W.innerHTML = items.map((s, i) => { const a = -Math.PI / 2 + i * TAU / n, d = C[s.id] || {}; return `<div class="pve-wi" style="left:${Math.cos(a) * 70}px;top:${Math.sin(a) * 70}px" data-i="${i}">${d.icon || '🎁'}<small>${esc(d.name || s.id)}</small><em>${s.n}</em></div>`; }).join('');
        W.style.left = x + 'px'; W.style.top = y + 'px'; W.classList.remove('hidden'); c = { x, y }; sel = -1; return true;
      };
      const move = (x, y) => { if (!c) return; const dx = x - c.x, dy = y - c.y; sel = Math.hypot(dx, dy) < 28 ? -1 : Math.round(((Math.atan2(dy, dx) + Math.PI / 2 + TAU) % TAU) / (TAU / items.length)) % items.length; W.querySelectorAll('.pve-wi').forEach((d, i) => d.classList.toggle('on', i === sel)); };
      const close = () => { W.classList.add('hidden'); if (c && sel >= 0 && items[sel] && this.app.m.pve) this.app.m.pve.queue.push({ bag: items[sel].id }); c = null; };
      b.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); id = e.pointerId; cap(b, id); const r = this.el.getBoundingClientRect(); open(e.clientX - r.left, e.clientY - r.top); this.wheelOrigin = { x: e.clientX, y: e.clientY }; });
      b.addEventListener('pointermove', (e) => { if (e.pointerId === id && this.wheelOrigin) move(c ? c.x + (e.clientX - this.wheelOrigin.x) : 0, c ? c.y + (e.clientY - this.wheelOrigin.y) : 0); });
      b.addEventListener('pointerup', (e) => { if (e.pointerId === id) { close(); id = null; this.wheelOrigin = null; } });
      this.bagKey = (down) => { if (down && !c) { const r = this.el.getBoundingClientRect(); open(r.width / 2, r.height / 2); this.wheelOrigin = this.mouse ? { x: this.mouse.x, y: this.mouse.y } : { x: r.width / 2, y: r.height / 2 }; } else if (!down) { if (this.mouse && this.wheelOrigin) move(c.x + this.mouse.x - this.wheelOrigin.x, c.y + this.mouse.y - this.wheelOrigin.y); close(); this.wheelOrigin = null; } };
      this.bagMove = () => { if (c && this.mouse && this.wheelOrigin) move(c.x + this.mouse.x - this.wheelOrigin.x, c.y + this.mouse.y - this.wheelOrigin.y); };
    },
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
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;   // đang gõ ô tìm kiếm
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { this.keys[k] = down; e.preventDefault(); return; }
      if (KEYS[k] && (e.ctrlKey || e.altKey) && down && KEYS[k] !== 'sub') { e.preventDefault(); this.learn(KEYS[k]); return; }   // Ctrl/Alt + Q/E/R/F = nâng chiêu
      if (KEYS[k]) {
        e.preventDefault();
        if (down && !this.held[k]) { this.held[k] = true; if (!this.aim) this.beginAim(KEYS[k], null, true); }
        else if (!down) { this.held[k] = false; if (this.aim && this.aim.pc && this.aim.k === KEYS[k]) { if (this.mouse) this.aimFromMouse(); this.release(); } }
        return;
      }
      if (k === 'b') { this.bagKey(down); return; }
      if (!down) return;
      if (k === 'y') this.toggleCam();
      else if (k === 'p') this.toggleShop();
      else if (k === 'v') this.openChest();
      else if (k === 'i') this.toggleBook();
      else if (k === 'u') this.toggleAutoAim();
      else if ((k === '1' || k === '2' || k === '3') && this.treeKey != null && (e.altKey || e.shiftKey)) { e.preventDefault(); this.pickTree(+k - 1); }
      else if (k === '1' || k === '2' || k === '3' || k === '4') this.quick(+k - 1);
      else if (k === 't') this.cycle();
      else if (k === 'h') this.drink('hp');
      else if (k === 'g') this.drink('mp');
      else if (k === 'escape') { if (this.aim) { this.aim.cancel = true; this.release(); } else if (this.shopOpen) this.toggleShop(); else if (this.bookOpen) this.toggleBook(); else { this.unmount(); this.app.quitMatch(); } }
    },
    // ---------- khóa camera ----------
    camLocked() { const r = this.app.r, u = this.unit(); return !!(u && r.cam.follow && r.cam.focusId === u.id); },
    toggleCam() {
      const r = this.app.r, u = this.unit(); if (!u) return;
      if (this.camLocked()) { r.cam.follow = false; r.cam.push = null; }          // thả: camera đứng yên, kéo màn hình để nhìn quanh
      else { r.cam.follow = true; r.cam.focusId = u.id; r.cam.x = u.x; r.cam.y = u.y; }   // khóa: bám theo tướng của bạn
      if (this.app.hud.refreshCtrl) this.app.hud.refreshCtrl();
    },
    // ---------- cây tiến hóa: người chơi tự chọn nhánh khi mở mốc (cấp 1/3/6/9/12) ----------
    pickTree(j) { const m = this.app.m, u = this.unit(); if (!m || !u || u.treePend == null) return; m.pve.queue.push({ tree: j }); },
    renderTree(u) {
      const el = $('#pvTree'), i = u.treePend, key = i == null ? null : u.id + ':' + i;
      if (key === this.treeKey) return; this.treeKey = key;
      el.classList.toggle('hidden', i == null); if (i == null) return;
      const opts = (u.hero.tree && u.hero.tree[i]) || [];
      el.innerHTML = `<div class="pt-h">🌳 Cây tiến hóa — mốc cấp ${G.TREE_TIERS[i]}: chọn 1 nhánh <small>(chạm hoặc Alt+1/2/3)</small></div>` +
        opts.map((b, j) => `<button data-tree="${j}"><b>${j + 1}. ${esc(b.name)}</b><small>${esc(b.desc || '')}</small></button>`).join('');
    },
    // ---------- ô dùng nhanh 1–4: vật phẩm balo không phải bình (phép bổ trợ cũ, dây móc, bẫy, phù…) ----------
    quickItems(u) { const C = G.CONSUMABLES, seen = new Set(), L = []; for (const sl of (u.bag ? u.bag.slots : [])) { const d = C[sl.id]; if (!d || d.pot || sl.n <= 0 || seen.has(sl.id)) continue; seen.add(sl.id); L.push(sl.id); } return L.slice(0, 4); },
    quick(i) {
      const m = this.app.m, u = this.unit(); if (!m || !u) return;
      const id = this.quickItems(u)[i]; if (!id) return;
      let pt = null;
      if (this.mouse && performance.now() - this.mouse.t < 5000) pt = this.s2w(this.mouse.x, this.mouse.y);   // PC: hướng / điểm theo con trỏ (vd Tốc Biến)
      m.pve.queue.push(pt ? { bag: id, pt } : { bag: id });
    },
    renderQuick(u) {
      const L = this.quickItems(u), key = L.map((id) => id + ':' + this.app.m.bagCount(u, id)).join(',') + '|' + Math.ceil(Math.max(0, (u.bagT || 0) - this.app.m.time));
      if (key === this.quickKey) return; this.quickKey = key;
      const C = G.CONSUMABLES, m = this.app.m, cd = Math.max(0, (u.bagT || 0) - m.time);
      $('#pvQuick').innerHTML = L.map((id, i) => `<button data-q="${i}" title="${esc(C[id].name + ' — ' + (C[id].desc || ''))}"${cd > 0 ? ' class="cd"' : ''}><b>${i + 1}</b>${C[id].icon || '🎁'}<em>${m.bagCount(u, id)}</em></button>`).join('');
    },
    autoAimOn() { const m = this.app.m; return !(m && m.pve && m.pve.autoAim === false); },
    toggleAutoAim() { const m = this.app.m; if (!m || !m.pve) return; m.pve.queue.push({ autoAim: !this.autoAimOn() }); m.pve.autoAim = !this.autoAimOn(); },
    // ---------- GĐ13: thông tin chiêu rõ ràng ----------
    skillCard(u, k, full) {
      const m = this.app.m, def = u.hero.skills[k]; if (!def) return '';
      const rk = k === 'sub' ? m.rankOf(u, 'sub') : u.ranks[k] || 0, max = k === 's4' ? 3 : k === 'sub' ? 5 : 5;
      const cd = rk > 0 || k === 'sub' ? m.cdOf(u, k) : (Array.isArray(def.cd) ? def.cd[0] : typeof def.cd === 'number' ? def.cd : 0);
      const cost = rk > 0 ? m.costOf(u, k) : 0, now = u.recast[k] ? 0 : Math.max(0, u.cd[k] || 0);
      let V = null; try { if (def.variant) V = def.variant(m, u, m.pve && m.pve.lockId != null ? m.units.find((x) => x.id === m.pve.lockId) : null); } catch (e) { V = null; }
      const KEY = { s1: 'Q', s2: 'E', s3: 'R', s4: 'F', sub: 'Space' }[k];
      const bn = u.hero.branchName && k !== 'sub' ? u.hero.branchName(u, k) : '';
      return `<div class="pb-sk${rk > 0 || k === 'sub' ? '' : ' locked'}"><div class="pb-h"><b>[${KEY}] ${esc(def.name)}${bn ? ` — <span class="br">${esc(bn)}</span>` : ''}</b><span>${k === 'sub' ? 'skill phụ' : `cấp ${rk}/${max}`}</span></div>
        <div class="pb-n">⏱ hồi ${cd ? cd.toFixed(1) + 's' : '—'}${now > 0.05 ? ` <i>(còn ${now.toFixed(1)}s)</i>` : ''}${cost ? ` • 💧 ${Math.round(cost)}` : ''}${def.castTime ? ` • niệm ${def.castTime}s` : ''}${def.ai && def.ai.range ? ` • tầm ~${def.ai.range} đv` : ''}${u.recast[k] ? ' • <b class="re">DÙNG LẠI ĐƯỢC</b>' : ''}</div>
        ${V ? `<div class="pb-v">▶ Nếu dùng bây giờ: <b>${esc(V.name)}</b> <small>(${esc(V.why)})</small></div>` : ''}
        ${full || !V ? `<div class="pb-d">${esc(def.desc || '').replace(/ • /g, '<br>• ')}</div>` : ''}${rk === 0 && k !== 'sub' ? `<div class="pb-l">🔒 chưa học — ${k === 's4' ? 'mở ở cấp 4/8/12' : 'cộng điểm chiêu (nút + / Ctrl+phím)'}</div>` : ''}</div>`;
    },
    showTip(k, b) {
      const u = this.unit(); if (!u || this.aim) return;
      const t = $('#pvTip'), r = b.getBoundingClientRect(), R = this.el.getBoundingClientRect();
      t.innerHTML = this.skillCard(u, k, true); t.classList.remove('hidden');
      t.style.right = Math.max(8, R.right - r.left + 8) + 'px'; t.style.bottom = Math.max(8, R.bottom - r.top - 40) + 'px';
      this.tipK = k;
    },
    hideTip() { $('#pvTip').classList.add('hidden'); this.tipK = null; },
    toggleBook() { this.bookOpen = !this.bookOpen; $('#pvBook').classList.toggle('hidden', !this.bookOpen); this.bookT = 0; if (this.bookOpen) this.renderBook(); },
    renderBook() {
      const u = this.unit(), m = this.app.m; if (!u) return;
      const H = u.hero, S = u.st, f1 = (x) => (Math.round(x * 10) / 10).toString();
      const tree = (u.tree || []).map((c, i) => (c != null && H.tree && H.tree[i] && H.tree[i][c] ? `<li>cấp ${G.TREE_TIERS[i]}: <b>${esc(H.tree[i][c].name)}</b> — <small>${esc(H.tree[i][c].desc)}</small></li>` : '')).join('');
      const gs = G.heroGauges ? G.heroGauges(m, u) : [];
      $('#pvBook').innerHTML = `<div class="ps-head"><b>📖 ${esc(H.name)} — bộ chiêu & chỉ số</b><span>Cấp ${u.level}</span><button data-close="1">✕</button></div>
        <div class="pb-body">
          <div class="pb-st">❤ ${Math.round(u.hp)}/${Math.round(S.maxHp)}${S.maxGa ? ` • 🛡 Hộ Giáp ${Math.round(u.ga || 0)}/${Math.round(S.maxGa)}` : ''}${u.resource === 'mana' ? ` • 💧 ${Math.round(u.mp)}/${Math.round(S.maxMp)}` : ''}<br>
          ⚔ SMVL ${Math.round(S.ad)} • ✨ SMPT ${Math.round(S.ap)} • 🛡 Giáp ${Math.round(S.armor)} • 🔮 Kháng phép ${Math.round(S.mr)}<br>
          ⚡ Tốc đánh ${f1(S.as)} • 👟 Tốc chạy ${f1(S.ms)} • 🎯 Tầm đánh ${f1(S.range)} ${u.ranged ? '(xa)' : '(cận chiến)'} • 💥 Chí mạng ${Math.round(S.crit * 100)}% • ⏱ Giảm hồi chiêu ${Math.round(S.cdr * 100)}%${S.lifesteal ? ` • 🩸 Hút máu ${Math.round(S.lifesteal * 100)}%` : ''}<br>
          ⚔ Hệ số đánh tướng hiện tại ×${f1(m.pvpPow ? m.pvpPow(u) * G.C.PVP_DMG * 0.95 : 1)} <small>(tăng theo cấp + đồ hoàn chỉnh + Ý Niệm)</small></div>
          ${gs.length ? `<div class="pb-g">${gs.map((g) => `<span>${g.k}: <b>${g.txt || Math.round(g.v) + (g.max ? '/' + g.max : '')}</b></span>`).join(' • ')}</div>` : ''}
          ${this.choicesHtml(u)}
          <div class="pb-sk"><div class="pb-h"><b>Nội tại — ${esc(H.passive.name || '')}</b></div><div class="pb-d">${esc(H.passive.desc || '').replace(/ • /g, '<br>• ')}</div></div>
          ${['s1', 's2', 's3', 's4', 'sub'].map((k) => this.skillCard(u, k, true)).join('')}
          ${tree ? `<div class="pb-sk"><div class="pb-h"><b>🌳 Nhánh tiến hóa đã chọn</b></div><ul>${tree}</ul></div>` : ''}
        </div>`;
    },
    // GĐ13: lựa chọn riêng của tướng (nhánh chiêu Tsukiyo, biến thể S4 Alice…) — hero.choices / hero.setChoice
    choicesHtml(u) {
      const m = this.app.m; if (!u.hero.choices) return '';
      let L = []; try { L = u.hero.choices(m, u) || []; } catch (e) { L = []; }
      if (!L.length) return '';
      return `<div class="pb-ch"><div class="pb-h"><b>⚙ Lựa chọn của tướng</b><small>bấm để chọn — áp dụng ngay</small></div>` + L.map((c) => {
        const k = c.id.startsWith('br_') ? c.id.slice(3) : null, up = c.learnable && k;
        return `<div class="pc-g"><div class="pc-t">${esc(c.title)}${c.openLeft ? ` <i>(còn ${c.openLeft.toFixed(0)}s để đổi hướng)</i>` : ''}${up ? ' <b class="up">⬆ có thể nâng — chọn hướng để nâng luôn</b>' : ''}${c.lock && !up ? ` <small>🔒 ${esc(c.lock)}</small>` : ''}</div>
          <div class="pc-o">${c.opts.map((o) => `<button data-choice="${c.id}" data-v="${o.v}"${up ? ` data-learn="${k}"` : ''} class="${o.v === c.cur ? 'on' : ''}"${c.lock && !up && o.v !== c.cur ? ' disabled' : ''}><b>${esc(o.name)}${o.v === c.cur ? ' ✔' : ''}</b><small>${esc(o.desc || '')}</small></button>`).join('')}</div></div>`;
      }).join('') + '</div>';
    },
    renderGauge(u) {
      const gs = G.heroGauges ? G.heroGauges(this.app.m, u) : [], el = $('#pvGauge');
      el.innerHTML = gs.map((g) => `<div class="pg"><span>${g.k}</span>${g.max ? `<i><b style="width:${Math.min(100, g.v / g.max * 100)}%;background:${g.col}"></b></i>` : ''}<em>${g.txt || Math.round(g.v) + (g.max ? '/' + g.max : '')}</em></div>`).join('');
    },
    openChest() { const m = this.app.m, u = this.unit(); if (m && u && m.pveChest(u, 2.5)) m.pve.queue.push({ chest: 1 }); },
    // ---------- điểm chiêu thủ công ----------
    learn(k) { const m = this.app.m, u = this.unit(); if (!m || !u || !m.canLearn(u, k)) return; m.pve.queue.push({ learn: k }); },
    // ---------- cửa hàng thủ công ----------
    toggleShop() { this.shopOpen = !this.shopOpen; $('#pvShop').classList.toggle('hidden', !this.shopOpen); this.shopTab = this.shopTab || 'goi_y'; this.shopT = 0; if (this.shopOpen) this.renderShop(); },
    shopClick(e) {
      e.stopPropagation();
      const b = e.target.closest('button'); if (!b) return;
      const m = this.app.m, u = this.unit(); if (!m || !u) return;
      if (b.dataset.tab) { this.shopTab = b.dataset.tab; this.shopQ = ''; const q = $('#psQ'); if (q) q.value = ''; this.renderShop(); return; }
      if (b.dataset.clear) { this.shopQ = ''; const q = $('#psQ'); if (q) { q.value = ''; q.focus(); } this.renderShop(); return; }
      if (b.dataset.close) { this.toggleShop(); return; }
      const o = b.dataset.buy ? { buy: b.dataset.buy } : b.dataset.sell != null ? { sell: +b.dataset.sell } : b.dataset.bag ? { bagBuy: b.dataset.bag } : b.dataset.bagup ? { bagUp: 1 } : b.dataset.forge ? { forge: 1 } : null;
      if (o) { m.pve.queue.push({ shop: o }); setTimeout(() => this.renderShop(), 120); }
    },
    renderShop() {
      const el = $('#pvShop'); if (!el || !this.shopOpen) return;
      const m = this.app.m, u = this.unit(); if (!m || !u) return;
      const I = G.ITEMS, can = m.pveCanShop(u), gold = Math.floor(u.gold), tab = this.shopTab || 'goi_y';
      let near = ''; if (!can) { let bd = 1e9, bm = null; for (const t of G.MAP.merchants) { const d = Math.hypot(t.x - u.x, t.y - u.y); if (d < bd) { bd = d; bm = t; } } if (bm) { const a = Math.atan2(bm.y - u.y, bm.x - u.x), arrow = ['➡', '↘', '⬇', '↙', '⬅', '↖', '⬆', '↗'][((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; near = `🧭 Thương Nhân gần nhất: ${Math.round(bd)} đv ${arrow}`; } }
      const itemRow = (id) => { const it = I[id]; if (!it) return ''; const price = m.priceOf(u, id), ok = can && m.canBuy(u, id); const own = u.items.includes(id);
        return `<div class="ps-row${own ? ' own' : ''}"><div><b>${esc(it.name)}</b>${it.comp ? ` <small>(nâng từ ${esc(I[it.comp] ? I[it.comp].name : '')})</small>` : ''}<br><small>${esc(it.statText || it.desc || '')}${it.uniq ? ' • ' + esc(it.uniq) : ''}</small></div><button data-buy="${id}"${ok ? '' : ' disabled'}>💰 ${price}</button></div>`; };
      let body = '';
      if (tab === 'goi_y') {
        if (!u.buildPlan) u.buildPlan = G.ItemAI.plan(m, u);
        const next = u.buildPlan.filter((id) => m.allowed(u, id)).slice(0, 6);
        body = `<p class="ps-hint">Lối build gợi ý cho ${esc(u.hero.name)} (theo thứ tự nên mua). Món chưa đủ tiền có thể mua <b>phôi</b> trước ở tab Tất cả.</p>` + next.map((id) => itemRow(id) + (I[id].comp && !u.items.includes(I[id].comp) ? itemRow(I[id].comp) : '')).join('');
      } else if (tab === 'all') {
        const cats = { ad: '🗡 Công vật lý', ap: '✨ Phép', def: '🛡 Phòng thủ', sup: '💚 Hỗ trợ', boots: '👢 Giày', active: '⚡ Kích hoạt' };
        body = Object.keys(cats).map((c) => { const ids = Object.keys(I).filter((id) => I[id].cat === c && !I[id].hidden).sort((a, b) => I[a].cost - I[b].cost); return ids.length ? `<h4>${cats[c]}</h4>` + ids.map(itemRow).join('') : ''; }).join('');
      } else if (tab === 'mine') {
        body = u.items.length ? u.items.map((id, i) => `<div class="ps-row own"><div><b>${esc(I[id].name)}</b><br><small>${esc(I[id].statText || '')}</small></div><button data-sell="${i}"${can ? '' : ' disabled'}>Bán +${Math.floor(I[id].cost * 0.5)}</button></div>`).join('') : '<p class="ps-hint">Chưa có trang bị.</p>';
        const cur = u.yNiem || 0, fc = G.C.YNIEM && G.C.YNIEM.forge[cur];
        body += `<h4>✨ Ý Niệm (cấp vũ khí)</h4><div class="ps-row"><div>Ý Niệm hiện tại: <b>${cur}</b>/5 — vũ khí đổi màu & mạnh hơn</div>${cur < 5 ? `<button data-forge="1"${can && gold >= fc ? '' : ' disabled'}>Đúc 💰 ${fc}</button>` : '<small>tối đa</small>'}</div>`;
      } else if (tab === 'bag') {
        const B = G.BAG, lv = u.bag ? u.bag.lv : 1;
        body = `<div class="ps-row"><div>🎒 Balo cấp <b>${lv}</b> — ${m.bagCap(u)} ô</div>${lv < 5 ? `<button data-bagup="1"${can && gold >= B.upgrade[lv] ? '' : ' disabled'}>Nâng 💰 ${B.upgrade[lv]}</button>` : '<small>tối đa</small>'}</div>`;
        const C = G.CONSUMABLES;
        body += Object.keys(C).filter((id) => !C[id].noBuy).sort((a, b) => (C[a].group || '').localeCompare(C[b].group || '') || C[a].cost - C[b].cost).map((id) => { const d = C[id], ok = can && gold >= d.cost && m.bagRoom(u, id) > 0; return `<div class="ps-row"><div>${d.icon || '🎁'} <b>${esc(d.name)}</b> <small>(có ${d.pot ? m.potCount(u, d.pot) : m.bagCount(u, id)})</small><br><small>${esc(d.desc || '')}</small></div><button data-bag="${id}"${ok ? '' : ' disabled'}>💰 ${d.cost}</button></div>`; }).join('');
      }
      // khung cố định dựng 1 lần (ô tìm kiếm giữ focus khi bảng tự làm mới); phần động cập nhật riêng
      if (!el.querySelector('.ps-search')) {
        el.innerHTML = `<div class="ps-head"><b>🛒 Cửa hàng</b><span class="ps-gold"></span><button data-close="1">✕</button></div>
          <div class="ps-st"></div><div class="ps-pts hidden"></div>
          <div class="ps-search"><input type="search" id="psQ" placeholder="🔍 Tìm trang bị / vật phẩm (tên, chỉ số: chí mạng, hút máu, giáp…)" autocomplete="off"><button data-clear="1">✕</button></div>
          <div class="ps-tabs"></div><div class="ps-body"></div>`;
        const q = el.querySelector('#psQ');
        q.addEventListener('input', () => { this.shopQ = q.value; this.renderShop(); });
        q.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { if (q.value) { q.value = ''; this.shopQ = ''; this.renderShop(); } else { q.blur(); this.toggleShop(); } } });
        q.addEventListener('keyup', (e) => e.stopPropagation());
      }
      const Q = norm(this.shopQ || '');
      if (Q) {
        const hit = (t) => norm(t).includes(Q);
        const its = Object.keys(I).filter((id) => !I[id].hidden && m.allowed(u, id) && (hit(I[id].name) || hit(I[id].statText || '') || hit(I[id].desc || '') || hit(I[id].uniq || ''))).sort((a, b) => I[a].cost - I[b].cost);
        const C = G.CONSUMABLES, cs = Object.keys(C).filter((id) => !C[id].noBuy && (hit(C[id].name) || hit(C[id].desc || '')));
        body = (its.length ? `<h4>📦 Trang bị (${its.length})</h4>` + its.map(itemRow).join('') : '') +
          (cs.length ? `<h4>🧪 Vật phẩm balo (${cs.length})</h4>` + cs.map((id) => { const d = C[id], ok = can && gold >= d.cost && m.bagRoom(u, id) > 0; return `<div class="ps-row"><div>${d.icon || '🎁'} <b>${esc(d.name)}</b><br><small>${esc(d.desc || '')}</small></div><button data-bag="${id}"${ok ? '' : ' disabled'}>💰 ${d.cost}</button></div>`; }).join('') : '') ||
          `<p class="ps-hint">Không tìm thấy “${esc(this.shopQ)}”.</p>`;
      }
      el.querySelector('.ps-gold').textContent = `💰 ${gold}`;
      const st = el.querySelector('.ps-st'); st.className = 'ps-st ' + (can ? 'ok' : 'no'); st.textContent = can ? '✅ Đang đứng cạnh Thương Nhân — mua bán được' : '⛔ Phải đứng cạnh Thương Nhân (trong 3.5 đv) mới mua được. ' + near;
      const pp = el.querySelector('.ps-pts'); pp.classList.toggle('hidden', !(u.points > 0)); if (u.points > 0) pp.textContent = `⬆ Còn ${u.points} điểm chiêu — chạm + trên nút chiêu (Ctrl+Q/E/R/F)`;
      el.querySelector('.ps-tabs').innerHTML = [['goi_y', '⭐ Gợi ý'], ['all', '📦 Tất cả'], ['mine', '🎒 Đồ của tôi'], ['bag', '🧪 Balo & bình']].map(([k, t]) => `<button data-tab="${k}" class="${tab === k && !Q ? 'on' : ''}">${t}</button>`).join('');
      el.querySelector('.ps-body').innerHTML = body;
    },
    // ---------- mỗi khung hình ----------
    tick() {
      this.raf = requestAnimationFrame(() => this.tick());
      const m = this.app.m; if (!m || !m.pve || !this.el) return;
      const K = this.keys, u = this.unit(), r = this.app.r;
      const x = (K.d || K.arrowright ? 1 : 0) - (K.a || K.arrowleft ? 1 : 0) + this.stick.x, y = (K.s || K.arrowdown ? 1 : 0) - (K.w || K.arrowup ? 1 : 0) + this.stick.y;
      m.pve.mv = { x, y };
      if (this.bagMove) this.bagMove();
      if (!u) return;
      if (m.pve.out || (u.out && !u.alive)) {
        if (!this.outShown) { this.outShown = true; this.app.hud.banner(`💀 Bạn bị loại — hạng ${u.place || '?'} • chuyển sang góc nhìn trọng tài`, 'red'); r.cam.focusId = null; r.pov = null; r.cam.push = null; this.app.setSpeed(this.app.pref.speed || 2); this.el.classList.add('pve-dead'); document.body.classList.add('pve-dead'); this.app.hud.refreshCtrl(); }
        return;
      }
      // GĐ13: ngắm cập nhật MỖI KHUNG HÌNH (tướng đang chạy thì vòng chỉ thị vẫn bám đúng con trỏ / hướng kéo, không đứng hình)
      const A = this.aim;
      if (A && A.kind === 'skill') {
        if (A.pc) this.aimFromMouse(); else this.solveAim();
        const d = A.dirS || A.dir; if (d) { const o = A.dirD || d, k = 0.45; let x = o.x + (d.x - o.x) * k, y = o.y + (d.y - o.y) * k; const L = Math.hypot(x, y) || 1; A.dirD = { x: x / L, y: y / L }; }   // làm mượt hướng vẽ
      }
      // camera: chiêu tầm xa đang ngắm → trôi theo hướng ngắm; PC: con trỏ sát mép → trôi tối đa 8 đv
      if (A && A.kind === 'skill' && !A.pc && A.ind.R > 10 && A.dirS) {   // chỉ cảm ứng: PC mà đẩy camera thì điểm ngắm theo chuột bị trôi vòng (giật)
        const k = A.ind.R * 0.6 * Math.max(0.4, A.mag); r.cam.push = { x: A.dirS.x * k, y: A.dirS.y * k }; }
      else if (this.mouse && performance.now() - this.mouse.t < 4000 && !this.camLocked()) {   // LoL: kéo mép màn hình chỉ khi đã thả camera
        const ex = this.mouse.x < this.mouse.W * 0.05 ? -1 : this.mouse.x > this.mouse.W * 0.95 ? 1 : 0, ey = this.mouse.y < this.mouse.H * 0.05 ? -1 : this.mouse.y > this.mouse.H * 0.95 ? 1 : 0;
        r.cam.push = ex || ey ? { x: ex * 8, y: ey * 8 } : null;
      } else r.cam.push = null;
      const cb = $('#pvCam'), lk = this.camLocked(); cb.classList.toggle('on', lk); cb.textContent = lk ? '🔒 Camera' : '🔓 Camera';
      // điểm chiêu chưa cộng: nút + nhấp nháy trên chiêu nâng được
      this.renderTree(u); this.renderQuick(u);
      { const ab = $('#pvAimBtn'), on = this.autoAimOn(); ab.classList.toggle('on', on); ab.textContent = on ? '🎯 Tự ngắm: BẬT' : '🎯 Tự ngắm: TẮT'; }
      if (performance.now() > (this.gT || 0)) {
        this.gT = performance.now() + 150; this.renderGauge(u);
        if (this.bookOpen && performance.now() > (this.bookT || 0)) { this.bookT = performance.now() + 700; this.renderBook(); }
        if (this.tipK) { const b = this.el.querySelector(`.pve-sk[data-k="${this.tipK}"]`); if (b) this.showTip(this.tipK, b); }
      }
      const chN = m.pveChest(u, 2.5), cb2 = $('#pvChest'), opening = u.cast && u.cast.key === 'chest';
      cb2.classList.toggle('hidden', !chN && !opening); cb2.textContent = opening ? `🎁 Đang mở… ${Math.max(0, u.cast.t).toFixed(1)}s` : '🎁 Mở rương (V)'; cb2.disabled = opening;
      const pts = $('#pvPts'); pts.classList.toggle('hidden', !(u.points > 0) || !!this.shopOpen);   // bảng cửa hàng mở → báo điểm ngay trong bảng
      if (u.points > 0) pts.textContent = `⬆ ${u.points} điểm chiêu — chạm + trên chiêu (Ctrl+Q/E/R/F)${u.hero.choices && u.hero.branchName ? ' • chọn hướng nâng trong 📖 (I)' : ''}`;
      for (const b of this.el.querySelectorAll('.pve-up')) b.classList.toggle('hidden', !m.canLearn(u, b.dataset.up));
      for (const b of this.el.querySelectorAll('.pve-rk')) { const k = b.parentNode.dataset.k; b.textContent = k ? '•'.repeat(u.ranks[k] || 0) : ''; }
      const sb = $('#pvShopBtn'); sb.classList.toggle('hot', m.pveCanShop(u));
      if (this.shopOpen && performance.now() > (this.shopT || 0)) { this.shopT = performance.now() + 600; this.renderShop(); }
      const t0 = m.pve.lockId != null ? m.units.find((v) => v.id === m.pve.lockId) : null;
      for (const b of this.el.querySelectorAll('.pve-sk')) {
        const k = b.dataset.k, def = u.hero.skills[k];
        if (!def || (k !== 'sub' && !(u.ranks[k] > 0))) { b.classList.add('off'); b.querySelector('em').textContent = def ? '🔒' : ''; continue; }
        const cd = u.recast[k] ? 0 : Math.max(0, u.cd[k] || 0), ready = !!u.recast[k] || m.canCast(u, k);
        b.classList.toggle('off', !ready); b.classList.toggle('re', !!u.recast[k]);
        // GĐ13: chiêu có nhiều biến thể (vd S4 Alice) → nút ghi biến thể SẼ RA nếu bấm ngay
        let vn = null; if (def.variant && (this.vT || 0) < performance.now()) { try { vn = def.variant(m, u, t0); } catch (e) { vn = null; } b.dataset.var = vn ? vn.name : ''; }
        const bnm = u.hero.branchName && k !== 'sub' ? u.hero.branchName(u, k) : '';
        b.querySelector('span').textContent = b.dataset.var || (bnm ? bnm.split(' ')[1] : '') || def.name.split(/[\s/]/)[0];
        b.classList.toggle('var', !!b.dataset.var);
        b.querySelector('em').textContent = cd > 0.05 ? cd.toFixed(cd < 3 ? 1 : 0) : '';
      }
      const pots = u.pots || {}; const em = this.el.querySelectorAll('.pve-sm em'); if (em[0]) em[0].textContent = pots.hp || 0; if (em[1]) em[1].textContent = (pots.mp || 0) + (pots.ga || 0);
      const t = m.pve.lockId != null ? m.units.find((v) => v.id === m.pve.lockId) : null;
      $('#pvInfo').innerHTML = `❤ ${Math.round(u.hp)}/${Math.round(u.st.maxHp)}${u.resource === 'mana' ? ` • 💧 ${Math.round(u.mp)}` : ''} • Cấp ${u.level} • 💰 ${Math.round(u.gold)} • 👥 ${m.aliveCount ? m.aliveCount() : ''}${t && t.alive ? ` • 🎯 ${esc(t.hero ? t.hero.name : t.name || 'quái')}` : ''}`;
    },
    // ---------- vẽ trên bản đồ: sương mù, vòng khóa, vòng chỉ thị, chỉ báo âm thanh ----------
    drawOverlay(r, ctx, m, alpha, z) {
      const u = this.unit(); if (!u || !u.alive || m.pve.out) return;
      const q = r.pos ? r.pos(u, alpha) : u, p = r.w2s(q.x, q.y), now = performance.now() / 1000;
      // sương mù ngoài tầm nhìn
      const VR = (u.visionR || G.C.VISION.hero) * z;
      const g = ctx.createRadialGradient(p.x, p.y, VR * 0.75, p.x, p.y, VR * 1.08);
      g.addColorStop(0, 'rgba(6,8,16,0)'); g.addColorStop(1, 'rgba(6,8,16,0.6)');
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, r.W, r.H);
      // vòng khóa mục tiêu
      const lk = m.pve.lockId != null ? m.units.find((v) => v.id === m.pve.lockId && v.alive) : null;
      if (lk) { const lq = r.pos ? r.pos(lk, alpha) : lk, lp = r.w2s(lq.x, lq.y), R = (lk.r + 0.35) * z; ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 2.5; ctx.setLineDash([R * 0.5, R * 0.3]); ctx.beginPath(); ctx.arc(lp.x, lp.y, R, now * 2, now * 2 + TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.moveTo(lp.x, lp.y - R - 10); ctx.lineTo(lp.x - 6, lp.y - R - 18); ctx.lineTo(lp.x + 6, lp.y - R - 18); ctx.fill(); }
      // dấu lệnh kiểu LoL: điểm đến (xanh) / mục tiêu đánh (đỏ), mờ dần 0.6s; đường đi tới điểm đến
      const mk = this.mark, P = m.pve;
      if (P.moveTo) { const t = r.w2s(P.moveTo.x, P.moveTo.y); ctx.strokeStyle = 'rgba(90,255,140,0.35)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(t.x, t.y); ctx.stroke(); ctx.setLineDash([]); }
      if (mk) {
        const k = (performance.now() - mk.t) / 600;
        if (k >= 1) this.mark = null;
        else { const q2 = r.w2s(mk.x, mk.y), R = (0.9 - 0.5 * k) * z; ctx.strokeStyle = mk.atk ? `rgba(255,70,70,${1 - k})` : `rgba(90,255,140,${1 - k})`; ctx.lineWidth = 2.5;
          for (let a = 0; a < 4; a++) { const an = a * Math.PI / 2 + Math.PI / 4; ctx.beginPath(); ctx.moveTo(q2.x + Math.cos(an) * R * 1.4, q2.y + Math.sin(an) * R * 1.4); ctx.lineTo(q2.x + Math.cos(an) * R * 0.5, q2.y + Math.sin(an) * R * 0.5); ctx.stroke(); }
          ctx.beginPath(); ctx.ellipse(q2.x, q2.y, R, R * 0.6, 0, 0, TAU); ctx.stroke(); }
      }
      // vòng chỉ thị
      const A = this.aim;
      if (A && A.kind === 'skill') {
        const I = A.ind, bad = A.cancel, col = bad ? 'rgba(150,40,40,' : A.magnet ? 'rgba(255,90,90,' : 'rgba(90,170,255,', d = A.dirD || A.dirS || A.dir;
        ctx.strokeStyle = col + '0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, I.R * z, 0, TAU); ctx.stroke();   // tầm tối đa
        ctx.fillStyle = col + '0.28)'; ctx.strokeStyle = col + '0.9)'; ctx.lineWidth = 2;
        if (I.type === 'line') { const w = I.w * z, L = I.R * z, a = Math.atan2(d.y, d.x); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.fillRect(0, -w / 2, L, w); ctx.strokeRect(0, -w / 2, L, w); ctx.beginPath(); ctx.moveTo(L + 10, 0); ctx.lineTo(L - 4, -w); ctx.lineTo(L - 4, w); ctx.closePath(); ctx.fill(); ctx.restore(); }
        else if (I.type === 'cone') { const a = Math.atan2(d.y, d.x); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, I.R * z, a - I.half, a + I.half); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        else if (I.type === 'circle' && A.pt) { const c = r.w2s(A.pt.x, A.pt.y); ctx.beginPath(); ctx.arc(c.x, c.y, I.r * z, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(c.x, c.y); ctx.stroke(); ctx.setLineDash([]); }
        else if (I.type === 'self') { ctx.beginPath(); ctx.arc(p.x, p.y, I.R * z, 0, TAU); ctx.fill(); }
        if (A.magnet) { const mq = r.w2s(A.magnet.x, A.magnet.y); ctx.strokeStyle = '#ff5050'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mq.x, mq.y, (A.magnet.r + 0.5) * z, 0, TAU); ctx.stroke(); }
      } else if (A && A.kind === 'atk' && A.dragged) {
        const L = (u.st.range + u.r + 5) * z; ctx.strokeStyle = 'rgba(255,210,74,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + A.dir.x * L, p.y + A.dir.y * L); ctx.stroke();
        if (A.lock) { const lp = r.w2s(A.lock.x, A.lock.y); ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(lp.x, lp.y, (A.lock.r + 0.45) * z, 0, TAU); ctx.stroke(); }
      }
      // chỉ báo âm thanh của kẻ địch khuất tầm nhìn
      for (const h of m.heroes) {
        if (!h.alive || h === u || h.team === u.team || !h.vis || h.vis[u.team] !== false) continue;
        const d = Math.hypot(h.x - u.x, h.y - u.y);
        let icon = null;
        if (m.time - (h.combatT || -99) < 1.5 && d < 30) icon = '⚔';
        else if (m.time - (h.lastDashT || -99) < 0.8 && d < 18) icon = '💨';
        else if (d < 9 && (h.vx || h.vy) && !(G.MAP.bushAt && G.MAP.bushAt(h.x, h.y) >= 0)) icon = '👣';
        if (!icon) continue;
        const jx = Math.sin(h.id * 7.1 + Math.floor(m.time)) * 1.5, jy = Math.cos(h.id * 3.3 + Math.floor(m.time)) * 1.5;   // vị trí áng chừng
        let s = r.w2s(h.x + jx, h.y + jy); const pad = 26, off = s.x < pad || s.y < pad || s.x > r.W - pad || s.y > r.H - pad;
        if (off) { const ax = s.x - r.W / 2, ay = s.y - r.H / 2, k = Math.min((r.W / 2 - pad) / Math.abs(ax || 1), (r.H / 2 - pad) / Math.abs(ay || 1)); s = { x: r.W / 2 + ax * k, y: r.H / 2 + ay * k }; }
        ctx.globalAlpha = 0.6 + 0.3 * Math.sin(now * 6 + h.id); ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(s.x, s.y, 14, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(icon, s.x, s.y);
        if (off) { const a = Math.atan2(s.y - r.H / 2, s.x - r.W / 2); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(s.x + Math.cos(a) * 20, s.y + Math.sin(a) * 20); ctx.lineTo(s.x + Math.cos(a + 0.4) * 13, s.y + Math.sin(a + 0.4) * 13); ctx.lineTo(s.x + Math.cos(a - 0.4) * 13, s.y + Math.sin(a - 0.4) * 13); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
  };
  G.PveUI = PveUI;
})();
