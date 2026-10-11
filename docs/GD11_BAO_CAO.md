# GĐ11 — Bộ não chiến đấu, bo độc, quái lang thang, Luca & Alice, Phòng thử nghiệm Sandbox

Yêu cầu:
- "Tiếp tục làm phần AI còn thiếu trong tài liệu."
- "Tất cả yêu cầu điều đồng ý."
- "Làm thêm theo tài liệu tôi mới gửi."
- "Tôi muốn các AI thông minh tận dụng tối đa bộ skill của mình."
- "Tất cả thay đổi phải ghi vào THIET_KE.md, sao cho đọc là biết game vận hành sao, có những gì."

Thêm giữa chừng: "Trong Sandbox có thể ra lệnh đứng yên không làm gì; thêm lệnh chỉ dùng một skill nào đó."

Commit: 5ce11b6, 8a9e322, 53ca7f2, 961051c, ea5bfce và commit cuối (lệnh Sandbox, cân bằng, tài liệu, báo cáo).

## 1. Đã làm gì

### Bộ não chiến đấu (`src/sim/ai/combat_brain.js`)
Có 13 mô-đun; chi tiết ở THIET_KE.md mục 13m.

- **Phân loại kỹ năng.** Mỗi chiêu được tự động gắn nhóm: sát thương, cơ động, khống chế, phòng thủ hoặc phản đòn. Ngoài ra còn các vai phụ: lướt áp sát, lướt thoát, khống chế cứng/mềm, đẩy văng, khiên, chặn đạn…
  - AI chọn chiêu theo vai này, không theo vị trí ô chiêu.
- **Kỷ luật bình máu.** AI không uống khi:
  - đang bị đánh, hoặc trong tầm nhìn/tầm đe dọa của địch mà không có vật cản;
  - đang ở ngoài bo;
  - đang Solo mà đối thủ còn hơn 2s khống chế.
- **Đường Cùng Phản Sát.** Khi máu dưới 25% và không thoát được, AI quay đầu đánh tới cùng.
- **Suy luận hướng đòn.** Bị đánh từ góc khuất thì xoay mặt về hướng đó, bắn trả mù, hoặc né theo trục đạn. Kẻ vừa đánh lén được ưu tiên trả đũa.
- **Chống thả diều.** Lướt chéo 45° để áp sát, rồi nối ngay khống chế.
- **Solo 1v1 theo máy trạng thái.** Có lực hút về tâm sàn và lực tách thân.
- **Ép bo:**
  - gác cổng ở mép trong bo;
  - khóa chân kẻ đang đứng ngoài bão;
  - đẩy văng kẻ đứng sát mép ra ngoài bo (ring-out);
  - ngoài bo thì không uống bình mà lướt vào.
- **Liên minh vĩnh cửu Luca ↔ Alice.**
  - Hai người không bao giờ đánh nhau; chỉ khi còn đúng 2 người mới phân thắng bại.
  - Khi người kia giao tranh trong 35 đv thì tới bọc lót; Luca mở Sân Khấu để chia lửa.
  - Khi rảnh thì đi cùng nhau.
- **Luật snapback chung** (Luca S3, Kip S1/S2):
  - giật về điểm neo khi điểm neo nằm trong bo mà mình đang ở ngoài;
  - giật về khi máu thấp và điểm neo an toàn hơn;
  - giật về khi bị đuổi sát lúc chiêu sắp hết hạn;
  - ngoài các trường hợp trên thì không dùng.
  - Luca S4 chỉ đổi chỗ khi có lợi (ring-out, có nhánh choáng, hoặc nạn nhân ở xa).
- **Canh boss theo tính cách.**
  - Cửa sổ kết liễu: khi sát thương sẵn có (kể cả Trừng Phạt) đủ hạ boss thì xả hết.
  - Kền kền đứng ngoài chờ boss xuống dưới 20% máu.
  - Sát thủ đánh kẻ đang tranh boss.
- **Kỷ luật âm thanh khi farm.** Nghe thấy địch trong 35 đv thì không đốt chiêu lướt lên quái và giữ mana ≥ 40%.
- **Gắn hành vi theo nhánh tiến hóa đã chọn:**
  - nhánh "sau lưng" → đi vòng ra sau mục tiêu;
  - nhánh "phản đòn" → luôn đọc đòn;
  - nhánh "mũi kiếm" → giữ cự ly ngọt;
  - nhánh "kết liễu" → ưu tiên mục tiêu máu thấp.
