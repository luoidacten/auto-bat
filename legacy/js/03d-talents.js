'use strict';
// ===== Nội tại phân nhánh 1 - 3 - 6 - 9 - 12 (chọn 1 trong 3 ở mỗi mốc cấp) =====
// Lv1 nền tảng • Lv3 biến chuyển • Lv6 chiêu mới (thay thế / tái kích hoạt) • Lv9 thức tỉnh • Lv12 phong cách mới
// Hiệu ứng: phần chung nằm trong TALENT_FX (móc vào Fighter/Match), phần gắn với chiêu thức kiểm tra f.T(id) ngay trong mã vũ khí.
const TALENT_TIERS = [1, 3, 6, 9, 12];
const TALENTS = {
  valerius: [
    [['Trụ Vững', '+15% kháng đẩy lùi cơ bản.'],
     ['Phản Xạ Binh Nghiệp', 'Đỡ đòn thành công bằng Khiên Chắn (C) giảm 1s hồi chiêu A và B.'],
     ['Xung Kích', '+20% tốc chạy khi tiến thẳng về phía kẻ địch.']],
    [['Khiên Gai', 'Khi đang giơ khiên (C): phản lại 40% sát thương & lực đẩy cho kẻ tấn công.'],
     ['Chấn Địa', 'Cú húc khiên kết thúc C rộng gấp đôi, dài hơn 50% và hất văng xa hơn 30%.'],
     ['Giáp Bất Diệt', 'Khi đứng yên (hoặc đứng tại chỗ ra đòn): giảm thêm 25% điểm văng nhận vào.']],
    [['Bất Khuất', 'Khi điểm văng vượt 100%: tự động nhận Thiết Thân 2.5s (hồi 30s).'],
     ['Chiến Ý Hoàng Gia', 'Trong thời gian Nộ (Chiến Thần Bất Tử): mọi đòn đánh gây Choáng 0.5s.'],
     ['Áp Chế Tuyệt Đối', 'Cú húc khiên C đẩy địch đập vào tường/cột: thêm Câm Lặng 2s.']],
  ],
  elara: [
    [['Bộ Pháp Tinh Linh', 'Tốc chạy khi lùi xa khỏi địch tăng từ +25% lên +40%.'],
     ['Ưng Nhãn', 'Tầm bắn của A, B, D tăng thêm 20%.'],
     ['Liên Xạ Thần Tốc', 'Chiêu A bắn 4 mũi tên (thay vì 3).']],
    [['Băng Vĩnh Cửu', 'Sao băng của C làm chậm 70% (thay vì 45%) và kéo dài 3s.'],
     ['Mũi Tên Xuyên Phá', 'Mũi tên Kéo Căng Dây (B) luôn xuyên thấu và bay xuyên qua cột/tường.'],
     ['Thuận Phong', 'Lướt lùi bằng C lập tức hồi lại Liên Xạ (A) và Tên Hình Nón (D).']],
    [['Tập Trung Tuyệt Đối', 'Kéo dây (B) không còn bị giảm tốc chạy.'],
     ['Băng Phong Toàn Vực', 'Mũi tên Nộ Trói Chân + Câm Lặng 1.5s mọi kẻ địch trên đường bay.'],
     ['Cung Thủ Tối Thượng', 'Đã Tập Trung thì giữ nguyên trạng thái — tấn công không còn đặt lại nội tại.']],
  ],
  florian: [
    [['Vũ Bước', 'Cú lướt nội tại (E) xa hơn 25%.'],
     ['Điệu Nhảy Chuẩn Xác', 'Phá 1 dấu ấn: +10% tốc chạy trong 2s.'],
     ['Khai Màn Thanh Lịch', 'Phản đòn (C) thành công lập tức hồi lại cú lướt E.']],
    [['Hư Ảnh Trùng Điệp', 'Phân ảnh của chiêu B phát nổ khi biến mất, gây sát thương & đẩy lùi xung quanh.'],
     ['Tử Huyệt', 'Đánh trúng đúng hướng dấu ấn: gây thêm Chảy Máu 3s.'],
     ['Điệu Nhạc Bất Tử', 'Phá ấn (3/4): nhận 1s miễn nhiễm hoàn toàn sát thương.']],
    [['Cao Trào Sân Khấu', 'Nộ kéo dài 6s (thay vì 4s); mỗi đòn trúng trong Nộ giảm 1s hồi chiêu C.'],
     ['Phản Đòn Hoàn Mỹ', 'Phản đòn thành công gây Choáng 1.5s cho MỌI kẻ địch xung quanh.'],
     ['Vũ Điệu Tử Thần', 'Đòn cường hóa sau khi phá 4 ấn đẩy x3.2 (thay vì x2.3).']],
  ],
  borg: [
    [['Kích Động', 'Điểm văng trên 60%: +15% tốc chạy.'],
     ['Cơ Bắp Thép', '+10% trọng lượng cơ thể.'],
     ['Móc Nhanh', 'Đấm Móc (A) hồi chiêu 0.3s (thay vì 0.5s).']],
    [['Hấp Thụ Triệt Để', 'Sát thương hút được khi Gồng (C) chuyển thành Khiên ảo 3s.'],
     ['Quật Ngã Tàn Bạo', 'Chộp & Quật (D) gây Choáng 1.5s (thay vì 1s).'],
     ['Cú Đấm Nhiệt Lượng', 'Trả Đòn (B) luôn gây Thiêu Đốt.']],
    [['Đấu Trường Bất Bại', 'Trong võ đài của Nộ: Borg miễn nhiễm mọi hiệu ứng khống chế.'],
     ['Cú Đấm Ngàn Cân', 'Trả Đòn sau khi đã Gồng hút sát thương: x3 lực đẩy (Finisher tức thì).'],
     ['Nổi Điên', 'Từ 120% điểm văng: mọi đòn đánh đều hất tung kẻ địch.']],
  ],
  roxie: [
    [['Từ Tính', 'Hút bánh răng trên sàn trong bán kính rộng.'],
     ['Lắp Ráp Nhanh', 'Cứ 2 bánh răng ghép được 1 Mảnh cơ giới (thay vì 3).'],
     ['Phản Pháo', '"Bất Ngờ Chưa" (C) lộn lùi xa hơn 20%.']],
    [['Vết Dầu Loang', 'Kích nổ Ụ Pháo (B) để lại vũng dầu làm chậm 50% trong 3s.'],
     ['Gia Cố Khung Gầm', 'T-Zero (lái hoặc tự hành) nặng hơn 30%.'],
     ['Xung Điện Cao Áp', '"Bất Ngờ Chưa" gây Choáng 1.3s (thay vì 0.8s).']],
    [['Lõi Quá Tải', 'Vụ nổ Tự Hủy của T-Zero rộng gấp rưỡi và đẩy mạnh hơn 50%.'],
     ['Tự Động Hóa Tối Tân', 'Duy trì tối đa 2 Ụ Pháo cùng lúc.'],
     ['Cơ Giới Thần Tốc', 'Khi lái T-Zero: Siêu Giáp vĩnh viễn, Phun Lửa (B) gây thêm Làm Chậm.']],
  ],
  jack: [
    [['Tay Cờ Bạc Chuyên Nghiệp', 'Xúc xắc ra ⚀ không còn tự nhận điểm văng.'],
     ['Thay Đạn Nhanh', '+35% tốc chạy trong lúc nạp lại ổ đạn.'],
     ['Đạn Nặng', 'Phát bắn thường (A) đẩy lùi mạnh hơn 20%.']],
    [['Tăng Tỷ Lệ Nhà Cái', 'Tỷ lệ xúc xắc ra ⚅ tăng gấp đôi.'],
     ['Xả Hết Vốn', 'Viên cuối cùng của Quạt Cò (B) chắc chắn gây Choáng 0.75s.'],
     ['Thần May Mắn Hộ Mệnh', 'Mỗi lần bóp cò trượt ở Cò Quay Nga: nhận Khiên nhỏ 1s.']],
    [['Viên Đạn Sinh Tử', 'Viên đạn Cò Quay Nga gây 1000% sát thương; mục tiêu trên 70% điểm văng bị văng khỏi sàn ngay lập tức.'],
     ['Ván Bài Lật Ngửa', 'Chỉ cần 67% thanh Nộ để mở "Nhà Cái Trả Thưởng".'],
     ['Tất Tay (All-in)', 'Khi bản thân trên 100% điểm văng: mọi phát A có 50% chí mạng x2 lực văng.']],
  ],
  death: [
    [['Lưỡi Tử Thần', 'Phần Lưỡi Liềm (điểm ngọt) dài thêm: chỉ 20% gần nhất là Cán (thay vì 35%).'],
     ['Mùi Máu Tươi', '+20% tốc chạy khi tiến về kẻ địch đang trên 70% điểm văng.'],
     ['Gặt Nhanh', 'Gặt (A) hồi chiêu nhanh hơn 0.3s.']],
    [['Xoáy Hút Linh Hồn', 'Xoay Liềm (C) hút kẻ địch về tâm mạnh gấp đôi.'],
     ['Lưỡi Kéo Tàn Phế', 'Kéo trúng bằng Lưỡi Hái (D): thêm Trói Chân 0.75s.'],
     ['Cắt Đứt Hy Vọng', 'Gặt (A) hất tung kẻ đang bị kéo cao hơn 40%.']],
    [['Án Tử Tức Thì', 'Phán Quyết (B) kích hoạt Tử Vong từ 75% điểm văng (thay vì 100%).'],
     ['Tam Vị Nhất Thể', 'Gọi Hồn triệu hồi 3 bóng ma (thay vì 2).'],
     ['Thu Hoạch Linh Hồn', 'Mỗi lần đánh văng kẻ địch khỏi sàn: giảm 20 điểm văng của bản thân.']],
  ],
  ryoma: [
    [['Lưu Thủy', 'Thuấn Bộ (C) hồi chiêu 1.5s (thay vì 2s).'],
     ['Khai Kiếm', 'Nhất Đao (A) mở đầu chuỗi combo rộng hơn 20%.'],
     ['Thấu Kính', 'Đột Thích (B) đâm xa hơn 25%.']],
    [['Hư Ảnh Trùng Kích', 'Combo AC tạo thêm 1 hư ảnh phụ chém quét ở phía đối diện.'],
     ['Trảm Khí Xuyên Giác', 'Kiếm Khí (D) bay nhanh hơn 50% và gây Câm Lặng 1s.'],
     ['Chấn Xung Lực', 'Sau combo BB, đòn đánh kế tiếp tăng 40% lực đẩy.']],
    [['Tâm Kiếm Độc Tôn', 'Chỉ cần 4 combo để mở Nộ (thay vì 5).'],
     ['Nhất Kiếm Định Âm', 'Kích hoạt Nộ lập tức Trói Chân mọi kẻ địch trên sàn 1s.'],
     ['Kiếm Vô Tận', 'Tung Kiếm Khí (D) xong lập tức hồi lại Thuấn Bộ (C).']],
  ],
  vesper: [
    [['Bộ Pháp Vô Hình', 'Ẩn Thân (C) tăng tốc chạy +75% (thay vì +50%).'],
     ['Độc Ăn Mòn', 'Độc của Phi Dao (D) tăng điểm văng nhanh hơn 30%.'],
     ['Đoản Đao', 'Chém Nhanh (A) hồi chiêu 0.35s (thay vì 0.5s).']],
    [['Tử Huyệt Sau Lưng', 'Đánh sau lưng: x2.5 điểm văng (thay vì x2) và đẩy mạnh hơn.'],
     ['Ám Kích Chớp Nhoáng', 'Tái kích hoạt D dịch chuyển ra sau lưng gây MÙ 1.5s (đối thủ mất dấu, ngắm lệch).'],
     ['Bóng Ma Mất Dấu', 'Đánh văng kẻ địch khỏi sàn: lập tức Ẩn Thân 2s.']],
    [['Bão Dao Đoạt Mệnh', 'Nộ phóng 14 con dao (thay vì 10).'],
     ['Sát Thủ Hoàn Hảo', 'Đòn sau lưng kế tiếp từ Nộ gây x4 điểm văng (thay vì x3).'],
     ['Thế Thân', 'Dính đòn có nguy cơ bay khỏi sàn: để lại khúc gỗ thế thân và thoát ra (hồi 45s).']],
  ],
  gideon: [
    [['Mũi Kiếm Chuẩn Xác', 'Điểm Ngọt mở rộng từ 22% lên 32% ngoài cùng tầm kiếm.'],
     ['Khúc Trọng Lực', 'Quét Ngang (A) gồng 0.15s (thay vì 0.3s).'],
     ['Thiết Thân', 'Khi đứng yên: +20% kháng đẩy lùi.']],
    [['Trói Đinh Ngàn Cân', 'Bổ Dọc (B) trúng Điểm Ngọt Trói Chân 1.25s (thay vì 0.5s).'],
     ['Húc Văng Cán Kiếm', 'Cán Kiếm (D) đẩy địch xa gấp đôi và gây Câm Lặng 1s.'],
     ['Kiên Cố Tuyệt Đối', 'Thế Thủ (C) giảm 70% điểm văng & lực đẩy nhận vào (thay vì 55%).']],
    [['Trảm Khí Khai Thiên', 'Đòn cường hóa sau Thế Thủ phóng thêm sóng kiếm khí tầm xa x1.5.'],
     ['Đại Địa Chấn', 'Nộ gây thêm Choáng 1.5s cho mọi kẻ địch đứng trên mặt đất.'],
     ['Chém Gãy Thần Binh', 'Trúng Điểm Ngọt kẻ địch trên 80%: x3 lực đẩy (thay vì x2).']],
  ],
  ignatius: [
    [['Hỏa Tốc', 'Cầu Lửa (A) bay nhanh hơn 40%.'],
     ['Thiêu Rụi', 'Thiêu Đốt của nội tại đốt điểm văng nhanh hơn 25%.'],
     ['Bộ Pháp Chớp Nhoáng', 'Dịch Chuyển (C) xa hơn 30%.']],
    [['Biển Lửa Giam Cầm', 'Vòng Lửa (D) Trói Chân 0.75s kẻ địch trúng lần đầu (mỗi 4s một lần).'],
     ['Hư Ảnh Cháy Bùng', 'Vị trí cũ sau khi Dịch Chuyển phát nổ, đẩy lùi kẻ địch xung quanh.'],
     ['Đại Hỏa Cầu Phá Đạn', 'Đại Hỏa Cầu (B) thiêu hủy mọi đạn đạo bay qua nó.']],
    [['Hỏa Ngục Bất Diệt', 'Kẻ địch trúng đòn bị Hỏa Ngục: đốt điểm văng không bao giờ tắt cho tới khi bay khỏi sàn.'],
     ['Thiên Thạch Tận Thế', 'Thiên Thạch nổ rộng gần gấp đôi; kẻ địch ở tâm vụ nổ bị Choáng 2s.'],
     ['Tia Lửa Ma Thuật', 'Dịch Chuyển (C) lập tức hồi lại Cầu Lửa (A).']],
  ],
  percy: [
    [['Bộ Đếm Tinh Vi', 'Chuỗi Dồn Dập được giữ 3.5s (thay vì 2s) khi không bắn trúng.'],
     ['Tầm Bắn Thần Tốc', 'Tầm bắn của A và Trận Địa Nỏ (D) tăng 25%.'],
     ['Cơ Động Lách Trận', 'Lướt Chiến Thuật (C) hồi chiêu 3.5s (thay vì 5s).']],
    [['Dây Cáp Điện Cao Thế', 'Móc & Đạp (B) trúng địch đang lướt/bay/tăng tốc: Câm Lặng 2s và giật Choáng 1s.'],
     ['Ụ Súng Gia Cố', 'Rời Trận Địa Nỏ: trận địa vẫn tiếp tục tự bắn thêm 2s tại chỗ cũ.'],
     ['Mũi Tên Gỉ Sét', 'Tên của Trận Địa Nỏ làm chậm 40%.']],
    [['Bão Tên Vô Hạn', 'Trong Nộ (Liên Châu), Trận Địa Nỏ bắn 9 mũi tên mỗi đợt.'],
     ['Móc Kép Tinh Xảo', 'Móc & Đạp (B) có 2 lần dùng liên tiếp.'],
     ['Công Nghệ Áp Chế', 'Địch dính Móc & Đạp rồi trúng tên Trận Địa trong 3s: bị CẤM LƯỚT/dịch chuyển 3s.']],
  ],
  zero: [
    [['Thay Đạn Chiến Thuật', 'Nạp đạn 5s (thay vì 6s).'],
     ['Giáp Phản Phản Ứng', 'Thiết Thân của Nhảy Lùi (C) kéo dài 1.75s (thay vì 1s).'],
     ['Đạn Gia Tốc', 'Đạn của Phát Bắn (A) bay nhanh hơn 50%.']],
    [['Khóa Họng Súng', 'Chỉ cần bắn trúng mục tiêu bị khóa 4 lần (thay vì 5) để cường hóa C.'],
     ['Viên Đạn Áp Chế', 'Viên cuối cùng của Xả Băng (B) gây Choáng 1s.'],
     ['Khói Ngụy Trang', 'Nhảy Lùi (C) để lại màn khói: đối thủ mất dấu Zero 1.5s.']],
    [['Băng Đạn Hủy Diệt', 'Đạn nổ từ Nộ đẩy văng x2 và gây Câm Lặng 2s quanh vụ nổ.'],
     ['Nạp Đạn Thần Tốc', 'Dùng C cường hóa: 2 lần nạp đạn kế tiếp chỉ mất 1.5s.'],
     ['Xuyên Giáp Quân Dụng', 'Đạn của Xả Băng (B) bỏ qua 50% kháng đẩy lùi của mục tiêu.']],
  ],
  koda: [
    [['Bản Năng Leo Trèo', 'Bám tường lâu hơn 40%, lao xuống từ tường xa hơn 25%.'],
     ['Móng Vuốt Sắc Bén', 'Chảy Máu kéo dài 5s (thay vì 3s).'],
     ['Cào Cuồng Bạo', 'Cào Loạn Xạ (A) hồi chiêu 0.5s (thay vì 0.8s).']],
    [['Vồ Mồi Từ Trên Cao', 'Lao xuống từ tường bằng Vồ Mồi (D) gây Choáng 1.25s.'],
     ['Đứt Gân Toàn Phần', 'Xé Toạc (B) khi địch đủ tầng Chảy Máu tối đa: Trói Chân 2s (thay vì chỉ làm chậm).'],
     ['Vết Cắn Truy Lùng', 'Mỗi tầng Chảy Máu trên người địch làm nạn nhân chậm đi 6%.']],
    [['Thú Tính Bất Diệt', 'Nộ Thú Tính kéo dài thêm 3s và miễn nhiễm Làm Chậm.'],
     ['Cơn Đói Khát Máu', 'Giới hạn Chảy Máu tăng từ 5 lên 8 tầng.'],
     ['Xé Toạc Sinh Mệnh', 'Xé Toạc khi địch đủ tầng Chảy Máu tối đa: x3 lực đẩy.']],
  ],
  clint: [
    [['Cò Kép Nhanh', 'Tự nạp đạn 1.35s/viên (thay vì 1.9s).'],
     ['Báng Súng Thép', 'Báng Súng (A) tầm đập rộng hơn 25%.'],
     ['Phản Lực Nhảy', 'Bắn Nhảy (C) bay cao hơn 30% và xa hơn 20%.']],
    [['Dập Lửa Dưới Chân', 'Kẻ địch ở chỗ dậm của Bắn Nhảy (C) bị Choáng 0.75s và Cháy 3s.'],
     ['Vỏ Đạn Gây Mù', 'Ném vỏ đạn (D) gây Choáng 1.25s (thay vì 0.45s).'],
     ['Nạp Kép Cận Chiến', 'Báng Súng (A) đập trúng: nạp lại 2 viên (thay vì 1).']],
    [["Dragon's Breath Bất Tận", 'Trong lúc còn đạn Rồng: KHÔNG THỂ CẢN PHÁ.'],
     ['Băng Ba Viên', 'Tăng băng đạn tối đa từ 2 lên 3 viên.'],
     ['Điểm Hỏa Khắc Tinh', 'Phát Bắn (B) cận chiến phá tan Thiết Thân / Siêu Giáp / Khiên của đối thủ.']],
  ],
  theron: [
    [['Kình Lực Mũi Thương', 'Liên Hoàn Đâm (A) xa hơn 25%.'],
     ['Bật Nhảy Kỷ Luật', 'Chống Thương Nhảy (C) ở trên không 2.2s (thay vì 1.5s).'],
     ['Quét Trụ', 'Quét Chân (D) hồi chiêu 2s (thay vì 3s).']],
    [['Đâm Ghim Vỡ Giáp', 'Ghim tường bằng Xung Phong (B): Choáng 2.5s và phá mọi loại khiên.'],
     ['Ngã Rạp Chiến Trường', 'Quét Chân (D) gây Ngã: thêm Trói Chân + Câm Lặng 1s.'],
     ['Chấn Động Mặt Đất', 'Lao xuống từ Chống Thương (C): chấn động rộng hơn và HẤT TUNG (thay vì làm chậm).']],
    [['Trận Địa Mưa Thương', 'Mưa Thương ghim Trói Chân 2.5s (thay vì 0.8s).'],
     ['Mũi Giáo Tử Thần', 'Các đòn đâm (A, B) bỏ qua 100% kháng đẩy lùi của mục tiêu.'],
     ['Spartan Bất Diệt', 'Trong lúc Xung Phong (B): KHÔNG THỂ CẢN PHÁ.']],
  ],
  songluc: [
    [['Cò Súng Đôi', 'Mỗi khẩu thêm 1 viên đạn (Chrono 5, Neo 11).'],
     ['Hồi Nhịp Nhanh', 'Giảm 25% thời gian nạp đạn của cả Chrono và Neo.'],
     ['Lướt Xuyên Không', 'Bước Thời Gian (C) lướt xa hơn 25%.']],
    [['Nhiệt Hỏa Quá Khứ', 'Chrono: Liên Xạ (B) gây thêm Thiêu Đốt.'],
     ['Nghịch Ảnh Tương Lai', 'Neo: giật lùi về chỗ ảo ảnh gây Choáng 0.75s kẻ địch xung quanh.'],
     ['Đẩy Nhanh Chu Kỳ', 'Thời Khắc (B) hồi chiêu 5.3s (thay vì 7.5s).']],
    [['Thời Gian Tự Do', 'Chuyển Thế (D) gần như không hồi chiêu; mỗi lần đổi thế nạp ngay 1 viên cho thế mới.'],
     ['Nghịch Lý Sinh Tồn', 'Neo tua ngược (C): hồi lại lượng điểm văng vừa nhận trong 2s qua.'],
     ['Cỗ Xe Tăng Thời Gian', 'Chrono: 2.5s đầu của Liên Xạ (B) nhận thêm BẤT TỬ.']],
  ],
  aria: [
    [['Âm Vang Tái Sinh', 'Oktava hồi sinh sau 25s (thay vì 45s).'],
     ['Nhịp Điệu Đồng Vọng', 'Aria và Oktava chạy nhanh hơn 15%.'],
     ['Thanh Âm Lan Tỏa', 'Vòng sát thương quanh Aria rộng hơn 30%.']],
    [['Mê Muội Vực Sâu', 'Bài Ca Ràng Buộc (BBB) Mê Hoặc 2.6s (thay vì 1.8s).'],
     ['Trùng Kích Đoạt Hồn', 'Bản Nhạc Hào Hùng (AAA): đợt dậm cuối Choáng 1.5s và phá khiên.'],
     ['Hộ Mệnh Chữa Lành', 'Khiên còn thừa khi hết hạn chuyển 100% thành hồi điểm văng cho Aria.']],
    [['Khúc Khải Hoàn', 'Chỉ cần 2 Bản Nhạc (thay vì 3) để mở Nộ.'],
     ['Cộng Hưởng Tuyệt Đối', 'Khi cưỡi Oktava (D): Siêu Giáp, Oktava vẫn vung đòn với x2 lực đẩy.'],
     ['Bản Hòa Âm Tối Thượng', 'Hòa Âm Hỗn Hợp (ABC) nhận trọn uy lực cả 3 bản nhạc đơn lẻ.']],
  ],
  raven: [
    [['Nạp Đạn Nhanh', 'Nạp lại băng A và B khi cạn chỉ mất 7.5s (thay vì 10s).'],
     ['Khói Dày', 'Khói (C) tồn tại lâu hơn 1.5s và rộng hơn 30%.'],
     ['Đạn Sơ Tốc Cao', 'Đạn bắn tỉa (B) bay nhanh hơn 50%.']],
    [['Cắt Gân Tầm Xa', 'Bắn tỉa (B) trúng mục tiêu bị Oca đánh dấu: Trói Chân 1s.'],
     ['Khói Độc Thần Kinh', 'Kẻ địch đứng trong khói (C) bị Câm Lặng.'],
     ['Oca Vũ Trang', 'Bom mini của Oca nổ đẩy văng nhẹ.']],
    [['Kẻ Đi Săn Vô Hình', 'Nổ súng khi đang tàng hình không còn làm lộ diện Raven.'],
     ['Băng Đạn Mở Rộng', 'Băng A tăng lên 45 viên, băng B lên 7 viên.'],
     ['Mắt Quạ Tử Thần', 'Oca tồn tại 14s; mục tiêu bị đánh dấu nhận thêm 25% điểm văng.']],
  ],
  alice: [
    [['Khán Giả Cuồng Nhiệt', 'Kẻ địch phá 1 ảo ảnh cho ngay 35 Náo Nhiệt (thay vì 25).'],
     ['Phi Dao Sắc Lẹm', 'Phi Dao (A) bay xa và nhanh hơn 25%.'],
     ['Ảo Ảnh Bền Bỉ', 'Ảo ảnh chịu được thêm 1 đòn trước khi tan biến.']],
    [['Bẫy Hoa Lửa', '"Bị Lừa Rồi Nha!" nổ mạnh hơn (7 → 10) và gây Choáng 0.5s.'],
     ['Khói Ảo Thuật', 'Biến thể C (đủ 50 Náo Nhiệt) thả khói làm chậm kẻ địch 40% trong 2s.'],
     ['Vô Ảnh Thần Bộ', 'Tàng hình sau B cường hóa và C cơ bản kéo dài 2.5s (thay vì 1.5s).']],
    [['Đại Ảo Thuật Gia', 'Thoát Hiểm Ảo Ảnh cho Bất Tử + Tàng Hình 3.5s (thay vì 2s).'],
     ['Náo Nhiệt Vô Tận', 'Thanh Náo Nhiệt mở rộng vĩnh viễn lên 150.'],
     ['Ảo Ảnh Chân Thực', 'Đòn sao chép của ảo ảnh gây 50% lực đẩy văng thật (thay vì chỉ diễn).']],
  ],
  wukong: [
    [['Côn Pháp Nhập Môn', 'Côn Thức tích từ đòn đánh thường tăng 50% (+9% thay vì +6%).'],
     ['Thân Pháp Khỉ Đột', 'Cú bật nhảy của Kình Thiên Trụ (C) xa hơn 25%.'],
     ['Sải Côn Dài', 'Toàn Phong Côn (A) và Trực Thích (B) tăng 20% tầm với.']],
    [['Phong Áp Cản Đạn', 'Toàn Phong Côn (A) triệt tiêu 100% đạn bay vào (kể cả đạn tầm xa hạng nặng).'],
     ['Rung Chấn Địa Tầng', 'Cú đập C để lại vùng nứt sàn 3s làm chậm 50% kẻ địch bước qua.'],
     ['Thúc Gãy Xương', 'Trực Thích (B) đẩy kẻ địch va vào tường/cột: Choáng thêm 1.25s.']],
    [['Côn Khí Tự Sinh', 'Chạm mốc 50% và 100% Côn Thức: hồi ngay A, B, C. Điểm văng vượt 80%: Côn Thức nạp đầy ngay (hồi 30s).'],
     ['Định Thân Lan Tỏa', 'Định Thân (D) làm Choáng luôn các kẻ địch trong bán kính 2m quanh nạn nhân.'],
     ['Cột Trụ Trời Chấn Động', 'Cú đập Côn Thức gồng tối đa (3s) chấn động toàn sàn đấu và phá mọi Thiết Thân / Siêu Giáp của đối thủ.']],
  ],
  kazuki: [
    [['Tĩnh Tâm', 'Ý Niệm tự hồi 3.5%/s (thay vì 2%/s).'],
     ['Kéo Dài Nhịp', 'Bộ nhớ chuỗi combo giữ 2.5s (thay vì 1.5s).'],
     ['Kiếm Phong', 'Tả Trảm (A) và Hữu Trảm (B) quét xa hơn 20%.']],
    [['Phá Giáp Xung Kích', 'Thế đâm [AB → C] phá hoàn toàn khiên chắn và Siêu Giáp.'],
     ['Huyết Trảm', 'Thế chữ X [BA → C] gây Chảy Máu: rút thêm 15% điểm văng trong 3s.'],
     ['Thấu Thị', 'Cửa sổ phản đòn của D kéo dài 0.9s (thay vì 0.6s).']],
    [['Kiếm Vực Giam Cầm', 'Vùng Loạn Kiếm của Nộ làm Câm Lặng mọi đối thủ bên trong.'],
     ['Bất Diệt Ý Niệm', 'Phản đòn D thành công hồi 15% điểm văng của bản thân.'],
     ['Bát Hướng Phân Thân', 'Loạn Vũ (C) triệu hồi 8 ảo ảnh (thay vì 5), lực đẩy kết thúc +40%.']],
  ],
  victoria: [
    [['Tiếp Viện Khẩn Cấp', 'Thời gian hồi sinh mỗi lính giảm từ 60s xuống 45s.'],
     ['Giáp Chống Bạo Động', 'Lính nhận thêm 30% kháng đẩy văng cơ bản.'],
     ['Flash Cường Quang', 'Flash khi đổi sang AR gây Mù lâu hơn 0.75s.']],
    [['Lưới Đạn AR', 'C dạng AR làm chậm mục tiêu 60% và CẤM lướt.'],
     ['Lá Chắn Thị Vệ', 'Dính đòn chí tử: lính gần nhất lao vào chịu đòn thay và thế mạng (hồi 15s).'],
     ['Cờ Khải Hoàn', 'Đứng trong Vùng Đất Quân Lệnh (B dạng Cờ): hồi chiêu nhanh hơn 20%.']],
    [['Trận Địa Donut Tử Thần', 'Rìa quét A dạng Cờ +40% lực văng; mục tiêu đang Choáng: lực văng x2.'],
     ['Pháo Điện Từ Xuyên Âm', 'Pháo C dạng Lục rơi sau 1s thay vì 2s.'],
     ['Quân Đội Thép', 'Thêm 1 Lính Trọng Pháo (tối đa 4 lính).']],
  ],
  joker: [
    [['Tay Nhanh Hơn Mắt', 'Bài của A bay nhanh hơn 40% và xa thêm 2m.'],
     ['Trộm Vặt', 'Nhận ngay 1 trang bị ngẫu nhiên và mang thêm được 1 món (4 món).'],
     ['Nhà Cái Kiếm Tiền', 'Vàng thưởng thêm sau mỗi trận thắng tăng lên 60%.']],
    [['Bích Độc Đao', 'Lá Bích trúng mục tiêu cách mép dưới 3m: +50% lực văng.'],
     ['Tép Ngạt Khí', 'Câm Lặng của lá Tép kéo dài thêm 1s.'],
     ['Lừa Tình Tuyệt Đỉnh', 'Né đòn thụ động trước tướng nam +15%.']],
    [['Đạo Tặc Thần Tốc', 'Dùng bản sao từ D: nhận Cuồng Nộ +30% sát thương 2s.'],
     ['Bàn Tay Điêu Luyện', 'B không còn rút hụt, C không còn kẹt bài (100% thành công).'],
     ['Bộ Bài Vô Tận', 'Tỉ lệ nhân đôi A lên 50%, B và C lên 25%.']],
  ],
  thanhphong: [
    [['Khí Lưu Thuận Chiều', 'Tốc chạy ở Thuận Phong tăng từ 30% lên 45%.'],
     ['Cắt Gió Tàn Bạo', 'Lực văng ở Nghịch Phong tăng thêm 20%.'],
     ['Phong Hộ Tái Sinh', 'Giáp Phong Hộ hồi sau 7.5s thay vì 10s.']],
    [['Phong Độc Hôn Mê', 'Vùng gió C rút điểm văng theo thời gian của kẻ bị mù.'],
     ['Kình Phong Xuyên Thấu', 'Vực Xoáy Gió của A (Thuận Phong) hút mạnh gấp đôi.'],
     ['Bão Thuẫn Phản Hồi', 'Màng chắn gió B (Thuận Phong) dội ngược đạn về kẻ bắn (30% sát thương).']],
    [['Giấc Mộng Không Đáy', 'Ngủ Say của Nộ kéo dài 3s; đòn đánh thức +50% sát thương.'],
     ['Lướt Gió Vô Hạn', 'A ở Nghịch Phong trúng mục tiêu: hồi ngay A.'],
     ['Tâm Bão Bất Khả Xâm Phạm', 'Ở Bão Hòa: miễn nhiễm mọi đòn đẩy lùi nhẹ.']],
  ],
  galo: [
    [['Độc Ăn Da', 'Sát thương độc mỗi tầng +35%.'],
     ['Thú Tính Bền Bỉ', 'Dạng Quái Thú kéo dài 25s thay vì 20s.'],
     ['Bước Chân Hóa Chất', 'Dạng Thú để lại vệt axit làm chậm kẻ đuổi theo.']],
    [['Sương Độc Thần Kinh', 'Vũng khí B dạng Người thêm Câm Lặng 1s.'],
     ['Hàm Răng Bạo Lực', 'Cú cắn B dạng Thú phá hoàn toàn khiên chắn.'],
     ['Giảm Sốc Độc Tố', 'Không còn bị Vã Thuốc khi trở lại dạng Người.']],
    [['Axit Hóa Lỏng Xương', 'Tầng Tiêu Xương tối đa lên 10 (giảm tới 50% kháng đẩy lùi).'],
     ['Tiếng Rống Tận Diệt', 'D dạng Thú hất bay đạn xung quanh và Choáng 2s.'],
     ['Bản Năng Bất Tử', 'Dạng Thú bị đánh văng khỏi mép: bám vách leo lên lại sàn 1 lần mỗi mạng.']],
  ],
};
// ----- Mốc Lv6 (chiêu mới) & Lv12 (phong cách mới) — thiết kế của user, chữ phím đã quy đổi theo bộ chiêu hiện tại -----
const TALENTS_HI = {
  valerius: [
    [['Khiên Húc Phá Trận', 'Thay A: lướt húc khiên 120px về trước, gom mọi kẻ địch trên đường và đẩy lùi mạnh (hồi 3s).'],
     ['Khiên Phản Kích', ''],
     ['Hộ Vệ Bất Bại', 'Đứng yên quá 1s: tạo vòng bảo hộ giảm 35% lực đẩy văng nhận vào.']],
    [['Địa Chấn Khiên Binh', 'Sau Cuồng Phong (D), bấm D lần nữa nện khiên tạo vết nứt cản đường phía trước, HẤT TUNG kẻ địch 1s (hồi 8s).'],
     ['Đấu Sĩ Trảm Sát', 'Vứt khiên, kiếm 2 tay: A và B nhanh hơn 50%, sát thương x1.5. Mất nội tại giảm điểm văng; C không còn chặn mà đổi thành Lướt Chém xuyên giáp.'],
     ['Ý Chí Bất Diệt', 'Miễn nhiễm hoàn toàn một đòn đẩy văng có nguy cơ khiến bạn rơi đài (hồi 60s).']],
  ],
  elara: [
    [['Mưa Băng Rải Thảm', 'Thay C: nhảy lùi và bắn tên lên trời, rải vùng mưa băng diện rộng LÀM CHẬM 60% liên tục 2.5s.'],
     ['Tiễn Trùng Khí', 'Liên Xạ (A) trúng đích: bấm A lần nữa bắn một mũi tên xé gió hất văng địch.'],
     ['Cung Pháp Du Mục', 'Bắn khi đang di chuyển không còn bị giảm tốc chạy (A, B, D).']],
    [['Mũi Tên Hư Không', 'Kéo Căng Dây (B) tối đa: mũi tên hóa hố đen mini, hút mọi kẻ địch quanh đường bay vào tâm trong 1.5s.'],
     ['Cung Thủ Thần Tốc', 'Tầm bắn -20%, Liên Xạ (A) xả liên thanh 5 mũi không độ trễ; mỗi lần né bằng C nạp 1 loạt A cường hóa.'],
     ['Cảm Ứng Rừng Già', 'Tự phát hiện và vô hiệu hóa tàng hình / không thể bị ngắm của đối thủ trong tầm nhìn.']],
  ],
  percy: [
    [['Phát Bắn Bùng Nổ', 'Đang mở Trận Địa Nỏ (D): bấm D lần nữa bắn phát đạn pháo cuối nổ đẩy lùi diện rộng phía trước, lực giật đẩy Percy lùi 120px và thả khói mù tẩu thoát.'],
     ['Lưới Điện Trói Buộc', 'Thay Móc & Đạp (B) bằng súng bắn lưới điện: TRÓI CHÂN 1.5s và CẤM LƯỚT 3s (không kéo lại — giữ khoảng cách an toàn).'],
     ['Hộp Đạn Dự Trữ', 'Chuỗi Dồn Dập được giữ 4s (thay vì 2s) khi bắn trượt.']],
    [['Drone Phòng Vệ', 'Lướt C thả drone bay trên đầu 3s, tự bắn hạ mọi đạn đạo đang bay thẳng vào Percy.'],
     ['Đạn Xuyên Phá', 'Tên Nỏ (A) xuyên qua mọi vật thể / kẻ địch, đẩy văng toàn bộ đối thủ trên đường thẳng.'],
     ['Pháo Thủ Biến Hóa', '']],
  ],
  aria: [
    [['Nhập Thể Âm Vang', 'Thay D: Aria hòa làm một với Oktava, hóa khổng lồ 5s với bộ chiêu cận chiến mới (Đấm Đất, Gầm Vang, Húc).'],
     ['Sóng Phản Xạ', 'Sau Nốt Vàng (C), bấm C lần nữa: tiếng gầm dội ngược mọi đạn đạo đối phương quanh Aria & Oktava.'],
     ['Vọng Âm Cộng Hưởng', 'Các nốt Hòa Âm tồn tại vĩnh viễn cho tới khi đủ 3 nốt (bình thường mất sau 5s không gõ).']],
    [['Khúc Ca Ru Ngủ', 'Gõ đúng thứ tự A → B → C: hát ru khiến mọi đối thủ trong tầm nhìn ĐỨNG IM (Ngủ) 1.5s.'],
     ['Đổi Chỗ Tức Thời', 'Bấm D khi đứng xa Oktava (>220px): hoán đổi vị trí Aria và Oktava ngay lập tức.'],
     ['Song Tấu Độc Lập', 'Oktava tự do tấn công với 150% chỉ số; Aria đứng tuyến sau, định kỳ hồi điểm văng & tăng tốc cho cả hai.']],
  ],
  roxie: [
    [['Giáp Phản Lực', 'Thay B: hút Ụ Pháo vào người thành lớp giáp cơ giới 3s — giảm 60% lực đẩy nhận vào và phản đòn đẩy lùi kẻ tấn công.'],
     ['Bệ Phóng Lò Xo', 'Giữ A khi chưa đủ bánh răng dựng pháo: đặt bệ lò xo — kẻ địch giẫm vào bị bật văng về phía mép sàn (hồi 6s).'],
     ['Từ Trường Thu Gom', 'Bánh răng trên sàn tự lăn về phía Roxie sau 1s xuất hiện.']],
    [['Thiết Vệ Pháo Đài', 'T-Zero đổi thành cỗ máy công thành đứng yên với 2 họng đại bác nã đạn nổ khắp bản đồ (16s).'],
     ['Vòng Xoáy Lửa', 'Khi lái T-Zero: dùng B ngay sau cú Húc (C) để xoay tròn quét lửa 360°, HẤT TUNG kẻ địch xung quanh.'],
     ['Cyborg Tự Thân', 'Không gọi robot: 9 bánh răng lắp giáp thẳng lên người Roxie 18s — to gấp đôi, nặng hơn, đấm xuyên giáp.']],
  ],
  florian: [
    [['Đột Kích Hồi Mã', 'Phản đòn (C) thành công: bấm C ngay để lướt đâm xuyên qua đối thủ ra phía sau lưng.'],
     ['Vũ Điệu Lốc Xoáy', 'Thay A: đâm xoay tròn tại chỗ, hút nhẹ đối thủ và phá ngay 2 dấu ấn gần nhất.'],
     ['Nhịp Điệu Hoàn Hảo', 'Lướt (E) né trúng một đòn (Just Dodge): tự phá 1 ấn ngẫu nhiên trên mục tiêu.']],
    [['Sân Khấu Tử Thần', ''],
     ['Song Kiếm Quý Tộc', 'Rút thêm kiếm phụ: A và B tung gấp đôi nhát đâm; mất Thế Thủ (C đổi thành lướt tự do).'],
     ['Khúc Cao Trào Cuối Cùng', 'Phá ấn (3/4): lập tức hồi 100% thời gian hồi chiêu mọi kỹ năng.']],
  ],
  ryoma: [
    [['Thuật Thế Thân', 'Trong 1s sau Thuấn Bộ (C): bấm C lần nữa giật lùi về điểm xuất phát, để lại tàn ảnh chém quét.'],
     ['Ngược Gió Chém Sát', 'Combo B → A (đúng thứ tự) đổi thành nhát chém hất ngược, tung kẻ địch lên trời 1s.'],
     ['Đao Phách Vô Tận', 'Đòn A được hồi từ Combo có tầm chém xa hơn 30% và chém tan đạn đạo nhỏ.']],
    [['Tam Trọng Trảm Khí', 'Kiếm Khí (D) phóng 3 luồng hình quạt, triệt tiêu chiêu tầm xa và CÂM LẶNG 1.5s.'],
     ['Kiếm Cư Hợp (Iaido)', 'B đổi thành thế tra kiếm: giữ để tụ lực, thả ra lướt chém xuyên sàn với tốc độ ánh sáng, sát thương cực lớn.'],
     ['Tâm Kiếm Hợp Nhất', 'Chỉ cần 3 Combo để mở Nộ.']],
  ],
  gideon: [
    [['Quét Ngược Trừng Phạt', 'Sau Quét Ngang (A), bấm A lần nữa vung ngược lại, kéo kẻ địch văng vào gần.'],
     ['Khiên Kiếm Đỡ Gạt', 'Thay Cán Kiếm (D): gác kiếm ngang ngực chặn 1 đòn, hất văng kẻ tấn công ra đúng tầm Điểm Ngọt.'],
     ['Thế Nặng Ngàn Cân', 'Trúng Điểm Ngọt: kẻ địch chậm 40% và CẤM LƯỚT 1.5s.']],
    [['Cự Kiếm Xung Trận', 'Đang gồng Thế Thủ (C): bấm C lần nữa lao về trước ủi mọi kẻ cản đường, ghim chặt vào tường/cột.'],
     ['Kiếm Đế Cuồng Nộ', 'Tốc chạy và tốc vung kiếm +30%; toàn bộ thân kiếm đều tính là Điểm Ngọt.'],
     ['Trấn Áp Vực Thẳm', 'Mọi đòn đánh trúng kẻ địch đứng sát mép sàn: lực đẩy văng x2.5.']],
  ],
  borg: [
    [['Cú Ném Tử Thần', 'Chộp & Quật (D) đổi thành ném bổng đối thủ thật xa về phía trước — dùng để ném xuống vực.'],
     ['Đập Nện Mặt Sàn', 'Đấm Móc (A) trúng: bấm A lần nữa đập địch xuống sàn, CHOÁNG 1s.'],
     ['Kích Nổ Adrenaline', 'Bị đánh văng ở tốc độ cao: bấm C đúng lúc để phanh cứng cơ thể lại trên sàn.']],
    [['Cú Húc Xuyên Giáp', 'Giữ B (khi chưa tích năng lượng Gồng): lao tới như xe bọc thép, KHÔNG THỂ CẢN PHÁ, đẩy lùi mọi kẻ cản đường.'],
     ['Đấu Sĩ Khát Máu', 'Điểm văng càng cao tốc đánh càng nhanh (tối đa +80%); nắm đấm luôn gây Thiêu Đốt.'],
     ['Võ Đài Vĩnh Cửu', 'Trong Nộ, dây đài cũng phản lực bảo vệ Borg — không thể bị đánh rơi đài.']],
  ],
  jack: [
    [['Nạp Đạn Liều Lĩnh', 'Thay C: vừa nạp đầy ổ vừa xoay súng xả đạn mù ra xung quanh, bắn trúng kẻ định áp sát.'],
     ['Bắn Nhanh (Fan the Hammer)', 'Giữ A: xả liên thanh 3 viên cực nhanh theo đường thẳng, lực giật đẩy Jack lùi lại.'],
     ['Tẩy Bài Cờ Bạc', 'Xúc xắc ra ⚀: được gieo lại 1 lần.']],
    [['Cược Tất Tay', 'Viên đạn Cò Quay Nga nổ: bấm D lần nữa ném luôn khẩu súng phát nổ toàn màn hình (rồi mất 3s nhặt súng).'],
     ['Thần Bạc Gian Lận', 'Ổ đạn 8 viên; xúc xắc không bao giờ ra ⚀ hay ⚁ — luôn từ ⚂ tới ⚅.'],
     ['Mạng Thứ Hai', 'Bị đánh bay khỏi đài: tự kích phản lực bay ngược về sàn (1 lần mỗi ván).']],
  ],
  clint: [
    [['Đoạt Mệnh Cận Chiến', 'Thay Báng Súng (A): giật đối thủ áp sát rồi tọng họng súng vào bụng — đẩy cực mạnh, nạp ngay 2 viên.'],
     ['Dậm Gót Tử Thần', 'Đang bay bằng Bắn Nhảy (C): bấm C lần nữa bổ gót xuống đầu đối thủ gần nhất, làm NGÃ 1s.'],
     ['Hạt Chì Nặng', 'Bắn (B) ở cự ly cực gần chắc chắn CHOÁNG 0.5s.']],
    [['Đạn Xuyên Phá Cỡ Lớn', 'Nạp Đạn Khẩn Cấp (D) nạp 1 viên đặc chế: phát Bắn kế tiếp phá tan mọi khiên, xuyên tường và đẩy lùi cực mạnh.'],
     ['Thợ Săn Bất Tử', 'Cự ly bắn hiệu quả gấp đôi; mỗi phát Bắn (B) trúng đích hồi 5% điểm văng của bản thân.'],
     ['Băng Đạn Vô Tận', 'Đánh văng kẻ địch khỏi sàn: lập tức nạp đầy đạn và hồi ngay Bắn Nhảy.']],
  ],
  zero: [
    [['Đạn Chùm Càn Quét', 'Xả Băng (B) tỏa đạn hình cánh quạt 120° thay vì bắn thẳng — kiểm soát diện rộng.'],
     ['Kích Nổ Dấu Ấn', 'Mục tiêu đang bị Khóa (D): bấm D lần nữa kích nổ dấu ấn — CÂM LẶNG 1.5s và đẩy lùi.'],
     ['Phản Xạ Điệp Viên', 'Bị tấn công từ sau lưng: tự động lướt né (hồi 15s).']],
    [['Dịch Chuyển Ám Sát', 'C cường hóa dịch chuyển thẳng ra sau lưng mục tiêu và tự động xả 3 viên.'],
     ['Hỏa Lực Tuyệt Mật', 'Băng đạn 18 viên, tốc độ bắn x2 — ụ súng tiểu liên di động.'],
     ['Triệt Tiêu Hoàn Toàn', 'Kẻ địch bị Khóa (D) nhận thêm 30% lực đẩy từ mọi nguồn.']],
  ],
  ignatius: [
    [['Tường Lửa Chắn Lối', 'Thay Vòng Lửa (D): dựng bức tường lửa trước mặt 4s, chặn mọi đạn đạo và thiêu đốt kẻ bước qua.'],
     ['Kích Nổ Cầu Lửa', 'Bấm A lần nữa để Cầu Lửa nổ tung ngay giữa đường bay.'],
     ['Hỏa Hồn Bùng Cháy', 'Kẻ địch đang Cháy bị giảm 25% tốc chạy và tốc hồi chiêu.']],
    [['Hố Đen Tro Tàn', 'Đại Hỏa Cầu (B) tích tối đa hóa hố đen: hút mọi kẻ địch xung quanh vào tâm rồi mới phát nổ.'],
     ['Pháp Sư Trọng Lực', 'Đổi hệ Lửa sang Trọng Lực: không gây Cháy nữa, mỗi đòn trúng tăng lực đẩy lên kẻ địch theo cấp số nhân (x1.18 mỗi tầng, tối đa 6 tầng).'],
     ['Phượng Hoàng Tái Sinh', 'Rơi khỏi sàn: hóa trứng lửa bay ngược về tâm sàn, điểm văng giảm một nửa (1 lần mỗi ván).']],
  ],
  vesper: [
    [['Lướt Xiên Bóng Đêm', 'Xuyên Tâm (B) lướt xuyên qua người địch; đâm trúng từ sau lưng TRÓI CHÂN nạn nhân 1s.'],
     ['Đổi Hướng Đột Kích', 'Tái kích hoạt Phi Dao (D) dịch chuyển ra TRƯỚC MẶT địch kèm cú đá HẤT TUNG.'],
     ['Bước Đi Không Vết', 'Ẩn Thân (C) kéo dài 3.5s và không bị lộ khi ra đòn đánh trượt.']],
    [['Ảo Ảnh Phân Thân', 'Ẩn Thân (C) tạo thêm 2 phân thân chạy về 2 hướng, đánh lạc hướng đối thủ.'],
     ['Độc Sát Chuyên Nghiệp', 'Mọi đòn phủ độc cực mạnh; trúng 3 đòn liên tiếp: kẻ địch bị CHOÁNG và CÂM LẶNG 2s.'],
     ['Lưỡi Dao Đoạt Mạng', 'Đánh sau lưng kẻ địch trên 80% điểm văng: lực đẩy x4.']],
  ],
  death: [
    [['Lưỡi Trảm Đoạt Hồn', 'Thay Gặt (A) bằng nhát chém chữ X đẩy lùi mạnh; trúng địch hồi 15% điểm văng hiện có của bản thân (hồi chiêu dài hơn).'],
     ['Thu Hồi Lưỡi Hái', 'Liềm C đang xoay: bấm C lần nữa giật liềm về tay, kéo lê mọi kẻ địch trên đường bay về phía Death.'],
     ['Hơi Thở Tử Thần', 'Kẻ địch đứng trong 120px quanh Death bị làm chậm 20%.']],
    [['Trảm Quyết Diện Rộng', 'Phán Quyết (B) bổ xuống tạo sóng chấn động hình nón; mục tiêu trên 100% điểm văng trúng đòn bị kết liễu ngay.'],
     ['Sứ Giả Địa Ngục', 'Đổi sang Xích Liềm: tầm A và B xa thêm 40%; Gặt (A) luôn kéo nhẹ đối thủ về phía Death.'],
     ['Hộ Thân Oan Hồn', 'Mỗi lần đánh văng kẻ địch khỏi sàn: thêm 1 linh hồn xoay quanh Death, chặn hoàn toàn 1 đòn đánh (tối đa 3).']],
  ],
  theron: [
    [['Hất Tung Phá Trận', 'Thay Quét Chân (D) bằng đòn móc cán thương HẤT TUNG kẻ địch lên trời 1.2s.'],
     ['Giáo Ném Không Trung', 'Đang trên không bằng Chống Thương (C): bấm C phóng ngọn giáo xuống chỗ địch — CHOÁNG 1s và để lại vùng cản đường.'],
     ['Khiên Chắn Sparta', 'Trong lúc Liên Hoàn Đâm (A): tấm chắn trước mặt chặn toàn bộ đạn đạo tầm xa.']],
    [['Đâm Xuyên Vạn Quân', 'Xung Phong (B) xuyên qua cột / chướng ngại, không dừng lại, cuốn theo mọi kẻ địch trên đường đi.'],
     ['Đấu Sĩ Phalanx', 'Vĩnh viễn giảm 40% lực đẩy nhận vào; đòn đâm (A, B) +35% lực văng nhưng tốc chạy -15%.'],
     ['Kỷ Luật Bất Khả Xâm Phạm', 'Miễn nhiễm hoàn toàn Trói Chân và Mê Hoặc từ mọi nguồn.']],
  ],
  koda: [
    [['Cắn Xé Cuồng Loạn', 'Vồ Mồi (D) đè trúng: bấm D lần nữa ngoạm cổ quăng đối phương về phía mép sàn gần nhất.'],
     ['Vuốt Quét 360', 'Thay A: xoay tròn cào cấu xung quanh, mỗi kẻ địch gần đó nhận 1 tầng Chảy Máu.'],
     ['Đánh Hơi Con Mồi', '+30% tốc chạy khi đuổi theo kẻ địch có từ 3 tầng Chảy Máu.']],
    [['Độn Thổ Rình Rập', 'Thay Bám Tường (C): chui xuống đất lướt tới chỗ địch (không thể bị nhắm), trồi lên HẤT TUNG.'],
     ['Sói Đầu Đàn', 'To hơn 30%, nặng hơn; mọi vết cào gây Vết Thương Sâu — kẻ địch không thể hồi điểm văng.'],
     ['Hộ Chủ Cuồng Bạo', 'Bị đánh mạnh: tự nhận Siêu Giáp và +50% lực văng trong 3s (hồi 10s). (Đấu 1v1: kích hoạt khi chính Koda bị tấn công.)']],
  ],
  songluc: [
    [['Vụ Nổ Quá Khứ', 'Chrono: sau Bước Thời Gian (C), bấm C lần nữa kích nổ điểm xuất phát, hất văng kẻ truy đuổi.'],
     ['Hoán Đổi Ảo Ảnh', 'Neo: tái kích hoạt C tráo đổi vị trí tức thì với ảo ảnh (ảo ảnh vẫn ở lại dụ địch) và nã 3 viên LÀM CHẬM 1s.'],
     ['Đồng Hồ Cát Đồng Bộ', 'Chuyển Thế (D) lập tức nạp đầy đạn cho cả hai khẩu súng.']],
    [['Giao Thoa Không Gian', 'Trong lúc Liên Xạ (B Chrono): bấm B lần nữa bẻ cong không gian, kéo mọi kẻ địch xung quanh về trước nòng súng.'],
     ['Nghịch Lý Thời Gian', 'Mỗi phát A luôn bắn cùng lúc đạn uy lực của Quá Khứ lẫn đạn thần tốc của Tương Lai.'],
     ['Vòng Lặp Vĩnh Cửu', 'Bị rơi đài: hồi sinh ngay tại chỗ rơi với 0% điểm văng, không mất mạng (1 lần mỗi ván).']],
  ],
  raven: [
    [['Phát Bắn Bồi', 'Bắn tỉa (B) trúng đích: trong 1s bấm B lần nữa nổ điểm ghim, đẩy mục tiêu lùi thêm 2m (không tốn đạn).'],
     ['Dây Đu Thoát Hiểm', 'Thay C: bắn dây móc đu người bay vọt qua đầu đối thủ sang phía đối diện sàn.'],
     ['Đạn Hợp Kim Titan', 'Đạn súng trường (A) phá tan mọi đạn đạo nhỏ bay ngược chiều.']],
    [['Thiện Xạ Độc Hành', 'Khóa hoàn toàn băng A. Bắn tỉa (B) hồi 1.2s; bắn từ cự ly xa (>10m) luôn x3 lực đẩy văng.'],
     ['Oca Tự Sát', 'Hết giờ, Oca không bay đi mà lao xuống đầu mục tiêu bị đánh dấu nổ diện rộng cực mạnh, Choáng 1.5s.'],
     ['Vọng Âm Đêm Tối', 'Trong Màn Đêm, mỗi lần hạ được kẻ địch kéo dài bóng tối thêm 3s.']],
  ],
  alice: [
    [['Phi Dao Hoán Vị', 'Phi Dao (A) trúng đích: trong 1s bấm A lần nữa dịch chuyển tới chỗ dao.'],
     ['Chim Bồ Câu Quấy Nhiễu', 'Thay B: vung tay thả đàn bồ câu — hất tung nhẹ và Câm Lặng 1.25s.'],
     ['Ảo Ảnh Phản Kích', 'Ảo ảnh bị đánh cận chiến sẽ đâm trả 1 nhát trước khi phát nổ.']],
    [['Bậc Thầy Phân Thân', 'C cơ bản giữ tối đa 3 ảo ảnh cùng lúc và hồi nhanh gấp đôi; D gần như không hồi chiêu khi còn ảo ảnh trên sàn.'],
     ['Chiếc Hộp Biến Mất', 'Nộ thêm biến thể: nhốt cả sàn trong hộp ảo thuật 2s rồi dịch chuyển mọi đối thủ ra sát mép sàn (dùng khi đối thủ trên 60%).'],
     ['Nụ Cười Gã Hề', 'Ảo ảnh nổ đẩy rớt kẻ địch khỏi sàn: hồi đầy Nộ ngay lập tức.']],
  ],
  wukong: [
    [['Hoành Tảo Đoạt Mệnh', 'Trực Thích (B) trúng đích: bấm B lần nữa trượt chân tới quét ngang, hất ngã đối thủ 1s.'],
     ['Hộ Thân Kim Cang', 'Thay A: gõ côn xuống đất tạo lồng chuông chặn 1 đòn bất kỳ và đẩy bật kẻ tấn công ra xa.'],
     ['Đẩu Vân Đạp Tuyết', 'Đang ở trên không bằng C: lướt thêm 1 nhịp 2.5m trước khi bổ côn xuống.']],
    [['Phân Thân Hầu Vương', 'Nhảy C để lại 1 phân thân dưới sàn xoay côn hút địch; Wukong thật từ trên cao bổ xuống kết liễu.'],
     ['Vạn Trượng Kim Bổng', 'Nộ thêm biến thể (khi đối thủ trên 70%): côn khổng lồ đè bẹp nửa sàn theo hướng chỉ định, lập tức tiễn mọi mục tiêu trên 70% ra khỏi võ đài.'],
     ['Kim Cang Bất Hoại', 'Trong thời gian Nộ: miễn nhiễm rơi đài — văng khỏi mép sẽ được cân đẩu vân kéo về giữa sàn.']],
  ],
  kazuki: [
    [['Trảm Khí Nghịch Chuyển', 'Phản đòn D thành công: bấm D lần nữa phóng luồng kiếm khí chữ X tầm xa hất văng địch.'],
     ['Vạn Kiếm Quy Nhất', 'Loạn Vũ (C) chém xong: bấm C lần nữa lướt ngược lại giáng cú chém kết liễu từ trên không.'],
     ['Đoạt Mệnh Trảm Đạn', 'A và B chém trúng đạn bay tới: phá hủy viên đạn và hồi 5% Ý Niệm.']],
    [['Tuyệt Kỹ Iaido', 'Tra kiếm vào bao, chạy nhanh hơn 35%. C không cần combo mồi mà rút kiếm chém lướt tức thì; mọi lần phản đòn D tự kích hoạt Loạn Vũ.'],
     ['Trảm Đoạn Thời Không', 'Nộ thêm biến thể (khi đối thủ trên 70%): đóng băng cả sàn 1.5s, chém 10 nhát vào kẻ điểm văng cao nhất rồi kích nổ đẩy thẳng ra khỏi sàn.'],
     ['Đạo Kiếm Hợp Nhất', 'Nộ chỉ cần 7 Kiếm Ý và 75% Ý Niệm.']],
  ],
  victoria: [
    [['Thu Hồi Cờ Lệnh', 'Sau khi cắm cờ (B dạng Cờ): bấm B lần nữa nhổ cờ, giật mọi kẻ địch gần cờ về phía Victoria.'],
     ['Đạn Phá Giáp', 'A dạng Lục bắn xuyên mục tiêu và làm nứt giáp 3s (nhận thêm 20% sát thương từ cả đội).'],
     ['Bọc Lót Chiến Thuật', 'Mỗi khi lướt (B dạng Lục, đổi sang AR): lính ném khói che mắt tại điểm cũ.']],
    [['Bậc Thầy Chỉ Huy', 'Victoria không tự bắn nữa (A dạng Lục/AR = lệnh khai hỏa cho lính); lính nhận 100% kháng văng của Victoria; hồi sinh lính còn 20s.'],
     ['Pháo Đài Di Động', 'Nộ thêm biến thể (đối thủ trên 60%): lính ghép khiên thành pháo đài, đại bác laser quét 180° trước mặt.'],
     ['Kỷ Luật Sắt', 'Hạ 1 kẻ địch: lập tức hồi sinh toàn bộ lính đã chết.']],
  ],
  joker: [
    [['Vui Thôi Nào!', 'Mang thêm 1 ô trang bị nữa (tối đa 5 món nếu có Trộm Vặt).'],
     ['Phi Ba Lá', 'A phóng rẻ quạt 3 lá bài cùng loại.'],
     ['Bài Ảo Đánh Lạc Hướng', 'Tráo bài C để lại hình nhân bài giấy phát nổ khi kẻ địch chạm vào.']],
    [['Thần Bài Gian Lận', 'Xóa lá Cơ, lá Joker tăng lên 25%; lá bài trắng tự mang hiệu ứng chất ngẫu nhiên.'],
     ['Gian Lận Tối Thượng', 'Nộ luôn ra Lá Toàn Năng, hoặc Tráo Đổi Sinh Mệnh khi đang nguy cấp.'],
     ['Ván Cược Sinh Tử', 'Điểm văng từ 100%: tỉ lệ Thần Chết Bịp Bợm của Nộ tăng từ 0.2% lên 5%.']],
  ],
  thanhphong: [
    [['Lốc Xoáy Kép', 'Sau cú đâm sau lưng (B Nghịch Phong): bấm B lần nữa xoay quạt hất tung địch lên trời.'],
     ['Phiến Khí Bát Đoạn', 'Thay A: vung quạt chém rẻ quạt 5 luồng khí, làm chậm kẻ trúng.'],
     ['Hơi Thở Của Gió', 'Mỗi lần đổi gió bằng D: hồi 10% điểm văng.']],
    [['Tuyệt Ảnh Ám Sát', 'Khóa thước gió ở 100 Nghịch Phong vĩnh viễn: mọi chiêu đều tốc biến ra sau lưng đối thủ.'],
     ['Long Quyển Phong Bạo', 'Nộ thêm biến thể (đối thủ trên 60%): vòi rồng cuốn phăng mọi mục tiêu trên 60% ra khỏi sàn.'],
     ['Lời Ru Vĩnh Cửu', 'Đẩy rớt đài kẻ đang Ngủ Say: hồi đầy Nộ.']],
  ],
  galo: [
    [['Quăng Quật', 'Vồ trúng địch bằng C dạng Thú: bấm C lần nữa tóm đập xuống sàn, Choáng 1s.'],
     ['Phun Axit', 'Thay A dạng Người: phun axit hình nón, quét sạch đạn phía trước và găm độc.'],
     ['Hấp Thu Độc Chất', 'Đứng trong vũng độc của mình hồi 5% điểm văng mỗi giây.']],
    [['Chimera Bất Hoại', 'Kẹt vĩnh viễn ở Dạng Quái Thú nhưng giữ trí khôn (Tư duy 75); D phun axit của dạng người.'],
     ['Nổ Axit Hạt Nhân', 'Nộ thay thế: tự nổ tung đẩy văng mọi kẻ địch quanh mình, để lại bãi axit vĩnh viễn tới hết trận.'],
     ['Cuồng Huyết Độc Dược', 'Đối thủ đang dính độc bị đẩy rớt đài: hồi đầy Nộ.']],
  ],
};
for (const cid in TALENTS) { const r = TALENTS[cid], h = TALENTS_HI[cid]; TALENTS[cid] = [r[0], r[1], h[0], r[2], h[1]]; }
// chuẩn hóa: TALENTS[charId] = [[{id,name,desc,tier}x3] x5]
for (const cid in TALENTS) TALENTS[cid] = TALENTS[cid].map((row, ti) => row.map(([name, desc], j) => ({ id: `${cid}_${TALENT_TIERS[ti]}${'abc'[j]}`, name, desc, tier: TALENT_TIERS[ti], ti })));
const TALENT_BY_ID = {};
for (const cid in TALENTS) for (const row of TALENTS[cid]) for (const t of row) TALENT_BY_ID[t.id] = t;
// ----- Biến thể ngẫu nhiên: nội tại có nhiều phương án → mỗi ván (mỗi hiệp) bốc ngẫu nhiên 1 -----
// f.T('<id>:<k>') để kiểm tra biến thể đang dùng
const TALENT_VARIANTS = {
  valerius_6b: [
    { k: 'shock', name: 'Phản Chấn', desc: 'Chặn trúng đòn bằng Khiên Chắn (C): bấm C lần nữa phát sóng xung kích CHOÁNG diện rộng 1s.' },
    { k: 'throw', name: 'Ném Khiên', desc: 'Đang giơ Khiên Chắn (C): bấm A ném khiên bay thẳng 340px, CHOÁNG 1.2s kẻ trúng rồi bật về tay.' }],
  percy_12c: [
    { k: 'gatling', name: 'Pháo Đài Di Động', desc: 'Trận Địa Nỏ (D) không chôn chân: vừa chạy vừa xả (tốc chạy -25%), tầm quét +30%, lướt C không ngắt trận địa.' },
    { k: 'overheat', name: 'Quá Tải Nhiệt Lượng', desc: 'Trận Địa Nỏ (D) không giới hạn 5s — xả tới khi tự dừng hoặc dính khống chế cứng; càng sấy lâu tốc bắn & lực đẩy càng tăng (tối đa +60% sau 3s).' },
    { k: 'recoil', name: 'Nỏ Phản Lực', desc: 'Mỗi loạt tên của Trận Địa Nỏ (D) giật Percy trôi lùi ngược hướng bắn (né đòn, thoát mép); mọi mũi tên đẩy lùi x2.' }],
  florian_12a: [
    { k: 'echo', name: 'Song Tấu Đối Cực', desc: 'Mỗi khi phá 1 ấn, một Phân Ảnh Ánh Sáng phá luôn ấn ở hướng đối diện — chỉ cần trúng 2 hướng là phá đủ 4 ấn.' },
    { k: 'stigma', name: 'Tử Huyệt Khóa Chân', desc: 'Mỗi ấn bị phá ghim kiếm ánh sáng: CHOÁNG 0.5s + 10% điểm văng. Phá đủ 4 ấn: ĐÓNG BĂNG 1.5s rồi nổ tung, đẩy thẳng về mép sàn gần nhất.' }],
};
function variantDesc(id) { return 'Mỗi hiệp bốc ngẫu nhiên 1 biến thể: ' + TALENT_VARIANTS[id].map((v) => `【${v.name}】 ${v.desc}`).join(' '); }
for (const id in TALENT_VARIANTS) { TALENT_BY_ID[id].desc = variantDesc(id); TALENT_BY_ID[id].name += ' 🎲'; }
function randomTalents(charId, level) {
  const rows = TALENTS[charId]; if (!rows) return [];
  return rows.filter((r) => r[0].tier <= level).map((r) => pick(r).id);
}

