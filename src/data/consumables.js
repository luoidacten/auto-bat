'use strict';
// ===== VẬT PHẨM DÙNG 1 LẦN (GĐ7) — nằm trong BALO =====
// Balo cấp 1–5: số ô [3, 4, 5, 6, 8]; mỗi ô chứa 1 loại, xếp chồng tới `stack`. Mua ở Thương Nhân, nhặt trong rương đồ.
// Gồm: bình máu/mana, các phép bổ trợ cũ (giờ là vật phẩm dùng 1 lần), dây móc, bẫy, bom và các loại phù.
// ai: gợi ý cho AI khi nào dùng (xem src/sim/bag.js → tryBag).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  // GĐ8: cấp 6 ("Túi 6") chỉ có từ Quái Thú Hoàng Kim — 10 ô, mang thêm 2 bình mỗi loại
  G.BAG = { slots: [3, 4, 5, 6, 8, 10], upgrade: [0, 250, 500, 900, 1400], start: { hp_m: 2, mp_m: 1, ga_s: 1 }, useGap: 0.8, potBonus6: 2 };
  G.CONSUMABLES = {
    // GĐ7b: bình chia 3 cỡ; uống xong mới hồi (hồi ngay một lần), trúng đòn là hỏng lần uống (không mất bình); mang tối đa 3 bình máu + 3 bình mana
    hp_s:    { name: 'Bình Máu Nhỏ', icon: '🧪', cost: 45, stack: 3, group: 'potion', pot: 'hp', size: 's', desc: 'Uống 1.4s (đi chậm, trúng đòn là hỏng), xong hồi ngay 20% máu tối đa.' },
    hp_m:    { name: 'Bình Máu Vừa', icon: '🧪', cost: 90, stack: 3, group: 'potion', pot: 'hp', size: 'm', desc: 'Uống 1.8s (đi chậm, trúng đòn là hỏng), xong hồi ngay 35% máu tối đa.' },
    hp_l:    { name: 'Bình Máu To', icon: '🧪', cost: 160, stack: 3, group: 'potion', pot: 'hp', size: 'l', desc: 'Uống 2.3s (đi chậm, trúng đòn là hỏng), xong hồi ngay 55% máu tối đa.' },
    mp_s:    { name: 'Bình Mana Nhỏ', icon: '💧', cost: 35, stack: 3, group: 'potion', pot: 'mp', size: 's', desc: 'Uống 1.0s (trúng đòn là hỏng), xong hồi ngay 25% mana.', mana: true },
    mp_m:    { name: 'Bình Mana Vừa', icon: '💧', cost: 70, stack: 3, group: 'potion', pot: 'mp', size: 'm', desc: 'Uống 1.3s (trúng đòn là hỏng), xong hồi ngay 45% mana.', mana: true },
    mp_l:    { name: 'Bình Mana To', icon: '💧', cost: 120, stack: 3, group: 'potion', pot: 'mp', size: 'l', desc: 'Uống 1.7s (trúng đòn là hỏng), xong hồi ngay 70% mana.', mana: true },
    // GĐ8: bình Hộ Vệ — hồi Hộ Giáp (lớp giáp phụ); mang tối đa 3
    ga_s:    { name: 'Bình Hộ Vệ Nhỏ', icon: '🛡', cost: 50, stack: 3, group: 'potion', pot: 'ga', size: 's', desc: 'Uống 1.0s (trúng đòn là hỏng), xong hồi ngay 30% Hộ Giáp tối đa.' },
    ga_m:    { name: 'Bình Hộ Vệ Vừa', icon: '🛡', cost: 100, stack: 3, group: 'potion', pot: 'ga', size: 'm', desc: 'Uống 1.4s (trúng đòn là hỏng), xong hồi ngay 55% Hộ Giáp tối đa.' },
    ga_l:    { name: 'Bình Hộ Vệ To', icon: '🛡', cost: 170, stack: 3, group: 'potion', pot: 'ga', size: 'l', desc: 'Uống 1.8s (trúng đòn là hỏng), xong hồi ngay 100% Hộ Giáp tối đa.' },
    // GĐ8: Bình Thuốc Rực Rỡ (chỉ từ Quái Thú Hoàng Kim) — hồi ngay 100% máu và 100% Hộ Giáp
    radiant: { name: 'Bình Thuốc Rực Rỡ', icon: '🌟', cost: 0, stack: 2, group: 'special', noBuy: true, desc: 'Dùng tức thì: hồi đầy máu và Hộ Giáp.' },
    // phép bổ trợ cũ
    flash:   { name: 'Tốc Biến', icon: '⚡', cost: 180, stack: 1, group: 'spell', desc: 'Dịch chuyển tức thời 4 đv.' },
    ghost:   { name: 'Tốc Hành', icon: '👻', cost: 120, stack: 2, group: 'spell', desc: '+35% tốc chạy trong 6s.' },
    heal:    { name: 'Hồi Máu', icon: '💚', cost: 150, stack: 2, group: 'spell', desc: 'Hồi ngay 15% máu tối đa, +20% tốc chạy 2s.' },
    barrier: { name: 'Lá Chắn', icon: '🛡', cost: 150, stack: 2, group: 'spell', desc: 'Khiên bằng 20% máu tối đa trong 3s.' },
    ignite:  { name: 'Thiêu Đốt', icon: '🔥', cost: 140, stack: 2, group: 'spell', desc: 'Thiêu 1 tướng trong 6 đv: 2% máu tối đa của nó mỗi giây trong 5s, vết thương sâu.' },
    exhaust: { name: 'Kiệt Sức', icon: '🥀', cost: 140, stack: 2, group: 'spell', desc: 'Tướng địch trong 6 đv: chậm 35% và gây ít hơn 35% sát thương trong 2.5s.' },
    cleanse: { name: 'Thanh Tẩy', icon: '✨', cost: 120, stack: 2, group: 'spell', desc: 'Xóa mọi khống chế, kháng hiệu ứng +60% trong 2s (dùng được khi đang bị khống chế).' },
    smite:   { name: 'Trừng Trị', icon: '☄', cost: 100, stack: 2, group: 'spell', desc: 'Sát thương chuẩn 500 + 60×cấp lên quái / boss trong 5 đv (lên tướng: 10% máu tối đa).' },
    tp:      { name: 'Dịch Chuyển', icon: '🌀', cost: 220, stack: 1, group: 'spell', desc: 'Niệm 3s (bị đánh thì hỏng) rồi dịch chuyển tới Thương Nhân gần tâm bo nhất.' },
    // dụng cụ mới
    hook:    { name: 'Dây Móc', icon: '🪝', cost: 160, stack: 2, group: 'tool', desc: 'Phóng dây tới vách đá / chỗ cao trong 9 đv rồi đu tới (vượt tường, lên chỗ cao), không thể bị chọn khi đu.' },
    trap:    { name: 'Bẫy Kẹp', icon: '🪤', cost: 90, stack: 3, group: 'tool', desc: 'Đặt bẫy ẩn (90s): kẻ địch đạp vào bị trói 1.5s, lộ diện 4s, mất 6% máu tối đa.' },
    bomb:    { name: 'Bom Tự Chế', icon: '💣', cost: 160, stack: 2, group: 'tool', desc: 'Ném tới điểm trong 6 đv, nổ sau 0.6s (bán kính 2.5): 10% máu tối đa và đẩy lùi.' },
    // phù mới
    fu_doc:  { name: 'Phù Kháng Độc', icon: '📜', cost: 150, stack: 2, group: 'charm', desc: 'Nhận ít hơn 65% sát thương bo trong 25s.' },
    fu_ho:   { name: 'Phù Hộ Mệnh', icon: '🧿', cost: 200, stack: 1, group: 'charm', desc: 'Dán lên người 60s: đòn chí mạng kế tiếp chỉ để lại 1 máu và cho khiên 15% máu tối đa.' },
    fu_an:   { name: 'Phù Ẩn Thân', icon: '🌫', cost: 160, stack: 1, group: 'charm', desc: 'Tàng hình 4s (đánh / dùng chiêu thì lộ).' },
    fu_tuc:  { name: 'Phù Thần Tốc', icon: '🌪', cost: 110, stack: 2, group: 'charm', desc: '+40% tốc chạy 4s, miễn làm chậm.' },
    // 9 vật phẩm tiêu hao mới (Mục 13e)
    scout_tower:       { name: 'Cột Sóng Trinh Sát', icon: '📡', cost: 130, stack: 2, group: 'tool', desc: 'Cắm cột phát sóng tại chỗ (tồn tại 45s): Quét và làm lộ diện toàn bộ tướng địch trong bán kính 16 đv (kể cả núp bụi), vô hiệu hóa tàng hình trong vùng quét.' },
    emp_grenade:       { name: 'Lựu Đạn Xung Điện', icon: '🧲', cost: 150, stack: 2, group: 'tool', desc: 'Ném tới điểm trong 7 đv, nổ sau 0.5s (bán kính 2.5 đv): Phá hủy ngay 350 Hộ Giáp (+30/cấp) của mọi mục tiêu và cấm dùng Dây Móc trong 2.5s.' },
    mirror_decoy:      { name: 'Gương Ảo Ảnh Bỏ Túi', icon: '🪞', cost: 170, stack: 1, group: 'tool', desc: 'Tạo ngay 1 phân thân chạy thẳng về phía trước trong 4s để đánh lừa đối thủ và quái rừng; bản thân nhận tàng hình 1.5s và tăng 25% tốc chạy.' },
    ice_trap:          { name: 'Bẫy Băng Cổ', icon: '❄', cost: 110, stack: 3, group: 'tool', desc: 'Đặt bẫy ẩn (90s): Kẻ địch giẫm phải bị Đóng Băng (choáng tuyệt đối) 1.2s, sau đó mặt sàn hóa băng trơn trượt làm giảm 40% khả năng kiểm soát hướng chạy trong 3s.' },
    blood_pot:         { name: 'Dược Huyết Chiến', icon: '🩸', cost: 160, stack: 2, group: 'charm', desc: 'Uống tức thì: Nhận 20% Hút Máu và +15% Công Vật Lý / Công Phép trong 8s, nhưng giảm 30% lượng Hộ Giáp hiện có của bản thân.' },
    corrosive_oil:     { name: 'Dầu Đạn Ăn Mòn', icon: '🧪', cost: 140, stack: 2, group: 'charm', desc: 'Thoa lên vũ khí (hiệu lực 12s): 4 đòn đánh hoặc phát bắn kế tiếp nhận thêm 50% Xuyên Thủng Hộ Giáp (sát thương đánh thẳng vào Máu Đỏ).' },
    petrify_talisman:  { name: 'Phù Thạch Hóa', icon: '🪨', cost: 190, stack: 1, group: 'charm', desc: 'Hóa đá cơ thể tại chỗ trong 2.0s: Bất động hoàn toàn, miễn nhiễm 100% mọi loại sát thương và khống chế (không bị bão bo đốt máu trong thời gian này).' },
    smoke_bomb:        { name: 'Bom Khói Dập Lửa', icon: '💨', cost: 120, stack: 2, group: 'tool', desc: 'Ném xuống chân tạo màn khói dày đặc bán kính 4 đv trong 5s: Chặn đứng mọi tầm nhìn từ bên ngoài vào, dập tắt các hiệu ứng Thiêu Đốt và Vết Thương Sâu trên người đứng bên trong.' },
    grapple_dash:      { name: 'Dây Móc Tiếp Tốc', icon: '🪶', cost: 180, stack: 2, group: 'tool', desc: 'Bắn móc kéo thẳng bản thân về phía mục tiêu tướng hoặc quái lớn trong 8.5 đv: Gây choáng 0.5s khi chạm mục tiêu và lập tức hồi 1 phát lướt ngắn 2.5 đv.' },
  };
  G.POT_IDS = { hp: ['hp_s', 'hp_m', 'hp_l'], mp: ['mp_s', 'mp_m', 'mp_l'], ga: ['ga_s', 'ga_m', 'ga_l'] };
  // tỉ lệ ra đồ trong rương (trọng số)
  G.CHEST_LOOT = {
    hp_s: 14, hp_m: 11, hp_l: 5, mp_s: 6, mp_m: 4, mp_l: 2, ga_s: 8, ga_m: 6, ga_l: 3,
    flash: 6, ghost: 8, heal: 8, barrier: 8, ignite: 6, exhaust: 6, cleanse: 5, smite: 4, tp: 3,
    hook: 8, trap: 8, bomb: 6, fu_doc: 7, fu_ho: 3, fu_an: 5, fu_tuc: 7,
    scout_tower: 6, emp_grenade: 6, mirror_decoy: 5, ice_trap: 7, blood_pot: 6, corrosive_oil: 6, petrify_talisman: 4, smoke_bomb: 6, grapple_dash: 6
  };
})();
