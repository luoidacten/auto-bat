const VFX_DEF = {
  ring:     { src: '../img/Free/Part 1/03.png', n: 13 },   // vòng xoáy năng lượng (sóng xung kích)
  rune:     { src: '../img/Free/Part 1/26.png', n: 14 },   // vòng phù văn (tung Nộ, Thấu Thị)
  swirl:    { src: '../img/Free/Part 6/296.png', n: 9 },   // xoáy (dịch chuyển, tốc biến)
  burst:    { src: '../img/Free/Part 6/293.png', n: 9 },   // tia nổ (đòn nặng)
  spark:    { src: '../img/Free/Part 7/315.png', n: 7 },   // tia lửa trúng đòn
  sun:      { src: '../img/Free/Part 12/586.png', n: 14 }, // vầng chấn động (đòn văng cực mạnh)
  skull:    { src: '../img/Free/Part 13/633.png', n: 15 }, // đầu lâu (rơi đài)
  halo:     { src: '../img/Free/Part 9/439.png', n: 10 },  // vầng hào quang (hồi sinh, thanh tẩy)
  bolt:     { src: '../img/Free/Part 9/448.png', n: 10 },  // tia điện (tê liệt, quá tải)
  flower:   { src: '../img/Free/Part 7/335.png', n: 9 },   // hoa (hồi phục)
  cloud:    { src: '../img/Free/Part 10/476.png', n: 12 }, // mây khí (độc, khói)
  smoke:    { src: '../img/Free Smoke Fx  Pixel 05.png', n: 10, row: 0, white: true },  // khói bung
  puff:     { src: '../img/Free Smoke Fx  Pixel 05.png', n: 10, row: 8, white: true },  // bụi chân
  dust:     { src: '../img/Free Smoke Fx  Pixel 07.png', n: 14, row: 16, white: true }, // mây bụi lớn
};
function vfxRow(color) {
  if (!color || color[0] !== '#' || color.length < 7) return 7;
  const r = parseInt(color.slice(1, 3), 16) / 255, g = parseInt(color.slice(3, 5), 16) / 255, b = parseInt(color.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < 0.18) return mx > 0.55 ? 5 : 6;
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
  if (h < 15 || h >= 340) return 0;
  if (h < 42) return 7;
  if (h < 70) return 4;
  if (h < 165) return 3;
  if (h < 200) return 2;
  if (h < 255) return 8;
  return 1;
}
function vfx(m, key, x, y, r, color, o = {}) {
  const def = VFX_DEF[key]; if (!def || !m || m.fxs.length > 220) return;
  m.fx(Object.assign({ type: 'sprite', key, x, y, r, row: def.white ? def.row : vfxRow(color), tint: def.white ? o.tint : null, life: o.life || 0.5 }, o));
}
const SPELL_VFX = { flash: ['swirl', '#b070ff'], anchor: ['halo', '#a0a0a0'], pulse: ['ring', '#ffb030'], cleanse: ['halo', '#ffffff'], grapple: ['spark', '#a0d0ff'], purge: ['flower', '#60d0ff'],
  deflect: ['halo', '#5a8aff'], sight: ['rune', '#ffffff'], exhaust: ['skull', '#c070ff'], well: ['swirl', '#7050c0'], wall: ['bolt', '#5a8aff'], overclock: ['bolt', '#ffb030'] };

function percentColor(p) {
  if (p < 40) return '#ffffff';
  if (p < 80) return '#ffe066';
  if (p < 120) return '#ff9a3a';
  if (p < 170) return '#ff4a3a';
  return '#c01020';
}
