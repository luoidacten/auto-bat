# Đối chiếu tướng và bộ chiêu bổ sung vào Legacy

**Cập nhật triển khai:** Legacy hiện có **40/40 tướng**, không còn tướng thiếu theo `npm run check:roster`. 14 bộ chiêu chuyển thể nằm trong [content/new-heroes.js](../content/new-heroes.js). Phần đối chiếu 26/40 bên dưới giữ làm mốc ban đầu; thứ tự đợt là lịch sử thiết kế. Xem [báo cáo triển khai](TRIEN_KHAI.md) để biết phạm vi đã chạy và giới hạn.

Đối chiếu tại commit nền `9b082a34fcfc5f95378faaedc9cd58cadd868215`, ngày 28/10/2026. Có thể chạy lại từ `legacy/` bằng `npm run check:roster`.

## Kết quả đối chiếu ban đầu

| Nội dung | Số lượng |
| --- | ---: |
| Tướng chơi được trong Battleground | 40 |
| Tướng trong roster Legacy | 26 |
| Tướng chung sau chuẩn hóa ID | 26 |
| Battleground có, Legacy thiếu | **14** |
| Chỉ có trong Legacy | 0 |

Legacy có 65% danh sách Battleground, thiếu 35%. Đây là độ phủ **nhân vật**, không phải đánh giá độ giống bộ chiêu hay lượng công việc: 26 tướng chung vẫn cần rà soát điều khiển và cân bằng.

Nguồn đếm là roster thực tế [03c-roster.js](../content/03c-roster.js) và registry `G.HEROES` được nạp qua [tools/nap.js](../../tools/nap.js), bỏ dummy và tướng ẩn. Không đếm số tệp, vũ khí, vật triệu hồi hoặc hình thái thành tướng riêng.

Ngoại lệ quan trọng: **Chrono & Neo = `songluc` trong Legacy, `chrononeo` trong Battleground**. Aria & Oktava và Roxie & T-Zero mỗi cặp cũng chỉ là một mục roster.

26 tướng đã có: Valerius, Theron, Florian, Ignatius, Gideon, Aria & Oktava, Koda, Death, Elara, Percy, Borg, Roxie & T-Zero, Alice, Ryoma, Wukong, Kazuki, Zero, Chrono & Neo, Victoria, Clint, Jack, Joker, Vesper, Raven, Diệp Thanh Phong, Galo.

## Quy tắc chuyển bộ chiêu

Legacy dùng điểm văng %, lực đẩy và mất mạng khi rơi đài; Battleground dùng máu, Hộ Giáp, cấp, trang bị và bo. **Giữ bản sắc tướng, thiết kế lại thông số và tương tác cho Legacy**; không chép nguyên module `src/data/heroes/` vào engine cũ.

- Duy trì vai trò bộ chiêu Legacy: A tích điểm, B ép/kết liễu, C thủ/cơ động, D đặc kỹ, U Nộ. `sub` của Battleground là đầu vào thiết kế D; tướng không có `sub` cần một D được thiết kế riêng.
- Các mô tả A/B/C/D/U bên dưới là thiết kế gốc; bản chuyển thể đã có mã, chưa phải cân bằng đã đo với người chơi thật. Quy đổi sát thương sang điểm văng, hồi máu sang giảm điểm văng có trần; khiên sang hấp thụ điểm/lực văng hữu hạn. Không hồi số mạng.
- Đổi khoảng cách từ đơn vị bản đồ Battleground sang kích thước sàn Legacy bằng thử nghiệm; không dùng một hệ số cố định cho tất cả chiêu.
- Dịch chuyển, đổi chỗ, kéo đồng minh và tua ngược phải quy định vị trí hợp lệ, tương tác mép sàn, mục tiêu chết và vật cản. Không cho kỹ năng cứu người đã bị xác nhận KO.
- Mọi quyết định ảnh hưởng trận đấu do engine/máy chủ kiểm tra. Người chơi tự chọn hướng và mục tiêu; bot offline gửi cùng định dạng lệnh.
- Mỗi tướng phải có mô tả, hình/VFX, tài nguyên đặc trưng, tài liệu điều khiển PC/cảm ứng, bot offline và ca kiểm tra riêng. Talent/trang bị mới làm sau bộ chiêu nền; online dùng cấu hình cân bằng chuẩn.

