#!/usr/bin/env node
'use strict';
// ===== Sinh THIET_KE.md từ chính dữ liệu trong mã (để tài liệu luôn khớp với mã) =====
//   node tools/thietke.js            → ghi lại THIET_KE.md
//   node tools/thietke.js --kiemtra  → báo lỗi nếu THIET_KE.md đang lệch so với mã
const fs = require('fs');
const path = require('path');
const G = require('./nap.js');
const C = G.C, MAP = G.MAP;
const OUT = path.join(__dirname, '..', 'THIET_KE.md');

const L = [];
const p = (...a) => L.push(a.join(''));
const f1 = (x) => (Math.round(x * 10) / 10).toString();
const arr = (a) => (Array.isArray(a) ? a.join('/') : a == null ? '—' : String(a));
const mm = (t) => G.U.mmss(t);
const pc = (x) => Math.round(x * 1000) / 10 + '%';

p('# THIẾT KẾ — KẺ ĐẶT CƯỢC: mọi con số của đấu trường');
p('');
p('> Tệp này được **sinh tự động** từ mã bằng `node tools/thietke.js`. Đừng sửa tay: sửa trong mã rồi chạy lại lệnh.');
p('> `node tools/thietke.js --kiemtra` báo lỗi nếu tài liệu lệch với mã.');
p('> Đơn vị: khoảng cách = **đv** (≈ 1 mét), thời gian = giây giờ game. GĐ6: bỏ hẳn bản MOBA 5v5; trò chơi là **đấu trường sinh tồn 10 tướng đánh đơn**. GĐ6b: bản đồ ×5 diện tích, 6 vùng, trận 30–60 phút, giao tranh dài, bình máu, mảnh hồn, cổng quyết đấu. GĐ8: bản đồ ×2, 8 vùng, 4 ổ boss / 7 boss có cảnh báo, Hộ Giáp & Xuyên Thủng, mảnh hồn 9 chỉ số × 6 bậc. GĐ9: súng & nạp đạn, mảnh hồn Tầm Nhìn / Tầm Đánh / Nạp Đạn / Tốc Đánh, thính giác & truy vết, 3 lối build mỗi tướng, trao đổi & bịp trong liên minh. GĐ9b: **nhà cái & đặt cược** (mục 19). GĐ10: 13 tướng mới/làm lại, AI nhận thức & chọn nhánh theo tiện ích, quan hệ cốt truyện. GĐ11: **bộ não chiến đấu** (mục 13m), bo Ăn Mòn & Vết Thương Sâu (13n), quái lang thang & boss nhỏ (7b), liên minh vĩnh cửu (13o), **Phòng thử nghiệm Sandbox** (20), vũ khí & hiệu ứng riêng từng tướng (18).');
p('');
p('## 0. Tổng quan — trò chơi vận hành thế nào');
p('Đọc mục này trước để hiểu toàn bộ trò chơi; các mục sau là con số chi tiết của từng hệ thống.');
p('');
p('### 0.1. Bạn là ai, chơi để làm gì');
p('- **Kẻ Đặt Cược** là trò chơi *xem & đặt cược*: bạn không điều khiển tướng. 10 tướng do máy điều khiển (AI) thả vào một đấu trường sinh tồn, đánh nhau tới khi chỉ còn 1 người. Bạn đứng ngoài như **trọng tài** — thấy hết bản đồ, thấy cả suy nghĩ của từng tướng — và **đặt cược** để trả món nợ với nhà cái.');
p(`- Một **ván** gồm ${G.BET.stages.length} chặng × ${G.BET.perStage} trận. Hết mỗi chặng phải đạt chỉ tiêu tiền; chặng cuối phải trả hết nợ. Trả xong thì được tự do và có thể chơi tiếp **vô tận** (chỉ tiêu tăng dần). Chi tiết ở mục 19.`);
p('- Trong mỗi trận: trước trận nhà cái cho **tỷ lệ cược** + tin đồn + câu hỏi đầu (ai sống tới cuối, ai Top 1, Top 3) + **Giao Kèo ×10**; giữa trận nhà cái **dừng trận để hỏi** (ai thắng giao tranh này, ai giết boss, ai lấy thính…); sau trận: thanh toán, cửa hàng charm (cộng dồn), quà có mặt trái, vay nợ, **sổ tiết kiệm** lãi kép.');
p('- **Nhà cái không trung thực**: có **người của nhà cái** cài trong trận (liên minh ngầm, không đánh nhau), tin đồn giả, điều khoản chữ nhỏ. Kỹ năng của người chơi là *đọc người*: xem tính cách, sức mạnh, máu, đồ, ý định của AI rồi mới đặt.');
p('');
p('### 0.2. Các chế độ ở màn hình chính');
p('- 🎲 **Ván cược** (vòng chơi chính, mục 19) • 👁 **Xem một trận tự do** (không cược) • ⚔ **Solo 1v1** (2 tướng tùy chỉnh cấp, đồ, mảnh hồn trên sàn đấu thu gọn) • ⏩ **Mô phỏng nhanh** (chạy hết trận trong chớp mắt, xem bảng kết quả) • 🧪 **Phòng thử nghiệm Sandbox** (GĐ11, mục 20: thả bù nhìn, đo DPS, bật/tắt hồi chiêu…) • 📜 bản cũ (Legacy).');
p('');
p('### 0.3. Một trận diễn ra thế nào (dòng thời gian)');
p(`- **0:00** — 10 tướng (chọn ngẫu nhiên theo hạt giống) xuất hiện ở ${MAP.spawns.length} điểm xuất phát rải trên 5 vùng thường, mỗi tướng cấp 1, ${C.GOLD_START} vàng, vài bình máu. Bản đồ ${C.MAP}×${C.MAP} đv sinh theo hạt giống (biome, công trình, bụi, thùng nổ). Mỗi tướng có **tính cách cố định** (mục 11) và **phong cách đánh**.`);
p(`- **${mm(C.CAMP_FIRST)}** — bãi quái mở (mục 7): tướng farm vàng/KN để lên cấp (tối đa ${C.MAX_LVL}), mua đồ ở Thương Nhân, nâng **Ý Niệm** (cấp vũ khí) và khảm **mảnh hồn** (mục 13c). Quái lang thang (GĐ11) bắt đầu đi tuần từ giây ${C.ROAM.first}; boss nhỏ từ ${mm(C.ROAM.bossFirst)}.`);
p(`- **Trước ${mm(C.REVIVE_UNTIL)}** — chết được hồi sinh 1 lần. Sau đó chết là **bị loại**; xếp hạng theo thứ tự bị loại.`);
p(`- **Bo** (vùng an toàn, mục 3) co ${C.ZONE.length} vòng; ngoài bo mất máu theo % và (GĐ11) dính **Ăn Mòn** + **Vết Thương Sâu** (mục 13n) → ép mọi người dồn vào giữa.`);
p(`- **Boss lớn** (mục 8) xuất hiện ở 4 ổ theo lịch, chiêu lớn có vùng cảnh báo; hạ được thì nhận bùa lợi, đồ Hoàng Kim. **Thính** (mục 9) rơi từ trời theo đợt. **Rương** (mục 13e), **cổng quyết đấu** 1v1 thưởng lớn (mục 13d).`);
p(`- **Kết thúc**: còn 1 người, hoặc hết ${mm(C.MATCH_TIME)} thì những ai còn sống đồng hạng 1.`);
p('');
p('### 0.4. AI tướng nghĩ thế nào (mỗi nhịp nghĩ 0.06–0.25s)');
p('1. **Nhận thức** (mục 13k): tầm nhìn 180°, bụi, tàng hình; nghe tiếng giao tranh / tiếng đánh quái trong 35–55 đv; nhớ vị trí cuối của đối thủ để truy vết. Trễ phản xạ, giật mình, hoảng loạn (GĐ10).');
p('2. **Phản xạ chiến đấu** (GĐ11, mục 13m): bị đánh từ góc khuất → xoay mặt / bắn trả mù; ngoài bo → lướt vào; dùng lại chiêu snapback đúng lúc; né chiêu định hướng & vùng cảnh báo.');
p('3. **Quyết định lớn — Utility AI** (mục 13): chấm điểm ~20 hành động (farm, săn người, kền kền, tranh boss, tranh thính, chạy bo, núp, uống bình, quyết đấu, săn quái lang thang…) theo **trọng số tính cách**, giữ quán tính tối thiểu.');
p('4. **Vi mô theo tính cách** (Persona) + **AI riêng của tướng** (ví dụ Raven tìm chỗ bắn tỉa, Luca bọc lót Alice) + **liên minh vĩnh cửu / tạm thời**.');
p('5. **Giao tranh**: chọn mục tiêu bằng điểm (KS, thù dai, trả đũa, nhánh kết liễu…), đánh giá thế trận theo **sức mạnh**, rồi vi thao tác: phá tụ lực, đọc đòn, chống thả diều, ép bo, combo "múa", giữ cự ly riêng, thả diều, rút lui / Đường Cùng Phản Sát (quay lại khô máu khi không thoát được).');
p('');
p('### 0.5. Các hệ thống & nơi đọc chi tiết');
p('| Hệ thống | Mục | Mã nguồn |');
p('|---|---|---|');
for (const [a, b, c] of [
  ['Nhịp logic, tất định, hạt giống', '1', 'src/core/*, src/sim/match.js'], ['Bản đồ, vùng, ổ boss, công trình', '2, 13f', 'src/sim/map.js, src/sim/props.js'], ['Bo + Ăn Mòn + Vết Thương Sâu', '3, 13n', 'src/sim/arena.js'],
  ['Cấp, KN, hồi sinh, xếp hạng', '4', 'src/sim/match.js, src/sim/arena.js'], ['Sát thương, khiên, Hộ Giáp, xuyên thủng', '5, 13i', 'src/sim/combat.js'], ['Kinh tế, trang bị', '6, 14', 'src/sim/items.js, src/data/items.js'],
  ['Quái rừng, bầy đầu đàn', '7', 'src/sim/neutral.js'], ['Quái lang thang & 8 boss nhỏ', '7b', 'src/sim/roamers.js'], ['Boss lớn, bùa lợi, đồ Hoàng Kim', '8', 'src/sim/bosses.js'],
  ['Thính, rương, balo, bình', '9, 13b, 13e', 'src/sim/arena.js, src/sim/bag.js'], ['Tính cách & AI sinh tồn', '11, 13', 'src/data/personality.js, src/sim/ai/utility.js, persona.js'], ['Bộ não chiến đấu GĐ11', '13m', 'src/sim/ai/combat_brain.js'],
  ['Nhận thức, cây kỹ năng theo tiện ích', '13k, 17', 'src/sim/ai/cognition.js'], ['Ý Niệm & mảnh hồn', '13c', 'src/data/shards.js, src/sim/extras.js'], ['Quan hệ cốt truyện, liên minh vĩnh cửu', '13o', 'src/data/relations.js'],
  ['Tướng & chiêu', '16', 'src/data/heroes/*.js'], ['Nhà cái & đặt cược', '19', 'src/data/bookie.js, src/sim/bookie.js, src/ui/bet_ui.js'], ['Phòng thử nghiệm Sandbox', '20', 'src/sim/sandbox.js, src/ui/sandbox_ui.js'], ['Chiến thuật AI GĐ12', '13p', 'src/sim/ai/tactics12.js'], ['Chế độ PvE Sinh Tồn', '21', 'src/sim/pve.js, src/ui/pve_ui.js'],
  ['Giao diện xem trận, hiệu ứng, vũ khí', '18', 'src/ui/render.js, hud.js, vfx.js, draw_hero.js']]) p(`| ${a} | ${b} | \`${c}\` |`);
