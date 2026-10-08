# Báo cáo Giai đoạn 2 — Rừng, mục tiêu lớn, trang bị, cây tiến hóa, 26 tướng

## Đã làm
- **Rừng & sông:** 5 bãi quái mỗi phe (Quái Đỏ, Quái Xanh, Quái Vàng, 2 bãi nhỏ) với 3 loại bùa (Đỏ: +sát thương & thiêu; Xanh: mana & giảm hồi chiêu;
  Vàng: thêm vàng); bùa chuyển sang kẻ hạ gục. Lính Trinh Sát trên sông (hạ được thì có lính tuần tra soi sông), 2 Mắt Khai Quang, bụi cỏ, thêm tường.
- **Quái lớn** (10 phút đầu, 2 hang, luân phiên Thợ Săn / Kẻ Chiêu Hồi) và **quái cuối** từ phút 10 (Tinh Thể Hỗn Loạn / Kẻ Gọi Hồn / Quái Vật Tận Thế, báo trước 30 giây).
- **Sương mù + đèn soi**, tầm nhìn theo bụi, theo đèn, theo vùng soi.
- **Cấp 1 → 18** (theo quyết định của anh): chiêu thường 5 cấp, chiêu cuối 3 cấp.
- **42 trang bị** (mỗi món có phôi 40% giá), mua ở bệ hoặc khi chờ hồi sinh; AI lên đồ theo kiểu tướng và **thích nghi theo đội hình địch**
  (nhiều phép → giày/đồ kháng phép, nhiều hồi máu → đồ giảm hồi máu, nhiều người lao vào → đồ phòng thân…).
- **12 phép bổ trợ + Trừng Trị** (người đi rừng bắt buộc). **Biến về** khi đủ tiền mua món kế (cách nhau ≥ 45 giây).
- **Cây tiến hóa** 26 tướng × 5 mốc (cấp 1/3/6/9/12) × 3 nhánh = 390 nhánh, nhiều nhánh đổi cách chiêu hoạt động.
- **16 tướng còn lại** (Borg, Florian, Kazuki, Theron, Wukong, Vesper, Galo, Alice, Thanh Phong, Roxie, Joker, Percy, Chrono & Neo, Jack, Victoria, Raven).
  Florian sửa theo yêu cầu (nội tại lao tới hồi ngay khi phá điểm yếu; S1 Tử Ấn mở 4 điểm yếu). Death là đi rừng.
- **AI đi rừng, đảo đường, tranh mục tiêu:** đi rừng chọn bãi theo bùa/khoảng cách, tránh bãi có địch; đội trưởng chỉ gọi đánh quái lớn khi đủ cấp và đủ người,
  đến tranh khi địch đang đánh; người đi rừng bắt lẻ đường có địch thấp máu/đẩy quá sông.
- **Sửa lệch phe:** tìm ra lỗi AI lên lại kế hoạch đồ làm người đi rừng biến về liên tục; xếp lượt AI xen kẽ hai phe.
- **Giao diện:** bụi, bãi quái + đồng hồ, quái lớn/quái cuối, đèn, Mắt Khai Quang, sương mù, đêm của Raven, đồng hồ mục tiêu trên đầu màn hình,
  bảng điểm có trang bị và nhánh tiến hóa.

## Số đo (600 trận mô phỏng, đội hình ngẫu nhiên, lượt cân bằng 3)
| Mục tiêu | Kết quả |
|---|---|
| Trận trung bình 15–20 phút | **17.5 phút** (trung vị 17.5) ✔ |
| Dưới 5% trận tới phút 30 | **0.3%** ✔ |
| Phe Xanh 48–52% | **51.5%** ± 4.0 ✔ |
| Tướng 45–55% | **21/26 tướng** trong khoảng. Ngoài: Victoria 56.1, Kazuki 44.7, Aria 44.2, Death 44.1, Alice 40.1 → đã chỉnh thêm lượt 4 (đo lại cùng GĐ3) |
| Không cặp đối đầu cùng đường > 65% | 1 cặp: Death vs Wukong 28/72% (chỉ 25 trận, sai số lớn) |
| Lỗi/treo trận | 0 / 600 |

Lưu ý: mỗi tướng chỉ có ~160–400 trận trong 600 trận nên sai số ±5–8 điểm; GĐ6 (cân bằng diện rộng) sẽ chạy hàng nghìn trận.

## Con số "khởi điểm" đã đổi (báo anh)
- Cấp tối đa **18** (thay 15), chiêu thường tối đa **5** cấp (thay 4), chiêu cuối 3 cấp — theo quyết định của anh.
- Máu trụ **2000 / 2350 / 2600** (trụ 1/2/3), nhà chính **3500**; vàng theo thời gian **2.0/giây**; vàng khởi điểm 500.
- Chỉ số 17 tướng chỉnh theo mô phỏng (chi tiết trong THIET_KE.md, mục 10).

## Việc còn dở
- Số lính kết liễu còn thấp (2.2–2.6/phút) — tướng hay để lính/trụ ăn mất lính cuối; sẽ xem lại ở GĐ6.
- 5 tướng còn lệch nhẹ ngoài 45–55% (đã chỉnh, chờ đo lại với số trận lớn hơn).
