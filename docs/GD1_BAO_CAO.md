# Báo cáo Giai đoạn 1 — Lõi trận đấu

## Đã làm
- **Bản cũ** chuyển nguyên vẹn sang `legacy/` (vẫn chơi được, nút "Chơi bản cũ" ở màn hình chính).
- **Lõi trận tách khỏi phần vẽ** (`src/sim`), bước cố định 1/20 giây, mọi ngẫu nhiên từ bộ sinh số có hạt giống,
  lượng giác tự viết. Kiểm tra: cùng hạt giống chạy 2 lần cho mã băm trạng thái giống hệt (`node tools/mophong.js --kiemtra`).
- **Chiến đấu:** máu/mana/giáp/kháng phép, 3 loại sát thương (vật lý, phép, chuẩn), chí mạng, xuyên giáp/xuyên phép,
  khiên, khống chế (choáng, hất tung, trói, làm chậm, câm lặng, mê hoặc, mù, ngủ, cấm lướt), lướt/đẩy lùi, đạn, vùng.
- **Chống treo trận:** độ sâu kích hoạt tối đa 3, giới hạn sự kiện mỗi bước, mọi hiệu ứng kích hoạt đều kiểm tra dữ liệu.
  1000 trận mô phỏng: 0 lỗi, 0 trận treo.
- **Bản đồ 120×120 đv**, 3 đường + sông, đối xứng qua đường chéo. **48 bức tường**: viền rừng dọc các đường có lối vào,
  vách quanh nhà, vách hang quái lớn, khối đá trong rừng. Tìm đường bằng lưới nút + đường ngắn nhất tính sẵn.
- **Trụ** 3 tầng/đường, phá theo thứ tự 1 → 2 → 3; ưu tiên bắn lính, chuyển sang tướng đánh tướng phe mình.
  **Trụ 3 hồi sinh** sau 600 → 1200 → 1800 giây với 50% máu. **Nhà chính** tự bắn, chỉ bị đánh khi bên đó có trụ 3 sập.
- **Lính** đợt 30 giây ở cả 3 đường (3 cận chiến + 3 tầm xa, cứ 3 đợt 1 xe), mạnh dần theo phút; **lính tiến công**
  khi trụ 3 đối phương sập; chống giằng co từ phút 25 (lính mạnh nhanh) và phút 30 (nhà chính mất máu dần).
- **Cấp 1 → 15**, kinh nghiệm chia cho đồng đội đứng gần, điểm chiêu (S1–S3 tối đa 4 cấp, S4 mở ở cấp 4/8/12),
  **hồi sinh** 6 + 2 giây/cấp, **biến về**, vàng (đã tính, cửa hàng ở GĐ2), **tầm nhìn + sương mù** cơ bản.
- **10 tướng** với đủ S1–S4, nội tại, skill phụ (Aria: Gắn Kết):
  Đường trên Gideon, Clint* • Đi rừng Koda, Death • Đường giữa Ignatius, Ryoma • Xạ thủ Elara, Zero • Hỗ trợ Aria, Valerius*.
  (*) chơi vị trí phụ, vì Death chuyển sang Đi rừng nên hỗ trợ chỉ còn Aria trong 10 tướng đầu.
- **AI tuyển thủ** dùng chỉ số 1–20 (Kỹ Năng Cá Nhân, Ăn Lính, Đọc Bản Đồ, Giao Tranh, Kỷ Luật, Thể Lực) và chỉ dựa trên
  những gì đội mình thấy: đi đường, canh kết liễu lính, cấu rỉa, né chiêu định hướng, lùi về trụ khi bị đe dọa, biến về,
  giao tranh, công thành. **AI đội trưởng** (Chỉ Huy): gom quân, chia đẩy, về thủ, công thành khi có ưu thế.
- **Giao diện:** màn hình chính, trận thử (chọn tướng từng vị trí, hạt giống, góc nhìn), xem trận trên canvas (tướng vẽ tay
  theo phong cách bản cũ, nội suy mượt), bản đồ nhỏ chạm để nhảy camera, camera tự bám giao tranh, tua ⏸/x1/x2/x4/x8,
  tự chậm lại khi có giao tranh lớn, mô phỏng nhanh ra kết quả, bảng điểm, dòng sự kiện, chênh vàng, trạng thái chiêu cuối
  (của địch chỉ biết khi đã thấy dùng), màn kết quả + xem lại cùng hạt giống. Âm thanh & nhạc của bản cũ.
- **Điện thoại:** bố cục riêng cho màn ngang thấp, nút cỡ ngón tay, kéo/chụm để di chuyển/phóng camera, toàn màn hình,
  cài được lên màn hình chính (PWA, chơi không cần mạng).
