# GDD — ĐẤU TRƯỜNG LUÂN HỒI (tên tạm)

> Tài liệu thiết kế game (Game Design Document) cho bản Unity.
> Đi kèm: `NHAN_VAT.md` (số liệu đầy đủ 40 nhân vật, trang bị, vật phẩm, công thức) và `CLAUDE.md` (hướng dẫn cho AI viết code).
> Quy ước trong tài liệu: **[CỐ ĐỊNH]** = quyết định thiết kế, đừng đổi khi chưa bàn; **[CHỈNH ĐƯỢC]** = con số khởi điểm, sẽ cân bằng lại khi chơi thử.

---

## 0. Thông tin chung

| Mục | Nội dung |
|---|---|
| Thể loại | Roguelite hành động, nhìn từ trên xuống (top-down), chơi đơn, offline |
| Nền tảng | PC (Windows) trước; điện thoại (Android/iOS) sau khi lõi đã vui |
| Engine | Unity 6 LTS, URP |
| Góc nhìn | 3D nhìn nghiêng từ trên (camera ~55°), hoặc 2.5D — chọn một và giữ nguyên |
| Độ dài một lượt chơi | 25–40 phút khi thắng; 5–20 phút khi thua sớm |
| Người chơi mục tiêu | Thích hành động có kỹ năng, thích thử build, chơi từng phiên 30 phút |
| Nguồn nội dung | 40 nhân vật, 47 trang bị, 35 vật phẩm, 7 boss, 8 boss nhỏ, ~10 loại quái có cơ chế từ bản web "Kẻ Đặt Cược" |
| Không có | Cược, nhà cái, huấn luyện viên, chơi mạng, mua bằng tiền thật trong bản đầu |

---

## 1. Trụ cột thiết kế [CỐ ĐỊNH]

1. **Mỗi lượt một build khác.** Cùng tướng nhưng nhánh nâng cấp khác thì lối đánh khác hẳn. Mọi nâng cấp phải đổi *cách chơi*, không chỉ cộng số.
2. **Đánh tay, có kỹ năng.** Né vùng cảnh báo, ngắm chiêu, kết hợp chiêu. Không có tự đánh, tự ngắm mặc định.
3. **Thua vẫn muốn chơi tiếp.** Lượt nào cũng cho tiền vĩnh viễn, mở khóa, hoặc một mảnh cốt truyện.
4. **Đọc được.** Mọi đòn lớn của địch đều có vùng cảnh báo. Người chơi chết phải hiểu vì sao.

---

## 2. Bối cảnh & cốt truyện

### 2.1. Tiền đề
- Một **đấu trường bị nguyền** nằm giữa các vùng đất (Rừng Thông, Đầm Lầy Sương, Vùng Tử Khí, Núi Đá Đỏ, Tuyết Sơn, Trạm Khí Độc, Phế Tích Tân Thế…).
- Ai bước vào đều bị trói vào vòng **luân hồi**: chết thì tỉnh lại ở cổng đấu trường, mất hết sức mạnh đã nhặt, chỉ giữ ký ức (tiến trình vĩnh viễn).
- Các tướng đều bị kẹt ở đây, mỗi người một lý do. Mục tiêu: lên tới **Tâm Đấu Trường**, hạ **Rồng Cổ Đại** và phá lời nguyền.

### 2.2. Kể chuyện
- Cốt truyện kể **rời rạc qua mỗi lượt**: đối thoại ở khu nhà chính, sự kiện trong lượt, lời thoại khi gặp tướng khác.
- Dùng **quan hệ có sẵn** giữa các tướng (bạn, bảo vệ, liên minh vĩnh cửu, thù — xem `NHAN_VAT.md`). Ví dụ Luca gặp Alice thì có thể thành đồng minh; gặp Dr. Caelus thì luôn đánh.
- Mỗi tướng có **5 mảnh ký ức** mở dần theo độ thành thạo (mục 11.5). Đủ 5 mảnh = kết thúc riêng của tướng đó.
- Thắng lần đầu mở **kết thúc chính**; thắng ở bậc thử thách cao mở các kết thúc phụ.

---

## 3. Vòng chơi

### 3.1. Vòng giây-giây (chiến đấu)
Di chuyển → ngắm → dùng chiêu / đánh thường → né (lướt né chung) → quản lý hồi chiêu và tài nguyên riêng của tướng (Náo Nhiệt, thanh gió, đạn…).

### 3.2. Vòng phòng (45–120 giây)
Vào phòng → cửa khóa → 2–3 đợt quái → hết quái cửa mở → nhận phần thưởng (biểu tượng cửa đã báo trước) → chọn cửa tiếp theo.

### 3.3. Vòng lượt chơi (25–40 phút)
Chọn tướng → Màn 1 → boss → Màn 2 → boss → Màn 3 → boss cuối → thắng. Chết ở bất kỳ đâu = về khu nhà chính.

### 3.4. Vòng dài (meta)
Mang tiền vĩnh viễn về → mở tướng, mở trang bị vào danh sách rơi, nâng chỉ số nhỏ, mở bậc thử thách → chơi lượt mới.

---

## 4. Điều khiển [CỐ ĐỊNH]

| Hành động | Bàn phím + chuột | Tay cầm | Điện thoại |
|---|---|---|---|
| Di chuyển | WASD | Cần trái | Cần ảo trái |
| Ngắm | Con trỏ chuột | Cần phải | Kéo nút chiêu |
| Đánh thường | Chuột trái (giữ = đánh liên tục) | RT | Nút đánh (tự chọn mục tiêu gần) |
| S1 / S2 / S3 | Q / E / R | LB / RB / Y | 3 nút chiêu |
| S4 (chiêu cuối) | F | LT | Nút lớn |
| Skill phụ | C | X | Nút nhỏ |
| **Lướt né chung** | Space | A | Nút lướt |
| Bình máu | 1 | D-pad lên | Nút bình |
| Tương tác (rương, cửa, NPC) | V | B | Tự hiện nút |
| Bảng thông tin build | Tab | Select | Nút menu |

