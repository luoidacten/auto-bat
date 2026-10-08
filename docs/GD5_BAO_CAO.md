# Báo cáo Giai đoạn 5 — Bản cập nhật, meta, căng thẳng, sự cố, bán độ, bản tin

## Đã làm

### Bản cập nhật theo mùa (`src/sim/patch.js`)
- Sự nghiệp bắt đầu ở **bản 1.0** (gốc). Đầu mỗi mùa từ mùa 2 ra **bản S.0**; tuần 4 có 40% ra **bản nhỏ giữa mùa S.5** (chỉ giảm 1–2 tướng đang quá nổi).
- Bản đầu mùa dựa trên **thống kê mùa trước** (chọn / cấm / thắng của mọi ván, cả kết quả nhanh lẫn trận thật):
  - tướng thắng nhiều / bị cấm nhiều bị giảm (2–3 tướng), tướng ít ai dùng được tăng (2–3 tướng), cộng 0–1 thay đổi ngẫu nhiên → **4–7 tướng mỗi bản**;
  - **3–5 trang bị** (món dùng nhiều nhất mùa trước luôn bị giảm);
  - 30% đổi **một luật bản đồ** (quái lớn / quái cuối hồi sinh, vàng hạ gục, thời gian hồi sinh, máu trụ 1).
- Thay đổi tướng có nhiều kiểu: sát thương mọi đòn, sát thương một chiêu, hồi chiêu một chiêu, máu, công cơ bản, giáp & kháng phép — đều có giới hạn cộng dồn để không "phá game".
- **Ghi chú bản cập nhật đầy đủ** bằng tiếng Việt, gửi vào hộp thư + bản tin, có lịch sử các bản trước.
- Trận đấu mang theo bản cập nhật của nó (`cfg.patch`) → xem lại / mô phỏng lại luôn đúng phiên bản; trận thử ở menu luôn dùng bản gốc.

### Làm lại tướng — đổi cách chiêu hoạt động, không chỉ chỉnh số (`src/data/reworks.js`)
- 8 bản làm lại cho 7 tướng:
  - **Zero**:
    - S3 "Nhảy Lùi" → "Giáp Phản Lực": khiên + tăng tốc, không lướt;
    - S2 "Xả Băng" → "Phát Bắn Xuyên Thấu": một phát xuyên thấu.
  - **Ignatius**: dịch chuyển → lướt để lại vệt lửa.
  - **Koda**: chiêu cuối → "Săn Mồi Đêm": vồ, gây 3 tầng chảy máu, tàng hình.
  - **Elara**: mũi tên xuyên bản đồ → "Mưa Tên" theo vùng.
  - **Aria**: sóng âm hồi máu đồng minh thay vì gây sát thương.
  - **Gideon**: đứng gồng → lao tới.
  - **Valerius**: bất tử bản thân → khiên cả đội.
- **Bộ chiêu bản cũ vẫn nằm nguyên trong mã.** Bản làm lại chỉ thay chiêu trong bản sao của phiên bản đó, và bản sau có 40% đưa tướng **trở về bộ chiêu cổ điển**.

### Tướng mới
- Khung thêm tướng: đặt `unreleased: true, release: N` → tướng vào hàng chờ, bản đầu mùa từ mùa N có 70% phát hành.
  - Trước khi phát hành: không có trong cấm chọn, không có trong danh sách theo vị trí; thành thạo ban đầu của tuyển thủ chỉ 0–12.
- Tướng mới đầu tiên: **Lyra** (Đường giữa / Hỗ trợ, pháp sư sóng nước).
  - Nội tại "Thủy Triều": 3 lần trúng chiêu → trói chân.
  - S1 bong bóng làm chậm; S2 sóng đẩy lùi; S3 khiên + tăng tốc cho mình và đồng minh thấp máu; chiêu cuối cột nước hất tung.
  - Có đủ cây tiến hóa 5 mốc. Phát hành từ mùa 2.

### Meta & đội máy thích nghi chậm/nhanh khác nhau (`src/manager/meta.js`)
- **Kết quả nhanh giờ có cấm chọn**:
  - mỗi ván đội máy cấm 2 / chọn 5 bằng AI cấm chọn;
  - sức mạnh tướng thật = dữ liệu cũ + ảnh hưởng các bản cập nhật;
  - đội chọn đúng tướng mạnh của bản hiện tại thắng nhiều hơn.
