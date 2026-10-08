'use strict';
// ===== Death — Lưỡi Hái • Đi rừng / Hỗ trợ • móc kéo, kết liễu • mana • phép =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const ULT = 'death_ult';
  H.def({
    id: 'death', name: 'Death', color: '#8a7aa8', gfx: 'scythe', kit: 'fighter', pos: ['jungle', 'sup'], dmgType: 'magic',
    ranged: false, r: 0.7, resource: 'mana',
    stats: { hp: 675, hpG: 102, hpr: 1.8, hprG: 0.14, mp: 360, mpG: 42, mpr: 1.8, mprG: 0.09, ad: 66, adG: 3.8, armor: 32, armorG: 4.1, mr: 32, mrG: 1.7, as: 0.67, asG: 0.022, ms: 3.5, range: 2.2 },
    passive: {
      name: 'Lưỡi Hái Tử Thần',
      desc: 'Đánh thường quét vòng cung (kẻ địch khác trong vùng nhận 50%). Trúng bằng lưỡi (phần ngoài của tầm) +15% sát thương và hồi 10 (+2/cấp) máu; trúng kẻ vừa bị kéo thì hất tung 0.5s.',
      init(m, u) { u.ws.pulled = {}; },
      onAuto(m, u, t, info) {
        const d = M.dist(u, t) - t.r;
        if (d >= (u.st.range + u.r) * (H.T(u, '1a') ? 0.4 : 0.55)) { info.amt *= 1.15; info.extra.push(() => m.heal(u, u, 14 + 3 * u.level, true)); }
        if ((u.ws.pulled[t.id] || 0) > m.time) {
          u.ws.pulled[t.id] = 0;
          const c = H.T(u, '3c');                                     // Cắt Đứt Hy Vọng
          if (c) info.amt *= 1.4;
          info.extra.push(() => m.knockup(u, t, c ? 0.8 : 0.5));
        }
        // Sứ Giả Địa Ngục: đòn đánh kéo nhẹ mục tiêu về phía Death
        if (H.T(u, '12b') && t.kind === 'hero' && d > 1) { const w = H.dirTo(t, u); info.extra.push(() => m.knock(u, t, w.x, w.y, 0.5, 0.12)); }
        const v = H.dirTo(u, t), side = info.amt * 0.6;
        info.extra.push(() => m.hitCone(u, u.x, u.y, v.x, v.y, u.st.range + u.r + 0.4, 0.5, (e) => { if (e !== t) m.damage(u, e, side, 'phys', { tag: 'p', aoe: true }); }, { noFx: true }));
      },
      onDeal(m, u, t, info) {
        // Trảm Quyết Diện Rộng: Phán Quyết kết liễu mục tiêu dưới 15% máu
        if (H.T(u, '12a') && info.tag === 's2' && t.kind === 'hero' && t.hpPct < 0.15) { info.amt = Math.max(info.amt, t.hp * 3); if (m.fxOn) m.fx({ type: 'burst', x: t.x, y: t.y, color: '#d0c0ff' }); }
        const mk = t.hasKey(ULT);
        if (mk && mk.src === u && info.tag !== 'shade' && info.amt > 0) {
          const extra = info.amt * (H.T(u, '9b') ? 0.6 : 0.4);
          m.later(0.15, (mm) => { if (t.alive) { mm.damage(u, t, extra, 'magic', { tag: 'shade', noHook: true }); if (mm.fxOn) mm.fx({ type: 'shadeHit', x: t.x, y: t.y, sx: u.x, sy: u.y, n: H.T(u, '9b') ? 3 : 2, color: '#8a7aa8' }); } });
        }
      },
      // Hộ Thân Oan Hồn: linh hồn chặn đòn
      onTake(m, u, att, info) {
        if (!(u.ws.souls > 0) || !att || att.team === u.team || !(info.auto || G.ITEM_IS_SKILL(info))) return;
        u.ws.souls--; info.amt = 0;
        if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#b0a0ff', life: 0.4 });
      },
    },
    skills: {
      s1: {
        name: 'Lưỡi Hái Đoạt Mệnh', desc: 'Quăng liềm 7 đv; trúng kẻ đầu tiên thì gây sát thương phép và giật nó về cạnh Death.',
        cd: [14, 13, 12, 11, 10], cost: [60, 65, 70, 75, 80], castTime: 0.2,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0, 0.5);
          H.shoot(m, u, ctx.pt, { speed: 18, range: H.T(u, '12b') ? 9 : 7, r: 0.55, kind: 'hook', onHit: (mm, p, e) => {
            mm.damage(u, e, dmg * 1.15, 'magic', { tag: 's1' });
            const d = M.dist(u, e) - u.r - e.r - 0.6;
            if (d > 0.2) { const v = H.dirTo(e, u); mm.knock(u, e, v.x, v.y, d, 0.35); }
            if (H.T(u, '3b')) mm.later(0.35, (m3) => m3.addStatus(e, 'root', 0.75, 1, { src: u }));   // Lưỡi Kéo Tàn Phế
            u.ws.pulled[e.id] = mm.time + 2;
            if (mm.fxOn) mm.fx({ type: 'chain', a: u.id, b: e.id, life: 0.35 });
          } });
        },
        ai: { use: 'engage', range: 6.8, aim: 'point', speed: 18, skillshot: true, heroOnly: true },
      },
      s2: {
        name: 'Phán Quyết', desc: 'Bổ liềm trước mặt và phóng cầu hắc ám bay 7 đv; +50% sát thương lên mục tiêu dưới 30% máu.',
        cd: [9, 8.5, 8, 7.5, 7], cost: [50, 50, 50, 50, 50], castTime: 0.2,
        use(m, u, ctx) {
          if (H.T(u, '1c')) u.cd.s2 = Math.max(0.5, u.cd.s2 - 1.5);
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, ctx.v([80, 125, 170, 215, 260]), 0, 0.65);
          const low = H.T(u, '9a') ? 0.45 : 0.3;
          const hit = new Set();
          const f = (e) => { if (hit.has(e.id)) return; hit.add(e.id); m.damage(u, e, dmg * (e.hpPct < low ? 1.5 : 1), 'magic', { tag: 's2' }); };
          // Lưỡi Trảm Đoạt Hồn: nhát chém chữ X hình nón, đẩy lùi, hồi máu theo máu đã mất
          if (H.T(u, '6a')) {
            u.cd.s2 += 2;
            const hits = m.hitCone(u, u.x, u.y, v.x, v.y, 3.5, 0.6, (e) => { f(e); m.knock(u, e, v.x, v.y, 1.5, 0.2); }, { color: '#a090c0' });
            if (hits.some((e) => e.kind === 'hero')) m.heal(u, u, (u.st.maxHp - u.hp) * 0.08);
            return;
          }
          if (H.T(u, '12a')) m.hitCone(u, u.x, u.y, v.x, v.y, 4.5, 0.5, f, { color: '#a090c0' });
          else m.hitLine(u, u.x, u.y, v.x, v.y, 3, 1.6, f, { color: '#a090c0' });
          H.shoot(m, u, ctx.pt, { speed: 16, range: H.T(u, '12b') ? 9 : 7, r: 0.6, pierce: true, kind: 'darkorb', onHit: (mm, p, e) => f(e) });
        },
        ai: { use: 'poke', range: 6.5, aim: 'point', speed: 16, farm: 3 },
      },
      s3: {
        name: 'Xoay Liềm', desc: 'Thả liềm xoay tại điểm trong 6 đv trong 2s: sát thương và hút nhẹ về tâm. Bấm lại trong 2s: dịch chuyển tới liềm, chém vòng tròn.',
        cd: [14, 13, 12, 11, 10], cost: [60, 60, 60, 60, 60],
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 6, true), tick = ctx.v([20, 28, 36, 44, 52]);
          const pull = H.T(u, '3a') ? 1.2 : 0.6;
          const z = m.zone({ owner: u, x: p.x, y: p.y, r: 2, life: 2, every: 0.5, kind: 'scythe',
            tick: (mm, zz) => mm.hitCircle(u, zz.x, zz.y, zz.r, (e) => {
              mm.damage(u, e, tick, 'magic', { tag: 's3', aoe: true });
              const v = H.dirTo(e, zz); const d = M.dist(e, zz); if (d > 0.5) mm.knock(u, e, v.x, v.y, Math.min(pull, d), 0.12);
            }, { noFx: true }) });
          const dmg2 = H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0, 0.4);
          m.allowRecast(u, 's3', 2, (mm, uu) => {
            if (z.dead) return;
            // Thu Hồi Lưỡi Hái: giật liềm về tay, kéo kẻ địch trên đường về phía Death
            if (H.T(uu, '6b')) {
              const v = H.dirTo(z, uu), L = M.dist(z, uu);
              mm.hitLine(uu, z.x, z.y, v.x, v.y, L, 1.6, (e) => { mm.damage(uu, e, dmg2, 'magic', { tag: 's3' }); const w = H.dirTo(e, uu), d = M.dist(e, uu) - 1.2; if (d > 0.3) mm.knock(uu, e, w.x, w.y, d, 0.3); }, { color: '#a090c0' });
              z.dead = true; return;
            }
            mm.blink(uu, z.x, z.y);
            mm.hitCircle(uu, uu.x, uu.y, 2.2, (e) => mm.damage(uu, e, dmg2, 'magic', { tag: 's3' }), { color: '#a090c0' });
          });
        },
        ai: { use: 'cc', range: 6, aim: 'point', speed: 0, recastWhen: (m, u, t) => t && t.hpPct < 0.35 },
      },
      s4: {
        name: 'Gọi Hồn', desc: 'Đánh dấu một tướng trong 5 đv: 2 bóng ma bắt chước đòn của Death trong 5s (mọi sát thương Death gây lên nó lặp lại thêm 40% dạng phép), mục tiêu bị làm chậm 20%.',
        cd: [120, 100, 80], cost: [100, 100, 100], castTime: 0.2,
        can(m, u) { const t = u.ai && u.ai.target; return !!(t && t.kind === 'hero' && M.dist(u, t) < 5.5); },
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.kind === 'hero' ? ctx.tgt : u.ai && u.ai.target; if (!t || !t.alive) return;
          m.addStatus(t, 'mark', 5, 1, { key: ULT, src: u }); m.addStatus(t, 'slow', 5, 0.2, { src: u });
          m.damage(u, t, H.amt(u, ctx.v([100, 150, 200]), 0, 0.5), 'magic', { tag: 's4' });
          if (m.fxOn) m.fx({ type: 'shades', id: t.id, life: 5 });
        },
        ai: { use: 'ult', aim: 'unit', range: 5, heroOnly: true },
      },
    },
    ai: { order: ['s2', 's1', 's3'], engageRange: 6.5, role: 'fighter', bait: true },
    tags: ['cc'],
  });
  G.HEROES.death.tree = [
    [
      { name: 'Lưỡi Tử Thần', desc: 'Phần lưỡi liềm dài hơn: điểm ngọt tính từ 40% tầm (thay vì 55%).' },
      { name: 'Mùi Máu Tươi', desc: '+20% tốc chạy khi tiến về tướng địch dưới 50% máu.',
        tick(m, u) { const e = H.chasing(m, u, 10); if (e && e.hpPct < 0.5) m.addStatus(u, 'haste', 0.6, 0.2, { key: 'death_mm' }); } },
      { name: 'Gặt Nhanh', desc: 'Phán Quyết (S2) hồi chiêu nhanh hơn 1.5s.' },
    ],
    [
      { name: 'Xoáy Hút Linh Hồn', desc: 'Xoay Liềm (S3) hút kẻ địch về tâm mạnh gấp đôi.' },
      { name: 'Lưỡi Kéo Tàn Phế', desc: 'Lưỡi Hái Đoạt Mệnh (S1) kéo trúng: trói chân thêm 0.75s.' },
      { name: 'Cắt Đứt Hy Vọng', desc: 'Đánh thường lên kẻ vừa bị kéo: hất tung 0.8s (thay vì 0.5s) và +40% sát thương.' },
    ],
    [
      { name: 'Lưỡi Trảm Đoạt Hồn', desc: 'Phán Quyết thành nhát chém chữ X hình nón 3.5 đv, đẩy lùi 1.5 đv; trúng tướng hồi 8% máu đã mất (hồi chiêu +2s).' },
      { name: 'Thu Hồi Lưỡi Hái', desc: 'Xoay Liềm: dùng lại để giật liềm về tay, kéo mọi kẻ địch trên đường về phía Death (thay cho dịch chuyển).' },
      { name: 'Hơi Thở Tử Thần', desc: 'Kẻ địch trong 3 đv quanh Death chậm 15%.',
        tick(m, u) { for (const e of m.enemiesIn(u.team, u.x, u.y, 3)) if (e.kind === 'hero' || e.kind === 'minion') m.addStatus(e, 'slow', 0.6, 0.15, { src: u, key: 'death_breath' }); } },
    ],
    [
      { name: 'Án Tử Tức Thì', desc: 'Phán Quyết +50% sát thương lên mục tiêu dưới 45% máu (thay vì 30%).' },
      { name: 'Tam Vị Nhất Thể', desc: 'Gọi Hồn: 3 bóng ma — lặp lại 60% sát thương (thay vì 40%).' },
      { name: 'Thu Hoạch Linh Hồn', desc: 'Hạ gục tướng: hồi 15% máu tối đa và 40 mana.',
        onKill(m, u, v) { if (v.kind !== 'hero') return; m.heal(u, u, u.st.maxHp * 0.15); u.mp = Math.min(u.st.maxMp, u.mp + 40); } },
    ],
    [
      { name: 'Trảm Quyết Diện Rộng', desc: 'Phán Quyết bổ thành sóng hình nón 4.5 đv; tướng dưới 15% máu trúng đòn bị kết liễu ngay.' },
      { name: 'Sứ Giả Địa Ngục', desc: 'Đổi sang Xích Liềm: +0.8 tầm đánh, Lưỡi Hái và cầu Phán Quyết bay xa 9 đv; đánh thường kéo nhẹ mục tiêu 0.5 đv về phía Death.', stats: { range: 0.8 } },
      { name: 'Hộ Thân Oan Hồn', desc: 'Mỗi lần hạ gục tướng: +1 linh hồn xoay quanh (tối đa 3); mỗi linh hồn chặn hoàn toàn 1 đòn đánh hoặc chiêu.',
        onKill(m, u, v) { if (v.kind === 'hero') u.ws.souls = Math.min(3, (u.ws.souls || 0) + 1); } },
    ],
  ];
})();
