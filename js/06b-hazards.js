'use strict';
// ===== Đặc trưng sàn đấu (môi trường) =====
// Mỗi sàn có hazard riêng: init(m) • update(m, dt) • drawUnder(ctx, m) • drawOver(ctx, m)
// m.dangers: các vùng sắp nguy hiểm (AI tự tránh) • m.hz: trạng thái riêng của hazard.

// "kẻ tấn công" giả cho đòn của môi trường (không tính KO cho ai, không tích nộ)
const ENV = {
  isEnv: true, name: 'Môi trường', team: -1, weapon: { color: '#ffffff', noRage: true }, weaponId: null,
  dmgMult: 1, kbMult: 1, skillMult: () => 1, has: () => false, T: () => false, talFx: [],
  stats: { dealt: 0, taken: 0, kos: 0, hits: 0 }, rage: 0, rageMult: 0, alive: true, x: 0, y: 0,
};
function envHit(m, t, hit) { return m.applyHit(ENV, t, Object.assign({ tag: 'E', hitstun: 0.25 }, hit)); }
// vùng báo trước rồi giáng xuống
function envStrike(m, x, y, r, delay, color, onHit, kind) {
  m.dangers.push({ x, y, r, t: delay });
  m.fx({ type: 'telegraph', x, y, r, color, life: delay });
  m.later(delay, () => {
    for (const f of m.bodies) if (f.alive && !f.hidden && f.z < 40 && Math.hypot(f.x - x, f.y - y) < r + f.r) onHit(f, { x, y });
    if (kind) kind();
  });
}
function nearFighterPoint(m, spread) {
  const live = m.fighters.filter((f) => f.alive);
  const base = live.length && Math.random() < 0.75 ? pick(live) : { x: rand(-m.arena.hx, m.arena.hx) * 0.7, y: rand(-m.arena.hy, m.arena.hy) * 0.7 };
  const a = rand(0, TAU), d = rand(0, spread);
  return m.arena.clamp({ x: base.x + Math.cos(a) * d + (base.vx || 0) * 0.3, y: base.y + Math.sin(a) * d + (base.vy || 0) * 0.3 }, 30);
}

