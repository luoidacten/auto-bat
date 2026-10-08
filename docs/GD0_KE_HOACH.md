# GĐ0 — Kế hoạch làm lại: Quản Lý Đội E-sport MOBA

> Tài liệu chờ duyệt. Chưa có dòng mã nào của bản mới.
> Ký hiệu: **S1–S3** = skill 1–3, **S4** = chiêu cuối, **HC** = hồi chiêu ở cấp chiêu 1 (giảm dần khi nâng),
> **đv** = đơn vị bản đồ (≈ 1 mét), ⚠️ = ngoại lệ so với quy tắc "S1/S2/S3 lấy từ A/B/C", cần anh duyệt.

---

## 1. Kế hoạch kỹ thuật (ngắn)

**Giữ bản cũ.** Ở đầu GĐ1 chép nguyên bản cũ sang `legacy/` trên nhánh này (vẫn chơi được tại `/legacy/` trên GitHub Pages).
Nhánh `main` không bị đụng tới cho tới khi anh hợp nhất.

**Cấu trúc mới** (JavaScript thuần, không bước build, chạy được cả trình duyệt lẫn Node):

```
index.html                 vỏ trang
src/core/                  rng (bộ sinh số có hạt giống), toán vector, lượng giác tất định, lưới không gian
src/data/                  tướng (mỗi tướng 1 tệp), trang bị, phép, bản đồ, bản cập nhật
src/sim/                   LOGIC TRẬN — không biết gì về canvas/DOM
  match.js                 trạng thái trận + step() bước cố định 1/20 giây
  combat.js  units.js  minions.js  towers.js  jungle.js  vision.js  economy.js
  ai/                      AI tuyển thủ (vi mô), AI đội trưởng (vĩ mô), AI HLV máy, AI cấm chọn
src/manager/               tuyển thủ, lịch tập, chuyển nhượng, tài chính, giải đấu, sự cố, bản cập nhật
src/ui/                    vẽ trận (chỉ ĐỌC trạng thái), HUD, bản đồ nhỏ, các màn hình quản lý
tools/mophong.js           bộ mô phỏng không giao diện: node tools/mophong.js --tran 2000 --hat 7
THIET_KE.md                mọi con số thiết kế, luôn khớp với mã
legacy/                    bản game cũ
```

**Tất định.** Mọi ngẫu nhiên trong trận lấy từ một bộ sinh số có hạt giống (sfc32) gắn với trận; giao diện không được rút
số từ bộ này. Lệnh HLV được ghi thành chuỗi `(tick, lệnh)`. Để phát lại giống hệt trên mọi trình duyệt, logic trận chỉ dùng
+ − × ÷ và căn bậc hai (được chuẩn hóa chính xác); sin/cos/atan2 dùng bản tự viết bằng đa thức thay cho `Math.sin`
(trình duyệt khác nhau có thể lệch ở chữ số cuối). Có bài kiểm tra: chạy 2 lần cùng hạt giống → so mã băm trạng thái mỗi 10 giây.

**Vẽ tách khỏi logic.** Logic chạy 20 bước/giây giờ game (x8 = 160 bước/giây thật). Phần vẽ nội suy giữa 2 bước nên vẫn mượt
60 khung hình. Nút "mô phỏng nhanh" chạy đúng logic đó, không vẽ.

**Chống treo trận** (2 lỗi của bản cũ):
- Hiệu ứng kích hoạt mang theo "độ sâu"; đòn phản (phản sát thương, phản đạn) không bao giờ kích hoạt phản đòn tiếp, và độ sâu tối đa là 3.
- Mỗi bước giới hạn số sự kiện kích hoạt; vượt ngưỡng thì ghi lỗi vào nhật ký trận rồi bỏ qua, không treo.
- Mọi hàm kích hoạt đều kiểm tra mục tiêu còn tồn tại/còn sống/đúng kiểu trước khi dùng (một hàm kiểm tra dùng chung).
- Bộ mô phỏng chạy hàng nghìn trận cũng là bộ dò lỗi: trận nào quá 60 phút giờ game hoặc phát sinh lỗi đều bị liệt kê kèm hạt giống để tái hiện.

**Hiệu năng điện thoại.** Lưới không gian cho truy vấn tầm; nền bản đồ vẽ sẵn một lần ra canvas phụ; giới hạn hạt hiệu ứng;
chế độ "đồ họa nhẹ"; tự hạ khung hình khi tua x4/x8. Giao diện chỉ màn ngang, có toàn màn hình. Hỗ trợ thêm cho điện thoại:
cài được lên màn hình chính như ứng dụng (PWA, chơi không cần mạng), nút bấm cỡ ngón tay, bảng thông tin trượt ra/vào.

**Lưu.** Khóa mới `dthlv_moba_v1`, không đọc bản lưu cũ; xuất/nhập bản lưu thành tệp `.json` hoặc chuỗi để chép.

**Bộ mô phỏng (Node)** in báo cáo: tỉ lệ thắng từng tướng, ma trận đối đầu cùng đường (cảnh báo cặp > 65%), phe xanh/đỏ,
phân bố thời lượng trận, tỉ lệ kéo tới phút 30, cấm chọn theo dữ liệu vs ngẫu nhiên, HLV máy vs không chỉ đạo,
ma trận kế hoạch × kế hoạch, thành thạo 100 vs 0, tỉ lệ dùng/thắng của trang bị.

### Lộ trình (theo đúng 6 giai đoạn anh đặt)

| GĐ | Nội dung chính | Đo bằng mô phỏng |
|---|---|---|
| 1 | Lõi trận (máu/mana/giáp/kháng, 3 loại sát thương, đánh thường, chiêu, cấp, hồi sinh), bản đồ 3 đường, trụ, nhà chính, lính, lính tiến công, camera, bản đồ nhỏ, AI đi đường cơ bản, bộ mô phỏng. **10 tướng**: Gideon, Clint (trên — Clint chơi vị trí phụ) · Koda, Death (rừng) · Ignatius, Ryoma (giữa) · Elara, Zero (xạ thủ) · Aria, Valerius (hỗ trợ — Valerius chơi vị trí phụ). Chưa có rừng nên người đi rừng tạm đi lại giữa các đường để hỗ trợ | phe xanh/đỏ, thời lượng, tỉ lệ thắng 10 tướng, đối đầu cùng đường |
| 2 | Rừng, bùa, sông, Lính Trinh Sát, Mắt Khai Quang, quái lớn, quái cuối, bụi cỏ, sương mù, vàng, trang bị, biến về, cây tiến hóa, phép bổ trợ, AI đi rừng/đảo đường/tranh mục tiêu, **16 tướng còn lại** | đủ mục tiêu về tướng, phe, thời lượng |
| 3 | Cấm chọn, kế hoạch đội, lệnh, hội ý, tua x1–x8 + tự chậm khi giao tranh, mô phỏng nhanh, HLV máy, mất bình tĩnh trong trận, **phỏng vấn sau trận** (bổ sung) | cấm chọn dữ liệu vs ngẫu nhiên, HLV máy vs không chỉ đạo, ma trận kế hoạch |
| 4 | Tuyển thủ (chỉ số ảnh hưởng AI), thành thạo, ăn ý, lịch tuần, chuyển nhượng, tài chính, giải nhiều hạng, ban lãnh đạo, HLV máy có cá tính | thành thạo 100 vs 0 |
| 5 | Stress, sự cố, bán độ, trứng phục sinh hack, hộp thư/bản tin, bản cập nhật theo mùa (**có bản làm lại tướng — đổi cách chiêu/nội tại hoạt động, không chỉ chỉnh số**, bổ sung), tân binh, giải nghệ, khung thêm tướng mới | — |
| 6 | Cân bằng diện rộng, hướng dẫn người mới, hoàn thiện giao diện điện thoại | chạy lại toàn bộ mục tiêu |

Mỗi giai đoạn kết thúc: game chạy được + báo cáo (đã làm, số đo, việc dở, các con số "khởi điểm" đã chỉnh).

