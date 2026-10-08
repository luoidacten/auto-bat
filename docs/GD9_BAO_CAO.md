# GĐ9 — Súng & nạp đạn, mảnh hồn Tầm Nhìn / Tầm Đánh / Nạp Đạn / Tốc Đánh, thính giác & truy vết, 3 lối build, trao đổi & bịp trong liên minh

Yêu cầu (tóm tắt):
- Nhánh mảnh hồn **Tầm Nhìn & Kiểm Soát** (12) và **Tầm Đánh** (8), AI dùng chúng (tầm nhìn × (1 + %), Nhiệt Ảnh kết liễu, Tiên Tri Vòng Bo, thả diều xa hơn).
- **Đạn & nạp đạn** như bản Legacy; thời gian nạp = gốc / (1 + tốc đánh + tốc nạp); khóa nạp bỏ qua tốc đánh. 19 mảnh Nạp Đạn (dùng 3 bản chuẩn hóa P_RL_02 / G_RL_04 / R_RL_02) + 10 mảnh Tốc Đánh.
- Aria & Oktava theo Legacy; Gideon đại trường kiếm; Raven bắn tỉa + Oca; Wukong chọn chỗ đáp.
- Xem cây kỹ năng đã nâng; AI truy vết khi mất dấu; thính giác; mỗi tướng 3 lối build + mảnh hồn yêu thích.
- (Tin nhắn sau) đổi mảnh hồn mới thì mảnh cũ **văng ra**; tính cách **Cầu Toàn** (giống bộ yêu thích nhất có thể) và **Bình Thường**; AI **trao đổi** khi liên minh và **bịp nhau** nếu là liên minh tạm.

## 1. Đã làm gì

### Súng, đạn & nạp đạn (`_common.js`, `zero/clint/jack/chrononeo/raven.js`)
- 5 tướng súng có băng đạn và nạp đạn: Clint 2 viên (nạp từng viên), Zero 9, Chrono & Neo 10 (+4 dạng phụ), Jack 6, Raven 30 (súng trường) + băng súng ngắm.
- Công thức chung `H.rlTime`: T = T_gốc / (1 + tốc đánh cộng thêm + Tốc Nạp). "Khóa nạp" chỉ tính Tốc Nạp.
- Móc `onReloadStart` / `onReload` cho mảnh hồn; thẻ tướng hiện 🔫 đạn, đang nạp, Tốc Nạp.

### 49 mảnh hồn mới (`src/data/shards.js` — tổng 159 mảnh)
- Tầm Nhìn & Kiểm Soát 12 (P_VIS_01–04, G_VIS_01–04, R_VIS_01–03, RAD_VIS_01), Tầm Đánh 8 (G_RNG_01–04, R_RNG_01–03, RAD_RNG_01), Nạp Đạn 19 (P_RL_01–06, G_RL_01–06, R_RL_01–05, RAD_RL_01–02 chỉ từ boss), Tốc Đánh 10.
- Mảnh không hợp tướng (nạp đạn cho tướng không súng, tầm bắn cho cận chiến…) ra ít hơn (×0.3) và ít được gắn.
- Tầm nhìn riêng từng tướng ("thấy riêng" một đối thủ vài giây), không sương, Nguyệt Thực, miễn mù; đạn xuyên vật cản mềm; dây móc xa / nhanh hơn; bẫy không dính.

### Tướng
- **Aria & Oktava** theo Legacy: nốt nhạc dùng chung hồi chiêu, đủ "bài hát" mới mở chiêu cuối (mê hoặc theo đường, Oktava bất tử 6s); Oktava nhảy bổ vào kẻ địch gần nhất (đẩy lùi); cưỡi Oktava; hiệu ứng đánh của Oktava và quái nhỏ.
- **Gideon**: Đại Trường Kiếm — tầm 2.7, tốc đánh cố định, tốc đánh cộng thêm đổi thành % sát thương.
- **Raven**: quạ Oca bay xa (≤ 60 đv) tự tìm con mồi máu thấp; còn Oca thì ống ngắm bắn tới 45 đv (Oca thấy là bắn), bắn liên tục tới khi Oca bị hạ; thả diều bằng súng trường; mục tiêu ngoài tầm ngắm thì dời chỗ.
- **Wukong**: chống gậy (S3) hiện vùng đáp; 0.3s trước khi đáp chọn điểm đáp trong vùng (đón đầu theo hướng chạy).

### AI: thính giác & truy vết (`utility.js`, `hero_ai.js`)
- Nghe tiếng giao tranh 30 đv, tiếng lướt 18 đv, bước chân ngoài bụi 9 đv (× theo Đọc Bản Đồ); nhớ vị trí có sai số.
- Mất dấu mục tiêu → **truy vết** tới chỗ cuối + ngoại suy theo vận tốc (đo: ~11 lần / trận).

### 3 lối build & mảnh hồn yêu thích (`src/data/builds.js` — mới)
- 14 khuôn build (Chí Mạng, Tốc Đánh, Xuyên Giáp, Đấu Sĩ, Đỡ Đòn, Dồn Phép, Pháp Sư Trâu, Hồi Chiêu, Bảo Hộ, Hộ Vệ, Đơn Đấu, Xạ Thủ Súng, Sát Thủ, Đấu Sĩ Phép).
- Mỗi tướng 3 lối build (chọn theo hạt giống 45/33/22%) + 3 mảnh hồn yêu thích. Lối build quyết định thứ tự mua đồ và chỉ số mảnh hồn ưu tiên (+0.3); mảnh yêu thích +0.6, AI đi nhặt mảnh yêu thích dù xa hơn.

