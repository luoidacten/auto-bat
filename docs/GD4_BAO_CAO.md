# Báo cáo Giai đoạn 4 — Tuyển thủ, lịch tập, chuyển nhượng, tài chính, giải đấu, ban lãnh đạo

## Đã làm

### Tuyển thủ ảnh hưởng thật tới trận (sửa nền móng)
Đo đầu GĐ4 cho thấy một lỗi gốc: **chỉ số cả đội 15 vs 9 chỉ thắng 52.5%**, thành thạo 100 vs 0 của một người 50%. Tìm ra hai nguyên nhân và sửa cả hai:

1. **Chỉ số tác động quá nhẹ.** Thêm các "đòn bẩy" theo đúng yêu cầu (kết liễu lính hụt, né chiêu, phản ứng, vị trí trong giao tranh):
   - Kỹ Năng Cá Nhân → **tốc độ phản ứng** (nhịp nghĩ 0.06–0.25 giây), **hiệu suất ra đòn** (chu kỳ đánh thường chậm thêm tới 25%), ngắm chiêu lệch, lóng ngóng lỡ nhịp.
   - Ăn Lính → canh kết liễu sai, đánh quá sớm mất lính.
   - Giao Tranh → **đánh giá sai tương quan lực lượng** (kém thì hay lao vào trận thua, bỏ lỡ trận thắng).
   - **Thành thạo tướng**: hệ số chỉ số 0 → ×0.455, 70 → ×0.91, 100 → ×1.0; sát thương lên tướng địch 0 → ×0.65, 100 → ×1.06 (combo, nội tại).
   - **Ăn ý từng cặp**: bám mục tiêu đồng đội đang đánh, cứu đồng đội, hệ số Giao Tranh/Đọc Bản Đồ.
   - **Vị trí**: chơi tạm ×0.92, trái vị trí ×0.8. **Phong độ** ±12%.
2. **Thắng giao tranh không ra trận thắng** (đội hạ gục gấp đôi vẫn thua — "đội nhiều hạ gục hơn thắng" chỉ 54–57%). Dò từng trận thì thấy lỗi vĩ mô của đội trưởng AI:
   - Vây trụ thì **đứng chờ cách trụ 16 ô đợi lính**, kể cả khi địch đã chết hết → giờ địch chết ≥ 2 là áp thẳng vào trụ gần đội nhất; trụ 1 không còn giảm sát thương "cửa sau".
   - **Không ai về thủ nhà**: 4 người đi vây xa, 2 địch + một đợt lính đẩy thẳng vào nhà chính → giờ trụ 2/3/nhà chính bị đe dọa thì người gần nhất về (xa thì biến về), cử người dọn lính theo số lính (1 người / 5 lính), nhà chính ưu tiên hơn trụ ngoài; nhà chính chỉ nhận 50% sát thương từ lính.
   - Dẫn vàng thì gom quân ép trụ (mỗi 3000 vàng ≈ 1 người lợi thế).

### Mùa giải
- **Thế giới**: 24 đội trong nước chia 3 hạng (Hạng 1 Giải Vô Địch Quốc Gia, Hạng 2 Giải Hạng Nhất, Hạng 3 Giải Khu Vực) + 6 đội nước ngoài, ~230 tuyển thủ, tuyển thủ tự do, tân binh.
- **Lịch mùa 14 tuần**: tiền mùa → vòng bảng 7 lượt (Bo1) → bán kết Bo3 → chung kết Bo5 → giải quốc tế (vô địch + á quân Hạng 1 cùng 6 đội nước ngoài: tứ kết Bo3, bán kết Bo3, chung kết Bo5) → tổng kết. Đội Hạng 1 đi tới cuối đá **12 loạt** (tối đa 26 ván); đội hạng dưới tối đa 9 loạt (15 ván).
- **Thăng/xuống hạng**: vô địch hạng dưới ↔ đội bét hạng trên.
- Trận máy–máy ra **kết quả nhanh** theo điểm sức mạnh (chỉ số ra sân, thành thạo tướng tủ, ăn ý, HLV, stress), hệ số hiệu chỉnh theo mô phỏng trận thật. Trận của bạn: đá thật (luồng GĐ3: trinh sát → cấm chọn → chuẩn bị → kế hoạch → trận → phỏng vấn) hoặc **giao trợ lý** (kết quả nhanh).

