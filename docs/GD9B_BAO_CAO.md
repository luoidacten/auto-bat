# GĐ9b — Nhà cái & đặt cược (vòng chơi chính) + Thương Nhân / Kẻ Bịp Bợm

Yêu cầu (tóm tắt):
- "Game play chính chưa có nhà cái và đặt cược" → làm vòng chơi chính theo GDD "Kẻ Đặt Cược" (mục 2–7): run nhiều chặng, chỉ tiêu, tỷ lệ cược, câu hỏi của nhà cái, Giao Kèo, can thiệp bằng tiền, charm / quà / vay, người của nhà cái, thanh bực bội ẩn, kết thúc run.
- AI trao đổi khi liên minh **hoặc theo tính cách**, bịp nhau nếu là liên minh tạm **và tùy tính cách**; thêm 2 tính cách **Thương Nhân** và **Kẻ Bịp Bợm**.

## 1. Đã làm gì

### Vòng chơi: ván cược (`src/sim/bookie.js` — G.Run, `src/ui/bet_ui.js`)
- Màn hình chính: **🎲 Ván cược mới** / **▶ Tiếp tục ván cược** (lưu trên máy) / 👁 Xem trận tự do (không cược) / mô phỏng nhanh.
- Ván = **3 chặng × 3 trận**, bắt đầu với 1.000 tiền.
  - Hết chặng phải **có** 900 / 1.300 / 2.000 tiền (kiểu "mốc điểm", thiếu là vỡ nợ).
  - Chặng cuối trả hết nợ 2.000 + mọi khoản vay → **tự do**.
- Chọc giận nhà cái nhiều (bực ≥ 6) thì trước khi đi phải qua **trận của nhà cái**: đủ 4 người của hắn trong trận, hết trận phải còn ≥ 2.000.
- Màn chờ giữa trận có:
  - nhà cái (🎩 + nét mặt 😏 / 😒 / 😠 thay cho thanh bực bội ẩn);
  - tiền, chặng, chỉ tiêu, nợ còn phải trả;
  - 5 ô charm;
  - **📖 Nhật ký nhà cái** (ai là người của hắn, ai bị thổi phồng, tin đồn nào giả);
  - luật chơi.

### Trước trận
- 10 tướng kèm tính cách, **sức mạnh do nhà cái ước** (có sai số) và **tỷ lệ cược** cho Sống tới cuối / Top 1 / Top 3.
- 3 **tin đồn**, có tin giả.
- Câu đầu (chọn 1):
  - 🛡 **Ai sống tới cuối?** — đồng hạng vẫn thắng nên tỷ lệ thấp hơn;
  - 👑 **Top 1** — chữ nhỏ: *đồng hạng 1 không được tính là Top 1*;
  - 🥇 **Top 3** theo thứ tự: ×6 / ×3 / ×2 / ×1, nhân độ khó; chọn toàn cửa trên thì giảm một nửa và nhà cái bực.
- **📜 Giao Kèo N câu** (N = 4 / 5 / 6 theo chặng):
  - N câu tiếp theo trong trận đều đúng → ×10 tiền giao kèo + tiền thắng các câu đó;
  - sai một câu, kể cả bỏ qua, là mất sạch; không hủy được;
  - câu trong giao kèo ở dạng **dễ hơn về xác suất** (có / không, thêm cửa "không ai gục"…) nhưng **hay gặp điều khoản chữ nhỏ** hơn — đúng tinh thần GDD.

### Giữa trận
Nhà cái **dừng trận** để hỏi, camera chạy tới chỗ đang có chuyện:
- ⚔ **Ai thắng?** — hai tướng đã nhắm nhau. Thắng = còn sống sau 40s mà đối thủ đã gục; cả hai gục → mọi cửa thua; cả hai chạy thoát → hủy kèo (hoàn tiền).
- 👑 **Ai giết được boss này?**
- 📦 **Ai lấy được thính?**
- 💀 **Ai bị hạ tiếp theo?**
- 🦅 **Kền kền có xuất hiện không?**

