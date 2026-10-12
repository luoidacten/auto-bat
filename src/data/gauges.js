'use strict';
// ===== GĐ13: THANH TÀI NGUYÊN / TRẠNG THÁI RIÊNG CỦA TỪNG TƯỚNG (cho giao diện người chơi & thẻ tướng) =====
// G.heroGauges(m, u) → [{ k: tên, v: giá trị, max?: tối đa (vẽ thanh), col: màu, txt?: chữ thay số }]
// Chỉ ĐỌC trạng thái (u.ws…), không đổi gì trong trận.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const bar = (k, v, max, col, txt) => ({ k, v: Math.max(0, v || 0), max, col, txt });
  const left = (m, t) => Math.max(0, (t || 0) - m.time);
  const G13 = {
    thanhphong: (m, u) => { const st = G.HEROES.thanhphong.windState(u); return [bar('🌬 Gió', u.ws.wind, 100, st === 'nghich' ? '#ff9a7a' : st === 'thuan' ? '#9fe8ff' : '#bfffe0', `${Math.round(u.ws.wind)} • ${{ thuan: 'Thuận (tầm 4.8)', bao: 'Bão Hòa (tầm 6)', nghich: 'Nghịch (cận chiến)' }[st]}`)]; },
    alice: (m, u) => [bar('🎪 Náo Nhiệt', u.ws.nn, u.ws.bigCap ? 200 : 100, '#ffb0e0'), ...(left(m, u.ws.wildT) ? [bar('✨ Vạn Biến', left(m, u.ws.wildT), 10, '#ffd24a', left(m, u.ws.wildT).toFixed(1) + 's')] : [])],
    luca: (m, u) => [bar('🎭 Náo Nhiệt', u.ws.hype, 100, '#ffb0e0', u.ws.hype >= 100 ? '100 • Cải Trang Tuyệt Đỉnh sẵn' : null)],
    mirage: (m, u) => [bar('🎭 Náo Nhiệt', u.ws.nn, 100, '#d8b0ff')],
    dahlia: (m, u) => [bar('🎩 Náo Nhiệt', u.ws.fz, 100, '#ff8080', left(m, u.ws.frenzyUntil) ? 'CUỒNG NHIỆT ' + left(m, u.ws.frenzyUntil).toFixed(1) + 's' : null)],
    roxie: (m, u) => [bar('⚙ Bánh Răng', u.ws.gears, 10, '#ffd070', String(Math.floor(u.ws.gears || 0))), ...(u.ws.parts ? [bar('🔧 Phụ tùng', u.ws.parts, null, '#c0c0c0', String(u.ws.parts))] : [])],
    florian: (m, u) => [bar('🗡 Đâm Lao', 3.5 - left(m, u.ws.lungeT), 3.5, '#ffe08a', left(m, u.ws.lungeT) ? left(m, u.ws.lungeT).toFixed(1) + 's' : 'SẴN')],
    galo: (m, u) => (left(m, u.ws.beast) ? [bar('🐺 Dạng Quái Thú', left(m, u.ws.beast), 12, '#ff9a5a', left(m, u.ws.beast) > 1e5 ? 'vĩnh viễn' : left(m, u.ws.beast).toFixed(1) + 's')] : [bar('🧍 Dạng Người', 0, null, '#c0c0c0', 'skill phụ để hóa thú')]),
    chrononeo: (m, u) => { const s = u.ws.stance, a = u.ws.ammo || {}; return [bar(s === 'chrono' ? '⏳ Thế Chrono' : '⚡ Thế Neo', a[s], null, s === 'chrono' ? '#8fd0ff' : '#ffd070', `${Math.floor(a[s] || 0)} viên • thế kia ${Math.floor(a[s === 'chrono' ? 'neo' : 'chrono'] || 0)}`)]; },
    kip: (m, u) => [bar('🌀 Điểm Blink', u.ws.ch, 3, '#b0a0ff', String(u.ws.ch || 0))],
    tsukiyo: (m, u) => [bar('💨 Lượt lướt', u.ws.dash, 3, '#a0d0ff', String(u.ws.dash || 0))],
    justus: (m, u) => [bar('✝ Đức Tin', u.ws.faith, 100, '#ffe9a0')],
    olivia: (m, u) => [bar('✝ Đức Tin', u.ws.faith, 100, '#ffe9a0'), ...(u.ws.mshield ? [bar('🛡 Khiên Phép', u.ws.mshield, null, '#b0d0ff', String(Math.round(u.ws.mshield)))] : [])],
    ariston: (m, u) => [bar('✝ Đức Tin', u.ws.faith, 100, '#ffe9a0')],
    kazuki: (m, u) => [bar('☯ Ý Niệm', u.ws.yn, 100, '#c0e0ff'), bar('⚔ Kiếm Ý', u.ws.ky, 10, '#ffd0a0', String(u.ws.ky || 0))],
    boran: (m, u) => [bar('❄ Nộ Khí', u.ws.fury, 100, '#9fe0ff', (u.ws.fury || 0) >= 100 ? '100 • Thấu Cốt' : null)],
    caelus: (m, u) => [bar('🧠 Xác Suất', u.ws.prob, 100, '#b0ffd0', (u.ws.prob || 0) >= 100 ? '100 • Quá Tải Phân Tích' : null)],
    bachdiep: (m, u) => [bar('🗡 Kiếm', u.ws.sw, null, '#d0f0ff', String(u.ws.sw || 0))],
    raven: (m, u) => {
      const I = G.HEROES.raven.ocaInfo(m, u), out = [];
      if (I) out.push(bar('🐦 Oca', I.left, 30, '#8aa0c8', `${I.left.toFixed(0)}s • ${I.prey ? 'bám ' + I.prey.hero.name : I.seek ? 'đang tìm…' : 'lượn'} • ${Math.round(I.hp * 100)}% máu`));
      else out.push(bar('🐦 Oca', 0, null, '#666', 'chưa thả — E'));
      out.push(bar(u.ws.scope ? '🔭 Súng ngắm' : '🔫 Súng trường', 0, null, u.ws.scope ? '#cfe0ff' : '#ccc', u.ws.scope ? (I ? 'tầm vô hạn qua mắt Oca' : 'tầm +7.5') : (I ? 'đứng yên để ngắm' : 'thả Oca để bắn xa')));
      return out;
    },
    wukong: (m, u) => [bar('🐒 Côn Thức', u.ws.kt, 100, '#ffd24a', (u.ws.kt || 0) >= 100 ? '100 • cường hóa tối đa' : (u.ws.kt || 0) >= 50 ? Math.round(u.ws.kt) + ' • chiêu kế cường hóa' : null)],
  };
  G.heroGauges = function (m, u) {
    const out = [];
    try { const f = G13[u.heroId]; if (f) out.push(...f(m, u)); } catch (e) { /* bỏ qua tướng thiếu trạng thái */ }
    const g = G.H && G.H.gun(m, u);   // tướng súng: băng đạn + nạp
    if (g && u.heroId !== 'chrononeo') out.push(bar('🔫 Đạn', g.n, g.max, '#ffe08a', `${Math.floor(g.n)}/${g.max}${g.rl > 0 ? ' • nạp ' + g.rl.toFixed(1) + 's' : ''}`));
    return out;
  };
})();
