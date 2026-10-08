# GĐ7 — Nhân vật cố định, Ý niệm / Mảnh hồn, Balo & rương, Bản đồ sinh theo biome, 26 tính cách

Yêu cầu chính:
- Bỏ hẳn tuyển thủ; tính cách cố định theo từng tướng.
- Sửa lại khái niệm: **Ý niệm** là cấp vũ khí (đổi màu), **Mảnh hồn** tăng chỉ số và buff.
- Thêm balo cấp 1–5 đựng vật phẩm dùng 1 lần: bình, các phép bổ trợ cũ, dây móc, phù mới.
- Thêm công trình lớn, địa hình có độ cao, đặc điểm riêng từng biome.
- Bản đồ sinh ngẫu nhiên theo biome, "đừng để lỗi hay quá hỗn loạn".
- Thêm 20 tính cách mới.

## 1. Đã làm gì

### Nhân vật cố định (`src/sim/lineup.js`)
- Không còn người triệu gọi. Mỗi tướng là một nhân vật với tên tướng và thành thạo 80.
- 8 chỉ số bản lĩnh = nền 13, cộng/trừ theo tính cách. Ví dụ: Võ Sĩ Danh Dự Giao Tranh +3, Kỷ Luật +3; Chuột Lũi Đọc Bản Đồ +4, Giao Tranh −3.

### Ý niệm & Mảnh hồn tách đôi (`src/sim/extras.js`)
- **Ý niệm = cấp vũ khí**:
  - 5 cấp Trắng → Xanh → Tím → Vàng → Đỏ; vũ khí đổi màu theo cấp; mỗi cấp +5% sát thương.
  - Cách lên cấp: đúc ở Thương Nhân (350 / 700 / 1200 / 1900 / 2800 vàng); thính cho Vàng (cuối trận có thể Đỏ); boss hoặc thắng quyết đấu +1; rương 8% +1.
- **Mảnh hồn = chỉ số & hiệu ứng**:
  - 8 loại × 5 bậc: Sức Mạnh, Sinh Lực, Tốc Độ, Hồi Chiêu, Hút Máu, Hộ Thể, Tốc Đánh, Kiên Định.
  - Mang tối đa 6 mảnh. Bị hạ vẫn rơi toàn bộ mảnh hồn như GĐ6d.

### Balo, vật phẩm dùng 1 lần, rương đồ (`src/data/consumables.js`, `src/sim/bag.js`)
- **Balo**:
  - Cấp 1–5, số ô 3 / 4 / 5 / 6 / 8. Nâng ở Thương Nhân 250 / 500 / 900 / 1400 vàng; rương có 15% nâng miễn phí.
  - Mỗi ô chứa một loại, xếp chồng được.
- **18 vật phẩm**:

  | Nhóm | Vật phẩm |
  |---|---|
  | Bình | Bình máu, bình mana (bình giờ nằm trong balo) |
  | Phép bổ trợ cũ, nay dùng 1 lần | Tốc Biến, Tốc Hành, Hồi Máu, Lá Chắn, Thiêu Đốt, Kiệt Sức, Thanh Tẩy, Trừng Trị, Dịch Chuyển |
  | Dụng cụ mới | 🪝 Dây Móc (đu qua vách / lên chỗ cao), 🪤 Bẫy Kẹp, 💣 Bom Tự Chế |
  | Phù mới | 📜 Kháng Độc (bớt 65% sát thương bo), 🧿 Hộ Mệnh (đòn chí mạng chỉ để 1 máu), 🌫 Ẩn Thân, 🌪 Thần Tốc |

- **AI dùng vật phẩm theo tình huống**:
  - Bị khống chế cứng → Thanh Tẩy.
  - Đứng ngoài bo → phù Kháng Độc.
  - Bị bám khi chạy → Dây Móc / Tốc Biến / Ẩn Thân.
  - Kết liễu → Thiêu Đốt / Trừng Trị.
  - Đối thủ đang bị khống chế → ném bom.
  - Cướp boss → Trừng Trị.
  - Bị đuổi → đặt bẫy dưới chân.
