#!/usr/bin/env node
'use strict';
// ===== Sinh NHAN_VAT.md — hồ sơ toàn bộ nhân vật (để chuyển sang engine khác, ví dụ Unity) =====
// Mọi con số đọc thẳng từ dữ liệu trong mã, nên tài liệu luôn khớp với bản đang chạy.
//   node tools/nhanvat.js            → ghi lại NHAN_VAT.md
//   node tools/nhanvat.js --kiemtra  → báo lỗi nếu NHAN_VAT.md đang lệch so với mã
const fs = require('fs');
const path = require('path');
const G = require('./nap.js');
const C = G.C;
const OUT = path.join(__dirname, '..', 'NHAN_VAT.md');

const L = [];
const p = (...a) => L.push(a.join(''));
const r2 = (x) => (Math.round(x * 100) / 100).toString();
const r1 = (x) => (Math.round(x * 10) / 10).toString();
const arr = (a) => (Array.isArray(a) ? a.map((x) => r2(x)).join(' / ') : a == null ? '—' : String(a));
const pct = (x) => r1(x * 100) + '%';
const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '/').replace(/\n/g, ' ');
const anchor = (h) => h.id;

const HEROES = Object.values(G.HEROES).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
const ROLE = { tank: 'Đỡ đòn (Tank)', fighter: 'Đấu sĩ (Fighter)', mage: 'Pháp sư (Mage)', marksman: 'Xạ thủ (Marksman)', support: 'Hỗ trợ (Support)' };
const POS = { top: 'Đường trên', mid: 'Đường giữa', bot: 'Đường dưới', adc: 'Xạ thủ (đường dưới)', sup: 'Hỗ trợ', jungle: 'Đi rừng', support: 'Hỗ trợ', roam: 'Đi đường tự do' };
const AIM = {
  unit: 'Chỉ định mục tiêu (unit)', point: 'Chọn điểm / hướng (point)', self: 'Tự thân / quanh mình (self)', away: 'Hướng ra xa địch (thoát thân)',
};
const USE = {
  poke: 'cấu rỉa', engage: 'mở giao tranh', escape: 'thoát thân', burst: 'dồn sát thương', cc: 'khống chế', buff: 'tăng sức mạnh', heal: 'hồi máu',
  shield: 'lá chắn', finisher: 'kết liễu', zone: 'khóa vùng', farm: 'farm', summon: 'triệu hồi', mobility: 'di chuyển', utility: 'tiện ích', sustain: 'hồi phục', defend: 'phòng thủ', custom: 'logic riêng của tướng', ult: 'chiêu cuối', kill: 'kết liễu', save: 'cứu đồng minh', stealth: 'tàng hình', trap: 'đặt bẫy',
};
const STATN = Object.assign({}, G.ITEM_STAT_NAME, {
  gaMax: 'Hộ Giáp tối đa', range: 'Tầm đánh', ms: 'Tốc chạy', dmgAmp: 'Sát thương', physAmp: 'Công Vật Lý %', magicAmp: 'Công Phép %',
  hpPct: 'Máu %', adPct: 'SMVL %', apPct: 'SMPT %', reloadPct: 'Tốc nạp đạn', goldPct: 'Vàng', loot: 'Nhặt đồ', vision: 'Tầm nhìn',
});
const PCT = new Set(['asPct', 'crit', 'cdr', 'msPct', 'lifesteal', 'tenacity', 'armorPen', 'magicPen', 'dmgAmp', 'physAmp', 'magicAmp', 'hpPct', 'adPct', 'apPct', 'reloadPct', 'goldPct', 'loot']);
const statTxt = (o) => Object.entries(o || {}).map(([k, v]) => `${v >= 0 ? '+' : ''}${PCT.has(k) ? pct(v) : r2(v)} ${STATN[k] || k}`).join(', ');
const shardName = (id) => { const s = (G.SHARD_LIST || []).find((x) => x && x.id === id) || (G.SHARDS || {})[id]; return s ? (s.n || s.name || id) : id; };
const itemName = (id) => (G.ITEMS[id] ? G.ITEMS[id].name : id);

