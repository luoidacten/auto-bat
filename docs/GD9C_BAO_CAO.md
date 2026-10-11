# GĐ9c — Sổ tiết kiệm, 6 trận mỗi chặng, chơi vô tận, charm không giới hạn & cộng dồn

Yêu cầu: "Thêm cơ chế tiền lãi — bạn có thể bỏ tiết kiệm, nó tích lũy, bạn có thể rút ở lượt sau; nếu không rút thì nó cho bạn tiền lãi bằng % số tiền bỏ vào. Số trận từ 3 lên 6, và [thắng ván rồi] bạn có thể tiếp tục vô cực. Charm không giới hạn số charm sở hữu, và charm có thể cộng dồn."

Cách hiểu đã chọn: "không thắng 6 ván…" là sau khi **tự do** (trả hết nợ) người chơi được **chơi tiếp vô tận**. Nếu ý khác (ví dụ: thua 6 trận liền vẫn được chơi tiếp) thì đổi được.

## 1. Đã làm gì

### Sổ tiết kiệm (`G.Run` trong `src/sim/bookie.js`, ô 🏦 trong `src/ui/bet_ui.js`)
- Gửi tiền mặt vào sổ ở màn chờ trận hoặc ở cửa hàng sau trận. Có nút **Gửi**, **Gửi hết**, **Rút**.
- Tiền gửi **lượt này bị khóa**, chỉ rút được sau trận tới. Tiền gửi từ trước rút lúc nào cũng được.
- Hết mỗi trận, sổ được lãi **5% số dư** và lãi nhập vào sổ (lãi kép). Ví dụ gửi 1.000, để yên 6 trận còn ≈ 1.340.
- Tiền trong sổ **không dùng để cược trong trận**, nhưng **vẫn tính vào chỉ tiêu** cuối chặng (tài sản = tiền mặt + tiết kiệm). Trả chỉ tiêu lấy tiền mặt trước, thiếu mới trừ vào sổ.
- Mua charm và trả nợ vay chỉ dùng tiền mặt, nên muốn mua thì phải rút trước.
- Thanh trạng thái hiện 💰 tiền mặt và 🏦 tiết kiệm. Sổ ghi lại tổng tiền lãi đã nhận.

### 6 trận mỗi chặng
- Ván = **3 chặng × 6 trận** (18 trận).
- Chỉ tiêu nâng theo số trận: **1.500 / 2.500 / 4.000**. Chặng cuối trả hết nợ 4.000 cộng mọi khoản vay để được tự do.
- Trận của nhà cái (khi bực ≥ 8) cần còn ≥ 2.500.

### Chơi tiếp vô tận
- Màn **🕊 TỰ DO** có nút **♾ Chơi tiếp vô tận**. Ván tiếp tục từ chặng 4, vẫn giữ tiền, tiết kiệm và charm.
- Chỉ tiêu mỗi chặng vô tận **×1.6**: 6.400 → 10.240 → 16.380 … Cuối chặng chỉ cần **có đủ** (tài sản trừ nợ vay), không phải nộp.
- Mỗi trận vô tận có thêm 1 người của nhà cái. Giá charm ngừng tăng sau chặng 6.
- Không đủ tiền thì ván dừng (kết cục "♾ Hết sức"), không bị tính là vỡ nợ. **Kỷ lục chặng vô tận** được lưu trên máy và hiện ở màn chờ và màn kết thúc.

### Charm không giới hạn, cộng dồn
- Bỏ giới hạn 5 ô. Cửa hàng vẫn bán **1 trong 3**, nhưng có thể bán **charm đã có**. Mua trùng thì cộng dồn; mỗi bản đã có làm giá bản sau đắt thêm 25%.
- Charm cùng loại gộp thành một thẻ có huy hiệu **×n**. Nút "bỏ 1" chỉ bỏ một bản.
- Quà của nhà cái và charm xấu khi vay cũng cộng dồn, kể cả mặt trái.