- **Ngắm chiêu:** bấm nhanh = tung ngay theo hướng con trỏ; giữ = hiện chỉ báo tầm/vùng, thả để tung. Có tùy chọn "tự ngắm" (chỉ ngắm mục tiêu trong tầm chiêu), mặc định **tắt** trên PC, **bật** trên điện thoại.
- **Lướt né chung:** mọi tướng đều có. Lướt 4 đv trong 0.2s, bất tử 0.15s đầu, hồi 1.5s [CHỈNH ĐƯỢC]. Không thay thế chiêu lướt riêng của tướng.
- **Vừa đi vừa đánh:** đánh thường không khóa di chuyển, trừ thời gian vung tay (30% chu kỳ đánh). Chiêu có thời gian thi triển thì khóa chân trong thời gian đó, trừ chiêu ghi "vừa đi vừa thi triển".

---

## 5. Nhân vật

### 5.1. Nguồn số liệu
- Toàn bộ chỉ số gốc, tăng mỗi cấp, chiêu, hồi chiêu, mana, công thức sát thương, cây tiến hóa: **lấy từ `NHAN_VAT.md`**. Không tự bịa số.
- Thay đổi so với bản web (áp dụng cho mọi tướng):

| Thay đổi | Bản web | Bản roguelite |
|---|---|---|
| Hệ số máu tướng | ×2.4 (để giao tranh tướng-tướng dài) | ×1.5 cho người chơi [CHỈNH ĐƯỢC] |
| Hệ số PvP (pvpPow) | Có | **Bỏ** (không có đấu người) |
| Hệ số chiêu cuối ×1.4 | Có | Giữ |
| Chi phí mana ×0.6, hồi mana ×1.6 | Có | Giữ |
| Hồi máu gốc | 0 | 0 (hồi qua bình, phòng nghỉ, nâng cấp) |
| Lướt né chung | Không có | **Thêm** |
| Hộ Giáp (giáp phụ) | Có | Giữ, hồi đầy khi vào phòng mới |

### 5.2. Cấp & điểm chiêu (trong một lượt)
- Bắt đầu lượt ở **cấp 1** với S1 cấp 1. Cấp tối đa **18**.
- Kinh nghiệm lấy từ quái và phần thưởng phòng. Đường cong: thắng boss màn 1 ≈ cấp 7, màn 2 ≈ cấp 13, vào boss cuối ≈ cấp 17–18 [CHỈNH ĐƯỢC].
- Luật cộng điểm giữ như bản web: S1–S3 tối đa 5, không vượt ⌈cấp/2⌉; S4 tối đa 3, mở ở cấp 4/8/12; skill phụ tự lên theo cấp.
- Lên cấp **dừng nhẹ trận đấu** (0.3s chậm) và hiện bảng cộng điểm ở góc — không mở menu chặn màn hình.

### 5.3. 6 tướng cho bản thử đầu (MVP)

| Tướng | Vai trò | Vì sao chọn | Điểm nhấn |
|---|---|---|---|
| **Elara** | Xạ thủ | Dễ chơi nhất, dạy người mới | Liên Xạ, Sao Băng Lùi (lướt lùi), Thần Tiễn Phá Không |
| **Borg** | Đấu sĩ cận chiến | Đơn giản, cảm giác đánh tay mạnh | Chộp & Quật, Trả Đòn, Đấu Trường La Mã |
| **Ignatius** | Pháp sư lửa | Đánh diện rộng, dọn quái đã | Cầu Lửa, Thiên Thạch, Hỏa Ấn |
| **Alice** | Sát thủ ảo ảnh | Thử hệ triệu hồi ảo ảnh và tàng hình | Thanh Náo Nhiệt, ảo ảnh phát nổ, S4 3 biến thể |
| **Valerius** | Đỡ đòn | Lối chơi trâu, phản đòn | Khiên Chắn, Chiến Thần Bất Tử |
| **Diệp Thanh Phong** | Pháp sư điều khiển | Thử hệ trạng thái (thanh gió 3 dạng) | Mỗi chiêu đổi theo trạng thái gió |

Thứ tự làm: Elara → Borg → Ignatius → Valerius → Alice → Thanh Phong (từ đơn giản tới phức tạp).

### 5.4. Mở khóa tướng
- Lượt đầu chỉ có **Elara** và **Borg**.
- Các tướng còn lại mở bằng tiền vĩnh viễn hoặc bằng sự kiện cốt truyện (ví dụ cứu Alice trong một sự kiện thì mở Alice).
- Sau MVP: thêm 2–4 tướng mỗi bản cập nhật.

---

## 6. Chiến đấu

### 6.1. Công thức sát thương [CỐ ĐỊNH]
Giữ cách tính của bản web (chi tiết ở `NHAN_VAT.md` mục 1.5), bỏ phần PvP:

```
sát_thương_gốc = gốc_theo_cấp_chiêu + Σ (hệ_số × giá_trị_nguồn)    (nguồn: SMVL, SMVL cộng thêm, SMPT, máu, giáp, máu mục tiêu… — mục 6.5–6.6)
× hook nội tại / trang bị / nâng cấp (onDeal của người đánh, onTake của người nhận)
× 1.4 nếu là chiêu cuối
× (1 + khuếch đại sát thương của người đánh) × (1 + Công Vật Lý % hoặc Công Phép %)
× (1 − giảm sát thương của mục tiêu) × (1 + dễ tổn thương của mục tiêu)
kháng R = Giáp (vật lý) hoặc KP (phép) sau xuyên:  R = kháng × (1 − min(0.9, %xuyên)) − xuyên_phẳng, không âm
× 100 / (100 + R)        (sát thương chuẩn bỏ qua bước này)
→ trừ Hộ Giáp trước → trừ lá chắn → trừ máu
Chí mạng ×1.75.
```

### 6.2. Hiệu ứng trạng thái
Giữ đủ danh sách bản web: choáng, ngủ, hất tung, trói chân, làm chậm, câm lặng, mê hoặc, mù, cấm lướt, tăng tốc, tăng sức mạnh, lá chắn, bất tử, không thể chọn, không thể cản, tàng hình, sát thương theo thời gian, vết thương sâu, đánh dấu, giảm sát thương, hồi máu/mana theo thời gian, không chết, dễ tổn thương.

- **Kháng hiệu ứng** rút ngắn thời gian khống chế (trừ hất tung).
- **Boss và tinh anh có thanh "Kiên Định"** [CỐ ĐỊNH]: khống chế cứng chỉ trừ thanh này; thanh cạn thì boss bị choáng 2s rồi thanh hồi đầy. Tránh việc khóa boss vĩnh viễn, vẫn thưởng cho build khống chế.

