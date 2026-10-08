# GĐ6b — Đấu trường lớn, giao tranh dài, bình máu, mảnh hồn, cổng quyết đấu

GĐ6b làm theo các yêu cầu sau GĐ6:
- Bản đồ rộng gấp 5 lần, chia nhiều vùng, đầu trận ít chạm mặt.
- Trận dài 30–60 phút; mỗi giao tranh kéo dài 20–120 giây để tướng tung hết chiêu.
- AI tự tính sức mạnh, khó buông, chỉ chạy khi còn khoảng 10% máu.
- Farm dứt điểm từng bãi; thả diều; KS; sự khó chịu; mỗi tướng có phong cách đánh riêng.
- Thêm bình máu/mana; bỏ tự hồi máu.
- Thêm mảnh hồn đổi màu vũ khí và cổng quyết đấu.
- Hiệu ứng chiêu / đánh thường theo kiểu bản Legacy.

Bộ chiêu cũ của 27 tướng giữ nguyên.

## 1. Đã làm gì

### Bản đồ ×5 diện tích, 6 vùng (`src/sim/map.js`, `nav.js`, `ui/map_art.js`)
- Bản đồ mới **432×432 đv** (bản GĐ6 là 192×192). Có 6 vùng, hai vùng cạnh nhau hòa màu mềm ở ranh giới:

  | Vùng | Đặc điểm |
  |---|---|
  | 🌲 Rừng Thông | thông sẫm, lá kim |
  | 🐸 Đầm Lầy Sương | vũng nước, lau sậy, lá súng |
  | ⛰ Núi Đá Đỏ | đất đỏ, sỏi, tảng đá đỏ thay cây |
  | 🌾 Đồng Cỏ Vàng | lúa mì, hoa |
  | ❄ Tuyết Sơn | tuyết, thông phủ tuyết, bụi đóng băng |
  | 🏛 Phế Tích Tân Thế | vòng trong: đá lát vỡ, rêu, cột đổ, ổ boss |

- 5 vùng ngoài ngăn nhau bằng vách núi xuyên tâm. Mỗi vách chừa một khe để đi qua.
- Mỗi vùng có:
  - 9 bãi quái;
  - 1 Thương Nhân ở rìa Phế Tích;
  - 2 điểm xuất phát ở bán kính 178.
- **Chủ bãi đầu trận**: mỗi bãi thuộc về tướng có điểm xuất phát gần nhất.
  - 6 phút đầu, AI né bãi của người khác.
  - Bãi vàng ở giữa vùng là bãi tranh chấp.
- Tìm đường dựng lại cho bản đồ lớn:
  - lưới nút 16 đv, cộng thêm nút quanh đầu tường và quanh tảng đá;
  - Dijkstra dùng số thực 64-bit (bản số 32-bit làm sót nút).
- Thu nhỏ hết cỡ thì thấy toàn đấu trường, có tên 6 vùng. Khi đó số sát thương, đồng hồ bãi quái và chữ nổi tự ẩn cho đỡ rối.
- Công cụ `tools/ban_do.html` cũng hiện tên vùng.

### Nhịp trận 30–60 phút, giao tranh dài (`consts.js`, `combat.js`, `unit.js`)
- **Bo**: 6 vòng, bo 6 đóng lúc 46:30, hết giờ lúc 60:00.
- **Hồi sinh**: được hồi sinh nếu chết trong 20 phút đầu.
- **Thính**: 6 lần, báo trước 45 giây.
- **Boss**: xuất hiện lúc 4:00.
- **Máu tướng** ×2.4 so với bản MOBA. Tướng kiểu "Lì đòn" được thêm ×1.15.
- **Sát thương** tướng (và vật triệu hồi) lên tướng ×0.55.
- **Mana**: chiêu tốn 60% mana, hồi mana ×1.6, để giao tranh dài vẫn còn mana tung chiêu.

### Bình máu / mana, bỏ tự hồi máu (`src/sim/extras.js`, `items.js`)
- Tướng **không tự hồi máu**. Ngoài giao tranh chỉ hồi 2% mana mỗi giây.
- Bình mua ở Thương Nhân. Khởi đầu có 2 bình máu và 1 bình mana.

  | Bình | Giá | Mang tối đa | Uống | Hồi |
  |---|---|---|---|---|
  | Máu | 70 vàng | 5 | niệm 1.2 giây, đi chậm | 40% máu trong 6 giây |
  | Mana | 50 vàng | 3 | niệm 0.9 giây | 50% mana trong 4 giây |

