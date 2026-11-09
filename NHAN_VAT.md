# HỒ SƠ NHÂN VẬT — KẺ ĐẶT CƯỢC

> Tệp này được **sinh tự động** từ mã bằng `node tools/nhanvat.js` (kiểm tra lệch: `--kiemtra`). Đừng sửa tay.
> Mục đích: tài liệu đặc tả đầy đủ để dựng lại toàn bộ nhân vật trên engine khác (Unity). Mọi con số là con số thật đang chạy trong bản web.
> Mô tả chi tiết hơn về các hệ thống chung (bản đồ, quái, boss, bo, Ý Niệm, mảnh hồn, nhà cái…) nằm ở `THIET_KE.md`.

Tổng số nhân vật: **40** (trong đó 1 chưa phát hành: Lyra).

## Mục lục
1. [Quy ước chung & công thức](#1-quy-ước-chung--công-thức)
2. [Bảng tổng hợp nhân vật](#2-bảng-tổng-hợp-nhân-vật)
3. [Hồ sơ từng nhân vật](#3-hồ-sơ-từng-nhân-vật)
4. [Trang bị](#4-trang-bị)
5. [Vật phẩm dùng 1 lần, bình & phép bổ trợ](#5-vật-phẩm-dùng-1-lần-bình--phép-bổ-trợ)
6. [Hiệu ứng trạng thái](#6-hiệu-ứng-trạng-thái)
7. [Gợi ý dựng dữ liệu trong Unity](#7-gợi-ý-dựng-dữ-liệu-trong-unity)

## 1. Quy ước chung & công thức

### 1.1. Đơn vị
- Khoảng cách: **đv** (đơn vị) ≈ 1 mét → nên map 1 đv = 1 Unity unit. Bản đồ 612×612 đv.
- Thời gian: giây. Mô phỏng chạy nhịp cố định 0.05s/bước (tất định theo hạt giống) — trong Unity nên đặt logic vào FixedUpdate với cùng bước.
- Tốc chạy: đv/giây. Tốc đánh: số đòn/giây. Tốc đạn: đv/giây.
- **SMVL** = Sức Mạnh Vật Lý (AD) = SMVL gốc theo cấp tướng + SMVL cộng thêm (trang bị, nhánh, mảnh hồn, hiệu ứng).
- **SMPT** = Sức Mạnh Phép Thuật (AP). SMPT gốc của mọi tướng = 0, toàn bộ đến từ trang bị / nhánh / mảnh hồn / hiệu ứng.
- **KP** = Kháng Phép (MR). **Hộ Giáp** = thanh giáp phụ gánh sát thương trước máu.
- Trong mọi công thức của tài liệu này, **"SMVL" là SMVL tổng** (bản web không tách gốc / cộng thêm). Bản Unity tách hai loại và dùng hệ số đa dạng hơn — xem `GDD.md` mục 6.5–6.7.

### 1.2. Cấp & điểm chiêu
- Cấp tối đa **18**. Kinh nghiệm cần để từ cấp L lên L+1: `200 + 90 * (L - 1)` (cấp 1→2: 200, cấp 17→18: 1640).
- Mỗi lần lên cấp: +1 điểm chiêu.
- S1/S2/S3: tối đa cấp 5; cấp chiêu không vượt quá ⌈cấp tướng / 2⌉.
- S4 (chiêu cuối): tối đa cấp 3; mở được khi cấp tướng ≥ 4 / 8 / 12 (cấp chiêu 1 / 2 / 3).
- Skill phụ (sub): không cần điểm, cấp = clamp(⌈cấp tướng / 4⌉, 1, 5).
- Cây tiến hóa: mở mốc ở cấp 1 / 3 / 6 / 9 / 12, mỗi mốc chọn 1 trong 3 (a/b/c). Ý Niệm Rực Rỡ: cấp 15 lấy thêm 1 lựa chọn chưa chọn ở mốc 3/6/9; cấp 18 lấy thêm 1 lựa chọn mốc 12 hoặc Tối Thượng Nộ (Chiêu cuối hồi nhanh hơn 35%.) / Thần Lực (+20% Công Vật Lý và Công Phép.).

### 1.3. Chỉ số theo cấp
- Chỉ số tại cấp L = `gốc + tăng_mỗi_cấp × (L − 1)` (áp cho Máu, Mana, Hồi mana, SMVL, Giáp, KP).
- **Máu thực tế** của tướng = Máu theo công thức trên × **2.4** (hệ số đánh đơn); tướng phong cách "Lì đòn" thêm ×1.15. Máu phẳng từ mảnh hồn cộng sau hệ số.
- Máu không tự hồi (hồi máu gốc = 0); hồi qua bình, trang bị, chiêu, nghỉ ngoài giao tranh.
- Hồi mana thực tế = (gốc + tăng × (L−1)) × 1.6. Chi phí mana thực tế = chi phí ghi trên chiêu × **0.6**.
- Tốc đánh = tốc đánh gốc × (1 + tăng_mỗi_cấp × (L−1) + % tốc đánh cộng thêm), kẹp trong [0.2, 2.5]. Thời gian vung tay = 30% chu kỳ đánh.
- Hộ Giáp (thanh giáp phụ, gánh sát thương trước máu, không tự hồi): 100 + 15 × (L−1) (+ mảnh hồn).
- Giảm hồi chiêu (cdr) tối đa 40%. Hồi chiêu thực tế = hồi chiêu theo cấp chiêu × (1 − cdr).

### 1.4. Khung chỉ số theo vai trò (giá trị mặc định khi tướng không ghi đè)
| Khung | Máu | Hồi mana | Mana | SMVL | Giáp | KP | Tốc đánh | Tốc chạy | Tầm |
|---|---|---|---|---|---|---|---|---|---|
| Đỡ đòn (Tank) | 640 (+98) | 1.4 (+0.08) | 300 (+40) | 60 (+3.6) | 34 (+4.2) | 32 (+2) | 0.66 (+2%/cấp) | 3.45 | 1.7 |
| Đấu sĩ (Fighter) | 600 (+94) | 0 (+0) | 0 (+0) | 64 (+3.9) | 30 (+3.8) | 32 (+1.8) | 0.68 (+2.5%/cấp) | 3.55 | 1.6 |
| Pháp sư (Mage) | 540 (+84) | 2 (+0.1) | 420 (+50) | 52 (+3) | 22 (+3.6) | 30 (+1.4) | 0.63 (+1.5%/cấp) | 3.35 | 5.5 |
| Xạ thủ (Marksman) | 560 (+88) | 1.6 (+0.08) | 320 (+40) | 60 (+3.6) | 26 (+3.8) | 30 (+1.3) | 0.66 (+3%/cấp) | 3.3 | 6 |
| Hỗ trợ (Support) | 570 (+88) | 2 (+0.1) | 380 (+45) | 50 (+2.6) | 28 (+3.9) | 30 (+1.5) | 0.62 (+1.5%/cấp) | 3.35 | 5 |

### 1.5. Công thức sát thương
- Loại sát thương: **vật lý** (giảm bởi Giáp), **phép** (giảm bởi KP), **chuẩn** (không giảm).
- Kháng sau xuyên: `R = kháng × (1 − min(0.9, %xuyên)) − xuyên_phẳng` (không âm).
- Hệ số nhận: R ≥ 0 → `100 / (100 + R)`; R < 0 → `2 − 100 / (100 − R)`.
- Chí mạng: ×1.75 (một số trang bị đổi hệ số).
- Chiêu cuối: mọi sát thương gắn nhãn S4 ×1.4.
- Tướng đánh tướng (PvP) nhân thêm: `0.95 × 0.6 × pvpPow`, với
  - `pvpPow = 1.6 × 6^p`, `p = 0.45·min(1,(cấp−1)/17) + 0.45·min(1, số_món_hoàn_chỉnh/6) + 0.1·min(1, Ý_Niệm/5)`.
  - Kết quả: đầu trận ×0.91, cuối trận đủ đồ ×5.47 → đầu trận đánh lâu, cuối trận chết nhanh.
- Giai đoạn mạnh của tướng: sát thương ×(1 + hệ số), hệ số nội suy theo cấp 3 → 9 → 15 cộng phần theo vàng trang bị (xem từng tướng).
  - Mạnh đầu trận: 6% → 2% → -4% • giữa trận: -2% → 5% → 0% • cuối trận: -5% → 0% → 6%.
  - Phụ thuộc đồ: "Cần đồ" thêm (k − 0.4) × 10%, "Ít cần đồ" thêm (0.4 − k) × 6%, với k = min(1, vàng_trang_bị / 12000).
- Thứ tự áp: hook nội tại/trang bị (onDeal, onTake) → hệ số chiêu cuối → khuếch đại của người đánh → PvP → giai đoạn mạnh → giảm sát thương / dễ tổn thương của mục tiêu → giảm trừ Giáp/KP → Hộ Giáp → lá chắn → máu.

### 1.6. Cách đọc hồ sơ chiêu
- **Hồi chiêu / Mana**: liệt kê theo cấp chiêu 1 → 5 (S4: 1 → 3). Mana ghi theo số gốc; nhân 0.6 khi dùng thật.
- **Thi triển**: thời gian vận chiêu (đứng yên) trước khi chiêu có hiệu lực. "Vừa đi vừa thi triển" = không bị khóa chân.
- **Nhắm**: kiểu chọn mục tiêu dùng cho cả người chơi và AI (unit / point / self / away), **Tầm AI** là tầm AI dùng để quyết định tung chiêu (gần đúng tầm chiêu thật).
- **Tích lũy**: chiêu có nhiều lượt dùng, mỗi lượt hồi riêng.
- Các con số "x/y/z" trong mô tả là theo cấp chiêu.
- **Công thức trong mã**: lượng sát thương / hồi máu / lá chắn gốc trích thẳng từ mã chiêu (và các hàm phụ chiêu gọi tới), dạng `gốc + hệ số × SMVL + hệ số × SMPT`. "cấp" = cấp tướng; "[a/b/c theo cấp chiêu]" = giá trị theo cấp chiêu; "nhánh 3b" = khi đã chọn nhánh 3b của cây tiến hóa. Đây là số **trước** các hệ số chung ở mục 1.5 (PvP, chiêu cuối ×1.4, Giáp/KP…); mô tả chiêu nói rõ phần trăm áp lên số này (ví dụ "50% sát thương").
- **Mã nguồn**: tệp và dòng chứa định nghĩa trong bản web — mở ra khi cần chi tiết hơn tài liệu (thứ tự hiệu ứng, điều kiện phụ).

## 2. Bảng tổng hợp nhân vật
| Nhân vật | id | Vai trò | Vị trí | Đánh | Sát thương | Tài nguyên | Máu cấp 1 (thực) | Tầm | Tốc chạy | Giai đoạn mạnh |
|---|---|---|---|---|---|---|---|---|---|---|
| [Alice](#alice) | `alice` | Pháp sư (Mage) | Đường giữa, Đi rừng | Tầm xa | Phép | Mana | 1416 | 8 | 3.5 | Mạnh giữa trận · Cần đồ vừa phải |
| [Aria & Oktava](#aria) | `aria` | Hỗ trợ (Support) | Hỗ trợ | Tầm xa | Phép | Mana | 1428 | 5 | 3.35 | Mạnh giữa trận · Ít cần đồ |
| [Ariston](#ariston) | `ariston` | Đỡ đòn (Tank) | Đường trên | Cận chiến | Vật lý | Mana | 1536 | 2.5 | 3.45 | Mạnh giữa trận · Cần đồ vừa phải |
| [Bạch Diệp](#bachdiep) | `bachdiep` | Pháp sư (Mage) | Đường giữa | Tầm xa | Phép | Mana | 1320 | 4.5 | 3.45 | Mạnh giữa trận · Cần đồ vừa phải |
| [Boran](#boran) | `boran` | Đấu sĩ (Fighter) | Đường trên, Đi rừng | Cận chiến | Vật lý | Không mana | 1440 | 1.6 | 3.55 | Mạnh giữa trận · Cần đồ vừa phải |
| [Borg](#borg) | `borg` | Đấu sĩ (Fighter) | Đường trên, Đi rừng | Cận chiến | Vật lý | Không mana | 1536 | 1.45 | 3.5 | Mạnh đầu trận · Ít cần đồ |
| [Chrono & Neo](#chrononeo) | `chrononeo` | Xạ thủ (Marksman) | Xạ thủ (đường dưới), Đường giữa | Tầm xa | Vật lý | Mana | 1344 | 6 | 3.3 | Mạnh cuối trận · Cần đồ |
| [Clint](#clint) | `clint` | Đấu sĩ (Fighter) | Đi rừng, Đường trên | Tầm xa | Vật lý | Mana | 1572 | 3.4 | 3.5 | Mạnh đầu trận · Cần đồ vừa phải |
| [Dahlia](#dahlia) | `dahlia` | Pháp sư (Mage) | Đường giữa, Đi rừng | Tầm xa | Phép | Mana | 1332 | 5 | 3.45 | Mạnh giữa trận · Cần đồ vừa phải |
| [Death](#death) | `death` | Đấu sĩ (Fighter) | Đi rừng, Hỗ trợ | Cận chiến | Phép | Mana | 1620 | 2.2 | 3.5 | Mạnh đầu trận · Ít cần đồ |
| [Diệp Thanh Phong](#thanhphong) | `thanhphong` | Pháp sư (Mage) | Đường giữa, Hỗ trợ | Tầm xa | Phép | Không mana | 1344 | 4.8 | 3.45 | Mạnh giữa trận · Ít cần đồ |
| [Dr. Caelus](#caelus) | `caelus` | Pháp sư (Mage) | Đường giữa | Tầm xa | Phép | Mana | 1308 | 5.8 | 3.35 | Mạnh giữa trận · Cần đồ vừa phải |
| [Dr. Vector](#vector) | `vector` | Xạ thủ (Marksman) | Xạ thủ (đường dưới) | Tầm xa | Vật lý | Mana | 1332 | 8 | 3.3 | Mạnh giữa trận · Cần đồ vừa phải |
| [Elara](#elara) | `elara` | Xạ thủ (Marksman) | Xạ thủ (đường dưới) | Tầm xa | Vật lý | Mana | 1344 | 6.2 | 3.3 | Mạnh cuối trận · Cần đồ |
| [Florian](#florian) | `florian` | Đấu sĩ (Fighter) | Đường trên, Đường giữa | Cận chiến | Vật lý | Mana | 1416 | 1.75 | 3.55 | Mạnh giữa trận · Cần đồ vừa phải |
| [Galo](#galo) | `galo` | Đấu sĩ (Fighter) | Đi rừng, Đường trên | Tầm xa | Phép | Không mana | 1356 | 4.5 | 3.5 | Mạnh giữa trận · Cần đồ vừa phải |
| [Gideon](#gideon) | `gideon` | Đỡ đòn (Tank) | Đường trên, Đi rừng | Cận chiến | Vật lý | Mana | 1380 | 2.7 | 3.4 | Mạnh giữa trận · Ít cần đồ |
| [Ignatius](#ignatius) | `ignatius` | Pháp sư (Mage) | Đường giữa | Tầm xa | Phép | Mana | 1296 | 5.5 | 3.35 | Mạnh giữa trận · Cần đồ vừa phải |
| [Jack "Sáu Lỗ"](#jack) | `jack` | Xạ thủ (Marksman) | Xạ thủ (đường dưới) | Tầm xa | Vật lý | Mana | 1440 | 5.8 | 3.3 | Mạnh giữa trận · Cần đồ |
| [Joker](#joker) | `joker` | Pháp sư (Mage) | Đường giữa, Hỗ trợ | Tầm xa | Phép | Mana | 1296 | 5.2 | 3.35 | Mạnh giữa trận · Ít cần đồ |
| [Justus](#justus) | `justus` | Pháp sư (Mage) | Hỗ trợ, Đường giữa | Tầm xa | Phép | Không mana | 1368 | 5 | 3.35 | Mạnh giữa trận · Cần đồ vừa phải |
| [Kazuki](#kazuki) | `kazuki` | Đấu sĩ (Fighter) | Đường trên, Đi rừng | Cận chiến | Vật lý | Không mana | 1428 | 1.6 | 3.55 | Mạnh cuối trận · Cần đồ |
| [Kip](#kip) | `kip` | Đấu sĩ (Fighter) | Đi rừng | Cận chiến | Vật lý | Không mana | 1440 | 1.4 | 3.7 | Mạnh giữa trận · Cần đồ vừa phải |
| [Koda](#koda) | `koda` | Đấu sĩ (Fighter) | Đi rừng | Cận chiến | Vật lý | Không mana | 1488 | 1.45 | 3.65 | Mạnh đầu trận · Cần đồ vừa phải |
| [Luca](#luca) | `luca` | Đấu sĩ (Fighter) | Đường giữa | Cận chiến | Phép | Mana | 1872 | 1.7 | 3.6 | Mạnh giữa trận · Cần đồ vừa phải |
| [Lyra](#lyra) | `lyra` | Pháp sư (Mage) | Đường giữa, Hỗ trợ | Tầm xa | Phép | Mana | 1320 | 5.5 | 3.35 | Mạnh giữa trận · Ít cần đồ |
| [Mirage](#mirage) | `mirage` | Pháp sư (Mage) | Đường giữa | Tầm xa | Phép | Không mana | 1320 | 5.2 | 3.45 | Mạnh giữa trận · Cần đồ vừa phải |
| [Olivia](#olivia) | `olivia` | Hỗ trợ (Support) | Hỗ trợ | Tầm xa | Phép | Mana | 1380 | 5.5 | 3.35 | Mạnh giữa trận · Cần đồ vừa phải |
| [Percy](#percy) | `percy` | Xạ thủ (Marksman) | Xạ thủ (đường dưới) | Tầm xa | Vật lý | Mana | 1344 | 6 | 3.62 | Mạnh cuối trận · Cần đồ |
| [Ratok](#ratok) | `ratok` | Đỡ đòn (Tank) | Hỗ trợ, Đường trên | Cận chiến | Vật lý | Mana | 1728 | 1.8 | 3.5 | Mạnh giữa trận · Cần đồ vừa phải |
| [Raven](#raven) | `raven` | Xạ thủ (Marksman) | Hỗ trợ, Xạ thủ (đường dưới) | Tầm xa | Vật lý | Mana | 1320 | 7.2 | 3.35 | Mạnh đầu trận · Cần đồ vừa phải |
| [Roxie & T-Zero](#roxie) | `roxie` | Pháp sư (Mage) | Đường giữa, Đường trên | Tầm xa | Phép | Không mana | 1416 | 5 | 3.35 | Mạnh cuối trận · Cần đồ |
| [Ryoma](#ryoma) | `ryoma` | Đấu sĩ (Fighter) | Đường giữa, Đường trên | Cận chiến | Vật lý | Không mana | 1296 | 1.6 | 3.55 | Mạnh giữa trận · Cần đồ |
| [Theron](#theron) | `theron` | Đấu sĩ (Fighter) | Đi rừng, Đường trên | Cận chiến | Vật lý | Mana | 1404 | 2.3 | 3.5 | Mạnh đầu trận · Cần đồ vừa phải |
| [Tsukiyo](#tsukiyo) | `tsukiyo` | Đấu sĩ (Fighter) | Đi rừng, Đường giữa | Tầm xa | Vật lý | Mana | 1356 | 5.5 | 3.55 | Mạnh giữa trận · Cần đồ vừa phải |
| [Valerius](#valerius) | `valerius` | Đỡ đòn (Tank) | Đường trên, Hỗ trợ | Cận chiến | Vật lý | Mana | 1536 | 1.7 | 3.45 | Mạnh giữa trận · Ít cần đồ |
| [Vesper](#vesper) | `vesper` | Đấu sĩ (Fighter) | Đi rừng, Đường giữa | Cận chiến | Vật lý | Mana | 1344 | 1.35 | 3.65 | Mạnh đầu trận · Cần đồ |
| [Victoria](#victoria) | `victoria` | Hỗ trợ (Support) | Hỗ trợ, Đường giữa | Cận chiến | Vật lý | Mana | 1512 | 2.4 | 3.35 | Mạnh đầu trận · Ít cần đồ |
| [Wukong](#wukong) | `wukong` | Đấu sĩ (Fighter) | Đi rừng, Đường trên | Cận chiến | Vật lý | Không mana | 1476 | 2 | 3.55 | Mạnh giữa trận · Cần đồ vừa phải |
| [Zero](#zero) | `zero` | Xạ thủ (Marksman) | Xạ thủ (đường dưới) | Tầm xa | Vật lý | Mana | 1344 | 6.2 | 3.3 | Mạnh cuối trận · Cần đồ |

## 3. Hồ sơ từng nhân vật

<a id="alice"></a>
### Alice

**Định danh**
- id: `alice` • màu chủ đạo: `#d070ff` • vũ khí/hình ảnh: `gloves` • bán kính va chạm: 0.58 đv
- Vai trò: Pháp sư (Mage) • vị trí: Đường giữa, Đi rừng • nhãn: stealth
- Tầm xa • sát thương chính: phép • tài nguyên: mana
- Đạn đánh thường: kiểu `alicecard`, tốc độ 18 đv/s
- Thanh tài nguyên riêng: **Náo Nhiệt** (0–100, màu `#d070ff`).
- Tính cách AI: 🎣 Thợ Săn Mồi Câu — Lấy rương đồ làm mồi, đặt bẫy quanh rồi núp cách 20–30 đv; kẻ nào đứng mở rương là lao vào dồn sát thương. • Phong cách đánh: 🗡 Sát thủ phép — Đọc vị mục tiêu: máu giấy thì lao vào dồn sát thương rồi rút; trâu bò thì cấu rỉa tới ngưỡng kết liễu. Thấy đối thủ hụt chiêu lớn là lao vào ngay.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: bạn: Luca, Mirage • bảo vệ: Luca • liên minh vĩnh cửu: Luca

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1416 | 201.6 | 3028.8 | 4843.2 |
| Máu (gốc trong dữ liệu) | 590 | 84 | 1262 | 2018 |
| Mana | 420 | 50 | 820 | 1270 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 52 | 3 | 76 | 103 |
| Giáp | 26 | 3.6 | 54.8 | 87.2 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.5 | — | 3.5 | 3.5 |
| Tầm đánh | 8 | — | 8 | 8 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Náo Nhiệt**

Đánh thường gây sát thương phép (tầm 8 đv). Náo Nhiệt (0–100) tích khi đánh trúng tướng (+8) và khi ảo ảnh bị phá (+25); Phi Dao tự tiêu 5, Lướt Đâm tự tiêu 10 để cường hóa. Bị Lừa Rồi Nha!: ảo ảnh bị phá thì phát nổ. Thoát Hiểm Ảo Ảnh & Sân Khấu Cuối Cùng (180s): đòn chí tử bị chặn — tàng hình 1.5s, hồi 25% máu, làm mới mọi hồi chiêu, +100 Náo Nhiệt, tăng mạnh Công Phép và tốc chạy 8s, ảo ảnh nổ mạnh hơn 25% và rộng gấp đôi.

- Công thức trong mã: `40 + 8×cấp + 0.35×SMPT` • `50 + 8×cấp + 0.3×SMPT`
- Mã nguồn: `src/data/heroes/alice.js:51`

**S1 — Phi Dao Ảo Thuật**

- Hồi chiêu: 5 / 4.75 / 4.5 / 4.25 / 4s • Mana: 45 / 50 / 55 / 60 / 65 • Thi triển: 0.12s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.8 đv • Tốc đạn/lướt: 20 đv/s • Mục đích AI: cấu rỉa
- Phi dao 7 đv. Tốn 5 Náo Nhiệt: phóng 8/10/12/14/20 dao tỏa 360°, mỗi dao 50/60/70/90/100% sát thương.
- Công thức trong mã: `[70/110/150/190/230 theo cấp chiêu] + 0.65×SMPT`
- Mã nguồn: `src/data/heroes/alice.js:98`

**S2 — Lướt Đâm**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Mana: 50 / 50 / 50 / 50 / 50
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 4 đv • Mục đích AI: thoát thân
- Lướt 4 đv đâm kẻ địch trên đường; đâm từ phía sau ×2 sát thương. Tốn 10 Náo Nhiệt: tàng hình 1.5s, để lại ảo ảnh; đâm từ phía sau ×3 sát thương và choáng 1s.
- Công thức trong mã: `[80/120/160/200/240 theo cấp chiêu] + 0.55×SMPT` • `50 + 8×cấp + 0.3×SMPT`
- Mã nguồn: `src/data/heroes/alice.js:117`

**S3 — Ảo Ảnh Độc Lập**

- Hồi chiêu: 16 / 15 / 14 / 13 / 12s • Mana: 60 / 60 / 60 / 60 / 60
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: dồn sát thương
- Tạo ảo ảnh 10s tự chạy lại gần địch; Alice tàng hình 1.5s và lướt đi. Đủ 50 Náo Nhiệt (tốn 50/40/40/40/20): hoán đổi vị trí với tướng địch gần nhất trong 10 đv, 5/6/7/8/10 ảo ảnh vây quanh nạn nhân 5/6/8/8/10s (sau 2s bắt đầu chạy loạn), Alice tàng hình 2/2.25/2.25/3/5s.
- Công thức trong mã: `50 + 8×cấp + 0.3×SMPT`
- Mã nguồn: `src/data/heroes/alice.js:133`

**S4 — Rực Rỡ, Cùng Vui Nào!**

- Hồi chiêu: 110 / 90 / 70s • Mana: 100 / 100 / 100 • Thi triển: 0.1s • Có nhiều biến thể (chọn theo tình huống hoặc người chơi chọn trước)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 6 đv • Mục đích AI: chiêu cuối
- Tự chọn 1 trong 3 biến thể theo tình huống: Chương Trình Thoát Hiểm (máu thấp: 10 ảo ảnh chạy toán loạn, Alice tàng hình 5s, +50% tốc chạy, tăng mạnh Công Phép) • Mạo Hiểm (bị áp sát hoặc đứng trong vùng cảnh báo: phi dao đánh dấu rồi tự nhốt vào Hộp Ảo Thuật 1.5s — bị đánh thì đổi chỗ với kẻ đánh, trả lại ×2 sát thương, đẩy văng và choáng; không bị đánh thì xuất hiện sau lưng kẻ bị đánh dấu, choáng 3s) • Vạn Biến (chiêu đang hồi: Náo Nhiệt tràn tới 200, làm mới mọi hồi chiêu, tăng mạnh Công Phép; mọi ảo ảnh nổ mạnh hơn, nổ gây choáng và tự sao chép Phi Dao, Lướt Đâm trong 5/7/10s).
- Công thức trong mã: `[150/250/350 theo cấp chiêu] + 0.7×SMPT` • `50 + 8×cấp + 0.3×SMPT`
- Mã nguồn: `src/data/heroes/alice.js:174`

**Skill phụ — Tẩu Thoát, Ohh!**

- Hồi chiêu: 12s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: phòng thủ
- Đổi chỗ với ảo ảnh xa kẻ địch nhất.
- Mã nguồn: `src/data/heroes/alice.js:161`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Khán Giả Cuồng Nhiệt | Ảo ảnh bị phá cho 35 Náo Nhiệt (thay vì 25). |
| 1 | b | Phi Dao Sắc Lẹm | Phi Dao bay xa và nhanh hơn 25%. |
| 1 | c | Ảo Ảnh Bền Bỉ | Ảo ảnh có thêm 50% máu. |
| 3 | a | Bẫy Hoa Lửa | Bị Lừa Rồi Nha! nổ mạnh hơn 40% và choáng 0.5s. |
| 3 | b | Khói Ảo Thuật | Biến thể hoán đổi của S3 thả khói làm chậm 40% trong 2s. |
| 3 | c | Vô Ảnh Thần Bộ | Tàng hình của Lướt Đâm cường hóa kéo dài 2.5s. |
| 6 | a | Phi Dao Hoán Vị | Phi Dao trúng đích: trong 1s dùng lại để dịch chuyển tới chỗ dao. |
| 6 | b | Chim Bồ Câu Quấy Nhiễu | Lướt Đâm thay bằng thả đàn bồ câu hình nón: hất tung nhẹ và câm lặng 1.25s. |
| 6 | c | Ảo Ảnh Phản Kích | Ảo ảnh bị tướng cận chiến phá: đâm trả một nhát trước khi nổ. |
| 9 | a | Đại Ảo Thuật Gia | Thoát Hiểm Ảo Ảnh: tàng hình 3s + miễn sát thương 1s, hồi 120s (thay vì 180s). |
| 9 | b | Náo Nhiệt Vô Tận | Náo Nhiệt tối đa 150 và tích nhanh hơn 30%. |
| 9 | c | Ảo Ảnh Chân Thực | Ảo ảnh gây 40% sát thương thật. |
| 12 | a | Bậc Thầy Phân Thân | S3 giữ tối đa 3 ảo ảnh và hồi nhanh gấp đôi; Tẩu Thoát hồi 3s. |
| 12 | b | Chiếc Hộp Biến Mất | Hộp Ảo Thuật kết thúc (đổi chỗ hoặc xuất hiện sau lưng): choáng 1s mọi tướng địch trong 5 đv quanh nạn nhân. |
| 12 | c | Nụ Cười Gã Hề | Mỗi ảo ảnh nổ trúng tướng: giảm 10s hồi chiêu S4. |

**Lối build gợi ý (AI dùng)**
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Thấu Thị Thảo Mộc, Hồn Phá Sóng Nhiễu Loạn, Hồn Nguyệt Thực Hắc Ám

<a id="aria"></a>
### Aria & Oktava

**Định danh**
- id: `aria` • màu chủ đạo: `#7ae0a0` • vũ khí/hình ảnh: `voice` • bán kính va chạm: 0.58 đv
- Vai trò: Hỗ trợ (Support) • vị trí: Hỗ trợ • nhãn: heal, cc
- Tầm xa • sát thương chính: phép • tài nguyên: mana
- Đạn đánh thường: kiểu `note`, tốc độ 16 đv/s
- Tính cách AI: 🕊 Hòa Bình — Không bao giờ ra tay trước; nhặt đồ hồi máu, tránh xa tiếng giao tranh; chỉ đánh trả khi máu bị đe dọa hoặc hộ vệ đã lao vào. • Phong cách đánh: 🎯 Đứng bắn — Đánh tầm xa nhưng ít di chuyển, không cố thả diều.
- Giai đoạn mạnh: Mạnh giữa trận · Ít cần đồ
- Quan hệ cốt truyện: bạn: Kip

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1428 | 211.2 | 3117.6 | 5018.4 |
| Máu (gốc trong dữ liệu) | 595 | 88 | 1299 | 2091 |
| Mana | 380 | 45 | 740 | 1145 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 50 | 2.6 | 70.8 | 94.2 |
| Giáp | 28 | 3.9 | 59.2 | 94.3 |
| Kháng phép | 32 | 1.5 | 44 | 57.5 |
| Tốc đánh | 0.62 | +1.5% | 0.69 | 0.78 |
| Tốc chạy | 3.35 | — | 3.35 | 3.35 |
| Tầm đánh | 5 | — | 5 | 5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Bóng Hình Âm Vang & Hòa Âm**

Oktava (Người Bảo Hộ) đi theo Aria, có máu riêng (45% máu Aria), chết thì hồi lại sau 45s. Ai đánh Aria thì Oktava nhắm kẻ đó và đuổi tới khi cách Aria quá xa (14 đv) hoặc bị Aria thu hồi (Aria rút lui, hoặc Oktava sắp chết). 3 nốt (S1/S2/S3, dùng CHUNG hồi chiêu 3.5s) liên tiếp thành 1 Bản Nhạc — nốt tan biến nếu 5s không gõ thêm, cường hóa theo nốt được bấm nhiều nhất: Đỏ — Oktava dậm to, Aria nổ 3 lần, lần cuối CHOÁNG • Xanh — 3 đợt sóng âm: trúng 1 làm chậm, 2 trói chân, 3 MÊ HOẶC (tự đi về phía Oktava) • Vàng — Oktava dậm thẳng xuống chỗ Aria đẩy lùi cực mạnh, cả đội gần đó nhận khiên kèm Hồi Phục • đều nhau — Hòa Âm Hỗn Hợp (cả ba, yếu hơn). Đánh xong 3 Bản Nhạc thì mở Bản Giao Hưởng Tử Thần.
- Mã nguồn: `src/data/heroes/aria.js:116`

**S1 — Nốt Đỏ — Tấn Công**

- Hồi chiêu: 4 / 3.75 / 3.5 / 3.25 / 3s • Mana: 35 / 38 / 41 / 44 / 47 • Thi triển: 0.15s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.5 đv • Mục đích AI: cấu rỉa
- Oktava NHẢY DẬM vào kẻ địch gần nhất (trong 9 đv; không có thì vào điểm chỉ định) — sát thương bán kính 2.2 và hất lùi; Aria phát sóng âm quanh mình (bán kính 2.5). 3 nốt hồi chiêu độc lập.
- Công thức trong mã: `[50/70/90/110/130 theo cấp chiêu] + 0.45×SMPT`
- Mã nguồn: `src/data/heroes/aria.js:140`

**S2 — Nốt Xanh — Linh Hoạt**

- Hồi chiêu: 4 / 3.75 / 3.5 / 3.25 / 3s • Mana: 35 / 35 / 35 / 35 / 35 • Dùng được khi đang bị khống chế
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 7 đv • Mục đích AI: support
- Aria, Oktava và đồng minh trong 6 đv tăng 25% tốc chạy 2s. Aria không thể bị chọn làm mục tiêu 0.5s, xóa mọi hiệu ứng xấu và miễn đẩy lùi chớp nhoáng. 3 nốt hồi chiêu độc lập.
- Mã nguồn: `src/data/heroes/aria.js:155`

**S3 — Nốt Vàng — Phòng Thủ**

- Hồi chiêu: 4 / 3.75 / 3.5 / 3.25 / 3s • Mana: 40 / 40 / 40 / 40 / 40
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: support
- Oktava lao ngược về phía Aria, choáng 0.75s kẻ trên đường; khiên 60/90/120/150/180 (+40% SMPT) cho Aria hoặc đồng minh thấp máu nhất trong 6 đv (4s). 3 nốt hồi chiêu độc lập.
- Công thức trong mã: `[30/45/60/75/90 theo cấp chiêu] + 0.3×SMPT`
- Mã nguồn: `src/data/heroes/aria.js:166`

**S4 — Bản Giao Hưởng Tử Thần**

- Hồi chiêu: 40 / 35 / 30s • Mana: 100 / 100 / 100 • Thi triển: 0.3s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 9 đv • Bán kính vùng: 2.4 đv • Đường thẳng • Mục đích AI: chiêu cuối
- Chỉ dùng được khi đã đánh xong 3 Bản Nhạc. Sóng âm 11 đv xuyên qua mọi kẻ địch: MÊ HOẶC 1.75s (tự đi nộp mạng cho Oktava). Sóng chạm Oktava: Oktava BẤT TỬ 6s và đòn đánh cường hóa (+100% sát thương, +50% tốc đánh).
- Công thức trong mã: `[100/160/220 theo cấp chiêu] + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/aria.js:204`

**Skill phụ — Gắn Kết**

- Hồi chiêu: 16s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: phòng thủ
- Nhảy lên cưỡi Oktava 5s: di chuyển bằng gã khổng lồ, mọi sát thương nhắm vào Aria do Oktava gánh. Cần Oktava còn sống.
- Mã nguồn: `src/data/heroes/aria.js:187`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Âm Vang Tái Sinh | Oktava hồi sinh sau 25s (thay vì 45s). |
| 1 | b | Nhịp Điệu Đồng Vọng | Aria và Oktava chạy nhanh hơn 10%. (+10% Tốc chạy) |
| 1 | c | Thanh Âm Lan Tỏa | Sóng âm quanh Aria của Nốt Đỏ rộng hơn 30%. |
| 3 | a | Mê Muội Vực Sâu | Hòa Âm Xanh mê hoặc lâu hơn 50%. |
| 3 | b | Trùng Kích Đoạt Hồn | Hòa Âm Đỏ choáng 1.4s (thay vì 1s) và phá lá chắn. |
| 3 | c | Hộ Mệnh Chữa Lành | Khiên của Nốt Vàng còn thừa khi hết hạn chuyển thành hồi máu. |
| 6 | a | Nhập Thể Âm Vang | Gắn Kết: Oktava hóa khổng lồ 4s — nhận lá chắn bằng 50% máu tối đa, đòn đánh lan quanh mục tiêu và làm chậm 30%. |
| 6 | b | Sóng Phản Xạ | Nốt Vàng: tiếng gầm phá hủy mọi đạn đạo của đối phương trong 4 đv quanh Aria và Oktava. |
| 6 | c | Vọng Âm Cộng Hưởng | Nốt nhạc không bao giờ tan biến (thay vì tan sau 5s không gõ). |
| 9 | a | Khúc Khải Hoàn | Chỉ cần 2 Bản Nhạc (thay vì 3) để mở Bản Giao Hưởng Tử Thần. |
| 9 | b | Cộng Hưởng Tuyệt Đối | Khi cưỡi Oktava: Aria không thể cản phá, Oktava gây gấp đôi sát thương. |
| 9 | c | Bản Hòa Âm Tối Thượng | Hòa Âm Hỗn Hợp nhận trọn uy lực cả 3 Hòa Âm đơn. |
| 12 | a | Khúc Ca Ru Ngủ | Gõ đúng thứ tự S1 → S2 → S3: mọi tướng địch trong 8 đv ngủ 1.25s (thay cho Hòa Âm). |
| 12 | b | Đổi Chỗ Tức Thời | Gắn Kết khi đứng xa Oktava (trên 4 đv): hoán đổi vị trí Aria và Oktava. |
| 12 | c | Song Tấu Độc Lập | Oktava +50% chỉ số; mỗi 6s Aria hồi 3% máu tối đa cho mình và Oktava, cả hai +15% tốc chạy 2s. |

**Lối build gợi ý (AI dùng)**
- Bảo Hộ: giày Giày Khai Sáng → Đèn Lồng Tinh Linh → Lư Hương Cổ → Kính Cú Đêm → Ngọc Bội Hộ Mệnh → Khiên Lâm Thần
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Hộ Vệ: giày Giày Thép → Khiên Lâm Thần → Chuông Thức Tỉnh → Vương Miện Bất Khả Xâm Phạm → Giáp Ma Quái → Áo Choàng Thánh Linh
- Mảnh hồn yêu thích: Hồn Trợ Năng, Hồn Phá Ảo Chân Thị, Hồn Thiên Nhãn Xuyên Giới

<a id="ariston"></a>
### Ariston

**Định danh**
- id: `ariston` • màu chủ đạo: `#e8c060` • vũ khí/hình ảnh: `cleaver` • bán kính va chạm: 0.7 đv
- Vai trò: Đỡ đòn (Tank) • vị trí: Đường trên • nhãn: engage, tank
- Cận chiến • sát thương chính: vật lý • tài nguyên: mana
- Tốc đánh cố định: % tốc đánh cộng thêm được quy đổi thành % sát thương đòn đánh.
- Thanh tài nguyên riêng: **Đức Tin** (0–100, màu `#ffd27a`).
- Tính cách AI: 📿 Cuồng Tín — Truy sát "dị giáo" (Death) tới cùng trời cuối đất, kể cả ngoài bo. • Phong cách đánh: 🛡 Lì đòn — Đã vào trận là đánh tới cùng, không bỏ chạy.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: bạn: Justus, Olivia, Valerius • bảo vệ: Justus, Olivia • thù: Vesper, Diệp Thanh Phong, Dahlia

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1536 | 235.2 | 3417.6 | 5534.4 |
| Máu (gốc trong dữ liệu) | 640 | 98 | 1424 | 2306 |
| Mana | 300 | 40 | 620 | 980 |
| Hồi mana/s (thực tế, ×1.6) | 2.24 | 0.13 | 3.26 | 4.42 |
| SMVL | 60 | 3.6 | 88.8 | 121.2 |
| Giáp | 34 | 4.2 | 67.6 | 105.4 |
| Kháng phép | 32 | 2 | 48 | 66 |
| Tốc đánh | 0.62 | +2% | 0.72 | 0.83 |
| Tốc chạy | 3.45 | — | 3.45 | 3.45 |
| Tầm đánh | 2.5 | — | 2.5 | 2.5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Đức Tin & Phán Quyết • Hộ Vệ Thánh Đình • Đại Kiếm Trọng Lực**

Nhận sát thương từ tướng / quái: +4 Đức Tin (+10 nếu đòn mất >10% máu); đồng minh trong 10 đv bị đánh: +3. Mỗi 20 Đức Tin: +6% sát thương, +8 Giáp / Kháng Phép. 100 Đức Tin: giảm 15% sát thương nhận và mở khóa Đại Phán Quyết; tụt 5/giây sau 6s ngoài giao tranh. Dưới 50% máu: giáp ảo 25% máu tối đa 4s (90s). Tốc đánh cố định, % tốc đánh cộng thêm quy đổi thành sát thương; đòn đánh quét vòng cung lan 50% sang kẻ đứng cạnh.
- Mã nguồn: `src/data/heroes/ariston.js:15`

**S1 — Thiết Trảm: Liệt Đao**

- Hồi chiêu: 8 / 7.5 / 7 / 6.5 / 6s • Mana: 45 / 45 / 45 / 45 / 45 • Thi triển: 0.15s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 3.6 đv • Mục đích AI: mở giao tranh
- Quét vòng cung 160° tầm 3.5 đv: sát thương vật lý nặng, làm chậm 35% 1.5s. Trong 2s dùng lại (Liệt Đao): nhảy vọt tới điểm cách 4.5 đv (cảnh báo đỏ bán kính 2.2 đv 0.45s), bổ đao nứt sàn: sát thương lớn và choáng 1s.
- Công thức trong mã: `[70/105/140/175/210 theo cấp chiêu] + 0.9×SMVL`
- Mã nguồn: `src/data/heroes/ariston.js:59`

**S2 — Thế Thủ Thánh Quan**

- Hồi chiêu: 12 / 11.5 / 11 / 10.5 / 10s • Mana: 50 / 50 / 50 / 50 / 50
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 5 đv • Mục đích AI: phòng thủ
- Cắm đao thế thủ tối đa 1.75s: giảm 60% mọi sát thương, miễn đẩy lùi / hất tung; mỗi đòn trúng thế thủ +8 Đức Tin; kẻ cận chiến đánh vào bị dội lại: chậm 30% và nhận 15% sát thương vừa gây.
- Mã nguồn: `src/data/heroes/ariston.js:73`

**S3 — Lời Nguyện Bất Diệt**

- Hồi chiêu: 2s • Mana: 30 / 30 / 30 / 30 / 30
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Bật / tắt: tốn 30 mana, sau đó 15 mana mỗi giây (mỗi giây duy trì +8). Hồi 4% máu tối đa mỗi giây — không bị ngắt khi trúng đòn; mỗi 1.5s giải một hiệu ứng xấu nhẹ (làm chậm, câm lặng).
- Mã nguồn: `src/data/heroes/ariston.js:84`

**S4 — Đại Phán Quyết**

- Hồi chiêu: 90 / 75 / 60s • Mana: 100 / 100 / 100 • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 6 đv • Chỉ nhắm tướng • Mục đích AI: chiêu cuối
- Cần 100 Đức Tin (tiêu hết): khóa một tướng địch trong 6 đv, cảnh báo đỏ 0.5s rồi chém trảm quyết — sát thương vật lý lớn CỘNG sát thương chuẩn bằng 45% tổng sát thương mục tiêu đó đã gây cho Ariston trong 5s trước; phá 100% Hộ Giáp của nạn nhân.
- Công thức trong mã: `[200/320/440 theo cấp chiêu] + 1.1×SMVL`
- Mã nguồn: `src/data/heroes/ariston.js:93`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Đức Tin Kiên Cố | Mỗi tầng Đức Tin +10 Giáp / Kháng Phép (thay vì 8). |
| 1 | b | Bản Đao Nặng Trịch | Quy đổi tốc đánh → sát thương 1:1. |
| 1 | c | Kỷ Luật Tu Sĩ | Lời Nguyện tốn ít hơn 20% mana. |
| 3 | a | Thiết Trảm Chấn Động | Nhát quét đầu phá 200 Hộ Giáp mọi mục tiêu trúng. |
| 3 | b | Thế Thủ Phản Kích | Kết thúc Thế Thủ: quét ngược gây 30% sát thương đã chặn. |
| 3 | c | Lời Nguyện Lan Tỏa | Lời Nguyện hồi cả đồng minh trong 6 đv (50%). |
| 6 | a | Hộ Vệ Thánh Khôi | Giáp ảo Hộ Vệ = 40% máu tối đa, hồi 60s. |
| 6 | b | Đao Khí Xuyên Tường | Liệt Đao nhảy được qua vách đá. |
| 6 | c | Tẩy Trần Triệt Để | Lời Nguyện giải cả khống chế cứng. |
| 9 | a | Phán Quyết Nhân Từ | Hạ gục bằng Đại Phán Quyết: hồi 50% mana và 30% máu. |
| 9 | b | Đức Tin Bất Tận | Đức Tin không tụt khi ngoài giao tranh. |
| 9 | c | Thánh Quang Xuyên Giáp | 100 Đức Tin: đòn đánh xuyên 40% Hộ Giáp. |
| 12 | a | Phán Quan Cuồng Tín | Phong cách: Đại Phán Quyết hoàn 70% sát thương đối thủ gây ra; dưới 20% máu là hành quyết. |
| 12 | b | Pháo Đài Bất Hoại | Phong cách: đang Lời Nguyện +30% kháng hiệu ứng, nhận ít hơn 25% sát thương bo. (+0.25 zoneRed) |
| 12 | c | Thánh Khí Ngàn Cân | +30 Giáp, +30 Kháng Phép. (+30 Giáp, +30 Kháng phép) |

**Lối build gợi ý (AI dùng)**
- Đỡ Đòn: giày Giày Thép → Vương Miện Bất Khả Xâm Phạm → Giáp Gai → Áo Giáp Dung Nham → Trái Tim Cự Thạch → Áo Choàng Thánh Linh
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Trường Nhận Phong Khí, Hồn Titan Phá Giới, Hồn Thính Giác Địa Chấn

<a id="bachdiep"></a>
### Bạch Diệp

**Định danh**
- id: `bachdiep` • màu chủ đạo: `#bfe8ff` • vũ khí/hình ảnh: `flysword` • bán kính va chạm: 0.56 đv
- Vai trò: Pháp sư (Mage) • vị trí: Đường giữa • nhãn: stack
- Tầm xa • sát thương chính: phép • tài nguyên: mana
- Đạn đánh thường: kiểu `sword`, tốc độ 22 đv/s
- Thanh tài nguyên riêng: **Kiếm Khí** (0–10, màu `#bfe8ff`).
- Tính cách AI: 🎯 Kẻ Trảm Tướng — Săn kẻ dẫn đầu số mạng, kẻ cầm vũ khí Đỏ hay kẻ đang có bùa boss; bỏ qua kẻ yếu. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1320 | 201.6 | 2932.8 | 4747.2 |
| Máu (gốc trong dữ liệu) | 550 | 84 | 1222 | 1978 |
| Mana | 460 | 58 | 924 | 1446 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 52 | 3 | 76 | 103 |
| Giáp | 28 | 3.8 | 58.4 | 92.6 |
| Kháng phép | 32 | 1.8 | 46.4 | 62.6 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.45 | — | 3.45 | 3.45 |
| Tầm đánh | 4.5 | — | 4.5 | 4.5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Vạn Kiếm Triệu • Mưa Kiếm Thức Thời**

Đánh thường gây sát thương phép. Mỗi phi kiếm Loạn Trảm trúng: +1 Kiếm; mỗi 5 đòn đánh trúng: +1 Kiếm. KHÔNG GIỚI HẠN số kiếm; mỗi kiếm +1% sát thương phép mọi đòn (tối đa +60%). Rời giao tranh 4s: mất 2 kiếm mỗi giây. Mỗi 10s, đòn đánh kế tiếp thành Mưa Kiếm: 6 phi kiếm rơi xuống bán kính 2 đv, làm chậm 30% 1.5s.

- Công thức trong mã: `18 + 5×cấp + 0.15×SMPT` • `14 + 3×cấp + 0.12×SMPT`
- Mã nguồn: `src/data/heroes/bachdiep.js:27`

**S1 — Kiếm Vũ: Loạn Trảm**

- Hồi chiêu: 0.25s • Mana: 25 • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 7.5 đv • Tốc đạn/lướt: 26 đv/s • Đạn định hướng (né được) • Mục đích AI: cấu rỉa
- Hồi 0.25s. Phóng chuỗi phi kiếm bay thẳng 7.5 đv: số kiếm = 1 + 2 × số lần kích hoạt liên tiếp (trong 2s). Tốn 25 mana, mỗi lần liên tiếp +15 mana. Mỗi kiếm trúng: +1 Kiếm Khí; kiếm sau trúng cùng mục tiêu gây 50% và phá 20 Hộ Giáp.
- Công thức trong mã: `10 + 2×cấp + 0.1×SMPT`
- Mã nguồn: `src/data/heroes/bachdiep.js:56`

**S2 — Kiếm Trận Vạn Cổ**

- Hồi chiêu: 2s • Mana: 30
- Nhắm: Chọn điểm / hướng (point) • Mục đích AI: logic riêng của tướng
- Bật / tắt: chọn vùng trong 8 đv (bán kính 3.5); sau 0.3s kiếm cổ rơi mỗi 0.35s: sát thương phép, chậm 25%, đốt Hộ Giáp. Tốn 30 mana, sau đó 20 mana mỗi giây.
- Mã nguồn: `src/data/heroes/bachdiep.js:80`

**S3 — Kiếm Hộ Pháp**

- Hồi chiêu: 11 / 10 / 9.5 / 9 / 8.5s • Mana: 50
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 4 đv • Mục đích AI: thoát thân
- Lướt lùi 4 đv, né mọi đòn bay tới. Giáp ảo = 100 (+15/cấp) + 30 × số Kiếm. Từ 15 Kiếm: miễn làm chậm, +25% tốc chạy 2.5s. Từ 30 Kiếm: Không Thể Cản Phá khi còn khiên.
- Công thức trong mã: `60 + 10×cấp + 0.4×SMPT`
- Mã nguồn: `src/data/heroes/bachdiep.js:95`

**S4 — Thiên Kiếm Trận**

- Hồi chiêu: 90 / 75 / 60s • Mana: 100
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 6 đv • Chỉ nhắm tướng • Mục đích AI: chiêu cuối
- Chọn 1 trong 3 thế: • Lục Tinh Kiếm Trận (nhiều địch): bán kính 7.5, sát thương phép lớn + choáng 1s; Bạch Diệp đứng trong trận: −30% tiêu hao mana, +30% kháng mọi sát thương, +20% Công Phép 6s. • Phong Ấn Kiếm Vực (một đối thủ trong 6 đv): giam cả hai trong kiếm giới 4s, Bạch Diệp hồi 35 mana/giây, mỗi 0.5s 2 phi kiếm đâm xuống (+1 Kiếm mỗi nhịp). • Thiên Vũ Thăng Hoa (ít mana): +10 Kiếm, +70% tốc đánh 8s, hồi 40% mana, đòn đánh bắn 2 tia xé 30% Hộ Giáp.
- Công thức trong mã: `[250, 380, 520][ctx.rank - 1] + 0.9×SMPT` • `20 + 4×cấp + 0.2×SMPT`
- Mã nguồn: `src/data/heroes/bachdiep.js:108`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Tụ Kiếm Thần Tốc | Chỉ cần 3 đòn đánh để tích 1 Kiếm. |
| 1 | b | Loạn Trảm Tiết Kiệm | Loạn Trảm tăng tiêu hao +8 mỗi lần (thay vì +15). |
| 1 | c | Kiếm Khí Tầm Xa | Tầm đánh 5.5 đv. (+1 Tầm đánh) |
| 3 | a | Mưa Kiếm Liên Hoàn | Mưa Kiếm hồi 6s. |
| 3 | b | Kiếm Trận Trọng Lực | Kiếm Trận cấm lướt và dây móc 2s đầu. |
| 3 | c | Hộ Pháp Bộc Phá | Kiếm Hộ Pháp khi có ≥10 Kiếm: tiêu 5 Kiếm nổ kiếm khí đẩy lùi kẻ địch 3 đv. |
| 6 | a | Kiếm Khí Bất Tận | Mỗi Kiếm +1.3% sát thương (tối đa +78%). |
| 6 | b | Loạn Trảm Xuyên Giáp | Loạn Trảm xuyên 35% Hộ Giáp. |
| 6 | c | Hấp Năng Kiếm Trận | Mỗi nhịp Kiếm Trận trúng tướng: hồi 8 mana. |
| 9 | a | Kiếm Ý Bất Diệt | Kiếm giữ 8s ngoài giao tranh, mất 1 kiếm mỗi giây. |
| 9 | b | Lục Tinh Cực Hạn | Lục Tinh bán kính 10 đv, kéo dài 8s. |
| 9 | c | Phong Ấn Đoạt Hồn | Hạ địch trong Phong Ấn: hồi đầy mana và 30% máu. |
| 12 | a | Vô Tận Kiếm Hải | Phong cách: sau chiêu cuối, Loạn Trảm miễn phí mana 4s. |
| 12 | b | Vạn Kiếm Quy Tông | Phong cách: trên 25 Kiếm, mỗi kiếm thêm +2 Giáp và +2 Kháng Phép. |
| 12 | c | Đại Sư Huynh Rotava | +12% Công Phép, +8% tốc chạy. (+12% Công Phép %, +8% Tốc chạy) |

**Lối build gợi ý (AI dùng)**
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Thiên Nhãn Xuyên Giới, Hồn Tuyệt Đích Bất Suy, Hồn Minh Hỏa Bí Thuật

<a id="boran"></a>
### Boran

**Định danh**
- id: `boran` • màu chủ đạo: `#8ad8ff` • vũ khí/hình ảnh: `axes` • bán kính va chạm: 0.64 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đường trên, Đi rừng • nhãn: dive, engage
- Cận chiến • sát thương chính: vật lý • tài nguyên: không dùng mana
- Thanh tài nguyên riêng: **Nộ Khí** (0–100, màu `#8ad8ff`).
- Tính cách AI: 🌋 Cuồng Loạn — Gặp ai đánh nấy, gặp cái gì phá cái đó (tướng, quái, boss); không bao giờ lùi, đánh tới chết. • Phong cách đánh: 🛡 Lì đòn — Đã vào trận là đánh tới cùng, không bỏ chạy.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: thù: Dr. Caelus, Roxie & T-Zero, Raven, Kip

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1440 | 225.6 | 3244.8 | 5275.2 |
| Máu (gốc trong dữ liệu) | 600 | 94 | 1352 | 2198 |
| SMVL | 62 | 3.8 | 92.4 | 126.6 |
| Giáp | 31 | 3.8 | 61.4 | 95.6 |
| Kháng phép | 32 | 1.8 | 46.4 | 62.6 |
| Tốc đánh | 0.7 | +2.5% | 0.84 | 1 |
| Tốc chạy | 3.55 | — | 3.55 | 3.55 |
| Tầm đánh | 1.6 | — | 1.6 | 1.6 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Huyết Mạch Băng Cổ • Thể Trọng Băng Hóa**

Chém trúng +8 Nộ Khí, nhận sát thương +4; tụt dần sau 5s ngoài giao tranh. Mỗi 10 Nộ: +2.5% tốc đánh, +1.5% tốc chạy. 100 Nộ (Thấu Cốt): đòn đánh thêm 15% sát thương chuẩn, hút máu 15%. Giảm 30% sát thương bo. Hộ Giáp vỡ: Kiên Cường (không thể bị hất tung / cản phá) 2.5s (40s).
- Mã nguồn: `src/data/heroes/boran.js:12`

**S1 — Song Rìu Phi Phao**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7.5s • Thi triển: 0.1s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 11 đv • Tốc đạn/lướt: 24 đv/s • Đạn định hướng (né được) • Mục đích AI: mở giao tranh
- Ném liên tiếp 2 rìu bay thẳng 12 đv: rìu 1 gây sát thương vật lý và làm chậm 40% 2s; rìu 2 trúng cùng mục tiêu thì choáng 1s. Trong 2.5s dùng lại: giật xích kéo thân mình bay tới nạn nhân, tung cú đạp gây sát thương và nhặt rìu (hồi 3s hồi chiêu).
- Công thức trong mã: `[55/85/115/145/175 theo cấp chiêu] + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/boran.js:46`

**S2 — Cuồng Phong Băng Trảm**

- Hồi chiêu: 11 / 10 / 9 / 8 / 8s
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 3.2 đv • Mục đích AI: dồn sát thương
- Xoay song rìu 360° liên tục 2s (vừa xoay vừa chạy, +15% tốc chạy): 6 nhịp chém vật lý mọi kẻ địch trong 3.5 đv, mỗi nhịp gọt 8% Hộ Giáp (tối đa 48%). Đang xoay miễn làm chậm.
- Công thức trong mã: `[22/32/42/52/62 theo cấp chiêu] + 0.28×SMVL`
- Mã nguồn: `src/data/heroes/boran.js:70`

**S3 — Tuyết Lở Áp Sát**

- Hồi chiêu: 12 / 11 / 10 / 9.5 / 9.5s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 9 đv • Trễ nổ: 0.55s • Mục đích AI: mở giao tranh
- Gầm lên nhảy vọt tới điểm cách tối đa 9 đv (vòng cảnh báo đỏ 0.55s): dậm nổ gây sát thương vật lý nặng, hất tung 0.75s mọi mục tiêu trong 3 đv và để lại băng trơn 3s (kẻ địch −35% tốc chạy).
- Công thức trong mã: `[80/120/160/200/240 theo cấp chiêu] + 0.8×SMVL`
- Mã nguồn: `src/data/heroes/boran.js:87`

**S4 — Thức Tỉnh Cổ Thần: Băng Ma Thao Túng**

- Hồi chiêu: 85 / 70 / 55s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Cần ít nhất 50 Nộ Khí (tiêu sạch): hóa dã thú cổ đại 10s — miễn khống chế cứng, mọi đòn đánh và chiêu thêm 40% xuyên Hộ Giáp; hạ gục / hỗ trợ hạ gục tướng: +4s và hồi đầy máu.
- Công thức trong mã: `120 + 20×cấp + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/boran.js:100`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Săn Mồi Đói Khát | +15% tốc chạy khi thấy kẻ địch dưới 50% máu trong 30 đv. |
| 1 | b | Rìu Cắt Gió | Rìu bay nhanh hơn 35%. |
| 1 | c | Băng Thể Tráng Kiện | +250 máu tối đa. (+250 Máu) |
| 3 | a | Lưỡi Rìu Mở Rộng | Cuồng Phong Băng Trảm rộng 4.8 đv. |
| 3 | b | Băng Gai Ghìm Chân | Kẻ dính cú dậm bị cấm dây móc / lướt 2s. |
| 3 | c | Nộ Khí Dâng Trào | Chém trúng +16 Nộ Khí. |
| 6 | a | Xuyên Thủng Tàn Bạo | 100 Nộ Khí: +30% xuyên Hộ Giáp. |
| 6 | b | Băng Khôi Tái Tạo | Đu tới bằng Song Rìu: giáp ảo 15% máu tối đa 4s. |
| 6 | c | Đồ Tể Nhịp Nhanh | Mỗi nhịp chém của Cuồng Phong giảm 0.5s hồi chiêu Tuyết Lở. |
| 9 | a | Cắt Đứt Tẩu Thoát | Kẻ dính Song Rìu mà lướt / dây móc thì bị kéo ngược và nhận 300 sát thương chuẩn. |
| 9 | b | Trái Tim Băng Hà | Kháng thêm 40% sát thương bo; ngoài bo luôn đầy Nộ Khí. (+0.4 zoneRed) |
| 9 | c | Khát Máu Vô Tận | Thấu Cốt hút máu 30%. |
| 12 | a | Cỗ Máy Xay Thịt | Phong cách: Cuồng Phong hồi nhanh hơn 50%. |
| 12 | b | Cổ Ma Bất Tử | Phong cách: đang Băng Ma mà nhận đòn kết liễu → bất tử 4s. |
| 12 | c | Thân Băng Ngàn Năm | +25 Giáp, +25 Kháng Phép. (+25 Giáp, +25 Kháng phép) |

**Lối build gợi ý (AI dùng)**
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Đơn Đấu: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Vô Ảnh Cực Tốc, Hồn Liên Hoàn Trảm, Hồn Thần Tốc Thiên Mệnh

<a id="borg"></a>
### Borg

**Định danh**
- id: `borg` • màu chủ đạo: `#ff7a4a` • vũ khí/hình ảnh: `fist` • bán kính va chạm: 0.72 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đường trên, Đi rừng • nhãn: cc, tank
- Cận chiến • sát thương chính: vật lý • tài nguyên: không dùng mana
- Tính cách AI: 🔥 Hổ Báo — Thích lao vào đánh, ít chịu rút, hay đi săn. • Phong cách đánh: 🛡 Lì đòn — Đã vào trận là đánh tới cùng, không bỏ chạy.
- Giai đoạn mạnh: Mạnh đầu trận · Ít cần đồ
- Quan hệ cốt truyện: bạn: Ratok

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1536 | 240 | 3456 | 5616 |
| Máu (gốc trong dữ liệu) | 640 | 100 | 1440 | 2340 |
| SMVL | 63 | 3.8 | 93.4 | 127.6 |
| Giáp | 33 | 4.2 | 66.6 | 104.4 |
| Kháng phép | 32 | 1.9 | 47.2 | 64.3 |
| Tốc đánh | 0.68 | +2.2% | 0.8 | 0.93 |
| Tốc chạy | 3.5 | — | 3.5 | 3.5 |
| Tầm đánh | 1.45 | — | 1.45 | 1.45 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Huyết Chiến**

Càng ít máu càng đánh đau (tối đa +35% khi dưới 30% máu); dưới 30% máu đòn đánh gây thiêu đốt. Đấm Móc: cứ đòn đánh thường thứ 3 hất tung 0.3s.
- Mã nguồn: `src/data/heroes/borg.js:11`

**S1 — Chộp & Quật**

- Hồi chiêu: 12 / 11.5 / 11 / 10.5 / 10s • Thi triển: 0.05s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 4.2 đv • Chỉ nhắm tướng • Mục đích AI: mở giao tranh
- Lao tới 4 đv chộp tướng đầu tiên chạm phải, quật ra sau lưng: sát thương và choáng 1s.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/borg.js:33`

**S2 — Trả Đòn**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Thi triển: 0.15s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 2.5 đv • Mục đích AI: dồn sát thương
- Cú đấm toàn lực hình nón 2.6 đv. Vừa Gồng Mình (trong 3s): cộng 40% sát thương đã hấp thụ và đẩy lùi 2 đv.
- Công thức trong mã: `[70/110/150/190/230 theo cấp chiêu] + 0.9×SMVL`
- Mã nguồn: `src/data/heroes/borg.js:56`

**S3 — Gồng Mình**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 5 đv • Mục đích AI: phòng thủ
- Gồng 1.5s: giảm 50% sát thương nhận, không bị đẩy lùi (vẫn dính choáng/trói). Lượng sát thương hấp thụ nạp cho Trả Đòn.
- Mã nguồn: `src/data/heroes/borg.js:80`

**S4 — Đấu Trường La Mã**

- Hồi chiêu: 120 / 100 / 80s
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 3.5 đv • Bán kính vùng: 4.5 đv • Mục đích AI: chiêu cuối
- Dựng võ đài bán kính 4.5 đv quanh mình trong 4s: kẻ địch bên trong không ra được; Borg giảm 25% sát thương nhận.
- Mã nguồn: `src/data/heroes/borg.js:95`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Kích Động | Dưới 60% máu: +12% tốc chạy. |
| 1 | b | Cơ Bắp Thép | +150 máu và +8% kháng hiệu ứng. (+150 Máu, +8% Kháng hiệu ứng) |
| 1 | c | Móc Nhanh | Đấm Móc kích hoạt mỗi đòn đánh thứ 2 (thay vì 3). |
| 3 | a | Hấp Thụ Triệt Để | 60% sát thương hấp thụ khi Gồng Mình chuyển thành lá chắn 3s. |
| 3 | b | Quật Ngã Tàn Bạo | Chộp & Quật choáng 1.5s (thay vì 1s). |
| 3 | c | Cú Đấm Nhiệt Lượng | Trả Đòn luôn gây thiêu đốt. |
| 6 | a | Cú Ném Tử Thần | Chộp & Quật ném bổng mục tiêu 5 đv về phía trước; đập tường bị choáng thêm 0.75s. |
| 6 | b | Đập Nện Mặt Sàn | Đấm Móc hất tung 0.6s rồi choáng thêm 0.5s khi rơi. |
| 6 | c | Kích Nổ Adrenaline | Đang bị khống chế cứng mà Gồng Mình sẵn sàng: tự Gồng ngay, xóa khống chế. |
| 9 | a | Đấu Trường Bất Bại | Trong võ đài: Borg không thể bị cản phá. |
| 9 | b | Cú Đấm Ngàn Cân | Trả Đòn sau Gồng: cộng 80% sát thương hấp thụ (thay vì 40%) và choáng 0.75s. |
| 9 | c | Nổi Điên | Dưới 30% máu: mọi đòn đánh hất tung tướng 0.3s (mỗi mục tiêu 2s). |
| 12 | a | Cú Húc Xuyên Giáp | Trả Đòn khi chưa Gồng: lao 5 đv như xe bọc thép (không thể cản phá), đẩy lùi kẻ cản đường rồi mới đấm. |
| 12 | b | Đấu Sĩ Khát Máu | Càng ít máu tốc đánh càng nhanh (tối đa +60%); nắm đấm luôn thiêu đốt. |
| 12 | c | Võ Đài Vĩnh Cửu | Võ đài kéo dài 5.5s; Borg hồi 3% máu tối đa mỗi giây khi đứng trong võ đài. |

**Lối build gợi ý (AI dùng)**
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Đỡ Đòn: giày Giày Thép → Vương Miện Bất Khả Xâm Phạm → Giáp Gai → Áo Giáp Dung Nham → Trái Tim Cự Thạch → Áo Choàng Thánh Linh
- Đơn Đấu: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái
- Mảnh hồn yêu thích: Hồn Phi Thân Trảm Kích, Hồn Titan Phá Giới, Hồn Thính Giác Địa Chấn

<a id="chrononeo"></a>
### Chrono & Neo

**Định danh**
- id: `chrononeo` • màu chủ đạo: `#6ac0ff` • vũ khí/hình ảnh: `dual` • bán kính va chạm: 0.6 đv
- Vai trò: Xạ thủ (Marksman) • vị trí: Xạ thủ (đường dưới), Đường giữa • nhãn: autos
- Tầm xa • sát thương chính: vật lý • tài nguyên: mana
- Đạn đánh thường: kiểu `chrono`, tốc độ 26 đv/s
- Dùng **súng & băng đạn**: đánh thường tốn đạn, hết đạn phải nạp (xem nội tại).
- Tính cách AI: 🌾 Tham Farm — Ăn quái, tranh boss, mua đồ; tránh đánh sớm. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh cuối trận · Cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1344 | 211.2 | 3033.6 | 4934.4 |
| Máu (gốc trong dữ liệu) | 560 | 88 | 1264 | 2056 |
| Mana | 320 | 40 | 640 | 1000 |
| Hồi mana/s (thực tế, ×1.6) | 2.56 | 0.13 | 3.58 | 4.74 |
| SMVL | 60 | 3.7 | 89.6 | 122.9 |
| Giáp | 26 | 3.8 | 56.4 | 90.6 |
| Kháng phép | 30 | 1.3 | 40.4 | 52.1 |
| Tốc đánh | 0.68 | +3% | 0.84 | 1.03 |
| Tốc chạy | 3.3 | — | 3.3 | 3.3 |
| Tầm đánh | 6 | — | 6 | 6 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Hai Thời Đại**

Hai thế, mỗi thế một băng đạn (tăng theo cấp): Chrono 4→10 viên nặng (×1.5 sát thương, −25% tốc đánh, xuyên 20% giáp, nạp 2.5s) • Neo 10→20 viên nhẹ, mỗi lần bóp cò bắn 2 viên liên tiếp (mỗi viên ×0.75 sát thương), +25% tốc đánh, +8% tốc chạy, nạp 1.5s.
- Mã nguồn: `src/data/heroes/chrononeo.js:33`

**S1 — Phát Bắn Cường Hóa**

- Hồi chiêu: 6 / 5.5 / 5 / 4.5 / 4s • Mana: 40 / 40 / 40 / 40 / 40 • Thi triển: 0.12s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.5 đv • Tốc đạn/lướt: 30 đv/s • Mục đích AI: cấu rỉa
- Chrono: 1 viên nặng xuyên thấu 8 đv, đẩy lùi 1.5 đv • Neo: 2 viên nhanh, làm chậm 30% 1s.
- Công thức trong mã: `[50/80/110/140/170 theo cấp chiêu] + 0.8×SMVL`
- Mã nguồn: `src/data/heroes/chrononeo.js:66`

**S2 — Thời Khắc**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Mana: 60 / 60 / 60 / 60 / 60 • Thi triển: 0.1s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 7.5 đv • Mục đích AI: dồn sát thương
- Chrono: quét và đánh dấu mọi mục tiêu (tướng lẫn quái) trong 12 đv trong 2s, rồi Liên Xạ 0.5s xả hết băng đạn chia đều lên các mục tiêu bị đánh dấu BẤT KỂ KHOẢNG CÁCH; trong lúc xả đi chậm 30%, không thể cản phá • Neo: mưa đạn hình nón 8 đv gồm 7/8/9/9/10 viên, xé Hộ Giáp.
- Công thức trong mã: `[30/45/60/75/90 theo cấp chiêu] + 0.45×SMVL`
- Mã nguồn: `src/data/heroes/chrononeo.js:81`

**S3 — Bước Thời Gian**

- Hồi chiêu: 12 / 11 / 10 / 9 / 8s • Mana: 45 / 45 / 45 / 45 / 45
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 6 đv • Mục đích AI: thoát thân
- Chrono: bước lên 2.5/2.5/2.5/3/4 đv, nạp đầy băng Chrono, giảm 30% sát thương 2/2/3/4/6s • Neo: lướt 6/6/6/7/8 đv, nạp đầy băng Neo, để lại ảo ảnh BẤT TỬ 10s tự bắn (25% sát thương); trong 10s dùng lại để đổi chỗ với ảo ảnh (mỗi 2s một lần), mỗi lần đổi +tốc chạy và tốc đánh 1.5s. Hồi chiêu bắt đầu tính từ giây thứ 4.
- Công thức trong mã: `40 + 10×ucấp + 0.5×SMVL`
- Mã nguồn: `src/data/heroes/chrononeo.js:111`

**S4 — Liên Hoa Thời Không**

- Hồi chiêu: 110 / 90 / 70s • Mana: 100 / 100 / 100
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6.5 đv • Bán kính vùng: 6 đv • Mục đích AI: chiêu cuối
- Hợp nhất 5/6/8s: mỗi 0.5s xả 2 vòng 10/12/16 viên BAY THẲNG chia góc đều — vòng đạn nặng Chrono xen vòng đạn nhanh Neo lệch nửa bước góc, mỗi đợt xoay thêm một chút thành bông sen nở xoay tròn, xen kẽ đạn Chrono (nặng, xuyên thấu) và đạn Neo (nhanh); vẫn dùng được Bước Thời Gian. • Dạng Chrono: đạn to, mạnh hơn, đẩy lùi nhẹ; kết thúc Nở Rộ 30 viên đạn nặng, hất văng kẻ áp sát 3 đv. • Dạng Neo: gọi Ảnh Chiếu bất tử cùng xả đạn (dùng lại để đổi chỗ), +10/14/18% tốc chạy; kết thúc tỏa 10/15/20 viên và lướt ngắn 3 đv.
- Công thức trong mã: `[30/45/60 theo cấp chiêu] + 0.3×SMVL`
- Mã nguồn: `src/data/heroes/chrononeo.js:154`

**Skill phụ — Chuyển Thế**

- Hồi chiêu: 4s
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: phòng thủ
- Đổi thế. Sang Chrono: sóng đẩy lùi 1.5 đv quanh người + giảm 25% sát thương 1s • Sang Neo: +40% tốc chạy 1.5s.
- Mã nguồn: `src/data/heroes/chrononeo.js:144`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Cò Súng Đôi | Mỗi khẩu thêm 1 viên (Chrono 5, Neo 11). |
| 1 | b | Hồi Nhịp Nhanh | Nạp đạn của cả hai thế nhanh hơn 25%. |
| 1 | c | Lướt Xuyên Không | Bước Thời Gian xa hơn 25%. |
| 3 | a | Nhiệt Hỏa Quá Khứ | Liên Xạ của Chrono gây thiêu đốt. |
| 3 | b | Nghịch Ảnh Tương Lai | Neo quay về chỗ ảo ảnh: choáng 0.75s kẻ địch xung quanh. |
| 3 | c | Đẩy Nhanh Chu Kỳ | Thời Khắc hồi chiêu nhanh hơn 30%. |
| 6 | a | Vụ Nổ Quá Khứ | Chrono: sau Bước Thời Gian, dùng lại để kích nổ điểm xuất phát, hất văng kẻ truy đuổi. |
| 6 | b | Hoán Đổi Ảo Ảnh | Neo: dùng lại Bước Thời Gian thì hoán đổi với ảo ảnh (ảo ảnh ở lại dụ địch) và nã 3 viên làm chậm. |
| 6 | c | Đồng Hồ Cát Đồng Bộ | Chuyển Thế nạp đầy đạn cho cả hai khẩu. |
| 9 | a | Thời Gian Tự Do | Chuyển Thế hồi 1.5s; mỗi lần đổi thế nạp ngay 1 viên cho thế mới. |
| 9 | b | Nghịch Lý Sinh Tồn | Neo quay về chỗ ảo ảnh: hồi lại lượng máu đã mất trong 2s qua. |
| 9 | c | Cỗ Xe Tăng Thời Gian | 2.5s đầu của Liên Xạ (Chrono): máu không xuống dưới 1. |
| 12 | a | Giao Thoa Không Gian | Trong Liên Xạ: dùng lại Thời Khắc để kéo mọi tướng địch trong 6 đv về trước nòng súng. |
| 12 | b | Nghịch Lý Thời Gian | Mỗi phát đánh thường bắn cùng lúc đạn Quá Khứ lẫn Tương Lai: luôn ×1.4 sát thương ở cả hai thế. |
| 12 | c | Vòng Lặp Vĩnh Cửu | Đòn chí tử: tua ngược về vị trí 3–4s trước với 30% máu (1 lần mỗi trận). |

**Lối build gợi ý (AI dùng)**
- Xạ Thủ Súng: giày Giày Cuồng Chiến → Cung Thần Phong → Đao Phá Quân → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Chí Mạng: giày Giày Cuồng Chiến → Đao Phá Quân → Cung Gió Lốc → Kiếm Bão Táp → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Tốc Đánh: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Cung Thần Phong → Dao Cắt Gân → Cung Gió Lốc → Huyết Kiếm Đoạt Mệnh
- Mảnh hồn yêu thích: Hồn Xả Chiêu Tiếp Đạn, Hồn Ổ Đạn Mở Rộng, Hồn Bão Đạn Vô Tận

<a id="clint"></a>
### Clint

**Định danh**
- id: `clint` • màu chủ đạo: `#d0a060` • vũ khí/hình ảnh: `shotgun` • bán kính va chạm: 0.65 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đi rừng, Đường trên • nhãn: autos
- Tầm xa • sát thương chính: vật lý • tài nguyên: mana
- Đạn đánh thường: kiểu `pellet`, tốc độ 26 đv/s
- Dùng **súng & băng đạn**: đánh thường tốn đạn, hết đạn phải nạp (xem nội tại).
- Tính cách AI: 🚧 Gác Cổng — Vào bo sớm 30 giây, giữ lối vào; phục kích kẻ chạy bo và dùng khống chế giữ chúng ngoài bão. • Phong cách đánh: 🎯 Đứng bắn — Đánh tầm xa nhưng ít di chuyển, không cố thả diều.
- Giai đoạn mạnh: Mạnh đầu trận · Cần đồ vừa phải

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1572 | 235.2 | 3453.6 | 5570.4 |
| Máu (gốc trong dữ liệu) | 655 | 98 | 1439 | 2321 |
| Mana | 300 | 38 | 604 | 946 |
| Hồi mana/s (thực tế, ×1.6) | 2.4 | 0.13 | 3.42 | 4.58 |
| SMVL | 69 | 4 | 101 | 137 |
| Giáp | 33 | 4 | 65 | 101 |
| Kháng phép | 32 | 1.8 | 46.4 | 62.6 |
| Tốc đánh | 0.75 | +2.5% | 0.9 | 1.07 |
| Tốc chạy | 3.5 | — | 3.5 | 3.5 |
| Tầm đánh | 3.4 | — | 3.4 | 3.4 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — 2 Viên Đạn & Phản Lực Hỏa Lực**

Đánh thường là chùm đạn ghém tỏa nón: kẻ đứng sát (≤ 1.8 đv) nhận ×1.5, ở rìa tầm ×0.8, kẻ khác trong nón nhận 35%; mỗi phát trúng đẩy lùi 0.5 đv. Băng đạn KHÓA CỨNG 2 viên (tự nạp 1.0s/viên); mọi chỉ số tăng sức chứa băng đạn quy đổi: mỗi viên thêm = +18% Công Vật Lý.

- Công thức trong mã: `u.ws.dragonDmg + 0.2×SMVL`
- Mã nguồn: `src/data/heroes/clint.js:16`

**S1 — Báng Súng**

- Hồi chiêu: 6 / 5.5 / 5 / 4.5 / 4s • Mana: 35 / 35 / 35 / 35 / 35 • Thi triển: 0.12s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 2 đv • Mục đích AI: dồn sát thương
- Nện báng súng trước mặt (1.8 đv): sát thương vật lý, choáng 0.25s và làm chậm 30/40/45/50/55% trong 1.5/1.5/1.75/2/2s. Trúng tướng hoặc quái lớn: nạp ngay 1 viên.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/clint.js:66`

**S2 — Nạp Đạn Khẩn Cấp**

- Hồi chiêu: 12 / 11.5 / 11 / 10.5 / 10s • Mana: 50 / 50 / 50 / 50 / 50 • Thi triển: 0.1s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 5 đv • Mục đích AI: khống chế
- Ném vỏ đạn vào mục tiêu trong 5 đv: choáng 0.5s; nạp đầy 2 viên; phát kế tiếp chắc chắn chí mạng.
- Công thức trong mã: `[40/60/80/100/120 theo cấp chiêu] + 0.4×SMVL`
- Mã nguồn: `src/data/heroes/clint.js:85`

**S3 — Bắn Nhảy**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Mana: 45 / 45 / 45 / 45 / 45
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 8 đv • Mục đích AI: thoát thân
- Chĩa súng xuống sàn: kẻ địch quanh chân (2 đv) nhận sát thương, để lại Vùng Lửa thiêu 2.5% máu tối đa mỗi giây trong 3s; bật nhảy vượt chướng ngại 4–8 đv theo hướng chọn; tiếp đất nạp lại 1 viên.
- Công thức trong mã: `[40/65/90/115/140 theo cấp chiêu] + 0.5×SMVL`
- Mã nguồn: `src/data/heroes/clint.js:99`

**S4 — Dragon's Breath**

- Hồi chiêu: 100 / 85 / 70s • Mana: 100 / 100 / 100
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: chiêu cuối
- Nạp 2 viên Đạn Rồng Hỏa Ngục trong 10s: mỗi phát phun bão lửa hình nón 90° dài 6/12/18 đv — thiêu đốt, phá 30% Hộ Giáp hiện tại, sát thương diện rộng và hất văng 2.5 đv (ép đối thủ ra ngoài bo).
- Mã nguồn: `src/data/heroes/clint.js:121`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Cò Kép Nhanh | Tự nạp đạn 0.75s/viên (thay vì 1.0s). |
| 1 | b | Báng Súng Thép | Báng Súng (S1) tầm đập rộng hơn 30%. |
| 1 | c | Phản Lực Nhảy | Bắn Nhảy (S3) bật xa hơn 30%. |
| 3 | a | Dập Lửa Dưới Chân | Kẻ địch ở chỗ dậm của Bắn Nhảy bị choáng 0.6s. |
| 3 | b | Vỏ Đạn Gây Mù | Nạp Đạn Khẩn Cấp (S2) choáng 1s (thay vì 0.5s). |
| 3 | c | Nạp Kép Cận Chiến | Báng Súng trúng: nạp 2 viên (thay vì 1). |
| 6 | a | Đoạt Mệnh Cận Chiến | Báng Súng thành tọng họng súng: +20% sát thương, hất văng 3 đv (thay cho làm chậm), nạp 2 viên. |
| 6 | b | Dậm Gót Tử Thần | Sau Bắn Nhảy, trong 1.5s dùng lại: bổ gót xuống tướng địch gần nhất trong 4 đv, choáng 1s. |
| 6 | c | Hạt Chì Nặng | Phát bắn sát người (dưới 1.4 đv) lên tướng: choáng 0.4s (mỗi mục tiêu 5s). |
| 9 | a | Dragon's Breath Bất Tận | Dragon's Breath có 3 viên (thay vì 2) và không thể cản phá trong 6s. |
| 9 | b | Băng Ba Viên | Băng đạn vẫn khóa 2 viên: quy đổi thành +18% Công Vật Lý. |
| 9 | c | Điểm Hỏa Khắc Tinh | Phát bắn sát người phá tan mọi lá chắn của mục tiêu. |
| 12 | a | Đạn Xuyên Phá Cỡ Lớn | Nạp Đạn Khẩn Cấp nạp 1 viên đặc chế: phát kế tiếp gây gấp đôi sát thương, phá khiên và đẩy lùi 2 đv. |
| 12 | b | Thợ Săn Bất Tử | +0.8 tầm bắn, không còn bị giảm sát thương khi bắn xa; mỗi phát trúng tướng hồi 2% máu tối đa. (+0.8 Tầm đánh) |
| 12 | c | Băng Đạn Vô Tận | Hạ gục tướng: nạp đầy đạn, hồi ngay Bắn Nhảy và Báng Súng. |

**Lối build gợi ý (AI dùng)**
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Xạ Thủ Súng: giày Giày Cuồng Chiến → Cung Thần Phong → Đao Phá Quân → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Lộn Nhào Nạp Đạn, Hồn Sóng Nhiệt Buồng Đạn, Hồn Phản Xạ Thoát Hiểm

<a id="dahlia"></a>
### Dahlia

**Định danh**
- id: `dahlia` • màu chủ đạo: `#c040ff` • vũ khí/hình ảnh: `blackcane` • bán kính va chạm: 0.56 đv
- Vai trò: Pháp sư (Mage) • vị trí: Đường giữa, Đi rừng • nhãn: illusion, stealth
- Tầm xa • sát thương chính: phép • tài nguyên: mana
- Đạn đánh thường: kiểu `rose`, tốc độ 20 đv/s
- Thanh tài nguyên riêng: **Cuồng Nhiệt** (0–100, màu `#c040ff`).
- Tính cách AI: 🎭 Ngụy Quân Tử — Đầu–giữa trận đề nghị đình chiến, cùng đánh quái và kẻ thứ ba; khi đồng minh dưới 30% máu hoặc cúi xuống mở rương thì đâm sau lưng. • Phong cách đánh: 🗡 Sát thủ phép — Đọc vị mục tiêu: máu giấy thì lao vào dồn sát thương rồi rút; trâu bò thì cấu rỉa tới ngưỡng kết liễu. Thấy đối thủ hụt chiêu lớn là lao vào ngay.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: thù: Aria & Oktava, Victoria, Roxie & T-Zero

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1332 | 211.2 | 3021.6 | 4922.4 |
| Máu (gốc trong dữ liệu) | 555 | 88 | 1259 | 2051 |
| Mana | 400 | 48 | 784 | 1216 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 52 | 3 | 76 | 103 |
| Giáp | 25 | 3.7 | 54.6 | 87.9 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.45 | — | 3.45 | 3.45 |
| Tầm đánh | 5 | — | 5 | 5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Náo Nhiệt & Cuồng Nhiệt • Chiếc Mũ Thoát Hiểm • Ảo Ảnh Chết Chóc • Gậy Đen**

Có ai lướt / dịch chuyển gần đó: +5 Náo Nhiệt; quái, vật triệu hồi, ảo ảnh bị hạ: +8; có đơn vị không phải tướng trong 6 đv: +3/giây. Đủ 100 → Cuồng Nhiệt 8s: +40% tốc đánh, +25% sát thương phép, +20% tốc chạy, cường hóa mọi chiêu. Tụt xuống 50% máu (90s): mũ cao chụp xuống, Dahlia dịch chuyển 5.5 đv, chiếc mũ phát nổ choáng 1s quanh chỗ cũ. Ảo ảnh của Dahlia tự đánh (35%) và khi tan để lại khói độc 3.5s (mù, độc, gọt Hộ Giáp). Đánh thường gây sát thương phép, đòn thứ 3 liên tiếp nổ lan 2 đv.

- Công thức trong mã: `60 + 12×cấp + 0.5×SMPT` • `30 + 8×cấp + 0.4×SMPT`
- Mã nguồn: `src/data/heroes/dahlia.js:32`

**S1 — Thoát Nguy**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Mana: 50 / 50 / 50 / 50 / 50 • Hồi chiêu bắt đầu do chiêu tự tính (ví dụ sau khi kết thúc trạng thái) • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 8 đv • Đạn định hướng (né được) • Mục đích AI: mở giao tranh
- Hoán đổi vị trí tức thì với một đơn vị không phải tướng (quái, vật triệu hồi, ảo ảnh) trong 8 đv; tàng hình 1.5s, +30% tốc đánh và +20% sát thương phép 3s. Cuồng Nhiệt: chụp Mũ Đen lên tối đa 3 đơn vị không phải tướng trong 6 đv, biến chúng thành bản sao Dahlia 6s. Trong Sân Khấu Chết Chóc: thành Hư Ảnh Bước (dịch chuyển 2.5 đv, tàng hình 0.75s, hồi 1.2s, NỔ bóng tối ở điểm đầu và điểm cuối: bán kính 2, sát thương phép, làm chậm 30%).
- Công thức trong mã: `40 + 10×cấp + 0.35×SMPT` • `120 + 20×cấp + 1×SMPT`
- Mã nguồn: `src/data/heroes/dahlia.js:92`

**S2 — Hoán Vị & Màn Ảo Thuật**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Mana: 60 / 60 / 60 / 60 / 60
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: phòng thủ
- Thế "Màn Ảo Thuật" 1.2s: tướng địch nào ra đòn vào Dahlia bị Mũ Cao khổng lồ chụp xuống giam lại, kiếm ma thuật đâm xuyên (sát thương phép lớn); Dahlia biến mất và hiện ra cách đó 3.5 đv. Cuồng Nhiệt: +50% sát thương và choáng nạn nhân 1.25s. Nội tại: nhận đòn chí tử thì đổi chỗ với đơn vị gần nhất và tàng hình 2s (120s).
- Công thức trong mã: `[100/150/200/250/300 theo cấp chiêu] + 0.8×SMPT`
- Mã nguồn: `src/data/heroes/dahlia.js:124`

**S3 — Đôi Ảnh Quấy Nhiễu**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Mana: 55 / 55 / 55 / 55 / 55
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 7 đv • Mục đích AI: dồn sát thương
- Tạo 2 ảo ảnh bước đều về phía trước hình chữ V (7 đv) tự đánh tướng địch trên đường; Dahlia +35% tốc đánh, +25% tốc chạy 3.5s. Nội tại: đòn đánh của Dahlia và ảo ảnh làm chậm 25% 1.5s.
- Mã nguồn: `src/data/heroes/dahlia.js:130`

**S4 — Sân Khấu Chết Chóc**

- Hồi chiêu: 90 / 75 / 60s • Mana: 100 / 100 / 100
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 7 đv • Bán kính vùng: 8 đv • Mục đích AI: chiêu cuối
- Cắm gậy mở vũ đài bóng tối bán kính 10/15/20 đv trong 16/20/25s (thấy rõ vành rèm nhung tím): Thoát Nguy thành Hư Ảnh Bước; +60% tốc đánh, +30% sát thương đòn đánh; mỗi 10 đòn trúng (của Dahlia và ảo ảnh) sinh một ảo ảnh mới cạnh mục tiêu; ảo ảnh trong sân khấu +50% máu và đánh chắc chắn gây độc. Dahlia cố đánh trong vòng sân khấu.
- Công thức trong mã: `100 + 15×cấp + 0.5×SMPT`
- Mã nguồn: `src/data/heroes/dahlia.js:140`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Khán Giả Quái Vật | Đơn vị không phải tướng bị hạ: +14 Náo Nhiệt (thay vì 8). |
| 1 | b | Gậy Phép Tốc Độ | Đòn đánh thứ 3 giảm 0.5s hồi chiêu Thoát Nguy. |
| 1 | c | Bồ Câu Lướt Gió | Sau Thoát Nguy: +35% kháng làm chậm 3s. |
| 3 | a | Độc Khí Tê Liệt | Khói độc của ảo ảnh câm lặng 0.75s đầu. |
| 3 | b | Chiếc Mũ Gia Cố | Mũ Thoát Hiểm cho giáp ảo 20% máu tối đa. |
| 3 | c | Tia Sáng Liên Hoàn | Đòn thứ 3 nổ lan 3.5 đv. |
| 6 | a | Đại Đội Ảo Ảnh | Cuồng Nhiệt: Thoát Nguy biến tối đa 5 đơn vị. |
| 6 | b | Màn Ảo Thuật Phá Giáp | Kiếm đâm của Màn Ảo Thuật phá 300 Hộ Giáp. |
| 6 | c | Thoát Nguy Tầm Xa | Thoát Nguy với tới 11.5 đv. |
| 9 | a | Cuồng Nhiệt Vô Tận | Cuồng Nhiệt kéo dài 12s. |
| 9 | b | Ảo Ảnh Đao Phong | Ảo ảnh đánh 55% sát thương. |
| 9 | c | Sân Khấu Kéo Dài | Sân Khấu Chết Chóc kéo dài thêm 3s. |
| 12 | a | Vua Bầy Ảo Ảnh | Phong cách: trong sân khấu chỉ cần 5 đòn để sinh ảo ảnh. |
| 12 | b | Ảo Thuật Gia Bất Tử | Phong cách: Mũ Thoát Hiểm và Hoán Vị chí tử hồi nhanh gấp đôi. |
| 12 | c | Đệ Tử Cống Ngầm | +15% tốc đánh, +10% tốc chạy. (+15% Tốc đánh, +10% Tốc chạy) |

**Lối build gợi ý (AI dùng)**
- Đấu Sĩ Phép: giày Giày Thép → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Đồng Hồ Cát Nghịch Đảo → Giáp Gai → Trái Tim Cự Thạch
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Phong Lôi Liên Kích, Hồn Vũ Điệu Tử Thần, Hồn Nguyệt Thực Hắc Ám

<a id="death"></a>
### Death

**Định danh**
- id: `death` • màu chủ đạo: `#8a7aa8` • vũ khí/hình ảnh: `scythe` • bán kính va chạm: 0.7 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đi rừng, Hỗ trợ • nhãn: cc
- Cận chiến • sát thương chính: phép • tài nguyên: mana
- Tính cách AI: 🗡 Ám Sát — Săn kẻ đứng lẻ, máu thấp; phục kích trong bụi. • Phong cách đánh: ⚔ Xông xáo — Đánh tới khi còn khoảng 10% máu mà thấy không thắng nổi mới chạy.
- Giai đoạn mạnh: Mạnh đầu trận · Ít cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1620 | 244.8 | 3578.4 | 5781.6 |
| Máu (gốc trong dữ liệu) | 675 | 102 | 1491 | 2409 |
| Mana | 360 | 42 | 696 | 1074 |
| Hồi mana/s (thực tế, ×1.6) | 2.88 | 0.14 | 4.03 | 5.33 |
| SMVL | 66 | 3.8 | 96.4 | 130.6 |
| Giáp | 32 | 4.1 | 64.8 | 101.7 |
| Kháng phép | 32 | 1.7 | 45.6 | 60.9 |
| Tốc đánh | 0.67 | +2.2% | 0.79 | 0.92 |
| Tốc chạy | 3.5 | — | 3.5 | 3.5 |
| Tầm đánh | 2.2 | — | 2.2 | 2.2 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Lưỡi Hái Tử Thần**

Đánh thường quét vòng cung (kẻ địch khác trong vùng nhận 50%). Trúng bằng lưỡi (phần ngoài của tầm) +15% sát thương và hồi 10 (+2/cấp) máu; trúng kẻ vừa bị kéo thì hất tung 0.5s.
- Mã nguồn: `src/data/heroes/death.js:10`

**S1 — Lưỡi Hái Đoạt Mệnh**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Mana: 60 / 65 / 70 / 75 / 80 • Thi triển: 0.2s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.8 đv • Tốc đạn/lướt: 18 đv/s • Đạn định hướng (né được) • Chỉ nhắm tướng • Mục đích AI: mở giao tranh
- Quăng liềm 7 đv; trúng kẻ đầu tiên thì gây sát thương phép và giật nó về cạnh Death.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.5×SMPT`
- Mã nguồn: `src/data/heroes/death.js:46`

**S2 — Phán Quyết**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Mana: 50 / 50 / 50 / 50 / 50 • Thi triển: 0.2s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.5 đv • Tốc đạn/lướt: 16 đv/s • Mục đích AI: cấu rỉa
- Bổ liềm trước mặt và phóng cầu hắc ám bay 7 đv; +50% sát thương lên mục tiêu dưới 30% máu.
- Công thức trong mã: `[80/125/170/215/260 theo cấp chiêu] + 0.65×SMPT`
- Mã nguồn: `src/data/heroes/death.js:62`

**S3 — Xoay Liềm**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Mana: 60 / 60 / 60 / 60 / 60
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6 đv • Mục đích AI: khống chế
- Thả liềm xoay tại điểm trong 6 đv trong 2s: sát thương và hút nhẹ về tâm. Bấm lại trong 2s: dịch chuyển tới liềm, chém vòng tròn.
- Công thức trong mã: `[50/80/110/140/170 theo cấp chiêu] + 0.4×SMPT`
- Mã nguồn: `src/data/heroes/death.js:84`

**S4 — Gọi Hồn**

- Hồi chiêu: 120 / 100 / 80s • Mana: 100 / 100 / 100 • Thi triển: 0.2s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 5 đv • Chỉ nhắm tướng • Mục đích AI: chiêu cuối
- Đánh dấu một tướng trong 5 đv: 2 bóng ma bắt chước đòn của Death trong 5s (mọi sát thương Death gây lên nó lặp lại thêm 40% dạng phép), mục tiêu bị làm chậm 20%.
- Công thức trong mã: `[100/150/200 theo cấp chiêu] + 0.5×SMPT`
- Mã nguồn: `src/data/heroes/death.js:110`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Lưỡi Tử Thần | Phần lưỡi liềm dài hơn: điểm ngọt tính từ 40% tầm (thay vì 55%). |
| 1 | b | Mùi Máu Tươi | +20% tốc chạy khi tiến về tướng địch dưới 50% máu. |
| 1 | c | Gặt Nhanh | Phán Quyết (S2) hồi chiêu nhanh hơn 1.5s. |
| 3 | a | Xoáy Hút Linh Hồn | Xoay Liềm (S3) hút kẻ địch về tâm mạnh gấp đôi. |
| 3 | b | Lưỡi Kéo Tàn Phế | Lưỡi Hái Đoạt Mệnh (S1) kéo trúng: trói chân thêm 0.75s. |
| 3 | c | Cắt Đứt Hy Vọng | Đánh thường lên kẻ vừa bị kéo: hất tung 0.8s (thay vì 0.5s) và +40% sát thương. |
| 6 | a | Lưỡi Trảm Đoạt Hồn | Phán Quyết thành nhát chém chữ X hình nón 3.5 đv, đẩy lùi 1.5 đv; trúng tướng hồi 8% máu đã mất (hồi chiêu +2s). |
| 6 | b | Thu Hồi Lưỡi Hái | Xoay Liềm: dùng lại để giật liềm về tay, kéo mọi kẻ địch trên đường về phía Death (thay cho dịch chuyển). |
| 6 | c | Hơi Thở Tử Thần | Kẻ địch trong 3 đv quanh Death chậm 15%. |
| 9 | a | Án Tử Tức Thì | Phán Quyết +50% sát thương lên mục tiêu dưới 45% máu (thay vì 30%). |
| 9 | b | Tam Vị Nhất Thể | Gọi Hồn: 3 bóng ma — lặp lại 60% sát thương (thay vì 40%). |
| 9 | c | Thu Hoạch Linh Hồn | Hạ gục tướng: hồi 15% máu tối đa và 40 mana. |
| 12 | a | Trảm Quyết Diện Rộng | Phán Quyết bổ thành sóng hình nón 4.5 đv; tướng dưới 15% máu trúng đòn bị kết liễu ngay. |
| 12 | b | Sứ Giả Địa Ngục | Đổi sang Xích Liềm: +0.8 tầm đánh, Lưỡi Hái và cầu Phán Quyết bay xa 9 đv; đánh thường kéo nhẹ mục tiêu 0.5 đv về phía Death. (+0.8 Tầm đánh) |
| 12 | c | Hộ Thân Oan Hồn | Mỗi lần hạ gục tướng: +1 linh hồn xoay quanh (tối đa 3); mỗi linh hồn chặn hoàn toàn 1 đòn đánh hoặc chiêu. |

**Lối build gợi ý (AI dùng)**
- Đấu Sĩ Phép: giày Giày Thép → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Đồng Hồ Cát Nghịch Đảo → Giáp Gai → Trái Tim Cự Thạch
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Nhiệt Ảnh Truy Mệnh, Hồn Nguyệt Thực Hắc Ám, Hồn Trường Nhận Phong Khí

<a id="thanhphong"></a>
### Diệp Thanh Phong

**Định danh**
- id: `thanhphong` • màu chủ đạo: `#7ad0b0` • vũ khí/hình ảnh: `fan` • bán kính va chạm: 0.58 đv
- Vai trò: Pháp sư (Mage) • vị trí: Đường giữa, Hỗ trợ • nhãn: cc
- Tầm xa • sát thương chính: phép • tài nguyên: không dùng mana
- Đạn đánh thường: kiểu `tornado`, tốc độ 18 đv/s
- Tính cách AI: 📿 Cuồng Tín — Truy sát "dị giáo" (Death) tới cùng trời cuối đất, kể cả ngoài bo. • Phong cách đánh: 🗡 Sát thủ phép — Đọc vị mục tiêu: máu giấy thì lao vào dồn sát thương rồi rút; trâu bò thì cấu rỉa tới ngưỡng kết liễu. Thấy đối thủ hụt chiêu lớn là lao vào ngay.
- Giai đoạn mạnh: Mạnh giữa trận · Ít cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1344 | 211.2 | 3033.6 | 4934.4 |
| Máu (gốc trong dữ liệu) | 560 | 88 | 1264 | 2056 |
| Mana | 420 | 50 | 820 | 1270 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 52 | 3 | 76 | 103 |
| Giáp | 24 | 3.6 | 52.8 | 85.2 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.45 | — | 3.45 | 3.45 |
| Tầm đánh | 4.8 | — | 4.8 | 4.8 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Khí Áp Phong Vũ**

Thước Gió 0–100 (S1 kéo −17.5, S2 đẩy +17.5). Thuận (≤35): +15% tốc chạy, Giáp Phong Hộ chặn trọn 1 đòn mỗi 10s, đánh thường tầm 4.8 làm chậm 20% 1s • Bão Hòa (36–64): đòn đánh và chiêu găm Gió Mê, 3 tầng thì ngủ 1s; tầm đánh 6.0; mỗi 5s đòn đánh kế tiếp phóng 3 luồng lốc hất tung 0.5s • Nghịch (≥65): +20% sát thương, thành CẬN CHIẾN (tầm 1.8); mỗi 5s đòn đánh kế tiếp là cú Đột Kích lướt tới mục tiêu gây sát thương phép bộc phá.

- Công thức trong mã: `50 + 14×cấp + 0.3×SMVL + 0.7×SMPT` • `25 + 8×cấp + 0.35×SMPT`
- Mã nguồn: `src/data/heroes/thanhphong.js:36`

**S1 — Toàn Phong Quy**

- Hồi chiêu: 7 / 6.5 / 6 / 5.5 / 5s • Thi triển: 0.15s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.6 đv • Tốc đạn/lướt: 16 đv/s • Mục đích AI: cấu rỉa
- Lốc xoáy thẳng 7 đv (gió −17.5). Thuận: lốc lớn, cuối đường thành Vực Xoáy giữ chân 1.5s + sát thương liên tục • Bão Hòa: lướt nhẹ 1.5 đv, lốc bay nhanh hơn 40%, hất tung • Nghịch: Thanh Phong lướt theo lốc áp sát, chém bồi sát thương phép.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/thanhphong.js:78`

**S2 — Bát Diện Phong Trận**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Thi triển: 0.1s
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 3 đv • Mục đích AI: dồn sát thương
- Sóng gió 360° bán kính 3 (gió +17.5). Thuận: đẩy lùi 4 đv + Màng Chắn Gió 3s chặn 100% đạn đạo • Bão Hòa: lướt nhẹ 1.5 đv, kẻ bị đẩy đập vật cản / hết tầm đẩy thì choáng 1s • Nghịch: phóng lưỡi gió rồi dịch chuyển ra sau lưng tướng gần nhất đâm chí mạng ×1.5.
- Công thức trong mã: `[55/85/115/145/175 theo cấp chiêu] + 0.5×SMPT`
- Mã nguồn: `src/data/heroes/thanhphong.js:110`

**S3 — Mê Tung Phong Vực**

- Hồi chiêu: 15 / 14 / 13 / 12 / 11s • Thi triển: 0.05s
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 4 đv • Mục đích AI: thoát thân
- Không đổi gió. Thuận: hút kẻ địch vào tâm, vùng gió độc 5.6 đv tồn tại 5s gây Mù + Câm lặng • Bão Hòa: lướt 4 đv và tàng hình 1.5s, để lại cơn lốc hất tung ở điểm cuối • Nghịch: lướt xa 6 đv gây sát thương trên đường, điểm cuối Thiên Lôi Phong giáng xuống bộc phá.
- Công thức trong mã: `[50/80/110/140/170 theo cấp chiêu] + 0.5×SMPT` • `10 + 3×cấp + 0.1×SMPT`
- Mã nguồn: `src/data/heroes/thanhphong.js:145`

**S4 — Cơn Gió Đưa Giấc**

- Hồi chiêu: 120 / 100 / 80s • Thi triển: 0.2s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 9 đv • Bán kính vùng: 4.5 đv • Mục đích AI: chiêu cuối
- Vùng bão bán kính 4.5 tại điểm trong 9 đv suốt 5s: chậm 50%; đứng trong vùng quá 2s thì ngủ 1.5s; đòn đầu tiên đánh thức gây ×1.5.
- Công thức trong mã: `[25/40/55 theo cấp chiêu] + 0.15×SMPT`
- Mã nguồn: `src/data/heroes/thanhphong.js:201`

**Skill phụ — Nghịch Chuyển Canh Khí**

- Hồi chiêu: 12s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 7 đv • Mục đích AI: phòng thủ
- Hồi 12s — làm mới ngay S1, S2, S3. Thuận → Nghịch: lốc từ trời giáng xuống kẻ địch gần nhất (sát thương lớn) + lướt tới trước • Bão Hòa: kích nổ khí áp đẩy lùi 2 đv + Thanh Tẩy mọi khống chế • Nghịch → Thuận: lướt lùi ra xa, ném lốc hất tung, nhận khiên bảo hộ.
- Công thức trong mã: `60 + 14×cấp + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/thanhphong.js:174`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Khí Lưu Thuận Chiều | Thuận: +25% tốc chạy (thay vì 15%). |
| 1 | b | Cắt Gió Tàn Bạo | Nghịch: +30% sát thương (thay vì 20%). |
| 1 | c | Phong Hộ Tái Sinh | Giáp Phong Hộ hồi 7s (thay vì 10s). |
| 3 | a | Phong Độc Hôn Mê | Vùng Mê Tung gây sát thương liên tục lên kẻ đang bị mù. |
| 3 | b | Kình Phong Xuyên Thấu | Vực xoáy của Toàn Phong Quy (Thuận) hút mạnh gấp đôi và giữ 2s. |
| 3 | c | Bão Thuẫn Phản Hồi | Màng chắn của Bát Diện (Thuận) dội ngược: mỗi viên đạn bị chặn gây 40 (+8/cấp) sát thương phép lên kẻ bắn. |
| 6 | a | Lốc Xoáy Kép | Sau cú đâm sau lưng (Bát Diện Nghịch), trong 1.5s dùng lại: xoay quạt hất tung 0.75s quanh mình. |
| 6 | b | Phiến Khí Bát Đoạn | Toàn Phong Quy thay bằng 5 luồng khí rẻ quạt, làm chậm 30% (không đổi gió theo trạng thái). |
| 6 | c | Hơi Thở Của Gió | Mỗi lần dùng Nghịch Chuyển Canh Khí hồi 8% máu tối đa. |
| 9 | a | Giấc Mộng Không Đáy | Ngủ của Cơn Gió Đưa Giấc kéo dài 2.5s; đòn đánh thức ×2. |
| 9 | b | Lướt Gió Vô Hạn | Toàn Phong Quy ở Nghịch trúng tướng: hồi ngay (6s). |
| 9 | c | Tâm Bão Bất Khả Xâm Phạm | Ở Bão Hòa: miễn nhiễm đẩy lùi và giảm 15% sát thương nhận. |
| 12 | a | Tuyệt Ảnh Ám Sát | Khóa thước gió ở Nghịch vĩnh viễn (luôn +sát thương, Bát Diện luôn đâm sau lưng); mất Nghịch Chuyển Canh Khí. |
| 12 | b | Long Quyển Phong Bạo | Cơn Gió Đưa Giấc thêm vòi rồng ở tâm: hất tung 1.5s kẻ dưới 60% máu. |
| 12 | c | Lời Ru Vĩnh Cửu | Hạ gục tướng vừa ngủ trong 3s: hồi chiêu S4 giảm một nửa. |

**Lối build gợi ý (AI dùng)**
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Phá Ảo Chân Thị, Hồn Thiên Nhãn Xuyên Giới, Hồn Ưng Nhãn

<a id="caelus"></a>
### Dr. Caelus

**Định danh**
- id: `caelus` • màu chủ đạo: `#4ad0ff` • vũ khí/hình ảnh: `orb` • bán kính va chạm: 0.56 đv
- Vai trò: Pháp sư (Mage) • vị trí: Đường giữa • nhãn: cc, poke
- Tầm xa • sát thương chính: phép • tài nguyên: mana
- Đạn đánh thường: kiểu `data`, tốc độ 20 đv/s
- Thanh tài nguyên riêng: **Xác Suất** (0–100, màu `#6ad8ff`).
- Tính cách AI: 💰 Thực Dụng — Né đánh đầu trận, gom vàng, đúc vũ khí lên Vàng/Đỏ ở Thương Nhân; đủ đồ mới đi săn. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: thù: Luca

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1308 | 201.6 | 2920.8 | 4735.2 |
| Máu (gốc trong dữ liệu) | 545 | 84 | 1217 | 1973 |
| Mana | 420 | 50 | 820 | 1270 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 52 | 3 | 76 | 103 |
| Giáp | 22 | 3.6 | 50.8 | 83.2 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.35 | — | 3.35 | 3.35 |
| Tầm đánh | 5.8 | — | 5.8 | 5.8 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Thuật Toán Sinh Tồn • Nhãn Cảm Lượng Tử**

Kẻ địch di chuyển / lướt trong 35 đv: +2 Điểm Xác Suất mỗi giây. Mỗi 25 điểm: giảm 5% sát thương nhận. Đủ 100 (Quá Tải Phân Tích): chiêu kế tiếp không tốn năng lượng và +25% sát thương phép. Đòn đánh lén đầu tiên từ kẻ rình trong bụi / trên cao không bao giờ bất ngờ được hắn (giảm 50%, mỗi 20s).
- Mã nguồn: `src/data/heroes/caelus.js:38`

**S1 — Ma Trận Khóa Tọa Độ**

- Hồi chiêu: 12 / 11 / 10 / 9 / 9s • Mana: 50 / 50 / 50 / 50 / 50 • Thi triển: 0.15s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 13 đv • Trễ nổ: 0.6s • Mục đích AI: khống chế
- Cắm Quả Cầu Lượng Tử xuống điểm cách tối đa 14 đv: lưới điện cảnh báo 0.6s rồi kích hoạt ma trận bán kính 4 đv — kẻ địch bên trong nhận sát thương phép và choáng 1.25s. Ma trận tồn tại 3.5s: kẻ địch trong vùng bị bẻ gãy lướt / dây móc.
- Công thức trong mã: `[70/110/150/190/230 theo cấp chiêu] + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/caelus.js:60`

**S2 — Phản Xạ Lượng Tử**

- Hồi chiêu: 14 / 13 / 12 / 11 / 11s • Mana: 65 / 65 / 65 / 65 / 65
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Khiên năng lượng chắn trước mặt 2.5s: chặn mọi đạn đạo tầm xa bay tới từ phía trước, 40% sát thương chặn được chuyển thành Hộ Giáp. Dùng lại khi khiên còn: phát nổ đẩy lùi kẻ cận chiến 5 đv, gây sát thương phép và làm chậm 40% 2s.
- Công thức trong mã: `[60/90/120/150/180 theo cấp chiêu] + 0.5×SMPT`
- Mã nguồn: `src/data/heroes/caelus.js:78`

**S3 — Tia Laser Phân Rã**

- Hồi chiêu: 8 / 7.5 / 7 / 6.5 / 6.5s • Mana: 45 / 45 / 45 / 45 / 45 • Thi triển: 0.4s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 16 đv • Trễ nổ: 0.4s • Mục đích AI: cấu rỉa
- Tích năng lượng rồi bắn tia laser xuyên thấu dài 18 đv: sát thương phép lớn mọi mục tiêu trên đường, bỏ qua 50% Hộ Giáp. Trúng kẻ đang kẹt trong Ma Trận: nổ diện rộng và kéo dài ma trận thêm 1.5s.
- Công thức trong mã: `[80/125/170/215/260 theo cấp chiêu] + 0.7×SMPT`
- Mã nguồn: `src/data/heroes/caelus.js:105`

**S4 — Nghịch Đảo Dữ Liệu Thời Không**

- Hồi chiêu: 90 / 75 / 60s • Mana: 100 / 100 / 100
- Nhắm: Chỉ định mục tiêu (unit) • Mục đích AI: logic riêng của tướng
- Khóa một kẻ địch trong 16 đv (hoặc chính mình): sau 0.5s, mục tiêu bị cưỡng chế dịch chuyển về đúng vị trí và lượng Máu / Hộ Giáp của 3.5s trước — kẻ vừa uống bình hay vừa đu dây trốn bị giật về họng súng; dùng lên bản thân là mạng bảo hiểm.
- Công thức trong mã: `100 + 20×cấp + 0.4×SMPT`
- Mã nguồn: `src/data/heroes/caelus.js:118`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Thu Thập Dữ Liệu | Tích Điểm Xác Suất nhanh hơn 50%. |
| 1 | b | Bước Nhảy Không Gian | +10% tốc chạy. (+10% Tốc chạy) |
| 1 | c | Máy Quét Rác Thải | +30% tầm nhìn. (+0.3 visPct) |
| 3 | a | Lưới Điện Cường Hóa | Ma Trận rộng 6 đv. |
| 3 | b | Tia Laser Phản Xạ | +15% sát thương phép. (+15% Công Phép %) |
| 3 | c | Gia Cố Hộ Giáp | Phản Xạ Lượng Tử chuyển 65% sát thương chặn được thành Hộ Giáp. |
| 6 | a | Khóa Nghịch Đảo | Kẻ bị tua ngược cấm lướt / dây móc 2.5s. |
| 6 | b | Phân Tích Điểm Yếu | +15% sát thương lên kẻ có vũ khí cấp cao hơn. |
| 6 | c | Tường Lửa Lượng Tử | Khiên Phản Xạ chắn cả hai bên sườn. |
| 9 | a | Laser Bào Mòn | Tia Phân Rã bỏ qua 80% Hộ Giáp. |
| 9 | b | Dữ Liệu Vòng Bo | Nhận ít hơn 30% sát thương bo. (+0.3 zoneRed) |
| 9 | c | Khởi Động Lại Hệ Thống | Dưới 20% máu: tự tua ngược bản thân (120s). |
| 12 | a | Kiến Trúc Sư Tuyệt Đối | Phong cách: Ma Trận hồi nhanh hơn 40%. (+10% Giảm hồi chiêu) |
| 12 | b | Vòng Lặp Vô Tận | Phong cách: hạ gục tướng bằng Tia Phân Rã hoặc chiêu cuối làm mới mọi hồi chiêu. |
| 12 | c | Tối Ưu Năng Lượng | +25% hồi năng lượng, −10% hồi chiêu. (+10% Giảm hồi chiêu) |

**Lối build gợi ý (AI dùng)**
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Tiên Tri Vòng Bo, Hồn Thiên Nhãn Xuyên Giới, Hồn Radar Tàn Tích

<a id="vector"></a>
### Dr. Vector

**Định danh**
- id: `vector` • màu chủ đạo: `#40e0ff` • vũ khí/hình ảnh: `laser` • bán kính va chạm: 0.58 đv
- Vai trò: Xạ thủ (Marksman) • vị trí: Xạ thủ (đường dưới) • nhãn: gun, reveal
- Tầm xa • sát thương chính: vật lý • tài nguyên: mana
- Đạn đánh thường: kiểu `laser`, tốc độ 140 đv/s
- Dùng **súng & băng đạn**: đánh thường tốn đạn, hết đạn phải nạp (xem nội tại).
- Tính cách AI: 📐 Cầu Toàn — Phải lên đúng bộ sở trường: luôn theo lối build số 1, không đổi món theo đối thủ; chỉ gắn mảnh hồn yêu thích / hợp build, săn và đổi chác cho bằng đủ bộ; chưa đủ bộ thì ngại đánh lớn. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: thù: Luca, Alice, Mirage, Dahlia

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1332 | 206.4 | 2983.2 | 4840.8 |
| Máu (gốc trong dữ liệu) | 555 | 86 | 1243 | 2017 |
| Mana | 330 | 42 | 666 | 1044 |
| Hồi mana/s (thực tế, ×1.6) | 2.56 | 0.13 | 3.58 | 4.74 |
| SMVL | 54 | 3.2 | 79.6 | 108.4 |
| Giáp | 26 | 3.8 | 56.4 | 90.6 |
| Kháng phép | 30 | 1.3 | 40.4 | 52.1 |
| Tốc đánh | 0.62 | +2.5% | 0.74 | 0.88 |
| Tốc chạy | 3.3 | — | 3.3 | 3.3 |
| Tầm đánh | 8 | — | 8 | 8 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Laser Gun • Tính Toán Tuyệt Đối**

Đánh thường là tia laser bắn tức thời, xuyên mọi mục tiêu thẳng hàng (mục tiêu sau nhận 65%). Ổ 8 viên, cạn đạn nạp 1.8s. Sẵn 40% chí mạng, 20% xuyên giáp và 25% Xuyên Thủng Hộ Giáp.
- Mã nguồn: `src/data/heroes/vector.js:16`

**S1 — Nạp Năng Lượng Tái Kích**

- Hồi chiêu: 8 / 7.5 / 7 / 6.5 / 6s • Mana: 40 / 40 / 40 / 40 / 40
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 9 đv • Mục đích AI: dồn sát thương
- Nạp đầy 8 viên ngay lập tức. 3 phát kế tiếp +35% sát thương, xuyên thấu không suy hao; phát thứ 3 chắc chắn chí mạng.
- Mã nguồn: `src/data/heroes/vector.js:48`

**S2 — Radar Quét Tọa Độ**

- Hồi chiêu: 13 / 12 / 11 / 10 / 9s • Mana: 50 / 50 / 50 / 50 / 50
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Giáp ảo 15% máu tối đa + 120 trong 3.5s, +30% tốc chạy 2.5s. Xung radar 16 đv: lộ mọi kẻ tàng hình 5s; ảo ảnh / phân thân địch trong vùng bị đóng băng 3s. Tầm đánh tăng lên 10/12/12/14/16 đv trong 5s.
- Mã nguồn: `src/data/heroes/vector.js:54`

**S3 — Bom Từ Tính Khóa Trọng Lực**

- Hồi chiêu: 11 / 10 / 9.5 / 9 / 8.5s • Mana: 55 / 55 / 55 / 55 / 55
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 8 đv • Trễ nổ: 0.35s • Đạn định hướng (né được) • Mục đích AI: khống chế
- Ném lựu đạn từ tính 8 đv, nổ bán kính 2.5: sát thương vật lý, choáng 1s, nạn nhân nhận thêm 25/30/30/30/50% sát thương từ mọi nguồn 4s. Để lại vực từ trường 3s cấm lướt / dịch chuyển / dây móc.
- Công thức trong mã: `[70/110/150/190/230 theo cấp chiêu] + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/vector.js:78`

**S4 — Pháo Laser Quét Hư Không**

- Hồi chiêu: 85 / 70 / 55s • Mana: 100 / 100 / 100 • Thi triển: 0.15s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 15 đv • Trễ nổ: 0.6s • Đạn định hướng (né được) • Mục đích AI: chiêu cuối
- Ghim chân tụ lực 0.6s rồi bắn chùm laser dài 16 đv rộng 2 đv xuyên địa hình: sát thương vật lý cực lớn (350/520/700 + 130% Công Vật Lý), bỏ qua 50% giáp, thiêu 300 Hộ Giáp. Mục tiêu dính Dấu Ấn Từ Tính: nổ thêm sát thương chuẩn và chậm 60% 2s.
- Công thức trong mã: `[350/520/700 theo cấp chiêu] + 1.3×SMVL`
- Mã nguồn: `src/data/heroes/vector.js:94`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Tụ Quang Thần Tốc | Nạp đạn 1.2s. |
| 1 | b | Chí Mạng Tuyệt Đối | Chí mạng gốc 55%. |
| 1 | c | Gia Tốc Radar | Radar cho +50% tốc chạy. |
| 3 | a | Vực Từ Mở Rộng | Vực từ trường tồn tại 4.5s. |
| 3 | b | Xung Điện Phản Hồi | Giáp ảo của Radar vỡ: làm mù kẻ địch trong 3 đv 1s. |
| 3 | c | Tia Laser Tăng Cường | Nạp Năng Lượng cường hóa 4 phát. |
| 6 | a | Triệt Tiêu Phân Thân | Radar kích nổ tiêu diệt ngay ảo ảnh địch (không để lại hiệu ứng). |
| 6 | b | Xuyên Thấu Hoàn Hảo | Tia xuyên chỉ suy hao 15%. |
| 6 | c | Laser Hút Năng Lượng | Phát chí mạng hồi 15 Mana. |
| 9 | a | Hyper-Beam Thần Tốc | Chiêu cuối tụ lực 0.3s. |
| 9 | b | Đầu Đạn Lượng Tử | Phát cường hóa của Nạp Năng Lượng xuyên 100% Hộ Giáp. |
| 9 | c | Khóa Cứng Từ Tính | Vực từ trường làm chậm thêm 40%. |
| 12 | a | Giám Sát Tuyệt Đối | Phong cách: chiêu cuối bắn 3 chùm song song; hạ tướng bằng chiêu cuối làm mới Nạp Năng Lượng và Bom Từ Tính. |
| 12 | b | Pháo Đài Siêu Cự Ly | Phong cách: Radar đẩy tầm đánh lên 18 đv; phát trúng từ xa hơn 10 đv chắc chắn chí mạng. |
| 12 | c | Kỹ Sư Viện Hàn Lâm | +12% Công Vật Lý, +10% tốc đánh. (+12% Công Vật Lý %, +10% Tốc đánh) |

**Lối build gợi ý (AI dùng)**
- Xạ Thủ Súng: giày Giày Cuồng Chiến → Cung Thần Phong → Đao Phá Quân → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Chí Mạng: giày Giày Cuồng Chiến → Đao Phá Quân → Cung Gió Lốc → Kiếm Bão Táp → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Xả Chiêu Tiếp Đạn, Hồn Xuyên Cực Vạn Dặm, Hồn Đầu Đạn Phá Giáp

<a id="elara"></a>
### Elara

**Định danh**
- id: `elara` • màu chủ đạo: `#7ad67a` • vũ khí/hình ảnh: `bow` • bán kính va chạm: 0.6 đv
- Vai trò: Xạ thủ (Marksman) • vị trí: Xạ thủ (đường dưới) • nhãn: autos, poke
- Tầm xa • sát thương chính: vật lý • tài nguyên: mana
- Đạn đánh thường: kiểu `arrow`, tốc độ 22 đv/s
- Tính cách AI: 🪨 Lì Lợm — Giữ mình, chịu đòn, cuối trận núp kỹ, ít đi săn. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh cuối trận · Cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1344 | 211.2 | 3033.6 | 4934.4 |
| Máu (gốc trong dữ liệu) | 560 | 88 | 1264 | 2056 |
| Mana | 320 | 40 | 640 | 1000 |
| Hồi mana/s (thực tế, ×1.6) | 2.56 | 0.13 | 3.58 | 4.74 |
| SMVL | 54 | 3.6 | 82.8 | 115.2 |
| Giáp | 26 | 3.8 | 56.4 | 90.6 |
| Kháng phép | 30 | 1.3 | 40.4 | 52.1 |
| Tốc đánh | 0.65 | +3% | 0.81 | 0.98 |
| Tốc chạy | 3.3 | — | 3.3 | 3.3 |
| Tầm đánh | 6.2 | — | 6.2 | 6.2 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Linh Hoạt**

+20% tốc chạy khi đang lùi xa khỏi địch. 5s không tấn công thì đòn kế tiếp được Tập Trung: +25% sát thương, tên bay nhanh hơn.
- Mã nguồn: `src/data/heroes/elara.js:9`

**S1 — Liên Xạ**

- Hồi chiêu: 7 / 6.5 / 6 / 5.5 / 5s • Mana: 40 / 40 / 40 / 40 / 40
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 6.3 đv • Mục đích AI: dồn sát thương
- Bắn 3 mũi tên liên tiếp vào mục tiêu, mỗi mũi 50% sát thương đánh thường + 15/25/35/45./55
- Mã nguồn: `src/data/heroes/elara.js:26`

**S2 — Kéo Căng Dây**

- Hồi chiêu: 12 / 11 / 10 / 9 / 8s • Mana: 60 / 60 / 60 / 60 / 60 • Thi triển: động (theo trạng thái) (vừa đi vừa thi triển)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 11 đv • Tốc đạn/lướt: 24 đv/s • Mục đích AI: cấu rỉa
- Tích tối đa 1.5s (đi chậm 50%), bắn mũi tên xuyên thấu bay 12 đv. Sát thương 50% → 100% theo thời gian tích.
- Công thức trong mã: `[80/125/170/215/260 theo cấp chiêu] + 0.9×SMVL`
- Mã nguồn: `src/data/heroes/elara.js:45`

**S3 — Sao Băng Lùi**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Mana: 50 / 50 / 50 / 50 / 50
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 3.5 đv • Mục đích AI: thoát thân
- Nhảy lùi 3.5 đv rồi bắn 3 sao băng hình nón, làm chậm 40% 1.5s.
- Công thức trong mã: `[30/50/70/90/110 theo cấp chiêu] + 0.3×SMVL`
- Mã nguồn: `src/data/heroes/elara.js:63`

**S4 — Thần Tiễn Phá Không**

- Hồi chiêu: 100 / 85 / 70s • Mana: 100 / 100 / 100 • Thi triển: 0.25s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 30 đv • Tốc đạn/lướt: 20 đv/s • Chỉ nhắm tướng • Mục đích AI: chiêu cuối
- Mũi tên khổng lồ bay hết bản đồ, trúng tướng địch đầu tiên: choáng 0.5–1.5s theo quãng bay.
- Công thức trong mã: `[200/300/400 theo cấp chiêu] + 1.0×SMVL`
- Mã nguồn: `src/data/heroes/elara.js:104`

**Skill phụ — Tên Hình Nón**

- Hồi chiêu: 10s • Mana: 30
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 2.6 đv • Mục đích AI: khống chế
- Bắn 3 mũi tên tỏa hình nón (3.4 đv): mỗi mũi 30 (+6/cấp, +35% SMVL) sát thương và đẩy lùi kẻ áp sát 1.6 đv — tạo khoảng trống để kéo cung.
- Công thức trong mã: `30 + 6×cấp + 0.35×SMVL`
- Mã nguồn: `src/data/heroes/elara.js:91`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Bộ Pháp Tinh Linh | Tốc chạy khi lùi xa khỏi địch tăng lên +35% (thay vì +20%). |
| 1 | b | Ưng Nhãn | +0.6 tầm bắn; Kéo Căng Dây bay xa hơn 15%. (+0.6 Tầm đánh) |
| 1 | c | Liên Xạ Thần Tốc | Liên Xạ (S1) bắn 4 mũi tên (thay vì 3). |
| 3 | a | Băng Vĩnh Cửu | Sao băng của Sao Băng Lùi (S3) làm chậm 60% trong 2s. |
| 3 | b | Mũi Tên Xuyên Phá | Kéo Căng Dây bay xuyên tường và không giảm sát thương lên lính. |
| 3 | c | Thuận Phong | Sao Băng Lùi lập tức hồi lại Liên Xạ. |
| 6 | a | Mưa Băng Rải Thảm | Sao Băng Lùi thay 3 sao băng bằng vùng mưa băng bán kính 3 tại chỗ cũ: làm chậm 50% liên tục 2.5s. |
| 6 | b | Tiễn Trùng Khí | Sau Liên Xạ, trong 2s dùng lại: mũi tên xé gió (100% SMVL) đẩy lùi 2 đv. |
| 6 | c | Cung Pháp Du Mục | Tích Kéo Căng Dây không còn bị chậm. |
| 9 | a | Tập Trung Tuyệt Đối | Đòn Tập Trung sẵn sàng sau 3s không tấn công (thay vì 5s) và gây +40% (thay vì +25%). |
| 9 | b | Băng Phong Toàn Vực | Thần Tiễn xuyên qua tướng đầu tiên: mọi tướng phía sau bị trói chân + câm lặng 1s (50% sát thương). |
| 9 | c | Cung Thủ Tối Thượng | Luôn ở trạng thái Tập Trung: mọi đòn đánh +15%. |
| 12 | a | Mũi Tên Hư Không | Kéo Căng Dây tích tối đa: mũi tên hút kẻ địch trong 2.5 đv quanh đường bay về phía nó. |
| 12 | b | Cung Thủ Thần Tốc | −1 tầm bắn, +30% tốc đánh; Liên Xạ xả liên thanh 5 mũi. (-1 Tầm đánh, +30% Tốc đánh) |
| 12 | c | Cảm Ứng Rừng Già | Phát hiện tướng địch tàng hình hoặc trong bụi trong 7 đv quanh Elara (cả đội cùng thấy). |

**Lối build gợi ý (AI dùng)**
- Chí Mạng: giày Giày Cuồng Chiến → Đao Phá Quân → Cung Gió Lốc → Kiếm Bão Táp → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Tốc Đánh: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Cung Thần Phong → Dao Cắt Gân → Cung Gió Lốc → Huyết Kiếm Đoạt Mệnh
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Xạ Thủ Xuyên Vân, Hồn Tuyệt Đích Bất Suy, Hồn Định Vị Thiện Xạ

<a id="florian"></a>
### Florian

**Định danh**
- id: `florian` • màu chủ đạo: `#e0e0ff` • vũ khí/hình ảnh: `rapier` • bán kính va chạm: 0.6 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đường trên, Đường giữa • nhãn: dive
- Cận chiến • sát thương chính: vật lý • tài nguyên: mana
- Tính cách AI: 🎯 Kẻ Trảm Tướng — Săn kẻ dẫn đầu số mạng, kẻ cầm vũ khí Đỏ hay kẻ đang có bùa boss; bỏ qua kẻ yếu. • Phong cách đánh: ⚔ Xông xáo — Đánh tới khi còn khoảng 10% máu mà thấy không thắng nổi mới chạy.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1416 | 220.8 | 3182.4 | 5169.6 |
| Máu (gốc trong dữ liệu) | 590 | 92 | 1326 | 2154 |
| Mana | 300 | 38 | 604 | 946 |
| Hồi mana/s (thực tế, ×1.6) | 2.4 | 0.13 | 3.42 | 4.58 |
| SMVL | 60 | 3.6 | 88.8 | 121.2 |
| Giáp | 29 | 3.8 | 59.4 | 93.6 |
| Kháng phép | 32 | 1.8 | 46.4 | 62.6 |
| Tốc đánh | 0.7 | +2.8% | 0.86 | 1.03 |
| Tốc chạy | 3.55 | — | 3.55 | 3.55 |
| Tầm đánh | 1.75 | — | 1.75 | 1.75 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Đâm Lao & Tứ Ấn**

Cứ 3.5s, đòn đánh thường kế tiếp thành cú Đâm Lao lướt tới mục tiêu (tới 3.5 đv ngoài tầm), +20 (+4/cấp, +30% SMVL) sát thương — mục tiêu có ấn thì tự khóa lao vào ẤN CHƯA VỠ GẦN NHẤT; chạm mũi kiếm xong lướt nhỏ 1 đv đổi góc. Đánh trúng từ ĐÚNG GÓC PHẦN TƯ của ấn để phá — MỖI ẤN: −1.5s mọi hồi chiêu, chậm 60% 1s, làm mới ngay Đâm Lao, 5% máu tối đa sát thương chuẩn, Florian hồi 0.5% máu. MỐC 2/4: choáng 0.25s, hồi 2.5% máu. MỐC 4/4: thêm 25% máu tối đa sát thương chuẩn, hồi 5% máu, đòn kế tiếp trong 3s +40% sát thương và đẩy lùi 3 đv.

- Công thức trong mã: `30 + 6×cấp + 0.5×SMVL` • `40 + 8×cấp + 0.6×SMVL` • `u.ws.formDmg || 100 + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/florian.js:98`

**S1 — Tứ Ấn**

- Hồi chiêu: 7 / 6.5 / 6 / 5.5 / 5s • Mana: 50 / 50 / 50 / 50 / 50 • Thi triển: 0.15s • Hồi chiêu bắt đầu do chiêu tự tính (ví dụ sau khi kết thúc trạng thái)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.6 đv • Tốc đạn/lướt: 20 đv/s • Đạn định hướng (né được) • Mục đích AI: khống chế
- Ném dấu ấn 7 đv: trúng kẻ địch đầu tiên thì gây sát thương và đặt 4 ấn Đông–Tây–Nam–Bắc trong 5s. Chỉ hồi chiêu khi ấn đã hết; ném trượt thì hồi chiêu giảm 50%.
- Công thức trong mã: `[40/60/80/100/120 theo cấp chiêu] + 0.5×SMVL` • `u.ws.formDmg || 100 + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/florian.js:158`

**S2 — Phân Ảnh**

- Hồi chiêu: 7 / 6.5 / 6 / 5.5 / 5s • Mana: 40 / 40 / 40 / 40 / 40 • Thi triển: 0.12s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 7.5 đv • Mục đích AI: dồn sát thương
- Sinh Phân Ảnh ở phía ĐỐI DIỆN Florian qua tâm mục tiêu, cách Florian 8 đv; đứng khựng 0.25s rồi lao ngược hết tốc lực về chỗ Florian, gây sát thương vật lý mọi kẻ trên đường. Cú lao mang đặc tính Đâm Lao: chạm mục tiêu từ góc có ấn chưa vỡ thì PHÁ ẤN ĐÓ từ phía đối diện (gọng kìm phá 2 ấn cùng lúc). Đang Kiếm Thế: Florian dịch chuyển ra sau lưng mục tiêu rồi lao xuyên qua.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.6×SMVL` • `u.ws.formDmg || 100 + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/florian.js:181`

**S3 — Thế Thủ**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Mana: 40 / 40 / 40 / 40 / 40
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 5 đv • Mục đích AI: phòng thủ
- Vào thế thủ 1s, đỡ mọi sát thương và khống chế. Bị tấn công: phản đòn gây sát thương và CHOÁNG kẻ tấn công 1s (cận chiến bị đẩy lùi). Không ai tấn công: hoàn 25% hồi chiêu.
- Mã nguồn: `src/data/heroes/florian.js:211`

**S4 — Kiếm Thế Tứ Ấn**

- Hồi chiêu: 90 / 75 / 60s • Mana: 100 / 100 / 100 • Thi triển: 0.1s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 5 đv • Chỉ nhắm tướng • Mục đích AI: chiêu cuối
- Trong 4s: đặt 4 ấn lên một tướng trong 5 đv; mỗi lần phá trọn 4/4 ấn được đặt lại sau 0.35s và Florian tung ngay nhát đâm XUYÊN THỦNG 10 đv (xuyên tường, 100/160/220 +70% SMVL sát thương chuẩn). Phân Ảnh thành dịch chuyển ra sau địch rồi lao; Đâm Lao kèm phân ảnh lao từ phía sau.
- Mã nguồn: `src/data/heroes/florian.js:246`

**Skill phụ — Lướt**

- Hồi chiêu: 0.15s • Có điều kiện dùng riêng (xem mô tả)
- Mục đích AI: logic riêng của tướng
- KHÔNG hồi chiêu — chỉ dùng được trong 1.5s sau một cú Đâm Lao hoặc sau bất kỳ chiêu nào. Lướt nhanh 2.4 đv theo hướng chọn, MIỄN NHIỄM mọi sát thương & khống chế khi lướt: bẻ góc 90° sang mặt ấn kế tiếp hoặc né chiêu định hướng.
- Mã nguồn: `src/data/heroes/florian.js:223`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Vũ Bước | Đâm Lao lao xa hơn 25%; Lướt xa hơn (3 đv). |
| 1 | b | Điệu Nhảy Chuẩn Xác | Phá ấn: +25% tốc chạy 2s. |
| 1 | c | Khai Màn Thanh Lịch | Thế Thủ đỡ thành công lập tức hồi lại Lướt và Đâm Lao. |
| 3 | a | Hư Ảnh Trùng Điệp | Phân Ảnh phát nổ khi biến mất (bán kính 2, 50% sát thương, đẩy lùi 1 đv). |
| 3 | b | Tử Huyệt | Phá ấn gây thêm Chảy Máu 1% máu tối đa/giây trong 3s. |
| 3 | c | Điệu Nhạc Bất Tử | Phá trọn 4/4 ấn: miễn sát thương 1s. |
| 6 | a | Đột Kích Hồi Mã | Thế Thủ đỡ được đòn: lướt đâm xuyên qua kẻ tấn công ra sau lưng nó. |
| 6 | b | Vũ Điệu Lốc Xoáy | Tứ Ấn thành đâm xoay tại chỗ (2.6 đv): hút nhẹ, đặt ấn lên mọi tướng trúng và phá ngay 2 ấn gần nhất. |
| 6 | c | Nhịp Điệu Hoàn Hảo | Đâm Lao không thể bị chọn khi lao; trúng mục tiêu có ấn thì phá thêm 1 ấn. |
| 9 | a | Cao Trào Sân Khấu | Kiếm Thế Tứ Ấn kéo dài 6s (thay vì 4s). |
| 9 | b | Phản Đòn Hoàn Mỹ | Thế Thủ đỡ thành công: choáng 1.5s mọi tướng địch trong 3 đv. |
| 9 | c | Vũ Điệu Tử Thần | Đòn cường hóa sau khi phá ấn đẩy xa hơn 40% và gây thêm 50% sát thương chuẩn. |
| 12 | a | Sân Khấu Tử Thần | Phá ấn (3/4): mục tiêu bị lộ diện và chậm 40% 3s; Tứ Ấn hồi ngay. |
| 12 | b | Song Kiếm Quý Tộc | Rút thêm kiếm phụ: đánh thường thêm nhát đâm thứ hai (+35% sát thương), Phân Ảnh tung thêm một phân ảnh lệch góc; mất Thế Thủ — S3 thành lướt tự do 4 đv. |
| 12 | c | Khúc Cao Trào Cuối Cùng | Phá ấn (3/4): hồi ngay mọi chiêu thường (trừ chiêu cuối). |

**Lối build gợi ý (AI dùng)**
- Đơn Đấu: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Sát Thủ: giày Giày Đinh Gỉ → Dao Ám Ảnh → Kiếm Bão Táp → Dao Tử Thần → Mũi Khoan Thép → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Phi Thân Trảm Kích, Hồn Liên Hoàn Trảm, Hồn Vũ Điệu Tử Thần

<a id="galo"></a>
### Galo

**Định danh**
- id: `galo` • màu chủ đạo: `#7ae04a` • vũ khí/hình ảnh: `flask` • bán kính va chạm: 0.62 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đi rừng, Đường trên • nhãn: poke
- Tầm xa • sát thương chính: phép • tài nguyên: không dùng mana
- Đạn đánh thường: kiểu `fire`, tốc độ 16 đv/s
- Tính cách AI: 🌪 Bóng Ma Rìa Bão — Tích bình và phù kháng độc; đi sát mép bão sau lưng mọi người; đâm kẻ vừa vào được vùng an toàn và đang uống bình. • Phong cách đánh: 🎯 Đứng bắn — Đánh tầm xa nhưng ít di chuyển, không cố thả diều.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1356 | 211.2 | 3045.6 | 4946.4 |
| Máu (gốc trong dữ liệu) | 565 | 88 | 1269 | 2061 |
| SMVL | 55 | 3.2 | 80.6 | 109.4 |
| Giáp | 28 | 3.8 | 58.4 | 92.6 |
| Kháng phép | 30 | 1.6 | 42.8 | 57.2 |
| Tốc đánh | 0.66 | +2.2% | 0.78 | 0.91 |
| Tốc chạy | 3.5 | — | 3.5 | 3.5 |
| Tầm đánh | 4.5 | — | 4.5 | 4.5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Độc Tiêu Xương**

Đòn độc găm tầng Tiêu Xương (tối đa 6, 4s): mỗi tầng −4% giáp và kháng phép, kèm độc nhẹ. Dạng Người: đánh tầm xa, chiêu tốn 3–5% máu hiện tại. Dạng Quái Thú (skill phụ): cận chiến, chiêu không tốn máu.
- Mã nguồn: `src/data/heroes/galo.js:29`

**S1 — Ném Lọ Độc / Song Trảo**

- Hồi chiêu: 5 / 5 / 5 / 5 / 5s • Thi triển: 0.15s • Hồi chiêu bắt đầu do chiêu tự tính (ví dụ sau khi kết thúc trạng thái)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.5 đv • Trễ nổ: 0.4s • Mục đích AI: cấu rỉa
- Người: ném lọ độc tới điểm trong 7 đv, nổ bán kính 1.8, găm 2 tầng (4% máu; HC 5s). Thú: 2 nhát cào trước mặt, mỗi nhát 1 tầng (HC 3s).
- Công thức trong mã: `[35/55/75/95/115 theo cấp chiêu] + 0.4×SMVL + 0.3×SMPT` • `[60/90/120/150/180 theo cấp chiêu] + 0.5×SMPT`
- Mã nguồn: `src/data/heroes/galo.js:58`

**S2 — Bom Khí Ngạt / Ngoạm Cắn**

- Hồi chiêu: 10 / 10 / 10 / 10 / 10s • Thi triển: 0.12s • Hồi chiêu bắt đầu do chiêu tự tính (ví dụ sau khi kết thúc trạng thái)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 4.5 đv • Mục đích AI: dồn sát thương
- Người: vũng khí độc bán kính 2.5 trong 3s — chậm 30%, mù (3% máu; HC 10s). Thú: lao 4 đv ngoạm; mục tiêu đủ tầng tối đa thì ×1.6 sát thương và tiêu hết tầng (HC 7s).
- Công thức trong mã: `[70/105/140/175/210 theo cấp chiêu] + 0.3×SMVL + 0.6×SMPT` • `[12/18/24/30/36 theo cấp chiêu] + 0.1×SMPT`
- Mã nguồn: `src/data/heroes/galo.js:82`

**S3 — Nhảy Lùi Thoát Hiểm / Hống Xung Phong**

- Hồi chiêu: 12 / 12 / 12 / 12 / 12s • Hồi chiêu bắt đầu do chiêu tự tính (ví dụ sau khi kết thúc trạng thái)
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 3.8 đv • Mục đích AI: dồn sát thương
- Người: bật nhảy lùi 4 đv, xả khói độc che mắt (mù) tại chỗ cũ và +25% tốc chạy 2s (HC 12s). Thú: gầm CHOÁNG 0.5s kẻ trước mặt rồi phi thân vồ tới trong cự ly 4 đv (HC 9s).
- Công thức trong mã: `[40/65/90/115/140 theo cấp chiêu] + 0.3×SMVL + 0.4×SMPT`
- Mã nguồn: `src/data/heroes/galo.js:114`

**S4 — Đại Dịch / Thợ Săn Tối Thượng**

- Hồi chiêu: 120 / 100 / 80s • Thi triển: 0.2s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 8 đv • Bán kính vùng: 6 đv • Mục đích AI: chiêu cuối
- Người: sương độc bán kính 6 tại điểm trong 8 đv suốt 6s — kẻ địch bên trong lập tức đủ tầng tối đa, chậm 20%. Thú: 8s +40% tốc chạy, cú cắn kết liễu tướng dưới 15% máu.
- Công thức trong mã: `[150/250/350 theo cấp chiêu] + 0.7×SMPT` • `[20/30/40 theo cấp chiêu] + 0.12×SMPT`
- Mã nguồn: `src/data/heroes/galo.js:156`

**Skill phụ — Quá Liều! / Tiếng Hú Tử Thần**

- Hồi chiêu: 40s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 5 đv • Mục đích AI: dồn sát thương
- Người: uống cạn bình độc hóa Quái Thú 15s — cận chiến, +15 giáp/kháng phép, +SMVL, +8% tốc chạy, lá chắn 100 (+20/cấp), chiêu không tốn máu và đổi bộ S1–S3; hết dạng: Vã Thuốc (chậm 30% 2s), hồi 40s. Thú: Tiếng Hú Tử Thần — sóng âm CHOÁNG diện rộng 1s (bán kính 3.5) và 40 (+10/cấp, +40% SMPT) sát thương phép (hồi 12s).
- Công thức trong mã: `40 + 10×cấp + 0.4×SMPT`
- Mã nguồn: `src/data/heroes/galo.js:137`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Độc Ăn Da | Sát thương độc mỗi tầng +35%. |
| 1 | b | Thú Tính Bền Bỉ | Dạng Quái Thú kéo dài 20s (thay vì 15s). |
| 1 | c | Bước Chân Hóa Chất | Dạng Thú để lại vệt axit làm chậm 25% kẻ đi qua. |
| 3 | a | Sương Độc Thần Kinh | Bom Khí Ngạt câm lặng tướng lần đầu bước vào 1s. |
| 3 | b | Hàm Răng Bạo Lực | Ngoạm Cắn phá mọi lá chắn. |
| 3 | c | Giảm Sốc Độc Tố | Không còn bị Vã Thuốc khi trở lại dạng Người. |
| 6 | a | Quăng Quật | Ngoạm Cắn trúng tướng: trong 2s dùng lại để tóm đập xuống, choáng 1s. |
| 6 | b | Phun Axit | Ném Lọ Độc thành phun axit hình nón 4 đv: quét sạch đạn phía trước, găm 2 tầng. |
| 6 | c | Hấp Thu Độc Chất | Đứng trong vũng khí độc của mình hồi 2% máu tối đa mỗi giây. |
| 9 | a | Axit Hóa Lỏng Xương | Tiêu Xương tối đa 10 tầng (giảm tới 40% giáp/kháng phép). |
| 9 | b | Tiếng Rống Tận Diệt | Hống Xung Phong hất bay đạn xung quanh và choáng 1.25s (thay vì làm chậm). |
| 9 | c | Bản Năng Bất Tử | Dạng Thú nhận đòn chí tử: sống lại 1 máu kèm lá chắn 200 (+20/cấp), 1 lần mỗi mạng. |
| 12 | a | Chimera Bất Hoại | Kẹt vĩnh viễn ở dạng Quái Thú (giữ trí khôn); Quá Liều thành phun axit hình nón 4 đv (HC 12s). |
| 12 | b | Nổ Axit Hạt Nhân | Đại Dịch (dạng Người) thay bằng tự nổ: đẩy lùi 2.5 đv bán kính 4, găm đủ tầng, để lại bãi axit 15s. |
| 12 | c | Cuồng Huyết Độc Dược | Hạ gục tướng đang trúng độc: giảm 40s hồi chiêu S4. |

**Lối build gợi ý (AI dùng)**
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Tiên Tri Vòng Bo, Hồn Radar Tàn Tích, Hồn Nguyệt Thực Hắc Ám

<a id="gideon"></a>
### Gideon

**Định danh**
- id: `gideon` • màu chủ đạo: `#ffd24a` • vũ khí/hình ảnh: `greatsword` • bán kính va chạm: 0.75 đv
- Vai trò: Đỡ đòn (Tank) • vị trí: Đường trên, Đi rừng • nhãn: cc, tank
- Cận chiến • sát thương chính: vật lý • tài nguyên: mana
- Tốc đánh cố định: % tốc đánh cộng thêm được quy đổi thành % sát thương đòn đánh.
- Kháng đẩy lùi: có.
- Tính cách AI: 🏰 Lãnh Chúa Cứ Điểm — Chiếm công trình vững gần tâm bo, đặt bẫy ở lối vào, không rời đi tới khi bo ép; ai bước vào 15 đv là dồn hỏa lực. • Phong cách đánh: ⚔ Xông xáo — Đánh tới khi còn khoảng 10% máu mà thấy không thắng nổi mới chạy.
- Giai đoạn mạnh: Mạnh giữa trận · Ít cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1380 | 235.2 | 3261.6 | 5378.4 |
| Máu (gốc trong dữ liệu) | 575 | 98 | 1359 | 2241 |
| Mana | 300 | 40 | 620 | 980 |
| Hồi mana/s (thực tế, ×1.6) | 2.24 | 0.13 | 3.26 | 4.42 |
| SMVL | 58 | 3.6 | 86.8 | 119.2 |
| Giáp | 34 | 3.6 | 62.8 | 95.2 |
| Kháng phép | 32 | 2 | 48 | 66 |
| Tốc đánh | 0.66 | +2% | 0.77 | 0.88 |
| Tốc chạy | 3.4 | — | 3.4 | 3.4 |
| Tầm đánh | 2.7 | — | 2.7 | 2.7 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Điểm Ngọt & Đại Trường Kiếm**

Đại Trường Kiếm: tầm đánh 2.7 đv; tốc đánh CỐ ĐỊNH — mọi % tốc đánh cộng thêm (cấp, đồ, mảnh hồn, bùa) chuyển thành % sát thương đòn đánh. Điểm Ngọt: trúng bằng mũi kiếm (30% ngoài cùng tầm) +30% sát thương và làm chậm 20%; trúng bằng cán (sát thân) −30%. Kháng đẩy: bị đẩy lùi / kéo ngắn hơn 30%.
- Mã nguồn: `src/data/heroes/gideon.js:30`

**S1 — Quét Ngang**

- Hồi chiêu: 7 / 6.5 / 6 / 5.5 / 5s • Mana: 45 / 45 / 45 / 45 / 45 • Thi triển: 0.05s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 3.1 đv • Mục đích AI: dồn sát thương
- Gồng 0.5/0.5/0.5/0.75/1s (dùng lại để vung sớm): giảm 40% sát thương nhận vào, miễn choáng, hấp thụ đòn đánh để tăng tới 10/20/25/30/40% sát thương. Rồi chém vòng cung 180° phía trước. Điểm Ngọt áp dụng.
- Công thức trong mã: `[55/90/125/160/195 theo cấp chiêu] + 0.75×SMVL`
- Mã nguồn: `src/data/heroes/gideon.js:48`

**S2 — Bổ Dọc**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Mana: 55 / 55 / 55 / 55 / 55 • Thi triển: 0.35s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 5 đv • Mục đích AI: cấu rỉa
- Bổ kiếm theo đường thẳng 5.5 đv, sát thương vật lý nặng. Trúng Điểm Ngọt (chóp mũi kiếm): +30% sát thương và trói chân 0.6/1/1.2/1.4/1.6s.
- Công thức trong mã: `[70/110/150/190/230 theo cấp chiêu] + 0.85×SMVL`
- Mã nguồn: `src/data/heroes/gideon.js:70`

**S3 — Địa Chấn**

- Hồi chiêu: 10 / 10 / 9 / 9 / 8s • Mana: 50 / 50 / 50 / 50 / 50
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 3.5 đv • Mục đích AI: phòng thủ
- Cắm cự kiếm gồng tối đa 1.6s (dùng lại để kích nổ sớm): giảm 40% sát thương, không thể cản phá; vòng cảnh báo lan rộng dần. Kích nổ hất tung mọi kẻ trong vòng — gồng càng lâu và nhận càng nhiều sát thương thì nổ càng đau, hất tung càng lâu; phá ngay 30% Hộ Giáp.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/gideon.js:83`

**S4 — Khai Thiên Lập Địa**

- Hồi chiêu: động (xem mô tả)s • Mana: 100 / 100 / 100 • Thi triển: 0.15s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 12 đv • Bán kính vùng: 5 đv • Mục đích AI: chiêu cuối
- Nhảy vút lên, giáng cự kiếm xuống điểm trong 12/18/24 đv (vòng cảnh báo cực lớn). Tâm chấn (bán kính 6/9/12... thu gọn 3/4/5 đv trong đấu trường): hất tung, sát thương vật lý lớn kèm sát thương chuẩn bỏ qua Giáp và Hộ Giáp. Vùng rìa (gấp đôi bán kính): sát thương lan, làm chậm 40/60/80% 3s.
- Công thức trong mã: `[150/250/350 theo cấp chiêu] + 1.0×SMVL` • `[60/100/140 theo cấp chiêu] + 0.3×SMVL`
- Mã nguồn: `src/data/heroes/gideon.js:120`

**Skill phụ — Cán Kiếm**

- Hồi chiêu: động (xem mô tả)s • Mana: 25 • Thi triển: 0.05s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 1.4 đv • Chỉ nhắm tướng • Mục đích AI: khống chế
- Húc chuôi kiếm vào kẻ địch sát người (tầm 1.9): 30 (+6/cấp, +40% Công Vật Lý) sát thương, choáng 0.4/0.6/0.8s (theo cấp) và đẩy văng ra đúng 2.7 đv — vào thẳng Điểm Ngọt của Bổ Dọc. Hồi 9 → 8/7/6s theo cấp.
- Công thức trong mã: `30 + 6×cấp + 0.4×SMVL`
- Mã nguồn: `src/data/heroes/gideon.js:105`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Mũi Kiếm Chuẩn Xác | Điểm Ngọt +45% sát thương (thay vì +30%). |
| 1 | b | Khúc Trọng Lực | Đòn Điểm Ngọt làm chậm 35% (thay vì 20%). |
| 1 | c | Thiết Thân | +150 Hộ Giáp vĩnh viễn, kháng đẩy 50%. (+150 Hộ Giáp tối đa) |
| 3 | a | Trói Đinh Ngàn Cân | Bổ Dọc trúng Điểm Ngọt khóa lướt và dây móc thêm 1.5s. |
| 3 | b | Húc Văng Cán Kiếm | Cán Kiếm đẩy kẻ địch đập vào tường: choáng 1.5s. |
| 3 | c | Kiên Cố Tuyệt Đối | Đang gồng Quét Ngang hoặc Địa Chấn: hồi 3% máu tối đa mỗi giây. |
| 6 | a | Địa Chấn Bộc Phá | Địa Chấn nổ để lại bãi đá nham nhở làm chậm 40% trong 4s. |
| 6 | b | Khiên Kiếm Đỡ Gạt | Gồng Quét Ngang giảm 60% sát thương nhận vào (thay vì 40%). |
| 6 | c | Thế Nặng Ngàn Cân | Tốc đánh quy đổi sang sát thương ×1.25. |
| 9 | a | Trảm Khí Khai Thiên | Khai Thiên Lập Địa dựng vòng vách đá quanh tâm chấn 3s, nhốt kẻ địch bên trong. |
| 9 | b | Đại Địa Chấn | Sát thương chuẩn của chiêu cuối +30% lên kẻ có Hộ Giáp dày hơn Máu Đỏ. |
| 9 | c | Chém Gãy Thần Binh | Đòn Điểm Ngọt làm gãy vũ khí đối phương: −30% công 3s. |
| 12 | a | Cự Kiếm Xung Trận | Phong cách: chiêu cuối hồi nhanh hơn 30s; đáp xuống làm mới Quét Ngang, Bổ Dọc, Địa Chấn. |
| 12 | b | Trấn Áp Vực Thẳm | Phong cách: mọi đòn trúng phá vĩnh viễn 15% Hộ Giáp tối đa của đối phương. |
| 12 | c | Kiếm Đế Cuồng Nộ | +12% tốc chạy, +20% tốc đánh (quy đổi sát thương). (+12% Tốc chạy, +20% Tốc đánh) |

**Lối build gợi ý (AI dùng)**
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Đỡ Đòn: giày Giày Thép → Vương Miện Bất Khả Xâm Phạm → Giáp Gai → Áo Giáp Dung Nham → Trái Tim Cự Thạch → Áo Choàng Thánh Linh
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Trường Nhận Phong Khí, Hồn Titan Phá Giới, Hồn Vô Ảnh Cực Tốc

<a id="ignatius"></a>
### Ignatius

**Định danh**
- id: `ignatius` • màu chủ đạo: `#ff7a3a` • vũ khí/hình ảnh: `staff` • bán kính va chạm: 0.62 đv
- Vai trò: Pháp sư (Mage) • vị trí: Đường giữa • nhãn: poke
- Tầm xa • sát thương chính: phép • tài nguyên: mana
- Đạn đánh thường: kiểu `fire`, tốc độ 16 đv/s
- Tính cách AI: 🔥 Gieo Rắc Hỗn Loạn — Kích nổ thùng thuốc nổ và bẫy môi trường khi có người đứng gần; ném bom vào giữa đám đông. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1296 | 201.6 | 2908.8 | 4723.2 |
| Máu (gốc trong dữ liệu) | 540 | 84 | 1212 | 1968 |
| Mana | 420 | 50 | 820 | 1270 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 52 | 3 | 76 | 103 |
| Giáp | 22 | 3.6 | 50.8 | 83.2 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.35 | — | 3.35 | 3.35 |
| Tầm đánh | 5.5 | — | 5.5 | 5.5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Hỏa Ấn & Bộc Phá Vô Tận**

Đòn đánh thường gây sát thương phép và găm 1 tầng Hỏa Ấn; chiêu găm thêm tầng. Hỏa Ấn cộng dồn VÔ HẠN: thiêu (7 +2/cấp +0.5 × số tầng) sát thương phép/giây trong 3s. Mỗi khi đủ bội số 6 tầng (6, 12, 18…): Hỏa Bạo nổ bán kính 2.5 và trừ 25% Kháng Phép nạn nhân 4s. Ấn tự tan sau 5s +0.25s/cấp nếu không nhận tầng mới. Vừa đi vừa niệm phép.

- Công thức trong mã: `60 + 18×cấp + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/ignatius.js:42`

**S1 — Cầu Lửa**

- Hồi chiêu: 5.5 / 5 / 4.5 / 4 / 3.5s • Mana: 50 / 55 / 60 / 65 / 70 • Thi triển: 0.2s (vừa đi vừa thi triển)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 10 đv • Tốc đạn/lướt: 22 đv/s • Mục đích AI: cấu rỉa
- Ném cầu lửa cực nhanh tầm 10 đv, nổ lan bán kính 1.8/2.0/2.2/2.2/2.6, găm 2 tầng Hỏa Ấn lên mọi kẻ địch trong vùng.
- Công thức trong mã: `[65/100/135/170/205 theo cấp chiêu] + 0.6×SMPT` • `60 + 18×cấp + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/ignatius.js:49`

**S2 — Đại Hỏa Cầu**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Mana: 70 / 75 / 80 / 85 / 90 • Thi triển: động (theo trạng thái) (vừa đi vừa thi triển)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 14 đv • Tốc đạn/lướt: 16 đv/s • Mục đích AI: dồn sát thương
- Tích tụ tối đa 2s (vẫn đi được, chậm 50%): càng tích càng to, đau và bay xa — tầm 10→20 đv (cấp 1) tới 20→50 đv (cấp tối đa), bán kính nổ 1.8–2.6 lên 3/4/5/6/8 đv, sát thương 80–100% lên 200/225/225/250/300% SMPT; +25% lên mục tiêu dưới 30% máu. Điểm nổ để lại Biển Lửa 4s găm Hỏa Ấn.
- Công thức trong mã: `[60/90/120/150/180 theo cấp chiêu]×(0.6 + 0.4×c) + ap×SMPT` • `60 + 18×cấp + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/ignatius.js:63`

**S3 — Dịch Chuyển**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Mana: 60 / 60 / 60 / 60 / 60 • Tích lũy: động lượt
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 5 đv • Mục đích AI: thoát thân
- Dịch chuyển tức thời 5 đv; điểm đến nổ sóng nhiệt đẩy lùi 1.5 đv, +30% tốc chạy 1s. Tích trữ tối đa 2/2/3/3/4 lần dùng (hồi 1 lần mỗi 14→10s).
- Công thức trong mã: `[40/60/80/100/120 theo cấp chiêu] + 0.3×SMPT` • `60 + 18×cấp + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/ignatius.js:98`

**S4 — Thiên Thạch**

- Hồi chiêu: 110 / 90 / 70s • Mana: 100 / 100 / 100 • Thi triển: 0.25s (vừa đi vừa thi triển)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 20 đv • Bán kính vùng: 8 đv • Trễ nổ: 1.25s • Mục đích AI: chiêu cuối
- Gọi thiên thạch giáng xuống điểm trong 20 đv sau 1s cảnh báo: bán kính 8/10/16 đv (trùm cả ổ boss), sát thương phép 125/150/200% SMPT, hất tung 0.75/1/1.5s và găm ngay 6 tầng Hỏa Ấn (kích nổ nội tại). Để lại biển dung nham 6/8/12s.
- Công thức trong mã: `[150/220/300 theo cấp chiêu] + [1.25/1.5/2 theo cấp chiêu]×SMPT` • `60 + 18×cấp + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/ignatius.js:132`

**Skill phụ — Vòng Lửa**

- Hồi chiêu: 12s • Mana: 40
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 2.6 đv • Mục đích AI: khống chế
- Bùng vòng lửa tự vệ quanh thân (bán kính 3): 30 (+8/cấp, +30% SMPT) sát thương phép, găm Hỏa Ấn, hất tung và đẩy kẻ áp sát văng xa 4 đv +0.3 đv/cấp — tạo khoảng trống an toàn để tích Đại Hỏa Cầu.
- Công thức trong mã: `30 + 8×cấp + 0.3×SMPT` • `60 + 18×cấp + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/ignatius.js:112`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Hỏa Tốc | Cầu Lửa (S1) bay nhanh hơn 40%. |
| 1 | b | Thiêu Rụi | Thiêu Đốt mạnh hơn 25%. |
| 1 | c | Bộ Pháp Chớp Nhoáng | Dịch Chuyển (S3) xa hơn 30%. |
| 3 | a | Biển Lửa Giam Cầm | Vòng Lửa (skill phụ) trói chân thêm 0.75s. |
| 3 | b | Hư Ảnh Cháy Bùng | Vị trí cũ sau khi Dịch Chuyển phát nổ (bán kính 2, sát thương như Dịch Chuyển). |
| 3 | c | Đại Hỏa Cầu Phá Đạn | Đại Hỏa Cầu (S2) thiêu hủy mọi đạn đạo của đối phương bay qua nó. |
| 6 | a | Tường Lửa Chắn Lối | Vòng Lửa (skill phụ) dựng thêm tường lửa dài 6 đv chắn giữa Ignatius và kẻ áp sát trong 4s, thiêu kẻ đứng sát tường. |
| 6 | b | Kích Nổ Cầu Lửa | Dùng lại Cầu Lửa trong 0.6s để nổ ngay giữa đường bay. |
| 6 | c | Hỏa Hồn Bùng Cháy | Kẻ địch đang bị Thiêu Đốt chậm 20%. |
| 9 | a | Hỏa Ngục Bất Diệt | Thiêu Đốt của Hỏa Ấn kéo dài 6s (thay vì 3s). |
| 9 | b | Thiên Thạch Tận Thế | Thiên Thạch rộng hơn 20%; kẻ địch ở tâm (2 đv) bị choáng 1.5s. |
| 9 | c | Tia Lửa Ma Thuật | Dịch Chuyển lập tức hồi lại Cầu Lửa. |
| 12 | a | Hố Đen Tro Tàn | Đại Hỏa Cầu tích tối đa: hút mọi kẻ địch trong 4 đv vào tâm rồi mới phát nổ. |
| 12 | b | Pháp Sư Trọng Lực | Đổi hệ Lửa sang Trọng Lực: không gây Thiêu Đốt; mỗi chiêu trúng tích 1 tầng (tối đa 6, 5s), mỗi tầng +6% sát thương nhận vào và chậm 5%. |
| 12 | c | Phượng Hoàng Tái Sinh | Đòn chí tử: hóa trứng lửa 2s (bất động, miễn sát thương) rồi sống lại với 40% máu. 1 lần mỗi trận. |

**Lối build gợi ý (AI dùng)**
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Nhiệt Ảnh Truy Mệnh, Hồn Thiên Nhãn Xuyên Giới, Hồn Ưng Nhãn

<a id="jack"></a>
### Jack "Sáu Lỗ"

**Định danh**
- id: `jack` • màu chủ đạo: `#c0a080` • vũ khí/hình ảnh: `revolver` • bán kính va chạm: 0.6 đv
- Vai trò: Xạ thủ (Marksman) • vị trí: Xạ thủ (đường dưới) • nhãn: autos, crit
- Tầm xa • sát thương chính: vật lý • tài nguyên: mana
- Đạn đánh thường: kiểu `bullet`, tốc độ 28 đv/s
- Dùng **súng & băng đạn**: đánh thường tốn đạn, hết đạn phải nạp (xem nội tại).
- Tính cách AI: 🎲 Con Bạc — Ham thính và boss, dám liều. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1440 | 220.8 | 3206.4 | 5193.6 |
| Máu (gốc trong dữ liệu) | 600 | 92 | 1336 | 2164 |
| Mana | 320 | 40 | 640 | 1000 |
| Hồi mana/s (thực tế, ×1.6) | 2.56 | 0.13 | 3.58 | 4.74 |
| SMVL | 64 | 4 | 96 | 132 |
| Giáp | 26 | 3.8 | 56.4 | 90.6 |
| Kháng phép | 30 | 1.3 | 40.4 | 52.1 |
| Tốc đánh | 0.74 | +3% | 0.92 | 1.12 |
| Tốc chạy | 3.3 | — | 3.3 | 3.3 |
| Tầm đánh | 5.8 | — | 5.8 | 5.8 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Gieo Xúc Xắc**

Ổ 6 viên, nạp 2s; mỗi lần nạp gieo xúc xắc: ⚀ tự mất 4% máu • ⚁–⚄ cả ổ +5/10/15/20% sát thương • ⚅ cả ổ chí mạng và choáng 0.25s.
- Mã nguồn: `src/data/heroes/jack.js:27`

**S1 — Quạt Cò**

- Hồi chiêu: 8 / 7.5 / 7 / 6.5 / 6s • Mana: 45 / 45 / 45 / 45 / 45 • Thi triển: 0.05s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 4 đv • Mục đích AI: dồn sát thương
- Xả hết đạn còn lại theo hình nón (5 đv), mỗi viên 70% SMVL + 10/15/20/25/30. Rồi nạp đạn.
- Mã nguồn: `src/data/heroes/jack.js:79`

**S2 — Cò Quay Nga**

- Hồi chiêu: 18 / 17 / 16 / 15 / 14s • Mana: 60 / 60 / 60 / 60 / 60 • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Chỉ nhắm tướng • Mục đích AI: dồn sát thương
- Nạp 1 Viên Định Mệnh rồi xoay ổ: một trong 6 phát kế tiếp gây 350% SMVL sát thương chuẩn và choáng 1s; trong lúc đó không dùng được Quạt Cò và Lăn Né.
- Mã nguồn: `src/data/heroes/jack.js:98`

**S3 — Lăn Né**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Mana: 40 / 40 / 40 / 40 / 40 • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 3.5 đv • Mục đích AI: thoát thân
- Lăn 3.5 đv (miễn sát thương khi lăn), nhét thêm 2 viên.
- Mã nguồn: `src/data/heroes/jack.js:105`

**S4 — Nhà Cái Trả Thưởng**

- Hồi chiêu: 100 / 85 / 70s • Mana: 100 / 100 / 100
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: chiêu cuối
- 6s mọi đòn đánh là ⚅ (chí mạng + choáng 0.25s); hạ gục tướng trong lúc đó: +4% sát thương tới hết trận (tối đa 5 lần) và hoàn 50% hồi chiêu.
- Mã nguồn: `src/data/heroes/jack.js:121`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Tay Cờ Bạc Chuyên Nghiệp | Xúc xắc ra ⚀ không còn tự mất máu. |
| 1 | b | Thay Đạn Nhanh | +35% tốc chạy trong lúc nạp đạn. |
| 1 | c | Đạn Nặng | Đánh thường +10% sát thương. |
| 3 | a | Tăng Tỷ Lệ Nhà Cái | Tỉ lệ xúc xắc ra ⚅ tăng gấp đôi. |
| 3 | b | Xả Hết Vốn | Viên cuối của Quạt Cò chắc chắn choáng 0.75s. |
| 3 | c | Thần May Mắn Hộ Mệnh | Mỗi phát trượt ở Cò Quay Nga cho lá chắn nhỏ 1s. |
| 6 | a | Nạp Đạn Liều Lĩnh | Lăn Né thành nạp đầy ổ và xoay súng xả đạn quanh người (3 đv). |
| 6 | b | Bắn Nhanh | Quạt Cò thành 3 viên liên thanh theo đường thẳng, lực giật đẩy Jack lùi 2 đv. |
| 6 | c | Tẩy Bài Cờ Bạc | Xúc xắc ra ⚀: được gieo lại 1 lần. |
| 9 | a | Viên Đạn Sinh Tử | Viên Định Mệnh gây 500% (thay vì 350%); kết liễu tướng dưới 30% máu. |
| 9 | b | Ván Bài Lật Ngửa | Nhà Cái Trả Thưởng hồi chiêu nhanh hơn 33%. |
| 9 | c | Tất Tay | Dưới 40% máu: mỗi phát có thêm 50% cơ hội chí mạng. |
| 12 | a | Cược Tất Tay | Viên Định Mệnh nổ: dùng lại Cò Quay Nga để ném luôn khẩu súng phát nổ (bán kính 4), rồi mất 3s nhặt súng. |
| 12 | b | Thần Bạc Gian Lận | Ổ 8 viên; xúc xắc luôn từ ⚂ tới ⚅. |
| 12 | c | Mạng Thứ Hai | Đòn chí tử: kích phản lực bay lùi 5 đv với 1 máu và lá chắn (1 lần mỗi trận). |

**Lối build gợi ý (AI dùng)**
- Chí Mạng: giày Giày Cuồng Chiến → Đao Phá Quân → Cung Gió Lốc → Kiếm Bão Táp → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Xạ Thủ Súng: giày Giày Cuồng Chiến → Cung Thần Phong → Đao Phá Quân → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Tốc Đánh: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Cung Thần Phong → Dao Cắt Gân → Cung Gió Lốc → Huyết Kiếm Đoạt Mệnh
- Mảnh hồn yêu thích: Hồn Cò Quay Bất Tận, Hồn Đạn Cuối Chấn Địa, Hồn Trảm Quyết Xuyên Tâm

<a id="joker"></a>
### Joker

**Định danh**
- id: `joker` • màu chủ đạo: `#ffd24a` • vũ khí/hình ảnh: `cards` • bán kính va chạm: 0.58 đv
- Vai trò: Pháp sư (Mage) • vị trí: Đường giữa, Hỗ trợ • nhãn: heal, cc, poke
- Tầm xa • sát thương chính: phép • tài nguyên: mana
- Đạn đánh thường: kiểu `card`, tốc độ 20 đv/s
- Tính cách AI: 🎭 Kẻ Bịp Bợm — Gạ đổi chác / liên minh với bất kỳ ai để lừa: bán mảnh dỏm giá cao, đổi gian, báo tin giả dụ người ta vào bẫy của mình; liên minh tạm thì gần như chắc chắn bịp; ai từng bị lừa thì không tin nữa. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh giữa trận · Ít cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1296 | 201.6 | 2908.8 | 4723.2 |
| Máu (gốc trong dữ liệu) | 540 | 84 | 1212 | 1968 |
| Mana | 420 | 50 | 820 | 1270 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 52 | 3 | 76 | 103 |
| Giáp | 22 | 3.6 | 50.8 | 83.2 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.35 | — | 3.35 | 3.35 |
| Tầm đánh | 5.2 | — | 5.2 | 5.2 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Bịp Bợm**

Phi Bài 25%, Rút Bài và Tráo Bài 10% được nhân đôi. Lá Rô/Cơ gắn Ấn Mặt Trời, lá Bích/Tép gắn Ấn Mặt Trăng: một tướng mang đủ 2 Mặt Trời + 2 Mặt Trăng thì choáng 1.5s. Joker luôn giữ một lá bài (Phi Bài ném lá đang giữ). Giả Ngây Ngô: né hoàn toàn đòn đánh thường của tướng nam (cục súc Borg/Koda/Clint 30% • lão luyện Gideon/Valerius/Ryoma/Kazuki 10% • còn lại 16%); tướng nữ chỉ 3%.
- Mã nguồn: `src/data/heroes/joker.js:63`

**S1 — Phi Bài Sắc Cạnh**

- Hồi chiêu: 4 / 4 / 3.75 / 3.5 / 3.25s • Mana: 40 / 45 / 50 / 55 / 60 • Thi triển: 0.12s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.8 đv • Tốc đạn/lướt: 20 đv/s • Mục đích AI: cấu rỉa
- Ném lá bài đang giữ 7 đv, áp hiệu ứng theo chất: ♠ sát thương lớn • ♣ khống chế ngẫu nhiên • ♦ nổ lan • ♥ hồi máu đồng minh quanh Joker • 🃏 đổi chỗ với mục tiêu.
- Công thức trong mã: `[55/85/115/145/175 theo cấp chiêu] + 0.55×SMPT`
- Mã nguồn: `src/data/heroes/joker.js:77`

**S2 — Rút Bài May Rủi**

- Hồi chiêu: 6 / 6 / 5.5 / 5.5 / 5s • Mana: 50 / 50 / 50 / 50 / 50 • Thi triển: 0.1s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 6 đv • Mục đích AI: dồn sát thương
- Rút một lá: ♠ sát thương • ♣ khống chế ngẫu nhiên • ♦ nổ lan • ♥ hồi máu đồng minh • 🃏 đổi chỗ — áp lên tướng địch gần nhất trong 6 đv, rồi giữ lá đó. 10% rút hụt (hoàn 50% hồi chiêu).
- Công thức trong mã: `[50/75/100/125/150 theo cấp chiêu] + 0.5×SMPT`
- Mã nguồn: `src/data/heroes/joker.js:87`

**S3 — Tráo Bài**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Mana: 40 / 40 / 40 / 40 / 40
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 3 đv • Mục đích AI: thoát thân
- Lướt 3 đv và đổi lá bài đang giữ.
- Mã nguồn: `src/data/heroes/joker.js:105`

**S4 — Ván Cờ Đổi Chiều**

- Hồi chiêu: 110 / 90 / 70s • Mana: 100 / 100 / 100 • Thi triển: 0.2s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 7 đv • Chỉ nhắm tướng • Mục đích AI: chiêu cuối
- Tung hộp bài lên trời: 45% Lá Toàn Năng (mọi chất cùng lúc lên mục tiêu) • 30% Đại Bác Bài (quét đường thẳng 10 đv) • 20% Tráo Sinh Mệnh (đổi % máu với tướng địch, chênh tối đa 30%) • 4.8% Cơn Ác Mộng (choáng 2.5s, kẻ quanh đó 1.5s) • 0.2% Thần Chết Bịp Bợm (kết liễu lập tức).
- Công thức trong mã: `[150/250/350 theo cấp chiêu] + 0.8×SMPT`
- Mã nguồn: `src/data/heroes/joker.js:140`

**Skill phụ — Mượn Tý Nha!**

- Hồi chiêu: 0s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 7 đv • Mục đích AI: dồn sát thương
- Khi ai đó trong tầm nhìn dùng món kích hoạt, vật phẩm tiêu hao hoặc phép bổ trợ, Joker có 10s để dùng bản sao của nó (hồi chiêu 0s).
- Mã nguồn: `src/data/heroes/joker.js:118`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Tay Nhanh Hơn Mắt | Phi Bài bay nhanh hơn 40% và xa thêm 2 đv. |
| 1 | b | Trộm Vặt | Bắt đầu trận với thêm 300 vàng. |
| 1 | c | Nhà Cái Kiếm Tiền | +10% vàng nhận được. (+10% Vàng) |
| 3 | a | Bích Độc Đao | Lá Bích +40% sát thương lên mục tiêu dưới 40% máu. |
| 3 | b | Tép Ngạt Khí | Khống chế của lá Tép kéo dài thêm 0.5s. |
| 3 | c | Lừa Tình Tuyệt Đỉnh | Giả Ngây Ngô: +15% tỉ lệ né đòn đánh thường của tướng. |
| 6 | a | Vui Thôi Nào! | Mỗi lần Bịp Bợm nhân đôi: hồi 30 mana và +20% tốc chạy 2s. |
| 6 | b | Phi Ba Lá | Phi Bài phóng rẻ quạt 3 lá cùng chất. |
| 6 | c | Bài Ảo Đánh Lạc Hướng | Tráo Bài để lại hình nhân bài giấy 3s, bị phá thì phát nổ làm chậm. |
| 9 | a | Đạo Tặc Thần Tốc | Dùng bản sao từ Mượn Tý Nha!: +30% sát thương 3s. |
| 9 | b | Bàn Tay Điêu Luyện | Rút Bài không còn rút hụt. |
| 9 | c | Bộ Bài Vô Tận | Tỉ lệ nhân đôi của Phi Bài lên 40%, Rút Bài và Tráo Bài lên 20%. |
| 12 | a | Thần Bài Gian Lận | Bỏ lá Cơ, lá Joker 25%; lá Bích/Tép/Rô mang thêm hiệu ứng của một chất ngẫu nhiên. |
| 12 | b | Gian Lận Tối Thượng | Ván Cờ luôn ra Lá Toàn Năng, hoặc Tráo Sinh Mệnh khi Joker dưới 35% máu. |
| 12 | c | Ván Cược Sinh Tử | Dưới 35% máu: Ván Cờ có 25% ra Cơn Ác Mộng. |

**Lối build gợi ý (AI dùng)**
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Bảo Hộ: giày Giày Khai Sáng → Đèn Lồng Tinh Linh → Lư Hương Cổ → Kính Cú Đêm → Ngọc Bội Hộ Mệnh → Khiên Lâm Thần
- Mảnh hồn yêu thích: Hồn Phá Sóng Nhiễu Loạn, Hồn Thấu Thị Thảo Mộc, Hồn Huyết Tế Toàn Cảnh

<a id="justus"></a>
### Justus

**Định danh**
- id: `justus` • màu chủ đạo: `#f0d27a` • vũ khí/hình ảnh: `tome` • bán kính va chạm: 0.58 đv
- Vai trò: Pháp sư (Mage) • vị trí: Hỗ trợ, Đường giữa • nhãn: cc, shield
- Tầm xa • sát thương chính: phép • tài nguyên: không dùng mana
- Đạn đánh thường: kiểu `holy`, tốc độ 22 đv/s
- Thanh tài nguyên riêng: **Đức Tin** (0–100, màu `#ffe08a`).
- Tính cách AI: 📿 Cuồng Tín — Truy sát "dị giáo" (Death) tới cùng trời cuối đất, kể cả ngoài bo. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: bạn: Olivia, Ariston, Valerius • bảo vệ: Olivia • thù: Vesper, Death, Dr. Caelus

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1368 | 211.2 | 3057.6 | 4958.4 |
| Máu (gốc trong dữ liệu) | 570 | 88 | 1274 | 2066 |
| Mana | 420 | 50 | 820 | 1270 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 52 | 3 | 76 | 103 |
| Giáp | 28 | 3.8 | 58.4 | 92.6 |
| Kháng phép | 32 | 2 | 48 | 66 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.35 | — | 3.35 | 3.35 |
| Tầm đánh | 5 | — | 5 | 5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Đức Tin Cứu Rỗi • Ý Chí Kiên Định • Hộ Vệ Thánh Đình**

Chiêu tốn Đức Tin (100, tự hồi 2.5/giây ngoài giao tranh, 1/giây trong giao tranh); giáp ảo của Justus bị vỡ, được hồi máu hay ban giáp mới: +10 Đức Tin (mỗi 1.5s). Ý Chí Kiên Định (60s): chặn trọn chiêu đầu tiên của tướng địch, rồi tỏa sóng làm chậm 40% trong 4.5 đv 2s. Hộ Vệ Thánh Đình (100s): dưới 25% máu, Thiên Sứ gánh đòn thay (35% máu tối đa của Justus, Justus không thể chết khi Thiên Sứ còn), +50 Đức Tin.
- Mã nguồn: `src/data/heroes/justus.js:16`

**S1 — Tam Kiếm Trừng Phạt**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 8 đv • Mục đích AI: khống chế
- Không có thời gian niệm (vừa chạy vừa dùng). Tốn 20 Đức Tin: đánh dấu vòng đỏ bán kính 1.6 đv lên 3 tướng địch gần nhất trong 8 đv; sau 0.25s ba thanh kiếm thánh cắm xuống: sát thương phép và choáng 1s.
- Công thức trong mã: `[70/105/140/175/210 theo cấp chiêu] + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/justus.js:54`

**S2 — Thánh Quang Hộ Thể**

- Hồi chiêu: 12 / 11 / 10 / 9 / 8.5s • Dùng được khi đang bị khống chế • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Tốn 25 Đức Tin: Justus và đồng minh trong 6 đv nhận Giáp Ảo = 20% máu tối đa trong 4s và được thanh tẩy mọi khống chế, hiệu ứng xấu, vết thương sâu. Giáp bị phá trước khi hết giờ: hoàn 25 Đức Tin.
- Mã nguồn: `src/data/heroes/justus.js:70`

**S3 — Tia Phán Quyết Liên Tục**

- Hồi chiêu: 6 / 5.5 / 5 / 4.5 / 4s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 9.5 đv • Mục đích AI: cấu rỉa
- Chiếu tia laser thánh dài 10 đv (khởi đầu 10 Đức Tin, +6 mỗi giây duy trì, tối đa 4s): vừa chiếu vừa đi chậm (−30%); bị choáng / hóa đá là ngắt. Mỗi 0.5s trúng tướng: sát thương +15% (tối đa +60%). Mỗi giây trúng: Ý Chí Kiên Định hồi nhanh 0.25s × số tướng trúng.
- Công thức trong mã: `[20/30/40/50/60 theo cấp chiêu] + 0.18×SMPT`
- Mã nguồn: `src/data/heroes/justus.js:92`

**S4 — Trận Địa Thanh Tẩy Vạn Năng**

- Hồi chiêu: 90 / 75 / 60s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 7 đv • Bán kính vùng: 8 đv • Mục đích AI: chiêu cuối
- Tốn 40 Đức Tin: cắm Kinh Thánh mở Pháp Trận bán kính 9 đv trong 6s. Kẻ địch trong trận bị thiêu mỗi 0.5s (mỗi nhịp +2 Đức Tin), mất 40% Kháng Phép và 30 Hộ Giáp mỗi giây. Mỗi 1.5s cấp Giáp Ảo 8% máu tối đa cho Justus và đồng minh trong trận, thanh tẩy làm chậm.
- Công thức trong mã: `[40/60/80 theo cấp chiêu] + 0.2×SMPT`
- Mã nguồn: `src/data/heroes/justus.js:119`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Tâm Niệm Thuần Khiết | Đức Tin tự hồi nhanh hơn 35%. |
| 1 | b | Ý Chí Cương Nhu | Sóng làm chậm của Ý Chí rộng 6 đv. |
| 1 | c | Đòn Đánh Cổ Ngữ | Đánh thường trúng tướng hồi 2 Đức Tin. |
| 3 | a | Kiếm Thánh Rơi Nhanh | Tam Kiếm rơi sau 0.15s. |
| 3 | b | Hộ Thể Cường Hóa | Giáp của Thánh Quang Hộ Thể cho đồng minh +30%. |
| 3 | c | Quang Trận Tiếp Tốc | Đồng minh trong Pháp Trận +25% tốc chạy. |
| 6 | a | Tia Laser Xuyên Thấu | Tia Phán Quyết bỏ qua 50% Hộ Giáp. |
| 6 | b | Hộ Vệ Bất Khuất | Thiên Sứ xuất hiện hất văng mọi kẻ địch áp sát 4 đv. |
| 6 | c | Lời Cầu Nguyện Vô Tận | Ý Chí Kiên Định hồi 45s. |
| 9 | a | Đức Tin Bất Hoại | Đầy 100 Đức Tin: giảm 20% sát thương nhận. |
| 9 | b | Hộ Vệ Hồi Sinh | Thiên Sứ hết giờ mà chưa vỡ: 50% máu còn lại hồi cho Justus. |
| 9 | c | Trận Địa Giam Cầm | Kẻ địch trong Pháp Trận −40% tốc đánh, không thể lướt / dây móc. |
| 12 | a | Giáo Hoàng Thánh Đình | Phong cách: Pháp Trận 9s, câm lặng kẻ địch bên trong 1.5s đầu. |
| 12 | b | Vô Tận Hộ Thần | Phong cách: Hộ Vệ Thánh Đình hồi 50s. |
| 12 | c | Giáo Lý Vững Bền | +20 Giáp và Kháng Phép. (+20 Giáp, +20 Kháng phép) |

**Lối build gợi ý (AI dùng)**
- Bảo Hộ: giày Giày Khai Sáng → Đèn Lồng Tinh Linh → Lư Hương Cổ → Kính Cú Đêm → Ngọc Bội Hộ Mệnh → Khiên Lâm Thần
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Ưng Nhãn, Hồn Phá Ảo Chân Thị, Hồn Thiên Nhãn Xuyên Giới

<a id="kazuki"></a>
### Kazuki

**Định danh**
- id: `kazuki` • màu chủ đạo: `#9ad0ff` • vũ khí/hình ảnh: `twinblades` • bán kính va chạm: 0.6 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đường trên, Đi rừng • nhãn: dive
- Cận chiến • sát thương chính: vật lý • tài nguyên: không dùng mana
- Tính cách AI: 💣 Kẻ Đổi Mạng — Bình thường thận trọng; dưới 15% máu mà bị dồn thì tung hết (chiêu cuối, bom, khống chế) và kéo kẻ gần nhất xuống bão / ra khỏi vách. • Phong cách đánh: 🛡 Lì đòn — Đã vào trận là đánh tới cùng, không bỏ chạy.
- Giai đoạn mạnh: Mạnh cuối trận · Cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1428 | 223.2 | 3213.6 | 5222.4 |
| Máu (gốc trong dữ liệu) | 595 | 93 | 1339 | 2176 |
| SMVL | 63 | 4 | 95 | 131 |
| Giáp | 30 | 3.9 | 61.2 | 96.3 |
| Kháng phép | 32 | 1.8 | 46.4 | 62.6 |
| Tốc đánh | 0.72 | +2.5% | 0.86 | 1.03 |
| Tốc chạy | 3.55 | — | 3.55 | 3.55 |
| Tầm đánh | 1.6 | — | 1.6 | 1.6 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Song Kiếm Vô Niệm**

Đánh thường luân phiên tay trái (nhanh, 85%) / tay phải (nặng, 125%). Ý Niệm (0–100) tự hồi 2/giây, chiêu tốn Ý Niệm (S1 10 • S2 15 • S3 25). Kiếm Ý (0–10): +1 mỗi Kiếm Thế Quyết, +5 mỗi lần Nghịch Trảm thành công — đủ 5 thì Kiếm Thế Quyết đổi thành Loạn Vũ Hư Ảnh.

- Công thức trong mã: `60 + 10×cấp + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/kazuki.js:58`

**S1 — Tả Trảm**

- Hồi chiêu: 3 / 3 / 3 / 3 / 3s • Thi triển: 0.08s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 2.4 đv • Mục đích AI: dồn sát thương
- Chém nhanh hình nón, gạt đạn nhỏ bay tới. Ghi nhịp "A" cho Kiếm Thế Quyết. Tốn 10 Ý Niệm.
- Công thức trong mã: `[40/60/80/100/120 theo cấp chiêu] + 0.5×SMVL`
- Mã nguồn: `src/data/heroes/kazuki.js:80`

**S2 — Hữu Trảm**

- Hồi chiêu: 6 / 5.75 / 5.5 / 5.25 / 5s • Thi triển: 0.18s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 2.8 đv • Mục đích AI: dồn sát thương
- Chém nặng, tầm rộng. Ghi nhịp "B". Tốn 15 Ý Niệm.
- Công thức trong mã: `[70/105/140/175/210 theo cấp chiêu] + 0.8×SMVL`
- Mã nguồn: `src/data/heroes/kazuki.js:92`

**S3 — Kiếm Thế Quyết**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Thi triển: 0.12s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 2.8 đv • Mục đích AI: dồn sát thương
- Theo 2 nhịp trước: AA xoay 360° • AB đâm 4.5 đv choáng 1s • BA chém chữ X gây Vết Thương Sâu • BB lướt xuyên 4 đv choáng 1s; không có nhịp thì chém thường. Đủ 5 Kiếm Ý: tốn 5 để tung Loạn Vũ Hư Ảnh — 5 ảo ảnh chém từ 5 hướng, khóa mục tiêu 1.5s rồi hất tung. Mỗi lần dùng giảm 4s hồi chiêu S4. Tốn 25 Ý Niệm.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.8×SMVL` • `40 + 8×u3.level + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/kazuki.js:104`

**S4 — Vạn Cảnh Trảm Vực**

- Hồi chiêu: 110 / 90 / 75s • Thi triển: 0.1s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6 đv • Bán kính vùng: 3 đv • Mục đích AI: chiêu cuối
- Lướt 6 đv, để lại vùng loạn kiếm bán kính 3 trong 4s: sát thương liên tục, hút nhẹ về tâm, cấm lướt.
- Công thức trong mã: `[30/45/60 theo cấp chiêu] + 0.2×SMVL`
- Mã nguồn: `src/data/heroes/kazuki.js:173`

**Skill phụ — Vô Tướng Nghịch Trảm**

- Hồi chiêu: 14s
- Mục đích AI: logic riêng của tướng
- Thủ thế song kiếm 0.6s. Đỡ trúng đòn đánh hay chiêu của tướng địch phía trước: chặn sát thương, CHOÁNG kẻ đó 1s, lướt xuyên qua để ảo ảnh chém liên hoàn — 2s sau vết chém nổ tung (60 +10/cấp, +60% SMVL) và đẩy văng; hồi ngay Kiếm Thế Quyết, +5 Kiếm Ý. Đỡ hụt: khựng 0.3s.
- Mã nguồn: `src/data/heroes/kazuki.js:148`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Tĩnh Tâm | Ý Niệm tự hồi 3.5/giây (thay vì 2). |
| 1 | b | Kéo Dài Nhịp | Chuỗi nhịp kiếm thế được nhớ 3s (thay vì 2s). |
| 1 | c | Kiếm Phong | Tả Trảm và Hữu Trảm quét xa hơn 20%. |
| 3 | a | Phá Giáp Xung Kích | Thế đâm AB phá mọi lá chắn và giảm 20% giáp mục tiêu 3s. |
| 3 | b | Huyết Trảm | Thế chữ X BA gây Chảy Máu 2% máu tối đa/giây trong 3s. |
| 3 | c | Thấu Thị | Vô Tướng Nghịch Trảm (skill phụ) hồi 10s (thay vì 14s). |
| 6 | a | Trảm Khí Nghịch Chuyển | Nghịch Trảm thành công: phóng kiếm khí chữ X 6 đv về phía kẻ tấn công. |
| 6 | b | Vạn Kiếm Quy Nhất | Sau Kiếm Thế Quyết, trong 1.5s dùng lại: lướt ngược chém kết liễu từ trên không (+10% máu đã mất). |
| 6 | c | Đoạt Mệnh Trảm Đạn | Tả Trảm và Hữu Trảm chém tan đạn bay tới, mỗi viên hồi 8 Ý Niệm. |
| 9 | a | Kiếm Vực Giam Cầm | Vùng loạn kiếm của S4 câm lặng tướng bên trong mỗi giây. |
| 9 | b | Bất Diệt Ý Niệm | Nghịch Trảm thành công hồi 10% máu tối đa. |
| 9 | c | Bát Hướng Phân Thân | Thế xoay AA rộng hơn 40% và hút kẻ địch vào. |
| 12 | a | Tuyệt Kỹ Iaido | +12% tốc chạy; Kiếm Thế Quyết không cần nhịp mồi: luôn lướt chém xuyên 5 đv choáng 0.75s. (+12% Tốc chạy) |
| 12 | b | Trảm Đoạn Thời Không | Vạn Cảnh Trảm Vực: tướng địch dưới 50% máu trong vùng bị đóng băng (choáng) 1s ngay khi đặt. |
| 12 | c | Đạo Kiếm Hợp Nhất | Mỗi lần dùng Kiếm Thế Quyết giảm 8s hồi chiêu S4 (thay vì 4s). |

**Lối build gợi ý (AI dùng)**
- Sát Thủ: giày Giày Đinh Gỉ → Dao Ám Ảnh → Kiếm Bão Táp → Dao Tử Thần → Mũi Khoan Thép → Khăn Thanh Tẩy
- Đơn Đấu: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái
- Tốc Đánh: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Cung Thần Phong → Dao Cắt Gân → Cung Gió Lốc → Huyết Kiếm Đoạt Mệnh
- Mảnh hồn yêu thích: Hồn Phong Lôi Liên Kích, Hồn Vũ Điệu Tử Thần, Hồn Thần Tốc Thiên Mệnh

<a id="kip"></a>
### Kip

**Định danh**
- id: `kip` • màu chủ đạo: `#7a6aff` • vũ khí/hình ảnh: `voidknife` • bán kính va chạm: 0.55 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đi rừng • nhãn: dive, mobile
- Cận chiến • sát thương chính: vật lý • tài nguyên: không dùng mana
- Thanh tài nguyên riêng: **Điểm Hư Không** (0–3, dạng điểm, màu `#a59aff`).
- Tính cách AI: 🃏 Quấy Nhiễu — Cướp đồ ngay trước mặt người khác, đặt bẫy trêu ngươi, cấu một phát rồi dây móc chuồn. • Phong cách đánh: ⚔ Xông xáo — Đánh tới khi còn khoảng 10% máu mà thấy không thắng nổi mới chạy.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: bạn: Aria & Oktava • bảo vệ: Aria & Oktava • thù: Dr. Caelus

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1440 | 216 | 3168 | 5112 |
| Máu (gốc trong dữ liệu) | 600 | 90 | 1320 | 2130 |
| SMVL | 68 | 4.1 | 100.8 | 137.7 |
| Giáp | 27 | 3.6 | 55.8 | 88.2 |
| Kháng phép | 32 | 1.8 | 46.4 | 62.6 |
| Tốc đánh | 0.75 | +2.5% | 0.9 | 1.07 |
| Tốc chạy | 3.7 | — | 3.7 | 3.7 |
| Tầm đánh | 1.4 | — | 1.4 | 1.4 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Gia Tốc Trượt Không Gian**

Mỗi lần lướt / dịch chuyển / dây móc: +15% tốc chạy 2.5s; đòn cận chiến kế tiếp sau dịch chuyển bỏ qua 30% Hộ Giáp và áp sát tức thời trong 4 đv. Thể Phản Xạ Hư Vô (45s): đòn đầu tiên từ kẻ địch ngoài tầm nhìn bị vô hiệu. Đứng trong vùng cảnh báo đỏ: +30% tốc chạy để thoát.
- Mã nguồn: `src/data/heroes/kip.js:22`

**S1 — Vết Nứt Hư Không**

- Hồi chiêu: 0.4s • Hồi chiêu bắt đầu do chiêu tự tính (ví dụ sau khi kết thúc trạng thái) • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6 đv • Đạn định hướng (né được) • Mục đích AI: mở giao tranh
- Tốn 1 Điểm Hư Không: dịch chuyển 6 đv theo hướng chỉ định (xuyên vật cản mỏng), để lại Vết Nứt 3s. Trong 3s dùng lại để giật về Vết Nứt, hồi 15% Hộ Giáp và choáng 0.3s kẻ địch quanh đó.
- Mã nguồn: `src/data/heroes/kip.js:57`

**S2 — Phi Đao Tọa Độ**

- Hồi chiêu: 12 / 11 / 10 / 9 / 9s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 14 đv • Tốc đạn/lướt: 26 đv/s • Mục đích AI: cấu rỉa
- Phóng phi đao 16 đv. Cắm địa hình: tạo điểm neo 5s, dùng lại để dịch chuyển tới đó. Trúng kẻ địch: sát thương vật lý; dùng lại (5s) để xuyên không ra sau gáy đối thủ, đâm chí mạng và làm chậm 50% 1.5s.
- Công thức trong mã: `[60/90/120/150/180 theo cấp chiêu] + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/kip.js:78`

**S3 — Vòm Xoáy Bẻ Cong Đạn Đạo**

- Hồi chiêu: 15 / 14 / 13 / 12 / 12s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Tốn 1 Điểm Hư Không: lỗ đen mini bán kính 3.5 đv quanh thân 2s — nuốt mọi đạn đạo tầm xa bay vào; kẻ địch cận chiến bước vào nhận sát thương phép và bị hất văng 4 đv khi vòm xoáy kết thúc.
- Công thức trong mã: `[50/80/110/140/170 theo cấp chiêu] + 0.3×SMVL + 0.4×SMPT`
- Mã nguồn: `src/data/heroes/kip.js:103`

**S4 — Lãnh Địa Đa Chiều: Trò Chơi Trốn Tìm**

- Hồi chiêu: 80 / 65 / 50s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 9 đv • Mục đích AI: chiêu cuối
- Tốn 2 Điểm Hư Không: kết giới bán kính 14 đv trong 8s — Vết Nứt không tốn điểm và hồi 1s; mỗi cú dịch chuyển để lại tàn ảnh đánh lừa; mọi đòn đánh thêm 50% xuyên Hộ Giáp. Rời khỏi kết giới thì nó biến mất.
- Mã nguồn: `src/data/heroes/kip.js:125`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Bước Chân Hư Ảo | Thêm 1 Điểm Hư Không tối đa (4 lần dịch chuyển). |
| 1 | b | Thấu Thị Không Gian | Nhìn xa hơn 25% và thấy rương đồ quanh mình. (+0.25 visPct) |
| 1 | c | Gia Tốc Dây Móc | +10% tốc chạy thường trực. (+10% Tốc chạy) |
| 3 | a | Cắt Gió Đa Tầng | Phi Đao xuyên qua quái để găm vào tướng. |
| 3 | b | Nuốt Đạn Phản Hồi | Mỗi viên đạn Vòm Xoáy nuốt: hồi 5% Hộ Giáp. |
| 3 | c | Lướt Xuyên Tường Dày | Vết Nứt dịch chuyển 8.5 đv. |
| 6 | a | Đột Kích Điểm Mù | Dịch chuyển sau lưng bằng Phi Đao luôn chí mạng. |
| 6 | b | Không Gian Nén | Hạ gục tướng: hồi 2 Điểm Hư Không. |
| 6 | c | Vết Nứt Nổ Chậm | Vết Nứt biến mất thì phát nổ 200 sát thương phép. |
| 9 | a | Trôi Dạt Vô Đích | Nhận ít hơn 40% sát thương bo. (+0.4 zoneRed) |
| 9 | b | Vết Cắt Xuyên Tủy | Đòn sau dịch chuyển xuyên 65% Hộ Giáp. |
| 9 | c | Cổng Dịch Chuyển | +15% hồi chiêu. (+15% Giảm hồi chiêu) |
| 12 | a | Sát Thủ Vô Ảnh | Phong cách: Lãnh Địa 12s; hạ gục trong kết giới +3s và hồi 30% máu. |
| 12 | b | Nghịch Đảo Trọng Trường | Phong cách: mở Lãnh Địa nhấc bổng mọi kẻ địch trong 14 đv 1.5s, cấm dây móc. |
| 12 | c | Khe Nứt Bất Tận | Điểm Hư Không hồi nhanh hơn 30%. (+10% Giảm hồi chiêu) |

**Lối build gợi ý (AI dùng)**
- Sát Thủ: giày Giày Đinh Gỉ → Dao Ám Ảnh → Kiếm Bão Táp → Dao Tử Thần → Mũi Khoan Thép → Khăn Thanh Tẩy
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Đơn Đấu: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái
- Mảnh hồn yêu thích: Hồn Phi Thân Trảm Kích, Hồn Phong Lôi Liên Kích, Hồn Thần Tốc Thiên Mệnh

<a id="koda"></a>
### Koda

**Định danh**
- id: `koda` • màu chủ đạo: `#c0563a` • vũ khí/hình ảnh: `claw` • bán kính va chạm: 0.6 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đi rừng • nhãn: dive
- Cận chiến • sát thương chính: vật lý • tài nguyên: không dùng mana
- Tính cách AI: 🌋 Cuồng Loạn — Gặp ai đánh nấy, gặp cái gì phá cái đó (tướng, quái, boss); không bao giờ lùi, đánh tới chết. • Phong cách đánh: ⚔ Xông xáo — Đánh tới khi còn khoảng 10% máu mà thấy không thắng nổi mới chạy.
- Giai đoạn mạnh: Mạnh đầu trận · Cần đồ vừa phải

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1488 | 230.4 | 3331.2 | 5404.8 |
| Máu (gốc trong dữ liệu) | 620 | 96 | 1388 | 2252 |
| SMVL | 65 | 4 | 97 | 133 |
| Giáp | 33 | 3.8 | 63.4 | 97.6 |
| Kháng phép | 32 | 1.8 | 46.4 | 62.6 |
| Tốc đánh | 0.72 | +2.5% | 0.86 | 1.03 |
| Tốc chạy | 3.65 | — | 3.65 | 3.65 |
| Tầm đánh | 1.45 | — | 1.45 | 1.45 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Vết Thương Sâu**

Đòn đánh và chiêu gây 1 tầng Chảy Máu (tối đa 5): mỗi tầng 6 (+1.8/cấp) sát thương vật lý mỗi giây trong 4s.
- Mã nguồn: `src/data/heroes/koda.js:42`

**S1 — Cào Loạn Xạ**

- Hồi chiêu: 5 / 4.5 / 4 / 3.5 / 3s • Thi triển: 0.1s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 2 đv • Mục đích AI: dồn sát thương
- 2 nhát cào nhanh trước mặt, mỗi nhát gây 1 tầng Chảy Máu. Vừa lao xuống từ tường: ×1.5.
- Công thức trong mã: `[35/55/75/95/115 theo cấp chiêu] + 0.45×SMVL`
- Mã nguồn: `src/data/heroes/koda.js:50`

**S2 — Xé Toạc**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Thi triển: 0.1s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 3 đv • Mục đích AI: dồn sát thương
- Kích nổ toàn bộ Chảy Máu trên mục tiêu thành sát thương tức thì. Đủ 5 tầng: làm chậm 60% 1.5s và cộng 10% máu đã mất.
- Công thức trong mã: `[30/42/54/66/78 theo cấp chiêu] + 0.3×SMVL`
- Mã nguồn: `src/data/heroes/koda.js:68`

**S3 — Vồ Mồi**

- Hồi chiêu: 12 / 11 / 10 / 9 / 8s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 5.2 đv • Mục đích AI: mở giao tranh
- Nhảy vồ tới 5 đv. Chạm tướng địch: đè xuống (trói chân cả hai 0.5s) rồi cào vào mặt. Chạm tường/vách: bám luôn vào tường (như Bám Tường).
- Công thức trong mã: `[40/65/90/115/140 theo cấp chiêu] + 0.5×SMVL` • `40 + 8×u3.level + 0.5×SMVL` • `60 + 6×u4.level + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/koda.js:89`

**S4 — Thú Tính**

- Hồi chiêu: 100 / 85 / 70s
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: chiêu cuối
- 5s hóa bóng đen: +50% tốc chạy, đi xuyên người; mỗi lần lướt qua tướng địch gây 1 tầng Chảy Máu (mỗi tướng 1 lần/0.5s).
- Mã nguồn: `src/data/heroes/koda.js:140`

**Skill phụ — Bám Tường**

- Hồi chiêu: 12s • Có điều kiện dùng riêng (xem mô tả)
- Mục đích AI: logic riêng của tướng
- Khi đứng cạnh tường/vách đá/rặng cây (1.6 đv): bám lên đó tối đa 3s — không thể bị chọn làm mục tiêu. Bấm lại (hoặc dùng Vồ Mồi): lao xuống tướng địch trong 7 đv nhanh gấp rưỡi, gây 60 (+6/cấp, +60% SMVL) ×1.5 sát thương; Cào Loạn Xạ kế tiếp ×1.5.
- Công thức trong mã: `60 + 6×u4.level + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/koda.js:124`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Bản Năng Leo Trèo | Bám tường tối đa 4s (thay vì 3s), lao xuống tướng trong 9 đv (thay vì 7). |
| 1 | b | Móng Vuốt Sắc Bén | Chảy Máu kéo dài 6s (thay vì 4s). |
| 1 | c | Cào Cuồng Bạo | Cào Loạn Xạ (S1) hồi chiêu nhanh hơn 1s. |
| 3 | a | Vồ Mồi Từ Trên Cao | Lao xuống từ tường gây choáng 1s. |
| 3 | b | Đứt Gân Toàn Phần | Xé Toạc (S2) khi đủ tầng Chảy Máu tối đa: trói chân 1.25s (thay vì làm chậm). |
| 3 | c | Vết Cắn Truy Lùng | Mỗi tầng Chảy Máu làm nạn nhân chậm 5%. |
| 6 | a | Cắn Xé Cuồng Loạn | Vồ Mồi đè trúng tướng: trong 2s dùng lại để ngoạm và quăng mục tiêu ra sau lưng Koda 3 đv. |
| 6 | b | Vuốt Quét 360 | Cào Loạn Xạ thành xoay tròn: cào mọi kẻ địch xung quanh (85% sát thương), mỗi kẻ 1 tầng Chảy Máu. |
| 6 | c | Đánh Hơi Con Mồi | +25% tốc chạy khi đuổi theo tướng có từ 3 tầng Chảy Máu. |
| 9 | a | Thú Tính Bất Diệt | Thú Tính (S4) kéo dài thêm 2s và miễn nhiễm làm chậm. |
| 9 | b | Cơn Đói Khát Máu | Chảy Máu tối đa 8 tầng (thay vì 5). |
| 9 | c | Xé Toạc Sinh Mệnh | Xé Toạc khi đủ tầng tối đa: +18% máu đã mất (thay vì 10%) và hồi cho Koda 50% sát thương gây ra. |
| 12 | a | Độn Thổ Rình Rập | Vồ Mồi thành chui xuống đất (không thể bị chọn, xuyên tường) lướt tới tướng địch trong 7 đv, trồi lên hất tung 0.75s. |
| 12 | b | Sói Đầu Đàn | +300 máu; Chảy Máu gây Vết Thương Sâu lên tướng. (+300 Máu) |
| 12 | c | Hộ Chủ Cuồng Bạo | Mất hơn 20% máu trong 2s: không thể cản phá và +30% sát thương trong 3s (hồi 12s). |

**Lối build gợi ý (AI dùng)**
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Đơn Đấu: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái
- Sát Thủ: giày Giày Đinh Gỉ → Dao Ám Ảnh → Kiếm Bão Táp → Dao Tử Thần → Mũi Khoan Thép → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Phi Thân Trảm Kích, Hồn Liên Hoàn Trảm, Hồn Thần Tốc Thiên Mệnh

<a id="luca"></a>
### Luca

**Định danh**
- id: `luca` • màu chủ đạo: `#ff4a7a` • vũ khí/hình ảnh: `cane` • bán kính va chạm: 0.58 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đường giữa • nhãn: dive
- Cận chiến • sát thương chính: phép • tài nguyên: mana
- Thanh tài nguyên riêng: **Náo Nhiệt** (0–100, màu `#ff6a9a`).
- Tính cách AI: 🎰 Con Bạc Khát Nước — Bỏ bãi quái nhỏ; lao vào cướp thính và boss dù có 3–4 kẻ quanh đó; càng ít máu càng liều. • Phong cách đánh: 🗡 Sát thủ phép — Đọc vị mục tiêu: máu giấy thì lao vào dồn sát thương rồi rút; trâu bò thì cấu rỉa tới ngưỡng kết liễu. Thấy đối thủ hụt chiêu lớn là lao vào ngay.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: bạn: Alice • bảo vệ: Alice • liên minh vĩnh cửu: Alice • thù: Dr. Caelus, Dr. Vector

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1872 | 268.8 | 4022.4 | 6441.6 |
| Máu (gốc trong dữ liệu) | 780 | 112 | 1676 | 2684 |
| Mana | 420 | 48 | 804 | 1236 |
| Hồi mana/s (thực tế, ×1.6) | 0 | 0 | 0 | 0 |
| SMVL | 70 | 4.6 | 106.8 | 148.2 |
| Giáp | 32 | 4.2 | 65.6 | 103.4 |
| Kháng phép | 34 | 1.9 | 49.2 | 66.3 |
| Tốc đánh | 0.8 | +2.5% | 0.96 | 1.14 |
| Tốc chạy | 3.6 | — | 3.6 | 3.6 |
| Tầm đánh | 1.7 | — | 1.7 | 1.7 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Sân Khấu Náo Nhiệt**

Náo Nhiệt 0–100: đánh trúng tướng +5, chiêu trúng tướng +10, lừa đòn +20, thoát hiểm +15. Mỗi 10 điểm +2% tốc chạy, +3% SMPT; đủ 100 mở khóa Cải Trang Tuyệt Đỉnh. Áo Choàng Thoát Hiểm (120s): lần đầu tụt dưới 10% máu → tàng hình 1.5s, dịch chuyển 4 đv ra xa kẻ địch, +15 Náo Nhiệt; mỗi lần đầy 100 Náo Nhiệt giảm 30s hồi.

- Công thức trong mã: `60 + 15×cấp + 0.5×SMPT`
- Mã nguồn: `src/data/heroes/luca.js:79`

**S1 — Sân Khấu Mở Ra / Bước Nhảy Ngàn Hoa**

- Hồi chiêu: 10 / 9 / 8 / 7 / 7s • Mana: 55 / 55 / 55 / 55 / 55 • Hồi chiêu bắt đầu do chiêu tự tính (ví dụ sau khi kết thúc trạng thái)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6 đv • Mục đích AI: dồn sát thương
- Mở Vùng Sân Khấu bán kính 6 đv trong 6s: trong vùng +20% tốc chạy, +15% hút máu phép. Khi sân khấu còn hiệu lực, S1 thành Bước Nhảy Ngàn Hoa: hồi chỉ 0.6s, tốn 25 mana, lướt 2.5 đv phóng cánh hoa hồng thép gây sát thương phép kẻ địch lướt qua, chạm đất NỔ HOA bán kính 1.8 (50% sát thương). Hết giờ hoặc Luca rời vòng quá 2s: HẠ MÀN — sân khấu đóng, nổ 60 (+15/cấp, +50% SMPT) sát thương phép và làm chậm 40% 1.5s mọi kẻ địch trong vòng; lúc đó S1 mới bắt đầu tính hồi chiêu.
- Mã nguồn: `src/data/heroes/luca.js:124`

**S2 — Ánh Đèn Rọi Vào Tôi Nè!**

- Hồi chiêu: 13 / 12 / 11 / 10 / 10s • Mana: 60 / 60 / 60 / 60 / 60
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: phòng thủ
- Tạo dáng 1.5s ("Trò Lừa Bịp"): đòn đầu tiên của kẻ địch bị triệt tiêu 100%, Luca hóa búp hoa dịch chuyển ra sau lưng kẻ tấn công, câm lặng 1.25s và khiến nạn nhân nhận thêm 20% sát thương phép từ Luca trong 3s (+20 Náo Nhiệt).
- Mã nguồn: `src/data/heroes/luca.js:153`

**S3 — Hoán Vị Ảnh Hồng**

- Hồi chiêu: 11 / 10 / 9 / 8 / 8s • Mana: 65 / 65 / 65 / 65 / 65
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 5 đv • Tốc đạn/lướt: 20 đv/s • Đạn định hướng (né được) • Mục đích AI: mở giao tranh
- Để lại Đóa Hồng Chiếu Ảnh (6s) rồi lao 4.5 đv: kẻ đầu tiên va phải nhận sát thương phép và choáng 0.75s. Trong 6s dùng lại để dịch chuyển về đóa hồng.
- Mã nguồn: `src/data/heroes/luca.js:159`

**S4 — Cải Trang Tuyệt Đỉnh**

- Hồi chiêu: 90 / 75 / 60s • Mana: 100 / 100 / 100 • Thi triển: 0.15s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 7.5 đv • Tốc đạn/lướt: 26 đv/s • Chỉ nhắm tướng • Mục đích AI: chiêu cuối
- Cần 100 Náo Nhiệt. Ném lá bài mạ vàng 8 đv: trúng tướng gây sát thương phép, Luca hóa trang thành tướng đó 15s — S1–S3 được thay bằng chiêu của nạn nhân (SMPT quy đổi thành SMVL nếu sao chép đấu sĩ / xạ thủ), dùng chiêu phụ để lật qua lại hai bộ chiêu. Trong 2s đầu dùng lại để đổi chỗ với nạn nhân. Hết giờ: dịch chuyển về chỗ bắt đầu tung chiêu.
- Công thức trong mã: `[150/240/330 theo cấp chiêu] + 0.7×SMPT`
- Mã nguồn: `src/data/heroes/luca.js:191`

**Skill phụ — Hoán Đổi Bộ Chiêu**

- Hồi chiêu: 1s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Khi đang Cải Trang: lật qua lại giữa bộ chiêu của Luca và bộ chiêu đang sao chép (hai bộ hồi chiêu độc lập).
- Mã nguồn: `src/data/heroes/luca.js:178`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Khán Giả Cuồng Nhiệt | Đánh thường trúng tướng +8 Náo Nhiệt (thay vì +5). |
| 1 | b | Vạt Áo Trơn Trượt | Sau Áo Choàng Thoát Hiểm: +40% tốc chạy 3s. |
| 1 | c | Hương Hoa Gai Góc | Cánh hoa của Bước Nhảy Ngàn Hoa gây chảy máu. |
| 3 | a | Ánh Đèn Chói Mắt | Ánh Đèn phản kích thành công gây thêm mù 1.5s. |
| 3 | b | Hoa Hồng Vĩnh Cửu | Đóa hồng của S3 tồn tại 8s. |
| 3 | c | Vũ Điệu Bão Tố | Mỗi lần lướt liên tiếp trong sân khấu +15% sát thương (tối đa 3 lần). |
| 6 | a | Sân Khấu Mở Rộng | Sân khấu rộng 8.5 đv. |
| 6 | b | Lật Tẩy Bất Ngờ | Đổi chỗ bằng Cải Trang làm nạn nhân choáng 1s. |
| 6 | c | Nghệ Sĩ Đào Thoát | Áo Choàng Thoát Hiểm hồi 90s. |
| 9 | a | Ảo Thuật Hoàn Hảo | Chiêu sao chép hồi nhanh hơn 30%. |
| 9 | b | Hoán Vị Nổ Tung | Dịch chuyển về đóa hồng để lại vụ nổ hoa hồng ở chỗ vừa rời. |
| 9 | c | Vỗ Tay Không Dứt | Náo Nhiệt không tụt khi ngoài giao tranh. |
| 12 | a | Thiên Tài Đạo Diễn | Phong cách: Cải Trang sao chép cả chiêu cuối của nạn nhân — dùng được 1 lần trong 15s. |
| 12 | b | Sân Khấu Tử Thần | Phong cách: lướt trong sân khấu không tốn mana và không bị làm chậm. |
| 12 | c | Ngôi Sao Đường Phố | Hạ gục tướng: +30 Náo Nhiệt. |

**Lối build gợi ý (AI dùng)**
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Thấu Thị Thảo Mộc, Hồn Phá Sóng Nhiễu Loạn, Hồn Nguyệt Thực Hắc Ám

<a id="lyra"></a>
### Lyra
> chuột lũi đại dương — khống chế chuỗi, giữ mạng, thả cột nước từ xa
> ⚠ Chưa phát hành (không xuất hiện ngẫu nhiên trong trận).

**Định danh**
- id: `lyra` • màu chủ đạo: `#4ab8e8` • vũ khí/hình ảnh: `tidestaff` • bán kính va chạm: 0.6 đv
- Vai trò: Pháp sư (Mage) • vị trí: Đường giữa, Hỗ trợ • nhãn: cc, poke
- Tầm xa • sát thương chính: phép • tài nguyên: mana
- Đạn đánh thường: kiểu `water`, tốc độ 15 đv/s
- Tính cách AI: 🐀 Chuột Lũi — Sống sót là trên hết: lủi trong bụi, tránh mọi giao tranh, chỉ cắn khi bị dồn vào góc. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh giữa trận · Ít cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1320 | 201.6 | 2932.8 | 4747.2 |
| Máu (gốc trong dữ liệu) | 550 | 84 | 1222 | 1978 |
| Mana | 420 | 50 | 820 | 1270 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 52 | 3 | 76 | 103 |
| Giáp | 22 | 3.6 | 50.8 | 83.2 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.35 | — | 3.35 | 3.35 |
| Tầm đánh | 5.5 | — | 5.5 | 5.5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Thủy Triều**

Đánh thường gây sát thương phép và làm chậm 15% 1s. Chiêu trúng tướng địch tích 1 tầng Thủy Triều (4s); đủ 3 tầng: trói chân 0.75s (mỗi mục tiêu 1 lần/6s).
- Mã nguồn: `src/data/heroes/lyra.js:32`

**S1 — Bong Bóng Nước**

- Hồi chiêu: 6 / 5.5 / 5 / 4.5 / 4s • Mana: 50 / 55 / 60 / 65 / 70 • Thi triển: 0.2s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 7.8 đv • Tốc đạn/lướt: 15 đv/s • Đạn định hướng (né được) • Mục đích AI: cấu rỉa
- Bắn bong bóng 8 đv: 60/95/130/165/200 (+60% SMPT) sát thương phép lên kẻ đầu tiên trúng, làm chậm 25% 1s. Mục tiêu đã bị làm chậm từ trước: thành choáng 1s.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/lyra.js:68`

**S2 — Sóng Dâng**

- Hồi chiêu: 11 / 10.5 / 10 / 9.5 / 9s • Mana: 60 / 65 / 70 / 75 / 80 • Thi triển: 0.2s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.5 đv • Mục đích AI: khống chế
- Đẩy con sóng 7 đv (rộng 1.4): 50/80/110/140/170 (+45% SMPT) sát thương phép, đẩy lùi 1.5/2/2.5/3/3.5 đv. Lyra nhận giáp bong bóng 8% máu tối đa; giáp vỡ hoặc hết hạn thì nổ sóng xung kích đẩy lùi kẻ địch quanh 2 đv.
- Công thức trong mã: `[50/80/110/140/170 theo cấp chiêu] + 0.45×SMPT`
- Mã nguồn: `src/data/heroes/lyra.js:82`

**S3 — Dòng Chảy**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Mana: 60 / 60 / 60 / 60 / 60
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Lyra và đồng minh thấp máu nhất trong 10 đv nhận khiên 50/80/110/140/170 (+35/35/40/40/45% SMPT) trong 2.5/3/3/3/3.5s, +30% tốc chạy 2s và hồi ngay 20% máu đã mất.
- Công thức trong mã: `[50/80/110/140/170 theo cấp chiêu] + [0.35/0.35/0.4/0.4/0.45 theo cấp chiêu]×SMPT`
- Mã nguồn: `src/data/heroes/lyra.js:99`

**S4 — Đại Hồng Thủy**

- Hồi chiêu: 110 / 95 / 80s • Mana: 100 / 100 / 100 • Thi triển: 0.25s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 10 đv • Bán kính vùng: 3.5 đv • Trễ nổ: 1s • Mục đích AI: chiêu cuối
- Niệm 0.75s (vùng cảnh báo), gọi cột nước vào điểm trong 10/20/30 đv: bán kính 3.5/5/8, 180/270/360 (+80% SMPT) sát thương phép, hất tung 1s. Để lại vực xoáy 4s: hút nhẹ về tâm, chậm 40%, sát thương mỗi 0.5s và tích Thủy Triều; Lyra và đồng minh trong xoáy hồi 3% máu mỗi giây.
- Công thức trong mã: `[180/270/360 theo cấp chiêu] + 0.8×SMPT`
- Mã nguồn: `src/data/heroes/lyra.js:117`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Chuột Bụi Thủy Tộc | Trong bụi: +1 tầm đánh, đòn đánh làm chậm 30% (thay vì 15%). |
| 1 | b | Bong Bóng Bật Nảy | Bong Bóng trúng đích nảy sang 1 mục tiêu khác trong 4 đv (60% sát thương, làm chậm). |
| 1 | c | Bọt Tốc Hành | Đánh trúng tướng: +5% tốc chạy 2s (cộng dồn 3 lần). |
| 3 | a | Bọt Khí Chắn Lối | Giáp bong bóng của Sóng Dâng vỡ: để lại 3 bong bóng bẫy 6s, trói chân 0.75s. |
| 3 | b | Mạch Nước Ngầm | Dòng Chảy hồi 35% máu đã mất nếu người nhận dưới 30% máu. |
| 3 | c | Triều Cường Cắt Góc | Sóng Dâng rộng 2.8 đv, hất tung nhẹ 0.3s kẻ đầu tiên trúng. |
| 6 | a | Ẩn Ngư Dưới Cát | Rời giao tranh 4s: ngụy trang; đòn đánh đầu tiên sau khi lộ diện choáng 1s. |
| 6 | b | Sóng Thần Xuyên Phá | Sóng Dâng đẩy kẻ địch vào tường: choáng 1s và phá 200 Hộ Giáp. |
| 6 | c | Thủy Giáp Phản Hồi | Khiên Dòng Chảy chuyển 30% sát thương phép nhận vào thành mana. |
| 9 | a | Thủy Thuẫn Niệm Chú | Lúc niệm Đại Hồng Thủy: giáp ảo 30% máu tối đa, miễn khống chế; giáp chưa vỡ thì hoàn 50% mana chiêu cuối. |
| 9 | b | Quần Thể Thủy Trụ | Đại Hồng Thủy kèm 4 cột nước phụ quanh Lyra (bán kính 2): hất văng kẻ áp sát 3 đv, 50% sát thương chiêu cuối. |
| 9 | c | Vực Xoáy Tử Địa | Vực xoáy cấm lướt và dây móc. |
| 12 | a | Đại Dương Bao La | Phong cách: Đại Hồng Thủy không giới hạn tầm, bán kính luôn 8 đv. |
| 12 | b | Vua Bụi Rậm Biển Sâu | Phong cách: bo 5–6, đứng trong bụi hồi chiêu nhanh hơn 40%, đòn đánh bắn 2 tia nước. |
| 12 | c | Nước Mắt Nữ Thần | Phong cách: đòn chí tử → bọc bong bóng bất tử 2.5s, hồi 40% máu rồi nổ hất văng kẻ địch 4 đv (180s). |

**Lối build gợi ý (AI dùng)**
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Bảo Hộ: giày Giày Khai Sáng → Đèn Lồng Tinh Linh → Lư Hương Cổ → Kính Cú Đêm → Ngọc Bội Hộ Mệnh → Khiên Lâm Thần
- Mảnh hồn yêu thích: Hồn Tiên Tri Vòng Bo, Hồn Ưng Nhãn, Hồn Thiên Nhãn Xuyên Giới

<a id="mirage"></a>
### Mirage

**Định danh**
- id: `mirage` • màu chủ đạo: `#c9a0ff` • vũ khí/hình ảnh: `wand` • bán kính va chạm: 0.56 đv
- Vai trò: Pháp sư (Mage) • vị trí: Đường giữa • nhãn: stealth, illusion
- Tầm xa • sát thương chính: phép • tài nguyên: không dùng mana
- Đạn đánh thường: kiểu `mirror`, tốc độ 20 đv/s
- Thanh tài nguyên riêng: **Náo Nhiệt** (0–100, màu `#e0b0ff`).
- Tính cách AI: 🎭 Kẻ Bịp Bợm — Gạ đổi chác / liên minh với bất kỳ ai để lừa: bán mảnh dỏm giá cao, đổi gian, báo tin giả dụ người ta vào bẫy của mình; liên minh tạm thì gần như chắc chắn bịp; ai từng bị lừa thì không tin nữa. • Phong cách đánh: 🗡 Sát thủ phép — Đọc vị mục tiêu: máu giấy thì lao vào dồn sát thương rồi rút; trâu bò thì cấu rỉa tới ngưỡng kết liễu. Thấy đối thủ hụt chiêu lớn là lao vào ngay.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: bạn: Alice, Luca • bảo vệ: Alice, Vesper • thù: Dr. Caelus, Dr. Vector

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1320 | 206.4 | 2971.2 | 4828.8 |
| Máu (gốc trong dữ liệu) | 550 | 86 | 1238 | 2012 |
| Mana | 420 | 50 | 820 | 1270 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 52 | 3 | 76 | 103 |
| Giáp | 24 | 3.6 | 52.8 | 85.2 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.45 | — | 3.45 | 3.45 |
| Tầm đánh | 5.2 | — | 5.2 | 5.2 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Hiện Diện Náo Nhiệt • Đại Thoát Hiểm • Đòn Đánh Ảo Ấn**

Chiêu tốn Náo Nhiệt (thay mana) — chỉ cần có mặt trên sàn đấu là +4 Náo Nhiệt mỗi giây (+50% khi ở gần Alice / Luca). Dưới 25% máu (120s): tàng hình 2.5s, dịch chuyển 5 đv, để lại 4 phân ảnh chạy toán loạn. Đánh thường gây sát thương phép và găm Ảo Ấn 5s; đòn / chiêu kế tiếp kích nổ thêm 6% máu tối đa.
- Mã nguồn: `src/data/heroes/mirage.js:54`

**S1 — Tàn Ảnh Lướt Xuyên**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 5 đv • Đạn định hướng (né được) • Mục đích AI: mở giao tranh
- Tốn 20 Náo Nhiệt: vào trạng thái Tàn Ảnh 2s (không thể bị chọn, +35% tốc chạy), lướt 3 đv và để lại ảo ảnh tĩnh ở điểm xuất phát. Kẻ địch bị lướt xuyên qua bị găm Dấu Ấn; hết Tàn Ảnh, dấu ấn nổ bằng 40% sát thương nạn nhân đã nhận trong lúc bị găm. Dùng lại trong 2s: giật về ảo ảnh và kích nổ sớm.
- Mã nguồn: `src/data/heroes/mirage.js:87`

**S2 — Phi Dao Hoán Vị**

- Hồi chiêu: 11 / 10 / 9.5 / 9 / 8.5s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 8.5 đv • Tốc đạn/lướt: 24 đv/s • Chỉ nhắm tướng • Mục đích AI: cấu rỉa
- Tốn 25 Náo Nhiệt: ném phi dao 9 đv, trúng tướng gây sát thương phép và cắm 3s. Dùng lại trong 3.5s: búng tay hoán đổi vị trí với nạn nhân, choáng nó 1s.
- Công thức trong mã: `[70/105/140/175/210 theo cấp chiêu] + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/mirage.js:104`

**S3 — Hộp Tử Thần**

- Hồi chiêu: 13 / 12 / 11 / 10 / 9.5s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Mục đích AI: logic riêng của tướng
- Tốn 30 Náo Nhiệt: đặt vùng cảnh báo đỏ bán kính 6.5 đv tại chỗ hoặc một điểm trong 8 đv; sau 2.2s phát nổ — sát thương phép CỰC LỚN, CHOÁNG 1.25s mọi mục tiêu bên trong và phá 350 Hộ Giáp. (Combo: Phi Dao trúng → Hộp Tử Thần dưới chân → dùng lại Phi Dao đổi chỗ, ném nạn nhân vào tâm vụ nổ.)
- Công thức trong mã: `[230/330/430/530/640 theo cấp chiêu] + 1.4×SMPT`
- Mã nguồn: `src/data/heroes/mirage.js:127`

**S4 — Nghệ Thuật Ảo Ảnh: Phân Thân Hoàn Hảo**

- Hồi chiêu: 85 / 70 / 55s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 7 đv • Mục đích AI: chiêu cuối
- Tốn 50 Náo Nhiệt: tạo Phân Thân Hoàn Hảo 15s (máu 100% bản gốc, mang theo trang bị & mảnh hồn, tự đánh, tự né, tự dùng Phi Dao và Hộp Tử Thần thu nhỏ); bị phá hoặc hết giờ thì nổ bán kính 4 đv: sát thương phép và choáng 1.5s. Dùng lại (hồi riêng 4s): đổi chỗ với phân thân. Nội tại: học chiêu này thì mọi ảo ảnh đều đánh thường (35% sát thương).
- Công thức trong mã: `[150/240/330 theo cấp chiêu] + 0.8×SMPT` • `50 + 12×cấp + 0.45×SMPT`
- Mã nguồn: `src/data/heroes/mirage.js:167`

**Skill phụ — Biến Ảnh / Phân Hình**

- Hồi chiêu: động (xem mô tả)s
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: phòng thủ
- Sẵn sàng: tạo một ảo ảnh tĩnh 8s tại chỗ. Khi đã có ảo ảnh: đổi vị trí tức thì với ảo ảnh an toàn nhất. Hồi 12s → 4s theo cấp.
- Mã nguồn: `src/data/heroes/mirage.js:151`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Tự Nhiên Thăng Hoa | Náo Nhiệt tự tăng 6/giây (thay vì 4). |
| 1 | b | Phi Dao Tầm Xa | Phi Dao bay 12 đv. |
| 1 | c | Ảo Ảnh Rắn Rỏi | Ảo ảnh có thêm 50% máu. |
| 3 | a | Hoán Vị Câm Lặng | Đổi chỗ bằng Phi Dao câm lặng thêm 1s. |
| 3 | b | Hộp Nổ Kép | Hộp Tử Thần để lại sương khói làm chậm 50% trong 3s. |
| 3 | c | Tàn Ảnh Rộng Mở | Tàn Ảnh lướt xa thêm 2 đv. |
| 6 | a | Ảo Ảnh Đao Phong | Ảo ảnh đánh 60% sát thương (thay vì 35%). |
| 6 | b | Thoát Hiểm Kép | Đại Thoát Hiểm hồi 80s. |
| 6 | c | Dấu Ấn Xuyên Thấu | Dấu Ấn Tàn Ảnh nổ xuyên 50% Hộ Giáp. |
| 9 | a | Vụ Nổ Phân Thân Hủy Diệt | Phân Thân Hoàn Hảo nổ mạnh hơn 50% và cấm dây móc 3s. |
| 9 | b | Hoán Vị Không Giới Hạn | Đổi chỗ với phân thân hồi 1.5s. |
| 9 | c | Ảo Ấn Tử Thần | Kích nổ Ảo Ấn giảm 1s hồi chiêu S1 và S2. |
| 12 | a | Ảo Mộng Tuyệt Đối | Phong cách: chiêu cuối tạo 2 Phân Thân Hoàn Hảo. |
| 12 | b | Ván Cược Cứu Rỗi | Phong cách: Alice hoặc Luca bị hạ gục → +30% Công Phép vĩnh viễn và làm mới mọi hồi chiêu. |
| 12 | c | Sân Khấu Vĩnh Hằng | +15% hồi chiêu. (+15% Giảm hồi chiêu) |

**Lối build gợi ý (AI dùng)**
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Thấu Thị Thảo Mộc, Hồn Phá Sóng Nhiễu Loạn, Hồn Nguyệt Thực Hắc Ám

<a id="olivia"></a>
### Olivia

**Định danh**
- id: `olivia` • màu chủ đạo: `#ffe9a0` • vũ khí/hình ảnh: `lightstaff` • bán kính va chạm: 0.56 đv
- Vai trò: Hỗ trợ (Support) • vị trí: Hỗ trợ • nhãn: heal, cc
- Tầm xa • sát thương chính: phép • tài nguyên: mana
- Đạn đánh thường: kiểu `holy`, tốc độ 18 đv/s
- Thanh tài nguyên riêng: **Đức Tin** (0–100, màu `#ffe08a`).
- Tính cách AI: 📿 Cuồng Tín — Truy sát "dị giáo" (Death) tới cùng trời cuối đất, kể cả ngoài bo. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: bạn: Justus, Ariston, Valerius • bảo vệ: Justus

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1380 | 211.2 | 3069.6 | 4970.4 |
| Máu (gốc trong dữ liệu) | 575 | 88 | 1279 | 2071 |
| Mana | 380 | 45 | 740 | 1145 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 50 | 2.6 | 70.8 | 94.2 |
| Giáp | 28 | 3.9 | 59.2 | 94.3 |
| Kháng phép | 30 | 1.5 | 42 | 55.5 |
| Tốc đánh | 0.62 | +1.5% | 0.69 | 0.78 |
| Tốc chạy | 3.35 | — | 3.35 | 3.35 |
| Tầm đánh | 5.5 | — | 5.5 | 5.5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Đức Tin Tự Sinh • Thánh Ý Bảo Hộ • Thánh Niệm**

Đức Tin tự hồi 3/giây (gấp đôi cạnh đồng minh); trên 50 Đức Tin: +50% hồi mana. Mỗi 15s nhận Khiên Phép = 12% máu tối đa + 25% SMPT (chỉ đỡ sát thương phép). Đánh thường là tia phép 5.5 đv (100% SMVL + 30% SMPT), trúng tướng +5 Đức Tin.
- Mã nguồn: `src/data/heroes/olivia.js:16`

**S1 — Dây Dẫn Thánh Linh / Trận Pháp Cứu Rỗi**

- Hồi chiêu: 11 / 10 / 9 / 8 / 8s • Mana: 60 / 60 / 60 / 60 / 60 • Thi triển: 0.12s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 8 đv • Mục đích AI: khống chế
- Lên kẻ địch: xích thánh trói chân 1.25–2s và gây sát thương phép. Lên đồng minh: hồi máu tức thì và kéo đồng minh lướt về cạnh Olivia. Có đủ 25 Đức Tin và kẻ địch đứng gần nhau: đặt Thánh Trận ở xa — 1.5s sau kích nổ, trói chân 1.5s mọi kẻ địch trong vùng, hồi máu và thanh tẩy đồng minh trong vùng.
- Công thức trong mã: `[60/90/120/150/180 theo cấp chiêu] + 0.55×SMPT` • `[80/110/140/170/200 theo cấp chiêu] + 0.5×SMPT`
- Mã nguồn: `src/data/heroes/olivia.js:47`

**S2 — Thánh Hộ Thể**

- Hồi chiêu: 10 / 9 / 8 / 7 / 7s • Mana: 65 / 65 / 65 / 65 / 65 • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Tốn 20 Đức Tin: mọi đồng minh trong 5 đv (kể cả Olivia) nhận Giáp Ảo = 25% máu đã mất + 10% SMPT trong 3.5s — càng thấp máu giáp càng dày.
- Mã nguồn: `src/data/heroes/olivia.js:81`

**S3 — Thánh Lễ Thanh Trừng**

- Hồi chiêu: 14 / 13 / 12 / 11 / 11s • Mana: 80 / 80 / 80 / 80 / 80 • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Tốn 30 Đức Tin: vùng Thánh Lễ bán kính 4 đv trong 4s. Đồng minh trong vùng hồi máu mỗi giây, +15–30% sát thương, +25% tốc chạy. Kẻ địch trong vùng bị xóa mọi khiên / cường hóa / tăng tốc khi Thánh Lễ mở và bị thiêu nhẹ liên tục.
- Công thức trong mã: `[15/22/30/38/45 theo cấp chiêu] + 0.12×SMPT`
- Mã nguồn: `src/data/heroes/olivia.js:100`

**S4 — Thánh Linh Ban Phước**

- Hồi chiêu: 120 / 105 / 90s • Mana: 100 / 100 / 100 • Thi triển: 0.4s
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Hồi máu lớn cho mọi đồng minh trên khắp đấu trường (+50% nếu dưới 40% máu), +30% tốc chạy 4s; đồng minh thấp máu nhất nhận Siêu Giáp Ánh Sáng = 35% máu tối đa của Olivia trong 5s.
- Công thức trong mã: `[200/320/440 theo cấp chiêu] + 0.8×SMPT`
- Mã nguồn: `src/data/heroes/olivia.js:136`

**Skill phụ — Ý Chí Thần Quan**

- Hồi chiêu: 20s
- Nhắm: Tự thân / quanh mình (self) • Mục đích AI: logic riêng của tướng
- Quỳ cầu nguyện tối đa 4s: mỗi giây hồi 4% máu và 5% mana. Bị tướng hoặc quái lớn đánh là ngắt.
- Mã nguồn: `src/data/heroes/olivia.js:127`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Đức Tin Dồi Dào | Đức Tin tự hồi 5/giây (thay vì 3). |
| 1 | b | Thánh Ý Cường Hóa | Khiên Phép đỡ thêm 20% sát thương chuẩn. |
| 1 | c | Cầu Nguyện Thanh Tịnh | Cầu nguyện hồi thêm 2% máu mỗi giây. |
| 3 | a | Dây Dẫn Tăng Tốc | Đồng minh được kéo về: +40% tốc chạy 2s. |
| 3 | b | Thánh Giáp Kháng Bộc Phá | Giáp của Thánh Hộ Thể giảm thêm 15% sát thương nhận. |
| 3 | c | Thánh Niệm Xuyên Thấu | Đánh thường trúng tướng giảm 15% Kháng Phép của nó 3s. |
| 6 | a | Thánh Trận Cự Ly Xa | Thánh Trận rộng hơn 25%. |
| 6 | b | Thanh Trừng Triệt Để | Kẻ bị Thánh Lễ xóa cường hóa không nhận được giáp ảo mới 2.5s. |
| 6 | c | Khúc Cầu Nguyện Vội Vã | Cầu nguyện chỉ cần 1.5s để hồi trọn phần 4s. |
| 9 | a | Thánh Linh Bất Diệt | Chiêu cuối cho cả đội miễn khống chế nhẹ 4s. |
| 9 | b | Thánh Lễ Cuồng Tín | Đồng minh trong Thánh Lễ hút máu 15%. |
| 9 | c | Dây Trói Thần Phạt | Xích trói lan sang 1 kẻ địch đứng cạnh. |
| 12 | a | Đại Nữ Tu Tối Cao | Phong cách: chiêu cuối mở thêm vòng Thánh Lễ dưới chân mỗi đồng minh. |
| 12 | b | Cứu Rỗi Tuyệt Đối | Phong cách: giáp Thánh Hộ Thể bị phá thì nổ, choáng 1s kẻ địch quanh đồng minh. |
| 12 | c | Ánh Sáng Bền Bỉ | +300 máu tối đa. (+300 Máu) |

**Lối build gợi ý (AI dùng)**
- Bảo Hộ: giày Giày Khai Sáng → Đèn Lồng Tinh Linh → Lư Hương Cổ → Kính Cú Đêm → Ngọc Bội Hộ Mệnh → Khiên Lâm Thần
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Ưng Nhãn, Hồn Phá Ảo Chân Thị, Hồn Thiên Nhãn Xuyên Giới

<a id="percy"></a>
### Percy

**Định danh**
- id: `percy` • màu chủ đạo: `#4ae0d0` • vũ khí/hình ảnh: `crossbow` • bán kính va chạm: 0.58 đv
- Vai trò: Xạ thủ (Marksman) • vị trí: Xạ thủ (đường dưới) • nhãn: autos
- Tầm xa • sát thương chính: vật lý • tài nguyên: mana
- Đạn đánh thường: kiểu `arrow`, tốc độ 26 đv/s
- Tính cách AI: 🐺 Thợ Săn Bắt Lẻ — Không bao giờ chen vào trận có 3 người trở lên; đi dọc rìa vắng, ép 1v1 kẻ đi lẻ. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh cuối trận · Cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1344 | 211.2 | 3033.6 | 4934.4 |
| Máu (gốc trong dữ liệu) | 560 | 88 | 1264 | 2056 |
| Mana | 320 | 40 | 640 | 1000 |
| Hồi mana/s (thực tế, ×1.6) | 2.56 | 0.13 | 3.58 | 4.74 |
| SMVL | 54 | 3.3 | 80.4 | 110.1 |
| Giáp | 26 | 3.8 | 56.4 | 90.6 |
| Kháng phép | 30 | 1.3 | 40.4 | 52.1 |
| Tốc đánh | 0.7 | +3% | 0.87 | 1.06 |
| Tốc chạy | 3.62 | — | 3.62 | 3.62 |
| Tầm đánh | 6 | — | 6 | 6 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Dồn Dập**

Sát thương gốc yếu nhưng chạy nhanh. Mỗi phát bắn trúng (đánh thường hoặc tên Trận Địa) +10% sát thương (tối đa 8 tầng = +80%); 2.5s không bắn trúng thì mất hết.
- Mã nguồn: `src/data/heroes/percy.js:56`

**S1 — Trận Địa Nỏ**

- Hồi chiêu: 8 / 7.5 / 7 / 6.5 / 6s • Mana: 50 / 50 / 50 / 50 / 50 • Hồi chiêu bắt đầu do chiêu tự tính (ví dụ sau khi kết thúc trạng thái) • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 10 đv • Mục đích AI: dồn sát thương
- ĐỨNG YÊN mở trận địa bán kính [10, 15, 18, 20, 25] tối đa [5, 8, 8, 8, 10]s: mỗi 0.15s tự bắn một mũi tên (24% SMVL, cộng Dồn Dập) vào kẻ địch gần nhất trong vùng. Di chuyển thì dừng (Lướt Chiến Thuật dời trận địa theo). Chỉ hồi chiêu khi trận địa kết thúc.
- Công thức trong mã: `60 + 12×ucấp + 0.8×SMVL`
- Mã nguồn: `src/data/heroes/percy.js:79`

**S2 — Móc & Đạp**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Mana: 50 / 50 / 50 / 50 / 50 • Thi triển: 0.12s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.6 đv • Tốc đạn/lướt: 24 đv/s • Chỉ nhắm tướng • Mục đích AI: khống chế
- Bắn móc 7 đv: kéo kẻ trúng về sát Percy, choáng 0.75s rồi đạp văng 3.5 đv. Dùng được khi đang mở Trận Địa.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/percy.js:97`

**S3 — Lướt Chiến Thuật**

- Hồi chiêu: 6 / 6 / 5.5 / 5.5 / 5s • Mana: 30 / 30 / 30 / 30 / 30
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 4 đv • Mục đích AI: thoát thân
- Lướt 4 đv theo hướng chỉ định; dùng khi đang mở Trận Địa thì dời trận địa theo (không làm dừng).
- Mã nguồn: `src/data/heroes/percy.js:118`

**S4 — Liên Châu**

- Hồi chiêu: 80 / 70 / 60s • Mana: 100 / 100 / 100
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Mục đích AI: chiêu cuối
- 4s: mỗi phát đánh thường và mỗi loạt Trận Địa bắn ra 3 mũi tên thay vì 1 (mũi phụ 60%).
- Mã nguồn: `src/data/heroes/percy.js:130`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Bộ Đếm Tinh Vi | Dồn Dập giữ được 3.5s (thay vì 2.5s) khi không bắn trúng. |
| 1 | b | Tầm Bắn Thần Tốc | +0.6 tầm bắn; Trận Địa Nỏ rộng hơn 25%. (+0.6 Tầm đánh) |
| 1 | c | Cơ Động Lách Trận | Lướt Chiến Thuật hồi chiêu nhanh hơn 1.5s. |
| 3 | a | Dây Cáp Điện Cao Thế | Móc & Đạp trúng kẻ đang lướt hoặc tăng tốc: câm lặng 2s và choáng 1s. |
| 3 | b | Ụ Súng Gia Cố | Rời Trận Địa Nỏ: trận địa vẫn tự bắn thêm 2s tại chỗ cũ. |
| 3 | c | Mũi Tên Gỉ Sét | Tên của Trận Địa Nỏ làm chậm 40%. |
| 6 | a | Phát Bắn Bùng Nổ | Đang mở Trận Địa: dùng lại để bắn phát pháo cuối nổ hình nón đẩy lùi 2.5 đv; Percy giật lùi 3 đv và tàng hình 1s trong khói. |
| 6 | b | Lưới Điện Trói Buộc | Móc & Đạp thành lưới điện: trói chân 1.5s và cấm lướt 3s (không kéo lại). |
| 6 | c | Hộp Đạn Dự Trữ | Dồn Dập giữ được 4s khi bắn trượt. |
| 9 | a | Bão Tên Vô Hạn | Trong Liên Châu, mỗi loạt Trận Địa bắn 5 mũi (thay vì 3). |
| 9 | b | Móc Kép Tinh Xảo | Móc & Đạp dùng được 2 lần liên tiếp (trong 3s). |
| 9 | c | Công Nghệ Áp Chế | Kẻ vừa dính Móc & Đạp mà trúng tên Trận Địa trong 3s: cấm lướt 3s. |
| 12 | a | Drone Phòng Vệ | Lướt Chiến Thuật thả drone 3s, bắn hạ mọi đạn bay vào Percy. |
| 12 | b | Đạn Xuyên Phá | Tên đánh thường xuyên qua mục tiêu: kẻ phía sau nhận 50% và bị đẩy nhẹ. |
| 12 | c | Pháo Thủ Biến Hóa | Trận Địa Nỏ không bị dừng khi di chuyển (nhưng bắn chậm hơn 25% khi đang đi). |

**Lối build gợi ý (AI dùng)**
- Tốc Đánh: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Cung Thần Phong → Dao Cắt Gân → Cung Gió Lốc → Huyết Kiếm Đoạt Mệnh
- Chí Mạng: giày Giày Cuồng Chiến → Đao Phá Quân → Cung Gió Lốc → Kiếm Bão Táp → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Xạ Thủ Xuyên Vân, Hồn Xuyên Cực Vạn Dặm, Hồn Tuyệt Đích Bất Suy

<a id="ratok"></a>
### Ratok

**Định danh**
- id: `ratok` • màu chủ đạo: `#a0582a` • vũ khí/hình ảnh: `hookchain` • bán kính va chạm: 0.66 đv
- Vai trò: Đỡ đòn (Tank) • vị trí: Hỗ trợ, Đường trên • nhãn: cc, engage, hook
- Cận chiến • sát thương chính: vật lý • tài nguyên: mana
- Tính cách AI: 🔥 Hổ Báo — Thích lao vào đánh, ít chịu rút, hay đi săn. • Phong cách đánh: 🛡 Lì đòn — Đã vào trận là đánh tới cùng, không bỏ chạy.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải
- Quan hệ cốt truyện: bạn: Borg

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1728 | 259.2 | 3801.6 | 6134.4 |
| Máu (gốc trong dữ liệu) | 720 | 108 | 1584 | 2556 |
| Mana | 300 | 40 | 620 | 980 |
| Hồi mana/s (thực tế, ×1.6) | 2.24 | 0.13 | 3.26 | 4.42 |
| SMVL | 66 | 4 | 98 | 134 |
| Giáp | 34 | 4.2 | 67.6 | 105.4 |
| Kháng phép | 32 | 2 | 48 | 66 |
| Tốc đánh | 0.66 | +2% | 0.77 | 0.88 |
| Tốc chạy | 3.5 | — | 3.5 | 3.5 |
| Tầm đánh | 1.8 | — | 1.8 | 1.8 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Ràng Buộc Thép • Thiết Phá**

+12 Giáp và +12 Kháng Phép với mỗi tướng địch trong 4 đv; từ 3 tướng địch trở lên: +25% kháng hiệu ứng. Mỗi 12s đòn đánh kế tiếp được cường hóa: thêm 6% máu tối đa sát thương vật lý và choáng 0.75s; mỗi đòn đánh trúng giảm 1s hồi chiêu nội tại này.
- Mã nguồn: `src/data/heroes/ratok.js:11`

**S1 — Móc Sắt Rỉ Sét**

- Hồi chiêu: 14 / 13 / 12 / 11 / 11s • Mana: 70 / 70 / 70 / 70 / 70 • Thi triển: 0.2s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 8.2 đv • Tốc đạn/lướt: 24 đv/s • Đạn định hướng (né được) • Chỉ nhắm tướng • Mục đích AI: mở giao tranh
- Phóng móc xích 8.5 đv: trúng kẻ đầu tiên gây sát thương vật lý và móc chặt 1s (kẻ bị móc không đi xa hơn được). Dùng lại trong lúc móc: giật mạnh kéo nạn nhân bay về sát Ratok, thêm sát thương và làm chậm 30% 1.5s.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/ratok.js:37`

**S2 — Bộc Phá Húc**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8.5s • Mana: 50 / 50 / 50 / 50 / 50
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 4 đv • Tốc đạn/lướt: 18 đv/s • Mục đích AI: mở giao tranh
- Lao 3.5 đv húc văng kẻ đầu tiên: sát thương vật lý, choáng 0.75s. Nếu có kẻ đang dính Móc Sắt: thành Đột Kích Điểm Nổ — co xích lao thẳng tới nạn nhân bất kể khoảng cách, dậm nổ choáng 1.25s mọi kẻ địch quanh đó.
- Công thức trong mã: `[55/85/115/145/175 theo cấp chiêu] + 0.5×SMVL`
- Mã nguồn: `src/data/heroes/ratok.js:66`

**S3 — Tử Xích Toàn Phong**

- Hồi chiêu: 9 / 8 / 7 / 6 / 6s • Mana: 60 / 60 / 60 / 60 / 60
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 3 đv • Mục đích AI: khống chế
- Vung xích quay tròn bán kính 3 đv: sát thương vật lý, hút mọi kẻ địch trúng chiêu về sát Ratok và ngắt chiêu đang niệm.
- Công thức trong mã: `[50/80/110/140/170 theo cấp chiêu] + 0.5×SMVL`
- Mã nguồn: `src/data/heroes/ratok.js:87`

**S4 — Tàn Phá Thế Giới**

- Hồi chiêu: 100 / 85 / 70s • Mana: 100 / 100 / 100
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 10.5 đv • Bán kính vùng: 3.5 đv • Mục đích AI: chiêu cuối
- Quay đại xích rồi cắm móc neo vào điểm cách tối đa 11 đv (cảnh báo đỏ 0.75s), sau đó kéo thân mình bay như đạn pháo tới, dộng sập mặt đất: sát thương vật lý lớn diện rộng và hất tung 1.5s.
- Công thức trong mã: `[180/280/380 theo cấp chiêu] + 0.9×SMVL`
- Mã nguồn: `src/data/heroes/ratok.js:101`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Khí Áp Cống Ngầm | Đánh thường trúng tướng giảm 1.5s hồi chiêu Móc Sắt. |
| 1 | b | Bảo Hộ Gai Góc | Ràng Buộc Thép +17 Giáp / Kháng Phép mỗi tướng địch (thay vì 12). |
| 1 | c | Bước Chân Thợ Săn | +20% tốc chạy khi có kẻ đang dính Móc Sắt. |
| 3 | a | Xích Nặng | Giữ xích 1.5s. |
| 3 | b | Dư Chấn Quét Sàn | Tử Xích để lại vũng nhớt làm chậm 50% trong 2s. |
| 3 | c | Đập Phá Liên Hoàn | Thiết Phá hồi 8s. |
| 6 | a | Khiên Bộc Phá | Đột Kích Điểm Nổ cho giáp ảo 15% máu tối đa 3s. |
| 6 | b | Thịt Dày | +400 máu tối đa. (+400 Máu) |
| 6 | c | Xuyên Đột | Bộc Phá Húc miễn làm chậm. |
| 9 | a | Móc Đoạt Mệnh | Kéo trúng tướng: hoàn 50% hồi chiêu Móc Sắt. |
| 9 | b | Vực Sâu Sụp Đổ | Chiêu cuối cấm lướt / dịch chuyển kẻ địch bên trong 3s. |
| 9 | c | Bền Bỉ Vô Song | Dưới 30% máu: xóa khống chế và hồi 20% máu đã mất trong 4s (60s). |
| 12 | a | Đao Phủ Bắt Lẻ | Phong cách: Móc Sắt xa 12 đv, kéo trúng cấm lướt / tốc biến 2s. |
| 12 | b | Cỗ Máy Mở Giao Tranh | Phong cách: chiêu cuối cảnh báo 0.4s; hất tung ≥2 tướng thì giảm nửa hồi chiêu S1–S3. |
| 12 | c | Xích Neo Ngàn Cân | +15% kháng hiệu ứng. (+15% Kháng hiệu ứng) |

**Lối build gợi ý (AI dùng)**
- Đỡ Đòn: giày Giày Thép → Vương Miện Bất Khả Xâm Phạm → Giáp Gai → Áo Giáp Dung Nham → Trái Tim Cự Thạch → Áo Choàng Thánh Linh
- Hộ Vệ: giày Giày Thép → Khiên Lâm Thần → Chuông Thức Tỉnh → Vương Miện Bất Khả Xâm Phạm → Giáp Ma Quái → Áo Choàng Thánh Linh
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Mảnh hồn yêu thích: Hồn Phi Thân Trảm Kích, Hồn Titan Phá Giới, Hồn Thính Giác Địa Chấn

<a id="raven"></a>
### Raven

**Định danh**
- id: `raven` • màu chủ đạo: `#6a7a9a` • vũ khí/hình ảnh: `rifle` • bán kính va chạm: 0.58 đv
- Vai trò: Xạ thủ (Marksman) • vị trí: Hỗ trợ, Xạ thủ (đường dưới) • nhãn: stealth, poke
- Tầm xa • sát thương chính: vật lý • tài nguyên: mana
- Đạn đánh thường: kiểu `bullet`, tốc độ 34 đv/s
- Dùng **súng & băng đạn**: đánh thường tốn đạn, hết đạn phải nạp (xem nội tại).
- Tính cách AI: ⛰ Tiên Tri Địa Hình — Ngại đánh trên đất bằng; chiếm chỗ cao bằng dây móc và đứng đó mà bắn; bị kéo xuống thì leo lại. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh đầu trận · Cần đồ vừa phải

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1320 | 211.2 | 3009.6 | 4910.4 |
| Máu (gốc trong dữ liệu) | 550 | 88 | 1254 | 2046 |
| Mana | 320 | 40 | 640 | 1000 |
| Hồi mana/s (thực tế, ×1.6) | 2.56 | 0.13 | 3.58 | 4.74 |
| SMVL | 55 | 3.3 | 81.4 | 111.1 |
| Giáp | 26 | 3.8 | 56.4 | 90.6 |
| Kháng phép | 30 | 1.3 | 40.4 | 52.1 |
| Tốc đánh | 0.6 | +2.5% | 0.72 | 0.86 |
| Tốc chạy | 3.35 | — | 3.35 | 3.35 |
| Tầm đánh | 7.2 | — | 7.2 | 7.2 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Sát Thủ Chuyên Nghiệp**

Hai băng đạn độc lập (bản Legacy): SÚNG TRƯỜNG 30 viên (mỗi phát 3 viên, nạp 3s) — mục tiêu càng xa đạn càng mạnh (tối đa +25% từ 8 đv) • SÚNG TỈA 5 viên (nạp 6s, mỗi viên ×1.6 sát thương). Thấy kẻ địch ngoài tầm súng trường thì đứng lại NGẮM: tầm +7.5; khi quạ Oca còn sống, tầm gần như vô hạn — bắn bất cứ kẻ nào Oca / Raven nhìn thấy, liên tục tới khi Oca bị hạ. Di chuyển là thôi ngắm. Chỉ nạp khi bắn cạn băng; tốc đánh và Tốc Nạp rút ngắn thời gian nạp.
- Mã nguồn: `src/data/heroes/raven.js:177`

**S1 — Bắn Tỉa Xuyên Phá**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Mana: 50 / 55 / 60 / 65 / 70 • Thi triển: động (theo trạng thái)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 13 đv • Tốc đạn/lướt: 40 đv/s • Chỉ nhắm tướng • Mục đích AI: cấu rỉa
- Ngắm 0.75s rồi bắn 1 phát tầm cực xa (14 đv). Bị áp sát (dưới 2.2 đv): lăn lùi 3 đv (né đòn khi lăn) rồi mới bóp cò. Mục tiêu bị Oca đánh dấu: đạn xuyên địa hình và phá lá chắn.
- Công thức trong mã: `[100/150/200/250/300 theo cấp chiêu] + 1.0×SMVL`
- Mã nguồn: `src/data/heroes/raven.js:227`

**S2 — Quạ Cơ Giới Oca**

- Hồi chiêu: 22 / 21 / 20 / 19 / 18s • Mana: 60 / 60 / 60 / 60 / 60
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 40 đv • Mục đích AI: logic riêng của tướng
- Thả quạ cơ giới bay thẳng (qua cả tường) tới điểm trong 40 đv rồi TỰ TÌM CON MỒI YẾU MÁU (trong 26 đv quanh nó), lượn trên đầu nó 20s: cho tầm nhìn 10 đv, lộ tàng hình; mỗi giây thả bom mini vào 1 kẻ địch trong 4 đv — làm chậm 30% và đánh dấu 4s. Oca có máu riêng và có thể bị bắn hạ. Oca còn sống: tầm súng tỉa gần như vô hạn. Thả quạ từ chỗ an toàn thì Raven đổi sang SÚNG NGẮM: đứng yên, tầm bắn +7.5 (bắn qua tầm nhìn của quạ), chậm hơn 35% nhưng mỗi viên mạnh hơn 45%; di chuyển hoặc Oca chết thì đổi lại súng trường.
- Công thức trong mã: `100 + 20×cấp + 0.8×SMVL`
- Mã nguồn: `src/data/heroes/raven.js:256`

**S3 — Kỹ Thuật Ẩn Nấp**

- Hồi chiêu: 18 / 17 / 16 / 15 / 14s • Mana: 50 / 50 / 50 / 50 / 50
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 4 đv • Mục đích AI: thoát thân
- Bom khói bán kính 3 trong 3s: Raven tàng hình khi đứng trong khói, kẻ địch trong khói bị mù.
- Mã nguồn: `src/data/heroes/raven.js:268`

**S4 — Màn Đêm Vĩnh Cửu**

- Hồi chiêu: 120 / 100 / 80s • Mana: 100 / 100 / 100 • Thi triển: 0.2s
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 9 đv • Mục đích AI: chiêu cuối
- 5s: tầm nhìn mọi tướng đối phương co còn 40%; Raven tàng hình (nổ súng thì lộ 1.2s), đạn +30% sát thương.
- Mã nguồn: `src/data/heroes/raven.js:283`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Nạp Đạn Nhanh | Nạp băng súng trường 2.2s (thay vì 3s). |
| 1 | b | Khói Dày | Bom khói tồn tại lâu hơn 1.5s và rộng hơn 30%. |
| 1 | c | Đạn Sơ Tốc Cao | Đạn bắn tỉa bay nhanh hơn 50%. |
| 3 | a | Cắt Gân Tầm Xa | Bắn tỉa trúng mục tiêu bị Oca đánh dấu: trói chân 1s. |
| 3 | b | Khói Độc Thần Kinh | Tướng địch trong khói bị câm lặng. |
| 3 | c | Oca Vũ Trang | Bom mini của Oca đẩy văng nhẹ. |
| 6 | a | Phát Bắn Bồi | Bắn tỉa trúng: trong 1s dùng lại để nổ điểm ghim — thêm 30% sát thương và đẩy lùi 2 đv. |
| 6 | b | Dây Đu Thoát Hiểm | Bom khói thay bằng dây móc: đu người 6 đv (xuyên tường, không thể bị chọn). |
| 6 | c | Đạn Hợp Kim Titan | Mỗi phát súng trường phá tan 1 đạn đạo nhỏ đang bay quanh Raven. |
| 9 | a | Kẻ Đi Săn Vô Hình | Nổ súng khi đang tàng hình không còn làm lộ diện. |
| 9 | b | Băng Đạn Mở Rộng | Băng súng trường 45 viên. |
| 9 | c | Mắt Quạ Tử Thần | Oca tồn tại 30s (thay vì 20s); mục tiêu bị đánh dấu nhận thêm 10% sát thương. |
| 12 | a | Thiện Xạ Độc Hành | Bắn tỉa hồi nhanh gấp đôi và ×1.5 khi bắn xa trên 10 đv; đánh thường −40% sát thương. |
| 12 | b | Oca Tự Sát | Hết giờ, Oca lao xuống tướng bị đánh dấu gần nhất: nổ bán kính 3, choáng 1.5s. |
| 12 | c | Vọng Âm Đêm Tối | Trong Màn Đêm, mỗi lần hạ gục tướng kéo dài bóng tối thêm 3s. |

**Lối build gợi ý (AI dùng)**
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Chí Mạng: giày Giày Cuồng Chiến → Đao Phá Quân → Cung Gió Lốc → Kiếm Bão Táp → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Xạ Thủ Súng: giày Giày Cuồng Chiến → Cung Thần Phong → Đao Phá Quân → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Mảnh hồn yêu thích: Hồn Định Vị Thiện Xạ, Hồn Tuyệt Đích Bất Suy, Hồn Thiên Nhãn Xuyên Giới

<a id="roxie"></a>
### Roxie & T-Zero

**Định danh**
- id: `roxie` • màu chủ đạo: `#ffb030` • vũ khí/hình ảnh: `wrench` • bán kính va chạm: 0.56 đv
- Vai trò: Pháp sư (Mage) • vị trí: Đường giữa, Đường trên • nhãn: poke
- Tầm xa • sát thương chính: phép • tài nguyên: không dùng mana
- Đạn đánh thường: kiểu `shell`, tốc độ 18 đv/s
- Tính cách AI: ⚖ Thương Nhân — Buôn bán với bất kỳ ai không đang đánh nhau: gạ đình chiến ngắn để mua mảnh hồn người ta không cần (giá 60%), bán lại cho người cần (giá 130%), bán cả vật phẩm; giữ kho hàng 4 mảnh; giữ chữ tín, không bao giờ bịp; ngại đánh nhau. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh cuối trận · Cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1416 | 225.6 | 3220.8 | 5251.2 |
| Máu (gốc trong dữ liệu) | 590 | 94 | 1342 | 2188 |
| Mana | 420 | 50 | 820 | 1270 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 58 | 3 | 82 | 109 |
| Giáp | 28 | 3.6 | 56.8 | 89.2 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.63 | +1.5% | 0.71 | 0.79 |
| Tốc chạy | 3.35 | — | 3.35 | 3.35 |
| Tầm đánh | 5 | — | 5 | 5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Bánh Răng & Sáng Tạo**

Bánh răng liên tục rơi quanh Roxie (mỗi 4s một cái, tối đa 4 cái nằm chờ) — đi qua là nhặt; quái và tướng bị hạ gần Roxie cũng rơi bánh răng. Mỗi bánh răng +3% tốc chạy (tối đa 9). Ụ Pháo tốn 2 bánh răng; Gia Công tốn 3 bánh răng để ghép 1 Mảnh cơ giới; đủ 3 Mảnh thì gọi được Thiết Vệ T-Zero.
- Mã nguồn: `src/data/heroes/roxie.js:122`

**S1 — Khai Hỏa / Pháo Kích**

- Hồi chiêu: 3 / 3 / 3 / 3 / 3s • Thi triển: 0.12s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 5.5 đv • Tốc đạn/lướt: 18 đv/s • Mục đích AI: cấu rỉa
- Đủ 2 bánh răng (và chưa đủ ụ): dựng Ụ Pháo tại điểm trong 5 đv (tự bắn 20s, tối đa 1 ụ). Còn lại: bắn 1 viên pháo 7 đv. Cưỡi T-Zero: Đấm — nón 2.5 đv đẩy lùi.
- Công thức trong mã: `[50/75/100/125/150 theo cấp chiêu] + 0.5×SMPT`
- Mã nguồn: `src/data/heroes/roxie.js:161`

**S2 — Khai Tâm**

- Hồi chiêu: 6 / 5.5 / 5 / 4.5 / 4s • Thi triển: 0.1s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 9 đv • Mục đích AI: dồn sát thương
- Kích nổ Ụ Pháo gần nhất: sát thương bán kính 2.5 đẩy lùi, nhận lại 2 bánh răng, +50% tốc chạy và +30% sát thương 4s. Cưỡi T-Zero: Phun Lửa — nón 4.5 đv thiêu đốt.
- Công thức trong mã: `[100/150/200/250/300 theo cấp chiêu] + 0.6×SMPT`
- Mã nguồn: `src/data/heroes/roxie.js:184`

**S3 — Bất Ngờ Chưa**

- Hồi chiêu: 12 / 11 / 10 / 9 / 8s • Dùng được khi đang bị khống chế
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 4 đv • Mục đích AI: thoát thân
- Lộn ra sau 3 đv, nổ choáng 0.8s tại chỗ cũ. Dùng được cả khi đang bị khống chế. Cưỡi T-Zero: Húc — lao 4 đv hất tung 0.5s.
- Công thức trong mã: `[50/80/110/140/170 theo cấp chiêu] + 0.4×SMPT`
- Mã nguồn: `src/data/heroes/roxie.js:208`

**S4 — Thiết Vệ T-Zero**

- Hồi chiêu: 25 / 20 / 15s • Thi triển: 0.2s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 7 đv • Mục đích AI: chiêu cuối
- Cần đủ 3 Mảnh cơ giới (Gia Công). Gọi T-Zero 15s (tiêu 3 Mảnh). Bị áp sát hoặc máu thấp: tự lái — T-Zero gánh đòn (lá chắn 700 +110/cấp, +45%), bộ chiêu đổi thành Đấm / Phun Lửa / Húc, skill phụ thành Tự Hủy. Còn lại: T-Zero tự hành chiến đấu (Đấm, Phun Lửa, Húc), Roxie vẫn bắn bên ngoài; hết giờ T-Zero tự hủy.
- Mã nguồn: `src/data/heroes/roxie.js:245`

**Skill phụ — Gia Công / Tự Hủy**

- Hồi chiêu: 3s • Có điều kiện dùng riêng (xem mô tả)
- Mục đích AI: logic riêng của tướng
- Gia Công: dùng 3 bánh răng ghép 1 Mảnh cơ giới (tối đa 3) — đủ 3 Mảnh thì gọi được Thiết Vệ T-Zero. Khi đang lái T-Zero hoặc T-Zero đang tự hành: Tự Hủy — T-Zero phát nổ bán kính 3.5 (sát thương theo cấp S4).
- Công thức trong mã: `[150, 250, 350][Math.max(0, rank - 1)] + 0.8×SMPT`
- Mã nguồn: `src/data/heroes/roxie.js:225`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Từ Tính | Hút bánh răng xa hơn (3.2 đv thay vì 1.6); quái và tướng bị hạ trong 11 đv (thay vì 7) cũng rơi bánh răng. |
| 1 | b | Lắp Ráp Nhanh | Ụ Pháo chỉ tốn 1 bánh răng. |
| 1 | c | Phản Pháo | Bất Ngờ Chưa lộn xa hơn 30%. |
| 3 | a | Vết Dầu Loang | Khai Tâm để lại vũng dầu làm chậm 50% trong 3s. |
| 3 | b | Gia Cố Khung Gầm | T-Zero +30% máu. |
| 3 | c | Xung Điện Cao Áp | Bất Ngờ Chưa choáng 1.3s (thay vì 0.8s). |
| 6 | a | Giáp Phản Lực | Khai Tâm thay bằng hút Ụ Pháo vào người: lá chắn 150 (+30/cấp) 3s, kẻ đánh cận chiến bị đẩy lùi. |
| 6 | b | Bệ Phóng Lò Xo | Thiếu bánh răng: Khai Hỏa đặt bệ lò xo — tướng địch giẫm vào bị bật văng 3 đv và hất tung 0.5s. |
| 6 | c | Từ Trường Thu Gom | Chiêu trúng tướng cũng rơi bánh răng (mỗi 4s). |
| 9 | a | Lõi Quá Tải | Tự Hủy rộng gấp rưỡi và đẩy lùi 3 đv. |
| 9 | b | Tự Động Hóa Tối Tân | Duy trì tối đa 2 Ụ Pháo. |
| 9 | c | Cơ Giới Thần Tốc | Khi lái T-Zero: không thể cản phá; Phun Lửa làm chậm 40%. |
| 12 | a | Thiết Vệ Pháo Đài | T-Zero thành pháo đài đứng yên 16s: nã đạn nổ vào tướng địch thấp máu nhất trong 15 đv mỗi 1.5s. |
| 12 | b | Vòng Xoáy Lửa | Khi lái T-Zero: dùng Phun Lửa ngay sau Húc để xoay tròn quét lửa, hất tung 1s. |
| 12 | c | Cyborg Tự Thân | Không gọi robot: lắp bánh răng thành giáp 18s — +40 giáp/kháng phép, +SMVL, xuyên 30% giáp. |

**Lối build gợi ý (AI dùng)**
- Pháp Sư Trâu: giày Giày Thủy Ngân → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Quả Cầu Linh Hồn → Bùa Tro Tàn → Đồng Hồ Cát Nghịch Đảo
- Hồi Chiêu: giày Giày Khai Sáng → Ngọc Hiền Triết → Trâm Thần Kỳ → Pháp Châu Sấm Sét → Mũ Hỏa Thần → Thủy Tinh Sinh Mệnh
- Dồn Phép: giày Giày Khai Sáng → Mũ Hỏa Thần → Trượng Hư Vô → Trâm Thần Kỳ → Nhẫn Hoàng Kim → Đồng Hồ Cát Nghịch Đảo
- Mảnh hồn yêu thích: Hồn Radar Tàn Tích, Hồn Tiên Tri Vòng Bo, Hồn Thiên Nhãn Xuyên Giới

<a id="ryoma"></a>
### Ryoma

**Định danh**
- id: `ryoma` • màu chủ đạo: `#ff5a7a` • vũ khí/hình ảnh: `katana` • bán kính va chạm: 0.62 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đường giữa, Đường trên • nhãn: dive
- Cận chiến • sát thương chính: vật lý • tài nguyên: không dùng mana
- Tính cách AI: 🎯 Kẻ Trảm Tướng — Săn kẻ dẫn đầu số mạng, kẻ cầm vũ khí Đỏ hay kẻ đang có bùa boss; bỏ qua kẻ yếu. • Phong cách đánh: 🛡 Lì đòn — Đã vào trận là đánh tới cùng, không bỏ chạy.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1296 | 196.8 | 2870.4 | 4641.6 |
| Máu (gốc trong dữ liệu) | 540 | 82 | 1196 | 1934 |
| SMVL | 57 | 3.4 | 84.2 | 114.8 |
| Giáp | 30 | 3.8 | 60.4 | 94.6 |
| Kháng phép | 32 | 1.8 | 46.4 | 62.6 |
| Tốc đánh | 0.7 | +2.5% | 0.84 | 1 |
| Tốc chạy | 3.55 | — | 3.55 | 3.55 |
| Tầm đánh | 1.6 | — | 1.6 | 1.6 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Liên Hoàn**

Nhất Đao, Đột Thích, Thuấn Bộ mỗi chiêu có 2 lượt dùng. Cứ 2 chiêu liên tiếp trong 2s kích hoạt Combo theo cặp: AA chém tròn rộng • AB lướt chém rồi chém tròn nhỏ • AC hư ảnh cùng chém tròn • BB đâm thêm nhát nữa gây CHOÁNG • BC phóng dư ảnh lao tới • CC gió xoáy làm chậm (A = Nhất Đao, B = Đột Thích, C = Thuấn Bộ). Mỗi Combo hồi 1 lượt Nhất Đao, nạp 1 Kiếm Khí (tối đa 3) và giảm 3s hồi chiêu Vô Ảnh Trảm.

- Công thức trong mã: `20 + 8×cấp + 0.35×SMVL`
- Mã nguồn: `src/data/heroes/ryoma.js:41`

**S1 — Nhất Đao**

- Hồi chiêu: 4 / 3.75 / 3.5 / 3.25 / 3s • Thi triển: 0.12s • Tích lũy: 2 lượt
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 2.3 đv • Mục đích AI: dồn sát thương
- Chém hình vòng cung trước mặt. 2 lượt dùng.
- Công thức trong mã: `[45/70/95/120/145 theo cấp chiêu] + 0.55×SMVL`
- Mã nguồn: `src/data/heroes/ryoma.js:63`

**S2 — Đột Thích**

- Hồi chiêu: 7 / 6.5 / 6 / 5.5 / 5s • Thi triển: động (theo trạng thái) • Tích lũy: 2 lượt
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 3.8 đv • Mục đích AI: cấu rỉa
- Đâm thẳng 4 đv. 2 lượt dùng.
- Công thức trong mã: `[50/75/100/125/150 theo cấp chiêu] + 0.65×SMVL`
- Mã nguồn: `src/data/heroes/ryoma.js:74`

**S3 — Thuấn Bộ**

- Hồi chiêu: 8 / 7.5 / 7 / 6.5 / 6s • Tích lũy: 2 lượt
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 4.5 đv • Mục đích AI: mở giao tranh
- Lướt ngắn 3.5 đv về phía trước, chém kẻ địch trên đường. 2 lượt dùng.
- Công thức trong mã: `[35/55/75/95/115 theo cấp chiêu] + 0.45×SMVL`
- Mã nguồn: `src/data/heroes/ryoma.js:89`

**S4 — Vô Ảnh Trảm**

- Hồi chiêu: 100 / 85 / 70s • Thi triển: 0.05s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 5 đv • Mục đích AI: chiêu cuối
- Lao vào tướng trong 5 đv, không thể bị chọn 1.2s, chém 5 lần rồi tung nhát kết liễu cộng 10% máu đã mất.
- Công thức trong mã: `[30/45/60 theo cấp chiêu] + 0.25×SMVL` • `[100/150/200 theo cấp chiêu] + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/ryoma.js:127`

**Skill phụ — Kiếm Khí**

- Hồi chiêu: 1s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6.8 đv • Tốc đạn/lướt: 22 đv/s • Mục đích AI: cấu rỉa
- Chỉ dùng được khi có Kiếm Khí (mỗi Combo nạp 1, tối đa 3): chém ra một luồng kiếm khí xuyên thấu 7 đv — 25 (+6/cấp, +80% SMVL) sát thương, PHÁ HỦY đạn của đối thủ trên đường bay.
- Công thức trong mã: `25 + 6×cấp + 0.8×SMVL`
- Mã nguồn: `src/data/heroes/ryoma.js:107`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Lưu Thủy | Thuấn Bộ (S3) nạp lượt nhanh hơn 1.5s. |
| 1 | b | Khai Kiếm | Nhất Đao (S1) chém xa hơn 20%. |
| 1 | c | Thấu Kính | Đột Thích (S2) đâm xa hơn 25%. |
| 3 | a | Hư Ảnh Trùng Kích | Combo có Thuấn Bộ (AC, BC, CC) rộng hơn 35% và mạnh hơn 50%. |
| 3 | b | Trảm Khí Xuyên Giác | Kiếm Khí (skill phụ) bay nhanh hơn 50% và câm lặng tướng trúng 1s. |
| 3 | c | Chấn Xung Lực | Sau Combo BB, đòn đánh kế tiếp +40% sát thương. |
| 6 | a | Thuật Thế Thân | Trong 1.5s sau Thuấn Bộ: dùng lại để giật về điểm xuất phát, để lại tàn ảnh chém quét. |
| 6 | b | Ngược Gió Chém Sát | Combo Đột Thích → Nhất Đao (đúng thứ tự): đòn combo hất tung 0.75s. |
| 6 | c | Đao Phách Vô Tận | Nhất Đao dùng trong 3s sau Combo chém xa hơn 30%. |
| 9 | a | Tâm Kiếm Độc Tôn | Mỗi Combo giảm 6s hồi chiêu Vô Ảnh Trảm (thay vì 3s). |
| 9 | b | Nhất Kiếm Định Âm | Vô Ảnh Trảm trói chân 1s mọi tướng địch trong 4 đv quanh mục tiêu. |
| 9 | c | Kiếm Vô Tận | Tung Kiếm Khí xong lập tức hồi 1 lượt Thuấn Bộ. |
| 12 | a | Tam Trọng Trảm Khí | Kiếm Khí phóng 3 luồng hình quạt, câm lặng 1s. |
| 12 | b | Kiếm Cư Hợp (Iaido) | Đột Thích thành thế tra kiếm: tụ 0.6s rồi lướt chém 7 đv xuyên qua kẻ địch (không thể bị chọn), sát thương ×1.6. |
| 12 | c | Tâm Kiếm Hợp Nhất | Combo hồi 1 lượt cả Nhất Đao lẫn Đột Thích. |

**Lối build gợi ý (AI dùng)**
- Sát Thủ: giày Giày Đinh Gỉ → Dao Ám Ảnh → Kiếm Bão Táp → Dao Tử Thần → Mũi Khoan Thép → Khăn Thanh Tẩy
- Đơn Đấu: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Trường Nhận Phong Khí, Hồn Titan Phá Giới, Hồn Vũ Điệu Tử Thần

<a id="theron"></a>
### Theron

**Định danh**
- id: `theron` • màu chủ đạo: `#e0c070` • vũ khí/hình ảnh: `spear` • bán kính va chạm: 0.66 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đi rừng, Đường trên • nhãn: cc
- Cận chiến • sát thương chính: vật lý • tài nguyên: mana
- Tính cách AI: 🛡 Vệ Sĩ Thầm Lặng — Âm thầm bảo vệ một người (tạm: kẻ yếu nhất — chờ cốt truyện); đi theo cách 15–25 đv, ai đánh người đó là can thiệp ngay; không bao giờ đánh người mình bảo vệ. • Phong cách đánh: 🛡 Lì đòn — Đã vào trận là đánh tới cùng, không bỏ chạy.
- Giai đoạn mạnh: Mạnh đầu trận · Cần đồ vừa phải

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1404 | 218.4 | 3151.2 | 5116.8 |
| Máu (gốc trong dữ liệu) | 585 | 91 | 1313 | 2132 |
| Mana | 300 | 38 | 604 | 946 |
| Hồi mana/s (thực tế, ×1.6) | 2.4 | 0.13 | 3.42 | 4.58 |
| SMVL | 61 | 3.7 | 90.6 | 123.9 |
| Giáp | 31 | 4 | 63 | 99 |
| Kháng phép | 32 | 1.8 | 46.4 | 62.6 |
| Tốc đánh | 0.66 | +2.2% | 0.78 | 0.91 |
| Tốc chạy | 3.5 | — | 3.5 | 3.5 |
| Tầm đánh | 2.3 | — | 2.3 | 2.3 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Xuyên Phá**

Đòn đâm xuyên: kẻ địch phía sau mục tiêu trong tầm nhận 50%; 20% sát thương đánh thường là sát thương chuẩn.
- Mã nguồn: `src/data/heroes/theron.js:24`

**S1 — Liên Hoàn Đâm**

- Hồi chiêu: 6 / 5.5 / 5 / 4.5 / 4s • Mana: 40 / 40 / 40 / 40 / 40 • Thi triển: 0.1s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 4.2 đv • Mục đích AI: dồn sát thương
- Đứng đâm 3 nhát thẳng 4.5 đv, mỗi nhát 35/50/65/80/95 (+40% SMVL).
- Công thức trong mã: `[35/50/65/80/95 theo cấp chiêu] + 0.4×SMVL`
- Mã nguồn: `src/data/heroes/theron.js:42`

**S2 — Xung Phong**

- Hồi chiêu: 12 / 11.5 / 11 / 10.5 / 10s • Mana: 60 / 60 / 60 / 60 / 60 • Thi triển: 0.1s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 6.5 đv • Chỉ nhắm tướng • Mục đích AI: mở giao tranh
- Lao 7 đv, ủi tướng đầu tiên chạm phải theo mình; ủi vào tường hoặc trụ thì choáng 1.5s, không thì hất tung 0.5s cuối đà.
- Công thức trong mã: `[60/90/120/150/180 theo cấp chiêu] + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/theron.js:57`

**S3 — Chống Thương Nhảy**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Mana: 45 / 45 / 45 / 45 / 45
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 5 đv • Mục đích AI: phòng thủ
- Bật lên 1s không thể bị chọn (vẫn di chuyển chậm); hết giờ hoặc dùng lại thì dậm xuống làm chậm 40% kẻ địch quanh chân.
- Công thức trong mã: `50 + 10×ucấp + 0.6×SMVL` • `[50/80/110/140/170 theo cấp chiêu] + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/theron.js:88`

**S4 — Mưa Thương**

- Hồi chiêu: 120 / 100 / 80s • Mana: 100 / 100 / 100 • Thi triển: 0.2s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 8 đv • Bán kính vùng: 7 đv • Mục đích AI: chiêu cuối
- Gọi mưa thương xuống vùng bán kính 7 đv quanh điểm trong 8 đv suốt 3s: sát thương liên tục; trúng lần đầu thì trói chân 1s.
- Công thức trong mã: `[45/70/95 theo cấp chiêu] + 0.3×SMVL`
- Mã nguồn: `src/data/heroes/theron.js:126`

**Skill phụ — Quét Chân**

- Hồi chiêu: 12s • Mana: 30
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 2.4 đv • Mục đích AI: khống chế
- Quét thương tầm thấp 360° (bán kính 2.6): 35 (+7/cấp, +50% SMVL) sát thương, kẻ địch trúng chiêu bị NGÃ 0.5s (ngắt chiêu đang niệm).
- Công thức trong mã: `35 + 7×cấp + 0.5×SMVL`
- Mã nguồn: `src/data/heroes/theron.js:108`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Kình Lực Mũi Thương | Liên Hoàn Đâm xa hơn 25%. |
| 1 | b | Bật Nhảy Kỷ Luật | Chống Thương Nhảy ở trên không 1.6s (thay vì 1s). |
| 1 | c | Quét Trụ | Quét Chân (skill phụ) hồi 8s (thay vì 12s). |
| 3 | a | Đâm Ghim Vỡ Giáp | Ghim tường bằng Xung Phong: choáng 2s (thay vì 1.5s) và phá mọi lá chắn. |
| 3 | b | Ngã Rạp Chiến Trường | Quét Chân thêm trói chân + câm lặng 1s. |
| 3 | c | Chấn Động Mặt Đất | Dậm xuống từ Chống Thương rộng hơn (3.5 đv) và hất tung 0.5s thay vì làm chậm. |
| 6 | a | Hất Tung Phá Trận | Quét Chân thành đòn móc cán thương hất tung mục tiêu 1s. |
| 6 | b | Giáo Ném Không Trung | Đang trên không: dùng lại để phóng giáo xuống tướng địch trong 6 đv — choáng 1s — rồi dậm xuống. |
| 6 | c | Khiên Chắn Sparta | Trong lúc Liên Hoàn Đâm: chặn mọi đạn đạo bay tới từ phía trước. |
| 9 | a | Trận Địa Mưa Thương | Mưa Thương trói chân 2s (thay vì 1s). |
| 9 | b | Mũi Giáo Tử Thần | Mọi đòn đâm (đánh thường, Liên Hoàn Đâm, Xung Phong) có 35% là sát thương chuẩn. |
| 9 | c | Spartan Bất Diệt | Xung Phong không thể cản phá; giảm 30% sát thương nhận trong lúc lao. |
| 12 | a | Đâm Xuyên Vạn Quân | Xung Phong xuyên tường và cuốn theo mọi kẻ địch trên đường. |
| 12 | b | Đấu Sĩ Phalanx | Giảm 15% sát thương nhận; đòn đâm +20% sát thương; −10% tốc chạy. (-10% Tốc chạy) |
| 12 | c | Kỷ Luật Bất Khả Xâm Phạm | Miễn nhiễm trói chân và mê hoặc. (+1 imm_root, +1 imm_charm) |

**Lối build gợi ý (AI dùng)**
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Đỡ Đòn: giày Giày Thép → Vương Miện Bất Khả Xâm Phạm → Giáp Gai → Áo Giáp Dung Nham → Trái Tim Cự Thạch → Áo Choàng Thánh Linh
- Mảnh hồn yêu thích: Hồn Trường Nhận Phong Khí, Hồn Phi Thân Trảm Kích, Hồn Titan Phá Giới

<a id="tsukiyo"></a>
### Tsukiyo

**Định danh**
- id: `tsukiyo` • màu chủ đạo: `#6b6bd6` • vũ khí/hình ảnh: `ninja` • bán kính va chạm: 0.54 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đi rừng, Đường giữa • nhãn: stealth
- Tầm xa • sát thương chính: vật lý • tài nguyên: mana
- Đạn đánh thường: kiểu `shuriken`, tốc độ 24 đv/s
- Tính cách AI: 🗡 Ám Sát — Săn kẻ đứng lẻ, máu thấp; phục kích trong bụi. • Phong cách đánh: ⚔ Xông xáo — Đánh tới khi còn khoảng 10% máu mà thấy không thắng nổi mới chạy.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1356 | 211.2 | 3045.6 | 4946.4 |
| Máu (gốc trong dữ liệu) | 565 | 88 | 1269 | 2061 |
| Mana | 100 | 10 | 180 | 270 |
| Hồi mana/s (thực tế, ×1.6) | 0 | 0 | 0 | 0 |
| SMVL | 62 | 3.8 | 92.4 | 126.6 |
| Giáp | 27 | 3.7 | 56.6 | 89.9 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.7 | +2.6% | 0.85 | 1.01 |
| Tốc chạy | 3.55 | — | 3.55 | 3.55 |
| Tầm đánh | 5.5 | — | 5.5 | 5.5 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Thích Ứng Cận – Viễn • Tam Đại Nhẫn Thuật • Nhẫn Đạo Toàn Giác**

Dùng Nội Năng (100 +10/cấp, tự hồi 10/giây) thay mana. Mục tiêu xa hơn 2 đv: ném phi tiêu; gần: song đao chém (+20%). Đòn đánh trúng tướng +8 Nội Năng; S1/S2 trúng tướng +15. Mỗi chiêu theo 1 trong 3 nhánh: Kỹ Thuật (phép, khống chế), Tất Sát (vật lý, dồn sát thương), Bí Thuật (tốc độ, phản đòn). Nhẫn Đạo: 120 Công Phép → phi tiêu thêm phép và hiệu ứng ngẫu nhiên, nhát chém gắn Dấu Ấn Hắc Ám; 90 Công Vật Lý thêm → ném 3 phi tiêu / chém 2 nhát (4s); 35% tốc đánh + tốc chạy thêm → né 1 đòn cận chiến và chém phản 1 đòn tầm xa (12s mỗi loại).

- Công thức trong mã: `8 + 2×cấp + 0.25×SMVL`
- Mã nguồn: `src/data/heroes/tsukiyo.js:27`

**S1 — Nhẫn Thuật Nhất**

- Hồi chiêu: động (xem mô tả)s • Mana: 50 • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chọn điểm / hướng (point) • Mục đích AI: logic riêng của tướng
- 🔮 Hỏa Cầu Chi Thuật: cầu lửa bay 7.5 đv, nổ bán kính 2.5 sát thương phép lớn + thiêu đốt 3s. ⚔ Loạn Vũ Phi Tiêu: +60% tốc đánh 5s, mỗi đòn ném thêm 2 phi tiêu tách góc; hết giờ xả loạt phi tiêu tìm diệt theo số đã ném. 🌪 Thuấn Trảm: lướt 4.5 đv chém trên đường, +35% tốc chạy 1.5s (tích 3 lần, hồi 1 lần mỗi 8s).
- Công thức trong mã: `[80/125/170/215/260 theo cấp chiêu] + 0.8×SMPT` • `[50/75/100/125/150 theo cấp chiêu] + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/tsukiyo.js:113`

**S2 — Nhẫn Thuật Nhị**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Mana: 58
- Nhắm: Chọn điểm / hướng (point) • Mục đích AI: logic riêng của tướng
- 🔮 Mộc Độn – Bẫy Trói: lướt lùi 3.5 đv, đặt bẫy ở chỗ cũ (trói 1.5s + sát thương phép). ⚔ Tam Trọng Trảm Kích: 3 đòn đánh kế tiếp trong 5s — nhát 1 chậm 40%, nhát 2 phá 150 Hộ Giáp, nhát 3 chí mạng ×2. 🌪 Song Nhận Vô Ảnh: 2 nhát chém chữ X hình nón, toàn bộ là sát thương chuẩn.
- Công thức trong mã: `[70/105/140/175/210 theo cấp chiêu] + 0.6×SMPT` • `[45/65/85/105/125 theo cấp chiêu] + 0.55×SMVL`
- Mã nguồn: `src/data/heroes/tsukiyo.js:144`

**S3 — Nhẫn Thuật Tam**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Mana: 66
- Nhắm: Chọn điểm / hướng (point) • Mục đích AI: logic riêng của tướng
- 🔮 Tiên Cảnh Thế Thân: tập trung 2.5s — trúng đòn thì dịch chuyển 6 đv tới chỗ an toàn, để lại cành cây nổ khói độc làm mù. ⚔ Yên Mạc Dạ Hành: bom khói bán kính 3.5 trong 4s — địch bên trong bị mù, Tsukiyo tàng hình khi đứng trong khói. 🌪 Kiếm Thế Vạn Lưu Phản Pháo: đòn cận chiến đầu tiên bị phản choáng 1s; đòn tầm xa bị chém phản ngược kẻ bắn và giảm 70/75/80/85/90% sát thương — giữ thế tới khi không còn đạn bắn vào.
- Mã nguồn: `src/data/heroes/tsukiyo.js:170`

**S4 — Nhẫn Thuật Tối Thượng**

- Hồi chiêu: 90 / 75 / 60s • Mana: 100
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 7 đv • Bán kính vùng: 6 đv • Mục đích AI: chiêu cuối
- 🔮 Hắc Nguyệt Diệt Thế Cầu: cảnh báo bán kính 8; sau 2/1.5/1s quả cầu bóng tối nổ — sát thương phép cực lớn, choáng 1.5s, mù 3s. ⚔ Huyền Ảnh Ám Bộ: 5/6/8s +40% tốc chạy, mỗi đòn đánh gọi Hư Ảnh chém bồi 50%, mọi đòn làm chậm 30%. 🌪 Song Ảnh Xuất Trận: gọi 1/1/2 phân thân lao lên trước, thừa hưởng 50% chỉ số, tồn tại 12/16/20s.
- Công thức trong mã: `[300/450/600 theo cấp chiêu] + 1.1×SMPT`
- Mã nguồn: `src/data/heroes/tsukiyo.js:197`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Nội Năng Tuôn Trào | Nội Năng tự hồi 16/giây. |
| 1 | b | Ám Tiêu Tốc Độ | Phi tiêu bay nhanh hơn 40%, tầm ném 6.5 đv. (+1 Tầm đánh) |
| 1 | c | Nhẫn Bộ Vô Hình | Bước chân không phát tiếng động (−25% bị nhìn thấy). (+0.1 visPct) |
| 3 | a | Tâm Pháp Toàn Năng | Ngưỡng Nhẫn Đạo giảm: 100 Công Phép, 75 Công Vật Lý, 28% Tốc Độ. |
| 3 | b | Hỏa Cầu Lan Tỏa | Hỏa Cầu để lại vũng dung nham 3s. |
| 3 | c | Kiếm Thế Phản Lực | Kiếm Thế phản đòn mạnh hơn 25%. |
| 6 | a | Thế Thân Đoạt Mệnh | Thế Thân kích hoạt: hiện ngay sau lưng kẻ tấn công kèm một nhát đâm chí mạng. |
| 6 | b | Thuấn Trảm Tứ Đoạn | Thuấn Trảm tích 4 lần. |
| 6 | c | Tam Trọng Bộc Phá | Tam Trọng Trảm Kích bỏ qua 40% giáp. |
| 9 | a | Ám Nguyệt Thuấn Niệm | Hắc Nguyệt Diệt Thế Cầu niệm 0.5s. |
| 9 | b | Phân Thân Thần Phục | Phân thân thừa hưởng 75% chỉ số. |
| 9 | c | Hư Ảnh Trảm Vũ | Huyền Ảnh Ám Bộ: hạ tướng kéo dài thêm 4s. |
| 12 | a | Vô Song Nhẫn Hoàng | Phong cách: mở cả 3 tầng Nhẫn Đạo không cần chỉ số. |
| 12 | b | Bất Diệt Kiếm Vũ | Phong cách: Kiếm Thế phản 5 đòn → hồi đầy Nội Năng + giáp ảo 30% máu. |
| 12 | c | Huyền Thiết Ám Bộ | +10% Công Vật Lý, +10% Công Phép, +6% tốc chạy. (+10% Công Vật Lý %, +10% Công Phép %, +6% Tốc chạy) |

**Lối build gợi ý (AI dùng)**
- Sát Thủ: giày Giày Đinh Gỉ → Dao Ám Ảnh → Kiếm Bão Táp → Dao Tử Thần → Mũi Khoan Thép → Khăn Thanh Tẩy
- Đơn Đấu: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái
- Đấu Sĩ Phép: giày Giày Thép → Mặt Nạ Nguyền Rủa → Gậy Băng Giá → Đồng Hồ Cát Nghịch Đảo → Giáp Gai → Trái Tim Cự Thạch
- Mảnh hồn yêu thích: Hồn Vũ Điệu Tử Thần, Hồn Phong Lôi Liên Kích, Hồn Thần Tốc Thiên Mệnh

<a id="valerius"></a>
### Valerius

**Định danh**
- id: `valerius` • màu chủ đạo: `#5aa9ff` • vũ khí/hình ảnh: `swordshield` • bán kính va chạm: 0.72 đv
- Vai trò: Đỡ đòn (Tank) • vị trí: Đường trên, Hỗ trợ • nhãn: cc, tank
- Cận chiến • sát thương chính: vật lý • tài nguyên: mana
- Tính cách AI: ⚔ Võ Sĩ Danh Dự — Ghét ăn hôi; chờ kẻ thắng giao tranh hồi sức rồi mới thách đấu tay đôi; mê cổng quyết đấu. • Phong cách đánh: 🛡 Lì đòn — Đã vào trận là đánh tới cùng, không bỏ chạy.
- Giai đoạn mạnh: Mạnh giữa trận · Ít cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1536 | 235.2 | 3417.6 | 5534.4 |
| Máu (gốc trong dữ liệu) | 640 | 98 | 1424 | 2306 |
| Mana | 300 | 40 | 620 | 980 |
| Hồi mana/s (thực tế, ×1.6) | 2.24 | 0.13 | 3.26 | 4.42 |
| SMVL | 60 | 3.6 | 88.8 | 121.2 |
| Giáp | 34 | 4.2 | 67.6 | 105.4 |
| Kháng phép | 32 | 2 | 48 | 66 |
| Tốc đánh | 0.66 | +2% | 0.77 | 0.88 |
| Tốc chạy | 3.45 | — | 3.45 | 3.45 |
| Tầm đánh | 1.7 | — | 1.7 | 1.7 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Công Thủ**

Giảm 6% sát thương nhận. Mỗi lần trúng đòn của tướng tích 1 Phản Kích (tối đa 3): đòn đánh kế tiếp +12 (+2/cấp) sát thương mỗi tầng.
- Mã nguồn: `src/data/heroes/valerius.js:9`

**S1 — Chém Vòng Cung**

- Hồi chiêu: 7 / 6.5 / 6 / 5.5 / 5s • Mana: 40 / 40 / 40 / 40 / 40 • Thi triển: 0.15s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 2.8 đv • Mục đích AI: dồn sát thương
- Chém hình quạt 130° trước mặt, làm chậm 20% trong 1s.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/valerius.js:31`

**S2 — Đâm Thẳng**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Mana: 50 / 50 / 50 / 50 / 50 • Thi triển: 0.2s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 4.6 đv • Mục đích AI: cấu rỉa
- Đâm thẳng 5 đv; cộng 8% máu đã mất của mục tiêu.
- Công thức trong mã: `[70/110/150/190/230 theo cấp chiêu] + 0.8×SMVL`
- Mã nguồn: `src/data/heroes/valerius.js:45`

**S3 — Khiên Chắn**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Mana: 60 / 60 / 60 / 60 / 60 • Thi triển: 1s (vừa đi vừa thi triển) (không thể bị ngắt)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 2.4 đv • Mục đích AI: khống chế
- Giơ khiên 1s giảm 60% sát thương nhận; kết thúc bằng cú húc: choáng 0.75s + câm lặng 1s.
- Công thức trong mã: `[50/80/110/140/170 theo cấp chiêu] + 0.5×SMVL`
- Mã nguồn: `src/data/heroes/valerius.js:54`

**S4 — Chiến Thần Bất Tử**

- Hồi chiêu: 110 / 95 / 80s • Mana: 100 / 100 / 100
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 4 đv • Mục đích AI: chiêu cuối
- 4s máu không xuống dưới 1, +30% tốc chạy, +20% sát thương.
- Mã nguồn: `src/data/heroes/valerius.js:88`

**Skill phụ — Cuồng Phong**

- Hồi chiêu: 10s • Mana: 30
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 2.3 đv • Mục đích AI: dồn sát thương
- +45% tốc chạy trong 1.5s và chém một vòng quanh người (bán kính 2.4): 40 (+8/cấp, +40% SMVL) sát thương, làm chậm 30% trong 1.5s.
- Công thức trong mã: `40 + 8×cấp + 0.4×SMVL`
- Mã nguồn: `src/data/heroes/valerius.js:73`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Trụ Vững | +10% kháng hiệu ứng và +8 giáp. (+10% Kháng hiệu ứng, +8 Giáp) |
| 1 | b | Phản Xạ Binh Nghiệp | Khiên Chắn (S3) đỡ được đòn: giảm 1s hồi chiêu S1 và S2 (1 lần mỗi lần giơ khiên). |
| 1 | c | Xung Kích | +20% tốc chạy khi tiến về phía tướng địch trong 8 đv. |
| 3 | a | Khiên Gai | Đang giơ Khiên Chắn: phản lại 40% sát thương nhận vào cho tướng tấn công (sát thương phép). |
| 3 | b | Chấn Địa | Cú húc kết thúc Khiên Chắn rộng gấp đôi và dài hơn 50%. |
| 3 | c | Giáp Bất Diệt | Khi đứng yên hoặc đang ra đòn tại chỗ: giảm thêm 15% sát thương nhận vào. |
| 6 | a | Khiên Húc Phá Trận | S1 đổi thành lướt húc khiên 4 đv về trước, gom mọi kẻ địch trên đường và đẩy lùi 1.6 đv (hồi chiêu +2s). |
| 6 | b | Khiên Phản Kích | Cú húc của Khiên Chắn cộng thêm 30% tổng sát thương đã chặn trong lúc giơ khiên. |
| 6 | c | Hộ Vệ Bất Bại | Đứng yên quá 1s: vòng bảo hộ giảm 15% sát thương cho bản thân và đồng minh trong 3 đv. |
| 9 | a | Bất Khuất | Máu xuống dưới 25%: tự nhận lá chắn 150 (+20/cấp) trong 2.5s và miễn khống chế 1s (hồi 45s). |
| 9 | b | Chiến Ý Hoàng Gia | Trong Chiến Thần Bất Tử (S4): đòn đánh thường gây choáng 0.5s (mỗi mục tiêu 1 lần mỗi 1.5s). |
| 9 | c | Áp Chế Tuyệt Đối | Cú húc Khiên Chắn đẩy lùi 1.5 đv; đập vào tường: câm lặng thêm 1.5s và 60 (+8/cấp) sát thương. |
| 12 | a | Địa Chấn Khiên Binh | Cuồng Phong (skill phụ) nện khiên tạo vết nứt 4.5 đv về phía tướng địch gần nhất, hất tung 0.75s. |
| 12 | b | Đấu Sĩ Trảm Sát | Vứt khiên, kiếm hai tay: +25% tốc đánh, +15% sát thương. Mất giảm sát thương của nội tại và của Khiên Chắn; Khiên Chắn thành lướt chém 4 đv (vẫn choáng + câm lặng). (+25% Tốc đánh) |
| 12 | c | Ý Chí Bất Diệt | Đòn chí tử: sống lại với 1 máu, miễn sát thương 1s (hồi 90s). |

**Lối build gợi ý (AI dùng)**
- Đỡ Đòn: giày Giày Thép → Vương Miện Bất Khả Xâm Phạm → Giáp Gai → Áo Giáp Dung Nham → Trái Tim Cự Thạch → Áo Choàng Thánh Linh
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Hộ Vệ: giày Giày Thép → Khiên Lâm Thần → Chuông Thức Tỉnh → Vương Miện Bất Khả Xâm Phạm → Giáp Ma Quái → Áo Choàng Thánh Linh
- Mảnh hồn yêu thích: Hồn Trường Nhận Phong Khí, Hồn Thính Giác Địa Chấn, Hồn Huyết Tế Toàn Cảnh

<a id="vesper"></a>
### Vesper

**Định danh**
- id: `vesper` • màu chủ đạo: `#b07aff` • vũ khí/hình ảnh: `dagger` • bán kính va chạm: 0.56 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đi rừng, Đường giữa • nhãn: stealth, dive
- Cận chiến • sát thương chính: vật lý • tài nguyên: mana
- Tính cách AI: 👻 Thoát Xác — Dưới 75% máu là rút; đánh rồi chạy — lùi ~20 đv hồi sức rồi quay lại cấu tiếp. • Phong cách đánh: ⚔ Xông xáo — Đánh tới khi còn khoảng 10% máu mà thấy không thắng nổi mới chạy.
- Giai đoạn mạnh: Mạnh đầu trận · Cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1344 | 206.4 | 2995.2 | 4852.8 |
| Máu (gốc trong dữ liệu) | 560 | 86 | 1248 | 2022 |
| Mana | 300 | 36 | 588 | 912 |
| Hồi mana/s (thực tế, ×1.6) | 2.4 | 0.13 | 3.42 | 4.58 |
| SMVL | 64 | 4 | 96 | 132 |
| Giáp | 27 | 3.6 | 55.8 | 88.2 |
| Kháng phép | 30 | 1.4 | 41.2 | 53.8 |
| Tốc đánh | 0.78 | +3% | 0.97 | 1.18 |
| Tốc chạy | 3.65 | — | 3.65 | 3.65 |
| Tầm đánh | 1.35 | — | 1.35 | 1.35 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Đâm Sau Lưng**

Đòn đánh và chiêu từ sau lưng mục tiêu +40% sát thương và câm lặng 0.75s (mỗi mục tiêu 1 lần mỗi 8s). Đòn Đánh Bất Ngờ: đòn đầu tiên khi đối thủ không thấy Vesper gây ×2 sát thương, gây độc rút máu và Khóa Họng (choáng 1s). Đánh thường là những nhát chém nhanh.
- Mã nguồn: `src/data/heroes/vesper.js:23`

**S1 — Phi Dao Ảnh Bộ**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Mana: 45 / 45 / 45 / 45 / 45 • Thi triển: 0.12s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 7.5 đv • Tốc đạn/lướt: 22 đv/s • Đạn định hướng (né được) • Mục đích AI: mở giao tranh
- Ném dao độc 7/8/9/9/10 đv: sát thương vật lý, câm lặng 1/1/1/1.25/1.5s, độc và làm chậm 3/5/6/6/8s. Trúng thì trong 5s dùng lại để dịch chuyển ra sau lưng mục tiêu.
- Công thức trong mã: `[50/80/110/140/170 theo cấp chiêu] + 0.5×SMVL` • `30 + 6×u3.level + 0.4×SMVL`
- Mã nguồn: `src/data/heroes/vesper.js:87`

**S2 — Xuyên Tâm**

- Hồi chiêu: 8 / 7.5 / 7 / 6.5 / 6s • Mana: 40 / 40 / 40 / 40 / 40
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 5 đv • Mục đích AI: dồn sát thương
- Lao 4/5/6/7/8 đv xuyên qua kẻ địch, chém mạnh mọi kẻ trên đường; trúng từ sau lưng gây thêm 50% sát thương và choáng 1s.
- Công thức trong mã: `[60/95/130/165/200 theo cấp chiêu] + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/vesper.js:111`

**S3 — Ẩn Thân & Bóng Đêm Vĩnh Cửu**

- Hồi chiêu: 16 / 15 / 14 / 13 / 12s • Mana: 60 / 60 / 60 / 60 / 60
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 4 đv • Mục đích AI: thoát thân
- Tàng hình 2.5/5/10/10s (cấp tối đa: không giới hạn tới khi ra đòn), +40% tốc chạy; lộ khi tấn công hoặc đứng quá sát kẻ địch (2.5/2.5/2.5/2/1 đv). Nội tại: rời giao tranh 5s thì ngụy trang (chỉ lộ khi địch áp sát dưới 5 đv). Đòn đầu tiên khi đối thủ không thấy: choáng (Khóa Họng).
- Mã nguồn: `src/data/heroes/vesper.js:125`

**S4 — Bão Phi Đao Tuyệt Diệt**

- Hồi chiêu: 100 / 85 / 70s • Mana: 100 / 100 / 100 • Thi triển: 0.15s
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6 đv • Bán kính vùng: 6 đv • Mục đích AI: chiêu cuối
- Phóng 10/20/40 phi dao bao trùm bán kính 6/8/10 đv, Vesper tàng hình 5s. Dùng lại: dịch chuyển ra sau lưng tướng địch thấp máu nhất bị trúng dao. Cấp tối đa: đánh dấu mọi mục tiêu trúng dao, Hư Ảnh lao tới đâm xuyên từng kẻ. Đòn Trảm Quyết: đòn đánh kế tiếp trong 3s gây ×2 (×3 nếu mục tiêu dưới 50% máu). Tung khi chưa bị phát hiện: bỏ qua 50% giáp và 100% Hộ Giáp, đánh mạnh hơn lên nạn nhân dưới 25% máu.
- Công thức trong mã: `[50/80/110 theo cấp chiêu] + 0.35×SMVL`
- Mã nguồn: `src/data/heroes/vesper.js:131`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Bộ Pháp Vô Hình | Ẩn Thân tăng 60% tốc chạy (thay vì 40%). |
| 1 | b | Độc Ăn Mòn | Độc của Phi Dao mạnh hơn 40%. |
| 1 | c | Đoản Đao | +15% tốc đánh. (+15% Tốc đánh) |
| 3 | a | Tử Huyệt Sau Lưng | Đòn sau lưng +60% sát thương (thay vì +40%). |
| 3 | b | Ám Kích Chớp Nhoáng | Dịch chuyển của Phi Dao gây mù mục tiêu 1.5s. |
| 3 | c | Bóng Ma Mất Dấu | Hạ gục tướng: lập tức Ẩn Thân 2s. |
| 6 | a | Lướt Xiên Bóng Đêm | Xuyên Tâm chém trúng từ sau lưng: trói chân 1s. |
| 6 | b | Đổi Hướng Đột Kích | Dịch chuyển của Phi Dao ra TRƯỚC MẶT mục tiêu kèm cú đá hất tung 0.75s. |
| 6 | c | Bước Đi Không Vết | Ẩn Thân kéo dài 3.5s. |
| 9 | a | Bão Dao Đoạt Mệnh | Bão Phi Đao phóng 14 dao (thay vì 10). |
| 9 | b | Sát Thủ Hoàn Hảo | Đòn đánh sau Bão Phi Đao gây ×2.5 (thay vì ×2). |
| 9 | c | Thế Thân | Đòn chí tử: để lại khúc gỗ thế thân, dịch chuyển 4 đv và tàng hình 1.5s với 1 máu (hồi 90s). |
| 12 | a | Ảo Ảnh Phân Thân | Ẩn Thân tạo thêm 2 phân thân chạy về 2 hướng, đánh lạc hướng đối thủ. |
| 12 | b | Độc Sát Chuyên Nghiệp | Đánh trúng cùng một tướng 3 lần trong 3s: choáng + câm lặng 1s (mỗi mục tiêu 8s). |
| 12 | c | Lưỡi Dao Đoạt Mạng | Đòn sau lưng lên tướng dưới 30% máu: +80% sát thương. |

**Lối build gợi ý (AI dùng)**
- Sát Thủ: giày Giày Đinh Gỉ → Dao Ám Ảnh → Kiếm Bão Táp → Dao Tử Thần → Mũi Khoan Thép → Khăn Thanh Tẩy
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Đơn Đấu: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái
- Mảnh hồn yêu thích: Hồn Thấu Thị Thảo Mộc, Hồn Phá Sóng Nhiễu Loạn, Hồn Nguyệt Thực Hắc Ám

<a id="victoria"></a>
### Victoria

**Định danh**
- id: `victoria` • màu chủ đạo: `#e04a4a` • vũ khí/hình ảnh: `flag` • bán kính va chạm: 0.58 đv
- Vai trò: Hỗ trợ (Support) • vị trí: Hỗ trợ, Đường giữa • nhãn: cc
- Cận chiến • sát thương chính: vật lý • tài nguyên: mana
- Tính cách AI: 🦅 Kền Kền — Chờ hai người đánh nhau tới kiệt sức rồi vào dọn. • Phong cách đánh: 🎯 Đứng bắn — Đánh tầm xa nhưng ít di chuyển, không cố thả diều.
- Giai đoạn mạnh: Mạnh đầu trận · Ít cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1512 | 230.4 | 3355.2 | 5428.8 |
| Máu (gốc trong dữ liệu) | 630 | 96 | 1398 | 2262 |
| Mana | 380 | 45 | 740 | 1145 |
| Hồi mana/s (thực tế, ×1.6) | 3.2 | 0.16 | 4.48 | 5.92 |
| SMVL | 60 | 3.6 | 88.8 | 121.2 |
| Giáp | 32 | 3.9 | 63.2 | 98.3 |
| Kháng phép | 30 | 1.5 | 42 | 55.5 |
| Tốc đánh | 0.62 | +1.5% | 0.69 | 0.78 |
| Tốc chạy | 3.35 | — | 3.35 | 3.35 |
| Tầm đánh | 2.4 | — | 2.4 | 2.4 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Quân Lệnh & Cờ Chiến**

3 Lính Tinh Nhuệ hộ vệ và chiến đấu cùng Victoria (chết thì 30s sau hồi sinh). Ưu tiên thế Cờ: Victoria và lính đánh cận chiến càn lướt, lính +25% tốc chạy và kháng khống chế. Hào quang (đồng minh trong 6 đv): 🚩 Cờ +12% tốc chạy, −25% thời gian bị khống chế • 🔥 AR +10% sát thương • 🔫 Lục +giáp/kháng phép.
- Mã nguồn: `src/data/heroes/victoria.js:74`

**S1 — Hỏa Lực Theo Dạng**

- Hồi chiêu: 6 / 5.5 / 5 / 4.5 / 4s • Mana: 40 / 40 / 40 / 40 / 40 • Thi triển: 0.1s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 5.5 đv • Mục đích AI: cấu rỉa
- 🔫 Lục: 1 phát súng lục mạnh • 🔥 AR: loạt 5 viên hình nón • 🚩 Cờ: quét cờ hình vành khuyên (1.5–3.5 đv) làm chậm 30%.
- Công thức trong mã: `[70/105/140/175/210 theo cấp chiêu] + 0.7×SMVL`
- Mã nguồn: `src/data/heroes/victoria.js:104`

**S2 — Thiết Lập Thế Trận**

- Hồi chiêu: 12 / 11.5 / 11 / 10.5 / 10s • Mana: 60 / 60 / 60 / 60 / 60 • Thi triển: 0.1s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 6 đv • Mục đích AI: khống chế
- 🔫 Lục: lướt 3 đv + lá chắn • 🔥 AR: lựu đạn bán kính 2 đẩy lùi • 🚩 Cờ: cắm cờ trong 6 đv — đẩy lùi 1.5 đv và choáng 0.75s, tạo Vùng Đất Quân Lệnh 5s (đồng minh bên trong +15% tốc đánh).
- Công thức trong mã: `[60/90/120/150/180 theo cấp chiêu] + 0.5×SMVL`
- Mã nguồn: `src/data/heroes/victoria.js:125`

**S3 — Tổng Lực Tác Chiến**

- Hồi chiêu: 16 / 15 / 14 / 13 / 12s • Mana: 70 / 70 / 70 / 70 / 70 • Thi triển: 0.15s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 7.5 đv • Trễ nổ: 1.5s • Mục đích AI: khống chế
- 🔫 Lục: pháo điện từ rơi sau 2s, bán kính 3, choáng 1s • 🔥 AR: bão lửa bán kính 3 trong 3s • 🚩 Cờ: lính xung phong vào mục tiêu, mỗi lính choáng 0.5s.
- Công thức trong mã: `[80/120/160/200/240 theo cấp chiêu] + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/victoria.js:152`

**S4 — Mệnh Lệnh Tuyệt Đối**

- Hồi chiêu: 120 / 100 / 80s • Mana: 100 / 100 / 100
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 8 đv • Mục đích AI: chiêu cuối
- Hồi sinh toàn bộ lính; 8s lính hóa Thiết Binh (gấp đôi máu và sát thương); tên lửa nã tướng địch thấp máu nhất trong tầm nhìn (15 đv) mỗi 2s.
- Công thức trong mã: `[150/250/350 theo cấp chiêu] + 0.8×SMVL`
- Mã nguồn: `src/data/heroes/victoria.js:191`

**Skill phụ — Chuyển Đổi Quân Lệnh**

- Hồi chiêu: 4s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 7 đv • Mục đích AI: dồn sát thương
- Xoay Cờ → AR → Lục. Ưu tiên thế Cờ càn lướt cận chiến: gọi pháo kích • Sang AR: ném flash làm mù 1s • Sang Lục: lướt 2.5 đv + lá chắn.
- Mã nguồn: `src/data/heroes/victoria.js:174`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Tiếp Viện Khẩn Cấp | Lính hồi sinh sau 22s (thay vì 30s). |
| 1 | b | Giáp Chống Bạo Động | Lính +30% giáp và kháng phép. |
| 1 | c | Flash Cường Quang | Flash khi đổi sang AR làm mù lâu hơn 0.75s. |
| 3 | a | Lưới Đạn AR | Bão lửa (S3 dạng AR) làm chậm 60% và cấm lướt. |
| 3 | b | Lá Chắn Thị Vệ | Đòn chí tử: lính gần nhất lao vào chịu đòn thay và hy sinh (hồi 45s). |
| 3 | c | Cờ Khải Hoàn | Đứng trong Vùng Đất Quân Lệnh: đồng minh hồi chiêu nhanh hơn 20%. |
| 6 | a | Thu Hồi Cờ Lệnh | Sau khi cắm cờ: dùng lại để nhổ cờ, giật kẻ địch gần cờ về phía Victoria. |
| 6 | b | Đạn Phá Giáp | Phát súng lục (S1 dạng Lục) xuyên thấu và làm nứt giáp 3s: mục tiêu nhận thêm 20% sát thương từ cả đội. |
| 6 | c | Bọc Lót Chiến Thuật | Lướt của Thiết Lập Thế Trận (dạng Lục) để lại khói làm mù kẻ địch. |
| 9 | a | Trận Địa Donut Tử Thần | Vành quét cờ +40% sát thương; mục tiêu đang choáng nhận gấp đôi. |
| 9 | b | Pháo Điện Từ Xuyên Âm | Pháo điện từ rơi sau 1s (thay vì 2s). |
| 9 | c | Quân Đội Thép | Thêm 1 Lính Tinh Nhuệ (tối đa 4). |
| 12 | a | Bậc Thầy Chỉ Huy | Victoria tự bắn yếu đi một nửa nhưng lính +60% sát thương và hồi sinh sau 20s. |
| 12 | b | Pháo Đài Di Động | Mệnh Lệnh Tuyệt Đối thêm laser quét 180° phía trước (7 đv). |
| 12 | c | Kỷ Luật Sắt | Hạ gục tướng: lập tức hồi sinh toàn bộ lính đã chết. |

**Lối build gợi ý (AI dùng)**
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Tốc Đánh: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Cung Thần Phong → Dao Cắt Gân → Cung Gió Lốc → Huyết Kiếm Đoạt Mệnh
- Hộ Vệ: giày Giày Thép → Khiên Lâm Thần → Chuông Thức Tỉnh → Vương Miện Bất Khả Xâm Phạm → Giáp Ma Quái → Áo Choàng Thánh Linh
- Mảnh hồn yêu thích: Hồn Phá Ảo Chân Thị, Hồn Thính Giác Địa Chấn, Hồn Huyết Tế Toàn Cảnh

<a id="wukong"></a>
### Wukong

**Định danh**
- id: `wukong` • màu chủ đạo: `#e0a030` • vũ khí/hình ảnh: `pole` • bán kính va chạm: 0.62 đv
- Vai trò: Đấu sĩ (Fighter) • vị trí: Đi rừng, Đường trên • nhãn: cc
- Cận chiến • sát thương chính: vật lý • tài nguyên: không dùng mana
- Tính cách AI: 🃏 Quấy Nhiễu — Cướp đồ ngay trước mặt người khác, đặt bẫy trêu ngươi, cấu một phát rồi dây móc chuồn. • Phong cách đánh: 🛡 Lì đòn — Đã vào trận là đánh tới cùng, không bỏ chạy.
- Giai đoạn mạnh: Mạnh giữa trận · Cần đồ vừa phải

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1476 | 232.8 | 3338.4 | 5433.6 |
| Máu (gốc trong dữ liệu) | 615 | 97 | 1391 | 2264 |
| SMVL | 65 | 3.9 | 96.2 | 131.3 |
| Giáp | 31 | 4 | 63 | 99 |
| Kháng phép | 32 | 1.8 | 46.4 | 62.6 |
| Tốc đánh | 0.68 | +2.4% | 0.81 | 0.96 |
| Tốc chạy | 3.55 | — | 3.55 | 3.55 |
| Tầm đánh | 2 | — | 2 | 2 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Côn Thức Vũ**

Côn Thức (0–100) tích khi đánh trúng (+6), bị tướng đánh (+4), chiêu trúng tướng (+8). Đủ 50: chiêu kế tiếp được cường hóa; đủ 100: cường hóa tối đa. Chiêu cường hóa gắn Khí Ấn lên tướng trúng (tối đa 2, 4s).
- Mã nguồn: `src/data/heroes/wukong.js:29`

**S1 — Toàn Phong Côn**

- Hồi chiêu: 7 / 6.5 / 6 / 5.5 / 5s • Thi triển: 0.05s
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 2.3 đv • Mục đích AI: dồn sát thương
- Xoay côn 0.5s quanh người (2 nhịp), gạt đạn nhỏ bay tới. Cường hóa: hút kẻ địch vào tâm.
- Công thức trong mã: `[35/52/69/86/103 theo cấp chiêu] + 0.4×SMVL`
- Mã nguồn: `src/data/heroes/wukong.js:48`

**S2 — Trực Thích**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Thi triển: 0.15s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 3.8 đv • Mục đích AI: cấu rỉa
- Thúc côn thẳng 4 đv, đẩy lùi kẻ trúng đầu tiên 2 đv. Cường hóa: dài gấp đôi và xuyên qua mọi kẻ địch.
- Công thức trong mã: `[70/105/140/175/210 theo cấp chiêu] + 0.8×SMVL`
- Mã nguồn: `src/data/heroes/wukong.js:66`

**S3 — Kình Thiên Trụ**

- Hồi chiêu: 14 / 13 / 12 / 11 / 10s • Thi triển: 0.05s
- Nhắm: Chọn điểm / hướng (point) • Tầm AI: 5 đv • Trễ nổ: 0.8s • Đạn định hướng (né được) • Mục đích AI: mở giao tranh
- Chống gậy bật lên không thể bị chọn 0.8s; trong lúc trên không TỰ CHỌN điểm đáp bất kỳ trong vùng 5 đv quanh chỗ chống gậy (bám theo kẻ địch đang né), 0.3s trước khi bổ xuống mới lộ điểm đáp: hất tung 0.75s bán kính 2.5. Cường hóa: gồng thêm, choáng 1s (tối đa 1.5s) bán kính 3.5.
- Công thức trong mã: `15 + 4×cấp + 0.2×SMVL` • `[70/110/150/190/230 theo cấp chiêu] + 0.8×SMVL`
- Mã nguồn: `src/data/heroes/wukong.js:92`

**S4 — Đại Thánh Hàng Thế**

- Hồi chiêu: 120 / 100 / 85s • Thi triển: 0.1s
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 3.2 đv • Bán kính vùng: 3.5 đv • Mục đích AI: chiêu cuối
- Sóng côn 360° đẩy lùi 2.5 đv bán kính 3.5; 6s không thể cản phá, +30% tốc chạy, Toàn Phong Côn và Trực Thích tự cường hóa.
- Công thức trong mã: `[120/200/280 theo cấp chiêu] + 0.8×SMVL` • `[100/160/220 theo cấp chiêu] + 0.6×SMVL`
- Mã nguồn: `src/data/heroes/wukong.js:146`

**Skill phụ — Định Thân Thuật**

- Hồi chiêu: 20s • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 5 đv • Chỉ nhắm tướng • Mục đích AI: khống chế
- Chỉ dùng được lên tướng địch trong 5 đv đang có 2 Khí Ấn: hóa đá 1.5s.
- Mã nguồn: `src/data/heroes/wukong.js:132`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Côn Pháp Nhập Môn | Côn Thức tích từ đòn đánh +9 (thay vì +6). |
| 1 | b | Thân Pháp Khỉ Đột | Kình Thiên Trụ bổ xuống xa hơn 25%. |
| 1 | c | Sải Côn Dài | Toàn Phong Côn và Trực Thích tăng 20% tầm với. |
| 3 | a | Phong Áp Cản Đạn | Toàn Phong Côn triệt tiêu mọi đạn bay vào (kể cả đạn hạng nặng) trong 3.2 đv. |
| 3 | b | Rung Chấn Địa Tầng | Cú bổ của Kình Thiên Trụ để lại vùng nứt 3s làm chậm 50%. |
| 3 | c | Thúc Gãy Xương | Trực Thích đẩy kẻ địch va vào tường: choáng thêm 1.25s. |
| 6 | a | Hoành Tảo Đoạt Mệnh | Trực Thích trúng tướng: trong 2s dùng lại để trượt tới quét ngang, hất ngã 1s. |
| 6 | b | Hộ Thân Kim Cang | Toàn Phong Côn thành lồng chuông 1.5s: chặn 1 đòn bất kỳ và đẩy bật kẻ tấn công 2 đv. |
| 6 | c | Đẩu Vân Đạp Tuyết | Kình Thiên Trụ lướt thêm 2.5 đv trên không trước khi bổ xuống. |
| 9 | a | Côn Khí Tự Sinh | Côn Thức chạm 100: hồi ngay S1–S3 (20s). |
| 9 | b | Định Thân Lan Tỏa | Định Thân Thuật choáng 1s các tướng địch khác trong 2 đv quanh nạn nhân. |
| 9 | c | Cột Trụ Trời Chấn Động | Kình Thiên Trụ cường hóa tối đa: rộng 5 đv và phá mọi lá chắn. |
| 12 | a | Phân Thân Hầu Vương | Kình Thiên Trụ để lại phân thân xoay côn tại chỗ cũ 1.5s, hút kẻ địch. |
| 12 | b | Vạn Trượng Kim Bổng | Đại Thánh Hàng Thế thêm côn khổng lồ đè 8×3 đv phía trước: choáng 1s. |
| 12 | c | Kim Cang Bất Hoại | Trong Đại Thánh Hàng Thế: giảm 30% sát thương nhận. |

**Lối build gợi ý (AI dùng)**
- Đấu Sĩ: giày Giày Thép → Rìu Hắc Thiết → Xích Hồn Đồng Quy → Huyết Kiếm Đoạt Mệnh → Giáp Gai → Trái Tim Cự Thạch
- Đơn Đấu: giày Giày Cuồng Chiến → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Dao Tử Thần → Khăn Thanh Tẩy → Giáp Ma Quái
- Đỡ Đòn: giày Giày Thép → Vương Miện Bất Khả Xâm Phạm → Giáp Gai → Áo Giáp Dung Nham → Trái Tim Cự Thạch → Áo Choàng Thánh Linh
- Mảnh hồn yêu thích: Hồn Trường Nhận Phong Khí, Hồn Thần Tốc Thiên Mệnh, Hồn Titan Phá Giới

<a id="zero"></a>
### Zero

**Định danh**
- id: `zero` • màu chủ đạo: `#9aa0a8` • vũ khí/hình ảnh: `pistol` • bán kính va chạm: 0.6 đv
- Vai trò: Xạ thủ (Marksman) • vị trí: Xạ thủ (đường dưới) • nhãn: autos, crit
- Tầm xa • sát thương chính: vật lý • tài nguyên: mana
- Đạn đánh thường: kiểu `plasma`, tốc độ 30 đv/s
- Dùng **súng & băng đạn**: đánh thường tốn đạn, hết đạn phải nạp (xem nội tại).
- Tính cách AI: 📐 Cầu Toàn — Phải lên đúng bộ sở trường: luôn theo lối build số 1, không đổi món theo đối thủ; chỉ gắn mảnh hồn yêu thích / hợp build, săn và đổi chác cho bằng đủ bộ; chưa đủ bộ thì ngại đánh lớn. • Phong cách đánh: 🏹 Thả diều — Giữ đối thủ ở mép tầm bắn, đi lên xuống giữa hai phát bắn, lướt né khi bị áp sát.
- Giai đoạn mạnh: Mạnh cuối trận · Cần đồ

**Chỉ số**
| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |
|---|---|---|---|---|
| Máu (thực tế, đã ×2.4) | 1344 | 211.2 | 3033.6 | 4934.4 |
| Máu (gốc trong dữ liệu) | 560 | 88 | 1264 | 2056 |
| Mana | 320 | 40 | 640 | 1000 |
| Hồi mana/s (thực tế, ×1.6) | 2.56 | 0.13 | 3.58 | 4.74 |
| SMVL | 71 | 4.2 | 104.6 | 142.4 |
| Giáp | 26 | 3.8 | 56.4 | 90.6 |
| Kháng phép | 30 | 1.3 | 40.4 | 52.1 |
| Tốc đánh | 0.68 | +2.8% | 0.83 | 1 |
| Tốc chạy | 3.3 | — | 3.3 | 3.3 |
| Tầm đánh | 6.2 | — | 6.2 | 6.2 |
| Hộ Giáp | 100 | 15 | 220 | 355 |

**Nội tại — Vũ Trang Hiện Đại**

Đánh thường dùng băng 9 viên; hết đạn phải nạp 1.6s. Đạn mạnh.
- Mã nguồn: `src/data/heroes/zero.js:17`

**S1 — Khóa Mục Tiêu**

- Hồi chiêu: 10 / 9.5 / 9 / 8.5 / 8s • Mana: 30 / 30 / 30 / 30 / 30 • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 8.5 đv • Chỉ nhắm tướng • Mục đích AI: dồn sát thương
- Đánh dấu một tướng trong 9 đv trong 6s: +10% sát thương đánh thường lên nó và lộ hình. Bắn trúng 5 lần thì S3 kế tiếp được cường hóa.
- Công thức trong mã: `60 + 10×ucấp + 0.5×SMVL`
- Mã nguồn: `src/data/heroes/zero.js:49`

**S2 — Xả Băng**

- Hồi chiêu: 9 / 8.5 / 8 / 7.5 / 7s • Mana: 50 / 50 / 50 / 50 / 50 • Có điều kiện dùng riêng (xem mô tả)
- Nhắm: Chỉ định mục tiêu (unit) • Tầm AI: 6 đv • Mục đích AI: dồn sát thương
- Xả toàn bộ đạn còn lại thật nhanh vào mục tiêu (mỗi viên 80% sát thương đánh thường), rồi nạp đạn.
- Mã nguồn: `src/data/heroes/zero.js:70`

**S3 — Nhảy Lùi**

- Hồi chiêu: 12 / 11 / 10 / 9 / 8s • Mana: 40 / 40 / 40 / 40 / 40
- Nhắm: Hướng ra xa địch (thoát thân) • Tầm AI: 3 đv • Mục đích AI: thoát thân
- Nhảy lùi 3 đv, giảm 25% sát thương nhận 1s. Cường hóa: lướt 5 đv tức thì và nạp đầy đạn.
- Mã nguồn: `src/data/heroes/zero.js:100`

**S4 — Băng Đạn Nổ**

- Hồi chiêu: 90 / 75 / 60s • Mana: 100 / 100 / 100
- Nhắm: Tự thân / quanh mình (self) • Tầm AI: 6.5 đv • Mục đích AI: chiêu cuối
- Nạp ngay băng đạn nổ trong 8s: +30% tốc đánh, đạn mạnh hơn 30/40/50% và nổ lan bán kính 1.5 (50%).
- Mã nguồn: `src/data/heroes/zero.js:122`

**Cây tiến hóa**

| Cấp | Nhánh | Tên | Hiệu ứng |
|---|---|---|---|
| 1 | a | Thay Đạn Chiến Thuật | Nạp đạn 1.2s (thay vì 1.6s). |
| 1 | b | Giáp Phản Phản Ứng | Nhảy Lùi (S3) giảm 25% sát thương trong 2s (thay vì 1s). |
| 1 | c | Đạn Gia Tốc | Đạn bay nhanh hơn 40%, +0.4 tầm bắn. (+0.4 Tầm đánh) |
| 3 | a | Khóa Họng Súng | Chỉ cần 4 phát trúng mục tiêu bị Khóa (thay vì 5) để cường hóa Nhảy Lùi. |
| 3 | b | Viên Đạn Áp Chế | Viên cuối của Xả Băng (S2) choáng 0.6s. |
| 3 | c | Khói Ngụy Trang | Nhảy Lùi để lại màn khói: Zero tàng hình 1.5s. |
| 6 | a | Đạn Chùm Càn Quét | Xả Băng tỏa hình quạt 90° thay vì bắn thẳng một mục tiêu. |
| 6 | b | Kích Nổ Dấu Ấn | Mục tiêu đang bị Khóa: dùng lại Khóa Mục Tiêu để kích nổ — 60 (+10/cấp) sát thương, câm lặng 1.2s, đẩy lùi 1.5 đv. |
| 6 | c | Phản Xạ Điệp Viên | Bị tướng cận chiến đánh trúng khi dưới 50% máu: tự lướt né 3 đv (hồi 15s). |
| 9 | a | Băng Đạn Hủy Diệt | Đạn nổ của Băng Đạn Nổ (S4) lan rộng 2.2 đv và câm lặng tướng 0.5s. |
| 9 | b | Nạp Đạn Thần Tốc | Nhảy Lùi cường hóa: 2 lần nạp đạn kế tiếp chỉ mất 0.5s. |
| 9 | c | Xuyên Giáp Quân Dụng | Đạn của Xả Băng bỏ qua 30% giáp. |
| 12 | a | Dịch Chuyển Ám Sát | Nhảy Lùi cường hóa dịch chuyển ra sau lưng mục tiêu bị Khóa (trong 8 đv) và tự xả 3 viên. |
| 12 | b | Hỏa Lực Tuyệt Mật | Băng đạn 14 viên, +20% tốc đánh; mỗi viên −10% sát thương. (+20% Tốc đánh) |
| 12 | c | Triệt Tiêu Hoàn Toàn | Mục tiêu bị Khóa nhận thêm 15% sát thương từ mọi nguồn. |

**Lối build gợi ý (AI dùng)**
- Xạ Thủ Súng: giày Giày Cuồng Chiến → Cung Thần Phong → Đao Phá Quân → Song Đao Tàn Huyết → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Chí Mạng: giày Giày Cuồng Chiến → Đao Phá Quân → Cung Gió Lốc → Kiếm Bão Táp → Huyết Kiếm Đoạt Mệnh → Mũi Khoan Thép
- Xuyên Giáp: giày Giày Đinh Gỉ → Dao Ám Ảnh → Dao Tử Thần → Mũi Khoan Thép → Kiếm Bão Táp → Khăn Thanh Tẩy
- Mảnh hồn yêu thích: Hồn Đoạt Mệnh Nạp Tức Thì, Hồn Đầu Đạn Phá Giáp, Hồn Kim Thần Tiếp Đạn

## 4. Trang bị
- 47 món hoàn chỉnh, tối đa 6 ô. Mỗi món có phôi (40% giá, 40% chỉ số). Bán lại 50%.
| Món | id | Loại | Giá | Chỉ số | Hiệu ứng riêng |
|---|---|---|---|---|---|
| Huyết Kiếm Đoạt Mệnh | `huyet_kiem` | ad | 2600 | +55 SMVL · +15% Hút máu | +55 SMVL · +15% Hút máu • Hút máu khi đầy máu chuyển thành lá chắn (tối đa 60 + 12/cấp). |
| Đao Phá Quân | `dao_pha_quan` | ad | 2900 | +60 SMVL · +20% Chí mạng | +60 SMVL · +20% Chí mạng • Chí mạng gây 225% sát thương (thay vì 175%). |
| Cung Gió Lốc | `cung_gio_loc` | ad | 2600 | +35% Tốc đánh · +20% Chí mạng · +5% Tốc chạy | +35% Tốc đánh · +20% Chí mạng · +5% Tốc chạy • Mỗi đòn đánh thứ 3 nảy sang 2 mục tiêu gần đó (60% SMVL). |
| Mũi Khoan Thép | `mui_khoan` | ad | 2800 | +40 SMVL · +30% Xuyên giáp | +40 SMVL · +30% Xuyên giáp |
| Dao Cắt Gân | `dao_cat_gan` | ad | 2200 | +30 SMVL · +25% Tốc đánh | +30 SMVL · +25% Tốc đánh • Đánh thường gây Vết Thương Sâu 3s (−40% hồi máu). |
| Song Đao Tàn Huyết | `song_dao` | ad | 2800 | +35% Tốc đánh · +30 SMVL | +35% Tốc đánh · +30 SMVL • Đánh thường +3% máu hiện tại của mục tiêu (tối đa 60 với quái/lính). |
| Dao Ám Ảnh | `dao_am_anh` | ad | 2500 | +50 SMVL · +12 Xuyên giáp | +50 SMVL · +12 Xuyên giáp • Đòn đánh đầu tiên lên tướng sau khi bước ra từ bụi cỏ / sương mù: +40 (+4/cấp) sát thương và làm chậm 30% 1.5s (10s). |
| Rìu Hắc Thiết | `riu_hac_thiet` | ad | 3000 | +40 SMVL · +350 Máu · +15% Giảm hồi chiêu | +40 SMVL · +350 Máu · +15% Giảm hồi chiêu • Đánh trúng tướng giảm 5% giáp mỗi tầng (tối đa 6 tầng, 6s). |
| Mũ Hỏa Thần | `mu_hoa_than` | ap | 3200 | +110 SMPT | +110 SMPT • +25% sức mạnh phép. |
| Trượng Hư Vô | `truong_hu_vo` | ap | 2700 | +65 SMPT · +35% Xuyên phép | +65 SMPT · +35% Xuyên phép |
| Bùa Tro Tàn | `bua_tro_tan` | ap | 2500 | +60 SMPT · +250 Máu | +60 SMPT · +250 Máu • Chiêu trúng tướng gây thiêu đốt 3s và Vết Thương Sâu. |
| Gậy Băng Giá | `gay_bang_gia` | ap | 2600 | +60 SMPT · +350 Máu | +60 SMPT · +350 Máu • Chiêu gây sát thương làm chậm 25% trong 1s (chiêu diện rộng 15%). |
| Ngọc Hiền Triết | `ngoc_hien_triet` | ap | 2500 | +55 SMPT · +300 Mana · +2 Hồi mana/s · +10% Giảm hồi chiêu | +55 SMPT · +300 Mana · +2 Hồi mana/s · +10% Giảm hồi chiêu • Chiêu trúng tướng hồi 3% mana tối đa (1 lần mỗi giây). |
| Mặt Nạ Nguyền Rủa | `mat_na` | ap | 2700 | +55 SMPT · +400 Máu | +55 SMPT · +400 Máu • Sát thương phép đốt 1% máu tối đa mỗi giây trong 3s; mục tiêu nhận thêm 10% sát thương phép. |
| Pháp Châu Sấm Sét | `phap_chau` | ap | 2600 | +65 SMPT · +5% Tốc chạy · +12 Xuyên phép | +65 SMPT · +5% Tốc chạy · +12 Xuyên phép • Mỗi 8s, chiêu trúng tướng phóng sét gây thêm 50 (+5/cấp, +25% SMPT) sát thương phép. |
| Giáp Gai | `giap_gai` | def | 2500 | +60 Giáp · +250 Máu | +60 Giáp · +250 Máu • Bị tướng đánh thường: phản 12 (+10% giáp, +1/cấp) sát thương phép và gây Vết Thương Sâu 3s. |
| Khiên Băng Vĩnh Cửu | `khien_bang` | def | 2600 | +55 Giáp · +300 Mana · +15% Giảm hồi chiêu | +55 Giáp · +300 Mana · +15% Giảm hồi chiêu • Kẻ đánh thường vào bạn bị −15% tốc đánh 1.5s. |
| Áo Choàng Hư Không | `ao_hu_khong` | def | 2500 | +55 Kháng phép · +300 Máu | +55 Kháng phép · +300 Máu • Sát thương phép làm máu xuống dưới 35%: nhận lá chắn 120 (+12/cấp) trong 4s (60s). |
| Trái Tim Cự Thạch | `tim_cu_thach` | def | 2800 | +800 Máu | +800 Máu • Hồi 1% máu tối đa mỗi giây khi 4s không trúng đòn (0.2% khi đang giao tranh). |
| Áo Choàng Bóng Đêm | `ao_bong_dem` | def | 2400 | +50 Giáp · +300 Máu | +50 Giáp · +300 Máu • Giảm 30% sát thương chí mạng nhận vào. |
| Mũ Trấn Hồn | `mu_tran_hon` | def | 2400 | +45 Kháng phép · +350 Máu · +30% Kháng hiệu ứng | +45 Kháng phép · +350 Máu · +30% Kháng hiệu ứng |
| Áo Choàng Thánh Linh | `ao_thanh_linh` | def | 2700 | +50 Kháng phép · +350 Máu | +50 Kháng phép · +350 Máu • Lá chắn phép chặn 1 chiêu của tướng địch (cả sát thương lẫn khống chế), hồi 40s. |
| Vương Miện Bất Khả Xâm Phạm | `vuong_mien` | def | 2900 | +35 Giáp · +35 Kháng phép · +350 Máu | +35 Giáp · +35 Kháng phép · +350 Máu • Máu xuống dưới 30%: nhận lá chắn 180 (+18/cấp) trong 3s (90s). |
| Lệnh Bài Chinh Phạt | `lenh_bai` | sup | 400 | +60 Máu · +0.6 Hồi máu/s | +60 Máu · +0.6 Hồi máu/s • Đồ khởi điểm hỗ trợ: +10 vàng khi đánh trúng tướng địch (5s); +6 vàng khi lính địch chết trong 8 đv quanh bạn. |
| Lư Hương Cổ | `lu_huong` | sup | 2300 | +40 SMPT · +2 Hồi mana/s · +10% Giảm hồi chiêu | +40 SMPT · +2 Hồi mana/s · +10% Giảm hồi chiêu • Hồi máu hoặc tạo lá chắn cho đồng minh: đồng minh đó +15% tốc đánh 6s. |
| Ngọc Bội Hộ Mệnh | `ngoc_boi` | sup | 2400 | +30 Giáp · +30 Kháng phép · +200 Máu | +30 Giáp · +30 Kháng phép · +200 Máu • Kích hoạt: lá chắn 120 (+20/cấp) cho đồng minh trong 7 đv, 2.5s (90s). |
| Chuông Thức Tỉnh | `chuong_thuc_tinh` | sup | 2200 | +250 Máu · +250 Mana · +10% Giảm hồi chiêu | +250 Máu · +250 Mana · +10% Giảm hồi chiêu • Đồng minh trong 8 đv tiến về phía tướng địch gần đó: +15% tốc chạy. |
| Kính Cú Đêm | `kinh_cu_dem` | sup | 2200 | +250 Máu · +10% Giảm hồi chiêu | +250 Máu · +10% Giảm hồi chiêu • Kích hoạt: cắm đèn soi tầm nhìn 9 đv trong 75s, giữ tối đa 2 đèn (hồi 45s). Nguồn tầm nhìn cắm được duy nhất. |
| Giày Thép | `giay_thep` | boots | 1000 | +10% Tốc chạy · +20 Giáp | +10% Tốc chạy · +20 Giáp • Giảm 12% sát thương đánh thường nhận vào. |
| Giày Thủy Ngân | `giay_thuy_ngan` | boots | 1000 | +10% Tốc chạy · +25 Kháng phép · +30% Kháng hiệu ứng | +10% Tốc chạy · +25 Kháng phép · +30% Kháng hiệu ứng |
| Giày Cuồng Chiến | `giay_cuong_chien` | boots | 1000 | +10% Tốc chạy · +35% Tốc đánh | +10% Tốc chạy · +35% Tốc đánh |
| Giày Khai Sáng | `giay_khai_sang` | boots | 900 | +10% Tốc chạy · +15% Giảm hồi chiêu | +10% Tốc chạy · +15% Giảm hồi chiêu |
| Giày Đinh Gỉ | `giay_dinh_gi` | boots | 900 | +16% Tốc chạy | +16% Tốc chạy • Thêm 8% tốc chạy khi 5s không giao tranh. |
| Đồng Hồ Cát Nghịch Đảo | `dong_ho_cat` | active | 2600 | +65 SMPT · +40 Giáp | +65 SMPT · +40 Giáp • Kích hoạt: bất động và miễn sát thương 2.5s (120s). |
| Khăn Thanh Tẩy | `khan_thanh_tay` | active | 2600 | +40 SMVL · +35 Kháng phép | +40 SMVL · +35 Kháng phép • Kích hoạt: xóa mọi hiệu ứng khống chế (90s). |
| Xích Hồn Đồng Quy | `xich_hon` | active | 2500 | +40 SMVL · +300 Máu | +40 SMVL · +300 Máu • Kích hoạt: lao tới tướng địch trong 6 đv, làm chậm 40% 2s (60s). |
| Thủy Tinh Sinh Mệnh | `thuy_tinh` | active | 2500 | +300 Máu · +30 Kháng phép · +10% Giảm hồi chiêu | +300 Máu · +30 Kháng phép · +10% Giảm hồi chiêu • Kích hoạt: sau 1.5s hồi 100 (+20/cấp) máu cho đồng minh trong 6 đv (90s). |
| Kiếm Bão Táp | `kiem_bao_tap` | ad | 2700 | +45 SMVL · +15% Chí mạng · +5% Tốc chạy | +45 SMVL · +15% Chí mạng · +5% Tốc chạy • Hạ gục / hỗ trợ hạ tướng: +30% tốc chạy 2s và hồi 8% máu tối đa. |
| Cung Thần Phong | `cung_than_phong` | ad | 2800 | +40% Tốc đánh · +25 SMVL | +40% Tốc đánh · +25 SMVL • Đánh thường liên tục cùng một mục tiêu: mỗi đòn +5% sát thương (tối đa 5 tầng, mất khi đổi mục tiêu hoặc 3s không đánh). |
| Dao Tử Thần | `dao_tu_than` | ad | 2900 | +55 SMVL · +15 Xuyên giáp | +55 SMVL · +15 Xuyên giáp • Đòn đánh và chiêu lên tướng dưới 35% máu: +12% sát thương. |
| Trâm Thần Kỳ | `tram_than_ky` | ap | 2700 | +70 SMPT · +15% Giảm hồi chiêu | +70 SMPT · +15% Giảm hồi chiêu • Dùng chiêu cuối: hồi ngay 20% hồi chiêu còn lại của S1–S3. |
| Quả Cầu Linh Hồn | `qua_cau_linh_hon` | ap | 2500 | +50 SMPT · +300 Máu · +200 Mana | +50 SMPT · +300 Máu · +200 Mana • Hạ gục / hỗ trợ: +12 SMPT vĩnh viễn trong trận (tối đa 10 lần). |
| Nhẫn Hoàng Kim | `nhan_hoang_kim` | ap | 2600 | +60 SMPT · +10 Xuyên phép · +200 Máu | +60 SMPT · +10 Xuyên phép · +200 Máu • Chiêu trúng tướng giảm 10 kháng phép trong 4s (cộng dồn 2 lần). |
| Giáp Ma Quái | `giap_ma_quai` | def | 2600 | +45 Giáp · +30 Kháng phép · +200 Máu | +45 Giáp · +30 Kháng phép · +200 Máu • Bị khống chế (choáng, trói, hất tung…): nhận lá chắn 100 (+10/cấp) trong 3s (20s). |
| Áo Giáp Dung Nham | `ao_dung_nham` | def | 2700 | +450 Máu · +25 Giáp | +450 Máu · +25 Giáp • Thiêu kẻ địch quanh mình (2.4 đv): 12 (+1% máu tối đa) sát thương phép mỗi giây. |
| Khiên Lâm Thần | `khien_lam_than` | sup | 2300 | +250 Máu · +20 Giáp · +20 Kháng phép · +10% Giảm hồi chiêu | +250 Máu · +20 Giáp · +20 Kháng phép · +10% Giảm hồi chiêu • Mỗi 6s, đòn đánh / chiêu trúng tướng địch: đồng minh máu thấp nhất trong 8 đv nhận lá chắn 60 (+8/cấp) 3s. |
| Đèn Lồng Tinh Linh | `den_long_tinh` | sup | 2200 | +40 SMPT · +1.5 Hồi mana/s · +200 Máu · +6% Tốc chạy | +40 SMPT · +1.5 Hồi mana/s · +200 Máu · +6% Tốc chạy • Đồng minh trong 7 đv +6% tốc chạy. |

## 5. Vật phẩm dùng 1 lần, bình & phép bổ trợ
| Vật phẩm | id | Nhóm | Giá | Chồng tối đa | Mô tả |
|---|---|---|---|---|---|
| 🧪 Bình Máu Nhỏ | `hp_s` | bình | 45 | 3 | Uống 1.4s (đi chậm, trúng đòn là hỏng), xong hồi ngay 20% máu tối đa. |
| 🧪 Bình Máu Vừa | `hp_m` | bình | 90 | 3 | Uống 1.8s (đi chậm, trúng đòn là hỏng), xong hồi ngay 35% máu tối đa. |
| 🧪 Bình Máu To | `hp_l` | bình | 160 | 3 | Uống 2.3s (đi chậm, trúng đòn là hỏng), xong hồi ngay 55% máu tối đa. |
| 💧 Bình Mana Nhỏ | `mp_s` | bình | 35 | 3 | Uống 1.0s (trúng đòn là hỏng), xong hồi ngay 25% mana. |
| 💧 Bình Mana Vừa | `mp_m` | bình | 70 | 3 | Uống 1.3s (trúng đòn là hỏng), xong hồi ngay 45% mana. |
| 💧 Bình Mana To | `mp_l` | bình | 120 | 3 | Uống 1.7s (trúng đòn là hỏng), xong hồi ngay 70% mana. |
| 🛡 Bình Hộ Vệ Nhỏ | `ga_s` | bình | 50 | 3 | Uống 1.0s (trúng đòn là hỏng), xong hồi ngay 30% Hộ Giáp tối đa. |
| 🛡 Bình Hộ Vệ Vừa | `ga_m` | bình | 100 | 3 | Uống 1.4s (trúng đòn là hỏng), xong hồi ngay 55% Hộ Giáp tối đa. |
| 🛡 Bình Hộ Vệ To | `ga_l` | bình | 170 | 3 | Uống 1.8s (trúng đòn là hỏng), xong hồi ngay 100% Hộ Giáp tối đa. |
| 🌟 Bình Thuốc Rực Rỡ | `radiant` | đặc biệt | 0 | 2 | Dùng tức thì: hồi đầy máu và Hộ Giáp. |
| ⚡ Tốc Biến | `flash` | phép bổ trợ | 180 | 1 | Dịch chuyển tức thời 4 đv. |
| 👻 Tốc Hành | `ghost` | phép bổ trợ | 120 | 2 | +35% tốc chạy trong 6s. |
| 💚 Hồi Máu | `heal` | phép bổ trợ | 150 | 2 | Hồi ngay 15% máu tối đa, +20% tốc chạy 2s. |
| 🛡 Lá Chắn | `barrier` | phép bổ trợ | 150 | 2 | Khiên bằng 20% máu tối đa trong 3s. |
| 🔥 Thiêu Đốt | `ignite` | phép bổ trợ | 140 | 2 | Thiêu 1 tướng trong 6 đv: 2% máu tối đa của nó mỗi giây trong 5s, vết thương sâu. |
| 🥀 Kiệt Sức | `exhaust` | phép bổ trợ | 140 | 2 | Tướng địch trong 6 đv: chậm 35% và gây ít hơn 35% sát thương trong 2.5s. |
| ✨ Thanh Tẩy | `cleanse` | phép bổ trợ | 120 | 2 | Xóa mọi khống chế, kháng hiệu ứng +60% trong 2s (dùng được khi đang bị khống chế). |
| ☄ Trừng Trị | `smite` | phép bổ trợ | 100 | 2 | Sát thương chuẩn 500 + 60×cấp lên quái / boss trong 5 đv (lên tướng: 10% máu tối đa). |
| 🌀 Dịch Chuyển | `tp` | phép bổ trợ | 220 | 1 | Niệm 3s (bị đánh thì hỏng) rồi dịch chuyển tới Thương Nhân gần tâm bo nhất. |
| 🪝 Dây Móc | `hook` | dụng cụ | 160 | 2 | Phóng dây tới vách đá / chỗ cao trong 9 đv rồi đu tới (vượt tường, lên chỗ cao), không thể bị chọn khi đu. |
| 🪤 Bẫy Kẹp | `trap` | dụng cụ | 90 | 3 | Đặt bẫy ẩn (90s): kẻ địch đạp vào bị trói 1.5s, lộ diện 4s, mất 6% máu tối đa. |
| 💣 Bom Tự Chế | `bomb` | dụng cụ | 160 | 2 | Ném tới điểm trong 6 đv, nổ sau 0.6s (bán kính 2.5): 10% máu tối đa và đẩy lùi. |
| 📜 Phù Kháng Độc | `fu_doc` | phù | 150 | 2 | Nhận ít hơn 65% sát thương bo trong 25s. |
| 🧿 Phù Hộ Mệnh | `fu_ho` | phù | 200 | 1 | Dán lên người 60s: đòn chí mạng kế tiếp chỉ để lại 1 máu và cho khiên 15% máu tối đa. |
| 🌫 Phù Ẩn Thân | `fu_an` | phù | 160 | 1 | Tàng hình 4s (đánh / dùng chiêu thì lộ). |
| 🌪 Phù Thần Tốc | `fu_tuc` | phù | 110 | 2 | +40% tốc chạy 4s, miễn làm chậm. |
| 📡 Cột Sóng Trinh Sát | `scout_tower` | dụng cụ | 130 | 2 | Cắm cột phát sóng tại chỗ (tồn tại 45s): Quét và làm lộ diện toàn bộ tướng địch trong bán kính 16 đv (kể cả núp bụi), vô hiệu hóa tàng hình trong vùng quét. |
| 🧲 Lựu Đạn Xung Điện | `emp_grenade` | dụng cụ | 150 | 2 | Ném tới điểm trong 7 đv, nổ sau 0.5s (bán kính 2.5 đv): Phá hủy ngay 350 Hộ Giáp (+30/cấp) của mọi mục tiêu và cấm dùng Dây Móc trong 2.5s. |
| 🪞 Gương Ảo Ảnh Bỏ Túi | `mirror_decoy` | dụng cụ | 170 | 1 | Tạo ngay 1 phân thân chạy thẳng về phía trước trong 4s để đánh lừa đối thủ và quái rừng; bản thân nhận tàng hình 1.5s và tăng 25% tốc chạy. |
| ❄ Bẫy Băng Cổ | `ice_trap` | dụng cụ | 110 | 3 | Đặt bẫy ẩn (90s): Kẻ địch giẫm phải bị Đóng Băng (choáng tuyệt đối) 1.2s, sau đó mặt sàn hóa băng trơn trượt làm giảm 40% khả năng kiểm soát hướng chạy trong 3s. |
| 🩸 Dược Huyết Chiến | `blood_pot` | phù | 160 | 2 | Uống tức thì: Nhận 20% Hút Máu và +15% Công Vật Lý / Công Phép trong 8s, nhưng giảm 30% lượng Hộ Giáp hiện có của bản thân. |
| 🧪 Dầu Đạn Ăn Mòn | `corrosive_oil` | phù | 140 | 2 | Thoa lên vũ khí (hiệu lực 12s): 4 đòn đánh hoặc phát bắn kế tiếp nhận thêm 50% Xuyên Thủng Hộ Giáp (sát thương đánh thẳng vào Máu Đỏ). |
| 🪨 Phù Thạch Hóa | `petrify_talisman` | phù | 190 | 1 | Hóa đá cơ thể tại chỗ trong 2.0s: Bất động hoàn toàn, miễn nhiễm 100% mọi loại sát thương và khống chế (không bị bão bo đốt máu trong thời gian này). |
| 💨 Bom Khói Dập Lửa | `smoke_bomb` | dụng cụ | 120 | 2 | Ném xuống chân tạo màn khói dày đặc bán kính 4 đv trong 5s: Chặn đứng mọi tầm nhìn từ bên ngoài vào, dập tắt các hiệu ứng Thiêu Đốt và Vết Thương Sâu trên người đứng bên trong. |
| 🪶 Dây Móc Tiếp Tốc | `grapple_dash` | dụng cụ | 180 | 2 | Bắn móc kéo thẳng bản thân về phía mục tiêu tướng hoặc quái lớn trong 8.5 đv: Gây choáng 0.5s khi chạm mục tiêu và lập tức hồi 1 phát lướt ngắn 2.5 đv. |

## 6. Hiệu ứng trạng thái
| id | Tên | Khống chế | Khống chế cứng | Ghi chú |
|---|---|---|---|---|
| `stun` | Choáng | ✔ | ✔ |  |
| `sleep` | Ngủ | ✔ | ✔ |  |
| `knockup` | Hất tung | ✔ | ✔ | Không bị Kháng hiệu ứng rút ngắn |
| `root` | Trói chân | ✔ |  |  |
| `slow` | Làm chậm | ✔ |  |  |
| `silence` | Câm lặng | ✔ |  |  |
| `charm` | Mê hoặc | ✔ | ✔ |  |
| `blind` | Mù | ✔ |  |  |
| `nodash` | Cấm lướt | ✔ |  |  |
| `haste` | Tăng tốc |  |  |  |
| `buff` | Cường hóa |  |  |  |
| `shield` | Khiên |  |  |  |
| `invuln` | Miễn sát thương |  |  |  |
| `untarget` | Không thể bị chọn |  |  |  |
| `unstop` | Không thể cản phá |  |  |  |
| `stealth` | Tàng hình |  |  |  |
| `dot` | Sát thương theo thời gian |  |  |  |
| `wound` | Vết Thương Sâu |  |  |  |
| `mark` | Dấu |  |  |  |
| `reduce` | Giảm sát thương nhận |  |  |  |
| `regen` | Hồi máu (bình) |  |  |  |
| `mregen` | Hồi mana (bình) |  |  |  |
| `undying` | Bất tử (máu không xuống dưới 1) |  |  |  |
| `vuln` | Dễ tổn thương |  |  |  |
- Kháng hiệu ứng (tenacity) rút ngắn thời gian các hiệu ứng khống chế.

## 7. Gợi ý dựng dữ liệu trong Unity
- **HeroDefinition (ScriptableObject)**: id, tên, màu, kit (vai trò), vị trí, ranged, dmgType, resource, bán kính, đạn đánh thường (prefab + tốc độ), khối chỉ số gốc + tăng mỗi cấp (đúng các cột ở bảng "Chỉ số"), tham chiếu tới 5 SkillDefinition (S1–S4 + phụ) và 1 PassiveDefinition, cây tiến hóa 5 mốc × 3 lựa chọn.
- **SkillDefinition**: tên, mô tả, mảng hồi chiêu theo cấp, mảng mana theo cấp, castTime, castMove, charges, kiểu nhắm (unit/point/self/away), tầm, bán kính, tốc đạn; logic cụ thể đặt trong một lớp `SkillBehaviour` riêng cho từng chiêu (mỗi chiêu một class, tương ứng hàm `use` trong mã web).
- **Hook nội tại** dùng trong mã web (nên giữ cùng tên làm sự kiện C#): `init`, `update` (mỗi nhịp), `onAuto` (trước đòn đánh thường), `onDeal` (trước khi gây sát thương), `onTake` (trước khi nhận sát thương), `afterTake`, `onFatal` (sắp chết — có thể chặn), `onKill`, `onSkill` (sau khi dùng chiêu). Trang bị và nhánh cây tiến hóa đăng ký cùng các hook này.
- **Trạng thái nhân vật riêng** (Náo Nhiệt, Đức Tin, Kiếm Khí, đạn…) lưu trong một từ điển trạng thái per-unit (trong mã web là `u.ws`).
- **Tất định**: mã web dùng bộ sinh số ngẫu nhiên theo hạt giống và bước thời gian cố định. Nếu cần phát lại trận / mô phỏng nhanh, giữ nguyên nguyên tắc này (System.Random có seed, không dùng UnityEngine.Random trong logic).
- Mã nguồn tham chiếu cho từng nhân vật: `src/data/heroes/<id>.js`; AI riêng: `src/sim/ai/`; công thức chung: `src/sim/combat.js`, `src/sim/unit.js`, `src/sim/match.js`, hằng số: `src/sim/consts.js`.
