# GĐ7b — Liên minh tạm thời, bình 3 cỡ, mảnh hồn có đặc năng, "múa" chiêu

Yêu cầu:
- Các đấu sĩ có thể team up, nhưng chỉ tạm thời; sát thương vẫn gây lên nhau.
- Uống máu thì hồi ngay; bị đánh thì ngắt uống; thời gian uống lâu hơn; chỉ mang được 3 bình. Máu chia bình nhỏ / vừa / to, mana cũng vậy.
- Mảnh hồn có đặc năng theo bậc:

  | Bậc | Đặc năng |
  |---|---|
  | Tím | Trợ Năng, Uống Máu, Cẩn Thận |
  | Vàng | Lưu Vân, Vận Mệnh, Cơ Mệnh |
  | Đỏ | Thiên Mệnh, Tuyệt Kỹ Nộ, Cửa Hàng Online |

- Mảnh hồn bậc cao có nhiều chỉ số và đa dạng hơn; thêm loại mới; mảnh hồn cho may mắn và hồi chiêu.
- Nhân vật "múa" (phối hợp chiêu mượt mà) như bản Di sản.

## 1. Đã làm gì

### Liên minh tạm thời (`src/sim/ai/persona.js`, `match.js`, `combat.js`, `consts.js` → `ALLY`)
- **Ai cũng có thể kết liên minh**, không riêng Ngụy Quân Tử.
  - Điều kiện: hai tướng gặp nhau trong 13 đv, cả hai còn ≥ 45% máu, không đang đánh nhau, chưa có liên minh.
  - Thời điểm: từ phút 1.5 tới phút 25.
  - Ai hay đề nghị và ai dễ nhận lời tùy tính cách:
    - Hòa Bình, Thực Dụng, Lì Lợm dễ nhận lời.
    - Võ Sĩ Danh Dự, Cuồng Tín, Thợ Săn Bắt Lẻ gần như luôn từ chối.
    - Đang thù nhau thì không liên minh.
- **Khi đã liên minh**:
  - không cố ý nhắm nhau, không đi săn nhau;
  - **chung tầm nhìn**;
  - lao vào giúp khi đồng minh bị tướng khác đánh; cùng đánh mục tiêu của đồng minh; đi cùng nhau.
- **Sát thương vẫn gây lên nhau**: chiêu diện rộng, thùng nổ… vẫn trúng đồng minh. Gây cho đồng minh từ 15% máu tối đa của họ trở lên thì liên minh vỡ ("😠 Đánh trúng tao rồi!").
- **Chỉ là tạm thời**: liên minh kéo dài 3.5 phút. Tự tan khi hết hạn, khi một bên gục, hoặc khi chỉ còn ≤ 4 người. Mỗi tướng tối đa 2 liên minh mỗi trận.
- **Phản bội**:
  - Khi đồng minh xuống dưới 25% máu hoặc cúi xuống mở rương, mỗi bên "nổi lòng tham" một lần theo tính cách: Ngụy Quân Tử luôn luôn; Kẻ Bắt Nạt 60%; Kền Kền 50%… Hòa Bình, Võ Sĩ, Vệ Sĩ, Cuồng Tín thì không bao giờ.
  - Ai đã quyết phản bội thì chờ thời rồi "🎭 Đâm sau lưng!". Người bị phản bội thù 2 phút.
- **Giao diện**:
  - nét đứt xanh + 🤝 giữa hai đồng minh;
  - thẻ tướng hiện "Liên minh tạm với …, còn …s", kèm "đang chờ thời phản bội" nếu có;
  - dòng sự kiện: kết liên minh / từ chối / tan (kèm lý do) / đâm sau lưng (có biểu ngữ).

### Bình máu / mana (`src/data/consumables.js`, `extras.js`, `bag.js`, `combat.js`)

| Bình | Giá | Uống mất | Hồi ngay khi uống xong |
|---|---|---|---|
| Bình Máu Nhỏ / Vừa / To | 45 / 90 / 160 | 1.4 / 1.8 / 2.3s | 20% / 35% / 55% máu tối đa |
| Bình Mana Nhỏ / Vừa / To | 35 / 70 / 120 | 1.0 / 1.3 / 1.7s | 25% / 45% / 70% mana |