### 6.3. Cảm giác đánh
- **Dừng hình (hitstop):** 0.03–0.06s khi đòn cận chiến trúng, 0.1s khi kết liễu tinh anh/boss.
- **Rung camera** nhẹ cho chiêu lớn, có tùy chọn tắt.
- **Số sát thương bay lên:** màu theo loại (vật lý cam, phép tím, chuẩn trắng, chí mạng lớn hơn).
- **Vùng cảnh báo** của địch: màu đỏ, lấp đầy dần theo thời gian tới khi nổ. Thời gian cảnh báo tối thiểu 0.5s với quái thường, 0.8s với boss [CHỈNH ĐƯỢC].

### 6.4. Mục tiêu nhịp chiến đấu [CHỈNH ĐƯỢC]

| Tình huống | Mục tiêu |
|---|---|
| Quái thường chết sau | 2–4 đòn đánh thường, hoặc 1 chiêu |
| Phòng chiến đấu | 45–90 giây |
| Tinh anh | 15–30 giây |
| Boss màn 1 / 2 / 3 | 60–90 / 90–120 / 120–180 giây |
| Người chơi chết nếu đứng im giữa phòng màn 1 | Khoảng 15 giây |
| Đòn lớn của boss | 25–40% máu người chơi |

### 6.5. Chỉ số tấn công: SMVL & SMPT [CỐ ĐỊNH]

| Viết tắt | Tên đầy đủ | Tương đương LMHT | Nguồn |
|---|---|---|---|
| **SMVL** | Sức Mạnh Vật Lý | AD | **SMVL gốc** (từ cấp tướng: `gốc + tăng × (cấp−1)`) + **SMVL cộng thêm** (trang bị, Thiên Phú, mảnh hồn, hiệu ứng) |
| **SMPT** | Sức Mạnh Phép Thuật | AP | Tướng có SMPT gốc = 0 → **toàn bộ SMPT là cộng thêm** |
| Máu tối đa / Máu cộng thêm | | Max HP / Bonus HP | Máu cộng thêm = máu tối đa − máu gốc theo cấp |
| Giáp / KP (Kháng Phép) cộng thêm | | Bonus Armor / MR | Tương tự |
| Tốc đánh cộng thêm | | Bonus AS | % tốc đánh ngoài tốc đánh gốc |

- **SMVL tổng** = SMVL gốc + SMVL cộng thêm. Mọi mô tả chiêu phải ghi rõ "SMVL" (tổng) hay "SMVL cộng thêm" — không được ghi mập mờ.
- Bản web chỉ dùng **SMVL tổng** và SMPT trong công thức (cột "Công thức trong mã" của `NHAN_VAT.md`). Bản Unity **tách SMVL gốc / cộng thêm** để hệ số có ý nghĩa: hệ số trên SMVL cộng thêm thưởng cho người mua đồ, hệ số trên SMVL tổng mạnh sẵn từ đầu.
- Đánh thường luôn là **100% SMVL tổng** (tướng đánh thường gây sát thương phép như Alice, Ignatius ghi rõ hệ số riêng).

### 6.6. Hệ số chiêu đa dạng [CỐ ĐỊNH về hệ thống, CHỈNH ĐƯỢC về con số]
Chiêu **không chỉ** là `gốc + x% SMVL` hoặc `gốc + x% SMPT`. Mỗi chiêu có thể cộng nhiều **hệ số** từ các nguồn sau:

| Nguồn hệ số | Ký hiệu trong mô tả | Màu tooltip | Dùng cho |
|---|---|---|---|
| SMVL tổng | (+60% SMVL) | Cam | Xạ thủ, đòn gần với đánh thường |
| SMVL cộng thêm | (+80% SMVL cộng thêm) | Cam đậm | Đấu sĩ, sát thủ vật lý — thưởng cho build đồ công |
| SMPT | (+70% SMPT) | Tím | Pháp sư, hồi máu, lá chắn |
| Máu tối đa của bản thân | (+6% Máu tối đa) | Xanh lá | Đỡ đòn, đấu sĩ trâu |
| Máu cộng thêm của bản thân | (+10% Máu cộng thêm) | Xanh lá đậm | Đỡ đòn — thưởng cho build máu |
| Giáp / KP (cộng thêm) | (+40% Giáp cộng thêm) | Vàng / Xanh dương | Đỡ đòn phản sát thương |
| Máu tối đa của mục tiêu | (+4% Máu tối đa mục tiêu) | Đỏ | Chống trâu — **giới hạn với quái/boss** |
| Máu đã mất của mục tiêu | (+10% Máu đã mất mục tiêu) | Đỏ | Kết liễu |
| Máu hiện tại của mục tiêu | (+8% Máu hiện tại mục tiêu) | Đỏ | Mở giao tranh, dồn đầu |
| Tốc đánh cộng thêm | (+0.5 mỗi 1% Tốc đánh cộng thêm) | Vàng nhạt | Xạ thủ tốc đánh |
| Tỉ lệ chí mạng | (×(1 + 0.5 × Chí mạng)) | Cam nhạt | Chiêu mang tính "chí mạng" |
| Cấp tướng | (+8 mỗi cấp) | Trắng | Chiêu nội tại, chiêu phụ không có cấp chiêu |
| Tầng / tài nguyên riêng | (+5 mỗi tầng Hỏa Ấn), (+1% mỗi 10 Náo Nhiệt) | Màu tài nguyên | Cơ chế riêng của tướng |
| Thời gian tích / quãng bay | (50% → 100% theo thời gian tích) | Trắng | Chiêu tích lực, chiêu tầm xa |
| Sát thương vừa nhận / đã hấp thụ | (+40% sát thương đã hấp thụ) | Trắng | Phản đòn |

**Luật thiết kế hệ số:**
1. Mỗi chiêu **1–3 hệ số** (gốc theo cấp chiêu luôn có, không tính vào giới hạn).
2. Mỗi tướng dùng **ít nhất 2 nguồn hệ số khác nhau** trong cả bộ chiêu → mở được ít nhất 2 lối build.
3. Hệ số theo vai trò (gợi ý):
   - Xạ thủ: SMVL tổng, tốc đánh cộng thêm, chí mạng, máu đã mất mục tiêu (chiêu cuối).
   - Đấu sĩ: SMVL cộng thêm + máu cộng thêm (lai công/thủ).
   - Đỡ đòn: máu tối đa, giáp/KP cộng thêm, máu tối đa mục tiêu.
   - Pháp sư: SMPT, máu tối đa mục tiêu (dồn phép), tầng cộng dồn.
   - Sát thủ: SMVL cộng thêm hoặc SMPT, máu đã mất mục tiêu.
   - Hồi máu / lá chắn: SMPT hoặc máu tối đa của bản thân.
