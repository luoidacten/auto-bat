# 8 TƯỚNG ĐẦU TIÊN — ĐẶC TẢ CHI TIẾT ĐỂ DỰNG TRONG UNITY

> Viết tay từ **mã nguồn bản web** (`src/data/heroes/<id>.js`), đối chiếu từng dòng. Mọi con số ở cột "Bản web" là số **đang chạy thật**.
> Cột / dòng **"Roguelite"** là đề xuất cho bản Unity (theo `GDD.md` mục 5.1 và 6.5–6.7) — đánh dấu [CHỈNH ĐƯỢC].
> Chỗ mô tả trong game bản web **lệch với mã** được ghi ⚠ — luôn tin theo mã.

## Danh sách & thứ tự làm

| # | Tướng | Vai trò | Độ khó dựng | Hệ thống mới cần có khi làm tướng này |
|---|---|---|---|---|
| 1 | **Elara** | Xạ thủ | ★☆☆ | Đạn, đạn đuổi, chiêu tích lực, lướt, làm chậm |
| 2 | **Borg** | Đấu sĩ cận chiến | ★☆☆ | Lướt va chạm, đẩy lùi/kéo, choáng, hất tung, giảm sát thương, vùng giam |
| 3 | **Valerius** | Đỡ đòn | ★☆☆ | Chiêu vận (đi chậm, không bị ngắt), đánh hình nón/đường thẳng, câm lặng, "không chết" |
| 4 | **Ignatius** | Pháp sư lửa | ★★☆ | Tầng cộng dồn, sát thương theo thời gian, vùng tồn tại, cảnh báo, chiêu nhiều lượt (charges) |
| 5 | **Death** | Đấu sĩ phép / kết liễu | ★★☆ | Móc kéo, dùng lại chiêu (recast), đánh dấu lặp sát thương |
| 6 | **Victoria** | Hỗ trợ / triệu hồi | ★★★ | Lính triệu hồi có AI, 3 thế (mode), hào quang |
| 7 | **Alice** | Sát thủ ảo ảnh | ★★★ | Ảo ảnh, tàng hình, hoán đổi vị trí, chặn đòn chí tử, chiêu cuối 3 biến thể |
| 8 | **Diệp Thanh Phong** | Pháp sư điều khiển | ★★★ | Thanh trạng thái đổi cả bộ chiêu, đổi cận/xa, ngủ |

Làm theo thứ tự trên: mỗi tướng mở thêm đúng một nhóm hệ thống, tướng sau dùng lại hệ thống của tướng trước.

---

## 0. Quy ước đọc tài liệu (bắt buộc đọc trước)

### 0.1. Ký hiệu
- **D** = lượng sát thương gốc của chiêu (đã cộng hệ số), trước mọi hệ số chung (GDD 6.1).
- `[a/b/c/d/e]` = theo cấp chiêu 1→5; S4 `[a/b/c]` = cấp 1→3.
- **cấp** = cấp tướng (1–18). **SMVL** trong cột "Bản web" = SMVL **tổng**.
- Mana ghi theo số gốc; **mana thực tế = số ghi × 0.6** (hằng `MANA_COST`).
- "gap" = khoảng cách giữa **mép** hai đơn vị = tâm-tâm − bán kính A − bán kính B.

### 0.2. Hình học vùng đánh (giống hệt bản web)

| Hàm web | Ý nghĩa tham số | Unity |
|---|---|---|
| `hitCircle(x, y, R)` | tròn bán kính R | `OverlapSphere` |
| `hitCone(x, y, dir, R, c)` | hình nón bán kính R, **c = cos(nửa góc)** → **góc mở = 2·acos(c)** | lọc theo `Vector3.Dot(dir, toTarget.normalized) >= c` |
| `hitLine(x, y, dir, len, w)` | đoạn thẳng dài `len`, **bề rộng toàn phần `w`**; trúng nếu khoảng cách tới đoạn ≤ w/2 + bán kính mục tiêu; sắp theo khoảng cách từ điểm đầu | capsule cast |

Bảng quy đổi c → góc mở: 0 → 180° • 0.42 → 130° • 0.5 → 120° • 0.6 → 106°.

### 0.3. Trạng thái & di chuyển cưỡng bức
| Gọi web | Nghĩa |
|---|---|
| `slow(t, v)` | giảm v×100% tốc chạy trong t giây |
| `haste(t, v)` | tăng v×100% tốc chạy |
| `knock(dir, dist, dur)` | đẩy `dist` đv trong `dur` giây (bị chặn nếu mục tiêu `unstop`, bất tử, đang "neo" hoặc là quái lớn); `onWall` gọi khi đập tường |
| `knockup(dur)` | hất tung `dur` giây (khống chế cứng, **không** bị Kháng hiệu ứng rút ngắn) |
| `dashTo(x, y, speed)` | tự lướt với tốc độ `speed` đv/s; `onContact` gọi khi chạm kẻ địch (trả `'stop'` để dừng) |
| `blink(x, y)` | dịch chuyển tức thời |
| `zone(r, life, every)` | vùng tồn tại `life` giây, chạy `tick` mỗi `every` giây |
| `later(t, fn)` | hẹn giờ |
| `allowRecast(slot, win)` | mở khung `win` giây để bấm lại chiêu (lần bấm lại không tốn hồi chiêu/mana) |

- Kháng hiệu ứng rút ngắn khống chế, **tối đa 60%**.
- Khống chế cứng (choáng, ngủ, hất tung, mê hoặc) **ngắt** chiêu đang vận (trừ chiêu `castUnstop`) và cắt lướt.
- Ngủ: trúng đòn của đối phương là tỉnh; đòn đánh thức nhân hệ số `v` của trạng thái ngủ.

### 0.4. Roguelite — thay đổi chung cho cả 8 tướng
- Máu thực tế = máu theo cấp × **1.5** (bản web ×2.4; Borg, Valerius kiểu "Lì đòn" ở web thêm ×1.15 — **bỏ** trong roguelite).
- Mọi chiêu/nội tại bản web chỉ nhắm **tướng** (`heroOnly`, "tướng gần nhất", "tướng địch") → roguelite đổi thành **mọi kẻ địch** (ưu tiên tinh anh / boss), trừ khi ghi khác.
- Khống chế cứng lên boss/tinh anh → trừ thanh **Kiên Định** (GDD 6.2).

---

## 1. ELARA — Xạ thủ

**Vai trò:** xạ thủ thả diều. Đánh thường là nguồn sát thương chính; chiêu để cấu rỉa, thoát thân, kết liễu tầm cực xa. Tướng dạy người mới.

### 1.1. Chỉ số
| | Cấp 1 | +/cấp | Cấp 18 |
|---|---|---|---|
| Máu (dữ liệu gốc) | 560 | 88 | 2056 |
| Máu roguelite (×1.5) | 840 | 132 | 3084 |
| Mana | 320 | 40 | 1000 |
| Hồi mana/s (đã ×1.6) | 2.56 | 0.128 | 4.74 |
| SMVL | 54 | 3.6 | 115.2 |
| Giáp | 26 | 3.8 | 90.6 |
| KP | 30 | 1.3 | 52.1 |
| Tốc đánh | 0.65 | +3% | 0.98 |
| Tốc chạy | 3.3 | | |
| Tầm đánh | 6.2 | | |
- Bán kính va chạm 0.6. Đạn đánh thường: mũi tên, tốc độ 22 đv/s. Sát thương vật lý.

### 1.2. Nội tại — Linh Hoạt
1. **Chạy lùi:** khi đang lùi xa khỏi địch → +20% tốc chạy (làm mới mỗi 0.3s). Nhánh 1a: +35%.
   - Bản web dùng cờ "AI đang bỏ chạy". **Unity:** coi là "lùi" khi có kẻ địch trong 8 đv và `Dot(hướng_di_chuyển, hướng_từ_địch_gần_nhất_tới_Elara) > 0.3`.
2. **Tập Trung:** nếu đã **≥ 5s** kể từ lần tấn công trước → đòn đánh thường kế tiếp **×1.25**. Nhánh 9a: 3s và ×1.4. Nhánh 9c: thay bằng **mọi** đòn đánh ×1.15.
   - "Lần tấn công" được làm mới bởi: đánh thường, S1, S2, chiêu phụ (S3 và S4 **không** làm mới).
   - ⚠ Mô tả web ghi "tên bay nhanh hơn" — mã **không** đổi tốc tên. Roguelite: tùy chọn +30% tốc tên cho đòn Tập Trung.
- **Roguelite:** đòn Tập Trung cộng thêm **20 (+4 mỗi cấp) (+25% SMVL cộng thêm)**.

### 1.3. S1 — Liên Xạ
| Hồi chiêu | Mana | Thi triển | Nhắm | Tầm (AI) |
|---|---|---|---|---|
| 7 / 6.5 / 6 / 5.5 / 5s | 40 | 0 | **Mục tiêu** (unit) | 6.3 |
- **Hành vi:** bắn 3 mũi tên **đuổi** (homing, tốc 24) vào mục tiêu, cách nhau 0.12s. Mũi tên bắn ra sau khi mục tiêu chết thì hủy.
- **Mỗi mũi:** `0.5 × SMVL + [15/25/35/45/55]` vật lý.
  - ⚠ Mô tả web ghi "50% sát thương đánh thường" — mã dùng 50% SMVL, **không** có chí mạng, **không** kích hoạt hiệu ứng đòn đánh.
- Nhánh 1c: 4 mũi. Nhánh 12b: 5 mũi, cách 0.05s. Nhánh 6b: trong 2s sau khi dùng, **bấm lại** → mũi tên lớn đuổi (tốc 28) 100% SMVL, đẩy lùi 2 đv.
- **Roguelite:** mỗi mũi `[15/25/35/45/55] (+50% SMVL)`, **được chí mạng và kích hoạt hiệu ứng đòn đánh** (Liên Xạ thành chiêu dồn đòn đánh).

### 1.4. S2 — Kéo Căng Dây
| Hồi chiêu | Mana | Thi triển | Nhắm | Tầm |
|---|---|---|---|---|
| 12 / 11 / 10 / 9 / 8s | 60 | **Tích 0→1.5s** | Điểm / hướng | bay 12 đv |
- **Hành vi:** giữ nút để tích (tối đa 1.5s), trong lúc tích đi **chậm 50%** (nhánh 6c: không chậm). Thả → bắn 1 mũi tên **xuyên thấu**, tốc 24, bán kính 0.45, bay 12 đv (13.8 với nhánh 1b).
- **Sát thương:** `D = ([80/125/170/215/260] + 0.9 × SMVL) × (0.5 + 0.5 × c)`, với `c = min(1, thời_gian_tích / 1.5)`.
- Lính (minion) chỉ nhận 60% (nhánh 3b: 100% và **xuyên tường**). Roguelite: bỏ quy tắc lính.
- Nhánh 12a: tích ≥ 90% → mỗi 0.2s kéo kẻ địch trong 2.5 đv quanh mũi tên về phía nó (tối đa 1.5 đv, mỗi kẻ 1 lần).
- **Roguelite:** `[80/125/170/215/260] (+100% SMVL cộng thêm)` × (0.5 → 1.0 theo tích) **× (1 + 0.5 × Chí mạng)**.

### 1.5. S3 — Sao Băng Lùi
| Hồi chiêu | Mana | Thi triển | Nhắm | Tầm |
|---|---|---|---|---|
| 14 / 13 / 12 / 11 / 10s | 50 | 0 | Hướng ra xa địch | lùi 3.5 đv |
- **Hành vi:**
  1. Chọn "kẻ đe dọa" = mục tiêu đang ngắm, hoặc tướng địch gần nhất trong 8 đv; không có thì lấy hướng mặt.
  2. Lướt **lùi** 3.5 đv (ngược hướng kẻ đe dọa), tốc 16.
  3. Hết lướt: bắn **3 sao băng** về phía kẻ đe dọa, lệch −0.3 / 0 / +0.3 rad (±17°), tốc 18, bay 6 đv, bán kính 0.4, **dừng ở mục tiêu đầu tiên**.
