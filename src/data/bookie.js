'use strict';
// ===== GĐ9b: DỮ LIỆU NHÀ CÁI — cấu trúc run, charm, lời thoại, câu hỏi, điều khoản ẩn =====
// Bạn là kẻ mắc nợ nhà cái. Trả đủ nợ qua 3 chặng (mỗi chặng 3 trận, cuối chặng nộp chỉ tiêu) thì được tự do;
// chọc giận hắn quá nhiều thì trước khi đi phải qua "trận của nhà cái".
(function () {
  const G = globalThis.G || (globalThis.G = {});

  const RUN = {
    startMoney: 1000,
    stages: [{ quota: 1500 }, { quota: 2500 }, { quota: 4000 }],   // chỉ tiêu = mức tài sản (tiền mặt + tiết kiệm) phải CÓ khi hết chặng
    installment: 0,              // chặng 1–2 chỉ cần đạt mốc (không nộp góp); chặng cuối trả hết nợ 4.000 + mọi khoản vay
    perStage: 6,                 // GĐ9c: số trận mỗi chặng (3 → 6)
    savRate: 0.05,               // GĐ9c: sổ tiết kiệm — mỗi trận tiền nằm trong sổ được lãi 5% số dư (cộng dồn)
    endlessGrow: 1.6,            // GĐ9c: chế độ vô tận — chỉ tiêu mỗi chặng ×1.6
    minBet: 50,
    slots: Infinity,             // GĐ9c: không giới hạn số charm; mua trùng thì cộng dồn
    house: ['aria', 'percy', 'elara', 'koda'],   // người của nhà cái (GDD)
    angryEnd: 8,                 // bực bội ≥ mức này sau chặng cuối → trận của nhà cái
    finalNeed: 2500,             // trận của nhà cái: kết thúc trận phải còn ≥ số tiền này
    margin: 0.08,                // phần ăn chia của nhà cái trong tỷ lệ cược
    loans: [500, 1000, 2000], loanRate: 1.3,
    interv: { drop: 300, boss: 400, zone: 250, grow: 1.5 },   // giá can thiệp, ×1.5 mỗi lần trong cùng trận
    midGap: 75, midFirst: 150, midMax: 6,                     // câu hỏi giữa trận: cách nhau ≥ 75s, sớm nhất giây 150, tối đa 6 câu
  };

  // kind: off (GĐ10: ngừng bán — người chơi không còn can thiệp vào trận) • shop (mua trong cửa hàng) • gift (nhà cái tặng — có mặt trái giấu kín) • bad (nhận khi vay — chỉ gỡ khi trả nợ)
  const CHARMS = {
    mat_ken_ken: { kind: 'shop', icon: '🦅', name: 'Mắt Kền Kền', price: 350, desc: 'Mỗi lần có kền kền ăn mạng trong trận: +60 tiền (mỗi bản +60).' },
    luoi_an_toan: { kind: 'shop', icon: '🕸', name: 'Lưới An Toàn', price: 500, desc: 'Cược đầu trận (Sống / Top 1 / Top 3) mà thua vẫn được hoàn 50% (2 bản 75%, 3 bản 87%…).' },
    bao_hiem: { kind: 'shop', icon: '📜', name: 'Bảo Hiểm Giao Kèo', price: 600, desc: 'Giao kèo được sai 1 câu mỗi trận mà không vỡ (câu đó vẫn mất tiền). Mỗi bản thêm 1 câu.' },
    lat_cau: { kind: 'shop', icon: '🔄', name: 'Lật Câu Hỏi', price: 300, desc: 'Mỗi trận được đổi một câu hỏi giữa trận sang câu khác (mỗi bản thêm 1 lần).' },
    doc_chu: { kind: 'shop', icon: '🔍', name: 'Đọc Chữ Nhỏ', price: 400, desc: 'Điều khoản ẩn trong câu hỏi hiện rõ, tô đỏ. Từ bản thứ 2: điều khoản ẩn ít xuất hiện hơn (×0.7 mỗi bản).' },
    tinh_bao: { kind: 'shop', icon: '🕵', name: 'Tình Báo', price: 450, desc: 'Trước trận, lộ ra 1 người của nhà cái (nếu trận có). Mỗi bản lộ thêm 1 người.' },
    pho_mai: { kind: 'off', icon: '🧀', name: 'Phô Mai Hảo Hạng', price: 400, desc: 'Lách luật (can thiệp khi đang có kèo) làm nhà cái bực ít hơn (1 bản: như can thiệp thường; 2 bản: không bực).' },
    kinh_lup: { kind: 'shop', icon: '🔎', name: 'Kính Lúp Sức Mạnh', price: 500, desc: 'Sức mạnh ước lượng hiện đúng giá trị thật (không sai số, không bị thổi phồng). Bản thứ 2: chỉ thẳng tướng bị thổi phồng.' },
    tay_trong: { kind: 'off', icon: '🤝', name: 'Tay Trong', price: 350, desc: 'Can thiệp rẻ hơn 30% (cộng dồn: ×0.7 mỗi bản).' },
    dong_xu: { kind: 'shop', icon: '🪙', name: 'Đồng Xu May Mắn', price: 550, desc: 'Mọi kèo thắng được thêm 10% tiền thưởng (mỗi bản +10%).' },
    ong_nhom: { kind: 'shop', icon: '🔭', name: 'Ống Nhòm', price: 300, desc: 'Câu "Ai thắng?" hiện máu, cấp, sức mạnh và tỷ lệ thật của hai bên. Bản thứ 2: mọi câu hỏi hiện tỷ lệ thật.' },
    ket_sat: { kind: 'shop', icon: '🔐', name: 'Két Sắt', price: 450, desc: 'Sau mỗi trận được lãi 5% tiền mặt (tối đa 300) — mỗi bản cộng thêm.' },
    // ---- quà của nhà cái (mặt trái giấu tới khi xảy ra) ----
    an_hue: { kind: 'gift', icon: '🎁', name: 'Ân Huệ', desc: 'Giảm 20% chỉ tiêu chặng này.', hidden: 'Trận sau có thêm 1 người của nhà cái.' },
    qua_nho: { kind: 'gift', icon: '💝', name: 'Món Quà Nhỏ', desc: 'Nhận ngay 400 tiền.', hidden: 'Tỷ lệ cược xấu đi (nhà cái ăn thêm 10%) trong 2 trận.' },
    loi_hua: { kind: 'gift', icon: '🍬', name: 'Lời Hứa Ngọt', desc: 'Giảm 10% chỉ tiêu chặng này.', hidden: 'Mọi câu hỏi có điều khoản ẩn trong 3 trận.' },
    // ---- charm xấu (khi vay) ----
    xieng_no: { kind: 'bad', icon: '⛓', name: 'Xiềng Nợ', desc: 'Mỗi trận bị trừ lãi 8% khoản vay (mỗi bản thêm 8%).' },
    mat_mo: { kind: 'bad', icon: '🌫', name: 'Mắt Mờ', desc: 'Sức mạnh ước lượng sai số thêm ±15% mỗi bản.' },
    tay_nhon: { kind: 'bad', icon: '🫳', name: 'Bàn Tay Nhờn', desc: 'Mỗi kèo thắng bị nhà cái "phí" 10% (cộng dồn).' },
  };

  // câu hỏi
  const Q = {
    survive: { icon: '🛡', name: 'Ai sẽ sống tới cuối?', short: 'Sống tới cuối' },
    top1: { icon: '👑', name: 'Ai sẽ Top 1?', short: 'Top 1' },
    top3: { icon: '🥇', name: 'Top 3, 2, 1 là ai?', short: 'Top 3' },
    fight: { icon: '⚔', name: 'Ai thắng?', short: 'Ai thắng' },
    boss: { icon: '👑', name: 'Ai giết được boss này?', short: 'Ai giết boss' },
    drop: { icon: '📦', name: 'Ai lấy được thính?', short: 'Ai lấy thính' },
    death: { icon: '💀', name: 'Ai bị hạ tiếp theo?', short: 'Ai bị hạ tiếp' },
    vulture: { icon: '🦅', name: 'Kền kền có xuất hiện không?', short: 'Kền kền?' },
    solo_duel: { icon: '⚔', name: 'Solo Không Gian Riêng: Ai thắng?', short: 'Solo 1v1' },
  };
  // điều khoản ẩn — luôn ghi ra (chữ nhỏ, mờ), chỉ là mập mờ; charm Đọc Chữ Nhỏ tô rõ
  const FINE = {
    top1: { solo: 'Đồng hạng 1 KHÔNG được tính là Top 1.' },
    fight: { drawLose: 'Nếu cả hai cùng sống sau 40 giây: tính là THUA (không hoàn tiền).', killerOnly: 'Thắng nghĩa là TỰ TAY hạ đối thủ — bị kẻ khác hạ hộ thì tính là thua.' },
    boss: { fast90: 'Boss phải chết trong 90 giây, quá hạn tính là thua (không hoàn tiền).' },
    drop: { fast60: 'Thính phải bị lấy trong 60 giây sau khi rơi, quá hạn tính là thua.' },
    death: { noZone: 'Chết vì bo không tính — chờ người bị hạ tiếp theo.' },
    vulture: { heroOnly: 'Kền kền phải là TƯỚNG hạ gục; chết vì bo / quái tính là "không".' },
  };

  // lời thoại nhà cái ("bạn ta")
  const LINES = {
    greet: ['Lại đây nào, bạn ta. Nợ thì phải trả, mà trả bằng cách vui nhất.', 'Bạn ta đến đúng giờ đấy. Đấu trường hôm nay nóng lắm.', 'Mười kẻ vào, một kẻ ra. Bạn ta đặt cửa nào?'],
    askStart: ['Câu đầu tiên — quan trọng nhất: ngươi nghĩ ai sẽ sống?', 'Nào, chọn đi. Ai sống, ai Top 1, hay đoán cả Top 3?'],
    contract: ['Hay là… ký một Giao Kèo? Đúng hết cả trận thì ×10. Sai một câu thôi là mất sạch. Không được hủy đâu nhé.'],
    skip: ['Không muốn đoán à! OK.', 'Ngồi xem cũng được. Nhà cái không vội.'],
    cheese: ['Nah, đó là "Phô Mai" à!', 'Phô Mai… bạn ta khéo tay quá nhỉ.'],
    chaos: ['À, muốn thêm hỗn loạn à?', 'Hỗn loạn tốn tiền đấy, bạn ta.'],
    shop: ['Haah, cùng làm ván cược vui hơn nào, bạn ta.'],
    gift: ['Một món quà nhỏ, coi như tình bạn. Không có gì phải nghĩ đâu.', 'Nhà cái hào phóng hôm nay. Nhận đi.'],
    loan: ['Thiếu tiền? Nhà cái cho vay. Lãi… chút xíu thôi.'],
    winBig: ['Ồ… bạn ta may thật. May mắn thì không kéo dài đâu.', 'Hừm. Lần sau nhà cái sẽ nhớ.'],
    lose: ['Đấu trường không thương ai, bạn ta ạ.', 'Tiếc nhỉ. Còn trận sau mà.'],
    contractWin: ['…Giao kèo trọn vẹn. Nhà cái giữ lời. Lần này.'],
    contractFail: ['Sai một câu. Giao kèo là giao kèo, bạn ta.'],
    stagePass: ['Đủ chỉ tiêu. Chặng sau nặng hơn đấy.'],
    endless: ['Còn muốn chơi tiếp? Nhà cái luôn mở cửa, bạn ta. Chỉ tiêu thì… tăng dần.'],
    endlessFail: ['Đến đây thôi, bạn ta. Ai cũng có giới hạn — nhà cái thì không.'],
    bank: ['Gửi tiền ở nhà cái à? Lãi đều đặn, an toàn tuyệt đối… trong đấu trường của ta.'],
    stageFail: ['Thiếu tiền. Bạn ta biết luật rồi đấy… từ giờ bạn ta làm việc cho nhà cái.'],
    endClean: ['Nợ đã trả. Đi đi, bạn ta — tự do rồi. …Hẹn gặp lại.'],
    finalIntro: ['Trả đủ rồi à? Chưa đâu. Bạn ta chọc giận nhà cái hơi nhiều. Trận này nhà cái đích thân ra tay.'],
    finalWin: ['…Được rồi. Bạn ta thắng. Cút khỏi đấu trường của ta.'],
    finalLose: ['Nhà cái luôn thắng, bạn ta ạ. Luôn luôn.'],
    mood: ['😏', '😒', '😠'],
  };

  G.BET = RUN; G.CHARMS = CHARMS; G.BET_Q = Q; G.BET_FINE = FINE; G.HOUSE_LINES = LINES;
})();