4. Hệ số theo **% máu mục tiêu** với quái thường, tinh anh, boss: tối đa **100 / 250 / 400** sát thương mỗi lần trúng [CHỈNH ĐƯỢC] — tránh xóa boss.
5. Sát thương **lai**: một chiêu có thể gồm hai phần khác loại (ví dụ 60% vật lý + 40% phép); ghi rõ từng phần.
6. Mô tả chiêu trong game hiện **số đã tính** theo chỉ số hiện tại; giữ Alt hiện công thức với màu theo bảng trên (như tooltip LMHT).

### 6.7. Hệ số đề xuất cho 6 tướng MVP [CHỈNH ĐƯỢC]
"Gốc" lấy từ `NHAN_VAT.md` (theo cấp chiêu). Cột "Bản web" là công thức cũ để đối chiếu. Phần in đậm là hệ số mới.

**Elara — Xạ thủ (SMVL tổng, tốc đánh, chí mạng)**

| Chiêu | Bản web | Bản roguelite |
|---|---|---|
| Nội tại — Tập Trung | +25% sát thương | +25% sát thương **+ 20 (+4 mỗi cấp) (+25% SMVL cộng thêm)** |
| S1 Liên Xạ (3 mũi) | mỗi mũi 50% đánh thường + 15–55 | mỗi mũi 15/25/35/45/55 **(+50% SMVL)**, chí mạng được, kích hoạt hiệu ứng đòn đánh |
| S2 Kéo Căng Dây | 80–260 + 0.9×SMVL | 80/125/170/215/260 **(+100% SMVL cộng thêm)**, 50%→100% theo thời gian tích, **×(1 + 0.5 × Chí mạng)** |
| S3 Sao Băng Lùi | 30–110 + 0.3×SMVL | mỗi sao băng 30/50/70/90/110 **(+30% SMVL cộng thêm)**; làm chậm 40% **(+1% mỗi 5% Tốc đánh cộng thêm, tối đa 60%)** |
| S4 Thần Tiễn Phá Không | 200–400 + 1.0×SMVL | 200/300/400 **(+100% SMVL cộng thêm) (+10/15/20% Máu đã mất mục tiêu)** |
| Phụ — Tên Hình Nón | 30 + 6×cấp + 0.35×SMVL | giữ: 30 (+6 mỗi cấp) **(+35% SMVL)** |

**Borg — Đấu sĩ (SMVL cộng thêm, máu cộng thêm)**

| Chiêu | Bản web | Bản roguelite |
|---|---|---|
| Nội tại — Huyết Chiến | thiêu khi dưới 30% máu | thiêu **10 (+2 mỗi cấp) (+1% Máu tối đa của Borg)** mỗi giây trong 2s |
| S1 Chộp & Quật | 60–200 + 0.6×SMVL | 60/95/130/165/200 **(+60% SMVL cộng thêm) (+5% Máu cộng thêm)** |
| S2 Trả Đòn | 70–230 + 0.9×SMVL, +40% đã hấp thụ | 70/110/150/190/230 **(+90% SMVL cộng thêm) (+40% sát thương đã hấp thụ)** |
| S3 Gồng Mình | giảm 50% sát thương | giảm 50% + lá chắn **40/60/80/100/120 (+8% Máu cộng thêm)** |
| S4 Đấu Trường La Mã | võ đài, giảm 25% sát thương | như cũ + **+20/30/40 (+15% Giáp cộng thêm) Giáp và KP**; địch đập vào tường võ đài nhận **100/150/200 (+4% Máu tối đa mục tiêu)** |

**Ignatius — Pháp sư lửa (SMPT, tầng Hỏa Ấn, máu tối đa mục tiêu)**

| Chiêu | Bản web | Bản roguelite |
|---|---|---|
| Nội tại — thiêu Hỏa Ấn | (7 +2/cấp +0.5×tầng)/giây | 7 (+2 mỗi cấp) **(+0.5 mỗi tầng) (+4% SMPT)** mỗi giây |
| Nội tại — Hỏa Bạo (mỗi 6 tầng) | 60 + 18×cấp + 0.6×SMPT | 60 (+18 mỗi cấp) **(+60% SMPT) (+3% Máu tối đa mục tiêu)** |
| S1 Cầu Lửa | 65–205 + 0.6×SMPT | giữ: 65/100/135/170/205 **(+60% SMPT)** |
| S2 Đại Hỏa Cầu | 60–180 × (0.6→1.0 theo tích) + 200–300% SMPT, +25% dưới 30% máu | 60/90/120/150/180 **(+100% SMPT)** × (0.6→1.0 theo tích) **(+0→30% theo Máu đã mất mục tiêu)** |
| S3 Dịch Chuyển | 40–120 + 0.3×SMPT | giữ |
| S4 Thiên Thạch | 150–300 + 125/150/200% SMPT | 150/220/300 **(+90% SMPT) (+6/8/10% Máu tối đa mục tiêu)** |
| Phụ — Vòng Lửa | 30 + 8×cấp + 0.3×SMPT | giữ |

**Alice — Sát thủ ảo ảnh (SMPT, máu đã mất mục tiêu, Náo Nhiệt)**

| Chiêu | Bản web | Bản roguelite |
|---|---|---|
| Đánh thường (phép) | SMVL + 0.3×SMPT | giữ: **100% SMVL (+30% SMPT)** sát thương phép |
| Nội tại — ảo ảnh nổ | 40 + 8×cấp + 0.35×SMPT | 40 (+8 mỗi cấp) **(+35% SMPT) (+1% mỗi 10 Náo Nhiệt)** |
| S1 Phi Dao | 70–230 + 0.65×SMPT | giữ: 70/110/150/190/230 **(+65% SMPT)** |
| S2 Lướt Đâm | 80–240 + 0.55×SMPT, sau lưng ×2 | 80/120/160/200/240 **(+55% SMPT)**; đâm sau lưng ×2 **(+8% Máu đã mất mục tiêu)** |
| S4 Rực Rỡ | 150–350 + 0.7×SMPT | 150/250/350 **(+70% SMPT)**; Mạo Hiểm trả lại **200% sát thương vừa nhận** (tối đa gấp 2 sát thương gốc) |

