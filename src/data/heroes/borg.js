'use strict';
// ===== Borg — Nắm Đấm • Đường trên / Đi rừng • đấu sĩ lì đòn, khóa mục tiêu • KHÔNG MANA • vật lý =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const rage = (u) => Math.max(0, Math.min(1, (1 - u.hpPct) / 0.7));     // 0 khi đầy máu → 1 khi dưới 30% máu
  const burn = (m, u, t) => m.dot(u, t, 8 + 2 * u.level, 2, 'magic', 'borg_burn');
  H.def({
    id: 'borg', name: 'Borg', color: '#ff7a4a', gfx: 'fist', kit: 'fighter', pos: ['top', 'jungle'], dmgType: 'phys',
    ranged: false, r: 0.72, resource: 'none',
    stats: { hp: 640, hpG: 100, ad: 63, adG: 3.8, armor: 33, armorG: 4.2, mr: 32, mrG: 1.9, as: 0.68, asG: 0.022, ms: 3.5, range: 1.45 },
    passive: {
      name: 'Huyết Chiến',
      desc: 'Càng ít máu càng đánh đau (tối đa +35% khi dưới 30% máu); dưới 30% máu đòn đánh gây thiêu đốt. Đấm Móc: cứ đòn đánh thường thứ 3 hất tung 0.3s.',
      init(m, u) { u.ws.hook = 0; u.ws.absorb = 0; u.ws.guardEnd = -9; },
      onDeal(m, u, t, info) { info.amt *= 1 + 0.35 * rage(u); },
      onAuto(m, u, t, info) {
        const every = H.T(u, '1c') ? 2 : 3;
        u.ws.hook = (u.ws.hook + 1) % every;
        const low = u.hpPct < 0.3;
        if (low || H.T(u, '12b')) info.extra.push(() => burn(m, u, t));
        if (u.ws.hook === 0) info.extra.push(() => {
          if (H.T(u, '6b')) { m.knockup(u, t, 0.6); m.later(0.6, (mm) => mm.addStatus(t, 'stun', 0.5, 1, { src: u })); }
          else m.knockup(u, t, 0.3);
        });
        else if (H.T(u, '9c') && low && t.kind === 'hero' && H.ready(m, u, 'nd' + t.id, 2)) info.extra.push(() => m.knockup(u, t, 0.3));
      },
      onTake(m, u, att, info) {
        if (u.ws.guard > m.time) { const blocked = info.amt * 0.5; info.amt -= blocked; u.ws.absorb += blocked; }
      },
    },
    skills: {
      s1: {
        name: 'Chộp & Quật', desc: 'Lao tới 4 đv chộp tướng đầu tiên chạm phải, quật ra sau lưng: sát thương và choáng 1s.',
        cd: [12, 11.5, 11, 10.5, 10], castTime: 0.05,
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 4, true), dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0.6);
          const v = H.dirTo(u, ctx.pt);
          m.dashTo(u, p.x, p.y, 18, { onContact: (mm, uu, e) => {
            if (e.kind !== 'hero' && e.kind !== 'pet' && e.kind !== 'monster') return;
            mm.damage(u, e, dmg, 'phys', { tag: 's1' });
            const stun = H.T(u, '3b') ? 1.5 : 1;
            if (H.T(u, '6a')) {   // Cú Ném Tử Thần: ném bổng mục tiêu 5 đv về phía trước, đập tường choáng thêm
              mm.knock(u, e, v.x, v.y, 5, 0.4, { onWall: (m3, ee) => m3.addStatus(ee, 'stun', 0.75, 1, { src: u }) });
              mm.later(0.4, (m3) => m3.addStatus(e, 'stun', stun * 0.75, 1, { src: u }));
            } else {
              const back = M.dist(u, e) + u.r + e.r + 0.6;
              mm.knock(u, e, -v.x, -v.y, back, 0.25);
              mm.later(0.25, (m3) => m3.addStatus(e, 'stun', stun, 1, { src: u }));
            }
            return 'stop';
          } });
        },
        ai: { use: 'engage', range: 4.2, aim: 'unit', heroOnly: true },
      },
      s2: {
        name: 'Trả Đòn', desc: 'Cú đấm toàn lực hình nón 2.6 đv. Vừa Gồng Mình (trong 3s): cộng 40% sát thương đã hấp thụ và đẩy lùi 2 đv.',
        cd: [9, 8.5, 8, 7.5, 7], castTime: 0.15,
        use(m, u, ctx) {
          const fresh = m.time - u.ws.guardEnd < 3 && u.ws.absorb > 0;
          let v = H.dirTo(u, ctx.pt);
          // Cú Húc Xuyên Giáp: chưa gồng thì lao 5 đv như xe bọc thép rồi mới đấm
          if (!fresh && H.T(u, '12a')) {
            m.dashTo(u, u.x + v.x * 5, u.y + v.y * 5, 16, { unstop: true, onContact: (mm, uu, e) => { mm.knock(u, e, v.x, v.y, 1.5, 0.2); } });
            m.addStatus(u, 'unstop', 0.35, 1);
          }
          const extra = fresh ? u.ws.absorb * (H.T(u, '9b') ? 0.8 : 0.4) : 0;
          const dmg = H.amt(u, ctx.v([70, 110, 150, 190, 230]), 0.9) + extra;
          const go = (mm) => mm.hitCone(u, u.x, u.y, v.x, v.y, 2.6, 0.6, (e) => {
            mm.damage(u, e, dmg, 'phys', { tag: 's2' });
            if (fresh) { mm.knock(u, e, v.x, v.y, 2, 0.2); if (H.T(u, '9b')) mm.addStatus(e, 'stun', 0.75, 1, { src: u }); }
            if (H.T(u, '3c')) burn(mm, u, e);
          }, { color: '#ff9a5a' });
          if (!fresh && H.T(u, '12a')) m.later(0.32, (mm) => { if (u.alive) { const t = H.nearestEnemyHero(mm, u, 4); if (t) v = H.dirTo(u, t); go(mm); } });
          else go(m);
          if (fresh) { u.ws.absorb = 0; u.ws.guardEnd = -9; }
        },
        ai: { use: 'burst', range: 2.5, aim: 'unit', farm: 3 },
      },
      s3: {
        name: 'Gồng Mình', desc: 'Gồng 1.5s: giảm 50% sát thương nhận, không bị đẩy lùi (vẫn dính choáng/trói). Lượng sát thương hấp thụ nạp cho Trả Đòn.',
        cd: [14, 13, 12, 11, 10],
        use(m, u) {
          u.ws.guard = m.time + 1.5; u.ws.absorb = 0; u.anchorT = m.time + 1.5;
          m.later(1.5, (mm) => {
            u.ws.guardEnd = mm.time;
            // Hấp Thụ Triệt Để: sát thương hút được chuyển thành khiên
            if (H.T(u, '3a') && u.ws.absorb > 0) mm.shield(u, u, u.ws.absorb * 0.6, 3);
            if (u.ai && u.ai.target && u.ai.target.alive && M.dist(u, u.ai.target) < 3) u.cd.s2 = Math.min(u.cd.s2 || 0, 0.1);
          });
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffb080', life: 1.5 });
        },
        ai: { use: 'defend', aim: 'self', range: 5 },
      },
      s4: {
        name: 'Đấu Trường La Mã', desc: 'Dựng võ đài bán kính 4.5 đv quanh mình trong 4s: kẻ địch bên trong không ra được; Borg giảm 25% sát thương nhận.',
        cd: [120, 100, 80],
        use(m, u, ctx) {
          const c = { x: u.x, y: u.y }, R = 4.5, T = H.T(u, '12c') ? 5.5 : 4;
          const inside = new Set(m.enemiesIn(u.team, c.x, c.y, R, { heroesOnly: true }).map((e) => e.id));
          m.addStatus(u, 'reduce', T, 0.25, { key: 'borg_arena' });
          if (H.T(u, '9a')) m.addStatus(u, 'unstop', T, 1, { key: 'borg_arena' });
          m.zone({ owner: u, x: c.x, y: c.y, r: R, life: T, every: 0.05, kind: 'arena',
            tick: (mm, z) => {
              for (const e of mm.heroes) {
                if (!e.alive || !inside.has(e.id)) continue;
                const d = M.dist(e, z);
                if (d > R - 0.4) { const v = H.dirTo(z, e); e.x = z.x + v.x * (R - 0.4); e.y = z.y + v.y * (R - 0.4); if (e.dash && !e.dash.cc) e.dash = null; }
              }
              if (H.T(u, '12c') && mm.tick % 20 === 0 && M.dist(u, z) < R) mm.heal(u, u, u.st.maxHp * 0.03, true);
            } });
          if (m.fxOn) m.fx({ type: 'ring', x: c.x, y: c.y, r: R, color: '#ff7a4a', life: T });
        },
        ai: { use: 'ult', aim: 'self', range: 3.5, aoe: 4.5 },
      },
    },
    ai: { order: ['s2', 's1', 's3'], engageRange: 4, role: 'fighter', bait: true, guard: (m, u) => (u.ws.guard > m.time ? { t: u.ws.guard - m.time, punish: false } : null) },
    tags: ['cc', 'tank'],
  });
  G.HEROES.borg.tree = [
    [
      { name: 'Kích Động', desc: 'Dưới 60% máu: +12% tốc chạy.', tick(m, u) { if (u.hpPct < 0.6) m.addStatus(u, 'haste', 0.6, 0.12, { key: 'borg_kd' }); } },
      { name: 'Cơ Bắp Thép', desc: '+150 máu và +8% kháng hiệu ứng.', stats: { hp: 150, tenacity: 0.08 } },
      { name: 'Móc Nhanh', desc: 'Đấm Móc kích hoạt mỗi đòn đánh thứ 2 (thay vì 3).' },
    ],
    [
      { name: 'Hấp Thụ Triệt Để', desc: '60% sát thương hấp thụ khi Gồng Mình chuyển thành lá chắn 3s.' },
      { name: 'Quật Ngã Tàn Bạo', desc: 'Chộp & Quật choáng 1.5s (thay vì 1s).' },
      { name: 'Cú Đấm Nhiệt Lượng', desc: 'Trả Đòn luôn gây thiêu đốt.' },
    ],
    [
      { name: 'Cú Ném Tử Thần', desc: 'Chộp & Quật ném bổng mục tiêu 5 đv về phía trước; đập tường bị choáng thêm 0.75s.' },
      { name: 'Đập Nện Mặt Sàn', desc: 'Đấm Móc hất tung 0.6s rồi choáng thêm 0.5s khi rơi.' },
      { name: 'Kích Nổ Adrenaline', desc: 'Đang bị khống chế cứng mà Gồng Mình sẵn sàng: tự Gồng ngay, xóa khống chế.',
        tick(m, u) {
          if (!u.disabled || !(u.ranks.s3 > 0) || (u.cd.s3 || 0) > 0) return;
          m.cleanse(u); u.cd.s3 = m.cdOf(u, 's3'); m.hook(u.hero.skills.s3.use, m, u, { v: (a) => a[0] });
        } },
    ],
    [
      { name: 'Đấu Trường Bất Bại', desc: 'Trong võ đài: Borg không thể bị cản phá.' },
      { name: 'Cú Đấm Ngàn Cân', desc: 'Trả Đòn sau Gồng: cộng 80% sát thương hấp thụ (thay vì 40%) và choáng 0.75s.' },
      { name: 'Nổi Điên', desc: 'Dưới 30% máu: mọi đòn đánh hất tung tướng 0.3s (mỗi mục tiêu 2s).' },
    ],
    [
      { name: 'Cú Húc Xuyên Giáp', desc: 'Trả Đòn khi chưa Gồng: lao 5 đv như xe bọc thép (không thể cản phá), đẩy lùi kẻ cản đường rồi mới đấm.' },
      { name: 'Đấu Sĩ Khát Máu', desc: 'Càng ít máu tốc đánh càng nhanh (tối đa +60%); nắm đấm luôn thiêu đốt.',
        tick(m, u) { m.addStatus(u, 'buff', 0.6, 1, { key: 'borg_kh', mods: { asPct: 0.6 * rage(u) } }); } },
      { name: 'Võ Đài Vĩnh Cửu', desc: 'Võ đài kéo dài 5.5s; Borg hồi 3% máu tối đa mỗi giây khi đứng trong võ đài.' },
    ],
  ];
})();
