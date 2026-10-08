'use strict';
// ===== UTILITY AI — QUYẾT ĐỊNH LỚN CỦA TƯỚNG (tầng chiến lược của đấu trường sinh tồn) =====
// Mỗi 0.3–0.5 giây (lệch pha theo từng tướng) chấm điểm 0–1 cho từng hành động lớn, mỗi hành động từ 3–5 yếu tố
// đi qua đường cong phản hồi (gộp bằng trung bình nhân — một yếu tố bằng 0 thì cả hành động bằng 0).
//   • Tính cách cố định của tướng = bộ trọng số nhân vào điểm từng hành động (G.PERSONALITY).
//   • Mất bình tĩnh (vừa chết, thua liên tiếp) làm lệch trọng số (liều hơn) và thêm nhiễu.
//   • Không chọn cứng hành động điểm cao nhất: BỐC NGẪU NHIÊN CÓ TRỌNG SỐ trong nhóm gần điểm cao nhất (độ ngẫu nhiên tăng khi
//     Kỷ Luật thấp / mất bình tĩnh) — người thật cũng không luôn chọn nước tối ưu.
//   • Hành động đang làm được cộng quán tính và có thời gian tối thiểu — trừ khi có việc khẩn (điểm cao hơn hẳn).
// Thông tin dùng để quyết định là thông tin tướng NHẬN THỨC được bằng mắt mình (perceive): Đọc Bản Đồ thấp → vị trí đối thủ
// ở xa cập nhật trễ, hay bỏ sót. Tin công khai (bo, thính được báo, boss xuất hiện) thì ai cũng biết.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, M = G.M, MAP = G.MAP;
  const { dist } = M;
  const MS = C.MS || 1;
  const cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  // ---------- đường cong phản hồi (x thô → 0..1) ----------
  const Curve = {
    lin: (x, a, b) => cl((x - a) / (b - a)),                                   // tuyến tính a → b (b < a: giảm dần)
    quad: (x, a, b) => { const t = cl((x - a) / (b - a)); return t * t; },     // chậm rồi nhanh
    sqrt: (x, a, b) => Math.sqrt(cl((x - a) / (b - a))),                       // nhanh rồi chậm
    logi: (x, mid, k) => 1 / (1 + Math.exp(-k * (x - mid))),                   // chữ S quanh mid
    floor: (v, f) => f + (1 - f) * v,                                          // không bao giờ dưới f (yếu tố "phụ")
  };
  const { lin, logi, floor } = Curve;

  const ACT = {
    farm:    { name: 'Ăn quái', icon: '🌲', hold: 4 },
    hunt:    { name: 'Đi săn', icon: '🎯', hold: 4 },
    boss:    { name: 'Tranh boss', icon: '👑', hold: 5 },
    drop:    { name: 'Tranh thính', icon: '📦', hold: 5 },
    zone:    { name: 'Chạy bo', icon: '🌀', hold: 3 },
    hide:    { name: 'Núp / phục kích', icon: '🌿', hold: 5 },
    heal:    { name: 'Hồi máu', icon: '💚', hold: 3 },
    vulture: { name: 'Làm kền kền', icon: '🦅', hold: 4 },
    shop:    { name: 'Đi shop', icon: '🛒', hold: 4 },
    roam:    { name: 'Đi tuần', icon: '🚶', hold: 4 },
    retreat: { name: 'Rút lui', icon: '🏃', hold: 1.5 },
    duel:    { name: 'Quyết đấu', icon: '⚔', hold: 6 },
    loot:    { name: 'Nhặt mảnh hồn', icon: '💠', hold: 3 },
    chest:   { name: 'Mở rương', icon: '🎁', hold: 3 },
  };
  const KEYS = Object.keys(ACT);
  // mất bình tĩnh: hành động liều được đẩy lên, hành động giữ mình bị kéo xuống
  const AGGR = { hunt: 1, boss: 0.6, drop: 0.6, vulture: 0.4, duel: 0.6, loot: 0.4, chest: 0.2 }, SAFE = { retreat: 1, heal: 1, hide: 0.6 };

  // ---------- NHẬN THỨC (Đọc Bản Đồ) ----------
  // Đối thủ trong tầm 13 đv: biết ngay. Ở xa (vẫn trong tầm mắt): chỉ cập nhật sau độ trễ 0.25–1.75s, mỗi lần có thể bỏ sót.
  // GĐ9: THÍNH GIÁC — đối thủ không thấy nhưng "nghe" được: tiếng giao tranh / súng nổ (30 đv), tiếng lướt / dây móc (18 đv),
  // bước chân khi chạy ngoài bụi (9 đv); bán kính ×(1 + 0.25 × Đọc Bản Đồ). Vị trí nghe được lệch tới 3 đv (Đọc Bản Đồ kém thì lệch nhiều).
  // Kẻ có mảnh Phá Sóng Nhiễu Loạn không phát ra tiếng.
  function hearOf(m, u, e, mp) {
    if (e.shOn && e.shOn.has('G_VIS_04')) return 0;
    const d = dist(e, u), k = 1 + 0.25 * mp;
    if (m.time - Math.max(e.combatT || -99, (e.ws && e.ws.lastHeroHitT) || -99) < 1.5 && d < 30 * k) return 1;
    if ((e.dash || m.time - (e.lastDashT || -99) < 0.5) && d < 18 * k) return 1;
    if (e.bush < 0 && e.vx * e.vx + e.vy * e.vy > 0.25 && d < 9 * k) return 1;
    return 0;
  }
  function perceive(ai) {
    const m = ai.m, u = ai.u, mp = ai.sk('map');
    const mem = ai.mem || (ai.mem = new Map());
    const lat = 0.25 + 1.5 * (1 - mp), pN = 0.45 + 0.55 * mp;
    const out = [];
    for (const e of m.heroes) {
      if (e === u) continue;
      let k = mem.get(e.id);
      if (e.alive && !e.vis[u.team] && (e.streak || 0) >= 3) {   // TRUY NÃ: kẻ đang chuỗi ≥ 3 mạng bị lộ vị trí với mọi người
        m.rngAI.next(); k = { x: e.x, y: e.y, hp: e.hpPct, t: m.time, next: m.time, vx: e.vx, vy: e.vy }; mem.set(e.id, k);
      } else if (e.alive && e.vis[u.team]) {
        const near = dist(e, u) < 13;
        const roll = m.rngAI.next();                       // luôn rút 1 số cho mỗi đối thủ (giữ tất định ổn định)
        if (near || (!k || m.time >= k.next) && roll < pN) { k = { x: e.x, y: e.y, hp: e.hpPct, t: m.time, next: m.time + (near ? 0 : lat), vx: e.vx, vy: e.vy }; mem.set(e.id, k); }
      } else {
        const roll = m.rngAI.next();
        // nghe thấy: cập nhật vị trí ước lượng (không biết máu), tối đa 1 lần / 0.8s
        if (e.alive && (!k || m.time - k.t > 0.8) && roll < 0.55 + 0.45 * mp && hearOf(m, u, e, mp)) {
          const err = 3 * (1 - mp), a = roll * 37.7;
          k = { x: e.x + Math.cos(a) * err, y: e.y + Math.sin(a) * err, hp: k ? k.hp : 1, t: m.time, next: m.time, vx: e.vx, vy: e.vy, heard: true }; mem.set(e.id, k);
        }
      }
      if (!e.alive) continue;                              // chết thì ai cũng biết (bảng hạ gục)
      if (!k) continue;                                    // chưa từng thấy: không biết ở đâu
      out.push({ h: e, x: k.x, y: k.y, hp: k.hp == null ? 1 : k.hp, age: m.time - k.t });
    }
    return out;
  }

  // ---------- ngữ cảnh một lần quyết định ----------
  function context(ai) {
    const m = ai.m, u = ai.u;
    const per = perceive(ai);
    const near = ai.visibleEnemyHeroes(13);
    const min = m.time / 60, alive = m.aliveCount();
    const safe = m.safeCircle();
    // GĐ8: "xem bảng thông số" — cấp và sức mạnh của mình so với mặt bằng những người còn sống (thông tin công khai)
    let lv = 0, pw = 0, n = 0; for (const h of m.heroes) if (h.alive && h !== u) { lv += h.level; pw += ai.power(h, 1); n++; }
    const behind = n ? Math.max(0, lv / n - u.level) : 0, weak = n ? ai.power(u, 1) / Math.max(1, pw / n) : 1;
    // GĐ8: kẻ đầu bảng (nhiều mạng nhất, ≥ 4 mạng, không phải mình) — ai xem bảng cũng thấy
    let leader = null, lk = 3; for (const h of m.heroes) if (h.alive && h.stats.k > lk) { lk = h.stats.k; leader = h; }
    if (leader === u) leader = null;
    return {
      ai, m, u, per, near, min, alive, safe, zone: m.zoneSt, behind, weak, leader,
      phase: min < 9 ? 'early' : min < 18 ? 'mid' : 'late',
      hp: u.hpPct, mp: u.resource === 'mana' && u.st.maxMp > 0 ? u.mp / u.st.maxMp : 1,
      ratio: near.length ? (ai.fightRatio || 1) : 4,
      myPow: ai.power(u),
      engaged: m.time - (u.combatT || -99) < 3 && near.some((e) => dist(e, u) < 12),
      inSafe: (p, pad) => dist(p, safe) <= safe.r - (pad || 0),
      perNear: (p, R, age) => per.filter((e) => Math.hypot(e.x - p.x, e.y - p.y) < R && e.age < (age || 8)).length,
      powOf: (p) => ai.power(p.h, p.hp),
    };
  }
  // điểm an toàn trong vòng bo kế tiếp: kéo về phía tâm, tránh đối thủ đã thấy
  function safePoint(X, depth) {
    const { u, safe } = X;
    const dx = u.x - safe.x, dy = u.y - safe.y, d = Math.hypot(dx, dy) || 1;
    const R = Math.max(0, safe.r * (depth == null ? 0.55 : depth));
    const p = d > R ? { x: safe.x + dx / d * R, y: safe.y + dy / d * R } : { x: u.x, y: u.y };
    MAP.pushOut(p, 1);
    return p;
  }

  // ---------- chấm điểm từng hành động: trả { f: [[nhãn, giá trị]], dir } hoặc { max, f, dir } ----------
  const EVAL = {
    farm(X) {
      const { m, u } = X;
      let best = null, bs = 0, dở = null;
      for (const c of m.camps) {
        const up = c.unit && c.unit.alive, wait = up ? 0 : c.nextAt - m.time, soon = !up && wait < 12;
        if (!up && !soon) continue;
        if (!m.inZone(c, 2)) continue;                                                   // ngoài bo hiện tại: bỏ
        // ngoài vòng bo kế tiếp: còn lâu mới co thì vẫn ăn được (điểm thấp hơn), sắp co / đang co thì bỏ
        const zk = X.inSafe(c, 3) ? 1 : (X.zone.shrinking || X.zone.shrinkAt - m.time < 45) ? 0 : 0.6;
        if (!zk) continue;
        const d = dist(u, c);
        if (soon && d / Math.max(1, u.st.ms) < wait - 5) continue;                       // tới nơi còn phải chờ lâu: thôi
        let s = lin(d, 70, 6) * (c.type !== 'small' ? 1.15 : 1) * (soon ? 0.8 : 1) * zk;
        // lượng sức: máu mất ước tính để dọn bãi này so với máu đang có (không đủ thì bỏ qua)
        if (up) { const cost = X.ai.campCost(c.unit); if (cost > u.hp * 0.85) continue; s *= floor(lin(cost / Math.max(1, u.hp), 0.8, 0.25), 0.3); }
        if (up && c.unit.aggro === u && c.unit.hp < c.unit.st.maxHp) s *= 1.8;                // đang đánh dở: làm cho xong
        const crowd = X.perNear(c, 16, 6); if (crowd) s *= Math.pow(0.55, crowd);         // có đối thủ quanh bãi: ngại
        if (X.min < 8 && u.home) s *= floor(lin(dist(c, u.home), 75, 25), 0.35);          // đầu trận: farm trong lãnh địa của mình
        if (X.min < 6 && c.own != null && c.own !== u.id) s *= c.own < 0 ? (X.min < 4 ? 0.2 : 0.7) : 0.15;   // bãi của người khác / bãi tranh chấp: né đầu trận
        if (X.ai.dir && X.ai.dir.camp === c) s *= 1.3;                                  // đang tới bãi này thì giữ (không lắc qua lắc lại)
        if (up && c.unit.aggro && c.unit.aggro !== u && c.unit.aggro.kind === 'hero' && c.unit.vis[u.team]) s *= 0.4;   // người khác đang ăn
        if (up && c.unit.aggro === u && c.unit.hp < c.unit.st.maxHp) { dở = c; s = Math.max(s, 1); }
        if (s > bs) { bs = s; best = c; }
      }
      if (dở) best = dở, bs = Math.max(bs, 1);                                            // đã đánh dở thì ăn cho hết bãi rồi mới đi
      if (!best) return null;
      // GĐ8: tụt cấp / yếu hơn mặt bằng → đi farm thêm cho cân bằng; tính cách thủ lấy farm làm mục tiêu chính
      const catchK = Math.min(2.2, 1 + 0.3 * X.behind + (X.weak < 0.85 ? 0.5 * (0.85 - X.weak) / 0.35 : 0)) * (u.pers && u.pers.style === 'safe' ? 1.2 : 1);
      return { f: [['bãi quái', floor(cl(bs), 0.15)], ['máu', logi(X.hp, 0.3, 12)], ['an toàn', floor(lin(X.perNear(best, 18), 2, 0), 0.2)],
        ['giai đoạn', X.alive <= 3 ? 0.35 : X.phase === 'late' ? 0.65 : 1], ['còn cần KN/vàng', floor(lin(u.level, 18, 10), 0.5)]],
        k: (dở ? 1.5 : 1) * catchK, dir: { type: 'farm', camp: best, point: { x: best.x, y: best.y } } };
    },
    hunt(X) {
      const { ai, u } = X;
      let best = null, bs = 0;
      for (const p of X.per) {
        if (p.age > 6) continue;
        const e = p.h, d = Math.hypot(p.x - u.x, p.y - u.y);
        if (d > 40 * MS) continue;
        // máu con mồi lúc mình tới nơi: ngoài giao tranh nó tự hồi 2%/s
        const eta = d / Math.max(1, u.st.ms), hpAt = Math.min(1, p.hp + C.OOC_HP * Math.max(0, eta + p.age - C.OOC_DELAY));
        const r = X.myPow / Math.max(1, X.powOf({ h: e, hp: hpAt }));
        const others = X.per.filter((o) => o !== p && o.age < 8 && Math.hypot(o.x - p.x, o.y - p.y) < 14).length;   // đứng lẻ thì dễ ăn
        let s = lin(r, 1.2, 2.3) * lin(d, 40 * MS, 8) * floor(lin(others, 2, 0), 0.25);
        if (hpAt < 0.4) s *= 1.3 + (0.4 - hpAt) * 2.5;                                  // KS: con mồi yếu máu hấp dẫn hơn nhiều
        if (hpAt < 0.4 && u.shOn && u.shOn.has('G_VIS_02')) s *= 2;                     // GĐ9: Nhiệt Ảnh — thấy kẻ yếu máu xuyên tường: kết liễu ×2
        if ((e.streak || 0) >= 3) s *= 1.3;                                               // truy nã: kẻ đang chuỗi hạ gục
        if (X.leader === e) s *= 1.35;                                                    // GĐ8: kẻ đầu bảng (nhiều mạng nhất, ≥ 4) — ai cũng muốn hạ
        if (ai.grudge(e)) s *= 1.25;                                                     // thù dai
        if (u.persId === 'amsat' && (e.hero.kit === 'marksman' || e.hero.kit === 'mage')) s *= 1.15;
        if (!X.inSafe(p, 2)) s *= 0.6;
        if (s > bs) { bs = s; best = p; }
      }
      if (!best) return null;
      // kiên nhẫn: đuổi một con mồi quá lâu mà không hạ được thì chán (Kỷ Luật cao thì bỏ sớm hơn)
      const hs = ai.huntSince && ai.huntSince.id === best.h.id ? X.m.time - ai.huntSince.t : 0;
      const pat = 18 - 8 * ai.sk('disc');
      // giai đoạn nhân THẲNG (không qua trung bình nhân): đầu trận ít đi săn hẳn
      // còn ≤ 3 người: hạng cao đã chắc → giữ mạng chờ bo ép (chỉ săn khi chênh lệch lớn)
      const top3 = X.alive <= 3 ? 0.5 : 1;
      return { k: floor(lin(X.min, 4, 25), 0.2) * (ai.lastLife() ? 0.8 : 1) * top3, f: [['con mồi', cl(bs)], ['máu mình', logi(X.hp, 0.6, 10)], ['kiên nhẫn', floor(lin(hs, pat + 12, pat), 0.1)]],
        dir: { type: 'hunt', target: best.h, point: { x: best.x, y: best.y } } };
    },
    // GĐ8: 4 ổ boss — chọn boss đáng tranh nhất: giá trị phần thưởng × khả năng hạ (thời gian hạ so với thời gian trụ được)
    // × khoảng cách × đông người. Có người đang đánh boss (cả bản đồ được báo) → cơ hội tranh / cướp khi boss gần chết.
    boss(X) {
      const { ai, m, u } = X;
      if (!m.lairSt) return null;
      let best = null, bs = 0, bf = null;
      for (const S of m.lairSt) {
        const B = S.unit; if (!B || !B.alive) continue;
        const D = B.bossDef, d = dist(u, B);
        if (d > 280) continue;
        const res = u.hero.dmgType === 'magic' ? B.st.mr : B.st.armor, myD = ai.dps(u) * 0.85 * 100 / (100 + (res || 0)), tKill = B.hp / Math.max(1, myD);
        const bossDps = B.st.ad * B.st.as * 100 / (100 + (u.st.armor || 0)) * 1.8, tLive = ai.ehp(u) * (1 + 0.25 * Math.min(3, (u.pots && u.pots.hp) || 0)) / Math.max(1, bossDps);
        const feas = lin(tLive / Math.max(1, tKill), 0.5, 1.4);
        const fighting = m.time - (B.lastHeroT || -99) < 8, fighter = B.lastHero && B.lastHero !== u ? B.lastHero : null;
        const steal = B.hpPct < 0.7 && fighting && fighter && d < 60 * MS;                           // ưu tiên tranh/cướp boss ngay khi máu đã xuống thấp
        const others = X.perNear(B, 18, 4);
        const zk = X.inSafe(B, 4) ? 1 : (X.zone.shrinking || X.zone.shrinkAt - m.time < 60) ? 0.2 : 0.6;
        let s = (D.value || 1) * floor(lin(d, 300, 20), 0.3) * zk;
        let f = steal ? 1 : floor(feas, 0.03);
        if (fighting && fighter && !steal) f *= floor(lin(ai.power(u) / Math.max(1, ai.power(fighter, fighter.hpPct)), 0.6, 1.4), 0.15) * 1.25;   // tranh với kẻ đang đánh
        s *= f * (steal ? floor(lin(others, 4, 0), 0.4) : floor(lin(others, 3, 0), 0.25));
        if (s > bs) { bs = s; best = B; bf = { steal, fighting, feas }; }
      }
      if (!best) return null;
      return { f: [[bf.steal ? 'cướp boss' : bf.fighting ? 'tranh boss' : 'đủ sức hạ boss', floor(cl(bs), 0.05)], ['máu', logi(X.hp, 0.55, 10)]],
        k: (bf.steal ? 2.1 : bf.fighting ? 1.35 : 1.2) * (X.alive <= 3 ? 0.6 : 1), dir: { type: 'boss', target: best, point: { x: best.x, y: best.y } }
      };
    },
    drop(X) {
      const { m, u } = X;
      let best = null, bs = -1;
      for (const d of m.drops) {
        if (!d.warned || d.taken) continue;
        const dd = dist(u, d), s = lin(dd, 260, 8);
        if (s > bs) { bs = s; best = d; }
      }
      if (!best) return null;
      const eta = Math.max(0, best.at - m.time), dd = dist(u, best);
      const contest = X.perNear(best, 14, 5);
      return { f: [['thính', best.landed ? 1 : floor(lin(eta - dd / Math.max(1, u.st.ms), 30, 0), 0.5)], ['khoảng cách', floor(lin(dd, 260, 10), 0.2)],
        ['tranh chấp', floor(lin(contest, 3, 0), 0.2)], ['máu', logi(X.hp, 0.5, 10)], ['trong bo', X.inSafe(best, 2) ? 1 : 0.4]],
        dir: { type: 'drop', drop: best, point: { x: best.x, y: best.y } } };
    },
    zone(X) {
      const { m, u, safe } = X, z = X.zone;
      const curOut = !m.inZone(u, 1);
      const dOut = dist(u, safe) - Math.max(0, safe.r - 3);
      if (dOut <= 0 && !curOut) return null;
      const tLeft = z.next ? Math.max(1, z.shrinkEnd - m.time) : 30;
      const need = (Math.max(0, dOut) / Math.max(0.5, u.st.ms)) / tLeft;
      const press = lin(need, 0.12, 0.7);
      // GĐ9: Tiên Tri Vòng Bo — biết tâm bo sớm: bỏ farm lẻ, tới chiếm chỗ trước 45s + thời gian đi đường
      const oracle = u.shOn && u.shOn.has('G_VIS_01') && z.next && !z.shrinking && z.shrinkAt - m.time < 45 + Math.max(0, dOut) / Math.max(0.5, u.st.ms) ? 0.85 : 0;
      const s = curOut ? 1 : Math.max(press, oracle);
      if (s <= 0) return null;
      return { max: s, f: [['ngoài bo', curOut ? 1 : 0], ['áp lực thời gian', press]], dir: { type: 'zone', point: safePoint(X, 0.5) } };
    },
    hide(X) {
      const { m, u, safe } = X;
      if (X.alive > 6 && X.min < 15) return null;
      let best = null, bd = Infinity;
      for (const b of MAP.bushes) {
        if (dist(b, safe) > safe.r - 3) continue;
        if (X.perNear(b, 10, 6)) continue;
        const d = dist(u, b); if (d < bd) { bd = d; best = b; }
      }
      if (!best) return null;
      return { f: [['cuối trận', lin(X.alive, 7, 2)], ['có bụi trong bo', floor(lin(bd, 70, 5), 0.3)], ['an toàn', floor(lin(X.near.length, 2, 0), 0.2)]],
        dir: { type: 'hide', bush: best, point: { x: best.x, y: best.y } } };
    },
    heal(X) {
      const { ai, u } = X;
      const need = lin(X.hp, 0.8, 0.35);
      if (need <= 0) return null;
      const pot = u.pots && u.pots.hp > 0, regen = u.hasKey('pot_hp');
      if (!pot && !regen) return null;                                  // không có bình thì phải đi mua (Đi shop)
      const close = X.near.filter((e) => dist(e, u) < 12).length;
      return { f: [['cần hồi', need], ['có bình', pot ? 1 : 0.6], ['đang yên', close ? 0.25 : 1]],
        dir: { type: 'heal', point: ai.restSpot(X) } };
    },
    // cổng quyết đấu: tới ghi danh khi tự tin vào sức mình (so với người đã ghi danh, hoặc với đối thủ trung bình)
    duel(X) {
      const { ai, m, u } = X, D = m.duelSt, g = D && D.gate;
      if (!g || g.state !== 'open' || u.duel) return null;
      const d = dist(u, g), eta = d / Math.max(1, u.st.ms), left = g.until - m.time;
      if (eta > left - 4) return null;
      if (g.a === u) return { max: 1, f: [['đã ghi danh, chờ đối thủ', 1]], dir: { type: 'duel', gate: g, point: { x: g.x, y: g.y } } };
      let ratio;
      if (g.a) ratio = X.myPow / Math.max(1, ai.power(g.a));
      else { let s = 0, n = 0; for (const p of X.per) if (p.age < 60) { s += X.powOf(p); n++; } ratio = n ? X.myPow / Math.max(1, s / n) : 1; }
      return { f: [['tự tin', lin(ratio, 0.55, 1.35)], ['máu', lin(X.hp, 0.5, 0.9)], ['đường tới', floor(lin(d, 170, 25), 0.35)], ['phần thưởng', g.a ? 1 : 0.85]],
        k: 1.9, dir: { type: 'duel', gate: g, point: { x: g.x, y: g.y } } };     // thưởng lớn (vàng, KN, mảnh hồn Tím) → hút mạnh hơn ăn quái
    },
    // nhặt mảnh hồn rơi từ tướng bị hạ: cụm mảnh càng giá trị (tổng bậc) và càng gần càng hấp dẫn.
    // Ở gần (kẻ vừa hạ gục, người đứng cạnh) thì nhặt ngay; ở xa chỉ đi nhặt khi quanh đó không có đối thủ nào
    // (tránh cả bản đồ đổ về một chỗ làm trận kết thúc quá sớm).
    loot(X) {
      const { m, u } = X, O = m.soulOrbs;
      if (!O || !O.length) return null;
      const favs = G.favShards ? G.favShards(u.heroId) : [], strict = !!(u.pers && u.pers.strict);
      const want = new Map(), W = (q) => { let w = want.get(q); if (w == null) { w = !(q.ej && q.from === u) && m.soulRoom(u, q.tier, q.type); want.set(q, w); } return w; };
      let best = null, bs = 0;
      for (const o of O) {
        const d = dist(u, o); if (d > 30) continue;
        if (!W(o)) continue;
        if (d / Math.max(1, u.st.ms) > o.until - m.time) continue;
        if (!X.inSafe(o, 1) && (X.zone.shrinking || X.zone.shrinkAt - m.time < 20) && d > 6) continue;   // ngoài bo sắp co
        let val = 0; for (const q of O) if (dist(q, o) < 3 && W(q)) val += q.tier + (favs.includes(q.type) ? (strict ? 6 : 2) : 0);   // GĐ9: mảnh yêu thích (Cầu Toàn: săn bằng được)
        if (d > 10 && X.perNear(o, 12, 4) > (val >= 4 ? 1 : 0)) continue;                               // ở xa mà quanh đó đông người: thôi
        const sc = lin(val, 0, 8) * lin(d, 30, 2);
        if (sc > bs) { bs = sc; best = o; }
      }
      if (!best) return null;
      const d = dist(u, best), rivals = X.perNear(best, 10, 3);
      return { f: [['mảnh hồn', floor(cl(bs * 1.4), 0.2)], ['máu', lin(X.hp, 0.2, 0.55)], ['ít người tranh', floor(lin(rivals, 2, 0), 0.25)]],
        k: d < 8 ? 1.6 : 0.9, dir: { type: 'loot', orb: best, point: { x: best.x, y: best.y } } };
    },
    // GĐ7: rương đồ — gần, vắng người, balo còn chỗ (rương vẫn cho vàng khi balo đầy nên vẫn đáng mở, chỉ kém hấp dẫn hơn)
    chest(X) {
      const { m, u } = X, CH = m.chests;
      if (!CH || !CH.length || !u.bag) return null;
      const room = u.bag.slots.length < m.bagCap(u) ? 1 : 0.45;
      let best = null, bs = 0;
      for (const c of CH) {
        if (c.opened) continue;
        const d = dist(u, c); if (d > 45) continue;
        if (!X.inSafe(c, 2) && (X.zone.shrinking || X.zone.shrinkAt - m.time < 25)) continue;
        const crowd = X.perNear(c, 12, 5); if (d > 8 && crowd > 0) continue;
        const sc = lin(d, 45, 3);
        if (sc > bs) { bs = sc; best = c; }
      }
      if (!best) return null;
      const d = dist(u, best);
      return { f: [['rương', floor(bs, 0.2)], ['balo trống', room], ['máu', lin(X.hp, 0.25, 0.6)], ['vắng người', floor(lin(X.perNear(best, 14, 5), 2, 0), 0.2)], ['không bị đánh', m.time - u.lastDmgT > 2 ? 1 : 0.15]],
        k: d < 10 ? 1.25 : 0.75, dir: { type: 'chest', chest: best, point: { x: best.x, y: best.y } } };
    },
    vulture(X) {
      const { ai, m, u } = X;
      let best = null, bs = 0;
      const seenPair = new Set();
      for (let i = m.heroHit.length - 1; i >= 0; i--) {
        const h = m.heroHit[i];
        if (m.time - h.t > 1.5) break;
        const a = h.att, b = h.vic;
        if (a === u || b === u || !a.alive || !b.alive || a.kind !== 'hero' || b.kind !== 'hero') continue;
        if (u.permWith && G.Persona && (G.Persona.mate(m, u, a) || G.Persona.mate(m, u, b))) continue;   // GĐ9b: không làm kền kền người cùng phe nhà cái
        const key = Math.min(a.id, b.id) + ':' + Math.max(a.id, b.id); if (seenPair.has(key)) continue; seenPair.add(key);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, d = dist(u, mid);
        // thấy tận mắt, hoặc NGHE tiếng giao tranh trong bán kính 35–55 đv (Đọc Bản Đồ cao nghe xa hơn)
        if (!(a.vis[u.team] && b.vis[u.team]) && d > 35 + 20 * ai.sk('map')) continue;
        const hpAvg = (a.hpPct + b.hpPct) / 2, big = Math.max(X.powOf({ h: a, hp: a.hpPct }), X.powOf({ h: b, hp: b.hpPct }));
        const s = floor(lin(d, 55 * MS, 8), 0.2) * lin(hpAvg, 1.0, 0.4) * floor(lin(X.myPow / Math.max(1, big), 0.5, 1.3), 0.3);
        if (s > bs) { bs = s; best = { a, b, mid }; }
      }
      if (!best) return null;
      return { f: [['có giao tranh', cl(bs * 1.8)], ['máu mình', logi(X.hp, 0.5, 10)]],
        dir: { type: 'vulture', a: best.a, b: best.b, point: best.mid } };
    },
    shop(X) {
      const { m, u } = X;
      if (u.perks && u.perks.has('cua_hang')) return null;          // GĐ7b: Cửa Hàng Online — mua ở bất cứ đâu, không cần đi
      const need = m.nextBuyCost(u);
      const potNeed = u.pots && u.pots.hp < 2 && u.gold >= G.CONSUMABLES.hp_m.cost * 2 ? (X.hp < 0.6 ? 1 : 0.7) : 0;
      const ready = Math.max(potNeed, !need ? 0 : u.gold >= need.full ? 1 : u.gold >= need.comp ? 0.6 : u.gold >= 1300 ? 0.75 : 0);
      if (!ready) return null;
      let best = null, bd = Infinity;
      for (const t of MAP.merchants) { const d = dist(u, t) + (X.inSafe(t, 3) ? 0 : 150); if (d < bd) { bd = d; best = t; } }
      return { f: [['đủ tiền', ready], ['khoảng cách', floor(lin(dist(u, best), 220, 10), 0.25)], ['an toàn', floor(lin(X.perNear(best, 16), 2, 0), 0.2)],
        ['máu', potNeed ? 1 : logi(X.hp, 0.3, 10)], ['trong bo', X.inSafe(best, 3) ? 1 : 0.3]], dir: { type: 'shop', merchant: best, point: { x: best.x, y: best.y } } };
    },
    roam(X) {
      return { f: [['đi tuần', 0.28]], dir: { type: 'roam', point: X.ai.roamPoint(X) } };
    },
    retreat(X) {
      const { ai, u } = X;
      const enemies = X.near.filter((e) => dist(e, u) < 13);
      if (!enemies.length) return null;
      // GĐ8: AI tinh ý thấy đối thủ mang bùa Rồng (Long Hỏa 240s) → câu giờ, né giao tranh chờ bùa hết
      if (!X.engaged && ai.smart && ai.smart() && enemies.some((e) => e.statuses.length && e.hasKey('buff_long') && !(u.statuses.length && u.hasKey('buff_long')))) return { max: 1.9, f: [['né kẻ mang bùa Rồng', 1]], dir: { type: 'retreat' } };
      if (X.engaged) {
        // đã vào giao tranh: chỉ chạy khi máu dưới ngưỡng (~10%) VÀ thấy không thắng nổi; tướng lì đòn không bao giờ chạy
        const thr = ai.retreatHp();
        if (thr <= 0 || X.hp >= thr || X.ratio >= 1.05) return null;
        return { max: 1, f: [['máu cạn, không thắng nổi', 1]], dir: { type: 'retreat' } };
      }
      // chưa đánh: lượng sức — thấy kẻ mạnh hơn hẳn đang tới thì tránh
      const s = lin(X.ratio, 0.7, 0.4) * (u.fstyle === 'allin' ? 0.6 : 1);
      if (s <= 0) return null;
      return { max: s, f: [['đối thủ mạnh hơn hẳn', s]], dir: { type: 'retreat' } };
    },
  };

  // ---------- trọng số theo tính cách tướng + tâm lý ----------
  function weights(ai) {
    const u = ai.u, W = {};
    const pw = (u.pers && u.pers.w) || {};
    for (const k of KEYS) W[k] = pw[k] != null ? pw[k] : 1;
    const tilt = u.tilt || 0;
    for (const k in AGGR) W[k] *= 1 + 0.35 * tilt * AGGR[k];
    for (const k in SAFE) W[k] *= 1 - 0.3 * tilt * SAFE[k];
    // đang có chuỗi hạ gục: tự tin hơn
    const st = Math.min(4, u.streak || 0);
    if (st) { W.hunt *= 1 + 0.06 * st; W.hide *= 1 - 0.05 * st; }
    return W;
  }

  // ---------- quyết định ----------
  // force: quyết ngay (nguy hiểm khẩn) — bỏ qua thời gian tối thiểu
  function decide(ai, force) {
    const m = ai.m, u = ai.u;
    const X = context(ai);
    const W = weights(ai);
    const disc = ((u.player.stats || {}).disc || 10) / 20, tilt = u.tilt || 0;
    const noiseA = 0.02 + 0.08 * tilt;                                 // do dự / bốc đồng
    const list = [];
    const baseOf = (r) => { if (r.max != null) return r.max; let prod = 1; for (const [, v] of r.f) prod *= Math.max(0, v); return Math.pow(prod, 1 / r.f.length) * (r.k == null ? 1 : r.k); };
    // GĐ8: núp bụi lâu thì "chán" (25s bắt đầu giảm, 60s còn 15%), tụt hậu thì đi farm thay vì núp
    const dtD = Math.max(0, m.time - (ai.decLastT || m.time)); ai.decLastT = m.time;
    if (ai.act === 'hide' && u.bush >= 0) ai.hideAcc = (ai.hideAcc || 0) + dtD; else ai.hideAcc = Math.max(0, (ai.hideAcc || 0) - dtD * 0.5);
    const hideK = floor(lin(ai.hideAcc || 0, 60, 25), 0.15) * (X.alive > 4 && (X.behind >= 1.5 || X.weak < 0.8) ? 0.35 : 1);
    for (const k of KEYS) {
      const r00 = EVAL[k](X), r0 = G.Persona ? G.Persona.mod(X, k, r00) : r00;   // GĐ7: tính cách chỉnh điểm
      const r = r0 && k === 'hide' ? Object.assign({}, r0, { k: (r0.k == null ? 1 : r0.k) * hideK }) : r0;
      const noise = m.rngAI.range(-noiseA, noiseA);                     // luôn rút số (tất định ổn định)
      if (!r) continue;
      const base = baseOf(r);
      let s = base * W[k];
      const why = [];
      if (ai.act === k) { const ib = (0.35 + 0.1 * disc) * (force ? 0.5 : 1); s += ib; why.push(`đang làm +${ib.toFixed(2)}`); }   // GĐ6b: động lực làm tiếp 0.35–0.45
      if (W[k] !== 1) why.push(`tính cách ×${W[k].toFixed(2)}`);
      if (r.k != null && r.k !== 1) why.push(`giai đoạn ×${r.k.toFixed(2)}`);
      s += noise;
      list.push({ k, s, base, f: r.f, why, dir: r.dir });
    }
    list.sort((a, b) => b.s - a.s || (a.k < b.k ? -1 : 1));
    let pick = list[0];
    // bốc ngẫu nhiên có trọng số trong nhóm gần điểm cao nhất (Kỷ Luật thấp / mất bình tĩnh → bốc "lệch" nhiều hơn)
    const roll = m.rngAI.next();
    if (pick) {
      const T = 0.03 + 0.05 * (1 - disc) + 0.06 * tilt;
      const cands = list.filter((x) => x.s >= list[0].s - 0.12).slice(0, 3);
      let tot = 0; for (const c of cands) { c.w = Math.exp((c.s - list[0].s) / T); tot += c.w; }
      let r = roll * tot;
      for (const c of cands) { r -= c.w; if (r <= 0) { pick = c; break; } }
    }
    // quán tính: chưa đủ thời gian tối thiểu thì giữ việc đang làm, trừ khi việc mới hơn hẳn (khẩn)
    const cur = list.find((x) => x.k === ai.act);
    if (!force && cur && pick && pick !== cur && m.time - (ai.actT || 0) < ACT[ai.act].hold && pick.s < cur.s + 0.45) pick = cur;
    if (!pick) pick = { k: 'roam', s: 0, f: [], why: [], dir: { type: 'roam', point: ai.roamPoint(X) } };
    if (pick.k !== ai.act) { ai.act = pick.k; ai.actT = m.time; }
    if (pick.k === 'hunt' && pick.dir.target) { if (!ai.huntSince || ai.huntSince.id !== pick.dir.target.id) ai.huntSince = { id: pick.dir.target.id, t: m.time }; }
    else if (ai.huntSince && m.time - ai.actT > 15) ai.huntSince = null;
    ai.actDir = pick.dir;
    // 3 hành động điểm cao nhất kèm lý do (gỡ lỗi + nhật ký suy nghĩ)
    ai.top3 = list.slice(0, 3).map((x) => ({ k: x.k, name: ACT[x.k].name, icon: ACT[x.k].icon, s: Math.round(x.s * 100) / 100,
      why: x.f.map(([l, v]) => `${l} ${Math.round(v * 100)}%`).concat(x.why).join(' · ') }));
    return pick;
  }
  G.UtilityAI = { Curve, ACT, KEYS, perceive, context, decide, weights, EVAL, safePoint };
})();
