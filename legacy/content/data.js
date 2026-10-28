'use strict';
// ===== Hiệu ứng trạng thái =====
const STATUS = {
  stun:        { name: 'Choáng',      icon: '💫', color: '#ffd84a', bad: true },
  slow:        { name: 'Làm chậm',    icon: '🐌', color: '#7fd3ff', bad: true },
  silence:     { name: 'Câm lặng',    icon: '🔇', color: '#c58bff', bad: true },
  root:        { name: 'Trói chân',   icon: '⛓️', color: '#a3e36b', bad: true },
  burn:        { name: 'Thiêu đốt',   icon: '🔥', color: '#ff7a2a', bad: true },
  poison:      { name: 'Trúng độc',   icon: '☠️', color: '#8be04a', bad: true },
  haste:       { name: 'Tăng tốc',    icon: '⚡', color: '#fff27a' },
  invuln:      { name: 'Miễn nhiễm',  icon: '✨', color: '#ffffff' },
  immortal:    { name: 'Bất tử',      icon: '👑', color: '#ffd700' },
  empower:     { name: 'Cuồng nộ',    icon: '💢', color: '#ff4a4a' },
  block:       { name: 'Đỡ khiên',    icon: '🛡️', color: '#9ec9ff' },
  parry:       { name: 'Thế thủ',     icon: '🤺', color: '#e0e0ff' },
  stance:      { name: 'Gồng',        icon: '🗿', color: '#d0a070' },
  ironbody:    { name: 'Thiết thân',  icon: '🦾', color: '#c0c0c0' },
  untargetable:{ name: 'Ẩn thân',     icon: '👻', color: '#b0a0ff' },
  multishot:   { name: 'Liên châu',   icon: '🎯', color: '#ffb84a' },
  swordform:   { name: 'Kiếm thế',    icon: '⚔️', color: '#ff9ad5' },
  bleed:       { name: 'Chảy máu',    icon: '🩸', color: '#ff3a4a', bad: true },
  charm:       { name: 'Mê hoặc',     icon: '💗', color: '#ff7ad1', bad: true },
  pulled:      { name: 'Bị kéo',      icon: '🌀', color: '#a090c0', bad: true },
  shield:      { name: 'Khiên',       icon: '🔰', color: '#9effd0' },
  regen:       { name: 'Hồi phục',    icon: '💚', color: '#7aff9a' },
  absorb:      { name: 'Gồng mình',   icon: '🧱', color: '#ffb07a' },
  feral:       { name: 'Thú tính',    icon: '🐺', color: '#40202a' },
  berserk:     { name: 'Hóa điên',    icon: '🔴', color: '#ff2020' },
  lucky:       { name: 'Vận may',     icon: '🍀', color: '#7aff7a' },
  unstoppable: { name: 'Không thể cản phá', icon: '🚫', color: '#ff9a3a' },
  blind:       { name: 'Mù',          icon: '🕶️', color: '#606070', bad: true },
  hellfire:    { name: 'Hỏa ngục',    icon: '♨️', color: '#ff4a1a', bad: true },
  nodash:      { name: 'Cấm lướt',    icon: '⚓', color: '#4ae0d0', bad: true },
  taunt:       { name: 'Bị khiêu khích', icon: '😤', color: '#ff6a6a', bad: true },
  ash:         { name: 'Tro tàn',     icon: '🏺', color: '#c08060', bad: true },
  wound:       { name: 'Vết thương sâu', icon: '🩹', color: '#a02030', bad: true },
  invis:       { name: 'Vô hình',     icon: '🌫️', color: '#a0a0c0' },
  rarmor:      { name: 'Giáp phản lực', icon: '🛡', color: '#ffb030' },
};
// các hiệu ứng khống chế bị chặn khi KHÔNG THỂ CẢN PHÁ
const CC_TYPES = new Set(['stun', 'slow', 'silence', 'root', 'charm', 'pulled', 'blind', 'nodash', 'taunt']);