**Valerius — Đỡ đòn (máu tối đa, giáp/KP, máu đã mất mục tiêu)**

| Chiêu | Bản web | Bản roguelite |
|---|---|---|
| Nội tại — Phản Kích | +12 (+2/cấp) mỗi tầng | +12 (+2 mỗi cấp) **(+1.5% Máu tối đa)** mỗi tầng |
| S1 Chém Vòng Cung | 60–200 + 0.7×SMVL | 60/95/130/165/200 **(+40% SMVL cộng thêm) (+4% Máu tối đa)** |
| S2 Đâm Thẳng | 70–230 + 0.8×SMVL, +8% máu đã mất | 70/110/150/190/230 **(+80% SMVL cộng thêm) (+8% Máu đã mất mục tiêu)** |
| S3 Khiên Chắn (cú húc) | 50–170 + 0.5×SMVL | 50/80/110/140/170 **(+30% Giáp cộng thêm) (+30% KP cộng thêm)** |
| S4 Chiến Thần Bất Tử | không sát thương | như cũ + hết 4s **hồi 20/25/30% sát thương đã nhận** trong thời gian đó |
| Phụ — Cuồng Phong | 40 + 8×cấp + 0.4×SMVL | 40 (+8 mỗi cấp) **(+40% SMVL) (+2% Máu tối đa)** |

**Diệp Thanh Phong — Pháp sư lai (SMPT, SMVL theo trạng thái gió)**

| Chiêu | Bản web | Bản roguelite |
|---|---|---|
| Nội tại — Đột Kích (Nghịch) | 50 + 14×cấp + 0.3×SMVL + 0.7×SMPT | giữ (đã lai) |
| S1 Toàn Phong Quy | 60–200 + 0.6×SMPT | 60/95/130/165/200 **(+60% SMPT)**; dạng Nghịch chém bồi thêm **(+40% SMVL cộng thêm)** |
| S2 Bát Diện Phong Trận | 55–175 + 0.5×SMPT | 55/85/115/145/175 **(+50% SMPT)**; dạng Nghịch đâm **×(1.5 + 0.5 × Chí mạng)** |
| S3 Mê Tung Phong Vực | 50–170 + 0.5×SMPT; độc 10 + 3×cấp + 0.1×SMPT | giữ |
| S4 Cơn Gió Đưa Giấc | 25–55 + 0.15×SMPT mỗi nhịp | giữ; đòn đánh thức **×1.5 (+4% Máu tối đa mục tiêu)** |
| Phụ — Nghịch Chuyển | 60 + 14×cấp + 0.6×SMPT | giữ; khiên Nghịch→Thuận **80 (+10 mỗi cấp) (+50% SMPT) (+5% Máu tối đa)** |

Khi chuyển các tướng còn lại, áp cùng luật 6.6 và ghi bảng tương tự vào dữ liệu tướng.

---

## 7. Cấu trúc lượt chơi

### 7.1. Màn

| Màn | Vùng đất (ngẫu nhiên 1 trong 2) | Phòng | Boss |
|---|---|---|---|
| 1 | Rừng Thông / Đầm Lầy Sương | 7 phòng + phòng nghỉ trước boss | Boss Tân Thế |
| 2 | Vùng Tử Khí / Trạm Khí Độc | 8 phòng + phòng nghỉ | Thiết Minh Quân hoặc Phượng Hoàng |
| 3 | Tuyết Sơn / Phế Tích Tân Thế | 8 phòng + phòng nghỉ | Rồng Cổ Đại |

- Thiên Hồn Chủ, Kiếm Sư Vĩ Đại, Quái Thú Hoàng Kim: dùng làm **boss bí mật / phòng thử thách** (mục 7.4).
- Mỗi vùng đất có quái riêng và cơ chế địa hình riêng (sương mù giảm tầm nhìn, vũng bùn làm chậm, bụi rậm che thân, thùng nổ…).

### 7.2. Bản đồ rẽ nhánh
- Hết mỗi phòng, hiện **2–3 cửa**. Trên mỗi cửa có biểu tượng loại phòng + loại phần thưởng.
- Đầu mỗi màn có thể xem **sơ đồ màn** (dạng cây, như bản đồ nhiều tầng), biết trước loại phòng nhưng không biết chi tiết.
- Mỗi màn bảo đảm: ít nhất 1 thương nhân, 1 tinh anh, 1 sự kiện; phòng nghỉ luôn ở ngay trước boss.

### 7.3. Loại phòng

| Phòng | Tỉ lệ | Nội dung | Phần thưởng |
|---|---|---|---|
| Chiến đấu | ~50% | 2–3 đợt quái | Theo biểu tượng cửa (xem 8.1) |
| Tinh anh | ~12% | 1 quái tinh anh/boss nhỏ + lính, hoặc **1 tướng AI** | Trang bị chắc chắn + 1 lựa chọn Thiên Phú hiếm trở lên |
| Rương | ~8% | Rương đồ (10% là rương bẫy hóa quái) | Trang bị hoặc vàng |
| Thương nhân | ~10% | Cửa hàng | Mua bằng vàng |
| Sự kiện | ~12% | Gặp nhân vật / tình huống, chọn 1 trong 2–3 | Tùy lựa chọn |
| Thử thách | ~8% | Điều kiện đặc biệt (không được trúng đòn, hạ hết trong 30s…) | Thưởng lớn nếu đạt |
| Nghỉ | Cố định trước boss | Chọn 1: hồi 40% máu / nâng 1 Thiên Phú lên bậc / rèn Ý Niệm | — |
| Boss | Cuối màn | Boss | Vàng nhiều, 1 Thiên Phú huyền thoại, tiền vĩnh viễn |

### 7.4. Sinh ngẫu nhiên
- Mọi thứ trong một lượt sinh từ **một hạt giống** (seed): sơ đồ màn, phòng, quái, phần thưởng.
- Phòng **dựng sẵn bằng tay** (mỗi vùng đất 8–12 mẫu phòng), hệ thống chọn mẫu + đặt quái theo bảng đợt. Không sinh địa hình hoàn toàn ngẫu nhiên ở bản đầu.
- Có chế độ **"Thử thách hằng ngày"**: cùng hạt giống cho mọi người trong ngày, có bảng điểm cục bộ.