// ---- trích công thức số từ mã chiêu (H.amt(u, gốc, hệ số SMVL, hệ số SMPT)) ----
function balanced(src, i) { let d = 0; for (let j = i; j < src.length; j++) { const c = src[j]; if (c === '(' || c === '[' || c === '{') d++; else if (c === ')' || c === ']' || c === '}') { d--; if (d === 0) return j; } } return -1; }
function splitArgs(s) { const out = []; let d = 0, cur = ''; for (const c of s) { if ('([{'.includes(c)) d++; if (')]}'.includes(c)) d--; if (c === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += c; } if (cur.trim()) out.push(cur.trim()); return out; }
function pretty(e) {
  return e
    .replace(/ctx\.v\(\[([^\]]*)\]\)/g, (_, a) => '[' + a.split(',').map((x) => x.trim()).join('/') + ' theo cấp chiêu]')
    .replace(/H\.T\(u,\s*'(\w+)'\)\s*\?\s*([^:]+?)\s*:\s*([^,)]+)/g, '(nhánh $1: $2, không: $3)')
    .replace(/H\.T\(u,\s*'(\w+)'\)/g, 'có nhánh $1')
    .replace(/u\.st\.maxHp/g, 'Máu tối đa').replace(/u\.st\.ad\b/g, 'SMVL').replace(/u\.st\.ap\b/g, 'SMPT').replace(/u\.st\.armor\b/g, 'Giáp').replace(/u\.st\.mr\b/g, 'KP')
    .replace(/u\.level/g, 'cấp').replace(/\s*\*\s*/g, '×').replace(/\s+/g, ' ').trim();
}
function amtTerms(base, ad, ap) {
  const t = [pretty(base)];
  if (ad && ad !== '0') t.push(pretty(ad) + '×SMVL');
  if (ap && ap !== '0') t.push(pretty(ap) + '×SMPT');
  return t.join(' + ');
}
// thân các hàm phụ khai báo trong tệp tướng (function tên(...) {...}) mà chiêu gọi tới
function helperSrcs(id, src, seen) {
  const file = (SRC[id] || (lineOf(id, '\u0000'), SRC[id])).join('\n');
  const out = [];
  const re = /\b([A-Za-z_$][\w$]*)\s*\(/g; let mt;
  while ((mt = re.exec(src))) {
    const nm = mt[1]; if (seen.has(nm)) continue; seen.add(nm);
    const k = file.search(new RegExp('function\\s+' + nm.replace(/\$/g, '\\$') + '\\s*\\('));
    if (k < 0) continue;
    const b = file.indexOf('{', file.indexOf(')', k)); const e = balanced(file, b); if (e < 0) continue;
    const body = file.slice(k, e + 1); out.push(body); out.push(...helperSrcs(id, body, seen));
  }
  return out;
}
function formulas(fnList, id) {
  const out = [];
  const srcs = [];
  for (const fn of fnList) if (typeof fn === 'function') srcs.push(fn.toString());
  if (id) { const seen = new Set(); for (const x of srcs.slice()) srcs.push(...helperSrcs(id, x, seen)); }
  for (const src of srcs) {
    let i = 0;
    while ((i = src.indexOf('H.amt(', i)) >= 0) {
      const o = i + 5, c = balanced(src, o); if (c < 0) break;
      const a = splitArgs(src.slice(o + 1, c));
      if (a.length >= 2) { const f = amtTerms(a[1], a[2], a[3]); if (!out.includes(f)) out.push(f); }
      i = c;
    }
  }
  return out;
}
const fnsOf = (o) => (o ? Object.values(o).filter((v) => typeof v === 'function').concat(o.ai ? Object.values(o.ai).filter((v) => typeof v === 'function') : []) : []);
const SRC = {};
function lineOf(id, needle) {
  if (!SRC[id]) { try { SRC[id] = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'heroes', id + '.js'), 'utf8').split('\n'); } catch (e) { SRC[id] = []; } }
  const k = SRC[id].findIndex((l) => l.includes(needle)); return k >= 0 ? k + 1 : null;
}
const lvStat = (b, k, Lv) => (b[k] || 0) + (b[k + 'G'] || 0) * (Lv - 1);

// ---------------------------------------------------------------------------
p('# HỒ SƠ NHÂN VẬT — KẺ ĐẶT CƯỢC');
p('');
p('> Tệp này được **sinh tự động** từ mã bằng `node tools/nhanvat.js` (kiểm tra lệch: `--kiemtra`). Đừng sửa tay.');
p('> Mục đích: tài liệu đặc tả đầy đủ để dựng lại toàn bộ nhân vật trên engine khác (Unity). Mọi con số là con số thật đang chạy trong bản web.');
p('> Mô tả chi tiết hơn về các hệ thống chung (bản đồ, quái, boss, bo, Ý Niệm, mảnh hồn, nhà cái…) nằm ở `THIET_KE.md`.');
p('');
p(`Tổng số nhân vật: **${HEROES.length}**${HEROES.some((h) => h.unreleased) ? ` (trong đó ${HEROES.filter((h) => h.unreleased).length} chưa phát hành: ${HEROES.filter((h) => h.unreleased).map((h) => h.name).join(', ')})` : ''}.`);
p('');

