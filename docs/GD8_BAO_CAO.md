# GĐ8 — Bản đồ ×2, 4 ổ boss / 7 boss có cảnh báo, Hộ Giáp & Xuyên Thủng, mảnh hồn 9 chỉ số × 6 bậc

Yêu cầu (tóm tắt):
- Sửa chiêu Florian, Roxie, Percy theo bản Legacy.
- AI không đứng bụi quá lâu; mục tiêu chính là farm; tính cách thủ xem bảng chỉ số, thấy mình tụt cấp / yếu thì đi farm thêm.
- Quái đi tuần quanh boss từng khu; bản đồ ×2, thêm **Vùng Tử Khí** và **Trạm Khí Độc**; thêm 3 chỗ đánh boss, giữ chỗ trung tâm.
- Tướng mạnh từ đầu tới cuối, tính cách đánh nhau thắng quá nhiều → cân lại; tăng sát thương để giao tranh 10–120s.
- Boss mới: Phượng Hoàng, Thiết Minh Quân, Thiên Hồn Chủ (bùa lợi 120s), Quái Thú Hoàng Kim, Rồng (240s), Kiếm Sư Vĩ Đại; đồ Hoàng Kim; Ý niệm Rực Rỡ mở thêm lựa chọn cây kỹ năng cấp 15/18; cảnh báo nhiều hình dạng + cây quyết định né của AI; AI biết bùa lợi của mình và người khác; nhiều AI tranh một boss, đánh boss thì cả bản đồ biết.
- Nhiều rương hơn, may mắn giúp mở rương ngon hơn; hệ 9 chỉ số cốt lõi, 6 bậc (Trắng → Hoàng Kim), mảnh thuần chỉ số / mảnh cơ chế, nhánh Xuyên Thủng & Chống Xuyên, Hộ Giáp, bình Hộ Vệ, AI theo Xuyên Thủng.

## 1. Đã làm gì

### Florian, Percy, Roxie làm lại theo Legacy (`src/data/heroes/*.js`)
- **Florian**: dấu điểm yếu quanh mục tiêu. Mỗi dấu bị phá thì:
  - giảm 1.5s hồi chiêu S2/S3/skill phụ;
  - làm chậm 60% trong 1s;
  - gây sát thương chuẩn theo % máu tối đa.
- Phá đủ 3–4 dấu thì Florian:
  - làm choáng 1.1s;
  - cường hóa đòn kế (×1.4, đẩy lùi);
  - hồi 5% máu.
- S3 là thế đỡ đòn: bị đánh thì phản choáng. S4 Kiếm Thế đặt lại dấu và đâm xuyên.
- Sau khi đo, tôi hạ bớt sức mạnh Florian vì đây là tướng làm lại theo yêu cầu (vô địch 45% → 25%).
- **Percy**:
  - Dồn Dập: mỗi tầng +10% sát thương, tối đa 8 tầng.
  - S1 Trận Địa: đứng yên 5s xả loạt đạn; AI giữ vị trí, không né lung tung làm mất trận địa.
  - Móc kéo choáng, lướt, S4 Liên Châu.
- **Roxie**:
  - Bánh răng rơi quanh Roxie; nhặt để +tốc chạy và để dựng tháp.
  - S2 Khai Tâm cho thêm bánh răng, tốc đánh, sát thương.
  - S4 cần đủ 3 bộ phận, kéo dài 15s.
  - AI tự nhặt bánh răng.

### AI farm & bụi rậm (`utility.js`, `persona.js`, `hero_ai.js`)
- **Chán bụi**: ngồi bụi càng lâu thì điểm "núp" càng giảm.
  - Tỉ lệ thời gian nằm bụi trước đây cao nhất 53% (Lyra), lâu nhất 1142s. Giờ cao nhất ≤ 7.6%, lâu nhất 71s.
- **Tự thấy mình tụt hậu**: so cấp với mặt bằng và sức mạnh với người dẫn đầu. Tụt thì điểm farm tăng (tính cách thủ / an toàn tăng mạnh hơn) và điểm núp giảm.
- **Săn người dẫn đầu ×1.35**. Có người dẫn đầu (≥ 4 mạng) thì người khác dễ liên minh tạm với nhau hơn (×1.6).

