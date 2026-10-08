'use strict';
// ===== GĐ8: BOSS, BÙA LỢI, TRANG BỊ HOÀNG KIM, QUÁI TUẦN TRA, NGUY HIỂM VÙNG, QUÁI THEO VÙNG =====
// Gắn vào Match.prototype.
// • 4 ổ boss (MAP.lairs): Ổ Tân Thế ở giữa (Boss Tân Thế; từ bo 4 là Rồng), Hang Tử Khí (Thiết Minh Quân ⇄ Thiên Hồn Chủ),
//   Lò Khí Độc (Phượng Hoàng ⇄ Kiếm Sư Vĩ Đại), Kho Báu Hoàng Kim (Quái Thú Hoàng Kim). Ổ nằm ngoài bo thì boss không ra.
// • Mỗi boss có 2 kiểu đánh thường + 3 chiêu CÓ CẢNH BÁO (vùng đỏ hiện trước: dải chữ nhật, vòng quanh thân, vòng rải rác, quạt,
//   đường khóa mục tiêu, vành khăn, vòng bám theo người, chữ thập xoay, vòng đồng tâm, tam giác) — AI đọc cảnh báo để né.
// • Ai gây sát thương lên boss đầu tiên (sau 30s yên ắng) → CẢ BẢN ĐỒ được báo → tranh boss.
// • Boss chọn mục tiêu theo bảng thù hận (ai gây nhiều sát thương gần đây nhất).
// • Người ra đòn cuối nhận thưởng: bùa lợi 120s / 240s, hoặc kho báu (vàng, Túi 6, Bình Rực Rỡ, Ý Niệm Rực Rỡ, đồ Hoàng Kim).
// • 3 quái tuần tra đi vòng quanh mỗi ổ boss; Vùng Tử Khí có mây tử khí, Trạm Khí Độc có ống xả phun độc; quái nhỏ mỗi vùng một loài.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, MAP = G.MAP, M = G.M;
  const { dist } = M;
  const NEU = { team: C.NEUTRAL, alive: true };
  const rot = (v, a) => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
  const heroesIn = (m, x, y, R) => m.heroes.filter((h) => h.alive && h.targetable && dist(h, { x, y }) <= R + h.r);

  // ---------------- bùa lợi ----------------
  const BUFFS = {
    buff_phoenix: { name: 'Ấn Niết Bàn', icon: '🔥', color: '#ff8a2a', time: 120, desc: 'Bị hạ gục: hồi sinh ngay tại chỗ với 100% máu, giữ nguyên toàn bộ đồ, bất tử 1.5s.' },
    buff_minh: { name: 'Minh Tướng Huyết Trảm', icon: '⚔', color: '#c0c0d0', time: 120, desc: 'Kết liễu một tướng: hồi 100% máu và nhận Giáp Ảo bằng 50% máu tối đa trong 15s.' },
    buff_hon: { name: 'Hồn Thần Bất Diệt', icon: '👻', color: '#b0e0ff', time: 120, desc: 'Nhận đòn chí mạng (đáng lẽ phải chết): hồi 100% máu và bất tử tuyệt đối 2s.' },
    buff_long: { name: 'Long Hỏa & Long Uy', icon: '🐉', color: '#ff4a2a', time: 240, desc: '+35% sát thương; mọi đòn thiêu 2.5% máu tối đa mỗi giây trong 4s, ngăn hồi máu và phá tàng hình.' },
    an_tan_the: { name: 'Ấn Tân Thế', icon: '🏛', color: '#ff6a8a', time: 120, desc: 'Tăng mạnh sát thương.' },
  };
  // ---------------- trang bị Hoàng Kim (ngoài 6 ô trang bị) ----------------
  const GOLDEN = {
    giap_hk: { name: 'Giáp Hoàng Kim', icon: '🛡', stats: { gaPct: 1, reduceAll: 0.2 }, desc: '+100% Hộ Giáp tối đa, +20% kháng mọi sát thương. Kim Thân Bất Diệt: Hộ Giáp vỡ → sóng đẩy lùi kẻ địch quanh 3 đv và miễn sát thương 1.5s (hồi 30s).',
      hooks: { onGaBreak(m, u) { if (!G.shardRdy(m, u, 'giap_hk', 30)) return; m.hitCircle(u, u.x, u.y, 3, (e) => { const v = M.dir(u, e); m.knock(u, e, v.x, v.y, 3, 0.25); }, { color: '#fff099' }); m.addStatus(u, 'invuln', 1.5, 1, { key: 'giap_hk' }); if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '✨ Kim Thân Bất Diệt', color: '#fff099' }); } } },
    kiem_hk: { name: 'Kiếm Hoàng Kim', icon: '🗡', stats: { physAmp: 0.4, asPct: 0.3, armorPen: 0.4 }, desc: '+40% Công Vật Lý, +30% tốc đánh. Kim Quang Trảm: bỏ qua 40% giáp; đòn đánh thứ 3 liên tiếp nổ kim quang lan diện rộng.',
      hooks: { onAuto(m, u, t, info) { const c = u.ws.khk && u.ws.khk.id === t.id ? u.ws.khk : (u.ws.khk = { id: t.id, n: 0 }); if (++c.n >= 3) { c.n = 0; const k = info.amt * 0.6; info.extra.push(() => m.hitCircle(u, t.x, t.y, 2.5, (e) => m.damage(u, e, k, 'phys', { tag: 'item', aoe: true }), { color: '#fff099', fx: 'boom' })); } } } },
    yniem_hk: { name: 'Ý Niệm Hoàng Kim', icon: '💠', desc: 'Mở tối đa 6 ô khảm mảnh hồn; Cộng Hưởng Ý Niệm: +30% hiệu lực mọi mảnh hồn đang gắn.' },
    shard_hk: { name: 'Mảnh Hồn Hoàng Kim', icon: '✨', desc: '+1200 máu, +25% công, +15% hút máu; hạ gục tướng: hồi ngay mọi chiêu di chuyển và 25% máu.' },
    luoi_kiem: { name: 'Lưỡi Kiếm Sắc Bén', icon: '⚔', exclusive: true, stats: { ad: 60, asPct: 0.35, armorPen: 0.3 }, cd: 120,
      desc: 'Độc quyền của Kiếm Sư Vĩ Đại: +60 SMVL, +35% tốc đánh, +30% xuyên giáp. Kích hoạt (hồi 120s): chém luồng đại kiếm khí bán nguyệt bay 15 đv xuyên mọi vật cản, sát thương cực mạnh và câm lặng 1.5s.' },
  };
  const GOLD_POOL = ['giap_hk', 'kiem_hk', 'yniem_hk', 'shard_hk'];

  // ---------------- quái nhỏ theo vùng (mỗi biome một loài) ----------------
  const SKIN = {
    0: { name: 'Sói Xám', color: '#8a8f99', ms: 3.9, hp: 0.9, hit: 'bleed' },
    1: { name: 'Ếch Độc', color: '#5aa060', hp: 0.95, hit: 'poison' },
    2: { name: 'Bọ Đá', color: '#a06048', armor: 40, hp: 1.05 },
    3: { name: 'Bù Nhìn Sống', color: '#c8b060', hit: 'slow' },
    4: { name: 'Gấu Tuyết', color: '#d8e4f0', hp: 1.3, ad: 1.1, hit: 'slow' },
    5: { name: 'Thạch Quỷ', color: '#8a8478', armor: 20, mr: 20 },
    6: { name: 'Rắn Cát', color: '#d0a868', hit: 'poison', ms: 3.6 },
    7: { name: 'Hồn Ma', color: '#9aa0d0', hit: 'drain', hp: 1.05 },
    8: { name: 'Chuột Đột Biến', color: '#90c040', boom: true, hp: 0.9 },
  };
  function skinHit(m, mon, t, info) {
    const k = mon.skin; if (!k || !t.alive) return;
    if (k.hit === 'bleed') m.dot(mon, t, 4 + m.time / 60, 3, 'phys', 'mon_bleed');
    else if (k.hit === 'poison') m.dot(mon, t, 5 + m.time / 50, 3, 'magic', 'mon_poison');
    else if (k.hit === 'slow') m.addStatus(t, 'slow', 1, 0.2, { src: mon, key: 'mon_slow' });
    else if (k.hit === 'drain') m.heal(mon, mon, info.amt * 0.5, true);
  }
  // quái tuần tra quanh ổ boss (3 con/ổ, đi vòng tròn bán kính 15)
  const GUARD = { 0: { name: 'Thạch Vệ Tân Thế', color: '#b0a890' }, 1: { name: 'Vong Hồn Hộ Mộ', color: '#9aa0d0' }, 2: { name: 'Đột Biến Thể', color: '#90c040' }, 3: { name: 'Kim Giáp Trùng', color: '#e8c050' } };

  // ---------------- định nghĩa boss ----------------
  // stats theo phút trận: hp + hpMin×phút, ad + adMin×phút. gap: khoảng nghỉ giữa 2 chiêu cảnh báo. reward(m, h, u): thưởng.
  const B = {};
  B.tan_the = { name: 'Boss Tân Thế', icon: '🏛', color: '#ff6a5a', hp: 5200, hpMin: 180, ad: 100, adMin: 5, armor: 40, mr: 40, as: 0.55, range: 2.8, r: 2.0, ms: 3.0, gap: 6, gold: 250, xp: 450, value: 1,
    skills: ['dam_dat'], reward(m, h, u) { const E = u.empowered; m.addStatus(h, 'buff', 120, 1, { key: 'an_tan_the', mods: { dmgAmp: E ? 0.4 : 0.25 }, persist: true }); m.giveSoul(h, m.rollTier(3, h.st.loot, 5), 'boss'); m.setYNiem(h, Math.min(5, (h.yNiem || 0) + 1), 'boss'); } };
  B.phuong_hoang = { name: 'Phượng Hoàng', icon: '🔥', color: '#ff8a2a', hp: 5200, hpMin: 150, ad: 85, adMin: 4.5, armor: 40, mr: 50, as: 0.6, range: 3, r: 1.9, ms: 3.4, gap: 5, gold: 400, xp: 600, value: 1.15, fly: true,
    skills: ['bao_lua', 'vu_dieu', 'mua_long'], buff: 'buff_phoenix', auto: 'phoenix' };
  B.thiet_minh = { name: 'Thiết Minh Quân', icon: '⚔', color: '#a0a0b8', hp: 5800, hpMin: 160, ad: 95, adMin: 5, armor: 55, mr: 40, as: 0.5, range: 3.5, r: 2.0, ms: 2.7, gap: 5.5, gold: 400, xp: 600, value: 1.15,
    skills: ['minh_kinh', 'thiet_xich', 'thiet_giap'], buff: 'buff_minh', auto: 'nether' };
  B.thien_hon = { name: 'Thiên Hồn Chủ', icon: '👻', color: '#a0d8ff', hp: 5000, hpMin: 150, ad: 80, adMin: 4.5, armor: 35, mr: 60, as: 0.55, range: 6, r: 1.8, ms: 3.0, gap: 5, gold: 400, xp: 600, value: 1.15, fly: true, ranged: true,
    skills: ['hon_tran', 'van_hon', 'thap_tu'], buff: 'buff_hon', auto: 'soul' };
  B.quai_thu = { name: 'Quái Thú Hoàng Kim', icon: '💰', color: '#ffd24a', hp: 9000, hpMin: 180, ad: 110, adMin: 5.5, armor: 60, mr: 50, as: 0.45, range: 3.5, r: 2.6, ms: 2.4, gap: 5.5, gold: 0, xp: 900, value: 1.8,
    skills: ['kim_giac', 'dia_chan', 'kim_sa'], auto: 'behemoth', reward(m, h) {
      m.gainGold(h, 5000); m.setBag6(h); m.bagAdd(h, 'radiant', 2); m.setYNiem(h, 6, 'Quái Thú Hoàng Kim');
      const got = m.giveGoldenRandom(h, 3);
      const rid = m.radiantShard(h); if (rid) { m.giveSoul(h, 6, 'Quái Thú Hoàng Kim', rid); got.push(rid); }   // GĐ9: + 1 mảnh Rực Rỡ hợp tướng
      m.addFeed({ type: 'treasure', hero: h, items: got });
    } };
  B.rong = { name: 'Rồng Cổ Đại', icon: '🐉', color: '#ff4a2a', hp: 10000, hpMin: 200, ad: 120, adMin: 6, armor: 60, mr: 60, as: 0.5, range: 4, r: 2.8, ms: 3.2, gap: 5, gold: 600, xp: 1000, value: 1.6, fly: true,
    skills: ['long_tuc', 'long_giang', 'thien_hoa'], buff: 'buff_long', auto: 'dragon' };
  B.kiem_su = { name: 'Kiếm Sư Vĩ Đại', icon: '⚔', color: '#e8f4ff', hp: 7000, hpMin: 160, ad: 100, adMin: 5, armor: 45, mr: 45, as: 0.9, range: 3, r: 1.2, ms: 3.7, gap: 4.5, gold: 600, xp: 900, value: 1.7,
    skills: ['nhat_kiem', 'van_kiem', 'ao_anh'], auto: 'blade', reward(m, h) {
      const got = m.giveGoldenRandom(h, 1); m.giveGolden(h, 'luoi_kiem'); m.giveSoul(h, 6, 'Kiếm Sư Vĩ Đại', 'Y_CHI'); m.setYNiem(h, 6, 'Kiếm Sư Vĩ Đại');
      const rid = m.radiantShard(h); if (rid) { m.giveSoul(h, 6, 'Kiếm Sư Vĩ Đại', rid); got.push(rid); }   // GĐ9: + 1 mảnh Rực Rỡ hợp tướng
      m.addFeed({ type: 'treasure', hero: h, items: got.concat(['luoi_kiem', 'Y_CHI']) });
    } };
  // lịch ổ boss: [ổ] → danh sách boss xoay vòng, lần đầu (giây), hồi sinh (giây)
  const LAIR_PLAN = {
    0: { list: ['tan_the'], first: 240, respawn: 300 },
    1: { list: ['thiet_minh', 'thien_hon'], first: 360, respawn: 240 },
    2: { list: ['phuong_hoang', 'kiem_su'], first: 420, respawn: 300 },
    3: { list: ['quai_thu'], first: 780, respawn: 600 },
  };

  // ---------------- kiểu đánh thường ----------------
  const AUTO = {
    phoenix(m, u, t, info) {                                  // Móng Vuốt Tro Tàn: 2 nhát + thiêu nhẹ
      info.amt *= 0.6; info.extra.push(() => { if (!t.alive) return; m.dot(u, t, u.st.ad * 0.08, 3, 'magic', 'ph_burn'); m.later(0.15, (mm) => t.alive && mm.damage(u, t, u.st.ad * 0.6, 'phys', { tag: 'boss' })); });
    },
    nether(m, u, t, info) {                                   // Trảm Ngang Ngàn Cân (bán nguyệt 4 đv) • mỗi 3 đòn: Nện Chùy khựng 0.4s
      const v = M.dir(u, t), k = info.amt * 0.8; info.extra.push(() => m.hitCone(u, u.x, u.y, v.x, v.y, 4 + u.r, 0, (e) => { if (e !== t) m.damage(u, e, k, 'phys', { tag: 'boss', aoe: true }); }, { color: '#c0c0d0', fx: 'slash' }));
      u.ws.nAuto = (u.ws.nAuto || 0) + 1;
      if (u.ws.nAuto % 3 === 0) info.extra.push(() => m.hitCircle(u, u.x, u.y, 3.5 + u.r, (e) => m.addStatus(e, 'stun', 0.4, 1, { src: u }), { color: '#8a8aa0', fx: 'quake' }));
    },
    soul(m, u, t, info) {                                     // Tia Linh Hồn: 2 quả cầu dẫn đường (phép)
      info.type = 'magic'; info.amt *= 0.7;
      info.extra.push(() => t.alive && m.proj({ owner: u, x: u.x, y: u.y, target: t, speed: 14, kind: 'orb', onHit: (mm, p, v) => mm.damage(u, v, u.st.ad * 0.7, 'magic', { tag: 'boss' }) }));
    },
    behemoth(m, u, t, info) {                                 // Vồ Tát Kim Cương: đập 3.5 đv trước mặt
      const v = M.dir(u, t), c = { x: u.x + v.x * 2.2, y: u.y + v.y * 2.2 }, k = info.amt;
      info.extra.push(() => m.hitCircle(u, c.x, c.y, 2.2, (e) => { if (e !== t) m.damage(u, e, k * 0.8, 'phys', { tag: 'boss', aoe: true }); }, { color: '#ffd24a', fx: 'quake' }));
    },
    dragon(m, u, t, info) {                                   // Vuốt Rồng Chém Gió: vệt cào 4 đv
      const v = M.dir(u, t), k = info.amt * 0.7; info.extra.push(() => m.hitLine(u, u.x, u.y, v.x, v.y, 4 + u.r, 2, (e) => { if (e !== t) m.damage(u, e, k, 'phys', { tag: 'boss', aoe: true }); }, { color: '#ff7a3a', fx: 'slash' }));
    },
    blade(m, u, t, info) {                                    // Nhị Đoạn Trảm (2 nhát) • mỗi 3 đòn: Thương Kiếm Đột Kích khựng 0.3s
      info.amt *= 0.6; u.ws.nAuto = (u.ws.nAuto || 0) + 1;
      info.extra.push(() => { m.later(0.12, (mm) => t.alive && mm.damage(u, t, u.st.ad * 0.6, 'phys', { tag: 'boss' })); if (u.ws.nAuto % 3 === 0 && t.alive) m.addStatus(t, 'stun', 0.3, 1, { src: u }); });
    },
  };
  // đòn "đặc biệt" ngoài tầm đánh / áp sát (gọi trong bossThink, có hồi riêng)
  const EXTRA = {
    phoenix(m, u, t) {                                        // Lông Vũ Bộc Phá: mục tiêu ngoài 8 đv → 3 chùm lông vũ hình nan quạt
      const d = dist(u, t); if (d < 8 || d > 14 || !G.shardRdy(m, u, 'feather', 3)) return false;
      const v = M.dir(u, t);
      for (const a of [-0.25, 0, 0.25]) { const w = rot(v, a); m.proj({ owner: u, x: u.x, y: u.y, dx: w.x, dy: w.y, speed: 18, range: 15, r: 0.6, kind: 'feather', onHit: (mm, p, e) => { mm.damage(u, e, u.st.ad * 0.9, 'magic', { tag: 'boss' }); mm.dot(u, e, u.st.ad * 0.08, 3, 'magic', 'ph_burn'); } }); }
      return true;
    },
    soul(m, u, t) {                                           // Hồn Trảo Hất Lùi: cận chiến áp sát → đẩy lùi 3 đv
      const near = heroesIn(m, u.x, u.y, u.r + 2.2); if (!near.length || !G.shardRdy(m, u, 'push', 3)) return false;
      for (const e of near) { const v = M.dir(u, e); m.knock(u, e, v.x, v.y, 3, 0.25); }
      if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: u.r + 2.2, color: '#a0d8ff' }); return true;
    },
    behemoth(m, u) {                                          // Quét Đuôi Thiết Giáp: kẻ đứng sau lưng bị hất văng
      if (!G.shardRdy(m, u, 'tail', 4)) return false;
      const back = heroesIn(m, u.x, u.y, u.r + 4).filter((e) => (e.x - u.x) * u.fx + (e.y - u.y) * u.fy < 0);
      if (!back.length) { u.scd.tail = 0; return false; }
      for (const e of back) { const v = M.dir(u, e); m.damage(u, e, u.st.ad * 0.8, 'phys', { tag: 'boss' }); m.knock(u, e, v.x, v.y, 3, 0.25); }
      return true;
    },
    dragon(m, u) {                                            // Đập Cánh Cản Phá: đẩy kẻ cận chiến ra xa 5 đv
      const near = heroesIn(m, u.x, u.y, u.r + 2.5); if (!near.length || !G.shardRdy(m, u, 'wing', 4)) return false;
      for (const e of near) { const v = M.dir(u, e); m.knock(u, e, v.x, v.y, 5, 0.3); }
      if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: u.r + 2.5, color: '#ffb07a' }); return true;
    },
  };

  // ---------------- chiêu có cảnh báo ----------------
  // mỗi chiêu: cond(m,u,t) • run(m,u,t,warn) — warn(shape, delay, fn): vẽ vùng đỏ + boss đứng niệm, hết giờ thì fn chạy
  const SK = {
    dam_dat: { name: 'Dậm Đất Tân Thế', cond: (m, u, t) => dist(u, t) < 4 + u.r, run(m, u, t, warn) {
      warn({ shape: 'circle', x: u.x, y: u.y, r: 4 }, 0.6, () => m.hitCircle(u, u.x, u.y, 4, (e) => { m.damage(u, e, u.st.ad * 1.2, 'phys', { tag: 'slam', aoe: true }); const v = M.dir(u, e); m.knock(u, e, v.x, v.y, 1.5, 0.2); }, { color: '#ffcc66', fx: 'quake' }));
    } },
    // ---- Phượng Hoàng ----
    bao_lua: { name: 'Bão Lửa Tàn Lụi', run(m, u, t, warn) {
      const v = M.dir(u, t), L = 15, x2 = u.x + v.x * L, y2 = u.y + v.y * L;
      warn({ shape: 'line', x: u.x, y: u.y, x2, y2, w: 3 }, 1.2, () => {
        m.hitLine(u, u.x, u.y, v.x, v.y, L, 3, (e) => m.damage(u, e, u.st.ad * 2.2, 'magic', { tag: 'boss', aoe: true }), { color: '#ff7a2a', fx: 'wave' });
        const x0 = u.x, y0 = u.y;   // dung nham cháy dọc dải 4s
        m.zone({ owner: u, x: (x0 + x2) / 2, y: (y0 + y2) / 2, r: L / 2, life: 4, every: 0.5, kind: 'lava', line: { x: x0, y: y0, x2, y2, w: 3 }, tick: (mm) => { for (const e of mm.heroes) if (e.alive && M.segDist(e.x, e.y, x0, y0, x2, y2) <= 1.5 + e.r) mm.damage(u, e, e.st.maxHp * 0.01, 'magic', { tag: 'dot' }); } });
      });
    } },
    vu_dieu: { name: 'Vũ Điệu Tro Tàn', cond: (m, u) => heroesIn(m, u.x, u.y, 8).length > 0, run(m, u, t, warn) {
      warn({ shape: 'circle', x: u.x, y: u.y, r: 8 }, 1.5, () => m.hitCircle(u, u.x, u.y, 8, (e) => {
        m.damage(u, e, u.st.ad * 1.8, 'magic', { tag: 'boss', aoe: true }); const v = M.dir(u, e), d = dist(u, e); m.knock(u, e, v.x, v.y, Math.max(0.5, 8.5 - d), 0.25); m.addStatus(e, 'stun', 1, 1, { src: u });
      }, { color: '#ff8a2a', fx: 'boom' }));
    } },
    mua_long: { name: 'Mưa Lông Lửa Khởi Tử', run(m, u, t, warn) {
      const n = m.rng.int(5, 7), pts = [];
      for (let i = 0; i < n; i++) { const a = m.rng.range(0, Math.PI * 2), r = m.rng.range(2, 11); const p = { x: u.home.x + M.cos(a) * r, y: u.home.y + M.sin(a) * r }; if (i < 2 && t) { p.x = t.x + m.rng.range(-1.5, 1.5); p.y = t.y + m.rng.range(-1.5, 1.5); } pts.push(p); }
      for (const p of pts) m.telegraph({ team: C.NEUTRAL, x: p.x, y: p.y, r: 2.5, life: 1.0, color: '#ff7a2a', boss: true });
      warn(null, 1.0, () => { for (const p of pts) m.hitCircle(u, p.x, p.y, 2.5, (e) => { m.damage(u, e, u.st.ad * 1.2, 'magic', { tag: 'boss', aoe: true }); m.addStatus(e, 'slow', 2, 0.5, { src: u, key: 'ph_slow' }); }, { color: '#ff7a2a', fx: 'boom' }); });
    } },
    // ---- Thiết Minh Quân ----
    minh_kinh: { name: 'Minh Kình Phách Địa', cond: (m, u, t) => dist(u, t) < 7 + u.r, run(m, u, t, warn) {
      const v = M.dir(u, t), R = 6 + u.r, c = Math.cos(Math.PI / 4);
      warn({ shape: 'cone', x: u.x, y: u.y, dx: v.x, dy: v.y, r: R, c }, 1.2, () => m.hitCone(u, u.x, u.y, v.x, v.y, R, c, (e) => {
        if (e.ga > 0) e.ga *= 0.5; m.damage(u, e, u.st.ad * 2.6, 'phys', { tag: 'boss', aoe: true }); m.knockup(u, e, 1.25);
      }, { color: '#c0c0d0', fx: 'slash' }));
    } },
    thiet_xich: { name: 'Thiết Xích Đoạt Mệnh', run(m, u, t, warn) {
      let far = null, fd = 0; for (const e of heroesIn(m, u.x, u.y, 16)) { const d = dist(u, e); if (d > fd) { fd = d; far = e; } }
      if (!far) return false;
      const v = M.dir(u, far), x2 = u.x + v.x * 16, y2 = u.y + v.y * 16;
      warn({ shape: 'line', x: u.x, y: u.y, x2, y2, w: 1.2 }, 1.0, () => {
        const hit = m.hitLine(u, u.x, u.y, v.x, v.y, 16, 1.2, () => {}, { first: 1, color: '#a0a0b8' });
        for (const e of hit) { const d = dist(u, e) - u.r - e.r - 0.5, w = M.dir(e, u); if (d > 0.2) m.knock(u, e, w.x, w.y, d, 0.3); m.later(0.32, (mm) => { if (!e.alive) return; mm.damage(u, e, u.st.ad * 1.4, 'phys', { tag: 'boss' }); mm.addStatus(e, 'stun', 1.5, 1, { src: u }); }); }
      });
    } },
    thiet_giap: { name: 'Thiết Giáp Bão Tố', cond: (m, u) => heroesIn(m, u.x, u.y, 6).length > 0, run(m, u, t, warn) {
      warn({ shape: 'circle', x: u.x, y: u.y, r: 5 }, 0.8, () => {
        for (let i = 0; i < 3; i++) m.later(i * 0.4, (mm) => { if (!u.alive) return; mm.hitCircle(u, u.x, u.y, 5 + u.r * 0.5, (e) => { const w = M.dir(e, u); mm.knock(u, e, w.x, w.y, 0.8, 0.15); mm.damage(u, e, u.st.ad * 0.5, 'true', { tag: 'boss', aoe: true }); }, { color: '#c0c0d0', fx: 'whirl' }); });
      });
    } },
    // ---- Thiên Hồn Chủ ----
    hon_tran: { name: 'Hồn Trận Hút Sinh Mệnh', run(m, u, t, warn) {
      warn({ shape: 'ring', x: u.x, y: u.y, r0: 3, r: 10 }, 1.8, () => m.hitRing(u, u.x, u.y, 3, 10, (e) => { const d = m.damage(u, e, u.st.ad * 3, 'magic', { tag: 'boss', aoe: true }); m.heal(u, u, d * 0.5, true); }, { color: '#a0d8ff' }));
    } },
    van_hon: { name: 'Vạn Hồn Thiên Giáng', run(m, u, t, warn) {
      const tg = heroesIn(m, u.x, u.y, 16).slice(0, 3); if (!tg.length) return false;
      // 1.2s vòng đỏ bám theo người, rồi dừng lại cố định 0.6s → sét giáng
      for (let k = 0; k < 6; k++) m.later(k * 0.2, (mm) => { if (u.alive) for (const e of tg) if (e.alive) mm.telegraph({ team: C.NEUTRAL, x: e.x, y: e.y, r: 2, life: 0.25, color: '#a0d8ff', boss: true }); });
      warn(null, 1.2, () => {
        const pts = tg.filter((e) => e.alive).map((e) => ({ x: e.x, y: e.y }));
        for (const p of pts) m.telegraph({ team: C.NEUTRAL, x: p.x, y: p.y, r: 2, life: 0.6, color: '#d0f0ff', boss: true });
        m.later(0.6, (mm) => { for (const p of pts) mm.hitCircle(u, p.x, p.y, 2, (e) => { mm.damage(u, e, u.st.ad * 1.6, 'magic', { tag: 'boss', aoe: true }); mm.addStatus(e, 'nodash', 2, 1, { src: u }); }, { color: '#d0f0ff', fx: 'boom' }); });
      });
    } },
    thap_tu: { name: 'Thập Tự Đoạt Hồn', cond: (m, u) => heroesIn(m, u.x, u.y, 12).length > 0, run(m, u, t, warn) {
      const L = 12, W = 1.6, a0 = m.rng.range(0, Math.PI / 2), dir = m.rng.next() < 0.5 ? 1 : -1, hitSet = new Set();
      const lines = (a) => [0, 1, 2, 3].map((i) => { const b = a + i * Math.PI / 2; return { x2: u.x + Math.cos(b) * L, y2: u.y + Math.sin(b) * L, dx: Math.cos(b), dy: Math.sin(b) }; });
      for (const l of lines(a0)) m.telegraph({ team: C.NEUTRAL, shape: 'line', x: u.x, y: u.y, x2: l.x2, y2: l.y2, w: W, life: 1.0, color: '#a0d8ff', boss: true });
      warn(null, 1.0, () => {
        for (let k = 0; k <= 6; k++) m.later(k * 0.25, (mm) => {
          if (!u.alive) return;
          const a = a0 + dir * (Math.PI / 2) * (k / 6);
          for (const l of lines(a)) {
            mm.telegraph({ team: C.NEUTRAL, shape: 'line', x: u.x, y: u.y, x2: u.x + Math.cos(a + 0.26 * dir) * L, y2: u.y + Math.sin(a + 0.26 * dir) * L, w: W, life: 0.3, color: '#a0d8ff', boss: true });
            mm.hitLine(u, u.x, u.y, l.dx, l.dy, L, W, (e) => { mm.damage(u, e, u.st.ad * 0.5, 'magic', { tag: 'boss', aoe: true }); if (!hitSet.has(e.id)) { hitSet.add(e.id); mm.addStatus(e, 'stun', 1, 1, { src: u }); } }, { color: '#a0d8ff', noFx: k % 2 === 1 });
          }
        });
      });
    } },
    // ---- Quái Thú Hoàng Kim ----
    kim_giac: { name: 'Kim Giác Húc', run(m, u, t, warn) {
      const v = M.dir(u, t), L = 14, x2 = u.x + v.x * L, y2 = u.y + v.y * L;
      warn({ shape: 'line', x: u.x, y: u.y, x2, y2, w: 3.5 }, 1.2, () => {
        const hit = new Set(); const p = { x: x2, y: y2 }; MAP.pushOut(p, u.r);
        m.dashTo(u, p.x, p.y, 26, { onContact: (mm, uu, e) => { if (hit.has(e.id) || e.kind !== 'hero') return; hit.add(e.id); mm.damage(u, e, u.st.ad * 2.4, 'phys', { tag: 'boss' }); mm.knockup(u, e, 1.5); } });
        m.hitLine(u, u.x, u.y, v.x, v.y, L, 3.5, (e) => { if (hit.has(e.id)) return; hit.add(e.id); m.damage(u, e, u.st.ad * 2.4, 'phys', { tag: 'boss', aoe: true }); m.knockup(u, e, 1.5); }, { color: '#ffd24a', fx: 'quake' });
      });
    } },
    dia_chan: { name: 'Địa Chấn Hoàng Kim', cond: (m, u) => heroesIn(m, u.x, u.y, 9).length > 0, run(m, u, t, warn) {
      m.telegraph({ team: C.NEUTRAL, shape: 'ring', x: u.x, y: u.y, r0: 5, r: 9, life: 1.9, color: '#ffb84a', boss: true });
      warn({ shape: 'circle', x: u.x, y: u.y, r: 5 }, 1.5, () => {
        m.hitCircle(u, u.x, u.y, 5, (e) => { m.damage(u, e, u.st.ad * 1.5, 'phys', { tag: 'boss', aoe: true }); m.addStatus(e, 'stun', 1, 1, { src: u }); }, { color: '#ffd24a', fx: 'quake' });
        m.later(0.4, (mm) => mm.hitRing(u, u.x, u.y, 5, 9, (e) => { if (e.ga > 0) e.ga *= 0.6; mm.damage(u, e, u.st.ad * 1.0, 'phys', { tag: 'boss', aoe: true }); }, { color: '#ffb84a' }));
      });
    } },
    kim_sa: { name: 'Mưa Kim Sa Bộc Phá', run(m, u, t, warn) {
      const pts = []; for (let i = 0; i < 6; i++) { const a = m.rng.range(0, Math.PI * 2), r = m.rng.range(2.5, 10); pts.push(i < 2 && t ? { x: t.x + m.rng.range(-2, 2), y: t.y + m.rng.range(-2, 2) } : { x: u.x + M.cos(a) * r, y: u.y + M.sin(a) * r }); }
      for (const p of pts) m.telegraph({ team: C.NEUTRAL, x: p.x, y: p.y, r: 3, life: 1.0, color: '#ffd24a', boss: true });
      warn(null, 1.0, () => { for (const p of pts) { m.hitCircle(u, p.x, p.y, 3, (e) => m.damage(u, e, u.st.ad * 1.1, 'phys', { tag: 'boss', aoe: true }), { color: '#ffd24a', fx: 'boom' }); m.zone({ owner: u, x: p.x, y: p.y, r: 3, life: 3, every: 0.25, kind: 'goldsand', tick: (mm, z) => { for (const e of mm.heroes) if (e.alive && dist(e, z) < z.r + e.r) mm.addStatus(e, 'slow', 0.4, 0.6, { src: u, key: 'kimsa' }); } }); } });
    } },
    // ---- Rồng ----
    long_tuc: { name: 'Long Tức Nguyên Thủy', cond: (m, u, t) => dist(u, t) < 13, run(m, u, t, warn) {
      const v = M.dir(u, t), R = 12, c = Math.cos(Math.PI / 3);
      warn({ shape: 'cone', x: u.x, y: u.y, dx: v.x, dy: v.y, r: R, c }, 1.5, () => {
        m.hitCone(u, u.x, u.y, v.x, v.y, R, c, (e) => m.damage(u, e, u.st.ad * 2.5, 'magic', { tag: 'boss', aoe: true }), { color: '#ff4a2a', fx: 'flame' });
        for (const k of [0.35, 0.65, 0.9]) { const p = { x: u.x + v.x * R * k, y: u.y + v.y * R * k }; m.zone({ owner: u, x: p.x, y: p.y, r: 2.4 + k * 2, life: 5, every: 0.5, kind: 'lava', tick: (mm, z) => { for (const e of mm.heroes) if (e.alive && dist(e, z) < z.r + e.r) mm.damage(u, e, e.st.maxHp * 0.012, 'magic', { tag: 'dot' }); } }); }
      });
    } },
    long_giang: { name: 'Long Giáng Trảm Địa', run(m, u, t, warn) {
      const p = { x: t.x, y: t.y };
      m.addStatus(u, 'untarget', 1.8, 1, { key: 'rong_bay' }); m.addStatus(u, 'invuln', 1.8, 1, { key: 'rong_bay_i' });
      warn({ shape: 'circle', x: p.x, y: p.y, r: 10 }, 1.8, () => {
        m.blink(u, p.x, p.y);
        m.hitCircle(u, p.x, p.y, 10, (e) => { m.damage(u, e, u.st.ad * 3, 'magic', { tag: 'boss', aoe: true }); m.addStatus(e, 'stun', 1.5, 1, { src: u }); }, { color: '#ff4a2a', fx: 'boom' });
      });
    } },
    thien_hoa: { name: 'Thiên Hỏa Truy Kích', run(m, u, t, warn) {
      // nhắm kẻ gây nhiều sát thương nhất lên Rồng
      let tg = t, best = 0; if (u.threat) for (const [id, v] of u.threat) { const h = m.heroById(id); if (h && h.alive && v > best && dist(h, u) < 20) { best = v; tg = h; } }
      if (!tg) return false;
      for (let k = 0; k < 5; k++) m.later(k * 0.2, (mm) => tg.alive && mm.telegraph({ team: C.NEUTRAL, x: tg.x, y: tg.y, r: 2.2, life: 0.25, color: '#ff7a2a', boss: true }));
      warn(null, 1.0, () => {
        for (let k = 0; k < 3; k++) m.later(k * 0.4, (mm) => { if (!u.alive || !tg.alive) return; const p = { x: tg.x, y: tg.y }; mm.telegraph({ team: C.NEUTRAL, x: p.x, y: p.y, r: 2.2, life: 0.35, color: '#ff4a2a', boss: true }); mm.later(0.35, (m3) => m3.hitCircle(u, p.x, p.y, 2.2, (e) => m3.damage(u, e, u.st.ad * 1.2, 'magic', { tag: 'boss', aoe: true }), { color: '#ff4a2a', fx: 'firering' })); });
      });
    } },
    // ---- Kiếm Sư Vĩ Đại ----
    nhat_kiem: { name: 'Nhất Kiếm Đoạt Mệnh', run(m, u, t, warn) {
      const v = M.dir(u, t), L = 16, x2 = u.x + v.x * L, y2 = u.y + v.y * L;
      warn({ shape: 'line', x: u.x, y: u.y, x2, y2, w: 1.4 }, 0.8, () => {
        m.hitLine(u, u.x, u.y, v.x, v.y, L, 1.4, (e) => m.damage(u, e, u.st.ad * 2.2 * C.CRIT_MULT, 'true', { tag: 'boss', crit: true }), { color: '#e8f4ff', fx: 'thrust' });
        const p = { x: x2, y: y2 }; MAP.pushOut(p, u.r); m.blink(u, p.x, p.y);
      });
    } },
    van_kiem: { name: 'Vạn Kiếm Quy Tông', cond: (m, u) => heroesIn(m, u.x, u.y, 6).length > 0, run(m, u, t, warn) {
      warn({ shape: 'circle', x: u.x, y: u.y, r: 6 }, 1.2, () => m.hitCircle(u, u.x, u.y, 6, (e) => { m.damage(u, e, u.st.ad * 2, 'phys', { tag: 'boss', aoe: true }); m.knockup(u, e, 1); m.addStatus(e, 'nodash', 3, 1, { src: u }); }, { color: '#e8f4ff', fx: 'whirl' }));
    } },
    ao_anh: { name: 'Ảo Ảnh Tam Kiếm', run(m, u, t, warn) {
      const c = { x: t.x, y: t.y }, R = 5.8, a0 = m.rng.range(0, Math.PI * 2);
      const P = [0, 1, 2].map((i) => ({ x: c.x + M.cos(a0 + i * 2.094) * R, y: c.y + M.sin(a0 + i * 2.094) * R }));
      for (let i = 0; i < 3; i++) m.telegraph({ team: C.NEUTRAL, shape: 'line', x: P[i].x, y: P[i].y, x2: P[(i + 1) % 3].x, y2: P[(i + 1) % 3].y, w: 1.6, life: 1.0, color: '#e8f4ff', boss: true });
      m.telegraph({ team: C.NEUTRAL, x: c.x, y: c.y, r: 3, life: 1.35, color: '#ffffff', boss: true });
      warn(null, 1.0, () => {
        for (let i = 0; i < 3; i++) { const A = P[i], Bp = P[(i + 1) % 3], v = M.dir(A, Bp); m.hitLine(u, A.x, A.y, v.x, v.y, dist(A, Bp), 1.6, (e) => m.damage(u, e, u.st.ad * 1.5, 'phys', { tag: 'boss', aoe: true }), { color: '#e8f4ff', fx: 'thrust' }); }
        m.later(0.35, (mm) => mm.hitCircle(u, c.x, c.y, 3, (e) => mm.damage(u, e, u.st.ad * 2.5, 'phys', { tag: 'boss', aoe: true }), { color: '#ffffff', fx: 'boom' }));
      });
    } },
  };

  const BossMix = {
    // ---------- dựng ----------
    setupBosses() {
      this.lairSt = MAP.lairs.map((L) => ({ lair: L, unit: null, i: 0, nextAt: LAIR_PLAN[L.id].first, warned: false, kills: 0, last: null, guards: [] }));
      this.bossSt = { kills: 0, empowered: false, unit: null };     // tương thích (giao diện / báo cáo cũ)
      this.hazardT = 30; this.ventT = 20;
      // quái tuần tra: 3 con mỗi ổ, hồi sinh 120s
      for (const S of this.lairSt) for (let k = 0; k < 3; k++) S.guards.push({ k, unit: null, nextAt: 60 + k * 5 });
    },
    bossDefOf(id) { return B[id]; },
    // ---------- cập nhật mỗi bước ----------
    updateBosses(dt) {
      const t = this.time, phase = this.zoneSt ? this.zoneSt.started : 0;
      for (const S of this.lairSt) {
        const L = S.lair, P = LAIR_PLAN[L.id];
        if (S.unit && !S.unit.alive) { S.unit = null; S.nextAt = t + P.respawn; S.warned = false; }
        // từ bo 4: Ổ Tân Thế đổi sang Rồng Cổ Đại (còn Tân Thế thì nó bay đi, Rồng hạ cánh)
        if (L.id === 0 && phase >= 4 && !this.bossSt.empowered) {
          this.bossSt.empowered = true;
          if (S.unit && S.unit.bossId === 'tan_the') { S.unit.alive = false; S.unit.hp = 0; S.unit = null; }
          S.nextAt = Math.min(S.nextAt, t + 20); S.forceId = 'rong'; S.warned = false;
          this.addFeed({ type: 'boss_power' });
        }
        const id = S.forceId || P.list[S.i % P.list.length];
        if (!S.unit && !S.warned && t >= S.nextAt - 20) { S.warned = true; this.addFeed({ type: 'boss_warn', at: S.nextAt, boss: id, lair: L.id }); }
        if (!S.unit && t >= S.nextAt) {
          // Rồng Cổ Đại bay lượn đảo quanh TÂM VÒNG BO: hạ cánh ở tâm bo hiện tại (mọi người đều ở gần)
          let LL = L;
          if (id === 'rong') { const z = this.safeCircle(), p = { x: z.x, y: z.y }; MAP.pushOut(p, 3); for (let k = 0; k < 8 && MAP.inWall(p.x, p.y, 4); k++) { p.x += 3; MAP.pushOut(p, 3); } LL = Object.assign({}, L, { x: p.x, y: p.y, name: 'Tâm Bão' }); }
          else if (this.zoneSt && !this.inZone(L, -L.r)) { S.nextAt = t + 30; continue; }   // ổ ngoài bo: boss không ra
          S.unit = this.spawnBoss(id, LL); S.i++;
          if (L.id === 0) this.bossSt.unit = S.unit;
          this.addFeed({ type: 'boss_up', boss: id, lair: L.id, empowered: id === 'rong' });
        }
        // quái tuần tra
        for (const g of S.guards) {
          if (g.unit && !g.unit.alive) { g.unit = null; g.nextAt = t + 120; }
          if (!g.unit && t >= g.nextAt) g.unit = this.spawnGuard(S, g.k);
        }
      }
      if (this.lairSt[0]) this.bossSt.unit = this.lairSt[0].unit;
      this.updateHazards();
    },
    spawnBoss(id, L) {
      const D = B[id];
      const u = this.spawnMonster('boss', D, L.x, L.y, { boss: true, big: true, bossId: id, bossDef: D, lair: L, name: D.name, fly: !!D.fly });
      u.threat = new Map(); u.skillT = this.time + 2.5; u.scd = {}; u.ws = {}; u.color = D.color; u.ranged = !!D.ranged; u.projSpeed = 14;
      u.base.tenacity = 0; u.bonus = { tenacity: 0.5 }; u.calc(); u.hp = u.st.maxHp;
      if (D.auto && AUTO[D.auto]) u.onAuto = AUTO[D.auto];
      if (this.fxOn) this.fx({ type: 'ring', x: L.x, y: L.y, r: L.r, color: D.color });
      return u;
    },
    spawnGuard(S, k) {
      const L = S.lair, GD = GUARD[L.id], ang = k * 2.094, R = L.r + 9;
      const def = Object.assign({}, C.CAMP.gold, { name: GD.name, hp: 650, hpMin: 80, ad: 20, adMin: 3 });
      const x = L.x + M.cos(ang) * R, y = L.y + M.sin(ang) * R, p = { x, y }; MAP.pushOut(p, 1);
      const u = this.spawnMonster('guard', def, p.x, p.y, { guard: true, name: GD.name, color: GD.color, patrol: { cx: L.x, cy: L.y, r: R, a: ang, spd: 0.12 } });
      return u;
    },
    // ---------- AI boss ----------
    // bảng thù hận: sát thương gần đây (giảm dần); đổi mục tiêu khi kẻ khác vượt 30%
    bossHit(u, owner, amt) {
      if (!owner || owner.team === C.NEUTRAL) return;
      const h = owner.kind === 'hero' ? owner : owner.owner && owner.owner.kind === 'hero' ? owner.owner : null;
      if (!h) return;
      u.threat.set(h.id, (u.threat.get(h.id) || 0) + amt);
      // thông báo cả bản đồ khi có người bắt đầu đánh boss (sau 30s yên ắng)
      if (this.time - (u.lastHeroT || -99) > 30) { this.addFeed({ type: 'boss_hit', boss: u.bossId, hero: h, lair: u.lair.id }); u.engagedT = this.time; }
      u.lastHeroT = this.time; u.lastHero = h;
    },
    bossThink(u) {
      const t = this.time, D = u.bossDef;
      if (u.thinkT > t) return;
      u.thinkT = t + 0.2;
      for (const [id, v] of u.threat) { const nv = v * 0.96; if (nv < 1) u.threat.delete(id); else u.threat.set(id, nv); }
      const leash = C.LEASH + u.r + 5, home = u.home;
      let best = null, bv = 0;
      for (const [id, v] of u.threat) { const h = this.heroById(id); if (!h || !h.alive || !h.targetable || dist(h, home) > leash + 3) continue; if (v > bv) { bv = v; best = h; } }
      const a = u.aggro && u.aggro.alive && u.aggro.targetable && dist(u.aggro, home) <= leash + 3 ? u.aggro : null;
      if (best && (!a || (a !== best && bv > (u.threat.get(a.id) || 0) * 1.3))) u.aggro = best; else if (!a) u.aggro = best;
      const ag = u.aggro;
      if (!ag || t - u.lastHitT > 8) {
        u.aggro = null; u.attackTarget = null;
        const far = dist(u, home); u.goal = far > 0.4 ? { x: home.x, y: home.y } : null; u.resetting = far > 0.4;
        if (u.hp < u.st.maxHp && t - u.lastHitT > 10) u.hp = Math.min(u.st.maxHp, u.hp + u.st.maxHp * 0.004);   // yên 10s mới hồi chậm 2%/s
        if (u.ga) u.ga = 0;
        return;
      }
      u.resetting = false; u.attackTarget = ag; u.goal = null;
      if (u.cast) return;
      // đòn đặc biệt (lông vũ xa, đẩy lùi kẻ áp sát, quét đuôi)
      if (D.auto && EXTRA[D.auto] && EXTRA[D.auto](this, u, ag)) return;
      if (t < u.skillT) return;
      // chọn chiêu cảnh báo: không lặp lại chiêu vừa dùng nếu còn chiêu khác hợp lệ
      const opts = D.skills.filter((k) => SK[k] && (!SK[k].cond || SK[k].cond(this, u, ag)));
      if (!opts.length) { u.skillT = t + 1; return; }
      const pool = opts.length > 1 ? opts.filter((k) => k !== u.lastSkill) : opts;
      const k = pool[this.rng.int(0, pool.length - 1)];
      const warn = (shape, delay, fn) => {
        if (shape) this.telegraph(Object.assign({ team: C.NEUTRAL, life: delay, color: D.color, boss: true }, shape));
        u.cast = { key: 'boss', t: delay, total: delay, unstop: true, fire: (m) => { if (u.alive) m.hook(fn, m); } };
        u.attackTarget = null; u.windup = null;
      };
      const ok = SK[k].run(this, u, ag, warn);
      u.lastSkill = k; u.skillT = t + (ok === false ? 1 : D.gap * this.rng.range(0.85, 1.2));
      if (ok !== false && this.fxOn && SK[k].name) this.fx({ type: 'callout', id: u.id, text: '⚠ ' + SK[k].name, color: D.color });
    },
    // quái tuần tra: không có mục tiêu thì đi vòng quanh ổ boss
    patrolStep(u) {
      const P = u.patrol; if (!P) return;
      P.a += P.spd; const p = { x: P.cx + M.cos(P.a) * P.r, y: P.cy + M.sin(P.a) * P.r }; MAP.pushOut(p, 1);
      u.home = p;
    },
    // ---------- boss bị hạ ----------
    bossDeath(u, hero) {
      const D = u.bossDef;
      this.bossSt.kills++;
      const S = this.lairSt.find((x) => x.unit === u); if (S) { S.kills++; S.last = hero ? hero.id : null; }
      if (hero) {
        if (D.gold) this.gainGold(hero, D.gold);
        this.gainXP(hero, D.xp);
        hero.stats.boss = (hero.stats.boss || 0) + 1;
        if (D.buff) this.giveBossBuff(hero, D.buff);
        if (D.reward) this.hook(D.reward, this, hero, u);
        else if (D.buff) this.giveSoul(hero, this.rollTier(3, hero.st.loot, 5), 'boss');
      }
      this.addFeed({ type: 'boss_kill', hero, boss: u.bossId, lair: u.lair.id, empowered: u.bossId === 'rong' });
      if (this.fxOn) this.fx({ type: 'boom', x: u.x, y: u.y, big: true });
    },
    giveBossBuff(h, key) {
      const Bf = BUFFS[key]; if (!Bf) return;
      const mods = key === 'buff_long' ? { dmgAmp: 0.35 } : {};
      this.addStatus(h, 'buff', Bf.time, 1, { key, mods, persist: true });
      if (this.fxOn) this.fx({ type: 'aura', id: h.id, color: Bf.color, life: 2 });
    },
    // ---------- bùa lợi: hiệu ứng (gọi từ lõi trận) ----------
    // trước khi chết: Hồn Thần Bất Diệt / Ấn Niết Bàn → sống lại tại chỗ
    bossBuffSave(u) {
      if (!u.statuses.length) return false;
      if (u.hasKey('buff_hon')) {
        this.removeStatus(u, 'buff', 'buff_hon'); u.hp = u.st.maxHp;
        this.addStatus(u, 'invuln', 2, 1, { key: 'hon_than' }); this.addStatus(u, 'unstop', 2, 1, { key: 'hon_than_u' });
        this.addFeed({ type: 'buff_save', hero: u, buff: 'buff_hon' }); if (this.fxOn) this.fx({ type: 'callout', id: u.id, text: '👻 HỒN THẦN BẤT DIỆT', color: '#b0e0ff' });
        return true;
      }
      if (u.hasKey('buff_phoenix')) {
        this.removeStatus(u, 'buff', 'buff_phoenix'); u.hp = u.st.maxHp; u.ga = u.st.maxGa;
        this.addStatus(u, 'invuln', 1.5, 1, { key: 'niet_ban' });
        this.addFeed({ type: 'buff_save', hero: u, buff: 'buff_phoenix' }); if (this.fxOn) { this.fx({ type: 'callout', id: u.id, text: '🔥 ẤN NIẾT BÀN — hồi sinh', color: '#ff8a2a' }); this.fx({ type: 'boom', x: u.x, y: u.y, big: true }); }
        return true;
      }
      return false;
    },
    // kết liễu khi có Minh Tướng Huyết Trảm: hồi đầy máu + Giáp Ảo 50% máu 15s
    bossBuffKill(k) {
      if (k && k.alive && k.statuses.length && k.hasKey('buff_minh')) { this.heal(k, k, k.st.maxHp); this.shield(k, k, k.st.maxHp * 0.5, 15); if (this.fxOn) this.fx({ type: 'callout', id: k.id, text: '⚔ Minh Tướng Huyết Trảm', color: '#d0d0e0' }); }
    },
    // Long Hỏa: mọi đòn thiêu 2.5% máu tối đa/giây 4s, ngăn hồi máu, phá tàng hình
    dragonBurn(owner, tgt) {
      if (!tgt.alive || (tgt.kind !== 'hero' && tgt.kind !== 'pet')) return;
      this.dot(owner, tgt, tgt.st.maxHp * 0.025, 4, 'magic', 'long_hoa');
      this.addStatus(tgt, 'wound', 4, 1, { src: owner });
      if (tgt.kind === 'hero') { this.removeStatus(tgt, 'stealth'); tgt.revealedT = Math.max(tgt.revealedT || 0, this.time + 4); }
    },
    // ---------- trang bị Hoàng Kim ----------
    setBag6(u) { if (u.bag && u.bag.lv < 6) { u.bag.lv = 6; if (this.fxOn) this.fx({ type: 'ring', x: u.x, y: u.y, r: 2, color: '#fff099' }); } },
    giveGolden(u, id) {
      if (!GOLDEN[id] || !u) return false;
      if (id === 'yniem_hk') { if ((u.yNiem || 0) >= 6 && u.goldenYn) return false; u.goldenYn = true; this.setYNiem(u, 6, 'Ý Niệm Hoàng Kim'); return true; }
      if (id === 'shard_hk') { if ((u.souls || []).some((s) => s.id === 'HOANG_KIM')) return false; return this.giveSoul(u, 6, 'Quái Thú Hoàng Kim', 'HOANG_KIM'); }
      if ((u.golden || (u.golden = [])).includes(id)) return false;
      u.golden.push(id); this.recalcItems(u);
      return true;
    },
    // n món Hoàng Kim ngẫu nhiên (khác nhau, chưa có); hết món thì đổi ra vàng
    giveGoldenRandom(u, n) {
      const got = [], pool = GOLD_POOL.filter((id) => id === 'yniem_hk' ? !u.goldenYn : id === 'shard_hk' ? !(u.souls || []).some((s) => s.id === 'HOANG_KIM') : !(u.golden || []).includes(id));
      for (let i = 0; i < n; i++) {
        if (!pool.length) { this.gainGold(u, 1500); continue; }
        const id = pool.splice(this.rng.int(0, pool.length - 1), 1)[0];
        if (this.giveGolden(u, id)) got.push(id);
      }
      return got;
    },
    // Lưỡi Kiếm Sắc Bén: chém đại kiếm khí bán nguyệt 15 đv xuyên vật cản (AI gọi)
    useBlade(u, t) {
      if (!(u.golden || []).includes('luoi_kiem') || (u.icd.luoi_kiem || 0) > this.time || u.cast || u.dash || u.disabled || !t) return false;
      u.icd.luoi_kiem = this.time + GOLDEN.luoi_kiem.cd;
      const v = M.dir(u, t);
      this.proj({ owner: u, x: u.x, y: u.y, dx: v.x, dy: v.y, speed: 26, range: 15, r: 1.6, kind: 'wave', pierce: true, ghost: true, passWall: true,
        onHit: (m, p, e) => { m.damage(u, e, H_amt(u), 'phys', { tag: 'item' }); m.addStatus(e, 'silence', 1.5, 1, { src: u }); } });
      if (this.fxOn) this.fx({ type: 'callout', id: u.id, text: '⚔ Lưỡi Kiếm Sắc Bén', color: '#fff099' });
      return true;
    },
    // ---------- nguy hiểm môi trường của 2 vùng đặc biệt ----------
    updateHazards() {
      const t = this.time;
      // Vùng Tử Khí: mỗi ~14s một đám mây tử khí ập xuống gần một tướng đang ở trong vùng (báo trước 1.5s): rút 1.5% máu/s + vết thương sâu
      if (t >= this.hazardT) {
        this.hazardT = t + 14;
        const R = MAP.REGIONS.find((r) => r.bio === 7);
        const inside = R ? this.heroes.filter((h) => h.alive && MAP.regionAt(h.x, h.y) === R) : [];
        if (inside.length) {
          const h = inside[this.rng.int(0, inside.length - 1)], p = { x: h.x + this.rng.range(-3, 3), y: h.y + this.rng.range(-3, 3) };
          this.telegraph({ team: C.NEUTRAL, x: p.x, y: p.y, r: 5, life: 1.5, color: '#9a8ab0' });
          this.later(1.5, (m) => m.zone({ owner: NEU, x: p.x, y: p.y, r: 5, life: 6, every: 0.5, kind: 'miasma', tick: (mm, z) => { for (const e of mm.heroes) if (e.alive && dist(e, z) < z.r + e.r) { mm.damage(null, e, e.st.maxHp * 0.0075, 'true', { tag: 'hazard', noHook: true }); mm.addStatus(e, 'wound', 0.6, 1, { key: 'miasma' }); } } }));
        }
      }
      // Trạm Khí Độc: mỗi ~10s một ống xả / bồn khí phun độc (báo trước 1.2s): độc 2% máu/s 3s + chậm 20%
      if (t >= this.ventT && MAP.vents.length) {
        this.ventT = t + 10;
        const near = MAP.vents.filter((v) => this.heroes.some((h) => h.alive && dist(h, v) < 30));
        if (near.length) {
          const v = near[this.rng.int(0, near.length - 1)];
          this.telegraph({ team: C.NEUTRAL, x: v.x, y: v.y, r: v.r, life: 1.2, color: '#9ad040' });
          this.later(1.2, (m) => m.hitCircle(NEU, v.x, v.y, v.r, (e) => { if (e.kind !== 'hero' && e.kind !== 'pet') return; m.dot(null, e, e.st.maxHp * 0.02, 3, 'true', 'vent_poison'); m.addStatus(e, 'slow', 3, 0.2, { key: 'vent_slow' }); }, { color: '#9ad040', fx: 'boom' }));
        }
      }
    },
    // thùng độc nổ: để lại mây độc 5s
    toxicCloud(x, y, by) {
      this.zone({ owner: NEU, x, y, r: 3.5, life: 5, every: 0.5, kind: 'poison', tick: (m, z) => { for (const e of m.heroes) if (e.alive && dist(e, z) < z.r + e.r) m.damage(by && by.alive ? by : null, e, e.st.maxHp * 0.01, 'true', { tag: 'hazard', noHook: true }); } });
    },
  };
  const H_amt = (u) => 250 + 15 * u.level + 1.5 * u.st.ad;
  G.BossMix = BossMix; G.BOSSES = B; G.BOSS_SK = SK; G.BOSS_BUFFS = BUFFS; G.GOLDEN = GOLDEN; G.MON_SKIN = SKIN; G.LAIR_PLAN = LAIR_PLAN; G.skinHit = skinHit;
})();
