# GĐ6 — KẺ ĐẶT CƯỢC: đấu trường sinh tồn cơ bản

Theo GDD "Kẻ Đặt Cược", mục 16 "Lộ trình MVP", bước 1: đấu trường cơ bản. Bản MOBA 5v5 đã bỏ hẳn: sự nghiệp HLV, mùa giải, cấm chọn, lệnh, trụ, lính, phép bổ trợ, mắt và bản cập nhật theo mùa. Chiêu của 27 tướng giữ nguyên như bản cũ. Phần cược làm ở GĐ7.

## 1. Đã làm gì

### Đấu trường (`src/sim/map.js`, `arena.js`, `neutral.js`)
- **Bản đồ** 192×192, đối xứng 8 hướng:
  - ổ Boss Tân Thế ở tâm;
  - đá và tường chia thành nhiều vòng;
  - 32 bụi cỏ, 4 Thương Nhân và 10 điểm xuất phát;
  - 26 bãi quái: 8 bãi vòng trong (có bùa), 8 bãi nhỏ vòng ngoài, và 10 bãi "nhà" đặt ngay trước mỗi điểm xuất phát.
- **Bo 6 vòng** trong 30 phút:
  - Tâm vòng kế chọn theo hạt giống và được báo trước.
  - Ra ngoài bo mất % máu mỗi giây.
  - Bo 6 đóng lúc 26:30 nhưng **không co về 0**. Hết 30:00 thì ai còn trong trận cũng đồng hạng 1, theo gợi ý trong GDD.
- **Boss Tân Thế**:
  - Có từ 2:00. Hạ được thì nhận bùa +25% sát thương.
  - **Từ bo 4**: boss đang sống thì được cường hóa; nếu đang chết thì hồi sinh ngay ở dạng cường hóa.
- **Thính**:
  - 4 lần (5:00, 11:00, 17:00, 23:00), báo trước 30 giây.
  - Phải đứng mở một mình 3 giây, không bị đánh.
  - Phần thưởng hiện là bản tạm (vàng, KN, hồi máu, sức mạnh vĩnh viễn trong trận). GĐ8 sẽ thay bằng ý niệm vàng và mảnh hồn vàng.
- **Hồi sinh** 1 lần nếu chết trong 10 phút đầu: sau 12 giây, ở chỗ an toàn trong bo. Chết lần nữa thì bị loại.
- **Xếp hạng** theo thứ tự bị loại; ai bị loại cùng một bước logic thì đồng hạng.
- **Kinh tế đánh đơn**:
  - Hạ người khác được 200 vàng và lấy 20% vàng của nạn nhân.
  - **Truy nã**: kẻ đang có chuỗi hạ gục khi bị hạ sẽ cho thêm vàng; đạt chuỗi ≥ 3 thì bị lộ vị trí với mọi người.
  - Hết giao tranh vài giây thì tự hồi máu.
  - **KN đuổi kịp**: tướng thấp cấp nhận thêm KN.
  - Chỉ mua đồ được ở Thương Nhân.
- **Kền kền**: người ra đòn cuối mà góp dưới 35% sát thương (và có người góp nhiều hơn) được tính là kền kền. Cách tính này dùng cho thống kê và cho kèo cược sau này.

### 10 tướng, 10 người triệu gọi, tính cách (`lineup.js`, `data/personality.js`)
- Mỗi trận chọn ngẫu nhiên 10 tướng theo hạt giống. Mỗi tướng do một người triệu gọi bản tạm điều khiển: tên ngẫu nhiên, 8 chỉ số 6–17, thành thạo tướng 55–92.
- **Tính cách cố định theo tướng**: Hổ Báo, Lì Lợm, Tham Farm, Ám Sát, Kền Kền, Con Bạc. Mỗi loại là một bộ trọng số cho AI, và người xem thấy được nhãn tính cách.

### AI sinh tồn 2 tầng (`sim/ai/utility.js`, `hero_ai.js`, `skill_ai.js`)
- **Tầng chiến lược (Utility AI)** có 11 hành động: ăn quái, đi săn, tranh boss, tranh thính, chạy bo, núp/phục kích, hồi máu, làm kền kền, đi shop, đi tuần, rút lui.
  - Điểm mỗi hành động = trung bình nhân của các yếu tố, nhân với trọng số tính cách và mất bình tĩnh.
  - Có quán tính và thời gian giữ tối thiểu.
  - Hành động được **bốc ngẫu nhiên có trọng số** trong nhóm điểm gần cao nhất, nên trận khó đoán hơn.
  - Luôn ghi 3 lựa chọn cao nhất kèm lý do.