p('- Công cụ: `node tools/mophong.js` (mô phỏng nhiều trận, `--kiemtra` tất định) • `node tools/thu_tuong.js` (thử 1 tướng) • `node tools/tyle.js` (tỷ lệ cược) • `node tools/sandbox_test.js` (5 kịch bản Sandbox, `--dps <tướng> <cấp>`) • `node tools/thietke.js` (sinh tài liệu này) • `node tools/choi_thu.js` (đóng gói bản chơi thử).');
p('');
p('## 1. Nhịp logic & tất định');
p(`- Bước logic cố định ${C.TICK}s (${Math.round(1 / C.TICK)} bước/giây giờ game). AI tướng thao tác mỗi ${C.AI_TICK} bước (nhịp nghĩ theo Phản Xạ), quyết định lớn (Utility AI) mỗi 0.3–0.5s, lệch pha giữa các tướng.`);
p('- Mọi ngẫu nhiên lấy từ bộ sinh số sfc32 có hạt giống, tách 3 luồng: giao tranh, AI, đấu trường (bo, thính). Đội hình lấy luồng riêng "lineup:<hạt giống>". Lượng giác tự viết bằng đa thức → cùng hạt giống cho cùng trận trên mọi máy.');
p(`- Chống vòng lặp phản đòn: độ sâu kích hoạt tối đa ${C.MAX_TRIGGER_DEPTH}; tối đa ${C.MAX_EVENTS_PER_TICK} sự kiện sát thương mỗi bước (vượt thì ghi lỗi, không treo).`);
p('');
p('## 2. Đấu trường');
p(`- Vuông ${C.MAP}×${C.MAP} đv (GĐ8: diện tích ×2 so với 432×432; bố cục cũ nhân ${f1(MAP.K)}), tâm (${MAP.center.x}, ${MAP.center.y}), **${MAP.NSEC} vùng ngoài** (mỗi vùng ≈${f1(360 / MAP.NSEC)}°) + vùng trong. Ngưỡng khoảng cách của AI viết theo thang ${C.MS}×.`);
p(`- **${MAP.REGIONS.length} vùng**: ${MAP.REGIONS.map((R) => R.icon + ' ' + R.name).join(' • ')} (biome của 5 vùng thường đổi theo hạt giống). Phế Tích Tân Thế là vòng trong (bán kính ${MAP.INNER_R}). **2 vùng đặc biệt cố định** (GĐ8): 💀 Vùng Tử Khí (vùng 2) và ☣ Trạm Khí Độc (vùng 5) — không có điểm xuất phát, mỗi vùng một ổ boss, có hiểm họa riêng (mục 13f).`);
p(`- ${MAP.walls.length} khối tường (vòng tường các ổ boss, đá vòng trong, vách xuyên tâm có khe, công trình, đá rải rác, tảng đá góc). Tìm đường: lưới nút + nút quanh đầu tường / tảng đá, Dijkstra từ mọi nút (số thực 64-bit).`);
p(`- **${MAP.lairs.length} ổ boss**: ${MAP.lairs.map((L) => `${L.icon} ${L.name} (bán kính ${f1(L.r)})`).join(' • ')} — mỗi ổ có 3 quái tuần tra đi vòng quanh (mục 8). ${MAP.merchants.length} Thương Nhân (mỗi vùng ngoài 1, ở rìa Phế Tích) — chỉ mua được đồ / bình khi đứng trong ${C.SHOP_R} đv quanh Thương Nhân (hoặc trước giây 1).`);
p(`- ${MAP.camps.length} bãi quái (${Object.entries(MAP.camps.reduce((a, c) => { a[c.type] = (a[c.type] || 0) + 1; return a; }, {})).map(([k, n]) => `${C.CAMP[k] ? C.CAMP[k].name : k} ×${n}`).join(', ')}; vùng đặc biệt có bãi riêng, quái nhỏ đổi dáng theo vùng). ${MAP.bushes.length} bụi cỏ. ${MAP.spawns.length} điểm xuất phát ở 5 vùng thường, mỗi vùng 2 điểm → đầu trận xa nhau, ít chạm mặt.`);
p(`- Quái nhỏ theo vùng (GĐ8): ${Object.values(G.MON_SKIN).map((k) => k.name + (k.hit ? ` (${{ bleed: 'chảy máu', poison: 'độc', slow: 'làm chậm', drain: 'hút máu' }[k.hit]})` : k.boom ? ' (chết thì nổ mây độc)' : '')).join(' • ')}.`);
p('- **Chủ bãi đầu trận**: mỗi bãi thuộc tướng có điểm xuất phát gần nhất (hai người gần ngang nhau → bãi tranh chấp). 6 phút đầu AI né bãi của người khác (×0.15) và bãi tranh chấp (×0.2 trước phút 4, ×0.7 sau đó).');
p('');
p('## 3. Bo (vùng an toàn)');
p(`- Bo ban đầu bán kính ${C.ZONE_R0} (trùm cả bản đồ). Mỗi vòng: chờ rồi co dần về vòng kế; tâm vòng kế chọn ngẫu nhiên theo hạt giống, nằm trọn trong vòng hiện tại. Vòng kế được báo ngay khi vòng trước co xong (ai cũng thấy).`);
p('- Ngoài bo mất % máu tối đa mỗi giây (sát thương chuẩn, tính mỗi 0.5s).');
p('| Vòng | Chờ | Co trong | Bán kính sau khi co | Co xong lúc | Ngoài bo mất |');
p('|---|---|---|---|---|---|');
{ let t = 0; C.ZONE.forEach((z, i) => { t += z.wait + z.shrink; p(`| ${i + 1} | ${z.wait}s | ${z.shrink}s | ${z.r} | ${mm(t)} | ${pc(z.dps)} máu/giây |`); }); }
p(`- **Bo 6 không co về 0.** Hết ${mm(C.MATCH_TIME)} mà còn nhiều người thì những người còn trong trận **đồng hạng 1** (theo gợi ý trong GDD; nhà cái sẽ lợi dụng điều khoản này ở các giai đoạn sau).`);
p('');
p('## 4. Tướng: cấp, kinh nghiệm, hồi sinh, xếp hạng');
p(`- Cấp 1 → ${C.MAX_LVL}, mỗi cấp 1 điểm chiêu. S1–S3 tối đa 5 cấp (không quá nửa cấp tướng), S4 mở ở cấp 4, nâng ở 8 và 12. Skill phụ không tốn điểm.`);
p(`- KN để lên cấp: 200 + 90 × (cấp − 1). Tổng KN tới cấp ${C.MAX_LVL}: ${Array.from({ length: C.MAX_LVL - 1 }, (_, i) => C.xpNeed(i + 1)).reduce((a, b) => a + b, 0)}.`);
p(`- KN hạ tướng (người ra đòn cuối): ${C.XP_KILL_BASE} + ${C.XP_KILL_PER_LVL} × cấp nạn nhân. Không có KN hỗ trợ.`);
p(`- **KN đuổi kịp**: thấp hơn cấp trung bình của những người còn trong trận thì KN quái +${C.CATCHUP_XP * 100}% mỗi cấp (tối đa ×1.6); cao hơn trung bình quá 2 cấp thì −8% mỗi cấp (tối thiểu ×0.75).`);
p(`- Máu tướng ×${C.HERO_HP_MULT} so với bản MOBA; tướng kiểu "Lì đòn" thêm ×${C.ALLIN_HP}. Sát thương tướng (và vật triệu hồi) lên tướng ×${C.PVP_DMG} (GĐ8: từ 0.55; ${C.PVP_EARLY.full / 60} phút đầu tăng dần từ ×${C.PVP_EARLY.k0} lên đủ) → giao tranh 10–120s tùy trận và người đánh.`);
p(`- **Không tự hồi máu** (hồi máu cơ bản = 0). Hồi máu chỉ bằng bình, chiêu, hút máu, thính, thắng quyết đấu. Ngoài giao tranh (${C.OOC_DELAY}s không trúng đòn, không đánh tướng) chỉ hồi ${C.OOC_MP * 100}% mana tối đa mỗi giây. Hồi mana cơ bản ×${C.MANA_REGEN}, tiêu hao mana ×${C.MANA_COST} (đủ mana để xả chiêu suốt giao tranh dài).`);
p(`- **Hồi sinh**: chết trong ${mm(C.REVIVE_UNTIL)} đầu thì được hồi sinh **1 lần** sau ${C.REVIVE_DELAY}s, với ${C.REVIVE_HP * 100}% máu, bất tử 2s, ở điểm xuất phát nằm trong bo xa người khác nhất (không có thì giữa vòng bo kế). Chết lần nữa, hoặc chết sau ${mm(C.REVIVE_UNTIL)} → **bị loại**.`);
p('- **Xếp hạng** theo thứ tự bị loại; nhiều người bị loại trong cùng một bước logic thì đồng hạng. Còn ≤ 1 người → hết trận.');
p('- Công hạ gục: người ra đòn cuối; chết vì bo/quái mà vừa bị tướng khác đánh (≤ ' + C.ASSIST_WINDOW + 's) thì công thuộc người gây nhiều sát thương nhất. **Kền kền** = người ra đòn cuối góp < 35% sát thương lên nạn nhân trong ' + C.ASSIST_WINDOW + 's cuối và có người khác góp nhiều hơn.');
p('');
p('## 5. Sát thương');
p('- Vật lý giảm theo Giáp, phép giảm theo Kháng Phép: hệ số = 100 / (100 + chỉ số) (chỉ số âm: 2 − 100/(100 − chỉ số)). Chuẩn không giảm.');
p('- Xuyên giáp/xuyên phép: trừ % trước, trừ cố định sau, không xuống dưới 0.');
p(`- Chí mạng ×${C.CRIT_MULT}. Tốc đánh giới hạn ${C.MIN_AS}–${C.MAX_AS}. Vung tay = ${C.WINDUP * 100}% chu kỳ đánh. Đạn đánh thường mặc định ${C.HERO_PROJ} đv/s.`);
p('- Khiên hấp thụ trước máu. "Bất tử" giữ máu ≥ 1. Giảm sát thương nhận cộng dồn kiểu nhân. Kháng hiệu ứng rút ngắn mọi khống chế trừ hất tung (tối đa 60%).');
p('');
p('## 6. Kinh tế');
p(`- Vàng khởi điểm ${C.GOLD_START}; thu nhập ${C.GOLD_PER_SEC} vàng/giây từ giây ${C.GOLD_PASSIVE_START}.`);
p(`- Hạ tướng: ${C.GOLD_KILL} + lấy ${C.GOLD_LOOT * 100}% vàng chưa tiêu của nạn nhân. **Truy nã**: nạn nhân đang chuỗi ≥ 2 mạng thì thêm ${C.BOUNTY} vàng mỗi mạng trong chuỗi (tối đa ${C.BOUNTY_MAX}). Kẻ đang chuỗi ≥ 3 mạng bị lộ vị trí với mọi người.`);
p('- Quái, boss, thính: xem mục 7–9. Trang bị mua ở Thương Nhân (mục 14).');
p('');
p('## 7. Quái rừng');
p(`- Bãi quái xuất hiện lúc ${mm(C.CAMP_FIRST)}; vàng/KN quái tăng ${C.CAMP_GOLD_MIN} vàng, ${C.CAMP_XP_MIN} KN mỗi phút; quái đuổi tối đa ${C.LEASH} đv, ${C.LEASH_RESET}s không bị đánh thì về chỗ và hồi máu. Thưởng chỉ cho người ra đòn cuối.`);
p('| Bãi | Máu (+/phút) | Công (+/phút) | Giáp/KP | Vàng | KN | Hồi sinh |');
p('|---|---|---|---|---|---|---|');
for (const d of Object.values(C.CAMP)) p(`| ${d.name} | ${d.hp} (+${d.hpMin}) | ${d.ad} (+${d.adMin}) | ${d.armor}/${d.mr} | ${d.gold} | ${d.xp} | ${d.respawn}s |`);
p(`- Bùa ${C.BUFF_TIME}s (người mang bị hạ → bùa sang kẻ hạ gục): Đỏ +${C.BUFF.red.dmgAmp * 100}% sát thương, thiêu ${C.BUFF.red.burn}/s • Xanh +${C.BUFF.blue.mpr} hồi mana/s, −${C.BUFF.blue.cdr * 100}% hồi chiêu (tướng không mana −${C.BUFF.blue.cdrNoMana * 100}%) • Vàng +${C.BUFF.gold.goldPct * 100}% vàng nhận, +${C.BUFF.gold.perSec} vàng/s.`);
p('');
// ===== GĐ11 =====
p('## 7b. Quái GĐ11: dây xích rộng, bầy có đầu đàn, quái lang thang & boss nhỏ');
p(`- **Dây xích rộng hơn, kiên nhẫn hơn**: quái đuổi tối đa ${C.LEASH} đv quanh chỗ đứng, ${C.LEASH_RESET}s không bị đánh mới chịu về và hồi máu (trước: ngắn hơn, dễ thả diều quái).`);
p(`- **Bầy có đầu đàn**: ${pc(C.PACK.chance)} bãi quái nhỏ thành bầy — 1 **đầu đàn** (máu ×${C.PACK.leadHp}, công ×${C.PACK.leadAd}) + ${C.PACK.n} con theo (máu ×${C.PACK.memHp}). Cả bầy luôn đánh **đúng mục tiêu của đầu đàn**; đánh một con là cả bầy quay sang. Con theo chết cho 40% thưởng.`);
p(`- **Quái lang thang** (src/sim/roamers.js): từ giây ${C.ROAM.first}, mỗi ${C.ROAM.every}s một nhóm đi tuần (tối đa ${C.ROAM.maxGroups} nhóm cùng lúc) xuất hiện ở vùng hợp phe (theo biome), có đầu nhóm tinh anh. Phát hiện tướng thì đuổi ${C.ROAM.chase[0]}–${C.ROAM.chase[1]} đv; tướng vào bụi / tàng hình ${C.ROAM.loseBush}s thì mất dấu. Thưởng: quái thường ${C.ROAM.reward.normal.gold} vàng + ${C.ROAM.reward.normal.xp} KN (${pc(C.ROAM.reward.normal.pot)} rơi bình nhỏ), tinh anh ${C.ROAM.reward.elite.gold} vàng + ${C.ROAM.reward.elite.xp} KN, boss nhỏ ${C.ROAM.reward.boss.gold} vàng + ${C.ROAM.reward.boss.xp} KN (cộng thêm theo phút).`);
{
  const T = G.ROAM_T, F = G.ROAM_FACTION, B = G.ROAM_BOSS;
  const TR = { front: (v) => `khiên trước mặt −${pc(v)} sát thương từ phía trước`, sweep: () => 'quét nón 2.6 đv mỗi 5s', shred: (v) => `mỗi đòn xé ${pc(v)} Hộ Giáp`, aura: () => 'hào quang hồi máu + tăng tốc đồng đội',
    poison: () => 'đòn độc', burst: () => 'chết thì nổ độc 3 đv', shell: () => 'mai cứng −30% sát thương tầm xa', acid: () => 'phun vũng axit', slowAs: () => '−20% tốc đánh 2s',
    kamikaze: () => 'lao vào tự nổ', bushCrit: () => 'đòn đầu từ bụi ×2', mirror: () => 'trúng đòn thì tàng hình 1s & dịch chuyển', wail: () => 'tiếng gào làm chậm quanh mục tiêu', scream: () => 'hét câm lặng 1s mỗi 6s',
    ranged: () => 'đánh xa', magic: () => 'sát thương phép' };
  const tr = (o) => Object.keys(TR).filter((k) => o[k]).map((k) => TR[k](o[k])).join(', ') || '—';
  for (const [fk, Fa] of Object.entries(F)) {
    p(`- ${Fa.icon} **${Fa.name}** (vùng: ${Fa.bio.map((b) => (MAP.REGIONS.find((R) => R.bio === b) || {}).name || ('biome ' + b)).join(', ')}):`);
    for (const k of Fa.types) { const t = T[k]; p(`  - **${t.name}** — máu ${t.hp}, công ${t.ad}, giáp/KP ${t.armor}/${t.mr}, tốc ${t.ms}${t.range > 2 ? ', tầm ' + t.range : ''}: ${tr(t)} • tinh anh **${t.elite.name}** (máu ${t.elite.hp}): ${tr(Object.assign({}, t, t.elite))}`); }
  }
  p(`- **8 boss nhỏ** (từ ${mm(C.ROAM.bossFirst)}, mỗi ${C.ROAM.bossEvery}s, tối đa ${C.ROAM.maxBoss} con cùng lúc; mỗi con 2 kỹ năng có vùng cảnh báo):`);
  p('| Boss nhỏ | Phe | Máu (+/phút) | Công (+/phút) | Giáp/KP | Kỹ năng (hồi) |');
  p('|---|---|---|---|---|---|');
  for (const b of Object.values(B)) p(`| ${b.name} | ${F[b.fac].icon} ${F[b.fac].name} | ${b.hp} (+${b.hpMin}) | ${b.ad} (+${b.adMin}) | ${b.armor}/${b.mr} | ${b.sk.map((s) => `${s.name} (${s.cd}s)`).join(' • ')} |`);
  p('- **Tiếng đánh quái vang 35 đv**: tướng nghe thấy người khác đang đánh quái lang thang/boss nhỏ → có thể kéo tới kền kền hoặc săn người đang yếu. AI có hành động riêng 💀 **Săn quái lang thang** (Utility).');
}
p('');
p('## 8. Boss (GĐ8: 4 ổ, 7 boss, mọi chiêu lớn đều có vùng cảnh báo)');
const BS = G.BOSSES, BF = G.BOSS_BUFFS, GO = G.GOLDEN, LP = G.LAIR_PLAN;
const REW = { tan_the: `${BS.tan_the.gold} vàng, ${BS.tan_the.xp} KN, ${BF.an_tan_the.icon} Ấn Tân Thế +25% sát thương 120s (Tân Thế cường hóa: +40%), 1 mảnh hồn Tím–Đỏ, Ý Niệm +1`,
  quai_thu: '5000 vàng, balo lên cấp 6, 2 Bình Rực Rỡ, Ý Niệm Rực Rỡ, 3 món Hoàng Kim ngẫu nhiên', kiem_su: `${BS.kiem_su.gold} vàng, 1 món Hoàng Kim + ⚔ Lưỡi Kiếm Sắc Bén (độc quyền) + ✨ Mảnh Hồn Ý Chí + Ý Niệm Rực Rỡ` };