### Thứ bỏ đi
Điểm văng, rơi đài, 11 sàn đấu và hiểm họa sàn; luật "người một nhà" và mọi luật cốt truyện trong trận (Elara khóa Borg,
Percy né Elara, Koda hóa điên vì Aria, Joker né theo giới tính, +35% vàng khi thắng…); luyện chỉ số từng tướng;
chế độ 1v1/Hỗn Chiến/Xa Luân; bộ chiến thuật cũ (Tấn công/Phòng thủ/Thả diều…); lệnh riêng từng tướng; trang bị 3 bậc cũ.
Cá tính AI của từng tướng (lối đánh, thứ tự combo, lúc nào lùi) **giữ lại** nhưng chỉ là lối chơi, không phải luật.

### Cách tránh lặp lại 3 bài học cũ
1. **Lệnh HLV có sức nặng.** AI tuyển thủ tự lo vi mô (ăn lính, combo, né chiêu). Vĩ mô (đi đâu, đánh mục tiêu nào, lúc nào
   giao tranh) mặc định do đội trưởng quyết, chất lượng theo chỉ số Chỉ Huy và **chỉ dựa trên những gì đội đang thấy** — đội
   trưởng hay bỏ sót đồng hồ quái, không nhớ chiêu cuối đối phương đã dùng, không để ý ai đang mất bình tĩnh. HLV thấy những
   thứ đó trên giao diện. Lệnh đúng lúc tạo lợi thế quân số/mục tiêu; lệnh có thời gian cam kết (tuyển thủ theo lệnh vài chục
   giây kể cả khi lệnh tệ) nên lệnh sai mất thật.
2. **Không kế hoạch luôn đúng.** Kế hoạch là hành vi cụ thể chứ không phải hệ số nhân. Nhịp đầu trận khắc nhau vòng tròn:
   *Ép đường* thắng *An toàn* (ăn thêm vàng trụ, đè cấp) → *An toàn* thắng *Xâm lăng rừng* (người đi đường giữ mắt sông, kéo
   về đúng lúc, bắt người xâm lăng 3 đánh 1) → *Xâm lăng rừng* thắng *Ép đường* (đường bị đẩy sâu không về kịp, mất bùa và quái).
   Mô phỏng đo ma trận 3×3; mục tiêu mỗi ô 45–55%. Lối chơi hổ báo/an toàn của từng tuyển thủ cũng có giá: hổ báo ăn nhiều
   hơn nhưng chết nhiều hơn khi bị bắt lẻ.
3. **Không cặp khắc tuyệt đối.** Không cơ chế "có/không" (miễn nhiễm hẳn một loại sát thương, tàng hình không thể phát hiện,
   giết ngay). Mọi khắc chế là mềm và có món đồ/phép để đáp trả. Báo cáo mô phỏng tự liệt kê cặp đối đầu cùng đường > 65%.

---

## 2. Xếp 26 tướng vào 5 vị trí

| Vị trí | Tướng (vị trí chính) | Chơi tạm được |
|---|---|---|
| **Đường trên** (5) | Valerius, Gideon, Borg, Florian, Kazuki | Theron, Wukong, Clint, Galo, Ryoma, Roxie |
| **Đi rừng** (7) | Theron, Koda, Wukong, Vesper, Galo, Clint, Death | Gideon, Borg, Kazuki, Alice |
| **Đường giữa** (6) | Ignatius, Alice, Ryoma, Thanh Phong, Roxie, Joker | Florian, Vesper, Chrono & Neo, Victoria |
| **Xạ thủ** (5) | Elara, Percy, Zero, Chrono & Neo, Jack | Raven |
| **Hỗ trợ** (3) | Aria & Oktava, Victoria, Raven | Valerius, Thanh Phong, Joker, Death |

| Tướng | Kiểu | Sát thương chính |
|---|---|---|
| Valerius | Đỡ đòn khống chế | Vật lý |
| Gideon | Đỡ đòn tầm với, mở giao tranh | Vật lý |
| Borg | Đấu sĩ lì đòn, khóa mục tiêu | Vật lý |
| Florian | Đấu sĩ đơn đấu, chia đẩy | Vật lý + chuẩn |
| Kazuki | Đấu sĩ phản đòn | Vật lý |
| Theron | Đấu sĩ ghim tường (dùng tường rừng) | Vật lý + chuẩn |
| Koda | Sát thủ chảy máu, bám tường | Vật lý |
| Wukong | Đấu sĩ khống chế diện rộng | Vật lý |
| Vesper | Sát thủ tàng hình | Vật lý |
| Galo | Đổi dạng, gieo độc | Phép |
| Clint | Bắn tầm gần | Vật lý |
| Ignatius | Pháp sư dồn sát thương | Phép |
| Alice | Ảo thuật, đánh lừa | Phép |
| Ryoma | Kiếm sĩ combo | Vật lý |
| Thanh Phong | Khống chế gió, ru ngủ | Phép |
| Roxie & T-Zero | Kỹ sư ụ pháo, gọi máy | Phép |
| Joker | Bài may rủi | Phép |
| Elara | Xạ thủ thả diều | Vật lý |
| Percy | Xạ thủ dồn tốc đánh | Vật lý |
| Zero | Xạ thủ dồn băng đạn | Vật lý |
| Chrono & Neo | Xạ thủ đổi thế | Vật lý |
| Jack | Xạ thủ may rủi | Vật lý |
| Aria & Oktava | Hỗ trợ bảo hộ | Phép |
| Victoria | Hỗ trợ hào quang + lính | Vật lý |
| Death | Đi rừng móc kéo, kết liễu | Phép |
| Raven | Hỗ trợ trinh sát, bắn tỉa | Vật lý |

**Vị trí thiếu tướng**
- **Hỗ trợ thiếu nhất:** chỉ 3 tướng chính (Aria, Victoria, Raven), và chỉ Aria là hỗ trợ bảo hộ thật sự (khiên). Cấm 2 +
  chọn 1 là đối thủ có thể ép một đội phải chơi hỗ trợ tạm (Valerius/Thanh Phong/Joker/Death). Đi rừng thì thừa (7 tướng).
- **Đỡ đòn mỏng:** chỉ Valerius, Gideon, Borg thật sự lì. Rất nhiều đội hình sẽ không có đỡ đòn.
- **Sát thương phép lệch:** 8/26 tướng gây phép, đường trên không có tướng phép chính (chỉ Galo chơi tạm). Phải giữ đồ giáp
  không quá rẻ, nếu không mua giáp sẽ luôn đúng.
- **Đề xuất 2 tướng mới đầu tiên** (khi dựng khung tướng mới ở GĐ5): một hỗ trợ hồi máu/khiên gây phép và một đỡ đòn
  đường trên gây phép.

---

## 3. Chuyển chiêu cũ sang bộ chiêu mới

**Quy tắc chung**
- Đánh thường: mọi tướng có, cận chiến hoặc tầm xa. **S1/S2/S3 ← A/B/C cũ**, **S4 ← Nộ cũ (U)**, bỏ thanh Nộ, dùng hồi chiêu.
- **D cũ** → gộp vào nội tại (hoặc vào một chiêu khác); với 8 tướng đặc thù (Aria, Wukong, Galo, Alice, Thanh Phong, Joker,
  Chrono & Neo, Victoria) thì thành **skill phụ** (không tốn điểm chiêu, có từ cấp 1, mạnh theo cấp tướng). Roxie có thêm
  skill phụ Tự Hủy khi đang cưỡi máy.
- ⚠️ **Ngoại lệ:** khi A cũ thực chất là một phát bắn/nhát chém thường (A hồi 0.5–1 giây), A trở thành **đánh thường** và D cũ
  lên thay ô trống. Có 9 tướng như vậy: Borg, Vesper, Clint, Percy, Zero, Jack, Death, Raven, và Roxie (không có Nộ, T-Zero lên S4).
- Mọi "lực văng" → sát thương + khống chế (choáng, hất tung, đẩy lùi 1–3 đv, làm chậm, câm lặng…).
  "Đối thủ trên 100% điểm văng" → "mục tiêu dưới 30% máu".
- Cấp 1→18 (đã duyệt lại), mỗi cấp 1 điểm. S1–S3 tối đa 5 cấp, S4 tối đa 3 cấp (mở ở cấp 4, nâng ở 8 và 12) → đúng 18 điểm.
- Cây tiến hóa: 5 hàng nội tại cũ (mốc 1/3/6/9/12, mỗi hàng 3 nhánh = 390 nhánh) giữ tên và tinh thần, viết lại hiệu ứng theo
  hệ máu. Hàng 6 và 12 cũ vốn là "chiêu mới / phong cách mới" nên vẫn là những nhánh thay đổi cách chiêu hoạt động.
