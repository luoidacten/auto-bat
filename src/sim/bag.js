'use strict';
// ===== BALO, VẬT PHẨM DÙNG 1 LẦN, RƯƠNG ĐỒ, BẪY (GĐ7) — gắn vào Match.prototype =====
// • Balo cấp 1–5 (số ô G.BAG.slots), mỗi ô 1 loại vật phẩm xếp chồng tới `stack`. Bình máu/mana cũng nằm trong balo.
// • Mua vật phẩm & nâng balo ở Thương Nhân; rương đồ rải khắp bản đồ (mở mất 1.5s, bị đánh thì hỏng) cho vật phẩm, vàng,
//   đôi khi nâng balo / ý niệm.
// • Dùng vật phẩm: m.useBag(u, id, tgt, pt). Các vật phẩm cách nhau tối thiểu G.BAG.useGap giây.
// • AI dùng vật phẩm: G.BagAI.tryBag(ai, enemies) (gọi mỗi nhịp nghĩ); AI mua đồ theo tính cách: buyBag(u).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, MAP = G.MAP, M = G.M;
  const { dist } = M;
  const IT = () => G.CONSUMABLES;

  const Bag = {
    // ---------- balo ----------
    initBag(u) {
      u.bag = { lv: 1, slots: [] };
      u.pots = { hp: 0, mp: 0, ga: 0 };          // tiện dùng: số bình trong balo (đồng bộ ở bagAdd / bagTake)
      const B = G.BAG.start;
      for (const id in B) if (!IT()[id].mana || u.resource === 'mana') this.bagAdd(u, id, B[id]);
    },
    // GĐ7b: số bình máu / mana (mọi cỡ)
    potCount(u, kind) { let n = 0; if (u.bag) for (const s of u.bag.slots) { const d = IT()[s.id]; if (d && d.pot === kind) n += s.n; } return n; },
    syncPots(u) { u.pots.hp = this.potCount(u, 'hp'); u.pots.mp = this.potCount(u, 'mp'); u.pots.ga = this.potCount(u, 'ga'); },
    bagCap(u) { return G.BAG.slots[Math.max(0, Math.min(G.BAG.slots.length - 1, (u.bag ? u.bag.lv : 1) - 1))]; },
    // GĐ8: số bình tối đa mỗi loại (Túi 6: +2)
    potCap(u) { return C.POTION.cap + (u.bag && u.bag.lv >= 6 ? G.BAG.potBonus6 : 0); },
    bagCount(u, id) { let n = 0; if (u.bag) for (const s of u.bag.slots) if (s.id === id) n += s.n; return n; },
    // thêm n món (đủ chỗ thì xếp chồng / mở ô mới); trả về số đã thêm
    bagAdd(u, id, n) {
      const def = IT()[id]; if (!def || !u.bag) return 0;
      let left = n || 1, added = 0;
      if (def.pot) { if (def.mana && u.resource !== 'mana') return 0; left = Math.min(left, this.potCap(u) - this.potCount(u, def.pot)); }   // tối đa 3 bình mỗi loại (Túi 6: 5)
      while (left > 0) {
        let s = u.bag.slots.find((x) => x.id === id && x.n < def.stack);
        if (!s) { if (u.bag.slots.length >= this.bagCap(u)) break; s = { id, n: 0 }; u.bag.slots.push(s); }
        const k = Math.min(left, def.stack - s.n); s.n += k; left -= k; added += k;
      }
      if (def.group === 'potion') this.syncPots(u);
      return added;
    },
    bagTake(u, id) {
      let i = -1; if (u.bag) u.bag.slots.forEach((x, j) => { if (x.id === id && x.n > 0 && (i < 0 || x.n < u.bag.slots[i].n)) i = j; });   // lấy từ chồng ít nhất trước
      if (i < 0) return false;
      const s = u.bag.slots[i]; s.n--; if (s.n <= 0) u.bag.slots.splice(i, 1);
      if (IT()[id].pot) this.syncPots(u);
      return true;
    },
    bagRoom(u, id) { const def = IT()[id]; if (!def || !u.bag) return 0; if (def.pot && this.potCount(u, def.pot) >= this.potCap(u)) return 0; let r = 0; for (const s of u.bag.slots) if (s.id === id) r += def.stack - s.n; return r + (this.bagCap(u) - u.bag.slots.length) * def.stack; },
    upgradeBag(u) {
      if (!u.bag || u.bag.lv >= 5) return false;
      u.bag.lv++; if (this.fxOn) this.fx({ type: 'ring', x: u.x, y: u.y, r: 1.8, color: '#c8a060' });
      return true;
    },
    // ---------- mua ở Thương Nhân (AI) ----------
    // danh sách muốn mang theo, theo tính cách (P.bag) hoặc mặc định
    // GĐ7b: bình — "hp: n" trong P.bag nghĩa là coi trọng bình máu (n ≥ 6: thích bình to); cỡ bình theo túi tiền
    bagWish(u) {
      const P = u.pers || {}, phase = this.zoneSt ? this.zoneSt.phase : 0;
      const w = Object.assign({ hp: 5, mp: u.resource === 'mana' ? 2 : 0, ga: u.st.maxGa > 250 ? 3 : 2, flash: 1, heal: 1, barrier: 0, fu_doc: phase >= 2 ? 1 : 0 }, P.bag || {});
      const size = (kind, n) => (u.gold >= 1400 || (n >= 6 && u.gold >= 700) ? kind + '_l' : u.gold >= 350 ? kind + '_m' : kind + '_s');
      const out = {};
      for (const k in w) {
        if (k === 'hp' || k === 'mp' || k === 'ga') { if (k === 'mp' && u.resource !== 'mana') continue; if (w[k] > 0) out[size(k, k === 'ga' ? Math.min(5, w[k]) : w[k])] = Math.min(this.potCap(u), w[k]); }
        else out[k] = w[k];
      }
      return out;
    },
    buyBag(u) {
      if (!u.bag) return;
      const B = G.BAG, P = u.pers || {};
      // nâng balo: còn dư vàng (tích trữ / thích đồ thì nâng sớm)
      const reserve = P.hoard ? 150 : 450;
      while (u.bag.lv < 5 && u.gold >= B.upgrade[u.bag.lv] + reserve && (u.bag.lv < 3 || P.hoard || u.gold > 2500)) { u.gold -= B.upgrade[u.bag.lv]; this.upgradeBag(u); }
      const wish = this.bagWish(u);
      for (const id of Object.keys(wish)) {
        const def = IT()[id]; if (!def || def.noBuy) continue;
        const have = () => (def.pot ? this.potCount(u, def.pot) : this.bagCount(u, id));
        while (have() < wish[id] && u.gold >= def.cost + (def.pot ? 0 : 200) && this.bagRoom(u, id) > 0) { u.gold -= def.cost; this.bagAdd(u, id, 1); }
      }
    },
    // vứt bỏ vật phẩm (champions/AI có thể vứt bỏ các vật phẩm không mong muốn hoặc độ ưu tiên thấp để giải phóng chỗ trống)
    bagDrop(u, id, n) {
      const def = IT()[id]; if (!def || !u.bag) return false;
      const count = Math.min(n || 1, this.bagCount(u, id));
      if (count <= 0) return false;
      for (let i = 0; i < count; i++) this.bagTake(u, id);
      (this.itemDrops || (this.itemDrops = [])).push({
        id, n: count, x: u.x, y: u.y, until: this.time + 60, droppedBy: u, t0: this.time
      });
      if (this.fxOn) this.fx({ type: 'burst', x: u.x, y: u.y, color: '#e0c080' });
      return true;
    },
    updateItemDrops() {
      const D = this.itemDrops; if (!D || !D.length || this.tick % 2) return;
      for (let i = D.length - 1; i >= 0; i--) {
        const d = D[i];
        if (this.time >= d.until) { D.splice(i, 1); continue; }
        for (const h of this.heroes) {
          if (!h.alive) continue;
          if (d.droppedBy === h && this.time - d.t0 < 1.0) continue;
          if (dist(h, d) <= 1.4 + h.r) {
            const added = this.bagAdd(h, d.id, d.n);
            if (added > 0) {
              d.n -= added;
              if (d.n <= 0) { D.splice(i, 1); break; }
            }
          }
        }
      }
    },
    // ---------- dùng vật phẩm ----------
    canUseBag(u, id) {
      if (!u.alive || !this.bagCount(u, id) || this.time < (u.bagT || 0)) return false;
      if (u.disabled && id !== 'cleanse') return false;
      if (u.cast || u.dash) return false;
      if ((id === 'flash' || id === 'hook' || id === 'grapple_dash') && (u.has('nodash') || u.hasKey('hook_block'))) return false;
      return true;
    },
    useBag(u, id, tgt, pt) {
      if (!this.canUseBag(u, id)) return false;
      const fn = USE[id]; if (!fn) return false;
      const ok = fn(this, u, tgt, pt);
      if (!ok) return false;
      this.bagTake(u, id); u.bagT = this.time + G.BAG.useGap;
      u.stats.bagUsed = (u.stats.bagUsed || 0) + 1;
      this.lastUse = { kind: 'bag', id, by: u, t: this.time, tgt, pt };
      // Roxie: dùng vật phẩm/tiêu hao có tỉ lệ rơi bánh răng 10/20/30/50/80% dựa trên cấp S2
      if ((u.heroId === 'roxie' || (u.hero && u.hero.id === 'roxie')) && u.ranks && u.ranks.s2) {
        const rk = Math.max(0, Math.min(4, (u.ranks.s2 || 1) - 1));
        const pGear = [0.10, 0.20, 0.30, 0.50, 0.80][rk];
        if (this.rng.next() < pGear) {
          (this.gearDrops || (this.gearDrops = [])).push({ id: this.nextId++, x: u.x, y: u.y, owner: u, until: this.time + 25 });
        }
      }
      if (this.fxOn) this.fx({ type: 'callout', id: u.id, text: IT()[id].icon + ' ' + IT()[id].name, color: '#ffe9b0' });
      return true;
    },
    // GĐ7b: Lưu Vân — lướt 4 đv rồi +40% tốc chạy 2s, hồi 10s
    useLuuVan(u, pt) {
      if (!this.perkReady(u, 'luu_van') || u.cast || u.dash || u.disabled) return false;
      const v = M.dir(u, pt), d = Math.min(4, dist(u, pt) || 4), p = { x: u.x + v.x * d, y: u.y + v.y * d };
      const land = G.SkillAI.landing(u, v.x, v.y, d, false);
      if (dist(land, u) < 1.2) return false;
      u.perkCd.luu_van = this.time + 10;
      this.dashTo(u, land.x, land.y, 26, { onEnd: (m, h) => m.addStatus(h, 'haste', 2, 0.4, { key: 'luu_van' }) });
      if (this.fxOn) { this.fx({ type: 'dashtrail', id: u.id, x: u.x, y: u.y, x2: land.x, y2: land.y, color: '#cfe8ff' }); this.fx({ type: 'callout', id: u.id, text: '☁ Lưu Vân', color: '#cfe8ff' }); }
      u.stats.perkUse = (u.stats.perkUse || 0) + 1;
      return true;
    },
    // ---------- rương đồ ----------
    setupChests() {
      this.chests = []; this.chestN = 0; this.chestNext = C.CHEST.every;
      // GĐ7: trong nhà / đền / trên cao nguyên luôn có 1 rương lúc đầu trận (lý do để vào công trình)
      for (const s of MAP.structs) if (s.inside) this.chests.push({ id: ++this.chestN, x: Math.round(s.x * 100) / 100, y: Math.round(s.y * 100) / 100, opened: false, by: null, inside: s.type });
      for (const R of MAP.REGIONS) for (let i = 0; i < C.CHEST.perRegion; i++) this.spawnChest(R.id);
    },
    spawnChest(regionId, circle) {
      for (let k = 0; k < 30; k++) {
        let p;
        if (circle) { const a = this.rngArena.range(0, Math.PI * 2), r = Math.sqrt(this.rngArena.next()) * Math.max(4, circle.r - 6); p = { x: circle.x + M.cos(a) * r, y: circle.y + M.sin(a) * r }; }
        else { p = { x: this.rngArena.range(8, C.MAP - 8), y: this.rngArena.range(8, C.MAP - 8) }; if (MAP.regionAt(p.x, p.y).id !== regionId) continue; }
        if (p.x < 6 || p.y < 6 || p.x > C.MAP - 6 || p.y > C.MAP - 6 || MAP.inWall(p.x, p.y, 1.5)) continue;
        if (MAP.camps.some((c) => dist(c, p) < 7) || MAP.merchants.some((t) => dist(t, p) < 8) || MAP.spawns.some((s) => dist(s, p) < 6) || dist(p, MAP.bossLair) < MAP.bossLair.r + 4) continue;
        if (MAP.reachable && !MAP.reachable(p)) continue;
        const c = { id: ++this.chestN, x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100, opened: false, by: null };
        this.chests.push(c);
        return c;
      }
      return null;
    },
    updateChests() {
      if (!this.chests) return;
      if (this.time >= this.chestNext && this.time < C.CHEST.until) {
        this.chestNext = this.time + C.CHEST.every;
        const s = this.safeCircle();
        for (let i = 0; i < C.CHEST.wave; i++) this.spawnChest(-1, s);
        this.addFeed({ type: 'chest_wave', n: C.CHEST.wave });
      }
      if (this.tick % 40 === 0) this.chests = this.chests.filter((c) => !c.opened);
    },
    // bắt đầu mở rương (niệm 1.5s, đứng yên; bị đánh / khống chế thì hỏng)
    openChest(u, c) {
      if (!c || c.opened || u.cast || u.dash || u.disabled || dist(u, c) > C.CHEST.r + u.r) return false;
      u.attackTarget = null; u.windup = null; u.goal = null;
      u.cast = { key: 'chest', t: C.CHEST.open, total: C.CHEST.open, move: 0, chest: c, interruptOnHit: true,
        fire: (m, h) => { if (!c.opened && h.alive) m.lootChest(h, c); } };
      return true;
    },
    // GĐ8: may mắn (u.st.loot) → thêm món, đồ quý (đắt) dễ ra hơn, có cơ hội ra mảnh hồn bậc cao, nâng balo / ý niệm
    lootChest(u, c) {
      c.opened = true; c.by = u;
      const R = this.rng, L = G.CHEST_LOOT, got = [], luck = u.st.loot || 0;
      const nItems = 2 + (R.next() < luck ? 1 : 0) + (R.next() < luck * 0.4 ? 1 : 0);
      for (let i = 0; i < nItems; i++) {
        const ok = (k) => !IT()[k].mana || u.resource === 'mana';
        const w = (k) => L[k] * (1 + luck * 2 * Math.min(1, IT()[k].cost / 200));   // đồ đắt được may mắn kéo lên
        let tot = 0; for (const k in L) if (ok(k)) tot += w(k);
        let r = R.next() * tot, id = 'hp_s';
        for (const k in L) { if (!ok(k)) continue; r -= w(k); if (r <= 0) { id = k; break; } }
        if (this.bagAdd(u, id, 1)) got.push(id); else this.gainGold(u, Math.round(IT()[id].cost * 0.5));
      }
      this.gainGold(u, C.CHEST.gold * (1 + luck));
      let extra = null;
      if (R.next() < C.CHEST.soul * (1 + luck)) { const t = this.rollTier(R.next() < 0.3 ? 2 : 1, luck, 4); if (this.giveSoul(u, t, 'rương')) extra = 'soul' + t; }
      if (extra) { /* đã có mảnh hồn */ }
      else if (R.next() < C.CHEST.bagUp * (1 + luck) && this.upgradeBag(u)) extra = 'bag';
      else if (R.next() < C.CHEST.yniem * (1 + luck) && (u.yNiem || 0) < 5 && this.setYNiem(u, (u.yNiem || 0) + 1, 'rương')) extra = 'yniem';
      // Roxie: mở rương cũng rơi bánh răng
      if (u.heroId === 'roxie' || (u.hero && u.hero.id === 'roxie')) {
        (this.gearDrops || (this.gearDrops = [])).push({ id: this.nextId++, x: c.x + 0.5, y: c.y, owner: u, until: this.time + 25 });
      }
      u.stats.chests = (u.stats.chests || 0) + 1;
      this.addFeed({ type: 'chest', hero: u, items: got, extra });
      if (this.fxOn) this.fx({ type: 'burst', x: c.x, y: c.y, color: '#ffd24a' });
    },
    // ---------- bẫy ----------
    updateTraps() {
      const T = this.traps; if (!T || !T.length || this.tick % 2) return;
      for (let i = T.length - 1; i >= 0; i--) {
        const t = T[i];
        if (this.time >= t.until || !t.owner) { T.splice(i, 1); continue; }
        let hit = null;
        for (const h of this.heroes) if (h.alive && h.team !== t.team && dist(h, t) <= t.r + h.r && !h.has('untarget') && !(h.shOn && h.shOn.has('P_VIS_04'))) { hit = h; break; }   // GĐ9: Radar Tàn Tích thấy bẫy → không dẫm
        if (!hit) continue;
        T.splice(i, 1);
        if (t.ice) {
          this.addStatus(hit, 'stun', 1.2, 1, { src: t.owner, key: 'freeze' });
          this.addStatus(hit, 'slow', 3, 0.4, { src: t.owner, key: 'ice_slip' });
          hit.iceSlipT = this.time + 3;
          this.addFeed({ type: 'trap', hero: hit, by: t.owner, ice: true });
          if (this.fxOn) { this.fx({ type: 'burst', x: t.x, y: t.y, color: '#c0e8ff' }); this.fx({ type: 'callout', id: hit.id, text: '❄ Đóng Băng', color: '#a0e0ff' }); }
        } else {
          this.addStatus(hit, 'root', 1.5, 1, { src: t.owner });
          hit.revealedT = Math.max(hit.revealedT || 0, this.time + 4);
          this.damage(t.owner, hit, hit.st.maxHp * 0.06, 'true', { tag: 'trap' });
          this.addFeed({ type: 'trap', hero: hit, by: t.owner });
          if (this.fxOn) this.fx({ type: 'burst', x: t.x, y: t.y, color: '#c8a060' });
        }
      }
    },
  };

  // ===== hiệu ứng từng vật phẩm: trả về true nếu dùng được =====
  const merchantNear = (m) => { const s = m.safeCircle(); let best = null, bd = 1e9; for (const t of MAP.merchants) { const d = dist(t, s); if (d < bd) { bd = d; best = t; } } return best; };
  const USE = {
    flash(m, u, t, pt) {
      if (!pt) return false;
      const v = M.dir(u, pt), d = Math.min(4, dist(u, pt) || 4);
      m.blink(u, u.x + v.x * d, u.y + v.y * d); return true;
    },
    ghost(m, u) { m.addStatus(u, 'haste', 6, 0.35, { key: 'bag_ghost' }); return true; },
    heal(m, u) { m.heal(u, u, u.st.maxHp * 0.15); m.addStatus(u, 'haste', 2, 0.2, { key: 'bag_heal' }); return true; },
    barrier(m, u) { m.shield(u, u, u.st.maxHp * 0.2, 3); return true; },
    ignite(m, u, t) {
      if (!t || !t.alive || t.kind !== 'hero' || dist(u, t) > 6 + t.r) return false;
      m.dot(u, t, t.st.maxHp * 0.02, 5, 'true', 'bag_ignite'); m.addStatus(t, 'wound', 5, 1, { src: u }); return true;
    },
    exhaust(m, u, t) {
      if (!t || !t.alive || dist(u, t) > 6 + t.r) return false;
      m.addStatus(t, 'slow', 2.5, 0.35, { src: u, key: 'bag_exh' }); m.addStatus(t, 'buff', 2.5, 1, { key: 'bag_exh_w', mods: { dmgAmp: -0.35 } }); return true;
    },
    cleanse(m, u) { m.cleanse(u); m.addStatus(u, 'buff', 2, 1, { key: 'bag_cleanse', mods: { tenacity: 0.6 } }); return true; },
    smite(m, u, t) {
      if (!t || !t.alive || dist(u, t) > 5 + t.r) return false;
      if (t.kind === 'monster') m.damage(u, t, 500 + 60 * u.level, 'true', { tag: 'smite' });
      else if (t.kind === 'hero') m.damage(u, t, t.st.maxHp * 0.1, 'true', { tag: 'smite' });
      else return false;
      if (m.fxOn) m.fx({ type: 'boom', x: t.x, y: t.y, r: 1.4, color: '#ffd27a' }); return true;
    },
    tp(m, u) {
      const t = merchantNear(m); if (!t || dist(u, t) < 20) return false;
      u.attackTarget = null; u.goal = null;
      u.cast = { key: 'tp', t: 3, total: 3, move: 0, dest: { x: t.x + 2, y: t.y + 2 }, fire: (mm, h) => { if (h.alive) mm.blink(h, t.x + 2, t.y + 2); } };
      return true;
    },
    hook(m, u, t, pt) {
      if (!pt) return false;
      const R = 9 * (1 + (u.bonus.hookRange || 0)), v = M.dir(u, pt), d = Math.min(R, dist(u, pt) || R);   // GĐ8/9: mảnh hồn tăng tầm dây móc
      const p = { x: u.x + v.x * d, y: u.y + v.y * d }; MAP.pushOut(p, u.r);
      if (m.fxOn) m.fx({ type: 'line', x: u.x, y: u.y, x2: p.x, y2: p.y, w: 0.15, color: '#c8a060' });
      return m.dashTo(u, p.x, p.y, 24 * (1 + (u.bonus.hookSpd || 0)), { wall: true, untarget: true, hookItem: true });
    },
    trap(m, u, t, pt) {
      const p = pt ? { x: pt.x, y: pt.y } : { x: u.x, y: u.y };
      if (dist(u, p) > 3) { const v = M.dir(u, p); p.x = u.x + v.x * 3; p.y = u.y + v.y * 3; }
      MAP.pushOut(p, 0.5);
      (m.traps || (m.traps = [])).push({ x: p.x, y: p.y, r: 0.9, team: u.team, owner: u, until: m.time + 90, t0: m.time });
      return true;
    },
    bomb(m, u, t, pt) {
      if (!pt) return false;
      const d = Math.min(6, dist(u, pt)), v = M.dir(u, pt), p = { x: u.x + v.x * d, y: u.y + v.y * d };
      m.proj({ owner: u, x: u.x, y: u.y, dx: v.x, dy: v.y, speed: 12, range: Math.max(0.5, d), r: 0.3, kind: 'bomb', hitHeroes: false, hitMinions: false,
        onEnd: (mm) => mm.later(0.6, (m3) => m3.hitCircle(u, p.x, p.y, 2.5, (e) => {
          m3.damage(u, e, e.st.maxHp * 0.1, 'true', { tag: 'bomb', aoe: true });
          const w = M.dir(p, e); m3.knock(u, e, w.x, w.y, 1.5, 0.2);
        }, { color: '#ff9a3a', fx: 'boom' })) });
      return true;
    },
    fu_doc(m, u) { m.addStatus(u, 'buff', 25, 1, { key: 'fu_doc' }); return true; },
    // GĐ8: Bình Thuốc Rực Rỡ — hồi đầy máu và Hộ Giáp ngay lập tức
    radiant(m, u) { if (u.hpPct > 0.9 && u.ga >= u.st.maxGa - 1) return false; m.heal(u, u, u.st.maxHp); u.ga = u.st.maxGa; if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#fff099', life: 1 }); return true; },
    fu_ho(m, u) { if (u.hasKey('fu_ho')) return false; m.addStatus(u, 'buff', 60, 1, { key: 'fu_ho' }); return true; },
    fu_an(m, u) { m.addStatus(u, 'stealth', 4, 1, { key: 'fu_an' }); return true; },
    fu_tuc(m, u) { m.removeStatus(u, 'slow'); m.addStatus(u, 'haste', 4, 0.4, { key: 'fu_tuc' }); m.addStatus(u, 'buff', 4, 1, { key: 'fu_tuc_t', mods: { tenacity: 0.3 } }); return true; },

    // 9 vật phẩm tiêu hao mới (Mục 13e)
    scout_tower(m, u) {
      (m.wards || (m.wards = [])).push({ team: u.team, owner: u, x: u.x, y: u.y, until: m.time + 45, id: m.nextId++, r: 16, scout: true, trueSight: true });
      if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: 16, color: '#64d2ff', life: 1.5 });
      return true;
    },
    emp_grenade(m, u, t, pt) {
      const p = pt ? { x: pt.x, y: pt.y } : (t ? { x: t.x, y: t.y } : { x: u.x + u.fx * 5, y: u.y + u.fy * 5 });
      const d = Math.min(7, dist(u, p)), v = M.dir(u, p), dst = { x: u.x + v.x * d, y: u.y + v.y * d };
      m.later(0.5, (mm) => {
        mm.hitCircle(u, dst.x, dst.y, 2.5, (e) => {
          const gaDmg = 350 + 30 * u.level;
          if (e.ga > 0) {
            const dealt = Math.min(e.ga, gaDmg);
            e.ga -= dealt;
            if (e.ga <= 0.5) { e.ga = 0; mm.gaBreak(e, u); }
          }
          mm.addStatus(e, 'buff', 2.5, 1, { key: 'hook_block' });
        }, { color: '#8ae0ff', fx: 'boom' });
      });
      return true;
    },
    mirror_decoy(m, u) {
      const a = M.atan2(u.fy || 0, u.fx || 1);
      const runTo = { x: u.x + M.cos(a) * 16, y: u.y + M.sin(a) * 16 };
      m.makeDecoy(u, u.x, u.y, { life: 4, runTo, hp: 0.35 });
      m.addStatus(u, 'stealth', 1.5, 1, { key: 'mirror_decoy_stealth' });
      m.addStatus(u, 'haste', 1.5, 0.25, { key: 'mirror_decoy_haste' });
      return true;
    },
    ice_trap(m, u, t, pt) {
      const p = pt ? { x: pt.x, y: pt.y } : { x: u.x, y: u.y };
      if (dist(u, p) > 3) { const v = M.dir(u, p); p.x = u.x + v.x * 3; p.y = u.y + v.y * 3; }
      MAP.pushOut(p, 0.5);
      (m.traps || (m.traps = [])).push({ x: p.x, y: p.y, r: 0.9, team: u.team, owner: u, until: m.time + 90, t0: m.time, ice: true });
      return true;
    },
    blood_pot(m, u) {
      if (u.ga > 0) u.ga = Math.max(0, u.ga * 0.7);
      m.addStatus(u, 'buff', 8, 1, { key: 'blood_pot', mods: { lifesteal: 0.2, physAmp: 0.15, magicAmp: 0.15, adPct: 0.15, apPct: 0.15 } });
      if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ff3b5c', life: 1 });
      return true;
    },
    corrosive_oil(m, u) {
      m.addStatus(u, 'buff', 12, 1, { key: 'corrosive_oil', charges: 4, mods: { bypass: 0.5 } });
      if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#88ff44', life: 0.8 });
      return true;
    },
    petrify_talisman(m, u) {
      u.cast = null; u.dash = null; u.attackTarget = null; u.goal = null;
      m.addStatus(u, 'invuln', 2.0, 1, { key: 'petrify' });
      m.addStatus(u, 'unstop', 2.0, 1, { key: 'petrify_unstop' });
      m.addStatus(u, 'stun', 2.0, 1, { key: 'petrify_stun' });
      if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#999999', life: 2.0 });
      return true;
    },
    smoke_bomb(m, u, t, pt) {
      const p = { x: u.x, y: u.y };
      for (const h of m.heroes) {
        if (h.alive && dist(h, p) <= 4) {
          m.removeStatus(h, 'wound');
          m.removeStatus(h, 'dot', 'bag_ignite');
          m.removeStatus(h, 'dot', 'rox_fire');
        }
      }
      (m.zones || (m.zones = [])).push({ owner: u, x: p.x, y: p.y, r: 4, life: 5, until: m.time + 5, kind: 'smoke_screen', smoke: true, team: u.team });
      if (m.fxOn) m.fx({ type: 'ring', x: p.x, y: p.y, r: 4, color: '#bbbbbb', life: 5 });
      return true;
    },
    grapple_dash(m, u, tgt) {
      if (!tgt || !tgt.alive || dist(u, tgt) > 8.5) return false;
      const okKind = tgt.kind === 'hero' || (tgt.kind === 'monster' && (tgt.big || tgt.boss));
      if (!okKind) return false;
      m.dashTo(u, tgt.x, tgt.y, 24, {
        onEnd: (mm, self) => {
          mm.addStatus(tgt, 'stun', 0.5, 1, { src: self });
          self.freeDashT = mm.time + 4;
          if (self.cd && self.cd.sub > 0) self.cd.sub = 0;
          if (self.cd && self.cd.s3 > 0) self.cd.s3 = Math.max(0, self.cd.s3 - 2.5);
          if (self.ai && self.ai.target && dist(self, self.ai.target) > 1.5) {
            const v = M.dir(self, self.ai.target);
            mm.dashTo(self, self.x + v.x * 2.5, self.y + v.y * 2.5, 20, {});
          }
        }
      });
      return true;
    },
  };

  // ===== AI dùng vật phẩm (Utility AI) =====
  const BagAI = {
    tryBag(ai, enemies) {
      const m = ai.m, u = ai.u;
      if (!u.bag || !u.bag.slots.length || m.time < (u.bagT || 0) || u.cast || u.dash) return false;

      // 0. AI Vứt bỏ vật phẩm thừa (không dùng mana vứt bình mana, túi đầy vứt đồ kém giá trị)
      if (u.resource !== 'mana') {
        for (const pid of ['mp_s', 'mp_m', 'mp_l']) if (m.bagCount(u, pid) > 0) { m.bagDrop(u, pid); return true; }
      }
      if (u.bag.slots.length >= m.bagCap(u) && m.bagCount(u, 'radiant') > 0 && m.bagCount(u, 'hp_s') > 0) {
        m.bagDrop(u, 'hp_s'); return true;
      }

      if (G.Persona && G.Persona.bag(ai, enemies)) return true;          // GĐ7: vật phẩm riêng theo tính cách

      // GĐ7b: đặc năng Lưu Vân (mảnh hồn Vàng): lướt ngắn + tăng tốc
      if (m.perkReady(u, 'luu_van') && !u.disabled && !u.has('nodash')) {
        const near0 = enemies.filter((e) => dist(e, u) < 6), fl = ai.fleeing || ai.mode === 'retreat';
        let pt = null;
        if (fl && near0.some((e) => dist(e, u) < 3.5)) { const sp = ai.safeSpot ? ai.safeSpot() : { x: C.MAP / 2, y: C.MAP / 2 }, v = M.dir(u, sp); pt = { x: u.x + v.x * 4, y: u.y + v.y * 4 }; }
        else if (ai.mode === 'fight' && ai.target && ai.target.kind === 'hero') { const t = ai.target, d = dist(u, t); if (d > u.st.range + u.r + t.r + 1 && d < 7 && (t.hpPct < 0.4 || !u.ranged)) { const v = M.dir(u, t); pt = { x: u.x + v.x * Math.min(4, d - 1), y: u.y + v.y * Math.min(4, d - 1) }; } }
        if (pt && m.useLuuVan(u, pt)) return true;
      }

      const has = (id) => m.bagCount(u, id) > 0;
      const near = enemies.filter((e) => dist(e, u) < 8);
      const tgt = ai.target && ai.target.alive ? ai.target : near[0] || null;
      const fleeing = ai.fleeing || ai.mode === 'retreat';
      const inCombat = m.time - (u.combatT || -99) < 4 || near.length > 0;
      const hit = m.time - (u.lastDmgT || -99) < 1;
      const use = (id, t, p) => m.useBag(u, id, t, p);

      // --- 1. NHÓM SINH TỒN & PHÒNG NGỰ KHẨN CẤP ---
      // ✨ Thanh Tẩy: CHỈ kích hoạt khi dính KHỐNG CHẾ CỨNG (Choáng, Mê Hoặc, Trói Chân, Hóa Đá) và có kẻ địch đe dọa (<= 8 đv)
      if (has('cleanse') && u.disabled && near.length > 0) {
        const hardCC = u.statuses.some((s) => s.type === 'stun' || s.type === 'charm' || s.type === 'sleep' || s.type === 'root');
        if (hardCC) return use('cleanse');
      }
      if (u.disabled) return false;

      // 🪨 Phù Thạch Hóa: Né chiêu diện rộng không thể chạy kịp (Thiên Thạch Ignatius, Khai Thiên Gideon, đòn Boss)
      if (has('petrify_talisman')) {
        const bigTele = (m.zones || []).find((z) => z.telegraph && z.team !== u.team && dist(u, z) <= z.r && (z.life - (z.age || 0)) < 0.35 && z.r >= 3.5);
        if (bigTele) return use('petrify_talisman');
      }

      // ⚡ Tốc Biến:
      // Trường hợp 1: Đang đứng trong Vùng Cảnh Báo Đỏ (Telegraph) còn < 0.3s không đi bộ kịp
      if (has('flash')) {
        const tele = (m.zones || []).find((z) => z.telegraph && z.team !== u.team && dist(u, z) <= z.r && (z.life - (z.age || 0)) < 0.3);
        if (tele) {
          const v = M.dir(tele, u);
          return use('flash', null, { x: u.x + v.x * 4, y: u.y + v.y * 4 });
        }
        // Trường hợp 2: Trạng thái Retreat (Máu < 10%), địch áp sát < 3 đv và phía trước có vách đá/tường chắn
        if (fleeing && u.hpPct < 0.10 && near.some((e) => dist(e, u) < 3)) {
          const safe = ai.safeSpot ? ai.safeSpot() : { x: C.MAP / 2, y: C.MAP / 2 };
          const v = M.dir(u, safe);
          return use('flash', null, { x: u.x + v.x * 4, y: u.y + v.y * 4 });
        }
      }

      // 🌟 Bình Thuốc Rực Rỡ:
      // Công thức: U = (1.0 - HealthRatio)^2.0 * 2.0
      // Ngưỡng ép buộc: HealthRatio <= 0.15 và Hộ Giáp = 0 trong giao tranh -> U = 2.5
      if (has('radiant') && inCombat) {
        let uRad = Math.pow(1.0 - u.hpPct, 2.0) * 2.0;
        if (u.hpPct <= 0.15 && (!u.ga || u.ga <= 0)) uRad = 2.5;
        if (uRad >= 0.8) return use('radiant');
      }

      // 💨 Bom Khói Dập Lửa:
      // Dính Thiêu Đốt, Long Hỏa, Vết Thương Sâu, hoặc bị khóa từ xa
      if (has('smoke_bomb')) {
        const burning = u.statuses.some((s) => s.type === 'wound' || s.key === 'bag_ignite' || s.key === 'rox_fire');
        if (burning || (inCombat && u.hpPct < 0.35)) return use('smoke_bomb');
      }

      // 🛡 Lá Chắn & 💚 Hồi Máu: nhận sát thương làm máu < 25% trong giao tranh trực diện
      if (near.length && hit) {
        if (has('fu_ho') && u.hpPct < 0.45 && !u.hasKey('fu_ho')) return use('fu_ho');
        if (has('barrier') && u.hpPct < 0.25) return use('barrier');
        if (has('heal') && u.hpPct < 0.25) return use('heal');
      }

      // 🪞 Gương Ảo Ảnh Bỏ Túi: Vesper, Lyra hoặc máu < 25% cắt đuôi
      if (has('mirror_decoy') && fleeing && (u.hpPct < 0.25 || u.heroId === 'vesper' || u.heroId === 'lyra')) {
        return use('mirror_decoy');
      }

      // --- 2. NHÓM ĐÀO THOÁT & CHẠY BO ---
      // 👻 Tốc Hành & 🌪 Phù Thần Tốc:
      // Chạy bo cấp bách: ngoài bo, cách an toàn > 35 đv và dps bo >= 3.5%/s (bo 4+)
      const safe = ai.safeSpot ? ai.safeSpot() : { x: C.MAP / 2, y: C.MAP / 2 };
      const dSafe = dist(u, safe);
      const stormUrgent = m.zoneSt && m.zoneSt.dps >= 0.035 && !m.inZone(u, 0) && dSafe > 35;
      const slowedWhileFleeing = fleeing && u.statuses.some((s) => s.type === 'slow');
      if (stormUrgent || slowedWhileFleeing) {
        if (has('fu_tuc')) return use('fu_tuc');
        if (has('ghost')) return use('ghost');
      }

      // 📜 Phù Kháng Độc: ngoài bo đang mất máu
      if (has('fu_doc') && m.zoneSt.dps > 0 && !m.inZone(u, 0) && !u.hasKey('fu_doc') && (m.zoneSt.dps >= 0.025 || u.hpPct < 0.6)) return use('fu_doc');

      // 🌫 Phù Ẩn Thân: Cắt đuôi hoặc phục kích
      if (has('fu_an') && !u.has('stealth')) {
        if (fleeing && near.length && near.some((e) => dist(e, u) < 4)) return use('fu_an');
        if (u.bush >= 0 && !near.length && (u.persId === 'satthu' || u.heroId === 'death')) return use('fu_an');
      }

      // 🪝 Dây Móc:
      if (fleeing && near.length && near.some((e) => dist(e, u) < 4)) {
        if (has('hook')) {
          const v = M.dir(u, safe);
          const land = G.SkillAI.landing(u, v.x, v.y, 9, true);
          if (dist(land, u) > 4) return use('hook', null, land);
        }
        if (has('exhaust') && near[0]) return use('exhaust', near[0]);
      }

      // 🌀 Dịch Chuyển: ngoài giao tranh > 5s, không có địch trong 25 đv, cách tâm bo > 120 đv, bo sắp co
      if (has('tp') && !inCombat && !hit && m.zoneSt.dps > 0 && !m.inZone(u, -10)) {
        const noEnemies25 = !enemies.some((e) => dist(e, u) < 25);
        if (noEnemies25 && dSafe > 120 && (ai.act === 'zone' || ai.act === 'shop')) return use('tp');
      }

      // --- 3. NHÓM TẤN CÔNG & ĐẤU KHÔ MÁU ---
      // 📡 Cột Sóng Trinh Sát: Clint, Gideon, Alice khi chiếm đền/nhà hoặc chuẩn bị ăn bãi lớn/thính
      if (has('scout_tower')) {
        const isBuilder = u.heroId === 'clint' || u.heroId === 'gideon' || u.heroId === 'alice';
        const atObjective = ai.act === 'boss' || ai.act === 'drop' || (u.terr && u.terr.house);
        if ((isBuilder && atObjective) || (atObjective && !near.length)) return use('scout_tower');
      }

      // ❄ Bẫy Băng Cổ & 🪤 Bẫy Kẹp:
      if (has('ice_trap') || has('trap')) {
        const trapId = has('ice_trap') ? 'ice_trap' : 'trap';
        if (!(m.traps || []).some((t) => t.owner === u && dist(t, u) < 6)) {
          if (fleeing && near.some((e) => dist(e, u) < 6)) return use(trapId, null, { x: u.x, y: u.y });
          const nearChest = (m.chests || []).some((c) => !c.opened && dist(u, c) < 4);
          if (nearChest || (!near.length && (ai.act === 'hide' || ai.act === 'heal'))) {
            const v = M.dir(u, safe);
            return use(trapId, null, { x: u.x + v.x * 2.5, y: u.y + v.y * 2.5 });
          }
        }
      }

      // Đấu trực diện:
      if (ai.mode === 'fight' && tgt && tgt.kind === 'hero') {
        const d = dist(u, tgt);

        // 🧲 Lựu Đạn Xung Điện: Địch có Hộ Giáp dày >= 500 hoặc sắp đu dây móc
        if (has('emp_grenade') && d <= 7 && (tgt.ga >= 500 || tgt.heroId === 'borg' || tgt.heroId === 'valerius' || tgt.heroId === 'gideon')) {
          return use('emp_grenade', tgt, { x: tgt.x, y: tgt.y });
        }

        // 🩸 Dược Huyết Chiến: Tướng hổ báo khô máu cự ly gần (Borg, Kazuki...)
        if (has('blood_pot') && d <= 4 && (u.heroId === 'borg' || u.heroId === 'kazuki' || u.persId === 'hobao' || !u.ranged)) {
          return use('blood_pot');
        }

        // 🧪 Dầu Đạn Ăn Mòn: Súng/nỏ (Zero, Clint, Percy, Raven) kích hoạt trước khi dồn sát thương mục tiêu đầy giáp
        if (has('corrosive_oil') && d <= u.st.range + 1 && (u.ranged || tgt.ga > 200)) {
          return use('corrosive_oil');
        }

        // 🪶 Dây Móc Tiếp Tốc: Tướng cận chiến (Ryoma, Florian, Koda) áp sát kẻ thả diều
        if (has('grapple_dash') && !u.ranged && d > 3.5 && d <= 8.5) {
          return use('grapple_dash', tgt);
        }

        // Phép cũ:
        if (has('ignite') && d < 6 && tgt.hpPct < 0.35 && !tgt.hasKey('bag_ignite')) return use('ignite', tgt);
        if (has('smite') && d < 5 && tgt.hp < tgt.st.maxHp * 0.1 * 1.05) return use('smite', tgt);
        if (has('bomb') && d < 6 && d > 1.5 && (tgt.disabled || tgt.has('root') || tgt.has('slow'))) return use('bomb', tgt, { x: tgt.x, y: tgt.y });
        if (has('exhaust') && d < 4 && u.hpPct < tgt.hpPct && tgt.attackTarget === u) return use('exhaust', tgt);

        // Đuổi mồi sắp chết:
        if (tgt.hpPct < 0.2 && d > u.st.range + u.r + tgt.r + 1 && d < 8) {
          if (has('flash')) return use('flash', null, { x: tgt.x, y: tgt.y });
          if (has('fu_tuc')) return use('fu_tuc');
        }
      }

      // Tranh boss / quái lớn:
      if (has('smite')) {
        let mon = null;
        m.grid.query(u.x, u.y, 5.5, (v) => { if (!mon && v.kind === 'monster' && v.alive && (v.boss || v.big) && v.hp < 500 + 60 * u.level && v.hp / v.st.maxHp < 0.35) mon = v; });
        if (mon && (mon.boss || enemies.some((e) => dist(e, mon) < 9))) return use('smite', mon);
      }

      return false;
    },
  };
  G.BagMix = Bag; G.BagAI = BagAI; G.BAG_USE = USE;
})();
