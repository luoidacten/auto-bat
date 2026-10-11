'use strict';
// ===== Tsukiyo — Ám Nguyệt Nhẫn Giả • sát thủ đa hình (mỗi chiêu 1 trong 3 nhánh) • Nội Năng • hỗn hợp =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const MC = () => G.C.MANA_COST;
  const BR = { ap: '🔮 Kỹ Thuật', ad: '⚔ Tất Sát', sp: '🌪 Bí Thuật' };
  const br = (u, k) => (u.ws.br && u.ws.br[k]) || 'ad';
  const need = (u) => (H.T(u, '3a') ? { ap: 100, ad: 75, sp: 0.28 } : { ap: 120, ad: 90, sp: 0.35 });
  const hasAP = (u) => H.T(u, '12a') || u.st.ap >= need(u).ap;
  const hasAD = (u) => H.T(u, '12a') || (u.bonus.ad || 0) + (u.st.ad - u.base.ad) * 0.5 >= need(u).ad;
  const hasSP = (u) => H.T(u, '12a') || (u.st.asBonus - (u.base.asBonus || 0)) + (u.bonus.msPct || 0) >= need(u).sp;
  const maxDash = (u) => (H.T(u, '6b') ? 4 : 3);
  const gainE = (u, n) => { u.mp = Math.min(u.st.maxMp, u.mp + n); };
  function pickBranches(m, u) {
    // thiên hướng theo lối build đang theo (sát thủ → Tất Sát, đấu sĩ → Bí Thuật, pháp sư trâu → Kỹ Thuật), mỗi chiêu vẫn có thể lệch
    const plan = (u.buildPlan && u.buildPlan.id) || '';
    const lean = /mage/.test(plan) ? 'ap' : /duel/.test(plan) ? 'sp' : /assa/.test(plan) ? 'ad' : ['ap', 'ad', 'sp'][m.rng.int(0, 2)];
    const o = {};
    for (const k of ['s1', 's2', 's3', 's4']) { const r = m.rng.next(); o[k] = r < 0.6 ? lean : ['ap', 'ad', 'sp'][m.rng.int(0, 2)]; }
    u.ws.br = o;
  }
  H.def({
    id: 'tsukiyo', name: 'Tsukiyo', color: '#6b6bd6', gfx: 'ninja', kit: 'fighter', pos: ['jungle', 'mid'], dmgType: 'phys',
    ranged: true, projSpeed: 24, projKind: 'shuriken', r: 0.54, resource: 'mana',
    stats: { range: 5.5, hp: 565, hpG: 88, mp: 100, mpG: 10, mpr: 0, mprG: 0, armor: 27, armorG: 3.7, mr: 30, mrG: 1.4, ms: 3.55, ad: 62, adG: 3.8, ap: 0, as: 0.7, asG: 0.026 },
    manaLabel: 'Nội Năng', manaColor: '#ffd84a',
    passive: {
      name: 'Thích Ứng Cận – Viễn • Tam Đại Nhẫn Thuật • Nhẫn Đạo Toàn Giác',
      desc: 'Dùng Nội Năng (100 +10/cấp, tự hồi 10/giây) thay mana. Mục tiêu xa hơn 2 đv: ném phi tiêu; gần: song đao chém (+20%). Đòn đánh trúng tướng +8 Nội Năng; S1/S2 trúng tướng +15. Mỗi chiêu theo 1 trong 3 nhánh: Kỹ Thuật (phép, khống chế), Tất Sát (vật lý, dồn sát thương), Bí Thuật (tốc độ, phản đòn). Nhẫn Đạo: 120 Công Phép → phi tiêu thêm phép và hiệu ứng ngẫu nhiên, nhát chém gắn Dấu Ấn Hắc Ám; 90 Công Vật Lý thêm → ném 3 phi tiêu / chém 2 nhát (4s); 35% tốc đánh + tốc chạy thêm → né 1 đòn cận chiến và chém phản 1 đòn tầm xa (12s mỗi loại).',
      init(m, u) { pickBranches(m, u); u.ws.dash = maxDash(u); u.ws.dashT = 0; u.ws.ss = 0; u.ws.tri = 0; u.ws.stand = 0; u.ws.refl = 0; },
      update(m, u, dt) {
        gainE(u, (H.T(u, '1a') ? 16 : 10) * dt);
        if (br(u, 's1') === 'sp' && u.ws.dash < maxDash(u)) { u.ws.dashT += dt; if (u.ws.dashT >= 8) { u.ws.dashT = 0; u.ws.dash++; } }
        // Loạn Vũ Phi Tiêu: kết thúc thì xả loạt phi tiêu tìm diệt
        if (u.ws.flurryEnd && m.time >= u.ws.flurryEnd) {
          const n = Math.min(12, u.ws.ss), t = H.nearestEnemyHero(m, u, 9); u.ws.flurryEnd = 0; u.ws.ss = 0;
          if (t) for (let i = 0; i < n; i++) m.later(i * 0.06, (mm) => H.homing(mm, u, t, { speed: 22, kind: 'arrow', onHit: (m2, p, e) => m2.damage(u, e, H.amt(u, 8 + 2 * u.level, 0.25, 0), 'phys', { tag: 's1' }) }));
        }
        // Kiếm Thế: hết đạn bắn vào thì thu thế
        if (u.ws.stand && m.time - u.ws.standHit > [0.6, 0.8, 0.8, 1.0, 1.2][Math.max(0, u.ranks.s3 - 1)] && m.time - u.ws.standT0 > 1) { u.ws.stand = 0; m.removeStatus(u, 'reduce', 'tsu_stand'); }
        if (u.ws.stand && m.time - u.ws.standT0 > 6) { u.ws.stand = 0; m.removeStatus(u, 'reduce', 'tsu_stand'); }
        if (u.ws.shade > m.time && !u.hasKey('tsu_shade')) u.ws.shade = 0;
      },
      onAuto(m, u, t, info) {
        const melee = M.dist(u, t) <= 2.0 + t.r;
        if (t.kind === 'hero') gainE(u, 8);
        if (melee) info.amt *= 1.2;
        if (hasAP(u)) {
          info.extra.push(() => {
            if (!t.alive) return;
            if (melee) { m.dot(u, t, 6 + 2 * u.level + u.st.ap * 0.05, 3, 'magic', 'tsu_dark'); m.addStatus(t, 'buff', 3, 1, { key: 'tsu_dark', mods: { armorPct: -0.2 } }); }
            else {
              m.damage(u, t, 10 + 2 * u.level + u.st.ap * 0.25, 'magic', { tag: 'p' });
              const r = m.rng.int(0, 5);
              if (r === 0) m.hitCircle(u, t.x, t.y, 1.5, (e) => m.damage(u, e, 10 + u.st.ap * 0.15, 'magic', { tag: 'p', aoe: true }));
              else if (r === 1) m.dot(u, t, 5 + u.level, 3, 'magic', 'tsu_poison');
              else if (r === 2) m.dot(u, t, 6 + u.level, 2, 'magic', 'tsu_burn');
              else if (r === 3) m.addStatus(t, 'root', 0.75, 1, { src: u });
            }
          });
        }
        if (hasAD(u) && H.ready(m, u, 'tsu_ad', 4)) info.extra.push(() => { if (t.alive) m.damage(u, t, info.amt * (melee ? 0.8 : 0.6), info.type, { tag: 'p' }); });
        // Loạn Vũ: 2 phi tiêu tách góc
        if (u.ws.flurryEnd > m.time) { u.ws.ss += 2; const o = m.enemiesIn(u.team, t.x, t.y, 3).filter((e) => e !== t)[0] || t; info.extra.push(() => o.alive && m.damage(u, o, info.amt * 0.35, 'phys', { tag: 's1' })); }
        // Tam Trọng Trảm Kích
        if (u.ws.tri > 0 && u.ws.triT > m.time) {
          const k = 4 - u.ws.tri; u.ws.tri--;
          if (k === 1) info.extra.push(() => m.addStatus(t, 'slow', 1.5, 0.4, { src: u }));
          if (k === 2) info.extra.push(() => { if (t.ga > 0) t.ga = Math.max(0, t.ga - 150); });
          if (k === 3) { info.crit = true; info.amt *= 2.0; }
          if (H.T(u, '6c')) u.ws.penNext = true;
          info.amt *= 1.25;
        }
        // Huyền Ảnh Ám Bộ: hư ảnh chém bồi 50%, làm chậm 30%
        if (u.ws.shade > m.time) { const a = info.amt * 0.5; info.extra.push(() => { if (t.alive) { m.damage(u, t, a, 'phys', { tag: 's4' }); m.addStatus(t, 'slow', 1, 0.3, { src: u, key: 'tsu_shade' }); } }); }
      },
      onDeal(m, u, t, info) { if (u.ws.penNext && info.auto) { u.ws.penNext = false; const ar = t.st.armor; t.st.armor = ar * 0.6; m.later(0, () => { t.st.armor = ar; }); } },
      onTake(m, u, att, info) {
        const a = att; if (!a || a.team === u.team || !(info.amt > 0)) return;
        const melee = !a.ranged || M.dist(a, u) < 2.6;
        // Tiên Cảnh Thế Thân
        if (u.ws.sub > m.time) {
          u.ws.sub = 0; info.amt = 0; const from = { x: u.x, y: u.y };
          m.later(0, (mm) => {
            if (!u.alive) return;
            if (H.T(u, '6a') && a.alive && a.kind === 'hero') { const v = H.dirTo(u, a); mm.blink(u, a.x + v.x * 1.2, a.y + v.y * 1.2); mm.damage(u, a, u.st.ad * 2, 'phys', { tag: 's3', crit: true }); }
            else { const e = H.nearestEnemyHero(mm, u, 10), v = e ? H.dirTo(e, u) : { x: -u.fx, y: -u.fy }; mm.blink(u, u.x + v.x * 6, u.y + v.y * 6); }
            mm.zone({ owner: u, x: from.x, y: from.y, r: 2.5, life: 2, every: 0.5, kind: 'miasma', tick: (m2) => m2.hitCircle(u, from.x, from.y, 2.5, (e) => { m2.addStatus(e, 'blind', 0.8, 1, { src: u }); m2.damage(u, e, 8 + u.st.ap * 0.1, 'magic', { tag: 's3', aoe: true }); }, { noFx: true }) });
          });
          return;
        }
        // Kiếm Thế Vạn Lưu Phản Pháo
        if (u.ws.stand) {
          if (melee && !u.ws.standMelee && info.auto) { u.ws.standMelee = 1; info.amt = 0; m.addStatus(a, 'stun', 1, 1, { src: u }); return; }
          if (!melee) {
            u.ws.standHit = m.time; const red = [0.7, 0.75, 0.8, 0.85, 0.9][Math.max(0, u.ranks.s3 - 1)];
            const back = info.amt * red * (H.T(u, '3c') ? 1.25 : 1); info.amt *= 1 - red; u.ws.refl++;
            m.later(0, (mm) => { if (a.alive) mm.damage(u, a, back, 'phys', { tag: 's3', noHook: true }); });
            if (H.T(u, '12b') && u.ws.refl === 5) { u.mp = u.st.maxMp; m.shield(u, u, u.st.maxHp * 0.3, 4); }
            return;
          }
        }
        // Nhẫn Đạo tốc độ: né cận chiến / chém phản tầm xa
        if (hasSP(u) && info.auto && a.kind === 'hero') {
          if (melee && H.ready(m, u, 'tsu_dodge', 12)) { info.amt = 0; const v = H.dirTo(a, u); m.later(0, (mm) => mm.dashTo(u, u.x + v.x * 1.5, u.y + v.y * 1.5, 16, {})); if (m.fxOn) m.fx({ type: 'miss', x: u.x, y: u.y }); }
          else if (!melee && H.ready(m, u, 'tsu_parry', 12)) { const back = info.amt; info.amt = 0; m.later(0, (mm) => a.alive && mm.damage(u, a, back, 'phys', { tag: 'p', noHook: true })); }
        }
      },
      onKill(m, u, v) { if (v.kind === 'hero' && H.T(u, '9c') && u.ws.shade > m.time) { u.ws.shade += 4; const s = u.statuses.find((x) => x.key === 'tsu_shade'); if (s) s.t += 4; } },
    },
    skills: {
      s1: {
        name: 'Nhẫn Thuật Nhất', desc: '🔮 Hỏa Cầu Chi Thuật: cầu lửa bay 7.5 đv, nổ bán kính 2.5 sát thương phép lớn + thiêu đốt 3s. ⚔ Loạn Vũ Phi Tiêu: +60% tốc đánh 5s, mỗi đòn ném thêm 2 phi tiêu tách góc; hết giờ xả loạt phi tiêu tìm diệt theo số đã ném. 🌪 Thuấn Trảm: lướt 4.5 đv chém trên đường, +35% tốc chạy 1.5s (tích 3 lần, hồi 1 lần mỗi 8s).',
        cd: (m, u) => (br(u, 's1') === 'sp' ? 0.6 : [6, 5.5, 5, 4.5, 4][Math.max(0, u.ranks.s1 - 1)]), cost: 50,
        can(m, u) { return br(u, 's1') !== 'sp' || u.ws.dash > 0; },
        use(m, u, ctx) {
          const b = br(u, 's1');
          if (b === 'ap') {
            const dmg = H.amt(u, ctx.v([80, 125, 170, 215, 260]), 0, 0.8);
            H.shoot(m, u, ctx.pt, { speed: 16, range: 7.5, r: 0.6, kind: 'fireball', hitMinions: true, onEnd: (mm, p) => boom(mm, p), onHit: (mm, p) => boom(mm, p) });
            const boom = (mm, p) => { if (p.boomed) return; p.boomed = true; p.dead = true;
              mm.hitCircle(u, p.x, p.y, 2.5, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's1', aoe: true }); mm.dot(u, e, dmg * 0.08, 3, 'magic', 'tsu_fire'); if (e.kind === 'hero') gainE(u, 15); }, { color: '#ff7a3a' });
              if (H.T(u, '3b')) mm.zone({ owner: u, x: p.x, y: p.y, r: 2, life: 3, every: 0.5, kind: 'lava', tick: (m2) => m2.hitCircle(u, p.x, p.y, 2, (e) => m2.damage(u, e, e.st.maxHp * 0.02, 'magic', { tag: 's1', aoe: true }), { noFx: true }) });
            };
          } else if (b === 'ad') {
            u.ws.flurryEnd = m.time + 5; u.ws.ss = 0;
            m.addStatus(u, 'buff', 5, 1, { key: 'tsu_flurry', mods: { asPct: 0.6 } });
          } else {
            u.ws.dash--; const p = H.toward(u, ctx.pt, 4.5, true), hit = new Set(), dmg = H.amt(u, ctx.v([50, 75, 100, 125, 150]), 0.7, 0);
            m.dashTo(u, p.x, p.y, 22, { onContact: (mm, e) => { if (hit.has(e.id)) return; hit.add(e.id); mm.damage(u, e, dmg, 'phys', { tag: 's1' }); if (e.kind === 'hero') gainE(u, 15); } });
            m.addStatus(u, 'haste', 1.5, 0.35, { key: 'tsu_s1' });
          }
        },
        ai: { use: 'custom', aim: 'point', pick(m, u, t, fleeing) {
          const b = br(u, 's1');
          if (b === 'sp') { if (fleeing) { const e = H.nearestEnemyHero(m, u, 10); if (e) { const v = H.dirTo(e, u); return { pt: { x: u.x + v.x * 5, y: u.y + v.y * 5 } }; } } if (t && M.dist(u, t) < 6 && M.dist(u, t) > 1.5 && u.ws.dash > 1) return { pt: { x: t.x, y: t.y }, tgt: t }; return null; }
          if (!t) return null;
          if (b === 'ap' && M.dist(u, t) < 7.5) return { pt: { x: t.x, y: t.y }, tgt: t };
          if (b === 'ad' && M.dist(u, t) < u.st.range + 0.5) return { pt: { x: t.x, y: t.y }, tgt: t };
          return null;
        } },
      },
      s2: {
        name: 'Nhẫn Thuật Nhị', desc: '🔮 Mộc Độn – Bẫy Trói: lướt lùi 3.5 đv, đặt bẫy ở chỗ cũ (trói 1.5s + sát thương phép). ⚔ Tam Trọng Trảm Kích: 3 đòn đánh kế tiếp trong 5s — nhát 1 chậm 40%, nhát 2 phá 150 Hộ Giáp, nhát 3 chí mạng ×2. 🌪 Song Nhận Vô Ảnh: 2 nhát chém chữ X hình nón, toàn bộ là sát thương chuẩn.',
        cd: [9, 8.5, 8, 7.5, 7], cost: 58,
        use(m, u, ctx) {
          const b = br(u, 's2');
          if (b === 'ap') {
            const x = u.x, y = u.y, e = H.nearestEnemyHero(m, u, 8), v = e ? H.dirTo(e, u) : H.dirTo(ctx.pt, u), dmg = H.amt(u, ctx.v([70, 105, 140, 175, 210]), 0, 0.6);
            m.dashTo(u, u.x + v.x * 3.5, u.y + v.y * 3.5, 16, {});
            let used = false;
            m.zone({ owner: u, x, y, r: 1.4, life: 8, every: 0.1, kind: 'trap', tick: (mm, z) => { if (used) return; const L = mm.enemiesIn(u.team, x, y, 1.4); if (!L.length) return; used = true; z.life = 0;
              for (const t of L) { mm.addStatus(t, 'root', 1.5, 1, { src: u }); mm.damage(u, t, dmg, 'magic', { tag: 's2' }); if (t.kind === 'hero') gainE(u, 15); } } });
          } else if (b === 'ad') { u.ws.tri = 3; u.ws.triT = m.time + 5; u.atkT = Math.min(u.atkT, 0.1); }
          else {
            const dmg = H.amt(u, ctx.v([45, 65, 85, 105, 125]), 0.55, 0), cv = H.dirTo(u, ctx.pt);
            for (let i = 0; i < 2; i++) m.later(i * 0.15, (mm) => mm.hitCone(u, u.x, u.y, cv.x, cv.y, 3, 0.6, (e) => { mm.damage(u, e, dmg, 'true', { tag: 's2' }); if (e.kind === 'hero' && i === 0) gainE(u, 15); }, { color: '#6b6bd6' }));
          }
        },
        ai: { use: 'custom', aim: 'point', pick(m, u, t, fleeing) {
          const b = br(u, 's2');
          if (b === 'ap') { const e = H.nearestEnemyHero(m, u, 4); return e && (fleeing || u.hpPct < 0.6 || !e.ranged) ? { pt: { x: e.x, y: e.y }, tgt: e } : null; }
          if (!t) return null;
          if (b === 'ad' && M.dist(u, t) < u.st.range) return { pt: { x: t.x, y: t.y }, tgt: t };
          if (b === 'sp' && M.dist(u, t) < 3) return { pt: { x: t.x, y: t.y }, tgt: t };
          return null;
        } },
      },
      s3: {
        name: 'Nhẫn Thuật Tam', desc: '🔮 Tiên Cảnh Thế Thân: tập trung 2.5s — trúng đòn thì dịch chuyển 6 đv tới chỗ an toàn, để lại cành cây nổ khói độc làm mù. ⚔ Yên Mạc Dạ Hành: bom khói bán kính 3.5 trong 4s — địch bên trong bị mù, Tsukiyo tàng hình khi đứng trong khói. 🌪 Kiếm Thế Vạn Lưu Phản Pháo: đòn cận chiến đầu tiên bị phản choáng 1s; đòn tầm xa bị chém phản ngược kẻ bắn và giảm 70/75/80/85/90% sát thương — giữ thế tới khi không còn đạn bắn vào.',
        cd: [14, 13, 12, 11, 10], cost: 66,
        use(m, u, ctx) {
          const b = br(u, 's3');
          if (b === 'ap') { u.ws.sub = m.time + 2.5; if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#9adf7a', life: 2.5 }); }
          else if (b === 'ad') {
            const p = H.toward(u, ctx.pt, 6, false), x = p.x, y = p.y;
            m.zone({ owner: u, x, y, r: 3.5, life: 4, every: 0.25, kind: 'smoke', tick: (mm) => {
              mm.hitCircle(u, x, y, 3.5, (e) => mm.addStatus(e, 'blind', 0.4, 1, { src: u, key: 'tsu_smoke' }), { noFx: true });
              if (M.dist(u, { x, y }) < 3.5 && m.time - (u.lastAtkT || -99) > 0.5) mm.addStatus(u, 'stealth', 0.35, 1, { key: 'tsu_smoke' });
            } });
          } else {
            u.ws.stand = 1; u.ws.standT0 = m.time; u.ws.standHit = m.time; u.ws.standMelee = 0; u.ws.refl = 0;
            m.addStatus(u, 'reduce', 6, 0, { key: 'tsu_stand' });
            if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#c0c0ff', life: 1 });
          }
        },
        ai: { use: 'custom', aim: 'point', pick(m, u, t, fleeing) {
          const b = br(u, 's3'), e = H.nearestEnemyHero(m, u, 8), hurt = m.time - (u.lastDmgT || -99) < 1;
          if (!e) return null;
          if (b === 'ap') return hurt && (u.hpPct < 0.7 || fleeing) ? { pt: { x: u.x, y: u.y } } : null;
          if (b === 'ad') return M.dist(u, e) < 5 ? { pt: { x: (u.x + e.x) / 2, y: (u.y + e.y) / 2 }, tgt: e } : null;
          const shooters = m.heroes.filter((h) => h.alive && h.team !== u.team && h.ranged && M.dist(h, u) < 10 && h.attackTarget === u).length;
          return (shooters && hurt) || (e && !e.ranged && M.dist(u, e) < 2.5 && hurt) ? { pt: { x: u.x, y: u.y } } : null;
        } },
      },
      s4: {
        name: 'Nhẫn Thuật Tối Thượng', desc: '🔮 Hắc Nguyệt Diệt Thế Cầu: cảnh báo bán kính 8; sau 2/1.5/1s quả cầu bóng tối nổ — sát thương phép cực lớn, choáng 1.5s, mù 3s. ⚔ Huyền Ảnh Ám Bộ: 5/6/8s +40% tốc chạy, mỗi đòn đánh gọi Hư Ảnh chém bồi 50%, mọi đòn làm chậm 30%. 🌪 Song Ảnh Xuất Trận: gọi 1/1/2 phân thân lao lên trước, thừa hưởng 50% chỉ số, tồn tại 12/16/20s.',
        cd: [90, 75, 60], cost: 100,
        use(m, u, ctx) {
          const b = br(u, 's4');
          if (b === 'ap') {
            const p = H.toward(u, ctx.pt, 6, false), delay = H.T(u, '9a') ? 0.5 : ctx.v([2, 1.5, 1]), dmg = H.amt(u, ctx.v([300, 450, 600]), 0, 1.1);
            m.telegraph({ shape: 'circle', x: p.x, y: p.y, r: 8, life: delay, team: u.team, color: '#4a3aa0' });
            m.later(delay, (mm) => mm.hitCircle(u, p.x, p.y, 8, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's4', aoe: true }); mm.addStatus(e, 'stun', 1.5, 1, { src: u }); mm.addStatus(e, 'blind', 3, 1, { src: u }); }, { color: '#4a3aa0' }));
          } else if (b === 'ad') {
            const d = ctx.v([5, 6, 8]); u.ws.shade = m.time + d;
            m.addStatus(u, 'buff', d, 1, { key: 'tsu_shade', mods: { msPct: 0.4, asPct: 0.25 } });
            if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🌑 Nhận Lệnh!', color: '#6b6bd6' });
          } else {
            const n = ctx.v([1, 1, 2]), life = ctx.v([12, 16, 20]), k = H.T(u, '9b') ? 0.75 : 0.5, v = H.dirTo(u, ctx.pt);
            for (let i = 0; i < n; i++) { const d = m.makeDecoy(u, u.x, u.y, { life, hp: k, dmg: k, runTo: { x: u.x + v.x * 5 + (i ? -v.y : v.y) * 1.5, y: u.y + v.y * 5 + (i ? v.x : -v.x) * 1.5 } }); d.ranged = false; d.st.range = 1.6; }
          }
        },
        ai: { use: 'ult', range: 7, aim: 'point', aoe: 6 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 5, role: 'assassin' },
    tags: ['stealth'],
    branchName: (u, k) => BR[br(u, k)],
  });
  G.HEROES.tsukiyo.tree = [
    [
      { name: 'Nội Năng Tuôn Trào', desc: 'Nội Năng tự hồi 16/giây.' },
      { name: 'Ám Tiêu Tốc Độ', desc: 'Phi tiêu bay nhanh hơn 40%, tầm ném 6.5 đv.', stats: { range: 1 } },
      { name: 'Nhẫn Bộ Vô Hình', desc: 'Bước chân không phát tiếng động (−25% bị nhìn thấy).', stats: { visPct: 0.1 } },
    ],
    [
      { name: 'Tâm Pháp Toàn Năng', desc: 'Ngưỡng Nhẫn Đạo giảm: 100 Công Phép, 75 Công Vật Lý, 28% Tốc Độ.' },
      { name: 'Hỏa Cầu Lan Tỏa', desc: 'Hỏa Cầu để lại vũng dung nham 3s.' },
      { name: 'Kiếm Thế Phản Lực', desc: 'Kiếm Thế phản đòn mạnh hơn 25%.' },
    ],
    [
      { name: 'Thế Thân Đoạt Mệnh', desc: 'Thế Thân kích hoạt: hiện ngay sau lưng kẻ tấn công kèm một nhát đâm chí mạng.' },
      { name: 'Thuấn Trảm Tứ Đoạn', desc: 'Thuấn Trảm tích 4 lần.' },
      { name: 'Tam Trọng Bộc Phá', desc: 'Tam Trọng Trảm Kích bỏ qua 40% giáp.' },
    ],
    [
      { name: 'Ám Nguyệt Thuấn Niệm', desc: 'Hắc Nguyệt Diệt Thế Cầu niệm 0.5s.' },
      { name: 'Phân Thân Thần Phục', desc: 'Phân thân thừa hưởng 75% chỉ số.' },
      { name: 'Hư Ảnh Trảm Vũ', desc: 'Huyền Ảnh Ám Bộ: hạ tướng kéo dài thêm 4s.' },
    ],
    [
      { name: 'Vô Song Nhẫn Hoàng', desc: 'Phong cách: mở cả 3 tầng Nhẫn Đạo không cần chỉ số.' },
      { name: 'Bất Diệt Kiếm Vũ', desc: 'Phong cách: Kiếm Thế phản 5 đòn → hồi đầy Nội Năng + giáp ảo 30% máu.' },
      { name: 'Huyền Thiết Ám Bộ', desc: '+10% Công Vật Lý, +10% Công Phép, +6% tốc chạy.', stats: { physAmp: 0.1, magicAmp: 0.1, msPct: 0.06 } },
    ],
  ];
})();
