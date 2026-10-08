'use strict';
// ===== Mệnh lệnh trong trận =====
// Mỗi nhân vật có bể lệnh = 3 lệnh cơ bản + lệnh riêng. HLV mang tối đa 3 lệnh vào mỗi ván (đổi được giữa các ván).
// Kiểu lệnh: basic (attack/retreat/ult) • key: ép dùng chiêu • note: ưu tiên bản nhạc • stance: ưu tiên thế • pref: ưu tiên chiêu
//            hold: kìm chiêu • full: gồng/kéo tối đa. ai(f, t, m, d): HLV máy dùng lệnh khi điều kiện đúng.
const CMD_MAX = 3;
const CMD_CD = 8;
const COMMANDS = {
  // --- cơ bản (ai cũng có) ---
  attack:  { name: 'Tiến lên!', icon: '📣', desc: 'TẤT TAY: phớt lờ mọi thứ — không né, không lùi, không sợ mép, không ngại thế thủ đối phương — lao lên đánh tới cùng cho tới khi có người rơi đài (tối đa 8s).', basic: true,
    ai: (f, t) => t.percent > 95 && f.percent < 120 },
  retreat: { name: 'Rút lui!', icon: '🏃', desc: 'Lùi về giữa sân, tránh giao tranh 4s.', basic: true,
    ai: (f, t, m, d) => f.percent > 115 && d < 220 && t.percent < f.percent - 30 },
  ult:     { name: 'Tung Nộ!', icon: '⚡', desc: 'Tung Nộ ngay khi có thể.', basic: true, needUlt: true,
    ai: (f, t, m, d) => f.ultReady() && (t.percent > 70 || f.percent > 130) },
  // --- Valerius ---
  shield:  { name: 'Giơ khiên!', icon: '🛡️', desc: 'Giơ Khiên Chắn (C) ngay khi đối thủ áp sát.', key: 'C', near: 170, dur: 3,
    ai: (f, t, m, d) => d < 150 && t.action && t.action.atk },
  // --- Elara ---
  snipe:   { name: 'Kéo căng dây!', icon: '🎯', desc: 'Kéo Căng Dây (B) tối đa ở lần bắn kế tiếp.', key: 'B', full: true, far: 140, dur: 4,
    ai: (f, t, m, d) => d > 320 },
  volley:  { name: 'Mưa tên!', icon: '🌧️', desc: 'Xả Liên Xạ / Tên Hình Nón liên tục trong 5s.', pref: { A: 2, D: 1.8, B: 0.3 }, dur: 5,
    ai: (f, t, m, d) => d > 140 && d < 380 && t.percent < 70 },
  // --- Percy ---
  fortress:{ name: 'Cắm trận địa!', icon: '🏯', desc: 'Mở Trận Địa Nỏ (D) ngay tại chỗ.', key: 'D', dur: 3,
    ai: (f, t, m, d) => d > 140 && d < 360 },
  hook:    { name: 'Móc nó lại!', icon: '🪝', desc: 'Dùng Móc & Đạp (B) ngay khi trong tầm.', key: 'B', dur: 3,
    ai: (f, t, m, d) => t.percent > 70 && d > 200 },
  // --- Aria: chọn bản nhạc ---
  songA:   { name: 'Hành Khúc!', icon: '🎺', desc: 'Chỉ chơi nốt Đỏ (AAA) — dậm và choáng.', note: 'A', dur: 8,
    ai: (f, t, m, d) => d < 150 && f.percent < 90 },
  songB:   { name: 'Ru Ngủ!', icon: '🎻', desc: 'Chỉ chơi nốt Xanh (BBB) — trói và mê hoặc.', note: 'B', dur: 8,
    ai: (f, t, m, d) => d > 200 && t.percent > 50 },
  songC:   { name: 'Bảo Hộ!', icon: '🎶', desc: 'Chỉ chơi nốt Vàng (CCC) — khiên, hồi phục, Oktava đẩy lùi.', note: 'C', dur: 8,
    ai: (f) => f.percent > 90 },
  split:   { name: 'Tách ra!', icon: '↔️', desc: 'Aria tách xa Oktava 8s: Oktava xông lên KHIÊU KHÍCH và dậm choáng (khống chế), Aria đứng xa yểm trợ.', mode: 'split', dur: 8,
    ai: (f, t, m, d) => d < 200 && f.ws.guard && f.ws.guard.alive && f.ws.mounted <= 0 },
  gather:  { name: 'Tập hợp!', icon: '🫂', desc: 'Aria chơi quanh Oktava 8s: nép sau lưng gã khổng lồ, Oktava che chắn và khiêu khích kẻ áp sát.', mode: 'gather', dur: 8,
    ai: (f, t, m, d) => f.percent > 70 && f.ws.guard && f.ws.guard.alive },
  // --- Koda ---
  lurk:    { name: 'Rình trên tường!', icon: '🧗', desc: 'Leo bám cột gần nhất rồi vồ xuống.', key: 'C', dur: 4,
    ai: (f, t, m, d) => d > 180 && !!m.arena.nearPillar(f, 60) },
  rip:     { name: 'Xé toạc!', icon: '🩸', desc: 'Xé Toạc (B) ngay khi đối thủ có từ 3 tầng Chảy Máu.', key: 'B', minBleed: 3, dur: 4,
    ai: (f, t) => t.has('bleed') && t.has('bleed').n >= 3 },
  // --- Roxie ---
  mech:    { name: 'Gọi T-Zero!', icon: '🤖', desc: 'Ghép mảnh / gọi Thiết Vệ (D) ngay khi đủ bánh răng.', key: 'D', dur: 5,
    ai: (f) => f.ws.parts >= 3 },
  turret:  { name: 'Dựng ụ pháo!', icon: '🛠', desc: 'Dựng Ụ Pháo (giữ A) ngay khi có 2 bánh răng.', key: 'A', hold: true, dur: 4,
    ai: (f, t, m, d) => f.ws.gears >= 2 && f.ws.cannons && !f.ws.cannons.length && d > 150 },
  // --- Gideon ---
  guard:   { name: 'Thế thủ!', icon: '🗿', desc: 'Gồng Thế Thủ (C) đón đòn, rồi phản đòn cường hóa.', key: 'C', near: 230, dur: 3,
    ai: (f, t, m, d) => d < 200 && t.action && t.action.atk },
  pommel:  { name: 'Cán kiếm!', icon: '🗡️', desc: 'Húc Cán Kiếm (D) đẩy đối thủ ra đúng Điểm Ngọt.', key: 'D', near: 80, dur: 3,
    ai: (f, t, m, d) => d < 70 },
  // --- Florian ---
  parry:   { name: 'Phản đòn!', icon: '🤺', desc: 'Vào Thế Thủ (C) chờ phản đòn.', key: 'C', near: 180, dur: 3,
    ai: (f, t, m, d) => d < 160 && t.action && t.action.atk },
  marks:   { name: 'Tứ Ấn!', icon: '🎭', desc: 'Ném Tứ Ấn (D) ngay.', key: 'D', dur: 3,
    ai: (f, t, m, d) => d < 420 },
  // --- Ryoma ---
  wave:    { name: 'Kiếm khí!', icon: '🌙', desc: 'Chém Kiếm Khí (D) ngay khi có combo.', key: 'D', dur: 4,
    ai: (f, t, m, d) => f.ws.wave > 0 && d > 150 },
  // --- Theron ---
  charge:  { name: 'Xung phong!', icon: '🔱', desc: 'Xung Phong (B) ngay, kể cả khi chưa canh thẳng cột.', key: 'B', dur: 3,
    ai: (f, t, m, d) => t.percent > 80 && d < 280 },
  vault:   { name: 'Nhảy né!', icon: '🦘', desc: 'Chống Thương Nhảy (C) né đòn sắp tới.', key: 'C', near: 220, dur: 3,
    ai: (f, t) => t.ultReady && t.ultReady() },
  // --- Borg ---
  brace:   { name: 'Gồng lên!', icon: '🧱', desc: 'Gồng Mình (C) hút sát thương để Trả Đòn x2.', key: 'C', near: 180, dur: 3,
    ai: (f, t, m, d) => d < 150 && t.action && t.action.atk },
  grab:    { name: 'Chộp nó!', icon: '🤼', desc: 'Chộp & Quật (D) ngay khi trong tầm.', key: 'D', near: 180, dur: 3,
    ai: (f, t, m, d) => d < 160 },
  // --- Clint ---
  reload:  { name: 'Nạp khẩn!', icon: '🔄', desc: 'Nạp Đạn Khẩn Cấp (D) ngay — đòn kế chí mạng.', key: 'D', dur: 3,
    ai: (f) => f.ws.shells === 0 },
  rocket:  { name: 'Bắn nhảy!', icon: '🚀', desc: 'Bắn Nhảy (C) thoát thân / về giữa sân.', key: 'C', cast: 'center', dur: 3,
    ai: (f, t, m) => m.arena.edgeDist(f.x, f.y) < 120 },
  // --- Zero ---
  lock:    { name: 'Khóa mục tiêu!', icon: '🎯', desc: 'Đánh dấu mục tiêu (D) ngay.', key: 'D', dur: 3,
    ai: (f, t) => !t.gunMark },
  dump:    { name: 'Xả băng!', icon: '💥', desc: 'Xả toàn bộ băng đạn (B) ngay.', key: 'B', near: 340, dur: 3,
    ai: (f, t) => f.ws.ammo >= 5 && t.percent > 60 },
  // --- Jack ---
  hold:    { name: 'Khoan đã, Jack!', icon: '✋', desc: 'Kìm không cho chơi Cò Quay Nga trong 10s (Jack có 35% phớt lờ HLV).', block: 'D', dur: 10, disobey: 0.35,
    ai: (f) => f.percent > 110 },
  fan:     { name: 'Quạt cò!', icon: '🎲', desc: 'Xả hết ổ đạn (B) ngay khi trong tầm.', key: 'B', near: 240, dur: 3,
    ai: (f, t, m, d) => d < 220 && f.ws.cyl >= 4 },
  // --- Song Lục ---
  chrono:  { name: 'Chrono!', icon: '🕰', desc: 'Chuyển & giữ thế Chrono trong 10s.', stance: 'chrono', dur: 10,
    ai: (f, t, m, d) => d < 170 && f.ws.stance !== 'chrono' && f.ws.ammoC > 0 },
  neo:     { name: 'Neo!', icon: '🔮', desc: 'Chuyển & giữ thế Neo trong 10s.', stance: 'neo', dur: 10,
    ai: (f, t, m, d) => d > 280 && f.ws.stance !== 'neo' && f.ws.ammoN > 0 },
  // --- Vesper ---
  stealth: { name: 'Ẩn thân!', icon: '👻', desc: 'Bật Ẩn Thân (C) và lẻn ra sau lưng.', key: 'C', dur: 3,
    ai: (f, t, m, d) => d > 160 && d < 360 },
  blink:   { name: 'Phi dao!', icon: '🔪', desc: 'Phi Dao Ảnh Bộ (D) rồi dịch chuyển ra sau lưng.', key: 'D', dur: 3,
    ai: (f, t, m, d) => d > 120 && d < 380 },
  // --- Ignatius ---
  bigfire: { name: 'Đại hỏa cầu!', icon: '☄️', desc: 'Tích Đại Hỏa Cầu (B) tối đa.', key: 'B', full: true, far: 120, dur: 4,
    ai: (f, t, m, d) => d > 250 && t.percent > 60 },
  ring:    { name: 'Vòng lửa!', icon: '🔥', desc: 'Bùng Vòng Lửa (D) đẩy kẻ áp sát.', key: 'D', near: 120, dur: 3,
    ai: (f, t, m, d) => d < 100 },
  // --- Death ---
  judge:   { name: 'Phán quyết!', icon: '☠️', desc: 'Bổ Phán Quyết (B) ngay khi trong tầm.', key: 'B', near: 200, dur: 3,
    ai: (f, t, m, d) => t.percent > 80 && d < 190 },
  mill:    { name: 'Xoay liềm!', icon: '🌀', desc: 'Thả Xoay Liềm (C) khóa vùng.', key: 'C', dur: 3,
    ai: (f, t, m, d) => d > 100 && d < 260 },
  // --- Raven ---
  oca:     { name: 'Thả Oca!', icon: '🐦‍⬛', desc: 'Thả quạ máy Oca (D) ngay: đánh dấu và thả bom làm chậm mục tiêu.', key: 'D', dur: 3,
    ai: (f, t, m, d) => d < 700 },
  hunter:  { name: 'Chế độ Thợ Săn!', icon: '🎯', desc: 'Ngừng súng trường 6s, chỉ ngắm bắn tỉa (B) — phát bắn tốt nhất khi mục tiêu đã bị Oca đánh dấu.', pref: { B: 3, A: 0.05 }, dur: 6,
    ai: (f, t) => t.ocaMark && t.ocaMark.owner === f },
  smoke:   { name: 'Ném khói!', icon: '💨', desc: 'Ném bom khói (C) ngay khi kẻ địch áp sát: tàng hình, làm mù đối thủ.', key: 'C', near: 200, dur: 3,
    ai: (f, t, m, d) => d < 130 },
  // --- Alice ---
  mirror:  { name: 'Phân thân!', icon: '🪞', desc: 'Dùng Ảo Ảnh Độc Lập (C) ngay — đủ 50 Náo Nhiệt thì hoán đổi chỗ và vây 5 ảo ảnh.', key: 'C', dur: 3,
    ai: (f, t, m, d) => d < 300 },
  vanish:  { name: 'Tẩu thoát!', icon: '✨', desc: 'Đổi chỗ với ảo ảnh an toàn nhất (D) ngay.', key: 'D', dur: 3,
    ai: (f, t, m, d) => d < 130 && f.percent > 80 },
  showtime:{ name: 'Lên sân khấu!', icon: '🎴', desc: 'Dồn phi dao & lướt đâm 5s (ưu tiên A, B) để tích Náo Nhiệt.', pref: { A: 1.8, B: 1.8 }, dur: 5,
    ai: (f, t, m, d) => d < 200 && (f.ws.hype || 0) < 40 },
  // --- Wukong ---
  pin:     { name: 'Định Thân!', icon: '🗿', desc: 'Hóa đá mục tiêu bằng Định Thân Thuật (D) ngay khi đủ 2 Khí Ấn.', key: 'D', dur: 4,
    ai: (f, t, m) => !!qiTarget(f, m) },
  pillar:  { name: 'Kình Thiên Trụ!', icon: '🗼', desc: 'Cắm côn (C) và gồng TỐI ĐA 3s trước khi đập xuống.', key: 'C', full: true, dur: 3,
    ai: (f, t) => t._stoneUntil > 0 && t.has('stun') },
  qicombo: { name: 'Hút + Đâm + Định!', icon: '☯', desc: 'Chuỗi chuẩn: Toàn Phong Côn (A) → Trực Thích (B) → Định Thân (D).', seq: ['A', 'B', 'D'], combo: true, ai: (f, t, m, d) => d < 140 && f.ws.focus >= 50 },
  // --- Kazuki ---
  parryK:  { name: 'Phản đòn!', icon: '☯', desc: 'Thủ thế Vô Tướng Nghịch Trảm (D) ngay khi đối thủ ra đòn trong 4s.', key: 'D', near: 200, dur: 4,
    ai: (f, t, m, d) => d < 180 && t.action && t.action.atk },
  stormK:  { name: 'Loạn Vũ!', icon: '🌸', desc: 'Tốn 5 Kiếm Ý tung Loạn Vũ Hư Ảnh (C) ngay.', key: 'C', hold: true, near: 240, dur: 3,
    ai: (f, t, m, d) => f.ws.si >= 5 && f.percent > 60 },
  kzBB:    { name: 'B → B → C!', icon: '🗡️', desc: 'Đột Kích Đoạn Đao: lướt xuyên 3.5m, choáng 2s rồi tra kiếm kích nổ.', seq: ['B', 'B', 'C'], combo: true, anyRange: true, ai: (f, t, m, d) => d > 100 && d < 220 },
  kzAB:    { name: 'A → B → C!', icon: '💫', desc: 'Quán Kình Đao: đâm thẳng choáng 1s, đẩy văng theo đường thẳng.', seq: ['A', 'B', 'C'], combo: true, ai: (f, t, m, d) => d < 110 && t.percent > 70 },
  // --- KẸP GÓC: đứng chặn phía trong sân, dùng chiêu tầm xa ép đối thủ ra mép (6s) ---
  corner:  { name: 'Kẹp góc!', icon: '📐', desc: 'Chiếm phía trong sân, chỉ bắn/chém tầm xa khi hướng đòn đẩy đối thủ ra mép (6s).', corner: true, dur: 6,
    ai: (f, t, m, d) => t.percent > 50 && m.arena.edgeDist(t.x, t.y) < 260 },
  // --- COMBO: ra lệnh tung đúng chuỗi chiêu ---
  // Ryoma (Katana): mỗi cặp chiêu liên tiếp kích hoạt một combo khác nhau
  cAA: { name: 'Combo AA', icon: '🌀', desc: 'Nhất Đao x2 → chém tròn rộng quanh người.', seq: ['A', 'A'], combo: true, ai: (f, t, m, d) => d < 95 },
  cAB: { name: 'Combo AB', icon: '💨', desc: 'Nhất Đao + Đột Thích → lướt chém xuyên rồi chém tròn.', seq: ['A', 'B'], combo: true, ai: (f, t, m, d) => d < 110 },
  cAC: { name: 'Combo AC', icon: '👥', desc: 'Nhất Đao + Thuấn Bộ → hư ảnh ở chỗ cũ cùng chém (kẹp 2 phía).', seq: ['A', 'C'], combo: true, ai: (f, t, m, d) => d < 100 && m.arena.edgeDist(t.x, t.y) < 220 },
  cBB: { name: 'Combo BB', icon: '💫', desc: 'Đột Thích x2 → nhát đâm thứ 3 gây CHOÁNG.', seq: ['B', 'B'], combo: true, ai: (f, t, m, d) => d > 50 && d < 120 },
  cBC: { name: 'Combo BC', icon: '🏹', desc: 'Combo TẦM XA: đâm rồi Thuấn Bộ → phóng dư ảnh xuyên thấu. Dùng để kẹp góc / phá tụ lực.', seq: ['B', 'C'], combo: true, anyRange: true,
    ai: (f, t, m, d) => d > 150 && d < 380 && (t.action && t.action.charge || m.arena.edgeDist(t.x, t.y) < 230) },
  cCC: { name: 'Combo CC', icon: '🌪️', desc: 'Thuấn Bộ x2 → gió xoáy làm chậm.', seq: ['C', 'C'], combo: true, ai: (f, t, m, d) => d > 120 && d < 260 },
  // combo chiêu của các nhân vật khác
  bash:    { name: 'Khiên + Đâm!', icon: '🛡️', desc: 'Khiên Chắn (C) húc câm lặng rồi Đâm Thẳng (B) kết liễu.', seq: ['C', 'B'], combo: true, ai: (f, t, m, d) => d < 120 && t.percent > 60 },
  iceshot: { name: 'Sao băng + Kéo cung!', icon: '❄️', desc: 'Sao Băng Lùi (C) làm chậm rồi Kéo Căng Dây (B) tối đa.', seq: ['C', 'B'], combo: true, full: true, anyRange: true, ai: (f, t, m, d) => d < 200 },
  hookturret: { name: 'Móc + Trận địa!', icon: '🏯', desc: 'Móc & Đạp (B) kéo địch về rồi cắm Trận Địa Nỏ (D).', seq: ['B', 'D'], combo: true, ai: (f, t, m, d) => d > 200 && d < 420 },
  pounce:  { name: 'Vồ + Cào!', icon: '🐾', desc: 'Vồ Mồi (D) đè xuống rồi Cào Loạn Xạ (A) dồn tầng Chảy Máu.', seq: ['D', 'A'], combo: true, ai: (f, t, m, d) => d > 60 && d < 220 },
  sweet:   { name: 'Cán kiếm + Bổ dọc!', icon: '🗡️', desc: 'Cán Kiếm (D) đẩy địch ra Điểm Ngọt rồi Bổ Dọc (B) đóng đinh.', seq: ['D', 'B'], combo: true, ai: (f, t, m, d) => d < 80 },
  markdash:{ name: 'Tứ Ấn + Đâm Lao!', icon: '🎭', desc: 'Ném Tứ Ấn (D) rồi Đâm Lao (A) phá ấn.', seq: ['D', 'A'], combo: true, anyRange: true, ai: (f, t, m, d) => d > 120 && d < 300 },
  trip:    { name: 'Quét + Xung phong!', icon: '🔱', desc: 'Quét Chân (D) làm ngã rồi Xung Phong (B) ủi đi.', seq: ['D', 'B'], combo: true, ai: (f, t, m, d) => d < 110 },
  counterpunch: { name: 'Gồng + Trả đòn!', icon: '🥊', desc: 'Gồng Mình (C) hút sát thương rồi Trả Đòn (B) với lực đẩy cực đại.', seq: ['C', 'B'], combo: true, ai: (f, t, m, d) => d < 120 && t.action && t.action.atk },
  shellshot: { name: 'Vỏ đạn + Bắn!', icon: '🤠', desc: 'Ném vỏ đạn (D) choáng + nạp đầy, rồi Bắn (B) chí mạng.', seq: ['D', 'B'], combo: true, ai: (f, t, m, d) => d < 160 },
  execute: { name: 'Khóa + Xả băng!', icon: '🎯', desc: 'Khóa Mục Tiêu (D) rồi Xả Băng (B).', seq: ['D', 'B'], combo: true, ai: (f, t, m, d) => d < 340 && f.ws.ammo >= 6 },
  timeshift: { name: 'Đổi thế + Thời Khắc!', icon: '⏳', desc: 'Chuyển Thế (D) rồi tung ngay Thời Khắc (B) của thế mới.', seq: ['D', 'B'], combo: true, ai: (f, t, m, d) => d < 300 },
  assassinate: { name: 'Phi dao + Ám sát!', icon: '🗡', desc: 'Phi Dao (D), trúng thì dịch chuyển ra sau lưng (D) rồi Xuyên Tâm (B).', seq: ['D', 'D', 'B'], combo: true, ai: (f, t, m, d) => d > 120 && d < 380 },
  firetrap: { name: 'Vòng lửa + Hỏa cầu!', icon: '☄️', desc: 'Vòng Lửa (D) đẩy lùi rồi tích Đại Hỏa Cầu (B).', seq: ['D', 'B'], combo: true, anyRange: true, ai: (f, t, m, d) => d < 110 },
  reap:    { name: 'Kéo + Gặt!', icon: '💀', desc: 'Lưỡi Hái (D) kéo địch về rồi Gặt (A) hất tung lên trời.', seq: ['D', 'A'], combo: true, ai: (f, t, m, d) => d > 120 && d < 280 },
};
const CHAR_COMMANDS = {
  valerius: ['shield', 'bash'], elara: ['snipe', 'volley', 'iceshot', 'corner'], percy: ['fortress', 'hook', 'hookturret', 'corner'],
  aria: ['songA', 'songB', 'songC', 'split', 'gather'], koda: ['lurk', 'rip', 'pounce'], roxie: ['mech', 'turret', 'corner'],
  gideon: ['guard', 'pommel', 'sweet'], florian: ['parry', 'marks', 'markdash', 'corner'],
  ryoma: ['wave', 'cAA', 'cAB', 'cAC', 'cBB', 'cBC', 'cCC', 'corner'], theron: ['charge', 'vault', 'trip'],
  borg: ['brace', 'grab', 'counterpunch'], clint: ['reload', 'rocket', 'shellshot', 'corner'],
  zero: ['lock', 'dump', 'execute', 'corner'], jack: ['hold', 'fan', 'corner'], songluc: ['chrono', 'neo', 'timeshift', 'corner'],
  vesper: ['stealth', 'blink', 'assassinate', 'corner'], ignatius: ['bigfire', 'ring', 'firetrap', 'corner'], death: ['judge', 'mill', 'reap', 'corner'],
  raven: ['oca', 'hunter', 'smoke', 'corner'], alice: ['mirror', 'vanish', 'showtime'],
  wukong: ['pin', 'pillar', 'qicombo'], kazuki: ['parryK', 'stormK', 'kzBB', 'kzAB'],
};
// --- Victoria • Joker • Diệp Thanh Phong • Galo ---
Object.assign(COMMANDS, {
  vflag:   { name: 'Cắm cờ!', icon: '🚩', desc: 'Chuyển sang Cờ Lệnh rồi cắm cờ (B): đẩy địch ra đúng rìa Donut + Choáng.', stance: 'flag', key: 'B', near: 140, dur: 6,
    ai: (f, t, m, d) => d < 140 },
  vfire:   { name: 'Bão lửa!', icon: '🔥', desc: 'Chuyển sang AR rồi toàn quân xả Bão Lửa Liên Thanh (C).', stance: 'ar', key: 'C', dur: 6,
    ai: (f, t, m, d) => d > 180 && vicSold(f).length >= 2 },
  vrail:   { name: 'Pháo điện từ!', icon: '🎯', desc: 'Chuyển sang Lục rồi gọi Pháo Điện Từ (C) giáng xuống mục tiêu.', stance: 'pistol', key: 'C', dur: 6,
    ai: (f, t) => t.has('stun') || t.has('slow') },
  jdraw:   { name: 'Rút bài!', icon: '🎴', desc: 'Rút Bài May Rủi (B) ngay.', key: 'B', dur: 3, ai: (f) => !f.ws.card },
  jswap:   { name: 'Tráo bài!', icon: '🔀', desc: 'Tráo Bài Dưới Tay Áo (C): lướt né và đổi lá mới.', key: 'C', cast: 'center', dur: 3, ai: (f, t, m, d) => d < 120 },
  jsteal:  { name: 'Mượn tý nha!', icon: '🃏', desc: 'Dùng ngay bản sao trang bị/phép vừa mượn (D).', key: 'D', dur: 4, ai: (f) => !!f.ws.stolen },
  wshift:  { name: 'Đổi gió!', icon: '🌬️', desc: 'Nghịch Chuyển Canh Khí (D) ngay — ở Bão Hòa còn thanh tẩy khống chế.', key: 'D', dur: 3, ai: (f) => f.has('stun') || f.has('root') },
  wkill:   { name: 'Đoạt mệnh!', icon: '🗡️', desc: 'Đẩy gió lên Nghịch Phong rồi phóng Đoạt Mệnh Phong Kích (B) tốc biến sau lưng.', seq: ['D', 'B'], combo: true, anyRange: true, ai: (f, t, m, d) => t.percent > 70 && d < 260 },
  wsmoke:  { name: 'Gió mê!', icon: '🌫️', desc: 'Mê Tung Phong Vực (C): gió độc mù + câm, dịch chuyển thoát thân.', key: 'C', cast: 'center', dur: 3, ai: (f, t, m, d) => d < 100 },
  gbeast:  { name: 'Quá liều!', icon: '💉', desc: 'Hóa Quái Thú (D) ngay.', key: 'D', dur: 3, ai: (f, t, m) => !galoBeast(f) && galoN(f, t, m) >= 5 },
  gbite:   { name: 'Cắn nó!', icon: '🦷', desc: 'Dạng Thú: Ngoạm Cắn (B) tống về phía mép • Dạng Người: Bom Khí Ngạt (B).', key: 'B', dur: 4, ai: (f, t, m, d) => galoBeast(f) && d < 170 },
  gpounce: { name: 'Vồ!', icon: '🐺', desc: 'Dạng Thú: gầm choáng rồi vồ tới (C) • Dạng Người: nhảy lùi thả khói (C).', key: 'C', dur: 3, ai: (f, t, m, d) => galoBeast(f) && d > 90 && d < 220 },
});
Object.assign(CHAR_COMMANDS, { victoria: ['vflag', 'vfire', 'vrail', 'corner'], joker: ['jdraw', 'jswap', 'jsteal'], thanhphong: ['wshift', 'wkill', 'wsmoke'], galo: ['gbeast', 'gbite', 'gpounce'] });
// --- LỆNH TRANG BỊ: mỗi trang bị kích hoạt đang mang theo sinh ra 1 lệnh "Dùng ...!" ---
const ITEM_CMD_AI = {
  it_mask: (f, t, m, d) => d < 120,
  it_jet: (f, t, m) => m.arena.edgeDist(f.x, f.y) < 70 && f.percent > 60,
  it_mercury: (f) => f.has('stun') || f.has('root') || f.has('taunt'),
  it_anchor: (f, t, m) => flyingOut(f, m),
  it_void: (f, t, m, d) => d < 220 && f.percent > 80,
  it_hourglass: (f, t, m) => flyingOut(f, m),
  it_breaker: (f, t, m, d) => d < 160 && t.percent > 70,
  it_chain: (f, t, m, d) => d < 300 && f.percent > 100,
  it_ariasong: (f, t, m, d) => d < 150 || f.percent > 100,
  it_flyer: (f, t, m, d) => d > 180 && d < 320 && m.arena.edgeDist(f.x, f.y) > 120,
};
for (const it of ITEMS) if (it.active) {
  COMMANDS['use_' + it.id] = { name: `${it.name}!`, icon: it.icon, desc: `Dùng ngay trang bị kích hoạt: ${it.desc} (đang hồi thì đấu sĩ chờ tối đa 4s rồi dùng).`, itemUse: it.id, item: true,
    ai: (f, t, m, d) => !((f.icd[it.id] || 0) > 0) && (ITEM_CMD_AI[it.id] || (() => false))(f, t, m, d) };
}
// bể lệnh = 3 lệnh cơ bản + lệnh riêng nhân vật + lệnh của trang bị kích hoạt đang mang
function commandPool(charId, items) {
  const it = Object.values(items || {}).filter((id) => ITEM_BY_ID[id] && ITEM_BY_ID[id].active).map((id) => 'use_' + id);
  return ['attack', 'retreat', 'ult', ...(CHAR_COMMANDS[charId] || []), ...it];
}
function defaultCommands(charId) { return ['attack', 'retreat', 'ult']; }
// HLV máy chọn 3 lệnh: luôn mang Nộ + lệnh ngẫu nhiên trong bể (ưu tiên lệnh riêng / trang bị)
function aiCommands(charId, items) {
  const own = shuffle(commandPool(charId, items).filter((k) => !['attack', 'retreat', 'ult'].includes(k)));
  const rest = shuffle(['attack', 'retreat']);
  return ['ult', ...own, ...rest].slice(0, CMD_MAX);
}
// --- LỆNH ĐỘI (chế độ 3v3) — Leader hô, cả đội cùng thi hành ---
Object.assign(COMMANDS, {
  tFocus:    { name: 'Tập trung hỏa lực!', icon: '🎯', desc: 'Hỗn Chiến: cả đội dồn đánh kẻ địch có điểm văng cao nhất trong 6s.', team: 'focus', dur: 6, cd: 10,
    ai: (f, t, m) => m.fighters.some((e) => e.team !== f.team && e.alive && e.percent > 90) },
  tLeader:   { name: 'Hạ thủ lĩnh!', icon: '👑', desc: 'Hỗn Chiến: cả đội lao vào Leader của đội địch trong 6s.', team: 'leader', dur: 6, cd: 12,
    ai: (f, t, m) => { const L = m.lead(1 - f.team); return !!L && L.alive && L.percent > 60; } },
  tProtect:  { name: 'Bảo vệ Leader!', icon: '🛡️', desc: 'Hỗn Chiến: đồng đội bám sát Leader và đánh bất kỳ kẻ nào lại gần Leader trong 6s.', team: 'protect', dur: 6, cd: 10,
    ai: (f) => f.percent > 90 },
  tSurround: { name: 'Bao vây!', icon: '🔱', desc: 'Hỗn Chiến: cả đội tản ra vây mục tiêu của Leader từ nhiều hướng, chặn đường về giữa sân — dễ đẩy ra mép (6s).', team: 'surround', dur: 6, cd: 10,
    ai: (f, t) => t.percent > 70 },
  tRegroup:  { name: 'Tập hợp!', icon: '🫂', desc: 'Hỗn Chiến: cả đội rút về quanh Leader 4s, không để bị tách lẻ.', team: 'regroup', dur: 4, cd: 12,
    ai: (f, t, m) => m.teamOf(f.team).filter((x) => x.alive && x.percent > 110).length >= 2 },
  gTag:      { name: 'Đổi người!', icon: '🔁', desc: 'Xa Luân Chiến: rút đấu sĩ đang đấu về cuối hàng (giữ nguyên điểm văng), người kế tiếp lên thay. Mỗi ván 1 lần.', tagOut: true, cd: 999,
    ai: (f, t) => f.percent > 120 && t.percent < 70 },
});
const TEAM_CMDS = { brawl: ['tFocus', 'tLeader', 'tProtect', 'tSurround', 'tRegroup'], gauntlet: ['gTag'] };
function teamOrder(m, team, C) {
  const L = m.lead(team), foes = m.fighters.filter((e) => e.team !== team && e.alive);
  let target = null;
  if (C.team === 'focus') target = foes.slice().sort((a, b) => b.percent - a.percent)[0];
  else if (C.team === 'leader') target = m.lead(1 - team);
  else if (C.team === 'surround') target = L && L.brain && L.brain.target && L.brain.target.alive ? L.brain.target : foes[0];
  for (const o of m.teamOf(team)) if (o.alive && o.brain) o.brain.teamOrder = { type: C.team, until: m.time + (C.dur || 6), target, leader: L };
  if (target && target.alive) { m.fx({ type: 'ring', x: target.x, y: target.y, r: 40, color: '#ff5a5a', life: 0.8, w: 4 }); m.text(target.x, target.y - 70, `${C.icon} MỤC TIÊU!`, '#ff8a7a', 15); }
}