- HLV máy chọn theo meta **họ thấy**:
  - hiểu biết = độ thích nghi (0.3–1) × (số tuần từ khi ra bản + 1) / 3;
  - HLV nhạy bén bắt kịp sau 1–2 tuần, HLV chậm cả mùa vẫn chọn theo bản cũ.
- **Người chơi có lợi thế khi đọc ghi chú**: thấy dấu ▲▼⟳🆕 ngay trong màn cấm chọn và bảng meta.
- Thống kê tướng & trang bị theo mùa (mùa này / mùa trước) — dữ liệu cho bản cập nhật sau.

### Căng thẳng & sự cố (`src/manager/incidents.js`)
- Stress **tăng** khi:
  - thua (cả kết quả nhanh);
  - lịch tập dày;
  - ngồi dự bị lâu (Ngôi Sao nặng hơn);
  - lương thấp hơn giá trị (Ham Tiền nặng hơn);
  - chuỗi thua;
  - tuần đá vòng loại trực tiếp / quốc tế;
  - cãi nhau.
- Stress **giảm** khi: nghỉ, thắng, được tăng lương khi gia hạn, xử lý tốt sự cố.
- Stress cao → phong độ giảm (đã có từ GĐ4) và sinh **sự cố qua hộp thư, mỗi sự cố có 3 lựa chọn**:
  - **Xin nghỉ thi đấu**: cho nghỉ tuần này (không ra sân — thiếu người thì vẫn phải đá) / thuyết phục / từ chối.
  - **Đòi ra đi**: tăng lương 25% / đưa lên danh sách chuyển nhượng / từ chối.
  - **Cãi nhau** giữa 2 người đá chính: nói chuyện (70% thành công) / phạt nội bộ (4 tuần yên ổn) / mặc kệ (ăn ý giảm mạnh).
  - Sự cố hiện ra đầu tuần; không xử lý trước khi bấm kết thúc tuần → tự áp lựa chọn cuối.
- Trung tâm HLV cảnh báo sự cố đang chờ, người đang nghỉ, bản cập nhật vừa ra. Đội hình đánh dấu 😴 người nghỉ.

### Bán độ
- **Hiếm**: ~0.15%/tuần/người bình thường. Dễ hơn nhiều khi stress cao, lương thấp, Ham Tiền (×3), Tín Nhiệm thấp, Tâm Lý yếu; tối đa 2.5%.
- Người bán độ **cố tình chơi tệ ngay trong trận**:
  - đánh giá giao tranh sai, lao vào trận thua → **chết vô lý**;
  - không chịu lùi;
  - **bỏ mục tiêu** nửa thời gian;
  - "trượt" trừng phạt.
  - Trong kết quả nhanh: đội yếu đi.
- **Dấu hiệu lộ qua thống kê**: chết nhiều bất thường so với đồng đội. Người bình thường đá tệ cũng có thể bị nghi oan.
- Đủ nghi ngờ → thư "Dấu hiệu bất thường" → **điều tra** (tốn tiền, 85% tìm ra bằng chứng) hoặc bỏ qua. Có bằng chứng thì chọn:
  - **Kỷ luật nội bộ**: phạt 4 tuần lương, giữ người, 30% tin rò rỉ về sau.
  - **Báo ban tổ chức**: người đó bị cấm tới hết mùa sau và rời đội; ban lãnh đạo +6, người hâm mộ ủng hộ.
  - **Bỏ qua**: báo chí phanh phui sau 1–5 tuần → bị cấm, ban lãnh đạo −22, mất 8% người hâm mộ.
- **Đội máy cũng dính bê bối** (~1 vụ mỗi mùa toàn thế giới) → bản tin. Người bị cấm không ký được, hết án thì về chợ tự do.

### Hack (easter egg)
- **Cực hiếm**: 0.3%/tuần ≈ 4%/mùa.
- 6 tin vui, ví dụ: kính lúp dán màn hình, mèo nằm trên bàn phím bị cấm thi đấu 1 tuần, HLV "hack" vì… chịu đọc ghi chú bản cập nhật.
- Không ảnh hưởng gì tới trò chơi.

### Bản tin (thẻ mới "📰 Bản tin")
- **Tin tức**: bản cập nhật, bê bối, hack, nhà vô địch từng hạng & thế giới, **giải nghệ** đáng chú ý, **tân binh** triển vọng.
- **Bản cập nhật**: ghi chú đầy đủ theo nhóm (tướng mới / làm lại / tướng / trang bị / bản đồ) + các bản trước.
- **Meta**: bảng có mặt / chọn / cấm / thắng của từng tướng, mùa này và mùa trước.

