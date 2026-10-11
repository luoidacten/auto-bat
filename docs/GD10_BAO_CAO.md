# GĐ10 — 13 tướng mới, 5 tướng làm lại, chiêu cuối mạnh hơn, sửa lỗi Solo hòa, AI nhận thức

Yêu cầu: "Tiếp tục làm GĐ10 với các tướng (tướng chưa làm và các tướng trong tài liệu này), sửa vài lỗi: khi nhà cái kéo Solo hai đối tượng đó không đánh nhau gây lỗi hòa; đã sửa: bạn không được can thiệp vào trận đấu." Thêm giữa chừng: "Người triệu gọi & đồng điệu — bỏ luôn" và "tất cả chiêu cuối uy lực, dame to hơn và mạnh hơn".

Tổng số tướng: **40** (27 cũ + 13 mới).

## 1. Đã làm gì

### Sửa lỗi
- **Solo của nhà cái luôn hòa.** Không Gian Quyết Đấu nằm ở (1200, 1200), ngoài lưới bản đồ, nên tìm đường, lưới không gian và tầm nhìn đều không thấy đối thủ: hai người đứng nhìn nhau tới hết giờ. Đã sửa ba chỗ:
  - trong không gian quyết đấu đi thẳng, không tìm đường;
  - lưới không gian kẹp tọa độ về ô biên;
  - hai người quyết đấu luôn thấy nhau, trừ khi tàng hình ở xa quá 2.5 đv.
  
  Thêm **"Không gian co lại"**: sau 25s, mỗi giây cả hai mất 2% máu tối đa, tăng dần. Kết quả: 0/6 trận phân thắng thua trước khi sửa, khoảng 9/10 sau khi sửa.
- **Bỏ can thiệp trận.** Charm can thiệp (Phô Mai, Tay Trong) không còn được bán. Người chơi không còn cách nào tác động vào trận.
- **Nội tại thoát chết không chạy.** Hook `passive.onFatal` của tướng chưa bao giờ được gọi; chỉ bản trong cây kỹ năng chạy. Đã sửa ở `Match.kill()`. Các tướng giờ thoát chết đúng mô tả: Alice, Vesper, Chrono & Neo, Galo, Jack, Victoria, Boran.
- **Bỏ hẳn** "Người triệu gọi & đồng điệu" (GDD mục 9), theo yêu cầu.

### Chiêu cuối mạnh hơn (mọi tướng)
- Mọi sát thương mang nhãn chiêu cuối (`s4`) nhân **×1.4** (`C.ULT_AMP`).
- Tung chiêu cuối cho 6s **"Bộc Phát"**: +20% sát thương mọi nguồn, +15% tốc chạy (`C.ULT_SURGE`). Áp dụng cả cho chiêu cuối dạng cường hóa bản thân.

### 13 tướng mới
| Tướng | Vai trò | Tài nguyên riêng | Điểm nhấn |
|---|---|---|---|
| Luca | ảo thuật / sao chép | Náo Nhiệt | Cải Trang sao chép S1–S3 của nạn nhân |
| Kip | sát thủ hư không | 3 Điểm Hư Không | blink 3 nhịp, Vòm Xoáy nuốt đạn, Lãnh Địa |
| Olivia | hỗ trợ Giáo Hội | Đức Tin | khiên phép, hồi máu toàn bản đồ |
| Justus | đỡ đòn Giáo Hội | Đức Tin | chặn phép, Thiên Thần, Thánh Trận |
| Ratok | móc xích | — | móc kéo, quét xích, Đại Họa |
| Dr. Caelus | điều khiển thời gian | Xác Suất | lưu lịch sử để tua ngược, lồng, phản đạn |
| Boran | song rìu cuồng loạn | Nộ Khí | rìu ném, xoay, nhảy, kháng bo 30% |
| Ariston | đại bản đao | Đức Tin | tốc đánh cố định, cầu nguyện bật/tắt; Phán Quyết trả lại sát thương đã nhận |
| Mirage | bậc thầy ảo thuật | Náo Nhiệt | hộp tử thần, Phân Thân Hoàn Hảo |
| Dahlia | ảo thuật mũ đen | Cuồng Nhiệt | hoán đổi với quái / ảo ảnh, Màn Ảo Thuật phản đòn, Sân Khấu Chết Chóc |
| Dr. Vector | xạ thủ laser | ổ 8 viên | tia xuyên thấu, radar phá tàng hình và ảo ảnh, bom từ cấm lướt, pháo laser |
| Bạch Diệp | kiếm vương ngự kiếm | Kiếm Khí (không giới hạn) | Loạn Trảm xả liên tục, Kiếm Trận bật/tắt; chiêu cuối 3 thế |
| Tsukiyo | nhẫn giả đa hình | Nội Năng | mỗi chiêu theo 1 trong 3 nhánh (Kỹ Thuật / Tất Sát / Bí Thuật); 3 tầng Nhẫn Đạo theo chỉ số |