### Bản đồ ×2, 8 vùng, 4 ổ boss (`map.js`, `bosses.js`, `map_art.js`)
- Bản đồ 432 → **612 đv** (diện tích ×2).
- **7 vùng ngoài** (mỗi vùng ≈ 51°) + Phế Tích ở giữa. Hai vùng đặc biệt cố định, không có điểm xuất phát:
  - **💀 Vùng Tử Khí**:
    - sương mù, tầm nhìn ×0.7;
    - nghĩa địa (bia mộ, bụi gai), đền đổ;
    - mỗi ~14s một đám mây tử khí ập xuống gần một tướng trong vùng (báo trước 1.5s).
  - **☣ Trạm Khí Độc**:
    - bồn khí, đường ống, nhà xưởng thép;
    - thùng độc nổ ra mây độc;
    - ống xả phun độc mỗi ~10s (báo trước);
    - Chuột Đột Biến chết thì nổ.
- **4 ổ boss**:
  - 🏛 Ổ Tân Thế (giữa, giữ nguyên);
  - 💀 Hang Tử Khí;
  - ☣ Lò Khí Độc;
  - 💰 Kho Báu Hoàng Kim.
- Mỗi ổ có **3 quái tuần tra đi vòng quanh boss**.
- Quái nhỏ đổi dáng theo vùng: Sói Xám chảy máu, Ếch Độc, Bọ Đá, Gấu Tuyết, Rắn Cát, Hồn Ma hút máu, Chuột Đột Biến…
- Kiểm tra hợp lệ: 20/20 hạt giống ra bản đồ đúng, không phải dùng bản đồ cổ điển.

### 7 boss, cảnh báo, bùa lợi, đồ Hoàng Kim (`src/sim/bosses.js`)
| Boss | Ổ | Thưởng |
|---|---|---|
| 🏛 Boss Tân Thế | Ổ Tân Thế | Ấn Tân Thế + mảnh hồn + Ý Niệm +1 |
| 🔥 Phượng Hoàng | Lò Khí Độc | **Ấn Niết Bàn** 120s: bị hạ thì sống lại tại chỗ, đủ máu, giữ đồ |
| ⚔ Thiết Minh Quân | Hang Tử Khí | **Minh Tướng Huyết Trảm** 120s: kết liễu → hồi đầy máu + Giáp Ảo 50% máu |
| 👻 Thiên Hồn Chủ | Hang Tử Khí (sau Thiết Minh) | **Hồn Thần Bất Diệt** 120s: đòn chí mạng → hồi 100% + bất tử 2s |
| 💰 Quái Thú Hoàng Kim | Kho Báu (phút 13) | 5000 vàng, balo cấp 6, 2 Bình Rực Rỡ, Ý Niệm Rực Rỡ, 3 món Hoàng Kim |
| 🐉 Rồng Cổ Đại | Tâm bo (từ bo 4) | **Long Hỏa & Long Uy** 240s: +35% sát thương, thiêu, chặn hồi máu |
| ⚔ Kiếm Sư Vĩ Đại | Lò Khí Độc (sau Phượng Hoàng) | 1 món Hoàng Kim + Lưỡi Kiếm Sắc Bén + Mảnh Hồn Ý Chí + Ý Niệm Rực Rỡ |

- **Cảnh báo đủ hình**:
  - hình chữ nhật (đường thẳng);
  - vòng tròn;
  - nhiều vòng rải rác / bám theo người;
  - hình nón 90°/120°;
  - vành khăn 3–10;
  - chữ thập laser xoay;
  - 2 vòng đồng tâm;
  - tam giác 3 vòng.
- **Cây né của AI**:
  - chữ nhật / hình nón → né ngang;
  - vòng quanh boss → lướt / dây móc ra ngoài, hoặc lùi;
  - vành khăn → cách tâm ≤ 5 đv thì lướt vào tâm, xa hơn thì chạy ra ngoài 10 đv.