- Lúc uống không đánh và không dùng chiêu được; bị khống chế thì hỏng lần uống.
- AI uống bình khi:
  - máu thấp và không ai áp sát;
  - vừa thoát khỏi kẻ đuổi;
  - đang đánh mà máu rất thấp (liều uống).
- Thính và thắng quyết đấu đều cho thêm bình.

### Mảnh hồn đổi màu vũ khí (`extras.js`, `ui/draw_hero.js`)
- Có 5 bậc: Trắng, Xanh, Tím, Vàng, Đỏ.
- Mỗi mảnh bậc b cộng +2.5%×b sát thương và +2.5%×b máu tối đa. Mang tối đa 6 mảnh.
- Nguồn mảnh hồn:
  - quái thường: ít, chỉ Trắng hoặc Xanh;
  - boss: Tím;
  - thắng quyết đấu: Tím;
  - thính: Vàng; 2 lần thính cuối có 40% ra Đỏ.
- **Vũ khí của mọi tướng đổi màu** theo bậc mảnh hồn cao nhất, kèm quầng sáng. Bậc Vàng và Đỏ thì nhấp nháy.
- Viền ảnh đại diện trong danh sách tướng cũng đổi màu theo bậc.
- Thẻ tướng và bảng xếp hạng liệt kê các mảnh hồn đang có.

### Cổng quyết đấu (`extras.js`, `ui/render.js`, `hud.js`)
- Cổng mở lần đầu lúc 8:00, sau đó cứ 5 phút lại mở.
- Vị trí cổng: trong bo kế tiếp, **giữa hai tướng**, nên có người tới được.
- Ghi danh: đứng cạnh cổng 2 giây. Khi người thứ hai ghi danh, cả hai bị kéo vào **vòng quyết đấu** bán kính 12 đv:
  - người ngoài không vào được;
  - không ai đánh được ai qua vòng;
  - bo không đốt;
  - cả hai đánh hết mình, không bỏ chạy.
- Người thắng nhận 1000 vàng, 1200 KN, hồi 50% máu và một mảnh hồn Tím.
- Quá 150 giây thì vòng siết lại và đốt cả hai.
- AI cân nhắc có tới cổng hay không dựa trên:
  - so sức mạnh với người đã ghi danh;
  - máu của mình;
  - đường đi tới cổng.
- Giao diện:
  - cổng đá phát sáng, vòng ghi danh, đếm ngược;
  - vòng quyết đấu màu vàng có cột lửa và đồng hồ;
  - biểu ngữ và dòng sự kiện;
  - camera tự lia tới ("⚔ Quyết đấu" là điểm nóng cao nhất).

### AI giao tranh (`src/sim/ai/hero_ai.js`, `utility.js`, `skill_ai.js`, `data/personality.js`)
- **Tự tính sức mạnh**: sức mạnh = máu hiệu dụng × sát thương/giây ÷ 100.
  - Thế trận được so trên cùng thang cho cả tướng lẫn quái.
- **Khó buông, quyết đấu**:
  - Đã vào trận thì đánh tới cùng.
  - Chỉ rút khi máu dưới khoảng 10% (6–13% theo Kỷ Luật) mà thế trận vẫn bất lợi.
  - Lúc rút thì **vừa chạy vừa xả chiêu** (khống chế, cấu rỉa, dồn sát thương). Tướng tầm xa vừa chạy vừa bắn trả.
  - Bỏ các kiểu buông cũ: "đánh lâu quá", "hơi yếu thì lùi".
- **Truy đuổi tới cùng**. Chỉ bỏ khi:
  - mất dấu con mồi;
  - bị trả đòn quá đau (mất hơn 45% máu trong lúc đuổi mà máu thấp hơn con mồi);
  - 7 giây không rút ngắn được khoảng cách.
- **KS**:
  - Mục tiêu càng ít máu càng hấp dẫn, theo công thức (1 − máu)^1.6.
  - Hạ được ngay bằng một đợt dồn đòn thì +1.3.
  - Đi săn con mồi dưới 40% máu thì điểm nhân thêm.
- **Sự khó chịu**:
  - Bị ai đánh thì khó chịu với người đó tăng theo % máu mất, nhân với (1.3 − 0.6 × Tâm Lý). Mức này giảm dần theo thời gian.
  - Bị đánh thì luôn đánh trả.
  - Đã có mục tiêu thì bám mục tiêu đó. Chỉ đổi khi một kẻ khác làm mình khó chịu vượt ngưỡng (15 + 25 × Tâm Lý), hoặc có mạng ngon để cướp.