Mỗi tướng có đủ:
- nội tại, S1–S4 và chiêu phụ (với tướng có chiêu phụ);
- cây 5 mốc × 3 nhánh;
- tính cách, phong cách đánh, 3 lối build và mảnh hồn ưa thích;
- vũ khí vẽ riêng: cane, tome, hookchain, orb, axes, cleaver, laser, flysword, ninja.

Tính cách mới **Cuồng Loạn** (Koda, Boran): gặp ai đánh nấy, không lui, đánh đến chết.

**Quan hệ giữa các tướng** (`src/data/relations.js`):
- bạn bè không đánh nhau khi trận còn hơn 3 người;
- bảo vệ nhau: kẻ đánh người được bảo vệ bị ưu tiên làm mục tiêu;
- thù ghét, ví dụ Vector ghét Luca, Boran ghét Caelus;
- câu thoại khi gặp nhau lần đầu (hiện trên đầu tướng và trong bảng tin).

### 5 tướng làm lại theo tài liệu
- **Alice**:
  - đánh thường gây phép, tầm 8;
  - Phi Dao tốn 5 Náo Nhiệt, phóng 8–20 dao; Lướt Đâm tốn 10, đâm sau lưng ×2/×3 kèm choáng;
  - S3 vây 5–10 ảo ảnh;
  - **Sân Khấu Cuối Cùng**: chặn đòn chí tử, hồi 25% máu, làm mới chiêu;
  - S4 thêm biến thể **Vạn Biến**: Náo Nhiệt 200, ảo ảnh tự sao chép Phi Dao và Lướt Đâm.
- **Vesper**:
  - S1 tầm 7–10, dịch chuyển lại trong 5s;
  - S2 lao 4–8 đv, đâm sau lưng gây choáng;
  - S3 tàng hình tới không giới hạn; lộ diện theo khoảng cách 2.5 → 1 đv;
  - đòn bất ngờ gây độc và **Khóa Họng**;
  - S4 phóng 10/20/40 dao + tàng hình 5s, dùng lại để dịch chuyển, Hư Ảnh Đoạt Mệnh; Trảm Quyết ×2/×3.
- **Lyra**: làm lại toàn bộ cây kỹ năng.
  - Đánh thường làm chậm; S1 choáng mục tiêu đã bị chậm.
  - S2 cho giáp bong bóng nổ đẩy lùi.
  - S3 hồi máu đã mất.
  - S4 tầm 10/20/30 đv, bán kính 3.5/5/8, để lại vực xoáy.
  - Nhánh mới: Nước Mắt Nữ Thần, Thủy Thuẫn Niệm Chú, …
- **Chrono & Neo**:
  - băng đạn tăng theo cấp (Chrono 4→10, Neo 10→20); Neo bắn 2 viên mỗi lần;
  - Chrono S2 đánh dấu mục tiêu 12 đv rồi xả băng bất kể khoảng cách; Neo S3 để ảo ảnh bất tử, đổi chỗ mỗi 2s;
  - S4 khác hẳn theo thế: Chrono nở rộ 30 viên; Neo có ảnh chiếu xả cùng.