// ===== Sàn đấu =====
const ARENA_DEFS = {
  go:   { name: 'Sân Gỗ Làng Gió', shape: 'circle', r: 440, fric: 1, hazard: 'wind', feature: '🍃 Gió giật: định kỳ một luồng gió mạnh thổi mọi người về một hướng.', pillars: [{ x: 0, y: -235, r: 34 }, { x: 0, y: 235, r: 34 }],
          c: { top: '#9a7448', top2: '#86633b', rim: '#e0bf84', side: '#4a3420', bg1: '#20354a', bg2: '#0b1520', deco: 'planks' } },
  da:   { name: 'Đấu Trường Đá', shape: 'rect', w: 1080, h: 600, fric: 1, hazard: 'rocks', feature: '🪨 Đá lở: đá rơi xuống vùng được báo trước, gây sát thương và choáng.', pillars: [{ x: -300, y: -165, r: 38 }, { x: 300, y: -165, r: 38 }, { x: -300, y: 165, r: 38 }, { x: 300, y: 165, r: 38 }],
          c: { top: '#7d7f86', top2: '#6a6c72', rim: '#c9cbd2', side: '#33343a', bg1: '#2a2233', bg2: '#0e0b14', deco: 'tiles' } },
  bang: { name: 'Hồ Băng Vĩnh Cửu', shape: 'ellipse', a: 580, b: 360, fric: 0.6, hazard: 'blizzard', feature: '❄️ Sàn trơn (văng xa hơn) • Bão tuyết làm chậm mọi người • Đập vào cột băng bị đóng băng.', pillars: [{ x: 0, y: -175, r: 36 }, { x: 0, y: 175, r: 36 }],
          c: { top: '#a9dcf2', top2: '#8ccbe8', rim: '#eafaff', side: '#3d6f8a', bg1: '#11324a', bg2: '#050f1a', deco: 'ice' } },
  lava: { name: 'Miệng Hỏa Sơn', shape: 'circle', r: 400, fric: 1, hazard: 'eruption', feature: '🌋 Mạch dung nham phun trào hất tung + thiêu đốt • Đứng sát mép bị nóng bỏng.', pillars: [{ x: 0, y: -205, r: 32 }, { x: 178, y: 105, r: 32 }, { x: -178, y: 105, r: 32 }],
          c: { top: '#4a3a36', top2: '#3c2e2b', rim: '#ff8a3a', side: '#1e1210', bg1: '#4a1408', bg2: '#140402', deco: 'cracks' } },
  troi: { name: 'Đảo Thiên Không', shape: 'rect', w: 960, h: 540, fric: 1, hazard: 'clouds', feature: '☁️ Bệ mây: dẫm lên sẽ bật cao và bay về giữa sân — cứu nguy khi sát mép.', pillars: [{ x: -260, y: -130, r: 36 }, { x: 260, y: -130, r: 36 }, { x: 0, y: 160, r: 36 }],
          c: { top: '#7fc06a', top2: '#6aab57', rim: '#d9ffc4', side: '#6b4a2e', bg1: '#4a8ad0', bg2: '#a9d4ff', deco: 'grass' } },
  ngai: { name: 'Ngai Võ Thần', shape: 'octa', r: 540, squash: 0.72, fric: 1, hazard: 'runes', feature: '✴️ Ấn Võ Thần: vòng ấn xuất hiện ngẫu nhiên — ai chiếm được sẽ được cường hóa và tích nộ.', pillars: [{ x: -270, y: -135, r: 36 }, { x: 270, y: -135, r: 36 }, { x: -270, y: 135, r: 36 }, { x: 270, y: 135, r: 36 }],
          c: { top: '#3a2a5a', top2: '#2e2148', rim: '#ffd76a', side: '#140c22', bg1: '#2a0f40', bg2: '#05020a', deco: 'runes' } },
  // --- sàn mới ---
  rung: { name: 'Rừng Cổ Thụ', shape: 'circle', r: 470, fric: 1, hazard: 'bushes', feature: '🌿 Bụi rậm: đứng trong bụi thì đối thủ mất dấu (không tự ngắm được) • Nhiều gốc cây chắn đạn.',
          pillars: [{ x: -230, y: -170, r: 28 }, { x: 230, y: -170, r: 28 }, { x: -260, y: 150, r: 28 }, { x: 260, y: 150, r: 28 }, { x: 0, y: -300, r: 24 }, { x: 0, y: 290, r: 24 }],
          bushes: [{ x: 0, y: 0, r: 75 }, { x: -320, y: 0, r: 62 }, { x: 320, y: 0, r: 62 }],
          c: { top: '#3f6b35', top2: '#335a2b', rim: '#a8d68a', side: '#3a2a18', bg1: '#123020', bg2: '#04100a', deco: 'grass' } },
  cang: { name: 'Bến Cảng Bão Tố', shape: 'rect', w: 1040, h: 560, fric: 0.85, hazard: 'waves', feature: '🌊 Sóng tràn: định kỳ một con sóng quét ngang bến cảng, cuốn mọi người theo — đứng sai phía là trôi xuống biển.',
          pillars: [{ x: -260, y: 0, r: 34 }, { x: 260, y: 0, r: 34 }],
          c: { top: '#6b5238', top2: '#5a442e', rim: '#d8c4a0', side: '#2a1e14', bg1: '#123448', bg2: '#04121c', deco: 'planks' } },
  dien: { name: 'Đền Sấm Sét', shape: 'ngon', n: 6, r: 500, squash: 0.74, fric: 1, hazard: 'lightning', feature: '⚡ Sét đánh: tia sét được báo trước giáng xuống gần các đấu sĩ, gây choáng.',
          pillars: [{ x: -250, y: 0, r: 34 }, { x: 250, y: 0, r: 34 }, { x: 0, y: -190, r: 30 }, { x: 0, y: 190, r: 30 }],
          c: { top: '#4a4f66', top2: '#3c4054', rim: '#9ad0ff', side: '#1a1c28', bg1: '#1a1e3a', bg2: '#05060f', deco: 'tiles' } },
  sa:   { name: 'Sa Mạc Cát Lún', shape: 'ellipse', a: 610, b: 380, fric: 1, hazard: 'quicksand', feature: '🏜️ Cát lún: hố cát hút người vào giữa, làm chậm và đốt điểm văng — tránh xa!',
          pillars: [{ x: 0, y: -200, r: 34 }, { x: 0, y: 200, r: 34 }],
          pits: [{ x: -300, y: 0, r: 95 }, { x: 300, y: 0, r: 95 }],
          c: { top: '#d8b874', top2: '#c4a05c', rim: '#fff0c0', side: '#7a5a2a', bg1: '#e0a060', bg2: '#5a2a10', deco: 'cracks' } },
  xoay: { name: 'Vòng Xoay Thời Không', shape: 'circle', r: 460, fric: 1, hazard: 'orbit', feature: '🌀 Cột xoay: 3 cột đá quay quanh tâm sàn — dễ bị cột húc trúng hoặc ghim vào cột đang chạy.',
          pillars: [{ x: 230, y: 0, r: 36 }, { x: -115, y: 199, r: 36 }, { x: -115, y: -199, r: 36 }],
          c: { top: '#2e3a5a', top2: '#25304a', rim: '#8af0ff', side: '#10142a', bg1: '#101a3a', bg2: '#02040c', deco: 'runes' } },
};