### Tuyển thủ (hồ sơ đầy đủ)
Chỉ số 1–20 (có mô tả tác dụng trong trận), vị trí sở trường + chơi tạm, thành thạo 26 tướng, tuổi, tiềm năng (★), phong độ, tinh thần, stress, Tín Nhiệm, lương, hợp đồng, giá trị, tính cách, ăn ý với từng đồng đội, thống kê mùa. Trinh sát đội khác: chỉ số gần đúng nếu chưa đấu tập/gặp họ.

### Lịch tuần
5 buổi (Thứ 2–6), mỗi buổi chọn 🎯 Luyện tướng / 💪 Luyện cá nhân / 🤝 Đấu tập (chọn đội đối tập → ăn ý tăng + **trinh sát đầy đủ đội đó**) / 😴 Nghỉ. Mỗi người chọn được tướng đang luyện và chỉ số đang luyện (hoặc để tự động). Tập dày → stress tăng (Lì Đòn, Thể Lực chịu tốt hơn); stress cao kéo phong độ xuống.

### Chuyển nhượng
Mua (trả giá: đồng ý / đội kia trả giá lại / từ chối), ký tự do & tân binh, bán (rao bán → đội máy hỏi mua qua hộp thư, bạn đồng ý / đòi thêm 20% / từ chối), cho mượn, mượn, gia hạn, thanh lý. Kỳ chuyển nhượng tuần 0 và tuần 4. **Đội máy cũng mua bán** theo cá tính HLV (Ươm mầm / Săn sao / Tằn tiện / Trung thành), giữ kỷ luật quỹ lương.

### Tài chính
Tài trợ (chọn 1 trong 3 đầu mùa: ổn định / thưởng mục tiêu / thưởng mỗi trận thắng), tiền người hâm mộ, tiền thưởng giải, lương theo mặt bằng hạng, phí chuyển nhượng. Sổ thu chi theo mùa.

### Ban lãnh đạo
Đặt mục tiêu mùa theo sức đội (vô địch / chung kết / bán kết / nửa trên / không đứng bét) + quỹ không âm. Tín nhiệm 0–100 thay đổi theo từng loạt (thắng đội mạnh hơn được nhiều), phỏng vấn, quỹ. Tổng kết mùa: tín nhiệm < 25 hoặc trượt 2 mùa liền mà < 50 → **bị sa thải**, nhận 1 trong 3 lời mời (thường đội yếu hơn) để đi tiếp. Danh tiếng HLV ảnh hưởng tài trợ và lời mời.

### HLV máy có cá tính
Kiểu cấm chọn, kế hoạch ưa thích, **chiến thuật ưa thích** (mới — ảnh hưởng chiến thuật cả trận), trình độ, độ thích nghi (đọc kế hoạch quen của bạn; bản cập nhật ở GĐ5), "liều", cá tính thị trường. Đội xuống hạng 60% thay HLV.

### Cuối mùa
Già đi; trẻ tiến bộ về phía tiềm năng, từ 26 tuổi sa sút dần; giải nghệ; hợp đồng hết hạn; 16 tân binh mới; người cho mượn trở về.

### Giao diện
Trung tâm HLV theo tuần với 8 thẻ (Trung tâm • Đội hình • Lịch tập • Chuyển nhượng • Giải đấu • Tài chính • Ban lãnh đạo • Hộp thư có huy hiệu số thư chờ). Điện thoại màn ngang: thanh thẻ thu thành biểu tượng, bảng cuộn được. Kiểm thử bằng trình duyệt thật ở 1280×720 và 844×390: tạo sự nghiệp, ký hợp đồng, xếp đội hình, lịch tập + đấu tập, giao trợ lý, đá một trận chính thức đầy đủ, kết thúc tuần, tổng kết mùa, mùa mới — **không lỗi JS**.

### Kỹ thuật
- `tools/gd4.js`: đo theo cặp, in thêm vàng/lính phút 10, cuối trận và "chuyển hóa lợi thế".
- `tools/mua.js`: mô phỏng nhiều mùa không giao diện (3 mùa ≈ 3 giây) — kiểm tra lịch, bảng, thăng/xuống hạng, tài chính, chuyển nhượng, tuổi tác.
- `node tools/mophong.js --kiemtra`: tất định + phát lại theo chuỗi lệnh vẫn đúng.
- THIET_KE.md thêm mục 23–27 (tuyển thủ, lịch tuần, giải đấu, chuyển nhượng, tài chính & ban lãnh đạo), sửa mục 11 (AI theo chỉ số).

## Số đo (ít trận, theo đúng dặn dò — chi tiết `docs/GD4_MO_PHONG.txt`)

