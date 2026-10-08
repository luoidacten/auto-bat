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
      case 'gloves':
        for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.strokeStyle = tc('#c070e0'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(14 + ext, s * 13, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
        break;
      case 'dual':
        ctx.fillStyle = '#3a3d44'; ctx.fillRect(14, 8, 20, 6); ctx.fillRect(14, -14, 20, 6);
        ctx.fillStyle = tc(st && st.stance === 'neo' ? '#6af0ff' : '#d0a050'); ctx.fillRect(32, 9, 5, 4); ctx.fillRect(32, -13, 5, 4);
        break;
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