- **Uống xong mới hồi, hồi ngay một lần** (trước đây hồi dần trong 6 giây). Thời gian uống dài hơn trước (trước: 1.2s bình máu, 0.9s bình mana).
- **Trúng đòn của đối thủ là hỏng lần uống**: không mất bình, hiện "💔 Ngắt uống bình". Bo và sát thương theo thời gian không ngắt.
- **Mang tối đa 3 bình máu + 3 bình mana** (mọi cỡ cộng lại). Khởi đầu 2 Bình Máu Vừa + 1 Bình Mana Vừa. Thính cho 2 Bình Máu To nhưng không vượt giới hạn.
- **AI**:
  - chọn cỡ bình vừa đủ bù phần thiếu; đối thủ ở gần thì chọn bình nhỏ cho nhanh;
  - vừa bị đánh (< 0.8s) thì chưa uống; chỉ uống khi không ai sắp với tới;
  - mua cỡ bình theo túi tiền.

### Mảnh hồn làm lại (`src/sim/extras.js`)
- **Mỗi mảnh có 1 loại chính + nhiều dòng chỉ số theo bậc**: Trắng 1 dòng, Xanh 2, Tím 2, Vàng 3, Đỏ 4. Dòng phụ rút ngẫu nhiên, bằng 60% dòng chính.
- **11 loại dòng chỉ số**: 8 loại cũ (Sức Mạnh, Sinh Lực, Tốc Độ, Hồi Chiêu, Hút Máu, Hộ Thể, Tốc Đánh, Kiên Định) và **3 loại mới**: 🎯 Chí Mạng, 🍀 May Mắn, 🗡 Xuyên Phá.
- **Mảnh nào cũng cho may mắn (+bậc) và hồi chiêu (−1% × bậc)**.
- **May mắn** có tác dụng:
  - mỗi điểm +0.4% chí mạng;
  - rương thêm món thứ 3 (1.5% mỗi điểm);
  - quái rơi mảnh hồn nhiều hơn (+2% mỗi điểm);
  - thính dễ ra mảnh Đỏ hơn.
- **Đặc năng** (mỗi mảnh Tím / Vàng / Đỏ có 1 đặc năng; giữ nguyên khi rơi và được người khác nhặt):

  | Bậc | Đặc năng | Tác dụng |
  |---|---|---|
  | Tím | 🌿 Trợ Năng | Bình hồi thêm 50% lượng hồi trong 5s |
  | Tím | 🧛 Uống Máu | Hạ gục một tướng thì hồi 80% máu |
  | Tím | 🫙 Cẩn Thận | Uống bình không bị ngắt khi trúng đòn |
  | Vàng | ☁ Lưu Vân | Lướt 4 đv rồi +40% tốc chạy 2s, hồi 10s. AI dùng để thoát khi bị bám, hoặc áp sát con mồi |
  | Vàng | 🔮 Vận Mệnh | Gục lần tới thì hồi sinh tại chỗ với 40% máu; mảnh hồn này vỡ |
  | Vàng | ⚡ Cơ Mệnh | Hạ gục một tướng thì mọi chiêu hồi ngay |
  | Đỏ | 🌅 Thiên Mệnh | Gục thì hồi sinh tại chỗ với 50% máu và bất tử 90s; hồi 400s |
  | Đỏ | 💢 Tuyệt Kỹ Nộ | Chiêu cuối gây ×2 sát thương trong 3.5s sau khi dùng; hồi 60s |
  | Đỏ | 🛍 Cửa Hàng Online | Mua đồ, bình, nâng balo, đúc ý niệm ở bất cứ đâu, khi không đang giao tranh |

- **Giao diện**:
  - thẻ tướng liệt kê từng mảnh (bậc, các dòng chỉ số, đặc năng và thời gian hồi), kèm điểm may mắn;
  - mảnh rơi trên sân có biểu tượng đặc năng;
  - dòng sự kiện nhận mảnh có đặc năng;
  - biểu ngữ khi được Thiên Mệnh / Vận Mệnh cứu.

### "Múa" — phối hợp chiêu như bản Di sản (`src/sim/ai/hero_ai.js`, `src/ui/render.js`, `draw_hero.js`)
- **Chuỗi combo**:
  - Có ≥ 2 chiêu tấn công lên được mục tiêu thì AI lên chuỗi tối đa 4 bước, theo thứ tự: lướt áp sát (nếu ngoài tầm) → khống chế → dồn sát thương / cấu rỉa → chiêu cuối (nếu đáng dùng).
  - Giữa hai chiêu chen 1 đòn đánh thường nếu đòn đã sẵn ("đánh xen chiêu").
  - Khoảng nghỉ giữa các bước 0.08–0.3s theo Kỹ Năng.
  - Đang combo thì AI nghĩ mỗi nhịp (1/20s), không chen việc khác; chiêu kế tiếp ngoài tầm thì áp sát chờ.
  - Tướng lạ tay đôi khi không nối được chuỗi.
