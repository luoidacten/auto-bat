'use strict';
// ===== GĐ13: BỘ NÃO THƯỚC GIÓ — Diệp Thanh Phong (Thanh Phong Gale Engine) =====
// • Dạng gió mong muốn theo mục tiêu: máu giấy (xạ thủ / pháp sư / kẻ < 35% máu) → NGHỊCH (sát thủ cận chiến, đâm sau lưng);
//   đấu sĩ / đỡ đòn / hỗ trợ → BÃO HÒA hoặc THUẬN (thả diều, ru ngủ, màng chắn đạn).
// • Đổi gió tự nhiên bằng S1 (−17.5) / S2 (+17.5), không lạm dụng skill phụ.
// • Skill phụ (làm mới S1–S3) chỉ khi: (1) xả 6 chiêu — S1 & S2 đều đang hồi; (2) giải khống chế ở Bão Hòa; (3) thoát hiểm ở Nghịch khi < 25% máu.
// • Combo: Ám Sát (S2 → đòn Đột Kích → S1 lướt theo lốc → S3 Thiên Lôi Phong) • Thả Diều (Phụ lùi → S1 vực xoáy → S2 màng chắn → S3 gió độc)
//   • Ru Ngủ (để chung cho S4 tự chọn cụm) • Lục Phong (sau khi xả hết S1–S3 ở Bão Hòa / Thuận: Phụ làm mới rồi xả lại).
(function () {
  const G = globalThis.G;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const S = (u) => G.HEROES.thanhphong.windState(u);
  const can = (m, u, k) => u.ranks[k] > 0 && m.canCast(u, k);
  const cdDown = (u, k) => !(u.ranks[k] > 0) || (u.cd[k] || 0) > 0.8;
  function subOk(m, u) {
    const st = S(u), e = u.ai && u.ai.enemiesNear && u.ai.enemiesNear.find((x) => dist(x, u) < 7);
    if (st === 'bao' && u.disabled) return true;                                        // giải khống chế
    if (st === 'nghich' && u.hpPct < 0.25 && e) return true;                            // thoát hiểm
    return !!e && st !== 'nghich' && cdDown(u, 's1') && cdDown(u, 's2') && (u.ranks.s3 > 0 ? cdDown(u, 's3') || st === 'thuan' : true);   // xả 6 chiêu
  }
  function cast(ai, k, t, pt, tag) {
    const m = ai.m, u = ai.u;
    if (!m.castSkill(u, k, t, pt || { x: t.x, y: t.y })) return false;
    if (tag) { ai.callout(tag, '#bfffe0'); u.stats['tp_' + k] = (u.stats['tp_' + k] || 0) + 1; }
    return true;
  }
  function fight(ai, t, enemies) {
    const m = ai.m, u = ai.u;
    if (!t || t.kind !== 'hero' || u.cast || u.dash || u.duel) return false;
    const st = S(u), w = u.ws.wind, d = dist(u, t) - u.r - t.r;
    const prof = G.T12 ? G.T12.profile(t) : 'tank';
    const squishy = prof === 'squishy' || t.hpPct < 0.35;
    const want = squishy ? 'nghich' : 'bao';
    u.ws.want = want;
    const chased = enemies.some((e) => !e.ranged && dist(e, u) < 3.2 + e.r) && (!squishy || u.hpPct < 0.5);
    const lead = { x: t.x + (t.vx || 0) * 0.3, y: t.y + (t.vy || 0) * 0.3 };
    // ---- skill phụ ----
    if (can(m, u, 'sub')) {
      if (st === 'nghich' && u.hpPct < 0.25 && d < 6) return cast(ai, 'sub', t, null, '🌪 Nghịch Chuyển: thoát hiểm');
      if (st === 'bao' && u.disabled) return cast(ai, 'sub', t, null, '🌪 Thanh tẩy khống chế');
      if (chased && st === 'nghich' && !squishy) return cast(ai, 'sub', t, null, '🌪 Lùi + khiên (thả diều)');
      if (squishy && st === 'thuan' && d < 7 && u.hpPct > 0.35) return cast(ai, 'sub', t, null, '🌪 Thuận → Nghịch: lốc trời');
      if (d < 7 && subOk(m, u) && t.hpPct > 0.15) { u.stats.tpSix = (u.stats.tpSix || 0) + 1; return cast(ai, 'sub', t, null, '🌪 Lục Phong — làm mới chiêu'); }
    }
    // ---- THẢ DIỀU (đấu sĩ / sát thủ áp sát) ----
    if (chased) {
      if (st === 'bao' && can(m, u, 's1') && w - 17.5 <= 35 && d < 7) return cast(ai, 's1', t, lead, '🌀 Vực xoáy (về Thuận)');
      if (st === 'thuan') {
        if (can(m, u, 's2') && d < 2.6) return cast(ai, 's2', t, null, '🛡 Màng chắn + đẩy 4 đv');
        if (can(m, u, 's3') && d < 5) return cast(ai, 's3', t, { x: u.x - (t.x - u.x), y: u.y - (t.y - u.y) }, '☁ Gió độc hút tâm');
      }
      return false;
    }
    // ---- ÁM SÁT (máu giấy) ----
    if (want === 'nghich') {
      if (st !== 'nghich') {
        if (can(m, u, 's2') && w + 17.5 >= 65 && d < 6.5) return cast(ai, 's2', t, null, '🗡 Nghịch Gió: đâm sau lưng');
        if (st === 'bao' && can(m, u, 's2') && d < 2.5) return cast(ai, 's2', t, null);   // đẩy gió dần lên
        return false;
      }
      if (can(m, u, 's1') && d < 6.5) return cast(ai, 's1', t, lead, '💨 Lướt theo lốc');
      if (can(m, u, 's3') && d < 6) return cast(ai, 's3', t, { x: t.x + (t.x - u.x) * 0.3, y: t.y + (t.y - u.y) * 0.3 }, '⚡ Thiên Lôi Phong');
      return false;
    }
    // ---- đỡ đòn / đấu sĩ không áp sát: giữ Bão Hòa, cấu từ xa, tích Gió Mê ----
    if (st === 'nghich' && can(m, u, 's1') && d < 6.5) return cast(ai, 's1', t, lead, '🌬 Ghìm gió về Bão Hòa');
    if (st === 'bao' && can(m, u, 's1') && w - 17.5 > 35 && d < 6.5) return cast(ai, 's1', t, lead);
    return false;
  }
  G.TPAI = { fight, subOk };
})();