- Các hành vi mới:
  - "Lãnh địa" đầu trận.
  - Thù dai: nhớ ai đánh mình, ai hạ mình.
  - Nghe tiếng giao tranh, chờ hai bên kiệt sức rồi vào dọn (kền kền), cướp mạng.
  - Đi săn có lúc chán, và đầu trận ít đi săn hẳn.
  - Nhận ra kẻ đang tiến tới mình để chạy sớm.
  - Đứng trong dây xích quái khi farm.
  - Không ăn bãi nằm ngoài bo.
- **Tầng chiến thuật** giữ vi mô bản cũ: chọn mục tiêu bằng điểm, thả diều, đọc đòn, dụ đòn, biết buông, xử lý khi bị đuổi, chiêu Utility.
  - Đổi sang kiểu đánh đơn: kẻ đang bận đánh người khác chỉ tính 35% sức mạnh, ngưỡng giao chiến cao hơn, mạng cuối thì giữ mình hơn.

### Giao diện trọng tài (`ui/render.js`, `hud.js`, `app.js`, `map_art.js`)
- Không còn sương mù: thấy cả người trong bụi, ảo ảnh (đánh dấu ✦) và ý định của AI. Mỗi tướng có một màu riêng.
- Vẽ được bo (ngoài bo phủ tím, vòng kế là nét đứt), thính (vòng đếm ngược, thùng rơi, vòng tiến độ mở), Thương Nhân, đồng hồ bãi quái và boss. Nền đấu trường vẽ theo ô, sắc nét khi phóng to.
- **Danh sách 10 tướng** hiện:
  - cấp, máu, số mạng (🦅 kền kền);
  - ♻ còn lượt hồi sinh;
  - việc đang làm hoặc đang đánh ai;
  - hạng khi bị loại.
- Chạm vào một tướng: camera theo dõi, kèm thẻ người triệu gọi (chỉ số, tính cách, thành tích) và mục **"Đang nghĩ"** (top 3 kèm lý do).
- Thanh trên có: đồng hồ, số người còn trong trận, bo co lúc nào, thính và boss.
- **Camera tiên tri** chọn chỗ để quay: giao tranh hoặc hỗn chiến, kền kền đang rình, sắp chạm trán, đang bị săn, boss, tranh thính, truy đuổi, kẹt ngoài bo.
- **Thông báo**: KỀN KỀN!, hạ gục kép/ba, chiến công đầu, chấm dứt chuỗi (+ vàng truy nã), "X BỊ LOẠI — hạng n", bo co, thính, boss.
- Các màn hình: màn chính "Kẻ Đặt Cược", màn giới thiệu dàn 10 tướng, bảng xếp hạng (📋/Tab) và màn kết quả.

### Công cụ
- `tools/mophong.js`: đo đấu trường (thời lượng, thời điểm bị loại, kền kền, boss, thính, hạng theo tướng và tính cách). `--kiemtra` kiểm tra tất định.
- `tools/thietke.js` sinh lại THIET_KE.md cho đấu trường.
- `tools/ban_do.html` cho xem toàn đấu trường.

## 2. Số đo (40 trận — `docs/GD6_MO_PHONG.txt`)

| Chỉ số | Kết quả | Mục tiêu |
|---|---|---|
| Thời lượng | TB 24.0 phút (20–25: 55%, 25–30: 35%, hết 30:00: 3%, < 15: 3%) | 30 phút |
| Thời điểm bị loại | 25%: 11.7' • giữa: 15.0' • 75%: 20.3' | rải đều tới cuối |
| Hạ gục | 11.1/trận; ~2.6 người dùng lượt hồi sinh | — |
| Kền kền | **15%** số mạng | 20–30% |
| Boss / thính | Boss bị hạ 0.95/trận; thính được lấy 3.5/4 | — |
| "Cửa trên" tạm vô địch | 13% (người triệu gọi chỉ số cao nhất) | 25–35% (đo lại ở GĐ7) |
| Tất định | ✔ cùng hạt giống thì giống hệt; 0 lỗi, 0 văng | — |
| Tốc độ | ~5.7 giây/trận 30 phút trên một nhân | — |

Thử giao diện trên trình duyệt thật (màn ngang điện thoại 844×390): 0 lỗi.