| Mục tiêu | Trước GĐ4 | Sau GĐ4 | |
|---|---|---|---|
| Thành thạo tối đa vs chưa thành thạo (một tuyển thủ) 58–62% | 50% (60 trận) | **64.0% ± 9.4%** (100 trận) | ✔ khoảng tin cậy phủ mục tiêu, có thể hơi mạnh |
| Chỉ số cả đội 15 vs 9 (tham khảo) | 52.5% (40 trận) | **65.0% ± 12%** (60 trận) | đội giỏi hạ 18.5 vs 12.5, hơn 3.5k vàng |
| Đội nhiều vàng hơn cuối trận thắng | ~53–63% | **75–78%** | lợi thế giờ quy ra trận thắng |
| Thời lượng trận x1 15–30 phút | 23.8 phút | **26.2 phút** (trung vị 25.4), 0% dưới 15, **25% trong 30–35**, 0% ≥ 35 | ⚠ đuôi dài hơn, xem dưới |
| Bộ máy mùa giải | — | 3 mùa liền: 0 lỗi, thăng/xuống hạng đúng, tài chính các hạng ổn định (đa số đội có lãi), điểm đội hình trung bình Hạng 1/2/3 sau 3 mùa 14.9 / 12.6 / 12.4 | ✔ |
| Tất định & phát lại | ✔ | ✔ | |

## Con số "khởi điểm" đã đổi / quyết định mới (báo anh)
1. **Chống giằng co về đúng số của anh**: lính mạnh nhanh từ **phút 25** (GĐ3.5 là 26), nhà chính mất máu từ **phút 30** (GĐ3.5 là 34). Lý do: sau khi đội trưởng biết về thủ nhà, trận dài ra (29% quá phút 30); đưa về số gốc thì không còn trận ≥ 35 phút.
2. **Nhà chính chỉ nhận 50% sát thương từ lính** (mới). Trước đó nhiều trận kết thúc vì một đợt lính may rủi phá nhà trong khi tướng hai bên ở xa — kết quả gần như ngẫu nhiên bất kể đội nào mạnh.
3. **Trụ 1 không có giảm sát thương "cửa sau"** (trước: mọi trụ giảm 50% khi không có lính). Trụ 2, 3, nhà chính giữ nguyên.
4. **Thành thạo tướng mạnh hơn GĐ3**: hệ số chỉ số 0.455–1.0 (GĐ3: 0.7–1.0) và thêm hệ số sát thương lên tướng 0.65–1.06. Không đổi gì với tuyển thủ thành thạo 70 (mặc định mô phỏng cân bằng).
5. **Nhịp nghĩ AI theo Kỹ Năng Cá Nhân** (GĐ1–3 cố định 0.1s): 0.06–0.25s; tuyển thủ 12/thành thạo 70 vẫn ≈ 0.1s.
6. **Tiền**: đơn vị triệu đồng; lương 2–140 tr/tuần theo điểm; tài trợ cơ sở 78/52/27 tr/tuần theo hạng; thưởng vô địch 1.2 tỷ / 400 tr / 150 tr, quốc tế 3 tỷ. Lương hạng dưới thấp hơn (×1 / ×0.85 / ×0.7) — không thì các đội Hạng 3 vỡ quỹ sau 2–3 mùa.
7. **Mục tiêu ban lãnh đạo "vừa sức"**: đội mạnh nhất chỉ bị đòi vào chung kết (trừ khi hơn hẳn đội thứ 2), thứ 2–3 vào bán kết. Đo cho thấy trận đấu có ngẫu nhiên thật (đội mạnh hơn 6 điểm chỉ số thắng ~65%), nên đòi cao hơn thì HLV giỏi vẫn hay bị sa thải.
8. **Kết quả nhanh**: xác suất thắng một ván = 1/(1 + e^(−chênh sức/9.5)), hiệu chỉnh theo phép đo 15 vs 9 ở trên — để "giao trợ lý" và trận đá thật cho kết quả cùng mặt bằng.
9. **Bản lưu mới** `dthlv_moba_v2` (cấu trúc khác hẳn GĐ3, bản lưu GĐ3 không dùng lại được); xuất/nhập vẫn như cũ.
10. **Giao hữu** không làm tuyển thủ tiến bộ (chống "cày" giao hữu mô phỏng nhanh); chỉ để thử đội hình/tướng/lệnh.