Nhịp hỏi:
- Sớm nhất giây 150, cách nhau ≥ 75s, tối đa 6 câu, giới hạn số câu mỗi loại.
- **Điều khoản chữ nhỏ** luôn ghi ra (chữ nhỏ, mờ). Charm Đọc Chữ Nhỏ tô đỏ.

Trong trận còn có:
- **💸 Can thiệp**: gọi thính 300 / hồi sinh boss 400 / thu bo 250.
  - Giá ×1.5 mỗi lần trong trận, tăng theo mức bực.
  - Đang có kèo mà can thiệp = **"Phô Mai"** — nhà cái không phạt nhưng bực.
  - Mọi can thiệp được ghi lại theo nhịp logic → **🔁 Xem lại trận** diễn ra y hệt.
- Thanh cược (💰, giao kèo n/N, số kèo đang mở) và 🎟 trên tướng mình đang cược.
- Biểu ngữ thắng / thua / hủy kèo; lời thoại nhà cái.

### Sau trận
- Xếp hạng, **lộ người của nhà cái (🎩)**, từng kèo thắng / thua / hủy, giao kèo, charm tác động.
- **Cửa hàng**:
  - 3 charm, mua tối đa 1 — tổng 12 charm thường: Mắt Kền Kền, Lưới An Toàn, Bảo Hiểm Giao Kèo, Lật Câu Hỏi, Đọc Chữ Nhỏ, Tình Báo, Phô Mai Hảo Hạng, Kính Lúp, Tay Trong, Đồng Xu May Mắn, Ống Nhòm, Két Sắt;
  - **quà của nhà cái** có mặt trái giấu kín: Ân Huệ, Món Quà Nhỏ, Lời Hứa Ngọt;
  - **vay** 500 / 1.000 / 2.000 (trả ×1.3), mỗi lần vay nhận 1 charm xấu ngẫu nhiên: Xiềng Nợ, Mắt Mờ, Bàn Tay Nhờn — chỉ gỡ khi trả nợ.
- Thoát giữa trận = bỏ trận, tiền đã cược mất. Muốn ra sớm thì dùng "tua nhanh": mọi câu còn lại bị bỏ qua.

### Nhà cái nói dối (nhưng công bằng)
- Sức mạnh ước lượng sai số ±15% (Mắt Mờ ±30%; Kính Lúp hiện số thật).
- Mỗi trận **thổi phồng** một tướng cửa dưới: sức mạnh ×1.5, tỷ lệ ×0.8 — trông như cửa trên.
- Tin đồn giả.
- Tỷ lệ của người nhà cái chỉ rút ngắn ×0.75, chưa đủ bù lợi thế liên minh của họ → **đọc ra người của nhà cái thì có lời** (nhất là kèo "Sống tới cuối"; "Top 1" thì vướng chữ nhỏ đồng hạng).
- Mọi lời nói dối được ghi vào nhật ký sau trận.

### Người của nhà cái trong đấu trường (`src/sim/house.js`, `persona.js`)
- Aria, Percy, Elara, Koda.
  - Số người mỗi trận: 0 – (1 + chặng); +1 khi bực ≥ 4, +1 khi bực ≥ 7, +1 khi dính quà Ân Huệ.
  - Từ chặng 2, nhà cái có thể mua chuộc thêm một tướng khác.
- Họ **liên minh lâu dài, không báo cho ai**: lướt qua nhau không đánh, không làm kền kền nhau, chung tầm nhìn, đổi đồ thật thà.
- Liên minh vỡ vì **lòng tham**:
  - thính rơi giữa hai người (tùy tính cách);
  - bo cuối ép sát nhau;
  - chỉ còn toàn người của nhà cái;
  - trúng nhầm nhau quá đau.
  - Dòng sự kiện hiện "⚡ X bất ngờ trở mặt với Y".

