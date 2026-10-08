'use strict';
// ===== TRẬN ĐẤU TRƯỜNG: 10 tướng đánh đơn, trạng thái + bước thời gian cố định =====
// Không đụng tới DOM/canvas. Cùng hạt giống → cùng kết quả (chạy không cần hình, xem lại được).
// cfg: { seed, picks: [{ hero, player }] × 10, fx, maxTime (mặc định 30:00) }  — dùng G.arenaConfig(seed) để tạo từ một hạt giống.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, MAP = G.MAP, M = G.M, Unit = G.Unit;

  // chỉ số bản lĩnh mặc định (khi cấu hình không ghi)
  const DEFAULT_PLAYER = { name: '', stats: { meca: 11, map: 11, fight: 11, disc: 11, refl: 11, mental: 11, stam: 11, farm: 11 }, mastery: 70, style: 'balanced' };

  class Match {
    constructor(cfg) {
      this.cfg = cfg;
      this.seed = cfg.seed;
      // GĐ7: bản đồ sinh theo hạt giống (cfg.mapSeed = 'classic' → bản đồ cổ điển)
      if (G.buildMap) G.buildMap(cfg.mapSeed != null ? cfg.mapSeed : cfg.seed);
      const root = new G.Rng(cfg.seed);
      this.rng = root.fork('combat');     // trúng/trượt, chí mạng, xúc xắc trong chiêu…
      this.rngAI = root.fork('ai');       // quyết định của AI
      this.rngArena = root.fork('arena'); // bo, thính
      this.time = 0; this.tick = 0; this.nextId = 1; this.seq = 0;
      this.depth = 0; this.evCount = 0; this.errors = [];
      this.fxOn = !!cfg.fx; this.fxq = [];
      this.units = []; this.heroes = []; this.pets = [];
      this.minions = []; this.structures = [];   // không dùng ở đấu trường (giữ mảng rỗng cho chiêu tướng cũ tra cứu)
      this.projs = []; this.zones = []; this.queue = []; this.tempWalls = []; this.wards = []; this.lastUse = null;
      this.nTeams = (cfg.picks || []).length;
      this.night = new Array(this.nTeams).fill(0);
      this.heroHit = [];
      this.dangers = [];   // vùng sắp trúng chiêu (để AI né)
      this.feed = [];      // dòng sự kiện
      this.grid = new G.Grid(C.MAP, C.MAP, 6);
      this.winner = -1; this.over = false;
      this.maxTime = cfg.maxTime || C.MATCH_TIME;
      this.ranking = []; this.outBatch = [];
      this.stats = { kills: 0, vultureKills: 0, zoneDeaths: 0, firstBlood: false };
      // Sàn đấu Solo 1v1 thu gọn phỏng theo Legacy Arena
      if (cfg.mode === 'solo' && cfg.soloArena !== 'corner') {
        const tKey = cfg.soloTheme || (cfg.soloArena && cfg.soloArena.startsWith('legacy_') ? cfg.soloArena.slice(7) : (cfg.soloArena && cfg.soloArena !== 'center' ? cfg.soloArena : 'da'));
        const tDef = (G.SOLO_ARENA_THEMES && G.SOLO_ARENA_THEMES[tKey]) || (G.SOLO_ARENA_THEMES && G.SOLO_ARENA_THEMES.da) || { id: 'da', r: 25, pillars: [] };
        const cx = MAP.center.x, cy = MAP.center.y;
        this.soloArena = {
          cx, cy,
          r: tDef.r || 25,
          theme: tDef,
          themeKey: tKey,
          worldPillars: (tDef.pillars || []).map((p) => ({ x: cx + p.x, y: cy + p.y, r: p.r })),
        };
      } else {
        this.soloArena = null;
      }
      this.setupHeroes();
      this.setupZone();
      if (!this.soloArena) {
        this.setupNeutral();
        this.setupDuel();
        this.setupChests(); this.traps = []; this.setupProps();   // GĐ7: rương đồ, bẫy, thùng thuốc nổ
        this.setupHouse();                                         // GĐ9b: người của nhà cái + can thiệp (phát lại)
        // chủ bãi quái đầu trận: tướng có điểm xuất phát gần nhất (hai người gần ngang nhau → bãi tranh chấp, -1)
        for (const c of this.camps) {
          const ds = this.heroes.map((h) => ({ id: h.id, d: G.M.dist(h.home, c) })).sort((a, b) => a.d - b.d);
          c.own = ds.length > 1 && ds[1].d - ds[0].d < 8 ? -1 : ds.length ? ds[0].id : -1;
        }
      } else {
        this.camps = []; this.lairSt = []; this.bossSt = { kills: 0 };
        this.traps = []; this.drops = []; this.chests = []; this.props = []; this.houseMan = null;
        this.duelSt = { gate: null, nextAt: 999999, n: 0, history: [] }; this.soulOrbs = []; this.orbN = 0;
      }
      this.rebuildGrid(); this.updateVision();
    }

    // ---------- dựng trận ----------
    setupHeroes() {
      const picks = this.cfg.picks || [];
      picks.forEach((pk, i) => {
        const def = G.HEROES[pk.hero];
        if (!def) throw new Error('Không có tướng ' + pk.hero);
        let sp = MAP.spawns[i % MAP.spawns.length];
        if (this.soloArena) {
          const cx = this.soloArena.cx, cy = this.soloArena.cy;
          sp = { x: cx + (i === 0 ? -12.5 : 12.5), y: cy };
        } else if (this.cfg.mode === 'solo' && this.cfg.soloCenter) {
          const cx = MAP.center.x, cy = MAP.center.y;
          sp = { x: cx + (i === 0 ? -9 : 9), y: cy };
          MAP.pushOut(sp, 1);
        }
        const u = new Unit(this, { kind: 'hero', team: i, x: sp.x, y: sp.y, r: def.r || 0.65, ranged: def.ranged, projSpeed: def.projSpeed || C.HERO_PROJ, base: {} });
        u.hero = def; u.heroId = def.id; u.pick = pk; u.slot = i;
        u.home = { x: sp.x, y: sp.y };                     // "lãnh địa" đầu trận: AI ưu tiên farm quanh đây
        // GĐ7: nhân vật có chỉ số bản lĩnh cố định theo tướng (pk.player chỉ để công cụ thử nghiệm ghi đè)
        const ch = pk.player || (G.heroChar ? G.heroChar(def.id) : null);
        u.player = Object.assign({}, DEFAULT_PLAYER, ch || {});
        u.player.stats = Object.assign({}, DEFAULT_PLAYER.stats, (ch && ch.stats) || {});
        if (pk.playerStats) Object.assign(u.player.stats, pk.playerStats);
        u.pers = (pk.pers && G.PERSONALITY && G.PERSONALITY[pk.pers]) || G.personalityOf(def.id);
        u.persId = pk.pers || G.HERO_PERSONALITY[def.id] || 'binhthuong';
        u.fstyle = G.fightStyleOf(def.id);
        // thành thạo tướng → hiệu quả sát thương lên tướng (combo, nội tại): 0 → 0.65, 70 → 1.0, 100 → 1.06
        const masteryVal = pk.mastery != null ? pk.mastery : (u.player.mastery == null ? 70 : u.player.mastery);
        u.player.mastery = masteryVal;
        const mk = Math.max(0, Math.min(1, masteryVal / 100));
        u.mastMul = mk >= 0.7 ? 1 + 0.2 * (mk - 0.7) : 1 - 0.5 * (0.7 - mk);
        u.level = 1; u.xp = 0; u.gold = pk.gold != null ? pk.gold : C.GOLD_START; u.ranks = { s1: 0, s2: 0, s3: 0, s4: 0 }; u.points = 0;
        u.respawnT = 0; u.recast = {}; u.ws = {}; u.tilt = 0; u.out = false; u.place = 0; u.revived = false;
        u.stats = { k: 0, d: 0, a: 0, dmgHero: 0, dmgTaken: 0, heal: 0, ccTime: 0, goldEarned: 0, camps: 0, boss: 0, drops: 0, vulture: 0 };
        u.resource = def.resource || 'mana';
        this.applyLevel(u, true);
        u.hp = u.st.maxHp; u.mp = u.st.maxMp; u.ga = u.st.maxGa;
        u.points = 1; this.autoSkill(u);
        if (pk.level && pk.level > 1) {
          u.level = Math.max(1, Math.min(C.MAX_LVL || 18, pk.level | 0));
          u.points = u.level;
          this.applyLevel(u);
          this.autoSkill(u);
        }
        if (G.pickBuild) u.buildPref = G.pickBuild(this, u);   // GĐ9: 1 trong 3 lối build sở trường
        if (u.pers && u.pers.trader) u.stock = [1, 2].map((t, i) => Object.assign(this.makeShard(t), { key: 'stock_0' + i }));   // GĐ9: Thương Nhân / Kẻ Bịp Bợm mang sẵn 2 mảnh hàng
        this.initItems(u);
        if (pk.items && Array.isArray(pk.items) && pk.items.length) {
          u.items = pk.items.filter((it) => it && G.ITEMS && G.ITEMS[it]).slice(0, 6);
          this.recalcItems(u);
          u.calc();
        }
        this.initPotions(u);
        if (pk.yNiem != null) {
          this.setYNiem(u, pk.yNiem, 'tùy chỉnh', true);
        }
        if (pk.souls && Array.isArray(pk.souls)) {
          for (const sid of pk.souls) {
            if (sid && G.SHARDS && G.SHARDS[sid]) {
              this.giveSoul(u, G.SHARDS[sid].t, 'tùy chỉnh', sid);
            }
          }
        }
        if (pk.pots && Array.isArray(pk.pots)) {
          for (const pid of pk.pots) {
            if (pid && this.bagAdd) this.bagAdd(u, pid, 1);
          }
        }
        this.initTree(u, pk.tree);
        // Hồi phục đầy đủ toàn bộ sau khi nâng cấp
        u.hp = u.st.maxHp; u.mp = u.st.maxMp; u.ga = u.st.maxGa;
        this.addUnit(u); this.heroes.push(u);
        if (this.soloArena) {
          u.face(this.soloArena.cx + (i === 0 ? 10 : -10), this.soloArena.cy);
        } else if (this.cfg.mode === 'solo' && this.cfg.soloCenter) {
          u.face(MAP.center.x + (i === 0 ? 10 : -10), MAP.center.y);
        } else {
          u.face(MAP.center.x, MAP.center.y);
        }
        u.ai = new G.HeroAI(this, u);
        this.hook(def.passive && def.passive.init, this, u);
        if (!pk.items || !pk.items.length) this.shopAI(u);
      });
    }
    addUnit(u) {
      const n = this.nTeams;
      u.vis = new Array(n); u.visT = new Array(n);
      for (let t = 0; t < n; t++) { u.vis[t] = u.team === t; u.visT[t] = -99; }
      u.visAny = false;
      this.units.push(u);
    }
    heroById(id) { for (const h of this.heroes) if (h.id === id) return h; return null; }
    // Màn Đêm (Raven): tầm nhìn của mọi tướng khác co lại tới thời điểm until
    nightOthers(team, until) { for (let t = 0; t < this.nTeams; t++) if (t !== team) this.night[t] = Math.max(this.night[t], until); }

    // chỉ số tướng theo cấp
    applyLevel(u, first) {
      const b = u.hero.base, L = u.level - 1;
      const oldMax = u.st.maxHp || 0, oldMp = u.st.maxMp || 0, oldGa = u.st.maxGa || 0;
      u.base = {
        hp: b.hp + b.hpG * L, hpr: 0, mp: (b.mp || 0) + (b.mpG || 0) * L, mpr: ((b.mpr || 0) + (b.mprG || 0) * L) * C.MANA_REGEN,   // GĐ6b: không hồi máu gốc
        ad: b.ad + b.adG * L, ap: 0, armor: b.armor + b.armorG * L, mr: b.mr + b.mrG * L,
        as: b.as, asBonus: (b.asG || 0) * L, ms: b.ms, range: b.range, crit: 0,
      };
      u.calc();
      if (!first) { u.hp += u.st.maxHp - oldMax; u.mp += u.st.maxMp - oldMp; u.ga = Math.min(u.st.maxGa, (u.ga || 0) + Math.max(0, u.st.maxGa - oldGa)); }
    }
    gainXP(u, xp) {
      if (!u.alive && u.kind !== 'hero') return;
      if (u.level >= C.MAX_LVL) return;
      u.xp += xp;
      while (u.level < C.MAX_LVL && u.xp >= C.xpNeed(u.level)) {
        u.xp -= C.xpNeed(u.level); u.level++; u.points++;
        this.applyLevel(u);
        this.autoSkill(u);
        if (u.tree) this.unlockTree(u);
        if (this.fxOn) this.fx({ type: 'lvl', x: u.x, y: u.y, team: u.team });
      }
      if (u.level >= C.MAX_LVL) u.xp = 0;
    }
    // cộng điểm chiêu theo thứ tự ưu tiên của tướng
    autoSkill(u) {
      const order = (u.hero.ai && u.hero.ai.order) || ['s1', 's2', 's3'];
      while (u.points > 0) {
        const can = (k) => {
          const r = u.ranks[k];
          if (k === 's4') return r < 3 && u.level >= 4 + r * 4;
          return r < 5 && r < Math.ceil(u.level / 2);
        };
        let k = null;
        if (can('s4')) k = 's4';
        else if (u.level <= 3) { k = ['s1', 's2', 's3'].find((x) => u.ranks[x] === 0 && can(x)) || null; }
        if (!k) k = order.find(can) || ['s1', 's2', 's3'].find(can) || null;
        if (!k) break;
        u.ranks[k]++; u.points--;
      }
    }
    gainGold(u, g) { if (u.kind !== 'hero') return; if (u.st.goldPct) g *= 1 + u.st.goldPct; u.gold += g; u.stats.goldEarned += g; }

    // ---------- vòng lặp ----------
    step() {
      if (this.over) return;
      const dt = C.TICK;
      this.time = Math.round((this.time + dt) * 1000) / 1000; this.tick++;
      this.evCount = 0;
      this.rebuildGrid();
      if (this.tick % 6 === 0) this.updateVision();
      this.runQueue();
      this.updateZone();
      this.updateNeutral(dt);
      this.updateDuel();
      this.updateSoulOrbs();
      this.updateChests(); this.updateTraps(); this.updateProps();
      if (this.updateItemDrops) this.updateItemDrops();
      if (G.Persona && this.tick % 10 === 0) G.Persona.updateAlliances(this);   // GĐ7b: liên minh tạm thời
      // thứ tự cập nhật đảo chiều mỗi bước: không tướng nào luôn được "ra tay trước"
      const rev = (this.tick & 1) === 1;
      const H = this.heroes, nH = H.length;
      const revAI = ((this.tick / C.AI_TICK) | 0) & 1;
      // nhịp nghĩ theo tốc độ phản ứng của nhân vật (Phản Xạ, Kỹ Năng): 0.06–0.25 giây
      for (let i = 0; i < nH; i++) { const h = H[revAI ? nH - 1 - i : i]; if (h.alive && this.tick >= h.ai.nextTick) { h.ai.nextTick = h.ai.scheduleNext(this.tick); this.hook(() => h.ai.think()); } }
      const Us = this.units, nU = Us.length;
      for (let i = 0; i < nU; i++) {
        const u = Us[rev ? nU - 1 - i : i];
        if (!u.alive) continue;
        const px = u.x, py = u.y;
        this.updateUnit(u, dt);
        if (this.tempWalls.length) this.updateTempWalls(u);
        u.vx = (u.x - px) / dt; u.vy = (u.y - py) / dt;
      }
      this.separate();
      this.duelContain();
      if (this.soloArena) this.containSoloArena();
      this.updateProjs(dt);
      this.updateZones(dt);
      this.updateHeroesMisc(dt);
      this.cleanup();
      this.settleOut();
      if (!this.over && this.time >= this.maxTime) this.endByTime();
      if (this.ivQ && this.ivQ.length) this.replayInterv();      // GĐ9b: can thiệp đã ghi — đúng tick, cuối bước
    }
    containSoloArena() {
      if (!this.soloArena) return;
      const { cx, cy, r, worldPillars } = this.soloArena;
      for (const u of this.units) {
        if (!u.alive || !(u.kind === 'hero' || u.kind === 'pet')) continue;
        // 1. Chặn trong sàn đấu (bán kính r - u.r)
        const dx = u.x - cx, dy = u.y - cy, d = Math.hypot(dx, dy);
        const maxR = r - u.r;
        if (d > maxR && d > 0.001) {
          u.x = cx + (dx / d) * maxR;
          u.y = cy + (dy / d) * maxR;
          if (u.dash) u.dash.t = 0;
        }
        // 2. Chặn va chạm cột trụ
        for (const p of worldPillars) {
          const px = u.x - p.x, py = u.y - p.y, pd = Math.hypot(px, py), minD = p.r + u.r;
          if (pd < minD && pd > 0.001) {
            u.x = p.x + (px / pd) * minD;
            u.y = p.y + (py / pd) * minD;
            if (u.dash && !u.dash.passWall) u.dash.t = 0;
          }
        }
      }
    }
    rebuildGrid() { this.grid.clear(); for (const u of this.units) if (u.alive) this.grid.insert(u); }
    // va chạm mềm: các đơn vị không chồng lên nhau. Đẩy nhau theo khối lượng (tướng nặng hơn vật triệu hồi, boss đứng yên).
    separate() {
      const Us = this.units, n = Us.length;
      const mass = (u) => (u.kind === 'hero' ? 3 : u.kind === 'monster' ? (u.big ? 60 : 8) : u.kind === 'pet' ? 1.5 : 1);
      const solid = (u) => u.alive && (u.kind === 'hero' || u.kind === 'pet' || u.kind === 'monster') && !u.dash && !u.noCollide
        && !(u.statuses.length && (u.has('knockup') || u.has('untarget')));
      for (let i = 0; i < n; i++) {
        const u = Us[i];
        if (!solid(u)) continue;
        this.grid.query(u.x, u.y, u.r + 1.6, (v) => {
          if (v.id <= u.id || !solid(v)) return;
          const min = (u.r + v.r) * 0.82;
          let dx = v.x - u.x, dy = v.y - u.y, d2 = dx * dx + dy * dy;
          if (d2 >= min * min) return;
          let d = Math.sqrt(d2);
          if (d < 1e-4) { const a = ((u.id * 7 + v.id * 13) % 16) / 16 * Math.PI * 2; dx = G.M.cos(a); dy = G.M.sin(a); d = 1; }
          else { dx /= d; dy /= d; }
          const push = (min - Math.min(d, min)) * 0.45, mu = mass(u), mv = mass(v), ku = mv / (mu + mv), kv = mu / (mu + mv);
          u.x -= dx * push * ku; u.y -= dy * push * ku; v.x += dx * push * kv; v.y += dy * push * kv;
          u.sepT = v.sepT = this.tick;
        });
      }
      for (let i = 0; i < n; i++) { const u = Us[i]; if (u.sepT === this.tick) MAP.pushOut(u, u.r); }
    }
    runQueue() {
      if (!this.queue.length) return;
      this.queue.sort((a, b) => a.at - b.at || a.seq - b.seq);
      while (this.queue.length && this.queue[0].at <= this.time + 1e-9) {
        const q = this.queue.shift();
        this.hook(q.fn, this);
      }
    }

    // ---------- tầm nhìn: mỗi tướng chỉ thấy bằng mắt mình (+ vật triệu hồi, đèn soi của mình) ----------
    updateVision() {
      const nT = this.nTeams;
      const seen = this._seen || (this._seen = Array.from({ length: nT }, () => new Set()));
      for (const s of seen) s.clear();
      const hasHi = MAP.plateaus.length > 0, hasTerr = MAP.terrain.length > 0;
      for (const u of this.units) if (u.alive) {
        u.bush = u.fly ? -1 : MAP.bushAt(u.x, u.y);   // vật bay không núp bụi
        u.hi = hasHi && !u.fly ? MAP.heightAt(u.x, u.y) : 0;        // GĐ7: đứng trên cao nguyên / tháp canh
        u.terr = hasTerr && !u.fly ? MAP.terrainAt(u.x, u.y) : null; // GĐ7: bùn / cát lún / băng
      }
      const HG = C.HIGH, hide2 = HG.hide * HG.hide;
      const TS2 = C.BUSH_TRUESIGHT * C.BUSH_TRUESIGHT;
      const look = (team, x, y, R, revealAll, obsBush, low) => {
        this.grid.query(x, y, R, (e) => {
          if (!e.alive || e.team === team) return;
          if (!revealAll) {
            const dx = e.x - x, dy = e.y - y, d2 = dx * dx + dy * dy;
            if (e.statuses.length && e.has('stealth') && d2 > 6.25) return;
            if (e.bush >= 0 && e.bush !== obsBush && d2 > TS2) return;   // trong bụi: chỉ thấy khi đứng cùng bụi hoặc sát bên
            if (low && e.hi && d2 > hide2) return;                       // GĐ7: ở dưới thấp không thấy người trên cao (trừ khi sát bên)
          }
          // Bom Khói Dập Lửa: chặn mọi tầm nhìn từ bên ngoài nhìn vào người đứng trong khói
          if (this.zones && this.zones.some((z) => z.smoke && !z.dead && M.dist(e, z) <= z.r && M.dist({ x, y }, z) > z.r)) return;
          seen[team].add(e.id);
        });
      };
      const night = this.night;
      for (const u of this.units) if (u.alive && u.team >= 0 && u.team < nT) {
        let R = u.visionR || C.VISION[u.kind]; if (R === 0) continue; R = R || 7;
        if (night[u.team] > this.time && u.kind === 'hero' && !u.st.noFog) R *= 0.4;
        if (u.kind === 'hero' && u.st.visPct) R *= 1 + u.st.visPct;               // GĐ9: mảnh hồn tầm nhìn
        if (u.hi) R *= HG.vis;                                                     // GĐ7: trên cao nhìn xa hơn
        else if (!u.fly && !u.st.noFog) { const fog = MAP.regionAt(u.x, u.y).fog; if (fog) R *= fog; }   // GĐ7: sương mù đầm lầy (GĐ9: Ưng Nhãn bỏ qua)
        if (u.eclipseT > this.time) R = Math.min(R, 1.4 + u.r);                   // GĐ9: Nguyệt Thực — chỉ thấy quanh thân
        look(u.team, u.x, u.y, R, !!u.trueSight, u.bush, !u.hi && !u.fly);   // trueSight: mắt quạ Oca lộ cả tàng hình / người trong bụi
      }
      for (const z of this.zones) if (z.reveal && !z.dead && z.team >= 0 && z.team < nT) look(z.team, z.x, z.y, z.reveal, true);
      // GĐ9: "cảm nhận" từ mảnh hồn (địa chấn, nhiệt ảnh, xung radar, chân thị…) và thính giác: lộ đối thủ cho riêng người đó
      for (const h of this.heroes) if (h.alive && h.sense) for (const id in h.sense) { if (h.sense[id] > this.time) seen[h.team].add(+id); else delete h.sense[id]; }
      for (const w of this.wards) {
        if (w.until > this.time) {
          if (w.scout) {
            look(w.team, w.x, w.y, w.r || 16, true);
            this.grid.query(w.x, w.y, w.r || 16, (e) => {
              if (e.alive && e.team !== w.team && e.kind === 'hero') {
                if (e.has && e.has('stealth')) this.removeStatus(e, 'stealth');
                e.revealedT = Math.max(e.revealedT || 0, this.time + 1);
              }
            });
          } else {
            look(w.team, w.x, w.y, w.r || 9, !!w.trueSight, MAP.bushAt(w.x, w.y));
          }
        }
      }
      // GĐ7b: đồng minh tạm thời chung tầm nhìn
      if (this.truces) for (const t of this.truces) if (!t.broken && t.until > this.time) { const A = seen[t.a.team], B = seen[t.b.team]; if (A && B) { for (const id of A) B.add(id); for (const id of B) A.add(id); } }
      for (const e of this.units) {
        if (!e.alive) continue;
        let any = false;
        for (let team = 0; team < nT; team++) {
          if (e.team === team) continue;
          const v = seen[team].has(e.id) || e.revealedT > this.time;
          e.vis[team] = v;
          if (v) { e.visT[team] = this.time; if (this.heroes[team] && this.heroes[team].alive) any = true; }
        }
        e.visAny = any;
      }
      if (this.soloArena) {
        for (const e of this.units) {
          if (!e.alive) continue;
          for (let team = 0; team < nT; team++) {
            if (e.team === team) continue;
            const inStealth = e.statuses && e.statuses.length && e.has('stealth');
            if (!inStealth) {
              e.vis[team] = true;
              e.visT[team] = this.time;
            }
          }
          e.visAny = true;
        }
      }
    }
    visible(team, u) { return u.team === team || !!u.vis[team]; }

    // ---------- cập nhật một đơn vị ----------
    updateUnit(u, dt) {
      if (u.statuses.length) {
        let changed = false;
        for (const s of u.statuses) {
          s.t -= dt;
          if (s.type === 'regen') { if (u.hp < u.st.maxHp) u.hp = Math.min(u.st.maxHp, u.hp + s.v * dt * (u.has('wound') ? 0.6 : 1)); }
          else if (s.type === 'mregen') { if (u.mp < u.st.maxMp) u.mp = Math.min(u.st.maxMp, u.mp + s.v * dt); }
          else if (s.type === 'dot' && s.tick > 0) {
            s.tickT -= dt;
            if (s.tickT <= 0) { s.tickT += s.tick; this.damage(s.src || u, u, s.v * s.tick * (s.n || 1), s.dtype, { tag: 'dot', noHook: true }); if (!u.alive) return; }
          }
          if (s.t <= 0) changed = true;
        }
        if (changed) {
          for (const s of u.statuses) if (s.t <= 0 && s.onEnd) this.hook(s.onEnd, this, u, s);
          u.statuses = u.statuses.filter((s) => s.t > 0);
        }
      }
      if (u.kind === 'hero' || u.kind === 'pet' || u.statuses.length || u.dirty) { u.calc(); u.dirty = false; }
      if (u.atkT > 0) u.atkT -= dt;
      if (u.kind === 'hero') {
        if (u.hp < u.st.maxHp) u.hp = Math.min(u.st.maxHp, u.hp + u.st.hpr * dt);
        if (u.mp < u.st.maxMp) u.mp = Math.min(u.st.maxMp, u.mp + u.st.mpr * dt);
        for (const k in u.cd) if (u.cd[k] > 0) u.cd[k] -= dt;
        // chiêu nhiều lượt dùng (charges): nạp lại từng lượt
        for (const k in u.chT) if (u.chT[k] > 0) {
          u.chT[k] -= dt;
          if (u.chT[k] <= 0) { const n = u.hero.skills[k].charges; u.ch[k] = Math.min(n, (u.ch[k] || 0) + 1); u.chT[k] = u.ch[k] < n ? this.cdOf(u, k) : 0; }
        }
        if ((this.tick + u.slot) % 10 === 0 && u.fxl.tick) this.updateItems(u);
        if (u.hero.passive && u.hero.passive.update) { this.hook(u.hero.passive.update, this, u, dt); if (!u.alive) return; }
      }
      // lướt / bị đẩy
      if (u.dash) { this.updateDash(u, dt); return; }
      // đang niệm chiêu
      if (u.cast) {
        const c = u.cast;
        if (u.disabled && !c.unstop) { this.interrupt(u); }
        else {
          c.t -= dt;
          if (c.move && !u.rooted && u.goal) this.moveToward(u, u.goal, dt, c.move);
          if (c.t <= 0) { u.cast = null; if (c.fire) this.hook(c.fire, this, u, c); }
          return;
        }
      }
      if (u.disabled) { u.windup = null; return; }
      // mê hoặc: tự đi về phía kẻ gây
      const ch = u.has('charm');
      if (ch && ch.src && ch.src.alive) { this.moveToward(u, ch.src, dt, 0.35); return; }
      if (u.kind === 'monster') this.monsterThink(u);
      if (u.kind === 'pet' && u.petThink) this.hook(u.petThink, this, u);
      this.updateAttackMove(u, dt);
    }
    updateDash(u, dt) {
      const d = u.dash, step = Math.min(dt, d.t);
      const ox = u.x, oy = u.y;
      u.x += d.vx * step; u.y += d.vy * step;
      d.t -= dt;
      if (!d.passWall) {
        const w = MAP.pushOut(u, u.r);
        if (w && d.cc && !d.wallHit) { d.wallHit = true; if (d.onWall) this.hook(d.onWall, this, u, w); d.t = 0; }
      } else if (d.t <= 0) MAP.pushOut(u, u.r);
      if (d.onContact) {
        const cand = this.enemiesIn(u.team, u.x, u.y, u.r + 0.4);
        for (const e of cand) if (!d.hitSet.has(e.id)) { d.hitSet.add(e.id); if (this.hook(d.onContact, this, u, e) === 'stop') { d.t = 0; break; } }
      }
      if (d.t <= 0 || !u.alive) {
        u.dash = null;
        if (d.self && u.kind === 'hero') { u.lastDashT = this.time; this.heroHook(u, 'onDashEnd', d); }   // GĐ8/GĐ9: mảnh hồn "sau khi lướt" 
        if (d.onEnd) this.hook(d.onEnd, this, u, { x: ox, y: oy });
      }
    }
    // đi về đích (có tìm đường), k = hệ số tốc độ
    moveToward(u, goal, dt, k) {
      if (u.rooted) return;
      let ms = u.st.ms * (k || 1);
      if (u.terr) { const tm = MAP.TERRAIN[u.terr].ms; if (tm > 1 || !(u.statuses.length && u.hasKey('fu_tuc'))) ms *= tm; }   // GĐ7: bùn / cát lún chậm, băng trơn nhanh (Phù Thần Tốc miễn chậm)
      if (ms <= 0) return;
      if (!u.navP || u.navT <= this.time || Math.abs((u.navGoalX || 0) - goal.x) + Math.abs((u.navGoalY || 0) - goal.y) > 1.5) {
        // tìm đường lại tối đa 3 lần/giây
        u.navP = G.NAV.nextPoint(u, goal); u.navT = this.time + 0.35; u.navGoalX = goal.x; u.navGoalY = goal.y;
      }
      let tx = u.navP.x, ty = u.navP.y;
      if (Math.abs(tx - u.x) + Math.abs(ty - u.y) < 0.3) { u.navP = G.NAV.nextPoint(u, goal); tx = u.navP.x; ty = u.navP.y; u.navT = this.time + 0.35; }
      const dx = tx - u.x, dy = ty - u.y, L = Math.sqrt(dx * dx + dy * dy);
      if (L < 1e-6) return;
      const s = Math.min(L, ms * dt);
      u.x += dx / L * s; u.y += dy / L * s;
      u.fx = dx / L; u.fy = dy / L;
      MAP.pushOut(u, u.r);
      u.moved = true;
    }
    // đánh thường hoặc đi tới mục tiêu
    updateAttackMove(u, dt) {
      if (u.windup) {
        u.windup.t -= dt;
        if (u.windup.t <= 0) {
          const t = u.windup.target; u.windup = null;
          if (this.canHit(u, t)) {
            // đòn cận chiến vung trượt khi tướng mục tiêu đã lùi ra khỏi tầm trong lúc vung tay (né / dụ đòn)
            if (!u.ranged && u.kind === 'hero' && t.kind === 'hero') {
              const dx = t.x - u.x, dy = t.y - u.y, R = u.st.range + u.r + t.r + 1.2;
              if (dx * dx + dy * dy > R * R) { if (this.fxOn) this.fx({ type: 'miss', x: t.x, y: t.y }); u.whiffT = this.time; return; }
            }
            this.fireAuto(u, t);
          }
        }
        return;
      }
      const t = u.attackTarget;
      if (t) {
        if (!this.canHit(u, t)) { u.attackTarget = null; }
        else {
          const dx = t.x - u.x, dy = t.y - u.y, d = Math.sqrt(dx * dx + dy * dy) - u.r - t.r;
          if (d <= u.st.range) {
            if (u.atkT <= 0) {
              u.windup = { t: Math.max(0.08, u.atkPeriod * C.WINDUP), target: t };
              u.atkT = u.atkPeriod * (1 + (u.atkLag || 0)); u.face(t.x, t.y);
            }
            return;
          }
          this.moveToward(u, t, dt);
          return;
        }
      }
      if (u.goal) {
        const dx = u.goal.x - u.x, dy = u.goal.y - u.y;
        if (dx * dx + dy * dy > 0.04) this.moveToward(u, u.goal, dt); else u.goal = null;
      }
    }
    canHit(u, t) {
      if (!t || !t.alive || !t.targetable || t.team === u.team) return false;
      if ((t.kind === 'hero' || t.kind === 'pet' || t.kind === 'monster') && u.team !== C.NEUTRAL && !t.vis[u.team]) return false;
      if (t.has && t.has('stealth') && u.team !== C.NEUTRAL && !t.vis[u.team]) return false;
      return true;
    }
    fireAuto(u, t) {
      if (u.ranged) {
        const sp = (u.projSpeed || C.HERO_PROJ) * (1 + (u.st.projSpd || 0));   // GĐ9: mảnh hồn tăng tốc đạn
        const ex = u.hero && u.hero.autoProj ? u.hero.autoProj(this, u, t) : null;   // GĐ9: tướng tự chỉnh đạn đánh thường (súng tỉa của Raven)
        this.proj(Object.assign({ owner: u, x: u.x + u.fx * u.r, y: u.y + u.fy * u.r, target: t, speed: sp, auto: true, soft: !!u.st.passSoft, kind: u.kind === 'hero' ? (u.projKindNow || u.hero.projKind || 'auto') : 'auto',
          onHit: (m, p, v) => m.autoHit(u, v, p) }, ex || {}));
      } else this.autoHit(u, t);
      u.lastAtkT = this.time;
      if ((u.kind === 'hero' || u.kind === 'pet') && this.fxOn) this.fx({ type: 'swing', id: u.id, x: u.x, y: u.y, tx: t.x, ty: t.y, ranged: u.ranged });
    }
    autoHit(u, t, p) {
      if (!u.alive && u.kind !== 'hero') { if (!(p && p.auto)) return; }
      if (!t.alive) return;
      if (u.has && u.has('blind')) { if (this.fxOn) this.fx({ type: 'miss', x: t.x, y: t.y }); return; }
      if (t.deflectT > this.time && !u.ranged && u.kind === 'hero') { this.addStatus(u, 'stun', 0.5, 1, { src: t }); return; }
      const info = { amt: u.st.ad, type: 'phys', crit: false, extra: [] };
      if (u.st.crit > 0 && this.rng.chance(u.st.crit)) { info.crit = true; info.amt *= C.CRIT_MULT + (u.bonus.critMult || 0); }
      if (u.hero) this.heroHook(u, 'onAuto', t, info);
      else if (u.onAuto) this.hook(u.onAuto, this, u, t, info);
      this.damage(u, t, info.amt, info.type, { auto: true, crit: info.crit, tag: 'auto' });
      if (u.kind === 'hero' && t.alive && u.statuses.length && u.hasKey('buff_red')) this.dot(u, t, C.BUFF.red.burn + u.level, 3, 'true', 'red_burn');
      for (const fn of info.extra) this.hook(fn, this);
      if (u.hero && t.kind === 'hero') u.lastAtkHeroT = this.time;
    }
    // tường tạm (Rào Chắn Từ Tính): chặn kẻ địch, choáng kẻ bị đẩy vào
    updateTempWalls(u) {
      for (const w of this.tempWalls) {
        if (w.until <= this.time || u.team === w.team) continue;
        const dx = w.bx - w.ax, dy = w.by - w.ay, L2 = dx * dx + dy * dy;
        let t = ((u.x - w.ax) * dx + (u.y - w.ay) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = w.ax + dx * t, qy = w.ay + dy * t, ex = u.x - qx, ey = u.y - qy, d = Math.sqrt(ex * ex + ey * ey), R = w.r + u.r;
        if (d >= R) continue;
        const k = d > 1e-6 ? R / d : 1;
        u.x = qx + ex * k; u.y = qy + ey * k;
        if (u.dash && u.dash.cc) { u.dash = null; this.addStatus(u, 'stun', 1, 1); }
      }
    }

    // ---------- đạn ----------
    updateProjs(dt) {
      for (const p of this.projs) {
        if (p.dead) continue;
        if (p.target) {
          const t = p.target;
          if (!t.alive) { p.dead = true; continue; }
          const dx = t.x - p.x, dy = t.y - p.y, L = Math.sqrt(dx * dx + dy * dy), s = p.speed * dt;
          if (L <= s + t.r * 0.5) { p.dead = true; p.x = t.x; p.y = t.y; if (p.onHit) this.hook(p.onHit, this, p, t); continue; }
          p.x += dx / L * s; p.y += dy / L * s; p.dx = dx / L; p.dy = dy / L;
          continue;
        }
        const s = p.speed * dt;
        p.x += p.dx * s; p.y += p.dy * s; p.trav += s;
        if (p.onTick) { this.hook(p.onTick, this, p); if (p.dead) continue; }
        // đạn phá đạn (Kiếm Khí): hủy mọi đạn của đối thủ chạm phải
        if (p.cutsProj) for (const q of this.projs) {
          if (q.dead || q.team === p.team || q === p) continue;
          const ex = q.x - p.x, ey = q.y - p.y, R = p.r + (q.r || 0.3) + 0.2;
          if (ex * ex + ey * ey <= R * R) { q.dead = true; if (this.fxOn) this.fx({ type: 'spark', x: q.x, y: q.y, color: '#ffffff' }); }
        }
        if (!p.ghost && !p.passWall) {
          if (this.soloArena) {
            let hitPillar = false;
            for (const pl of this.soloArena.worldPillars) {
              const pdx = p.x - pl.x, pdy = p.y - pl.y;
              if (pdx * pdx + pdy * pdy <= (pl.r + p.r) * (pl.r + p.r)) {
                p.dead = true;
                if (this.fxOn) this.fx({ type: 'spark', x: p.x, y: p.y, color: '#e0e0e0' });
                if (p.onEnd) this.hook(p.onEnd, this, p);
                hitPillar = true;
                break;
              }
            }
            if (hitPillar) continue;
          }
          const bw = MAP.blocked(p.x - p.dx * s, p.y - p.dy * s, p.x, p.y, 0, true);
          // GĐ9: Xuyên Cực Vạn Dặm — đạn đánh thường xuyên qua 1 lớp tường gỗ / thân cây / bia mộ
          if (bw && !(p.soft && (!p.softW || p.softW === bw) && (bw.style === 'wood' || bw.style === 'log' || bw.style === 'grave' || bw.style === 'mill'))) { p.dead = true; if (p.onEnd) this.hook(p.onEnd, this, p); continue; }
          if (bw) p.softW = bw;
        }
        this.grid.query(p.x, p.y, p.r + 0.2, (u) => {
          if (p.dead || !u.alive || u.team === p.team || !u.targetable || p.hit.has(u.id)) return;
          if (u.kind === 'hero' && !p.hitHeroes) return;
          if ((u.kind === 'monster' || u.kind === 'pet') && !p.hitMinions) return;
          p.hit.add(u.id);
          if (p.onHit) this.hook(p.onHit, this, p, u);
          if (!p.pierce) p.dead = true;
        }, true);
        if (!p.dead && p.trav >= p.range) { p.dead = true; if (p.onEnd) this.hook(p.onEnd, this, p); }
      }
    }
    updateZones(dt) {
      for (const z of this.zones) {
        if (z.dead) continue;
        z.age += dt;
        if (z.follow) { if (z.follow.alive) { z.x = z.follow.x; z.y = z.follow.y; } else z.age = z.life; }
        if (z.tick) { z.acc += dt; while (z.acc >= z.every) { z.acc -= z.every; this.hook(z.tick, this, z); } }
        if (z.age >= z.life) { z.dead = true; if (z.onEnd) this.hook(z.onEnd, this, z); }
      }
    }

    // ---------- tướng: hồi sinh, hồi máu ngoài giao tranh, mua đồ, thu nhập, tâm lý ----------
    updateHeroesMisc(dt) {
      for (const h of this.heroes) {
        if (!h.alive) {
          if (h.reviving) { h.respawnT -= dt; if (h.respawnT <= 0) this.revive(h); }
          continue;
        }
        // ngoài giao tranh: chỉ hồi mana (GĐ6b: không tự hồi máu — phải uống bình)
        if (this.time - h.lastDmgT > C.OOC_DELAY && this.time - (h.lastAtkHeroT || -99) > C.OOC_DELAY) {
          if (h.mp < h.st.maxMp) h.mp = Math.min(h.st.maxMp, h.mp + h.st.maxMp * C.OOC_MP * dt);
        }
        // mua đồ khi đứng cạnh Thương Nhân
        if ((this.tick + h.slot * 2) % 20 === 0 && this.merchantNear(h)) this.shopAI(h);
        // GĐ7b: mảnh hồn Đỏ "Cửa Hàng Online" — mua ở bất cứ đâu (khi không đang giao tranh)
        else if ((this.tick + h.slot * 2) % 100 === 0 && h.perks && h.perks.has('cua_hang') && this.time - (h.combatT || -99) > 4) this.shopAI(h);
        if (this.time >= C.GOLD_PASSIVE_START) this.gainGold(h, (C.GOLD_PER_SEC + (h.hasKey('buff_gold') ? C.BUFF.gold.perSec : 0)) * dt);
        // tâm lý: mất bình tĩnh nguôi dần
        if (h.tilt > 0) h.tilt = Math.max(0, h.tilt - 0.004 * (0.6 + 0.8 * (h.player.stats.mental || 10) / 20) * dt);
      }
      if (this.heroHit.length > 64) this.heroHit.splice(0, this.heroHit.length - 64);
      while (this.heroHit.length && this.time - this.heroHit[0].t > 1) this.heroHit.shift();
    }
    revive(h) {
      const p = this.revivePoint(h);
      h.alive = true; h.reviving = false; h.x = p.x; h.y = p.y; h.home = { x: p.x, y: p.y }; h.dash = null; h.cast = null; h.windup = null; h.attackTarget = null; h.goal = null; h.navP = null;
      h.statuses = h.statuses.filter((s) => s.persist && s.t > 0); h.calc(); h.hp = h.st.maxHp * C.REVIVE_HP; h.mp = h.st.maxMp; h.ga = h.st.maxGa;
      this.addStatus(h, 'invuln', 2, 1);
      this.hook(h.hero.passive && h.hero.passive.respawn, this, h);
      if (h.ai) h.ai.onRespawn();
      this.addFeed({ type: 'revive', hero: h });
      if (this.fxOn) this.fx({ type: 'lvl', x: h.x, y: h.y, team: h.team });
    }

    // ---------- chết ----------
    kill(u, killer, src) {
      if (!u.alive) return;
      // GĐ8: bùa lợi boss cứu mạng (Hồn Thần Bất Diệt của Thiên Hồn Chủ, Ấn Niết Bàn của Phượng Hoàng)
      if (u.kind === 'hero' && this.bossBuffSave(u)) return;
      // nhánh tiến hóa "không chết" (Ý Chí Bất Diệt, Phượng Hoàng Tái Sinh…)
      if (u.kind === 'hero' && u.fxl && u.fxl.onFatal) for (const fn of u.fxl.onFatal) if (this.hook(fn, this, u, killer)) { if (u.hp < 1) u.hp = 1; return; }
      // GĐ7b: mảnh hồn Đỏ "Thiên Mệnh" (hồi 400s) / Vàng "Vận Mệnh" (vỡ mảnh) — hồi sinh ngay tại chỗ
      if (u.kind === 'hero' && u.perks && u.perks.size) {
        if (this.perkReady(u, 'thien_menh')) {
          u.perkCd.thien_menh = this.time + 400; u.hp = u.st.maxHp * 0.5;
          this.addStatus(u, 'undying', 90, 1, { key: 'thien_menh' }); this.addStatus(u, 'invuln', 1, 1, { key: 'thien_menh_i' });
          u.stats.perkUse = (u.stats.perkUse || 0) + 1; this.addFeed({ type: 'perk_revive', hero: u, perk: 'thien_menh' });
          if (this.fxOn) { this.fx({ type: 'aura', id: u.id, color: '#ffd27a', life: 3 }); this.fx({ type: 'callout', id: u.id, text: '🌅 THIÊN MỆNH', color: '#ffd27a' }); }
          return;
        }
        const vm = this.hasPerk(u, 'van_menh') && (u.souls || []).find((s) => s.perk === 'van_menh');
        if (vm) {
          this.breakSoul(u, vm); u.hp = u.st.maxHp * 0.4; this.addStatus(u, 'invuln', 1.5, 1, { key: 'van_menh' });
          u.stats.perkUse = (u.stats.perkUse || 0) + 1; this.addFeed({ type: 'perk_revive', hero: u, perk: 'van_menh' });
          if (this.fxOn) { this.fx({ type: 'aura', id: u.id, color: '#c8a0ff', life: 1.5 }); this.fx({ type: 'callout', id: u.id, text: '🔮 VẬN MỆNH — mảnh hồn vỡ', color: '#d8b0ff' }); }
          return;
        }
      }
      // GĐ7: Phù Hộ Mệnh — đòn chí mạng chỉ để lại 1 máu + khiên
      if (u.kind === 'hero' && u.statuses.length && u.hasKey('fu_ho')) { this.removeStatus(u, 'buff', 'fu_ho'); u.hp = 1; this.shield(u, u, u.st.maxHp * 0.15, 3); u.stats.fuHo = (u.stats.fuHo || 0) + 1; const kb = killer ? G.ownerOf(killer) : null; this.addFeed({ type: 'fu_ho', hero: u, by: kb && kb.kind === 'hero' && kb !== u ? kb : null }); if (this.fxOn) this.fx({ type: 'aura', id: u.id, color: '#7fd8ff', life: 1 }); return; }
      u.alive = false; u.hp = 0; u.dash = null; u.cast = null; u.windup = null; u.attackTarget = null;
      const k = killer && killer.alive !== undefined ? G.ownerOf(killer) : null;
      if (u.kind === 'pet') { this.hook(u.onDeath, this, u, k); return; }
      if (u.kind === 'monster') { this.onMonsterDeath(u, k); return; }
      if (u.kind === 'hero') this.killHero(u, k);
    }
    killHero(u, k) {
      u.stats.d++;
      // ai đã góp sát thương 10s gần nhất (để ghi công & nhận biết kền kền)
      const log = [];
      if (u.dmgLog) for (const [id, r] of u.dmgLog) if (this.time - r.t <= C.ASSIST_WINDOW) { const h = this.heroById(id); if (h && h !== u) log.push({ h, amt: r.amt }); }
      u.dmgBy.clear(); if (u.dmgLog) u.dmgLog.clear();
      let killer = k && k.kind === 'hero' && k !== u ? k : null;
      let cause = killer ? 'hero' : u.zoneT && this.time - u.zoneT < 0.6 ? 'zone' : 'monster';
      // chết vì bo/quái mà vừa bị tướng khác đánh: công thuộc người đánh gần nhất
      if (!killer && log.length) { log.sort((a, b) => b.amt - a.amt); killer = log[0].h; }
      const total = log.reduce((a, x) => a + x.amt, 0), mine = killer ? (log.find((x) => x.h === killer) || { amt: 0 }).amt : 0;
      const top = log.reduce((a, x) => (x.amt > a.amt ? x : a), { amt: 0 });
      // kền kền: người ra đòn cuối chỉ góp < 35% sát thương, có người khác góp nhiều hơn
      const vulture = !!killer && cause === 'hero' && total > 0 && mine / total < 0.35 && top.h !== killer;
      const ann = { shut: (u.streak || 0) >= 3 ? u.streak : 0 };
      this.transferBuffs(u, killer);
      if (cause === 'zone') this.stats.zoneDeaths++;
      if (killer) {
        killer.stats.k++; this.stats.kills++;
        if (vulture) { killer.stats.vulture++; this.stats.vultureKills++; }
        const first = !this.stats.firstBlood; if (first) this.stats.firstBlood = true;
        const loot = Math.round(u.gold * C.GOLD_LOOT); u.gold -= loot;
        const bounty = (u.streak || 0) >= 2 ? C.BOUNTY * Math.min(C.BOUNTY_MAX, u.streak) : 0;   // truy nã
        this.gainGold(killer, C.GOLD_KILL + bounty + loot); ann.bounty = bounty;
        killer.streak = (killer.streak || 0) + 1;
        killer.multiN = this.time - (killer.lastKillT == null ? -99 : killer.lastKillT) <= 10 ? (killer.multiN || 1) + 1 : 1; killer.lastKillT = this.time;
        ann.first = first; ann.multi = killer.multiN; ann.streak = killer.streak;
        this.gainXP(killer, C.XP_KILL_BASE + C.XP_KILL_PER_LVL * u.level);
        this.heroHook(killer, 'onKill', u);
        this.bossBuffKill(killer);                                    // GĐ8: Minh Tướng Huyết Trảm (Thiết Minh Quân)
        killer.tilt = Math.max(0, killer.tilt - 0.12);
        // GĐ7b: đặc năng khi hạ gục — Uống Máu (hồi 80% máu), Cơ Mệnh (mọi chiêu hồi ngay)
        if (killer.perks && killer.perks.size && killer.alive) {
          if (killer.perks.has('uong_mau')) { this.heal(killer, killer, killer.st.maxHp * 0.8); if (this.fxOn) this.fx({ type: 'callout', id: killer.id, text: '🧛 Uống Máu', color: '#ff8a9a' }); }
          if (killer.perks.has('co_menh')) { for (const k of ['s1', 's2', 's3', 'sub', 's4']) if (killer.hero.skills[k]) this.refund(killer, k, 9); if (this.fxOn) this.fx({ type: 'callout', id: killer.id, text: '⚡ Cơ Mệnh — hồi chiêu', color: '#9fe0ff' }); }
        }
        (killer.grudgeDone || (killer.grudgeDone = new Set())).add(u.id);
      }
      this.dropSouls(u, killer);                    // GĐ6d: bị hạ rơi toàn bộ mảnh hồn xuống đất
      u.streak = 0; u.deathStreak = (u.deathStreak || 0) + 1;
      u.tilt = Math.min(1, u.tilt + 0.3 * (1.2 - (u.player.stats.mental || 10) / 25));
      const out = this.heroDown(u);
      ann.vulture = vulture;
      this.addFeed({ type: 'kill', killer, victim: u, cause, vulture, out, contrib: log.filter((x) => x.h !== killer).map((x) => x.h), ann });
      if (this.fxOn) this.fx({ type: 'death', x: u.x, y: u.y, team: u.team, id: u.id });
      if (u.ai) u.ai.onDeath(killer);
    }
    addFeed(e) { e.t = this.time; this.feed.push(e); this.feedTotal = (this.feedTotal || 0) + 1; if (this.feed.length > 300) this.feed.shift(); }
    cleanup() {
      if (this.tick % 20 === 0) {
        this.units = this.units.filter((u) => u.alive || u.kind === 'hero' || u.keep);
        this.pets = this.pets.filter((u) => u.alive || u.keep);
      }
      if (this.projs.length) this.projs = this.projs.filter((p) => !p.dead);
      if (this.tempWalls.length) this.tempWalls = this.tempWalls.filter((w) => w.until > this.time);
      if (this.wards.length && this.tick % 20 === 0) this.wards = this.wards.filter((w) => w.until > this.time);
      if (this.zones.length) this.zones = this.zones.filter((z) => !z.dead);
      if (this.dangers.length && this.tick % 4 === 0) this.dangers = this.dangers.filter((z) => z.until > this.time);
    }
    sfx(name, x, y) { if (this.fxOn) this.fx({ type: 'sfx', name, x, y }); }
    fx(e) { if (!this.fxOn) return; e.t = this.time; this.fxq.push(e); if (this.fxq.length > 600) this.fxq.splice(0, 200); }

    // ---------- dùng chiêu ----------
    // key: s1 s2 s3 s4 sub • tgt: đơn vị mục tiêu • pt: điểm {x,y}
    canCast(u, key) {
      const def = u.hero.skills[key]; if (!def) return false;
      if (key !== 'sub' && !(u.ranks[key] > 0)) return false;
      if (u.recast[key] && u.recast[key].until > this.time) return !u.disabled && !u.has('silence');
      if (def.charges) { if (u.ch[key] == null) u.ch[key] = def.charges; if (u.ch[key] <= 0) return false; }
      if ((u.cd[key] || 0) > 0) return false;
      if (def.whileDisabled) { if (u.cast || (u.dash && !u.dash.cc)) return false; }   // dùng được cả khi bị khống chế (Bất Ngờ Chưa)
      else if (u.disabled || u.has('silence') || u.cast || u.dash) return false;
      if (def.cost && u.resource === 'mana' && u.mp < this.costOf(u, key)) return false;
      if (def.can && !this.hook(def.can, this, u)) return false;
      return true;
    }
    rankOf(u, key) { return key === 'sub' ? Math.max(1, Math.min(5, Math.ceil(u.level / 4))) : u.ranks[key]; }
    costOf(u, key) { const def = u.hero.skills[key]; if (!def.cost) return 0; const r = this.rankOf(u, key); return (Array.isArray(def.cost) ? def.cost[Math.min(def.cost.length, r) - 1] : def.cost) * C.MANA_COST; }
    cdOf(u, key) { const def = u.hero.skills[key]; const r = this.rankOf(u, key); const cd = typeof def.cd === 'function' ? def.cd(this, u) : Array.isArray(def.cd) ? def.cd[Math.min(def.cd.length, r) - 1] : def.cd; return cd * (1 - u.st.cdr); }
    castSkill(u, key, tgt, pt) {
      if (!this.canCast(u, key)) return false;
      const def = u.hero.skills[key];
      const rank = this.rankOf(u, key);
      const ctx = { key, rank, tgt: tgt || null, pt: pt || (tgt ? { x: tgt.x, y: tgt.y } : { x: u.x + u.fx * 3, y: u.y + u.fy * 3 }), v: (arr) => (Array.isArray(arr) ? arr[Math.min(arr.length, rank) - 1] : arr) };
      // tái kích hoạt (không tốn hồi chiêu)
      const rc = u.recast[key];
      if (rc && rc.until > this.time) {
        u.recast[key] = null;
        this.hook(rc.fn, this, u, ctx);
        return true;
      }
      if (def.cost && u.resource === 'mana') u.mp -= this.costOf(u, key);
      if (def.charges) { u.ch[key]--; if (!(u.chT[key] > 0)) u.chT[key] = this.cdOf(u, key); u.cd[key] = def.gap || 0.3; }
      else if (!def.manualCd) u.cd[key] = this.cdOf(u, key);
      u.face(ctx.pt.x, ctx.pt.y);
      u.windup = null;
      const run = () => {
        if (ct > 0) u.ws.chargedT = this.time + 0.6;              // GĐ8: "đòn tụ lực" (chiêu có thời gian niệm) — mảnh hồn Diệt Thế Xuyên Tâm
        this.hook(def.use, this, u, ctx);
        this.heroHook(u, 'onSkill', key, ctx);
        if (u.ai) u.ai.onCast(key);
      };
      const ct = typeof def.castTime === 'function' ? def.castTime(this, u, ctx) : def.castTime || 0;
      if (ct > 0) { u.cast = { key, t: ct, total: ct, fire: run, move: typeof def.castMove === 'function' ? def.castMove(this, u) : def.castMove || 0, unstop: !!def.castUnstop, ctx }; if (u.fxl.onCastStart) this.heroHook(u, 'onCastStart', key, u.cast); }
      else run();
      if (this.fxOn) this.fx({ type: 'cast', id: u.id, key, x: u.x, y: u.y, team: u.team, hero: u.heroId });
      // GĐ7b: Tuyệt Kỹ Nộ — chiêu cuối gây ×2 sát thương trong 3.5s (hồi 60s)
      if (key === 's4' && this.perkReady(u, 'tuyet_ky_no')) { u.perkCd.tuyet_ky_no = this.time + 60; u.ultRageT = this.time + 3.5; u.stats.perkUse = (u.stats.perkUse || 0) + 1; if (this.fxOn) { this.fx({ type: 'callout', id: u.id, text: '💢 TUYỆT KỸ NỘ ×2', color: '#ff5a3a' }); this.fx({ type: 'aura', id: u.id, color: '#ff3a2a', life: 3.5 }); } }
      return true;
    }
    // hoàn lại chiêu: chiêu nhiều lượt thì +n lượt, chiêu thường thì hồi ngay
    refund(u, key, n) {
      const def = u.hero.skills[key]; if (!def) return;
      if (def.charges) {
        u.ch[key] = Math.min(def.charges, (u.ch[key] == null ? def.charges : u.ch[key]) + (n || 1));
        if (u.ch[key] >= def.charges) u.chT[key] = 0;
        u.cd[key] = Math.min(u.cd[key] || 0, 0.1);
      } else u.cd[key] = 0;
    }
    // cho phép tái kích hoạt chiêu key trong dur giây
    allowRecast(u, key, dur, fn) { u.recast[key] = { until: this.time + dur, fn }; }

    // ---------- chạy cả trận (không cần hình) ----------
    runToEnd() { while (!this.over) this.step(); return this.result(); }
    result() {
      return {
        seed: this.seed, time: this.time, timeout: !!this.timeout, errors: this.errors.slice(),
        winner: this.winner, kills: this.stats.kills, vultureKills: this.stats.vultureKills, zoneDeaths: this.stats.zoneDeaths, bossKills: this.bossSt.kills,
        drops: this.drops.map((d) => (d.by ? d.by.heroId : null)),
        heroes: this.heroes.map((h) => ({ hero: h.heroId, team: h.team, pers: h.persId, player: h.player.name, place: h.place, level: h.level, k: h.stats.k, d: h.stats.d,
          vulture: h.stats.vulture, camps: h.stats.camps, boss: h.stats.boss, drops: h.stats.drops,
          gold: Math.round(h.stats.goldEarned), dmg: Math.round(h.stats.dmgHero), items: h.items.slice(), tree: this.treeCodes(h) })),
      };
    }
  }
  Object.assign(Match.prototype, G.Combat, G.Neutral, G.BossMix, G.ArenaMix, G.ExtrasMix, G.BagMix, G.PropMix, G.ItemMix, G.TreeMix, G.DecoyMix, G.HouseMix);
  G.Match = Match;
  G.DEFAULT_PLAYER = DEFAULT_PLAYER;
})();