---

## 8. Nâng cấp trong lượt (trái tim của game)

### 8.1. Loại phần thưởng phòng

| Biểu tượng cửa | Phần thưởng |
|---|---|
| ✦ Thiên Phú | Chọn 1 trong 3 nâng cấp (riêng tướng hoặc chung) |
| ⚔ Trang bị | Chọn 1 trong 2 trang bị |
| ◆ Mảnh hồn | 1 mảnh hồn (chỉ số nhỏ) |
| ⬆ Kinh nghiệm | Lượng lớn kinh nghiệm |
| ● Vàng | Vàng |
| ✚ Hồi phục | Hồi 25% máu + 1 bình |

### 8.2. Thiên Phú riêng của tướng (từ cây tiến hóa)
- Mỗi tướng có **15 nhánh** cây tiến hóa (5 mốc × 3 lựa chọn, xem `NHAN_VAT.md`). Trong roguelite, chúng thành **Thiên Phú riêng**.
- Mốc cũ thành **độ hiếm**: mốc 1–3 = Thường, mốc 6 = Hiếm, mốc 9 = Sử thi, mốc 12 = Huyền thoại.
- Huyền thoại chỉ xuất hiện từ màn 2, chỉ lấy được **1** trong một lượt (nhánh "Phong cách" đổi hẳn lối chơi).

### 8.3. Ân Huệ chung (nâng cấp dùng cho mọi tướng)
- 30–40 nâng cấp cho mọi tướng, chia theo **nhãn**: Lửa, Băng, Độc, Sét, Chí mạng, Tốc đánh, Lướt, Lá chắn, Hồi máu, Triệu hồi, Ảo ảnh, Khống chế, Kinh tế.
- Ví dụ:
  - *Hỏa Ấn* (Lửa): chiêu gây thiêu đốt 3% máu tối đa/giây trong 3s.
  - *Bước Sấm* (Lướt, Sét): lướt né để lại vệt sét gây sát thương.
  - *Đòn Thứ Ba* (Tốc đánh): mỗi đòn thứ 3 nảy sang 2 mục tiêu (60%).
  - *Khiên Phản Hồi* (Lá chắn): lá chắn vỡ thì nổ, gây sát thương bằng 50% lượng khiên.
- **Ân Huệ kép:** có đủ 2 nhãn nhất định thì mở nâng cấp kết hợp mạnh (ví dụ Lửa + Băng = *Sốc Nhiệt*: mục tiêu vừa cháy vừa chậm nhận +25% sát thương).

### 8.4. Luật chọn 3 lựa chọn
- Mỗi lần thưởng Thiên Phú: rút 3 lựa chọn, **ưu tiên nhãn người chơi đang có** (trọng số ×2) để build thành hình.
- Tối thiểu 1 lựa chọn là Thiên Phú riêng của tướng nếu còn.
- Tỉ lệ độ hiếm theo màn [CHỈNH ĐƯỢC]:

| Màn | Thường | Hiếm | Sử thi | Huyền thoại |
|---|---|---|---|---|
| 1 | 70% | 25% | 5% | 0% |
| 2 | 50% | 35% | 13% | 2% |
| 3 | 35% | 38% | 22% | 5% |

- **Đổi lựa chọn (reroll):** 1 lần mỗi màn miễn phí; thêm lần bằng vàng hoặc mở khóa vĩnh viễn.
- **Nâng bậc:** Thiên Phú đã có có thể xuất hiện lại ở bậc cao hơn (số mạnh hơn, không đổi cơ chế).

### 8.5. Trang bị
- 47 trang bị bản web, tối đa **6 ô**. Hiệu ứng riêng của trang bị (hook) giữ nguyên.
- Lượt đầu chỉ có ~20 trang bị trong danh sách rơi; còn lại mở dần bằng tiến trình vĩnh viễn.
- Không có phôi trong roguelite; bán lại ở thương nhân được 50% giá.
- **Đồ Hoàng Kim** (Giáp, Kiếm, Ý Niệm, Mảnh Hồn Hoàng Kim): chỉ rơi từ boss bí mật, không chiếm ô.

### 8.6. Mảnh hồn & Ý Niệm
- **Mảnh hồn:** chỉ số nhỏ cộng dồn (máu, công, hồi chiêu, tầm nhìn…). Tối đa 6 ô; ô thứ 7 trở đi thay thế ô yếu nhất.
- **Ý Niệm** (cấp vũ khí, 0–5): mỗi bậc +5% sát thương; rèn ở phòng nghỉ hoặc thưởng boss. Bậc 5 cho hiệu ứng vũ khí riêng của tướng.

### 8.7. Vật phẩm dùng một lần
- Bình máu (3 cỡ), bình mana, phép bổ trợ (dịch chuyển ngắn, thanh tẩy, khiên…), dụng cụ (bẫy, bom khói), phù.
- Tối đa 2 ô dùng nhanh + 3 bình máu. Lấy từ thương nhân, rương, sự kiện.

---

## 9. Kinh tế trong lượt [CHỈNH ĐƯỢC]

| Nguồn vàng | Lượng |
|---|---|
| Quái thường | 3–6 |
| Tinh anh | 60–100 |
| Phòng thưởng vàng | 120 / 180 / 250 (màn 1 / 2 / 3) |
| Boss | 300 / 450 / — |

| Giá ở thương nhân | |
|---|---|
| Trang bị | 60% giá bản web (900–1900 vàng) — mua được ~1 món mỗi màn |
| Bình máu nhỏ / vừa / lớn | 45 / 90 / 160 |
| Đổi lựa chọn Thiên Phú | 100, tăng 50 mỗi lần |
| Hồi máu tại chỗ | 30% máu = 150 |

Vàng **mất khi kết thúc lượt** (không mang về meta).

---

## 10. Kẻ địch

### 10.1. Quái thường — chia theo vai
Lấy từ bản web (phe Binh Đoàn Xương, Quái Vật Tận Thế, Ma Hội…), mỗi loại có một cơ chế buộc người chơi đổi cách đánh:

