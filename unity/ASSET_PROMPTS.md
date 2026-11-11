# Prompt tạo hình ảnh & âm thanh — Đấu Trường Luân Hồi

> Bản demo giao diện (`unity/ui_demo/index.html`) vẽ toàn bộ bằng code và tổng hợp âm thanh bằng Web Audio, nên không dùng file ngoài. Khi làm bản Unity thật, dùng các prompt dưới đây với công cụ tạo ảnh (Gemini / Imagen, Midjourney…) và công cụ tạo âm thanh (ElevenLabs Sound Effects, Suno, Udio…).
> Prompt viết bằng tiếng Anh vì các công cụ này hiểu tiếng Anh tốt nhất. Giữ nguyên **đoạn phong cách chung** ở đầu mỗi prompt để mọi ảnh cùng một thế giới.

## 1. Bảng màu & phong cách (dùng chung)
| Vai trò | Màu | Dùng cho |
|---|---|---|
| Nền mực | `#0a1014` | Nền, bóng tối |
| Bảng | `#121d24` / `#182730` | Khung giao diện |
| Xương ngà | `#ece4d2` | Chữ, viền sáng |
| Than hồng | `#f0a94b` | Điểm nhấn, nút chính, vàng |
| Hồn lam | `#5fd3c6` | Hồn Tinh, ma thuật |
| Máu | `#e5484d` | Máu, vùng cảnh báo của địch |
| Hộ Giáp | `#9cb9d6` | Thanh giáp phụ, Kiên Định |
| Độ hiếm | Thường `#b8c2c9` · Hiếm `#4fa3ff` · Sử thi `#b46cff` · Huyền thoại `#ffb340` | Viền thẻ |

**Đoạn phong cách chung (dán vào đầu mọi prompt ảnh):**
```
Dark fantasy top-down action roguelite, a cursed stone arena at night. Painterly but clean, readable silhouettes, strong rim light. Palette: deep ink teal-black #0a1014, bone ivory #ece4d2, ember orange #f0a94b, spirit cyan #5fd3c6, blood red #e5484d. No text, no watermark, no logo.
```

## 2. Ảnh nền & key art
**Màn hình chính (16:9):**
```
[phong cách chung] Wide key art of a ruined circular colosseum floating in darkness, a glowing ember rune circle on the sand floor, faint cyan soul wisps rising, eight silhouetted heroes at the edge of the ring, cinematic, lots of negative space on the left for a title.
```
**Sàn phòng Rừng Thông (ô lặp, 2048×2048, nhìn thẳng từ trên xuống):**
```
[phong cách chung] Seamless tileable top-down texture, mossy dark green flagstones with cracks, scattered pine needles, subtle ember rune engravings, orthographic, flat even lighting, game floor texture.
```
Đổi "mossy dark green flagstones" thành "scorched brown stone with ash" cho hang boss, "frosted blue-grey stone with snow" cho Tuyết Sơn.

## 3. Chân dung tướng (1:1, khung lục giác)
```
[phong cách chung] Bust portrait of {MÔ TẢ}, facing three-quarter, dramatic rim light in {MÀU}, dark ink background, centered, fits inside a hexagon frame.
```
| Tướng | {MÔ TẢ} | {MÀU} |
|---|---|---|
| Elara | an elven ranger woman with a longbow, green hooded cloak, calm focused eyes | green #7ad67a |
| Borg | a huge scarred pit fighter with bandaged fists, burning embers on his knuckles | orange #ff7a4a |
| Valerius | a stoic knight with sword and kite shield, blue tabard, golden trim | blue #5aa9ff |
| Ignatius | a young fire mage with a charred staff, flames in his palm | flame orange #ff7a3a |
| Death | a hooded reaper with a long scythe, pale violet soul glow | violet #8a7aa8 |
| Victoria | a military commander woman holding a war banner and a pistol, red coat | red #e04a4a |
| Alice | a stage magician girl with playing-card daggers, top hat, mischievous smile | magenta #d070ff |
| Diệp Thanh Phong | a wind sage in flowing robes holding an iron folding fan, swirling wind | jade #7ad0b0 |

## 4. Biểu tượng chiêu (1:1, 256×256)
```
[phong cách chung] Game skill icon, single bold symbol of {BIỂU TƯỢNG}, ember and ivory on a dark circular vignette, high contrast, readable at 48 pixels, flat shading, no border.
```
Ví dụ {BIỂU TƯỢNG}: Elara — "three arrows in a volley", "a fully drawn longbow", "a falling star with a backward leap", "a giant glowing arrow"; Borg — "a grabbing gauntlet", "a full-force punch shockwave", "a braced iron guard stance", "a ring of arena walls".