## 3. Chưa xong / cần lưu ý
- **Kền kền mới 15%** (mục tiêu 20–30%). Giao tranh đánh đơn vẫn ngắn nên bên thứ ba ít khi đến kịp. Cần giao tranh dài hơn hoặc cho kẻ rình đứng gần hơn.
- **Cân bằng tướng cho đánh đơn chưa làm.**
  - Mạnh: Valerius và Gideon (Lì Lợm, top 3 tới 70–90%), Zero, Ryoma.
  - Yếu: Percy, Jack, Ignatius, Joker (hạng TB khoảng 8).
  - Tính cách Con Bạc và Kền Kền đang yếu.
  - Mỗi tướng mới có 10–20 trận nên số liệu còn nhiễu.
- **Tỷ lệ "cửa trên"**: chưa có mô hình tỷ lệ cược (GĐ7). Thước đo tạm theo chỉ số người triệu gọi cho 13%.
- **Phần thưởng thính** là bản tạm; ý niệm, mảnh hồn, ngọc thuộc GĐ8.
- **Người triệu gọi** là bản tạm (chỉ có chỉ số). Cây kỹ năng, đồng điệu và cãi lệnh thuộc GĐ10.
- **Thông báo "bị săn"**: camera đã biết ai đang săn ai, nhưng chưa có kèo cược đi kèm (GĐ7).
- Thư mục `legacy/` (bản cũ trước GĐ1) vẫn giữ, có lối vào từ màn chính.

## 4. Số "khởi điểm" đã đổi
- **Bỏ**: lính, trụ, nhà chính, đường, sông, bệ hồi máu, phép bổ trợ, mắt, bản cập nhật theo mùa, quái lớn/quái cuối kiểu MOBA.
- **Bo**:

  | Vòng | Chờ / co (giây) | Bán kính | Co xong lúc | Ngoài bo mất |
  |---|---|---|---|---|
  | 1 | 240 / 90 | 95 | 5:30 | 1%/s |
  | 2 | 180 / 90 | 72 | 10:00 | 2%/s |
  | 3 | 180 / 90 | 52 | 14:30 | 3.5%/s |
  | 4 | 180 / 90 | 34 | 19:00 | 5%/s |
  | 5 | 150 / 90 | 18 | 23:00 | 7%/s |
  | 6 | 120 / 90 | 6 | 26:30 | 10%/s |

- **Quái**:

  | Bãi | Máu | Công | Hồi lại sau | KN |
  |---|---|---|---|---|
  | Đỏ / Xanh | 560 | 17 / 16 | 90s | 190 |
  | Vàng | 520 | 15 | 90s | 170 |
  | Nhỏ | 300 | 10 | 60s | 140 |

- **Tướng**:
  - Máu ×1.35.
  - KN hạ tướng: 120 + 30 × cấp nạn nhân.
  - Vàng hạ tướng: 200 + 20% vàng nạn nhân + truy nã 80 mỗi mạng trong chuỗi.
  - KN đuổi kịp +20%/cấp.
  - Ngoài giao tranh hồi 2% máu mỗi giây.
- **Boss**: 5200 máu, 110 công. Cường hóa từ bo 4: ×1.4 máu, ×1.3 công.
- **Thính**: 400 vàng, 600 KN, hồi 50% máu, +8% sát thương và +8% máu tối đa vĩnh viễn trong trận.
- **AI**:
  - Ngưỡng giao chiến: đầu trận 2.0, sau đó 1.4, mạng cuối 1.5.
  - Ngưỡng rút: 0.36 / 0.42 (mạng cuối), chia cho độ hổ báo.
  - Đi săn nhân thẳng theo giai đoạn: 0.2 → 1 trong khoảng phút 4 → 25.

## 5. Quyết định mặc định cho các câu hỏi mở của GDD (chưa được xác nhận)
1. **Trận kết thúc thế nào**: đã đổi theo gợi ý 💡 của chính GDD: bo 6 không co về 0, hết 30 phút thì người còn sống đồng hạng 1. Trước đây đề xuất co về 0.
2. **Boss từ bo 4**: làm cả hai. Boss đang sống thì được tăng sức; nếu đang chết thì hồi sinh ngay ở dạng cường hóa.
3. Charm (chọn 1 trong 3 sau mỗi trận), 3 chặng × 3 trận + trận nhà cái, người của nhà cái lúc có lúc không, người triệu gọi có cá tính và cố định trong một lần chơi: chưa làm tới, vẫn theo đề xuất trước.
