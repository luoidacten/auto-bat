'use strict';
// ===== Định nghĩa 9 vũ khí =====
// skill.use(f, m): f = đấu sĩ, m = trận đấu. f.castAngle do AI đặt trước khi dùng (hướng lướt/dịch chuyển).
// skill.ai: { type:'atk'|'def'|'mob'|'buff', min, max, pri, when(f,t,m), mob:'engage'|'escape' }

// --- Hàm dùng chung ---
function shoot(f, m, angle, o) {
  const off = fromAng(angle, f.r + 4);
  return m.proj(Object.assign({ owner: f, x: f.x + off.x, y: f.y + off.y, angle }, o));
}
function aimOr(f, m, range, speed) {
  const t = m.autoTarget(f, range);
  return t ? m.aimAngle(f, t, speed) : f.facing;
}
function escapeAngle(f, t, m) {
  // chạy ra xa đối thủ nhưng hướng về giữa sân
  const away = t ? angTo(t, f) : f.facing + Math.PI;
  const toC = Math.atan2(-f.y, -f.x);
  const e = m.arena.edgeDist(f.x, f.y);
  const w = clamp(1 - e / 180, 0, 0.85);
  const v = { x: Math.cos(away) * (1 - w) + Math.cos(toC) * w, y: Math.sin(away) * (1 - w) + Math.sin(toC) * w };
  return Math.atan2(v.y, v.x);
}
function cardinalIdx(a) { return ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4; } // 0 Đông,1 Nam,2 Tây,3 Bắc

