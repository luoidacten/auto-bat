# Báo cáo GĐ5d — Utility AI cho quyết định lớn của tuyển thủ

## Đã làm

### Lớp Utility AI (`src/sim/ai/utility.js`)
- **Nhịp quyết định**:
  - Mỗi tuyển thủ quyết lại mỗi 0,3–0,5 giây, lệch pha theo từng người để 10 người không cùng đổi ý một lúc.
  - Phần thao tác (đánh, chiêu, né, kết liễu) vẫn chạy nhịp riêng như cũ.
- **9 hành động lớn**: 🌾 Giữ đường, 🌲 Ăn rừng, 🔀 Đảo đường, ⏫ Đẩy trụ, 🐉 Tranh mục tiêu, ⚔ Tụ đội giao tranh, 🛡 Thủ nhà, ↩ Biến về, 🏃 Rút lui.
- **Cách chấm điểm**:
  - Mỗi hành động được chấm 0–1 từ 3–5 yếu tố có tên. Ví dụ: máu, an toàn, khoảng cách, vai trò, giai đoạn trận, quân số, lính đỡ trụ.
  - Mỗi yếu tố đi qua một **đường cong phản hồi**: tuyến tính, chữ S, bậc hai, căn, hoặc "sàn" cho yếu tố phụ.
  - Các yếu tố gộp bằng trung bình nhân: một yếu tố bằng 0 thì cả hành động bằng 0.
  - Riêng Rút lui lấy lý do nặng nhất: chỉ cần một lý do đủ nặng là rút.
- **Chọn hành động**:
  - Chọn hành động điểm cao nhất.
  - Hành động đang làm được cộng **quán tính** và có **thời gian tối thiểu** (1–5 giây tùy hành động).
  - Chỉ đổi sớm khi việc mới hơn hẳn (≥ 0,22 điểm), khi HLV vừa ra lệnh, hoặc khi nguy cấp.
- Phần quyết định lớn cũ (rút khi máu thấp/hết mana, về nhà mua đồ, theo chỉ thị đội trưởng) chuyển hết vào lớp này. Luật vi mô giữ nguyên: dọn lính, băng trụ có tính toán, né chiêu.

### Cá tính = bộ trọng số
- **Lối chơi**:
  - An toàn: rút/về/thủ nhiều hơn, đẩy/đảo ít hơn.
  - Hổ báo: ngược lại.
- **Tính cách**:
  - Ngôi Sao thích đẩy lẻ.
  - Thủ Lĩnh thích tụ đội/mục tiêu.
  - Dễ Nóng ít chịu rút.
  - Ham Tiền ham ăn lính/quái.
- **Mất bình tĩnh**: tăng trọng số đẩy/đảo/giao tranh, giảm rút/về.
- **Stress** (từ quản lý tuần): tăng rút/về/thủ.
- Cả hai làm tăng **nhiễu do dự**. Nhiễu lấy từ bộ sinh số có hạt giống của trận.

### Lệnh HLV = điểm cộng tạm thời
- **Công thức**: điểm cộng = 1,1 × (0,35 + 0,65 × Kỷ Luật) × (0,3 + 0,7 × Tín Nhiệm) × (1 − 0,6 × mất bình tĩnh).
- **Theo tính cách và lối chơi**:
  - Thủ Lĩnh nghe lời hơn.
  - Dễ Nóng nghe kém hơn.
  - Ngôi Sao không thích bị bảo "bảo vệ người khác".
  - Hổ báo ngại lệnh rút; An toàn ngại lệnh giao tranh.
- **Điểm cộng nhạt dần**: mạnh nhất lúc lệnh vừa ra, còn một nửa khi lệnh sắp hết hạn.
- **Hành động được lệnh**:
  - Được chấm theo đúng mục tiêu của lệnh (đúng đường, đúng trụ, đúng quái).
  - Bỏ các yếu tố "tự mình có muốn không"; chỉ giữ yếu tố khả thi như máu, khoảng cách, quân số.
- **Khi lệnh ra**:
  - Tuyển thủ quyết lại ngay.
  - Bảng tin hiện ai làm theo, và ai chưa theo kèm lý do: "✋ chưa theo: … — đang ưu tiên Biến về".
  - Tín Nhiệm sau lệnh tính theo người **thực sự làm theo**.
- Lệnh **Tập trung hạ** đi vào phần chọn mục tiêu, cũng nhân Kỷ Luật × Tín Nhiệm.

### Chỉ số tác động vào thông tin và thao tác
- **Đọc Bản Đồ → thông tin**:
  - Mỗi tuyển thủ có **bộ nhớ vị trí địch** riêng.
  - Địch ở gần thì luôn biết.
  - Địch ở xa (đồng đội/mắt thấy) cập nhật **trễ** 0,25–1,75 giây và có thể **bỏ sót**.
  - Người đọc bản đồ kém không để ý ai đang mất tích, nên dễ đẩy trụ khi đối thủ đang vòng tới.
  - Mọi quyết định lớn dùng thông tin nhận thức này, không dùng vị trí thật.
- **Kỹ Năng Cá Nhân / Phản Xạ → thao tác**: nhịp nghĩ, né chiêu, hụt chiêu, kết liễu (như GĐ5c).
- **Chỉ Huy → mục tiêu chung**:
  - Khi HLV không ra lệnh, đội trưởng gợi ý hành động cho từng người; gợi ý được cộng 0,1 + 0,15 × Kỷ Luật.
  - Chỉ Huy cao thì gợi ý mới và đúng.
  - Chỉ Huy thấp thì gợi ý cũ, chậm.
  - Khi HLV có lệnh, đội trưởng nhường lời.