- **Mỗi sao băng:** `[30/50/70/90/110] + 0.3 × SMVL` vật lý + làm chậm **40% trong 1.5s** (nhánh 3a: 60% / 2s).
- Nhánh 3c: hết lướt → hồi ngay S1. Nhánh 6a: thay 3 sao băng bằng vùng băng bán kính 3 tại **chỗ đứng cũ**, 2.5s, mỗi 0.5s gây 30% sát thương + chậm 50%.
- **Roguelite:** mỗi sao băng `[30/50/70/90/110] (+30% SMVL cộng thêm)`; chậm 40% (+1% mỗi 5% Tốc đánh cộng thêm, tối đa 60%). Người chơi điều khiển hướng lùi = ngược hướng con trỏ.

### 1.6. S4 — Thần Tiễn Phá Không
| Hồi chiêu | Mana | Thi triển | Nhắm | Tầm |
|---|---|---|---|---|
| 100 / 85 / 70s | 100 | 0.25s | Hướng | bay 80 đv |
- **Hành vi:** mũi tên khổng lồ tốc 20, bán kính 0.8, **xuyên tường**, không trúng lính, dừng ở **tướng đầu tiên**.
- **Trúng:** `D = [200/300/400] + 1.0 × SMVL` vật lý (×1.4 vì là chiêu cuối) + **choáng `min(1.5, 0.5 + quãng_bay / 15)`** giây (0.5s sát mặt, tối đa 1.5s từ 15 đv). Kẻ địch khác trong 2.5 đv quanh mục tiêu nhận 40% D.
- Nhánh 9b: xuyên qua tướng đầu tiên; mọi tướng **phía sau** nhận 50% D + trói chân 1s + câm lặng 1s.
- **Roguelite:** `[200/300/400] (+100% SMVL cộng thêm) (+10/15/20% Máu đã mất mục tiêu)`. Phòng roguelite nhỏ → tầm bay 40 đv là đủ; trúng **mọi** kẻ địch đầu tiên (không chỉ tướng).

### 1.7. Chiêu phụ — Tên Hình Nón
| Hồi chiêu | Mana | Nhắm |
|---|---|---|
| 10s | 30 | Hướng |
- 3 mũi tên lệch −0.35 / 0 / +0.35 rad, tốc 26, bay 3.4 đv, bán kính 0.45, mỗi mũi dừng ở mục tiêu đầu.
- Mỗi mũi: `30 + 6 × cấp + 0.35 × SMVL` vật lý + đẩy lùi 1.6 đv trong 0.2s (theo hướng mũi tên).
- AI dùng khi kẻ cận chiến áp sát (gap < 2.2).

### 1.8. Cây tiến hóa
| Mốc | | Tên | Hiệu ứng chính xác |
|---|---|---|---|
| 1 | a | Bộ Pháp Tinh Linh | Tốc chạy khi lùi +35% (thay 20%) |
| 1 | b | Ưng Nhãn | +0.6 tầm đánh; S2 bay 13.8 đv |
| 1 | c | Liên Xạ Thần Tốc | S1 bắn 4 mũi |
| 3 | a | Băng Vĩnh Cửu | S3 làm chậm 60% trong 2s |
| 3 | b | Mũi Tên Xuyên Phá | S2 xuyên tường, không giảm sát thương lên lính |
| 3 | c | Thuận Phong | S3 hết lướt → S1 hồi ngay |
| 6 | a | Mưa Băng Rải Thảm | S3 thành vùng băng r=3 ở chỗ cũ, 2.5s, mỗi 0.5s 30% sát thương + chậm 50% 0.6s |
| 6 | b | Tiễn Trùng Khí | Sau S1, trong 2s bấm lại: tên lớn 100% SMVL, đẩy 2 đv |
| 6 | c | Cung Pháp Du Mục | Tích S2 không bị chậm |
| 9 | a | Tập Trung Tuyệt Đối | Tập Trung sau 3s, ×1.4 |
| 9 | b | Băng Phong Toàn Vực | S4 xuyên tướng đầu; tướng phía sau: 50% D, trói 1s, câm lặng 1s |
| 9 | c | Cung Thủ Tối Thượng | Mọi đòn đánh ×1.15 (thay Tập Trung) |
| 12 | a | Mũi Tên Hư Không | S2 tích ≥ 90%: hút kẻ địch trong 2.5 đv về đường bay |
| 12 | b | Cung Thủ Thần Tốc | −1 tầm đánh, +30% tốc đánh; S1 bắn 5 mũi cách 0.05s |
| 12 | c | Cảm Ứng Rừng Già | Lộ diện kẻ địch tàng hình / trong bụi trong 7 đv |

### 1.9. Ghi chú Unity & kiểm thử
- S2 cần trạng thái "đang tích" trong `SkillCaster`: giữ phím → tăng `chargeTime`, thả → `Execute` với `ctx.Charge = c`.
- **Ca kiểm thử:** cấp 1, S1 cấp 1, SMVL 54 → mỗi mũi `27 + 15 = 42` trước giáp (bản web). Với giáp 30: `42 × 100/130 = 32.3`.

---

## 2. BORG — Đấu sĩ cận chiến

**Vai trò:** lao vào, khóa mục tiêu, càng ít máu càng đau. Không dùng mana.

### 2.1. Chỉ số
| | Cấp 1 | +/cấp | Cấp 18 |
|---|---|---|---|
| Máu (gốc) | 640 | 100 | 2340 |
| Máu roguelite (×1.5) | 960 | 150 | 3510 |
| Mana | — (không dùng) | | |
| SMVL | 63 | 3.8 | 127.6 |
| Giáp | 33 | 4.2 | 104.4 |
| KP | 32 | 1.9 | 64.3 |
| Tốc đánh | 0.68 | +2.2% | 0.93 |
| Tốc chạy | 3.5 | | |
| Tầm đánh | 1.45 (cận chiến) | | |
- Bán kính 0.72. Sát thương vật lý.

### 2.2. Nội tại — Huyết Chiến & Đấm Móc
1. **Huyết Chiến:** mọi sát thương Borg gây ra × `(1 + 0.35 × rage)`, với `rage = clamp((1 − %máu) / 0.7, 0, 1)` → 0 khi đầy máu, tăng tuyến tính, tối đa (+35%) khi còn ≤ 30% máu.
2. **Thiêu đốt:** khi Borg dưới 30% máu, mỗi đòn đánh thường gây thiêu `8 + 2 × cấp` sát thương **phép** mỗi giây trong 2s (nhảy mỗi 0.5s; cùng nguồn thì làm mới, không cộng dồn).
3. **Đấm Móc:** cứ đòn đánh thường thứ **3** hất tung mục tiêu 0.3s (nhánh 1c: mỗi đòn thứ 2; nhánh 6b: hất 0.6s rồi choáng thêm 0.5s).
- **Roguelite:** thiêu `10 (+2 mỗi cấp) (+1% Máu tối đa của Borg)` mỗi giây.

### 2.3. S1 — Chộp & Quật
| Hồi chiêu | Thi triển | Nhắm | Tầm |
|---|---|---|---|
| 12 / 11.5 / 11 / 10.5 / 10s | 0.05s | Hướng | lao 4 đv |
- **Hành vi:**
  1. Lao tới điểm cách 4 đv (không qua tường), tốc 18.
  2. Chạm kẻ địch **đầu tiên** (tướng / pet / quái) → dừng lao.
  3. Gây `[60/95/130/165/200] + 0.6 × SMVL` vật lý.
  4. Quật mục tiêu ra **sau lưng Borg**: đẩy ngược hướng lao một quãng `khoảng_cách + r_Borg + r_mục_tiêu + 0.6` trong 0.25s.
  5. Sau 0.25s: choáng **1s** (nhánh 3b: 1.5s).
- Nhánh 6a: thay bước 4–5 bằng ném mục tiêu 5 đv **về phía trước** trong 0.4s; đập tường → choáng 0.75s; sau 0.4s choáng thêm 0.75 × thời gian choáng.
- **Roguelite:** `[60/95/130/165/200] (+60% SMVL cộng thêm) (+5% Máu cộng thêm)`.

### 2.4. S2 — Trả Đòn
| Hồi chiêu | Thi triển | Nhắm | Vùng |
|---|---|---|---|
| 9 / 8.5 / 8 / 7.5 / 7s | 0.15s | Hướng | nón R=2.6, c=0.6 (106°) |
- **Bình thường:** `D = [70/110/150/190/230] + 0.9 × SMVL` vật lý lên mọi kẻ địch trong nón.
- **Sau Gồng Mình:** nếu dùng trong **3s** sau khi Gồng kết thúc và đã hấp thụ > 0: D cộng thêm **40%** lượng đã hấp thụ (nhánh 9b: 80% + choáng 0.75s), đẩy lùi 2 đv; sau đó xóa lượng hấp thụ.
- Nhánh 3c: luôn thiêu đốt. Nhánh 12a: khi **chưa** Gồng → lao 5 đv (tốc 16, không thể cản) đẩy kẻ cản đường 1.5 đv, 0.32s sau mới đấm (hướng vào tướng gần nhất trong 4 đv).
- **Roguelite:** `[70/110/150/190/230] (+90% SMVL cộng thêm) (+40% sát thương đã hấp thụ)`.

### 2.5. S3 — Gồng Mình
| Hồi chiêu | Thi triển | Nhắm |
|---|---|---|
| 14 / 13 / 12 / 11 / 10s | 0 (tức thì) | Tự thân |
- 1.5s: giảm **50%** mọi sát thương nhận; phần bị giảm cộng vào "lượng hấp thụ"; **không bị đẩy lùi** (vẫn dính choáng/trói). Borg vẫn di chuyển và đánh được.
- Hết 1.5s: ghi thời điểm kết thúc. Nếu đang có mục tiêu trong 3 đv → hồi chiêu S2 còn 0.1s.
- Nhánh 3a: hết Gồng → lá chắn = 60% lượng hấp thụ, 3s.
- **Roguelite:** thêm lá chắn tức thì `[40/60/80/100/120] (+8% Máu cộng thêm)` 1.5s.

### 2.6. S4 — Đấu Trường La Mã
| Hồi chiêu | Nhắm | Vùng |
|---|---|---|
| 120 / 100 / 80s | Tự thân | tròn R=4.5 quanh chỗ đứng |
- Ghi lại các **tướng địch** đang trong R=4.5 lúc dùng. Trong **4s** (nhánh 12c: 5.5s), mỗi 0.05s: ai trong danh sách mà cách tâm > R − 0.4 bị kéo về mép trong (không ra được, lướt bị cắt).
- Borg giảm **25%** sát thương nhận trong 4s. Nhánh 9a: không thể bị cản phá. Nhánh 12c: đứng trong võ đài hồi 3% máu tối đa mỗi giây.
- ⚠ Bản web không có sát thương. **Roguelite:** giam **mọi** kẻ địch trong vùng (trừ boss: chỉ chậm 30%); Borg +`[20/30/40] (+15% Giáp cộng thêm)` Giáp và KP; kẻ bị kéo về từ mép nhận `[100/150/200] (+4% Máu tối đa mục tiêu)` (mỗi kẻ 1 lần mỗi giây).