- **Lưu:** khóa mới `dthlv_moba_v1`, xuất/nhập bản lưu (chuỗi hoặc tệp .json).
- **`THIET_KE.md`** sinh tự động từ mã (`node tools/thietke.js`, kiểm tra lệch bằng `--kiemtra`).
- **`tools/mophong.js`**: chạy song song nhiều luồng, báo cáo thời lượng, phe, tỉ lệ thắng tướng, đối đầu cùng vị trí, nhịp trận.
  **`tools/ban_do.html`**: xem toàn bản đồ (thêm `?nut=1` để thấy nút tìm đường).

## Số đo (1000 trận, `node tools/mophong.js --tran 1000 --hat gd1`)
| Chỉ số | Kết quả | Mục tiêu | |
|---|---|---|---|
| Thời lượng trung bình | **20.0 phút** (trung vị 19.5) | 15–20 | ✔ (sát biên trên) |
| Trận kéo tới phút 30 | **0.3%** | < 5% | ✔ |
| Phe Xanh thắng | **48.3% ± 3.1%** | 48–52% | ✔ |
| Tướng trong khoảng 45–55% | **8/10**; Gideon 55.4%, Clint 44.6% | 45–55% | gần đạt (lệch nằm trong sai số ±3.1%) |
| Cặp đối đầu cùng vị trí lệch nhất | **55.4%** (Gideon vs Clint) | ≤ 65% | ✔ |
| Mạng hạ / trận | 31.9 (1.6/phút) | — | |
| Trụ sập / trận | 9.5 | — | |
| Lỗi kích hoạt / văng | 0 / 0 | 0 | ✔ |
| Tốc độ mô phỏng | ~2.6 giây/trận/luồng (1000 trận ≈ 11 phút trên 4 nhân) | — | |

Các mục tiêu về cấm chọn, HLV máy, kế hoạch đội, thành thạo thuộc GĐ3–GĐ4.

## Con số đã đổi so với kế hoạch / luật mới cần anh duyệt
- Bản đồ **120×120** (kế hoạch ghi 160×160) và **đối xứng qua đường chéo** thay vì đối xứng tâm: mỗi đường biến thành
  chính nó nên đường trên của hai phe giống hệt nhau.
- **Lính chỉ gây 60% sát thương lên tướng** (luật mới): nếu không có, tướng chết vì lính quá nhiều ở đầu trận.
- **Chống phá trụ "cửa sau"** (luật mới): trụ và nhà chính giảm 50% sát thương từ tướng khi không có lính đi cùng.
- **Máu trụ** T1/T2/T3 = 1750/2000/2200, nhà chính 3000, giáp/kháng phép trụ 25 — giảm dần qua các vòng để trận về 15–20 phút.
- Thứ tự cập nhật đơn vị **đảo chiều mỗi bước** để không phe nào luôn "ra tay trước" (trước đó phe Xanh thắng 55%).
- Các con số anh đặt làm khởi điểm (hồi sinh 6 + 2/cấp, trụ 3 hồi sinh 600/1200/1800 với 50% máu, lính 30 giây, xe mỗi
  3 đợt, phút 25 và phút 30) **giữ nguyên**.
- Hồi chiêu/sát thương từng chiêu đã chỉnh nhiều vòng theo mô phỏng — bản cuối nằm trong `THIET_KE.md`.

## Việc còn dở / điểm yếu đã biết
- **Ăn lính còn thấp:** đường giữa ~4/phút, đường trên/xạ thủ ~2–2.5/phút (game thật ~6–8). AI chỉ kết liễu được ~43% số lính
  chết trong tầm tay. Sẽ cải thiện khi có trang bị (GĐ2) và tinh chỉnh AI.
- **Người đi rừng chưa có rừng** nên tạm đi hỗ trợ đường trên và đi bắt lẻ khi có cơ hội; cấp thấp hơn đồng đội (~8.5).
- Clint và Valerius đang chơi vị trí phụ; Gideon/Clint còn lệch nhẹ (55/45).
- Chưa kiểm tra phát lại giữa các trình duyệt khác nhau (trong cùng Node/Chromium đã tất định).
- Tầm nhìn chưa có bụi cỏ; chưa có quái rừng, bùa, trang bị, phép bổ trợ, cây tiến hóa — đều thuộc GĐ2.

## GĐ2 sẽ làm
Rừng (quái Đỏ/Xanh/Vàng, bãi nhỏ), Trừng Trị, sông (Lính Trinh Sát, Mắt Khai Quang), quái lớn & quái cuối, bụi cỏ,
cửa hàng và 42 trang bị, phép bổ trợ, cây tiến hóa, AI đi rừng/đảo đường/tranh mục tiêu, và 16 tướng còn lại.
