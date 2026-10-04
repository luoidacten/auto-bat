'use strict';
// ===== Nhân vật mới: Raven (Súng Bắn Tỉa) & Alice (Găng Tay Ảo Thuật) =====
// Quy đổi: 1m ≈ 40px.

// ---------- Raven ----------
function ravenMag(f, k) { return k === 'A' ? (f.T('raven_9b') ? 45 : 30) : (f.T('raven_9b') ? 7 : 5); }
function ravenReload(f) { return (f.T('raven_1a') ? 7.5 : 10) * f.cdMult * (f.rlG || 1); }
function ocaMarked(f, t, m) { return !!(t && t.ocaMark && t.ocaMark.owner === f && t.ocaMark.until > m.time); }
function ravenShot(f, m, a, o) {
  return shoot(f, m, a, Object.assign({ speed: 1400, r: 4, range: 470, kind: 'bullet', color: '#cfe0ff', silent: true }, o));
}
// Oca hết giờ: bay đi (hoặc lao xuống tự sát — Lv12)
function ocaEnd(f, m) {
  const o = f.ws.oca; f.ws.oca = null;
  if (!o) return;
  f.cd.D = f.cdOf('D');
  const t = o.target;
  if (f.T('raven_12b') && t && t.alive && ocaMarked(f, t, m)) {
    m.fx({ type: 'line', x1: o.x, y1: o.y - 70, x2: t.x, y2: t.y, color: '#ff4a4a', life: 0.3, w: 4 });
    m.later(0.25, () => {
      m.hitCircle(f, { x: t.x, y: t.y, r: 110, dmg: 10, kb: 260, kg: 6, stun: 1.5, tag: 'D' });
      m.fx({ type: 'boom', x: t.x, y: t.y, r: 110, color: '#ff5a3a', life: 0.45 }); m.shake(12); m.sfx('explosion');
      m.text(t.x, t.y - 70, '🐦‍⬛ OCA TỰ SÁT!', '#ff6a6a', 18);
      m.sfx('crow_caw', { rate: 1.2 });
    });
  } else m.text(o.x, o.y - 90, '🐦‍⬛ Oca bay đi', '#a0b0d0', 12);
}
function ravenDarkOn(m) { return m.dark && m.dark.t > 0; }

