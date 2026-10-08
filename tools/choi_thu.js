'use strict';
// ===== Đóng gói BẢN CHƠI THỬ (một trang mở được ngay trên điện thoại) =====
//   node tools/choi_thu.js <thư mục ra>
// Ra: index.html (nội dung trang, không có <html>/<head>/<body> — khung trang do nơi xuất bản bọc), files.json (đường dẫn xuất bản → tệp nguồn).
// Mang theo: toàn bộ src/, CSS nhúng thẳng vào trang, hình hiệu ứng đang dùng (đổi sang tên không dấu cách), âm thanh hiệu ứng và vài bài nhạc.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.resolve(process.argv[2] || 'choi_thu');
const V = 'ct' + Date.now().toString(36);
const files = {};
const walk = (dir, pred) => { const out = []; for (const f of fs.readdirSync(path.join(ROOT, dir))) { const p = path.join(dir, f); if (fs.statSync(path.join(ROOT, p)).isDirectory()) out.push(...walk(p, pred)); else if (!pred || pred(p)) out.push(p); } return out; };
// mã nguồn
for (const f of walk('src', (p) => p.endsWith('.js'))) files[f.split(path.sep).join('/')] = path.join(ROOT, f);
// hình: đường dẫn có dấu cách → tên gọn
const IMG = fs.readFileSync(path.join(ROOT, 'src/ui/vfx.js'), 'utf8').match(/'img\/[^']*\.png'/g).map((s) => s.slice(1, -1));
const assetMap = {};
for (const src of [...new Set(IMG)]) {
  const pub = /\s/.test(src) ? 'img/fx/' + src.slice(4).replace(/[^A-Za-z0-9.]+/g, '_') : src;
  if (pub !== src) assetMap[src] = pub;
  files[pub] = path.join(ROOT, src);
}
files['img/icon.svg'] = path.join(ROOT, 'img/icon.svg');
// âm thanh
for (const d of ['sound/sfx', 'sound/ui', 'sound/voice']) for (const f of walk(d, (p) => p.endsWith('.mp3'))) files[f.split(path.sep).join('/')] = path.join(ROOT, f);
const MUSIC = ['music/menu_fantasy_quest.mp3', 'music/hub_gaming.mp3', 'music/battle_epic.mp3', 'music/battle_stereo_drum.mp3', 'music/tour_last_beacon.mp3'].filter((m) => fs.existsSync(path.join(ROOT, 'sound', m)));
for (const m of MUSIC) files['sound/' + m] = path.join(ROOT, 'sound', m);
// trang
const css = fs.readFileSync(path.join(ROOT, 'css/game.css'), 'utf8');
const page = `<title>Kẻ Đặt Cược</title>
<style>
${css}
</style>
<canvas id="cv"></canvas>
<div id="menu" class="screen"></div>
<div id="setup" class="screen hidden"></div>
<div id="run" class="screen hidden"></div>
<div id="busy" class="screen hidden"></div>
<div id="result" class="screen hidden"></div>
<div id="match" class="screen hidden"><div id="hud"></div></div>
<div id="rotate">📱🔄 Xoay ngang điện thoại để xem trận rõ hơn</div>
<script>window.G = { ASSET_MAP: ${JSON.stringify(assetMap)}, MUSIC_ONLY: ${JSON.stringify(MUSIC)}, PLAY_BUILD: '${V}' };</script>
<script src="src/manifest.js?v=${V}" data-v="${V}"></script>
`;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), page);
fs.writeFileSync(path.join(OUT, 'files.json'), JSON.stringify(files, null, 1));
let bytes = 0; for (const k in files) bytes += fs.statSync(files[k]).size;
console.log(`Đã đóng gói ${Object.keys(files).length} tệp (${(bytes / 1048576).toFixed(1)} MB) + trang ${(page.length / 1024).toFixed(0)} KB → ${OUT}`);
