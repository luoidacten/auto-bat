'use strict';
// ===== Luca — Ảo Thuật Gia Hoa Hồng • sát thủ / pháp sư biến ảo • mana + Náo Nhiệt • phép =====
// Náo Nhiệt (0–100): đánh trúng tướng +5 (+8), chiêu trúng tướng +10, lừa đòn +20, thoát hiểm +15. Mỗi 10 điểm: +2% tốc chạy, +3% SMPT.
// Đủ 100: mở khóa chiêu cuối Cải Trang Tuyệt Đỉnh (sao chép bộ chiêu S1–S3 của tướng địch 15s) và giảm 30s hồi Áo Choàng Thoát Hiểm.
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const KEY = 'luca_hype';
  function hype(m, u, v) {
    const before = u.ws.hype;
    u.ws.hype = Math.max(0, Math.min(100, u.ws.hype + v));
    if (before < 100 && u.ws.hype >= 100) u.ws.cloakT = Math.max(m.time, (u.ws.cloakT || 0) - 30);
    u.ws.hypeT = m.time;
  }
  const cloakCd = (u) => (H.T(u, '6c') ? 90 : 120);
  const stageR = (u) => (H.T(u, '6a') ? 8.5 : 6);
  const inStage = (m, u) => !!(u.ws.stage && u.ws.stage.until > m.time && M.dist(u, u.ws.stage) <= stageR(u) + 0.3);
  // ----- Cải Trang: bộ chiêu sao chép -----
  const disguised = (m, u) => !!(u.ws.copy && u.ws.copyUntil > m.time);
  const copyDef = (u, k) => { const h = u.ws.copy && G.HEROES[u.ws.copy]; return h && h.skills[k]; };
  function useCopied(m, u, k, ctx) {
    const def = copyDef(u, k); if (!def || !def.use) return false;
    if ((u.ws.ccd[k] || 0) > m.time) return false;
    const cd = (typeof def.cd === 'function' ? 8 : Array.isArray(def.cd) ? def.cd[Math.min(def.cd.length, ctx.rank) - 1] : def.cd || 8) * (H.T(u, '9a') ? 0.7 : 1);
    u.ws.ccd[k] = m.time + cd;
    m.hook(def.use, m, u, ctx);
    hype(m, u, 4);
    return true;
  }
  function endDisguise(m, u) {
    if (!u.ws.copy) return;
    u.ws.copy = null; m.removeStatus(u, 'buff', 'luca_copy');
    const o = u.ws.copyFrom; u.ws.copyFrom = null;
    if (o && u.alive) { m.blink(u, o.x, o.y); if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🌹 Hạ màn!', color: '#ff6a9a' }); }
  }
  // khi đang cải trang và đang dùng bộ chiêu sao chép: S1–S3 gọi chiêu của nạn nhân (hồi chiêu riêng)
  function wrap(k, own) {
    return function (m, u, ctx) {
      if (disguised(m, u) && u.ws.kit === 'copy' && useCopied(m, u, k, ctx)) { u.cd[k] = 0.4; return; }
      return own(m, u, ctx);
    };
  }
  // Trò Lừa Bịp thành công: hóa búp hoa ra sau lưng kẻ tấn công, câm lặng 1.25s, đánh dấu +20% sát thương phép
  function counter(m, u, a) {
    u.ws.spotUntil = 0;
    const R = a.r + u.r + 0.6;
    m.later(0, (mm) => {
      if (!u.alive || !a.alive) return;
      mm.blink(u, a.x - a.fx * Math.min(3.5, R + 1), a.y - a.fy * Math.min(3.5, R + 1)); u.face(a.x, a.y);
      mm.addStatus(a, 'silence', 1.25, 1, { src: u });
      mm.addStatus(a, 'mark', 3, 1, { key: 'luca_spot', src: u });
      if (H.T(u, '3a')) mm.addStatus(a, 'blind', 1.5, 1, { src: u });
      hype(mm, u, 20);
      if (mm.fxOn) mm.fx({ type: 'callout', id: u.id, text: '🌹 Ánh đèn rọi vào tôi nè!', color: '#ff6a9a' });
    });
  }
  H.def({
    id: 'luca', name: 'Luca', color: '#ff4a7a', gfx: 'cane', kit: 'mage', pos: ['mid'], dmgType: 'magic',
    ranged: true, projSpeed: 20, projKind: 'card', r: 0.58, resource: 'mana',
    stats: { range: 5.0, hp: 680, hpG: 100, ms: 3.45, armor: 24, mr: 30 },
    gauge: (u) => ({ v: u.ws.hype || 0, max: 100, label: 'Náo Nhiệt', color: '#ff6a9a' }),
    passive: {
      name: 'Sân Khấu Náo Nhiệt',
      desc: 'Náo Nhiệt 0–100: đánh trúng tướng +5, chiêu trúng tướng +10, lừa đòn +20, thoát hiểm +15. Mỗi 10 điểm +2% tốc chạy, +3% SMPT; đủ 100 mở khóa Cải Trang Tuyệt Đỉnh. Áo Choàng Thoát Hiểm (120s): lần đầu tụt dưới 10% máu → tàng hình 1.5s, dịch chuyển 4 đv ra xa kẻ địch, +15 Náo Nhiệt; mỗi lần đầy 100 Náo Nhiệt giảm 30s hồi.',
      init(m, u) { u.ws.hype = 0; u.ws.hypeT = 0; u.ws.cloakT = 0; u.ws.ccd = {}; u.ws.kit = 'own'; u.ws.stage = null; u.ws.waltz = 0;
        u.ws.ccNegate = (mm, uu, a) => { if (!(uu.ws.spotUntil > mm.time) || !a || (a.kind !== 'hero' && a.kind !== 'pet')) return false; counter(mm, uu, a); return true; };   // GĐ11: Trò Lừa Bịp triệt tiêu cả khống chế
      },
      update(m, u) {
        if (m.tick % 10 !== 0) return;
        if (!H.T(u, '9c') && m.time - u.ws.hypeT > 6 && u.ws.hype > 0) u.ws.hype = Math.max(0, u.ws.hype - 5 * 10 * G.C.TICK);   // GĐ11: ngoài giao tranh > 6s tụt 5 điểm/giây
        const k = Math.floor(u.ws.hype / 10);
        const s = u.hasKey(KEY);
        if (!s || s.n !== k) { m.removeStatus(u, 'buff', KEY); if (k > 0) { const st = m.addStatus(u, 'buff', 9999, 1, { key: KEY, mods: { msPct: 0.02 * k, apPct: 0 } }); if (st) { st.n = k; st.mods.ap = u.st.ap * 0.03 * k; } } }
        if (u.ws.copy && u.ws.copyUntil <= m.time) endDisguise(m, u);
        // Áo Choàng Thoát Hiểm
        if (u.alive && u.hpPct < 0.1 && (u.ws.cloakT || 0) <= m.time && m.time - (u.lastDmgT || -99) < 2) {
          u.ws.cloakT = m.time + cloakCd(u);
          m.addStatus(u, 'stealth', 1.5, 1, { key: 'luca_cloak' });
          const e = H.nearestEnemyHero(m, u, 10), v = e ? H.dirTo(e, u) : { x: -u.fx, y: -u.fy };
          m.blink(u, u.x + v.x * 4, u.y + v.y * 4);
          if (H.T(u, '1b')) m.addStatus(u, 'haste', 3, 0.4, { key: 'luca_slip' });
          hype(m, u, 15);
          if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🌹 Biến mất!', color: '#ff6a9a' });
        }
      },
      afterDeal(m, u, t, info) {
        if (t.kind !== 'hero') return;
        if (info.auto) hype(m, u, H.T(u, '1a') ? 8 : 5);
        else if (G.ITEM_IS_SKILL(info) && H.ready(m, u, 'hyp_sk', 0.4)) hype(m, u, 10);
      },
      onDeal(m, u, t, info) {
        // Ánh Đèn: kẻ bị phản kích nhận thêm 20% sát thương phép từ Luca trong 3s
        if (info.type === 'magic' && t.statuses.length && t.hasKey('luca_spot')) info.amt *= 1.2;
      },
      onTake(m, u, att, info) {
        if (!(u.ws.spotUntil > m.time) || !att || att.team === u.team) return;
        const a = G.ownerOf ? G.ownerOf(att) : att; if (!a || (a.kind !== 'hero' && a.kind !== 'pet')) return;
        info.amt = 0; counter(m, u, a);
      },
    },
    skills: {
      s1: {
        name: 'Sân Khấu Mở Ra / Bước Nhảy Ngàn Hoa', desc: 'Mở Vùng Sân Khấu bán kính 6 đv trong 6s: trong vùng +20% tốc chạy, +15% hút máu phép. Trong sân khấu, S1 thành Bước Nhảy Ngàn Hoa: hồi 1.2s, tốn 25 mana, lướt 2.5 đv phóng cánh hoa hồng thép gây sát thương phép kẻ địch lướt qua.',
        cd: [10, 9, 8, 7, 7], cost: [55, 55, 55, 55, 55], manualCd: true,
        use: wrap('s1', (m, u, ctx) => {
          const dmg = H.amt(u, ctx.v([75, 110, 145, 180, 215]), 0, 0.6);
          if (inStage(m, u)) {
            u.mp += m.costOf(u, 's1') - (H.T(u, '12b') ? 0 : 25 * G.C.MANA_COST);
            u.cd.s1 = 1.2;
            u.ws.waltz = m.time - (u.ws.waltzT || -9) < 2.5 ? Math.min(3, u.ws.waltz + 1) : 0; u.ws.waltzT = m.time;
            const k = 1 + (H.T(u, '3c') ? 0.15 * u.ws.waltz : 0);
            const p = H.toward(u, ctx.pt, 2.5, false), v = H.dirTo(u, p);
            m.hitLine(u, u.x, u.y, v.x, v.y, 3, 1.1, (e) => { m.damage(u, e, dmg * k, 'magic', { tag: 's1' }); if (H.T(u, '1c')) m.dot(u, e, 6 + u.level, 2, 'phys', 'luca_thorn'); }, { color: '#ff6a9a' });
            m.dashTo(u, p.x, p.y, 22, {});
            if (H.T(u, '12b')) m.addStatus(u, 'buff', 1.3, 1, { key: 'luca_noslow', mods: { tenacity: 0.6 } });
            return;
          }
          u.cd.s1 = m.cdOf(u, 's1');
          u.ws.stage = { x: u.x, y: u.y, until: m.time + 6 };
          const R = stageR(u);
          m.zone({ owner: u, x: u.x, y: u.y, r: R, life: 6, every: 0.5, kind: 'stage', tick: (mm, z) => {
            if (u.alive && M.dist(u, z) <= R) { mm.addStatus(u, 'haste', 0.6, 0.2, { key: 'luca_stage' }); mm.addStatus(u, 'buff', 0.6, 1, { key: 'luca_stage', mods: { lifesteal: 0.15 } }); }
          } });
          if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: R, color: '#ff6a9a', life: 6 });
        }),
        ai: { use: 'burst', range: 6, aim: 'point', speed: 0 },
      },
      s2: {
        name: 'Ánh Đèn Rọi Vào Tôi Nè!', desc: 'Tạo dáng 1.5s ("Trò Lừa Bịp"): đòn đầu tiên của kẻ địch bị triệt tiêu 100%, Luca hóa búp hoa dịch chuyển ra sau lưng kẻ tấn công, câm lặng 1.25s và khiến nạn nhân nhận thêm 20% sát thương phép từ Luca trong 3s (+20 Náo Nhiệt).',
        cd: [13, 12, 11, 10, 10], cost: [60, 60, 60, 60, 60],
        use: wrap('s2', (m, u) => { u.ws.spotUntil = m.time + 1.5; if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#fff0a0', life: 1.5 }); }),
        ai: { use: 'defend', range: 6, aim: 'self' },
      },
      s3: {
        name: 'Hoán Vị Ảnh Hồng', desc: 'Để lại Đóa Hồng Chiếu Ảnh (6s) rồi lao 4.5 đv: kẻ đầu tiên va phải nhận sát thương phép và choáng 0.75s. Trong 6s dùng lại để dịch chuyển về đóa hồng.',
        cd: [11, 10, 9, 8, 8], cost: [65, 65, 65, 65, 65],
        use: wrap('s3', (m, u, ctx) => {
          const dmg = H.amt(u, ctx.v([100, 145, 190, 235, 280]), 0, 0.75), life = H.T(u, '3b') ? 8 : 6;
          const rose = { x: u.x, y: u.y };
          if (m.fxOn) m.fx({ type: 'ring', x: rose.x, y: rose.y, r: 0.8, color: '#ff4a7a', life });
          let hit = false;
          const p = H.toward(u, ctx.pt, 4.5, false);
          m.dashTo(u, p.x, p.y, 20, { onContact: (mm, uu, e) => { if (hit) return; hit = true; mm.damage(u, e, dmg, 'magic', { tag: 's3' }); mm.addStatus(e, 'stun', 0.75, 1, { src: u }); return 'stop'; } });
          m.allowRecast(u, 's3', life, (mm, uu) => {
            const from = { x: uu.x, y: uu.y };
            mm.blink(uu, rose.x, rose.y);
            if (H.T(uu, '9b')) mm.hitCircle(uu, from.x, from.y, 2.5, (e) => mm.damage(uu, e, dmg * 0.7, 'magic', { tag: 's3', aoe: true }), { color: '#ff4a7a' });
          }, rose);
        }),
        ai: { use: 'engage', range: 5, aim: 'point', speed: 20, skillshot: true, alsoEscape: true,
          recastWhen: (m, u, t) => u.hpPct < 0.45 || !!(t && t.kind === 'hero' && t.hpPct > u.hpPct + 0.25) },
      },
      sub: {
        name: 'Hoán Đổi Bộ Chiêu', desc: 'Khi đang Cải Trang: lật qua lại giữa bộ chiêu của Luca và bộ chiêu đang sao chép (hai bộ hồi chiêu độc lập).',
        cd: 1,
        can(m, u) { return disguised(m, u); },
        use(m, u) { u.ws.kit = u.ws.kit === 'copy' ? 'own' : 'copy'; if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: u.ws.kit === 'copy' ? '🎭 Bộ chiêu sao chép' : '🌹 Bộ chiêu Luca', color: '#ff6a9a' }); },
        ai: { use: 'custom', aim: 'self', pick: (m, u) => {
          if (!disguised(m, u)) return null;
          // còn chiêu sao chép sẵn sàng thì dùng bộ sao chép; hết thì lật về bộ của Luca
          const copyReady = ['s1', 's2', 's3'].some((k) => !((u.ws.ccd[k] || 0) > m.time));
          const want = copyReady ? 'copy' : 'own';
          return want !== u.ws.kit ? { pt: { x: u.x, y: u.y } } : null;
        } },
      },
      s4: {
        name: 'Cải Trang Tuyệt Đỉnh', desc: 'Cần 100 Náo Nhiệt. Ném lá bài mạ vàng 8 đv: trúng tướng gây sát thương phép, Luca hóa trang thành tướng đó 15s — S1–S3 được thay bằng chiêu của nạn nhân (SMPT quy đổi thành SMVL nếu sao chép đấu sĩ / xạ thủ), dùng chiêu phụ để lật qua lại hai bộ chiêu. Trong 2s đầu dùng lại để đổi chỗ với nạn nhân. Hết giờ: dịch chuyển về chỗ bắt đầu tung chiêu.',
        cd: [90, 75, 60], cost: [100, 100, 100], castTime: 0.15,
        can(m, u) { return disguised(m, u) ? (H.T(u, '12a') && !u.ws.copyUlt && !!copyDef(u, 's4')) : u.ws.hype >= 100; },
        use(m, u, ctx) {
          // Thiên Tài Đạo Diễn: đang cải trang thì dùng chiêu cuối của nạn nhân một lần
          if (disguised(m, u)) { u.ws.copyUlt = true; const d = copyDef(u, 's4'); if (d && d.use) m.hook(d.use, m, u, ctx); return; }
          const dmg = H.amt(u, ctx.v([150, 240, 330]), 0, 0.7), from = { x: u.x, y: u.y };
          u.ws.hype = 0;
          H.shoot(m, u, ctx.pt, { speed: 26, range: 8, r: 0.5, kind: 'card', hitMinions: false, onHit: (mm, p, e) => {
            mm.damage(u, e, dmg, 'magic', { tag: 's4' });
            if (e.kind !== 'hero') return;
            u.ws.copyUlt = false; u.ws.copy = e.heroId; u.ws.copyUntil = mm.time + 15; u.ws.copyFrom = from; u.ws.copyVic = e; u.ws.kit = 'copy'; u.ws.ccd = {};
            const P = e.hero.passive; if (P && P.init && !u.ws['init_' + e.heroId]) { u.ws['init_' + e.heroId] = 1; try { P.init(mm, u); } catch (err) { /* nội tại không hợp: bỏ qua */ } }
            if (e.hero.dmgType === 'phys') mm.addStatus(u, 'buff', 15, 1, { key: 'luca_copy', mods: { ad: u.st.ap * 0.65 } });   // GĐ11: 1 SMPT → 0.65 SMVL
            if (mm.fxOn) mm.fx({ type: 'callout', id: u.id, text: '🎭 Cải trang: ' + e.hero.name, color: '#ffd24a' });
            mm.allowRecast(u, 's4', 2, (m3, u3) => {
              if (!e.alive) return;
              const x = u3.x, y = u3.y; m3.blink(u3, e.x, e.y); e.x = x; e.y = y; e.navP = null; e.dash = null;
              if (H.T(u3, '6b')) m3.addStatus(e, 'stun', 1, 1, { src: u3 });
            });
          } });
        },
        // GĐ11: đổi chỗ có chủ đích — Luca ngoài bo còn nạn nhân trong bo (ring-out: ném nạn nhân ra bão), có Lật Tẩy (choáng),
        // hoặc nạn nhân đứng xa (đổi chỗ để áp sát); không thì KHÔNG tự đổi lúc hết hạn
        ai: { use: 'ult', aim: 'point', speed: 26, range: 7.5, heroOnly: true, noExpire: true,
          recastWhen: (m, u) => { const v = u.ws.copyVic; if (!v || !v.alive) return false; const z = m.zoneSt;
            if (z && z.dps > 0 && !m.inZone(u) && m.inZone(v)) { u.stats.ringOut = (u.stats.ringOut || 0) + 1; return true; }
            return H.T(u, '6b') || M.dist(u, v) > 4; } },
      },
    },
    ai: { order: ['s3', 's1', 's2'], engageRange: 6, role: 'assassin',
      // GĐ11: Alice đang đánh nhau → tới nơi mở Sân Khấu chia lửa
      bondOpen: (m, u, foe) => { if (inStage(m, u) || M.dist(u, foe) > 7 || !m.canCast(u, 's1')) return false; return !!m.castSkill(u, 's1', foe, { x: u.x, y: u.y }); },
      guard: (m, u) => (u.ws.spotUntil > m.time ? { t: 1, punish: true } : null) },
    tags: ['dive'],
  });
  G.HEROES.luca.tree = [
    [
      { name: 'Khán Giả Cuồng Nhiệt', desc: 'Đánh thường trúng tướng +8 Náo Nhiệt (thay vì +5).' },
      { name: 'Vạt Áo Trơn Trượt', desc: 'Sau Áo Choàng Thoát Hiểm: +40% tốc chạy 3s.' },
      { name: 'Hương Hoa Gai Góc', desc: 'Cánh hoa của Bước Nhảy Ngàn Hoa gây chảy máu.' },
    ],
    [
      { name: 'Ánh Đèn Chói Mắt', desc: 'Ánh Đèn phản kích thành công gây thêm mù 1.5s.' },
      { name: 'Hoa Hồng Vĩnh Cửu', desc: 'Đóa hồng của S3 tồn tại 8s.' },
      { name: 'Vũ Điệu Bão Tố', desc: 'Mỗi lần lướt liên tiếp trong sân khấu +15% sát thương (tối đa 3 lần).' },
    ],
    [
      { name: 'Sân Khấu Mở Rộng', desc: 'Sân khấu rộng 8.5 đv.' },
      { name: 'Lật Tẩy Bất Ngờ', desc: 'Đổi chỗ bằng Cải Trang làm nạn nhân choáng 1s.' },
      { name: 'Nghệ Sĩ Đào Thoát', desc: 'Áo Choàng Thoát Hiểm hồi 90s.' },
    ],
    [
      { name: 'Ảo Thuật Hoàn Hảo', desc: 'Chiêu sao chép hồi nhanh hơn 30%.' },
      { name: 'Hoán Vị Nổ Tung', desc: 'Dịch chuyển về đóa hồng để lại vụ nổ hoa hồng ở chỗ vừa rời.' },
      { name: 'Vỗ Tay Không Dứt', desc: 'Náo Nhiệt không tụt khi ngoài giao tranh.' },
    ],
    [
      { name: 'Thiên Tài Đạo Diễn', desc: 'Phong cách: Cải Trang sao chép cả chiêu cuối của nạn nhân — dùng được 1 lần trong 15s.' },
      { name: 'Sân Khấu Tử Thần', desc: 'Phong cách: lướt trong sân khấu không tốn mana và không bị làm chậm.' },
      { name: 'Ngôi Sao Đường Phố', desc: 'Hạ gục tướng: +30 Náo Nhiệt.', onKill(m, u, v) { if (v.kind === 'hero') { u.ws.hype = Math.min(100, u.ws.hype + 30); u.ws.hypeT = m.time; } } },
    ],
  ];
})();
