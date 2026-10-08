'use strict';
// ===== Trang bị trong trận: túi đồ 6 ô, mua/bán ở Thương Nhân, hiệu ứng riêng, món kích hoạt, đèn soi =====
// Gắn vào Match.prototype. AI lên đồ: thứ tự mặc định theo kiểu tướng + đổi món theo đội hình địch (G.ItemAI).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, M = G.M, MAP = G.MAP;
  const SLOTS = 6;
  const HOOKS = ['onAuto', 'onDeal', 'afterDeal', 'onTake', 'afterTake', 'tick', 'onMonsterKill', 'onSmite', 'onAllyCare', 'onMinionDeathNear', 'onKill', 'onAssist'];

  // ---------------- AI lên đồ ----------------
  const BUILDS = {
    marksman: { boots: 'giay_cuong_chien', core: ['dao_pha_quan', 'cung_gio_loc', 'huyet_kiem', 'mui_khoan', 'song_dao'] },
    mage:     { boots: 'giay_khai_sang', core: ['ngoc_hien_triet', 'mu_hoa_than', 'truong_hu_vo', 'dong_ho_cat', 'mat_na'] },
    fighter:  { boots: 'giay_thep', core: ['riu_hac_thiet', 'xich_hon', 'song_dao', 'giap_gai', 'tim_cu_thach'] },
    fighterAp:{ boots: 'giay_thep', core: ['mat_na', 'gay_bang_gia', 'dong_ho_cat', 'giap_gai', 'tim_cu_thach'] },
    tank:     { boots: 'giay_thep', core: ['vuong_mien', 'giap_gai', 'ao_thanh_linh', 'tim_cu_thach', 'khien_bang'] },
    supMage:  { start: 'lenh_bai', boots: 'giay_khai_sang', core: ['kinh_cu_dem', 'ngoc_boi', 'lu_huong', 'thuy_tinh', 'mu_tran_hon'] },
    supTank:  { start: 'lenh_bai', boots: 'giay_thep', core: ['kinh_cu_dem', 'ngoc_boi', 'chuong_thuc_tinh', 'vuong_mien', 'ao_thanh_linh'] },
  };
  const tagsOf = (h) => (h.hero.tags || []);
  // hồ sơ đội địch, có trọng số theo vàng (tướng "béo" đáng sợ hơn)
  function profile(m, u) {
    const p = { phys: 0, magic: 0, heal: 0, crit: 0, cc: 0, tank: 0, stealth: 0, dive: 0, autos: 0, n: 0 };
    for (const e of m.heroes) {
      if (e.team === u.team) continue;
      const w = 1 + Math.min(1.5, (e.stats.goldEarned || 0) / 6000);
      const tg = tagsOf(e);
      if (e.hero.dmgType === 'magic') p.magic += w; else p.phys += w;
      if (tg.includes('heal')) p.heal += w;
      if (tg.includes('crit') || e.hero.kit === 'marksman') p.crit += w * (tg.includes('crit') ? 1 : 0.5);
      if (tg.includes('cc')) p.cc += w;
      if (e.hero.kit === 'tank' || tg.includes('tank')) p.tank += w;
      if (tg.includes('stealth')) p.stealth += w;
      if (tg.includes('dive')) p.dive += w;
      if (e.hero.kit === 'marksman' || tg.includes('autos')) p.autos += w;
      p.n += w;
    }
    p.magicShare = p.magic / Math.max(1, p.n);
    return p;
  }
  function swap(list, from, to) { const i = list.indexOf(from); if (i >= 0 && !list.includes(to)) list[i] = to; }
  function moveUp(list, id, pos) { const i = list.indexOf(id); if (i > pos) { list.splice(i, 1); list.splice(pos, 0, id); } }
  // giữ món độc nhất đã sở hữu (giày, đồ rừng): lên lại kế hoạch giữa trận không được đổi sang món không mua nổi
  function keepOwned(u, out) {
    const owned = u.items || [];
    const ownJ = owned.find((x) => G.ITEMS[x].jungle && !G.ITEMS[x].isComp), ownB = owned.find((x) => G.ITEMS[x].boots && !G.ITEMS[x].isComp);
    const fixed = out.map((x) => (ownJ && G.ITEMS[x] && G.ITEMS[x].jungle ? ownJ : ownB && G.ITEMS[x] && G.ITEMS[x].boots ? ownB : x));
    return fixed.filter((x, i) => x && G.ITEMS[x] && fixed.indexOf(x) === i);
  }
  const ItemAI = {
    archetype(u) {
      const d = u.hero, k = d.kit;
      if (k === 'marksman') return 'marksman';
      if (k === 'mage') return 'mage';
      if (k === 'tank') return 'tank';
      if (k === 'support') return 'mage';            // đấu trường đánh đơn: hỗ trợ lên đồ phép như pháp sư
      return d.dmgType === 'magic' ? 'fighterAp' : 'fighter';
    },
    // danh sách món hoàn chỉnh theo thứ tự mua (giày ở vị trí 2, đồ rừng/đồ khởi điểm đầu tiên)
    plan(m, u) {
      if (u.buildFixed && u.buildFixed.length) return keepOwned(u, u.buildFixed.slice());      // HLV soạn sẵn thứ tự lên đồ
      const own = u.buildPref || u.hero.build || {};   // GĐ9: lối build ưa thích chọn cho trận này
      const base = BUILDS[ItemAI.archetype(u)];
      const core = (own.core || base.core).slice();
      let boots = own.boots || base.boots;
      // GĐ9: Cầu Toàn — đúng thứ tự bộ sở trường, không đổi món theo đội hình địch / món xoay vòng
      if (u.pers && u.pers.strict && u.buildPref) { const o = []; if (own.start) o.push(own.start); o.push(core[0], boots); for (let i = 1; i < core.length; i++) o.push(core[i]); return keepOwned(u, o); }
      const p = profile(m, u), arch = ItemAI.archetype(u);
      // GĐ5c: món xoay vòng đang có trong cửa hàng thay món tương ứng trong lối lên đồ mặc định
      if (G.ROT_ITEMS) for (const id of G.ROT_ITEMS) { const it = G.ITEMS[id]; if (!it.alt || !G.itemOn(id) || !it.alt.arch.includes(arch)) continue; const i = core.indexOf(it.alt.for); if (i >= 0) core[i] = id; }
      // thích nghi với đội hình địch (HLV giỏi ở GĐ3+ sẽ chỉnh thêm)
      if (p.magicShare > 0.6 || (p.cc >= 3 && arch !== 'marksman')) { if (arch !== 'marksman' && arch !== 'mage') boots = 'giay_thuy_ngan'; }
      else if (p.magicShare < 0.35 && p.autos >= 2 && (arch === 'tank' || arch === 'fighter' || arch === 'supTank')) boots = 'giay_thep';
      if (arch === 'tank' || arch === 'fighter' || arch === 'fighterAp' || arch === 'supTank') {
        if (p.magicShare > 0.55) { swap(core, 'giap_gai', 'ao_hu_khong'); swap(core, 'khien_bang', 'mu_tran_hon'); }
        if (p.cc >= 3) swap(core, 'tim_cu_thach', 'mu_tran_hon');
        if (p.crit >= 2.5) swap(core, 'khien_bang', 'ao_bong_dem');
        if (p.heal >= 2) moveUp(core, 'giap_gai', 1);
      }
      if (arch === 'marksman') {
        if (p.heal >= 2) { core.splice(2, 0, 'dao_cat_gan'); core.pop(); }
        if (p.tank >= 2) moveUp(core, 'mui_khoan', 1);
        if (p.dive >= 2) moveUp(core, 'huyet_kiem', 1);
      }
      if (arch === 'mage') {
        if (p.heal >= 2) swap(core, 'mat_na', 'bua_tro_tan');
        if (p.tank >= 2 || p.magicShare < 0.4) moveUp(core, 'truong_hu_vo', 1);
        if (p.dive >= 2) moveUp(core, 'dong_ho_cat', 1);
      }
      if ((arch === 'supMage' || arch === 'supTank') && p.stealth >= 1) moveUp(core, 'kinh_cu_dem', 0);
      const out = [];
      if (base.start || own.start) out.push(own.start || base.start);
      out.push(core[0], boots);
      for (let i = 1; i < core.length; i++) out.push(core[i]);
      return keepOwned(u, out);
    },
  };

  const ItemMix = {
    initItems(u) {
      u.items = []; u.icd = {}; u.istate = {}; u.fxl = {}; u.itemGold = 0; u.buildPlan = null; u.shopT = 0;
      this.recalcItems(u);
    },
    // cộng dồn chỉ số + cờ hiệu ứng của trang bị (và nhánh tiến hóa) vào u.bonus; dựng lại danh sách hook
    recalcItems(u) {
      const bonus = {}, fxl = {}, seen = {};
      const add = (st) => { for (const k in st) bonus[k] = (bonus[k] || 0) + st[k]; };
      let gold = 0;
      for (const id of u.items) {
        const it = G.ITEMS[id]; if (!it) continue;
        gold += it.cost + (it.comp && G.ITEMS[it.comp] && !it.isComp ? 0 : 0);
        add(it.stats);
        if (seen[id]) continue;           // hiệu ứng riêng không cộng dồn
        seen[id] = true;
        add(it.flags || {});
        if (it.bonus) add(it.bonus(u));
        if (it.hooks) for (const h of HOOKS) if (it.hooks[h]) (fxl[h] || (fxl[h] = [])).push(it.hooks[h]);
      }
      // GĐ8: mảnh hồn đang gắn (chỉ số đã gộp sẵn ở syncSouls) + nội tại; trang bị Hoàng Kim (ngoài 6 ô)
      if (u.soulBonus) add(u.soulBonus);
      if (u.soulFx) for (const t of u.soulFx) for (const h in t) if (typeof t[h] === 'function') (fxl[h] || (fxl[h] = [])).push(t[h]);
      if (u.golden && G.GOLDEN) for (const id of u.golden) {
        const it = G.GOLDEN[id]; if (!it) continue;
        add(it.stats || {});
        if (it.hooks) for (const h in it.hooks) if (typeof it.hooks[h] === 'function') (fxl[h] || (fxl[h] = [])).push(it.hooks[h]);
      }
      if (u.tfx) {                         // nhánh tiến hóa (talents.js)
        for (const t of u.tfx) {
          if (t.stats) add(typeof t.stats === 'function' ? t.stats(u) : t.stats);
          for (const h in t) if (typeof t[h] === 'function' && h !== 'stats' && h !== 'init') (fxl[h] || (fxl[h] = [])).push(t[h]);
        }
      }
      u.bonus = bonus; u.fxl = fxl; u.itemGold = gold;
      const oldMax = u.st.maxHp || 0, oldMp = u.st.maxMp || 0, oldGa = u.st.maxGa || 0;
      u.calc();
      if (oldMax && u.st.maxHp > oldMax) u.hp += u.st.maxHp - oldMax;
      if (oldMp && u.st.maxMp > oldMp) u.mp += u.st.maxMp - oldMp;
      if (u.st.maxGa > oldGa) u.ga = Math.min(u.st.maxGa, (u.ga || 0) + u.st.maxGa - oldGa);   // GĐ8: Hộ Giáp tối đa tăng → được phần tăng thêm
    },
    // đứng cạnh một Thương Nhân (hoặc lúc xuất phát / đang chờ hồi sinh) thì mua bán được
    atShop(u) {
      if (!u.alive || this.time < 1) return true;
      return !!this.merchantNear(u);
    },
    merchantNear(u) {
      for (const t of MAP.merchants) { const dx = u.x - t.x, dy = u.y - t.y; if (dx * dx + dy * dy <= C.SHOP_R * C.SHOP_R) return t; }
      return null;
    },
    hasBoots(u) { return u.items.some((id) => G.ITEMS[id].boots); },
    // món id có thể mua về mặt luật (bỏ qua vàng/vị trí): không trùng món độc nhất đang có
    allowed(u, id) {
      const it = G.ITEMS[id]; if (!it || u.items.includes(id)) return false;
      if (it.boots && !it.isComp && u.items.some((x) => G.ITEMS[x].boots && !G.ITEMS[x].isComp)) return false;
      if (it.jungle && !it.isComp && u.items.some((x) => G.ITEMS[x].jungle && !G.ITEMS[x].isComp)) return false;
      return true;
    },
    // giá thực trả cho món id (trừ phôi đang có)
    priceOf(u, id) {
      const it = G.ITEMS[id];
      return it.comp && u.items.includes(it.comp) ? it.cost - G.ITEMS[it.comp].cost : it.cost;
    },
    canBuy(u, id) {
      const it = G.ITEMS[id]; if (!it || !this.atShop(u)) return false;
      if (u.items.includes(id) && (it.boots || it.jungle || it.starter || it.isComp)) return false;
      if (it.boots && !it.isComp && this.hasBoots(u) && !u.items.includes(it.comp)) return false;
      if (it.isComp && it.boots && this.hasBoots(u)) return false;
      if (it.jungle && u.items.some((x) => G.ITEMS[x].jungle && !(it.comp && x === it.comp))) return false;
      if (u.gold + 1e-6 < this.priceOf(u, id)) return false;
      const upgrades = it.comp && u.items.includes(it.comp);
      return upgrades || u.items.length < SLOTS;
    },
    buy(u, id) {
      if (!this.canBuy(u, id)) return false;
      const it = G.ITEMS[id], price = this.priceOf(u, id);
      u.gold -= price;
      const ci = it.comp ? u.items.indexOf(it.comp) : -1;
      if (ci >= 0) u.items[ci] = id; else u.items.push(id);
      this.recalcItems(u);
      this.addFeedItem && this.addFeedItem(u, id);
      if (this.fxOn) this.fx({ type: 'buy', id: u.id, item: id });
      return true;
    },
    sell(u, idx) {
      const id = u.items[idx]; if (!id || !this.atShop(u)) return false;
      u.items.splice(idx, 1); u.gold += G.ITEMS[id].cost * 0.5;
      this.recalcItems(u); return true;
    },
    // AI tự mua theo kế hoạch: món kế tiếp chưa có → đủ tiền thì mua trọn, không thì mua phôi; thừa ô thì bán đồ khởi điểm
    shopAI(u) {
      if (this.buyPotions) this.buyPotions(u);
      // GĐ7: đúc ý niệm — tướng tích trữ (Thực Dụng) đúc trước tiên, người khác chỉ đúc khi dư nhiều vàng
      if (this.forgeYNiem) { const hoard = u.persId === 'thucdung'; for (let g = 0; g < 5 && this.forgeYNiem(u, hoard ? 0 : 900); g++); }
      if (!u.buildPlan || this.time - (u.planT || 0) > 180) { u.buildPlan = ItemAI.plan(this, u); u.planT = this.time; }
      for (let guard = 0; guard < 8; guard++) {
        const next = u.buildPlan.find((id) => this.allowed(u, id));
        if (!next) return;
        const it = G.ITEMS[next];
        if (u.items.length >= SLOTS && !(it.comp && u.items.includes(it.comp))) {
          const si = u.items.findIndex((x) => G.ITEMS[x].starter);
          if (si >= 0 && u.items.length >= SLOTS) { this.sell(u, si); continue; }
          return;
        }
        if (this.buy(u, next)) continue;
        if (it.comp && !u.items.includes(it.comp) && this.buy(u, it.comp)) continue;
        // chưa đủ tiền món kế: mua tạm Giày Vải nếu kế hoạch có giày
        if (!this.hasBoots(u)) { const b = u.buildPlan.find((x) => G.ITEMS[x].boots); if (b && this.buy(u, G.ITEMS[b].comp || b)) continue; }
        return;
      }
    },
    // số vàng cần cho lần mua kế tiếp (AI dùng để quyết định biến về)
    nextBuyCost(u) {
      if (!u.buildPlan) u.buildPlan = ItemAI.plan(this, u);
      const next = u.buildPlan.find((id) => this.allowed(u, id));
      if (!next) return 0;
      if (u.items.length >= SLOTS && !(G.ITEMS[next].comp && u.items.includes(G.ITEMS[next].comp)) && !u.items.some((x) => G.ITEMS[x].starter)) return 0;
      const it = G.ITEMS[next];
      const full = it.comp && u.items.includes(it.comp) ? it.cost - G.ITEMS[it.comp].cost : it.cost;
      const comp = it.comp && !u.items.includes(it.comp) ? G.ITEMS[it.comp].cost : full;
      return { full, comp };
    },
    // ---------- món kích hoạt ----------
    canItem(u, id) {
      const it = G.ITEMS[id];
      if (!it || !it.active || !u.alive || !u.items.includes(id)) return false;
      if ((u.icd['a_' + id] || 0) > this.time) return false;
      if (u.disabled && !it.active.react) return false;
      return true;
    },
    castItem(u, id, o) {
      if (!this.canItem(u, id)) return false;
      const it = G.ITEMS[id];
      if (!this.hook(it.active.use, this, u, o || {})) return false;
      u.icd['a_' + id] = this.time + it.active.cd * (1 - Math.min(0.4, u.st.cdr) * 0.5);
      this.lastUse = { kind: 'item', id, by: u, t: this.time };
      if (this.fxOn) this.fx({ type: 'item', id: u.id, item: id });
      return true;
    },
    // ---------- hiệu ứng theo thời gian ----------
    updateItems(u) {
      const l = u.fxl.tick;
      if (l) for (const fn of l) this.hook(fn, this, u);
    },
    // ---------- đèn soi (Kính Cú Đêm) ----------
    placeWard(u, x, y, life, cap) {
      const p = { x, y }; MAP.pushOut(p, 0.3);
      const mine = this.wards.filter((w) => w.owner === u && w.until > this.time);
      if (mine.length >= (cap || 2)) mine[0].until = 0;
      this.wards.push({ team: u.team, owner: u, x: p.x, y: p.y, until: this.time + life, id: this.nextId++ });
      this.wards = this.wards.filter((w) => w.until > this.time);
      if (this.fxOn) this.fx({ type: 'ward', x: p.x, y: p.y, team: u.team });
    },
  };
  G.ItemMix = ItemMix;
  G.ItemAI = ItemAI; G.ITEM_BUILDS = BUILDS;
  G.ITEM_SLOTS = SLOTS;
})();