// ===== Các hiệu ứng nội tại móc vào hệ thống chung =====
// setup(f): khi tạo đấu sĩ • life(f): mỗi mạng mới • update(f,m,dt) • onDeal(f,t,hit,info,m) • onTake(t,att,hit,info,m)
// onIncoming(t,att,hit,m) → false để hủy đòn • afterDeal(f,t,hit,m) • onUse(f,k,m) • onKill(f,victim,m)
function towardEnemy(f, m, cond) {
  const t = m.nearestEnemy(f);
  if (!t || (cond && !cond(t)) || !(f.moveDir.x || f.moveDir.y)) return false;
  const a = angTo(f, t);
  return f.moveDir.x * Math.cos(a) + f.moveDir.y * Math.sin(a) > 0.5;
}
const TALENT_FX = {
  valerius_1a: { setup(f) { f.weightFactor *= 1.15; } },
  valerius_1b: { onTake(t) { if (t.has('block')) { t.cd.A = Math.max(0, t.cd.A - 1); t.cd.B = Math.max(0, t.cd.B - 1); } } },
  valerius_1c: { update(f, m) { if (towardEnemy(f, m)) f.frameSpeed *= 1.2; } },
  valerius_3a: { onTake(t, att, hit, info, m) {
    if (!t.has('block') || !att || att.isEnv || att === t || hit.reflect || !att.alive) return;
    info.extra.push(() => m.applyHit(t, att, { dmg: (hit.dmg || 0) * 0.4, kb: (hit.kb || 0) * 0.4, kg: (hit.kg || 0) * 0.4, reflect: true, tag: 'C', angle: angTo(t, att) }));
  } },
  valerius_3c: { onTake(t, att, hit, info) { if (t.stillT > 0.12) info.taken *= 0.75; } },
  valerius_9a: { update(f, m) {
    if (f.percent > 100 && m.time >= (f._bkCd || 0)) { f._bkCd = m.time + 30; f.addStatus('ironbody', 2.5); m.text(f.x, f.y - 60, '🦾 BẤT KHUẤT!', '#c0c0c0', 17); }
  } },
  valerius_9b: { onDeal(f, t, hit, info) { if (f.has('immortal')) info.extra.push(() => t.addStatus('stun', 0.5)); } },

  elara_1b: { setup(f) { f.rng = 1.2; } },
  elara_3c: { onUse(f, k) { if (k === 'C') { f.cd.A = 0; f.cd.D = 0; } } },

  florian_9a: { onDeal(f) { if (f.has('swordform')) f.cd.C = Math.max(0, f.cd.C - 1); } },

  borg_1a: { update(f) { if (f.percent > 60) f.frameSpeed *= 1.15; } },
  borg_1b: { setup(f) { f.weightFactor *= 1.1; } },
  borg_1c: { setup(f) { f.cdK.A = 0.6; } },
  borg_3c: { onDeal(f, t, hit, info) { if (hit.tag === 'B') info.extra.push(() => t.addStatus('burn', 3, 2.5)); } },
  borg_9c: { onDeal(f, t, hit, info) { if (f.percent >= 120) info.extra.push(() => { if (!t.superArmor) { t.vz = Math.max(t.vz, 330); t.z = Math.max(t.z, 1); } }); } },

  jack_1b: { update(f) { if (f.ws.cyl <= 0 && !f.ws.rr) f.frameSpeed *= 1.35; } },
  jack_9b: { setup(f) { f.rageNeed = 67; } },
  jack_9c: { onDeal(f, t, hit, info, m) {
    if (hit.tag === 'A' && f.percent > 100 && Math.random() < 0.5) { info.kbMult *= 2; m.text(t.x, t.y - 58, 'TẤT TAY!', '#ff5a3a', 17); }
  } },

  death_1b: { update(f, m) { if (towardEnemy(f, m, (t) => t.percent > 70)) f.frameSpeed *= 1.2; } },
  death_1c: { setup(f) { f.cdK.A = 0.67; } },
  death_9c: { onKill(f, v, m) { f.percent = Math.max(0, f.percent - 20); m.text(f.x, f.y - 60, '💀 THU HOẠCH LINH HỒN -20%', '#c0b0ff', 16); } },

  ryoma_1a: { setup(f) { f.cdK.C = 0.75; } },
  ryoma_9c: { onUse(f, k) { if (k === 'D') f.cd.C = 0; } },

  vesper_1c: { setup(f) { f.cdK.A = 0.7; } },
  vesper_3c: { onKill(f, v, m) { f.addStatus('untargetable', 2); f.addStatus('haste', 2, 0.4); m.text(f.x, f.y - 50, '👻 MẤT DẤU', '#b07aff', 15); } },
  vesper_9c: { onIncoming(t, att, hit, m) {
    if (!att || att === t || hit.quiet || m.time < (t._subCd || 0) || t.percent < 50) return true;
    const est = ((hit.kb || 0) + (hit.kg || 0) * KG_SCALE * t.percent) * (att.kbMult || 1) / t.weight;
    if (est < 560) return true;
    t._subCd = m.time + 45;
    m.fx({ type: 'boom', x: t.x, y: t.y, r: 40, color: '#a07040', life: 0.35 });
    m.text(t.x, t.y - 40, '🪵 THẾ THÂN!', '#d0a070', 18);
    const a = escapeAngle(t, att, m), p = m.arena.clamp({ x: t.x + Math.cos(a) * 170, y: t.y + Math.sin(a) * 170 }, t.r + 30);
    t.x = p.x; t.y = p.y; t.vx = t.vy = 0; t.hitstun = 0; t.action = null; t.cancelDash();
    t.invulnT = Math.max(t.invulnT, 0.5); t.addStatus('untargetable', 1);
    return false;
  } },

  gideon_1c: { update(f) { if (f.stillT > 0.12) f.frameWeight *= 1.2; } },

  ignatius_9c: { onUse(f, k) { if (k === 'C') f.cd.A = 0; } },

  percy_1c: { setup(f) { f.cdK.C = 0.7; } },
  percy_9b: {
    life(f) { f.ws.dch = 2; },
    onUse(f, k) { if (k !== 'B') return; f.ws.dch--; if (f.ws.dch > 0) f.cd.B = 0.5; },
    update(f) { if (f.ws.dch <= 0 && f.cd.B <= 0) f.ws.dch = 2; },
  },
  percy_9c: { onDeal(f, t, hit, info, m) {
    if (hit.tag === 'D' && (t._percyD || 0) > m.time && !t.has('nodash')) { info.extra.push(() => t.addStatus('nodash', 3)); m.text(t.x, t.y - 56, '⚓ CẤM LƯỚT', '#4ae0d0', 15); }
  } },

  zero_9c: { onDeal(f, t, hit, info) { if (hit.tag === 'B') info.kbMult *= Math.max(1, t.weight / (1 + (t.weight - 1) * 0.5)); } },

  koda_1c: { setup(f) { f.cdK.A = 0.625; } },

  theron_1c: { setup(f) { f.cdK.D = 0.67; } },
  theron_9b: { onDeal(f, t, hit, info) { if (hit.tag === 'A' || hit.tag === 'B') info.kbMult *= Math.max(1, t.weight); } },

  songluc_3c: { setup(f) { f.cdK.B = 0.7; } },
  songluc_9a: { setup(f) { f.cdK.D = 0.3; } },
  songluc_9b: { update(f, m) {
    const h = f.ws.ph || (f.ws.ph = []);
    if (!h.length || m.time - h[h.length - 1].t >= 0.1) { h.push({ t: m.time, p: f.percent }); if (h.length > 30) h.shift(); }
  } },

  aria_1b: { update(f) { f.frameSpeed *= 1.15; } },

  // ----- Lv6 / Lv12 -----
  valerius_6a: { setup(f) { mulCd(f, 'A', 6); } },
  valerius_6c: { onTake(t, att, hit, info) { if (t.stillT > 1) info.kbMult *= 0.65; } },
  valerius_12b: { setup(f) { mulCd(f, 'A', 0.67); mulCd(f, 'B', 0.67); } },
  valerius_12c: { onIncoming(t, att, hit, m) {
    if (!att || att.isEnv || att === t || m.time < (t._wilCd || 0) || !lethalHit(t, att, hit, m)) return true;
    t._wilCd = m.time + 60; t.invulnT = Math.max(t.invulnT, 0.3);
    m.fx({ type: 'ring', x: t.x, y: t.y, r: 70, color: '#9ec9ff', life: 0.45, w: 8 }); m.text(t.x, t.y - 60, '🛡️ Ý CHÍ BẤT DIỆT!', '#9ec9ff', 18);
    return false;
  } },
  elara_12b: { setup(f) { f.rng = (f.rng || 1) * 0.8; } },
  gideon_12b: { setup(f) { mulCd(f, 'A', 0.77); mulCd(f, 'B', 0.77); } },
  gideon_12c: { onDeal(f, t, hit, info, m) { if (m.arena.edgeDist(t.x, t.y) < 120) info.kbMult *= 2.5; } },
  borg_6c: { update(f, m) {
    // Kích Nổ Adrenaline: bị đánh văng cực nhanh → bấm C phanh cứng
    if (f.hitstun <= 0 || f.cd.C > 0 || Math.hypot(f.vx, f.vy) < 560 || f.falling > 0) return;
    const r = f.brain ? f.brain.tech.reflex : 5;
    if (Math.random() > 0.05 + r * 0.012) return;
    f.vx *= 0.1; f.vy *= 0.1; f.hitstun = 0; f.cd.C = f.cdOf('C');
    m.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#ff9a6a', life: 0.35, w: 6 }); m.text(f.x, f.y - 50, '🛑 PHANH!', '#ff9a6a', 17);
  } },
  borg_12c: { onFall(f, m) {
    if (!m.rings.some((r) => r.owner === f && r.t > 0)) return true;
    const p = m.arena.clamp({ x: f.x, y: f.y }, 30); f.x = p.x; f.y = p.y; f.vx = -f.vx * 0.3; f.vy = -f.vy * 0.3;
    m.text(f.x, f.y - 50, '🥊 DÂY ĐÀI ĐỠ!', '#ff9a6a', 16);
    return false;
  } },
  jack_12c: { onFall(f, m) {
    if (f._second) return true;
    f._second = true;
    const p = m.arena.clamp({ x: f.x, y: f.y }, 20), a = Math.atan2(-p.y, -p.x);
    f.x = p.x; f.y = p.y; f.vx = Math.cos(a) * 650; f.vy = Math.sin(a) * 650; f.hitstun = 0.2; f.invulnT = Math.max(f.invulnT, 0.8);
    m.fx({ type: 'boom', x: f.x, y: f.y, r: 60, color: '#ffd27a', life: 0.35 }); m.text(f.x, f.y - 60, '🎲 MẠNG THỨ HAI!', '#ffd700', 19); m.shake(8);
    return false;
  } },
  clint_6a: { setup(f) { mulCd(f, 'A', 2); } },
  clint_12c: { onKill(f, v, m) { f.ws.shells = maxShells(f); f.cd.C = 0; m.text(f.x, f.y - 60, '🔄 BĂNG ĐẠN VÔ TẬN', '#ffe066', 15); } },
  zero_12b: { setup(f) { mulCd(f, 'A', 0.5); } },
  ignatius_12c: { onFall(f, m) {
    if (f._phoenix) return true;
    f._phoenix = true;
    m.fx({ type: 'line', x1: f.x, y1: f.y, x2: 0, y2: -30, color: '#ff8a2a', life: 0.5, w: 10 });
    f.x = rand(-40, 40); f.y = -30; f.vx = f.vy = 0; f.hitstun = 0; f.percent *= 0.5; f.invulnT = Math.max(f.invulnT, 1.5);
    m.fx({ type: 'boom', x: f.x, y: f.y, r: 90, color: '#ff8a2a', life: 0.5 }); m.text(f.x, f.y - 60, '🔥 PHƯỢNG HOÀNG TÁI SINH!', '#ffb36a', 19); m.shake(8);
    return false;
  } },
  death_6a: { setup(f) { mulCd(f, 'A', 2); } },
  death_12c: { onKill(f, v, m) { f.ws.souls = Math.min(3, (f.ws.souls || 0) + 1); m.text(f.x, f.y - 60, `👻 OAN HỒN x${f.ws.souls}`, '#c0b0ff', 15); } },
  theron_12b: {
    onTake(t, att, hit, info) { info.kbMult *= 0.6; },
    onDeal(f, t, hit, info) { if (hit.tag === 'A' || hit.tag === 'B') info.kbMult *= 1.35; },
    update(f) { f.frameSpeed *= 0.85; },
  },
  koda_6c: { update(f, m) { if (towardEnemy(f, m, (t) => t.has('bleed') && t.has('bleed').n >= 3)) f.frameSpeed *= 1.3; } },
  koda_12b: { setup(f) { f.bodyK = 1.3; f.weightFactor *= 1.15; } },
  koda_12c: { onTake(t, att, hit, info, m) {
    if (!att || att.isEnv || hit.quiet || m.time < (t._hkaCd || 0) || ((hit.kb || 0) < 140 && (hit.dmg || 0) < 7)) return;
    t._hkaCd = m.time + 10; t.ws.hka = 3;
    m.text(t.x, t.y - 60, '🐺 CUỒNG BẠO!', '#ff4a3a', 17);
  } },
  songluc_12c: { onFall(f, m) {
    if (f._loop) return true;
    f._loop = true;
    const p = m.arena.clamp({ x: f.x, y: f.y }, 40);
    f.x = p.x; f.y = p.y; f.vx = f.vy = 0; f.hitstun = 0; f.percent = 0; f.invulnT = Math.max(f.invulnT, 1.5);
    m.fx({ type: 'ring', x: f.x, y: f.y, r: 70, color: '#8af0ff', life: 0.6, w: 8 }); m.text(f.x, f.y - 60, '♾️ VÒNG LẶP VĨNH CỬU', '#8af0ff', 19);
    return false;
  } },
  roxie_6a: { onTake(t, att, hit, info, m) {
    if (!t.has('rarmor') || !att || att.isEnv || hit.reflect) return;
    info.kbMult *= 0.4;
    const o = att.owner || att;
    if (o.alive && dist(o, t) < 200) info.extra.push(() => m.applyHit(t, o, { dmg: 2, kb: 170, kg: 2, reflect: true, tag: 'B', angle: angTo(t, o), quiet: true }));
  } },
};
function talEach(f, name, ...args) {
  const L = f.talFx;
  if (!L || !L.length) return true;
  for (const fx of L) if (fx[name] && fx[name](...args) === false) return false;
  return true;
}