## 14 tướng còn thiếu

Các đợt dưới đây diễn ra sau khi nền điều khiển và engine đã có kiểm tra. Thứ tự dựa trên phụ thuộc kỹ thuật, chưa phải ước lượng lịch phát hành.

| Đợt | Tướng / nguồn | Bản sắc và bộ chiêu dự kiến trong Legacy | Ca kiểm tra bắt buộc |
| --- | --- | --- | --- |
| 1 | **Boran** — [boran.js](../../src/data/heroes/boran.js) | A song rìu; B xoay rìu ép mép; C Tuyết Lở lao; D tích/xả Băng Cổ để đổi phòng thủ lấy sức ép; U Băng Ma biến hình. Giữ trọng lượng và băng hóa. | Va cột, bị ngắt lao, hết biến hình khi đang văng, không cộng trọng lượng vô hạn. |
| 1 | **Ariston** — [ariston.js](../../src/data/heroes/ariston.js) | A Liệt Đao; B Đại Kiếm ép văng; C Thế Thủ; D Lời Nguyện có thể ngắt; U Đại Phán Quyết. Giữ Đức Tin và kiếm nặng. | Phản đòn đúng thời điểm; ngưỡng điểm văng không biến U thành KO tự động; không miễn rơi đài. |
| 1 | **Dr. Vector** — [vector.js](../../src/data/heroes/vector.js) | A chuỗi laser có băng; B tia kết liễu cần ngắm; C Bom Từ Tính; D nạp đạn/radar theo trạng thái; U Pháo Laser. | Băng đạn do server quản lý; hướng xuyên địa hình có báo trước; radar không tạo nhắm tự động. |
| 1 | **Lyra** — [lyra.js](../../src/data/heroes/lyra.js) | A Bong Bóng; B Sóng Dâng đẩy; C Dòng Chảy hộ thân; D xả Thủy Triều/giáp bong bóng; U Đại Hồng Thủy có cảnh báo. | Hút rồi đẩy không lặp vô hạn; cứu ở mép có giới hạn; giảm điểm văng không thành bất tử. |
| 2 | **Ratok** — [ratok.js](../../src/data/heroes/ratok.js) | A Móc Sắt bấm lại để kéo; B Bộc Phá Húc; C Tử Xích phòng thủ; D chủ động thả xích/đổi thế; U Tàn Phá Thế Giới. | Móc qua cột, chủ móc rơi đài, mục tiêu chết, kéo đồng thời và giới hạn chiều dài xích. |
| 2 | **Kip** — [kip.js](../../src/data/heroes/kip.js) | A Phi Đao; B xuyên không đánh sau lưng; C Vết Nứt trở về; D Vòm Xoáy; U Lãnh Địa Đa Chiều. Giữ tài nguyên Hư Không. | Neo hợp lệ, recast hết hạn, nuốt/phản đạn có owner chuẩn, không teleport ra vùng không phục hồi được. |
| 2 | **Olivia** — [olivia.js](../../src/data/heroes/olivia.js) | A Dây Dẫn; B Thánh Trận chậm nổ, lực đẩy vừa; C Thánh Hộ; D Ý Chí Thần Quan; U Ban Phước. Giảm điểm văng thay cho hồi máu. | Chọn rõ đồng minh/địch; cứu đồng minh không ép họ rơi; hồi phục có trần; vẫn chơi được solo. |
| 2 | **Justus** — [justus.js](../../src/data/heroes/justus.js) | A Tam Kiếm; B tia Phán Quyết; C Thánh Quang Hộ Thể; D thanh tẩy dùng Đức Tin; U Trận Địa. | Tia bị ngắt đúng luật, cảnh báo đủ đọc, giới hạn hồi Đức Tin và chuỗi thanh tẩy. |
| 3 | **Mirage** — [mirage.js](../../src/data/heroes/mirage.js) | A Tàn Ảnh; B Phi Dao Hoán Vị; C Hộp Tử Thần; D Biến Ảnh/Phân Hình; U Phân Thân Hoàn Hảo. | Phân thân có ID/owner; đổi chỗ bị hủy khi KO; giới hạn số lượng; đồng bộ nổ trễ đúng tick. |
| 3 | **Dahlia** — [dahlia.js](../../src/data/heroes/dahlia.js) | A Đôi Ảnh; B Mũ Đen phản kích; C Thoát Nguy; D điều lệnh/đổi trạng thái ảo ảnh; U Sân Khấu Chết Chóc. | Không biến người chơi thành bot; không chiếm quyền nhân vật khác; trần ảo ảnh và sạch entity khi kết thúc. |
| 3 | **Luca** — [luca.js](../../src/data/heroes/luca.js) | A Sân Khấu/Bước Nhảy; B Ánh Đèn phản kích; C Hoán Vị Ảnh Hồng; D Hoán Đổi Bộ Chiêu; U Cải Trang. | Sao chép theo danh sách tương thích, cooldown hai bộ độc lập, không chép controller/stock/owner, hoàn nguyên khi KO. |
| 4 | **Dr. Caelus** — [caelus.js](../../src/data/heroes/caelus.js) | A Ma Trận; B Laser; C Phản Xạ; D chọn/chốt mục tiêu tua ngược; U Nghịch Đảo Dữ Liệu. | Lịch sử 3.5s theo tick; quy tắc % và vận tốc; cấm khôi phục stock hoặc hồi sinh người đã KO; không tua lại cả server. |
| 4 | **Bạch Diệp** — [bachdiep.js](../../src/data/heroes/bachdiep.js) | A Loạn Trảm; B Kiếm Trận; C Kiếm Hộ Pháp; D chọn thế kiếm; U Thiên Kiếm Trận. | Trần phi kiếm/entity, tách hiệu ứng khỏi hitbox, không làm trễ tick khi spam; người chơi chọn thế U. |
| 4 | **Tsukiyo** — [tsukiyo.js](../../src/data/heroes/tsukiyo.js) | A/B/C đổi theo nhẫn thuật; D chủ động chọn hệ/thế; U tối thượng theo hệ. Không để AI tự chọn bộ chiêu thay người chơi. | Quy tắc đổi hệ và cooldown rõ ràng; phản đạn không đệ quy; phân thân không thành slot người chơi; HUD đọc được trên điện thoại. |

## Điều kiện hoàn thành mỗi đợt

1. Bộ chiêu đã chạy bằng điều khiển thật, bằng bot offline và qua server; không chỉ thêm tên vào roster.
2. Kiểm tra dùng chiêu hợp lệ, recast, khống chế, KO, hồi sinh theo stock và dọn entity; so offline/online với cùng input fixture và seed.
3. Thử solo và đội khi chế độ đội đã được triển khai; thử mép sàn, góc/cột và đạn dày. Test đội chưa có phải ghi là chưa chạy, không chặn MVP 1v1 một cách giả tạo.
4. Kiểm tra PC, màn hình cảm ứng, phản hồi input và VFX báo trước. Cân bằng sau khi đo, không lấy tỷ lệ thắng từ mẫu vài trận làm kết luận.
5. Báo cáo roster tăng đúng số: 26 → 30 → 34 → 37 → **40**. Các tướng chưa được bật phải có trạng thái rõ, không tự thêm bot để lấp chỗ online.