// ===== Chiến thuật của HLV =====
// dist/aggr/def/edge: hệ số khoảng cách, hung hăng, phòng thủ, giữ vị trí • pref: trọng số chọn chiêu
// ult: 'finisher' giữ Nộ để kết liễu • flag: hành vi riêng trong Brain • need: cấp Tư duy (kỹ thuật Chiến thuật) cần để mở khóa
const TACTICS = {
  balanced:  { name: 'Cân bằng',   icon: '⚖️', desc: 'Chơi ổn định, công thủ toàn diện.', dist: 1, aggr: 1, def: 1, edge: 1 },
  aggressive:{ name: 'Tấn công',   icon: '🔥', desc: 'Áp sát, ra đòn liên tục, ít phòng thủ.', dist: 0.82, aggr: 1.45, def: 0.7, edge: 0.8 },
  defensive: { name: 'Phòng thủ',  icon: '🛡️', desc: 'Giữ giữa sân, chờ phản đòn, né nhiều hơn.', dist: 1.1, aggr: 0.75, def: 1.45, edge: 1.5 },
  kite:      { name: 'Thả diều',   icon: '🪁', desc: 'Giữ khoảng cách xa, cơ động liên tục.', dist: 1.35, aggr: 0.95, def: 1.15, edge: 1.2 },
  // --- nâng cao (dùng chung cho vài nhân vật) ---
  edge:      { name: 'Ép Mép',     icon: '🧱', desc: 'Luôn chiếm phía trong sân, mọi đòn đều nhằm đẩy đối thủ ra mép.', dist: 0.95, aggr: 1.15, def: 0.9, edge: 2.4, need: 4 },
  finisher:  { name: 'Giữ Nộ',     icon: '💀', desc: 'Giữ Nộ tới khi đối thủ trên 85% điểm văng mới tung; đối thủ càng cao điểm càng dồn ép.', dist: 1, aggr: 1, def: 1.1, edge: 1.2, ult: 'finisher', need: 5 },
  counter:   { name: 'Phản Công',  icon: '🔄', desc: 'Kiên nhẫn chờ đỡ/né được một đòn rồi bùng nổ tấn công trong 1.5s.', dist: 1.05, aggr: 0.7, def: 1.8, edge: 1.1, flag: 'counter', need: 7 },
  // --- theo vai trò chiêu: A đánh tích • B kết liễu • C thủ/cơ động/trụ sân • D đặc kỹ ---
  build:     { name: 'Tích Lũy',   icon: '📈', desc: 'Kiên nhẫn dùng A dồn điểm văng, chỉ tung B kết liễu khi đối thủ trên 100%.', dist: 1, aggr: 1.05, def: 1.1, edge: 1.1, pref: { A: 1.8, B: 0.7 }, finishAt: 100, need: 2 },
  hunt:      { name: 'Săn Kết Liễu', icon: '🎯', desc: 'Tung B kết liễu sớm (từ 45%) và mỗi khi đối thủ đứng gần mép sàn.', dist: 0.9, aggr: 1.25, def: 0.85, edge: 1.2, pref: { B: 1.7 }, finishAt: 45, need: 2 },
  stand:     { name: 'Trụ Sân',    icon: '🏟️', desc: 'Không bao giờ đánh nhau ở mép: dùng C để quay về giữa sân, ưu tiên đứng phía trong.', dist: 1, aggr: 0.95, def: 1.3, edge: 2.2, flag: 'stand', need: 3 },
  evasive:   { name: 'Né Đòn',     icon: '💨', desc: 'Để dành C chỉ để né; hết chiêu là lùi xa ngay chờ hồi.', dist: 1.15, aggr: 0.85, def: 2, edge: 1.3, flag: 'evasive', need: 5 },
  signature: { name: 'Đặc Kỹ',     icon: '⭐', desc: 'Lấy chiêu đặc trưng D làm trọng tâm, dùng ngay mỗi khi hồi.', dist: 1, aggr: 1.1, def: 1, edge: 1, pref: { D: 2.2 }, flag: 'sig', need: 3 },
  hitrun:    { name: 'Đánh & Rút', icon: '🏃', desc: 'Áp vào tung đòn rồi rút ngay; sau mỗi đòn kết liễu (B) lùi hẳn ra xa.', dist: 1.1, aggr: 1.15, def: 1.2, edge: 1.2, flag: 'hitrun', need: 6 },
};
const LOADOUT_MAX = 5;
// bộ chiến thuật dùng chung cho mọi nhân vật (phần riêng từng người nằm ở MỆNH LỆNH trong trận)
const GENERAL_TACTICS = Object.keys(TACTICS);