| Vai | Ví dụ | Cơ chế |
|---|---|---|
| Lao vào | Chó Săn Nhiễm Độc, Đốm Lửa Ma Trơi | Áp sát nhanh / tự nổ |
| Đỡ đòn | Lính Xương Cầm Khiên, Bọ Thiết Giáp | Khiên trước mặt −30% / mai cản đạn −30% |
| Đánh xa | Cung Thủ Xương, Hài Cốt Dẫn Hồn | Giữ khoảng cách, bắn đạn né được |
| Gây rối | Hồn Ma Đánh Lạc Hướng, Hắc Ảnh Tập Kích | Tàng hình, đánh lén từ bụi |
| Hỗ trợ | Trưởng Lão Vu Cốt | Hồi máu, tăng tốc đồng bọn |
| Khu vực | Quỷ Hồn Gào Thét, Bọ Chúa Phun Axit | Vùng làm chậm, vũng axit |

- **Bầy có đầu đàn:** 1 đầu đàn (máu ×2.2, công ×1.4) + 2–4 con theo. Hạ đầu đàn thì bầy rối loạn 3s.
- Mỗi màn dùng 5–7 loại quái; màn sau trộn loại cũ với loại mới.

### 10.2. Tinh anh
- Bản tinh anh của quái thường (đã có tên và cơ chế riêng trong bản web), hoặc **8 boss nhỏ** (mỗi con 2 kỹ năng có cảnh báo).
- Tinh anh có thanh Kiên Định (mục 6.2).

### 10.3. Tướng AI làm tinh anh [CỐ ĐỊNH — điểm đặc biệt của game]
- Ở phòng tinh anh, 30% là **một tướng khác do AI điều khiển** (ngoài tướng người chơi đang dùng), cấp bằng người chơi, có 2–3 Thiên Phú ngẫu nhiên và 2 trang bị.
- AI dùng chiêu, né cảnh báo, rút lui khi thấp máu, uống bình — chuyển từ bộ não AI của bản web (xem `CLAUDE.md` mục AI).
- **Quan hệ:** tướng có quan hệ tốt với tướng người chơi thì có 50% chuyển thành **sự kiện** thay vì đánh (mục 11.1).
- Hạ tướng AI: thưởng 1 Thiên Phú **riêng của tướng đó** (mượn sức mạnh của tướng khác — hiếm và mạnh).

### 10.4. Boss
| Boss | Màn | Chiêu có cảnh báo (bản web) | Giai đoạn 2 (mới, khi còn 50% máu) |
|---|---|---|---|
| Boss Tân Thế | 1 | Dậm Đất Tân Thế | Gọi 2 đợt lính, dậm đất 2 lần liên tiếp |
| Thiết Minh Quân | 2 | Minh Kình Phách Địa, Thiết Xích Đoạt Mệnh, Thiết Giáp Bão Tố | Xích kéo người chơi vào giữa |
| Phượng Hoàng | 2 | Bão Lửa Tàn Lụi, Vũ Điệu Tro Tàn, Mưa Lông Lửa Khởi Tử | Hồi sinh 1 lần với 30% máu |
| Rồng Cổ Đại | 3 | Long Tức Nguyên Thủy, Long Giáng Trảm Địa, Thiên Hỏa Truy Kích | Bay lên, mưa lửa toàn phòng có ô an toàn |
| Thiên Hồn Chủ | Bí mật | Hồn Trận Hút Sinh Mệnh, Vạn Hồn Thiên Giáng, Thập Tự Đoạt Hồn | — |
| Kiếm Sư Vĩ Đại | Bí mật | Nhất Kiếm Đoạt Mệnh, Vạn Kiếm Quy Tông, Ảo Ảnh Tam Kiếm | — |
| Quái Thú Hoàng Kim | Phòng thử thách | Kim Giác Húc, Địa Chấn Hoàng Kim, Mưa Kim Sa Bộc Phá | Bỏ chạy — hạ trong 60s mới có thưởng |

Chỉ số boss trong bản web tính cho trận 30 phút có 10 tướng; với roguelite, **dùng tỉ lệ** (máu boss = máu người chơi lúc đó × hệ số theo màn) thay vì số tuyệt đối [CHỈNH ĐƯỢC].

### 10.5. Tăng độ khó
- Theo màn: máu quái ×1 / ×2.2 / ×4, công ×1 / ×1.6 / ×2.4 [CHỈNH ĐƯỢC].
- Theo bậc thử thách (mục 11.4).

---

## 11. Tiến trình vĩnh viễn (meta)

### 11.1. Sự kiện & đồng minh tạm
- **Sự kiện** là phòng có lựa chọn, ví dụ:
  - *Tướng bị thương bên đường:* cứu (mất 20% máu, nhận đồng minh tạm 3 phòng) hoặc bỏ qua.
  - *Đền đổ:* hiến 1 trang bị đổi 1 Thiên Phú sử thi.
  - *Thương nhân bí ẩn:* đổi máu tối đa lấy sức mạnh.
- **Đồng minh tạm:** tướng AI đi theo, đánh cùng trong 3 phòng hoặc tới hết màn, rồi rời đi để lại 1 món quà.

### 11.2. Khu nhà chính
- Không gian nhỏ, đi lại được. Có các tướng đã mở khóa đứng nói chuyện, cổng vào đấu trường, các trạm nâng cấp.

### 11.3. Tiền vĩnh viễn — "Hồn Tinh"
- Nhận khi: hạ tinh anh, hạ boss, hoàn thành thử thách, kết thúc lượt (theo số phòng đã qua). Thua vẫn nhận.
- Dùng để:

| Trạm | Nội dung |
|---|---|
| Đền Anh Hùng | Mở khóa tướng |
| Lò Rèn | Thêm trang bị vào danh sách rơi |
| Bia Ký Ức | Nâng chỉ số vĩnh viễn nhỏ: +5% máu ×5 bậc, +1 bình đầu lượt, +1 lần đổi lựa chọn, **1 lần hồi sinh mỗi lượt** (đắt nhất) |
| Thư Viện | Mở Ân Huệ chung mới vào danh sách |

Giới hạn: tổng sức mạnh vĩnh viễn không vượt ~25% so với lượt đầu — kỹ năng vẫn là chính [CỐ ĐỊNH].

