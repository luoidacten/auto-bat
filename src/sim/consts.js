'use strict';
// ===== CON SỐ THIẾT KẾ CỦA TRẬN ĐẤU (KẺ ĐẶT CƯỢC — đấu trường sinh tồn 10 tướng đánh đơn) =====
// Mọi con số ở đây được chép sang THIET_KE.md — sửa ở đây thì sửa luôn ở đó (node tools/thietke.js).
// Đơn vị: khoảng cách = đv (≈ 1 mét), thời gian = giây giờ game.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  G.C = {
    TICK: 0.05,             // 20 bước logic / giây giờ game
    MS: 1.6,                // tỉ lệ khoảng cách AI (ngưỡng "xa/gần" của AI viết theo bản thiết kế 120 đv × 1.6)
    MAP: 612,               // GĐ8: đấu trường vuông 612 × 612 đv (diện tích ×2 so với 432; 7 vùng ngoài + Phế Tích)
    AI_TICK: 2,             // AI thao tác mỗi 2 bước (0.1s); quyết định lớn mỗi 0.3–0.5s
    HEROES: 10,             // 10 tướng, mỗi tướng một phe (phe 0..9)
    NEUTRAL: 99,            // phe trung lập (quái, boss)
    MATCH_TIME: 3600,       // trận 30–60 phút giờ game; hết 60:00 thì những ai còn sống ĐỒNG HẠNG 1 (bo 6 không co về 0)

    // ---- tướng ----
    MAX_LVL: 18,
    xpNeed: (L) => 200 + 90 * (L - 1),          // KN để từ cấp L lên L+1
    XP_KILL_BASE: 120, XP_KILL_PER_LVL: 30,      // KN hạ tướng (người ra đòn cuối)
    ASSIST_WINDOW: 10,                           // gây sát thương trong 10s trước khi chết = có góp phần
    COMBAT_TAG: 4,
    OOC_DELAY: 5, OOC_HP: 0, OOC_MP: 0.02,        // GĐ6b: tướng KHÔNG tự hồi máu; ngoài giao tranh 5s chỉ hồi 2% mana tối đa mỗi giây
    // GĐ7b: bình máu / mana 3 cỡ — uống mất `drink` giây (đi chậm ×move, trúng đòn là hỏng lần uống), xong hồi NGAY `amt` × tối đa;
    // mang tối đa `cap` bình máu + `cap` bình mana. Mảnh hồn Tím "Trợ Năng": hồi thêm regen.k × lượng đó trong regen.over giây
    POTION: {
      cap: 3, move: 0.55,
      hp_s: { drink: 1.4, amt: 0.2 }, hp_m: { drink: 1.8, amt: 0.35 }, hp_l: { drink: 2.3, amt: 0.55 },
      mp_s: { drink: 1.0, amt: 0.25 }, mp_m: { drink: 1.3, amt: 0.45 }, mp_l: { drink: 1.7, amt: 0.7 },
      ga_s: { drink: 1.0, amt: 0.3 }, ga_m: { drink: 1.4, amt: 0.55 }, ga_l: { drink: 1.8, amt: 1.0 },   // GĐ8: bình Hộ Vệ (hồi Hộ Giáp)
      regen: { k: 0.5, over: 5 },
    },
    // GĐ8: HỘ GIÁP — thanh giáp phụ (trắng/xanh phủ trên thanh máu) gánh sát thương trước máu; nền base + perLvl × (cấp − 1),
    // cộng thêm từ mảnh hồn / Giáp Hoàng Kim. Không tự hồi: bình Hộ Vệ, Bình Thuốc Rực Rỡ, vài mảnh hồn. Bão (vòng bo) đánh thẳng vào máu.
    // Xuyên Thủng x%: x% sát thương đi thẳng vào máu; Chống Xuyên của mục tiêu trừ thẳng vào x.
    GA: { base: 100, perLvl: 15 },
    // GĐ7: rương đồ — mỗi vùng vài rương lúc đầu, rồi cứ `every` giây thêm `wave` rương trong vòng bo an toàn (tới `until`)
    CHEST: { perRegion: 5, every: 120, wave: 5, until: 2400, open: 1.5, r: 1.6, gold: 60, bagUp: 0.15, yniem: 0.08, soul: 0.15 },   // GĐ8: nhiều rương hơn
    FU_DOC: 0.65,
    // GĐ7b: liên minh tạm thời — kết từ phút from tới phút until, kéo dài dur giây, mỗi tướng tối đa perHero lần, hỏi lại sau askGap giây;
    // tan khi còn ≤ dissolve người, hoặc đồng minh gây cho nhau ≥ hitBreak × máu tối đa
    ALLY: { from: 90, until: 1500, dur: 210, perHero: 2, askGap: 25, dissolve: 4, hitBreak: 0.15 },
    // GĐ7: địa hình — cao nguyên / tháp canh: tầm nhìn ×1.25, người dưới thấp chỉ thấy người trên cao khi trong 7 đv, đánh từ trên xuống +10%
    HIGH: { vis: 1.25, hide: 7, dmg: 0.1 },
    // thùng thuốc nổ: trúng đạn / chiêu diện rộng → cháy ngòi rồi nổ (bán kính r), nổ dây chuyền
    BARREL: { r: 3.2, fuse: 0.45, chain: 0.3, dmg: 0.2, mon: 500, knock: 2.2 },                                // Phù Kháng Độc: bớt 65% sát thương bo
    // ý niệm (cấp vũ khí): +5% sát thương mỗi cấp; số ô gắn mảnh hồn = cấp (mảnh bậc K cần ý niệm ≥ K); mọi tướng khởi đầu ý niệm Trắng (1 ô).
    // Giá đúc lên cấp kế ở Thương Nhân theo cấp hiện tại (tối đa Đỏ); Rực Rỡ / Hoàng Kim (6 ô, +30% hiệu lực mảnh hồn) chỉ có từ boss.
    YNIEM: { dmg: 0.05, start: 1, forge: [350, 500, 1000, 1600, 2400], resonance: 0.3 },
    SOUL: { carry: 8, campSmall: 0.05, campBig: 0.12, orbLife: 120, orbDelay: 2, orbR: 1.3, orbSpread: 4 },   // mang tối đa 8 mảnh (gắn được = cấp ý niệm); bị hạ: rơi toàn bộ, 120s trên đất
    DUEL: { first: 480, every: 300, open: 150, r: 2.6, join: 2.0, ring: 12, max: 150, burn: 0.04,
      reward: { gold: 1000, xp: 1200, heal: 0.5, soul: 3 } },    // cổng quyết đấu: thắng nhận vàng, KN, hồi máu, mảnh hồn Tím
    DUEL_REALM: { cx: 1200, cy: 1200, r: 24, name: 'Không Gian Quyết Đấu' }, // không gian riêng biệt 2 người
    REVIVE_UNTIL: 1800, REVIVE_DELAY: 12,          // hồi sinh 1 lần nếu chết trong 30 phút đầu (GĐ8: bản đồ to hơn, sát thương cao hơn), sau 12s, ở chỗ an toàn trong bo
    REVIVE_HP: 0.7,
    HERO_HP_MULT: 2.4,                           // đánh đơn: tướng trâu gấp 2.4 bản MOBA → giao tranh dài 20–120s, đủ thời gian tung hết chiêu
    ALLIN_HP: 1.15,                              // tướng kiểu "Lì đòn" (đã đánh là không chạy): +15% máu tối đa
    PVP_DMG: 0.60,                               // giảm nhẹ sát thương tướng lên tướng để giao tranh căng hơn, khó đoán hơn
    PVP_EARLY: { k0: 0.8, full: 600 },           // GĐ8: 10 phút đầu sát thương tướng ↔ tướng tăng dần từ 80% → 100% (đầu trận bớt chết vì đụng độ lúc farm)
    MANA_COST: 0.6, MANA_REGEN: 1.6,             // chiêu tốn 60% mana, hồi mana ×1.6 → giao tranh dài vẫn còn mana tung chiêu
    CATCHUP_XP: 0.2,                             // KN quái +20% mỗi cấp thấp hơn trung bình (tối đa ×1.6)

    // ---- vàng ----
    GOLD_START: 500,
    GOLD_PASSIVE_START: 60, GOLD_PER_SEC: 1.5,
    GOLD_KILL: 200, GOLD_LOOT: 0.2,               // hạ tướng: 200 + lấy 20% vàng chưa tiêu của người bị hạ
    BOUNTY: 80, BOUNTY_MAX: 5,                   // TRUY NÃ: người đang chuỗi ≥ 2 mạng bị hạ thì kẻ hạ nhận thêm 80 vàng mỗi mạng trong chuỗi (tối đa 5)
    SHOP_R: 3.5,                                 // đứng trong 3.5 đv quanh Thương Nhân thì mua được đồ

    // ---- bo (vùng an toàn) ----
    // mỗi vòng: chờ wait giây rồi co trong shrink giây về bán kính r (tâm mới ngẫu nhiên theo hạt giống, nằm trong vòng cũ)
    // ngoài bo: mất dps × máu tối đa mỗi giây (sát thương chuẩn)
    ZONE_R0: 440,                                       // GĐ8: bán kính các vòng ×1.42 theo bản đồ
    ZONE: [
      { wait: 420, shrink: 160, r: 290, dps: 0.01 },    // co xong 9:40
      { wait: 330, shrink: 160, r: 205, dps: 0.015 },   // 17:50
      { wait: 300, shrink: 160, r: 142, dps: 0.025 },   // 25:30
      { wait: 300, shrink: 160, r: 90, dps: 0.035 },    // 33:10
      { wait: 270, shrink: 160, r: 48, dps: 0.05 },     // 40:20
      { wait: 240, shrink: 180, r: 16, dps: 0.07 },     // 47:20 — bo 6 KHÔNG co về 0; hết 60:00 ai còn sống đồng hạng 1
    ],

    // ---- thính (tiếp tế) ----
    DROP: { times: [360, 840, 1320, 1800, 2280, 2700], warn: 45, open: 3, r: 2.2, gold: 400, xp: 600, heal: 0.5 },   // + mảnh hồn Vàng (cuối trận có thể Đỏ) + 2 bình máu

    // ---- sát thương ----
    CRIT_MULT: 1.75,
    MIN_AS: 0.2, MAX_AS: 2.5,
    WINDUP: 0.3,                               // tỉ lệ thời gian vung tay trên chu kỳ đánh
    HERO_PROJ: 18,                             // tốc độ đạn đánh thường mặc định
    MAX_TRIGGER_DEPTH: 3,                      // chống vòng lặp phản đòn
    MAX_EVENTS_PER_TICK: 4000,

    // ---- quái nhỏ (bãi quái) ----
    CAMP_FIRST: 30,                            // bãi quái xuất hiện lần đầu lúc 0:30
    CAMP: {
      red:   { hp: 560, hpMin: 70, ad: 17, adMin: 2.5, armor: 20, mr: 20, as: 0.7, range: 1.8, r: 1.0, gold: 90, xp: 190, respawn: 90, name: 'Quái Đỏ' },
      blue:  { hp: 560, hpMin: 70, ad: 16, adMin: 2.5, armor: 20, mr: 20, as: 0.7, range: 1.8, r: 1.0, gold: 90, xp: 190, respawn: 90, name: 'Quái Xanh' },
      gold:  { hp: 520, hpMin: 60, ad: 15, adMin: 2.5, armor: 18, mr: 18, as: 0.7, range: 1.8, r: 0.95, gold: 110, xp: 170, respawn: 90, name: 'Quái Vàng' },
      small: { hp: 300, hpMin: 40, ad: 10, adMin: 2, armor: 10, mr: 10, as: 0.8, range: 1.6, r: 0.8, gold: 60, xp: 140, respawn: 60, name: 'Quái nhỏ' },
    },
    CAMP_GOLD_MIN: 3, CAMP_XP_MIN: 5,          // vàng/KN quái tăng mỗi phút
    LEASH: 6.5, LEASH_RESET: 5,                // quái đuổi tối đa 6.5 đv khỏi chỗ, 5s không bị đánh thì về
    BUFF_TIME: 90,                             // bùa 90s; người mang bùa bị hạ thì bùa sang kẻ hạ gục
    BUFF: { red: { dmgAmp: 0.12, burn: 6 }, blue: { mpr: 6, cdr: 0.15, cdrNoMana: 0.2 }, gold: { goldPct: 0.3, perSec: 1.2 } },

    // ---- Boss Tân Thế (ổ giữa đấu trường) ----
    // có từ 2:00; hạ được: người ra đòn cuối nhận Ấn Tân Thế (tăng mạnh sát thương). Từ bo 4: còn sống thì mạnh lên, đã chết thì hồi sinh bản mạnh.
    BOSS: { first: 240, respawn: 300, name: 'Boss Tân Thế', hp: 5200, hpMin: 200, ad: 110, adMin: 6, armor: 40, mr: 40, as: 0.55, range: 2.8, r: 2.0,
      gold: 250, xp: 450, buff: { dmgAmp: 0.25, time: 120 }, empowerPhase: 4, empower: { hp: 1.4, ad: 1.3, dmgAmp: 0.4, time: 150, gold: 400, xp: 700 } },

    BUSH_TRUESIGHT: 2.5,                       // đứng sát trong 2.5 đv thì thấy được người trong bụi

    // ---- tầm nhìn (mỗi tướng chỉ thấy bằng mắt mình + vật triệu hồi của mình; người xem thấy hết) ----
    VISION: { hero: 16, pet: 8, monster: 0 },          // GĐ8: tầm nhìn tướng xa hơn (12 → 16)
  };

  // ===== SÀN ĐẤU SOLO 1V1 — THIẾT KẾ THU GỌN THEO ĐẤU TRƯỜNG LEGACY =====
  G.SOLO_ARENA_THEMES = {
    da: {
      id: 'da',
      name: 'Đấu Trường Đá',
      r: 25,
      pillars: [{ x: -10, y: -6, r: 1.6 }, { x: 10, y: -6, r: 1.6 }, { x: -10, y: 6, r: 1.6 }, { x: 10, y: 6, r: 1.6 }],
      c: { top: '#7d7f86', top2: '#5f6168', rim: '#d4d6dc', side: '#33343a', bg1: '#1a1622', bg2: '#08060d', deco: 'tiles' }
    },
    go: {
      id: 'go',
      name: 'Sân Gỗ Lộng Gió',
      r: 24,
      pillars: [{ x: 0, y: -9.5, r: 1.8 }, { x: 0, y: 9.5, r: 1.8 }],
      c: { top: '#9a7448', top2: '#785630', rim: '#ffd599', side: '#4a3420', bg1: '#142232', bg2: '#060c14', deco: 'planks' }
    },
    bang: {
      id: 'bang',
      name: 'Hồ Băng Vĩnh Cửu',
      r: 25,
      pillars: [{ x: 0, y: -8.5, r: 1.7 }, { x: 0, y: 8.5, r: 1.7 }],
      c: { top: '#a9dcf2', top2: '#7ac5e8', rim: '#f0fbff', side: '#35637d', bg1: '#0d2233', bg2: '#030a12', deco: 'ice' }
    },
    lava: {
      id: 'lava',
      name: 'Miệng Hỏa Sơn',
      r: 24,
      pillars: [{ x: 0, y: -9.5, r: 1.6 }, { x: 8.2, y: 5.5, r: 1.6 }, { x: -8.2, y: 5.5, r: 1.6 }],
      c: { top: '#4a3a36', top2: '#352724', rim: '#ff8a3a', side: '#1e1210', bg1: '#360c04', bg2: '#0e0201', deco: 'cracks' }
    },
    ngai: {
      id: 'ngai',
      name: 'Ngai Võ Thần',
      r: 25,
      pillars: [{ x: -9, y: -5.5, r: 1.6 }, { x: 9, y: -5.5, r: 1.6 }, { x: -9, y: 5.5, r: 1.6 }, { x: 9, y: 5.5, r: 1.6 }],
      c: { top: '#3e2d60', top2: '#281c42', rim: '#ffd76a', side: '#160d26', bg1: '#200835', bg2: '#06010c', deco: 'runes' }
    },
    troi: {
      id: 'troi',
      name: 'Đảo Thiên Không',
      r: 25,
      pillars: [{ x: -9.5, y: -5.5, r: 1.6 }, { x: 9.5, y: -5.5, r: 1.6 }, { x: 0, y: 7.5, r: 1.6 }],
      c: { top: '#7fc06a', top2: '#5f964c', rim: '#d9ffc4', side: '#523820', bg1: '#1b3b60', bg2: '#081422', deco: 'grass' }
    }
  };
})();
