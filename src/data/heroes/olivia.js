'use strict';
// ===== Olivia — Thánh Nữ Cuồng Tín • hỗ trợ bảo kê & giải trừ • mana + Đức Tin • phép =====
// Đồng minh = bản thân + người đang liên minh tạm / cùng phe / bạn bè cốt truyện (Justus).
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const faithRate = (m, u) => (H.T(u, '1a') ? 5 : 3) * (H.friendsNear(m, u, 8).length ? 2 : 1);
  function faith(u, v) { u.ws.faith = Math.max(0, Math.min(100, u.ws.faith + v)); }
  function spendF(u, v) { if (u.ws.faith < v) return false; u.ws.faith -= v; return true; }
  const allies = (m, u, R) => H.friendsNear(m, u, R, true);
  function cleanseAll(m, a) { m.cleanse(a); m.removeStatus(a, 'wound'); }
  H.def({
    id: 'olivia', name: 'Olivia', color: '#ffe9a0', gfx: 'lightstaff', kit: 'support', pos: ['sup'], dmgType: 'magic',
    ranged: true, projSpeed: 18, projKind: 'holy', r: 0.56, resource: 'mana',
    stats: { range: 5.5, hp: 575 },
    gauge: (u) => ({ v: u.ws.faith || 0, max: 100, label: 'Đức Tin', color: '#ffe08a' }),
    passive: {
      name: 'Đức Tin Tự Sinh • Thánh Ý Bảo Hộ • Thánh Niệm',
      desc: 'Đức Tin tự hồi 3/giây (gấp đôi cạnh đồng minh); trên 50 Đức Tin: +50% hồi mana. Mỗi 15s nhận Khiên Phép = 12% máu tối đa + 25% SMPT (chỉ đỡ sát thương phép). Đánh thường là tia phép 5.5 đv (100% SMVL + 30% SMPT), trúng tướng +5 Đức Tin.',
      init(m, u) { u.ws.faith = 30; u.ws.mshield = 0; u.ws.mshT = 0; },
      update(m, u) {
        if (m.tick % 10 !== 0) return;
        faith(u, faithRate(m, u) * 0.5);
        const s = u.hasKey('oli_faith');
        if (u.ws.faith > 50 && !s) m.addStatus(u, 'buff', 9999, 1, { key: 'oli_faith', mods: { mpr: u.st.mpr * 0.5 } });
        else if (u.ws.faith <= 50 && s) m.removeStatus(u, 'buff', 'oli_faith');
        if (m.time >= u.ws.mshT) { u.ws.mshT = m.time + 15; u.ws.mshield = Math.max(u.ws.mshield, u.st.maxHp * 0.12 + u.st.ap * 0.25); }
        // Cứu Rỗi Tuyệt Đối: giáp bị phá thì nổ choáng
        if (u.ws.wards && u.ws.wards.length) u.ws.wards = u.ws.wards.filter((w) => {
          if (w.s.v <= 1 && w.a.alive) { m.hitCircle(u, w.a.x, w.a.y, 3, (e) => m.addStatus(e, 'stun', 1, 1, { src: u }), { color: '#ffe08a' }); return false; }
          return w.until > m.time;
        });
        // cầu nguyện (chiêu phụ): hồi máu / mana mỗi giây, bị tướng / quái lớn đánh là ngắt
        if (u.ws.prayUntil > m.time) {
          if (m.time - (u.lastDmgT || -99) < 0.6 && u.lastAtt && (u.lastAtt.kind === 'hero' || u.lastAtt.big || u.lastAtt.kind === 'pet')) { u.ws.prayUntil = 0; m.removeStatus(u, 'root', 'oli_pray'); }
          else { const k = (H.T(u, '6c') ? 4 / 1.5 : 1) * 0.5; m.heal(u, u, u.st.maxHp * (H.T(u, '1c') ? 0.06 : 0.04) * k, true); u.mp = Math.min(u.st.maxMp, u.mp + u.st.maxMp * 0.05 * k); }
        }
      },
      onTake(m, u, att, info) {
        if (u.ws.mshield > 0 && (info.type === 'magic' || (H.T(u, '1b') && info.type === 'true'))) {
          const a = Math.min(u.ws.mshield, info.amt * (info.type === 'true' ? 0.2 : 1)); u.ws.mshield -= a; info.amt -= a;
        }
      },
      onAuto(m, u, t, info) { info.type = 'magic'; info.amt = u.st.ad + 0.3 * u.st.ap; if (t.kind === 'hero') { faith(u, 5); if (H.T(u, '3c')) m.addStatus(t, 'buff', 3, 1, { key: 'oli_pierce', mods: { mrPct: -0.15 } }); } },
    },
    skills: {
      s1: {
        name: 'Dây Dẫn Thánh Linh / Trận Pháp Cứu Rỗi', desc: 'Lên kẻ địch: xích thánh trói chân 1.25–2s và gây sát thương phép. Lên đồng minh: hồi máu tức thì và kéo đồng minh lướt về cạnh Olivia. Có đủ 25 Đức Tin và kẻ địch đứng gần nhau: đặt Thánh Trận ở xa — 1.5s sau kích nổ, trói chân 1.5s mọi kẻ địch trong vùng, hồi máu và thanh tẩy đồng minh trong vùng.',
        cd: [11, 10, 9, 8, 8], cost: [60, 60, 60, 60, 60], castTime: 0.12,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([60, 90, 120, 150, 180]), 0, 0.55), root = ctx.v([1.25, 1.5, 1.75, 2, 2]);
          // ưu tiên cứu đồng minh thấp máu
          const weak = allies(m, u, 9).filter((a) => a !== u && a.hpPct < 0.45).sort((a, b) => a.hpPct - b.hpPct)[0];
          if (weak) {
            m.heal(u, weak, H.amt(u, ctx.v([80, 110, 140, 170, 200]), 0, 0.5));
            const p = H.toward(u, weak, 1.2, false); m.dashTo(weak, u.x + (weak.x - u.x) * 0.15, u.y + (weak.y - u.y) * 0.15, 16, {});
            if (H.T(u, '3a')) m.addStatus(weak, 'haste', 2, 0.4, { key: 'oli_tether' });
            void p;
            if (m.fxOn) m.fx({ type: 'chain', a: u.id, b: weak.id, life: 0.5 });
            return;
          }
          const pt = ctx.pt, R = 3 * (H.T(u, '6a') ? 1.25 : 1);
          const clump = m.enemiesIn(u.team, pt.x, pt.y, R, { heroesOnly: true });
          if (clump.length >= 2 && spendF(u, 25)) {
            m.telegraph({ x: pt.x, y: pt.y, r: R, life: 1.5, team: u.team });
            m.later(1.5, (mm) => {
              mm.hitCircle(u, pt.x, pt.y, R, (e) => { mm.addStatus(e, 'root', 1.5, 1, { src: u }); mm.damage(u, e, dmg * 0.6, 'magic', { tag: 's1', aoe: true }); }, { color: '#ffe08a' });
              for (const a of allies(mm, u, 30)) if (M.dist(a, pt) <= R) { mm.heal(u, a, dmg * 0.8); cleanseAll(mm, a); }
            });
            return;
          }
          const t = ctx.tgt && ctx.tgt.kind === 'hero' ? ctx.tgt : H.nearestEnemyHero(m, u, 8);
          if (!t) return;
          H.homing(m, u, t, { speed: 22, kind: 'chain', onHit: (mm, p, e) => {
            mm.damage(u, e, dmg, 'magic', { tag: 's1' }); mm.addStatus(e, 'root', root, 1, { src: u });
            if (H.T(u, '9c')) { const o = mm.enemiesIn(u.team, e.x, e.y, 3, { heroesOnly: true }).find((x) => x !== e); if (o) mm.addStatus(o, 'root', root * 0.7, 1, { src: u }); }
          } });
        },
        ai: { use: 'cc', range: 8, aim: 'point', speed: 0 },
      },
      s2: {
        name: 'Thánh Hộ Thể', desc: 'Tốn 20 Đức Tin: mọi đồng minh trong 5 đv (kể cả Olivia) nhận Giáp Ảo = 25% máu đã mất + 10% SMPT trong 3.5s — càng thấp máu giáp càng dày.',
        cd: [10, 9, 8, 7, 7], cost: [65, 65, 65, 65, 65],
        can(m, u) { return u.ws.faith >= 20; },
        use(m, u) {
          if (!spendF(u, 20)) return;
          for (const a of allies(m, u, 5)) {
            const v = 0.25 * (a.st.maxHp - a.hp) + 0.1 * u.st.ap + 40;
            const s = m.shield(u, a, v, 3.5);
            if (s && H.T(u, '3b')) m.addStatus(a, 'reduce', 3.5, 0.15, { key: 'oli_ward' });
            if (s && H.T(u, '12b')) (u.ws.wards || (u.ws.wards = [])).push({ a, s, until: m.time + 3.5 });
          }
          if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: 5, color: '#ffe08a' });
        },
        ai: { use: 'custom', aim: 'self', pick: (m, u) => {
          const hurt = allies(m, u, 5).some((a) => a.hpPct < 0.5 && m.time - (a.lastDmgT || -99) < 2);
          return hurt ? { pt: { x: u.x, y: u.y } } : null;
        } },
      },
      s3: {
        name: 'Thánh Lễ Thanh Trừng', desc: 'Tốn 30 Đức Tin: vùng Thánh Lễ bán kính 4 đv trong 4s. Đồng minh trong vùng hồi máu mỗi giây, +15–30% sát thương, +25% tốc chạy. Kẻ địch trong vùng bị xóa mọi khiên / cường hóa / tăng tốc khi Thánh Lễ mở và bị thiêu nhẹ liên tục.',
        cd: [14, 13, 12, 11, 11], cost: [80, 80, 80, 80, 80],
        can(m, u) { return u.ws.faith >= 30; },
        use(m, u, ctx) {
          if (!spendF(u, 30)) return;
          const x = u.x, y = u.y, amp = ctx.v([0.15, 0.2, 0.25, 0.3, 0.3]), burn = H.amt(u, ctx.v([15, 22, 30, 38, 45]), 0, 0.12);
          for (const e of m.enemiesIn(u.team, x, y, 4, { heroesOnly: true })) {
            e.statuses = e.statuses.filter((s) => !(s.type === 'shield' || s.type === 'haste' || (s.type === 'buff' && s.mods)));
            if (H.T(u, '6b')) e.ws.noShieldT = m.time + 2.5;
          }
          m.zone({ owner: u, x, y, r: 4, life: 4, every: 0.5, kind: 'mass', tick: (mm, z) => {
            for (const a of allies(mm, u, 30)) if (M.dist(a, z) <= 4) {
              mm.heal(u, a, a.st.maxHp * 0.02 + u.st.ap * 0.05, true);
              mm.addStatus(a, 'buff', 0.6, 1, { key: 'oli_mass', mods: { dmgAmp: amp, lifesteal: H.T(u, '9b') ? 0.15 : 0 } });
              mm.addStatus(a, 'haste', 0.6, 0.25, { key: 'oli_mass' });
            }
            mm.hitCircle(u, z.x, z.y, 4, (e) => mm.damage(u, e, burn, 'magic', { tag: 's3', aoe: true }), { noFx: true });
          } });
          if (m.fxOn) m.fx({ type: 'ring', x, y, r: 4, color: '#fff4c0', life: 4 });
        },
        ai: { use: 'custom', aim: 'self', pick: (m, u, t) => {
          if (!t || t.kind !== 'hero' || M.dist(u, t) > 5) return null;
          const buffed = t.statuses.some((s) => s.type === 'shield' || (s.type === 'buff' && s.mods && (s.mods.dmgAmp || s.mods.armor)));
          return buffed || u.hpPct < 0.6 || allies(m, u, 6).length > 1 ? { pt: { x: u.x, y: u.y } } : null;
        } },
      },
      sub: {
        name: 'Ý Chí Thần Quan', desc: 'Quỳ cầu nguyện tối đa 4s: mỗi giây hồi 4% máu và 5% mana. Bị tướng hoặc quái lớn đánh là ngắt.',
        cd: 20,
        use(m, u) { u.ws.prayUntil = m.time + (H.T(u, '6c') ? 1.5 : 4); m.addStatus(u, 'root', H.T(u, '6c') ? 1.5 : 4, 1, { key: 'oli_pray' }); },
        ai: { use: 'custom', aim: 'self', pick: (m, u) => {
          const safe = !m.enemiesIn(u.team, u.x, u.y, 8, { heroesOnly: true }).length && m.time - (u.lastDmgT || -99) > 3;
          return safe && (u.hpPct < 0.6 || u.mp < u.st.maxMp * 0.4) ? { pt: { x: u.x, y: u.y } } : null;
        } },
      },
      s4: {
        name: 'Thánh Linh Ban Phước', desc: 'Hồi máu lớn cho mọi đồng minh trên khắp đấu trường (+50% nếu dưới 40% máu), +30% tốc chạy 4s; đồng minh thấp máu nhất nhận Siêu Giáp Ánh Sáng = 35% máu tối đa của Olivia trong 5s.',
        cd: [120, 105, 90], cost: [100, 100, 100], castTime: 0.4,
        use(m, u, ctx) {
          const amt = H.amt(u, ctx.v([200, 320, 440]), 0, 0.8);
          const list = allies(m, u, null);
          for (const a of list) {
            m.heal(u, a, amt * (a.hpPct < 0.4 ? 1.5 : 1));
            m.addStatus(a, 'haste', 4, 0.3, { key: 'oli_ult' });
            if (H.T(u, '9a')) m.addStatus(a, 'buff', 4, 1, { key: 'oli_ult_ten', mods: { tenacity: 0.6 } });
            if (H.T(u, '12a')) G.HEROES.olivia.skills.s3.use && m.zone({ owner: u, x: a.x, y: a.y, r: 3, life: 3, every: 0.5, kind: 'mass', tick: (mm, z) => { if (M.dist(a, z) <= 3) mm.heal(u, a, a.st.maxHp * 0.02, true); } });
          }
          const low = list.slice().sort((a, b) => a.hpPct - b.hpPct)[0];
          if (low) m.shield(u, low, u.st.maxHp * 0.35, 5);
          // kẻ địch quanh Olivia bị lóa thánh quang (chiêu cuối có cả phần sát thương)
          m.hitCircle(u, u.x, u.y, 5, (e) => m.damage(u, e, amt * 0.4, 'magic', { tag: 's4', aoe: true }), { color: '#fff4c0' });
          if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '✨ Thánh Linh Ban Phước', color: '#fff4c0' });
        },
        ai: { use: 'custom', aim: 'self', pick: (m, u) => {
          const low = allies(m, u, null).filter((a) => a.hpPct < 0.35).length;
          return low >= 2 || (u.hpPct < 0.3 && m.time - (u.lastDmgT || -99) < 2) || (low >= 1 && allies(m, u, null).length > 1) ? { pt: { x: u.x, y: u.y } } : null;
        } },
      },
    },
    ai: { order: ['s1', 's3', 's2'], engageRange: 6, role: 'support' },
    tags: ['heal', 'cc'],
  });
  G.HEROES.olivia.tree = [
    [
      { name: 'Đức Tin Dồi Dào', desc: 'Đức Tin tự hồi 5/giây (thay vì 3).' },
      { name: 'Thánh Ý Cường Hóa', desc: 'Khiên Phép đỡ thêm 20% sát thương chuẩn.' },
      { name: 'Cầu Nguyện Thanh Tịnh', desc: 'Cầu nguyện hồi thêm 2% máu mỗi giây.' },
    ],
    [
      { name: 'Dây Dẫn Tăng Tốc', desc: 'Đồng minh được kéo về: +40% tốc chạy 2s.' },
      { name: 'Thánh Giáp Kháng Bộc Phá', desc: 'Giáp của Thánh Hộ Thể giảm thêm 15% sát thương nhận.' },
      { name: 'Thánh Niệm Xuyên Thấu', desc: 'Đánh thường trúng tướng giảm 15% Kháng Phép của nó 3s.' },
    ],
    [
      { name: 'Thánh Trận Cự Ly Xa', desc: 'Thánh Trận rộng hơn 25%.' },
      { name: 'Thanh Trừng Triệt Để', desc: 'Kẻ bị Thánh Lễ xóa cường hóa không nhận được giáp ảo mới 2.5s.' },
      { name: 'Khúc Cầu Nguyện Vội Vã', desc: 'Cầu nguyện chỉ cần 1.5s để hồi trọn phần 4s.' },
    ],
    [
      { name: 'Thánh Linh Bất Diệt', desc: 'Chiêu cuối cho cả đội miễn khống chế nhẹ 4s.' },
      { name: 'Thánh Lễ Cuồng Tín', desc: 'Đồng minh trong Thánh Lễ hút máu 15%.' },
      { name: 'Dây Trói Thần Phạt', desc: 'Xích trói lan sang 1 kẻ địch đứng cạnh.' },
    ],
    [
      { name: 'Đại Nữ Tu Tối Cao', desc: 'Phong cách: chiêu cuối mở thêm vòng Thánh Lễ dưới chân mỗi đồng minh.' },
      { name: 'Cứu Rỗi Tuyệt Đối', desc: 'Phong cách: giáp Thánh Hộ Thể bị phá thì nổ, choáng 1s kẻ địch quanh đồng minh.' },
      { name: 'Ánh Sáng Bền Bỉ', desc: '+300 máu tối đa.', stats: { hp: 300 } },
    ],
  ];
})();