- Số HC dưới đây là khởi điểm, sẽ chỉnh theo mô phỏng.

### Đường trên

**Valerius** · cận chiến · mana · vật lý
- Nội tại — *Công Thủ*: giảm 6% sát thương nhận. Mỗi lần trúng đòn tích 1 Phản Kích (tối đa 3), đòn đánh thường kế tiếp cộng sát thương mỗi tầng. *Cuồng Phong (D cũ)*: sau mỗi lần dùng chiêu, đòn đánh kế tiếp chém vòng quanh người, làm chậm 30%.
- S1 Chém Vòng Cung (A): chém quạt 130°, làm chậm nhẹ. HC 7s.
- S2 Đâm Thẳng (B): đâm thẳng 5 đv, cộng sát thương theo % máu đã mất của mục tiêu. HC 9s.
- S3 Khiên Chắn (C): giơ khiên 1s giảm 60% sát thương phía trước; kết thúc bằng cú húc: choáng 0.75s + câm lặng 1s. HC 14s.
- S4 Chiến Thần Bất Tử (U): 4s máu không xuống dưới 1, +30% tốc chạy, +20% sát thương. HC 110/95/80s.

**Gideon** · cận chiến tầm với · mana · vật lý
- Nội tại — *Điểm Ngọt*: trúng bằng mũi kiếm (20% ngoài cùng tầm) +35% sát thương và làm chậm 20%; trúng bằng cán −30%. *Cán Kiếm (D cũ)*: khi địch áp quá sát, đòn đánh thường thành cú húc cán đẩy lùi ra đúng tầm mũi kiếm (HC 8s).
- S1 Quét Ngang (A): gồng 0.3s rồi vung 180°. HC 7s.
- S2 Bổ Dọc (B): đòn dài nhất bộ; trúng điểm ngọt thì trói chân 0.75s. HC 10s.
- S3 Thế Thủ Tụ Lực (C): gồng tối đa 2s, giảm 40% sát thương, không thể cản phá; thả ra thì S1/S2 kế tiếp +25% tầm và ra đòn ngay. HC 16s.
- S4 Khai Thiên Lập Địa (U): cắm kiếm tạo chấn động bán kính 6 đv (cũ: toàn sàn): ở tâm hất tung 1s, ở rìa làm chậm. HC 120/100/80s.

**Borg** · cận chiến · KHÔNG MANA · vật lý
- Nội tại — *Huyết Chiến*: càng ít máu sát thương càng cao (tối đa +35% khi dưới 30% máu), dưới 30% máu đòn đánh gây thiêu đốt. *Đấm Móc (A cũ)*: cứ đòn đánh thường thứ 3 hất tung 0.3s.
- S1 ⚠️ Chộp & Quật (D cũ): lao tới chộp, quật ra sau lưng, choáng 1s. HC 12s.
- S2 Trả Đòn (B): cú đấm toàn lực; nếu vừa Gồng thì cộng 40% lượng sát thương đã hấp thụ và đẩy lùi. HC 9s.
- S3 Gồng Mình (C): gồng tối đa 1.5s, giảm 50% sát thương, không bị đẩy (vẫn dính choáng/trói). HC 14s.
- S4 Đấu Trường La Mã (U): dựng võ đài 4s quanh mình, kẻ địch bên trong không ra được; Borg giảm 25% sát thương nhận. HC 120/100/80s.

**Florian** · cận chiến · mana · vật lý + chuẩn
- Nội tại — *Đâm Lao (A cũ, đã duyệt lại)*: cứ 8s, đòn đánh thường kế tiếp được cường hóa thành cú lao tới mục tiêu; hồi chiêu làm mới ngay khi phá được một điểm yếu.
- S1 Tứ Ấn (D cũ, đã duyệt lại): ném một dấu; trúng thì mở 4 điểm yếu (Đông–Tây–Nam–Bắc) trên mục tiêu. Đánh trúng đúng hướng: phá điểm yếu — sát thương chuẩn theo % máu tối đa, hồi máu, +tốc chạy.
- S2 Phân Ảnh (B): phân ảnh lao ngược về phía Florian, kéo nhẹ và làm chậm kẻ trúng. HC 10s.
- S3 Thế Thủ (C): 0.75s đỡ mọi sát thương và khống chế; đỡ trúng thì choáng kẻ cận chiến 1s / làm chậm kẻ tầm xa. HC 16s.
- S4 Kiếm Thế Tứ Ấn (U): đặt cả 4 ấn lên một tướng trong 6s; phá đủ 4 thì nổ sát thương chuẩn lớn + vùng hồi máu cho đồng đội 3s. HC 110/90/70s.

**Kazuki** · cận chiến · KHÔNG MANA (Ý Niệm) · vật lý
- Nội tại — *Song Kiếm Vô Niệm*: đánh thường luân phiên tay trái nhanh / tay phải nặng; Ý Niệm (0–100) tự hồi, chiêu tốn Ý Niệm; Kiếm Ý tích theo kiếm thế. *Vô Tướng Nghịch Trảm (D cũ)*: khi đang không ra chiêu mà trúng chiêu của tướng địch trước mặt thì tự đỡ, choáng kẻ đó 0.75s và hồi ngay S3 (1 lần mỗi 20s).
- S1 Tả Trảm (A): chém nhanh, gạt đạn nhỏ. HC 3s.
- S2 Hữu Trảm (B): chém nặng, tầm rộng. HC 6s.
- S3 Kiếm Thế Quyết (C): theo 2 chiêu trước — AA xoay 360° · AB đâm choáng 1s · BA chém chữ X gây Vết Thương Sâu · BB lướt xuyên 4 đv choáng 1s. HC 10s.
- S4 Vạn Cảnh Trảm Vực (U): lướt dài, để lại vùng loạn kiếm 4s (sát thương, hút nhẹ, cấm lướt). Bỏ điều kiện 10 Kiếm Ý; Kiếm Ý giảm HC S4. HC 110/90/75s.

### Đi rừng

**Theron** · cận chiến tầm với · mana · vật lý + chuẩn
- Nội tại — *Xuyên Phá*: đòn đâm xuyên nhiều mục tiêu, 20% sát thương đâm là chuẩn. *Quét Chân (D cũ)*: cứ 12s, đòn đánh kế tiếp quét 360° làm ngã 0.5s (ngắt chiêu đang niệm).
- S1 Liên Hoàn Đâm (A): đứng đâm 3 nhát thẳng, dài và hẹp. HC 6s.
- S2 Xung Phong (B): lao 7 đv ủi mục tiêu theo; ủi vào tường rừng hoặc trụ thì choáng 1.5s, không có tường thì hất tung 0.5s cuối đà. HC 12s.
- S3 Chống Thương Nhảy (C): bật lên 1s không thể bị chọn; bấm lại thì dậm xuống làm chậm. HC 14s.
- S4 Mưa Thương (U): vùng bán kính 7 đv trong 3s; trúng thì trói chân 1s (mỗi tướng 1 lần). HC 120/100/80s.

**Koda** · cận chiến · KHÔNG MANA · vật lý
- Nội tại — *Vết Thương Sâu*: đòn đánh và chiêu gây 1 tầng Chảy Máu (tối đa 5, sát thương vật lý theo thời gian).
- S1 Cào Loạn Xạ (A): 2 nhát cào nhanh; lao xuống từ tường thì ×1.5. HC 5s.
- S2 Xé Toạc (B): kích nổ toàn bộ Chảy Máu thành sát thương tức thì; đủ 5 tầng thì làm chậm 60% 1.5s và cộng sát thương theo máu đã mất. HC 9s.
- S3 Vồ Mồi / Bám Tường (C + D cũ gộp): vồ tới 5 đv; trúng địch thì đè trói 0.5s; trúng tường rừng thì bám tường tối đa 3s (không thể bị chọn), bấm lại để lao xuống. HC 12s.
- S4 Thú Tính (U): 5s hóa bóng đen, +50% tốc chạy, đi xuyên người; mỗi lần lướt qua địch gây 1 tầng Chảy Máu. HC 100/85/70s.

