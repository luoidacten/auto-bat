# Báo cáo Giai đoạn 3.5 — sửa theo góp ý (bản đồ, bộ chiêu bản cũ, hiệu ứng, AI giao tranh, chỉ đạo, nhịp trận)

## Đã làm

### 1. Bản đồ rộng và đẹp hơn
- Bản đồ phóng **1.6×** (120 → **192 đv**), mọi toạ độ và ngưỡng khoảng cách cấp bản đồ của AI nhân theo. Lòng đường rộng **10.4 đv**.
- Lính đi thành **hàng ngang** trong lòng đường (cận chiến 2 hàng, tầm xa phía sau, xe ở giữa).
- **Lính hết đuổi bất chấp**: lính bỏ tướng chạy xa đường quá 6 đv và quay về đường (2s không nhắm tướng).
- Va chạm mềm theo khối lượng: tướng, lính, quái không còn chồng lên nhau thành một cục.
- Vẽ nền mới: cỏ loang theo rừng, đường đất có vệt bánh xe và viền đá, sông có bờ cát/đá/lau sậy và gợn nước động, vách đá + rặng cây
  có bóng đổ, bụi rậm nhiều lớp, hang quái lát đá có phù văn, bãi quái có vòng đá, nhà chính lát gạch. Nền vẽ **theo ô 16 đv đúng độ phân giải
  của mức phóng** → phóng to vẫn sắc nét; ảnh tổng quan dùng cho bản đồ nhỏ.
- Trụ vẽ lại (bệ bát giác, thân đá xây, pha lê phe phát sáng, chấm bậc trụ, sập thành đống đổ nát), nhà chính (pha lê lớn trên bệ, vòng phù văn
  xoay, mảnh pha lê bay quanh), lính (mắt nhìn theo hướng, kiếm + khiên / gậy phép + quả cầu, xe công thành có bánh và nòng pháo).

### 2. Bộ chiêu bản cũ — không còn cắt xén
Chiêu D của bản cũ bị gộp vào nội tại nay là **skill phụ chủ động**, kèm AI dùng đúng lúc:

| Tướng | Khôi phục |
|---|---|
| Valerius | **Cuồng Phong**: +45% tốc chạy 1.5s + chém vòng quanh người, làm chậm 30% |
| Gideon | **Cán Kiếm**: húc cán (tầm cực gần) choáng 0.4s, đẩy địch ra đúng tầm mũi kiếm — mở đường cho Bổ Dọc |
| Theron | **Quét Chân**: quét 360°, làm ngã 0.5s, ngắt chiêu đang niệm |
| Ignatius | **Vòng Lửa**: bùng vòng lửa đẩy kẻ áp sát 2 đv để có chỗ tích Đại Hỏa Cầu |
| Elara | **Tên Hình Nón**: 3 mũi tỏa nón đẩy lùi kẻ áp sát |
| Florian | **Lướt**: lướt rất ngắn mọi hướng, né mọi sát thương — AI dùng để vòng tới điểm yếu và né đạn |
| Kazuki | **Vô Tướng Nghịch Trảm**: thủ thế 0.6s đọc đòn → choáng, lướt xuyên, ảo ảnh chém liên hoàn, 2s sau nổ; **Kiếm Ý** và **Loạn Vũ Hư Ảnh** (5 ảo ảnh chém từ 5 hướng) |
| Koda | **Bám Tường** tách khỏi Vồ Mồi: bám lên vách/rặng cây 3s không thể bị chọn, lao xuống ×1.5 |
| Ryoma | 3 chiêu mỗi chiêu **2 lượt dùng** → đủ **6 biến thể Combo** AA / AB / AC / BB / BC / CC như bản cũ; **Kiếm Khí** (skill phụ, nạp từ Combo) **phá đạn** đối thủ |
| Aria | 3 kiểu **Hòa Âm** bản cũ: Đỏ (Oktava dậm + Aria nổ 3 lần, lần cuối choáng) • Xanh (3 sóng: chậm → trói → mê hoặc) • Vàng (Oktava dậm xuống đẩy lùi cực mạnh, khiên kèm Hồi Phục); Nốt Xanh không thể bị chọn + thanh tẩy |
| Alice | Ảo Ảnh kèm **tàng hình + lướt đi**; chiêu cuối đủ 3 biến thể: Chương Trình Thoát Hiểm, Vạn Biến, **Mạo Hiểm (Hộp Ảo Thuật phản đòn ×2)** |
| Roxie | **Gia Công** (ghép Mảnh cơ giới từ bánh răng) + **T-Zero tự hành chiến đấu** khi không lái; Tự Hủy |
| Galo | Thú: **Tiếng Hú Tử Thần** (choáng diện rộng); Người: nhảy lùi **xả khói độc** che mắt + tăng tốc; Thú: gầm choáng rồi vồ |
| Raven | Bắn Tỉa: bị áp sát thì **lăn lùi** rồi mới bóp cò |
| Joker | **Giả Ngây Ngô** (né đòn tướng nam: cục súc 30%, lão luyện 10%, còn lại 16%, tướng nữ 3%), **Thần Chết Bịp Bợm** 0.2% |
| Percy | Liên Châu bắn **3 mũi** mỗi phát như bản cũ |
| Death | Gọi Hồn hiện **2 bóng ma đối xứng** chém theo |