- **Động lực làm tiếp việc đang làm**: tăng từ 0.20 lên **0.35–0.45** (theo Kỷ Luật). Ngưỡng đổi việc trước khi hết thời gian giữ là 0.45.
- **Phong cách đánh theo tướng**:

  | Phong cách | Cách đánh | Tướng |
  |---|---|---|
  | 🛡 Lì đòn | đã đánh là không chạy | Valerius, Borg, Kazuki, Wukong, Ryoma, Theron |
  | ⚔ Xông xáo | chạy ở ~10% máu | Gideon, Koda, Vesper, Death, Florian |
  | 🏹 Thả diều | giữ đối thủ ở mép tầm | 12 tướng tầm xa |
  | 🎯 Đứng bắn | không cố thả diều | Aria, Victoria, Galo, Clint |

- **Thả diều**:
  - Giữa hai phát bắn, giữ đối thủ ở mép tầm.
  - Đi vòng ngang và đổi hướng mỗi 0.8–2 giây; nếu đối thủ quá gần thì lùi.
  - Không thả diều ra ngoài bo.
  - Bị cận chiến áp sát thì **dùng chiêu lướt né**, xác suất theo Kỹ Năng Cá Nhân.
- **Farm dứt điểm**:
  - Ước lượng máu sẽ mất để dọn một bãi; không đủ máu thì bỏ qua bãi đó.
  - Đã đánh dở thì ăn hết bãi rồi mới đi.
- **Dùng chiêu**:
  - Chiêu mở giao tranh dùng được bất cứ lúc nào đang đánh.
  - Không phí chiêu khống chế lên mục tiêu đang bị khống chế (chờ để nối).
- **Còn ≤ 3 người**: AI giữ hạng, chờ bo ép, chỉ đi săn khi chênh lệch lớn.

### Hiệu ứng kiểu Legacy (`ui/vfx.js`)
- Vệt chém, đâm, lốc xoáy và vụ nổ đã được chuyển từ bản Legacy từ trước. GĐ6b thêm phần **cảm giác trúng đòn** của Legacy:
  - mỗi đòn trúng có tia sáng theo **màu người đánh**: tia nhỏ, bùng, hoặc mặt trời, tùy độ nặng;
  - có 3–14 hạt văng xen trắng và màu người đánh, văng theo hướng đòn;
  - đòn nặng thì rung màn hình và chớp trắng.
- **Tên chiêu bật lên trên đầu** mỗi khi dùng chiêu. Chiêu cuối hiện chữ to, màu của tướng.

## 2. Đo đạc (ít, đúng như yêu cầu)

Toàn bộ số liệu nằm ở `docs/GD6B_MO_PHONG.txt`: 24 trận, chạy bằng `node tools/mophong.js --tran 24 --hat gd6b --luong 4`.

| Chỉ số | GĐ6 | GĐ6b | Mục tiêu |
|---|---|---|---|
| Thời lượng trận | ~24 phút | **trung bình 36.9, trung vị 38.7** (25.6–44.6) | 30–60 |
| Phân bố thời lượng | — | <30: 21% • 30–40: 38% • 40–50: 42% | |
| Lần đầu hai tướng đánh nhau | — | giữa **72 giây** (65–94 giây) | ít chạm mặt đầu trận |
| Giao tranh kết thúc có người gục | — | 24/trận • 25% **15 giây** • giữa **36 giây** • 75% **75 giây** • 90% 152 giây • 43 chiêu | 20–120 giây |
| Giao tranh tách ra | — | 10/trận • giữa **29 giây** • 75% 56 giây • 54 chiêu | |
| Máu lúc bỏ chạy (có địch) | — | 25% **7%** • giữa **9%** • 75% **10%** | ~10% |
| Tay đôi trong vòng quyết đấu, cấp 9, 30 cặp | — | 10% 36 giây • giữa **58 giây** • 90% 102 giây • **52 chiêu/trận** • 0 hòa | 20–120 giây |
| Cổng quyết đấu | — | 3.4 cổng/trận • 0.6 trận quyết đấu/trận • giữa 28 giây | |
| Bình đã uống | — | 80/trận (~8 bình/tướng) | |
| Bãi quái bỏ dở | — | 12%, trong đó hơn nửa là do bị tướng khác đánh | ăn hết bãi |
| Kền kền | 15% | 14% | 20–30% |
| Tất định | ✔ | ✔ (`--kiemtra`: c843453f hai lần giống nhau) | |
| Lỗi / văng | 0 | 0 | 0 |

