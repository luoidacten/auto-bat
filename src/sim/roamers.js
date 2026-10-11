'use strict';
// ===== GĐ11: QUÁI LANG THANG & BOSS NHỎ (theo tài liệu "Hệ Thống Quái Lang Thang") =====
// Không có dây xích cắm chốt: đi tuần theo các điểm trong vùng của phe mình (dạt dần vào trong bo theo vòng co).
// Mỗi nhóm = 1 Đầu Đàn (Elite) + 2–3 quái thường; quái thường LUÔN đánh mục tiêu của Đầu Đàn.
// Bị đánh: đuổi tối đa 12–16 đv (tính từ chỗ bắt đầu đuổi); bỏ cuộc khi mục tiêu cắt tầm nhìn (vào bụi / tàng hình) hoặc chạy quá xa.
// 3 phe: 💀 Binh Đoàn Xương (Vùng Tử Khí) • ☣ Quái Vật Tận Thế (Trạm Khí Độc) • 👻 Ma Hội (Rừng Thông, Đầm Lầy Sương).
// Boss nhỏ (8 con, mỗi con 2 kỹ năng có cảnh báo) đi tuần một mình từ phút 5.
// Tiếng đánh nhau với quái lang thang vang xa 35 đv (thính giác của AI — kền kền / sát thủ mò tới).
(function () {
  const G = globalThis.G;
  const C = G.C, MAP = G.MAP, M = G.M;
  const { dist } = M;
  const R = C.ROAM = {
    first: 90, every: 75, maxGroups: 6, bossFirst: 300, bossEvery: 210, maxBoss: 2,
    chase: [12, 16], loseBush: 3,
    reward: { normal: { gold: 35, xp: 80, pot: 0.08 }, elite: { gold: 90, xp: 200 }, boss: { gold: 250, xp: 450 } },
  };
  // ---------- quái thường & đầu đàn ----------
  // stat: hp, ad, armor, mr, ms, range, r — tăng theo phút: hp +8%/phút, ad +5%/phút (giống bãi quái)
  const T = {
    // 💀 Binh Đoàn Xương — kháng phép, sợ đòn vật lý
    bone_shield: { fac: 'bone', name: 'Lính Xương Cầm Khiên', hp: 380, ad: 16, armor: 30, mr: 40, ms: 3.0, range: 1.6, r: 0.8, color: '#d8d0b8', front: 0.3,
      elite: { name: 'Đội Trưởng Hài Cốt', hp: 850, ad: 26, armor: 45, mr: 45, r: 1.0, sweep: true } },
    bone_archer: { fac: 'bone', name: 'Cung Thủ Xương', hp: 300, ad: 18, armor: 15, mr: 35, ms: 3.1, range: 6.5, r: 0.75, color: '#c8c0a8', ranged: true,
      elite: { name: 'Xạ Thủ Hắc Cốt', hp: 620, ad: 28, armor: 20, mr: 40, range: 8, r: 0.9, shred: 0.15 } },
    bone_mage: { fac: 'bone', name: 'Hài Cốt Dẫn Hồn', hp: 320, ad: 20, armor: 12, mr: 45, ms: 3.0, range: 6, r: 0.75, color: '#a8a0d8', ranged: true, magic: true,
      elite: { name: 'Trưởng Lão Vu Cốt', hp: 700, ad: 26, armor: 18, mr: 55, range: 6.5, r: 0.95, aura: true } },
    // ☣ Quái Vật Tận Thế — độc, rút máu, ăn mòn
    apoc_hound: { fac: 'apoc', name: 'Chó Săn Nhiễm Độc', hp: 340, ad: 17, armor: 15, mr: 15, ms: 3.8, range: 1.5, r: 0.75, color: '#9ad040', poison: true,
      elite: { name: 'Chó Chúa Gai Nhọn', hp: 780, ad: 28, armor: 25, mr: 20, r: 1.0, burst: true } },
    apoc_beetle: { fac: 'apoc', name: 'Bọ Thiết Giáp', hp: 520, ad: 15, armor: 45, mr: 25, ms: 2.6, range: 1.6, r: 0.95, color: '#7a8a40', shell: true,
      elite: { name: 'Bọ Chúa Phun Axit', hp: 900, ad: 24, armor: 50, mr: 30, range: 7, r: 1.15, ranged: true, acid: true } },
    // 👻 Ma Hội — tàng hình, xuyên vật cản thấp, hút mana
    wr_soul: { fac: 'wraith', name: 'Vong Hồn Trôi Dạt', hp: 300, ad: 15, armor: 10, mr: 30, ms: 3.4, range: 1.8, r: 0.75, color: '#b0c8ff', slowAs: true,
      elite: { name: 'Oan Hồn Thống Khổ', hp: 640, ad: 24, armor: 15, mr: 40, r: 0.95 } },
    wr_wisp: { fac: 'wraith', name: 'Đốm Lửa Ma Trơi', hp: 220, ad: 14, armor: 5, mr: 25, ms: 4.0, range: 1.2, r: 0.6, color: '#7af0ff', kamikaze: true,
      elite: { name: 'Hỏa Tinh U Minh', hp: 520, ad: 22, armor: 10, mr: 30, ms: 4.4, r: 0.8 } },
    wr_blade: { fac: 'wraith', name: 'Hắc Ảnh Tập Kích', hp: 330, ad: 20, armor: 15, mr: 20, ms: 3.5, range: 1.6, r: 0.75, color: '#6a5a9a', bushCrit: true,
      elite: { name: 'Liêm Hồn Đao Phủ', hp: 700, ad: 32, armor: 20, mr: 25, r: 0.95 } },
    wr_trick: { fac: 'wraith', name: 'Hồn Ma Đánh Lạc Hướng', hp: 300, ad: 14, armor: 10, mr: 30, ms: 3.3, range: 1.8, r: 0.75, color: '#d0b0ff', mirror: true,
      elite: { name: 'Ảo Ảnh Ma Cô', hp: 620, ad: 22, armor: 15, mr: 35, r: 0.95 } },
    wr_banshee: { fac: 'wraith', name: 'Quỷ Hồn Gào Thét', hp: 290, ad: 17, armor: 10, mr: 35, ms: 3.2, range: 6, r: 0.75, color: '#e0c0ff', ranged: true, magic: true, wail: true,
      elite: { name: 'Banshee Tiếng Hét', hp: 640, ad: 26, armor: 15, mr: 45, range: 6.5, r: 0.95, scream: true } },
  };
  const FACTION = {
    bone: { name: 'Binh Đoàn Xương', icon: '💀', bio: [7, 2], types: ['bone_shield', 'bone_archer', 'bone_mage'] },
    apoc: { name: 'Quái Vật Tận Thế', icon: '☣', bio: [8, 5], types: ['apoc_hound', 'apoc_beetle'] },
    wraith: { name: 'Ma Hội', icon: '👻', bio: [0, 1], types: ['wr_soul', 'wr_wisp', 'wr_blade', 'wr_trick', 'wr_banshee'] },
  };
  // ---------- 8 boss nhỏ (mỗi con 2 kỹ năng) ----------
  const B = {
    bone_exec: { fac: 'bone', name: 'Đao Phủ Hài Cốt', hp: 2400, hpMin: 120, ad: 70, adMin: 3.5, armor: 40, mr: 25, ms: 2.7, r: 1.5, color: '#d8c8a0',
      sk: [{ id: 'cleave', name: 'Trảm Quyết Tàn Bạo', cd: 8 }, { id: 'spikes', name: 'Gai Xương Địa Ngục', cd: 14 }] },
    bone_cav: { fac: 'bone', name: 'Kỵ Sĩ Xương', hp: 2100, hpMin: 110, ad: 65, adMin: 3.2, armor: 35, mr: 35, ms: 4.2, r: 1.4, color: '#e8e0d0',
      sk: [{ id: 'charge', name: 'Xung Phong Phá Trận', cd: 10 }, { id: 'flag', name: 'Cắm Cờ Tử Thần', cd: 16 }] },
    bone_colossus: { fac: 'bone', name: 'Cự Ma Khung Xương', hp: 3200, hpMin: 150, ad: 80, adMin: 4, armor: 50, mr: 20, ms: 2.5, r: 1.9, color: '#b8b098',
      sk: [{ id: 'skull', name: 'Ném Khối Hài Cốt', cd: 9 }, { id: 'spin', name: 'Lốc Xoáy Khung Xương', cd: 18 }] },
    apoc_flesh: { fac: 'apoc', name: 'Thực Thể Ghép Xác', hp: 2800, hpMin: 130, ad: 75, adMin: 3.8, armor: 30, mr: 30, ms: 2.8, r: 1.7, color: '#c07a7a',
      sk: [{ id: 'hook', name: 'Móc Xích Máu Thịt', cd: 11 }, { id: 'gas', name: 'Bộc Phá Khí Độc', cd: 15 }] },
    apoc_twin: { fac: 'apoc', name: 'Bạo Chúa Hai Đầu', hp: 3000, hpMin: 140, ad: 85, adMin: 4.2, armor: 45, mr: 25, ms: 3.0, r: 1.8, color: '#a06a4a',
      sk: [{ id: 'howl', name: 'Tiếng Hú Chấn Động', cd: 10 }, { id: 'leap', name: 'Bổ Nhào Nghiền Nát', cd: 14 }] },
    apoc_spider: { fac: 'apoc', name: 'Nhện Gai Tử Thần', hp: 2200, hpMin: 110, ad: 70, adMin: 3.5, armor: 25, mr: 40, ms: 3.4, r: 1.5, color: '#6a7a3a',
      sk: [{ id: 'web', name: 'Quấn Kén Khống Chế', cd: 9 }, { id: 'needles', name: 'Mưa Gai Axit', cd: 13 }] },
    apoc_sludge: { fac: 'apoc', name: 'Quái Bùn Sludge', hp: 2600, hpMin: 120, ad: 60, adMin: 3, armor: 35, mr: 45, ms: 2.6, r: 1.6, color: '#7a9a50', noKnock: true,
      sk: [{ id: 'mud', name: 'Phun Pháo Bùn Thải', cd: 8 }, { id: 'absorb', name: 'Nuốt Chửng & Bắn Trả', cd: 16 }] },
    wr_priest: { fac: 'wraith', name: 'Giáo Chủ Ma Hội', hp: 2600, hpMin: 125, ad: 78, adMin: 3.8, armor: 25, mr: 55, ms: 3.1, r: 1.4, color: '#9a6ad0', ranged: true, range: 6, veil: true,
      sk: [{ id: 'drain', name: 'Ma Trận Hút Hồn', cd: 10 }, { id: 'souls', name: 'Vạn Hồn Cuồng Nộ', cd: 16 }] },
  };
  const NE = () => ({ team: C.NEUTRAL, alive: true });
  // ---------- kỹ năng boss nhỏ ----------
  const SK = {
    cleave(m, u, t) { const v = M.dir(u, t), L = 5, x = u.x, y = u.y; warnLine(m, u, x, y, v, L, 1.5, 0.8, (mm) => mm.hitLine(NE(), x, y, v.x, v.y, L, 0.75, (e) => { if (e.kind !== 'hero') return; mm.damage(u, e, u.st.ad * 2.6, 'phys', { tag: 'mboss' }); if (e.ga > 0) e.ga *= 0.6; mm.knock(u, e, v.x, v.y, 2, 0.2); })); },
    spikes(m, u) { const x = u.x, y = u.y; warnCircle(m, u, x, y, 4, 0.9, (mm) => mm.hitCircle(NE(), x, y, 4, (e) => { if (e.kind !== 'hero') return; mm.damage(u, e, u.st.ad * 1.6, 'phys', { tag: 'mboss', aoe: true }); mm.knockup(u, e, 0.75); mm.dot(u, e, 10 + 2 * mm.time / 60, 3, 'phys', 'mb_bleed'); })); },
    charge(m, u, t) { const v = M.dir(u, t), L = 8, x = u.x, y = u.y; warnLine(m, u, x, y, v, L, 2, 0.7, (mm) => { mm.dashTo(u, x + v.x * L, y + v.y * L, 22, { unstop: true }); mm.hitLine(NE(), x, y, v.x, v.y, L, 1, (e) => { if (e.kind !== 'hero') return; mm.damage(u, e, u.st.ad * 1.8, 'phys', { tag: 'mboss' }); const s = (e.x - x) * -v.y + (e.y - y) * v.x > 0 ? 1 : -1; mm.knock(u, e, -v.y * s, v.x * s, 2, 0.2); mm.addStatus(e, 'slow', 2, 0.4, { src: u }); }); }); },
    flag(m, u) { const x = u.x, y = u.y; m.zone({ owner: u, x, y, r: 5, life: 6, every: 0.3, kind: 'mbflag', tick: (mm) => mm.hitCircle(NE(), x, y, 5, (e) => e.kind === 'hero' && mm.addStatus(e, 'nodash', 0.4, 1, { src: u, key: 'mb_flag' }), { noFx: true }) });
      for (let i = 0; i < 2; i++) m.spawnRoamer('bone_shield', false, x + (i ? 1.5 : -1.5), y, u.roamG, u); },
    skull(m, u, t) { const p = { x: t.x, y: t.y }; warnCircle(m, u, p.x, p.y, 2.5, 1.0, (mm) => mm.hitCircle(NE(), p.x, p.y, 2.5, (e) => { if (e.kind !== 'hero') return; mm.damage(u, e, u.st.ad * 2.2, 'phys', { tag: 'mboss', aoe: true }); mm.addStatus(e, 'stun', 1, 1, { src: u }); })); },
    spin(m, u) { u.ws.reflect = m.time + 3; m.zone({ owner: u, x: u.x, y: u.y, r: 3.5, life: 3, every: 0.5, follow: u, kind: 'mbspin', tick: (mm) => mm.hitCircle(NE(), u.x, u.y, 3.5, (e) => { if (e.kind !== 'hero') return; mm.damage(u, e, u.st.ad * 0.6, 'phys', { tag: 'mboss', aoe: true }); const v = M.dir(e, u); mm.knock(u, e, v.x, v.y, 0.6, 0.1); }, { noFx: true }) }); },
    hook(m, u, t) { const v = M.dir(u, t), L = 7.5, x = u.x, y = u.y; warnLine(m, u, x, y, v, L, 1, 0.6, (mm) => { let hit = null; mm.hitLine(NE(), x, y, v.x, v.y, L, 0.5, (e) => { if (!hit && e.kind === 'hero') hit = e; }); if (hit) { const d = dist(hit, u) - u.r - hit.r - 0.3; if (d > 0) mm.knock(u, hit, -v.x, -v.y, d, 0.25); mm.addStatus(hit, 'stun', 0.75, 1, { src: u }); mm.later(0.3, (m3) => hit.alive && m3.damage(u, hit, u.st.ad * 2.4, 'phys', { tag: 'mboss' })); } }); },
    gas(m, u) { const x = u.x, y = u.y; m.zone({ owner: u, x, y, r: 4, life: 4, every: 0.5, kind: 'miasma', tick: (mm) => mm.hitCircle(NE(), x, y, 4, (e) => { if (e.kind !== 'hero') return; mm.addStatus(e, 'blind', 0.6, 1, { src: u, key: 'mb_gas' }); mm.damage(u, e, e.st.maxHp * 0.015, 'true', { tag: 'mboss', aoe: true }); }, { noFx: true }) }); },
    howl(m, u, t) { const v = M.dir(u, t), x = u.x, y = u.y; m.telegraph({ shape: 'cone', x, y, dx: v.x, dy: v.y, r: 5.5, c: 0.5, life: 0.7, team: C.NEUTRAL, color: '#ffb070' });
      castLater(m, u, 0.7, (mm) => mm.hitCone(NE(), x, y, v.x, v.y, 5.5, 0.5, (e) => { if (e.kind !== 'hero') return; mm.damage(u, e, u.st.ad * 1.2, 'phys', { tag: 'mboss', aoe: true }); mm.addStatus(e, 'silence', 1.5, 1, { src: u }); mm.knock(u, e, v.x, v.y, 2, 0.2); })); },
    leap(m, u, t) { const p = H_toward(u, t, 6); warnCircle(m, u, p.x, p.y, 3, 1.0, (mm) => { mm.blink(u, p.x, p.y); mm.hitCircle(NE(), p.x, p.y, 3, (e) => { if (e.kind !== 'hero') return; mm.damage(u, e, u.st.ad * 2, 'phys', { tag: 'mboss', aoe: true }); mm.knockup(u, e, 1); }); }); },
    web(m, u, t) { if (dist(u, t) > 7) return false; m.proj({ owner: u, x: u.x, y: u.y, target: t, speed: 16, kind: 'arrow', onHit: (mm, p, e) => { mm.addStatus(e, 'root', 1.75, 1, { src: u }); mm.addStatus(e, 'nodash', 1.75, 1, { src: u }); mm.damage(u, e, u.st.ad * 0.8, 'magic', { tag: 'mboss' }); } }); },
    needles(m, u) { for (let i = 0; i < 8; i++) { const a = i * 0.785; m.proj({ owner: u, x: u.x, y: u.y, dx: M.cos(a), dy: M.sin(a), speed: 14, range: 8, r: 0.5, kind: 'arrow', onHit: (mm, p, e) => { if (e.kind !== 'hero') return; mm.damage(u, e, u.st.ad * 1.1, 'magic', { tag: 'mboss' }); mm.addStatus(e, 'slow', 1.5, 0.5, { src: u }); if (e.ga > 0) e.ga = Math.max(0, e.ga - 120); } }); } },
    mud(m, u, t) { for (let i = 0; i < 3; i++) { const p = { x: t.x + (i - 1) * 2.2, y: t.y + (i % 2 ? 1.5 : -1) }; warnCircle(m, u, p.x, p.y, 1.8, 0.8, (mm) => { mm.hitCircle(NE(), p.x, p.y, 1.8, (e) => e.kind === 'hero' && mm.damage(u, e, u.st.ad * 1, 'magic', { tag: 'mboss', aoe: true })); mm.zone({ owner: u, x: p.x, y: p.y, r: 1.8, life: 5, every: 0.3, kind: 'mud', tick: (m3) => m3.hitCircle(NE(), p.x, p.y, 1.8, (e) => e.kind === 'hero' && m3.addStatus(e, 'slow', 0.4, 0.4, { src: u, key: 'mb_mud' }), { noFx: true }) }); }, true); } },
    absorb(m, u) { u.ws.absorb = { until: m.time + 1.5, got: 0 }; m.addStatus(u, 'reduce', 1.5, 0.6, { key: 'mb_absorb' });
      castLater(m, u, 1.5, (mm) => { const g = u.ws.absorb ? u.ws.absorb.got : 0; u.ws.absorb = null; mm.hitCircle(NE(), u.x, u.y, 4.5, (e) => { if (e.kind !== 'hero') return; mm.damage(u, e, Math.min(800, g * 0.6 + u.st.ad), 'true', { tag: 'mboss', aoe: true }); const v = M.dir(u, e); mm.knock(u, e, v.x, v.y, 2.5, 0.25); }, { color: '#7a9a50' }); }); },
    drain(m, u, t) { const p = { x: t.x, y: t.y }; warnCircle(m, u, p.x, p.y, 3.5, 0.8, (mm) => mm.hitCircle(NE(), p.x, p.y, 3.5, (e) => { if (e.kind !== 'hero') return; mm.addStatus(e, 'root', 1.5, 1, { src: u }); const mp = (e.st.maxMp || 0) * 0.2; e.mp = Math.max(0, (e.mp || 0) - mp); mm.shield(u, u, 150 + mp, 6); mm.damage(u, e, u.st.ad * 1, 'magic', { tag: 'mboss', aoe: true }); })); },
    souls(m, u) { for (let i = 0; i < 8; i++) { const a = i * 0.785; m.proj({ owner: u, x: u.x, y: u.y, dx: M.cos(a), dy: M.sin(a), speed: 12, range: 8, r: 0.55, kind: 'star', onHit: (mm, p, e) => { if (e.kind !== 'hero') return; mm.damage(u, e, u.st.ad * 1.6, 'magic', { tag: 'mboss' }); mm.addStatus(e, 'blind', 2, 1, { src: u }); mm.knock(u, e, p.dx || 0, p.dy || 0, 2, 0.2); } }); } },
  };
  function H_toward(u, t, max) { const d = dist(u, t), k = Math.min(1, max / Math.max(0.01, d)); return { x: u.x + (t.x - u.x) * k, y: u.y + (t.y - u.y) * k }; }
  function castLater(m, u, d, fn) { u.cast = { key: 'boss', t: d, total: d, unstop: true, fire: (mm) => { if (u.alive) fn(mm); } }; u.attackTarget = null; u.windup = null; }
  function warnCircle(m, u, x, y, r, d, fn, free) { m.telegraph({ x, y, r, life: d, team: C.NEUTRAL, color: u.color }); if (free) m.later(d, (mm) => u.alive && fn(mm)); else castLater(m, u, d, fn); }
  function warnLine(m, u, x, y, v, L, w, d, fn) { m.telegraph({ shape: 'line', x, y, x2: x + v.x * L, y2: y + v.y * L, w, life: d, team: C.NEUTRAL, color: u.color }); castLater(m, u, d, fn); }

  const RoamMix = {
    setupRoamers() {
      this.roamers = []; this.roamGroups = []; this.roamSt = { nextAt: R.first, bossAt: R.bossFirst, gid: 0, kills: 0, bossKills: 0 };
      this.rngRoam = new G.Rng(this.seed + ':roam');
      // điểm neo theo vùng (trung bình các bãi quái trong vùng)
      const byReg = {}; for (const c of MAP.camps) { const k = byReg[c.region] || (byReg[c.region] = { x: 0, y: 0, n: 0 }); k.x += c.x; k.y += c.y; k.n++; }
      this.roamAnchors = {}; for (const r in byReg) { const k = byReg[r]; this.roamAnchors[r] = { x: k.x / k.n, y: k.y / k.n, region: +r, bio: MAP.REGIONS[r].bio }; }
    },
    // một điểm tuần tra trong vùng của phe (trong bo; không có vùng hợp thì vùng bất kỳ)
    roamPoint(fac, near) {
      const F = FACTION[fac], z = this.zoneSt, safe = z ? (z.next || z.cur) : null, rng = this.rngRoam;
      let A = Object.values(this.roamAnchors).filter((a) => F.bio.includes(a.bio));
      if (!A.length) A = Object.values(this.roamAnchors);
      if (safe) { const inA = A.filter((a) => dist(a, safe) < safe.r - 4); if (inA.length) A = inA; }
      const a = near ? A.slice().sort((p, q) => dist(p, near) - dist(q, near))[rng.int(0, Math.min(1, A.length - 1))] : A[rng.int(0, A.length - 1)];
      const ang = rng.range(0, Math.PI * 2), rr = rng.range(4, 22);
      let p = { x: a.x + Math.cos(ang) * rr, y: a.y + Math.sin(ang) * rr };
      if (safe && dist(p, safe) > safe.r - 3) { const v = M.dir(safe, p), k = Math.max(0, safe.r - 6); p = { x: safe.x + v.x * k, y: safe.y + v.y * k }; }
      MAP.pushOut(p, 1.5);
      return p;
    },
    spawnRoamer(type, elite, x, y, grp, leader) {
      const D = T[type], E = elite ? D.elite : null, S = Object.assign({}, D, E || {});
      const min = this.time / 60;
      const def = { hp: S.hp * (1 + 0.08 * min), ad: S.ad * (1 + 0.05 * min), armor: S.armor, mr: S.mr, ms: S.ms || D.ms, range: S.range || D.range, r: S.r, as: 0.75 };
      const u = this.spawnMonster('roam', def, x, y, { roam: true, roamType: type, elite: !!elite, roamG: grp, leader: leader || null, name: S.name, color: D.color, ranged: !!S.ranged });
      u.rdef = S; u.fac = D.fac; u.ws = u.ws || {};
      if (S.ranged) { u.ranged = true; u.projSpeed = 16; }
      u.onAuto = (m, mon, t, info) => roamHit(m, mon, t, info);
      this.roamers.push(u); if (grp) grp.units.push(u);
      return u;
    },
    spawnRoamGroup() {
      const facs = Object.keys(FACTION), fac = facs[this.roamSt.gid % facs.length], F = FACTION[fac], rng = this.rngRoam;
      const p = this.roamPoint(fac);
      const g = { id: ++this.roamSt.gid, fac, wp: this.roamPoint(fac, p), units: [], boss: false };
      const lt = F.types[rng.int(0, F.types.length - 1)];
      const L = this.spawnRoamer(lt, true, p.x, p.y, g, null); g.leader = L;
      const n = rng.int(2, 3);
      for (let i = 0; i < n; i++) { const tp = F.types[rng.int(0, F.types.length - 1)], a = i * 2.1; this.spawnRoamer(tp, false, p.x + Math.cos(a) * 1.8, p.y + Math.sin(a) * 1.8, g, L); }
      this.roamGroups.push(g);
      this.addFeed({ type: 'roam_group', fac, name: F.name, icon: F.icon, x: p.x, y: p.y });
    },
    spawnRoamBoss() {
      const ids = Object.keys(B), id = ids[this.rngRoam.int(0, ids.length - 1)], D = B[id], min = this.time / 60;
      const p = this.roamPoint(D.fac);
      const g = { id: ++this.roamSt.gid, fac: D.fac, wp: this.roamPoint(D.fac, p), units: [], boss: true };
      const u = this.spawnMonster('roamboss', { hp: D.hp + D.hpMin * min, ad: D.ad + D.adMin * min, armor: D.armor, mr: D.mr, ms: D.ms, range: D.range || 2.2, r: D.r, as: 0.7 }, p.x, p.y,
        { roam: true, miniBoss: id, roamG: g, name: D.name, color: D.color, big: false });
      u.rdef = D; u.fac = D.fac; u.skT = {}; u.ws = u.ws || {}; u.ranged = !!D.ranged; if (u.ranged) u.projSpeed = 16;
      g.leader = u; g.units.push(u); this.roamers.push(u); this.roamGroups.push(g);
      this.addFeed({ type: 'roam_boss', name: D.name, icon: FACTION[D.fac].icon, x: p.x, y: p.y });
      if (this.fxOn) this.fx({ type: 'callout', id: u.id, text: '⚠ ' + D.name, color: D.color });
    },
    updateRoamers() {
      const t = this.time, S = this.roamSt;
      if (!this.roamers) return;
      this.roamers = this.roamers.filter((u) => u.alive);
      for (const g of this.roamGroups) g.units = g.units.filter((u) => u.alive);
      this.roamGroups = this.roamGroups.filter((g) => g.units.length);
      const groups = this.roamGroups.filter((g) => !g.boss).length, bosses = this.roamGroups.filter((g) => g.boss).length;
      if (t >= S.nextAt) { S.nextAt = t + R.every; if (groups < R.maxGroups) this.spawnRoamGroup(); }
      if (t >= S.bossAt) { S.bossAt = t + R.bossEvery; if (bosses < R.maxBoss) this.spawnRoamBoss(); }
    },
    // ---------- não quái lang thang ----------
    roamThink(u) {
      const t = this.time;
      if (u.thinkT > t) return;
      u.thinkT = t + 0.2;
      const g = u.roamG, L = u.leader && u.leader.alive ? u.leader : null;
      // quái thường luôn đánh mục tiêu của đầu đàn
      if (L && L.aggro && L.aggro.alive) { if (u.aggro !== L.aggro) { u.aggro = L.aggro; u.chaseFrom = { x: u.x, y: u.y }; } }
      const a = u.aggro;
      if (a) {
        const lim = u.miniBoss ? R.chase[1] : u.elite ? 14 : R.chase[0];
        const hidden = !a.targetable || (a.statuses.length && a.has('stealth')) || (a.bush >= 0 && dist(a, u) > R.loseBush);
        if (!a.alive || hidden || dist(a, u.chaseFrom || u) > lim || t - u.lastHitT > 10) {
          u.aggro = null; u.attackTarget = null; u.chaseFrom = null;
          if (L && L.aggro === a) { L.aggro = null; L.attackTarget = null; }
        }
      }
      if (u.aggro) {
        u.resetting = false;
        if (u.miniBoss && !u.cast && this.miniSkill(u, u.aggro)) return;
        if (u.rdef.kamikaze && dist(u, u.aggro) < 1.6) { this.wispBoom(u); return; }
        u.attackTarget = u.aggro; u.goal = null;
        return;
      }
      u.attackTarget = null;
      if (u.hp < u.st.maxHp && t - u.lastHitT > 6) u.hp = Math.min(u.st.maxHp, u.hp + u.st.maxHp * 0.01);
      // đi tuần: đầu đàn đi tới điểm tuần tra, quái thường bám đầu đàn
      if (L && L !== u) { const a2 = u.id * 2.4; u.goal = { x: L.x + Math.cos(a2) * 2, y: L.y + Math.sin(a2) * 2 }; u.home = { x: u.x, y: u.y }; return; }
      if (!g.wp || dist(u, g.wp) < 2.5) g.wp = this.roamPoint(g.fac, u);
      u.goal = { x: g.wp.x, y: g.wp.y }; u.home = { x: u.x, y: u.y };
      u.speedK = 0.6;
      // Giáo Chủ: bán tàng hình khi không giao tranh
      if (u.rdef.veil) this.addStatus(u, 'stealth', 0.4, 1, { key: 'mb_veil' });
    },
    roamAggro(u, owner) {
      if (u.aggro && u.aggro.alive) return;
      u.aggro = owner; u.chaseFrom = { x: u.x, y: u.y };
      const L = u.leader && u.leader.alive ? u.leader : u;
      if (L !== u && !L.aggro) { L.aggro = owner; L.chaseFrom = { x: L.x, y: L.y }; }
      for (const o of (u.roamG ? u.roamG.units : [])) if (!o.aggro) { o.aggro = owner; o.chaseFrom = { x: o.x, y: o.y }; }
      if (owner.kind === 'hero') owner.ws.roamFightT = this.time;
    },
    miniSkill(u, a) {
      const t = this.time;
      if (t < (u.mbT || 0)) return false;
      for (const s of u.rdef.sk) {
        if (t < (u.skT[s.id] || 0)) continue;
        const ok = SK[s.id](this, u, a);
        if (ok === false) continue;
        u.skT[s.id] = t + s.cd; u.mbT = t + 2;
        if (this.fxOn) this.fx({ type: 'callout', id: u.id, text: '⚠ ' + s.name, color: u.color });
        return true;
      }
      return false;
    },
    wispBoom(u) {
      const S = u.rdef;
      this.hitCircle(NE(), u.x, u.y, 2.5, (e) => e.kind === 'hero' && this.damage(u, e, u.st.ad * (S.elite ? 3 : 2.4), 'magic', { tag: 'mob', aoe: true }), { color: '#7af0ff' });
      u.hp = 0; this.kill(u, null);
    },
    roamDeath(u, hero) {
      const S = this.roamSt;
      if (u.rdef && u.rdef.burst) this.hitCircle(NE(), u.x, u.y, 3, (e) => { if (e.kind === 'hero') { this.damage(u, e, u.st.ad * 1.5, 'phys', { tag: 'mob', aoe: true }); this.dot(u, e, 8, 3, 'magic', 'mb_poison'); } }, { color: '#9ad040' });
      if (!hero) return;
      const min = this.time / 60;
      if (u.miniBoss) {
        S.bossKills++;
        this.gainGold(hero, R.reward.boss.gold + 5 * min); this.gainXP(hero, (R.reward.boss.xp + 8 * min) * this.catchUp(hero));
        this.giveSoul(hero, this.rngRoam.next() < 0.5 ? 3 : 4, 'boss nhỏ');
        if (hero.bag) this.bagAdd(hero, 'hp_l', 2);
        hero.stats.miniBoss = (hero.stats.miniBoss || 0) + 1;
        this.addFeed({ type: 'roam_boss_kill', name: u.name, hero });
      } else if (u.elite) {
        this.gainGold(hero, R.reward.elite.gold + 3 * min); this.gainXP(hero, (R.reward.elite.xp + 5 * min) * this.catchUp(hero));
        this.giveSoul(hero, this.rngRoam.next() < 0.6 ? 2 : 3, 'đầu đàn');
        if (hero.bag) this.bagAdd(hero, 'hp_m', 1);
      } else {
        this.gainGold(hero, R.reward.normal.gold + 2 * min); this.gainXP(hero, (R.reward.normal.xp + 3 * min) * this.catchUp(hero));
        if (hero.bag && this.rngRoam.next() < R.reward.normal.pot) { const k = ['hp_s', 'mp_s', 'ga_s'][this.rngRoam.int(0, 2)]; this.bagAdd(hero, k, 1); }
      }
      S.kills++; hero.stats.camps = (hero.stats.camps || 0) + 1;
      if (this.fxOn) this.fx({ type: 'death', x: u.x, y: u.y, team: C.NEUTRAL });
    },
  };
  // đòn đánh thường theo loại quái
  function roamHit(m, u, t, info) {
    const S = u.rdef || {};
    if (S.magic) info.type = 'magic';
    if (t.kind !== 'hero') return;
    if (S.poison) info.extra.push(() => t.alive && m.dot(u, t, 4 + m.time / 60, 3, 'magic', 'mb_poison'));
    if (S.shred) info.extra.push(() => { if (t.ga > 0) t.ga *= 1 - S.shred; });
    if (S.slowAs) info.extra.push(() => t.alive && m.addStatus(t, 'buff', 2, 1, { key: 'mb_slowas', mods: { asPct: -0.2 } }));
    if (S.bushCrit && u.bush >= 0 && !u.ws.critDone) { u.ws.critDone = true; info.amt *= 2; }
    if (S.wail) info.extra.push(() => m.hitCircle(NE(), t.x, t.y, 2, (e) => e.kind === 'hero' && m.addStatus(e, 'slow', 1, 0.25, { src: u, key: 'mb_wail' }), { noFx: true }));
    if (S.scream && m.time >= (u.ws.scrT || 0)) { u.ws.scrT = m.time + 6; info.extra.push(() => t.alive && m.addStatus(t, 'silence', 1, 1, { src: u })); }
    if (S.sweep && m.time >= (u.ws.swT || 0)) { u.ws.swT = m.time + 5; const v = M.dir(u, t); info.extra.push(() => m.hitCone(NE(), u.x, u.y, v.x, v.y, 2.6, 0, (e) => { if (e.kind === 'hero') { m.damage(u, e, u.st.ad * 0.8, 'phys', { tag: 'mob', aoe: true }); m.dot(u, e, 5, 3, 'phys', 'mb_bleed'); } }, { color: '#d8d0b8' })); }
    if (S.acid && m.time >= (u.ws.acT || 0)) { u.ws.acT = m.time + 5; const x = t.x, y = t.y; m.zone({ owner: u, x, y, r: 1.6, life: 4, every: 0.5, kind: 'acid', tick: (mm) => mm.hitCircle(NE(), x, y, 1.6, (e) => { if (e.kind === 'hero') { mm.addStatus(e, 'buff', 1, 1, { key: 'mb_acid', mods: { armorPct: -0.15 } }); if (e.ga > 0) e.ga *= 0.93; } }, { noFx: true }) }); }
    if (S.aura) for (const o of (u.roamG ? u.roamG.units : [])) if (o.alive) { m.heal(u, o, o.st.maxHp * 0.02, true); m.addStatus(o, 'haste', 1.2, 0.2, { key: 'mb_aura' }); }
  }
  G.RoamMix = RoamMix; G.ROAM_T = T; G.ROAM_BOSS = B; G.ROAM_FACTION = FACTION; G.ROAM_SK = SK;
})();
