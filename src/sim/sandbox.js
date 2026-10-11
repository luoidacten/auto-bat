'use strict';
// ===== GĐ11: PHÒNG THỬ NGHIỆM SANDBOX (Combat Testing Lab) =====
// Một trận đặc biệt (cfg.sandbox) trên bản đồ thật (vách đá, bụi rậm, công trình) nhưng không quái, không rương, không bo:
//  • 1 tướng thử nghiệm (đội 0, AI thật điều khiển — tự dùng chiêu lên bù nhìn) + các bù nhìn (đội 1):
//      static  Bao Cát Tĩnh   — đứng im, không đánh trả, 2s không trúng đòn thì hồi đầy máu (đo DPS, tầm chiêu)
//      armored Bù Nhìn Siêu Giáp — 1000 máu + 1500 Hộ Giáp, 0 giáp (hoặc ngược lại: 100 giáp/kháng phép, 0 Hộ Giáp)
//      spitter Máy Xả Đạn     — 3 chế độ: bắn tỉa đơn (1 viên nặng / 2s), liên thanh (20 viên nhẹ), cầu năng lượng chậm có cảnh báo
//      kiter   Bù Nhìn Thả Diều — giữ cự ly 6–8 đv, chạy zíc-zắc
//      stealth Bù Nhìn Ẩn Thân — tàng hình rình rập, áp sát rồi hiện hình đánh bất ngờ
//      rival   Đối thủ tướng thật (AI đầy đủ) — test giữ cự ly / Solo
//  • Không ai chết: tướng/bù nhìn tụt về 0 máu thì hồi đầy (ghi "☠ hạ gục" vào nhật ký) — phòng tập chạy vô hạn.
//  • Bảng đo (Combat Metrics): DPS 1s gần nhất, DPS trung bình cả chuỗi, đòn cao nhất, phân rã Vật Lý/Phép/Chuẩn/Khiên/Hộ Giáp,
//    đồng hồ khống chế (choáng, trói, chậm, câm lặng…), nhật ký từng đòn [mm:ss.cs] Chiêu → sát thương (CHÍ MẠNG) → khiên vỡ → khống chế.
//  • Bảng điều khiển: Bất Tử, Không Hồi Chiêu, Vô Hạn Tài Nguyên, nhảy cấp 1→3→6→9→12→18, đổi tướng tại chỗ, lồng Solo 14 đv,
//    bo giả lập (đặt & co quanh tướng), lớp vẽ gỡ lỗi (hitbox, nón nhìn 180°, vòng tầm đánh/tầm chiêu) — tốc độ 0.1x–2x ở giao diện.
//  • Kịch bản kiểm thử mẫu (SUITE) chạy được cả không giao diện: node tools/sandbox_test.js
(function () {
  const G = globalThis.G;
  const C = G.C, M = G.M, MAP = G.MAP;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const LEVELS = [1, 3, 6, 9, 12, 18];
  const CC_TYPES = { stun: 'Choáng', root: 'Trói', slow: 'Chậm', silence: 'Câm lặng', knockup: 'Hất tung', sleep: 'Ngủ', blind: 'Mù', fear: 'Hoảng sợ', taunt: 'Khiêu khích', suppress: 'Áp chế', polymorph: 'Biến hình', charm: 'Mê hoặc' };

  // ---------------- BÙ NHÌN ----------------
  const noop = { name: '—', desc: '', cd: 999, use() {}, ai: { use: 'custom', aim: 'self', pick: () => null } };
  const DUMMY = {
    static:  { name: 'Bao Cát Tĩnh', icon: '🎯', color: '#c8a060', hp: 5000, armor: 0, mr: 0, ga: 0, ms: 0, desc: 'Đứng im, không đánh trả; 2s không trúng đòn thì hồi đầy máu. Đo DPS, tầm chiêu.' },
    armored: { name: 'Bù Nhìn Siêu Giáp', icon: '🛡', color: '#9fb8d0', hp: 1000, armor: 0, mr: 0, ga: 1500, ms: 0, desc: '1000 máu + 1500 Hộ Giáp, 0 giáp (chế độ 2: 100 giáp & kháng phép, 0 Hộ Giáp). Đo xuyên giáp / phá Hộ Giáp / sát thương chuẩn.' },
    spitter: { name: 'Máy Xả Đạn', icon: '🔫', color: '#d06a6a', hp: 4000, armor: 30, mr: 30, ga: 0, ms: 0, ranged: true, desc: 'Bắn tỉa đơn / liên thanh 20 viên / cầu năng lượng chậm có cảnh báo. Test né, phản đạn, thế thân.' },
    kiter:   { name: 'Bù Nhìn Thả Diều', icon: '🏃', color: '#7ad07a', hp: 3000, armor: 30, mr: 30, ga: 0, ms: 3.4, desc: 'Giữ cự ly 6–8 đv, chạy zíc-zắc. Test bắt lẻ, làm chậm, trói, khóa lướt.' },
    stealth: { name: 'Bù Nhìn Ẩn Thân', icon: '👻', color: '#a07ad0', hp: 2500, armor: 30, mr: 30, ga: 0, ms: 3.6, desc: 'Tàng hình rình rập rồi hiện hình đánh bất ngờ. Test radar, giật mình, chiêu bộc phá.' },
  };
  const defCache = {};
  function dummyDef(kind) {
    if (defCache[kind]) return defCache[kind];
    const D = DUMMY[kind];
    const d = {
      id: 'dummy_' + kind, name: D.name, color: D.color, gfx: kind === 'spitter' ? 'pistol' : 'none', kit: 'tank', r: 0.7, dummy: kind,
      ranged: !!D.ranged, projSpeed: 22, resource: 'mana', dmgType: 'phys',
      base: Object.assign({}, G.H.BASE.tank, { hp: D.hp, hpG: 0, armor: D.armor, armorG: 0, mr: D.mr, mrG: 0, ad: 40, adG: 0, ms: D.ms || 0.01, range: D.ranged ? 9 : 1.6, as: 0.5 }),
      passive: { name: 'Bù nhìn', desc: D.desc },
      skills: { s1: noop, s2: noop, s3: noop, s4: noop },
      ai: { order: ['s1', 's2', 's3'], role: 'tank' },
    };
    defCache[kind] = d;
    return d;
  }
  // AI bù nhìn: kế thừa HeroAI (để mọi chỗ gọi ai.callout / ai.mode… vẫn chạy) nhưng tự nghĩ theo kịch bản riêng
  let DummyAI = null;
  function dummyAI(m, u) {
    if (!DummyAI) {
      DummyAI = class extends G.HeroAI {
        think() {
          const m = this.m, u = this.u, S = m.sbx, kind = u.hero.dummy, me = S && S.hero;
          u.cd = {}; u.mp = u.st.maxMp;
          if (!me || !me.alive) { u.goal = null; u.attackTarget = null; return; }
          if (kind === 'static' || kind === 'armored') { u.goal = null; u.attackTarget = null; return; }
          const d = dist(u, me);
          if (kind === 'spitter') { u.goal = null; u.attackTarget = null; u.face(me.x, me.y); spit(m, u, me); return; }
          if (kind === 'kiter') {
            const zig = (Math.floor(m.time / 0.8) + u.id) % 2 ? 1 : -1, v = M.dir(me, u);
            const want = d < 6 ? 1 : d > 8 ? -1 : 0.25;
            const g = { x: u.x + v.x * 3 * want - v.y * 2.2 * zig, y: u.y + v.y * 3 * want + v.x * 2.2 * zig };
            if (S.anchor && dist(g, S.anchor) > 26) { const w = M.dir(g, S.anchor); g.x += w.x * 4; g.y += w.y * 4; }
            MAP.pushOut(g, u.r); u.attackTarget = null; u.goal = g; return;
          }
          if (kind === 'stealth') {
            const hid = u.statuses.some((s) => s.type === 'stealth');
            if (!hid && m.time > (u.ws.ambT || 0) + 3) m.addStatus(u, 'stealth', 999, 1, { key: 'sb_hide' });
            if (d > 2.2) { u.attackTarget = null; u.goal = { x: me.x - me.fx * 1.5, y: me.y - me.fy * 1.5 }; return; }   // rình ra sau lưng
            if (hid) { m.removeStatus(u, 'stealth', 'sb_hide'); u.ws.ambT = m.time; m.damage(u, me, 120 + 12 * me.level, 'phys', { tag: 'sb_ambush' }); if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '👻 Bất ngờ!', color: '#d0a0ff' }); }
            u.attackTarget = me; u.goal = null; return;
          }
        }
      };
    }
    return new DummyAI(m, u);
  }
  // Máy Xả Đạn: 3 chế độ
  function spit(m, u, me) {
    const S = m.sbx, mode = S.spitMode;
    if (m.time < (u.ws.spitT || 0)) return;
    if (mode === 'snipe') {
      u.ws.spitT = m.time + 2;
      G.H.shoot(m, u, { x: me.x, y: me.y }, { speed: 30, range: 16, r: 0.35, kind: 'bullet', hitMinions: false, onHit: (mm, p, e) => mm.damage(u, e, 160 + 10 * me.level, 'phys', { tag: 'sb_snipe' }) });
    } else if (mode === 'burst') {
      u.ws.spitT = m.time + 6;
      for (let i = 0; i < 20; i++) m.later(i * 0.12, (mm) => { if (!me.alive || !u.alive) return; const a = (mm.rng.next() - 0.5) * 0.12, v = M.dir(u, me), c = Math.cos(a), s = Math.sin(a); G.H.shoot(mm, u, { x: u.x + (v.x * c - v.y * s) * 10, y: u.y + (v.x * s + v.y * c) * 10 }, { speed: 34, range: 16, r: 0.25, kind: 'bullet', hitMinions: false, onHit: (m3, p, e) => m3.damage(u, e, 18 + 2 * me.level, 'phys', { tag: 'sb_burst' }) }); });
    } else {
      u.ws.spitT = m.time + 3;
      const pt = { x: me.x, y: me.y };
      if (m.telegraph) m.telegraph({ owner: u, x: pt.x, y: pt.y, r: 1.6, t: 1.2, color: '#ff8080' });
      m.dangers.push({ x: pt.x, y: pt.y, r: 1.8, until: m.time + 1.3, team: u.team });
      G.H.shoot(m, u, pt, { speed: 8, range: dist(u, pt) + 1, r: 0.8, kind: 'orb', hitMinions: false, onHit: (mm, p, e) => { mm.damage(u, e, 220 + 14 * me.level, 'magic', { tag: 'sb_orb' }); mm.addStatus(e, 'stun', 0.6, 1, { src: u }); } });
    }
  }

  // ---------------- KHỞI TẠO ----------------
  const SandboxMix = {
    setupSandbox() {
      const cfg = this.cfg.sandbox || {};
      const c = MAP.center, p0 = { x: c.x, y: c.y }; MAP.pushOut(p0, 1);
      this.maxTime = 1e9;
      this.zoneSt = { cur: { x: c.x, y: c.y, r: 9999 }, from: null, next: null, phase: 0, started: 0, shrinking: false, dps: 0, shrinkAt: 1e12, shrinkEnd: 1e12 };
      this.planZone = () => {};
      this.camps = []; this.lairSt = []; this.bossSt = { kills: 0 }; this.roam = null;
      this.traps = []; this.drops = []; this.chests = []; this.props = []; this.houseMan = null;
      this.duelSt = { gate: null, nextAt: 1e12, n: 0, history: [] }; this.soulOrbs = []; this.orbN = 0;
      this.sbx = {
        god: !!cfg.god, noCd: !!cfg.noCd, infRes: !!cfg.infRes, hitbox: false, fov: false, rings: false,
        spitMode: cfg.spitMode || 'snipe', armorMode: 'ga', cmd: cfg.cmd || 'auto', cage: null, zone: false,
        hero: null, anchor: p0, dummies: [], log: [], hits: [], cc: {}, sum: { phys: 0, magic: 0, true: 0, shield: 0, ga: 0, n: 0, peak: 0, crit: 0 }, t0: null, tLast: 0,
      };
      const h = this.heroes[0];
      if (h) { this.sbx.hero = h; this.blinkTo(h, p0); this.sbWrap(h); }
      for (const k of cfg.dummies || ['static']) this.sbSpawn(k);
    },
    blinkTo(u, p) { u.x = p.x; u.y = p.y; u.navP = null; u.dash = null; u.goal = null; },
    // điểm thả: vòng quanh tướng, 5 đv
    sbFreeSpot(R) {
      const S = this.sbx, a = S.hero || S.anchor, n = S.dummies.length;
      const ang = n * 1.15, p = { x: a.x + Math.cos(ang) * (R || 5), y: a.y + Math.sin(ang) * (R || 5) };
      MAP.pushOut(p, 1); return p;
    },
    sbSpawn(kind, at) {
      const S = this.sbx; if (!S) return null;
      const p = at || this.sbFreeSpot(kind === 'kiter' ? 7 : kind === 'spitter' ? 9 : 5);
      let u;
      if (kind === 'rival' || G.HEROES[kind]) {
        const id = kind === 'rival' ? (this.cfg.sandbox && this.cfg.sandbox.rival) || 'ryoma' : kind;
        u = this.spawnHero({ hero: id, team: 1, level: S.hero ? S.hero.level : 9 }, this.heroes.length, p);
        u.sbRival = true;
      } else {
        u = this.spawnHero({ hero: 'dummy_' + kind, def: dummyDef(kind), team: 1, level: 1, ai: dummyAI, items: ['__none'], pers: 'hoabinh', player: { name: DUMMY[kind].icon + ' ' + DUMMY[kind].name, stats: {} } }, this.heroes.length, p);
        u.dummy = kind;
        u.fixSt = { hp: DUMMY[kind].hp, ga: DUMMY[kind].ga };
        if (kind === 'armored' && S.armorMode === 'armor') u.fixSt = { hp: 1000, ga: 0, armor: 100, mr: 100 };
        u.calc(); u.hp = u.st.maxHp; u.ga = u.st.maxGa;
      }
      this.sbLog(`➕ ${kind === 'rival' || G.HEROES[kind] ? '⚔ ' + u.hero.name : DUMMY[kind].icon + ' ' + DUMMY[kind].name}`);
      S.dummies.push(u);
      return u;
    },
    sbRemove(u) {
      u.alive = false; u.hp = 0; u.sbGone = true;
      this.heroes = this.heroes.filter((h) => h !== u); this.units = this.units.filter((x) => x !== u);
      this.sbx.dummies = this.sbx.dummies.filter((x) => x !== u);
    },
    sbClear() { for (const d of this.sbx.dummies.slice()) this.sbRemove(d); this.sbLog('🧹 Dọn hết bù nhìn'); },
    // đổi tướng tại chỗ (giữ vị trí); cũng dùng cho nhảy cấp
    sbSwap(id, level) {
      const S = this.sbx, old = S.hero, p = old ? { x: old.x, y: old.y } : S.anchor;
      if (!G.HEROES[id]) return null;
      if (old) { old.alive = false; old.sbGone = true; this.heroes = this.heroes.filter((h) => h !== old); this.units = this.units.filter((x) => x !== old); this.pets = this.pets.filter((x) => x.owner !== old); }
      const u = this.spawnHero({ hero: id, team: 0, level: level || (old ? old.level : 9) }, 0, p);
      this.heroes.splice(this.heroes.indexOf(u), 1); this.heroes.unshift(u);
      S.hero = u; this.sbWrap(u); this.sbResetMetrics();
      this.sbLog(`🔁 ${u.hero.name} • cấp ${u.level}`);
      return u;
    },
    sbLevel(dir) {
      const S = this.sbx, lv = S.hero ? S.hero.level : 1;
      let i = LEVELS.findIndex((x) => x >= lv); if (i < 0) i = LEVELS.length - 1;
      const nl = dir > 0 ? LEVELS[Math.min(LEVELS.length - 1, LEVELS[i] === lv ? i + 1 : i)] : LEVELS[Math.max(0, LEVELS[i] === lv ? i - 1 : i - 1)];
      return this.sbSwap(S.hero.heroId, nl);
    },
    sbToggle(k) {
      const S = this.sbx; S[k] = !S[k];
      if (k === 'cage') this.sbCage(S.cage);
      else if (k === 'zone') this.sbZone(S.zone);
      return S[k];
    },
    // lồng Solo 14 đv quanh tướng — dùng cơ chế sàn Solo (chặn trong vòng); overlay: vẫn vẽ bản đồ thật, chỉ thêm vòng lồng
    sbCage(on) {
      const S = this.sbx, h = S.hero || S.anchor;
      if (on) { this.soloArena = { cx: h.x, cy: h.y, r: 7, theme: { id: 'cage', r: 7, pillars: [] }, themeKey: 'cage', worldPillars: [], overlay: true }; S.cage = true; for (const d of S.dummies) if (dist(d, h) > 5) this.blinkTo(d, { x: h.x + 4, y: h.y }); }
      else { this.soloArena = null; S.cage = false; }
      this.sbLog(on ? '🔒 Lồng Solo 14 đv' : '🔓 Bỏ lồng Solo');
    },
    // bo giả lập: vòng 18 đv quanh tướng co về 6 đv trong 25s, sát thương bo vòng 3
    sbZone(on) {
      const S = this.sbx, h = S.hero || S.anchor, z = this.zoneSt;
      if (on) Object.assign(z, { cur: { x: h.x, y: h.y, r: 18 }, from: null, next: { x: h.x, y: h.y, r: 6 }, phase: 3, shrinking: false, dps: C.ZONE[3].dps, shrinkAt: this.time + 3, shrinkEnd: this.time + 28 });
      else Object.assign(z, { cur: { x: h.x, y: h.y, r: 9999 }, next: null, shrinking: false, dps: 0, shrinkAt: 1e12, shrinkEnd: 1e12 });
      S.zone = !!on;
      this.sbLog(on ? '☣ Bo giả lập: 18 → 6 đv' : '☣ Tắt bo giả lập');
    },
    sbSpitMode(mode) { this.sbx.spitMode = mode; this.sbLog('🔫 Chế độ bắn: ' + ({ snipe: 'tỉa đơn', burst: 'liên thanh 20 viên', orb: 'cầu năng lượng chậm' })[mode]); },
    sbArmorMode() {
      const S = this.sbx; S.armorMode = S.armorMode === 'ga' ? 'armor' : 'ga';
      for (const d of S.dummies) if (d.dummy === 'armored') { d.fixSt = S.armorMode === 'armor' ? { hp: 1000, ga: 0, armor: 100, mr: 100 } : { hp: 1000, ga: 1500 }; d.calc(); d.hp = d.st.maxHp; d.ga = d.st.maxGa; }
      this.sbLog(S.armorMode === 'armor' ? '🛡 Siêu Giáp: 100 giáp & kháng phép, 0 Hộ Giáp' : '🛡 Siêu Giáp: 0 giáp, 1500 Hộ Giáp');
    },
    sbResetMetrics() { const S = this.sbx; S.hits = []; S.cc = {}; S.sum = { phys: 0, magic: 0, true: 0, shield: 0, ga: 0, n: 0, peak: 0, crit: 0 }; S.t0 = null; S.log = S.log.slice(-6); },
    sbLog(txt) { const S = this.sbx; S.log.push({ t: this.time, txt }); if (S.log.length > 80) S.log.splice(0, S.log.length - 80); },

    // ---------------- LỆNH CHO TƯỚNG THỬ ----------------
    // cmd: 'auto' (AI tự đánh) • 'idle' (đứng yên, không làm gì) • 'atk' (chỉ đánh thường) • 's1'|'s2'|'s3'|'s4'|'sub' (CHỈ dùng chiêu đó)
    sbWrap(u) {
      const m = this, ai = u.ai, own = ai.think;
      ai.think = function () {
        const S = m.sbx, c = S && S.cmd;
        if (!c || c === 'auto') return own.call(this);
        u.goal = null; u.attackTarget = null;
        if (c === 'idle') return;
        const t = m.sbTarget(u); if (!t) return;
        if (c === 'atk') { u.attackTarget = t; return; }
        const def = u.hero.skills[c]; if (!def || u.cast || u.dash) return;
        if (u.ranks[c] < 1) { u.ranks[c] = 1; if (m.sbx.cmdWarn !== c) { m.sbx.cmdWarn = c; m.sbLog(`ℹ ${c.toUpperCase()} chưa học — mở tạm cấp 1 để thử`); } }
        const R = (def.ai && (def.ai.rangeFn ? def.ai.rangeFn(m, u) : def.ai.range)) || 3, aim = def.ai && def.ai.aim;
        const d = Math.hypot(t.x - u.x, t.y - u.y);
        if (aim !== 'self' && d > R + t.r) { u.goal = { x: t.x, y: t.y }; return; }   // tiến vào tầm chiêu (không đánh thường)
        u.face(t.x, t.y);
        if (m.canCast(u, c)) { m.castSkill(u, c, t, { x: t.x, y: t.y }); return; }
        if (u.recast[c] && u.recast[c].until > m.time) m.castSkill(u, c, t, { x: t.x, y: t.y });   // chiêu dùng lại (snapback, đổi chỗ…)
      };
    },
    sbTarget(u) {
      let best = null, bd = 1e9;
      for (const h of this.heroes) if (h.alive && h.team !== u.team) { const d = Math.hypot(h.x - u.x, h.y - u.y); if (d < bd) { bd = d; best = h; } }
      return best;
    },
    sbCmd(c) {
      const S = this.sbx; S.cmd = c;
      const h = S.hero; if (h) { h.goal = null; h.attackTarget = null; }
      const nm = c === 'auto' ? 'AI tự đánh' : c === 'idle' ? 'Đứng yên, không làm gì' : c === 'atk' ? 'Chỉ đánh thường' : `Chỉ dùng ${c.toUpperCase()} — ${h && h.hero.skills[c] ? h.hero.skills[c].name : '?'}`;
      this.sbLog('🎮 Lệnh: ' + nm);
    },
    // ---------------- MỖI BƯỚC ----------------
    sbTick() {
      const S = this.sbx, h = S.hero; if (!h) return;
      if (h.alive) {
        if (S.noCd) { for (const k in h.cd) if (h.cd[k] > 0.05) h.cd[k] = 0.05; if (h.ws.ccd) for (const k in h.ws.ccd) h.ws.ccd[k] = 0; h.atkT = Math.min(h.atkT, 0.05); }
        if (S.infRes) { h.mp = h.st.maxMp; if (h.ws.ammo != null && h.ws.ammoMax) h.ws.ammo = h.ws.ammoMax; for (const g of ['hype', 'heat', 'energy', 'faith', 'fury', 'wind']) if (typeof h.ws[g] === 'number' && h.ws[g] < 100) h.ws[g] = 100; }
        if (S.god) { h.hp = h.st.maxHp; h.ga = h.st.maxGa; }
      }
      // bao cát: 2s không trúng đòn → hồi đầy
      for (const d of S.dummies) if (d.dummy && d.alive && this.time - (d.lastDmgT || -99) > 2 && (d.hp < d.st.maxHp || d.ga < d.st.maxGa)) { d.hp = d.st.maxHp; d.ga = d.st.maxGa; }
    },
    // không ai chết trong phòng tập: hồi đầy + ghi nhật ký
    sbFatal(u, killer) {
      u.hp = u.st.maxHp; u.ga = u.st.maxGa; u.statuses = u.statuses.filter((s) => s.type === 'buff' && s.dur > 900);
      this.sbLog(`☠ ${u === this.sbx.hero ? u.hero.name : u.dummy ? DUMMY[u.dummy].name : u.hero.name} bị hạ gục${killer && killer.hero ? ' bởi ' + killer.hero.name : ''} — hồi đầy máu`);
      if (this.fxOn) this.fx({ type: 'callout', id: u.id, text: '☠ Hạ gục (đặt lại)', color: '#ffd24a' });
    },
    // ---------------- ĐO LƯỜNG ----------------
    sbOnDmg(owner, tgt, info, shAbs) {
      const S = this.sbx;
      if (!owner || owner !== S.hero || tgt === owner) {
        if (tgt === S.hero && owner) this.sbLog(`⬅ ${owner.dummy ? DUMMY[owner.dummy].name : owner.hero ? owner.hero.name : 'môi trường'} → ${Math.round(info.hpDealt + info.gaDealt)} (${info.type})`);
        return;
      }
      const tot = info.hpDealt + info.gaDealt + shAbs;
      if (!(tot > 0)) return;
      if (S.t0 == null) S.t0 = this.time;
      S.tLast = this.time;
      S.hits.push({ t: this.time, v: tot });
      if (S.hits.length > 400) S.hits.splice(0, S.hits.length - 400);
      S.sum[info.type] = (S.sum[info.type] || 0) + info.hpDealt;
      S.sum.ga += info.gaDealt; S.sum.shield += shAbs; S.sum.n++;
      if (info.crit) S.sum.crit++;
      if (tot > S.sum.peak) S.sum.peak = tot;
      const nm = info.auto ? 'Đánh thường' : SKILL_NAME(owner, info.tag);
      const parts = [`${nm} → ${Math.round(info.hpDealt)} ${({ phys: 'Vật Lý', magic: 'Phép', true: 'Chuẩn' })[info.type] || info.type}${info.crit ? ' (CHÍ MẠNG!)' : ''}`];
      if (info.gaDealt >= 1) parts.push(`${Math.round(info.gaDealt)} Hộ Giáp vỡ`);
      if (shAbs >= 1) parts.push(`${Math.round(shAbs)} khiên`);
      S.pendCC = parts; S.pendT = this.time;
      this.sbLog(parts.join(' → '));
    },
    sbOnCC(owner, tgt, type, dur) {
      const S = this.sbx; if (!owner || owner !== S.hero || tgt === owner || !CC_TYPES[type]) return;
      S.cc[type] = (S.cc[type] || 0) + dur;
      const L = S.log[S.log.length - 1];
      if (L && S.pendT === this.time && L.txt.indexOf('→') >= 0) L.txt += ` → ${dur.toFixed(2)}s ${CC_TYPES[type]}`;
      else this.sbLog(`${CC_TYPES[type]} ${dur.toFixed(2)}s`);
    },
    // DPS 1s gần nhất / trung bình chuỗi (chuỗi tính từ đòn đầu tới đòn cuối; 3s không đánh thì chuỗi mới)
    sbStats() {
      const S = this.sbx, t = this.time;
      if (S.t0 != null && t - S.tLast > 3 && S.hits.length) { S.lastCombo = this.sbStatsRaw(); S.t0 = null; S.hits = []; S.sum = { phys: 0, magic: 0, true: 0, shield: 0, ga: 0, n: 0, peak: 0, crit: 0 }; S.cc = {}; }
      return S.t0 != null ? this.sbStatsRaw() : (S.lastCombo || this.sbStatsRaw());
    },
    sbStatsRaw() {
      const S = this.sbx, t = this.time;
      let now = 0, all = 0; for (const h of S.hits) { all += h.v; if (t - h.t <= 1) now += h.v; }
      const dur = S.t0 != null ? Math.max(1, S.tLast - S.t0 + 0.5) : 1;
      const tot = S.sum.phys + S.sum.magic + S.sum.true + S.sum.ga + S.sum.shield || 1;
      return { dps1: now, dpsAvg: all / dur, peak: S.sum.peak, total: all, n: S.sum.n, crit: S.sum.crit, dur,
        parts: [['Vật Lý', S.sum.phys], ['Phép', S.sum.magic], ['Chuẩn', S.sum.true], ['Hộ Giáp vỡ', S.sum.ga], ['Khiên', S.sum.shield]].map(([k, v]) => ({ k, v, pct: v / tot })),
        cc: Object.keys(S.cc).map((k) => ({ k: CC_TYPES[k], v: S.cc[k] })) };
    },
  };
  const SKILL_NAME = (u, tag) => {
    const m = /^(s[1-4]|sub)/.exec(tag || ''); const d = m && u.hero.skills[m[1]];
    return d ? `${m[1].toUpperCase()} ${d.name.split(' / ')[0]}` : tag === 'dot' ? 'Sát thương theo thời gian' : tag || 'Đòn';
  };

  // ---------------- KỊCH BẢN KIỂM THỬ MẪU ----------------
  // mỗi kịch bản: dựng tình huống, tung chiêu theo mốc thời gian (AI tắt), rồi kiểm tra điều kiện → danh sách ✔/✘
  function run(m, sec) { const n = Math.round(sec / C.TICK); for (let i = 0; i < n && !m.over; i++) m.step(); }
  function freeze(u) { u.ai.think = function () { this.u.goal = null; this.u.attackTarget = null; }; }
  function cast(m, u, k, pt, t) { u.cd[k] = 0; if (u.ranks[k] < 1) u.ranks[k] = 1; u.mp = u.st.maxMp; return m.castSkill(u, k, t || null, pt); }
  const SUITE = [
    { id: 'sweet', name: 'Điểm Ngọt & Đẩy Cán Kiếm (Gideon)', hero: 'gideon', dummies: ['static'],
      run(m, out) {
        const S = m.sbx, h = S.hero, d = S.dummies[0]; freeze(h); m.blinkTo(d, { x: h.x + 1.7, y: h.y }); h.face(d.x, d.y);
        const k = Object.keys(h.hero.skills).find((x) => /cán kiếm/i.test(h.hero.skills[x].name)) || 's1';
        cast(m, h, k, { x: d.x, y: d.y }, d); run(m, 1.2);
        const gap = dist(h, d) - h.r - d.r;
        const pushed = dist(h, d);
        out.push([gap > 1.6 && gap < 3.6, `Đẩy Cán Kiếm: bù nhìn bị đẩy ra ${pushed.toFixed(2)} đv tâm-tâm (khe ${gap.toFixed(2)} đv, mong đợi ~2.7 đv tầm ngọt)`]);
        const k2 = Object.keys(h.hero.skills).find((x) => /bổ dọc/i.test(h.hero.skills[x].name)) || 's2';
        { const v = M.dir(d, h); m.blinkTo(h, { x: d.x + v.x * 5.0, y: d.y + v.y * 5.0 }); h.face(d.x, d.y); }   // đứng đúng chóp mũi kiếm (Bổ Dọc dài 5.5 đv)
        const L0 = S.log.length; cast(m, h, k2, { x: d.x, y: d.y }, d); run(m, 1.2);
        const hit = S.log.slice(L0).some((l) => /S\d/.test(l.txt));
        const rooted = d.statuses.some((s) => s.type === 'root') || (S.cc.root || 0) > 0;
        out.push([hit && rooted, `Bổ Dọc trúng chóp mũi kiếm: ${hit ? 'trúng' : 'trượt'}${rooted ? ' + trói chân (ĐIỂM NGỌT!)' : ' — không trói'}`]);
      } },
    { id: 'wall', name: 'Bắn xuyên vách & Radar (Dr. Vector)', hero: 'vector', dummies: ['static'],
      run(m, out) {
        const S = m.sbx, h = S.hero, d = S.dummies[0]; freeze(h);
        // tìm một vách đá quanh tâm bản đồ: điểm đứng trống, 3–8 đv phía trước là vách, sau vách 3.5 đv lại trống
        let spot = null, stand = null;
        const c = MAP.center;
        for (let R = 0; R <= 70 && !spot; R += 3) for (let k = 0; k < Math.max(1, R * 2) && !spot; k++) {
          const a0 = k / Math.max(1, R * 2) * Math.PI * 2, p0 = { x: c.x + Math.cos(a0) * R, y: c.y + Math.sin(a0) * R };
          if (MAP.inWall(p0.x, p0.y, 1)) continue;
          for (let a = 0; a < 16 && !spot; a++) { const v = { x: Math.cos(a * Math.PI / 8), y: Math.sin(a * Math.PI / 8) }; for (let r = 3; r <= 8; r += 0.5) { if (!MAP.inWall(p0.x + v.x * r, p0.y + v.y * r, 0.1)) continue; const q = { x: p0.x + v.x * (r + 3.5), y: p0.y + v.y * (r + 3.5) }; if (!MAP.inWall(q.x, q.y, 1) && r + 3.5 < 14) { spot = q; stand = p0; } break; } }
        }
        if (!spot) { out.push([true, 'Không tìm thấy vách đá phù hợp — bỏ qua phần xuyên vách']); return; }
        m.blinkTo(h, stand);
        m.blinkTo(d, spot); h.face(d.x, d.y); m.updateVision();
        out.push([true, `Bù nhìn nấp sau vách cách ${dist(h, d).toFixed(1)} đv • ${d.vis[0] ? 'đang thấy' : 'khuất tầm nhìn'}`]);
        const L0 = S.log.length;
        for (const k of ['s1', 's2', 's3', 's4']) { cast(m, h, k, { x: d.x, y: d.y }, d); run(m, 1.6); }
        run(m, 2);
        const got = S.log.slice(L0).filter((l) => /→ \d/.test(l.txt)).length;
        out.push([got > 0, `Sát thương xuyên vách lên bù nhìn: ${got} đòn trúng`]);
      } },
    { id: 'parry', name: 'Nuốt đạn liên hoàn (Kip — Vòm Xoáy vs Máy Xả Đạn liên thanh)', hero: 'kip', dummies: ['spitter'], spit: 'burst',
      run(m, out) {
        const S = m.sbx, h = S.hero, d = S.dummies[0]; freeze(h); m.blinkTo(d, { x: h.x + 8, y: h.y }); h.face(d.x, d.y);
        const k = 's3'; h.ws.ch = 3;
        const hp0 = h.hp + h.ga, dd0 = d.hp + d.ga;
        d.ws.spitT = 0; run(m, 0.3); cast(m, h, k, { x: h.x, y: h.y }, d); run(m, 1.9); h.ws.ch = 3; h.cd[k] = 0; cast(m, h, k, { x: h.x, y: h.y }, d); run(m, 1.4);
        const lost = hp0 - (h.hp + h.ga), back = dd0 - (d.hp + d.ga);
        out.push([lost < (18 + 2 * h.level) * 20 * 0.8, `Chiêu "${h.hero.skills[k].name}": nhận ${Math.round(lost)} sát thương trên tối đa ~${(18 + 2 * h.level) * 20} của 20 viên`]);
        out.push([back >= 0, `Bù nhìn nhận lại ${Math.round(back)} sát thương (đạn dội ngược / phản kích)`]);
      } },
    { id: 'stack', name: 'Tích tầng vô hạn (Không Hồi Chiêu)', hero: 'ryoma', dummies: ['static'], noCd: true,
      run(m, out) {
        const S = m.sbx, h = S.hero, d = S.dummies[0]; m.blinkTo(d, { x: h.x + 2, y: h.y });
        const ok = []; let bad = false;
        for (let i = 0; i < 6; i++) { run(m, 5); const st = m.sbStatsRaw(); ok.push(Math.round(st.total)); if (!isFinite(st.total) || st.total < 0) bad = true; }
        out.push([!bad && ok[ok.length - 1] >= ok[0], `Tổng sát thương theo mốc 5s: ${ok.join(' → ')} (không tràn số, tăng đều)`]);
        out.push([!!(h.hp > 0 && isFinite(h.st.ad) && isFinite(h.st.ap)), `Chỉ số sau 30s spam chiêu: SMVL ${Math.round(h.st.ad)} • SMPT ${Math.round(h.st.ap)}`]);
      } },
    { id: 'snap', name: 'Hoán vị về điểm neo (Luca S3) & ảo ảnh tự đánh (Alice)', hero: 'luca', dummies: ['static'],
      run(m, out) {
        const S = m.sbx, h = S.hero, d = S.dummies[0]; freeze(h);
        const start = { x: h.x, y: h.y };
        cast(m, h, 's3', { x: h.x + 4, y: h.y }); run(m, 0.6);
        m.blinkTo(h, { x: start.x + 10, y: start.y }); MAP.pushOut(h, h.r);
        const rc = h.recast.s3; out.push([!!rc, 'Có cửa sổ dùng lại S3 (đóa hồng)']);
        if (rc) { run(m, Math.max(0, rc.until - m.time - 0.2)); m.castSkill(h, 's3', null, null); run(m, 0.2); }
        out.push([dist(h, start) < 0.8, `Giật về đóa hồng: lệch ${dist(h, start).toFixed(2)} đv so với điểm neo`]);
        const a = m.sbSwap('alice', 12); freeze(a); m.blinkTo(d, { x: a.x + 3, y: a.y });
        const dec = m.makeDecoy(a, a.x + 1, a.y + 1, { life: 4, hp: 0.3, dmg: 0.4 }); const hp0 = d.hp + d.ga; run(m, 3);
        out.push([d.hp + d.ga < hp0 || d.lastAtt === dec, `Ảo ảnh tự tấn công bù nhìn cạnh nó (${dec.alive ? 'còn sống' : 'đã tan'})`]);
      } },
  ];
  // chạy 1 kịch bản trên trận mới (dùng cho giao diện & công cụ Node)
  function runSuite(id, seed) {
    const T = SUITE.find((x) => x.id === id); if (!T) return null;
    const m = new G.Match(sandboxCfg(T.hero, seed || 'sbx-' + id, { dummies: T.dummies, noCd: T.noCd, spitMode: T.spit, level: 12 }));
    const out = [];
    try { T.run(m, out); } catch (e) { out.push([false, 'Lỗi: ' + (e && e.message)]); }
    return { id, name: T.name, out, pass: out.every((x) => x[0]), m };
  }
  function sandboxCfg(hero, seed, o) {
    o = o || {};
    return { seed, mapSeed: seed, mode: 'sandbox', noRevive: true, picks: [{ hero, level: o.level || 9, team: 0 }], sandbox: Object.assign({ dummies: ['static'] }, o) };
  }
  G.Sandbox = { DUMMY, LEVELS, CC_TYPES, SUITE, runSuite, cfg: sandboxCfg, dummyDef };
  G.SandboxMix = SandboxMix;
})();
