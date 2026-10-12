# THIẾT KẾ — KẺ ĐẶT CƯỢC: mọi con số của đấu trường

> Tệp này được **sinh tự động** từ mã bằng `node tools/thietke.js`. Đừng sửa tay: sửa trong mã rồi chạy lại lệnh.
> `node tools/thietke.js --kiemtra` báo lỗi nếu tài liệu lệch với mã.
> Đơn vị: khoảng cách = **đv** (≈ 1 mét), thời gian = giây giờ game. GĐ6: bỏ hẳn bản MOBA 5v5; trò chơi là **đấu trường sinh tồn 10 tướng đánh đơn**. GĐ6b: bản đồ ×5 diện tích, 6 vùng, trận 30–60 phút, giao tranh dài, bình máu, mảnh hồn, cổng quyết đấu. GĐ8: bản đồ ×2, 8 vùng, 4 ổ boss / 7 boss có cảnh báo, Hộ Giáp & Xuyên Thủng, mảnh hồn 9 chỉ số × 6 bậc. GĐ9: súng & nạp đạn, mảnh hồn Tầm Nhìn / Tầm Đánh / Nạp Đạn / Tốc Đánh, thính giác & truy vết, 3 lối build mỗi tướng, trao đổi & bịp trong liên minh. GĐ9b: **nhà cái & đặt cược** (mục 19). GĐ10: 13 tướng mới/làm lại, AI nhận thức & chọn nhánh theo tiện ích, quan hệ cốt truyện. GĐ11: **bộ não chiến đấu** (mục 13m), bo Ăn Mòn & Vết Thương Sâu (13n), quái lang thang & boss nhỏ (7b), liên minh vĩnh cửu (13o), **Phòng thử nghiệm Sandbox** (20), vũ khí & hiệu ứng riêng từng tướng (18).

## 0. Tổng quan — trò chơi vận hành thế nào
Đọc mục này trước để hiểu toàn bộ trò chơi; các mục sau là con số chi tiết của từng hệ thống.

### 0.1. Bạn là ai, chơi để làm gì
- **Kẻ Đặt Cược** là trò chơi *xem & đặt cược*: bạn không điều khiển tướng. 10 tướng do máy điều khiển (AI) thả vào một đấu trường sinh tồn, đánh nhau tới khi chỉ còn 1 người. Bạn đứng ngoài như **trọng tài** — thấy hết bản đồ, thấy cả suy nghĩ của từng tướng — và **đặt cược** để trả món nợ với nhà cái.
- Một **ván** gồm 3 chặng × 6 trận. Hết mỗi chặng phải đạt chỉ tiêu tiền; chặng cuối phải trả hết nợ. Trả xong thì được tự do và có thể chơi tiếp **vô tận** (chỉ tiêu tăng dần). Chi tiết ở mục 19.
- Trong mỗi trận: trước trận nhà cái cho **tỷ lệ cược** + tin đồn + câu hỏi đầu (ai sống tới cuối, ai Top 1, Top 3) + **Giao Kèo ×10**; giữa trận nhà cái **dừng trận để hỏi** (ai thắng giao tranh này, ai giết boss, ai lấy thính…); sau trận: thanh toán, cửa hàng charm (cộng dồn), quà có mặt trái, vay nợ, **sổ tiết kiệm** lãi kép.
- **Nhà cái không trung thực**: có **người của nhà cái** cài trong trận (liên minh ngầm, không đánh nhau), tin đồn giả, điều khoản chữ nhỏ. Kỹ năng của người chơi là *đọc người*: xem tính cách, sức mạnh, máu, đồ, ý định của AI rồi mới đặt.

### 0.2. Các chế độ ở màn hình chính
- 🎲 **Ván cược** (vòng chơi chính, mục 19) • 👁 **Xem một trận tự do** (không cược) • ⚔ **Solo 1v1** (2 tướng tùy chỉnh cấp, đồ, mảnh hồn trên sàn đấu thu gọn) • ⏩ **Mô phỏng nhanh** (chạy hết trận trong chớp mắt, xem bảng kết quả) • 🧪 **Phòng thử nghiệm Sandbox** (GĐ11, mục 20: thả bù nhìn, đo DPS, bật/tắt hồi chiêu…) • 📜 bản cũ (Legacy).

### 0.3. Một trận diễn ra thế nào (dòng thời gian)
- **0:00** — 10 tướng (chọn ngẫu nhiên theo hạt giống) xuất hiện ở 10 điểm xuất phát rải trên 5 vùng thường, mỗi tướng cấp 1, 500 vàng, vài bình máu. Bản đồ 612×612 đv sinh theo hạt giống (biome, công trình, bụi, thùng nổ). Mỗi tướng có **tính cách cố định** (mục 11) và **phong cách đánh**.
- **0:30** — bãi quái mở (mục 7): tướng farm vàng/KN để lên cấp (tối đa 18), mua đồ ở Thương Nhân, nâng **Ý Niệm** (cấp vũ khí) và khảm **mảnh hồn** (mục 13c). Quái lang thang (GĐ11) bắt đầu đi tuần từ giây 90; boss nhỏ từ 5:00.
- **Trước 30:00** — chết được hồi sinh 1 lần. Sau đó chết là **bị loại**; xếp hạng theo thứ tự bị loại.
- **Bo** (vùng an toàn, mục 3) co 6 vòng; ngoài bo mất máu theo % và (GĐ11) dính **Ăn Mòn** + **Vết Thương Sâu** (mục 13n) → ép mọi người dồn vào giữa.
- **Boss lớn** (mục 8) xuất hiện ở 4 ổ theo lịch, chiêu lớn có vùng cảnh báo; hạ được thì nhận bùa lợi, đồ Hoàng Kim. **Thính** (mục 9) rơi từ trời theo đợt. **Rương** (mục 13e), **cổng quyết đấu** 1v1 thưởng lớn (mục 13d).
- **Kết thúc**: còn 1 người, hoặc hết 60:00 thì những ai còn sống đồng hạng 1.

### 0.4. AI tướng nghĩ thế nào (mỗi nhịp nghĩ 0.06–0.25s)
1. **Nhận thức** (mục 13k): tầm nhìn 180°, bụi, tàng hình; nghe tiếng giao tranh / tiếng đánh quái trong 35–55 đv; nhớ vị trí cuối của đối thủ để truy vết. Trễ phản xạ, giật mình, hoảng loạn (GĐ10).
2. **Phản xạ chiến đấu** (GĐ11, mục 13m): bị đánh từ góc khuất → xoay mặt / bắn trả mù; ngoài bo → lướt vào; dùng lại chiêu snapback đúng lúc; né chiêu định hướng & vùng cảnh báo.
3. **Quyết định lớn — Utility AI** (mục 13): chấm điểm ~20 hành động (farm, săn người, kền kền, tranh boss, tranh thính, chạy bo, núp, uống bình, quyết đấu, săn quái lang thang…) theo **trọng số tính cách**, giữ quán tính tối thiểu.
4. **Vi mô theo tính cách** (Persona) + **AI riêng của tướng** (ví dụ Raven tìm chỗ bắn tỉa, Luca bọc lót Alice) + **liên minh vĩnh cửu / tạm thời**.
5. **Giao tranh**: chọn mục tiêu bằng điểm (KS, thù dai, trả đũa, nhánh kết liễu…), đánh giá thế trận theo **sức mạnh**, rồi vi thao tác: phá tụ lực, đọc đòn, chống thả diều, ép bo, combo "múa", giữ cự ly riêng, thả diều, rút lui / Đường Cùng Phản Sát (quay lại khô máu khi không thoát được).

### 0.5. Các hệ thống & nơi đọc chi tiết
| Hệ thống | Mục | Mã nguồn |
|---|---|---|
| Nhịp logic, tất định, hạt giống | 1 | `src/core/*, src/sim/match.js` |
| Bản đồ, vùng, ổ boss, công trình | 2, 13f | `src/sim/map.js, src/sim/props.js` |
| Bo + Ăn Mòn + Vết Thương Sâu | 3, 13n | `src/sim/arena.js` |
| Cấp, KN, hồi sinh, xếp hạng | 4 | `src/sim/match.js, src/sim/arena.js` |
| Sát thương, khiên, Hộ Giáp, xuyên thủng | 5, 13i | `src/sim/combat.js` |
| Kinh tế, trang bị | 6, 14 | `src/sim/items.js, src/data/items.js` |
| Quái rừng, bầy đầu đàn | 7 | `src/sim/neutral.js` |
| Quái lang thang & 8 boss nhỏ | 7b | `src/sim/roamers.js` |
| Boss lớn, bùa lợi, đồ Hoàng Kim | 8 | `src/sim/bosses.js` |
| Thính, rương, balo, bình | 9, 13b, 13e | `src/sim/arena.js, src/sim/bag.js` |
| Tính cách & AI sinh tồn | 11, 13 | `src/data/personality.js, src/sim/ai/utility.js, persona.js` |
| Bộ não chiến đấu GĐ11 | 13m | `src/sim/ai/combat_brain.js` |
| Nhận thức, cây kỹ năng theo tiện ích | 13k, 17 | `src/sim/ai/cognition.js` |
| Ý Niệm & mảnh hồn | 13c | `src/data/shards.js, src/sim/extras.js` |
| Quan hệ cốt truyện, liên minh vĩnh cửu | 13o | `src/data/relations.js` |
| Tướng & chiêu | 16 | `src/data/heroes/*.js` |
| Nhà cái & đặt cược | 19 | `src/data/bookie.js, src/sim/bookie.js, src/ui/bet_ui.js` |
| Phòng thử nghiệm Sandbox | 20 | `src/sim/sandbox.js, src/ui/sandbox_ui.js` |
| Chiến thuật AI GĐ12 | 13p | `src/sim/ai/tactics12.js` |
| Chế độ PvE Sinh Tồn | 21 | `src/sim/pve.js, src/ui/pve_ui.js` |
| Giao diện xem trận, hiệu ứng, vũ khí | 18 | `src/ui/render.js, hud.js, vfx.js, draw_hero.js` |
- Công cụ: `node tools/mophong.js` (mô phỏng nhiều trận, `--kiemtra` tất định) • `node tools/thu_tuong.js` (thử 1 tướng) • `node tools/tyle.js` (tỷ lệ cược) • `node tools/sandbox_test.js` (5 kịch bản Sandbox, `--dps <tướng> <cấp>`) • `node tools/thietke.js` (sinh tài liệu này) • `node tools/choi_thu.js` (đóng gói bản chơi thử).

## 1. Nhịp logic & tất định
- Bước logic cố định 0.05s (20 bước/giây giờ game). AI tướng thao tác mỗi 2 bước (nhịp nghĩ theo Phản Xạ), quyết định lớn (Utility AI) mỗi 0.3–0.5s, lệch pha giữa các tướng.
- Mọi ngẫu nhiên lấy từ bộ sinh số sfc32 có hạt giống, tách 3 luồng: giao tranh, AI, đấu trường (bo, thính). Đội hình lấy luồng riêng "lineup:<hạt giống>". Lượng giác tự viết bằng đa thức → cùng hạt giống cho cùng trận trên mọi máy.
- Chống vòng lặp phản đòn: độ sâu kích hoạt tối đa 3; tối đa 4000 sự kiện sát thương mỗi bước (vượt thì ghi lỗi, không treo).

## 2. Đấu trường
- Vuông 612×612 đv (GĐ8: diện tích ×2 so với 432×432; bố cục cũ nhân 1.4), tâm (306, 306), **7 vùng ngoài** (mỗi vùng ≈51.4°) + vùng trong. Ngưỡng khoảng cách của AI viết theo thang 1.6×.
- **8 vùng**: 🌲 Rừng Thông • 🐸 Đầm Lầy Sương • 💀 Vùng Tử Khí • ⛰ Núi Đá Đỏ • 🌾 Đồng Cỏ Vàng • ☣ Trạm Khí Độc • ❄ Tuyết Sơn • 🏛 Phế Tích Tân Thế (biome của 5 vùng thường đổi theo hạt giống). Phế Tích Tân Thế là vòng trong (bán kính 149). **2 vùng đặc biệt cố định** (GĐ8): 💀 Vùng Tử Khí (vùng 2) và ☣ Trạm Khí Độc (vùng 5) — không có điểm xuất phát, mỗi vùng một ổ boss, có hiểm họa riêng (mục 13f).
- 172 khối tường (vòng tường các ổ boss, đá vòng trong, vách xuyên tâm có khe, công trình, đá rải rác, tảng đá góc). Tìm đường: lưới nút + nút quanh đầu tường / tảng đá, Dijkstra từ mọi nút (số thực 64-bit).
- **4 ổ boss**: 🏛 Ổ Tân Thế (bán kính 22.7) • 💀 Hang Tử Khí (bán kính 18.4) • ☣ Lò Khí Độc (bán kính 18.4) • 💰 Kho Báu Hoàng Kim (bán kính 17) — mỗi ổ có 3 quái tuần tra đi vòng quanh (mục 8). 7 Thương Nhân (mỗi vùng ngoài 1, ở rìa Phế Tích) — chỉ mua được đồ / bình khi đứng trong 3.5 đv quanh Thương Nhân (hoặc trước giây 1).
- 56 bãi quái (Quái nhỏ ×35, Quái Vàng ×7, Quái Đỏ ×7, Quái Xanh ×7; vùng đặc biệt có bãi riêng, quái nhỏ đổi dáng theo vùng). 103 bụi cỏ. 10 điểm xuất phát ở 5 vùng thường, mỗi vùng 2 điểm → đầu trận xa nhau, ít chạm mặt.
- Quái nhỏ theo vùng (GĐ8): Sói Xám (chảy máu) • Ếch Độc (độc) • Bọ Đá • Bù Nhìn Sống (làm chậm) • Gấu Tuyết (làm chậm) • Thạch Quỷ • Rắn Cát (độc) • Hồn Ma (hút máu) • Chuột Đột Biến (chết thì nổ mây độc).
- **Chủ bãi đầu trận**: mỗi bãi thuộc tướng có điểm xuất phát gần nhất (hai người gần ngang nhau → bãi tranh chấp). 6 phút đầu AI né bãi của người khác (×0.15) và bãi tranh chấp (×0.2 trước phút 4, ×0.7 sau đó).

## 3. Bo (vùng an toàn)
- Bo ban đầu bán kính 440 (trùm cả bản đồ). Mỗi vòng: chờ rồi co dần về vòng kế; tâm vòng kế chọn ngẫu nhiên theo hạt giống, nằm trọn trong vòng hiện tại. Vòng kế được báo ngay khi vòng trước co xong (ai cũng thấy).
- Ngoài bo mất % máu tối đa mỗi giây (sát thương chuẩn, tính mỗi 0.5s).
| Vòng | Chờ | Co trong | Bán kính sau khi co | Co xong lúc | Ngoài bo mất |
|---|---|---|---|---|---|
| 1 | 420s | 160s | 290 | 9:40 | 1% máu/giây |
| 2 | 330s | 160s | 205 | 17:50 | 1.5% máu/giây |
| 3 | 300s | 160s | 142 | 25:30 | 2.5% máu/giây |
| 4 | 300s | 160s | 90 | 33:10 | 3.5% máu/giây |
| 5 | 270s | 160s | 48 | 40:20 | 5% máu/giây |
| 6 | 240s | 180s | 16 | 47:20 | 7% máu/giây |
- **Bo 6 không co về 0.** Hết 60:00 mà còn nhiều người thì những người còn trong trận **đồng hạng 1** (theo gợi ý trong GDD; nhà cái sẽ lợi dụng điều khoản này ở các giai đoạn sau).

## 4. Tướng: cấp, kinh nghiệm, hồi sinh, xếp hạng
- Cấp 1 → 18, mỗi cấp 1 điểm chiêu. S1–S3 tối đa 5 cấp (không quá nửa cấp tướng), S4 mở ở cấp 4, nâng ở 8 và 12. Skill phụ không tốn điểm.
- KN để lên cấp: 200 + 90 × (cấp − 1). Tổng KN tới cấp 18: 15640.
- KN hạ tướng (người ra đòn cuối): 120 + 30 × cấp nạn nhân. Không có KN hỗ trợ.
- **KN đuổi kịp**: thấp hơn cấp trung bình của những người còn trong trận thì KN quái +20% mỗi cấp (tối đa ×1.6); cao hơn trung bình quá 2 cấp thì −8% mỗi cấp (tối thiểu ×0.75).
- Máu tướng ×2.4 so với bản MOBA; tướng kiểu "Lì đòn" thêm ×1.15. Sát thương tướng (và vật triệu hồi) lên tướng ×0.6 (GĐ8: từ 0.55; 10 phút đầu tăng dần từ ×0.8 lên đủ) → giao tranh 10–120s tùy trận và người đánh.
- **Không tự hồi máu** (hồi máu cơ bản = 0). Hồi máu chỉ bằng bình, chiêu, hút máu, thính, thắng quyết đấu. Ngoài giao tranh (5s không trúng đòn, không đánh tướng) chỉ hồi 2% mana tối đa mỗi giây. Hồi mana cơ bản ×1.6, tiêu hao mana ×0.6 (đủ mana để xả chiêu suốt giao tranh dài).
- **Hồi sinh**: chết trong 30:00 đầu thì được hồi sinh **1 lần** sau 12s, với 70% máu, bất tử 2s, ở điểm xuất phát nằm trong bo xa người khác nhất (không có thì giữa vòng bo kế). Chết lần nữa, hoặc chết sau 30:00 → **bị loại**.
- **Xếp hạng** theo thứ tự bị loại; nhiều người bị loại trong cùng một bước logic thì đồng hạng. Còn ≤ 1 người → hết trận.
- Công hạ gục: người ra đòn cuối; chết vì bo/quái mà vừa bị tướng khác đánh (≤ 10s) thì công thuộc người gây nhiều sát thương nhất. **Kền kền** = người ra đòn cuối góp < 35% sát thương lên nạn nhân trong 10s cuối và có người khác góp nhiều hơn.

## 5. Sát thương
- Vật lý giảm theo Giáp, phép giảm theo Kháng Phép: hệ số = 100 / (100 + chỉ số) (chỉ số âm: 2 − 100/(100 − chỉ số)). Chuẩn không giảm.
- Xuyên giáp/xuyên phép: trừ % trước, trừ cố định sau, không xuống dưới 0.
- Chí mạng ×1.75. Tốc đánh giới hạn 0.2–2.5. Vung tay = 30% chu kỳ đánh. Đạn đánh thường mặc định 18 đv/s.
- Khiên hấp thụ trước máu. "Bất tử" giữ máu ≥ 1. Giảm sát thương nhận cộng dồn kiểu nhân. Kháng hiệu ứng rút ngắn mọi khống chế trừ hất tung (tối đa 60%).

## 6. Kinh tế
- Vàng khởi điểm 500; thu nhập 1.5 vàng/giây từ giây 60.
- Hạ tướng: 200 + lấy 20% vàng chưa tiêu của nạn nhân. **Truy nã**: nạn nhân đang chuỗi ≥ 2 mạng thì thêm 80 vàng mỗi mạng trong chuỗi (tối đa 5). Kẻ đang chuỗi ≥ 3 mạng bị lộ vị trí với mọi người.
- Quái, boss, thính: xem mục 7–9. Trang bị mua ở Thương Nhân (mục 14).

## 7. Quái rừng
- Bãi quái xuất hiện lúc 0:30; vàng/KN quái tăng 3 vàng, 5 KN mỗi phút; quái đuổi tối đa 10 đv, 8s không bị đánh thì về chỗ và hồi máu. Thưởng chỉ cho người ra đòn cuối.
| Bãi | Máu (+/phút) | Công (+/phút) | Giáp/KP | Vàng | KN | Hồi sinh |
|---|---|---|---|---|---|---|
| Quái Đỏ | 560 (+70) | 17 (+2.5) | 20/20 | 90 | 190 | 90s |
| Quái Xanh | 560 (+70) | 16 (+2.5) | 20/20 | 90 | 190 | 90s |
| Quái Vàng | 520 (+60) | 15 (+2.5) | 18/18 | 110 | 170 | 90s |
| Quái nhỏ | 300 (+40) | 10 (+2) | 10/10 | 60 | 140 | 60s |
- Bùa 90s (người mang bị hạ → bùa sang kẻ hạ gục): Đỏ +12% sát thương, thiêu 6/s • Xanh +6 hồi mana/s, −15% hồi chiêu (tướng không mana −20%) • Vàng +30% vàng nhận, +1.2 vàng/s.

## 7b. Quái GĐ11: dây xích rộng, bầy có đầu đàn, quái lang thang & boss nhỏ
- **Dây xích rộng hơn, kiên nhẫn hơn**: quái đuổi tối đa 10 đv quanh chỗ đứng, 8s không bị đánh mới chịu về và hồi máu (trước: ngắn hơn, dễ thả diều quái).
- **Bầy có đầu đàn**: 45% bãi quái nhỏ thành bầy — 1 **đầu đàn** (máu ×2.2, công ×1.4) + 2 con theo (máu ×0.6). Cả bầy luôn đánh **đúng mục tiêu của đầu đàn**; đánh một con là cả bầy quay sang. Con theo chết cho 40% thưởng.
- **Quái lang thang** (src/sim/roamers.js): từ giây 90, mỗi 75s một nhóm đi tuần (tối đa 6 nhóm cùng lúc) xuất hiện ở vùng hợp phe (theo biome), có đầu nhóm tinh anh. Phát hiện tướng thì đuổi 12–16 đv; tướng vào bụi / tàng hình 3s thì mất dấu. Thưởng: quái thường 35 vàng + 80 KN (8% rơi bình nhỏ), tinh anh 90 vàng + 200 KN, boss nhỏ 250 vàng + 450 KN (cộng thêm theo phút).
- 💀 **Binh Đoàn Xương** (vùng: Vùng Tử Khí, Núi Đá Đỏ):
  - **Lính Xương Cầm Khiên** — máu 380, công 16, giáp/KP 30/40, tốc 3: khiên trước mặt −30% sát thương từ phía trước • tinh anh **Đội Trưởng Hài Cốt** (máu 850): khiên trước mặt −30% sát thương từ phía trước, quét nón 2.6 đv mỗi 5s
  - **Cung Thủ Xương** — máu 300, công 18, giáp/KP 15/35, tốc 3.1, tầm 6.5: đánh xa • tinh anh **Xạ Thủ Hắc Cốt** (máu 620): mỗi đòn xé 15% Hộ Giáp, đánh xa
  - **Hài Cốt Dẫn Hồn** — máu 320, công 20, giáp/KP 12/45, tốc 3, tầm 6: đánh xa, sát thương phép • tinh anh **Trưởng Lão Vu Cốt** (máu 700): hào quang hồi máu + tăng tốc đồng đội, đánh xa, sát thương phép
- ☣ **Quái Vật Tận Thế** (vùng: Trạm Khí Độc, Phế Tích Tân Thế):
  - **Chó Săn Nhiễm Độc** — máu 340, công 17, giáp/KP 15/15, tốc 3.8: đòn độc • tinh anh **Chó Chúa Gai Nhọn** (máu 780): đòn độc, chết thì nổ độc 3 đv
  - **Bọ Thiết Giáp** — máu 520, công 15, giáp/KP 45/25, tốc 2.6: mai cứng −30% sát thương tầm xa • tinh anh **Bọ Chúa Phun Axit** (máu 900): mai cứng −30% sát thương tầm xa, phun vũng axit, đánh xa
- 👻 **Ma Hội** (vùng: Rừng Thông, Đầm Lầy Sương):
  - **Vong Hồn Trôi Dạt** — máu 300, công 15, giáp/KP 10/30, tốc 3.4: −20% tốc đánh 2s • tinh anh **Oan Hồn Thống Khổ** (máu 640): −20% tốc đánh 2s
  - **Đốm Lửa Ma Trơi** — máu 220, công 14, giáp/KP 5/25, tốc 4: lao vào tự nổ • tinh anh **Hỏa Tinh U Minh** (máu 520): lao vào tự nổ
  - **Hắc Ảnh Tập Kích** — máu 330, công 20, giáp/KP 15/20, tốc 3.5: đòn đầu từ bụi ×2 • tinh anh **Liêm Hồn Đao Phủ** (máu 700): đòn đầu từ bụi ×2
  - **Hồn Ma Đánh Lạc Hướng** — máu 300, công 14, giáp/KP 10/30, tốc 3.3: trúng đòn thì tàng hình 1s & dịch chuyển • tinh anh **Ảo Ảnh Ma Cô** (máu 620): trúng đòn thì tàng hình 1s & dịch chuyển
  - **Quỷ Hồn Gào Thét** — máu 290, công 17, giáp/KP 10/35, tốc 3.2, tầm 6: tiếng gào làm chậm quanh mục tiêu, đánh xa, sát thương phép • tinh anh **Banshee Tiếng Hét** (máu 640): tiếng gào làm chậm quanh mục tiêu, hét câm lặng 1s mỗi 6s, đánh xa, sát thương phép
- **8 boss nhỏ** (từ 5:00, mỗi 210s, tối đa 2 con cùng lúc; mỗi con 2 kỹ năng có vùng cảnh báo):
| Boss nhỏ | Phe | Máu (+/phút) | Công (+/phút) | Giáp/KP | Kỹ năng (hồi) |
|---|---|---|---|---|---|
| Đao Phủ Hài Cốt | 💀 Binh Đoàn Xương | 2400 (+120) | 70 (+3.5) | 40/25 | Trảm Quyết Tàn Bạo (8s) • Gai Xương Địa Ngục (14s) |
| Kỵ Sĩ Xương | 💀 Binh Đoàn Xương | 2100 (+110) | 65 (+3.2) | 35/35 | Xung Phong Phá Trận (10s) • Cắm Cờ Tử Thần (16s) |
| Cự Ma Khung Xương | 💀 Binh Đoàn Xương | 3200 (+150) | 80 (+4) | 50/20 | Ném Khối Hài Cốt (9s) • Lốc Xoáy Khung Xương (18s) |
| Thực Thể Ghép Xác | ☣ Quái Vật Tận Thế | 2800 (+130) | 75 (+3.8) | 30/30 | Móc Xích Máu Thịt (11s) • Bộc Phá Khí Độc (15s) |
| Bạo Chúa Hai Đầu | ☣ Quái Vật Tận Thế | 3000 (+140) | 85 (+4.2) | 45/25 | Tiếng Hú Chấn Động (10s) • Bổ Nhào Nghiền Nát (14s) |
| Nhện Gai Tử Thần | ☣ Quái Vật Tận Thế | 2200 (+110) | 70 (+3.5) | 25/40 | Quấn Kén Khống Chế (9s) • Mưa Gai Axit (13s) |
| Quái Bùn Sludge | ☣ Quái Vật Tận Thế | 2600 (+120) | 60 (+3) | 35/45 | Phun Pháo Bùn Thải (8s) • Nuốt Chửng & Bắn Trả (16s) |
| Giáo Chủ Ma Hội | 👻 Ma Hội | 2600 (+125) | 78 (+3.8) | 25/55 | Ma Trận Hút Hồn (10s) • Vạn Hồn Cuồng Nộ (16s) |
- **Tiếng đánh quái vang 35 đv**: tướng nghe thấy người khác đang đánh quái lang thang/boss nhỏ → có thể kéo tới kền kền hoặc săn người đang yếu. AI có hành động riêng 💀 **Săn quái lang thang** (Utility).

## 8. Boss (GĐ8: 4 ổ, 7 boss, mọi chiêu lớn đều có vùng cảnh báo)
| Boss | Ổ | Máu (+/phút) | Công (+/phút) | Giáp/KP | Chiêu có cảnh báo | Thưởng (người ra đòn cuối) |
|---|---|---|---|---|---|---|
| 🏛 Boss Tân Thế | Ổ Tân Thế | 5200 (+180) | 100 (+5) | 40/40 | Dậm Đất Tân Thế | 250 vàng, 450 KN, 🏛 Ấn Tân Thế +25% sát thương 120s (Tân Thế cường hóa: +40%), 1 mảnh hồn Tím–Đỏ, Ý Niệm +1 |
| 🔥 Phượng Hoàng | Lò Khí Độc | 5200 (+150) | 85 (+4.5) | 40/50 | Bão Lửa Tàn Lụi, Vũ Điệu Tro Tàn, Mưa Lông Lửa Khởi Tử | 400 vàng, 600 KN, bùa 🔥 **Ấn Niết Bàn** (120s), 1 mảnh hồn Tím–Đỏ |
| ⚔ Thiết Minh Quân | Hang Tử Khí | 5800 (+160) | 95 (+5) | 55/40 | Minh Kình Phách Địa, Thiết Xích Đoạt Mệnh, Thiết Giáp Bão Tố | 400 vàng, 600 KN, bùa ⚔ **Minh Tướng Huyết Trảm** (120s), 1 mảnh hồn Tím–Đỏ |
| 👻 Thiên Hồn Chủ | Hang Tử Khí | 5000 (+150) | 80 (+4.5) | 35/60 | Hồn Trận Hút Sinh Mệnh, Vạn Hồn Thiên Giáng, Thập Tự Đoạt Hồn | 400 vàng, 600 KN, bùa 👻 **Hồn Thần Bất Diệt** (120s), 1 mảnh hồn Tím–Đỏ |
| 💰 Quái Thú Hoàng Kim | Kho Báu Hoàng Kim | 9000 (+180) | 110 (+5.5) | 60/50 | Kim Giác Húc, Địa Chấn Hoàng Kim, Mưa Kim Sa Bộc Phá | 5000 vàng, balo lên cấp 6, 2 Bình Rực Rỡ, Ý Niệm Rực Rỡ, 3 món Hoàng Kim ngẫu nhiên |
| 🐉 Rồng Cổ Đại | Tâm bo (từ bo 4) | 10000 (+200) | 120 (+6) | 60/60 | Long Tức Nguyên Thủy, Long Giáng Trảm Địa, Thiên Hỏa Truy Kích | 600 vàng, 1000 KN, bùa 🐉 **Long Hỏa & Long Uy** (240s), 1 mảnh hồn Tím–Đỏ |
| ⚔ Kiếm Sư Vĩ Đại | Lò Khí Độc | 7000 (+160) | 100 (+5) | 45/45 | Nhất Kiếm Đoạt Mệnh, Vạn Kiếm Quy Tông, Ảo Ảnh Tam Kiếm | 600 vàng, 1 món Hoàng Kim + ⚔ Lưỡi Kiếm Sắc Bén (độc quyền) + ✨ Mảnh Hồn Ý Chí + Ý Niệm Rực Rỡ |
- Lịch ổ: 🏛 Ổ Tân Thế: Boss Tân Thế (lần đầu 4:00, bị hạ thì 300s sau ra con kế) • 💀 Hang Tử Khí: Thiết Minh Quân → Thiên Hồn Chủ (lần đầu 6:00, bị hạ thì 240s sau ra con kế) • ☣ Lò Khí Độc: Phượng Hoàng → Kiếm Sư Vĩ Đại (lần đầu 7:00, bị hạ thì 300s sau ra con kế) • 💰 Kho Báu Hoàng Kim: Quái Thú Hoàng Kim (lần đầu 13:00, bị hạ thì 600s sau ra con kế). Báo trước 20s. Ổ nằm ngoài bo thì boss không ra.
- **Rồng Cổ Đại**: khi bo 4 bắt đầu co, Boss Tân Thế bay đi; 20s sau Rồng hạ cánh ở **tâm vòng bo hiện tại** (mọi người đều ở gần) — cuối trận luôn có con boss mạnh nhất để tranh.
- Boss nhắm theo **bảng thù hận** (sát thương gây ra, giảm dần; đổi mục tiêu khi kẻ khác vượt 30%); 10s không ai đánh thì hồi 0.4% máu/giây. Ai bắt đầu đánh boss (sau 30s yên ắng) thì **cả bản đồ được báo** ("⚠ X đang đánh boss") → nhiều AI kéo tới tranh boss. Mỗi ổ có 3 quái tuần tra (Thạch Vệ / Vong Hồn / Đột Biến Thể / Kim Giáp Trùng) đi vòng quanh, bị hạ thì 120s sau ra lại.
- **Bùa lợi boss** (ai cũng thấy biểu tượng trên đầu người mang; AI biết bùa của mình và của người khác):
  - 🔥 **Ấn Niết Bàn** (120s): Bị hạ gục: hồi sinh ngay tại chỗ với 100% máu, giữ nguyên toàn bộ đồ, bất tử 1.5s.
  - ⚔ **Minh Tướng Huyết Trảm** (120s): Kết liễu một tướng: hồi 100% máu và nhận Giáp Ảo bằng 50% máu tối đa trong 15s.
  - 👻 **Hồn Thần Bất Diệt** (120s): Nhận đòn chí mạng (đáng lẽ phải chết): hồi 100% máu và bất tử tuyệt đối 2s.
  - 🐉 **Long Hỏa & Long Uy** (240s): +35% sát thương; mọi đòn thiêu 2.5% máu tối đa mỗi giây trong 4s, ngăn hồi máu và phá tàng hình.
- **Đồ Hoàng Kim** (chỉ từ Quái Thú Hoàng Kim / Kiếm Sư Vĩ Đại; không chiếm ô trang bị):
  - 🛡 **Giáp Hoàng Kim**: +100% Hộ Giáp tối đa, +20% kháng mọi sát thương. Kim Thân Bất Diệt: Hộ Giáp vỡ → sóng đẩy lùi kẻ địch quanh 3 đv và miễn sát thương 1.5s (hồi 30s).
  - 🗡 **Kiếm Hoàng Kim**: +40% Công Vật Lý, +30% tốc đánh. Kim Quang Trảm: bỏ qua 40% giáp; đòn đánh thứ 3 liên tiếp nổ kim quang lan diện rộng.
  - 💠 **Ý Niệm Hoàng Kim**: Mở tối đa 6 ô khảm mảnh hồn; Cộng Hưởng Ý Niệm: +30% hiệu lực mọi mảnh hồn đang gắn.
  - ✨ **Mảnh Hồn Hoàng Kim**: +1200 máu, +25% công, +15% hút máu; hạ gục tướng: hồi ngay mọi chiêu di chuyển và 25% máu.
  - ⚔ **Lưỡi Kiếm Sắc Bén** (độc quyền Kiếm Sư): Độc quyền của Kiếm Sư Vĩ Đại: +60 SMVL, +35% tốc đánh, +30% xuyên giáp. Kích hoạt (hồi 120s): chém luồng đại kiếm khí bán nguyệt bay 15 đv xuyên mọi vật cản, sát thương cực mạnh và câm lặng 1.5s.
- **AI với boss**: điểm "tranh boss" xét đủ mọi ổ — ước lượng thời gian hạ (theo giáp/kháng phép của boss), có kịp không, đang có ai đánh (cướp khi boss < 35%), giá trị từng boss; Con Bạc / Khát Nước / Thực Dụng / Hổ Báo (Jack, Percy, Roxie, Borg) ×2.0 với Quái Thú Hoàng Kim; máu < 30% thì rút khỏi boss; tướng "khôn" (Alice, Chrononeo, Raven, Lyra) tránh kẻ đang mang Long Hỏa ×1.9. Mang Minh Tướng → hổ báo ×2.0; mang Hồn Thần / Niết Bàn → không rút lui (hổ báo ×1.5). Có Ý Chí thì mở màn bằng đòn mạnh nhất.
- **Né cảnh báo**: hình chữ nhật / hình nón → né ngang; vòng tròn quanh boss → lướt / dây móc ra ngoài hoặc lùi; vành khăn (3–10 đv) → cách tâm ≤ 5 đv thì lướt vào tâm, xa hơn thì chạy ra ngoài 10 đv; vòng rơi bám theo người → chạy chéo. Dùng Lưu Vân / chiêu lướt / dây móc nếu có.

## 9. Thính (tiếp tế)
- 6 lần thính: 6:00, 14:00, 22:00, 30:00, 38:00, 45:00; báo trước 45s (vị trí ngẫu nhiên theo hạt giống trong vòng bo kế tiếp, ai cũng thấy).
- Mở thính: đứng trong 2.2 đv, **một mình**, không trúng đòn trong 0.6s, không niệm chiêu, đủ 3s (bị gián đoạn thì tiến độ tụt dần).
- Phần thưởng: 400 vàng, 600 KN, hồi 50% máu, **mảnh hồn Vàng** (2 lần thính cuối: 40% ra mảnh hồn **Đỏ**) và +2 bình máu. (GĐ8 thêm ý niệm vàng.)

## 10. Tầm nhìn
- Mỗi tướng chỉ thấy bằng mắt mình (mỗi tướng một phe): bán kính 16 đv (GĐ8: từ 12; vật triệu hồi 8). Sương Đầm Lầy ×0.8, tử khí ×0.7. Đứng trong bụi thì người ngoài bụi không thấy, trừ khi trong 2.5 đv.
- Nhận thức (Đọc Bản Đồ): đối thủ trong 13 đv biết ngay; xa hơn chỉ cập nhật sau độ trễ 0.25–1.75s, mỗi lần có thể bỏ sót. Nghe tiếng giao tranh trong 35–55 đv (theo Đọc Bản Đồ) dù không thấy.
- **Người chơi thấy hết như trọng tài**: không sương mù, thấy cả vị trí trong bụi, ảo ảnh (đánh dấu ✦) và suy nghĩ của AI.

## 11. Tính cách tướng (GĐ7: 31 tính cách, cố định theo tướng)
| Tính cách | Lối chơi | Độ hổ báo | Trọng số hành động | Chỉ số (nền 13) | Balo mong muốn | Tướng |
|---|---|---|---|---|---|---|
| 🔥 Hổ Báo | Thích lao vào đánh, ít chịu rút, hay đi săn. | ×1.25 | hunt ×1.35, vulture ×0.85, farm ×0.9, hide ×0.6, heal ×0.85, retreat ×0.8, boss ×1.1, drop ×1.1, duel ×1.5, loot ×1.1 | Giao Tranh +2, Kỷ Luật -2 | - | Borg, Ratok |
| 🪨 Lì Lợm | Giữ mình, chịu đòn, cuối trận núp kỹ, ít đi săn. | ×0.85 | hunt ×0.75, hide ×1.4, heal ×1.2, zone ×1.15, retreat ×1.15, vulture ×0.9, boss ×0.85, drop ×0.85, duel ×0.6, loot ×0.85 | Tâm Lý +3, Thể Lực +2, Giao Tranh -1 | - | Elara |
| 🌾 Tham Farm | Ăn quái, tranh boss, mua đồ; tránh đánh sớm. | ×0.95 | farm ×1.4, boss ×1.2, shop ×1.15, hunt ×0.8, vulture ×0.9, hide ×0.9, duel ×0.9, loot ×1.2, chest ×1.2 | Ăn Quái +4, Giao Tranh -1 | - | Chrono & Neo |
| 🗡 Ám Sát | Săn kẻ đứng lẻ, máu thấp; phục kích trong bụi. | ×1.1 | hunt ×1.25, hide ×1.2, vulture ×1.1, farm ×0.9, boss ×0.85, duel ×1.1, loot ×1.1 | Kỹ Năng +2, Phản Xạ +2, Tâm Lý -1 | - | Death, Tsukiyo |
| 🦅 Kền Kền | Chờ hai người đánh nhau tới kiệt sức rồi vào dọn. | ×1 | vulture ×1.7, hunt ×0.85, hide ×1.1, duel ×0.7, loot ×1.5 | Đọc Bản Đồ +3, Giao Tranh -1 | - | Victoria |
| 🎲 Con Bạc | Ham thính và boss, dám liều. | ×1.15 | drop ×1.45, boss ×1.3, hunt ×1.05, retreat ×0.85, hide ×0.8, duel ×1.35, loot ×1.3, chest ×1.2 | Tâm Lý +2, Kỷ Luật -2 | - | Jack "Sáu Lỗ" |
| 🕊 Hòa Bình | Không bao giờ ra tay trước; nhặt đồ hồi máu, tránh xa tiếng giao tranh; chỉ đánh trả khi máu bị đe dọa hoặc hộ vệ đã lao vào. | ×0.6 | hunt ×0.05, vulture ×0.1, duel ×0.1, heal ×1.5, hide ×1.3, chest ×1.4, loot ×0.4, boss ×0.3, drop ×0.5, farm ×1.1, retreat ×1.3 | Tâm Lý +4, Đọc Bản Đồ +2, Giao Tranh -3 | hp×6 💚×2 🛡×1 🌫×1 👻×1 | Aria & Oktava |
| ⚔ Võ Sĩ Danh Dự | Ghét ăn hôi; chờ kẻ thắng giao tranh hồi sức rồi mới thách đấu tay đôi; mê cổng quyết đấu. | ×1.1 | vulture ×0, duel ×2, hunt ×0.9, loot ×0.6, hide ×0.5 | Giao Tranh +3, Kỷ Luật +3, Tâm Lý +1, Đọc Bản Đồ -1 | - | Valerius |
| 💰 Thực Dụng | Né đánh đầu trận, gom vàng, đúc vũ khí lên Vàng/Đỏ ở Thương Nhân; đủ đồ mới đi săn. | ×0.85 | farm ×1.5, shop ×1.4, chest ×1.4, hunt ×0.6, duel ×0.4, boss ×1.1, vulture ×0.8 | Ăn Quái +4, Kỷ Luật +2, Giao Tranh -1 | hp×5 ⚡×1 🛡×1 | Dr. Caelus |
| 🃏 Quấy Nhiễu | Cướp đồ ngay trước mặt người khác, đặt bẫy trêu ngươi, cấu một phát rồi dây móc chuồn. | ×1.05 | loot ×1.8, drop ×1.4, chest ×1.5, vulture ×1.2, hunt ×0.9 | Phản Xạ +3, Kỹ Năng +1, Kỷ Luật -3 | 🪤×3 🪝×2 ⚡×1 hp×4 | Wukong, Kip |
| 📿 Cuồng Tín | Truy sát "dị giáo" (Death) tới cùng trời cuối đất, kể cả ngoài bo. | ×1.2 | hunt ×1.2, zone ×0.8, hide ×0.5 | Tâm Lý +3, Giao Tranh +1, Kỷ Luật -2 | 📜×2 👻×1 hp×5 | Diệp Thanh Phong, Olivia, Justus, Ariston |
| 🐀 Chuột Lũi | Sống sót là trên hết: lủi trong bụi, tránh mọi giao tranh, chỉ cắn khi bị dồn vào góc. | ×0.55 | hide ×2, heal ×1.4, retreat ×1.5, zone ×1.3, hunt ×0.15, vulture ×0.3, duel ×0.1, boss ×0.3, drop ×0.3, loot ×0.6 | Đọc Bản Đồ +4, Phản Xạ +2, Giao Tranh -3 | hp×6 🌫×1 👻×2 ⚡×1 | Lyra |
| 😈 Kẻ Bắt Nạt | Đuổi đánh kẻ có vũ khí kém hơn hoặc dưới 50% máu; gặp vũ khí Vàng/Đỏ hay kẻ mạnh hơn thì giữ khoảng cách. | ×1.15 | hunt ×1.4, vulture ×1.1, duel ×0.5 | Giao Tranh +2, Tâm Lý -3 | 🔥×1 🥀×1 👻×1 |  |
| 🚧 Gác Cổng | Vào bo sớm 30 giây, giữ lối vào; phục kích kẻ chạy bo và dùng khống chế giữ chúng ngoài bão. | ×1.05 | zone ×1.3, hunt ×0.8, farm ×0.9 | Đọc Bản Đồ +3, Kỷ Luật +2 | 🪤×2 🥀×1 hp×5 | Clint |
| 🎰 Con Bạc Khát Nước | Bỏ bãi quái nhỏ; lao vào cướp thính và boss dù có 3–4 kẻ quanh đó; càng ít máu càng liều. | ×1.2 | drop ×2, boss ×1.9, duel ×1.4, chest ×1.2, hide ×0.5, retreat ×0.7 | Tâm Lý +1, Kỷ Luật -3, Giao Tranh +1 | ☄×2 ⚡×1 🛡×1 | Luca |
| 🏰 Lãnh Chúa Cứ Điểm | Chiếm công trình vững gần tâm bo, đặt bẫy ở lối vào, không rời đi tới khi bo ép; ai bước vào 15 đv là dồn hỏa lực. | ×1 | hunt ×0.4, vulture ×0.4, roam ×0.6, duel ×0.3 | Kỷ Luật +3, Thể Lực +2, Phản Xạ -1 | 🪤×3 🛡×1 💚×1 hp×5 | Gideon |
| 🛡 Vệ Sĩ Thầm Lặng | Âm thầm bảo vệ một người (tạm: kẻ yếu nhất — chờ cốt truyện); đi theo cách 15–25 đv, ai đánh người đó là can thiệp ngay; không bao giờ đánh người mình bảo vệ. | ×1.05 | hunt ×0.5, vulture ×0.3, duel ×0.4 | Kỷ Luật +3, Đọc Bản Đồ +2, Tâm Lý +1 | 🛡×1 🥀×1 ⚡×1 | Theron |
| 💣 Kẻ Đổi Mạng | Bình thường thận trọng; dưới 15% máu mà bị dồn thì tung hết (chiêu cuối, bom, khống chế) và kéo kẻ gần nhất xuống bão / ra khỏi vách. | ×0.9 | hide ×1.2, hunt ×0.8 | Tâm Lý +2, Giao Tranh +1 | 💣×2 hp×5 | Kazuki |
| 🐺 Thợ Săn Bắt Lẻ | Không bao giờ chen vào trận có 3 người trở lên; đi dọc rìa vắng, ép 1v1 kẻ đi lẻ. | ×1.05 | vulture ×0, hunt ×1.3, roam ×1.3 | Đọc Bản Đồ +2, Giao Tranh +2, Tâm Lý -1 | 🔥×1 ⚡×1 | Percy |
| 👻 Thoát Xác | Dưới 75% máu là rút; đánh rồi chạy — lùi ~20 đv hồi sức rồi quay lại cấu tiếp. | ×1 | heal ×1.4, retreat ×1.3, hunt ×1 | Phản Xạ +3, Kỹ Năng +1, Thể Lực -2 | hp×7 👻×1 ⚡×1 | Vesper |
| ⛰ Tiên Tri Địa Hình | Ngại đánh trên đất bằng; chiếm chỗ cao bằng dây móc và đứng đó mà bắn; bị kéo xuống thì leo lại. | ×1 | hunt ×0.6, vulture ×0.8 | Đọc Bản Đồ +3, Kỹ Năng +1 | 🪝×2 hp×5 | Raven |
| 🎯 Kẻ Trảm Tướng | Săn kẻ dẫn đầu số mạng, kẻ cầm vũ khí Đỏ hay kẻ đang có bùa boss; bỏ qua kẻ yếu. | ×1.15 | hunt ×1.4, vulture ×0.5, farm ×0.9 | Giao Tranh +2, Đọc Bản Đồ +2, Tâm Lý -1 | ⚡×1 🔥×1 👻×1 | Ryoma, Florian, Bạch Diệp |
| 🔥 Gieo Rắc Hỗn Loạn | Kích nổ thùng thuốc nổ và bẫy môi trường khi có người đứng gần; ném bom vào giữa đám đông. | ×1.1 | vulture ×1.3, hunt ×0.9 | Kỹ Năng +2, Kỷ Luật -3 | 💣×2 🪤×1 | Ignatius |
| 🎣 Thợ Săn Mồi Câu | Lấy rương đồ làm mồi, đặt bẫy quanh rồi núp cách 20–30 đv; kẻ nào đứng mở rương là lao vào dồn sát thương. | ×1 | chest ×0.4, hunt ×0.8, hide ×1.1 | Đọc Bản Đồ +3, Kỷ Luật +2 | 🪤×3 🪝×1 hp×4 | Alice |
| 🌪 Bóng Ma Rìa Bão | Tích bình và phù kháng độc; đi sát mép bão sau lưng mọi người; đâm kẻ vừa vào được vùng an toàn và đang uống bình. | ×1.05 | zone ×0.6, hide ×0.7 | Thể Lực +3, Đọc Bản Đồ +2 | hp×7 📜×2 | Galo |
| 🎭 Ngụy Quân Tử | Đầu–giữa trận đề nghị đình chiến, cùng đánh quái và kẻ thứ ba; khi đồng minh dưới 30% máu hoặc cúi xuống mở rương thì đâm sau lưng. | ×1 | vulture ×1.2, hunt ×0.9 | Tâm Lý +2, Đọc Bản Đồ +2, Giao Tranh +1 | 🔥×1 🥀×1 | Dahlia |
| 📐 Cầu Toàn | Phải lên đúng bộ sở trường: luôn theo lối build số 1, không đổi món theo đối thủ; chỉ gắn mảnh hồn yêu thích / hợp build, săn và đổi chác cho bằng đủ bộ; chưa đủ bộ thì ngại đánh lớn. | ×0.95 | farm ×1.25, shop ×1.3, chest ×1.2, loot ×1.4, hunt ×0.85, duel ×0.8, vulture ×0.9 | Kỷ Luật +3, Ăn Quái +2, Phản Xạ -1 | - | Zero, Dr. Vector |
| ⚖ Thương Nhân | Buôn bán với bất kỳ ai không đang đánh nhau: gạ đình chiến ngắn để mua mảnh hồn người ta không cần (giá 60%), bán lại cho người cần (giá 130%), bán cả vật phẩm; giữ kho hàng 4 mảnh; giữ chữ tín, không bao giờ bịp; ngại đánh nhau. | ×0.85 | farm ×1.2, shop ×1.4, chest ×1.3, loot ×1.5, hunt ×0.7, duel ×0.6, vulture ×0.8 | Tâm Lý +2, Đọc Bản Đồ +2, Ăn Quái +1, Giao Tranh -2 | hp×5 🪤×1 🪝×1 ⚡×1 👻×1 | Roxie & T-Zero |
| 🎭 Kẻ Bịp Bợm | Gạ đổi chác / liên minh với bất kỳ ai để lừa: bán mảnh dỏm giá cao, đổi gian, báo tin giả dụ người ta vào bẫy của mình; liên minh tạm thì gần như chắc chắn bịp; ai từng bị lừa thì không tin nữa. | ×1 | loot ×1.4, chest ×1.2, vulture ×1.2, hunt ×0.9, duel ×0.7 | Tâm Lý +3, Phản Xạ +2, Kỷ Luật -2 | 🪤×3 👻×1 ⚡×1 hp×4 | Joker, Mirage |
| 🌋 Cuồng Loạn | Gặp ai đánh nấy, gặp cái gì phá cái đó (tướng, quái, boss); không bao giờ lùi, đánh tới chết. | ×1.6 | hunt ×2, vulture ×1.4, boss ×1.6, farm ×1.2, duel ×2, drop ×1.3, retreat ×0, hide ×0.1, heal ×0.3, zone ×0.7 | Giao Tranh +3, Thể Lực +2, Kỷ Luật -5, Đọc Bản Đồ -2 | hp×4 👻×1 🩸×2 🪶×1 | Koda, Boran |
| 🙂 Bình Thường | Không có gì đặc biệt: mọi hành động cân bằng, không thiên lệch, không luật riêng. | ×1 |  |  | - |  |

**Hành động lớn riêng của tính cách mới** (src/sim/ai/persona.js — chỉ tính cách tương ứng mới chấm điểm được):
- 🤺 **Thách đấu** (challenge, giữ tối thiểu 4s)
- 🛡 **Hộ tống** (guard, giữ tối thiểu 3s)
- 🏰 **Giữ cứ điểm** (bunker, giữ tối thiểu 6s)
- 🚧 **Gác lối bo** (ambush, giữ tối thiểu 5s)
- ⛰ **Chiếm chỗ cao** (highground, giữ tối thiểu 5s)
- 📿 **Truy sát dị giáo** (zealot, giữ tối thiểu 5s)
- 💥 **Kích nổ** (chaos, giữ tối thiểu 2s)
- 🎣 **Giăng mồi** (bait, giữ tối thiểu 6s)
- 🌪 **Bám mép bão** (crawl, giữ tối thiểu 4s)
- 🤝 **Liên minh** (truce, giữ tối thiểu 3s)
- 📣 **Theo tin đồng minh** (lure, giữ tối thiểu 3s)
- Các hành động "giữ vị trí" (hộ tống, giữ cứ điểm, chiếm chỗ cao, giăng mồi, bám mép bão, núp của Chuột Lũi / Hòa Bình) mạnh dần theo thời gian trận và giảm 40% khi tướng tụt cấp hơn mặt bằng 2 cấp — đầu trận vẫn phải ăn quái.
- Dị giáo của Cuồng Tín: Death (cốt truyện bổ sung sau). Người được Vệ Sĩ Thầm Lặng bảo vệ: tạm thời là tướng có sức mạnh thấp nhất lúc đầu trận (chờ cốt truyện).

## 12. Nhân vật (GĐ7: bỏ người triệu gọi)
- Mỗi tướng là một nhân vật cố định: 8 chỉ số bản lĩnh 1–20 (Kỹ Năng, Đọc Bản Đồ, Giao Tranh, Kỷ Luật, Phản Xạ, Tâm Lý, Thể Lực, Ăn Quái) = nền 13 cộng/trừ theo tính cách (bảng trên); thành thạo tướng 80. Tên = tên tướng.
- Chỉ số quy về 0..1 rồi nhân hệ số thành thạo (0 → ×0.455, 70 → ×0.91, 100 → ×1.0). Sau phút 15 Thể Lực thấp làm các chỉ số khác giảm dần; mất bình tĩnh × (1 − 0.25 × mức).

## 13. AI sinh tồn (2 tầng)
- **Tầng chiến lược — Utility AI** (mỗi 0.3–0.5s; nguy cấp hoặc đang bị bo đốt thì quyết ngay): chấm điểm từng hành động bằng trung bình nhân các yếu tố (0..1), nhân trọng số tính cách × mất bình tĩnh × chuỗi hạ gục, cộng **động lực làm tiếp việc đang làm 0.35 + 0.1 × Kỷ Luật** (GĐ6b: từ 0.2 lên 0.45; quyết gấp thì một nửa), nhiễu ±(0.02 + 0.08 × mất bình tĩnh); **bốc ngẫu nhiên có trọng số** trong nhóm ≤ 0.12 dưới điểm cao nhất (nhiệt độ 0.03 + 0.05 × (1 − Kỷ Luật) + 0.06 × mất bình tĩnh); chưa đủ thời gian tối thiểu thì chỉ đổi khi việc mới hơn ≥ 0.45. Ghi 3 lựa chọn điểm cao nhất kèm lý do.
  - 🌲 **Ăn quái** (farm, giữ tối thiểu 4s)
  - 💀 **Săn quái lang thang** (monhunt, giữ tối thiểu 5s)
  - 🎯 **Đi săn** (hunt, giữ tối thiểu 4s)
  - 👑 **Tranh boss** (boss, giữ tối thiểu 5s)
  - 📦 **Tranh thính** (drop, giữ tối thiểu 5s)
  - 🌀 **Chạy bo** (zone, giữ tối thiểu 3s)
  - 🌿 **Núp / phục kích** (hide, giữ tối thiểu 5s)
  - 💚 **Hồi máu** (heal, giữ tối thiểu 3s)
  - 🦅 **Làm kền kền** (vulture, giữ tối thiểu 4s)
  - 🛒 **Đi shop** (shop, giữ tối thiểu 4s)
  - 🚶 **Đi tuần** (roam, giữ tối thiểu 4s)
  - 🏃 **Rút lui** (retreat, giữ tối thiểu 1.5s)
  - ⚔ **Quyết đấu** (duel, giữ tối thiểu 6s)
  - 💠 **Nhặt mảnh hồn** (loot, giữ tối thiểu 3s)
  - 🎁 **Mở rương** (chest, giữ tối thiểu 3s)
  - 🤺 **Thách đấu** (challenge, giữ tối thiểu 4s)
  - 🛡 **Hộ tống** (guard, giữ tối thiểu 3s)
  - 🏰 **Giữ cứ điểm** (bunker, giữ tối thiểu 6s)
  - 🚧 **Gác lối bo** (ambush, giữ tối thiểu 5s)
  - ⛰ **Chiếm chỗ cao** (highground, giữ tối thiểu 5s)
  - 📿 **Truy sát dị giáo** (zealot, giữ tối thiểu 5s)
  - 💥 **Kích nổ** (chaos, giữ tối thiểu 2s)
  - 🎣 **Giăng mồi** (bait, giữ tối thiểu 6s)
  - 🌪 **Bám mép bão** (crawl, giữ tối thiểu 4s)
  - 🤝 **Liên minh** (truce, giữ tối thiểu 3s)
  - 📣 **Theo tin đồng minh** (lure, giữ tối thiểu 3s)
  - Ăn quái: **lượng sức** — ước lượng máu sẽ mất để dọn bãi (máu quái ÷ sát thương mình × sát thương quái); không đủ 85% máu đang có thì bỏ qua; **đã đánh dở thì ăn cho hết bãi** (×1.5, giữ bãi đó). Bãi gần (≤ 70 đv), đang tới thì giữ ×1.3, có đối thủ quanh bãi ×0.55 mỗi người, 8 phút đầu ưu tiên bãi trong "lãnh địa" (quanh điểm xuất phát), bỏ bãi ngoài bo hiện tại / ngoài bo kế khi sắp co; đứng trong dây xích quái để quái không chạy về hồi máu.
  - Đi săn: con mồi đã thấy ≤ 6s, ≤ 64 đv, tương quan **sức mạnh** ≥ 1.2, đứng lẻ; thù dai ×1.25, **KS: máu con mồi < 40% thì ×(1.3 + (0.4 − máu) × 2.5)**, truy nã ×1.3; giai đoạn nhân thẳng 0.2 → 1 (phút 4 → 25), mạng cuối ×0.8, còn ≤ 3 người ×0.5 (giữ hạng, chờ bo ép); kiên nhẫn 10–18s (Kỷ Luật) rồi chán.
  - Quyết đấu: tới cổng khi tự tin (sức mạnh so với người đã ghi danh, hoặc với đối thủ trung bình), máu ≥ 50%, kịp tới; thưởng lớn nên nhân ×1.9.
  - Kền kền: nghe/thấy hai người khác đánh nhau, đứng ở bụi gần đó, chờ hai bên còn trung bình < 45% máu (hoặc một bên < 30%) rồi vào dọn; thấy kẻ máu < 30% đang mải đánh người khác thì "cướp mạng".
  - Tranh boss (đủ cấp + đồ, hoặc cướp boss < 35% máu), tranh thính (kịp tới, ít người tranh), chạy bo (lấy lớn nhất: đang ngoài bo / áp lực thời gian), núp (còn ≤ 6 người hoặc từ phút 15), hồi máu (chỗ nghỉ xa đối thủ, trong bo, ưu tiên bụi), đi shop (đủ tiền), rút lui (lấy lớn nhất: thế trận bất lợi / máu thấp / hết mana).
- **Sức mạnh** (AI tự tính): sức mạnh = máu hiệu dụng (máu × giáp/kháng phép, cả khiên) × sát thương/giây (đánh thường + chiêu đã học, theo hồi chiêu) ÷ 100. Thế trận = tổng sức mạnh phe mình ÷ tổng sức mạnh đối thủ quanh đây (kẻ đang nhắm mình tính đủ, kẻ đang bận đánh người khác ×0.35, kẻ đang tiến về phía mình ×0.8, quái đang đánh mình tính theo cùng thang).
- **Tầng chiến thuật** (mỗi nhịp nghĩ): né chiêu định hướng & vùng sắp trúng chiêu → đánh giá thế trận → chọn mục tiêu bằng điểm: **KS** (máu thấp: (1 − máu)^1.6 × (1.2 + Giao Tranh); hạ được ngay bằng một đợt dồn đòn +1.3), mỏng manh, đang đánh mình, **khó chịu**, thù dai, con mồi, cướp mạng → ngưỡng giao chiến (đầu trận 1.5, sau đó 1.1, mạng cuối 1.2; bị đánh thì luôn đánh trả) → vi mô giao tranh (thả diều, dụ đòn, đọc đòn) → bị đuổi thì chấm chạy / chiêu thoát thân / cắt đuôi qua bụi / quay lại đánh.
- **Khó chịu**: bị đánh thì độ khó chịu với kẻ đánh tăng theo % máu mất × (1.3 − 0.6 × Tâm Lý), giảm dần ×0.985 mỗi nhịp nghĩ. Đã có mục tiêu thì **bám mục tiêu**; chỉ đổi khi kẻ khác làm mình khó chịu vượt ngưỡng 15 + 25 × Tâm Lý, hoặc có mạng ngon để cướp (≤ 15% máu / hạ được ngay).
- **Đã vào trận là quyết đấu**: không còn buông vì "đánh lâu"; chỉ rút lui khi máu dưới ~10% (6–13% theo Kỷ Luật và độ hổ báo) mà thế trận < 1.05; vừa chạy vừa xả chiêu (khống chế, cấu rỉa, dồn sát thương), tầm xa vừa chạy vừa bắn trả, thoát được (> 9 đv) thì uống bình. **Truy đuổi tới cùng**: chỉ bỏ khi mất dấu > 1.5–3.5s, bị trả đòn quá đau (mất > 45% máu trong lúc đuổi mà máu thấp hơn con mồi 15%), hoặc 7s không rút ngắn được khoảng cách mà con mồi còn > 35% máu.
- **Phong cách đánh** theo tướng: 🛡 **Lì đòn** (Đã vào trận là đánh tới cùng, không bỏ chạy.) — Valerius, Borg, Kazuki, Wukong, Ryoma, Theron, Ratok, Boran, Ariston • ⚔ **Xông xáo** (Đánh tới khi còn khoảng 10% máu mà thấy không thắng nổi mới chạy.) — Gideon, Koda, Vesper, Death, Florian, Kip, Tsukiyo • 🏹 **Thả diều** (Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.) — Elara, Zero, Percy, Chrono & Neo, Raven, Jack "Sáu Lỗ", Ignatius, Roxie & T-Zero, Joker, Lyra, Olivia, Justus, Dr. Caelus, Dr. Vector, Bạch Diệp • 🗡 **Sát thủ phép** (Đọc vị mục tiêu: máu giấy thì lao vào dồn sát thương rồi rút; trâu bò thì cấu rỉa tới ngưỡng kết liễu. Thấy đối thủ hụt chiêu lớn là lao vào ngay.) — Alice, Diệp Thanh Phong, Luca, Dahlia, Mirage • 🎯 **Đứng bắn** (Đánh tầm xa nhưng ít di chuyển, không cố thả diều.) — Aria & Oktava, Victoria, Galo, Clint.
- Thả diều: giữa hai phát bắn giữ đối thủ ở mép tầm (tầm − 0.45…0.75 đv theo Kỹ Năng Cá Nhân), đi vòng ngang đổi hướng mỗi 0.8–2s (gần quá thì lùi là chính), không thả diều ra ngoài bo; cận chiến áp sát thì dùng chiêu lướt né (25–85% theo Kỹ Năng Cá Nhân, mỗi 2s).
- Chiêu: chiêu mở giao tranh dùng được bất cứ lúc nào đang đánh; không phí chiêu khống chế lên mục tiêu đang bị khống chế > 0.8s (chờ nối).
- **Hộ vệ** (GĐ6c — Oktava của Aria, Lính Tinh Nhuệ của Victoria): ai đánh chủ (tướng, vật triệu hồi hay quái) thì hộ vệ nhắm ngay kẻ đó và đuổi tới khi chính nó cách chủ quá xa (Oktava 14 đv, lính 13 đv) hoặc chủ **thu hồi** (chủ rút lui / bỏ chạy, hoặc hộ vệ còn < 20% máu); kẻ khác đánh chủ trong khi mục tiêu cũ đã thôi đánh chủ > 3s thì đổi mục tiêu. Không ai đánh chủ thì phụ chủ đánh hoặc đi theo đội hình.
- **Raven** (GĐ6c): biết vị trí một đối thủ ở xa (7–22 đv, thấy trong 8s gần nhất) mà không ai áp sát → tìm chỗ an toàn ngoài tầm đánh của đối thủ (tầm + 3.5, tối thiểu 10, tối đa 13.5 đv; có bụi thì núp bụi) → thả quạ Oca về phía đối thủ → đổi **súng ngắm**, đứng bắn qua tầm nhìn của quạ (ưu tiên kẻ bị quạ đánh dấu, máu thấp; xen Bắn Tỉa Xuyên Phá). Bị áp sát < 6.5 đv, bị tướng trong 10 đv bắn, máu < 30%, phải rút lui / chạy bo → đổi lại súng trường. Quạ Oca là vật bay có máu, đối thủ đứng gần (trong tầm đánh + 3 đv) mà không bận đánh tướng thì **bắn hạ quạ**.
- Chiêu Utility (bản cũ, giữ nguyên): dùng chiêu lên quái, lướt để đi đường xa / vượt tường (gấp theo việc: chạy bo 1, tranh thính 0.9, tranh boss 0.85, đi săn 0.8…), chiêu thoát thân có điểm đáp tốt nhất (tránh đáp ngoài bo khi bo đang đốt).

## 13b. Bình máu / mana (GĐ7b: 3 cỡ, hồi ngay, trúng đòn là ngắt)
| Bình | Giá | Uống mất | Hồi ngay khi uống xong |
|---|---|---|---|
| 🧪 Bình Máu Nhỏ | 45 | 1.4s | 20% máu tối đa |
| 🧪 Bình Máu Vừa | 90 | 1.8s | 35% máu tối đa |
| 🧪 Bình Máu To | 160 | 2.3s | 55.00000000000001% máu tối đa |
| 💧 Bình Mana Nhỏ | 35 | 1s | 25% mana tối đa |
| 💧 Bình Mana Vừa | 70 | 1.3s | 45% mana tối đa |
| 💧 Bình Mana To | 120 | 1.7s | 70% mana tối đa |
| 🛡 Bình Hộ Vệ Nhỏ | 50 | 1s | 30% Hộ Giáp tối đa |
| 🛡 Bình Hộ Vệ Vừa | 100 | 1.4s | 55.00000000000001% Hộ Giáp tối đa |
| 🛡 Bình Hộ Vệ To | 170 | 1.8s | 100% Hộ Giáp tối đa |
- Mang tối đa **3 bình mỗi loại** (máu / mana / Hộ Vệ, mọi cỡ cộng lại; balo cấp 6 +2). Khởi đầu 2 Bình Máu Vừa + 1 Bình Mana Vừa (tướng dùng mana). Thính cho 2 Bình Máu To (không vượt giới hạn).
- Lúc uống đi chậm ×0.55, không đánh / không dùng chiêu. **Trúng đòn của đối thủ là hỏng lần uống** (không mất bình; bo và sát thương theo thời gian không ngắt) — trừ khi có mảnh hồn Tím "Cẩn Thận". Mảnh hồn Tím "Trợ Năng": hồi thêm 50% lượng hồi trong 5s.
- AI chọn cỡ bình vừa đủ bù phần thiếu; đối thủ ở gần thì ưu tiên bình nhỏ (uống nhanh); vừa bị đánh (< 0.8s) thì chưa uống; uống khi không ai sắp với tới.

## 13c. Ý Niệm & Mảnh hồn (GĐ8: 9 chỉ số cốt lõi × 6 bậc)
- **Ý Niệm = cấp vũ khí** (đổi màu vũ khí) **= số ô khảm mảnh hồn**: Trắng 1 ô → Xanh 2 ô → Tím 3 ô → Vàng 4 ô → Đỏ 5 ô → Rực Rỡ 6 ô; mỗi cấp +5% sát thương. Ai cũng bắt đầu ở Trắng. Đúc ở Thương Nhân: Trắng 350, Xanh 500, Tím 1000, Vàng 1600, Đỏ 2400 vàng (lên tới Đỏ). Thính cho Vàng, boss / thắng quyết đấu +1 cấp (tối đa Đỏ), rương 8% +1 cấp. **Rực Rỡ (6 ô)** chỉ từ Quái Thú Hoàng Kim / Kiếm Sư Vĩ Đại / Ý Niệm Hoàng Kim: Cộng Hưởng +30% hiệu lực mọi mảnh đang gắn và mở thêm lựa chọn cây kỹ năng cấp 15/18 (mục 17).
| Bậc | Màu | Cần Ý Niệm | Sức mạnh |
|---|---|---|---|
| 1 | Trắng | ≥ 1 ô | ×1 |
| 2 | Xanh | ≥ 2 ô | ×1.5 |
| 3 | Tím | ≥ 3 ô | ×2.2 |
| 4 | Vàng | ≥ 4 ô | ×3.2 |
| 5 | Đỏ | ≥ 5 ô | ×4.5 |
| 6 | Hoàng Kim | ≥ 6 ô | ×6 |
- **9 chỉ số cốt lõi**: ❤ Máu • 🛡 Hộ Giáp • ⚔ Công Vật Lý • ✨ Công Phép • 👟 Tốc Chạy • ⏳ Hồi Chiêu • 🩸 Hút Máu • 🪨 Kháng Hiệu Ứng • 🎯 Chí Mạng (May Mắn = 🎯 chí mạng + 🍀 đồ hiếm). Hồi chiêu trần 40%, Kháng Hiệu Ứng trần 60%, Hút Máu tính trên **mọi** sát thương (đánh thường 100%, chiêu đơn 60%, chiêu diện rộng 30%, không tính sát thương theo thời gian). Phụ: Xuyên Thủng / Chống Xuyên (mục 13i), tốc đánh, vàng, kháng bão, uống nhanh, dây móc.
- **Gắn được = cấp Ý Niệm**, chỉ mảnh có bậc ≤ Ý Niệm; tự chọn mảnh mạnh nhất (bậc cao, có nội tại, hợp kiểu sát thương / súng / tầm đánh của tướng, **mảnh yêu thích** +0.6, **hợp lối build** +0.3 — mục 13l). Mảnh **thuần chỉ số** mạnh hơn về số; mảnh **cơ chế** có nội tại.
- **GĐ9 — đổi mảnh thì mảnh cũ văng ra**: mảnh dùng được (bậc ≤ Ý Niệm) mà không còn ô → **văng ra đất** cạnh tướng (người khác nhặt được, chính người văng không nhặt lại); mảnh mới kém hơn mọi mảnh đang gắn cũng văng ra ngay. Chỉ mảnh **bậc cao hơn Ý Niệm** được cất túi chờ đúc vũ khí (tổng tối đa 8 mảnh). Chỉ nhặt mảnh trên đất khi nhặt vào sẽ được gắn / cất.
- Nguồn: quái (bãi nhỏ 5%, bãi lớn 12%), rương 15%, boss (Tím–Đỏ), thắng quyết đấu (Tím), thính (Vàng; 2 lần cuối có thể Đỏ). **Hoàng Kim chỉ từ boss.** May Mắn đẩy bậc rơi lên cao hơn.
- **Bị hạ là RƠI TOÀN BỘ mảnh hồn** quanh xác (giữ nguyên mảnh), sau 2s ai chạm (1.3 đv) thì nhặt; tồn tại 120s. AI có hành động 💠 Nhặt mảnh hồn.
- Đặc năng cũ (GĐ7b) giữ thành mảnh có tên:
  - Tím — 🌿 **Trợ Năng**: Bình máu / mana hồi thêm 50% lượng hồi trong 5s sau khi uống.
  - Tím — 🧛 **Uống Máu**: Hạ gục một tướng: hồi 80% máu tối đa.
  - Tím — 🫙 **Cẩn Thận**: Uống bình không bị ngắt khi trúng đòn.
  - Vàng — ☁ **Lưu Vân**: Lướt ngắn 4 đv rồi tăng 40% tốc chạy trong 2s (hồi 10s).
  - Vàng — 🔮 **Vận Mệnh**: Gục lần tới thì hồi sinh ngay tại chỗ với 40% máu — mảnh hồn này vỡ.
  - Vàng — ⚡ **Cơ Mệnh**: Hạ gục một tướng: mọi chiêu hồi ngay lập tức.
  - Đỏ — 🌅 **Thiên Mệnh**: Gục thì hồi sinh tại chỗ với 50% máu và BẤT TỬ 90s (không thể chết); hồi 400s.
  - Đỏ — 💢 **Tuyệt Kỹ Nộ**: Chiêu cuối gây ×2 sát thương trong 3.5s sau khi dùng (hồi 60s).
  - Đỏ — 🛍 **Cửa Hàng Online**: Mua đồ, bình, nâng balo, đúc ý niệm ở bất cứ đâu (không cần tới Thương Nhân).
- **Toàn bộ 159 mảnh hồn**:
| Mã | Tên | Bậc | Chỉ số | Nội tại |
|---|---|---|---|---|
| W01 | Hồn Sinh Mệnh Sơ Cấp | Trắng | +150 Máu |  |
| W02 | Hồn Thiết Giáp Thô | Trắng | +60 Hộ Giáp |  |
| W03 | Hồn Thiết Kiếm Nhỏ | Trắng | +5% Công Vật Lý |  |
| W04 | Hồn Tinh Thể Phép | Trắng | +15 Công Phép |  |
| W05 | Hồn Giày Vải Nhẹ | Trắng | +4% Tốc Chạy |  |
| W06 | Hồn Nhịp Thở Đều | Trắng | −4% Hồi Chiêu |  |
| W07 | Hồn Răng Nanh Nhỏ | Trắng | +3% Hút Máu |  |
| W08 | Hồn Ý Chí Kiên Định | Trắng | +8% Kháng Hiệu Ứng |  |
| W09 | Hồn Cỏ Ba Lá | Trắng | +5% Chí Mạng, +8% May Mắn (đồ hiếm) |  |
| W10 | Hồn Vệ Binh Tập Sự | Trắng | +100 Máu, +30 Hộ Giáp |  |
| W11 | Hồn Lưỡi Đao Gọn | Trắng | +3% Công Vật Lý, −2% Hồi Chiêu |  |
| W12 | Hồn Linh Quang Nhỏ | Trắng | +10 Công Phép, −2% Hồi Chiêu |  |
| W13 | Hồn Thợ Săn Rừng Sâu | Trắng | +3% Công Vật Lý | +8% sát thương lên quái nhỏ. |
| W14 | Hồn Móc Dây Trơn Tru | Trắng | +2% Tốc Chạy, +12% tốc kéo dây móc | Dây móc kéo nhanh hơn 12%. |
| W15 | Hồn Băng Bó Gấp | Trắng | +80 Máu, uống bình nhanh hơn 10% | Uống bình máu / Hộ Vệ nhanh hơn 10%. |
| W16 | Hồn Túi Đeo Tiện Lợi | Trắng | +12% May Mắn (đồ hiếm), +10% vàng nhặt được | +10% vàng nhặt được từ mọi nguồn. |
| WP1 | Hồn Xuyên Kình Sơ Cấp | Trắng | +3% Công Vật Lý | Đánh thường bỏ qua 20% Hộ Giáp (đánh thẳng vào máu). |
| WP2 | Hồn Tinh Kình Phép Sơ Cấp | Trắng | +12 Công Phép | Sát thương chiêu bỏ qua 25% Hộ Giáp. |
| WA1 | Hồn Vách Sắt Mỏng | Trắng | +120 Hộ Giáp, Chống Xuyên 15% | Giảm 15% xuyên thủng của đối thủ. |
| B01 | Hồn Cự Nhân Sơ Cấp | Xanh | +350 Máu, +100 Hộ Giáp |  |
| B02 | Hồn Lưỡi Kiếm Sắc | Xanh | +10% Công Vật Lý |  |
| B03 | Hồn Ma Năng Tụ Đỉnh | Xanh | +35 Công Phép, −5% Hồi Chiêu |  |
| B04 | Hồn Khát Máu | Xanh | +6% Hút Máu |  |
| B05 | Hồn Thần Hành Bộ | Xanh | +7% Tốc Chạy |  |
| B06 | Hồn Tâm Trí Bất Khuất | Xanh | +16% Kháng Hiệu Ứng, +120 Máu |  |
| B07 | Hồn Móng Vuốt Săn Nguyệt | Xanh | +10% Chí Mạng, +15% May Mắn (đồ hiếm) |  |
| B08 | Hồn Đấu Sĩ Toàn Diện | Xanh | +6% Công Vật Lý, +180 Máu, +40 Hộ Giáp |  |
| B09 | Hồn Khí Công Thần Tốc | Xanh | −8% Hồi Chiêu, +3% Tốc Chạy |  |
| B10 | Hồn Ma Pháp Hấp Thụ | Xanh | +25 Công Phép, +4% Hút Máu |  |
| B11 | Hồn Huyết Nhận Rạch Xé | Xanh | +5% Công Vật Lý | Đánh thường làm Chảy Máu: 1.5% máu tối đa sát thương vật lý trong 3s. |
| B12 | Hồn Bộc Phá Linh Năng | Xanh | +20 Công Phép | Chiêu trúng đích làm chậm 20% trong 1.5s. |
| B13 | Hồn Du Kích Bụi Rậm | Xanh | +4% Tốc Chạy | Trong bụi rậm: +15% tốc chạy và hồi 20 máu mỗi giây. |
| B14 | Hồn Phục Hồi Thần Tốc | Xanh | +150 Máu, uống bình nhanh hơn 20% | Uống bình nhanh hơn 20%; uống xong nhận khiên 60 trong 4s. |
| B15 | Hồn Trảm Quái Thần Tốc | Xanh | +5% Công Vật Lý, +15 Công Phép | +20% sát thương lên quái / boss; hạ quái tinh anh +80 vàng. |
| B16 | Hồn Đạp Gió | Xanh | +3% Tốc Chạy, +20% tầm dây móc | +20% tầm phóng dây móc. |
| BP1 | Hồn Thiết Tiễn Xuyên Phá | Xanh | +6% Công Vật Lý, +3% Tốc Chạy | Đánh thường tầm xa bỏ qua 35% Hộ Giáp. |
| BP2 | Hồn Điểm Huyệt Xuyên Giáp | Xanh | +8% Công Vật Lý | Đòn mở màn giao tranh bỏ qua 50% Hộ Giáp (hồi 10s). |
| BP3 | Hồn Ăn Mòn Hóa Chất | Xanh | +25 Công Phép, sát thương theo thời gian bỏ qua 40% Hộ Giáp | Sát thương theo thời gian / độc bỏ qua 40% Hộ Giáp. |
| BA1 | Hồn Giáp Hấp Thụ | Xanh | +280 Hộ Giáp, Chống Xuyên 30% | Chống Xuyên 30%. |
| P01 | Hồn Cự Thạch Sơn Hải | Tím | +650 Máu, +220 Hộ Giáp |  |
| P02 | Hồn Cuồng Phong Trảm Lực | Tím | +18% Công Vật Lý |  |
| P03 | Hồn Minh Hỏa Bí Thuật | Tím | +75 Công Phép, −10% Hồi Chiêu |  |
| P04 | Hồn Hấp Huyết Vô Tận | Tím | +12% Hút Máu |  |
| P05 | Hồn Thần Vận May Mắn | Tím | +16% Chí Mạng, +30% May Mắn (đồ hiếm) |  |
| P06 | Hồn Bất Khuất Kim Thân | Tím | +28% Kháng Hiệu Ứng, +120 Hộ Giáp |  |
| P07 | Hồn Tật Phong Đột Kích | Tím | +11% Tốc Chạy, −6% Hồi Chiêu |  |
| P08 | Hồn Lưỡng Nghi Chiến Ma | Tím | +10% Công Vật Lý, +40 Công Phép, +250 Máu |  |
| P09 | Hồn Phách Kiếm Khí | Tím | +8% Công Vật Lý | Đánh thường cận chiến phóng thêm luồng kiếm khí bay 4 đv (40% sát thương đòn đánh). |
| P10 | Hồn Phá Giáp Trọng Thương | Tím | +8% Chí Mạng | Đòn chí mạng bỏ qua 30% giáp và giảm 40% hồi máu của nạn nhân 3s. |
| P11 | Hồn Ẩn Mật Dạ Hành | Tím | +5% Tốc Chạy | Đứng yên trong bụi 3s thì tàng hình; đòn đầu tiên sau đó +25% sát thương. |
| P12 | Hồn Kháng Độc Bão Tố | Tím | +200 Máu, −40% sát thương bão | −40% sát thương bão; +20% tốc chạy khi ở ngoài bo. |
| P13 | Hồn Phong Lôi Tê Liệt | Tím | +30 Công Phép, −5% Hồi Chiêu | Đòn đánh thứ 3 liên tiếp phóng sét: ngắt chiêu và tê liệt 0.5s (hồi 8s). |
| P14 | Hồn Đoạt Mệnh Hồi Năng | Tím | +6% Công Vật Lý | Hạ gục tướng: hồi 20% máu tối đa, giảm 50% hồi chiêu chiêu di chuyển. |
| P15 | Hồn Thấu Thị Kho Báu | Tím | +25% May Mắn (đồ hiếm) | Thấy kẻ địch đang uống bình trong 25 đv; rương báu trong 25 đv hiện trên bản đồ. |
| P16 | Hồn Hộ Thân Đẩy Lùi | Tím | +100 Hộ Giáp | Hộ Giáp vỡ: xung lực đẩy lùi kẻ địch quanh 3 đv, nhận khiên 150 trong 3s (hồi 45s). |
| PK1 | Hồn Trợ Năng | Tím | +250 Máu | Bình máu / mana hồi thêm 50% lượng hồi trong 5s sau khi uống. |
| PK2 | Hồn Uống Máu | Tím | +5% Hút Máu | Hạ gục một tướng: hồi 80% máu tối đa. |
| PK3 | Hồn Cẩn Thận | Tím | +150 Hộ Giáp | Uống bình không bị ngắt khi trúng đòn. |
| PP1 | Hồn Phá Giáp Trọng Trảm | Tím | +14% Công Vật Lý | Đòn đánh và chiêu vật lý bỏ qua 50% Hộ Giáp. |
| PP2 | Hồn Đoạt Phách Chí Mạng | Tím | +12% Chí Mạng | Đòn chí mạng bỏ qua 70% Hộ Giáp. |
| PP3 | Hồn Liêm Dao Xuyên Thấu | Tím | −8% Hồi Chiêu, +5% Tốc Chạy | Đánh từ sau lưng bỏ qua 65% Hộ Giáp. |
| PA1 | Hồn Giáp Tái Tạo | Tím | +500 Hộ Giáp, +200 Máu, Chống Xuyên 45% | Ngoài giao tranh 4s: hồi 8% Hộ Giáp mỗi giây. Chống Xuyên 45%. |
| G01 | Hồn Kim Cương Bất Diệt | Vàng | +1300 Máu, +450 Hộ Giáp |  |
| G02 | Hồn Chiến Thần Cuồng Nộ | Vàng | +28% Công Vật Lý, −8% Hồi Chiêu |  |
| G03 | Hồn Pháp Vương Tối Cao | Vàng | +145 Công Phép, −16% Hồi Chiêu |  |
| G04 | Hồn Huyết Tế Đại Sư | Vàng | +20% Hút Máu, +300 Máu |  |
| G05 | Hồn Vạn Tượng Hoàng Kim Vận | Vàng | +26% Chí Mạng, +50% May Mắn (đồ hiếm) |  |
| G06 | Hồn Vô Thùy Định Phách | Vàng | +42% Kháng Hiệu Ứng, +600 Máu |  |
| G07 | Hồn Thần Tốc Hư Không | Vàng | +16% Tốc Chạy, −10% Hồi Chiêu |  |
| G08 | Hồn Ma Vũ Song Tu | Vàng | +15% Công Vật Lý, +80 Công Phép, +8% Hút Máu |  |
| G09 | Hồn Băng Trệ Tỏa Khí | Vàng | +400 Máu, −6% Hồi Chiêu | Đánh thường làm chậm 35% và cấm lướt / dây móc 1.5s (hồi 8s). |
| G10 | Hồn Đạp Gió Không Gian | Vàng | +8% Tốc Chạy | Dùng dây móc xong được lướt thêm 1 lần 3 đv trên không. |
| G11 | Hồn Thiêu Đốt Chân Hỏa | Vàng | +50 Công Phép | Sát thương chiêu thiêu đốt 2.5% máu tối đa mỗi giây trong 3s, phá tàng hình. |
| G12 | Hồn Phản Kích Thần Hựu | Vàng | +200 Hộ Giáp | Đỡ đòn thành công (thế thủ / khiên chặn trọn): hồi đầy Hộ Giáp, choáng kẻ đánh thêm 0.75s. |
| G13 | Hồn Tử Địa Nghịch Chuyển | Vàng | +500 Máu | Máu dưới 20%: khiên 600 và +35% hút máu trong 5s (hồi 75s). |
| G14 | Hồn Thiết Thể Tụ Lực | Vàng | +12% Công Vật Lý | Đang tụ lực / niệm chiêu: không thể bị ngắt và giảm 25% sát thương nhận. |
| G15 | Hồn Thu Thập Tàn Hồn | Vàng | +10% Chí Mạng | Mỗi mạng hạ gục: vĩnh viễn +1.5% sát thương và +40 máu (tối đa 10 tầng). |
| G16 | Hồn Ảo Ảnh Tráo Thân | Vàng | −8% Hồi Chiêu | Trúng đòn chí mạng: để lại phân thân thế mạng, tàng hình lướt đi 4 đv trong 1.5s (hồi 60s). |
| GK1 | Hồn Lưu Vân | Vàng | +8% Tốc Chạy | Lướt ngắn 4 đv rồi tăng 40% tốc chạy trong 2s (hồi 10s). |
| GK2 | Hồn Vận Mệnh | Vàng | +600 Máu | Gục lần tới thì hồi sinh ngay tại chỗ với 40% máu — mảnh hồn này vỡ. |
| GK3 | Hồn Cơ Mệnh | Vàng | −10% Hồi Chiêu | Hạ gục một tướng: mọi chiêu hồi ngay lập tức. |
| GP1 | Hồn Vô Ảnh Thần Trảm | Vàng | +22% Công Vật Lý, −10% Hồi Chiêu | Bỏ qua 75% Hộ Giáp (85% nếu Hộ Giáp của đối thủ dày hơn máu). |
| GP2 | Hồn Phong Nhận Đoạt Mệnh | Vàng | +10% Tốc Chạy | Đòn đầu tiên trong 2s sau khi lướt / dây móc bỏ qua 90% Hộ Giáp (hồi 12s). |
| GP3 | Hồn Chân Hỏa Thiêu Hồn | Vàng | +110 Công Phép | Chiêu diện rộng bỏ qua 80% Hộ Giáp; làm vỡ Hộ Giáp của mục tiêu thì choáng nó 1s. |
| GA1 | Hồn Hộ Thể Đột Biến | Vàng | +900 Hộ Giáp, Chống Xuyên 60% | 40% sát thương nhận vào máu được sạc lại thành Hộ Giáp. Chống Xuyên 60%. |
| R01 | Hồn Titan Cổ Đại | Đỏ | +2200 Máu, +750 Hộ Giáp |  |
| R02 | Hồn Diệt Thế Phá Lực | Đỏ | +40% Công Vật Lý, −12% Hồi Chiêu |  |
| R03 | Hồn Tinh Tú Hủy Diệt | Đỏ | +220 Công Phép, −22% Hồi Chiêu |  |
| R04 | Hồn Thao Thiết Thôn Huyết | Đỏ | +30% Hút Máu, +500 Máu |  |
| R05 | Hồn Thiên Mệnh Chi Tử | Đỏ | +35% Chí Mạng, +75% May Mắn (đồ hiếm) |  |
| R06 | Hồn Bất Hoại Thần Thân | Đỏ | +55% Kháng Hiệu Ứng, +350 Hộ Giáp, +800 Máu |  |
| R07 | Hồn Phong Thần Vô Cực | Đỏ | +22% Tốc Chạy, −15% Hồi Chiêu |  |
| R08 | Hồn Thái Cực Toàn Giác | Đỏ | +20% Công Vật Lý, +110 Công Phép, +600 Máu, +150 Hộ Giáp |  |
| R09 | Hồn Niết Bàn Tái Sinh | Đỏ | +600 Máu | Nhận đòn kết liễu: hóa kén lửa bất tử 2.5s, phát nổ 400 sát thương xung quanh rồi hồi sinh với 40% máu (1 lần mỗi trận). |
| R10 | Hồn Đoạt Mệnh Trảm Quyết | Đỏ | +18% Công Vật Lý | Đánh mục tiêu dưới 15% máu: hành quyết ngay bằng sát thương chuẩn. |
| R11 | Hồn Cấm Địa Kết Giới | Đỏ | −10% Hồi Chiêu | Đòn mở màn giao tranh dựng kết giới bán kính 8 trong 4s: kẻ địch bên trong không lướt / dây móc được (hồi 60s). |
| R12 | Hồn Ngưng Đọng Thời Không | Đỏ | +25% Kháng Hiệu Ứng | Tự giải khống chế cứng đầu tiên phải chịu, hóa đá miễn sát thương 1.5s (hồi 75s). |
| R13 | Hồn Huyết Ma Thịnh Nộ | Đỏ | +15% Công Vật Lý, +60 Công Phép | Mỗi 10% máu đã mất: +4% kháng mọi sát thương và +5% sát thương gây ra. |
| R14 | Hồn Vạn Kiếm Quy Tông | Đỏ | +20% Công Vật Lý | Hoàn thành đòn tụ lực (chiêu có thời gian niệm): bão kiếm 360° xé 40% Hộ Giáp mọi kẻ địch quanh 5 đv (hồi 25s). |
| R15 | Hồn Lôi Thần Phạt Tội | Đỏ | +80 Công Phép | Mỗi đòn đánh tích 1 Lôi Ấn; đủ 5 tầng giáng sét 12% máu tối đa sát thương chuẩn và câm lặng 1.5s. |
| R16 | Hồn Hỗn Mang Đảo Nghịch | Đỏ | +300 Hộ Giáp, +500 Máu | Máu dưới 30%: 3s tiếp theo chuyển 50% sát thương nhận vào thành máu hồi phục (hồi 90s). |
| RK1 | Hồn Thiên Mệnh | Đỏ | +800 Máu, +300 Hộ Giáp | Gục thì hồi sinh tại chỗ với 50% máu và BẤT TỬ 90s; hồi 400s. |
| RK2 | Hồn Tuyệt Kỹ Nộ | Đỏ | +15% Công Vật Lý, +60 Công Phép | Chiêu cuối gây ×2 sát thương trong 3.5s sau khi dùng (hồi 60s). |
| RK3 | Hồn Cửa Hàng Online | Đỏ | +40% May Mắn (đồ hiếm), +15% vàng nhặt được | Mua đồ, bình, nâng balo, đúc ý niệm ở bất cứ đâu (không cần tới Thương Nhân). |
| RP1 | Hồn Diệt Thế Xuyên Tâm | Đỏ | +35% Công Vật Lý, +20% Chí Mạng | Bỏ qua 85% Hộ Giáp mọi nguồn; đòn tụ lực (chiêu có thời gian niệm) bỏ qua 100%. |
| RP2 | Hồn Thần Chết Thấu Cốt | Đỏ | +25% Công Vật Lý, +90 Công Phép | Mục tiêu dưới 30% máu: bỏ qua 100% Hộ Giáp. |
| RA1 | Hồn Kim Thân Bất Hoại | Đỏ | +1600 Hộ Giáp, +35% Kháng Hiệu Ứng, Chống Xuyên 100% | Chống Xuyên tuyệt đối: kẻ địch phải đánh vỡ hết Hộ Giáp mới chạm được máu. |
| Y_CHI | Mảnh Hồn Ý Chí | Hoàng Kim (boss) | +1500 Máu, +300 Hộ Giáp, +25% Công Vật Lý, +25% sát thương phép, +10% Tốc Chạy, −15% Hồi Chiêu, +20% Kháng Hiệu Ứng, +10% Chí Mạng, +20% May Mắn (đồ hiếm) | Khai Trận Trảm: đòn đầu tiên mở màn giao tranh ×2 sát thương (hồi 60s). Ý Chí Sắt Đá: chặn trọn 1 đòn tấn công và hiệu ứng của nó (hồi 120s). |
| HOANG_KIM | Mảnh Hồn Hoàng Kim | Hoàng Kim (boss) | +1200 Máu, +25% Công Vật Lý, +25% sát thương phép, +15% Hút Máu | Huyết Khí Hoàng Kim: hạ gục tướng → hồi ngay mọi chiêu di chuyển / dây móc và hồi 25% máu. |
| KIEM_Y | Hồn Kiếm Ý Tuyệt Đối | Hoàng Kim (boss) | +40% Công Vật Lý, +15% Tốc Chạy | Thấu Không Trảm (hồi 60s): đòn kế tiếp lên tướng bỏ qua 100% Hộ Giáp và câm lặng 1.5s. |
| P_RL_01 | Hồn Ổ Đạn Mở Rộng | Tím | +25% Tốc Nạp đạn, +150 Hộ Giáp, +35% sức chứa băng đạn | Băng đạn chứa thêm 35%, làm tròn lên (2 → 3, 6 → 9, 9 → 13). |
| P_RL_02 | Hồn Nạp Đạn Tĩnh Tâm | Tím | +30% Tốc Nạp đạn, +6% Công Vật Lý | Bắt đầu nạp khi đã 1s không trúng đòn: nạp nhanh thêm 35% và 3 viên đầu của băng mới +20% sát thương. AI hết đạn thì lùi giữ cự ly / nấp góc rồi mới nạp. |
| P_RL_03 | Hồn Lộn Nhào Nạp Đạn | Tím | +20% Tốc Nạp đạn, +4% Tốc Chạy | Lướt / lộn nhào / bay dây móc: nạp ngay 2 viên vào băng (hồi 4s). |
| P_RL_04 | Hồn Đầu Đạn Phá Giáp | Tím | +25% Tốc Nạp đạn | Viên đầu tiên sau mỗi lần nạp xuyên 60% Hộ Giáp (đi thẳng vào máu). |
| P_RL_05 | Hồn Đạn Cuối Chấn Địa | Tím | +20% Tốc Nạp đạn, +8% Công Vật Lý | Viên CUỐI CÙNG của băng +45% sát thương, nổ đẩy lùi mục tiêu 1.4 đv và choáng 0.5s. |
| P_RL_06 | Hồn Thu Gom Vỏ Đạn | Tím | +35% Tốc Nạp đạn, +20% May Mắn (đồ hiếm) | Phát bắn chí mạng (trúng điểm yếu): 25% hoàn lại 1 viên vào băng. |
| G_RL_01 | Hồn Đoạt Mệnh Nạp Tức Thì | Vàng | +45% Tốc Nạp đạn, +8% Tốc Chạy | Hạ gục / hỗ trợ hạ gục tướng: nạp đầy băng ngay lập tức + 35% tốc chạy 3s. |
| G_RL_02 | Hồn Quán Tính Dây Móc | Vàng | +40% Tốc Nạp đạn, +15% Tốc Đánh | Đang bay bằng dây móc: tự nạp đầy băng. Phát bắn đầu tiên sau khi tiếp đất (trong 3s) +40% sát thương. |
| G_RL_03 | Hồn Sóng Nhiệt Buồng Đạn | Vàng | +35% Tốc Nạp đạn, +300 Máu | Bắt đầu nạp đạn: sóng nhiệt quanh thân (1.4 đv) đẩy dạt kẻ áp sát 1.2 đv và thiêu 4% máu tối đa của chúng. |
| G_RL_04 | Hồn Xả Chiêu Tiếp Đạn | Vàng | +45% Tốc Nạp đạn, −10% Hồi Chiêu | Mỗi lần dùng chiêu S1 / S2 / S3: nạp ngay 50% băng (làm tròn lên); phát bắn kế tiếp chắc chắn CHÍ MẠNG. AI hết đạn thì tung chiêu trước rồi bắn tiếp. |
| G_RL_05 | Hồn Hộ Thể Đạn Đạo | Vàng | +40% Tốc Nạp đạn, +350 Hộ Giáp | Trong lúc nạp đạn: không thể bị cản phá + giáp ảo 300 (+20/cấp) (hồi 4s). |
| G_RL_06 | Hồn Cò Quay Bất Tận | Vàng | +40% Tốc Nạp đạn, +18% Chí Mạng | Mỗi lần nạp: 30% nạp 1 Viên Đạn Hoàng Kim — phát đó gây thêm sát thương chuẩn (tổng ×2.5) và câm lặng 1.5s. |
| R_RL_01 | Hồn Bão Đạn Vô Tận | Đỏ | +65% Tốc Nạp đạn, +25% Tốc Đánh, +20% Công Vật Lý | Bắn cạn băng: 3s xả đạn tự do — không tốn đạn, không phải nạp, +40% tốc đánh (hồi 25s). |
| R_RL_02 | Hồn Phản Xạ Thoát Hiểm | Đỏ | +55% Tốc Nạp đạn, +30% Kháng Hiệu Ứng, +350 Hộ Giáp | Dùng lướt / dây móc thoát khỏi vùng cảnh báo đỏ (của tướng hoặc boss): nạp đầy băng tức thì. Trúng một đòn cận chiến mất > 15% máu tối đa: sóng xung kích đẩy kẻ áp sát 1.6 đv, phát bắn kế tiếp gây 180% sát thương, phần lớn là sát thương CHUẨN xuyên 100% Hộ Giáp (hồi 25s). |
| R_RL_03 | Hồn Đạn Hút Tủy | Đỏ | +50% Tốc Nạp đạn, +18% Hút Máu, +500 Máu | Mỗi phát trúng tướng tích 1 tầng Huyết Khí (tối đa 10). Bắt đầu nạp khi có ≥ 4 tầng: tiêu hết, nạp xong trong 0.3s và hồi 20% máu tối đa. |
| R_RL_04 | Hồn Hư Không Tráo Đạn | Đỏ | +60% Tốc Nạp đạn, +12% Tốc Chạy, −12% Hồi Chiêu | Bắt đầu nạp đạn: tàng hình suốt lúc nạp và lướt 1.6 đv ra xa kẻ địch gần nhất (hồi 15s). |
| R_RL_05 | Hồn Trảm Quyết Xuyên Tâm | Đỏ | +50% Tốc Nạp đạn, +30% Công Vật Lý | Mỗi viên +sát thương theo máu đã mất của mục tiêu (tối đa +50%). Hạ gục tướng bằng viên CUỐI băng: cả băng kế tiếp ×2 sát thương. |
| W_AS_01 | Hồn Nhanh Nhẹn Thô | Trắng | +8% Tốc Đánh |  |
| W_AS_02 | Hồn Vũ Đao Nhẹ | Trắng | +5% Tốc Đánh, +2% Tốc Chạy |  |
| B_AS_01 | Hồn Liên Hoàn Trảm | Xanh | +15% Tốc Đánh | Đánh thường trúng tướng: +3% tốc đánh 3s (cộng dồn 3 tầng). |
| B_AS_02 | Hồn Tật Phong Bộ | Xanh | +10% Tốc Đánh, +5% Tốc Chạy |  |
| P_AS_01 | Hồn Cuồng Nộ Sát Tốc | Tím | +26% Tốc Đánh, −6% Hồi Chiêu |  |
| P_AS_02 | Hồn Phong Lôi Liên Kích | Tím | +18% Tốc Đánh | Đòn đánh liên tiếp thứ 4: dư ảnh vung thêm một đòn 35% sát thương. |
| G_AS_01 | Hồn Vô Ảnh Cực Tốc | Vàng | +40% Tốc Đánh, +8% Tốc Chạy |  |
| G_AS_02 | Hồn Vũ Điệu Tử Thần | Vàng | +30% Tốc Đánh, +8% Hút Máu | Mỗi đòn đánh trúng: giảm 0.3s hồi chiêu mọi chiêu lướt. |
| R_AS_01 | Hồn Thần Tốc Thiên Mệnh | Đỏ | +55% Tốc Đánh, +12% Tốc Chạy, trần tốc đánh +0.5 | Phá trần tốc đánh (+0.5 đòn/giây); vừa đánh vừa chạy không bị chậm (+10% tốc chạy 0.8s sau mỗi đòn). |
| P_VIS_01 | Hồn Ưng Nhãn | Tím | +5% Tốc Chạy, +8% Chí Mạng, +35% Tầm Nhìn, không bị sương mù / màn đêm thu hẹp tầm nhìn | Tầm nhìn +35%; sương mù, tử khí, màn đêm không còn thu hẹp tầm nhìn. |
| P_VIS_02 | Hồn Thấu Thị Thảo Mộc | Tím | +6% Công Vật Lý, −6% Hồi Chiêu | Thấy (đánh dấu đỏ) mọi kẻ địch nấp bụi trong 12 đv; đòn đầu tiên vào kẻ đang nấp bụi +20% sát thương. |
| P_VIS_03 | Hồn Thính Giác Địa Chấn | Tím | +150 Hộ Giáp, +12% Kháng Hiệu Ứng | Nghe bước chân, tiếng dây móc, tiếng giao tranh trong 22 đv: vị trí kẻ phát ra tiếng lộ 3s (kể cả sau tường / trong bụi). |
| P_VIS_04 | Hồn Radar Tàn Tích | Tím | +30% May Mắn (đồ hiếm), +4% Tốc Chạy | Thấy xuyên vật cản rương đồ, bẫy ngầm, Thương Nhân trong 16 đv: không dẫm phải bẫy của người khác, AI đi mở rương xa hơn. |
| G_VIS_01 | Hồn Tiên Tri Vòng Bo | Vàng | +400 Máu, +200 Hộ Giáp | Biết trước tâm vòng bo kế tiếp ngay khi vòng hiện tại vừa xuất hiện; chạy thẳng về tâm bo mới +12% tốc chạy. AI bỏ farm lẻ, chiếm chỗ ở tâm bo sớm 45s. |
| G_VIS_02 | Hồn Nhiệt Ảnh Truy Mệnh | Vàng | +12% Công Vật Lý, +6% Tốc Chạy | Nhìn xuyên địa hình, xuyên tường kẻ địch dưới 40% máu hoặc đang uống bình trong 24 đv. AI: điểm "đi săn / kết liễu" ×2 khi thấy mục tiêu dưới 40% máu. |
| G_VIS_03 | Hồn Phá Ảo Chân Thị | Vàng | +60 Công Phép, −10% Hồi Chiêu | Hào quang Chân Thị 9 đv: kẻ địch xung quanh không thể tàng hình hay núp bụi trước mặt (Alice, Vesper…); bản thân miễn nhiễm mù. |
| G_VIS_04 | Hồn Phá Sóng Nhiễu Loạn | Vàng | +8% Tốc Chạy, +20% Kháng Hiệu Ứng | Làm nhiễu "bản đồ nhỏ" của mọi kẻ địch trong 14 đv (mất hết thông tin cảm nhận / nghe được); bản thân không phát ra tiếng động (bước chân, dây móc) — thính giác không nghe thấy. |
| R_VIS_01 | Hồn Thiên Nhãn Xuyên Giới | Đỏ | −15% Hồi Chiêu, +10% Tốc Chạy, +500 Máu, +70% Tầm Nhìn | Tầm nhìn +70%. Mỗi 15s phát xung radar: lộ mọi tướng trong 40 đv (xuyên vách núi, hang, mái nhà) trong 3.5s. |
| R_VIS_02 | Hồn Nguyệt Thực Hắc Ám | Đỏ | +20% Công Vật Lý, +70 Công Phép | Hạ gục tướng: khói bóng tối phủ 16 đv trong 6s — kẻ địch trong đó chỉ còn thấy 1.4 đv quanh thân, không khóa được mục tiêu tầm xa. |
| R_VIS_03 | Hồn Huyết Tế Toàn Cảnh | Đỏ | +15% Công Vật Lý, +15% Chí Mạng, +250 Hộ Giáp | Luôn thấy (toàn bản đồ) Kẻ Nhiều Mạng Nhất và kẻ đang mang bùa lợi boss; +25% sát thương lên hai loại mục tiêu này. |
| G_RNG_01 | Hồn Xạ Thủ Xuyên Vân | Vàng | +12% Công Vật Lý, +10% Tốc Đánh, +35% Tầm Bắn (vũ khí tầm xa), +40% tốc độ bay của đạn | Vũ khí tầm xa: +35% tầm bắn, đạn bay nhanh hơn 40% (khó lướt né). |
| G_RNG_02 | Hồn Trường Nhận Phong Khí | Vàng | +15% Công Vật Lý, +5% Tốc Chạy, +0.6 đv Tầm Với (cận chiến) | Vũ khí cận chiến: khí kình kéo dài lưỡi — +0.6 đv tầm với; đường chém rộng thêm, quét trúng thêm 1 kẻ địch sát mục tiêu (30% sát thương). |
| G_RNG_03 | Hồn Tuyệt Đích Bất Suy | Vàng | +14% Công Vật Lý, +12% Chí Mạng, không suy hao sát thương theo khoảng cách | Vũ khí tầm xa: không suy hao sát thương theo khoảng cách (bắn ở rìa tầm vẫn 100%); trúng mục tiêu xa hơn 10 đv +18% sát thương. |
| G_RNG_04 | Hồn Phi Thân Trảm Kích | Vàng | +7% Tốc Chạy, −8% Hồi Chiêu, +25% tầm dây móc | Vũ khí cận chiến: đòn đầu tiên nhắm vào kẻ địch ở hơi xa thành cú lướt chém áp sát thêm 1.4 đv (hồi 6s); +25% tầm dây móc. |
| R_RNG_01 | Hồn Xuyên Cực Vạn Dặm | Đỏ | +25% Công Vật Lý, +20% Tốc Đánh, +60% Tầm Bắn (vũ khí tầm xa), đạn xuyên 1 lớp tường gỗ / thân cây | Vũ khí tầm xa: +60% tầm bắn; đạn bay thẳng tuyệt đối và xuyên qua 1 lớp tường gỗ / thân cây đổ mà không mất sát thương. |
| R_RNG_02 | Hồn Titan Phá Giới | Đỏ | +22% Công Vật Lý, +500 Máu, +1 đv Tầm Với (cận chiến) | Vũ khí cận chiến: +1.0 đv tầm với; mọi đòn đánh phóng sóng chân không kéo dài thêm 1.6 đv phía trước, gây 60% sát thương đòn đánh lên kẻ đứng ngoài tầm với. |
| R_RNG_03 | Hồn Định Vị Thiện Xạ | Đỏ | +20% Công Vật Lý, +20% Chí Mạng | Vũ khí tầm xa: bắn trúng tướng ở xa hơn 12 đv — tê liệt 0.75s (ngắt chiêu đang niệm) và làm chậm 60% trong 2s (mỗi mục tiêu tối đa 1 lần / 6s). |
| RAD_RL_01 | Hồn Kim Thần Tiếp Đạn | Hoàng Kim (boss) | +100% Tốc Nạp đạn, +35% Tốc Đánh, +25% Công Vật Lý | Không còn hoạt ảnh nạp đạn: vũ khí tự nạp ngầm 1 viên mỗi 0.25s, kể cả khi đang lướt hay dùng chiêu. |
| RAD_RL_02 | Hồn Kim Quang Chấn Diệt | Hoàng Kim (boss) | +80% Tốc Nạp đạn, +800 Máu, +400 Hộ Giáp | Mỗi lần nạp: hào quang kim sắc làm MÙ mọi tướng địch quanh 3.2 đv trong 1.5s. 3 viên đầu băng mới +30% sát thương và bỏ qua 100% Hộ Giáp. |
| RAD_AS_01 | Hồn Cực Phong Thần Kiếm | Hoàng Kim (boss) | +65% Tốc Đánh, +25% Công Vật Lý | 4s sau khi dùng chiêu cuối: tốc độ ra đòn ×2. |
| RAD_VIS_01 | Hồn Toàn Giác Vạn Vật | Hoàng Kim (boss) | +1000 Máu, +350 Hộ Giáp, +15% Tốc Chạy | Xóa điểm mù: thấy rõ mọi kẻ địch trong 48 đv (kể cả nấp bụi, tàng hình, bay trên không). Đòn bất ngờ đầu tiên vào kẻ không nhìn về phía mình: ×2 sát thương và choáng 1.25s (mỗi mục tiêu 1 lần / 15s). |
| RAD_RNG_01 | Hồn Thần Vũ Phá Hư Không | Hoàng Kim (boss) | +35% Công Vật Lý, +12% Tốc Chạy, −15% Hồi Chiêu, +80% Tầm Bắn (vũ khí tầm xa), +1.6 đv Tầm Với (cận chiến) | Tự thích ứng: tầm xa +80% tầm bắn, cận chiến +1.6 đv tầm với. Mọi đòn đánh tung ra từ ngoài tầm nhìn của mục tiêu (nó không thấy mình hoặc quay lưng): chắc chắn chí mạng ×2 và bỏ qua 100% Hộ Giáp. |

## 13i. Hộ Giáp & Xuyên Thủng (GĐ8)
- **Hộ Giáp** = thanh giáp phụ (màu bạc, trên thanh máu): 100 + 15/cấp + mảnh hồn / đồ. Gánh sát thương **trước máu**; **không tự hồi** — chỉ hồi bằng bình Hộ Vệ (nhỏ/vừa/lớn), lên cấp, hồi sinh. Sát thương bo / hiểm họa đi thẳng vào máu.
- **Xuyên Thủng X%**: X% sát thương đi thẳng vào máu, bỏ qua Hộ Giáp; **Chống Xuyên Y%** trừ thẳng vào Xuyên Thủng của kẻ đánh (100% = phải đánh vỡ hết Hộ Giáp mới chạm máu). Một số mảnh xé Hộ Giáp; vỡ giáp kích hoạt nội tại (Giáp Hoàng Kim: sóng đẩy lùi + miễn sát thương 1.5s).
- AI: tướng có Xuyên Thủng ≥ 70% ưu tiên nhắm kẻ giáp dày; gặp đối thủ có Xuyên Thủng cao thì rút lui sớm hơn (+5% ngưỡng máu); máu hiệu dụng tính cả Hộ Giáp; uống bình Hộ Vệ khi giáp vỡ mà không ai sắp với tới.

## 13e. Balo & vật phẩm dùng 1 lần (GĐ7)
- Balo cấp 1–5: cấp 1: 3 ô, cấp 2: 4 ô, cấp 3: 5 ô, cấp 4: 6 ô, cấp 5: 8 ô, cấp 6: 10 ô; nâng ở Thương Nhân lên cấp 2 250, lên cấp 3 500, lên cấp 4 900, lên cấp 5 1400 vàng (rương 15% nâng miễn phí). Mỗi ô một loại, xếp chồng tới giới hạn. Hai vật phẩm cách nhau tối thiểu 0.8s.
| Vật phẩm | Nhóm | Giá | Chồng | Tác dụng |
|---|---|---|---|---|
| 🧪 Bình Máu Nhỏ | bình | 45 | 3 | Uống 1.4s (đi chậm, trúng đòn là hỏng), xong hồi ngay 20% máu tối đa. |
| 🧪 Bình Máu Vừa | bình | 90 | 3 | Uống 1.8s (đi chậm, trúng đòn là hỏng), xong hồi ngay 35% máu tối đa. |
| 🧪 Bình Máu To | bình | 160 | 3 | Uống 2.3s (đi chậm, trúng đòn là hỏng), xong hồi ngay 55% máu tối đa. |
| 💧 Bình Mana Nhỏ | bình | 35 | 3 | Uống 1.0s (trúng đòn là hỏng), xong hồi ngay 25% mana. |
| 💧 Bình Mana Vừa | bình | 70 | 3 | Uống 1.3s (trúng đòn là hỏng), xong hồi ngay 45% mana. |
| 💧 Bình Mana To | bình | 120 | 3 | Uống 1.7s (trúng đòn là hỏng), xong hồi ngay 70% mana. |
| 🛡 Bình Hộ Vệ Nhỏ | bình | 50 | 3 | Uống 1.0s (trúng đòn là hỏng), xong hồi ngay 30% Hộ Giáp tối đa. |
| 🛡 Bình Hộ Vệ Vừa | bình | 100 | 3 | Uống 1.4s (trúng đòn là hỏng), xong hồi ngay 55% Hộ Giáp tối đa. |
| 🛡 Bình Hộ Vệ To | bình | 170 | 3 | Uống 1.8s (trúng đòn là hỏng), xong hồi ngay 100% Hộ Giáp tối đa. |
| 🌟 Bình Thuốc Rực Rỡ | đặc biệt | 0 | 2 | Dùng tức thì: hồi đầy máu và Hộ Giáp. |
| ⚡ Tốc Biến | phép bổ trợ cũ | 180 | 1 | Dịch chuyển tức thời 4 đv. |
| 👻 Tốc Hành | phép bổ trợ cũ | 120 | 2 | +35% tốc chạy trong 6s. |
| 💚 Hồi Máu | phép bổ trợ cũ | 150 | 2 | Hồi ngay 15% máu tối đa, +20% tốc chạy 2s. |
| 🛡 Lá Chắn | phép bổ trợ cũ | 150 | 2 | Khiên bằng 20% máu tối đa trong 3s. |
| 🔥 Thiêu Đốt | phép bổ trợ cũ | 140 | 2 | Thiêu 1 tướng trong 6 đv: 2% máu tối đa của nó mỗi giây trong 5s, vết thương sâu. |
| 🥀 Kiệt Sức | phép bổ trợ cũ | 140 | 2 | Tướng địch trong 6 đv: chậm 35% và gây ít hơn 35% sát thương trong 2.5s. |
| ✨ Thanh Tẩy | phép bổ trợ cũ | 120 | 2 | Xóa mọi khống chế, kháng hiệu ứng +60% trong 2s (dùng được khi đang bị khống chế). |
| ☄ Trừng Trị | phép bổ trợ cũ | 100 | 2 | Sát thương chuẩn 500 + 60×cấp lên quái / boss trong 5 đv (lên tướng: 10% máu tối đa). |
| 🌀 Dịch Chuyển | phép bổ trợ cũ | 220 | 1 | Niệm 3s (bị đánh thì hỏng) rồi dịch chuyển tới Thương Nhân gần tâm bo nhất. |
| 🪝 Dây Móc | dụng cụ | 160 | 2 | Phóng dây tới vách đá / chỗ cao trong 9 đv rồi đu tới (vượt tường, lên chỗ cao), không thể bị chọn khi đu. |
| 🪤 Bẫy Kẹp | dụng cụ | 90 | 3 | Đặt bẫy ẩn (90s): kẻ địch đạp vào bị trói 1.5s, lộ diện 4s, mất 6% máu tối đa. |
| 💣 Bom Tự Chế | dụng cụ | 160 | 2 | Ném tới điểm trong 6 đv, nổ sau 0.6s (bán kính 2.5): 10% máu tối đa và đẩy lùi. |
| 📜 Phù Kháng Độc | phù | 150 | 2 | Nhận ít hơn 65% sát thương bo trong 25s. |
| 🧿 Phù Hộ Mệnh | phù | 200 | 1 | Dán lên người 60s: đòn chí mạng kế tiếp chỉ để lại 1 máu và cho khiên 15% máu tối đa. |
| 🌫 Phù Ẩn Thân | phù | 160 | 1 | Tàng hình 4s (đánh / dùng chiêu thì lộ). |
| 🌪 Phù Thần Tốc | phù | 110 | 2 | +40% tốc chạy 4s, miễn làm chậm. |
| 📡 Cột Sóng Trinh Sát | dụng cụ | 130 | 2 | Cắm cột phát sóng tại chỗ (tồn tại 45s): Quét và làm lộ diện toàn bộ tướng địch trong bán kính 16 đv (kể cả núp bụi), vô hiệu hóa tàng hình trong vùng quét. |
| 🧲 Lựu Đạn Xung Điện | dụng cụ | 150 | 2 | Ném tới điểm trong 7 đv, nổ sau 0.5s (bán kính 2.5 đv): Phá hủy ngay 350 Hộ Giáp (+30/cấp) của mọi mục tiêu và cấm dùng Dây Móc trong 2.5s. |
| 🪞 Gương Ảo Ảnh Bỏ Túi | dụng cụ | 170 | 1 | Tạo ngay 1 phân thân chạy thẳng về phía trước trong 4s để đánh lừa đối thủ và quái rừng; bản thân nhận tàng hình 1.5s và tăng 25% tốc chạy. |
| ❄ Bẫy Băng Cổ | dụng cụ | 110 | 3 | Đặt bẫy ẩn (90s): Kẻ địch giẫm phải bị Đóng Băng (choáng tuyệt đối) 1.2s, sau đó mặt sàn hóa băng trơn trượt làm giảm 40% khả năng kiểm soát hướng chạy trong 3s. |
| 🩸 Dược Huyết Chiến | phù | 160 | 2 | Uống tức thì: Nhận 20% Hút Máu và +15% Công Vật Lý / Công Phép trong 8s, nhưng giảm 30% lượng Hộ Giáp hiện có của bản thân. |
| 🧪 Dầu Đạn Ăn Mòn | phù | 140 | 2 | Thoa lên vũ khí (hiệu lực 12s): 4 đòn đánh hoặc phát bắn kế tiếp nhận thêm 50% Xuyên Thủng Hộ Giáp (sát thương đánh thẳng vào Máu Đỏ). |
| 🪨 Phù Thạch Hóa | phù | 190 | 1 | Hóa đá cơ thể tại chỗ trong 2.0s: Bất động hoàn toàn, miễn nhiễm 100% mọi loại sát thương và khống chế (không bị bão bo đốt máu trong thời gian này). |
| 💨 Bom Khói Dập Lửa | dụng cụ | 120 | 2 | Ném xuống chân tạo màn khói dày đặc bán kính 4 đv trong 5s: Chặn đứng mọi tầm nhìn từ bên ngoài vào, dập tắt các hiệu ứng Thiêu Đốt và Vết Thương Sâu trên người đứng bên trong. |
| 🪶 Dây Móc Tiếp Tốc | dụng cụ | 180 | 2 | Bắn móc kéo thẳng bản thân về phía mục tiêu tướng hoặc quái lớn trong 8.5 đv: Gây choáng 0.5s khi chạm mục tiêu và lập tức hồi 1 phát lướt ngắn 2.5 đv. |
- AI dùng: thanh tẩy khi bị khống chế cứng; phù kháng độc khi đứng ngoài bo; hộ mệnh / lá chắn / hồi máu khi bị đánh mà máu thấp; bỏ chạy bị bám sát → dây móc / tốc biến / ẩn thân / thần tốc / tốc hành / kiệt sức; đánh nhau → thiêu đốt / trừng trị kết liễu, bom vào kẻ bị khống chế, kiệt sức kẻ đang thắng mình; trừng trị cướp boss; bẫy dưới chân khi bị đuổi hoặc trên lối vào chỗ núp; dịch chuyển về Thương Nhân khi xa bo và vắng người. Mua theo "balo mong muốn" của tính cách.
- **Rương đồ**: mỗi vùng 5 rương lúc đầu + 1 rương trong mỗi nhà / đền / cao nguyên / tháp canh; mỗi 120s thêm 5 rương trong vòng bo kế tiếp (tới phút 40). Mở mất 1.5s (đứng yên, bị đánh / khống chế thì hỏng): 2 vật phẩm ngẫu nhiên + 60 vàng, 15% nâng balo, 8% ý niệm +1. AI không mở rương khi vừa bị đánh hoặc có đối thủ trong 8 đv.
- **May Mắn** (GĐ8): rương có thêm món (theo may mắn), ưu tiên món giá cao hơn; tỉ lệ ra mảnh hồn (15%), nâng balo, ý niệm ×(1 + may mắn).

## 13f. Bản đồ sinh theo hạt giống (GĐ7)
- Khung cố định (công bằng): ổ boss, vách núi ranh giới (có khe), 56 bãi quái, 7 Thương Nhân, 10 điểm xuất phát, bụi gốc, tảng đá che giữa hai điểm xuất phát.
- 5 vùng thường lấy ngẫu nhiên 5 trong 6 biome (xáo thứ tự): 🌲 Rừng Thông (nhiều bụi rậm, thân cây đổ, nhà gỗ) • 🐸 Đầm Lầy Sương (sương mù (tầm nhìn −20%), vũng bùn làm chậm, cầu gỗ) • ⛰ Núi Đá Đỏ (nhiều cao nguyên, hẻm núi, thùng thuốc nổ) • 🌾 Đồng Cỏ Vàng (nhà dân, cối xay gió, ụ rơm) • ❄ Tuyết Sơn (mặt băng trơn (chạy nhanh hơn), cao nguyên) • 🏜 Sa Mạc Cát (cát lún làm chậm, đền cổ, xương rồng). Phế Tích luôn ở giữa.
- **2 vùng đặc biệt** (GĐ8, cố định): 💀 **Vùng Tử Khí** (tử khí mù mịt (tầm nhìn −30%), mây tử khí rút máu bất chợt, nghĩa địa, Hang Tử Khí) • ☣ **Trạm Khí Độc** (bồn khí độc nổ ra mây độc, ống xả phun độc định kỳ, Lò Khí Độc). Tử Khí: mỗi ~14s một đám mây tử khí ập xuống gần một tướng trong vùng (báo trước 1.5s): rút 1.5% máu/s + vết thương sâu trong 6s. Khí Độc: mỗi ~10s một ống xả / bồn khí phun độc (báo trước 1.2s): 2% máu/s trong 3s + chậm 20%; thùng độc nổ ra mây độc 5s; Chuột Đột Biến chết thì nổ.
- Mỗi vùng 6–8 công trình rút từ "túi" của biome (luôn có ít nhất 1 công trình đặc trưng), Phế Tích thêm 3–4: 🏠 nhà (cửa 1–2 phía), 🏛 đền đổ (cột góc + tường đổ dở), ⛰ cao nguyên (vách đá quanh, 1–2 dốc lên), 🗼 tháp canh (cao nguyên nhỏ 1 dốc), 🌉 cầu qua suối, hẻm núi (2 vách song song), ao bùn / mặt băng / cát lún, 💥 cụm thùng thuốc nổ, thân cây đổ, 🌬 cối xay gió, xương rồng, bụi rậm / ụ rơm thêm.
- Kiểm tra hợp lệ: công trình cách điểm xuất phát ≥ 11 + cỡ, bãi quái ≥ 6.5 + cỡ, Thương Nhân ≥ 10 + cỡ, công trình khác ≥ 3 đv, tường cũ; loang lưới 2 đv: mọi điểm xuất phát / bãi quái / Thương Nhân / trong nhà / trên cao nguyên phải đi tới được, vùng kín ≤ 40 ô; lưới tìm đường liên thông. Hỏng → thử hạt giống phụ (tối đa 6 lần) → bản đồ cổ điển.
- Địa hình: Bùn tốc chạy ×0.7, Cát lún tốc chạy ×0.65, Mặt băng tốc chạy ×1.2 (Phù Thần Tốc miễn chậm). Sương mù Đầm Lầy: tầm nhìn ×0.8. Tường thấp (nước, thân cây, mép cao nguyên) chặn đi lại nhưng đạn bay qua.
- **Độ cao**: đứng trên cao nguyên / tháp canh: tầm nhìn ×1.25; người dưới thấp chỉ thấy người trên cao khi trong 7 đv; đánh từ trên xuống +10% sát thương. Lên bằng dốc hoặc dây móc.
- **Thùng thuốc nổ**: trúng đạn, nằm trong chiêu diện rộng hoặc bị đánh trực tiếp → cháy ngòi 0.45s rồi nổ bán kính 3.2 đv: tướng mất 20% máu tối đa (sát thương chuẩn, tính công kẻ kích nổ) và bị hất 2.2 đv, quái mất 500 máu; nổ dây chuyền thùng bên cạnh sau 0.3s.

## 13g. Liên minh tạm thời (GĐ7b)
- Hai tướng gặp nhau (trong 13 đv, cả hai còn ≥ 45% máu, không đang đánh nhau) từ giây 90 tới phút 25 có thể kết liên minh 210s (mỗi tướng tối đa 2 lần, hỏi lại sau 25s). Ai hay đề nghị / dễ nhận lời / dễ phản bội tùy tính cách; đang thù nhau thì không.
- Đồng minh: không cố ý nhắm nhau, không săn nhau, **chung tầm nhìn**, lao vào giúp khi đồng minh bị tướng khác đánh, cùng đánh mục tiêu của đồng minh, đi cùng nhau.
- **Sát thương vẫn gây lên nhau** (chiêu diện rộng, thùng nổ…): gây cho đồng minh ≥ 15% máu tối đa của họ thì liên minh vỡ. Tự tan khi hết hạn, khi một bên gục, hoặc khi còn ≤ 4 người.
- Phản bội: khi đồng minh xuống dưới 25% máu (hoặc cúi xuống mở rương), mỗi bên "nổi lòng tham" một lần theo tính cách (Ngụy Quân Tử luôn luôn; Kẻ Bắt Nạt 60%, Kền Kền 50%…; Hòa Bình, Võ Sĩ, Vệ Sĩ, Cuồng Tín không bao giờ) → "Đâm sau lưng!", người bị phản bội thù 2 phút.

- **GĐ9 — trao đổi**: hai đồng minh không đang đánh, ở gần (≤ 10 đv) thì mỗi ~18s cân nhắc: **đổi 1 mảnh hồn lấy 1 mảnh** khi cả hai cùng lợi (tính giá trị bộ mảnh: mảnh gắn tính đủ, mảnh cất 35%), **đổi 1 món balo** (món mình thừa mà bạn thiếu, đổi lại món bạn thừa mà mình thiếu), hoặc **mua bán bằng vàng** (mảnh gần như vô dụng với người bán — giá 40 × bậc² vàng; bình / vật phẩm thừa — giá gốc). Ở xa (≤ 80 đv) mà thấy có món đáng đổi → hẹn gặp, cả hai đi về phía nhau.
- **GĐ9 — bịp (chỉ liên minh TẠM)**: kẻ ưa bịp (Ngụy Quân Tử 0.8, Quấy Nhiễu 0.6, Con Bạc / Kền Kền 0.4, Khát Nước / Thực Dụng / Mồi Câu 0.35…; Hòa Bình, Võ Sĩ, Vệ Sĩ không bao giờ) có thể **đổi gian** (rao mảnh của mình là hàng xịn, lấy mảnh tốt của bạn — mình lợi, bạn lỗ) hoặc **báo tin giả** (đứng gần rương / thính / mảnh hồn ngon thì hô "bên kia có của" chỉ bạn đi xa 42 đv để một mình ôm). Bạn nhìn thấu với xác suất 0.18 + 0.05 × (Tâm Lý − 11) + 0.03 × (Đọc Bản Đồ − 11) (5–75%): nhìn thấu → từ chối, thù, có thể cắt liên minh; bị lừa → mất mảnh / chạy tới chỗ trống, sau đó **vỡ lẽ** (tới nơi thấy trống, hoặc 25–60s sau nhận ra mảnh dỏm) → thù 2 phút, liên minh vỡ. Liên minh **lâu dài** (người của nhà cái — GĐ9b) luôn đổi thật, được cho không bình máu.
- **GĐ9 — trao đổi theo tính cách**: ⚖ **Thương Nhân** (Roxie) và 🎭 **Kẻ Bịp Bợm** (Joker) gạ **đình chiến mua bán** 40s với BẤT KỲ AI gặp trên đường (≤ 18 đv, không đang đánh nhau); người kia nhận lời tùy tính cách (Hòa Bình / Thực Dụng 90%, Tham Farm / Con Bạc 75%, Võ Sĩ 20%, Cuồng Tín 10%…; ai từng bị lừa thì không tin nữa). Hai tính cách này mang **kho hàng** 4 mảnh (khởi đầu 2 mảnh Trắng/Xanh; mảnh thừa cất kho thay vì văng ra; nhặt mọi mảnh trên đất làm hàng). Thương Nhân: mua mảnh người ta không cần giá 60%, bán mảnh người ta cần giá 130%, bán vật phẩm balo thiếu giá 130%, **không bao giờ bịp**. Kẻ Bịp Bợm: **bán mảnh dỏm** (rao là bậc cao hơn một bậc, đòi giá bậc đó × 1.2), mua rẻ 35%, đổi gian, báo tin giả dụ người ta vào bẫy của mình; trong đình chiến mua bán gần như chắc chắn bịp (95%).

## 13h. "Múa" — phối hợp chiêu (GĐ7b)
- Đủ ≥ 2 chiêu tấn công lên mục tiêu → lên **chuỗi combo** theo thứ tự: lướt áp sát (nếu ngoài tầm) → khống chế → dồn sát thương / cấu rỉa → chiêu cuối (nếu đáng dùng); tối đa 4 bước. Giữa hai chiêu chen 1 đòn đánh thường nếu đòn đã sẵn và trong tầm. Khoảng nghỉ giữa các bước 0.08–0.3s theo Kỹ Năng; đang combo thì AI nghĩ mỗi nhịp (1/20s) và không chen việc khác; chiêu kế tiếp ngoài tầm thì áp sát chờ.
- **Gom chiêu**: chỉ có 1 chiêu sẵn mà chiêu nối tiếp sắp hồi (≤ 1.2s) → giữ lại tối đa 1.2s để ra thành chuỗi (đối thủ còn > 25% máu, mình còn > 35%). Tướng lạ tay đôi khi không nối được chuỗi.
- Hình: động tác riêng theo loại chiêu — lướt (thân lao tới, co giãn, bóng mờ nối đuôi), khống chế (giơ cao rồi đập xuống), chém xen kẽ trái–phải, đâm / giật súng, chiêu cuối xoay, hỗ trợ giơ vũ khí, thế thủ; thân người dồn theo đòn; hoàn thành chuỗi ≥ 3 bước hiện "✦ COMBO ×n".

## 13d. Cổng quyết đấu (GĐ6b)
- Mở lần đầu lúc 8:00, sau mỗi lần đóng/kết thúc 300s lại mở (cần ≥ 3 người còn trong trận). Vị trí: trong vòng bo kế tiếp, **giữa hai tướng** (không sát ai), báo cho mọi người. Cổng mở 150s.
- Ghi danh: đứng trong 2.6 đv quanh cổng đủ 2s (không bị đánh 0.6s, không niệm chiêu). Người thứ hai ghi danh → cả hai bị **kéo vào vòng quyết đấu** bán kính 12 đv: người ngoài không vào được, không ai đánh được ai qua vòng, bo không đốt, quái không với tới; đánh tới khi một người gục (cả hai đánh hết mình, không bỏ chạy).
- Thắng: 1000 vàng, 1200 KN, hồi 50% máu, mảnh hồn bậc 3. Quá 150s: vòng siết lại, đốt cả hai 4% máu tối đa mỗi giây.

## 13j. Súng, đạn & nạp đạn (GĐ9 — theo bản Di sản)
| Tướng | Băng đạn | Nạp gốc | Ghi chú |
|---|---|---|---|
| Clint | 2 | 1s | nạp từng viên |
| Zero | 9 | 1.6s | nạp cả băng |
| Chrono & Neo | 10 (+ 4 dạng phụ) | 1.5s | nạp cả băng |
| Jack "Sáu Lỗ" | 6 | 2s | nạp cả băng |
| Raven | 30 | 3s | nạp cả băng |
| Dr. Vector | 8 | 1.8s | nạp cả băng |
- **Thời gian nạp** T = T_gốc / (1 + Tốc Đánh cộng thêm + Tốc Nạp). Tốc đánh cộng thêm = phần vượt tốc đánh nền của tướng (đồ, mảnh hồn, bùa…). **Khóa nạp** (Reload Lock — ví dụ thế đứng tại chỗ) bỏ qua tốc đánh, chỉ tính Tốc Nạp.
- Mảnh hồn Nạp Đạn (19) và Tốc Đánh (10): thêm Tốc Nạp, băng đạn (+%), nạp lại khi lướt / hạ gục / dùng chiêu, đạn đầu băng mạnh hơn… (bảng mục 13c, mã *_RL_* / *_AS_*). Mảnh nạp đạn chỉ hợp tướng súng (tướng khác ít khi ra, ×0.3 điểm gắn).
- AI: hết đạn mà đang nạp → có Xả Chiêu Tiếp Đạn thì xả chiêu trước (nạp 50% băng); có cận chiến áp sát hoặc có Tĩnh Tâm thì lùi ra né đòn khi nạp.
- **Gideon** (GĐ9): Đại Trường Kiếm — tầm đánh thường 2.7, **tốc đánh cố định** (không đổi theo đồ), mọi tốc đánh cộng thêm chuyển thành % sát thương đòn đánh. **Raven** (GĐ9): súng trường 30 viên khi thả diều; ống ngắm bắn rất xa (45 đv khi quạ Oca còn sống — Oca thấy mục tiêu là bắn được, 7.5 đv khi mất Oca), Oca tự bay xa tìm con mồi máu thấp; mục tiêu ngoài tầm ngắm → dời chỗ bắn.

- **GĐ12 — nạp đạn không tức thì**: vừa bắn phải chờ 1s (đang giao tranh trong 3s: 1.6s; có Tốc Nạp: −0.4s) mới bắt đầu nạp; **trúng đòn từ tướng / vật triệu hồi khi đang nạp → ngắt**, lần nạp đang chạy quay về đầu (Clint nạp từng viên: viên đang nạp quay về đầu). Áp cho Zero, Clint, Jack, Chrono & Neo, Raven, Dr. Vector.

## 13k. Nhận thức: tầm nhìn, thính giác, truy vết (GĐ9)
- **Tầm nhìn** = gốc × (1 + % tầm nhìn từ mảnh hồn, tối đa +100%); mảnh "không sương" bỏ hệ số sương / đêm; Nguyệt Thực thu hẹp tầm nhìn đối thủ; Phá Ảo Chân Thị miễn mù. Một số mảnh cho **thấy riêng** một đối thủ trong vài giây (đánh dấu).
- **Thính giác**: nghe tiếng giao tranh trong 30 đv, tiếng lướt / chiêu di chuyển 18 đv, tiếng bước chân ngoài bụi 9 đv (× (1 + 0.25 × Đọc Bản Đồ)); mảnh Phá Sóng Nhiễu Loạn làm bước chân câm. Nghe thấy → nhớ vị trí có sai số 3 × (1 − Đọc Bản Đồ) đv.
- **Truy vết**: mất dấu mục tiêu khi đang đánh / đang săn → đi tới vị trí cuối cùng + ngoại suy theo vận tốc lúc mất dấu, kiểm tra bụi gần đó; tối đa vài giây rồi bỏ.
- Utility dùng mảnh Tầm Nhìn: Nhiệt Ảnh / Thấu Thị Thảo Mộc nâng điểm "kết liễu" lên 2.0 với mục tiêu < 40% máu; Tiên Tri Vòng Bo bỏ farm, chiếm tâm bo sớm 45s; mảnh Tầm Đánh nới khoảng thả diều và tăng điểm cấu rỉa.

## 13l. Lối build ưa thích & mảnh hồn yêu thích (GĐ9)
- Mỗi tướng có **3 lối build sở trường**; mỗi trận chọn 1 theo hạt giống (45% / 33% / 22% — lối đầu hay được chọn nhất). Lối build quyết định thứ tự mua đồ (vẫn đổi món theo đội hình địch như cũ) và các chỉ số mảnh hồn tướng ưu tiên gắn. Ngoài ra mỗi tướng có 3 **mảnh hồn yêu thích** (đi nhặt mảnh yêu thích dù xa hơn).
- **Cầu Toàn** (tính cách GĐ9): luôn theo lối build số 1, không đổi món theo đối thủ; mảnh yêu thích +2.5 điểm, hợp build +0.9, lạc bộ ×0.6; săn mảnh yêu thích trên đất (×3 giá trị); độ hăng ×(0.8 + 0.45 × mức hoàn thiện bộ). **Bình Thường**: không luật riêng (mặc định cho tướng chưa khai báo tính cách).
| Khuôn build | Giày | Thứ tự 5 món | Chỉ số mảnh ưu tiên |
|---|---|---|---|
| Chí Mạng | Giày Cuồng Chiến | Đao Phá Quân → Cung Gió Lốc → Kiếm Bão Táp → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép | Chí Mạng, Công Vật Lý, Tốc Đánh |
| Tốc Đánh | Giày Cuồng Chiến | Song Đao Tàn Huyết → Cung Thần Phong → Dao Cắt Gân → Cung Gió Lốc → Huyết Kiếm Đoạt Mệnh | Tốc Đánh, Công Vật Lý, Hút Máu |
| Xuyên Giáp | Giày Đinh Gỉ | Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy | Công Vật Lý, Chí Mạng, Tốc Chạy |
| Đấu Sĩ | Giày Thép | Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch | Máu, Công Vật Lý, Hút Máu |
| Đỡ Đòn | Giày Thép | Vương Miện Bất Khả Xâm Phạm → Giáp Gai → Áo Giáp Dung Nham → Trái Tim Cự Thạch → Áo Choàng Thánh Linh | Máu, Hộ Giáp, Kháng Hiệu Ứng |
| Dồn Phép | Giày Khai Sáng | Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo | Công Phép, Công Phép %, Hồi Chiêu |
| Pháp Sư Trâu | Giày Thủy Ngân | Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo | Công Phép, Máu, Hồi Chiêu |
| Hồi Chiêu | Giày Khai Sáng | Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh | Hồi Chiêu, Công Phép, Tốc Chạy |
| Bảo Hộ | Giày Khai Sáng | Lệnh Bài Chinh Phạt → Đèn Lồng Tinh Linh → Lư Hương Cổ → Kính Cú Đêm → Ngọc Bội Hộ Mệnh → Khiên Lâm Thần | Hồi Chiêu, Máu, Công Phép |
| Hộ Vệ | Giày Thép | Lệnh Bài Chinh Phạt → Khiên Lâm Thần → Chuông Thức Tỉnh → Vương Miện Bất Khả Xâm Phạm → Giáp Ma Quái → Áo Choàng Thánh Linh | Máu, Hộ Giáp, Kháng Hiệu Ứng |
| Đơn Đấu | Giày Cuồng Chiến | Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái | Tốc Đánh, Hút Máu, Công Vật Lý |
| Xạ Thủ Súng | Giày Cuồng Chiến | Cung Thần Phong → Đao Phá Quân → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép | Tốc Nạp, Tốc Đánh, Chí Mạng |
| Sát Thủ | Giày Đinh Gỉ | Dao Ám Ảnh → Kiếm Bão Táp → Dao Tử Thần → Mũi Khoan Thép → Khăn Thanh Tẩy | Công Vật Lý, Tốc Chạy, Chí Mạng |
| Đấu Sĩ Phép | Giày Thép | Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Đồng Hồ Cát Nghịch Đảo → Giáp Gai → Trái Tim Cự Thạch | Công Phép, Máu, Hút Máu |

| Tướng | 3 lối build | Mảnh hồn yêu thích |
|---|---|---|
| Alice | Dồn Phép / Hồi Chiêu / Pháp Sư Trâu | Hồn Thấu Thị Thảo Mộc (Tím), Hồn Phá Sóng Nhiễu Loạn (Vàng), Hồn Nguyệt Thực Hắc Ám (Đỏ) |
| Aria & Oktava | Bảo Hộ / Hồi Chiêu / Hộ Vệ | Hồn Trợ Năng (Tím), Hồn Phá Ảo Chân Thị (Vàng), Hồn Thiên Nhãn Xuyên Giới (Đỏ) |
| Ariston | Đỡ Đòn / Đấu Sĩ / Xuyên Giáp | Hồn Trường Nhận Phong Khí (Vàng), Hồn Titan Phá Giới (Đỏ), Hồn Thính Giác Địa Chấn (Tím) |
| Bạch Diệp | Dồn Phép / Hồi Chiêu / Pháp Sư Trâu | Hồn Thiên Nhãn Xuyên Giới (Đỏ), Hồn Tuyệt Đích Bất Suy (Vàng), Hồn Minh Hỏa Bí Thuật (Tím) |
| Boran | Đấu Sĩ / Đơn Đấu / Xuyên Giáp | Hồn Vô Ảnh Cực Tốc (Vàng), Hồn Liên Hoàn Trảm (Xanh), Hồn Thần Tốc Thiên Mệnh (Đỏ) |
| Borg | Đấu Sĩ / Đỡ Đòn / Đơn Đấu | Hồn Phi Thân Trảm Kích (Vàng), Hồn Titan Phá Giới (Đỏ), Hồn Thính Giác Địa Chấn (Tím) |
| Dr. Caelus | Dồn Phép / Hồi Chiêu / Pháp Sư Trâu | Hồn Tiên Tri Vòng Bo (Vàng), Hồn Thiên Nhãn Xuyên Giới (Đỏ), Hồn Radar Tàn Tích (Tím) |
| Chrono & Neo | Xạ Thủ Súng / Chí Mạng / Tốc Đánh | Hồn Xả Chiêu Tiếp Đạn (Vàng), Hồn Ổ Đạn Mở Rộng (Tím), Hồn Bão Đạn Vô Tận (Đỏ) |
| Clint | Đấu Sĩ / Xạ Thủ Súng / Xuyên Giáp | Hồn Lộn Nhào Nạp Đạn (Tím), Hồn Sóng Nhiệt Buồng Đạn (Vàng), Hồn Phản Xạ Thoát Hiểm (Đỏ) |
| Dahlia | Đấu Sĩ Phép / Pháp Sư Trâu / Dồn Phép | Hồn Phong Lôi Liên Kích (Tím), Hồn Vũ Điệu Tử Thần (Vàng), Hồn Nguyệt Thực Hắc Ám (Đỏ) |
| Death | Đấu Sĩ Phép / Pháp Sư Trâu / Dồn Phép | Hồn Nhiệt Ảnh Truy Mệnh (Vàng), Hồn Nguyệt Thực Hắc Ám (Đỏ), Hồn Trường Nhận Phong Khí (Vàng) |
| Elara | Chí Mạng / Tốc Đánh / Xuyên Giáp | Hồn Xạ Thủ Xuyên Vân (Vàng), Hồn Tuyệt Đích Bất Suy (Vàng), Hồn Định Vị Thiện Xạ (Đỏ) |
| Florian | Đơn Đấu / Đấu Sĩ / Sát Thủ | Hồn Phi Thân Trảm Kích (Vàng), Hồn Liên Hoàn Trảm (Xanh), Hồn Vũ Điệu Tử Thần (Vàng) |
| Galo | Pháp Sư Trâu / Hồi Chiêu / Dồn Phép | Hồn Tiên Tri Vòng Bo (Vàng), Hồn Radar Tàn Tích (Tím), Hồn Nguyệt Thực Hắc Ám (Đỏ) |
| Gideon | Đấu Sĩ / Đỡ Đòn / Xuyên Giáp | Hồn Trường Nhận Phong Khí (Vàng), Hồn Titan Phá Giới (Đỏ), Hồn Vô Ảnh Cực Tốc (Vàng) |
| Ignatius | Dồn Phép / Hồi Chiêu / Pháp Sư Trâu | Hồn Nhiệt Ảnh Truy Mệnh (Vàng), Hồn Thiên Nhãn Xuyên Giới (Đỏ), Hồn Ưng Nhãn (Tím) |
| Jack "Sáu Lỗ" | Chí Mạng / Xạ Thủ Súng / Tốc Đánh | Hồn Cò Quay Bất Tận (Vàng), Hồn Đạn Cuối Chấn Địa (Tím), Hồn Trảm Quyết Xuyên Tâm (Đỏ) |
| Joker | Hồi Chiêu / Dồn Phép / Bảo Hộ | Hồn Phá Sóng Nhiễu Loạn (Vàng), Hồn Thấu Thị Thảo Mộc (Tím), Hồn Huyết Tế Toàn Cảnh (Đỏ) |
| Justus | Bảo Hộ / Hồi Chiêu / Pháp Sư Trâu | Hồn Ưng Nhãn (Tím), Hồn Phá Ảo Chân Thị (Vàng), Hồn Thiên Nhãn Xuyên Giới (Đỏ) |
| Kazuki | Sát Thủ / Đơn Đấu / Tốc Đánh | Hồn Phong Lôi Liên Kích (Tím), Hồn Vũ Điệu Tử Thần (Vàng), Hồn Thần Tốc Thiên Mệnh (Đỏ) |
| Kip | Sát Thủ / Xuyên Giáp / Đơn Đấu | Hồn Phi Thân Trảm Kích (Vàng), Hồn Phong Lôi Liên Kích (Tím), Hồn Thần Tốc Thiên Mệnh (Đỏ) |
| Koda | Đấu Sĩ / Đơn Đấu / Sát Thủ | Hồn Phi Thân Trảm Kích (Vàng), Hồn Liên Hoàn Trảm (Xanh), Hồn Thần Tốc Thiên Mệnh (Đỏ) |
| Luca | Dồn Phép / Hồi Chiêu / Pháp Sư Trâu | Hồn Thấu Thị Thảo Mộc (Tím), Hồn Phá Sóng Nhiễu Loạn (Vàng), Hồn Nguyệt Thực Hắc Ám (Đỏ) |
| Lyra | Hồi Chiêu / Dồn Phép / Bảo Hộ | Hồn Tiên Tri Vòng Bo (Vàng), Hồn Ưng Nhãn (Tím), Hồn Thiên Nhãn Xuyên Giới (Đỏ) |
| Mirage | Dồn Phép / Hồi Chiêu / Pháp Sư Trâu | Hồn Thấu Thị Thảo Mộc (Tím), Hồn Phá Sóng Nhiễu Loạn (Vàng), Hồn Nguyệt Thực Hắc Ám (Đỏ) |
| Olivia | Bảo Hộ / Hồi Chiêu / Pháp Sư Trâu | Hồn Ưng Nhãn (Tím), Hồn Phá Ảo Chân Thị (Vàng), Hồn Thiên Nhãn Xuyên Giới (Đỏ) |
| Percy | Tốc Đánh / Chí Mạng / Xuyên Giáp | Hồn Xạ Thủ Xuyên Vân (Vàng), Hồn Xuyên Cực Vạn Dặm (Đỏ), Hồn Tuyệt Đích Bất Suy (Vàng) |
| Ratok | Đỡ Đòn / Hộ Vệ / Đấu Sĩ | Hồn Phi Thân Trảm Kích (Vàng), Hồn Titan Phá Giới (Đỏ), Hồn Thính Giác Địa Chấn (Tím) |
| Raven | Xuyên Giáp / Chí Mạng / Xạ Thủ Súng | Hồn Định Vị Thiện Xạ (Đỏ), Hồn Tuyệt Đích Bất Suy (Vàng), Hồn Thiên Nhãn Xuyên Giới (Đỏ) |
| Roxie & T-Zero | Pháp Sư Trâu / Hồi Chiêu / Dồn Phép | Hồn Radar Tàn Tích (Tím), Hồn Tiên Tri Vòng Bo (Vàng), Hồn Thiên Nhãn Xuyên Giới (Đỏ) |
| Ryoma | Sát Thủ / Đơn Đấu / Xuyên Giáp | Hồn Trường Nhận Phong Khí (Vàng), Hồn Titan Phá Giới (Đỏ), Hồn Vũ Điệu Tử Thần (Vàng) |
| Diệp Thanh Phong | Dồn Phép / Hồi Chiêu / Pháp Sư Trâu | Hồn Phá Ảo Chân Thị (Vàng), Hồn Thiên Nhãn Xuyên Giới (Đỏ), Hồn Ưng Nhãn (Tím) |
| Theron | Đấu Sĩ / Xuyên Giáp / Đỡ Đòn | Hồn Trường Nhận Phong Khí (Vàng), Hồn Phi Thân Trảm Kích (Vàng), Hồn Titan Phá Giới (Đỏ) |
| Tsukiyo | Sát Thủ / Đơn Đấu / Đấu Sĩ Phép | Hồn Vũ Điệu Tử Thần (Vàng), Hồn Phong Lôi Liên Kích (Tím), Hồn Thần Tốc Thiên Mệnh (Đỏ) |
| Valerius | Đỡ Đòn / Đấu Sĩ / Hộ Vệ | Hồn Trường Nhận Phong Khí (Vàng), Hồn Thính Giác Địa Chấn (Tím), Hồn Huyết Tế Toàn Cảnh (Đỏ) |
| Dr. Vector | Xạ Thủ Súng / Chí Mạng / Xuyên Giáp | Hồn Xả Chiêu Tiếp Đạn (Vàng), Hồn Xuyên Cực Vạn Dặm (Đỏ), Hồn Đầu Đạn Phá Giáp (Tím) |
| Vesper | Sát Thủ / Xuyên Giáp / Đơn Đấu | Hồn Thấu Thị Thảo Mộc (Tím), Hồn Phá Sóng Nhiễu Loạn (Vàng), Hồn Nguyệt Thực Hắc Ám (Đỏ) |
| Victoria | Đấu Sĩ / Tốc Đánh / Hộ Vệ | Hồn Phá Ảo Chân Thị (Vàng), Hồn Thính Giác Địa Chấn (Tím), Hồn Huyết Tế Toàn Cảnh (Đỏ) |
| Wukong | Đấu Sĩ / Đơn Đấu / Đỡ Đòn | Hồn Trường Nhận Phong Khí (Vàng), Hồn Thần Tốc Thiên Mệnh (Đỏ), Hồn Titan Phá Giới (Đỏ) |
| Zero | Xạ Thủ Súng / Chí Mạng / Xuyên Giáp | Hồn Đoạt Mệnh Nạp Tức Thì (Vàng), Hồn Đầu Đạn Phá Giáp (Tím), Hồn Kim Thần Tiếp Đạn (Hoàng Kim) |

## 13m. Bộ não chiến đấu (GĐ11 — src/sim/ai/combat_brain.js)
Lớp vi thao tác chạy trên nền Utility AI, giúp mỗi tướng **dùng tối đa bộ chiêu của mình** và đánh như người thật:
1. **Phân loại kỹ năng** (Skill Taxonomy): mỗi chiêu được gắn nhóm Damage / Mobility / CrowdControl / Defense / CounterParry và vai phụ, suy ra tự động từ dữ liệu chiêu (chiêu có thể ghi đè bằng `def.tax`). Hiện có 181 chiêu: Bộc phá 73 • Kết liễu 11 • Lướt thoát 33 • Lướt áp sát 34 • Né chiêu 30 • Khống chế cứng 73 • Khống chế mềm 37 • Đẩy / hất văng 28 • Khiên / giáp ảo 40 • Chặn / nuốt đạn 3 • Phản đòn cận chiến 3.
2. **Kỷ luật bình máu** (Consumable Sanity): khóa uống bình máu / Hộ Vệ khi — đang ngoài bo; đang Solo mà đối thủ còn > 2s khống chế; vừa bị tướng đánh trong 3s; có kẻ địch nhìn thấy mình trong tầm đe dọa mà không có vật cản; kẻ địch trong 12 đv. Chỉ uống khi đã cắt tầm nhìn / nấp sau vật cản / đủ xa (ghi lý do vào thẻ tướng).
3. **Đường Cùng Phản Sát** (Last Stand): máu < 25%, kẻ đuổi trong 9 đv nhanh hơn mình (hoặc xạ thủ bám tầm), không có bụi / chiêu thoát / vật cản → quay đầu khô máu 3.5s thay vì chạy làm bia.
4. **Suy luận hướng đòn & trả đũa** (Damage Inference): mỗi đòn trúng ghi lại kẻ đánh và hướng (cận chiến chính xác, tầm xa lệch ±5°, bẫy/vùng = môi trường). Bị đánh từ góc khuất → xoay mặt về hướng đó; có chiêu định hướng thì **bắn trả mù** dọc trục đạn; tướng mỏng lách ngang / tìm bụi; kẻ vừa đánh lén được +1.0 điểm chọn mục tiêu.
5. **Chống thả diều** (Anti-Kite): cận chiến bị đánh từ xa, đối thủ lùi, ngoài tầm → dùng chiêu **Lướt áp sát** chéo 45° (né trục đạn) hoặc đón đầu, vừa tới nơi thì nối ngay khống chế; hết chiêu thì zíc-zắc vào bụi, không chạy thẳng.
6. **Solo 1v1 FSM**: NEUTRAL → ENGAGE → RESET → EXECUTE; lực hút về tâm sàn khi quá 70% bán kính (không bị dồn góc), lực tách thân (không chồng lên nhau), luôn quay mặt về đối thủ; tầm xa bị dồn thì dùng chiêu thoát.
7. **Ép bo** (Zone Warfare): khóa chân kẻ đang ngoài bão bằng khống chế (giữ chúng ngoài bão 2–3s); **gác cổng** — đứng mép trong, không bước ra ngoài đánh; **ring-out** — kẻ địch < 6 đv sát mép thì vòng ra phía trong rồi dùng chiêu đẩy/hất văng ra ngoài bo; ngoài bo máu thấp thì **cấm đứng uống bình**, dùng mọi chiêu cơ động chạy vào.
8. **Liên minh vĩnh cửu** (mục 13o): bạn đang đánh nhau trong 35 đv → tới bọc lót (Luca mở Sân Khấu chia lửa), rảnh thì đi cùng nhau cách 3–6 đv.
9. **Luật Snapback chung** (chiêu "dùng lại để về điểm neo": Luca S3, Kip S1/S2…): đang ngoài bo mà điểm neo trong bo → giật về; máu < 40% vừa trúng đòn và điểm neo xa kẻ địch hơn → giật về; bị đuổi sát lúc sắp hết hạn → giật về; còn lại **không phí** (để hết hạn). Luca S4 chỉ đổi chỗ khi có lợi (ring-out, có nhánh choáng, hoặc nạn nhân đứng xa).
10. **Canh boss theo tính cách**: cả lò ai cũng biết **cửa sổ kết liễu** — sát thương sẵn sàng (×0.8) + Trừng Phạt ≥ máu boss → xả hết kể cả chiêu cuối. Có người khác tranh boss: 🦅 Kền Kền / Ngụy Quân Tử / Gieo Hỗn Loạn đứng ngoài dây xích chờ boss < 20% mới lao vào cướp; Ám Sát / Bắt Nạt / Võ Sĩ / Trảm Tướng / sát thủ quay sang đánh kẻ tranh boss đang < 55% máu.
11. **Kỷ luật âm thanh khi farm**: có tướng địch trong 35 đv (thấy hoặc vừa nghe tiếng) → khi farm không đốt chiêu lướt / chiêu áp sát lên quái và giữ mana ≥ 40% cho giao tranh sắp tới.
12. **Gắn hành vi theo nhánh tiến hóa** (Behavior Binding): nhánh có "sau lưng / đánh lén" → cận chiến đi vòng ra sau mục tiêu; "đỡ đòn / phản đòn / thế thủ" → luôn đọc đòn để phản kể cả khi đang khô máu; "mũi kiếm / điểm ngọt / cự ly" → giữ đúng cự ly ngọt; "kết liễu / máu thấp" → +0.8 điểm cho mục tiêu < 35% máu; "không bị ngắt / gồng" → không tự hủy chiêu.
13. **Ảo ảnh lừa đảo** (src/sim/decoy.js): chủ đang bỏ chạy (máu < 35%) → ảo ảnh chạy hướng ngược lại, lạng lách kéo kẻ đuổi đi sai đường; ảo ảnh < 40% máu → giả vờ tháo chạy như tướng thật sắp chết; còn lại đánh kẻ gần nhất nhưng lạng trái/phải giữa hai đòn.

## 13p. Chiến thuật AI GĐ12 (src/sim/ai/tactics12.js)
- **Pháp Sư Sát Thủ** (phong cách "Sát thủ phép": Alice, Diệp Thanh Phong, Luca, Dahlia, Mirage — bỏ nhãn thả diều): đọc vị mục tiêu thành **Máu Giấy** (tầm xa / pháp sư / xạ thủ), **Trâu Bò** (đấu sĩ cận chiến, đỡ đòn, giáp + kháng > 120, máu > 2600 hoặc Hộ Giáp > 25%) hoặc **Hỗ Trợ**.
  - Máy trạng thái 4 bước: **POKE_AND_BAIT** (cấu rỉa / dụ đòn) → **DIVE_ENGAGE** (lướt áp sát bằng chiêu tiếp cận, đón đầu 0.3s) → **BURST_EXECUTE** (khống chế cứng trước rồi dồn sát thương & chiêu cuối, tối đa 2.5s) → **TACTICAL_BAIL** (giật về điểm neo / lướt thoát 1.2–2s) → lại POKE khi có ≥ 1 chiêu sát thương.
  - Máu Giấy: **Dive-and-Bail** — lao khi có ≥ 2 chiêu sát thương + chiêu tiếp cận, quanh mục tiêu ≤ 1 kẻ địch khác, máu mình > 40%. Trâu Bò: **Kite-to-Execute** — chỉ thả diều cấu rỉa ở mép tầm, all-in khi mục tiêu ≤ 35% máu hoặc máu ≤ 90% sát thương combo.
  - **Cửa sổ hụt chiêu**: kẻ địch vừa tung chiêu cuối / chiêu hồi ≥ 9s mà không trúng tướng nào trong 1s → trong 3s nó là mục tiêu ưu tiên ×2, sát thủ lao vào ngay (2–4s).
- **Ngắm**: chiêu định hướng bắn **đón đầu** theo vận tốc (thời gian bay tối đa 1.4s, độ chính xác 80–100% theo Kỹ Năng Cá Nhân) cộng **sai số người thật ±0.2–0.6 đv**. **Check bụi**: vừa mất dấu < 3s, vị trí cuối sát bụi → ném một chiêu rẻ (không phải chiêu cuối / chiêu cơ động, còn ≥ 35% mana) vào bụi. **Chiêu vu vơ**: đối thủ đứng 6–9 đv chưa giao tranh → mỗi 4s có 3–5% tung chiêu cấu đón đầu.
- **Tường sau lưng**: khi lùi / thả diều quét 3 tia (thẳng, ±30°) dài tới 3 đv; tia giữa chạm tường → **trượt theo tiếp tuyến** sang phía trống. **Kẹt góc** (cả 3 tia chạm tường, kẻ địch ≤ 4.5 đv) → **lướt xuyên qua kẻ địch** sang phía sau nó; không có chiêu lướt → Tử Thủ.
- **Lướt vừa đủ**: đang trong vùng cảnh báo thì chỉ lướt tới mép vùng + 0.8 đv; đường lướt (không vượt tường) đụng tường → dừng trước tường 0.5 đv.
- **Kỷ luật bỏ chạy**: ngưỡng bỏ chạy bị kẹp 5–10% máu (tướng mỏng — xạ thủ, hỗ trợ, máu < 1400: 8–14%; tính cách hèn — Chuột Lũi, Hòa Bình, Thoát Xác, Đổi Mạng, Cầu Toàn: 10–25%). Đang chạy mà **kẹt góc**, hoặc **vừa bị chính kẻ đuổi đánh trong 2s + kẻ đuổi nhanh hơn + hết chiêu thoát** → **TỬ THỦ ALL-IN 3.5s**: khống chế cứng trước → dồn sát thương / chiêu cuối → đánh thường + trang bị.
- **Hoán vị**: snapback né chiêu lớn — đứng trong vùng cảnh báo sắp nổ (< 0.7s) mà điểm neo ở ngoài → giật về ngay; vừa đổi chỗ xong (Mirage S2, Luca S4) → 1.2s **đâm sau lưng** nạn nhân đang mất phương hướng; Mirage phân thân chọn ảo ảnh XA kẻ địch nhất; ring-out (Luca) giữ từ GĐ11.
- **Kazuki** chọn nhịp 2 chữ trước Kiếm Thế Quyết: **AA** khi ≥ 2 kẻ địch sát bên (xoay), **BA** khi đối thủ hút máu / đang hồi máu (Vết Thương Sâu), **AB** khi cần choáng (đối thủ niệm chiêu, bỏ chạy, máu cao), còn lại **BB**. **Ryoma** ghép cặp: **BB** (choáng) khi đối thủ niệm chiêu / sắp chết, **BC** (dư ảnh lao tới) khi mục tiêu > 3.5 đv, **CC** (gió xoáy làm chậm) khi máu thấp / gặp tướng tầm xa; Kiếm Khí chém nát đạn đang bay tới.
- **Dahlia** < 25% máu bị áp sát → Thoát Nguy đổi chỗ với quái / ảo ảnh XA kẻ địch nhất; đang mở Sân Khấu → kéo giao tranh về trong vòng. **Luca** đang Sân Khấu → lách vào trong vòng, Bước Nhảy liên hoàn; cải trang: vừa dùng khống chế cứng mượn → lật về bộ chiêu Luca mở Sân Khấu, vừa dùng khiên mượn → Ánh Đèn; 13.5–14s: điểm gốc an toàn thì chủ động giật về, nạn nhân < 20% máu thì ở lại kết liễu.
- **Va chạm**: tướng, quái, vật triệu hồi không lồng vào nhau (khoảng cách tối thiểu 97% tổng bán kính, đẩy 80% phần chồng mỗi bước, nặng nhẹ theo khối lượng) + lực trượt ngang cho bên đang di chuyển để lách qua nhau thay vì dính chùm; sau đẩy luôn đẩy ra khỏi tường.
- **Ảo ảnh** (mọi tướng): bước theo đường định sẵn, gặp tướng địch trong tầm đánh + 1.5 đv thì bỏ đường quay sang đánh; giữa hai đòn **đánh-rồi-lùi** (ảo ảnh cận chiến lùi ra mép tầm + 1 đv, lạng ngang).

## 13q. Thước Gió — Diệp Thanh Phong (GĐ13: src/data/heroes/thanhphong.js, src/sim/ai/tp_ai.js)
- **3 dạng gió**: Thuận ≤35 (tầm đánh 4.8, +15% tốc chạy, Giáp Phong Hộ chặn trọn 1 đòn/10s, đánh thường chậm 20% 1s) • Bão Hòa 36–64 (tầm 6.0, Gió Mê 3 tầng → ngủ 1s, mỗi 5s đòn đánh phóng 3 luồng lốc hất tung 0.5s) • Nghịch ≥65 (+20% sát thương, **cận chiến tầm 1.8**, mỗi 5s đòn kế tiếp là Đột Kích lướt tới 2.5–5.5 đv nổ sát thương phép). Đánh thường là sát thương phép.
- **Đổi gió tự nhiên**: S1 −17.5, S2 +17.5 (50 → 32.5 Thuận / 67.5 Nghịch bằng 1 chiêu). Quy tắc hiệu ứng: chiêu dùng ở dạng cực (Thuận/Nghịch) giữ hiệu ứng dạng đó; dùng ở Bão Hòa thì hiệu ứng theo dạng MỚI sau khi đổi (50 → S2 = đâm sau lưng ngay).
- **Skill phụ** (hồi 12s) làm mới S1–S3: Thuận→Nghịch lốc trời giáng + lướt tới • Bão Hòa nổ khí áp đẩy 2 đv + thanh tẩy • Nghịch→Thuận lướt lùi 4 đv, ném lốc hất tung, khiên 15% máu 3s.
- **AI**: mục tiêu máu giấy (hoặc < 35% máu) → muốn Nghịch: S2 đâm sau lưng → Đột Kích → S1 lướt theo lốc → S3 Thiên Lôi Phong; đấu sĩ/đỡ đòn áp sát → Thả Diều: Phụ lùi + khiên → S1 vực xoáy (về Thuận) → S2 màng chắn đẩy 4 đv → S3 gió độc hút tâm; trâu bò ở xa → giữ Bão Hòa cấu S1. Phụ chỉ khi: S1 & S2 đều hồi (xả 6 chiêu), bị khống chế ở Bão Hòa, hoặc Nghịch < 25% máu.
## 13n. Bo độc nâng cấp: Ăn Mòn & Vết Thương Sâu (GĐ11)
- **Ăn Mòn**: mỗi 1s ở ngoài bo +1 tầng (tối đa 15); mỗi tầng thêm 0.4% máu tối đa **sát thương chuẩn mỗi giây** (cộng với sát thương bo thường). Chỉ xóa sạch khi ở trong bo liên tục > 3s.
- **Vết Thương Sâu**: ngoài bo mọi hồi máu (bình, hút máu, chiêu hồi) **giảm 65%** → uống bình ngoài bo gần như phí; AI biết điều này (mục 13m.2, 13m.7).

## 13o. Quan hệ cốt truyện & liên minh vĩnh cửu (src/data/relations.js)
- **friend**: không ra tay trước (chỉ đánh trả khi bị chính họ đánh); còn ≤ 3 người thì tình bạn nhường chỗ cho ngôi vô địch. **protect**: ai đánh người này (≤ 4s) bị ưu tiên trừng phạt (+2.2 điểm). **hate**: cộng điểm ưu tiên tiêu diệt. **line**: câu thoại khi lần đầu chạm mặt.
- **eternal — liên minh vĩnh cửu** (GĐ11): không bao giờ đánh nhau, không săn nhau, không làm kền kền nhau, chung phe "đồng minh" cho mọi chiêu hỗ trợ; tới bọc lót khi người kia giao tranh trong 35 đv; **chỉ khi còn đúng 2 người** mới phân thắng bại.
| Tướng | Bạn | Bảo vệ | Vĩnh cửu | Thù (hệ số) |
|---|---|---|---|---|
| Luca | Alice | Alice | Alice | Dr. Caelus 0.6, Dr. Vector 0.6 |
| Alice | Luca, Mirage | Luca | Luca | — |
| Mirage | Alice, Luca | Alice, Vesper | — | Dr. Caelus 0.8, Dr. Vector 0.6 |
| Kip | Aria & Oktava | Aria & Oktava | — | Dr. Caelus 0.7 |
| Aria & Oktava | Kip | — | — | — |
| Olivia | Justus, Ariston, Valerius | Justus | — | — |
| Justus | Olivia, Ariston, Valerius | Olivia | — | Vesper 1, Death 1, Dr. Caelus 1 |
| Ariston | Justus, Olivia, Valerius | Justus, Olivia | — | Vesper 1.8, Diệp Thanh Phong 1.8, Dahlia 1.2 |
| Dr. Caelus | — | — | — | Luca 1.2 |
| Dr. Vector | — | — | — | Luca 1, Alice 0.6, Mirage 0.8, Dahlia 0.8 |
| Boran | — | — | — | Dr. Caelus 2.2, Roxie & T-Zero 2.2, Raven 0.8, Kip 0.8 |
| Ratok | Borg | — | — | — |
| Borg | Ratok | — | — | — |
| Dahlia | — | — | — | Aria & Oktava 0.8, Victoria 0.8, Roxie & T-Zero 0.8 |

## 14. Trang bị
- 47 món hoàn chỉnh, tối đa 6 ô. Mỗi món có phôi (40% giá, 40% chỉ số). **Chỉ mua được ở Thương Nhân** (AI tự đi shop khi đủ tiền). Bán lại 50%.
| Món | Loại | Giá | Chỉ số / hiệu ứng |
|---|---|---|---|
| Huyết Kiếm Đoạt Mệnh | ad | 2600 | +55 SMVL · +15% Hút máu — +55 SMVL · +15% Hút máu • Hút máu khi đầy máu chuyển thành lá chắn (tối đa 60 + 12/cấp). |
| Đao Phá Quân | ad | 2900 | +60 SMVL · +20% Chí mạng — +60 SMVL · +20% Chí mạng • Chí mạng gây 225% sát thương (thay vì 175%). |
| Cung Gió Lốc | ad | 2600 | +35% Tốc đánh · +20% Chí mạng · +5% Tốc chạy — +35% Tốc đánh · +20% Chí mạng · +5% Tốc chạy • Mỗi đòn đánh thứ 3 nảy sang 2 mục tiêu gần đó (60% SMVL). |
| Mũi Khoan Thép | ad | 2800 | +40 SMVL · +30% Xuyên giáp — +40 SMVL · +30% Xuyên giáp |
| Dao Cắt Gân | ad | 2200 | +30 SMVL · +25% Tốc đánh — +30 SMVL · +25% Tốc đánh • Đánh thường gây Vết Thương Sâu 3s (−40% hồi máu). |
| Song Đao Tàn Huyết | ad | 2800 | +35% Tốc đánh · +30 SMVL — +35% Tốc đánh · +30 SMVL • Đánh thường +3% máu hiện tại của mục tiêu (tối đa 60 với quái/lính). |
| Dao Ám Ảnh | ad | 2500 | +50 SMVL · +12 Xuyên giáp — +50 SMVL · +12 Xuyên giáp • Đòn đánh đầu tiên lên tướng sau khi bước ra từ bụi cỏ / sương mù: +40 (+4/cấp) sát thương và làm chậm 30% 1.5s (10s). |
| Rìu Hắc Thiết | ad | 3000 | +40 SMVL · +350 Máu · +15% Giảm hồi chiêu — +40 SMVL · +350 Máu · +15% Giảm hồi chiêu • Đánh trúng tướng giảm 5% giáp mỗi tầng (tối đa 6 tầng, 6s). |
| Mũ Hỏa Thần | ap | 3200 | +110 SMPT — +110 SMPT • +25% sức mạnh phép. |
| Trượng Hư Vô | ap | 2700 | +65 SMPT · +35% Xuyên phép — +65 SMPT · +35% Xuyên phép |
| Bùa Tro Tàn | ap | 2500 | +60 SMPT · +250 Máu — +60 SMPT · +250 Máu • Chiêu trúng tướng gây thiêu đốt 3s và Vết Thương Sâu. |
| Gậy Băng Giá | ap | 2600 | +60 SMPT · +350 Máu — +60 SMPT · +350 Máu • Chiêu gây sát thương làm chậm 25% trong 1s (chiêu diện rộng 15%). |
| Ngọc Hiền Triết | ap | 2500 | +55 SMPT · +300 Mana · +2 Hồi mana/s · +10% Giảm hồi chiêu — +55 SMPT · +300 Mana · +2 Hồi mana/s · +10% Giảm hồi chiêu • Chiêu trúng tướng hồi 3% mana tối đa (1 lần mỗi giây). |
| Mặt Nạ Nguyền Rủa | ap | 2700 | +55 SMPT · +400 Máu — +55 SMPT · +400 Máu • Sát thương phép đốt 1% máu tối đa mỗi giây trong 3s; mục tiêu nhận thêm 10% sát thương phép. |
| Pháp Châu Sấm Sét | ap | 2600 | +65 SMPT · +5% Tốc chạy · +12 Xuyên phép — +65 SMPT · +5% Tốc chạy · +12 Xuyên phép • Mỗi 8s, chiêu trúng tướng phóng sét gây thêm 50 (+5/cấp, +25% SMPT) sát thương phép. |
| Giáp Gai | def | 2500 | +60 Giáp · +250 Máu — +60 Giáp · +250 Máu • Bị tướng đánh thường: phản 12 (+10% giáp, +1/cấp) sát thương phép và gây Vết Thương Sâu 3s. |
| Khiên Băng Vĩnh Cửu | def | 2600 | +55 Giáp · +300 Mana · +15% Giảm hồi chiêu — +55 Giáp · +300 Mana · +15% Giảm hồi chiêu • Kẻ đánh thường vào bạn bị −15% tốc đánh 1.5s. |
| Áo Choàng Hư Không | def | 2500 | +55 Kháng phép · +300 Máu — +55 Kháng phép · +300 Máu • Sát thương phép làm máu xuống dưới 35%: nhận lá chắn 120 (+12/cấp) trong 4s (60s). |
| Trái Tim Cự Thạch | def | 2800 | +800 Máu — +800 Máu • Hồi 1% máu tối đa mỗi giây khi 4s không trúng đòn (0.2% khi đang giao tranh). |
| Áo Choàng Bóng Đêm | def | 2400 | +50 Giáp · +300 Máu — +50 Giáp · +300 Máu • Giảm 30% sát thương chí mạng nhận vào. |
| Mũ Trấn Hồn | def | 2400 | +45 Kháng phép · +350 Máu · +30% Kháng hiệu ứng — +45 Kháng phép · +350 Máu · +30% Kháng hiệu ứng |
| Áo Choàng Thánh Linh | def | 2700 | +50 Kháng phép · +350 Máu — +50 Kháng phép · +350 Máu • Lá chắn phép chặn 1 chiêu của tướng địch (cả sát thương lẫn khống chế), hồi 40s. |
| Vương Miện Bất Khả Xâm Phạm | def | 2900 | +35 Giáp · +35 Kháng phép · +350 Máu — +35 Giáp · +35 Kháng phép · +350 Máu • Máu xuống dưới 30%: nhận lá chắn 180 (+18/cấp) trong 3s (90s). |
| Lệnh Bài Chinh Phạt | sup | 400 | +60 Máu · +0.6 Hồi máu/s — +60 Máu · +0.6 Hồi máu/s • Đồ khởi điểm hỗ trợ: +10 vàng khi đánh trúng tướng địch (5s); +6 vàng khi lính địch chết trong 8 đv quanh bạn. |
| Lư Hương Cổ | sup | 2300 | +40 SMPT · +2 Hồi mana/s · +10% Giảm hồi chiêu — +40 SMPT · +2 Hồi mana/s · +10% Giảm hồi chiêu • Hồi máu hoặc tạo lá chắn cho đồng minh: đồng minh đó +15% tốc đánh 6s. |
| Ngọc Bội Hộ Mệnh | sup | 2400 | +30 Giáp · +30 Kháng phép · +200 Máu — +30 Giáp · +30 Kháng phép · +200 Máu • Kích hoạt: lá chắn 120 (+20/cấp) cho đồng minh trong 7 đv, 2.5s (90s). |
| Chuông Thức Tỉnh | sup | 2200 | +250 Máu · +250 Mana · +10% Giảm hồi chiêu — +250 Máu · +250 Mana · +10% Giảm hồi chiêu • Đồng minh trong 8 đv tiến về phía tướng địch gần đó: +15% tốc chạy. |
| Kính Cú Đêm | sup | 2200 | +250 Máu · +10% Giảm hồi chiêu — +250 Máu · +10% Giảm hồi chiêu • Kích hoạt: cắm đèn soi tầm nhìn 9 đv trong 75s, giữ tối đa 2 đèn (hồi 45s). Nguồn tầm nhìn cắm được duy nhất. |
| Giày Thép | boots | 1000 | +10% Tốc chạy · +20 Giáp — +10% Tốc chạy · +20 Giáp • Giảm 12% sát thương đánh thường nhận vào. |
| Giày Thủy Ngân | boots | 1000 | +10% Tốc chạy · +25 Kháng phép · +30% Kháng hiệu ứng — +10% Tốc chạy · +25 Kháng phép · +30% Kháng hiệu ứng |
| Giày Cuồng Chiến | boots | 1000 | +10% Tốc chạy · +35% Tốc đánh — +10% Tốc chạy · +35% Tốc đánh |
| Giày Khai Sáng | boots | 900 | +10% Tốc chạy · +15% Giảm hồi chiêu — +10% Tốc chạy · +15% Giảm hồi chiêu |
| Giày Đinh Gỉ | boots | 900 | +16% Tốc chạy — +16% Tốc chạy • Thêm 8% tốc chạy khi 5s không giao tranh. |
| Đồng Hồ Cát Nghịch Đảo | active | 2600 | +65 SMPT · +40 Giáp — +65 SMPT · +40 Giáp • Kích hoạt: bất động và miễn sát thương 2.5s (120s). |
| Khăn Thanh Tẩy | active | 2600 | +40 SMVL · +35 Kháng phép — +40 SMVL · +35 Kháng phép • Kích hoạt: xóa mọi hiệu ứng khống chế (90s). |
| Xích Hồn Đồng Quy | active | 2500 | +40 SMVL · +300 Máu — +40 SMVL · +300 Máu • Kích hoạt: lao tới tướng địch trong 6 đv, làm chậm 40% 2s (60s). |
| Thủy Tinh Sinh Mệnh | active | 2500 | +300 Máu · +30 Kháng phép · +10% Giảm hồi chiêu — +300 Máu · +30 Kháng phép · +10% Giảm hồi chiêu • Kích hoạt: sau 1.5s hồi 100 (+20/cấp) máu cho đồng minh trong 6 đv (90s). |
| Kiếm Bão Táp | ad | 2700 | +45 SMVL · +15% Chí mạng · +5% Tốc chạy — +45 SMVL · +15% Chí mạng · +5% Tốc chạy • Hạ gục / hỗ trợ hạ tướng: +30% tốc chạy 2s và hồi 8% máu tối đa. |
| Cung Thần Phong | ad | 2800 | +40% Tốc đánh · +25 SMVL — +40% Tốc đánh · +25 SMVL • Đánh thường liên tục cùng một mục tiêu: mỗi đòn +5% sát thương (tối đa 5 tầng, mất khi đổi mục tiêu hoặc 3s không đánh). |
| Dao Tử Thần | ad | 2900 | +55 SMVL · +15 Xuyên giáp — +55 SMVL · +15 Xuyên giáp • Đòn đánh và chiêu lên tướng dưới 35% máu: +12% sát thương. |
| Trâm Thần Kỳ | ap | 2700 | +70 SMPT · +15% Giảm hồi chiêu — +70 SMPT · +15% Giảm hồi chiêu • Dùng chiêu cuối: hồi ngay 20% hồi chiêu còn lại của S1–S3. |
| Quả Cầu Linh Hồn | ap | 2500 | +50 SMPT · +300 Máu · +200 Mana — +50 SMPT · +300 Máu · +200 Mana • Hạ gục / hỗ trợ: +12 SMPT vĩnh viễn trong trận (tối đa 10 lần). |
| Nhẫn Hoàng Kim | ap | 2600 | +60 SMPT · +10 Xuyên phép · +200 Máu — +60 SMPT · +10 Xuyên phép · +200 Máu • Chiêu trúng tướng giảm 10 kháng phép trong 4s (cộng dồn 2 lần). |
| Giáp Ma Quái | def | 2600 | +45 Giáp · +30 Kháng phép · +200 Máu — +45 Giáp · +30 Kháng phép · +200 Máu • Bị khống chế (choáng, trói, hất tung…): nhận lá chắn 100 (+10/cấp) trong 3s (20s). |
| Áo Giáp Dung Nham | def | 2700 | +450 Máu · +25 Giáp — +450 Máu · +25 Giáp • Thiêu kẻ địch quanh mình (2.4 đv): 12 (+1% máu tối đa) sát thương phép mỗi giây. |
| Khiên Lâm Thần | sup | 2300 | +250 Máu · +20 Giáp · +20 Kháng phép · +10% Giảm hồi chiêu — +250 Máu · +20 Giáp · +20 Kháng phép · +10% Giảm hồi chiêu • Mỗi 6s, đòn đánh / chiêu trúng tướng địch: đồng minh máu thấp nhất trong 8 đv nhận lá chắn 60 (+8/cấp) 3s. |
| Đèn Lồng Tinh Linh | sup | 2200 | +40 SMPT · +1.5 Hồi mana/s · +200 Máu · +6% Tốc chạy — +40 SMPT · +1.5 Hồi mana/s · +200 Máu · +6% Tốc chạy • Đồng minh trong 7 đv +6% tốc chạy. |

## 15. Khung chỉ số tướng (cấp 1 / tăng mỗi cấp)
| Khung | Máu | Hồi máu | Mana | Hồi mana | Công | Giáp | KP | Tốc đánh | Tốc chạy | Tầm |
|---|---|---|---|---|---|---|---|---|---|---|
| tank | 640/+98 | 1.6/+0.12 | 300/+40 | 1.4/+0.08 | 60/+3.6 | 34/+4.2 | 32/+2 | 0.66/+2% | 3.45 | 1.7 |
| fighter | 600/+94 | 1.6/+0.12 | 0/+0 | 0/+0 | 64/+3.9 | 30/+3.8 | 32/+1.8 | 0.68/+2.5% | 3.55 | 1.6 |
| mage | 540/+84 | 1.2/+0.1 | 420/+50 | 2/+0.1 | 52/+3 | 22/+3.6 | 30/+1.4 | 0.63/+1.5% | 3.35 | 5.5 |
| marksman | 560/+88 | 1.2/+0.1 | 320/+40 | 1.6/+0.08 | 60/+3.6 | 26/+3.8 | 30/+1.3 | 0.66/+3% | 3.3 | 6 |
| support | 570/+88 | 1.4/+0.12 | 380/+45 | 2/+0.1 | 50/+2.6 | 28/+3.9 | 30/+1.5 | 0.62/+1.5% | 3.35 | 5 |

## 16. Tướng (40)
Mỗi trận chọn ngẫu nhiên 10 tướng khác nhau theo hạt giống. Chiêu giữ nguyên bộ chiêu bản cũ.

### Alice (alice) — 🎣 Thợ Săn Mồi Câu
- Tầm xa • vũ khí: gloves • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 590 (+84), mana 420 (+50), công 52 (+3), giáp 26 (+3.6), KP 30 (+1.4), tốc đánh 0.63 (+1.5%), tốc chạy 3.5, tầm 8
- **Nội tại — Náo Nhiệt:** Đánh thường gây sát thương phép (tầm 8 đv). Náo Nhiệt (0–100) tích khi đánh trúng tướng (+8) và khi ảo ảnh bị phá (+25); Phi Dao tự tiêu 5, Lướt Đâm tự tiêu 10 để cường hóa. Bị Lừa Rồi Nha!: ảo ảnh bị phá thì phát nổ. Thoát Hiểm Ảo Ảnh & Sân Khấu Cuối Cùng (180s): đòn chí tử bị chặn — tàng hình 1.5s, hồi 25% máu, làm mới mọi hồi chiêu, +100 Náo Nhiệt, tăng mạnh Công Phép và tốc chạy 8s, ảo ảnh nổ mạnh hơn 25% và rộng gấp đôi.
- **S1 — Phi Dao Ảo Thuật** (hồi 5/4.75/4.5/4.25/4s, 45/50/55/60/65 mana): Phi dao 7 đv. Tốn 5 Náo Nhiệt: phóng 8/10/12/14/20 dao tỏa 360°, mỗi dao 50/60/70/90/100% sát thương.
- **S2 — Lướt Đâm** (hồi 9/8.5/8/7.5/7s, 50/50/50/50/50 mana): Lướt 4 đv đâm kẻ địch trên đường; đâm từ phía sau ×2 sát thương. Tốn 10 Náo Nhiệt: tàng hình 1.5s, để lại ảo ảnh; đâm từ phía sau ×3 sát thương và choáng 1s.
- **S3 — Ảo Ảnh Độc Lập** (hồi 16/15/14/13/12s, 60/60/60/60/60 mana): Tạo ảo ảnh 10s tự chạy lại gần địch; Alice tàng hình 1.5s và lướt đi. Đủ 50 Náo Nhiệt (tốn 50/40/40/40/20): hoán đổi vị trí với tướng địch gần nhất trong 10 đv, 5/6/7/8/10 ảo ảnh vây quanh nạn nhân 5/6/8/8/10s (sau 2s bắt đầu chạy loạn), Alice tàng hình 2/2.25/2.25/3/5s.
- **S4 — Rực Rỡ, Cùng Vui Nào!** (hồi 110/90/70s, 100/100/100 mana): Tự chọn 1 trong 3 biến thể theo tình huống: Chương Trình Thoát Hiểm (máu thấp: 10 ảo ảnh chạy toán loạn, Alice tàng hình 5s, +50% tốc chạy, tăng mạnh Công Phép) • Mạo Hiểm (bị áp sát hoặc đứng trong vùng cảnh báo: phi dao đánh dấu rồi tự nhốt vào Hộp Ảo Thuật 1.5s — bị đánh thì đổi chỗ với kẻ đánh, trả lại ×2 sát thương, đẩy văng và choáng; không bị đánh thì xuất hiện sau lưng kẻ bị đánh dấu, choáng 3s) • Vạn Biến (chiêu đang hồi: Náo Nhiệt tràn tới 200, làm mới mọi hồi chiêu, tăng mạnh Công Phép; mọi ảo ảnh nổ mạnh hơn, nổ gây choáng và tự sao chép Phi Dao, Lướt Đâm trong 5/7/10s).
- **Skill phụ — Tẩu Thoát, Ohh!** (hồi 12s): Đổi chỗ với ảo ảnh xa kẻ địch nhất.

### Aria & Oktava (aria) — 🕊 Hòa Bình
- Tầm xa • vũ khí: voice • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 595 (+88), mana 380 (+45), công 50 (+2.6), giáp 28 (+3.9), KP 32 (+1.5), tốc đánh 0.62 (+1.5%), tốc chạy 3.35, tầm 5
- **Nội tại — Bóng Hình Âm Vang & Hòa Âm:** Oktava (Người Bảo Hộ) đi theo Aria, có máu riêng (45% máu Aria), chết thì hồi lại sau 45s. Ai đánh Aria thì Oktava nhắm kẻ đó và đuổi tới khi cách Aria quá xa (14 đv) hoặc bị Aria thu hồi (Aria rút lui, hoặc Oktava sắp chết). 3 nốt (S1/S2/S3, dùng CHUNG hồi chiêu 3.5s) liên tiếp thành 1 Bản Nhạc — nốt tan biến nếu 5s không gõ thêm, cường hóa theo nốt được bấm nhiều nhất: Đỏ — Oktava dậm to, Aria nổ 3 lần, lần cuối CHOÁNG • Xanh — 3 đợt sóng âm: trúng 1 làm chậm, 2 trói chân, 3 MÊ HOẶC (tự đi về phía Oktava) • Vàng — Oktava dậm thẳng xuống chỗ Aria đẩy lùi cực mạnh, cả đội gần đó nhận khiên kèm Hồi Phục • đều nhau — Hòa Âm Hỗn Hợp (cả ba, yếu hơn). Đánh xong 3 Bản Nhạc thì mở Bản Giao Hưởng Tử Thần.
- **S1 — Nốt Đỏ — Tấn Công** (hồi 4/3.75/3.5/3.25/3s, 35/38/41/44/47 mana): Oktava NHẢY DẬM vào kẻ địch gần nhất (trong 9 đv; không có thì vào điểm chỉ định) — sát thương bán kính 2.2 và hất lùi; Aria phát sóng âm quanh mình (bán kính 2.5). 3 nốt hồi chiêu độc lập.
- **S2 — Nốt Xanh — Linh Hoạt** (hồi 4/3.75/3.5/3.25/3s, 35/35/35/35/35 mana): Aria, Oktava và đồng minh trong 6 đv tăng 25% tốc chạy 2s. Aria không thể bị chọn làm mục tiêu 0.5s, xóa mọi hiệu ứng xấu và miễn đẩy lùi chớp nhoáng. 3 nốt hồi chiêu độc lập.
- **S3 — Nốt Vàng — Phòng Thủ** (hồi 4/3.75/3.5/3.25/3s, 40/40/40/40/40 mana): Oktava lao ngược về phía Aria, choáng 0.75s kẻ trên đường; khiên 60/90/120/150/180 (+40% SMPT) cho Aria hoặc đồng minh thấp máu nhất trong 6 đv (4s). 3 nốt hồi chiêu độc lập.
- **S4 — Bản Giao Hưởng Tử Thần** (hồi 40/35/30s, 100/100/100 mana): Chỉ dùng được khi đã đánh xong 3 Bản Nhạc. Sóng âm 11 đv xuyên qua mọi kẻ địch: MÊ HOẶC 1.75s (tự đi nộp mạng cho Oktava). Sóng chạm Oktava: Oktava BẤT TỬ 6s và đòn đánh cường hóa (+100% sát thương, +50% tốc đánh).
- **Skill phụ — Gắn Kết** (hồi 16s): Nhảy lên cưỡi Oktava 5s: di chuyển bằng gã khổng lồ, mọi sát thương nhắm vào Aria do Oktava gánh. Cần Oktava còn sống.

### Ariston (ariston) — 📿 Cuồng Tín
- Cận chiến • vũ khí: cleaver • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 640 (+98), mana 300 (+40), công 60 (+3.6), giáp 34 (+4.2), KP 32 (+2), tốc đánh 0.62 (+2%), tốc chạy 3.45, tầm 2.5
- **Nội tại — Đức Tin & Phán Quyết • Hộ Vệ Thánh Đình • Đại Kiếm Trọng Lực:** Nhận sát thương từ tướng / quái: +4 Đức Tin (+10 nếu đòn mất >10% máu); đồng minh trong 10 đv bị đánh: +3. Mỗi 20 Đức Tin: +6% sát thương, +8 Giáp / Kháng Phép. 100 Đức Tin: giảm 15% sát thương nhận và mở khóa Đại Phán Quyết; tụt 5/giây sau 6s ngoài giao tranh. Dưới 50% máu: giáp ảo 25% máu tối đa 4s (90s). Tốc đánh cố định, % tốc đánh cộng thêm quy đổi thành sát thương; đòn đánh quét vòng cung lan 50% sang kẻ đứng cạnh.
- **S1 — Thiết Trảm: Liệt Đao** (hồi 8/7.5/7/6.5/6s, 45/45/45/45/45 mana): Quét vòng cung 160° tầm 3.5 đv: sát thương vật lý nặng, làm chậm 35% 1.5s. Trong 2s dùng lại (Liệt Đao): nhảy vọt tới điểm cách 4.5 đv (cảnh báo đỏ bán kính 2.2 đv 0.45s), bổ đao nứt sàn: sát thương lớn và choáng 1s.
- **S2 — Thế Thủ Thánh Quan** (hồi 12/11.5/11/10.5/10s, 50/50/50/50/50 mana): Cắm đao thế thủ tối đa 1.75s: giảm 60% mọi sát thương, miễn đẩy lùi / hất tung; mỗi đòn trúng thế thủ +8 Đức Tin; kẻ cận chiến đánh vào bị dội lại: chậm 30% và nhận 15% sát thương vừa gây.
- **S3 — Lời Nguyện Bất Diệt** (hồi 2s, 30/30/30/30/30 mana): Bật / tắt: tốn 30 mana, sau đó 15 mana mỗi giây (mỗi giây duy trì +8). Hồi 4% máu tối đa mỗi giây — không bị ngắt khi trúng đòn; mỗi 1.5s giải một hiệu ứng xấu nhẹ (làm chậm, câm lặng).
- **S4 — Đại Phán Quyết** (hồi 90/75/60s, 100/100/100 mana): Cần 100 Đức Tin (tiêu hết): khóa một tướng địch trong 6 đv, cảnh báo đỏ 0.5s rồi chém trảm quyết — sát thương vật lý lớn CỘNG sát thương chuẩn bằng 45% tổng sát thương mục tiêu đó đã gây cho Ariston trong 5s trước; phá 100% Hộ Giáp của nạn nhân.

### Bạch Diệp (bachdiep) — 🎯 Kẻ Trảm Tướng
- Tầm xa • vũ khí: flysword • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 550 (+84), mana 460 (+58), công 52 (+3), giáp 28 (+3.8), KP 32 (+1.8), tốc đánh 0.63 (+1.5%), tốc chạy 3.45, tầm 4.5
- **Nội tại — Vạn Kiếm Triệu • Mưa Kiếm Thức Thời:** Đánh thường gây sát thương phép. Mỗi phi kiếm Loạn Trảm trúng: +1 Kiếm; mỗi 5 đòn đánh trúng: +1 Kiếm. KHÔNG GIỚI HẠN số kiếm; mỗi kiếm +1% sát thương phép mọi đòn (tối đa +60%). Rời giao tranh 4s: mất 2 kiếm mỗi giây. Mỗi 10s, đòn đánh kế tiếp thành Mưa Kiếm: 6 phi kiếm rơi xuống bán kính 2 đv, làm chậm 30% 1.5s.
- **S1 — Kiếm Vũ: Loạn Trảm** (hồi 0.25s, 25 mana): Hồi 0.25s. Phóng chuỗi phi kiếm bay thẳng 7.5 đv: số kiếm = 1 + 2 × số lần kích hoạt liên tiếp (trong 2s). Tốn 25 mana, mỗi lần liên tiếp +15 mana. Mỗi kiếm trúng: +1 Kiếm Khí; kiếm sau trúng cùng mục tiêu gây 50% và phá 20 Hộ Giáp.
- **S2 — Kiếm Trận Vạn Cổ** (hồi 2s, 30 mana): Bật / tắt: chọn vùng trong 8 đv (bán kính 3.5); sau 0.3s kiếm cổ rơi mỗi 0.35s: sát thương phép, chậm 25%, đốt Hộ Giáp. Tốn 30 mana, sau đó 20 mana mỗi giây.
- **S3 — Kiếm Hộ Pháp** (hồi 11/10/9.5/9/8.5s, 50 mana): Lướt lùi 4 đv, né mọi đòn bay tới. Giáp ảo = 100 (+15/cấp) + 30 × số Kiếm. Từ 15 Kiếm: miễn làm chậm, +25% tốc chạy 2.5s. Từ 30 Kiếm: Không Thể Cản Phá khi còn khiên.
- **S4 — Thiên Kiếm Trận** (hồi 90/75/60s, 100 mana): Chọn 1 trong 3 thế: • Lục Tinh Kiếm Trận (nhiều địch): bán kính 7.5, sát thương phép lớn + choáng 1s; Bạch Diệp đứng trong trận: −30% tiêu hao mana, +30% kháng mọi sát thương, +20% Công Phép 6s. • Phong Ấn Kiếm Vực (một đối thủ trong 6 đv): giam cả hai trong kiếm giới 4s, Bạch Diệp hồi 35 mana/giây, mỗi 0.5s 2 phi kiếm đâm xuống (+1 Kiếm mỗi nhịp). • Thiên Vũ Thăng Hoa (ít mana): +10 Kiếm, +70% tốc đánh 8s, hồi 40% mana, đòn đánh bắn 2 tia xé 30% Hộ Giáp.

### Boran (boran) — 🌋 Cuồng Loạn
- Cận chiến • vũ khí: axes • tài nguyên: không dùng mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 600 (+94), mana 0 (+0), công 62 (+3.8), giáp 31 (+3.8), KP 32 (+1.8), tốc đánh 0.7 (+2.5%), tốc chạy 3.55, tầm 1.6
- **Nội tại — Huyết Mạch Băng Cổ • Thể Trọng Băng Hóa:** Chém trúng +8 Nộ Khí, nhận sát thương +4; tụt dần sau 5s ngoài giao tranh. Mỗi 10 Nộ: +2.5% tốc đánh, +1.5% tốc chạy. 100 Nộ (Thấu Cốt): đòn đánh thêm 15% sát thương chuẩn, hút máu 15%. Giảm 30% sát thương bo. Hộ Giáp vỡ: Kiên Cường (không thể bị hất tung / cản phá) 2.5s (40s).
- **S1 — Song Rìu Phi Phao** (hồi 9/8.5/8/7.5/7.5s): Ném liên tiếp 2 rìu bay thẳng 12 đv: rìu 1 gây sát thương vật lý và làm chậm 40% 2s; rìu 2 trúng cùng mục tiêu thì choáng 1s. Trong 2.5s dùng lại: giật xích kéo thân mình bay tới nạn nhân, tung cú đạp gây sát thương và nhặt rìu (hồi 3s hồi chiêu).
- **S2 — Cuồng Phong Băng Trảm** (hồi 11/10/9/8/8s): Xoay song rìu 360° liên tục 2s (vừa xoay vừa chạy, +15% tốc chạy): 6 nhịp chém vật lý mọi kẻ địch trong 3.5 đv, mỗi nhịp gọt 8% Hộ Giáp (tối đa 48%). Đang xoay miễn làm chậm.
- **S3 — Tuyết Lở Áp Sát** (hồi 12/11/10/9.5/9.5s): Gầm lên nhảy vọt tới điểm cách tối đa 9 đv (vòng cảnh báo đỏ 0.55s): dậm nổ gây sát thương vật lý nặng, hất tung 0.75s mọi mục tiêu trong 3 đv và để lại băng trơn 3s (kẻ địch −35% tốc chạy).
- **S4 — Thức Tỉnh Cổ Thần: Băng Ma Thao Túng** (hồi 85/70/55s): Cần ít nhất 50 Nộ Khí (tiêu sạch): hóa dã thú cổ đại 10s — miễn khống chế cứng, mọi đòn đánh và chiêu thêm 40% xuyên Hộ Giáp; hạ gục / hỗ trợ hạ gục tướng: +4s và hồi đầy máu.

### Borg (borg) — 🔥 Hổ Báo
- Cận chiến • vũ khí: fist • tài nguyên: không dùng mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 640 (+100), mana 0 (+0), công 63 (+3.8), giáp 33 (+4.2), KP 32 (+1.9), tốc đánh 0.68 (+2.2%), tốc chạy 3.5, tầm 1.45
- **Nội tại — Huyết Chiến:** Càng ít máu càng đánh đau (tối đa +35% khi dưới 30% máu); dưới 30% máu đòn đánh gây thiêu đốt. Đấm Móc: cứ đòn đánh thường thứ 3 hất tung 0.3s.
- **S1 — Chộp & Quật** (hồi 12/11.5/11/10.5/10s): Lao tới 4 đv chộp tướng đầu tiên chạm phải, quật ra sau lưng: sát thương và choáng 1s.
- **S2 — Trả Đòn** (hồi 9/8.5/8/7.5/7s): Cú đấm toàn lực hình nón 2.6 đv. Vừa Gồng Mình (trong 3s): cộng 40% sát thương đã hấp thụ và đẩy lùi 2 đv.
- **S3 — Gồng Mình** (hồi 14/13/12/11/10s): Gồng 1.5s: giảm 50% sát thương nhận, không bị đẩy lùi (vẫn dính choáng/trói). Lượng sát thương hấp thụ nạp cho Trả Đòn.
- **S4 — Đấu Trường La Mã** (hồi 120/100/80s): Dựng võ đài bán kính 4.5 đv quanh mình trong 4s: kẻ địch bên trong không ra được; Borg giảm 25% sát thương nhận.

### Dr. Caelus (caelus) — 💰 Thực Dụng
- Tầm xa • vũ khí: orb • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 545 (+84), mana 420 (+50), công 52 (+3), giáp 22 (+3.6), KP 30 (+1.4), tốc đánh 0.63 (+1.5%), tốc chạy 3.35, tầm 5.8
- **Nội tại — Thuật Toán Sinh Tồn • Nhãn Cảm Lượng Tử:** Kẻ địch di chuyển / lướt trong 35 đv: +2 Điểm Xác Suất mỗi giây. Mỗi 25 điểm: giảm 5% sát thương nhận. Đủ 100 (Quá Tải Phân Tích): chiêu kế tiếp không tốn năng lượng và +25% sát thương phép. Đòn đánh lén đầu tiên từ kẻ rình trong bụi / trên cao không bao giờ bất ngờ được hắn (giảm 50%, mỗi 20s).
- **S1 — Ma Trận Khóa Tọa Độ** (hồi 12/11/10/9/9s, 50/50/50/50/50 mana): Cắm Quả Cầu Lượng Tử xuống điểm cách tối đa 14 đv: lưới điện cảnh báo 0.6s rồi kích hoạt ma trận bán kính 4 đv — kẻ địch bên trong nhận sát thương phép và choáng 1.25s. Ma trận tồn tại 3.5s: kẻ địch trong vùng bị bẻ gãy lướt / dây móc.
- **S2 — Phản Xạ Lượng Tử** (hồi 14/13/12/11/11s, 65/65/65/65/65 mana): Khiên năng lượng chắn trước mặt 2.5s: chặn mọi đạn đạo tầm xa bay tới từ phía trước, 40% sát thương chặn được chuyển thành Hộ Giáp. Dùng lại khi khiên còn: phát nổ đẩy lùi kẻ cận chiến 5 đv, gây sát thương phép và làm chậm 40% 2s.
- **S3 — Tia Laser Phân Rã** (hồi 8/7.5/7/6.5/6.5s, 45/45/45/45/45 mana): Tích năng lượng rồi bắn tia laser xuyên thấu dài 18 đv: sát thương phép lớn mọi mục tiêu trên đường, bỏ qua 50% Hộ Giáp. Trúng kẻ đang kẹt trong Ma Trận: nổ diện rộng và kéo dài ma trận thêm 1.5s.
- **S4 — Nghịch Đảo Dữ Liệu Thời Không** (hồi 90/75/60s, 100/100/100 mana): Khóa một kẻ địch trong 16 đv (hoặc chính mình): sau 0.5s, mục tiêu bị cưỡng chế dịch chuyển về đúng vị trí và lượng Máu / Hộ Giáp của 3.5s trước — kẻ vừa uống bình hay vừa đu dây trốn bị giật về họng súng; dùng lên bản thân là mạng bảo hiểm.

### Chrono & Neo (chrononeo) — 🌾 Tham Farm
- Tầm xa • vũ khí: dual • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 560 (+88), mana 320 (+40), công 60 (+3.7), giáp 26 (+3.8), KP 30 (+1.3), tốc đánh 0.68 (+3%), tốc chạy 3.3, tầm 6
- **Nội tại — Hai Thời Đại:** Hai thế, mỗi thế một băng đạn (tăng theo cấp): Chrono 4→10 viên nặng (×1.5 sát thương, −25% tốc đánh, xuyên 20% giáp, nạp 2.5s) • Neo 10→20 viên nhẹ, mỗi lần bóp cò bắn 2 viên liên tiếp (mỗi viên ×0.75 sát thương), +25% tốc đánh, +8% tốc chạy, nạp 1.5s.
- **S1 — Phát Bắn Cường Hóa** (hồi 6/5.5/5/4.5/4s, 40/40/40/40/40 mana): Chrono: 1 viên nặng xuyên thấu 8 đv, đẩy lùi 1.5 đv • Neo: 2 viên nhanh, làm chậm 30% 1s.
- **S2 — Thời Khắc** (hồi 14/13/12/11/10s, 60/60/60/60/60 mana): Chrono: quét và đánh dấu mọi mục tiêu (tướng lẫn quái) trong 12 đv trong 2s, rồi Liên Xạ 0.5s xả hết băng đạn chia đều lên các mục tiêu bị đánh dấu BẤT KỂ KHOẢNG CÁCH; trong lúc xả đi chậm 30%, không thể cản phá • Neo: mưa đạn hình nón 8 đv gồm 7/8/9/9/10 viên, xé Hộ Giáp.
- **S3 — Bước Thời Gian** (hồi 12/11/10/9/8s, 45/45/45/45/45 mana): Chrono: bước lên 2.5/2.5/2.5/3/4 đv, nạp đầy băng Chrono, giảm 30% sát thương 2/2/3/4/6s • Neo: lướt 6/6/6/7/8 đv, nạp đầy băng Neo, để lại ảo ảnh BẤT TỬ 10s tự bắn (25% sát thương); trong 10s dùng lại để đổi chỗ với ảo ảnh (mỗi 2s một lần), mỗi lần đổi +tốc chạy và tốc đánh 1.5s. Hồi chiêu bắt đầu tính từ giây thứ 4.
- **S4 — Liên Hoa Thời Không** (hồi 110/90/70s, 100/100/100 mana): Hợp nhất 5/6/8s: mỗi 0.5s xả 2 vòng 10/12/16 viên BAY THẲNG chia góc đều — vòng đạn nặng Chrono xen vòng đạn nhanh Neo lệch nửa bước góc, mỗi đợt xoay thêm một chút thành bông sen nở xoay tròn, xen kẽ đạn Chrono (nặng, xuyên thấu) và đạn Neo (nhanh); vẫn dùng được Bước Thời Gian. • Dạng Chrono: đạn to, mạnh hơn, đẩy lùi nhẹ; kết thúc Nở Rộ 30 viên đạn nặng, hất văng kẻ áp sát 3 đv. • Dạng Neo: gọi Ảnh Chiếu bất tử cùng xả đạn (dùng lại để đổi chỗ), +10/14/18% tốc chạy; kết thúc tỏa 10/15/20 viên và lướt ngắn 3 đv.
- **Skill phụ — Chuyển Thế** (hồi 4s): Đổi thế. Sang Chrono: sóng đẩy lùi 1.5 đv quanh người + giảm 25% sát thương 1s • Sang Neo: +40% tốc chạy 1.5s.

### Clint (clint) — 🚧 Gác Cổng
- Tầm xa • vũ khí: shotgun • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 655 (+98), mana 300 (+38), công 69 (+4), giáp 33 (+4), KP 32 (+1.8), tốc đánh 0.75 (+2.5%), tốc chạy 3.5, tầm 3.4
- **Nội tại — 2 Viên Đạn & Phản Lực Hỏa Lực:** Đánh thường là chùm đạn ghém tỏa nón: kẻ đứng sát (≤ 1.8 đv) nhận ×1.5, ở rìa tầm ×0.8, kẻ khác trong nón nhận 35%; mỗi phát trúng đẩy lùi 0.5 đv. Băng đạn KHÓA CỨNG 2 viên (tự nạp 1.0s/viên); mọi chỉ số tăng sức chứa băng đạn quy đổi: mỗi viên thêm = +18% Công Vật Lý.
- **S1 — Báng Súng** (hồi 6/5.5/5/4.5/4s, 35/35/35/35/35 mana): Nện báng súng trước mặt (1.8 đv): sát thương vật lý, choáng 0.25s và làm chậm 30/40/45/50/55% trong 1.5/1.5/1.75/2/2s. Trúng tướng hoặc quái lớn: nạp ngay 1 viên.
- **S2 — Nạp Đạn Khẩn Cấp** (hồi 12/11.5/11/10.5/10s, 50/50/50/50/50 mana): Ném vỏ đạn vào mục tiêu trong 5 đv: choáng 0.5s; nạp đầy 2 viên; phát kế tiếp chắc chắn chí mạng.
- **S3 — Bắn Nhảy** (hồi 10/9.5/9/8.5/8s, 45/45/45/45/45 mana): Chĩa súng xuống sàn: kẻ địch quanh chân (2 đv) nhận sát thương, để lại Vùng Lửa thiêu 2.5% máu tối đa mỗi giây trong 3s; bật nhảy vượt chướng ngại 4–8 đv theo hướng chọn; tiếp đất nạp lại 1 viên.
- **S4 — Dragon's Breath** (hồi 100/85/70s, 100/100/100 mana): Nạp 2 viên Đạn Rồng Hỏa Ngục trong 10s: mỗi phát phun bão lửa hình nón 90° dài 6/12/18 đv — thiêu đốt, phá 30% Hộ Giáp hiện tại, sát thương diện rộng và hất văng 2.5 đv (ép đối thủ ra ngoài bo).

### Dahlia (dahlia) — 🎭 Ngụy Quân Tử
- Tầm xa • vũ khí: blackcane • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 555 (+88), mana 400 (+48), công 52 (+3), giáp 25 (+3.7), KP 30 (+1.4), tốc đánh 0.63 (+1.5%), tốc chạy 3.45, tầm 5
- **Nội tại — Náo Nhiệt & Cuồng Nhiệt • Chiếc Mũ Thoát Hiểm • Ảo Ảnh Chết Chóc • Gậy Đen:** Có ai lướt / dịch chuyển gần đó: +5 Náo Nhiệt; quái, vật triệu hồi, ảo ảnh bị hạ: +8; có đơn vị không phải tướng trong 6 đv: +3/giây. Đủ 100 → Cuồng Nhiệt 8s: +40% tốc đánh, +25% sát thương phép, +20% tốc chạy, cường hóa mọi chiêu. Tụt xuống 50% máu (90s): mũ cao chụp xuống, Dahlia dịch chuyển 5.5 đv, chiếc mũ phát nổ choáng 1s quanh chỗ cũ. Ảo ảnh của Dahlia tự đánh (35%) và khi tan để lại khói độc 3.5s (mù, độc, gọt Hộ Giáp). Đánh thường gây sát thương phép, đòn thứ 3 liên tiếp nổ lan 2 đv.
- **S1 — Thoát Nguy** (hồi 9/8.5/8/7.5/7s, 50/50/50/50/50 mana): Hoán đổi vị trí tức thì với một đơn vị không phải tướng (quái, vật triệu hồi, ảo ảnh) trong 8 đv; tàng hình 1.5s, +30% tốc đánh và +20% sát thương phép 3s. Cuồng Nhiệt: chụp Mũ Đen lên tối đa 3 đơn vị không phải tướng trong 6 đv, biến chúng thành bản sao Dahlia 6s. Trong Sân Khấu Chết Chóc: thành Hư Ảnh Bước (dịch chuyển 2.5 đv, tàng hình 0.75s, hồi 1.2s, NỔ bóng tối ở điểm đầu và điểm cuối: bán kính 2, sát thương phép, làm chậm 30%).
- **S2 — Hoán Vị & Màn Ảo Thuật** (hồi 14/13/12/11/10s, 60/60/60/60/60 mana): Thế "Màn Ảo Thuật" 1.2s: tướng địch nào ra đòn vào Dahlia bị Mũ Cao khổng lồ chụp xuống giam lại, kiếm ma thuật đâm xuyên (sát thương phép lớn); Dahlia biến mất và hiện ra cách đó 3.5 đv. Cuồng Nhiệt: +50% sát thương và choáng nạn nhân 1.25s. Nội tại: nhận đòn chí tử thì đổi chỗ với đơn vị gần nhất và tàng hình 2s (120s).
- **S3 — Đôi Ảnh Quấy Nhiễu** (hồi 10/9.5/9/8.5/8s, 55/55/55/55/55 mana): Tạo 2 ảo ảnh bước đều về phía trước hình chữ V (7 đv) tự đánh tướng địch trên đường; Dahlia +35% tốc đánh, +25% tốc chạy 3.5s. Nội tại: đòn đánh của Dahlia và ảo ảnh làm chậm 25% 1.5s.
- **S4 — Sân Khấu Chết Chóc** (hồi 90/75/60s, 100/100/100 mana): Cắm gậy mở vũ đài bóng tối bán kính 10/15/20 đv trong 16/20/25s (thấy rõ vành rèm nhung tím): Thoát Nguy thành Hư Ảnh Bước; +60% tốc đánh, +30% sát thương đòn đánh; mỗi 10 đòn trúng (của Dahlia và ảo ảnh) sinh một ảo ảnh mới cạnh mục tiêu; ảo ảnh trong sân khấu +50% máu và đánh chắc chắn gây độc. Dahlia cố đánh trong vòng sân khấu.

### Death (death) — 🗡 Ám Sát
- Cận chiến • vũ khí: scythe • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 675 (+102), mana 360 (+42), công 66 (+3.8), giáp 32 (+4.1), KP 32 (+1.7), tốc đánh 0.67 (+2.2%), tốc chạy 3.5, tầm 2.2
- **Nội tại — Lưỡi Hái Tử Thần:** Đánh thường quét vòng cung (kẻ địch khác trong vùng nhận 50%). Trúng bằng lưỡi (phần ngoài của tầm) +15% sát thương và hồi 10 (+2/cấp) máu; trúng kẻ vừa bị kéo thì hất tung 0.5s.
- **S1 — Lưỡi Hái Đoạt Mệnh** (hồi 14/13/12/11/10s, 60/65/70/75/80 mana): Quăng liềm 7 đv; trúng kẻ đầu tiên thì gây sát thương phép và giật nó về cạnh Death.
- **S2 — Phán Quyết** (hồi 9/8.5/8/7.5/7s, 50/50/50/50/50 mana): Bổ liềm trước mặt và phóng cầu hắc ám bay 7 đv; +50% sát thương lên mục tiêu dưới 30% máu.
- **S3 — Xoay Liềm** (hồi 14/13/12/11/10s, 60/60/60/60/60 mana): Thả liềm xoay tại điểm trong 6 đv trong 2s: sát thương và hút nhẹ về tâm. Bấm lại trong 2s: dịch chuyển tới liềm, chém vòng tròn.
- **S4 — Gọi Hồn** (hồi 120/100/80s, 100/100/100 mana): Đánh dấu một tướng trong 5 đv: 2 bóng ma bắt chước đòn của Death trong 5s (mọi sát thương Death gây lên nó lặp lại thêm 40% dạng phép), mục tiêu bị làm chậm 20%.

### Elara (elara) — 🪨 Lì Lợm
- Tầm xa • vũ khí: bow • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 560 (+88), mana 320 (+40), công 54 (+3.6), giáp 26 (+3.8), KP 30 (+1.3), tốc đánh 0.65 (+3%), tốc chạy 3.3, tầm 6.2
- **Nội tại — Linh Hoạt:** +20% tốc chạy khi đang lùi xa khỏi địch. 5s không tấn công thì đòn kế tiếp được Tập Trung: +25% sát thương, tên bay nhanh hơn.
- **S1 — Liên Xạ** (hồi 7/6.5/6/5.5/5s, 40/40/40/40/40 mana): Bắn 3 mũi tên liên tiếp vào mục tiêu, mỗi mũi 50% sát thương đánh thường + 15/25/35/45./55
- **S2 — Kéo Căng Dây** (hồi 12/11/10/9/8s, 60/60/60/60/60 mana): Tích tối đa 1.5s (đi chậm 50%), bắn mũi tên xuyên thấu bay 12 đv. Sát thương 50% → 100% theo thời gian tích.
- **S3 — Sao Băng Lùi** (hồi 14/13/12/11/10s, 50/50/50/50/50 mana): Nhảy lùi 3.5 đv rồi bắn 3 sao băng hình nón, làm chậm 40% 1.5s.
- **S4 — Thần Tiễn Phá Không** (hồi 100/85/70s, 100/100/100 mana): Mũi tên khổng lồ bay hết bản đồ, trúng tướng địch đầu tiên: choáng 0.5–1.5s theo quãng bay.
- **Skill phụ — Tên Hình Nón** (hồi 10s, 30 mana): Bắn 3 mũi tên tỏa hình nón (3.4 đv): mỗi mũi 30 (+6/cấp, +35% SMVL) sát thương và đẩy lùi kẻ áp sát 1.6 đv — tạo khoảng trống để kéo cung.

### Florian (florian) — 🎯 Kẻ Trảm Tướng
- Cận chiến • vũ khí: rapier • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 590 (+92), mana 300 (+38), công 60 (+3.6), giáp 29 (+3.8), KP 32 (+1.8), tốc đánh 0.7 (+2.8%), tốc chạy 3.55, tầm 1.75
- **Nội tại — Đâm Lao & Tứ Ấn:** Cứ 3.5s, đòn đánh thường kế tiếp thành cú Đâm Lao lướt tới mục tiêu (tới 3.5 đv ngoài tầm), +20 (+4/cấp, +30% SMVL) sát thương — mục tiêu có ấn thì tự khóa lao vào ẤN CHƯA VỠ GẦN NHẤT; chạm mũi kiếm xong lướt nhỏ 1 đv đổi góc. Đánh trúng từ ĐÚNG GÓC PHẦN TƯ của ấn để phá — MỖI ẤN: −1.5s mọi hồi chiêu, chậm 60% 1s, làm mới ngay Đâm Lao, 5% máu tối đa sát thương chuẩn, Florian hồi 0.5% máu. MỐC 2/4: choáng 0.25s, hồi 2.5% máu. MỐC 4/4: thêm 25% máu tối đa sát thương chuẩn, hồi 5% máu, đòn kế tiếp trong 3s +40% sát thương và đẩy lùi 3 đv.
- **S1 — Tứ Ấn** (hồi 7/6.5/6/5.5/5s, 50/50/50/50/50 mana): Ném dấu ấn 7 đv: trúng kẻ địch đầu tiên thì gây sát thương và đặt 4 ấn Đông–Tây–Nam–Bắc trong 5s. Chỉ hồi chiêu khi ấn đã hết; ném trượt thì hồi chiêu giảm 50%.
- **S2 — Phân Ảnh** (hồi 7/6.5/6/5.5/5s, 40/40/40/40/40 mana): Sinh Phân Ảnh ở phía ĐỐI DIỆN Florian qua tâm mục tiêu, cách Florian 8 đv; đứng khựng 0.25s rồi lao ngược hết tốc lực về chỗ Florian, gây sát thương vật lý mọi kẻ trên đường. Cú lao mang đặc tính Đâm Lao: chạm mục tiêu từ góc có ấn chưa vỡ thì PHÁ ẤN ĐÓ từ phía đối diện (gọng kìm phá 2 ấn cùng lúc). Đang Kiếm Thế: Florian dịch chuyển ra sau lưng mục tiêu rồi lao xuyên qua.
- **S3 — Thế Thủ** (hồi 10/9.5/9/8.5/8s, 40/40/40/40/40 mana): Vào thế thủ 1s, đỡ mọi sát thương và khống chế. Bị tấn công: phản đòn gây sát thương và CHOÁNG kẻ tấn công 1s (cận chiến bị đẩy lùi). Không ai tấn công: hoàn 25% hồi chiêu.
- **S4 — Kiếm Thế Tứ Ấn** (hồi 90/75/60s, 100/100/100 mana): Trong 4s: đặt 4 ấn lên một tướng trong 5 đv; mỗi lần phá trọn 4/4 ấn được đặt lại sau 0.35s và Florian tung ngay nhát đâm XUYÊN THỦNG 10 đv (xuyên tường, 100/160/220 +70% SMVL sát thương chuẩn). Phân Ảnh thành dịch chuyển ra sau địch rồi lao; Đâm Lao kèm phân ảnh lao từ phía sau.
- **Skill phụ — Lướt** (hồi 0.15s): KHÔNG hồi chiêu — chỉ dùng được trong 1.5s sau một cú Đâm Lao hoặc sau bất kỳ chiêu nào. Lướt nhanh 2.4 đv theo hướng chọn, MIỄN NHIỄM mọi sát thương & khống chế khi lướt: bẻ góc 90° sang mặt ấn kế tiếp hoặc né chiêu định hướng.

### Galo (galo) — 🌪 Bóng Ma Rìa Bão
- Tầm xa • vũ khí: flask • tài nguyên: không dùng mana • sát thương chính: phép
- Chỉ số cấp 1: máu 565 (+88), mana 0 (+0), công 55 (+3.2), giáp 28 (+3.8), KP 30 (+1.6), tốc đánh 0.66 (+2.2%), tốc chạy 3.5, tầm 4.5
- **Nội tại — Độc Tiêu Xương:** Đòn độc găm tầng Tiêu Xương (tối đa 6, 4s): mỗi tầng −4% giáp và kháng phép, kèm độc nhẹ. Dạng Người: đánh tầm xa, chiêu tốn 3–5% máu hiện tại. Dạng Quái Thú (skill phụ): cận chiến, chiêu không tốn máu.
- **S1 — Ném Lọ Độc / Song Trảo** (hồi 5/5/5/5/5s): Người: ném lọ độc tới điểm trong 7 đv, nổ bán kính 1.8, găm 2 tầng (4% máu; HC 5s). Thú: 2 nhát cào trước mặt, mỗi nhát 1 tầng (HC 3s).
- **S2 — Bom Khí Ngạt / Ngoạm Cắn** (hồi 10/10/10/10/10s): Người: vũng khí độc bán kính 2.5 trong 3s — chậm 30%, mù (3% máu; HC 10s). Thú: lao 4 đv ngoạm; mục tiêu đủ tầng tối đa thì ×1.6 sát thương và tiêu hết tầng (HC 7s).
- **S3 — Nhảy Lùi Thoát Hiểm / Hống Xung Phong** (hồi 12/12/12/12/12s): Người: bật nhảy lùi 4 đv, xả khói độc che mắt (mù) tại chỗ cũ và +25% tốc chạy 2s (HC 12s). Thú: gầm CHOÁNG 0.5s kẻ trước mặt rồi phi thân vồ tới trong cự ly 4 đv (HC 9s).
- **S4 — Đại Dịch / Thợ Săn Tối Thượng** (hồi 120/100/80s): Người: sương độc bán kính 6 tại điểm trong 8 đv suốt 6s — kẻ địch bên trong lập tức đủ tầng tối đa, chậm 20%. Thú: 8s +40% tốc chạy, cú cắn kết liễu tướng dưới 15% máu.
- **Skill phụ — Quá Liều! / Tiếng Hú Tử Thần** (hồi 40s): Người: uống cạn bình độc hóa Quái Thú 15s — cận chiến, +15 giáp/kháng phép, +SMVL, +8% tốc chạy, lá chắn 100 (+20/cấp), chiêu không tốn máu và đổi bộ S1–S3; hết dạng: Vã Thuốc (chậm 30% 2s), hồi 40s. Thú: Tiếng Hú Tử Thần — sóng âm CHOÁNG diện rộng 1s (bán kính 3.5) và 40 (+10/cấp, +40% SMPT) sát thương phép (hồi 12s).

### Gideon (gideon) — 🏰 Lãnh Chúa Cứ Điểm
- Cận chiến • vũ khí: greatsword • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 575 (+98), mana 300 (+40), công 58 (+3.6), giáp 34 (+3.6), KP 32 (+2), tốc đánh 0.66 (+2%), tốc chạy 3.4, tầm 2.7
- **Nội tại — Điểm Ngọt & Đại Trường Kiếm:** Đại Trường Kiếm: tầm đánh 2.7 đv; tốc đánh CỐ ĐỊNH — mọi % tốc đánh cộng thêm (cấp, đồ, mảnh hồn, bùa) chuyển thành % sát thương đòn đánh. Điểm Ngọt: trúng bằng mũi kiếm (30% ngoài cùng tầm) +30% sát thương và làm chậm 20%; trúng bằng cán (sát thân) −30%. Kháng đẩy: bị đẩy lùi / kéo ngắn hơn 30%.
- **S1 — Quét Ngang** (hồi 7/6.5/6/5.5/5s, 45/45/45/45/45 mana): Gồng 0.5/0.5/0.5/0.75/1s (dùng lại để vung sớm): giảm 40% sát thương nhận vào, miễn choáng, hấp thụ đòn đánh để tăng tới 10/20/25/30/40% sát thương. Rồi chém vòng cung 180° phía trước. Điểm Ngọt áp dụng.
- **S2 — Bổ Dọc** (hồi 10/9.5/9/8.5/8s, 55/55/55/55/55 mana): Bổ kiếm theo đường thẳng 5.5 đv, sát thương vật lý nặng. Trúng Điểm Ngọt (chóp mũi kiếm): +30% sát thương và trói chân 0.6/1/1.2/1.4/1.6s.
- **S3 — Địa Chấn** (hồi 10/10/9/9/8s, 50/50/50/50/50 mana): Cắm cự kiếm gồng tối đa 1.6s (dùng lại để kích nổ sớm): giảm 40% sát thương, không thể cản phá; vòng cảnh báo lan rộng dần. Kích nổ hất tung mọi kẻ trong vòng — gồng càng lâu và nhận càng nhiều sát thương thì nổ càng đau, hất tung càng lâu; phá ngay 30% Hộ Giáp.
- **S4 — Khai Thiên Lập Địa** (hồi —s, 100/100/100 mana): Nhảy vút lên, giáng cự kiếm xuống điểm trong 12/18/24 đv (vòng cảnh báo cực lớn). Tâm chấn (bán kính 6/9/12... thu gọn 3/4/5 đv trong đấu trường): hất tung, sát thương vật lý lớn kèm sát thương chuẩn bỏ qua Giáp và Hộ Giáp. Vùng rìa (gấp đôi bán kính): sát thương lan, làm chậm 40/60/80% 3s.
- **Skill phụ — Cán Kiếm** (hồi —s, 25 mana): Húc chuôi kiếm vào kẻ địch sát người (tầm 1.9): 30 (+6/cấp, +40% Công Vật Lý) sát thương, choáng 0.4/0.6/0.8s (theo cấp) và đẩy văng ra đúng 2.7 đv — vào thẳng Điểm Ngọt của Bổ Dọc. Hồi 9 → 8/7/6s theo cấp.

### Ignatius (ignatius) — 🔥 Gieo Rắc Hỗn Loạn
- Tầm xa • vũ khí: staff • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 540 (+84), mana 420 (+50), công 52 (+3), giáp 22 (+3.6), KP 30 (+1.4), tốc đánh 0.63 (+1.5%), tốc chạy 3.35, tầm 5.5
- **Nội tại — Hỏa Ấn & Bộc Phá Vô Tận:** Đòn đánh thường gây sát thương phép và găm 1 tầng Hỏa Ấn; chiêu găm thêm tầng. Hỏa Ấn cộng dồn VÔ HẠN: thiêu (7 +2/cấp +0.5 × số tầng) sát thương phép/giây trong 3s. Mỗi khi đủ bội số 6 tầng (6, 12, 18…): Hỏa Bạo nổ bán kính 2.5 và trừ 25% Kháng Phép nạn nhân 4s. Ấn tự tan sau 5s +0.25s/cấp nếu không nhận tầng mới. Vừa đi vừa niệm phép.
- **S1 — Cầu Lửa** (hồi 5.5/5/4.5/4/3.5s, 50/55/60/65/70 mana): Ném cầu lửa cực nhanh tầm 10 đv, nổ lan bán kính 1.8/2.0/2.2/2.2/2.6, găm 2 tầng Hỏa Ấn lên mọi kẻ địch trong vùng.
- **S2 — Đại Hỏa Cầu** (hồi 10/9.5/9/8.5/8s, 70/75/80/85/90 mana): Tích tụ tối đa 2s (vẫn đi được, chậm 50%): càng tích càng to, đau và bay xa — tầm 10→20 đv (cấp 1) tới 20→50 đv (cấp tối đa), bán kính nổ 1.8–2.6 lên 3/4/5/6/8 đv, sát thương 80–100% lên 200/225/225/250/300% SMPT; +25% lên mục tiêu dưới 30% máu. Điểm nổ để lại Biển Lửa 4s găm Hỏa Ấn.
- **S3 — Dịch Chuyển** (hồi 14/13/12/11/10s, 60/60/60/60/60 mana): Dịch chuyển tức thời 5 đv; điểm đến nổ sóng nhiệt đẩy lùi 1.5 đv, +30% tốc chạy 1s. Tích trữ tối đa 2/2/3/3/4 lần dùng (hồi 1 lần mỗi 14→10s).
- **S4 — Thiên Thạch** (hồi 110/90/70s, 100/100/100 mana): Gọi thiên thạch giáng xuống điểm trong 20 đv sau 1s cảnh báo: bán kính 8/10/16 đv (trùm cả ổ boss), sát thương phép 125/150/200% SMPT, hất tung 0.75/1/1.5s và găm ngay 6 tầng Hỏa Ấn (kích nổ nội tại). Để lại biển dung nham 6/8/12s.
- **Skill phụ — Vòng Lửa** (hồi 12s, 40 mana): Bùng vòng lửa tự vệ quanh thân (bán kính 3): 30 (+8/cấp, +30% SMPT) sát thương phép, găm Hỏa Ấn, hất tung và đẩy kẻ áp sát văng xa 4 đv +0.3 đv/cấp — tạo khoảng trống an toàn để tích Đại Hỏa Cầu.

### Jack "Sáu Lỗ" (jack) — 🎲 Con Bạc
- Tầm xa • vũ khí: revolver • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 600 (+92), mana 320 (+40), công 64 (+4), giáp 26 (+3.8), KP 30 (+1.3), tốc đánh 0.74 (+3%), tốc chạy 3.3, tầm 5.8
- **Nội tại — Gieo Xúc Xắc:** Ổ 6 viên, nạp 2s; mỗi lần nạp gieo xúc xắc: ⚀ tự mất 4% máu • ⚁–⚄ cả ổ +5/10/15/20% sát thương • ⚅ cả ổ chí mạng và choáng 0.25s.
- **S1 — Quạt Cò** (hồi 8/7.5/7/6.5/6s, 45/45/45/45/45 mana): Xả hết đạn còn lại theo hình nón (5 đv), mỗi viên 70% SMVL + 10/15/20/25/30. Rồi nạp đạn.
- **S2 — Cò Quay Nga** (hồi 18/17/16/15/14s, 60/60/60/60/60 mana): Nạp 1 Viên Định Mệnh rồi xoay ổ: một trong 6 phát kế tiếp gây 350% SMVL sát thương chuẩn và choáng 1s; trong lúc đó không dùng được Quạt Cò và Lăn Né.
- **S3 — Lăn Né** (hồi 10/9.5/9/8.5/8s, 40/40/40/40/40 mana): Lăn 3.5 đv (miễn sát thương khi lăn), nhét thêm 2 viên.
- **S4 — Nhà Cái Trả Thưởng** (hồi 100/85/70s, 100/100/100 mana): 6s mọi đòn đánh là ⚅ (chí mạng + choáng 0.25s); hạ gục tướng trong lúc đó: +4% sát thương tới hết trận (tối đa 5 lần) và hoàn 50% hồi chiêu.

### Joker (joker) — 🎭 Kẻ Bịp Bợm
- Tầm xa • vũ khí: cards • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 540 (+84), mana 420 (+50), công 52 (+3), giáp 22 (+3.6), KP 30 (+1.4), tốc đánh 0.63 (+1.5%), tốc chạy 3.35, tầm 5.2
- **Nội tại — Bịp Bợm:** Phi Bài 25%, Rút Bài và Tráo Bài 10% được nhân đôi. Lá Rô/Cơ gắn Ấn Mặt Trời, lá Bích/Tép gắn Ấn Mặt Trăng: một tướng mang đủ 2 Mặt Trời + 2 Mặt Trăng thì choáng 1.5s. Joker luôn giữ một lá bài (Phi Bài ném lá đang giữ). Giả Ngây Ngô: né hoàn toàn đòn đánh thường của tướng nam (cục súc Borg/Koda/Clint 30% • lão luyện Gideon/Valerius/Ryoma/Kazuki 10% • còn lại 16%); tướng nữ chỉ 3%.
- **S1 — Phi Bài Sắc Cạnh** (hồi 4/4/3.75/3.5/3.25s, 40/45/50/55/60 mana): Ném lá bài đang giữ 7 đv, áp hiệu ứng theo chất: ♠ sát thương lớn • ♣ khống chế ngẫu nhiên • ♦ nổ lan • ♥ hồi máu đồng minh quanh Joker • 🃏 đổi chỗ với mục tiêu.
- **S2 — Rút Bài May Rủi** (hồi 6/6/5.5/5.5/5s, 50/50/50/50/50 mana): Rút một lá: ♠ sát thương • ♣ khống chế ngẫu nhiên • ♦ nổ lan • ♥ hồi máu đồng minh • 🃏 đổi chỗ — áp lên tướng địch gần nhất trong 6 đv, rồi giữ lá đó. 10% rút hụt (hoàn 50% hồi chiêu).
- **S3 — Tráo Bài** (hồi 10/9.5/9/8.5/8s, 40/40/40/40/40 mana): Lướt 3 đv và đổi lá bài đang giữ.
- **S4 — Ván Cờ Đổi Chiều** (hồi 110/90/70s, 100/100/100 mana): Tung hộp bài lên trời: 45% Lá Toàn Năng (mọi chất cùng lúc lên mục tiêu) • 30% Đại Bác Bài (quét đường thẳng 10 đv) • 20% Tráo Sinh Mệnh (đổi % máu với tướng địch, chênh tối đa 30%) • 4.8% Cơn Ác Mộng (choáng 2.5s, kẻ quanh đó 1.5s) • 0.2% Thần Chết Bịp Bợm (kết liễu lập tức).
- **Skill phụ — Mượn Tý Nha!** (hồi 0s): Khi ai đó trong tầm nhìn dùng món kích hoạt, vật phẩm tiêu hao hoặc phép bổ trợ, Joker có 10s để dùng bản sao của nó (hồi chiêu 0s).

### Justus (justus) — 📿 Cuồng Tín
- Tầm xa • vũ khí: tome • tài nguyên: không dùng mana • sát thương chính: phép
- Chỉ số cấp 1: máu 570 (+88), mana 420 (+50), công 52 (+3), giáp 28 (+3.8), KP 32 (+2), tốc đánh 0.63 (+1.5%), tốc chạy 3.35, tầm 5
- **Nội tại — Đức Tin Cứu Rỗi • Ý Chí Kiên Định • Hộ Vệ Thánh Đình:** Chiêu tốn Đức Tin (100, tự hồi 2.5/giây ngoài giao tranh, 1/giây trong giao tranh); giáp ảo của Justus bị vỡ, được hồi máu hay ban giáp mới: +10 Đức Tin (mỗi 1.5s). Ý Chí Kiên Định (60s): chặn trọn chiêu đầu tiên của tướng địch, rồi tỏa sóng làm chậm 40% trong 4.5 đv 2s. Hộ Vệ Thánh Đình (100s): dưới 25% máu, Thiên Sứ gánh đòn thay (35% máu tối đa của Justus, Justus không thể chết khi Thiên Sứ còn), +50 Đức Tin.
- **S1 — Tam Kiếm Trừng Phạt** (hồi 9/8.5/8/7.5/7s): Không có thời gian niệm (vừa chạy vừa dùng). Tốn 20 Đức Tin: đánh dấu vòng đỏ bán kính 1.6 đv lên 3 tướng địch gần nhất trong 8 đv; sau 0.25s ba thanh kiếm thánh cắm xuống: sát thương phép và choáng 1s.
- **S2 — Thánh Quang Hộ Thể** (hồi 12/11/10/9/8.5s): Tốn 25 Đức Tin: Justus và đồng minh trong 6 đv nhận Giáp Ảo = 20% máu tối đa trong 4s và được thanh tẩy mọi khống chế, hiệu ứng xấu, vết thương sâu. Giáp bị phá trước khi hết giờ: hoàn 25 Đức Tin.
- **S3 — Tia Phán Quyết Liên Tục** (hồi 6/5.5/5/4.5/4s): Chiếu tia laser thánh dài 10 đv (khởi đầu 10 Đức Tin, +6 mỗi giây duy trì, tối đa 4s): vừa chiếu vừa đi chậm (−30%); bị choáng / hóa đá là ngắt. Mỗi 0.5s trúng tướng: sát thương +15% (tối đa +60%). Mỗi giây trúng: Ý Chí Kiên Định hồi nhanh 0.25s × số tướng trúng.
- **S4 — Trận Địa Thanh Tẩy Vạn Năng** (hồi 90/75/60s): Tốn 40 Đức Tin: cắm Kinh Thánh mở Pháp Trận bán kính 9 đv trong 6s. Kẻ địch trong trận bị thiêu mỗi 0.5s (mỗi nhịp +2 Đức Tin), mất 40% Kháng Phép và 30 Hộ Giáp mỗi giây. Mỗi 1.5s cấp Giáp Ảo 8% máu tối đa cho Justus và đồng minh trong trận, thanh tẩy làm chậm.

### Kazuki (kazuki) — 💣 Kẻ Đổi Mạng
- Cận chiến • vũ khí: twinblades • tài nguyên: không dùng mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 595 (+93), mana 0 (+0), công 63 (+4), giáp 30 (+3.9), KP 32 (+1.8), tốc đánh 0.72 (+2.5%), tốc chạy 3.55, tầm 1.6
- **Nội tại — Song Kiếm Vô Niệm:** Đánh thường luân phiên tay trái (nhanh, 85%) / tay phải (nặng, 125%). Ý Niệm (0–100) tự hồi 2/giây, chiêu tốn Ý Niệm (S1 10 • S2 15 • S3 25). Kiếm Ý (0–10): +1 mỗi Kiếm Thế Quyết, +5 mỗi lần Nghịch Trảm thành công — đủ 5 thì Kiếm Thế Quyết đổi thành Loạn Vũ Hư Ảnh.
- **S1 — Tả Trảm** (hồi 3/3/3/3/3s): Chém nhanh hình nón, gạt đạn nhỏ bay tới. Ghi nhịp "A" cho Kiếm Thế Quyết. Tốn 10 Ý Niệm.
- **S2 — Hữu Trảm** (hồi 6/5.75/5.5/5.25/5s): Chém nặng, tầm rộng. Ghi nhịp "B". Tốn 15 Ý Niệm.
- **S3 — Kiếm Thế Quyết** (hồi 10/9.5/9/8.5/8s): Theo 2 nhịp trước: AA xoay 360° • AB đâm 4.5 đv choáng 1s • BA chém chữ X gây Vết Thương Sâu • BB lướt xuyên 4 đv choáng 1s; không có nhịp thì chém thường. Đủ 5 Kiếm Ý: tốn 5 để tung Loạn Vũ Hư Ảnh — 5 ảo ảnh chém từ 5 hướng, khóa mục tiêu 1.5s rồi hất tung. Mỗi lần dùng giảm 4s hồi chiêu S4. Tốn 25 Ý Niệm.
- **S4 — Vạn Cảnh Trảm Vực** (hồi 110/90/75s): Lướt 6 đv, để lại vùng loạn kiếm bán kính 3 trong 4s: sát thương liên tục, hút nhẹ về tâm, cấm lướt.
- **Skill phụ — Vô Tướng Nghịch Trảm** (hồi 14s): Thủ thế song kiếm 0.6s. Đỡ trúng đòn đánh hay chiêu của tướng địch phía trước: chặn sát thương, CHOÁNG kẻ đó 1s, lướt xuyên qua để ảo ảnh chém liên hoàn — 2s sau vết chém nổ tung (60 +10/cấp, +60% SMVL) và đẩy văng; hồi ngay Kiếm Thế Quyết, +5 Kiếm Ý. Đỡ hụt: khựng 0.3s.

### Kip (kip) — 🃏 Quấy Nhiễu
- Cận chiến • vũ khí: voidknife • tài nguyên: không dùng mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 600 (+90), mana 0 (+0), công 68 (+4.1), giáp 27 (+3.6), KP 32 (+1.8), tốc đánh 0.75 (+2.5%), tốc chạy 3.7, tầm 1.4
- **Nội tại — Gia Tốc Trượt Không Gian:** Mỗi lần lướt / dịch chuyển / dây móc: +15% tốc chạy 2.5s; đòn cận chiến kế tiếp sau dịch chuyển bỏ qua 30% Hộ Giáp và áp sát tức thời trong 4 đv. Thể Phản Xạ Hư Vô (45s): đòn đầu tiên từ kẻ địch ngoài tầm nhìn bị vô hiệu. Đứng trong vùng cảnh báo đỏ: +30% tốc chạy để thoát.
- **S1 — Vết Nứt Hư Không** (hồi 0.4s): Tốn 1 Điểm Hư Không: dịch chuyển 6 đv theo hướng chỉ định (xuyên vật cản mỏng), để lại Vết Nứt 3s. Trong 3s dùng lại để giật về Vết Nứt, hồi 15% Hộ Giáp và choáng 0.3s kẻ địch quanh đó.
- **S2 — Phi Đao Tọa Độ** (hồi 12/11/10/9/9s): Phóng phi đao 16 đv. Cắm địa hình: tạo điểm neo 5s, dùng lại để dịch chuyển tới đó. Trúng kẻ địch: sát thương vật lý; dùng lại (5s) để xuyên không ra sau gáy đối thủ, đâm chí mạng và làm chậm 50% 1.5s.
- **S3 — Vòm Xoáy Bẻ Cong Đạn Đạo** (hồi 15/14/13/12/12s): Tốn 1 Điểm Hư Không: lỗ đen mini bán kính 3.5 đv quanh thân 2s — nuốt mọi đạn đạo tầm xa bay vào; kẻ địch cận chiến bước vào nhận sát thương phép và bị hất văng 4 đv khi vòm xoáy kết thúc.
- **S4 — Lãnh Địa Đa Chiều: Trò Chơi Trốn Tìm** (hồi 80/65/50s): Tốn 2 Điểm Hư Không: kết giới bán kính 14 đv trong 8s — Vết Nứt không tốn điểm và hồi 1s; mỗi cú dịch chuyển để lại tàn ảnh đánh lừa; mọi đòn đánh thêm 50% xuyên Hộ Giáp. Rời khỏi kết giới thì nó biến mất.

### Koda (koda) — 🌋 Cuồng Loạn
- Cận chiến • vũ khí: claw • tài nguyên: không dùng mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 620 (+96), mana 0 (+0), công 65 (+4), giáp 33 (+3.8), KP 32 (+1.8), tốc đánh 0.72 (+2.5%), tốc chạy 3.65, tầm 1.45
- **Nội tại — Vết Thương Sâu:** Đòn đánh và chiêu gây 1 tầng Chảy Máu (tối đa 5): mỗi tầng 6 (+1.8/cấp) sát thương vật lý mỗi giây trong 4s.
- **S1 — Cào Loạn Xạ** (hồi 5/4.5/4/3.5/3s): 2 nhát cào nhanh trước mặt, mỗi nhát gây 1 tầng Chảy Máu. Vừa lao xuống từ tường: ×1.5.
- **S2 — Xé Toạc** (hồi 9/8.5/8/7.5/7s): Kích nổ toàn bộ Chảy Máu trên mục tiêu thành sát thương tức thì. Đủ 5 tầng: làm chậm 60% 1.5s và cộng 10% máu đã mất.
- **S3 — Vồ Mồi** (hồi 12/11/10/9/8s): Nhảy vồ tới 5 đv. Chạm tướng địch: đè xuống (trói chân cả hai 0.5s) rồi cào vào mặt. Chạm tường/vách: bám luôn vào tường (như Bám Tường).
- **S4 — Thú Tính** (hồi 100/85/70s): 5s hóa bóng đen: +50% tốc chạy, đi xuyên người; mỗi lần lướt qua tướng địch gây 1 tầng Chảy Máu (mỗi tướng 1 lần/0.5s).
- **Skill phụ — Bám Tường** (hồi 12s): Khi đứng cạnh tường/vách đá/rặng cây (1.6 đv): bám lên đó tối đa 3s — không thể bị chọn làm mục tiêu. Bấm lại (hoặc dùng Vồ Mồi): lao xuống tướng địch trong 7 đv nhanh gấp rưỡi, gây 60 (+6/cấp, +60% SMVL) ×1.5 sát thương; Cào Loạn Xạ kế tiếp ×1.5.

### Luca (luca) — 🎰 Con Bạc Khát Nước
- Cận chiến • vũ khí: cane • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 780 (+112), mana 420 (+48), công 70 (+4.6), giáp 32 (+4.2), KP 34 (+1.9), tốc đánh 0.8 (+2.5%), tốc chạy 3.6, tầm 1.7
- **Nội tại — Sân Khấu Náo Nhiệt:** Náo Nhiệt 0–100: đánh trúng tướng +5, chiêu trúng tướng +10, lừa đòn +20, thoát hiểm +15. Mỗi 10 điểm +2% tốc chạy, +3% SMPT; đủ 100 mở khóa Cải Trang Tuyệt Đỉnh. Áo Choàng Thoát Hiểm (120s): lần đầu tụt dưới 10% máu → tàng hình 1.5s, dịch chuyển 4 đv ra xa kẻ địch, +15 Náo Nhiệt; mỗi lần đầy 100 Náo Nhiệt giảm 30s hồi.
- **S1 — Sân Khấu Mở Ra / Bước Nhảy Ngàn Hoa** (hồi 10/9/8/7/7s, 55/55/55/55/55 mana): Mở Vùng Sân Khấu bán kính 6 đv trong 6s: trong vùng +20% tốc chạy, +15% hút máu phép. Trong sân khấu, S1 thành Bước Nhảy Ngàn Hoa: hồi chỉ 0.6s, tốn 25 mana, lướt 2.5 đv phóng cánh hoa hồng thép gây sát thương phép kẻ địch lướt qua, chạm đất NỔ HOA bán kính 1.8 (50% sát thương).
- **S2 — Ánh Đèn Rọi Vào Tôi Nè!** (hồi 13/12/11/10/10s, 60/60/60/60/60 mana): Tạo dáng 1.5s ("Trò Lừa Bịp"): đòn đầu tiên của kẻ địch bị triệt tiêu 100%, Luca hóa búp hoa dịch chuyển ra sau lưng kẻ tấn công, câm lặng 1.25s và khiến nạn nhân nhận thêm 20% sát thương phép từ Luca trong 3s (+20 Náo Nhiệt).
- **S3 — Hoán Vị Ảnh Hồng** (hồi 11/10/9/8/8s, 65/65/65/65/65 mana): Để lại Đóa Hồng Chiếu Ảnh (6s) rồi lao 4.5 đv: kẻ đầu tiên va phải nhận sát thương phép và choáng 0.75s. Trong 6s dùng lại để dịch chuyển về đóa hồng.
- **S4 — Cải Trang Tuyệt Đỉnh** (hồi 90/75/60s, 100/100/100 mana): Cần 100 Náo Nhiệt. Ném lá bài mạ vàng 8 đv: trúng tướng gây sát thương phép, Luca hóa trang thành tướng đó 15s — S1–S3 được thay bằng chiêu của nạn nhân (SMPT quy đổi thành SMVL nếu sao chép đấu sĩ / xạ thủ), dùng chiêu phụ để lật qua lại hai bộ chiêu. Trong 2s đầu dùng lại để đổi chỗ với nạn nhân. Hết giờ: dịch chuyển về chỗ bắt đầu tung chiêu.
- **Skill phụ — Hoán Đổi Bộ Chiêu** (hồi 1s): Khi đang Cải Trang: lật qua lại giữa bộ chiêu của Luca và bộ chiêu đang sao chép (hai bộ hồi chiêu độc lập).

### Lyra (lyra) — 🐀 Chuột Lũi
- Tầm xa • vũ khí: tidestaff • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 550 (+84), mana 420 (+50), công 52 (+3), giáp 22 (+3.6), KP 30 (+1.4), tốc đánh 0.63 (+1.5%), tốc chạy 3.35, tầm 5.5
- **Nội tại — Thủy Triều:** Đánh thường gây sát thương phép và làm chậm 15% 1s. Chiêu trúng tướng địch tích 1 tầng Thủy Triều (4s); đủ 3 tầng: trói chân 0.75s (mỗi mục tiêu 1 lần/6s).
- **S1 — Bong Bóng Nước** (hồi 6/5.5/5/4.5/4s, 50/55/60/65/70 mana): Bắn bong bóng 8 đv: 60/95/130/165/200 (+60% SMPT) sát thương phép lên kẻ đầu tiên trúng, làm chậm 25% 1s. Mục tiêu đã bị làm chậm từ trước: thành choáng 1s.
- **S2 — Sóng Dâng** (hồi 11/10.5/10/9.5/9s, 60/65/70/75/80 mana): Đẩy con sóng 7 đv (rộng 1.4): 50/80/110/140/170 (+45% SMPT) sát thương phép, đẩy lùi 1.5/2/2.5/3/3.5 đv. Lyra nhận giáp bong bóng 8% máu tối đa; giáp vỡ hoặc hết hạn thì nổ sóng xung kích đẩy lùi kẻ địch quanh 2 đv.
- **S3 — Dòng Chảy** (hồi 14/13/12/11/10s, 60/60/60/60/60 mana): Lyra và đồng minh thấp máu nhất trong 10 đv nhận khiên 50/80/110/140/170 (+35/35/40/40/45% SMPT) trong 2.5/3/3/3/3.5s, +30% tốc chạy 2s và hồi ngay 20% máu đã mất.
- **S4 — Đại Hồng Thủy** (hồi 110/95/80s, 100/100/100 mana): Niệm 0.75s (vùng cảnh báo), gọi cột nước vào điểm trong 10/20/30 đv: bán kính 3.5/5/8, 180/270/360 (+80% SMPT) sát thương phép, hất tung 1s. Để lại vực xoáy 4s: hút nhẹ về tâm, chậm 40%, sát thương mỗi 0.5s và tích Thủy Triều; Lyra và đồng minh trong xoáy hồi 3% máu mỗi giây.

### Mirage (mirage) — 🎭 Kẻ Bịp Bợm
- Tầm xa • vũ khí: wand • tài nguyên: không dùng mana • sát thương chính: phép
- Chỉ số cấp 1: máu 550 (+86), mana 420 (+50), công 52 (+3), giáp 24 (+3.6), KP 30 (+1.4), tốc đánh 0.63 (+1.5%), tốc chạy 3.45, tầm 5.2
- **Nội tại — Hiện Diện Náo Nhiệt • Đại Thoát Hiểm • Đòn Đánh Ảo Ấn:** Chiêu tốn Náo Nhiệt (thay mana) — chỉ cần có mặt trên sàn đấu là +4 Náo Nhiệt mỗi giây (+50% khi ở gần Alice / Luca). Dưới 25% máu (120s): tàng hình 2.5s, dịch chuyển 5 đv, để lại 4 phân ảnh chạy toán loạn. Đánh thường gây sát thương phép và găm Ảo Ấn 5s; đòn / chiêu kế tiếp kích nổ thêm 6% máu tối đa.
- **S1 — Tàn Ảnh Lướt Xuyên** (hồi 10/9.5/9/8.5/8s): Tốn 20 Náo Nhiệt: vào trạng thái Tàn Ảnh 2s (không thể bị chọn, +35% tốc chạy), lướt 3 đv và để lại ảo ảnh tĩnh ở điểm xuất phát. Kẻ địch bị lướt xuyên qua bị găm Dấu Ấn; hết Tàn Ảnh, dấu ấn nổ bằng 40% sát thương nạn nhân đã nhận trong lúc bị găm. Dùng lại trong 2s: giật về ảo ảnh và kích nổ sớm.
- **S2 — Phi Dao Hoán Vị** (hồi 11/10/9.5/9/8.5s): Tốn 25 Náo Nhiệt: ném phi dao 9 đv, trúng tướng gây sát thương phép và cắm 3s. Dùng lại trong 3.5s: búng tay hoán đổi vị trí với nạn nhân, choáng nó 1s.
- **S3 — Hộp Tử Thần** (hồi 13/12/11/10/9.5s): Tốn 30 Náo Nhiệt: đặt vùng cảnh báo đỏ bán kính 6.5 đv tại chỗ hoặc một điểm trong 8 đv; sau 2.2s phát nổ — sát thương phép CỰC LỚN, CHOÁNG 1.25s mọi mục tiêu bên trong và phá 350 Hộ Giáp. (Combo: Phi Dao trúng → Hộp Tử Thần dưới chân → dùng lại Phi Dao đổi chỗ, ném nạn nhân vào tâm vụ nổ.)
- **S4 — Nghệ Thuật Ảo Ảnh: Phân Thân Hoàn Hảo** (hồi 85/70/55s): Tốn 50 Náo Nhiệt: tạo Phân Thân Hoàn Hảo 15s (máu 100% bản gốc, mang theo trang bị & mảnh hồn, tự đánh, tự né, tự dùng Phi Dao và Hộp Tử Thần thu nhỏ); bị phá hoặc hết giờ thì nổ bán kính 4 đv: sát thương phép và choáng 1.5s. Dùng lại (hồi riêng 4s): đổi chỗ với phân thân. Nội tại: học chiêu này thì mọi ảo ảnh đều đánh thường (35% sát thương).
- **Skill phụ — Biến Ảnh / Phân Hình** (hồi —s): Sẵn sàng: tạo một ảo ảnh tĩnh 8s tại chỗ. Khi đã có ảo ảnh: đổi vị trí tức thì với ảo ảnh an toàn nhất. Hồi 12s → 4s theo cấp.

### Olivia (olivia) — 📿 Cuồng Tín
- Tầm xa • vũ khí: lightstaff • tài nguyên: mana • sát thương chính: phép
- Chỉ số cấp 1: máu 575 (+88), mana 380 (+45), công 50 (+2.6), giáp 28 (+3.9), KP 30 (+1.5), tốc đánh 0.62 (+1.5%), tốc chạy 3.35, tầm 5.5
- **Nội tại — Đức Tin Tự Sinh • Thánh Ý Bảo Hộ • Thánh Niệm:** Đức Tin tự hồi 3/giây (gấp đôi cạnh đồng minh); trên 50 Đức Tin: +50% hồi mana. Mỗi 15s nhận Khiên Phép = 12% máu tối đa + 25% SMPT (chỉ đỡ sát thương phép). Đánh thường là tia phép 5.5 đv (100% SMVL + 30% SMPT), trúng tướng +5 Đức Tin.
- **S1 — Dây Dẫn Thánh Linh / Trận Pháp Cứu Rỗi** (hồi 11/10/9/8/8s, 60/60/60/60/60 mana): Lên kẻ địch: xích thánh trói chân 1.25–2s và gây sát thương phép. Lên đồng minh: hồi máu tức thì và kéo đồng minh lướt về cạnh Olivia. Có đủ 25 Đức Tin và kẻ địch đứng gần nhau: đặt Thánh Trận ở xa — 1.5s sau kích nổ, trói chân 1.5s mọi kẻ địch trong vùng, hồi máu và thanh tẩy đồng minh trong vùng.
- **S2 — Thánh Hộ Thể** (hồi 10/9/8/7/7s, 65/65/65/65/65 mana): Tốn 20 Đức Tin: mọi đồng minh trong 5 đv (kể cả Olivia) nhận Giáp Ảo = 25% máu đã mất + 10% SMPT trong 3.5s — càng thấp máu giáp càng dày.
- **S3 — Thánh Lễ Thanh Trừng** (hồi 14/13/12/11/11s, 80/80/80/80/80 mana): Tốn 30 Đức Tin: vùng Thánh Lễ bán kính 4 đv trong 4s. Đồng minh trong vùng hồi máu mỗi giây, +15–30% sát thương, +25% tốc chạy. Kẻ địch trong vùng bị xóa mọi khiên / cường hóa / tăng tốc khi Thánh Lễ mở và bị thiêu nhẹ liên tục.
- **S4 — Thánh Linh Ban Phước** (hồi 120/105/90s, 100/100/100 mana): Hồi máu lớn cho mọi đồng minh trên khắp đấu trường (+50% nếu dưới 40% máu), +30% tốc chạy 4s; đồng minh thấp máu nhất nhận Siêu Giáp Ánh Sáng = 35% máu tối đa của Olivia trong 5s.
- **Skill phụ — Ý Chí Thần Quan** (hồi 20s): Quỳ cầu nguyện tối đa 4s: mỗi giây hồi 4% máu và 5% mana. Bị tướng hoặc quái lớn đánh là ngắt.

### Percy (percy) — 🐺 Thợ Săn Bắt Lẻ
- Tầm xa • vũ khí: crossbow • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 560 (+88), mana 320 (+40), công 54 (+3.3), giáp 26 (+3.8), KP 30 (+1.3), tốc đánh 0.7 (+3%), tốc chạy 3.62, tầm 6
- **Nội tại — Dồn Dập:** Sát thương gốc yếu nhưng chạy nhanh. Mỗi phát bắn trúng (đánh thường hoặc tên Trận Địa) +10% sát thương (tối đa 8 tầng = +80%); 2.5s không bắn trúng thì mất hết.
- **S1 — Trận Địa Nỏ** (hồi 8/7.5/7/6.5/6s, 50/50/50/50/50 mana): ĐỨNG YÊN mở trận địa bán kính [10, 15, 18, 20, 25] tối đa [5, 8, 8, 8, 10]s: mỗi 0.15s tự bắn một mũi tên (24% SMVL, cộng Dồn Dập) vào kẻ địch gần nhất trong vùng. Di chuyển thì dừng (Lướt Chiến Thuật dời trận địa theo). Chỉ hồi chiêu khi trận địa kết thúc.
- **S2 — Móc & Đạp** (hồi 10/9.5/9/8.5/8s, 50/50/50/50/50 mana): Bắn móc 7 đv: kéo kẻ trúng về sát Percy, choáng 0.75s rồi đạp văng 3.5 đv. Dùng được khi đang mở Trận Địa.
- **S3 — Lướt Chiến Thuật** (hồi 6/6/5.5/5.5/5s, 30/30/30/30/30 mana): Lướt 4 đv theo hướng chỉ định; dùng khi đang mở Trận Địa thì dời trận địa theo (không làm dừng).
- **S4 — Liên Châu** (hồi 80/70/60s, 100/100/100 mana): 4s: mỗi phát đánh thường và mỗi loạt Trận Địa bắn ra 3 mũi tên thay vì 1 (mũi phụ 60%).

### Ratok (ratok) — 🔥 Hổ Báo
- Cận chiến • vũ khí: hookchain • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 720 (+108), mana 300 (+40), công 66 (+4), giáp 34 (+4.2), KP 32 (+2), tốc đánh 0.66 (+2%), tốc chạy 3.5, tầm 1.8
- **Nội tại — Ràng Buộc Thép • Thiết Phá:** +12 Giáp và +12 Kháng Phép với mỗi tướng địch trong 4 đv; từ 3 tướng địch trở lên: +25% kháng hiệu ứng. Mỗi 12s đòn đánh kế tiếp được cường hóa: thêm 6% máu tối đa sát thương vật lý và choáng 0.75s; mỗi đòn đánh trúng giảm 1s hồi chiêu nội tại này.
- **S1 — Móc Sắt Rỉ Sét** (hồi 14/13/12/11/11s, 70/70/70/70/70 mana): Phóng móc xích 8.5 đv: trúng kẻ đầu tiên gây sát thương vật lý và móc chặt 1s (kẻ bị móc không đi xa hơn được). Dùng lại trong lúc móc: giật mạnh kéo nạn nhân bay về sát Ratok, thêm sát thương và làm chậm 30% 1.5s.
- **S2 — Bộc Phá Húc** (hồi 10/9.5/9/8.5/8.5s, 50/50/50/50/50 mana): Lao 3.5 đv húc văng kẻ đầu tiên: sát thương vật lý, choáng 0.75s. Nếu có kẻ đang dính Móc Sắt: thành Đột Kích Điểm Nổ — co xích lao thẳng tới nạn nhân bất kể khoảng cách, dậm nổ choáng 1.25s mọi kẻ địch quanh đó.
- **S3 — Tử Xích Toàn Phong** (hồi 9/8/7/6/6s, 60/60/60/60/60 mana): Vung xích quay tròn bán kính 3 đv: sát thương vật lý, hút mọi kẻ địch trúng chiêu về sát Ratok và ngắt chiêu đang niệm.
- **S4 — Tàn Phá Thế Giới** (hồi 100/85/70s, 100/100/100 mana): Quay đại xích rồi cắm móc neo vào điểm cách tối đa 11 đv (cảnh báo đỏ 0.75s), sau đó kéo thân mình bay như đạn pháo tới, dộng sập mặt đất: sát thương vật lý lớn diện rộng và hất tung 1.5s.

### Raven (raven) — ⛰ Tiên Tri Địa Hình
- Tầm xa • vũ khí: rifle • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 550 (+88), mana 320 (+40), công 55 (+3.3), giáp 26 (+3.8), KP 30 (+1.3), tốc đánh 0.6 (+2.5%), tốc chạy 3.35, tầm 7.2
- **Nội tại — Sát Thủ Chuyên Nghiệp:** Hai băng đạn độc lập (bản Legacy): SÚNG TRƯỜNG 30 viên (mỗi phát 3 viên, nạp 3s) — mục tiêu càng xa đạn càng mạnh (tối đa +25% từ 8 đv) • SÚNG TỈA 5 viên (nạp 6s, mỗi viên ×1.6 sát thương). Thấy kẻ địch ngoài tầm súng trường thì đứng lại NGẮM: tầm +7.5; khi quạ Oca còn sống, tầm gần như vô hạn — bắn bất cứ kẻ nào Oca / Raven nhìn thấy, liên tục tới khi Oca bị hạ. Di chuyển là thôi ngắm. Chỉ nạp khi bắn cạn băng; tốc đánh và Tốc Nạp rút ngắn thời gian nạp.
- **S1 — Bắn Tỉa Xuyên Phá** (hồi 10/9.5/9/8.5/8s, 50/55/60/65/70 mana): Ngắm 0.75s rồi bắn 1 phát tầm cực xa (14 đv). Bị áp sát (dưới 2.2 đv): lăn lùi 3 đv (né đòn khi lăn) rồi mới bóp cò. Mục tiêu bị Oca đánh dấu: đạn xuyên địa hình và phá lá chắn.
- **S2 — Quạ Cơ Giới Oca** (hồi 22/21/20/19/18s, 60/60/60/60/60 mana): Thả quạ cơ giới bay thẳng (qua cả tường) tới điểm trong 40 đv rồi TỰ TÌM CON MỒI YẾU MÁU (trong 26 đv quanh nó), lượn trên đầu nó 20s: cho tầm nhìn 10 đv, lộ tàng hình; mỗi giây thả bom mini vào 1 kẻ địch trong 4 đv — làm chậm 30% và đánh dấu 4s. Oca có máu riêng và có thể bị bắn hạ. Oca còn sống: tầm súng tỉa gần như vô hạn. Thả quạ từ chỗ an toàn thì Raven đổi sang SÚNG NGẮM: đứng yên, tầm bắn +7.5 (bắn qua tầm nhìn của quạ), chậm hơn 35% nhưng mỗi viên mạnh hơn 45%; di chuyển hoặc Oca chết thì đổi lại súng trường.
- **S3 — Kỹ Thuật Ẩn Nấp** (hồi 18/17/16/15/14s, 50/50/50/50/50 mana): Bom khói bán kính 3 trong 3s: Raven tàng hình khi đứng trong khói, kẻ địch trong khói bị mù.
- **S4 — Màn Đêm Vĩnh Cửu** (hồi 120/100/80s, 100/100/100 mana): 5s: tầm nhìn mọi tướng đối phương co còn 40%; Raven tàng hình (nổ súng thì lộ 1.2s), đạn +30% sát thương.

### Roxie & T-Zero (roxie) — ⚖ Thương Nhân
- Tầm xa • vũ khí: wrench • tài nguyên: không dùng mana • sát thương chính: phép
- Chỉ số cấp 1: máu 590 (+94), mana 420 (+50), công 58 (+3), giáp 28 (+3.6), KP 30 (+1.4), tốc đánh 0.63 (+1.5%), tốc chạy 3.35, tầm 5
- **Nội tại — Bánh Răng & Sáng Tạo:** Bánh răng liên tục rơi quanh Roxie (mỗi 4s một cái, tối đa 4 cái nằm chờ) — đi qua là nhặt; quái và tướng bị hạ gần Roxie cũng rơi bánh răng. Mỗi bánh răng +3% tốc chạy (tối đa 9). Ụ Pháo tốn 2 bánh răng; Gia Công tốn 3 bánh răng để ghép 1 Mảnh cơ giới; đủ 3 Mảnh thì gọi được Thiết Vệ T-Zero.
- **S1 — Khai Hỏa / Pháo Kích** (hồi 3/3/3/3/3s): Đủ 2 bánh răng (và chưa đủ ụ): dựng Ụ Pháo tại điểm trong 5 đv (tự bắn 20s, tối đa 1 ụ). Còn lại: bắn 1 viên pháo 7 đv. Cưỡi T-Zero: Đấm — nón 2.5 đv đẩy lùi.
- **S2 — Khai Tâm** (hồi 6/5.5/5/4.5/4s): Kích nổ Ụ Pháo gần nhất: sát thương bán kính 2.5 đẩy lùi, nhận lại 2 bánh răng, +50% tốc chạy và +30% sát thương 4s. Cưỡi T-Zero: Phun Lửa — nón 4.5 đv thiêu đốt.
- **S3 — Bất Ngờ Chưa** (hồi 12/11/10/9/8s): Lộn ra sau 3 đv, nổ choáng 0.8s tại chỗ cũ. Dùng được cả khi đang bị khống chế. Cưỡi T-Zero: Húc — lao 4 đv hất tung 0.5s.
- **S4 — Thiết Vệ T-Zero** (hồi 25/20/15s): Cần đủ 3 Mảnh cơ giới (Gia Công). Gọi T-Zero 15s (tiêu 3 Mảnh). Bị áp sát hoặc máu thấp: tự lái — T-Zero gánh đòn (lá chắn 700 +110/cấp, +45%), bộ chiêu đổi thành Đấm / Phun Lửa / Húc, skill phụ thành Tự Hủy. Còn lại: T-Zero tự hành chiến đấu (Đấm, Phun Lửa, Húc), Roxie vẫn bắn bên ngoài; hết giờ T-Zero tự hủy.
- **Skill phụ — Gia Công / Tự Hủy** (hồi 3s): Gia Công: dùng 3 bánh răng ghép 1 Mảnh cơ giới (tối đa 3) — đủ 3 Mảnh thì gọi được Thiết Vệ T-Zero. Khi đang lái T-Zero hoặc T-Zero đang tự hành: Tự Hủy — T-Zero phát nổ bán kính 3.5 (sát thương theo cấp S4).

### Ryoma (ryoma) — 🎯 Kẻ Trảm Tướng
- Cận chiến • vũ khí: katana • tài nguyên: không dùng mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 540 (+82), mana 0 (+0), công 57 (+3.4), giáp 30 (+3.8), KP 32 (+1.8), tốc đánh 0.7 (+2.5%), tốc chạy 3.55, tầm 1.6
- **Nội tại — Liên Hoàn:** Nhất Đao, Đột Thích, Thuấn Bộ mỗi chiêu có 2 lượt dùng. Cứ 2 chiêu liên tiếp trong 2s kích hoạt Combo theo cặp: AA chém tròn rộng • AB lướt chém rồi chém tròn nhỏ • AC hư ảnh cùng chém tròn • BB đâm thêm nhát nữa gây CHOÁNG • BC phóng dư ảnh lao tới • CC gió xoáy làm chậm (A = Nhất Đao, B = Đột Thích, C = Thuấn Bộ). Mỗi Combo hồi 1 lượt Nhất Đao, nạp 1 Kiếm Khí (tối đa 3) và giảm 3s hồi chiêu Vô Ảnh Trảm.
- **S1 — Nhất Đao** (hồi 4/3.75/3.5/3.25/3s): Chém hình vòng cung trước mặt. 2 lượt dùng.
- **S2 — Đột Thích** (hồi 7/6.5/6/5.5/5s): Đâm thẳng 4 đv. 2 lượt dùng.
- **S3 — Thuấn Bộ** (hồi 8/7.5/7/6.5/6s): Lướt ngắn 3.5 đv về phía trước, chém kẻ địch trên đường. 2 lượt dùng.
- **S4 — Vô Ảnh Trảm** (hồi 100/85/70s): Lao vào tướng trong 5 đv, không thể bị chọn 1.2s, chém 5 lần rồi tung nhát kết liễu cộng 10% máu đã mất.
- **Skill phụ — Kiếm Khí** (hồi 1s): Chỉ dùng được khi có Kiếm Khí (mỗi Combo nạp 1, tối đa 3): chém ra một luồng kiếm khí xuyên thấu 7 đv — 25 (+6/cấp, +80% SMVL) sát thương, PHÁ HỦY đạn của đối thủ trên đường bay.

### Diệp Thanh Phong (thanhphong) — 📿 Cuồng Tín
- Tầm xa • vũ khí: fan • tài nguyên: không dùng mana • sát thương chính: phép
- Chỉ số cấp 1: máu 560 (+88), mana 420 (+50), công 52 (+3), giáp 24 (+3.6), KP 30 (+1.4), tốc đánh 0.63 (+1.5%), tốc chạy 3.45, tầm 4.8
- **Nội tại — Khí Áp Phong Vũ:** Thước Gió 0–100 (S1 kéo −17.5, S2 đẩy +17.5). Thuận (≤35): +15% tốc chạy, Giáp Phong Hộ chặn trọn 1 đòn mỗi 10s, đánh thường tầm 4.8 làm chậm 20% 1s • Bão Hòa (36–64): đòn đánh và chiêu găm Gió Mê, 3 tầng thì ngủ 1s; tầm đánh 6.0; mỗi 5s đòn đánh kế tiếp phóng 3 luồng lốc hất tung 0.5s • Nghịch (≥65): +20% sát thương, thành CẬN CHIẾN (tầm 1.8); mỗi 5s đòn đánh kế tiếp là cú Đột Kích lướt tới mục tiêu gây sát thương phép bộc phá.
- **S1 — Toàn Phong Quy** (hồi 7/6.5/6/5.5/5s): Lốc xoáy thẳng 7 đv (gió −17.5). Thuận: lốc lớn, cuối đường thành Vực Xoáy giữ chân 1.5s + sát thương liên tục • Bão Hòa: lướt nhẹ 1.5 đv, lốc bay nhanh hơn 40%, hất tung • Nghịch: Thanh Phong lướt theo lốc áp sát, chém bồi sát thương phép.
- **S2 — Bát Diện Phong Trận** (hồi 10/9.5/9/8.5/8s): Sóng gió 360° bán kính 3 (gió +17.5). Thuận: đẩy lùi 4 đv + Màng Chắn Gió 3s chặn 100% đạn đạo • Bão Hòa: lướt nhẹ 1.5 đv, kẻ bị đẩy đập vật cản / hết tầm đẩy thì choáng 1s • Nghịch: phóng lưỡi gió rồi dịch chuyển ra sau lưng tướng gần nhất đâm chí mạng ×1.5.
- **S3 — Mê Tung Phong Vực** (hồi 15/14/13/12/11s): Không đổi gió. Thuận: hút kẻ địch vào tâm, vùng gió độc 5.6 đv tồn tại 5s gây Mù + Câm lặng • Bão Hòa: lướt 4 đv và tàng hình 1.5s, để lại cơn lốc hất tung ở điểm cuối • Nghịch: lướt xa 6 đv gây sát thương trên đường, điểm cuối Thiên Lôi Phong giáng xuống bộc phá.
- **S4 — Cơn Gió Đưa Giấc** (hồi 120/100/80s): Vùng bão bán kính 4.5 tại điểm trong 9 đv suốt 5s: chậm 50%; đứng trong vùng quá 2s thì ngủ 1.5s; đòn đầu tiên đánh thức gây ×1.5.
- **Skill phụ — Nghịch Chuyển Canh Khí** (hồi 12s): Hồi 12s — làm mới ngay S1, S2, S3. Thuận → Nghịch: lốc từ trời giáng xuống kẻ địch gần nhất (sát thương lớn) + lướt tới trước • Bão Hòa: kích nổ khí áp đẩy lùi 2 đv + Thanh Tẩy mọi khống chế • Nghịch → Thuận: lướt lùi ra xa, ném lốc hất tung, nhận khiên bảo hộ.

### Theron (theron) — 🛡 Vệ Sĩ Thầm Lặng
- Cận chiến • vũ khí: spear • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 585 (+91), mana 300 (+38), công 61 (+3.7), giáp 31 (+4), KP 32 (+1.8), tốc đánh 0.66 (+2.2%), tốc chạy 3.5, tầm 2.3
- **Nội tại — Xuyên Phá:** Đòn đâm xuyên: kẻ địch phía sau mục tiêu trong tầm nhận 50%; 20% sát thương đánh thường là sát thương chuẩn.
- **S1 — Liên Hoàn Đâm** (hồi 6/5.5/5/4.5/4s, 40/40/40/40/40 mana): Đứng đâm 3 nhát thẳng 4.5 đv, mỗi nhát 35/50/65/80/95 (+40% SMVL).
- **S2 — Xung Phong** (hồi 12/11.5/11/10.5/10s, 60/60/60/60/60 mana): Lao 7 đv, ủi tướng đầu tiên chạm phải theo mình; ủi vào tường hoặc trụ thì choáng 1.5s, không thì hất tung 0.5s cuối đà.
- **S3 — Chống Thương Nhảy** (hồi 14/13/12/11/10s, 45/45/45/45/45 mana): Bật lên 1s không thể bị chọn (vẫn di chuyển chậm); hết giờ hoặc dùng lại thì dậm xuống làm chậm 40% kẻ địch quanh chân.
- **S4 — Mưa Thương** (hồi 120/100/80s, 100/100/100 mana): Gọi mưa thương xuống vùng bán kính 7 đv quanh điểm trong 8 đv suốt 3s: sát thương liên tục; trúng lần đầu thì trói chân 1s.
- **Skill phụ — Quét Chân** (hồi 12s, 30 mana): Quét thương tầm thấp 360° (bán kính 2.6): 35 (+7/cấp, +50% SMVL) sát thương, kẻ địch trúng chiêu bị NGÃ 0.5s (ngắt chiêu đang niệm).

### Tsukiyo (tsukiyo) — 🗡 Ám Sát
- Tầm xa • vũ khí: ninja • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 565 (+88), mana 100 (+10), công 62 (+3.8), giáp 27 (+3.7), KP 30 (+1.4), tốc đánh 0.7 (+2.6%), tốc chạy 3.55, tầm 5.5
- **Nội tại — Thích Ứng Cận – Viễn • Tam Đại Nhẫn Thuật • Nhẫn Đạo Toàn Giác:** Dùng Nội Năng (100 +10/cấp, tự hồi 10/giây) thay mana. Mục tiêu xa hơn 2 đv: ném phi tiêu; gần: song đao chém (+20%). Đòn đánh trúng tướng +8 Nội Năng; S1/S2 trúng tướng +15. Mỗi chiêu theo 1 trong 3 nhánh: Kỹ Thuật (phép, khống chế), Tất Sát (vật lý, dồn sát thương), Bí Thuật (tốc độ, phản đòn). Nhẫn Đạo: 120 Công Phép → phi tiêu thêm phép và hiệu ứng ngẫu nhiên, nhát chém gắn Dấu Ấn Hắc Ám; 90 Công Vật Lý thêm → ném 3 phi tiêu / chém 2 nhát (4s); 35% tốc đánh + tốc chạy thêm → né 1 đòn cận chiến và chém phản 1 đòn tầm xa (12s mỗi loại).
- **S1 — Nhẫn Thuật Nhất** (hồi —s, 50 mana): 🔮 Hỏa Cầu Chi Thuật: cầu lửa bay 7.5 đv, nổ bán kính 2.5 sát thương phép lớn + thiêu đốt 3s. ⚔ Loạn Vũ Phi Tiêu: +60% tốc đánh 5s, mỗi đòn ném thêm 2 phi tiêu tách góc; hết giờ xả loạt phi tiêu tìm diệt theo số đã ném. 🌪 Thuấn Trảm: lướt 4.5 đv chém trên đường, +35% tốc chạy 1.5s (tích 3 lần, hồi 1 lần mỗi 8s).
- **S2 — Nhẫn Thuật Nhị** (hồi 9/8.5/8/7.5/7s, 58 mana): 🔮 Mộc Độn – Bẫy Trói: lướt lùi 3.5 đv, đặt bẫy ở chỗ cũ (trói 1.5s + sát thương phép). ⚔ Tam Trọng Trảm Kích: 3 đòn đánh kế tiếp trong 5s — nhát 1 chậm 40%, nhát 2 phá 150 Hộ Giáp, nhát 3 chí mạng ×2. 🌪 Song Nhận Vô Ảnh: 2 nhát chém chữ X hình nón, toàn bộ là sát thương chuẩn.
- **S3 — Nhẫn Thuật Tam** (hồi 14/13/12/11/10s, 66 mana): 🔮 Tiên Cảnh Thế Thân: tập trung 2.5s — trúng đòn thì dịch chuyển 6 đv tới chỗ an toàn, để lại cành cây nổ khói độc làm mù. ⚔ Yên Mạc Dạ Hành: bom khói bán kính 3.5 trong 4s — địch bên trong bị mù, Tsukiyo tàng hình khi đứng trong khói. 🌪 Kiếm Thế Vạn Lưu Phản Pháo: đòn cận chiến đầu tiên bị phản choáng 1s; đòn tầm xa bị chém phản ngược kẻ bắn và giảm 70/75/80/85/90% sát thương — giữ thế tới khi không còn đạn bắn vào.
- **S4 — Nhẫn Thuật Tối Thượng** (hồi 90/75/60s, 100 mana): 🔮 Hắc Nguyệt Diệt Thế Cầu: cảnh báo bán kính 8; sau 2/1.5/1s quả cầu bóng tối nổ — sát thương phép cực lớn, choáng 1.5s, mù 3s. ⚔ Huyền Ảnh Ám Bộ: 5/6/8s +40% tốc chạy, mỗi đòn đánh gọi Hư Ảnh chém bồi 50%, mọi đòn làm chậm 30%. 🌪 Song Ảnh Xuất Trận: gọi 1/1/2 phân thân lao lên trước, thừa hưởng 50% chỉ số, tồn tại 12/16/20s.

### Valerius (valerius) — ⚔ Võ Sĩ Danh Dự
- Cận chiến • vũ khí: swordshield • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 640 (+98), mana 300 (+40), công 60 (+3.6), giáp 34 (+4.2), KP 32 (+2), tốc đánh 0.66 (+2%), tốc chạy 3.45, tầm 1.7
- **Nội tại — Công Thủ:** Giảm 6% sát thương nhận. Mỗi lần trúng đòn của tướng tích 1 Phản Kích (tối đa 3): đòn đánh kế tiếp +12 (+2/cấp) sát thương mỗi tầng.
- **S1 — Chém Vòng Cung** (hồi 7/6.5/6/5.5/5s, 40/40/40/40/40 mana): Chém hình quạt 130° trước mặt, làm chậm 20% trong 1s.
- **S2 — Đâm Thẳng** (hồi 9/8.5/8/7.5/7s, 50/50/50/50/50 mana): Đâm thẳng 5 đv; cộng 8% máu đã mất của mục tiêu.
- **S3 — Khiên Chắn** (hồi 14/13/12/11/10s, 60/60/60/60/60 mana): Giơ khiên 1s giảm 60% sát thương nhận; kết thúc bằng cú húc: choáng 0.75s + câm lặng 1s.
- **S4 — Chiến Thần Bất Tử** (hồi 110/95/80s, 100/100/100 mana): 4s máu không xuống dưới 1, +30% tốc chạy, +20% sát thương.
- **Skill phụ — Cuồng Phong** (hồi 10s, 30 mana): +45% tốc chạy trong 1.5s và chém một vòng quanh người (bán kính 2.4): 40 (+8/cấp, +40% SMVL) sát thương, làm chậm 30% trong 1.5s.

### Dr. Vector (vector) — 📐 Cầu Toàn
- Tầm xa • vũ khí: laser • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 555 (+86), mana 330 (+42), công 54 (+3.2), giáp 26 (+3.8), KP 30 (+1.3), tốc đánh 0.62 (+2.5%), tốc chạy 3.3, tầm 8
- **Nội tại — Laser Gun • Tính Toán Tuyệt Đối:** Đánh thường là tia laser bắn tức thời, xuyên mọi mục tiêu thẳng hàng (mục tiêu sau nhận 65%). Ổ 8 viên, cạn đạn nạp 1.8s. Sẵn 40% chí mạng, 20% xuyên giáp và 25% Xuyên Thủng Hộ Giáp.
- **S1 — Nạp Năng Lượng Tái Kích** (hồi 8/7.5/7/6.5/6s, 40/40/40/40/40 mana): Nạp đầy 8 viên ngay lập tức. 3 phát kế tiếp +35% sát thương, xuyên thấu không suy hao; phát thứ 3 chắc chắn chí mạng.
- **S2 — Radar Quét Tọa Độ** (hồi 13/12/11/10/9s, 50/50/50/50/50 mana): Giáp ảo 15% máu tối đa + 120 trong 3.5s, +30% tốc chạy 2.5s. Xung radar 16 đv: lộ mọi kẻ tàng hình 5s; ảo ảnh / phân thân địch trong vùng bị đóng băng 3s. Tầm đánh tăng lên 10/12/12/14/16 đv trong 5s.
- **S3 — Bom Từ Tính Khóa Trọng Lực** (hồi 11/10/9.5/9/8.5s, 55/55/55/55/55 mana): Ném lựu đạn từ tính 8 đv, nổ bán kính 2.5: sát thương vật lý, choáng 1s, nạn nhân nhận thêm 25/30/30/30/50% sát thương từ mọi nguồn 4s. Để lại vực từ trường 3s cấm lướt / dịch chuyển / dây móc.
- **S4 — Pháo Laser Quét Hư Không** (hồi 85/70/55s, 100/100/100 mana): Ghim chân tụ lực 0.6s rồi bắn chùm laser dài 16 đv rộng 2 đv xuyên địa hình: sát thương vật lý cực lớn (350/520/700 + 130% Công Vật Lý), bỏ qua 50% giáp, thiêu 300 Hộ Giáp. Mục tiêu dính Dấu Ấn Từ Tính: nổ thêm sát thương chuẩn và chậm 60% 2s.

### Vesper (vesper) — 👻 Thoát Xác
- Cận chiến • vũ khí: dagger • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 560 (+86), mana 300 (+36), công 64 (+4), giáp 27 (+3.6), KP 30 (+1.4), tốc đánh 0.78 (+3%), tốc chạy 3.65, tầm 1.35
- **Nội tại — Đâm Sau Lưng:** Đòn đánh và chiêu từ sau lưng mục tiêu +40% sát thương và câm lặng 0.75s (mỗi mục tiêu 1 lần mỗi 8s). Đòn Đánh Bất Ngờ: đòn đầu tiên khi đối thủ không thấy Vesper gây ×2 sát thương, gây độc rút máu và Khóa Họng (choáng 1s). Đánh thường là những nhát chém nhanh.
- **S1 — Phi Dao Ảnh Bộ** (hồi 9/8.5/8/7.5/7s, 45/45/45/45/45 mana): Ném dao độc 7/8/9/9/10 đv: sát thương vật lý, câm lặng 1/1/1/1.25/1.5s, độc và làm chậm 3/5/6/6/8s. Trúng thì trong 5s dùng lại để dịch chuyển ra sau lưng mục tiêu.
- **S2 — Xuyên Tâm** (hồi 8/7.5/7/6.5/6s, 40/40/40/40/40 mana): Lao 4/5/6/7/8 đv xuyên qua kẻ địch, chém mạnh mọi kẻ trên đường; trúng từ sau lưng gây thêm 50% sát thương và choáng 1s.
- **S3 — Ẩn Thân & Bóng Đêm Vĩnh Cửu** (hồi 16/15/14/13/12s, 60/60/60/60/60 mana): Tàng hình 2.5/5/10/10s (cấp tối đa: không giới hạn tới khi ra đòn), +40% tốc chạy; lộ khi tấn công hoặc đứng quá sát kẻ địch (2.5/2.5/2.5/2/1 đv). Nội tại: rời giao tranh 5s thì ngụy trang (chỉ lộ khi địch áp sát dưới 5 đv). Đòn đầu tiên khi đối thủ không thấy: choáng (Khóa Họng).
- **S4 — Bão Phi Đao Tuyệt Diệt** (hồi 100/85/70s, 100/100/100 mana): Phóng 10/20/40 phi dao bao trùm bán kính 6/8/10 đv, Vesper tàng hình 5s. Dùng lại: dịch chuyển ra sau lưng tướng địch thấp máu nhất bị trúng dao. Cấp tối đa: đánh dấu mọi mục tiêu trúng dao, Hư Ảnh lao tới đâm xuyên từng kẻ. Đòn Trảm Quyết: đòn đánh kế tiếp trong 3s gây ×2 (×3 nếu mục tiêu dưới 50% máu). Tung khi chưa bị phát hiện: bỏ qua 50% giáp và 100% Hộ Giáp, đánh mạnh hơn lên nạn nhân dưới 25% máu.

### Victoria (victoria) — 🦅 Kền Kền
- Cận chiến • vũ khí: flag • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 630 (+96), mana 380 (+45), công 60 (+3.6), giáp 32 (+3.9), KP 30 (+1.5), tốc đánh 0.62 (+1.5%), tốc chạy 3.35, tầm 2.4
- **Nội tại — Quân Lệnh & Cờ Chiến:** 3 Lính Tinh Nhuệ hộ vệ và chiến đấu cùng Victoria (chết thì 30s sau hồi sinh). Ưu tiên thế Cờ: Victoria và lính đánh cận chiến càn lướt, lính +25% tốc chạy và kháng khống chế. Hào quang (đồng minh trong 6 đv): 🚩 Cờ +12% tốc chạy, −25% thời gian bị khống chế • 🔥 AR +10% sát thương • 🔫 Lục +giáp/kháng phép.
- **S1 — Hỏa Lực Theo Dạng** (hồi 6/5.5/5/4.5/4s, 40/40/40/40/40 mana): 🔫 Lục: 1 phát súng lục mạnh • 🔥 AR: loạt 5 viên hình nón • 🚩 Cờ: quét cờ hình vành khuyên (1.5–3.5 đv) làm chậm 30%.
- **S2 — Thiết Lập Thế Trận** (hồi 12/11.5/11/10.5/10s, 60/60/60/60/60 mana): 🔫 Lục: lướt 3 đv + lá chắn • 🔥 AR: lựu đạn bán kính 2 đẩy lùi • 🚩 Cờ: cắm cờ trong 6 đv — đẩy lùi 1.5 đv và choáng 0.75s, tạo Vùng Đất Quân Lệnh 5s (đồng minh bên trong +15% tốc đánh).
- **S3 — Tổng Lực Tác Chiến** (hồi 16/15/14/13/12s, 70/70/70/70/70 mana): 🔫 Lục: pháo điện từ rơi sau 2s, bán kính 3, choáng 1s • 🔥 AR: bão lửa bán kính 3 trong 3s • 🚩 Cờ: lính xung phong vào mục tiêu, mỗi lính choáng 0.5s.
- **S4 — Mệnh Lệnh Tuyệt Đối** (hồi 120/100/80s, 100/100/100 mana): Hồi sinh toàn bộ lính; 8s lính hóa Thiết Binh (gấp đôi máu và sát thương); tên lửa nã tướng địch thấp máu nhất trong tầm nhìn (15 đv) mỗi 2s.
- **Skill phụ — Chuyển Đổi Quân Lệnh** (hồi 4s): Xoay Cờ → AR → Lục. Ưu tiên thế Cờ càn lướt cận chiến: gọi pháo kích • Sang AR: ném flash làm mù 1s • Sang Lục: lướt 2.5 đv + lá chắn.

### Wukong (wukong) — 🃏 Quấy Nhiễu
- Cận chiến • vũ khí: pole • tài nguyên: không dùng mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 615 (+97), mana 0 (+0), công 65 (+3.9), giáp 31 (+4), KP 32 (+1.8), tốc đánh 0.68 (+2.4%), tốc chạy 3.55, tầm 2
- **Nội tại — Côn Thức Vũ:** Côn Thức (0–100) tích khi đánh trúng (+6), bị tướng đánh (+4), chiêu trúng tướng (+8). Đủ 50: chiêu kế tiếp được cường hóa; đủ 100: cường hóa tối đa. Chiêu cường hóa gắn Khí Ấn lên tướng trúng (tối đa 2, 4s).
- **S1 — Toàn Phong Côn** (hồi 7/6.5/6/5.5/5s): Xoay côn 0.5s quanh người (2 nhịp), gạt đạn nhỏ bay tới. Cường hóa: hút kẻ địch vào tâm.
- **S2 — Trực Thích** (hồi 9/8.5/8/7.5/7s): Thúc côn thẳng 4 đv, đẩy lùi kẻ trúng đầu tiên 2 đv. Cường hóa: dài gấp đôi và xuyên qua mọi kẻ địch.
- **S3 — Kình Thiên Trụ** (hồi 14/13/12/11/10s): Chống gậy bật lên không thể bị chọn 0.8s; trong lúc trên không TỰ CHỌN điểm đáp bất kỳ trong vùng 5 đv quanh chỗ chống gậy (bám theo kẻ địch đang né), 0.3s trước khi bổ xuống mới lộ điểm đáp: hất tung 0.75s bán kính 2.5. Cường hóa: gồng thêm, choáng 1s (tối đa 1.5s) bán kính 3.5.
- **S4 — Đại Thánh Hàng Thế** (hồi 120/100/85s): Sóng côn 360° đẩy lùi 2.5 đv bán kính 3.5; 6s không thể cản phá, +30% tốc chạy, Toàn Phong Côn và Trực Thích tự cường hóa.
- **Skill phụ — Định Thân Thuật** (hồi 20s): Chỉ dùng được lên tướng địch trong 5 đv đang có 2 Khí Ấn: hóa đá 1.5s.

### Zero (zero) — 📐 Cầu Toàn
- Tầm xa • vũ khí: pistol • tài nguyên: mana • sát thương chính: vật lý
- Chỉ số cấp 1: máu 560 (+88), mana 320 (+40), công 71 (+4.2), giáp 26 (+3.8), KP 30 (+1.3), tốc đánh 0.68 (+2.8%), tốc chạy 3.3, tầm 6.2
- **Nội tại — Vũ Trang Hiện Đại:** Đánh thường dùng băng 9 viên; hết đạn phải nạp 1.6s. Đạn mạnh.
- **S1 — Khóa Mục Tiêu** (hồi 10/9.5/9/8.5/8s, 30/30/30/30/30 mana): Đánh dấu một tướng trong 9 đv trong 6s: +10% sát thương đánh thường lên nó và lộ hình. Bắn trúng 5 lần thì S3 kế tiếp được cường hóa.
- **S2 — Xả Băng** (hồi 9/8.5/8/7.5/7s, 50/50/50/50/50 mana): Xả toàn bộ đạn còn lại thật nhanh vào mục tiêu (mỗi viên 80% sát thương đánh thường), rồi nạp đạn.
- **S3 — Nhảy Lùi** (hồi 12/11/10/9/8s, 40/40/40/40/40 mana): Nhảy lùi 3 đv, giảm 25% sát thương nhận 1s. Cường hóa: lướt 5 đv tức thì và nạp đầy đạn.
- **S4 — Băng Đạn Nổ** (hồi 90/75/60s, 100/100/100 mana): Nạp ngay băng đạn nổ trong 8s: +30% tốc đánh, đạn mạnh hơn 30/40/50% và nổ lan bán kính 1.5 (50%).

## 17. Cây tiến hóa
- Mở nhánh ở cấp 1/3/6/9/12, mỗi mốc 1 trong 3 (a/b/c); AI tự chọn (ngẫu nhiên theo hạt giống trận).
- **Rực Rỡ** (GĐ8, cần Ý Niệm Rực Rỡ): cấp 15 lấy thêm 1 lựa chọn chưa chọn ở mốc 3/6/9; cấp 18 lấy thêm 1 lựa chọn mốc 12 hoặc **Tối Thượng Nộ** (Chiêu cuối hồi nhanh hơn 35%.) / **Thần Lực** (+20% Công Vật Lý và Công Phép.).
- **Alice**: 1: a. Khán Giả Cuồng Nhiệt / b. Phi Dao Sắc Lẹm / c. Ảo Ảnh Bền Bỉ • 3: a. Bẫy Hoa Lửa / b. Khói Ảo Thuật / c. Vô Ảnh Thần Bộ • 6: a. Phi Dao Hoán Vị / b. Chim Bồ Câu Quấy Nhiễu / c. Ảo Ảnh Phản Kích • 9: a. Đại Ảo Thuật Gia / b. Náo Nhiệt Vô Tận / c. Ảo Ảnh Chân Thực • 12: a. Bậc Thầy Phân Thân / b. Chiếc Hộp Biến Mất / c. Nụ Cười Gã Hề
- **Aria & Oktava**: 1: a. Âm Vang Tái Sinh / b. Nhịp Điệu Đồng Vọng / c. Thanh Âm Lan Tỏa • 3: a. Mê Muội Vực Sâu / b. Trùng Kích Đoạt Hồn / c. Hộ Mệnh Chữa Lành • 6: a. Nhập Thể Âm Vang / b. Sóng Phản Xạ / c. Vọng Âm Cộng Hưởng • 9: a. Khúc Khải Hoàn / b. Cộng Hưởng Tuyệt Đối / c. Bản Hòa Âm Tối Thượng • 12: a. Khúc Ca Ru Ngủ / b. Đổi Chỗ Tức Thời / c. Song Tấu Độc Lập
- **Ariston**: 1: a. Đức Tin Kiên Cố / b. Bản Đao Nặng Trịch / c. Kỷ Luật Tu Sĩ • 3: a. Thiết Trảm Chấn Động / b. Thế Thủ Phản Kích / c. Lời Nguyện Lan Tỏa • 6: a. Hộ Vệ Thánh Khôi / b. Đao Khí Xuyên Tường / c. Tẩy Trần Triệt Để • 9: a. Phán Quyết Nhân Từ / b. Đức Tin Bất Tận / c. Thánh Quang Xuyên Giáp • 12: a. Phán Quan Cuồng Tín / b. Pháo Đài Bất Hoại / c. Thánh Khí Ngàn Cân
- **Bạch Diệp**: 1: a. Tụ Kiếm Thần Tốc / b. Loạn Trảm Tiết Kiệm / c. Kiếm Khí Tầm Xa • 3: a. Mưa Kiếm Liên Hoàn / b. Kiếm Trận Trọng Lực / c. Hộ Pháp Bộc Phá • 6: a. Kiếm Khí Bất Tận / b. Loạn Trảm Xuyên Giáp / c. Hấp Năng Kiếm Trận • 9: a. Kiếm Ý Bất Diệt / b. Lục Tinh Cực Hạn / c. Phong Ấn Đoạt Hồn • 12: a. Vô Tận Kiếm Hải / b. Vạn Kiếm Quy Tông / c. Đại Sư Huynh Rotava
- **Boran**: 1: a. Săn Mồi Đói Khát / b. Rìu Cắt Gió / c. Băng Thể Tráng Kiện • 3: a. Lưỡi Rìu Mở Rộng / b. Băng Gai Ghìm Chân / c. Nộ Khí Dâng Trào • 6: a. Xuyên Thủng Tàn Bạo / b. Băng Khôi Tái Tạo / c. Đồ Tể Nhịp Nhanh • 9: a. Cắt Đứt Tẩu Thoát / b. Trái Tim Băng Hà / c. Khát Máu Vô Tận • 12: a. Cỗ Máy Xay Thịt / b. Cổ Ma Bất Tử / c. Thân Băng Ngàn Năm
- **Borg**: 1: a. Kích Động / b. Cơ Bắp Thép / c. Móc Nhanh • 3: a. Hấp Thụ Triệt Để / b. Quật Ngã Tàn Bạo / c. Cú Đấm Nhiệt Lượng • 6: a. Cú Ném Tử Thần / b. Đập Nện Mặt Sàn / c. Kích Nổ Adrenaline • 9: a. Đấu Trường Bất Bại / b. Cú Đấm Ngàn Cân / c. Nổi Điên • 12: a. Cú Húc Xuyên Giáp / b. Đấu Sĩ Khát Máu / c. Võ Đài Vĩnh Cửu
- **Chrono & Neo**: 1: a. Cò Súng Đôi / b. Hồi Nhịp Nhanh / c. Lướt Xuyên Không • 3: a. Nhiệt Hỏa Quá Khứ / b. Nghịch Ảnh Tương Lai / c. Đẩy Nhanh Chu Kỳ • 6: a. Vụ Nổ Quá Khứ / b. Hoán Đổi Ảo Ảnh / c. Đồng Hồ Cát Đồng Bộ • 9: a. Thời Gian Tự Do / b. Nghịch Lý Sinh Tồn / c. Cỗ Xe Tăng Thời Gian • 12: a. Giao Thoa Không Gian / b. Nghịch Lý Thời Gian / c. Vòng Lặp Vĩnh Cửu
- **Clint**: 1: a. Cò Kép Nhanh / b. Báng Súng Thép / c. Phản Lực Nhảy • 3: a. Dập Lửa Dưới Chân / b. Vỏ Đạn Gây Mù / c. Nạp Kép Cận Chiến • 6: a. Đoạt Mệnh Cận Chiến / b. Dậm Gót Tử Thần / c. Hạt Chì Nặng • 9: a. Dragon's Breath Bất Tận / b. Băng Ba Viên / c. Điểm Hỏa Khắc Tinh • 12: a. Đạn Xuyên Phá Cỡ Lớn / b. Thợ Săn Bất Tử / c. Băng Đạn Vô Tận
- **Dahlia**: 1: a. Khán Giả Quái Vật / b. Gậy Phép Tốc Độ / c. Bồ Câu Lướt Gió • 3: a. Độc Khí Tê Liệt / b. Chiếc Mũ Gia Cố / c. Tia Sáng Liên Hoàn • 6: a. Đại Đội Ảo Ảnh / b. Màn Ảo Thuật Phá Giáp / c. Thoát Nguy Tầm Xa • 9: a. Cuồng Nhiệt Vô Tận / b. Ảo Ảnh Đao Phong / c. Sân Khấu Kéo Dài • 12: a. Vua Bầy Ảo Ảnh / b. Ảo Thuật Gia Bất Tử / c. Đệ Tử Cống Ngầm
- **Death**: 1: a. Lưỡi Tử Thần / b. Mùi Máu Tươi / c. Gặt Nhanh • 3: a. Xoáy Hút Linh Hồn / b. Lưỡi Kéo Tàn Phế / c. Cắt Đứt Hy Vọng • 6: a. Lưỡi Trảm Đoạt Hồn / b. Thu Hồi Lưỡi Hái / c. Hơi Thở Tử Thần • 9: a. Án Tử Tức Thì / b. Tam Vị Nhất Thể / c. Thu Hoạch Linh Hồn • 12: a. Trảm Quyết Diện Rộng / b. Sứ Giả Địa Ngục / c. Hộ Thân Oan Hồn
- **Diệp Thanh Phong**: 1: a. Khí Lưu Thuận Chiều / b. Cắt Gió Tàn Bạo / c. Phong Hộ Tái Sinh • 3: a. Phong Độc Hôn Mê / b. Kình Phong Xuyên Thấu / c. Bão Thuẫn Phản Hồi • 6: a. Lốc Xoáy Kép / b. Phiến Khí Bát Đoạn / c. Hơi Thở Của Gió • 9: a. Giấc Mộng Không Đáy / b. Lướt Gió Vô Hạn / c. Tâm Bão Bất Khả Xâm Phạm • 12: a. Tuyệt Ảnh Ám Sát / b. Long Quyển Phong Bạo / c. Lời Ru Vĩnh Cửu
- **Dr. Caelus**: 1: a. Thu Thập Dữ Liệu / b. Bước Nhảy Không Gian / c. Máy Quét Rác Thải • 3: a. Lưới Điện Cường Hóa / b. Tia Laser Phản Xạ / c. Gia Cố Hộ Giáp • 6: a. Khóa Nghịch Đảo / b. Phân Tích Điểm Yếu / c. Tường Lửa Lượng Tử • 9: a. Laser Bào Mòn / b. Dữ Liệu Vòng Bo / c. Khởi Động Lại Hệ Thống • 12: a. Kiến Trúc Sư Tuyệt Đối / b. Vòng Lặp Vô Tận / c. Tối Ưu Năng Lượng
- **Dr. Vector**: 1: a. Tụ Quang Thần Tốc / b. Chí Mạng Tuyệt Đối / c. Gia Tốc Radar • 3: a. Vực Từ Mở Rộng / b. Xung Điện Phản Hồi / c. Tia Laser Tăng Cường • 6: a. Triệt Tiêu Phân Thân / b. Xuyên Thấu Hoàn Hảo / c. Laser Hút Năng Lượng • 9: a. Hyper-Beam Thần Tốc / b. Đầu Đạn Lượng Tử / c. Khóa Cứng Từ Tính • 12: a. Giám Sát Tuyệt Đối / b. Pháo Đài Siêu Cự Ly / c. Kỹ Sư Viện Hàn Lâm
- **Elara**: 1: a. Bộ Pháp Tinh Linh / b. Ưng Nhãn / c. Liên Xạ Thần Tốc • 3: a. Băng Vĩnh Cửu / b. Mũi Tên Xuyên Phá / c. Thuận Phong • 6: a. Mưa Băng Rải Thảm / b. Tiễn Trùng Khí / c. Cung Pháp Du Mục • 9: a. Tập Trung Tuyệt Đối / b. Băng Phong Toàn Vực / c. Cung Thủ Tối Thượng • 12: a. Mũi Tên Hư Không / b. Cung Thủ Thần Tốc / c. Cảm Ứng Rừng Già
- **Florian**: 1: a. Vũ Bước / b. Điệu Nhảy Chuẩn Xác / c. Khai Màn Thanh Lịch • 3: a. Hư Ảnh Trùng Điệp / b. Tử Huyệt / c. Điệu Nhạc Bất Tử • 6: a. Đột Kích Hồi Mã / b. Vũ Điệu Lốc Xoáy / c. Nhịp Điệu Hoàn Hảo • 9: a. Cao Trào Sân Khấu / b. Phản Đòn Hoàn Mỹ / c. Vũ Điệu Tử Thần • 12: a. Sân Khấu Tử Thần / b. Song Kiếm Quý Tộc / c. Khúc Cao Trào Cuối Cùng
- **Galo**: 1: a. Độc Ăn Da / b. Thú Tính Bền Bỉ / c. Bước Chân Hóa Chất • 3: a. Sương Độc Thần Kinh / b. Hàm Răng Bạo Lực / c. Giảm Sốc Độc Tố • 6: a. Quăng Quật / b. Phun Axit / c. Hấp Thu Độc Chất • 9: a. Axit Hóa Lỏng Xương / b. Tiếng Rống Tận Diệt / c. Bản Năng Bất Tử • 12: a. Chimera Bất Hoại / b. Nổ Axit Hạt Nhân / c. Cuồng Huyết Độc Dược
- **Gideon**: 1: a. Mũi Kiếm Chuẩn Xác / b. Khúc Trọng Lực / c. Thiết Thân • 3: a. Trói Đinh Ngàn Cân / b. Húc Văng Cán Kiếm / c. Kiên Cố Tuyệt Đối • 6: a. Địa Chấn Bộc Phá / b. Khiên Kiếm Đỡ Gạt / c. Thế Nặng Ngàn Cân • 9: a. Trảm Khí Khai Thiên / b. Đại Địa Chấn / c. Chém Gãy Thần Binh • 12: a. Cự Kiếm Xung Trận / b. Trấn Áp Vực Thẳm / c. Kiếm Đế Cuồng Nộ
- **Ignatius**: 1: a. Hỏa Tốc / b. Thiêu Rụi / c. Bộ Pháp Chớp Nhoáng • 3: a. Biển Lửa Giam Cầm / b. Hư Ảnh Cháy Bùng / c. Đại Hỏa Cầu Phá Đạn • 6: a. Tường Lửa Chắn Lối / b. Kích Nổ Cầu Lửa / c. Hỏa Hồn Bùng Cháy • 9: a. Hỏa Ngục Bất Diệt / b. Thiên Thạch Tận Thế / c. Tia Lửa Ma Thuật • 12: a. Hố Đen Tro Tàn / b. Pháp Sư Trọng Lực / c. Phượng Hoàng Tái Sinh
- **Jack "Sáu Lỗ"**: 1: a. Tay Cờ Bạc Chuyên Nghiệp / b. Thay Đạn Nhanh / c. Đạn Nặng • 3: a. Tăng Tỷ Lệ Nhà Cái / b. Xả Hết Vốn / c. Thần May Mắn Hộ Mệnh • 6: a. Nạp Đạn Liều Lĩnh / b. Bắn Nhanh / c. Tẩy Bài Cờ Bạc • 9: a. Viên Đạn Sinh Tử / b. Ván Bài Lật Ngửa / c. Tất Tay • 12: a. Cược Tất Tay / b. Thần Bạc Gian Lận / c. Mạng Thứ Hai
- **Joker**: 1: a. Tay Nhanh Hơn Mắt / b. Trộm Vặt / c. Nhà Cái Kiếm Tiền • 3: a. Bích Độc Đao / b. Tép Ngạt Khí / c. Lừa Tình Tuyệt Đỉnh • 6: a. Vui Thôi Nào! / b. Phi Ba Lá / c. Bài Ảo Đánh Lạc Hướng • 9: a. Đạo Tặc Thần Tốc / b. Bàn Tay Điêu Luyện / c. Bộ Bài Vô Tận • 12: a. Thần Bài Gian Lận / b. Gian Lận Tối Thượng / c. Ván Cược Sinh Tử
- **Justus**: 1: a. Tâm Niệm Thuần Khiết / b. Ý Chí Cương Nhu / c. Đòn Đánh Cổ Ngữ • 3: a. Kiếm Thánh Rơi Nhanh / b. Hộ Thể Cường Hóa / c. Quang Trận Tiếp Tốc • 6: a. Tia Laser Xuyên Thấu / b. Hộ Vệ Bất Khuất / c. Lời Cầu Nguyện Vô Tận • 9: a. Đức Tin Bất Hoại / b. Hộ Vệ Hồi Sinh / c. Trận Địa Giam Cầm • 12: a. Giáo Hoàng Thánh Đình / b. Vô Tận Hộ Thần / c. Giáo Lý Vững Bền
- **Kazuki**: 1: a. Tĩnh Tâm / b. Kéo Dài Nhịp / c. Kiếm Phong • 3: a. Phá Giáp Xung Kích / b. Huyết Trảm / c. Thấu Thị • 6: a. Trảm Khí Nghịch Chuyển / b. Vạn Kiếm Quy Nhất / c. Đoạt Mệnh Trảm Đạn • 9: a. Kiếm Vực Giam Cầm / b. Bất Diệt Ý Niệm / c. Bát Hướng Phân Thân • 12: a. Tuyệt Kỹ Iaido / b. Trảm Đoạn Thời Không / c. Đạo Kiếm Hợp Nhất
- **Kip**: 1: a. Bước Chân Hư Ảo / b. Thấu Thị Không Gian / c. Gia Tốc Dây Móc • 3: a. Cắt Gió Đa Tầng / b. Nuốt Đạn Phản Hồi / c. Lướt Xuyên Tường Dày • 6: a. Đột Kích Điểm Mù / b. Không Gian Nén / c. Vết Nứt Nổ Chậm • 9: a. Trôi Dạt Vô Đích / b. Vết Cắt Xuyên Tủy / c. Cổng Dịch Chuyển • 12: a. Sát Thủ Vô Ảnh / b. Nghịch Đảo Trọng Trường / c. Khe Nứt Bất Tận
- **Koda**: 1: a. Bản Năng Leo Trèo / b. Móng Vuốt Sắc Bén / c. Cào Cuồng Bạo • 3: a. Vồ Mồi Từ Trên Cao / b. Đứt Gân Toàn Phần / c. Vết Cắn Truy Lùng • 6: a. Cắn Xé Cuồng Loạn / b. Vuốt Quét 360 / c. Đánh Hơi Con Mồi • 9: a. Thú Tính Bất Diệt / b. Cơn Đói Khát Máu / c. Xé Toạc Sinh Mệnh • 12: a. Độn Thổ Rình Rập / b. Sói Đầu Đàn / c. Hộ Chủ Cuồng Bạo
- **Luca**: 1: a. Khán Giả Cuồng Nhiệt / b. Vạt Áo Trơn Trượt / c. Hương Hoa Gai Góc • 3: a. Ánh Đèn Chói Mắt / b. Hoa Hồng Vĩnh Cửu / c. Vũ Điệu Bão Tố • 6: a. Sân Khấu Mở Rộng / b. Lật Tẩy Bất Ngờ / c. Nghệ Sĩ Đào Thoát • 9: a. Ảo Thuật Hoàn Hảo / b. Hoán Vị Nổ Tung / c. Vỗ Tay Không Dứt • 12: a. Thiên Tài Đạo Diễn / b. Sân Khấu Tử Thần / c. Ngôi Sao Đường Phố
- **Lyra**: 1: a. Chuột Bụi Thủy Tộc / b. Bong Bóng Bật Nảy / c. Bọt Tốc Hành • 3: a. Bọt Khí Chắn Lối / b. Mạch Nước Ngầm / c. Triều Cường Cắt Góc • 6: a. Ẩn Ngư Dưới Cát / b. Sóng Thần Xuyên Phá / c. Thủy Giáp Phản Hồi • 9: a. Thủy Thuẫn Niệm Chú / b. Quần Thể Thủy Trụ / c. Vực Xoáy Tử Địa • 12: a. Đại Dương Bao La / b. Vua Bụi Rậm Biển Sâu / c. Nước Mắt Nữ Thần
- **Mirage**: 1: a. Tự Nhiên Thăng Hoa / b. Phi Dao Tầm Xa / c. Ảo Ảnh Rắn Rỏi • 3: a. Hoán Vị Câm Lặng / b. Hộp Nổ Kép / c. Tàn Ảnh Rộng Mở • 6: a. Ảo Ảnh Đao Phong / b. Thoát Hiểm Kép / c. Dấu Ấn Xuyên Thấu • 9: a. Vụ Nổ Phân Thân Hủy Diệt / b. Hoán Vị Không Giới Hạn / c. Ảo Ấn Tử Thần • 12: a. Ảo Mộng Tuyệt Đối / b. Ván Cược Cứu Rỗi / c. Sân Khấu Vĩnh Hằng
- **Olivia**: 1: a. Đức Tin Dồi Dào / b. Thánh Ý Cường Hóa / c. Cầu Nguyện Thanh Tịnh • 3: a. Dây Dẫn Tăng Tốc / b. Thánh Giáp Kháng Bộc Phá / c. Thánh Niệm Xuyên Thấu • 6: a. Thánh Trận Cự Ly Xa / b. Thanh Trừng Triệt Để / c. Khúc Cầu Nguyện Vội Vã • 9: a. Thánh Linh Bất Diệt / b. Thánh Lễ Cuồng Tín / c. Dây Trói Thần Phạt • 12: a. Đại Nữ Tu Tối Cao / b. Cứu Rỗi Tuyệt Đối / c. Ánh Sáng Bền Bỉ
- **Percy**: 1: a. Bộ Đếm Tinh Vi / b. Tầm Bắn Thần Tốc / c. Cơ Động Lách Trận • 3: a. Dây Cáp Điện Cao Thế / b. Ụ Súng Gia Cố / c. Mũi Tên Gỉ Sét • 6: a. Phát Bắn Bùng Nổ / b. Lưới Điện Trói Buộc / c. Hộp Đạn Dự Trữ • 9: a. Bão Tên Vô Hạn / b. Móc Kép Tinh Xảo / c. Công Nghệ Áp Chế • 12: a. Drone Phòng Vệ / b. Đạn Xuyên Phá / c. Pháo Thủ Biến Hóa
- **Ratok**: 1: a. Khí Áp Cống Ngầm / b. Bảo Hộ Gai Góc / c. Bước Chân Thợ Săn • 3: a. Xích Nặng / b. Dư Chấn Quét Sàn / c. Đập Phá Liên Hoàn • 6: a. Khiên Bộc Phá / b. Thịt Dày / c. Xuyên Đột • 9: a. Móc Đoạt Mệnh / b. Vực Sâu Sụp Đổ / c. Bền Bỉ Vô Song • 12: a. Đao Phủ Bắt Lẻ / b. Cỗ Máy Mở Giao Tranh / c. Xích Neo Ngàn Cân
- **Raven**: 1: a. Nạp Đạn Nhanh / b. Khói Dày / c. Đạn Sơ Tốc Cao • 3: a. Cắt Gân Tầm Xa / b. Khói Độc Thần Kinh / c. Oca Vũ Trang • 6: a. Phát Bắn Bồi / b. Dây Đu Thoát Hiểm / c. Đạn Hợp Kim Titan • 9: a. Kẻ Đi Săn Vô Hình / b. Băng Đạn Mở Rộng / c. Mắt Quạ Tử Thần • 12: a. Thiện Xạ Độc Hành / b. Oca Tự Sát / c. Vọng Âm Đêm Tối
- **Roxie & T-Zero**: 1: a. Từ Tính / b. Lắp Ráp Nhanh / c. Phản Pháo • 3: a. Vết Dầu Loang / b. Gia Cố Khung Gầm / c. Xung Điện Cao Áp • 6: a. Giáp Phản Lực / b. Bệ Phóng Lò Xo / c. Từ Trường Thu Gom • 9: a. Lõi Quá Tải / b. Tự Động Hóa Tối Tân / c. Cơ Giới Thần Tốc • 12: a. Thiết Vệ Pháo Đài / b. Vòng Xoáy Lửa / c. Cyborg Tự Thân
- **Ryoma**: 1: a. Lưu Thủy / b. Khai Kiếm / c. Thấu Kính • 3: a. Hư Ảnh Trùng Kích / b. Trảm Khí Xuyên Giác / c. Chấn Xung Lực • 6: a. Thuật Thế Thân / b. Ngược Gió Chém Sát / c. Đao Phách Vô Tận • 9: a. Tâm Kiếm Độc Tôn / b. Nhất Kiếm Định Âm / c. Kiếm Vô Tận • 12: a. Tam Trọng Trảm Khí / b. Kiếm Cư Hợp (Iaido) / c. Tâm Kiếm Hợp Nhất
- **Theron**: 1: a. Kình Lực Mũi Thương / b. Bật Nhảy Kỷ Luật / c. Quét Trụ • 3: a. Đâm Ghim Vỡ Giáp / b. Ngã Rạp Chiến Trường / c. Chấn Động Mặt Đất • 6: a. Hất Tung Phá Trận / b. Giáo Ném Không Trung / c. Khiên Chắn Sparta • 9: a. Trận Địa Mưa Thương / b. Mũi Giáo Tử Thần / c. Spartan Bất Diệt • 12: a. Đâm Xuyên Vạn Quân / b. Đấu Sĩ Phalanx / c. Kỷ Luật Bất Khả Xâm Phạm
- **Tsukiyo**: 1: a. Nội Năng Tuôn Trào / b. Ám Tiêu Tốc Độ / c. Nhẫn Bộ Vô Hình • 3: a. Tâm Pháp Toàn Năng / b. Hỏa Cầu Lan Tỏa / c. Kiếm Thế Phản Lực • 6: a. Thế Thân Đoạt Mệnh / b. Thuấn Trảm Tứ Đoạn / c. Tam Trọng Bộc Phá • 9: a. Ám Nguyệt Thuấn Niệm / b. Phân Thân Thần Phục / c. Hư Ảnh Trảm Vũ • 12: a. Vô Song Nhẫn Hoàng / b. Bất Diệt Kiếm Vũ / c. Huyền Thiết Ám Bộ
- **Valerius**: 1: a. Trụ Vững / b. Phản Xạ Binh Nghiệp / c. Xung Kích • 3: a. Khiên Gai / b. Chấn Địa / c. Giáp Bất Diệt • 6: a. Khiên Húc Phá Trận / b. Khiên Phản Kích / c. Hộ Vệ Bất Bại • 9: a. Bất Khuất / b. Chiến Ý Hoàng Gia / c. Áp Chế Tuyệt Đối • 12: a. Địa Chấn Khiên Binh / b. Đấu Sĩ Trảm Sát / c. Ý Chí Bất Diệt
- **Vesper**: 1: a. Bộ Pháp Vô Hình / b. Độc Ăn Mòn / c. Đoản Đao • 3: a. Tử Huyệt Sau Lưng / b. Ám Kích Chớp Nhoáng / c. Bóng Ma Mất Dấu • 6: a. Lướt Xiên Bóng Đêm / b. Đổi Hướng Đột Kích / c. Bước Đi Không Vết • 9: a. Bão Dao Đoạt Mệnh / b. Sát Thủ Hoàn Hảo / c. Thế Thân • 12: a. Ảo Ảnh Phân Thân / b. Độc Sát Chuyên Nghiệp / c. Lưỡi Dao Đoạt Mạng
- **Victoria**: 1: a. Tiếp Viện Khẩn Cấp / b. Giáp Chống Bạo Động / c. Flash Cường Quang • 3: a. Lưới Đạn AR / b. Lá Chắn Thị Vệ / c. Cờ Khải Hoàn • 6: a. Thu Hồi Cờ Lệnh / b. Đạn Phá Giáp / c. Bọc Lót Chiến Thuật • 9: a. Trận Địa Donut Tử Thần / b. Pháo Điện Từ Xuyên Âm / c. Quân Đội Thép • 12: a. Bậc Thầy Chỉ Huy / b. Pháo Đài Di Động / c. Kỷ Luật Sắt
- **Wukong**: 1: a. Côn Pháp Nhập Môn / b. Thân Pháp Khỉ Đột / c. Sải Côn Dài • 3: a. Phong Áp Cản Đạn / b. Rung Chấn Địa Tầng / c. Thúc Gãy Xương • 6: a. Hoành Tảo Đoạt Mệnh / b. Hộ Thân Kim Cang / c. Đẩu Vân Đạp Tuyết • 9: a. Côn Khí Tự Sinh / b. Định Thân Lan Tỏa / c. Cột Trụ Trời Chấn Động • 12: a. Phân Thân Hầu Vương / b. Vạn Trượng Kim Bổng / c. Kim Cang Bất Hoại
- **Zero**: 1: a. Thay Đạn Chiến Thuật / b. Giáp Phản Phản Ứng / c. Đạn Gia Tốc • 3: a. Khóa Họng Súng / b. Viên Đạn Áp Chế / c. Khói Ngụy Trang • 6: a. Đạn Chùm Càn Quét / b. Kích Nổ Dấu Ấn / c. Phản Xạ Điệp Viên • 9: a. Băng Đạn Hủy Diệt / b. Nạp Đạn Thần Tốc / c. Xuyên Giáp Quân Dụng • 12: a. Dịch Chuyển Ám Sát / b. Hỏa Lực Tuyệt Mật / c. Triệt Tiêu Hoàn Toàn

## 19. Nhà cái & đặt cược (GĐ9b — vòng chơi chính)
- **Ván (run)**: bắt đầu với 1000 tiền; 3 chặng × 6 trận; hết chặng phải **có** 1500 / 2500 / 4000 tiền (thiếu → vỡ nợ, thua ván); chặng cuối trả hết nợ (4000 + mọi khoản vay) → tự do; nhưng nếu nhà cái bực ≥ 8 thì phải qua **trận của nhà cái** (đủ 4 người của hắn trong trận, kết thúc trận phải còn ≥ 2500 tiền).
- **Tỷ lệ**: xác suất gốc từ thống kê mô phỏng (src/data/odds.js — tools/tyle.js: Top 1 = (số lần vô địch + 1) / (số trận + 10), chuẩn hóa trong dàn 10 tướng); tỷ lệ trả = (1 − phần nhà cái) / xác suất, làm tròn 0.05, trong khoảng ×1.05–×30. Phần nhà cái = 8% + 1.5% × mức bực bội + 10% khi dính "Món Quà Nhỏ" + 5% trong 60s sau một lần can thiệp. "Sống tới cuối" tính xác suất ×1.12 (đồng hạng vẫn thắng) nên tỷ lệ thấp hơn "Top 1".
- **Nhà cái nói dối (nhưng công bằng)**: sức mạnh ước lượng sai số ±15% (Mắt Mờ ±30%, Kính Lúp 0); mỗi trận **thổi phồng** một tướng cửa dưới không phải người của mình (sức mạnh ×1.5, tỷ lệ ×0.8 — trông như cửa trên); 3 tin đồn trước trận có tin giả; người của nhà cái được rút ngắn tỷ lệ ×0.75 (chưa đủ bù lợi thế liên minh). Sau mỗi trận **nhật ký nhà cái** ghi rõ: ai là người của nhà cái, ai bị thổi phồng, tin đồn nào giả.
- **Câu đầu trận** (chọn 1): 🛡 Ai sẽ sống tới cuối? • 👑 Ai sẽ Top 1? • 🥇 Top 3, 2, 1 là ai?. Top 3: đúng cả 3 đúng thứ tự ×6, đúng 2 vị trí ×3, đủ 3 người sai thứ tự ×2, đúng 1 vị trí ×1 (hoàn tiền); hệ số ×(0.3 ÷ xác suất top 3 trung bình của 3 người chọn, trong 0.5–2.5); chọn toàn 4 cửa trên → ×0.5 và nhà cái bực. Top 1 luôn kèm điều khoản: "Đồng hạng 1 KHÔNG được tính là Top 1."
- **Giao Kèo** (mời ở câu đầu): đặt một khoản; mọi câu còn lại trong trận phải đúng (bỏ qua cũng là sai, kèo bị hủy thì không tính); hết trận trọn vẹn → nhận ×10 khoản đó + toàn bộ tiền thắng các câu trong giao kèo (giữ lại tới cuối trận). Sai một câu → mất khoản giao kèo + tiền thắng đang giữ. Không hủy được.
- **Câu hỏi giữa trận** (trận tạm dừng): sớm nhất giây 150, cách nhau ≥ 75s, tối đa 6 câu/trận (mỗi loại tối đa: Ai thắng 3, Kền kền 2, Ai bị hạ 2, Thính 2, Boss 2); không hỏi trong 20s sau khi can thiệp.
  - ⚔ **Ai thắng?** — khi hai tướng đã nhắm nhau và đánh qua lại (cả hai ≥ 45% máu). Thắng = còn sống sau 40s mà đối thủ đã gục; cả hai cùng gục (kền kền…) → mọi cửa thua; cả hai chạy thoát → hủy kèo (hoàn tiền). Xác suất = sức mạnh×máu mũ 1.5, kéo về 10–90%.
  - 👑 **Ai giết được boss này?** — khi có tướng bắt đầu đánh boss; 4 tướng gần nhất + "người khác / boss sống quá 3 phút".
  - 📦 **Ai lấy được thính?** — khi thính được báo; 4 tướng gần nhất + "người khác"; thính không ai lấy → hủy kèo.
  - 💀 **Ai bị hạ tiếp theo?** — khi lâu không có câu nào (≥ 160s), còn ≥ 4 người.
  - 🦅 **Kền kền có xuất hiện không?** — khi hai tướng đánh nhau ≥ 10s mà có kẻ thứ ba trong 35 đv; "có" = trong 30s một trong hai bị kẻ thứ ba hạ.
- **Điều khoản chữ nhỏ** (luôn ghi ra, chữ nhỏ mờ; Đọc Chữ Nhỏ tô đỏ): xác suất gặp = 15% + 45% khi đang giao kèo + 5% × bực bội (Lời Hứa Ngọt: mọi câu). Ai thắng: "Nếu cả hai cùng sống sau 40 giây: tính là THUA (không hoàn tiền)." / "Thắng nghĩa là TỰ TAY hạ đối thủ — bị kẻ khác hạ hộ thì tính là thua." • Ai giết boss: "Boss phải chết trong 90 giây, quá hạn tính là thua (không hoàn tiền)." • Ai lấy thính: "Thính phải bị lấy trong 60 giây sau khi rơi, quá hạn tính là thua." • Ai bị hạ tiếp: "Chết vì bo không tính — chờ người bị hạ tiếp theo." • Kền kền?: "Kền kền phải là TƯỚNG hạ gục; chết vì bo / quái tính là "không".".
- **Can thiệp** (trả tiền): 📦 Gọi thính 300 • 👑 Hồi sinh boss 400 • 🌀 Thu bo 250 — ×1.5 mỗi lần trong cùng trận, ×(1 + 0.15 × bực bội), Tay Trong −30%. Đang có kèo mở mà can thiệp = **"Phô Mai"** (bực +2; Phô Mai Hảo Hạng chỉ +1), không có kèo = "thêm hỗn loạn" (bực +1). Can thiệp được ghi (tick, loại) để "xem lại" diễn ra y hệt.
- **Người của nhà cái** (Aria & Oktava, Percy, Elara, Koda): mỗi trận nhà cái cài 0 – (1 + chặng) người (+1 khi bực ≥ 4, +1 khi bực ≥ 7, +1 khi dính Ân Huệ; trận của nhà cái: cả 4), đưa họ vào dàn tướng nếu thiếu; từ chặng 2 có 35% mua chuộc thêm một tướng khác. Họ **liên minh lâu dài, không báo cho ai**: không nhắm / săn / làm kền kền nhau, chung tầm nhìn, đổi đồ thật thà, không kết liên minh tạm với ai. Vỡ vì **lòng tham** (cân nhắc mỗi 10s): thính rơi giữa hai người (theo tính cách: Kẻ Bắt Nạt 55%, Thợ Săn Bắt Lẻ 35%, Lì Lợm 15%, Hòa Bình 5%), bo từ vòng 5 ép sát (6%), chỉ còn toàn người của nhà cái (30%); trúng nhầm nhau ≥ 30% máu cũng vỡ. Dấu hiệu: gặp nhau thì lướt qua, không bao giờ làm kền kền nhau, dòng sự kiện "⚡ trở mặt" khi vỡ.
- **Bực bội ẩn** (hiện bằng nét mặt 😏 / 😒 / 😠): +2 Phô Mai, +1 can thiệp, +2 thắng giao kèo, +1 thắng một kèo ≥ 1000 và ≥ ×5, +1 chọn toàn cửa trên; −1 nhận quà, −1 vay, −1 thua kèo ≥ 500. Bực càng nhiều: tỷ lệ xấu hơn, điều khoản chữ nhỏ nhiều hơn, nhiều người của nhà cái hơn, can thiệp đắt hơn, quà độc hơn; ≥ 8 sau chặng cuối → trận của nhà cái.
- **Cửa hàng sau trận**: 3 charm (giá × (1 + 0.1 × chặng) × (1 + 0.25 × số bản đã có), mua tối đa 1). **GĐ9c: không giới hạn số charm, mua trùng thì CỘNG DỒN** (mỗi bản thêm hiệu lực — xem bảng); 50% có quà của nhà cái (quà cũng cộng dồn); vay 500 / 1000 / 2000 (trả ×1.3, nhận 1 charm xấu ngẫu nhiên, chỉ gỡ khi trả nợ). Thoát giữa trận = bỏ trận (tiền đã cược mất).
- **GĐ9c — Sổ tiết kiệm**: giữa các trận gửi bao nhiêu cũng được; tiền gửi lượt này **khóa tới hết trận sau** (rút được từ lượt sau). Sau mỗi trận, số dư trong sổ được lãi **5%** và lãi cộng vào sổ (lãi kép). Tiết kiệm không dùng để cược trong trận, nhưng tính vào chỉ tiêu cuối chặng; trả nợ cuối ván trừ tiền mặt trước rồi mới tới sổ.
- **GĐ9c — 6 trận mỗi chặng** (tổng 18 trận). **Chơi tiếp vô tận**: trả hết nợ (tự do) thì có thể chơi tiếp; mỗi chặng vô tận chỉ tiêu = chặng cuối × 1.6^k, tài sản trừ nợ vay phải ≥ chỉ tiêu (không phải nộp), nhà cái cài thêm 1 người mỗi trận; thiếu là dừng — ghi kỷ lục chặng vô tận.
| Charm | Loại | Giá | Tác dụng | Mặt trái (giấu) |
|---|---|---|---|---|
| 🦅 Mắt Kền Kền | cửa hàng | 350 | Mỗi lần có kền kền ăn mạng trong trận: +60 tiền (mỗi bản +60). | — |
| 🕸 Lưới An Toàn | cửa hàng | 500 | Cược đầu trận (Sống / Top 1 / Top 3) mà thua vẫn được hoàn 50% (2 bản 75%, 3 bản 87%…). | — |
| 📜 Bảo Hiểm Giao Kèo | cửa hàng | 600 | Giao kèo được sai 1 câu mỗi trận mà không vỡ (câu đó vẫn mất tiền). Mỗi bản thêm 1 câu. | — |
| 🔄 Lật Câu Hỏi | cửa hàng | 300 | Mỗi trận được đổi một câu hỏi giữa trận sang câu khác (mỗi bản thêm 1 lần). | — |
| 🔍 Đọc Chữ Nhỏ | cửa hàng | 400 | Điều khoản ẩn trong câu hỏi hiện rõ, tô đỏ. Từ bản thứ 2: điều khoản ẩn ít xuất hiện hơn (×0.7 mỗi bản). | — |
| 🕵 Tình Báo | cửa hàng | 450 | Trước trận, lộ ra 1 người của nhà cái (nếu trận có). Mỗi bản lộ thêm 1 người. | — |
| 🧀 Phô Mai Hảo Hạng | undefined | 400 | Lách luật (can thiệp khi đang có kèo) làm nhà cái bực ít hơn (1 bản: như can thiệp thường; 2 bản: không bực). | — |
| 🔎 Kính Lúp Sức Mạnh | cửa hàng | 500 | Sức mạnh ước lượng hiện đúng giá trị thật (không sai số, không bị thổi phồng). Bản thứ 2: chỉ thẳng tướng bị thổi phồng. | — |
| 🤝 Tay Trong | undefined | 350 | Can thiệp rẻ hơn 30% (cộng dồn: ×0.7 mỗi bản). | — |
| 🪙 Đồng Xu May Mắn | cửa hàng | 550 | Mọi kèo thắng được thêm 10% tiền thưởng (mỗi bản +10%). | — |
| 🔭 Ống Nhòm | cửa hàng | 300 | Câu "Ai thắng?" hiện máu, cấp, sức mạnh và tỷ lệ thật của hai bên. Bản thứ 2: mọi câu hỏi hiện tỷ lệ thật. | — |
| 🔐 Két Sắt | cửa hàng | 450 | Sau mỗi trận được lãi 5% tiền mặt (tối đa 300) — mỗi bản cộng thêm. | — |
| 🎁 Ân Huệ | quà nhà cái | — | Giảm 20% chỉ tiêu chặng này. | Trận sau có thêm 1 người của nhà cái. |
| 💝 Món Quà Nhỏ | quà nhà cái | — | Nhận ngay 400 tiền. | Tỷ lệ cược xấu đi (nhà cái ăn thêm 10%) trong 2 trận. |
| 🍬 Lời Hứa Ngọt | quà nhà cái | — | Giảm 10% chỉ tiêu chặng này. | Mọi câu hỏi có điều khoản ẩn trong 3 trận. |
| ⛓ Xiềng Nợ | xấu (khi vay) | — | Mỗi trận bị trừ lãi 8% khoản vay (mỗi bản thêm 8%). | — |
| 🌫 Mắt Mờ | xấu (khi vay) | — | Sức mạnh ước lượng sai số thêm ±15% mỗi bản. | — |
| 🫳 Bàn Tay Nhờn | xấu (khi vay) | — | Mỗi kèo thắng bị nhà cái "phí" 10% (cộng dồn). | — |

## 18. Giao diện xem trận (trọng tài)
- Danh sách 10 tướng (màu riêng theo ô xuất phát): cấp, máu, số mạng (🦅 kền kền), ♻ còn lượt hồi sinh, 🧪 bình máu / 💧 bình mana / 💠 số mảnh hồn (viền ảnh đổi màu theo bậc mảnh hồn), việc đang làm (đang đánh ai, đang uống bình, đang quyết đấu), hạng khi bị loại; thu gọn được. Chạm một tướng: camera theo dõi + thẻ tướng (chỉ số, tính cách, balo, ý niệm, mảnh hồn, người được bảo vệ / đồng minh đình chiến, thành tích) + "Đang nghĩ" (3 hành động điểm cao nhất kèm lý do).
- Thanh trên: đồng hồ, số người còn trong trận, bo (vòng mấy, co lúc nào), thính, boss. Bản đồ nhỏ: bo hiện tại (ngoài bo tô tím) + vòng kế (nét đứt), bãi quái, Thương Nhân, boss, thính, 10 tướng.
- Camera tiên tri chấm điểm nóng: ⚔ giao tranh / hỗn chiến • 🦅 kền kền đang rình • ⚡ sắp chạm trán • 🎯 đang bị săn • 👑 đánh boss • 📦 tranh/mở thính • 🏃 truy đuổi • 🌀 kẹt ngoài bo • ⚔ quyết đấu / cổng quyết đấu. Tự chậm lại khi có ≥ 3 tướng giao tranh.
- Bản đồ vẽ theo 6 vùng; thu nhỏ hết cỡ thấy toàn đấu trường kèm tên vùng (bớt chữ cho đỡ rối). Cổng quyết đấu: cổng đá phát sáng + vòng ghi danh + đếm ngược; vòng quyết đấu vàng có cột lửa và đồng hồ. Uống bình: vòng tiến độ + lọ thuốc trên đầu.
- Mảnh hồn rơi: viên pha lê màu theo bậc văng ra từ xác, lơ lửng phát sáng (bậc Tím trở lên có tên), sắp hết hạn thì nhấp nháy; bản đồ nhỏ có chấm kim cương; nhặt được thì có vầng sáng + chữ "+💠 Vàng"; camera coi "💠 Tranh mảnh hồn" là điểm nóng; dòng sự kiện "💠 X rơi n mảnh hồn" (có mảnh Vàng/Đỏ thì hiện biểu ngữ).
- Quạ Oca vẽ bay cao có bóng dưới đất, vỗ cánh, mắt xanh, vòng tầm nhìn 8 đv nét đứt; bom mini rơi thấy được. Raven ngắm: cầm súng ngắm (nòng dài, ống ngắm, chân chống), tia laser đỏ + tâm ngắm trên mục tiêu; camera coi đây là điểm nóng "🎯 Bắn tỉa qua mắt quạ". Hộ vệ đang nhắm kẻ đánh chủ: dấu "!" và vạch nét đứt tới mục tiêu; đang quay về: "↩".
- Hiệu ứng kiểu bản Legacy: vệt chém trăng khuyết / đâm / lốc xoáy, mỗi đòn trúng có tia sáng theo màu người đánh + hạt văng xen trắng, đòn nặng rung màn hình + chớp trắng; tên chiêu bật lên trên đầu khi dùng (chiêu cuối chữ to, màu tướng).
- GĐ7: rương gỗ viền vàng (đang mở: vòng tiến độ vàng 🎁), bẫy kẹp (vòng nét đứt màu chủ bẫy), thùng thuốc nổ (cháy ngòi thì nhấp nháy tóe lửa), cối xay quay; nền vẽ theo biome của từng vùng (thêm Sa Mạc Cát), nhà / đền / cao nguyên (vách đá + dốc có bậc) / cầu / ao bùn / mặt băng / cát lún; đình chiến: nét đứt xanh + 🤝, vệ sĩ → người được bảo vệ: nét chấm. Màn dàn tướng hiện 5 biome và số công trình của bản đồ.
- Thông báo: 🦅 KỀN KỀN! • HẠ GỤC KÉP/BA… • CHIẾN CÔNG ĐẦU • CHẤM DỨT CHUỖI (kèm vàng truy nã) • "X BỊ LOẠI — hạng n"; bo bắt đầu co, thính sắp rơi / bị lấy, boss xuất hiện / cường hóa / bị hạ. Bảng xếp hạng (📋/Tab) và màn kết quả sau trận.
- GĐ8: bản đồ 8 vùng (Vùng Tử Khí: đất tro tím, cây chết, bia mộ, bụi gai; Trạm Khí Độc: vũng độc, sắt vụn, bồn khí có vạch cảnh báo, đường ống, nắp xả phun khói), 4 ổ boss mỗi ổ một kiểu sàn, đếm ngược + tên boss sắp ra; mỗi boss một dáng riêng (cánh lửa, rồng, hồn ma, giáp sắt, thú vàng, kiếm sư) + vòng tụ chiêu; vùng cảnh báo tròn / vành khăn / chữ nhật / hình nón (tô đậm dần tới lúc nổ); thanh Hộ Giáp bạc trên thanh máu; biểu tượng bùa lợi boss trên đầu; thẻ tướng có Hộ Giáp, chí mạng, may mắn, hồi chiêu, hút máu, kháng, xuyên thủng, bùa lợi boss, đồ Hoàng Kim, mảnh hồn đang gắn ✅ / cất túi 💤; dòng sự kiện boss xuất hiện / bị đánh (cả bản đồ biết) / bị hạ / thoát chết nhờ bùa / nhận đồ Hoàng Kim.
- GĐ9: thẻ tướng có 🔫 đạn / đang nạp / Tốc Nạp, 🧭 lối build đang theo (món đã có ✔), ❤ mảnh hồn yêu thích (✅ đang gắn / 💤 cất / · chưa có), 🌳 **cây kỹ năng đã nâng** (chạm để mở: từng mốc cấp 1/3/6/9/12, nhánh đã mở ✅, nhánh đã chọn nhưng chưa đủ cấp 🔒, mốc thêm cấp 15/18 ✨); dòng sự kiện 🔄 trao đổi / 💰 mua bán / 🃏 bịp / 🤨 nhìn thấu / 😤 vỡ lẽ, 💠 mảnh hồn văng ra; tiếng gọi trên đầu ("🔄 Đổi mảnh hồn không?", "📣 Bên kia có rương…", "👣 Truy vết").
- **GĐ11 — vũ khí & hiệu ứng riêng từng tướng**: mỗi tướng cầm vũ khí riêng (bảng dưới; tướng tay không: Borg đấm, Koda vuốt, Aria giọng hát, Alice găng tay ném bài), đạn đánh thường riêng (lá bài lưng tím viền vàng của Alice, nước của Lyra, ánh thánh của Olivia/Justus, khối dữ liệu của Caelus, mảnh gương của Mirage, cánh hồng đen của Dahlia, Chrono & Neo hai khẩu khác nhau — **Chrono** súng ngắn đồng cổ bắn viên đạn **cam** nặng (vòng kim đồng hồ), **Neo** súng năng lượng bắn tia **xanh dương** mảnh nhanh; đổi thế thì đổi đạn, lửa nòng đổi màu; **S4 Liên Hoa Thời Không trộn cả hai loại đạn**, plasma của Zero, lưỡi gió của Thanh Phong, lá bài của Luca/Joker…), đòn cận chiến đặc trưng theo vũ khí (đại kiếm chém rộng + tia ở mũi kiếm, katana hai vệt mảnh, song kiếm vệt chéo, lưỡi hái cung tím, dao găm đâm + giọt độc, phi đao hư không vết nứt tím, côn xoáy, song rìu + vụn băng, đại bản đao vàng, móc xích, kiếm khiên chớp khiên, cờ chiến đâm giáo) và **dấu ấn tung chiêu** (hạt + vầng sáng màu riêng mỗi tướng).
| Vũ khí (gfx) | Tướng |
|---|---|
| axes | Boran |
| blackcane | Dahlia |
| bow | Elara |
| cane | Luca |
| cards | Joker |
| claw | Koda |
| cleaver | Ariston |
| crossbow | Percy |
| dagger | Vesper |
| dual | Chrono & Neo |
| fan | Diệp Thanh Phong |
| fist | Borg |
| flag | Victoria |
| flask | Galo |
| flysword | Bạch Diệp |
| gloves | Alice |
| greatsword | Gideon |
| hookchain | Ratok |
| katana | Ryoma |
| laser | Dr. Vector |
| lightstaff | Olivia |
| ninja | Tsukiyo |
| orb | Dr. Caelus |
| pistol | Zero |
| pole | Wukong |
| rapier | Florian |
| revolver | Jack "Sáu Lỗ" |
| rifle | Raven |
| scythe | Death |
| shotgun | Clint |
| spear | Theron |
| staff | Ignatius |
| swordshield | Valerius |
| tidestaff | Lyra |
| tome | Justus |
| twinblades | Kazuki |
| voice | Aria & Oktava |
| voidknife | Kip |
| wand | Mirage |
| wrench | Roxie & T-Zero |
- **GĐ11 — Chiêu diện rộng đặt điểm**: cột nước S4 của Lyra chọn tâm theo vị trí dự đoán (đón đầu 0.9s) nơi gom được nhiều tướng địch nhất, hòa thì kẻ gần nhất; chỉ tung khi có ai lọt vùng. Kiếm Trận Bạch Diệp, bom từ Vector, khói & Thiên Tượng Tsukiyo đặt đúng điểm nhắm (trước luôn văng ra tầm tối đa).
- **GĐ12 — hình ảnh**: Alice S1 phi **dao găm** bạc chuôi tím; ảo ảnh của mọi tướng bắn đúng loại đạn của tướng gốc (ảo ảnh Alice ném bài). Dahlia: **mũ chóp cao rơi từ trời** chụp xuống ở Thoát Nguy (cả hai đầu hoán đổi), Mũ Thoát Hiểm, Màn Ảo Thuật, Cuồng Nhiệt biến quái. **Sân Khấu** (Luca S1 — sàn ấm, rèm nhung đỏ, viền vàng; Dahlia S4 — sàn tím đen, rèm tím, gậy đen cắm giữa): rèm nhung xếp nếp quanh mép, viền chạy, 2 đèn sân khấu quét. Thanh Phong: đánh thường & chiêu là **cơn lốc xoáy** (không còn nốt nhạc). Galo hóa thú: thân to 18%, xanh sẫm, tai nhọn, nanh, vằn lưng, mắt vàng, vũ khí thành **vuốt thú**. Luca dùng bộ chiêu cải trang: mang **màu & vũ khí của nạn nhân** + vòng cánh hồng xoay; đổi bộ chiêu bung khói hồng. Chrono & Neo: thân **cam đồng (Chrono) / xanh năng lượng (Neo)** + vòng màu dạng, hợp thể S4 có hai vòng; kẻ bị S2 nhắm có **vòng khóa cam**. Tướng **xoay tít** khi dùng chiêu xoay (Boran S2, Chrono & Neo S4, Kazuki AA, Roxie Vòng Xoáy Lửa, Jack Nạp Đạn Liều Lĩnh) và **vũ khí chìa thẳng ra hai bên đối diện**. Luca Bước Nhảy chạm đất **bung cánh hoa**. Mọi tướng: bóng đổ mềm dưới chân, viền sáng, chớp trắng khi trúng đòn tắt dần mượt. Tướng hai vũ khí (song kiếm, song rìu, dao găm, phi đao) **đánh luân phiên tay trái / phải**. Florian: **vòng Tứ Ấn** 4 cung hồng quanh mục tiêu, cung nào vỡ thì tắt.
- **GĐ11 — Sandbox**: lớp vẽ hitbox (vòng xanh/đỏ), nón nhìn 180°, vòng tầm đánh & từng chiêu (có nhãn), vòng lồng Solo vàng nét đứt.

## 20. Phòng thử nghiệm Sandbox (GĐ11 — src/sim/sandbox.js, src/ui/sandbox_ui.js)
- Màn hình chính → 🧪 **Phòng thử nghiệm**: chọn tướng, cấp (1/3/6/9/12/18), các bù nhìn cần thả → vào bản đồ thật (vách đá, bụi, công trình) nhưng **không quái, không rương, không bo, không ai chết** (về 0 máu thì hồi đầy, ghi "☠ hạ gục" vào nhật ký). Tướng thử do AI thật điều khiển, tự dùng chiêu lên bù nhìn.
- **Bù nhìn** (đội đối thủ, không liên minh / mua bán):
  - 🎯 **Bao Cát Tĩnh** — Đứng im, không đánh trả; 2s không trúng đòn thì hồi đầy máu. Đo DPS, tầm chiêu.
  - 🛡 **Bù Nhìn Siêu Giáp** — 1000 máu + 1500 Hộ Giáp, 0 giáp (chế độ 2: 100 giáp & kháng phép, 0 Hộ Giáp). Đo xuyên giáp / phá Hộ Giáp / sát thương chuẩn.
  - 🔫 **Máy Xả Đạn** — Bắn tỉa đơn / liên thanh 20 viên / cầu năng lượng chậm có cảnh báo. Test né, phản đạn, thế thân.
  - 🏃 **Bù Nhìn Thả Diều** — Giữ cự ly 6–8 đv, chạy zíc-zắc. Test bắt lẻ, làm chậm, trói, khóa lướt.
  - 👻 **Bù Nhìn Ẩn Thân** — Tàng hình rình rập rồi hiện hình đánh bất ngờ. Test radar, giật mình, chiêu bộc phá.
  - ⚔ **Đối thủ tướng thật** — bất kỳ tướng nào, AI đầy đủ (test giữ cự ly, Solo). **GĐ12**: hàng ⚔ **Lệnh đối thủ** riêng (AI / Đứng yên / Đánh thường / chỉ S1–S4 / chiêu phụ) áp cho mọi đối thủ tướng thật.
- **Lệnh cho tướng thử** 🎮: 🤖 AI tự đánh (mặc định) • ⏸ **Đứng yên, không làm gì** (làm bia để test chiêu/bù nhìn bắn vào) • 🗡 **Chỉ đánh thường** • **S1 / S2 / S3 / S4 / chiêu phụ: CHỈ dùng đúng chiêu đó** — tự tiến vào tầm chiêu rồi tung lên mục tiêu gần nhất, không đánh thường, không dùng chiêu khác (chiêu chưa học thì mở tạm cấp 1; chiêu dùng lại như snapback cũng được bấm). Kết hợp ⏱ Không Hồi Chiêu để spam một chiêu.
- **Bảng điều khiển** (phím tắt): 🛡 Bất Tử • ⏱ Không Hồi Chiêu (F1) • ♾ Vô Hạn Tài Nguyên (F2: mana, đạn, thanh riêng) • nhảy cấp 1→3→6→9→12→18 (F3) • đổi tướng tại chỗ (F4) • lớp vẽ gỡ lỗi (F5): hitbox, nón nhìn 180°, vòng tầm đánh & tầm từng chiêu • tốc độ 0.1x / 0.25x / 0.5x / 1x / 2x (F6) • 🔒 Lồng Solo đường kính 14 đv • ☣ Bo giả lập (18 → 6 đv trong 25s, sát thương bo vòng 3 + Ăn Mòn) • chế độ Máy Xả Đạn • đổi Siêu Giáp (Hộ Giáp ↔ giáp thường) • 🧹 dọn bù nhìn.
- **Bảng đo**: DPS 1s gần nhất • DPS trung bình cả chuỗi (chuỗi kết thúc sau 3s không đánh) • đòn cao nhất • tổng, số đòn, số chí mạng • phân rã Vật Lý / Phép / Chuẩn / Hộ Giáp vỡ / Khiên (con số + %) • đồng hồ khống chế (Choáng, Trói, Chậm, Câm lặng, Hất tung…) • nhật ký từng đòn dạng `[mm:ss.cs] S1 Tên Chiêu → 240 Vật Lý (CHÍ MẠNG!) → 40 Hộ Giáp vỡ → 0.60s Choáng`.
- **5 kịch bản kiểm thử mẫu** (chạy trong giao diện hoặc `node tools/sandbox_test.js`, mỗi dòng ✔/✘):
  - **Điểm Ngọt & Đẩy Cán Kiếm (Gideon)** — tướng Gideon, bù nhìn: Bao Cát Tĩnh.
  - **Bắn xuyên vách & Radar (Dr. Vector)** — tướng Dr. Vector, bù nhìn: Bao Cát Tĩnh.
  - **Nuốt đạn liên hoàn (Kip — Vòm Xoáy vs Máy Xả Đạn liên thanh)** — tướng Kip, bù nhìn: Máy Xả Đạn, Máy Xả Đạn chế độ burst.
  - **Tích tầng vô hạn (Không Hồi Chiêu)** — tướng Ryoma, bù nhìn: Bao Cát Tĩnh, bật Không Hồi Chiêu.
  - **Hoán vị về điểm neo (Luca S3) & ảo ảnh tự đánh (Alice)** — tướng Luca, bù nhìn: Bao Cát Tĩnh.

## 21. Chế độ PvE Sinh Tồn (GĐ12 — src/sim/pve.js, src/ui/pve_ui.js)
- Màn hình chính → 🕹 **Sinh Tồn PvE**: chọn 1 tướng; bạn tự điều khiển nó giữa 9 tướng máy trên bản đồ, luật đấu trường như thường (bo, quái, boss, thính, rương, Thương Nhân). Điểm chiêu và mua đồ của tướng bạn là **thủ công** (xem dưới).
- **Đường thực thi thống nhất** (Unified Action Pipeline): người chơi và AI cùng đổ lệnh về `m.executeSkill(u, ô chiêu, vị trí, mục tiêu)` và `m.executeBasicAttack(u, mục tiêu, hướng)`. AI tính vị trí bằng lấy mẫu không gian: chiêu vùng dùng **gom cụm có trọng số** (mỗi kẻ địch là một ứng viên ở vị trí đón đầu; tướng ×3, quái ×1; rồi kéo tâm về trọng tâm cụm nếu phủ không kém; kẹp trong tầm), chiêu định hướng / hình nón dùng **véc-tơ đón đầu** P + v × t_bay (mục 13p).
- **Bộ điều hợp PC**: WASD đi • **giữ Q/E/R/F/Space** hiện vòng chỉ thị bám con trỏ, **nhả** để tung (chiêu rơi đúng con trỏ; bấm nhanh cũng tung tại con trỏ) • chuột phải / Esc khi đang giữ = **hủy** • click trái vào kẻ địch = khóa & đánh • con trỏ sát mép 5% → camera trôi về phía đó tối đa 8 đv • H/G bình, **B** bánh xe balo, T đổi mục tiêu.
- **Bộ điều hợp điện thoại**: **cần ảo nổi** (chạm bất kỳ đâu nửa trái màn hình) • nút chiêu: **chạm nhanh** (< 0.15s) = tung vào mục tiêu ưu tiên có đón đầu nhẹ 0.25s; **giữ & kéo** = vòng chỉ thị — **Đường thẳng** (chiêu bay / lướt), **Hình nón** (shotgun, quạt, chém 180°), **Vòng rơi** (vòng tầm tối đa + vòng nổ di chuyển theo ngón tay, độ kéo = cự ly), **Quanh mình** (chiêu tự thân); kéo vào ô **✕ HỦY** = chỉ thị đổi đỏ xám, thả ra không tung. **Nam châm ngắm**: dải ngắm lệch ≤ 12° so với một tướng địch → tự hút vào điểm đón đầu của nó (vòng đỏ đánh dấu), kéo vượt góc thì ngắm tự do. Chiêu tầm > 10 đv: camera trôi theo hướng ngắm (tầm × 0.6 × độ kéo).
- **Nút đánh thường thông minh** ⚔: chạm = tự chọn mục tiêu trong tầm theo ưu tiên **tướng địch thấp máu nhất → tướng gần nhất → quái đang giao tranh**; không có gì trong tầm → bước ngắn 1.5 đv về phía kẻ địch gần nhất. **Kéo** = đường vàng, rê qua mục tiêu nào (ưu tiên tướng hơn quái) thì **vòng khóa đỏ** ghim vào nó; thả tay là khóa & đánh cố định mục tiêu đó. Mục tiêu khóa luôn có vòng đỏ xoay + mũi tên trên đầu. Lệnh đánh được giữ (tự bám vào tầm) tới khi di chuyển, mục tiêu chết, khuất tầm nhìn hoặc xa quá 12 đv — đứng yên KHÔNG tự đánh.
- **Bánh xe balo** 🎒 (giữ nút / phím B): bung tối đa 6 ô vật phẩm quanh ngón tay, quẹt về món cần dùng rồi thả. Bình máu / mana-giáp vẫn có nút 1 chạm.
- **Tầm nhìn như người chơi thường**: chỉ thấy đơn vị mà đội mình nhìn thấy, sương tối ngoài tầm nhìn tướng; danh sách 10 tướng kiểu trọng tài bị ẩn. **Chỉ báo âm thanh** cho kẻ địch khuất tầm nhìn: ⚔ tiếng giao tranh (30 đv), 💨 tiếng lướt (18 đv), 👣 tiếng bước chân ngoài bụi (9 đv) — vị trí áng chừng ±1.5 đv, ngoài màn hình thành biểu tượng + mũi tên vàng ở mép.
- **Khóa mục tiêu thông minh** (chỉ để ngắm khi chạm nhanh nút chiêu): giữ mục tiêu cũ nếu còn thấy & trong 11 đv; không thì tướng địch gần nhất trong 9 đv; rồi quái gần nhất trong tầm đánh + 2.
- **AI tự hành của tướng bạn bị xóa**: không vòng nghĩ, không tự đánh / tự dùng chiêu / tự uống bình / tự dùng balo, không bị AI khác kéo vào liên minh – đình chiến, không phản xạ né đòn hay hoảng loạn bấm nhầm chiêu. Điểm chiêu và cửa hàng cũng không tự động (tướng máy vẫn tự cộng / tự mua như cũ). Bị loại → biểu ngữ hạng, camera về **góc nhìn trọng tài** (bỏ sương mù), trận chạy tiếp ở tốc độ đã lưu tới khi có người thắng.
- **Cộng điểm chiêu thủ công**: lên cấp có điểm → biểu ngữ nhấp nháy "⬆ N điểm chiêu"; chiêu học được hiện huy hiệu **+** xanh (chạm + để học, không kích hoạt ngắm), PC: **Ctrl/Alt + Q/E/R/F**. Luật cấp giữ nguyên: chiêu thường tối đa 5 cấp và không vượt ⌈cấp/2⌉; chiêu cuối tối đa 3, mở ở cấp 4/8/12. Chấm dưới nút chiêu = cấp chiêu.
- **Cửa hàng 🛒 (phím P)**: mua chỉ khi đứng cạnh Thương Nhân (hoặc có mảnh "Cửa Hàng Online" và rời giao tranh > 4s); đứng xa thì dòng trạng thái chỉ khoảng cách + hướng tới Thương Nhân gần nhất, nút 🛒 sáng khi mua được. 4 tab: **Gợi ý** (6 món kế tiếp trong lối build của tướng + phôi), **Tất cả** (theo nhóm Công vật lý / Phép / Thủ / Hỗ trợ / Giày / Kích hoạt), **Đồ của tôi** (bán lấy 50% giá, rèn Ý Niệm), **Balo & bình** (nâng balo, mua vật phẩm tiêu hao). Đủ 6 ô thì mua món mới tự bán món khởi điểm để lấy chỗ. Esc đóng.
- **Nút khóa camera 🔒 (phím Y)**: khóa = camera bám tướng bạn; mở 🔓 = camera đứng yên, kéo bản đồ tự do; khóa lại thì camera về giữa tướng. Kéo bản đồ cũng tự mở khóa.
- **Điều khiển kiểu LoL (GĐ13)**: chuột PHẢI lên đất = đi tới điểm (tìm đường, dấu xanh + đường chấm), giữ chuột phải = đi theo con trỏ; chuột phải / trái lên kẻ địch = khóa & đánh (dấu đỏ); WASD vẫn dùng được. Chuột KHÔNG kéo camera nữa (trước đây bấm đánh bị kéo camera đi); kéo mép màn hình chỉ khi đã thả khóa camera (Y). Điện thoại: chạm nhanh lên bản đồ = đi tới / đánh; vuốt bản đồ chỉ khi đã thả camera.
- **Cây tiến hóa thủ công (GĐ13)**: tới mốc cấp 1/3/6/9/12, bảng 🌳 hiện 3 nhánh — chọn bằng chạm hoặc phím 1/2/3 (không chọn thì mốc chờ, không ai chọn hộ). Tướng máy vẫn tự chọn theo tiện ích.
- **Mở rương 🎁 (phím V)**: tới gần rương (≤ 2.5 đv ngoài tầm với) hiện nút "🎁 Mở rương"; bấm → tự đi tới rồi đứng mở 1.5s (thanh tiến độ trên nút); di chuyển hoặc bị đánh thì hỏng.
- **Cửa hàng có ô tìm kiếm** (không dấu cũng được: "hut mau" ra Hút Máu) — tìm theo tên, chỉ số, mô tả, cả trang bị lẫn vật phẩm balo; khi bảng mở, báo điểm chiêu hiện ngay trong bảng (không bị che).
- **Khóa tốc độ khi còn sống**: chỉ còn ⏸; ẩn x0.5–x8, tua nhanh, AI debug, camera điểm nóng; bị loại mới chỉnh tốc độ như xem trận. Phím cách chỉ là skill phụ. **Minimap theo tầm nhìn**: chỉ hiện tướng địch đang thấy.
