'use strict';
// ===== TÍNH CÁCH TƯỚNG (cố định theo từng tướng) =====
// Tính cách là BỘ TRỌNG SỐ cho AI sinh tồn: nhân vào điểm từng hành động lớn (farm, săn, tranh boss, tranh thính,
// chạy bo, núp, hồi máu, kền kền, đi shop, rút lui) + độ hổ báo trong giao tranh. Người xem thấy nhãn tính cách.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  // GĐ7: 26 tính cách (6 cũ + 20 mới), mỗi tướng một tính cách cố định.
  //   w: trọng số hành động lớn • aggr: độ hổ báo • stats: cộng/trừ chỉ số bản lĩnh (nền 13) • bag: muốn mang gì trong balo
  //   Hành vi riêng (mục tiêu, hành động mới, vi mô) ở src/sim/ai/persona.js
  const P = {
    hobao:    { name: 'Hổ Báo', icon: '🔥', style: 'aggro', aggr: 1.25, desc: 'Thích lao vào đánh, ít chịu rút, hay đi săn.',
      w: { hunt: 1.35, vulture: 0.85, farm: 0.9, hide: 0.6, heal: 0.85, retreat: 0.8, boss: 1.1, drop: 1.1, duel: 1.5, loot: 1.1 }, stats: { fight: 2, disc: -2 } },
    li:       { name: 'Lì Lợm', icon: '🪨', style: 'safe', aggr: 0.85, desc: 'Giữ mình, chịu đòn, cuối trận núp kỹ, ít đi săn.',
      w: { hunt: 0.75, hide: 1.4, heal: 1.2, zone: 1.15, retreat: 1.15, vulture: 0.9, boss: 0.85, drop: 0.85, duel: 0.6, loot: 0.85 }, stats: { mental: 3, stam: 2, fight: -1 } },
    thamfarm: { name: 'Tham Farm', icon: '🌾', style: 'balanced', aggr: 0.95, desc: 'Ăn quái, tranh boss, mua đồ; tránh đánh sớm.',
      w: { farm: 1.4, boss: 1.2, shop: 1.15, hunt: 0.8, vulture: 0.9, hide: 0.9, duel: 0.9, loot: 1.2, chest: 1.2 }, stats: { farm: 4, fight: -1 } },
    amsat:    { name: 'Ám Sát', icon: '🗡', style: 'balanced', aggr: 1.1, desc: 'Săn kẻ đứng lẻ, máu thấp; phục kích trong bụi.',
      w: { hunt: 1.25, hide: 1.2, vulture: 1.1, farm: 0.9, boss: 0.85, duel: 1.1, loot: 1.1 }, stats: { meca: 2, refl: 2, mental: -1 } },
    kenken:   { name: 'Kền Kền', icon: '🦅', style: 'balanced', aggr: 1.0, desc: 'Chờ hai người đánh nhau tới kiệt sức rồi vào dọn.',
      w: { vulture: 1.7, hunt: 0.85, hide: 1.1, duel: 0.7, loot: 1.5 }, stats: { map: 3, fight: -1 } },
    conbac:   { name: 'Con Bạc', icon: '🎲', style: 'aggro', aggr: 1.15, desc: 'Ham thính và boss, dám liều.',
      w: { drop: 1.45, boss: 1.3, hunt: 1.05, retreat: 0.85, hide: 0.8, duel: 1.35, loot: 1.3, chest: 1.2 }, stats: { mental: 2, disc: -2 } },
    // ---- 20 tính cách mới ----
    hoabinh:  { name: 'Hòa Bình', icon: '🕊', style: 'safe', aggr: 0.6, desc: 'Không bao giờ ra tay trước; nhặt đồ hồi máu, tránh xa tiếng giao tranh; chỉ đánh trả khi máu bị đe dọa hoặc hộ vệ đã lao vào.',
      w: { hunt: 0.05, vulture: 0.1, duel: 0.1, heal: 1.5, hide: 1.3, chest: 1.4, loot: 0.4, boss: 0.3, drop: 0.5, farm: 1.1, retreat: 1.3 }, stats: { mental: 4, map: 2, fight: -3 }, bag: { hp: 6, heal: 2, barrier: 1, fu_an: 1, ghost: 1 } },
    vosi:     { name: 'Võ Sĩ Danh Dự', icon: '⚔', style: 'aggro', aggr: 1.1, desc: 'Ghét ăn hôi; chờ kẻ thắng giao tranh hồi sức rồi mới thách đấu tay đôi; mê cổng quyết đấu.',
      w: { vulture: 0, duel: 2.0, hunt: 0.9, loot: 0.6, hide: 0.5 }, stats: { fight: 3, disc: 3, mental: 1, map: -1 } },
    thucdung: { name: 'Thực Dụng', icon: '💰', style: 'balanced', aggr: 0.85, hoard: true, desc: 'Né đánh đầu trận, gom vàng, đúc vũ khí lên Vàng/Đỏ ở Thương Nhân; đủ đồ mới đi săn.',
      w: { farm: 1.5, shop: 1.4, chest: 1.4, hunt: 0.6, duel: 0.4, boss: 1.1, vulture: 0.8 }, stats: { farm: 4, disc: 2, fight: -1 }, bag: { hp: 5, flash: 1, barrier: 1 } },
    quayphan: { name: 'Quấy Nhiễu', icon: '🃏', style: 'aggro', aggr: 1.05, desc: 'Cướp đồ ngay trước mặt người khác, đặt bẫy trêu ngươi, cấu một phát rồi dây móc chuồn.',
      w: { loot: 1.8, drop: 1.4, chest: 1.5, vulture: 1.2, hunt: 0.9 }, stats: { refl: 3, meca: 1, disc: -3 }, bag: { trap: 3, hook: 2, flash: 1, hp: 4 } },
    cuongtin: { name: 'Cuồng Tín', icon: '📿', style: 'aggro', aggr: 1.2, desc: 'Truy sát "dị giáo" (Death) tới cùng trời cuối đất, kể cả ngoài bo.',
      w: { hunt: 1.2, zone: 0.8, hide: 0.5 }, stats: { mental: 3, fight: 1, disc: -2 }, bag: { fu_doc: 2, ghost: 1, hp: 5 }, heretic: ['death'] },
    chuotlui: { name: 'Chuột Lũi', icon: '🐀', style: 'safe', aggr: 0.55, desc: 'Sống sót là trên hết: lủi trong bụi, tránh mọi giao tranh, chỉ cắn khi bị dồn vào góc.',
      w: { hide: 2.0, heal: 1.4, retreat: 1.5, zone: 1.3, hunt: 0.15, vulture: 0.3, duel: 0.1, boss: 0.3, drop: 0.3, loot: 0.6 }, stats: { map: 4, refl: 2, fight: -3 }, bag: { hp: 6, fu_an: 1, ghost: 2, flash: 1 } },
    batnat:   { name: 'Kẻ Bắt Nạt', icon: '😈', style: 'aggro', aggr: 1.15, desc: 'Đuổi đánh kẻ có vũ khí kém hơn hoặc dưới 50% máu; gặp vũ khí Vàng/Đỏ hay kẻ mạnh hơn thì giữ khoảng cách.',
      w: { hunt: 1.4, vulture: 1.1, duel: 0.5 }, stats: { fight: 2, mental: -3 }, bag: { ignite: 1, exhaust: 1, ghost: 1 } },
    gaccong:  { name: 'Gác Cổng', icon: '🚧', style: 'balanced', aggr: 1.05, desc: 'Vào bo sớm 30 giây, giữ lối vào; phục kích kẻ chạy bo và dùng khống chế giữ chúng ngoài bão.',
      w: { zone: 1.3, hunt: 0.8, farm: 0.9 }, stats: { map: 3, disc: 2 }, bag: { trap: 2, exhaust: 1, hp: 5 } },
    khatnuoc: { name: 'Con Bạc Khát Nước', icon: '🎰', style: 'aggro', aggr: 1.2, desc: 'Bỏ bãi quái nhỏ; lao vào cướp thính và boss dù có 3–4 kẻ quanh đó; càng ít máu càng liều.',
      w: { drop: 2.0, boss: 1.9, duel: 1.4, chest: 1.2, hide: 0.5, retreat: 0.7 }, stats: { mental: 1, disc: -3, fight: 1 }, bag: { smite: 2, flash: 1, barrier: 1 } },
    lanhchua: { name: 'Lãnh Chúa Cứ Điểm', icon: '🏰', style: 'safe', aggr: 1.0, desc: 'Chiếm công trình vững gần tâm bo, đặt bẫy ở lối vào, không rời đi tới khi bo ép; ai bước vào 15 đv là dồn hỏa lực.',
      w: { hunt: 0.4, vulture: 0.4, roam: 0.6, duel: 0.3 }, stats: { disc: 3, stam: 2, refl: -1 }, bag: { trap: 3, barrier: 1, heal: 1, hp: 5 } },
    vesi:     { name: 'Vệ Sĩ Thầm Lặng', icon: '🛡', style: 'balanced', aggr: 1.05, desc: 'Âm thầm bảo vệ một người (tạm: kẻ yếu nhất — chờ cốt truyện); đi theo cách 15–25 đv, ai đánh người đó là can thiệp ngay; không bao giờ đánh người mình bảo vệ.',
      w: { hunt: 0.5, vulture: 0.3, duel: 0.4 }, stats: { disc: 3, map: 2, mental: 1 }, bag: { barrier: 1, exhaust: 1, flash: 1 } },
    doimang:  { name: 'Kẻ Đổi Mạng', icon: '💣', style: 'safe', aggr: 0.9, desc: 'Bình thường thận trọng; dưới 15% máu mà bị dồn thì tung hết (chiêu cuối, bom, khống chế) và kéo kẻ gần nhất xuống bão / ra khỏi vách.',
      w: { hide: 1.2, hunt: 0.8 }, stats: { mental: 2, fight: 1 }, bag: { bomb: 2, hp: 5 } },
    bacle:    { name: 'Thợ Săn Bắt Lẻ', icon: '🐺', style: 'balanced', aggr: 1.05, desc: 'Không bao giờ chen vào trận có 3 người trở lên; đi dọc rìa vắng, ép 1v1 kẻ đi lẻ.',
      w: { vulture: 0, hunt: 1.3, roam: 1.3 }, stats: { map: 2, fight: 2, mental: -1 }, bag: { ignite: 1, flash: 1 } },
    thoatxac: { name: 'Thoát Xác', icon: '👻', style: 'balanced', aggr: 1.0, desc: 'Dưới 75% máu là rút; đánh rồi chạy — lùi ~20 đv hồi sức rồi quay lại cấu tiếp.',
      w: { heal: 1.4, retreat: 1.3, hunt: 1.0 }, stats: { refl: 3, meca: 1, stam: -2 }, bag: { hp: 7, ghost: 1, flash: 1 } },
    tientri:  { name: 'Tiên Tri Địa Hình', icon: '⛰', style: 'balanced', aggr: 1.0, desc: 'Ngại đánh trên đất bằng; chiếm chỗ cao bằng dây móc và đứng đó mà bắn; bị kéo xuống thì leo lại.',
      w: { hunt: 0.6, vulture: 0.8 }, stats: { map: 3, meca: 1 }, bag: { hook: 2, hp: 5 } },
    tramtuong:{ name: 'Kẻ Trảm Tướng', icon: '🎯', style: 'aggro', aggr: 1.15, desc: 'Săn kẻ dẫn đầu số mạng, kẻ cầm vũ khí Đỏ hay kẻ đang có bùa boss; bỏ qua kẻ yếu.',
      w: { hunt: 1.4, vulture: 0.5, farm: 0.9 }, stats: { fight: 2, map: 2, mental: -1 }, bag: { flash: 1, ignite: 1, ghost: 1 } },
    honloan:  { name: 'Gieo Rắc Hỗn Loạn', icon: '🔥', style: 'aggro', aggr: 1.1, desc: 'Kích nổ thùng thuốc nổ và bẫy môi trường khi có người đứng gần; ném bom vào giữa đám đông.',
      w: { vulture: 1.3, hunt: 0.9 }, stats: { meca: 2, disc: -3 }, bag: { bomb: 2, trap: 1 } },
    moicau:   { name: 'Thợ Săn Mồi Câu', icon: '🎣', style: 'balanced', aggr: 1.0, desc: 'Lấy rương đồ làm mồi, đặt bẫy quanh rồi núp cách 20–30 đv; kẻ nào đứng mở rương là lao vào dồn sát thương.',
      w: { chest: 0.4, hunt: 0.8, hide: 1.1 }, stats: { map: 3, disc: 2 }, bag: { trap: 3, hook: 1, hp: 4 } },
    riabao:   { name: 'Bóng Ma Rìa Bão', icon: '🌪', style: 'balanced', aggr: 1.05, desc: 'Tích bình và phù kháng độc; đi sát mép bão sau lưng mọi người; đâm kẻ vừa vào được vùng an toàn và đang uống bình.',
      w: { zone: 0.6, hide: 0.7 }, stats: { stam: 3, map: 2 }, bag: { hp: 7, fu_doc: 2 } },
    nguyquan: { name: 'Ngụy Quân Tử', icon: '🎭', style: 'balanced', aggr: 1.0, desc: 'Đầu–giữa trận đề nghị đình chiến, cùng đánh quái và kẻ thứ ba; khi đồng minh dưới 30% máu hoặc cúi xuống mở rương thì đâm sau lưng.',
      w: { vulture: 1.2, hunt: 0.9 }, stats: { mental: 2, map: 2, fight: 1 }, bag: { ignite: 1, exhaust: 1 } },
    // ---- GĐ9 ----
    cauton:   { name: 'Cầu Toàn', icon: '📐', style: 'balanced', aggr: 0.95, strict: true, desc: 'Phải lên đúng bộ sở trường: luôn theo lối build số 1, không đổi món theo đối thủ; chỉ gắn mảnh hồn yêu thích / hợp build, săn và đổi chác cho bằng đủ bộ; chưa đủ bộ thì ngại đánh lớn.',
      w: { farm: 1.25, shop: 1.3, chest: 1.2, loot: 1.4, hunt: 0.85, duel: 0.8, vulture: 0.9 }, stats: { disc: 3, farm: 2, refl: -1 } },
    thuongnhan: { name: 'Thương Nhân', icon: '⚖', style: 'balanced', aggr: 0.85, trader: 'honest', desc: 'Buôn bán với bất kỳ ai không đang đánh nhau: gạ đình chiến ngắn để mua mảnh hồn người ta không cần (giá 60%), bán lại cho người cần (giá 130%), bán cả vật phẩm; giữ kho hàng 4 mảnh; giữ chữ tín, không bao giờ bịp; ngại đánh nhau.',
      w: { farm: 1.2, shop: 1.4, chest: 1.3, loot: 1.5, hunt: 0.7, duel: 0.6, vulture: 0.8 }, stats: { mental: 2, map: 2, farm: 1, fight: -2 }, bag: { hp: 5, trap: 1, hook: 1, flash: 1, ghost: 1 } },
    bipbom:   { name: 'Kẻ Bịp Bợm', icon: '🎭', style: 'balanced', aggr: 1.0, trader: 'cheat', desc: 'Gạ đổi chác / liên minh với bất kỳ ai để lừa: bán mảnh dỏm giá cao, đổi gian, báo tin giả dụ người ta vào bẫy của mình; liên minh tạm thì gần như chắc chắn bịp; ai từng bị lừa thì không tin nữa.',
      w: { loot: 1.4, chest: 1.2, vulture: 1.2, hunt: 0.9, duel: 0.7 }, stats: { mental: 3, refl: 2, disc: -2 }, bag: { trap: 3, ghost: 1, flash: 1, hp: 4 } },
    binhthuong: { name: 'Bình Thường', icon: '🙂', style: 'balanced', aggr: 1.0, desc: 'Không có gì đặc biệt: mọi hành động cân bằng, không thiên lệch, không luật riêng.', w: {}, stats: {} },
  };
  // mỗi tướng một tính cách cố định (GĐ9: Zero → Cầu Toàn, Roxie → Thương Nhân, Joker → Kẻ Bịp Bợm; Thực Dụng và Con Bạc Khát Nước
  // để dành cho tướng mới GĐ10; tướng chưa khai báo → Bình Thường)
  const BY_HERO = {
    borg: 'hobao', elara: 'li', chrononeo: 'thamfarm', zero: 'cauton', death: 'amsat', victoria: 'kenken', jack: 'conbac',
    aria: 'hoabinh', valerius: 'vosi', roxie: 'thuongnhan', wukong: 'quayphan', thanhphong: 'cuongtin', lyra: 'chuotlui',
    koda: 'batnat', clint: 'gaccong', joker: 'bipbom', gideon: 'lanhchua', theron: 'vesi', kazuki: 'doimang',
    percy: 'bacle', vesper: 'thoatxac', raven: 'tientri', ryoma: 'tramtuong', ignatius: 'honloan', alice: 'moicau',
    galo: 'riabao', florian: 'nguyquan',
  };
  // GĐ6b — phong cách giao tranh (cố định theo tướng):
  //   allin: đã đánh là không chạy (đánh tới cùng) • fight: đánh tới khi còn ~10% máu mà không thắng nổi mới chạy
  //   kite: tầm xa thả diều — giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát
  //   stand: tầm xa nhưng đứng bắn, ít di chuyển
  const STYLE = {
    allin: { name: 'Lì đòn', icon: '🛡', desc: 'Đã vào trận là đánh tới cùng, không bỏ chạy.' },
    fight: { name: 'Xông xáo', icon: '⚔', desc: 'Đánh tới khi còn khoảng 10% máu mà thấy không thắng nổi mới chạy.' },
    kite: { name: 'Thả diều', icon: '🏹', desc: 'Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.' },
    stand: { name: 'Đứng bắn', icon: '🎯', desc: 'Đánh tầm xa nhưng ít di chuyển, không cố thả diều.' },
  };
  const STYLE_BY_HERO = {
    valerius: 'allin', borg: 'allin', kazuki: 'allin', wukong: 'allin', ryoma: 'allin', theron: 'allin',
    gideon: 'fight', koda: 'fight', vesper: 'fight', death: 'fight', florian: 'fight',
    elara: 'kite', zero: 'kite', percy: 'kite', chrononeo: 'kite', raven: 'kite', jack: 'kite',
    ignatius: 'kite', alice: 'kite', thanhphong: 'kite', roxie: 'kite', joker: 'kite', lyra: 'kite',
    aria: 'stand', victoria: 'stand', galo: 'stand', clint: 'stand',
  };
  G.FIGHT_STYLE = STYLE; G.FIGHT_STYLE_BY_HERO = STYLE_BY_HERO;
  G.fightStyleOf = (heroId) => STYLE_BY_HERO[heroId] || 'fight';
  G.PERSONALITY = P;
  G.HERO_PERSONALITY = BY_HERO;
  G.personalityOf = (heroId) => P[BY_HERO[heroId] || 'binhthuong'];
})();
