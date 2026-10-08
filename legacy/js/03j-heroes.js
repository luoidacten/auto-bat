'use strict';
// ===== Tướng mới: Victoria (Cờ Lệnh) • Joker (Bài Ma Thuật) • Diệp Thanh Phong (Thiết Phiến) • Galo (Bình Độc) =====
// Quy đổi: 1m ≈ 40px.

// ---------- Victoria: 3 Quân Lệnh (ws.stance: pistol → ar → flag) + đội Lính Tinh Nhuệ ----------
const VIC_MODES = ['pistol', 'ar', 'flag'];
const VIC_NAME = { pistol: '🔫 LỆNH PHÒNG THỦ', ar: '🔥 LỆNH TIẾN CÔNG', flag: '🚩 LỆNH HỖ TRỢ' };
function vicSold(f) { return (f._sold || []).filter((s) => s.alive && !s.dead); }
function vicMax(f) { return f.T('victoria_9c') ? 4 : 3; }
function vicRespawnT(f) { return f.T('victoria_12a') ? 20 : f.T('victoria_1a') ? 45 : 60; }
function vicSpawn(f, m) {
  const used = new Set(vicSold(f).map((s) => s.ws.slot));
  let i = 0; while (used.has(i)) i++;
  if (i >= vicMax(f)) return null;
  const a = f.facing + Math.PI + (i - 1) * 0.9;
  const p = m.arena.clamp({ x: f.x + Math.cos(a) * 52, y: f.y + Math.sin(a) * 52 }, 30);
  const s = m.addMinion(new Minion(f, 'linh', p.x, p.y, i === 3 ? 'Lính Trọng Pháo' : 'Lính Tinh Nhuệ'));
  s.ws.slot = i; s.ws.heavy = i === 3; s.color = '#c04a4a'; s.takenMult *= 1.5;
  if (f.T('victoria_1b')) s.weightFactor *= 1.3;
  // Bậc Thầy Chỉ Huy: lính nhận 100% kháng văng của Victoria
  if (f.T('victoria_12a')) s.weightFactor *= WEAPONS.co_lenh.weight / WEAPONS.linh.weight * f.weightFactor;
  m.fx({ type: 'ring', x: p.x, y: p.y, r: 30, color: '#ff6a5a', life: 0.4, w: 4 });
  (f._sold = vicSold(f)).push(s);
  return s;
}
// ở trong Vùng Đất Quân Lệnh (cờ cắm của chiêu B dạng Cờ)
function vicInFlag(o, x, y, m) { const z = o.ws.flagZ; return !!(z && z.until > m.time && Math.hypot(x - z.x, y - z.y) < z.r); }
// khói che mắt (Bọc Lót Chiến Thuật)
function vicSmoke(f, m, x, y) {
  m.zone({ owner: f, x, y, r: 80, life: 3, every: 0.2, kind: 'rsmoke', color: 'rgba(150,150,160,0.45)',
    tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r) e.addStatus('blind', 0.4); } });
}
// pháo kích báo trước rồi nổ
function vicShell(f, m, x, y, delay, o = {}) {
  const p = m.arena.clamp({ x, y }, 10), r = o.r || 70;
  m.fx({ type: 'ring', x: p.x, y: p.y, r, color: o.color || '#ff5a3a', life: delay, w: 3 });
  m.later(delay, () => {
    const hs = m.hitCircle(f, { x: p.x, y: p.y, r, dmg: o.dmg || 6, kb: o.kb || 200, kg: o.kg || 5, stun: o.stun, tag: o.tag || 'D' });
    m.fx({ type: 'boom', x: p.x, y: p.y, r: r * 0.9, color: o.color || '#ff7a3a', life: 0.35 }); m.shake(6); m.sfx('explosion', { vol: 0.6 });
    if (o.onHit) for (const e of hs) o.onHit(e);
  });
}
function vicSetMode(f, m, mode) {
  const old = { x: f.x, y: f.y };
  f.ws.stance = mode;
  m.text(f.x, f.y - 70, VIC_NAME[mode], '#ffd27a', 16);
  if (mode === 'pistol') {
    f.ws.guard1 = true;
    f.startDash({ angle: f.castAngle ?? f.facing, dist: 80, dur: 0.16, trail: true });
    m.fx({ type: 'ring', x: f.x, y: f.y, r: 34, color: '#7ab0ff', life: 0.4, w: 5 });
  } else if (mode === 'ar') {
    const bl = 1.25 + (f.T('victoria_1c') ? 0.75 : 0);
    for (const e of m.enemiesOf(f)) if (dist(e, f) < 180 + e.r && Math.abs(angDiff(f.facing, angTo(f, e))) < 0.9) { e.addStatus('blind', bl); m.text(e.x, e.y - 50, '⚡ MÙ!', '#ffffff', 14); }
    m.fx({ type: 'flash', x: f.x + Math.cos(f.facing) * 60, y: f.y + Math.sin(f.facing) * 60, r: 120, color: '#ffffff', life: 0.25 });
    f.startDash({ angle: f.facing + Math.PI, dist: 100, dur: 0.22, trail: true });
    if (f.T('victoria_6c')) vicSmoke(f, m, old.x, old.y);
  } else {
    const t = m.nearestEnemy(f);
    const c = t ? { x: t.x + t.vx * 0.4, y: t.y + t.vy * 0.4 } : { x: f.x + Math.cos(f.facing) * 200, y: f.y + Math.sin(f.facing) * 200 };
    vicShell(f, m, c.x, c.y, 2);
    for (let i = 0; i < 2; i++) { const a = rand(0, TAU), L = rand(80, 230); vicShell(f, m, c.x + Math.cos(a) * L, c.y + Math.sin(a) * L, 2); }
    m.fx({ type: 'ring', x: f.x, y: f.y, r: 50, color: '#ffd27a', life: 0.4, w: 5 });
  }
}

// ---------- Joker: bộ bài, May Mắn, Ấn Nhật – Nguyệt, mượn trang bị ----------
const JK_FEM = new Set(['elara', 'aria', 'roxie', 'alice', 'vesper', 'victoria', 'joker']);
const JK_LOW = ['borg', 'koda', 'clint'], JK_DISC = ['gideon', 'valerius', 'ryoma', 'kazuki'];
const JK_ICON = { spade: '♠️ BÍCH', club: '♣️ TÉP', diamond: '♦️ RÔ', heart: '♥️ CƠ', joker: '🃏 JOKER' };
const JK_COL = { blank: '#f0f0f0', spade: '#5a6aff', club: '#7ae07a', diamond: '#ff5a6a', heart: '#ff8ad0', joker: '#ffd24a' };
function jkLuck(f) { return Math.min(20, f._luck || 0) / 100; }
function jkX2(f, k) { const base = k === 'A' ? (f.T('joker_9c') ? 0.5 : 0.35) : (f.T('joker_9c') ? 0.25 : 0.15); return Math.random() < base + jkLuck(f); }
function jkDraw(f, m, fromC) {
  const w = fromC ? { spade: 18, club: 18, diamond: 17, heart: 17, joker: 15 } : { blank: 25, spade: 18, club: 18, diamond: 17, heart: 17, joker: 5 };
  if (f.T('joker_9b')) delete w.blank;
  if (f.T('joker_12a')) { delete w.heart; w.joker = 25; }
  if (w.blank) w.blank *= 1 - jkLuck(f) * 2;
  let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0), card = 'blank';
  for (const k in w) { r -= w[k]; if (r <= 0) { card = k; break; } }
  f.ws.card = card === 'blank' ? null : card; f.ws.uses = 1; f.ws.drawT = m.time;
  m.text(f.x, f.y - 64, card === 'blank' ? '🂠 RÚT HỤT!' : JK_ICON[card], JK_COL[card], 16);
  return card;
}
function jkMarks(t, m) { return t.jkMark && t.jkMark.until > m.time ? t.jkMark : null; }
function jkHit(suit) {
  switch (suit) {
    case 'spade': return { dmg: 6, kb: 225, kg: 6.6, tag: 'A', suit };
    case 'club': return { dmg: 3, kb: 60, kg: 1.8, tag: 'A', suit };
    case 'diamond': return { dmg: 3, kb: 60, kg: 2, tag: 'A', suit };
    case 'heart': return { dmg: 2, kb: 40, kg: 1.2, tag: 'A', suit };
    case 'joker': return { dmg: 3, noKnock: true, tag: 'A', suit };
    default: return { dmg: 2.2, kb: 45, kg: 1.4, tag: 'A' };
  }
}
function jkSwap(f, t, m) {
  if (!t.alive || t.has('immortal') || t.isMinion) return;
  const p = { x: f.x, y: f.y };
  m.fx({ type: 'line', x1: f.x, y1: f.y, x2: t.x, y2: t.y, color: '#ffd24a', life: 0.3, w: 3 });
  f.x = t.x; f.y = t.y; t.x = p.x; t.y = p.y; t.vx = t.vy = 0; t.action = null; t.cancelDash();
  m.text(f.x, f.y - 60, '🔁 ĐỔI CHỖ!', '#ffd24a', 16);
}
function jkEffect(f, m, t, suit) {
  if (!t || !t.alive) return;
  const mk = jkMarks(t, m), sun = mk && mk.sun, moon = mk && mk.moon;
  if (suit === 'club') {
    const k = moon ? 2 : 1, got = [];
    if (Math.random() < 0.55) { t.addStatus('stun', 0.75 * k); got.push('💫'); }
    if (Math.random() < 0.55) { t.addStatus('slow', 2 * k, 0.5); got.push('🐌'); }
    if (Math.random() < 0.55) { t.addStatus('silence', (f.T('joker_3b') ? 2 : 1) * k); got.push('🔇'); }
    if (Math.random() < 0.55) { t.addStatus('burn', 3, 2); got.push('🔥'); }
    m.text(t.x, t.y - 56, got.length ? '♣️ ' + got.join('') : '♣️ ...chẳng có gì', '#7ae07a', 14);
  } else if (suit === 'diamond') {
    m.hitCircle(f, { x: t.x, y: t.y, r: 65, dmg: sun ? 10 : 5, kb: 120, kg: 3, tag: 'A' });
    m.fx({ type: 'boom', x: t.x, y: t.y, r: 55, color: '#ff5a6a', life: 0.3 });
    f._luck = Math.min(20, (f._luck || 0) + (sun ? 4 : 2));
    m.text(f.x, f.y - 70, `🍀 May Mắn +${sun ? 4 : 2}% (${f._luck}%)`, '#7aff7a', 13);
  } else if (suit === 'heart') {
    const h = 15 * (sun ? 2 : 1); f.percent = Math.max(0, f.percent - h);
    m.text(f.x, f.y - 60, `♥️ -${h}%`, '#ff8ad0', 15);
  } else if (suit === 'joker') {
    jkSwap(f, t, m);
    const mk2 = jkMarks(t, m) || { sun: false, moon: false };
    if (Math.random() < 0.5) mk2.sun = true; else mk2.moon = true;
    mk2.until = m.time + 8; t.jkMark = mk2;
    m.text(t.x, t.y - 70, mk2.sun && mk2.moon ? '☯ NHẬT NGUYỆT ĐỒNG TÊ!' : mk2.sun ? '☀️ ẤN MẶT TRỜI' : '🌙 ẤN MẶT TRĂNG', '#ffd24a', 15);
    if (mk2.sun && mk2.moon) {
      t.jkMark = null;
      m.applyHit(f, t, { dmg: 4, kb: 220 * 1.4, kg: 5 * 1.4, tag: 'A', angle: angTo(f, t) });
      t.addStatus('stun', 2.5); m.fx({ type: 'boom', x: t.x, y: t.y, r: 70, color: '#ffd24a', life: 0.4 }); m.shake(8);
    }
  }
}
function jkThrow(f, m, card, a) {
  let suit = card;
  if (!suit && f.T('joker_12a')) suit = pick(['spade', 'club', 'diamond']);
  const fan = f.T('joker_6b') ? [-0.17, 0, 0.17] : [0];
  const sp = 820 * (f.T('joker_1a') ? 1.4 : 1), R = 400 + (f.T('joker_1a') ? 80 : 0);
  for (const o of fan) shoot(f, m, a + o, { speed: sp, r: 7, range: R, kind: 'card', color: JK_COL[suit || 'blank'], hit: jkHit(suit),
    onHit: (mm, p, t) => jkEffect(f, mm, t, suit) });
}
// D "Mượn Tý Nha!": bất kỳ ai kích hoạt trang bị / phép → ô D nạp bản sao và hồi chiêu D về 0
function noteActive(user, m, kind, id) {
  if (!m || !m.fighters) return;
  for (const j of m.fighters) {
    if (j.weaponId !== 'bai' || !j.alive || j._dCasting) continue;
    j.ws.stolen = { kind, id }; j.cd.D = 0;
    m.text(j.x, j.y - 76, `🃏 Mượn tý nha! (${kind === 'item' ? ITEM_BY_ID[id].icon : SPELLS[id].icon})`, '#ffd24a', 13);
  }
}

