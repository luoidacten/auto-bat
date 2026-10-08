# Báo cáo GĐ5c — AI trong trận: hết giật, dọn/giữ lính, biết buông, combo, giả giao tranh; Phản Xạ; cục máu; Dịch Chuyển; xoay vòng

## Đã làm

### Di chuyển mượt, hết "cà giật"
- **Nguyên nhân chính** (đo được): tướng đứng gần lính địch → số lính quanh mình làm "tương quan lực lượng" tụt → lùi về trụ; lùi ra xa lính → thấy ổn → tiến lên. Kết quả là đổi hướng mỗi 0,1 giây.
- **Sửa**:
  - làm mượt đánh giá thế trận;
  - đã lùi thì lùi hẳn ít nhất 0,6 giây, chỉ thôi lùi khi địch cách xa hơn;
  - đích di chuyển "mềm": đích mới lệch ít thì giữ đích cũ, đã gần thì đứng yên.
- Hình vẽ: hướng mặt xoay dần thay vì quay ngoắt.

### Lính và đi đường
- **Lính hết đuổi bất chấp**: đuổi một tướng tối đa 3 giây hoặc 5 đv, rồi quay về đường.
- **Dọn lính**: lính địch đang đánh trụ mình thì tướng ở gần (cả hỗ trợ) dọn nhanh bằng đánh thường + chiêu diện rộng. Đội trưởng cử người về dọn từ 1:30 (trước đây 5:00) khi có từ 3 lính địch ở trụ.
- **Giữ lính / đẩy lính có lý do**: chỉ đẩy khi được lệnh, đối thủ đường vắng mặt, đang mạnh hơn rõ, hoặc sắp về nhà (đẩy đợt lính đang tới rồi mới về). Còn lại chỉ kết liễu để giữ lính phía mình.
- Kết liễu chuẩn hơn ở mức chỉ số trung bình.

### AI ra quyết định
- **Biết buông**: đuổi mà không rút ngắn được khoảng cách, đuổi quá lâu, hoặc mất dấu → bỏ, quay về việc chính. Kỷ Luật cao thì buông sớm.
- **Băng trụ có tính toán**: chỉ băng khi trụ đang bắn lính/đồng đội khác, hoặc hạ được mục tiêu trước khi trụ hạ mình (Kỷ Luật cao đòi chắc hơn).
- **Không bỏ việc dở**: đang đánh quái lớn/quái cuối còn dưới 50% máu thì không quay sang đuổi tướng ở xa.
- **Combo theo thành thạo + ăn ý**: tướng quen tay mở bằng khống chế rồi mới dồn sát thương, không chồng khống chế lên mục tiêu đang bị khống chế. Ai mở giao tranh hay khống chế trúng thì đồng đội theo đòn — ăn ý cao theo nhanh và chắc hơn, chiêu cuối nối vào khống chế của đồng đội.
- **Không đứng nhìn nhau**:
  - ở đường, rảnh tay mà đối thủ đứng gần thì trao đổi chiêu/đòn;
  - giữa/cuối trận, hai đội giằng co quá 4 giây thì đội trưởng quyết một trong ba:
    - **mở giao tranh** nếu đang có lợi (tính cả giai đoạn mạnh của tướng);
    - **giả giao tranh**: 4 người đứng thế, cấu rỉa, không lao vào, để 1 người đi đẩy lẻ đường biên xa nhất;
    - **tản ra ăn lính**.

  Quyết định hiện trên bảng tin trận.
- **Né chiêu** theo chỉ số mới **Phản Xạ** (đạn bay, vùng sắp nổ, đọc đòn cận chiến).
- **Đi thông minh hơn**: đường đi cắt qua tầm trụ địch mà mình không định đánh trụ thì đi vòng qua mép tầm trụ. Đi bắt lẻ thì thỉnh thoảng vòng qua bụi cỏ (khó đoán hơn, Đọc Bản Đồ cao hay vòng hơn).

### Chỉ số mới: **Phản Xạ** (tuyển thủ)
- Tốc độ xử lý tình huống bất ngờ: nhịp nghĩ trong trận, né chiêu, đọc đòn, dùng phép bổ trợ/trang bị kích hoạt kịp lúc.
- Có trong hồ sơ tuyển thủ, luyện được, tính vào điểm tổng.
- Bản lưu cũ tự suy ra Phản Xạ từ Kỹ Năng Cá Nhân và Tâm Lý.

### Giai đoạn mạnh của tướng
- 27 tướng được gắn **mạnh đầu / giữa / cuối trận** và **cần đồ / vừa phải / ít cần đồ**.
- Hiệu lực thật: sát thương thay đổi khoảng ±6% theo cấp và ±4–6% theo vàng trang bị.
- AI biết điều này:
  - tuyển thủ dám đánh hơn khi tướng mình đang "tới thì";
  - đội trưởng ép giao tranh/trụ khi đội đang mạnh, giữ an toàn khi đội mạnh về cuối.
- Hiện trong màn cấm chọn khi chạm vào một tướng.

### Cục máu trên đường
- 6 cục: mỗi đường mỗi phe một cục, giữa trụ 1 và trụ 2.
- Có từ 2:00, hồi lại 90 giây sau khi bị nhặt; ai đi qua cũng nhặt được: +15% máu, +10% mana.
- AI đi nhặt khi máu thấp mà an toàn.
- Có trên bản đồ lớn và bản đồ nhỏ.