**Wukong** · cận chiến tầm trung · KHÔNG MANA (Côn Thức) · vật lý
- Nội tại — *Côn Thức Vũ*: thanh Côn Thức tích khi đánh trúng/bị đánh/né; đủ 50 thì cường hóa chiêu kế tiếp, đủ 100 thì bậc tối đa; chiêu cường hóa gắn Khí Ấn.
- S1 Toàn Phong Côn (A): xoay côn 0.5s, gạt đạn nhỏ; cường hóa thì hút vào tâm. HC 7s.
- S2 Trực Thích (B): thúc côn thẳng, đẩy lùi 2 đv; cường hóa thì dài gấp đôi và xuyên. HC 9s.
- S3 Kình Thiên Trụ (C): bật lên không thể bị chọn 0.8s rồi bổ xuống hất tung; cường hóa thì gồng tới 2s, choáng 1–1.5s diện rộng. HC 14s.
- **Skill phụ** — Định Thân Thuật (D cũ): chỉ dùng khi mục tiêu có 2 Khí Ấn, hóa đá 1.5s. HC 20s.
- S4 Đại Thánh Hàng Thế (U): sóng đẩy lùi 360°; 6s không thể cản phá, +30% tốc chạy, S1/S2 tự cường hóa. HC 120/100/85s.

**Vesper** · cận chiến · mana · vật lý
- Nội tại — *Đâm Sau Lưng*: đòn từ sau lưng +40% sát thương và câm lặng 0.75s (mỗi mục tiêu 1 lần mỗi 8s). *Chém Nhanh (A cũ)* thành đánh thường.
- S1 ⚠️ Phi Dao Ảnh Bộ (D cũ): ném dao độc câm lặng 1s; trúng thì trong 2s bấm lại để dịch chuyển ra sau lưng mục tiêu. HC 9s.
- S2 Xuyên Tâm (B): lao xuyên qua kẻ địch chém mạnh (từ sau lưng mạnh hơn). HC 8s.
- S3 Ẩn Thân (C): tàng hình 2.5s, +40% tốc chạy; bị lộ khi đứng sát địch hoặc bị soi. HC 16s.
- S4 Bão Phi Đao (U): 10 dao quanh người; trúng thì dịch chuyển ra sau một mục tiêu, đòn kế tiếp ×2 (cũ ×3). HC 100/85/70s.

**Galo** · tầm trung/cận chiến · KHÔNG MANA (tốn máu) · phép
- Nội tại — *Độc Tiêu Xương*: đòn độc găm tầng (tối đa 6), mỗi tầng giảm 4% giáp và kháng phép (cũ: kháng đẩy). Dạng Người: chiêu tốn 3–5% máu hiện tại.
- **Skill phụ** — "Quá Liều!" (D cũ): hóa Quái Thú 15s (cận chiến, có khiên, chiêu miễn phí, đổi bộ S1–S3); hết dạng bị Vã Thuốc chậm 2s. HC 40s.
- S1 Ném Lọ Độc / Song Trảo (A). HC 5s / 3s.
- S2 Bom Khí Ngạt (vũng độc chậm + mù) / Ngoạm Cắn (lao ngoạm, mạnh hơn nếu đủ 6 tầng) (B). HC 10s / 7s.
- S3 Nhảy Lùi Thoát Hiểm / Hống Xung Phong (C). HC 12s / 9s.
- S4 Đại Dịch / Thợ Săn Tối Thượng (U): Người — sương độc vùng lớn 6s, đối phương trong vùng bị thu hẹp tầm nhìn và lập tức đủ 6 tầng · Thú — 8s +40% tốc chạy, cú cắn kết liễu mục tiêu dưới 15% máu (cũ: tống ra khỏi sàn). HC 120/100/80s.

**Clint** · bắn tầm gần · mana · vật lý
- Nội tại — *2 Viên Đạn*: đánh thường là phát súng săn tỏa nón (cực gần thì mạnh, xa thì yếu), 2 viên, tự nạp 1.5s/viên. *Bắn (B cũ)* thành đánh thường.
- S1 Báng Súng (A): đập báng, làm chậm 30%; trúng thì nạp 1 viên. HC 6s.
- S2 ⚠️ Nạp Đạn Khẩn Cấp (D cũ): ném vỏ đạn choáng 0.5s, nạp đầy 2 viên, phát kế tiếp chắc chắn chí mạng. HC 12s.
- S3 Bắn Nhảy (C): bắn xuống đất bật nhảy 4 đv theo hướng chọn, kẻ dưới chân bị thiêu. HC 12s.
- S4 Dragon's Breath (U): nạp 2 viên đạn rồng, mỗi phát phun lửa nón dài, thiêu đốt và đẩy lùi. HC 100/85/70s.

**Death** · cận chiến tầm với · mana · phép (Đi rừng chính, Hỗ trợ phụ)
- Nội tại — *Lưỡi Hái Tử Thần*: trúng bằng lưỡi (70% ngoài) thì thêm sát thương và hồi máu nhỏ, trúng bằng cán chỉ gây sát thương nhẹ. *Gặt (A cũ)* thành đánh thường quét vòng cung (trúng nhiều mục tiêu); đánh trúng kẻ vừa bị kéo thì hất tung.
- S1 ⚠️ Lưỡi Hái Đoạt Mệnh (D cũ): quăng liềm 7 đv rồi giật về, kéo kẻ trúng theo vòng cung về cạnh Death. HC 14s.
- S2 Phán Quyết (B): bổ liềm + cầu hắc ám bay xa; +50% sát thương lên mục tiêu dưới 30% máu (cũ: trên 100% điểm văng). HC 10s.
- S3 Xoay Liềm (C): thả liềm xoay 2s hút nhẹ; bấm lại thì dịch chuyển tới liềm chém vòng. HC 14s.
- S4 Gọi Hồn (U): 2 bóng ma bắt chước đòn của Death quanh mục tiêu 5s. HC 120/100/80s.

### Đường giữa

**Ignatius** · tầm xa · mana · phép
- Nội tại — *Hỏa Ấn*: mọi chiêu gây Thiêu Đốt (cộng dồn 3), vừa đi vừa niệm được. *Vòng Lửa (D cũ)*: khi tướng cận chiến áp sát, tự bùng vòng lửa đẩy lùi (HC 15s).
- S1 Cầu Lửa (A): cầu lửa tự ngắm, nổ lan. HC 5s.
- S2 Đại Hỏa Cầu (B): giữ tích tối đa 1.5s, càng tích càng to; +25% sát thương lên mục tiêu dưới 30% máu. HC 10s.
- S3 Dịch Chuyển (C): dịch chuyển 5 đv, điểm đến nổ đẩy lùi nhẹ, tăng tốc 1s. HC 16s.
- S4 Thiên Thạch (U): tầm 20 đv, rơi sau 1s, hất tung 0.75s, để lại vùng lửa 4s. HC 110/90/70s.

**Alice** · tầm trung · mana · phép
- Nội tại — *Náo Nhiệt* (0–100, tích khi trúng đòn hoặc khi ảo ảnh bị đánh) để cường hóa S1/S2; *Bị Lừa Rồi Nha!*: ảo ảnh bị phá thì phát nổ. *Thoát Hiểm Ảo Ảnh* (cũ: 1 lần khi rơi đài) → 1 lần mỗi 180s: đòn chí tử bị thay bằng tàng hình 1s với 1 máu.
- S1 Phi Dao Ảo Thuật (A): phi dao tầm trung; tốn 20 Náo Nhiệt thì 8 dao 360°. HC 5s.
- S2 Lướt Đâm (B): lướt 4 đv đâm; tốn 20 thì tàng hình và để lại ảo ảnh. HC 9s.
- S3 Ảo Ảnh Độc Lập (C): tạo ảo ảnh 8s (AI địch bị lừa nhiều hay ít tùy chỉ số Đọc Bản Đồ của tuyển thủ, thay cho luật "tướng bản năng thấp" cũ); đủ 50 Náo Nhiệt thì hoán đổi chỗ với kẻ địch gần nhất, 5 ảo ảnh vây 3s. HC 16s.
- **Skill phụ** — Tẩu Thoát, Ohh! (D cũ): đổi chỗ với một ảo ảnh. HC 12s.
- S4 Rực Rỡ, Cùng Vui Nào! (U): tự chọn 1 trong 3 biến thể theo tình huống (thoát hiểm / làm mới hồi chiêu / hộp ảo thuật). HC 110/90/70s.