## Việc còn dở
- **Đuôi thời lượng**: 25% trận rơi vào 30–35 phút (mục tiêu < 10% quá phút 30). Cân lại ở GĐ6 cùng chỉ số tướng/trang bị (đội trưởng giờ thủ nhà tốt hơn nên trận dài hơn).
- **Thành thạo 64%** hơi trên khoảng 58–62% (sai số ±9.4) — chỉnh hệ số sát thương theo thành thạo ở GĐ6 khi chạy mẫu lớn.
- Độ chênh giữa các hạng còn nhỏ trong trận thật (chênh 3 điểm chỉ số ≈ 58% mỗi ván) — trận đấu vẫn nhiều ngẫu nhiên; GĐ6 cân vĩ mô sâu hơn.
- Các đội Hạng 1 tích tiền nhanh (≈ 3 tỷ sau 3 mùa) — GĐ5/6 thêm chi phí (cơ sở vật chất, đãi ngộ ngôi sao) hoặc đội máy tiêu mạnh hơn.
- Phe Xanh/Đỏ, tướng 45–55%, HLV máy vs đội trưởng: không đo lại ở GĐ4 (để GĐ6 chạy đủ lớn).
- GĐ5 sẽ dùng các trường đã có (stress, tinh thần, Ham Tiền, Tín Nhiệm, hộp thư) cho sự cố, bán độ, tin tức; bản cập nhật theo mùa (cả làm lại tướng) và cá tính "thích nghi bản cập nhật" của HLV máy.

---

# GĐ4b — Chơi thử, tự đặt tên đội, thắng/thua, đội huyền thoại, bảng vinh danh

## Đã làm
- **Tự đặt tên đội** (tên, viết tắt, màu) gắn vào đội được chọn; nút **⚡ Chơi nhanh** (đội Hạng 3 ngẫu nhiên).
- **Thắng**: vô địch thế giới → chơi lại hoặc đá tiếp. **Thua**: bị sa thải (mùa đầu ở một đội được ân hạn), quỹ âm 2 tuần liền, hoặc quỹ âm khi tổng kết mùa.
- **Đội huyền thoại**: kết thúc sự nghiệp → chụp đội (HLV, tên đội, tuyển thủ với chỉ số/thành thạo). Thế giới mới có xác suất gặp đội vô địch thế giới (của mình hoặc người khác) và đội cũ của chính mình, gắn 👑/👻 ở mọi màn hình; có thư báo đầu sự nghiệp.
- **Bảng vinh danh**: kho chung (trang chơi thử), trên máy, mã chia sẻ "DTHLV1.…", danh sách có sẵn trong mã. Thắng người chơi → ★ bảo vệ ngôi vương; bị người chơi hạ 10 lần → hạ bệ (không còn xuất hiện, chủ đội tự dọn).
- **Chống quá tải kho chung**: mỗi người tối đa 3 đội; mỗi lần mở chỉ tải 100 người chơi mới nhất; vô địch quá 180 ngày chỉ còn tên trên bảng; mỗi loạt đấu với đội huyền thoại chỉ 1 lần ghi.
- **Chạy được trên điện thoại & trong trang nhúng**: hộp thoại trong game thay alert/confirm/prompt (bị chặn trong trang nhúng); trình duyệt chặn bộ nhớ thì vẫn chơi tiếp trong phiên (có cảnh báo); lỗi bất ngờ hiện lên màn hình để chụp gửi lại.
- **Bản chơi thử**: `node tools/choi_thu.js <thư mục>` đóng gói trang + 137 tệp (mã, hình hiệu ứng đổi tên không dấu cách, âm thanh, 5 bài nhạc; 22.5 MB).

## Kiểm thử
- Trình duyệt thật cỡ điện thoại ngang 844×390, thao tác chạm: bắt đầu sự nghiệp, đội hình, kết thúc tuần, vào trận đầy đủ — không lỗi JS.
- Màn vô địch / phá sản / bảng vinh danh / hộp thoại: không lỗi. Kho chung: ghi (chủ) và đọc (quyền xem) được.
- `node tools/mua.js`: sa thải → kết thúc sự nghiệp đúng; THIET_KE.md khớp mã (mục 28).

## Lưu ý
- Trang GitHub Pages của kho mã đang lấy nhánh `main` (vẫn là bản game cũ, "first commit"); bản mới nằm ở nhánh làm việc. Muốn chơi bản mới qua GitHub Pages cần gộp vào `main` hoặc đổi nguồn Pages sang nhánh này.
- Người khác muốn **gửi** đội vô địch lên kho chung của trang chơi thử cần quyền **Người đóng góp** (Contributor) trở lên; quyền Xem chỉ đọc được.