p('| Boss | Ổ | Máu (+/phút) | Công (+/phút) | Giáp/KP | Chiêu có cảnh báo | Thưởng (người ra đòn cuối) |');
p('|---|---|---|---|---|---|---|');
for (const [id, D] of Object.entries(BS)) {
  const lair = Object.keys(LP).filter((k) => LP[k].list.includes(id)).map((k) => MAP.lairs[k].name).join(', ') || 'Tâm bo (từ bo 4)';
  const rw = REW[id] || `${D.gold} vàng, ${D.xp} KN, bùa ${BF[D.buff].icon} **${BF[D.buff].name}** (${BF[D.buff].time}s), 1 mảnh hồn Tím–Đỏ`;
  p(`| ${D.icon} ${D.name} | ${lair} | ${D.hp} (+${D.hpMin}) | ${D.ad} (+${D.adMin}) | ${D.armor}/${D.mr} | ${D.skills.map((k) => (G.BOSS_SK[k] && G.BOSS_SK[k].name) || k).join(', ')} | ${rw} |`);
}
p(`- Lịch ổ: ${Object.entries(LP).map(([k, P]) => `${MAP.lairs[k].icon} ${MAP.lairs[k].name}: ${P.list.map((id) => BS[id].name).join(' → ')} (lần đầu ${mm(P.first)}, bị hạ thì ${P.respawn}s sau ra con kế)`).join(' • ')}. Báo trước 20s. Ổ nằm ngoài bo thì boss không ra.`);
p('- **Rồng Cổ Đại**: khi bo 4 bắt đầu co, Boss Tân Thế bay đi; 20s sau Rồng hạ cánh ở **tâm vòng bo hiện tại** (mọi người đều ở gần) — cuối trận luôn có con boss mạnh nhất để tranh.');
p('- Boss nhắm theo **bảng thù hận** (sát thương gây ra, giảm dần; đổi mục tiêu khi kẻ khác vượt 30%); 10s không ai đánh thì hồi 0.4% máu/giây. Ai bắt đầu đánh boss (sau 30s yên ắng) thì **cả bản đồ được báo** ("⚠ X đang đánh boss") → nhiều AI kéo tới tranh boss. Mỗi ổ có 3 quái tuần tra (Thạch Vệ / Vong Hồn / Đột Biến Thể / Kim Giáp Trùng) đi vòng quanh, bị hạ thì 120s sau ra lại.');
p('- **Bùa lợi boss** (ai cũng thấy biểu tượng trên đầu người mang; AI biết bùa của mình và của người khác):');
for (const [k, b] of Object.entries(BF)) if (k !== 'an_tan_the') p(`  - ${b.icon} **${b.name}** (${b.time}s): ${b.desc}`);
p('- **Đồ Hoàng Kim** (chỉ từ Quái Thú Hoàng Kim / Kiếm Sư Vĩ Đại; không chiếm ô trang bị):');
for (const [k, g] of Object.entries(GO)) p(`  - ${g.icon} **${g.name}**${g.exclusive ? ' (độc quyền Kiếm Sư)' : ''}: ${g.desc}`);
p('- **AI với boss**: điểm "tranh boss" xét đủ mọi ổ — ước lượng thời gian hạ (theo giáp/kháng phép của boss), có kịp không, đang có ai đánh (cướp khi boss < 35%), giá trị từng boss; Con Bạc / Khát Nước / Thực Dụng / Hổ Báo (Jack, Percy, Roxie, Borg) ×2.0 với Quái Thú Hoàng Kim; máu < 30% thì rút khỏi boss; tướng "khôn" (Alice, Chrononeo, Raven, Lyra) tránh kẻ đang mang Long Hỏa ×1.9. Mang Minh Tướng → hổ báo ×2.0; mang Hồn Thần / Niết Bàn → không rút lui (hổ báo ×1.5). Có Ý Chí thì mở màn bằng đòn mạnh nhất.');
p('- **Né cảnh báo**: hình chữ nhật / hình nón → né ngang; vòng tròn quanh boss → lướt / dây móc ra ngoài hoặc lùi; vành khăn (3–10 đv) → cách tâm ≤ 5 đv thì lướt vào tâm, xa hơn thì chạy ra ngoài 10 đv; vòng rơi bám theo người → chạy chéo. Dùng Lưu Vân / chiêu lướt / dây móc nếu có.');
p('');
p('## 9. Thính (tiếp tế)');
const D = C.DROP;
p(`- ${D.times.length} lần thính: ${D.times.map(mm).join(', ')}; báo trước ${D.warn}s (vị trí ngẫu nhiên theo hạt giống trong vòng bo kế tiếp, ai cũng thấy).`);
p(`- Mở thính: đứng trong ${D.r} đv, **một mình**, không trúng đòn trong 0.6s, không niệm chiêu, đủ ${D.open}s (bị gián đoạn thì tiến độ tụt dần).`);
p(`- Phần thưởng: ${D.gold} vàng, ${D.xp} KN, hồi ${D.heal * 100}% máu, **mảnh hồn Vàng** (2 lần thính cuối: 40% ra mảnh hồn **Đỏ**) và +2 bình máu. (GĐ8 thêm ý niệm vàng.)`);
p('');
p('## 10. Tầm nhìn');
p(`- Mỗi tướng chỉ thấy bằng mắt mình (mỗi tướng một phe): bán kính ${C.VISION.hero} đv (GĐ8: từ 12; vật triệu hồi ${C.VISION.pet}). Sương Đầm Lầy ×${MAP.BIOMES[1].fog}, tử khí ×${MAP.BIOMES[7].fog}. Đứng trong bụi thì người ngoài bụi không thấy, trừ khi trong ${C.BUSH_TRUESIGHT} đv.`);
p('- Nhận thức (Đọc Bản Đồ): đối thủ trong 13 đv biết ngay; xa hơn chỉ cập nhật sau độ trễ 0.25–1.75s, mỗi lần có thể bỏ sót. Nghe tiếng giao tranh trong 35–55 đv (theo Đọc Bản Đồ) dù không thấy.');
p('- **Người chơi thấy hết như trọng tài**: không sương mù, thấy cả vị trí trong bụi, ảo ảnh (đánh dấu ✦) và suy nghĩ của AI.');
p('');
p(`## 11. Tính cách tướng (GĐ7: ${Object.keys(G.PERSONALITY).length} tính cách, cố định theo tướng)`);
p('| Tính cách | Lối chơi | Độ hổ báo | Trọng số hành động | Chỉ số (nền 13) | Balo mong muốn | Tướng |');
p('|---|---|---|---|---|---|---|');
for (const [k, P] of Object.entries(G.PERSONALITY)) {
  const heroes = Object.entries(G.HERO_PERSONALITY).filter(([, v]) => v === k).map(([id]) => G.HEROES[id] ? G.HEROES[id].name : id);
  const st = P.stats ? Object.entries(P.stats).map(([a, v]) => `${G.SUMMONER_STAT_NAME[a] || a} ${v > 0 ? '+' : ''}${v}`).join(', ') : '-';
  const bg = P.bag ? Object.entries(P.bag).map(([a, v]) => `${G.CONSUMABLES[a] ? G.CONSUMABLES[a].icon : a}×${v}`).join(' ') : '-';
  p(`| ${P.icon} ${P.name} | ${P.desc} | ×${P.aggr} | ${Object.entries(P.w).map(([a, v]) => `${a} ×${v}`).join(', ')} | ${st} | ${bg} | ${heroes.join(', ')} |`);
}
p('');
p('**Hành động lớn riêng của tính cách mới** (src/sim/ai/persona.js — chỉ tính cách tương ứng mới chấm điểm được):');
for (const [k, A] of Object.entries(G.Persona.ACT)) p(`- ${A.icon} **${A.name}** (${k}, giữ tối thiểu ${A.hold}s)`);
p('- Các hành động "giữ vị trí" (hộ tống, giữ cứ điểm, chiếm chỗ cao, giăng mồi, bám mép bão, núp của Chuột Lũi / Hòa Bình) mạnh dần theo thời gian trận và giảm 40% khi tướng tụt cấp hơn mặt bằng 2 cấp — đầu trận vẫn phải ăn quái.');
p('- Dị giáo của Cuồng Tín: Death (cốt truyện bổ sung sau). Người được Vệ Sĩ Thầm Lặng bảo vệ: tạm thời là tướng có sức mạnh thấp nhất lúc đầu trận (chờ cốt truyện).');
p('');
p('## 12. Nhân vật (GĐ7: bỏ người triệu gọi)');
p(`- Mỗi tướng là một nhân vật cố định: ${G.SUMMONER_STATS.length} chỉ số bản lĩnh 1–20 (${G.SUMMONER_STATS.map((k) => G.SUMMONER_STAT_NAME[k]).join(', ')}) = nền 13 cộng/trừ theo tính cách (bảng trên); thành thạo tướng 80. Tên = tên tướng.`);
p('- Chỉ số quy về 0..1 rồi nhân hệ số thành thạo (0 → ×0.455, 70 → ×0.91, 100 → ×1.0). Sau phút 15 Thể Lực thấp làm các chỉ số khác giảm dần; mất bình tĩnh × (1 − 0.25 × mức).');
p('');
p('## 13. AI sinh tồn (2 tầng)');
p('- **Tầng chiến lược — Utility AI** (mỗi 0.3–0.5s; nguy cấp hoặc đang bị bo đốt thì quyết ngay): chấm điểm từng hành động bằng trung bình nhân các yếu tố (0..1), nhân trọng số tính cách × mất bình tĩnh × chuỗi hạ gục, cộng **động lực làm tiếp việc đang làm 0.35 + 0.1 × Kỷ Luật** (GĐ6b: từ 0.2 lên 0.45; quyết gấp thì một nửa), nhiễu ±(0.02 + 0.08 × mất bình tĩnh); **bốc ngẫu nhiên có trọng số** trong nhóm ≤ 0.12 dưới điểm cao nhất (nhiệt độ 0.03 + 0.05 × (1 − Kỷ Luật) + 0.06 × mất bình tĩnh); chưa đủ thời gian tối thiểu thì chỉ đổi khi việc mới hơn ≥ 0.45. Ghi 3 lựa chọn điểm cao nhất kèm lý do.');
for (const [k, A] of Object.entries(G.UtilityAI.ACT)) p(`  - ${A.icon} **${A.name}** (${k}, giữ tối thiểu ${A.hold}s)`);
p('  - Ăn quái: **lượng sức** — ước lượng máu sẽ mất để dọn bãi (máu quái ÷ sát thương mình × sát thương quái); không đủ 85% máu đang có thì bỏ qua; **đã đánh dở thì ăn cho hết bãi** (×1.5, giữ bãi đó). Bãi gần (≤ 70 đv), đang tới thì giữ ×1.3, có đối thủ quanh bãi ×0.55 mỗi người, 8 phút đầu ưu tiên bãi trong "lãnh địa" (quanh điểm xuất phát), bỏ bãi ngoài bo hiện tại / ngoài bo kế khi sắp co; đứng trong dây xích quái để quái không chạy về hồi máu.');
p('  - Đi săn: con mồi đã thấy ≤ 6s, ≤ 64 đv, tương quan **sức mạnh** ≥ 1.2, đứng lẻ; thù dai ×1.25, **KS: máu con mồi < 40% thì ×(1.3 + (0.4 − máu) × 2.5)**, truy nã ×1.3; giai đoạn nhân thẳng 0.2 → 1 (phút 4 → 25), mạng cuối ×0.8, còn ≤ 3 người ×0.5 (giữ hạng, chờ bo ép); kiên nhẫn 10–18s (Kỷ Luật) rồi chán.');
p(`  - Quyết đấu: tới cổng khi tự tin (sức mạnh so với người đã ghi danh, hoặc với đối thủ trung bình), máu ≥ 50%, kịp tới; thưởng lớn nên nhân ×1.9.`);
p('  - Kền kền: nghe/thấy hai người khác đánh nhau, đứng ở bụi gần đó, chờ hai bên còn trung bình < 45% máu (hoặc một bên < 30%) rồi vào dọn; thấy kẻ máu < 30% đang mải đánh người khác thì "cướp mạng".');
p('  - Tranh boss (đủ cấp + đồ, hoặc cướp boss < 35% máu), tranh thính (kịp tới, ít người tranh), chạy bo (lấy lớn nhất: đang ngoài bo / áp lực thời gian), núp (còn ≤ 6 người hoặc từ phút 15), hồi máu (chỗ nghỉ xa đối thủ, trong bo, ưu tiên bụi), đi shop (đủ tiền), rút lui (lấy lớn nhất: thế trận bất lợi / máu thấp / hết mana).');
p('- **Sức mạnh** (AI tự tính): sức mạnh = máu hiệu dụng (máu × giáp/kháng phép, cả khiên) × sát thương/giây (đánh thường + chiêu đã học, theo hồi chiêu) ÷ 100. Thế trận = tổng sức mạnh phe mình ÷ tổng sức mạnh đối thủ quanh đây (kẻ đang nhắm mình tính đủ, kẻ đang bận đánh người khác ×0.35, kẻ đang tiến về phía mình ×0.8, quái đang đánh mình tính theo cùng thang).');
p('- **Tầng chiến thuật** (mỗi nhịp nghĩ): né chiêu định hướng & vùng sắp trúng chiêu → đánh giá thế trận → chọn mục tiêu bằng điểm: **KS** (máu thấp: (1 − máu)^1.6 × (1.2 + Giao Tranh); hạ được ngay bằng một đợt dồn đòn +1.3), mỏng manh, đang đánh mình, **khó chịu**, thù dai, con mồi, cướp mạng → ngưỡng giao chiến (đầu trận 1.5, sau đó 1.1, mạng cuối 1.2; bị đánh thì luôn đánh trả) → vi mô giao tranh (thả diều, dụ đòn, đọc đòn) → bị đuổi thì chấm chạy / chiêu thoát thân / cắt đuôi qua bụi / quay lại đánh.');
p('- **Khó chịu**: bị đánh thì độ khó chịu với kẻ đánh tăng theo % máu mất × (1.3 − 0.6 × Tâm Lý), giảm dần ×0.985 mỗi nhịp nghĩ. Đã có mục tiêu thì **bám mục tiêu**; chỉ đổi khi kẻ khác làm mình khó chịu vượt ngưỡng 15 + 25 × Tâm Lý, hoặc có mạng ngon để cướp (≤ 15% máu / hạ được ngay).');
p('- **Đã vào trận là quyết đấu**: không còn buông vì "đánh lâu"; chỉ rút lui khi máu dưới ~10% (6–13% theo Kỷ Luật và độ hổ báo) mà thế trận < 1.05; vừa chạy vừa xả chiêu (khống chế, cấu rỉa, dồn sát thương), tầm xa vừa chạy vừa bắn trả, thoát được (> 9 đv) thì uống bình. **Truy đuổi tới cùng**: chỉ bỏ khi mất dấu > 1.5–3.5s, bị trả đòn quá đau (mất > 45% máu trong lúc đuổi mà máu thấp hơn con mồi 15%), hoặc 7s không rút ngắn được khoảng cách mà con mồi còn > 35% máu.');
p(`- **Phong cách đánh** theo tướng: ${Object.entries(G.FIGHT_STYLE).map(([k, S]) => `${S.icon} **${S.name}** (${S.desc}) — ${Object.entries(G.FIGHT_STYLE_BY_HERO).filter(([, v]) => v === k).map(([id]) => G.HEROES[id] ? G.HEROES[id].name : id).join(', ')}`).join(' • ')}.`);
p('- Thả diều: giữa hai phát bắn giữ đối thủ ở mép tầm (tầm − 0.45…0.75 đv theo Kỹ Năng Cá Nhân), đi vòng ngang đổi hướng mỗi 0.8–2s (gần quá thì lùi là chính), không thả diều ra ngoài bo; cận chiến áp sát thì dùng chiêu lướt né (25–85% theo Kỹ Năng Cá Nhân, mỗi 2s).');
p('- Chiêu: chiêu mở giao tranh dùng được bất cứ lúc nào đang đánh; không phí chiêu khống chế lên mục tiêu đang bị khống chế > 0.8s (chờ nối).');
p('- **Hộ vệ** (GĐ6c — Oktava của Aria, Lính Tinh Nhuệ của Victoria): ai đánh chủ (tướng, vật triệu hồi hay quái) thì hộ vệ nhắm ngay kẻ đó và đuổi tới khi chính nó cách chủ quá xa (Oktava 14 đv, lính 13 đv) hoặc chủ **thu hồi** (chủ rút lui / bỏ chạy, hoặc hộ vệ còn < 20% máu); kẻ khác đánh chủ trong khi mục tiêu cũ đã thôi đánh chủ > 3s thì đổi mục tiêu. Không ai đánh chủ thì phụ chủ đánh hoặc đi theo đội hình.');
p('- **Raven** (GĐ6c): biết vị trí một đối thủ ở xa (7–22 đv, thấy trong 8s gần nhất) mà không ai áp sát → tìm chỗ an toàn ngoài tầm đánh của đối thủ (tầm + 3.5, tối thiểu 10, tối đa 13.5 đv; có bụi thì núp bụi) → thả quạ Oca về phía đối thủ → đổi **súng ngắm**, đứng bắn qua tầm nhìn của quạ (ưu tiên kẻ bị quạ đánh dấu, máu thấp; xen Bắn Tỉa Xuyên Phá). Bị áp sát < 6.5 đv, bị tướng trong 10 đv bắn, máu < 30%, phải rút lui / chạy bo → đổi lại súng trường. Quạ Oca là vật bay có máu, đối thủ đứng gần (trong tầm đánh + 3 đv) mà không bận đánh tướng thì **bắn hạ quạ**.');
p('- Chiêu Utility (bản cũ, giữ nguyên): dùng chiêu lên quái, lướt để đi đường xa / vượt tường (gấp theo việc: chạy bo 1, tranh thính 0.9, tranh boss 0.85, đi săn 0.8…), chiêu thoát thân có điểm đáp tốt nhất (tránh đáp ngoài bo khi bo đang đốt).');
p('');
p('## 13b. Bình máu / mana (GĐ7b: 3 cỡ, hồi ngay, trúng đòn là ngắt)');
const PO = C.POTION, CO = G.CONSUMABLES;
p('| Bình | Giá | Uống mất | Hồi ngay khi uống xong |');
p('|---|---|---|---|');
for (const id of [...G.POT_IDS.hp, ...G.POT_IDS.mp, ...G.POT_IDS.ga]) p(`| ${CO[id].icon} ${CO[id].name} | ${CO[id].cost} | ${PO[id].drink}s | ${PO[id].amt * 100}% ${{ hp: 'máu', mp: 'mana', ga: 'Hộ Giáp' }[CO[id].pot]} tối đa |`);
p(`- Mang tối đa **${PO.cap} bình mỗi loại** (máu / mana / Hộ Vệ, mọi cỡ cộng lại; balo cấp 6 +${G.BAG.potBonus6}). Khởi đầu ${G.BAG.start.hp_m} Bình Máu Vừa + ${G.BAG.start.mp_m} Bình Mana Vừa (tướng dùng mana). Thính cho 2 Bình Máu To (không vượt giới hạn).`);
p(`- Lúc uống đi chậm ×${PO.move}, không đánh / không dùng chiêu. **Trúng đòn của đối thủ là hỏng lần uống** (không mất bình; bo và sát thương theo thời gian không ngắt) — trừ khi có mảnh hồn Tím "Cẩn Thận". Mảnh hồn Tím "Trợ Năng": hồi thêm ${PO.regen.k * 100}% lượng hồi trong ${PO.regen.over}s.`);
p('- AI chọn cỡ bình vừa đủ bù phần thiếu; đối thủ ở gần thì ưu tiên bình nhỏ (uống nhanh); vừa bị đánh (< 0.8s) thì chưa uống; uống khi không ai sắp với tới.');
p('');
p('## 13c. Ý Niệm & Mảnh hồn (GĐ8: 9 chỉ số cốt lõi × 6 bậc)');
const SO = C.SOUL, ST = G.SHARD_STAT;
p(`- **Ý Niệm = cấp vũ khí** (đổi màu vũ khí) **= số ô khảm mảnh hồn**: ${[1, 2, 3, 4, 5, 6].map((t) => `${G.YNIEM_NAME[t]} ${t} ô`).join(' → ')}; mỗi cấp +${C.YNIEM.dmg * 100}% sát thương. Ai cũng bắt đầu ở ${G.YNIEM_NAME[C.YNIEM.start]}. Đúc ở Thương Nhân: ${C.YNIEM.forge.map((g, i) => `${G.YNIEM_NAME[i + 1]} ${g}`).join(', ')} vàng (lên tới Đỏ). Thính cho Vàng, boss / thắng quyết đấu +1 cấp (tối đa Đỏ), rương ${C.CHEST.yniem * 100}% +1 cấp. **Rực Rỡ (6 ô)** chỉ từ Quái Thú Hoàng Kim / Kiếm Sư Vĩ Đại / Ý Niệm Hoàng Kim: Cộng Hưởng +${C.YNIEM.resonance * 100}% hiệu lực mọi mảnh đang gắn và mở thêm lựa chọn cây kỹ năng cấp ${G.TREE_EXTRA.join('/')} (mục 17).`);
p('| Bậc | Màu | Cần Ý Niệm | Sức mạnh |');
p('|---|---|---|---|');
G.SOUL_TIER.forEach((T, i) => { if (T) p(`| ${i} | ${T.name} | ≥ ${T.slots} ô | ×${T.pow} |`); });
p(`- **9 chỉ số cốt lõi**: ${['hp', 'ga', 'phys', 'mag', 'ms', 'cdr', 'ls', 'ten', 'crit'].map((k) => `${ST[k].icon} ${ST[k].name}`).join(' • ')} (May Mắn = 🎯 chí mạng + 🍀 đồ hiếm). Hồi chiêu trần 40%, Kháng Hiệu Ứng trần 60%, Hút Máu tính trên **mọi** sát thương (đánh thường 100%, chiêu đơn 60%, chiêu diện rộng 30%, không tính sát thương theo thời gian). Phụ: Xuyên Thủng / Chống Xuyên (mục 13i), tốc đánh, vàng, kháng bão, uống nhanh, dây móc.`);
p(`- **Gắn được = cấp Ý Niệm**, chỉ mảnh có bậc ≤ Ý Niệm; tự chọn mảnh mạnh nhất (bậc cao, có nội tại, hợp kiểu sát thương / súng / tầm đánh của tướng, **mảnh yêu thích** +0.6, **hợp lối build** +0.3 — mục 13l). Mảnh **thuần chỉ số** mạnh hơn về số; mảnh **cơ chế** có nội tại.`);
p(`- **GĐ9 — đổi mảnh thì mảnh cũ văng ra**: mảnh dùng được (bậc ≤ Ý Niệm) mà không còn ô → **văng ra đất** cạnh tướng (người khác nhặt được, chính người văng không nhặt lại); mảnh mới kém hơn mọi mảnh đang gắn cũng văng ra ngay. Chỉ mảnh **bậc cao hơn Ý Niệm** được cất túi chờ đúc vũ khí (tổng tối đa ${SO.carry} mảnh). Chỉ nhặt mảnh trên đất khi nhặt vào sẽ được gắn / cất.`);
p(`- Nguồn: quái (bãi nhỏ ${SO.campSmall * 100}%, bãi lớn ${SO.campBig * 100}%), rương ${C.CHEST.soul * 100}%, boss (Tím–Đỏ), thắng quyết đấu (Tím), thính (Vàng; 2 lần cuối có thể Đỏ). **Hoàng Kim chỉ từ boss.** May Mắn đẩy bậc rơi lên cao hơn.`);
p(`- **Bị hạ là RƠI TOÀN BỘ mảnh hồn** quanh xác (giữ nguyên mảnh), sau ${SO.orbDelay}s ai chạm (${SO.orbR} đv) thì nhặt; tồn tại ${SO.orbLife}s. AI có hành động 💠 Nhặt mảnh hồn.`);
p('- Đặc năng cũ (GĐ7b) giữ thành mảnh có tên:');
for (const [k, P] of Object.entries(G.SOUL_PERK)) p(`  - ${G.SOUL_TIER[P.tier].name} — ${P.icon} **${P.name}**: ${P.desc}`);
p(`- **Toàn bộ ${G.SHARD_LIST.length} mảnh hồn**:`);
p('| Mã | Tên | Bậc | Chỉ số | Nội tại |');
p('|---|---|---|---|---|');
for (const d of G.SHARD_LIST) p(`| ${d.id} | ${d.n} | ${G.SOUL_TIER[d.t].name}${d.boss ? ' (boss)' : ''} | ${Object.keys(d.st).filter((k) => ST[k] && k !== 'airDash').map((k) => ST[k].fmt(d.st[k])).join(', ').replace(/\|/g, '/')} | ${(d.d || '').replace(/\|/g, '/')} |`);
p('');
p('## 13i. Hộ Giáp & Xuyên Thủng (GĐ8)');
p(`- **Hộ Giáp** = thanh giáp phụ (màu bạc, trên thanh máu): ${C.GA.base} + ${C.GA.perLvl}/cấp + mảnh hồn / đồ. Gánh sát thương **trước máu**; **không tự hồi** — chỉ hồi bằng bình Hộ Vệ (nhỏ/vừa/lớn), lên cấp, hồi sinh. Sát thương bo / hiểm họa đi thẳng vào máu.`);
p('- **Xuyên Thủng X%**: X% sát thương đi thẳng vào máu, bỏ qua Hộ Giáp; **Chống Xuyên Y%** trừ thẳng vào Xuyên Thủng của kẻ đánh (100% = phải đánh vỡ hết Hộ Giáp mới chạm máu). Một số mảnh xé Hộ Giáp; vỡ giáp kích hoạt nội tại (Giáp Hoàng Kim: sóng đẩy lùi + miễn sát thương 1.5s).');
p('- AI: tướng có Xuyên Thủng ≥ 70% ưu tiên nhắm kẻ giáp dày; gặp đối thủ có Xuyên Thủng cao thì rút lui sớm hơn (+5% ngưỡng máu); máu hiệu dụng tính cả Hộ Giáp; uống bình Hộ Vệ khi giáp vỡ mà không ai sắp với tới.');
p('');
p('## 13e. Balo & vật phẩm dùng 1 lần (GĐ7)');
p(`- Balo cấp 1–5: ${G.BAG.slots.map((n, i) => `cấp ${i + 1}: ${n} ô`).join(', ')}; nâng ở Thương Nhân ${G.BAG.upgrade.slice(1).map((g, i) => `lên cấp ${i + 2} ${g}`).join(', ')} vàng (rương ${C.CHEST.bagUp * 100}% nâng miễn phí). Mỗi ô một loại, xếp chồng tới giới hạn. Hai vật phẩm cách nhau tối thiểu ${G.BAG.useGap}s.`);
p('| Vật phẩm | Nhóm | Giá | Chồng | Tác dụng |');
p('|---|---|---|---|---|');
for (const [k, I] of Object.entries(G.CONSUMABLES)) p(`| ${I.icon} ${I.name} | ${{ potion: 'bình', spell: 'phép bổ trợ cũ', tool: 'dụng cụ', charm: 'phù' }[I.group] || 'đặc biệt'} | ${I.cost} | ${I.stack} | ${I.desc} |`);
p('- AI dùng: thanh tẩy khi bị khống chế cứng; phù kháng độc khi đứng ngoài bo; hộ mệnh / lá chắn / hồi máu khi bị đánh mà máu thấp; bỏ chạy bị bám sát → dây móc / tốc biến / ẩn thân / thần tốc / tốc hành / kiệt sức; đánh nhau → thiêu đốt / trừng trị kết liễu, bom vào kẻ bị khống chế, kiệt sức kẻ đang thắng mình; trừng trị cướp boss; bẫy dưới chân khi bị đuổi hoặc trên lối vào chỗ núp; dịch chuyển về Thương Nhân khi xa bo và vắng người. Mua theo "balo mong muốn" của tính cách.');
p(`- **Rương đồ**: mỗi vùng ${C.CHEST.perRegion} rương lúc đầu + 1 rương trong mỗi nhà / đền / cao nguyên / tháp canh; mỗi ${C.CHEST.every}s thêm ${C.CHEST.wave} rương trong vòng bo kế tiếp (tới phút ${C.CHEST.until / 60}). Mở mất ${C.CHEST.open}s (đứng yên, bị đánh / khống chế thì hỏng): 2 vật phẩm ngẫu nhiên + ${C.CHEST.gold} vàng, ${C.CHEST.bagUp * 100}% nâng balo, ${C.CHEST.yniem * 100}% ý niệm +1. AI không mở rương khi vừa bị đánh hoặc có đối thủ trong 8 đv.`);
p(`- **May Mắn** (GĐ8): rương có thêm món (theo may mắn), ưu tiên món giá cao hơn; tỉ lệ ra mảnh hồn (${C.CHEST.soul * 100}%), nâng balo, ý niệm ×(1 + may mắn).`);
p('');
p('## 13f. Bản đồ sinh theo hạt giống (GĐ7)');
const MB = G.MAP;
p(`- Khung cố định (công bằng): ổ boss, vách núi ranh giới (có khe), ${MB.camps.length} bãi quái, ${MB.merchants.length} Thương Nhân, ${MB.spawns.length} điểm xuất phát, bụi gốc, tảng đá che giữa hai điểm xuất phát.`);
p(`- 5 vùng thường lấy ngẫu nhiên 5 trong 6 biome (xáo thứ tự): ${MB.BIOMES.filter((b) => !['ruins', 'tukhi', 'khidoc'].includes(b.key)).map((b) => `${b.icon} ${b.name} (${b.feat})`).join(' • ')}. Phế Tích luôn ở giữa.`);
p(`- **2 vùng đặc biệt** (GĐ8, cố định): ${MB.BIOMES.filter((b) => ['tukhi', 'khidoc'].includes(b.key)).map((b) => `${b.icon} **${b.name}** (${b.feat})`).join(' • ')}. Tử Khí: mỗi ~14s một đám mây tử khí ập xuống gần một tướng trong vùng (báo trước 1.5s): rút 1.5% máu/s + vết thương sâu trong 6s. Khí Độc: mỗi ~10s một ống xả / bồn khí phun độc (báo trước 1.2s): 2% máu/s trong 3s + chậm 20%; thùng độc nổ ra mây độc 5s; Chuột Đột Biến chết thì nổ.`);
p('- Mỗi vùng 6–8 công trình rút từ "túi" của biome (luôn có ít nhất 1 công trình đặc trưng), Phế Tích thêm 3–4: 🏠 nhà (cửa 1–2 phía), 🏛 đền đổ (cột góc + tường đổ dở), ⛰ cao nguyên (vách đá quanh, 1–2 dốc lên), 🗼 tháp canh (cao nguyên nhỏ 1 dốc), 🌉 cầu qua suối, hẻm núi (2 vách song song), ao bùn / mặt băng / cát lún, 💥 cụm thùng thuốc nổ, thân cây đổ, 🌬 cối xay gió, xương rồng, bụi rậm / ụ rơm thêm.');
p('- Kiểm tra hợp lệ: công trình cách điểm xuất phát ≥ 11 + cỡ, bãi quái ≥ 6.5 + cỡ, Thương Nhân ≥ 10 + cỡ, công trình khác ≥ 3 đv, tường cũ; loang lưới 2 đv: mọi điểm xuất phát / bãi quái / Thương Nhân / trong nhà / trên cao nguyên phải đi tới được, vùng kín ≤ 40 ô; lưới tìm đường liên thông. Hỏng → thử hạt giống phụ (tối đa 6 lần) → bản đồ cổ điển.');
p(`- Địa hình: ${Object.values(MB.TERRAIN).map((t) => `${t.name} tốc chạy ×${t.ms}`).join(', ')} (Phù Thần Tốc miễn chậm). Sương mù Đầm Lầy: tầm nhìn ×${MB.BIOMES[1].fog}. Tường thấp (nước, thân cây, mép cao nguyên) chặn đi lại nhưng đạn bay qua.`);
p(`- **Độ cao**: đứng trên cao nguyên / tháp canh: tầm nhìn ×${C.HIGH.vis}; người dưới thấp chỉ thấy người trên cao khi trong ${C.HIGH.hide} đv; đánh từ trên xuống +${C.HIGH.dmg * 100}% sát thương. Lên bằng dốc hoặc dây móc.`);
p(`- **Thùng thuốc nổ**: trúng đạn, nằm trong chiêu diện rộng hoặc bị đánh trực tiếp → cháy ngòi ${C.BARREL.fuse}s rồi nổ bán kính ${C.BARREL.r} đv: tướng mất ${C.BARREL.dmg * 100}% máu tối đa (sát thương chuẩn, tính công kẻ kích nổ) và bị hất ${C.BARREL.knock} đv, quái mất ${C.BARREL.mon} máu; nổ dây chuyền thùng bên cạnh sau ${C.BARREL.chain}s.`);
p('');
p('## 13g. Liên minh tạm thời (GĐ7b)');
const AL = C.ALLY;
p(`- Hai tướng gặp nhau (trong 13 đv, cả hai còn ≥ 45% máu, không đang đánh nhau) từ giây ${AL.from} tới phút ${AL.until / 60} có thể kết liên minh ${AL.dur}s (mỗi tướng tối đa ${AL.perHero} lần, hỏi lại sau ${AL.askGap}s). Ai hay đề nghị / dễ nhận lời / dễ phản bội tùy tính cách; đang thù nhau thì không.`);
p('- Đồng minh: không cố ý nhắm nhau, không săn nhau, **chung tầm nhìn**, lao vào giúp khi đồng minh bị tướng khác đánh, cùng đánh mục tiêu của đồng minh, đi cùng nhau.');
p(`- **Sát thương vẫn gây lên nhau** (chiêu diện rộng, thùng nổ…): gây cho đồng minh ≥ ${AL.hitBreak * 100}% máu tối đa của họ thì liên minh vỡ. Tự tan khi hết hạn, khi một bên gục, hoặc khi còn ≤ ${AL.dissolve} người.`);
p('- Phản bội: khi đồng minh xuống dưới 25% máu (hoặc cúi xuống mở rương), mỗi bên "nổi lòng tham" một lần theo tính cách (Ngụy Quân Tử luôn luôn; Kẻ Bắt Nạt 60%, Kền Kền 50%…; Hòa Bình, Võ Sĩ, Vệ Sĩ, Cuồng Tín không bao giờ) → "Đâm sau lưng!", người bị phản bội thù 2 phút.');
p('');
p('- **GĐ9 — trao đổi**: hai đồng minh không đang đánh, ở gần (≤ 10 đv) thì mỗi ~18s cân nhắc: **đổi 1 mảnh hồn lấy 1 mảnh** khi cả hai cùng lợi (tính giá trị bộ mảnh: mảnh gắn tính đủ, mảnh cất 35%), **đổi 1 món balo** (món mình thừa mà bạn thiếu, đổi lại món bạn thừa mà mình thiếu), hoặc **mua bán bằng vàng** (mảnh gần như vô dụng với người bán — giá 40 × bậc² vàng; bình / vật phẩm thừa — giá gốc). Ở xa (≤ 80 đv) mà thấy có món đáng đổi → hẹn gặp, cả hai đi về phía nhau.');
p('- **GĐ9 — bịp (chỉ liên minh TẠM)**: kẻ ưa bịp (Ngụy Quân Tử 0.8, Quấy Nhiễu 0.6, Con Bạc / Kền Kền 0.4, Khát Nước / Thực Dụng / Mồi Câu 0.35…; Hòa Bình, Võ Sĩ, Vệ Sĩ không bao giờ) có thể **đổi gian** (rao mảnh của mình là hàng xịn, lấy mảnh tốt của bạn — mình lợi, bạn lỗ) hoặc **báo tin giả** (đứng gần rương / thính / mảnh hồn ngon thì hô "bên kia có của" chỉ bạn đi xa 42 đv để một mình ôm). Bạn nhìn thấu với xác suất 0.18 + 0.05 × (Tâm Lý − 11) + 0.03 × (Đọc Bản Đồ − 11) (5–75%): nhìn thấu → từ chối, thù, có thể cắt liên minh; bị lừa → mất mảnh / chạy tới chỗ trống, sau đó **vỡ lẽ** (tới nơi thấy trống, hoặc 25–60s sau nhận ra mảnh dỏm) → thù 2 phút, liên minh vỡ. Liên minh **lâu dài** (người của nhà cái — GĐ9b) luôn đổi thật, được cho không bình máu.');
p('- **GĐ9 — trao đổi theo tính cách**: ⚖ **Thương Nhân** (Roxie) và 🎭 **Kẻ Bịp Bợm** (Joker) gạ **đình chiến mua bán** 40s với BẤT KỲ AI gặp trên đường (≤ 18 đv, không đang đánh nhau); người kia nhận lời tùy tính cách (Hòa Bình / Thực Dụng 90%, Tham Farm / Con Bạc 75%, Võ Sĩ 20%, Cuồng Tín 10%…; ai từng bị lừa thì không tin nữa). Hai tính cách này mang **kho hàng** 4 mảnh (khởi đầu 2 mảnh Trắng/Xanh; mảnh thừa cất kho thay vì văng ra; nhặt mọi mảnh trên đất làm hàng). Thương Nhân: mua mảnh người ta không cần giá 60%, bán mảnh người ta cần giá 130%, bán vật phẩm balo thiếu giá 130%, **không bao giờ bịp**. Kẻ Bịp Bợm: **bán mảnh dỏm** (rao là bậc cao hơn một bậc, đòi giá bậc đó × 1.2), mua rẻ 35%, đổi gian, báo tin giả dụ người ta vào bẫy của mình; trong đình chiến mua bán gần như chắc chắn bịp (95%).');
p('');
p('## 13h. "Múa" — phối hợp chiêu (GĐ7b)');
p('- Đủ ≥ 2 chiêu tấn công lên mục tiêu → lên **chuỗi combo** theo thứ tự: lướt áp sát (nếu ngoài tầm) → khống chế → dồn sát thương / cấu rỉa → chiêu cuối (nếu đáng dùng); tối đa 4 bước. Giữa hai chiêu chen 1 đòn đánh thường nếu đòn đã sẵn và trong tầm. Khoảng nghỉ giữa các bước 0.08–0.3s theo Kỹ Năng; đang combo thì AI nghĩ mỗi nhịp (1/20s) và không chen việc khác; chiêu kế tiếp ngoài tầm thì áp sát chờ.');
p('- **Gom chiêu**: chỉ có 1 chiêu sẵn mà chiêu nối tiếp sắp hồi (≤ 1.2s) → giữ lại tối đa 1.2s để ra thành chuỗi (đối thủ còn > 25% máu, mình còn > 35%). Tướng lạ tay đôi khi không nối được chuỗi.');
p('- Hình: động tác riêng theo loại chiêu — lướt (thân lao tới, co giãn, bóng mờ nối đuôi), khống chế (giơ cao rồi đập xuống), chém xen kẽ trái–phải, đâm / giật súng, chiêu cuối xoay, hỗ trợ giơ vũ khí, thế thủ; thân người dồn theo đòn; hoàn thành chuỗi ≥ 3 bước hiện "✦ COMBO ×n".');
p('');
p('## 13d. Cổng quyết đấu (GĐ6b)');
const DU = C.DUEL;
p(`- Mở lần đầu lúc ${mm(DU.first)}, sau mỗi lần đóng/kết thúc ${DU.every}s lại mở (cần ≥ 3 người còn trong trận). Vị trí: trong vòng bo kế tiếp, **giữa hai tướng** (không sát ai), báo cho mọi người. Cổng mở ${DU.open}s.`);
p(`- Ghi danh: đứng trong ${DU.r} đv quanh cổng đủ ${DU.join}s (không bị đánh 0.6s, không niệm chiêu). Người thứ hai ghi danh → cả hai bị **kéo vào vòng quyết đấu** bán kính ${DU.ring} đv: người ngoài không vào được, không ai đánh được ai qua vòng, bo không đốt, quái không với tới; đánh tới khi một người gục (cả hai đánh hết mình, không bỏ chạy).`);
p(`- Thắng: ${DU.reward.gold} vàng, ${DU.reward.xp} KN, hồi ${DU.reward.heal * 100}% máu, mảnh hồn bậc ${DU.reward.soul}. Quá ${DU.max}s: vòng siết lại, đốt cả hai ${DU.burn * 100}% máu tối đa mỗi giây.`);
p('');
p('## 13j. Súng, đạn & nạp đạn (GĐ9 — theo bản Di sản)');
{
  const GUN = Object.keys(G.HEROES).filter((id) => G.HEROES[id].gun), cfg = G.arenaConfig('tk-gun');
  GUN.forEach((id, i) => { cfg.picks[i] = { hero: id, player: G.heroChar(id) }; });
  const gm = new G.Match(cfg); gm.step();
  p('| Tướng | Băng đạn | Nạp gốc | Ghi chú |');
  p('|---|---|---|---|');
  for (const id of GUN) { const u = gm.heroes.find((h) => h.heroId === id), g = u.hero.gun(gm, u); p(`| ${G.HEROES[id].name} | ${g.max}${g.alt ? ` (+ ${g.alt.max} dạng phụ)` : ''} | ${f1(g.rlMax)}s | ${g.shell ? 'nạp từng viên' : 'nạp cả băng'} |`); }
}
p('- **Thời gian nạp** T = T_gốc / (1 + Tốc Đánh cộng thêm + Tốc Nạp). Tốc đánh cộng thêm = phần vượt tốc đánh nền của tướng (đồ, mảnh hồn, bùa…). **Khóa nạp** (Reload Lock — ví dụ thế đứng tại chỗ) bỏ qua tốc đánh, chỉ tính Tốc Nạp.');
p('- Mảnh hồn Nạp Đạn (19) và Tốc Đánh (10): thêm Tốc Nạp, băng đạn (+%), nạp lại khi lướt / hạ gục / dùng chiêu, đạn đầu băng mạnh hơn… (bảng mục 13c, mã *_RL_* / *_AS_*). Mảnh nạp đạn chỉ hợp tướng súng (tướng khác ít khi ra, ×0.3 điểm gắn).');
p('- AI: hết đạn mà đang nạp → có Xả Chiêu Tiếp Đạn thì xả chiêu trước (nạp 50% băng); có cận chiến áp sát hoặc có Tĩnh Tâm thì lùi ra né đòn khi nạp.');
p('- **Gideon** (GĐ9): Đại Trường Kiếm — tầm đánh thường 2.7, **tốc đánh cố định** (không đổi theo đồ), mọi tốc đánh cộng thêm chuyển thành % sát thương đòn đánh. **Raven** (GĐ9): súng trường 30 viên khi thả diều; ống ngắm bắn rất xa (45 đv khi quạ Oca còn sống — Oca thấy mục tiêu là bắn được, 7.5 đv khi mất Oca), Oca tự bay xa tìm con mồi máu thấp; mục tiêu ngoài tầm ngắm → dời chỗ bắn.');
p('');
p('- **GĐ12 — nạp đạn không tức thì**: vừa bắn phải chờ 1s (đang giao tranh trong 3s: 1.6s; có Tốc Nạp: −0.4s) mới bắt đầu nạp; **trúng đòn từ tướng / vật triệu hồi khi đang nạp → ngắt**, lần nạp đang chạy quay về đầu (Clint nạp từng viên: viên đang nạp quay về đầu). Áp cho Zero, Clint, Jack, Chrono & Neo, Raven, Dr. Vector.');
p('');
p('## 13k. Nhận thức: tầm nhìn, thính giác, truy vết (GĐ9)');
p('- **Tầm nhìn** = gốc × (1 + % tầm nhìn từ mảnh hồn, tối đa +100%); mảnh "không sương" bỏ hệ số sương / đêm; Nguyệt Thực thu hẹp tầm nhìn đối thủ; Phá Ảo Chân Thị miễn mù. Một số mảnh cho **thấy riêng** một đối thủ trong vài giây (đánh dấu).');
p('- **Thính giác**: nghe tiếng giao tranh trong 30 đv, tiếng lướt / chiêu di chuyển 18 đv, tiếng bước chân ngoài bụi 9 đv (× (1 + 0.25 × Đọc Bản Đồ)); mảnh Phá Sóng Nhiễu Loạn làm bước chân câm. Nghe thấy → nhớ vị trí có sai số 3 × (1 − Đọc Bản Đồ) đv.');
p('- **Truy vết**: mất dấu mục tiêu khi đang đánh / đang săn → đi tới vị trí cuối cùng + ngoại suy theo vận tốc lúc mất dấu, kiểm tra bụi gần đó; tối đa vài giây rồi bỏ.');
p('- Utility dùng mảnh Tầm Nhìn: Nhiệt Ảnh / Thấu Thị Thảo Mộc nâng điểm "kết liễu" lên 2.0 với mục tiêu < 40% máu; Tiên Tri Vòng Bo bỏ farm, chiếm tâm bo sớm 45s; mảnh Tầm Đánh nới khoảng thả diều và tăng điểm cấu rỉa.');
p('');
p('## 13l. Lối build ưa thích & mảnh hồn yêu thích (GĐ9)');
p('- Mỗi tướng có **3 lối build sở trường**; mỗi trận chọn 1 theo hạt giống (45% / 33% / 22% — lối đầu hay được chọn nhất). Lối build quyết định thứ tự mua đồ (vẫn đổi món theo đội hình địch như cũ) và các chỉ số mảnh hồn tướng ưu tiên gắn. Ngoài ra mỗi tướng có 3 **mảnh hồn yêu thích** (đi nhặt mảnh yêu thích dù xa hơn).');
p(`- **Cầu Toàn** (tính cách GĐ9): luôn theo lối build số 1, không đổi món theo đối thủ; mảnh yêu thích +2.5 điểm, hợp build +0.9, lạc bộ ×0.6; săn mảnh yêu thích trên đất (×3 giá trị); độ hăng ×(0.8 + 0.45 × mức hoàn thiện bộ). **Bình Thường**: không luật riêng (mặc định cho tướng chưa khai báo tính cách).`);
p('| Khuôn build | Giày | Thứ tự 5 món | Chỉ số mảnh ưu tiên |');
p('|---|---|---|---|');
for (const [k, T] of Object.entries(G.BUILD_T)) p(`| ${T.name} | ${G.ITEMS[T.boots].name} | ${(T.start ? [T.start] : []).concat(T.core).map((id) => G.ITEMS[id].name).join(' → ')} | ${T.st.map((s) => (ST[s] ? ST[s].name : s)).join(', ')} |`);
p('');
p('| Tướng | 3 lối build | Mảnh hồn yêu thích |');
p('|---|---|---|');
for (const id of Object.keys(G.HEROES).sort()) p(`| ${G.HEROES[id].name} | ${G.buildsOf(id).map((b) => b.name).join(' / ')} | ${G.favShards(id).map((s) => (G.SHARDS[s] ? `${G.SHARDS[s].n} (${G.SOUL_TIER[G.SHARDS[s].t].name})` : s)).join(', ')} |`);
p('');
p('## 13m. Bộ não chiến đấu (GĐ11 — src/sim/ai/combat_brain.js)');
p('Lớp vi thao tác chạy trên nền Utility AI, giúp mỗi tướng **dùng tối đa bộ chiêu của mình** và đánh như người thật:');
{
  let nS = 0; const cnt = {};
  for (const h of Object.values(G.HEROES)) for (const k of ['s1', 's2', 's3', 's4', 'sub']) { const d = h.skills[k]; if (!d) continue; nS++; const t = G.Brain.tax(d, k); for (const s of Object.keys(t.sub)) cnt[s] = (cnt[s] || 0) + 1; }
  const NM = { BurstDamage: 'Bộc phá', ExecuteDamage: 'Kết liễu', EscapeDash: 'Lướt thoát', GapCloser: 'Lướt áp sát', SkillshotDodge: 'Né chiêu', HardCC: 'Khống chế cứng', SoftCC: 'Khống chế mềm', Knock: 'Đẩy / hất văng', ShieldBarrier: 'Khiên / giáp ảo', ProjectileParry: 'Chặn / nuốt đạn', MeleeRiposte: 'Phản đòn cận chiến' };
  p(`1. **Phân loại kỹ năng** (Skill Taxonomy): mỗi chiêu được gắn nhóm Damage / Mobility / CrowdControl / Defense / CounterParry và vai phụ, suy ra tự động từ dữ liệu chiêu (chiêu có thể ghi đè bằng \`def.tax\`). Hiện có ${nS} chiêu: ${Object.keys(NM).filter((k) => cnt[k]).map((k) => `${NM[k]} ${cnt[k]}`).join(' • ')}.`);
}
p('2. **Kỷ luật bình máu** (Consumable Sanity): khóa uống bình máu / Hộ Vệ khi — đang ngoài bo; đang Solo mà đối thủ còn > 2s khống chế; vừa bị tướng đánh trong 3s; có kẻ địch nhìn thấy mình trong tầm đe dọa mà không có vật cản; kẻ địch trong 12 đv. Chỉ uống khi đã cắt tầm nhìn / nấp sau vật cản / đủ xa (ghi lý do vào thẻ tướng).');
p(`3. **Đường Cùng Phản Sát** (Last Stand): máu < 25%, kẻ đuổi trong 9 đv nhanh hơn mình (hoặc xạ thủ bám tầm), không có bụi / chiêu thoát / vật cản → quay đầu khô máu 3.5s thay vì chạy làm bia.`);
p('4. **Suy luận hướng đòn & trả đũa** (Damage Inference): mỗi đòn trúng ghi lại kẻ đánh và hướng (cận chiến chính xác, tầm xa lệch ±5°, bẫy/vùng = môi trường). Bị đánh từ góc khuất → xoay mặt về hướng đó; có chiêu định hướng thì **bắn trả mù** dọc trục đạn; tướng mỏng lách ngang / tìm bụi; kẻ vừa đánh lén được +1.0 điểm chọn mục tiêu.');
p('5. **Chống thả diều** (Anti-Kite): cận chiến bị đánh từ xa, đối thủ lùi, ngoài tầm → dùng chiêu **Lướt áp sát** chéo 45° (né trục đạn) hoặc đón đầu, vừa tới nơi thì nối ngay khống chế; hết chiêu thì zíc-zắc vào bụi, không chạy thẳng.');
p('6. **Solo 1v1 FSM**: NEUTRAL → ENGAGE → RESET → EXECUTE; lực hút về tâm sàn khi quá 70% bán kính (không bị dồn góc), lực tách thân (không chồng lên nhau), luôn quay mặt về đối thủ; tầm xa bị dồn thì dùng chiêu thoát.');
p('7. **Ép bo** (Zone Warfare): khóa chân kẻ đang ngoài bão bằng khống chế (giữ chúng ngoài bão 2–3s); **gác cổng** — đứng mép trong, không bước ra ngoài đánh; **ring-out** — kẻ địch < 6 đv sát mép thì vòng ra phía trong rồi dùng chiêu đẩy/hất văng ra ngoài bo; ngoài bo máu thấp thì **cấm đứng uống bình**, dùng mọi chiêu cơ động chạy vào.');
p('8. **Liên minh vĩnh cửu** (mục 13o): bạn đang đánh nhau trong 35 đv → tới bọc lót (Luca mở Sân Khấu chia lửa), rảnh thì đi cùng nhau cách 3–6 đv.');
p('9. **Luật Snapback chung** (chiêu "dùng lại để về điểm neo": Luca S3, Kip S1/S2…): đang ngoài bo mà điểm neo trong bo → giật về; máu < 40% vừa trúng đòn và điểm neo xa kẻ địch hơn → giật về; bị đuổi sát lúc sắp hết hạn → giật về; còn lại **không phí** (để hết hạn). Luca S4 chỉ đổi chỗ khi có lợi (ring-out, có nhánh choáng, hoặc nạn nhân đứng xa).');
p('10. **Canh boss theo tính cách**: cả lò ai cũng biết **cửa sổ kết liễu** — sát thương sẵn sàng (×0.8) + Trừng Phạt ≥ máu boss → xả hết kể cả chiêu cuối. Có người khác tranh boss: 🦅 Kền Kền / Ngụy Quân Tử / Gieo Hỗn Loạn đứng ngoài dây xích chờ boss < 20% mới lao vào cướp; Ám Sát / Bắt Nạt / Võ Sĩ / Trảm Tướng / sát thủ quay sang đánh kẻ tranh boss đang < 55% máu.');
p('11. **Kỷ luật âm thanh khi farm**: có tướng địch trong 35 đv (thấy hoặc vừa nghe tiếng) → khi farm không đốt chiêu lướt / chiêu áp sát lên quái và giữ mana ≥ 40% cho giao tranh sắp tới.');
p('12. **Gắn hành vi theo nhánh tiến hóa** (Behavior Binding): nhánh có "sau lưng / đánh lén" → cận chiến đi vòng ra sau mục tiêu; "đỡ đòn / phản đòn / thế thủ" → luôn đọc đòn để phản kể cả khi đang khô máu; "mũi kiếm / điểm ngọt / cự ly" → giữ đúng cự ly ngọt; "kết liễu / máu thấp" → +0.8 điểm cho mục tiêu < 35% máu; "không bị ngắt / gồng" → không tự hủy chiêu.');
p('13. **Ảo ảnh lừa đảo** (src/sim/decoy.js): chủ đang bỏ chạy (máu < 35%) → ảo ảnh chạy hướng ngược lại, lạng lách kéo kẻ đuổi đi sai đường; ảo ảnh < 40% máu → giả vờ tháo chạy như tướng thật sắp chết; còn lại đánh kẻ gần nhất nhưng lạng trái/phải giữa hai đòn.');
p('');
p('## 13p. Chiến thuật AI GĐ12 (src/sim/ai/tactics12.js)');
p(`- **Pháp Sư Sát Thủ** (phong cách "Sát thủ phép": ${Object.keys(G.FIGHT_STYLE_BY_HERO).filter((k) => G.FIGHT_STYLE_BY_HERO[k] === 'assassin').map((k) => G.HEROES[k].name).join(', ')} — bỏ nhãn thả diều): đọc vị mục tiêu thành **Máu Giấy** (tầm xa / pháp sư / xạ thủ), **Trâu Bò** (đấu sĩ cận chiến, đỡ đòn, giáp + kháng > 120, máu > 2600 hoặc Hộ Giáp > 25%) hoặc **Hỗ Trợ**.`);
p('  - Máy trạng thái 4 bước: **POKE_AND_BAIT** (cấu rỉa / dụ đòn) → **DIVE_ENGAGE** (lướt áp sát bằng chiêu tiếp cận, đón đầu 0.3s) → **BURST_EXECUTE** (khống chế cứng trước rồi dồn sát thương & chiêu cuối, tối đa 2.5s) → **TACTICAL_BAIL** (giật về điểm neo / lướt thoát 1.2–2s) → lại POKE khi có ≥ 1 chiêu sát thương.');
p('  - Máu Giấy: **Dive-and-Bail** — lao khi có ≥ 2 chiêu sát thương + chiêu tiếp cận, quanh mục tiêu ≤ 1 kẻ địch khác, máu mình > 40%. Trâu Bò: **Kite-to-Execute** — chỉ thả diều cấu rỉa ở mép tầm, all-in khi mục tiêu ≤ 35% máu hoặc máu ≤ 90% sát thương combo.');
p('  - **Cửa sổ hụt chiêu**: kẻ địch vừa tung chiêu cuối / chiêu hồi ≥ 9s mà không trúng tướng nào trong 1s → trong 3s nó là mục tiêu ưu tiên ×2, sát thủ lao vào ngay (2–4s).');
p('- **Ngắm**: chiêu định hướng bắn **đón đầu** theo vận tốc (thời gian bay tối đa 1.4s, độ chính xác 80–100% theo Kỹ Năng Cá Nhân) cộng **sai số người thật ±0.2–0.6 đv**. **Check bụi**: vừa mất dấu < 3s, vị trí cuối sát bụi → ném một chiêu rẻ (không phải chiêu cuối / chiêu cơ động, còn ≥ 35% mana) vào bụi. **Chiêu vu vơ**: đối thủ đứng 6–9 đv chưa giao tranh → mỗi 4s có 3–5% tung chiêu cấu đón đầu.');
p('- **Tường sau lưng**: khi lùi / thả diều quét 3 tia (thẳng, ±30°) dài tới 3 đv; tia giữa chạm tường → **trượt theo tiếp tuyến** sang phía trống. **Kẹt góc** (cả 3 tia chạm tường, kẻ địch ≤ 4.5 đv) → **lướt xuyên qua kẻ địch** sang phía sau nó; không có chiêu lướt → Tử Thủ.');
p('- **Lướt vừa đủ**: đang trong vùng cảnh báo thì chỉ lướt tới mép vùng + 0.8 đv; đường lướt (không vượt tường) đụng tường → dừng trước tường 0.5 đv.');
p('- **Kỷ luật bỏ chạy**: ngưỡng bỏ chạy bị kẹp 5–10% máu (tướng mỏng — xạ thủ, hỗ trợ, máu < 1400: 8–14%; tính cách hèn — Chuột Lũi, Hòa Bình, Thoát Xác, Đổi Mạng, Cầu Toàn: 10–25%). Đang chạy mà **kẹt góc**, hoặc **vừa bị chính kẻ đuổi đánh trong 2s + kẻ đuổi nhanh hơn + hết chiêu thoát** → **TỬ THỦ ALL-IN 3.5s**: khống chế cứng trước → dồn sát thương / chiêu cuối → đánh thường + trang bị.');
p('- **Hoán vị**: snapback né chiêu lớn — đứng trong vùng cảnh báo sắp nổ (< 0.7s) mà điểm neo ở ngoài → giật về ngay; vừa đổi chỗ xong (Mirage S2, Luca S4) → 1.2s **đâm sau lưng** nạn nhân đang mất phương hướng; Mirage phân thân chọn ảo ảnh XA kẻ địch nhất; ring-out (Luca) giữ từ GĐ11.');
p('- **Kazuki** chọn nhịp 2 chữ trước Kiếm Thế Quyết: **AA** khi ≥ 2 kẻ địch sát bên (xoay), **BA** khi đối thủ hút máu / đang hồi máu (Vết Thương Sâu), **AB** khi cần choáng (đối thủ niệm chiêu, bỏ chạy, máu cao), còn lại **BB**. **Ryoma** ghép cặp: **BB** (choáng) khi đối thủ niệm chiêu / sắp chết, **BC** (dư ảnh lao tới) khi mục tiêu > 3.5 đv, **CC** (gió xoáy làm chậm) khi máu thấp / gặp tướng tầm xa; Kiếm Khí chém nát đạn đang bay tới.');
p('- **Dahlia** < 25% máu bị áp sát → Thoát Nguy đổi chỗ với quái / ảo ảnh XA kẻ địch nhất; đang mở Sân Khấu → kéo giao tranh về trong vòng. **Luca** đang Sân Khấu → lách vào trong vòng, Bước Nhảy liên hoàn; cải trang: vừa dùng khống chế cứng mượn → lật về bộ chiêu Luca mở Sân Khấu, vừa dùng khiên mượn → Ánh Đèn; 13.5–14s: điểm gốc an toàn thì chủ động giật về, nạn nhân < 20% máu thì ở lại kết liễu.');
p('- **Va chạm**: tướng, quái, vật triệu hồi không lồng vào nhau (khoảng cách tối thiểu 97% tổng bán kính, đẩy 80% phần chồng mỗi bước, nặng nhẹ theo khối lượng) + lực trượt ngang cho bên đang di chuyển để lách qua nhau thay vì dính chùm; sau đẩy luôn đẩy ra khỏi tường.');
p('- **Ảo ảnh** (mọi tướng): bước theo đường định sẵn, gặp tướng địch trong tầm đánh + 1.5 đv thì bỏ đường quay sang đánh; giữa hai đòn **đánh-rồi-lùi** (ảo ảnh cận chiến lùi ra mép tầm + 1 đv, lạng ngang).');
p('');
p('## 13n. Bo độc nâng cấp: Ăn Mòn & Vết Thương Sâu (GĐ11)');
p(`- **Ăn Mòn**: mỗi 1s ở ngoài bo +1 tầng (tối đa ${C.CORROSION.max}); mỗi tầng thêm ${pc(C.CORROSION.per)} máu tối đa **sát thương chuẩn mỗi giây** (cộng với sát thương bo thường). Chỉ xóa sạch khi ở trong bo liên tục > ${C.CORROSION.clear}s.`);
p(`- **Vết Thương Sâu**: ngoài bo mọi hồi máu (bình, hút máu, chiêu hồi) **giảm ${pc(C.GRIEVOUS)}** → uống bình ngoài bo gần như phí; AI biết điều này (mục 13m.2, 13m.7).`);
p('');
p('## 13o. Quan hệ cốt truyện & liên minh vĩnh cửu (src/data/relations.js)');
p('- **friend**: không ra tay trước (chỉ đánh trả khi bị chính họ đánh); còn ≤ 3 người thì tình bạn nhường chỗ cho ngôi vô địch. **protect**: ai đánh người này (≤ 4s) bị ưu tiên trừng phạt (+2.2 điểm). **hate**: cộng điểm ưu tiên tiêu diệt. **line**: câu thoại khi lần đầu chạm mặt.');
p('- **eternal — liên minh vĩnh cửu** (GĐ11): không bao giờ đánh nhau, không săn nhau, không làm kền kền nhau, chung phe "đồng minh" cho mọi chiêu hỗ trợ; tới bọc lót khi người kia giao tranh trong 35 đv; **chỉ khi còn đúng 2 người** mới phân thắng bại.');
p('| Tướng | Bạn | Bảo vệ | Vĩnh cửu | Thù (hệ số) |');
p('|---|---|---|---|---|');
for (const [id, r] of Object.entries(G.RELATIONS)) { const nm = (x) => (G.HEROES[x] ? G.HEROES[x].name : x); p(`| ${nm(id)} | ${(r.friend || []).map(nm).join(', ') || '—'} | ${(r.protect || []).map(nm).join(', ') || '—'} | ${(r.eternal || []).map(nm).join(', ') || '—'} | ${Object.entries(r.hate || {}).map(([k, v]) => `${nm(k)} ${v}`).join(', ') || '—'} |`); }
p('');
p('## 14. Trang bị');
p(`- ${G.ITEM_LIST.length} món hoàn chỉnh, tối đa ${G.ITEM_SLOTS} ô. Mỗi món có phôi (40% giá, 40% chỉ số). **Chỉ mua được ở Thương Nhân** (AI tự đi shop khi đủ tiền). Bán lại 50%.`);
p('| Món | Loại | Giá | Chỉ số / hiệu ứng |');
p('|---|---|---|---|');
for (const it of G.ITEM_LIST) p(`| ${it.name} | ${it.cat} | ${it.cost} | ${(it.statText || '').replace(/\|/g, '/')}${it.desc ? ' — ' + it.desc.replace(/\|/g, '/') : ''} |`);
p('');
p('## 15. Khung chỉ số tướng (cấp 1 / tăng mỗi cấp)');
p('| Khung | Máu | Hồi máu | Mana | Hồi mana | Công | Giáp | KP | Tốc đánh | Tốc chạy | Tầm |');
p('|---|---|---|---|---|---|---|---|---|---|---|');
for (const [k, b] of Object.entries(G.H.BASE)) p(`| ${k} | ${b.hp}/+${b.hpG} | ${b.hpr}/+${b.hprG} | ${b.mp}/+${b.mpG} | ${b.mpr}/+${b.mprG} | ${b.ad}/+${b.adG} | ${b.armor}/+${b.armorG} | ${b.mr}/+${b.mrG} | ${b.as}/+${b.asG * 100}% | ${b.ms} | ${b.range} |`);
p('');
p(`## 16. Tướng (${Object.keys(G.HEROES).length})`);
p('Mỗi trận chọn ngẫu nhiên 10 tướng khác nhau theo hạt giống. Chiêu giữ nguyên bộ chiêu bản cũ.');
for (const h of Object.values(G.HEROES).sort((a, b) => a.id.localeCompare(b.id))) {
  const b = h.base, P = G.personalityOf(h.id);
  p('');
  p(`### ${h.name} (${h.id}) — ${P.icon} ${P.name}`);
  p(`- ${h.ranged ? 'Tầm xa' : 'Cận chiến'} • vũ khí: ${h.gfx} • tài nguyên: ${h.resource === 'mana' ? 'mana' : 'không dùng mana'} • sát thương chính: ${h.dmgType === 'magic' ? 'phép' : 'vật lý'}`);
  p(`- Chỉ số cấp 1: máu ${b.hp} (+${b.hpG}), mana ${b.mp || 0} (+${b.mpG || 0}), công ${b.ad} (+${b.adG}), giáp ${b.armor} (+${b.armorG}), KP ${b.mr} (+${b.mrG}), tốc đánh ${b.as} (+${f1((b.asG || 0) * 100)}%), tốc chạy ${b.ms}, tầm ${b.range}`);
  p(`- **Nội tại — ${h.passive.name}:** ${h.passive.desc}`);
  for (const k of ['s1', 's2', 's3', 's4', 'sub']) {
    const s = h.skills[k]; if (!s) continue;
    const lab = k === 'sub' ? 'Skill phụ' : k.toUpperCase();
    p(`- **${lab} — ${s.name}** (hồi ${arr(typeof s.cd === 'function' ? s.cdText : s.cd)}s${s.cost ? `, ${arr(s.cost)} mana` : ''}): ${s.desc}`);
  }
}
p('');
p('## 17. Cây tiến hóa');
p(`- Mở nhánh ở cấp ${G.TREE_TIERS.join('/')}, mỗi mốc 1 trong 3 (a/b/c); AI tự chọn (ngẫu nhiên theo hạt giống trận).`);
p(`- **Rực Rỡ** (GĐ8, cần Ý Niệm Rực Rỡ): cấp ${G.TREE_EXTRA[0]} lấy thêm 1 lựa chọn chưa chọn ở mốc 3/6/9; cấp ${G.TREE_EXTRA[1]} lấy thêm 1 lựa chọn mốc 12 hoặc ${Object.values(G.TREE_GEN).map((g) => `**${g.name}** (${g.desc})`).join(' / ')}.`);
for (const h of Object.values(G.HEROES).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!h.tree) continue;
  p(`- **${h.name}**: ` + h.tree.map((row, i) => `${G.TREE_TIERS[i]}: ${row.map((x, j) => 'abc'[j] + '. ' + x.name).join(' / ')}`).join(' • '));
}
p('');
p('## 19. Nhà cái & đặt cược (GĐ9b — vòng chơi chính)');
{
  const BT = G.BET, QQ = G.BET_Q, FI = G.BET_FINE, CHs = G.CHARMS;
  p(`- **Ván (run)**: bắt đầu với ${BT.startMoney} tiền; ${BT.stages.length} chặng × ${BT.perStage} trận; hết chặng phải **có** ${BT.stages.map((x) => x.quota).join(' / ')} tiền (thiếu → vỡ nợ, thua ván)${BT.installment ? `; chặng giữa nộp góp ${BT.installment * 100}%` : ''}; chặng cuối trả hết nợ (${BT.stages[BT.stages.length - 1].quota} + mọi khoản vay) → tự do; nhưng nếu nhà cái bực ≥ ${BT.angryEnd} thì phải qua **trận của nhà cái** (đủ 4 người của hắn trong trận, kết thúc trận phải còn ≥ ${BT.finalNeed} tiền).`);
  p(`- **Tỷ lệ**: xác suất gốc từ thống kê mô phỏng (src/data/odds.js — tools/tyle.js: Top 1 = (số lần vô địch + 1) / (số trận + 10), chuẩn hóa trong dàn 10 tướng); tỷ lệ trả = (1 − phần nhà cái) / xác suất, làm tròn 0.05, trong khoảng ×1.05–×30. Phần nhà cái = ${BT.margin * 100}% + 1.5% × mức bực bội + 10% khi dính "Món Quà Nhỏ" + 5% trong 60s sau một lần can thiệp. "Sống tới cuối" tính xác suất ×1.12 (đồng hạng vẫn thắng) nên tỷ lệ thấp hơn "Top 1".`);
  p('- **Nhà cái nói dối (nhưng công bằng)**: sức mạnh ước lượng sai số ±15% (Mắt Mờ ±30%, Kính Lúp 0); mỗi trận **thổi phồng** một tướng cửa dưới không phải người của mình (sức mạnh ×1.5, tỷ lệ ×0.8 — trông như cửa trên); 3 tin đồn trước trận có tin giả; người của nhà cái được rút ngắn tỷ lệ ×0.75 (chưa đủ bù lợi thế liên minh). Sau mỗi trận **nhật ký nhà cái** ghi rõ: ai là người của nhà cái, ai bị thổi phồng, tin đồn nào giả.');
  p(`- **Câu đầu trận** (chọn 1): ${['survive', 'top1', 'top3'].map((k) => `${QQ[k].icon} ${QQ[k].name}`).join(' • ')}. Top 3: đúng cả 3 đúng thứ tự ×6, đúng 2 vị trí ×3, đủ 3 người sai thứ tự ×2, đúng 1 vị trí ×1 (hoàn tiền); hệ số ×(0.3 ÷ xác suất top 3 trung bình của 3 người chọn, trong 0.5–2.5); chọn toàn 4 cửa trên → ×0.5 và nhà cái bực. Top 1 luôn kèm điều khoản: "${FI.top1.solo}"`);
  p(`- **Giao Kèo** (mời ở câu đầu): đặt một khoản; mọi câu còn lại trong trận phải đúng (bỏ qua cũng là sai, kèo bị hủy thì không tính); hết trận trọn vẹn → nhận ×10 khoản đó + toàn bộ tiền thắng các câu trong giao kèo (giữ lại tới cuối trận). Sai một câu → mất khoản giao kèo + tiền thắng đang giữ. Không hủy được.`);
  p(`- **Câu hỏi giữa trận** (trận tạm dừng): sớm nhất giây ${BT.midFirst}, cách nhau ≥ ${BT.midGap}s, tối đa ${BT.midMax} câu/trận (mỗi loại tối đa: Ai thắng 3, Kền kền 2, Ai bị hạ 2, Thính 2, Boss 2); không hỏi trong 20s sau khi can thiệp.`);
  p(`  - ${QQ.fight.icon} **Ai thắng?** — khi hai tướng đã nhắm nhau và đánh qua lại (cả hai ≥ 45% máu). Thắng = còn sống sau 40s mà đối thủ đã gục; cả hai cùng gục (kền kền…) → mọi cửa thua; cả hai chạy thoát → hủy kèo (hoàn tiền). Xác suất = sức mạnh×máu mũ 1.5, kéo về 10–90%.`);
  p(`  - ${QQ.boss.icon} **Ai giết được boss này?** — khi có tướng bắt đầu đánh boss; 4 tướng gần nhất + "người khác / boss sống quá 3 phút".`);
  p(`  - ${QQ.drop.icon} **Ai lấy được thính?** — khi thính được báo; 4 tướng gần nhất + "người khác"; thính không ai lấy → hủy kèo.`);
  p(`  - ${QQ.death.icon} **Ai bị hạ tiếp theo?** — khi lâu không có câu nào (≥ 160s), còn ≥ 4 người.`);
  p(`  - ${QQ.vulture.icon} **Kền kền có xuất hiện không?** — khi hai tướng đánh nhau ≥ 10s mà có kẻ thứ ba trong 35 đv; "có" = trong 30s một trong hai bị kẻ thứ ba hạ.`);
  p(`- **Điều khoản chữ nhỏ** (luôn ghi ra, chữ nhỏ mờ; Đọc Chữ Nhỏ tô đỏ): xác suất gặp = 15% + 45% khi đang giao kèo + 5% × bực bội (Lời Hứa Ngọt: mọi câu). ${Object.entries(FI).filter(([k]) => k !== 'top1').map(([k, F]) => `${QQ[k].short}: ${Object.values(F).map((x) => '"' + x + '"').join(' / ')}`).join(' • ')}.`);
  p(`- **Can thiệp** (trả tiền): ${Object.entries(G.INTERV).map(([k, I]) => `${I.icon} ${I.name} ${BT.interv[k]}`).join(' • ')} — ×${BT.interv.grow} mỗi lần trong cùng trận, ×(1 + 0.15 × bực bội), Tay Trong −30%. Đang có kèo mở mà can thiệp = **"Phô Mai"** (bực +2; Phô Mai Hảo Hạng chỉ +1), không có kèo = "thêm hỗn loạn" (bực +1). Can thiệp được ghi (tick, loại) để "xem lại" diễn ra y hệt.`);
  p(`- **Người của nhà cái** (${BT.house.map((id) => G.HEROES[id].name).join(', ')}): mỗi trận nhà cái cài 0 – (1 + chặng) người (+1 khi bực ≥ 4, +1 khi bực ≥ 7, +1 khi dính Ân Huệ; trận của nhà cái: cả 4), đưa họ vào dàn tướng nếu thiếu; từ chặng 2 có 35% mua chuộc thêm một tướng khác. Họ **liên minh lâu dài, không báo cho ai**: không nhắm / săn / làm kền kền nhau, chung tầm nhìn, đổi đồ thật thà, không kết liên minh tạm với ai. Vỡ vì **lòng tham** (cân nhắc mỗi 10s): thính rơi giữa hai người (theo tính cách: Kẻ Bắt Nạt 55%, Thợ Săn Bắt Lẻ 35%, Lì Lợm 15%, Hòa Bình 5%), bo từ vòng 5 ép sát (6%), chỉ còn toàn người của nhà cái (30%); trúng nhầm nhau ≥ 30% máu cũng vỡ. Dấu hiệu: gặp nhau thì lướt qua, không bao giờ làm kền kền nhau, dòng sự kiện "⚡ trở mặt" khi vỡ.`);
  p(`- **Bực bội ẩn** (hiện bằng nét mặt 😏 / 😒 / 😠): +2 Phô Mai, +1 can thiệp, +2 thắng giao kèo, +1 thắng một kèo ≥ 1000 và ≥ ×5, +1 chọn toàn cửa trên; −1 nhận quà, −1 vay, −1 thua kèo ≥ 500. Bực càng nhiều: tỷ lệ xấu hơn, điều khoản chữ nhỏ nhiều hơn, nhiều người của nhà cái hơn, can thiệp đắt hơn, quà độc hơn; ≥ ${BT.angryEnd} sau chặng cuối → trận của nhà cái.`);
  p(`- **Cửa hàng sau trận**: 3 charm (giá × (1 + 0.1 × chặng) × (1 + 0.25 × số bản đã có), mua tối đa 1). **GĐ9c: không giới hạn số charm, mua trùng thì CỘNG DỒN** (mỗi bản thêm hiệu lực — xem bảng); 50% có quà của nhà cái (quà cũng cộng dồn); vay ${BT.loans.join(' / ')} (trả ×${BT.loanRate}, nhận 1 charm xấu ngẫu nhiên, chỉ gỡ khi trả nợ). Thoát giữa trận = bỏ trận (tiền đã cược mất).`);
  p(`- **GĐ9c — Sổ tiết kiệm**: giữa các trận gửi bao nhiêu cũng được; tiền gửi lượt này **khóa tới hết trận sau** (rút được từ lượt sau). Sau mỗi trận, số dư trong sổ được lãi **${BT.savRate * 100}%** và lãi cộng vào sổ (lãi kép). Tiết kiệm không dùng để cược trong trận, nhưng tính vào chỉ tiêu cuối chặng; trả nợ cuối ván trừ tiền mặt trước rồi mới tới sổ.`);
  p(`- **GĐ9c — ${BT.perStage} trận mỗi chặng** (tổng ${BT.stages.length * BT.perStage} trận). **Chơi tiếp vô tận**: trả hết nợ (tự do) thì có thể chơi tiếp; mỗi chặng vô tận chỉ tiêu = chặng cuối × ${BT.endlessGrow}^k, tài sản trừ nợ vay phải ≥ chỉ tiêu (không phải nộp), nhà cái cài thêm 1 người mỗi trận; thiếu là dừng — ghi kỷ lục chặng vô tận.`);
  p('| Charm | Loại | Giá | Tác dụng | Mặt trái (giấu) |');
  p('|---|---|---|---|---|');
  for (const [k, C0] of Object.entries(CHs)) p(`| ${C0.icon} ${C0.name} | ${{ shop: 'cửa hàng', gift: 'quà nhà cái', bad: 'xấu (khi vay)' }[C0.kind]} | ${C0.price || '—'} | ${C0.desc} | ${C0.hidden || '—'} |`);
}
p('');
p('## 18. Giao diện xem trận (trọng tài)');
p('- Danh sách 10 tướng (màu riêng theo ô xuất phát): cấp, máu, số mạng (🦅 kền kền), ♻ còn lượt hồi sinh, 🧪 bình máu / 💧 bình mana / 💠 số mảnh hồn (viền ảnh đổi màu theo bậc mảnh hồn), việc đang làm (đang đánh ai, đang uống bình, đang quyết đấu), hạng khi bị loại; thu gọn được. Chạm một tướng: camera theo dõi + thẻ tướng (chỉ số, tính cách, balo, ý niệm, mảnh hồn, người được bảo vệ / đồng minh đình chiến, thành tích) + "Đang nghĩ" (3 hành động điểm cao nhất kèm lý do).');
p('- Thanh trên: đồng hồ, số người còn trong trận, bo (vòng mấy, co lúc nào), thính, boss. Bản đồ nhỏ: bo hiện tại (ngoài bo tô tím) + vòng kế (nét đứt), bãi quái, Thương Nhân, boss, thính, 10 tướng.');
p('- Camera tiên tri chấm điểm nóng: ⚔ giao tranh / hỗn chiến • 🦅 kền kền đang rình • ⚡ sắp chạm trán • 🎯 đang bị săn • 👑 đánh boss • 📦 tranh/mở thính • 🏃 truy đuổi • 🌀 kẹt ngoài bo • ⚔ quyết đấu / cổng quyết đấu. Tự chậm lại khi có ≥ 3 tướng giao tranh.');
p('- Bản đồ vẽ theo 6 vùng; thu nhỏ hết cỡ thấy toàn đấu trường kèm tên vùng (bớt chữ cho đỡ rối). Cổng quyết đấu: cổng đá phát sáng + vòng ghi danh + đếm ngược; vòng quyết đấu vàng có cột lửa và đồng hồ. Uống bình: vòng tiến độ + lọ thuốc trên đầu.');
p('- Mảnh hồn rơi: viên pha lê màu theo bậc văng ra từ xác, lơ lửng phát sáng (bậc Tím trở lên có tên), sắp hết hạn thì nhấp nháy; bản đồ nhỏ có chấm kim cương; nhặt được thì có vầng sáng + chữ "+💠 Vàng"; camera coi "💠 Tranh mảnh hồn" là điểm nóng; dòng sự kiện "💠 X rơi n mảnh hồn" (có mảnh Vàng/Đỏ thì hiện biểu ngữ).');
p('- Quạ Oca vẽ bay cao có bóng dưới đất, vỗ cánh, mắt xanh, vòng tầm nhìn 8 đv nét đứt; bom mini rơi thấy được. Raven ngắm: cầm súng ngắm (nòng dài, ống ngắm, chân chống), tia laser đỏ + tâm ngắm trên mục tiêu; camera coi đây là điểm nóng "🎯 Bắn tỉa qua mắt quạ". Hộ vệ đang nhắm kẻ đánh chủ: dấu "!" và vạch nét đứt tới mục tiêu; đang quay về: "↩".');
p('- Hiệu ứng kiểu bản Legacy: vệt chém trăng khuyết / đâm / lốc xoáy, mỗi đòn trúng có tia sáng theo màu người đánh + hạt văng xen trắng, đòn nặng rung màn hình + chớp trắng; tên chiêu bật lên trên đầu khi dùng (chiêu cuối chữ to, màu tướng).');
p('- GĐ7: rương gỗ viền vàng (đang mở: vòng tiến độ vàng 🎁), bẫy kẹp (vòng nét đứt màu chủ bẫy), thùng thuốc nổ (cháy ngòi thì nhấp nháy tóe lửa), cối xay quay; nền vẽ theo biome của từng vùng (thêm Sa Mạc Cát), nhà / đền / cao nguyên (vách đá + dốc có bậc) / cầu / ao bùn / mặt băng / cát lún; đình chiến: nét đứt xanh + 🤝, vệ sĩ → người được bảo vệ: nét chấm. Màn dàn tướng hiện 5 biome và số công trình của bản đồ.');
p('- Thông báo: 🦅 KỀN KỀN! • HẠ GỤC KÉP/BA… • CHIẾN CÔNG ĐẦU • CHẤM DỨT CHUỖI (kèm vàng truy nã) • "X BỊ LOẠI — hạng n"; bo bắt đầu co, thính sắp rơi / bị lấy, boss xuất hiện / cường hóa / bị hạ. Bảng xếp hạng (📋/Tab) và màn kết quả sau trận.');
p('- GĐ8: bản đồ 8 vùng (Vùng Tử Khí: đất tro tím, cây chết, bia mộ, bụi gai; Trạm Khí Độc: vũng độc, sắt vụn, bồn khí có vạch cảnh báo, đường ống, nắp xả phun khói), 4 ổ boss mỗi ổ một kiểu sàn, đếm ngược + tên boss sắp ra; mỗi boss một dáng riêng (cánh lửa, rồng, hồn ma, giáp sắt, thú vàng, kiếm sư) + vòng tụ chiêu; vùng cảnh báo tròn / vành khăn / chữ nhật / hình nón (tô đậm dần tới lúc nổ); thanh Hộ Giáp bạc trên thanh máu; biểu tượng bùa lợi boss trên đầu; thẻ tướng có Hộ Giáp, chí mạng, may mắn, hồi chiêu, hút máu, kháng, xuyên thủng, bùa lợi boss, đồ Hoàng Kim, mảnh hồn đang gắn ✅ / cất túi 💤; dòng sự kiện boss xuất hiện / bị đánh (cả bản đồ biết) / bị hạ / thoát chết nhờ bùa / nhận đồ Hoàng Kim.');
p('- GĐ9: thẻ tướng có 🔫 đạn / đang nạp / Tốc Nạp, 🧭 lối build đang theo (món đã có ✔), ❤ mảnh hồn yêu thích (✅ đang gắn / 💤 cất / · chưa có), 🌳 **cây kỹ năng đã nâng** (chạm để mở: từng mốc cấp 1/3/6/9/12, nhánh đã mở ✅, nhánh đã chọn nhưng chưa đủ cấp 🔒, mốc thêm cấp 15/18 ✨); dòng sự kiện 🔄 trao đổi / 💰 mua bán / 🃏 bịp / 🤨 nhìn thấu / 😤 vỡ lẽ, 💠 mảnh hồn văng ra; tiếng gọi trên đầu ("🔄 Đổi mảnh hồn không?", "📣 Bên kia có rương…", "👣 Truy vết").');
p('- **GĐ11 — vũ khí & hiệu ứng riêng từng tướng**: mỗi tướng cầm vũ khí riêng (bảng dưới; tướng tay không: Borg đấm, Koda vuốt, Aria giọng hát, Alice găng tay ném bài), đạn đánh thường riêng (lá bài lưng tím viền vàng của Alice, nước của Lyra, ánh thánh của Olivia/Justus, khối dữ liệu của Caelus, mảnh gương của Mirage, cánh hồng đen của Dahlia, Chrono & Neo hai khẩu khác nhau — **Chrono** súng ngắn đồng cổ bắn viên đạn **cam** nặng (vòng kim đồng hồ), **Neo** súng năng lượng bắn tia **xanh dương** mảnh nhanh; đổi thế thì đổi đạn, lửa nòng đổi màu; **S4 Liên Hoa Thời Không trộn cả hai loại đạn**, plasma của Zero, lưỡi gió của Thanh Phong, lá bài của Luca/Joker…), đòn cận chiến đặc trưng theo vũ khí (đại kiếm chém rộng + tia ở mũi kiếm, katana hai vệt mảnh, song kiếm vệt chéo, lưỡi hái cung tím, dao găm đâm + giọt độc, phi đao hư không vết nứt tím, côn xoáy, song rìu + vụn băng, đại bản đao vàng, móc xích, kiếm khiên chớp khiên, cờ chiến đâm giáo) và **dấu ấn tung chiêu** (hạt + vầng sáng màu riêng mỗi tướng).');
{ const by = {}; for (const h of Object.values(G.HEROES)) (by[h.gfx] = by[h.gfx] || []).push(h.name); p('| Vũ khí (gfx) | Tướng |'); p('|---|---|'); for (const [g, n] of Object.entries(by).sort()) p(`| ${g} | ${n.join(', ')} |`); }
p('- **GĐ11 — Chiêu diện rộng đặt điểm**: cột nước S4 của Lyra chọn tâm theo vị trí dự đoán (đón đầu 0.9s) nơi gom được nhiều tướng địch nhất, hòa thì kẻ gần nhất; chỉ tung khi có ai lọt vùng. Kiếm Trận Bạch Diệp, bom từ Vector, khói & Thiên Tượng Tsukiyo đặt đúng điểm nhắm (trước luôn văng ra tầm tối đa).');
p('- **GĐ12 — hình ảnh**: Alice S1 phi **dao găm** bạc chuôi tím; ảo ảnh của mọi tướng bắn đúng loại đạn của tướng gốc (ảo ảnh Alice ném bài). Dahlia: **mũ chóp cao rơi từ trời** chụp xuống ở Thoát Nguy (cả hai đầu hoán đổi), Mũ Thoát Hiểm, Màn Ảo Thuật, Cuồng Nhiệt biến quái. **Sân Khấu** (Luca S1 — sàn ấm, rèm nhung đỏ, viền vàng; Dahlia S4 — sàn tím đen, rèm tím, gậy đen cắm giữa): rèm nhung xếp nếp quanh mép, viền chạy, 2 đèn sân khấu quét. Thanh Phong: đánh thường & chiêu là **cơn lốc xoáy** (không còn nốt nhạc). Galo hóa thú: thân to 18%, xanh sẫm, tai nhọn, nanh, vằn lưng, mắt vàng, vũ khí thành **vuốt thú**. Luca dùng bộ chiêu cải trang: mang **màu & vũ khí của nạn nhân** + vòng cánh hồng xoay; đổi bộ chiêu bung khói hồng. Chrono & Neo: thân **cam đồng (Chrono) / xanh năng lượng (Neo)** + vòng màu dạng, hợp thể S4 có hai vòng; kẻ bị S2 nhắm có **vòng khóa cam**. Tướng **xoay tít** khi dùng chiêu xoay (Boran S2, Chrono & Neo S4, Kazuki AA, Roxie Vòng Xoáy Lửa, Jack Nạp Đạn Liều Lĩnh) và **vũ khí chìa thẳng ra hai bên đối diện**. Luca Bước Nhảy chạm đất **bung cánh hoa**. Mọi tướng: bóng đổ mềm dưới chân, viền sáng, chớp trắng khi trúng đòn tắt dần mượt. Tướng hai vũ khí (song kiếm, song rìu, dao găm, phi đao) **đánh luân phiên tay trái / phải**. Florian: **vòng Tứ Ấn** 4 cung hồng quanh mục tiêu, cung nào vỡ thì tắt.');
p('- **GĐ11 — Sandbox**: lớp vẽ hitbox (vòng xanh/đỏ), nón nhìn 180°, vòng tầm đánh & từng chiêu (có nhãn), vòng lồng Solo vàng nét đứt.');
p('');
p('## 20. Phòng thử nghiệm Sandbox (GĐ11 — src/sim/sandbox.js, src/ui/sandbox_ui.js)');
p('- Màn hình chính → 🧪 **Phòng thử nghiệm**: chọn tướng, cấp (1/3/6/9/12/18), các bù nhìn cần thả → vào bản đồ thật (vách đá, bụi, công trình) nhưng **không quái, không rương, không bo, không ai chết** (về 0 máu thì hồi đầy, ghi "☠ hạ gục" vào nhật ký). Tướng thử do AI thật điều khiển, tự dùng chiêu lên bù nhìn.');
p('- **Bù nhìn** (đội đối thủ, không liên minh / mua bán):');
for (const [k, D] of Object.entries(G.Sandbox.DUMMY)) p(`  - ${D.icon} **${D.name}** — ${D.desc}`);
p('  - ⚔ **Đối thủ tướng thật** — bất kỳ tướng nào, AI đầy đủ (test giữ cự ly, Solo). **GĐ12**: hàng ⚔ **Lệnh đối thủ** riêng (AI / Đứng yên / Đánh thường / chỉ S1–S4 / chiêu phụ) áp cho mọi đối thủ tướng thật.');
p('- **Lệnh cho tướng thử** 🎮: 🤖 AI tự đánh (mặc định) • ⏸ **Đứng yên, không làm gì** (làm bia để test chiêu/bù nhìn bắn vào) • 🗡 **Chỉ đánh thường** • **S1 / S2 / S3 / S4 / chiêu phụ: CHỈ dùng đúng chiêu đó** — tự tiến vào tầm chiêu rồi tung lên mục tiêu gần nhất, không đánh thường, không dùng chiêu khác (chiêu chưa học thì mở tạm cấp 1; chiêu dùng lại như snapback cũng được bấm). Kết hợp ⏱ Không Hồi Chiêu để spam một chiêu.');
p('- **Bảng điều khiển** (phím tắt): 🛡 Bất Tử • ⏱ Không Hồi Chiêu (F1) • ♾ Vô Hạn Tài Nguyên (F2: mana, đạn, thanh riêng) • nhảy cấp 1→3→6→9→12→18 (F3) • đổi tướng tại chỗ (F4) • lớp vẽ gỡ lỗi (F5): hitbox, nón nhìn 180°, vòng tầm đánh & tầm từng chiêu • tốc độ 0.1x / 0.25x / 0.5x / 1x / 2x (F6) • 🔒 Lồng Solo đường kính 14 đv • ☣ Bo giả lập (18 → 6 đv trong 25s, sát thương bo vòng 3 + Ăn Mòn) • chế độ Máy Xả Đạn • đổi Siêu Giáp (Hộ Giáp ↔ giáp thường) • 🧹 dọn bù nhìn.');
p('- **Bảng đo**: DPS 1s gần nhất • DPS trung bình cả chuỗi (chuỗi kết thúc sau 3s không đánh) • đòn cao nhất • tổng, số đòn, số chí mạng • phân rã Vật Lý / Phép / Chuẩn / Hộ Giáp vỡ / Khiên (con số + %) • đồng hồ khống chế (Choáng, Trói, Chậm, Câm lặng, Hất tung…) • nhật ký từng đòn dạng `[mm:ss.cs] S1 Tên Chiêu → 240 Vật Lý (CHÍ MẠNG!) → 40 Hộ Giáp vỡ → 0.60s Choáng`.');
p(`- **${G.Sandbox.SUITE.length} kịch bản kiểm thử mẫu** (chạy trong giao diện hoặc \`node tools/sandbox_test.js\`, mỗi dòng ✔/✘):`);
for (const T of G.Sandbox.SUITE) p(`  - **${T.name}** — tướng ${G.HEROES[T.hero].name}, bù nhìn: ${T.dummies.map((d) => G.Sandbox.DUMMY[d].name).join(', ')}${T.noCd ? ', bật Không Hồi Chiêu' : ''}${T.spit ? ', Máy Xả Đạn chế độ ' + T.spit : ''}.`);
p('');
p('## 21. Chế độ PvE Sinh Tồn (GĐ12 — src/sim/pve.js, src/ui/pve_ui.js)');
p('- Màn hình chính → 🕹 **Sinh Tồn PvE**: chọn 1 tướng; bạn tự điều khiển nó giữa 9 tướng máy trên bản đồ, luật đấu trường như thường (bo, quái, boss, thính, rương, Thương Nhân). Điểm chiêu và mua đồ của tướng bạn là **thủ công** (xem dưới).');
p('- **Đường thực thi thống nhất** (Unified Action Pipeline): người chơi và AI cùng đổ lệnh về `m.executeSkill(u, ô chiêu, vị trí, mục tiêu)` và `m.executeBasicAttack(u, mục tiêu, hướng)`. AI tính vị trí bằng lấy mẫu không gian: chiêu vùng dùng **gom cụm có trọng số** (mỗi kẻ địch là một ứng viên ở vị trí đón đầu; tướng ×3, quái ×1; rồi kéo tâm về trọng tâm cụm nếu phủ không kém; kẹp trong tầm), chiêu định hướng / hình nón dùng **véc-tơ đón đầu** P + v × t_bay (mục 13p).');
p('- **Bộ điều hợp PC**: WASD đi • **giữ Q/E/R/F/Space** hiện vòng chỉ thị bám con trỏ, **nhả** để tung (chiêu rơi đúng con trỏ; bấm nhanh cũng tung tại con trỏ) • chuột phải / Esc khi đang giữ = **hủy** • click trái vào kẻ địch = khóa & đánh • con trỏ sát mép 5% → camera trôi về phía đó tối đa 8 đv • H/G bình, **B** bánh xe balo, T đổi mục tiêu.');
p('- **Bộ điều hợp điện thoại**: **cần ảo nổi** (chạm bất kỳ đâu nửa trái màn hình) • nút chiêu: **chạm nhanh** (< 0.15s) = tung vào mục tiêu ưu tiên có đón đầu nhẹ 0.25s; **giữ & kéo** = vòng chỉ thị — **Đường thẳng** (chiêu bay / lướt), **Hình nón** (shotgun, quạt, chém 180°), **Vòng rơi** (vòng tầm tối đa + vòng nổ di chuyển theo ngón tay, độ kéo = cự ly), **Quanh mình** (chiêu tự thân); kéo vào ô **✕ HỦY** = chỉ thị đổi đỏ xám, thả ra không tung. **Nam châm ngắm**: dải ngắm lệch ≤ 12° so với một tướng địch → tự hút vào điểm đón đầu của nó (vòng đỏ đánh dấu), kéo vượt góc thì ngắm tự do. Chiêu tầm > 10 đv: camera trôi theo hướng ngắm (tầm × 0.6 × độ kéo).');
p('- **Nút đánh thường thông minh** ⚔: chạm = tự chọn mục tiêu trong tầm theo ưu tiên **tướng địch thấp máu nhất → tướng gần nhất → quái đang giao tranh**; không có gì trong tầm → bước ngắn 1.5 đv về phía kẻ địch gần nhất. **Kéo** = đường vàng, rê qua mục tiêu nào (ưu tiên tướng hơn quái) thì **vòng khóa đỏ** ghim vào nó; thả tay là khóa & đánh cố định mục tiêu đó. Mục tiêu khóa luôn có vòng đỏ xoay + mũi tên trên đầu. Lệnh đánh được giữ (tự bám vào tầm) tới khi di chuyển, mục tiêu chết, khuất tầm nhìn hoặc xa quá 12 đv — đứng yên KHÔNG tự đánh.');
p('- **Bánh xe balo** 🎒 (giữ nút / phím B): bung tối đa 6 ô vật phẩm quanh ngón tay, quẹt về món cần dùng rồi thả. Bình máu / mana-giáp vẫn có nút 1 chạm.');
p('- **Tầm nhìn như người chơi thường**: chỉ thấy đơn vị mà đội mình nhìn thấy, sương tối ngoài tầm nhìn tướng; danh sách 10 tướng kiểu trọng tài bị ẩn. **Chỉ báo âm thanh** cho kẻ địch khuất tầm nhìn: ⚔ tiếng giao tranh (30 đv), 💨 tiếng lướt (18 đv), 👣 tiếng bước chân ngoài bụi (9 đv) — vị trí áng chừng ±1.5 đv, ngoài màn hình thành biểu tượng + mũi tên vàng ở mép.');
p('- **Khóa mục tiêu thông minh** (chỉ để ngắm khi chạm nhanh nút chiêu): giữ mục tiêu cũ nếu còn thấy & trong 11 đv; không thì tướng địch gần nhất trong 9 đv; rồi quái gần nhất trong tầm đánh + 2.');
p('- **AI tự hành của tướng bạn bị xóa**: không vòng nghĩ, không tự đánh / tự dùng chiêu / tự uống bình / tự dùng balo, không bị AI khác kéo vào liên minh – đình chiến, không phản xạ né đòn hay hoảng loạn bấm nhầm chiêu. Điểm chiêu và cửa hàng cũng không tự động (tướng máy vẫn tự cộng / tự mua như cũ). Bị loại → biểu ngữ hạng, camera về **góc nhìn trọng tài** (bỏ sương mù), trận chạy tiếp ở tốc độ đã lưu tới khi có người thắng.');
p('- **Cộng điểm chiêu thủ công**: lên cấp có điểm → biểu ngữ nhấp nháy "⬆ N điểm chiêu"; chiêu học được hiện huy hiệu **+** xanh (chạm + để học, không kích hoạt ngắm), PC: **Ctrl/Alt + Q/E/R/F**. Luật cấp giữ nguyên: chiêu thường tối đa 5 cấp và không vượt ⌈cấp/2⌉; chiêu cuối tối đa 3, mở ở cấp 4/8/12. Chấm dưới nút chiêu = cấp chiêu.');
p('- **Cửa hàng 🛒 (phím P)**: mua chỉ khi đứng cạnh Thương Nhân (hoặc có mảnh "Cửa Hàng Online" và rời giao tranh > 4s); đứng xa thì dòng trạng thái chỉ khoảng cách + hướng tới Thương Nhân gần nhất, nút 🛒 sáng khi mua được. 4 tab: **Gợi ý** (6 món kế tiếp trong lối build của tướng + phôi), **Tất cả** (theo nhóm Công vật lý / Phép / Thủ / Hỗ trợ / Giày / Kích hoạt), **Đồ của tôi** (bán lấy 50% giá, rèn Ý Niệm), **Balo & bình** (nâng balo, mua vật phẩm tiêu hao). Đủ 6 ô thì mua món mới tự bán món khởi điểm để lấy chỗ. Esc đóng.');
p('- **Nút khóa camera 🔒 (phím Y)**: khóa = camera bám tướng bạn; mở 🔓 = camera đứng yên, kéo bản đồ tự do; khóa lại thì camera về giữa tướng. Kéo bản đồ cũng tự mở khóa.');
p('- **Mở rương 🎁 (phím V)**: tới gần rương (≤ 2.5 đv ngoài tầm với) hiện nút "🎁 Mở rương"; bấm → tự đi tới rồi đứng mở 1.5s (thanh tiến độ trên nút); di chuyển hoặc bị đánh thì hỏng.');
p('- **Cửa hàng có ô tìm kiếm** (không dấu cũng được: "hut mau" ra Hút Máu) — tìm theo tên, chỉ số, mô tả, cả trang bị lẫn vật phẩm balo; khi bảng mở, báo điểm chiêu hiện ngay trong bảng (không bị che).');
p('- **Khóa tốc độ khi còn sống**: chỉ còn ⏸; ẩn x0.5–x8, tua nhanh, AI debug, camera điểm nóng; bị loại mới chỉnh tốc độ như xem trận. Phím cách chỉ là skill phụ. **Minimap theo tầm nhìn**: chỉ hiện tướng địch đang thấy.');
const txt = L.join('\n') + '\n';

if (process.argv.includes('--kiemtra')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== txt) { console.error('✘ THIET_KE.md đang lệch so với mã — chạy: node tools/thietke.js'); process.exit(1); }
  console.log('✔ THIET_KE.md khớp với mã'); process.exit(0);
}
fs.writeFileSync(OUT, txt);
console.log('Đã ghi', OUT, `(${L.length} dòng)`);
