# Báo cáo GĐ5e — camera tiên tri, xử lý khi bị đuổi, Utility cho chiêu, tầm nhìn đội, thông báo hạ gục, UX

## Đã làm

### Camera "tiên tri" điểm nóng
- **Cách chấm**:
  - Mỗi 0,25 giây (giờ trận), camera chấm điểm các điểm nóng **đang và sắp** xảy ra.
  - Có 7 loại:

    | Biểu tượng | Điểm nóng |
    |---|---|
    | ⚔ | Giao tranh |
    | ⚡ | Sắp chạm trán: hai tướng khác phe đang lao vào nhau, dự đoán vị trí 1,2 giây tới |
    | 🎯 | Sắp bắt lẻ: tướng đang đi bắt lẻ còn cách đích không xa |
    | 🐉 | Đánh quái lớn |
    | 👑 | Đánh quái cuối |
    | 🏰 | Công trụ / nhà chính |
    | 🏃 | Truy đuổi tướng máu thấp |

  - Camera lia tới **trước** khi pha giao tranh nổ ra.
- **Giữ ổn định**:
  - Điểm đang chiếu được cộng điểm bám, giữ tối thiểu 2,5 giây.
  - Chỉ đổi khi có điểm nóng mới hơn hẳn, nên không lia qua lại liên tục.
  - Giao tranh trải rộng thì camera tự lùi ra (tối đa ×0,7).
- **Không lộ thông tin**: khi xem theo góc một phe, camera chỉ dùng thứ phe đó thấy được và ý định của phe mình.
- **Nhãn camera**: "🎥 …" ở đáy màn hình cho biết camera đang chiếu gì; chạm vào để bật/tắt camera tự động.

### Bị đuổi: đánh trả, chiêu chạy, cắt đuôi, hết cách thì quay lại đánh
- **Ai là kẻ đuổi**: tướng địch thấy được trong 9 đv đang đánh mình, đang hướng về mình, hoặc đang áp sát.
- **Ước lượng**: AI tính **còn bị đánh bao lâu trên đường chạy**, so với **chịu được bao lâu**.
  - Nhanh hơn kẻ đuổi thì thoát dần khỏi tầm.
  - Chậm hơn thì bị bám tới chỗ an toàn.
- **Chấm 4 lựa chọn**:
  - 🏃 **Chạy** về trụ / đồng đội, vừa chạy vừa dùng chiêu khống chế / phòng thủ lên kẻ đuổi gần (đánh trả khi chạy).
  - 💨 **Chiêu thoát thân / Tốc Biến**: chọn điểm đáp tốt nhất trong 12 hướng, ưu tiên:
    - xa kẻ đuổi (tính theo đường đi bộ của chúng);
    - về phía an toàn;
    - **bên kia tường** (kẻ đuổi phải đi vòng);
    - **vào bụi**;
    - ngoài tầm trụ địch.

    Tốc Biến chỉ dùng khi nguy thật.
  - 🌿 **Cắt đuôi qua bụi**: vào bụi ở phía xa kẻ đuổi. Mất tầm nhìn thì kẻ đuổi buông. Đọc Bản Đồ cao hay dùng cách này hơn.
  - ↩ **Quay lại đánh** khi một trong ba điều kiện đúng:
    - đang thắng thế rõ;
    - kẻ đuổi sắp chết trong tầm dồn sát thương;
    - **hết đường chạy** (không kịp, không còn chiêu thoát, đã bị áp sát, máu < 50%) thì liều.

    Quay lại thì đánh hết mình ~1,8 giây, dùng cả chiêu cuối.
- **Tính cách và chỉ số**: lối chơi Hổ báo hay quay lại hơn, An toàn ít hơn. Phản Xạ thấp thì quyết định nhiễu hơn; Kỹ Năng Cá Nhân thấp thì chọn điểm đáp kém hơn.

### Utility cho chiêu: đánh lính, di chuyển, chạy, vượt địa hình
- **Lính đầu trận bớt trâu**:
  - Máu gốc giảm: cận chiến 420 → 330, đánh xa 280 → 215, xe 860 → 760.
  - Máu theo phút tăng nhanh hơn, nên tới phút 10 bằng bản cũ.