**Ryoma** · cận chiến · KHÔNG MANA · vật lý
- Nội tại — *Liên Hoàn*: 2 chiêu liên tiếp trong 2s tạo Combo (AA chém tròn · AB lướt chém · AC hư ảnh · BB đâm choáng · BC dư ảnh lao · CC lốc làm chậm), hồi ngay S1. *Kiếm Khí (D cũ)*: sau Combo, đòn đánh kế tiếp phóng kiếm khí xuyên thấu, phá đạn.
- S1 Nhất Đao (A): chém vòng cung. HC 4s.
- S2 Đột Thích (B): đâm thẳng. HC 7s.
- S3 Thuấn Bộ (C): lướt ngắn. HC 9s.
- S4 Vô Ảnh Trảm (U): dịch chuyển chém quanh mục tiêu 5 lần (không thể bị chọn) rồi chém kết liễu, cộng sát thương theo máu đã mất. Bỏ điều kiện 5 Combo; mỗi Combo giảm 3s HC S4. HC 100/85/70s.

**Diệp Thanh Phong** · tầm trung · KHÔNG MANA (Thước Gió) · phép
- Nội tại — *Khí Áp Phong Vũ*: thước gió 0–100. Thuận (≤35): +tốc chạy, Giáp Phong Hộ chặn 1 đòn mỗi 10s · Bão Hòa (36–64): đòn gây Gió Mê, 3 tầng thì ngủ 1s · Nghịch (≥65): +sát thương. S1 kéo gió −15, S2 đẩy +15.
- S1 Toàn Phong Quy (A): lốc xoáy thẳng hất tung; Thuận: thành vực xoáy giữ 1.5s · Nghịch: lướt theo lốc ra sau lưng. HC 7s.
- S2 Bát Diện Phong Trận (B): đẩy dạt 360° 2 đv; Thuận: màng chắn đạn 3s · Nghịch: phóng lưỡi gió rồi dịch chuyển ra sau lưng đâm chí mạng. HC 10s.
- S3 Mê Tung Phong Vực (C): vùng gió độc 3s gây mù + câm lặng 1.25s; bản thân dịch chuyển 4 đv. HC 15s.
- **Skill phụ** — Nghịch Chuyển Canh Khí (D cũ): Thuận ↔ Nghịch; ở Bão Hòa thì kích nổ ngẫu nhiên và thanh tẩy khống chế. HC 12s.
- S4 Cơn Gió Đưa Giấc (U): vùng bão 5s làm chậm 50%; đứng trong vùng quá 2s thì ngủ 1.5s; đòn đầu tiên đánh thức gây ×1.5. HC 120/100/80s.

**Roxie & T-Zero** · tầm xa · KHÔNG MANA (Bánh Răng) · phép
- Nội tại — *Bánh Răng & Sáng Tạo*: lính/quái/tướng chết gần Roxie rơi bánh răng (tối đa 9), mỗi cái +1% tốc chạy; chiêu tốn bánh răng.
- S1 Khai Hỏa / Pháo Kích (A): đặt Ụ Pháo (tốn 2 bánh răng, tối đa 2 ụ, tự bắn 20s); thiếu bánh răng thì bắn 1 viên cấu rỉa. HC 4s.
- S2 Khai Tâm (B): kích nổ ụ gần nhất, sát thương vùng, hoàn 1 bánh răng, +tốc chạy 2s. HC 8s.
- S3 Bất Ngờ Chưa (C): lộn ra sau, choáng tại chỗ cũ; dùng được khi đang bị khống chế. HC 18s.
- S4 ⚠️ Thiết Vệ T-Zero (D cũ — Roxie vốn không có Nộ): cưỡi T-Zero 12s (máu riêng, bộ chiêu đổi: đấm / phun lửa / húc), mỗi bánh răng đang có +0.5s. HC 120/100/80s.
- **Skill phụ** — khi đang cưỡi: Tự Hủy (nhảy ra, máy phát nổ).

**Joker** · tầm xa · mana · phép
- Nội tại — *Bịp Bợm*: S1 25% / S2–S3 10% được nhân đôi; Ấn Mặt Trời (2 lá Rô/Cơ) + Ấn Mặt Trăng (2 lá Bích/Tép) cùng lúc thì choáng 1.5s. Bỏ né theo giới tính và +35% vàng khi thắng.
- S1 Phi Bài Sắc Cạnh (A): ném lá đang giữ, áp hiệu ứng chất bài. HC 4s.
- S2 Rút Bài May Rủi (B): Bích sát thương · Tép khống chế ngẫu nhiên · Rô nổ lan · Cơ hồi máu đồng minh · Joker đổi chỗ; rút hụt 10% (cũ 25%) và hoàn 50% HC. HC 6s.
- S3 Tráo Bài (C): lướt 3 đv và đổi bài. HC 10s.
- **Skill phụ** — "Mượn Tý Nha!" (D cũ): khi ai đó trong tầm nhìn dùng trang bị kích hoạt hoặc phép bổ trợ, ô phụ nạp bản sao trong 10s. HC 40s.
- S4 Ván Cờ Đổi Chiều (U): 45% Lá Toàn Năng · 30% Đại Bác Bài quét ngang · 20% Tráo Sinh Mệnh (đổi % máu với một tướng địch, chênh lệch tối đa 30%) · 5% Cơn Ác Mộng (choáng 2.5s). Bỏ 0.2% giết ngay và choáng 10s. HC 110/90/70s.

### Xạ thủ

**Elara** · tầm xa · mana · vật lý
- Nội tại — *Linh Hoạt*: +20% tốc chạy khi lùi xa địch; 5s không tấn công thì đòn kế tiếp được Tập Trung (+tầm, +25% sát thương). *Tên Hình Nón (D cũ)*: khi tướng cận chiến áp sát, đòn kế tiếp bắn nón đẩy lùi (HC 10s).
- S1 Liên Xạ (A): 3 mũi liên tiếp, mỗi mũi áp 60% hiệu ứng đòn đánh. HC 7s.
- S2 Kéo Căng Dây (B): giữ tích tối đa 1.5s, xuyên thấu, tầm rất xa. HC 12s.
- S3 Sao Băng Lùi (C): nhảy lùi và bắn 3 sao băng hình nón làm chậm 40%. HC 14s.
- S4 Thần Tiễn Phá Không (U): mũi tên khổng lồ bay hết bản đồ, choáng 0.5–2s theo quãng bay. HC 100/85/70s.

**Percy** · tầm xa · mana · vật lý
- Nội tại — *Dồn Dập*: đánh trúng liên tục +tốc đánh mỗi tầng (tối đa 8), mất sau 2.5s; chạy nhanh hơn 5%. *Tên Nỏ (A cũ)* thành đánh thường.
- S1 ⚠️ Trận Địa Nỏ (D cũ): đứng yên mở vùng tự bắn mọi kẻ địch trong vùng, tối đa 4s, di chuyển thì dừng. HC 14s.
- S2 Móc & Đạp (B): móc kéo mục tiêu về sát, choáng 0.5s rồi đạp lùi 3 đv. HC 14s.
- S3 Lướt Chiến Thuật (C): lướt 4 đv, không ngắt Trận Địa (dời vùng theo). HC 10s.
- S4 Liên Châu (U): 5s mỗi phát đánh thường và Trận Địa bắn 3 mũi (mũi phụ 40%). HC 100/85/70s.

**Zero** · tầm xa · mana · vật lý
- Nội tại — *Vũ Trang Hiện Đại*: đánh thường dùng băng 9 viên, hết thì nạp 2.5s; đạn mạnh, tốc đánh thấp. *Phát Bắn (A cũ)* thành đánh thường.
- S1 ⚠️ Khóa Mục Tiêu (D cũ): đánh dấu một tướng 6s (+10% sát thương lên nó, lộ hình); bắn trúng 5 lần thì S3 được cường hóa. HC 10s.
- S2 Xả Băng (B): xả toàn bộ đạn còn lại thật nhanh (mỗi viên 70%). HC 9s.
- S3 Nhảy Lùi (C): nhảy lùi, giảm 25% sát thương 1s; cường hóa thì lướt xa tức thì + nạp đầy đạn. HC 12s.
- S4 Băng Đạn Nổ (U): 8s đạn nổ lan và mạnh hơn. HC 90/75/60s.

