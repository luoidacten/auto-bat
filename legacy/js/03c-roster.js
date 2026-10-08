'use strict';
// ===== Đội hình nhân vật — xếp theo PHE PHÁI (mỗi nhân vật gắn với 1 vũ khí) =====
// group = phe phái (màn chọn nhân vật chia nhóm theo trường này) • role = vai trò chính
//
// TRA CỨU NHANH: nhân vật → id vũ khí → file chứa bộ chiêu
//   Đế Quốc Autheria     Valerius  kiem_khien  03-weapons.js   | Theron    thuong    03b-weapons2.js
//                        Florian   rapier      03-weapons.js   | Ignatius  truong    03-weapons.js
//   Hiệp Hội Lữ Khách    Gideon    kiem_dai    03-weapons.js   | Aria      voice     03b-weapons2.js (+ minion oktava, oktaform)
//                        Koda      vuot        03b-weapons2.js | Death     liem      03b-weapons2.js (+ shade)
//                        Elara     cung        03-weapons.js   | Percy     no        03-weapons.js
//   Cống Ngầm Down       Borg      nam_tay     03b-weapons2.js | Roxie     hand      03b-weapons2.js (+ mech, cannon, tzero, siege, cyborg)
//                        Alice     ao_thuat    03h-newchars.js (+ illusion)
//   Vương Quốc Phía Đông Ryoma     katana      03-weapons.js   | Wukong    con       03i-east.js
//                        Kazuki    song_kiem   03i-east.js
//   Thành Phố Up         Zero      sung        03-weapons.js   | Chrono & Neo song_luc 03b-weapons2.js (+ decoy)
//                        Victoria  co_lenh     03j-heroes.js (+ linh)
//   Thị Trấn Phía Nam    Clint     sung_san    03b-weapons2.js | Jack      luc_xoay  03b-weapons2.js
//                        Joker     bai         03j-heroes.js
//   Hội Sát Thủ UKI      Vesper    dao         03-weapons.js   | Raven     ban_tia   03h-newchars.js
//                        Thanh Phong thiet_phien 03j-heroes.js | Galo    binh_doc  03j-heroes.js
// Phép bổ trợ (Tốc Biến, Bất Khuất...): SPELLS trong 03k-spells.js
// Nội tại: TALENTS / TALENTS_HI[id nhân vật] trong 03d-talents.js • Lệnh HLV: CHAR_COMMANDS trong 03e-commands.js
// AI riêng: Brain.profilePre (theo id nhân vật) và Brain.choose (theo id vũ khí) trong 05-ai.js
const ROSTER = [
  // ===== 1. ĐẾ QUỐC AUTHERIA =====
  { id: 'valerius', name: 'Valerius', weapon: 'kiem_khien', color: '#5aa9ff', group: 'Đế Quốc Autheria', role: 'Đỡ Đòn', style: 'Counter Tanker',
    bio: 'Đi bộ áp sát; giơ khiên ngay khi thấy đối thủ vung chiêu mạnh để câm lặng chúng; bồi combo A/B đẩy văng.' },
  { id: 'theron', name: 'Theron', weapon: 'thuong', color: '#e0c070', group: 'Đế Quốc Autheria', role: 'Đấu Sĩ', style: 'Vanguard / Wall-Pin',
    bio: 'Canh góc thẳng để Xung Phong ghim đối thủ vào tường/cột; nhảy chống thương né đòn diện rộng rồi dậm đất; quét chân ngắt chiêu đối thủ.' },
  { id: 'florian', name: 'Florian', weapon: 'rapier', color: '#e0e0ff', group: 'Đế Quốc Autheria', role: 'Sát Thủ / Đấu Sư', style: 'Fencer / Bait & Punish',
    bio: 'Lướt né liên tục, giữ khoảng cách nhử đối thủ ra đòn để Phản Đòn, vòng quanh phá ấn (chỉ cần 3/4). Phá ấn hoặc đánh văng thành công thì cười khẩy rồi đánh tiếp ngay. Tuyệt đối không đánh lén sau lưng.' },
  { id: 'ignatius', name: 'Ignatius', weapon: 'truong', color: '#ff7a3a', group: 'Đế Quốc Autheria', role: 'Pháp Sư', style: 'Artillery / Burst Mage',
    bio: 'Giữ cự ly trung bình; rải vòng lửa khống chế đường đi; tích Đại Hỏa Cầu; chỉ gọi Thiên Thạch khi ép được đối thủ vào góc sàn đấu.' },
  // ===== 2. HIỆP HỘI LỮ KHÁCH (Gideon: cựu Đế Quốc) =====
  { id: 'gideon', name: 'Gideon', weapon: 'kiem_dai', color: '#ffd24a', group: 'Hiệp Hội Lữ Khách', role: 'Đỡ Đòn / Tiên Phong', style: 'Heavy Spacing / Punisher',
    bio: 'Di chuyển vi mô giữ đối thủ luôn ở 20% mũi kiếm (Điểm Ngọt); gồng Thế Thủ chặn đòn rồi Bổ Dọc trừng phạt; dùng Cán Kiếm khi bị áp sát quá gần.' },
  { id: 'aria', name: 'Aria & Oktava', weapon: 'voice', color: '#7ae0a0', group: 'Hiệp Hội Lữ Khách', role: 'Hộ Vệ', style: 'Puppeteer / Composer',
    bio: 'Né đòn là ưu tiên số 1. Lặp chuỗi 3 nốt để tạo Hòa Âm (AAA để choáng, CCC khi điểm văng cao), cưỡi Oktava khi bị áp sát. Trên 80% điểm văng sẽ chạy về phía Oktava tìm bảo bọc.' },
  { id: 'koda', name: 'Koda', weapon: 'vuot', color: '#c0563a', group: 'Hiệp Hội Lữ Khách', role: 'Sát Thủ', style: 'Feral Diver / Bleed Stacker',
    bio: 'Thú cưng của Aria. Bám tường rình rập, vồ áp sát, cào đủ 5 tầng Chảy Máu rồi Xé Toạc. Không bao giờ tấn công Aria. Gặp kẻ từng hạ Aria (hoặc bị dồn quá 120%) sẽ HÓA ĐIÊN truy sát — lúc đó HLV không ra lệnh được nữa.' },
  { id: 'death', name: 'Death', weapon: 'liem', color: '#8a7aa8', group: 'Hiệp Hội Lữ Khách', role: 'Sát Thủ', style: 'Zone Controller / Reaper',
    bio: 'Dùng rìa lưỡi liềm kéo vòng cung đưa đối thủ về góc chết; thả liềm xoay tạo vùng cấm địa. Kẻ nào vượt 100% điểm văng sẽ bị áp sát và nhận ngay Phán Quyết.' },
  { id: 'elara', name: 'Elara', weapon: 'cung', color: '#7ad67a', group: 'Hiệp Hội Lữ Khách', role: 'Xạ Thủ', style: 'Extreme Kiter',
    bio: 'Mẹ của Aria. Luôn giữ tầm xa tối đa, lùi lại xả sao băng làm chậm khi bị áp sát, kéo cung tụ lực từ xa. Không bao giờ nhắm vào Aria và Koda; gặp Borg thì khóa chặt dồn sát thương.' },
  { id: 'percy', name: 'Percy', weapon: 'no', color: '#4ae0d0', group: 'Hiệp Hội Lữ Khách', role: 'Xạ Thủ', style: 'Trapper / Area Denial',
    bio: 'Tránh giao tranh trực diện: cắm trận địa nỏ ở góc hiểm, lướt đổi góc, móc kéo địch vào tầm bắn. Gặp Elara thì giảm 70% tấn công, ưu tiên bỏ chạy và không bao giờ móc kéo bà.' },
  // ===== 3. CỐNG NGẦM DOWN =====
  { id: 'borg', name: 'Borg', weapon: 'nam_tay', color: '#ff7a4a', group: 'Cống Ngầm Down', role: 'Đấu Sĩ', style: 'Berserker Grappler',
    bio: 'Điểm văng càng cao càng đánh hung hãn; chủ động Gồng hút sát thương để x2 lực Trả Đòn; mở Nộ nhốt đối thủ trong đấu trường. Gặp Aria có 30% bị khựng; gặp Elara thì ưu tiên gồng thủ.' },
  { id: 'roxie', name: 'Roxie & T-Zero', weapon: 'hand', color: '#ffb030', group: 'Cống Ngầm Down', role: 'Đấu Sĩ', style: 'Resource Hoarder / Mecha',
    bio: 'Giai đoạn 1: ưu tiên nhặt bánh răng hơn tấn công, dựng ụ pháo chặn đường, dùng "Bất Ngờ Chưa" phản đòn khi bị khống chế. Giai đoạn 2: đủ 9 bánh răng thì gọi T-Zero càn quét (Kéo → Lửa → Sấy) và tự hủy khi cỗ máy sắp văng.' },
  { id: 'alice', name: 'Alice', weapon: 'ao_thuat', color: '#d070ff', group: 'Cống Ngầm Down', role: 'Biến Ảo / Trickster', style: 'Kẻ Thao Túng Sàn Đấu / Phân Thân & Đánh Lừa',
    bio: 'Giữ khoảng cách tầm trung, luôn duy trì ít nhất 1 ảo ảnh trên sân, đủ 50 Náo Nhiệt thì đổi chỗ với nạn nhân và vây 5 ảo ảnh. Chỉ lướt đâm khi đối thủ đang quay lưng đánh ảo ảnh. Bị dồn góc thì đổi chỗ với ảo ảnh an toàn nhất. Đối thủ bản năng thấp (Borg, Koda, Clint) gần như luôn bị lừa; kẻ lão luyện (Gideon, Valerius, Ryoma) nhận ra sau 1–1.5s; dân công nghệ (Zero, Raven, Elara) hiếm khi mắc bẫy.' },
  // ===== 4. VƯƠNG QUỐC PHÍA ĐÔNG =====
  { id: 'ryoma', name: 'Ryoma', weapon: 'katana', color: '#ff5a7a', group: 'Vương Quốc Phía Đông', role: 'Kiếm Sĩ', style: 'Flow Combo Rusher',
    bio: 'Tấn công liên tục theo cặp lệnh (AA, AB, AC, BB, BC) để duy trì hồi chiêu A; tung Kiếm Khí phá đạn; mở Nộ ngay khi đủ 5 combo.' },
  { id: 'wukong', name: 'Wukong', weapon: 'con', color: '#e0a030', group: 'Vương Quốc Phía Đông', role: 'Đấu Sĩ', style: 'Đấu Sĩ Động Năng Tầm Trung / Càn Quét & Khống Chế',
    bio: 'Tư duy cao, nhận ra phân thân của Alice 70%. Giữ tầm trung 2.5–3.5m, chuỗi chuẩn: A hút (Khí Ấn 1) → B đâm xuyên (Khí Ấn 2) → D Định Thân khóa cứng 2s → C cắm côn gồng tối đa 3s đập bẹp mục tiêu đang hóa đá. Sắp chạm mốc Côn Thức thì xả A, B trước để tận dụng hồi chiêu tức thì. Gặp kiếm sĩ phản đòn (Kazuki, Ryoma) đang thủ thế thì không đâm B thẳng mặt mà nhảy C đánh úp từ trên xuống; gặp Borg thì giữ cự ly tối đa, bị áp sát là đứng lên ngọn côn thả diều.' },
  { id: 'kazuki', name: 'Kazuki', weapon: 'song_kiem', color: '#9ad0ff', group: 'Vương Quốc Phía Đông', role: 'Kiếm Sĩ', style: 'Bậc Thầy Phản Đòn & Chuỗi Kiếm Thế',
    bio: 'Sư huynh đồng môn của Ryoma. Tư duy cực cao: chỉ cần 0.5s để bỏ qua ảo ảnh của Alice (nhận ra 90%). Đọc khung ra đòn, chỉ phản đòn D khi đối thủ tung đòn nặng — không bao giờ spam. Đối thủ ở xa / xạ thủ: chuỗi BB → C lướt tiếp cận khóa 2s; đối thủ trên 80%: AB → C hoặc BB → C ép ra mép. Điểm văng trên 70% thì xài 5 Kiếm Ý tung Loạn Vũ giải vây; còn an toàn thì nhịn đủ 10 Kiếm Ý để kết liễu bằng Nộ. Gặp Ryoma: thuộc lòng cây combo của sư đệ, canh đúng đòn thứ 2 để phản đòn hoàn hảo.' },
  // ===== 5. THÀNH PHỐ UP =====
  { id: 'zero', name: 'Zero', weapon: 'sung', color: '#9aa0a8', group: 'Thành Phố Up', role: 'Xạ Thủ', style: 'Tactical Burst Assassin',
    bio: 'Đánh dấu mục tiêu → xả sạch băng đạn → nhảy lùi (Thiết Thân + hồi đạn). Đã khóa mục tiêu thì dồn 100% hỏa lực đến khi hết đạn.' },
  { id: 'songluc', name: 'Chrono & Neo', weapon: 'song_luc', color: '#6ac0ff', group: 'Thành Phố Up', role: 'Đặc Thù / Đổi Dạng', style: 'Cựu Binh Chấp Niệm / Kẻ Thao Túng Thời Không',
    bio: 'CHRONO (Quá khứ) — cựu binh nặng nề, lầm lì, mang nhiều tổn thương: mỗi viên đạn đều mang sức nặng của sự trả giá (bắn đau, nạp 6s), bùng nổ Liên Xạ 5s không thể cản phá để san bằng tất cả rồi mới từ từ hồi sức. NEO (Tương lai) — tinh nghịch, lanh lợi, cao ngạo: đạn nhanh nạp 3s nhưng yếu, coi chiến trường như bàn cờ, lướt đi để lại ảo ảnh rồi tua ngược về chỗ cũ, lừa đối thủ xả chiêu vào hư không. Áp sát thì đổi sang Chrono, xa thì Neo.' },
  { id: 'victoria', name: 'Victoria', weapon: 'co_lenh', color: '#e04a4a', group: 'Thành Phố Up', role: 'Chỉ Huy / Triệu Hồi', style: 'Nữ Đại Thống Soái — Quân Lệnh & Đội Hình 3 Tinh Nhuệ',    bio: 'Bộ Tư Lệnh Tối Cao. Luôn xuất trận cùng 3 Lính Tinh Nhuệ bám sát và đánh cùng mục tiêu. Sát mép / bị dồn: đổi sang Lục lướt vào giữa lấy giáp, để lính kiếm chặn đường. Mục tiêu đứng 2–3.5m: đổi sang Cờ — cắm cờ đẩy địch ra đúng rìa + choáng rồi quét Donut xé sàn. Mục tiêu xa và còn ≥2 lính: đổi sang AR xả Bão Lửa toàn quân. Chết ≥2 lính hoặc đối thủ trên 80%: Mệnh Lệnh Tuyệt Đối. Cầm Cờ Lệnh nhìn thấu phân thân Alice trong 0.2s. Gặp Borg: không bao giờ lướt lại gần, luôn giữ AR thả diều.' },
  // ===== 6. THỊ TRẤN PHÍA NAM =====
  { id: 'clint', name: 'Clint', weapon: 'sung_san', color: '#d0a060', group: 'Thị Trấn Phía Nam', role: 'Xạ Thủ', style: 'Melee Shotgun / Rhythm',
    bio: 'Áp sát cực gần: Bắn → Đập báng súng (hồi đạn) → Bắn → Bắn Nhảy né góc. Lặp lại tuần hoàn.' },
  { id: 'jack', name: 'Jack "Sáu Lỗ"', weapon: 'luc_xoay', color: '#c0a080', group: 'Thị Trấn Phía Nam', role: 'Đặc Thù / May Rủi', style: 'Con Bạc Khát Máu',
    bio: 'Bất cần đời, điên rồ, lãng tử và nghiện cảm giác lằn ranh sinh tử — không tin vào kỹ năng, chỉ tin vào Thần May Mắn. Mỗi lần nạp ổ là một lần gieo xúc xắc, sẵn sàng tự nhận điểm văng để đổi lấy lợi thế. Bất cứ khi nào Cò Quay Nga hồi xong: LẬP TỨC tháo đạn chơi liều, bất chấp điểm văng hay vị trí — thích nhìn sự tuyệt vọng của đối thủ khi viên đạn tử thần nổ ra. Nộ "Nhà Cái Trả Thưởng" là phần thưởng vĩnh viễn cho kẻ liều mạng sống sót.' },
  { id: 'joker', name: 'Joker', weapon: 'bai', color: '#ffd24a', group: 'Thị Trấn Phía Nam', role: 'Biến Ảo / May Rủi & Đạo Tặc', style: 'Nữ Quái Bạc Bịp — Thao Túng May Rủi & Trộm Trang Bị',    bio: 'Kẻ Vô Danh, kẻ thù truyền kiếp của Jack Sáu Lỗ. Rút bài liên tục; rút hụt thì lướt C tráo bài; cầm Bích và đối thủ sát mép thì ném thẳng ra vực; cầm Joker thì chờ đối thủ sát mép rồi đổi chỗ. Hễ ai kích hoạt trang bị hay phép, ô D lập tức mượn bản sao và hồi về 0s. Điểm văng >85% mà đối thủ <40%: tung Nộ cầu may Tráo Đổi Sinh Mệnh. Gặp tướng nam cục súc thì múa may ở cự ly gần vì né được gần 50%; gặp tướng nữ thì thả diều tầm cực xa. Mê phép bổ trợ — HLV càng hay dùng phép, cô càng tin HLV.' },
  // ===== 7. HỘI SÁT THỦ UKI (Vesper: đào tẩu • Raven: UKI / phe Up) =====
  { id: 'vesper', name: 'Vesper', weapon: 'dao', color: '#b07aff', group: 'Hội Sát Thủ UKI', role: 'Sát Thủ', style: 'Stealth Backstabber',
    bio: 'Luôn đi vòng ra sau lưng đối thủ; bật Ẩn Thân để tránh bị ngắm; ném dao câm lặng rồi bay vào dồn sát thương sau lưng. Bị nhìn thẳng mặt thì rút lui, không solo trực diện.' },
  { id: 'raven', name: 'Raven', weapon: 'ban_tia', color: '#6a7a9a', group: 'Hội Sát Thủ UKI', role: 'Xạ Thủ', style: 'Sạ Thủ Bắn Tỉa / Thợ Săn Bóng Đêm',
    bio: 'Bí danh Shadow. Luôn tìm góc xa nhất sàn đấu so với kẻ địch; bị áp sát dưới 2.5m là lập tức ném khói tàng hình và lăn lùi. Hễ quạ Oca sẵn sàng là thả ngay vào giao tranh — khi Oca đã đánh dấu mục tiêu thì CHẾ ĐỘ THỢ SĂN: ngừng hẳn súng trường, dồn 100% vào phát bắn tỉa xuyên tường cho tới khi mục tiêu rơi đài.' },
  { id: 'thanhphong', name: 'Diệp Thanh Phong', weapon: 'thiet_phien', color: '#7ad0b0', group: 'Hội Sát Thủ UKI', role: 'Sát Thủ Biến Ảo / Khống Chế', style: 'Lời Ru Tử Thần — Thao Túng Hướng Gió & Dịch Chuyển',    bio: 'Sát thủ chấp pháp kỳ cựu của UKI, tư duy rất cao — cảm nhận luồng khí nên nhận ra phân thân Alice chỉ trong 0.4s. Sát mép hoặc trên 80%: kéo gió về Thuận Phong, bật khiên gió và dịch chuyển vào trong. Mục tiêu trên 70% trong 4m: đẩy gió lên Nghịch Phong rồi phóng lưỡi gió, tốc biến ra sau lưng đâm quạt sắt văng thẳng khỏi sàn. Nộ ru ngủ cả sàn rồi đánh thức bằng đòn x2 lực văng. Gặp Vesper ẩn thân áp sát: bung gió 360° đẩy văng.' },  { id: 'galo', name: 'Galo', weapon: 'binh_doc', color: '#7ae04a', group: 'Hội Sát Thủ UKI', role: 'Đấu Sĩ Đổi Dạng', style: 'Dị Nhân Nghiện Độc — Gieo Rắc Độc Tố & Cuồng Chiến',    bio: 'Vũ khí sinh học thử nghiệm bị UKI ruồng bỏ. Dạng Người cực khôn: thả diều 4–6m, ném lọ độc và bom khí ngạt tích đủ 6 tầng Tiêu Xương; bị áp sát dưới 2m thì nhảy lùi thả khói. Đủ 6 tầng: "Quá Liều!" hóa Quái Thú — Tư duy rơi xuống 20, bất chấp mép vực lao vào cắn xé tống nạn nhân nhẹ bẫng ra khỏi sàn (có 30% lao quá đà rơi theo). Rất phấn khích khi gặp Alice và Vesper. Dạng Người tuyệt đối không lại gần Borg.' },
];
const ROSTER_BY_ID = Object.fromEntries(ROSTER.map((c) => [c.id, c]));
// Chiến thuật dùng chung cho mọi nhân vật
function tacticPool() { return GENERAL_TACTICS; }
const CHAR_BY_WEAPON = Object.fromEntries(ROSTER.map((c) => [c.weapon, c]));

// Gia đình không đánh nhau: Elara (Cung), Aria (The Voice), Koda (Găng Vuốt) gặp nhau → trận HÒA
const FAMILY_WEAPONS = ['cung', 'voice', 'vuot'];
function isFamilyPair(wa, wb) { return wa !== wb && FAMILY_WEAPONS.includes(wa) && FAMILY_WEAPONS.includes(wb); }
// Ngoại lệ cốt truyện: The Voice không thể bị Cung và Găng Vuốt tấn công
function storyProtected(att, t) {
  const a = att && (att.owner || att);
  if (!a || !t) return false;
  const tw = (t.owner || t).weaponId, aw = a.weaponId;
  if (tw === 'voice' && (aw === 'cung' || aw === 'vuot')) return true;
  if (aw === 'vuot' && tw === 'voice') return true;
  if (aw === 'cung' && tw === 'vuot') return true;
  return false;
}