// ---------- Alice ----------
const ALICE_LOW = ['borg', 'koda', 'clint'], ALICE_DISC = ['gideon', 'valerius', 'ryoma'], ALICE_TECH = ['zero', 'raven', 'elara'];
function hypeCap(f) { return f.ws.hypeCap || (f.T('alice_9b') ? 150 : 100); }
function addHype(f, n) { f.ws.hype = clamp((f.ws.hype || 0) + n, 0, Math.max(hypeCap(f), f.ws.hype || 0)); }
function aliceIllusions(f, m) { return m.minions.filter((d) => d.kind === 'illusion' && d.owner === f && d.alive); }
// Thuật toán cảm nhận: P(phát hiện) = cơ bản theo nhóm AI + ΔIQ × 2.5%
function aliceLure(f, lures, m, dur) {
  if (!lures.length) return;
  const myTac = f.brain ? f.brain.tech.tactic : 3, myWis = f.wis ?? 7;
  for (const e of m.fighters) {
    if (e.team === f.team || !e.alive) continue;
    const pid = e.brain ? e.brain.pid : null, eWis = e.wis ?? 5;
    const low = ALICE_LOW.includes(pid), disc = ALICE_DISC.includes(pid), tech = ALICE_TECH.includes(pid);
    // Thời gian bị lừa (giây) trước khi nhận ra: trung bình 2–3s, tối thiểu 0.5s (Alice bị áp đảo hoàn toàn) – tối đa 5s (địch quá ngu).
    // Alice càng giỏi 🧠 Chiến thuật và 🦉 Trí Tuệ càng hơn địch → ảo ảnh càng khó phân biệt.
    // Thiên hướng: bản năng thấp ×1.3 • kỷ luật ×0.8 • công nghệ ×0.6 • Wukong ×0.6 • Kazuki ×0.4
    const k = { wukong: 0.6, kazuki: 0.4 }[pid] || (low ? 1.3 : disc ? 0.8 : tech ? 0.6 : 1);
    const edge = (myWis - eWis) + (myTac - 5) * 0.3;
    let tt = clamp(2.3 * Math.pow(1.22, edge) * k * rand(0.85, 1.15), 0.5, 5);
    if (e.T && e.T('it_sage')) tt = Math.min(tt, 1);
    // Victoria cầm Cờ Lệnh nhận ra phân thân trong 0.2s • Diệp Thanh Phong cảm nhận luồng khí: 0.4s
    if (e.weaponId === 'co_lenh' && e.ws.stance === 'flag') tt = 0.2;
    if (e.weaponId === 'thiet_phien') tt = 0.4;
    // bản năng thấp: khóa vào thực thể gần nhất • còn lại: bị lừa ngẫu nhiên vào 1 ảo ảnh
    let by = lures[0], bd = Infinity;
    for (const l of lures) { const d = dist(e, l); if (d < bd) { bd = d; by = l; } }
    if (!low) by = pick(lures);
    e.focus = { by, until: m.time + Math.min(tt, dur || 5) };
  }
}
// Alice chỉ áp sát khi "chắc giết được": đối thủ trên 80%, hoặc trên 50% mà sát mép, hoặc đang bị khống chế / bị ảo ảnh lừa với trên 35%
function aliceKillable(f, t, m) {
  if (!t || t.has('immortal') || f.percent >= 900) return false;
  const edge = m.arena.edgeDist(t.x, t.y), cc = t.has('stun') || t.has('root') || (t.focus && t.focus.by && t.focus.by.kind === 'illusion');
  return t.percent >= 80 || (t.percent > 50 && edge < 200) || (cc && t.percent > 35);
}
function spawnIllusion(f, m, x, y, o = {}) {
  const p = m.arena.clamp({ x, y }, 24);
  const d = m.addMinion(new Minion(f, 'illusion', p.x, p.y, f.name));
  d.color = f.color; d.fakeMain = true; d.percent = f.percent; d.facing = f.facing;
  d.life = o.life || 10; d.ws.still = !!o.still; d.ws.scatter = !!o.scatter; d.ws.fromC = !!o.fromC;
  d.ws.hp = f.T('alice_1c') ? 2 : 1; d.ws.big = !!o.big;
  if (d.ws.scatter) d.ws.dir = rand(0, TAU);
  m.fx({ type: 'boom', x: d.x, y: d.y, r: 26, color: '#ff9af0', life: 0.3 });
  return d;
}
// ảo ảnh bị phá: "Bị Lừa Rồi Nha!" — phát nổ vào kẻ phá, Alice tăng tốc
function illusionPop(d, att, hit, m) {
  const f = d.owner, o = att && !att.isEnv ? (att.owner || att) : null;
  if (o && o.team !== f.team && o.alive) {
    addHype(f, f.T('alice_1a') ? 35 : 25);
    // Ảo Ảnh Phản Kích: bị đánh cận chiến thì đâm trả 1 nhát
    if (f.T('alice_6c') && !hit.proj && dist(d, o) < 160) {
      m.applyHit(f, o, { dmg: 5, kb: 150, kg: 4.5, tag: 'B', src: d, angle: angTo(d, o) });
      m.fx({ type: 'thrust', x: d.x, y: d.y, a: angTo(d, o), len: 70, w: 16, color: '#ff9af0', life: 0.2 });
    }
    const strong = f.T('alice_3a');
    m.applyHit(f, o, { dmg: strong ? 10 : 7, kb: 110, kg: 1.8, stun: strong ? 0.5 : 0, tag: 'C', src: d, angle: angTo(d, o), illusion: true });
    o._illusionHitT = m.time;
    m.text(d.x, d.y - 46, '🤡 BỊ LỪA RỒI NHA!', '#ff9af0', 15);
  }
  if (d.ws.big) m.hitCircle(f, { x: d.x, y: d.y, r: 110, dmg: 8, kb: 250, kg: 5.5, tag: 'U', src: d, illusion: true });
  m.fx({ type: 'boom', x: d.x, y: d.y, r: d.ws.big ? 110 : 50, color: '#ff7af0', life: 0.35 });
  for (let i = 0; i < 10; i++) m.particle(d.x, d.y, { color: pick(['#ff9af0', '#ffe07a', '#9af0ff']), life: 0.5, size: 4, vx: rand(-220, 220), vy: rand(-220, 220) });
  m.sfx('magic_strike'); m.sfx('boom_small', { vol: 0.5 });
  f.addStatus('haste', 2, 0.3);
  m.removeMinion(d);
}
function aliceVanish(f, dur) { f.addStatus('invis', dur); f.addStatus('untargetable', dur); }
function aliceTeleport(f, m, x, y) {
  m.fx({ type: 'ring', x: f.x, y: f.y, r: 28, color: '#ff9af0', life: 0.3, w: 3 });
  m.fx({ type: 'boom', x: f.x, y: f.y, r: 34, color: '#d070ff', life: 0.35 });
  m.sfx('wind_magic');
  const p = m.arena.clamp({ x, y }, f.r + 4);
  f.cancelDash(); f.x = p.x; f.y = p.y; f.vx = f.vy = 0;
  m.fx({ type: 'ring', x: f.x, y: f.y, r: 32, color: '#ff9af0', life: 0.3, w: 3 });
}
// ảo ảnh tốt nhất để hoán đổi: xa kẻ địch, gần tâm sân, không sát mép
function bestIllusion(f, m) {
  let best = null, bs = -Infinity;
  for (const d of aliceIllusions(f, m)) {
    if (m.arena.edgeDist(d.x, d.y) < 60) continue;
    const e = m.nearestEnemy(d), s = (e ? dist(d, e) : 300) * 1.5 - Math.hypot(d.x, d.y);
    if (s > bs) { bs = s; best = d; }
  }
  return best;
}
function swapWith(f, d, m) {
  const p = { x: f.x, y: f.y };
  aliceTeleport(f, m, d.x, d.y);
  d.x = p.x; d.y = p.y;
  f.invulnT = Math.max(f.invulnT, 0.15);
}