- **Mua sắm**: AI mua theo "balo mong muốn" của tính cách.
- **Rương đồ**:
  - Mỗi vùng có 3 rương, thêm 1 rương trong mỗi nhà / đền / cao nguyên. Cứ 150 giây có thêm 3 rương trong bo.
  - Mở mất 1.5 giây, bị đánh thì hỏng.
  - Bên trong: 2 vật phẩm, 60 vàng, đôi khi được nâng balo hoặc ý niệm.

### Bản đồ sinh theo hạt giống (`src/sim/map.js`, `src/sim/nav.js`, `src/sim/props.js`)
- **Khung cố định** để công bằng: ổ boss, vách ranh giới, 45 bãi quái, 5 Thương Nhân, 10 điểm xuất phát, bụi gốc.
- **5 vùng ngoài** lấy ngẫu nhiên 5 trong 6 biome, xáo thứ tự. Biome mới: 🏜 **Sa Mạc Cát**.

  | Biome | Đặc điểm riêng |
  |---|---|
  | 🐸 Đầm Lầy | Sương mù (tầm nhìn −20%), vũng bùn làm chậm, cầu gỗ |
  | ⛰ Núi Đá Đỏ | Nhiều cao nguyên, hẻm núi, thùng thuốc nổ |
  | 🌾 Đồng Cỏ | Nhà, cối xay gió, ụ rơm |
  | ❄ Tuyết Sơn | Mặt băng trơn (chạy nhanh hơn 20%) |
  | 🏜 Sa Mạc | Cát lún làm chậm, đền cổ, xương rồng |
  | 🌲 Rừng Thông | Thân cây đổ, bụi rậm, nhà gỗ |

- **Công trình**: mỗi vùng 6–8, Phế Tích thêm 3–4. Gồm: nhà (cửa 1–2 phía), đền đổ, cao nguyên, tháp canh, cầu qua suối, hẻm núi, ao, cụm thùng nổ, cối xay, xương rồng.
- **Độ cao**:
  - Lên bằng dốc hoặc dây móc.
  - Đứng trên cao: tầm nhìn ×1.25, đánh xuống +10%.
  - Người dưới thấp chỉ thấy người trên cao khi trong 7 đv.
- **Thùng thuốc nổ**:
  - Kích nổ khi trúng đạn, dính chiêu diện rộng, hoặc bị đánh trực tiếp.
  - Cháy ngòi 0.45 giây rồi nổ bán kính 3.2 đv: tướng mất 20% máu tối đa và bị hất văng; nổ dây chuyền sang thùng bên cạnh.
- **Tường thấp** (nước, thân cây, mép cao nguyên): chặn đi lại nhưng đạn bay qua được.
- **Chống lỗi và chống hỗn loạn**:
  - Công trình phải cách điểm xuất phát / bãi quái / Thương Nhân / nhau một khoảng tối thiểu.
  - Loang lưới để chắc mọi chỗ đều đi tới được: trong nhà, trên cao nguyên, điểm xuất phát.
  - Lưới tìm đường phải liên thông.
  - Hỏng thì thử hạt giống phụ, tối đa 6 lần; vẫn hỏng thì dùng bản đồ cổ điển.
- **Cùng hạt giống → cùng bản đồ**. Màn dàn tướng hiện 5 biome và số công trình của trận.

