'use strict';
// ===== Ariston — Thánh Đao Phán Xét • đấu sĩ / đỡ đòn tiền tuyến • mana + Đức Tin (0–100) • vật lý =====
// Đại Bản Đao: tốc đánh cố định (như Gideon) — % tốc đánh cộng thêm quy đổi thành sát thương (1% = 0.8%); đòn đánh quét 160°, lan 50%.
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  function faith(m, u, v) { u.ws.faith = Math.max(0, Math.min(100, u.ws.faith + v)); u.ws.faithT = m.time; }
  const tier = (u) => Math.floor(u.ws.faith / 20);
  // sát thương mà mỗi tướng đã gây ra trong 5s gần nhất (cho Đại Phán Quyết)
  function dealtBy(u, e, now) { const L = (u.ws.dealt && u.ws.dealt.get(e.id)) || []; let s = 0; for (const x of L) if (now - x.t <= 5) s += x.v; return s; }
  H.def({
    id: 'ariston', name: 'Ariston', color: '#e8c060', gfx: 'cleaver', kit: 'tank', pos: ['top'], dmgType: 'phys',
    ranged: false, r: 0.7, resource: 'mana', fixedAs: true,
    stats: { hp: 640, hpG: 98, mp: 300, mpG: 40, armor: 34, armorG: 4.2, mr: 32, mrG: 2.0, ms: 3.45, range: 2.5, as: 0.62 },
    gauge: (u) => ({ v: u.ws.faith || 0, max: 100, label: 'Đức Tin', color: '#ffd27a' }),
    passive: {
      name: 'Đức Tin & Phán Quyết • Hộ Vệ Thánh Đình • Đại Kiếm Trọng Lực',
      desc: 'Nhận sát thương từ tướng / quái: +4 Đức Tin (+10 nếu đòn mất >10% máu); đồng minh trong 10 đv bị đánh: +3. Mỗi 20 Đức Tin: +6% sát thương, +8 Giáp / Kháng Phép. 100 Đức Tin: giảm 15% sát thương nhận và mở khóa Đại Phán Quyết; tụt 5/giây sau 6s ngoài giao tranh. Dưới 50% máu: giáp ảo 25% máu tối đa 4s (90s). Tốc đánh cố định, % tốc đánh cộng thêm quy đổi thành sát thương; đòn đánh quét vòng cung lan 50% sang kẻ đứng cạnh.',
      init(m, u) { u.ws.faith = 0; u.ws.faithT = 0; u.ws.hvT = 0; u.ws.dealt = new Map(); },
      update(m, u) {
        if (m.tick % 10 !== 0) return;
        if (!H.T(u, '9b') && m.time - u.ws.faithT > 6 && u.ws.faith > 0) u.ws.faith = Math.max(0, u.ws.faith - 2.5);
        const k = tier(u), per = H.T(u, '1a') ? 10 : 8, full = u.ws.faith >= 100, s = u.hasKey('ari_faith');
        if (!s || s.n !== k) { m.removeStatus(u, 'buff', 'ari_faith'); if (k) { const st = m.addStatus(u, 'buff', 9999, 1, { key: 'ari_faith', mods: { dmgAmp: 0.06 * k, armor: per * k, mr: per * k, bypass: full && H.T(u, '9c') ? 0.4 : 0 } }); if (st) st.n = k; } }
        if (full && !u.hasKey('ari_holy')) m.addStatus(u, 'reduce', 9999, 0.15, { key: 'ari_holy' }); else if (!full && u.hasKey('ari_holy')) m.removeStatus(u, 'reduce', 'ari_holy');
        // Hộ Vệ Thánh Đình
        if (u.hpPct < 0.5 && m.time >= u.ws.hvT && m.time - (u.lastDmgT || -99) < 1.5) { u.ws.hvT = m.time + (H.T(u, '6a') ? 60 : 90); m.shield(u, u, u.st.maxHp * (H.T(u, '6a') ? 0.4 : 0.25), 4); if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffd27a', life: 1 }); }
        // Lời Nguyện Bất Diệt (bật / tắt): tốn mana tăng dần, hồi 4% máu mỗi giây, mỗi 1.5s giải 1 hiệu ứng xấu
        if (u.ws.prayOn) {
          u.ws.prayN = (u.ws.prayN || 0) + 0.5;
          const cost = ((15 + 8 * Math.floor(u.ws.prayN)) * (H.T(u, '1c') ? 0.8 : 1) * G.C.MANA_COST) * 0.5;
          if (u.mp < cost) { u.ws.prayOn = false; return; }
          u.mp -= cost; m.heal(u, u, u.st.maxHp * 0.02, true);
          if (H.T(u, '3c')) for (const a of H.friendsNear(m, u, 6)) m.heal(u, a, a.st.maxHp * 0.01, true);
          if (u.ws.prayN % 1.5 === 0) { m.removeStatus(u, 'slow'); m.removeStatus(u, 'silence'); if (H.T(u, '6c')) m.cleanse(u); }
          if (H.T(u, '12b')) m.addStatus(u, 'buff', 0.6, 1, { key: 'ari_fort', mods: { tenacity: 0.3 } });
        }
      },
      onAuto(m, u, t, info) {
        info.amt *= 1 + (u.st.asConv || 0) * (H.T(u, '1b') ? 1.0 : 0.8);
        const amt = info.amt * 0.5, v = H.dirTo(u, t);
        info.extra.push(() => m.hitCone(u, u.x, u.y, v.x, v.y, u.st.range + u.r + 0.8, 0.17, (e) => { if (e !== t) m.damage(u, e, amt, 'phys', { tag: 'p', aoe: true }); }, { noFx: true }));
      },
      afterTake(m, u, att, info, dealt) {
        const a = att && (G.ownerOf ? G.ownerOf(att) : att);
        if (!a || a.team === u.team || !(a.kind === 'hero' || a.kind === 'monster' || a.kind === 'pet')) return;
        faith(m, u, (dealt || 0) > u.st.maxHp * 0.1 ? 10 : 4);
        if (u.ws.stance > m.time) {
          faith(m, u, 8);
          if (!a.ranged && a.kind === 'hero' && M.dist(a, u) < 4) { m.addStatus(a, 'slow', 1, 0.3, { src: u }); m.damage(u, a, (info ? info.amt : 50) * 0.15 / 0.4, 'phys', { tag: 's2', noHook: true }); }
          u.ws.blocked = (u.ws.blocked || 0) + (info ? info.amt / 0.4 : 0);
        }
        // ghi sát thương kẻ đó gây ra (cho Đại Phán Quyết)
        const L = u.ws.dealt.get(a.id) || []; L.push({ t: m.time, v: dealt || 0 }); while (L.length && m.time - L[0].t > 5) L.shift(); u.ws.dealt.set(a.id, L);
      },
      onKill(m, u, v) { if (v.kind === 'hero' && u.ws.lastUltV === v && m.time - u.ws.lastUltT < 1 && H.T(u, '9a')) { u.mp = Math.min(u.st.maxMp, u.mp + u.st.maxMp * 0.5); m.heal(u, u, u.st.maxHp * 0.3); } },
    },
    skills: {
      s1: {
        name: 'Thiết Trảm: Liệt Đao', desc: 'Quét vòng cung 160° tầm 3.5 đv: sát thương vật lý nặng, làm chậm 35% 1.5s. Trong 2s dùng lại (Liệt Đao): nhảy vọt tới điểm cách 4.5 đv (cảnh báo đỏ bán kính 2.2 đv 0.45s), bổ đao nứt sàn: sát thương lớn và choáng 1s.',
        cd: [8, 7.5, 7, 6.5, 6], cost: [45, 45, 45, 45, 45], castTime: 0.15,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([70, 105, 140, 175, 210]), 0.9), v = H.dirTo(u, ctx.pt);
          m.hitCone(u, u.x, u.y, v.x, v.y, 3.5, 0.17, (e) => { m.damage(u, e, dmg, 'phys', { tag: 's1', aoe: true }); m.addStatus(e, 'slow', 1.5, 0.35, { src: u }); if (H.T(u, '3a') && e.ga > 0) e.ga = Math.max(0, e.ga - 200); }, { color: '#ffd27a' });
          m.allowRecast(u, 's1', 2, (mm, uu, c) => {
            const p = H.toward(uu, c.pt, 4.5, true);
            mm.telegraph({ x: p.x, y: p.y, r: 2.2, life: 0.45, team: uu.team });
            mm.dashTo(uu, p.x, p.y, 4.5 / 0.45, { unstop: true, wall: H.T(uu, '6b'), onEnd: (m3) => m3.hitCircle(uu, p.x, p.y, 2.2, (e) => { m3.damage(uu, e, dmg * 1.3, 'phys', { tag: 's1', aoe: true }); m3.addStatus(e, 'stun', 1, 1, { src: uu }); }, { color: '#ffb84a' }) });
          });
        },
        ai: { use: 'engage', range: 3.6, aim: 'point', speed: 0, recastWhen: (m, u, t) => !!(t && M.dist(u, t) < 5.5) },
      },
      s2: {
        name: 'Thế Thủ Thánh Quan', desc: 'Cắm đao thế thủ tối đa 1.75s: giảm 60% mọi sát thương, miễn đẩy lùi / hất tung; mỗi đòn trúng thế thủ +8 Đức Tin; kẻ cận chiến đánh vào bị dội lại: chậm 30% và nhận 15% sát thương vừa gây.',
        cd: [12, 11.5, 11, 10.5, 10], cost: [50, 50, 50, 50, 50],
        use(m, u) {
          u.ws.stance = m.time + 1.75; u.ws.blocked = 0;
          m.addStatus(u, 'reduce', 1.75, 0.6, { key: 'ari_stance' }); m.addStatus(u, 'unstop', 1.75, 1, { key: 'ari_stance' });
          m.addStatus(u, 'root', 1.75, 1, { key: 'ari_stance' });
          if (H.T(u, '3b')) m.later(1.75, (mm) => { if (!u.alive) return; const amt = (u.ws.blocked || 0) * 0.3; mm.hitCircle(u, u.x, u.y, 3.5, (e) => mm.damage(u, e, amt, 'phys', { tag: 's2', aoe: true }), { color: '#ffd27a' }); });
        },
        ai: { use: 'defend', range: 5, aim: 'self' },
      },
      s3: {
        name: 'Lời Nguyện Bất Diệt', desc: 'Bật / tắt: tốn 30 mana, sau đó 15 mana mỗi giây (mỗi giây duy trì +8). Hồi 4% máu tối đa mỗi giây — không bị ngắt khi trúng đòn; mỗi 1.5s giải một hiệu ứng xấu nhẹ (làm chậm, câm lặng).',
        cd: 2, cost: [30, 30, 30, 30, 30],
        use(m, u) { u.ws.prayOn = !u.ws.prayOn; u.ws.prayN = 0; if (m.fxOn && u.ws.prayOn) m.fx({ type: 'aura', id: u.id, color: '#fff4c0', life: 1 }); },
        ai: { use: 'custom', aim: 'self', pick: (m, u) => {
          const want = u.ws.prayOn ? !(u.mp < u.st.maxMp * 0.2 || u.hpPct > 0.9) : u.hpPct < 0.7 && u.mp > u.st.maxMp * 0.4;
          return want !== !!u.ws.prayOn ? { pt: { x: u.x, y: u.y } } : null;
        } },
      },
      s4: {
        name: 'Đại Phán Quyết', desc: 'Cần 100 Đức Tin (tiêu hết): khóa một tướng địch trong 6 đv, cảnh báo đỏ 0.5s rồi chém trảm quyết — sát thương vật lý lớn CỘNG sát thương chuẩn bằng 45% tổng sát thương mục tiêu đó đã gây cho Ariston trong 5s trước; phá 100% Hộ Giáp của nạn nhân.',
        cd: [90, 75, 60], cost: [100, 100, 100],
        can(m, u) { return u.ws.faith >= 100; },
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.kind === 'hero' && M.dist(u, ctx.tgt) <= 6.5 ? ctx.tgt : H.nearestEnemyHero(m, u, 6);
          if (!t) return;
          u.ws.faith = 0;
          const base = H.amt(u, ctx.v([200, 320, 440]), 1.1), back = dealtBy(u, t, m.time) * (H.T(u, '12a') ? 0.7 : 0.45);
          m.telegraph({ shape: 'line', x: u.x, y: u.y, x2: t.x, y2: t.y, w: 1.6, life: 0.5, team: u.team });
          m.later(0.5, (mm) => {
            if (!t.alive || !u.alive) return;
            t.ga = 0;
            mm.damage(u, t, base, 'phys', { tag: 's4' });
            if (back > 0) mm.damage(u, t, back, 'true', { tag: 's4' });
            if (H.T(u, '12a') && t.alive && t.hpPct < 0.2) mm.damage(u, t, t.hp + 1, 'true', { tag: 's4' });
            u.ws.lastUltV = t; u.ws.lastUltT = mm.time;
            if (mm.fxOn) mm.fx({ type: 'slash', x: t.x, y: t.y, color: '#ffd27a' });
          });
        },
        ai: { use: 'ult', aim: 'unit', range: 6, heroOnly: true, cond: (m, u, t) => dealtBy(u, t, m.time) > u.st.maxHp * 0.08 || t.hpPct < 0.4 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 6, role: 'tank' },
    tags: ['engage', 'tank'],
  });
  G.HEROES.ariston.tree = [
    [
      { name: 'Đức Tin Kiên Cố', desc: 'Mỗi tầng Đức Tin +10 Giáp / Kháng Phép (thay vì 8).' },
      { name: 'Bản Đao Nặng Trịch', desc: 'Quy đổi tốc đánh → sát thương 1:1.' },
      { name: 'Kỷ Luật Tu Sĩ', desc: 'Lời Nguyện tốn ít hơn 20% mana.' },
    ],
    [
      { name: 'Thiết Trảm Chấn Động', desc: 'Nhát quét đầu phá 200 Hộ Giáp mọi mục tiêu trúng.' },
      { name: 'Thế Thủ Phản Kích', desc: 'Kết thúc Thế Thủ: quét ngược gây 30% sát thương đã chặn.' },
      { name: 'Lời Nguyện Lan Tỏa', desc: 'Lời Nguyện hồi cả đồng minh trong 6 đv (50%).' },
    ],
    [
      { name: 'Hộ Vệ Thánh Khôi', desc: 'Giáp ảo Hộ Vệ = 40% máu tối đa, hồi 60s.' },
      { name: 'Đao Khí Xuyên Tường', desc: 'Liệt Đao nhảy được qua vách đá.' },
      { name: 'Tẩy Trần Triệt Để', desc: 'Lời Nguyện giải cả khống chế cứng.' },
    ],
    [
      { name: 'Phán Quyết Nhân Từ', desc: 'Hạ gục bằng Đại Phán Quyết: hồi 50% mana và 30% máu.' },
      { name: 'Đức Tin Bất Tận', desc: 'Đức Tin không tụt khi ngoài giao tranh.' },
      { name: 'Thánh Quang Xuyên Giáp', desc: '100 Đức Tin: đòn đánh xuyên 40% Hộ Giáp.' },
    ],
    [
      { name: 'Phán Quan Cuồng Tín', desc: 'Phong cách: Đại Phán Quyết hoàn 70% sát thương đối thủ gây ra; dưới 20% máu là hành quyết.' },
      { name: 'Pháo Đài Bất Hoại', desc: 'Phong cách: đang Lời Nguyện +30% kháng hiệu ứng, nhận ít hơn 25% sát thương bo.', stats: { zoneRed: 0.25 } },
      { name: 'Thánh Khí Ngàn Cân', desc: '+30 Giáp, +30 Kháng Phép.', stats: { armor: 30, mr: 30 } },
    ],
  ];
})();