// ===== Trang bị: xem js/03g-items.js (3 bậc, mỗi bậc 1 ô) =====

// ===== Chỉ số huấn luyện =====
const STAT_DEFS = {
  power:  { name: 'Sức mạnh',    icon: '💪', desc: '+6% điểm văng gây ra mỗi cấp', max: 20 },
  knock:  { name: 'Lực đánh văng', icon: '💥', desc: '+5% lực đánh văng mỗi cấp', max: 20 },
  weight: { name: 'Trụ vững',    icon: '🪨', desc: '+6% kháng văng mỗi cấp', max: 20 },
  speed:  { name: 'Tốc độ',      icon: '🏃', desc: '+4% tốc chạy mỗi cấp', max: 20 },
  haste:  { name: 'Hồi chiêu',   icon: '⏳', desc: '+5% tốc hồi chiêu mỗi cấp', max: 20 },
  rage:   { name: 'Ý chí',       icon: '🔥', desc: '+8% tốc tích nộ mỗi cấp', max: 20 },
};
const TECH_DEFS = {
  reflex: { name: 'Phản xạ',   icon: '⚡', desc: 'Ra quyết định nhanh hơn', max: 10 },
  dodge:  { name: 'Né tránh',  icon: '🌀', desc: 'Đọc đòn, dùng chiêu phòng thủ đúng lúc', max: 10 },
  tactic: { name: 'Chiến thuật', icon: '🧠', desc: 'Tư duy: giữ vị trí, ép mép, dụ đòn — và mở khóa chiến thuật nâng cao', max: 10 },
  aim:    { name: 'Chính xác', icon: '🎯', desc: 'Ngắm đón đầu, canh tầm đánh chuẩn', max: 10 },
};
// ===== Tâm trí: Tín Nhiệm & Trí Tuệ (gốc khác nhau ở mỗi tướng) =====
// Tín Nhiệm 0–100: nghe lệnh HLV. Thấp → chần chừ / phớt lờ • ≥80 → làm NGAY LẬP TỨC (bỏ qua điều kiện tầm).
//   Thắng trận +4, thua trận -6 • trang bị cộng thêm.
// Trí Tuệ 1–12: tốc phản ứng, giữ khoảng cách / tầm combo, đọc đòn, phân biệt ảo ảnh.
//   Nâng 🧠 Chiến thuật +0.35/cấp • trang bị cộng thêm.
const MIND_DEFS = {
  trust: { name: 'Tín Nhiệm', icon: '🤝', desc: 'Nghe lệnh HLV: thấp thì chần chừ / phớt lờ, từ 80 trở lên làm ngay lập tức. Thắng trận +4, thua trận -6 (Aria chỉ -2)', max: 100 },
  wis:   { name: 'Trí Tuệ',   icon: '🦉', desc: 'Phản ứng nhanh, giữ khoảng cách & tầm combo chuẩn, đọc đòn, nhìn thấu ảo ảnh. Tăng theo 🧠 Chiến thuật và trang bị', max: 12 },
};
//              [Tín Nhiệm gốc, Trí Tuệ gốc]
const CHAR_MIND = {
  valerius: [72, 6], theron: [66, 5], florian: [45, 7], ignatius: [50, 7],
  gideon: [76, 6], aria: [85, 6], koda: [15, 3], death: [40, 7], elara: [60, 6], percy: [55, 6],
  borg: [35, 3], roxie: [50, 6], alice: [35, 8],
  ryoma: [55, 6], wukong: [30, 7], kazuki: [62, 8],
  zero: [70, 7], songluc: [45, 6],
  clint: [50, 4], jack: [28, 5],
  vesper: [45, 7], raven: [60, 7], thanhphong: [50, 9], galo: [22, 8],
  victoria: [82, 8], joker: [40, 9],
};
function mindBase(charId) { return CHAR_MIND[charId] || [50, 5]; }
// Tín Nhiệm thay đổi sau mỗi trận: mặc định thắng +4 / thua -6 • Aria tin HLV sâu sắc: thua chỉ -2
const TRUST_SWING = { aria: { win: 4, lose: -2 } };
function trustDelta(charId, won) { const s = TRUST_SWING[charId] || { win: 4, lose: -6 }; return won ? s.win : s.lose; }
// Trí Tuệ thực = gốc + Chiến thuật + trang bị
function wisOf(charId, tech, bonus = 0) { return clamp(mindBase(charId)[1] + (((tech && tech.tactic) || 1) - 1) * 0.35 + bonus, 1, MIND_DEFS.wis.max); }
const SKILL_KEYS = ['A', 'B', 'C', 'D', 'U'];

