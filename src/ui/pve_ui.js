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
        <p class="hint">Bạn điều khiển 1 tướng giữa 9 tướng máy — <b>AI của tướng bạn bị tắt hoàn toàn</b> (không tự đánh, tự dùng chiêu, tự uống bình hay tự liên minh), tầm nhìn như người chơi thường (có chỉ báo âm thanh). <b>PC</b>: WASD đi • giữ Q/E/R/F/Space để ngắm theo chuột, nhả để tung • chuột phải hủy • click trái vào địch để khóa đánh • H/G bình • B balo • T đổi mục tiêu.
          <b>Điện thoại</b>: chạm nửa trái để hiện cần ảo • chạm nhanh nút chiêu = tung tự động • giữ & kéo = vòng chỉ thị, kéo vào ✕ để hủy • nút ⚔ chạm để đánh, kéo để khóa mục tiêu • giữ 🎒 để mở bánh xe balo.</p>
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
      this.unmount();
      const el = document.createElement('div'); el.id = 'pvePad'; el.className = 'pve-pad';
      el.innerHTML = `
        <div class="pve-left" id="pvLeft"><div class="pve-stick" id="pvStick"><i id="pvKnob"></i></div></div>
        <div class="pve-cancel" id="pvCancel">✕ HỦY</div>
        <div class="pve-btns">
          ${['s1', 's2', 's3', 's4', 'sub'].map((k) => `<button class="pve-sk pve-${k}" data-k="${k}"><b>${{ s1: 'Q', s2: 'E', s3: 'R', s4: 'F', sub: '␣' }[k]}</b><span></span><em></em></button>`).join('')}
          <button class="pve-atk" id="pvAtk">⚔</button>
          <button class="pve-sm" data-a="lock" title="Đổi mục tiêu (T)">🎯</button>
          <button class="pve-sm" data-a="bag" id="pvBag" title="Giữ để mở bánh xe balo (B)">🎒</button>
          <button class="pve-sm" data-a="hp" title="Bình máu (H)">❤<em></em></button>
          <button class="pve-sm" data-a="mp" title="Bình mana / giáp (G)">💧<em></em></button>
        </div>
        <div class="pve-wheel hidden" id="pvWheel"></div>
        <div class="pve-info" id="pvInfo"></div>`;
      $('#match').appendChild(el); this.el = el; document.body.classList.add('pve-on');
      this.keys = {}; this.mouse = null; this.aim = null; this.held = {};
      this.kd = (e) => this.onKey(e, true); this.ku = (e) => this.onKey(e, false);
      window.addEventListener('keydown', this.kd); window.addEventListener('keyup', this.ku);
      const cv = this.app.cv;
      this.mm = (e) => { const r = cv.getBoundingClientRect(); this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top, W: r.width, H: r.height, t: performance.now() }; if (this.aim && this.aim.pc) this.aimFromMouse(); };
      this.md = (e) => { if (e.pointerType !== 'mouse') return; if (e.button === 2 && this.aim) { this.aim.cancel = true; this.release(); e.preventDefault(); return; } if (e.button === 0 && !this.aim) this.clickAttack(e); };
      this.cm = (e) => e.preventDefault();
      cv.addEventListener('pointermove', this.mm); cv.addEventListener('pointerdown', this.md); cv.addEventListener('contextmenu', this.cm);
      this.bindStick(); this.bindSkills(); this.bindAtk(); this.bindBag();
      for (const b of el.querySelectorAll('.pve-sm')) if (b.dataset.a !== 'bag') b.onclick = (e) => { e.stopPropagation(); const a = b.dataset.a; if (a === 'lock') this.cycle(); else this.drink(a); };
      this.raf = requestAnimationFrame(() => this.tick());
    },
    unmount() {
      document.body.classList.remove('pve-on');
      if (this.el) this.el.remove(); this.el = null;
      if (this.kd) { window.removeEventListener('keydown', this.kd); window.removeEventListener('keyup', this.ku); }
      if (this.mm && this.app) { const cv = this.app.cv; cv.removeEventListener('pointermove', this.mm); cv.removeEventListener('pointerdown', this.md); cv.removeEventListener('contextmenu', this.cm); }
      this.kd = this.ku = this.mm = this.md = null;
      if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0;
      if (this.app) { this.app.pveMode = false; if (this.app.r) { this.app.r.pov = null; this.app.r.cam.push = null; } }
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
      const I = A.ind; A.magnet = null;
      if (I.type === 'self') { A.pt = { x: u.x, y: u.y }; return; }
      let dir = A.dir, best = null, ba = 0.2094;   // 12°
      for (const h of m.heroes) {
        if (!h.alive || h === u || h.team === u.team || (h.vis && h.vis[u.team] === false)) continue;
        const dx = h.x - u.x, dy = h.y - u.y, d = Math.hypot(dx, dy); if (d > I.R + 1.5 || d < 0.5) continue;
        const ang = Math.acos(Math.max(-1, Math.min(1, (dx * dir.x + dy * dir.y) / d)));
        if (ang < ba) { ba = ang; best = h; }
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
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { this.keys[k] = down; e.preventDefault(); return; }
      if (KEYS[k]) {
        e.preventDefault();
        if (down && !this.held[k]) { this.held[k] = true; if (!this.aim) this.beginAim(KEYS[k], null, true); }
        else if (!down) { this.held[k] = false; if (this.aim && this.aim.pc && this.aim.k === KEYS[k]) { if (this.mouse) this.aimFromMouse(); this.release(); } }
        return;
      }
      if (k === 'b') { this.bagKey(down); return; }
      if (!down) return;
      if (k === 't') this.cycle();
      else if (k === 'h') this.drink('hp');
      else if (k === 'g') this.drink('mp');
      else if (k === 'escape') { if (this.aim) { this.aim.cancel = true; this.release(); } else { this.unmount(); this.app.quitMatch(); } }
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
        if (!this.outShown) { this.outShown = true; this.app.hud.banner(`💀 Bạn bị loại — hạng ${u.place || '?'} • chuyển sang góc nhìn trọng tài`, 'red'); r.cam.focusId = null; r.pov = null; r.cam.push = null; this.app.setSpeed(this.app.pref.speed || 2); this.el.classList.add('pve-dead'); }
        return;
      }
      // camera: chiêu tầm xa đang ngắm → trôi theo hướng ngắm; PC: con trỏ sát mép → trôi tối đa 8 đv
      const A = this.aim;
      if (A && A.kind === 'skill' && A.ind.R > 10 && A.dirS) { const k = A.ind.R * 0.6 * Math.max(0.4, A.mag); r.cam.push = { x: A.dirS.x * k, y: A.dirS.y * k }; }
      else if (this.mouse && performance.now() - this.mouse.t < 4000) {
        const ex = this.mouse.x < this.mouse.W * 0.05 ? -1 : this.mouse.x > this.mouse.W * 0.95 ? 1 : 0, ey = this.mouse.y < this.mouse.H * 0.05 ? -1 : this.mouse.y > this.mouse.H * 0.95 ? 1 : 0;
        r.cam.push = ex || ey ? { x: ex * 8, y: ey * 8 } : null;
      } else if (!A) r.cam.push = null;
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
      // vòng chỉ thị
      const A = this.aim;
      if (A && A.kind === 'skill') {
        const I = A.ind, bad = A.cancel, col = bad ? 'rgba(150,40,40,' : A.magnet ? 'rgba(255,90,90,' : 'rgba(90,170,255,', d = A.dirS || A.dir;
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