**Chrono & Neo** · tầm xa · mana · vật lý
- Nội tại — *Hai Thời Đại*: 2 thế, mỗi thế một băng đạn: Chrono 4 viên nặng (chậm, đau, xuyên giáp); Neo 10 viên nhẹ (nhanh, +8% tốc chạy).
- **Skill phụ** — Chuyển Thế (D cũ): sang Chrono thì sóng đẩy lùi quanh người + giảm sát thương 1s; sang Neo thì +40% tốc chạy 1.5s. HC 4s.
- S1 Phát Bắn Cường Hóa (A): Chrono 1 viên nặng xuyên, đẩy lùi · Neo 2 viên nhanh làm chậm. HC 6s.
- S2 Thời Khắc (B): Chrono Liên Xạ 3s, đi chậm, không thể cản phá · Neo mưa đạn 7 viên hình nón. HC 14s.
- S3 Bước Thời Gian (C): Chrono bước lên + giảm sát thương · Neo lướt để lại ảo ảnh, bấm lại để quay về. HC 12s.
- S4 Liên Hoa Thời Không (U): 5s hợp nhất, xả đạn hoa sen quanh người; dùng ngay sau Chuyển Thế thì hoa to gấp đôi. HC 110/90/70s.

**Jack "Sáu Lỗ"** · tầm trung · mana · vật lý
- Nội tại — *Gieo Xúc Xắc*: ổ 6 viên, nạp 2s; mỗi lần nạp gieo xúc xắc (từ bộ sinh số của trận): ⚀ tự mất 4% máu · ⚁–⚄ cả ổ +5–20% sát thương · ⚅ cả ổ chí mạng + choáng 0.25s. Kỳ vọng cân bằng như một tướng bình thường. *Bắn (A cũ)* thành đánh thường.
- S1 ⚠️ Quạt Cò (B cũ): xả hết đạn còn lại hình nón. HC 8s.
- S2 ⚠️ Cò Quay Nga (D cũ): nạp 1 Viên Định Mệnh rồi xoay ổ: một trong 6 phát kế tiếp gây 350% sát thương chuẩn + choáng 1s; trong lúc đó khóa S1 và S3. HC 18s.
- S3 Lăn Né (C): lăn né (miễn sát thương khi lăn), nhét thêm 2 viên. HC 10s.
- S4 Nhà Cái Trả Thưởng (U): 6s mọi đòn đánh là ⚅; hạ gục trong lúc đó thì +4% sát thương tới hết trận (tối đa 5 lần) và hoàn 50% HC. (Cũ: cộng vĩnh viễn mỗi lần dùng.) HC 100/85/70s.

### Hỗ trợ

**Aria & Oktava** · tầm trung · mana · phép
- Nội tại — Oktava đi theo (máu riêng, chết thì hồi sau 40s); *Bản Nhạc*: 3 chiêu liên tiếp tạo Hòa Âm theo nốt được bấm nhiều nhất. Bỏ luật "Elara/Koda không đánh Aria" và bỏ việc A/B/C dùng chung hồi chiêu.
- S1 Nốt Đỏ (A): Oktava dậm vào mục tiêu, Aria nổ sóng âm quanh mình; Hòa Âm: 3 lần nổ, lần cuối choáng 1s. HC 7s.
- S2 Nốt Xanh (B): Aria và đồng minh gần +tốc chạy 2s, Aria xóa làm chậm; Hòa Âm: sóng làm chậm → trói → mê hoặc. HC 10s.
- S3 Nốt Vàng (C): Oktava lao về phía Aria, choáng kẻ trên đường; khiên cho Aria hoặc đồng minh thấp máu nhất gần đó. HC 12s.
- **Skill phụ** — Gắn Kết (D cũ): cưỡi Oktava 4s, Oktava gánh sát thương. HC 24s.
- S4 Bản Giao Hưởng Tử Thần (U): sóng âm mê hoặc 1.25s trên đường bay; chạm Oktava thì Oktava bất tử 3s và được cường hóa. Bỏ điều kiện 3 Bản Nhạc. HC 120/100/80s.

**Victoria** · tầm trung · mana · vật lý
- Nội tại — 3 Lính Tinh Nhuệ (máu thấp, chết thì 30s sau hồi sinh cạnh Victoria) + hào quang Quân Lệnh theo dạng: 🔫 Lục +giáp/kháng phép · 🔥 AR +sát thương · 🚩 Cờ +tốc chạy, −20% thời gian bị khống chế.
- **Skill phụ** — Chuyển Đổi Quân Lệnh (D cũ): xoay Lục → AR → Cờ, mỗi lần đổi kèm hiệu ứng nhỏ (lướt + giáp / ném flash gây mù / pháo kích). HC 6s.
- S1 Hỏa Lực Theo Dạng (A): đạn lục / loạt AR / quét cờ hình vành khuyên. HC 6s.
- S2 Thiết Lập Thế Trận (B): lướt + giáp ảo / lựu đạn / cắm cờ đẩy lùi + choáng 0.75s. HC 12s.
- S3 Tổng Lực Tác Chiến (C): pháo điện từ tê liệt / bão lửa / lính xung phong. HC 16s.
- S4 Mệnh Lệnh Tuyệt Đối (U): hồi sinh toàn bộ lính, 8s lính hóa Thiết Binh, tên lửa nã kẻ địch thấp máu nhất trong tầm nhìn mỗi 2s. HC 120/100/80s.

**Raven** · tầm rất xa · mana · vật lý
- Nội tại — *Sát Thủ Chuyên Nghiệp*: đánh thường bằng súng trường (băng 30, nạp 3s); mục tiêu càng xa đạn càng mạnh (tối đa +25%). *Bắn 3 Viên (A cũ)* thành đánh thường.
- S1 ⚠️ Bắn Tỉa Xuyên Phá (B cũ): ngắm 0.75s rồi bắn 1 phát tầm cực xa; mục tiêu bị Oca đánh dấu thì đạn xuyên địa hình, bỏ qua khiên. HC 10s.
- S2 ⚠️ Quạ Cơ Giới Oca (D cũ): thả quạ bay 8s quanh một vùng: cho tầm nhìn, lộ tàng hình, thả bom mini làm chậm, đánh dấu. HC 22s.
- S3 Kỹ Thuật Ẩn Nấp (C): bom khói 3s; Raven tàng hình trong khói, kẻ địch trong khói bị mù. HC 18s.
- S4 Màn Đêm Vĩnh Cửu (U): 5s tầm nhìn của mọi tướng đối phương co lại còn 40%; Raven tàng hình, đạn +30% sát thương. HC 120/100/80s.

---

## 4. Tướng không dùng mana (đề xuất 8/26)

| Tướng | Thay mana bằng | Ghi chú cân bằng |
|---|---|---|
| Borg | Không có gì — mất máu là mạnh lên (Huyết Chiến) | HC dài hơn mặt bằng một chút |
| Koda | Không có gì | HC dài hơn một chút |
| Galo | **Máu** (dạng Người chiêu tốn 3–5% máu; dạng Thú miễn phí) | |
| Ryoma | Không có gì (nhịp Liên Hoàn) | |
| Kazuki | **Ý Niệm** 0–100, tự hồi nhanh (kiểu năng lượng) | Đánh lâu thì cạn, phải nghỉ nhịp |
| Wukong | Không có gì; thanh Côn Thức chỉ để cường hóa | |
| Roxie & T-Zero | **Bánh Răng** (rơi từ lính/quái/tướng chết gần) | Phụ thuộc ăn lính, yếu khi bị đè đường |
| Diệp Thanh Phong | **Thước Gió** (đổi trạng thái, không cạn) | |

18 tướng còn lại dùng mana. Với 8 tướng trên, Bùa Xanh chỉ cho giảm hồi chiêu (mức cao hơn bình thường một chút);
chỉ số mana trên trang bị là phí với họ — đó là lý do có nhiều món không mana cho đấu sĩ.
Các xạ thủ dùng súng (Zero, Jack, Clint, Chrono & Neo, Raven) vẫn dùng mana cho chiêu; băng đạn chỉ áp lên đánh thường.

---

## 5. Phép bổ trợ (giữ 12 phép cũ, chỉnh theo hệ máu, thêm Trừng Trị)

Mỗi tuyển thủ mang **2 phép**; người đi rừng bắt buộc 1 ô là Trừng Trị. Bỏ "Bùa Song Phép".