// ---------------------------------------------------------------------------
p('## Mục lục');
p('1. [Quy ước chung & công thức](#1-quy-ước-chung--công-thức)');
p('2. [Bảng tổng hợp nhân vật](#2-bảng-tổng-hợp-nhân-vật)');
p('3. [Hồ sơ từng nhân vật](#3-hồ-sơ-từng-nhân-vật)');
p('4. [Trang bị](#4-trang-bị)');
p('5. [Vật phẩm dùng 1 lần, bình & phép bổ trợ](#5-vật-phẩm-dùng-1-lần-bình--phép-bổ-trợ)');
p('6. [Hiệu ứng trạng thái](#6-hiệu-ứng-trạng-thái)');
p('7. [Gợi ý dựng dữ liệu trong Unity](#7-gợi-ý-dựng-dữ-liệu-trong-unity)');
p('');

// ---------------------------------------------------------------------------
p('## 1. Quy ước chung & công thức');
p('');
p('### 1.1. Đơn vị');
p(`- Khoảng cách: **đv** (đơn vị) ≈ 1 mét → nên map 1 đv = 1 Unity unit. Bản đồ ${C.MAP}×${C.MAP} đv.`);
p(`- Thời gian: giây. Mô phỏng chạy nhịp cố định ${C.TICK ? r2(C.TICK) + 's' : '—'}/bước (tất định theo hạt giống) — trong Unity nên đặt logic vào FixedUpdate với cùng bước.`);
p('- Tốc chạy: đv/giây. Tốc đánh: số đòn/giây. Tốc đạn: đv/giây.');
p('- **SMVL** = Sức Mạnh Vật Lý (AD) = SMVL gốc theo cấp tướng + SMVL cộng thêm (trang bị, nhánh, mảnh hồn, hiệu ứng).');
p('- **SMPT** = Sức Mạnh Phép Thuật (AP). SMPT gốc của mọi tướng = 0, toàn bộ đến từ trang bị / nhánh / mảnh hồn / hiệu ứng.');
p('- **KP** = Kháng Phép (MR). **Hộ Giáp** = thanh giáp phụ gánh sát thương trước máu.');
p('- Trong mọi công thức của tài liệu này, **"SMVL" là SMVL tổng** (bản web không tách gốc / cộng thêm). Bản Unity tách hai loại và dùng hệ số đa dạng hơn — xem `GDD.md` mục 6.5–6.7.');
p('');
p('### 1.2. Cấp & điểm chiêu');
p(`- Cấp tối đa **${C.MAX_LVL}**. Kinh nghiệm cần để từ cấp L lên L+1: \`${C.xpNeed.toString().replace(/^\(L\) => /, '')}\` (cấp 1→2: ${C.xpNeed(1)}, cấp 17→18: ${C.xpNeed(17)}).`);
p('- Mỗi lần lên cấp: +1 điểm chiêu.');
p('- S1/S2/S3: tối đa cấp 5; cấp chiêu không vượt quá ⌈cấp tướng / 2⌉.');
p('- S4 (chiêu cuối): tối đa cấp 3; mở được khi cấp tướng ≥ 4 / 8 / 12 (cấp chiêu 1 / 2 / 3).');
p('- Skill phụ (sub): không cần điểm, cấp = clamp(⌈cấp tướng / 4⌉, 1, 5).');
p(`- Cây tiến hóa: mở mốc ở cấp ${G.TREE_TIERS.join(' / ')}, mỗi mốc chọn 1 trong 3 (a/b/c).${G.TREE_EXTRA ? ` Ý Niệm Rực Rỡ: cấp ${G.TREE_EXTRA[0]} lấy thêm 1 lựa chọn chưa chọn ở mốc 3/6/9; cấp ${G.TREE_EXTRA[1]} lấy thêm 1 lựa chọn mốc 12 hoặc ${Object.values(G.TREE_GEN).map((g) => `${g.name} (${g.desc})`).join(' / ')}.` : ''}`);
p('');
p('### 1.3. Chỉ số theo cấp');
p('- Chỉ số tại cấp L = `gốc + tăng_mỗi_cấp × (L − 1)` (áp cho Máu, Mana, Hồi mana, SMVL, Giáp, KP).');
p(`- **Máu thực tế** của tướng = Máu theo công thức trên × **${C.HERO_HP_MULT}** (hệ số đánh đơn)${C.ALLIN_HP ? `; tướng phong cách "Lì đòn" thêm ×${C.ALLIN_HP}` : ''}. Máu phẳng từ mảnh hồn cộng sau hệ số.`);
p('- Máu không tự hồi (hồi máu gốc = 0); hồi qua bình, trang bị, chiêu, nghỉ ngoài giao tranh.');
p(`- Hồi mana thực tế = (gốc + tăng × (L−1)) × ${C.MANA_REGEN}. Chi phí mana thực tế = chi phí ghi trên chiêu × **${C.MANA_COST}**.`);
p(`- Tốc đánh = tốc đánh gốc × (1 + tăng_mỗi_cấp × (L−1) + % tốc đánh cộng thêm), kẹp trong [${C.MIN_AS}, ${C.MAX_AS}]. Thời gian vung tay = ${pct(C.WINDUP)} chu kỳ đánh.`);
p(`- Hộ Giáp (thanh giáp phụ, gánh sát thương trước máu, không tự hồi): ${C.GA.base} + ${C.GA.perLvl} × (L−1) (+ mảnh hồn).`);
p(`- Giảm hồi chiêu (cdr) tối đa 40%. Hồi chiêu thực tế = hồi chiêu theo cấp chiêu × (1 − cdr).`);
p('');
p('### 1.4. Khung chỉ số theo vai trò (giá trị mặc định khi tướng không ghi đè)');
p('| Khung | Máu | Hồi mana | Mana | SMVL | Giáp | KP | Tốc đánh | Tốc chạy | Tầm |');
p('|---|---|---|---|---|---|---|---|---|---|');
for (const [k, b] of Object.entries(G.H.BASE)) p(`| ${ROLE[k] || k} | ${b.hp} (+${b.hpG}) | ${b.mpr} (+${b.mprG}) | ${b.mp} (+${b.mpG}) | ${b.ad} (+${b.adG}) | ${b.armor} (+${b.armorG}) | ${b.mr} (+${b.mrG}) | ${b.as} (+${pct(b.asG)}/cấp) | ${b.ms} | ${b.range} |`);
p('');
p('### 1.5. Công thức sát thương');
p('- Loại sát thương: **vật lý** (giảm bởi Giáp), **phép** (giảm bởi KP), **chuẩn** (không giảm).');
p('- Kháng sau xuyên: `R = kháng × (1 − min(0.9, %xuyên)) − xuyên_phẳng` (không âm).');
p('- Hệ số nhận: R ≥ 0 → `100 / (100 + R)`; R < 0 → `2 − 100 / (100 − R)`.');
p(`- Chí mạng: ×${C.CRIT_MULT} (một số trang bị đổi hệ số).`);
p(`- Chiêu cuối: mọi sát thương gắn nhãn S4 ×${C.ULT_AMP}.`);
p('- Tướng đánh tướng (PvP) nhân thêm: `0.95 × ' + C.PVP_DMG + ' × pvpPow`, với');
p(`  - \`pvpPow = ${C.PVP_POW.k0} × ${C.PVP_POW.base}^p\`, \`p = 0.45·min(1,(cấp−1)/17) + 0.45·min(1, số_món_hoàn_chỉnh/6) + 0.1·min(1, Ý_Niệm/5)\`.`);
p(`  - Kết quả: đầu trận ×${r2(0.95 * C.PVP_DMG * C.PVP_POW.k0)}, cuối trận đủ đồ ×${r2(0.95 * C.PVP_DMG * C.PVP_POW.k0 * C.PVP_POW.base)} → đầu trận đánh lâu, cuối trận chết nhanh.`);
p('- Giai đoạn mạnh của tướng: sát thương ×(1 + hệ số), hệ số nội suy theo cấp 3 → 9 → 15 cộng phần theo vàng trang bị (xem từng tướng).');
p(`  - Mạnh đầu trận: ${G.CURVE_LV.early.map((x) => pct(x)).join(' → ')} • giữa trận: ${G.CURVE_LV.mid.map((x) => pct(x)).join(' → ')} • cuối trận: ${G.CURVE_LV.late.map((x) => pct(x)).join(' → ')}.`);
p('  - Phụ thuộc đồ: "Cần đồ" thêm (k − 0.4) × 10%, "Ít cần đồ" thêm (0.4 − k) × 6%, với k = min(1, vàng_trang_bị / 12000).');
p('- Thứ tự áp: hook nội tại/trang bị (onDeal, onTake) → hệ số chiêu cuối → khuếch đại của người đánh → PvP → giai đoạn mạnh → giảm sát thương / dễ tổn thương của mục tiêu → giảm trừ Giáp/KP → Hộ Giáp → lá chắn → máu.');
p('');
p('### 1.6. Cách đọc hồ sơ chiêu');
p('- **Hồi chiêu / Mana**: liệt kê theo cấp chiêu 1 → 5 (S4: 1 → 3). Mana ghi theo số gốc; nhân ' + C.MANA_COST + ' khi dùng thật.');
p('- **Thi triển**: thời gian vận chiêu (đứng yên) trước khi chiêu có hiệu lực. "Vừa đi vừa thi triển" = không bị khóa chân.');
p('- **Nhắm**: kiểu chọn mục tiêu dùng cho cả người chơi và AI (unit / point / self / away), **Tầm AI** là tầm AI dùng để quyết định tung chiêu (gần đúng tầm chiêu thật).');
p('- **Tích lũy**: chiêu có nhiều lượt dùng, mỗi lượt hồi riêng.');
p('- Các con số "x/y/z" trong mô tả là theo cấp chiêu.');
p('- **Công thức trong mã**: lượng sát thương / hồi máu / lá chắn gốc trích thẳng từ mã chiêu (và các hàm phụ chiêu gọi tới), dạng `gốc + hệ số × SMVL + hệ số × SMPT`. "cấp" = cấp tướng; "[a/b/c theo cấp chiêu]" = giá trị theo cấp chiêu; "nhánh 3b" = khi đã chọn nhánh 3b của cây tiến hóa. Đây là số **trước** các hệ số chung ở mục 1.5 (PvP, chiêu cuối ×' + C.ULT_AMP + ', Giáp/KP…); mô tả chiêu nói rõ phần trăm áp lên số này (ví dụ "50% sát thương").');
p('- **Mã nguồn**: tệp và dòng chứa định nghĩa trong bản web — mở ra khi cần chi tiết hơn tài liệu (thứ tự hiệu ứng, điều kiện phụ).');
p('');