Thả diều, đo trong tay đôi bằng tỉ lệ thời gian giữ đối thủ ở mép tầm:

| Tướng | Thời gian ở mép tầm |
|---|---|
| Percy | 91% |
| Lyra | 88% |
| Alice | 80% |
| Roxie | 56% |
| Chrono | 50% |

Thời gian bị cận chiến áp sát dưới 2.2 đv: ≤ 3% với phần lớn tướng tầm xa.

Hai tướng thả diều kém hơn:
- Thanh Phong (tầm 4.8): 9%.
- Ignatius: hay bị áp sát (24%).

## 3. Chưa xong / còn dở
- **Cân bằng tướng**:
  - Tướng cận chiến "Lì đòn" (Borg, Kazuki, Valerius, Wukong) xếp hạng trung bình 7–8. Chúng không bao giờ chạy nên chết sớm hơn.
  - Đã thêm +15% máu cho nhóm này, nhưng vẫn yếu.
  - Aria và Zero đang mạnh.
  - Mỗi tướng mới có 6–13 trận nên số liệu còn nhiễu. Nên chỉnh tiếp ở GĐ sau.
- **Kền kền 14%**, thấp hơn mục tiêu 20–30% của GDD. Lý do là giao tranh dài và ít ai bỏ chạy nên ít mạng bị cướp.
- **Đuôi giao tranh dài**: 10% giao tranh có người gục kéo quá 120 giây (đến 152 giây). Đây thường là hai tướng máu trâu cùng không chạy.
- **Quyết đấu trong trận khá ngắn** (giữa 28 giây). Lý do là người tới cổng sau thường đang yếu hơn hoặc máu chưa đầy. Chỉ ~60% số cổng có trận đấu.
- **Hiệu ứng Legacy chưa giống hẳn**:
  - Chưa có hiệu ứng riêng cho từng chiêu như bản cũ (tia Knock-out, sao băng…). Hiện mỗi chiêu dùng hiệu ứng chung theo kiểu: nón, đường, vòng, nổ.
  - Nếu có chiêu cụ thể nào thấy xấu, chỉ ra để làm riêng.
- Trên điện thoại, lần đầu vào trận mất khoảng 2–3 giây để dựng ảnh nền toàn bản đồ (bản đồ lớn hơn 5 lần).

## 4. Các con số "khởi điểm" đã đổi

| Con số | GĐ6 | GĐ6b |
|---|---|---|
| Bản đồ | 192×192 | **432×432** (6 vùng) |
| Hết giờ trận | 30:00 | **60:00** |
| Bo 6 đóng | 26:30 | **46:30** (bán kính 310 → 205 → 145 → 100 → 64 → 34 → 12) |
| Hồi sinh nếu chết trong | 10 phút đầu | **20 phút đầu** |
| Máu tướng | ×1.35 | **×2.4** (Lì đòn ×1.15 nữa) |
| Sát thương tướng → tướng | ×1 | **×0.55** |
| Tự hồi ngoài giao tranh | 2% máu + 3% mana/giây | **0% máu** + 2% mana/giây |
| Mana | ×1 | chiêu tốn **×0.6**, hồi mana **×1.6** |
| Thính | 4 lần, báo trước 30 giây, thưởng +8% sát thương / +8% máu | **6 lần**, báo trước 45 giây, thưởng **mảnh hồn Vàng (có thể Đỏ) + 2 bình** |
| Boss xuất hiện / hồi | 2:00 / 240 giây | **4:00 / 300 giây** |
| Động lực làm tiếp việc đang làm | 0.06 + 0.06 × Kỷ Luật | **0.35 + 0.10 × Kỷ Luật** |
| Ngưỡng đổi việc khi chưa hết thời gian giữ | 0.22 | **0.45** |
| Ngưỡng giao chiến (đầu / sau / mạng cuối) | 2.0 / 1.4 / 1.5 | **1.5 / 1.1 / 1.2** (sức mạnh mới) |
| Ngưỡng rút lui | máu 36–42% / độ hổ báo | **~10%** (6–13%) và thế trận < 1.05; Lì đòn và quyết đấu: không rút |
| Mới | — | bình máu 70 vàng / mana 50 vàng; mảnh hồn +2.5%×bậc; cổng quyết đấu 8:00, mỗi 5 phút, thưởng 1000 vàng + 1200 KN + mảnh hồn Tím |