## Số đo (ít, theo dặn — chi tiết `docs/GD5_MO_PHONG.txt`)
- **Tất định & phát lại**: ✔ (`tools/mophong.js --kiemtra`).
  - Trận có đủ 7 bản làm lại + Lyra + đổi trang bị / luật: tất định, 0 lỗi.
  - Mọi chiêu làm lại và chiêu của Lyra đều được AI dùng trong trận.
  - Sau trận dữ liệu tướng / trang bị / luật trở về đúng bản gốc.
- **Bản cập nhật sinh ra** (3 mùa):
  - bản đầu mùa 10–13 thay đổi;
  - bản giữa mùa 1–2 thay đổi;
  - Lyra phát hành ở bản 2.0 hoặc 3.0;
  - meta đổi rõ giữa các mùa (tướng có mặt nhiều nhất bị giảm và tụt tỉ lệ thắng mùa sau).
- **Cấm chọn trong kết quả nhanh**: lệch trung bình giữa hai bên ≈ 0 (không thiên vị phe chọn trước); độ lệch chuẩn 0.23 logit ≈ ±6% tỉ lệ thắng mỗi ván. Thêm ~2 ms mỗi ván.
- **Sự cố đội bạn**:
  - lịch tập mặc định (có 1 buổi nghỉ) → stress ~0, **không có sự cố**;
  - lịch **không nghỉ** → ~7 lần xin nghỉ + ~2 vụ cãi nhau mỗi mùa;
  - bán độ khởi phát 2 lần / 4 mùa căng thẳng.
- **Chuỗi bán độ** (ép khởi phát):
  - trợ lý phát hiện dấu hiệu sau 3–4 tuần; cả 3 lựa chọn chạy đúng hậu quả;
  - có trường hợp người bán độ tự dừng trước khi lộ.
- **Kinh tế 3 mùa (`tools/mua.js`)**: không đội nào âm quỹ, điểm đội hình các hạng ổn định như GĐ4. Bản lưu 243 KB; ~1.8 s/mùa.

## Con số "khởi điểm" đã đổi / quyết định mới (báo anh)
1. **Kết quả nhanh có thêm cấm chọn**: logit mỗi ván cộng 4 × (chênh sức mạnh đội hình tướng). Sức mạnh tướng = (tỉ lệ thắng dữ liệu cũ − 50%) × 0.5 + ảnh hưởng bản cập nhật. Mô hình sức mạnh GĐ4 (SCALE 9.5) giữ nguyên.
2. **Stress đội máy** giờ đổi theo kết quả nhanh: thua +2.5, thắng −2. Trước đây đứng yên.
3. **Nguồn stress mới cho đội bạn**: dự bị +4/tuần (Ngôi Sao +6); lương < 72% mức đòi +3 (Ham Tiền +5); chuỗi thua +1.5; tuần đá loại trực tiếp/quốc tế +4 (Dễ Nóng +6). Gia hạn có tăng lương: −8.
4. **Sức mạnh kết quả nhanh**: −1.2 cho mỗi người đang bán độ trong đội hình ra sân.
5. **Thế giới mới cùng hạt giống sẽ khác GĐ4**: thêm tướng Lyra nên thứ tự sinh thành thạo đổi. Bản lưu GĐ4 vẫn chơi tiếp được (tự bổ sung bản 1.0 khi mở).
6. Người chơi có ≤ 5 người: người được cho nghỉ vẫn phải ra sân khi không đủ người thay.

## Việc còn dở (để GĐ6)
- **Cân bằng thật** cho 8 bản làm lại và Lyra bằng mô phỏng lớn. Hiện "ảnh hưởng ước lượng" (est) của từng thay đổi dùng cho kết quả nhanh là số ước đoán; GĐ6 nên đo trận thật để hiệu chỉnh.
- Mới có 1 tướng mới trong hàng chờ. Khung đã sẵn sàng, cần thêm tướng cho các mùa sau (1–2 mùa một tướng).
- Bê bối ở đội máy mới dừng ở mức bản tin + cấm người. Chưa có kiểu "trận đấu bị xử thua".
- Chưa có thông báo đẩy khi sự cố tự áp mặc định. Kết quả hiện ở thư cũ với ghi chú "(Không xử lý kịp — mặc định)".
- Phần thời lượng trận 30–35 phút từ GĐ4 vẫn để GĐ6.
