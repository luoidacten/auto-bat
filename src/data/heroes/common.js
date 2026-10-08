'use strict';
// ===== Khung định nghĩa tướng + hàm dùng chung cho bộ chiêu =====
// Mỗi tướng: { id, name, color, gfx, pos[], dmgType, ranged, r, resource, base{}, passive{}, skills{s1,s2,s3,s4,sub?}, ai{} }
// Mỗi chiêu: { name, desc, cd[], cost[], castTime, castMove, use(m,u,ctx), can(m,u), ai{ use, range, aim, speed, farm, cond } }
//   ai.use: 'poke' (cấu rỉa) • 'burst' (dồn sát thương khi giao tranh) • 'engage' (lao vào/khống chế mở giao tranh)
//           'cc' (khống chế) • 'escape' (thoát thân) • 'defend' (tự bảo vệ khi bị đánh) • 'support' (giúp đồng minh) • 'ult'
//   ai.aim: 'unit' | 'point' (chiêu định hướng — có đoán trước di chuyển) | 'self' | 'away' (lướt ra xa) | 'ally'
(function () {
  const G = globalThis.G || (globalThis.G = {});
  G.HEROES = G.HEROES || {};

  // khung chỉ số theo kiểu tướng (cấp 1 / tăng mỗi cấp)
  const BASE = {
    tank:     { hp: 640, hpG: 98, hpr: 1.6, hprG: 0.12, mp: 300, mpG: 40, mpr: 1.4, mprG: 0.08, ad: 60, adG: 3.6, armor: 34, armorG: 4.2, mr: 32, mrG: 2.0, as: 0.66, asG: 0.02, ms: 3.45, range: 1.7 },
    fighter:  { hp: 600, hpG: 94, hpr: 1.6, hprG: 0.12, mp: 0, mpG: 0, mpr: 0, mprG: 0, ad: 64, adG: 3.9, armor: 30, armorG: 3.8, mr: 32, mrG: 1.8, as: 0.68, asG: 0.025, ms: 3.55, range: 1.6 },
    mage:     { hp: 540, hpG: 84, hpr: 1.2, hprG: 0.1, mp: 420, mpG: 50, mpr: 2.0, mprG: 0.1, ad: 52, adG: 3.0, armor: 22, armorG: 3.6, mr: 30, mrG: 1.4, as: 0.63, asG: 0.015, ms: 3.35, range: 5.5 },
    marksman: { hp: 560, hpG: 88, hpr: 1.2, hprG: 0.1, mp: 320, mpG: 40, mpr: 1.6, mprG: 0.08, ad: 60, adG: 3.6, armor: 26, armorG: 3.8, mr: 30, mrG: 1.3, as: 0.66, asG: 0.03, ms: 3.3, range: 6.0 },
    support:  { hp: 570, hpG: 88, hpr: 1.4, hprG: 0.12, mp: 380, mpG: 45, mpr: 2.0, mprG: 0.1, ad: 50, adG: 2.6, armor: 28, armorG: 3.9, mr: 30, mrG: 1.5, as: 0.62, asG: 0.015, ms: 3.35, range: 5.0 },
  };
  const H = {
    BASE,
    def(d) {
      d.base = Object.assign({}, BASE[d.kit], d.stats || {});
      d.ai = Object.assign({ order: ['s1', 's2', 's3'] }, d.ai || {});
      d.passive = d.passive || {};
      G.HEROES[d.id] = d;
      return d;
    },
    // sát thương chiêu = gốc + tỉ lệ × SMVL + tỉ lệ × SMPT
    amt(u, base, adR, apR) { return base + (adR || 0) * u.st.ad + (apR || 0) * u.st.ap; },
    dirTo(u, p) { const dx = p.x - u.x, dy = p.y - u.y, L = Math.sqrt(dx * dx + dy * dy); return L > 1e-6 ? { x: dx / L, y: dy / L } : { x: u.fx || 1, y: u.fy || 0 }; },
    // điểm cách u một đoạn d theo hướng tới p (không vượt quá p nếu clampToP)
    toward(u, p, d, clampToP) {
      const v = H.dirTo(u, p);
      if (clampToP) { const dx = p.x - u.x, dy = p.y - u.y, L = Math.sqrt(dx * dx + dy * dy); d = Math.min(d, L); }
      return { x: u.x + v.x * d, y: u.y + v.y * d };
    },
    // bắn đạn định hướng về điểm pt
    shoot(m, u, pt, o) {
      const v = H.dirTo(u, pt);
      return m.proj(Object.assign({ owner: u, x: u.x + v.x * u.r, y: u.y + v.y * u.r, dx: v.x, dy: v.y }, o));
    },
    // đạn đuổi theo mục tiêu
    homing(m, u, t, o) {
      return m.proj(Object.assign({ owner: u, x: u.x, y: u.y, target: t }, o));
    },
    isHero: (x) => x && x.kind === 'hero',
    // nhánh tiến hóa đang có (vd H.T(u, '6b'))
    T: (u, c) => !!(u.tset && u.tset[c]),
    // hồi chiêu nội bộ cho hiệu ứng (true = sẵn sàng và bắt đầu hồi)
    ready(m, u, k, cd) { const key = 'cd_' + k; if ((u.ws[key] || 0) > m.time) return false; u.ws[key] = m.time + cd; return true; },
    moving: (u) => u.vx * u.vx + u.vy * u.vy > 0.04,
    // tướng địch gần nhất mà u đang tiến về phía nó
    chasing(m, u, R) { const e = m.nearestEnemyHero(u, R, true); return e && (e.x - u.x) * u.vx + (e.y - u.y) * u.vy > 0 ? e : null; },
    // đếm tầng của một dấu (status có key)
    stacks(t, key) { const s = t && t.hasKey ? t.hasKey(key) : null; return s ? s.n || 1 : 0; },
    // tướng địch gần nhất nhìn thấy được
    nearestEnemyHero(m, u, R) { return m.nearestEnemyHero(u, R, true); },
    // các tướng đồng minh (trừ chính mình) trong bán kính
    // ===== GĐ9: NẠP ĐẠN CHUNG cho tướng súng (theo bản Legacy: Zero, Clint, Jack, Chrono & Neo, Raven) =====
    // Thời gian nạp thực = gốc ÷ (1 + tốc đánh cộng thêm + Tốc Nạp). Tốc đánh cộng thêm = từ đồ / mảnh hồn / bùa (không tính
    // tốc đánh tăng theo cấp; phần âm không làm nạp chậm hơn). "Khóa nạp" (lock: true) bỏ qua tốc đánh, chỉ Tốc Nạp có tác dụng.
    rlTime(u, base, lock) {
      const as = lock ? 0 : Math.max(0, (u.st.asBonus || 0) - (u.base.asBonus || 0));
      return base / (1 + as + Math.max(0, u.st.reload || 0));
    },
    // cỡ băng đạn (mảnh "Ổ Đạn Mở Rộng" +35%, làm tròn lên)
    mag(u, base) { return Math.ceil(base * (1 + (u.st.magPct || 0)) - 1e-9); },
    // mảnh hồn chạm vào băng đạn (mọi tướng súng đều khai báo hero.gun / hero.gunSet)
    gun(m, u) { return u.hero && u.hero.gun && u.ws ? u.hero.gun(m, u) : null; },
    gunAdd(m, u, n) { const g = H.gun(m, u); if (!g || !u.hero.gunSet) return; u.hero.gunSet(m, u, Math.min(g.max, Math.floor(g.n) + n)); },
    gunFill(m, u, k) { const g = H.gun(m, u); if (!g) return; H.gunAdd(m, u, Math.ceil(g.max * (k == null ? 1 : k))); },
    // rút ngắn lần nạp đang chạy (×k)
    rlScale(u, k) { if (u.ws.reload > 0) u.ws.reload *= k; if (u.ws.rl > 0) u.ws.rl *= k; if (u.ws.rlMax) u.ws.rlMax *= k; u.atkT = Math.min(u.atkT, Math.max(u.ws.reload || 0, u.ws.rl || 0, 0.05)); },
    // bắt đầu / xong một lần nạp: báo cho mảnh hồn & AI (hook onReloadStart / onReload), ghi mốc thời gian
    reloadStart(m, u) { u.ws.rlStartT = m.time; u.ws.rlHurt = m.time - (u.lastDmgT || -99) < 1; if (m.heroHook) m.heroHook(u, 'onReloadStart'); },
    reloadDone(m, u) { u.ws.rlDoneT = m.time; if (m.heroHook) m.heroHook(u, 'onReload'); },
    alliesNear(m, u, R, self) {
      return m.heroes.filter((h) => h.alive && h.team === u.team && (self || h !== u) && G.M.dist(h, u) <= R);
    },
    // ===== vật triệu hồi HỘ VỆ (Oktava của Aria, Lính Tinh Nhuệ của Victoria) =====
    // • Ai đánh chủ → hộ vệ nhắm ngay kẻ đó (tướng, vật triệu hồi hay quái) và ĐUỔI tới khi chính nó đã cách chủ quá xa
    //   (o.leash đv) hoặc chủ ra lệnh THU HỒI; kẻ khác đánh chủ trong khi mục tiêu cũ đã thôi đánh chủ > 3s thì đổi sang kẻ mới.
    // • Lệnh thu hồi (u.ws.recallT): chủ rút lui / bỏ chạy, hoặc hộ vệ còn < 20% máu (chủ cứu nó) → bỏ mục tiêu, chạy về cạnh chủ.
    // • Không ai đánh chủ: đánh mục tiêu của chủ (trong o.near đv quanh chủ), hoặc đi theo đội hình (o.follow).
    guardThink(m, p, o) {
      const u = p.owner, dist = G.M.dist, leash = o.leash || 14, near = o.near || 7;
      const dU = dist(p, u);
      // ---- lệnh thu hồi của chủ ----
      const fleeing = u.ai && (u.ai.mode === 'retreat' || u.ai.act === 'retreat' || (u.ai.fleeing && u.hpPct < 0.35));
      const save = p.hpPct < 0.2 && !(p.guard && p.guard.alive && p.guard.hpPct < 0.15);
      if ((fleeing && dU > 3) || save) {
        if (!(u.ws.recallT > m.time) && u.ai && u.ai.callout) u.ai.callout('📯 Thu hồi ' + (p.name || ''), '#bfe8c8');
        u.ws.recallT = m.time + 1.5;
      }
      if (u.ws.recallT > m.time) { p.guard = null; p.attackTarget = null; p.returning = true; }
      if (p.returning) {
        if (dU < 2.2) p.returning = false;
        else { p.attackTarget = null; p.goal = { x: u.x, y: u.y }; return; }
      }
      // ---- kẻ vừa đánh chủ ----
      const valid = (e) => e && e.alive && e.team !== u.team && m.canHit(p, e);
      const att = u.lastAtt && m.time - u.lastAttT < 1.2 ? u.lastAtt : null;
      if (valid(att) && att !== p.guard && dist(att, u) < leash) {
        const cur = p.guard, curHits = cur && cur.alive && u.lastAttBy && m.time - (u.lastAttBy.get(cur.id) || -99) < 3;
        if (!cur || !cur.alive || !curHits) { p.guard = att; p.guardT = m.time; }
      }
      // ---- đang hộ vệ: đuổi tới khi quá xa chủ ----
      if (p.guard) {
        if (!valid(p.guard)) p.guard = null;
        else if (dU > leash) { p.guard = null; p.returning = true; p.attackTarget = null; p.goal = { x: u.x, y: u.y }; return; }
        else { p.attackTarget = p.guard; p.goal = null; return; }
      }
      // ---- không ai đánh chủ: phụ chủ đánh, hoặc theo chủ ----
      if (dU > near + 2) { p.attackTarget = null; p.goal = { x: u.x, y: u.y }; return; }
      const at = u.ai && u.ai.target;
      let t = valid(at) && dist(at, u) < near ? at : valid(u.attackTarget) && dist(u.attackTarget, u) < near ? u.attackTarget : null;
      if (!t && p.lastAtt && m.time - p.lastAttT < 1.5 && valid(p.lastAtt) && dist(p.lastAtt, u) < near) t = p.lastAtt;   // tự vệ
      p.attackTarget = t;
      if (!t) { const g = o.follow ? o.follow(m, p, u) : { x: u.x - u.fx * 1.2, y: u.y - u.fy * 1.2 }; p.goal = dist(p, g) > 0.8 ? g : null; }
    },
  };
  G.H = H;
})();