- **Đánh boss là cả bản đồ biết**: "⚠ X đang đánh boss" (khi boss đã yên ắng 30s). Boss có bảng thù hận, nhiều AI kéo tới tranh.
- **Bùa lợi & AI**:
  - Mang Minh Tướng → hổ báo ×2.0.
  - Mang Hồn Thần / Niết Bàn → không rút lui.
  - Jack, Percy, Roxie, Borg ×2.0 với Quái Thú Hoàng Kim.
  - Alice, Chrononeo, Raven, Lyra (nhóm "khôn") tránh kẻ mang Long Hỏa ×1.9.
  - Có Ý Chí thì mở màn bằng đòn mạnh nhất.
  - Sức mạnh đối thủ tính cả bùa họ đang mang.
- **Đồ Hoàng Kim**:
  - Giáp Hoàng Kim (+100% Hộ Giáp, vỡ giáp → sóng đẩy + miễn sát thương);
  - Kiếm Hoàng Kim;
  - Ý Niệm Hoàng Kim;
  - Mảnh Hồn Hoàng Kim;
  - Lưỡi Kiếm Sắc Bén (chủ động, hồi 120s).
- **Rực Rỡ**: cấp 15 lấy thêm 1 lựa chọn mốc 3/6/9. Cấp 18 lấy thêm 1 lựa chọn mốc 12, hoặc Tối Thượng Nộ / Thần Lực.

### Hộ Giáp, Xuyên Thủng, 9 chỉ số × 6 bậc (`src/data/shards.js`, `extras.js`, `combat.js`, `unit.js`)
- **Hộ Giáp**:
  - lượng giáp: 100 + 15/cấp + mảnh hồn / đồ;
  - gánh sát thương trước máu;
  - không tự hồi; hồi bằng bình Hộ Vệ nhỏ/vừa/lớn, lên cấp, hồi sinh;
  - bo và hiểm họa đánh thẳng vào máu.
- **Xuyên Thủng X%**: X% sát thương đi thẳng vào máu. **Chống Xuyên** trừ thẳng vào X.
  - AI có Xuyên Thủng ≥ 70% nhắm kẻ giáp dày.
  - Gặp đối thủ Xuyên Thủng cao thì rút sớm hơn.
- **9 chỉ số cốt lõi**:
  - Máu, Hộ Giáp, Công Vật Lý %, Công Phép, Tốc Chạy;
  - Hồi Chiêu (trần 40%);
  - Hút Máu (mọi sát thương);
  - Kháng Hiệu Ứng (trần 60%);
  - May Mắn (chí mạng + đồ hiếm).
- **6 bậc**: Trắng 1 ô → Xanh 2 → Tím 3 → Vàng 4 → Đỏ 5 → Hoàng Kim / Rực Rỡ 6. Hệ số sức mạnh 1 / 1.5 / 2.2 / 3.2 / 4.5 / 6.
- **110 mảnh hồn có tên**: mỗi bậc có mảnh thuần chỉ số, mảnh cơ chế, nhánh Xuyên Thủng, nhánh Chống Xuyên. 9 đặc năng cũ giữ thành mảnh có tên. 3 mảnh Hoàng Kim từ boss.
- **Ý Niệm = số ô khảm**:
  - ai cũng bắt đầu ở Trắng;
  - mảnh bậc K cần Ý Niệm ≥ K;
  - mang tối đa 8 mảnh; gắn được bằng cấp Ý Niệm, còn lại cất túi.
- **Rương nhiều hơn**:
  - mỗi vùng 5 rương (trước 3);
  - mỗi 120s thêm 5 rương (trước 150s / 3 rương);
  - 15% ra mảnh hồn;
  - May Mắn cho thêm món, ưu tiên món giá cao, tăng tỉ lệ mảnh / balo / ý niệm.

### Sát thương & nhịp trận
- Sát thương tướng lên tướng ×0.55 → **×0.72**. 10 phút đầu tăng dần từ ×0.8 lên đủ.
- Hồi sinh được tới phút 30 (trước là phút 25).
- Tầm nhìn tướng 12 → 16 đv.
- Bo phóng theo bản đồ.

