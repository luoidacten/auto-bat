# Báo cáo GĐ12 — Làm lại tướng, AI chiến thuật mới, chế độ PvE Sinh Tồn

## 1. Đã làm gì
**Tướng làm lại**
- **Clint** (súng săn gác cổng): băng khóa 2 viên, ô băng dư quy ra +18% SMVL; nón đạn ×1.5 khi ≤ 1.8 đv, ×0.8 ở mép, 35% lan, đẩy 0.5 đv; S1 báng súng choáng + chậm + hoàn 1 viên; S3 nổ chân + vùng lửa + nhảy 4–8 đv nạp 1 viên; S4 2 viên đạn rồng nón 90° 6/12/18 đv, phá 30% Hộ Giáp.
- **Ignatius** (pháo binh): Hỏa Ấn cộng dồn vô hạn, mỗi bội 6 tầng phát nổ (−25% kháng phép 4s); S1 tầm 10; S2 tích 2s tầm tới 20–50 đv; S3 tích trữ 2–4 lần; S4 Thiên Thạch 20 đv chọn tâm đông địch nhất; AI pháo kích 10–15 đv, ném mù S2 theo tiếng giao tranh.
- **Florian** (đấu kiếm): Đâm Lao 3.5s tự khóa ấn chưa vỡ + lướt nhỏ 1 đv; mỗi ấn vỡ −1.5s hồi chiêu, chậm 60%, 5% máu chuẩn, hồi 0.5%; mốc 2/4 choáng 0.25s, mốc 4/4 25% máu chuẩn + hồi 5% + đòn kế +40% đẩy 3 đv; Phân Ảnh xuất hiện đối diện 8 đv rồi lao ngược phá ấn bên kia; Lướt 0 hồi chiêu (chỉ trong 1.5s sau Đâm Lao/chiêu); vòng Tứ Ấn 4 cung; tính cách Kẻ Trảm Tướng.
- **Mirage**: S3 Hộp Tử Thần 6.5 đv, đặt xa 8 đv, nổ sau 2.2s, sát thương ×1.5 + choáng 1.25s; combo S2 trúng → S3 dưới chân → S2 đổi chỗ ném nạn nhân vào tâm; S4 phân thân mang trang bị & mảnh hồn, tự dùng Phi Dao / Hộp Tử Thần thu nhỏ.
- **Dahlia**: mọi ảo ảnh tự đánh 35% kiểu đánh-rồi-lùi; không biến được vật triệu hồi cấp cao / boss (chỉ gây sát thương lớn); S4 Sân Khấu Chết Chóc 10/15/20 đv trong 16/20/25s, thấy rõ vòng; Hư Ảnh Bước nổ ở điểm đầu và cuối; mũ chóp cao rơi từ trời.
- **Luca**: tướng cận chiến (khung đấu sĩ phép, gậy ba toong); trong Sân Khấu S1 hồi 0.6s + nổ hoa khi tiếp đất; cố đánh trong vùng; cải trang mang hình dạng nạn nhân, phối hợp chéo hai bộ chiêu, giật về sớm khi an toàn ở 13.5–14s, ở lại nếu nạn nhân < 20% máu.
- **Chrono & Neo**: S4 hai vòng đạn bay thẳng chia góc đều xoay dần (theo Nộ Liên Hoa bản Di sản); thân đổi màu theo dạng; S2 có vòng khóa trên mục tiêu.
- **Aria**: ba nốt hồi chiêu độc lập (chặn bấm liền 1.2s).

**AI mới** (`src/sim/ai/tactics12.js`) — Pháp Sư Sát Thủ (FSM 4 trạng thái, đọc vị mục tiêu, cửa sổ hụt chiêu), ngắm đón đầu + sai số người thật, check bụi, chiêu vu vơ, tường sau lưng (trượt tiếp tuyến, kẹt góc lướt xuyên địch), lướt vừa đủ, kỷ luật bỏ chạy 5–10% + Tử Thủ, snapback né chiêu lớn, đâm sau lưng sau hoán vị, Kazuki chọn nhịp, Ryoma ghép cặp + Kiếm Khí chém đạn, Dahlia đổi chỗ thoát thân, gom cụm có trọng số cho chiêu vùng.

**Luật chung**: nạp đạn trễ 1–1.6s sau khi bắn, trúng đòn ngắt nạp; va chạm cứng (không xuyên / dính nhau) + lực trượt ngang.

**Chế độ PvE Sinh Tồn**: người chơi điều khiển 1 tướng, đường thực thi thống nhất với AI; chỉ thị Đường / Nón / Vòng rơi, chạm nhanh, ô hủy, nam châm ngắm 12°, camera đẩy, nút đánh thường thông minh (chạm / kéo khóa), bánh xe balo, cần ảo nổi, PC giữ-nhả phím + mép chuột; tầm nhìn như người chơi thường + chỉ báo âm thanh; bị loại → góc nhìn trọng tài.

**Hình ảnh**: dao Alice, ảo ảnh bắn đúng đạn tướng gốc, lốc Thanh Phong, Galo hóa thú, sân khấu rèm nhung, mũ cao, cánh hoa, xoay theo chiêu xoay (vũ khí chìa đối diện), hai vũ khí luân phiên, bóng đổ mềm, viền sáng, chớp trúng đòn mượt.

**Sandbox**: hàng lệnh riêng cho đối thủ tướng thật.

## 2. Đo đạc
- Tất định: hai lần chạy giống hệt • 5/5 kịch bản Sandbox đạt • THIET_KE.md khớp mã.
- 48 trận (giữa phase): 35.4 phút/trận, 16.9 mạng/trận, 0 lỗi.
- 24 trận (bản cuối): **34.0 phút/trận** (71% trong 30–40), **16.9 mạng/trận**, giao tranh giữa 24s, kền kền 8%, 0 lỗi.
- Thử PvE tự động 3 tướng: 0 lỗi; ảnh chụp giao diện (PC + cảm ứng giả lập): 0 lỗi trang.

## 3. Chưa xong
- Cân bằng: Luca cận chiến vẫn yếu (hạng 8.8); Florian mạnh (vô địch 56%/9 trận); Aria hay sống sót top 3 nhưng ít vô địch.
- Ring-out vẫn hiếm. Kền kền 8% (mục tiêu 20–30%).
- Bản thử nhỏ, số liệu từng tướng còn nhiễu.

## 4. Con số khởi điểm mới
34.0 phút/trận • 16.9 mạng/trận • giao tranh giữa 24s • 0 lỗi • 5/5 kịch bản Sandbox.
