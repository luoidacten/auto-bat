'use strict';
// ===== Theron — Thương • Đi rừng / Đường trên • đấu sĩ ghim tường • mana • vật lý + chuẩn =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const trueShare = (u) => (H.T(u, '9b') ? 0.35 : 0.2);
  // đâm: tách một phần thành sát thương chuẩn
  function stab(m, u, e, amt, tag) {
    const k = trueShare(u) * (tag === 'auto' || H.T(u, '9b') ? 1 : 0), a = amt * (H.T(u, '12b') ? 1.2 : 1);
    if (k > 0) { m.damage(u, e, a * (1 - k), 'phys', { tag }); m.damage(u, e, a * k, 'true', { tag, noHook: true }); }
    else m.damage(u, e, a, 'phys', { tag });
  }
  function landSlam(m, u, ctx) {
    const R = H.T(u, '3c') ? 3.5 : 2.5;
    m.hitCircle(u, u.x, u.y, R, (e) => {
      m.damage(u, e, H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0.6), 'phys', { tag: 's3', aoe: true });
      if (H.T(u, '3c')) m.knockup(u, e, 0.5); else m.addStatus(e, 'slow', 1.5, 0.4, { src: u });
    }, { color: '#e0c070' });
    if (m.fxOn) m.fx({ type: 'quake', x: u.x, y: u.y, r: R });
  }
  H.def({
    id: 'theron', name: 'Theron', color: '#e0c070', gfx: 'spear', kit: 'fighter', pos: ['jungle', 'top'], dmgType: 'phys',
    ranged: false, r: 0.66, resource: 'mana',
    stats: { hp: 585, hpG: 91, mp: 300, mpG: 38, mpr: 1.5, mprG: 0.08, ad: 61, adG: 3.7, armor: 31, armorG: 4.0, as: 0.66, asG: 0.022, ms: 3.5, range: 2.3 },
    passive: {
      name: 'Xuyên Phá',
      desc: 'Đòn đâm xuyên: kẻ địch phía sau mục tiêu trong tầm nhận 50%; 20% sát thương đánh thường là sát thương chuẩn.',
      init(m, u) { u.ws.sweep = 0; },
      onAuto(m, u, t, info) {
        const v = H.dirTo(u, t), R = u.st.range + u.r + 0.6;
        const k = trueShare(u);
        if (H.T(u, '12b')) info.amt *= 1.2;
        const tr = info.amt * k; info.amt -= tr;
        info.extra.push(() => {
          if (t.alive) m.damage(u, t, tr, 'true', { tag: 'p', noHook: true });
          m.hitLine(u, u.x, u.y, v.x, v.y, R, 0.9, (e) => { if (e !== t) m.damage(u, e, (info.amt + tr) * 0.5, 'phys', { tag: 'p', aoe: true }); }, { noFx: true });
        });
      },
      onTake(m, u, att, info) { if (H.T(u, '12b')) info.amt *= 0.85; if (u.ws.charging > m.time && H.T(u, '9c')) info.amt *= 0.7; },
    },
    skills: {
      s1: {
        name: 'Liên Hoàn Đâm', desc: 'Đứng đâm 3 nhát thẳng 4.5 đv, mỗi nhát 35/50/65/80/95 (+40% SMVL).',
        cd: [6, 5.5, 5, 4.5, 4], cost: [40, 40, 40, 40, 40], castTime: 0.1,
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt), L = H.T(u, '1a') ? 5.6 : 4.5, dmg = H.amt(u, ctx.v([35, 50, 65, 80, 95]), 0.4);
          m.addStatus(u, 'root', 0.5, 1, { key: 'theron_stab' });
          for (let i = 0; i < 3; i++) m.later(0.2 * i, (mm) => {
            if (!u.alive || u.disabled) return;
            mm.hitLine(u, u.x, u.y, v.x, v.y, L, 0.9, (e) => stab(mm, u, e, dmg, 's1'), { color: '#f0d890' });
            // Khiên Chắn Sparta: chặn đạn từ phía trước
            if (H.T(u, '6c')) for (const p of mm.projs) if (!p.dead && p.team !== u.team && (p.x - u.x) * v.x + (p.y - u.y) * v.y > 0 && M.dist(p, u) < 3) p.dead = true;
          });
        },
        ai: { use: 'burst', range: 4.2, aim: 'unit', farm: 3 },
      },
      s2: {
        name: 'Xung Phong', desc: 'Lao 7 đv, ủi tướng đầu tiên chạm phải theo mình; ủi vào tường hoặc trụ thì choáng 1.5s, không thì hất tung 0.5s cuối đà.',
        cd: [12, 11.5, 11, 10.5, 10], cost: [60, 60, 60, 60, 60], castTime: 0.1,
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt), L = 7, sp = 18, dmg = H.amt(u, ctx.v([60, 90, 120, 150, 180]), 0.7);
          const through = H.T(u, '12a');
          const carried = [];
          u.ws.charging = m.time + L / sp;
          if (H.T(u, '9c')) m.addStatus(u, 'unstop', L / sp + 0.1, 1);
          m.dashTo(u, u.x + v.x * L, u.y + v.y * L, sp, { wall: through, unstop: H.T(u, '9c'), onContact: (mm, uu, e) => {
            if (e.kind !== 'hero' && e.kind !== 'monster' && e.kind !== 'pet') return;
            if (!through && carried.length) return;
            if (carried.includes(e)) return;
            carried.push(e);
            stab(mm, u, e, dmg, 's2');
            const rest = Math.max(0.3, (u.dash ? u.dash.t : 0.1));
            const pinStun = H.T(u, '3a') ? 1.75 : 1.25;
            mm.knock(u, e, v.x, v.y, sp * rest + 0.8, rest + 0.04, { onWall: (m3, ee) => {
              ee.ws_pinned = true; m3.addStatus(ee, 'stun', pinStun, 1, { src: u });
              if (H.T(u, '3a')) m3.removeStatus(ee, 'shield');
            } });
            mm.later(rest + 0.05, (m3) => {
              if (!e.alive) return;
              const tower = !!G.MAP.nearWall(e, e.r + 0.8);   // ghim vào tường đá thì choáng
              if (tower) m3.addStatus(e, 'stun', pinStun, 1, { src: u });
              else if (!e.has('stun')) m3.knockup(u, e, 0.5);
            });
          } });
        },
        ai: { use: 'engage', range: 6.5, aim: 'unit', heroOnly: true },
      },
      s3: {
        name: 'Chống Thương Nhảy', desc: 'Bật lên 1s không thể bị chọn (vẫn di chuyển chậm); hết giờ hoặc dùng lại thì dậm xuống làm chậm 40% kẻ địch quanh chân.',
        cd: [14, 13, 12, 11, 10], cost: [45, 45, 45, 45, 45],
        use(m, u, ctx) {
          const T = H.T(u, '1b') ? 1.6 : 1;
          m.addStatus(u, 'untarget', T, 1, { key: 'theron_vault' }); m.addStatus(u, 'slow', T, 0.4, { key: 'theron_vault' });
          u.ws.vault = m.time + T;
          const land = (mm) => { if (!(u.ws.vault > 0)) return; u.ws.vault = 0; mm.removeStatus(u, 'untarget', 'theron_vault'); mm.removeStatus(u, 'slow', 'theron_vault'); landSlam(mm, u, ctx); };
          m.allowRecast(u, 's3', T, (mm, uu) => {
            // Giáo Ném Không Trung: phóng giáo xuống tướng địch gần nhất
            if (H.T(uu, '6b')) {
              const t = H.nearestEnemyHero(mm, uu, 6);
              if (t) { mm.damage(uu, t, H.amt(uu, 50 + 10 * uu.level, 0.6), 'phys', { tag: 's3' }); mm.addStatus(t, 'stun', 1, 1, { src: uu }); if (mm.fxOn) mm.fx({ type: 'line', x: uu.x, y: uu.y, x2: t.x, y2: t.y, w: 0.3, color: '#e0c070' }); }
            }
            land(mm);
          });
          m.later(T, land);
        },
        ai: { use: 'defend', aim: 'self', range: 5, alsoEscape: true, recastWhen: (m, u, t) => t && t.kind === 'hero' && M.dist(u, t) < 3 },
      },
      sub: {
        name: 'Quét Chân', desc: 'Quét thương tầm thấp 360° (bán kính 2.6): 35 (+7/cấp, +50% SMVL) sát thương, kẻ địch trúng chiêu bị NGÃ 0.5s (ngắt chiêu đang niệm).',
        cd: (m, u) => (H.T(u, '1c') ? 8 : 12), cdText: 12, cost: 30,
        use(m, u, ctx) {
          const dmg = H.amt(u, 35 + 7 * u.level, 0.5);
          // Hất Tung Phá Trận: móc cán thương hất một mục tiêu bay 1s
          if (H.T(u, '6a')) {
            const t = ctx.tgt && ctx.tgt.alive && G.M.dist(u, ctx.tgt) < 3 + ctx.tgt.r ? ctx.tgt : H.nearestEnemyHero(m, u, 3);
            if (t) { stab(m, u, t, dmg, 'sub'); m.knockup(u, t, 1); if (m.fxOn) m.fx({ type: 'line', x: u.x, y: u.y, x2: t.x, y2: t.y, w: 0.8, color: '#e0c070', fx: 'thrust', team: u.team }); return; }
          }
          m.hitCircle(u, u.x, u.y, 2.6, (e) => {
            stab(m, u, e, dmg, 'sub');
            m.knockup(u, e, 0.5);
            if (H.T(u, '3b')) { m.addStatus(e, 'root', 1, 1, { src: u }); m.addStatus(e, 'silence', 1, 1, { src: u }); }
          }, { color: '#e0c070', fx: 'whirl' });
        },
        ai: { use: 'cc', range: 2.4, aim: 'self' },
      },
      s4: {
        name: 'Mưa Thương', desc: 'Gọi mưa thương xuống vùng bán kính 7 đv quanh điểm trong 8 đv suốt 3s: sát thương liên tục; trúng lần đầu thì trói chân 1s.',
        cd: [120, 100, 80], cost: [100, 100, 100], castTime: 0.2,
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 8, true), hit = new Set(), root = H.T(u, '9a') ? 2 : 1;
          const tick = H.amt(u, ctx.v([45, 70, 95]), 0.3);
          m.zone({ owner: u, x: p.x, y: p.y, r: 7, life: 3, every: 0.5, kind: 'spears',
            tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => {
              mm.damage(u, e, tick, 'phys', { tag: 's4', aoe: true });
              if (e.kind === 'hero' && !hit.has(e.id)) { hit.add(e.id); mm.addStatus(e, 'root', root, 1, { src: u }); }
            }, { noFx: true }) });
          m.telegraph({ team: u.team, x: p.x, y: p.y, r: 7, life: 3, color: '#e0c070' });
        },
        ai: { use: 'ult', aim: 'point', speed: 0, range: 8, aoe: 7, minTargets: 2 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 5, role: 'fighter', bait: true },
    tags: ['cc'],
  });
  G.HEROES.theron.tree = [
    [
      { name: 'Kình Lực Mũi Thương', desc: 'Liên Hoàn Đâm xa hơn 25%.' },
      { name: 'Bật Nhảy Kỷ Luật', desc: 'Chống Thương Nhảy ở trên không 1.6s (thay vì 1s).' },
      { name: 'Quét Trụ', desc: 'Quét Chân (skill phụ) hồi 8s (thay vì 12s).' },
    ],
    [
      { name: 'Đâm Ghim Vỡ Giáp', desc: 'Ghim tường bằng Xung Phong: choáng 2s (thay vì 1.5s) và phá mọi lá chắn.' },
      { name: 'Ngã Rạp Chiến Trường', desc: 'Quét Chân thêm trói chân + câm lặng 1s.' },
      { name: 'Chấn Động Mặt Đất', desc: 'Dậm xuống từ Chống Thương rộng hơn (3.5 đv) và hất tung 0.5s thay vì làm chậm.' },
    ],
    [
      { name: 'Hất Tung Phá Trận', desc: 'Quét Chân thành đòn móc cán thương hất tung mục tiêu 1s.' },
      { name: 'Giáo Ném Không Trung', desc: 'Đang trên không: dùng lại để phóng giáo xuống tướng địch trong 6 đv — choáng 1s — rồi dậm xuống.' },
      { name: 'Khiên Chắn Sparta', desc: 'Trong lúc Liên Hoàn Đâm: chặn mọi đạn đạo bay tới từ phía trước.' },
    ],
    [
      { name: 'Trận Địa Mưa Thương', desc: 'Mưa Thương trói chân 2s (thay vì 1s).' },
      { name: 'Mũi Giáo Tử Thần', desc: 'Mọi đòn đâm (đánh thường, Liên Hoàn Đâm, Xung Phong) có 35% là sát thương chuẩn.' },
      { name: 'Spartan Bất Diệt', desc: 'Xung Phong không thể cản phá; giảm 30% sát thương nhận trong lúc lao.' },
    ],
    [
      { name: 'Đâm Xuyên Vạn Quân', desc: 'Xung Phong xuyên tường và cuốn theo mọi kẻ địch trên đường.' },
      { name: 'Đấu Sĩ Phalanx', desc: 'Giảm 15% sát thương nhận; đòn đâm +20% sát thương; −10% tốc chạy.', stats: { msPct: -0.1 } },
      { name: 'Kỷ Luật Bất Khả Xâm Phạm', desc: 'Miễn nhiễm trói chân và mê hoặc.', stats: { imm_root: 1, imm_charm: 1 } },
    ],
  ];
})();