### Giao diện (`map_art.js`, `render.js`, `hud.js`, `vfx.js`)
- Vẽ 8 vùng:
  - Tử Khí: đất tro tím, cây chết, bia mộ, bụi gai, xương;
  - Khí Độc: vũng độc, sắt vụn, bồn khí có vạch vàng đen, đường ống, nắp xả có khói, nhà xưởng thép.
- 4 ổ boss, mỗi ổ một kiểu sàn. Trên ổ có đếm ngược kèm tên boss sắp ra.
- **Mỗi boss một dáng riêng**: Phượng Hoàng vỗ cánh lửa, Rồng, hồn ma, kỵ sĩ giáp sắt, thú vàng có sừng, kiếm sư vung kiếm. Có vòng và thanh tụ chiêu.
- Vùng cảnh báo tròn / vành khăn / chữ nhật / hình nón, tô đậm dần tới lúc nổ.
- Thanh **Hộ Giáp** màu bạc trên thanh máu. Biểu tượng bùa lợi boss trên đầu người mang.
- **Thẻ tướng**:
  - Hộ Giáp, chí mạng, may mắn, hồi chiêu, hút máu, kháng, xuyên thủng;
  - bùa lợi boss (còn bao lâu);
  - đồ Hoàng Kim;
  - mảnh hồn đang gắn ✅ / cất túi 💤, kèm tên và mô tả.
- **Dòng sự kiện & biểu ngữ**: boss xuất hiện ở ổ nào, ai đang đánh boss, ai hạ boss nhận bùa gì, thoát chết nhờ bùa, nhận đồ Hoàng Kim, mở lựa chọn Rực Rỡ.
- Quái nhỏ có dáng / màu theo vùng và vệt cào khi đánh. Oktava và vật triệu hồi cận chiến có hiệu ứng vung đòn.
- Sửa lỗi: nhãn quả cầu mảnh hồn dùng bảng cũ đã bỏ, sẽ lỗi khi phóng gần.

## 2. Đo đạc (24 trận, hạt giống g8c — `docs/GD8_MO_PHONG.txt`; boss: 8 trận g8r)
| | GĐ7b | **GĐ8** |
|---|---|---|
| Thời lượng trận | 38.4 phút (<30: 13%) | **35.7 phút** (<30: 21%, 30–40: 54%, 40–50: 25%) |
| Hạ gục / trận | 16.5 | **17.7** |
| Giao tranh kết thúc bằng cái chết | 25% 16s • giữa 33s • 75% 61s • 90% 168s | **25% 10s • giữa 23s • 75% 43s • 90% 136s** |
| Boss bị hạ / trận | 2.63 | **5.9** |
| Lỗi / văng | 0 | **0 / 0** |
| Tất định | ✔ | ✔ (c77894f5, 37.04 phút, chạy 2 lần giống hệt) |

- **Boss** (8 trận g8r):
  - Mỗi trận hạ 4.5 con: Tân Thế 2.13 • Quái Thú Hoàng Kim 0.75 • Phượng Hoàng 0.63 • Thiết Minh Quân 0.5 • Rồng 0.38 • Kiếm Sư 0.13.
  - Trung bình 2 tướng cùng tranh mỗi con.
  - ~10 thông báo "đang đánh boss" mỗi trận; 0.75 lần nhận kho báu Hoàng Kim mỗi trận.
- **Cân bằng tướng**:

  | Tướng | Vô địch GĐ7b | Vô địch GĐ8 |
  |---|---|---|
  | Ryoma | 75% | **42%** |
  | Florian | 14% | 25% (trước khi hạ bớt: 45%) |
  | Koda | 33% | 38% |
  | Chrononeo | 29% | 43% (7 trận) |

  - Percy hạng trung bình 7.9 → 6.0; Borg 5.9 → 8.1; Valerius 9.2 → 7.7.
  - Lyra / Aria vẫn top 3 80–85% nhưng ít vô địch (núp tốt, đánh yếu).