### Phép bổ trợ
- **Phép mới — Dịch Chuyển**:
  - niệm 3 giây, trúng đòn thì đứt;
  - tới cạnh trụ hoặc lính phe mình;
  - AI dùng để về đường sau khi hồi sinh, về thủ trụ, hoặc tới mục tiêu lớn.
  - Đường trên mặc định mang Tốc Biến + Dịch Chuyển.
- **Hồi Phục** (hồi máu) đã có sẵn từ trước, nay nằm trong nhóm cơ bản.
- **5 phép cơ bản luôn có**: Tốc Biến, Hồi Phục, Dịch Chuyển, Trừng Trị, Kiệt Sức.
- **3 ô xoay vòng** lấy từ 9 phép còn lại; mỗi bản cập nhật đầu mùa đổi 1–2 phép, ghi trong ghi chú bản cập nhật.

### 10 trang bị mới xoay vòng
- Gồm: Kiếm Bão Táp, Cung Thần Phong, Dao Tử Thần, Trâm Thần Kỳ, Quả Cầu Linh Hồn, Nhẫn Hoàng Kim, Giáp Ma Quái, Áo Giáp Dung Nham, Khiên Lâm Thần, Đèn Lồng Tinh Linh.
- Mỗi bản cập nhật chỉ có 5 món trong cửa hàng; bản đầu mùa đổi 2–3 món.
- AI thay món tương ứng trong lối lên đồ khi món xoay vòng có mặt. Màn soạn lối lên đồ chỉ hiện món đang bán.

### Khác
- Tốc độ xem trận thêm **x0.5**.

## Số đo (ít, theo dặn — chi tiết `docs/GD5C_MO_PHONG.txt`)

Cùng hạt giống, bản cũ (GĐ5) so với bản mới:

| Chỉ số | Bản cũ | Bản mới |
|---|---|---|
| Đổi hướng gắt (lần/phút/tướng) | 24,9 | 13,6 (−45%) |
| Quay mặt ngược (lần/phút) | 33,6 | 16,2 |
| Lắc tại chỗ (lần/phút) | 1,65 | 1,19 |
| Thời gian lính đuổi tướng | 6,1% | 2,4% |
| Lính kết liễu 12 phút đầu (cả trận) | 197 | 225 (đường trên 24 → 33, xạ thủ 35 → 38) |
| Lính kết liễu cả trận (lần/phút) | 15,1 | 17,6 |
| Thời lượng trận (6 trận) | 25,2 phút | 26,5 phút |
| Hạ gục mỗi trận | 33 | 28,5 |
| Trụ phá mỗi trận | 11,0 | 10,7 |

- Hạ gục giảm vì AI bớt băng trụ và đuổi liều.
- Dịch Chuyển: 13/13 lần niệm tới nơi. Cục máu: được nhặt 12 lần trong 15 phút. Không có lỗi trong trận.
- Tất định & phát lại: ✔. Thử 2 mùa sự nghiệp: kinh tế ổn, không đội nào âm quỹ.
- Giao diện máy tính + điện thoại: không lỗi; thấy nút x0.5; Lyra và các bản làm lại ra sân bình thường.

## Con số "khởi điểm" đã đổi (báo anh)
1. **Thêm chỉ số thứ 9 — Phản Xạ**, có trọng số trong điểm tổng: đường trên 0,9, rừng 0,9, giữa 1,1, xạ thủ 1,1, hỗ trợ 0,9. Điểm tổng tuyển thủ xê dịch nhẹ; thế giới mới cùng hạt giống sẽ khác.
2. **Nhịp nghĩ, né chiêu, dùng phép bổ trợ/trang bị** giờ theo Phản Xạ (trước theo Kỹ Năng Cá Nhân). Tỉ lệ né đạn: 0,12 + 0,6 × Phản Xạ (trước 0,08 + 0,5 × KNCN).
3. **Sát thương tướng nhân thêm hệ số giai đoạn mạnh**: khoảng −9% đến +12% tùy cấp, đồ và tướng.
4. **Lính**: đuổi tướng tối đa 3 giây / 5 đv; chỉ nhắm tướng trong 7,5 đv (trước 10,5).
5. **Sai số kết liễu**: (1 − Ăn Lính) × 0,45 (trước 0,7).
6. **Đội trưởng cử người dọn lính** từ 1:30 khi có từ 3 lính (trước: từ 5:00 khi có từ 4 lính).
7. **Phép mặc định đường trên**: Tốc Biến + Dịch Chuyển (trước Tốc Biến + Neo Trọng Lực).
8. **Bản cập nhật** nay có thêm mục "🔄 Xoay vòng" (phép bổ trợ & trang bị).

## Việc còn dở (để GĐ6)
- Cân bằng thật cho 10 trang bị xoay vòng, hệ số giai đoạn mạnh và Dịch Chuyển cần mô phỏng lớn.
- "Lính đánh trụ không ai dọn" mới giảm nhẹ (67% → 65% số lính·giây): chủ yếu lúc người đi đường đã chết hoặc về nhà, cần đội trưởng điều người tinh hơn.
- Giằng co cả đội ít xảy ra (1 lần / 3 trận); phần lớn "đứng nhìn" là ở đường và đã có trao đổi chiêu.
- Thời lượng trận vẫn có khoảng 1/3 số trận dài hơn 30 phút (vấn đề từ GĐ4).