- **Ảo ảnh lừa đảo.**
  - Chủ bỏ chạy thì ảo ảnh chạy hướng ngược lại.
  - Ảo ảnh máu thấp thì giả vờ tháo chạy.
  - Khi đánh, ảo ảnh lạng trái/phải.

### Bo độc
- **Ăn Mòn:** mỗi giây ở ngoài bo được +1 tầng, tối đa 15 tầng. Mỗi tầng gây thêm 0.4% máu tối đa sát thương chuẩn mỗi giây. Chỉ xóa sau khi ở trong bo liên tục 3s.
- **Vết Thương Sâu:** ngoài bo mọi hồi máu giảm 65%.

### Quái
- Dây xích rộng hơn và quái kiên nhẫn hơn trước khi bỏ đuổi.
- 45% bãi quái nhỏ thành **bầy có đầu đàn**: cả bầy đánh theo mục tiêu của đầu đàn.
- **Quái lang thang** gồm 3 phe với 10 loại quái, mỗi loại có bản tinh anh:
  - 💀 Binh Đoàn Xương;
  - ☣ Quái Vật Tận Thế;
  - 👻 Ma Hội.
- **8 boss nhỏ**, mỗi con có 2 kỹ năng kèm vùng cảnh báo.
- Tiếng đánh quái vang 35 đv. AI có thêm hành động "Săn quái lang thang".

### Luca bản mới theo tài liệu
- Náo Nhiệt tụt 5 điểm/giây sau 6s ngoài giao tranh.
- +3% SMPT mỗi 10 điểm Náo Nhiệt (trước đây bị giảm một nửa).
- Trò Lừa Bịp triệt tiêu cả khống chế, không chỉ sát thương.
- Khi Cải Trang thành tướng vật lý: 1 SMPT đổi thành 0.65 SMVL.
- Chỉ số được tăng, vì Luca đang đứng cuối bảng.

### Phòng thử nghiệm Sandbox
Vào từ màn hình chính → 🧪.

- **5 loại bù nhìn**, cộng thêm đối thủ là tướng thật:
  - Bao Cát (đo DPS);
  - Siêu Giáp (1500 Hộ Giáp, hoặc 100 giáp);
  - Máy Xả Đạn, 3 chế độ: tỉa / liên thanh 20 viên / cầu chậm;
  - Thả Diều;
  - Ẩn Thân.
- **Không ai chết:** về 0 máu thì được hồi đầy.
- **Bảng điều khiển:**
  - Bất Tử, Không Hồi Chiêu (F1), Vô Hạn Tài Nguyên (F2);
  - nhảy cấp (F3), đổi tướng tại chỗ (F4);
  - lớp vẽ hitbox / nón nhìn 180° / vòng tầm (F5);
  - tốc độ 0.1x–2x (F6);
  - Lồng Solo 14 đv, bo giả lập.
- **Bảng đo:**
  - DPS 1s, DPS chuỗi, đòn cao nhất;
  - phân rã Vật Lý / Phép / Chuẩn / Hộ Giáp / Khiên;
  - đồng hồ khống chế;
  - nhật ký từng đòn `[mm:ss.cs]`.
- **Mới theo yêu cầu: lệnh cho tướng thử**
  - 🤖 AI tự đánh;
  - ⏸ **Đứng yên, không làm gì**;
  - 🗡 Chỉ đánh thường;
  - **S1 / S2 / S3 / S4 / chiêu phụ — chỉ dùng đúng chiêu đó.** Tướng tự tiến vào tầm rồi tung chiêu, không đánh thường; kết hợp Không Hồi Chiêu để spam.
- **5 kịch bản kiểm thử:**
  - điểm ngọt Gideon;
  - bắn xuyên vách Vector;
  - Kip nuốt 20 viên đạn;
  - tích tầng 30s;
  - Luca giật về đóa hồng và ảo ảnh Alice.
  - Chạy được trong giao diện hoặc bằng `node tools/sandbox_test.js`.

### Đồ họa
- Vẽ **cờ chiến Victoria** (trước đây thiếu).
- Vũ khí riêng cho:
  - Mirage: đũa phép + mũ chóp;
  - Dahlia: Gậy Đen;
  - Lyra: trượng thủy triều;
  - Olivia: Trượng Quang;
  - Kip: phi đao hư không.
- 8 loại đạn đánh thường mới; tướng không còn dùng chung "sao" hay "đạn".
- Đòn cận chiến riêng cho 13 loại vũ khí.
- Mỗi tướng có dấu ấn tung chiêu riêng (hạt và vầng sáng màu riêng).