### 26 tính cách (`src/data/personality.js`, `src/sim/ai/persona.js`)
- 27 tướng / 26 tính cách: Tham Farm có 2 tướng (Chrono & Neo, Zero).
- 6 tính cách cũ giữ nguyên hành vi: Hổ Báo (Borg), Lì Lợm (Elara), Tham Farm, Ám Sát (Death), Kền Kền (Victoria), Con Bạc (Jack).
- **10 hành động lớn mới**: Thách đấu, Hộ tống, Giữ cứ điểm, Gác lối bo, Chiếm chỗ cao, Truy sát dị giáo, Kích nổ, Giăng mồi, Bám mép bão, Đình chiến.
- **20 tính cách mới**:

  | Tính cách | Tướng | Hành vi |
  |---|---|---|
  | 🕊 Hòa Bình | Aria | Không ra tay trước; chỉ đánh trả khi máu dưới 70% hoặc Oktava đã lao vào; tránh chỗ có tiếng giao tranh; núp bụi |
  | ⚔ Võ Sĩ Danh Dự | Valerius | Không ăn hôi, không đánh kẻ đang bận đánh người khác; chờ kẻ vừa thắng trận hồi sức (≥ 70% máu) rồi thách đấu; mê cổng quyết đấu |
  | 💰 Thực Dụng | Roxie | Né đánh, gom vàng, đúc vũ khí hết tiền; đủ đồ (vũ khí Vàng hoặc 5 món) mới đi săn (×1.7) |
  | 🃏 Quấy Nhiễu | Wukong | Mê nhặt mảnh hồn / thính / rương; đặt bẫy trêu ngươi; dưới 55% máu thì dây móc chuồn |
  | 📿 Cuồng Tín | Thanh Phong | Truy sát **Death** (dị giáo), kể cả ngoài bo; luôn cảm nhận được vị trí Death (cập nhật mỗi 5 giây) |
  | 🐀 Chuột Lũi | Lyra | Lủi bụi, tránh mọi giao tranh; chỉ cắn khi bị dồn vào góc |
  | 😈 Kẻ Bắt Nạt | Koda | Săn kẻ có vũ khí kém hơn hoặc dưới 50% máu (×2.0); gặp vũ khí Vàng/Đỏ hoặc kẻ mạnh hơn thì giữ khoảng cách (1.9) |
  | 🚧 Gác Cổng | Clint | Vào bo kế tiếp sớm 30 giây; đứng ở mép phía kẻ còn ngoài bo; ưu tiên đánh kẻ đang trong bão (+2) |
  | 🎰 Con Bạc Khát Nước | Joker | Đủ cấp thì bỏ bãi nhỏ; tranh thính ×2.0, boss ×1.9 dù đông người; càng ít máu càng liều |
  | 🏰 Lãnh Chúa Cứ Điểm | Gideon | Chiếm nhà / đền / cao nguyên gần tâm bo; đặt bẫy ở lối vào; ai vào trong 15 đv là dồn hỏa lực; không đuổi xa quá 18 đv |
  | 🛡 Vệ Sĩ Thầm Lặng | Theron | Theo người được bảo vệ ở 15–25 đv; ai đánh người đó thì can thiệp (2.0); không bao giờ đánh người đó |
  | 💣 Kẻ Đổi Mạng | Kazuki | Thận trọng; dưới 15% máu mà bị dồn thì "Liều mạng!": tung bom, đánh hết, đứng phía trong bo để đẩy đối thủ ra bão |
  | 🐺 Thợ Săn Bắt Lẻ | Percy | Không chen vào trận đông; đi dọc rìa bo; săn kẻ đứng lẻ (×1.9) |
  | 👻 Thoát Xác | Vesper | Dưới 75% máu mà không thắng thế thì rút; hồi sức rồi quay lại cấu |
  | ⛰ Tiên Tri Địa Hình | Raven | Chiếm cao nguyên / tháp canh (dây móc đu lên); ngại đánh trên đất bằng; trên cao không chạy xuống đuổi |
  | 🎯 Kẻ Trảm Tướng | Ryoma | Săn kẻ nhiều mạng nhất / cầm vũ khí Đỏ / có bùa boss (×2.0); kẻ tầm thường ×0.25 |
  | 🔥 Gieo Rắc Hỗn Loạn | Ignatius | Có kẻ đứng cạnh thùng nổ là tới kích nổ (2.0); ném bom vào chỗ có ≥ 2 kẻ đứng gần nhau |
  | 🎣 Thợ Săn Mồi Câu | Alice | Lấy rương làm mồi, đặt 2 bẫy quanh rồi núp cách 20–30 đv; có kẻ tới mở rương là lao vào (1.9) |
  | 🌪 Bóng Ma Rìa Bão | Galo | Tích bình + phù kháng độc; đi sát mép bo đang co; ưu tiên kẻ vừa thoát bão / đang uống bình (+2.2) |
  | 🎭 Ngụy Quân Tử | Florian | Đầu–giữa trận đề nghị đình chiến (mỗi trận 1 lần, 4 phút); cùng đồng minh đánh kẻ thứ ba; đồng minh dưới 30% máu hoặc cúi mở rương thì "Đâm sau lưng!" |