### Mảnh hồn văng ra khi bị thay (`extras.js`)
- Mảnh dùng được (bậc ≤ Ý Niệm) mà không còn ô → **văng ra đất** cạnh tướng; người khác nhặt được, chính người văng không nhặt lại. Mảnh mới kém hơn mọi mảnh đang gắn → văng ngay.
- Chỉ mảnh **bậc cao hơn Ý Niệm** được cất túi chờ đúc vũ khí. Chỉ nhặt khi nhặt vào sẽ được gắn / cất.

### Tính cách mới (`personality.js`, `persona.js`, `items.js`)
- 📐 **Cầu Toàn**: luôn lối build số 1, không đổi món theo đối thủ; mảnh yêu thích +2.5, hợp build +0.9, lạc bộ ×0.6; săn mảnh yêu thích trên đất; độ hăng ×(0.8 + 0.45 × mức hoàn thiện bộ). **Zero** chuyển từ Tham Farm sang Cầu Toàn (Tham Farm trước đây có 2 tướng).
- 🙂 **Bình Thường**: không luật riêng — mặc định cho tướng chưa khai báo tính cách (dành cho tướng mới GĐ10).

### Trao đổi & bịp trong liên minh (`persona.js`)
- **Trao đổi** (mọi liên minh): đổi mảnh lấy mảnh khi cả hai cùng lợi, đổi món balo thừa / thiếu, **mua bán bằng vàng** (mảnh gần như vô dụng với người bán: 40 × bậc² vàng; bình thừa: giá gốc). Ở xa mà có món đáng đổi → hẹn gặp ("🔄 Lại đây đổi đồ").
- **Bịp** (chỉ liên minh tạm): **đổi gian** (rao hàng xịn, lấy mảnh tốt của bạn) và **tin giả** ("📣 Bên kia có rương ngon!" — chỉ bạn đi xa 42 đv để một mình ôm của). Nhìn thấu theo Tâm Lý + Đọc Bản Đồ (5–75%); bị lừa thì sau đó **vỡ lẽ** → thù, cắt liên minh. Liên minh lâu dài (người của nhà cái — GĐ9b) luôn đổi thật.

### Giao diện (`hud.js`, `game.css`)
- Thẻ tướng: 🧭 lối build (món đã có ✔), ❤ mảnh yêu thích, 🌳 **cây kỹ năng đã nâng** (chạm để mở: mốc 1/3/6/9/12, nhánh đã mở ✅ / đã chọn nhưng chưa đủ cấp 🔒, mốc thêm 15/18 ✨).
- Dòng sự kiện: 🔄 trao đổi, 💰 mua bán, 🃏 bịp, 🤨 nhìn thấu, 😤 vỡ lẽ, 💠 mảnh văng ra.

## 2. Đo đạc

- **24 trận** (`docs/GD9_MO_PHONG.txt`): 0 trận văng, 0 lỗi kích hoạt; trung bình 36.4 phút (trung vị 35.0, 23–48); 17.3 hạ gục / trận; giao tranh "chết" giữa 23s (90%: 100s); boss bị hạ 5.0 / trận; thính lấy 4.2 / 6.
- **Tất định**: hai lần chạy cùng hạt giống ra cùng mã băm `d5cc0944` ✔.
- Kiểm tra riêng: 49 mảnh mới trong 5 trận ép gắn — 0 lỗi; Raven 10–55 phát bắn tỉa / trận, xa nhất ~31 đv; Aria dùng chiêu cuối 2–4 lần / trận; truy vết ~11 lần / trận.
- Trao đổi & bịp (4 trận, ép có Zero): 2–6 liên minh / trận, 0–2 lần trao đổi / mua bán, 0–1 lần bịp (bị nhìn thấu / vỡ lẽ có xảy ra), 4–28 mảnh văng ra / trận. Zero (Cầu Toàn) vô địch 1/4 trận.
- Tướng (24 trận, mẫu nhỏ): Ryoma vô địch 56% (9 trận), Florian 42%; Aria / Lyra hạng trung bình 2.5–2.7 (sống dai, ít mạng); Borg / Valerius đáy bảng.

## 3. Chưa xong

- **Nhà cái & đặt cược** (vòng chơi chính) chưa có — làm ngay ở **GĐ9b**.
- Ryoma vẫn quá mạnh (56% vô địch). Đề xuất giảm 10% sát thương S4 và 5% máu mỗi cấp vẫn **chờ đồng ý**.
- Trao đổi / bịp hiếm (liên minh thường lập lúc đầu trận khi chưa ai có mảnh hồn) — liên minh lâu dài của người nhà cái ở GĐ9b sẽ có thêm.
- Kền kền 6% số mạng (mục tiêu 20–30%).

## 4. Con số khởi điểm mới

- Nạp đạn: T = T_gốc / (1 + tốc đánh cộng thêm + Tốc Nạp); băng đạn ×(1 + % băng đạn).
- Thính giác 30 / 18 / 9 đv; sai số nhớ 3 × (1 − Đọc Bản Đồ).
- Lối build 45 / 33 / 22%; mảnh yêu thích +0.6 (Cầu Toàn +2.5), hợp build +0.3 (+0.9).
- Trao đổi mỗi 18s khi ≤ 10 đv, hẹn gặp ≤ 80 đv; giá mảnh 40 × bậc²; xác suất bịp mỗi lần = độ ưa bịp × 0.5 (đổi gian) / × 0.35 mỗi 8s (tin giả).
- 1 m ≈ 0.4 đv khi đổi số từ bảng yêu cầu (tầm bắn, tầm nhìn).