const HAZARDS = {
  // 🍃 Gió giật: đẩy mọi người theo một hướng
  wind: {
    init(m) { m.hz = { t: rand(5, 7), gust: 0, dir: 0, warn: 0 }; },
    update(m, dt) {
      const h = m.hz;
      if (h.gust > 0) {
        h.gust -= dt;
        for (const f of m.bodies) {
          if (!f.alive || f.z > 0 || f.dash) continue;
          const k = 300 / f.weight * (f.superArmor ? 0.4 : 1);
          f.vx += Math.cos(h.dir) * k * dt; f.vy += Math.sin(h.dir) * k * dt;
        }
        if (Math.random() < 0.8) m.particle(rand(-m.arena.hx, m.arena.hx), rand(-m.arena.hy, m.arena.hy), { color: pick(['#d8f0c0', '#a0d080', '#ffffff']), life: 0.8, size: 4, vx: Math.cos(h.dir) * 600, vy: Math.sin(h.dir) * 600 });
        return;
      }
      h.t -= dt;
      if (h.t <= 1.3 && !h.warn) { h.warn = 1; h.dir = rand(0, TAU); m.text(0, -m.arena.hy - 20, `🍃 GIÓ GIẬT ${arrowOf(h.dir)}`, '#d8f0c0', 22); m.sfx('spin', { vol: 0.6, rate: 0.6 }); }
      if (h.t <= 0) { h.gust = 2.4; h.t = rand(6.5, 9); h.warn = 0; }
    },
    drawUnder(ctx, m) {
      const h = m.hz; if (!(h.warn || h.gust > 0)) return;
      ctx.save(); ctx.globalAlpha = h.gust > 0 ? 0.35 : 0.2 + 0.15 * Math.sin(m.time * 12);
      ctx.strokeStyle = '#e8ffd0'; ctx.lineWidth = 6;
      for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) {
        const cx = i * 170 + j * 60, cy = j * 150;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(h.dir);
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.lineTo(16, -12); ctx.moveTo(30, 0); ctx.lineTo(16, 12); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },
  },
  // 🪨 Đá lở
  rocks: {
    init(m) { m.hz = { t: 3 }; },
    update(m, dt) {
      const h = m.hz; h.t -= dt; if (h.t > 0) return;
      h.t = rand(2, 3);
      const n = Math.random() < 0.35 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const p = nearFighterPoint(m, 110);
        envStrike(m, p.x, p.y, 62, 1.15, '#c9b89a', (f, s) => envHit(m, f, { dmg: 7, kb: 170, kg: 3, stun: 0.4, src: s }), () => {
          m.fx({ type: 'boom', x: p.x, y: p.y, r: 62, color: '#b0a080', life: 0.35 });
          for (let k = 0; k < 10; k++) m.particle(p.x, p.y, { color: '#9a8a70', life: 0.5, size: 5, vx: rand(-250, 250), vy: rand(-250, 250) });
          m.shake(6); m.sfx('impact', { rate: 0.7 });
        });
      }
    },
  },
  // ❄️ Bão tuyết
  blizzard: {
    init(m) { m.hz = { t: rand(8, 10), storm: 0, flakes: Array.from({ length: 70 }, () => ({ x: rand(-1, 1), y: rand(-1, 1), s: rand(2, 5) })) }; },
    update(m, dt) {
      const h = m.hz;
      if (h.storm > 0) {
        h.storm -= dt;
        for (const f of m.bodies) if (f.alive) f.addStatus('slow', 0.25, 0.3);
        return;
      }
      h.t -= dt;
      if (h.t <= 0) { h.storm = 3.5; h.t = rand(9, 12); m.text(0, -m.arena.hy - 20, '❄️ BÃO TUYẾT!', '#d0f0ff', 22); m.sfx('spin', { vol: 0.7, rate: 0.5 }); }
    },
    drawOver(ctx, m) {
      const h = m.hz; if (h.storm <= 0) return;
      ctx.save(); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = Math.min(1, h.storm) * 0.8;
      for (const s of h.flakes) {
        const x = s.x * m.arena.hx * 1.2 + Math.sin(m.time * 2 + s.y * 5) * 30, y = ((s.y + 1 + m.time * 0.35 * s.s / 3) % 2 - 1) * m.arena.hy * 1.3;
        ctx.fillRect(x, y, s.s, s.s);
      }
      ctx.globalAlpha = Math.min(1, h.storm) * 0.12; ctx.fillRect(-m.arena.hx * 1.3, -m.arena.hy * 1.4, m.arena.hx * 2.6, m.arena.hy * 2.8);
      ctx.restore();
    },
  },
  // 🌋 Phun trào dung nham + mép nóng
  eruption: {
    init(m) { m.hz = { t: 2.5, heat: 0 }; },
    update(m, dt) {
      const h = m.hz;
      h.heat -= dt;
      if (h.heat <= 0) {
        h.heat = 0.5;
        for (const f of m.bodies) if (f.alive && f.z <= 0 && m.arena.edgeDist(f.x, f.y) < 45) { f.addStatus('burn', 1, 1.6); if (Math.random() < 0.3) m.text(f.x, f.y - 40, '🔥 nóng!', '#ff8a3a', 12); }
      }
      h.t -= dt; if (h.t > 0) return;
      h.t = rand(1.6, 2.4);
      const p = nearFighterPoint(m, 140);
      envStrike(m, p.x, p.y, 72, 1, '#ff5a1a', (f, s) => envHit(m, f, { dmg: 6, kb: 110, kg: 2, knockup: 420, burn: [2, 3], src: s }), () => {
        for (let k = 0; k < 18; k++) m.particle(p.x, p.y, { color: pick(['#ff5a1a', '#ffb02a', '#ffe07a']), life: 0.7, size: 6, vx: rand(-160, 160), vy: rand(-420, -60) });
        m.fx({ type: 'boom', x: p.x, y: p.y, r: 72, color: '#ff5a1a', life: 0.4 });
        m.shake(5); m.sfx('boom_small', { rate: 0.8 });
      });
    },
  },
  // ☁️ Bệ mây bật về giữa sân
  clouds: {
    init(m) {
      const A = m.arena;
      m.hz = { pads: [{ x: -A.hx * 0.78, y: 0 }, { x: A.hx * 0.78, y: 0 }, { x: 0, y: -A.hy * 0.74 }, { x: 0, y: A.hy * 0.74 }].map((p) => ({ ...p, r: 34, cd: new Map() })) };
    },
    update(m, dt) {
      for (const p of m.hz.pads) for (const f of m.bodies) {
        if (!f.alive || f.z > 0 || f.dash || f.hover > 0 || Math.hypot(f.x - p.x, f.y - p.y) > p.r + f.r * 0.5) continue;
        if ((p.cd.get(f) || 0) > m.time) continue;
        p.cd.set(f, m.time + 2);
        const a = Math.atan2(-f.y, -f.x);
        f.vz = 560; f.z = 1; f.vx = Math.cos(a) * 560; f.vy = Math.sin(a) * 560; f.action = null;
        m.text(f.x, f.y - 40, '☁️ BẬT!', '#ffffff', 15); m.sfx('spin', { rate: 1.3, vol: 0.6 });
      }
    },
    drawUnder(ctx, m) {
      for (const p of m.hz.pads) {
        ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + m.time * 0.5; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * 14, p.y + Math.sin(a) * 9, 16, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = '#9fd3ff'; ctx.lineWidth = 3; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(m.time * 4);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 6, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    },
  },
  // ✴️ Ấn Võ Thần: chiếm ấn để được cường hóa
  runes: {
    init(m) { m.hz = { t: 5 }; m.rune = null; },
    update(m, dt) {
      const h = m.hz;
      if (m.rune) {
        const r = m.rune; r.life -= dt;
        if (r.life <= 0) { m.rune = null; return; }
        for (const f of m.fighters) {
          if (!f.alive || Math.hypot(f.x - r.x, f.y - r.y) > r.r) continue;
          f.addStatus('empower', 5, 0.3); f.addStatus('haste', 5, 0.2);
          if (!f.weapon.noRage) f.rage = Math.min(100, f.rage + 25);
          m.text(f.x, f.y - 60, '✴️ ẤN VÕ THẦN!', '#ffd76a', 18); m.sfx('magic_spell', { rate: 1.2 });
          m.fx({ type: 'ring', x: r.x, y: r.y, r: 90, color: '#ffd76a', life: 0.5, w: 8 });
          m.rune = null; break;
        }
        return;
      }
      h.t -= dt;
      if (h.t <= 0) {
        h.t = rand(8, 11);
        let p; for (let i = 0; i < 10; i++) { p = { x: rand(-m.arena.hx, m.arena.hx) * 0.6, y: rand(-m.arena.hy, m.arena.hy) * 0.6 }; if (!m.arena.nearPillar({ ...p, r: 40 }, 10)) break; }
        m.rune = { x: p.x, y: p.y, r: 50, life: 7 };
        m.text(p.x, p.y - 40, '✴️ Ấn xuất hiện!', '#ffd76a', 15);
      }
    },
    drawUnder(ctx, m) {
      const r = m.rune; if (!r) return;
      ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(m.time * 1.5);
      ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 4; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(m.time * 6);
      ctx.beginPath(); ctx.arc(0, 0, r.r, 0, TAU); ctx.stroke();
      ctx.beginPath(); for (let i = 0; i < 5; i++) { const q = fromAng(i * TAU * 2 / 5, r.r * 0.85); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.closePath(); ctx.stroke();
      ctx.restore();
    },
  },
  // 🌿 Bụi rậm che thân
  bushes: {
    init(m) { m.hz = { list: (m.arena.bushes || []).map((b) => ({ ...b })) }; },
    update(m, dt) {
      for (const f of m.bodies) {
        f.inBush = false;
        if (!f.alive) continue;
        for (const b of m.hz.list) if (Math.hypot(f.x - b.x, f.y - b.y) < b.r - 6) { f.inBush = true; break; }
        if (f.inBush && !(f.action && f.action.atk)) f.addStatus('untargetable', 0.15);
      }
    },
    drawOver(ctx, m) {
      for (const b of m.hz.list) {
        ctx.save(); ctx.globalAlpha = 0.82;
        for (let i = 0; i < 9; i++) {
          const a = i * TAU / 9, rr = b.r * (i % 2 ? 0.55 : 0.75);
          ctx.fillStyle = i % 3 ? '#2f6a2a' : '#3f8a35';
          ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * rr * 0.6, b.y + Math.sin(a) * rr * 0.5, b.r * 0.42, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = '#4f9a40'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.45, 0, TAU); ctx.fill();
        ctx.restore();
      }
    },
  },
  // 🌊 Sóng tràn quét ngang
  waves: {
    init(m) { m.hz = { t: rand(6, 8), warn: 0, front: null, dir: 1, hitSet: new Set() }; },
    update(m, dt) {
      const h = m.hz, A = m.arena;
      if (h.front !== null) {
        h.front += h.dir * (2 * A.hx + 200) / 1.5 * dt;
        for (const f of m.bodies) {
          if (!f.alive || f.z > 30 || h.hitSet.has(f) || Math.abs(f.x - h.front) > 55) continue;
          h.hitSet.add(f);
          const k = (f.superArmor ? 0.35 : 1) * 620 / Math.max(0.8, f.weight);
          f.vx += h.dir * k; f.hitstun = Math.max(f.hitstun, f.superArmor ? 0 : 0.25);
          if (!f.superArmor) { f.action = null; f.cancelDash(); }
          m.text(f.x, f.y - 40, '🌊', '#9fe0ff', 18);
        }
        if (Math.random() < 0.9) m.particle(h.front, rand(-A.hy, A.hy), { color: pick(['#ffffff', '#9fe0ff']), life: 0.5, size: 5, vx: h.dir * 300, vy: rand(-60, 60) });
        if (h.dir * h.front > A.hx + 100) h.front = null;
        return;
      }
      h.t -= dt;
      if (h.t <= 1.6 && !h.warn) { h.warn = 1; h.dir = Math.random() < 0.5 ? 1 : -1; m.text(0, -A.hy - 20, `🌊 SÓNG TRÀN ${h.dir > 0 ? '→' : '←'}`, '#9fe0ff', 22); m.sfx('splat', { rate: 0.5, vol: 0.8 }); }
      if (h.t <= 0) { h.front = -h.dir * (A.hx + 80); h.t = rand(8, 11); h.warn = 0; h.hitSet = new Set(); }
    },
    drawOver(ctx, m) {
      const h = m.hz, A = m.arena;
      if (h.warn) {
        ctx.save(); ctx.globalAlpha = 0.25 + 0.2 * Math.sin(m.time * 14); ctx.fillStyle = '#4ab0ff';
        const x0 = h.dir > 0 ? -A.hx : A.hx - 60; ctx.fillRect(x0, -A.hy, 60, 2 * A.hy); ctx.restore();
      }
      if (h.front !== null) {
        ctx.save(); const g = ctx.createLinearGradient(h.front - h.dir * 120, 0, h.front, 0);
        g.addColorStop(0, 'rgba(60,160,255,0)'); g.addColorStop(1, 'rgba(180,230,255,0.75)');
        ctx.fillStyle = g; ctx.fillRect(Math.min(h.front, h.front - h.dir * 120), -A.hy - 20, 120, 2 * A.hy + 40); ctx.restore();
      }
    },
  },
  // ⚡ Sét đánh
  lightning: {
    init(m) { m.hz = { t: 2.5 }; },
    update(m, dt) {
      const h = m.hz; h.t -= dt; if (h.t > 0) return;
      h.t = rand(1.5, 2.3);
      const p = nearFighterPoint(m, 100);
      envStrike(m, p.x, p.y, 58, 0.9, '#9ad0ff', (f, s) => envHit(m, f, { dmg: 5, kb: 80, kg: 1.5, stun: 0.7, src: s }), () => {
        m.fx({ type: 'line', x1: p.x + rand(-30, 30), y1: p.y - 700, x2: p.x, y2: p.y, color: '#e0f4ff', life: 0.25, w: 7 });
        m.fx({ type: 'flash', x: p.x, y: p.y, r: 60, color: '#bfe6ff', life: 0.18 });
        m.shake(4); m.sfx('magic_burst', { vol: 0.5, rate: 1.5 });
      });
    },
  },
  // 🏜️ Cát lún hút vào giữa hố
  quicksand: {
    init(m) {
      m.hz = { pits: (m.arena.pits || []).map((p) => ({ ...p })), tick: 0 };
      for (const p of m.hz.pits) m.dangers.push({ x: p.x, y: p.y, r: p.r, t: Infinity });
    },
    update(m, dt) {
      for (const p of m.hz.pits) for (const f of m.bodies) {
        if (!f.alive || f.z > 0) continue;
        const d = Math.hypot(f.x - p.x, f.y - p.y);
        if (d > p.r) continue;
        f.addStatus('slow', 0.2, 0.4);
        const a = Math.atan2(p.y - f.y, p.x - f.x), k = (1 - d / p.r) * 220 + 60;
        f.vx += Math.cos(a) * k * dt; f.vy += Math.sin(a) * k * dt;
        if (d < 35) { f.percent += 3 * dt * f.takenMult; if (Math.random() < 0.03) m.text(f.x, f.y - 40, 'lún...', '#d8b874', 12); }
      }
    },
    drawUnder(ctx, m) {
      for (const p of m.hz.pits) {
        ctx.save(); ctx.translate(p.x, p.y);
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, p.r); g.addColorStop(0, '#6a4a20'); g.addColorStop(1, 'rgba(160,120,60,0.25)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.8, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(90,60,25,0.6)'; ctx.lineWidth = 3; ctx.rotate(m.time * 1.2);
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, p.r * (0.3 + i * 0.22), i, i + 3.5); ctx.stroke(); }
        ctx.restore();
      }
    },
  },
  // 🌀 Cột xoay quanh tâm
  orbit: {
    init(m) { m.hz = { base: m.arena.pillars.map((p) => ({ a: Math.atan2(p.y, p.x), r: Math.hypot(p.x, p.y) })), ang: 0 }; },
    update(m, dt) {
      const h = m.hz; h.ang += 0.38 * dt;
      m.arena.pillars.forEach((p, i) => { const b = h.base[i]; p.x = Math.cos(b.a + h.ang) * b.r; p.y = Math.sin(b.a + h.ang) * b.r; });
    },
    drawUnder(ctx, m) {
      const c = m.arena.c;
      ctx.save(); ctx.strokeStyle = 'rgba(138,240,255,0.25)'; ctx.lineWidth = 3; ctx.setLineDash([10, 12]);
      ctx.beginPath(); ctx.arc(0, 0, m.hz.base[0].r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      for (const p of m.arena.pillars) drawPillar(ctx, p, c);
    },
  },
};
function arrowOf(a) { return ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'][((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; }
function drawPillar(x, p, c) {
  x.fillStyle = 'rgba(0,0,0,0.35)'; x.beginPath(); x.ellipse(p.x + 8, p.y + 10, p.r * 1.1, p.r * 0.7, 0, 0, TAU); x.fill();
  x.fillStyle = c.side; x.beginPath(); x.arc(p.x, p.y, p.r, 0, TAU); x.fill();
  x.fillRect(p.x - p.r, p.y - 24, p.r * 2, 24);
  const g2 = x.createRadialGradient(p.x - p.r * 0.3, p.y - 30, 2, p.x, p.y - 24, p.r);
  g2.addColorStop(0, c.rim); g2.addColorStop(1, c.top2);
  x.fillStyle = g2; x.beginPath(); x.arc(p.x, p.y - 24, p.r, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(0,0,0,0.4)'; x.lineWidth = 2; x.stroke();
}