Các tướng còn lại (Borg, Wukong, Clint, Zero, Chrono & Neo, Jack, Victoria, Vesper, Diệp Thanh Phong) đã đủ chiêu bản cũ từ trước.
Lõi thêm: chiêu nhiều lượt dùng, hồi chiêu dạng hàm, đạn phá đạn, AI chiêu tuỳ biến cho từng tướng.

### 3. Hiệu ứng lấy lại từ bản cũ
Vệt chém trăng khuyết / đâm / lốc xoáy (`img/slash.png` + vệt sáng thon hai đầu), vụ nổ (`img/explosion.png`), bộ sprite Free (tia lửa trúng đòn,
tia nổ, vầng chấn động, đầu lâu, hào quang, phù văn, xoáy dịch chuyển, hoa hồi máu, mây khí), khói/bụi, **đạn hình ảnh**, hạt tàn lửa, **rung màn hình**,
chớp sáng, **chữ nổi & câu hô kiểu bản cũ** (Dụ đòn, Bắt bài!, Phá tụ lực!, Né đòn thủ, Cứu đồng đội, ĐỠ!, COMBO AB…).
Đánh thường cận chiến có vệt chém, súng có chớp nòng; vùng chiêu có hoạt cảnh (lửa lập lòe, mây độc, gió xoáy, lưỡi kiếm, mưa thương, hoa).

### 4. AI giao tranh như bản cũ — hết "bu một cục"
- Giữa hai đòn đánh thường **đi vòng quanh mục tiêu** ở cự ly riêng của từng tướng (đổi chiều sau 1–3s) thay vì đứng yên.
- **Đội hình**: tầm xa đứng về phía tuyến trước của đội, cận chiến **kẹp mục tiêu từ phía đối diện** đồng đội, dãn cách đồng đội ≥ 1.7 đv,
  tầm xa tránh tầm với của cận chiến địch, không đứng trong vùng chiêu của đối phương.
- **Đọc đòn**: kẻ địch vung đòn nặng / niệm chiêu vào mình → dùng chiêu đỡ/thủ thế hoặc lùi/bước ngang; đòn cận chiến **vung trượt** nếu mục tiêu kịp lùi.
- **Né vùng sắp trúng chiêu** (thiên thạch, pháo kích, dậm đất của quái lớn…).
- **Không đánh vào thế thủ** đối phương; **dụ đòn rồi bắt bài**; **phá tụ lực**; sát thủ **đánh xong lùi chờ hồi chiêu**;
  Vesper vòng ra sau lưng, Florian vòng tới điểm yếu; ưu tiên **cứu đồng đội** đang bị đánh.

### 5. Hỗ trợ đi lấy tầm nhìn
Mắt trinh sát mang theo người (hỗ trợ 2 lượt, người khác 1). Hỗ trợ lúc yên ổn **chủ động đi cắm**: cửa hang quái sắp xuất hiện, sông, cửa rừng gần
đường mình — tránh chỗ có trụ/tướng địch. Người khác đi ngang chỗ trống thì cắm.

