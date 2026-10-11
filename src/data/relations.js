'use strict';
// ===== GĐ10: QUAN HỆ CỐT TRUYỆN GIỮA CÁC TƯỚNG (dùng chung cho AI chọn mục tiêu) =====
// friend: không ra tay trước với người này (chỉ đánh trả khi bị chính họ đánh)
// protect: ai đánh người này thì ưu tiên trừng phạt kẻ đó (và đi theo họ khi rảnh)
// hate: hệ số ưu tiên tiêu diệt (cộng thêm điểm chọn mục tiêu)
// eternal: GĐ11 liên minh VĨNH CỬU (Luca ↔ Alice) — không bao giờ đánh nhau, không tranh thính/boss, đi cùng & bọc lót nhau; chỉ khi còn đúng 2 người mới phân thắng bại
// line: câu thoại khi lần đầu chạm mặt
(function () {
  const G = globalThis.G || (globalThis.G = {});
  G.RELATIONS = {
    luca:    { friend: ['alice'], protect: ['alice'], eternal: ['alice'], hate: { caelus: 0.6, vector: 0.6 } },
    alice:   { friend: ['luca', 'mirage'], protect: ['luca'], eternal: ['luca'] },
    mirage:  { friend: ['alice', 'luca'], protect: ['alice', 'vesper'], hate: { caelus: 0.8, vector: 0.6 },
               line: { vesper: 'Ta biết sự thật sau nhát đạn đó, đứa trẻ tội nghiệp…', caelus: 'Ngươi nhìn thấu tương lai, nhưng có thấy bản thân đang đứng ở đâu không?' } },
    kip:     { friend: ['aria'], protect: ['aria'], hate: { caelus: 0.7 }, line: { caelus: 'Tính toán tiếp đi ông tiến sĩ!' } },
    aria:    { friend: ['kip'] },
    olivia:  { friend: ['justus', 'ariston', 'valerius'], protect: ['justus'] },
    justus:  { friend: ['olivia', 'ariston', 'valerius'], protect: ['olivia'], hate: { vesper: 1.0, death: 1.0, caelus: 1.0 },
               line: { death: 'Giáo lý của Thánh Quan không có chỗ cho những linh hồn sa đọa!' } },
    ariston: { friend: ['justus', 'olivia', 'valerius'], protect: ['justus', 'olivia'], hate: { vesper: 1.8, thanhphong: 1.8, dahlia: 1.2 },
               line: { vesper: 'Những kẻ chống lại Ngài sẽ nhận phán xét từ ta!!' } },
    caelus:  { hate: { luca: 1.2 }, line: { luca: 'Mọi trò bịp bợm của ngươi đều không thoát khỏi cặp mắt phân tích này đâu.' } },
    vector:  { hate: { luca: 1.0, alice: 0.6, mirage: 0.8, dahlia: 0.8 }, line: { luca: 'Này Luca! Ngươi nghĩ thầy sẽ nói gì khi thấy học trò cưng của mình đi làm xiếc dưới đáy cống?' } },
    boran:   { hate: { caelus: 2.2, roxie: 2.2, raven: 0.8, kip: 0.8 } },
    ratok:   { friend: ['borg'] },
    borg:    { friend: ['ratok'] },
    dahlia:  { hate: { aria: 0.8, victoria: 0.8, roxie: 0.8 } },
  };
  const R = (id) => G.RELATIONS[id] || null;
  G.isFriend = (a, b) => { const r = R(a); return !!(r && r.friend && r.friend.includes(b)); };
  G.eternal = (a, b) => { const r = R(a), q = R(b); return !!((r && r.eternal && r.eternal.includes(b)) || (q && q.eternal && q.eternal.includes(a))); };
  G.protects = (a) => { const r = R(a); return (r && r.protect) || []; };
  G.hateOf = (a, b) => { const r = R(a); return (r && r.hate && r.hate[b]) || 0; };
  G.relLine = (a, b) => { const r = R(a); return (r && r.line && r.line[b]) || null; };
})();
