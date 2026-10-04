'use strict';
// ===== 9 vũ khí mới + dạng/thực thể triệu hồi =====
// f.intent = { hold:true } do AI đặt khi muốn "nhấn giữ" một chiêu.

Object.assign(WEAPONS, {
  // ================= NẮM TAY (Borg) =================
  nam_tay: {
    name: 'Nắm Tay', icon: '👊', color: '#ff7a4a', weight: 1.2, speed: 1.0, gfx: 'fist',
    role: 'Cận chiến • Khổ nhục kế', ai: { range: 48, defend: ['C'] },
    passive: { name: 'Huyết Chiến', desc: 'Điểm văng của bản thân càng cao, lực đấm càng mạnh (tối đa x2 lực đẩy ở 150%). Trên 100%: đòn đánh có thêm lửa (Thiêu đốt).' },
    init(f) { f.ws.charge = 0; f.ws.slamT = 0; },
    resource(f) { return `Huyết chiến x${(1 + Math.min(1, f.percent / 150)).toFixed(2)}` + (f.ws.charge ? ` • ⚡Năng lượng ${Math.round(f.ws.charge)}` : '') + (f.ws.slamT > 0 ? ' • ↯ A: NỆN' : ''); },
    update(f, m, dt) {
      if (f.ws.slamT > 0) f.ws.slamT -= dt;
      // Đấu Sĩ Khát Máu: điểm văng càng cao hồi chiêu càng nhanh (tối đa +80%)
      if (f.T('borg_12b')) { const k = 0.8 * Math.min(1, f.percent / 150) * dt; for (const q of ['A', 'B', 'D']) if (f.cd[q] > 0 && f.cd[q] < 90) f.cd[q] = Math.max(0, f.cd[q] - k); }
    },
    onDeal(f, t, hit, info) {
      info.kbMult *= 1 + Math.min(1, f.percent / 150);
      if (f.percent > 100 || f.T('borg_12b')) info.extra.push(() => t.addStatus('burn', 3, 1.6));
    },
    onIncoming(f, att, hit, m) {
      if (!f.has('absorb')) return true;
      const d = (hit.dmg || 0) * DMG_SCALE * (att ? att.dmgMult : 1);
      f.ws.charge = Math.min(40, f.ws.charge + d * 1.6 + 2);
      if (f.T('borg_3a') && d > 0) f.addStatus('shield', 3, d * 0.7);
      if (!hit.quiet) { m.text(f.x, f.y - 40, 'HẤP THỤ', '#ffb07a', 13); m.fx({ type: 'ring', x: f.x, y: f.y, r: 34, color: '#ffb07a', life: 0.25, w: 4 }); }
      if (hit.stun) f.addStatus('stun', hit.stun);
      if (hit.root) f.addStatus('root', hit.root);
      return false;
    },
    skills: {
      A: { name: 'Đấm Móc', cd: 0.62, desc: 'Đánh tích: tầm siêu ngắn, hất tung kẻ địch lên trời nhẹ.',
        ai: { type: 'atk', max: 62, pri: 2.2 },
        // Đập Nện Mặt Sàn: Đấm Móc trúng → bấm A lần nữa đập xuống sàn choáng 1s
        recast(f) { return f.T('borg_6b') && f.ws.slamT > 0; },
        recastAi: (f, t, m, d) => d < 95,
        recastUse(f, m) {
          f.ws.slamT = 0;
          f.act(0.3, { move: 0.2, anim: 'raise', atk: true }, [[0.08, () => {
            const hs = m.hitArc(f, { range: 78, arc: 150, dmg: 5, kb: 25, kg: 0.5, stun: 1, tag: 'A' });
            for (const e of hs) { if (!e.superArmor) { e.z = 0; e.vz = 0; } m.text(e.x, e.y - 50, '💢 NỆN!', '#ff9a6a', 16); }
            if (hs.length) m.shake(6);
          }]]);
        },
        use(f, m) { f.act(0.26, { move: 0.5, anim: 'thrust', atk: true }, [[0.07, () => { const hs = m.hitArc(f, { range: 54, arc: 100, dmg: 4.1, kb: 76, kg: 3.0, knockup: 240, tag: 'A' }); if (hs.length && f.T('borg_6b')) f.ws.slamT = 0.85; }]]); } },
      D: { name: 'Chộp & Quật', cd: 4, desc: 'Đặc kỹ: lao tới chụp kẻ địch (không thể đỡ bằng khiên). Trúng: quật ngã ra sau lưng và gây CHOÁNG 1s.',
        ai: { type: 'atk', min: 25, max: 170, pri: 2.6 },
        use(f, m) {
          f.act(0.35, { move: 0, anim: 'thrust', atk: true });
          const toss = f.T('borg_6a');
          f.startDash({ angle: f.facing, dist: 165, dur: 0.22, onContact: (e) => {
            // Cú Ném Tử Thần: ném bổng đối thủ thật xa về phía trước
            if (toss) {
              if (m.applyHit(f, e, { dmg: 7, kb: 300, kg: 7.8, knockup: 360, unblockable: true, tag: 'D', angle: f.facing })) { m.text(e.x, e.y - 50, '🏋️ NÉM!', '#ff9a6a', 18); m.shake(9); }
              return true;
            }
            if (m.applyHit(f, e, { dmg: 6, noKnock: true, stun: f.T('borg_3b') ? 1.5 : 1, unblockable: true, tag: 'D' }) && !e.has('unstoppable')) {
              const p = m.arena.clamp({ x: f.x - Math.cos(f.facing) * 46, y: f.y - Math.sin(f.facing) * 46 }, 8);
              m.fx({ type: 'line', x1: e.x, y1: e.y, x2: p.x, y2: p.y, color: '#ff9a6a', life: 0.3, w: 10 });
              e.x = p.x; e.y = p.y; e.vx = e.vy = 0; e.z = 0;
              m.shake(8); m.text(e.x, e.y - 40, 'QUẬT NGÃ!', '#ff9a6a', 17);
            }
            return true;
          } });
        } },
      C: { name: 'Gồng Mình', cd: 3, hold: 1.5, desc: 'Đứng yên gồng tối đa 1.5s: Trụ Vững (không bị đẩy) + Bất Biến (không tăng điểm văng). Sát thương nhận vào chuyển thành năng lượng cho Trả Đòn (B). Vẫn dính Choáng/Trói.',
        ai: { type: 'def', max: 160 },
        use(f, m) {
          const hold = f.brain ? f.brain.holdTime(1.5, f) : 1;
          f.addStatus('absorb', hold);
          f.act(hold, { move: 0, anim: 'guard', super: true, charge: hold, onEnd: () => f.removeStatus('absorb') });
        } },
      B: { name: 'Trả Đòn', cd: 4.5, desc: 'Kết liễu: cú đấm toàn lực. Sau khi Gồng hấp thụ sát thương: tầm rộng hơn và lực đẩy cực đại (Finisher).',
        ai: { type: 'atk', max: 78, pri: 2.8, when: (f, t) => f.ws.charge > 0 || t.percent > 60 || Math.random() < 0.4 },
        use(f, m) {
          const ch = f.ws.charge, emp = ch > 0;
          // Cú Húc Xuyên Giáp: giữ B khi chưa tích năng lượng → lao tới như xe bọc thép
          if (!emp && f.T('borg_12a') && f.intent && f.intent.hold) {
            const hit = new Set();
            f.addStatus('unstoppable', 0.6);
            f.act(0.45, { move: 0, anim: 'thrust', atk: true, super: true });
            f.startDash({ angle: f.facing, dist: 270, dur: 0.38, trail: true, onContact: (e) => {
              if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 7, kb: 235, kg: 6, tag: 'B', angle: f.facing }); m.shake(6); }
              return false;
            } });
            m.text(f.x, f.y - 56, '🚜 XUYÊN GIÁP!', '#ff7a4a', 17);
            return;
          }
          f.ws.charge = 0;
          f.act(0.5, { move: 0.1, anim: 'thrust', atk: true, windup: 0.22 }, [[0.22, () => {
            const fin = emp && f.T('borg_9b');
            m.hitArc(f, { range: emp ? 104 : 72, arc: emp ? 150 : 100, dmg: 10 + ch * 0.25, kb: ((emp ? 230 : 160) + ch * 5.5) * (fin ? 3 : 1), kg: 7 * (fin ? 1.5 : 1), tag: 'B' });
            if (emp) { m.text(f.x, f.y - 56, 'TRẢ ĐÒN!', '#ff7a4a', 20); m.shake(10); }
          }]]);
        } },
      U: { name: 'Đấu Trường La Mã', desc: 'Dựng vòng dây đài quanh mình trong 6s: kẻ địch không thể thoát ra (bị nảy bật lại khi đập vào dây). Bạn nhận Thiết Thân suốt thời gian này.',
        ai: { type: 'buff', max: 200 },
        use(f, m) {
          m.rings.push({ x: f.x, y: f.y, r: 240, owner: f, t: 6 });
          f.addStatus('ironbody', 6);
          if (f.T('borg_9a')) { f.cleanse(); f.addStatus('unstoppable', 6); }
          m.text(f.x, f.y - 70, 'ĐẤU TRƯỜNG LA MÃ!', '#ff7a4a', 22); m.shake(8);
        } },
    },
  },

  // ================= GĂNG TAY VUỐT (Koda) =================
  vuot: {
    name: 'Găng Tay Vuốt', icon: '🐾', color: '#c0563a', weight: 0.85, speed: 1.22, gfx: 'claw',
    role: 'Sát thủ • Chảy máu', ai: { range: 46, defend: ['D'] },
    passive: { name: 'Vết Thương Sâu', desc: 'Mỗi đòn cào gây 1 tầng Chảy Máu (tự tăng điểm văng trong 3s), cộng dồn tối đa 5 tầng.' },
    init(f) { f.ws.cling = null; f.ws.dive = false; f.ws.ft = new Map(); f.ws.biteT = 0; f.ws.hka = 0; f.ws.burrow = false; },
    resource(f, m) {
      const t = m && m.nearestEnemy(f), b = t && t.has('bleed');
      return `🩸 Đối thủ: ${b ? b.n : 0}/${bleedCap(f)}` + (f.ws.cling ? ' • 🧗 Bám tường' : '') + (f.has('berserk') ? ' • 🔴 HÓA ĐIÊN' : '');
    },
    afterDeal(f, t, hit) {
      if (hit.noBleed) return;
      t.addStatus('bleed', f.T('koda_1b') ? 5 : 3, 1, bleedCap(f));
      if (f.T('koda_3c') && t.status.bleed) t.status.bleed.hunt = true;
      if (f.T('koda_12b') && !t.isMinion) t.addStatus('wound', 4);
    },
    onDeal(f, t, hit, info) {
      if (f.ws.dive && (hit.tag === 'A' || hit.tag === 'D')) { info.mult *= 1.5; info.kbMult *= 1.3; }
      if (f.has('berserk')) info.mult *= 1.25;
      if (f.ws.hka > 0) info.kbMult *= 1.5;
    },
    update(f, m, dt) {
      if (f.has('berserk')) f.frameSpeed *= 1.2;
      if (f.ws.biteT > 0) f.ws.biteT -= dt;
      if (f.ws.hka > 0) f.ws.hka -= dt;
      const c = f.ws.cling;
      if (c) {
        c.t -= dt;
        const p = fromAng(c.a, c.p.r + f.r + 2);
        f.x = c.p.x + p.x; f.y = c.p.y + p.y; f.vx = f.vy = 0;
        if (c.t <= 0 || f.has('stun')) clawDrop(f);
      }
      if (f.has('feral')) {
        for (const e of m.enemiesOf(f)) {
          if (Math.hypot(e.x - f.x, e.y - f.y) > f.r + e.r + 8) continue;
          if ((f.ws.ft.get(e) || 0) > m.time) continue;
          f.ws.ft.set(e, m.time + 0.35);
          m.applyHit(f, e, { dmg: 1.5, noKnock: true, tag: 'U' });
        }
      }
    },
    skills: {
      A: { name: 'Cào Loạn Xạ', cd: 0.8, airOk: true, desc: 'Đánh tích: cào liên tiếp (mỗi đòn 1 tầng Chảy Máu) 2 cái trước mặt, rất nhanh. Từ trên tường: lao xuống tấn công (x1.5).',
        ai: { type: 'atk', max: 62, pri: 2.2 },
        use(f, m) {
          if (f.ws.cling) return clawDive(f, m, 'A');
          // Vuốt Quét 360: xoay tròn cào mọi kẻ địch xung quanh
          if (f.T('koda_6b')) { f.act(0.32, { move: 0.5, anim: 'spin', atk: true }, [[0.08, () => m.hitCircle(f, { r: 78, dmg: 4, kb: 70, kg: 2.8, tag: 'A' })]]); return; }
          const h = () => m.hitArc(f, { range: 60, arc: 115, dmg: 3.4, kb: 58, kg: 2.5, tag: 'A' });
          f.act(0.32, { move: 0.5, anim: 'swing', atk: true }, [[0.05, h], [0.17, h]]);
        } },
      D: { name: 'Vồ Mồi', cd: 2.5, airOk: true, desc: 'Đặc kỹ: nhảy vồ tới trước. Chạm địch: đè xuống (Trói chân cả hai 0.5s) rồi cào vào mặt. Chạm tường: bám vào tường.',
        ai: { type: 'atk', min: 40, max: 220, pri: 2.5 },
        // Cắn Xé Cuồng Loạn: vồ trúng → bấm D lần nữa ngoạm cổ quăng về phía mép sàn
        recast(f) { return f.T('koda_6a') && f.ws.biteT > 0 && f.ws.biteE && f.ws.biteE.alive; }, recastBusy: true,
        recastAi: (f) => f.ws.biteT < 0.65,
        recastUse(f, m) {
          const e = f.ws.biteE; f.ws.biteT = 0; f.ws.biteE = null; f.action = null;
          const a = Math.atan2(e.y, e.x) || f.facing;
          m.applyHit(f, e, { dmg: 6, kb: 275, kg: 6.6, tag: 'D', angle: a, noBleed: false });
          m.text(e.x, e.y - 50, '🐺 QUĂNG!', '#ff6a4a', 17); m.shake(7); m.sfx('flesh_hit');
          f.act(0.2, { move: 0 });
        },
        use(f, m) {
          if (f.ws.cling) return clawDive(f, m, 'D');
          f.act(0.3, { move: 0, anim: 'thrust', atk: true });
          f.startDash({ angle: f.facing, dist: 215, dur: 0.24, trail: true,
            onWall: (p) => { if (!f.T('koda_12a')) clawCling(f, m, p); },
            onContact: (e) => {
              if (m.applyHit(f, e, { dmg: 2, noKnock: true, root: 0.5, tag: 'D' })) {
                f.act(0.55, { move: 0 }); f.addStatus('root', 0.5);
                m.later(0.45, () => { if (f.alive && e.alive && f.ws.biteE !== null) m.applyHit(f, e, { dmg: 7, kb: 130, kg: 4.6, tag: 'D', angle: f.facing }); });
                m.text(e.x, e.y - 40, 'VỒ!', '#ff8a6a', 16);
                if (f.T('koda_6a')) { f.ws.biteT = 1.1; f.ws.biteE = e; }
              }
              return true;
            } });
        } },
      C: { name: 'Bám Tường', cd: 0, desc: 'Khi đứng cạnh tường/cột: bám lên đó (không bị đánh trúng, tối đa 3s). Từ trên tường dùng A/D lao xuống với tốc độ & sát thương x1.5.',
        ai: { type: 'mob' },
        can(f, m) { return f.T('koda_12a') ? !f.ws.burrow : !f.ws.cling && !!m.arena.nearPillar(f, 26); },
        use(f, m) {
          // Độn Thổ Rình Rập: chui xuống đất lướt tới chỗ địch rồi trồi lên hất tung
          if (f.T('koda_12a')) {
            const t = m.nearestEnemy(f), a = t ? angTo(f, t) : f.facing, d = t ? Math.min(dist(f, t), 330) : 200;
            f.ws.burrow = true; f.cd.C = 4.5 * f.cdMult;
            f.addStatus('untargetable', 0.75); f.addStatus('invis', 0.7);
            f.act(0.7, { move: 0 });
            f.startDash({ angle: a, dist: d, dur: 0.6, invuln: true, stopAtEdge: true, onEnd: () => {
              f.ws.burrow = false;
              m.hitCircle(f, { r: 88, dmg: 6, kb: 110, kg: 3.5, knockup: 620, tag: 'C' });
              for (let i = 0; i < 10; i++) m.particle(f.x, f.y, { color: '#8a6a4a', life: 0.5, size: 5, vx: rand(-220, 220), vy: rand(-260, 60) });
              m.shake(6); m.text(f.x, f.y - 50, '🕳️ TRỒI LÊN!', '#c0563a', 15);
            } });
            m.text(f.x, f.y - 50, '⛏️ ĐỘN THỔ', '#c0563a', 14);
            return;
          }
          clawCling(f, m, m.arena.nearPillar(f, 26));
        } },
      B: { name: 'Xé Toạc', cd: 3.5, desc: 'Kết liễu: kích nổ ngay toàn bộ tầng Chảy Máu trên người địch thành sát thương sốc cực lớn. Đủ 5 tầng: LÀM CHẬM 80% trong 2s (đứt gân).',
        ai: { type: 'atk', max: 420, pri: 3, when: (f, t) => t.has('bleed') && t.has('bleed').n >= bleedCap(f) - 1 },
        can(f, m) { const t = m.nearestEnemy(f); return !!(t && t.has('bleed') && dist(f, t) < 450); },
        use(f, m) {
          const t = m.nearestEnemy(f), b = t.has('bleed'), n = b.n, full = n >= bleedCap(f);
          t.removeStatus('bleed');
          const x3 = full && f.T('koda_9c') ? 3 : 1;
          m.applyHit(f, t, { dmg: Math.min(n, 5) * 3.6 + Math.max(0, n - 5) * 2, kb: (50 + n * 20) * x3, kg: 2 * x3, tag: 'B', noBleed: true, angle: angTo(f, t) });
          if (full) {
            t.addStatus('slow', 2, 0.8);
            if (f.T('koda_3b')) t.addStatus('root', 2);
            m.text(t.x, t.y - 56, x3 > 1 ? 'XÉ TOẠC SINH MỆNH!' : 'ĐỨT GÂN!', '#ff3a4a', 20);
          }
          m.sfx('splat');
          for (let i = 0; i < 12; i++) m.particle(t.x, t.y, { color: '#ff2a3a', life: 0.5, size: 4, vx: rand(-220, 220), vy: rand(-220, 220) });
        } },
      U: { name: 'Thú Tính', desc: 'Hóa thành bóng đen 5s: tốc chạy x2, mỗi lần lướt qua người địch tự động gây 1 tầng Chảy Máu.',
        ai: { type: 'buff', max: 300 },
        use(f, m) {
          const T = f.T('koda_9a') ? 8 : 5;
          if (T > 5) f.removeStatus('slow');
          f.addStatus('feral', T); f.addStatus('haste', T, 1.0); f.addStatus('untargetable', T);
        } },
    },
  },

  // ================= SÚNG SĂN (Clint) =================
  sung_san: {
    name: 'Súng Săn', icon: '🤠', color: '#d0a060', weight: 1.05, speed: 1.05, gfx: 'shotgun',
    role: 'Bắn cự ly gần • Nhịp điệu', ai: { range: 80, defend: ['C'] },
    passive: { name: '2 Viên Đạn', desc: 'Chỉ có 2 viên, tự nạp 1.9s/viên. Đạn tỏa nón rộng: cực gần thì sát thương & lực đẩy cực mạnh (hơn súng lục), ở xa gần như vô dụng.' },
    init(f) { f.ws.shells = maxShells(f); f.ws.rl = 0; f.ws.crit = false; f.ws.dragon = 0; },
    resource(f) { return `Đạn ${'●'.repeat(f.ws.shells)}${'○'.repeat(Math.max(0, maxShells(f) - f.ws.shells))}` + (f.ws.crit ? ' • ⚡CHÍ MẠNG' : '') + (f.ws.dragon ? ` • 🐉 x${f.ws.dragon}` : ''); },
    update(f, m, dt) {
      if (f.ws.shells < maxShells(f)) { f.ws.rl += dt; if (f.ws.rl >= (f.T('clint_1a') ? 1.35 : 1.9) * f.cdMult * (f.rlG || 1)) { f.ws.rl = 0; f.ws.shells++; } } else f.ws.rl = 0;
      if (f.ws.dragon <= 0 && f.ws.dragonUS) { f.ws.dragonUS = false; f.removeStatus('unstoppable'); }
    },
    onDeal(f, t, hit, info, m) {
      if (hit.pellet) {
        const k = clamp(1.6 - hit.dist / (f.T('clint_12b') ? 300 : 150), 0.05, 1.6);
        info.mult *= k; info.kbMult *= k;
        if (k > 1.3) m.text(t.x, t.y - 46, 'NÁT!', '#ffd27a', 16);
        // Hạt Chì Nặng: cự ly cực gần chắc chắn choáng • Thợ Săn Bất Tử: trúng đích hồi 5% điểm văng
        if (f.T('clint_6c') && hit.dist < 70) info.extra.push(() => t.addStatus('stun', 0.5));
        if (f.T('clint_12b')) info.extra.push(() => { f.percent = Math.max(0, f.percent - 5); });
        // Điểm Hỏa Khắc Tinh: phát bắn cận chiến phá giáp
        if (hit.dist < 95 && f.T('clint_9c') && (t.superArmor || t.has('shield'))) {
          for (const s of ['ironbody', 'stance', 'absorb', 'block', 'shield', 'unstoppable']) t.removeStatus(s);
          if (t.action) t.action.super = false;
          m.text(t.x, t.y - 62, '💥 PHÁ GIÁP!', '#ffb030', 17);
        }
      }
      if (f.ws.crit && hit.tag !== 'D') { info.kbMult *= 1.5; f.ws.crit = false; m.text(t.x, t.y - 60, 'CHÍ MẠNG!', '#ffe066', 18); }
    },
    skills: {
      B: { name: 'Bắn', cd: 0.55, desc: 'Kết liễu: bắn 1 viên tỏa nón, cực gần thì văng cực mạnh. Dùng 1 đạn.',
        ai: { type: 'atk', max: 120, pri: 2.6 },
        can(f) { return f.ws.shells > 0; },
        use(f, m) {
          f.ws.shells--;
          if (f.ws.dragon > 0) {
            f.ws.dragon--;
            const ev = [];
            for (let i = 0; i < 8; i++) ev.push([0.03 + i * 0.07, () => {
              m.hitArc(f, { range: 430, arc: 44, dmg: 2.2, kb: 150, kg: 2, burn: [1.6, 3], tag: 'U', quiet: true });
              for (let j = 0; j < 6; j++) { const a = f.facing + rand(-0.38, 0.38), s = rand(300, 700); m.particle(f.x, f.y, { color: pick(['#ff5a1a', '#ffb02a', '#ffe07a']), life: 0.6, size: 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s }); }
            }]);
            f.act(0.62, { move: 0.2, anim: 'aim', atk: true }, ev); m.sfx('shotgun', { rate: 0.75 }); m.sfx('flame', { vol: 0.8 });
            m.shake(6);
            return;
          }
          // Đạn Xuyên Phá Cỡ Lớn: viên đặc chế xuyên tường, phá khiên
          if (f.ws.slug) {
            f.ws.slug = false;
            f.act(0.28, { move: 0.2, anim: 'aim', atk: true }, [[0.04, () => {
              shoot(f, m, aimOr(f, m, 600, 1500), { speed: 1500, r: 9, range: 640, kind: 'bigarrow', color: '#ffd27a', pierce: true, ghost: true, breaker: true,
                hit: { dmg: 12, kb: 335, kg: 8.6, unblockable: true, tag: 'B' }, onHit: (mm, p, t) => { for (const s of ARMOR_ST) t.removeStatus(s); } });
              m.sfx('shotgun', { rate: 0.6 }); m.shake(8);
              m.fx({ type: 'flash', x: f.x + Math.cos(f.facing) * 34, y: f.y + Math.sin(f.facing) * 34, r: 26, color: '#ffd27a', life: 0.12 });
            }]]);
            return;
          }
          f.act(0.25, { move: 0.3, anim: 'aim', atk: true }, [[0.03, () => {
            m.hitArc(f, { range: f.T('clint_12b') ? 350 : 235, arc: 58, dmg: 11, kb: 192, kg: 7.9, pellet: true, tag: 'B', quiet: true });
            for (let j = 0; j < 9; j++) { const a = f.facing + rand(-0.48, 0.48), s = rand(600, 1000); m.particle(f.x + Math.cos(f.facing) * 30, f.y + Math.sin(f.facing) * 30, { color: '#ffe9a0', life: 0.22, size: 3, vx: Math.cos(a) * s, vy: Math.sin(a) * s }); }
            m.fx({ type: 'flash', x: f.x + Math.cos(f.facing) * 34, y: f.y + Math.sin(f.facing) * 34, r: 18, color: '#fff3a0', life: 0.1 });
            m.sfx('shotgun');
            m.shake(4);
          }]]);
        } },
      A: { name: 'Báng Súng', cd: 1.1, desc: 'Đánh tích: đập báng súng vào mặt địch. Đập trúng: lập tức nạp lại 1 viên đạn.',
        ai: { type: 'atk', max: 64, pri: 2.2 },
        use(f, m) {
          // Đoạt Mệnh Cận Chiến: giật đối thủ áp sát rồi tọng họng súng vào bụng
          if (f.T('clint_6a')) {
            f.act(0.42, { move: 0.2, anim: 'thrust', atk: true }, [[0.08, () => {
              const hs = m.hitArc(f, { range: 92, arc: 110, dmg: 2, noKnock: true, tag: 'A' });
              for (const e of hs) {
                pullTo(f, e, f.r + e.r + 6, 700, 0.18);
                m.later(0.18, () => {
                  if (!f.alive || !e.alive) return;
                  m.applyHit(f, e, { dmg: 10.5, kb: 215, kg: 7, tag: 'A', angle: angTo(f, e) });
                  m.fx({ type: 'flash', x: e.x, y: e.y, r: 26, color: '#fff3a0', life: 0.12 }); m.sfx('shotgun', { vol: 0.8 });
                });
              }
              if (hs.length) { f.ws.shells = Math.min(maxShells(f), f.ws.shells + 2); m.text(f.x, f.y - 40, '+2 đạn', '#ffe066', 13); }
            }]]);
            return;
          }
          f.act(0.3, { move: 0.4, anim: 'swing', atk: true }, [[0.08, () => {
            const h = m.hitArc(f, { range: f.T('clint_1b') ? 75 : 60, arc: 110, dmg: 6.5, kb: 115, kg: 4.2, tag: 'A' });
            if (h.length && f.ws.shells < maxShells(f)) { const k = f.T('clint_3c') ? 2 : 1; f.ws.shells = Math.min(maxShells(f), f.ws.shells + k); m.text(f.x, f.y - 40, `+${k} đạn`, '#ffe066', 13); }
          }]]);
        } },
      C: { name: 'Bắn Nhảy', cd: 5.5, desc: 'Bắn 1 viên xuống đất: phản chấn hất bạn bay cao và ra xa (né chiêu). Kẻ địch dưới chân dính đạn và bị cháy. Dùng 1 đạn.',
        ai: { type: 'def', max: 200, mob: 'escape' },
        can(f) { return f.ws.shells > 0; },
        // Dậm Gót Tử Thần: đang bay → bổ gót xuống đầu đối thủ gần nhất
        recast(f) { return f.T('clint_6b') && f.z > 0 && !f.ws.heel; }, recastBusy: true,
        recastAi: (f, t, m, d) => d < 240,
        recastUse(f, m) {
          f.ws.heel = true;
          const t = m.nearestEnemy(f); if (!t) return;
          f.cancelDash(); f.vz = -900;
          f.startDash({ angle: angTo(f, t), dist: Math.max(10, dist(f, t) - 10), dur: 0.14, onEnd: () => m.later(0.02, () => {
            if (!f.alive) return;
            m.hitCircle(f, { r: 72, dmg: 6, kb: 90, kg: 2, stun: 1, trip: true, tag: 'C' });
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 72, color: '#ffb36a', life: 0.35, w: 8 }); m.shake(6); m.sfx('impact');
          }) });
          m.text(f.x, f.y - 60, '🥾 DẬM GÓT!', '#ffb36a', 15);
        },
        use(f, m) {
          f.ws.shells--; f.ws.heel = false;
          m.hitCircle(f, { r: 78, dmg: 5, kb: 170, kg: 4, burn: [1.6, 3], tag: 'C', stun: f.T('clint_3a') ? 0.75 : 0 });
          m.fx({ type: 'boom', x: f.x, y: f.y, r: 70, color: '#ff7a2a', life: 0.35 });
          f.vz = f.T('clint_1c') ? 728 : 560; f.z = 1;
          f.startDash({ angle: f.castAngle, dist: f.T('clint_1c') ? 276 : 230, dur: 0.5 });
        } },
      D: { name: 'Nạp Đạn Khẩn Cấp', cd: 9, desc: 'Ném vỏ đạn vào mặt địch (choáng nhẹ) và nạp đầy 2 viên ngay. Đòn kế tiếp chắc chắn Chí Mạng (đẩy xa x1.5).',
        ai: { type: 'buff', max: 360, pri: 2.4, when: (f) => f.ws.shells === 0 },
        use(f, m) {
          if (f.T('clint_12a')) { f.ws.slug = true; m.text(f.x, f.y - 50, '🔩 ĐẠN ĐẶC CHẾ', '#ffd27a', 14); }
          else shoot(f, m, aimOr(f, m, 360, 800), { speed: 800, r: 5, range: 360, kind: 'knife', color: '#d0a060', hit: { dmg: 2, kb: 30, kg: 0.5, stun: f.T('clint_3b') ? 1.25 : 0.45, tag: 'D' } });
          f.ws.shells = maxShells(f); f.ws.rl = 0; f.ws.crit = true;
          f.act(0.2, { move: 0.5, anim: 'cast' });
        } },
      U: { name: "Dragon's Breath", desc: 'Nạp 2 viên đạn Rồng: mỗi phát Bắn (B) phun luồng lửa thiêu đốt cực xa phía trước, đẩy lùi liên tục như vòi rồng.',
        ai: { type: 'buff', max: 400 },
        use(f, m) {
          f.ws.dragon = 2; f.ws.shells = Math.max(2, f.ws.shells); m.text(f.x, f.y - 56, '🐉 ĐẠN RỒNG!', '#ff7a2a', 20);
          if (f.T('clint_9a')) { f.addStatus('unstoppable', 10); f.ws.dragonUS = true; }
        } },
    },
  },

  // ================= LIỀM (Death) =================
  liem: {
    name: 'Liềm', icon: '💀', color: '#8a7aa8', weight: 1.35, speed: 1.06, gfx: 'scythe',
    role: 'Kiểm soát tầm trung • Kéo', ai: { range: 122, defend: [] },
    passive: { name: 'Lưỡi Hái Tử Thần', desc: 'Vũ khí có phần Cán (30% gần) và Lưỡi (70% xa). Chỉ khi trúng bằng Lưỡi địch mới bị kéo/đẩy; trúng bằng Cán chỉ gây sát thương nhẹ. Lưỡi liềm hút sinh lực: mỗi đòn Lưỡi trúng giảm 1% điểm văng của bản thân.' },
    init(f) { f.ws.thrown = false; f.ws.shades = 0; f.ws.mz = null; f.ws.souls = f.ws.souls || 0; },
    resource(f) { return (f.ws.thrown ? '🌀 Liềm đang xoay (tay không)' : '') + (f.ws.shades > 0 ? ` • 👻 Gọi hồn ${f.ws.shades.toFixed(1)}s` : '') + (f.ws.souls > 0 ? ` • 👻x${f.ws.souls}` : ''); },
    onDeal(f, t, hit, info, m) {
      if (hit.tag === 'A' && t.has('pulled')) {
        const hi = f.T('death_3c') ? 600 : 430;
        info.mult *= 1.3; info.extra.push(() => { if (!t.superArmor) { t.vz = hi; t.z = Math.max(t.z, 1); } t.removeStatus('pulled'); });
        m.text(t.x, t.y - 50, 'HẤT TUNG!', '#c0b0ff', 17);
        return;
      }
      if (hit.blade && hit.range) {
        if (hit.dist / hit.range < (f.T('death_1a') ? 0.2 : 0.3)) { info.mult *= 0.5; info.kbMult = 0; if (!hit.quiet) m.text(t.x, t.y - 40, 'cán', '#bbbbbb', 12); return; }
        if (!hit.quiet) f.percent = Math.max(0, f.percent - 1);
      }
      if (hit.tag === 'B' && !hit.orb && t.percent > deathLine(f)) {
        // Trảm Quyết Diện Rộng: trên 100% → kết liễu ngay
        if (f.T('death_12a') && t.percent > 100 && !t.has('immortal')) { info.fixedKb = 2600; m.text(t.x, t.y - 70, '☠ TRẢM QUYẾT!', '#d0c0ff', 26); m.shake(16); return; }
        const edge = m.arena.edgeDist(t.x, t.y) < 230;
        info.kbMult *= edge ? 3 : 1.8;
        m.text(t.x, t.y - 64, edge ? '☠ PHÁN QUYẾT!' : 'PHÁN QUYẾT', '#d0c0ff', edge ? 24 : 18); m.shake(edge ? 14 : 8);
      }
    },
    // Hộ Thân Oan Hồn: linh hồn chặn hoàn toàn 1 đòn
    onIncoming(f, att, hit, m) {
      if (!(f.ws.souls > 0) || !att || att.isEnv || att === f || hit.quiet) return true;
      f.ws.souls--;
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#c0b0ff', life: 0.35, w: 5 }); m.text(f.x, f.y - 50, '👻 OAN HỒN CHẶN!', '#c0b0ff', 14);
      return false;
    },
    update(f, m, dt) {
      if (f.ws.shades > 0) {
        f.ws.shades -= dt;
        for (const s of scytheShades(f, m)) if (Math.random() < 0.5) m.fx({ type: 'ghost', x: s.x, y: s.y, r: 18, color: '#6a5a8a', life: 0.2 });
      }
      // Hơi Thở Tử Thần: làm chậm kẻ địch đứng gần
      if (f.T('death_6c')) for (const e of m.enemiesOf(f)) if (dist(e, f) < 120 + e.r) e.addStatus('slow', 0.25, 0.2);
    },
    onUse(f, key, m) {
      if (f.ws.shades <= 0 || (key !== 'A' && key !== 'B')) return;
      const t = m.nearestEnemy(f); if (!t) return;
      for (const s of scytheShades(f, m)) {
        const a = angTo(s, t);
        m.later(key === 'A' ? 0.14 : 0.18, () => {
          if (key === 'A') m.hitArc(f, { x: s.x, y: s.y, angle: a, range: 135, arc: 160, dmg: 5, kb: 110, kg: 5, blade: true, tag: 'A' });
          else m.hitLine(f, { x: s.x, y: s.y, angle: a, len: 175, w: 34, dmg: 7, kb: 140, kg: 5.5, blade: true, tag: 'B' });
        });
      }
    },
    skills: {
      A: { name: 'Gặt', cd: 0.9, desc: 'Đánh tích: chém quét ngang diện rộng. Nếu địch đang bị Kéo (chiêu D): hất tung lên trời.',
        ai: { type: 'atk', min: 50, max: 140, pri: 2.3 },
        can(f) { return !f.ws.thrown; },
        // Liềm đang xoay (C): bấm A dịch chuyển tới chỗ liềm, chụp lại và chém một vòng tròn
        recast(f) { return f.ws.thrown && !!f.ws.mz; }, recastBusy: true,
        recastAi: (f, t, m) => { const z = f.ws.mz; return z.t > 0.4 && Math.hypot(t.x - z.x, t.y - z.y) < 130; },
        recastUse(f, m) {
          const z = f.ws.mz; f.ws.mz = null; z.t = z.life; f.ws.thrown = false; f.action = null; f.cancelDash();
          m.fx({ type: 'ghost', x: f.x, y: f.y, r: f.r, color: '#6a5a8a', life: 0.4 });
          const p = m.arena.clamp({ x: z.x, y: z.y }, f.r + 4); f.x = p.x; f.y = p.y; f.vx = f.vy = 0;
          const t = m.nearestEnemy(f); if (t) f.facing = angTo(f, t);
          f.invulnT = Math.max(f.invulnT, 0.2);
          f.act(0.36, { move: 0, anim: 'spin', atk: true }, [[0.08, () => {
            m.hitCircle(f, { r: 120, dmg: 5, kb: 100, kg: 4, tag: 'A' });
            m.fx({ type: 'whirl', x: f.x, y: f.y, r: 120, a: f.facing, color: '#c0b0ff', life: 0.35, w: 10 });
          }]]);
          f.cd.A = Math.max(f.cd.A, 1); f.cd.B = Math.max(f.cd.B, 1.5); f.cd.D = Math.max(f.cd.D, 1.5);
          m.text(f.x, f.y - 56, '🌀 TỬ THẦN XOAY!', '#c0b0ff', 15); m.sfx('sword_cut', { rate: 0.8 });
        },
        use(f, m) {
          // Lưỡi Trảm Đoạt Hồn: chém chữ X, trúng thì hồi 15% điểm văng hiện có
          if (f.T('death_6a')) {
            f.act(0.4, { move: 0.3, anim: 'swing', atk: true }, [[0.1, () => {
              const hs = m.hitArc(f, { range: 145, arc: 120, angle: f.facing - 0.25, dmg: 6, kb: 120, kg: 4, blade: true, tag: 'A' });
              const hs2 = m.hitArc(f, { range: 145, arc: 120, angle: f.facing + 0.25, dmg: 6, kb: 215, kg: 7.5, blade: true, tag: 'A' });
              if (hs.length || hs2.length) { const h = f.percent * 0.15; f.percent -= h; if (h >= 1) m.text(f.x, f.y - 50, `💀 -${h.toFixed(0)}%`, '#c0b0ff', 14); }
            }]]);
            return;
          }
          const chain = f.T('death_12b'), R = chain ? 196 : 140;
          f.act(0.34, { move: 0.35, anim: 'swing', atk: true }, [[0.1, () => {
            const hs = m.hitArc(f, { range: R, arc: 160, dmg: 9.2, kb: chain ? 60 : 170, kg: chain ? 1.5 : 7.2, blade: true, tag: 'A' });
            // Sứ Giả Địa Ngục: xích liềm kéo đối thủ lại gần
            if (chain) for (const e of hs) if (dist(f, e) > 95) pullTo(f, e, 92, 650, 0.3);
          }]]);
        } },
      D: { name: 'Lưỡi Hái Đoạt Mệnh', cd: 3, desc: 'Đặc kỹ: quăng liềm ra xa rồi giật về: kéo kẻ địch theo vòng cung về sau lưng hoặc bên cạnh bạn.',
        ai: { type: 'atk', min: 110, max: 280, pri: 2.6 },
        can(f) { return !f.ws.thrown; },
        use(f, m) {
          f.act(0.35, { move: 0.2, anim: 'swing', atk: true }, [[0.08, () => {
            shoot(f, m, aimOr(f, m, 300, 950), { speed: 950, r: 16, range: 300, kind: 'scythe', color: '#d0d0e0', hit: null,
              onHit: (mm, p, t) => {
                if (!mm.applyHit(f, t, { dmg: 4, noKnock: true, stun: 0.6, tag: 'D' })) return true;
                const a0 = angTo(f, t);
                const side = Math.sign(angDiff(f.facing, a0)) || 1;
                const a1 = f.facing + side * Math.PI * 0.72;
                if (t.has('unstoppable')) return true;
                t.arcPull = { by: f, a0, da: angDiff(a0, a1) || 0.01, r0: dist(f, t), r1: f.r + t.r + 22, t: 0, dur: 0.38 };
                t.addStatus('pulled', 1.3);
                t.action = null; t.cancelDash();
                if (f.T('death_3b')) mm.later(0.4, () => { if (t.alive) { t.addStatus('root', 0.75); mm.text(t.x, t.y - 46, '⛓️ TÀN PHẾ', '#a3e36b', 14); } });
                return true;
              } });
          }]]);
        } },
      C: { name: 'Xoay Liềm', cd: 4.5, desc: 'Ném liềm xoay tròn tại vị trí chỉ định trong 2s, hút nhẹ kẻ địch xung quanh vào tâm. Trong lúc liềm xoay, bấm A để dịch chuyển tới liềm và chém một vòng tròn.',
        ai: { type: 'atk', min: 60, max: 320, pri: 2.2 },
        can(f) { return !f.ws.thrown; },
        // Thu Hồi Lưỡi Hái: giật liềm về tay, kéo lê kẻ địch trên đường bay
        recast(f) { return f.T('death_6b') && f.ws.thrown && !!f.ws.mz; },
        recastAi: (f, t) => { const z = f.ws.mz; return segDist(t.x, t.y, { x1: z.x, y1: z.y, x2: f.x, y2: f.y }) < 75 || z.t > 1.5; },
        recastUse(f, m) {
          const z = f.ws.mz; f.ws.mz = null; z.t = z.life; f.ws.thrown = false;
          const seg = { x1: z.x, y1: z.y, x2: f.x, y2: f.y };
          for (const e of m.enemiesOf(f)) if (segDist(e.x, e.y, seg) < 60 + e.r) {
            m.applyHit(f, e, { dmg: 4, noKnock: true, tag: 'C' });
            pullTo(f, e, f.r + e.r + 26, 950, 0.5);
            e.addStatus('pulled', 0.8);
          }
          m.fx({ type: 'line', x1: z.x, y1: z.y, x2: f.x, y2: f.y, color: '#d0d0e0', life: 0.3, w: 6 });
          m.text(f.x, f.y - 50, '⛓️ THU HỒI!', '#c0b0ff', 14);
        },
        use(f, m) {
          const t = m.nearestEnemy(f);
          let x = f.x + Math.cos(f.facing) * 200, y = f.y + Math.sin(f.facing) * 200;
          if (t) { const d = Math.min(dist(f, t), 300), a = angTo(f, t); x = f.x + Math.cos(a) * d; y = f.y + Math.sin(a) * d; }
          const p = m.arena.clamp({ x, y }, 20);
          f.ws.thrown = true;
          f.ws.mz = m.zone({ owner: f, x: p.x, y: p.y, r: 72, life: 2, every: 0.2, kind: 'scythe', color: 'rgba(140,120,180,0.18)',
            tick: (mm, z) => {
              mm.hitCircle(f, { x: z.x, y: z.y, r: z.r, dmg: 1, kb: 30, kg: 0.5, tag: 'C', quiet: true });
              for (const e of mm.enemiesOf(f)) {
                const d = Math.hypot(e.x - z.x, e.y - z.y);
                const pullF = f.T('death_3a') ? 120 : 60;
                if (d < 180 && d > 10 && !e.superArmor) { const a = Math.atan2(z.y - e.y, z.x - e.x); e.vx += Math.cos(a) * pullF; e.vy += Math.sin(a) * pullF; }
              }
            } });
          const zz = f.ws.mz;
          m.later(2, () => { if (f.ws.mz === zz) { f.ws.thrown = false; f.ws.mz = null; } });
          f.act(0.2, { move: 0.5, anim: 'swing' });
        } },
      B: { name: 'Phán Quyết', cd: 4.5, desc: 'Kết liễu: bổ liềm thẳng từ trên xuống (nhanh hơn Kiếm Dài) và phóng ra Cầu Hắc Ám bay xa (lực đẩy x1.25). Địch trên 100% điểm văng: lực đẩy x1.8; nếu đứng gần mép sàn: x3 — Tử Vong.',
        ai: { type: 'atk', min: 60, max: 330, pri: 2.4, when: (f, t) => t.percent > 70 || Math.random() < 0.4 },
        can(f) { return !f.ws.thrown; },
        use(f, m) {
          const chain = f.T('death_12b'), L = chain ? 266 : 190;
          f.act(0.45, { move: 0.1, anim: 'raise', atk: true, windup: 0.18 }, [[0.18, () => {
            if (f.T('death_12a')) { m.hitArc(f, { range: L + 40, arc: 70, dmg: 12, kb: 190, kg: 7.6, blade: true, tag: 'B' }); m.fx({ type: 'whirl', x: f.x + Math.cos(f.facing) * L * 0.6, y: f.y + Math.sin(f.facing) * L * 0.6, r: 60, a: f.facing, color: '#c0b0ff', life: 0.35, w: 8 }); m.shake(6); }
            else m.hitLine(f, { len: L, w: 38, dmg: 11, kb: 185, kg: 7.4, blade: true, tag: 'B' });
            // Cầu Hắc Ám: bổ liềm phóng ra quả cầu bóng tối, lực đẩy x1.25
            shoot(f, m, aimOr(f, m, 400, 700), { speed: 700, r: 16, range: 400, kind: 'darkorb', color: '#8a4ac0', hit: { dmg: 3, kb: 185 * 1.25, kg: 7.4 * 1.25, tag: 'B', orb: true } });
          }]]);
        } },
      U: { name: 'Gọi Hồn', desc: 'Triệu hồi 2 cái bóng cầm liềm bắt chước mọi đòn A/B của bạn ở các vị trí đối xứng quanh kẻ địch trong 6s. Sàn đấu thành cối xay thịt.',
        ai: { type: 'buff', max: 300 },
        use(f, m) { f.ws.shades = 6; m.text(f.x, f.y - 60, '👻 GỌI HỒN!', '#c0b0ff', 20); } },
    },
  },

  // ================= TRƯỜNG THƯƠNG (Theron) =================
  thuong: {
    name: 'Trường Thương', icon: '🔱', color: '#e0c070', weight: 1.1, speed: 1.0, gfx: 'spear',
    role: 'Giữ khoảng cách • Ghim tường', ai: { range: 150, defend: ['C'] },
    passive: { name: 'Xuyên Phá', desc: 'Các đòn đâm (A, D) xuyên qua nhiều mục tiêu. Mũi thương gây sát thương chuẩn (bỏ qua giáp, khiên và mọi hiệu ứng giảm sát thương).' },
    init(f) { f.ws.vault = 0; f.ws.carry = null; f.ws.spartaT = 0; f.ws.rush = null; },
    resource(f) { return f.ws.vault > 0 ? `🦘 Trên không ${f.ws.vault.toFixed(1)}s — C để ${f.T('theron_6b') ? 'phóng giáo' : 'dậm'}` : f.ws.carry ? '🔱 ĐANG ỦI!' : ''; },
    update(f, m, dt) {
      if (f.ws.vault > 0) {
        f.ws.vault -= dt; f.hover = 75;
        if (f.ws.vault <= 0) spearSlam(f, m);
      }
      if (f.ws.carry && !f.dash) spearRelease(f, m);
      // Khiên Chắn Sparta: lúc đâm liên hoàn, tấm chắn trước mặt chặn đạn
      if (f.ws.spartaT > 0) {
        f.ws.spartaT -= dt;
        for (const p of m.projs) {
          if (p.dead || p.owner.team === f.team || p.breaker) continue;
          const d = Math.hypot(p.x - f.x, p.y - f.y);
          if (d < 95 && Math.abs(angDiff(f.facing, Math.atan2(p.y - f.y, p.x - f.x))) < 0.95) { p.dead = true; m.fx({ type: 'ring', x: p.x, y: p.y, r: 14, color: '#ffe9a0', life: 0.2, w: 3 }); }
        }
      }
    },
    skills: {
      A: { name: 'Liên Hoàn Đâm', cd: 1, desc: 'Đánh tích: đứng yên đâm liên tiếp 3 nhát về trước. Tầm xa nhưng hẹp.',
        ai: { type: 'atk', min: 50, max: 180, pri: 2.4 },
        use(f, m) {
          if (f.T('theron_6c')) f.ws.spartaT = 0.55;
          f.act(0.5, { move: 0, anim: 'thrust', atk: true },
            [0.06, 0.2, 0.34].map((tt) => [tt, () => m.hitLine(f, { len: f.T('theron_1a') ? 219 : 175, w: 18, dmg: 3.5, kb: 70, kg: 2.8, trueDmg: true, tag: 'A' })]));
        } },
      C: { name: 'Chống Thương Nhảy', cd: 5, desc: 'Né: cắm thương bật người lên cao 1.5s (không thể bị chọn làm mục tiêu, né mọi đòn). Tái kích hoạt C: lao xuống dậm đất gây chấn động LÀM CHẬM.',
        ai: { type: 'def', max: 220 },
        recast(f) { return f.ws.vault > 0; },
        recastUse(f, m) {
          // Giáo Ném Không Trung: phóng giáo xuống chỗ địch — choáng + vùng cản đường
          if (f.T('theron_6b')) {
            const t = m.nearestEnemy(f);
            f.ws.vault = 0; f.hover = 0; f.vz = -300; f.removeStatus('untargetable');
            if (t) {
              const p = { x: t.x + t.moveDir.x * t.speed * 0.15, y: t.y + t.moveDir.y * t.speed * 0.15 };
              m.fx({ type: 'line', x1: f.x, y1: f.y - 80, x2: p.x, y2: p.y, color: '#fff6c0', life: 0.2, w: 6 });
              m.later(0.12, () => {
                m.hitCircle(f, { x: p.x, y: p.y, r: 62, dmg: 6, kb: 60, kg: 1.5, stun: 1, trueDmg: true, tag: 'C' });
                m.fx({ type: 'ring', x: p.x, y: p.y, r: 62, color: '#e0c070', life: 0.4, w: 8 }); m.shake(6); m.sfx('impact');
                m.zone({ owner: f, x: p.x, y: p.y, r: 70, life: 3, every: 0.2, kind: 'spearpin', color: 'rgba(224,192,112,0.22)',
                  tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) e.addStatus('slow', 0.3, 0.6); } });
              });
            }
            m.text(f.x, f.y - 60, '🔱 GIÁO NÉM!', '#e0c070', 15);
            return;
          }
          spearSlam(f, m);
        },
        use(f, m) {
          const T = f.T('theron_1b') ? 2.2 : 1.5;
          f.ws.vault = T; f.hover = 75; f.addStatus('untargetable', T + 0.1);
          m.fx({ type: 'line', x1: f.x, y1: f.y, x2: f.x, y2: f.y - 60, color: '#e0c070', life: 0.3, w: 5 });
        } },
      D: { name: 'Quét Chân', cd: 3, desc: 'Đặc kỹ ngắt chiêu: quét thương tầm thấp 360°. Kẻ địch trúng chiêu bị NGÃ (mất kiểm soát 0.5s).',
        ai: { type: 'atk', max: 120, pri: 2.2, when: (f, t) => (t.action && t.action.atk) || dist(f, t) < 90 },
        use(f, m) {
          // Hất Tung Phá Trận: móc cán thương hất tung 1.2s
          if (f.T('theron_6a')) { f.act(0.32, { move: 0.2, anim: 'raise', atk: true }, [[0.09, () => m.hitArc(f, { range: 135, arc: 130, dmg: 5, kb: 40, kg: 1, knockup: 900, trueDmg: true, tag: 'D' })]]); return; }
          const fell = f.T('theron_3b') ? { root: 1, silence: 1 } : {};
          f.act(0.32, { move: 0.2, anim: 'spin', atk: true }, [[0.09, () => m.hitCircle(f, Object.assign({ r: 128, dmg: 4, kb: 60, kg: 1.5, stun: 0.5, trip: true, tag: 'D' }, fell))]]);
        } },
      B: { name: 'Xung Phong', cd: 5, desc: 'Kết liễu: chạy đà và đâm về trước. Trúng địch: ủi địch đi theo. Ủi trúng tường/cột: địch bị GHIM (Choáng 1.5s) — đòn combo mạnh nhất. Không có tường: hất văng ở cuối đà.',
        ai: { type: 'atk', min: 60, max: 300, pri: 2.3 },
        use(f, m) {
          if (f.T('theron_9c')) f.addStatus('unstoppable', 0.85);
          const pierce = f.T('theron_12a'), hit = new Set();
          f.act(0.75, { move: 0, anim: 'thrust', atk: true, super: true }, [[0.2, () => {
            f.startDash({ angle: f.facing, dist: pierce ? 410 : 340, dur: 0.46, trail: true, phase: pierce,
              onContact: (e) => {
                if (!f.ws.carry && m.applyHit(f, e, { dmg: 4, noKnock: true, trueDmg: true, tag: 'B' }) && !e.has('unstoppable')) { f.ws.carry = e; e.carry = { by: f, t: 0.7, phase: pierce }; e.action = null; e.cancelDash(); hit.add(e); }
                // Đâm Xuyên Vạn Quân: cuốn theo mọi kẻ địch khác trên đường
                else if (pierce && e !== f.ws.carry && !hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 5, kb: 210, kg: 5, trueDmg: true, tag: 'B', angle: f.facing }); }
                return false;
              },
              onEnd: () => spearRelease(f, m) });
          }]]);
        } },
      U: { name: 'Mưa Thương', desc: 'Phóng thương lên trời: hàng chục cây thương ánh sáng rơi xuống khắp sàn trong 4s. Dính thương bị GHIM tại chỗ (trói chân).',
        ai: { type: 'atk', max: 600, pri: 4 },
        use(f, m) {
          f.act(0.4, { move: 0, anim: 'raise' });
          for (let i = 0; i < 32; i++) m.later(0.3 + i * 0.12, () => {
            const t = m.nearestEnemy(f);
            let p;
            if (t && Math.random() < 0.55) p = { x: t.x + rand(-90, 90) + t.moveDir.x * 60, y: t.y + rand(-90, 90) + t.moveDir.y * 60 };
            else { const a = rand(0, TAU), r = rand(0, 1) * Math.min(m.arena.hx, m.arena.hy); p = { x: Math.cos(a) * r, y: Math.sin(a) * r }; }
            m.fx({ type: 'telegraph', x: p.x, y: p.y, r: 42, color: '#ffe9a0', life: 0.5 });
            m.later(0.5, () => {
              m.hitCircle(f, { x: p.x, y: p.y, r: 42, dmg: 3, kb: 40, kg: 1, root: f.T('theron_9a') ? 2.5 : 0.8, trueDmg: true, tag: 'U', quiet: true });
              m.fx({ type: 'line', x1: p.x, y1: p.y - 70, x2: p.x, y2: p.y, color: '#fff6c0', life: 0.35, w: 5 });
            });
          });
        } },
    },
  },

  // ================= THE VOICE (Aria & Oktava) =================
  voice: {
    name: 'The Voice', icon: '🎵', color: '#7ae0a0', weight: 0.85, speed: 1.0, gfx: 'voice', noRage: true,
    role: 'Nhạc sư • Triệu hồi', ai: { range: 210, defend: ['B'], ranged: true },
    passive: { name: 'Bóng Hình Âm Vang & Hòa Âm', desc: 'Bắt đầu trận cùng Người Bảo Hộ Oktava (nhận điểm văng như người chơi, rơi đài thì hồi sinh sau 45s). A, B, C dùng chung hồi chiêu: 3 nốt liên tiếp tạo thành 1 Bản Nhạc cường hóa theo nốt được bấm nhiều nhất (đều nhau = Hòa Âm Hỗn Hợp). Không thể bị tấn công bởi Cung (mẹ ruột) và Găng Tay Vuốt (thú cưng).' },
    init(f) { f.ws.notes = []; f.ws.songs = 0; f.ws.guard = null; f.ws.guardT = 0; f.ws.mounted = 0; f.ws.needSpawn = true; f.ws.noteT = 0; f.ws.reflT = 0; f.ws.duoT = 2; },
    ultReady(f) { return f.ws.songs >= songNeed(f); },
    resource(f) {
      const g = f.ws.guard;
      return `🎼 ${f.ws.notes.join('') || '–'} • Bản nhạc ${f.ws.songs}/${songNeed(f)} • ` + (g && g.alive ? (f.ws.mounted > 0 ? '🐘 Đang cưỡi' : '🐘 Oktava') : `🐘 hồi sinh ${Math.ceil(f.ws.guardT)}s`);
    },
    update(f, m, dt) {
      if (f.ws.needSpawn) { f.ws.needSpawn = false; voiceSpawnGuard(f, m); }
      const g = f.ws.guard;
      if ((!g || !g.alive) && f.ws.guardT > 0) { f.ws.guardT -= dt; if (f.ws.guardT <= 0) voiceSpawnGuard(f, m); }
      if (f.ws.reflT > 0) f.ws.reflT -= dt;
      // nốt Hòa Âm tan biến sau 5s không gõ (trừ Vọng Âm Cộng Hưởng)
      f.ws.noteT += dt;
      if (f.ws.notes.length && f.ws.noteT > 5 && !f.T('aria_6c')) { f.ws.notes = []; m.text(f.x, f.y - 50, '♪ nốt nhạc tan biến', '#9ab', 12); }
      // Song Tấu Độc Lập: Aria định kỳ hồi phục & tăng tốc cho cả hai
      if (f.T('aria_12c') && (f.ws.duoT -= dt) <= 0) {
        f.ws.duoT = 4;
        f.addStatus('regen', 3, 1.5);
        if (g && g.alive) { g.addStatus('regen', 3, 1.5); g.addStatus('haste', 3, 0.3); m.fx({ type: 'line', x1: f.x, y1: f.y, x2: g.x, y2: g.y, color: '#7aff9a', life: 0.35, w: 3 }); }
      }
      if (f.ws.mounted > 0) {
        f.ws.mounted -= dt;
        if (!g || !g.alive || f.ws.mounted <= 0) { f.ws.mounted = 0; if (g) g.hidden = false; }
        else f.frameSpeed *= 1.15;
      }
    },
    onMinionDead(f, mn, m) {
      if (mn !== f.ws.guard) return;
      const T = f.T('aria_1a') ? 25 : 45;
      f.ws.guard = null; f.ws.guardT = T; f.ws.mounted = 0;
      m.text(f.x, f.y - 60, `Oktava rơi đài! (hồi sinh ${T}s)`, '#7ae0a0', 15);
    },
    onIncoming(f, att, hit, m) {
      const g = f.ws.guard;
      if (f.ws.mounted > 0 && g && g.alive && att !== g) { m.applyHit(att, g, hit); return false; }
      return true;
    },
    onUse(f, key, m) {
      if (!'ABC'.includes(key)) return;
      f.ws.notes.push(key); f.ws.noteT = 0;
      m.sfx({ A: 'note_1', B: 'note_2', C: 'note_3' }[key]);
      if (f.ws.notes.length >= 3) { const n = f.ws.notes; f.ws.notes = []; voiceSong(f, m, n); f.ws.songs = Math.min(songNeed(f), f.ws.songs + 1); }
    },
    skills: {
      A: { name: 'Nốt Đỏ — Tấn Công', cd: 2.1, group: 'note', desc: 'Oktava nhảy dậm vào vị trí địch; Aria gây 1 đợt sát thương vòng tròn quanh mình. Hòa Âm A: dậm to hơn, Aria nổ 3 lần, lần cuối CHOÁNG.',
        ai: { type: 'atk', max: 330, pri: 2 },
        use(f, m) {
          const t = m.nearestEnemy(f), g = voiceGuard(f);
          if (g && t) guardLeap(g, m, t.x, t.y, () => m.hitCircle(f, { x: g.x, y: g.y, r: 85, dmg: 6, kb: 150, kg: 5, tag: 'A' }));
          const R = f.T('aria_1c') ? 114 : 88;
          f.act(0.3, { move: 0.4, anim: 'cast', atk: true }, [[0.1, () => { m.hitCircle(f, { r: R, dmg: 4, kb: 110, kg: 4, tag: 'A', quiet: true }); m.fx({ type: 'ring', x: f.x, y: f.y, r: R, color: '#ff6a6a', life: 0.35, w: 6 }); }]]);
        } },
      B: { name: 'Nốt Xanh — Linh Hoạt', cd: 2.1, group: 'note', desc: 'Cả hai tăng tốc; Aria không thể bị chọn làm mục tiêu, xóa hiệu ứng xấu và miễn đẩy lùi chớp nhoáng. Hòa Âm B: 3 đợt sóng âm — trúng 1: Làm chậm, 2: Trói chân, 3: MÊ HOẶC (tự đi nộp mạng cho Oktava).',
        ai: { type: 'def', max: 400 },
        use(f, m) {
          f.cleanse(); f.addStatus('haste', 2, 0.4); f.addStatus('untargetable', 0.6); f.addStatus('ironbody', 0.35);
          const g = voiceGuard(f); if (g) g.addStatus('haste', 2, 0.4);
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 50, color: '#6ab0ff', life: 0.35, w: 4 });
        } },
      C: { name: 'Nốt Vàng — Phòng Thủ', cd: 2.1, group: 'note', desc: 'Oktava lao ngược về phía Aria, làm choáng kẻ địch trên đường. Aria nhận lớp khiên. Hòa Âm C: Oktava dậm thẳng xuống chỗ Aria đẩy lùi cực mạnh, khiên có thêm Hồi Phục.',
        ai: { type: 'def', max: 300 },
        // Sóng Phản Xạ: tiếng gầm dội ngược mọi đạn đạo đối phương
        recast(f) { return f.T('aria_6b') && f.ws.reflT > 0; },
        recastAi: (f, t, m) => { const g = f.ws.guard; return m.projs.some((p) => !p.dead && p.owner.team !== f.team && (Math.hypot(p.x - f.x, p.y - f.y) < 240 || (g && g.alive && Math.hypot(p.x - g.x, p.y - g.y) < 240))); },
        recastUse(f, m) {
          f.ws.reflT = 0;
          const g = f.ws.guard, src = [f].concat(g && g.alive && !g.hidden ? [g] : []);
          let n = 0;
          for (const p of m.projs) {
            if (p.dead || p.owner.team === f.team || !src.some((s) => Math.hypot(p.x - s.x, p.y - s.y) < 280)) continue;
            const back = p.owner;
            p.owner = f; p.ang += Math.PI; p.vx = -p.vx; p.vy = -p.vy; p.traveled = 0; p.hitSet = new Set();
            if (back && back.alive) { const a = Math.atan2(back.y - p.y, back.x - p.x); p.ang = a; p.vx = Math.cos(a) * p.speed; p.vy = Math.sin(a) * p.speed; }
            n++;
          }
          for (const s of src) m.fx({ type: 'ring', x: s.x, y: s.y, r: 140, color: '#ffe9a0', life: 0.4, w: 8 });
          m.text(f.x, f.y - 60, n ? `🔊 PHẢN XẠ x${n}!` : '🔊 GẦM VANG', '#ffe9a0', 16); m.sfx('magic_burst', { vol: 0.7 });
        },
        use(f, m) {
          f.addStatus('shield', 4, 7);
          if (f.T('aria_6b')) f.ws.reflT = 1.8;
          const g = voiceGuard(f);
          if (g && dist(g, f) > 40) {
            const hit = new Set();
            g.action = null;
            g.startDash({ angle: angTo(g, f), dist: Math.max(10, dist(g, f) - 30), dur: 0.3, stopAtEdge: true, trail: true,
              onContact: (e) => { if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 3, kb: 90, kg: 2, stun: 0.6, tag: 'C', src: g }); } return false; } });
          }
        } },
      D: { name: 'Gắn Kết', cd: 12, desc: 'Aria nhảy lên cưỡi Oktava 5s: di chuyển bằng gã khổng lồ, mọi đòn đánh vào Aria đều do Oktava gánh.',
        ai: { type: 'def', max: 140 },
        can(f) { const g = f.ws.guard; return !!(g && g.alive && f.ws.mounted <= 0); },
        use(f, m) {
          const g = f.ws.guard;
          // Đổi Chỗ Tức Thời: đứng xa Oktava → hoán đổi vị trí
          if (f.T('aria_12b') && dist(f, g) > 220) {
            const p = { x: f.x, y: f.y };
            m.fx({ type: 'line', x1: f.x, y1: f.y, x2: g.x, y2: g.y, color: '#7ae0a0', life: 0.35, w: 4 });
            f.x = g.x; f.y = g.y; g.x = p.x; g.y = p.y; f.vx = f.vy = 0; f.invulnT = Math.max(f.invulnT, 0.25); g.action = null; g.cancelDash();
            m.text(f.x, f.y - 56, '🔁 ĐỔI CHỖ!', '#7ae0a0', 16);
            f.cd.D = f.cdOf('D') * 0.6;
            return;
          }
          // Nhập Thể Âm Vang: hòa làm một, hóa khổng lồ 5s
          if (f.T('aria_6a')) {
            f.x = g.x; f.y = g.y; g.hidden = true; g.action = null;
            f.ws.merged = 5; f.setForm('oktaform');
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 90, color: '#7ae0a0', life: 0.5, w: 8 }); m.shake(6);
            m.text(f.x, f.y - 70, '🐘 NHẬP THỂ ÂM VANG!', '#7ae0a0', 18);
            return;
          }
          f.ws.mounted = 5; f.x = g.x; f.y = g.y; g.hidden = true; g.action = null;
          m.text(f.x, f.y - 60, 'GẮN KẾT!', '#7ae0a0', 18);
        } },
      U: { name: 'Bản Giao Hưởng Tử Thần', desc: 'Chỉ dùng được khi đã đánh xong 3 Bản Nhạc. Phóng làn sóng âm MÊ HOẶC mọi kẻ địch trên đường đi. Nếu sóng chạm Oktava: gã nhận Bất Tử và đòn đánh được cường hóa cực khủng khiếp.',
        ai: { type: 'atk', max: 650, pri: 6 },
        use(f, m) {
          f.ws.songs = 0;
          const a = aimOr(f, m, 800, 700);
          const g = f.ws.guard;
          shoot(f, m, a, { speed: 700, r: 55, range: 820, kind: 'sonic', color: '#ff9ad5', pierce: true, breaker: true, hit: { dmg: 6, kb: 60, kg: 1, tag: 'U' },
            onHit: (mm, p, t) => charm(t, voiceGuard(f) || f, 2.2) });
          if (g && g.alive) {
            const dx = g.x - f.x, dy = g.y - f.y, along = dx * Math.cos(a) + dy * Math.sin(a), perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
            if (along > -40 && along < 820 && perp < 85) m.later(Math.max(0, along) / 700, () => {
              if (!g.alive) return;
              g.addStatus('immortal', 6); g.addStatus('empower', 6, 1.5);
              m.text(g.x, g.y - 60, 'OKTAVA BẤT TỬ!', '#ffd700', 20);
            });
          }
          m.shake(8);
        } },
    },
  },

  // ================= THE HAND (Roxie & T-Zero) =================
  hand: {
    name: 'The Hand', icon: '⚙️', color: '#ffb030', weight: 0.9, speed: 1.05, gfx: 'wrench', noRage: true,
    role: 'Kỹ sư • Robot', ai: { range: 230, defend: ['C'], ranged: true },
    passive: { name: 'Bánh Răng & Sáng Tạo', desc: 'Liên tục nhặt bánh răng rơi trên sàn: mỗi bánh răng tăng 3% tốc chạy và +1 điểm nội tại (tối đa 9). Không dùng thanh nộ — sức mạnh tối thượng là Thiết Vệ T-Zero (chiêu D).' },
    init(f) { f.ws.gears = 0; f.ws.parts = 0; f.ws.cannons = []; f.ws.cannon = null; f.ws.mech = null; },
    resource(f) { return `⚙️ ${f.ws.gears} • Mảnh ${f.ws.parts}/3` + (f.ws.cannons.length ? ` • 🛠 Ụ pháo x${f.ws.cannons.length}` : '') + (f.ws.mech ? ' • 🤖 T-Zero' : ''); },
    update(f, m, dt) {
      f.frameSpeed *= 1 + 0.03 * f.ws.gears;
      f.ws.cannons = f.ws.cannons.filter((c) => c.alive);
      const t = m.nearestEnemy(f);
      // ụ pháo "hiện tại" = ụ gần đối thủ nhất
      f.ws.cannon = f.ws.cannons.slice().sort((a, b) => (t ? dist(a, t) - dist(b, t) : 0))[0] || null;
      if (f.ws.mech && !f.ws.mech.alive) f.ws.mech = null;
    },
    skills: {
      A: { name: 'Khai Hỏa / Pháo Kích', cd: 0.45, desc: 'Bấm: bắn 1 viên đạn cấu rỉa. Giữ (cần 2 bánh răng): dựng Ụ Pháo cố định tự động bắn địch.',
        ai: { type: 'atk', min: 30, max: 450, pri: 2 },
        use(f, m) {
          // Bệ Phóng Lò Xo: giữ A khi chưa đủ bánh răng dựng pháo
          if (f.intent && f.intent.hold && f.T('roxie_6b') && !(f.ws.gears >= 2 && f.ws.cannons.length < cannonMax(f))) {
            if ((f.ws.padCd || 0) > m.time) return;
            f.ws.padCd = m.time + 6;
            const p = m.arena.clamp({ x: f.x + Math.cos(f.facing) * 70, y: f.y + Math.sin(f.facing) * 70 }, 30);
            springPad(f, m, p);
            f.act(0.25, { move: 0, anim: 'cast' });
            return;
          }
          if (f.intent && f.intent.hold && f.ws.gears >= 2 && f.ws.cannons.length < cannonMax(f)) {
            f.ws.gears -= 2;
            const p = m.arena.clamp({ x: f.x + Math.cos(f.facing) * 46, y: f.y + Math.sin(f.facing) * 46 }, 30);
            f.ws.cannon = m.addMinion(new Minion(f, 'cannon', p.x, p.y, 'Ụ Pháo'));
            f.ws.cannons.push(f.ws.cannon);
            f.act(0.3, { move: 0, anim: 'cast' });
            m.text(p.x, p.y - 40, 'Ụ PHÁO!', '#ffb030', 15); m.sfx('robot', { rate: 1.5, vol: 0.6 });
            return;
          }
          f.act(0.18, { move: 0.8, anim: 'aim', atk: true }, [[0.04, () => shoot(f, m, aimOr(f, m, 460, 950), { speed: 950, r: 4, range: 460, kind: 'bullet', color: '#ffd27a', hit: { dmg: 3.8, kb: 50, kg: 2.6, tag: 'A' } })]]);
        } },
      B: { name: 'Khai Tâm', cd: 2, desc: 'Kích nổ Ụ Pháo hiện tại: nổ quanh ụ, nhận lại 2 bánh răng và tăng mạnh tốc chạy + sát thương trong 4s.',
        ai: { type: 'buff', max: 9999, pri: 2, when: (f, t) => dist(f.ws.cannon, t) < 110 || Math.random() < 0.15 },
        can(f) { return !!f.ws.cannon; },
        use(f, m) {
          const c = f.ws.cannon;
          explode(f, m, c.x, c.y, 100, { dmg: 6, kb: 210, kg: 5, tag: 'B' });
          m.removeMinion(c); f.ws.cannons = f.ws.cannons.filter((q) => q !== c); f.ws.cannon = f.ws.cannons[0] || null;
          if (f.T('roxie_3a')) m.zone({ owner: f, x: c.x, y: c.y, r: 115, life: 3, every: 0.2, kind: 'oil', color: 'rgba(30,22,14,0.45)',
            tick: (mm, z) => { for (const e of mm.enemiesOf(f)) if (Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) e.addStatus('slow', 0.4, 0.5); } });
          f.ws.gears = Math.min(9, f.ws.gears + 2);
          // Giáp Phản Lực: hút ụ pháo thành giáp cơ giới thay vì tăng tốc
          if (f.T('roxie_6a')) { f.addStatus('rarmor', 3); m.text(f.x, f.y - 56, '🛡 GIÁP PHẢN LỰC', '#ffb030', 16); m.fx({ type: 'line', x1: c.x, y1: c.y, x2: f.x, y2: f.y, color: '#ffb030', life: 0.3, w: 6 }); }
          else { f.addStatus('haste', 4, 0.5); f.addStatus('empower', 4, 0.3); }
        } },
      C: { name: 'Bất Ngờ Chưa', cd: 6, breakCC: true, desc: 'Nhảy lộn ra sau, gây sát thương và CHOÁNG kẻ địch tại chỗ cũ. Dùng được ngay cả khi đang bị Choáng/khống chế để lật kèo.',
        ai: { type: 'def', max: 200, mob: 'escape' },
        use(f, m) {
          m.hitCircle(f, { r: 82, dmg: 5, kb: 160, kg: 4, stun: f.T('roxie_3c') ? 1.3 : 0.8, tag: 'C' });
          m.text(f.x, f.y - 50, 'BẤT NGỜ CHƯA!', '#ffb030', 18);
          const t = m.nearestEnemy(f);
          f.vz = 380; f.z = 1;
          f.startDash({ angle: t ? escapeAngle(f, t, m) : f.facing + Math.PI, dist: f.T('roxie_1c') ? 192 : 160, dur: 0.24, invuln: true });
        } },
      D: { name: 'Gia Công & Thiết Vệ', cd: 1, desc: 'Dùng 3 bánh răng ghép 1 Mảnh cơ giới. Đủ 3 Mảnh: gọi Thiết Vệ T-Zero — Bấm: tự lái cỗ máy (A đấm/sấy, B phun lửa, C húc, D móc kéo/tự hủy). Giữ: T-Zero tự hành chiến đấu, bạn vẫn bắn bên ngoài.',
        ai: { type: 'buff', max: 9999, pri: 3 },
        can(f) { return (f.ws.parts < 3 && f.ws.gears >= gearCost(f)) || (f.ws.parts >= 3 && !f.ws.mech); },
        use(f, m) {
          if (f.ws.parts >= 3) {
            f.ws.parts = 0;
            if (f.T('roxie_12a')) callSiege(f, m);
            else if (f.T('roxie_12c')) callCyborg(f, m);
            else if (f.intent && f.intent.hold) callMechAuto(f, m); else callMechPilot(f, m);
          }
          else { f.ws.gears -= gearCost(f); f.ws.parts++; m.text(f.x, f.y - 44, `🔧 Mảnh cơ giới ${f.ws.parts}/3`, '#ffb030', 14); }
        } },
    },
  },

  // ================= LỤC Ổ XOAY (Jack "Sáu Lỗ") — Con Bạc Khát Máu =================
  luc_xoay: {
    name: 'Lục Ổ Xoay', icon: '🎲', color: '#c0a080', weight: 1.0, speed: 1.0, gfx: 'revolver',
    role: 'Tầm trung • Con bạc liều mạng', ai: { range: 200, defend: ['C'], ranged: true },
    passive: { name: 'Gieo Xúc Xắc', desc: 'Ổ xoay 6 viên, hết đạn nạp lại 2.2s. Mỗi lần nạp ổ lại gieo 1 xúc xắc (bàn tay may mắn: ⚀ chỉ 8%, ⚅ tới 24%): ⚀ thua bạc — tự nhận +6% điểm văng; ⚁–⚄ cả ổ đạn tăng 10–40% sát thương; ⚅ độc đắc — cả ổ đều là Viên Định Mệnh (x2.2 sát thương & lực văng, choáng).' },
    init(f) { f.ws.cylMax = f.T('jack_12b') ? 8 : 6; f.ws.cyl = f.ws.cylMax; f.ws.rl = 0; f.ws.dice = 0; f.ws.rr = null; f.ws.allinT = 0; f.ws.noGun = 0; },
    resource(f) {
      if (f.ws.noGun > 0) return `🔫 Đi nhặt súng ${f.ws.noGun.toFixed(1)}s`;
      if (f.ws.rr) return `🎰 CÒ QUAY NGA — lần bóp ${f.ws.rr.pos + 1}/6`;
      const face = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][f.ws.dice] || '';
      return (f.ws.allinT > 0 ? '↯ D: CƯỢC TẤT TAY • ' : '') + (f.ws.cyl > 0 ? `Ổ ${f.ws.cyl}/${f.ws.cylMax} ${face}` : `Nạp ổ ${(2.2 * f.cdMult * (f.rlG || 1) - f.ws.rl).toFixed(1)}s`) + (f.house ? ` • 🏦 Nhà cái x${f.house}` : '');
    },
    update(f, m, dt) {
      if (f.ws.allinT > 0) f.ws.allinT -= dt;
      if (f.ws.noGun > 0) { f.ws.noGun -= dt; if (f.ws.noGun <= 0) { f.ws.cyl = 0; f.ws.rl = 0; } return; }
      if (f.ws.cyl <= 0 && !f.ws.rr) {
        f.ws.rl += dt;
        if (f.ws.rl >= 2.2 * f.cdMult * (f.rlG || 1)) { f.ws.cyl = f.ws.cylMax; f.ws.rl = 0; revDice(f, m); m.sfx('gun_reload'); }
      }
    },
    onDeal(f, t, hit, info, m) {
      if (f.house) { info.mult *= 1 + 0.12 * f.house; info.kbMult *= 1 + 0.08 * f.house; }
      // Viên Đạn Sinh Tử: mục tiêu trên ngưỡng → văng khỏi sàn ngay lập tức
      if (hit.execute && t.percent >= hit.execute && !t.has('immortal')) { info.fixedKb = 2800; m.text(t.x, t.y - 70, '☠ SINH TỬ!', '#ff2020', 26); }
    },
    skills: {
      A: { name: 'Bắn / Bóp Cò', cd: 0.6, desc: 'Bắn 1 viên tự ngắm. Khi đang chơi Cò Quay Nga: bóp cò — ổ trống thì chỉ nghe "cạch", trúng viên đạn thì phát súng tử thần nổ ra.',
        ai: { type: 'atk', min: 40, max: 480, pri: 2 },
        can(f) { return f.ws.noGun <= 0 && (!!f.ws.rr || f.ws.cyl > 0); },
        use(f, m) {
          if (f.ws.rr) return roulettePull(f, m);
          // Bắn Nhanh (Fan the Hammer): giữ A xả 3 viên liên thanh, lực giật đẩy lùi
          if (f.T('jack_6b') && f.intent && f.intent.hold && f.ws.cyl >= 2) {
            const n = Math.min(3, f.ws.cyl), a = aimOr(f, m, 520, 1050), ev = [];
            for (let i = 0; i < n; i++) ev.push([0.03 + i * 0.05, () => revShot(f, m, a + rand(-0.05, 0.05), 'A')]);
            f.act(0.05 * n + 0.12, { move: 0, anim: 'aim', atk: true }, ev);
            f.startDash({ angle: a + Math.PI, dist: 85, dur: 0.2 });
            return;
          }
          f.act(0.22, { move: 0.7, anim: 'aim', atk: true }, [[0.04, () => revShot(f, m, aimOr(f, m, 520, 1050), 'A')]]);
        } },
      B: { name: 'Quạt Cò', cd: 3, desc: 'Xả toàn bộ số đạn còn lại trong ổ thành hình nón. Bị khóa khi đang chơi Cò Quay Nga.',
        ai: { type: 'atk', min: 20, max: 240, pri: 2.4, when: (f) => f.ws.cyl >= 3 },
        can(f) { return !f.ws.rr && f.ws.cyl > 0 && f.ws.noGun <= 0; },
        use(f, m) {
          const n = f.ws.cyl, ev = [];
          const allIn = f.T('jack_3b');
          for (let i = 0; i < n; i++) ev.push([0.03 + i * 0.08, () => revShot(f, m, aimOr(f, m, 520, 1050) + rand(-0.26, 0.26), 'B', 520, allIn && f.ws.cyl === 1 ? { stun: 0.75 } : null)]);
          f.act(0.08 * n + 0.12, { move: 0.4, anim: 'aim', atk: true }, ev);
        } },
      C: { name: 'Lăn Né', cd: 4, desc: 'Lăn tránh (miễn sát thương khi lăn) và nhét thêm 2 viên vào ổ. Bị khóa khi đang chơi Cò Quay Nga.',
        ai: { type: 'def', max: 200, mob: 'escape' },
        can(f) { return !f.ws.rr && f.ws.noGun <= 0; },
        use(f, m) {
          // Nạp Đạn Liều Lĩnh: vừa nạp đầy ổ vừa xoay súng xả đạn mù xung quanh
          if (f.T('jack_6a')) {
            f.ws.cyl = f.ws.cylMax; f.ws.rl = 0;
            const ev = [];
            for (let i = 0; i < 6; i++) ev.push([0.04 + i * 0.06, () => shoot(f, m, f.facing + i * TAU / 6 + rand(-0.15, 0.15), { speed: 1000, r: 5, range: 260, kind: 'bullet', color: '#ffe9c0', hit: { dmg: 3, kb: 95, kg: 2.6, tag: 'C' } })]);
            f.act(0.42, { move: 0.4, anim: 'spin', atk: true }, ev);
            m.sfx('gun_reload'); m.text(f.x, f.y - 50, '🌀 NẠP LIỀU!', '#ffd27a', 14);
            return;
          }
          f.startDash({ angle: f.castAngle, dist: 135, dur: 0.2, invuln: true }); f.ws.cyl = Math.min(f.ws.cylMax, f.ws.cyl + 2); f.act(0.22, { move: 0 });
        } },
      D: { name: 'Cò Quay Nga', cd: 12, desc: 'Tháo toàn bộ đạn, chỉ nạp lại ĐÚNG 1 viên vào ổ 6 rồi xoay ổ. Bị khóa B và C (bỏ cả phòng thủ lẫn chạy trốn). Mỗi lần bóp cò (A) có thể là ổ trống... cho tới khi viên đạn tử thần nổ: sát thương 600%, xuyên mọi kháng/khiên, văng cực mạnh.',
        ai: { type: 'buff', max: 9999, pri: 2 },
        can(f) { return !f.ws.rr && f.ws.noGun <= 0; },
        // Cược Tất Tay: ném luôn khẩu súng phát nổ toàn màn hình
        recast(f) { return f.T('jack_12a') && f.ws.allinT > 0; },
        recastAi: () => true,
        recastUse(f, m) {
          f.ws.allinT = 0; f.ws.cyl = 0; f.ws.noGun = 3;
          for (const e of m.enemiesOf(f)) m.applyHit(f, e, { dmg: 10, kb: 210, kg: 5.5, tag: 'D', angle: angTo(f, e) });
          m.fx({ type: 'boom', x: f.x, y: f.y, r: 260, color: '#ffd27a', life: 0.6 }); m.fx({ type: 'flash', x: f.x, y: f.y, r: 400, color: '#fff3c0', life: 0.25 });
          m.shake(20); m.sfx('boom_big'); m.text(f.x, f.y - 70, '💣 CƯỢC TẤT TAY!!!', '#ffd700', 22);
        },
        use(f, m) {
          f.ws.cyl = 0; f.ws.rl = 0;
          f.ws.rr = { live: Math.random() < 0.4 ? Math.min(randi(0, 5), randi(0, 5)) : randi(0, 5), pos: 0 };
          f.act(0.5, { move: 0, anim: 'cast' });
          m.text(f.x, f.y - 60, '🎰 Tháo hết đạn... còn 1 viên', '#ffd27a', 16);
        } },
      U: { name: 'Nhà Cái Trả Thưởng', desc: 'Phần thưởng cho kẻ liều mạng sống sót: cộng VĨNH VIỄN (tới hết trận) +12% sát thương và +8% lực văng, cộng dồn. Nạp đầy ổ và gieo ngay một con ⚅.',
        ai: { type: 'buff', max: 9999 },
        use(f, m) {
          f.house = (f.house || 0) + 1;
          if (!f.ws.rr && f.ws.noGun <= 0) { f.ws.cyl = f.ws.cylMax; f.ws.rl = 0; f.ws.dice = 6; }
          m.text(f.x, f.y - 64, `🏦 NHÀ CÁI TRẢ THƯỞNG x${f.house}`, '#ffd700', 20); m.shake(6);
        } },
    },
  },

  // ================= SONG LỤC (Chrono & Neo) =================
  song_luc: {
    name: 'Song Lục', icon: '⏳', color: '#6ac0ff', weight: 1.0, speed: 1.05, gfx: 'dual',
    role: 'Đổi thế • Quá khứ & Tương lai', ai: { range: 200, defend: ['C'], ranged: true },
    passive: { name: 'Hai Thời Đại', desc: 'Hai thế đánh, mỗi thế có băng đạn riêng. CHRONO (Quá khứ — Cựu binh mang nặng chấp niệm): 4 viên đạn nặng bắn rất đau, nạp lại cực chậm 6s, +20% trọng lượng. NEO (Tương lai — Kẻ thao túng thời không): 10 viên đạn nhẹ bay nhanh, nạp 3s, +12% tốc chạy. Chiêu D đổi thế.' },
    init(f) {
      f.ws.magC = f.T('songluc_1a') ? 5 : 4; f.ws.magN = f.T('songluc_1a') ? 11 : 10; f.ws.rlK = f.T('songluc_1b') ? 0.75 : 1;
      f.ws.stance = 'chrono'; f.ws.ammoC = f.ws.magC; f.ws.rlC = 0; f.ws.ammoN = f.ws.magN; f.ws.rlN = 0; f.ws.fuse = 0; f.ws.rewind = null; f.ws.cBoom = null; f.ws.lotus = null; f.ws.lx = 0;
    },
    resource(f) {
      const c = f.ws.ammoC > 0 ? `${f.ws.ammoC}/${f.ws.magC}` : `nạp ${(6 * f.ws.rlK * f.cdMult * (f.rlG || 1) - f.ws.rlC).toFixed(1)}s`;
      const n = f.ws.ammoN > 0 ? `${f.ws.ammoN}/${f.ws.magN}` : `nạp ${(3 * f.ws.rlK * f.cdMult * (f.rlG || 1) - f.ws.rlN).toFixed(1)}s`;
      return (f.ws.fuse > 0 ? '🪷 LIÊN HOA' : f.ws.stance === 'chrono' ? '🕰 CHRONO' : '🔮 NEO') + ` • 🕰${c} 🔮${n}` + (f.ws.rewind ? ' • ↯ C: giật về ảo ảnh' : '');
    },
    update(f, m, dt) {
      if (f.ws.fuse > 0) f.ws.fuse -= dt;
      if (f.ws.lx > 0) f.ws.lx -= dt;
      const chrono = f.ws.stance === 'chrono' || f.ws.fuse > 0, neo = f.ws.stance === 'neo' || f.ws.fuse > 0;
      if (chrono) f.frameWeight *= 1.2;
      if (neo) f.frameSpeed *= 1.12;
      if (f.ws.ammoC <= 0) { f.ws.rlC += dt; if (f.ws.rlC >= 6 * f.ws.rlK * f.cdMult * (f.rlG || 1)) { f.ws.rlC = 0; f.ws.ammoC = f.ws.magC; m.sfx('gun_reload', { rate: 0.85 }); } }
      if (f.ws.ammoN <= 0) { f.ws.rlN += dt; if (f.ws.rlN >= 3 * f.ws.rlK * f.cdMult * (f.rlG || 1)) { f.ws.rlN = 0; f.ws.ammoN = f.ws.magN; m.sfx('gun_reload', { rate: 1.3 }); } }
      // ảo ảnh: tự chọn giật về hoặc để nó đánh lạc hướng (không còn tự tua ngược)
      if (f.ws.rewind) { f.ws.rewind.t -= dt; if (f.ws.rewind.t <= 0 || !f.ws.rewind.decoy.alive) f.ws.rewind = null; }
      if (f.ws.cBoom) { f.ws.cBoom.t -= dt; if (f.ws.cBoom.t <= 0) f.ws.cBoom = null; }
      // Nộ Liên Hoa: xả đạn hình hoa sen nở quanh người
      const L = f.ws.lotus;
      if (L) {
        L.t += dt; L.acc += dt;
        while (L.acc >= 0.3 && L.t < 6) { L.acc -= 0.3; lotusWave(f, m, L.w++, L.k); }
        if (L.t >= 6) { f.ws.lotus = null; lotusBloom(f, m, L.k); }
      }
    },
    skills: {
      A: { name: 'Bắn', cd: 0.45, desc: 'Đánh tích — Chrono: 1 viên đạn nặng đẩy mạnh. Neo: 2 viên đạn nhẹ bay rất nhanh. Mỗi thế tốn đạn trong băng của thế đó.',
        ai: { type: 'atk', min: 30, max: 470, pri: 2 },
        can(f) { const fu = f.ws.fuse > 0 || f.T('songluc_12b'); return ((f.ws.stance === 'chrono' || fu) && f.ws.ammoC > 0) || ((f.ws.stance === 'neo' || fu) && f.ws.ammoN > 0); },
        use(f, m) {
          f.act(0.2, { move: 0.7, anim: 'aim', atk: true }, [[0.04, () => {
            // Nghịch Lý Thời Gian: luôn bắn cả hai loại đạn
            const a = aimOr(f, m, 500, 1000), fu = f.ws.fuse > 0 || f.T('songluc_12b');
            if ((f.ws.stance === 'chrono' || fu) && f.ws.ammoC > 0) {
              f.ws.ammoC--;
              shoot(f, m, a, { speed: 900, r: 7, range: 480, kind: 'bullet', color: '#ffcf7a', hit: { dmg: 6.8, kb: 132, kg: 4.8, tag: 'A' } });
            }
            if ((f.ws.stance === 'neo' || fu) && f.ws.ammoN > 0) {
              for (const o of [-0.05, 0.05]) if (f.ws.ammoN > 0) { f.ws.ammoN--; shoot(f, m, a + o, { speed: 1350, r: 4, range: 520, kind: 'bullet', color: '#8af0ff', hit: { dmg: 2.3, kb: 38, kg: 1.9, tag: 'A' } }); }
            }
          }]]);
        } },
      D: { name: 'Chuyển Thế', cd: 2, desc: 'Đặc kỹ: đổi thế — quyết định đạn, tốc độ và tác dụng của mọi chiêu khác. Sang Chrono: sóng chấn đẩy lùi quanh người + Thiết Thân 1s. Sang Neo: tăng tốc 50% trong 1.5s.',
        ai: { type: 'buff', max: 9999, pri: 1 },
        use(f, m) {
          // Thời Gian Tự Do: mỗi lần đổi thế nạp ngay 1 viên cho thế mới • Đồng Hồ Cát Đồng Bộ: nạp đầy cả hai
          f.ws.swapT = m.time;
          if (f.T('songluc_6c')) { f.ws.ammoC = f.ws.magC; f.ws.ammoN = f.ws.magN; f.ws.rlC = f.ws.rlN = 0; }
          else if (f.T('songluc_9a')) { if (f.ws.stance === 'neo') f.ws.ammoC = Math.min(f.ws.magC, f.ws.ammoC + 1); else f.ws.ammoN = Math.min(f.ws.magN, f.ws.ammoN + 1); }
          if (f.ws.stance === 'neo') {
            f.ws.stance = 'chrono'; f.addStatus('ironbody', 1);
            m.hitCircle(f, { r: 95, dmg: 3, kb: 185, kg: 3, tag: 'D' });
            m.text(f.x, f.y - 50, '🕰 CHRONO', '#ffcf7a', 15);
          } else {
            f.ws.stance = 'neo'; f.addStatus('haste', 1.5, 0.5);
            m.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#8af0ff', life: 0.3, w: 4 });
            m.text(f.x, f.y - 50, '🔮 NEO', '#8af0ff', 15);
          }
        } },
      C: { name: 'Bước Thời Gian', cd: 3.5, desc: 'Chrono: tiến lên một bước với Thiết Thân 1s. Neo: lướt đi (miễn sát thương) và TÀNG HÌNH 0.5s, để lại ẢO ẢNH 2.5s ở chỗ cũ dụ đối thủ đánh nhầm; bấm C lần nữa để giật ngược về chỗ ảo ảnh bất cứ lúc nào.',
        ai: { type: 'def', max: 220, mob: 'escape' },
        recast(f) { return !!f.ws.rewind || (f.T('songluc_6a') && !!f.ws.cBoom); },
        recastAi: (f, t, m, d) => {
          if (f.ws.cBoom) return Math.hypot(t.x - f.ws.cBoom.x, t.y - f.ws.cBoom.y) < 115;
          const r = f.ws.rewind, dd = Math.hypot(t.x - r.x, t.y - r.y);
          // giật về khi: bị áp sát mà chỗ ảo ảnh an toàn hơn, sát mép, hoặc kẻ địch đã bỏ qua ảo ảnh
          if (d < 150 && dd > d + 60) return true;
          if (m.arena.edgeDist(f.x, f.y) < 70 && m.arena.edgeDist(r.x, r.y) > 120) return true;
          if (f.percent - r.p0 > 12) return true;
          return r.t < 0.35 && dd > d;
        },
        recastUse(f, m) {
          if (f.ws.rewind) return neoRewind(f, m);
          const b = f.ws.cBoom; f.ws.cBoom = null;
          explode(f, m, b.x, b.y, 105, { dmg: 6, kb: 205, kg: 5, tag: 'C' });
          m.text(b.x, b.y - 40, '💥 VỤ NỔ QUÁ KHỨ', '#ffcf7a', 15);
        },
        use(f, m) {
          if (f.ws.stance === 'chrono' && f.ws.fuse <= 0) {
            f.addStatus('ironbody', 1);
            if (f.T('songluc_6a')) f.ws.cBoom = { x: f.x, y: f.y, t: 1.6 };
            const t = m.nearestEnemy(f);
            f.startDash({ angle: t ? angTo(f, t) : f.facing, dist: 110, dur: 0.26, trail: true });
            return;
          }
          const o = { x: f.x, y: f.y };
          f.startDash({ angle: f.castAngle, dist: f.T('songluc_1c') ? 230 : 185, dur: 0.2, invuln: true, trail: true });
          f.addStatus('untargetable', 0.5); f.addStatus('invis', 0.5);
          const d = m.addMinion(new Minion(f, 'decoy', o.x, o.y, f.name));
          d.facing = f.facing; d.percent = f.percent; d.life = 2.5;
          f.ws.rewind = { x: o.x, y: o.y, t: 2.5, decoy: d, p0: f.percent };
          // kẻ địch có xu hướng đánh vào ảo ảnh
          lureEnemies(f, [d], m, 2.5);
        } },
      B: { name: 'Thời Khắc', cd: 7.5, desc: 'Kết liễu — Chrono: thế Liên Xạ 5s — vừa đi chậm vừa xả đạn liên tục, KHÔNG THỂ CẢN PHÁ (lấy thân chịu đòn). Neo: Mưa Đạn — 7 viên tỏa rộng (không có miễn nhiễm khống chế).',
        ai: { type: 'atk', min: 40, max: 380, pri: 2.6 },
        // Giao Thoa Không Gian: đang Liên Xạ → kéo mọi kẻ địch về trước nòng súng
        recast(f) { return f.T('songluc_12a') && f.ws.lx > 0 && !f.ws.warped; }, recastBusy: true,
        recastAi: (f, t, m, d) => d > 160 && d < 430,
        recastUse(f, m) {
          f.ws.warped = true;
          for (const e of m.enemiesOf(f)) if (!e.isMinion && dist(e, f) < 440) pullTo(f, e, 85, 1100, 0.5);
          m.fx({ type: 'ring', x: f.x, y: f.y, r: 440, color: '#6ac0ff', life: 0.5, w: 8 });
          m.text(f.x, f.y - 70, '🌀 GIAO THOA KHÔNG GIAN!', '#8af0ff', 17);
        },
        use(f, m) {
          if (f.ws.stance === 'chrono') {
            const ev = [], hit = Object.assign({ dmg: 1.6, kb: 48, kg: 1.8, tag: 'B' }, f.T('songluc_3a') ? { burn: [1.5, 2] } : {});
            for (let i = 0; i < 20; i++) ev.push([0.05 + i * 0.25, () => shoot(f, m, aimOr(f, m, 480, 900) + rand(-0.08, 0.08), { speed: 900, r: 6, range: 480, kind: 'bullet', color: '#ffcf7a', hit })]);
            f.act(5, { move: 0.3, anim: 'aim', atk: true, super: true, onEnd: () => f.removeStatus('unstoppable') }, ev);
            f.addStatus('unstoppable', 5); f.ws.lx = 5; f.ws.warped = false;
            if (f.T('songluc_9c')) { f.addStatus('immortal', 2.5); m.text(f.x, f.y - 70, '👑 CỖ XE TĂNG THỜI GIAN', '#ffd700', 16); }
            m.text(f.x, f.y - 50, 'LIÊN XẠ!', '#ffcf7a', 16);
          } else {
            f.act(0.3, { move: 0.5, anim: 'aim', atk: true }, [[0.05, () => {
              const a = aimOr(f, m, 500, 1150);
              for (let i = -3; i <= 3; i++) shoot(f, m, a + i * 0.13, { speed: 1150, r: 4, range: 480, kind: 'bullet', color: '#8af0ff', hit: { dmg: 2.4, kb: 50, kg: 2, tag: 'B' } });
            }]]);
          }
        } },
      U: { name: 'Liên Hoa Thời Không', desc: 'Trong 6s Chrono và Neo hợp làm một (có cả trọng lượng lẫn tốc độ, cả hai băng đạn nạp đầy) và xả đạn quanh người thành những vòng hoa sen nở rộ — cánh đạn nặng (Quá Khứ) xen cánh đạn nhanh (Tương Lai) uốn cong xoay vòng. Kết thúc bằng một đóa sen bung nở lớn. Tung Nộ trong 1.5s sau khi Chuyển Thế (D): Liên Hoa nở TO GẤP ĐÔI (tầm & cỡ đạn x2, lực đẩy +30%).',
        ai: { type: 'buff', max: 420 },
        use(f, m) {
          f.ws.fuse = 6; f.ws.ammoC = f.ws.magC; f.ws.ammoN = f.ws.magN; f.ws.rlC = f.ws.rlN = 0;
          // vừa Chuyển Thế (≤1.5s): Liên Hoa nở to gấp đôi
          const big = m.time - (f.ws.swapT || -9) < 1.5 ? 2 : 1;
          f.ws.lotus = { t: 0, acc: 0.3, w: 0, k: big };
          if (big > 1) m.text(f.x, f.y - 84, '🪷x2 LIÊN HOA ĐẠI KHAI!', '#ffe9ff', 17);
          m.text(f.x, f.y - 60, '🪷 LIÊN HOA THỜI KHÔNG!', '#8af0ff', 20);
        } },
    },
  },
  decoy: {
    hidden: true, name: 'Ảo ảnh', icon: '🔮', color: '#6ac0ff', weight: 1, speed: 0, radius: 18, gfx: 'dual', noRage: true, life: 1, skills: {}, ai: { range: 200 },
    init(f) { f.ws.stance = 'neo'; },
    onIncoming(f, att, hit, m) {
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 30, color: '#8af0ff', life: 0.35, w: 4 });
      m.text(f.x, f.y - 36, 'ẢO ẢNH!', '#8af0ff', 14);
      m.removeMinion(f);
      return false;
    },
    mind(d, m, dt) { d.moveDir = { x: 0, y: 0 }; d.life -= dt; if (d.life <= 0) m.removeMinion(d); },
  },

  // ================= DẠNG / THỰC THỂ ẨN =================
  mech: {
    hidden: true, name: 'T-Zero', icon: '🤖', color: '#7a8090', weight: 2.4, speed: 1.05, radius: 30, gfx: 'mech', boxy: true, noRage: true,
    role: 'Cỗ máy hủy diệt', ai: { range: 80, defend: [] },
    passive: { name: 'Thiết Vệ', desc: 'Roxie lái T-Zero: rất nặng, giáp gánh phần lớn điểm văng. Hết giáp hoặc 20s thì cỗ máy hỏng.' },
    resource(f) { return `🤖 Giáp ${Math.max(0, Math.round(f.ws.mechHp))}% • ${Math.max(0, f.ws.mechT).toFixed(0)}s` + (f.ws.flame > 0 ? ' • 🔥' : ''); },
    update(f, m, dt) {
      f.ws.mechT -= dt;
      if (f.T('roxie_3b')) f.frameWeight *= 1.3;
      mechFlame(f, m, dt);
      if (f.ws.mechT <= 0 || f.ws.mechHp <= 0) ejectMech(f, m);
    },
    onTake(f, att, hit, info) { f.ws.mechHp -= (hit.dmg || 0) * DMG_SCALE * (att ? att.dmgMult : 1) * info.mult * 1.6; info.taken *= 0.2; },
    skills: {
      A: { name: 'Đấm / Sấy', cd: 0.7, desc: 'Bấm: cú đấm ngàn cân. Giữ: sấy đạn liên tục.',
        ai: { type: 'atk', max: 105, pri: 2.2 },
        use(f, m) {
          if (f.intent && f.intent.hold) {
            const ev = [];
            for (let i = 0; i < 10; i++) ev.push([0.05 + i * 0.08, () => shoot(f, m, aimOr(f, m, 480, 1000) + rand(-0.1, 0.1), { speed: 1000, r: 5, range: 480, kind: 'bullet', color: '#ffe9a0', hit: { dmg: 1.8, kb: 40, kg: 1.6, tag: 'A' } })]);
            f.act(0.9, { move: 0.5, anim: 'aim', atk: true }, ev);
          } else f.act(0.4, { move: 0.3, anim: 'swing', atk: true }, [[0.14, () => m.hitArc(f, { range: 100, arc: 110, dmg: 9, kb: 200, kg: 6, tag: 'A' })]]);
        } },
      B: { name: 'Phun Lửa', cd: 4, desc: 'Phun lửa diện rộng phía trước 2.5s, vẫn dùng được các chiêu khác cùng lúc.',
        ai: { type: 'atk', max: 175, pri: 2.6 },
        use(f, m) {
          // Vòng Xoáy Lửa: ngay sau cú Húc → xoay tròn quét lửa 360°, hất tung
          if (f.T('roxie_12b') && (f.dash || m.time - (f.ws.cEnd || -9) < 0.7)) {
            f.cancelDash();
            f.act(0.5, { move: 0.2, anim: 'spin', atk: true }, [[0.12, () => {
              m.hitCircle(f, { r: 155, dmg: 7, kb: 150, kg: 4.5, knockup: 420, burn: [1.6, 3], tag: 'B' });
              for (let j = 0; j < 24; j++) { const a = j / 24 * TAU, s = rand(250, 420); m.particle(f.x, f.y, { color: pick(['#ff5a1a', '#ffb02a']), life: 0.45, size: 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s }); }
              m.shake(8); m.text(f.x, f.y - 60, '🔥 VÒNG XOÁY LỬA!', '#ff8a3a', 17);
            }]]);
            return;
          }
          f.ws.flame = 2.5; m.sfx('flame');
        } },
      C: { name: 'Húc', cd: 3, desc: 'Cỗ máy húc thẳng về trước để áp sát hoặc tẩu thoát.',
        ai: { type: 'mob', min: 120, max: 320, pri: 2, mob: 'engage' },
        use(f, m) {
          const hit = new Set();
          f.act(0.3, { move: 0 });
          f.ws.cEnd = m.time + 0.26;
          f.startDash({ angle: f.castAngle, dist: 230, dur: 0.26, onContact: (e) => { if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 7, kb: 220, kg: 5, tag: 'C', angle: f.facing }); } return false; } });
        } },
      D: { name: 'Kéo / Tự Hủy', cd: 4, desc: 'Bấm: bắn dây móc kéo đối thủ lại gần. Giữ: tự hủy — nổ gây lực văng khổng lồ quanh cỗ máy rồi Roxie thoát ra.',
        ai: { type: 'atk', min: 170, max: 430, pri: 2.4 },
        use(f, m) {
          if (f.intent && f.intent.hold) {
            m.text(f.x, f.y - 60, '⚠ TỰ HỦY!', '#ff4a4a', 20);
            f.act(0.8, { move: 0, anim: 'raise', super: true, charge: 0.8 }, [[0.8, () => { mechBoom(f, m, f.x, f.y); ejectMech(f, m, true); }]]);
          } else mechHook(f, m);
        } },
    },
  },
  oktava: {
    hidden: true, name: 'Oktava', icon: '🐘', color: '#3a9a6a', weight: 1.4, speed: 0.95, radius: 30, gfx: 'guardian', noRage: true, skills: {},
    ai: { range: 95 },
    update(g) { if (g.owner && g.owner.T('aria_1b')) g.frameSpeed *= 1.15; },
    mind(g, m, dt) {
      const o = g.owner;
      if (!o.alive) { g.moveDir = { x: 0, y: 0 }; return; }
      if (o.ws.mounted > 0 || o.form === 'oktaform') {
        g.hidden = true; g.x = o.x; g.y = o.y + 2; g.vx = g.vy = 0; g.moveDir = { x: 0, y: 0 };
        // Cộng Hưởng Tuyệt Đối: Oktava vẫn vung đòn khi bị cưỡi, x2 lực đẩy
        g.ws.cd = (g.ws.cd || 0) - dt;
        const e = m.nearestEnemy(o);
        if (o.ws.mounted > 0 && o.T('aria_9b') && e && dist(o, e) < 115 && g.ws.cd <= 0) {
          g.ws.cd = 1.6; g.facing = angTo(o, e);
          m.later(0.15, () => { if (o.alive) m.hitArc(o, { range: 110, arc: 130, dmg: 4, kb: 250, kg: 6, tag: 'A', src: o }); });
        }
        return;
      }
      g.hidden = false;
      const t = m.nearestEnemy(g), duo = o.T('aria_12c');
      const mode = o.brain && o.brain.cmd && o.brain.cmd.mode;
      g.ws.cd = (g.ws.cd || 0) - dt; g.ws.tauntCd = (g.ws.tauntCd ?? 3) - dt; g.ws.leapCd = (g.ws.leapCd ?? 2) - dt;
      if (t && g.canAct()) {
        g.facing = angTo(g, t);
        const dg = dist(g, t), da = dist(o, t);
        // KHIÊU KHÍCH: buộc kẻ địch nhắm vào Oktava 3s (khi Aria bị đe dọa, hoặc theo lệnh Tách ra / Tập hợp)
        const threat = da < 210 || o.percent > 65 || mode === 'split' || (mode === 'gather' && da < 280);
        if (g.ws.tauntCd <= 0 && dg < 300 && threat) {
          g.ws.tauntCd = 9;
          for (const e of m.enemiesOf(g)) {
            if (e.isMinion || dist(e, g) > 320 || e.has('unstoppable') || e.has('immortal')) continue;
            e.addStatus('taunt', 3); if (e.has('taunt')) e.focus = { by: g, until: m.time + 3, taunt: true };
            m.text(e.x, e.y - 56, '😤 BỊ KHIÊU KHÍCH', '#ff8a6a', 14);
          }
          g.act(0.4, { move: 0, anim: 'raise' });
          m.fx({ type: 'ring', x: g.x, y: g.y, r: 300, color: '#ff8a6a', life: 0.5, w: 6 }); m.text(g.x, g.y - 70, '😤 KHIÊU KHÍCH!', '#ff8a6a', 17); m.shake(4);
          return;
        }
        // Tách ra: Oktava chủ động dậm choáng (khống chế)
        if ((mode === 'split' || duo) && g.ws.leapCd <= 0 && dg > 110 && dg < 380) {
          g.ws.leapCd = 4.5;
          guardLeap(g, m, t.x, t.y, () => { m.hitCircle(g, { r: 95, dmg: 5, kb: 120, kg: 3.5, stun: 0.7, tag: 'A' }); });
          return;
        }
        if (dg < 100 && g.ws.cd <= 0) {
          g.ws.cd = duo ? 1.25 : 2.0;
          g.act(0.45, { move: 0.2, anim: 'swing', atk: true }, [[0.18, () => m.hitArc(g, { range: 95, arc: 120, dmg: 4, kb: 125, kg: 4.5, tag: 'A' })]]);
        }
      }
      let gx = o.x, gy = o.y;
      if (t) {
        const a = angTo(o, t);
        gx = o.x + Math.cos(a) * 75; gy = o.y + Math.sin(a) * 75;
        if (mode === 'split' || duo || dist(o, t) < 200 || g.has('empower')) { gx = t.x; gy = t.y; }
        // Tập hợp: đứng chắn giữa Aria và kẻ địch
        if (mode === 'gather') { gx = o.x + Math.cos(a) * 85; gy = o.y + Math.sin(a) * 85; if (dist(o, t) < 150) { gx = t.x; gy = t.y; } }
      }
      steerToward(g, m, gx, gy, 40);
    },
  },
  // Nhập Thể Âm Vang (Aria Lv6): Aria hòa vào Oktava thành khổng lồ 5s
  oktaform: {
    hidden: true, name: 'Oktava Khổng Lồ', icon: '🐘', color: '#3a9a6a', weight: 1.7, speed: 1.0, radius: 32, gfx: 'guardian', noRage: true,
    role: 'Khổng lồ cận chiến', ai: { range: 95, defend: [] },
    passive: { name: 'Nhập Thể', desc: 'Aria và Oktava hợp làm một trong 5s.' },
    resource(f) { return `🐘 Nhập thể ${Math.max(0, f.ws.merged).toFixed(1)}s`; },
    update(f, m, dt) {
      f.ws.merged -= dt;
      if (f.ws.merged <= 0 || !f.ws.guard || !f.ws.guard.alive) {
        f.clearForm();
        const g = f.ws.guard;
        if (g && g.alive) { g.hidden = false; const a = f.facing + Math.PI; g.x = f.x + Math.cos(a) * 50; g.y = f.y + Math.sin(a) * 50; }
        m.text(f.x, f.y - 50, 'Tách thể', '#7ae0a0', 13);
      }
    },
    skills: {
      A: { name: 'Đấm Đất', cd: 0.8, desc: 'Đấm xuống đất trước mặt.', ai: { type: 'atk', max: 110, pri: 2.4 },
        use(f, m) { f.act(0.36, { move: 0.3, anim: 'swing', atk: true }, [[0.12, () => m.hitArc(f, { range: 112, arc: 130, dmg: 7.5, kb: 175, kg: 6, tag: 'A' })]]); } },
      B: { name: 'Gầm Vang', cd: 3, desc: 'Gầm quanh người, choáng và đẩy lùi.', ai: { type: 'atk', max: 140, pri: 2.8 },
        use(f, m) { f.act(0.4, { move: 0, anim: 'raise', atk: true }, [[0.15, () => { m.hitCircle(f, { r: 150, dmg: 5, kb: 235, kg: 6.2, stun: 0.5, tag: 'B' }); m.shake(7); }]]); } },
      C: { name: 'Húc', cd: 2.5, desc: 'Húc lao về trước.', ai: { type: 'mob', min: 120, max: 320, pri: 2, mob: 'engage' },
        use(f, m) {
          const hit = new Set();
          f.act(0.3, { move: 0 });
          f.startDash({ angle: f.castAngle, dist: 220, dur: 0.26, trail: true, onContact: (e) => { if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 6, kb: 200, kg: 5, tag: 'C', angle: f.castAngle }); } return false; } });
        } },
    },
  },
  // phân thân bóng tối (Vesper Lv12): chạy thẳng một hướng, trúng đòn là tan
  shade: {
    hidden: true, name: 'Phân thân', icon: '🔪', color: '#b07aff', weight: 1, speed: 1.25, radius: 18, gfx: 'dagger', noRage: true, life: 2.2, skills: {},
    ai: { range: 55 },
    onIncoming(f, att, hit, m) {
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 30, color: '#b07aff', life: 0.35, w: 4 }); m.text(f.x, f.y - 36, 'PHÂN THÂN!', '#d0a0ff', 13);
      m.removeMinion(f); return false;
    },
    mind(c, m, dt) {
      c.life -= dt;
      if (c.life <= 0) { m.fx({ type: 'ghost', x: c.x, y: c.y, r: c.r, color: '#b07aff', life: 0.3 }); m.removeMinion(c); return; }
      c.moveDir = { x: Math.cos(c.ws.dir), y: Math.sin(c.ws.dir) };
      if (m.arena.edgeDist(c.x, c.y) < 70) c.ws.dir = Math.atan2(-c.y, -c.x) + rand(-0.6, 0.6);
      c.facing = c.ws.dir;
    },
  },
  // Thiết Vệ Pháo Đài (Roxie Lv12): đứng yên, 2 họng đại bác nã đạn nổ khắp bản đồ (có báo trước)
  siege: {
    hidden: true, name: 'Pháo Đài', icon: '🏰', color: '#8a7050', weight: 4, speed: 0, radius: 30, gfx: 'siege', boxy: true, noRage: true, life: 16, skills: {},
    ai: { range: 900 },
    mind(c, m, dt) {
      c.moveDir = { x: 0, y: 0 };
      c.life -= dt;
      if (c.life <= 0 || c.percent > 160) { mechBoom(c, m, c.x, c.y); m.removeMinion(c); return; }
      c.ws.cd = (c.ws.cd ?? 1) - dt;
      const t = m.nearestEnemy(c.owner);
      if (!t) return;
      c.facing = angTo(c, t);
      if (c.ws.cd > 0) return;
      c.ws.cd = 1.3;
      for (let i = 0; i < 2; i++) {
        const p = { x: t.x + t.moveDir.x * t.speed * 0.5 + rand(-50, 50), y: t.y + t.moveDir.y * t.speed * 0.5 + rand(-50, 50) };
        m.fx({ type: 'telegraph', x: p.x, y: p.y, r: 70, color: '#ffb030', life: 0.7 });
        m.later(0.7, () => { if (c.alive || c.dead) explode(c, m, p.x, p.y, 70, { dmg: 5.5, kb: 175, kg: 4.6, tag: 'D' }); });
      }
      m.sfx('boom_small', { vol: 0.4, rate: 0.7 });
    },
  },
  // Cyborg Tự Thân (Roxie Lv12)
  cyborg: {
    hidden: true, name: 'Cyborg', icon: '⚙️', color: '#ffb030', weight: 2.0, speed: 1.0, radius: 34, gfx: 'cyborg', noRage: true,
    role: 'Cyborg cận chiến', ai: { range: 85, defend: ['C'] },
    passive: { name: 'Giáp Bánh Răng', desc: 'Roxie lắp giáp lên người 18s: to gấp đôi, nặng, đấm xuyên giáp.' },
    resource(f) { return `⚙️ Cyborg ${Math.max(0, f.ws.cyborgT).toFixed(0)}s`; },
    update(f, m, dt) { f.ws.cyborgT -= dt; if (f.ws.cyborgT <= 0) { f.clearForm(); m.fx({ type: 'boom', x: f.x, y: f.y, r: 70, color: '#aaaaaa', life: 0.35 }); m.text(f.x, f.y - 50, 'Tháo giáp', '#cccccc', 14); } },
    skills: {
      A: { name: 'Đấm Xuyên Giáp', cd: 0.6, desc: 'Cú đấm sát thương chuẩn.', ai: { type: 'atk', max: 95, pri: 2.4 },
        use(f, m) { f.act(0.32, { move: 0.3, anim: 'swing', atk: true }, [[0.1, () => m.hitArc(f, { range: 98, arc: 110, dmg: 8, kb: 175, kg: 6, trueDmg: true, tag: 'A' })]]); } },
      B: { name: 'Đấm Tên Lửa', cd: 3, desc: 'Lao tới đấm cực mạnh.', ai: { type: 'atk', min: 60, max: 230, pri: 2.6 },
        use(f, m) {
          const hit = new Set();
          f.act(0.35, { move: 0, anim: 'thrust', atk: true });
          f.startDash({ angle: f.facing, dist: 200, dur: 0.22, trail: true, onContact: (e) => { if (!hit.has(e)) { hit.add(e); m.applyHit(f, e, { dmg: 9, kb: 255, kg: 7.5, trueDmg: true, tag: 'B', angle: f.facing }); } return true; } });
        } },
      C: { name: 'Phản Lực', cd: 4, desc: 'Lướt thoát thân.', ai: { type: 'def', max: 200, mob: 'escape' },
        use(f, m) { f.startDash({ angle: f.castAngle, dist: 170, dur: 0.2, invuln: true, trail: true }); } },
    },
  },
  cannon: {
    hidden: true, name: 'Ụ Pháo', icon: '🛠', color: '#ffb030', weight: 3, speed: 0, radius: 16, gfx: 'cannon', boxy: true, noRage: true, skills: {},
    mind(c, m, dt) {
      c.moveDir = { x: 0, y: 0 };
      c.ws.cd = (c.ws.cd ?? 0.5) - dt;
      const t = m.autoTarget(c, 400);
      if (!t) return;
      c.facing = angTo(c, t);
      if (c.ws.cd <= 0 && !m.arena.blocked(c.x, c.y, t.x, t.y, 3)) {
        c.ws.cd = 0.6;
        shoot(c, m, m.aimAngle(c, t, 900), { speed: 900, r: 4, range: 420, kind: 'bullet', color: '#ffd27a', hit: { dmg: 2.5, kb: 40, kg: 1.7, tag: 'A' } });
      }
    },
  },
  tzero: {
    hidden: true, name: 'T-Zero', icon: '🤖', color: '#7a8090', weight: 2.4, speed: 1.15, radius: 30, gfx: 'mech', boxy: true, noRage: true, life: 18, skills: {},
    mind(z, m, dt) {
      z.life -= dt;
      if (z.life <= 0 || z.percent > 150) { mechBoom(z, m, z.x, z.y); m.removeMinion(z); return; }
      mechFlame(z, m, dt);
      const t = m.nearestEnemy(z);
      z.ws.pc = (z.ws.pc || 0) - dt; z.ws.hk = (z.ws.hk ?? 2) - dt; z.ws.fl = (z.ws.fl ?? 1) - dt;
      if (t && z.canAct()) {
        z.facing = angTo(z, t);
        const d = dist(z, t);
        if (d < 100 && z.ws.pc <= 0) { z.ws.pc = 1.0; z.act(0.35, { move: 0.2, anim: 'swing', atk: true }, [[0.12, () => m.hitArc(z, { range: 100, arc: 110, dmg: 8, kb: 190, kg: 5.5, tag: 'A' })]]); }
        else if (d < 180 && z.ws.fl <= 0) { z.ws.fl = 3.5; z.ws.flame = 1.5; }
        else if (d > 220 && d < 430 && z.ws.hk <= 0) { z.ws.hk = 5; mechHook(z, m); }
      }
      if (t) steerToward(z, m, t.x, t.y, 60);
    },
  },
});