// ===== Giải đấu trên bản đồ =====
const TOURNAMENTS = [
  { id: 't1', name: 'Cúp Làng Gió', tier: 1, size: 8, arena: 'go', arenas: ['rung', 'go', 'go'], x: 12, y: 74, desc: 'Giải nhập môn cho các tân binh.' },
  { id: 't2', name: 'Giải Thung Lũng Đá', tier: 2, size: 8, arena: 'da', arenas: ['sa', 'da', 'da'], x: 30, y: 50, desc: 'Đấu sĩ đá cứng cỏi của vùng núi.' },
  { id: 't3', name: 'Giải Hồ Băng', tier: 3, size: 8, arena: 'bang', arenas: ['cang', 'bang', 'bang'], x: 48, y: 72, desc: 'Sàn băng trơn — bị đánh là trượt rất xa!' },
  { id: 't4', name: 'Giải Hỏa Sơn', tier: 4, size: 8, arena: 'lava', arenas: ['dien', 'lava', 'lava'], x: 63, y: 40, desc: 'Sàn nhỏ trên miệng núi lửa.' },
  { id: 't5', name: 'Giải Thiên Không', tier: 5, size: 16, arena: 'troi', arenas: ['xoay', 'troi', 'dien', 'troi'], x: 78, y: 66, desc: '16 cao thủ trên đảo mây.' },
  { id: 't6', name: 'Đại Hội Võ Thần', tier: 6, size: 16, arena: 'ngai', arenas: ['sa', 'cang', 'xoay', 'ngai'], x: 88, y: 24, desc: 'Ngai vàng của kẻ mạnh nhất thiên hạ.' },
];

