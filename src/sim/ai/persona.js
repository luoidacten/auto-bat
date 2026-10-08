'use strict';
// ===== HÀNH VI RIÊNG CỦA 20 TÍNH CÁCH MỚI (GĐ7) =====
// Gắn vào AI có sẵn ở 6 chỗ:
//   1) hành động lớn mới cho Utility AI (thách đấu, hộ tống, giữ cứ điểm, gác lối bo, chiếm chỗ cao, truy sát dị giáo,
//      kích nổ, giăng mồi, bám mép bão, đình chiến) — chỉ tính cách tương ứng mới chấm điểm được
//   2) mod(X, k, r): chỉnh điểm hành động có sẵn theo tính cách (vd Con Bạc Khát Nước bỏ bãi nhỏ, Bắt Nạt chỉ săn kẻ yếu)
//   3) tgt(ai, e, add): cộng / trừ điểm khi chọn mục tiêu giao tranh, hoặc bỏ hẳn mục tiêu (false)
//   4) engage(ai, e, c): quyết có lao vào hay không (true / false / null = theo mặc định)
//   5) retreatHp / aggrMul: ngưỡng bỏ chạy, độ hổ báo
//   6) micro(ai, …) / work(ai, dir) / bag(ai, …): vi mô mỗi nhịp nghĩ, làm việc theo hành động mới, dùng vật phẩm riêng
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, M = G.M, MAP = G.MAP;
  const { dist } = M;
  const U = G.UtilityAI, { lin, floor } = U.Curve;
  const cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  // ---------- tiện ích ----------
  const recentKills = (m, T) => { const out = []; for (let i = m.feed.length - 1; i >= 0; i--) { const f = m.feed[i]; if (m.time - f.t > T) break; if (f.type === 'kill' && f.killer) out.push(f); } return out; };
  const onMe = (ai, e) => e.attackTarget === ai.u || ai.m.time - (ai.u.dmgBy.get(e.id) || -99) < 2.5;
  const heretics = (u) => (u.pers && u.pers.heretic) || [];
  // người được Vệ Sĩ bảo vệ (tạm thời: kẻ yếu nhất lúc đầu trận — sẽ đổi theo cốt truyện)
  function wardOf(ai) {
    const m = ai.m, u = ai.u;
    if (ai.ward === undefined && m.time > 0.5) {
      let best = null, bp = Infinity;
      for (const h of m.heroes) if (h !== u && h.alive) { const p = ai.power(h); if (p < bp - 1e-9 || (Math.abs(p - bp) < 1e-9 && best && h.id < best.id)) { bp = p; best = h; } }
      ai.ward = best || null;
      if (best) m.addFeed({ type: 'ward', hero: u, ward: best });
    }
    return ai.ward && ai.ward.alive ? ai.ward : null;
  }
  const wardHitBy = (ai, e) => { const w = wardOf(ai); return !!(w && w.lastAtt && G.ownerOf(w.lastAtt) === e && ai.m.time - (w.lastAttT || -99) < 3); };
  // kẻ đáng "trảm": nhiều mạng nhất, cầm vũ khí Đỏ, hoặc đang có bùa boss
  function bountyOf(m, u) {
    let lead = null, lk = 0;
    for (const h of m.heroes) if (h !== u && h.alive && h.stats.k > lk) { lk = h.stats.k; lead = h; }
    return (e) => e === lead && lk >= 2 || (e.yNiem || 0) >= 5 || (e.statuses.length && !!e.hasKey('an_tan_the'));
  }
  // công trình làm cứ điểm: nhà / đền / cao nguyên / tháp canh trong vòng bo kế tiếp, gần tâm bo nhất
  function bunkerOf(ai, X) {
    const s = X.safe;
    const ok = (st) => st && dist(st, s) < s.r - 6;
    if (ai.bunker && ok(ai.bunker)) return ai.bunker;
    let best = null, bd = Infinity;
    for (const st of MAP.structs) if (st.inside && ok(st)) { const d = dist(st, s) + dist(st, ai.u) * 0.25; if (d < bd) { bd = d; best = st; } }
    ai.bunker = best;
    return best;
  }
  // lối vào công trình (để đặt bẫy)
  function entrances(st) {
    if (st.type === 'house') return st.doors.map((i) => { const hw = st.w / 2, hh = st.h / 2, L = [[0, -hh], [hw, 0], [0, hh], [-hw, 0]][i], c = Math.cos(st.ang), s = Math.sin(st.ang); return { x: st.x + L[0] * c - L[1] * s, y: st.y + L[0] * s + L[1] * c }; });
    if (st.type === 'plateau' || st.type === 'tower') return st.ramps.map((d) => ({ x: st.x + M.cos(d * Math.PI / 180) * (st.r - 1), y: st.y + M.sin(d * Math.PI / 180) * (st.r - 1) }));
    const h = st.L / 2; return [[0, -h], [h, 0], [0, h], [-h, 0]].map(([ox, oy]) => ({ x: st.x + ox * Math.cos(st.ang) - oy * Math.sin(st.ang), y: st.y + ox * Math.sin(st.ang) + oy * Math.cos(st.ang) }));
  }
  const inBunker = (ai) => ai.act === 'bunker' && ai.bunker && dist(ai.u, ai.bunker) < 8;
  // đình chiến (Ngụy Quân Tử ↔ một người khác)
  // ===== GĐ7b: LIÊN MINH TẠM THỜI (mọi tướng) =====
  // Hai tướng gặp nhau đầu–giữa trận có thể kết liên minh (theo tính cách: ai hay đề nghị, ai dễ nhận lời). Liên minh:
  // không cố ý nhắm nhau, chung tầm nhìn, giúp nhau đánh kẻ thứ ba, đi cùng nhau. NHƯNG sát thương vẫn gây lên nhau
  // (chiêu diện rộng, thùng nổ…) — trúng đồng minh quá đau thì liên minh vỡ. Tự tan khi hết hạn, khi còn ≤ 4 người,
  // hoặc khi một bên phản bội (Ngụy Quân Tử luôn chờ thời; vài tính cách khác có thể nổi lòng tham khi đồng minh sắp chết).
  // offer: hay đề nghị • accept: dễ nhận lời • betray: khả năng phản bội khi đồng minh dưới 25% máu
  const ALLY = {
    hoabinh: [0.6, 1, 0], chuotlui: [0.3, 0.9, 0.05], nguyquan: [1, 0.6, 1], vosi: [0, 0.1, 0], batnat: [0.2, 0.2, 0.6], cuongtin: [0, 0, 0],
    bacle: [0, 0.05, 0.3], lanhchua: [0.1, 0.3, 0.1], vesi: [0.1, 0.3, 0], kenken: [0.4, 0.5, 0.5], thucdung: [0.5, 0.8, 0.15], li: [0.3, 0.7, 0.05],
    thamfarm: [0.4, 0.7, 0.1], hobao: [0.15, 0.3, 0.3], amsat: [0.1, 0.3, 0.35], conbac: [0.3, 0.5, 0.3], khatnuoc: [0.4, 0.5, 0.3],
    quayphan: [0.3, 0.4, 0.4], gaccong: [0.2, 0.4, 0.15], doimang: [0.2, 0.5, 0.1], thoatxac: [0.3, 0.5, 0.2], tientri: [0.2, 0.4, 0.1],
    tramtuong: [0.1, 0.2, 0.3], honloan: [0.3, 0.4, 0.3], moicau: [0.4, 0.4, 0.4], riabao: [0.2, 0.4, 0.3],
    cauton: [0.3, 0.5, 0.1], binhthuong: [0.25, 0.4, 0.15], thuongnhan: [0.5, 0.75, 0], bipbom: [0.8, 0.6, 0.6],   // GĐ9
  };
  const allyOf = (id) => ALLY[id] || [0.25, 0.4, 0.15];
  const truceOf = (m, u) => { const t = u.allyRec; return t && !t.broken && t.until > m.time ? t : null; };
  const partnerOf = (m, u) => { const t = truceOf(m, u); return t ? (t.a === u ? t.b : t.a) : null; };
  // ===== GĐ9b: NGƯỜI CỦA NHÀ CÁI — liên minh LÂU DÀI (không báo cho ai biết) =====
  // Gặp nhau thì lướt qua, không nhắm nhau, không săn nhau, không làm kền kền nhau, đổi đồ thật thà, chung tầm nhìn.
  // Liên minh có thể vỡ vì LÒNG THAM (mỗi 10s cân nhắc): thính rơi giữa hai người (tùy tính cách), bo cuối ép sát nhau,
  // hoặc chỉ còn toàn người của nhà cái trong trận. Trúng nhầm nhau quá đau cũng vỡ.
  const HOUSE_GREED = { batnat: 0.55, bacle: 0.35, li: 0.15, hoabinh: 0.05, cuongloan: 1 };
  const greedOf = (u) => (HOUSE_GREED[u.persId] != null ? HOUSE_GREED[u.persId] : 0.3);
  function setupHouse(m, ids) {
    const H = m.heroes.filter((h) => ids.includes(h.heroId));
    if (!m.truces) m.truces = [];
    for (const h of H) { h.house = true; h.permWith = new Map(); }
    for (let i = 0; i < H.length; i++) for (let j = i + 1; j < H.length; j++) {
      const a = H[i], b = H[j], t = { a, b, t0: 0, until: 1e9, broken: false, dmg: 0, betray: null, perm: true, house: true };
      m.truces.push(t); a.permWith.set(b.id, t); b.permWith.set(a.id, t);
    }
  }
  const mate = (m, u, e) => { const t = u && e && u.permWith && u.permWith.get(e.id); return !!(t && !t.broken); };
  function houseGreed(m, t) {
    if (m.time < (t.greedT || 0)) return;
    t.greedT = m.time + 10;
    const a = t.a, b = t.b, alive = m.heroes.filter((h) => h.alive);
    let why = null, p = 0;
    if (alive.length >= 2 && alive.every((h) => h.house)) { why = 'final'; p = 0.3; }
    else {
      const d = (m.drops || []).find((x) => x.landed && !x.taken && dist(x, a) < 25 && dist(x, b) < 25);
      if (d) { why = 'drop'; p = Math.max(greedOf(a), greedOf(b)); }
      else if (m.zoneSt && m.zoneSt.phase >= 4 && dist(a, b) < 15) { why = 'zone'; p = 0.06; }
    }
    if (!why || m.rngAI.next() >= p) return;
    const x = greedOf(a) >= greedOf(b) ? a : b, y = x === a ? b : a;
    t.broken = true; t.endT = m.time; t.reason = 'greed';
    if (x.ai) { x.ai.callout(why === 'drop' ? '💰 Thính này của tao!' : why === 'final' ? '⚔ Giờ chỉ còn tao với mày' : '😠 Tránh ra!', '#ffb08a'); x.ai.decT = 0; }
    if (y.ai) y.ai.grudges.set(x.id, m.time + 60);
    m.addFeed({ type: 'house_split', hero: x, other: y, why });
  }
  // sẵn sàng đâm sau lưng: đồng minh sơ hở (dưới 30% máu hoặc cúi xuống mở rương) và mình đã quyết phản bội
  const backstabReady = (m, u, p) => !!(p && p.alive && u.allyRec && u.allyRec.betray === u && dist(u, p) < 12 && (p.hpPct < 0.3 || (p.cast && p.cast.key === 'chest')));
  function endAlliance(m, t, reason, by) {
    if (!t || t.broken) return;
    t.broken = true; t.endT = m.time; t.reason = reason;
    if (t.a.allyRec === t) t.a.allyRec = null;
    if (t.b.allyRec === t) t.b.allyRec = null;
    if (reason !== 'backstab' && !(t.trade && (reason === 'time' || reason === 'trade'))) m.addFeed({ type: 'truce_end', hero: t.a, other: t.b, reason, by: by || null, trade: !!t.trade });
  }
  function formAlliance(m, a, b, dur, opt) {
    const t = { a, b, t0: m.time, until: m.time + dur, broken: false, dmg: 0, betray: null, trade: !!(opt && opt.trade) };
    (m.truces || (m.truces = [])).push(t); a.allyRec = t; b.allyRec = t;
    for (const [x, y] of [[a, b], [b, a]]) if (x.ai && x.ai.target === y) { x.ai.target = null; x.ai.mode = 'idle'; x.attackTarget = null; }
    m.addFeed({ type: 'truce', hero: a, other: b, trade: t.trade });
    return t;
  }
  // mỗi 0.5s: hết hạn / còn ≤ 4 người / ai chết → tan; đồng minh sắp chết → kẻ tham nổi lòng phản bội (quyết 1 lần)
  function updateAlliances(m) {
    const T = m.truces; if (!T || !T.length) return;
    const alive = m.aliveCount();
    for (const t of T) {
      if (t.broken) continue;
      if (t.house) {   // GĐ9b: người của nhà cái — không hết hạn, không tan khi còn ít người; chỉ vỡ vì lòng tham / trúng nhầm
        if (!t.a.alive || !t.b.alive) { if (t.a.out || t.b.out) { t.broken = true; t.reason = 'dead'; } continue; }
        houseGreed(m, t); if (t.broken) continue;
        allyDeals(m, t); continue;
      }
      if (!t.a.alive || !t.b.alive) { endAlliance(m, t, 'dead'); continue; }
      if (m.time >= t.until) { endAlliance(m, t, 'time'); continue; }
      if (alive <= C.ALLY.dissolve) { endAlliance(m, t, 'few'); continue; }
      cheatCheck(m, t); if (t.broken) continue;   // GĐ9: vỡ lẽ bị đổi gian
      allyDeals(m, t); if (t.broken) continue;    // GĐ9: trao đổi / bịp
      if (!t.betray) for (const [x, y] of [[t.a, t.b], [t.b, t.a]]) {
        if (y.hpPct >= 0.25 && !(y.cast && y.cast.key === 'chest') || t['tempt' + x.id]) continue;
        t['tempt' + x.id] = true;
        const pb = x.persId === 'nguyquan' ? 1 : allyOf(x.persId)[2];
        if (m.rngAI.next() < pb) { t.betray = x; break; }
      }
    }
  }
  // sát thương giữa hai đồng minh (chiêu diện rộng trúng nhầm…): cộng dồn, quá 15% máu tối đa thì liên minh vỡ
  function allyHit(m, owner, tgt, dealt) {
    const ht = tgt.permWith && tgt.permWith.get(owner.id);
    if (ht && !ht.broken) { ht.dmg += dealt; if (ht.dmg >= tgt.st.maxHp * C.ALLY.hitBreak * 2) { ht.broken = true; ht.reason = 'hit'; m.addFeed({ type: 'house_split', hero: owner, other: tgt, why: 'hit' }); if (tgt.ai) tgt.ai.grudges.set(owner.id, m.time); } return; }
    const t = truceOf(m, tgt); if (!t || (t.a !== owner && t.b !== owner)) return;
    t.dmg += dealt;
    if (t.dmg >= tgt.st.maxHp * C.ALLY.hitBreak && t.betray !== owner) { endAlliance(m, t, 'hit', owner); if (tgt.ai) { tgt.ai.callout('😠 Đánh trúng tao rồi!', '#ffb08a'); tgt.ai.grudges.set(owner.id, m.time); } }
  }
  // ===== GĐ9: TRAO ĐỔI & BỊP TRONG LIÊN MINH =====
  // Hai đồng minh đứng gần nhau (≤ 7 đv), không ai đang đánh: mỗi ~18s cân nhắc đổi 1 mảnh hồn và/hoặc 1 món balo sao cho
  // CẢ HAI cùng lợi (mảnh hợp tướng / mảnh yêu thích / thừa–thiếu bình). Liên minh LÂU DÀI (t.perm — người của nhà cái) luôn đổi thật.
  // Liên minh TẠM: kẻ ưa bịp có thể
  //   (1) ĐỔI GIAN — rao mảnh của mình là "hàng xịn" để lấy mảnh tốt của bạn (mình lợi, bạn lỗ). Bạn nhìn ra hay không tùy Tâm Lý +
  //       Đọc Bản Đồ; nhìn ra → từ chối, thù, có thể cắt liên minh; không nhìn ra → mất mảnh, một lúc sau mới vỡ lẽ.
  //   (2) TIN GIẢ — có của ngon gần đó (rương / thính / cụm mảnh hồn) mà bạn cũng sắp tới: hô "bên kia có rương!" chỉ bạn đi
  //       xa 35–50 đv để một mình ôm của. Bạn tới nơi thấy trống trơn → vỡ lẽ.
  const BLUFF = { nguyquan: 0.8, quayphan: 0.6, conbac: 0.4, khatnuoc: 0.35, kenken: 0.4, thucdung: 0.35, amsat: 0.3, batnat: 0.3, moicau: 0.35, honloan: 0.25,
    tramtuong: 0.2, riabao: 0.2, hobao: 0.15, hoabinh: 0, vosi: 0, vesi: 0, cuongtin: 0.05, chuotlui: 0.1, li: 0.05, cauton: 0.1, binhthuong: 0.15,
    thuongnhan: 0, bipbom: 0.95 };
  // GĐ9: Thương Nhân / Kẻ Bịp Bợm gạ đình chiến mua bán với BẤT KỲ AI; người kia nhận lời tùy tính cách
  const TRADE_ACCEPT = { hoabinh: 0.9, thucdung: 0.9, thamfarm: 0.75, conbac: 0.75, khatnuoc: 0.7, cauton: 0.85, thuongnhan: 0.95, bipbom: 0.8, chuotlui: 0.6, li: 0.6,
    kenken: 0.55, moicau: 0.5, quayphan: 0.6, riabao: 0.5, nguyquan: 0.7, doimang: 0.5, thoatxac: 0.5, tientri: 0.5, gaccong: 0.45, lanhchua: 0.35, vesi: 0.4,
    amsat: 0.35, bacle: 0.3, tramtuong: 0.3, honloan: 0.4, batnat: 0.35, hobao: 0.3, vosi: 0.2, cuongtin: 0.1, binhthuong: 0.5 };
  const traderOf = (u) => (u.pers && u.pers.trader) || null;
  const STOCK = 4;
  const bluffOf = (u) => (BLUFF[u.persId] != null ? BLUFF[u.persId] : 0.15);
  const sOf = (u, k) => (u.player && u.player.stats && u.player.stats[k]) || 11;
  // khả năng nhìn ra trò bịp
  const seeThrough = (u) => Math.max(0.05, Math.min(0.75, 0.18 + (sOf(u, 'mental') - 11) * 0.05 + (sOf(u, 'map') - 11) * 0.03));
  // giá trị bộ mảnh hồn với tướng u: mảnh gắn tính đủ, mảnh cất chờ Ý Niệm tính 35%
  function soulVal(m, u, list) { const P = m.soulPlan(u, list); let v = 0; for (const sh of P.keep) v += m.shardScore(u, sh) * (P.act.has(sh) ? 1 : 0.35); return v; }
  // tìm cặp đổi tốt nhất: fair — cả hai cùng lợi; cheat — a lợi rõ, b lỗ
  function bestSwap(m, a, b, mode) {
    const A = a.souls || [], B = b.souls || [];
    if (!A.length || !B.length) return null;
    const va = soulVal(m, a, A), vb = soulVal(m, b, B);
    let best = null, bs = 0;
    for (const x of A) for (const y of B) {
      if (x.id === y.id && x.tier === y.tier) continue;
      const ga = soulVal(m, a, A.filter((s) => s !== x).concat([y])) - va, gb = soulVal(m, b, B.filter((s) => s !== y).concat([x])) - vb;
      const ok = mode === 'fair' ? ga > 0.12 && gb > 0.12 : ga > 0.3 && gb < -0.1;
      if (!ok) continue;
      const s = mode === 'fair' ? ga + gb : ga - gb;
      if (s > bs) { bs = s; best = { x, y, ga, gb }; }
    }
    return best;
  }
  function doSwap(m, a, b, x, y) {
    a.souls = a.souls.filter((s) => s !== x); b.souls = b.souls.filter((s) => s !== y);
    const mk = (u, sh, from) => ({ id: sh.id, tier: sh.tier, key: 'soul_' + (u.soulSeq = (u.soulSeq || 0) + 1), from });
    a.souls.push(mk(a, y, 'đổi với ' + b.hero.name)); b.souls.push(mk(b, x, 'đổi với ' + a.hero.name));
    m.syncSouls(a); m.syncSouls(b);
    if (m.fxOn) { m.fx({ type: 'ring', x: a.x, y: a.y, r: 1.6, color: '#a0d8ff' }); m.fx({ type: 'ring', x: b.x, y: b.y, r: 1.6, color: '#a0d8ff' }); }
  }
  // balo: muốn mang bao nhiêu mỗi thứ (bình tính theo loại hp/mp/ga)
  const bagKey = (id) => { const d = G.CONSUMABLES[id]; return d && d.pot ? d.pot : id; };
  function bagNeed(m, u) {
    const w = m.bagWish(u), want = {}, have = {};
    for (const k in w) { const kk = bagKey(k); want[kk] = Math.max(want[kk] || 0, w[k]); }
    if (u.bag) for (const s of u.bag.slots) { const kk = bagKey(s.id); have[kk] = (have[kk] || 0) + s.n; }
    return { want, have };
  }
  // đổi 1 món balo: a cho món a thừa mà b thiếu, b cho lại món b thừa mà a thiếu (liên minh lâu dài: được cho không món bình máu)
  function bagSwap(m, a, b, perm, dry) {
    if (!a.bag || !b.bag) return null;
    const NA = bagNeed(m, a), NB = bagNeed(m, b);
    const give = (F, T, NF, NT) => { for (const s of F.bag.slots) { const kk = bagKey(s.id); if ((NF.have[kk] || 0) > (NF.want[kk] || 0) && (NT.have[kk] || 0) < (NT.want[kk] || 0) && m.bagRoom(T, s.id) > 0) return s.id; } return null; };
    const ia = give(a, b, NA, NB), ib = give(b, a, NB, NA);
    if (dry) return ia && ib ? { ia, ib } : null;
    if (ia && ib) { m.bagTake(a, ia); m.bagTake(b, ib); m.bagAdd(b, ia, 1); m.bagAdd(a, ib, 1); return { ia, ib }; }
    if (perm && (ia || ib)) { const [F, T, id] = ia ? [a, b, ia] : [b, a, ib]; if (bagKey(id) === 'hp') { m.bagTake(F, id); m.bagAdd(T, id, 1); return F === a ? { ia: id } : { ib: id }; } }
    return null;
  }
  // mua bán bằng vàng: một bên thừa (mảnh hồn gần như vô dụng với mình / bình dư) mà bên kia cần → bán, người cần trả vàng
  const shardPrice = (tier) => 40 * tier * tier;
  function sellDeal(m, a, b) {
    const A = a.souls || [], B = b.souls || [];
    if (A.length) {
      const va = soulVal(m, a, A), vb = soulVal(m, b, B);
      let best = null, bg = 0.25;
      for (const x of A) { const p = shardPrice(x.tier); if (b.gold < p) continue; const loss = va - soulVal(m, a, A.filter((s) => s !== x)); if (loss > 0.1) continue; const g = soulVal(m, b, B.concat([x])) - vb; if (g > bg) { bg = g; best = x; } }
      if (best) return { kind: 'shard', x: best, price: shardPrice(best.tier) };
    }
    if (a.bag && b.bag) {
      const NA = bagNeed(m, a), NB = bagNeed(m, b);
      for (const s of a.bag.slots) { const kk = bagKey(s.id), D = G.CONSUMABLES[s.id]; if (!D) continue;
        if ((NA.have[kk] || 0) >= Math.max(2, (NA.want[kk] || 0)) && (NB.have[kk] || 0) < (NB.want[kk] || 0) - 1 && m.bagRoom(b, s.id) > 0 && b.gold >= D.cost) return { kind: 'item', id: s.id, price: D.cost }; }
    }
    return null;
  }
  function doSell(m, a, b, d) {
    if (d.kind === 'shard') { a.souls = a.souls.filter((s) => s !== d.x); b.souls.push({ id: d.x.id, tier: d.x.tier, key: 'soul_' + (b.soulSeq = (b.soulSeq || 0) + 1), from: 'mua của ' + a.hero.name }); m.syncSouls(a); m.syncSouls(b); }
    else { m.bagTake(a, d.id); m.bagAdd(b, d.id, 1); }
    b.gold -= d.price; a.gold += d.price;
  }
  // ---- Thương Nhân / Kẻ Bịp Bợm: kho hàng (u.stock, tối đa 4 mảnh không gắn) ----
  // honest: mua mảnh người kia gần như không cần (giá 60%), bán mảnh người kia thật sự cần (giá 130%), bán vật phẩm balo người kia thiếu (130%)
  // cheat : bán mảnh DỎM — rao là mảnh bậc cao hơn một bậc, đòi giá bậc đó × 1.2 (người mua tưởng hàng xịn trừ khi nhìn thấu); mua rẻ 35%
  function traderDeal(m, x, y, mode) {
    const Y = y.souls || [], vy = soulVal(m, y, Y), X = x.souls || [], vx = soulVal(m, x, X);
    const cheat = mode !== 'honest';   // 'cheat': bán dỏm + mua rẻ • 'cheatBuy': chỉ mua rẻ
    // 1) bán mảnh: hàng trong kho + mảnh đang mang mà mình không cần
    const goods = mode === 'cheatBuy' ? [] : (x.stock || []).map((sh) => ({ sh, st: true })).concat(X.filter((sh) => vx - soulVal(m, x, X.filter((s) => s !== sh)) < 0.1).map((sh) => ({ sh, st: false })));
    let best = null, bs = cheat ? 0 : 0.2;
    for (const g of goods) {
      const price = Math.round(cheat ? shardPrice(Math.min(6, g.sh.tier + 1)) * 1.2 : shardPrice(g.sh.tier) * 1.3);
      if (y.gold < price) continue;
      const gain = soulVal(m, y, Y.concat([g.sh])) - vy;
      if (cheat) { if (gain > 0.6) continue; if (price > bs) { bs = price; best = { kind: 'sell', g, price, gain }; } }
      else if (gain > bs) { bs = gain; best = { kind: 'sell', g, price, gain }; }
    }
    if (best) return best;
    // 2) mua mảnh người kia không cần
    if ((x.stock || []).length < STOCK) {
      let bb = null, bp = 0;
      for (const sh of Y) { const p = Math.round(shardPrice(sh.tier) * (cheat ? 0.35 : 0.6)); if (x.gold < p) continue; if (vy - soulVal(m, y, Y.filter((s) => s !== sh)) > 0.1) continue; if (p > bp) { bp = p; bb = sh; } }
      if (bb) return { kind: 'buy', sh: bb, price: bp };
    }
    // 3) bán vật phẩm balo người kia thiếu (giữ lại cho mình 1 bình máu)
    if (!cheat && x.bag && y.bag) {
      const NY = bagNeed(m, y);
      for (const s of x.bag.slots) { const kk = bagKey(s.id), D = G.CONSUMABLES[s.id]; if (!D) continue; if (kk === 'hp' && m.potCount(x, 'hp') <= 1) continue;
        const price = Math.round(D.cost * 1.3);
        if ((NY.have[kk] || 0) < (NY.want[kk] || 0) && m.bagRoom(y, s.id) > 0 && y.gold >= price) return { kind: 'item', id: s.id, price }; }
    }
    return null;
  }
  function doTrader(m, x, y, d) {
    if (d.kind === 'sell') {
      const sh = d.g.sh;
      if (d.g.st) x.stock = x.stock.filter((s) => s !== sh); else { x.souls = x.souls.filter((s) => s !== sh); m.syncSouls(x); }
      y.souls.push({ id: sh.id, tier: sh.tier, key: 'soul_' + (y.soulSeq = (y.soulSeq || 0) + 1), from: 'mua của ' + x.hero.name }); m.syncSouls(y);
      y.gold -= d.price; x.gold += d.price;
    } else if (d.kind === 'buy') {
      y.souls = y.souls.filter((s) => s !== d.sh); m.syncSouls(y);
      (x.stock || (x.stock = [])).push({ id: d.sh.id, tier: d.sh.tier, key: 'stock_' + (x.soulSeq = (x.soulSeq || 0) + 1) });
      x.gold -= d.price; y.gold += d.price;
    } else { m.bagTake(x, d.id); m.bagAdd(y, d.id, 1); y.gold -= d.price; x.gold += d.price; }
    x.stats.trades = (x.stats.trades || 0) + 1; y.stats.trades = (y.stats.trades || 0) + 1;
    if (m.fxOn) m.fx({ type: 'ring', x: x.x, y: x.y, r: 1.6, color: '#ffe08a' });
  }
  // gạ đình chiến mua bán (Thương Nhân / Kẻ Bịp Bợm) với một người gặp trên đường
  function tryTrade(ai, enemies) {
    const m = ai.m, u = ai.u, TR = traderOf(u);
    if (!TR || truceOf(m, u) || m.time - (ai.tradeAskT || -99) < 20 || ai.mode === 'fight' || u.hpPct < 0.35 || m.aliveCount() <= C.ALLY.dissolve) return false;
    const e = enemies.find((x) => x.kind === 'hero' && dist(x, u) < 18 && !truceOf(m, x) && x.hpPct > 0.3 && !(x.ai && x.ai.mode === 'fight') && x.attackTarget !== u && !onMe(ai, x) && !(x.ai && x.ai.cheatedBy && x.ai.cheatedBy.has(u.id)));
    if (!e || !e.ai) return false;
    ai.tradeAskT = m.time;
    if (!traderDeal(m, u, e, TR === 'cheat' ? 'cheat' : 'honest') && !(TR === 'cheat' && (bestSwap(m, u, e, 'cheat') || prizeNear(m, u, 30)))) return false;   // không có gì để buôn / để lừa
    ai.callout(TR === 'cheat' ? '🎭 Hàng xịn giá hời đây!' : '⚖ Mua bán không?', '#ffe8a0');
    const ok = m.rngAI.next() < (TRADE_ACCEPT[e.persId] != null ? TRADE_ACCEPT[e.persId] : 0.5) * (e.ai.grudge(u) ? 0.2 : 1);
    if (ok) { e.ai.callout('🤝 Xem hàng', '#ffe8a0'); formAlliance(m, u, e, 40, { trade: true }); }
    else e.ai.callout('✋ Không mua', '#ffd0d0');
    return ok;
  }
  // của ngon gần u (để lừa đồng minh đi chỗ khác): rương chưa mở / thính đã rơi / cụm mảnh hồn
  function prizeNear(m, u, R) {
    let best = null, bd = R;
    for (const c of m.chests || []) if (!c.opened && dist(u, c) < bd) { bd = dist(u, c); best = { x: c.x, y: c.y, what: 'rương' }; }
    for (const d of m.drops || []) if (d.landed && !d.taken && dist(u, d) < bd) { bd = dist(u, d); best = { x: d.x, y: d.y, what: 'thính' }; }
    for (const o of m.soulOrbs || []) if (o.tier >= 3 && dist(u, o) < bd && !(o.ej && o.from === u)) { bd = dist(u, o); best = { x: o.x, y: o.y, what: 'mảnh hồn' }; }
    return best;
  }
  // tin giả (báo từ xa được — đồng minh chung tầm nhìn): x đứng gần của ngon, y cũng đang ở không xa → chỉ y đi hướng ngược lại
  function tryLure(m, t, x, y) {
    if (y.ai.lure || y.ai.mode === 'fight' || m.rngAI.next() >= bluffOf(x) * 0.35) return false;
    const pz = prizeNear(m, x, 22);
    if (!pz || dist(y, pz) > 45) return false;
    const v = M.dir(pz, y); let fp = { x: y.x + v.x * 42, y: y.y + v.y * 42 }; MAP.pushOut(fp, 2);
    if (!m.inZone(fp, 0)) { fp.x = (fp.x + m.zoneSt.cur.x) / 2; fp.y = (fp.y + m.zoneSt.cur.y) / 2; MAP.pushOut(fp, 2); }
    // Kẻ Bịp Bợm: dụ thẳng vào bẫy của mình nếu có
    if (x.persId === 'bipbom') { const tp = (m.traps || []).find((tt) => tt.owner === x && dist(tt, y) < 45 && dist(tt, pz) > 15); if (tp) fp = { x: tp.x, y: tp.y }; }
    x.ai.callout(`📣 Bên kia có ${pz.what} ngon, ra lấy đi!`, '#cfe8ff');
    if (m.rngAI.next() < seeThrough(y) * 0.8) {
      y.ai.callout('🤨 Lừa ai đấy?', '#ffb08a'); y.ai.grudges.set(x.id, m.time);
      m.addFeed({ type: 'bluff_caught', hero: x, other: y, kind: 'lure' });
      if (m.rngAI.next() < 0.35) endAlliance(m, t, 'bluff', x);
      return true;
    }
    y.ai.callout('🏃 Đi liền', '#cfe8ff');
    y.ai.lure = { point: fp, until: m.time + 16, by: x, what: pz.what, trap: x.persId === 'bipbom' && (m.traps || []).some((tt) => tt.x === fp.x && tt.y === fp.y) }; y.ai.decT = 0;
    x.stats.bluffs = (x.stats.bluffs || 0) + 1;
    m.addFeed({ type: 'bluff', hero: x, other: y, kind: 'lure', what: pz.what });
    return true;
  }
  // gọi mỗi 0.5s cho từng cặp đồng minh
  function allyDeals(m, t) {
    const a = t.a, b = t.b;
    if (!a.ai || !b.ai) return;
    if (!t.perm && m.time >= (t.lureT || 0)) { t.lureT = m.time + 8; if (tryLure(m, t, a, b) || (!t.broken && tryLure(m, t, b, a))) return; }
    if (t.broken || m.time < (t.dealT || 0) || a.ai.mode === 'fight' || b.ai.mode === 'fight') return;
    const dd = dist(a, b);
    if (dd > 10) {   // ở xa: thấy có món đáng đổi / đáng mua thì hẹn gặp (cả hai đi về phía nhau)
      if (dd < 80 && m.time >= (t.meetChk || 0)) {
        t.meetChk = m.time + 6;
        const want = bestSwap(m, a, b, 'fair') || sellDeal(m, a, b) || sellDeal(m, b, a) || bagSwap(m, a, b, t.perm, true) || (!t.perm && ((bluffOf(a) >= 0.3 && bestSwap(m, a, b, 'cheat')) || (bluffOf(b) >= 0.3 && bestSwap(m, b, a, 'cheat'))));
        if (want && !(t.meet > m.time)) { t.meet = m.time + 15; a.ai.callout('🔄 Lại đây đổi đồ', '#cfe8ff'); }
      }
      return;
    }
    if (a.cast || b.cast) return;
    t.dealT = m.time + 18; t.meet = 0;
    if (t.trade) t.until = Math.min(t.until, m.time + 6);   // đình chiến mua bán: xong một lần là chia tay
    const perm = !!t.perm;
    // ai là người mở lời (luân phiên; đình chiến mua bán thì người buôn mở lời)
    let [x, y] = (t.dealN = (t.dealN || 0) + 1) % 2 ? [a, b] : [b, a];
    if (traderOf(y) && !traderOf(x)) [x, y] = [y, x];
    // --- bịp (chỉ liên minh tạm, tùy tính cách) ---
    if (!perm && t.betray !== y && m.rngAI.next() < bluffOf(x) * (t.trade ? 1 : 0.5)) {
      // Kẻ Bịp Bợm: bán mảnh dỏm giá cao
      const cs = traderOf(x) === 'cheat' ? traderDeal(m, x, y, 'cheat') : null;
      if (cs && cs.kind === 'sell') {
        const T = G.SOUL_TIER[cs.g.sh.tier];
        x.ai.callout(`🎭 Mảnh ${T.name} hiếm, ${cs.price} vàng thôi!`, '#ffe8a0');
        if (m.rngAI.next() < seeThrough(y)) {
          y.ai.callout('🤨 Hàng dỏm!', '#ffb08a'); y.ai.grudges.set(x.id, m.time); (y.ai.cheatedBy || (y.ai.cheatedBy = new Set())).add(x.id);
          m.addFeed({ type: 'bluff_caught', hero: x, other: y, kind: 'sell' });
          endAlliance(m, t, 'bluff', x);
          return;
        }
        y.ai.callout('💰 Lấy', '#ffe8a0');
        doTrader(m, x, y, cs);
        x.stats.bluffs = (x.stats.bluffs || 0) + 1;
        m.addFeed({ type: 'bluff', hero: x, other: y, kind: 'sell', give: cs.g.sh.id, gt: cs.g.sh.tier, price: cs.price });
        t.cheat = { by: x, vic: y, at: m.time + 20 + m.rngAI.next() * 30, p: Math.min(0.9, seeThrough(y) * 1.8), kind: 'sell' };
        return;
      }
      const ch = bestSwap(m, x, y, 'cheat');
      if (ch) {
        const T = G.SOUL_TIER;
        x.ai.callout(`🔄 Đổi ${T[ch.x.tier].name} xịn lấy ${T[ch.y.tier].name} không?`, '#cfe8ff');
        if (m.rngAI.next() < seeThrough(y)) {
          y.ai.callout('🤨 Định bịp tao à?', '#ffb08a'); y.ai.grudges.set(x.id, m.time);
          m.addFeed({ type: 'bluff_caught', hero: x, other: y, kind: 'trade' });
          if (m.rngAI.next() < 0.5) endAlliance(m, t, 'bluff', x);
          return;
        }
        y.ai.callout('👍 Chốt', '#cfe8ff');
        doSwap(m, x, y, ch.x, ch.y);
        x.stats.bluffs = (x.stats.bluffs || 0) + 1;
        m.addFeed({ type: 'bluff', hero: x, other: y, kind: 'trade', give: ch.x.id, gt: ch.x.tier, take: ch.y.id, tt: ch.y.tier });
        // vỡ lẽ sau 25–60s (nếu đủ tinh)
        t.cheat = { by: x, vic: y, at: m.time + 25 + m.rngAI.next() * 35, p: Math.min(0.9, seeThrough(y) * 1.6) };
        return;
      }
    }
    // --- Thương Nhân (và Kẻ Bịp Bợm khi không bịp): mua bán theo giá chợ ---
    const TR = traderOf(x);
    if (TR) {
      const dd2 = traderDeal(m, x, y, TR === 'cheat' ? 'cheatBuy' : 'honest');   // Kẻ Bịp Bợm bán dỏm chỉ ở nhánh bịp ở trên
      if (dd2) {
        const what = dd2.kind === 'item' ? G.CONSUMABLES[dd2.id].name : 'mảnh ' + G.SOUL_TIER[(dd2.kind === 'sell' ? dd2.g.sh : dd2.sh).tier].name;
        x.ai.callout(dd2.kind === 'buy' ? `⚖ Mua ${what} của mày ${dd2.price} vàng` : `⚖ Bán ${what} ${dd2.price} vàng`, '#ffe8a0'); y.ai.callout('🤝 Ok', '#ffe8a0');
        doTrader(m, x, y, dd2);
        const sh = dd2.kind === 'sell' ? dd2.g.sh : dd2.sh;
        m.addFeed({ type: 'trade', hero: x, other: y, merchant: dd2.kind, shard: sh ? sh.id : null, tier: sh ? sh.tier : 0, item: dd2.id || null, price: dd2.price });
        return;
      }
    }
    // --- đổi thật / mua bán ---
    const sw = bestSwap(m, x, y, 'fair'), bg = sw ? null : bagSwap(m, x, y, perm);
    const sl = sw || bg ? null : (sellDeal(m, x, y) && [x, y, sellDeal(m, x, y)]) || (sellDeal(m, y, x) && [y, x, sellDeal(m, y, x)]);
    if (sw) {
      x.ai.callout('🔄 Đổi mảnh hồn không?', '#cfe8ff'); y.ai.callout('👍 Được', '#cfe8ff');
      doSwap(m, x, y, sw.x, sw.y);
      m.addFeed({ type: 'trade', hero: x, other: y, give: sw.x.id, gt: sw.x.tier, take: sw.y.id, tt: sw.y.tier });
      x.stats.trades = (x.stats.trades || 0) + 1; y.stats.trades = (y.stats.trades || 0) + 1;
    } else if (bg) {
      x.ai.callout('🔄 Đổi đồ nhé', '#cfe8ff');
      m.addFeed({ type: 'trade', hero: x, other: y, bag: bg });
      x.stats.trades = (x.stats.trades || 0) + 1; y.stats.trades = (y.stats.trades || 0) + 1;
    } else if (sl) {
      const [s, buy, d] = sl;
      buy.ai.callout(`💰 Bán cho tao ${d.kind === 'shard' ? 'mảnh đó' : G.CONSUMABLES[d.id].name}, ${d.price} vàng`, '#ffe8a0'); s.ai.callout('🤝 Ok', '#ffe8a0');
      doSell(m, s, buy, d);
      m.addFeed({ type: 'trade', hero: s, other: buy, sell: d.kind === 'shard' ? { shard: d.x.id, tier: d.x.tier } : { item: d.id }, price: d.price });
      s.stats.trades = (s.stats.trades || 0) + 1; buy.stats.trades = (buy.stats.trades || 0) + 1;
    }
  }
  // đồng minh nhận ra mình bị đổi gian
  function cheatCheck(m, t) {
    const c = t.cheat; if (!c || m.time < c.at) return;
    t.cheat = null;
    if (!c.vic.alive || !c.vic.ai || m.rngAI.next() >= c.p) return;
    c.vic.ai.callout('😤 Mảnh hồn dỏm! Bị lừa rồi', '#ffb08a'); c.vic.ai.grudges.set(c.by.id, m.time + 60); (c.vic.ai.cheatedBy || (c.vic.ai.cheatedBy = new Set())).add(c.by.id);
    m.addFeed({ type: 'bluff_found', hero: c.by, other: c.vic, kind: c.kind || 'trade' });
    endAlliance(m, t, 'bluff', c.by);
  }
  // đề nghị liên minh khi gặp nhau (đầu–giữa trận, cả hai còn khỏe, không đang đánh nhau, chưa có liên minh)
  function tryAlly(ai, enemies) {
    const m = ai.m, u = ai.u, A = C.ALLY;
    if (m.time > A.until || m.time < A.from || truceOf(m, u) || m.aliveCount() <= A.dissolve + 1 || m.time - (ai.truceAskT || -99) < A.askGap || u.hpPct < 0.45 || ai.mode === 'fight') return false;
    if ((ai.truceN || 0) >= A.perHero || u.house) return false;   // GĐ9b: người của nhà cái không kết liên minh tạm với ai
    const e = enemies.find((x) => x.kind === 'hero' && !x.house && dist(x, u) < 13 && x.hpPct > 0.45 && !onMe(ai, x) && x.attackTarget !== u && !truceOf(m, x) && !(x.ai && x.ai.mode === 'fight'));
    if (!e) return false;
    ai.truceAskT = m.time;
    // GĐ8: có kẻ đầu bảng (≥ 4 mạng, không phải hai người này) → dễ bắt tay nhau hơn để cùng hạ nó
    let lead = null, lk = 3; for (const h of m.heroes) if (h.alive && h.stats.k > lk) { lk = h.stats.k; lead = h; }
    const vsLead = lead && lead !== u && lead !== e ? 1.6 : 1;
    if (m.rngAI.next() >= Math.min(1, allyOf(u.persId)[0] * vsLead)) return false;   // tính cách không thích đề nghị
    if (ai.grudge && ai.grudge(e)) return false;                                 // đang thù thì không
    const ok = m.rngAI.next() < Math.min(1, allyOf(e.persId)[1] * vsLead) * (e.ai && e.ai.grudge(u) ? 0.2 : 1);
    ai.callout('🤝 Liên minh tạm nhé?', '#cfe8ff');
    if (ok) { ai.truceN = (ai.truceN || 0) + 1; if (e.ai) { e.ai.truceN = (e.ai.truceN || 0) + 1; e.ai.callout('🤝 Đồng ý', '#cfe8ff'); } formAlliance(m, u, e, A.dur); }
    else { m.addFeed({ type: 'truce_no', hero: u, other: e }); if (e.ai) e.ai.callout('✋ Không', '#ffd0d0'); }
    return ok;
  }
  // Bắt Nạt: yếu = vũ khí kém hơn hoặc dưới 50% máu; mạnh = vũ khí Vàng/Đỏ hoặc sức mạnh hơn hẳn
  const bullyWeak = (ai, e) => (e.yNiem || 0) < (ai.u.yNiem || 0) || e.hpPct < 0.5;
  const bullyStrong = (ai, e) => (e.yNiem || 0) >= 4 && (ai.u.yNiem || 0) < (e.yNiem || 0) || ai.power(ai.u) < ai.power(e) * 0.8;
  const alone = (m, e, R, except) => !m.heroes.some((h) => h !== e && h !== except && h.alive && dist(h, e) < R);
  const drinking = (m, e) => !!((e.cast && e.cast.key === 'potion') || (e.statuses.length && e.hasKey('pot_hp')) || (e.zoneT && m.time - e.zoneT < 6 && m.inZone(e, 0)));
  const kamikaze = (ai) => ai.u.persId === 'doimang' && (ai.kamiT || 0) > ai.m.time;
  // hành động "giữ vị trí" chỉ mạnh dần theo thời gian trận (đầu trận vẫn phải ăn quái lên cấp); tụt cấp so với mặt bằng thì giảm
  const ramp = (X, a, b) => { let lv = 0, n = 0; for (const h of X.m.heroes) if (h.alive && h !== X.u) { lv += h.level; n++; } const behind = n && X.u.level < lv / n - 2 ? 0.6 : 1; return lin(X.min, a, b) * behind; };
  const cornered = (ai, e) => dist(ai.u, e) < 4.5 && (e.st.ms >= ai.u.st.ms * 0.95 || ai.u.has('slow') || ai.u.has('root'));

  // ---------- 1) HÀNH ĐỘNG LỚN MỚI ----------
  const ACT = {
    challenge:  { name: 'Thách đấu', icon: '🤺', hold: 4 },
    guard:      { name: 'Hộ tống', icon: '🛡', hold: 3 },
    bunker:     { name: 'Giữ cứ điểm', icon: '🏰', hold: 6 },
    ambush:     { name: 'Gác lối bo', icon: '🚧', hold: 5 },
    highground: { name: 'Chiếm chỗ cao', icon: '⛰', hold: 5 },
    zealot:     { name: 'Truy sát dị giáo', icon: '📿', hold: 5 },
    chaos:      { name: 'Kích nổ', icon: '💥', hold: 2 },
    bait:       { name: 'Giăng mồi', icon: '🎣', hold: 6 },
    crawl:      { name: 'Bám mép bão', icon: '🌪', hold: 4 },
    truce:      { name: 'Liên minh', icon: '🤝', hold: 3 },
    lure:       { name: 'Theo tin đồng minh', icon: '📣', hold: 3 },
  };
  const EVAL = {
    // Võ Sĩ Danh Dự: kẻ vừa thắng một giao tranh → chờ nó hồi sức (đứng xa quan sát), rồi thách đấu tay đôi
    challenge(X) {
      const { m, u } = X; if (u.persId !== 'vosi') return null;
      let best = null, bs = 0;
      for (const f of recentKills(m, 75)) {
        const k = f.killer; if (!k.alive || k === u || (best && best.k === k)) continue;
        const p = X.per.find((q) => q.h === k); if (!p || p.age > 20) continue;
        const d = Math.hypot(p.x - u.x, p.y - u.y); if (d > 90) continue;
        const s = lin(d, 90, 8); if (s > bs) { bs = s; best = { k, p }; }
      }
      if (!best) return null;
      const ready = best.p.hp >= 0.7 || m.time - (best.k.lastDmgT || -99) > 25;
      const pt = { x: best.p.x, y: best.p.y };
      return { f: [['kẻ vừa thắng trận', floor(bs, 0.3)], ['máu mình', lin(X.hp, 0.45, 0.85)], [ready ? 'đối thủ đã hồi sức' : 'chờ đối thủ hồi sức', ready ? 1 : 0.75]], k: 1.45,
        dir: ready ? { type: 'hunt', target: best.k, point: pt, honor: true } : { type: 'stalk', target: best.k, point: pt, R: 15 } };
    },
    // Vệ Sĩ Thầm Lặng: đi theo người được bảo vệ ở 15–25 đv; ai đánh người đó → can thiệp ngay (2.0)
    guard(X) {
      const { ai, m, u } = X; if (u.persId !== 'vesi') return null;
      const w = wardOf(ai); if (!w) return null;
      const d = dist(u, w), att = w.lastAtt && m.time - (w.lastAttT || -99) < 3 ? G.ownerOf(w.lastAtt) : null;
      if (att && att.kind === 'hero' && att !== u && att.alive && d < 45 && (d < 15 || ai.power(u) > ai.power(att) * 0.6)) return { max: 2.0, f: [['người được bảo vệ bị đánh', 1]], dir: { type: 'hunt', target: att, point: { x: att.x, y: att.y }, guard: true } };
      const v = M.dir(w, u), p = { x: w.x + v.x * 18, y: w.y + v.y * 18 }; MAP.pushOut(p, 1);
      const band = d >= 13 && d <= 27;
      return { f: [['giữ khoảng cách 15–25 đv', band ? 0.55 : lin(Math.abs(d - 20), 5, 40) * 0.6 + 0.6], ['máu', lin(X.hp, 0.25, 0.6)]], k: (band ? 0.4 : 1.1) * (0.2 + 0.8 * ramp(X, 8, 16)), dir: { type: 'guard', ward: w, point: p } };
    },
    // Lãnh Chúa Cứ Điểm: chiếm công trình gần tâm bo, không rời tới khi bo ép
    bunker(X) {
      const { ai, u } = X; if (u.persId !== 'lanhchua') return null;
      const st = bunkerOf(ai, X); if (!st) return null;
      const d = dist(u, st), here = d < 8;
      return { f: [['cứ điểm trong bo', 1], ['máu', lin(X.hp, 0.2, 0.5)], [here ? 'đang giữ' : 'đường tới', here ? 1 : floor(lin(d, 200, 10), 0.4)]], k: (here ? 1.5 : 1.2) * (0.3 + 0.7 * ramp(X, 8, 14)),
        dir: { type: 'bunker', st, point: { x: st.x, y: st.y } } };
    },
    // Gác Cổng: đã vào bo kế tiếp → đứng ở mép phía những kẻ còn ngoài bo, phục kích kẻ chạy bo
    ambush(X) {
      const { m, u } = X; if (u.persId !== 'gaccong') return null;
      const z = X.zone, nx = z.next; if (!nx || z.phase < 0 || dist(u, nx) > nx.r - 2) return null;
      let tgt = null, bd = Infinity;
      for (const p of X.per) if (p.age < 25) { const dd = Math.hypot(p.x - nx.x, p.y - nx.y) - nx.r; if (dd > -2 && dd < bd) { bd = dd; tgt = p; } }
      const ref = tgt || u, v = M.dir(nx, ref), pt = { x: nx.x + v.x * Math.max(3, nx.r - 4), y: nx.y + v.y * Math.max(3, nx.r - 4) }; MAP.pushOut(pt, 1);
      const soon = z.shrinking || z.shrinkAt - m.time < 60;
      return { f: [['bo sắp co / đang co', soon ? 1 : 0.5], ['có kẻ ngoài bo', tgt ? 1 : 0.55], ['máu', lin(X.hp, 0.3, 0.6)]], k: soon ? 1.3 : 0.7, dir: { type: 'ambush', point: pt } };
    },
    // Tiên Tri Địa Hình: chiếm cao nguyên / tháp canh trong bo (1.9), đã ở trên thì giữ
    highground(X) {
      const { u } = X; if (u.persId !== 'tientri' || !MAP.plateaus.length) return null;
      let best = null, bs = 0;
      for (const p of MAP.plateaus) {
        if (dist(p, X.safe) > X.safe.r - 3) continue;
        const d = dist(u, p), crowd = X.perNear(p, p.r + 3, 5);
        const s = lin(d, 160, 5) * (crowd ? 0.3 : 1);
        if (s > bs) { bs = s; best = p; }
      }
      if (!best) return null;
      const on = u.hi && dist(u, best) < best.r;
      return { f: [['chỗ cao trong bo', floor(bs, 0.3)], ['máu', lin(X.hp, 0.2, 0.5)]], k: (on ? 1.05 : 1.6) * (0.3 + 0.7 * ramp(X, 6, 15)), dir: { type: 'highground', pl: best, point: { x: best.x, y: best.y } } };
    },
    // Cuồng Tín: truy sát dị giáo tới cùng trời cuối đất (kể cả ngoài bo) — luôn cảm nhận được vị trí dị giáo (cập nhật mỗi 5s)
    zealot(X) {
      const { ai, m, u } = X; const H = heretics(u); if (!H.length) return null;
      const h = m.heroes.find((e) => e !== u && e.alive && H.includes(e.heroId)); if (!h) return null;
      if (!ai.sense || m.time - ai.sense.t > 5) ai.sense = { x: h.x, y: h.y, t: m.time };
      const p = h.vis[u.team] ? { x: h.x, y: h.y } : { x: ai.sense.x, y: ai.sense.y };
      return { max: X.hp < 0.3 ? 0.55 : 1.6, f: [['dị giáo', 1]], dir: { type: 'hunt', target: h, point: p, zealot: true } };
    },
    // Gieo Rắc Hỗn Loạn: thùng thuốc nổ có kẻ địch đứng gần → tới kích nổ (2.0)
    chaos(X) {
      const { m, u } = X; if (u.persId !== 'honloan' || !m.barrels || !m.barrels.length) return null;
      let best = null, bs = 0;
      for (const b of m.barrels) {
        if (!b.alive || b.fuse) continue;
        const d = dist(u, b); if (d > 32) continue;
        let n = 0; for (const e of X.near) if (dist(e, b) <= C.BARREL.r + 0.5) n++;
        if (!n) continue;
        const s = n * lin(d, 32, 6); if (s > bs) { bs = s; best = b; }
      }
      if (!best) return null;
      return { max: Math.min(2.0, 1.2 + bs * 0.5), f: [['kẻ địch cạnh thùng nổ', 1]], dir: { type: 'chaos', barrel: best, point: { x: best.x, y: best.y } } };
    },
    // Thợ Săn Mồi Câu: lấy rương làm mồi, đặt bẫy quanh, núp cách 20–30 đv chờ kẻ mở rương
    bait(X) {
      const { ai, m, u } = X; if (u.persId !== 'moicau' || !m.chests) return null;
      const rp = ramp(X, 5, 12); if (rp <= 0 || m.time < (ai.baitCd || 0)) return null;
      if (ai.baitC && m.time >= (ai.baitUntil || 0) && !ai.baitCdSet) { ai.baitCd = m.time + 90; ai.baitCdSet = true; ai.baitC = null; return null; }
      let c = ai.baitC && !ai.baitC.opened && dist(ai.baitC, X.safe) < X.safe.r - 4 && m.time < (ai.baitUntil || 0) ? ai.baitC : null;
      if (!c) {
        let bd = Infinity;
        for (const q of m.chests) { if (q.opened || dist(q, X.safe) > X.safe.r - 6 || X.perNear(q, 18, 6)) continue; const d = dist(u, q); if (d < 70 && d < bd) { bd = d; c = q; } }
        if (!c) return null;
        ai.baitC = c; ai.baitUntil = m.time + 100; ai.baitSet = 0; ai.baitCdSet = false;
      }
      // cá cắn câu: kẻ địch đứng sát rương / đang mở rương
      const bite = X.near.find((e) => dist(e, c) < 5 || (e.cast && e.cast.key === 'chest'));
      if (bite) return { max: 1.9, f: [['cá cắn câu', 1]], dir: { type: 'hunt', target: bite, point: { x: bite.x, y: bite.y }, bait: c } };
      let hideP = null, hb = Infinity;
      for (const b of MAP.bushes) { const d = dist(b, c); if (d > 18 && d < 30 && d < hb) { hb = d; hideP = { x: b.x, y: b.y }; } }
      if (!hideP) { const v = M.dir(c, u); hideP = { x: c.x + v.x * 22, y: c.y + v.y * 22 }; MAP.pushOut(hideP, 1); }
      const trapsLeft = m.bagCount(u, 'trap');
      return { f: [['mồi (rương)', 1], ['máu', lin(X.hp, 0.3, 0.6)], ['kiên nhẫn', floor(lin(m.time - (ai.baitUntil - 100), 100, 40), 0.4)]], k: 1.1 * rp,
        dir: { type: 'bait', chest: c, hide: hideP, point: ai.baitSet >= Math.min(2, trapsLeft + ai.baitSet) ? hideP : { x: c.x, y: c.y } } };
    },
    // Bóng Ma Rìa Bão: đi sát mép vòng bo đang co, sau lưng mọi người
    crawl(X) {
      const { m, u } = X; if (u.persId !== 'riabao' || X.min < 5) return null;
      const z = X.zone, cur = z.cur;
      const out = !m.inZone(u, 0), charm = u.statuses.length && u.hasKey('fu_doc');
      if (out && !charm && X.hp < 0.5) return null;
      const v = M.dir(cur, u), pt = { x: cur.x + v.x * Math.max(2, cur.r - 2.5), y: cur.y + v.y * Math.max(2, cur.r - 2.5) }; MAP.pushOut(pt, 1);
      return { f: [['bo đang co', z.shrinking ? 1 : z.shrinkAt - m.time < 40 ? 0.8 : 0.45], ['máu', lin(X.hp, 0.3, 0.6)]], k: (z.shrinking ? 1.6 : 0.9) * ramp(X, 8, 14), dir: { type: 'crawl', point: pt } };
    },
    // GĐ9: tin lời đồng minh "bên kia có của" → đi tới đó (có thể là tin giả)
    lure(X) {
      const { m, u, ai } = X, L = ai.lure;
      if (!L) return null;
      if (m.time > L.until || !L.by.alive) { ai.lure = null; return null; }
      return { max: 1.45, f: [['đồng minh báo có ' + L.what, 1]], dir: { type: 'lure', point: L.point } };
    },
    // Liên minh tạm thời (mọi tướng): giúp đồng minh đánh kẻ thứ ba, đi cùng nhau; kẻ đã quyết phản bội thì chờ đồng minh sơ hở (2.0)
    truce(X) {
      const { m, u } = X;
      const p = partnerOf(m, u); if (!p || !p.alive) return null;
      if (backstabReady(m, u, p)) return { max: 2.0, f: [['đồng minh sơ hở', 1]], dir: { type: 'hunt', target: p, point: { x: p.x, y: p.y }, backstab: true } };
      // kẻ đang đánh đồng minh (tướng): lao vào giúp
      const att = p.lastAtt && m.time - (p.lastAttT || -99) < 3 ? G.ownerOf(p.lastAtt) : null;
      if (att && att.kind === 'hero' && att !== u && att.alive && dist(u, p) < 35) return { f: [['giúp đồng minh', 1], ['máu', lin(X.hp, 0.25, 0.55)]], k: 1.5, dir: { type: 'hunt', target: att, point: { x: att.x, y: att.y }, ally: true } };
      const tr = truceOf(m, u);
      if (tr && tr.meet > m.time && dist(u, p) > 6) return { f: [['gặp đồng minh đổi đồ', 1], ['máu', lin(X.hp, 0.25, 0.5)]], k: 1.15, dir: { type: 'truce', partner: p, point: { x: p.x, y: p.y } } };   // GĐ9
      const t = p.attackTarget && p.attackTarget.alive ? p.attackTarget : null;
      if (t && t !== u && dist(u, p) < 30) return { f: [['cùng đồng minh đánh', 1], ['máu', lin(X.hp, 0.3, 0.6)]], k: 1.3, dir: t.kind === 'hero' ? { type: 'hunt', target: t, point: { x: t.x, y: t.y }, ally: true } : { type: 'truce', partner: p, point: { x: p.x, y: p.y } } };
      return { f: [['đi cùng đồng minh', 0.6]], k: dist(u, p) > 20 ? 0.8 : 0.4, dir: { type: 'truce', partner: p, point: { x: p.x, y: p.y } } };
    },
  };

  // ---------- 2) CHỈNH ĐIỂM HÀNH ĐỘNG CÓ SẴN ----------
  function anyBush(X) {
    let best = null, bd = Infinity;
    for (const b of MAP.bushes) { if (dist(b, X.safe) > X.safe.r - 3 || X.perNear(b, 10, 6)) continue; const d = dist(X.u, b); if (d < bd) { bd = d; best = b; } }
    return best ? { f: [['núp kỹ', 1], ['có bụi', floor(lin(bd, 70, 5), 0.3)]], k: 0.25 + 0.75 * ramp(X, 6, 18), dir: { type: 'hide', bush: best, point: { x: best.x, y: best.y } } } : null;
  }
  const fightNoise = (m, p, R) => { for (let i = m.heroHit.length - 1; i >= 0; i--) { const h = m.heroHit[i]; if (m.time - h.t > 4) break; if (dist(h.vic, p) < R) return true; } return false; };
  // GĐ8: kẻ tham (Con Bạc, Con Bạc Khát Nước, Thực Dụng, Hổ Báo / Borg, Percy) coi Quái Thú Hoàng Kim là ưu tiên số 1 (2.0)
  const GOLD_HUNTER = { conbac: 1, khatnuoc: 1, thucdung: 1, hobao: 1 };
  function mod(X, k, r) {
    const { ai, m, u } = X, id = u.persId;
    if (k === 'boss' && r && r.dir && r.dir.target && r.dir.target.bossId === 'quai_thu' && (GOLD_HUNTER[id] || u.heroId === 'percy' || u.heroId === 'borg')) return { max: 2.0 * floor(r.f[0][1], 0.5), f: [['săn Quái Thú Hoàng Kim', 1]], dir: r.dir };
    if (r && k === 'hunt' && r.dir && r.dir.target && (partnerOf(m, u) === r.dir.target || mate(m, u, r.dir.target))) return null;   // đang đình chiến / cùng phe nhà cái: không săn
    switch (id) {
      case 'hoabinh':
        if (k === 'hide' && !r) return anyBush(X);
        if (r && r.dir && r.dir.point && (k === 'farm' || k === 'chest' || k === 'loot' || k === 'roam') && fightNoise(m, r.dir.point, 30)) r.k = (r.k == null ? 1 : r.k) * 0.25;   // tránh tiếng giao tranh
        if (k === 'retreat' && !X.engaged && X.near.some((e) => dist(e, u) < 11)) return { max: 1.1, f: [['tránh giao tranh', 1]], dir: { type: 'retreat' } };
        return r;
      case 'chuotlui':
        if (k === 'hide' && !r) return anyBush(X);
        if (k === 'retreat' && X.near.some((e) => dist(e, u) < 12) && !(X.engaged && X.near.some((e) => cornered(ai, e)))) return { max: 1.4, f: [['lủi đi', 1]], dir: { type: 'retreat' } };
        return r;
      case 'thucdung':
        if (k === 'hunt' && r) { const built = (u.yNiem || 0) >= 4 || (u.items && u.items.length >= 5); r.k = (r.k == null ? 1 : r.k) * (built ? 1.7 : 0.15); }
        return r;
      case 'batnat':
        if (k === 'hunt' && r && r.dir.target) { const e = r.dir.target; if (bullyStrong(ai, e)) return null; if (bullyWeak(ai, e)) r.k = (r.k == null ? 1 : r.k) * 2.0; }
        if (k === 'retreat' && !X.engaged) { const s = X.near.find((e) => dist(e, u) < 11 && bullyStrong(ai, e)); if (s) return { max: 1.9, f: [['kẻ mạnh hơn — giữ khoảng cách', 1]], dir: { type: 'retreat' } }; }
        return r;
      case 'gaccong':
        if (k === 'zone') {   // vào bo kế tiếp sớm 30 giây
          const z = X.zone, nx = z.next;
          if (!r && nx && dist(u, nx) > nx.r - 3) { const eta = (dist(u, nx) - nx.r + 6) / Math.max(1, u.st.ms); if (z.shrinkAt - m.time < 30 + eta) { const p = U.safePoint(X, 0.6); return { max: 1.3, f: [['vào bo sớm', 1]], dir: { type: 'zone', point: p } }; } }
        }
        return r;
      case 'khatnuoc':
        if (k === 'farm' && r && r.dir.camp && r.dir.camp.type === 'small' && (u.level >= 8 || X.min >= 10)) r.k = (r.k == null ? 1 : r.k) * 0.25;   // đủ cấp thì bỏ bãi nhỏ
        if ((k === 'drop' || k === 'boss') && r) { r.f = r.f.map(([l, v]) => (l === 'tranh chấp' || l === 'an toàn' ? [l + ' (bỏ qua)', 1] : [l, v])); r.k = k === 'drop' ? 2.0 : 1.9; }
        return r;
      case 'vesi': {
        const w = wardOf(ai);
        if (w && r && r.dir && r.dir.point && (k === 'farm' || k === 'chest' || k === 'loot' || k === 'boss' || k === 'drop') && dist(r.dir.point, w) > 45) r.k = (r.k == null ? 1 : r.k) * 0.5;
        if (w && k === 'hunt' && r && r.dir.target === w) return null;
        return r;
      }
      case 'bacle':
        if (k === 'hunt' && r && r.dir.target) { if (!alone(m, r.dir.target, 13, u)) return null; r.k = (r.k == null ? 1 : r.k) * 1.9; }
        if (k === 'roam' && r) { const s = X.safe, v = M.dir(s, u), p = { x: s.x + v.x * s.r * 0.85, y: s.y + v.y * s.r * 0.85 }; MAP.pushOut(p, 1); r.dir = { type: 'roam', point: p }; r.f = [['đi dọc rìa vắng', 0.4]]; }
        return r;
      case 'tramtuong':
        if (k === 'hunt' && r && r.dir.target) r.k = (r.k == null ? 1 : r.k) * (bountyOf(m, u)(r.dir.target) ? 2.0 : 0.25);
        return r;
      case 'tientri':
        if (k === 'hunt' && r && !u.hi) r.k = (r.k == null ? 1 : r.k) * 0.4;
        return r;
      case 'moicau':
        if (k === 'chest' && r && ai.baitC === r.dir.chest && m.time < (ai.baitUntil || 0)) return null;   // không tự mở rương đang làm mồi
        return r;
      case 'cuongtin':
        if (k === 'hunt' && r && r.dir.target && heretics(u).includes(r.dir.target.heroId)) r.k = (r.k == null ? 1 : r.k) * 2;
        return r;
      default: return r;
    }
  }

  // ---------- 3) CHỌN MỤC TIÊU ----------
  // trả false để bỏ mục tiêu; add(tên, điểm) để cộng điểm
  function tgt(ai, e, add) {
    const m = ai.m, u = ai.u, id = u.persId, me = onMe(ai, e);
    const p = partnerOf(m, u);
    if (p === e) { if (backstabReady(m, u, e)) { add('đâm sau lưng', 3); return true; } return false; }
    if (mate(m, u, e)) return false;   // GĐ9b: người của nhà cái không đánh nhau
    if (p && p.lastAtt && G.ownerOf(p.lastAtt) === e && m.time - (p.lastAttT || -99) < 3) add('đánh đồng minh', 1.5);
    switch (id) {
      case 'hoabinh': if (!me && !m.pets.some((q) => q.owner === u && q.alive && q.attackTarget === e)) return false; break;
      case 'vosi': if (!me && e.attackTarget && e.attackTarget !== u && e.attackTarget.kind === 'hero') return false; if (!me && e.hpPct < 0.4) return false; break;
      case 'batnat': if (bullyWeak(ai, e)) add('kẻ yếu', 1.5); else if (bullyStrong(ai, e) && !me) return false; break;
      case 'bacle': if (!me && !alone(m, e, 10, u)) return false; if (alone(m, e, 18, u)) add('đi lẻ', 1.0); break;
      case 'tramtuong': if (bountyOf(m, u)(e)) add('đầu bảng truy nã', 1.6); else if (!me) add('kẻ tầm thường', -0.8); break;
      case 'cuongtin': if (heretics(u).includes(e.heroId)) add('dị giáo', 3); break;
      case 'vesi': { const w = wardOf(ai); if (w === e) return false; if (wardHitBy(ai, e)) add('kẻ đánh người mình bảo vệ', 2.5); break; }
      case 'riabao': if (drinking(m, e)) add('vừa thoát bão / đang uống bình', 2.2); break;
      case 'gaccong': if (!m.inZone(e, 0)) add('kẻ chạy bo', 2); break;
      case 'lanhchua': if (inBunker(ai) && dist(e, ai.bunker) < 15) add('xâm phạm cứ điểm', 2.5); break;
      case 'moicau': if (ai.baitC && dist(e, ai.baitC) < 6) add('cắn câu', 2); break;
      default: break;
    }
    return true;
  }
  function engage(ai, e, c) {
    const m = ai.m, u = ai.u, id = u.persId, me = c.onMe;
    const pa = partnerOf(m, u);
    if (pa === e && backstabReady(m, u, e)) return true;
    if (pa && pa.lastAtt && G.ownerOf(pa.lastAtt) === e && m.time - (pa.lastAttT || -99) < 3 && c.d < c.engR + 6 && c.r > 0.5) return true;   // giúp đồng minh
    if (kamikaze(ai)) return true;
    switch (id) {
      case 'hoabinh': return me && (u.hpPct < 0.7 || m.pets.some((q) => q.owner === u && q.alive && q.attackTarget === e)) ? true : false;
      case 'chuotlui': return me && cornered(ai, e) ? true : false;
      case 'vesi': return wardHitBy(ai, e) && c.d < c.engR + 8 ? true : null;
      case 'cuongtin': return heretics(u).includes(e.heroId) && c.d < c.engR + 4 && u.hpPct > 0.25 ? true : null;
      case 'lanhchua': return inBunker(ai) && dist(e, ai.bunker) < 15 ? true : null;
      case 'gaccong': return !m.inZone(e, 0) && c.d < c.engR + 2 && c.r > 0.5 ? true : null;
      case 'riabao': return drinking(m, e) && c.d < c.engR + 3 && c.r > 0.5 ? true : null;
      case 'batnat': if (bullyStrong(ai, e) && !me) return false; return bullyWeak(ai, e) && c.r > 0.6 && c.d < c.engR + 2 ? true : null;
      case 'tientri': if (!u.hi && !me && !(e.hpPct < 0.35 && c.r > 0.8)) return false; return u.hi && c.d < u.st.range + u.r + e.r + 2 ? true : null;
      case 'bacle': return alone(m, e, 14, u) && c.r > 0.8 && c.d < c.engR + 2 ? true : null;
      case 'moicau': return ai.baitC && dist(e, ai.baitC) < 6 ? true : null;
      case 'vosi': return ai.dir && ai.dir.honor && ai.dir.target === e && c.r > 0.7 ? true : null;
      case 'thucdung': { const built = (u.yNiem || 0) >= 4 || (u.items && u.items.length >= 5); return !built && !me && c.r < 1.6 ? false : null; }
      default: return null;
    }
  }
  function retreatHp(ai, base) {
    const u = ai.u, id = u.persId;
    if (kamikaze(ai)) return 0;
    if (u.statuses.length && (u.hasKey('buff_hon') || u.hasKey('buff_phoenix'))) return 0;   // GĐ8: có mạng bảo hiểm (Thiên Hồn Chủ / Phượng Hoàng) → không chạy
    if (id === 'thoatxac') return 0.75;
    if (id === 'chuotlui' || id === 'hoabinh') return 0.45;
    if (id === 'doimang') return Math.max(base, 0.16);
    if (id === 'vesi' && ai.act === 'guard') return base * 0.6;
    if (id === 'lanhchua' && inBunker(ai)) return base * 0.5;
    return base;
  }
  function aggrMul(ai) {
    const u = ai.u, id = u.persId;
    if (kamikaze(ai)) return 3;
    if (u.statuses.length && u.hasKey('buff_minh')) return 2.0;          // GĐ8: Minh Tướng Huyết Trảm — tìm mọi cách kết liễu để hồi đầy máu + giáp
    if (u.statuses.length && (u.hasKey('buff_hon') || u.hasKey('buff_phoenix'))) return 1.5;
    if (id === 'khatnuoc') return 1 + (1 - u.hpPct) * 0.8;               // càng ít máu càng liều
    if (id === 'thucdung') return (u.yNiem || 0) >= 4 || (u.items && u.items.length >= 5) ? 1.3 : 0.9;
    if (id === 'cauton') return 0.8 + 0.45 * setDone(u);                // GĐ9: Cầu Toàn — đủ bộ mới hăng
    return 1;
  }
  // GĐ9: mức hoàn thiện bộ sở trường (0–1): món trong lối build + mảnh yêu thích đang gắn
  function setDone(u) {
    const B = u.buildPref, fav = G.favShards ? G.favShards(u.heroId) : [];
    const own = new Set(u.items || []), core = B ? [B.boots].concat(B.core) : [];
    const has = (id) => (own.has(id) ? 1 : own.has(id + '_p') ? 0.4 : 0);   // món đang ở dạng phôi tính 40%
    let a = 0; for (const id of core) a += has(id); a = core.length ? a / core.length : 0;
    const b = fav.length ? fav.filter((id) => u.shOn && u.shOn.has(id)).length / fav.length : 0;
    return a * 0.7 + b * 0.3;
  }
  const allIn = (ai) => kamikaze(ai) || (ai.u.persId === 'cuongtin' && ai.target && heretics(ai.u).includes(ai.target.heroId));

  // ---------- 6) VI MÔ ----------
  function micro(ai, enemies) {
    const m = ai.m, u = ai.u, id = u.persId;
    if (u.cast || u.dash) return false;
    // GĐ7b: liên minh tạm thời — đề nghị khi gặp nhau; đã quyết đánh đồng minh → phản bội (vỡ liên minh)
    tryAlly(ai, enemies) || tryTrade(ai, enemies);   // GĐ9: Thương Nhân / Kẻ Bịp Bợm gạ mua bán với bất kỳ ai
    const tr = truceOf(m, u);
    if (tr && ai.target && (ai.target === tr.a || ai.target === tr.b) && ai.target !== u && ai.mode === 'fight') {
      const vic = ai.target; endAlliance(m, tr, 'backstab', u);
      if (vic.ai) { vic.ai.grudges.set(u.id, m.time + 120); if (vic.ai.annoy) vic.ai.annoy.set(u.id, 200); vic.ai.callout('😡 Đồ phản bội!', '#ff8a8a'); }
      m.addFeed({ type: 'backstab', hero: u, other: vic }); ai.callout('🎭 Đâm sau lưng!', '#ff8a8a'); u.stats.backstab = (u.stats.backstab || 0) + 1;
    }
    switch (id) {
      case 'doimang': {
        // dưới 15% máu mà bị dồn: tung hết, kéo kẻ gần nhất xuống bão / ra khỏi vách
        if (!kamikaze(ai) && u.hpPct < 0.15 && enemies.some((e) => cornered(ai, e))) {
          ai.kamiT = m.time + 8; ai.callout('💣 Liều mạng!', '#ff9a5a'); m.addFeed({ type: 'kamikaze', hero: u });
          const e = enemies.reduce((a, b) => (dist(b, u) < dist(a, u) ? b : a));
          if (m.bagCount(u, 'bomb')) m.useBag(u, 'bomb', e, { x: e.x, y: e.y });
          ai.target = e; ai.mode = 'fight';
          return false;
        }
        if (kamikaze(ai) && ai.target && ai.target.alive) {
          // kéo về phía bão: đứng phía trong bo so với mục tiêu để mọi đòn đẩy hất nó ra ngoài
          const t = ai.target, cur = m.zoneSt.cur, v = M.dir(cur, t);
          if (dist(u, t) > u.st.range + u.r + t.r && !u.ranged) return false;
          if (!u.ranged && dist(u, t) < 2.5) { const p = { x: t.x - v.x * 1.4, y: t.y - v.y * 1.4 }; if (dist(p, u) > 0.6 && m.rngAI.next() < 0.3) { u.goal = p; u.attackTarget = null; return true; } }
        }
        return false;
      }
      case 'quayphan': {
        // cấu một phát rồi dây móc chuồn; bẫy trêu ngươi trên đường đối thủ đi
        if (ai.mode === 'fight' && ai.target && u.hpPct < 0.55 && m.bagCount(u, 'hook') && m.time - (ai.trollT || 0) > 6) {
          const safe = ai.safeSpot(), v = M.dir(u, safe), land = G.SkillAI.landing(u, v.x, v.y, 9, true);
          if (dist(land, u) > 4 && m.useBag(u, 'hook', null, land)) { ai.trollT = m.time; ai.callout('🤪 Chuồn đây!', '#ffd0ff'); return true; }
        }
        if (m.bagCount(u, 'trap') && m.time - (ai.trapT || 0) > 25 && enemies.some((e) => { const d = dist(e, u); return d > 7 && d < 16; }) && ai.mode !== 'fight') {
          if (m.useBag(u, 'trap', null, { x: u.x, y: u.y })) { ai.trapT = m.time; ai.callout('😜 Bẫy nè!', '#ffd0ff'); }
        }
        return false;
      }
      case 'honloan': {
        // thùng nổ trong tầm có kẻ địch đứng cạnh → bắn ngay
        if (m.barrels) for (const b of m.barrels) {
          if (!b.alive || b.fuse) continue;
          const d = dist(u, b); if (d > u.st.range + u.r + 1 || d < C.BARREL.r * 0.8) continue;
          if (enemies.some((e) => dist(e, b) <= C.BARREL.r)) { if (m.hitBarrel(u, b)) { u.face(b.x, b.y); ai.callout('💥 Bùm!', '#ffb070'); if (m.fxOn) m.fx({ type: 'swing', id: u.id, x: u.x, y: u.y, tx: b.x, ty: b.y, ranged: u.ranged }); return true; } }
        }
        return false;
      }
      case 'lanhchua': {
        // không rời cứ điểm quá 18 đv để đuổi
        if (inBunker(ai) || (ai.act === 'bunker' && ai.bunker && dist(u, ai.bunker) < 20)) {
          if (ai.mode === 'fight' && ai.target && dist(ai.target, ai.bunker) > 18 && !onMe(ai, ai.target)) { ai.target = null; ai.mode = 'idle'; u.attackTarget = null; ai.goTo(ai.bunker); return true; }
        }
        return false;
      }
      case 'tientri': {
        // đứng trên cao: không chạy xuống đuổi
        if (u.hi && ai.mode === 'fight' && ai.target && !ai.target.hi && dist(u, ai.target) > u.st.range + u.r + ai.target.r + 0.5 && !onMe(ai, ai.target)) { u.goal = null; u.attackTarget = null; return true; }
        return false;
      }
      case 'vesi': {
        const w = wardOf(ai);
        if (w && ai.mode === 'fight' && ai.target && dist(u, w) > 32 && !onMe(ai, ai.target) && !wardHitBy(ai, ai.target)) { ai.target = null; ai.mode = 'idle'; u.attackTarget = null; return true; }
        return false;
      }
      default: return false;
    }
  }
  // làm việc theo hành động mới
  function work(ai, d) {
    const m = ai.m, u = ai.u;
    switch (d.type) {
      case 'stalk': { const t = d.target; if (!t || !t.alive) { ai.decT = 0; return true; } const v = M.dir(t, u), p = { x: t.x + v.x * (d.R || 15), y: t.y + v.y * (d.R || 15) }; MAP.pushOut(p, 1); ai.stayAt(p, 2.5); return true; }
      case 'guard': { const w = d.ward; if (!w || !w.alive) { ai.decT = 0; return true; } const v = M.dir(w, u), p = { x: w.x + v.x * 18, y: w.y + v.y * 18 }; MAP.pushOut(p, 1); ai.stayAt(p, 4); return true; }
      case 'bunker': {
        const st = d.st; ai.stayAt(d.point, st.type === 'house' ? 1.6 : 2.5);
        // đặt bẫy ở lối vào
        if (dist(u, st) < 5 && m.bagCount(u, 'trap') && m.time - (ai.trapT || 0) > 3) {
          for (const e of entrances(st)) { if ((m.traps || []).some((t) => t.owner === u && dist(t, e) < 2)) continue; if (dist(u, e) > 3) { ai.goTo(e); return true; } if (m.useBag(u, 'trap', null, e)) { ai.trapT = m.time; ai.callout('🪤 Bẫy lối vào', '#e0c080'); } return true; }
        }
        return true;
      }
      case 'ambush': ai.stayAt(d.point, 2.5); return true;
      case 'crawl': ai.stayAt(d.point, 2); return true;
      case 'lure': {
        const L = ai.lure; if (!L) { ai.decT = 0; return true; }
        if (dist(u, d.point) < (L.trap ? 0.7 : 4)) {   // tới nơi: trống trơn (hoặc sập bẫy) → vỡ lẽ bị lừa
          ai.lure = null; ai.decT = 0;
          ai.callout('😤 Chẳng có gì! Bị lừa rồi', '#ffb08a'); ai.grudges.set(L.by.id, m.time + 60); (ai.cheatedBy || (ai.cheatedBy = new Set())).add(L.by.id);
          m.addFeed({ type: 'bluff_found', hero: L.by, other: u, kind: 'lure' });
          const t = truceOf(m, u); if (t && (t.a === L.by || t.b === L.by) && m.rngAI.next() < 0.6) endAlliance(m, t, 'bluff', L.by);
          return true;
        }
        ai.goTo(d.point); return true;
      }
      case 'truce': { const p = d.partner; if (!p || !p.alive) { ai.decT = 0; return true; } ai.stayAt({ x: p.x, y: p.y }, 7); return true; }
      case 'highground': {
        const P = d.pl; if (!P) { ai.decT = 0; return true; }
        if (u.hi && dist(u, P) < P.r) { ai.stayAt(P, P.r * 0.4); return true; }
        // dây móc: đu thẳng lên chỗ cao (qua vách)
        const dd = dist(u, P);
        if (m.bagCount(u, 'hook') && dd > P.r - 0.5 && dd < P.r + 8.5 && m.time - (ai.hookT || 0) > 2) {
          const v = M.dir(u, P), tp = { x: P.x - v.x * Math.max(0, P.r * 0.4), y: P.y - v.y * Math.max(0, P.r * 0.4) };
          if (dist(u, tp) <= 9 && m.useBag(u, 'hook', null, tp)) { ai.hookT = m.time; ai.callout('🪝 Lên chỗ cao', '#d8e0ff'); return true; }
        }
        ai.goTo(P); return true;
      }
      case 'chaos': {
        const b = d.barrel; if (!b || !b.alive || b.fuse) { ai.decT = 0; return true; }
        const dd = dist(u, b), R = u.st.range + u.r + 0.8;
        if (dd <= R && dd >= C.BARREL.r * 0.8) { if (m.hitBarrel(u, b)) { u.face(b.x, b.y); ai.callout('💥 Bùm!', '#ffb070'); ai.decT = 0; } return true; }
        const v = M.dir(b, u), p = { x: b.x + v.x * Math.max(C.BARREL.r + 0.5, R - 0.8), y: b.y + v.y * Math.max(C.BARREL.r + 0.5, R - 0.8) }; MAP.pushOut(p, 1); ai.goTo(p); return true;
      }
      case 'bait': {
        const c = d.chest; if (!c || c.opened) { ai.decT = 0; return true; }
        const want = Math.min(2, m.bagCount(u, 'trap') + (ai.baitSet || 0));
        if ((ai.baitSet || 0) < want) {
          const spots = [{ x: c.x + 2.2, y: c.y + 0.5 }, { x: c.x - 2.2, y: c.y - 0.5 }], s = spots[ai.baitSet || 0];
          if (dist(u, s) > 2.5) { ai.goTo(s); return true; }
          if (m.useBag(u, 'trap', null, s)) { ai.baitSet = (ai.baitSet || 0) + 1; ai.callout('🎣 Giăng mồi', '#a0e0ff'); } else ai.baitSet = want;
          return true;
        }
        ai.stayAt(d.hide, 1.5); return true;
      }
      default: return false;
    }
  }
  // vật phẩm riêng theo tính cách (gọi trước luật chung)
  function bag(ai, enemies) {
    const m = ai.m, u = ai.u, id = u.persId;
    if (id === 'honloan' && m.bagCount(u, 'bomb')) {
      // ném bom vào chỗ có ≥ 2 kẻ địch đứng gần nhau
      for (const e of enemies) { const d = dist(u, e); if (d > 6 || d < 2) continue; const n = enemies.filter((x) => dist(x, e) < 2.6).length; if (n >= 2 || (e.disabled && n >= 1 && ai.mode === 'fight')) return m.useBag(u, 'bomb', e, { x: e.x, y: e.y }); }
    }
    if (id === 'riabao' && m.bagCount(u, 'fu_doc') && m.zoneSt.dps > 0 && !m.inZone(u, 0) && !u.hasKey('fu_doc')) return m.useBag(u, 'fu_doc');
    return false;
  }

  // ---------- đăng ký vào Utility AI ----------
  Object.assign(U.ACT, ACT); Object.assign(U.EVAL, EVAL);
  for (const k of Object.keys(ACT)) if (!U.KEYS.includes(k)) U.KEYS.push(k);
  G.Persona = { setupHouse, mate, setDone, ACT, EVAL, mod, tgt, engage, retreatHp, aggrMul, allIn, micro, work, bag, wardOf, partnerOf, truceOf, bountyOf, updateAlliances, allyHit, ALLY };
})();
