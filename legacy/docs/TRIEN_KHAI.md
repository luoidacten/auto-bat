# Bản triển khai Legacy Arena — P2P

Cập nhật 29/10/2026. GitHub Pages tự ghép phòng qua PeerJS Cloud; bản Node riêng vẫn hỗ trợ `/socket`. Online đã chuyển sang WebRTC và chọn host theo hiệu năng đo được trước mỗi trận. Đây là bản chơi được trong workspace; chưa triển khai máy chủ Internet công khai.

## Đã thực hiện

- Tách core, dữ liệu/vũ khí, Fighter, Match và bot ra `engine/`, `content/`, `controllers/`; tách Canvas/sprite/HUD ra client. Module `engine/runtime.mjs` sinh từ nguồn dùng chung, import được trong Node mà không giả lập window, DOM hay Canvas. Module runtime/renderer và manifest offline được đưa vào Git để GitHub Pages phục vụ trực tiếp `legacy/index.html`, không phụ thuộc build trên máy chủ. Bản nguồn dùng chung media qua `../img/`; `dist/` vẫn tự chứa.
- Dùng fixed step 60Hz và RNG riêng từng session. Host Web Worker, offline và replay dùng cùng engine. Client còn lại dựng hình từ snapshot nhận qua WebRTC.
- Human slot không tạo Brain. Điều khiển WASD/chuột, A/B/C/D/Nộ/né, joystick và nút cảm ứng, hướng ngắm, giữ/thả tụ lực và biến thể nhấn giữ. Offline có bot; online luôn hai người thật. Vật triệu hồi là cơ chế kỹ năng, không là bot thay người chơi.
- Offline chạy lại sau khi ngắt mạng nhờ cache riêng, lưu bằng seed/input mỗi hai giây, có tiếp tục và xuất/nhập. Save HLV cũ được giữ nguyên.
- Trên GitHub Pages, PeerJS Cloud thiết lập kênh lobby P2P; người tạo phòng điều phối metadata, độc lập với host mô phỏng được chọn qua benchmark. Không gọi `/socket` trên Pages. Thư viện PeerJS 1.5.5 và giấy phép MIT được đóng gói sẵn trong `vendor/`.
- Ở bản Node riêng, server chỉ giữ phòng, token, ready và SDP/ICE; không tạo ArenaSession, không xử lý input/snapshot của trận. Đứt WebSocket ghép phòng không tự xử thua trận P2P đang kết nối.
- Trước mỗi trận, cả hai worker đo 512 tick sau warmup. Host được chọn theo 80% thời gian tick p95 + 20% trung bình; nếu chênh không quá 5% giữ máy tạo phòng để tránh nhiễu. Host có thể là người vào phòng sau. Rematch đo lại cả hai máy.
- WebRTC dùng kênh control tin cậy cho input/kết quả và kênh state không chờ truyền lại cho snapshot. Gói lớn được chia 12 KiB, có giới hạn dung lượng và bộ ghép mảnh. Không gửi SDP, ICE, token hoặc credential vào log.
- Host chạy fixed tick 60Hz trong Web Worker, gửi snapshot 20Hz. Hai fighter đều human; input cũ dừng sau 250ms; mất peer có thời gian nối lại 20 giây. Client dự đoán di chuyển giới hạn và nội suy đối thủ.
- Host lưu checkpoint bằng seed và input log mỗi 120 tick. Guest reload nối lại host đang chạy; host reload phát lại checkpoint. Khi phục hồi có thể quay về mốc lưu gần nhất (~2 giây khi lưu hoạt động bình thường). Nếu không còn checkpoint, host chịu thua thay vì tự bắt đầu lại trận.
- ICE lấy từ `RTC_ICE_SERVERS` hoặc `RTC_ICE_SERVERS_FILE`. Mặc định chỉ dùng candidate cục bộ. Triển khai qua Internet cần STUN/TURN phù hợp, ưu tiên credential TURN ngắn hạn. TURN chuyển tiếp dữ liệu mạng; mô phỏng vẫn chạy trên máy người chơi đã được chọn.
- Roster chính **40 tướng**: 26 tướng cũ và **14 tướng bổ sung**, không thêm tên rỗng. Mỗi tướng mới có tài nguyên/cơ chế, A/B/C/D/U, mô tả và bot. `songluc` được đối chiếu đúng với `chrononeo`.
- Bản HLV cũ ở `coach.html` giữ roster lịch sử 26 tướng. Battleground không được đổi engine hoặc bộ chiêu.

## Các cơ chế mới đã kiểm tra

| Tướng | Cơ chế đại diện |
| --- | --- |
| Boran | Băng Cổ có trần, tiêu băng làm khiên, biến hình |
| Ariston | Đức Tin, cầu nguyện có thể ngắt, điểm văng/stock tách biệt |
| Dr. Vector | Băng đạn hữu hạn, nạp lại, laser ngắm và bom từ tính |
| Lyra | Tầng Thủy Triều, khiên, sóng và xoáy |
| Ratok | Móc trúng, recast kéo, thả dây và target còn sống |
| Kip | Điểm Hư Không, neo trở về, vòm nuốt đạn, không teleport khi đã KO |
| Olivia | Cầu nguyện, thanh tẩy, hồi phục có trần và không hồi stock |
| Justus | Đức Tin, channel laser bị ngắt bởi stun |
| Mirage | Đánh dấu/đổi chỗ, hộp nổ trễ, ảnh có owner và giới hạn số lượng |
| Dahlia | Sân khấu/ảo ảnh; không chiếm quyền controller người chơi |
| Luca | 39 bộ A/B/C có thể sao chép; đổi bộ có cooldown riêng, không sao chép stock/controller |
| Dr. Caelus | Lịch sử 3.5s, không tua qua lần mất stock hoặc mạng mới |
| Bạch Diệp | Giới hạn phi kiếm, chọn ba thế U bằng input |
| Tsukiyo | Ba nhẫn thuật do người chọn, không reset cooldown khi đổi, không phản đạn đệ quy |

