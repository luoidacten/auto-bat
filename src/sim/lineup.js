'use strict';
// ===== ĐỘI HÌNH TRẬN ĐẤU: 10 tướng ngẫu nhiên (theo hạt giống) =====
// GĐ7: không còn người triệu gọi. Mỗi tướng là một nhân vật với chỉ số bản lĩnh 1–20 cố định mà AI dùng: meca (Kỹ Năng),
// map (Đọc Bản Đồ), fight (Giao Tranh), disc (Kỷ Luật), refl (Phản Xạ), mental (Tâm Lý), stam (Thể Lực), farm (Ăn Quái).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const STAT_KEYS = ['meca', 'map', 'fight', 'disc', 'refl', 'mental', 'stam', 'farm'];
  const STAT_NAME = { meca: 'Kỹ Năng', map: 'Đọc Bản Đồ', fight: 'Giao Tranh', disc: 'Kỷ Luật', refl: 'Phản Xạ', mental: 'Tâm Lý', stam: 'Thể Lực', farm: 'Ăn Quái' };

  // GĐ7: BỎ NGƯỜI TRIỆU GỌI — mỗi tướng là một nhân vật có chỉ số bản lĩnh cố định (theo tính cách của tướng):
  // nền 13 cho mọi chỉ số, tính cách cộng/trừ theo hồ sơ (P.stats), thành thạo 80. Tên = tên tướng.
  function heroChar(heroId) {
    const H = G.HEROES[heroId], P = G.personalityOf(heroId), stats = {};
    for (const k of STAT_KEYS) stats[k] = Math.max(4, Math.min(20, 13 + ((P.stats && P.stats[k]) || 0)));
    return { id: 'c_' + heroId, name: H ? H.name : heroId, stats, mastery: 80, style: P.style, traits: [], syn: {} };
  }
  // tương thích công cụ cũ: trả về nhân vật của tướng (bỏ qua rng)
  function makeSummoner(rng, used, heroId) { return heroChar(heroId); }
  // 10 tướng khác nhau (theo hạt giống)
  function arenaLineup(rng, n) {
    n = n || G.C.HEROES;
    const pool = Object.keys(G.HEROES).sort();
    for (let i = pool.length - 1; i > 0; i--) { const j = rng.int(0, i); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    return pool.slice(0, n).map((hero) => ({ hero, player: heroChar(hero) }));
  }
  // cấu hình trận từ một hạt giống (đội hình lấy luồng ngẫu nhiên riêng để không ảnh hưởng trận)
  function arenaConfig(seed, o) {
    return Object.assign({ seed: String(seed), picks: arenaLineup(new G.Rng('lineup:' + seed)) }, o || {});
  }
  G.arenaLineup = arenaLineup; G.arenaConfig = arenaConfig; G.makeSummoner = makeSummoner; G.heroChar = heroChar;
  G.SUMMONER_STATS = STAT_KEYS; G.SUMMONER_STAT_NAME = STAT_NAME;
})();
