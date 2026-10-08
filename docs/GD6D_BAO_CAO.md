# GĐ6d — Bị hạ thì rơi mảnh hồn

Yêu cầu: "Giết người sẽ rơi mảnh hồn của họ."

## 1. Đã làm gì

### Rơi và nhặt (`src/sim/extras.js`, `match.js`, `consts.js`)
- **Tướng bị hạ rơi toàn bộ mảnh hồn đang có.**
  - Áp dụng cho cả lần chết còn lượt hồi sinh lẫn lần bị loại.
  - Các mảnh văng ra quanh xác và **giữ nguyên bậc**: Trắng, Xanh, Tím, Vàng, Đỏ.
  - Người chết mất luôn phần sức mạnh mà các mảnh đó đang cộng.
- **Nhặt**:
  - Sau 0.8 giây, ai chạm vào mảnh (trong 1.3 đv) thì nhặt được, dù là kẻ hạ gục, kền kền hay người qua đường.
  - Túi đã đầy 6 mảnh thì chỉ nhặt khi mảnh trên đất cao hơn mảnh kém nhất trong túi.
- Mảnh nằm trên đất 120 giây rồi biến mất.
- Mảnh văng theo vòng tròn quanh xác, không dùng ngẫu nhiên, nên trận vẫn tất định.

### AI: hành động mới 💠 "Nhặt mảnh hồn" (`utility.js`, `hero_ai.js`, `personality.js`)
- **Ở gần** (dưới 8 đv, ví dụ kẻ vừa hạ gục): nhặt ngay.
- **Ở xa** (tới 30 đv): chỉ đi nhặt khi quanh đó vắng người. Riêng cụm mảnh có tổng bậc từ 4 trở lên thì chấp nhận 1 đối thủ ở gần.
  - Lý do: nếu cả bản đồ đổ về một chỗ thì giao tranh dồn dập và trận kết thúc quá sớm.
- Không đi nhặt nếu mảnh nằm ngoài bo khi bo sắp co, hoặc không kịp tới trước khi mảnh biến mất.
- Mức thích nhặt theo tính cách:

  | Tính cách | Hệ số |
  |---|---|
  | Kền Kền | ×1.5 |
  | Con Bạc | ×1.3 |
  | Tham Farm | ×1.2 |
  | Hổ Báo, Ám Sát | ×1.1 |
  | Lì Lợm | ×0.85 |

### Giao diện (`render.js`, `vfx.js`, `hud.js`)
- **Trên sân**:
  - Mảnh hồn là viên pha lê màu theo bậc, văng ra từ xác, lơ lửng phát sáng, có bóng dưới đất.
  - Mảnh từ bậc Tím trở lên có hiện tên bậc.
  - Mảnh sắp biến mất thì nhấp nháy.
- **Bản đồ nhỏ**: mảnh hồn hiện thành chấm hình kim cương màu theo bậc.
- **Khi nhặt**: hiện vầng sáng và dòng chữ "+💠 Vàng" bay lên trên đầu người nhặt.
- **Dòng sự kiện**:
  - "💠 X rơi n mảnh hồn (cao nhất …)".
  - "X nhận mảnh hồn Tím (nhặt của Y)".
  - Nếu rơi mảnh Vàng hoặc Đỏ thì hiện biểu ngữ lớn.
- **Camera**: thêm điểm nóng "💠 Tranh mảnh hồn" khi có từ 2 tướng trở lên ở gần các mảnh trên đất.

## 2. Đo đạc

| Chỉ số | Kết quả |
|---|---|
| Mảnh hồn rơi mỗi trận (24 trận) | 21.5, trong đó **11.3 được nhặt lại** |
| Ai nhặt (3 trận theo dõi kỹ) | 60 mảnh rơi: 22 do kẻ hạ gục nhặt, 3 do người khác nhặt, 23 hết hạn không ai nhặt; số còn lại đến hết trận vẫn nằm trên đất |
| Thời gian từ lúc rơi đến lúc được nhặt | giữa 4.2 giây; 75% số mảnh được nhặt trong 10.5 giây |
| Thời lượng trận | trung bình **34.9 phút**, trung vị 36.5; 13% trận dưới 30 phút |
| Giao tranh | giữa 32 giây; 90% dưới 143 giây |
| Lỗi / tất định | 0 lỗi; tất định ✔ |

Thời lượng trận đã qua ba lần điều chỉnh:

| Lần | Thay đổi | Trung bình | Trận dưới 30 phút |
|---|---|---|---|
| 1 | Mới thêm rơi mảnh hồn, AI đi nhặt khắp bản đồ | 31.9 phút | 38% |
| 2 | Giới hạn AI đi nhặt ở xa | 33.3 phút | 21% |
| 3 | Kéo dài thời gian được hồi sinh lên 25 phút | **34.9 phút** | **13%** |

Lần 1 ngắn vì AI kéo nhau tới tranh mảnh hồn và kẻ hạ gục mạnh lên rất nhanh. Phép thử tắt hẳn việc đi nhặt cho thấy chính việc đổ dồn về tranh mảnh là nguyên nhân chính.

## 3. Chưa xong
- **Khoảng 40% số mảnh hết hạn mà không ai nhặt.** Mảnh Trắng giá trị thấp nên ít ai đi xa để nhặt.
- **Người khác ít khi cướp được mảnh** (3/25 lần nhặt). Kẻ hạ gục đứng ngay cạnh xác nên gần như luôn nhặt trước.
  - Nếu muốn kền kền tranh nhiều hơn, có thể cho mảnh văng xa hơn hoặc thêm thời gian chờ trước khi nhặt được.
- **Kẻ hạ gục mạnh lên nhanh**: trận hơi ngắn hơn trước. GĐ6c trung bình 36.0 phút, giờ 34.9 phút.

## 4. Con số khởi điểm mới / đã đổi

| Con số | Giá trị |
|---|---|
| Mảnh hồn rơi khi bị hạ | toàn bộ, giữ nguyên bậc |
| Thời gian chờ trước khi nhặt được | 0.8 giây |
| Bán kính nhặt | 1.3 đv |
| Thời gian mảnh nằm trên đất | 120 giây |
| AI đi nhặt | gần dưới 8 đv: nhặt ngay (×1.6); xa tới 30 đv: chỉ khi vắng người (×0.9) |
| Thời gian được hồi sinh | 20 phút đầu → **25 phút đầu** (để giữ trận 30–60 phút) |