Các bộ chiêu là chuyển thể cho Legacy. Không giữ nguyên toàn bộ con số, cây talent hoặc mọi tương tác nâng cấp Battleground.

## Kiểm tra đã chạy

`npm test`: **137 kiểm tra đạt, 0 thất bại, 0 bỏ qua**; engine, input, determinism giữa session xen kẽ, replay offline, ring-out, charge/hold, ma trận 40 tướng, từng cơ chế mới, Luca sao chép 39 tướng, 14 bot offline, signaling hai kết nối, chọn host, RTC framing, phục hồi host, reconnect và build độc lập. Không có test bị skip hoặc vô hiệu hóa.

`python3 tools/browser-smoke.py`: năm nhóm chức năng:

1. Desktop: di chuyển, dùng chiêu, pause, lưu, ngắt mạng/reload và tiếp tục trận.
2. Cảm ứng: chọn tướng, vào trận, cần ảo và nút chiêu.
3. Hai browser context online: WebRTC data channel thật có byte gửi/nhận, benchmark hai máy, hai human slot, reload cả guest và host, ngắt toàn bộ WebSocket signaling rồi tiếp tục di chuyển/nhận trạng thái/kết quả qua P2P.
4. Vẽ đủ 40 tướng bằng model cục bộ và model dựng từ snapshot, trong khi các chiêu đang diễn ra.
5. Mở chế độ HLV cũ và chạy đấu thử AI với roster lịch sử 26 tướng.

`npm run check:roster`: Battleground 40, Legacy 40, chung 40, thiếu 0.

Kiểm tra PeerJS bổ sung: hai context browser mở đúng đường dẫn Pages từ máy chủ chỉ phục vụ file Git, không có `/socket`; tạo/vào phòng bằng mã, đo chọn host, rematch, reload cả người tạo lẫn người vào, tiếp tục điều khiển/nhận kết quả sau khi dừng PeerServer. Dùng PeerServer chính thức và TURN/TCP cục bộ, không giả lập RTC, không sửa chính sách trình duyệt. Dịch vụ PeerJS Cloud công khai và hai mạng Internet khác NAT chưa được kiểm chứng từ cloud này.

`npm run test:static`: phục vụ chỉ file Git theo dõi ở `/auto-bat/legacy/index.html`; module, icon, worker và đủ 40 tướng chạy không 404. Ngắt mạng/reload và tiếp tục trận offline vẫn tải được ảnh dùng chung ngoài thư mục Legacy.

Build kiểm tra tài nguyên cục bộ, manifest SHA-256, tính lặp lại và không ghi đè output bị sửa. Môi trường cloud quản lý Chromium với `WebRtcIPHandling=disable_non_proxied_udp`. Kiểm tra browser đã chạy bằng coturn TCP trên loopback, giữ nguyên chính sách; chưa thử hai mạng Internet khác NAT.

Runtime hiện khoảng 114 MiB vì giữ media của bản HLV; gói offline tự tải trước loại bỏ MP3 nên nhỏ hơn nhiều.

## Giới hạn của bản đầu

- Chưa đo cân bằng bằng người chơi thật, chưa thử tải nhiều phòng trên máy chủ sản xuất hoặc mạng Internet thực. Hai context browser trong workspace không chứng minh độ trễ khi chơi khác khu vực.
- Chưa có tài khoản, xếp hạng, matchmaking công khai hoặc 3v3. Source vẫn trong repo hiện tại; runtime build đã tự chứa.
- Room/token nằm trong RAM của signaling. Trận đang kết nối P2P tiếp tục khi signaling mất kết nối; tạo phòng/renegotiate cần dịch vụ hoạt động lại. Host quyết định kết quả, phù hợp phòng chơi tin cậy; chưa có xác thực chống gian lận độc lập hoặc chuyển live host.
- Offline save gắn phiên bản nội dung. Chưa migrate replay giữa hai bộ luật khác nhau; file cũ không bị xóa nếu không tương thích.
- Cấu hình online dùng cấp/thông số chuẩn, chưa mở các build talent/trang bị của HLV. 14 tướng mới chưa có cây talent riêng cho hành trình HLV.
- Nhạc nền chưa nối vào giao diện điều khiển mới. Bản HLV vẫn dùng audio gốc; chơi offline không cần tải nhạc.

## Chạy và xác minh lại

```sh
cd /workspace/auto-bat/legacy
npm ci --cache /workspace/.cache/npm --no-audit --no-fund
npm test
npm run check:roster
npm run dev
```

Signaling server mặc định cổng 8002. Giữ server chạy rồi dùng terminal khác:

```sh
cd /workspace/auto-bat/legacy
python3 tools/browser-smoke.py
```

Trong cloud có chính sách chặn UDP, dùng `npm run test:browser` với coturn cài sẵn hoặc `TURNSERVER` trỏ binary; `LEGACY_TURN_LIB_DIR` hỗ trợ thư viện của binary được giải nén riêng. Fixture tự sinh credential tạm, bind loopback và tự dọn. Web thật cần HTTPS/WSS cho trang và signaling, cùng ICE phù hợp.
