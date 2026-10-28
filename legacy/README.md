# Legacy Arena

Game đối kháng điều khiển trực tiếp với **40 tướng**, offline đấu bot và online **WebRTC P2P 1v1**. Giữ luật Legacy: điểm văng %, lực đẩy, chướng ngại, rơi đài và stock.

## Chạy

Node.js >=22; đã kiểm tra bằng Node 24.

```sh
cd /workspace/auto-bat/legacy
npm ci --cache /workspace/.cache/npm --no-audit --no-fund
npm run dev
```

Máy cá nhân có thể dùng `npm ci` với cache mặc định. `npm run dev` hoặc `npm start` build rồi chạy HTTP/WebSocket signaling trên cổng **8002**, bind `127.0.0.1`. `PORT` và `HOST` điều chỉnh nơi lắng nghe. Hai người cần mở cùng dịch vụ ghép phòng; bản hiện tại chưa được triển khai công khai.

Chọn tướng → **Tạo phòng** hoặc nhập mã sáu ký tự → cả hai **Sẵn sàng**. Mỗi máy đo hiệu năng, sau đó tự chọn máy host và thiết lập WebRTC. Nhãn trong trận cho biết máy nào làm host. Thiếu người thì chờ; không có bot lấp chỗ online.

## Ưu tiên máy mượt hơn làm host

Mỗi lần ready, một Web Worker chạy warmup và đo **512 tick mô phỏng** đại diện cho trận đấu. So sánh 80% thời gian tick p95 và 20% trung bình; máy có điểm thấp hơn được ưu tiên. Chênh lệch trong 5% giữ máy tạo phòng để giảm nhiễu. Người vào phòng sau có thể làm host; rematch đo lại.

Host mô phỏng 60Hz trong worker riêng, gửi snapshot 20Hz qua RTC DataChannel. Máy còn lại gửi input qua kênh RTC tin cậy và dựng hình từ snapshot. Việc chọn host dựa trên khả năng mô phỏng đo được, không phải tên CPU hay vị trí chủ phòng; kết nối mạng vẫn ảnh hưởng độ trễ.

Node giữ phòng, token và trao đổi SDP/ICE; **input và snapshot đi giữa hai máy bằng WebRTC**. Trận đang kết nối được tiếp tục khi WebSocket signaling bị ngắt. Tạo trận mới hoặc thiết lập lại kết nối cần signaling hoạt động.

## Kết nối qua Internet

Mặc định ICE không dùng máy chủ bên ngoài, phù hợp thử cục bộ/LAN. Để hai mạng khác NAT kết nối được, cấp cấu hình `RTCIceServer` qua `RTC_ICE_SERVERS` (JSON array), hoặc qua file:

```sh
RTC_ICE_SERVERS_FILE=/duong-dan/ice-servers.json npm run dev
```

Mỗi mục có `urls`; mục TURN cần `username` và `credential` do nhà cung cấp cấp. Dùng cấu hình STUN/TURN của môi trường triển khai và ưu tiên credential ngắn hạn. Không commit file credential. Server chỉ gửi cấu hình này cho thành viên phòng. HTTPS/WSS phục vụ trang và signaling; TURN hỗ trợ xuyên NAT/chuyển tiếp mạng, host vẫn chạy mô phỏng trên máy người chơi.

## Điều khiển

| Hành động | PC | Cảm ứng |
| --- | --- | --- |
| Di chuyển | WASD | Cần trái |
| Ngắm | Chuột | Giữ nút chiêu rồi kéo |
| A / B / C / D | Q / E / R / F | Nút tương ứng |
| Nộ / né E nếu có | Space / Shift | Nút Nộ / E |
| Tạm dừng offline | Escape | Nút Tạm dừng |

Chuột trái trên sàn: A; chuột phải: C. Tụ lực và biến thể nhấn giữ tính theo tick host; thả để tung, kéo vào Hủy để bỏ chiêu. Roxie giữ A dựng ụ pháo, giữ D gọi T-Zero tự vận hành, bấm D để lái. Không có pause/tua nhanh toàn trận online.

## Offline, save và reconnect

Service worker riêng tải trước mã/hình sau lần truy cập thành công. Chờ **Đã sẵn sàng chơi offline** trước khi ngắt mạng. Sau đó có thể reload, chọn tướng và tiếp tục trận đã lưu mà không cần mạng. Nhạc không được tải trước; giao diện điều khiển mới mặc định không phát nhạc nền.