### 2.7. Cây tiến hóa
| Mốc | | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Kích Động | Dưới 60% máu: +12% tốc chạy |
| 1 | b | Cơ Bắp Thép | +150 máu, +8% Kháng hiệu ứng |
| 1 | c | Móc Nhanh | Đấm Móc mỗi đòn thứ 2 |
| 3 | a | Hấp Thụ Triệt Để | Hết Gồng: lá chắn 60% lượng hấp thụ, 3s |
| 3 | b | Quật Ngã Tàn Bạo | S1 choáng 1.5s |
| 3 | c | Cú Đấm Nhiệt Lượng | S2 luôn thiêu đốt |
| 6 | a | Cú Ném Tử Thần | S1 ném mục tiêu 5 đv về trước; đập tường choáng thêm 0.75s |
| 6 | b | Đập Nện Mặt Sàn | Đấm Móc hất 0.6s + choáng 0.5s khi rơi |
| 6 | c | Kích Nổ Adrenaline | Đang bị khống chế cứng mà S3 sẵn sàng: tự xóa khống chế + tự Gồng (tốn hồi chiêu S3) |
| 9 | a | Đấu Trường Bất Bại | Trong võ đài: không thể bị cản phá |
| 9 | b | Cú Đấm Ngàn Cân | S2 sau Gồng: +80% hấp thụ, choáng 0.75s |
| 9 | c | Nổi Điên | Dưới 30% máu: mọi đòn đánh hất tung 0.3s (mỗi mục tiêu 2s/lần) |
| 12 | a | Cú Húc Xuyên Giáp | S2 khi chưa Gồng: lao 5 đv không thể cản rồi đấm |
| 12 | b | Đấu Sĩ Khát Máu | + tốc đánh = 60% × rage; luôn thiêu đốt |
| 12 | c | Võ Đài Vĩnh Cửu | Võ đài 5.5s; trong võ đài hồi 3% máu tối đa/giây |

### 2.8. Ghi chú Unity & kiểm thử
- Thứ tự S3 → S2 là combo chính: UI nên hiện "lượng hấp thụ" trên ô S2 trong 3s.
- **Kiểm thử Huyết Chiến:** máu 65% → `rage = 0.35/0.7 = 0.5` → ×1.175.

---

## 3. VALERIUS — Đỡ đòn

**Vai trò:** trâu, phản đòn, khống chế ngắn. Đơn giản, chịu được sai lầm của người mới.

### 3.1. Chỉ số
| | Cấp 1 | +/cấp | Cấp 18 |
|---|---|---|---|
| Máu (gốc) | 640 | 98 | 2306 |
| Máu roguelite (×1.5) | 960 | 147 | 3459 |
| Mana | 300 | 40 | 980 |
| Hồi mana/s (×1.6) | 2.24 | 0.128 | 4.42 |
| SMVL | 60 | 3.6 | 121.2 |
| Giáp | 34 | 4.2 | 105.4 |
| KP | 32 | 2 | 66 |
| Tốc đánh | 0.66 | +2% | 0.88 |
| Tốc chạy | 3.45 | | |
| Tầm đánh | 1.7 (cận chiến) | | |
- Bán kính 0.72. Vật lý.

### 3.2. Nội tại — Công Thủ
1. Giảm **6%** mọi sát thương nhận (nhánh 12b: mất).
2. Mỗi lần bị **tướng** đánh trúng → +1 tầng Phản Kích (tối đa 3; giữa hai lần tích tối thiểu 0.4s).
3. Đòn đánh thường kế tiếp: `+ (12 + 2 × cấp) × số_tầng` sát thương, rồi xóa tầng.
- **Roguelite:** mọi kẻ địch đều tích tầng; mỗi tầng `12 (+2 mỗi cấp) (+1.5% Máu tối đa)`.

### 3.3. S1 — Chém Vòng Cung
| Hồi chiêu | Mana | Thi triển | Vùng |
|---|---|---|---|
| 7 / 6.5 / 6 / 5.5 / 5s | 40 | 0.15s | nón R=3.0, c=0.42 (**130°**) |
- `D = [60/95/130/165/200] + 0.7 × SMVL` vật lý + chậm 20% 1s lên mọi kẻ trong nón.
- Nhánh 6a: thay bằng lướt 4 đv (tốc 16) húc mọi kẻ trên đường: D, đẩy 1.6 đv, chậm 20% 1s; hồi chiêu S1 +2s.
- **Roguelite:** `[60/95/130/165/200] (+40% SMVL cộng thêm) (+4% Máu tối đa)`.

### 3.4. S2 — Đâm Thẳng
| Hồi chiêu | Mana | Thi triển | Vùng |
|---|---|---|---|
| 9 / 8.5 / 8 / 7.5 / 7s | 50 | 0.2s | đường thẳng dài 5, rộng 1.2 |
- `[70/110/150/190/230] + 0.8 × SMVL` vật lý; với tướng cộng thêm **8% máu đã mất** của mục tiêu.
- **Roguelite:** `(+80% SMVL cộng thêm) (+8% Máu đã mất mục tiêu)` lên mọi kẻ địch (giới hạn với quái/boss theo GDD 6.6).

### 3.5. S3 — Khiên Chắn
| Hồi chiêu | Mana | Thi triển | Nhắm |
|---|---|---|---|
| 14 / 13 / 12 / 11 / 10s | 60 | **1.0s, đi được 35% tốc, không thể bị ngắt** | Hướng (tự quay vào tướng gần nhất trong 3.5 đv) |
- **Trong 1s vận:** giảm **60%** sát thương nhận; cộng dồn "đã chặn" = 60% lượng gốc.
  - Nhánh 1b: lần chặn đầu tiên giảm 1s hồi chiêu S1 và S2.
  - Nhánh 3a: phản 40% lượng gốc thành sát thương phép lên tướng tấn công.
- **Kết thúc — cú húc:** đường thẳng dài 2.8, rộng 2.2 (nhánh 3b: 4.2 × 4.4): `[50/80/110/140/170] + 0.5 × SMVL` vật lý + **choáng 0.75s** + **câm lặng 1s**.
  - Nhánh 6b: + 30% tổng "đã chặn" (chỉ lên tướng).
  - Nhánh 9c: đẩy 1.5 đv; đập tường → câm lặng 1.5s + `60 + 8 × cấp`.
  - Nhánh 12b: thay bằng lướt chém 4 đv (tốc 18), cùng hiệu ứng.
- **Roguelite:** cú húc `[50/80/110/140/170] (+30% Giáp cộng thêm) (+30% KP cộng thêm)`.

### 3.6. S4 — Chiến Thần Bất Tử
| Hồi chiêu | Mana | Nhắm |
|---|---|---|
| 110 / 95 / 80s | 100 | Tự thân |
- 4s: **máu không xuống dưới 1** (`undying`), +30% tốc chạy, +20% sát thương gây ra.
- AI web chỉ dùng khi < 40% máu và đang đánh tướng.
- **Roguelite:** hết 4s hồi `[20/25/30]%` tổng sát thương đã nhận trong 4s đó.

### 3.7. Chiêu phụ — Cuồng Phong
| Hồi chiêu | Mana | Vùng |
|---|---|---|
| 10s | 30 | tròn R=2.4 quanh mình |
- +45% tốc chạy 1.5s; `40 + 8 × cấp + 0.4 × SMVL` vật lý + chậm 30% 1.5s.
- Nhánh 12a: thêm vết nứt về phía tướng gần nhất trong 6 đv: đường dài 4.5 rộng 1.6, `40 + 10 × cấp`, hất tung 0.75s.

### 3.8. Cây tiến hóa
| Mốc | | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Trụ Vững | +10% Kháng hiệu ứng, +8 Giáp |
| 1 | b | Phản Xạ Binh Nghiệp | S3 chặn được đòn: −1s hồi chiêu S1, S2 (1 lần mỗi lần giơ khiên) |
| 1 | c | Xung Kích | +20% tốc chạy khi tiến về tướng địch trong 8 đv |
| 3 | a | Khiên Gai | Đang giơ khiên: phản 40% sát thương (phép) |
| 3 | b | Chấn Địa | Cú húc rộng 4.4, dài 4.2 |
| 3 | c | Giáp Bất Diệt | Đứng yên / ra đòn tại chỗ: −15% sát thương nhận |
| 6 | a | Khiên Húc Phá Trận | S1 thành lướt húc 4 đv (hồi chiêu +2s) |
| 6 | b | Khiên Phản Kích | Cú húc + 30% tổng đã chặn |
| 6 | c | Hộ Vệ Bất Bại | Đứng yên > 1s: bản thân và đồng minh trong 3 đv −15% sát thương nhận |
| 9 | a | Bất Khuất | Dưới 25% máu: lá chắn `150 + 20 × cấp` 2.5s + không thể cản 1s (hồi 45s) |
| 9 | b | Chiến Ý Hoàng Gia | Trong S4: đòn đánh choáng 0.5s (mỗi mục tiêu 1.5s/lần) |
| 9 | c | Áp Chế Tuyệt Đối | Cú húc đẩy 1.5 đv; đập tường: câm lặng 1.5s + `60 + 8 × cấp` |
| 12 | a | Địa Chấn Khiên Binh | Chiêu phụ thêm vết nứt hất tung 0.75s |
| 12 | b | Đấu Sĩ Trảm Sát | +25% tốc đánh, ×1.15 sát thương; mất 6% giảm của nội tại và 60% giảm của khiên; S3 thành lướt chém |
| 12 | c | Ý Chí Bất Diệt | Đòn chí tử: sống lại 1 máu, bất tử 1s (hồi 90s) |

### 3.9. Ghi chú Unity
- S3 là chiêu vận đầu tiên có `castWhileMoving = 0.35` và `uninterruptible` → kiểm tra `SkillCaster` hỗ trợ đủ.
- "Không chết" (`undying`): trong `DamageSystem`, sau khi trừ máu, nếu có trạng thái này thì `hp = max(hp, 1)`.

---

## 4. IGNATIUS — Pháp sư lửa

**Vai trò:** pháo binh, dọn quái diện rộng, tích tầng Hỏa Ấn để nổ dây chuyền.

### 4.1. Chỉ số
| | Cấp 1 | +/cấp | Cấp 18 |
|---|---|---|---|
| Máu (gốc) | 540 | 84 | 1968 |
| Máu roguelite (×1.5) | 810 | 126 | 2952 |
| Mana | 420 | 50 | 1270 |
| Hồi mana/s (×1.6) | 3.2 | 0.16 | 5.92 |
| SMVL | 52 | 3 | 103 |
| Giáp | 22 | 3.6 | 83.2 |
| KP | 30 | 1.4 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.79 |
| Tốc chạy | 3.35 | | |
| Tầm đánh | 5.5 | | |
- Bán kính 0.62. Đạn đánh thường: cầu lửa nhỏ, tốc 16. Đánh thường gây sát thương **phép** = 100% SMVL.
- **Vừa đi vừa niệm phép:** S1 và S4 không khóa chân; S2 đi được 50% tốc khi tích.

### 4.2. Nội tại — Hỏa Ấn & Bộc Phá Vô Tận
Cơ chế `burn(mục_tiêu, n)` — được gọi bởi đánh thường (n=1) và các chiêu:
1. Thêm `n` tầng Hỏa Ấn lên mục tiêu (**không giới hạn**). Thời gian tồn tại của ấn đặt lại `5 + 0.25 × cấp` giây mỗi lần nhận tầng mới.
2. Đặt lại thiêu đốt: **3s** (nhánh 9a: 6s), mỗi 0.5s, `dps = (7 + 2 × cấp + 0.5 × số_tầng)` sát thương phép mỗi giây (nhánh 1b: ×1.25). Thiêu không cộng dồn, chỉ thay mới với dps mới.
3. **Hỏa Bạo:** nếu số tầng vượt qua một bội số của 6 (6, 12, 18…) → nổ tròn R=2.5 tại mục tiêu: `60 + 18 × cấp + 0.6 × SMPT` phép lên mọi kẻ trong vùng (không kích hoạt hook); mục tiêu bị **−25% KP trong 4s**.
- Nhánh 6c: kẻ đang bị thiêu chậm 20%. Nhánh 12b (Pháp Sư Trọng Lực): thay toàn bộ thiêu bằng tầng Trọng Lực (tối đa 6, 5s): mỗi tầng +6% sát thương nhận và chậm 5%.
- **Roguelite:** dps `7 (+2 mỗi cấp) (+0.5 mỗi tầng) (+4% SMPT)`; Hỏa Bạo `(+60% SMPT) (+3% Máu tối đa mục tiêu)`.