| Phép | Bản mới | HC |
|---|---|---|
| 🌀 Tốc Biến (Tốc Biến Vực Sâu) | Dịch chuyển tức thời 4 đv | 180s |
| ⚓ Neo Trọng Lực | Khiên chặn sát thương 2.5s + miễn đẩy lùi/hất tung, đổi lại −30% tốc chạy | 120s |
| 💥 Sóng Xung Lực | Đẩy lùi 360° 2.5 đv + sát thương chuẩn nhỏ, ngắt lướt | 120s |
| ✊ Bất Khuất | Thanh tẩy mọi khống chế + miễn khống chế 1s | 150s |
| 🪝 Dây Móc Động Năng | Bắn cáp trúng tướng địch ≤ 8 đv: **kéo bản thân** tới (cũ: kéo địch về — quá mạnh), làm chậm địch 30% 1.5s | 150s |
| 💧 Hồi Phục (Thanh Lọc Thể Trọng) | Hồi máu bản thân + 1 đồng minh gần thấp máu nhất, +20% tốc chạy 1s | 180s |
| 🪞 Phản Chấn Tương Đối | Màn chắn hình nón 1s, chặn và dội đạn; kẻ cận chiến đánh vào bị choáng 0.5s | 120s |
| 👁️ Thấu Thị Nhãn | Soi một vùng bán kính 8 đv (trong tầm 25 đv) 4s: lộ tàng hình, phá ảo ảnh | 90s |
| 🥀 Kiệt Sức | Một tướng địch −35% sát thương, −30% tốc chạy 2.5s | 180s |
| 🕳️ Trói Hư Không | Sau 0.5s mở vùng 3 đv trong 2.5s: hút nhẹ + cấm lướt/dịch chuyển | 150s |
| 🧲 Rào Chắn Từ Tính | Tường 5 đv tồn tại 3s chặn đường đi; địch bị đẩy vào tường thì choáng 1s | 150s |
| ⚙️ Quá Tải Xung Nhịp | Giảm 50% hồi chiêu còn lại của S1–S3, +25% tốc đánh 4s | 150s |
| 🗡️ **Trừng Trị** (mới) | Sát thương chuẩn lớn lên quái/lính, tích 2 lần (mỗi lần hồi 60s); hạ quái bằng Trừng Trị thì hồi máu. Khi đã nâng đồ đi rừng thì dùng được lên tướng (hiệu ứng theo món, xem mục 6) | 60s/lần |

---

## 6. Trang bị (42 món, 6 ô)

Quy ước: mỗi món hoàn chỉnh có đúng **1 phôi** (rẻ, khoảng 40% giá và 40% chỉ số) — AI và thứ tự lên đồ của HLV chỉ ghi
món hoàn chỉnh, khi chưa đủ vàng sẽ tự mua phôi trước. Hiệu ứng riêng của mỗi món không cộng dồn với chính nó.
Giá khởi điểm: món hoàn chỉnh 2000–2900 vàng, giày 800–1000, đồ đi rừng ~1000. Giữ lại tên của 12 món cũ.

Viết tắt: SMVL sát thương vật lý · SMPT sức mạnh phép · TĐĐ tốc đánh · GHC giảm hồi chiêu · CM chí mạng · XG xuyên giáp · KP kháng phép.

### Công vật lý (9)
| Món | Chỉ số + hiệu ứng | Lý do tồn tại (khắc gì) | Điểm yếu |
|---|---|---|---|
| Huyết Kiếm Đoạt Mệnh | SMVL + 15% hút máu; máu đầy thì hút dư thành lá chắn | Trụ đường trước đội cấu rỉa | Đồ giảm hồi máu |
| Đao Phá Quân | SMVL + CM; chí mạng gây 225% | Đội máu giấy | Giáp, Áo Choàng Bóng Đêm |
| Cung Gió Lốc | TĐĐ + CM + tốc chạy; đòn thứ 3 nảy sang 2 mục tiêu | Đội đứng dồn; dọn lính nhanh | Đơn đấu với đỡ đòn |
| Mũi Khoan Thép | SMVL + 30% XG | Đội nhiều giáp | Phí vàng khi địch ít giáp |
| Dao Cắt Gân | SMVL + TĐĐ; đòn đánh gây Vết Thương Sâu (−40% hồi máu 3s) | Đội hồi máu/hút máu (Aria, Joker, Huyết Kiếm) | Chỉ số thấp |
| Song Đao Tàn Huyết | TĐĐ + SMVL; đòn đánh +3% máu hiện tại của mục tiêu | Đỡ đòn nhiều máu | Mục tiêu ít máu |
| Dao Ám Ảnh | SMVL + XG cố định; đòn đầu tiên khi bước ra từ bụi cỏ/sương mù +sát thương và làm chậm | Đội máu giấy, thiếu tầm nhìn | Mất giá trị cuối trận |
| Rìu Hắc Thiết | SMVL + Máu + GHC; đánh trúng giảm 5% giáp mục tiêu mỗi tầng (6 tầng) | Đỡ đòn, giao tranh dài | Bị dồn chết nhanh |
| Búa Phá Thành | SMVL + Máu; +40% sát thương lên trụ, lính gần mạnh hơn; khi đẩy một mình +giáp/KP | Đội thích giao tranh tổng, bỏ đường | Giao tranh tổng |

### Phép (7)
| Món | Chỉ số + hiệu ứng | Lý do tồn tại | Điểm yếu |
|---|---|---|---|
| Mũ Hỏa Thần | SMPT rất lớn, +25% SMPT | Đội máu giấy | Không phòng thủ, KP |
| Trượng Hư Vô | SMPT + xuyên 35% KP | Đội lên KP | Phí vàng khi địch ít KP |
| Bùa Tro Tàn | SMPT + Máu; chiêu gây thiêu 3s + Vết Thương Sâu | Đội hồi máu | Sát thương dồn thấp |
| Gậy Băng Giá | SMPT + Máu; chiêu gây sát thương làm chậm 25% 1s | Tướng lao vào, tướng cơ động | Sát thương thấp hơn |
| Ngọc Hiền Triết | SMPT + Mana + hồi mana + GHC; chiêu trúng hồi 3% mana | Đi đường dài, cấu rỉa liên tục | Bị dồn sớm |
| Mặt Nạ Nguyền Rủa | SMPT + Máu; sát thương phép đốt 1% máu tối đa/giây và mục tiêu nhận thêm 10% sát thương phép | Đỡ đòn | Tướng máu giấy |
| Pháp Châu Sấm Sét | SMPT + tốc chạy + xuyên phép cố định; 8s một lần, chiêu trúng tướng phóng sét thêm sát thương | Bắt lẻ xạ thủ/pháp sư | Giao tranh kéo dài |

### Phòng thủ (8)
| Món | Chỉ số + hiệu ứng | Lý do tồn tại | Điểm yếu |
|---|---|---|---|
| Giáp Gai | Giáp + Máu; bị đánh thường thì phản sát thương phép + Vết Thương Sâu | Xạ thủ hút máu | Pháp sư |
| Khiên Băng Vĩnh Cửu | Giáp + Mana + GHC; kẻ đánh thường vào bị −15% tốc đánh | Đội dựa đánh thường (Percy, Zero) | Đội dựa chiêu |
| Áo Choàng Hư Không | KP + Máu; nhận sát thương phép làm máu dưới 35% thì nhận lá chắn phép | Pháp sư dồn | Vật lý |
| Trái Tim Cự Thạch | Máu rất lớn + hồi % máu tối đa | Đội cấu rỉa | Sát thương % máu, giảm hồi máu |
| Áo Choàng Bóng Đêm | Giáp + Máu; −30% sát thương chí mạng nhận | Xạ thủ chí mạng (Jack, Zero) | Tướng không chí mạng |
| Mũ Trấn Hồn | KP + Máu + 30% kháng hiệu ứng | Đội nhiều khống chế | Ít chỉ số thô |
| Áo Choàng Thánh Linh | KP + Máu; lá chắn chặn 1 chiêu, hồi 40s | Mở giao tranh bằng 1 chiêu (móc Death, Percy, Thiên Thạch) | Chiêu liên tục, đánh thường |
| Vương Miện Bất Khả Xâm Phạm | Giáp + KP + Máu; dưới 30% máu nhận lá chắn lớn 3s (hồi 90s) | Bắt lẻ, dồn sát thương | Sát thương kéo dài, thiêu đốt |

