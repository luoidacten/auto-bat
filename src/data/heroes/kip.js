'use strict';
// ===== Kip — Kẻ Dạo Bước Hư Không • sát thủ cơ động cực hạn • 3 Điểm Hư Không • vật lý =====
// Điểm Hư Không (3, +1 với nhánh 1a): hồi 1 điểm mỗi 10/9/8/7s; Vết Nứt Hư Không tốn 1, Vòm Xoáy tốn 1, Lãnh Địa tốn 2.
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const maxCh = (u) => (H.T(u, '1a') ? 4 : 3);
  const chCd = (m, u) => { const r = Math.max(1, Math.min(5, m.rankOf(u, 's1') || 1)); return [10, 9, 8, 7, 7][r - 1] * (1 - u.st.cdr); };
  const inField = (m, u) => !!(u.ws.field && u.ws.field.until > m.time && M.dist(u, u.ws.field) <= 14);
  function spend(m, u, n) { if (inField(m, u) && n === 1 && u.ws.spendKey === 's1') return true; if (u.ws.ch < n) return false; u.ws.ch -= n; return true; }
  // sau mỗi cú dịch chuyển: +15% tốc chạy 2.5s, đòn cận chiến kế tiếp xuyên Hộ Giáp và áp sát tức thời 4 đv
  function afterBlink(m, u) {
    m.addStatus(u, 'haste', 2.5, 0.15, { key: 'kip_drift' });
    u.ws.riftHit = m.time + 3;
    if (inField(m, u)) m.makeDecoy(u, u.x, u.y, { life: 2.5, hp: 0.25 });
  }
  function bypassNow(m, u) { let b = 0; if (u.ws.riftHit > m.time) b += H.T(u, '9b') ? 0.65 : 0.3; if (inField(m, u)) b += 0.5; return b; }
  H.def({
    id: 'kip', name: 'Kip', color: '#7a6aff', gfx: 'dagger', kit: 'fighter', pos: ['jungle'], dmgType: 'phys',
    ranged: false, r: 0.55, resource: 'none',
    stats: { hp: 600, hpG: 90, ad: 68, adG: 4.1, armor: 27, armorG: 3.6, as: 0.75, ms: 3.7, range: 1.4 },
    gauge: (u) => ({ v: u.ws.ch || 0, max: maxCh(u), label: 'Điểm Hư Không', color: '#a59aff', pips: true }),
    passive: {
      name: 'Gia Tốc Trượt Không Gian',
      desc: 'Mỗi lần lướt / dịch chuyển / dây móc: +15% tốc chạy 2.5s; đòn cận chiến kế tiếp sau dịch chuyển bỏ qua 30% Hộ Giáp và áp sát tức thời trong 4 đv. Thể Phản Xạ Hư Vô (45s): đòn đầu tiên từ kẻ địch ngoài tầm nhìn bị vô hiệu. Đứng trong vùng cảnh báo đỏ: +30% tốc chạy để thoát.',
      init(m, u) { u.ws.ch = maxCh(u); u.ws.chT = 0; u.ws.field = null; },
      update(m, u) {
        // hồi Điểm Hư Không
        if (u.ws.ch < maxCh(u)) { u.ws.chT += G.C.TICK; if (u.ws.chT >= chCd(m, u)) { u.ws.chT = 0; u.ws.ch++; } } else u.ws.chT = 0;
        if (m.tick % 5 === 0 && m.dangers && m.dangers.length) {
          const inD = m.dangers.some((z) => z.until > m.time && z.team !== u.team && (z.shape === 'circle' || !z.shape) && M.dist(u, z) < (z.r || 0) + u.r);
          if (inD) m.addStatus(u, 'haste', 0.4, 0.3, { key: 'kip_warp' });
        }
        if (u.ws.field && u.ws.field.until > m.time && M.dist(u, u.ws.field) > 14) u.ws.field.until = m.time;   // rời lãnh địa → kết giới biến mất
      },
      onDash(m, u) { m.addStatus(u, 'haste', 2.5, 0.15, { key: 'kip_drift' }); },
      onDeal(m, u, t, info) {
        const b = bypassNow(m, u);
        if (b && (info.auto || G.ITEM_IS_SKILL(info))) info.byp = Math.max(info.byp || 0, b);
        if (info.auto && u.ws.riftHit > m.time) u.ws.riftHit = 0;
      },
      onAuto(m, u, t) {
        // áp sát tức thời sau dịch chuyển
        if (u.ws.riftHit > m.time && M.dist(u, t) > u.st.range + u.r + t.r && M.dist(u, t) < 4) { const R = u.r + t.r + 0.3, v = H.dirTo(t, u); m.blink(u, t.x + v.x * R, t.y + v.y * R); }
      },
      onTake(m, u, att, info) {
        const a = att && (G.ownerOf ? G.ownerOf(att) : att);
        if (!a || a.team === u.team || a.kind !== 'hero') return;
        if (!u.vis || a.vis[u.team]) return;               // chỉ khi bị đánh từ ngoài tầm nhìn
        if (!H.ready(m, u, 'phase', 45)) return;
        info.amt = 0; m.addStatus(u, 'untarget', 0.35, 1, { key: 'kip_phase' });
        if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🌀 Hư vô!', color: '#a59aff' });
      },
      onKill(m, u, v) { if (v.kind === 'hero' && H.T(u, '6b')) u.ws.ch = Math.min(maxCh(u), u.ws.ch + 2); if (v.kind === 'hero' && H.T(u, '12a') && inField(m, u)) { u.ws.field.until += 3; m.heal(u, u, u.st.maxHp * 0.3); } },
    },
    skills: {
      s1: {
        name: 'Vết Nứt Hư Không', desc: 'Tốn 1 Điểm Hư Không: dịch chuyển 6 đv theo hướng chỉ định (xuyên vật cản mỏng), để lại Vết Nứt 3s. Trong 3s dùng lại để giật về Vết Nứt, hồi 15% Hộ Giáp và choáng 0.3s kẻ địch quanh đó.',
        cd: 0.4, manualCd: true,
        can(m, u) { return u.ws.ch > 0 || inField(m, u); },
        use(m, u, ctx) {
          u.ws.spendKey = 's1'; if (!spend(m, u, 1)) return; u.ws.spendKey = null;
          u.cd.s1 = inField(m, u) ? 1 : 0.4;
          const rift = { x: u.x, y: u.y }, d = H.T(u, '3c') ? 8.5 : 6;
          const p = H.toward(u, ctx.pt, d, false);
          m.blink(u, p.x, p.y); afterBlink(m, u);
          if (m.fxOn) m.fx({ type: 'ring', x: rift.x, y: rift.y, r: 1, color: '#7a6aff', life: 3 });
          m.allowRecast(u, 's1', 3, (mm, uu) => {
            mm.blink(uu, rift.x, rift.y); afterBlink(mm, uu);
            uu.ga = Math.min(uu.st.maxGa, (uu.ga || 0) + uu.st.maxGa * 0.15);
            mm.hitCircle(uu, rift.x, rift.y, 2.2, (e) => mm.addStatus(e, 'stun', 0.3, 1, { src: uu }), { color: '#a59aff' });
          }, rift);   // GĐ11: điểm neo cho luật snapback chung
          if (H.T(u, '6c')) m.later(3, (mm) => mm.hitCircle(u, rift.x, rift.y, 2.5, (e) => mm.damage(u, e, 200, 'magic', { tag: 's1', aoe: true }), { color: '#7a6aff' }));
        },
        ai: { use: 'engage', range: 6, aim: 'point', speed: 0, alsoEscape: true, skillshot: true, cond: (m, u, t) => u.ws.ch >= 2 || u.hpPct < 0.4 || !!(t && t.hpPct < 0.35),   // GĐ10: giữ 1 Điểm Hư Không cho Vòm Xoáy / thoát thân
          recastWhen: (m, u, t) => u.hpPct < 0.4 || !!(t && t.kind === 'hero' && !t.ranged && M.dist(u, t) < 2.5 && u.hpPct < 0.6) },
      },
      s2: {
        name: 'Phi Đao Tọa Độ', desc: 'Phóng phi đao 16 đv. Cắm địa hình: tạo điểm neo 5s, dùng lại để dịch chuyển tới đó. Trúng kẻ địch: sát thương vật lý; dùng lại (5s) để xuyên không ra sau gáy đối thủ, đâm chí mạng và làm chậm 50% 1.5s.',
        cd: [12, 11, 10, 9, 9],
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([60, 90, 120, 150, 180]), 0.7);
          const pr = H.shoot(m, u, ctx.pt, { speed: 26, range: 16, r: 0.4, kind: 'arrow', hitMinions: !H.T(u, '3a'),
            onHit: (mm, p, e) => {
              mm.damage(u, e, dmg, 'phys', { tag: 's2' });
              mm.allowRecast(u, 's2', 5, (m3, u3) => {
                if (!e.alive) return;
                const R = e.r + u3.r + 0.4; m3.blink(u3, e.x - e.fx * R, e.y - e.fy * R); u3.face(e.x, e.y); afterBlink(m3, u3);
                const crit = H.T(u3, '6a') || m3.rng.chance(0.5 + (u3.st.crit || 0));
                m3.damage(u3, e, dmg * (crit ? 1.75 : 1.1), 'phys', { tag: 's2', crit });
                m3.addStatus(e, 'slow', 1.5, 0.5, { src: u3 });
              });
            },
            onEnd: (mm, p) => {
              if (p.hitAny) return;
              const anchor = { x: p.x, y: p.y };
              mm.allowRecast(u, 's2', 5, (m3, u3) => { m3.blink(u3, anchor.x, anchor.y); afterBlink(m3, u3); }, anchor);
            } });
          if (pr) { const oh = pr.onHit; pr.onHit = (mm, p, e) => { p.hitAny = true; return oh(mm, p, e); }; }
        },
        ai: { use: 'poke', range: 14, aim: 'point', speed: 26, recastWhen: (m, u, t) => !!(t && t.kind === 'hero' && (t.hpPct < 0.5 || (t.cast && t.cast.key === 'potion')) && u.hpPct > 0.35) },
      },
      s3: {
        name: 'Vòm Xoáy Bẻ Cong Đạn Đạo', desc: 'Tốn 1 Điểm Hư Không: lỗ đen mini bán kính 3.5 đv quanh thân 2s — nuốt mọi đạn đạo tầm xa bay vào; kẻ địch cận chiến bước vào nhận sát thương phép và bị hất văng 4 đv khi vòm xoáy kết thúc.',
        cd: [15, 14, 13, 12, 12], whileDisabled: false,
        can(m, u) { return u.ws.ch > 0; },
        use(m, u, ctx) {
          if (!spend(m, u, 1)) return;
          const dmg = H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0.3, 0.4), caught = new Set();
          let eaten = 0;
          m.zone({ owner: u, x: u.x, y: u.y, r: 3.5, life: 2, every: 0.1, follow: u, kind: 'vortex',
            tick: (mm, z) => {
              for (const p of mm.projs) if (!p.dead && p.team !== u.team && M.dist(p, u) < 3.5) { p.dead = true; eaten++; if (H.T(u, '3b')) u.ga = Math.min(u.st.maxGa, (u.ga || 0) + u.st.maxGa * 0.05); }
              for (const e of mm.enemiesIn(u.team, u.x, u.y, 3.5, { heroesOnly: true })) if (!e.ranged && !caught.has(e.id)) { caught.add(e.id); mm.damage(u, e, dmg, 'magic', { tag: 's3' }); }
            },
            onEnd: (mm) => { for (const e of mm.heroes) if (caught.has(e.id) && e.alive && M.dist(e, u) < 6) { const v = H.dirTo(u, e); mm.knock(u, e, v.x, v.y, 4, 0.3); } } });
          if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: 3.5, color: '#3a2a8a', life: 2, follow: u.id });
        },
        ai: { use: 'custom', aim: 'self', pick: (m, u, t) => {
          const shots = m.projs.filter((p) => !p.dead && p.team !== u.team && M.dist(p, u) < 7 && (p.target === u || !p.target)).length;
          const melee = m.enemiesIn(u.team, u.x, u.y, 3, { heroesOnly: true }).some((e) => !e.ranged);
          return shots >= 2 || (melee && u.hpPct < 0.6) ? { pt: { x: u.x, y: u.y } } : null;
        } },
      },
      s4: {
        name: 'Lãnh Địa Đa Chiều: Trò Chơi Trốn Tìm', desc: 'Tốn 2 Điểm Hư Không: kết giới bán kính 14 đv trong 8s — Vết Nứt không tốn điểm và hồi 1s; mỗi cú dịch chuyển để lại tàn ảnh đánh lừa; mọi đòn đánh thêm 50% xuyên Hộ Giáp. Rời khỏi kết giới thì nó biến mất.',
        cd: [80, 65, 50],
        can(m, u) { return u.ws.ch >= 2; },
        use(m, u) {
          if (!spend(m, u, 2)) return;
          const life = H.T(u, '12a') ? 12 : 8;
          u.ws.field = { x: u.x, y: u.y, until: m.time + life };
          if (m.fxOn) m.fx({ type: 'ring', x: u.x, y: u.y, r: 14, color: '#7a6aff', life });
          if (H.T(u, '12b')) for (const e of m.enemiesIn(u.team, u.x, u.y, 14, { heroesOnly: true })) { m.knockup(u, e, 1.5); m.addStatus(e, 'nodash', 1.5, 1, { src: u }); }
        },
        ai: { use: 'ult', aim: 'self', range: 9 },
      },
    },
    ai: { order: ['s2', 's1', 's3'], engageRange: 7, role: 'assassin', flank: 'behind', hitRun: true },
    tags: ['dive', 'mobile'],
  });
  G.HEROES.kip.tree = [
    [
      { name: 'Bước Chân Hư Ảo', desc: 'Thêm 1 Điểm Hư Không tối đa (4 lần dịch chuyển).' },
      { name: 'Thấu Thị Không Gian', desc: 'Nhìn xa hơn 25% và thấy rương đồ quanh mình.', stats: { visPct: 0.25 } },
      { name: 'Gia Tốc Dây Móc', desc: '+10% tốc chạy thường trực.', stats: { msPct: 0.1 } },
    ],
    [
      { name: 'Cắt Gió Đa Tầng', desc: 'Phi Đao xuyên qua quái để găm vào tướng.' },
      { name: 'Nuốt Đạn Phản Hồi', desc: 'Mỗi viên đạn Vòm Xoáy nuốt: hồi 5% Hộ Giáp.' },
      { name: 'Lướt Xuyên Tường Dày', desc: 'Vết Nứt dịch chuyển 8.5 đv.' },
    ],
    [
      { name: 'Đột Kích Điểm Mù', desc: 'Dịch chuyển sau lưng bằng Phi Đao luôn chí mạng.' },
      { name: 'Không Gian Nén', desc: 'Hạ gục tướng: hồi 2 Điểm Hư Không.' },
      { name: 'Vết Nứt Nổ Chậm', desc: 'Vết Nứt biến mất thì phát nổ 200 sát thương phép.' },
    ],
    [
      { name: 'Trôi Dạt Vô Đích', desc: 'Nhận ít hơn 40% sát thương bo.', stats: { zoneRed: 0.4 } },
      { name: 'Vết Cắt Xuyên Tủy', desc: 'Đòn sau dịch chuyển xuyên 65% Hộ Giáp.' },
      { name: 'Cổng Dịch Chuyển', desc: '+15% hồi chiêu.', stats: { cdr: 0.15 } },
    ],
    [
      { name: 'Sát Thủ Vô Ảnh', desc: 'Phong cách: Lãnh Địa 12s; hạ gục trong kết giới +3s và hồi 30% máu.' },
      { name: 'Nghịch Đảo Trọng Trường', desc: 'Phong cách: mở Lãnh Địa nhấc bổng mọi kẻ địch trong 14 đv 1.5s, cấm dây móc.' },
      { name: 'Khe Nứt Bất Tận', desc: 'Điểm Hư Không hồi nhanh hơn 30%.', stats: { cdr: 0.1 } },
    ],
  ];
})();