### THIET_KE.md
- **Mục 0 mới: Tổng quan.** Gồm:
  - bạn là ai và chơi để làm gì;
  - các chế độ chơi;
  - dòng thời gian một trận;
  - AI nghĩ thế nào;
  - bảng "hệ thống → mục → tệp mã".
- Thêm các mục 7b, 13m, 13n, 13o, 20; thêm bảng vũ khí theo tướng.
- Toàn bộ vẫn sinh từ mã. `--kiemtra` khớp.

### Cân bằng
Người dùng đã đồng ý cân bằng cả tướng cũ.

- **Giảm:**
  - Ryoma: công 60 → 57, máu 560 → 540;
  - Bạch Diệp: máu 580 → 550;
  - Florian: công 63 → 60.
- **Tăng:** Ratok, Koda, Jack, Victoria, Luca.

## 2. Đo đạc
Số liệu từ 48 trận sau cân bằng (`docs/GD11_MO_PHONG.txt`). Tỷ lệ cược được tạo lại từ 96 trận.

- **Thời lượng trận:** trung bình 34.5 phút; 75% số trận dài 30–40 phút; 0 trận hết giờ. Có 0 lỗi trong trận và mô phỏng giữ được tính tất định.
- **Giao tranh:** 16.6 lần hạ gục mỗi trận. Thời lượng giao tranh: trung vị khoảng 26s, 90% dưới khoảng 90s.
- **Hành vi mới mỗi trận** (đo trên vài trận):
  - Đường Cùng: khoảng 10–20;
  - chống thả diều: 5–13;
  - bắn trả mù: 1–5;
  - snapback: khoảng 4 (khi có Luca/Kip);
  - cửa sổ kết liễu boss: 1–3;
  - kền kền chờ boss: 1–5;
  - bọc lót Luca ↔ Alice: 0–23, tùy trận có cả hai hay không.
  - Sát thương giữa Luca và Alice: 0 trong 2/3 trận. Trận còn lại có 143, do đánh lan khi chỉ còn ít người.
- **Quái lang thang:** khoảng 35 con và 1.5 boss nhỏ bị hạ mỗi trận.
- **Luca** (thử riêng 6 trận): hạng trung bình từ 7.8 lên 6.3. Trên 48 trận chung: 7.5.
- **Sau cân bằng:**
  - Ratok: hạng 8.8 → 7.0;
  - Koda: 8.3 → 7.3;
  - Jack: 8.2 → 7.5;
  - Victoria: 7.8 → 6.0;
  - Ryoma: hạng 3.8 → 5.3, nhưng tỷ lệ vô địch vẫn 43%.
  - Mỗi tướng chỉ có 6–15 trận nên số liệu còn nhiễu.
- **Sandbox:** 5/5 kịch bản đạt. Thử trên trình duyệt: không có lỗi JS.

## 3. Chưa xong
- **Ring-out và khóa chân ngoài bão** hiếm xảy ra (khoảng 0 lần/trận), vì cần đúng tình huống: kẻ địch sát mép bo và mình có chiêu đẩy văng.
- **Kền kền ăn mạng** chỉ chiếm 4–6% số mạng (mục tiêu 20–30%), do kỷ luật bình máu và Đường Cùng làm giao tranh dứt khoát hơn.
- **Tỷ lệ vô địch** của Florian, Ryoma, Bạch Diệp và Ariston vẫn cao (40–57%, mẫu nhỏ). Ignatius, Justus và Death tụt xuống cuối bảng. Cần đo nhiều trận hơn trước khi chỉnh tiếp.
- **Sandbox:**
  - kịch bản xuyên vách phụ thuộc bản đồ: bù nhìn sau vách vẫn bị "thấy";
  - kịch bản phản đạn: Kip nuốt đạn nhưng không dội ngược, vì kit Kip không có cơ chế này.
- **Lệnh "chỉ dùng skill"** áp cho tướng thử, chưa áp cho đối thủ tướng thật.

## 4. Con số khởi điểm mới
- Thời lượng trận: **34.5 phút**.
- Giao tranh: **16.6** hạ gục/trận; **4.1** boss lớn bị hạ/trận; **0.6** người chết trong bo/trận.
- Bình máu: **~90** bình/trận; **~8** lần bị ngắt khi uống.
- Hạng trung bình: **Luca 7.5**, **Ratok 7.0**, **Koda 7.3**.
- Tỷ lệ cược: tạo lại từ **96** trận.
- Tổng: **40 tướng**, **181+ chiêu** đã phân loại, **5/5** kịch bản Sandbox đạt.
