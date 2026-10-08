'use strict';
// ===== Galo — Bình Độc • Đi rừng / Đường trên • đổi dạng, gieo độc • KHÔNG MANA (tốn máu) • phép =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const TX = 'galo_tx', DOT = 'galo_dot', BEAST = 'galo_beast';
  const beast = (m, u) => H.T(u, '12a') || u.ws.beast > m.time;
  const maxTx = (u) => (H.T(u, '9a') ? 10 : 6);
  // Độc Tiêu Xương: mỗi tầng −4% giáp & kháng phép, kèm độc nhẹ
  function poison(m, u, t, k) {
    if (!t || !t.alive || t.kind === 'tower' || t.kind === 'nexus') return 0;
    let s = t.hasKey(TX), n = Math.min(maxTx(u), (s ? s.n || 1 : 0) + (k || 1));
    s = m.addStatus(t, 'buff', 4, 1, { key: TX, src: u, mods: { armorPct: -0.04 * n, mrPct: -0.04 * n } });
    if (s) s.n = n;
    m.addStatus(t, 'dot', 4, (2.5 + 0.5 * u.level) * n * (H.T(u, '1a') ? 1.35 : 1), { key: DOT, src: u, tick: 0.5, dtype: 'magic' });
    return n;
  }
  const hpCost = (m, u, pct) => { if (!beast(m, u)) u.hp = Math.max(1, u.hp - u.hp * pct); };
  function setCd(m, u, k, human, animal) { u.cd[k] = (beast(m, u) ? animal : human) * (1 - u.st.cdr); }
  function enterBeast(m, u, T) {
    u.ws.beast = m.time + T; u.ranged = false;
    m.addStatus(u, 'buff', T, 1, { key: BEAST, persist: false, mods: { range: -2.9, armor: 15, mr: 15, ad: 10 + 2 * u.level, msPct: 0.08 } });
    m.shield(u, u, 100 + 20 * u.level, 4);
    if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#7ae04a', life: 1 });
  }
  H.def({
    id: 'galo', name: 'Galo', color: '#7ae04a', gfx: 'flask', kit: 'fighter', pos: ['jungle', 'top'], dmgType: 'magic',
    ranged: true, projSpeed: 16, projKind: 'fire', r: 0.62, resource: 'none',
    stats: { hp: 565, hpG: 88, hpr: 1.6, hprG: 0.12, ad: 55, adG: 3.2, armor: 28, armorG: 3.8, mr: 30, mrG: 1.6, as: 0.66, asG: 0.022, ms: 3.5, range: 4.5 },
    passive: {
      name: 'Độc Tiêu Xương',
      desc: 'Đòn độc găm tầng Tiêu Xương (tối đa 6, 4s): mỗi tầng −4% giáp và kháng phép, kèm độc nhẹ. Dạng Người: đánh tầm xa, chiêu tốn 3–5% máu hiện tại. Dạng Quái Thú (skill phụ): cận chiến, chiêu không tốn máu.',
      init(m, u) { u.ws.beast = 0; if (H.T(u, '12a')) enterBeast(m, u, 1e6); },
      update(m, u) {
        const b = beast(m, u);
        if (!b && !u.ranged) {   // hết dạng thú
          u.ranged = true;
          if (!H.T(u, '3c')) m.addStatus(u, 'slow', 2, 0.3, { key: 'galo_crash' });
        }
        if (b) u.ranged = false;
        // Bước Chân Hóa Chất: vệt axit
        if (b && H.T(u, '1c') && m.tick % 20 === 0) m.zone({ owner: u, x: u.x, y: u.y, r: 1.3, life: 2, every: 0.5, kind: 'acid',
          tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => mm.addStatus(e, 'slow', 0.6, 0.25, { src: u, key: 'galo_trail' }), { noFx: true }) });
      },
      respawn(m, u) { if (H.T(u, '12a')) enterBeast(m, u, 1e6); else { u.ws.beast = 0; u.ranged = true; } },
      onAuto(m, u, t, info) {
        info.extra.push(() => poison(m, u, t, 1));
        // Thợ Săn Tối Thượng: cắn kết liễu
        if (u.ws.hunt > m.time && t.kind === 'hero' && t.hpPct < 0.15) info.amt = Math.max(info.amt, t.hp * 3);
      },
      onKill(m, u, v) { if (H.T(u, '12c') && v.kind === 'hero' && v.hasKey(DOT)) u.cd.s4 = Math.max(0, (u.cd.s4 || 0) - 40); },
      onFatal(m, u) {
        if (!H.T(u, '9c') || !beast(m, u) || u.ws.bbt === u.stats.d) return false;
        u.ws.bbt = u.stats.d; u.hp = 1; m.shield(u, u, 200 + 20 * u.level, 3); return true;
      },
    },
    skills: {
      s1: {
        name: 'Ném Lọ Độc / Song Trảo', desc: 'Người: ném lọ độc tới điểm trong 7 đv, nổ bán kính 1.8, găm 2 tầng (4% máu; HC 5s). Thú: 2 nhát cào trước mặt, mỗi nhát 1 tầng (HC 3s).',
        cd: [5, 5, 5, 5, 5], manualCd: true, castTime: 0.15,
        use(m, u, ctx) {
          setCd(m, u, 's1', 5, 3);
          if (beast(m, u)) {
            const dmg = H.amt(u, ctx.v([35, 55, 75, 95, 115]), 0.4, 0.3);
            const swipe = () => { if (!u.alive) return; const v = { x: u.fx, y: u.fy }; m.hitCone(u, u.x, u.y, v.x, v.y, 2.4, 0.5, (e) => { m.damage(u, e, dmg, 'magic', { tag: 's1' }); poison(m, u, e, 1); }, { color: '#9aff6a' }); };
            swipe(); m.later(0.2, swipe); return;
          }
          hpCost(m, u, 0.04);
          const dmg = H.amt(u, ctx.v([60, 90, 120, 150, 180]), 0, 0.5);
          if (H.T(u, '6b')) {   // Phun Axit
            const v = H.dirTo(u, ctx.pt);
            m.hitCone(u, u.x, u.y, v.x, v.y, 4, 0.55, (e) => { m.damage(u, e, dmg, 'magic', { tag: 's1', aoe: true }); poison(m, u, e, 2); }, { color: '#9aff6a' });
            for (const p of m.projs) if (!p.dead && p.team !== u.team && M.dist(p, u) < 4 && (p.x - u.x) * v.x + (p.y - u.y) * v.y > 0) p.dead = true;
            return;
          }
          const p = H.toward(u, ctx.pt, 7, true), d = M.dist(u, p);
          m.later(d / 14, (mm) => mm.hitCircle(u, p.x, p.y, 1.8, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's1', aoe: true }); poison(mm, u, e, 2); }, { color: '#9aff6a' }));
          m.telegraph({ team: u.team, x: p.x, y: p.y, r: 1.8, life: d / 14, color: '#7ae04a' });
        },
        ai: { use: 'poke', range: 6.5, aim: 'point', speed: 0, delay: 0.4, farm: 3 },
      },
      s2: {
        name: 'Bom Khí Ngạt / Ngoạm Cắn', desc: 'Người: vũng khí độc bán kính 2.5 trong 3s — chậm 30%, mù (3% máu; HC 10s). Thú: lao 4 đv ngoạm; mục tiêu đủ tầng tối đa thì ×1.6 sát thương và tiêu hết tầng (HC 7s).',
        cd: [10, 10, 10, 10, 10], manualCd: true, castTime: 0.12,
        use(m, u, ctx) {
          setCd(m, u, 's2', 10, 7);
          if (beast(m, u)) {
            const t = ctx.tgt && ctx.tgt.alive && M.dist(u, ctx.tgt) < 5 ? ctx.tgt : null;
            const p = t ? { x: t.x, y: t.y } : H.toward(u, ctx.pt, 4, true);
            const dmg = H.amt(u, ctx.v([70, 105, 140, 175, 210]), 0.3, 0.6);
            m.dashTo(u, p.x, p.y, 20, { onContact: (mm, uu, e) => {
              if (e.kind !== 'hero' && e.kind !== 'monster' && e.kind !== 'minion' && e.kind !== 'pet') return;
              const s = e.hasKey(TX), full = s && s.n >= maxTx(u);
              mm.damage(u, e, dmg * (full ? 1.6 : 1), 'magic', { tag: 's2' });
              if (full) { mm.removeStatus(e, 'buff', TX); } else poison(mm, u, e, 1);
              if (H.T(u, '3b')) mm.removeStatus(e, 'shield');
              if (H.T(u, '6a') && e.kind === 'hero') mm.allowRecast(u, 's2', 2, (m3, u3) => { if (e.alive && M.dist(u3, e) < 3) { m3.damage(u3, e, dmg * 0.4, 'magic', { tag: 's2' }); m3.addStatus(e, 'stun', 1, 1, { src: u3 }); } });
              return 'stop';
            } });
            return;
          }
          hpCost(m, u, 0.03);
          const p = H.toward(u, ctx.pt, 7, true), sil = new Set();
          m.zone({ owner: u, x: p.x, y: p.y, r: 2.5, life: 3, every: 0.5, kind: 'gas',
            tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => {
              mm.damage(u, e, H.amt(u, ctx.v([12, 18, 24, 30, 36]), 0, 0.1), 'magic', { tag: 's2', aoe: true });
              mm.addStatus(e, 'slow', 0.6, 0.3, { src: u, key: 'galo_gas' }); mm.addStatus(e, 'blind', 0.6, 1, { src: u });
              if (H.T(u, '3a') && e.kind === 'hero' && !sil.has(e.id)) { sil.add(e.id); mm.addStatus(e, 'silence', 1, 1, { src: u }); }
              if (H.T(u, '6c') && M.dist(u, z) < z.r) mm.heal(u, u, u.st.maxHp * 0.01, true);
            }, { noFx: true }) });
        },
        ai: { use: 'burst', range: 4.5, aim: 'point', speed: 0, farm: 4 },
      },
      s3: {
        name: 'Nhảy Lùi Thoát Hiểm / Hống Xung Phong', desc: 'Người: bật nhảy lùi 4 đv, xả khói độc che mắt (mù) tại chỗ cũ và +25% tốc chạy 2s (HC 12s). Thú: gầm CHOÁNG 0.5s kẻ trước mặt rồi phi thân vồ tới trong cự ly 4 đv (HC 9s).',
        cd: [12, 12, 12, 12, 12], manualCd: true,
        use(m, u, ctx) {
          setCd(m, u, 's3', 12, 9);
          if (beast(m, u)) {
            const stun = H.T(u, '9b');
            if (stun) for (const p of m.projs) if (!p.dead && p.team !== u.team && M.dist(p, u) < 4) p.dead = true;
            const dmg = H.amt(u, ctx.v([40, 65, 90, 115, 140]), 0.3, 0.4), v = H.dirTo(u, ctx.pt);
            if (stun) m.hitCircle(u, u.x, u.y, 3, (e) => { m.damage(u, e, dmg, 'magic', { tag: 's3', aoe: true }); m.addStatus(e, 'stun', 1.25, 1, { src: u }); }, { color: '#9aff6a', fx: 'roar' });
            else m.hitCone(u, u.x, u.y, v.x, v.y, 3.2, 0.4, (e) => { m.damage(u, e, dmg, 'magic', { tag: 's3', aoe: true }); m.addStatus(e, 'stun', 0.5, 1, { src: u }); }, { color: '#9aff6a', fx: 'roar' });
            // phi thân vồ tới
            const p = H.toward(u, ctx.pt, 4, true);
            m.later(0.15, (mm) => { if (u.alive && !u.disabled) mm.dashTo(u, p.x, p.y, 18, { onContact: (m3, uu, e) => { m3.damage(u, e, dmg * 0.5, 'magic', { tag: 's3' }); return e.kind === 'hero' ? 'stop' : undefined; } }); });
            return;
          }
          const from = { x: u.x, y: u.y }, p = H.toward(u, ctx.pt, 4, false); m.dashTo(u, p.x, p.y, 16, {});
          m.addStatus(u, 'haste', 2, 0.25, { key: 'galo_flee' });
          m.zone({ owner: u, x: from.x, y: from.y, r: 2.2, life: 2, every: 0.25, kind: 'gas',
            tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => { if (e.kind === 'hero') mm.addStatus(e, 'blind', 0.5, 1, { src: u, key: 'galo_smoke' }); }, { noFx: true }) });
        },
        ai: { use: 'burst', range: 3.8, aim: 'away', alsoEscape: true, cond: (m, u) => beast(m, u) || !!(u.ai && u.ai.fleeing) },
      },
      sub: {
        name: 'Quá Liều! / Tiếng Hú Tử Thần', desc: 'Người: uống cạn bình độc hóa Quái Thú 15s — cận chiến, +15 giáp/kháng phép, +SMVL, +8% tốc chạy, lá chắn 100 (+20/cấp), chiêu không tốn máu và đổi bộ S1–S3; hết dạng: Vã Thuốc (chậm 30% 2s), hồi 40s. Thú: Tiếng Hú Tử Thần — sóng âm CHOÁNG diện rộng 1s (bán kính 3.5) và 40 (+10/cấp, +40% SMPT) sát thương phép (hồi 12s).',
        cd: 40,
        can(m, u) { return true; },
        use(m, u, ctx) {
          if (beast(m, u) && !H.T(u, '12a')) {   // Tiếng Hú Tử Thần
            m.hitCircle(u, u.x, u.y, 3.5, (e) => { m.damage(u, e, H.amt(u, 40 + 10 * u.level, 0, 0.4), 'magic', { tag: 'sub', aoe: true }); m.addStatus(e, 'stun', 1, 1, { src: u }); }, { color: '#9aff6a', fx: 'roar' });
            u.cd.sub = 12 * (1 - u.st.cdr); return;
          }
          if (H.T(u, '12a')) {   // Chimera: phun axit của dạng người
            const v = H.dirTo(u, ctx.pt);
            m.hitCone(u, u.x, u.y, v.x, v.y, 4, 0.55, (e) => { m.damage(u, e, H.amt(u, 40 + 10 * u.level, 0, 0.4), 'magic', { tag: 'sub', aoe: true }); poison(m, u, e, 2); }, { color: '#9aff6a' });
            u.cd.sub = 12 * (1 - u.st.cdr); return;
          }
          enterBeast(m, u, H.T(u, '1b') ? 20 : 15);
        },
        manualCd: false,
        ai: { use: 'burst', aim: 'self', range: 5, cond: (m, u, t) => (beast(m, u) && !H.T(u, '12a') ? t.kind === 'hero' && M.dist(u, t) < 3.3 + t.r : H.T(u, '12a') || t.kind === 'hero' || t.kind === 'monster') },
      },
      s4: {
        name: 'Đại Dịch / Thợ Săn Tối Thượng', desc: 'Người: sương độc bán kính 6 tại điểm trong 8 đv suốt 6s — kẻ địch bên trong lập tức đủ tầng tối đa, chậm 20%. Thú: 8s +40% tốc chạy, cú cắn kết liễu tướng dưới 15% máu.',
        cd: [120, 100, 80], castTime: 0.2,
        use(m, u, ctx) {
          if (beast(m, u)) {
            u.ws.hunt = m.time + 8; m.addStatus(u, 'haste', 8, 0.4, { key: 'galo_hunt' });
            if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#3a8a1a', life: 8 }); return;
          }
          if (H.T(u, '12b')) {   // Nổ Axit Hạt Nhân
            m.hitCircle(u, u.x, u.y, 4, (e) => { m.damage(u, e, H.amt(u, ctx.v([150, 250, 350]), 0, 0.7), 'magic', { tag: 's4', aoe: true }); const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 2.5, 0.25); poison(m, u, e, maxTx(u)); }, { color: '#9aff6a' });
            m.zone({ owner: u, x: u.x, y: u.y, r: 4, life: 15, every: 0.5, kind: 'acid', tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => { mm.damage(u, e, 8 + 2 * u.level, 'magic', { tag: 's4', aoe: true, noHook: true }); mm.addStatus(e, 'slow', 0.6, 0.2, { src: u, key: 'galo_pool' }); }, { noFx: true }) });
            return;
          }
          const p = H.toward(u, ctx.pt, 8, true), seen = new Set();
          m.zone({ owner: u, x: p.x, y: p.y, r: 6, life: 6, every: 0.5, kind: 'gas',
            tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => {
              if (!seen.has(e.id)) { seen.add(e.id); poison(mm, u, e, maxTx(u)); }
              mm.damage(u, e, H.amt(u, ctx.v([20, 30, 40]), 0, 0.12), 'magic', { tag: 's4', aoe: true });
              mm.addStatus(e, 'slow', 0.6, 0.2, { src: u, key: 'galo_plague' });
            }, { noFx: true }) });
          m.telegraph({ team: u.team, x: p.x, y: p.y, r: 6, life: 6, color: '#5ab02a' });
        },
        ai: { use: 'ult', aim: 'point', speed: 0, range: 8, aoe: 6 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 5, role: 'fighter' },
    tags: ['poke'],
  });
  G.HEROES.galo.tree = [
    [
      { name: 'Độc Ăn Da', desc: 'Sát thương độc mỗi tầng +35%.' },
      { name: 'Thú Tính Bền Bỉ', desc: 'Dạng Quái Thú kéo dài 20s (thay vì 15s).' },
      { name: 'Bước Chân Hóa Chất', desc: 'Dạng Thú để lại vệt axit làm chậm 25% kẻ đi qua.' },
    ],
    [
      { name: 'Sương Độc Thần Kinh', desc: 'Bom Khí Ngạt câm lặng tướng lần đầu bước vào 1s.' },
      { name: 'Hàm Răng Bạo Lực', desc: 'Ngoạm Cắn phá mọi lá chắn.' },
      { name: 'Giảm Sốc Độc Tố', desc: 'Không còn bị Vã Thuốc khi trở lại dạng Người.' },
    ],
    [
      { name: 'Quăng Quật', desc: 'Ngoạm Cắn trúng tướng: trong 2s dùng lại để tóm đập xuống, choáng 1s.' },
      { name: 'Phun Axit', desc: 'Ném Lọ Độc thành phun axit hình nón 4 đv: quét sạch đạn phía trước, găm 2 tầng.' },
      { name: 'Hấp Thu Độc Chất', desc: 'Đứng trong vũng khí độc của mình hồi 2% máu tối đa mỗi giây.' },
    ],
    [
      { name: 'Axit Hóa Lỏng Xương', desc: 'Tiêu Xương tối đa 10 tầng (giảm tới 40% giáp/kháng phép).' },
      { name: 'Tiếng Rống Tận Diệt', desc: 'Hống Xung Phong hất bay đạn xung quanh và choáng 1.25s (thay vì làm chậm).' },
      { name: 'Bản Năng Bất Tử', desc: 'Dạng Thú nhận đòn chí tử: sống lại 1 máu kèm lá chắn 200 (+20/cấp), 1 lần mỗi mạng.' },
    ],
    [
      { name: 'Chimera Bất Hoại', desc: 'Kẹt vĩnh viễn ở dạng Quái Thú (giữ trí khôn); Quá Liều thành phun axit hình nón 4 đv (HC 12s).' },
      { name: 'Nổ Axit Hạt Nhân', desc: 'Đại Dịch (dạng Người) thay bằng tự nổ: đẩy lùi 2.5 đv bán kính 4, găm đủ tầng, để lại bãi axit 15s.' },
      { name: 'Cuồng Huyết Độc Dược', desc: 'Hạ gục tướng đang trúng độc: giảm 40s hồi chiêu S4.' },
    ],
  ];
})();