### 6. HLV ra lệnh Ăn / Bỏ + chiến thuật mới
- **Thẻ hỏi trên màn hình trận** trước mỗi lượt quái lớn / quái cuối (≤ 30s hoặc vừa xuất hiện) và trước **giao tranh lớn** (≥ 3 địch tụ gần ≥ 3 người
  phe mình): **🍖 Ăn / 🙅 Bỏ / 🤝 Để đội tự quyết**, có đếm ngược; đang tua nhanh thì tạm về x1 cho kịp quyết. Bỏ = nhường mục tiêu 75s.
  Câu trả lời đi qua hàng lệnh → xem lại ván vẫn giống hệt. HLV máy cũng trả lời (chỉ khi thế trận rõ).
- **Chiến thuật cả trận** (chọn trước trận, đổi khi hội ý): **↔ Đẩy lẻ** (chọn người chia đẩy), **⚡ Đánh nhanh thắng nhanh**, **🌱 Phát triển**,
  **💠 Bảo kê chủ lực** (cùng Cân bằng). HLV máy chọn theo đội hình.

### 7. Nhịp trận: x1 ≈ 15–30 phút ngoài đời
Ở x1 một giây giờ game = một giây ngoài đời. Trận được kéo dài bằng: trụ/nhà chính bền hơn, giáp trụ theo bậc, gia cố đầu trận tới phút 10,
**trước phút 20 phải phá 2 trụ 3 mới đánh được nhà chính**, và AI **cử người về dọn lính** đang đẩy vào trụ không ai giữ
(trước đây lính — nhất là lính từ bùa Kẻ Chiêu Hồi — tự đẩy sập cả đường trong khi đội kia đứng ở chỗ khác).

## Số đo (ít mô phỏng như bạn dặn — cân bằng lớn để GĐ6)
Kết quả thô trong `docs/GD35_MO_PHONG.txt`. Mỗi lô chỉ vài chục trận nên sai số lớn — đủ để thấy xu hướng, chưa đủ để cân tướng.

| Mục tiêu | Kết quả | |
|---|---|---|
| x1 ≈ 15–30 phút ngoài đời | 24 trận: **trung bình 23.8 phút, trung vị 23.6** • dưới 15 phút **0%** • 15–20: 4% • 20–25: 54% • 25–30: 38% • quá 30: **4%** (≤ 35 phút) | ✔ |
| Hết bu cục khi giao tranh | khoảng cách tới đồng đội gần nhất **4.0 → 4.8 đv** • sát nhau < 1.2 đv **16% → 7%** • đứng yên giữa trận **17% → 4.5%** | ✔ |
| Bộ chiêu bản cũ chạy được, AI có dùng | mọi skill phụ mới được AI dùng trong trận (vd Kiếm Khí ~11 lần/trận, Lướt ~10, Cuồng Phong ~4, Vòng Lửa ~2, Bám Tường ~1); không lỗi | ✔ |
| Hỗ trợ đi cắm mắt | ~20–25 mắt mỗi đội / 25 phút, 4–5 mắt cùng lúc | ✔ |
| Câu hỏi Ăn/Bỏ | ~1 câu mỗi 1–2 phút (mỗi lượt quái + giao tranh lớn); HLV máy trả lời khi thế trận rõ | ✔ |
| Tất định & xem lại | `--kiemtra` ✔ (cả trận có câu trả lời Ăn/Bỏ) | ✔ |
| HLV máy vs không ai chỉ đạo / vs đội trưởng | **53.1% / 46.9%** (32 trận mỗi cặp, ±17%) — GĐ3 là 60.3% / 54.3% | ⚠ chỉ còn ngang tay — xem việc còn dở |
| Giao diện | đủ luồng HLV trên màn rộng và điện thoại ngang (844×390): chọn chiến thuật, thẻ hỏi Ăn/Bỏ, hội ý; không lỗi JS | ✔ |

