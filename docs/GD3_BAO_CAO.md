# Báo cáo Giai đoạn 3 — Cấm chọn, kế hoạch, lệnh, hội ý, HLV máy, phỏng vấn

## Đã làm
### Trước trận
- **Sự nghiệp HLV** (bản GĐ3): chọn 1 trong 8 đội (5 tuyển thủ chỉ số 1–20, vị trí, thành thạo từng tướng 0–100 với 3–4 tướng tủ,
  lối chơi, Tín Nhiệm, nét tính cách); mỗi đội máy có HLV với kiểu cấm chọn (theo meta / tướng tủ / khắc chế), kế hoạch ưa thích, trình độ, độ thích nghi.
  Lưu bằng localStorage (khóa mới), xuất/nhập bản lưu như cũ.
- **Giao hữu Bo1 / Bo3 / Bo5**: cấm chọn lại mỗi ván, bên thua ván trước chọn phe (đội máy thua luôn chọn phe Xanh).
- **Trinh sát**: tướng tủ từng tuyển thủ đối phương (kèm độ thành thạo), chỉ số, lối chơi, tính cách; kiểu cấm chọn và lối đánh quen
  (tỉ lệ các kế hoạch) của HLV đối phương — học thêm từ lịch sử đối đầu; phong độ 5 trận gần nhất.
- **Cấm chọn**: 2 cấm mỗi bên (tự lên 3 khi có ≥ 36 tướng), chọn 1-2-2-2-2-1, không trùng. Mỗi ô tướng hiện tỉ lệ thắng bản hiện tại,
  độ thành thạo tốt nhất của tuyển thủ mình ở vị trí còn trống, cảnh báo ⚠ tướng tủ đối phương; chọn một tướng xem tỉ lệ đối đầu cùng đường
  với tướng đối phương đã lộ. AI đối thủ cấm chọn theo kiểu của HLV đó.
- **Chuẩn bị**: đổi tướng giữa các vị trí, phong cách từng người (an toàn / cân bằng / hổ báo), 2 phép bổ trợ, nhánh tiến hóa 5 mốc
  (hoặc để tuyển thủ tự chọn), thứ tự lên đồ (sửa từ bản mặc định đã tính theo đội hình địch).
- **Kế hoạch đội**: nhịp đầu trận (An toàn / Ép đường / Xâm lăng rừng — hành vi cụ thể, khắc nhau vòng tròn), đường trọng tâm, mục tiêu ưu tiên.

### Trong trận
- **8 lệnh** có hồi chiêu và thời gian cam kết: Tranh mục tiêu, Giao tranh tổng, Đẩy đường, Chia đẩy, Bắt lẻ, Tập trung hạ, Bảo vệ, Lùi thủ.
  Lệnh cần chọn (đường / mục tiêu / tướng) mở bảng chọn nhỏ hoặc chạm dải tướng.
- **Nghe lệnh** tùy Tín Nhiệm, Kỷ Luật, tính cách, mất bình tĩnh: nghe ngay / chần chừ 4–10 giây / phớt lờ. Hết lệnh thì chấm kết quả
  (hạ gục, quái lớn, trụ) → Tín Nhiệm người nghe lệnh tăng hoặc giảm (lệnh sai làm chết người thì mất Tín Nhiệm).
- **Phong cách từng người** chỉnh giữa trận (chạm thẻ tuyển thủ).
- **HỘI Ý** 3 lần: trận dừng; trấn an cả đội, đổi kế hoạch, đổi thứ tự lên đồ những món chưa mua, đổi nhánh tiến hóa chưa mở.
- **Mất bình tĩnh**: chết, chết liên tiếp, bị đối thủ cùng đường hạ một mình, bị hạ quái lớn trước mặt → chơi kém đi, liều hơn, khó nghe lệnh;
  Tâm Lý cao/Lì Đòn ít bị, Dễ Nóng bị nặng; hội ý hạ xuống. Hiện 😠/😡 trên thẻ tuyển thủ.
- **Giao diện đọc trận**: chiêu cuối địch (chỉ biết khi đã THẤY dùng, đếm ngược ước lượng), đồng hồ quái/bùa/quái cuối, chênh vàng, bảng đồ hai bên,
  ai mất bình tĩnh, dòng chỉ đạo (ai nghe / chần chừ / phớt lờ, lệnh kết thúc có lợi hay không), lệnh địch giữ bí mật (chỉ thấy khi họ gọi hội ý).
