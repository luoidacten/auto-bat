'use strict';
// ===== Trang bị 3 bậc (mỗi bậc 1 ô) =====
// Bậc I sơ cấp (có sẵn) • Bậc II trung cấp (mở khi vô địch giải đầu tiên) • Bậc III thần binh (mở khi vô địch giải thứ 3)
// mods: chỉ số cộng thẳng • fx: hiệu ứng móc vào hệ thống chung (giống nội tại — f.T('it_xxx')) • active: trang bị kích hoạt (AI tự dùng)
const EQUIP_SLOTS = { 1: 'Bậc I — Trang bị sơ cấp', 2: 'Bậc II — Trang bị trung cấp', 3: 'Bậc III — Thần binh' };
const EQUIP_UNLOCK = { 1: 1, 2: 2, 3: 4 }; // cần Career.d.unlocked (số giải đã mở) tối thiểu
const MOD_LABEL = { dmg: 'Sát thương', kb: 'Lực văng', weight: 'Kháng đẩy', taken: 'Văng nhận', speed: 'Tốc chạy', cdr: 'Hồi chiêu', rage: 'Tích nộ', trust: 'Tín Nhiệm', wis: 'Trí Tuệ' };

// ước lượng một đòn có đẩy t văng khỏi sàn không (dùng cho các hiệu ứng "bảo hiểm rơi đài")
function lethalHit(t, att, hit, m) {
  if (!att || hit.noKnock || hit.quiet) return false;
  const p = t.percent + (hit.dmg || 0) * DMG_SCALE;
  const mag = ((hit.kb || 0) + (hit.kg || 0) * KG_SCALE * p) * (att.kbMult || 1) * (m.kbK || 1) / t.weight;
  if (mag < 280) return false;
  const src = hit.src || att, a = hit.angle ?? Math.atan2(t.y - src.y, t.x - src.x);
  const L = mag / (KB_FRICTION * m.arena.fric);
  return m.arena.edgeDist(t.x + Math.cos(a) * L, t.y + Math.sin(a) * L) < -(m.ledge ?? LEDGE);
}
// đang bay theo quỹ đạo sẽ rơi khỏi sàn?
function flyingOut(f, m) {
  const sp = Math.hypot(f.vx, f.vy);
  if (sp < 300) return false;
  const L = sp / (KB_FRICTION * m.arena.fric);
  return m.arena.edgeDist(f.x + f.vx / sp * L, f.y + f.vy / sp * L) < -(m.ledge ?? LEDGE) * 0.5;
}
function behind(t, src) { return Math.abs(angDiff(t.facing, angTo(t, src))) > 1.95; }
function mulCd(f, k, v) { f.cdK[k] = (f.cdK[k] || 1) * v; }
const ARMOR_ST = ['ironbody', 'stance', 'absorb', 'block', 'shield', 'unstoppable', 'parry', 'rarmor'];

