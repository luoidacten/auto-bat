'use strict';
// ===== Vương Quốc Phía Đông: Wukong (Côn Kim Cô) & Kazuki (Song Kiếm Cổ Đạo) =====
// Quy đổi: 1m ≈ 40px.

// ---------- Wukong ----------
// Côn Thức: lấy bậc cường hóa cho chiêu A/B/C sắp dùng (0 thường • 1 Tiểu Côn Thức • 2 Đại Côn Thức)
function conTier(f, key) {
  const fo = f.ws.focus;
  if (fo >= 100) { f.ws.focus = 0; return 2; }
  if (fo >= 50) { f.ws.focus -= 50; return 1; }
  // Đại Thánh Hàng Thế: A và B tự cường hóa bậc 1 miễn phí
  if (f.ws.ultT > 0 && (key === 'A' || key === 'B')) return 1;
  return 0;
}
function addFocus(f, m, n) {
  const before = f.ws.focus;
  f.ws.focus = Math.min(100, f.ws.focus + n);
  // Côn Khí Tự Sinh: chạm mốc 50 / 100 → hồi ngay A, B, C
  if (f.T('wukong_9a') && ((before < 50 && f.ws.focus >= 50) || (before < 100 && f.ws.focus >= 100))) {
    for (const k of ['A', 'B', 'C']) f.cd[k] = 0;
    if (m) m.text(f.x, f.y - 66, '🌀 CÔN KHÍ TỰ SINH', '#ffd24a', 14);
  }
}
// Khí Ấn: trúng chiêu cường hóa → +1 tầng (đủ 2 thì D sáng đèn)
function addQi(f, t, m) {
  if (t.isMinion) return;
  const q = t.qiMark && t.qiMark.owner === f && t.qiMark.until > m.time ? t.qiMark : { owner: f, n: 0 };
  q.n = Math.min(2, q.n + 1); q.until = m.time + 8;
  t.qiMark = q;
  m.text(t.x, t.y - 62, q.n >= 2 ? '☯ KHÍ ẤN x2 — ĐỊNH THÂN!' : '☯ KHÍ ẤN', '#ffd24a', q.n >= 2 ? 15 : 13);
}
function qiTarget(f, m) {
  let best = null, bd = 520;
  for (const e of m.fighters) {
    if (e.team === f.team || !e.alive || !e.qiMark || e.qiMark.owner !== f || e.qiMark.n < 2 || e.qiMark.until < m.time) continue;
    const d = dist(f, e); if (d < bd) { bd = d; best = e; }
  }
  return best;
}
// hóa đá: bất chấp đang trên không hay đang tung chiêu (trừ Bất Tử)
function petrify(t, m, dur) {
  if (!t.alive || t.has('immortal')) return;
  t.status.stun = { t: dur, p: 0, max: dur };
  t.action = null; t.cancelDash(); t.vx = t.vy = 0; t.pull = null; t.arcPull = null; t.hitstun = 0;
  t._stoneUntil = m.time + dur;
}
function wkSpin(f, m, tier) {
  const R = (f.T('wukong_1c') ? 132 : 110) * (tier >= 2 ? 2 : 1);
  // gạt đạn (Phong Áp Cản Đạn: chặn cả đạn hạng nặng)
  for (const p of m.projs) {
    if (p.dead || p.owner.team === f.team || Math.hypot(p.x - f.x, p.y - f.y) > R + 10) continue;
    if (f.T('wukong_3a') || (p.r <= 8 && !p.breaker && p.kind !== 'bigarrow')) { p.dead = true; m.particle(p.x, p.y, { color: '#ffe9a0', life: 0.25, size: 4, vx: rand(-150, 150), vy: rand(-150, 150) }); }
  }
  if (tier === 0) {
    f.act(0.5, { move: 0.5, anim: 'spin', atk: true }, [[0.12, () => {
      m.hitCircle(f, { r: R, dmg: 5, kb: 105, kg: 3.8, tag: 'A' });
      m.fx({ type: 'whirl', x: f.x, y: f.y, r: R * 0.9, a: f.facing, color: '#ffd24a', life: 0.3, w: 7 });
    }]]);
    return;
  }
  // Vòng Xoáy Chân Không: hút vào tâm rồi vung một đòn hất văng
  f.act(0.6, { move: 0.1, anim: 'spin', atk: true, super: true }, [[0.05, () => {
    for (const e of m.enemiesOf(f)) if (dist(e, f) < R * 1.8 && !e.has('unstoppable')) pullTo(f, e, f.r + e.r + 26, 900, 0.25);
    m.fx({ type: 'ring', x: f.x, y: f.y, r: R * 1.8, color: '#ffe9a0', life: 0.35, w: 6 });
  }], [0.38, () => {
    const hs = m.hitCircle(f, { r: R, dmg: 7 + 2 * tier, kb: 210 + 40 * tier, kg: 6, tag: 'A', emp: tier });
    for (const e of hs) addQi(f, e, m);
    m.fx({ type: 'whirl', x: f.x, y: f.y, r: R, a: f.facing, color: '#ffd24a', life: 0.35, w: 12 }); m.shake(5);
  }]]);
  m.text(f.x, f.y - 60, tier >= 2 ? '🌪️ ĐẠI CÔN THỨC!' : '🌪️ CÔN THỨC!', '#ffd24a', 15);
}
// Kình Thiên Trụ — cú đập cuối (charge 0..1 theo thời gian gồng trên đỉnh côn)
function wkSlam(f, m, tier, charge) {
  const full = tier > 0 && charge >= 0.98 && f.T('wukong_9c');
  const R = full ? 2000 : tier > 0 ? (130 + 120 * charge) * (tier >= 2 ? 1.4 : 1) : 115;
  const stun = tier > 0 ? 1.5 + charge : 0;
  for (const e of m.enemiesOf(f)) {
    if (e.z > 20 || dist(e, f) > R + e.r) continue;
    if (full) for (const s of ['ironbody', 'unstoppable', 'stance', 'absorb', 'block', 'rarmor']) e.removeStatus(s);
    const ok = m.applyHit(f, e, tier > 0 ? { dmg: 9 + 6 * charge, kb: 200 + 160 * charge, kg: 6.5, tag: 'C', angle: angTo(f, e), emp: tier }
      : { dmg: 8, kb: 120, kg: 4, knockup: 300, tag: 'C', angle: angTo(f, e) });
    if (ok && stun) e.addStatus('stun', stun);
    if (ok && tier > 0) addQi(f, e, m);
  }
  if (f.T('wukong_3b')) m.zone({ owner: f, x: f.x, y: f.y, r: Math.min(R, 260), life: 3, every: 0.2, kind: 'crack', color: 'rgba(110,80,30,0.35)',
    tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r) e.addStatus('slow', 0.3, 0.5); } });
  m.fx({ type: 'ring', x: f.x, y: f.y, r: Math.min(R, 700), color: '#ffd24a', life: 0.5, w: tier > 0 ? 14 : 8 });
  m.fx({ type: 'boom', x: f.x, y: f.y, r: Math.min(R, 260) * 0.6, color: '#ffb02a', life: 0.4 });
  m.shake(tier > 0 ? 10 + 8 * charge : 6); m.sfx(tier > 0 ? 'boom_big' : 'impact');
  if (full) m.text(f.x, f.y - 80, '🗻 CỘT TRỤ TRỜI CHẤN ĐỘNG!', '#ffd24a', 20);
}

