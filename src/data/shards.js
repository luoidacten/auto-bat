'use strict';
// ===== GĐ8: CƠ SỞ DỮ LIỆU MẢNH HỒN — 9 chỉ số cốt lõi, 6 bậc, Hộ Giáp / Xuyên Thủng =====
// 9 chỉ số cốt lõi: Máu tối đa (hp, điểm phẳng) • Hộ Giáp (ga: thanh giáp phụ, gánh sát thương trước máu)
//   • Công Vật Lý (phys: % sát thương vật lý) • Công Phép (mag: SMPT điểm phẳng) • Tốc Chạy (ms: %) • Hồi Chiêu (cdr: %, trần 40%)
//   • Hút Máu (ls: % mọi sát thương gây ra) • Kháng Hiệu Ứng (ten: %, trần 60%) • May Mắn (crit: % chí mạng + loot: % đồ hiếm)
// Phụ: Xuyên Thủng (byp: % sát thương đi thẳng vào máu, bỏ qua Hộ Giáp) • Chống Xuyên (anti: trừ thẳng vào xuyên thủng của kẻ đánh).
// 6 bậc: Trắng 1 ô Ý Niệm • Xanh 2 • Tím 3 • Vàng 4 • Đỏ 5 • Hoàng Kim / Rực Rỡ 6 (chỉ từ boss). Mảnh bậc K cần Ý Niệm ≥ K;
// số mảnh gắn được = cấp Ý Niệm (còn lại cất trong túi hồn, không có tác dụng).
// Mỗi mảnh: { id, t (bậc), n (tên), st (chỉ số), p (nội tại: các hook như trang bị — onAuto/onDeal/afterDeal/onTake/afterTake/tick/onKill
//   /onMonsterKill/onFatal/onBlock/onGaBreak/onCastStart/onHardCC/onDrink), d (mô tả nội tại), perk (đặc năng GĐ7b), boss (chỉ rơi từ boss) }
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const M = G.M;
  const SOUL_TIER = [null,
    { name: 'Trắng', color: '#eef2f8', slots: 1, pow: 1.0 }, { name: 'Xanh', color: '#2f8cff', slots: 2, pow: 1.5 },
    { name: 'Tím', color: '#9a4dff', slots: 3, pow: 2.2 }, { name: 'Vàng', color: '#ffd21a', slots: 4, pow: 3.2 },
    { name: 'Đỏ', color: '#ff2e2e', slots: 5, pow: 4.5 }, { name: 'Hoàng Kim', color: '#fff099', slots: 6, pow: 6.0 }];
  // tên / định dạng từng chỉ số (UI + THIET_KE)
  const pct = (v) => `${Math.round(v * 100)}%`;
  const STAT = {
    hp:   { name: 'Máu', icon: '❤', fmt: (v) => `+${v} Máu` },
    ga:   { name: 'Hộ Giáp', icon: '🛡', fmt: (v) => `+${v} Hộ Giáp` },
    phys: { name: 'Công Vật Lý', icon: '⚔', fmt: (v) => `+${pct(v)} Công Vật Lý` },
    mag:  { name: 'Công Phép', icon: '✨', fmt: (v) => `+${v} Công Phép` },
    magAmp: { name: 'Công Phép %', icon: '✨', fmt: (v) => `+${pct(v)} sát thương phép` },
    ms:   { name: 'Tốc Chạy', icon: '👟', fmt: (v) => `+${pct(v)} Tốc Chạy` },
    cdr:  { name: 'Hồi Chiêu', icon: '⏳', fmt: (v) => `−${pct(v)} Hồi Chiêu` },
    ls:   { name: 'Hút Máu', icon: '🩸', fmt: (v) => `+${pct(v)} Hút Máu` },
    ten:  { name: 'Kháng Hiệu Ứng', icon: '🪨', fmt: (v) => `+${pct(v)} Kháng Hiệu Ứng` },
    crit: { name: 'Chí Mạng', icon: '🎯', fmt: (v) => `+${pct(v)} Chí Mạng` },
    loot: { name: 'May Mắn', icon: '🍀', fmt: (v) => `+${pct(v)} May Mắn (đồ hiếm)` },
    as:   { name: 'Tốc Đánh', icon: '💨', fmt: (v) => `+${pct(v)} Tốc Đánh` },
    gold: { name: 'Vàng', icon: '💰', fmt: (v) => `+${pct(v)} vàng nhặt được` },
    anti: { name: 'Chống Xuyên', icon: '🧱', fmt: (v) => `Chống Xuyên ${pct(v)}` },
    zoneRed: { name: 'Kháng Bão', icon: '🌪', fmt: (v) => `−${pct(v)} sát thương bão` },
    drink: { name: 'Uống Nhanh', icon: '🧪', fmt: (v) => `uống bình nhanh hơn ${pct(v)}` },
    hookSpd: { name: 'Dây Móc', icon: '🪝', fmt: (v) => `+${pct(v)} tốc kéo dây móc` },
    hookRange: { name: 'Dây Móc', icon: '🪝', fmt: (v) => `+${pct(v)} tầm dây móc` },
    dotByp: { name: 'Xuyên Thủng (độc)', icon: '🗡', fmt: (v) => `sát thương theo thời gian bỏ qua ${pct(v)} Hộ Giáp` },
    airDash: { name: 'Lướt Trên Không', icon: '🌬', fmt: () => 'lướt thêm 1 lần sau dây móc' },
    // GĐ9
    rl:    { name: 'Tốc Nạp', icon: '⚙', fmt: (v) => `+${pct(v)} Tốc Nạp đạn` },
    clip:  { name: 'Băng Đạn', icon: '🧷', fmt: (v) => `+${pct(v)} sức chứa băng đạn` },
    vis:   { name: 'Tầm Nhìn', icon: '👁', fmt: (v) => `+${pct(v)} Tầm Nhìn` },
    noFog: { name: 'Xuyên Sương', icon: '🌫', fmt: () => 'không bị sương mù / màn đêm thu hẹp tầm nhìn' },
    rng:   { name: 'Tầm Bắn', icon: '🎯', fmt: (v) => `+${pct(v)} Tầm Bắn (vũ khí tầm xa)` },
    reach: { name: 'Tầm Với', icon: '🗡', fmt: (v) => `+${v} đv Tầm Với (cận chiến)` },
    pspd:  { name: 'Tốc Đạn', icon: '💨', fmt: (v) => `+${pct(v)} tốc độ bay của đạn` },
    asCap: { name: 'Phá Trần Tốc Đánh', icon: '⚡', fmt: (v) => `trần tốc đánh +${v}` },
    soft:  { name: 'Xuyên Vật Cản', icon: '🪵', fmt: () => 'đạn xuyên 1 lớp tường gỗ / thân cây' },
    noFall:{ name: 'Bất Suy', icon: '📏', fmt: () => 'không suy hao sát thương theo khoảng cách' },
  };
  // chỉ số mảnh → khóa trong u.bonus (lõi trận đọc)
  const BONUS_KEY = { hp: 'hpFlat', ga: 'gaMax', phys: 'physAmp', mag: 'ap', magAmp: 'magicAmp', ms: 'msPct', cdr: 'cdr', ls: 'lifesteal', ten: 'tenacity', crit: 'crit', loot: 'loot',
    as: 'asPct', gold: 'goldPct', anti: 'antiByp', zoneRed: 'zoneRed', drink: 'drinkSpd', hookSpd: 'hookSpd', hookRange: 'hookRange', dotByp: 'dotByp', airDash: 'airDash',
    rl: 'reloadPct', clip: 'magPct', vis: 'visPct', noFog: 'noFog', rng: 'rangePct', reach: 'reach', pspd: 'projSpd', asCap: 'asCap', soft: 'passSoft', noFall: 'noFall' };
  // chỉ số dạng cờ (không nhân Cộng Hưởng Ý Niệm)
  const FLAG = { anti: 1, airDash: 1, noFog: 1, soft: 1, noFall: 1, asCap: 1 };

  // ---------- tiện ích cho nội tại ----------
  // hồi chiêu nội tại riêng của mảnh (true = sẵn sàng và bắt đầu hồi)
  const rdy = (m, u, k, cd) => { const c = u.scd || (u.scd = {}); if ((c[k] || 0) > m.time) return false; c[k] = m.time + cd; return true; };
  const ready = (m, u, k) => !((u.scd && u.scd[k]) > m.time);
  const isSkill = (info) => !!(G.ITEM_IS_SKILL && G.ITEM_IS_SKILL(info));
  const foeHero = (u, t) => t && t.alive && t.kind === 'hero' && t.team !== u.team;
  // đòn mở màn: 5s chưa gây sát thương lên tướng nào
  const opener = (m, u) => m.time - (u.ws.lastHeroHitT == null ? -99 : u.ws.lastHeroHitT) > 5;
  const byp = (info, v) => { if (!(info.byp >= v)) info.byp = v; };
  const call = (m, u, text, color) => { if (m.fxOn) m.fx({ type: 'callout', id: u.id, text, color: color || '#e8d8ff' }); };
  // chiêu di chuyển (skill phụ + chiêu thoát thân / áp sát)
  const mobKeys = (u) => ['sub', 's1', 's2', 's3'].filter((k) => { const d = u.hero.skills[k]; return d && d.ai && (k === 'sub' || d.ai.use === 'escape' || d.ai.use === 'engage' || d.ai.dodge); });

  const LIST = [];
  const S = (id, t, n, st, p, d, x) => { const o = Object.assign({ id, t, n, st: st || {}, p: p || null, d: d || null }, x || {}); LIST.push(o); return o; };

  // ===================== BẬC 1 — TRẮNG (1 ô) =====================
  S('W01', 1, 'Hồn Sinh Mệnh Sơ Cấp', { hp: 150 });
  S('W02', 1, 'Hồn Thiết Giáp Thô', { ga: 60 });
  S('W03', 1, 'Hồn Thiết Kiếm Nhỏ', { phys: 0.05 });
  S('W04', 1, 'Hồn Tinh Thể Phép', { mag: 15 });
  S('W05', 1, 'Hồn Giày Vải Nhẹ', { ms: 0.04 });
  S('W06', 1, 'Hồn Nhịp Thở Đều', { cdr: 0.04 });
  S('W07', 1, 'Hồn Răng Nanh Nhỏ', { ls: 0.03 });
  S('W08', 1, 'Hồn Ý Chí Kiên Định', { ten: 0.08 });
  S('W09', 1, 'Hồn Cỏ Ba Lá', { crit: 0.05, loot: 0.08 });
  S('W10', 1, 'Hồn Vệ Binh Tập Sự', { hp: 100, ga: 30 });
  S('W11', 1, 'Hồn Lưỡi Đao Gọn', { phys: 0.03, cdr: 0.02 });
  S('W12', 1, 'Hồn Linh Quang Nhỏ', { mag: 10, cdr: 0.02 });
  S('W13', 1, 'Hồn Thợ Săn Rừng Sâu', { phys: 0.03 }, { onDeal(m, u, t, info) { if (t.kind === 'monster' && !t.boss && !t.big) info.amt *= 1.08; } }, '+8% sát thương lên quái nhỏ.');
  S('W14', 1, 'Hồn Móc Dây Trơn Tru', { ms: 0.02, hookSpd: 0.12 }, null, 'Dây móc kéo nhanh hơn 12%.');
  S('W15', 1, 'Hồn Băng Bó Gấp', { hp: 80, drink: 0.1 }, null, 'Uống bình máu / Hộ Vệ nhanh hơn 10%.');
  S('W16', 1, 'Hồn Túi Đeo Tiện Lợi', { loot: 0.12, gold: 0.1 }, null, '+10% vàng nhặt được từ mọi nguồn.');
  S('WP1', 1, 'Hồn Xuyên Kình Sơ Cấp', { phys: 0.03 }, { onDeal(m, u, t, info) { if (info.auto) byp(info, 0.2); } }, 'Đánh thường bỏ qua 20% Hộ Giáp (đánh thẳng vào máu).');
  S('WP2', 1, 'Hồn Tinh Kình Phép Sơ Cấp', { mag: 12 }, { onDeal(m, u, t, info) { if (isSkill(info)) byp(info, 0.25); } }, 'Sát thương chiêu bỏ qua 25% Hộ Giáp.');
  S('WA1', 1, 'Hồn Vách Sắt Mỏng', { ga: 120, anti: 0.15 }, null, 'Giảm 15% xuyên thủng của đối thủ.');

  // ===================== BẬC 2 — XANH (2 ô) =====================
  S('B01', 2, 'Hồn Cự Nhân Sơ Cấp', { hp: 350, ga: 100 });
  S('B02', 2, 'Hồn Lưỡi Kiếm Sắc', { phys: 0.1 });
  S('B03', 2, 'Hồn Ma Năng Tụ Đỉnh', { mag: 35, cdr: 0.05 });
  S('B04', 2, 'Hồn Khát Máu', { ls: 0.06 });
  S('B05', 2, 'Hồn Thần Hành Bộ', { ms: 0.07 });
  S('B06', 2, 'Hồn Tâm Trí Bất Khuất', { ten: 0.16, hp: 120 });
  S('B07', 2, 'Hồn Móng Vuốt Săn Nguyệt', { crit: 0.1, loot: 0.15 });
  S('B08', 2, 'Hồn Đấu Sĩ Toàn Diện', { phys: 0.06, hp: 180, ga: 40 });
  S('B09', 2, 'Hồn Khí Công Thần Tốc', { cdr: 0.08, ms: 0.03 });
  S('B10', 2, 'Hồn Ma Pháp Hấp Thụ', { mag: 25, ls: 0.04 });
  S('B11', 2, 'Hồn Huyết Nhận Rạch Xé', { phys: 0.05 }, { onAuto(m, u, t, info) { if (t.alive) info.extra.push(() => t.alive && m.dot(u, t, Math.min(t.kind === 'hero' ? 1e9 : 25, t.st.maxHp * 0.005), 3, 'phys', 'sh_bleed')); } }, 'Đánh thường làm Chảy Máu: 1.5% máu tối đa sát thương vật lý trong 3s.');
  S('B12', 2, 'Hồn Bộc Phá Linh Năng', { mag: 20 }, { afterDeal(m, u, t, info) { if (isSkill(info) && t.alive) m.addStatus(t, 'slow', 1.5, 0.2, { src: u, key: 'sh_b12' }); } }, 'Chiêu trúng đích làm chậm 20% trong 1.5s.');
  S('B13', 2, 'Hồn Du Kích Bụi Rậm', { ms: 0.04 }, { tick(m, u) { if (u.bush >= 0) { m.addStatus(u, 'haste', 0.6, 0.15, { key: 'sh_b13' }); m.heal(u, u, 10, true); } } }, 'Trong bụi rậm: +15% tốc chạy và hồi 20 máu mỗi giây.');
  S('B14', 2, 'Hồn Phục Hồi Thần Tốc', { hp: 150, drink: 0.2 }, { onDrink(m, u) { m.shield(u, u, 60, 4); } }, 'Uống bình nhanh hơn 20%; uống xong nhận khiên 60 trong 4s.');
  S('B15', 2, 'Hồn Trảm Quái Thần Tốc', { phys: 0.05, mag: 15 }, { onDeal(m, u, t, info) { if (t.kind === 'monster') info.amt *= 1.2; }, onMonsterKill(m, u, mon) { if (mon.camp && mon.camp.type !== 'small' || mon.boss) m.gainGold(u, 80); } }, '+20% sát thương lên quái / boss; hạ quái tinh anh +80 vàng.');
  S('B16', 2, 'Hồn Đạp Gió', { ms: 0.03, hookRange: 0.2 }, null, '+20% tầm phóng dây móc.');
  S('BP1', 2, 'Hồn Thiết Tiễn Xuyên Phá', { phys: 0.06, ms: 0.03 }, { onDeal(m, u, t, info) { if (info.auto && u.ranged) byp(info, 0.35); } }, 'Đánh thường tầm xa bỏ qua 35% Hộ Giáp.');
  S('BP2', 2, 'Hồn Điểm Huyệt Xuyên Giáp', { phys: 0.08 }, { onDeal(m, u, t, info) { if (foeHero(u, t) && opener(m, u) && rdy(m, u, 'bp2', 10)) byp(info, 0.5); } }, 'Đòn mở màn giao tranh bỏ qua 50% Hộ Giáp (hồi 10s).');
  S('BP3', 2, 'Hồn Ăn Mòn Hóa Chất', { mag: 25, dotByp: 0.4 }, null, 'Sát thương theo thời gian / độc bỏ qua 40% Hộ Giáp.');
  S('BA1', 2, 'Hồn Giáp Hấp Thụ', { ga: 280, anti: 0.3 }, null, 'Chống Xuyên 30%.');

  // ===================== BẬC 3 — TÍM (3 ô) =====================
  S('P01', 3, 'Hồn Cự Thạch Sơn Hải', { hp: 650, ga: 220 });
  S('P02', 3, 'Hồn Cuồng Phong Trảm Lực', { phys: 0.18 });
  S('P03', 3, 'Hồn Minh Hỏa Bí Thuật', { mag: 75, cdr: 0.1 });
  S('P04', 3, 'Hồn Hấp Huyết Vô Tận', { ls: 0.12 });
  S('P05', 3, 'Hồn Thần Vận May Mắn', { crit: 0.16, loot: 0.3 });
  S('P06', 3, 'Hồn Bất Khuất Kim Thân', { ten: 0.28, ga: 120 });
  S('P07', 3, 'Hồn Tật Phong Đột Kích', { ms: 0.11, cdr: 0.06 });
  S('P08', 3, 'Hồn Lưỡng Nghi Chiến Ma', { phys: 0.1, mag: 40, hp: 250 });
  S('P09', 3, 'Hồn Phách Kiếm Khí', { phys: 0.08 }, { onAuto(m, u, t, info) { if (u.ranged) return; const v = M.dir(u, t), k = info.amt * 0.4; info.extra.push(() => m.hitLine(u, t.x, t.y, v.x, v.y, 4, 1, (e) => { if (e !== t) m.damage(u, e, k, 'phys', { tag: 'p', aoe: true }); }, { color: '#e8f4ff', fx: 'wave' })); } }, 'Đánh thường cận chiến phóng thêm luồng kiếm khí bay 4 đv (40% sát thương đòn đánh).');
  S('P10', 3, 'Hồn Phá Giáp Trọng Thương', { crit: 0.08 }, { onDeal(m, u, t, info) { if (info.crit) { info.penX = 0.3; if (t.alive) m.addStatus(t, 'wound', 3, 1, { src: u }); } } }, 'Đòn chí mạng bỏ qua 30% giáp và giảm 40% hồi máu của nạn nhân 3s.');
  S('P11', 3, 'Hồn Ẩn Mật Dạ Hành', { ms: 0.05 }, {
    tick(m, u) { if (u.bush >= 0 && m.time - u.lastDmgT > 2) { u.ws.bushT = (u.ws.bushT || 0) + 0.5; if (u.ws.bushT >= 3) { m.addStatus(u, 'stealth', 0.7, 1, { key: 'sh_p11' }); u.ws.ambushT = m.time + 2.5; } } else u.ws.bushT = 0; },
    onDeal(m, u, t, info) { if (u.ws.ambushT > m.time && foeHero(u, t)) { u.ws.ambushT = 0; info.amt *= 1.25; m.removeStatus(u, 'stealth', 'sh_p11'); } } }, 'Đứng yên trong bụi 3s thì tàng hình; đòn đầu tiên sau đó +25% sát thương.');
  S('P12', 3, 'Hồn Kháng Độc Bão Tố', { hp: 200, zoneRed: 0.4 }, { tick(m, u) { if (m.zoneSt && !m.inZone(u, 0)) m.addStatus(u, 'haste', 0.6, 0.2, { key: 'sh_p12' }); } }, '−40% sát thương bão; +20% tốc chạy khi ở ngoài bo.');
  S('P13', 3, 'Hồn Phong Lôi Tê Liệt', { mag: 30, cdr: 0.05 }, { onAuto(m, u, t, info) {
    const c = u.ws.p13 && u.ws.p13.id === t.id ? u.ws.p13 : (u.ws.p13 = { id: t.id, n: 0 }); c.n++;
    if (c.n >= 3 && foeHero(u, t) && rdy(m, u, 'p13', 8)) { c.n = 0; info.extra.push(() => { if (!t.alive) return; m.interrupt(t); m.addStatus(t, 'stun', 0.5, 1, { src: u }); m.damage(u, t, 30 + 6 * u.level + 0.3 * u.st.ap, 'magic', { tag: 'p' }); if (m.fxOn) m.fx({ type: 'burst', x: t.x, y: t.y, color: '#9fd0ff' }); }); } } }, 'Đòn đánh thứ 3 liên tiếp phóng sét: ngắt chiêu và tê liệt 0.5s (hồi 8s).');
  S('P14', 3, 'Hồn Đoạt Mệnh Hồi Năng', { phys: 0.06 }, { onKill(m, u, v) { if (v.kind !== 'hero') return; m.heal(u, u, u.st.maxHp * 0.2); for (const k of mobKeys(u)) if (u.cd[k] > 0) u.cd[k] *= 0.5; } }, 'Hạ gục tướng: hồi 20% máu tối đa, giảm 50% hồi chiêu chiêu di chuyển.');
  S('P15', 3, 'Hồn Thấu Thị Kho Báu', { loot: 0.25 }, { tick(m, u) {
    for (const e of m.heroes) if (e.alive && e.team !== u.team && e.cast && e.cast.key === 'potion' && M.dist(e, u) < 25) m.wards.push({ team: u.team, x: e.x, y: e.y, until: m.time + 0.6 });
  } }, 'Thấy kẻ địch đang uống bình trong 25 đv; rương báu trong 25 đv hiện trên bản đồ.');
  S('P16', 3, 'Hồn Hộ Thân Đẩy Lùi', { ga: 100 }, { onGaBreak(m, u) { if (!rdy(m, u, 'p16', 45)) return; m.hitCircle(u, u.x, u.y, 3, (e) => { const v = M.dir(u, e); m.knock(u, e, v.x, v.y, 3, 0.25); }, { color: '#9fd8ff' }); m.shield(u, u, 150, 3); call(m, u, '🛡 Hộ Thân!', '#9fd8ff'); } }, 'Hộ Giáp vỡ: xung lực đẩy lùi kẻ địch quanh 3 đv, nhận khiên 150 trong 3s (hồi 45s).');
  S('PK1', 3, 'Hồn Trợ Năng', { hp: 250 }, null, 'Bình máu / mana hồi thêm 50% lượng hồi trong 5s sau khi uống.', { perk: 'tro_nang' });
  S('PK2', 3, 'Hồn Uống Máu', { ls: 0.05 }, null, 'Hạ gục một tướng: hồi 80% máu tối đa.', { perk: 'uong_mau' });
  S('PK3', 3, 'Hồn Cẩn Thận', { ga: 150 }, null, 'Uống bình không bị ngắt khi trúng đòn.', { perk: 'can_than' });
  S('PP1', 3, 'Hồn Phá Giáp Trọng Trảm', { phys: 0.14 }, { onDeal(m, u, t, info) { if (info.type === 'phys') byp(info, 0.5); } }, 'Đòn đánh và chiêu vật lý bỏ qua 50% Hộ Giáp.');
  S('PP2', 3, 'Hồn Đoạt Phách Chí Mạng', { crit: 0.12 }, { onDeal(m, u, t, info) { if (info.crit) byp(info, 0.7); } }, 'Đòn chí mạng bỏ qua 70% Hộ Giáp.');
  S('PP3', 3, 'Hồn Liêm Dao Xuyên Thấu', { cdr: 0.08, ms: 0.05 }, { onDeal(m, u, t, info) { if (t.kind === 'hero' && ((u.x - t.x) * t.fx + (u.y - t.y) * t.fy) < -0.3 * Math.max(0.1, M.dist(u, t))) byp(info, 0.65); } }, 'Đánh từ sau lưng bỏ qua 65% Hộ Giáp.');
  S('PA1', 3, 'Hồn Giáp Tái Tạo', { ga: 500, hp: 200, anti: 0.45 }, { tick(m, u) { if (m.time - u.lastDmgT > 4 && u.ga < u.st.maxGa) u.ga = Math.min(u.st.maxGa, u.ga + u.st.maxGa * 0.04); } }, 'Ngoài giao tranh 4s: hồi 8% Hộ Giáp mỗi giây. Chống Xuyên 45%.');

  // ===================== BẬC 4 — VÀNG (4 ô) =====================
  S('G01', 4, 'Hồn Kim Cương Bất Diệt', { hp: 1300, ga: 450 });
  S('G02', 4, 'Hồn Chiến Thần Cuồng Nộ', { phys: 0.28, cdr: 0.08 });
  S('G03', 4, 'Hồn Pháp Vương Tối Cao', { mag: 145, cdr: 0.16 });
  S('G04', 4, 'Hồn Huyết Tế Đại Sư', { ls: 0.2, hp: 300 });
  S('G05', 4, 'Hồn Vạn Tượng Hoàng Kim Vận', { crit: 0.26, loot: 0.5 });
  S('G06', 4, 'Hồn Vô Thùy Định Phách', { ten: 0.42, hp: 600 });
  S('G07', 4, 'Hồn Thần Tốc Hư Không', { ms: 0.16, cdr: 0.1 });
  S('G08', 4, 'Hồn Ma Vũ Song Tu', { phys: 0.15, mag: 80, ls: 0.08 });
  S('G09', 4, 'Hồn Băng Trệ Tỏa Khí', { hp: 400, cdr: 0.06 }, { onAuto(m, u, t, info) { if (foeHero(u, t) && rdy(m, u, 'g09', 8)) { m.addStatus(t, 'slow', 1.5, 0.35, { src: u, key: 'sh_g09' }); m.addStatus(t, 'nodash', 1.5, 1, { src: u }); } } }, 'Đánh thường làm chậm 35% và cấm lướt / dây móc 1.5s (hồi 8s).');
  S('G10', 4, 'Hồn Đạp Gió Không Gian', { ms: 0.08, airDash: 1 }, null, 'Dùng dây móc xong được lướt thêm 1 lần 3 đv trên không.');
  S('G11', 4, 'Hồn Thiêu Đốt Chân Hỏa', { mag: 50 }, { afterDeal(m, u, t, info) { if (!isSkill(info) || !t.alive) return; m.dot(u, t, Math.min(t.kind === 'hero' ? 1e9 : 60, t.st.maxHp * 0.025), 3, 'magic', 'sh_g11'); if (t.kind === 'hero') { m.removeStatus(t, 'stealth'); t.revealedT = Math.max(t.revealedT || 0, m.time + 3); } } }, 'Sát thương chiêu thiêu đốt 2.5% máu tối đa mỗi giây trong 3s, phá tàng hình.');
  S('G12', 4, 'Hồn Phản Kích Thần Hựu', { ga: 200 }, { onBlock(m, u, att) { if (!rdy(m, u, 'g12', 12)) return; u.ga = u.st.maxGa; if (att && att.alive && att.kind === 'hero') { const s = att.has('stun'); if (s) s.t += 0.75; else m.addStatus(att, 'stun', 0.75, 1, { src: u }); } call(m, u, '🛡 Phản Kích!', '#bfe0ff'); } }, 'Đỡ đòn thành công (thế thủ / khiên chặn trọn): hồi đầy Hộ Giáp, choáng kẻ đánh thêm 0.75s.');
  S('G13', 4, 'Hồn Tử Địa Nghịch Chuyển', { hp: 500 }, { afterTake(m, u) { if (u.hpPct < 0.2 && u.alive && rdy(m, u, 'g13', 75)) { m.shield(u, u, 600, 5); m.addStatus(u, 'buff', 5, 1, { key: 'sh_g13', mods: { lifesteal: 0.35 } }); call(m, u, '💢 Tử Địa Nghịch Chuyển', '#ffb0b0'); } } }, 'Máu dưới 20%: khiên 600 và +35% hút máu trong 5s (hồi 75s).');
  S('G14', 4, 'Hồn Thiết Thể Tụ Lực', { phys: 0.12 }, { onCastStart(m, u, key, c) { c.unstop = true; m.addStatus(u, 'reduce', c.t + 0.1, 0.25, { key: 'sh_g14' }); } }, 'Đang tụ lực / niệm chiêu: không thể bị ngắt và giảm 25% sát thương nhận.');
  S('G15', 4, 'Hồn Thu Thập Tàn Hồn', { crit: 0.1 }, { onKill(m, u, v) { if (v.kind !== 'hero') return; const n = Math.min(10, (u.ws.g15 || 0) + 1); u.ws.g15 = n; m.addStatus(u, 'buff', 1e6, 1, { key: 'sh_g15', mods: { dmgAmp: 0.015 * n, hpFlat: 40 * n }, persist: true }); } }, 'Mỗi mạng hạ gục: vĩnh viễn +1.5% sát thương và +40 máu (tối đa 10 tầng).');
  S('G16', 4, 'Hồn Ảo Ảnh Tráo Thân', { cdr: 0.08 }, { afterTake(m, u, att, info) {
    if (!info.crit || !u.alive || !rdy(m, u, 'g16', 60)) return;
    const v = att ? M.dir(att, u) : { x: -u.fx, y: -u.fy };
    m.makeDecoy(u, u.x, u.y, { life: 3, hp: 0.3 });
    m.addStatus(u, 'stealth', 1.5, 1, { key: 'sh_g16' });
    const p = { x: u.x + v.x * 4, y: u.y + v.y * 4 }; G.MAP.pushOut(p, u.r); m.dashTo(u, p.x, p.y, 20, {});
    call(m, u, '🎭 Tráo Thân', '#e0d0ff');
  } }, 'Trúng đòn chí mạng: để lại phân thân thế mạng, tàng hình lướt đi 4 đv trong 1.5s (hồi 60s).');
  S('GK1', 4, 'Hồn Lưu Vân', { ms: 0.08 }, null, 'Lướt ngắn 4 đv rồi tăng 40% tốc chạy trong 2s (hồi 10s).', { perk: 'luu_van' });
  S('GK2', 4, 'Hồn Vận Mệnh', { hp: 600 }, null, 'Gục lần tới thì hồi sinh ngay tại chỗ với 40% máu — mảnh hồn này vỡ.', { perk: 'van_menh' });
  S('GK3', 4, 'Hồn Cơ Mệnh', { cdr: 0.1 }, null, 'Hạ gục một tướng: mọi chiêu hồi ngay lập tức.', { perk: 'co_menh' });
  S('GP1', 4, 'Hồn Vô Ảnh Thần Trảm', { phys: 0.22, cdr: 0.1 }, { onDeal(m, u, t, info) { byp(info, (t.ga || 0) > t.hp ? 0.85 : 0.75); } }, 'Bỏ qua 75% Hộ Giáp (85% nếu Hộ Giáp của đối thủ dày hơn máu).');
  S('GP2', 4, 'Hồn Phong Nhận Đoạt Mệnh', { ms: 0.1 }, { onDeal(m, u, t, info) { if (m.time - (u.lastDashT || -99) < 2 && foeHero(u, t) && rdy(m, u, 'gp2', 12)) byp(info, 0.9); } }, 'Đòn đầu tiên trong 2s sau khi lướt / dây móc bỏ qua 90% Hộ Giáp (hồi 12s).');
  S('GP3', 4, 'Hồn Chân Hỏa Thiêu Hồn', { mag: 110 }, { onDeal(m, u, t, info) { if (info.aoe) { byp(info, 0.8); info.gaStun = true; } } }, 'Chiêu diện rộng bỏ qua 80% Hộ Giáp; làm vỡ Hộ Giáp của mục tiêu thì choáng nó 1s.');
  S('GA1', 4, 'Hồn Hộ Thể Đột Biến', { ga: 900, anti: 0.6 }, { afterTake(m, u, att, info, dealt) { if (dealt > 0 && u.alive) u.ga = Math.min(u.st.maxGa, u.ga + dealt * 0.4); } }, '40% sát thương nhận vào máu được sạc lại thành Hộ Giáp. Chống Xuyên 60%.');

  // ===================== BẬC 5 — ĐỎ (5 ô) =====================
  S('R01', 5, 'Hồn Titan Cổ Đại', { hp: 2200, ga: 750 });
  S('R02', 5, 'Hồn Diệt Thế Phá Lực', { phys: 0.4, cdr: 0.12 });
  S('R03', 5, 'Hồn Tinh Tú Hủy Diệt', { mag: 220, cdr: 0.22 });
  S('R04', 5, 'Hồn Thao Thiết Thôn Huyết', { ls: 0.3, hp: 500 });
  S('R05', 5, 'Hồn Thiên Mệnh Chi Tử', { crit: 0.35, loot: 0.75 });
  S('R06', 5, 'Hồn Bất Hoại Thần Thân', { ten: 0.55, ga: 350, hp: 800 });
  S('R07', 5, 'Hồn Phong Thần Vô Cực', { ms: 0.22, cdr: 0.15 });
  S('R08', 5, 'Hồn Thái Cực Toàn Giác', { phys: 0.2, mag: 110, hp: 600, ga: 150 });
  S('R09', 5, 'Hồn Niết Bàn Tái Sinh', { hp: 600 }, { onFatal(m, u) {
    if (u.ws.nietBan) return false;
    u.ws.nietBan = true; u.hp = 1;
    m.addStatus(u, 'invuln', 2.5, 1, { key: 'sh_r09' }); m.addStatus(u, 'root', 2.5, 1, { key: 'sh_r09r' });
    call(m, u, '🔥 NIẾT BÀN', '#ffb04a'); if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ff8a2a', life: 2.5 });
    m.later(2.5, (mm) => { if (!u.alive) return; mm.hitCircle(u, u.x, u.y, 4, (e) => mm.damage(u, e, 400, 'magic', { tag: 'p', aoe: true }), { color: '#ff8a2a', fx: 'boom' }); u.hp = Math.max(u.hp, u.st.maxHp * 0.4); });
    return true;
  } }, 'Nhận đòn kết liễu: hóa kén lửa bất tử 2.5s, phát nổ 400 sát thương xung quanh rồi hồi sinh với 40% máu (1 lần mỗi trận).');
  S('R10', 5, 'Hồn Đoạt Mệnh Trảm Quyết', { phys: 0.18 }, { onDeal(m, u, t, info) { if (t.kind === 'hero' || (t.kind === 'monster' && !t.boss && !t.big)) info.exec = true; } }, 'Đánh mục tiêu dưới 15% máu: hành quyết ngay bằng sát thương chuẩn.');
  S('R11', 5, 'Hồn Cấm Địa Kết Giới', { cdr: 0.1 }, { onDeal(m, u, t, info) {
    if (!foeHero(u, t) || !opener(m, u) || !rdy(m, u, 'r11', 60)) return;
    const x = t.x, y = t.y;
    m.zone({ owner: u, x, y, r: 8, life: 4, every: 0.5, kind: 'arena', tick: (mm) => { for (const e of mm.heroes) if (e.alive && e.team !== u.team && M.dist(e, { x, y }) < 8) mm.addStatus(e, 'nodash', 0.6, 1, { src: u, key: 'sh_r11' }); } });
    call(m, u, '⛓ Cấm Địa', '#ffb0b0'); if (m.fxOn) m.fx({ type: 'ring', x, y, r: 8, color: '#ff6a6a' });
  } }, 'Đòn mở màn giao tranh dựng kết giới bán kính 8 trong 4s: kẻ địch bên trong không lướt / dây móc được (hồi 60s).');
  S('R12', 5, 'Hồn Ngưng Đọng Thời Không', { ten: 0.25 }, { onHardCC(m, u) { if (!rdy(m, u, 'r12', 75)) return false; m.addStatus(u, 'invuln', 1.5, 1, { key: 'sh_r12' }); call(m, u, '⏳ Ngưng Đọng', '#d0e0ff'); return true; } }, 'Tự giải khống chế cứng đầu tiên phải chịu, hóa đá miễn sát thương 1.5s (hồi 75s).');
  S('R13', 5, 'Hồn Huyết Ma Thịnh Nộ', { phys: 0.15, mag: 60 }, {
    onDeal(m, u, t, info) { const k = Math.floor((1 - u.hpPct) * 10); if (k > 0) info.amt *= 1 + 0.05 * k; },
    onTake(m, u, att, info) { const k = Math.floor((1 - u.hpPct) * 10); if (k > 0) info.amt *= 1 - 0.04 * k; } }, 'Mỗi 10% máu đã mất: +4% kháng mọi sát thương và +5% sát thương gây ra.');
  S('R14', 5, 'Hồn Vạn Kiếm Quy Tông', { phys: 0.2 }, { onCastStart(m, u) {
    if (!rdy(m, u, 'r14', 25)) return;
    m.later(0.25, (mm) => mm.hitCircle(u, u.x, u.y, 5, (e) => { if (e.ga > 0) e.ga *= 0.6; mm.damage(u, e, 40 + 8 * u.level, 'phys', { tag: 'p', aoe: true }); }, { color: '#e8f4ff', fx: 'whirl' }));
    call(m, u, '⚔ Vạn Kiếm Quy Tông', '#e8f4ff');
  } }, 'Hoàn thành đòn tụ lực (chiêu có thời gian niệm): bão kiếm 360° xé 40% Hộ Giáp mọi kẻ địch quanh 5 đv (hồi 25s).');
  S('R15', 5, 'Hồn Lôi Thần Phạt Tội', { mag: 80 }, { onAuto(m, u, t, info) {
    info.extra.push(() => { if (!t.alive) return; let s = t.hasKey('sh_r15'); const n = (s ? s.n : 0) + 1; s = m.addStatus(t, 'mark', 6, 1, { key: 'sh_r15', src: u }); if (s) s.n = n;
      if (n >= 5) { t.statuses = t.statuses.filter((x) => x !== s); m.damage(u, t, Math.min(t.kind === 'hero' ? 1e9 : 300, t.st.maxHp * 0.12), 'true', { tag: 'p' }); m.addStatus(t, 'silence', 1.5, 1, { src: u }); if (m.fxOn) m.fx({ type: 'burst', x: t.x, y: t.y, color: '#9fd0ff' }); } });
  } }, 'Mỗi đòn đánh tích 1 Lôi Ấn; đủ 5 tầng giáng sét 12% máu tối đa sát thương chuẩn và câm lặng 1.5s.');
  S('R16', 5, 'Hồn Hỗn Mang Đảo Nghịch', { ga: 300, hp: 500 }, {
    afterTake(m, u) { if (u.hpPct < 0.3 && u.alive && rdy(m, u, 'r16', 90)) { m.addStatus(u, 'buff', 3, 1, { key: 'sh_r16' }); call(m, u, '☯ Hỗn Mang Đảo Nghịch', '#e0c0ff'); } },
    onTake(m, u, att, info) { if (u.statuses.length && u.hasKey('sh_r16')) { const h = info.amt * 0.5; info.amt -= h; m.heal(u, u, h, true); } } }, 'Máu dưới 30%: 3s tiếp theo chuyển 50% sát thương nhận vào thành máu hồi phục (hồi 90s).');
  S('RK1', 5, 'Hồn Thiên Mệnh', { hp: 800, ga: 300 }, null, 'Gục thì hồi sinh tại chỗ với 50% máu và BẤT TỬ 90s; hồi 400s.', { perk: 'thien_menh' });
  S('RK2', 5, 'Hồn Tuyệt Kỹ Nộ', { phys: 0.15, mag: 60 }, null, 'Chiêu cuối gây ×2 sát thương trong 3.5s sau khi dùng (hồi 60s).', { perk: 'tuyet_ky_no' });
  S('RK3', 5, 'Hồn Cửa Hàng Online', { loot: 0.4, gold: 0.15 }, null, 'Mua đồ, bình, nâng balo, đúc ý niệm ở bất cứ đâu (không cần tới Thương Nhân).', { perk: 'cua_hang' });
  S('RP1', 5, 'Hồn Diệt Thế Xuyên Tâm', { phys: 0.35, crit: 0.2 }, { onDeal(m, u, t, info) { byp(info, m.time < (u.ws.chargedT || 0) && isSkill(info) ? 1 : 0.85); } }, 'Bỏ qua 85% Hộ Giáp mọi nguồn; đòn tụ lực (chiêu có thời gian niệm) bỏ qua 100%.');
  S('RP2', 5, 'Hồn Thần Chết Thấu Cốt', { phys: 0.25, mag: 90 }, { onDeal(m, u, t, info) { if (t.hpPct < 0.3) byp(info, 1); } }, 'Mục tiêu dưới 30% máu: bỏ qua 100% Hộ Giáp.');
  S('RA1', 5, 'Hồn Kim Thân Bất Hoại', { ga: 1600, ten: 0.35, anti: 1 }, null, 'Chống Xuyên tuyệt đối: kẻ địch phải đánh vỡ hết Hộ Giáp mới chạm được máu.');

  // ===================== BẬC 6 — HOÀNG KIM / RỰC RỠ (6 ô, chỉ từ boss) =====================
  S('Y_CHI', 6, 'Mảnh Hồn Ý Chí', { hp: 1500, ga: 300, phys: 0.25, magAmp: 0.25, ms: 0.1, cdr: 0.15, ten: 0.2, crit: 0.1, loot: 0.2 }, {
    onDeal(m, u, t, info) { if (foeHero(u, t) && opener(m, u) && rdy(m, u, 'ychi1', 60)) { info.amt *= 2; call(m, u, '⚔ Khai Trận Trảm ×2', '#fff099'); } },
    onTake(m, u, att, info) { if (att && att.team !== u.team && att.kind === 'hero' && info.amt > 0 && rdy(m, u, 'ychi2', 120)) { info.amt = 0; m.addStatus(u, 'invuln', 0.25, 1, { key: 'ychi' }); call(m, u, '🛡 Ý Chí Sắt Đá', '#fff099'); } } },
  'Khai Trận Trảm: đòn đầu tiên mở màn giao tranh ×2 sát thương (hồi 60s). Ý Chí Sắt Đá: chặn trọn 1 đòn tấn công và hiệu ứng của nó (hồi 120s).', { boss: true });
  S('HOANG_KIM', 6, 'Mảnh Hồn Hoàng Kim', { hp: 1200, phys: 0.25, magAmp: 0.25, ls: 0.15 }, { onKill(m, u, v) { if (v.kind !== 'hero') return; for (const k of mobKeys(u)) u.cd[k] = 0; m.heal(u, u, u.st.maxHp * 0.25); call(m, u, '✨ Huyết Khí Hoàng Kim', '#fff099'); } },
    'Huyết Khí Hoàng Kim: hạ gục tướng → hồi ngay mọi chiêu di chuyển / dây móc và hồi 25% máu.', { boss: true });
  S('KIEM_Y', 6, 'Hồn Kiếm Ý Tuyệt Đối', { phys: 0.4, ms: 0.15 }, { onDeal(m, u, t, info) { if (foeHero(u, t) && rdy(m, u, 'kiemy', 60)) { byp(info, 1); (info.post || (info.post = [])).push(() => t.alive && m.addStatus(t, 'silence', 1.5, 1, { src: u })); call(m, u, '⚔ Thấu Không Trảm', '#fff099'); } } },
    'Thấu Không Trảm (hồi 60s): đòn kế tiếp lên tướng bỏ qua 100% Hộ Giáp và câm lặng 1.5s.', { boss: true });

  // ======================================================================================================
  // GĐ9 — 4 NHÁNH MỚI: NẠP ĐẠN (19) • TỐC ĐÁNH (10) • TẦM NHÌN & KIỂM SOÁT (12) • TẦM ĐÁNH (8)
  // Quy đổi bản thiết kế: 1 m ≈ 0.4 đv (tầm nhìn tướng 16 đv ≈ 40 m). Mảnh "gun" chỉ hợp tướng súng (Zero, Clint, Jack,
  // Chrono & Neo, Raven); "only" = chỉ hợp vũ khí tầm xa / cận chiến. Mảnh không hợp vẫn cộng chỉ số nhưng ít khi được gắn / rơi ra.
  // ======================================================================================================
  const gunOf = (m, u) => (G.H ? G.H.gun(m, u) : null);
  const gunFill = (m, u, k) => G.H && G.H.gunFill(m, u, k);
  const gunAdd = (m, u, n) => G.H && G.H.gunAdd(m, u, n);
  // "cảm nhận" đối thủ: lộ vị trí riêng cho người có mảnh (trong dur giây) — lõi trận gộp vào tầm nhìn
  const sense = (m, u, e, dur) => { const S = u.sense || (u.sense = {}); const t = m.time + dur; if (!(S[e.id] >= t)) S[e.id] = t; };
  const quiet = (e) => !!(e.shOn && e.shOn.has('G_VIS_04'));                 // Phá Sóng Nhiễu Loạn: không phát ra tiếng
  const foesIn = (m, u, R) => m.heroes.filter((h) => h.alive && h.team !== u.team && M.dist(h, u) <= R);
  const moving = (e) => e.vx * e.vx + e.vy * e.vy > 0.04;
  // đang đứng trong vùng cảnh báo đỏ của kẻ khác (tướng địch / boss / hiểm họa)
  const inRed = (m, u) => (m.dangers || []).some((z) => z.until > m.time && z.team !== u.team && G.Danger && G.Danger.inside(z, u.x, u.y, u.r));
  const killLeader = (m, u) => { let b = null; for (const h of m.heroes) if (h.alive && h !== u && h.stats.k >= 2 && (!b || h.stats.k > b.stats.k)) b = h; return b; };
  const buffHolder = (h) => h.statuses.some((s) => s.key && G.BOSS_BUFFS && G.BOSS_BUFFS[s.key]);

  // ===================== NẠP ĐẠN — Tím (3 ô) =====================
  S('P_RL_01', 3, 'Hồn Ổ Đạn Mở Rộng', { rl: 0.25, ga: 150, clip: 0.35 }, null, 'Băng đạn chứa thêm 35%, làm tròn lên (2 → 3, 6 → 9, 9 → 13).', { gun: true });
  S('P_RL_02', 3, 'Hồn Nạp Đạn Tĩnh Tâm', { rl: 0.30, phys: 0.06 }, {
    onReloadStart(m, u) { u.ws.calm = m.time - (u.lastDmgT || -99) >= 1; if (u.ws.calm) G.H.rlScale(u, 0.65); },
    onReload(m, u) { if (u.ws.calm) { u.ws.calmN = 3; u.ws.calm = false; } },
    onAuto(m, u, t, info) { if (u.ws.calmN > 0) { u.ws.calmN--; info.amt *= 1.2; } } },
  'Bắt đầu nạp khi đã 1s không trúng đòn: nạp nhanh thêm 35% và 3 viên đầu của băng mới +20% sát thương. AI hết đạn thì lùi giữ cự ly / nấp góc rồi mới nạp.', { gun: true });
  S('P_RL_03', 3, 'Hồn Lộn Nhào Nạp Đạn', { rl: 0.20, ms: 0.04 }, { onDash(m, u) { if (rdy(m, u, 'prl3', 4)) gunAdd(m, u, 2); } },
    'Lướt / lộn nhào / bay dây móc: nạp ngay 2 viên vào băng (hồi 4s).', { gun: true });
  S('P_RL_04', 3, 'Hồn Đầu Đạn Phá Giáp', { rl: 0.25 }, {
    onReload(m, u) { u.ws.prl4 = true; },
    onDeal(m, u, t, info) { if (u.ws.prl4 && info.auto) { u.ws.prl4 = false; byp(info, 0.6); } } },
  'Viên đầu tiên sau mỗi lần nạp xuyên 60% Hộ Giáp (đi thẳng vào máu).', { gun: true });
  S('P_RL_05', 3, 'Hồn Đạn Cuối Chấn Địa', { rl: 0.20, phys: 0.08 }, {
    onAuto(m, u, t, info) { const g = gunOf(m, u); if (!g || g.n > 0) return; info.amt *= 1.45;
      info.extra.push(() => { if (!t.alive) return; const v = M.dir(u, t); m.knock(u, t, v.x, v.y, 1.4, 0.2); if (t.kind === 'hero') m.addStatus(t, 'stun', 0.5, 1, { src: u }); }); } },
  'Viên CUỐI CÙNG của băng +45% sát thương, nổ đẩy lùi mục tiêu 1.4 đv và choáng 0.5s.', { gun: true });
  S('P_RL_06', 3, 'Hồn Thu Gom Vỏ Đạn', { rl: 0.35, loot: 0.20 }, { afterDeal(m, u, t, info) { if (info.auto && info.crit && m.rng.next() < 0.25) gunAdd(m, u, 1); } },
    'Phát bắn chí mạng (trúng điểm yếu): 25% hoàn lại 1 viên vào băng.', { gun: true });
  // ===================== NẠP ĐẠN — Vàng (4 ô) =====================
  S('G_RL_01', 4, 'Hồn Đoạt Mệnh Nạp Tức Thì', { rl: 0.45, ms: 0.08 }, {
    onKill(m, u, v) { if (v.kind !== 'hero') return; gunFill(m, u, 1); m.addStatus(u, 'haste', 3, 0.35, { key: 'grl1' }); call(m, u, '🔫 Nạp Tức Thì', '#ffd21a'); },
    onAssist(m, u) { gunFill(m, u, 1); m.addStatus(u, 'haste', 3, 0.35, { key: 'grl1' }); } },
  'Hạ gục / hỗ trợ hạ gục tướng: nạp đầy băng ngay lập tức + 35% tốc chạy 3s.', { gun: true });
  S('G_RL_02', 4, 'Hồn Quán Tính Dây Móc', { rl: 0.40, as: 0.15 }, {
    onDash(m, u, d) { if (d && d.hookItem) gunFill(m, u, 1); },
    onDashEnd(m, u, d) { if (d && d.hookItem) u.ws.grl2T = m.time + 3; },
    onAuto(m, u, t, info) { if (u.ws.grl2T > m.time) { info.amt *= 1.4; u.ws.grl2T = 0; } } },
  'Đang bay bằng dây móc: tự nạp đầy băng. Phát bắn đầu tiên sau khi tiếp đất (trong 3s) +40% sát thương.', { gun: true });
  S('G_RL_03', 4, 'Hồn Sóng Nhiệt Buồng Đạn', { rl: 0.35, hp: 300 }, {
    onReloadStart(m, u) { if (!rdy(m, u, 'grl3', 2)) return; m.hitCircle(u, u.x, u.y, 1.4 + u.r, (e) => { const v = M.dir(u, e); m.knock(u, e, v.x, v.y, 1.2, 0.2); m.damage(u, e, Math.min(e.kind === 'hero' ? 1e9 : 200, e.st.maxHp * 0.04), 'magic', { tag: 'p', aoe: true }); }, { color: '#ff8a3a', fx: 'boom' }); } },
  'Bắt đầu nạp đạn: sóng nhiệt quanh thân (1.4 đv) đẩy dạt kẻ áp sát 1.2 đv và thiêu 4% máu tối đa của chúng.', { gun: true });
  S('G_RL_04', 4, 'Hồn Xả Chiêu Tiếp Đạn', { rl: 0.45, cdr: 0.10 }, {
    onSkill(m, u, key) { if (key !== 's1' && key !== 's2' && key !== 's3') return; gunFill(m, u, 0.5); u.ws.grl4 = true; },
    onAuto(m, u, t, info) { if (!u.ws.grl4) return; u.ws.grl4 = false; if (!info.crit) { info.crit = true; info.amt *= G.C.CRIT_MULT + (u.bonus.critMult || 0); } } },
  'Mỗi lần dùng chiêu S1 / S2 / S3: nạp ngay 50% băng (làm tròn lên); phát bắn kế tiếp chắc chắn CHÍ MẠNG. AI hết đạn thì tung chiêu trước rồi bắn tiếp.', { gun: true });
  S('G_RL_05', 4, 'Hồn Hộ Thể Đạn Đạo', { rl: 0.40, ga: 350 }, {
    onReloadStart(m, u) { if (!rdy(m, u, 'grl5', 4)) return; const g = gunOf(m, u), t = Math.max(0.4, (g && g.rl) || 1); m.addStatus(u, 'unstop', t, 1, { key: 'grl5' }); m.shield(u, u, 300 + 20 * u.level, t); } },
  'Trong lúc nạp đạn: không thể bị cản phá + giáp ảo 300 (+20/cấp) (hồi 4s).', { gun: true });
  S('G_RL_06', 4, 'Hồn Cò Quay Bất Tận', { rl: 0.40, crit: 0.18 }, {
    onReload(m, u) { if (m.rng.next() < 0.3) { u.ws.goldB = true; call(m, u, '🟡 Viên Đạn Hoàng Kim', '#ffd21a'); } },
    onAuto(m, u, t, info) { if (!u.ws.goldB) return; u.ws.goldB = false; const k = info.amt * 1.5; info.extra.push(() => { if (!t.alive) return; m.damage(u, t, k, 'true', { tag: 'p' }); if (t.kind === 'hero') m.addStatus(t, 'silence', 1.5, 1, { src: u }); }); } },
  'Mỗi lần nạp: 30% nạp 1 Viên Đạn Hoàng Kim — phát đó gây thêm sát thương chuẩn (tổng ×2.5) và câm lặng 1.5s.', { gun: true });
  // ===================== NẠP ĐẠN — Đỏ (5 ô) =====================
  S('R_RL_01', 5, 'Hồn Bão Đạn Vô Tận', { rl: 0.65, as: 0.25, phys: 0.20 }, {
    onAuto(m, u, t, info) {
      if (u.ws.freeFire > m.time) { info.extra.push(() => gunFill(m, u, 1)); return; }
      const g = gunOf(m, u); if (!g || g.n > 0 || !rdy(m, u, 'rrl1', 25)) return;
      u.ws.freeFire = m.time + 3; info.extra.push(() => gunFill(m, u, 1));
      m.addStatus(u, 'buff', 3, 1, { key: 'rrl1', mods: { asPct: 0.4 } }); call(m, u, '🌪 Bão Đạn Vô Tận', '#ff5a3a');
    } },
  'Bắn cạn băng: 3s xả đạn tự do — không tốn đạn, không phải nạp, +40% tốc đánh (hồi 25s).', { gun: true });
  S('R_RL_02', 5, 'Hồn Phản Xạ Thoát Hiểm', { rl: 0.55, ten: 0.30, ga: 350 }, {
    onDash(m, u) { u.ws.rrl2In = inRed(m, u); },
    onDashEnd(m, u) { if (u.ws.rrl2In && !inRed(m, u)) { gunFill(m, u, 1); call(m, u, '↯ Né chiêu — nạp đầy', '#ff8a8a'); } u.ws.rrl2In = false; },
    afterTake(m, u, att, info, dealt) {
      if (!att || att.ranged || att.team === u.team || att.kind !== 'hero' || !(dealt > u.st.maxHp * 0.15) || !rdy(m, u, 'rrl2', 25)) return;
      const v = M.dir(u, att); m.knock(u, att, v.x, v.y, 1.6, 0.25); u.ws.rrl2Shot = true; call(m, u, '💥 Phản Kích Trọng Thương', '#ff8a8a');
    },
    onAuto(m, u, t, info) { if (!u.ws.rrl2Shot) return; u.ws.rrl2Shot = false; const k = info.amt * 1.6; info.amt *= 0.2; info.extra.push(() => t.alive && m.damage(u, t, k, 'true', { tag: 'p', byp: 1 })); } },
  'Dùng lướt / dây móc thoát khỏi vùng cảnh báo đỏ (của tướng hoặc boss): nạp đầy băng tức thì. Trúng một đòn cận chiến mất > 15% máu tối đa: sóng xung kích đẩy kẻ áp sát 1.6 đv, phát bắn kế tiếp gây 180% sát thương, phần lớn là sát thương CHUẨN xuyên 100% Hộ Giáp (hồi 25s).', { gun: true });
  S('R_RL_03', 5, 'Hồn Đạn Hút Tủy', { rl: 0.50, ls: 0.18, hp: 500 }, {
    afterDeal(m, u, t, info) { if (info.auto && t.kind === 'hero') u.ws.blood = Math.min(10, (u.ws.blood || 0) + 1); },
    onReloadStart(m, u) { if ((u.ws.blood || 0) < 4) return; u.ws.blood = 0; const g = gunOf(m, u); if (g && g.rl > 0.3) G.H.rlScale(u, 0.3 / g.rl); m.heal(u, u, u.st.maxHp * 0.2); call(m, u, '🩸 Hút Tủy', '#ff5a6a'); } },
  'Mỗi phát trúng tướng tích 1 tầng Huyết Khí (tối đa 10). Bắt đầu nạp khi có ≥ 4 tầng: tiêu hết, nạp xong trong 0.3s và hồi 20% máu tối đa.', { gun: true });
  S('R_RL_04', 5, 'Hồn Hư Không Tráo Đạn', { rl: 0.60, ms: 0.12, cdr: 0.12 }, {
    onReloadStart(m, u) {
      if (!rdy(m, u, 'rrl4', 15)) return;
      const e = m.nearestEnemyHero(u, 12, true), v = e ? M.dir(e, u) : { x: -u.fx, y: -u.fy }, p = { x: u.x + v.x * 1.6, y: u.y + v.y * 1.6 }; G.MAP.pushOut(p, u.r);
      const g = gunOf(m, u); m.dashTo(u, p.x, p.y, 20, {}); m.addStatus(u, 'stealth', Math.max(1, (g && g.rl) || 1), 1, { key: 'rrl4' }); call(m, u, '🌑 Hư Không Tráo Đạn', '#b08aff');
    } },
  'Bắt đầu nạp đạn: tàng hình suốt lúc nạp và lướt 1.6 đv ra xa kẻ địch gần nhất (hồi 15s).', { gun: true });
  S('R_RL_05', 5, 'Hồn Trảm Quyết Xuyên Tâm', { rl: 0.50, phys: 0.30 }, {
    onAuto(m, u, t, info) { info.amt *= 1 + 0.5 * (1 - t.hpPct); if (u.ws.dblMag) info.amt *= 2; const g = gunOf(m, u); u.ws.lastB = !!(g && g.n <= 0); },
    onKill(m, u, v) { if (v.kind === 'hero' && u.ws.lastB) { u.ws.dblNext = true; call(m, u, '⚔ Trảm Quyết — băng kế ×2', '#ff5a3a'); } },
    onReloadStart(m, u) { u.ws.dblMag = false; },
    onReload(m, u) { u.ws.dblMag = !!u.ws.dblNext; u.ws.dblNext = false; } },
  'Mỗi viên +sát thương theo máu đã mất của mục tiêu (tối đa +50%). Hạ gục tướng bằng viên CUỐI băng: cả băng kế tiếp ×2 sát thương.', { gun: true });

  // ===================== TỐC ĐÁNH (mọi vũ khí; với tướng súng tốc đánh còn rút ngắn thời gian nạp) =====================
  S('W_AS_01', 1, 'Hồn Nhanh Nhẹn Thô', { as: 0.08 });
  S('W_AS_02', 1, 'Hồn Vũ Đao Nhẹ', { as: 0.05, ms: 0.02 });
  S('B_AS_01', 2, 'Hồn Liên Hoàn Trảm', { as: 0.15 }, {
    afterDeal(m, u, t, info) { if (!info.auto || t.kind !== 'hero') return; let s = u.hasKey('bas1'); const n = Math.min(3, (s ? s.n : 0) + 1); s = m.addStatus(u, 'buff', 3, 1, { key: 'bas1', mods: { asPct: 0.03 * n } }); if (s) s.n = n; } },
  'Đánh thường trúng tướng: +3% tốc đánh 3s (cộng dồn 3 tầng).');
  S('B_AS_02', 2, 'Hồn Tật Phong Bộ', { as: 0.10, ms: 0.05 });
  S('P_AS_01', 3, 'Hồn Cuồng Nộ Sát Tốc', { as: 0.26, cdr: 0.06 });
  S('P_AS_02', 3, 'Hồn Phong Lôi Liên Kích', { as: 0.18 }, {
    onAuto(m, u, t, info) { u.ws.pas2 = (u.ws.pas2 || 0) + 1; if (u.ws.pas2 < 4) return; u.ws.pas2 = 0; const k = info.amt * 0.35; info.extra.push(() => t.alive && m.damage(u, t, k, u.hero.dmgType === 'magic' ? 'magic' : 'phys', { tag: 'p' })); } },
  'Đòn đánh liên tiếp thứ 4: dư ảnh vung thêm một đòn 35% sát thương.');
  S('G_AS_01', 4, 'Hồn Vô Ảnh Cực Tốc', { as: 0.40, ms: 0.08 });
  S('G_AS_02', 4, 'Hồn Vũ Điệu Tử Thần', { as: 0.30, ls: 0.08 }, { afterDeal(m, u, t, info) { if (!info.auto) return; for (const k of mobKeys(u)) if (u.cd[k] > 0) u.cd[k] = Math.max(0, u.cd[k] - 0.3); } },
    'Mỗi đòn đánh trúng: giảm 0.3s hồi chiêu mọi chiêu lướt.');
  S('R_AS_01', 5, 'Hồn Thần Tốc Thiên Mệnh', { as: 0.55, ms: 0.12, asCap: 0.5 }, { onAuto(m, u) { m.addStatus(u, 'haste', 0.8, 0.1, { key: 'ras1' }); } },
    'Phá trần tốc đánh (+0.5 đòn/giây); vừa đánh vừa chạy không bị chậm (+10% tốc chạy 0.8s sau mỗi đòn).');

  // ===================== TẦM NHÌN & KIỂM SOÁT (từ Tím) =====================
  S('P_VIS_01', 3, 'Hồn Ưng Nhãn', { ms: 0.05, crit: 0.08, vis: 0.35, noFog: 1 }, null, 'Tầm nhìn +35%; sương mù, tử khí, màn đêm không còn thu hẹp tầm nhìn.');
  S('P_VIS_02', 3, 'Hồn Thấu Thị Thảo Mộc', { phys: 0.06, cdr: 0.06 }, {
    tick(m, u) { for (const e of foesIn(m, u, 12)) if (e.bush >= 0) sense(m, u, e, 0.7); },
    onDeal(m, u, t, info) { if (!foeHero(u, t) || t.bush < 0 || !(info.auto || isSkill(info))) return; const B = u.ws.bushHit || (u.ws.bushHit = {}); if (B[t.id] > m.time) return; B[t.id] = m.time + 6; info.amt *= 1.2; } },
  'Thấy (đánh dấu đỏ) mọi kẻ địch nấp bụi trong 12 đv; đòn đầu tiên vào kẻ đang nấp bụi +20% sát thương.');
  S('P_VIS_03', 3, 'Hồn Thính Giác Địa Chấn', { ga: 150, ten: 0.12 }, {
    tick(m, u) { for (const e of foesIn(m, u, 22)) if (!quiet(e) && (moving(e) || e.dash || m.time - (e.combatT || -99) < 1)) sense(m, u, e, 3); } },
  'Nghe bước chân, tiếng dây móc, tiếng giao tranh trong 22 đv: vị trí kẻ phát ra tiếng lộ 3s (kể cả sau tường / trong bụi).');
  S('P_VIS_04', 3, 'Hồn Radar Tàn Tích', { loot: 0.30, ms: 0.04 }, null, 'Thấy xuyên vật cản rương đồ, bẫy ngầm, Thương Nhân trong 16 đv: không dẫm phải bẫy của người khác, AI đi mở rương xa hơn.');
  // ===================== TẦM NHÌN — Vàng =====================
  S('G_VIS_01', 4, 'Hồn Tiên Tri Vòng Bo', { hp: 400, ga: 200 }, {
    tick(m, u) { const z = m.zoneSt, c = z && (z.next || z.cur); if (!c || !moving(u)) return; const dx = c.x - u.x, dy = c.y - u.y, L = Math.hypot(dx, dy) || 1; if ((u.vx * dx + u.vy * dy) / L > 0.7 * Math.hypot(u.vx, u.vy)) m.addStatus(u, 'haste', 0.6, 0.12, { key: 'gvis1' }); } },
  'Biết trước tâm vòng bo kế tiếp ngay khi vòng hiện tại vừa xuất hiện; chạy thẳng về tâm bo mới +12% tốc chạy. AI bỏ farm lẻ, chiếm chỗ ở tâm bo sớm 45s.');
  S('G_VIS_02', 4, 'Hồn Nhiệt Ảnh Truy Mệnh', { phys: 0.12, ms: 0.06 }, {
    tick(m, u) { for (const e of foesIn(m, u, 24)) if (e.hpPct < 0.4 || (e.cast && e.cast.key === 'potion')) sense(m, u, e, 0.7); } },
  'Nhìn xuyên địa hình, xuyên tường kẻ địch dưới 40% máu hoặc đang uống bình trong 24 đv. AI: điểm "đi săn / kết liễu" ×2 khi thấy mục tiêu dưới 40% máu.');
  S('G_VIS_03', 4, 'Hồn Phá Ảo Chân Thị', { mag: 60, cdr: 0.10 }, {
    tick(m, u) { for (const e of foesIn(m, u, 9)) sense(m, u, e, 0.7); } },
  'Hào quang Chân Thị 9 đv: kẻ địch xung quanh không thể tàng hình hay núp bụi trước mặt (Alice, Vesper…); bản thân miễn nhiễm mù.');
  S('G_VIS_04', 4, 'Hồn Phá Sóng Nhiễu Loạn', { ms: 0.08, ten: 0.20 }, {
    tick(m, u) { for (const e of foesIn(m, u, 14)) if (e.sense) for (const id in e.sense) if (+id !== u.id) delete e.sense[id]; } },
  'Làm nhiễu "bản đồ nhỏ" của mọi kẻ địch trong 14 đv (mất hết thông tin cảm nhận / nghe được); bản thân không phát ra tiếng động (bước chân, dây móc) — thính giác không nghe thấy.');
  // ===================== TẦM NHÌN — Đỏ =====================
  S('R_VIS_01', 5, 'Hồn Thiên Nhãn Xuyên Giới', { cdr: 0.15, ms: 0.10, hp: 500, vis: 0.70 }, {
    tick(m, u) { if (!rdy(m, u, 'rvis1', 15)) return; for (const e of foesIn(m, u, 40)) sense(m, u, e, 3.5); if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: 40, color: '#9fd0ff' }); } },
  'Tầm nhìn +70%. Mỗi 15s phát xung radar: lộ mọi tướng trong 40 đv (xuyên vách núi, hang, mái nhà) trong 3.5s.');
  S('R_VIS_02', 5, 'Hồn Nguyệt Thực Hắc Ám', { phys: 0.20, mag: 70 }, {
    onKill(m, u, v) {
      if (v.kind !== 'hero') return;
      const x = v.x, y = v.y;
      m.zone({ owner: u, x, y, r: 16, life: 6, every: 0.5, kind: 'smoke', tick: (mm, z) => { for (const e of mm.heroes) if (e.alive && e.team !== u.team && M.dist(e, z) < z.r) e.eclipseT = mm.time + 0.6; } });
      call(m, u, '🌑 Nguyệt Thực', '#8a7aa0');
    } },
  'Hạ gục tướng: khói bóng tối phủ 16 đv trong 6s — kẻ địch trong đó chỉ còn thấy 1.4 đv quanh thân, không khóa được mục tiêu tầm xa.');
  S('R_VIS_03', 5, 'Hồn Huyết Tế Toàn Cảnh', { phys: 0.15, crit: 0.15, ga: 250 }, {
    tick(m, u) { const L = killLeader(m, u); if (L) sense(m, u, L, 0.7); for (const h of m.heroes) if (h.alive && h.team !== u.team && buffHolder(h)) sense(m, u, h, 0.7); },
    onDeal(m, u, t, info) { if (foeHero(u, t) && (t === killLeader(m, u) || buffHolder(t))) info.amt *= 1.25; } },
  'Luôn thấy (toàn bản đồ) Kẻ Nhiều Mạng Nhất và kẻ đang mang bùa lợi boss; +25% sát thương lên hai loại mục tiêu này.');

  // ===================== TẦM ĐÁNH (từ Vàng) =====================
  S('G_RNG_01', 4, 'Hồn Xạ Thủ Xuyên Vân', { phys: 0.12, as: 0.10, rng: 0.35, pspd: 0.40 }, null, 'Vũ khí tầm xa: +35% tầm bắn, đạn bay nhanh hơn 40% (khó lướt né).', { only: 'ranged' });
  S('G_RNG_02', 4, 'Hồn Trường Nhận Phong Khí', { phys: 0.15, ms: 0.05, reach: 0.6 }, {
    onAuto(m, u, t, info) { if (u.ranged) return; const k = info.amt * 0.3; info.extra.push(() => { const e = m.enemiesIn(u.team, t.x, t.y, 1.5).filter((x) => x !== t && x.kind !== 'monster')[0]; if (e) m.damage(u, e, k, 'phys', { tag: 'p', aoe: true }); }); } },
  'Vũ khí cận chiến: khí kình kéo dài lưỡi — +0.6 đv tầm với; đường chém rộng thêm, quét trúng thêm 1 kẻ địch sát mục tiêu (30% sát thương).', { only: 'melee' });
  S('G_RNG_03', 4, 'Hồn Tuyệt Đích Bất Suy', { phys: 0.14, crit: 0.12, noFall: 1 }, {
    onDeal(m, u, t, info) { if (info.auto && u.ranged && M.dist(u, t) > 10) info.amt *= 1.18; } },
  'Vũ khí tầm xa: không suy hao sát thương theo khoảng cách (bắn ở rìa tầm vẫn 100%); trúng mục tiêu xa hơn 10 đv +18% sát thương.', { only: 'ranged' });
  S('G_RNG_04', 4, 'Hồn Phi Thân Trảm Kích', { ms: 0.07, cdr: 0.08, hookRange: 0.25 }, {
    tick(m, u) {
      if (u.ranged || u.dash || u.cast || u.disabled || u.rooted) return;
      const t = u.attackTarget; if (!t || !t.alive || (t.kind !== 'hero' && t.kind !== 'monster')) return;
      const d = M.dist(u, t) - u.r - t.r; if (d <= u.st.range + 0.2 || d > u.st.range + 1.4 || !rdy(m, u, 'grng4', 6)) return;
      const v = M.dir(t, u), p = { x: t.x + v.x * (t.r + u.r + 0.2), y: t.y + v.y * (t.r + u.r + 0.2) };
      m.dashTo(u, p.x, p.y, 20, { onEnd: (mm) => { if (t.alive && M.dist(u, t) < u.st.range + u.r + t.r + 0.5) { u.face(t.x, t.y); u.atkT = 0; } } });
    } },
  'Vũ khí cận chiến: đòn đầu tiên nhắm vào kẻ địch ở hơi xa thành cú lướt chém áp sát thêm 1.4 đv (hồi 6s); +25% tầm dây móc.', { only: 'melee' });
  S('R_RNG_01', 5, 'Hồn Xuyên Cực Vạn Dặm', { phys: 0.25, as: 0.20, rng: 0.60, soft: 1 }, null, 'Vũ khí tầm xa: +60% tầm bắn; đạn bay thẳng tuyệt đối và xuyên qua 1 lớp tường gỗ / thân cây đổ mà không mất sát thương.', { only: 'ranged' });
  S('R_RNG_02', 5, 'Hồn Titan Phá Giới', { phys: 0.22, hp: 500, reach: 1.0 }, {
    onAuto(m, u, t, info) { if (u.ranged) return; const k = info.amt * 0.6, v = M.dir(u, t); info.extra.push(() => m.hitLine(u, t.x, t.y, v.x, v.y, 1.6, 0.9, (e) => { if (e !== t) m.damage(u, e, k, 'phys', { tag: 'p', aoe: true }); }, { color: '#e8e0ff', noFx: true })); } },
  'Vũ khí cận chiến: +1.0 đv tầm với; mọi đòn đánh phóng sóng chân không kéo dài thêm 1.6 đv phía trước, gây 60% sát thương đòn đánh lên kẻ đứng ngoài tầm với.', { only: 'melee' });
  S('R_RNG_03', 5, 'Hồn Định Vị Thiện Xạ', { phys: 0.20, crit: 0.20 }, {
    afterDeal(m, u, t, info) { if (!info.auto || !u.ranged || t.kind !== 'hero' || M.dist(u, t) <= 12) return; const C0 = u.ws.rrng3 || (u.ws.rrng3 = {}); if (C0[t.id] > m.time) return; C0[t.id] = m.time + 6; m.addStatus(t, 'stun', 0.75, 1, { src: u }); if (t.cast && !t.cast.unstop) m.interrupt(t); m.addStatus(t, 'slow', 2, 0.6, { src: u, key: 'rrng3' }); } },
  'Vũ khí tầm xa: bắn trúng tướng ở xa hơn 12 đv — tê liệt 0.75s (ngắt chiêu đang niệm) và làm chậm 60% trong 2s (mỗi mục tiêu tối đa 1 lần / 6s).', { only: 'ranged' });

  // ===================== HOÀNG KIM / RỰC RỠ (6 ô — chỉ từ Quái Thú Hoàng Kim / Kiếm Sư Vĩ Đại) =====================
  S('RAD_RL_01', 6, 'Hồn Kim Thần Tiếp Đạn', { rl: 1.0, as: 0.35, phys: 0.25 }, { tick(m, u) { const g = gunOf(m, u); if (g && g.n < g.max) gunAdd(m, u, 2); } },
    'Không còn hoạt ảnh nạp đạn: vũ khí tự nạp ngầm 1 viên mỗi 0.25s, kể cả khi đang lướt hay dùng chiêu.', { gun: true, boss: true, rad: true });
  S('RAD_RL_02', 6, 'Hồn Kim Quang Chấn Diệt', { rl: 0.80, hp: 800, ga: 400 }, {
    onReloadStart(m, u) { if (rdy(m, u, 'radrl2', 3)) m.hitCircle(u, u.x, u.y, 3.2, (e) => { if (e.kind === 'hero') m.addStatus(e, 'blind', 1.5, 1, { src: u }); }, { color: '#fff099', fx: 'boom' }); },
    onReload(m, u) { u.ws.radN = 3; },
    onDeal(m, u, t, info) { if (info.auto && u.ws.radN > 0) { u.ws.radN--; byp(info, 1); info.amt *= 1.3; } } },
  'Mỗi lần nạp: hào quang kim sắc làm MÙ mọi tướng địch quanh 3.2 đv trong 1.5s. 3 viên đầu băng mới +30% sát thương và bỏ qua 100% Hộ Giáp.', { gun: true, boss: true, rad: true });
  S('RAD_AS_01', 6, 'Hồn Cực Phong Thần Kiếm', { as: 0.65, phys: 0.25 }, { onSkill(m, u, key) { if (key === 's4') m.addStatus(u, 'buff', 4, 1, { key: 'radas1', mods: { asPct: 1 } }); } },
    '4s sau khi dùng chiêu cuối: tốc độ ra đòn ×2.', { boss: true, rad: true });
  S('RAD_VIS_01', 6, 'Hồn Toàn Giác Vạn Vật', { hp: 1000, ga: 350, ms: 0.15 }, {
    tick(m, u) { for (const e of foesIn(m, u, 48)) sense(m, u, e, 0.7); },
    onDeal(m, u, t, info) {
      if (!foeHero(u, t) || !(info.auto || isSkill(info))) return;
      const v = M.dir(t, u); if ((t.fx || 0) * v.x + (t.fy || 0) * v.y > 0) return;   // mục tiêu đang nhìn về phía mình → không bất ngờ
      const C0 = u.ws.radv || (u.ws.radv = {}); if (C0[t.id] > m.time) return; C0[t.id] = m.time + 15;
      info.amt *= 2; (info.post || (info.post = [])).push(() => t.alive && m.addStatus(t, 'stun', 1.25, 1, { src: u })); call(m, u, '👁 Đòn Bất Ngờ', '#fff099');
    } },
  'Xóa điểm mù: thấy rõ mọi kẻ địch trong 48 đv (kể cả nấp bụi, tàng hình, bay trên không). Đòn bất ngờ đầu tiên vào kẻ không nhìn về phía mình: ×2 sát thương và choáng 1.25s (mỗi mục tiêu 1 lần / 15s).', { boss: true, rad: true });
  S('RAD_RNG_01', 6, 'Hồn Thần Vũ Phá Hư Không', { phys: 0.35, ms: 0.12, cdr: 0.15, rng: 0.80, reach: 1.6 }, {
    onDeal(m, u, t, info) { if (!foeHero(u, t) || !(info.auto || isSkill(info))) return; const blind = !u.vis[t.team] || ((t.fx || 0) * (u.x - t.x) + (t.fy || 0) * (u.y - t.y) < 0); if (!blind) return; byp(info, 1); if (!info.crit) { info.crit = true; info.amt *= 2; } } },
  'Tự thích ứng: tầm xa +80% tầm bắn, cận chiến +1.6 đv tầm với. Mọi đòn đánh tung ra từ ngoài tầm nhìn của mục tiêu (nó không thấy mình hoặc quay lưng): chắc chắn chí mạng ×2 và bỏ qua 100% Hộ Giáp.', { boss: true, rad: true });

  const SHARDS = {}; for (const s of LIST) SHARDS[s.id] = s;
  const BY_TIER = [[], [], [], [], [], [], []];
  for (const s of LIST) if (!s.boss) BY_TIER[s.t].push(s.id);
  // mô tả ngắn của một mảnh (chỉ số + nội tại)
  function shardText(sh) {
    const d = SHARDS[sh.id || sh]; if (!d) return '';
    const parts = Object.keys(d.st).filter((k) => STAT[k] && k !== 'airDash').map((k) => STAT[k].fmt(d.st[k]));
    return parts.join(', ') + (d.d ? ' — ' + d.d : '');
  }
  // biểu tượng đại diện của mảnh (chỉ số chính)
  function shardIcon(id) { const d = SHARDS[id && id.id ? id.id : id]; if (!d) return '💠'; if (d.boss) return '✨'; const k = Object.keys(d.st)[0]; return (STAT[k] && STAT[k].icon) || '💠'; }
  G.shardIcon = shardIcon;
  G.SOUL_TIER = SOUL_TIER; G.SHARDS = SHARDS; G.SHARD_LIST = LIST; G.SHARD_BY_TIER = BY_TIER; G.SHARD_STAT = STAT; G.SHARD_BONUS_KEY = BONUS_KEY; G.SHARD_FLAG = FLAG; G.shardText = shardText;
  G.shardRdy = rdy; G.shardReady = ready;
})();