## Các con số "khởi điểm" đã đổi
| Mục | Trước | Sau |
|---|---|---|
| Kích thước bản đồ | 120 đv | **192 đv** (×1.6) |
| Lòng đường | — | **10.4 đv**, lính đi hàng ngang |
| Lính đuổi tướng | không giới hạn | bỏ khi tướng ra xa đường **6 đv** |
| Máu trụ T1/T2/T3 | 2000 / 2350 / 2600 | **2900 / 3400 / 3800** |
| Giáp & KP trụ | 25 | **theo bậc 25 / 40 / 55** |
| Nhà chính | 3500 máu, giáp/KP 25 | **5000** máu, giáp/KP **60** |
| Điều kiện đánh nhà chính | 1 trụ 3 sập | **2 trụ 3 sập trước phút 20**, sau đó 1 |
| Gia cố đầu trận | tới phút 8 | **tới phút 10** |
| Lính mạnh dần chống giằng co | từ phút 25 | **từ phút 26** |
| Nhà chính tự mất máu | từ phút 30 | **từ phút 34** |
| Đòn cận chiến | luôn trúng khi đã vung | **trượt** nếu mục tiêu ra ngoài tầm + 1.2 đv lúc vung xong |
| Mắt trinh sát | chỉ có từ trang bị | hỗ trợ **2 lượt / 50s, mắt 100s**; người khác **1 lượt / 100s, mắt 70s** |
| Ryoma | 1 lượt mỗi chiêu; S1 55–175, S2 60–180, S3 40–140 | **2 lượt**; S1 **45–145**, S2 **50–150**, S3 **35–115** (bù cho 2 lượt) |
| Skill phụ mới | (nằm trong nội tại, tự kích) | Cuồng Phong 10s · Cán Kiếm 9s · Quét Chân 12s · Vòng Lửa 12s · Tên Hình Nón 10s · Lướt 6s · Vô Tướng 14s · Bám Tường 12s · Kiếm Khí 1s (theo lượt nạp) · Tiếng Hú 12s · Gia Công 3s |
| Aria | 15s giảm hồi chiêu cuối chỉ khi có nhánh 9a | mỗi Bản Nhạc **−6s** (nhánh 9a: −21s) |
| Joker | né 15% chỉ với nhánh 3c | Giả Ngây Ngô 30/10/16/3% (+15% với nhánh 3c); Ác Mộng 5% → **4.8%**, thêm Thần Chết **0.2%** |
| Percy Liên Châu | thêm 1 mũi | **thêm 2 mũi** (nhánh 9a: Trận Địa 4 mũi) |

## Việc còn dở / lưu ý
- **Cân bằng tướng chưa làm** (đúng như bạn dặn để GĐ6): bộ chiêu khôi phục + AI giao tranh mới + nhịp trận dài hơn làm tỉ lệ thắng từng tướng
  xê dịch; lô 24 trận sai số ±25–37% nên chưa nói được tướng nào mạnh/yếu. GĐ6 sẽ chạy mô phỏng lớn để cân lại và **làm lại bảng meta** (bảng meta
  cho AI cấm chọn hiện vẫn là số của GĐ3).
- **HLV máy chỉ còn ngang đội trưởng** (GĐ3 hơn ~4–10 điểm). Đã sửa hai lỗi lớn (lệnh tranh quái lớn kéo cả 5 người bỏ đường trên bản đồ rộng;
  người dọn lính bị lệnh rút đi / quá nhiều người tản ra dọn lính). Lệnh Lùi thủ và Tập trung hạ của HLV máy đang chấm âm — chỉnh ở GĐ6 cùng cân bằng.
- Bám Tường (Koda) AI dùng còn ít (~1 lần/trận) vì Koda hiếm khi đánh nhau cạnh vách; Vòng Lửa / Tên Hình Nón chỉ dùng khi bị cận chiến áp sát (đúng ý đồ).
- Chiến thuật mới đã chạy nhưng **chưa đo tương khắc** giữa chúng (để GĐ6, cùng với 3 nhịp đầu trận).
- Bản sửa tướng (đổi cơ chế, không chỉ chỉ số) như bạn nhắc vẫn để GĐ5.
- Hình nhân vật vẫn là quả cầu + vũ khí như bản cũ (đã có hoạt cảnh vung/đâm/xoay); nếu bạn muốn hình người chi tiết hơn thì nói mình làm thêm.