// ---------------------------------------------------------------------------
p('## 2. Bảng tổng hợp nhân vật');
p('| Nhân vật | id | Vai trò | Vị trí | Đánh | Sát thương | Tài nguyên | Máu cấp 1 (thực) | Tầm | Tốc chạy | Giai đoạn mạnh |');
p('|---|---|---|---|---|---|---|---|---|---|---|');
for (const h of HEROES) {
  const b = h.base, cv = G.curveOf(h.id);
  p(`| [${h.name}](#${anchor(h)}) | \`${h.id}\` | ${ROLE[h.kit] || h.kit} | ${(h.pos || []).map((x) => POS[x] || x).join(', ')} | ${h.ranged ? 'Tầm xa' : 'Cận chiến'} | ${h.dmgType === 'magic' ? 'Phép' : 'Vật lý'} | ${h.resource === 'mana' ? 'Mana' : h.manaLabel || 'Không mana'} | ${Math.round(b.hp * C.HERO_HP_MULT)} | ${b.range} | ${b.ms} | ${G.CURVE_NAME[cv[0]]} · ${G.CURVE_DEP[cv[1]]} |`);
}
p('');

// ---------------------------------------------------------------------------
p('## 3. Hồ sơ từng nhân vật');
for (const h of HEROES) {
  const b = h.base, P = G.personalityOf(h.id), FS = G.FIGHT_STYLE[G.fightStyleOf(h.id)], cv = G.curveOf(h.id);
  p('');
  p(`<a id="${anchor(h)}"></a>`);
  p(`### ${h.name}`);
  if (h.tagline) p(`> ${h.tagline}`);
  if (h.unreleased) p('> ⚠ Chưa phát hành (không xuất hiện ngẫu nhiên trong trận).');
  p('');
  p('**Định danh**');
  p(`- id: \`${h.id}\` • màu chủ đạo: \`${h.color}\` • vũ khí/hình ảnh: \`${h.gfx}\` • bán kính va chạm: ${h.r} đv`);
  p(`- Vai trò: ${ROLE[h.kit] || h.kit} • vị trí: ${(h.pos || []).map((x) => POS[x] || x).join(', ')} • nhãn: ${(h.tags || []).join(', ') || '—'}`);
  p(`- ${h.ranged ? 'Tầm xa' : 'Cận chiến'} • sát thương chính: ${h.dmgType === 'magic' ? 'phép' : 'vật lý'} • tài nguyên: ${h.resource === 'mana' ? 'mana' : (h.manaLabel || 'không dùng mana')}`);
  if (h.ranged) p(`- Đạn đánh thường: kiểu \`${h.projKind || 'mặc định'}\`, tốc độ ${h.projSpeed || C.HERO_PROJ} đv/s`);
  if (h.fixedAs) p('- Tốc đánh cố định: % tốc đánh cộng thêm được quy đổi thành % sát thương đòn đánh.');
  if (h.knockRes) p(`- Kháng đẩy lùi: ${typeof h.knockRes === 'number' ? pct(h.knockRes) : 'có'}.`);
  if (h.gun) p('- Dùng **súng & băng đạn**: đánh thường tốn đạn, hết đạn phải nạp (xem nội tại).');
  try {
    const g = h.gauge && h.gauge({ ws: {}, st: {}, level: 1, cd: {}, ranks: {} });
    if (g) p(`- Thanh tài nguyên riêng: **${g.label}** (0–${g.max}${g.pips ? ', dạng điểm' : ''}, màu \`${g.color}\`).`);
  } catch (e) { /* bỏ qua */ }
  p(`- Tính cách AI: ${P.icon} ${P.name} — ${P.desc} • Phong cách đánh: ${FS ? `${FS.icon} ${FS.name} — ${FS.desc}` : '—'}`);
  p(`- Giai đoạn mạnh: ${G.CURVE_NAME[cv[0]]} · ${G.CURVE_DEP[cv[1]]}`);
  const rel = G.RELATIONS && G.RELATIONS[h.id];
  if (rel) {
    const nm = (id) => (G.HEROES[id] ? G.HEROES[id].name : id);
    const parts = [];
    if (rel.friend) parts.push('bạn: ' + rel.friend.map(nm).join(', '));
    if (rel.protect) parts.push('bảo vệ: ' + rel.protect.map(nm).join(', '));
    if (rel.eternal) parts.push('liên minh vĩnh cửu: ' + rel.eternal.map(nm).join(', '));
    if (rel.hate) parts.push('thù: ' + Object.keys(rel.hate).map(nm).join(', '));
    if (parts.length) p(`- Quan hệ cốt truyện: ${parts.join(' • ')}`);
  }
  p('');
  p('**Chỉ số**');
  p('| Chỉ số | Cấp 1 | Tăng/cấp | Cấp 9 | Cấp 18 |');
  p('|---|---|---|---|---|');
  const row = (n, k, mul) => p(`| ${n} | ${r2(lvStat(b, k, 1) * (mul || 1))} | ${r2((b[k + 'G'] || 0) * (mul || 1))} | ${r2(lvStat(b, k, 9) * (mul || 1))} | ${r2(lvStat(b, k, 18) * (mul || 1))} |`);
  row('Máu (thực tế, đã ×' + C.HERO_HP_MULT + ')', 'hp', C.HERO_HP_MULT);
  p(`| Máu (gốc trong dữ liệu) | ${b.hp} | ${b.hpG} | ${r2(lvStat(b, 'hp', 9))} | ${r2(lvStat(b, 'hp', 18))} |`);
  if (b.mp) { row('Mana', 'mp'); row('Hồi mana/s (thực tế, ×' + C.MANA_REGEN + ')', 'mpr', C.MANA_REGEN); }
  row('SMVL', 'ad'); row('Giáp', 'armor'); row('Kháng phép', 'mr');
  p(`| Tốc đánh | ${b.as} | +${pct(b.asG || 0)} | ${r2(b.as * (1 + (b.asG || 0) * 8))} | ${r2(b.as * (1 + (b.asG || 0) * 17))} |`);
  p(`| Tốc chạy | ${b.ms} | — | ${b.ms} | ${b.ms} |`);
  p(`| Tầm đánh | ${b.range} | — | ${b.range} | ${b.range} |`);
  p(`| Hộ Giáp | ${C.GA.base} | ${C.GA.perLvl} | ${C.GA.base + C.GA.perLvl * 8} | ${C.GA.base + C.GA.perLvl * 17} |`);
  p('');
  p(`**Nội tại — ${h.passive.name}**`);
  p('');
  p(h.passive.desc);
  { const F = formulas(fnsOf(h.passive), h.id); if (F.length) { p(''); p('- Công thức trong mã: ' + F.map((x) => '`' + x + '`').join(' • ')); } }
  { const ln = lineOf(h.id, 'passive:'); p(`- Mã nguồn: \`src/data/heroes/${h.id}.js${ln ? ':' + ln : ''}\``); }
  for (const k of ['s1', 's2', 's3', 's4', 'sub']) {
    const s = h.skills[k]; if (!s) continue;
    const lab = k === 'sub' ? 'Skill phụ' : k.toUpperCase();
    p('');
    p(`**${lab} — ${s.name}**`);
    p('');
    const meta = [];
    meta.push(`Hồi chiêu: ${typeof s.cd === 'function' ? (s.cdText ? arr(s.cdText) : 'động (xem mô tả)') : arr(s.cd)}s`);
    if (s.cost) meta.push(`Mana: ${arr(s.cost)}`);
    if (s.castTime) meta.push(`Thi triển: ${typeof s.castTime === 'function' ? 'động (theo trạng thái)' : r2(s.castTime) + 's'}${s.castMove ? ' (vừa đi vừa thi triển)' : ''}${s.castUnstop ? ' (không thể bị ngắt)' : ''}`);
    else if (s.castMove) meta.push('Vừa đi vừa thi triển');
    if (s.charges) meta.push(`Tích lũy: ${typeof s.charges === 'function' ? 'động' : s.charges} lượt`);
    if (s.whileDisabled) meta.push('Dùng được khi đang bị khống chế');
    if (s.manualCd) meta.push('Hồi chiêu bắt đầu do chiêu tự tính (ví dụ sau khi kết thúc trạng thái)');
    if (s.variant) meta.push('Có nhiều biến thể (chọn theo tình huống hoặc người chơi chọn trước)');
    if (s.can) meta.push('Có điều kiện dùng riêng (xem mô tả)');
    const A = s.ai || {};
    const tg = [];
    if (A.aim) tg.push(`Nhắm: ${AIM[A.aim] || A.aim}`);
    if (A.range != null) tg.push(`Tầm AI: ${r2(A.range)} đv`);
    if (A.aoe) tg.push(`Bán kính vùng: ${typeof A.aoe === 'number' ? r2(A.aoe) + ' đv' : 'có'}`);
    if (A.speed) tg.push(`Tốc đạn/lướt: ${A.speed} đv/s`);
    if (A.delay) tg.push(`Trễ nổ: ${r2(A.delay)}s`);
    if (A.skillshot) tg.push('Đạn định hướng (né được)');
    if (A.line) tg.push('Đường thẳng');
    if (A.heroOnly) tg.push('Chỉ nhắm tướng');
    if (A.use) tg.push(`Mục đích AI: ${USE[A.use] || A.use}`);
    p('- ' + meta.join(' • '));
    if (tg.length) p('- ' + tg.join(' • '));
    p(`- ${s.desc}`);
    const F = formulas(fnsOf(s), h.id);
    if (F.length) p('- Công thức trong mã: ' + F.map((x) => '`' + x + '`').join(' • '));
    const ln = lineOf(h.id, `name: '${s.name.replace(/'/g, "\\'")}'`) || lineOf(h.id, s.name);
    p(`- Mã nguồn: \`src/data/heroes/${h.id}.js${ln ? ':' + ln : ''}\``);
  }
  // cây tiến hóa
  if (h.tree) {
    p('');
    p('**Cây tiến hóa**');
    p('');
    p('| Cấp | Nhánh | Tên | Hiệu ứng |');
    p('|---|---|---|---|');
    h.tree.forEach((rowT, i) => rowT.forEach((x, j) => p(`| ${G.TREE_TIERS[i]} | ${'abc'[j]} | ${esc(x.name)} | ${esc(x.desc)}${x.stats ? ` (${statTxt(x.stats)})` : ''} |`)));
  }
  // lối build
  const B = G.buildsOf ? G.buildsOf(h.id) : null;
  if (B && B.length) {
    p('');
    p('**Lối build gợi ý (AI dùng)**');
    for (const bd of B) p(`- ${bd.name}: giày ${itemName(bd.boots)} → ${bd.core.map(itemName).join(' → ')}`);
    const fav = G.HERO_BUILDS && G.HERO_BUILDS[h.id] && G.HERO_BUILDS[h.id].fav;
    if (fav && fav.length) p(`- Mảnh hồn yêu thích: ${fav.map(shardName).join(', ')}`);
  }
}
p('');