## 5. Khung giao diện
```
[phong cách chung] UI kit sheet: dark stone panel frames with chamfered corners, thin ember gold trim, hexagon portrait frame, horizontal health bar frame, square skill slot frames with cooldown ring, card frames in four rarity colors (grey, blue, purple, gold), isolated on flat dark background, front view, game UI asset sheet.
```
Mẹo: cắt từng phần rồi dùng **9-slice** (Sprite Editor) để khung co giãn không méo.

## 6. Kẻ địch & boss (top-down, nền trong suốt)
```
[phong cách chung] Top-down sprite of {KẺ ĐỊCH}, seen from directly above at a slight angle, isolated on transparent background, clear silhouette.
```
| Kẻ địch | {KẺ ĐỊCH} |
|---|---|
| Chó Săn Nhiễm Độc | a lean toxic hound with green glowing spots |
| Lính Xương Cầm Khiên | a skeleton soldier with a large round shield |
| Cung Thủ Xương | a skeleton archer with a bone bow |
| Đội Trưởng Hài Cốt | an armored skeleton captain with a greatshield, bigger |
| Boss Tân Thế | a colossal hexagonal stone golem with molten cracks and two glowing eyes |

## 7. Âm thanh (ElevenLabs Sound Effects hoặc tương tự)
Mỗi dòng là một prompt; thời lượng gợi ý trong ngoặc.

| Tên file | Prompt | Thời lượng |
|---|---|---|
| `sfx_bow_shot` | short crisp bow string release with arrow whoosh, fantasy game | 0.4s |
| `sfx_bow_charge` | bowstring slowly creaking under tension, rising | 1.5s |
| `sfx_hit_flesh` | quick punchy impact hit on a creature, game hit marker | 0.2s |
| `sfx_hit_crit` | heavy critical hit with metallic ring and bass thump | 0.4s |
| `sfx_punch` | heavy fist punch with whoosh and bass impact | 0.4s |
| `sfx_dash` | fast air whoosh dash, short | 0.3s |
| `sfx_shield_block` | shield block metal clang, short | 0.3s |
| `sfx_enemy_death` | skeleton collapsing into bones, short crunch | 0.6s |
| `sfx_telegraph` | ominous low warning hum rising, danger cue | 0.9s |
| `sfx_ground_slam` | massive stone ground slam with rumble and debris | 1.2s |
| `sfx_level_up` | bright magical chime ascending arpeggio, level up | 1.0s |
| `sfx_card_pick` | mystical bell shimmer, selecting a reward card | 0.8s |
| `sfx_ui_hover` | soft subtle UI tick | 0.1s |
| `sfx_ui_click` | soft wooden UI click | 0.15s |
| `sfx_door` | heavy stone door grinding open with low boom | 1.2s |
| `sfx_coin` | two small gold coins clinking | 0.3s |
| `sfx_potion` | drinking a potion, glass and magical sparkle | 0.6s |
| `sfx_boss_roar` | deep stone golem roar with rumbling echo | 2.0s |
| `sfx_player_death` | dramatic low descending tones and a soft thud, defeat | 2.0s |

## 8. Nhạc nền (Suno / Udio)
| Vòng nhạc | Prompt |
|---|---|
| Khu nhà chính | dark ambient fantasy, slow, warm low drones, soft plucked harp in A minor, distant choir, calm and mysterious, loopable, instrumental, 70 bpm |
| Phòng chiến đấu | dark fantasy action, driving taiko drums and low strings, plucked arpeggios in A minor, tense but not overwhelming, loopable, instrumental, 120 bpm |
| Boss | epic dark fantasy boss battle, heavy percussion, brass stabs, choir, A minor, aggressive, loopable, instrumental, 130 bpm |
| Chọn Thiên Phú / cửa hàng | quiet mystical interlude, music box and soft pads, A minor, short loop, instrumental |

Bản demo dùng vòng hợp âm **La thứ → Fa → Son → Mi** cho mọi nhạc nền; giữ cùng giọng La thứ ở các bản nhạc thật để chuyển cảnh không bị lệch.

## 9. Gợi ý nhập vào Unity
- Ảnh UI: Texture Type = Sprite (2D and UI), bật 9-slice cho khung; gom vào Sprite Atlas.
- Âm thanh ngắn: Load Type = Decompress On Load; nhạc: Streaming. Định tuyến qua Audio Mixer có 3 nhóm **Nhạc / Hiệu ứng / Giao diện** để khớp thanh âm lượng trong bảng tạm dừng.