### 11.4. Bậc thử thách
Thắng lượt thì mở bậc tiếp theo (tối đa 10). Mỗi bậc thêm 1 điều kiện, cộng dồn:
1. Quái +15% máu
2. Tinh anh xuất hiện nhiều hơn
3. Phòng nghỉ chỉ hồi 25%
4. Boss có thêm 1 chiêu
5. Quái +15% tốc độ
6. Thương nhân đắt hơn 30%
7. Không đổi lựa chọn miễn phí
8. Vùng cảnh báo ngắn hơn 20%
9. Bắt đầu với 80% máu
10. Boss cuối có giai đoạn 3

Bậc cao thưởng Hồn Tinh nhiều hơn và mở kết thúc phụ.

### 11.5. Thành thạo tướng
Mỗi tướng có 10 cấp thành thạo (kinh nghiệm theo số phòng qua với tướng đó). Mở: mảnh ký ức cốt truyện, Thiên Phú riêng thứ 16–18, trang phục đổi màu, biểu tượng.

---

## 12. Giao diện

- **HUD trong trận:** máu + Hộ Giáp + lá chắn (một thanh, nhiều lớp màu), mana / tài nguyên riêng của tướng, 5 ô chiêu có đồng hồ hồi, ô lướt né, bình, 2 ô dùng nhanh, vàng, bản đồ nhỏ của màn.
- **Màn chọn Thiên Phú:** 3 thẻ lớn: tên, độ hiếm (màu viền), nhãn, mô tả ngắn **có con số**, đánh dấu "kết hợp với: …" nếu tạo Ân Huệ kép.
- **Bảng build (Tab):** toàn bộ Thiên Phú, trang bị, mảnh hồn, chỉ số chi tiết, mô tả chiêu theo cấp hiện tại.
- **Mô tả chiêu** luôn hiện số thật theo chỉ số hiện tại (ví dụ "gây 184 sát thương phép"), giữ Alt để xem công thức.
- **Cài đặt:** rung camera, số sát thương, tự ngắm, độ lớn chữ, chế độ mù màu cho vùng cảnh báo.
- **Ngôn ngữ:** tiếng Việt trước; mọi chữ nằm trong bảng dịch (Unity Localization) để thêm tiếng Anh sau.

---

## 13. Hình ảnh & âm thanh (hướng)

- Phong cách: tươi, rõ khối, đọc tốt từ xa. Mỗi tướng giữ **màu chủ đạo** trong `NHAN_VAT.md`.
- Vùng cảnh báo địch luôn đỏ; hiệu ứng của người chơi không dùng đỏ đậm để không lẫn.
- Mỗi vùng đất một bảng màu và một bản nhạc; boss có nhạc riêng, đổi nhịp khi vào giai đoạn 2.
- Âm thanh quan trọng hơn đồ họa ở bản thử: tiếng đòn trúng, tiếng chiêu hồi xong, tiếng cảnh báo boss.

---

## 14. Lưu game
- Lưu **tiến trình vĩnh viễn** sau mỗi phòng và khi thoát.
- Lưu **lượt đang chơi** ở đầu mỗi phòng (thoát giữa phòng thì vào lại từ đầu phòng đó).
- Định dạng JSON, có số phiên bản để nâng cấp dữ liệu lưu.

---

## 15. Phạm vi & lộ trình

### 15.1. Bản thử đầu (MVP) — mục tiêu: "đánh 1 màn thấy vui"
- 6 tướng (mục 5.3), mỗi tướng đủ S1–S4, skill phụ, 15 Thiên Phú.
- 1 màn (Rừng Thông): 8 mẫu phòng, 6 loại quái, 2 tinh anh, 1 tướng AI tinh anh, Boss Tân Thế.
- 30 Ân Huệ chung, 20 trang bị, 10 mảnh hồn, 3 loại bình.
- Thương nhân, phòng nghỉ, 3 sự kiện.
- Khu nhà chính đơn giản: mở tướng + 3 nâng cấp vĩnh viễn.

### 15.2. Các mốc

| Mốc | Nội dung | Điều kiện qua mốc |
|---|---|---|
| M0 — Nền móng | Di chuyển, camera, lướt né, đánh thường, 1 loại quái, hệ chỉ số + sát thương | Đánh quái thấy đã tay |
| M1 — Một tướng | Elara đủ bộ chiêu, hệ trạng thái, vùng cảnh báo, 3 loại quái | Đánh 1 phòng với Elara thấy vui |
| M2 — Vòng phòng | Sinh màn, cửa, phần thưởng, Thiên Phú, trang bị, thương nhân | Chơi hết 1 màn không lỗi |
| M3 — Boss & tinh anh | Boss Tân Thế, boss nhỏ, tướng AI tinh anh | Boss khó mà công bằng |
| M4 — Đủ MVP | 6 tướng, meta, lưu game | Người khác chơi thử muốn chơi lại |
| M5 — Mở rộng | Màn 2–3, thêm tướng, bậc thử thách, cốt truyện | — |

---

## 16. Rủi ro

| Rủi ro | Cách giảm |
|---|---|
| Kết hợp quá mạnh (bất tử, xóa boss trong 1 giây) | Giới hạn: lá chắn tối đa 100% máu, giảm hồi chiêu tối đa 40%, hồi máu từ hút máu giảm khi đánh boss; thử nghiệm bằng chế độ debug chọn Thiên Phú |
| Khối lượng nội dung (40 tướng × 15 Thiên Phú) | Ra dần 2–4 tướng/bản; làm công cụ nhập dữ liệu từ `NHAN_VAT.md` |
| Lượt thứ 20 giống lượt thứ 2 | Bậc thử thách, sự kiện, tướng AI tinh anh, thử thách hằng ngày |
| Chiêu bản web được thiết kế cho đấu tướng, không hợp đánh bầy quái | Mỗi tướng xem lại: chiêu đơn mục tiêu cần một Thiên Phú lan sát thương |
| Phạm vi phình to | Chỉ làm đúng danh sách MVP; mọi ý mới ghi vào danh sách "sau MVP" |

---

## 17. Phụ lục — tham chiếu
- `NHAN_VAT.md`: số liệu chính xác của 40 tướng, 47 trang bị, 35 vật phẩm, hiệu ứng trạng thái, công thức.
- `THIET_KE.md` (repo web): số liệu quái, boss, bản đồ, mảnh hồn, Ý Niệm.
- Repo web `luoidacten/auto-bat`: mã nguồn tham chiếu (`src/data/heroes/<id>.js`, `src/sim/`).