### 4.3. S1 — Cầu Lửa
| Hồi chiêu | Mana | Thi triển | Nhắm | Tầm |
|---|---|---|---|---|
| 5.5 / 5 / 4.5 / 4 / 3.5s | 50 / 55 / 60 / 65 / 70 | 0.2s (vừa đi vừa niệm) | Điểm | 10 đv |
- Cầu lửa tốc 22 (nhánh 1a: 30), bán kính 0.5, bay tới điểm (tối đa 10 đv). **Nổ** khi trúng kẻ địch đầu tiên hoặc tới cuối đường.
- Nổ tròn R = `[1.8/2.0/2.2/2.2/2.6]`: `[65/100/135/170/205] + 0.6 × SMPT` phép + **2 tầng** Hỏa Ấn mỗi kẻ.
- Nhánh 6b: trong 0.6s bấm lại → nổ ngay tại chỗ cầu lửa đang bay.

### 4.4. S2 — Đại Hỏa Cầu
| Hồi chiêu | Mana | Thi triển | Nhắm |
|---|---|---|---|
| 10 / 9.5 / 9 / 8.5 / 8s | 70 / 75 / 80 / 85 / 90 | **Tích 0→2s**, đi 50% tốc | Điểm |
Gọi `c = min(1, thời_gian_tích / 2)` và `rk` = cấp chiêu:

| Đại lượng | Công thức |
|---|---|
| Tầm bay tối đa | `r0 + (r1 − r0) × c`, với r0 = `[10/12.5/15/17.5/20]`, r1 = `[20/27.5/35/42.5/50]` (bay tới điểm ngắm nếu gần hơn, tối thiểu 4) |
| Bán kính nổ R | `1.8 + ([3/4/5/6/8] − 1.8) × c` |
| Hệ số SMPT | `0.8 + 0.2 × min(1, 2c) + ([2/2.25/2.25/2.5/3] − 1) × c` → c=1 cho đúng 2 / 2.25 / 2.25 / 2.5 / 3 |
| Sát thương gốc | `[60/90/120/150/180] × (0.6 + 0.4 × c)` |
| Kích thước đạn | bán kính 0.6 + 0.6c, tốc 16 |
- Nổ khi trúng hoặc tới cuối: sát thương lên mọi kẻ trong R (×1.25 nếu mục tiêu < 30% máu) + 2 tầng Hỏa Ấn.
- Để lại **Biển Lửa** bán kính `max(1.8, 0.7R)` trong 4s: mỗi 0.5s `8 + 2 × cấp` phép; mỗi 1s thêm 1 tầng Hỏa Ấn.
- Nhánh 3c: đạn đốt mọi đạn địch bay qua. Nhánh 12a: tích ≥ 90% → hút kẻ trong 4 đv vào tâm (0.4s), cảnh báo 0.45s rồi mới nổ.
- **Roguelite:** hệ số SMPT cố định **100%** × (0.6 → 1.0 theo tích); thưởng thêm 0→30% sát thương theo % máu đã mất của mục tiêu (thay ngưỡng 30%). Tầm tối đa 20 đv (phòng roguelite nhỏ).

### 4.5. S3 — Dịch Chuyển
| Hồi chiêu (mỗi lượt) | Mana | Lượt tích trữ | Nhắm |
|---|---|---|---|
| 14 / 13 / 12 / 11 / 10s | 60 | 2 / 2 / 3 / 3 / 4 | Điểm (thoát thân) |
- Dịch chuyển tức thời tới điểm cách tối đa 5 đv (nhánh 1c: 6.5), không qua tường.
- Tại điểm đến: tròn R=2 `[40/60/80/100/120] + 0.3 × SMPT` phép, đẩy 1.5 đv, 1 tầng Hỏa Ấn. Ignatius +30% tốc chạy 1s.
- Nhánh 3b: 0.3s sau chỗ cũ nổ cùng sát thương. Nhánh 9c: hồi ngay S1.
- Cơ chế lượt: mỗi lượt hồi riêng theo hồi chiêu; dùng khi còn ≥ 1 lượt.

### 4.6. S4 — Thiên Thạch
| Hồi chiêu | Mana | Thi triển | Nhắm | Tầm |
|---|---|---|---|---|
| 110 / 90 / 70s | 100 | 0.25s (vừa đi) | Điểm | 20 đv |
- Cảnh báo tròn bán kính R = `[8/10/16]` (nhánh 9b: ×1.2) trong **1s**, sau đó nổ:
  - `[150/220/300] + [1.25/1.5/2] × SMPT` phép (×1.4 chiêu cuối);
  - hất tung `[0.75/1/1.5]s` (nhánh 9b: kẻ trong 2 đv ở tâm bị choáng 1.5s thay vì hất);
  - **6 tầng** Hỏa Ấn (luôn kích Hỏa Bạo).
- Biển dung nham bán kính 0.6R trong `[6/8/12]s`: mỗi 0.5s `[15/22.5/30]` phép.
- **Roguelite:** R = `[5/6/7]` (phòng nhỏ); `[150/220/300] (+90% SMPT) (+6/8/10% Máu tối đa mục tiêu)`.

### 4.7. Chiêu phụ — Vòng Lửa
| Hồi chiêu | Mana | Vùng |
|---|---|---|
| 12s | 40 | tròn R=3 quanh mình |
- `30 + 8 × cấp + 0.3 × SMPT` phép, 1 tầng Hỏa Ấn, đẩy văng `4 + 0.3 × cấp` đv trong 0.3s (nhánh 3a: + trói 0.75s).
- Nhánh 6a: dựng tường lửa dài 6 đv vuông góc, cách 1.6 đv về phía kẻ áp sát đầu tiên, 4s, chặn di chuyển; kẻ trong 1.4 đv quanh tường mỗi 0.5s nhận `10 + 3 × cấp` + 1 tầng.

### 4.8. Cây tiến hóa
| Mốc | | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Hỏa Tốc | S1 bay tốc 30 |
| 1 | b | Thiêu Rụi | Thiêu ×1.25 |
| 1 | c | Bộ Pháp Chớp Nhoáng | S3 dịch chuyển 6.5 đv |
| 3 | a | Biển Lửa Giam Cầm | Vòng Lửa trói 0.75s |
| 3 | b | Hư Ảnh Cháy Bùng | Chỗ cũ sau S3 nổ R=2 |
| 3 | c | Đại Hỏa Cầu Phá Đạn | S2 hủy đạn địch |
| 6 | a | Tường Lửa Chắn Lối | Vòng Lửa dựng tường lửa 6 đv, 4s |
| 6 | b | Kích Nổ Cầu Lửa | Bấm lại S1 trong 0.6s để nổ sớm |
| 6 | c | Hỏa Hồn Bùng Cháy | Kẻ bị thiêu chậm 20% |
| 9 | a | Hỏa Ngục Bất Diệt | Thiêu kéo dài 6s |
| 9 | b | Thiên Thạch Tận Thế | S4 rộng ×1.2; tâm 2 đv choáng 1.5s |
| 9 | c | Tia Lửa Ma Thuật | S3 hồi ngay S1 |
| 12 | a | Hố Đen Tro Tàn | S2 tích tối đa hút kẻ trong 4 đv rồi nổ |
| 12 | b | Pháp Sư Trọng Lực | Đổi thiêu thành tầng Trọng Lực (+6% sát thương nhận, chậm 5%/tầng, tối đa 6) |
| 12 | c | Phượng Hoàng Tái Sinh | Đòn chí tử: hóa trứng 2s (bất tử, bất động) rồi hồi 40% máu; 1 lần mỗi trận (roguelite: mỗi lượt chơi) |

### 4.9. Ghi chú Unity & kiểm thử
- `IgnatiusMarks`: một component trên **mục tiêu** giữ số tầng theo nguồn (`Dictionary<Unit, MarkState>`), có hàm `Add(n)` trả về số lần vượt bội số 6.
- **Kiểm thử Hỏa Bạo:** 5 tầng + S1 (2 tầng) → 7 tầng → vượt 6 → nổ 1 lần. 11 tầng + S4 (6 tầng) → 17 → vượt 12 → nổ 1 lần (không phải 2).
- Hỏa Bạo gây sát thương **không kích hoạt hook** → không tự gọi lại `burn` (tránh nổ vô hạn).

---

## 5. DEATH — Đấu sĩ phép, móc kéo & kết liễu

**Vai trò:** kéo mục tiêu vào, đánh bằng "lưỡi" liềm để hồi máu, kết liễu kẻ thấp máu. Đánh thường vật lý, chiêu phép → build lai.

### 5.1. Chỉ số
| | Cấp 1 | +/cấp | Cấp 18 |
|---|---|---|---|
| Máu (gốc) | 675 | 102 | 2409 |
| Máu roguelite (×1.5) | 1012.5 | 153 | 3613.5 |
| Mana | 360 | 42 | 1074 |
| Hồi mana/s (×1.6) | 2.88 | 0.144 | 5.33 |
| SMVL | 66 | 3.8 | 130.6 |
| Giáp | 32 | 4.1 | 101.7 |
| KP | 32 | 1.7 | 60.9 |
| Tốc đánh | 0.67 | +2.2% | 0.92 |
| Tốc chạy | 3.5 | | |
| Tầm đánh | 2.2 (cận chiến) | | |
- Bán kính 0.7. Đánh thường **vật lý**; mọi chiêu **phép**.

### 5.2. Nội tại — Lưỡi Hái Tử Thần
Mỗi đòn đánh thường lên mục tiêu chính:
1. **Lưỡi liềm (điểm ngọt):** nếu `khoảng_cách_tâm − r_mục_tiêu ≥ (tầm_đánh + r_Death) × 0.55` (nhánh 1a: × 0.4) → đòn ×1.15 và Death hồi `14 + 3 × cấp` máu.
   - ⚠ Mô tả web ghi "hồi 10 (+2/cấp)" — mã là **14 + 3 × cấp**.
2. **Vừa bị kéo:** nếu mục tiêu bị S1 kéo trong 2s qua → hất tung 0.5s (nhánh 3c: 0.8s và đòn ×1.4). Mỗi lần kéo chỉ dùng 1 lần.
3. **Quét vòng cung:** mọi kẻ địch **khác** trong nón R = `tầm + r + 0.4`, c=0.5 (**120°**) phía trước nhận **60%** sát thương đòn đó (vật lý).
   - ⚠ Mô tả web ghi "50%" — mã là **60%**.
- Nhánh 12b: đòn đánh lên tướng ở gap > 1 kéo nó 0.5 đv về phía Death.
- **Roguelite:** điểm ngọt hồi `14 (+3 mỗi cấp) (+3% Máu đã mất của Death)`.