- **Gom chiêu**: chỉ có 1 chiêu sẵn mà chiêu nối tiếp sắp hồi (≤ 1.2s) thì giữ lại để ra thành chuỗi, như cách bản Di sản canh thời điểm.
- **Động tác riêng theo loại chiêu**:

  | Loại chiêu | Động tác |
  |---|---|
  | Lướt | Thân lao tới, co giãn, **bóng mờ nối đuôi** |
  | Khống chế | Giơ cao rồi **đập xuống** |
  | Đánh thường / dồn sát thương | **Chém xen kẽ trái–phải** |
  | Tầm xa (súng, gậy, bài…) | Đâm / giật |
  | Chiêu cuối | Xoay |
  | Hỗ trợ / thế thủ | Giơ vũ khí / thế thủ |

  Thân người dồn theo đòn. Hoàn thành chuỗi ≥ 3 bước thì hiện "✦ COMBO ×n".

## 2. Đo đạc (`docs/GD7B_MO_PHONG.txt` 24 trận + 8 trận đếm riêng)

| Chỉ số | Kết quả |
|---|---|
| Thời lượng trận | TB **38.4 phút** (trung vị 38.0; 13% < 30 phút; 0% hết giờ) |
| Lỗi / tất định | **0 lỗi**, tất định ✔ |
| Giao tranh | giữa 33 giây (GĐ7: 39 giây) — combo làm trận đánh dứt khoát hơn |
| Combo (chuỗi ≥ 2 bước) | **~63 / trận** |
| Bình đã uống | 67 / trận (GĐ7: 112) — uống lâu hơn, bị ngắt, mang ít hơn |
| Số lần bị ngắt uống | 39 / trận |
| Liên minh | 3.8 / trận |
| Lý do liên minh tan (mỗi trận) | hết hạn 1.8 • một bên gục 0.9 • đánh trúng đồng minh 0.5 • phản bội 0.4 • còn ít người 0.3 |
| Mảnh hồn | 9.5 mảnh có đặc năng được nhận / trận; đặc năng kích hoạt 3.0 lần / trận (Lưu Vân, Tuyệt Kỹ Nộ, hồi sinh…) |
| Ryoma | vô địch 75% (GĐ7: 80%) |
| Florian | vô địch 14% (GĐ7: 55%) |

## 3. Chưa xong
- **Ryoma vẫn quá mạnh** (75% vô địch). Đề xuất từ GĐ7 vẫn còn đó: giảm khoảng 10% máu gốc hoặc sát thương combo của Ryoma. Tôi chưa làm vì cần bạn đồng ý sửa số của chiêu cũ.
- **Võ Sĩ Danh Dự (Valerius) và Vệ Sĩ (Theron) yếu** (hạng 9.2 và 8.7) vì luật danh dự / hộ tống khá gò bó.
- **Combo dựng tự động theo loại chiêu**. Chưa có combo "đặc trưng" viết tay cho từng tướng như bản Di sản (ví dụ Ryoma BC tầm xa). Nếu bạn muốn, tôi có thể thêm combo riêng cho vài tướng.
- **Thiên Mệnh làm đúng như yêu cầu: bất tử 90s.** Rất mạnh nếu rơi vào cuối trận. Nếu thấy quá tay có thể rút xuống 9–15s.
- **Kền kền chỉ còn 8% số mạng** (mục tiêu 20–30%). Liên minh và combo làm giao tranh ngắn, ít cơ hội ăn hôi.
- **Liên minh chỉ có 2 người**, chưa có nhóm 3.

## 4. Con số khởi điểm mới / đã đổi

| Con số | Giá trị |
|---|---|
| Bình | nhỏ / vừa / to: máu 20 / 35 / 55%, uống 1.4 / 1.8 / 2.3s; mana 25 / 45 / 70%, uống 1.0 / 1.3 / 1.7s; tối đa 3 + 3; đi chậm ×0.55 khi uống |
| Mảnh hồn | số dòng 1 / 2 / 2 / 3 / 4; dòng phụ 60%; may mắn +bậc, hồi chiêu −1% × bậc mỗi mảnh |
| May mắn | +0.4% chí mạng / điểm; rương +1.5% / điểm ra món thứ 3; quái +2% / điểm; thính Đỏ +1% / điểm (2 thính cuối) |
| Đặc năng | Lưu Vân hồi 10s; Thiên Mệnh hồi 400s, bất tử 90s; Tuyệt Kỹ Nộ ×2 trong 3.5s, hồi 60s; Uống Máu 80%; Vận Mệnh 40% máu |
| Liên minh | phút 1.5–25; kéo dài 210s; tối đa 2 lần / tướng; tan khi ≤ 4 người hoặc đánh trúng nhau ≥ 15% máu |
| Combo | ≥ 2 bước, tối đa 4; nghỉ 0.08–0.3s; gom chiêu chờ tối đa 1.2s |