| Charm | 1 bản | Cộng dồn |
|---|---|---|
| 🦅 Mắt Kền Kền | +60 mỗi lần kền kền | +60 mỗi bản |
| 🕸 Lưới An Toàn | hoàn 50% cược đầu trận thua | 75% / 87% / … (1 − 0.5ⁿ) |
| 📜 Bảo Hiểm Giao Kèo | sai 1 câu giao kèo không vỡ | mỗi bản thêm 1 câu |
| 🔄 Lật Câu Hỏi | đổi 1 câu mỗi trận | mỗi bản thêm 1 lần |
| 🔍 Đọc Chữ Nhỏ | điều khoản ẩn hiện rõ | từ bản 2: điều khoản ẩn ít xuất hiện hơn (×0.7 mỗi bản) |
| 🕵 Tình Báo | lộ 1 người của nhà cái | mỗi bản lộ thêm 1 người |
| 🧀 Phô Mai Hảo Hạng | lách luật bực như can thiệp thường | 2 bản: không bực |
| 🔎 Kính Lúp | sức mạnh đúng giá trị thật | bản 2: chỉ thẳng tướng bị thổi phồng (🎈) |
| 🤝 Tay Trong | can thiệp −30% | ×0.7 mỗi bản |
| 🪙 Đồng Xu May Mắn | +10% tiền thắng | +10% mỗi bản |
| 🔭 Ống Nhòm | câu "Ai thắng?" hiện số thật | bản 2: mọi câu hiện tỷ lệ thật (~p%) |
| 🔐 Két Sắt | +5% tiền mặt (tối đa 300) | +5% / +300 mỗi bản |
| ⛓ Xiềng Nợ | −8% khoản vay mỗi trận | −8% mỗi bản |
| 🌫 Mắt Mờ | sai số thêm ±15% | ±15% mỗi bản |
| 🫳 Bàn Tay Nhờn | −10% tiền thắng | ×0.9 mỗi bản |
| 🎁 Ân Huệ / 💝 Món Quà Nhỏ / 🍬 Lời Hứa Ngọt | như cũ | mặt trái cộng dồn (thêm người nhà cái, thêm trận tỷ lệ xấu, thêm trận có điều khoản ẩn) |

### Khác
- Người chơi máy (`tools/van.js`) dùng sổ tiết kiệm: dư > 600 thì gửi 30% tiền mặt, thiếu < 300 thì rút.
- `THIET_KE.md` mục 19 cập nhật số mới.

## 2. Đo đạc
- Ván trọn vẹn bằng người chơi máy "đọc vị" (`tools/van.js`, 8 ván × 18 trận, `docs/GD9C_MO_PHONG.txt`): **1/8 ván tự do**, 7/8 qua 2 chặng rồi vỡ nợ ở chặng cuối. Kết quả ngang bộ số cũ (1/12), tức là gấp đôi số trận không làm ván dễ hay khó hơn.
  - Máy sống qua chặng 1–2 nhờ vay, nên cuối ván phải trả thêm tiền vay ×1.3.
  - Máy chỉ gửi tiết kiệm theo luật cứng (dư > 600 thì gửi 30%), nên chưa tận dụng lãi kép.
- Kiểm tra logic `G.Run`: gửi bị khóa đúng; lãi 5% sau trận (400 → 420); rút được sau trận; charm đếm đúng số bản; trả chặng cuối → tự do; vô tận chặng 4 cần 6.400, chặng 5 cần 10.240.
- Giao diện chạy thử trên trình duyệt (Playwright), **0 lỗi**: gửi tiết kiệm → trận → cửa hàng mua Đồng Xu lần 2–3 (×3) → trả chặng cuối → 🕊 Tự do → ♾ Chơi tiếp vô tận.

## 3. Chưa xong
- Nhánh trên GitHub đã được chỉnh tay (Solo 1v1, tắt can thiệp trong trận). GĐ9c được ghép lên trên, giữ nguyên các chỉnh đó. Vì can thiệp đang tắt nên 🤝 Tay Trong và 🧀 Phô Mai hiện không có tác dụng: có thể bỏ khỏi cửa hàng hoặc bật lại can thiệp.
- Chỉ tiêu và lãi 5% là số khởi điểm. Người chơi máy không đọc được tính cách hay ý định AI như người xem, nên kết quả đo là cận dưới; cần người chơi thật để chỉnh.
- Chưa có "Người triệu gọi & đồng điệu" (GDD mục 9).
- Ryoma vẫn quá mạnh (chờ đồng ý giảm sức mạnh).
- GĐ10 (7 tướng mới Luca, Kip, Olivia, Justus, Ratok, Dr. Caelus, Boran + tính cách Cuồng Loạn) làm tiếp sau phần này.

## 4. Con số khởi điểm mới
- Vốn 1.000; 3 chặng × 6 trận; chỉ tiêu 1.500 / 2.500 / 4.000 (tài sản = tiền mặt + tiết kiệm); chặng cuối trả 4.000 + tiền vay.
- Tiết kiệm: lãi 5% số dư mỗi trận, lãi kép; tiền gửi lượt này khóa tới hết trận sau.
- Vô tận: chỉ tiêu ×1.6 mỗi chặng (6.400 → 10.240 → 16.380 …), +1 người của nhà cái mỗi trận.
- Charm không giới hạn; giá bản trùng +25% mỗi bản đã có; giá theo chặng ×(1 + 0.1·min(chặng, 6)).
- Trận của nhà cái khi bực ≥ 8, cần còn ≥ 2.500.