- **Gideon**:
  - S1 gồng hấp thụ đòn để tăng sát thương; S2 trói tới 1.6s;
  - S3 thành **Địa Chấn**: gồng càng lâu, nhận đòn càng nhiều thì nổ càng mạnh;
  - S4 nhảy 12/18/24 đv, gây sát thương chuẩn;
  - Cán Kiếm mạnh dần theo cấp; kháng đẩy 30%. Kháng đẩy là cơ chế chung mới (`hero.knockRes`), tướng nào cũng dùng được.

### AI nhận thức (`src/sim/ai/cognition.js`)
- **Chọn nhánh cây theo tiện ích, không còn ngẫu nhiên.** Lúc mở mỗi mốc, AI chấm điểm từng nhánh:
  `U = 0.35·Build + 0.30·Counter + 0.20·Zone + 0.15·Persona`
  - Build: nhánh hợp đồ đang lên (phép, đòn đánh hay trâu).
  - Counter: thành phần sảnh còn sống (≥3 xạ thủ, ≥2 tướng giáp dày, ≥2 tướng tàng hình hoặc ảo ảnh).
  - Zone: bo rộng ưu tiên farm và tốc; bo hẹp ưu tiên khống chế, cấm lướt, thoát chết.
  - Persona: tính cách. Ví dụ Kền Kền thích nhánh kết liễu, Chuột Lũi thích tàng hình và giáp.

  Lý do chọn hiện trên thẻ tướng ("chọn vì sảnh nhiều tướng giáp dày") và trong bảng tin từ mốc cấp 6. Mốc có ít hơn 3 nhánh vẫn chọn được. Nhánh HLV hoặc người chơi đã chọn sẵn (chế độ Solo) được giữ nguyên.
- **Trễ phản xạ theo kiểu tướng.** Sát thủ / đấu sĩ cơ động nhanh nhất; xạ thủ / đỡ đòn vừa; cuồng loạn chậm; pháp sư / hỗ trợ chậm nhất. Độ trễ này cộng thêm vào phản xạ hiện có.
- **Giật mình.** Trúng đòn từ kẻ đang tàng hình hoặc ngoài tầm nhìn thì đứng hình 0.25–0.5s (giữ nguyên hướng cũ).
- **Mù tiêu điểm.** Đang dí mục tiêu dưới 25% máu mà bị đánh từ sườn thì phản ứng chậm thêm 0.2–0.35s.
- **Hoảng loạn.** Máu tụt hơn 40% trong khoảng 0.5s thì:
  - 20% bấm nhầm chiêu (muốn chạy lại bấm chiêu đánh, hoặc ngược lại);
  - 25% chiêu định hướng lệch 15–40°.
- **Véc-tơ khả dụng của chiêu** (`G.Afford`): sát thương / cơ động / khống chế / phòng thủ, suy ra từ dữ liệu chiêu nên tự áp dụng cho tướng mới. Hiện dùng để chọn chiêu "bấm nhầm" khi hoảng loạn.

### Giao diện
- Thanh tài nguyên riêng (Náo Nhiệt, Đức Tin, Kiếm Khí, Điểm Hư Không…) vẽ dưới thanh máu và hiện trong thẻ tướng.
- Nội Năng của Tsukiyo hiện bằng thanh mana màu vàng.
- Bảng tin thêm hai loại: câu thoại quan hệ, AI nâng nhánh (kèm lý do).

