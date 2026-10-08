# GĐ6c — Hộ vệ bảo vệ chủ, quạ Oca và súng ngắm của Raven

Làm theo các yêu cầu sau GĐ6b:
- Hộ vệ của Aria nhắm kẻ đánh cô và đuổi tới khi cách Aria quá xa, hoặc khi có lệnh thu hồi.
- Lính của Victoria cũng làm như vậy.
- Quạ của Raven bay trông rõ ràng hơn.
- Raven tìm chỗ an toàn, đổi sang súng ngắm, thả quạ rồi bắn qua tầm nhìn của nó. Lúc này quạ có thể bị tiêu diệt.

## 1. Đã làm gì

### Hộ vệ (`src/data/heroes/_common.js` → `H.guardThink`, `aria.js`, `victoria.js`, `src/sim/combat.js`)
- Mỗi lần trúng đòn, trận giờ ghi lại **kẻ vừa đánh**, bất kể là tướng, vật triệu hồi hay quái.
- **Ai đánh chủ, hộ vệ nhắm ngay kẻ đó** và đuổi theo cho tới khi một trong các điều sau xảy ra:
  - chính hộ vệ đã cách chủ quá xa: Oktava 14 đv, lính Victoria 13 đv. Khi đó nó quay về cạnh chủ (hiện dấu "↩");
  - chủ ra **lệnh thu hồi** (hiện "📯 Thu hồi …"). Chủ thu hồi khi đang rút lui hoặc bỏ chạy, hoặc khi hộ vệ còn dưới 20% máu (chủ cứu nó).
- **Đổi mục tiêu**: nếu một kẻ khác đánh chủ trong khi mục tiêu cũ đã thôi đánh chủ hơn 3 giây, hộ vệ chuyển sang kẻ mới.
- **Khi không ai đánh chủ**: hộ vệ phụ chủ đánh mục tiêu của chủ, tự vệ khi bị đánh, hoặc đi theo đội hình. Lính Victoria giữ đội hình cũ.
- Hiển thị: hộ vệ đang nhắm kẻ đánh chủ có dấu "!" và vạch nét đứt tới mục tiêu.

### Quạ Oca và súng ngắm của Raven (`src/data/heroes/raven.js`, `hero_ai.js`, `match.js`)
- **Oca giờ là vật bay thật**, không còn là một vùng như trước:
  - bay thẳng tới điểm thả trong phạm vi 16 đv, qua được cả tường;
  - lượn vòng trên đầu kẻ địch gần nhất;
  - cho tầm nhìn 8 đv, nhìn thấu tàng hình và bụi;
  - mỗi giây thả **bom mini** (thấy được quả bom rơi): làm chậm và đánh dấu mục tiêu.
  - Oca **có máu riêng và bị bắn hạ được**, khi đó hiện "🐦 Oca bị bắn hạ!".
- **Súng ngắm**: thả Oca từ chỗ an toàn thì Raven đổi sang súng ngắm.
  - Đứng yên; tầm bắn tăng từ 7.2 lên **14.7 đv**, nên bắn được qua tầm nhìn của quạ.
  - Bắn chậm hơn 35%, nhưng mỗi viên mạnh hơn 45% và không tốn băng súng trường.
  - Raven di chuyển, bị đẩy, hoặc Oca chết thì đổi lại súng trường.
- **AI của Raven**, theo thứ tự:
  1. Biết vị trí một đối thủ ở xa (7–22 đv, thấy trong 8 giây gần nhất) và không ai áp sát.
  2. Đi tới chỗ an toàn (hiện "🐦 Tìm chỗ thả quạ"): ngoài tầm đánh của đối thủ cộng thêm 3.5 đv, cách đối thủ 10–13.5 đv; có bụi phù hợp thì núp bụi.
  3. Thả quạ về phía đối thủ, rồi "🎯 Đổi súng ngắm".
  4. Đứng bắn, ưu tiên kẻ bị quạ đánh dấu và kẻ ít máu, xen chiêu Bắn Tỉa Xuyên Phá.
  5. Đổi lại súng trường ("🔫") khi:
     - bị áp sát dưới 6.5 đv;
     - bị tướng trong 10 đv bắn;
     - máu dưới 30%;
     - phải rút lui hoặc chạy bo.