// ---------- Kazuki ----------
function kzNeed(f) { return f.T('kazuki_12c') ? { si: 7, mind: 75 } : { si: 10, mind: 100 }; }
function kzPush(f, key, m) {
  const win = f.T('kazuki_1b') ? 2.5 : 1.5;
  if (m.time - (f.ws.lastT || -9) > win) f.ws.seq = [];
  f.ws.seq = f.ws.seq.concat(key).slice(-2); f.ws.lastT = m.time;
}
function kzForm(f, m) {
  const win = f.T('kazuki_1b') ? 2.5 : 1.5;
  return m.time - (f.ws.lastT || -9) <= win && f.ws.seq.length === 2 ? f.ws.seq.join('') : '';
}
function kzSlashProjs(f, m, R) {
  let n = 0;
  for (const p of m.projs) {
    if (p.dead || p.owner.team === f.team || p.breaker) continue;
    const d = Math.hypot(p.x - f.x, p.y - f.y);
    if (d > R + 20 || Math.abs(angDiff(f.facing, Math.atan2(p.y - f.y, p.x - f.x))) > 1.1) continue;
    if (p.r > 9 && p.kind === 'bigarrow') continue;
    p.dead = true; n++;
    m.particle(p.x, p.y, { color: '#e0f0ff', life: 0.25, size: 4, vx: rand(-160, 160), vy: rand(-160, 160) });
  }
  // Đoạt Mệnh Trảm Đạn: chém trúng đạn hồi 5% Ý Niệm
  if (n && f.T('kazuki_6c')) f.ws.mind = Math.min(100, f.ws.mind + 5 * n);
}
function kzSpeed(f) { return f.ws.mind >= 50 ? 0.85 : 1; }
function kzFormDone(f, m, label) {
  f.ws.si = Math.min(10, f.ws.si + 1); f.ws.mind = Math.min(100, f.ws.mind + 25); f.ws.seq = [];
  m.text(f.x, f.y - 66, `⚔️ ${label}`, '#9ad0ff', 16);
}
// Loạn Vũ Hư Ảnh: ảo ảnh lao vào chém từ nhiều hướng, khóa chặt rồi hất tung
function kzStorm(f, t, m, free) {
  if (!t || !t.alive) return;
  if (!free) f.ws.si -= 5;
  const N = f.T('kazuki_9c') ? 8 : 5, kbK = f.T('kazuki_9c') ? 1.4 : 1;
  if (!t.has('unstoppable')) { t.addStatus('root', 1.5); t.addStatus('stun', 1.5); }
  for (let i = 0; i < N; i++) m.later(0.12 + i * (1.2 / N), () => {
    if (!t.alive) return;
    const a = i * TAU / N + rand(-0.2, 0.2), sx = t.x + Math.cos(a) * 90, sy = t.y + Math.sin(a) * 90;
    m.fx({ type: 'ghost', x: sx, y: sy, r: f.r, color: '#9ad0ff', life: 0.25 });
    m.fx({ type: 'slash', x: t.x, y: t.y, a: a + Math.PI, r: 50, color: '#cfe8ff', life: 0.2 });
    m.applyHit(f, t, { dmg: 1.6, noKnock: true, tag: 'C', quiet: true });
    m.sfx('sword_cut', { vol: 0.5, rate: 1.2 });
  });
  m.later(1.45, () => {
    if (!t.alive) return;
    m.applyHit(f, t, { dmg: 5, kb: 185 * kbK, kg: 5.2 * kbK, knockup: 500, tag: 'C', angle: angTo(f, t) });
    m.shake(8);
    if (f.T('kazuki_6b')) f.ws.stormEnd = { t: 1.2, target: t };
  });
  m.text(f.x, f.y - 70, '🌸 LOẠN VŨ HƯ ẢNH!', '#9ad0ff', 18);
}

