# Legacy Arena

Game đối kháng điều khiển trực tiếp với **40 tướng**, offline đấu bot và online **WebRTC P2P 1v1**. Giữ luật Legacy: điểm văng %, lực đẩy, chướng ngại, rơi đài và stock.

## Chạy

Node.js >=22; đã kiểm tra bằng Node 24.

```sh
cd /workspace/auto-bat/legacy
npm ci --cache /workspace/.cache/npm --no-audit --no-fund
npm run dev
```

Máy cá nhân có thể dùng `npm ci` với cache mặc định. `npm run dev` hoặc `npm start` build rồi chạy HTTP/WebSocket signaling riêng trên cổng **8002**, bind `127.0.0.1`. `PORT` và `HOST` điều chỉnh nơi lắng nghe. Khi mở bản Node này, hai người dùng cùng dịch vụ ghép phòng.

Chọn tướng → **Tạo phòng** hoặc nhập mã sáu ký tự → cả hai **Sẵn sàng**. Mỗi máy đo hiệu năng, sau đó tự chọn máy host và thiết lập WebRTC. Nhãn trong trận cho biết máy nào làm host. Thiếu người thì chờ; không có bot lấp chỗ online.

GitHub Pages phục vụ trực tiếp `/auto-bat/legacy/index.html` từ repo. Trên tên miền `*.github.io`, online tự dùng **PeerJS Cloud**, không gọi `/socket` trên Pages. Người tạo phòng nhận mã sáu ký tự để gửi bạn chơi. PeerJS thiết lập kênh ghép phòng giữa hai máy; host mô phỏng vẫn được chọn theo hiệu năng, kể cả người vào sau. Khi kênh P2P đã mở, gameplay không phụ thuộc kết nối máy chủ ghép phòng.

`engine/runtime.mjs`, `client/render.mjs`, `precache.json` và `sw.js` được sinh sẵn và đưa vào Git để Pages chạy mà không cần build trên máy chủ. Chạy `npm run build` rồi commit các file sinh lại khi sửa nguồn. Icon và media của bản nguồn dùng `../img/`, `../sound/`; bản `dist/` vẫn tự chứa. PeerJS 1.5.5 được đóng gói trong `vendor/`, có giấy phép MIT kèm theo, không tải thư viện từ CDN khi mở game/offline.

## Ưu tiên máy mượt hơn làm host

Mỗi lần ready, một Web Worker chạy warmup và đo **512 tick mô phỏng** đại diện cho trận đấu. So sánh 80% thời gian tick p95 và 20% trung bình; máy có điểm thấp hơn được ưu tiên. Chênh lệch trong 5% giữ máy tạo phòng để giảm nhiễu. Người vào phòng sau có thể làm host; rematch đo lại.

Host mô phỏng 60Hz trong worker riêng, gửi snapshot 20Hz qua RTC DataChannel. Máy còn lại gửi input qua kênh RTC tin cậy và dựng hình từ snapshot. Việc chọn host dựa trên khả năng mô phỏng đo được, không phải tên CPU hay vị trí chủ phòng; kết nối mạng vẫn ảnh hưởng độ trễ.

Ở bản Node, server giữ phòng, token và trao đổi SDP/ICE. Trên Pages, người tạo phòng điều phối lobby/token/ready qua kênh PeerJS DataChannel tin cậy; vai trò này độc lập với máy host mô phỏng. **Input và snapshot đi giữa hai máy bằng WebRTC riêng**, không đi qua máy chủ PeerJS. Mỗi phòng tối đa hai người. Trận đang kết nối được tiếp tục khi broker ngắt; tạo kết nối mới cần dịch vụ ghép phòng hoạt động.

## Kết nối qua Internet

**Bản Pages:** mặc định dùng broker `0.peerjs.com` và bộ STUN/TURN công khai do PeerJS 1.5.5 cung cấp. Hai người chỉ cần mở cùng phiên bản trang, tạo/vào phòng rồi sẵn sàng; không cần tự chạy Node. Kết nối phụ thuộc dịch vụ PeerJS/STUN/TURN và điều kiện mạng. Có thể chuyển sang broker/ICE riêng bằng cấu hình `window.LEGACY_ONLINE_CONFIG` trước khi module client chạy: `transport: "peer"`, `peerjs: {host, port, path, secure}`, `iceServers: [...]`. Không đưa credential TURN riêng, dài hạn vào Git.

Trên static host khác, thêm `?rooms=peer` để dùng cùng luồng PeerJS; `?rooms=server` dùng `/socket`. Cấu hình `transport` được ưu tiên hơn query. Cấu hình `signalingURL` cho phép bản server dùng một endpoint WebSocket riêng. Mặc định Pages luôn chọn PeerJS.

**Bản Node riêng:** ICE mặc định không dùng máy chủ bên ngoài, phù hợp thử cục bộ/LAN. Để hai mạng khác NAT kết nối được, cấp cấu hình `RTCIceServer` qua `RTC_ICE_SERVERS` (JSON array), hoặc qua file:

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

### Ngắm trên điện thoại