Offline tự lưu seed/input mỗi hai giây, có tiếp tục và xuất/nhập JSON. Replay gắn version nội dung; file không tương thích được giữ nguyên. Bản HLV cũ ở `coach.html` giữ roster gốc 26 tướng và save `ai_battle_coach_v3`; vàng/đồ HLV không nhập vào online.

Input cũ ngừng sau 250ms. Peer mất kết nối có 20 giây nối lại. Guest reload nhận lại trạng thái từ host. Host lưu checkpoint input log mỗi 120 tick; khi reload phát lại từ mốc gần nhất, có thể lùi khoảng hai giây nếu lưu hoạt động bình thường. Mất checkpoint thì host chịu thua. Chưa có chuyển host trực tiếp giữa trận.

Host quyết định kết quả; đây là mô hình phòng chơi tin cậy, chưa có chống gian lận độc lập cho xếp hạng. Chưa có tài khoản, matchmaking công khai hoặc 3v3. Các tướng mới là bộ chiêu chuyển thể cho Legacy, chưa có cây talent HLV riêng và cần đo cân bằng với người chơi thật.

## Cấu trúc

```text
engine/       Vật lý, Fighter, Match, RNG và ArenaSession không DOM/Canvas/Audio
content/      26 bộ chiêu gốc và 14 bộ chiêu Legacy mới
controllers/  Human input và Brain cho bot offline / HLV cũ
client/       Renderer/input, WebRTC, worker benchmark và host simulation
protocol/     Phiên bản, chọn host và chia/ghép gói RTC
server/       Chỉ HTTP, room, token và SDP/ICE signaling
offline/      LocalSession và replay save
js/           UI HLV cũ, âm thanh và sprite
tests/        Engine, bộ chiêu, P2P protocol, host replay và signaling
tools/        Compile/build, audit roster, browser checks và TURN fixture
dist/         Runtime build tự chứa, được Git bỏ qua
```

`engine/runtime.mjs` và `client/render.mjs` được sinh lại khi build, không đưa vào Git. Engine dùng chung cho host worker và offline; client P2P nhận snapshot hiển thị. Snapshot không chứa callback hoặc quyền thực thi mã. Kênh state chia gói tối đa 12 KiB và bỏ snapshot cũ khi thất lạc mảnh; input/kết quả dùng kênh control tin cậy.

## Kiểm tra

```sh
npm test
npm run check:roster
python3 tools/browser-smoke.py
```

Browser check cần dịch vụ đang chạy với ICE phù hợp, Python Playwright và Chromium. Có thể đặt `CHROMIUM_PATH` và truyền base URL làm đối số đầu.

Môi trường cloud hiện quản lý Chromium để chặn UDP trực tiếp. Có thể kiểm tra đúng chính sách bằng coturn TCP cục bộ:

```sh
npm run test:browser
```

Cần `turnserver` từ coturn trên PATH hoặc đặt `TURNSERVER` trỏ binary. Nếu binary được giải nén riêng, `LEGACY_TURN_LIB_DIR` chỉ thư mục thư viện của nó. Fixture tự tạo credential tạm, bind loopback, chạy server ở cổng trống, chạy browser tests rồi tự dọn. Không sửa chính sách trình duyệt. `node tools/rtc-test.cjs --serve` giữ fixture cục bộ chạy trên cổng `PORT` hoặc 8002; fixture loopback chỉ dùng thử trên cùng máy.

Kiểm tra browser gồm offline/PWA, cảm ứng, RTC DataChannel thật, benchmark hai máy, reload guest/host, tiếp tục input/snapshot/kết quả sau khi đóng toàn bộ WebSocket signaling, vẽ đủ 40 tướng và HLV cũ. Đây chưa là bằng chứng hai mạng Internet khác NAT đã được kiểm tra.

## Build và tách repo

```sh
npm run build
node tools/build.cjs --out /tmp/legacy-arena-release
```

Runtime xuất tự chứa code/media. Static host phục vụ offline; online cần endpoint signaling `/socket` và ICE phù hợp. Build dùng kho media chung `../img/`, `../sound/`, `../favicon.ico`, hoặc `--assets-root`; không nhân đôi hơn 100 MiB media vào Git. Giữ ghi công ở `sound/NGUON.txt`. Build kiểm tra SHA-256, không ghi đè output đã bị người dùng sửa. Source vẫn trong repo hiện tại.

Xem [thiết kế tướng](docs/DOI_CHIEU_TUONG.md), [kế hoạch ban đầu](docs/KE_HOACH_ONLINE.md) và [báo cáo triển khai](docs/TRIEN_KHAI.md).