// --- Hàm hỗ trợ ---
function maxShells(f) { return f.T('clint_9b') ? 3 : 2; }
function bleedCap(f) { return f.T && f.T('koda_9b') ? 8 : 5; }
function deathLine(f) { return f.T && f.T('death_9a') ? 75 : 100; }
function gearCost(f) { return f.T('roxie_1b') ? 2 : 3; }
function cannonMax(f) { return f.T('roxie_9b') ? 2 : 1; }
function charm(t, to, dur) { if (!t.alive || t.superArmor) return; t.addStatus('charm', dur); t.charmTo = to; }
function clawCling(f, m, p) {
  if (!p) return;
  f.cancelDash(); f.action = null;
  f.ws.cling = { p, a: Math.atan2(f.y - p.y, f.x - p.x), t: f.T('koda_1a') ? 4.2 : 3 };
  f.hover = 55;
  m.text(f.x, f.y - 50, 'BÁM TƯỜNG', '#c0563a', 14);
}
function clawDrop(f) { f.ws.cling = null; f.hover = 0; }
function clawDive(f, m, tag) {
  const t = m.nearestEnemy(f);
  clawDrop(f);
  f.ws.dive = true;
  const a = t ? angTo(f, t) : f.facing, d = t ? Math.min(dist(f, t) + 10, f.T('koda_1a') ? 400 : 320) : 160;
  f.facing = a;
  f.act(0.38, { move: 0, anim: 'thrust', atk: true });
  m.text(f.x, f.y - 50, 'LAO XUỐNG!', '#ff6a4a', 16);
  const pounce = tag === 'D' && f.T('koda_3a');
  f.startDash({ angle: a, dist: d, dur: Math.max(0.12, d / 1100), trail: true, stopAtEdge: true,
    onContact: (e) => { m.applyHit(f, e, Object.assign({ dmg: tag === 'D' ? 8 : 6, kb: 150, kg: 5, tag, angle: a }, pounce ? { stun: 1.25 } : {})); return true; },
    onEnd: () => m.later(0.05, () => { f.ws.dive = false; }) });
}
function scytheShades(f, m) {
  const t = m.nearestEnemy(f);
  if (!t) return [];
  const a = angTo(t, f), d = clamp(dist(f, t), 80, 150);
  const angs = f.T('death_9b') ? [a + Math.PI / 2, a - Math.PI / 2, a + Math.PI] : [a + TAU / 3, a - TAU / 3];
  return angs.map((b) => m.arena.clamp({ x: t.x + Math.cos(b) * d, y: t.y + Math.sin(b) * d }, 10));
}
function spearSlam(f, m) {
  f.ws.vault = 0; f.hover = 0; f.vz = -500;
  f.removeStatus('untargetable');
  const quake = f.T('theron_3c'), R = quake ? 170 : 118;
  m.later(0.08, () => {
    m.hitCircle(f, quake ? { r: R, dmg: 6, kb: 120, kg: 4, knockup: 380, tag: 'C' } : { r: R, dmg: 6, kb: 140, kg: 4, slow: [0.5, 1.5], tag: 'C' });
    m.fx({ type: 'ring', x: f.x, y: f.y, r: R, color: '#e0c070', life: 0.4, w: 10 }); m.shake(8); m.sfx('impact', { rate: 0.75 });
  });
}
function spearRelease(f, m) {
  const e = f.ws.carry;
  f.ws.carry = null;
  if (e && e.carry && e.carry.by === f) {
    e.carry = null;
    m.applyHit(f, e, { dmg: 6, kb: 250, kg: 6.5, trueDmg: true, tag: 'B', angle: f.facing });
  }
}
function voiceGuard(f) { const g = f.ws.guard; return g && g.alive && f.ws.mounted <= 0 ? g : null; }
function voiceSpawnGuard(f, m) {
  const p = m.arena.clamp({ x: f.x - Math.cos(f.facing) * 50, y: f.y - Math.sin(f.facing) * 50 + 30 }, 40);
  f.ws.guard = m.addMinion(new Minion(f, 'oktava', p.x, p.y, 'Oktava'));
  // Song Tấu Độc Lập: Oktava mạnh 150%
  if (f.T('aria_12c')) { const g = f.ws.guard; g.dmgMult *= 1.5; g.kbMult *= 1.25; g.weightFactor *= 1.5; g.speedFactor *= 1.3; }
  m.fx({ type: 'ring', x: p.x, y: p.y, r: 60, color: '#7ae0a0', life: 0.6, w: 5 });
}
function guardLeap(g, m, x, y, onLand) {
  g.action = null;
  const d = Math.min(Math.hypot(x - g.x, y - g.y), 460);
  g.z = 1; g.vz = 520;
  g.startDash({ angle: Math.atan2(y - g.y, x - g.x), dist: d, dur: 0.6 });
  m.later(0.66, () => {
    if (!g.alive) return;
    onLand && onLand();
    m.fx({ type: 'ring', x: g.x, y: g.y, r: 90, color: '#7ae0a0', life: 0.35, w: 8 }); m.shake(5);
  });
}
function voiceSong(f, m, notes) {
  const c = { A: 0, B: 0, C: 0 };
  notes.forEach((n) => c[n]++);
  const t = m.nearestEnemy(f), g = voiceGuard(f);
  // Khúc Ca Ru Ngủ: đúng thứ tự A → B → C
  if (f.T('aria_12a') && notes.join('') === 'ABC') {
    m.text(f.x, f.y - 70, '🌙 KHÚC CA RU NGỦ', '#c0b0ff', 19); m.sfx('note_4', { vol: 1.2, rate: 0.8 });
    for (const e of m.enemiesOf(f)) if (dist(e, f) < 720 && !e.has('unstoppable') && !e.has('immortal')) { e.addStatus('stun', 1.5); m.text(e.x, e.y - 50, '💤 NGỦ', '#c0b0ff', 16); }
    m.fx({ type: 'ring', x: f.x, y: f.y, r: 380, color: '#c0b0ff', life: 0.7, w: 10 });
    return;
  }
  const type = c.A >= 2 ? 'A' : c.B >= 2 ? 'B' : c.C >= 2 ? 'C' : 'mix';
  const label = { A: '🎺 Bản Nhạc Hào Hùng', B: '🎻 Bài Ca Ràng Buộc', C: '🎶 Bản Nhạc Bảo Hộ', mix: '🎼 Hòa Âm Hỗn Hợp' }[type];
  m.text(f.x, f.y - 70, label, '#ffe9a0', 18); m.sfx('note_4', { vol: 1.2 });
  const songA = () => {
    const R = f.T('aria_1c') ? 130 : 100, crush = f.T('aria_3b');
    if (g && t) m.later(0.25, () => { if (g.alive && t.alive) guardLeap(g, m, t.x, t.y, () => m.hitCircle(f, { x: g.x, y: g.y, r: 125, dmg: 9, kb: 200, kg: 6, tag: 'A' })); });
    for (let i = 0; i < 3; i++) m.later(0.35 + i * 0.3, () => {
      if (!f.alive) return;
      const last = i === 2;
      if (last && crush) for (const e of m.enemiesOf(f)) if (dist(e, f) < R + e.r) for (const s of ['shield', 'block', 'stance', 'absorb']) e.removeStatus(s);
      m.hitCircle(f, { r: R, dmg: 3.5, kb: 90, kg: 3, stun: last ? (crush ? 1.5 : 0.8) : 0, tag: 'A', quiet: true });
      m.fx({ type: 'ring', x: f.x, y: f.y, r: R, color: '#ff6a6a', life: 0.3, w: 8 });
    });
  };
  const songB = () => {
    const id = Math.random(), ch = f.T('aria_3a') ? 2.6 : 1.8;
    for (let i = 0; i < 3; i++) m.later(0.3 + i * 0.16, () => {
      if (!f.alive) return;
      shoot(f, m, aimOr(f, m, 480, 620), { speed: 620, r: 16, range: 480, kind: 'note', color: '#6ab0ff', hit: { dmg: 1.5, kb: 20, kg: 0.5, tag: 'B' },
        onHit: (mm, p, tt) => {
          const s = tt._song && tt._song.id === id ? tt._song : (tt._song = { id, n: 0 });
          s.n++;
          if (s.n === 1) tt.addStatus('slow', 1.5, 0.5);
          else if (s.n === 2) tt.addStatus('root', 1);
          else { charm(tt, voiceGuard(f) || f, ch); mm.text(tt.x, tt.y - 56, '💗 MÊ HOẶC', '#ff7ad1', 18); }
        } });
    });
  };
  const songC = () => {
    f.addStatus('shield', 4, 14); f.addStatus('regen', 4, 3);
    if (g) guardLeap(g, m, f.x, f.y, () => m.hitCircle(f, { x: g.x, y: g.y, r: 150, dmg: 5, kb: 300, kg: 6, tag: 'C' }));
  };
  if (type === 'A') songA();
  else if (type === 'B') songB();
  else if (type === 'C') songC();
  else if (f.T('aria_9c')) {
    // Bản Hòa Âm Tối Thượng: trọn vẹn cả 3 bản nhạc
    m.text(f.x, f.y - 92, '✨ HÒA ÂM TỐI THƯỢNG', '#ffd700', 18);
    songC(); songB(); songA();
  } else {
    m.hitCircle(f, { r: 165, dmg: 3, kb: 40, kg: 1, root: 0.9, tag: 'B', quiet: true });
    m.fx({ type: 'ring', x: f.x, y: f.y, r: 165, color: '#ffe9a0', life: 0.45, w: 8 });
    f.addStatus('shield', 3, 6); f.addStatus('regen', 3, 2);
  }
}
// xúc xắc của Jack (đã chỉnh tỉ lệ có lợi: ⚀ 8%, ⚅ 24%)
const JACK_DICE_W = [0.08, 0.14, 0.17, 0.18, 0.19, 0.24];
function jackDie() { let r = Math.random(); for (let i = 0; i < 6; i++) { r -= JACK_DICE_W[i]; if (r < 0) return i + 1; } return 6; }
function revDice(f, m) {
  let n = f.T('jack_12b') ? (Math.random() < 0.3 ? 6 : randi(3, 5)) : f.T('jack_3a') ? Math.min(6, jackDie() + (Math.random() < 0.17 ? 1 : 0)) : jackDie();
  // Tẩy Bài Cờ Bạc: ra ⚀ được gieo lại 1 lần
  if (n === 1 && f.T('jack_6c')) { m.text(f.x, f.y - 70, '🃏 Tẩy bài — gieo lại!', '#ffe9c0', 13); n = jackDie(); }
  f.ws.dice = n;
  if (n === 1 && f.T('jack_1a')) m.text(f.x, f.y - 56, '⚀ Thua bạc... nhưng tay nghề cứu vãn', '#cccccc', 13);
  else if (n === 1) { f.percent += 6; m.text(f.x, f.y - 56, '⚀ Thua bạc! +6%', '#ff6a6a', 15); }
  else if (n === 6) m.text(f.x, f.y - 56, '⚅ ĐỘC ĐẮC!', '#ffd700', 18);
  else m.text(f.x, f.y - 56, `${['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][n - 1]} +${(n - 1) * 10}% sát thương`, '#ffe9c0', 14);
}
function revShot(f, m, a, tag, range = 520, extra = null) {
  if (f.ws.cyl <= 0) return;
  const dice = f.ws.dice, fate = dice === 6;
  const k = dice >= 2 && dice <= 5 ? 1 + (dice - 1) * 0.1 : 1, heavy = tag === 'A' && f.T('jack_1c') ? 1.2 : 1;
  f.ws.cyl--;
  shoot(f, m, a, { speed: 1050, r: fate ? 8 : 5, range, kind: 'bullet', color: fate ? '#ffd700' : '#ffe9c0',
    hit: Object.assign(fate ? { dmg: 10.5, kb: 170 * heavy, kg: 6.6, stun: 0.35, tag } : { dmg: 6 * k, kb: 90 * heavy, kg: 3.7, tag }, extra || {}) });
  m.fx({ type: 'flash', x: f.x + Math.cos(a) * 28, y: f.y + Math.sin(a) * 28, r: fate ? 20 : 12, color: fate ? '#ffd700' : '#fff3a0', life: 0.1 });
  if (f.ws.cyl <= 0) f.ws.rl = 0;
}
function roulettePull(f, m) {
  const rr = f.ws.rr;
  f.act(0.26, { move: 0.5, anim: 'aim', atk: true }, [[0.08, () => {
    if (f.ws.rr !== rr) return;
    if (rr.pos === rr.live) {
      f.ws.rr = null; f.ws.cyl = 0; f.ws.rl = 0;
      if (f.T('jack_12a')) f.ws.allinT = 2;
      const a = aimOr(f, m, 700, 1500);
      const life = f.T('jack_9a');
      shoot(f, m, a, { speed: 1500, r: 11, range: 760, kind: 'bigarrow', color: '#ff3a3a', pierce: true,
        hit: { dmg: life ? 46 : 27.6, kb: 360, kg: 9, stun: 0.8, trueDmg: true, unblockable: true, tag: 'D', execute: life ? 70 : 0 } });
      m.text(f.x, f.y - 64, '💥 ĐOÀNG!!!', '#ff3a3a', 26); m.shake(14); m.sfx('explosion', { rate: 1.2 });
      m.fx({ type: 'flash', x: f.x + Math.cos(a) * 30, y: f.y + Math.sin(a) * 30, r: 40, color: '#ff6a3a', life: 0.15 });
    } else {
      rr.pos++;
      m.text(f.x, f.y - 50, `*cạch* — ổ trống (${rr.pos}/6)`, '#cccccc', 13); m.sfx('gun_reload', { rate: 2.2, vol: 0.6 });
      if (f.T('jack_3c')) f.addStatus('shield', 1, 8);
    }
  }]]);
}
function neoRewind(f, m) {
  const r = f.ws.rewind; f.ws.rewind = null;
  if (!f.alive || f.carry || f.arcPull) { if (r.decoy && r.decoy.alive) m.removeMinion(r.decoy); return; }
  const swap = f.T('songluc_6b') && r.decoy && r.decoy.alive, me = { x: f.x, y: f.y };
  if (r.decoy && r.decoy.alive) {
    // Hoán Đổi Ảo Ảnh: ảo ảnh sang chỗ Neo và tiếp tục dụ địch
    if (swap) { r.decoy.x = me.x; r.decoy.y = me.y; r.decoy.life = Math.max(r.decoy.life, 1.2); }
    else m.removeMinion(r.decoy);
  }
  const rx = r.decoy && swap ? r.x : r.x, ry = r.y;
  m.fx({ type: 'line', x1: f.x, y1: f.y, x2: rx, y2: ry, color: '#8af0ff', life: 0.3, w: 4 });
  f.cancelDash(); f.x = rx; f.y = ry; f.vx = f.vy = 0;
  m.fx({ type: 'ring', x: f.x, y: f.y, r: 36, color: '#8af0ff', life: 0.35, w: 4 });
  m.text(f.x, f.y - 46, swap ? '🔁 HOÁN ĐỔI' : '⏪ TUA NGƯỢC', '#8af0ff', 14);
  if (swap) {
    const t = m.nearestEnemy(f);
    if (t) for (let i = 0; i < 3; i++) m.later(0.04 + i * 0.07, () => { if (f.alive) shoot(f, m, aimOr(f, m, 500, 1300) + rand(-0.06, 0.06), { speed: 1300, r: 4, range: 500, kind: 'bullet', color: '#8af0ff', hit: { dmg: 2, kb: 40, kg: 1.6, slow: [0.45, 1], tag: 'C' } }); });
  }
  if (f.T('songluc_3b')) {
    m.hitCircle(f, { r: 110, dmg: 2, noKnock: true, stun: 0.75, tag: 'C' });
    m.fx({ type: 'ring', x: f.x, y: f.y, r: 110, color: '#8af0ff', life: 0.4, w: 6 });
  }
  if (f.T('songluc_9b')) {
    // Nghịch Lý Sinh Tồn: quay về điểm văng của 2s trước
    const h = f.ws.ph || [], old = h.find((e) => e.t >= m.time - 2.05);
    const back = Math.min(old ? old.p : f.percent, r.p0 ?? f.percent);
    if (back < f.percent - 0.5) { m.text(f.x, f.y - 64, `💚 -${(f.percent - back).toFixed(0)}%`, '#7aff9a', 15); f.percent = back; }
  }
}
// Nộ Liên Hoa Thời Không: mỗi đợt 10 cánh đạn uốn cong — cánh nặng (Chrono) xen cánh nhanh (Neo)
function lotusWave(f, m, w, k = 1) {
  const n = 10, base = w * 0.21 + (w % 2 ? Math.PI / n : 0), bend = w % 2 ? 1.3 : -1.3;
  for (let i = 0; i < n; i++) {
    const a = base + i * TAU / n, heavy = i % 2 === 0;
    shoot(f, m, a, heavy
      ? { speed: 560 * Math.sqrt(k), r: 6 * k, range: 400 * k, kind: 'bullet', color: '#ffcf7a', curve: bend / Math.sqrt(k), silent: i > 0, hit: { dmg: 2.4, kb: 70 * (k > 1 ? 1.3 : 1), kg: 2.4, tag: 'U' } }
      : { speed: 880 * Math.sqrt(k), r: 4 * k, range: 440 * k, kind: 'bullet', color: '#8af0ff', curve: -bend / Math.sqrt(k), silent: true, hit: { dmg: 1.2, kb: 38 * (k > 1 ? 1.3 : 1), kg: 1.4, tag: 'U' } });
  }
  m.fx({ type: 'ring', x: f.x, y: f.y, r: 34 * k, color: w % 2 ? '#8af0ff' : '#ffcf7a', life: 0.3, w: 4 * k });
}
function lotusBloom(f, m, k = 1) {
  if (!f.alive) return;
  for (let i = 0; i < 20 * k; i++) shoot(f, m, i * TAU / (20 * k), { speed: 700, r: 7 * k, range: 460 * k, kind: 'bullet', color: i % 2 ? '#8af0ff' : '#ffcf7a', silent: i > 0, hit: { dmg: 3, kb: 130 * (k > 1 ? 1.3 : 1), kg: 4, tag: 'U' } });
  m.fx({ type: 'ring', x: f.x, y: f.y, r: 160 * k, color: '#ffe9ff', life: 0.5, w: 10 * k }); m.shake(8 * k);
  m.text(f.x, f.y - 70, '🪷 SEN NỞ!', '#ffe9ff', 19);
}
function callMechPilot(f, m) {
  m.text(f.x, f.y - 64, '"Lùi lại! Thiết Vệ!"', '#ffd27a', 16);
  m.fx({ type: 'line', x1: f.x, y1: f.y, x2: f.x, y2: f.y - 500, color: '#ff4a4a', life: 0.8, w: 4 });
  m.fx({ type: 'telegraph', x: f.x, y: f.y, r: 110, color: '#ffb030', life: 1 });
  f.act(1.0, { move: 0.6, anim: 'cast' });
  m.later(1.0, () => {
    if (!f.alive) return;
    m.hitCircle(f, { r: 115, dmg: 6, kb: 220, kg: 5, tag: 'D' });
    m.fx({ type: 'boom', x: f.x, y: f.y, r: 110, color: '#ffb030', life: 0.4 }); m.shake(12);
    f.setForm('mech'); f.ws.mechHp = 100; f.ws.mechT = 20; f.ws.flame = 0; m.sfx('robot');
  });
}
function callMechAuto(f, m) {
  m.text(f.x, f.y - 64, '"Thiết Vệ! Hiệu triệu!"', '#ffd27a', 16);
  const t = m.nearestEnemy(f);
  const p = m.arena.clamp({ x: f.x + Math.cos(f.facing) * 90, y: f.y + Math.sin(f.facing) * 90 }, 50);
  m.fx({ type: 'telegraph', x: p.x, y: p.y, r: 110, color: '#ffb030', life: 0.9 });
  f.vz = 380; f.z = 1;
  f.startDash({ angle: t ? escapeAngle(f, t, m) : f.facing + Math.PI, dist: 120, dur: 0.25 });
  m.later(0.9, () => {
    if (!f.alive) return;
    m.hitCircle(f, { x: p.x, y: p.y, r: 115, dmg: 6, kb: 220, kg: 5, tag: 'D' });
    m.fx({ type: 'boom', x: p.x, y: p.y, r: 110, color: '#ffb030', life: 0.4 }); m.shake(12);
    f.ws.mech = m.addMinion(new Minion(f, 'tzero', p.x, p.y, 'T-Zero')); m.sfx('robot');
    if (f.T('roxie_3b')) f.ws.mech.weightFactor *= 1.3;
  });
}
// Bệ Phóng Lò Xo (Roxie Lv6): kẻ địch giẫm lên bị bật văng về phía mép sàn
function springPad(f, m, p) {
  m.text(p.x, p.y - 30, '🌀 Bệ lò xo', '#ffb030', 13);
  m.zone({ owner: f, x: p.x, y: p.y, r: 34, life: 8, every: 0.05, kind: 'spring', color: 'rgba(255,176,48,0.35)', tick: (mm, z) => {
    for (const e of mm.enemiesOf(f)) {
      if (e.isMinion || Math.hypot(e.x - z.x, e.y - z.y) > z.r + e.r - 6 || e.z > 0) continue;
      const a = Math.atan2(e.y, e.x);
      mm.applyHit(f, e, { dmg: 4, kb: 260, kg: 5, knockup: 420, tag: 'A', angle: a });
      mm.fx({ type: 'ring', x: z.x, y: z.y, r: 50, color: '#ffb030', life: 0.35, w: 6 }); mm.text(e.x, e.y - 50, '🌀 BẬT!', '#ffb030', 16);
      z.t = z.life; return;
    }
  } });
}
// Thiết Vệ Pháo Đài (Roxie Lv12): cỗ máy công thành đứng yên nã pháo khắp bản đồ
function callSiege(f, m) {
  const p = m.arena.clamp({ x: f.x - Math.cos(f.facing) * 60, y: f.y - Math.sin(f.facing) * 60 }, 60);
  m.text(f.x, f.y - 64, '"Thiết Vệ — chế độ công thành!"', '#ffd27a', 15);
  m.fx({ type: 'telegraph', x: p.x, y: p.y, r: 80, color: '#ffb030', life: 0.8 });
  f.ws.mech = { alive: true, pending: true };
  m.later(0.8, () => {
    if (!f.alive) { f.ws.mech = null; return; }
    f.ws.mech = m.addMinion(new Minion(f, 'siege', p.x, p.y, 'Pháo Đài'));
    m.fx({ type: 'boom', x: p.x, y: p.y, r: 80, color: '#ffb030', life: 0.4 }); m.shake(8); m.sfx('robot');
  });
}
// Cyborg Tự Thân (Roxie Lv12): lắp giáp lên người 18s
function callCyborg(f, m) {
  f.setForm('cyborg'); f.ws.cyborgT = 18;
  m.fx({ type: 'ring', x: f.x, y: f.y, r: 70, color: '#ffb030', life: 0.5, w: 8 }); m.shake(8); m.sfx('robot');
  m.text(f.x, f.y - 70, '⚙️ CYBORG TỰ THÂN!', '#ffb030', 19);
}
function mechFlame(f, m, dt) {
  if (!(f.ws.flame > 0)) return;
  f.ws.flame -= dt; f.ws.fa = (f.ws.fa || 0) + dt;
  while (f.ws.fa >= 0.1) {
    f.ws.fa -= 0.1;
    const glue = f.form === 'mech' && f.T('roxie_9c');
    m.hitArc(f, Object.assign({ range: 175, arc: 52, dmg: 1.2, kb: 75, kg: 1, burn: [1.6, 3], tag: 'B', quiet: true }, glue ? { slow: [0.4, 0.6] } : {}));
    for (let j = 0; j < 4; j++) { const a = f.facing + rand(-0.45, 0.45), s = rand(250, 500); m.particle(f.x + Math.cos(f.facing) * 30, f.y + Math.sin(f.facing) * 30, { color: pick(['#ff5a1a', '#ffb02a']), life: 0.35, size: 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s }); }
  }
}
function mechHook(f, m) {
  shoot(f, m, aimOr(f, m, 440, 850), { speed: 850, r: 8, range: 440, kind: 'hook', color: '#ffe', hit: null,
    onHit: (mm, p, t) => {
      if (mm.applyHit(f, t, { dmg: 3, noKnock: true, tag: 'D' }) && !t.has('unstoppable')) { t.pull = { by: f, stop: f.r + t.r + 26, speed: 950, t: 0.6 }; t.addStatus('stun', 0.7); t.action = null; }
      return true;
    } });
}
function mechBoom(src, m, x, y) {
  const o = src.owner || src, big = o.T('roxie_9a'), R = big ? 280 : 185;
  m.hitCircle(src, { x, y, r: R, dmg: 14, kb: big ? 630 : 420, kg: 8, tag: 'D' });
  m.fx({ type: 'boom', x, y, r: R, color: '#ff7a2a', life: 0.55 }); m.sfx('boom_big');
  m.shake(20);
}
function ejectMech(f, m, boom) {
  f.clearForm(); f.ws.flame = 0; f.invulnT = Math.max(f.invulnT, 0.6);
  if (!boom) { m.fx({ type: 'boom', x: f.x, y: f.y, r: 70, color: '#aaaaaa', life: 0.35 }); m.text(f.x, f.y - 50, 'Thiết Vệ hỏng!', '#cccccc', 15); }
}

// Danh sách vũ khí chọn được (bỏ dạng/thực thể ẩn)
WEAPON_IDS.length = 0;
WEAPON_IDS.push(...Object.keys(WEAPONS).filter((k) => !WEAPONS[k].hidden));