### Combo & chọn mục tiêu
- Chuỗi chiêu từng tướng **giữ nguyên dạng luật** như bản cũ.
- **Chọn mục tiêu giao tranh** chấm điểm từng phần có tên, rồi lấy tổng:
  - máu thấp, khoảng cách;
  - chủ lực, đang đánh, bị khống chế;
  - đồng đội cùng đánh (theo ăn ý), theo đòn đồng đội;
  - lệnh Tập trung hạ, bảo vệ người được giao, cứu đồng đội.

### Gỡ lỗi & "ý định" cho HLV
- **Nút "🧠 Gỡ lỗi AI"** (menu ⋯ trong trận), vẽ trên đầu mỗi tướng:
  - **3 hành động điểm cao nhất** kèm điểm và lý do: các yếu tố, "đội trưởng gọi", "lệnh HLV", "đang làm", "cá tính ×…";
  - mục tiêu đang nhắm và lý do.
- **Giao diện HLV dùng lại thông tin này**:
  - dải tuyển thủ đội mình hiện **ý định hiện tại** (📣 nếu đang theo lệnh);
  - chạm vào tuyển thủ thì hiện khối "Ý định" với top-3.

### Ngẫu nhiên có hạt giống
- Mọi lựa chọn ngẫu nhiên trong trận lấy từ luồng "ai" có hạt giống, gồm nhiễu do dự, bỏ sót thông tin và đi vòng.
- Không còn `Math.random` trong mô phỏng, quản lý hay dữ liệu.
- Tất định và phát lại vẫn đúng.

## Số đo (ít, theo dặn — chi tiết `docs/GD5D_MO_PHONG.txt`)

6 trận cùng hạt giống, HLV máy hai bên:

| Chỉ số | GĐ5c | GĐ5d |
|---|---|---|
| Thời lượng TB | 26,5 phút | **22,0 phút** (18,9–25,5) |
| Trận > 30 phút | 2/6 | **0/6** |
| Hạ gục mỗi trận | 28,5 | **36,2** |
| Trụ phá mỗi trận | 10,7 | 8,8 |
| Quái lớn/quái cuối | 5,0 | 4,7 |
| Lỗi trong trận | 0 | 0 |

**Làm theo lệnh HLV** (cùng tình huống phút 14, đếm người còn sống):

| Nhóm | Theo lệnh |
|---|---|
| Kỷ Luật 18 / Tín Nhiệm 90 | 9/9 |
| Kỷ Luật 10 / Tín Nhiệm 60 | 11/12 |
| Kỷ Luật 4 / Tín Nhiệm 25 | 5/10 (người chưa theo đang ưu tiên Thủ nhà / Biến về) |

**Kiểm tra khác**:
- Tất định & phát lại: ✔.
- Giao diện máy tính + điện thoại: không lỗi; thấy lớp gỡ lỗi, dòng ý định, khối ý định trong menu tuyển thủ.

**Một lỗi phát hiện khi đo và đã sửa**:
- Khi lệnh HLV mạnh lên, HLV máy ra lệnh ~40 giây một lần.
- Cả 5 người bỏ đường đi theo, lính tự phá trụ, có trận kết thúc ở 15:53.
- Đã sửa bằng cách cho điểm cộng lệnh **nhạt dần**. Thời lượng trở lại 19–26 phút.

## Con số "khởi điểm" đã đổi (cần lưu ý)
1. **Lệnh HLV không còn tung xúc xắc "nghe/không nghe"**:
   - Lệnh thành điểm cộng 1,1 × (0,35 + 0,65 × KL) × (0,3 + 0,7 × TN) × (1 − 0,6 × mất bình tĩnh), nhạt dần còn ½ khi sắp hết hạn.
   - Tín Nhiệm sau lệnh tính theo người thực sự làm theo.
   - Hàm `obeyChance` cũ còn trong mã nhưng không dùng nữa.
2. **Chỉ thị đội trưởng thành gợi ý** (+0,1 + 0,15 × Kỷ Luật), không còn là mệnh lệnh tuyệt đối.
3. **Ngưỡng rút / về nhà** chuyển thành điểm:
   - Rút lui: máu từ ngưỡng rút + 25% xuống ngưỡng rút, tương quan lực lượng từ 0,95 xuống 0,45, hoặc trụ địch bắn mình.
   - Biến về: máu < 60% → 20%, mana < 30% → 10%, đủ vàng mua đồ.
4. **Stress của tuyển thủ giờ có tác dụng trong trận**: rút/về nhiều hơn tới +20%, do dự nhiều hơn.
5. **Nhịp trận ngắn hơn**: TB 26,5 → 22,0 phút; hạ gục 28,5 → 36,2 mỗi trận. Thế giới mới cùng hạt giống sẽ cho trận khác bản trước.
6. **Thông tin theo Đọc Bản Đồ**: độ trễ 0,25 + 1,5 × (1 − ĐBĐ) giây; xác suất nhận được 0,45 + 0,55 × ĐBĐ.

## Việc còn dở (để GĐ6)
- **HLV máy ra lệnh khá dày** (~40 giây/lần). Giờ lệnh có sức nặng thật, nên cần cho HLV máy biết chừa người dọn lính / giữ đường biên khi gọi cả đội.
- **Đội Xanh thắng 5/6 trận** trong mẫu nhỏ này (GĐ5c: 3/6). Mẫu quá ít để kết luận; cần một đợt mô phỏng lớn để kiểm tra cân bằng hai phe.
- **Trọng số các yếu tố** mới chỉnh tay trên vài trận; cần mô phỏng lớn để cân lại, ví dụ tần suất đảo đường, thời điểm tụ đội.
- **"Lính đánh trụ không ai dọn"** vẫn còn khi cả đội đi theo lệnh lớn. Đây là hậu quả hợp lý của lệnh, nhưng nên có cảnh báo cho HLV.