- **Dùng chiêu lên lính / quái** — chấm điểm từng chiêu theo 6 yếu tố:

  | Yếu tố | Nội dung |
  |---|---|
  | Lợi ích | Kết liễu được lính mà đánh thường không kịp; diện rộng trúng nhiều lính |
  | Mana còn lại | |
  | Hồi chiêu | Hồi ngắn thì dùng thoải mái hơn |
  | Nhu cầu | Dọn lính ở trụ > đẩy > giữ lính: lúc giữ lính chỉ dùng chiêu kết liễu |
  | Giữ chiêu để đấu | Khi có đối thủ gần |
  | Tay nghề | Ăn Lính + thành thạo |

  - Bỏ mốc cũ "chỉ dùng chiêu ăn lính sau phút 4".
  - AI **học sát thương thật** của từng chiêu lên lính để biết chiêu nào kết liễu được.
- **Lướt để di chuyển**:
  - Khi phải đi xa (đảo đường, về thủ, tới mục tiêu) và không có địch quanh, tướng có chiêu lướt sẽ lướt theo hướng đi.
  - Chiêu xuyên tường (Ignatius, Raven) còn **vượt tường** khi rút ngắn được đường.
  - Giữ chiêu lướt lại nếu đối thủ đang mất tích hoặc vừa thấy gần đây (để còn thoát thân).
- **Bảng chiêu di chuyển** cho 12 tướng: tầm lướt, nhảy lùi, xuyên tường. Lập bằng cách thử từng chiêu, vì một số chiêu "nhảy lùi" bật ngược hướng chỉ.

### Utility dùng thông tin qua tầm nhìn của đội
- Lính địch trong sương mù không tính vào "lính trên đường".
- Rừng địch chỉ tính bãi đang thấy.
- Máu đối thủ dùng **máu lúc thấy lần cuối** (bộ nhớ nhận thức theo Đọc Bản Đồ), không phải máu thật.
- Chiêu lên lính, lựa chọn khi bị đuổi và camera đều chỉ dùng thứ đội thấy được.
- **Thủ nhà** giờ xét lính địch dồn ở trụ **cả 3 đường**, không chỉ đường mình. Người đi rừng / hỗ trợ coi mọi đường là việc của mình.

### Thông báo hạ gục
- **Các loại thông báo**:
  - CHIẾN CÔNG ĐẦU.
  - Liên hạ (các mạng cách nhau ≤ 10 giây): HẠ GỤC KÉP / BA / BỐN / HUYỀN THOẠI — HẠ CẢ NĂM.
  - Chuỗi hạ gục: ĐANG HỦY DIỆT / KHÔNG THỂ CẢN PHÁ / THỐNG TRỊ / NHƯ THẦN THÁNH.
  - CHẤM DỨT CHUỖI n MẠNG.
  - TIÊU DIỆT TOÀN ĐỘI.
- **Cách hiện**:
  - Hạ gục thường: thẻ nhỏ "A ⚔ B (+hỗ trợ)".
  - Thông báo xếp hàng, không chồng lên nhau, có âm thanh.

### UX trong trận
- **Thu gọn dải tuyển thủ** (nút ◂/▸): chỉ còn chân dung + thanh máu, sân rộng hơn hẳn trên điện thoại. Máy nhớ lựa chọn.
- **Nút lệnh đang hồi** vẫn thấy biểu tượng, số giây nằm ở góc. Trước đây con số che mất biểu tượng.
- **Nhãn camera** ở đáy màn hình.
- **Lớp gỡ lỗi AI** hiện thêm: 3 lựa chọn khi bị đuổi kèm điểm, và lần dùng chiêu Utility gần nhất (ăn lính / lướt / vượt tường).

## Số đo (ít, theo dặn — chi tiết `docs/GD5E_MO_PHONG.txt`)

6 trận cùng hạt giống, HLV máy hai bên:

| Chỉ số | GĐ5d | GĐ5e |
|---|---|---|
| Thời lượng TB | 22,0 phút | 24,7 phút (16,5–30,8) |
| Trận > 30 phút | 0/6 | 1/6 (30,8) |
| Hạ gục mỗi trận | 36,2 | **51,0** |
| Lính kết liễu 10 phút đầu (cả 10 tướng) | 221 | **249** (+13%) |
| Trụ phá mỗi trận | 8,8 | 10,3 |
| Lỗi trong trận | 0 | 0 |

**Hoạt động mới**, trung bình mỗi trận:
- ~362 lần dùng chiêu lên lính / quái.
- ~167 lần lướt để di chuyển, trong đó ~10 lần vượt tường.
- Khi bị đuổi:

  | Lựa chọn | Số lần |
  |---|---|
  | Chạy | ~447 |
  | Chiêu thoát / Tốc Biến | ~47 |
  | Quay lại đánh | ~85 |
  | Cắt đuôi qua bụi | ~4 |

**Camera**:
- 58/58 lần báo "sắp chạm trán / sắp bắt lẻ" đều thành giao tranh trong ≤ 6 giây.
- Đổi chỗ chiếu ~6,8 lần/phút.

**Kiểm tra khác**:
- Tất định & phát lại: ✔.
- Giao diện điện thoại + máy tính: không lỗi trang.

**Lỗi phát hiện khi đo và đã sửa**:
- Ước lượng "không chạy kịp" quá bi quan với kẻ đuổi đánh xa, nên AI quay lại liều quá nhiều. Đã sửa mô hình.
- Camera lộ quái lớn đội địch đang đánh trong sương mù. Đã sửa.
- Nút thu gọn làm lệch dải tuyển thủ. Đã sửa.

## Con số "khởi điểm" đã đổi (cần lưu ý)
1. **Máu lính**:

   | Loại lính | Bản cũ | GĐ5e |
   |---|---|---|
   | Cận chiến | 420 (+18/phút) | 330 (+27/phút) |
   | Đánh xa | 280 (+10/phút) | 215 (+16,5/phút) |
   | Xe | 860 (+30/phút) | 760 (+40/phút) |

   Tới phút 10 bằng bản cũ; sau đó trâu hơn chút.
2. **Gia cố trụ đầu trận**: công trình nhận 35% sát thương lúc 0:00, tăng dần tới 100% ở **phút 15** (trước: 40% → phút 10). Đây là chốt chặn chống trận kết thúc trước phút 15.
3. **Bỏ mốc dùng chiêu ăn lính** (trước: chỉ sau phút 4, dọn lính sau 1:30, chỉ chiêu có nhãn "ăn lính"). Giờ mọi chiêu cấu rỉa / dồn sát thương / khống chế đều có thể dùng lên lính nếu đáng.
4. **Hạ gục mỗi trận tăng ~40%** (36 → 51), do quay lại đánh khi bị đuổi và trận dài hơn.
5. **Thủ nhà** nhận việc dọn lính ở mọi đường (trước chỉ đường của mình).
6. **Sự kiện hạ gục** mang thêm thông tin thông báo (chỉ để hiển thị, không ảnh hưởng mô phỏng).

## Việc còn dở (để GĐ6)
- **Nhịp trận nhạy**: thay đổi nhỏ của AI làm thời lượng một trận dao động 14–33 phút với cùng hạt giống. Cần mô phỏng lớn để cân lại:
  - số hạ gục (51/trận có thể cao);
  - tần suất "quay lại đánh";
  - hiện tượng lính dồn đống (50–70 con) ở đội đang thắng — có từ GĐ5d.
- **Cắt đuôi qua bụi** ít được chọn (~4 lần/trận), vì thường không có bụi đúng hướng. Có thể thêm cắt đuôi vòng góc tường.
- **Bảng chiêu di chuyển** lập tay cho 12 tướng. Tướng mới hoặc bản làm lại cần đo và thêm vào.
- **Lớp gỡ lỗi AI** chồng nhau khi nhiều tướng đứng sát nhau.