- **Tua nhanh**: ⏩ giao phần còn lại cho trợ lý (HLV máy) — được ghi thành lệnh nên xem lại vẫn y hệt.
- **Đội trưởng tự chỉ huy** khi HLV không ra lệnh (theo Chỉ Huy, Thủ Lĩnh; mất bình tĩnh làm chỉ huy kém).
- **HLV máy**: dùng đúng thông tin giao diện cho người chơi thấy, ra lệnh qua cùng cơ chế (hồi chiêu, nghe lệnh…).

### Sau trận
- Kết quả: bảng điểm, chỉ đạo của bạn (số lệnh có lợi / bất lợi, hội ý), kế hoạch hai bên, Tín Nhiệm thay đổi; **xem lại ván** (cùng hạt giống + chuỗi lệnh).
- **Phỏng vấn sau trận**: 2–3 câu theo diễn biến (thắng/thua, đè bẹp/lội ngược dòng, người hay nhất, người mất bình tĩnh/chết nhiều, tỉ số loạt),
  mỗi câu 3 lựa chọn có hệ quả: Tín Nhiệm từng người, tinh thần đội (ảnh hưởng mất bình tĩnh ván sau), người hâm mộ, ban lãnh đạo,
  đối thủ bị khích (ván sau họ lì hơn). Lưu vào sự nghiệp cho GĐ4.

### Kỹ thuật
- Lệnh ghi thành chuỗi (bước, phe, lệnh), áp dụng ở đầu bước kế. `node tools/mophong.js --kiemtra` kiểm tra thêm: một trận có HLV máy
  + "người chơi" ra lệnh ngẫu nhiên (cả hội ý, phong cách) → phát lại bằng chuỗi lệnh cho mã băm trạng thái giống hệt.
- `tools/gd3.js`: đo theo CẶP (mỗi hạt giống đá 2 trận, đổi phe thứ cần so) để triệt tiêu lợi thế phe và đội hình.
- `tools/meta.js`: sinh bảng meta (`src/data/meta.js`) từ kết quả mô phỏng — "thống kê công khai của bản cập nhật" cho AI cấm chọn.
- THIET_KE.md bổ sung mục 12–22 (rừng, quái, trang bị, phép, cây tiến hóa của GĐ2 — trước đây còn thiếu — và toàn bộ con số GĐ3).

## Số đo
Đo bằng `tools/gd3.js` theo **cặp** (mỗi hạt giống đá 2 trận, đổi phe thứ cần so, cùng đội hình) — kết quả thô trong `docs/GD3_MO_PHONG.txt`.

| Mục tiêu | Kết quả | |
|---|---|---|
| Kế hoạch khắc nhau kéo–búa–bao | Ép đường thắng An toàn **54.6%** • An toàn thắng Xâm lăng **53.8%** • Xâm lăng thắng Ép đường **54.6%** (240 trận mỗi cặp) | ✔ đúng chiều cả 3 cặp |
| Không kế hoạch nào > 55% trước mọi kế hoạch khác | Ép đường **50.0%** • An toàn **49.6%** • Xâm lăng **50.4%** (720 trận) | ✔ |
| HLV máy thắng đội không ai chỉ đạo ≥ 55% | **60.3%** ± 5.5 (300 trận) | ✔ |
| HLV máy thắng đội trưởng Chỉ Huy trung bình ≥ 52% (đề xuất GĐ0) | **54.3%** ± 5.6 (300 trận) — ~12 lệnh/trận, 3.4 lệnh có lợi rõ / 1.1 bất lợi | ✔ |
| Cấm chọn dữ liệu thắng cấm chọn ngẫu nhiên 55–65% | **56.7%** ± 5.6 (300 trận, mã cuối; các lần đo trước khi chỉnh thành thạo: 54.3%, 63.3%) — đội cấm chọn theo dữ liệu hạ 13.4 vs 10.1, phá 4.9 vs 3.7 trụ | ✔ |
| Cùng chuỗi lệnh → phát lại giống hệt | trận có HLV máy + 60–70 lệnh "người chơi" ngẫu nhiên (cả hội ý, phong cách) → mã băm trạng thái trùng khớp | ✔ |
| Thành thạo 100 vs 0 của một tuyển thủ 58–62% (mục tiêu GĐ4, đo trước) | 50–56% (3 lần × 300 trận) | ✘ còn yếu — xem việc còn dở |

**Cân bằng trên mã GĐ3** (mô phỏng 600 trận, đội trưởng tự chỉ huy, không kế hoạch): trận trung bình **17.8 phút**, **1.2%** tới phút 30,
phe Xanh **51.3%**, **18/26 tướng** trong 45–55% (ngoài: Ryoma 58.1, Victoria 57.8, Gideon 56.2, Thanh Phong 55.1, Joker 44.6, Alice 44.0, Aria 43.3, Clint 43.3 —
mỗi tướng chỉ ~160–400 trận nên sai số ±5–8 điểm, các lần đo khác nhau lệch qua lại), 2 cặp đối đầu > 65% (Chrono & Neo vs Zero, Clint vs Galo; 26–46 trận).
Bảng meta cho AI cấm chọn sinh từ 1000 trận (`src/data/meta.js`). Cân bằng diện rộng là việc của GĐ6.

