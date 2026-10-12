'use strict';
// ===== Diệp Thanh Phong — Thiết Phiến • Đường giữa / Hỗ trợ • khống chế gió, ru ngủ • KHÔNG MANA (Thước Gió) • phép =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const MIST = 'tp_mist';
  const state = (u) => (H.T(u, '12a') ? 'nghich' : u.ws.wind <= 35 ? 'thuan' : u.ws.wind >= 65 ? 'nghich' : 'bao');
  function wind(u, d) { if (!H.T(u, '12a')) u.ws.wind = Math.max(0, Math.min(100, u.ws.wind + d)); }
  // Gió Mê (Bão Hòa): 3 tầng thì ngủ 1s
  function mist(m, u, e) {
    if (state(u) !== 'bao' || !e.alive || e.kind !== 'hero') return;
    const s = m.addStatus(e, 'mark', 4, 1, { key: MIST, src: u, stack: 'add', max: 3 });
    if (s && s.n >= 3 && H.ready(m, u, 'mist' + e.id, 8)) { m.removeStatus(e, 'mark', MIST); m.addStatus(e, 'sleep', 1, 1.2, { src: u }); }
  }
  const behind = (t, d) => ({ x: t.x - t.fx * (t.r + d), y: t.y - t.fy * (t.r + d) });
  const W = 17.5;
  // đổi gió rồi trả về DẠNG HIỆU ỨNG của chiêu: đang ở dạng cực (Thuận / Nghịch) thì giữ hiệu ứng dạng đó (vd S1 ở Nghịch vẫn lướt theo lốc);
  // dùng ở Bão Hòa thì hiệu ứng theo dạng MỚI sau khi đổi (50 → S2 → 67.5 Nghịch: đâm sau lưng ngay; 50 → S1 → 32.5 Thuận: vực xoáy ngay)
  function shift(u, d) { const pre = state(u); wind(u, d); return pre === 'bao' ? state(u) : pre; }                                                    // GĐ13: S1 kéo −17.5, S2 đẩy +17.5 (50 → 32.5 Thuận / 67.5 Nghịch bằng 1 chiêu)
  // dạng gió → tầm đánh / cận-xa: Thuận 4.8 • Bão Hòa 6.0 • Nghịch 1.8 (cận chiến)
  const FORM = { thuan: { range: 0, ranged: true }, bao: { range: 1.2, ranged: true }, nghich: { range: -3.0, ranged: false } };
  function applyForm(m, u) {
    const st = state(u), F = FORM[st];
    if (u.ws.form !== st) { u.ws.form = st; u.ranged = F.ranged; if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: st === 'nghich' ? '#ff9a7a' : st === 'thuan' ? '#9fe8ff' : '#bfffe0', life: 0.5 }); }
    if (F.range) m.addStatus(u, 'buff', 0.3, 1, { key: 'tp_form', mods: { range: F.range } });
  }
  // lốc nhỏ hất tung (đòn đánh Bão Hòa mỗi 5s, Nghịch Chuyển ném lốc)
  function gust(m, u, dir, o) {
    return m.proj({ owner: u, x: u.x, y: u.y, dx: dir.x, dy: dir.y, speed: o.speed || 15, range: o.range || 6, r: o.r || 0.55, pierce: true, kind: 'tornado',
      onHit: (mm, p, e) => { mm.damage(u, e, o.dmg, 'magic', { tag: o.tag || 'p' }); mm.knockup(u, e, o.up || 0.5); } });
  }
  const rot = (v, a) => ({ x: v.x * M.cos(a) - v.y * M.sin(a), y: v.x * M.sin(a) + v.y * M.cos(a) });
  H.def({
    id: 'thanhphong', name: 'Diệp Thanh Phong', color: '#7ad0b0', gfx: 'fan', kit: 'mage', pos: ['mid', 'sup'], dmgType: 'magic',
    ranged: true, projSpeed: 18, projKind: 'tornado', r: 0.58, resource: 'none',
    stats: { range: 4.8, hp: 560, hpG: 88, armor: 24, ms: 3.45 },
    passive: {
      name: 'Khí Áp Phong Vũ',
      desc: 'Thước Gió 0–100 (S1 kéo −17.5, S2 đẩy +17.5). Thuận (≤35): +15% tốc chạy, Giáp Phong Hộ chặn trọn 1 đòn mỗi 10s, đánh thường tầm 4.8 làm chậm 20% 1s • Bão Hòa (36–64): đòn đánh và chiêu găm Gió Mê, 3 tầng thì ngủ 1s; tầm đánh 6.0; mỗi 5s đòn đánh kế tiếp phóng 3 luồng lốc hất tung 0.5s • Nghịch (≥65): +20% sát thương, thành CẬN CHIẾN (tầm 1.8); mỗi 5s đòn đánh kế tiếp là cú Đột Kích lướt tới mục tiêu gây sát thương phép bộc phá.',
      init(m, u) { u.ws.wind = 50; u.ws.guard = 0; u.ws.raidT = 0; u.ws.form = null; },
      respawn(m, u) { u.ws.form = null; u.ranged = true; },
      update(m, u) {
        const st = state(u);
        applyForm(m, u);
        if (st === 'thuan' && m.tick % 10 === 0) m.addStatus(u, 'haste', 0.6, H.T(u, '1a') ? 0.25 : 0.15, { key: 'tp_thuan' });
        if (st === 'bao' && H.T(u, '9c') && m.tick % 10 === 0) { u.anchorT = m.time + 0.6; m.addStatus(u, 'reduce', 0.6, 0.15, { key: 'tp_tam' }); }
        // Nghịch: Đột Kích — mục tiêu đang đánh ở 2.5–5.5 đv → lướt tới chém bộc phá (mỗi 5s)
        if (st === 'nghich' && m.time >= (u.ws.raidT || 0) && !u.cast && !u.dash && !u.disabled) {
          const t = u.attackTarget; if (!t || !t.alive || t.team === u.team) return;
          const d = M.dist(u, t) - u.r - t.r; if (d < 1.4 || d > 5.5) return;
          u.ws.raidT = m.time + 5;
          const v = H.dirTo(u, t), end = { x: t.x - v.x * (t.r + u.r + 0.2), y: t.y - v.y * (t.r + u.r + 0.2) };
          m.dashTo(u, end.x, end.y, 22, { onEnd: (mm) => { if (t.alive) { mm.damage(u, t, H.amt(u, 50 + 14 * u.level, 0.3, 0.7), 'magic', { tag: 'raid' }); if (mm.fxOn) mm.fx({ type: 'burst', x: t.x, y: t.y, color: '#ff9a7a' }); } } });
          u.stats.tpRaid = (u.stats.tpRaid || 0) + 1;
        }
      },
      onAuto(m, u, t, info) {
        const st = state(u);
        info.type = 'magic'; info.amt = u.st.ad + u.st.ap * 0.3;
        if (st === 'thuan') info.extra.push(() => t.alive && m.addStatus(t, 'slow', 1, 0.2, { src: u, key: 'tp_slow' }));
        else if (st === 'bao' && H.ready(m, u, 'baoAuto', 5)) {
          const v = H.dirTo(u, t), dmg = H.amt(u, 25 + 8 * u.level, 0, 0.35);
          info.extra.push(() => { for (const a of [-0.3, 0, 0.3]) gust(m, u, rot(v, a), { dmg, up: 0.5, range: 6.5, tag: 'auto' }); });
        } else if (st === 'nghich' && m.time >= (u.ws.raidT || 0)) {   // đang sát mục tiêu: Đột Kích thành nhát chém tại chỗ
          u.ws.raidT = m.time + 5; info.amt += H.amt(u, 50 + 14 * u.level, 0.3, 0.7);
        }
      },
      onDeal(m, u, t, info) { if (state(u) === 'nghich') info.amt *= H.T(u, '1b') ? 1.3 : 1.2; },
      afterDeal(m, u, t, info) { if (info.auto || G.ITEM_IS_SKILL(info)) mist(m, u, t); },
      onTake(m, u, att, info) {
        if (state(u) !== 'thuan' || !att || att.team === u.team || att.kind === 'tower') return;
        if (!H.ready(m, u, 'phongho', H.T(u, '1c') ? 7 : 10)) return;
        info.amt = 0; if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#bfffe0', life: 0.4 });
      },
      onKill(m, u, v) { if (H.T(u, '12c') && v.kind === 'hero' && m.time - (v.ws && v.ws.sleptT || -99) < 3) u.cd.s4 = (u.cd.s4 || 0) * 0.5; },
    },
    skills: {
      s1: {
        name: 'Toàn Phong Quy', desc: 'Lốc xoáy thẳng 7 đv (gió −17.5). Thuận: lốc lớn, cuối đường thành Vực Xoáy giữ chân 1.5s + sát thương liên tục • Bão Hòa: lướt nhẹ 1.5 đv, lốc bay nhanh hơn 40%, hất tung • Nghịch: Thanh Phong lướt theo lốc áp sát, chém bồi sát thương phép.',
        cd: [7, 6.5, 6, 5.5, 5], castTime: 0.15,
        use(m, u, ctx) {
          const st = shift(u, -W);
          const v = H.dirTo(u, ctx.pt), dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0, 0.6);
          if (H.T(u, '6b')) {   // Phiến Khí Bát Đoạn: 5 luồng khí
            for (const a of [-0.5, -0.25, 0, 0.25, 0.5]) { const c = M.cos(a), s = M.sin(a); m.proj({ owner: u, x: u.x, y: u.y, dx: v.x * c - v.y * s, dy: v.x * s + v.y * c, speed: 20, range: 6, r: 0.4, kind: 'tornado', onHit: (mm, p, e) => { mm.damage(u, e, dmg * 0.6, 'magic', { tag: 's1' }); mm.addStatus(e, 'slow', 1.5, 0.3, { src: u }); } }); }
            return;
          }
          if (st === 'bao') m.dashTo(u, u.x + v.x * 1.5, u.y + v.y * 1.5, 16, {});
          let hitHero = false, slashed = false;
          const end = { x: u.x + v.x * 7, y: u.y + v.y * 7 };
          H.shoot(m, u, end, { speed: st === 'bao' ? 22.4 : 16, range: 7, r: st === 'thuan' ? 1.15 : 0.8, pierce: true, kind: 'tornado',
            onHit: (mm, p, e) => {
              mm.damage(u, e, dmg, 'magic', { tag: 's1' }); if (st !== 'thuan') mm.knockup(u, e, 0.6); if (e.kind === 'hero') hitHero = true;
              if (st === 'nghich' && !slashed && e.kind === 'hero') { slashed = true; mm.later(0.15, (m3) => { if (e.alive && u.alive && M.dist(u, e) < 3) { m3.damage(u, e, dmg * 0.5, 'magic', { tag: 's1' }); if (m3.fxOn) m3.fx({ type: 'slash', x: e.x, y: e.y, color: '#ff9a7a' }); } }); }
            },
            onEnd: (mm, p) => {
              if (st === 'thuan') {
                const hold = H.T(u, '3b') ? 2 : 1.5, pull = H.T(u, '3b') ? 1.2 : 0.6;
                mm.zone({ owner: u, x: p.x, y: p.y, r: 2.4, life: hold, every: 0.25, kind: 'wind', tick: (m3, z) => m3.hitCircle(u, z.x, z.y, z.r, (e) => {
                  m3.addStatus(e, 'root', 0.3, 1, { src: u }); const w = H.dirTo(e, z), d = M.dist(e, z); if (d > 0.4) m3.knock(u, e, w.x, w.y, Math.min(pull * 0.25, d), 0.1);
                  m3.damage(u, e, dmg * 0.08, 'magic', { tag: 's1', aoe: true, noHook: true });
                }, { noFx: true }) });
              }
              if (H.T(u, '9b') && st === 'nghich' && hitHero && H.ready(mm, u, 'lgvh', 6)) u.cd.s1 = 0;
            } });
          if (st === 'nghich') m.dashTo(u, u.x + v.x * 6, u.y + v.y * 6, 18, {});
        },
        ai: { use: 'poke', range: 6.6, aim: 'point', speed: 16, farm: 3 },
      },
      s2: {
        name: 'Bát Diện Phong Trận', desc: 'Sóng gió 360° bán kính 3 (gió +17.5). Thuận: đẩy lùi 4 đv + Màng Chắn Gió 3s chặn 100% đạn đạo • Bão Hòa: lướt nhẹ 1.5 đv, kẻ bị đẩy đập vật cản / hết tầm đẩy thì choáng 1s • Nghịch: phóng lưỡi gió rồi dịch chuyển ra sau lưng tướng gần nhất đâm chí mạng ×1.5.',
        cd: [10, 9.5, 9, 8.5, 8], castTime: 0.1,
        use(m, u, ctx) {
          const st = shift(u, W);
          const dmg = H.amt(u, ctx.v([55, 85, 115, 145, 175]), 0, 0.5);
          if (st === 'bao') { const v = H.dirTo(u, ctx.pt || { x: u.x + u.fx, y: u.y + u.fy }); m.dashTo(u, u.x + v.x * 1.5, u.y + v.y * 1.5, 18, {}); }
          const push = st === 'thuan' ? 4 : 2.2;
          m.hitCircle(u, u.x, u.y, 3, (e) => {
            m.damage(u, e, dmg, 'magic', { tag: 's2', aoe: true }); const v = H.dirTo(u, e);
            if (st === 'bao') { let hit = false; m.knock(u, e, v.x, v.y, push, 0.25, { onWall: (mm, t) => { hit = true; mm.addStatus(t, 'stun', 1, 1, { src: u }); } }); m.later(0.27, (mm) => { if (!hit && e.alive) mm.addStatus(e, 'stun', 1, 1, { src: u }); }); }
            else m.knock(u, e, v.x, v.y, push, st === 'thuan' ? 0.35 : 0.2);
          }, { color: '#bfffe0' });
          if (st === 'thuan') {
            m.zone({ owner: u, x: u.x, y: u.y, r: 3, life: 3, every: 0.1, follow: u, kind: 'barrier', tick: (mm, z) => {
              for (const p of mm.projs) if (!p.dead && p.team !== u.team && M.dist(p, z) < z.r) {
                p.dead = true;
                if (H.T(u, '3c') && p.owner && p.owner.alive && p.owner.kind === 'hero') mm.damage(u, p.owner, 40 + 8 * u.level, 'magic', { tag: 'p', noHook: true });
              }
            } });
          } else if (st === 'nghich') {
            const t = H.nearestEnemyHero(m, u, 7);
            if (t) {
              H.shoot(m, u, t, { speed: 26, range: 7.5, r: 0.45, kind: 'tornado', onHit: (mm, p, e) => mm.damage(u, e, dmg * 0.4, 'magic', { tag: 's2' }) });   // lưỡi gió
              m.later(0.25, (mm) => {
                if (!t.alive || !u.alive) return;
                const bp = behind(t, 0.9); mm.blink(u, bp.x, bp.y); u.face(t.x, t.y);
                mm.damage(u, t, dmg * 1.5, 'magic', { tag: 's2', crit: true });
                if (H.T(u, '6a')) mm.allowRecast(u, 's2', 1.5, (m3, u3) => m3.hitCircle(u3, u3.x, u3.y, 2.5, (e) => m3.knockup(u3, e, 0.75), { color: '#bfffe0' }));
              });
            }
          }
        },
        ai: { use: 'burst', range: 3, aim: 'self', alsoEscape: true },
      },
      s3: {
        name: 'Mê Tung Phong Vực', desc: 'Không đổi gió. Thuận: hút kẻ địch vào tâm, vùng gió độc 5.6 đv tồn tại 5s gây Mù + Câm lặng • Bão Hòa: lướt 4 đv và tàng hình 1.5s, để lại cơn lốc hất tung ở điểm cuối • Nghịch: lướt xa 6 đv gây sát thương trên đường, điểm cuối Thiên Lôi Phong giáng xuống bộc phá.',
        cd: [15, 14, 13, 12, 11], castTime: 0.05,
        use(m, u, ctx) {
          const st = state(u), dmg = H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0, 0.5);
          if (st === 'thuan') {
            const c = { x: u.x, y: u.y }, seen = new Set(), R = 5.6;
            m.hitCircle(u, c.x, c.y, R, (e) => { const w = H.dirTo(e, c), d = M.dist(e, c); if (d > 1) m.knock(u, e, w.x, w.y, Math.min(d - 0.8, 3.5), 0.3); }, { color: '#9fe8b0' });
            m.zone({ owner: u, x: c.x, y: c.y, r: R, life: 5, every: 0.25, kind: 'gas', tick: (mm, z) => mm.hitCircle(u, z.x, z.y, z.r, (e) => {
              if (!seen.has(e.id)) { seen.add(e.id); mm.addStatus(e, 'blind', 1.25, 1, { src: u }); if (e.kind === 'hero') mm.addStatus(e, 'silence', 1.25, 1, { src: u }); }
              if (H.T(u, '3a') && e.has('blind') && mm.tick % 10 === 0) mm.damage(u, e, H.amt(u, 10 + 3 * u.level, 0, 0.1), 'magic', { tag: 's3', aoe: true });
            }, { noFx: true }) });
            const p = H.toward(u, ctx.pt, 2, false); m.dashTo(u, p.x, p.y, 16, {});
          } else if (st === 'bao') {
            m.addStatus(u, 'stealth', 1.5, 1, { key: 'tp_s3' });
            const p = H.toward(u, ctx.pt, 4, false);
            m.dashTo(u, p.x, p.y, 16, { onEnd: (mm) => { const hit = new Set(); mm.zone({ owner: u, x: u.x, y: u.y, r: 2, life: 1.2, every: 0.2, kind: 'wind', tick: (m3, z) => m3.hitCircle(u, z.x, z.y, z.r, (e) => { if (hit.has(e.id)) return; hit.add(e.id); m3.knockup(u, e, 0.75); m3.damage(u, e, dmg * 0.6, 'magic', { tag: 's3', aoe: true }); }, { noFx: true }) }); } });
          } else {
            const v = H.dirTo(u, ctx.pt), p = H.toward(u, ctx.pt, 6, false), sx = u.x, sy = u.y;
            m.hitLine(u, sx, sy, v.x, v.y, 6, 1.2, (e) => m.damage(u, e, dmg * 0.6, 'magic', { tag: 's3', aoe: true }));
            m.dashTo(u, p.x, p.y, 20, { onEnd: (mm) => {
              const c = { x: u.x + v.x * 0.5, y: u.y + v.y * 0.5 };
              mm.telegraph({ team: u.team, x: c.x, y: c.y, r: 2.2, life: 0.35, color: '#ffe08a' });
              mm.later(0.35, (m3) => m3.hitCircle(u, c.x, c.y, 2.2, (e) => m3.damage(u, e, dmg * 1.4, 'magic', { tag: 's3', aoe: true }), { color: '#ffe08a' }));
            } });
          }
        },
        ai: { use: 'escape', range: 4, aim: 'away', alsoEngage: true },
      },
      sub: {
        name: 'Nghịch Chuyển Canh Khí', desc: 'Hồi 12s — làm mới ngay S1, S2, S3. Thuận → Nghịch: lốc từ trời giáng xuống kẻ địch gần nhất (sát thương lớn) + lướt tới trước • Bão Hòa: kích nổ khí áp đẩy lùi 2 đv + Thanh Tẩy mọi khống chế • Nghịch → Thuận: lướt lùi ra xa, ném lốc hất tung, nhận khiên bảo hộ.',
        cd: 12,
        can(m, u) { return !H.T(u, '12a'); },
        use(m, u, ctx) {
          const st = state(u), dmg = H.amt(u, 60 + 14 * u.level, 0, 0.6);
          if (st === 'bao') {
            m.cleanse(u);
            m.hitCircle(u, u.x, u.y, 3, (e) => { const v = H.dirTo(u, e); m.knock(u, e, v.x, v.y, 2, 0.2); m.damage(u, e, dmg * 0.5, 'magic', { tag: 'sub', aoe: true }); }, { color: '#bfffe0' });
          } else if (st === 'thuan') {
            const t = H.nearestEnemyHero(m, u, 8), c = t ? { x: t.x, y: t.y } : { x: u.x + u.fx * 3, y: u.y + u.fy * 3 };
            m.telegraph({ team: u.team, x: c.x, y: c.y, r: 2, life: 0.3, color: '#bfffe0' });
            m.later(0.3, (mm) => mm.hitCircle(u, c.x, c.y, 2, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 'sub', aoe: true }); mm.knockup(u, e, 0.5); }, { color: '#bfffe0' }));
            const v = H.dirTo(u, c); m.dashTo(u, u.x + v.x * 3, u.y + v.y * 3, 18, {});
            u.ws.wind = 100 - u.ws.wind;
          } else {
            const t = H.nearestEnemyHero(m, u, 8), v = t ? H.dirTo(t, u) : { x: -u.fx, y: -u.fy };
            m.dashTo(u, u.x + v.x * 4, u.y + v.y * 4, 18, {});
            if (t) gust(m, u, { x: -v.x, y: -v.y }, { dmg: dmg * 0.6, up: 0.75, range: 8, speed: 16, tag: 'sub' });
            m.shield(u, u, u.st.maxHp * 0.15, 3);
            u.ws.wind = 100 - u.ws.wind;
          }
          for (const k of ['s1', 's2', 's3']) u.cd[k] = 0;              // làm mới bộ chiêu
          if (H.T(u, '6c')) m.heal(u, u, u.st.maxHp * 0.08);
        },
        ai: { use: 'defend', aim: 'self', range: 7, alsoEscape: true, cond: (m, u) => !!G.TPAI && G.TPAI.subOk(m, u) },
      },
      s4: {
        name: 'Cơn Gió Đưa Giấc', desc: 'Vùng bão bán kính 4.5 tại điểm trong 9 đv suốt 5s: chậm 50%; đứng trong vùng quá 2s thì ngủ 1.5s; đòn đầu tiên đánh thức gây ×1.5.',
        cd: [120, 100, 80], castTime: 0.2,
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 9, true), stay = {}, slept = new Set();
          const T = H.T(u, '9a') ? 2.5 : 1.5, amp = H.T(u, '9a') ? 2 : 1.5;
          // Long Quyển Phong Bạo: vòi rồng ở tâm hất tung kẻ yếu
          if (H.T(u, '12b')) m.hitCircle(u, p.x, p.y, 2, (e) => { if (e.hpPct < 0.6) m.knockup(u, e, 1.5); }, { color: '#bfffe0' });
          m.zone({ owner: u, x: p.x, y: p.y, r: 4.5, life: 5, every: 0.25, kind: 'storm', tick: (mm, z) => {
            const inside = new Set();
            mm.hitCircle(u, z.x, z.y, z.r, (e) => {
              inside.add(e.id);
              mm.addStatus(e, 'slow', 0.4, 0.5, { src: u, key: 'tp_storm' });
              if (e.kind !== 'hero') return;
              stay[e.id] = (stay[e.id] || 0) + 0.25;
              if (stay[e.id] >= 2 && !slept.has(e.id)) { slept.add(e.id); mm.addStatus(e, 'sleep', T, amp, { src: u }); e.ws && (e.ws.sleptT = mm.time + T); }
              if (mm.tick % 20 === 0) mm.damage(u, e, H.amt(u, ctx.v([25, 40, 55]), 0, 0.15), 'magic', { tag: 's4', aoe: true, noHook: true });
            }, { noFx: true });
            for (const k in stay) if (!inside.has(+k)) stay[k] = 0;
          } });
          m.telegraph({ team: u.team, x: p.x, y: p.y, r: 4.5, life: 5, color: '#7ad0b0' });
        },
        ai: { use: 'ult', aim: 'point', speed: 0, range: 9, aoe: 4.5, minTargets: 2 },
      },
    },
    // GĐ13: bộ não Thước Gió (src/sim/ai/tp_ai.js) — chọn dạng gió theo mục tiêu, combo Ám Sát / Thả Diều / Ru Ngủ / Lục Phong
    ai: { order: ['s1', 's2', 's3'], engageRange: 6, role: 'mage', fight: (ai, t, enemies, allies) => !!G.TPAI && G.TPAI.fight(ai, t, enemies, allies) },
    tags: ['cc'],
  });
  G.HEROES.thanhphong.windState = state;
  G.HEROES.thanhphong.tree = [
    [
      { name: 'Khí Lưu Thuận Chiều', desc: 'Thuận: +25% tốc chạy (thay vì 15%).' },
      { name: 'Cắt Gió Tàn Bạo', desc: 'Nghịch: +30% sát thương (thay vì 20%).' },
      { name: 'Phong Hộ Tái Sinh', desc: 'Giáp Phong Hộ hồi 7s (thay vì 10s).' },
    ],
    [
      { name: 'Phong Độc Hôn Mê', desc: 'Vùng Mê Tung gây sát thương liên tục lên kẻ đang bị mù.' },
      { name: 'Kình Phong Xuyên Thấu', desc: 'Vực xoáy của Toàn Phong Quy (Thuận) hút mạnh gấp đôi và giữ 2s.' },
      { name: 'Bão Thuẫn Phản Hồi', desc: 'Màng chắn của Bát Diện (Thuận) dội ngược: mỗi viên đạn bị chặn gây 40 (+8/cấp) sát thương phép lên kẻ bắn.' },
    ],
    [
      { name: 'Lốc Xoáy Kép', desc: 'Sau cú đâm sau lưng (Bát Diện Nghịch), trong 1.5s dùng lại: xoay quạt hất tung 0.75s quanh mình.' },
      { name: 'Phiến Khí Bát Đoạn', desc: 'Toàn Phong Quy thay bằng 5 luồng khí rẻ quạt, làm chậm 30% (không đổi gió theo trạng thái).' },
      { name: 'Hơi Thở Của Gió', desc: 'Mỗi lần dùng Nghịch Chuyển Canh Khí hồi 8% máu tối đa.' },
    ],
    [
      { name: 'Giấc Mộng Không Đáy', desc: 'Ngủ của Cơn Gió Đưa Giấc kéo dài 2.5s; đòn đánh thức ×2.' },
      { name: 'Lướt Gió Vô Hạn', desc: 'Toàn Phong Quy ở Nghịch trúng tướng: hồi ngay (6s).' },
      { name: 'Tâm Bão Bất Khả Xâm Phạm', desc: 'Ở Bão Hòa: miễn nhiễm đẩy lùi và giảm 15% sát thương nhận.' },
    ],
    [
      { name: 'Tuyệt Ảnh Ám Sát', desc: 'Khóa thước gió ở Nghịch vĩnh viễn (luôn +sát thương, Bát Diện luôn đâm sau lưng); mất Nghịch Chuyển Canh Khí.' },
      { name: 'Long Quyển Phong Bạo', desc: 'Cơn Gió Đưa Giấc thêm vòi rồng ở tâm: hất tung 1.5s kẻ dưới 60% máu.' },
      { name: 'Lời Ru Vĩnh Cửu', desc: 'Hạ gục tướng vừa ngủ trong 3s: hồi chiêu S4 giảm một nửa.' },
    ],
  ];
})();