Object.assign(WEAPONS, {
  // ================= SÚNG BẮN TỈA (Raven) =================
  ban_tia: {
    name: 'Súng Trường Tùy Biến', icon: '🐦‍⬛', color: '#6a7a9a', weight: 0.95, speed: 1.06, gfx: 'rifle',
    role: 'Bắn tỉa tầm cực xa • Thợ săn', ai: { range: 440, defend: ['C'], ranged: true },
    passive: { name: 'Sát Thủ Chuyên Nghiệp', desc: 'Hai băng đạn độc lập: Súng trường (A) 30 viên, Súng tỉa (B) 5 viên — chỉ khi bắn cạn băng mới nạp lại 10s. Kẻ địch càng ở xa, đạn càng đẩy văng mạnh (tối đa +35%).' },
    init(f) {
      f.ws.ammoA = ravenMag(f, 'A'); f.ws.ammoB = ravenMag(f, 'B'); f.ws.rlA = 0; f.ws.rlB = 0;
      f.ws.oca = null; f.ws.inSmoke = false; f.ws.pinT = 0; f.ws.pin = null;
    },
    resource(f) {
      const a = f.T('raven_12a') ? '🔒' : f.ws.ammoA > 0 ? `${f.ws.ammoA}` : `nạp ${f.ws.rlA.toFixed(1)}s`;
      const b = f.ws.ammoB > 0 ? `${f.ws.ammoB}` : `nạp ${f.ws.rlB.toFixed(1)}s`;
      return `🔫A ${a} • 🎯B ${b}` + (f.ws.oca ? ` • 🐦‍⬛ ${f.ws.oca.t.toFixed(0)}s` : '') + (f.ws.pinT > 0 ? ' • ↯ B: NỔ ĐIỂM GHIM' : '');
    },
    update(f, m, dt) {

      for (const k of ['A', 'B']) {
        if (f.ws['ammo' + k] <= 0) {
          f.ws['rl' + k] -= dt;
          if (f.ws['rl' + k] <= 0) { f.ws['ammo' + k] = ravenMag(f, k); m.sfx(k === 'B' ? 'reload_big' : 'gun_reload'); }
        }
      }
      if (f.ws.pinT > 0) f.ws.pinT -= dt;
      // khói: ở trong thì tàng hình; rời khói thì tàng hình thêm & tăng tốc 25%
      const inside = m.zones.some((z) => z.kind === 'rsmoke' && z.owner === f && Math.hypot(f.x - z.x, f.y - z.y) < z.r);
      if (inside) { f.addStatus('invis', 0.15); f.addStatus('untargetable', 0.15); }
      else if (f.ws.inSmoke) { f.addStatus('invis', 1.5); f.addStatus('untargetable', 1.5); f.addStatus('haste', 2, 0.25); }
      f.ws.inSmoke = inside;
      if (ravenDarkOn(m) && m.dark.owner === f) { f.addStatus('invis', 0.15); f.addStatus('untargetable', 0.15); }
      // Quạ Oca: bay theo mục tiêu, thả bom làm chậm và đánh dấu
      const o = f.ws.oca;
      if (o) {
        o.t -= dt; o.acc += dt;
        let t = o.target;
        if (!t || !t.alive) { t = o.target = m.nearestEnemy(f); }
        if (t) {
          const dx = t.x - o.x, dy = t.y - o.y, L = Math.hypot(dx, dy) || 1, sp = Math.min(L, 260 * dt);
          o.x += dx / L * sp; o.y += dy / L * sp;
          if (L < 140) { if (!ocaMarked(f, t, m)) m.sfx('target_lock'); t.ocaMark = { owner: f, until: m.time + 0.6 }; }
          if (o.acc >= 1.4) {
            o.acc = 0;
            const bx = t.x, by = t.y;
            m.fx({ type: 'telegraph', x: bx, y: by, r: 48, color: '#ff4a4a', life: 0.45 });
            m.later(0.45, () => {
              m.hitCircle(f, { x: bx, y: by, r: 48, dmg: 2, kb: f.T('raven_3c') ? 120 : 20, kg: f.T('raven_3c') ? 2 : 0.4, slow: [0.3, 1.5], tag: 'D', quiet: true });
              m.fx({ type: 'boom', x: bx, y: by, r: 48, color: '#ff8a5a', life: 0.3 });
            });
          }
        }
        if (o.t <= 0) ocaEnd(f, m);
      }
    },
    onDeal(f, t, hit, info, m) {
      // càng xa càng đẩy mạnh (tối đa +35%)
      info.kbMult *= 1 + 0.35 * clamp(dist(f, t) / 600, 0, 1);
      const mk = ocaMarked(f, t, m);
      if (mk && f.T('raven_9c')) info.mult *= 1.25;
      if (hit.tag === 'B' && hit.mk) info.kbMult *= Math.max(1, t.weight);
      if (hit.tag === 'B' && hit.lone && dist(f, t) > 420) { info.kbMult *= 3; m.text(t.x, t.y - 66, '🎯 ĐỘC HÀNH!', '#ffe9a0', 18); }
      if (ravenDarkOn(m) && m.dark.owner === f) info.kbMult *= 1.4;
    },
    onUse(f, key, m) {
      // bắn sẽ làm lộ diện (trừ Kẻ Đi Săn Vô Hình / trong Màn Đêm)
      if ((key === 'A' || key === 'B') && !f.T('raven_9a') && !(ravenDarkOn(m) && m.dark.owner === f) && !f.ws.inSmoke) { f.removeStatus('invis'); f.removeStatus('untargetable'); }
    },
    onKill(f, victim, m) {
      // Vọng Âm Đêm Tối: hạ địch trong Màn Đêm kéo dài thêm 3s
      if (f.T('raven_12c') && ravenDarkOn(m) && m.dark.owner === f) { m.dark.t += 3; m.text(f.x, f.y - 70, '🌑 ĐÊM DÀI THÊM!', '#a0a0ff', 16); }
    },
    skills: {
      A: { name: 'Bắn 3 Viên', cd: 1, desc: 'Đánh tích: nã loạt 3 viên tầm trung (tốn 3 viên băng A). Mục tiêu bị Oca đánh dấu: đạn tầm nhiệt tự bẻ cong đuổi theo.',
        ai: { type: 'atk', min: 60, max: 450, pri: 2 },
        can(f) { return !f.T('raven_12a') && f.ws.ammoA > 0; },
        use(f, m) {
          const ev = [];
          for (let i = 0; i < 3; i++) ev.push([0.03 + i * 0.07, () => {
            if (f.ws.ammoA <= 0) return;
            f.ws.ammoA--; if (f.ws.ammoA <= 0) f.ws.rlA = ravenReload(f);
            const t = m.autoTarget(f, 520), mk = ocaMarked(f, t, m);
            const a = t ? m.aimAngle(f, t, 1400) : f.facing;
            ravenShot(f, m, a + rand(-0.04, 0.04), { home: mk ? t : null, turn: 7, breaker: f.T('raven_6c'), hit: { dmg: 3.2, kb: 62, kg: 2.5, tag: 'A' } });
            m.fx({ type: 'flash', x: f.x + Math.cos(a) * 32, y: f.y + Math.sin(a) * 32, r: 10, color: '#e0f0ff', life: 0.07 });
          }]);
          f.act(0.3, { move: 0.75, anim: 'aim', atk: true }, ev); m.sfx('rifle_burst');
        } },
      B: { name: 'Bắn Tỉa Xuyên Phá', cd: 2, desc: 'Kết liễu: ngắm bắn 1 phát siêu thanh tầm cực xa, đẩy văng mạnh (tốn 1 viên băng B). Bị áp sát (<2m) thì lăn lùi 3m rồi mới bóp cò. Mục tiêu bị đánh dấu: đạn xuyên tường, bỏ qua khiên & kháng đẩy lùi.',
        ai: { type: 'atk', min: 0, max: 740, pri: 2.6 },
        can(f) { return f.ws.ammoB > 0; },
        // Phát Bắn Bồi: nổ điểm ghim trên người địch
        recast(f) { return f.T('raven_6a') && f.ws.pinT > 0 && f.ws.pin && f.ws.pin.alive; },
        recastAi: () => true,
        recastUse(f, m) {
          const t = f.ws.pin; f.ws.pinT = 0; f.ws.pin = null;
          m.applyHit(f, t, { dmg: 3, kb: 175, kg: 3.5, tag: 'B', angle: angTo(f, t) });
          m.fx({ type: 'boom', x: t.x, y: t.y, r: 40, color: '#ffd27a', life: 0.3 }); m.text(t.x, t.y - 56, '💥 NỔ GHIM', '#ffd27a', 14);
        },
        use(f, m) {
          const t0 = m.nearestEnemy(f);
          const close = t0 && dist(f, t0) < 80;
          if (close) f.startDash({ angle: escapeAngle(f, t0, m), dist: 120, dur: 0.2, invuln: true });
          const delay = close ? 0.26 : 0.12;
          f.act(delay + 0.22, { move: 0, anim: 'aim', atk: true, windup: delay }, [[delay, () => {
            if (f.ws.ammoB <= 0) return;
            f.ws.ammoB--; if (f.ws.ammoB <= 0) f.ws.rlB = ravenReload(f);
            const sp = f.T('raven_1c') ? 2700 : 1800;
            const t = m.autoTarget(f, 780), mk = ocaMarked(f, t, m);
            const a = t ? m.aimAngle(f, t, sp) : f.facing; f.facing = a;
            shoot(f, m, a, { speed: sp, r: 6, range: 780, kind: 'bigarrow', color: mk ? '#ff6a6a' : '#e0f0ff', ghost: mk, silent: true,
              hit: Object.assign({ dmg: 11, kb: 210, kg: 7.8, tag: 'B', mk, lone: f.T('raven_12a') }, mk ? { unblockable: true } : {}),
              onHit: (mm, p, tt) => {
                if (mk && f.T('raven_3a')) tt.addStatus('root', 1);
                if (f.T('raven_6a')) { f.ws.pinT = 1; f.ws.pin = tt; }
              } });
            m.fx({ type: 'flash', x: f.x + Math.cos(a) * 40, y: f.y + Math.sin(a) * 40, r: 22, color: '#ffffff', life: 0.1 });
            m.sfx('sniper'); m.shake(4);
          }]]);
        } },
      C: { name: 'Kỹ Thuật Ẩn Nấp', cd: 9, desc: 'Ném bom khói dưới chân 3.5s: Raven trong khói TÀNG HÌNH; rời khói được tàng hình thêm và tăng tốc 25%. Kẻ địch trong khói bị MÙ (không tự ngắm được).',
        ai: { type: 'def', max: 160, mob: 'escape' },
        use(f, m) {
          // Dây Đu Thoát Hiểm: đu qua đầu đối thủ sang phía bên kia
          if (f.T('raven_6b')) {
            const t = m.nearestEnemy(f);
            const a = t ? angTo(f, t) : f.castAngle, L = t ? dist(f, t) + 170 : 220;
            const p = m.arena.clamp({ x: f.x + Math.cos(a) * L, y: f.y + Math.sin(a) * L }, 70);
            const D = Math.hypot(p.x - f.x, p.y - f.y);
            f.startDash({ angle: Math.atan2(p.y - f.y, p.x - f.x), dist: D, dur: 0.38, invuln: true, through: true, phase: true, trail: true });
            f.vz = 420; f.z = Math.max(f.z, 1);
            m.text(f.x, f.y - 56, '🪝 ĐU DÂY!', '#cfe0ff', 15);
            return;
          }
          const big = f.T('raven_1b');
          m.zone({ owner: f, x: f.x, y: f.y, r: big ? 117 : 90, life: big ? 5 : 3.5, every: 0.1, kind: 'rsmoke', color: 'rgba(120,125,140,0.55)',
            tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r) { e.addStatus('blind', 0.3); if (f.T('raven_3b')) e.addStatus('silence', 0.3); } } });
          f.addStatus('invis', 0.3); f.addStatus('untargetable', 0.3);
          m.sfx('boom_small', { vol: 0.4 });
          f.act(0.15, { move: 1 });
        } },
      D: { name: 'Quạ Cơ Giới Oca', cd: 15, manualCd: true, desc: 'Đặc kỹ: thả quạ máy Oca bay trên sàn 10s (bất tử, không thể bị nhắm): liên tục thả bom mini làm chậm và ĐÁNH DẤU mục tiêu (lộ cả mục tiêu tàng hình). Hồi chiêu 15s chỉ bắt đầu khi Oca rời sàn.',
        ai: { type: 'buff', max: 760, pri: 3 },
        can(f) { return !f.ws.oca; },
        use(f, m) {
          const t = m.nearestEnemy(f);
          f.ws.oca = { t: f.T('raven_9c') ? 14 : 10, acc: 0.6, x: f.x, y: f.y, target: t };
          f.cd.D = 99;
          m.text(f.x, f.y - 60, '🐦‍⬛ OCA XUẤT KÍCH!', '#cfe0ff', 16);
          m.sfx('crow_caw');
          f.act(0.15, { move: 0.6 });
        } },
      U: { name: 'Màn Đêm Vĩnh Cửu', desc: 'Toàn bản đồ tối sầm 5s: đối thủ mất 70% tầm nhìn. Raven tàng hình hoàn toàn và mọi phát bắn đẩy văng mạnh hơn 40%.',
        ai: { type: 'buff', max: 800 },
        use(f, m) {
          m.dark = { t: 5, owner: f };
          m.text(f.x, f.y - 60, '🌑 MÀN ĐÊM VĨNH CỬU', '#a0a0ff', 20); m.shake(6);
        } },
    },
  },

  // ================= GĂNG TAY ẢO THUẬT (Alice) =================
  ao_thuat: {
    name: 'Găng Tay Ảo Thuật', icon: '🎩', color: '#d070ff', weight: 0.92, speed: 1.1, gfx: 'gloves',
    role: 'Thao túng • Phân thân & đánh lừa', ai: { range: 160, defend: ['D'], ranged: true },
    passive: { name: 'Màn Ảo Thuật Náo Nhiệt', desc: 'Thanh Náo Nhiệt (0–100): +10 mỗi 10% điểm văng nhận vào, +5 mỗi đòn trúng, +25 mỗi lần kẻ địch đánh trúng ảo ảnh. A/B tốn 20 để cường hóa; đủ 50 thì C đổi biến thể. • Thoát Hiểm Ảo Ảnh: 1 lần (ngẫu nhiên ở 1 trong 2 mạng) khi lẽ ra rơi đài thì dịch chuyển về tâm sàn với 1000% điểm văng, BẤT TỬ + TÀNG HÌNH 2s. • Bị Lừa Rồi Nha!: ảo ảnh bị phá sẽ phát nổ vào kẻ phá và cho Alice +30% tốc chạy 2s.' },
    init(f) {
      f.ws.hype = f.ws.hype || 0; f.ws.lastPct = f.percent; f.ws.cWait = false; f.ws.knife = null; f.ws.box = null; f.ws.boxOn = null;
    },
    resource(f) {
      const h = Math.floor(f.ws.hype || 0);
      return `🎪 Náo Nhiệt ${h}/${hypeCap(f)}` + (h >= 50 ? ' • C: ĐỔI CHỖ' : '') + (f.ws.knife ? ' • ↯ A: HOÁN VỊ' : '') + (f.ws.box ? ` • 📦 ${f.ws.box.t.toFixed(1)}s` : '') + (f._cheatUsed ? '' : ' • 🃏');
    },
    update(f, m, dt) {
      // nhận sát thương → tích Náo Nhiệt
      if (f.percent > f.ws.lastPct && f.percent < 900) addHype(f, f.percent - f.ws.lastPct);
      f.ws.lastPct = f.percent;
      if (f.ws.hypeCap && f.ws.hype <= 100) f.ws.hypeCap = 0;
      if (f.ws.knife) { f.ws.knife.t -= dt; if (f.ws.knife.t <= 0) f.ws.knife = null; }
      // C chỉ bắt đầu hồi khi mọi ảo ảnh của C biến mất
      if (f.ws.cWait && !aliceIllusions(f, m).some((d) => d.ws.fromC)) { f.ws.cWait = false; f.cd.C = f.cdOf('C'); }
      // Bậc Thầy Phân Thân: D không hồi chiêu khi còn ảo ảnh
      if (f.T('alice_12a') && f.cd.D > 0.35 && aliceIllusions(f, m).length) f.cd.D = 0.35;
      // Hộp Ảo Thuật (Nộ biến thể 3)
      const b = f.ws.box;
      if (b && !f.ws.boxOn) { b.t -= dt; if (b.t <= 0) aliceBoxStart(f, m); }
      const bo = f.ws.boxOn;
      if (bo) {
        bo.t -= dt; f.moveDir = { x: 0, y: 0 };
        if (bo.t <= 0) aliceBoxEnd(f, m, null);
      }
    },
    onDeal(f, t, hit, info, m) { if (!hit.quiet && !t.isMinion) addHype(f, 5); },
    onIncoming(f, att, hit, m) {
      if (!f.ws.boxOn || !att || att.isEnv) return true;
      aliceBoxEnd(f, m, { att: att.owner || att, hit });
      return false;
    },
    onUse(f, key, m) {
      // ảo ảnh sao chép động tác của Alice
      if (key !== 'A' && key !== 'B') return;
      for (const d of aliceIllusions(f, m)) {
        if (d.ws.still || d.busy || d.ws.scatter) continue;
        const e = m.nearestEnemy(d); if (!e) continue;
        d.facing = angTo(d, e);
        d.act(0.3, { move: 0.3, anim: key === 'A' ? 'throw' : 'thrust', atk: true });
        if (key === 'A') shoot(d, m, d.facing, { speed: 900, r: 6, range: 320, kind: 'knife', color: '#ff9af0', hit: f.T('alice_9c') ? { dmg: 1.5, kb: 30, kg: 1.2, tag: 'A' } : { dmg: 0, noKnock: true, quiet: true, tag: 'A' } });
        else if (f.T('alice_9c') && dist(d, e) < 120) m.hitArc(d, { range: 100, arc: 70, dmg: 3, kb: 80, kg: 3, tag: 'B' });
      }
    },
    // Thoát Hiểm Ảo Ảnh: cứu 1 lần rơi đài (ngẫu nhiên ở 1 trong 2 mạng)
    onFall(f, m) {
      if (f._cheatUsed) return true;
      if (!f._cheatRolled) { f._cheatRolled = true; if (Math.random() < 0.5 && f.stocks > 1) return true; }
      f._cheatUsed = true;
      const p = m.arena.clamp({ x: 0, y: 0 }, f.r + 4);
      f.x = p.x; f.y = p.y; f.vx = f.vy = 0; f.vz = 0; f.z = 0; f.hitstun = 0; f.action = null; f.cancelDash();
      f.percent = 1000; f.ws.lastPct = 1000;
      const T = f.T('alice_9a') ? 3.5 : 2;
      f.addStatus('immortal', T); aliceVanish(f, T);
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 80, color: '#ff9af0', life: 0.6, w: 8 });
      m.text(f.x, f.y - 70, '🃏 THOÁT HIỂM ẢO ẢNH!', '#ff9af0', 20);
      return false;
    },
    onKill(f, victim, m) {
      // Nụ Cười Gã Hề: ảo ảnh nổ đẩy rớt địch → đầy Nộ
      if (f.T('alice_12c') && m.time - (victim._illusionHitT || -9) < 2) { f.rage = f.rageNeed; m.text(f.x, f.y - 70, '🤡 NỤ CƯỜI GÃ HỀ!', '#ff9af0', 18); }
    },
    skills: {
      A: { name: 'Phi Dao Ảo Thuật', cd: 0.5, shared: 'B', desc: 'Đánh tích: phi 1 dao găm tầm trung. Tốn 20 Náo Nhiệt: phóng 8 phi dao tỏa tròn 360° đẩy lùi xung quanh. (Dùng chung hồi chiêu với B.)',
        ai: { type: 'atk', min: 0, max: 330, pri: 2 },
        // Phi Dao Hoán Vị: dao trúng đích → bấm A dịch chuyển tới chỗ dao
        recast(f) { return f.T('alice_6a') && !!f.ws.knife; },
        recastAi: (f, t, m) => { const k = f.ws.knife; return m.arena.edgeDist(k.x, k.y) > 70 && (f.percent < 100 || dist(k, t) > 140); },
        recastUse(f, m) { const k = f.ws.knife; f.ws.knife = null; aliceTeleport(f, m, k.x, k.y); m.text(f.x, f.y - 50, '🔀 HOÁN VỊ', '#ff9af0', 14); },
        use(f, m) {
          const t = m.nearestEnemy(f);
          if ((f.ws.hype || 0) >= 20 && t && dist(f, t) < 150) {
            f.ws.hype -= 20;
            f.act(0.3, { move: 0.2, anim: 'spin', atk: true }, [[0.06, () => {
              for (let i = 0; i < 8; i++) shoot(f, m, f.facing + i * TAU / 8, { speed: 800, r: 6, range: 180, kind: 'knife', color: '#ffe07a', hit: { dmg: 3, kb: 150, kg: 3.6, tag: 'A' } });
            }]]);
            m.text(f.x, f.y - 56, '🎴 VŨ ĐIỆU PHI DAO!', '#ffe07a', 15);
            return;
          }
          const far = f.T('alice_1b'), sp = far ? 1125 : 900, R = far ? 400 : 320;
          f.act(0.2, { move: 0.7, anim: 'throw', atk: true }, [[0.05, () => {
            shoot(f, m, aimOr(f, m, R, sp), { speed: sp, r: 6, range: R, kind: 'knife', color: '#ff9af0', hit: { dmg: 4.8, kb: 75, kg: 3.1, tag: 'A' },
              onHit: (mm, p, tt) => { if (f.T('alice_6a')) f.ws.knife = { x: tt.x, y: tt.y, t: 1 }; } });
          }]]);
        } },
      B: { name: 'Lướt Đâm Chớp Nhoáng', cd: 0.5, shared: 'A', desc: 'Kết liễu: lướt thẳng 2.5m đâm mạnh. Tốn 20 Náo Nhiệt: sau cú đâm Alice tàng hình, dịch chuyển ngẫu nhiên 2m và để lại 1 ảo ảnh ở điểm đâm.',
        ai: { type: 'atk', min: 0, max: 140, pri: 2.4 },
        use(f, m) {
          // Chim Bồ Câu Quấy Nhiễu: hất tung nhẹ + câm lặng
          if (f.T('alice_6b')) {
            f.act(0.35, { move: 0.2, anim: 'throw', atk: true }, [[0.08, () => {
              m.hitArc(f, { range: 160, arc: 90, dmg: 4, kb: 60, kg: 1.5, knockup: 300, silence: 1.25, tag: 'B' });
              for (let i = 0; i < 12; i++) { const a = f.facing + rand(-0.8, 0.8), s = rand(250, 500); m.particle(f.x, f.y, { color: '#ffffff', life: 0.6, size: 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s }); }
            }]]);
            m.text(f.x, f.y - 56, '🕊️ BỒ CÂU!', '#ffffff', 15);
            return;
          }
          const a = f.facing, emp = (f.ws.hype || 0) >= 20;
          let hitOne = false;
          f.act(0.3, { move: 0, anim: 'thrust', atk: true });
          f.startDash({ angle: a, dist: 100, dur: 0.18, stopAtEdge: true, trail: true,
            onContact: (e) => { if (!hitOne) { hitOne = true; m.applyHit(f, e, { dmg: 10, kb: 195, kg: 7.3, tag: 'B', angle: a }); } return true; },
            onEnd: () => {
              if (!emp || !f.alive) return;
              f.ws.hype -= 20;
              const d = spawnIllusion(f, m, f.x, f.y, { life: 6 });
              const r = rand(0, TAU);
              aliceTeleport(f, m, f.x + Math.cos(r) * 80, f.y + Math.sin(r) * 80);
              aliceVanish(f, f.T('alice_3c') ? 2.5 : 1.5);
              aliceLure(f, [d], m, 4);
            } });
        } },
      C: { name: 'Ảo Ảnh Độc Lập', cd: 8, manualCd: true, desc: 'Dưới 50 Náo Nhiệt: tạo 1 ảo ảnh (10s) tự chạy lại gần địch và sao chép động tác của Alice; Alice tàng hình 1.5s và lướt đi. Đủ 50 Náo Nhiệt: tốn 50, hoán đổi vị trí với kẻ địch gần nhất, 5 ảo ảnh đứng vây quanh nạn nhân 5s, Alice tàng hình 2s. Hồi chiêu 8s chỉ bắt đầu khi ảo ảnh biến mất.',
        ai: { type: 'def', max: 600, mob: 'escape' },
        use(f, m) {
          const t = m.nearestEnemy(f);
          if ((f.ws.hype || 0) >= 50 && t && dist(f, t) < 420) {
            f.ws.hype -= 50;
            const me = { x: f.x, y: f.y };
            aliceTeleport(f, m, t.x, t.y);
            if (!t.has('unstoppable')) { t.x = me.x; t.y = me.y; t.vx = t.vy = 0; t.action = null; t.cancelDash(); }
            const L = [];
            for (let i = 0; i < 5; i++) L.push(spawnIllusion(f, m, t.x + Math.cos(i * TAU / 5) * 70, t.y + Math.sin(i * TAU / 5) * 70, { still: true, life: 5, fromC: true }));
            if (f.T('alice_3b')) m.zone({ owner: f, x: t.x, y: t.y, r: 95, life: 2, every: 0.2, kind: 'smoke', color: 'rgba(200,150,230,0.35)',
              tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r) e.addStatus('slow', 0.3, 0.4); } });
            aliceVanish(f, 2);
            aliceLure(f, L, m, 5);
            m.text(f.x, f.y - 60, '🎭 HOÁN ĐỔI!', '#ff9af0', 17);
          } else {
            const mine = aliceIllusions(f, m).filter((d) => d.ws.fromC && !d.ws.still);
            const cap = f.T('alice_12a') ? 3 : 1;
            while (mine.length >= cap) m.removeMinion(mine.shift());
            const d = spawnIllusion(f, m, f.x, f.y, { life: 10, fromC: true });
            f.startDash({ angle: f.castAngle, dist: 130, dur: 0.16 });
            aliceVanish(f, f.T('alice_3c') ? 2.5 : 1.5);
            aliceLure(f, [d], m, 6);
          }
          if (f.T('alice_12a')) f.cd.C = f.cdOf('C') * 0.5;
          else { f.cd.C = 99; f.ws.cWait = true; }
          m.sfx('magic_spell', { vol: 0.7 });
        } },
      D: { name: 'Tẩu Thoát, Ohh!', cd: 4.5, desc: 'Đổi vị trí ngay lập tức với 1 ảo ảnh đang có trên sàn (ưu tiên ảo ảnh xa kẻ địch, gần tâm sân, không đứng sát mép).',
        ai: { type: 'def', max: 260 },
        can(f, m) { return !!bestIllusion(f, m); },
        use(f, m) {
          const d = bestIllusion(f, m); if (!d) return;
          swapWith(f, d, m);
          m.text(f.x, f.y - 50, '✨ Ohh!', '#ff9af0', 15);
        } },
      U: { name: 'Rực Rỡ, Cùng Vui Nào!', desc: 'Nộ 3 biến thể tự chọn theo tình huống — Chương Trình Thoát Hiểm (điểm văng >80% hoặc sát mép): 10 ảo ảnh chạy toán loạn, Alice tàng hình 3s về chỗ an toàn. • Vạn Biến: Náo Nhiệt đầy (tràn tới 150), làm mới mọi hồi chiêu. • Mạo Hiểm (bị cận chiến áp sát): phi dao đánh dấu, rồi tự nhốt vào Hộp Ảo Thuật — bị đánh thì đổi chỗ và trả lại x2 sát thương/lực đẩy, không bị đánh thì xuất hiện sau lưng kẻ bị đánh dấu.',
        ai: { type: 'buff', max: 900 },
        // Mạo Hiểm: bấm tái kích hoạt để vào hộp sớm
        recast(f) { return !!f.ws.box && !f.ws.boxOn; },
        recastAi: (f, t, m, d) => d < 130 && t.action && t.action.atk,
        recastUse(f, m) { aliceBoxStart(f, m); },
        use(f, m) {
          const t = m.nearestEnemy(f), d = t ? dist(f, t) : 999;
          if (f.percent > 80 || m.arena.edgeDist(f.x, f.y) < 80) {
            // Chương Trình Thoát Hiểm
            const L = [];
            for (let i = 0; i < 10; i++) L.push(spawnIllusion(f, m, f.x + rand(-30, 30), f.y + rand(-30, 30), { scatter: true, life: 5 }));
            let best = { x: 0, y: 0 }, bs = -Infinity;
            for (let i = 0; i < 12; i++) {
              const p = m.arena.clamp({ x: rand(-m.arena.hx, m.arena.hx) * 0.7, y: rand(-m.arena.hy, m.arena.hy) * 0.7 }, 100);
              const s = (t ? Math.hypot(p.x - t.x, p.y - t.y) : 0) + m.arena.edgeDist(p.x, p.y) * 0.8;
              if (s > bs && m.arena.edgeDist(p.x, p.y) > 120) { bs = s; best = p; }
            }
            aliceTeleport(f, m, best.x, best.y);
            aliceVanish(f, 3);
            aliceLure(f, L, m, 4);
            m.text(f.x, f.y - 64, '🎪 CHƯƠNG TRÌNH THOÁT HIỂM!', '#ff9af0', 18);
          } else if (f.T('alice_12b') && t && t.percent > 60) {
            // Chiếc Hộp Biến Mất: nhốt cả sàn 2s rồi ném mọi đối thủ ra sát mép
            for (const e of m.enemiesOf(f)) if (!e.isMinion) { e.addStatus('stun', 2); e.addStatus('root', 2); }
            m.zone({ owner: f, x: 0, y: 0, r: Math.min(m.arena.hx, m.arena.hy) * 0.95, life: 2, every: 9, kind: 'box', color: 'rgba(180,90,230,0.18)' });
            m.text(f.x, f.y - 64, '📦 CHIẾC HỘP BIẾN MẤT!', '#ff9af0', 20);
            m.later(2, () => {
              for (const e of m.enemiesOf(f)) {
                if (e.isMinion || !e.alive || e.has('unstoppable') || e.has('immortal')) continue;
                let p = null;
                for (let i = 0; i < 30 && !p; i++) {
                  const a = rand(0, TAU); let s = 0;
                  while (s < 2000 && m.arena.edgeDist(Math.cos(a) * s, Math.sin(a) * s) > 45) s += 10;
                  const q = { x: Math.cos(a) * s, y: Math.sin(a) * s };
                  if (!m.arena.nearPillar({ ...q, r: e.r }, 4)) p = q;
                }
                if (!p) continue;
                m.fx({ type: 'ring', x: e.x, y: e.y, r: 30, color: '#ff9af0', life: 0.3, w: 3 });
                e.x = p.x; e.y = p.y; e.vx = e.vy = 0;
                m.fx({ type: 'ring', x: e.x, y: e.y, r: 40, color: '#ff9af0', life: 0.4, w: 5 });
              }
              m.shake(8); m.sfx('boom_small');
            });
          } else if (t && d < 120 && !t.weapon.ai.ranged) {
            // Mạo Hiểm: phi dao đánh dấu
            f.ws.box = { t: 5, target: null };
            shoot(f, m, aimOr(f, m, 400, 1000), { speed: 1000, r: 8, range: 400, kind: 'knife', color: '#ffe07a', hit: { dmg: 2, kb: 30, kg: 1, tag: 'U' },
              onHit: (mm, p, tt) => { if (f.ws.box) f.ws.box.target = tt; mm.text(tt.x, tt.y - 56, '🃏 ĐÁNH DẤU', '#ffe07a', 14); } });
            m.text(f.x, f.y - 64, '🎩 MẠO HIỂM!', '#ffe07a', 18);
          } else {
            // Vạn Biến
            f.ws.hypeCap = 150; f.ws.hype = 150;
            for (const k of ['A', 'B', 'C', 'D']) f.cd[k] = 0;
            f.ws.cWait = false;
            m.text(f.x, f.y - 64, '🌟 VẠN BIẾN!', '#ffe07a', 20);
          }
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 120, color: '#ff9af0', life: 0.5, w: 8 });
        } },
    },
  },
  // ảo ảnh của Alice: trông y hệt Alice (tên, điểm văng), phá là nổ
  illusion: {
    hidden: true, name: 'Ảo ảnh', icon: '🎩', color: '#d070ff', weight: 1, speed: 1.08, radius: 18, gfx: 'gloves', noRage: true, life: 10, skills: {}, ai: { range: 100 },
    onIncoming(d, att, hit, m) {
      if (att && !att.isEnv && d.ws.hp > 1) { d.ws.hp--; m.fx({ type: 'ring', x: d.x, y: d.y, r: 26, color: '#ff9af0', life: 0.25, w: 3 }); return false; }
      illusionPop(d, att, hit, m);
      return false;
    },
    mind(d, m, dt) {
      d.life -= dt;
      if (d.life <= 0 || !d.owner.alive) { m.fx({ type: 'ring', x: d.x, y: d.y, r: 24, color: '#ff9af0', life: 0.3, w: 2 }); m.removeMinion(d); return; }
      d.percent = d.owner.percent;
      const e = m.nearestEnemy(d);
      const toC = Math.atan2(-d.y, -d.x), edge = m.arena.edgeDist(d.x, d.y);
      if (d.ws.still) { d.moveDir = { x: 0, y: 0 }; if (e) d.facing = angTo(d, e); return; }
      if (d.ws.scatter) {
        if (edge < 80) d.ws.dir = toC + rand(-0.6, 0.6);
        if (Math.random() < dt * 0.8) d.ws.dir += rand(-1.2, 1.2);
        d.moveDir = { x: Math.cos(d.ws.dir), y: Math.sin(d.ws.dir) }; d.facing = d.ws.dir;
        return;
      }
      if (!e) { d.moveDir = { x: 0, y: 0 }; return; }
      const de = dist(d, e), a = angTo(d, e);
      d.facing = a;
      let mv = de > 95 ? a : de < 70 ? a + Math.PI : a + Math.PI / 2;
      if (edge < 70) mv = toC;
      const k = de > 70 && de < 95 && edge >= 70 ? 0.4 : 1;
      d.moveDir = { x: Math.cos(mv) * k, y: Math.sin(mv) * k };
      // thỉnh thoảng tự múa may như đang ra đòn để đánh lừa
      d.ws.fake = (d.ws.fake || rand(0.6, 1.4)) - dt;
      if (d.ws.fake <= 0 && de < 160 && !d.busy) { d.ws.fake = rand(1, 1.8); d.act(0.3, { move: 0.3, anim: pick(['thrust', 'throw']), atk: true }); }
    },
  },
});
// Hộp Ảo Thuật (Mạo Hiểm)
function aliceBoxStart(f, m) {
  if (f.ws.boxOn) return;
  f.ws.boxOn = { t: 1.5 };
  f.act(1.5, { move: 0, anim: 'guard' });
  m.text(f.x, f.y - 60, '📦 HỘP ẢO THUẬT', '#ffe07a', 16);
}
function aliceBoxEnd(f, m, by) {
  const target = f.ws.box && f.ws.box.target;
  f.ws.boxOn = null; f.ws.box = null; f.action = null;
  if (by && by.att && by.att.alive && by.att.team !== f.team) {
    // bị đánh: đổi chỗ với kẻ vừa đánh, trả lại x2 sát thương & lực đẩy
    const o = by.att, h = by.hit, me = { x: f.x, y: f.y };
    aliceTeleport(f, m, o.x, o.y);
    if (!o.has('unstoppable')) { o.x = me.x; o.y = me.y; o.vx = o.vy = 0; o.action = null; o.cancelDash(); }
    m.applyHit(f, o, { dmg: Math.max(5, (h.dmg || 4) * 2), kb: Math.max(200, (h.kb || 100) * 2), kg: Math.max(6, (h.kg || 3) * 2), tag: 'U', angle: angTo(f, o) });
    m.text(o.x, o.y - 66, '🔁 TRẢ GẤP ĐÔI!', '#ffe07a', 19); m.shake(10);
    return;
  }
  // không bị đánh: chỗ cũ nổ tung, Alice hiện ra sau lưng kẻ bị đánh dấu
  m.hitCircle(f, { x: f.x, y: f.y, r: 120, dmg: 9, kb: 260, kg: 6, tag: 'U' });
  m.fx({ type: 'boom', x: f.x, y: f.y, r: 120, color: '#ff7af0', life: 0.45 }); m.sfx('explosion', { vol: 0.8 }); m.shake(10);
  const t = target && target.alive ? target : m.nearestEnemy(f);
  if (t) blinkBehind(f, t, m);
  aliceVanish(f, 1);
}

// Danh sách vũ khí chọn được
WEAPON_IDS.push('ban_tia', 'ao_thuat');
