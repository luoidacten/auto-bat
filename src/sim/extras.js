'use strict';
// ===== BÌNH MÁU / MANA, MẢNH HỒN, CỔNG QUYẾT ĐẤU (GĐ6b) =====
// Gắn vào Match.prototype.
//   • Tướng KHÔNG tự hồi máu. Hồi máu bằng bình (mua ở Thương Nhân, mang tối đa vài bình), chiêu, hút máu, thính.
//     Uống bình mất thời gian (niệm, đi chậm, không đánh/không dùng chiêu được; bị khống chế thì hỏng lần uống),
//     xong thì hồi dần trong vài giây (bị đánh vẫn hồi tiếp).
//   • GĐ7 — Ý NIỆM: cấp của vũ khí (Thường → Trắng → Xanh → Tím → Vàng → Đỏ). Mỗi cấp +% sát thương; vũ khí ĐỔI MÀU theo cấp.
//     Có từ: đúc ở Thương Nhân (tốn vàng, mỗi lần +1 cấp), boss (+1), thắng quyết đấu (+1), thính (lên ít nhất Vàng, cuối trận có Đỏ).
//     Ý niệm là của vũ khí — chết KHÔNG mất.
//   • Mảnh hồn: 5 bậc Trắng / Xanh / Tím / Vàng / Đỏ, mỗi mảnh một LOẠI chỉ số (Sức Mạnh, Sinh Lực, Tốc Độ, Hồi Chiêu, Hút Máu,
//     Hộ Thể, Tốc Đánh, Kiên Định), mạnh theo bậc; tối đa 6 mảnh. Rơi từ quái (ít), boss (Tím), quyết đấu (Tím), thính (Vàng/Đỏ).
//     GĐ6d: TƯỚNG BỊ HẠ LÀM RƠI TOÀN BỘ MẢNH HỒN của mình xuống đất (văng quanh xác) — ai chạm vào trước thì nhặt được
//     (kẻ hạ gục, kền kền, người qua đường…). Mảnh hồn trên đất tồn tại 120s.
//   • Cổng quyết đấu: thỉnh thoảng mở ở một chỗ trong bo. Tướng đứng cạnh cổng đủ lâu thì ghi danh; người thứ hai ghi danh
//     → cả hai bị kéo vào vòng quyết đấu: người ngoài không vào được, không ai đánh được ai qua vòng, bo không đốt,
//     đánh tới khi một người gục. Người thắng nhận thưởng lớn. Quá lâu thì vòng siết lại (đốt cả hai).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, MAP = G.MAP, M = G.M;
  const { dist } = M;
  // ===== GĐ8: MẢNH HỒN theo 9 chỉ số cốt lõi (cơ sở dữ liệu: src/data/shards.js) =====
  // Mỗi mảnh là một mảnh có tên (id) với chỉ số cố định + có thể kèm nội tại; mang tối đa C.SOUL.carry mảnh, nhưng chỉ GẮN được
  // số mảnh = cấp Ý Niệm, và mảnh bậc K cần Ý Niệm ≥ K — AI tự gắn những mảnh tốt nhất, còn lại cất trong túi hồn.
  // Đặc năng GĐ7b (Trợ Năng, Uống Máu, Cẩn Thận, Lưu Vân, Vận Mệnh, Cơ Mệnh, Thiên Mệnh, Tuyệt Kỹ Nộ, Cửa Hàng Online) là mảnh có `perk`.
  const SOUL_PERK = {
    tro_nang:    { tier: 3, name: 'Trợ Năng', icon: '🌿', desc: 'Bình máu / mana hồi thêm 50% lượng hồi trong 5s sau khi uống.' },
    uong_mau:    { tier: 3, name: 'Uống Máu', icon: '🧛', desc: 'Hạ gục một tướng: hồi 80% máu tối đa.' },
    can_than:    { tier: 3, name: 'Cẩn Thận', icon: '🫙', desc: 'Uống bình không bị ngắt khi trúng đòn.' },
    luu_van:     { tier: 4, name: 'Lưu Vân', icon: '☁', desc: 'Lướt ngắn 4 đv rồi tăng 40% tốc chạy trong 2s (hồi 10s).' },
    van_menh:    { tier: 4, name: 'Vận Mệnh', icon: '🔮', desc: 'Gục lần tới thì hồi sinh ngay tại chỗ với 40% máu — mảnh hồn này vỡ.' },
    co_menh:     { tier: 4, name: 'Cơ Mệnh', icon: '⚡', desc: 'Hạ gục một tướng: mọi chiêu hồi ngay lập tức.' },
    thien_menh:  { tier: 5, name: 'Thiên Mệnh', icon: '🌅', desc: 'Gục thì hồi sinh tại chỗ với 50% máu và BẤT TỬ 90s (không thể chết); hồi 400s.' },
    tuyet_ky_no: { tier: 5, name: 'Tuyệt Kỹ Nộ', icon: '💢', desc: 'Chiêu cuối gây ×2 sát thương trong 3.5s sau khi dùng (hồi 60s).' },
    cua_hang:    { tier: 5, name: 'Cửa Hàng Online', icon: '🛍', desc: 'Mua đồ, bình, nâng balo, đúc ý niệm ở bất cứ đâu (không cần tới Thương Nhân).' },
  };
  // mức xuyên thủng danh nghĩa của mảnh (AI dùng để chọn mục tiêu giáp dày / để biết đối thủ đáng sợ)
  const PEN_LV = { WP1: 0.2, WP2: 0.25, BP1: 0.35, BP2: 0.5, BP3: 0.4, PP1: 0.5, PP2: 0.7, PP3: 0.65, GP1: 0.75, GP2: 0.9, GP3: 0.8, RP1: 0.85, RP2: 1, KIEM_Y: 1 };
  const YNIEM_NAME = ['Thường', 'Trắng', 'Xanh', 'Tím', 'Vàng', 'Đỏ', 'Rực Rỡ'];
  const SOUL_TIER = G.SOUL_TIER;

  const IT_SIZE = { hp_s: 's', hp_m: 'm', hp_l: 'l', mp_s: 's', mp_m: 'm', mp_l: 'l', ga_s: 's', ga_m: 'm', ga_l: 'l' };
  const POT_COLOR = { hp: '#ff5a7a', mp: '#5aa0ff', ga: '#bfe8ff' };
  const Extras = {
    // ---------- bình máu / mana / Hộ Vệ ----------
    initPotions(u) {
      this.initBag(u);   // GĐ7: bình nằm trong balo (src/sim/bag.js)
      u.souls = []; u.soulTier = 0; u.soulSeq = 0; u.yNiem = 0; u.perks = new Set(); u.perkCd = {}; u.scd = {}; u.soulBonus = {}; u.soulFx = []; u.penLv = 0;
      if (!u.golden) u.golden = [];
      this.setYNiem(u, C.YNIEM.start, 'khởi đầu', true);
    },
    // ---------- ý niệm (cấp vũ khí) ----------
    // tier 1–6; số ô gắn mảnh hồn = tier; tier 6 (Rực Rỡ / Hoàng Kim): +30% hiệu lực mảnh hồn, mở cây tiến hóa cấp 15 / 18
    setYNiem(u, tier, from, quiet) {
      tier = Math.max(0, Math.min(6, tier | 0));
      if (!u || tier <= (u.yNiem || 0)) return false;
      u.yNiem = tier;
      u.statuses = u.statuses.filter((st) => st.key !== 'y_niem');
      this.addStatus(u, 'buff', 1e6, 1, { key: 'y_niem', mods: { dmgAmp: C.YNIEM.dmg * tier }, persist: true });
      u.dirty = true;
      this.syncSouls(u);
      if (tier >= 6 && this.unlockTree) this.unlockTree(u);
      if (!quiet && tier >= 3) this.addFeed({ type: 'yniem', hero: u, tier, from });
      if (!quiet && this.fxOn) this.fx({ type: 'ring', x: u.x, y: u.y, r: 2.6, color: SOUL_TIER[tier].color });
      return true;
    },
    // đúc ý niệm ở Thương Nhân: mỗi lần +1 cấp (tối đa Đỏ), tốn C.YNIEM.forge[cấp hiện tại] vàng (giữ lại reserve vàng)
    forgeYNiem(u, reserve) {
      const cur = u.yNiem || 0; if (cur >= 5) return false;
      const cost = C.YNIEM.forge[cur]; if (u.gold < cost + (reserve || 0)) return false;
      u.gold -= cost; u.stats.forged = (u.stats.forged || 0) + 1;
      return this.setYNiem(u, cur + 1, 'đúc');
    },
    // kind = 'hp' / 'mp' / 'ga'; uống xong mới hồi (hồi ngay một lần); trúng đòn là hỏng lần uống (trừ mảnh hồn "Cẩn Thận")
    canDrink(u, kind) {
      if (!(u.alive && u.bag && this.potCount(u, kind) > 0 && !u.cast && !u.dash && !u.disabled)) return false;
      if (kind === 'ga' && !(u.ga < u.st.maxGa - 1)) return false;
      return true;
    },
    // chọn cỡ bình: vừa đủ bù phần đang thiếu; vội (đối thủ gần) thì ưu tiên bình nhỏ uống nhanh
    pickPot(u, kind, hurry) {
      const miss = kind === 'hp' ? 1 - u.hpPct : kind === 'ga' ? (u.st.maxGa > 0 ? 1 - u.ga / u.st.maxGa : 0) : u.st.maxMp > 0 ? 1 - u.mp / u.st.maxMp : 0;
      let best = null, bs = -Infinity;
      for (const id of G.POT_IDS[kind]) {
        if (!this.bagCount(u, id)) continue;
        const P = C.POTION[id], waste = Math.max(0, P.amt - miss), short = Math.max(0, miss - P.amt);
        const s = -waste * 1.2 - short * 0.8 - (hurry ? P.drink * 0.25 : 0);
        if (s > bs) { bs = s; best = id; }
      }
      return best;
    },
    drink(u, kind, hurry) {
      if (!this.canDrink(u, kind)) return false;
      const id = this.pickPot(u, kind, hurry); if (!id) return false;
      const P = C.POTION[id], T = P.drink * (1 - Math.min(0.5, u.bonus.drinkSpd || 0));   // GĐ8: mảnh hồn uống nhanh
      u.windup = null; u.attackTarget = null;
      u.cast = { key: 'potion', kind, id, t: T, total: T, move: C.POTION.move, size: IT_SIZE[id],
        fire: (m, h) => {
          if (!h.alive || !m.bagTake(h, id)) return;
          h.stats.pots = (h.stats.pots || 0) + 1;
          if (kind === 'hp') m.heal(h, h, h.st.maxHp * P.amt);
          else if (kind === 'ga') h.ga = Math.min(h.st.maxGa, h.ga + h.st.maxGa * P.amt);
          else h.mp = Math.min(h.st.maxMp, h.mp + h.st.maxMp * P.amt);
          // mảnh hồn Tím "Trợ Năng": hồi thêm theo thời gian
          if (kind !== 'ga' && h.perks && h.perks.has('tro_nang')) { const R = C.POTION.regen, amt = (kind === 'hp' ? h.st.maxHp : h.st.maxMp) * P.amt * R.k; m.addStatus(h, kind === 'hp' ? 'regen' : 'mregen', R.over, amt / R.over, { key: 'pot_' + kind }); }
          m.heroHook(h, 'onDrink', kind);
          if (m.fxOn) { m.fx({ type: 'ring', x: h.x, y: h.y, r: 1.4 + 0.4 * 'sml'.indexOf(IT_SIZE[id]), color: POT_COLOR[kind] }); }
        } };
      if (this.fxOn) this.fx({ type: 'sfx', name: 'energy_charge2' });
      return true;
    },
    // mua bình + vật phẩm balo khi đứng cạnh Thương Nhân (gọi trước khi mua đồ) — xem bag.js → buyBag
    buyPotions(u) { this.buyBag(u); },
    // ---------- mảnh hồn ----------
    // bậc đồ rơi theo may mắn: mỗi bậc có cơ hội nâng lên (may mắn 45% → ~27% lên 1 bậc), tối đa max
    rollTier(base, loot, max) {
      let t = base; const p = Math.min(0.6, (loot || 0) * 0.6);
      while (t < (max || 5) && this.rng.next() < (t === base ? p : p * 0.5)) t++;
      return t;
    },
    // tạo một mảnh hồn: id cho trước (mảnh độc quyền của boss…) hoặc rút ngẫu nhiên một mảnh trong bậc tier (tất định theo this.rng)
    // GĐ9: mảnh không hợp tướng (nạp đạn cho tướng không dùng súng, tầm bắn cho cận chiến…) khó ra hơn (×0.3)
    makeShard(tier, id, u) {
      if (id && G.SHARDS[id]) return { id, tier: G.SHARDS[id].t };
      tier = Math.max(1, Math.min(5, tier | 0));
      const L = G.SHARD_BY_TIER[tier];
      if (!u || !u.hero) return { id: L[this.rng.int(0, L.length - 1)], tier };
      const fit = (sid) => { const d = G.SHARDS[sid]; return (d.gun && !u.hero.gun) || (d.only === 'ranged' && !u.hero.ranged) || (d.only === 'melee' && u.hero.ranged) ? 0.3 : 1; };
      let tot = 0; for (const sid of L) tot += fit(sid);
      let x = this.rng.next() * tot;
      for (const sid of L) { x -= fit(sid); if (x <= 0) return { id: sid, tier }; }
      return { id: L[L.length - 1], tier };
    },
    // GĐ9: một mảnh Hoàng Kim / Rực Rỡ ngẫu nhiên hợp tướng (thưởng Quái Thú Hoàng Kim / Kiếm Sư Vĩ Đại)
    radiantShard(u) {
      const L = G.SHARD_LIST.filter((d) => d.t === 6 && d.rad && !(d.gun && !(u.hero && u.hero.gun)) && !(d.only === 'ranged' && !u.hero.ranged) && !(d.only === 'melee' && u.hero.ranged) && !(u.souls || []).some((x) => x.id === d.id));
      return L.length ? L[this.rng.int(0, L.length - 1)].id : null;
    },
    // nhận mảnh hồn: sh = mảnh có sẵn (nhặt lại nguyên vẹn) hoặc tạo mới theo bậc / id
    giveSoul(u, tier, from, id, sh) {
      if (!u || !u.alive || tier < 1) return false;
      const list = u.souls || (u.souls = []);
      if (sh && sh.id && G.SHARDS[sh.id]) tier = sh.tier;
      // GĐ9: không còn xóa âm thầm — mảnh mới vào túi, syncSouls chọn bộ gắn; mảnh bị thay (hoặc chính mảnh mới nếu kém hơn) văng ra đất
      const shard = sh && sh.id && G.SHARDS[sh.id] ? { id: sh.id, tier: sh.tier } : this.makeShard(tier, id, u);
      shard.key = 'soul_' + (u.soulSeq = (u.soulSeq || 0) + 1); shard.from = from;
      list.push(shard);
      this.syncSouls(u);
      if (!list.includes(shard)) return true;   // kém hơn mọi mảnh đang có → văng ngay ra đất (người khác có thể nhặt)
      const D = G.SHARDS[shard.id];
      if (shard.tier >= 3) this.addFeed({ type: 'soul', hero: u, tier: shard.tier, from, shard: shard.id, perk: D.perk || null, on: shard.on });
      if (this.fxOn) this.fx({ type: 'ring', x: u.x, y: u.y, r: 2.2, color: SOUL_TIER[shard.tier].color });
      return true;
    },
    // gắn mảnh: chọn tối đa (cấp Ý Niệm) mảnh có bậc ≤ Ý Niệm, ưu tiên bậc cao + hợp kiểu sát thương của tướng;
    // cộng chỉ số vào u.soulBonus, nội tại vào u.soulFx (lõi trận gộp vào u.bonus / u.fxl ở recalcItems)
    // GĐ9: điểm một mảnh với tướng này (bậc + hợp kiểu sát thương / súng / tầm + mảnh yêu thích / hợp lối build)
    shardScore(u, sh) {
      const magic = u.hero && u.hero.dmgType === 'magic';
      const favs = (G.favShards && u.heroId) ? G.favShards(u.heroId) : [], bst = u.buildPref && u.buildPref.st, strict = !!(u.pers && u.pers.strict);
      return ((sh) => {
        const d = G.SHARDS[sh.id]; let s = SOUL_TIER[sh.tier].pow + (d.p || d.perk ? 0.25 : 0);
        if (d.st.phys && magic && !d.st.mag && !d.st.magAmp) s *= 0.7; else if ((d.st.mag || d.st.magAmp) && !magic && !d.st.phys) s *= 0.7;
        // GĐ9: mảnh nạp đạn chỉ hợp tướng súng; mảnh tầm đánh chỉ hợp vũ khí tầm xa / cận chiến tương ứng
        if (d.gun && !(u.hero && u.hero.gun)) s *= 0.3;
        // GĐ9: mảnh hồn yêu thích của tướng / hợp lối build đang theo
        //   Cầu Toàn: mảnh yêu thích / hợp build được ưu tiên tuyệt đối, mảnh lạc bộ bị chê
        if (favs.includes(sh.id)) s += strict ? 2.5 : 0.6;
        else if (bst && Object.keys(d.st).some((k) => bst.includes(k))) s += strict ? 0.9 : 0.3;
        else if (strict) s *= 0.6;
        if (d.only === 'ranged' && !(u.hero && u.hero.ranged)) s *= 0.4; else if (d.only === 'melee' && u.hero && u.hero.ranged) s *= 0.4;
        return s;
      })(sh);
    },
    // GĐ9: bộ mảnh giữ lại — gắn tối đa (cấp Ý Niệm) mảnh dùng được (bậc ≤ Ý Niệm) điểm cao nhất; mảnh bậc cao hơn Ý Niệm thì cất
    // trong túi chờ đúc vũ khí (tối đa C.SOUL.carry mảnh tổng cộng). Mảnh dùng được mà không có ô → văng ra (bị thay).
    soulPlan(u, list) {
      const cap = Math.min(6, u.yNiem || 0), sc = new Map(list.map((sh) => [sh, this.shardScore(u, sh)]));
      const ord = (a, b) => sc.get(b) - sc.get(a) || ((a.key || '') < (b.key || '') ? -1 : 1);
      const act = new Set(list.filter((sh) => sh.tier <= cap).sort(ord).slice(0, cap));
      const wait = list.filter((sh) => sh.tier > cap).sort((a, b) => b.tier - a.tier || ord(a, b)).slice(0, Math.max(0, C.SOUL.carry - act.size));
      return { act, keep: new Set([...act, ...wait]) };
    },
    // muốn nhặt mảnh này không (nhặt vào thì được gắn hoặc cất)
    soulWant(u, sh) {
      if (u.pers && u.pers.trader && (u.stock || []).length < 4) return true;   // GĐ9: Thương Nhân / Kẻ Bịp Bợm nhặt hết để làm hàng
      const L = (u.souls || []).concat([sh]); return this.soulPlan(u, L).keep.has(sh);
    },
    // văng một mảnh ra đất cạnh tướng (bị thay / không chỗ) — chính tướng đó không nhặt lại
    ejectSoul(u, sl, by) {
      if (!this.soulOrbs) this.soulOrbs = [];
      const a = ((u.id * 2.3 + (u.soulSeq || 0) * 1.1) % (Math.PI * 2)), p = { x: u.x + M.cos(a) * 2.2, y: u.y + M.sin(a) * 2.2 }; MAP.pushOut(p, 0.4);
      this.soulOrbs.push({ id: ++this.orbN, tier: sl.tier, type: sl.id, sh: { id: sl.id, tier: sl.tier }, x: p.x, y: p.y, ox: u.x, oy: u.y, from: u, ej: true, t0: this.time, until: this.time + C.SOUL.orbLife });
      if (this.stats) this.stats.soulsEjected = (this.stats.soulsEjected || 0) + 1;
      if (sl.tier >= 3 || (by && by.tier >= 3)) this.addFeed({ type: 'soul_eject', hero: u, shard: sl.id, tier: sl.tier, by: by ? by.id : null });
      if (this.fxOn) this.fx({ type: 'ring', x: p.x, y: p.y, r: 1.4, color: SOUL_TIER[sl.tier].color });
    },
    syncSouls(u) {
      let list = u.souls || [];
      const cap = Math.min(6, u.yNiem || 0);
      const plan = this.soulPlan(u, list), act = plan.act;
      // GĐ9: mảnh không giữ được văng ra đất (đang sống) — "đổi mảnh hồn mới thì mảnh hiện tại văng ra"
      if (list.length > plan.keep.size) {
        const out = list.filter((sh) => !plan.keep.has(sh)), nw = list[list.length - 1];
        list = u.souls = list.filter((sh) => plan.keep.has(sh));
        if (u.alive) for (const sl of out) {
          // Thương Nhân / Kẻ Bịp Bợm: mảnh thừa cất vào kho hàng (tối đa 4) để bán
          if (u.pers && u.pers.trader && (u.stock || (u.stock = [])).length < 4) { u.stock.push(sl); sl.on = false; continue; }
          this.ejectSoul(u, sl, sl !== nw && plan.keep.has(nw) ? nw : null);
        }
      }
      const res = (u.yNiem || 0) >= 6 ? 1 + C.YNIEM.resonance : 1;   // Cộng Hưởng Ý Niệm (Rực Rỡ / Hoàng Kim)
      const B = {}, fx = []; let top = 0, pen = 0; const perks = new Set(), shOn = new Set();
      for (const sh of list) {
        sh.on = act.has(sh);
        if (!sh.on) continue;
        const d = G.SHARDS[sh.id];
        for (const k in d.st) { const bk = G.SHARD_BONUS_KEY[k]; if (bk) B[bk] = (B[bk] || 0) + d.st[k] * (G.SHARD_FLAG[k] ? 1 : res); }
        shOn.add(sh.id);
        if (d.p) fx.push(d.p);
        if (d.perk) perks.add(d.perk);
        top = Math.max(top, sh.tier); pen = Math.max(pen, PEN_LV[sh.id] || 0);
      }
      if (B.antiByp > 1) B.antiByp = 1;
      u.soulBonus = B; u.soulFx = fx; u.soulTier = top; u.penLv = pen; u.perks = perks; u.shOn = shOn;   // GĐ9: u.shOn — mã các mảnh đang gắn (AI / lõi trận đọc)
      if (!u.perkCd) u.perkCd = {};
      if (this.recalcItems && u.items) this.recalcItems(u);
      u.dirty = true;
    },
    // mảnh hồn vỡ (Vận Mệnh)
    breakSoul(u, sh) {
      u.souls = (u.souls || []).filter((x) => x !== sh);
      this.syncSouls(u);
    },
    hasPerk(u, k) { return !!(u.perks && u.perks.has(k)); },
    perkReady(u, k) { return this.hasPerk(u, k) && this.time >= ((u.perkCd && u.perkCd[k]) || 0); },
    // rơi mảnh hồn từ quái thường (ít; may mắn tăng cơ hội và bậc)
    campSoul(h, type) {
      const S = C.SOUL, loot = h.st.loot || 0;
      const p = (type === 'small' ? S.campSmall : S.campBig) * (1 + loot);
      if (this.rng.next() < p) this.giveSoul(h, this.rollTier(this.rng.next() < (type === 'small' ? 0.15 : 0.35) ? 2 : 1, loot, 4), 'quái');
    },
    // ---------- mảnh hồn rơi khi bị hạ ----------
    // văng các mảnh ra quanh xác theo vòng (không dùng ngẫu nhiên → tất định), nhặt được sau 2s
    dropSouls(u, killer) {
      const list = (u.souls || []).concat(u.stock || []); u.stock = [];   // GĐ9: kho hàng của Thương Nhân cũng rơi
      if (!this.soulOrbs) this.soulOrbs = [];
      if (!list.length) return 0;
      const n = list.length, a0 = (u.id * 1.7) % (Math.PI * 2);
      list.forEach((sl, i) => {
        const a = a0 + i / n * Math.PI * 2, r = C.SOUL.orbSpread * (0.7 + 0.3 * (i % 2));   // văng xa xác → kền kền có cơ hội tranh
        const p = { x: u.x + M.cos(a) * r, y: u.y + M.sin(a) * r }; MAP.pushOut(p, 0.4);
        this.soulOrbs.push({ id: ++this.orbN, tier: sl.tier, type: sl.id, sh: { id: sl.id, tier: sl.tier }, x: p.x, y: p.y, ox: u.x, oy: u.y, from: u, t0: this.time, until: this.time + C.SOUL.orbLife });
      });
      u.souls = []; this.syncSouls(u);
      if (this.stats) this.stats.soulsDropped = (this.stats.soulsDropped || 0) + n;
      this.addFeed({ type: 'soul_drop', hero: u, killer, n, best: list.reduce((a, sl) => Math.max(a, sl.tier), 0) });
      return n;
    },
    // nhặt: tướng còn sống chạm vào (1.3 đv) — gần nhất nhặt trước; chỉ nhặt khi mảnh đó được gắn / cất (soulWant);
    // mảnh tự văng ra thì chính người văng không nhặt lại
    updateSoulOrbs() {
      const O = this.soulOrbs; if (!O || !O.length || this.tick % 2) return;
      for (let i = O.length - 1; i >= 0; i--) {
        const o = O[i];
        if (this.time >= o.until) { O.splice(i, 1); continue; }
        if (this.time - o.t0 < C.SOUL.orbDelay) continue;
        let best = null, bd = C.SOUL.orbR;
        for (const h of this.heroes) {
          if (!h.alive || (o.ej && o.from === h)) continue;
          const d = dist(h, o); if (d > bd) continue;
          if (!this.soulWant(h, o.sh)) continue;
          bd = d; best = h;
        }
        if (!best) continue;
        if (this.giveSoul(best, o.tier, 'nhặt của ' + (o.from.player && o.from.player.name ? o.from.player.name : o.from.hero.name), o.type, o.sh)) {
          best.stats.soulsLooted = (best.stats.soulsLooted || 0) + 1;
          if (this.fxOn) this.fx({ type: 'soulpick', x: o.x, y: o.y, id: best.id, tier: o.tier, soulType: o.type });
          O.splice(i, 1);
        }
      }
    },
    // còn chỗ cho mảnh bậc tier không (chưa đầy, hoặc có mảnh bậc thấp hơn để thay)
    soulRoom(h, tier, id) {
      if (id && G.SHARDS[id]) return this.soulWant(h, { id, tier });
      const L = h.souls || []; return L.length < C.SOUL.carry || L.some((sl) => sl.tier < tier);
    },
    setupDuel() { this.duelSt = { gate: null, nextAt: C.DUEL.first, n: 0, history: [] }; this.soulOrbs = []; this.orbN = 0; },
    isDuelist(u) { const g = this.duelSt && this.duelSt.gate; if (!g || g.state !== 'fight' || !u) return false; const h = u.owner && u.kind !== 'hero' ? u.owner : u; return h === g.a || h === g.b; },
    duelActive() { const g = this.duelSt && this.duelSt.gate; return !!(g && g.state === 'fight'); },
    // chặn sát thương qua vòng quyết đấu (người trong ↔ người ngoài, bo / quái ↔ người trong)
    duelBlocks(owner, tgt) {
      if (!this.duelActive()) return false;
      const inT = this.isDuelist(tgt);
      if (!owner) return inT;
      return inT !== this.isDuelist(owner);
    },
    updateDuel() {
      const D = this.duelSt, P = C.DUEL, t = this.time;
      if (!D) return;
      let g = D.gate;
      if (!g) {
        if (t < D.nextAt || this.aliveCount() < 3) return;
        // chỗ mở cổng: trong vòng bo kế tiếp, giữa hai tướng (không sát ai — tránh đứng sẵn) để có người tới được
        const s = this.safeCircle();
        let best = null, bs = -Infinity;
        for (let k = 0; k < 16; k++) {
          const a = this.rngArena.range(0, Math.PI * 2), r = Math.sqrt(this.rngArena.next()) * Math.max(0, s.r - P.ring - 4);
          const p = { x: s.x + M.cos(a) * r, y: s.y + M.sin(a) * r };
          if (MAP.inWall(p.x, p.y, P.ring * 0.6)) continue;
          const ds = this.heroes.filter((h) => h.alive).map((h) => dist(h, p)).sort((x, y) => x - y);
          if (ds.length < 2) continue;
          const sc = -ds[1] - Math.max(0, 25 - ds[0]) * 4;
          if (sc > bs) { bs = sc; best = p; }
        }
        if (!best) { D.nextAt = t + 20; return; }
        g = D.gate = { id: ++D.n, x: Math.round(best.x * 100) / 100, y: Math.round(best.y * 100) / 100, state: 'open', until: t + P.open, a: null, prog: new Map(), t0: 0 };
        this.addFeed({ type: 'duel_gate', x: g.x, y: g.y, until: g.until });
        return;
      }
      if (g.state === 'open') {
        if (g.a && (!g.a.alive || g.a.out)) g.a = null;
        if (t >= g.until) { this.addFeed({ type: 'duel_close', a: g.a }); D.gate = null; D.nextAt = t + P.every; return; }
        for (const h of this.heroes) {
          if (!h.alive || h === g.a) continue;
          const near = dist(h, g) <= P.r && !h.cast && t - (h.lastDmgT || -99) > 0.6;
          const v = near ? (g.prog.get(h.id) || 0) + C.TICK : 0;
          g.prog.set(h.id, v);
          if (v < P.join) continue;
          g.prog.set(h.id, 0);
          if (!g.a) { g.a = h; this.addFeed({ type: 'duel_join', hero: h }); if (this.fxOn) this.fx({ type: 'ring', x: g.x, y: g.y, r: 3, color: '#ffd24a' }); }
          else { this.startDuel(g, g.a, h); break; }
        }
        return;
      }
      // đang quyết đấu
      const a = g.a, b = g.b;
      const aDead = !a.alive, bDead = !b.alive;
      const maxTime = g.maxDur || P.max;
      const timedOut = t - g.t0 > maxTime;
      if (aDead || bDead || timedOut) {
        const w = (aDead && bDead) || timedOut ? null : aDead ? b : a, l = w === a ? b : a;
        g.state = 'done';
        if (w) {
          const R = P.reward;
          this.gainGold(w, R.gold); this.gainXP(w, R.xp); this.heal(w, w, w.st.maxHp * R.heal, true);
          w.stats.duels = (w.stats.duels || 0) + 1;
          this.giveSoul(w, R.soul, 'quyết đấu');
          this.setYNiem(w, Math.min(5, (w.yNiem || 0) + 1), 'quyết đấu');
        }
        // Người thua được hồi sinh ngay lập tức
        if (l && !l.alive) {
          this.revive(l);
        }
        // Dịch chuyển cả hai về lại sàn đấu chính
        const retA = a.duelOrig || g.gateOrig || this.safeCircle();
        const retB = b.duelOrig || g.gateOrig || this.safeCircle();
        a.x = retA.x - 1; a.y = retA.y;
        b.x = retB.x + 1; b.y = retB.y;
        MAP.pushOut(a, a.r); MAP.pushOut(b, b.r);
        a.duel = b.duel = null;

        D.history.push({ w: w && w.id, l: l && l.id, t, dur: t - g.t0, draw: timedOut });
        this.addFeed({ type: 'duel_end', winner: w, loser: l, dur: t - g.t0, draw: timedOut });

        if (g.q && this.bookie) {
          if (w) this.bookie.resolve(g.q, 'h' + w.id);
          else this.bookie.resolve(g.q, 'draw');
        }

        D.gate = null; D.nextAt = t + P.every;
        return;
      }
      // quá lâu: vòng siết lại, đốt cả hai
      if (t - g.t0 > P.max && this.tick % 10 === 0) for (const h of [a, b]) this.damage(null, h, h.st.maxHp * P.burn * 0.5, 'true', { tag: 'duel', noHook: true, duel: true });
    },
    startDuel(g, a, b) {
      const P = C.DUEL, realm = C.DUEL_REALM || { cx: 1200, cy: 1200, r: 24 };
      g.state = 'fight'; g.a = a; g.b = b; g.t0 = this.time;
      g.gateOrig = { x: g.x, y: g.y };
      g.realm = true;
      g.x = realm.cx; g.y = realm.cy;
      a.duelOrig = { x: a.x, y: a.y };
      b.duelOrig = { x: b.x, y: b.y };
      // dịch chuyển hai tướng đến không gian riêng biệt 2 người
      const pa = { x: realm.cx - 9, y: realm.cy };
      const pb = { x: realm.cx + 9, y: realm.cy };
      for (const [h, p] of [[a, pa], [b, pb]]) {
        h.x = p.x; h.y = p.y; h.dash = null; h.goal = null; h.attackTarget = null; h.windup = null; h.navP = null;
        if (h.cast && h.cast.key === 'potion') h.cast = null;
        h.duel = g;
        if (this.fxOn) this.fx({ type: 'blink', x: h.x, y: h.y, x2: p.x, y2: p.y });
      }
      a.face(b.x, b.y); b.face(a.x, a.y);
      this.addFeed({ type: 'duel_start', a, b, realm: true });
      if (this.fxOn) this.fx({ type: 'ring', x: realm.cx, y: realm.cy, r: realm.r, color: '#ffd24a' });
    },
    startSoloDuelRealm(a, b, q) {
      const D = this.duelSt;
      if (!D) return null;
      const g = D.gate = {
        id: ++D.n,
        state: 'fight',
        a, b,
        t0: this.time,
        maxDur: 55,
        q,
        isBookie: true,
        x: this.safeCircle().x,
        y: this.safeCircle().y,
        prog: new Map()
      };
      this.startDuel(g, a, b);
      if (this.fxOn) {
        this.fx({ type: 'callout', id: a.id, text: '⚔ Quyết Đấu Không Gian Riêng!', color: '#ffd24a' });
        this.fx({ type: 'callout', id: b.id, text: '⚔ Quyết Đấu Không Gian Riêng!', color: '#ffd24a' });
      }
      return g;
    },
    // giữ người trong vòng ở trong, người ngoài ở ngoài (gọi sau va chạm mềm)
    duelContain() {
      if (!this.duelActive()) return;
      const g = this.duelSt.gate;
      const realm = g.realm ? (C.DUEL_REALM || { cx: 1200, cy: 1200, r: 24 }) : null;
      const cx = realm ? realm.cx : g.x, cy = realm ? realm.cy : g.y;
      const R = realm ? realm.r : C.DUEL.ring;
      for (const u of this.units) {
        if (!u.alive || !(u.kind === 'hero' || u.kind === 'pet' || u.kind === 'monster')) continue;
        const dx = u.x - cx, dy = u.y - cy, d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (this.isDuelist(u)) {
          if (d > R - u.r) { u.x = cx + dx / d * (R - u.r); u.y = cy + dy / d * (R - u.r); if (u.dash) u.dash.t = 0; }
        } else if (!g.realm) {
          if (d < R + u.r) { u.x = cx + dx / d * (R + u.r + 0.05); u.y = cy + dy / d * (R + u.r + 0.05); MAP.pushOut(u, u.r); if (u.dash) u.dash.t = 0; }
        }
      }
    },
  };
  G.ExtrasMix = Extras;
  G.YNIEM_NAME = YNIEM_NAME; G.SOUL_PERK = SOUL_PERK; G.PEN_LV = PEN_LV;
})();