const ITEMS = [
  // ---------------- BẬC I ----------------
  { id: 'it_spikes', tier: 1, name: 'Giày Đinh Gỉ', icon: '👢', kind: 'Thuần tăng', price: 120,
    desc: '+12% tốc chạy. Đứng gần mép sàn: giảm 15% lực đẩy văng nhận vào (kháng trơn trượt).', mods: { speed: 0.12 },
    fx: { onTake(t, att, hit, info, m) { if (m.arena.edgeDist(t.x, t.y) < 120) info.kbMult *= 0.85; } } },
  { id: 'it_pine', tier: 1, name: 'Vòng Cổ Gỗ Tùng', icon: '📿', kind: 'Thuần tăng', price: 130,
    desc: 'Giảm 10% thời gian hồi chiêu của A, B, C.',
    fx: { setup(f) { for (const k of ['A', 'B', 'C', 'E']) mulCd(f, k, 0.9); } } },
  { id: 'it_thorn', tier: 1, name: 'Găng Quấn Gai', icon: '🥊', kind: 'Thuần tăng', price: 130,
    desc: '+15% lực đẩy văng cho các đòn cận chiến.',
    fx: { onDeal(f, t, hit, info) { if (!hit.proj) info.kbMult *= 1.15; } } },
  { id: 'it_scope', tier: 1, name: 'Kính Ngắm Vỡ', icon: '🔭', kind: 'Thuần tăng', price: 130,
    desc: '+15% tầm bay và tốc độ của mọi đạn đạo tầm xa.' },
  { id: 'it_lead', tier: 1, name: 'Tạ Chân Chì', icon: '⚓', kind: 'Đánh đổi', price: 120,
    desc: '+30% kháng đẩy lùi (cơ thể nặng hơn). Cái giá: -12% tốc chạy.', mods: { weight: 0.3, speed: -0.12 } },
  { id: 'it_blood', tier: 1, name: 'Nhẫn Huyết Thệ', icon: '💍', kind: 'Đánh đổi', price: 140,
    desc: '+20% sát thương và lực đẩy văng. Cái giá: nhận thêm 10% điểm văng.', mods: { dmg: 0.2, kb: 0.2, taken: 0.1 } },
  { id: 'it_oil', tier: 1, name: 'Giáp Vải Tẩm Dầu', icon: '🧥', kind: 'Kháng hiệu ứng', price: 110,
    desc: 'Giảm 30% thời gian bị Làm Chậm và Trói Chân.' },
  { id: 'it_mask', tier: 1, name: 'Mặt Nạ Đe Dọa', icon: '👺', kind: 'Kích hoạt • 20s', price: 120,
    desc: 'Gầm thét: mọi kẻ địch trong 120px bị giảm 25% tốc chạy 1.5s.',
    active: { cd: 20, when: (f, t, m, d) => d < 115,
      use(f, m) { for (const e of m.enemiesOf(f)) if (dist(e, f) < 120 + e.r) e.addStatus('slow', 1.5, 0.25); m.fx({ type: 'ring', x: f.x, y: f.y, r: 120, color: '#ff6a3a', life: 0.4, w: 6 }); m.text(f.x, f.y - 60, '👺 GẦM!', '#ff8a5a', 15); } } },
  { id: 'it_jet', tier: 1, name: 'Bình Phản Lực Mini', icon: '🧯', kind: 'Kích hoạt • 25s', price: 140,
    desc: 'Lướt nhanh 90px theo hướng di chuyển (không gây sát thương) — né chiêu hoặc thoát khỏi mép vực.', react: true,
    active: { cd: 25, react: true,
      when: (f, t, m, d, br) => f.alive && !f.has('stun') && f.z <= 0 && !f.dash && ((m.arena.edgeDist(f.x, f.y) < 60 && br.danger > 0.5) || (br.lastThreat && m.time - br.lastThreat < 0.15 && d < 160)),
      use(f, m, t) {
        const toC = Math.atan2(-f.y, -f.x), e = m.arena.edgeDist(f.x, f.y);
        const a = e < 80 ? toC : t ? escapeAngle(f, t, m) : toC;
        f.action = null; f.hitstun = 0; f.startDash({ angle: a, dist: 90, dur: 0.14, invuln: true, trail: true }); m.text(f.x, f.y - 50, '🧯 PHẢN LỰC', '#cfd8e0', 13);
      } } },
  { id: 'it_magnet', tier: 1, name: 'Nam Châm Sắt Vụn', icon: '🧲', kind: 'Tiện ích', price: 100,
    desc: 'Gấp đôi phạm vi hút bánh răng/tài nguyên trên sàn (hợp Roxie). +15% vàng nhận được sau mỗi trận.' },
  { id: 'it_whistle', tier: 1, name: 'Còi Huấn Luyện', icon: '📯', kind: 'Tâm trí', price: 110,
    desc: '+15 Tín Nhiệm (nghe lệnh HLV nhanh hơn, ít phớt lờ hơn).', mods: { trust: 15 } },
  { id: 'it_notebook', tier: 1, name: 'Sổ Tay Binh Pháp', icon: '📘', kind: 'Tâm trí', price: 130,
    desc: '+1.5 Trí Tuệ (phản ứng nhanh hơn, giữ khoảng cách chuẩn hơn, nhìn thấu ảo ảnh sớm hơn).', mods: { wis: 1.5 } },
  { id: 'it_twinrune', tier: 1, name: 'Bùa Song Phép', icon: '🔮', kind: 'Phép bổ trợ', price: 140,
    desc: 'Mang được 2 Phép Bổ Trợ mỗi hiệp (thay vì 1). Phép hồi nhanh hơn 10%.' },
  // ---------------- BẬC II ----------------
  { id: 'it_tendon', tier: 2, name: 'Dao Cắt Gân', icon: '🔪', kind: 'Bị động • Đòn đánh', price: 380,
    desc: 'Đòn đánh trúng từ sau lưng mục tiêu chắc chắn Làm Chậm 45% trong 1.5s.',
    fx: { onDeal(f, t, hit, info) { if (behind(t, hit.src || f)) info.extra.push(() => t.addStatus('slow', 1.5, 0.45)); } } },
  { id: 'it_fury', tier: 2, name: 'Áo Choàng Cuồng Nộ', icon: '🧣', kind: 'Đánh đổi', price: 400,
    desc: 'Điểm văng bản thân trên 80%: +35% lực đẩy văng gây ra. Cái giá: bị Choáng / Câm Lặng lâu hơn 25%.',
    fx: { onDeal(f, t, hit, info) { if (f.percent > 80) info.kbMult *= 1.35; } } },
  { id: 'it_mercury', tier: 2, name: 'Khiên Thủy Ngân', icon: '🪞', kind: 'Kích hoạt • 35s', price: 420,
    desc: 'Lập tức hóa giải Choáng, Câm Lặng, Trói Chân đang chịu và +20% tốc chạy trong 1s.',
    active: { cd: 35, react: true,
      when: (f, t, m, d) => f.alive && (f.has('stun') && f.has('stun').t > 0.4 || f.has('root') && f.has('root').t > 0.5 || f.has('silence') && f.has('silence').t > 0.8 || f.has('taunt')) && (d < 320 || f.percent > 70),
      use(f, m) { for (const s of ['stun', 'silence', 'root', 'taunt']) f.removeStatus(s); f.focus = null; f.addStatus('haste', 1, 0.2); m.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#d0e0ff', life: 0.35, w: 5 }); m.text(f.x, f.y - 50, '🪞 HÓA GIẢI', '#d0e0ff', 14); } } },
  { id: 'it_overboots', tier: 2, name: 'Bốt Quá Tải', icon: '👟', kind: 'Đánh đổi • Cơ động', price: 360,
    desc: '+35% tốc chạy khi không giao tranh trong 3s. Cái giá: khi trúng đòn mất ngay buff và tự làm chậm 15% trong 1s.',
    fx: { update(f, m) { if (m.time - Math.max(f.lastHurtT || 0, f.lastDealT || 0) > 3) f.frameSpeed *= 1.35; },
      onTake(t, att, hit, info) { if (!hit.quiet && att && !att.isEnv) info.extra.push(() => t.addStatus('slow', 1, 0.15)); } } },
  { id: 'it_ir', tier: 2, name: 'Kính Xuyên Hồng Ngoại', icon: '🥽', kind: 'Bị động • Khắc chế sát thủ', price: 380,
    desc: 'Nhìn thấu và tự ngắm được mục tiêu đang tàng hình / né ngắm. Đòn tầm xa +15% lực đẩy lên mục tiêu đứng yên.',
    fx: { onDeal(f, t, hit, info) { if (hit.proj && t.stillT > 0.3) info.kbMult *= 1.15; } } },
  { id: 'it_shackle', tier: 2, name: 'Gông Cùm Tội Đồ', icon: '⛓️', kind: 'Đánh đổi • Diện rộng', price: 400,
    desc: 'Phạm vi sát thương của chiêu A và B tăng 30%. Cái giá: hồi chiêu mọi kỹ năng chậm hơn 15%.', mods: { cdr: -0.13 } },
  { id: 'it_ash', tier: 2, name: 'Bùa Tro Tàn', icon: '🏺', kind: 'Bị động • Thiêu đốt', price: 420,
    desc: 'Đòn đánh khiến mục tiêu nhiễm Tro Tàn: tự tăng 4% điểm văng mỗi giây trong 3s (không gây đẩy lùi; mỗi mục tiêu tối đa 1 lần / 4s).',
    fx: { afterDeal(f, t, hit, m) { if (!t.isMinion && (t._ashT || 0) < m.time) { t._ashT = m.time + 4; t.addStatus('ash', 3, 4); } } } },
  { id: 'it_anchor', tier: 2, name: 'Mỏ Neo Hãm Phanh', icon: '🪝', kind: 'Kích hoạt • 40s', price: 450,
    desc: 'Đang bị đánh bay: lập tức đứng hình tại chỗ và triệt tiêu 70% lực đẩy văng còn lại.',
    active: { cd: 40, react: true, when: (f, t, m) => f.alive && flyingOut(f, m),
      use(f, m) { f.vx *= 0.3; f.vy *= 0.3; f.hitstun = Math.min(f.hitstun, 0.15); f.pendingKnock = null; m.fx({ type: 'ring', x: f.x, y: f.y, r: 36, color: '#9ab0c0', life: 0.4, w: 6 }); m.text(f.x, f.y - 50, '🪝 HÃM PHANH!', '#cfe0ff', 15); m.sfx('armor_hit', { vol: 0.6 }); } } },
  { id: 'it_heart', tier: 2, name: 'Trái Tim Cự Thạch', icon: '🗿', kind: 'Đánh đổi • Phòng ngự tĩnh', price: 380,
    desc: 'Đứng yên quá 1s: Trụ Vững — kháng đẩy tăng 50%. Cái giá: -10% tốc chạy vĩnh viễn.', mods: { speed: -0.1 },
    fx: { onTake(t, att, hit, info) { if (t.stillT > 1) info.kbMult *= 0.67; } } },
  { id: 'it_bell', tier: 2, name: 'Chuông Hỗn Loạn', icon: '🔔', kind: 'Bị động • Combo kỹ năng', price: 400,
    desc: 'Tung đủ 3 kỹ năng liên tiếp (trong 4s): đòn đánh trúng kế tiếp gây Câm Lặng 1.25s.',
    fx: {
      onUse(f, k, m) { if (k === 'U') return; f._bell = (f._bell || []).filter((x) => m.time - x < 4); f._bell.push(m.time); if (f._bell.length >= 3) { f._bell = []; f._bellArm = true; m.text(f.x, f.y - 56, '🔔', '#ffe066', 16); } },
      onDeal(f, t, hit, info, m) { if (f._bellArm && !hit.quiet) { f._bellArm = false; info.extra.push(() => t.addStatus('silence', 1.25)); m.text(t.x, t.y - 60, '🔔 HỖN LOẠN', '#ffe066', 14); } } } },
  { id: 'it_oath', tier: 2, name: 'Huy Hiệu Lời Thề', icon: '🎖️', kind: 'Tâm trí', price: 380,
    desc: '+25 Tín Nhiệm, +1 Trí Tuệ. Đấu sĩ tin tuyệt đối vào HLV.', mods: { trust: 25, wis: 1 } },
  { id: 'it_owl', tier: 2, name: 'Kính Cú Đêm', icon: '🦉', kind: 'Đánh đổi • Tâm trí', price: 400,
    desc: '+3 Trí Tuệ. Cái giá: -15 Tín Nhiệm (khôn quá hóa tự tin, hay cãi lệnh).', mods: { wis: 3, trust: -15 } },
  { id: 'it_ariasong', tier: 2, name: 'Bản Nhạc Của Aria', icon: '🎼', kind: 'Kích hoạt • 30s', price: 420,
    desc: '+20% Ý chí (tích nộ) và +12% Trụ vững. Kích hoạt: chơi 1 bản nhạc ngẫu nhiên — 🎺 Hành Khúc (tăng tốc 25% 4s, choáng kẻ địch trong 130px 0.6s) • 🎻 Ru Ngủ (kẻ địch trong 220px chậm 40% 2.5s) • 🎶 Bảo Hộ (khiên 4s, giảm 12 điểm văng). Riêng với Koda: +35 Tín Nhiệm và vẫn nghe lệnh khi đang Hóa Điên — con quái thú nhận ra giai điệu của chị Aria.',
    mods: { rage: 0.2, weight: 0.12 }, charMods: { koda: { trust: 35 } },
    active: { cd: 30, when: (f, t, m, d) => d < 200 || f.percent > 90,
      use(f, m) {
        const song = pick(['A', 'B', 'C']), en = m.enemiesOf(f);
        if (song === 'A') { f.addStatus('haste', 4, 0.25); for (const e of en) if (dist(e, f) < 130 + e.r) e.addStatus('stun', 0.6); m.text(f.x, f.y - 60, '🎺 HÀNH KHÚC!', '#ff7a6a', 16); m.sfx('note_1'); }
        else if (song === 'B') { for (const e of en) if (dist(e, f) < 220 + e.r) e.addStatus('slow', 2.5, 0.4); m.text(f.x, f.y - 60, '🎻 RU NGỦ...', '#7ab0ff', 16); m.sfx('note_2'); }
        else { f.addStatus('shield', 4, 7); f.percent = Math.max(0, f.percent - 12); m.text(f.x, f.y - 60, '🎶 BẢO HỘ', '#ffe07a', 16); m.sfx('note_3'); }
        m.fx({ type: 'ring', x: f.x, y: f.y, r: song === 'B' ? 220 : 130, color: song === 'A' ? '#ff7a6a' : song === 'B' ? '#7ab0ff' : '#ffe07a', life: 0.5, w: 6 });
      } } },
  { id: 'it_flyer', tier: 2, name: 'Thiết Bị Bay', icon: '🛩️', kind: 'Kích hoạt • 20s', price: 420,
    desc: '+10% tốc chạy, +10% tốc hồi chiêu. Kích hoạt: bay lướt 150px về phía trước (miễn sát thương khi lướt) — áp sát hoặc vượt mép vực.',
    mods: { speed: 0.1, cdr: 0.1 },
    active: { cd: 20, when: (f, t, m, d) => !f.dash && f.z <= 0 && d > 170 && d < 330 && Math.abs(angDiff(f.facing, angTo(f, t))) < 0.4 && m.arena.edgeDist(f.x + Math.cos(f.facing) * 150, f.y + Math.sin(f.facing) * 150) > 30,
      use(f, m) { f.action = null; f.startDash({ angle: f.facing, dist: 150, dur: 0.2, invuln: true, trail: true }); m.text(f.x, f.y - 50, '🛩️ BAY!', '#cfe8ff', 14); m.sfx('wind_magic', { vol: 0.6 }); } } },
  // ---------------- BẬC III ----------------
  { id: 'it_bloodsword', tier: 3, name: 'Huyết Kiếm Đoạt Mệnh', icon: '🩸', kind: 'Đánh đổi cực hạn', price: 950,
    desc: '+45% sát thương và lực đẩy văng cho mọi chiêu. Cái giá: mỗi lần dùng A hoặc B tự tăng 4% điểm văng.', mods: { dmg: 0.45, kb: 0.45 },
    fx: { onUse(f, k) { if (k === 'A' || k === 'B') f.percent += 4; } } },
  { id: 'it_crown', tier: 3, name: 'Vương Miện Bất Khả Xâm Phạm', icon: '👑', kind: 'Bảo hiểm rơi đài • 60s', price: 1100,
    desc: 'Dính một đòn chắc chắn đánh bay khỏi sàn: vương miện phát nổ triệt tiêu 100% lực đẩy và hất tung kẻ tấn công ra xa (hồi 60s).',
    fx: { onIncoming(t, att, hit, m) {
      if (!att || att.isEnv || att === t || m.time < (t._crownCd || 0) || !lethalHit(t, att, hit, m)) return true;
      t._crownCd = m.time + 60;
      m.fx({ type: 'ring', x: t.x, y: t.y, r: 110, color: '#ffd700', life: 0.5, w: 10 }); m.text(t.x, t.y - 60, '👑 VƯƠNG MIỆN!', '#ffd700', 19); m.shake(8);
      t.vx = t.vy = 0; t.hitstun = 0; t.invulnT = Math.max(t.invulnT, 0.4);
      const o = att.owner || att;
      if (o.alive) m.applyHit(t, o, { dmg: 3, kb: 330, kg: 2, tag: 'X', angle: angTo(t, o), quiet: true });
      return false;
    } } },
  { id: 'it_void', tier: 3, name: 'Áo Choàng Hư Không', icon: '🌌', kind: 'Kích hoạt • 45s', price: 950,
    desc: 'Tàng hình & không thể bị nhắm 2s; đòn đánh đầu tiên sau khi hiện hình gây gấp đôi lực đẩy văng.',
    fx: { onDeal(f, t, hit, info, m) { if ((f._voidEmp || 0) > m.time && !hit.quiet) { f._voidEmp = 0; info.kbMult *= 2; m.text(t.x, t.y - 62, '🌌 HƯ KHÔNG!', '#b0a0ff', 16); } } },
    active: { cd: 45, when: (f, t, m, d, br) => (br.lastThreat && m.time - br.lastThreat < 0.3 && f.percent > 60) || (d < 260 && t.percent > 70),
      use(f, m) { f.addStatus('untargetable', 2); f.addStatus('invis', 2); f._voidEmp = m.time + 4.5; m.fx({ type: 'ring', x: f.x, y: f.y, r: 50, color: '#8070c0', life: 0.45, w: 6 }); m.text(f.x, f.y - 56, '🌌 HƯ KHÔNG', '#b0a0ff', 15); } } },
  { id: 'it_titan', tier: 3, name: 'Bộ Xương Titan', icon: '🦴', kind: 'Đánh đổi sinh tử', price: 1050,
    desc: 'Siêu Giáp vĩnh viễn (không bị ngắt chiêu, miễn Làm Chậm và Choáng nhẹ ≤0.5s), +50% kháng văng. Cái giá: -20% tốc chạy và khóa hoàn toàn chiêu lướt C.', mods: { weight: 0.5, speed: -0.2 } },
  { id: 'it_hourglass', tier: 3, name: 'Đồng Hồ Cát Nghịch Đảo', icon: '⌛', kind: 'Kích hoạt • 60s', price: 1100,
    desc: 'Giật ngược vị trí và điểm văng về đúng 2.5s trước — cứu thua ngay cả khi đang bay khỏi sàn.',
    fx: { update(f, m) { const h = f._hist || (f._hist = []); if (!h.length || m.time - h[h.length - 1].t >= 0.1) { h.push({ t: m.time, x: f.x, y: f.y, p: f.percent }); if (h.length > 30) h.shift(); } } },
    active: { cd: 60, react: true,
      when: (f, t, m) => { const h = f._hist || []; const o = h.find((e) => e.t >= m.time - 2.55); return !!o && f.falling <= 0 && (flyingOut(f, m) || f.percent - o.p > 45); },
      use(f, m) {
        const h = f._hist, o = h.find((e) => e.t >= m.time - 2.55);
        m.fx({ type: 'line', x1: f.x, y1: f.y, x2: o.x, y2: o.y, color: '#ffe9a0', life: 0.4, w: 4 });
        f.x = o.x; f.y = o.y; f.vx = f.vy = 0; f.hitstun = 0; f.pendingKnock = null; f.cancelDash(); f.action = null;
        const back = f.percent - o.p; f.percent = Math.min(f.percent, o.p); f._hist = [];
        m.fx({ type: 'ring', x: f.x, y: f.y, r: 50, color: '#ffe9a0', life: 0.5, w: 6 }); m.text(f.x, f.y - 60, `⌛ NGHỊCH ĐẢO -${Math.max(0, back).toFixed(0)}%`, '#ffe9a0', 16);
      } } },
  { id: 'it_abyss', tier: 3, name: 'Kẹp Vực Thẳm', icon: '🗜️', kind: 'Bị động • Ép mép', price: 1000,
    desc: 'Đánh trúng kẻ địch đứng trong 120px sát mép sàn: lực đẩy văng x2.',
    fx: { onDeal(f, t, hit, info, m) { if (m.arena.edgeDist(t.x, t.y) < 120) info.kbMult *= 2; } } },
  { id: 'it_breaker', tier: 3, name: 'Găng Tay Phá Diệt', icon: '🧤', kind: 'Kích hoạt • 40s', price: 1000,
    desc: 'Đòn đánh kế tiếp là Siêu Đòn: phá nát mọi giáp/khiên, Choáng 1.5s và lực đẩy x2.5.',
    fx: { onDeal(f, t, hit, info, m) {
      if (!((f._brk || 0) > m.time) || hit.quiet || hit.noKnock) return;
      f._brk = 0; hit.unblockable = true;
      for (const s of ARMOR_ST) t.removeStatus(s);
      if (t.action) t.action.super = false;
      info.kbMult *= 2.5; info.extra.push(() => t.addStatus('stun', 1.5));
      m.text(t.x, t.y - 64, '🧤 PHÁ DIỆT!', '#ff6a3a', 20); m.shake(10);
    } },
    active: { cd: 40, when: (f, t, m, d) => t.percent > 45 && d < (f.weapon.ai.ranged ? 360 : (f.weapon.ai.range || 80) + 70),
      use(f, m) { f._brk = m.time + 6; m.fx({ type: 'ring', x: f.x, y: f.y, r: 34, color: '#ff6a3a', life: 0.35, w: 5 }); m.text(f.x, f.y - 50, '🧤', '#ff6a3a', 18); } } },
  { id: 'it_core', tier: 3, name: 'Lõi Nhiệt Hạch Quá Tải', icon: '☢️', kind: 'Đánh đổi cơ chế', price: 950,
    desc: 'Khi thanh Nộ đầy: mọi kỹ năng thường giảm 50% hồi chiêu và đòn đánh gây thêm Thiêu Đốt. Cái giá: không tung Nộ trong 8s thì lõi nổ — tự nhận 35% điểm văng và Choáng 0.75s. (Vô dụng với nhân vật không dùng thanh Nộ.)',
    fx: {
      update(f, m, dt) {
        const on = !f.weapon.noRage && f.weapon.skills.U && f.rage >= f.rageNeed;
        f._coreOn = on;
        if (!on) { f._coreT = 0; return; }
        f._coreT = (f._coreT || 0) + dt;
        if (f._coreT >= 8) { f._coreT = 0; f.percent += 35; f.addStatus('stun', 0.75); m.fx({ type: 'boom', x: f.x, y: f.y, r: 90, color: '#7aff5a', life: 0.4 }); m.text(f.x, f.y - 60, '☢️ LÕI NỔ!', '#9aff6a', 18); m.shake(8); }
      },
      onDeal(f, t, hit, info) { if (f._coreOn && !hit.quiet) info.extra.push(() => t.addStatus('burn', 3, 2)); } } },
  { id: 'it_chain', tier: 3, name: 'Xích Hồn Đồng Quy', icon: '🔗', kind: 'Kích hoạt • 50s', price: 1000,
    desc: 'Phóng xích liên kết linh hồn với kẻ địch 3s. Nếu bạn bị đánh văng khỏi sàn lúc này, kẻ bị liên kết cũng bị kéo văng theo cùng góc độ.',
    active: { cd: 50, when: (f, t, m, d) => d < 320 && f.percent > 85 && t.percent > 40,
      use(f, m, t) { if (!t) return; f._chain = { t, until: m.time + 3 }; m.fx({ type: 'line', x1: f.x, y1: f.y, x2: t.x, y2: t.y, color: '#b0a0ff', life: 0.5, w: 4 }); m.text(t.x, t.y - 56, '🔗 ĐỒNG QUY', '#b0a0ff', 15); } } },
  { id: 'it_gem', tier: 3, name: 'Ngọc Tinh Linh Nguyên Thủy', icon: '💠', kind: 'Bị động • Lăn cầu tuyết', price: 1050,
    desc: 'Mỗi lần đánh văng đối thủ khỏi sàn: giảm ngay 25% điểm văng hiện tại của bản thân và +8% tốc chạy tới hết ván (tối đa 3 lần).',
    fx: {
      update(f) { if (f._gem) f.frameSpeed *= 1 + 0.08 * f._gem; },
      onKill(f, v, m) { f.percent *= 0.75; f._gem = Math.min(3, (f._gem || 0) + 1); m.text(f.x, f.y - 64, `💠 NGỌC TINH LINH x${f._gem}`, '#9affea', 15); } } },
  { id: 'it_sage', tier: 3, name: 'Ngọc Hiền Triết', icon: '🔮', kind: 'Tâm trí tối thượng', price: 950,
    desc: '+4 Trí Tuệ và +20 Tín Nhiệm. Ảo ảnh không lừa được quá 1s.', mods: { wis: 4, trust: 20 } },
  { id: 'it_lifecrystal', tier: 3, name: 'Thủy Tinh Sinh Mệnh', icon: '💎', kind: 'Thêm mạng • Dễ vỡ', price: 1200, repair: 450,
    desc: '+1 mạng mỗi ván. Lần đầu bị đánh rơi đài, thủy tinh VỠ để giữ mạng cho bạn — trang bị bị hỏng, không mang được nữa cho tới khi sửa ở cửa hàng (💰450).' },
];
const ITEM_BY_ID = Object.fromEntries(ITEMS.map((e) => [e.id, e]));
const ITEM_FX = Object.fromEntries(ITEMS.filter((e) => e.fx).map((e) => [e.id, e.fx]));
// chọn trang bị ngẫu nhiên cho đối thủ máy theo cấp
function randomItems(level) {
  const eq = [];
  const maxT = level >= 9 ? 3 : level >= 4 ? 2 : level >= 1.5 ? 1 : 0;
  for (let tier = 1; tier <= maxT; tier++) if (Math.random() < 0.85) eq.push(pick(ITEMS.filter((e) => e.tier === tier && e.id !== 'it_magnet' && e.id !== 'it_lifecrystal')).id);
  return eq;
}