// ---------------------------------------------------------------------------
p('## 4. Trang bị');
p(`- ${G.ITEM_LIST.length} món hoàn chỉnh, tối đa 6 ô. Mỗi món có phôi (40% giá, 40% chỉ số). Bán lại 50%.`);
p('| Món | id | Loại | Giá | Chỉ số | Hiệu ứng riêng |');
p('|---|---|---|---|---|---|');
for (const it of G.ITEM_LIST) p(`| ${esc(it.name)} | \`${it.id}\` | ${it.cat} | ${it.cost} | ${esc(it.statText || '')} | ${esc(it.desc || '—')} |`);
p('');

// ---------------------------------------------------------------------------
p('## 5. Vật phẩm dùng 1 lần, bình & phép bổ trợ');
p('| Vật phẩm | id | Nhóm | Giá | Chồng tối đa | Mô tả |');
p('|---|---|---|---|---|---|');
for (const [k, I] of Object.entries(G.CONSUMABLES)) p(`| ${I.icon} ${esc(I.name)} | \`${k}\` | ${{ potion: 'bình', spell: 'phép bổ trợ', tool: 'dụng cụ', charm: 'phù' }[I.group] || 'đặc biệt'} | ${I.cost} | ${I.stack} | ${esc(I.desc)} |`);
p('');