### Tính cách mới & trao đổi theo tính cách (`personality.js`, `persona.js`)
- ⚖ **Thương Nhân** (Roxie):
  - gạ **đình chiến mua bán** với bất kỳ ai gặp trên đường;
  - mua mảnh người ta không cần (60%), bán mảnh người ta cần (130%), bán vật phẩm balo;
  - mang **kho hàng** 4 mảnh;
  - không bao giờ bịp.
- 🎭 **Kẻ Bịp Bợm** (Joker):
  - gạ đổi chác / liên minh với bất kỳ ai để **bán mảnh dỏm** (rao bậc cao hơn, đòi giá cao), đổi gian, báo tin giả dụ người ta vào bẫy của mình;
  - ai từng bị lừa thì không tin nữa.
- Người được gạ nhận lời tùy tính cách: Hòa Bình / Thực Dụng 90% … Võ Sĩ 20%, Cuồng Tín 10%.
- Thực Dụng và Con Bạc Khát Nước tạm chưa có tướng — để dành cho 7 tướng mới GĐ10.

## 2. Đo đạc
- Người chơi máy (`tools/cuoc.js`, mỗi trận một ván mới, cược 100 mỗi câu):
  - ngẫu nhiên: nhà cái giữ ~39% tiền cược;
  - "đọc vị" (biết người nhà cái, tránh tướng bị thổi phồng, cửa trên): nhà cái giữ ~5%;
  - giao kèo trọn vẹn 1/8 khi ký mọi trận.
- Người của nhà cái vô địch ~10–29% mỗi lượt có mặt (kỳ vọng thường ~10%).
- Ván trọn vẹn bằng máy "đọc vị" (`tools/van.js`, 12 ván mỗi lần, `docs/GD9B_MO_PHONG.txt`):
  - lúc đầu (chỉ tiêu nộp thẳng 2.000 / 4.500 / 9.000) thua 6/6 ván;
  - qua 4 lần chỉnh, bộ số cuối **1/12 ván tự do**;
  - phần lớn ván qua được chặng 2 nhưng vay để qua chặng nên cuối ván không trả nổi nợ vay;
  - máy không đọc được tính cách / suy nghĩ AI như người xem nên đây là cận dưới.
- Luồng giao diện chạy thử trên trình duyệt (Playwright): menu → ván mới → trước trận → câu hỏi (cả dạng giao kèo) → can thiệp → tua nhanh → sau trận → cửa hàng → trận kế — **0 lỗi**.
- Lõi trận: người của nhà cái + can thiệp + **xem lại giống hệt** ✔. Trận tự do (không cược) vẫn tất định.

## 3. Chưa xong
- **Người triệu gọi & đồng điệu** (GDD mục 9), câu "Nó có nghe lệnh không?", "Kính Đồng Điệu" — chưa làm (cần hệ người triệu gọi).
- Tỷ lệ giữa trận dựa trên sức mạnh × máu; cân lại theo số liệu chơi thật.
- Chỉ tiêu mới là số khởi điểm — người chơi máy còn yếu hơn người thật (không đọc được tính cách); cần người chơi thử để chỉnh.
- Ryoma vẫn quá mạnh (chờ đồng ý giảm sức mạnh).

## 4. Con số khởi điểm mới
- Vốn 1.000; mốc chặng 900 / 1.300 / 2.000 (chặng cuối trả 2.000 + tiền vay); trận của nhà cái khi bực ≥ 6, cần còn ≥ 2.000.
- Phần nhà cái 8% (+1.5% mỗi mức bực); câu giữa trận ×0.6 phần đó; người của nhà cái chỉ bị rút ngắn tỷ lệ ×0.9.
- Giao kèo 4 / 5 / 6 câu, ×10.
- Can thiệp 300 / 400 / 250, ×1.5 mỗi lần.
- Cược tối thiểu 50; 5 ô charm; vay ×1.3.
- Thương Nhân mua 60% / bán 130%; Kẻ Bịp Bợm bán dỏm = giá bậc cao hơn × 1.2.
