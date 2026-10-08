'use strict';
// ===== Biến đổi sân đấu =====
// Trước mỗi ván, hệ thống đưa ra 3 biến đổi ngẫu nhiên; bạn chọn 1, HLV đối thủ chọn 1 → cả hai cùng có hiệu lực.
// apply(m): chỉnh hệ số của trận • ai(me, opp, arena): điểm ưu tiên khi HLV máy cân nhắc (càng cao càng có lợi cho "me").
const isRanged = (cfg) => !!WEAPONS[cfg.weapon].ai.ranged;
const wOf = (cfg) => WEAPONS[cfg.weapon].weight * (1 + 0.06 * ((cfg.stats && cfg.stats.weight) || 1) - 0.06);
const GUNNERS = new Set(['sung', 'luc_xoay', 'song_luc', 'sung_san']);
const ARENA_MODS = {
  lowgrav: { name: 'Trọng Lực Thấp', icon: '🪶', desc: 'Mọi đòn đánh văng xa hơn 20%.', apply(m) { m.kbK *= 1.2; },
    ai: (me, op) => (wOf(me) - wOf(op)) * 4 + 0.3 },
  heavy:   { name: 'Trọng Lực Nặng', icon: '🪨', desc: 'Lực văng -15%, mọi người chạy chậm hơn 10%. Trận kéo dài, khó kết liễu.', apply(m) { m.kbK *= 0.85; m.spdK *= 0.9; },
    ai: (me, op) => (wOf(op) - wOf(me)) * 3 },
  frenzy:  { name: 'Cuồng Nộ', icon: '💢', desc: 'Tích nộ nhanh gấp đôi — Nộ xuất hiện liên tục.', apply(m) { m.rageK *= 2; },
    ai: (me) => (WEAPONS[me.weapon].noRage ? -1 : 0.8) },
  haste:   { name: 'Thần Tốc', icon: '⏩', desc: 'Hồi chiêu nhanh hơn 25%.', apply(m) { m.cdK *= 0.75; },
    ai: () => 0.6 },
  noledge: { name: 'Mép Sụp', icon: '🕳️', desc: 'Không thể bám mép — lọt ra ngoài là rơi ngay.', apply(m) { m.ledge = 2; },
    ai: (me, op) => (wOf(me) - wOf(op)) * 3 + (isRanged(op) ? 0.4 : 0) },
  fog:     { name: 'Sương Mù', icon: '🌫️', desc: 'Tầm tự ngắm giảm còn 280 — vũ khí tầm xa bị hạn chế.', apply(m) { m.aimRange = 280; },
    ai: (me, op) => (isRanged(op) ? 1.5 : 0) - (isRanged(me) ? 1.8 : 0) },
  giant:   { name: 'Khổng Lồ', icon: '🗿', desc: 'Đấu sĩ to hơn 30% và nặng hơn 20% — dễ trúng đòn, khó văng.', apply(m) { m.sizeK = 1.3; m.weightK *= 1.2; },
    ai: (me, op) => (isRanged(me) ? -1 : 1) + (isRanged(op) ? 0.6 : 0) },
  crit:    { name: 'Vận Đỏ', icon: '🎲', desc: '15% đòn đánh chí mạng: x1.7 lực văng. Khó đoán!', apply(m) { m.crit += 0.15; },
    ai: (me) => (me.charId === 'jack' ? 2.5 : 0.3) },
  ammo:    { name: 'Kho Đạn', icon: '📦', desc: 'Nạp đạn nhanh gấp 2.5 (súng lục, lục ổ xoay, song lục, súng săn).', apply(m) { m.reloadK *= 0.4; },
    ai: (me, op) => (GUNNERS.has(me.weapon) ? 2 : 0) - (GUNNERS.has(op.weapon) ? 2 : 0) },
  regen:   { name: 'Suối Hồi Phục', icon: '💚', desc: 'Không trúng đòn 3s thì tự hồi 1.5% điểm văng mỗi giây.', apply(m) { m.regen += 1.5; },
    ai: (me) => (isRanged(me) ? 1 : 0.2) },
  storm:   { name: 'Thiên Tai', icon: '🌪️', desc: 'Đặc trưng của sàn hoạt động dữ dội gấp đôi.', apply(m) { m.hazK *= 2; },
    ai: () => rand(-0.5, 0.8) },
  calm:    { name: 'Trời Yên Biển Lặng', icon: '🕊️', desc: 'Tắt đặc trưng của sàn trong ván này.', apply(m) { m.hazK = 0; },
    ai: () => rand(-0.3, 0.6) },
  bloody:  { name: 'Tử Chiến', icon: '🩸', desc: 'Cả hai bắt đầu (và hồi sinh) với 40% điểm văng.', apply(m) { m.startPct += 40; },
    ai: (me, op) => (wOf(me) - wOf(op)) * 2 },
  ice:     { name: 'Sàn Trơn', icon: '🧊', desc: 'Ma sát giảm 40% — bị đánh trượt rất xa.', apply(m) { m.arena.fric *= 0.6; },
    ai: (me, op) => (wOf(me) - wOf(op)) * 3 },
  magnet:  { name: 'Từ Trường', icon: '🧲', desc: 'Mọi người bị hút nhẹ về giữa sân — mép sàn an toàn hơn.', apply(m) { m.magnet += 55; },
    ai: (me, op) => (wOf(op) - wOf(me)) * 3 + 0.2 },
  power:   { name: 'Đánh Đau', icon: '🔥', desc: 'Điểm văng gây ra +25%.', apply(m) { m.dmgK *= 1.25; },
    ai: (me, op) => (isRanged(me) ? 0.4 : 0.6) },
};
const MOD_IDS = Object.keys(ARENA_MODS);
function offerMods(n = 3) { return shuffle(MOD_IDS.slice()).slice(0, n); }
// HLV máy cân nhắc: chọn biến đổi có lợi nhất cho mình (kèm chút ngẫu hứng)
function coachPickMod(offer, me, op) {
  let best = offer[0], bs = -Infinity;
  for (const id of offer) { const s = ARENA_MODS[id].ai(me, op) + rand(0, 0.9); if (s > bs) { bs = s; best = id; } }
  return best;
}