- **Các hành động "giữ vị trí"** (hộ tống, cứ điểm, chỗ cao, giăng mồi, mép bão, núp của Chuột Lũi / Hòa Bình):
  - Mạnh dần theo thời gian trận, nên đầu trận vẫn phải ăn quái lên cấp.
  - Giảm khi tướng tụt hơn mặt bằng 2 cấp.
- **Tạm thời, chờ cốt truyện**:
  - Dị giáo của Cuồng Tín là Death.
  - Người được Vệ Sĩ bảo vệ là tướng có sức mạnh thấp nhất lúc đầu trận.

### Giao diện (`render.js`, `map_art.js`, `hud.js`, `app.js`)
- **Nền bản đồ**: vẽ theo biome của từng vùng. Công trình gồm sàn nhà gỗ / đá, đền đổ, cao nguyên (vách đá liền mạch, dốc có bậc), suối có cầu gỗ, ao bùn / mặt băng / cát lún, cối xay gió quay, xương rồng, ụ rơm.
- **Vật thể trên sân**:
  - Rương: vòng tiến độ 🎁 khi đang mở.
  - Bẫy: vòng nét đứt màu chủ bẫy.
  - Thùng nổ: nhấp nháy, tóe lửa khi cháy ngòi.
  - Vòng niệm 🌀 khi đang Dịch Chuyển.
  - Viền 🧿 khi đang dán phù Hộ Mệnh.
  - Đình chiến: nét đứt xanh + 🤝. Vệ sĩ → người được bảo vệ: nét chấm.
- **Thẻ tướng** hiện:
  - balo cấp mấy, các vật phẩm, số rương đã mở;
  - ⛰ đang trên cao / đang ở bùn, cát, băng;
  - người được bảo vệ / đồng minh đình chiến.
- **Danh sách tướng**: thêm 🎒 số vật phẩm.
- **Dòng sự kiện mới**: mở rương, rương mới, dính bẫy, Phù Hộ Mệnh cứu mạng, thùng nổ, đình chiến / từ chối, đâm sau lưng (có biểu ngữ), liều mạng, vệ sĩ chọn người bảo vệ.
- **Màn dàn tướng** hiện biome và công trình của bản đồ. Lời giới thiệu ở menu đã cập nhật.

## 2. Đo đạc (`docs/GD7_MO_PHONG.txt`, 24 trận)

| Chỉ số | Kết quả |
|---|---|
| Thời lượng trận | TB **39.3 phút** (trung vị 39.9; 4% < 30 phút; 0% hết giờ) — trong mục tiêu 30–60 |
| Lỗi / tất định | **0 lỗi** trong 24 trận; tất định ✔ (cùng hạt giống → cùng bản đồ, cùng trận) |
| Sinh bản đồ | 60 hạt giống: **0 lần phải lùi về bản đồ cổ điển**; ~230 ms / bản đồ (gồm dựng lưới tìm đường); ~36 công trình / bản đồ |
| Giao tranh | giữa 39 giây; 16.6 lần hạ gục / trận; kền kền 13% |
| Rương / vật phẩm (16 trận) | ~47 rương được mở / trận; AI dùng nhiều nhất Hồi Máu, Tốc Biến, Thanh Tẩy, Lá Chắn, Kháng Độc |
| Sự kiện tính cách (16 trận) | Liều mạng 0.8, thùng nổ 1.3, dính bẫy 1.1, đình chiến 0.4 (bị từ chối 1.1), đâm sau lưng 0.2 / trận |

Hạng trung bình theo tính cách (kỳ vọng 5.5):