const WEAPONS = {
  // ================= KIẾM & KHIÊN =================
  kiem_khien: {
    name: 'Kiếm & Khiên', icon: '🛡️', color: '#5aa9ff', weight: 1.3, speed: 1.04, gfx: 'swordshield',
    role: 'Cận chiến • Trâu bò', ai: { range: 70, defend: ['C'] },
    passive: { name: 'Công Thủ', desc: 'Nhận ít hơn 20% điểm văng. Mỗi lần bị đánh trúng tích 1 tầng Phản Kích (tối đa 3): đòn kế tiếp gây thêm 12% điểm văng mỗi tầng.' },
    init(f) { f.ws.counter = 0; f.ws.pcT = 0; f.ws.qWin = 0; f.ws.qCd = 0; },
    resource(f) { return (f.ws.counter ? `Phản kích x${f.ws.counter}` : '') + (f.ws.pcT > 0 ? ' • ↯ C: PHẢN CHẤN' : '') + (f.ws.qWin > 0 && f.ws.qCd <= 0 && f.T('valerius_12a') ? ' • ↯ D: ĐỊA CHẤN' : ''); },
    update(f, m, dt) { f.ws.pcT = Math.max(0, f.ws.pcT - dt); f.ws.qWin = Math.max(0, f.ws.qWin - dt); f.ws.qCd = Math.max(0, f.ws.qCd - dt); },
    onTake(f, att, hit, info) {
      if (!f.T('valerius_12b')) info.taken *= 0.8;
      // Phản Chấn: chặn trúng đòn bằng khiên → mở tái kích hoạt C
      if (f.has('block') && f.T('valerius_6b:shock') && att && !att.isEnv) f.ws.pcT = 1.4;
    },
    afterTake(f) { f.ws.counter = Math.min(3, f.ws.counter + 1); },
    onDeal(f, t, hit, info) {
      if (f.ws.counter) { info.mult *= 1 + 0.12 * f.ws.counter; f.ws.counter = 0; }
      if (f.T('valerius_12b') && (hit.tag === 'A' || hit.tag === 'B')) info.mult *= 1.5;
    },
    skills: {
      A: { name: 'Chém Vòng Cung', cd: 0.5, desc: 'Đánh tích: chém vòng cung phía trước, nhanh.',
        ai: { type: 'atk', max: 88, pri: 2 },
        // Ném Khiên (biến thể Lv6): đang giơ khiên bấm A ném khiên gây choáng
        recast(f) { return f.T('valerius_6b:throw') && f.has('block') && !f.ws.thrown; }, recastBusy: true,
        recastAi: (f, t, m, d) => d < 330 && d > 60,
        recastUse(f, m) {
          f.ws.thrown = true; f.removeStatus('block'); f.action = null;
          const a = aimOr(f, m, 340, 820); f.facing = a;
          shoot(f, m, a, { speed: 820, r: 15, range: 340, kind: 'shieldthrow', color: '#5aa9ff', hit: { dmg: 6, kb: 120, kg: 3.5, stun: 1.2, tag: 'A' },
            onHit: (mm, p, t) => mm.text(t.x, t.y - 56, '🛡️ CHOÁNG!', '#9ec9ff', 15) });
          f.act(0.22, { move: 0, anim: 'thrust', atk: true });
          m.text(f.x, f.y - 56, 'NÉM KHIÊN!', '#9ec9ff', 15); m.sfx('sword_cut', { rate: 0.7 });
          m.later(0.9, () => { f.ws.thrown = false; });
        },
        use(f, m) {
          // Khiên Húc Phá Trận: lướt húc khiên gom kẻ địch
          if (f.T('valerius_6a')) {
            const hit = new Set();
            f.act(0.32, { move: 0, anim: 'thrust', atk: true });
            f.startDash({ angle: f.facing, dist: 120, dur: 0.2, trail: true, onContact: (e) => {
              if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 7, kb: 215, kg: 5.8, tag: 'A', angle: f.facing }); m.fx({ type: 'ring', x: e.x, y: e.y, r: 34, color: '#9ec9ff', life: 0.3, w: 6 }); }
              return false;
            } });
            return;
          }
          const fast = f.T('valerius_12b');
          f.act(fast ? 0.22 : 0.32, { move: 0.4, anim: 'swing', atk: true }, [[fast ? 0.07 : 0.1, () => m.hitArc(f, { range: fast ? 92 : 86, arc: 130, dmg: 7.2, kb: 98, kg: 4.6, tag: 'A' })]]);
        } },
      B: { name: 'Đâm Thẳng', cd: 1.8, desc: 'Kết liễu: dồn lực đâm thẳng 150px về trước, tầm rất xa, đẩy văng rất mạnh.',
        ai: { type: 'atk', min: 50, max: 138, pri: 2.2 },
        use(f, m) { const fast = f.T('valerius_12b'); f.act(fast ? 0.22 : 0.32, { move: 0.3, anim: 'thrust', atk: true }, [[fast ? 0.08 : 0.12, () => m.hitLine(f, { len: 150, w: 36, dmg: 9.6, kb: 182, kg: 7.2, tag: 'B' })]]); } },
      C: { name: 'Khiên Chắn', cd: 9.4, desc: 'Giơ khiên 1s chặn 80% điểm văng & không bị đẩy. Kết thúc bằng cú húc khiên đẩy lùi thẳng, CHOÁNG 0.4s và CÂM LẶNG 1s.',
        ai: { type: 'def', max: 140 },
        recast(f) { return f.T('valerius_6b:shock') && f.ws.pcT > 0; }, recastBusy: true,
        recastAi: (f, t) => dist(f, t) < 160,
        recastUse(f, m) {
          f.ws.pcT = 0; f.removeStatus('block'); f.action = null;
          m.hitCircle(f, { r: 165, dmg: 5, kb: 150, kg: 4, stun: 1, tag: 'C' });
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 165, color: '#9ec9ff', life: 0.45, w: 12 }); m.shake(9);
          m.text(f.x, f.y - 60, '💥 PHẢN CHẤN!', '#9ec9ff', 18); m.sfx('impact', { rate: 0.8 });
          f.act(0.25, { move: 0 });
        },
        use(f, m) {
          // Đấu Sĩ Trảm Sát: không còn khiên — C là cú lướt chém xuyên giáp
          if (f.T('valerius_12b')) {
            const hit = new Set();
            f.act(0.28, { move: 0, anim: 'swing', atk: true });
            f.startDash({ angle: f.castAngle, dist: 150, dur: 0.18, invuln: true, trail: true, onContact: (e) => {
              if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 8, kb: 150, kg: 5, trueDmg: true, tag: 'C', angle: f.castAngle }); }
              return false;
            } });
            return;
          }
          f.addStatus('block', 1.0);
          f.act(1.12, { move: 0.25, anim: 'guard', atk: true, super: true }, [[1.0, () => {
            f.removeStatus('block');
            const big = f.T('valerius_3b');
            const hs = m.hitLine(f, { len: big ? 135 : 90, w: big ? 112 : 56, dmg: 7, kb: big ? 300 : 230, kg: big ? 7 : 5.5, stun: 0.4, silence: 1, tag: 'C', angle: f.facing });
            if (f.T('valerius_9c')) for (const e of hs) e.wallMark = { until: m.time + 0.9 };
          }]]);
        } },
      D: { name: 'Cuồng Phong', cd: 2, desc: 'Tăng 45% tốc chạy trong 1.5s và chém một vòng tròn quanh người, làm chậm 30%.',
        ai: { type: 'atk', max: 105, pri: 3 },
        // Địa Chấn Khiên Binh: bấm D lần nữa nện khiên tạo vết nứt
        recast(f) { return f.T('valerius_12a') && f.ws.qWin > 0 && f.ws.qCd <= 0; },
        recastAi: (f, t) => dist(f, t) < 250 && Math.abs(angDiff(f.facing, angTo(f, t))) < 0.6,
        recastUse(f, m) {
          f.ws.qCd = 8; f.ws.qWin = 0;
          const t = m.nearestEnemy(f); if (t) f.facing = angTo(f, t);
          const a = f.facing;
          f.act(0.4, { move: 0, anim: 'raise', atk: true }, [[0.15, () => {
            m.hitLine(f, { len: 270, w: 64, dmg: 6, kb: 70, kg: 1.5, knockup: 650, tag: 'D', angle: a, quiet: true });
            for (let i = 1; i <= 6; i++) {
              const p = m.arena.clamp({ x: f.x + Math.cos(a) * i * 44, y: f.y + Math.sin(a) * i * 44 }, 4);
              m.zone({ owner: f, x: p.x, y: p.y, r: 30, life: 3, every: 0.2, kind: 'crack', color: 'rgba(90,60,30,0.45)',
                tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) e.addStatus('slow', 0.3, 0.6); } });
            }
            m.shake(12); m.sfx('boom_small'); m.text(f.x, f.y - 60, '⛰️ ĐỊA CHẤN!', '#c9a070', 18);
          }]]);
        },
        use(f, m) {
          f.addStatus('haste', 1.5, 0.45);
          f.act(0.4, { move: 1, anim: 'spin', atk: true }, [[0.14, () => m.hitCircle(f, { r: 104, dmg: 9, kb: 150, kg: 5.8, slow: [0.3, 1], tag: 'D' })]]);
          f.ws.qWin = 1.6;
        } },
      U: { name: 'Chiến Thần Bất Tử', desc: 'Bất tử 5s (không nhận điểm văng, không bị đẩy), +40% sát thương, +85% tốc độ để truy đuổi kẻ bỏ chạy.',
        ai: { type: 'buff', max: 260 },
        use(f, m) {
          f.addStatus('immortal', 5); f.addStatus('empower', 5, 0.4); f.addStatus('haste', 5, 0.85);
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 140, color: '#ffd700', life: 0.6, w: 8 }); m.shake(8);
        } },
    },
  },

  // ================= CUNG =================
  cung: {
    name: 'Cung', icon: '🏹', color: '#7ad67a', weight: 0.95, speed: 1.08, gfx: 'bow',
    role: 'Tầm xa • Linh hoạt', ai: { range: 300, defend: ['C'], ranged: true },
    passive: { name: 'Linh Hoạt', desc: 'Chạy nhanh hơn 25% khi lùi xa kẻ thù. Mỗi 5s không tấn công, đòn A/B/D kế tiếp được Tập Trung: +40% tầm, +25% điểm văng, tên bay nhanh hơn. Tấn công sẽ đặt lại thời gian.' },
    init(f) { f.ws.focusT = 0; },
    resource(f) { return f.ws.focusT >= 5 ? '🎯 TẬP TRUNG' : `Tập trung ${(5 - f.ws.focusT).toFixed(1)}s`; },
    update(f, m, dt) {
      f.ws.focusT += dt; if (f.ws.gustT > 0) f.ws.gustT -= dt;
      const t = m.nearestEnemy(f);
      if (t && (f.moveDir.x || f.moveDir.y)) {
        const a = angTo(t, f);
        if (f.moveDir.x * Math.cos(a) + f.moveDir.y * Math.sin(a) > 0.3) f.frameSpeed *= f.T('elara_1a') ? 1.4 : 1.25;
      }
    },
    onUse(f, key) {
      if (key !== 'C' && !(f.T('elara_9c') && f.ws.focusT >= 5)) f.ws.focusT = 0;
      if (key === 'C' && f.T('elara_12b')) f.ws.rapidEmp = true;
    },
    skills: {
      A: { name: 'Liên Xạ', cd: 1, desc: 'Tự ngắm mục tiêu trong tầm, bắn 3 mũi tên liên tiếp — cấu rỉa tích điểm văng.',
        ai: { type: 'atk', min: 60, max: 440, pri: 2 },
        // Tiễn Trùng Khí: A trúng → bắn thêm 1 mũi tên xé gió
        recast(f) { return f.T('elara_6b') && f.ws.gustT > 0; },
        recastAi: (f, t, m, d) => d < 520 && !m.arena.blocked(f.x, f.y, t.x, t.y, 5),
        recastUse(f, m) {
          f.ws.gustT = 0;
          f.act(0.18, { move: 1, anim: 'draw', atk: true }, [[0.04, () => shoot(f, m, aimOr(f, m, 600, 1300), { speed: 1300, r: 9, range: 640, kind: 'bigarrow', color: '#d8fff0',
            hit: { dmg: 5, kb: 235, kg: 5.5, tag: 'A' } })]]);
          m.text(f.x, f.y - 50, '🌪️ TRÙNG KHÍ', '#d8fff0', 13);
        },
        use(f, m) {
          const foc = f.ws.focusT >= 5, R = (foc ? 620 : 450) * (f.rng || 1), sp = foc ? 1000 : 800;
          const rapid = f.T('elara_12b'), emp = rapid && f.ws.rapidEmp; if (emp) f.ws.rapidEmp = false;
          const times = rapid ? [0, 0.03, 0.06, 0.09, 0.12] : f.T('elara_1c') ? [0, 0.11, 0.22, 0.33] : [0, 0.13, 0.26];
          const k = (foc ? 1.25 : 1) * (emp ? 1.5 : 1) * (rapid ? 0.78 : 1);
          const onHit = f.T('elara_6b') ? () => { f.ws.gustT = 1.3; } : null;
          f.act(rapid ? 0.3 : times.length > 3 ? 0.46 : 0.42, { move: f.T('elara_6c') ? 1 : 0.75, anim: 'draw', atk: true }, times.map((tt) => [tt, () =>
            shoot(f, m, aimOr(f, m, R, sp) + (rapid ? rand(-0.05, 0.05) : 0), { speed: sp, r: 5, range: R + 60, kind: 'arrow', color: emp ? '#9fe8ff' : '#e8f5d0',
              hit: { dmg: 4.9 * k, kb: 68 * (emp ? 1.5 : 1), kg: 3.1, tag: 'A' }, onHit })]));
        } },
      D: { name: 'Tên Hình Nón', cd: 4, desc: 'Đặc kỹ cận chiến: bắn 3 mũi tên tỏa hình nón đẩy lùi kẻ áp sát, tạo khoảng trống để kéo cung.',
        ai: { type: 'atk', max: 160, pri: 2.6 },
        use(f, m) {
          const foc = f.ws.focusT >= 5, R = (foc ? 480 : 340) * (f.rng || 1), sp = foc ? 950 : 760;
          f.act(0.3, { move: f.T('elara_6c') ? 1 : 0.6, anim: 'draw', atk: true }, [[0.08, () => {
            const a = aimOr(f, m, R, sp);
            for (const o of [-0.2, 0, 0.2]) shoot(f, m, a + o, { speed: sp, r: 5, range: R + 40, kind: 'arrow', color: '#e8f5d0', hit: { dmg: 5 * (foc ? 1.25 : 1), kb: 150, kg: 3.6, tag: 'D' } });
          }]]);
        } },
      C: { name: 'Sao Băng Lùi', cd: 5, desc: 'Nhảy lùi về sau và bắn 3 viên sao băng hình nón phía trước, làm chậm 45% trong 1.5s.',
        ai: { type: 'def', max: 200, mob: 'escape' },
        use(f, m) {
          const t = m.nearestEnemy(f);
          const back = t ? escapeAngle(f, t, m) : f.facing + Math.PI;
          f.startDash({ angle: back, dist: 150, dur: 0.24 });
          // Mưa Băng Rải Thảm: bắn tên lên trời, rải mưa băng quanh đối thủ
          if (f.T('elara_6a')) {
            const c = t ? { x: t.x + t.moveDir.x * 40, y: t.y + t.moveDir.y * 40 } : { x: f.x + Math.cos(f.facing) * 200, y: f.y + Math.sin(f.facing) * 200 };
            f.act(0.3, { move: 0, anim: 'draw' });
            m.fx({ type: 'telegraph', x: c.x, y: c.y, r: 150, color: '#9fe8ff', life: 0.35 });
            m.later(0.3, () => m.zone({ owner: f, x: c.x, y: c.y, r: 150, life: 2.5, every: 0.25, kind: 'ice', color: 'rgba(160,230,255,0.22)',
              tick: (mm, z) => {
                for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) { e.addStatus('slow', 0.4, 0.6); if (Math.random() < 0.35) mm.applyHit(f, e, { dmg: 0.8, noKnock: true, tag: 'C', quiet: true }); }
                for (let i = 0; i < 3; i++) mm.particle(z.x + rand(-z.r, z.r) * 0.8, z.y + rand(-z.r, z.r) * 0.8, { color: '#cff6ff', life: 0.35, size: 3, vx: 0, vy: 140 });
              } }));
            return;
          }
          f.act(0.3, { move: 0, anim: 'draw' }, [[0.05, () => {
            const a = aimOr(f, m, 400, 700);
            const ice = f.T('elara_3a');
            for (const o of [-0.28, 0, 0.28]) shoot(f, m, a + o, { speed: 700, r: 7, range: 340, kind: 'star', color: '#9fe8ff', hit: { dmg: 3, kb: 60, kg: 2.4, slow: ice ? [0.7, 3] : [0.45, 1.5], tag: 'C' } });
          }]]);
        } },
      B: { name: 'Kéo Căng Dây', cd: 4.5, hold: 1.5, desc: 'Kết liễu: giữ để kéo dây cung — càng lâu mũi tên càng mạnh, càng nhanh, có thể xuyên thấu (tối đa 1.5s).',
        ai: { type: 'atk', min: 140, max: 560, pri: 2.6 },
        use(f, m) {
          const hold = f.brain ? f.brain.holdTime(1.5, f) : 1.2;
          const foc = f.ws.focusT >= 5;
          const xp = f.T('elara_3b');
          f.act(hold + 0.12, { move: f.T('elara_9a') || f.T('elara_6c') ? 1 : 0.4, anim: 'draw', atk: true, charge: hold }, [[hold, () => {
            const p = hold / 1.5, sp = lerp(650, 1200, p) * (foc ? 1.2 : 1), R = (foc ? 820 : 620) * (f.rng || 1);
            const h = { dmg: lerp(5, 16, p) * (foc ? 1.25 : 1), kb: lerp(90, 270, p), kg: lerp(3.5, 8.3, p), tag: 'B' };
            // Mũi Tên Hư Không: kéo tối đa → hố đen bay chậm hút kẻ địch quanh đường bay rồi nổ
            if (p >= 0.9 && f.T('elara_12a')) { voidArrow(f, m, aimOr(f, m, R, 420), h); m.shake(4); return; }
            shoot(f, m, aimOr(f, m, R, sp), { speed: sp, r: lerp(6, 11, p), range: R, kind: 'arrow', color: '#fffbd0', pierce: p > 0.8 || xp, ghost: xp, hit: h });
            m.shake(3 * p);
          }]]);
        } },
      U: { name: 'Thần Tiễn Phá Không', desc: 'Bắn một mũi tên khổng lồ tự ngắm mục tiêu ở bất kỳ đâu trên màn hình, xuyên thấu, choáng 0.4s.',
        ai: { type: 'atk', min: 0, max: 2000, pri: 5 },
        use(f, m) {
          f.act(0.55, { move: 0, anim: 'draw', atk: true, charge: 0.4 }, [[0.4, () => {
            const t = m.autoTarget(f, 5000);
            const a = t ? m.aimAngle(f, t, 1300) : f.facing;
            shoot(f, m, a, { speed: 1300, r: 17, range: 2200, kind: 'bigarrow', color: '#ffe066', pierce: true, breaker: true,
              hit: Object.assign({ dmg: 16, kb: 320, kg: 9.5, stun: 0.4, tag: 'U' }, f.T('elara_9b') ? { root: 1.5, silence: 1.5 } : {}) });
            m.shake(10);
          }]]);
        } },
    },
  },

  // ================= TRƯỢNG PHÉP =================
  truong: {
    name: 'Trượng Phép', icon: '🔮', color: '#ff7a3a', weight: 0.85, speed: 1.08, gfx: 'staff',
    role: 'Phép thuật • Thiêu đốt', ai: { range: 260, defend: ['C'], ranged: true },
    passive: { name: 'Hỏa Ấn', desc: 'Mọi kỹ năng đều gây Thiêu Đốt: tăng điểm văng theo thời gian (không đánh văng), cộng dồn 3 lần. Có thể vừa đi vừa niệm phép.' },
    init(f) { f.ws.fb = null; },
    resource(f) { return f.T('ignatius_12b') ? '🌀 Hệ Trọng Lực' : ''; },
    onDeal(f, t, hit, info, m) {
      // Pháp Sư Trọng Lực: mỗi tầng trọng lực x1.18 lực đẩy
      if (f.T('ignatius_12b')) { const g = t._grav && t._grav.until > m.time ? t._grav.n : 0; if (g) info.kbMult *= Math.pow(1.18, g); }
    },
    afterDeal(f, t, hit, m) {
      if (f.T('ignatius_12b')) {
        if (hit.quiet) return;
        const g = t._grav && t._grav.until > m.time ? t._grav.n : 0;
        t._grav = { n: Math.min(6, g + 1), until: m.time + 4 };
        m.text(t.x, t.y - 64, `🌀x${t._grav.n}`, '#b0a0ff', 13);
        return;
      }
      t.addStatus('burn', 3, f.T('ignatius_1b') ? 2.5 : 2);
      if (f.T('ignatius_6c') && t.status.burn) t.status.burn.ign = true;
      if (f.T('ignatius_9a') && !t.isMinion) t.addStatus('hellfire', 9999, 0.9);
    },
    skills: {
      A: { name: 'Cầu Lửa', cd: 1.1, desc: 'Ném quả cầu lửa tự ngắm mục tiêu trong tầm, nổ lan — cấu rỉa và đốt điểm văng.',
        ai: { type: 'atk', min: 70, max: 430, pri: 2.2 },
        // Kích Nổ Cầu Lửa: bấm A lần nữa nổ giữa đường bay
        recast(f) { return f.T('ignatius_6b') && !!f.ws.fb && !f.ws.fb.dead; },
        recastAi: (f, t) => { const p = f.ws.fb; return Math.hypot(p.x - t.x, p.y - t.y) < 62 || (p.traveled > 120 && Math.hypot(p.x - t.x, p.y - t.y) < 110 && Math.cos(p.ang - Math.atan2(t.y - p.y, t.x - p.x)) < 0.2); },
        recastUse(f, m) {
          const p = f.ws.fb; f.ws.fb = null; p.dead = true;
          explode(f, m, p.x, p.y, 76, { dmg: 8.4, kb: 150, kg: 5.4, tag: 'A' });
          m.text(p.x, p.y - 30, '💥', '#ffb36a', 16);
        },
        use(f, m) {
          f.act(0.3, { move: 0.85, anim: 'cast', atk: true }, [[0.1, () => {
            const t = m.autoTarget(f, 440), sp = f.T('ignatius_1a') ? 785 : 560;
            const a = t ? m.aimAngle(f, t, sp) : f.facing;
            const R = f.T('ignatius_6b') ? 460 : t ? clamp(dist(f, t) + 10, 60, 440) : 400;
            f.ws.fb = shoot(f, m, a, { speed: sp, r: 10, range: R, kind: 'fireball', color: '#ff8a2a', hit: null,
              onHit: (mm, p) => explode(f, mm, p.x, p.y, 64, { dmg: 8.4, kb: 138, kg: 5.2, tag: 'A' }),
              onEnd: (mm, p) => explode(f, mm, p.x, p.y, 64, { dmg: 8.4, kb: 138, kg: 5.2, tag: 'A' }) });
          }]]);
        } },
      D: { name: 'Vòng Lửa', cd: 2, desc: 'Đặc kỹ giữ khoảng cách: bùng một vòng lửa quanh người, đẩy kẻ áp sát ra xa để có chỗ tích Đại Hỏa Cầu.',
        ai: { type: 'atk', max: 100, pri: 2.8 },
        use(f, m) {
          // Tường Lửa Chắn Lối: dựng tường lửa trước mặt
          if (f.T('ignatius_6a')) {
            const a = f.facing, c = { x: f.x + Math.cos(a) * 85, y: f.y + Math.sin(a) * 85 }, px = -Math.sin(a) * 120, py = Math.cos(a) * 120;
            m.walls.push({ owner: f, x1: c.x - px, y1: c.y - py, x2: c.x + px, y2: c.y + py, t: 0, life: 4 });
            f.act(0.3, { move: 0.5, anim: 'cast' });
            m.text(c.x, c.y - 40, '🔥 TƯỜNG LỬA', '#ff8a3a', 15); m.sfx('magic_spell', { rate: 0.8 });
            return;
          }
          f.act(0.3, { move: 0.3, anim: 'cast', atk: true }, [[0.08, () => {
            const hs = m.hitCircle(f, { r: 105, dmg: 5.5, kb: 185, kg: 4.2, tag: 'D' });
            if (f.T('ignatius_3a')) for (const e of hs) if ((e._igRoot || 0) < m.time) { e._igRoot = m.time + 4; e.addStatus('root', 0.75); }
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 100, color: '#ff6a1a', life: 0.35, w: 14, fill: 'rgba(255,120,30,0.25)' });
          }]]);
        } },
      C: { name: 'Dịch Chuyển', cd: 3.2, desc: 'Dịch chuyển tức thời 210px theo hướng chỉ định; điểm đến phát nổ đẩy lùi kẻ địch xung quanh và tăng tốc 1s.',
        ai: { type: 'def', max: 150, mob: 'escape' },
        use(f, m) {
          const a = f.castAngle, o = { x: f.x, y: f.y }, Lm = f.T('ignatius_1c') ? 273 : 210, L = clamp(f.castDist || Lm, 60, Lm);
          f.castDist = 0;
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 30, color: '#ffb36a', life: 0.3, w: 4 }); m.sfx('magic_spell', { rate: 1.4 });
          if (f.T('ignatius_3b')) m.later(0.25, () => explode(f, m, o.x, o.y, 90, { dmg: 5, kb: 170, kg: 4, tag: 'C' }));
          const p = m.arena.clamp({ x: f.x + Math.cos(a) * L, y: f.y + Math.sin(a) * L }, f.r + 6);
          f.x = p.x; f.y = p.y; f.invulnT = Math.max(f.invulnT, 0.2);
          f.addStatus('haste', 1, 0.3);
          // nổ ở điểm đến
          m.later(0.06, () => { if (f.alive) explode(f, m, f.x, f.y, 88, { dmg: 5.5, kb: 185, kg: 4.6, tag: 'C' }); });
          f.act(0.1, { move: 0 });
        } },
      B: { name: 'Đại Hỏa Cầu', cd: 3.4, hold: 1.6, desc: 'Kết liễu: giữ để tích một quả cầu lửa lớn (tối đa 1.6s); thả ra bay tới mục tiêu và nổ rất to.',
        ai: { type: 'atk', min: 120, max: 470, pri: 2.7 },
        use(f, m) {
          const hold = f.brain ? f.brain.holdTime(1.6, f) : 1.2;
          f.act(hold + 0.15, { move: 0.5, anim: 'cast', atk: true, charge: hold }, [[hold, () => {
            const p = hold / 1.6, t = m.autoTarget(f, 520);
            const a = t ? m.aimAngle(f, t, 480) : f.facing;
            const R = t ? clamp(dist(f, t), 80, 520) : 420, er = lerp(70, 140, p);
            const h = { dmg: lerp(9, 19, p), kb: lerp(150, 330, p), kg: lerp(4.8, 9.2, p), tag: 'B' };
            // Hố Đen Tro Tàn: tích tối đa → hút kẻ địch vào tâm rồi mới nổ
            const boom = p >= 0.9 && f.T('ignatius_12a') ? (mm, pr) => ashHole(f, mm, pr.x, pr.y, er, h) : (mm, pr) => explode(f, mm, pr.x, pr.y, er, h);
            shoot(f, m, a, { speed: 480, r: lerp(12, 22, p), range: R, kind: 'fireball', color: p >= 0.9 && f.T('ignatius_12a') ? '#5a2aff' : '#ff5a1a', hit: null, breaker: f.T('ignatius_3c'),
              onHit: boom, onEnd: boom });
          }]]);
        } },
      U: { name: 'Thiên Thạch', desc: 'Gọi thiên thạch rơi vào vị trí kẻ địch, nổ cực to, hất tung và để lại vùng lửa 4s.',
        ai: { type: 'atk', min: 0, max: 700, pri: 5 },
        use(f, m) {
          const t = m.autoTarget(f, 900);
          let tx = f.x + Math.cos(f.facing) * 200, ty = f.y + Math.sin(f.facing) * 200;
          if (t) { tx = t.x + t.vx * 0.15 + t.moveDir.x * t.speed * 0.4; ty = t.y + t.vy * 0.15 + t.moveDir.y * t.speed * 0.4; }
          const big = f.T('ignatius_9b'), R = big ? 290 : 160;
          f.act(0.4, { move: 0, anim: 'cast' });
          m.fx({ type: 'telegraph', x: tx, y: ty, r: R, color: '#ff4a1a', life: 0.9 });
          m.fx({ type: 'meteor', x: tx, y: ty, life: 0.9 });
          m.later(0.9, () => {
            explode(f, m, tx, ty, R, { dmg: 18, kb: 220, kg: 8, knockup: 380, tag: 'U' });
            if (big) for (const e of m.enemiesOf(f)) if (Math.hypot(e.x - tx, e.y - ty) < 110) { e.addStatus('stun', 2); m.text(e.x, e.y - 60, 'TẬN THẾ!', '#ff4a1a', 18); }
            m.shake(18);
            m.zone({ owner: f, x: tx, y: ty, r: 130, life: 4, every: 0.5, color: 'rgba(255,90,20,0.22)', kind: 'fire',
              tick: (mm, z) => mm.hitCircle(f, { x: z.x, y: z.y, r: z.r, dmg: 1.2, noKnock: true, tag: 'U', quiet: true }) });
          });
        } },
    },
  },

  // ================= RAPIER =================
  rapier: {
    name: 'Rapier', icon: '🤺', color: '#e0e0ff', weight: 0.95, speed: 1.12, gfx: 'rapier',
    role: 'Cận chiến • Kỹ thuật', ai: { range: 150, defend: ['E', 'C'] },
    passive: { name: 'Lướt', desc: 'Có thể lướt rất ngắn theo bất kỳ hướng nào, né mọi sát thương khi lướt (hồi 1.6s).' },
    init(f) { f.ws.empNext = false; f.ws.ripT = 0; },
    update(f, m, dt) {
      if (f.ws.ripT > 0) f.ws.ripT -= dt;
      // chốt an toàn: nếu ấn đã mất (đối thủ bị KO...) thì bắt đầu hồi chiêu D
      if (f.cd.D >= 90 && !m.projs.some((p) => p.owner === f && p.kind === 'mark') &&
          !m.fighters.some((e) => e.marks && e.marks.owner === f)) f.cd.D = f.cdOf('D');
    },
    resource(f, m) {
      const t = m && m.nearestEnemy(f);
      const mk = t && t.marks && t.marks.owner === f ? t.marks.list.filter(Boolean).length : 0;
      return (mk ? `Ấn còn: ${mk}/4 ` : '') + (f.ws.empNext ? '⚡CƯỜNG HÓA' : '') + (f.ws.ripT > 0 ? ' • ↯ C: HỒI MÃ' : '');
    },
    onDeal(f, t, hit, info, m) {
      // cân bằng lại sau khi bỏ thời gian khựng 0.8s
      info.kbMult *= 0.7; info.mult *= 0.8;
      if (f.ws.empNext && hit.tag !== 'C') { info.kbMult *= f.T('florian_9c') ? 3.2 : 2.3; f.ws.empNext = false; m.text(t.x, t.y - 50, 'ĐẨY CỰC MẠNH!', '#ffffff', 18); }
      const mk = t.marks;
      if (mk && mk.owner === f) {
        const idx = cardinalIdx(angTo(t, hit.src || f));
        if (mk.list[idx]) breakMark(f, t, idx, m, info.extra);
      }
    },
    marksEnd(f, t, m) {
      f.cd.D = f.cdOf('D');
      if (f.has('swordform')) m.later(0.35, () => { if (!t.dead && f.has('swordform')) placeMarks(f, t, 2.5); });
    },
    onIncoming(f, att, hit, m) {
      if (!f.has('parry') || !att || att === f || att.isEnv) return true;
      f.removeStatus('parry'); f.action = null; f.invulnT = Math.max(f.invulnT, 0.35);
      m.text(f.x, f.y - 50, 'PHẢN ĐÒN!', '#ffffff', 20); m.sfx('sword_clash', { rate: 1.2 });
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 70, color: '#ffffff', life: 0.35, w: 6 });
      m.applyHit(f, att, { dmg: 8 + (hit.dmg || 0) * 0.5, kb: 140, kg: 4.8, stun: 1.0, tag: 'C', angle: angTo(f, att) });
      if (f.T('florian_1c')) f.cd.E = 0;
      if (f.T('florian_6a')) f.ws.ripT = 1.4;
      if (f.T('florian_9b')) {
        for (const e of m.enemiesOf(f)) if (e !== att && dist(e, f) < 170) e.addStatus('stun', 1.5);
        if (att.alive) att.addStatus('stun', 1.5);
        m.fx({ type: 'ring', x: f.x, y: f.y, r: 170, color: '#ffffff', life: 0.45, w: 8 });
      }
      m.shake(6);
      return false;
    },
    skills: {
      E: { name: 'Lướt (nội tại)', cd: 1.5, mobility: true, desc: 'Lướt ngắn bất kỳ hướng nào, né sát thương.',
        ai: { type: 'def' },
        use(f, m) { f.startDash({ angle: f.castAngle, dist: f.T('florian_1a') ? 100 : 80, dur: 0.14, invuln: true }); f.act(0.16, { move: 0 }); } },
      A: { name: 'Đâm Lao', cd: 0.75, desc: 'Đánh tích: lao thẳng về trước; chạm địch thì dừng lại và gây sát thương, chạm mép sàn cũng dừng.',
        ai: { type: 'atk', min: 40, max: 205, pri: 2.4, when: (f, t) => !f.T('florian_6b') || dist(f, t) < 105 },
        use(f, m) {
          // Vũ Điệu Lốc Xoáy: đâm xoay tròn tại chỗ, hút nhẹ và phá 2 ấn gần nhất
          if (f.T('florian_6b')) {
            f.act(0.34, { move: 0.3, anim: 'spin', atk: true }, [[0.1, () => {
              const hs = m.hitCircle(f, { r: 98, dmg: 6.5, kb: 30, kg: 1.2, tag: 'A' });
              for (const e of hs) {
                pullTo(f, e, f.r + e.r + 18, 500, 0.2);
                const mk = e.marks;
                if (mk && mk.owner === f) {
                  const cur = angTo(e, f);
                  const idx = [0, 1, 2, 3].filter((i) => mk.list[i]).sort((a, b) => Math.abs(angDiff(cur, a * Math.PI / 2)) - Math.abs(angDiff(cur, b * Math.PI / 2))).slice(0, 2);
                  for (const i of idx) if (e.marks && e.marks.list[i]) breakMark(f, e, i, m, null);
                }
              }
            }]]);
            return;
          }
          lunge(f, m, f.facing, 195, 'A', f.T('florian_12b'));
          if (f.has('swordform')) {
            const t = m.nearestEnemy(f);
            if (t) { const s = m.arena.clamp({ x: t.x + Math.cos(f.facing) * 110, y: t.y + Math.sin(f.facing) * 110 }, 4); phantom(f, m, s, angTo(s, t), 200, 'A'); }
          }
        } },
      B: { name: 'Phân Ảnh', cd: 1.6, desc: 'Kết liễu: tạo phân ảnh đối diện bản thân, lao ngược về phía bạn; chạm địch thì gây sát thương rồi biến mất (kéo địch về phía bạn).',
        ai: { type: 'atk', min: 30, max: 210, pri: 2.2 },
        use(f, m) {
          const t = m.nearestEnemy(f);
          if (f.has('swordform') && t) {
            const a = angTo(f, t);
            const p = m.arena.clamp({ x: t.x + Math.cos(a) * 75, y: t.y + Math.sin(a) * 75 }, f.r + 4);
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 26, color: '#ff9ad5', life: 0.3, w: 3 });
            f.x = p.x; f.y = p.y; f.facing = angTo(f, t);
            lunge(f, m, f.facing, 190, 'B', f.T('florian_12b'));
            return;
          }
          f.act(0.25, { move: 0.3, anim: 'thrust', atk: true });
          const s = m.arena.clamp({ x: f.x + Math.cos(f.facing) * 230, y: f.y + Math.sin(f.facing) * 230 }, 4);
          phantom(f, m, s, angTo(s, f), dist(s, f), 'B', f.T('florian_3a'));
          // Song Kiếm Quý Tộc: phân ảnh thứ hai lệch góc
          if (f.T('florian_12b')) m.later(0.12, () => {
            if (!f.alive) return;
            const s2 = m.arena.clamp({ x: f.x + Math.cos(f.facing + 0.35) * 215, y: f.y + Math.sin(f.facing + 0.35) * 215 }, 4);
            phantom(f, m, s2, angTo(s2, f), dist(s2, f), 'B', f.T('florian_3a'));
          });
        } },
      C: { name: 'Thế Thủ', cd: 6, desc: 'Vào thế thủ 1s, bất tử. Nếu bị tấn công: phản đòn gây sát thương và CHOÁNG kẻ tấn công 1s. Không ai tấn công: hoàn 25% hồi chiêu.',
        ai: { type: 'def', max: 160 },
        // Đột Kích Hồi Mã: phản đòn thành công → lướt đâm xuyên ra sau lưng đối thủ
        recast(f) { return f.T('florian_6a') && f.ws.ripT > 0; },
        recastAi: (f, t) => dist(f, t) < 220,
        recastUse(f, m) {
          f.ws.ripT = 0;
          const t = m.nearestEnemy(f); if (!t) return;
          const a = angTo(f, t), hit = new Set();
          f.facing = a;
          f.act(0.28, { move: 0, anim: 'thrust', atk: true });
          f.startDash({ angle: a, dist: dist(f, t) + 80, dur: 0.16, invuln: true, trail: true, through: true, onContact: (e) => {
            if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 8, kb: 175, kg: 6, tag: 'C', angle: a }); }
            return false;
          } });
          m.text(f.x, f.y - 50, '🐎 HỒI MÃ!', '#ffffff', 15);
        },
        use(f, m) {
          // Song Kiếm Quý Tộc: mất thế thủ, C thành lướt tự do
          if (f.T('florian_12b')) { f.startDash({ angle: f.castAngle, dist: 160, dur: 0.16, invuln: true, trail: true }); f.act(0.18, { move: 0 }); return; }
          // phản đòn không thành công: hoàn 25% hồi chiêu C
          f.addStatus('parry', 1); f.act(1, { move: 0, anim: 'guard', onEnd: () => { if (f.has('parry')) { f.removeStatus('parry'); f.cd.C *= 0.75; } } });
        } },
      D: { name: 'Tứ Ấn', cd: 5, manualCd: true, desc: 'Ném dấu ấn: trúng địch sẽ xuất hiện 4 ấn Đông-Tây-Nam-Bắc. Đánh trúng từ đúng hướng của ấn để phá: mỗi ấn giảm 1.5s mọi hồi chiêu và LÀM CHẬM mạnh. Chỉ cần phá 3/4 ấn: CHOÁNG lâu + đòn kế tiếp đẩy lùi cực mạnh + Florian hồi 5% điểm văng. Chỉ hồi chiêu khi ấn đã hết; ném trượt thì hồi chiêu giảm 50%.',
        ai: { type: 'atk', min: 60, max: 440, pri: 2.9, when: (f, t) => !(t.marks && t.marks.owner === f) },
        use(f, m) {
          f.cd.D = 99;
          f.act(0.25, { move: 0.5, anim: 'cast', atk: true }, [[0.08, () => {
            let hitAny = false;
            shoot(f, m, aimOr(f, m, 460, 820), { speed: 820, r: 8, range: 460, kind: 'mark', color: '#ff9ad5', hit: null,
              onHit: (mm, p, t) => { hitAny = true; placeMarks(f, t, 5); mm.applyHit(f, t, { dmg: 2, kb: 0, kg: 0, noKnock: true, tag: 'D' }); return true; },
              onEnd: () => { if (!hitAny) f.cd.D = f.cdOf('D') * 0.5; } });
          }]]);
        } },
      U: { name: 'Kiếm Thế Tứ Ấn', desc: 'Trong 4s: 4 ấn liên tục đặt lên kẻ thù; A cường hóa (thêm phân ảnh lao từ phía sau), B cường hóa (dịch chuyển ra sau địch rồi lao). Mỗi lần phá ấn (3/4) kích hoạt choáng + đẩy cực mạnh và lập tức tung nhát đâm XUYÊN THỦNG mọi thứ (xuyên tường, khiên, mọi kẻ địch).',
        ai: { type: 'buff', max: 400 },
        use(f, m) {
          f.addStatus('swordform', f.T('florian_9a') ? 6 : 4);
          const t = m.nearestEnemy(f);
          if (t) placeMarks(f, t, 4);
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 120, color: '#ff9ad5', life: 0.5, w: 6 });
        } },
    },
  },

  // ================= DAO GĂM =================
  dao: {
    name: 'Dao Găm', icon: '🔪', color: '#b07aff', weight: 1.08, speed: 1.22, gfx: 'dagger',
    role: 'Sát thủ • Đánh lén', ai: { range: 55, defend: ['C'] },
    passive: { name: 'Đâm Sau Lưng', desc: 'Đòn đánh trúng từ phía sau lưng gây gấp đôi điểm văng, tăng 50% lực văng và CÂM LẶNG đối thủ 1s.' },
    init(f) { f.ws.recast = null; f.ws.cloak = false; f.ws.triple = false; },
    resource(f) { return (f.ws.recast ? '↯ TÁI KÍCH HOẠT D ' : '') + (f.ws.triple ? '✖3 SÁT THƯƠNG' : ''); },
    update(f, m, dt) {
      if (f.ws.recast) { f.ws.recast.time -= dt; if (f.ws.recast.time <= 0 || f.ws.recast.t.dead) f.ws.recast = null; }
      if (f.ws.cloak && !f.has('untargetable')) { f.ws.cloak = false; f.cd.C = f.cdOf('C'); }
    },
    // Bước Đi Không Vết: chỉ lộ diện khi đòn đánh trúng
    onUse(f, key) { if (key !== 'C' && f.has('untargetable') && !f.T('vesper_6c')) { f.removeStatus('untargetable'); f.removeStatus('haste'); } },
    afterDeal(f, t, hit, m) {
      if (f.T('vesper_6c') && f.ws.cloak && f.has('untargetable') && !hit.quiet) { f.removeStatus('untargetable'); f.removeStatus('haste'); }
      // Độc Sát Chuyên Nghiệp: độc mạnh, trúng 3 đòn liên tiếp → choáng + câm lặng
      if (f.T('vesper_12b') && !hit.quiet && !t.isMinion) {
        t.addStatus('poison', 3, 2.6);
        const v = t._vc && m.time - t._vc.t < 2.5 ? t._vc.n + 1 : 1;
        t._vc = { n: v, t: m.time };
        if (v >= 3 && m.time > (t._vcCd || 0)) { t._vc = null; t._vcCd = m.time + 6; t.addStatus('stun', 1); t.addStatus('silence', 2); m.text(t.x, t.y - 64, '☠️ ĐỘC SÁT!', '#8be04a', 18); }
      }
    },
    onDeal(f, t, hit, info, m) {
      const src = hit.src || f;
      if (Math.abs(angDiff(t.facing, angTo(t, src))) > 1.95) {
        const deep = f.T('vesper_3a');
        info.mult *= deep ? 2.4 : 1.85; info.kbMult *= deep ? 1.8 : 1.5; info.extra.push(() => t.addStatus('silence', 1)); m.text(t.x, t.y - 48, 'SAU LƯNG!', '#d0a0ff', 17);
        // Lưỡi Dao Đoạt Mạng: sau lưng kẻ trên 80% → lực đẩy x4
        if (f.T('vesper_12c') && t.percent > 80) { info.kbMult *= 4 / (deep ? 1.8 : 1.5); m.text(t.x, t.y - 66, '🗡️ ĐOẠT MẠNG!', '#ff4aff', 19); }
        if (hit.tag === 'B' && f.T('vesper_6a')) info.extra.push(() => t.addStatus('root', 1));
      }
      if (f.ws.triple && hit.tag !== 'D' && hit.tag !== 'U') {
        const k = f.T('vesper_9b') ? 4 : 3;
        info.mult *= k; f.ws.triple = false; m.text(t.x, t.y - 66, `x${k}!`, '#ff4aff', 22);
      }
    },
    skills: {
      A: { name: 'Chém Nhanh', cd: 0.5, desc: 'Đánh tích: chém vòng cung ngắn, cực nhanh.',
        ai: { type: 'atk', max: 70, pri: 2 },
        use(f, m) { f.act(0.24, { move: 0.5, anim: 'swing', atk: true }, [[0.06, () => m.hitArc(f, { range: 72, arc: 120, dmg: 7.1, kb: 94, kg: 4.1, tag: 'A' })]]); } },
      B: { name: 'Xuyên Tâm', cd: 2, desc: 'Kết liễu: lao xuyên qua kẻ địch, chém một nhát văng cực mạnh (đánh sau lưng còn mạnh hơn).',
        ai: { type: 'atk', min: 40, max: 150, pri: 2.2 },
        use(f, m) {
          const hit = new Set();
          f.act(0.26, { move: 0, anim: 'thrust', atk: true });
          f.startDash({ angle: f.facing, dist: f.T('vesper_6a') ? 175 : 150, dur: 0.2, through: f.T('vesper_6a'), trail: f.T('vesper_6a'), onContact: (e) => {
            if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 9, kb: 158, kg: 6.4, tag: 'B', angle: f.facing }); }
            return false;
          } });
        } },
      C: { name: 'Ẩn Thân', cd: 5.6, manualCd: true, desc: 'Tăng 50% tốc chạy và không thể bị tự ngắm trong 2s hoặc tới khi tấn công. Chỉ hồi chiêu khi kết thúc.',
        ai: { type: 'def', max: 300, mob: 'engage' },
        use(f, m) {
          const T = f.T('vesper_6c') ? 3.5 : 2;
          f.addStatus('untargetable', T); f.addStatus('haste', T, f.T('vesper_1a') ? 0.75 : 0.5);
          if (f.T('vesper_12a')) shadowClones(f, m);
          f.ws.cloak = true; f.cd.C = 99;
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#b07aff', life: 0.4, w: 4 });
        } },
      D: { name: 'Phi Dao Ảnh Bộ', cd: 3, desc: 'Ném 1 con dao gây độc và CÂM LẶNG 1s. Nếu trúng, tái kích hoạt trong 2s để dịch chuyển ra sau lưng đối thủ.',
        ai: { type: 'atk', min: 50, max: 400, pri: 2.4 },
        recast(f) { return !!f.ws.recast; },
        recastUse(f, m) {
          const t = f.ws.recast.t; const ult = f.ws.recast.ult; f.ws.recast = null;
          // Đổi Hướng Đột Kích: ra trước mặt + đá hất tung
          if (f.T('vesper_6b')) { blinkFront(f, t, m); if (t.alive) m.applyHit(f, t, { dmg: 5, kb: 70, kg: 1.5, knockup: 560, tag: 'D', angle: angTo(f, t) }); m.text(t.x, t.y - 56, '🦵 ĐÁ HẤT!', '#d0a0ff', 15); }
          else blinkBehind(f, t, m);
          if (ult) { f.ws.triple = true; }
          if (f.T('vesper_3b') && t.alive) { t.addStatus('blind', 1.5); m.text(t.x, t.y - 50, '🕶️ MÙ!', '#a0a0b0', 15); }
        },
        use(f, m) {
          f.act(0.2, { move: 0.6, anim: 'cast', atk: true }, [[0.06, () => {
            shoot(f, m, aimOr(f, m, 420, 900), { speed: 900, r: 6, range: 420, kind: 'knife', color: '#c9b0ff',
              hit: { dmg: 3, kb: 40, kg: 1.8, poison: [f.T('vesper_1b') ? 2.6 : 2, 3], silence: 1, tag: 'D' },
              onHit: (mm, p, t) => { f.ws.recast = { t, time: 2 }; } });
          }]]);
        } },
      U: { name: 'Bão Phi Đao', desc: 'Ném 10 con dao xung quanh. Nếu trúng: tái kích hoạt để dịch chuyển ra sau lưng, đòn đánh kế tiếp gây gấp 3 điểm văng.',
        ai: { type: 'atk', max: 260, pri: 5 },
        use(f, m) {
          f.act(0.3, { move: 0, anim: 'spin', atk: true }, [[0.08, () => {
            const n = f.T('vesper_9a') ? 14 : 10;
            for (let i = 0; i < n; i++) shoot(f, m, f.facing + (i / n) * TAU, { speed: 760, r: 6, range: 420, kind: 'knife', color: '#ff9aff',
              hit: { dmg: 4, kb: 60, kg: 2.5, poison: [2.5, 3], tag: 'U' }, onHit: (mm, p, t) => { f.ws.recast = { t, time: 2.5, ult: true }; } });
          }]]);
        } },
    },
  },

  // ================= KATANA =================
  katana: {
    name: 'Katana', icon: '⚔️', color: '#ff5a7a', weight: 1.08, speed: 1.12, gfx: 'katana',
    role: 'Cận chiến • Combo', ai: { range: 80, defend: ['C'] }, noRage: true,
    passive: { name: 'Liên Hoàn', desc: 'Mỗi 2 chiêu A/B/C liên tiếp (trong 1.8s) sẽ kích hoạt Combo khi chiêu thứ 2 kết thúc, hồi ngay chiêu A và nạp 1 Kiếm Khí (D). Combo 5 lần sẽ kích hoạt Nộ (không dùng thanh nộ).\nAA: chém tròn rộng • AB: lướt chém rồi chém tròn nhỏ • AC: hư ảnh cùng chém tròn • BB: đâm lần nữa gây CHOÁNG • BC: phóng dư ảnh lao tới • CC: gió xoáy làm chậm.' },
    init(f) { f.ws.last = null; f.ws.lastT = 99; f.ws.combos = 0; f.ws.wave = 0; f.ws.prev = { x: 0, y: 0 }; },
    resource(f) { return `Combo ${f.ws.combos}/${comboNeed(f)}` + (f.ws.wave ? ' • 🌙 Kiếm khí' : '') + (f.ws.last && f.ws.lastT < 1.8 ? ` • [${f.ws.last}+?]` : ''); },
    ultReady(f) { return f.ws.combos >= comboNeed(f); },
    onDeal(f, t, hit, info) { if (f.ws.bbEmp && !hit.bb) { f.ws.bbEmp = false; info.kbMult *= 1.4; } },
    update(f, m, dt) { f.ws.lastT += dt; if (f.ws.backT > 0) f.ws.backT -= dt; },
    onUse(f, key, m) {
      if (!'ABC'.includes(key)) return;
      if (f.ws.last && f.ws.lastT < 1.8) {
        // Ngược Gió Chém Sát: B rồi A (đúng thứ tự) thành combo hất tung
        const pair = f.ws.last === 'B' && key === 'A' && f.T('ryoma_6b') ? 'BA' : [f.ws.last, key].sort().join('');
        f.ws.last = null;
        if (f.action) f.action.then = () => katanaCombo(f, m, pair);
        else katanaCombo(f, m, pair);
      } else { f.ws.last = key; f.ws.lastT = 0; }
    },
    skills: {
      A: { name: 'Nhất Đao', cd: 0.8, desc: 'Đánh tích: chém hình vòng cung.',
        ai: { type: 'atk', max: 92, pri: 2.2 },
        use(f, m) {
          const opener = f.T('ryoma_1b') && !(f.ws.last && f.ws.lastT < 1.8);
          // Đao Phách Vô Tận: A hồi từ combo chém xa hơn 30% và chém tan đạn nhỏ
          const long = f.ws.longA; f.ws.longA = false;
          const R = (opener ? 106 : 88) * (long ? 1.3 : 1);
          f.act(0.3, { move: 0.4, anim: 'swing', atk: true }, [[0.09, () => {
            m.hitArc(f, { range: R, arc: opener ? 160 : 135, dmg: 6, kb: 92, kg: 4.4, tag: 'A' });
            if (long) for (const p of m.projs) {
              if (p.dead || p.owner.team === f.team || p.breaker || p.r > 9) continue;
              const d = Math.hypot(p.x - f.x, p.y - f.y);
              if (d < R + 20 && Math.abs(angDiff(f.facing, Math.atan2(p.y - f.y, p.x - f.x))) < 1.3) { p.dead = true; m.particle(p.x, p.y, { color: '#ffffff', life: 0.25, size: 4, vx: rand(-150, 150), vy: rand(-150, 150) }); }
            }
          }]]);
        } },
      B: { name: 'Đột Thích', cd: 1.3, desc: 'Kết liễu: đâm thẳng về trước, đẩy văng mạnh.',
        ai: { type: 'atk', min: 45, max: 118, pri: 2.2 },
        use(f, m) {
          // Kiếm Cư Hợp: tra kiếm tụ lực rồi lướt chém xuyên sàn
          if (f.T('ryoma_12b')) {
            const hold = f.brain ? f.brain.holdTime(1, f) : 0.7, p = hold / 1, hit = new Set();
            f.act(hold + 0.22, { move: 0.15, anim: 'guard', atk: true, charge: hold }, [[hold, () => {
              const a = f.facing;
              f.startDash({ angle: a, dist: lerp(230, 380, p), dur: 0.1, invuln: true, trail: true, through: true, onContact: (e) => {
                if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: lerp(8, 16, p), kb: lerp(160, 290, p), kg: lerp(5, 8.5, p), tag: 'B', angle: a }); m.fx({ type: 'slash', x: e.x, y: e.y, r: 40, a: a + Math.PI / 2, arc: 2.6, color: '#ffffff', life: 0.3, w: 10, heavy: true }); }
                return false;
              } });
              m.fx({ type: 'thrust', x: f.x, y: f.y, a, len: lerp(230, 380, p), w: 30, color: '#ffd0e0', life: 0.3 });
              m.sfx('slash_heavy'); m.shake(4 + 6 * p);
            }]]);
            return;
          }
          f.act(0.3, { move: 0.3, anim: 'thrust', atk: true }, [[0.1, () => m.hitLine(f, { len: f.T('ryoma_1c') ? 148 : 118, w: 26, dmg: 6.8, kb: 120, kg: 5.2, tag: 'B' })]]);
        } },
      C: { name: 'Thuấn Bộ', cd: 2, desc: 'Lướt ngắn về phía trước mặt.',
        ai: { type: 'mob', min: 110, max: 260, pri: 1.6, mob: 'engage' },
        // Thuật Thế Thân: trong 1s bấm C lần nữa giật về chỗ cũ, tàn ảnh chém quét
        recast(f) { return f.T('ryoma_6a') && f.ws.backT > 0; },
        recastAi: (f, t, m, d) => (f.percent > 70 && d < 120) || (t.action && t.action.atk && d < 150) || m.arena.edgeDist(f.x, f.y) < 60,
        recastUse(f, m) {
          f.ws.backT = 0;
          const e = { x: f.x, y: f.y }, p = f.ws.prev;
          f.cancelDash();
          m.fx({ type: 'ghost', x: e.x, y: e.y, r: f.r, color: f.color, life: 0.5 });
          m.hitCircle(f, { x: e.x, y: e.y, r: 92, dmg: 6, kb: 145, kg: 4.8, tag: 'C' });
          m.fx({ type: 'whirl', x: e.x, y: e.y, r: 92, a: f.facing, color: '#ff9ab0', life: 0.3, w: 8 });
          f.x = p.x; f.y = p.y; f.invulnT = Math.max(f.invulnT, 0.15);
          m.text(f.x, f.y - 50, '🪵 THẾ THÂN', '#ff9ab0', 14);
          f.act(0.12, { move: 0 });
        },
        use(f, m) { f.ws.prev = { x: f.x, y: f.y }; f.ws.backT = f.T('ryoma_6a') ? 1.1 : 0; f.startDash({ angle: f.castAngle, dist: 130, dur: 0.15, invuln: true }); f.act(0.2, { move: 0 }); } },
      D: { name: 'Kiếm Khí', cd: 1, desc: 'Chỉ dùng được sau Combo: chém ra 1 luồng kiếm khí xuyên thấu, PHÁ ĐẠN của đối thủ.',
        ai: { type: 'atk', min: 60, max: 430, pri: 2.6 },
        can(f) { return f.ws.wave > 0; },
        use(f, m) {
          f.ws.wave = 0;
          const fast = f.T('ryoma_3b'), sp = fast ? 1080 : 720, tri = f.T('ryoma_12a');
          const hit = Object.assign({ dmg: tri ? 5 : 6, kb: 115, kg: 4, tag: 'D' }, tri ? { silence: 1.5 } : fast ? { silence: 1 } : {});
          f.act(0.25, { move: 0.3, anim: 'swing', atk: true }, [[0.06, () => {
            const a = aimOr(f, m, 460, sp);
            for (const o of (tri ? [-0.28, 0, 0.28] : [0])) shoot(f, m, a + o, { speed: sp, r: 26, range: 470, kind: 'wave', color: '#ff9ab0', pierce: true, breaker: true, hit });
          }]]);
        } },
      U: { name: 'Vô Ảnh Trảm', desc: 'Kích hoạt khi đủ 5 Combo: liên tục dịch chuyển chém quanh kẻ địch 5 lần rồi tung nhát chém kết liễu cực mạnh.',
        ai: { type: 'atk', max: 400, pri: 6 },
        use(f, m) {
          f.ws.combos = 0;
          const t = m.nearestEnemy(f);
          f.invulnT = Math.max(f.invulnT, 1.8);
          if (f.T('ryoma_9b')) { for (const e of m.enemiesOf(f)) e.addStatus('root', 1); m.text(f.x, f.y - 76, 'NHẤT KIẾM ĐỊNH ÂM!', '#ff9ab0', 18); }
          const ev = [];
          for (let i = 0; i < 5; i++) ev.push([0.05 + i * 0.22, () => {
            if (t && !t.dead && !t.falling) {
              const a = rand(0, TAU), p = m.arena.clamp({ x: t.x + Math.cos(a) * 55, y: t.y + Math.sin(a) * 55 }, f.r);
              m.fx({ type: 'line', x1: f.x, y1: f.y, x2: p.x, y2: p.y, color: '#ff9ab0', life: 0.25, w: 3 });
              f.x = p.x; f.y = p.y; f.facing = angTo(f, t);
              m.applyHit(f, t, { dmg: 3.5, kb: 30, kg: 0, tag: 'U', hitstun: 0.3 });
              m.fx({ type: 'arc', x: t.x, y: t.y, r: 40, a: rand(0, TAU), arc: 2.5, color: '#ffd0e0', life: 0.2, w: 5 });
            }
          }]);
          ev.push([1.3, () => {
            m.hitCircle(f, { r: 115, dmg: 12, kb: 220, kg: 7, stun: 0.3, tag: 'U' });
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 115, color: '#ff5a7a', life: 0.45, w: 12 }); m.shake(14);
          }]);
          f.act(1.5, { move: 0, anim: 'spin', atk: true }, ev);
        } },
    },
  },

  // ================= KIẾM DÀI =================
  kiem_dai: {
    name: 'Kiếm Dài', icon: '🗡️', color: '#ffd24a', weight: 1.45, speed: 0.96, gfx: 'greatsword',
    role: 'Cận chiến tầm xa • Uy lực', ai: { range: 135, defend: ['C'] },
    passive: { name: 'Điểm Ngọt', desc: 'Đánh trúng bằng mũi kiếm (20% ngoài cùng tầm đánh): lực văng x2 và CHOÁNG nhẹ. Trúng bằng phần cán (đứng quá gần): lực văng giảm 50%. Kháng đẩy cao nhất game.' },
    init(f) { f.ws.emp = 0; f.ws.backA = 0; f.ws.carry = null; },
    resource(f) { return (f.ws.emp > 0 ? '⚡ CƯỜNG HÓA' : '') + (f.ws.backA > 0 ? ' • ↯ A: QUÉT NGƯỢC' : ''); },
    update(f, m, dt) {
      if (f.ws.emp > 0) f.ws.emp = Math.max(0, f.ws.emp - dt);
      if (f.ws.backA > 0) f.ws.backA -= dt;
      if (f.T('gideon_12b')) f.frameSpeed *= 1.3;
      if (f.ws.carry && !f.dash) spearRelease(f, m);
    },
    // Khiên Kiếm Đỡ Gạt: chặn 1 đòn và hất kẻ tấn công ra đúng Điểm Ngọt
    onIncoming(f, att, hit, m) {
      if (!(f.ws.gg > m.time) || !att || att.isEnv || att === f) return true;
      f.ws.gg = 0; f.action = null; f.invulnT = Math.max(f.invulnT, 0.3);
      const o = att.owner || att;
      m.text(f.x, f.y - 52, '⚔️ ĐỠ GẠT!', '#ffe9a0', 18); m.sfx('sword_clash', { rate: 0.9 });
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 60, color: '#ffe9a0', life: 0.3, w: 6 });
      if (o.alive && dist(f, o) < 260) m.applyHit(f, o, { dmg: 3, tag: 'D', stun: 0.35, dist: dist(f, o), angle: angTo(f, o) });
      return false;
    },
    onDeal(f, t, hit, info, m) {
      if (hit.tag === 'D') {
        info.fixedKb = Math.max(80, 155 * 0.86 - (hit.dist || 0)) * KB_FRICTION * m.arena.fric;
        if (f.T('gideon_3b')) { info.fixedKb *= 2; info.extra.push(() => t.addStatus('silence', 1)); }
        return;
      }
      if (!hit.range || (hit.tag !== 'A' && hit.tag !== 'B')) return;
      const ratio = hit.dist / hit.range, all = f.T('gideon_12b');
      if (all || ratio >= (f.T('gideon_1a') ? 0.68 : 0.78)) {
        info.kbMult *= f.T('gideon_9c') && t.percent > 80 ? 3 : 2;
        info.extra.push(() => t.addStatus('stun', 0.3));
        if (f.T('gideon_6c')) info.extra.push(() => { t.addStatus('slow', 1.5, 0.4); t.addStatus('nodash', 1.5); });
        if (hit.tag === 'B') {
          const nail = f.T('gideon_3a');
          info.delayKnock = nail ? 0.9 : 0.5; info.extra.push(() => t.addStatus('root', nail ? 1.25 : 0.5));
        }
        if (!hit.quiet) { m.text(t.x, t.y - 52, 'ĐIỂM NGỌT!', '#ffd24a', 19); m.fx({ type: 'ring', x: t.x, y: t.y, r: 34, color: '#fff2a0', life: 0.3, w: 5 }); }
      } else if (ratio < 0.38) {
        info.kbMult *= 0.5; m.text(t.x, t.y - 44, 'cán kiếm', '#bbbbbb', 13);
      }
    },
    skills: {
      A: { name: 'Quét Ngang', cd: 1.1, desc: 'Đánh tích: vung kiếm 180° phía trước (gồng 0.3s trước khi chém). Kiểm soát hai bên hông.',
        ai: { type: 'atk', min: 50, max: 160, pri: 2.4, when: (f, t) => f.ws.emp > 0 || dist(f, t) > 95 || Math.random() < 0.35 },
        // Quét Ngược Trừng Phạt: vung ngược lại kéo địch vào gần
        recast(f) { return f.T('gideon_6a') && f.ws.backA > 0; },
        recastAi: (f, t, m, d) => d > 120 && d < 175,
        recastUse(f, m) {
          f.ws.backA = 0;
          f.act(0.3, { move: 0.2, anim: 'swing', atk: true }, [[0.06, () => {
            const hs = m.hitArc(f, { range: 165, arc: 190, dmg: 6, noKnock: true, tag: 'A', fxColor: '#fff2a0' });
            for (const e of hs) pullTo(f, e, 135, 700, 0.3);
          }]]);
        },
        use(f, m) {
          const emp = f.ws.emp > 0; f.ws.emp = 0;
          const w = (emp ? 0.03 : f.T('gideon_1b') ? 0.15 : 0.3) * (f.T('gideon_12b') ? 0.7 : 1), R = 158 * (emp ? 1.25 : 1);
          f.act(w + 0.35, { move: 0.2, anim: 'swing', atk: true, windup: w }, [[w, () => {
            m.hitArc(f, { range: R, arc: 180, dmg: 10.5, kb: 108, kg: 6, tag: 'A' });
            if (emp) swordWave(f, m, R);
            if (f.T('gideon_6a')) f.ws.backA = 1.1;
          }]]);
        } },
      B: { name: 'Bổ Dọc', cd: 1.6, desc: 'Kết liễu: đập kiếm xuống theo đường thẳng — tầm xa nhất. Trúng Điểm Ngọt: đóng đinh (TRÓI CHÂN 0.5s) rồi mới văng.',
        ai: { type: 'atk', min: 90, max: 198, pri: 2.6 },
        use(f, m) {
          const emp = f.ws.emp > 0; f.ws.emp = 0;
          const w = (emp ? 0.03 : 0.3) * (f.T('gideon_12b') ? 0.7 : 1), L = 198 * (emp ? 1.25 : 1);
          f.act(w + 0.38, { move: 0.1, anim: 'raise', atk: true, windup: w }, [[w, () => {
            m.hitLine(f, { len: L, w: 38, dmg: 13, kb: 135, kg: 7.3, tag: 'B' });
            if (emp) swordWave(f, m, L);
            const e = fromAng(f.facing, L * 0.9); m.fx({ type: 'ring', x: f.x + e.x, y: f.y + e.y, r: 30, color: '#ffe9a0', life: 0.3, w: 6 }); m.shake(4);
          }]]);
        } },
      D: { name: 'Cán Kiếm', cd: 3.5, desc: 'Đặc kỹ chỉnh cự ly: húc cán kiếm (tầm cực gần), đẩy địch ra đúng tầm Điểm Ngọt và làm choáng ngắn — mở đường cho Bổ Dọc.',
        ai: { type: 'atk', max: 72, pri: 3.4, when: (f, t) => !f.T('gideon_6b') || (t.action && t.action.atk) },
        use(f, m) {
          if (f.T('gideon_6b')) {
            f.ws.gg = m.time + 0.9;
            f.act(0.9, { move: 0.15, anim: 'guard', onEnd: () => { f.ws.gg = 0; } });
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 34, color: '#ffe9a0', life: 0.3, w: 4 });
            return;
          }
          f.act(0.26, { move: 0.2, anim: 'thrust', atk: true }, [[0.07, () => m.hitArc(f, { range: 66, arc: 130, dmg: 4, kb: 0, kg: 0, stun: 0.45, tag: 'D' })]]);
        } },
      C: { name: 'Thế Thủ Tụ Lực', cd: 6.5, hold: 2, desc: 'Thủ: gồng tối đa 2s với THÂN THỂ THÉP — giảm 55% điểm văng & lực đẩy nhận vào, KHÔNG THỂ CẢN PHÁ (không bị ngắt bởi khống chế). Thả ra: đòn A/B kế tiếp được cường hóa (tầm +25%, ra đòn ngay lập tức).',
        ai: { type: 'def', max: 220 },
        // Cự Kiếm Xung Trận: đang gồng thì lao về trước ủi địch vào tường
        recast(f) { return f.T('gideon_12a') && f.has('stance'); }, recastBusy: true,
        recastAi: (f, t, m, d) => d < 250 && Math.abs(angDiff(f.facing, angTo(f, t))) < 0.5 && f.has('stance') && f.has('stance').t < f.has('stance').max - 0.35,
        recastUse(f, m) {
          f.removeStatus('stance'); f.removeStatus('ironbody'); f.removeStatus('unstoppable'); f.action = null; f.ws.emp = 3;
          const t = m.nearestEnemy(f); if (t) f.facing = angTo(f, t);
          f.act(0.4, { move: 0, anim: 'thrust', atk: true, super: true });
          f.startDash({ angle: f.facing, dist: 270, dur: 0.32, trail: true,
            onContact: (e) => {
              if (!f.ws.carry && m.applyHit(f, e, { dmg: 5, noKnock: true, tag: 'B' }) && !e.has('unstoppable') && !e.superArmor) { f.ws.carry = e; e.carry = { by: f, t: 0.5 }; e.action = null; e.cancelDash(); }
              return false;
            },
            onEnd: () => spearRelease(f, m) });
          m.text(f.x, f.y - 56, '🗡️ XUNG TRẬN!', '#ffd24a', 16);
        },
        use(f, m) {
          const hold = f.brain ? f.brain.holdTime(2, f) : 1;
          f.addStatus('stance', hold); f.addStatus('ironbody', hold); f.addStatus('unstoppable', hold);
          f.act(hold, { move: 0.15, anim: 'guard', super: true, charge: hold, onEnd: () => { f.removeStatus('stance'); f.removeStatus('ironbody'); f.removeStatus('unstoppable'); f.ws.emp = 3; } });
        } },
      U: { name: 'Khai Thiên Lập Địa', desc: 'Nhảy lên cao và cắm kiếm xuống đất tạo chấn động toàn bản đồ: hất tung mọi kẻ địch đang đứng trên mặt đất, càng gần tâm càng văng xa.',
        ai: { type: 'atk', max: 420, pri: 5 },
        use(f, m) {
          f.vz = 620; f.z = 1; f.invulnT = Math.max(f.invulnT, 1.0);
          f.act(1.0, { move: 0, anim: 'raise', atk: true }, [[0.82, () => {
            for (const t of m.enemiesOf(f)) {
              if (t.z > 0 || t.respawnT > 0) continue;
              const d = dist(f, t), k = clamp(1 - d / 820, 0, 1);
              m.applyHit(f, t, { dmg: 6 + 10 * k, kb: 140 + 380 * k, kg: 5, knockup: 420, tag: 'U', angle: angTo(f, t), stun: f.T('gideon_9b') ? 1.5 : 0 });
            }
            m.shake(26); m.sfx('boom_big');
            for (let i = 0; i < 3; i++) m.fx({ type: 'ring', x: f.x, y: f.y, r: 250 + i * 260, color: '#ffd24a', life: 0.6 + i * 0.15, w: 10 - i * 3 });
          }]]);
        } },
    },
  },

  // ================= SÚNG LỤC =================
  sung: {
    name: 'Súng Lục Tự Động', icon: '🔫', color: '#9aa0a8', weight: 1.0, speed: 1.0, gfx: 'pistol',
    role: 'Tầm xa • Hiện đại', ai: { range: 280, defend: ['C'], ranged: true },
    passive: { name: 'Vũ Trang Hiện Đại', desc: 'Đạn súng mạnh hơn các vũ khí tầm xa khác (nhưng thua cận chiến). Băng đạn 9 viên, hết đạn phải nạp lại 6s.' },
    init(f) { f.ws.mag = f.T('zero_12b') ? 18 : 9; f.ws.ammo = f.ws.mag; f.ws.reload = 0; f.ws.boom = 0; f.ws.empC = false; f.ws.marked = null; },
    resource(f) {
      const a = f.ws.reload > 0 ? `Nạp đạn ${f.ws.reload.toFixed(1)}s` : `Đạn ${f.ws.ammo}/${f.ws.mag}` + (f.ws.boom ? ' 💥' : '');
      return a + (f.ws.empC ? ' • C cường hóa' : '');
    },
    update(f, m, dt) { if (f.ws.reload > 0) { f.ws.reload -= dt; if (f.ws.reload <= 0) { f.ws.ammo = f.ws.mag; f.ws.reload = 0; m.sfx('gun_reload'); } } },
    onDeal(f, t, hit, info, m) {
      const g = t.gunMark;
      if (g && g.owner === f) {
        // Triệt Tiêu Hoàn Toàn: mục tiêu bị khóa nhận thêm 30% lực đẩy
        if (f.T('zero_12c')) info.kbMult *= 1.3;
        g.hits++;
        if (g.hits >= (g.need || 5)) { t.gunMark = null; f.ws.empC = true; m.text(f.x, f.y - 50, 'C CƯỜNG HÓA!', '#ffe066', 16); }
      }
    },
    // Phản Xạ Điệp Viên: bị đánh sau lưng → tự lướt né (hồi 15s)
    onIncoming(f, att, hit, m) {
      if (!f.T('zero_6c') || !att || att.isEnv || hit.quiet || m.time < (f.ws.spyCd || 0)) return true;
      if (!behind(f, hit.src || att)) return true;
      f.ws.spyCd = m.time + 15;
      f.action = null; f.hitstun = 0;
      f.startDash({ angle: escapeAngle(f, att.owner || att, m), dist: 130, dur: 0.14, invuln: true, trail: true });
      m.text(f.x, f.y - 50, '🕴️ PHẢN XẠ!', '#cfd8e0', 15);
      return false;
    },
    skills: {
      A: { name: 'Phát Bắn', cd: 0.9, desc: 'Đánh tích: bắn 1 viên đạn tự ngắm.',
        ai: { type: 'atk', min: 40, max: 520, pri: 2 },
        can(f) { return f.ws.ammo > 0 && f.ws.reload <= 0; },
        use(f, m) {
          const sp = f.T('zero_1c') ? 1725 : 1150;
          f.act(f.T('zero_12b') ? 0.12 : 0.2, { move: 0.8, anim: 'aim', atk: true }, [[0.04, () => bullet(f, m, aimOr(f, m, 560, sp), 'A', { speed: sp })]]);
        } },
      B: { name: 'Xả Băng', cd: 1, desc: 'Kết liễu: xả toàn bộ băng đạn cực nhanh.',
        ai: { type: 'atk', min: 30, max: 340, pri: 2.4, when: (f) => f.ws.ammo >= 4 },
        can(f) { return f.ws.ammo > 0 && f.ws.reload <= 0; },
        use(f, m) {
          const n = f.ws.ammo, ev = [], fan = f.T('zero_6a'), gap = f.T('zero_12b') ? 0.035 : 0.07;
          const a0 = aimOr(f, m, 560, 1150);
          for (let i = 0; i < n; i++) ev.push([0.03 + i * (fan ? 0.02 : gap), () => {
            if (f.ws.ammo <= 0) return;
            // Đạn Chùm Càn Quét: tỏa đều trong hình quạt 120°
            const a = fan ? a0 - 1.05 + (n > 1 ? 2.1 * i / (n - 1) : 1.05) : aimOr(f, m, 560, 1150) + rand(-0.13, 0.13);
            bullet(f, m, a, 'B', i === n - 1 && f.T('zero_3b') ? { stun: 1 } : null);
          }]);
          f.act((fan ? 0.02 : gap) * n + 0.12, { move: 0.4, anim: 'aim', atk: true }, ev);
        } },
      C: { name: 'Nhảy Lùi', cd: 4, desc: 'Nhảy lùi đoạn ngắn, tăng tốc và Thiết Thân (giảm lực đẩy, không bị ngắt) trong 1s. Khi cường hóa: lướt xa tức thì và nạp đầy đạn.',
        ai: { type: 'def', max: 180, mob: 'escape' },
        use(f, m) {
          if (f.T('zero_3c')) {
            f.addStatus('untargetable', 1.5);
            m.zone({ owner: f, x: f.x, y: f.y, r: 85, life: 1.5, every: 9, kind: 'smoke', color: 'rgba(150,150,160,0.4)' });
          }
          if (f.ws.empC) {
            f.ws.empC = false; f.ws.ammo = f.ws.mag; f.ws.reload = 0;
            if (f.T('zero_9b')) f.ws.fastRl = 2;
            const t = m.nearestEnemy(f);
            // Dịch Chuyển Ám Sát: ra sau lưng mục tiêu và tự xả 3 viên
            if (f.T('zero_12a') && t && dist(f, t) < 600) {
              blinkBehind(f, t, m);
              for (let i = 0; i < 3; i++) m.later(0.08 + i * 0.07, () => { if (f.alive && t.alive) shoot(f, m, angTo(f, t) + rand(-0.05, 0.05), { speed: 1300, r: 5, range: 400, kind: 'bullet', color: '#ffe9a0', hit: { dmg: 5, kb: 95, kg: 4, tag: 'C' } }); });
              m.text(f.x, f.y - 40, '🕴️ ÁM SÁT!', '#ffe066', 15);
            } else {
              f.startDash({ angle: f.castAngle, dist: 220, dur: 0.12, invuln: true });
              m.text(f.x, f.y - 40, 'NẠP ĐẦY!', '#ffe066', 15);
            }
          } else {
            const t = m.nearestEnemy(f);
            f.startDash({ angle: t ? escapeAngle(f, t, m) : f.facing + Math.PI, dist: 115, dur: 0.18 });
          }
          f.addStatus('haste', 1, 0.35); f.addStatus('ironbody', f.T('zero_1b') ? 1.75 : 1);
          f.act(0.2, { move: 0 });
        } },
      D: { name: 'Khóa Mục Tiêu', cd: 6, desc: 'Đánh dấu mục tiêu. Bắn trúng mục tiêu 5 lần: chiêu C kế tiếp được cường hóa (lướt tức thì + nạp đầy đạn).',
        ai: { type: 'buff', min: 0, max: 540, pri: 2.8, when: (f, t) => !(t.gunMark && t.gunMark.owner === f) && !f.ws.empC },
        can(f, m) { return !!m.autoTarget(f, 560); },
        // Kích Nổ Dấu Ấn: bấm D lần nữa khi mục tiêu đang bị khóa
        recast(f) { const t = f.ws.marked; return f.T('zero_6b') && !!t && t.alive && !!t.gunMark && t.gunMark.owner === f; },
        recastAi: (f, t, m) => m.arena.edgeDist(t.x, t.y) < 200 || (t.gunMark && t.gunMark.t < 2.5) || (t.action && t.action.charge),
        recastUse(f, m) {
          const t = f.ws.marked; f.ws.marked = null; t.gunMark = null;
          m.applyHit(f, t, { dmg: 5, kb: 210, kg: 5.5, silence: 1.5, tag: 'D', angle: angTo(f, t) });
          m.fx({ type: 'boom', x: t.x, y: t.y, r: 60, color: '#ff4a4a', life: 0.35 }); m.sfx('boom_small');
          m.text(t.x, t.y - 60, '🎯 KÍCH NỔ!', '#ff6a6a', 17);
        },
        use(f, m) {
          const t = m.autoTarget(f, 560);
          if (!t) return;
          t.gunMark = { owner: f, hits: 0, t: 8, need: f.T('zero_3a') ? 4 : 5 };
          f.ws.marked = t;
          m.fx({ type: 'ring', x: t.x, y: t.y, r: 36, color: '#ff4a4a', life: 0.5, w: 3 });
          m.sfx('target_lock');
        } },
      U: { name: 'Băng Đạn Nổ', desc: 'Nạp ngay một băng đạn nổ: mỗi viên mạnh hơn và phát nổ khi trúng.',
        ai: { type: 'buff', max: 500 },
        use(f, m) { f.ws.ammo = f.ws.mag; f.ws.reload = 0; f.ws.boom = f.ws.mag; m.text(f.x, f.y - 50, 'ĐẠN NỔ!', '#ff8a3a', 18); } },
    },
  },

  // ================= NỎ =================
  no: {
    name: 'Nỏ', icon: '🎯', color: '#4ae0d0', weight: 0.9, speed: 1.21, gfx: 'crossbow',
    role: 'Tầm xa • Dồn sát thương', ai: { range: 240, defend: ['C'], ranged: true },
    passive: { name: 'Dồn Dập', desc: 'Sát thương cơ bản rất yếu nhưng chạy nhanh hơn. Đánh trúng liên tục tăng 20% sát thương mỗi tầng (tối đa 8); mất hết nếu không trúng trong 2s.' },
    init(f) { f.ws.stacks = 0; f.ws.lastHit = 9; f.ws.turret = null; f.ws.droneT = 0; f.ws.droneAcc = 0; },
    resource(f) { return `Dồn dập x${f.ws.stacks}` + (f.ws.turret ? ` • Trụ ${(5 - f.ws.turret.t).toFixed(1)}s` : '') + (f.ws.droneT > 0 ? ' • 🛸 Drone' : ''); },
    update(f, m, dt) {
      f.ws.lastHit += dt;
      if (f.ws.lastHit > (f.T('percy_6c') ? 4 : f.T('percy_1a') ? 3.5 : 2)) f.ws.stacks = 0;
      // Drone Phòng Vệ: bắn hạ đạn đang bay thẳng vào Percy
      if (f.ws.droneT > 0) {
        f.ws.droneT -= dt; f.ws.droneAcc += dt;
        if (f.ws.droneAcc >= 0.22) {
          let best = null, bd = 170;
          for (const p of m.projs) {
            if (p.dead || p.owner.team === f.team || p.breaker) continue;
            const d = Math.hypot(p.x - f.x, p.y - f.y);
            if (d < bd && (p.vx * (f.x - p.x) + p.vy * (f.y - p.y)) > 0) { bd = d; best = p; }
          }
          if (best) {
            f.ws.droneAcc = 0; best.dead = true;
            m.fx({ type: 'line', x1: f.x, y1: f.y - f.r - 30, x2: best.x, y2: best.y, color: '#9ff', life: 0.15, w: 2 });
            m.particle(best.x, best.y, { color: '#cff', life: 0.3, size: 4, vx: 0, vy: 0 });
          }
        }
      }
      const tu = f.ws.turret;
      if (tu) {
        tu.t += dt; tu.acc += dt;
        const mobile = f.T('percy_12c:gatling');
        if (mobile) f.frameSpeed *= 0.75;
        const moved = !mobile && (f.moveDir.x || f.moveDir.y) && !f.dash;
        const oh = f.T('percy_12c:overheat');
        const stop = tu.t >= (oh ? 12 : 5) || f.dead || f.falling || f.has('stun') || moved;
        if (stop) {
          f.ws.turret = null; f.cd.D = f.cdOf('D');
          // Ụ Súng Gia Cố: trận địa vẫn bắn thêm 2s ở chỗ cũ
          if (moved && f.T('percy_3b')) {
            m.zone({ owner: f, x: f.x, y: f.y, r: 26, life: 2, every: 0.125, kind: 'turret', color: 'rgba(74,224,208,0.35)',
              tick: (mm, z) => turretVolley(f, mm, z) });
            m.text(f.x, f.y - 40, 'Trận địa tự động!', '#4ae0d0', 13);
          }
          return;
        }
        // Quá Tải Nhiệt Lượng: càng sấy lâu càng bắn nhanh & mạnh (tối đa +60% sau 3s)
        const heat = oh ? 1 + 0.6 * Math.min(1, tu.t / 3) : 1, iv = 0.125 / heat;
        while (tu.acc >= iv) {
          tu.acc -= iv; const a = turretVolley(f, m, f, heat);
          // Nỏ Phản Lực: mỗi loạt giật Percy trôi lùi ngược hướng bắn
          if (a != null && f.T('percy_12c:recoil')) {
            const nx = f.x - Math.cos(a) * 5, ny = f.y - Math.sin(a) * 5;
            if (m.arena.edgeDist(nx, ny) > 34 || m.arena.edgeDist(nx, ny) > m.arena.edgeDist(f.x, f.y)) { f.x = nx; f.y = ny; }
          }
        }
        if (oh && tu.t > 3 && Math.random() < dt * 4) m.particle(f.x, f.y - 10, { color: '#ff8a3a', life: 0.4, size: 4, vx: rand(-30, 30), vy: -60 });
      }
    },
    onDeal(f, t, hit, info) { info.mult *= 1 + 0.2 * f.ws.stacks; },
    afterDeal(f) { f.ws.stacks = Math.min(8, f.ws.stacks + 1); f.ws.lastHit = 0; },
    skills: {
      A: { name: 'Tên Nỏ', cd: 0.5, desc: 'Đánh tích: bắn 1 mũi tên nỏ tự ngắm, dồn tầng Dồn Dập.',
        ai: { type: 'atk', min: 40, max: 460, pri: 2 },
        use(f, m) {
          const xp = f.T('percy_12b');
          f.act(0.16, { move: 0.85, anim: 'aim', atk: true }, [[0.04, () => {
            const R = f.T('percy_1b') ? 600 : 480, a = aimOr(f, m, R, 950);
            for (const o of (f.has('multishot') ? [-0.12, 0, 0.12] : [0]))
              shoot(f, m, a + o, { speed: 950, r: xp ? 6 : 4, range: R, kind: 'bolt', color: xp ? '#eaffff' : '#bff', pierce: xp, ghost: xp, hit: { dmg: 3.3, kb: (xp ? 95 : 55) * (f.T('percy_12c:recoil') ? 2 : 1), kg: 2.6, tag: 'A' } });
          }]]);
        } },
      D: { name: 'Trận Địa Nỏ', cd: 3, manualCd: true, desc: 'Đặc kỹ: ĐỨNG YÊN, mở vùng tự động bắn mọi kẻ thù trong vùng mỗi 0.125s (tối đa 5s). Di chuyển để kết thúc. Chỉ hồi chiêu khi kết thúc.',
        ai: { type: 'atk', min: 120, max: 320, pri: 3, when: (f, t, m) => m.arena.edgeDist(f.x, f.y) > 70 },
        can(f) { return !f.ws.turret; },
        // Phát Bắn Bùng Nổ: phát pháo cuối nổ đẩy lùi, lực giật đẩy Percy lùi và thả khói
        recast(f) { return f.T('percy_6a') && !!f.ws.turret; },
        recastAi: (f, t, m, d) => d < 210 || f.ws.turret.t > 4.4,
        recastUse(f, m) {
          f.ws.turret = null; f.cd.D = f.cdOf('D');
          const t = m.nearestEnemy(f); if (t) f.facing = angTo(f, t);
          m.hitArc(f, { range: 230, arc: 80, dmg: 9, kb: 255, kg: 7.5, tag: 'D' });
          m.fx({ type: 'boom', x: f.x + Math.cos(f.facing) * 90, y: f.y + Math.sin(f.facing) * 90, r: 80, color: '#4ae0d0', life: 0.35 });
          f.startDash({ angle: f.facing + Math.PI, dist: 120, dur: 0.2 });
          f.addStatus('untargetable', 1.2);
          m.zone({ owner: f, x: f.x, y: f.y, r: 90, life: 1.4, every: 9, kind: 'smoke', color: 'rgba(150,150,160,0.4)' });
          m.sfx('explosion', { vol: 0.7 }); m.shake(8); m.text(f.x, f.y - 56, '💥 BÙNG NỔ!', '#4ae0d0', 17);
        },
        use(f, m) { f.ws.turret = { t: 0, acc: 0 }; f.cd.D = 99; if (!f.T('percy_12c:gatling')) f.moveDir = { x: 0, y: 0 }; m.sfx('gatling'); } },
      C: { name: 'Lướt Chiến Thuật', cd: 5, desc: 'Lướt theo hướng chỉ định — có thể dùng khi đang mở Trận Địa để dời vị trí trận địa.',
        ai: { type: 'def', max: 170, mob: 'escape' },
        use(f, m) { f.startDash({ angle: f.castAngle, dist: 165, dur: 0.18, invuln: true }); if (f.T('percy_12a')) { f.ws.droneT = 3; m.text(f.x, f.y - 50, '🛸 DRONE', '#9ff', 13); } } },
      B: { name: 'Móc & Đạp', cd: 6.5, desc: 'Kết liễu: bắn dây móc kéo đối thủ về sát người (CHOÁNG 0.75s) rồi đạp một cú văng cực mạnh. Dùng được khi đang mở Trận Địa.',
        ai: { type: 'atk', min: 200, max: 430, pri: 2.7 },
        use(f, m) {
          // Lưới Điện Trói Buộc: trói chân + cấm lướt, không kéo lại
          if (f.T('percy_6b')) {
            shoot(f, m, aimOr(f, m, 470, 900), { speed: 900, r: 12, range: 470, kind: 'net', color: '#9ff', hit: { dmg: 4, kb: 30, kg: 1, root: 1.5, tag: 'B' },
              onHit: (mm, p, t) => { t.addStatus('nodash', 3); mm.text(t.x, t.y - 56, '🕸️ LƯỚI ĐIỆN', '#9ff', 15); if (f.T('percy_9c')) t._percyD = mm.time + 3; } });
            if (!f.ws.turret) f.act(0.15, { move: 0.5, anim: 'aim' });
            return;
          }
          shoot(f, m, aimOr(f, m, 440, 850), { speed: 850, r: 7, range: 440, kind: 'hook', color: '#ffe', hit: null,
            onHit: (mm, p, t) => {
              const moving = t.dash || t.z > 0 || t.hover > 0 || t.has('haste');
              if (mm.applyHit(f, t, { dmg: 3, noKnock: true, tag: 'B' })) {
                if (!t.has('unstoppable')) { t.pull = { by: f, stop: 60, speed: 1050, t: 0.5 }; t.action = null; }
                // đạp văng khi kéo tới nơi
                mm.later(0.42, () => { if (f.alive && t.alive && dist(f, t) < 150) { t.pull = null; mm.applyHit(f, t, { dmg: 5.5, kb: 165, kg: 6.8, tag: 'B', angle: angTo(f, t) }); mm.sfx && mm.sfx('impact'); } });
                t.addStatus('stun', 0.75);
                if (f.T('percy_3a') && moving) { t.addStatus('stun', 1); t.addStatus('silence', 2); mm.text(t.x, t.y - 56, '⚡ ĐIỆN CAO THẾ!', '#9ff', 16); }
                if (f.T('percy_9c')) t._percyD = mm.time + 3;
              }
              return true;
            } });
          if (!f.ws.turret) f.act(0.15, { move: 0.5, anim: 'aim' });
        } },
      U: { name: 'Liên Châu', desc: 'Trong 3s mỗi lần bắn A và Trận Địa Nỏ sẽ bắn ra 3 mũi tên thay vì 1.',
        ai: { type: 'buff', max: 450 },
        use(f, m) { f.addStatus('multishot', 3); m.text(f.x, f.y - 50, 'LIÊN CHÂU!', '#ffb84a', 18); } },
    },
  },
};