### 5.3. S1 — Lưỡi Hái Đoạt Mệnh
| Hồi chiêu | Mana | Thi triển | Nhắm | Tầm |
|---|---|---|---|---|
| 14 / 13 / 12 / 11 / 10s | 60 / 65 / 70 / 75 / 80 | 0.2s | Hướng (đạn định hướng) | 7 đv (nhánh 12b: 9) |
- Quăng liềm tốc 18, bán kính 0.55, dừng ở kẻ địch **đầu tiên**.
- Trúng: `([60/95/130/165/200] + 0.5 × SMPT) × 1.15` phép (⚠ mã nhân thêm 1.15, mô tả không ghi) → kéo mục tiêu về sát Death (dừng cách 0.6 đv) trong 0.35s → đánh dấu "vừa bị kéo" 2s.
- Nhánh 3b: hết kéo → trói 0.75s.
- **Roguelite:** `[70/110/150/190/230] (+55% SMPT)` (gộp ×1.15 vào gốc cho rõ). Không kéo boss/tinh anh lớn — thay bằng **Death bị kéo tới** mục tiêu.

### 5.4. S2 — Phán Quyết
| Hồi chiêu | Mana | Thi triển | Nhắm |
|---|---|---|---|
| 9 / 8.5 / 8 / 7.5 / 7s | 50 | 0.2s | Hướng |
- Hai phần, **mỗi kẻ địch chỉ trúng 1 lần** cho cả hai:
  1. Nhát bổ: đường thẳng dài 3, rộng 1.6 trước mặt.
  2. Cầu hắc ám: đạn xuyên thấu tốc 16, bán kính 0.6, bay 7 đv (nhánh 12b: 9).
- Sát thương: `[80/125/170/215/260] + 0.65 × SMPT` phép; **×1.5 nếu mục tiêu < 30% máu** (nhánh 9a: < 45%).
- Nhánh 1c: hồi chiêu −1.5s (tối thiểu 0.5s). Nhánh 6a: thay bằng chữ X hình nón R=3.5, c=0.6 (106°), đẩy 1.5 đv; trúng tướng → hồi 8% máu đã mất; hồi chiêu +2s. Nhánh 12a: nhát bổ thành nón R=4.5, c=0.5 (120°); tướng < 15% máu trúng đòn bị **kết liễu** (sát thương = max(D, 3 × máu hiện tại)).
- **Roguelite:** `[80/125/170/215/260] (+65% SMPT) (+10% Máu đã mất mục tiêu)` thay cho ngưỡng ×1.5 (mượt hơn, vẫn là chiêu kết liễu).

### 5.5. S3 — Xoay Liềm
| Hồi chiêu | Mana | Nhắm | Tầm |
|---|---|---|---|
| 14 / 13 / 12 / 11 / 10s | 60 | Điểm | 6 đv |
- Thả liềm xoay tại điểm (không qua tường): vùng tròn R=2 trong **2s**, mỗi 0.5s (4 nhịp):
  - `[20/28/36/44/52]` phép **cố định** (bản web không có hệ số);
  - hút 0.6 đv về tâm trong 0.12s (nhánh 3a: 1.2 đv).
- **Bấm lại trong 2s** (nếu liềm còn): dịch chuyển tới liềm, chém tròn R=2.2: `[50/80/110/140/170] + 0.4 × SMPT` phép.
- Nhánh 6b: bấm lại thay bằng giật liềm về tay: đường thẳng từ liềm tới Death, rộng 1.6, sát thương như trên, kéo mọi kẻ trên đường về cách Death 1.2 đv; liềm biến mất.
- **Roguelite:** mỗi nhịp `[20/28/36/44/52] (+10% SMPT)`.

### 5.6. S4 — Gọi Hồn
| Hồi chiêu | Mana | Thi triển | Nhắm | Tầm |
|---|---|---|---|---|
| 120 / 100 / 80s | 100 | 0.2s | **Mục tiêu** (tướng) | 5 đv |
- Cần mục tiêu trong 5.5 đv.
- Ngay lập tức: `[100/150/200] + 0.5 × SMPT` phép (×1.4) + làm chậm 20% 5s + đánh dấu **5s**.
- Trong 5s, **mọi** sát thương Death gây lên mục tiêu (đánh thường, chiêu, thiêu…) được lặp lại sau 0.15s bằng **40%** lượng đó dưới dạng phép (nhánh 9b: 60%, hiệu ứng 3 bóng ma). Phần lặp không tự lặp tiếp.
- **Roguelite:** nhắm được mọi kẻ địch; `[100/150/200] (+50% SMPT)`.

### 5.7. Cây tiến hóa
| Mốc | | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Lưỡi Tử Thần | Điểm ngọt từ 40% tầm |
| 1 | b | Mùi Máu Tươi | +20% tốc chạy khi tiến về tướng < 50% máu trong 10 đv |
| 1 | c | Gặt Nhanh | S2 hồi chiêu −1.5s |
| 3 | a | Xoáy Hút Linh Hồn | S3 hút 1.2 đv/nhịp |
| 3 | b | Lưỡi Kéo Tàn Phế | S1 kéo xong trói 0.75s |
| 3 | c | Cắt Đứt Hy Vọng | Đòn đánh lên kẻ vừa bị kéo: hất 0.8s, ×1.4 |
| 6 | a | Lưỡi Trảm Đoạt Hồn | S2 thành chữ X hình nón, đẩy lùi, hồi 8% máu đã mất (hồi chiêu +2s) |
| 6 | b | Thu Hồi Lưỡi Hái | S3 bấm lại = giật liềm về, kéo kẻ trên đường |
| 6 | c | Hơi Thở Tử Thần | Kẻ địch trong 3 đv chậm 15% |
| 9 | a | Án Tử Tức Thì | S2 ×1.5 dưới 45% máu |
| 9 | b | Tam Vị Nhất Thể | S4 lặp 60% |
| 9 | c | Thu Hoạch Linh Hồn | Hạ tướng: hồi 15% máu tối đa + 40 mana |
| 12 | a | Trảm Quyết Diện Rộng | S2 nón 4.5 đv; tướng < 15% máu bị kết liễu |
| 12 | b | Sứ Giả Địa Ngục | +0.8 tầm đánh; S1, cầu S2 bay 9 đv; đòn đánh kéo nhẹ 0.5 đv |
| 12 | c | Hộ Thân Oan Hồn | Hạ tướng: +1 linh hồn (tối đa 3), mỗi linh hồn chặn trọn 1 đòn đánh hoặc chiêu |

### 5.8. Ghi chú Unity
- S4 cần hook `OnDealDamage` kiểm tra mục tiêu có dấu của chính Death → lên lịch sát thương lặp với `DamageTag.Shade` (bỏ qua khi tag = Shade).
- Roguelite: các nhánh "hạ gục tướng" (9c, 12c) đổi thành "hạ tinh anh hoặc boss, hoặc mỗi 10 quái thường".

---

## 6. VICTORIA — Hỗ trợ chỉ huy, triệu hồi lính

**Vai trò:** chỉ huy 3 Lính Tinh Nhuệ, đổi 3 thế đánh (Cờ / AR / Lục). Trong roguelite chơi đơn, lính là "đồng đội" giúp Victoria đứng được một mình.

### 6.1. Chỉ số
| | Cấp 1 | +/cấp | Cấp 18 |
|---|---|---|---|
| Máu (gốc) | 630 | 96 | 2262 |
| Máu roguelite (×1.5) | 945 | 144 | 3393 |
| Mana | 380 | 45 | 1145 |
| Hồi mana/s (×1.6) | 3.2 | 0.16 | 5.92 |
| SMVL | 60 | 3.6 | 121.2 |
| Giáp | 32 | 3.9 | 98.3 |
| KP | 30 | 1.5 | 55.5 |
| Tốc đánh | 0.62 | +1.5% | 0.78 |
| Tốc chạy | 3.35 | | |
| Tầm đánh | **Cờ: 2.4 cận chiến • AR / Lục: 5.0 tầm xa** | | |
- Bán kính 0.58. Đạn (thế AR/Lục): viên đạn tốc 24. Vật lý.

### 6.2. Nội tại — Quân Lệnh & Cờ Chiến

**Lính Tinh Nhuệ** — 3 lính (nhánh 9c: 4), xuất hiện khi bắt đầu, hồi sinh **từng con** sau 30s kể từ khi chết (nhánh 1a: 22s; nhánh 12a: 20s). Victoria hồi sinh thì hồi toàn bộ lính.

| Chỉ số lính | Công thức (k = 2 khi Thiết Binh, ngược lại 1; cmd = 1.6 với nhánh 12a) |
|---|---|
| Máu | `(165 + 27 × cấp) × k` |
| Giáp / KP | `16 + cấp` |
| Sát thương đòn đánh | `(10 + 2.1 × cấp + 0.1 × SMVL_Victoria) × k × cmd` |
| Tốc đánh | Cờ: 1.0 • khác: 0.8 |
| Tốc chạy | Tốc chạy Victoria × (Cờ: 1.25 • khác: 1.0) |
| Tầm | Cờ và mục tiêu ≤ 2.2 đv: cận chiến 2.2 • còn lại: bắn xa 4.0 (đạn tốc 22) |
| Bán kính | 0.42 (Thiết Binh: 0.6) |
- Chỉ số lính tính lại mỗi 1s theo cấp/chỉ số hiện tại của Victoria (giữ nguyên % máu).
- **AI lính** (mỗi 0.2s): đánh mục tiêu Victoria đang đánh; không có thì bảo vệ, theo sau Victoria (đội hình sau lưng 1.5 đv, lệch góc theo số thứ tự); xa Victoria quá 13 đv thì quay về.
  - Thế Cờ + mục tiêu của Victoria trong 8 đv: lính **vây** mục tiêu (đứng 1.8 đv quanh, các góc lệch 0 / +1.1 / −1.1 rad).
  - Thế Cờ: lính tự rút ngắn choáng / chậm / trói / câm lặng thêm 0.08s mỗi 0.2s (≈ hết nhanh hơn 40%).

**Hào quang** (mỗi 0.5s, **tướng** đồng minh trong 6 đv, gồm cả Victoria; bản web **không** áp cho lính — roguelite: áp cả lính):
| Thế | Hiệu ứng |
|---|---|
| 🚩 Cờ | +12% tốc chạy, +25% Kháng hiệu ứng |
| 🔥 AR | +5% sát thương gây ra (⚠ mô tả web ghi "+10%", mã là **5%**) |
| 🔫 Lục | +Giáp và +KP = `5 × (1 + 0.1 × cấp)` |
- Bắt đầu ở thế **Cờ**.
- **Roguelite:** máu lính `(165 + 27 × cấp) (+10% Máu tối đa Victoria)`; sát thương lính `10 (+2.1 mỗi cấp) (+15% SMVL cộng thêm Victoria)`; hào quang AR tăng lên 10% cho khớp mô tả.

### 6.3. S1 — Hỏa Lực Theo Dạng
| Hồi chiêu | Mana | Thi triển |
|---|---|---|
| 6 / 5.5 / 5 / 4.5 / 4s | 40 | 0.1s |
`D = [70/105/140/175/210] + 0.7 × SMVL`, vật lý.

| Thế | Hành vi |
|---|---|
| 🔫 Lục | 1 viên **đuổi** (tốc 30) vào mục tiêu đang ngắm: D. Nhánh 6b: thay bằng viên xuyên thấu bay 7 đv, mỗi kẻ trúng nhận D + dễ tổn thương 20% trong 3s |
| 🔥 AR | 5 viên trong 0.2s (cách 0.05s), lệch −0.3 → +0.3 rad (bước 0.15), tốc 30, bay 6, bán kính 0.35, dừng ở kẻ đầu: mỗi viên **0.32D** |
| 🚩 Cờ | Quét **vành khuyên** quanh mình từ 1.5 tới 3.5 đv (kẻ trong 1.5 đv không trúng): **0.8D** + chậm 30% 1.5s. Nhánh 9a: ×1.4, kẻ đang choáng ×2 |
- **Roguelite:** `[70/105/140/175/210] (+70% SMVL cộng thêm)`.

