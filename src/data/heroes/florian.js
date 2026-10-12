'use strict';
// ===== Florian — Kiếm Liễu • đấu sĩ múa kiếm quanh mục tiêu • mana • vật lý + chuẩn =====
// GĐ12: làm lại lần hai (đấu kiếm ba điểm).
//   • Đâm Lao 3.5s tự khóa vào ẤN CHƯA VỠ GẦN NHẤT, chạm xong lướt nhỏ 1 đv đổi góc.
//   • MỖI ấn vỡ: −1.5s mọi hồi chiêu, chậm 60% 1s, làm mới Đâm Lao, 5% máu tối đa sát thương chuẩn, hồi 0.5% máu.
//     Mốc 2/4: choáng 0.25s + hồi 2.5%. Mốc 4/4: 25% máu tối đa sát thương chuẩn, hồi 5%, đòn kế trong 3s +40% & đẩy 3 đv.
//   • Phân Ảnh xuất hiện 8 đv phía ĐỐI DIỆN qua mục tiêu, khựng 0.25s rồi lao ngược về — phá ấn phía bên kia (gọng kìm).
//   • Lướt 0 hồi chiêu, chỉ dùng trong 1.5s sau Đâm Lao/chiêu, miễn nhiễm khi lướt. Kiếm Thế Tứ Ấn giữ nguyên.
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const WP = 'flo_wp', HALF = 1.5707963;
  const LUNGE_CD = 3.5;
  const quad = (t, u) => { const a = M.atan2(u.y - t.y, u.x - t.x); return ((Math.round(a / HALF) % 4) + 4) % 4; };
  const qDir = (q) => ({ x: M.cos(q * HALF), y: M.sin(q * HALF) });
  const inForm = (m, u) => u.ws.formT > m.time;
  const markDur = (m, u) => (inForm(m, u) ? 2.5 : 5);
  // ấn gần hướng hiện tại nhất (để lao / lướt vòng tới)
  function nearestPt(t, u, s) {
    const cur = quad(t, u); let best = s.pts[0], bd = 9;
    for (const q of s.pts) { const dd = Math.min((q - cur + 4) % 4, (cur - q + 4) % 4); if (dd < bd) { bd = dd; best = q; } }
    return best;
  }
  // Tứ Ấn bắt đầu hồi chiêu (ấn đã hết / vỡ / mục tiêu gục); đang Kiếm Thế thì 0.35s sau đặt lại ấn lên mục tiêu
  function marksGone(m, u, t) {
    if ((u.cd.s1 || 0) > 50) u.cd.s1 = m.cdOf(u, 's1');
    if (inForm(m, u)) m.later(0.35, (mm) => { const x = t && t.alive ? t : u.ai && u.ai.target; if (x && x.alive && inForm(mm, u) && M.dist(u, x) < 9) placeMarks(mm, u, x, markDur(mm, u)); });
  }
  function placeMarks(m, u, t, dur) {
    if (!t || !t.alive || t.kind === 'tower' || t.kind === 'nexus') return null;
    const old = t.hasKey(WP); if (old && old.src === u) { old.pts = [0, 1, 2, 3]; old.t = dur; old.broken = 0; return old; }
    const s = m.addStatus(t, 'mark', dur, 1, { key: WP, src: u, onEnd: (mm, tt, st) => { if (!st.done) { st.done = true; marksGone(mm, u, tt); } } });
    if (s) { s.pts = [0, 1, 2, 3]; s.broken = 0; s.done = false; }
    u.ws.s1Safe = m.time + dur + 1.5;
    if (m.fxOn) m.fx({ type: 'lock', id: t.id, life: dur, color: '#ff9ad5' });
    return s;
  }
  // phá một ấn nếu đòn đánh tới từ đúng hướng (force: phá ấn gần nhất)
  function breakWP(m, u, t, force) {
    const s = t.alive && t.hasKey(WP);
    if (!s || s.src !== u || !s.pts || !s.pts.length || s.done) return false;
    let q = quad(t, u), i = s.pts.indexOf(q);
    if (i < 0 && force) { q = nearestPt(t, u, s); i = s.pts.indexOf(q); }
    if (i < 0) return false;
    s.pts.splice(i, 1); s.broken++;
    const cap = t.kind === 'hero' ? 1e9 : 150;
    // GĐ12 — MỖI ẤN: −1.5s mọi hồi chiêu, chậm 60% 1s, làm mới ngay Đâm Lao, 5% máu tối đa sát thương chuẩn, Florian hồi 0.5% máu
    for (const k of ['s1', 's2', 's3', 's4', 'sub']) if (u.cd[k] > 0 && u.cd[k] < 50) u.cd[k] = Math.max(0, u.cd[k] - 1.5);
    u.ws.lungeT = m.time;
    m.addStatus(t, 'slow', 1, 0.6, { src: u, key: 'flo_slow' });
    m.damage(u, t, Math.min(cap, t.st.maxHp * 0.05), 'true', { tag: 'p' });
    m.heal(u, u, u.st.maxHp * 0.005, true);
    if (H.T(u, '1b')) m.addStatus(u, 'haste', 2, 0.25, { key: 'flo_step' });
    if (H.T(u, '3b')) m.dot(u, t, Math.min(cap / 3, t.st.maxHp * 0.01), 3, 'phys', 'flo_bleed');
    if (m.fxOn) { const v = qDir(q); m.fx({ type: 'burst', x: t.x + v.x * (t.r + 0.4), y: t.y + v.y * (t.r + 0.4), color: '#ff9ad5' }); }
    // mốc 2/4: choáng 0.25s ngắt chiêu, hồi 2.5% máu
    if (s.broken === 2) { m.addStatus(t, 'stun', 0.25, 1, { src: u }); m.heal(u, u, u.st.maxHp * 0.025, true); if (m.fxOn) m.fx({ type: 'callout', id: t.id, text: '2/4 ẤN', color: '#ffd0f0' }); }
    if (s.pts.length > 0) return true;
    // ---- mốc 4/4 — PHÁ TRỌN BỘ: 25% máu tối đa sát thương chuẩn, hồi 5% máu, đòn kế tiếp trong 3s +40% & đẩy lùi 3 đv ----
    s.done = true; s.t = 0;
    m.damage(u, t, Math.min(cap * 3, t.st.maxHp * 0.25), 'true', { tag: 'p' });
    u.ws.empNext = true; u.ws.empT = m.time + 3;
    m.heal(u, u, u.st.maxHp * 0.05, true);
    u.stats.floFull = (u.stats.floFull || 0) + 1;
    if (H.T(u, '3c')) m.addStatus(u, 'invuln', 1, 1, { key: 'flo_imm' });
    if (H.T(u, '12a') && t.alive) { t.revealedT = Math.max(t.revealedT, m.time + 3); m.addStatus(t, 'slow', 3, 0.4, { src: u }); }
    if (H.T(u, '12c')) for (const k of ['s2', 's3', 'sub']) u.cd[k] = 0;
    if (m.fxOn) { m.fx({ type: 'callout', id: t.id, text: 'PHÁ TRỌN TỨ ẤN!', color: '#ff9ad5' }); m.fx({ type: 'ring', x: t.x, y: t.y, r: 1.8, color: '#ff9ad5' }); }
    if (inForm(m, u)) m.later(0.12, (mm) => pierce(mm, u, t));
    marksGone(m, u, t);
    if (H.T(u, '12a')) u.cd.s1 = 0;
    return true;
  }
  // phá đúng ấn q (Phân Ảnh đâm từ phía đối diện)
  function breakAt(m, u, t, q) { const fake = { x: t.x + qDir(q).x * 2, y: t.y + qDir(q).y * 2 }; const ox = u.x, oy = u.y; u.x = fake.x; u.y = fake.y; const r = breakWP(m, u, t, false); u.x = ox; u.y = oy; return r; }
  // Nộ Florian: nhát đâm xuyên thủng mọi thứ (xuyên tường, mọi kẻ địch trên đường)
  function pierce(m, u, t) {
    if (!u.alive) return;
    const v = t && t.alive ? H.dirTo(u, t) : { x: u.fx, y: u.fy };
    u.face(u.x + v.x, u.y + v.y);
    const dmg = H.amt(u, u.ws.formDmg || 100, 0.7);
    m.hitLine(u, u.x, u.y, v.x, v.y, 10, 1.6, (e) => { m.damage(u, e, dmg, 'true', { tag: 's4' }); m.knock(u, e, v.x, v.y, 1.6, 0.18); }, { color: '#ffe9ff', fx: 'thrust' });
    if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🗡 XUYÊN THỦNG!', color: '#ffe9ff' });
  }
  // phân ảnh: xuất hiện ở điểm s rồi lao về hướng (dx,dy) quãng L — trúng thì sát thương + kéo về phía Florian
  function phantom(m, u, s, dx, dy, L, dmg, pull) {
    m.hitLine(u, s.x, s.y, dx, dy, L, 1.4, (e) => {
      m.damage(u, e, dmg, 'phys', { tag: 's2' });
      if (pull) { const d = M.dist(u, e) - u.r - e.r - 0.8, w = H.dirTo(e, u); if (d > 0.2) m.knock(u, e, w.x, w.y, Math.min(1.2, d), 0.2); }
      m.addStatus(e, 'slow', 1.5, 0.3, { src: u });
    }, { color: '#ff9ad5', fx: 'phantom' });
    if (H.T(u, '3a')) { const ex = s.x + dx * L, ey = s.y + dy * L; m.later(0.25, (mm) => mm.hitCircle(u, ex, ey, 2, (e) => { mm.damage(u, e, dmg * 0.5, 'phys', { tag: 's2', aoe: true }); const w = H.dirTo({ x: ex, y: ey }, e); mm.knock(u, e, w.x, w.y, 1, 0.15); }, { color: '#ff9ad5' })); }
  }
  const lungeBonus = (u) => H.amt(u, 20 + 4 * u.level, 0.3);
  H.def({
    id: 'florian', name: 'Florian', color: '#e0e0ff', gfx: 'rapier', kit: 'fighter', pos: ['top', 'mid'], dmgType: 'phys',
    ranged: false, r: 0.6, resource: 'mana',
    stats: { hp: 590, hpG: 92, mp: 300, mpG: 38, mpr: 1.5, mprG: 0.08, ad: 60, adG: 3.6, armor: 29, armorG: 3.8, as: 0.7, asG: 0.028, ms: 3.55, range: 1.75 },
    passive: {
      name: 'Đâm Lao & Tứ Ấn',
      desc: 'Cứ 3.5s, đòn đánh thường kế tiếp thành cú Đâm Lao lướt tới mục tiêu (tới 3.5 đv ngoài tầm), +20 (+4/cấp, +30% SMVL) sát thương — mục tiêu có ấn thì tự khóa lao vào ẤN CHƯA VỠ GẦN NHẤT; chạm mũi kiếm xong lướt nhỏ 1 đv đổi góc. Đánh trúng từ ĐÚNG GÓC PHẦN TƯ của ấn để phá — MỖI ẤN: −1.5s mọi hồi chiêu, chậm 60% 1s, làm mới ngay Đâm Lao, 5% máu tối đa sát thương chuẩn, Florian hồi 0.5% máu. MỐC 2/4: choáng 0.25s, hồi 2.5% máu. MỐC 4/4: thêm 25% máu tối đa sát thương chuẩn, hồi 5% máu, đòn kế tiếp trong 3s +40% sát thương và đẩy lùi 3 đv.',
      onSkill(m, u, k) { if (k !== 'sub') u.ws.actT = m.time; },
      init(m, u) { u.ws.lungeT = 0; u.ws.parry = 0; u.ws.formT = 0; u.ws.empNext = false; u.ws.s1Safe = 0; },
      update(m, u) {
        // chốt an toàn: ấn đã mất (mục tiêu gục, đạn biến mất…) mà Tứ Ấn vẫn khóa → bắt đầu hồi chiêu
        if ((u.cd.s1 || 0) > 50 && m.time > u.ws.s1Safe) u.cd.s1 = m.cdOf(u, 's1');
        if (m.time < u.ws.lungeT || u.cast || u.dash || u.disabled || u.rooted) return;
        const t = u.attackTarget;
        if (!t || !t.alive || (t.kind !== 'hero' && t.kind !== 'monster') || !m.canHit(u, t)) return;
        const d = M.dist(u, t) - t.r - u.r, reach = H.T(u, '1a') ? 4.4 : 3.5;
        const s = t.hasKey(WP), marked = s && s.src === u && s.pts && s.pts.length && !s.done;
        if (d > u.st.range + reach) return;
        if (d <= u.st.range + 0.1 && (!marked || s.pts.includes(quad(t, u)))) return;   // đã đứng đúng chỗ: đánh thường
        let p;
        if (marked) { const v = qDir(nearestPt(t, u, s)); p = { x: t.x + v.x * (t.r + u.r + 0.3), y: t.y + v.y * (t.r + u.r + 0.3) }; }
        else { const v = H.dirTo(t, u); p = { x: t.x + v.x * (t.r + u.r + 0.3), y: t.y + v.y * (t.r + u.r + 0.3) }; }
        u.ws.lungeT = m.time + LUNGE_CD;
        m.dashTo(u, p.x, p.y, 22, { untarget: H.T(u, '6c'), onEnd: (mm) => {
          if (!t.alive || M.dist(u, t) > u.st.range + u.r + t.r + 0.6) return;
          u.ws.lunging = true; u.face(t.x, t.y); mm.autoHit(u, t); u.atkT = u.atkPeriod;
          u.ws.actT = mm.time;                                                   // mở khóa Lướt (0 hồi chiêu) 1.5s
          if (H.T(u, '6c')) breakWP(mm, u, t, true);
          // vi dịch chuyển 1.0 đv sau cú đâm: đổi góc về phía ấn kế tiếp
          const s2 = t.alive && t.hasKey(WP);
          if (s2 && s2.src === u && s2.pts && s2.pts.length && !s2.done) { const v = qDir(nearestPt(t, u, s2)), R = t.r + u.r + 0.35, q = { x: t.x + v.x * R, y: t.y + v.y * R }, d = M.dist(u, q); if (d > 0.3) { const p2 = H.toward(u, q, Math.min(1, d), true); G.MAP.pushOut(p2, u.r); mm.dashTo(u, p2.x, p2.y, 20, {}); } }
          // Kiếm Thế: kèm một phân ảnh lao tới từ phía sau mục tiêu
          if (inForm(mm, u) && t.alive) { const w = H.dirTo(u, t), s0 = { x: t.x + w.x * 4, y: t.y + w.y * 4 }; phantom(mm, u, s0, -w.x, -w.y, 4.5, H.amt(u, 30 + 6 * u.level, 0.5), false); }
        } });
        if (m.fxOn) m.fx({ type: 'dashtrail', id: u.id, x: u.x, y: u.y, x2: p.x, y2: p.y, color: '#e0e0ff' });
      },
      onAuto(m, u, t, info) {
        if (u.ws.lunging) { u.ws.lunging = false; info.amt += lungeBonus(u); }
        if (u.ws.empNext && m.time < (u.ws.empT || 1e9)) {                  // đòn cường hóa trong 3s sau khi phá trọn: +40%, đẩy 3 đv
          u.ws.empNext = false; info.amt *= 1.4;
          const k9 = H.T(u, '9c');
          info.extra.push(() => { if (!t.alive) return; const v = H.dirTo(u, t); m.knock(u, t, v.x, v.y, k9 ? 4 : 3, 0.25); if (k9) m.damage(u, t, info.amt * 0.5, 'true', { tag: 'p' }); if (m.fxOn) m.fx({ type: 'callout', id: t.id, text: 'ĐẨY CỰC MẠNH!', color: '#ffffff' }); });
        }
        if (H.T(u, '12b')) info.amt *= 1.35;                                  // Song Kiếm Quý Tộc: nhát đâm thứ hai
      },
      afterDeal(m, u, t, info) { if (info.auto || G.ITEM_IS_SKILL(info)) breakWP(m, u, t, false); },
      onKill(m, u) { if ((u.cd.s1 || 0) > 50) u.cd.s1 = m.cdOf(u, 's1'); },
      onTake(m, u, att, info) {
        if (!(u.ws.parry > m.time) || !att || att.team === u.team) return;
        info.amt = 0;
        if (u.ws.parried) return;
        u.ws.parried = true; u.ws.parry = m.time + 0.35;                      // đỡ được: bất tử thêm chút để phản đòn
        if (m.fxOn) { m.fx({ type: 'aura', id: u.id, color: '#ffffff', life: 0.4 }); m.fx({ type: 'callout', id: u.id, text: 'PHẢN ĐÒN!', color: '#ffffff' }); }
        const v = H.dirTo(u, att);
        m.damage(u, att, H.amt(u, 40 + 8 * u.level, 0.6), 'phys', { tag: 's3' });
        m.addStatus(att, 'stun', 1, 1, { src: u });
        if (M.dist(u, att) < 3.5) m.knock(u, att, v.x, v.y, 1.5, 0.2);
        if (H.T(u, '1c')) { u.cd.sub = 0; u.ws.lungeT = 0; }
        if (H.T(u, '9b')) for (const e of m.enemiesIn(u.team, u.x, u.y, 3, { heroesOnly: true })) m.addStatus(e, 'stun', 1.5, 1, { src: u });
        if (H.T(u, '6a') && att.alive) m.later(0.05, (mm) => mm.dashTo(u, att.x + v.x * 1.5, att.y + v.y * 1.5, 22, { invuln: true, onContact: (m3, uu, e) => { if (e === att) m3.damage(u, e, H.amt(u, 30 + 6 * u.level, 0.5), 'phys', { tag: 's3' }); } }));
      },
    },
    skills: {
      s1: {
        name: 'Tứ Ấn', desc: 'Ném dấu ấn 7 đv: trúng kẻ địch đầu tiên thì gây sát thương và đặt 4 ấn Đông–Tây–Nam–Bắc trong 5s. Chỉ hồi chiêu khi ấn đã hết; ném trượt thì hồi chiêu giảm 50%.',
        cd: [7, 6.5, 6, 5.5, 5], cost: [50, 50, 50, 50, 50], castTime: 0.15, manualCd: true,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([40, 60, 80, 100, 120]), 0.5);
          u.cd.s1 = 99; u.ws.s1Safe = m.time + 2;
          if (H.T(u, '6b')) {   // Vũ Điệu Lốc Xoáy: đâm xoay tại chỗ, hút nhẹ, đặt ấn lên mọi tướng trúng và phá ngay 2 ấn gần nhất
            let any = false;
            m.hitCircle(u, u.x, u.y, 2.6, (e) => {
              m.damage(u, e, dmg, 'phys', { tag: 's1', aoe: true });
              const v = H.dirTo(e, u), d = M.dist(e, u) - 1.4; if (d > 0.2) m.knock(u, e, v.x, v.y, Math.min(0.8, d), 0.15);
              if (e.kind === 'hero') { any = true; placeMarks(m, u, e, markDur(m, u)); breakWP(m, u, e, true); breakWP(m, u, e, true); }
            }, { color: '#ff9ad5' });
            if (!any) u.cd.s1 = m.cdOf(u, 's1') * 0.5;
            return;
          }
          let hit = false;
          H.shoot(m, u, ctx.pt, { speed: 20, range: 7, r: 0.45, kind: 'star',
            onHit: (mm, p, e) => { hit = true; mm.damage(u, e, dmg, 'phys', { tag: 's1' }); placeMarks(mm, u, e, markDur(mm, u)); },
            onEnd: (mm) => { if (!hit && (u.cd.s1 || 0) > 50) u.cd.s1 = mm.cdOf(u, 's1') * 0.5; } });
        },
        ai: { use: 'cc', range: 6.6, aim: 'point', speed: 20, skillshot: true, farm: 99, cond: (m, u, t) => { const s = t.hasKey && t.hasKey(WP); return !(s && s.src === u && !s.done); } },
      },
      s2: {
        name: 'Phân Ảnh', desc: 'Sinh Phân Ảnh ở phía ĐỐI DIỆN Florian qua tâm mục tiêu, cách Florian 8 đv; đứng khựng 0.25s rồi lao ngược hết tốc lực về chỗ Florian, gây sát thương vật lý mọi kẻ trên đường. Cú lao mang đặc tính Đâm Lao: chạm mục tiêu từ góc có ấn chưa vỡ thì PHÁ ẤN ĐÓ từ phía đối diện (gọng kìm phá 2 ấn cùng lúc). Đang Kiếm Thế: Florian dịch chuyển ra sau lưng mục tiêu rồi lao xuyên qua.',
        cd: [7, 6.5, 6, 5.5, 5], cost: [40, 40, 40, 40, 40], castTime: 0.12,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0.6);
          const t = ctx.tgt && ctx.tgt.alive && ctx.tgt.kind === 'hero' ? ctx.tgt : u.ai && u.ai.target;
          if (inForm(m, u) && t && t.alive && M.dist(u, t) < 9) {
            const w = H.dirTo(u, t), b = { x: t.x + w.x * 2.2, y: t.y + w.y * 2.2 };
            m.blink(u, b.x, b.y); u.face(t.x, t.y);
            m.dashTo(u, t.x - w.x * 2, t.y - w.y * 2, 24, { invuln: true, onContact: (mm, uu, e) => { mm.damage(u, e, dmg * 1.1, 'phys', { tag: 's2' }); } });
            return;
          }
          const v = t && t.alive ? H.dirTo(u, t) : H.dirTo(u, ctx.pt), src = { x: u.x + v.x * 8, y: u.y + v.y * 8 };
          if (m.fxOn) m.fx({ type: 'ring', x: src.x, y: src.y, r: 0.7, color: '#c8c8d8', life: 0.3 });
          m.later(0.25, (mm) => {
            if (!u.alive) return;
            const w = H.dirTo(src, u), L = M.dist(src, u);
            mm.hitLine(u, src.x, src.y, w.x, w.y, L, 1.4, (e) => {
              mm.damage(u, e, dmg, 'phys', { tag: 's2' });
              mm.addStatus(e, 'slow', 1.5, 0.3, { src: u });
              const sx = e.hasKey && e.hasKey(WP);
              if (sx && sx.src === u && !sx.done) { const q = quad(e, src), i = sx.pts.indexOf(q); if (i >= 0) breakAt(mm, u, e, q); }
            }, { color: '#c8c8d8', fx: 'phantom' });
            if (H.T(u, '3a')) mm.hitCircle(u, u.x, u.y, 2, (e) => { mm.damage(u, e, dmg * 0.5, 'phys', { tag: 's2', aoe: true }); }, { color: '#ff9ad5' });
          });
          if (H.T(u, '12b')) m.later(0.12, (mm) => { if (!u.alive) return; const a = M.atan2(v.y, v.x) + 0.35, w = { x: M.cos(a), y: M.sin(a) }, f2 = { x: u.x + w.x * 5.6, y: u.y + w.y * 5.6 }; phantom(mm, u, f2, -w.x, -w.y, 5.6, dmg * 0.7, true); });
        },
        // AI: gọng kìm — mục tiêu có ấn và ấn phía đối diện (nơi Phân Ảnh xuất hiện) còn nguyên
        ai: { use: 'burst', range: 7.5, aim: 'unit', farm: 3, cond: (m, u, t) => { const s = t.hasKey && t.hasKey(WP); if (!s || s.src !== u || s.done) return t.hpPct < 0.4; const v = H.dirTo(u, t); return s.pts.includes(quad(t, { x: t.x + v.x * 3, y: t.y + v.y * 3 })); } },
      },
      s3: {
        name: 'Thế Thủ', desc: 'Vào thế thủ 1s, đỡ mọi sát thương và khống chế. Bị tấn công: phản đòn gây sát thương và CHOÁNG kẻ tấn công 1s (cận chiến bị đẩy lùi). Không ai tấn công: hoàn 25% hồi chiêu.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [40, 40, 40, 40, 40],
        use(m, u, ctx) {
          if (H.T(u, '12b')) { const p = H.toward(u, ctx.pt, 4, false); m.dashTo(u, p.x, p.y, 18, { invuln: true }); return; }   // Song Kiếm: lướt tự do
          u.ws.parry = m.time + 1; u.ws.parried = false;
          m.addStatus(u, 'unstop', 1, 1, { key: 'flo_parry' });
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#e0e0ff', life: 1 });
          m.later(1.02, (mm) => { if (!u.ws.parried && u.cd.s3 > 0) u.cd.s3 *= 0.75; });
        },
        ai: { use: 'defend', aim: 'self', range: 5 },
      },
      sub: {
        name: 'Lướt', desc: 'KHÔNG hồi chiêu — chỉ dùng được trong 1.5s sau một cú Đâm Lao hoặc sau bất kỳ chiêu nào. Lướt nhanh 2.4 đv theo hướng chọn, MIỄN NHIỄM mọi sát thương & khống chế khi lướt: bẻ góc 90° sang mặt ấn kế tiếp hoặc né chiêu định hướng.',
        cd: 0.15,
        can(m, u) { return m.time - (u.ws.actT || -9) < 1.5; },
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, H.T(u, '1a') ? 3 : 2.4, true); G.MAP.pushOut(p, u.r);
          m.dashTo(u, p.x, p.y, 26, { invuln: true, unstop: true }); u.ws.actT = -9;
          if (m.fxOn) m.fx({ type: 'dashtrail', id: u.id, x: u.x, y: u.y, x2: p.x, y2: p.y, color: '#e0e0ff' });
        },
        ai: {
          use: 'custom', dodge: true,
          // vòng ra đúng hướng của ấn gần nhất; bị đuổi thì lướt lùi
          pick(m, u, t, fleeing, ai) {
            if (fleeing) return t && M.dist(u, t) < 4 ? { pt: ai.awayPoint(t, 2.4, true) } : null;
            if (!t || !t.alive) return null;
            const s = t.hasKey(WP);
            if (!s || s.src !== u || !s.pts || !s.pts.length || s.done || M.dist(u, t) > 4) return null;
            if (s.pts.includes(quad(t, u))) return null;
            const v = qDir(nearestPt(t, u, s)), R = t.r + u.r + 0.4;
            return { pt: { x: t.x + v.x * R, y: t.y + v.y * R } };
          },
        },
      },
      s4: {
        name: 'Kiếm Thế Tứ Ấn', desc: 'Trong 4s: đặt 4 ấn lên một tướng trong 5 đv; mỗi lần phá trọn 4/4 ấn được đặt lại sau 0.35s và Florian tung ngay nhát đâm XUYÊN THỦNG 10 đv (xuyên tường, 100/160/220 +70% SMVL sát thương chuẩn). Phân Ảnh thành dịch chuyển ra sau địch rồi lao; Đâm Lao kèm phân ảnh lao từ phía sau.',
        cd: [90, 75, 60], cost: [100, 100, 100], castTime: 0.1,
        can(m, u) { const t = u.ai && u.ai.target; return !!(t && t.kind === 'hero' && M.dist(u, t) < 5.5); },
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.kind === 'hero' ? ctx.tgt : u.ai && u.ai.target; if (!t || !t.alive) return;
          u.ws.formT = m.time + (H.T(u, '9a') ? 6 : 4); u.ws.formDmg = ctx.v([100, 160, 220]);
          placeMarks(m, u, t, markDur(m, u));
          u.ws.lungeT = 0; u.cd.s2 = Math.min(u.cd.s2 || 0, 0.5);
          if (m.fxOn) { m.fx({ type: 'aura', id: u.id, color: '#ff9ad5', life: u.ws.formT - m.time }); m.fx({ type: 'ring', x: u.x, y: u.y, r: 3, color: '#ff9ad5' }); }
        },
        ai: { use: 'ult', aim: 'unit', range: 5, heroOnly: true },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 4.5, role: 'fighter', bait: true, guard: (m, u) => (u.ws.parry > m.time ? { t: u.ws.parry - m.time, punish: true } : null),
      // vòng ra đúng hướng ấn còn mở gần nhất
      flank: (m, u, t) => { const s = t.hasKey && t.hasKey(WP); if (!s || s.src !== u || !s.pts || !s.pts.length || s.done) return null; return nearestPt(t, u, s) * HALF; } },
    tags: ['dive'],
  });
  G.HEROES.florian.tree = [
    [
      { name: 'Vũ Bước', desc: 'Đâm Lao lao xa hơn 25%; Lướt xa hơn (3 đv).' },
      { name: 'Điệu Nhảy Chuẩn Xác', desc: 'Phá ấn: +25% tốc chạy 2s.' },
      { name: 'Khai Màn Thanh Lịch', desc: 'Thế Thủ đỡ thành công lập tức hồi lại Lướt và Đâm Lao.' },
    ],
    [
      { name: 'Hư Ảnh Trùng Điệp', desc: 'Phân Ảnh phát nổ khi biến mất (bán kính 2, 50% sát thương, đẩy lùi 1 đv).' },
      { name: 'Tử Huyệt', desc: 'Phá ấn gây thêm Chảy Máu 1% máu tối đa/giây trong 3s.' },
      { name: 'Điệu Nhạc Bất Tử', desc: 'Phá trọn 4/4 ấn: miễn sát thương 1s.' },
    ],
    [
      { name: 'Đột Kích Hồi Mã', desc: 'Thế Thủ đỡ được đòn: lướt đâm xuyên qua kẻ tấn công ra sau lưng nó.' },
      { name: 'Vũ Điệu Lốc Xoáy', desc: 'Tứ Ấn thành đâm xoay tại chỗ (2.6 đv): hút nhẹ, đặt ấn lên mọi tướng trúng và phá ngay 2 ấn gần nhất.' },
      { name: 'Nhịp Điệu Hoàn Hảo', desc: 'Đâm Lao không thể bị chọn khi lao; trúng mục tiêu có ấn thì phá thêm 1 ấn.' },
    ],
    [
      { name: 'Cao Trào Sân Khấu', desc: 'Kiếm Thế Tứ Ấn kéo dài 6s (thay vì 4s).' },
      { name: 'Phản Đòn Hoàn Mỹ', desc: 'Thế Thủ đỡ thành công: choáng 1.5s mọi tướng địch trong 3 đv.' },
      { name: 'Vũ Điệu Tử Thần', desc: 'Đòn cường hóa sau khi phá ấn đẩy xa hơn 40% và gây thêm 50% sát thương chuẩn.' },
    ],
    [
      { name: 'Sân Khấu Tử Thần', desc: 'Phá ấn (3/4): mục tiêu bị lộ diện và chậm 40% 3s; Tứ Ấn hồi ngay.' },
      { name: 'Song Kiếm Quý Tộc', desc: 'Rút thêm kiếm phụ: đánh thường thêm nhát đâm thứ hai (+35% sát thương), Phân Ảnh tung thêm một phân ảnh lệch góc; mất Thế Thủ — S3 thành lướt tự do 4 đv.' },
      { name: 'Khúc Cao Trào Cuối Cùng', desc: 'Phá ấn (3/4): hồi ngay mọi chiêu thường (trừ chiêu cuối).' },
    ],
  ];
})();