// ---------------------------------------------------------------------------
p('## 6. Hiệu ứng trạng thái');
p('| id | Tên | Khống chế | Khống chế cứng | Ghi chú |');
p('|---|---|---|---|---|');
for (const [k, S] of Object.entries(G.STATUS)) p(`| \`${k}\` | ${S.name || k} | ${S.cc ? '✔' : ''} | ${S.hard ? '✔' : ''} | ${S.noTenacity ? 'Không bị Kháng hiệu ứng rút ngắn' : ''} |`);
p('- Kháng hiệu ứng (tenacity) rút ngắn thời gian các hiệu ứng khống chế.');
p('');

// ---------------------------------------------------------------------------
p('## 7. Gợi ý dựng dữ liệu trong Unity');
p('- **HeroDefinition (ScriptableObject)**: id, tên, màu, kit (vai trò), vị trí, ranged, dmgType, resource, bán kính, đạn đánh thường (prefab + tốc độ), khối chỉ số gốc + tăng mỗi cấp (đúng các cột ở bảng "Chỉ số"), tham chiếu tới 5 SkillDefinition (S1–S4 + phụ) và 1 PassiveDefinition, cây tiến hóa 5 mốc × 3 lựa chọn.');
p('- **SkillDefinition**: tên, mô tả, mảng hồi chiêu theo cấp, mảng mana theo cấp, castTime, castMove, charges, kiểu nhắm (unit/point/self/away), tầm, bán kính, tốc đạn; logic cụ thể đặt trong một lớp `SkillBehaviour` riêng cho từng chiêu (mỗi chiêu một class, tương ứng hàm `use` trong mã web).');
p('- **Hook nội tại** dùng trong mã web (nên giữ cùng tên làm sự kiện C#): `init`, `update` (mỗi nhịp), `onAuto` (trước đòn đánh thường), `onDeal` (trước khi gây sát thương), `onTake` (trước khi nhận sát thương), `afterTake`, `onFatal` (sắp chết — có thể chặn), `onKill`, `onSkill` (sau khi dùng chiêu). Trang bị và nhánh cây tiến hóa đăng ký cùng các hook này.');
p('- **Trạng thái nhân vật riêng** (Náo Nhiệt, Đức Tin, Kiếm Khí, đạn…) lưu trong một từ điển trạng thái per-unit (trong mã web là `u.ws`).');
p('- **Tất định**: mã web dùng bộ sinh số ngẫu nhiên theo hạt giống và bước thời gian cố định. Nếu cần phát lại trận / mô phỏng nhanh, giữ nguyên nguyên tắc này (System.Random có seed, không dùng UnityEngine.Random trong logic).');
p('- Mã nguồn tham chiếu cho từng nhân vật: `src/data/heroes/<id>.js`; AI riêng: `src/sim/ai/`; công thức chung: `src/sim/combat.js`, `src/sim/unit.js`, `src/sim/match.js`, hằng số: `src/sim/consts.js`.');
p('');

const text = L.join('\n');
if (process.argv.includes('--kiemtra')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== text) { console.error('NHAN_VAT.md lệch so với mã — chạy: node tools/nhanvat.js'); process.exit(1); }
  console.log('NHAN_VAT.md khớp với mã.');
} else {
  fs.writeFileSync(OUT, text);
  console.log(`Đã ghi ${OUT} (${L.length} dòng, ${HEROES.length} nhân vật).`);
}