### Hỗ trợ (5)
| Món | Chỉ số + hiệu ứng | Lý do tồn tại | Điểm yếu |
|---|---|---|---|
| Lệnh Bài Chinh Phạt | Đồ khởi điểm hỗ trợ: nhận vàng khi đánh trúng tướng hoặc khi lính chết gần đồng đội | Thu nhập cho vị trí không ăn lính | Gần như không có chỉ số |
| Lư Hương Cổ | SMPT + hồi mana + GHC; hồi máu/khiên đồng minh → đồng minh +15% tốc đánh 6s | Đội dồn tài nguyên cho 1 xạ thủ | Bị dồn mục tiêu trước |
| Ngọc Bội Hộ Mệnh | Giáp + KP + Máu; kích hoạt khiên cho đồng minh trong vùng 2s | Sát thương diện rộng | Sát thương kéo dài |
| Chuông Thức Tỉnh | Máu + Mana + GHC; đồng minh gần +15% tốc chạy khi tiến về phía địch | Đội địch thả diều | Đội địch lao vào |
| Kính Cú Đêm | Máu + GHC; cắm tối đa 2 đèn soi tầm nhìn 75s — **nguồn tầm nhìn cắm được duy nhất** | Rừng địch, tàng hình (Vesper, Alice, Raven) | Ít chỉ số chiến đấu |

### Giày (5) — mỗi người 1 đôi
| Món | Chỉ số + hiệu ứng | Lý do tồn tại |
|---|---|---|
| Giày Thép | Giáp + giảm 12% sát thương đánh thường | Xạ thủ, đánh thường |
| Giày Thủy Ngân | KP + 30% kháng hiệu ứng | Pháp sư, khống chế |
| Giày Cuồng Chiến | TĐĐ | Xạ thủ |
| Giày Khai Sáng | 15% GHC | Tướng dựa chiêu |
| Giày Đinh Gỉ | Tốc chạy cao, thêm tốc chạy khi ngoài giao tranh | Đảo đường, chia đẩy |

### Đi rừng (3) — nâng từ phôi Dao Rừng
| Món | Hiệu ứng | Lý do tồn tại |
|---|---|---|
| Nanh Lửa | Trừng Trị lên tướng: sát thương chuẩn + mục tiêu giảm 20% sát thương 3s; hạ quái tích SMVL/SMPT | Đi rừng đấu tay đôi, khắc sát thủ đối phương |
| Mắt Đầm Lầy | Trừng Trị lên tướng: làm chậm 30% + lộ hình 4s; hạ quái +tốc chạy trong rừng | Khắc tướng cơ động/tàng hình |
| Mai Rùa Đá | Trừng Trị → lá chắn; hạ quái tích Máu | Đi rừng đỡ đòn; khắc đội dồn sát thương vào người đi rừng |

### Kích hoạt (5)
| Món | Chỉ số + kích hoạt | Lý do tồn tại |
|---|---|---|
| Đồng Hồ Cát Nghịch Đảo | SMPT + Giáp; bất động và miễn sát thương 2.5s (120s) | Sát thủ dồn; né Gọi Hồn/Thiên Thạch |
| Khăn Thanh Tẩy | SMVL + KP; xóa khống chế (90s) | Khống chế cứng (hóa đá của Wukong, ghim tường của Theron); đổi lại được tự do ô phép |
| Xích Hồn Đồng Quy | SMVL + Máu; lao tới tướng địch ≤ 6 đv, làm chậm 40% 2s (60s) | Đội thả diều |
| Thủy Tinh Sinh Mệnh | Máu + KP + GHC; sau 1.5s hồi máu vùng cho đồng minh (90s) | Cấu rỉa trước giao tranh, giao tranh kéo dài |
| Cờ Hiệu Triệu | SMVL + Giáp; biến 1 lính đồng minh thành lính siêu cấp 60s (120s) | Chia đẩy, khắc đội bỏ đường |

Mô phỏng sẽ báo tỉ lệ dùng và chênh lệch tỉ lệ thắng của từng món; món nào lệch kiểu "luôn đúng" sẽ bị chỉnh, và cũng là dữ liệu
cho bản cập nhật theo mùa.

---

## 7. Câu hỏi về các quyết định lớn

Mỗi câu có đề xuất của tôi; anh chỉ cần trả lời "đồng ý" hoặc sửa.

1. **Ngoại lệ chuyển chiêu (⚠️, 9 tướng)** — A cũ là phát bắn/nhát chém thường thì thành đánh thường và D cũ lên thay ô trống.
   *Đề xuất: đồng ý.* Nếu anh muốn giữ nguyên "S1–S3 = A–B–C" tuyệt đối, tôi sẽ biến A thành chiêu mạnh hơn và D vào nội tại.
2. **Thêm chỉ số "xuyên phép"** cho cân với "xuyên giáp" (nếu không, mua kháng phép gần như luôn đúng trước tướng phép).
   *Đề xuất: thêm.* Hút máu và kháng hiệu ứng chỉ có trên trang bị, không phải chỉ số gốc của tướng.
3. **Phép bổ trợ:** 2 phép mỗi người, người đi rừng bắt buộc Trừng Trị; Dây Móc kéo bản thân thay vì kéo địch. *Đề xuất: đồng ý.*
4. **Tầm nhìn cắm được:** đặc tả không có mắt. Tôi đề xuất *không có mắt miễn phí*, chỉ món Kính Cú Đêm (hỗ trợ) cắm được đèn soi.
   Anh muốn giữ món này hay bỏ hẳn tầm nhìn cắm được?
5. **"10–14 trận một mùa" là tính loạt đấu hay từng ván?** *Đề xuất tính loạt đấu:* 3 hạng × 8 đội; vòng bảng vòng tròn 1 lượt
   (7 loạt Bo1), 4 đội đầu vào loại trực tiếp (bán kết Bo3, chung kết Bo5); 2 đội đầu hạng cao nhất dự giải quốc tế 8 đội
   (vòng bảng 3 loạt Bo1 + loại trực tiếp Bo3/Bo5). Đội vô địch đi hết sẽ đá khoảng 14 loạt. Cuối mùa: đội cuối hạng trên xuống,
   đội đầu hạng dưới lên, hạng 7 trên đá Bo3 với hạng 2 dưới.
6. **Cách đo hai mục tiêu:**
   (a) "Thành thạo tối đa thắng chính mình khi chưa thành thạo 58–62%": hai đội giống hệt, chỉ một tuyển thủ khác nhau ở độ
   thành thạo tướng **100 so với 0**. Đúng ý anh chứ?
   (b) "HLV máy thắng đội không ai chỉ đạo ≥ 55%": tôi sẽ đo cả hai trường hợp — đối thủ không có lệnh nào, và đối thủ chỉ có
   đội trưởng tự chỉ huy. *Đề xuất:* ≥ 55% áp cho trường hợp "không lệnh nào", và ≥ 52% khi đối thủ có đội trưởng Chỉ Huy trung bình
   (nếu chỉ huy tự động quá kém thì game sẽ dở khi người chơi không bấm gì).
7. **Tín Nhiệm** chuyển từ tướng sang **tuyển thủ** (0–100, quan hệ giữa tuyển thủ và HLV): tăng khi thắng, được ra sân, được
   tăng lương, lệnh đúng; giảm khi thua, ngồi dự bị, lệnh sai làm chết người. *Đề xuất: đồng ý.*
8. **Hình ảnh trận:** giữ phong cách vẽ bằng canvas của bản cũ (tướng = thân tròn + vũ khí vẽ tay, cùng màu và hiệu ứng),
   góc nhìn từ trên xuống, bản đồ vuông 120×120 đv đối xứng qua đường chéo (xanh dưới-trái, đỏ trên-phải) — đã chốt ở GĐ1. Tốc độ mặc định x2. *Đề xuất: đồng ý.*
9. **Giữ bản cũ** bằng thư mục `legacy/` trên nhánh này (chơi tại `/legacy/`), còn `main` giữ nguyên tới khi anh hợp nhất.
   *Đề xuất: đồng ý.* Nếu anh muốn thêm một nhánh riêng tên `ban-cu`, cần anh cho phép đẩy lên nhánh đó.