## Con số "khởi điểm" đã đổi / quyết định mới (báo anh)
1. **"Không ai chỉ đạo"** = đội trưởng gần như vắng mặt (chất lượng chỉ huy 0.15, phản ứng 2.6s, hay quên cập nhật chỉ thị);
   **"Đội trưởng tự chỉ huy"** = Chỉ Huy 12 (trung bình). Đúng như đề xuất ở GĐ0.
2. **Nghe lệnh có 3 mức**: nghe ngay / chần chừ 4–10 giây / phớt lờ (trước định chỉ có nghe/không nghe). Lý do: với Tín Nhiệm ~60, xác suất cả 5 người
   cùng nghe chỉ ~30% → gần như lệnh nào cũng làm đội tách đôi, lệnh thành có hại. Chần chừ vẫn là cái giá thật (đến muộn) nhưng không phá trận.
3. **Tín Nhiệm vì lệnh**: mỗi lệnh ±1–2, tối đa ±6 mỗi trận (bản đầu ±9 một trận là quá nhanh).
4. **Mất bình tĩnh** dịu 0.0015/giây (kéo dài vài phút) để hội ý "trấn an" có giá trị; chết +0.13, chết liên tiếp +0.09, bị cướp quái +0.16.
5. **Ảnh hưởng của thành thạo tướng mạnh hơn**: hệ số chỉ số 0.7 + 0.3 × thành thạo (trước 0.8 + 0.2), cộng thêm tướng chưa quen tay (< 70) ra chiêu chậm và hay lóng ngóng.
   Không đổi gì với tuyển thủ thành thạo 70 (mặc định của mô phỏng cân bằng).
6. **Ma trận kế hoạch**: GĐ0 tôi đặt "mỗi ô 45–55%". Kết quả đo: các cặp khắc nhau ~54–55%, mọi ô vẫn trong 45–55% nhưng chiều khắc rõ — chọn đúng kế hoạch
   là có lợi thật, chọn sai mất thật, không kế hoạch nào luôn đúng.
7. **HLV máy**: "chia đẩy khi đang thua" và "bắt lẻ đầu trận" đo thấy làm HLV máy thắng ÍT hơn đội trưởng → chỉ HLV có cá tính "liều" (~30% số HLV) dùng.
   Người chơi vẫn dùng đủ 8 lệnh.
8. **Cấm**: 2 mỗi bên (tự lên 3 khi có ≥ 36 tướng) — đúng yêu cầu.
9. **Cân bằng tướng lượt 5**: Alice (chiêu cuối giờ dùng cả để tấn công — trước chỉ dùng khi máu < 40%), Death, Aria tăng; Victoria, Koda, Theron giảm.

## Việc còn dở
- **Thành thạo của MỘT tuyển thủ** mới đổi được ~50–56% (mục tiêu 58–62% thuộc GĐ4). Cấm chọn (5 người cùng chơi tướng tủ) thì đã đủ mạnh.
  GĐ4 sẽ làm chỉ số tuyển thủ ảnh hưởng rõ hơn tới kết quả (một người chơi tệ phải kéo cả đội xuống).
- HLV máy ít khi gọi hội ý (~0.07 lần/trận) vì hiếm khi 2 người cùng mất bình tĩnh nặng; người chơi vẫn dùng hội ý để đổi đồ/nhánh/kế hoạch.
- Sự nghiệp mới có giao hữu; giải đấu nhiều hạng, lịch tập, chuyển nhượng, tài chính, ban lãnh đạo là GĐ4. Tinh thần, người hâm mộ, ban lãnh đạo,
  Tín Nhiệm đã được lưu để GĐ4 dùng.
- **Bản cập nhật có làm lại tướng** (anh dặn): đã ghi vào kế hoạch GĐ5 — mỗi bản cập nhật ngoài tăng/giảm chỉ số sẽ có 1–2 tướng được *làm lại*
  (đổi cách chiêu/nội tại hoạt động, ví dụ đổi một chiêu từ lướt sang khiên), soạn sẵn nhiều phiên bản cho mỗi tướng; trận ghi phiên bản để phát lại đúng.
- Giao diện điện thoại: màn cấm chọn và chuẩn bị chạy được ở 740×360 nhưng còn chật; GĐ6 sẽ làm gọn thêm.