- Bụi rậm: người nằm bụi lâu nhất ≤ 7.6% thời gian sống (trước 53%).

## 3. Chưa xong / cần hỏi
- **Ryoma vẫn mạnh** (42% vô địch, kỳ vọng ~10%).
  - Tôi chưa giảm chỉ số Ryoma vì cần bạn đồng ý (quy ước: không giảm tướng cũ khi chưa hỏi).
  - Đề xuất: S4 −10% sát thương, máu cộng mỗi cấp −5%.
- Borg (Hổ Báo) và Valerius (Võ Sĩ) vẫn đứng cuối; nhóm Con Bạc / Khát Nước chưa vô địch trận nào.
- **Tôi đã tự chỉnh để các boss công bằng hơn** (bạn cho phép tự sửa, nhưng nên xem lại):
  - Quái Thú Hoàng Kim và Kiếm Sư thưởng quá lớn, nên khó hơn: máu cao hơn và ra muộn hơn. Quái Thú ra phút 13. Kiếm Sư chỉ ra sau khi Phượng Hoàng bị hạ.
  - Boss cho bùa lợi dễ hơn để AI hay tranh.
  - Rồng không có ổ riêng mà hạ cánh ở tâm bo từ bo 4.
- Kền kền vẫn 8% số mạng (mục tiêu 20–30%), giống GĐ7b.
- 10% giao tranh dài hơn 120s (90% = 136s), phần lớn là đánh đuổi qua nhiều vùng.
- Cốt truyện: dị giáo của Cuồng Tín (Death) và người Vệ Sĩ bảo vệ vẫn là tạm thời.
- Các yêu cầu mới (nạp đạn, mảnh Tầm Nhìn / Tầm Đánh / Nạp Đạn / Tốc Đánh, Aria/Oktava, Gideon, Raven, Wukong, truy vết, thính giác, build ưa thích, xem cây kỹ năng) **để sang GĐ9**.

## 4. Con số khởi điểm mới
- Bản đồ 612×612. 7 vùng ngoài + Phế Tích (bán kính 149). Bo đầu 440, bo 6 bán kính 16 (đóng lúc 47:20).
- Sát thương tướng ↔ tướng ×0.72 (10 phút đầu ×0.8 → ×1). Hồi sinh tới phút 30. Tầm nhìn 16 đv.
- Hộ Giáp 100 + 15/cấp. Bình Hộ Vệ hồi 30% / 55% / 100% Hộ Giáp (uống 1.0 / 1.4 / 1.8s).
- Ý Niệm bắt đầu Trắng (1 ô). Giá đúc 350 / 500 / 1000 / 1600 / 2400. Rực Rỡ +30% hiệu lực mảnh.
- Mang 8 mảnh hồn. Bậc ×1 / 1.5 / 2.2 / 3.2 / 4.5 / 6.
- Rương: mỗi vùng 5, mỗi 120s thêm 5, 15% ra mảnh hồn.
- Boss (máu / công lúc ra, cộng thêm mỗi phút):

  | Boss | Máu | Công |
  |---|---|---|
  | Tân Thế | 5200 +180 | 100 +5 |
  | Phượng Hoàng | 5200 +150 | 85 +4.5 |
  | Thiết Minh Quân | 5800 +160 | 95 +5 |
  | Thiên Hồn Chủ | 5000 +150 | 80 +4.5 |
  | Quái Thú Hoàng Kim | 9000 +180 | 110 +5.5 |
  | Rồng | 10000 +200 | 120 +6 |
  | Kiếm Sư | 7000 +160 | 100 +5 |

- Lịch ổ boss:

  | Ổ | Lần đầu | Hồi |
  |---|---|---|
  | Ổ Tân Thế | 4:00 | 300s |
  | Hang Tử Khí | 6:00 | 240s |
  | Lò Khí Độc | 7:00 | 300s |
  | Kho Báu Hoàng Kim | 13:00 | 600s |

- Bùa boss 120s (Rồng 240s).