### 6.4. S2 — Thiết Lập Thế Trận
| Hồi chiêu | Mana | Thi triển |
|---|---|---|
| 12 / 11.5 / 11 / 10.5 / 10s | 60 | 0.1s |
`D = [60/90/120/150/180] + 0.5 × SMVL`, vật lý.

| Thế | Hành vi |
|---|---|
| 🔫 Lục | Lướt 3 đv tới hướng ngắm (tốc 18) + lá chắn `80 + 15 × cấp` 2s. Nhánh 6c: chỗ cũ để khói R=2.5, 2.5s, làm mù |
| 🔥 AR | Lựu đạn tại điểm (≤ 6 đv), nổ sau 0.4s, R=2: D + đẩy 1.5 đv ra khỏi tâm |
| 🚩 Cờ | Cắm cờ tại điểm (≤ 6 đv) ngay lập tức, R=2.5: D + đẩy 1.5 đv + **choáng 0.75s**. Tạo **Vùng Đất Quân Lệnh** R=3.5 trong 5s: đồng minh trong vùng +15% tốc đánh (nhánh 3c: + 20% giảm hồi chiêu). Nhánh 6a: trong 5s bấm lại để nhổ cờ, kéo kẻ địch trong 3.5 đv quanh cờ về phía Victoria (tối đa 3 đv, dừng cách 1.5) |
- **Roguelite:** D `(+50% SMVL cộng thêm)`; lá chắn Lục `80 (+15 mỗi cấp) (+8% Máu cộng thêm)`.

### 6.5. S3 — Tổng Lực Tác Chiến
| Hồi chiêu | Mana | Thi triển | Tầm |
|---|---|---|---|
| 16 / 15 / 14 / 13 / 12s | 70 | 0.15s | điểm ≤ 8 đv |
`D = [80/120/160/200/240] + 0.6 × SMVL`, vật lý.

| Thế | Hành vi |
|---|---|
| 🔫 Lục | Pháo điện từ: cảnh báo R=3 trong **2s** (nhánh 9b: 1s), rồi D + **choáng 1s** |
| 🔥 AR | Bão lửa R=3 trong 3s, mỗi 0.5s **0.2D** (tổng 6 nhịp = 1.2D). Nhánh 3a: + chậm 60% và cấm lướt |
| 🚩 Cờ | Mọi lính **xung phong** (lướt tốc 16) vào mục tiêu (đang ngắm, hoặc tướng gần nhất trong 8 đv): mỗi lính chạm → choáng 0.5s + **0.25D**; lính tập trung mục tiêu đó 3s |
- **Roguelite:** D `(+60% SMVL cộng thêm)`.

### 6.6. Chiêu phụ — Chuyển Đổi Quân Lệnh
| Hồi chiêu | Mana |
|---|---|
| **4s** | 0 |
- Xoay thế theo vòng **Cờ → AR → Lục → Cờ**, kèm hiệu ứng khi vào thế mới:
  - → AR: làm mù tướng gần nhất trong 7 đv 1s (nhánh 1c: 1.75s).
  - → Cờ: pháo kích vào vị trí tướng gần nhất trong 7 đv, nổ sau 0.6s R=2: `40 + 10 × cấp + 0.3 × SMVL`.
  - → Lục: lướt 2.5 đv + lá chắn `50 + 10 × cấp` 2s.
- **Roguelite:** thêm **chọn thế trực tiếp** (giữ phím phụ + Q/E/R) cho người chơi; bấm nhanh vẫn xoay vòng.

### 6.7. S4 — Mệnh Lệnh Tuyệt Đối
| Hồi chiêu | Mana |
|---|---|
| 120 / 100 / 80s | 100 |
- Hồi sinh toàn bộ lính đã chết; **8s Thiết Binh**: lính ×2 máu (hồi đầy) và ×2 sát thương, to hơn.
- Trong 8s, mỗi 2s: tên lửa đuổi (tốc 18) vào **tướng địch thấp % máu nhất** đang thấy trong 15 đv: `80 + 20 × cấp + 0.5 × SMVL` (×1.4 chiêu cuối).
- Nhánh 12b: khi dùng, laser quét nón R=7, c=0 (**180°**) phía trước: `[150/250/350] + 0.8 × SMVL`.
- **Roguelite:** tên lửa nhắm **mọi** kẻ địch (ưu tiên tinh anh / boss, rồi thấp máu nhất); `80 (+20 mỗi cấp) (+50% SMVL cộng thêm) (+4% Máu tối đa mục tiêu)`.

### 6.8. Cây tiến hóa
| Mốc | | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Tiếp Viện Khẩn Cấp | Lính hồi sinh 22s |
| 1 | b | Giáp Chống Bạo Động | Lính +30% Giáp và KP |
| 1 | c | Flash Cường Quang | Mù khi sang AR: 1.75s |
| 3 | a | Lưới Đạn AR | S3 (AR): chậm 60% + cấm lướt |
| 3 | b | Lá Chắn Thị Vệ | Đòn chí tử: lính gần nhất hy sinh, Victoria còn 1 máu + lá chắn `120 + 15 × cấp` 2s (hồi 45s) |
| 3 | c | Cờ Khải Hoàn | Vùng Đất Quân Lệnh + 20% giảm hồi chiêu |
| 6 | a | Thu Hồi Cờ Lệnh | S2 (Cờ): bấm lại nhổ cờ, kéo kẻ địch về |
| 6 | b | Đạn Phá Giáp | S1 (Lục): xuyên thấu + dễ tổn thương 20% 3s |
| 6 | c | Bọc Lót Chiến Thuật | S2 (Lục): để lại khói làm mù |
| 9 | a | Trận Địa Donut Tử Thần | S1 (Cờ) ×1.4, kẻ đang choáng ×2 |
| 9 | b | Pháo Điện Từ Xuyên Âm | S3 (Lục) rơi sau 1s |
| 9 | c | Quân Đội Thép | 4 lính |
| 12 | a | Bậc Thầy Chỉ Huy | Đòn đánh Victoria ×0.5; lính ×1.6 sát thương, hồi sinh 20s |
| 12 | b | Pháo Đài Di Động | S4 thêm laser 180° |
| 12 | c | Kỷ Luật Sắt | Hạ tướng: hồi sinh toàn bộ lính (roguelite: hạ tinh anh / boss) |

### 6.9. Ghi chú Unity
- Lính là `Unit` loại Pet có `IUnitController` riêng (`SoldierController`) — dùng lại API điều khiển chung.
- S1/S2/S3 là **một** `SkillDefinition` với 3 `SkillBehaviour` con chọn theo `VictoriaMode` → ô chiêu đổi biểu tượng theo thế.
- Sát thương lính tính là sát thương của Victoria (Owner = Victoria) để hook trang bị hoạt động — quyết định thiết kế cần chốt: bản web lính gây sát thương với chủ là lính.

---

## 7. ALICE — Sát thủ ảo ảnh

**Vai trò:** cấu rỉa bằng phi dao, đánh lừa bằng ảo ảnh, ám sát từ sau lưng. Thanh **Náo Nhiệt** quyết định sức mạnh chiêu.

### 7.1. Chỉ số
| | Cấp 1 | +/cấp | Cấp 18 |
|---|---|---|---|
| Máu (gốc) | 590 | 84 | 2018 |
| Máu roguelite (×1.5) | 885 | 126 | 3027 |
| Mana | 420 | 50 | 1270 |
| Hồi mana/s (×1.6) | 3.2 | 0.16 | 5.92 |
| SMVL | 52 | 3 | 103 |
| Giáp | 26 | 3.6 | 87.2 |
| KP | 30 | 1.4 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.79 |
| Tốc chạy | 3.5 | | |
| Tầm đánh | **8** | | |
- Bán kính 0.58. Đạn: lá bài, tốc 18. Đánh thường gây **phép** = `SMVL + 0.3 × SMPT`.

### 7.2. Náo Nhiệt (thanh tài nguyên riêng)
- Thang 0–**100** (nhánh 9b: 150; trong Vạn Biến: 200). Bắt đầu 0.
- **Tích:** +8 khi đánh thường hoặc chiêu trúng tướng (tối đa 1 lần mỗi 0.5s); +25 khi một ảo ảnh bị phá (nhánh 1a: 35). Nhánh 9b: mọi lượng tích ×1.3.
- **Tiêu:** S1 cường hóa −5, S2 cường hóa −10, S3 hoán đổi −`[50/40/40/40/20]` (cần ≥ 50). Chiêu **tự tiêu** nếu đủ (bản web không cho chọn).
- **Roguelite:** tích khi trúng **mọi** kẻ địch; cho người chơi **tắt cường hóa** bằng cách giữ Shift khi bấm (giữ Náo Nhiệt cho S3).

### 7.3. Ảo ảnh (hệ thống dùng chung)
- Ảo ảnh là bản sao của Alice: máu tối đa = **35%** máu tối đa Alice (nhánh 1c: ×1.5), máu hiện tại = máu tối đa ảo ảnh × max(0.3, %máu Alice); giáp/KP/tốc như Alice; **không gây sát thương** (nhánh 9c: 40% SMVL); tự đi về `runTo` nếu có.
- Giới hạn ảo ảnh "thường": **1** cùng lúc (nhánh 12a: 3) — tạo mới thì ảo ảnh cũ nhất biến mất. Ảo ảnh từ S3 hoán đổi và S4 **không** tính vào giới hạn.
- **Bị Lừa Rồi Nha!** — ảo ảnh chết (bị phá hoặc hết giờ) thì **nổ** tròn R=2.2 (Sân Khấu Cuối Cùng: 4.4): `40 + 8 × cấp + 0.3 × SMPT` phép × 1.4 (nhánh 3a) × 1.25 (Sân Khấu) × 1.3 (Vạn Biến); nhánh 3a hoặc Vạn Biến: choáng 0.5s (Vạn Biến: 0.75s). Mỗi lần nổ +25 Náo Nhiệt.
  - Nhánh 6c: kẻ cận chiến phá ảo ảnh ở gần (< 3 đv) bị đâm `50 + 8 × cấp + 0.3 × SMPT`. Nhánh 12c: nổ trúng tướng → −10s hồi chiêu S4.
- **Roguelite:** nổ `40 (+8 mỗi cấp) (+35% SMPT) (+1% mỗi 10 Náo Nhiệt)`. Quái AI phải **coi ảo ảnh là mục tiêu** (ưu tiên như Alice) thì cơ chế mới có ý nghĩa.

### 7.4. Nội tại — Thoát Hiểm Ảo Ảnh & Sân Khấu Cuối Cùng
Khi nhận đòn chí tử (hồi 180s; nhánh 9a: 120s):
1. Chặn cái chết, máu = 25% máu tối đa.
2. Tàng hình 1.5s (nhánh 9a: 3s + bất tử 1s).
3. **Làm mới mọi hồi chiêu** (S1–S4, phụ), +100 Náo Nhiệt.
4. 8s **Sân Khấu Cuối Cùng**: +`40 + 8 × cấp` SMPT, +30% tốc chạy; ảo ảnh nổ ×1.25 và rộng gấp đôi.
5. Lướt 3 đv ra xa tướng gần nhất trong 8 đv (không áp dụng khi người chơi điều khiển); tạo 1 ảo ảnh 3s tại chỗ.

### 7.5. S1 — Phi Dao Ảo Thuật
| Hồi chiêu | Mana | Thi triển | Nhắm |
|---|---|---|---|
| 5 / 4.75 / 4.5 / 4.25 / 4s | 45 / 50 / 55 / 60 / 65 | 0.12s | Hướng |
`D = [70/110/150/190/230] + 0.65 × SMPT`, phép. Nhánh 1b: tốc và tầm ×1.25.
- **Thường:** 1 phi dao tốc 20, bay 7 đv, bán kính 0.4, dừng ở kẻ đầu: D. Nhánh 6a: trúng → trong 1s bấm lại để dịch chuyển tới chỗ dao.
- **Cường hóa (−5 Náo Nhiệt):** `[8/10/12/14/20]` dao tỏa đều 360°, tốc 18, bay 5.5 đv: mỗi dao `D × [0.5/0.6/0.7/0.9/1.0]`.