// ---------- Diệp Thanh Phong: Khí Áp Phong Vũ 0–100 ----------
function tpState(f) { const w = f.T('thanhphong_12a') ? 100 : f.ws.wind; return w <= 35 ? 'thuan' : w >= 65 ? 'nghich' : 'bao'; }
function tpWind(f, m, dv) {
  if (f.T('thanhphong_12a')) return;
  const before = tpState(f);
  f.ws.wind = clamp(f.ws.wind + dv, 0, 100);
  const now = tpState(f);
  if (before !== now) m.text(f.x, f.y - 70, now === 'thuan' ? '🍃 THUẬN PHONG' : now === 'nghich' ? '🌪️ NGHỊCH PHONG' : '🌀 BÃO HÒA', '#bff0e0', 14);
}
function tpSleep(t, m, dur) {
  if (!t.alive || t.has('immortal') || t.has('unstoppable') || t.isMinion) return;
  t.addStatus('stun', dur); t._sleepT = m.time + dur;
  m.text(t.x, t.y - 62, '💤 NGỦ SAY', '#b0c8ff', 16);
}
function tpBehind(f, t, m, a) {
  const q = m.arena.clamp({ x: t.x + Math.cos(a) * 46, y: t.y + Math.sin(a) * 46 }, f.r + 4);
  m.fx({ type: 'ghost', x: f.x, y: f.y, r: f.r, color: '#bff0e0', life: 0.3 });
  f.cancelDash(); f.x = q.x; f.y = q.y; f.vx = f.vy = 0; f.facing = angTo(f, t);
}

// ---------- Galo: Dạng Người / Dạng Quái Thú, độc Tiêu Xương ----------
function galoBeast(f) { return f.T('galo_12a') || f.ws.beast > 0; }
function galoVenom(f, t, m, n = 1) {
  if (!t || !t.alive || storyProtected(f, t)) return;
  const cap = f.T('galo_9a') ? 10 : 6;
  const v = t.venom && t.venom.until > m.time ? t.venom : { n: 0, owner: f };
  v.n = Math.min(cap, v.n + n); v.until = m.time + 5; v.owner = f; t.venom = v;
  t.status.poison = { t: 5, p: (f.T('galo_1a') ? 0.35 : 0.26) * v.n, max: 5 };
  if (v.n >= 6 && !v.said) { v.said = true; m.text(t.x, t.y - 64, '☠️ TIÊU XƯƠNG — NHẸ BẪNG!', '#8be04a', 15); }
}
function galoN(f, t, m) { return t && t.venom && t.venom.owner === f && t.venom.until > m.time ? t.venom.n : 0; }
function galoSplash(f, m, x, y, r = 46) {
  for (const e of m.enemiesOf(f)) if (Math.hypot(e.x - x, e.y - y) < r + e.r) { m.applyHit(f, e, { dmg: 2, kb: 40, kg: 1, tag: 'A', angle: Math.atan2(e.y - y, e.x - x) }); galoVenom(f, e, m); }
  m.fx({ type: 'boom', x, y, r: r * 0.8, color: '#7ae04a', life: 0.3 });
}
function galoFlask(f, m) {
  const a = aimOr(f, m, 340, 620);
  shoot(f, m, a, { speed: 620, r: 8, range: 340, kind: 'flask', color: '#7ae04a', hit: null,
    onHit: (mm, p) => galoSplash(f, mm, p.x, p.y), onEnd: (mm, p) => galoSplash(f, mm, p.x, p.y) });
}
function galoEndBeast(f, m) {
  f.ws.beast = 0;
  f.cd.D = 25 * f.cdMult;
  if (!f.T('galo_3c')) { f.ws.wd = 3; f.addStatus('nodash', 3); m.text(f.x, f.y - 66, '😵 VÃ THUỐC...', '#a0c080', 15); }
  else m.text(f.x, f.y - 66, '🧪 trở lại dạng người', '#a0e080', 13);
}

