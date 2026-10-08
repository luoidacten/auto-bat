'use strict';
// ===== GĐ9: 3 LỐI BUILD ƯA THÍCH + MẢNH HỒN YÊU THÍCH CỦA TỪNG TƯỚNG =====
// Mỗi trận, mỗi tướng chọn 1 trong 3 lối build sở trường (theo hạt giống). Lối build quyết định thứ tự mua đồ (vẫn đổi món
// theo đội hình địch như cũ) và các CHỈ SỐ mảnh hồn tướng ưu tiên gắn / nhặt. Ngoài ra mỗi tướng có vài mảnh hồn yêu thích (mã cụ thể).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  // khuôn build: core = 5 món theo thứ tự mua, boots = giày, st = chỉ số mảnh hồn ưu tiên (khóa của bảng 9 chỉ số + phụ)
  const T = {
    crit:    { name: 'Chí Mạng', boots: 'giay_cuong_chien', core: ['dao_pha_quan', 'cung_gio_loc', 'kiem_bao_tap', 'huyet_kiem', 'mui_khoan'], st: ['crit', 'phys', 'as'] },
    speed:   { name: 'Tốc Đánh', boots: 'giay_cuong_chien', core: ['song_dao', 'cung_than_phong', 'dao_cat_gan', 'cung_gio_loc', 'huyet_kiem'], st: ['as', 'phys', 'ls'] },
    lethal:  { name: 'Xuyên Giáp', boots: 'giay_dinh_gi', core: ['dao_am_anh', 'dao_tu_than', 'mui_khoan', 'kiem_bao_tap', 'khan_thanh_tay'], st: ['phys', 'crit', 'ms'] },
    bruiser: { name: 'Đấu Sĩ', boots: 'giay_thep', core: ['riu_hac_thiet', 'xich_hon', 'huyet_kiem', 'giap_gai', 'tim_cu_thach'], st: ['hp', 'phys', 'ls'] },
    tank:    { name: 'Đỡ Đòn', boots: 'giay_thep', core: ['vuong_mien', 'giap_gai', 'ao_dung_nham', 'tim_cu_thach', 'ao_thanh_linh'], st: ['hp', 'ga', 'ten'] },
    burst:   { name: 'Dồn Phép', boots: 'giay_khai_sang', core: ['mu_hoa_than', 'truong_hu_vo', 'tram_than_ky', 'nhan_hoang_kim', 'dong_ho_cat'], st: ['mag', 'magAmp', 'cdr'] },
    battle:  { name: 'Pháp Sư Trâu', boots: 'giay_thuy_ngan', core: ['mat_na', 'gay_bang_gia', 'qua_cau_linh_hon', 'bua_tro_tan', 'dong_ho_cat'], st: ['mag', 'hp', 'cdr'] },
    cdr:     { name: 'Hồi Chiêu', boots: 'giay_khai_sang', core: ['ngoc_hien_triet', 'tram_than_ky', 'phap_chau', 'mu_hoa_than', 'thuy_tinh'], st: ['cdr', 'mag', 'ms'] },
    enchant: { name: 'Bảo Hộ', start: 'lenh_bai', boots: 'giay_khai_sang', core: ['den_long_tinh', 'lu_huong', 'kinh_cu_dem', 'ngoc_boi', 'khien_lam_than'], st: ['cdr', 'hp', 'mag'] },
    warden:  { name: 'Hộ Vệ', start: 'lenh_bai', boots: 'giay_thep', core: ['khien_lam_than', 'chuong_thuc_tinh', 'vuong_mien', 'giap_ma_quai', 'ao_thanh_linh'], st: ['hp', 'ga', 'ten'] },
    duelist: { name: 'Đơn Đấu', boots: 'giay_cuong_chien', core: ['song_dao', 'huyet_kiem', 'dao_tu_than', 'khan_thanh_tay', 'giap_ma_quai'], st: ['as', 'ls', 'phys'] },
    gun:     { name: 'Xạ Thủ Súng', boots: 'giay_cuong_chien', core: ['cung_than_phong', 'dao_pha_quan', 'song_dao', 'huyet_kiem', 'mui_khoan'], st: ['rl', 'as', 'crit'] },
    assassin:{ name: 'Sát Thủ', boots: 'giay_dinh_gi', core: ['dao_am_anh', 'kiem_bao_tap', 'dao_tu_than', 'mui_khoan', 'khan_thanh_tay'], st: ['phys', 'ms', 'crit'] },
    magebruiser: { name: 'Đấu Sĩ Phép', boots: 'giay_thep', core: ['mat_na', 'gay_bang_gia', 'dong_ho_cat', 'giap_gai', 'tim_cu_thach'], st: ['mag', 'hp', 'ls'] },
  };
  // 3 lối build sở trường + mảnh hồn yêu thích (mã) của từng tướng
  const H = {
    alice:      { b: ['burst', 'cdr', 'battle'], fav: ['P_VIS_02', 'G_VIS_04', 'R_VIS_02'] },
    aria:       { b: ['enchant', 'cdr', 'warden'], fav: ['PK1', 'G_VIS_03', 'R_VIS_01'] },
    borg:       { b: ['bruiser', 'tank', 'duelist'], fav: ['G_RNG_04', 'R_RNG_02', 'P_VIS_03'] },
    chrononeo:  { b: ['gun', 'crit', 'speed'], fav: ['G_RL_04', 'P_RL_01', 'R_RL_01'] },
    clint:      { b: ['bruiser', 'gun', 'lethal'], fav: ['P_RL_03', 'G_RL_03', 'R_RL_02'] },
    death:      { b: ['magebruiser', 'battle', 'burst'], fav: ['G_VIS_02', 'R_VIS_02', 'G_RNG_02'] },
    elara:      { b: ['crit', 'speed', 'lethal'], fav: ['G_RNG_01', 'G_RNG_03', 'R_RNG_03'] },
    florian:    { b: ['duelist', 'bruiser', 'assassin'], fav: ['G_RNG_04', 'B_AS_01', 'G_AS_02'] },
    galo:       { b: ['battle', 'cdr', 'burst'], fav: ['G_VIS_01', 'P_VIS_04', 'R_VIS_02'] },
    gideon:     { b: ['bruiser', 'tank', 'lethal'], fav: ['G_RNG_02', 'R_RNG_02', 'G_AS_01'] },
    ignatius:   { b: ['burst', 'cdr', 'battle'], fav: ['G_VIS_02', 'R_VIS_01', 'P_VIS_01'] },
    jack:       { b: ['crit', 'gun', 'speed'], fav: ['G_RL_06', 'P_RL_05', 'R_RL_05'] },
    joker:      { b: ['cdr', 'burst', 'enchant'], fav: ['G_VIS_04', 'P_VIS_02', 'R_VIS_03'] },
    kazuki:     { b: ['assassin', 'duelist', 'speed'], fav: ['P_AS_02', 'G_AS_02', 'R_AS_01'] },
    koda:       { b: ['bruiser', 'duelist', 'assassin'], fav: ['G_RNG_04', 'B_AS_01', 'R_AS_01'] },
    lyra:       { b: ['cdr', 'burst', 'enchant'], fav: ['G_VIS_01', 'P_VIS_01', 'R_VIS_01'] },
    percy:      { b: ['speed', 'crit', 'lethal'], fav: ['G_RNG_01', 'R_RNG_01', 'G_RNG_03'] },
    raven:      { b: ['lethal', 'crit', 'gun'], fav: ['R_RNG_03', 'G_RNG_03', 'R_VIS_01'] },
    roxie:      { b: ['battle', 'cdr', 'burst'], fav: ['P_VIS_04', 'G_VIS_01', 'R_VIS_01'] },
    ryoma:      { b: ['assassin', 'duelist', 'lethal'], fav: ['G_RNG_02', 'R_RNG_02', 'G_AS_02'] },
    thanhphong: { b: ['burst', 'cdr', 'battle'], fav: ['G_VIS_03', 'R_VIS_01', 'P_VIS_01'] },
    theron:     { b: ['bruiser', 'lethal', 'tank'], fav: ['G_RNG_02', 'G_RNG_04', 'R_RNG_02'] },
    valerius:   { b: ['tank', 'bruiser', 'warden'], fav: ['G_RNG_02', 'P_VIS_03', 'R_VIS_03'] },
    vesper:     { b: ['assassin', 'lethal', 'duelist'], fav: ['P_VIS_02', 'G_VIS_04', 'R_VIS_02'] },
    victoria:   { b: ['bruiser', 'speed', 'warden'], fav: ['G_VIS_03', 'P_VIS_03', 'R_VIS_03'] },
    wukong:     { b: ['bruiser', 'duelist', 'tank'], fav: ['G_RNG_02', 'R_AS_01', 'R_RNG_02'] },
    zero:       { b: ['gun', 'crit', 'lethal'], fav: ['G_RL_01', 'P_RL_04', 'RAD_RL_01'] },
  };
  // tướng chưa khai báo: suy ra theo kiểu tướng
  function guess(def) {
    const k = def.kit, mg = def.dmgType === 'magic';
    if (def.gun) return ['gun', 'crit', 'speed'];
    if (k === 'marksman') return ['crit', 'speed', 'lethal'];
    if (k === 'mage') return ['burst', 'cdr', 'battle'];
    if (k === 'support') return mg ? ['enchant', 'cdr', 'warden'] : ['warden', 'bruiser', 'enchant'];
    if (k === 'tank') return ['tank', 'bruiser', 'warden'];
    return mg ? ['magebruiser', 'battle', 'burst'] : ['bruiser', 'duelist', 'assassin'];
  }
  // 3 lối build của một tướng (đối tượng khuôn + mã)
  function buildsOf(id) {
    const def = G.HEROES[id] || {}, e = H[id];
    return (e ? e.b : guess(def)).map((k) => Object.assign({ key: k }, T[k]));
  }
  function favOf(id) { return (H[id] && H[id].fav) || []; }
  // chọn 1 lối build cho trận (tất định theo hạt giống trận + tướng; không đụng luồng ngẫu nhiên giao tranh)
  function pickBuild(m, u) {
    const L = buildsOf(u.heroId), r = new G.Rng((m.seed || '') + ':build:' + u.heroId);
    if (u.pers && u.pers.strict) return L[0];   // Cầu Toàn: luôn lối build sở trường nhất
    const w = [0.45, 0.33, 0.22];   // lối sở trường nhất hay được chọn hơn
    let x = r.next(), i = 0; while (i < 2 && (x -= w[i]) > 0) i++;
    return L[i];
  }
  G.BUILD_T = T; G.HERO_BUILDS = H; G.buildsOf = buildsOf; G.favShards = favOf; G.pickBuild = pickBuild;
})();