### 7.6. S2 — Lướt Đâm
| Hồi chiêu | Mana | Nhắm |
|---|---|---|
| 9 / 8.5 / 8 / 7.5 / 7s | 50 | Hướng |
`D = [80/120/160/200/240] + 0.55 × SMPT`, phép.
- Lướt 4 đv (tốc 20), mọi kẻ chạm phải nhận D. **Sau lưng** (mục tiêu đang quay lưng: `Dot(hướng_mặt_mục_tiêu, mục_tiêu→Alice) < −0.2`) → ×2.
- **Cường hóa (−10 Náo Nhiệt):** sau lưng ×3 + choáng 1s; Alice tàng hình 1.5s (nhánh 3c: 2.5s); để lại ảo ảnh 6s tại chỗ xuất phát.
- Nhánh 6b: thay bằng đàn bồ câu hình nón R=4, c=0.5 (120°): 0.8D, hất tung 0.4s, câm lặng 1.25s.
- **Roguelite:** đâm sau lưng ×2 `(+8% Máu đã mất mục tiêu)`.

### 7.7. S3 — Ảo Ảnh Độc Lập
| Hồi chiêu | Mana | Nhắm |
|---|---|---|
| 16 / 15 / 14 / 13 / 12s | 60 | Tự thân |
- **Hoán đổi** (có tướng địch trong 10 đv **và** Náo Nhiệt ≥ 50): tiêu `[50/40/40/40/20]`, đổi chỗ với tướng đó, trói nó 0.6s; `[5/6/7/8/10]` ảo ảnh vòng tròn bán kính 2 quanh nạn nhân, sống `[5/6/8/8/10]s`, sau 2s mỗi ảo ảnh chạy ngẫu nhiên 5 đv; Alice tàng hình `[2/2.25/2.25/3/5]s`. Nhánh 3b: khói R=3 tại nạn nhân 2s, chậm 40%.
- **Thường:** ảo ảnh 10s tại chỗ, chạy về tướng địch gần nhất trong 12 đv (không có: về phía con trỏ 8 đv); Alice tàng hình 1.5s và lướt chéo ra sau 3 đv (tốc 16).
- Nhánh 12a: hồi chiêu S3 giảm một nửa mỗi lần dùng.
- **Roguelite:** hoán đổi với **tinh anh/boss không được** (chỉ quái thường và tướng AI) — boss thì chỉ thả vòng ảo ảnh quanh boss.

### 7.8. Chiêu phụ — Tẩu Thoát, Ohh!
| Hồi chiêu | Điều kiện |
|---|---|
| 12s (nhánh 12a: 3s) | Có ít nhất 1 ảo ảnh |
- Đổi chỗ với ảo ảnh **xa kẻ địch nhất** (đo theo tướng địch gần nhất trong 15 đv quanh mỗi ảo ảnh).

### 7.9. S4 — Rực Rỡ, Cùng Vui Nào! (3 biến thể)
| Hồi chiêu | Mana | Thi triển |
|---|---|---|
| 110 / 90 / 70s | 100 | 0.1s |

**Chọn biến thể** (theo thứ tự; người chơi có thể **chọn trước** trong bảng I):
1. Đã chọn trước Thoát Hiểm / Vạn Biến → dùng luôn. Đã chọn Mạo Hiểm và có mục tiêu → Mạo Hiểm.
2. Máu < 40% **và** có tướng địch trong 6 đv (trừ khi kẻ áp sát < 25% máu) → **Thoát Hiểm**.
3. Có "nạn nhân" = kẻ cận chiến áp sát < 3.2 đv, hoặc đang đứng trong vùng cảnh báo của địch, hoặc mục tiêu ngắm trong 6.5 đv — và (bị áp sát, hoặc **không phải** cảnh ≥ 2 chiêu đang hồi > 2s mà nạn nhân > 50% máu) → **Mạo Hiểm**.
4. Còn lại → **Vạn Biến**.

| Biến thể | Hiệu ứng |
|---|---|
| 🎭 **Thoát Hiểm** | Tàng hình 5s, +50% tốc chạy 5s, +`50 + 10 × cấp` SMPT 5s; 10 ảo ảnh (sống 4s) chạy tỏa ra 9 đv theo các hướng đều nhau |
| 🎁 **Mạo Hiểm** | `D = [150/250/350] + 0.7 × SMPT`. Phi dao lên nạn nhân: **0.4D** + đánh dấu 2s. Alice tự nhốt vào **Hộp Ảo Thuật** (đứng yên) 1.5s. **Bị tướng/pet đánh trong hộp:** đòn đó = 0, Alice đổi chỗ với kẻ đánh; 0.05s sau kẻ đánh nhận `min(2D, max(0.6D, 2 × sát_thương_vừa_bị_chặn))` + đẩy 2.5 đv + choáng 1s. **Không ai đánh:** hết 1.5s, nếu nạn nhân còn sống trong 12 đv → dịch chuyển ra sau lưng nó, **0.8D** + **choáng 3s**. Nhánh 12b: kết thúc hộp → choáng 1s mọi tướng trong 5 đv quanh nạn nhân |
| ✨ **Vạn Biến** | Thời lượng `[5/7/10]s`: Náo Nhiệt = 200 (trần 200), làm mới S1–S3 + phụ, +`50 + 10 × cấp` SMPT. Ảo ảnh nổ ×1.3 và choáng 0.75s. Mỗi 1s, mỗi ảo ảnh có tướng địch trong 7 đv: nếu < 4 đv và đã 4s từ lần trước → lướt đâm (`40 + 8 × cấp + 0.35 × SMPT`, ×2 sau lưng); ngược lại → phóng phi dao 7 đv cùng sát thương |
- Mọi sát thương của S4 ×1.4.
- **Roguelite:** Mạo Hiểm trả lại **200% sát thương vừa nhận** (tối đa 2D), hộp phản mọi đòn của quái/boss.

### 7.10. Cây tiến hóa
| Mốc | | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Khán Giả Cuồng Nhiệt | Ảo ảnh bị phá: +35 Náo Nhiệt |
| 1 | b | Phi Dao Sắc Lẹm | S1 nhanh và xa ×1.25 |
| 1 | c | Ảo Ảnh Bền Bỉ | Ảo ảnh ×1.5 máu |
| 3 | a | Bẫy Hoa Lửa | Ảo ảnh nổ ×1.4 + choáng 0.5s |
| 3 | b | Khói Ảo Thuật | S3 hoán đổi thả khói chậm 40% 2s |
| 3 | c | Vô Ảnh Thần Bộ | S2 cường hóa tàng hình 2.5s |
| 6 | a | Phi Dao Hoán Vị | S1 trúng: bấm lại trong 1s để dịch chuyển tới dao |
| 6 | b | Chim Bồ Câu Quấy Nhiễu | S2 thành nón bồ câu: 0.8D, hất 0.4s, câm lặng 1.25s |
| 6 | c | Ảo Ảnh Phản Kích | Kẻ cận chiến phá ảo ảnh bị đâm trả |
| 9 | a | Đại Ảo Thuật Gia | Thoát Hiểm Ảo Ảnh: tàng hình 3s, bất tử 1s, hồi 120s |
| 9 | b | Náo Nhiệt Vô Tận | Trần 150, tích ×1.3 |
| 9 | c | Ảo Ảnh Chân Thực | Ảo ảnh gây 40% sát thương |
| 12 | a | Bậc Thầy Phân Thân | 3 ảo ảnh cùng lúc, S3 hồi nhanh gấp đôi, phụ hồi 3s |
| 12 | b | Chiếc Hộp Biến Mất | Kết thúc Hộp: choáng 1s mọi tướng trong 5 đv quanh nạn nhân |
| 12 | c | Nụ Cười Gã Hề | Ảo ảnh nổ trúng tướng: −10s hồi chiêu S4 |

### 7.11. Ghi chú Unity
- Hiển thị trước **biến thể S4 sẽ ra** trên ô chiêu (hàm `variant` trả về tên + lý do) — bản web đã có, giữ nguyên.
- Tàng hình: kẻ địch mất mục tiêu; quái AI chuyển sang ảo ảnh gần nhất.

---

## 8. DIỆP THANH PHONG — Pháp sư điều khiển gió (3 dạng)

**Vai trò:** điều khiển, ru ngủ, đổi giữa tầm xa và cận chiến bằng **Thước Gió**. Tướng khó nhất trong 8 — làm cuối.

### 8.1. Chỉ số
| | Cấp 1 | +/cấp | Cấp 18 |
|---|---|---|---|
| Máu (gốc) | 560 | 88 | 2056 |
| Máu roguelite (×1.5) | 840 | 132 | 3084 |
| Mana | — (không dùng; dùng Thước Gió) | | |
| SMVL | 52 | 3 | 103 |
| Giáp | 24 | 3.6 | 85.2 |
| KP | 30 | 1.4 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.79 |
| Tốc chạy | 3.45 | | |
| Tầm đánh | **Thuận 4.8 • Bão Hòa 6.0 • Nghịch 1.8 (cận chiến)** | | |
- Bán kính 0.58. Đạn: lốc nhỏ, tốc 18. Đánh thường **phép** = `SMVL + 0.3 × SMPT`.

### 8.2. Thước Gió & 3 dạng
- Thước 0–100, bắt đầu **50**. **S1 kéo −17.5**, **S2 đẩy +17.5**; S3, S4, đánh thường không đổi.
- Dạng: **Thuận** khi ≤ 35 • **Bão Hòa** 36–64 • **Nghịch** ≥ 65. (Từ 50: 1 lần S1 → 32.5 Thuận; 1 lần S2 → 67.5 Nghịch.)
- **Luật đổi dạng của chiêu** (`shift`): nếu **trước** khi dùng đang ở dạng cực (Thuận/Nghịch) → chiêu dùng hiệu ứng của dạng **cũ**; nếu đang ở Bão Hòa → chiêu dùng hiệu ứng dạng **mới** sau khi đổi.
- Nhánh 12a (Tuyệt Ảnh Ám Sát): khóa vĩnh viễn ở Nghịch, mất chiêu phụ.

| Dạng | Hiệu ứng thường trực | Đánh thường |
|---|---|---|
| 🌀 **Thuận** (≤ 35) | +15% tốc chạy (nhánh 1a: 25%). **Giáp Phong Hộ:** chặn trọn (0 sát thương) 1 đòn của kẻ địch, mỗi 10s (nhánh 1c: 7s) | Tầm 4.8, làm chậm 20% 1s |
| 🌪 **Bão Hòa** (36–64) | **Gió Mê:** mỗi đòn đánh / chiêu trúng tướng thêm 1 tầng (4s, tối đa 3); đủ 3 → **ngủ 1s** (đòn đánh thức ×1.2), mỗi mục tiêu 1 lần / 8s. Nhánh 9c: không bị đẩy lùi, −15% sát thương nhận | Tầm 6.0. Mỗi 5s, đòn đánh kế tiếp phóng thêm **3 luồng lốc** (lệch −0.3/0/+0.3 rad, tốc 15, bay 6.5, xuyên thấu): mỗi luồng `25 + 8 × cấp + 0.35 × SMPT` + hất tung 0.5s |
| 🔥 **Nghịch** (≥ 65) | **+20% sát thương gây ra** (nhánh 1b: 30%). **Đột Kích** mỗi 5s: nếu mục tiêu đang đánh ở gap 1.4–5.5 đv → lướt tới (tốc 22) và gây `50 + 14 × cấp + 0.3 × SMVL + 0.7 × SMPT` phép | **Cận chiến** tầm 1.8. Nếu đã sát mục tiêu và Đột Kích sẵn sàng → đòn đánh cộng luôn lượng Đột Kích |

