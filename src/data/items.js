'use strict';
// ===== TRANG BỊ: 42 món hoàn chỉnh (6 ô) =====
// Mỗi món hoàn chỉnh có đúng 1 phôi (≈40% giá, ≈40% chỉ số) — thứ tự lên đồ chỉ ghi món hoàn chỉnh, thiếu vàng thì mua phôi trước.
// Giày dùng chung phôi Giày Vải; đồ đi rừng dùng chung phôi Dao Rừng; Lệnh Bài Chinh Phạt là đồ khởi điểm (không có phôi).
// Hiệu ứng riêng của mỗi món không cộng dồn với chính nó (mỗi tướng chỉ giữ 1 bản mỗi món).
// hooks: onAuto(m,u,t,info) • afterDeal(m,u,t,info,dealt) • onTake(m,u,att,info) • afterTake(m,u,att,info,dealt)
//        tick(m,u) mỗi 0.5s • onMonsterKill(m,u,mon) • onSmite(m,u,t)
// flags (cộng vào u.bonus, lõi trận đọc trực tiếp): overheal critMult apPct structAmp critRed autoRed spellShield monsterAmp
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const M = G.M;
  const ITEMS = {};
  const LIST = [];
  const CATS = { ad: 'Công vật lý', ap: 'Phép', def: 'Phòng thủ', sup: 'Hỗ trợ', boots: 'Giày', jungle: 'Đi rừng', active: 'Kích hoạt' };
  const STAT_NAME = {
    ad: 'SMVL', ap: 'SMPT', hp: 'Máu', mp: 'Mana', hpr: 'Hồi máu/s', mpr: 'Hồi mana/s', armor: 'Giáp', mr: 'Kháng phép',
    asPct: 'Tốc đánh', crit: 'Chí mạng', cdr: 'Giảm hồi chiêu', msPct: 'Tốc chạy', lifesteal: 'Hút máu', tenacity: 'Kháng hiệu ứng',
    armorPen: 'Xuyên giáp', armorPenFlat: 'Xuyên giáp', magicPen: 'Xuyên phép', magicPenFlat: 'Xuyên phép',
  };
  const PCT = { asPct: 1, crit: 1, cdr: 1, msPct: 1, lifesteal: 1, tenacity: 1, armorPen: 1, magicPen: 1 };
  // thẻ không phải chiêu: đánh thường, nội tại, sát thương theo thời gian, hiệu ứng trang bị…
  const NON_SKILL = { auto: 1, p: 1, dot: 1, item: 1, tower: 1, smite: 1, fountain: 1, spell: 1, slam: 1, mount: 1, '': 1 };
  const isSkill = (info) => !info.auto && !NON_SKILL[info.tag];
  const isFoe = (u, t) => t && t.alive && t.team !== u.team;
  const ready = (m, u, id) => !(u.icd[id] > m.time);

  function round(k, v) { return PCT[k] ? Math.round(v * 100) / 100 : Math.round(v); }
  function statText(st) {
    return Object.keys(st).filter((k) => STAT_NAME[k]).map((k) => `+${PCT[k] ? Math.round(st[k] * 100) + '%' : st[k]} ${STAT_NAME[k]}`).join(' · ');
  }
  // đăng ký 1 món; tự sinh phôi nếu chưa chỉ định phôi dùng chung
  function item(o) {
    o.stats = o.stats || {}; o.flags = o.flags || {};
    if (o.comp === undefined) {
      const c = { id: o.id + '_p', name: 'Phôi ' + (o.short || o.name), cat: o.cat, cost: Math.round(o.cost * 0.4 / 50) * 50, stats: {}, flags: {}, isComp: true, into: [o.id] };
      for (const k in o.stats) c.stats[k] = round(k, o.stats[k] * 0.4);
      c.desc = statText(c.stats);
      ITEMS[c.id] = c; o.comp = c.id;
    } else if (o.comp) ITEMS[o.comp].into.push(o.id);
    o.statText = statText(o.stats);
    ITEMS[o.id] = o; LIST.push(o);
    return o;
  }
  function comp(o) { o.isComp = true; o.into = []; o.flags = o.flags || {}; o.desc = o.desc || statText(o.stats); ITEMS[o.id] = o; return o; }
  // gộp tầng hiệu ứng giảm chỉ số lên mục tiêu (Rìu Hắc Thiết…)
  function stackDebuff(m, src, t, key, max, dur, mods) {
    let s = t.hasKey(key);
    const n = s ? Math.min(max, (s.n || 1) + 1) : 1;
    s = m.addStatus(t, 'buff', dur, 1, { key, src, mods: mods(n) });
    if (s) { s.n = n; s.mods = mods(n); s.t = dur; }
    return n;
  }
  const nearestFoeHero = (m, u, R) => m.nearestEnemyHero(u, R, true);
  const alliesIn = (m, u, R) => m.heroes.filter((h) => h.alive && h.team === u.team && M.dist(h, u) <= R);

  // ======================= CÔNG VẬT LÝ (9) =======================
  item({ id: 'huyet_kiem', name: 'Huyết Kiếm Đoạt Mệnh', short: 'Huyết Kiếm', cat: 'ad', cost: 2600, stats: { ad: 55, lifesteal: 0.15 }, flags: { overheal: 1 },
    uniq: 'Hút máu khi đầy máu chuyển thành lá chắn (tối đa 60 + 12/cấp).',
    why: 'Trụ đường trước đội cấu rỉa', weak: 'Vết Thương Sâu' });
  item({ id: 'dao_pha_quan', name: 'Đao Phá Quân', short: 'Phá Quân', cat: 'ad', cost: 2900, stats: { ad: 60, crit: 0.2 }, flags: { critMult: 0.5 },
    uniq: 'Chí mạng gây 225% sát thương (thay vì 175%).', why: 'Đội máu giấy', weak: 'Giáp, Áo Choàng Bóng Đêm' });
  item({ id: 'cung_gio_loc', name: 'Cung Gió Lốc', short: 'Gió Lốc', cat: 'ad', cost: 2600, stats: { asPct: 0.35, crit: 0.2, msPct: 0.05 },
    uniq: 'Mỗi đòn đánh thứ 3 nảy sang 2 mục tiêu gần đó (60% SMVL).', why: 'Đội đứng dồn; dọn lính nhanh', weak: 'Đấu tay đôi với đỡ đòn',
    hooks: {
      onAuto(m, u, t, info) {
        u.istate.cgl = ((u.istate.cgl || 0) + 1) % 3;
        if (u.istate.cgl) return;
        const dmg = u.st.ad * 0.6;
        info.extra.push(() => {
          const near = m.enemiesIn(u.team, t.x, t.y, 4).filter((e) => e !== t && e.kind !== 'tower' && e.kind !== 'nexus')
            .sort((a, b) => M.dist2(a, t) - M.dist2(b, t) || a.id - b.id).slice(0, 2);
          for (const e of near) { m.damage(u, e, dmg, 'phys', { tag: 'item', noHook: true }); if (m.fxOn) m.fx({ type: 'line', x: t.x, y: t.y, x2: e.x, y2: e.y, w: 0.15, color: '#cfe8ff' }); }
        });
      },
    } });
  item({ id: 'mui_khoan', name: 'Mũi Khoan Thép', short: 'Mũi Khoan', cat: 'ad', cost: 2800, stats: { ad: 40, armorPen: 0.3 },
    uniq: '', why: 'Đội nhiều giáp', weak: 'Phí vàng khi địch ít giáp' });
  item({ id: 'dao_cat_gan', name: 'Dao Cắt Gân', short: 'Cắt Gân', cat: 'ad', cost: 2200, stats: { ad: 30, asPct: 0.25 },
    uniq: 'Đánh thường gây Vết Thương Sâu 3s (−40% hồi máu).', why: 'Đội hồi máu / hút máu', weak: 'Chỉ số thấp',
    hooks: { onAuto(m, u, t, info) { if (t.kind === 'hero') info.extra.push(() => m.addStatus(t, 'wound', 3, 1, { src: u })); } } });
  item({ id: 'song_dao', name: 'Song Đao Tàn Huyết', short: 'Song Đao', cat: 'ad', cost: 2800, stats: { asPct: 0.35, ad: 30 },
    uniq: 'Đánh thường +3% máu hiện tại của mục tiêu (tối đa 60 với quái/lính).', why: 'Đỡ đòn nhiều máu', weak: 'Mục tiêu ít máu',
    hooks: { onAuto(m, u, t, info) { const b = t.hp * 0.03; info.amt += t.kind === 'hero' ? b : Math.min(60, b); } } });
  item({ id: 'dao_am_anh', name: 'Dao Ám Ảnh', short: 'Ám Ảnh', cat: 'ad', cost: 2500, stats: { ad: 50, armorPenFlat: 12 },
    uniq: 'Đòn đánh đầu tiên lên tướng sau khi bước ra từ bụi cỏ / sương mù: +40 (+4/cấp) sát thương và làm chậm 30% 1.5s (10s).',
    why: 'Đội máu giấy, thiếu tầm nhìn', weak: 'Mất giá trị cuối trận',
    hooks: {
      tick(m, u) { if (u.bush >= 0 || !u.visAny) u.istate.hid = m.time; },
      onAuto(m, u, t, info) {
        if (t.kind !== 'hero' || !ready(m, u, 'dao_am_anh') || m.time - (u.istate.hid || -99) > 1.5) return;
        u.icd.dao_am_anh = m.time + 10; info.amt += 40 + 4 * u.level;
        info.extra.push(() => m.addStatus(t, 'slow', 1.5, 0.3, { src: u }));
      },
    } });
  item({ id: 'riu_hac_thiet', name: 'Rìu Hắc Thiết', short: 'Hắc Thiết', cat: 'ad', cost: 3000, stats: { ad: 40, hp: 350, cdr: 0.15 },
    uniq: 'Đánh trúng tướng giảm 5% giáp mỗi tầng (tối đa 6 tầng, 6s).', why: 'Đỡ đòn, giao tranh dài', weak: 'Bị dồn chết nhanh',
    hooks: { afterDeal(m, u, t, info) { if (t.kind === 'hero' && (info.auto || isSkill(info))) stackDebuff(m, u, t, 'riu_hac_thiet', 6, 6, (n) => ({ armorPct: -0.05 * n })); } } });

  // ======================= PHÉP (7) =======================
  item({ id: 'mu_hoa_than', name: 'Mũ Hỏa Thần', short: 'Hỏa Thần', cat: 'ap', cost: 3200, stats: { ap: 110 }, flags: { apPct: 0.25 },
    uniq: '+25% sức mạnh phép.', why: 'Đội máu giấy', weak: 'Không phòng thủ, kháng phép' });
  item({ id: 'truong_hu_vo', name: 'Trượng Hư Vô', short: 'Hư Vô', cat: 'ap', cost: 2700, stats: { ap: 65, magicPen: 0.35 },
    uniq: '', why: 'Đội lên kháng phép', weak: 'Phí vàng khi địch ít kháng phép' });
  item({ id: 'bua_tro_tan', name: 'Bùa Tro Tàn', short: 'Tro Tàn', cat: 'ap', cost: 2500, stats: { ap: 60, hp: 250 },
    uniq: 'Chiêu trúng tướng gây thiêu đốt 3s và Vết Thương Sâu.', why: 'Đội hồi máu', weak: 'Sát thương dồn thấp',
    hooks: { afterDeal(m, u, t, info) { if (t.kind === 'hero' && isSkill(info)) { m.dot(u, t, 6 + 0.6 * u.level + 0.02 * u.st.ap, 3, 'magic', 'bua_tro_tan'); m.addStatus(t, 'wound', 3, 1, { src: u }); } } } });
  item({ id: 'gay_bang_gia', name: 'Gậy Băng Giá', short: 'Băng Giá', cat: 'ap', cost: 2600, stats: { ap: 60, hp: 350 },
    uniq: 'Chiêu gây sát thương làm chậm 25% trong 1s (chiêu diện rộng 15%).', why: 'Tướng lao vào, tướng cơ động', weak: 'Sát thương thấp hơn',
    hooks: { afterDeal(m, u, t, info) { if (isSkill(info) && t.kind !== 'tower' && t.kind !== 'nexus' && !t.big) m.addStatus(t, 'slow', 1, info.aoe ? 0.15 : 0.25, { src: u, key: 'gay_bang_gia' }); } } });
  item({ id: 'ngoc_hien_triet', name: 'Ngọc Hiền Triết', short: 'Hiền Triết', cat: 'ap', cost: 2500, stats: { ap: 55, mp: 300, mpr: 2, cdr: 0.1 },
    uniq: 'Chiêu trúng tướng hồi 3% mana tối đa (1 lần mỗi giây).', why: 'Đi đường dài, cấu rỉa liên tục', weak: 'Bị dồn sớm',
    hooks: { afterDeal(m, u, t, info) { if (t.kind === 'hero' && isSkill(info) && ready(m, u, 'ngoc_hien_triet')) { u.icd.ngoc_hien_triet = m.time + 1; u.mp = Math.min(u.st.maxMp, u.mp + u.st.maxMp * 0.03); } } } });
  item({ id: 'mat_na', name: 'Mặt Nạ Nguyền Rủa', short: 'Mặt Nạ', cat: 'ap', cost: 2700, stats: { ap: 55, hp: 400 },
    uniq: 'Sát thương phép đốt 1% máu tối đa mỗi giây trong 3s; mục tiêu nhận thêm 10% sát thương phép.', why: 'Đỡ đòn', weak: 'Tướng máu giấy',
    hooks: { afterDeal(m, u, t, info) {
      if (info.type !== 'magic' || info.tag === 'dot' || info.tag === 'item' || t.kind === 'tower' || t.kind === 'nexus') return;
      t.cursedT = m.time + 3;
      m.dot(u, t, Math.min(t.kind === 'hero' ? 999 : 30, t.st.maxHp * 0.01), 3, 'magic', 'mat_na');
    } } });
  item({ id: 'phap_chau', name: 'Pháp Châu Sấm Sét', short: 'Sấm Sét', cat: 'ap', cost: 2600, stats: { ap: 65, msPct: 0.05, magicPenFlat: 12 },
    uniq: 'Mỗi 8s, chiêu trúng tướng phóng sét gây thêm 50 (+5/cấp, +25% SMPT) sát thương phép.', why: 'Bắt lẻ xạ thủ/pháp sư', weak: 'Giao tranh kéo dài',
    hooks: { afterDeal(m, u, t, info) {
      if (t.kind !== 'hero' || !isSkill(info) || !ready(m, u, 'phap_chau')) return;
      u.icd.phap_chau = m.time + 8;
      m.damage(u, t, 50 + 5 * u.level + 0.25 * u.st.ap, 'magic', { tag: 'item', noHook: true });
      if (m.fxOn) m.fx({ type: 'line', x: t.x, y: t.y - 4, x2: t.x, y2: t.y, w: 0.3, color: '#9fd8ff' });
    } } });

  // ======================= PHÒNG THỦ (8) =======================
  item({ id: 'giap_gai', name: 'Giáp Gai', short: 'Giáp Gai', cat: 'def', cost: 2500, stats: { armor: 60, hp: 250 },
    uniq: 'Bị tướng đánh thường: phản 12 (+10% giáp, +1/cấp) sát thương phép và gây Vết Thương Sâu 3s.', why: 'Xạ thủ hút máu', weak: 'Pháp sư',
    hooks: { onTake(m, u, att, info) {
      if (!info.auto || !att || att.kind !== 'hero' || !att.alive) return;
      m.damage(u, att, 12 + 0.1 * u.st.armor + u.level, 'magic', { tag: 'item', noHook: true });
      m.addStatus(att, 'wound', 3, 1, { src: u, key: 'giap_gai' });
    } } });
  item({ id: 'khien_bang', name: 'Khiên Băng Vĩnh Cửu', short: 'Khiên Băng', cat: 'def', cost: 2600, stats: { armor: 55, mp: 300, cdr: 0.15 },
    uniq: 'Kẻ đánh thường vào bạn bị −15% tốc đánh 1.5s.', why: 'Đội dựa đánh thường', weak: 'Đội dựa chiêu',
    hooks: { onTake(m, u, att, info) { if (info.auto && att && (att.kind === 'hero' || att.kind === 'pet') && att.team !== u.team) m.addStatus(att, 'buff', 1.5, 1, { key: 'khien_bang', mods: { asPct: -0.15 } }); } } });
  item({ id: 'ao_hu_khong', name: 'Áo Choàng Hư Không', short: 'Hư Không', cat: 'def', cost: 2500, stats: { mr: 55, hp: 300 },
    uniq: 'Sát thương phép làm máu xuống dưới 35%: nhận lá chắn 120 (+12/cấp) trong 4s (60s).', why: 'Pháp sư dồn', weak: 'Vật lý',
    hooks: { afterTake(m, u, att, info) {
      if (info.type !== 'magic' || u.hpPct >= 0.35 || !ready(m, u, 'ao_hu_khong')) return;
      u.icd.ao_hu_khong = m.time + 60; m.shield(u, u, 120 + 12 * u.level, 4);
    } } });
  item({ id: 'tim_cu_thach', name: 'Trái Tim Cự Thạch', short: 'Cự Thạch', cat: 'def', cost: 2800, stats: { hp: 800 },
    uniq: 'Hồi 1% máu tối đa mỗi giây khi 4s không trúng đòn (0.2% khi đang giao tranh).', why: 'Đội cấu rỉa', weak: 'Sát thương % máu, giảm hồi máu',
    hooks: { tick(m, u) { if (u.hp < u.st.maxHp) m.heal(u, u, u.st.maxHp * (m.time - u.lastDmgT > 4 ? 0.005 : 0.001), true); } } });
  item({ id: 'ao_bong_dem', name: 'Áo Choàng Bóng Đêm', short: 'Bóng Đêm', cat: 'def', cost: 2400, stats: { armor: 50, hp: 300 }, flags: { critRed: 0.3 },
    uniq: 'Giảm 30% sát thương chí mạng nhận vào.', why: 'Xạ thủ chí mạng', weak: 'Tướng không chí mạng' });
  item({ id: 'mu_tran_hon', name: 'Mũ Trấn Hồn', short: 'Trấn Hồn', cat: 'def', cost: 2400, stats: { mr: 45, hp: 350, tenacity: 0.3 },
    uniq: '', why: 'Đội nhiều khống chế', weak: 'Ít chỉ số thô' });
  item({ id: 'ao_thanh_linh', name: 'Áo Choàng Thánh Linh', short: 'Thánh Linh', cat: 'def', cost: 2700, stats: { mr: 50, hp: 350 }, flags: { spellShield: 1 },
    uniq: 'Lá chắn phép chặn 1 chiêu của tướng địch (cả sát thương lẫn khống chế), hồi 40s.', why: 'Mở giao tranh bằng 1 chiêu', weak: 'Chiêu liên tục, đánh thường' });
  item({ id: 'vuong_mien', name: 'Vương Miện Bất Khả Xâm Phạm', short: 'Vương Miện', cat: 'def', cost: 2900, stats: { armor: 35, mr: 35, hp: 350 },
    uniq: 'Máu xuống dưới 30%: nhận lá chắn 180 (+18/cấp) trong 3s (90s).', why: 'Bắt lẻ, dồn sát thương', weak: 'Sát thương kéo dài, thiêu đốt',
    hooks: { afterTake(m, u) { if (u.hpPct < 0.3 && ready(m, u, 'vuong_mien')) { u.icd.vuong_mien = m.time + 90; m.shield(u, u, 180 + 18 * u.level, 3); if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffe9a0', life: 3 }); } } } });

  // ======================= HỖ TRỢ (5) =======================
  item({ id: 'lenh_bai', name: 'Lệnh Bài Chinh Phạt', short: 'Lệnh Bài', cat: 'sup', cost: 400, stats: { hp: 60, hpr: 0.6 }, comp: null, starter: true,
    uniq: 'Đồ khởi điểm hỗ trợ: +10 vàng khi đánh trúng tướng địch (5s); +6 vàng khi lính địch chết trong 8 đv quanh bạn.', why: 'Thu nhập cho vị trí không ăn lính', weak: 'Gần như không có chỉ số',
    hooks: {
      afterDeal(m, u, t, info) { if (t.kind === 'hero' && (info.auto || isSkill(info)) && ready(m, u, 'lenh_bai')) { u.icd.lenh_bai = m.time + 5; m.gainGold(u, 10); } },
      onMinionDeathNear(m, u) { m.gainGold(u, 6); },
    } });
  item({ id: 'lu_huong', name: 'Lư Hương Cổ', short: 'Lư Hương', cat: 'sup', cost: 2300, stats: { ap: 40, mpr: 2, cdr: 0.1 },
    uniq: 'Hồi máu hoặc tạo lá chắn cho đồng minh: đồng minh đó +15% tốc đánh 6s.', why: 'Đội dồn tài nguyên cho 1 xạ thủ', weak: 'Bị dồn mục tiêu trước',
    hooks: { onAllyCare(m, u, t) { if (t !== u && t.kind === 'hero') m.addStatus(t, 'buff', 6, 1, { key: 'lu_huong', mods: { asPct: 0.15 } }); } } });
  item({ id: 'ngoc_boi', name: 'Ngọc Bội Hộ Mệnh', short: 'Ngọc Bội', cat: 'sup', cost: 2400, stats: { armor: 30, mr: 30, hp: 200 },
    uniq: 'Kích hoạt: lá chắn 120 (+20/cấp) cho đồng minh trong 7 đv, 2.5s (90s).', why: 'Sát thương diện rộng', weak: 'Sát thương kéo dài',
    active: { name: 'Hộ Mệnh', cd: 90,
      use(m, u) { for (const a of alliesIn(m, u, 7)) m.shield(u, a, 120 + 20 * u.level, 2.5); if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: 7, color: '#ffe9a0' }); return true; },
      ai(m, u, c) { const hurt = alliesIn(m, u, 7).filter((a) => m.time - a.lastDmgT < 1 && a.hpPct < 0.6).length; return c.fight && hurt >= 2 ? {} : null; } } });
  item({ id: 'chuong_thuc_tinh', name: 'Chuông Thức Tỉnh', short: 'Thức Tỉnh', cat: 'sup', cost: 2200, stats: { hp: 250, mp: 250, cdr: 0.1 },
    uniq: 'Đồng minh trong 8 đv tiến về phía tướng địch gần đó: +15% tốc chạy.', why: 'Đội địch thả diều', weak: 'Đội địch lao vào',
    hooks: { tick(m, u) {
      const e = nearestFoeHero(m, u, 14); if (!e) return;
      for (const a of alliesIn(m, u, 8)) if ((e.x - a.x) * a.vx + (e.y - a.y) * a.vy > 0) m.addStatus(a, 'haste', 0.7, 0.15, { key: 'chuong' });
    } } });
  item({ id: 'kinh_cu_dem', name: 'Kính Cú Đêm', short: 'Cú Đêm', cat: 'sup', cost: 2200, stats: { hp: 250, cdr: 0.1 },
    uniq: 'Kích hoạt: cắm đèn soi tầm nhìn 9 đv trong 75s, giữ tối đa 2 đèn (hồi 45s). Nguồn tầm nhìn cắm được duy nhất.', why: 'Rừng địch, tướng tàng hình', weak: 'Ít chỉ số chiến đấu',
    active: { name: 'Cắm Đèn', cd: 45,
      use(m, u, o) { if (!o || !o.pt) return false; m.placeWard(u, o.pt.x, o.pt.y, 75); return true; },
      ai() { return null; } } });   // đấu trường: AI không tự cắm đèn

  // ======================= GIÀY (5) =======================
  comp({ id: 'giay_vai', name: 'Giày Vải', cat: 'boots', cost: 300, stats: { msPct: 0.07 }, boots: true });
  const boots = (o) => item(Object.assign({ cat: 'boots', comp: 'giay_vai', boots: true }, o));
  boots({ id: 'giay_thep', name: 'Giày Thép', cost: 1000, stats: { msPct: 0.1, armor: 20 }, flags: { autoRed: 0.12 }, uniq: 'Giảm 12% sát thương đánh thường nhận vào.', why: 'Xạ thủ, đánh thường' });
  boots({ id: 'giay_thuy_ngan', name: 'Giày Thủy Ngân', cost: 1000, stats: { msPct: 0.1, mr: 25, tenacity: 0.3 }, uniq: '', why: 'Pháp sư, khống chế' });
  boots({ id: 'giay_cuong_chien', name: 'Giày Cuồng Chiến', cost: 1000, stats: { msPct: 0.1, asPct: 0.35 }, uniq: '', why: 'Xạ thủ' });
  boots({ id: 'giay_khai_sang', name: 'Giày Khai Sáng', cost: 900, stats: { msPct: 0.1, cdr: 0.15 }, uniq: '', why: 'Tướng dựa chiêu' });
  boots({ id: 'giay_dinh_gi', name: 'Giày Đinh Gỉ', cost: 900, stats: { msPct: 0.16 }, uniq: 'Thêm 8% tốc chạy khi 5s không giao tranh.', why: 'Đảo đường, chia đẩy',
    hooks: { tick(m, u) { if (m.time - u.combatT > 5) m.addStatus(u, 'haste', 0.7, 0.08, { key: 'dinh_gi' }); } } });

  // ======================= KÍCH HOẠT (5) =======================
  item({ id: 'dong_ho_cat', name: 'Đồng Hồ Cát Nghịch Đảo', short: 'Đồng Hồ Cát', cat: 'active', cost: 2600, stats: { ap: 65, armor: 40 },
    uniq: 'Kích hoạt: bất động và miễn sát thương 2.5s (120s).', why: 'Sát thủ dồn; né chiêu cuối',
    active: { name: 'Nghịch Đảo', cd: 120,
      use(m, u) { m.addStatus(u, 'invuln', 2.5, 1); m.addStatus(u, 'stun', 2.5, 1, { key: 'stasis' }); u.cast = null; u.dash = null; if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffd700', life: 2.5 }); return true; },
      ai(m, u, c) { return u.hpPct < 0.22 && c.enemies.some((e) => M.dist(e, u) < 7) && m.time - u.lastDmgT < 0.5 ? {} : null; }, react: true } });
  item({ id: 'khan_thanh_tay', name: 'Khăn Thanh Tẩy', short: 'Thanh Tẩy', cat: 'active', cost: 2600, stats: { ad: 40, mr: 35 },
    uniq: 'Kích hoạt: xóa mọi hiệu ứng khống chế (90s).', why: 'Khống chế cứng',
    active: { name: 'Thanh Tẩy', cd: 90, react: true,
      use(m, u) { m.cleanse(u); if (u.dash && u.dash.cc) u.dash = null; if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffffff', life: 0.6 }); return true; },
      ai(m, u, c) {
        let left = 0; for (const s of u.statuses) if (G.STATUS[s.type] && G.STATUS[s.type].hard && s.key !== 'stasis') left = Math.max(left, s.t);
        return left > 0.6 && c.enemies.some((e) => M.dist(e, u) < 8) ? {} : null;
      } } });
  item({ id: 'xich_hon', name: 'Xích Hồn Đồng Quy', short: 'Xích Hồn', cat: 'active', cost: 2500, stats: { ad: 40, hp: 300 },
    uniq: 'Kích hoạt: lao tới tướng địch trong 6 đv, làm chậm 40% 2s (60s).', why: 'Đội thả diều',
    active: { name: 'Đồng Quy', cd: 60,
      use(m, u, o) {
        const t = o && o.tgt; if (!t || !t.alive || M.dist(u, t) > 6.5 || u.rooted || u.has('nodash')) return false;
        const v = M.dir(u, t), d = Math.max(0, M.dist(u, t) - t.r - u.r - 0.2);
        m.dashTo(u, u.x + v.x * d, u.y + v.y * d, 20, { onEnd: (mm) => { if (t.alive) mm.addStatus(t, 'slow', 2, 0.4, { src: u }); } });
        return true;
      },
      ai(m, u, c) { const t = c.target; return c.fight && t && t.kind === 'hero' && t.alive && M.dist(u, t) > u.st.range + 1 && M.dist(u, t) < 6 && t.hpPct < 0.7 ? { tgt: t } : null; } } });
  item({ id: 'thuy_tinh', name: 'Thủy Tinh Sinh Mệnh', short: 'Thủy Tinh', cat: 'active', cost: 2500, stats: { hp: 300, mr: 30, cdr: 0.1 },
    uniq: 'Kích hoạt: sau 1.5s hồi 100 (+20/cấp) máu cho đồng minh trong 6 đv (90s).', why: 'Cấu rỉa trước giao tranh, giao tranh kéo dài',
    active: { name: 'Sinh Mệnh', cd: 90,
      use(m, u) {
        const x = u.x, y = u.y;
        if (m.fxOn) m.fx({ type: 'ring', x, y, r: 6, color: '#8effa0' });
        m.later(1.5, (mm) => { for (const a of mm.heroes) if (a.alive && a.team === u.team && M.dist(a, { x, y }) <= 6) mm.heal(u, a, 100 + 20 * u.level); });
        return true;
      },
      ai(m, u, c) { return alliesIn(m, u, 6).filter((a) => a.hpPct < 0.6).length >= 2 ? {} : null; } } });

  // ======================= XOAY VÒNG (GĐ5c): 10 món, mỗi bản cập nhật chỉ 5 món có trong cửa hàng =======================
  // rot: true • alt: { arch: [kiểu lên đồ], for: món trong lối lên đồ mặc định mà AI thay bằng món này khi món có mặt }
  item({ id: 'kiem_bao_tap', name: 'Kiếm Bão Táp', short: 'Bão Táp', cat: 'ad', cost: 2700, stats: { ad: 45, crit: 0.15, msPct: 0.05 }, rot: true, alt: { arch: ['fighter'], for: 'song_dao' },
    uniq: 'Hạ gục / hỗ trợ hạ tướng: +30% tốc chạy 2s và hồi 8% máu tối đa.', why: 'Giao tranh dây chuyền', weak: 'Bị khống chế trước khi kịp hạ ai',
    hooks: { onKill(m, u) { m.addStatus(u, 'haste', 2, 0.3); m.heal(u, u, u.st.maxHp * 0.08); }, onAssist(m, u) { m.addStatus(u, 'haste', 2, 0.3); m.heal(u, u, u.st.maxHp * 0.08); } } });
  item({ id: 'cung_than_phong', name: 'Cung Thần Phong', short: 'Thần Phong', cat: 'ad', cost: 2800, stats: { asPct: 0.4, ad: 25 }, rot: true, alt: { arch: ['marksman'], for: 'song_dao' },
    uniq: 'Đánh thường liên tục cùng một mục tiêu: mỗi đòn +5% sát thương (tối đa 5 tầng, mất khi đổi mục tiêu hoặc 3s không đánh).', why: 'Đấu tay đôi, đỡ đòn nhiều máu', weak: 'Phải đổi mục tiêu liên tục',
    hooks: { onAuto(m, u, t, info) { const st = u.istate; if (st.ctpT !== t.id || m.time - (st.ctpL || -9) > 3) st.ctpN = 0; st.ctpT = t.id; st.ctpL = m.time; info.amt *= 1 + 0.05 * st.ctpN; st.ctpN = Math.min(5, st.ctpN + 1); } } });
  item({ id: 'dao_tu_than', name: 'Dao Tử Thần', short: 'Tử Thần', cat: 'ad', cost: 2900, stats: { ad: 55, armorPenFlat: 15 }, rot: true, alt: { arch: ['fighter'], for: 'xich_hon' },
    uniq: 'Đòn đánh và chiêu lên tướng dưới 35% máu: +12% sát thương.', why: 'Dứt điểm', weak: 'Đỡ đòn hồi máu nhanh',
    hooks: { onDeal(m, u, t, info) { if (t.kind === 'hero' && t.hpPct < 0.35) info.amt *= 1.12; } } });
  item({ id: 'tram_than_ky', name: 'Trâm Thần Kỳ', short: 'Thần Kỳ', cat: 'ap', cost: 2700, stats: { ap: 70, cdr: 0.15 }, rot: true, alt: { arch: ['mage'], for: 'dong_ho_cat' },
    uniq: 'Dùng chiêu cuối: hồi ngay 20% hồi chiêu còn lại của S1–S3.', why: 'Chiêu cuối hồi nhanh', weak: 'Không phòng thủ',
    hooks: { tick(m, u) { const c = u.cd.s4 || 0; if (c > (u.istate.ttkC || 0) + 5) for (const k of ['s1', 's2', 's3']) if (u.cd[k] > 0) u.cd[k] *= 0.8; u.istate.ttkC = c; } } });
  item({ id: 'qua_cau_linh_hon', name: 'Quả Cầu Linh Hồn', short: 'Linh Hồn', cat: 'ap', cost: 2500, stats: { ap: 50, hp: 300, mp: 200 }, rot: true, alt: { arch: ['mage'], for: 'mat_na' },
    uniq: 'Hạ gục / hỗ trợ: +12 SMPT vĩnh viễn trong trận (tối đa 10 lần).', why: 'Đội đang dẫn, ăn mạng sớm', weak: 'Đội đang thua',
    bonus: (u) => ({ ap: 12 * Math.min(10, u.istate.qclh || 0) }),
    hooks: { onKill(m, u) { u.istate.qclh = Math.min(10, (u.istate.qclh || 0) + 1); m.recalcItems(u); }, onAssist(m, u) { u.istate.qclh = Math.min(10, (u.istate.qclh || 0) + 1); m.recalcItems(u); } } });
  item({ id: 'nhan_hoang_kim', name: 'Nhẫn Hoàng Kim', short: 'Hoàng Kim', cat: 'ap', cost: 2600, stats: { ap: 60, magicPenFlat: 10, hp: 200 }, rot: true, alt: { arch: ['fighterAp'], for: 'gay_bang_gia' },
    uniq: 'Chiêu trúng tướng giảm 10 kháng phép trong 4s (cộng dồn 2 lần).', why: 'Đội nhiều sát thương phép', weak: 'Một mình gánh sát thương',
    hooks: { afterDeal(m, u, t, info) { if (t.kind === 'hero' && isSkill(info)) stackDebuff(m, u, t, 'nhan_hoang_kim', 2, 4, (n) => ({ mr: -10 * n })); } } });
  item({ id: 'giap_ma_quai', name: 'Giáp Ma Quái', short: 'Ma Quái', cat: 'def', cost: 2600, stats: { armor: 45, mr: 30, hp: 200 }, rot: true, alt: { arch: ['tank', 'supTank'], for: 'khien_bang' },
    uniq: 'Bị khống chế (choáng, trói, hất tung…): nhận lá chắn 100 (+10/cấp) trong 3s (20s).', why: 'Đội nhiều khống chế', weak: 'Sát thương thuần',
    hooks: { tick(m, u) { if (u.disabled && ready(m, u, 'giap_ma_quai')) { u.icd.giap_ma_quai = m.time + 20; m.shield(u, u, 100 + 10 * u.level, 3); } } } });
  item({ id: 'ao_dung_nham', name: 'Áo Giáp Dung Nham', short: 'Dung Nham', cat: 'def', cost: 2700, stats: { hp: 450, armor: 25 }, rot: true, alt: { arch: ['tank'], for: 'giap_gai' },
    uniq: 'Thiêu kẻ địch quanh mình (2.4 đv): 12 (+1% máu tối đa) sát thương phép mỗi giây.', why: 'Đỡ đòn lao vào đám đông, dọn lính', weak: 'Bị thả diều',
    hooks: { tick(m, u) { if (!ready(m, u, 'ao_dung_nham')) return; u.icd.ao_dung_nham = m.time + 1; m.hitCircle(u, u.x, u.y, 2.4, (e) => m.damage(u, e, (12 + u.st.maxHp * 0.01) * (e.kind === 'minion' ? 1.5 : 1), 'magic', { tag: 'item', aoe: true, noHook: true }), { noFx: true }); } } });
  item({ id: 'khien_lam_than', name: 'Khiên Lâm Thần', short: 'Lâm Thần', cat: 'sup', cost: 2300, stats: { hp: 250, armor: 20, mr: 20, cdr: 0.1 }, rot: true, alt: { arch: ['supTank'], for: 'vuong_mien' },
    uniq: 'Mỗi 6s, đòn đánh / chiêu trúng tướng địch: đồng minh máu thấp nhất trong 8 đv nhận lá chắn 60 (+8/cấp) 3s.', why: 'Bảo kê chủ lực', weak: 'Ít chỉ số tấn công',
    hooks: { afterDeal(m, u, t, info) {
      if (t.kind !== 'hero' || !(info.auto || isSkill(info)) || !ready(m, u, 'khien_lam_than')) return;
      const a = alliesIn(m, u, 8).sort((x, y) => x.hpPct - y.hpPct || x.id - y.id)[0]; if (!a) return;
      u.icd.khien_lam_than = m.time + 6; m.shield(u, a, 60 + 8 * u.level, 3);
    } } });
  item({ id: 'den_long_tinh', name: 'Đèn Lồng Tinh Linh', short: 'Đèn Lồng', cat: 'sup', cost: 2200, stats: { ap: 40, mpr: 1.5, hp: 200, msPct: 0.06 }, rot: true, alt: { arch: ['supMage'], for: 'thuy_tinh' },
    uniq: 'Đồng minh trong 7 đv +6% tốc chạy.', why: 'Đội cơ động, đánh nhanh', weak: 'Đội đứng thủ',
    hooks: { tick(m, u) { for (const a of alliesIn(m, u, 7)) if (a !== u) m.addStatus(a, 'buff', 0.7, 1, { key: 'den_long_tinh', mods: { msPct: 0.06 } }); } } });
  const ROT_ITEMS = LIST.filter((it) => it.rot).map((it) => it.id);
  const ROT0 = ['kiem_bao_tap', 'cung_than_phong', 'tram_than_ky', 'giap_ma_quai', 'khien_lam_than'];
  // món có trong cửa hàng ở bản cập nhật hiện tại (món thường luôn có; món xoay vòng theo G.Patch.cur.items)
  const itemOn = (id) => { const it = ITEMS[id]; if (!it) return false; const base = it.isComp ? (it.into || []).map((x) => ITEMS[x]).find(Boolean) : it; if (!base || !base.rot) return true; return (G.Patch && G.Patch.cur && G.Patch.cur.items ? G.Patch.cur.items : ROT0).includes(base.id); };
  G.ROT_ITEMS = ROT_ITEMS; G.ROT_ITEMS0 = ROT0; G.itemOn = itemOn;

  // ---- hoàn tất: mô tả đầy đủ ----
  for (const it of LIST) it.desc = [it.statText, it.uniq].filter(Boolean).join(' • ');
  G.ITEMS = ITEMS; G.ITEM_LIST = LIST; G.ITEM_CATS = CATS; G.ITEM_STAT_NAME = STAT_NAME;
  G.ITEM_IS_SKILL = isSkill; G.ItemText = statText;
})();