Object.assign(WEAPONS, {
  // ================= CÔN KIM CÔ (Wukong) =================
  con: {
    name: 'Côn Kim Cô', icon: '🐒', color: '#e0a030', weight: 1.02, speed: 1.08, gfx: 'staff',
    role: 'Đấu sĩ tầm trung • Khống chế khu vực', ai: { range: 120, defend: ['C'] },
    passive: { name: 'Côn Thức Vũ', desc: 'Sải tay dài (tầm 2.5–3.2m); trúng bằng đầu mút côn +20% lực đẩy. Thanh Côn Thức: +6% mỗi đòn trúng, +10% khi bị đánh, +20% khi né chuẩn bằng C. Đủ 50%: chiêu A/B/C kế tiếp cường hóa bậc 1 (tốn 50%); đủ 100%: bậc tối đa (tốn 100%, phạm vi x2). Trúng chiêu cường hóa: địch nhận 1 Khí Ấn — đủ 2 Khí Ấn thì D sáng đèn.' },
    init(f) { f.ws.focus = f.ws.focus || 0; f.ws.ultT = 0; f.ws.pole = null; f.ws.bTrip = 0; f.ws.bTarget = null; f.ws.bell = 0; },
    resource(f, m) {
      const t = m && qiTarget(f, m);
      return `🐒 Côn Thức ${Math.floor(f.ws.focus)}%` + (f.ws.focus >= 100 ? ' ★★' : f.ws.focus >= 50 ? ' ★' : '') + (t ? ' • ☯ D: ĐỊNH THÂN' : '') + (f.ws.ultT > 0 ? ` • 👑 ${f.ws.ultT.toFixed(1)}s` : '') + (f.ws.pole ? ` • 🗼 gồng ${f.ws.pole.t.toFixed(1)}s` : '');
    },
    update(f, m, dt) {
      if (f.ws.ultT > 0) { f.ws.ultT -= dt; f.frameSpeed *= 1.35; }
      if (f.ws.bTrip > 0) f.ws.bTrip -= dt;
      // Côn Khí Tự Sinh: điểm văng vượt 80% → nạp đầy Côn Thức (hồi 30s)
      if (f.T('wukong_9a') && f.percent > 80 && m.time > (f.ws.autoCd || 0) && f.ws.focus < 100) { f.ws.autoCd = m.time + 30; addFocus(f, m, 100); }
      const p = f.ws.pole;
      if (p) {
        p.t += dt;
        f.moveDir = { x: 0, y: 0 }; f.invulnT = Math.max(f.invulnT, 0.1); f.addStatus('untargetable', 0.15);
        if (Math.random() < dt * 6) m.particle(f.x, f.y - 30, { color: '#ffe9a0', life: 0.5, size: 4, vx: rand(-40, 40), vy: -60 });
        if (p.t >= p.hold || f.has('stun') || !f.alive) {
          f.ws.pole = null; f.removeStatus('untargetable');
          // Đẩu Vân Đạp Tuyết: lướt thêm 1 nhịp trên không về phía mục tiêu
          const t = m.nearestEnemy(f);
          if (f.T('wukong_6c') && t) { const a = angTo(f, t), L = Math.min(100, Math.max(0, dist(f, t) - 40)); const q = m.arena.clamp({ x: f.x + Math.cos(a) * L, y: f.y + Math.sin(a) * L }, f.r + 4); f.x = q.x; f.y = q.y; }
          wkSlam(f, m, p.tier, clamp(p.t / 3, 0, 1));
          f.act(0.25, { move: 0, anim: 'raise' });
        }
      }
    },
    onDeal(f, t, hit, info, m) {
      if (hit.range && hit.dist / hit.range > 0.72 && !hit.quiet) info.kbMult *= 1.2;
      if (hit.tag === 'B' && hit.emp) info.kbMult *= 1 + 0.5 * Math.max(0, t.weight - 1);
      if (f.ws.ultT > 0) info.kbMult *= 1.4;
      if (!hit.emp && !hit.quiet && !t.isMinion && (hit.tag === 'A' || hit.tag === 'B' || hit.tag === 'C')) addFocus(f, m, f.T('wukong_1a') ? 9 : 6);
    },
    onTake(f, att, hit, info, m) { if (att && !att.isEnv && !hit.quiet) addFocus(f, m, 10); },
    onDodge(f, att, m) { if (f.ws.cDodge > m.time) { f.ws.cDodge = 0; addFocus(f, m, 20); m.text(f.x, f.y - 70, '+20% Côn Thức', '#ffd24a', 12); } },
    // Hộ Thân Kim Cang: lồng chuông chặn 1 đòn, đẩy bật kẻ tấn công
    onIncoming(f, att, hit, m) {
      if (!(f.ws.bell > m.time) || !att || att.isEnv) return true;
      f.ws.bell = 0;
      const o = att.owner || att;
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 60, color: '#ffd24a', life: 0.4, w: 8 }); m.text(f.x, f.y - 56, '🔔 KIM CANG!', '#ffd24a', 16); m.sfx('sword_clash', { rate: 0.7 });
      if (o.alive && dist(o, f) < 300) m.applyHit(f, o, { dmg: 4, kb: 260, kg: 4, tag: 'A', angle: angTo(f, o) });
      return false;
    },
    // Kim Cang Bất Hoại: đang Nộ thì cân đẩu vân kéo về giữa sàn
    onFall(f, m) {
      if (!(f.T('wukong_12c') && f.ws.ultT > 0)) return true;
      const p = m.arena.clamp({ x: 0, y: 0 }, f.r + 4);
      f.x = p.x; f.y = p.y; f.vx = f.vy = 0; f.hitstun = 0; f.invulnT = Math.max(f.invulnT, 0.8);
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 70, color: '#ffffff', life: 0.5, w: 8 }); m.text(f.x, f.y - 66, '☁️ CÂN ĐẨU VÂN!', '#ffffff', 18);
      return false;
    },
    skills: {
      A: { name: 'Toàn Phong Côn', cd: 1.5, desc: 'Đánh tích: xoay côn 360° quanh người 0.5s, gạt đạn nhỏ và hất lùi kẻ cận chiến. Côn Thức: xoay gấp đôi tạo Vòng Xoáy Chân Không hút mọi kẻ địch vào tâm rồi vung đòn hất văng.',
        ai: { type: 'atk', max: 135, pri: 2.4 },
        use(f, m) {
          if (f.T('wukong_6b')) {
            f.ws.bell = m.time + 1.2;
            f.act(0.35, { move: 0.2, anim: 'raise' });
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#ffd24a', life: 1.2, w: 4 });
            return;
          }
          wkSpin(f, m, conTier(f, 'A'));
        } },
      B: { name: 'Trực Thích Thấu Kình', cd: 3, desc: 'Kết liễu: thúc đuôi côn thẳng về trước, đẩy lùi 2m. Côn Thức: côn phóng dài gấp đôi, xuyên mọi vật cản, bỏ qua 50% kháng đẩy lùi và hất văng cực mạnh.',
        ai: { type: 'atk', min: 50, max: 150, pri: 2.4 },
        // Hoành Tảo Đoạt Mệnh: trượt chân quét ngang, hất ngã
        recast(f) { return f.T('wukong_6a') && f.ws.bTrip > 0 && f.ws.bTarget && f.ws.bTarget.alive; },
        recastAi: (f, t, m, d) => d < 200,
        recastUse(f, m) {
          const t = f.ws.bTarget; f.ws.bTrip = 0; f.ws.bTarget = null;
          const a = angTo(f, t);
          f.startDash({ angle: a, dist: Math.max(0, dist(f, t) - 50), dur: 0.16, trail: true });
          f.act(0.4, { move: 0, anim: 'swing', atk: true }, [[0.18, () => {
            const hs = m.hitArc(f, { range: 120, arc: 160, angle: a, dmg: 5, kb: 60, kg: 1.5, tag: 'B' });
            for (const e of hs) { e.addStatus('stun', 1); m.text(e.x, e.y - 54, 'NGÃ!', '#ffd27a', 14); }
          }]]);
        },
        use(f, m) {
          const tier = conTier(f, 'B');
          const L = (f.T('wukong_1c') ? 156 : 130) * (tier > 0 ? 2 : 1) * (tier >= 2 ? 1.2 : 1);
          f.act(0.42, { move: 0.1, anim: 'thrust', atk: true, windup: 0.12 }, [[0.14, () => {
            const hs = m.hitLine(f, { len: L, w: tier > 0 ? 44 : 36, dmg: tier > 0 ? 9 : 7, kb: tier > 0 ? 255 : 170, kg: tier > 0 ? 7 : 5.8, tag: 'B', emp: tier });
            for (const e of hs) {
              if (tier > 0) addQi(f, e, m);
              if (f.T('wukong_3c')) e.wallStun = { until: m.time + 0.9, stun: 1.25 };
              if (f.T('wukong_6a')) { f.ws.bTrip = 1; f.ws.bTarget = e; }
            }
            m.fx({ type: 'thrust', x: f.x, y: f.y, a: f.facing, len: L, w: tier > 0 ? 22 : 14, color: '#ffd24a', life: 0.25 });
            if (tier > 0) m.shake(5);
          }]]);
        } },
      C: { name: 'Kình Thiên Trụ', cd: 7, desc: 'Cắm côn bật người lên không (Bất Tử 0.8s) rồi bổ xuống hất tung nhẹ. Côn Thức: đứng trên đỉnh côn KHÔNG THỂ BỊ NHẮM, giữ gồng tối đa 3s (côn càng dài) rồi giáng cú đập khổng lồ: CHOÁNG 1.5–2.5s và đẩy văng diện rộng mọi kẻ địch chạm đất.',
        ai: { type: 'def', max: 220, mob: 'escape' },
        use(f, m) {
          const tier = conTier(f, 'C');
          f.ws.cDodge = m.time + 0.9;
          const t = m.nearestEnemy(f);
          // Phân Thân Hầu Vương: phân thân dưới sàn xoay côn hút địch
          if (f.T('wukong_12a')) {
            const sx = f.x, sy = f.y;
            for (let i = 0; i < 4; i++) m.later(i * 0.12, () => m.fx({ type: 'ghost', x: sx, y: sy, r: f.r, color: '#e0a030', life: 0.25 }));
            m.later(0.3, () => {
              for (const e of m.enemiesOf(f)) if (Math.hypot(e.x - sx, e.y - sy) < 200 && !e.has('unstoppable')) { const a = Math.atan2(sy - e.y, sx - e.x), L = Math.max(0, Math.hypot(e.x - sx, e.y - sy) - 30); e.pull = null; e.vx += Math.cos(a) * L * 4; e.vy += Math.sin(a) * L * 4; }
              m.fx({ type: 'whirl', x: sx, y: sy, r: 100, a: 0, color: '#e0a030', life: 0.35, w: 8 }); m.text(sx, sy - 50, '🐒 PHÂN THÂN!', '#e0a030', 14);
            });
          }
          if (tier === 0) {
            const a = t ? angTo(f, t) : f.castAngle, L = (f.T('wukong_1b') ? 125 : 100);
            f.invulnT = Math.max(f.invulnT, 0.8);
            f.vz = 520; f.z = Math.max(f.z, 1);
            f.startDash({ angle: a, dist: L + (f.T('wukong_6c') ? 100 : 0), dur: 0.6, through: true, phase: true });
            f.act(0.65, { move: 0, anim: 'raise' }, [[0.62, () => wkSlam(f, m, 0, 0)]]);
            return;
          }
          // đứng trên đỉnh côn: thời gian gồng do AI quyết (tối đa 3s)
          const hold = f.ws.holdWant || (f.brain ? f.brain.holdTime(3, f) : 1.5);
          f.ws.holdWant = 0;
          f.ws.pole = { t: 0, hold: clamp(hold, 0.4, 3), tier };
          f.act(clamp(hold, 0.4, 3) + 0.05, { move: 0, anim: 'raise', charge: clamp(hold, 0.4, 3) });
          m.text(f.x, f.y - 66, '🗼 KÌNH THIÊN TRỤ!', '#ffd24a', 16);
        } },
      D: { name: 'Định Thân Thuật', cd: 10, desc: 'Chỉ dùng được khi một kẻ địch có đủ 2 Khí Ấn: chỉ tay HÓA ĐÁ mục tiêu 2s — bất chấp đang trên không hay đang tung chiêu, triệt tiêu mọi quán tính.',
        ai: { type: 'atk', max: 520, pri: 4 },
        can(f, m) { return !!qiTarget(f, m); },
        use(f, m) {
          const t = qiTarget(f, m); if (!t) return;
          t.qiMark = null; f.facing = angTo(f, t);
          petrify(t, m, 2);
          if (f.T('wukong_9b')) for (const e of m.enemiesOf(f)) if (e !== t && dist(e, t) < 80) e.addStatus('stun', 2);
          f.act(0.25, { move: 0, anim: 'thrust' });
          m.fx({ type: 'line', x1: f.x, y1: f.y, x2: t.x, y2: t.y, color: '#ffe9a0', life: 0.3, w: 3 });
          m.fx({ type: 'ring', x: t.x, y: t.y, r: 40, color: '#c0c0c0', life: 2, w: 6 });
          m.text(t.x, t.y - 70, '🗿 ĐỊNH!', '#e0e0e0', 22); m.sfx('magic_spell', { rate: 0.8 }); m.shake(6);
        } },
      U: { name: 'Đại Thánh Hàng Thế', desc: 'Sóng xung chấn hoàng kim đẩy lùi 360° mọi kẻ địch quanh mình ra phía mép sàn. Trong 6s: KHÔNG THỂ CẢN PHÁ, +35% tốc chạy, +40% lực đẩy văng; A và B tự cường hóa Côn Thức miễn phí.',
        ai: { type: 'buff', max: 520 },
        use(f, m) {
          const t = m.nearestEnemy(f);
          // Vạn Trượng Kim Bổng: côn khổng lồ đè bẹp nửa sàn theo hướng chỉ định
          if (f.T('wukong_12b') && t && t.percent > 70) {
            const a = angTo(f, t);
            m.fx({ type: 'thrust', x: f.x, y: f.y, a, len: 900, w: 120, color: '#ffd24a', life: 0.5 });
            for (const e of m.enemiesOf(f)) {
              if (Math.cos(angDiff(a, angTo(f, e))) < 0) continue;
              if (e.percent > 70 && !e.isMinion && !e.has('immortal')) m.applyHit(f, e, { dmg: 8, kb: 2600, kg: 0, unblockable: true, tag: 'U', angle: a });
              else m.applyHit(f, e, { dmg: 12, kb: 260, kg: 7, tag: 'U', angle: a });
            }
            m.text(f.x, f.y - 76, '🏯 VẠN TRƯỢNG KIM BỔNG!', '#ffd24a', 21); m.shake(18); m.sfx('boom_big');
            return;
          }
          for (const e of m.enemiesOf(f)) if (dist(e, f) < 320) m.applyHit(f, e, { dmg: 6, kb: 380, kg: 3, tag: 'U', angle: angTo(f, e) });
          f.ws.ultT = 6; f.addStatus('unstoppable', 6); f.addStatus('haste', 6, 0.35);
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 320, color: '#ffd24a', life: 0.6, w: 14 }); m.shake(12);
        } },
    },
  },

  // ================= SONG KIẾM CỔ ĐẠO (Kazuki) =================
  song_kiem: {
    name: 'Song Kiếm Cổ Đạo', icon: '⚔️', color: '#9ad0ff', weight: 1.0, speed: 1.12, gfx: 'twinblades',
    role: 'Đấu sĩ tiết tấu • Phản đòn & chuỗi kiếm thế', ai: { range: 80, defend: ['D'] },
    passive: { name: 'Song Kiếm Vô Niệm', desc: 'Tay trái A (nhanh) và tay phải B (nặng) luân phiên; trúng bằng rìa lưỡi kiếm +20% lực đẩy. Ý Niệm tự hồi 2%/s (+25% mỗi Kiếm Thế); từ 50% vào Minh Kính Chỉ Thủy: đánh nhanh hơn 15%. Kiếm Ý: +1 mỗi Kiếm Thế, +5 mỗi lần phản đòn. Chuỗi 2 đòn trước quyết định Kiếm Thế của C (nhớ trong 1.5s).' },
    init(f) { f.ws.mind = f.ws.mind ?? 30; f.ws.si = f.ws.si || 0; f.ws.seq = []; f.ws.lastT = -9; f.ws.parryT = 0; f.ws.ripT = 0; f.ws.stormEnd = null; },
    ultReady(f) { const n = kzNeed(f); return f.ws.si >= n.si && f.ws.mind >= n.mind; },
    resource(f, m) {
      const form = m ? kzForm(f, m) : '';
      return `🧘 Ý Niệm ${Math.floor(f.ws.mind)}%${f.ws.mind >= 50 ? ' 💧' : ''} • 🗡️ Kiếm Ý ${f.ws.si}/10` + (form ? ` • C: ${form}` : '') + (f.ws.ripT > 0 ? ' • ↯ D: TRẢM KHÍ' : '') + (f.ws.stormEnd ? ' • ↯ C: QUY NHẤT' : '');
    },
    update(f, m, dt) {
      f.ws.mind = Math.min(100, f.ws.mind + (f.T('kazuki_1a') ? 3.5 : 2) * dt);
      if (f.ws.ripT > 0) f.ws.ripT -= dt;
      if (f.ws.stormEnd) { f.ws.stormEnd.t -= dt; if (f.ws.stormEnd.t <= 0) f.ws.stormEnd = null; }
      if (f.T('kazuki_12a')) f.frameSpeed *= 1.35;
      // đỡ hụt: khựng nhẹ 0.3s
      if (f.ws.parryT > 0) { f.ws.parryT -= dt; if (f.ws.parryT <= 0 && f.has('parry')) { f.removeStatus('parry'); f.act(0.3, { move: 0 }); } }
    },
    onDeal(f, t, hit, info) {
      if (hit.range && hit.dist / hit.range > 0.7 && (hit.tag === 'A' || hit.tag === 'B')) info.kbMult *= 1.2;
      info.kbMult *= 0.9; // cân bằng
    },
    // Vô Tướng Nghịch Trảm: phản đòn thành công
    onIncoming(f, att, hit, m) {
      if (!f.has('parry') || !att || att.isEnv || att === f) return true;
      const o = att.owner || att;
      f.removeStatus('parry'); f.ws.parryT = 0; f.action = null; f.invulnT = Math.max(f.invulnT, 0.4);
      m.text(f.x, f.y - 56, '☯ NGHỊCH TRẢM!', '#ffffff', 19); m.sfx('sword_clash', { rate: 1.1 });
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 60, color: '#cfe8ff', life: 0.35, w: 6 });
      if (o.alive && !o.isEnv && dist(o, f) < 520) {
        o.addStatus('stun', 1);
        // lướt xuyên qua nạn nhân, ảo ảnh ở lại chém liên hoàn
        const a = angTo(f, o), q = m.arena.clamp({ x: o.x + Math.cos(a) * 70, y: o.y + Math.sin(a) * 70 }, f.r + 4);
        if (dist(o, f) < 220) { m.fx({ type: 'line', x1: f.x, y1: f.y, x2: q.x, y2: q.y, color: '#cfe8ff', life: 0.25, w: 4 }); f.x = q.x; f.y = q.y; f.facing = a; }
        for (let i = 0; i < 5; i++) m.later(0.15 + i * 0.25, () => { if (o.alive) m.fx({ type: 'slash', x: o.x, y: o.y, a: rand(0, TAU), r: 46, color: '#cfe8ff', life: 0.18 }); });
        m.later(2, () => {
          if (!o.alive) return;
          m.applyHit(f, o, { dmg: 8, kb: 200, kg: 5.5, tag: 'D', angle: angTo(f, o) });
          m.fx({ type: 'boom', x: o.x, y: o.y, r: 60, color: '#9ad0ff', life: 0.35 }); m.shake(8);
        });
        if (f.T('kazuki_12a')) m.later(0.3, () => kzStorm(f, o, m, true));
      }
      f.cd.C = 0; f.ws.si = Math.min(10, f.ws.si + 5);
      if (f.T('kazuki_9b')) f.percent = Math.max(0, f.percent - 15);
      if (f.T('kazuki_6a')) f.ws.ripT = 1.5;
      return false;
    },
    skills: {
      A: { name: 'Tả Trảm', cd: 0.25, desc: 'Đánh tích: chém nhanh tay trái (0.25s), mở nhịp combo hoặc gạt đạn nhỏ.',
        ai: { type: 'atk', max: 92, pri: 2.2 },
        use(f, m) {
          const R = f.T('kazuki_1c') ? 96 : 80, k = kzSpeed(f);
          kzPush(f, 'A', m);
          f.act(0.25 * k, { move: 0.5, anim: 'swing', atk: true }, [[0.07 * k, () => {
            kzSlashProjs(f, m, R);
            m.hitArc(f, { range: R, arc: 110, dmg: 4.5, kb: 85, kg: 3.6, tag: 'A' });
            m.fx({ type: 'slash', x: f.x + Math.cos(f.facing) * 30, y: f.y + Math.sin(f.facing) * 30, a: f.facing, r: R * 0.7, color: '#cfe8ff', life: 0.16 });
          }]]);
        } },
      B: { name: 'Hữu Trảm', cd: 0.5, desc: 'Kết liễu: nhát chém nặng tay phải (0.5s), tầm quét rộng hơn và đẩy lùi mạnh hơn A.',
        ai: { type: 'atk', max: 108, pri: 2.3 },
        use(f, m) {
          const R = f.T('kazuki_1c') ? 114 : 95, k = kzSpeed(f);
          kzPush(f, 'B', m);
          f.act(0.5 * k, { move: 0.3, anim: 'swing', atk: true }, [[0.18 * k, () => {
            kzSlashProjs(f, m, R);
            m.hitArc(f, { range: R, arc: 150, dmg: 7, kb: 165, kg: 6.4, tag: 'B' });
            m.fx({ type: 'slash', x: f.x + Math.cos(f.facing) * 34, y: f.y + Math.sin(f.facing) * 34, a: f.facing, r: R * 0.85, color: '#9ad0ff', life: 0.2, heavy: true });
          }]]);
        } },
      C: { name: 'Kiếm Thế Quyết', cd: 5, desc: 'Kết thúc chuỗi theo 2 đòn trước: [AA] Toàn Phong Trảm xoay 360° • [AB] Quán Kình Đao đâm thẳng CHOÁNG 1s • [BA] Thập Tự Trảm chữ X sát thương lớn + vết thương sâu • [BB] Đột Kích Đoạn Đao lướt xuyên 3.5m, CHOÁNG 2s rồi tra kiếm kích nổ. Có ≥5 Kiếm Ý: có thể tốn 5 để tung Loạn Vũ Hư Ảnh (5 ảo ảnh chém từ 5 hướng, khóa 1.5s rồi hất tung).',
        ai: { type: 'atk', max: 140, pri: 2.6 },
        // Vạn Kiếm Quy Nhất: sau Loạn Vũ, lướt ngược lại giáng chém kết liễu từ trên không
        recast(f) { return !!f.ws.stormEnd && f.ws.stormEnd.target.alive; },
        recastAi: () => true,
        recastUse(f, m) {
          const t = f.ws.stormEnd.target; f.ws.stormEnd = null;
          const a = angTo(f, t);
          f.startDash({ angle: a, dist: Math.max(0, dist(f, t) - 30), dur: 0.18, trail: true, invuln: true });
          f.act(0.4, { move: 0, anim: 'raise', atk: true }, [[0.22, () => {
            m.applyHit(f, t, { dmg: 9, kb: 300, kg: 7.6, tag: 'C', angle: a });
            m.fx({ type: 'slash', x: t.x, y: t.y, a: Math.PI / 2, r: 70, color: '#ffffff', life: 0.25, heavy: true }); m.shake(10);
          }]]);
          m.text(f.x, f.y - 66, '🗡️ VẠN KIẾM QUY NHẤT!', '#ffffff', 18);
        },
        use(f, m) {
          const t = m.nearestEnemy(f);
          // Loạn Vũ (AI giữ nút = tốn 5 Kiếm Ý)
          if (f.intent && f.intent.hold && f.ws.si >= 5 && t && dist(f, t) < 260) { f.act(0.3, { move: 0, anim: 'spin', atk: true }); kzStorm(f, t, m, false); f.ws.mind = Math.min(100, f.ws.mind + 25); return; }
          let form = kzForm(f, m);
          // Tuyệt Kỹ Iaido: rút kiếm chém lướt tức thì, không cần combo mồi
          if (f.T('kazuki_12a') && !form) form = 'IAI';
          const a = t ? angTo(f, t) : f.facing; f.facing = a;
          if (form === 'AA') {
            f.act(0.4, { move: 0.2, anim: 'spin', atk: true }, [[0.1, () => {
              m.hitCircle(f, { r: 125, dmg: 8, kb: 230, kg: 6.8, tag: 'C' });
              m.fx({ type: 'whirl', x: f.x, y: f.y, r: 115, a, color: '#9ad0ff', life: 0.3, w: 10 });
            }]]);
            kzFormDone(f, m, 'TOÀN PHONG TRẢM');
          } else if (form === 'AB') {
            f.act(0.38, { move: 0, anim: 'thrust', atk: true }, [[0.1, () => {
              const hs = m.hitLine(f, { len: 165, w: 40, dmg: 8, kb: 240, kg: 7, stun: 1, tag: 'C', unblockable: f.T('kazuki_3a') });
              if (f.T('kazuki_3a')) for (const e of hs) for (const s of ARMOR_ST) e.removeStatus(s);
              m.fx({ type: 'thrust', x: f.x, y: f.y, a, len: 165, w: 18, color: '#cfe8ff', life: 0.22 });
            }]]);
            kzFormDone(f, m, 'QUÁN KÌNH ĐAO');
          } else if (form === 'BA') {
            f.act(0.36, { move: 0.1, anim: 'swing', atk: true }, [[0.08, () => {
              const hs = m.hitArc(f, { range: 110, arc: 120, dmg: 12, kb: 150, kg: 5.5, tag: 'C' });
              for (const e of hs) {
                e.addStatus('wound', 4);
                // Huyết Trảm: rút thêm 15% điểm văng trong 3s
                if (f.T('kazuki_3b')) for (let i = 1; i <= 3; i++) m.later(i, () => { if (e.alive) { e.percent += 5; m.text(e.x, e.y - 40, '🩸+5%', '#ff3a4a', 12); } });
              }
              m.fx({ type: 'slash', x: f.x + Math.cos(a) * 40, y: f.y + Math.sin(a) * 40, a: a + 0.8, r: 60, color: '#ff9ab0', life: 0.22, heavy: true });
              m.fx({ type: 'slash', x: f.x + Math.cos(a) * 40, y: f.y + Math.sin(a) * 40, a: a - 0.8, r: 60, color: '#ff9ab0', life: 0.22, heavy: true });
            }]]);
            kzFormDone(f, m, 'THẬP TỰ TRẢM');
          } else if (form === 'BB' || form === 'IAI') {
            const iai = form === 'IAI';
            let caught = null;
            f.act(0.3, { move: 0, anim: 'thrust', atk: true });
            f.startDash({ angle: a, dist: 140, dur: 0.16, invuln: true, trail: true, through: true, onContact: (e) => {
              if (!caught) { caught = e; if (m.applyHit(f, e, { dmg: iai ? 9 : 4, kb: iai ? 230 : 0, kg: iai ? 6 : 0, noKnock: !iai, tag: 'C' }) && !iai) e.addStatus('stun', 2); }
              return false;
            } });
            if (!iai) m.later(0.8, () => {
              if (!caught || !caught.alive) return;
              m.applyHit(f, caught, { dmg: 13, kb: 330, kg: 8, tag: 'C', angle: angTo(f, caught) });
              m.fx({ type: 'boom', x: caught.x, y: caught.y, r: 55, color: '#cfe8ff', life: 0.35 }); m.shake(10); m.text(f.x, f.y - 56, '🗡️ ...tra kiếm.', '#cfe8ff', 14);
            });
            kzFormDone(f, m, iai ? 'IAIDO!' : 'ĐỘT KÍCH ĐOẠN ĐAO');
          } else {
            // chưa có chuỗi mồi: nhát chém chéo đơn
            f.act(0.3, { move: 0.2, anim: 'swing', atk: true }, [[0.08, () => m.hitArc(f, { range: 100, arc: 120, dmg: 5, kb: 130, kg: 4.5, tag: 'C' })]]);
            f.ws.seq = [];
          }
        } },
      D: { name: 'Vô Tướng Nghịch Trảm', cd: 12, desc: 'Thủ thế song kiếm 0.6s. Đỡ hụt: khựng 0.3s. Đỡ trúng đòn hay đạn: CHOÁNG kẻ tấn công 1s, lướt xuyên qua để ảo ảnh chém liên hoàn — 2s sau vết chém nổ tung đẩy văng; hồi ngay C và +5 Kiếm Ý.',
        ai: { type: 'def', max: 200 },
        // Trảm Khí Nghịch Chuyển: phóng luồng kiếm khí chữ X tầm xa
        recast(f) { return f.T('kazuki_6a') && f.ws.ripT > 0; },
        recastAi: (f, t, m, d) => d > 60 && d < 420,
        recastUse(f, m) {
          f.ws.ripT = 0;
          const a = aimOr(f, m, 420, 900); f.facing = a;
          for (const o of [-0.08, 0.08]) shoot(f, m, a + o, { speed: 900, r: 20, range: 420, kind: 'wave', color: '#cfe8ff', pierce: true, hit: { dmg: 6, kb: 230, kg: 6.2, tag: 'D' } });
          f.act(0.25, { move: 0, anim: 'swing', atk: true });
          m.text(f.x, f.y - 56, '✖ TRẢM KHÍ!', '#cfe8ff', 15);
        },
        use(f, m) {
          const w = f.T('kazuki_3c') ? 0.9 : 0.6;
          f.addStatus('parry', w); f.ws.parryT = w;
          f.act(w, { move: 0, anim: 'guard' });
        } },
      U: { name: 'Vạn Cảnh Trảm Vực', desc: 'Cần 10 Kiếm Ý & 100% Ý Niệm. Lướt một dải dài về trước xé toạc không gian, để lại Vùng Loạn Kiếm 5s: kẻ địch bên trong liên tục chịu sát thương, bị hút nhẹ vào tâm và không thể lướt/dịch chuyển.',
        ai: { type: 'buff', max: 360 },
        use(f, m) {
          const n = kzNeed(f); f.ws.si -= n.si; f.ws.mind -= n.mind;
          const t = m.nearestEnemy(f);
          // Trảm Đoạn Thời Không: đóng băng cả sàn 1.5s, 10 nhát vào kẻ điểm văng cao nhất rồi kích nổ ra ngoài
          if (f.T('kazuki_12b') && t && t.percent > 70) {
            const v = m.fighters.filter((e) => e.team !== f.team && e.alive).sort((a, b) => b.percent - a.percent)[0];
            for (const e of m.enemiesOf(f)) if (!e.isMinion) petrify(e, m, 1.5);
            for (let i = 0; i < 10; i++) m.later(0.1 + i * 0.12, () => { if (v.alive) { m.applyHit(f, v, { dmg: 1.5, noKnock: true, tag: 'U', quiet: true }); m.fx({ type: 'slash', x: v.x, y: v.y, a: rand(0, TAU), r: 55, color: '#ffffff', life: 0.15 }); } });
            m.later(1.4, () => { if (v.alive) { m.applyHit(f, v, { dmg: 8, kb: 520, kg: 9, unblockable: true, tag: 'U', angle: nearestEdgeAngle(m, v.x, v.y) }); m.fx({ type: 'boom', x: v.x, y: v.y, r: 90, color: '#cfe8ff', life: 0.4 }); m.shake(16); } });
            m.text(f.x, f.y - 76, '⏳ TRẢM ĐOẠN THỜI KHÔNG!', '#ffffff', 20);
            return;
          }
          const a = t ? angTo(f, t) : f.facing, L = 300;
          const p0 = { x: f.x, y: f.y };
          f.startDash({ angle: a, dist: L, dur: 0.22, invuln: true, trail: true, through: true });
          const c = m.arena.clamp({ x: p0.x + Math.cos(a) * L * 0.5, y: p0.y + Math.sin(a) * L * 0.5 }, 30);
          m.zone({ owner: f, x: c.x, y: c.y, r: 160, life: 5, every: 0.25, kind: 'swords', color: 'rgba(150,200,255,0.18)',
            tick: (mm, z) => {
              for (const e of mm.enemiesOf(f)) {
                const d = Math.hypot(e.x - z.x, e.y - z.y);
                if (d > z.r + e.r) continue;
                mm.applyHit(f, e, { dmg: 1.4, kb: 25, kg: 0.6, tag: 'U', quiet: true, angle: Math.atan2(z.y - e.y, z.x - e.x) });
                e.addStatus('nodash', 0.35); if (f.T('kazuki_9a')) e.addStatus('silence', 0.35);
                if (d > 20 && !e.superArmor) { const q = Math.atan2(z.y - e.y, z.x - e.x); e.vx += Math.cos(q) * 70; e.vy += Math.sin(q) * 70; }
                if (Math.random() < 0.5) mm.fx({ type: 'slash', x: e.x, y: e.y, a: rand(0, TAU), r: 36, color: '#cfe8ff', life: 0.15 });
              }
            } });
          m.text(f.x, f.y - 70, '🌌 VẠN CẢNH TRẢM VỰC', '#cfe8ff', 19);
        } },
    },
  },
});

WEAPON_IDS.push('con', 'song_kiem');