- **Giữ nút chiêu** để xem vùng ngắm: đường thẳng, hình quạt, vòng tròn, vùng đặt chiêu hoặc hướng lướt. Chiêu thường chưa được tung khi mới giữ; thả để dùng. Chiêu giữ khiên/channel vẫn bắt đầu khi nhấn theo cơ chế riêng.
- **Kéo khỏi tâm nút** để ngắm tay. Hướng tay được ưu tiên hơn khóa mục tiêu; có thể dùng cần trái đồng thời bằng ngón khác. Kéo vào vòng **Hủy** rồi thả để bỏ chiêu; mất cảm ứng/đổi ứng dụng cũng hủy.
- **Chạm đối thủ** để khóa hướng nhìn, hoặc dùng nút **Ngắm** để bật/tắt. Có vòng đánh dấu mục tiêu; nhân vật quay theo đối thủ nhưng không tự di chuyển hay tự dùng chiêu. Khi đối thủ KO, rơi đài hoặc không thể nhắm, bỏ khóa cũ và tìm mục tiêu hợp lệ.

Dữ liệu vùng ngắm cho 40 tướng được tạo lúc build từ các lần dùng chiêu cơ bản trong engine, không chạy mô phỏng phụ trên điện thoại. Các kỹ năng phụ thuộc trạng thái/recast chưa thu được hình học đầy đủ có nét đứt và nhãn **Tầm ngắm tham khảo**; vùng ngắm không dự đoán mọi vật cản, chiêu phản ứng hoặc mục tiêu đang di chuyển. Chức năng dùng cùng input/renderer cho offline và online, không thêm Brain cho người chơi.

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

`engine/runtime.mjs` và `client/render.mjs` được sinh lại khi build và đưa vào Git để bản GitHub Pages chạy được. Sửa các file nguồn thay vì sửa trực tiếp module sinh ra. Engine dùng chung cho host worker và offline; client P2P nhận snapshot hiển thị. Snapshot không chứa callback hoặc quyền thực thi mã. Kênh state chia gói tối đa 12 KiB và bỏ snapshot cũ khi thất lạc mảnh; input/kết quả dùng kênh control tin cậy.

## Kiểm tra

```sh
npm test
npm run check:roster
npm run test:static
python3 tools/browser-smoke.py
```

Browser check cần dịch vụ đang chạy với ICE phù hợp, Python Playwright và Chromium. Có thể đặt `CHROMIUM_PATH` và truyền base URL làm đối số đầu.

`test:static` tự phục vụ **chỉ những file đã được Git theo dõi** ở đúng đường dẫn `/auto-bat/legacy/index.html`. Kiểm tra module/icon không 404, đủ 40 tướng, worker chọn host và reload offline với ảnh dùng chung. Không chạy compile trước bước này để phát hiện file sinh ra bị thiếu trong bản đưa lên Git.

Kiểm tra cảm ứng bổ sung dùng sự kiện đa điểm thật của Chromium ở màn hình ngang/dọc và trong trận P2P: giữ xem vùng ngắm chưa bắn, di chuyển + ngắm hai ngón, thả bắn đúng hướng, hủy không bắn, chạm khóa mục tiêu và truyền góc/target tới host. `client/skill-guides.mjs` được sinh từ `tools/skill-guides.mjs` và đưa vào Git cùng các artifact runtime khác.

Môi trường cloud hiện quản lý Chromium để chặn UDP trực tiếp. Có thể kiểm tra đúng chính sách bằng coturn TCP cục bộ:

```sh
npm run test:browser
```

Cần `turnserver` từ coturn trên PATH hoặc đặt `TURNSERVER` trỏ binary. Nếu binary được giải nén riêng, `LEGACY_TURN_LIB_DIR` chỉ thư mục thư viện của nó. Fixture tự tạo credential tạm, bind loopback, chạy server ở cổng trống, chạy browser tests rồi tự dọn. Không sửa chính sách trình duyệt. `node tools/rtc-test.cjs --serve` giữ fixture cục bộ chạy trên cổng `PORT` hoặc 8002; fixture loopback chỉ dùng thử trên cùng máy.

Kiểm tra browser gồm offline/PWA, cảm ứng, RTC DataChannel thật, benchmark hai máy, reload guest/host, tiếp tục input/snapshot/kết quả sau khi đóng toàn bộ WebSocket signaling, vẽ đủ 40 tướng và HLV cũ. Fixture còn chạy PeerServer chính thức cục bộ và phục vụ **chỉ file Git** ở `/auto-bat/legacy/index.html`, không có `/socket`: hai người vào bằng mã, tự chọn host, rematch, reload người tạo/người vào và chơi tiếp/kết thúc sau khi broker dừng. Đây chưa là bằng chứng dịch vụ công khai hoặc hai mạng Internet khác NAT đã được kiểm tra.

## Build và tách repo

```sh
npm run build
node tools/build.cjs --out /tmp/legacy-arena-release
```

Runtime xuất tự chứa code/media. Static host chơi offline và có thể dùng phòng PeerJS như trên; bản server dùng `/socket` và ICE riêng. Build dùng kho media chung `../img/`, `../sound/`, `../favicon.ico`, hoặc `--assets-root`; không nhân đôi hơn 100 MiB media vào Git. Giữ ghi công ở `sound/NGUON.txt` và `vendor/PEERJS-LICENSE.txt`. Build kiểm tra SHA-256, không ghi đè output đã bị người dùng sửa. Source vẫn trong repo hiện tại.

Xem [thiết kế tướng](docs/DOI_CHIEU_TUONG.md), [kế hoạch ban đầu](docs/KE_HOACH_ONLINE.md) và [báo cáo triển khai](docs/TRIEN_KHAI.md).