// --- Hàm chiêu thức dùng chung ---
// Mũi Tên Hư Không (Elara Lv12): hố đen bay chậm hút kẻ địch quanh đường bay rồi nổ
function voidArrow(f, m, a, h) {
  const p = shoot(f, m, a, { speed: 420, r: 16, range: 630, kind: 'void', color: '#7a4aff', pierce: true, ghost: true, hit: { dmg: 1.2, noKnock: true, tag: 'B', quiet: true },
    onEnd: (mm, pp) => { explode(f, mm, pp.x, pp.y, 115, h); mm.fx({ type: 'ring', x: pp.x, y: pp.y, r: 130, color: '#a07aff', life: 0.4, w: 8 }); } });
  m.zone({ owner: f, x: p.x, y: p.y, r: 1, life: 1.6, every: 0.05, kind: 'void', color: 'rgba(0,0,0,0)', tick: (mm, z) => {
    if (p.dead) { z.t = z.life; return; }
    z.x = p.x; z.y = p.y;
    for (const e of mm.enemiesOf(f)) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < 175 && d > 10 && !e.has('unstoppable')) { const k = Math.min(d - 8, 15); e.x += (p.x - e.x) / d * k; e.y += (p.y - e.y) / d * k; e.addStatus('slow', 0.2, 0.5); }
    }
  } });
}
// Hố Đen Tro Tàn (Ignatius Lv12): hút vào tâm 0.8s rồi nổ
function ashHole(f, m, x, y, er, h) {
  m.fx({ type: 'ring', x, y, r: 240, color: '#7a4aff', life: 0.8, w: 6 });
  m.text(x, y - 40, '🕳️ HỐ ĐEN', '#b09aff', 15);
  m.zone({ owner: f, x, y, r: 55, life: 0.8, every: 0.05, kind: 'void', color: 'rgba(40,10,70,0.4)', tick: (mm) => {
    for (const e of mm.enemiesOf(f)) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < 245 && d > 10 && !e.has('unstoppable')) { const k = Math.min(d - 8, 17); e.x += (x - e.x) / d * k; e.y += (y - e.y) / d * k; }
    }
  } });
  m.later(0.8, () => explode(f, m, x, y, er * 1.15, h));
}
// đập/hút kẻ địch về phía f (đến khoảng cách stop)
function pullTo(f, e, stop, speed = 800, t = 0.35) {
  if (!e.alive || e.has('unstoppable') || e.has('immortal') || e.superArmor) return;
  e.pull = { by: f, stop, speed, t }; e.action = null; e.cancelDash();
}
function explode(f, m, x, y, r, hit) {
  m.hitCircle(f, Object.assign({ x, y, r }, hit));
  m.fx({ type: 'boom', x, y, r, color: '#ff7a2a', life: 0.4 });
  m.sfx(r >= 140 ? 'boom_big' : 'boom_small', { vol: r >= 140 ? 1 : 0.7 });
  m.shake(r / 25);
}
function lunge(f, m, a, d, tag, twice) {
  f.act(0.3, { move: 0, anim: 'thrust', atk: true });
  f.startDash({ angle: a, dist: d, dur: 0.22, stopAtEdge: true, trail: true,
    onContact: (e) => {
      // Song Kiếm Quý Tộc: kiếm phụ đâm thêm nhát thứ hai
      if (twice) { m.applyHit(f, e, { dmg: 4.5, kb: 40, kg: 1.2, tag, angle: a, hitstun: 0.15 }); m.later(0.1, () => { if (e.alive) m.applyHit(f, e, { dmg: 5.5, kb: 165, kg: 6.2, tag, angle: a }); }); }
      else m.applyHit(f, e, { dmg: 9.2, kb: 175, kg: 6.6, tag, angle: a });
      return true;
    } });
}
// Rapier: phá 1 ấn (defer: mảng hiệu ứng chạy sau đòn đánh, null = chạy ngay)
function breakMark(f, t, idx, m, defer) {
  const mk = t.marks;
  if (!mk || mk.owner !== f || !mk.list[idx]) return;
  const run = (fn) => (defer ? defer.push(fn) : fn());
  const one = (i, echo) => {
    if (!mk.list[i]) return;
    mk.list[i] = false;
    for (const k of ['A', 'B', 'C', 'E']) f.cd[k] = Math.max(0, f.cd[k] - 1.5);
    run(() => t.addStatus('slow', 1.0, 0.6));
    if (f.T('florian_1b')) f.addStatus('haste', 2, 0.1);
    if (f.T('florian_3b')) run(() => t.addStatus('bleed', 3, 1));
    const p = fromAng(i * Math.PI / 2, 46);
    m.fx({ type: 'ring', x: t.x + p.x, y: t.y + p.y, r: 22, color: echo ? '#ffffff' : '#ff9ad5', life: 0.4, w: 5 });
    // Song Tấu Đối Cực: phân ảnh ánh sáng phá ấn đối diện
    if (echo) { m.fx({ type: 'ghost', x: t.x + p.x * 1.7, y: t.y + p.y * 1.7, r: f.r, color: '#ffffff', life: 0.45 }); m.fx({ type: 'thrust', x: t.x + p.x * 1.7, y: t.y + p.y * 1.7, a: i * Math.PI / 2 + Math.PI, len: 70, w: 18, color: '#ffffff', life: 0.25 }); }
  };
  one(idx, false);
  if (f.T('florian_12a:echo')) one((idx + 2) % 4, true);
  // Tử Huyệt Khóa Chân: mỗi ấn vỡ ghim kiếm ánh sáng — choáng 0.5s + 10% điểm văng
  const stig = f.T('florian_12a:stigma');
  if (stig) run(() => { t.addStatus('stun', 0.5); t.percent += 10; m.fx({ type: 'thrust', x: t.x, y: t.y - 60, a: Math.PI / 2, len: 60, w: 14, color: '#fff6c0', life: 0.3 }); });
  // chỉ cần phá 3/4 ấn là kích hoạt
  if (mk.list.filter(Boolean).length > 1) return;
  if (stig) run(() => {
    // phá đủ 4 ấn: đóng băng 1.5s rồi nổ, đẩy thẳng về mép sàn gần nhất
    t.addStatus('stun', 1.5); t.addStatus('slow', 1.5, 0.9);
    m.fx({ type: 'ring', x: t.x, y: t.y, r: 44, color: '#bfe8ff', life: 1.5, w: 10 }); m.text(t.x, t.y - 80, '❄️ TỬ HUYỆT!', '#bfe8ff', 18);
    m.later(1.5, () => { if (!t.alive || t.falling) return; const a = nearestEdgeAngle(m, t.x, t.y);
      m.applyHit(f, t, { dmg: 6, kb: 200, kg: 7, tag: 'D', angle: a }); m.fx({ type: 'boom', x: t.x, y: t.y, r: 70, color: '#ffe9ff', life: 0.35 }); m.shake(10); });
  }); else run(() => t.addStatus('stun', 1.3));
  f.ws.empNext = true;
  m.text(t.x, t.y - 60, 'PHÁ ẤN!', '#ff9ad5', 22);
  // phá ấn thành công: Florian hồi 10% điểm văng
  if (f.percent > 0) { f.percent = Math.max(0, f.percent - 5); m.text(f.x, f.y - 60, '💖 -5%', '#ffd0f0', 14); }
  // đang Nộ: tung ngay nhát đâm xuyên thủng mọi thứ
  if (f.has('swordform')) m.later(0.12, () => florianPierce(f, t, m));
  if (f.T('florian_3c')) { f.invulnT = Math.max(f.invulnT, 1); m.text(f.x, f.y - 50, '✨ BẤT TỬ 1s', '#ffffff', 14); }
  t.marks = null;
  WEAPONS.rapier.marksEnd(f, t, m);
  // Khúc Cao Trào Cuối Cùng: hồi toàn bộ chiêu
  if (f.T('florian_12c')) { for (const k in f.cd) if (k !== 'U') f.cd[k] = 0; m.text(f.x, f.y - 76, '🎻 CAO TRÀO!', '#ffe9ff', 16); }
}
// hướng tới mép sàn gần nhất từ (x, y)
function nearestEdgeAngle(m, x, y) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < 24; i++) { const a = i * TAU / 24; let s = 0; while (s < 2000 && m.arena.edgeDist(x + Math.cos(a) * s, y + Math.sin(a) * s) > 0) s += 20; if (s < bd) { bd = s; best = a; } }
  return best;
}
// Nộ Florian phá ấn: nhát đâm xuyên thủng mọi thứ (xuyên tường, khiên, mọi kẻ địch trên đường)
function florianPierce(f, t, m) {
  if (!f.alive) return;
  const a = t && t.alive ? angTo(f, t) : f.facing;
  f.facing = a;
  f.act(0.3, { move: 0, anim: 'thrust', atk: true });
  shoot(f, m, a, { speed: 1700, r: 16, range: 640, kind: 'wave', color: '#ffe9ff', pierce: true, ghost: true, breaker: true,
    hit: { dmg: 9, kb: 240, kg: 7, unblockable: true, tag: 'U' } });
  m.fx({ type: 'thrust', x: f.x, y: f.y, a, len: 260, w: 26, color: '#ffe9ff', life: 0.3 });
  m.text(f.x, f.y - 70, '🗡️ XUYÊN THỦNG!', '#ffe9ff', 19); m.shake(8); m.sfx('slash_heavy');
}
function phantom(f, m, s, a, range, tag, boom) {
  // boom (Hư Ảnh Trùng Điệp): phân ảnh phát nổ khi biến mất
  const pop = boom ? (mm, p) => {
    mm.hitCircle(f, { x: p.x, y: p.y, r: 75, dmg: 4, kb: 150, kg: 3.5, tag });
    mm.fx({ type: 'ring', x: p.x, y: p.y, r: 75, color: '#ff9ad5', life: 0.35, w: 7 });
  } : null;
  m.proj({ owner: f, x: s.x, y: s.y, angle: a, speed: 1000, r: 16, range: Math.max(40, range), kind: 'phantom', color: f.color,
    hit: tag === 'B' ? { dmg: 9.2, kb: 200, kg: 7.6, tag } : { dmg: 7.4, kb: 145, kg: 5.6, tag }, onHit: pop, onEnd: pop });
}
function placeMarks(f, t, dur) {
  t.marks = { owner: f, list: [true, true, true, true], t: dur };
}
function blinkBehind(f, t, m) {
  m.fx({ type: 'ring', x: f.x, y: f.y, r: 26, color: '#b07aff', life: 0.3, w: 3 });
  const p = m.arena.clamp({ x: t.x + Math.cos(t.facing + Math.PI) * 48, y: t.y + Math.sin(t.facing + Math.PI) * 48 }, f.r + 2);
  f.x = p.x; f.y = p.y; f.facing = angTo(f, t); f.invulnT = Math.max(f.invulnT, 0.15);
  m.fx({ type: 'ring', x: f.x, y: f.y, r: 30, color: '#b07aff', life: 0.3, w: 3 });
  f.act(0.08, { move: 0 });
}
function blinkFront(f, t, m) {
  m.fx({ type: 'ring', x: f.x, y: f.y, r: 26, color: '#b07aff', life: 0.3, w: 3 });
  const p = m.arena.clamp({ x: t.x + Math.cos(t.facing) * 46, y: t.y + Math.sin(t.facing) * 46 }, f.r + 2);
  f.x = p.x; f.y = p.y; f.facing = angTo(f, t); f.invulnT = Math.max(f.invulnT, 0.15);
  m.fx({ type: 'ring', x: f.x, y: f.y, r: 30, color: '#b07aff', life: 0.3, w: 3 });
  f.act(0.12, { move: 0 });
}
// dụ kẻ địch nhắm vào thực thể giả (ảo ảnh / phân thân): Tư duy càng cao càng ít bị lừa
function lureEnemies(owner, lures, m, dur) {
  for (const e of m.fighters) {
    if (e.team === owner.team || !e.alive) continue;
    const tl = e.brain ? e.brain.tech.tactic : 3;
    if (Math.random() < clamp(0.85 - tl * 0.055, 0.3, 0.8)) e.focus = { by: pick(lures), until: m.time + dur };
  }
}
// Ảo Ảnh Phân Thân (Vesper Lv12): 2 phân thân chạy 2 hướng
function shadowClones(f, m) {
  const L = [];
  for (const s of [-1, 1]) {
    const c = m.addMinion(new Minion(f, 'shade', f.x, f.y, f.name));
    c.ws.dir = f.facing + s * 1.15; c.life = 2.2; c.color = f.color; c.facing = c.ws.dir;
    L.push(c);
  }
  lureEnemies(f, L, m, 2.2);
  m.text(f.x, f.y - 56, '👥 PHÂN THÂN', '#b07aff', 15);
}
function bullet(f, m, a, tag, o) {
  if (f.ws.ammo <= 0) return;
  f.ws.ammo--;
  const boom = f.ws.boom > 0;
  if (boom) f.ws.boom--;
  const big = boom && f.T('zero_9a');
  shoot(f, m, a, { speed: (o && o.speed) || 1150, r: boom ? 7 : 5, range: 580, kind: 'bullet', color: boom ? '#ff8a3a' : '#ffe9a0',
    hit: Object.assign({ dmg: (boom ? 8.3 : 7.4) * (tag === 'B' ? 0.7 : 1), kb: 92, kg: 3.9, tag }, o && o.stun ? { stun: o.stun } : {}),
    onHit: boom ? (mm, p) => explode(f, mm, p.x, p.y, big ? 75 : 55, Object.assign({ dmg: 6, kb: big ? 280 : 140, kg: big ? 8 : 5.5, tag }, big ? { silence: 2 } : {})) : null });
  m.fx({ type: 'flash', x: f.x + Math.cos(a) * 28, y: f.y + Math.sin(a) * 28, r: 12, color: '#fff3a0', life: 0.08 });
  if (f.ws.ammo <= 0) {
    const fast = f.ws.fastRl > 0;
    if (fast) f.ws.fastRl--;
    f.ws.reload = (fast ? 1.5 : (f.T('zero_1a') ? 5 : 6) * f.cdMult) * (f.rlG || 1); f.ws.boom = 0;
  }
}
// Trận Địa Nỏ: một loạt tên từ vị trí src (Percy hoặc trận địa còn lại)
function turretVolley(f, m, src, heat = 1) {
  const R = turretRange(f);
  let t = null, bd = R;
  for (const e of m.enemiesOf(f)) { if (e.has('untargetable')) continue; const d = Math.hypot(e.x - src.x, e.y - src.y); if (d < bd) { bd = d; t = e; } }
  if (!t) return null;
  const sp = 950, tt = bd / sp, mv = t.canMove() && !t.busy ? t.speed : 0;
  const a = Math.atan2(t.y + t.moveDir.y * mv * tt - src.y, t.x + t.moveDir.x * mv * tt - src.x);
  const ms = f.has('multishot');
  const offs = ms && f.T('percy_9a') ? [-0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4] : ms ? [-0.12, 0, 0.12] : [0];
  const kbK = heat * (f.T && f.T('percy_12c:recoil') ? 2 : 1);
  const hit = Object.assign({ dmg: 0.72, kb: 14 * kbK, kg: 0.8 * kbK, tag: 'D', hitstun: 0.05 }, f.T('percy_3c') ? { slow: [0.4, 1] } : {});
  for (const o of offs) m.proj({ owner: f, x: src.x + Math.cos(a + o) * 22, y: src.y + Math.sin(a + o) * 22, angle: a + o, speed: sp, r: 4, range: R + 50, kind: 'bolt', color: heat > 1.3 ? '#ffc07a' : '#bff', hit });
  return a;
}
// Kiếm Dài (Trảm Khí Khai Thiên): sóng kiếm khí theo đòn cường hóa
function swordWave(f, m, R) {
  if (!f.T('gideon_9a')) return;
  shoot(f, m, f.facing, { speed: 900, r: 24, range: R * 1.5, kind: 'wave', color: '#ffe9a0', pierce: true, hit: { dmg: 7, kb: 150, kg: 5, tag: 'B' } });
}
function comboNeed(f) { return f.T && f.T('ryoma_12c') ? 3 : f.T && f.T('ryoma_9a') ? 4 : 5; }
function songNeed(f) { return f.T && f.T('aria_9a') ? 2 : 3; }
function turretRange(f) { return (f.T('percy_1b') ? 412 : 330) * (f.T('percy_12c:gatling') ? 1.3 : 1); }
function katanaCombo(f, m, pair) {
  if (f.dead || f.falling) return;
  const done = () => {
    f.cd.A = 0; f.ws.combos = Math.min(comboNeed(f), f.ws.combos + 1); f.ws.wave = 1;
    if (f.T('ryoma_6c')) f.ws.longA = true;
    m.text(f.x, f.y - 56, `COMBO ${pair}!`, '#ff9ab0', 18); m.sfx('sword_cut', { rate: 1.25 });
  };
  switch (pair) {
    case 'AA':
      f.act(0.3, { move: 0.2, anim: 'spin', atk: true }, [[0.06, () => {
        m.hitCircle(f, { r: 128, dmg: 8, kb: 165, kg: 5.4, tag: 'A' });
        m.fx({ type: 'ring', x: f.x, y: f.y, r: 128, color: '#ff9ab0', life: 0.35, w: 10 });
      }]]); break;
    case 'AB': {
      const hit = new Set();
      f.act(0.42, { move: 0, anim: 'thrust', atk: true }, [[0.24, () => {
        m.hitCircle(f, { r: 78, dmg: 6, kb: 165, kg: 5.5, tag: 'B' });
        m.fx({ type: 'ring', x: f.x, y: f.y, r: 78, color: '#ff9ab0', life: 0.3, w: 7 });
      }]]);
      f.startDash({ angle: f.facing, dist: 165, dur: 0.2, trail: true, onContact: (e) => {
        if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 6, kb: 60, kg: 2, tag: 'B', angle: f.facing }); }
        return false;
      } });
      break;
    }
    case 'AC': {
      const g = { x: f.ws.prev.x, y: f.ws.prev.y };
      m.fx({ type: 'ghost', x: g.x, y: g.y, r: f.r, color: f.color, life: 0.45 });
      f.act(0.3, { move: 0.2, anim: 'spin', atk: true }, [[0.08, () => {
        m.hitCircle(f, { r: 92, dmg: 7, kb: 170, kg: 5.5, tag: 'A' });
        m.hitCircle(f, { x: g.x, y: g.y, r: 92, dmg: 7, kb: 170, kg: 5.5, tag: 'C' });
        m.fx({ type: 'ring', x: f.x, y: f.y, r: 92, color: '#ff9ab0', life: 0.3, w: 8 });
        m.fx({ type: 'ring', x: g.x, y: g.y, r: 92, color: '#ff9ab0', life: 0.3, w: 8 });
        // Hư Ảnh Trùng Kích: thêm hư ảnh phụ ở phía đối diện
        if (f.T('ryoma_3a')) {
          const t = m.nearestEnemy(f), c = t || f;
          const h = m.arena.clamp({ x: 2 * c.x - g.x, y: 2 * c.y - g.y }, 10);
          m.fx({ type: 'ghost', x: h.x, y: h.y, r: f.r, color: f.color, life: 0.45 });
          m.hitCircle(f, { x: h.x, y: h.y, r: 92, dmg: 6, kb: 160, kg: 5, tag: 'C' });
          m.fx({ type: 'ring', x: h.x, y: h.y, r: 92, color: '#ff9ab0', life: 0.3, w: 8 });
        }
      }]]); break;
    }
    case 'BB':
      f.act(0.3, { move: 0.2, anim: 'thrust', atk: true }, [[0.08, () => {
        m.hitLine(f, { len: 138, w: 30, dmg: 7, kb: 120, kg: 4.5, stun: 0.75, tag: 'B', bb: true });
        if (f.T('ryoma_3c')) f.ws.bbEmp = true;
      }]]); break;
    case 'BA':
      // Ngược Gió Chém Sát: chém hất ngược tung kẻ địch lên trời 1s
      f.act(0.32, { move: 0.2, anim: 'raise', atk: true }, [[0.08, () => m.hitArc(f, { range: 108, arc: 140, dmg: 7, kb: 45, kg: 1.2, knockup: 740, tag: 'A' })]]);
      break;
    case 'BC':
      shoot(f, m, f.facing, { speed: 900, r: 18, range: 320, kind: 'phantom', color: f.color, pierce: true, hit: { dmg: 7, kb: 150, kg: 4.8, tag: 'C' } });
      break;
    case 'CC':
      f.act(0.25, { move: 0.3, anim: 'spin', atk: true }, [[0.05, () => {
        m.hitCircle(f, { r: 85, dmg: 5, kb: 150, kg: 4, slow: [0.4, 1.2], tag: 'C' });
        m.fx({ type: 'ring', x: f.x, y: f.y, r: 85, color: '#bff', life: 0.35, w: 6 });
      }]]); break;
  }
  done();
}
const WEAPON_IDS = Object.keys(WEAPONS);