- Raven không còn ném quạ bừa vào quái hay ném vào giữa giao tranh. Quạ dành cho việc trinh sát và bắn tỉa.
- **Đối thủ bắn quạ**: tướng địch có quạ trong tầm đánh (+3 đv) mà không đang đánh tướng nào thì bắn hạ quạ (hiện "🐦 Bắn hạ quạ"). Chiêu diện rộng cũng trúng quạ.
- **Hình ảnh**:
  - Quạ bay cao, có bóng dưới đất, vỗ cánh, mắt xanh phát sáng, khớp cánh kim loại; có vòng tầm nhìn nét đứt, thanh máu và tên "🐦 Oca".
  - Raven cầm súng ngắm (nòng dài, ống ngắm, chân chống); có tia laser đỏ và tâm ngắm trên mục tiêu; đạn bắn tỉa là vệt sáng dài.
  - Camera coi "🎯 Bắn tỉa qua mắt quạ" là một điểm nóng.

## 2. Đo đạc (ít)

| Thử | Kết quả |
|---|---|
| Lính Victoria đuổi kẻ vừa đánh Victoria rồi bỏ chạy | Đuổi tới khi cách Victoria ~13 đv thì quay về (đúng ngưỡng 13). |
| Oktava khi Kazuki đánh Aria | Nhắm ngay Kazuki và giữ mục tiêu suốt giao tranh. |
| Raven trong 3 trận thật | Mỗi lần thả quạ đều đổi súng ngắm. Ngắm trung bình 1.4–6.2 giây mỗi lần; 23–38 phát súng ngắm mỗi trận, hơn nửa bắn xa trên 9 đv. Quạ bị bắn hạ 1–3 lần mỗi trận. |
| Lý do Raven đổi lại súng trường | 7 lần do bị áp sát, 9 lần do bị bắn; còn lại do quạ hết giờ hoặc bị hạ. |
| 24 trận (`docs/GD6C_MO_PHONG.txt`) | Trận trung bình 36.0 phút; giao tranh giữa 35 giây; 0 lỗi; tất định ✔ |
| Hạng trung bình (trước → sau) | Victoria 6.1 → **3.4**, Aria 3.4 → 4.1, Raven 5.4 → 5.8 |

## 3. Chưa xong
- **Raven farm chậm hơn** (cấp trung bình 8.3 → 6.8) vì không còn dùng quạ để ăn quái, và hay dừng lại ngắm. Có thể cho quạ dọn quái khi không có đối thủ quanh đây.
- Thời gian ngắm mỗi lần khá ngắn (trung vị ~2 giây) vì đối thủ thấy bị bắn thì lao tới. Raven chưa biết đổi chỗ ngắm hay lùi tiếp.
- Hạng trung bình đổi chủ yếu do nhiễu: mỗi tướng chỉ có 7–9 trận.

## 4. Các con số "khởi điểm" mới / đã đổi

| Con số | Giá trị |
|---|---|
| Oktava đuổi tối đa | 14 đv tính từ Aria (trước: không quá 6.5 đv quanh Aria, cách Aria quá 8 đv là quay về ngay) |
| Lính Victoria đuổi tối đa | 13 đv tính từ Victoria (trước: 7 / 9 đv) |
| Thu hồi | chủ rút lui / bỏ chạy, hoặc hộ vệ dưới 20% máu; quay về tới cách chủ 2.2 đv |
| Quạ Oca | máu 120 + 28×cấp, giáp/kháng phép 12 + cấp, bay 7.5 đv/giây, tầm nhìn 8 đv (nhìn thấu tàng hình), thả tới 16 đv (trước 10), không bay quá 18 đv khỏi Raven |
| Súng ngắm | tầm +7.5, tốc đánh −35%, sát thương mỗi viên ×1.45, không tốn băng |
