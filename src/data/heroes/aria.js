'use strict';
// ===== Aria & Oktava — The Voice • Hỗ trợ • bảo hộ, khiên, mê hoặc • mana • phép =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const PET_RESPAWN = 45;
  // GĐ9 (theo bản Legacy): 3 nốt dùng CHUNG hồi chiêu ngắn; 3 nốt liên tiếp = 1 Bản Nhạc; nốt tan sau 5s không gõ;
  // Bản Giao Hưởng Tử Thần chỉ mở khi đã đánh xong 3 Bản Nhạc (Khúc Khải Hoàn: 2)
  const NOTE_CD = 3.5, NOTE_GAP = 5;
  const songNeed = (u) => (H.T(u, '9a') ? 2 : 3);

  function makeOktava(m, u) {
    const pet = new G.Unit(m, { kind: 'pet', team: u.team, x: u.x + 1, y: u.y, r: 0.85, ranged: false, base: petBase(u) });
    pet.owner = u; pet.name = 'Oktava'; pet.gfx = 'guardian'; pet.color = '#3a8a5a';
    pet.petThink = petThink;
    // Nhập Thể Âm Vang: Oktava khổng lồ đánh lan quanh mục tiêu và làm chậm
    pet.onAuto = (mm, pp, t, info) => {
      if (!(u.ws.giant > mm.time)) return;
      info.extra.push(() => mm.hitCircle(pp, t.x, t.y, 2, (e) => { if (e !== t) mm.damage(pp, e, info.amt * 0.6, 'phys', { tag: 'p', aoe: true }); mm.addStatus(e, 'slow', 1, 0.3, { src: u }); }, { color: '#3a8a5a' }));
    };
    pet.onDeath = (mm) => { u.ws.okt = null; u.ws.oktBack = mm.time + (H.T(u, '1a') ? 25 : PET_RESPAWN); u.ws.mount = 0; };
    m.addUnit(pet); m.pets.push(pet);
    u.ws.okt = pet;
    return pet;
  }
  function petBase(u) {
    const k = H.T(u, '12c') ? 1.5 : 1;   // Song Tấu Độc Lập
    return { hp: (u.st.maxHp * 0.5 + 45 * u.level) * k, armor: u.st.armor * k, mr: u.st.mr * k, ad: (22 + 4 * u.level) * k, as: 0.8, ms: u.st.ms, range: 1.5 };
  }
  // AI của Oktava: hộ vệ Aria — ai đánh Aria thì Oktava nhắm kẻ đó và đuổi tới khi quá xa Aria (hoặc bị thu hồi);
  // không ai đánh thì phụ Aria đánh mục tiêu của cô, hoặc đi theo sau
  function petThink(m, p) {
    const u = p.owner;
    if (!u || !u.alive) { p.goal = null; p.attackTarget = null; return; }
    if (u.ws.mount > m.time) {
      p.x = u.x; p.y = u.y; p.goal = null;
      // Cộng Hưởng Tuyệt Đối / Nhập Thể Âm Vang: Oktava vẫn vung đòn khi được cưỡi
      const at = u.ai && u.ai.target;
      p.attackTarget = (H.T(u, '9b') || u.ws.giant > m.time) && at && at.alive && m.canHit(p, at) && G.M.dist(p, at) < 3 ? at : null;
      return;
    }
    if (p.thinkT > m.time) return;
    p.thinkT = m.time + 0.2;
    // Người Bảo Hộ: nhắm kẻ đánh Aria, đuổi tới khi cách Aria quá xa (14 đv) hoặc Aria thu hồi
    H.guardThink(m, p, { leash: 14, near: 6.5 });
  }
  // Bản Nhạc: 3 nốt liên tiếp trong 8s → Hòa Âm theo nốt bấm nhiều nhất
  function note(m, u, key) {
    // nốt tan biến sau 5s không gõ thêm (Vọng Âm Cộng Hưởng: không tan)
    let n = u.ws.notes || [];
    if (n.length && !H.T(u, '6c') && m.time - n[n.length - 1].t > NOTE_GAP) n = [];
    u.ws.notes = n;
    n.push({ k: key, t: m.time });
    if (m.fxOn) m.fx({ type: 'note', id: u.id, k: key });
    if (n.length < 3) return null;
    u.ws.notes = [];
    // Khúc Ca Ru Ngủ: đúng thứ tự S1 → S2 → S3
    if (H.T(u, '12a') && n[0].k === 's1' && n[1].k === 's2' && n[2].k === 's3') return 'lull';
    const c = { s1: 0, s2: 0, s3: 0 };
    for (const x of n) c[x.k]++;
    if (c.s1 >= 2) return 's1';
    if (c.s2 >= 2) return 's2';
    if (c.s3 >= 2) return 's3';
    return 'mix';
  }
  // Hòa Âm theo bản cũ: Đỏ — Oktava dậm to, Aria nổ 3 lần (lần cuối choáng) • Xanh — 3 đợt sóng âm (chậm → trói → mê hoặc)
  // • Vàng — Oktava dậm thẳng xuống chỗ Aria đẩy lùi cực mạnh, khiên kèm hồi phục • Hỗn Hợp — cả ba ở mức yếu hơn
  function harmony(m, u, kind) {
    const okt = u.ws.okt, alive = okt && okt.alive;
    if (m.fxOn) m.fx({ type: 'harmony', id: u.id, k: kind });
    u.ws.songs = Math.min(songNeed(u), (u.ws.songs || 0) + 1);                      // đủ Bản Nhạc thì mở Bản Giao Hưởng Tử Thần
    if (kind === 'lull') { for (const e of m.enemiesIn(u.team, u.x, u.y, 8, { heroesOnly: true })) m.addStatus(e, 'sleep', 1.25, 1, { src: u }); return; }
    const full = kind !== 'mix' || H.T(u, '9c');                                     // Bản Hòa Âm Tối Thượng
    const k = full ? 1 : 0.5, dmg = 40 + 12 * u.level + 0.3 * u.st.ap;
    if (kind === 's1' || kind === 'mix') {
      if (alive) m.hitCircle(u, okt.x, okt.y, 3.2, (e) => m.damage(u, e, dmg * k, 'magic', { tag: 'harm', aoe: true }), { color: '#ff7a7a', fx: 'quake' });
      for (let i = 0; i < 3; i++) m.later(0.4 * i, (mm) => {
        if (!u.alive) return;
        mm.hitCircle(u, u.x, u.y, 2.6, (e) => {
          mm.damage(u, e, dmg * 0.45 * k, 'magic', { tag: 'harm', aoe: true });
          if (i === 2) { mm.addStatus(e, 'stun', (H.T(u, '3b') ? 1.4 : 1) * (full ? 1 : 0.6), 1, { src: u }); if (H.T(u, '3b')) mm.removeStatus(e, 'shield'); }
        }, { color: '#ff9a9a', fx: 'boom' });
      });
    }
    if (kind === 's2' || kind === 'mix') {
      const t = H.nearestEnemyHero(m, u, 8);
      const v = t ? H.dirTo(u, t) : { x: u.fx, y: u.fy };
      const seen = new Map();
      for (let i = 0; i < 3; i++) m.later(0.35 * i, (mm) => {
        if (!u.alive) return;
        mm.hitLine(u, u.x, u.y, v.x, v.y, 7.5, 2.6, (e) => {
          if (e.kind !== 'hero') { mm.damage(u, e, dmg * 0.3, 'magic', { tag: 'harm', aoe: true }); return; }
          const n = (seen.get(e.id) || 0) + 1; seen.set(e.id, n);
          mm.damage(u, e, dmg * 0.3 * k, 'magic', { tag: 'harm' });
          if (n === 1) mm.addStatus(e, 'slow', 1.5, 0.4, { src: u });
          else if (n === 2) mm.addStatus(e, 'root', full ? 1 : 0.5, 1, { src: u });
          else mm.addStatus(e, 'charm', (full ? 1.2 : 0.6) * (H.T(u, '3a') ? 1.5 : 1), 1, { src: alive ? okt : u });   // tự đi nộp mạng cho Oktava
        }, { color: '#7ab8ff', fx: 'wave' });
      });
    }
    if (kind === 's3' || kind === 'mix') {
      const land = () => {
        m.hitCircle(u, u.x, u.y, 3, (e) => { const w = H.dirTo(u, e); m.knock(u, e, w.x, w.y, full ? 2.5 : 1.5, 0.25); m.damage(u, e, dmg * 0.5 * k, 'magic', { tag: 'harm', aoe: true }); }, { color: '#ffe07a', fx: 'quake' });
        for (const a of H.alliesNear(m, u, 6, true)) {
          m.shield(u, a, (40 + 10 * u.level) * k, 2.5);
          m.addStatus(a, 'buff', 3, 1, { key: 'aria_regen', mods: { hpr: (8 + 2 * u.level) * k } });          // khiên có thêm Hồi Phục
        }
      };
      if (alive && M.dist(okt, u) > 0.8) m.dashTo(okt, u.x, u.y, 22, { onEnd: land }); else land();
    }
  }

  H.def({
    id: 'aria', name: 'Aria & Oktava', color: '#7ae0a0', gfx: 'voice', kit: 'support', pos: ['sup'], dmgType: 'magic',
    ranged: true, projSpeed: 16, projKind: 'note', r: 0.58, resource: 'mana',
    stats: { range: 5.0, hp: 595, armor: 28, mr: 32 },
    passive: {
      name: 'Bóng Hình Âm Vang & Hòa Âm',
      desc: 'Oktava (Người Bảo Hộ) đi theo Aria, có máu riêng (45% máu Aria), chết thì hồi lại sau 45s. Ai đánh Aria thì Oktava nhắm kẻ đó và đuổi tới khi cách Aria quá xa (14 đv) hoặc bị Aria thu hồi (Aria rút lui, hoặc Oktava sắp chết). 3 nốt (S1/S2/S3, dùng CHUNG hồi chiêu 3.5s) liên tiếp thành 1 Bản Nhạc — nốt tan biến nếu 5s không gõ thêm, cường hóa theo nốt được bấm nhiều nhất: Đỏ — Oktava dậm to, Aria nổ 3 lần, lần cuối CHOÁNG • Xanh — 3 đợt sóng âm: trúng 1 làm chậm, 2 trói chân, 3 MÊ HOẶC (tự đi về phía Oktava) • Vàng — Oktava dậm thẳng xuống chỗ Aria đẩy lùi cực mạnh, cả đội gần đó nhận khiên kèm Hồi Phục • đều nhau — Hòa Âm Hỗn Hợp (cả ba, yếu hơn). Đánh xong 3 Bản Nhạc thì mở Bản Giao Hưởng Tử Thần.',
      init(m, u) { u.ws.notes = []; u.ws.songs = 0; makeOktava(m, u); },
      respawn(m, u) { if (!u.ws.okt) makeOktava(m, u); },
      update(m, u) {
        const okt = u.ws.okt;
        if (!okt && u.ws.oktBack && m.time >= u.ws.oktBack) { u.ws.oktBack = 0; makeOktava(m, u); }
        if (okt && okt.alive && m.tick % 20 === 0) { const keep = okt.hpPct; okt.base = petBase(u); okt.calc(); okt.hp = okt.st.maxHp * keep; }
      },
      onTake(m, u, att, info) {
        const okt = u.ws.okt;
        if (u.ws.mount > m.time && okt && okt.alive && info.amt > 0) { const a = info.amt; info.amt = 0; m.damage(info.src, okt, a, info.type, { tag: 'mount', noHook: true }); }
      },

      onSkill(m, u, key) {
        if (key !== 's1' && key !== 's2' && key !== 's3') return;
        const cdN = NOTE_CD * (1 - (u.st.cdr || 0));
        for (const k of ['s1', 's2', 's3']) if (k !== key) u.cd[k] = Math.max(u.cd[k] || 0, cdN);   // 3 nốt dùng chung hồi chiêu
        const h = note(m, u, key); if (h) m.later(0.3, (mm) => u.alive && harmony(mm, u, h));
      },
    },
    skills: {
      s1: {
        name: 'Nốt Đỏ — Tấn Công', desc: 'Oktava NHẢY DẬM vào kẻ địch gần nhất (trong 9 đv; không có thì vào điểm chỉ định) — sát thương bán kính 2.2 và hất lùi; Aria phát sóng âm quanh mình (bán kính 2.5). 3 nốt dùng chung hồi chiêu.',
        cd: [4, 3.75, 3.5, 3.25, 3], cost: [35, 38, 41, 44, 47], castTime: 0.15,
        use(m, u, ctx) {
          const okt = u.ws.okt, dmg = H.amt(u, ctx.v([50, 70, 90, 110, 130]), 0, 0.45);
          m.hitCircle(u, u.x, u.y, H.T(u, '1c') ? 3.25 : 2.5, (e) => m.damage(u, e, dmg * 0.5, 'magic', { tag: 's1', aoe: true }), { color: '#ff9a9a' });
          if (okt && okt.alive) {
            const t = H.nearestEnemyHero(m, okt, 9), p = t ? { x: t.x, y: t.y } : H.toward(u, ctx.pt, 7, true);
            const land = (mm) => mm.hitCircle(u, okt.x, okt.y, 2.2, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's1', aoe: true }); const w = H.dirTo(okt, e); mm.knock(u, e, w.x, w.y, 1.2, 0.2); }, { color: '#ff7a7a', fx: 'quake' });
            okt.leapT = m.time + 0.45;   // dáng nhảy vồng lên (giao diện)
            m.dashTo(okt, p.x, p.y, Math.max(10, M.dist(okt, p) / 0.45), { onEnd: land, wall: true });
          }
        },
        ai: { use: 'poke', range: 6.5, aim: 'point', speed: 0, farm: 3 },
      },
      s2: {
        name: 'Nốt Xanh — Linh Hoạt', desc: 'Aria, Oktava và đồng minh trong 6 đv tăng 25% tốc chạy 2s. Aria không thể bị chọn làm mục tiêu 0.5s, xóa mọi hiệu ứng xấu và miễn đẩy lùi chớp nhoáng. 3 nốt dùng chung hồi chiêu.',
        cd: [4, 3.75, 3.5, 3.25, 3], cost: [35, 35, 35, 35, 35], whileDisabled: true,
        use(m, u) {
          m.removeStatus(u, 'slow'); m.cleanse(u);
          m.addStatus(u, 'untarget', 0.5, 1, { key: 'aria_blue' }); m.addStatus(u, 'unstop', 0.5, 1, { key: 'aria_blue' });
          for (const a of H.alliesNear(m, u, 6, true)) m.addStatus(a, 'haste', 2, 0.25, { key: 'aria_haste' });
          if (u.ws.okt && u.ws.okt.alive) m.addStatus(u.ws.okt, 'haste', 2, 0.25);
        },
        ai: { use: 'support', aim: 'self', range: 7, alsoEscape: true },
      },
      s3: {
        name: 'Nốt Vàng — Phòng Thủ', desc: 'Oktava lao ngược về phía Aria, choáng 0.75s kẻ trên đường; khiên 60/90/120/150/180 (+40% SMPT) cho Aria hoặc đồng minh thấp máu nhất trong 6 đv (4s). 3 nốt dùng chung hồi chiêu.',
        cd: [4, 3.75, 3.5, 3.25, 3], cost: [40, 40, 40, 40, 40],
        use(m, u, ctx) {
          const okt = u.ws.okt;
          if (okt && okt.alive) {
            const v = H.dirTo(okt, u);
            const L = Math.max(0.5, M.dist(okt, u) - 1);
            m.hitLine(u, okt.x, okt.y, v.x, v.y, L, 1.4, (e) => { m.addStatus(e, 'stun', 0.75, 1, { src: u }); m.damage(u, e, H.amt(u, ctx.v([30, 45, 60, 75, 90]), 0, 0.3), 'magic', { tag: 's3' }); }, { color: '#ffe07a' });
            m.dashTo(okt, okt.x + v.x * L, okt.y + v.y * L, 18, {});
          }
          const allies = H.alliesNear(m, u, 6, true).sort((a, b) => a.hpPct - b.hpPct || a.id - b.id);
          const t = allies[0] || u;
          const sh = m.shield(u, t, ctx.v([60, 90, 120, 150, 180]) + 0.4 * u.st.ap, 4);
          // Hộ Mệnh Chữa Lành: khiên còn thừa khi hết hạn thành hồi máu
          if (sh && H.T(u, '3c')) sh.onEnd = (mm, tt, st) => { if (st.v > 0) mm.heal(u, tt, st.v); };
          // Sóng Phản Xạ: tiếng gầm phá hủy đạn địch quanh Aria & Oktava
          if (H.T(u, '6b')) for (const p of m.projs) if (!p.dead && p.team !== u.team && (G.M.dist(p, u) < 4 || (okt && okt.alive && G.M.dist(p, okt) < 4))) p.dead = true;
        },
        ai: { use: 'support', aim: 'self', range: 6, alsoCc: true },
      },
      sub: {
        name: 'Gắn Kết', desc: 'Nhảy lên cưỡi Oktava 5s: di chuyển bằng gã khổng lồ, mọi sát thương nhắm vào Aria do Oktava gánh. Cần Oktava còn sống.',
        cd: 16,
        can(m, u) { return !!(u.ws.okt && u.ws.okt.alive); },
        use(m, u) {
          const okt = u.ws.okt;
          // Đổi Chỗ Tức Thời: đứng xa Oktava thì hoán đổi vị trí
          if (H.T(u, '12b') && okt && okt.alive && G.M.dist(u, okt) > 4) { const x = u.x, y = u.y; m.blink(u, okt.x, okt.y); okt.x = x; okt.y = y; okt.navP = null; return; }
          // Nhập Thể Âm Vang: Oktava hóa khổng lồ (lá chắn 50% máu tối đa, đòn đánh lan + làm chậm)
          if (H.T(u, '6a') && okt && okt.alive) { m.shield(u, okt, okt.st.maxHp * 0.5, 4); okt.ws = okt.ws || {}; u.ws.giant = m.time + 4; okt.r = 1.1; m.later(4, () => { okt.r = 0.85; }); }
          u.ws.mount = m.time + 5; m.addStatus(u, 'haste', 5, 0.15, { key: 'aria_mount' });
          if (okt && okt.alive) m.blink(u, okt.x, okt.y);
          if (H.T(u, '9b')) { m.addStatus(u, 'unstop', 5, 1, { key: 'aria_ch' }); if (okt && okt.alive) m.addStatus(okt, 'buff', 5, 1, { key: 'aria_ch', mods: { dmgAmp: 1 } }); }
          if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#3a8a5a', life: 5 });
        },
        ai: { use: 'defend', aim: 'self', range: 6, cond: (m, u) => u.hpPct < 0.5 && u.ws.okt && u.ws.okt.hpPct > 0.35 },
      },
      s4: {
        name: 'Bản Giao Hưởng Tử Thần', desc: 'Chỉ dùng được khi đã đánh xong 3 Bản Nhạc. Sóng âm 11 đv xuyên qua mọi kẻ địch: MÊ HOẶC 1.75s (tự đi nộp mạng cho Oktava). Sóng chạm Oktava: Oktava BẤT TỬ 6s và đòn đánh cường hóa (+100% sát thương, +50% tốc đánh).',
        cd: [40, 35, 30], cost: [100, 100, 100], castTime: 0.3,
        can(m, u) { return (u.ws.songs || 0) >= songNeed(u); },
        use(m, u, ctx) {
          u.ws.songs = 0;
          const v = H.dirTo(u, ctx.pt), okt = u.ws.okt;
          m.hitLine(u, u.x, u.y, v.x, v.y, 11, 2.4, (e) => {
            m.damage(u, e, H.amt(u, ctx.v([100, 160, 220]), 0, 0.6), 'magic', { tag: 's4' });
            if (e.kind === 'hero') m.addStatus(e, 'charm', 1.75, 1, { src: okt && okt.alive ? okt : u });
          }, { color: '#ff9ad5', fx: 'wave' });
          if (okt && okt.alive && M.segDist(okt.x, okt.y, u.x, u.y, u.x + v.x * 11, u.y + v.y * 11) < 2.2) {
            m.addStatus(okt, 'undying', 6, 1); m.addStatus(okt, 'buff', 6, 1, { mods: { dmgAmp: 1, asPct: 0.5 } });
            if (m.fxOn) m.fx({ type: 'callout', id: okt.id, text: 'OKTAVA BẤT TỬ!', color: '#ffd700' });
          }
        },
        ai: { use: 'ult', range: 9, aim: 'point', speed: 0, aoe: 2.4, line: 10, minTargets: 1 },
      },
    },
    ai: { order: ['s3', 's1', 's2'], engageRange: 5.5, role: 'support' },
    tags: ['heal', 'cc'],
  });
  G.HEROES.aria.tree = [
    [
      { name: 'Âm Vang Tái Sinh', desc: 'Oktava hồi sinh sau 25s (thay vì 45s).' },
      { name: 'Nhịp Điệu Đồng Vọng', desc: 'Aria và Oktava chạy nhanh hơn 10%.', stats: { msPct: 0.1 } },
      { name: 'Thanh Âm Lan Tỏa', desc: 'Sóng âm quanh Aria của Nốt Đỏ rộng hơn 30%.' },
    ],
    [
      { name: 'Mê Muội Vực Sâu', desc: 'Hòa Âm Xanh mê hoặc lâu hơn 50%.' },
      { name: 'Trùng Kích Đoạt Hồn', desc: 'Hòa Âm Đỏ choáng 1.4s (thay vì 1s) và phá lá chắn.' },
      { name: 'Hộ Mệnh Chữa Lành', desc: 'Khiên của Nốt Vàng còn thừa khi hết hạn chuyển thành hồi máu.' },
    ],
    [
      { name: 'Nhập Thể Âm Vang', desc: 'Gắn Kết: Oktava hóa khổng lồ 4s — nhận lá chắn bằng 50% máu tối đa, đòn đánh lan quanh mục tiêu và làm chậm 30%.' },
      { name: 'Sóng Phản Xạ', desc: 'Nốt Vàng: tiếng gầm phá hủy mọi đạn đạo của đối phương trong 4 đv quanh Aria và Oktava.' },
      { name: 'Vọng Âm Cộng Hưởng', desc: 'Nốt nhạc không bao giờ tan biến (thay vì tan sau 5s không gõ).' },
    ],
    [
      { name: 'Khúc Khải Hoàn', desc: 'Chỉ cần 2 Bản Nhạc (thay vì 3) để mở Bản Giao Hưởng Tử Thần.' },
      { name: 'Cộng Hưởng Tuyệt Đối', desc: 'Khi cưỡi Oktava: Aria không thể cản phá, Oktava gây gấp đôi sát thương.' },
      { name: 'Bản Hòa Âm Tối Thượng', desc: 'Hòa Âm Hỗn Hợp nhận trọn uy lực cả 3 Hòa Âm đơn.' },
    ],
    [
      { name: 'Khúc Ca Ru Ngủ', desc: 'Gõ đúng thứ tự S1 → S2 → S3: mọi tướng địch trong 8 đv ngủ 1.25s (thay cho Hòa Âm).' },
      { name: 'Đổi Chỗ Tức Thời', desc: 'Gắn Kết khi đứng xa Oktava (trên 4 đv): hoán đổi vị trí Aria và Oktava.' },
      { name: 'Song Tấu Độc Lập', desc: 'Oktava +50% chỉ số; mỗi 6s Aria hồi 3% máu tối đa cho mình và Oktava, cả hai +15% tốc chạy 2s.',
        tick(m, u) {
          if (!H.ready(m, u, 'stdl', 6)) return;
          const okt = u.ws.okt;
          m.heal(u, u, u.st.maxHp * 0.03, true); m.addStatus(u, 'haste', 2, 0.15, { key: 'stdl' });
          if (okt && okt.alive) { m.heal(u, okt, okt.st.maxHp * 0.03, true); m.addStatus(okt, 'haste', 2, 0.15, { key: 'stdl' }); }
        } },
    ],
  ];
})();