## 2. Đo đạc (`docs/GD10_MO_PHONG.txt`, 48 trận, hạt `gd10`)
- **Thời lượng trận:** trung bình 32.3 phút, trung vị 31.6, ngắn nhất 20.3, dài nhất 44.4. Có 35% trận dưới 30 phút, 56% từ 30–40 phút, không trận nào hết giờ.
- **Văng / lỗi:** 0 trận văng, 0 lỗi kích hoạt. Tính tất định: hai lần chạy giống hệt nhau.
- **Giao tranh:** 18.4 lần hạ gục mỗi trận. Kền kền chiếm 8% số mạng (mục tiêu 20–30%, vẫn thấp như trước).
- **Tướng mới / làm lại** (hạng trung bình, tỷ lệ vô địch; kỳ vọng hạng 5.5, vô địch 10%):

  | Tướng | Hạng TB | Vô địch |
  |---|---|---|
  | Lyra | 2.4 | 22% |
  | Vesper | 2.9 | 23% |
  | Vector | 3.1 | 33% |
  | Alice | 3.5 | 0% |
  | Chrono & Neo | 3.9 | 29% |
  | Dahlia | 3.9 | 24% |
  | Mirage | 4.1 | 13% |
  | Caelus | 4.2 | 15% |
  | Boran | 4.9 | 38% |
  | Olivia | 5.3 | 0% |
  | Ariston | 5.3 | 0% |
  | Gideon | 5.7 | 8% |
  | Bạch Diệp | 5.7 | 27% |
  | Tsukiyo | 6.3 | 6% |
  | Luca | 6.5 | 8% |
  | Ratok | 6.8 | 0% |
  | Justus | 7.3 | 0% |
  | Kip | 7.8 | 0% |

- **Cân bằng thô đã làm:**
  - Bạch Diệp: +1% mỗi kiếm, trần +60%; phi kiếm yếu hơn.
  - Vector: Công 64 → 54; chí mạng gốc 50% → 40% (lệch tài liệu để cân bằng).
  - Vesper: dao S4 yếu dần theo số dao; Khóa Họng 0.75s.
  - Boran: máu 640 → 600, Công 66 → 62.
  - Luca: tăng máu và sát thương S1, S2.
  - Kip: tăng máu và Công; AI giữ 1 Điểm Hư Không.
- **AI nhận thức** (đo trên 1 trận mẫu): khoảng 40 lần "giật mình", 1 lần hoảng loạn (1 lần bấm nhầm, 7 lần lệch góc).
- Tỷ lệ cược (`src/data/odds.js`) đã sinh lại từ 48 trận này, đủ 40 tướng.

## 3. Chưa xong
- Mới chỉnh cân bằng thô các tướng mới và tướng làm lại. Tướng cũ yếu (Koda, Jack, Wukong, Valerius) **chưa đụng tới** vì cần sự đồng ý trước khi chỉnh tướng cũ.
- Đề xuất giảm sức mạnh Ryoma vẫn chờ đồng ý.
- Các mục AI trong tài liệu chưa làm:
  - kỷ luật âm thanh khi farm, nhử mồi / lừa góc cua;
  - logic boss theo tính cách (cửa sổ kết liễu);
  - điều khiển phân thân giả hành vi;
  - "Behavior Binding" sau khi nâng nhánh (ví dụ nâng nhánh đâm sau lưng thì đổi đường đi). Phần này mới có một phần qua `ai.flank` sẵn có.
- Bảng tỷ lệ cược đã sinh lại từ 48 trận GĐ10. Mỗi tướng chỉ có khoảng 10 trận nên tỷ lệ của tướng mới còn thô.

## 4. Con số khởi điểm mới
- 40 tướng. Trận trung bình 32 phút. 0 lỗi, 0 văng.
- Chiêu cuối: sát thương ×1.4, cộng 6s Bộc Phát (+20% sát thương, +15% tốc chạy).
- Nhánh cây kỹ năng chọn theo `U = 0.35·Build + 0.30·Counter + 0.20·Zone + 0.15·Persona`.
- Tướng yếu nhất: Koda 8.5, Borg 8.4, Valerius 7.9, Jack 7.8, Kip 7.8. Koda, Borg, Valerius, Jack là tướng cũ, chưa chỉnh vì cần sự đồng ý.
- Tướng mạnh nhất: Lyra 2.4, Aria 2.6, Vesper 2.9.