const FIRST_NAMES = ['Long', 'Hổ', 'Phong', 'Vân', 'Thiên', 'Kiệt', 'Bảo', 'Hùng', 'Dũng', 'Minh', 'Lâm', 'Sơn', 'Hải', 'Tùng', 'Khánh',
  'Quân', 'Vũ', 'Nhật', 'Tuấn', 'Lực', 'Mai', 'Lan', 'Trang', 'Ngọc', 'Hằng', 'Linh', 'Yến', 'Tuyết', 'Băng', 'Hỏa', 'Lôi', 'Ảnh'];
const TITLES = ['Thiết Quyền', 'Phong Ảnh', 'Hắc Long', 'Bạch Hổ', 'Lãnh Huyết', 'Cuồng Đao', 'Vô Ảnh', 'Thần Tiễn', 'Độc Nhãn',
  'Kim Cương', 'Lôi Thần', 'Tuyết Ưng', 'Hỏa Lang', 'Ám Sát', 'Thiết Bích', 'Du Hiệp', 'Lãng Khách', 'Quỷ Kiếm'];
const FIGHTER_COLORS = ['#ff5a5a', '#5aa9ff', '#5ad67a', '#ffb84a', '#c47aff', '#ff7ad1', '#4ae0d0', '#e0e05a', '#ff8a4a', '#9aa0ff'];
function randomFighterName() { return `${pick(FIRST_NAMES)} ${pick(TITLES)}`; }