| Nhóm | Tính cách (hạng TB) |
|---|---|
| Sống lâu | Hòa Bình 2.3, Chuột Lũi 2.4 — sống lâu nhưng ít khi vô địch |
| Mạnh | Trảm Tướng 1.8, Thoát Xác 3.0, Ngụy Quân Tử 3.7, Bắt Nạt 4.3 |
| Yếu | Hổ Báo 8.8, Vệ Sĩ 7.8, Quấy Nhiễu 7.8 |

## 3. Chưa xong
- **Ryoma (Kẻ Trảm Tướng) quá mạnh**: vô địch 4/5 trận.
  - Từ GĐ6d Ryoma đã vô địch 71%, nên nguyên nhân là bộ chiêu chứ không phải tính cách.
  - Tôi **chưa sửa chỉ số chiêu** (theo yêu cầu giữ nguyên chiêu cũ). Đề xuất: giảm máu gốc hoặc sát thương combo của Ryoma ~10%. Bạn đồng ý thì tôi làm.
- **Florian (Ngụy Quân Tử) vô địch 55%.**
  - Đã thử: tắt phần cộng chỉ số vẫn mạnh; đổi sang tính cách Con Bạc thì về mức bình thường.
  - Vậy là bộ chiêu Florian hợp lối chơi "cân bằng" chứ không do đình chiến. Đình chiến đã giới hạn 1 lần / trận, 4 phút.
- **Vệ Sĩ (Theron) yếu**: cấp TB 5.3. Hay chạy tới cứu người được bảo vệ (kẻ yếu nhất) rồi chết theo.
  - Sẽ hợp lý hơn khi có cốt truyện chọn người được bảo vệ.
- **Kẻ Gieo Rắc Hỗn Loạn chưa dụ boss / quái vào giao tranh.** Mới có kích nổ thùng và ném bom. Dụ quái cần thêm cơ chế kéo quái ra khỏi dây xích.
- **Kẻ Đổi Mạng chưa "kéo kẻ địch ra khỏi vách".** Mới đứng phía trong bo để đòn đẩy hất đối thủ ra bão; chưa có cơ chế rơi khỏi vách.
- **Thợ Săn Mồi Câu chưa tự bỏ đồ Tím/Vàng làm mồi.** Mới dùng rương có sẵn.
- **Cầu chưa có vực / nước sâu.** Suối chỉ là tường thấp, đạn bay qua được.
- **Bản đồ cổ điển vẫn còn**: hạt giống `classic`, hoặc dùng khi sinh hỏng.

## 4. Con số khởi điểm mới / đã đổi

| Con số | Giá trị |
|---|---|
| Chỉ số nhân vật | nền 13 ± tính cách (−3 … +4), thành thạo 80 |
| Ý niệm | +5% sát thương / cấp; đúc 350 / 700 / 1200 / 1900 / 2800 vàng |
| Balo | 3 / 4 / 5 / 6 / 8 ô; nâng 250 / 500 / 900 / 1400 vàng; khởi đầu 2 bình máu + 1 bình mana |
| Rương | 3 / vùng + 1 / công trình; +3 mỗi 150s (tới phút 40); mở 1.5s; 2 vật phẩm + 60 vàng; 15% nâng balo; 8% ý niệm +1 |
| Độ cao | tầm nhìn ×1.25; giấu mình với người dưới thấp ngoài 7 đv; đánh xuống +10% |
| Địa hình | bùn ×0.7, cát lún ×0.65, băng ×1.2 tốc chạy; sương mù đầm lầy tầm nhìn ×0.8 |
| Thùng nổ | ngòi 0.45s, bán kính 3.2, 20% máu tối đa, hất 2.2 đv, quái −500, dây chuyền 0.3s |
| Phù Kháng Độc | −65% sát thương bo trong 25s |
| Đình chiến | đầu–giữa trận (tới phút 20), 1 lần / trận, 4 phút |
| Hộ tống | 15–25 đv; can thiệp khi người được bảo vệ bị đánh (trong 45 đv và đủ sức) |
| Thoát Xác / Chuột Lũi / Hòa Bình | rút ở 75% / 45% / 45% máu |
| Kẻ Đổi Mạng | liều mạng khi dưới 15% máu mà bị dồn (8 giây) |
