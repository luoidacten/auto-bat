'use strict';
// ===== Vẽ tướng: thân tròn + vũ khí vẽ tay (giữ phong cách bản cũ) =====
// Toạ độ vũ khí ghi theo thân bán kính 18px rồi phóng theo kích thước thật trên màn hình.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const fromAng = (a, l) => ({ x: Math.cos(a) * l, y: Math.sin(a) * l });
  // màu riêng của 10 ô xuất phát (đấu trường đánh đơn: mỗi tướng một phe) — vòng chân, thanh máu, tên, bản đồ nhỏ
  const TEAM_RING = G.SLOT_COL = ['#4aa3ff', '#ff5a5a', '#5ae07a', '#ffd24a', '#c07aff', '#ff9a3a', '#3ae0e0', '#ff6ac8', '#b0e05a', '#e8e8f0'];

  function lighten(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * k); g = Math.round(g + (255 - g) * k); b = Math.round(b + (255 - b) * k);
    return `rgb(${r},${g},${b})`;
  }
  // mảnh hồn: vũ khí đổi màu theo bậc mảnh hồn cao nhất (TINT = màu bậc, đã pha sáng) — tc(c) trả màu đã nhuộm
  let TINT = null;
  const tc = (c) => TINT || c;
  function blade(ctx, x, y, len, w, color) {
    ctx.strokeStyle = '#333'; ctx.lineWidth = w + 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    ctx.strokeStyle = tc(color); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  }
  // a = { anim, p (0..1), charge (0..1) } — trạng thái hoạt ảnh do bộ vẽ theo dõi
  function drawWeapon(ctx, gfx, a, st, time) {
    const an = a && a.anim, p = a ? a.p : 0;
    let rot = 0, ext = 0;
    const eo = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
    if (an === 'swing') rot = p < 0.6 ? lerp(-1.25, 1.25, eo(p / 0.45)) : lerp(1.25, 0.2, eo((p - 0.6) / 0.4));
    else if (an === 'swing2') rot = p < 0.6 ? lerp(1.25, -1.25, eo(p / 0.45)) : lerp(-1.25, -0.2, eo((p - 0.6) / 0.4));   // GĐ7b: chém ngược chiều (xen kẽ)
    else if (an === 'slam') { rot = p < 0.35 ? lerp(0, -1.8, eo(p / 0.35)) : p < 0.55 ? lerp(-1.8, 0.35, eo((p - 0.35) / 0.2)) : 0.35 * (1 - (p - 0.55) / 0.45); ext = p > 0.35 && p < 0.7 ? 8 : 0; }   // giơ cao rồi đập xuống
    else if (an === 'dash') { ext = Math.sin(Math.min(1, p) * Math.PI) * 16; rot = -0.25 * Math.sin(p * Math.PI); }   // lao tới, vũ khí chĩa trước
    else if (an === 'guard') { rot = -0.9; ext = -4; }
    else if (an === 'thrust') ext = p < 0.35 ? eo(p / 0.35) * 18 : 18 * (1 - eo((p - 0.35) / 0.65));
    else if (an === 'spin') rot = eo(p * 1.15) * TAU;
    else if (an === 'raise') rot = p < 0.45 ? -1.4 * (p / 0.45) : lerp(-1.4, 0.3, Math.min(1, (p - 0.45) * 4));
    ctx.lineCap = 'round';
    switch (gfx) {
      case 'swordshield': {
        ctx.save();
        const guard = an === 'guard';
        ctx.translate(guard ? 20 : 6, guard ? 0 : -16);
        ctx.fillStyle = '#4a78c0'; ctx.strokeStyle = tc('#d8e8ff'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 6, guard ? 18 : 13, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.rotate(rot); ctx.translate(ext, 0); blade(ctx, 10, 14, 44, 4, '#e8eef8');
        break;
      }
      case 'bow': {
        ctx.strokeStyle = tc('#8a5a2a'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(10, 0, 20, -1.2, 1.2); ctx.stroke();
        const pull = an === 'draw' ? 8 + (a.charge || 0) * 10 : 0;
        ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
        const e1 = fromAng(-1.2, 20), e2 = fromAng(1.2, 20);
        ctx.beginPath(); ctx.moveTo(10 + e1.x, e1.y); ctx.lineTo(10 + e1.x - pull, 0); ctx.lineTo(10 + e2.x, e2.y); ctx.stroke();
        break;
      }
      case 'staff': {
        ctx.rotate(rot * 0.5);
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(34 + ext, 14); ctx.stroke();
        const ch = a && a.charge ? a.charge : 0;
        ctx.fillStyle = tc('#ff8a2a'); ctx.shadowColor = tc('#ff6a1a'); ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(36 + ext, 14, 6 + ch * 8, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
        break;
      }
      case 'rapier':
        ctx.rotate(rot * 0.6); ctx.translate(ext * 1.4, 0);
        ctx.strokeStyle = tc('#d4af37'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(14, 10, 5, 0, TAU); ctx.stroke();
        blade(ctx, 14, 10, 56, 2, '#f4f4ff'); break;
      case 'dagger':
        ctx.rotate(rot); ctx.translate(ext, 0); blade(ctx, 12, 14, 24, 3, '#d8c8ff'); blade(ctx, 12, -14, 22, 3, '#d8c8ff'); break;
      case 'katana':
        ctx.rotate(rot); ctx.translate(ext, 0);
        ctx.strokeStyle = '#222'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(8, 14); ctx.lineTo(18, 14); ctx.stroke();
        ctx.strokeStyle = tc('#f0f0f8'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, 14); ctx.quadraticCurveTo(40, 16, 58, 8); ctx.stroke();
        break;
      case 'greatsword':
        ctx.rotate(rot); ctx.translate(ext, 0);
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(20, 14); ctx.stroke();
        ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, 5); ctx.lineTo(20, 23); ctx.stroke();
        blade(ctx, 20, 14, 92, 7, '#f0e8c8');
        ctx.strokeStyle = tc('rgba(255,220,100,0.6)'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(90, 14); ctx.lineTo(112, 14); ctx.stroke();
        break;
      case 'pistol': case 'revolver':
        ctx.translate(-ext * 0.3, 0);
        ctx.fillStyle = '#3a3d44'; ctx.fillRect(14, 8, 22, 7); ctx.fillStyle = '#6a5040'; ctx.fillRect(12, 12, 6, 10);
        ctx.fillStyle = tc(gfx === 'revolver' ? '#c0a080' : '#9aa0a8'); ctx.fillRect(34, 9, 6, 4);
        if (gfx === 'revolver') { ctx.beginPath(); ctx.arc(22, 11, 5, 0, TAU); ctx.fillStyle = '#8a7050'; ctx.fill(); }
        break;
      case 'sniper':   // súng ngắm của Raven: nòng dài, ống ngắm, chân chống
        ctx.translate(-ext * 0.5, 0);
        ctx.fillStyle = '#2a2e38'; ctx.fillRect(4, 5, 30, 6); ctx.fillStyle = tc('#3a4050'); ctx.fillRect(30, 6.5, 44, 3);
        ctx.fillStyle = '#5a3a2a'; ctx.fillRect(-2, 6, 8, 8);
        ctx.fillStyle = '#1a1d24'; ctx.fillRect(16, -1, 16, 5); ctx.fillStyle = '#7ae8ff'; ctx.fillRect(31, 0, 2, 3);
        ctx.strokeStyle = '#3a3d44'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(56, 11); ctx.lineTo(52, 18); ctx.moveTo(56, 11); ctx.lineTo(60, 18); ctx.stroke();
        break;
      case 'pole':
        ctx.rotate(rot); ctx.translate(ext, 0);
        ctx.fillStyle = tc('#b02a1a'); ctx.fillRect(-26, -3, 92, 6);
        ctx.fillStyle = '#ffd24a'; ctx.fillRect(-30, -4, 9, 8); ctx.fillRect(60, -4, 9, 8);
        break;
      case 'twinblades':
        for (const s of [-1, 1]) {
          ctx.save(); ctx.translate(0, s * 11); ctx.rotate(rot * (s > 0 ? 1 : -1) * (an === 'spin' ? 1 : 0.8)); ctx.translate(ext, 0);
          blade(ctx, 8, 0, 36, 3, s > 0 ? '#e8f4ff' : '#b8d8ff'); ctx.restore();
        }
        break;
      case 'rifle':
        ctx.translate(-ext * 0.4, 0);
        ctx.fillStyle = '#2a2e38'; ctx.fillRect(6, 5, 46, 6); ctx.fillRect(10, 9, 8, 9);
        ctx.fillStyle = '#4a5468'; ctx.fillRect(20, 1, 14, 4); ctx.fillStyle = tc('#8aa0c8'); ctx.fillRect(50, 6, 8, 3);
        break;
      case 'gloves':      // găng trắng ảo thuật + quạt bài (Alice ném bài)
        for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.strokeStyle = tc('#c070e0'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(14 + ext, s * 13, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.save(); ctx.translate(20 + ext, 13);
        for (let i = -1; i <= 1; i++) { ctx.save(); ctx.rotate(i * 0.35); ctx.fillStyle = '#5a1a8a'; ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 1; ctx.fillRect(0, -4, 10, 7); ctx.strokeRect(0, -4, 10, 7); ctx.restore(); }
        ctx.restore();
        break;
      case 'dual': {      // GĐ11: hai khẩu khác nhau — tay trên: CHRONO súng ngắn đồng cổ (cam, nòng dài, bánh răng) • tay dưới: NEO súng năng lượng tương lai (xanh dương, thân vát, lõi phát sáng)
        const neo = st && st.stance === 'neo';
        ctx.save(); ctx.rotate(rot * 0.3); ctx.translate(ext * 0.5, 0);
        ctx.globalAlpha = neo ? 0.6 : 1;
        ctx.fillStyle = '#6a4a22'; ctx.fillRect(12, -16, 6, 9);                                   // báng gỗ
        ctx.fillStyle = tc('#c8862a'); ctx.fillRect(16, -15, 22, 5); ctx.fillRect(18, -11, 8, 4);  // thân đồng + ổ đạn
        ctx.strokeStyle = '#ffb04a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(22, -9, 3, 0, TAU); ctx.stroke();   // bánh răng
        ctx.fillStyle = '#ff9a2a'; ctx.fillRect(37, -14, 4, 3);
        ctx.globalAlpha = neo ? 1 : 0.6;
        ctx.fillStyle = '#20283a'; ctx.beginPath(); ctx.moveTo(12, 8); ctx.lineTo(34, 7); ctx.lineTo(38, 10); ctx.lineTo(34, 14); ctx.lineTo(12, 15); ctx.closePath(); ctx.fill();
        ctx.fillStyle = tc('#3aa0ff'); ctx.shadowColor = '#3aa0ff'; ctx.shadowBlur = 8; ctx.fillRect(16, 10, 14, 2); ctx.fillRect(36, 9, 4, 3); ctx.shadowBlur = 0;
        ctx.restore(); ctx.globalAlpha = 1;
        break;
      }
      case 'crossbow': {
        ctx.fillStyle = '#6a4a2a'; ctx.fillRect(10, -3, 30, 6);
        ctx.strokeStyle = tc('#3a2a1a'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(30, 0, 16, -1.3, 1.3); ctx.stroke();
        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath();
        const e1 = fromAng(-1.3, 16), e2 = fromAng(1.3, 16);
        ctx.moveTo(30 + e1.x, e1.y); ctx.lineTo(20, 0); ctx.lineTo(30 + e2.x, e2.y); ctx.stroke();
        break;
      }
      case 'fist': {
        const punch = an === 'thrust' || an === 'swing' ? Math.sin(Math.min(1, p * 2) * Math.PI) * 14 : 0;
        ctx.fillStyle = tc('#ff9a6a'); ctx.strokeStyle = '#5a2a1a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(18 + punch, 11, 7, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(16, -11, 7, 0, TAU); ctx.fill(); ctx.stroke();
        break;
      }
      case 'claw':
        ctx.rotate(rot * 0.7); ctx.strokeStyle = tc('#e0e0e0'); ctx.lineWidth = 2;
        for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(16, s * 12 + i * 3); ctx.lineTo(30 + ext, s * 12 + i * 5); ctx.stroke(); }
        break;
      case 'shotgun':
        ctx.translate(-ext * 0.4, 0);
        ctx.fillStyle = '#5a3a1a'; ctx.fillRect(4, 8, 14, 8);
        ctx.fillStyle = tc('#2a2a30'); ctx.fillRect(16, 7, 26, 5); ctx.fillRect(16, 12, 26, 4);
        break;
      case 'scythe':
        ctx.rotate(rot);
        ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(60, 14); ctx.stroke();
        ctx.strokeStyle = tc('#d0d0e0'); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(46, -8, 24, -0.2, 1.2); ctx.stroke();
        break;
      case 'spear':
        ctx.rotate(rot * 0.4); ctx.translate(ext * 1.6, 0);
        ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-20, 12); ctx.lineTo(80, 12); ctx.stroke();
        ctx.fillStyle = tc('#e0e0e8'); ctx.beginPath(); ctx.moveTo(96, 12); ctx.lineTo(80, 5); ctx.lineTo(80, 19); ctx.fill();
        break;
      case 'voice':
        ctx.fillStyle = tc('#7ae0a0'); ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('♪', 24, -10 + Math.sin(time * 6) * 3); ctx.fillText('♫', 22, 18 + Math.cos(time * 6) * 3);
        break;
      case 'guardian': {
        const punch = an === 'swing' || an === 'thrust' ? Math.sin(Math.min(1, p * 2) * Math.PI) * 10 : 0;
        ctx.fillStyle = tc('#3a8a5a'); ctx.beginPath(); ctx.arc(16 + punch, 12, 7, 0, TAU); ctx.arc(16, -12, 7, 0, TAU); ctx.fill();
        break;
      }
      case 'fan': {
        ctx.rotate(rot * 0.9); ctx.translate(ext + 14, 6);
        const open = an === 'swing' || an === 'spin' ? 1.3 : 0.7;
        ctx.fillStyle = tc('#9ad0c0'); ctx.strokeStyle = '#2a4a40'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 24, -open, open); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
      case 'cards':
        ctx.translate(16 + ext, 8); ctx.rotate(0.3);
        for (let i = 0; i < 3; i++) { ctx.fillStyle = '#fff'; ctx.strokeStyle = tc('#806020'); ctx.lineWidth = 1; ctx.fillRect(i * 3, -i * 2, 9, 13); ctx.strokeRect(i * 3, -i * 2, 9, 13); }
        break;
      case 'flask':
        ctx.fillStyle = tc('rgba(120,230,70,0.85)'); ctx.strokeStyle = '#d0ffd0'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(20 + ext, 10, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#806040'; ctx.fillRect(18 + ext, 0, 4, 5);
        break;
      case 'wrench':
        ctx.rotate(rot * 0.6);
        ctx.strokeStyle = tc('#a0a8b0'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, 14); ctx.lineTo(34, 14); ctx.stroke();
        ctx.beginPath(); ctx.arc(36, 14, 5, 0.6, TAU - 0.6); ctx.stroke(); ctx.fillStyle = '#3a3d44'; ctx.fillRect(12, -16, 18, 6);
        break;
      // ---- GĐ10: vũ khí tướng mới ----
      case 'cane':        // gậy ba toong ảo thuật (Luca)
        ctx.rotate(rot * 0.8); ctx.translate(ext, 0);
        ctx.strokeStyle = tc('#1a1a22'); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(44, 14); ctx.stroke();
        ctx.strokeStyle = '#e8d070'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(46, 9, 5, Math.PI * 0.5, Math.PI * 1.9, true); ctx.stroke();
        ctx.fillStyle = '#f4f4f8'; ctx.fillRect(4, 12, 4, 4);
        break;
      case 'tome':        // sách thánh + chùy (Justus)
        ctx.rotate(rot * 0.7);
        ctx.fillStyle = tc('#e8e0c0'); ctx.strokeStyle = '#7a5a20'; ctx.lineWidth = 1.5; ctx.fillRect(10, -20, 14, 18); ctx.strokeRect(10, -20, 14, 18);
        ctx.fillStyle = '#d0a040'; ctx.fillRect(16, -18, 2, 14); ctx.fillRect(12, -13, 10, 2);
        ctx.strokeStyle = '#6a5030'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(6, 14); ctx.lineTo(34 + ext, 14); ctx.stroke();
        ctx.fillStyle = tc('#c0c4cc'); ctx.beginPath(); ctx.arc(38 + ext, 14, 6, 0, TAU); ctx.fill();
        break;
      case 'hookchain': { // móc sắt xích (Ratok)
        ctx.rotate(rot * 0.5);
        const L = 30 + ext * 2;
        ctx.strokeStyle = '#8a8a90'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(6, 12); ctx.lineTo(L, 12); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = tc('#c8ccd4'); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(L + 4, 6, 7, Math.PI * 0.5, Math.PI * 1.6, true); ctx.stroke();
        break;
      }
      case 'orb':         // quả cầu xác suất lơ lửng (Dr. Caelus)
        ctx.fillStyle = tc('rgba(120,200,255,0.85)'); ctx.strokeStyle = '#e0f4ff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(24 + ext * 0.6, -6 + Math.sin(time * 3) * 3, 7, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(200,240,255,0.6)'; ctx.beginPath(); ctx.arc(24 + ext * 0.6, -6 + Math.sin(time * 3) * 3, 11, time * 2, time * 2 + 2); ctx.stroke();
        break;
      case 'axes':        // song rìu (Boran)
        ctx.rotate(rot);
        for (const yy of [-12, 14]) {
          ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(6, yy); ctx.lineTo(34, yy); ctx.stroke();
          ctx.fillStyle = tc('#b8bcc4'); ctx.beginPath(); ctx.moveTo(28, yy); ctx.lineTo(40, yy - 9); ctx.lineTo(42, yy + 7); ctx.closePath(); ctx.fill();
        }
        break;
      case 'cleaver':     // đại bản đao (Ariston)
        ctx.rotate(rot);
        ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(22, 14); ctx.stroke();
        ctx.fillStyle = tc('#d8dce4'); ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(20, 6); ctx.lineTo(62, 4); ctx.lineTo(66, 16); ctx.lineTo(20, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case 'laser':       // súng laser lượng tử (Dr. Vector)
        ctx.translate(-ext * 0.3, 0);
        ctx.fillStyle = '#2a3040'; ctx.fillRect(6, 8, 16, 9);
        ctx.fillStyle = tc('#e8f0ff'); ctx.fillRect(18, 9, 24, 6);
        ctx.fillStyle = 'rgba(64,224,255,0.9)'; ctx.fillRect(40, 10, 5, 4); ctx.fillRect(24, 6, 10, 2);
        break;
      case 'flysword':    // phi kiếm lơ lửng (Bạch Diệp)
        for (let i = 0; i < 3; i++) {
          const a0 = time * 2.2 + i * 2.094, r0 = 22;
          ctx.save(); ctx.translate(Math.cos(a0) * r0 * 0.6 + 6, Math.sin(a0) * r0); ctx.rotate(-0.2 + rot * 0.3);
          blade(ctx, 0, 0, 18, 2.5, '#d8f0ff'); ctx.restore();
        }
        break;
      case 'ninja':       // song nhẫn đao + phi tiêu (Tsukiyo)
        ctx.rotate(rot);
        blade(ctx, 6, -12, 24, 2.5, '#c8ccd8'); blade(ctx, 6, 14, 24, 2.5, '#c8ccd8');
        ctx.fillStyle = tc('#6b6bd6'); ctx.save(); ctx.translate(36 + ext, 0); ctx.rotate(time * 8);
        ctx.beginPath(); for (let i = 0; i < 4; i++) { const q = i * Math.PI / 2; ctx.lineTo(Math.cos(q) * 6, Math.sin(q) * 6); ctx.lineTo(Math.cos(q + 0.785) * 2, Math.sin(q + 0.785) * 2); } ctx.closePath(); ctx.fill(); ctx.restore();
        break;
      // ===== GĐ11: vũ khí còn thiếu / tách riêng từng tướng =====
      case 'flag': {      // cờ chiến Quân Lệnh (Victoria): cán dài, lá cờ đỏ phấp phới, mũi giáo
        ctx.rotate(rot * 0.6);
        ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-2, 14); ctx.lineTo(46 + ext, 14); ctx.stroke();
        ctx.fillStyle = '#d8d8e0'; ctx.beginPath(); ctx.moveTo(46 + ext, 10); ctx.lineTo(56 + ext, 14); ctx.lineTo(46 + ext, 18); ctx.closePath(); ctx.fill();
        const wv = Math.sin(time * 9) * 3;
        ctx.fillStyle = tc('#c83a3a'); ctx.beginPath(); ctx.moveTo(40 + ext, 14); ctx.quadraticCurveTo(32 + ext, -2 + wv, 22 + ext, -14 + wv); ctx.lineTo(22 + ext, 4); ctx.quadraticCurveTo(30 + ext, 10 - wv, 40 + ext, 14); ctx.fill();
        ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(28 + ext, -2 + wv * 0.5, 2.5, 0, TAU); ctx.fill();
        break;
      }
      case 'wand': {      // đũa phép ảo thuật + mũ chóp (Mirage)
        ctx.rotate(rot * 0.9); ctx.translate(ext, 0);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(8, 14); ctx.lineTo(36, 14); ctx.stroke();
        ctx.strokeStyle = '#f8f8ff'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(33, 14); ctx.lineTo(40, 14); ctx.stroke();
        ctx.fillStyle = tc('#cfa8ff'); ctx.shadowColor = '#cfa8ff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(42, 14, 2.5 + Math.sin(time * 6), 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#1a1a26'; ctx.fillRect(-6, -24, 12, 10); ctx.fillRect(-10, -15, 20, 3);
        ctx.fillStyle = '#a07ad0'; ctx.fillRect(-6, -17, 12, 2);
        break;
      }
      case 'blackcane': { // Gậy Đen đầu hoa hồng đen (Dahlia)
        ctx.rotate(rot * 0.8); ctx.translate(ext, 0);
        ctx.strokeStyle = '#0a0a0e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(2, 14); ctx.lineTo(44, 14); ctx.stroke();
        ctx.strokeStyle = '#6a0a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.moveTo(8 + i * 8, 11); ctx.lineTo(12 + i * 8, 17); } ctx.stroke();
        ctx.fillStyle = tc('#7a0a2a'); for (let i = 0; i < 5; i++) { const q = i * TAU / 5 + time; ctx.beginPath(); ctx.arc(47 + Math.cos(q) * 3, 14 + Math.sin(q) * 3, 3, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#1a0008'; ctx.beginPath(); ctx.arc(47, 14, 2.5, 0, TAU); ctx.fill();
        break;
      }
      case 'lightstaff': { // Trượng Quang (Olivia): cán trắng, vầng hào quang vàng + chữ thập
        ctx.rotate(rot * 0.5);
        ctx.strokeStyle = '#f0ece0'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(34 + ext, 14); ctx.stroke();
        const ch = a && a.charge ? a.charge : 0;
        ctx.strokeStyle = tc('#ffd24a'); ctx.shadowColor = '#ffe07a'; ctx.shadowBlur = 12; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(37 + ext, 14, 6 + ch * 6, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(37 + ext, 6); ctx.lineTo(37 + ext, 22); ctx.moveTo(31 + ext, 12); ctx.lineTo(43 + ext, 12); ctx.stroke(); ctx.shadowBlur = 0;
        break;
      }
      case 'tidestaff': { // trượng thủy triều (Lyra): cán bạc, vòng nước xoay quanh ngọc xanh
        ctx.rotate(rot * 0.5);
        ctx.strokeStyle = '#a8b8c8'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(34 + ext, 14); ctx.stroke();
        const ch = a && a.charge ? a.charge : 0;
        ctx.fillStyle = tc('#4ab0ff'); ctx.shadowColor = tc('#4ab0ff'); ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(37 + ext, 14, 5 + ch * 7, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(180,230,255,0.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(37 + ext, 14, 10, 4, time * 3, 0, TAU); ctx.stroke();
        break;
      }
      case 'voidknife': { // phi đao hư không (Kip): dao đen viền tím, vệt nứt không gian
        ctx.rotate(rot); ctx.translate(ext, 0);
        blade(ctx, 12, 14, 22, 3, '#2a2040'); blade(ctx, 12, -14, 20, 3, '#2a2040');
        ctx.strokeStyle = tc('#a59aff'); ctx.lineWidth = 1.2; ctx.shadowColor = '#a59aff'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.moveTo(14, 14); ctx.lineTo(34, 14); ctx.moveTo(14, -14); ctx.lineTo(32, -14); ctx.stroke(); ctx.shadowBlur = 0;
        break;
      }
      default: break;
    }
  }
  // vẽ một tướng/vật triệu hồi tại (x,y) màn hình, bán kính rpx, hướng nhìn ang
  // o: { color, gfx, team, ang, anim, hurt, stunned, stealth, st, time, rings: [màu…] }
  function drawHero(ctx, x, y, rpx, o) {
    ctx.save();
    ctx.translate(x, y);
    if (o.stealth) ctx.globalAlpha = 0.45;
    // vòng chân theo phe
    ctx.strokeStyle = TEAM_RING[o.team] || '#ccc'; ctx.lineWidth = Math.max(2, rpx * 0.14);
    ctx.globalAlpha *= 0.9;
    ctx.beginPath(); ctx.ellipse(0, rpx * 0.55, rpx * 1.15, rpx * 0.5, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = o.stealth ? 0.45 : 1;
    if (o.rings) o.rings.forEach((c, i) => {
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.globalAlpha *= 0.85;
      ctx.beginPath(); ctx.arc(0, 0, rpx + 6 + i * 4 + Math.sin(o.time * 10) * 1.5, 0, TAU); ctx.stroke();
      ctx.globalAlpha = o.stealth ? 0.45 : 1;
    });
    ctx.rotate(o.ang);
    // GĐ7b — "múa": thân dồn theo đòn (lướt / đập / chém / đâm), co giãn nhẹ khi lướt
    if (o.anim && o.anim.anim) {
      const p = o.anim.p || 0, sw = Math.sin(Math.min(1, p) * Math.PI), an = o.anim.anim;
      const lean = an === 'dash' ? 0.35 : an === 'slam' ? (p > 0.35 ? 0.22 : -0.1) : an === 'spin' ? 0 : an === 'guard' ? -0.08 : 0.14;
      ctx.translate(sw * lean * rpx, 0);
      if (an === 'dash') ctx.scale(1 + 0.16 * sw, 1 - 0.1 * sw);
      else if (an === 'slam' && p > 0.4 && p < 0.65) ctx.scale(1 - 0.08, 1 + 0.08);
    }
    // mảnh hồn: vũ khí nhuộm màu bậc cao nhất + quầng sáng (bậc càng cao càng rực, Vàng/Đỏ nhấp nháy)
    if (o.soul) {
      const S = G.SOUL_TIER && G.SOUL_TIER[o.soul];
      if (S) { TINT = lighten(S.color, o.soul === 1 ? 0.2 : 0.12); ctx.shadowColor = S.color; ctx.shadowBlur = (4 + o.soul * 3) * (o.soul >= 4 ? 0.8 + 0.35 * Math.sin(o.time * 7) : 1); }
    }
    ctx.save(); ctx.scale(rpx / 18, rpx / 18); drawWeapon(ctx, o.gfx, o.anim, o.st, o.time); ctx.restore();
    TINT = null; ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    const g = ctx.createRadialGradient(-rpx * 0.28, -rpx * 0.33, rpx * 0.15, 0, 0, rpx);
    g.addColorStop(0, o.hurt ? '#ffffff' : lighten(o.color, 0.45));
    g.addColorStop(1, o.hurt ? '#ffbbbb' : o.color);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, rpx, 0, TAU); ctx.fill();
    ctx.lineWidth = Math.max(1.5, rpx * 0.12); ctx.strokeStyle = '#20232a'; ctx.stroke();
    if (o.stunned) { ctx.fillStyle = 'rgba(150,150,150,0.45)'; ctx.fill(); }
    ctx.fillStyle = '#111';
    const ey = rpx * 0.33, er = Math.max(1.2, rpx * 0.15);
    ctx.beginPath(); ctx.arc(rpx * 0.5, -ey, er, 0, TAU); ctx.arc(rpx * 0.5, ey, er, 0, TAU); ctx.fill();
    ctx.restore();
  }
  G.Draw = { drawHero, drawWeapon, lighten, TEAM_RING };
})();
