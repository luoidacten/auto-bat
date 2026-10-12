'use strict';
// ===== Dr. Vector — Kẻ Giám Sát Không Gian • xạ thủ laser bắn tỉa, khắc chế ảo ảnh / tàng hình • ổ 8 viên + mana • vật lý =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const MAG = 8;
  const mag = (u) => H.mag(u, MAG);
  const reload = (u) => H.rlTime(u, H.T(u, '1a') ? 1.2 : 1.8);
  const startReload = (m, u) => { u.ws.ammo = 0; u.ws.reload = u.ws.rlMax = reload(u); H.reloadStart(m, u); };
  const scanRange = (u) => (H.T(u, '12b') ? 18 : [10, 12, 12, 14, 16][Math.max(0, (u.ranks.s2 || 1) - 1)]);
  H.def({
    id: 'vector', name: 'Dr. Vector', color: '#40e0ff', gfx: 'laser', kit: 'marksman', pos: ['adc'], dmgType: 'phys',
    ranged: true, projSpeed: 140, projKind: 'laser', r: 0.58, resource: 'mana',
    gun: (m, u) => ({ n: u.ws.ammo, max: mag(u), rl: u.ws.reload, rlMax: u.ws.rlMax || 1.8 }),
    gunSet(m, u, n) { u.ws.ammo = n; if (n > 0 && u.ws.reload > 0) { u.ws.reload = 0; H.reloadDone(m, u); u.atkT = Math.min(u.atkT, 0.15); } },
    stats: { range: 8.0, hp: 555, hpG: 86, mp: 330, mpG: 42, armor: 26, armorG: 3.8, mr: 30, mrG: 1.3, ms: 3.3, ad: 54, adG: 3.2, as: 0.62, asG: 0.025 },
    passive: {
      name: 'Laser Gun • Tính Toán Tuyệt Đối',
      desc: 'Đánh thường là tia laser bắn tức thời, xuyên mọi mục tiêu thẳng hàng (mục tiêu sau nhận 65%). Ổ 8 viên, cạn đạn nạp 1.8s. Sẵn 40% chí mạng, 20% xuyên giáp và 25% Xuyên Thủng Hộ Giáp.',
      init(m, u) { u.ws.ammo = MAG; u.ws.reload = 0; u.ws.oc = 0; },
      update(m, u, dt) {
        if (u.ws.reload > 0 && !H.rlHold(m, u, 'reload')) { u.ws.reload -= dt; if (u.ws.reload <= 0) { u.ws.ammo = mag(u); H.reloadDone(m, u); } }
        if (u.ws.ammo <= 0) u.atkT = Math.max(u.atkT, u.ws.reload);
        if (u.ws.ammo < mag(u) && u.ws.reload <= 0 && m.time - (u.combatT || -99) > 4) startReload(m, u);
        if (m.tick % 10 === 0 && !u.hasKey('vec_calc')) m.addStatus(u, 'buff', 9999, 1, { key: 'vec_calc', mods: { crit: H.T(u, '1b') ? 0.55 : 0.4, armorPen: 0.2, bypass: 0.25 } });
        if (u.ws.scanUntil > m.time && m.tick % 10 === 0) {
          for (const e of m.heroes) if (e.alive && e.team !== u.team && M.dist(e, u) <= 16) { if (e.has('stealth')) m.removeStatus(e, 'stealth'); e.revealedT = Math.max(e.revealedT || 0, m.time + 1); }
        }
      },
      onAuto(m, u, t, info) {
        u.ws.ammo--; if (u.ws.ammo <= 0) startReload(m, u);
        let fall = H.T(u, '6b') ? 0.85 : 0.65, byp = 0;
        if (u.ws.oc > 0) {
          u.ws.oc--; info.amt *= 1.35; fall = 1;
          if (u.ws.oc === 0 && !info.crit) { info.crit = true; info.amt *= G.C.CRIT_MULT + (u.bonus.critMult || 0); }
          if (H.T(u, '9b')) byp = 1;
        }
        if (H.T(u, '12b') && u.ws.scanUntil > m.time && M.dist(u, t) > 10 && !info.crit) { info.crit = true; info.amt *= G.C.CRIT_MULT + (u.bonus.critMult || 0); }
        if (info.crit && H.T(u, '6c')) u.mp = Math.min(u.st.maxMp, u.mp + 15);
        if (byp) u.ws.bypNext = true;
        const amt = info.amt * fall, v = H.dirTo(u, t), len = u.st.range + 1.5;
        info.extra.push(() => m.hitLine(u, u.x, u.y, v.x, v.y, len, 0.5, (e) => { if (e !== t) m.damage(u, e, amt, 'phys', { tag: 'pierce', aoe: true, byp }); }, { color: '#40e0ff', noFx: true }));
        if (m.fxOn) m.fx({ type: 'beam', x: u.x, y: u.y, x2: u.x + v.x * len, y2: u.y + v.y * len, color: '#40e0ff', life: 0.12, w: 0.18 });
      },
      onDeal(m, u, t, info) { if (u.ws.bypNext && info.auto) { info.byp = 1; u.ws.bypNext = false; } },
    },
    skills: {
      s1: {
        name: 'Nạp Năng Lượng Tái Kích', desc: 'Nạp đầy 8 viên ngay lập tức. 3 phát kế tiếp +35% sát thương, xuyên thấu không suy hao; phát thứ 3 chắc chắn chí mạng.',
        cd: [8, 7.5, 7, 6.5, 6], cost: [40, 40, 40, 40, 40],
        use(m, u) { u.ws.ammo = mag(u); u.ws.reload = 0; H.reloadDone(m, u); u.ws.oc = H.T(u, '3c') ? 4 : 3; u.atkT = Math.min(u.atkT, 0.1); },
        ai: { use: 'burst', range: 9, aim: 'self', cond: (m, u, t) => !!t && M.dist(u, t) <= u.st.range + 1 },
      },
      s2: {
        name: 'Radar Quét Tọa Độ', desc: 'Giáp ảo 15% máu tối đa + 120 trong 3.5s, +30% tốc chạy 2.5s. Xung radar 16 đv: lộ mọi kẻ tàng hình 5s; ảo ảnh / phân thân địch trong vùng bị đóng băng 3s. Tầm đánh tăng lên 10/12/12/14/16 đv trong 5s.',
        cd: [13, 12, 11, 10, 9], cost: [50, 50, 50, 50, 50],
        use(m, u) {
          const sh = m.shield(u, u, u.st.maxHp * 0.15 + 120, 3.5);
          if (sh && H.T(u, '3b')) { const s0 = sh; m.later(3.4, (mm) => { if (s0.v <= 1 && u.alive) mm.hitCircle(u, u.x, u.y, 3, (e) => mm.addStatus(e, 'blind', 1, 1, { src: u })); }); }
          m.addStatus(u, 'haste', 2.5, H.T(u, '1c') ? 0.5 : 0.3, { key: 'vec_s2' });
          u.ws.scanUntil = m.time + 5;
          for (const p of m.pets) {
            if (!p.alive || p.team === u.team || !p.decoy || M.dist(p, u) > 16) continue;
            if (H.T(u, '6a')) { p.onDeath = null; p.onExpire = null; m.damage(u, p, p.hp + 1, 'true', { tag: 's2' }); }
            else { m.addStatus(p, 'stun', 3, 1, { src: u }); p.ad0 = p.st.ad; }
          }
          const extra = scanRange(u) - 8;
          m.addStatus(u, 'buff', 5, 1, { key: 'vec_range', mods: { range: Math.max(0, extra) } });
          if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: 16, color: '#40e0ff', life: 0.6 });
        },
        ai: { use: 'custom', aim: 'self', pick(m, u, t) {
          const ill = m.pets.some((p) => p.alive && p.decoy && p.team !== u.team && M.dist(p, u) < 16);
          const st = m.heroes.some((e) => e.alive && e.team !== u.team && e.has('stealth') && M.dist(e, u) < 14);
          if (ill || st || (t && M.dist(u, t) > u.st.range && M.dist(u, t) < scanRange(u)) || (u.hpPct < 0.5 && m.time - u.lastDmgT < 1)) return { pt: { x: u.x, y: u.y }, tgt: t };
          return null;
        } },
      },
      s3: {
        name: 'Bom Từ Tính Khóa Trọng Lực', desc: 'Ném lựu đạn từ tính 8 đv, nổ bán kính 2.5: sát thương vật lý, choáng 1s, nạn nhân nhận thêm 25/30/30/30/50% sát thương từ mọi nguồn 4s. Để lại vực từ trường 3s cấm lướt / dịch chuyển / dây móc.',
        cd: [11, 10, 9.5, 9, 8.5], cost: [55, 55, 55, 55, 55],
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 8, true), amp = ctx.v([0.25, 0.3, 0.3, 0.3, 0.5]), dmg = H.amt(u, ctx.v([70, 110, 150, 190, 230]), 0.7, 0);
          m.telegraph({ shape: 'circle', x: p.x, y: p.y, r: 2.5, life: 0.35, team: u.team });
          m.later(0.35, (mm) => {
            mm.hitCircle(u, p.x, p.y, 2.5, (e) => { mm.damage(u, e, dmg, 'phys', { tag: 's3', aoe: true }); mm.addStatus(e, 'stun', 1, 1, { src: u }); mm.addStatus(e, 'vuln', 4, amp, { src: u, key: 'vec_mark' }); }, { color: '#40e0ff' });
            mm.zone({ owner: u, x: p.x, y: p.y, r: 2.5, life: H.T(u, '3a') ? 4.5 : 3, every: 0.25, kind: 'magnet', tick: (m2) => m2.hitCircle(u, p.x, p.y, 2.5, (e) => {
              m2.addStatus(e, 'nodash', 0.35, 1, { src: u, key: 'vec_lock' });
              if (H.T(u, '9c')) m2.addStatus(e, 'slow', 0.35, 0.4, { src: u, key: 'vec_lock' });
            }, { noFx: true }) });
          });
        },
        ai: { use: 'cc', range: 8, aim: 'point', speed: 0, delay: 0.35, skillshot: true },
      },
      s4: {
        name: 'Pháo Laser Quét Hư Không', desc: 'Ghim chân tụ lực 0.6s rồi bắn chùm laser dài 16 đv rộng 2 đv xuyên địa hình: sát thương vật lý cực lớn (350/520/700 + 130% Công Vật Lý), bỏ qua 50% giáp, thiêu 300 Hộ Giáp. Mục tiêu dính Dấu Ấn Từ Tính: nổ thêm sát thương chuẩn và chậm 60% 2s.',
        cd: [85, 70, 55], cost: [100, 100, 100], castTime: 0.15,
        use(m, u, ctx) {
          const v = H.dirTo(u, ctx.pt), delay = H.T(u, '9a') ? 0.3 : 0.6, dmg = H.amt(u, ctx.v([350, 520, 700]), 1.3, 0);
          const lanes = H.T(u, '12a') ? [-2, 0, 2] : [0];
          const ox = u.x, oy = u.y;
          for (const k of lanes) m.telegraph({ shape: 'line', x: ox - v.y * k, y: oy + v.x * k, x2: ox - v.y * k + v.x * 16, y2: oy + v.x * k + v.y * 16, w: 2, life: delay, team: u.team, color: '#40e0ff' });
          m.addStatus(u, 'root', delay, 1, { key: 'vec_plant' });
          m.later(delay, (mm) => {
            if (!u.alive) return;
            const hit = new Set();
            for (const k of lanes) mm.hitLine(u, ox - v.y * k, oy + v.x * k, v.x, v.y, 16, 1, (e) => {
              if (hit.has(e.id)) return; hit.add(e.id);
              const mark = e.hasKey('vec_mark'), arm = e.st.armor;
              e.st.armor = arm * 0.5; mm.damage(u, e, dmg, 'phys', { tag: 's4' }); e.st.armor = arm;
              if (e.ga > 0) e.ga = Math.max(0, e.ga - 300);
              if (mark && e.alive) { mm.damage(u, e, dmg * 0.25, 'true', { tag: 's4' }); mm.addStatus(e, 'slow', 2, 0.6, { src: u }); }
              if (!e.alive && e.kind === 'hero' && H.T(u, '12a')) { u.cd.s1 = 0; u.cd.s3 = 0; }
            }, { color: '#40e0ff', wall: true });
            if (mm.fxOn) for (const k of lanes) mm.fx({ type: 'beam', x: ox - v.y * k, y: oy + v.x * k, x2: ox - v.y * k + v.x * 16, y2: oy + v.x * k + v.y * 16, color: '#80f0ff', life: 0.4, w: 1.2 });
          });
        },
        ai: { use: 'ult', range: 15, aim: 'point', speed: 0, delay: 0.6, skillshot: true },
      },
    },
    ai: { order: ['s3', 's2', 's1'], engageRange: 8, role: 'marksman' },
    tags: ['gun', 'reveal'],
  });
  G.HEROES.vector.tree = [
    [
      { name: 'Tụ Quang Thần Tốc', desc: 'Nạp đạn 1.2s.' },
      { name: 'Chí Mạng Tuyệt Đối', desc: 'Chí mạng gốc 55%.' },
      { name: 'Gia Tốc Radar', desc: 'Radar cho +50% tốc chạy.' },
    ],
    [
      { name: 'Vực Từ Mở Rộng', desc: 'Vực từ trường tồn tại 4.5s.' },
      { name: 'Xung Điện Phản Hồi', desc: 'Giáp ảo của Radar vỡ: làm mù kẻ địch trong 3 đv 1s.' },
      { name: 'Tia Laser Tăng Cường', desc: 'Nạp Năng Lượng cường hóa 4 phát.' },
    ],
    [
      { name: 'Triệt Tiêu Phân Thân', desc: 'Radar kích nổ tiêu diệt ngay ảo ảnh địch (không để lại hiệu ứng).' },
      { name: 'Xuyên Thấu Hoàn Hảo', desc: 'Tia xuyên chỉ suy hao 15%.' },
      { name: 'Laser Hút Năng Lượng', desc: 'Phát chí mạng hồi 15 Mana.' },
    ],
    [
      { name: 'Hyper-Beam Thần Tốc', desc: 'Chiêu cuối tụ lực 0.3s.' },
      { name: 'Đầu Đạn Lượng Tử', desc: 'Phát cường hóa của Nạp Năng Lượng xuyên 100% Hộ Giáp.' },
      { name: 'Khóa Cứng Từ Tính', desc: 'Vực từ trường làm chậm thêm 40%.' },
    ],
    [
      { name: 'Giám Sát Tuyệt Đối', desc: 'Phong cách: chiêu cuối bắn 3 chùm song song; hạ tướng bằng chiêu cuối làm mới Nạp Năng Lượng và Bom Từ Tính.' },
      { name: 'Pháo Đài Siêu Cự Ly', desc: 'Phong cách: Radar đẩy tầm đánh lên 18 đv; phát trúng từ xa hơn 10 đv chắc chắn chí mạng.' },
      { name: 'Kỹ Sư Viện Hàn Lâm', desc: '+12% Công Vật Lý, +10% tốc đánh.', stats: { physAmp: 0.12, asPct: 0.1 } },
    ],
  ];
})();