### 8.3. S1 — Toàn Phong Quy (gió −17.5)
| Hồi chiêu | Thi triển | Nhắm |
|---|---|---|
| 7 / 6.5 / 6 / 5.5 / 5s | 0.15s | Hướng |
`D = [60/95/130/165/200] + 0.6 × SMPT`, phép. Lốc xoáy **xuyên thấu** bay 7 đv:

| Dạng hiệu ứng | Hành vi |
|---|---|
| Thuận | Lốc lớn (bán kính 1.15, tốc 16), trúng: D (không hất). Cuối đường thành **Vực Xoáy** R=2.4 trong 1.5s (nhánh 3b: 2s): mỗi 0.25s trói 0.3s, hút 0.15 đv về tâm (3b: 0.3), gây **0.08D** (tổng ≈ 0.48D; 3b ≈ 0.64D) |
| Bão Hòa | Lướt 1.5 đv tới trước (tốc 16) rồi bắn lốc tốc 22.4, bán kính 0.8: D + hất tung 0.6s |
| Nghịch | Lốc tốc 16, bán kính 0.8: D + hất 0.6s; Thanh Phong lướt theo 6 đv (tốc 18). Tướng đầu tiên trúng: 0.15s sau, nếu trong 3 đv → chém bồi **0.5D**. Nhánh 9b: trúng tướng → hồi ngay S1 (6s/lần) |
- Nhánh 6b: thay bằng 5 luồng khí rẻ quạt (lệch −0.5 → +0.5 rad, bước 0.25), tốc 20, bay 6: mỗi luồng 0.6D + chậm 30% 1.5s (vẫn đổi gió).
- **Roguelite:** dạng Nghịch chém bồi `0.5D (+40% SMVL cộng thêm)`.

### 8.4. S2 — Bát Diện Phong Trận (gió +17.5)
| Hồi chiêu | Thi triển | Vùng |
|---|---|---|
| 10 / 9.5 / 9 / 8.5 / 8s | 0.1s | tròn R=3 quanh mình |
`D = [55/85/115/145/175] + 0.5 × SMPT`, phép. Mọi kẻ trong R=3 nhận D và bị đẩy ra xa:

| Dạng hiệu ứng | Hành vi |
|---|---|
| Thuận | Đẩy **4 đv** (0.35s). **Màng Chắn Gió** R=3 đi theo người 3s: phá mọi đạn địch bay vào (nhánh 3c: mỗi viên bị phá gây `40 + 8 × cấp` phép lên tướng bắn) |
| Bão Hòa | Lướt 1.5 đv về hướng ngắm trước. Đẩy 2.2 đv (0.25s); đập tường → choáng 1s; không đập tường → hết đẩy cũng choáng 1s |
| Nghịch | Đẩy 2.2 đv (0.2s). Tướng gần nhất trong 7 đv: phóng lưỡi gió (tốc 26, bay 7.5) **0.4D**; 0.25s sau dịch chuyển ra **sau lưng** nó (0.9 đv) và đâm **1.5D** (đánh dấu chí mạng). Nhánh 6a: trong 1.5s bấm lại → hất tung 0.75s mọi kẻ trong 2.5 đv |
- **Roguelite:** dạng Nghịch đâm `×(1.5 + 0.5 × Chí mạng)`.

### 8.5. S3 — Mê Tung Phong Vực (không đổi gió)
| Hồi chiêu | Thi triển |
|---|---|
| 15 / 14 / 13 / 12 / 11s | 0.05s |
`D = [50/80/110/140/170] + 0.5 × SMPT`, phép.

| Dạng | Hành vi |
|---|---|
| Thuận | Hút mọi kẻ trong R=5.6 về tâm (tối đa 3.5 đv, dừng cách tâm 0.8) trong 0.3s. Vùng gió độc R=5.6 trong **5s**: kẻ địch lần đầu vào vùng bị **mù 1.25s** (tướng: + **câm lặng 1.25s**). Nhánh 3a: kẻ đang mù mỗi 0.5s nhận `10 + 3 × cấp + 0.1 × SMPT`. Sau đó Thanh Phong lướt 2 đv về hướng ngắm |
| Bão Hòa | Tàng hình 1.5s, lướt 4 đv (tốc 16); điểm cuối để lốc R=2 trong 1.2s: mỗi kẻ (1 lần) hất tung 0.75s + **0.6D** |
| Nghịch | Đường thẳng dài 6, rộng 1.2 từ chỗ đứng: **0.6D**; lướt 6 đv (tốc 20); điểm cuối cảnh báo R=2.2 trong 0.35s rồi sét giáng **1.4D** |

### 8.6. Chiêu phụ — Nghịch Chuyển Canh Khí
| Hồi chiêu | Điều kiện |
|---|---|
| 12s | Không dùng được với nhánh 12a |
`D = 60 + 14 × cấp + 0.6 × SMPT`, phép. Sau khi dùng: **làm mới S1, S2, S3**. Nhánh 6c: hồi 8% máu tối đa.

| Dạng lúc dùng | Hành vi |
|---|---|
| Thuận → Nghịch | Cảnh báo R=2 tại tướng gần nhất trong 8 đv (không có: 3 đv trước mặt) 0.3s → D + hất 0.5s; lướt 3 đv về phía đó; **gió = 100 − gió** |
| Bão Hòa | **Thanh tẩy** mọi khống chế; R=3 quanh mình: đẩy 2 đv + 0.5D (gió giữ nguyên) |
| Nghịch → Thuận | Lướt 4 đv ra xa tướng gần nhất trong 8 đv; nếu có tướng: ném lốc về phía nó (tốc 16, bay 8) 0.6D + hất 0.75s; **lá chắn 15% máu tối đa** 3s; **gió = 100 − gió** |
- **Roguelite:** lá chắn `80 (+10 mỗi cấp) (+50% SMPT) (+5% Máu tối đa)` (thay 15% máu tối đa — tránh quá trâu khi máu cao).

### 8.7. S4 — Cơn Gió Đưa Giấc
| Hồi chiêu | Thi triển | Nhắm | Vùng |
|---|---|---|---|
| 120 / 100 / 80s | 0.2s | Điểm ≤ 9 đv | tròn R=4.5, 5s |
- Mỗi 0.25s, mọi kẻ địch trong vùng: chậm 50% (0.4s, làm mới liên tục).
- Tướng: cộng dồn thời gian đứng trong vùng (ra khỏi vùng thì về 0); đủ **2s** → **ngủ 1.5s** (nhánh 9a: 2.5s), đòn đánh thức ×**1.5** (9a: ×2); mỗi tướng ngủ tối đa 1 lần mỗi lần dùng chiêu.
- Tướng trong vùng mỗi 1s nhận `[25/40/55] + 0.15 × SMPT` phép (×1.4).
- Nhánh 12b: khi dùng, kẻ dưới 60% máu trong 2 đv ở tâm bị hất tung 1.5s. Nhánh 12c: hạ tướng vừa ngủ trong 3s → hồi chiêu S4 còn một nửa.
- **Roguelite:** ngủ áp lên **mọi kẻ địch** (boss: trừ Kiên Định); đòn đánh thức `×1.5 (+4% Máu tối đa mục tiêu)`.

### 8.8. Cây tiến hóa
| Mốc | | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Khí Lưu Thuận Chiều | Thuận +25% tốc chạy |
| 1 | b | Cắt Gió Tàn Bạo | Nghịch +30% sát thương |
| 1 | c | Phong Hộ Tái Sinh | Giáp Phong Hộ hồi 7s |
| 3 | a | Phong Độc Hôn Mê | Vùng S3 (Thuận) gây sát thương lên kẻ đang mù |
| 3 | b | Kình Phong Xuyên Thấu | Vực Xoáy S1 hút gấp đôi, giữ 2s |
| 3 | c | Bão Thuẫn Phản Hồi | Màng chắn S2 phản `40 + 8 × cấp` mỗi viên đạn |
| 6 | a | Lốc Xoáy Kép | Sau đâm sau lưng S2, bấm lại trong 1.5s: hất 0.75s quanh mình |
| 6 | b | Phiến Khí Bát Đoạn | S1 thành 5 luồng khí rẻ quạt |
| 6 | c | Hơi Thở Của Gió | Chiêu phụ hồi 8% máu tối đa |
| 9 | a | Giấc Mộng Không Đáy | S4 ngủ 2.5s, đánh thức ×2 |
| 9 | b | Lướt Gió Vô Hạn | S1 Nghịch trúng tướng: hồi ngay (6s/lần) |
| 9 | c | Tâm Bão Bất Khả Xâm Phạm | Bão Hòa: miễn đẩy lùi, −15% sát thương nhận |
| 12 | a | Tuyệt Ảnh Ám Sát | Khóa Nghịch vĩnh viễn, mất chiêu phụ |
| 12 | b | Long Quyển Phong Bạo | S4 thêm vòi rồng tâm: hất 1.5s kẻ < 60% máu |
| 12 | c | Lời Ru Vĩnh Cửu | Hạ tướng vừa ngủ (3s): S4 hồi còn một nửa |

### 8.9. Ghi chú Unity & kiểm thử
- Đổi dạng phải đổi **tầm đánh, cận/xa, hình đạn, hiệu ứng aura** ngay trong khung hình đó; UI hiện thước gió có 3 vùng màu và ô chiêu đổi mô tả theo **dạng hiệu ứng sẽ dùng** (áp luật `shift`).
- **Kiểm thử luật shift:** gió 50 (Bão Hòa) → S2 → gió 67.5 → hiệu ứng **Nghịch** (đâm sau lưng ngay). Gió 70 (Nghịch) → S1 → gió 52.5 → hiệu ứng vẫn **Nghịch** (lướt theo lốc).

---

## 9. Bảng tổng hợp hệ số roguelite của 8 tướng

| Tướng | Nguồn hệ số chính | Lối build gợi ý |
|---|---|---|
| Elara | SMVL tổng, SMVL cộng thêm, Chí mạng, Máu đã mất mục tiêu | Chí mạng + tốc đánh / Công dồn S2–S4 |
| Borg | SMVL cộng thêm, Máu cộng thêm, Sát thương hấp thụ | Trâu đấm (máu) / Đấm dồn (công) |
| Valerius | Máu tối đa, Giáp/KP cộng thêm, Máu đã mất mục tiêu | Tường thành (giáp) / Đấu sĩ trảm sát (nhánh 12b + công) |
| Ignatius | SMPT, Tầng Hỏa Ấn, Máu tối đa mục tiêu | Pháo binh dồn phép / Thiêu đốt tầng |
| Death | SMPT, Máu đã mất mục tiêu, hồi máu điểm ngọt | Kết liễu phép / Đấu sĩ hút máu (đánh thường) |
| Victoria | SMVL cộng thêm, Máu tối đa (lính), Máu tối đa mục tiêu (S4) | Chỉ huy lính / Tự bắn (thế Lục) |
| Alice | SMPT, Náo Nhiệt, Máu đã mất mục tiêu | Phi dao cấu rỉa / Ám sát sau lưng / Ảo ảnh nổ |
| Thanh Phong | SMPT, SMVL cộng thêm (Nghịch), Chí mạng (Nghịch), Máu tối đa | Pháp sư khống chế (Thuận/Bão) / Sát thủ lai (Nghịch) |

Death và Victoria chưa có trong GDD 6.7 — bảng hệ số của hai tướng nằm ở mục 5 và 6 tài liệu này.