Object.assign(WEAPONS, {
  // ================= CỜ LỆNH CHIẾN TRƯỜNG (Victoria) =================
  co_lenh: {
    name: 'Cờ Lệnh Chiến Trường', icon: '🚩', color: '#e04a4a', weight: 1.08, speed: 1.0, gfx: 'commander',
    role: 'Chỉ huy • Đội hình 3 tinh nhuệ', ai: { range: 200, ranged: true, defend: ['B'] },
    passive: { name: 'Quân Lệnh & Đội Ngũ Tinh Nhuệ', desc: 'Luôn xuất trận cùng 3 Lính Tinh Nhuệ (rất nhẹ, bay xa; rơi đài thì 60s sau hồi sinh từng người cạnh Victoria), lính bám theo và đánh cùng mục tiêu. Quân Lệnh theo dạng vũ khí (D xoay vòng): 🔫 Lục — Phòng Thủ: toàn đội +20% trụ vững • 🔥 AR — Tiến Công: toàn đội +10% sát thương & lực văng • 🚩 Cờ — Hỗ Trợ: toàn đội +25% tốc chạy, khống chế ngắn hơn 30%, nhìn thấu ảo ảnh.' },
    init(f) { f.ws.stance = f.ws.stance || 'pistol'; f.ws.guard1 = false; f.ws.flagZ = null; f.ws.ultT = 0; f.ws.missT = 0; f.ws.bTarget = null; },
    resource(f, m) {
      const n = vicSold(f).length, q = (f._sq || []).map((x) => Math.ceil(x)).sort((a, b) => a - b);
      return `${VIC_NAME[f.ws.stance]} • 💂 ${n}/${vicMax(f)}` + (q.length ? ` (hồi sinh ${q[0]}s)` : '') + (f.ws.ultT > 0 ? ` • 🚀 ${f.ws.ultT.toFixed(1)}s` : '');
    },
    update(f, m, dt) {
      if (!f._soldInit && m.state === 'fight') { f._soldInit = true; for (let i = 0; i < vicMax(f); i++) vicSpawn(f, m); }
      // hàng đợi hồi sinh: từng người một
      f._sq = (f._sq || []).map((x) => x - dt);
      if (f._sq.length && f._sq[0] <= 0) { f._sq.shift(); if (f.alive) vicSpawn(f, m); else f._sq.unshift(0.5); }
      if (f.ws.stance === 'pistol') f.frameWeight *= 1.2;
      if (f.ws.stance === 'flag') {
        f.frameSpeed *= 1.25;
        for (const k of ['stun', 'slow', 'silence', 'root', 'blind']) { const s = f.status[k]; if (s) s.t -= dt * 0.43; }
      }
      if (f.ws.bT > 0) f.ws.bT -= dt;
      if (f.T('victoria_3c') && vicInFlag(f, f.x, f.y, m)) for (const k of ['A', 'B', 'C']) f.cd[k] -= dt * 0.2;
      // Mệnh Lệnh Tuyệt Đối: mưa tên lửa mỗi 2s vào kẻ có điểm văng cao nhất
      if (f.ws.ultT > 0) {
        f.ws.ultT -= dt; f.ws.missT -= dt;
        if (f.ws.missT <= 0) {
          f.ws.missT = 2;
          const v = m.fighters.filter((e) => e.team !== f.team && e.alive).sort((a, b) => b.percent - a.percent)[0];
          if (v) vicShell(f, m, v.x + v.vx * 0.3, v.y + v.vy * 0.3, 0.7, { r: 75, dmg: 6, kb: 220, kg: 5.5, tag: 'U', color: '#ffb02a' });
        }
      }
    },
    onDeal(f, t, hit, info, m) {
      if (f.ws.stance === 'ar') { info.mult *= 1.1; info.kbMult *= 1.1; }
      if (vicInFlag(f, f.x, f.y, m)) info.mult *= 1.25;
      if (t._crack > m.time) info.mult *= 1.2;
      if (hit.donut && f.T('victoria_9a')) info.kbMult *= 1.4 * (t.has('stun') ? 2 : 1);
    },
    onIncoming(f, att, hit, m) {
      if (!att || att.isEnv || att === f) return true;
      if (f.ws.guard1 && !hit.quiet) { f.ws.guard1 = false; m.fx({ type: 'ring', x: f.x, y: f.y, r: 36, color: '#7ab0ff', life: 0.35, w: 6 }); m.text(f.x, f.y - 56, '🛡 GIÁP NĂNG LƯỢNG', '#9ac8ff', 14); return false; }
      // Lá Chắn Thị Vệ: đòn chí tử → lính gần nhất lao vào thế mạng
      if (f.T('victoria_3b') && m.time > (f.ws.shieldCd || 0) && lethalHit(f, att, hit, m)) {
        const s = vicSold(f).sort((a, b) => dist(a, f) - dist(b, f))[0];
        if (s && dist(s, f) < 320) {
          f.ws.shieldCd = m.time + 15;
          m.fx({ type: 'line', x1: s.x, y1: s.y, x2: f.x, y2: f.y, color: '#ff6a5a', life: 0.3, w: 4 });
          s.x = f.x + 1; s.y = f.y + 1; m.removeMinion(s); WEAPONS.co_lenh.onMinionDead(f, s, m);
          m.text(f.x, f.y - 66, '💂 THẾ MẠNG!', '#ff8a7a', 17); m.shake(6);
          return false;
        }
      }
      return true;
    },
    onMinionDead(f, s, m) { if (s.kind === 'linh') { f._sold = vicSold(f).filter((x) => x !== s); (f._sq = f._sq || []).push(vicRespawnT(f)); } },
    // Kỷ Luật Sắt: hạ 1 kẻ địch → hồi sinh toàn bộ lính
    onKill(f, v, m) { if (f.T('victoria_12c')) { f._sq = []; for (let i = 0; i < vicMax(f); i++) vicSpawn(f, m); m.text(f.x, f.y - 70, '⚔️ KỶ LUẬT SẮT!', '#ffd27a', 17); } },
    skills: {
      A: { name: 'Hỏa Lực Theo Dạng', cd: 0.8, desc: '🔫 Lục: 1 phát đạn lục uy lực đẩy lùi nhẹ • 🔥 AR: loạt 3 viên sấy dồn điểm văng • 🚩 Cờ (Donut Slash): vòng cảnh báo 0.5s (an toàn 0–1.8m, rìa 1.8–3.5m) rồi quét cờ 360°: kẻ đứng ở rìa nhận sát thương cực lớn và bị hất thẳng ra mép.',
        ai: { type: 'atk', max: 440, pri: 2.2 },
        use(f, m) {
          const mode = f.ws.stance;
          if (mode === 'flag') {
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 140, color: '#ffd27a', life: 0.5, w: 3 });
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 72, color: 'rgba(255,255,255,0.5)', life: 0.5, w: 2 });
            f.act(0.72, { move: 0, anim: 'spin', atk: true, windup: 0.45 }, [[0.5, () => {
              for (const e of m.enemiesOf(f)) {
                const d = dist(e, f);
                if (d < 72 - e.r * 0.5 || d > 140 + e.r) continue;
                m.applyHit(f, e, { dmg: 9, kb: 245, kg: 7, tag: 'A', donut: true, angle: angTo(f, e) });
              }
              m.fx({ type: 'whirl', x: f.x, y: f.y, r: 120, a: f.facing, color: '#ff6a5a', life: 0.3, w: 14 }); m.shake(5);
            }]]);
            return;
          }
          // Bậc Thầy Chỉ Huy: lính bắn thay
          if (f.T('victoria_12a')) {
            for (const s of vicSold(f)) s.ws.cd = 0;
            f.act(0.3, { move: 0.6, anim: 'raise' });
            m.text(f.x, f.y - 60, '📣 KHAI HỎA!', '#ffd27a', 13);
            return;
          }
          if (mode === 'pistol') {
            const a = aimOr(f, m, 440, 1050);
            f.act(0.25, { move: 0.5, anim: 'aim', atk: true });
            shoot(f, m, a, { speed: 1050, r: 6, range: 440, kind: 'bullet', color: '#ffe9a0', pierce: f.T('victoria_6b'),
              hit: { dmg: 5, kb: 95, kg: 3.2, tag: 'A' }, onHit: f.T('victoria_6b') ? (mm, p, t) => { t._crack = mm.time + 3; } : undefined });
          } else {
            f.act(0.35, { move: 0.4, anim: 'aim', atk: true }, [0, 0.08, 0.16].map((tt) => [tt, () => shoot(f, m, aimOr(f, m, 420, 1100) + rand(-0.07, 0.07), { speed: 1100, r: 5, range: 420, kind: 'bullet', color: '#ffb07a', hit: { dmg: 2.3, kb: 45, kg: 1.7, tag: 'A' } })]));
            m.sfx('rifle_burst');
          }
        } },
      B: { name: 'Thiết Lập Thế Trận', cd: 5, desc: '🔫 Lục: lướt 3m về trước + giáp ảo 2s • 🔥 AR: lựu đạn phóng nổ diện rộng hất văng • 🚩 Cờ: cắm cờ — sóng xung kích đẩy mọi kẻ địch quanh mình ra đúng 2.5m (trúng rìa Donut) + CHOÁNG 0.75s; cờ tạo Vùng Đất Quân Lệnh 4s: đồng minh trong vùng +25% sát thương.',
        ai: { type: 'atk', max: 360, pri: 2 },
        recast(f) { return f.T('victoria_6a') && f.ws.stance === 'flag' && f.ws.flagZ && f.ws.bT > 0; },
        recastAi: (f, t, m) => vicInFlag(f, t.x, t.y, m) || dist(t, f.ws.flagZ) < 170,
        recastUse(f, m) {
          const z = f.ws.flagZ; f.ws.bT = 0; f.ws.flagZ = null;
          for (const e of m.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < 170 && !e.has('unstoppable')) pullTo(f, e, f.r + e.r + 30, 900, 0.3);
          m.fx({ type: 'line', x1: z.x, y1: z.y, x2: f.x, y2: f.y, color: '#ffd27a', life: 0.35, w: 4 }); m.text(f.x, f.y - 60, '🚩 THU HỒI CỜ LỆNH!', '#ffd27a', 15);
        },
        use(f, m) {
          const mode = f.ws.stance;
          if (mode === 'pistol') {
            const old = { x: f.x, y: f.y };
            f.startDash({ angle: f.castAngle ?? f.facing, dist: 120, dur: 0.18, trail: true, invuln: true });
            f.addStatus('shield', 2, 6);
            if (f.T('victoria_6c')) vicSmoke(f, m, old.x, old.y);
            m.text(f.x, f.y - 56, '🔫 NẠP ĐẠN!', '#9ac8ff', 13);
          } else if (mode === 'ar') {
            const a = aimOr(f, m, 360, 700);
            f.act(0.35, { move: 0.2, anim: 'aim', atk: true });
            const boom = (mm, p) => { mm.hitCircle(f, { x: p.x, y: p.y, r: 80, dmg: 7, kb: 235, kg: 6, tag: 'B' }); mm.fx({ type: 'boom', x: p.x, y: p.y, r: 70, color: '#ff7a3a', life: 0.35 }); mm.shake(6); mm.sfx('explosion', { vol: 0.6 }); };
            shoot(f, m, a, { speed: 700, r: 9, range: 360, kind: 'flask', color: '#5a5a40', hit: null, onHit: boom, onEnd: boom });
          } else {
            f.act(0.4, { move: 0, anim: 'raise', atk: true }, [[0.15, () => {
              for (const e of m.enemiesOf(f)) {
                const d = dist(e, f);
                if (d > 125 + e.r) continue;
                if (!e.superArmor && !e.has('immortal')) { const a = angTo(f, e), q = m.arena.clamp({ x: f.x + Math.cos(a) * 100, y: f.y + Math.sin(a) * 100 }, e.r); e.x = q.x; e.y = q.y; e.vx = e.vy = 0; }
                m.applyHit(f, e, { dmg: 3, noKnock: true, stun: 0.75, tag: 'B' });
              }
              f.ws.flagZ = { x: f.x, y: f.y, r: 120, until: m.time + 4 }; f.ws.bT = 4;
              m.zone({ owner: f, x: f.x, y: f.y, r: 120, life: 4, every: 1, kind: 'flag', color: 'rgba(255,90,70,0.12)', tick: () => {} });
              m.fx({ type: 'ring', x: f.x, y: f.y, r: 125, color: '#ffd27a', life: 0.4, w: 10 }); m.shake(6);
            }]]);
          }
        } },
      C: { name: 'Tổng Lực Tác Chiến', cd: 8, desc: '🔫 Lục: laser đánh dấu mục tiêu, 2s sau 2 quả pháo điện từ giáng xuống gây TÊ LIỆT 1.5s • 🔥 AR (Bão Lửa): Victoria cùng mọi lính AR xả đạn bão hòa 1.5s, ghìm chân mục tiêu • 🚩 Cờ (Lính Cuồng Chiến): mọi lính hú hét xung phong — Siêu Giáp, +50% tốc độ, lao vào chém xé hất tung.',
        ai: { type: 'atk', max: 520, pri: 2.4 },
        use(f, m) {
          const t = m.nearestEnemy(f), mode = f.ws.stance;
          if (!t) return;
          if (mode === 'pistol') {
            const delay = f.T('victoria_9b') ? 1 : 2;
            f.act(0.5, { move: 0.3, anim: 'aim' });
            for (let i = 0; i < 3; i++) m.later(i * 0.15, () => { if (t.alive) m.fx({ type: 'line', x1: f.x, y1: f.y, x2: t.x, y2: t.y, color: '#ff3a3a', life: 0.12, w: 2 }); });
            m.text(t.x, t.y - 66, '🎯 ĐÃ KHÓA!', '#ff6a5a', 14); m.sfx('laser');
            for (let i = 0; i < 2; i++) m.later(delay - 0.4 + i * 0.18, () => { if (t.alive) vicShell(f, m, t.x, t.y, 0.4, { r: 55, dmg: 7, kb: 150, kg: 4.2, stun: 1.5, tag: 'C', color: '#7ad0ff' }); });
          } else if (mode === 'ar') {
            const slowK = f.T('victoria_3a') ? 0.6 : 0.5;
            t.addStatus('slow', 1.7, slowK); if (f.T('victoria_3a')) t.addStatus('nodash', 1.7);
            f.act(1.5, { move: 0.15, anim: 'aim', atk: true }, Array.from({ length: 10 }, (_, i) => [0.05 + i * 0.145, () => shoot(f, m, aimOr(f, m, 460, 1100) + rand(-0.06, 0.06), { speed: 1100, r: 5, range: 460, kind: 'bullet', color: '#ffb07a', hit: { dmg: 1.5, kb: 30, kg: 1.2, tag: 'C' } })]));
            for (const s of vicSold(f)) if (!s.ws.heavy) for (let i = 0; i < 6; i++) m.later(0.1 + i * 0.24, () => { if (s.alive && t.alive) shoot(s, m, angTo(s, t) + rand(-0.08, 0.08), { speed: 1000, r: 4, range: 480, kind: 'bullet', color: '#ffb07a', hit: { dmg: 0.7, kb: 15, kg: 0.6, tag: 'C' } }); });
            m.text(f.x, f.y - 64, '🔥 BÃO LỬA LIÊN THANH!', '#ff9a5a', 16); m.sfx('gun_auto');
          } else {
            for (const s of vicSold(f)) { s.ws.rage = m.time + 4; s.addStatus('unstoppable', 4); s.addStatus('haste', 4, 0.5); }
            f.act(0.35, { move: 0, anim: 'raise' });
            m.text(f.x, f.y - 64, '⚔️ XUNG PHONG!!', '#ff6a5a', 17); m.shake(4);
          }
        } },
      D: { name: 'Chuyển Đổi Quân Lệnh', cd: 2, desc: 'Xoay vòng Lục → AR → Cờ. Sang 🔫 Lục: lướt 2m lên trước + Giáp Năng Lượng chặn 1 đòn, 1 lính xông lên, 2 lính che sườn • Sang 🔥 AR: ném Flash làm MÙ 1.25s kẻ địch trước mặt rồi nhảy lùi 2.5m, lính tản ra vòng cung • Sang 🚩 Cờ: phất cờ đánh dấu 3 điểm, 2s sau pháo kích trút xuống.',
        ai: { type: 'buff', max: 0 },
        use(f, m) { vicSetMode(f, m, VIC_MODES[(VIC_MODES.indexOf(f.ws.stance) + 1) % 3]); f.act(0.2, { move: 0.3, anim: 'raise' }); } },
      U: { name: 'Mệnh Lệnh Tuyệt Đối', desc: 'Hồi sinh toàn bộ lính & hồi đầy trạng thái toàn quân. 10s: lính hóa Thiết Binh Kim Cang (Siêu Giáp, đòn đánh to hơn 50%), dàn tên lửa quỹ đạo nã xuống kẻ có điểm văng cao nhất mỗi 2s.',
        ai: { type: 'buff', max: 0 },
        use(f, m) {
          const t = m.nearestEnemy(f);
          // Pháo Đài Di Động: lính ghép khiên, đại bác laser quét 180°
          if (f.T('victoria_12b') && t && t.percent > 60 && dist(f, t) < 450) {
            const a = angTo(f, t);
            f.addStatus('ironbody', 3);
            vicSold(f).forEach((s, i) => { const q = m.arena.clamp({ x: f.x + Math.cos(a + (i - 1) * 0.5) * 45, y: f.y + Math.sin(a + (i - 1) * 0.5) * 45 }, 20); s.x = q.x; s.y = q.y; s.addStatus('ironbody', 3); });
            f.act(0.9, { move: 0, anim: 'aim', atk: true }, [[0.6, () => {
              for (const e of m.enemiesOf(f)) if (dist(e, f) < 460 && Math.cos(angDiff(a, angTo(f, e))) > 0) m.applyHit(f, e, { dmg: 10, kb: 320, kg: 7, tag: 'U', angle: angTo(f, e) });
              m.fx({ type: 'thrust', x: f.x, y: f.y, a, len: 460, w: 140, color: '#ff5a3a', life: 0.4 }); m.shake(14); m.sfx('boom_big');
            }]]);
            m.text(f.x, f.y - 76, '🏰 PHÁO ĐÀI DI ĐỘNG!', '#ffd27a', 19);
            return;
          }
          f._sq = [];
          while (vicSold(f).length < vicMax(f)) if (!vicSpawn(f, m)) break;
          for (const s of vicSold(f)) { s.percent = 0; s.cleanse(); s.addStatus('unstoppable', 10); s.ws.big = m.time + 10; }
          f.ws.ultT = 10; f.ws.missT = 0.5;
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 160, color: '#ffd27a', life: 0.6, w: 12 }); m.shake(8);
        } },
    },
  },
  // Lính Tinh Nhuệ của Victoria
  linh: {
    hidden: true, name: 'Lính Tinh Nhuệ', icon: '💂', color: '#c04a4a', weight: 0.45, speed: 1.12, radius: 14, gfx: 'trooper', noRage: true, skills: {}, ai: { range: 60 },
    update(d, m, dt) {
      const o = d.owner; if (!o) return;
      if (o.ws.stance === 'pistol') d.frameWeight *= 1.2;
      if (o.ws.stance === 'flag') { d.frameSpeed *= 1.25; for (const k of ['stun', 'slow', 'silence', 'root']) { const s = d.status[k]; if (s) s.t -= dt * 0.43; } }
      if (d.ws.rage > m.time) d.frameSpeed *= 1.5;
    },
    onDeal(d, t, hit, info, m) {
      info.mult *= 0.6; info.kbMult *= 0.75; // lính tinh nhuệ: phụ trợ, không phải mũi nhọn
      const o = d.owner;
      if (o.ws.stance === 'ar') { info.mult *= 1.1; info.kbMult *= 1.1; }
      if (vicInFlag(o, d.x, d.y, m)) info.mult *= 1.25;
      if (t._crack > m.time) info.mult *= 1.2;
    },
    mind(d, m, dt) {
      const o = d.owner;
      if (o.dead) { m.removeMinion(d); return; }
      d.ws.cd = (d.ws.cd ?? rand(0.3, 1)) - dt;
      if (!o.alive) { d.moveDir = { x: 0, y: 0 }; return; }
      // chia sẻ mục tiêu với Victoria — bỏ qua ảo ảnh (chỉ nhắm đấu sĩ thật)
      let t = null, bd = Infinity;
      for (const e of m.fighters) if (e.team !== d.team && e.alive) { const q = dist(d, e); if (q < bd) { bd = q; t = e; } }
      if (!t) { steerToward(d, m, o.x, o.y, 50); return; }
      const mode = o.ws.stance, rage = d.ws.rage > m.time, big = d.ws.big > m.time ? 1.5 : 1;
      const gun = !rage && mode === 'ar' && !d.ws.heavy;
      const de = dist(d, t);
      if (d.canAct()) {
        d.facing = angTo(d, t);
        if (d.ws.heavy && de < 430 && d.ws.cd <= 0) {
          d.ws.cd = 3.4;
          d.act(0.35, { move: 0, anim: 'aim', atk: true }, [[0.15, () => shoot(d, m, angTo(d, t), { speed: 760, r: 9, range: 430, kind: 'fireball', color: '#ff7a3a', hit: { dmg: 2.4, kb: 110, kg: 2.8, tag: 'A' } })]]);
        } else if (gun && de < 400 && d.ws.cd <= 0) {
          d.ws.cd = 1.3;
          d.act(0.2, { move: 0.5, anim: 'aim', atk: true }, [[0.05, () => shoot(d, m, angTo(d, t) + rand(-0.08, 0.08), { speed: 1000, r: 4, range: 400, kind: 'bullet', color: '#ffb07a', hit: { dmg: 0.8, kb: 15, kg: 0.6, tag: 'A' } })]]);
        } else if (!gun && !d.ws.heavy && de < 58 * big + t.r && d.ws.cd <= 0) {
          d.ws.cd = rage ? 0.9 : 1.5;
          d.act(0.3, { move: 0.3, anim: 'swing', atk: true }, [[0.1, () => m.hitArc(d, { range: 62 * big, arc: 120, dmg: mode === 'flag' ? 1.8 : 1.4, kb: rage ? 80 : 45, kg: rage ? 2.2 : 1.4, knockup: rage ? 220 : 0, tag: 'A' })]]);
        }
      }
      // đội hình
      const at = angTo(o, t), side = [0, 1.1, -1.1, 0][d.ws.slot] || 0;
      let gx, gy;
      if (rage || (mode === 'flag' && !d.ws.heavy)) { const a = at + Math.PI + side * 0.6; gx = t.x + Math.cos(a) * 40; gy = t.y + Math.sin(a) * 40; }
      else if (gun || d.ws.heavy) { const a = angTo(t, o) + (d.ws.slot - 1) * 0.65; const R = Math.min(260, Math.max(170, dist(o, t))); gx = t.x + Math.cos(a) * R; gy = t.y + Math.sin(a) * R; }
      else if (d.ws.slot === 0) { gx = t.x; gy = t.y; }
      else { gx = o.x + Math.cos(at + side) * 55; gy = o.y + Math.sin(at + side) * 55; }
      if (dist(d, o) > 420 && !rage) { gx = o.x; gy = o.y; }
      steerToward(d, m, gx, gy, 18);
    },
  },

  // ================= BỘ BÀI MA THUẬT (Joker) =================
  bai: {
    name: 'Bộ Bài Ma Thuật', icon: '🃏', color: '#ffd24a', weight: 0.92, speed: 1.1, gfx: 'cards',
    role: 'Biến ảo • May rủi & đạo tặc trang bị', ai: { range: 190, ranged: true, defend: ['C'] },
    passive: { name: 'Bịp Bợm & Giả Ngây Ngô', desc: 'Nhân đôi kỹ năng: A 35%, B/C 15% (+May Mắn). Lá Rô cộng vĩnh viễn +2% May Mắn (tối đa 20%). Giả Ngây Ngô: bị tướng NAM đánh có tỉ lệ né hoàn toàn (cục súc Borg/Koda/Clint 45% • lão luyện Gideon/Valerius/Ryoma/Kazuki 15% • còn lại 25%); tướng NỮ chỉ 5%. Ấn Mặt Trời (x2 Rô/Cơ) • Ấn Mặt Trăng (x2 Bích/Tép) • dính cả 2: CHOÁNG 2.5s + 40% lực đẩy. Nhà cái: +35% vàng khi thắng.' },
    init(f) { f.ws.card = null; f.ws.uses = 0; f.ws.sureC = false; f.ws.stolen = f.ws.stolen || null; },
    resource(f) {
      return `🃏 ${f.ws.card ? JK_ICON[f.ws.card] + (f.ws.uses > 1 ? ' x2' : '') : 'tay không'} • 🍀 ${Math.floor(f._luck || 0)}%` + (f.ws.stolen ? ` • D: ${f.ws.stolen.kind === 'item' ? ITEM_BY_ID[f.ws.stolen.id].icon : SPELLS[f.ws.stolen.id].icon}` : '');
    },
    onDeal(f, t, hit, info, m) {
      const mk = jkMarks(t, m);
      if (hit.suit === 'spade') {
        if (mk && mk.moon) info.kbMult *= 2;
        if (f.T('joker_3a') && m.arena.edgeDist(t.x, t.y) < 120) info.kbMult *= 1.5;
      }
    },
    // Giả Ngây Ngô: né hoàn toàn đòn của tướng nam
    onIncoming(f, att, hit, m) {
      if (!att || att.isEnv || hit.quiet) return true;
      const o = att.owner || att; if (o === f) return true;
      const cid = o.charId;
      let ch = JK_FEM.has(cid) ? 0.05 : JK_LOW.includes(cid) ? 0.45 : JK_DISC.includes(cid) ? 0.15 : 0.25;
      if (!JK_FEM.has(cid) && f.T('joker_3c')) ch += 0.15;
      if (Math.random() >= ch) return true;
      m.text(f.x, f.y - 56, JK_FEM.has(cid) ? '😏 NÉ!' : '😉 ẤY~ NÉ!', '#ffd24a', 14);
      return false;
    },
    skills: {
      A: { name: 'Phi Bài Sắc Cạnh', cd: 0.4, desc: 'Ném lá bài đang giữ theo đường thẳng tầm xa, áp toàn bộ hiệu ứng chất bài rồi tiêu hao. Tay không: lá bài trắng cấu rỉa. 35% nhân đôi: búng thêm 1 lá y hệt.',
        ai: { type: 'atk', max: 400, pri: 2 },
        use(f, m) {
          const card = f.ws.card, a = aimOr(f, m, 420, 820);
          f.act(0.2, { move: 0.6, anim: 'throw', atk: true });
          jkThrow(f, m, card, a);
          if (jkX2(f, 'A')) m.later(0.12, () => { if (f.alive) { jkThrow(f, m, card, aimOr(f, m, 420, 820)); m.text(f.x, f.y - 56, 'x2!', '#ffd24a', 13); } });
          if (card) { if (f.ws.uses > 1) f.ws.uses--; else f.ws.card = null; }
        } },
      B: { name: 'Rút Bài May Rủi', cd: 2, desc: 'Rút ngẫu nhiên: 25% RÚT HỤT • 18% ♠️ Bích (lực đẩy cực đại) • 18% ♣️ Tép (Choáng/Chậm/Câm/Cháy — ngẫu nhiên có hoặc không) • 17% ♦️ Rô (nổ diện rộng, +2% May Mắn) • 17% ♥️ Cơ (hồi 15% điểm văng) • 5% 🃏 Joker (đổi chỗ + khắc Ấn). 15% nhân đôi: giữ lá cho 2 lần ném.',
        ai: { type: 'buff', max: 0 },
        use(f, m) {
          f.act(0.2, { move: 0.7, anim: 'raise' });
          const c = jkDraw(f, m, false);
          if (c !== 'blank' && jkX2(f, 'B')) { f.ws.uses = 2; m.text(f.x, f.y - 76, 'x2 — giữ lá!', '#ffd24a', 13); }
        } },
      C: { name: 'Tráo Bài Dưới Tay Áo', cd: 3, desc: 'Lướt 1.5m né đòn và tráo bài: 25% KẸT TAY ÁO (giữ nguyên bài) • 75% thành công: rút lá mới (không còn rút hụt, Joker 15%). 15% nhân đôi: lướt thêm nhịp nữa và lần tráo kế tiếp chắc chắn thành công.',
        ai: { type: 'def', max: 260, mob: 'escape' },
        use(f, m) {
          const old = { x: f.x, y: f.y };
          f.startDash({ angle: f.castAngle, dist: 60, dur: 0.14, invuln: true, trail: true });
          const ok = f.ws.sureC || f.T('joker_9b') || Math.random() >= 0.25;
          f.ws.sureC = false;
          if (ok) jkDraw(f, m, true); else { f.ws.cFail = m.time; m.text(f.x, f.y - 60, '😣 KẸT TAY ÁO!', '#ff9a6a', 14); }
          if (jkX2(f, 'C')) { f.ws.sureC = true; m.later(0.16, () => { if (f.alive) f.startDash({ angle: f.castAngle, dist: 60, dur: 0.14, invuln: true, trail: true }); }); m.text(f.x, f.y - 76, 'x2!', '#ffd24a', 13); }
          // Bài Ảo Đánh Lạc Hướng: hình nhân bài giấy phát nổ khi kẻ địch chạm vào
          if (f.T('joker_6c')) {
            const z = m.zone({ owner: f, x: old.x, y: old.y, r: 26, life: 6, every: 0.1, kind: 'doll', color: 'rgba(255,210,74,0.35)',
              tick: (mm, zz) => {
                for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - zz.x, e.y - zz.y) < 40 + e.r) {
                  mm.hitCircle(f, { x: zz.x, y: zz.y, r: 70, dmg: 5, kb: 180, kg: 4.5, tag: 'C' }); mm.fx({ type: 'boom', x: zz.x, y: zz.y, r: 55, color: '#ffd24a', life: 0.3 });
                  zz.life = 0; break;
                }
              } });
            void z;
          }
        } },
      D: { name: '"Mượn Tý Nha!"', cd: 10, manualCd: true, desc: 'Bất kỳ ai (kể cả Joker) kích hoạt Trang Bị Chủ Động hoặc Phép Bổ Trợ: ô D lập tức nạp bản sao và HỒI CHIÊU D VỀ 0. Bấm D để dùng bản sao ngay. Sau đó hồi 10s + 25% hồi chiêu gốc của món vừa dùng.',
        ai: { type: 'atk', max: 400, pri: 3 },
        can(f) { return !!f.ws.stolen; },
        use(f, m) {
          const s = f.ws.stolen; f.ws.stolen = null;
          const t = m.nearestEnemy(f);
          f._dCasting = true;
          let base = 20;
          if (s.kind === 'item') { const A = ITEM_BY_ID[s.id].active; base = A.cd; A.use(f, m, t); }
          else { const S = SPELLS[s.id]; base = S.cd; S.use(f, m, t); }
          f._dCasting = false;
          if (f.T('joker_9a')) f.addStatus('empower', 2, 0.3);
          f.cd.D = (10 + base * 0.25) * f.cdMult;
          f.act(0.2, { move: 0.5, anim: 'throw' });
          m.text(f.x, f.y - 70, '🃏 MƯỢN TÝ NHA!', '#ffd24a', 16);
        } },
      U: { name: 'Ván Cờ Đổi Chiều', desc: 'Tung hộp bài lên trời: 25% Tráo Đổi Sinh Mệnh (hoán đổi điểm văng) • 50% Lá Toàn Năng (Bích + Tép + Rô + Cơ + Đổi chỗ) • 20% Đại Bác Bài Nổ quét ngang sàn • 4.8% Cơn Ác Mộng (CHOÁNG 10s) • 0.2% Thần Chết Bịp Bợm (kết liễu lập tức).',
        ai: { type: 'buff', max: 0 },
        use(f, m) {
          const t = m.nearestEnemy(f); if (!t) return;
          let br;
          if (f.T('joker_12b')) br = f.percent - t.percent > 40 ? 'swap' : 'super';
          else {
            const r = Math.random(), ex = f.T('joker_12c') && f.percent >= 100 ? 0.05 : 0.002;
            br = r < ex ? 'exec' : r < ex + 0.25 ? 'swap' : r < ex + 0.75 ? 'super' : r < ex + 0.95 ? 'cannon' : 'night';
          }
          f.act(0.4, { move: 0, anim: 'raise' });
          for (let i = 0; i < 16; i++) m.particle(f.x, f.y - 20, { color: pick(Object.values(JK_COL)), life: 0.7, size: 5, vx: rand(-200, 200), vy: rand(-320, -60) });
          if (br === 'swap') { const p = f.percent; f.percent = t.percent; t.percent = p; m.text(f.x, f.y - 80, '🔄 TRÁO ĐỔI SINH MỆNH!', '#ffd24a', 19); }
          else if (br === 'super') {
            jkSwap(f, t, m);
            m.applyHit(f, t, { dmg: 8, kb: 290, kg: 7.5, tag: 'U', angle: angTo(f, t) });
            for (const s of ['club', 'diamond', 'heart']) jkEffect(f, m, t, s);
            t.addStatus('stun', 0.75); t.addStatus('silence', 1);
            m.text(f.x, f.y - 80, '🌈 LÁ BÀI TOÀN NĂNG!', '#ffd24a', 19);
          } else if (br === 'cannon') {
            const a = angTo(f, t);
            m.hitLine(f, { angle: a, len: 900, w: 130, dmg: 8, kb: 255, kg: 6.4, tag: 'U' });
            m.fx({ type: 'thrust', x: f.x, y: f.y, a, len: 900, w: 65, color: '#ffd24a', life: 0.45 }); m.shake(12);
            m.text(f.x, f.y - 80, '💥 ĐẠI BÁC BÀI NỔ!', '#ffd24a', 19);
          } else if (br === 'night') {
            if (!t.has('unstoppable') && !t.has('immortal')) t.addStatus('stun', 10);
            m.text(t.x, t.y - 80, '😱 CƠN ÁC MỘNG CỜ BẠC!', '#c070ff', 20);
          } else {
            m.applyHit(f, t, { dmg: 20, kb: 3200, kg: 0, unblockable: true, tag: 'U', angle: nearestEdgeAngle(m, t.x, t.y) });
            m.text(t.x, t.y - 80, '💀 THẦN CHẾT BỊP BỢM!!!', '#ffd700', 24); m.shake(20);
          }
        } },
    },
  },

  // ================= THIẾT PHIẾN (Diệp Thanh Phong) =================
  thiet_phien: {
    name: 'Thiết Phiến', icon: '🪭', color: '#7ad0b0', weight: 0.98, speed: 1.12, gfx: 'fan',
    role: 'Sát thủ biến ảo • Thao túng gió', ai: { range: 140, defend: ['C'] },
    passive: { name: 'Khí Áp Phong Vũ', desc: 'Thước gió 0–100. 🍃 Thuận Phong (≤35): +30% tốc chạy, Giáp Phong Hộ chặn 1 đòn (hồi sau 10s không trúng đòn) • 🌀 Bão Hòa (36–64): +15% tốc chạy & sát thương, đòn A gây Gió Mê (chậm 20%, đủ 3 tầng NGỦ GẬT 1s) • 🌪️ Nghịch Phong (≥65): +25% sát thương, +35% lực văng. A kéo gió về Thuận (-15), B đẩy về Nghịch (+15). Đòn đầu tiên đánh thức kẻ đang ngủ: x2 lực văng.' },
    init(f) { f.ws.wind = f.ws.wind ?? 50; f.ws.barT = 0; f.ws.bar = false; f.ws.shieldT = 0; f.ws.spinT = 0; },
    resource(f) {
      const s = tpState(f), w = f.T('thanhphong_12a') ? 100 : Math.round(f.ws.wind);
      return `${s === 'thuan' ? '🍃 Thuận Phong' : s === 'nghich' ? '🌪️ Nghịch Phong' : '🌀 Bão Hòa'} ${w}` + (f.ws.bar ? ' • 🛡 Phong Hộ' : '') + (f.ws.shieldT > 0 ? ` • 🌬 Màng gió ${f.ws.shieldT.toFixed(1)}s` : '');
    },
    update(f, m, dt) {
      const s = tpState(f);
      if (s === 'thuan') { f.frameSpeed *= f.T('thanhphong_1a') ? 1.45 : 1.3; if (!f.ws.bar) { f.ws.barT += dt; if (f.ws.barT >= (f.T('thanhphong_1c') ? 7.5 : 10)) { f.ws.bar = true; m.text(f.x, f.y - 56, '🛡 PHONG HỘ', '#bff0e0', 12); } } }
      else if (s === 'bao') f.frameSpeed *= 1.15;
      if (f.ws.spinT > 0) f.ws.spinT -= dt;
      // Phong Thuẫn Di Động: chặn đạn, cắt gọt kẻ chạm vào
      if (f.ws.shieldT > 0) {
        f.ws.shieldT -= dt; f.ws.shAcc = (f.ws.shAcc || 0) + dt;
        for (const p of m.projs) {
          if (p.dead || p.owner.team === f.team || Math.hypot(p.x - f.x, p.y - f.y) > 66) continue;
          if (f.T('thanhphong_3c')) { const b = p.owner; p.owner = f; p.hitSet = new Set(); p.traveled = 0; const a = b && b.alive ? Math.atan2(b.y - p.y, b.x - p.x) : p.ang + Math.PI; p.ang = a; p.vx = Math.cos(a) * p.speed; p.vy = Math.sin(a) * p.speed; if (p.hit) p.hit = Object.assign({}, p.hit, { dmg: (p.hit.dmg || 0) * 0.3 }); }
          else p.dead = true;
        }
        if (f.ws.shAcc >= 0.3) { f.ws.shAcc = 0; for (const e of m.enemiesOf(f)) if (dist(e, f) < f.r + e.r + 26) m.applyHit(f, e, { dmg: 1.2, kb: 60, kg: 0.5, tag: 'B', quiet: true }); }
        if (Math.random() < 0.5) m.particle(f.x + rand(-40, 40), f.y + rand(-40, 40), { color: '#bff0e0', life: 0.35, size: 3, vx: rand(-60, 60), vy: rand(-60, 60) });
      }
    },
    onDeal(f, t, hit, info, m) {
      const s = tpState(f);
      if (s === 'bao') {
        info.mult *= 1.15;
        if (hit.tag === 'A' && !t.isMinion) {
          const dr = t.drowsy && t.drowsy.until > m.time ? t.drowsy : { n: 0 };
          dr.n++; dr.until = m.time + 4; t.drowsy = dr;
          info.extra.push(() => { t.addStatus('slow', 2, 0.2); if (dr.n >= 3) { t.drowsy = null; tpSleep(t, m, 1); } });
        }
      } else if (s === 'nghich') { info.mult *= 1.25; info.kbMult *= f.T('thanhphong_1b') ? 1.55 : 1.35; }
      // đánh thức kẻ đang ngủ
      if (t._sleepT > m.time) {
        t._sleepT = 0; t.removeStatus('stun'); info.kbMult *= 2;
        if (f.T('thanhphong_9a')) info.mult *= 1.5;
        m.text(t.x, t.y - 70, '⏰ TỈNH GIẤC — x2!', '#bff0e0', 16);
      }
    },
    onTake(f, att, hit, info) {
      if (att && !att.isEnv && !hit.quiet) f.ws.barT = 0;
      if (f.T('thanhphong_9c') && tpState(f) === 'bao' && (hit.kb || 0) < 130 && (hit.kg || 0) < 5) info.kbMult = 0;
    },
    onIncoming(f, att, hit, m) {
      if (!att || att.isEnv || att === f || hit.quiet) return true;
      if (tpState(f) === 'thuan' && f.ws.bar) {
        f.ws.bar = false; f.ws.barT = 0;
        m.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#bff0e0', life: 0.35, w: 6 }); m.text(f.x, f.y - 56, '🛡 PHONG HỘ CHẶN!', '#bff0e0', 14);
        return false;
      }
      return true;
    },
    onKill(f, v, m) { if (f.T('thanhphong_12c') && v._sleepT > m.time - 0.5) { f.rage = 100; m.text(f.x, f.y - 70, '🎶 LỜI RU VĨNH CỬU', '#bff0e0', 16); } },
    skills: {
      A: { name: 'Toàn Phong Quy', cd: 2, desc: 'Phóng lốc xoáy theo đường thẳng hất tung kẻ trên đường bay. 🍃 Thuận: lốc dừng ở kẻ đầu tiên thành Vực Xoáy Gió hút & xé 2.5s • 🌪️ Nghịch: Bất Tử 0.6s, hóa luồng ám phong lướt theo lốc, xuyên qua kẻ địch xuất hiện sau lưng. Kéo gió -15.',
        ai: { type: 'atk', max: 400, pri: 2.2 },
        use(f, m) {
          const s = tpState(f), a = aimOr(f, m, 420, 560);
          f.facing = a;
          f.act(0.3, { move: 0.3, anim: 'swing', atk: true });
          if (f.T('thanhphong_6b')) {
            for (let i = -2; i <= 2; i++) shoot(f, m, a + i * 0.16, { speed: 760, r: 9, range: 300, kind: 'wave', color: '#bff0e0', hit: { dmg: 3, kb: 90, kg: 2.6, slow: [0.4, 1.5], tag: 'A' } });
            m.text(f.x, f.y - 56, '🪭 PHIẾN KHÍ BÁT ĐOẠN', '#bff0e0', 13);
          } else if (s === 'thuan') {
            shoot(f, m, a, { speed: 560, r: 18, range: 420, kind: 'tornado', color: '#bff0e0', hit: { dmg: 3, kb: 40, kg: 1, knockup: 200, tag: 'A' },
              onHit: (mm, p) => {
                const pull = f.T('thanhphong_3b') ? 2 : 1;
                mm.zone({ owner: f, x: p.x, y: p.y, r: 95, life: 2.5, every: 0.25, kind: 'vortex', color: 'rgba(190,240,224,0.18)',
                  tick: (q, z) => { for (const e of q.enemiesOf(f)) { const dd = Math.hypot(e.x - z.x, e.y - z.y); if (dd > z.r + e.r) continue; q.applyHit(f, e, { dmg: 0.9, noKnock: true, tag: 'A', quiet: true }); if (dd > 12 && !e.superArmor) { const g = Math.atan2(z.y - e.y, z.x - e.x); e.vx += Math.cos(g) * 90 * pull; e.vy += Math.sin(g) * 90 * pull; } } } });
              } });
          } else if (s === 'nghich') {
            let done = false;
            f.invulnT = Math.max(f.invulnT, 0.6);
            f.startDash({ angle: a, dist: 300, dur: 0.5, through: true, phase: true, trail: true });
            shoot(f, m, a, { speed: 600, r: 18, range: 420, kind: 'tornado', color: '#7ad0b0', pierce: true, hit: { dmg: 4, kb: 70, kg: 2.2, knockup: 280, tag: 'A' },
              onHit: (mm, p, t) => {
                if (done || t.isMinion) return; done = true;
                tpBehind(f, t, mm, p.ang);
                if (f.T('thanhphong_9b')) f.cd.A = 0;
              } });
          } else {
            shoot(f, m, a, { speed: 560, r: 18, range: 420, kind: 'tornado', color: '#9ae0c8', pierce: true, hit: { dmg: 4, kb: 60, kg: 2, knockup: 280, tag: 'A' } });
          }
          tpWind(f, m, -15);
          m.sfx('wind_magic', { vol: 0.5 });
        } },
      B: { name: 'Bát Diện Phong Trận / Đoạt Mệnh Phong Kích', cd: 5, desc: 'Bung quạt 360° đẩy dạt mọi kẻ địch ra 2m. 🍃 Thuận: hóa Màng Chắn Gió 5s đi theo người — chặn 100% đạn, cắt kẻ chạm vào • 🌪️ Nghịch: phóng lưỡi dao gió bán nguyệt; trúng thì tàng hình dịch chuyển ra SAU LƯNG mục tiêu và đâm quạt sắt chí mạng, lực văng khổng lồ. Đẩy gió +15.',
        ai: { type: 'atk', max: 320, pri: 2.4 },
        // Lốc Xoáy Kép: sau cú đâm sau lưng
        recast(f) { return f.T('thanhphong_6a') && f.ws.spinT > 0; },
        recastAi: (f, t, m, d) => d < 110,
        recastUse(f, m) {
          f.ws.spinT = 0;
          f.act(0.35, { move: 0, anim: 'spin', atk: true }, [[0.1, () => { m.hitCircle(f, { r: 95, dmg: 4, kb: 120, kg: 3, knockup: 460, tag: 'B' }); m.fx({ type: 'whirl', x: f.x, y: f.y, r: 90, a: f.facing, color: '#bff0e0', life: 0.3, w: 10 }); }]]);
          m.text(f.x, f.y - 60, '🌪️ LỐC XOÁY KÉP!', '#bff0e0', 15);
        },
        use(f, m) {
          const s = tpState(f);
          if (s === 'nghich') {
            const a = aimOr(f, m, 320, 900); f.facing = a;
            f.act(0.25, { move: 0.2, anim: 'swing', atk: true });
            let done = false;
            shoot(f, m, a, { speed: 900, r: 16, range: 320, kind: 'wave', color: '#7ad0b0', hit: { dmg: 3, noKnock: true, tag: 'B' },
              onHit: (mm, p, t) => {
                if (done || !t.alive) return; done = true;
                f.addStatus('invis', 0.3); f.addStatus('untargetable', 0.3);
                const back = angTo(f, t);
                tpBehind(f, t, mm, back);
                mm.later(0.12, () => {
                  if (!t.alive || !f.alive) return;
                  mm.applyHit(f, t, { dmg: 10, kb: 290, kg: 7.8, tag: 'B', angle: angTo(f, t) });
                  mm.fx({ type: 'thrust', x: f.x, y: f.y, a: angTo(f, t), len: 80, w: 18, color: '#bff0e0', life: 0.2 }); mm.shake(8);
                  if (f.T('thanhphong_6a')) f.ws.spinT = 1.2;
                });
                mm.text(f.x, f.y - 66, '🗡️ ĐOẠT MỆNH PHONG KÍCH!', '#bff0e0', 16);
              } });
          } else {
            f.act(0.3, { move: 0, anim: 'spin', atk: true }, [[0.08, () => {
              m.hitCircle(f, { r: 105, dmg: 3, kb: 200, kg: 2.5, tag: 'B' });
              m.fx({ type: 'ring', x: f.x, y: f.y, r: 105, color: '#bff0e0', life: 0.35, w: 8 });
            }]]);
            if (s === 'thuan') { f.ws.shieldT = 5; m.text(f.x, f.y - 60, '🌬 PHONG THUẪN!', '#bff0e0', 15); }
          }
          tpWind(f, m, 15);
        } },
      C: { name: 'Mê Tung Phong Vực', cd: 7, desc: 'Tạo luồng gió độc mờ mịt 3s tại chỗ: kẻ địch bên trong bị MÙ và CÂM LẶNG 1.5s. Bản thân mượn áp lực gió dịch chuyển tức thời 3.5m.',
        ai: { type: 'def', max: 260, mob: 'escape' },
        use(f, m) {
          const x = f.x, y = f.y, hitOnce = new Set();
          m.zone({ owner: f, x, y, r: 95, life: 3, every: 0.2, kind: 'rsmoke', color: 'rgba(120,170,150,0.42)',
            tick: (mm, z) => { for (const e of mm.enemiesOf(f)) { if (Math.hypot(e.x - z.x, e.y - z.y) > z.r + e.r) continue; e.addStatus('blind', 0.4); if (!hitOnce.has(e)) { hitOnce.add(e); e.addStatus('silence', 1.5); } if (f.T('thanhphong_3a')) e.addStatus('poison', 0.5, 2.2); } } });
          const a = f.castAngle, q = m.arena.clamp({ x: f.x + Math.cos(a) * 140, y: f.y + Math.sin(a) * 140 }, f.r + 30);
          m.fx({ type: 'ghost', x: f.x, y: f.y, r: f.r, color: '#bff0e0', life: 0.3 });
          f.x = q.x; f.y = q.y; f.vx = f.vy = 0; f.invulnT = Math.max(f.invulnT, 0.2);
          m.sfx('wind_magic', { vol: 0.5 });
        } },
      D: { name: 'Nghịch Chuyển Canh Khí', cd: 4, breakCC: true, desc: 'Thuận Phong: +30 gió (vọt sang Nghịch) • Nghịch Phong: -30 gió (về Thuận) • Bão Hòa: kích nổ khí áp — 50% về 15 hoặc 50% lên 85, đồng thời THANH TẨY mọi khống chế (dùng được cả khi đang bị choáng).',
        ai: { type: 'buff', max: 0 },
        can(f) { return !(f.has('stun') || f.has('root') || f.has('charm')) || tpState(f) === 'bao'; },
        use(f, m) {
          const s = tpState(f);
          if (s === 'thuan') tpWind(f, m, 30);
          else if (s === 'nghich') tpWind(f, m, -30);
          else { f.ws.wind = Math.random() < 0.5 ? 15 : 85; f.cleanse(); m.text(f.x, f.y - 70, f.ws.wind > 50 ? '🌪️ NGHỊCH PHONG!' : '🍃 THUẬN PHONG!', '#bff0e0', 15); m.fx({ type: 'ring', x: f.x, y: f.y, r: 60, color: '#bff0e0', life: 0.35, w: 6 }); }
          if (f.T('thanhphong_6c')) f.percent = Math.max(0, f.percent - 10);
        } },
      U: { name: 'Cơn Gió Đưa Giấc', desc: 'Cắm quạt xuống sàn mở Vùng Bão Tố Mê Hoặc 6s: kẻ địch bên trong chịu sát thương lưỡi gió và chậm 60%; đứng trong vùng quá 2.5s → NGỦ SAY 2s. Đòn đầu tiên đánh thức: x2 lực văng.',
        ai: { type: 'buff', max: 0 },
        use(f, m) {
          const t = m.nearestEnemy(f);
          // Long Quyển Phong Bạo: vòi rồng cuốn phăng mục tiêu trên 60%
          if (f.T('thanhphong_12b') && t && t.percent > 60) {
            for (const e of m.enemiesOf(f)) {
              if (e.percent > 60 && !e.isMinion && !e.has('immortal')) m.applyHit(f, e, { dmg: 6, kb: 1000, kg: 0, unblockable: true, tag: 'U', angle: nearestEdgeAngle(m, e.x, e.y) });
              else m.applyHit(f, e, { dmg: 6, kb: 260, kg: 5, tag: 'U', angle: angTo(f, e) });
            }
            m.fx({ type: 'whirl', x: 0, y: 0, r: 400, a: 0, color: '#bff0e0', life: 0.7, w: 20 }); m.shake(16);
            m.text(f.x, f.y - 80, '🌪️ LONG QUYỂN PHONG BẠO!', '#bff0e0', 20);
            return;
          }
          const sl = f.T('thanhphong_9a') ? 3 : 2;
          f.act(0.4, { move: 0, anim: 'raise' });
          m.zone({ owner: f, x: f.x, y: f.y, r: 230, life: 6, every: 0.25, kind: 'vortex', color: 'rgba(160,200,255,0.16)',
            tick: (mm, z) => {
              for (const e of mm.enemiesOf(f)) {
                if (Math.hypot(e.x - z.x, e.y - z.y) > z.r + e.r) { e._tpIn = 0; continue; }
                e.addStatus('slow', 0.35, 0.6);
                mm.applyHit(f, e, { dmg: 0.7, noKnock: true, tag: 'U', quiet: true });
                e._tpIn = (e._tpIn || 0) + 0.25;
                if (e._tpIn >= 2.5 && !(e._sleepT > mm.time)) { e._tpIn = -2; tpSleep(e, mm, sl); }
              }
            } });
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 230, color: '#a0c8ff', life: 0.6, w: 10 });
        } },
    },
  },

  // ================= BÌNH ĐỘC (Galo) =================
  binh_doc: {
    name: 'Bình Thí Nghiệm & Móng Vuốt Biến Dị', icon: '🧪', color: '#7ae04a', weight: 0.94, speed: 1.06, gfx: 'flask',
    role: 'Đấu sĩ đổi dạng • Gieo độc & cuồng chiến', ai: { range: 200, ranged: true, defend: ['C'] },
    passive: { name: 'Độc Tiêu Xương & Cơn Nghiện', desc: 'Dạng Người (Tư duy cao): đòn độc găm 1 tầng Tiêu Xương (5s, tối đa 6): rút điểm văng mỗi giây và giảm 5% kháng đẩy lùi mỗi tầng — đủ 6 tầng: nạn nhân nhẹ bẫng (-30% trọng lượng). Dạng Quái Thú (D, 20s): +15% điểm văng bản thân nhưng có khiên, Siêu Giáp, nặng hơn 40%, lao vào cắn xé bất chấp mép vực. Hết thuốc: Vã Thuốc 3s (chậm 30%, cấm lướt), D hồi 25s.' },
    init(f) { f.ws.beast = 0; f.ws.wd = 0; f.ws.apex = 0; f.ws.slamT = 0; f.ws.climbed = false; f.ws.pounceT = 0; },
    resource(f) {
      return galoBeast(f) ? `🐺 QUÁI THÚ${f.T('galo_12a') ? ' (vĩnh viễn)' : ` ${f.ws.beast.toFixed(0)}s`}` + (f.ws.apex > 0 ? ` • 🩸 SĂN MỒI ${f.ws.apex.toFixed(0)}s` : '') : `🧪 Dược Sĩ Điên` + (f.ws.wd > 0 ? ' • 😵 vã thuốc' : '');
    },
    update(f, m, dt) {
      // giảm kháng đẩy lùi của nạn nhân theo tầng độc
      for (const e of m.bodies) {
        if (e.team === f.team) continue;
        if (e.venom && e.venom.owner === f && e.venom.until > m.time) e.venomK = 1 - 0.05 * e.venom.n;
        else if (e.venom && e.venom.owner === f) { e.venom = null; e.venomK = 1; }
      }
      if (f._wisBase == null) f._wisBase = f.wis;
      if (f.ws.beast > 0 && !f.T('galo_12a')) { f.ws.beast -= dt; if (f.ws.beast <= 0) galoEndBeast(f, m); }
      const beast = galoBeast(f);
      f.wis = beast ? (f.T('galo_12a') ? 7.5 : 2) : Math.max(f._wisBase, 9);
      if (beast) { f.frameWeight *= 1.25; if (f.ws.apex > 0) { f.ws.apex -= dt; f.frameSpeed *= 1.5; } }
      if (f.ws.wd > 0) { f.ws.wd -= dt; f.frameSpeed *= 0.7; }
      if (f.ws.slamT > 0) f.ws.slamT -= dt;
      // Bước Chân Hóa Chất: vệt axit làm chậm kẻ đuổi theo
      if (beast && f.T('galo_1c')) { f.ws.trT = (f.ws.trT || 0) - dt; if (f.ws.trT <= 0 && (f.moveDir.x || f.moveDir.y)) { f.ws.trT = 0.4; m.zone({ owner: f, x: f.x, y: f.y, r: 30, life: 2, every: 0.25, kind: 'acid', color: 'rgba(120,230,70,0.25)', tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) e.addStatus('slow', 0.4, 0.3); } }); } }
      // Hấp Thu Độc Chất: đứng trong vũng độc của mình hồi điểm văng
      if (f.T('galo_6c') && m.zones.some((z) => z.owner === f && (z.kind === 'gas' || z.kind === 'fog') && Math.hypot(f.x - z.x, f.y - z.y) < z.r)) f.percent = Math.max(0, f.percent - 5 * dt);
    },
    onDeal(f, t, hit, info, m) {
      if (hit.tag === 'B' && galoBeast(f) && galoN(f, t, m) >= 6) info.kbMult *= 1.4;
    },
    afterDeal(f, t, hit, m) { if (f.ws.apex > 0 && hit.tag === 'A') f.percent = Math.max(0, f.percent - 2); },
    onKill(f, v, m) { if (f.T('galo_12c') && v.venom) { f.rage = 100; m.text(f.x, f.y - 70, '☠️ CUỒNG HUYẾT ĐỘC DƯỢC', '#8be04a', 15); } },
    // Bản Năng Bất Tử: dạng Thú bị đánh văng khỏi mép → bám vách leo lên 1 lần
    onFall(f, m) {
      if (!(f.T('galo_9c') && galoBeast(f) && !f.ws.climbed)) return true;
      f.ws.climbed = true;
      const p = m.arena.clamp({ x: f.x, y: f.y }, f.r + 20);
      f.x = p.x; f.y = p.y; f.vx = f.vy = 0; f.hitstun = 0; f.invulnT = Math.max(f.invulnT, 0.5);
      m.text(f.x, f.y - 66, '🧗 BÁM VÁCH LEO LÊN!', '#8be04a', 17);
      return false;
    },
    skills: {
      A: { name: 'Ném Lọ Độc / Song Trảo Cuồng Xé', cd: 1, manualCd: true, desc: 'Người: ném lọ hóa chất tầm trung, vỡ ra đốt axit và găm 1 tầng Tiêu Xương • Thú (hồi 0.5s): cào 2 nhát chữ X cực nhanh, hất lùi từng đoạn.',
        ai: { type: 'atk', max: 340, pri: 2.2 },
        use(f, m) {
          if (galoBeast(f)) {
            const hit = () => m.hitArc(f, { range: 72, arc: 120, dmg: 2.3, kb: 70, kg: 2.2, tag: 'A' });
            f.act(0.28, { move: 0.5, anim: 'swing', atk: true }, [[0.06, hit], [0.17, hit]]);
            f.cd.A = 0.5 * f.cdMult;
            return;
          }
          f.act(0.25, { move: 0.5, anim: 'throw', atk: true }); f.cd.A = f.cdOf('A');
          if (f.T('galo_6b')) {
            for (const p of m.projs) if (!p.dead && p.owner.team !== f.team && Math.hypot(p.x - f.x, p.y - f.y) < 160 && Math.abs(angDiff(f.facing, Math.atan2(p.y - f.y, p.x - f.x))) < 0.7) p.dead = true;
            const hs = m.hitArc(f, { range: 155, arc: 70, dmg: 2.5, kb: 60, kg: 1.6, tag: 'A' });
            for (const e of hs) galoVenom(f, e, m);
            for (let i = 0; i < 12; i++) m.particle(f.x, f.y, { color: '#8be04a', life: 0.35, size: 4, vx: Math.cos(f.facing + rand(-0.35, 0.35)) * rand(250, 450), vy: Math.sin(f.facing + rand(-0.35, 0.35)) * rand(250, 450) });
            return;
          }
          galoFlask(f, m);
        } },
      B: { name: 'Bom Khí Ngạt / Ngoạm Cắn Đoạt Mệnh', cd: 4.5, manualCd: true, desc: 'Người: lựu đạn khí ga tạo vũng độc 3.5s — chậm 40% và MÙ • Thú (hồi 3.5s): lao tới ngoạm cổ rồi hất tung về hướng mép sàn; +40% lực văng nếu mục tiêu đã đủ 6 tầng độc.',
        ai: { type: 'atk', max: 320, pri: 2.4 },
        use(f, m) {
          if (galoBeast(f)) {
            const hitSet = new Set();
            f.act(0.35, { move: 0, anim: 'thrust', atk: true });
            f.startDash({ angle: f.castAngle ?? f.facing, dist: 130, dur: 0.18, trail: true, onContact: (e) => {
              if (hitSet.has(e)) return true; hitSet.add(e);
              if (f.T('galo_3b')) { e.removeStatus('shield'); e.removeStatus('block'); }
              const exec = f.ws.apex > 0 && e.percent > 60 && !e.isMinion;
              m.applyHit(f, e, exec ? { dmg: 8, kb: 2400, kg: 0, unblockable: true, tag: 'B', angle: nearestEdgeAngle(m, e.x, e.y) } : { dmg: 7, kb: 210, kg: 5.6, tag: 'B', angle: nearestEdgeAngle(m, e.x, e.y) });
              m.text(e.x, e.y - 56, exec ? '🩸 KẾT LIỄU!' : '🦷 NGOẠM!', '#8be04a', exec ? 18 : 15); m.shake(exec ? 12 : 6);
              return true;
            } });
            f.cd.B = 3.5 * f.cdMult;
            return;
          }
          const a = aimOr(f, m, 300, 620); f.cd.B = f.cdOf('B');
          f.act(0.3, { move: 0.3, anim: 'throw', atk: true });
          const gas = (mm, p) => {
            const once = new Set();
            mm.zone({ owner: f, x: p.x, y: p.y, r: 85, life: 3.5, every: 0.25, kind: 'gas', color: 'rgba(120,220,70,0.3)',
              tick: (q, z) => { for (const e of q.enemiesOf(f)) { if (Math.hypot(e.x - z.x, e.y - z.y) > z.r + e.r) continue; e.addStatus('slow', 0.4, 0.4); e.addStatus('blind', 0.4); if (!once.has(e)) { once.add(e); galoVenom(f, e, q); if (f.T('galo_3a')) e.addStatus('silence', 1); } } } });
          };
          shoot(f, m, a, { speed: 620, r: 9, range: 300, kind: 'flask', color: '#5ac03a', hit: null, onHit: gas, onEnd: gas });
        } },
      C: { name: 'Nhảy Lùi Thoát Hiểm / Hống Xung Phong', cd: 6, manualCd: true, desc: 'Người: bật nhảy lùi 3.5m, xả khói độc che mắt và +25% tốc chạy 2s • Thú (hồi 5s): gầm CHOÁNG 0.5s kẻ trước mặt rồi phi thân vồ tới trong cự ly 4m.',
        ai: { type: 'def', max: 260, mob: 'escape' },
        recast(f) { return f.T('galo_6a') && f.ws.slamT > 0 && f.ws.slamTarget && f.ws.slamTarget.alive; },
        recastAi: (f, t, m, d) => d < 110,
        recastUse(f, m) {
          const t = f.ws.slamTarget; f.ws.slamT = 0; f.ws.slamTarget = null;
          f.act(0.4, { move: 0, anim: 'raise', atk: true }, [[0.2, () => {
            if (dist(f, t) < 120) { m.applyHit(f, t, { dmg: 6, kb: 60, kg: 1, stun: 1, tag: 'C' }); t.z = 0; t.vz = 0; }
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 80, color: '#6a8a3a', life: 0.4, w: 10 }); m.shake(9);
          }]]);
          m.text(f.x, f.y - 60, '💥 QUĂNG QUẬT!', '#8be04a', 16);
        },
        use(f, m) {
          if (galoBeast(f)) {
            const t = m.nearestEnemy(f);
            for (const e of m.enemiesOf(f)) if (dist(e, f) < 165 && Math.abs(angDiff(f.facing, angTo(f, e))) < 0.9) e.addStatus('stun', 0.5);
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 160, color: '#8be04a', life: 0.35, w: 6 }); m.text(f.x, f.y - 60, '🐺 GRÀOOO!', '#8be04a', 15);
            if (t) {
              const a = angTo(f, t), d0 = dist(f, t);
              // Tư duy 20: 30% lao quá đà theo nạn nhân đứng sát mép
              const overshoot = !f.T('galo_12a') && m.arena.edgeDist(t.x, t.y) < 70 && Math.random() < 0.3;
              const L = Math.min(160, Math.max(0, d0 - 20)) + (overshoot ? 130 : 0);
              const hitSet = new Set();
              f.startDash({ angle: a, dist: L, dur: 0.24, trail: true, stopAtEdge: !overshoot, onContact: (e) => {
                if (hitSet.has(e)) return false; hitSet.add(e);
                m.applyHit(f, e, { dmg: 5, kb: 120, kg: 4, tag: 'C', angle: a });
                f.ws.slamT = 1.2; f.ws.slamTarget = e;
                return true;
              } });
              if (overshoot) m.text(f.x, f.y - 76, '🤪 LAO QUÁ ĐÀ!', '#ff9a6a', 14);
            }
            f.cd.C = 5 * f.cdMult;
            return;
          }
          const old = { x: f.x, y: f.y };
          f.startDash({ angle: f.castAngle, dist: 140, dur: 0.24, invuln: true, trail: true }); f.cd.C = f.cdOf('C');
          f.addStatus('haste', 2, 0.25);
          m.zone({ owner: f, x: old.x, y: old.y, r: 80, life: 2.5, every: 0.2, kind: 'gas', color: 'rgba(110,170,80,0.35)',
            tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) e.addStatus('blind', 0.4); } });
        } },
      D: { name: '"Quá Liều!" / Tiếng Hú Tử Thần', cd: 6, manualCd: true, desc: 'Người: uống cạn bình độc hóa Quái Thú 20s (không tự hủy được): khiên ảo, +15% điểm văng bản thân, Siêu Giáp, nặng hơn 40% • Thú: Tiếng Hú Tử Thần (hồi 6s) — sóng âm CHOÁNG diện rộng 1.25s. Hết dạng Thú: D hồi 25s.',
        ai: { type: 'atk', max: 150, pri: 2 },
        use(f, m) {
          if (galoBeast(f)) {
            // Chimera Bất Hoại: D phun axit của dạng người
            if (f.T('galo_12a') && !(f.ws.howlT > m.time)) { galoFlask(f, m); f.cd.D = 1.2 * f.cdMult; f.ws.howlT = m.time + 0.01; return; }
            const st = f.T('galo_9b') ? 2 : 1.25;
            if (f.T('galo_9b')) for (const p of m.projs) if (!p.dead && p.owner.team !== f.team && Math.hypot(p.x - f.x, p.y - f.y) < 200) p.dead = true;
            for (const e of m.enemiesOf(f)) if (dist(e, f) < 145 + e.r) m.applyHit(f, e, { dmg: 3, noKnock: true, stun: st, tag: 'D' });
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 145, color: '#8be04a', life: 0.45, w: 10 }); m.shake(8); m.text(f.x, f.y - 66, '🐺 TIẾNG HÚ TỬ THẦN!', '#8be04a', 16);
            f.act(0.35, { move: 0, anim: 'raise' });
            f.cd.D = 6 * f.cdMult;
            return;
          }
          f.ws.beast = f.T('galo_1b') ? 25 : 20; f.ws.wd = 0; f.removeStatus('nodash');
          f.percent += 15; f.addStatus('shield', f.ws.beast, 10);
          f.cleanse();
          f.act(0.5, { move: 0, anim: 'raise' });
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 90, color: '#8be04a', life: 0.5, w: 10 }); m.shake(8);
          m.text(f.x, f.y - 76, '💉 QUÁ LIỀU!! — HÓA THÚ', '#8be04a', 19);
          f.cd.D = 1;
        } },
      U: { name: 'Đại Dịch Diệt Chủng / Thợ Săn Tối Thượng', desc: 'Người: đập bình độc phủ sương độc 80% sàn đấu 8s — kẻ địch bên trong mất tầm nhìn, liên tục chịu độc và lập tức đủ 6 tầng Tiêu Xương • Thú: Săn Mồi 10s — +50% tốc chạy, đòn cào A hồi điểm văng, cú cắn B KẾT LIỄU thẳng ra khỏi sàn nếu mục tiêu trên 60%.',
        ai: { type: 'buff', max: 0 },
        use(f, m) {
          // Nổ Axit Hạt Nhân: tự phát nổ, để lại bãi axit vĩnh viễn
          if (f.T('galo_12b')) {
            for (const e of m.enemiesOf(f)) if (dist(e, f) < 290) { m.applyHit(f, e, { dmg: 10, kb: 320, kg: 7, tag: 'U', angle: angTo(f, e) }); galoVenom(f, e, m, 3); }
            m.zone({ owner: f, x: f.x, y: f.y, r: 120, life: 999, every: 0.5, kind: 'acid', color: 'rgba(120,230,70,0.22)',
              tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) galoVenom(f, e, mm); } });
            m.fx({ type: 'boom', x: f.x, y: f.y, r: 260, color: '#7ae04a', life: 0.6 }); m.shake(18); m.sfx('boom_big');
            m.text(f.x, f.y - 80, '☢️ NỔ AXIT HẠT NHÂN!', '#8be04a', 20);
            return;
          }
          if (galoBeast(f)) { f.ws.apex = 10; m.text(f.x, f.y - 80, '🩸 BẢN NĂNG SĂN MỒI!', '#ff6a5a', 19); m.shake(8); return; }
          const R = Math.min(m.arena.hx || 400, m.arena.hy || 400) * 0.95;
          for (const e of m.enemiesOf(f)) if (Math.hypot(e.x, e.y) < R) galoVenom(f, e, m, 6);
          m.zone({ owner: f, x: 0, y: 0, r: R, life: 8, every: 0.5, kind: 'fog', color: 'rgba(110,200,70,0.16)',
            tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r) { e.addStatus('blind', 0.6); galoVenom(f, e, mm, 0); } } });
          m.text(f.x, f.y - 80, '☠️ ĐẠI DỊCH DIỆT CHỦNG!', '#8be04a', 20); m.shake(10);
        } },
    },
  },
});

WEAPON_IDS.push('co_lenh', 'bai', 'thiet_phien', 'binh_doc');
