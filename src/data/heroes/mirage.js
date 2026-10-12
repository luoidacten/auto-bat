'use strict';
// ===== Mirage — Ảo Mộng Tiên Tri • pháp sư / sát thủ đánh lừa • Náo Nhiệt (thay mana) • phép =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  function hype(u, v) { u.ws.nn = Math.max(0, Math.min(100, u.ws.nn + v)); }
  function spend(u, v) { if (u.ws.nn < v) return false; u.ws.nn -= v; return true; }
  const ultLearned = (u) => (u.ranks && u.ranks.s4 > 0);
  function illusion(m, u, x, y, o) {
    o = o || {};
    const keep = 6, mine = m.decoysOf(u).filter((d) => !d.perfect);
    while (mine.length >= keep) { const d = mine.shift(); d.alive = false; }
    const dmg = ultLearned(u) ? (H.T(u, '6a') ? 0.6 : 0.35) : 0;
    const d = m.makeDecoy(u, x, y, { life: o.life || 6, hp: (o.hp || 0.35) * (H.T(u, '1c') ? 1.5 : 1), runTo: o.runTo || null, dmg });
    return d;
  }
  // Ảo Ấn: đòn kế tiếp kích nổ thêm 6% máu tối đa
  function popMark(m, u, t) {
    const s = t.statuses.length && t.hasKey('mir_mark'); if (!s) return;
    m.removeStatus(t, 'mark', 'mir_mark');
    m.damage(u, t, t.st.maxHp * 0.06, 'magic', { tag: 'p' });
    if (H.T(u, '9c')) { u.cd.s1 = Math.max(0, (u.cd.s1 || 0) - 1); u.cd.s2 = Math.max(0, (u.cd.s2 || 0) - 1); }
  }
  function burstMarks(m, u, k) {
    const L = u.ws.drift || []; u.ws.drift = [];
    for (const r of L) { const e = r.e; if (!e.alive) continue; const took = Math.max(0, r.hp - (e.hp + (e.ga || 0))); if (took > 0) m.damage(u, e, took * 0.4 * (k || 1), 'magic', { tag: 's1', byp: H.T(u, '6c') ? 0.5 : 0 }); }
  }
  function perfectDouble(m, u, x, y, dmg) {
    const d = m.makeDecoy(u, x, y, { life: 15, hp: 1, dmg: H.T(u, '6a') ? 0.6 : 0.35,
      onDeath: (mm, dd) => mm.hitCircle(u, dd.x, dd.y, 4, (e) => { mm.damage(u, e, dmg * (H.T(u, '9a') ? 1.5 : 1), 'magic', { tag: 's4', aoe: true }); mm.addStatus(e, 'stun', 1.5, 1, { src: u }); if (H.T(u, '9a')) mm.addStatus(e, 'nodash', 3, 1, { src: u }); }, { color: '#c9a0ff' }),
      onExpire: (mm, dd) => mm.hitCircle(u, dd.x, dd.y, 4, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's4', aoe: true }); mm.addStatus(e, 'stun', 1.5, 1, { src: u }); }, { color: '#c9a0ff' }) });
    d.perfect = true; d.runTo = null;
    // GĐ12: Phân Thân Hoàn Hảo mang theo TRANG BỊ & MẢNH HỒN của Mirage (chép toàn bộ chỉ số cộng thêm) và tự dùng chiêu
    Object.assign(d.bonus, u.bonus); d.base.ad = u.st.ad * (H.T(u, '6a') ? 0.6 : 0.35); d.base.ap = u.st.ap; d.calc(); d.hp = d.st.maxHp;
    d.items = u.items; d.shOn = u.shOn; d.yNiem = u.yNiem;
    d.skT = m.time + 1.2;
    d.petTick = (mm, dd) => {
      if (mm.time < dd.skT || !dd.alive) return;
      const e = H.nearestEnemyHero(mm, dd, 9); if (!e) return;
      dd.skT = mm.time + 2.6;
      const k = (dd.skN = (dd.skN || 0) + 1) % 3, sd = H.amt(u, 50 + 12 * u.level, 0, 0.45);
      if (k === 0 && M.dist(dd, e) < 5) {          // bản sao Hộp Tử Thần thu nhỏ
        const x = e.x, y = e.y; mm.telegraph({ x, y, r: 2.5, life: 1.2, team: u.team });
        mm.later(1.2, (m3) => m3.hitCircle(u, x, y, 2.5, (v) => { m3.damage(u, v, sd * 1.4, 'magic', { tag: 's4', aoe: true }); m3.addStatus(v, 'stun', 0.5, 1, { src: u }); }, { color: '#c9a0ff' }));
      } else H.shoot(mm, dd, e, { speed: 24, range: 9, r: 0.4, kind: 'mirror', hitMinions: false, onHit: (m3, p, v) => { m3.damage(u, v, sd, 'magic', { tag: 's4' }); if (v.alive) m3.addStatus(v, 'mark', 5, 1, { key: 'mir_mark', src: u }); } });
      dd.stats = dd.stats || {}; u.stats.dblSkill = (u.stats.dblSkill || 0) + 1;
    };
    return d;
  }
  H.def({
    id: 'mirage', name: 'Mirage', color: '#c9a0ff', gfx: 'wand', kit: 'mage', pos: ['mid'], dmgType: 'magic',
    ranged: true, projSpeed: 20, projKind: 'mirror', r: 0.56, resource: 'none',
    stats: { range: 5.2, hp: 550, hpG: 86, armor: 24, armorG: 3.6, mr: 30, mrG: 1.4, ms: 3.45 },
    gauge: (u) => ({ v: u.ws.nn || 0, max: 100, label: 'Náo Nhiệt', color: '#e0b0ff' }),
    passive: {
      name: 'Hiện Diện Náo Nhiệt • Đại Thoát Hiểm • Đòn Đánh Ảo Ấn',
      desc: 'Chiêu tốn Náo Nhiệt (thay mana) — chỉ cần có mặt trên sàn đấu là +4 Náo Nhiệt mỗi giây (+50% khi ở gần Alice / Luca). Dưới 25% máu (120s): tàng hình 2.5s, dịch chuyển 5 đv, để lại 4 phân ảnh chạy toán loạn. Đánh thường gây sát thương phép và găm Ảo Ấn 5s; đòn / chiêu kế tiếp kích nổ thêm 6% máu tối đa.',
      init(m, u) { u.ws.nn = 40; u.ws.vanishT = 0; u.ws.drift = []; u.ws.swapT = 0; u.ws.doubles = []; },
      update(m, u) {
        // Tàn Ảnh: găm dấu ấn kẻ đi xuyên qua
        if (u.ws.driftUntil > m.time) for (const e of m.enemiesIn(u.team, u.x, u.y, u.r + 1, { heroesOnly: true })) if (!u.ws.drift.some((r) => r.e === e)) u.ws.drift.push({ e, hp: e.hp + (e.ga || 0) });
        if (u.ws.driftUntil && u.ws.driftUntil <= m.time) { u.ws.driftUntil = 0; burstMarks(m, u); }
        if (m.tick % 10 !== 0) return;
        const pals = m.heroes.some((h) => h.alive && (h.heroId === 'alice' || h.heroId === 'luca') && M.dist(h, u) < 15);
        hype(u, (H.T(u, '1a') ? 6 : 4) * (pals ? 1.5 : 1) * 0.5);
        // Đại Thoát Hiểm
        if (u.hpPct < 0.25 && m.time >= u.ws.vanishT && m.time - (u.lastDmgT || -99) < 1.5) {
          u.ws.vanishT = m.time + (H.T(u, '6b') ? 80 : 120);
          const from = { x: u.x, y: u.y }, a = m.rng.next() * 6.283;
          m.addStatus(u, 'stealth', 2.5, 1, { key: 'mir_vanish' });
          m.blink(u, u.x + M.cos(a) * 5, u.y + M.sin(a) * 5);
          for (let i = 0; i < 4; i++) illusion(m, u, from.x, from.y, { life: 3, runTo: { x: from.x + [9, -9, 0, 0][i], y: from.y + [0, 0, 9, -9][i] } });
          if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🎩 Ngươi đang nhìn đi đâu thế?', color: '#e0b0ff' });
        }
        u.ws.doubles = u.ws.doubles.filter((d) => d.alive);
        // Ván Cược Cứu Rỗi: học trò bị hạ → hấp thụ Ý Niệm
        if (H.T(u, '12b') && !u.ws.saved) { const s = m.heroes.find((h) => (h.heroId === 'alice' || h.heroId === 'luca') && !h.alive && h.out); if (s) { u.ws.saved = true; m.addStatus(u, 'buff', 99999, 1, { key: 'mir_saved', mods: { ap: u.st.ap * 0.3 } }); for (const k of ['s1', 's2', 's3', 's4', 'sub']) u.cd[k] = 0; } }
      },
      onAuto(m, u, t, info) {
        info.type = 'magic'; info.amt = u.st.ad * 0.6 + u.st.ap * 0.4;
        if (u.ws.driftUntil > m.time) { m.removeStatus(u, 'untarget', 'mir_drift'); }   // đánh thường thì lộ khỏi Tàn Ảnh
        info.extra.push(() => { popMark(m, u, t); if (t.alive) m.addStatus(t, 'mark', 5, 1, { key: 'mir_mark', src: u }); });
      },
      afterDeal(m, u, t, info) { if (G.ITEM_IS_SKILL(info) && info.tag !== 'p' && t.kind === 'hero') popMark(m, u, t); },
    },
    skills: {
      s1: {
        name: 'Tàn Ảnh Lướt Xuyên', desc: 'Tốn 20 Náo Nhiệt: vào trạng thái Tàn Ảnh 2s (không thể bị chọn, +35% tốc chạy), lướt 3 đv và để lại ảo ảnh tĩnh ở điểm xuất phát. Kẻ địch bị lướt xuyên qua bị găm Dấu Ấn; hết Tàn Ảnh, dấu ấn nổ bằng 40% sát thương nạn nhân đã nhận trong lúc bị găm. Dùng lại trong 2s: giật về ảo ảnh và kích nổ sớm.',
        cd: [10, 9.5, 9, 8.5, 8],
        can(m, u) { return u.ws.nn >= 20; },
        use(m, u, ctx) {
          if (!spend(u, 20)) return;
          const home = illusion(m, u, u.x, u.y, { life: 2.5, hp: 0.3 });
          u.ws.driftUntil = m.time + 2; u.ws.drift = [];
          m.addStatus(u, 'untarget', 2, 1, { key: 'mir_drift' }); m.addStatus(u, 'haste', 2, 0.35, { key: 'mir_drift' });
          const p = H.toward(u, ctx.pt, H.T(u, '3c') ? 5 : 3, false); m.dashTo(u, p.x, p.y, 16, {});
          m.allowRecast(u, 's1', 2, (mm, uu) => {
            if (home.alive) mm.blink(uu, home.x, home.y);
            uu.ws.driftUntil = 0; mm.removeStatus(uu, 'untarget', 'mir_drift'); burstMarks(mm, uu);
          });
        },
        ai: { use: 'engage', range: 5, aim: 'point', speed: 0, skillshot: true, alsoEscape: true, recastWhen: (m, u) => u.hpPct < 0.35 },
      },
      s2: {
        name: 'Phi Dao Hoán Vị', desc: 'Tốn 25 Náo Nhiệt: ném phi dao 9 đv, trúng tướng gây sát thương phép và cắm 3s. Dùng lại trong 3.5s: búng tay hoán đổi vị trí với nạn nhân, choáng nó 1s.',
        cd: [11, 10, 9.5, 9, 8.5],
        can(m, u) { return u.ws.nn >= 25; },
        use(m, u, ctx) {
          if (!spend(u, 25)) return;
          const dmg = H.amt(u, ctx.v([70, 105, 140, 175, 210]), 0, 0.6);
          H.shoot(m, u, ctx.pt, { speed: 24, range: H.T(u, '1b') ? 12 : 9, r: 0.4, kind: 'arrow', hitMinions: false, onHit: (mm, p, e) => {
            mm.damage(u, e, dmg, 'magic', { tag: 's2' });
            if (e.kind !== 'hero') return;
            u.ws.knife = { e, until: mm.time + 3.5 };
            mm.allowRecast(u, 's2', 3.5, (m3, u3) => {
              if (!e.alive) return;
              const x = u3.x, y = u3.y; m3.blink(u3, e.x, e.y); e.x = x; e.y = y; e.navP = null; e.dash = null;
              u3.ws.swapT2 = m3.time + 1.2; m3.addStatus(e, 'stun', 1, 1, { src: u3 }); if (H.T(u3, '3a')) m3.addStatus(e, 'silence', 1, 1, { src: u3 });
              u3.ws.knife = null;
            });
          } });
        },
        ai: { use: 'poke', range: 8.5, aim: 'point', speed: 24, heroOnly: true,
          // Bẫy Hoán Vị: đổi chỗ đưa nạn nhân vào tâm Hộp Tử Thần sắp nổ
          recastWhen: (m, u, t) => !!(u.ws.box && u.ws.box.at - m.time < 0.5 && u.ws.box.at > m.time && M.dist(u, u.ws.box) < 3.5 && u.ws.knife && u.ws.knife.e.alive && M.dist(u.ws.knife.e, u.ws.box) > 4) || !!(t && t.hpPct < 0.25 && u.hpPct > 0.5) },
      },
      s3: {
        name: 'Hộp Tử Thần', desc: 'Tốn 30 Náo Nhiệt: đặt vùng cảnh báo đỏ bán kính 6.5 đv tại chỗ hoặc một điểm trong 8 đv; sau 2.2s phát nổ — sát thương phép CỰC LỚN, CHOÁNG 1.25s mọi mục tiêu bên trong và phá 350 Hộ Giáp. (Combo: Phi Dao trúng → Hộp Tử Thần dưới chân → dùng lại Phi Dao đổi chỗ, ném nạn nhân vào tâm vụ nổ.)',
        cd: [13, 12, 11, 10, 9.5],
        can(m, u) { return u.ws.nn >= 30; },
        use(m, u, ctx) {
          if (!spend(u, 30)) return;
          const p = M.dist(u, ctx.pt) <= 8 ? ctx.pt : H.toward(u, ctx.pt, 8, true);
          const x = p.x, y = p.y, R = 6.5, dmg = H.amt(u, ctx.v([230, 330, 430, 530, 640]), 0, 1.4);
          u.ws.box = { x, y, at: m.time + 2.2 };
          m.telegraph({ x, y, r: R, life: 2.2, team: u.team });
          m.dangers.push({ id: 'mirbox' + u.id + '_' + Math.round(m.time * 10), type: 'circle', x, y, r: R, until: m.time + 2.2, team: u.team });
          m.later(2.2, (mm) => {
            mm.hitCircle(u, x, y, R, (e) => { mm.damage(u, e, dmg, 'magic', { tag: 's3', aoe: true }); mm.addStatus(e, 'stun', 1.25, 1, { src: u }); if (e.ga > 0) e.ga = Math.max(0, e.ga - 350); }, { color: '#c9a0ff', fx: 'boom' });
            if (H.T(u, '3b')) mm.zone({ owner: u, x, y, r: R, life: 3, every: 0.25, kind: 'smoke', tick: (m3, z) => m3.hitCircle(u, x, y, R, (e) => m3.addStatus(e, 'slow', 0.4, 0.5, { src: u, key: 'mir_fog' }), { noFx: true }) });
          });
        },
        // AI: Phi Dao vừa cắm vào nạn nhân → đặt hộp DƯỚI CHÂN MIRAGE (rồi đổi chỗ); không thì đặt lên kẻ địch đứng yên / bị khống chế
        ai: { use: 'custom', aim: 'point', pick: (m, u, t) => {
          if (u.ws.knife && u.ws.knife.until > m.time + 1.6 && u.ws.knife.e.alive) { u.stats.mirCombo = (u.stats.mirCombo || 0) + 1; return { pt: { x: u.x, y: u.y } }; }
          if (!t || t.kind !== 'hero' || M.dist(u, t) > 8) return null;
          const slow = t.disabled || t.has('slow') || t.has('root') || !H.moving(t);
          return slow || M.dist(u, t) < 3 ? { pt: { x: t.x, y: t.y } } : null;
        } },
      },
      sub: {
        name: 'Biến Ảnh / Phân Hình', desc: 'Sẵn sàng: tạo một ảo ảnh tĩnh 8s tại chỗ. Khi đã có ảo ảnh: đổi vị trí tức thì với ảo ảnh an toàn nhất. Hồi 12s → 4s theo cấp.',
        cd: (m, u) => (u.level >= 18 ? 4 : u.level >= 12 ? 6 : u.level >= 6 ? 9 : 12),
        use(m, u) {
          const ds = m.decoysOf(u);
          const danger = m.enemiesIn(u.team, u.x, u.y, 5, { heroesOnly: true }).length && u.hpPct < 0.6;
          if (ds.length && danger) {
            const score = (d) => { const e = H.nearestEnemyHero(m, d, 15); return e ? M.dist(e, d) : 15; };
            const d = ds.sort((a, b) => score(b) - score(a) || a.id - b.id)[0];
            const x = u.x, y = u.y; m.blink(u, d.x, d.y); d.x = x; d.y = y;
            return;
          }
          illusion(m, u, u.x, u.y, { life: 8 });
        },
        ai: { use: 'defend', aim: 'self', range: 6, alsoEscape: true },
      },
      s4: {
        name: 'Nghệ Thuật Ảo Ảnh: Phân Thân Hoàn Hảo', desc: 'Tốn 50 Náo Nhiệt: tạo Phân Thân Hoàn Hảo 15s (máu 100% bản gốc, mang theo trang bị & mảnh hồn, tự đánh, tự né, tự dùng Phi Dao và Hộp Tử Thần thu nhỏ); bị phá hoặc hết giờ thì nổ bán kính 4 đv: sát thương phép và choáng 1.5s. Dùng lại (hồi riêng 4s): đổi chỗ với phân thân. Nội tại: học chiêu này thì mọi ảo ảnh đều đánh thường (35% sát thương).',
        cd: [85, 70, 55],
        can(m, u) { return u.ws.nn >= 50 || u.ws.doubles.some((d) => d.alive); },
        use(m, u, ctx) {
          const alive = u.ws.doubles.filter((d) => d.alive);
          if (alive.length && m.time >= u.ws.swapT) {
            u.ws.swapT = m.time + (H.T(u, '9b') ? 1.5 : 4); u.cd.s4 = Math.max(u.cd.s4, 0);
            const d = alive[0], x = u.x, y = u.y; m.blink(u, d.x, d.y); d.x = x; d.y = y;
            return;
          }
          if (!spend(u, 50)) return;
          const dmg = H.amt(u, ctx.v([150, 240, 330]), 0, 0.8), p = H.toward(u, ctx.pt, 4, true);
          u.ws.doubles = [perfectDouble(m, u, p.x, p.y, dmg)];
          if (H.T(u, '12a')) u.ws.doubles.push(perfectDouble(m, u, u.x - u.fx * 2, u.y - u.fy * 2, dmg));
          if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🎭 Phân Thân Hoàn Hảo', color: '#e0b0ff' });
        },
        ai: { use: 'ult', aim: 'point', range: 7, speed: 0 },
      },
    },
    ai: { order: ['s2', 's3', 's1'], engageRange: 7, role: 'mage', guard: (m, u) => (u.ws.driftUntil > m.time ? { t: 0.5 } : null) },
    tags: ['stealth', 'illusion'],
  });
  G.HEROES.mirage.tree = [
    [
      { name: 'Tự Nhiên Thăng Hoa', desc: 'Náo Nhiệt tự tăng 6/giây (thay vì 4).' },
      { name: 'Phi Dao Tầm Xa', desc: 'Phi Dao bay 12 đv.' },
      { name: 'Ảo Ảnh Rắn Rỏi', desc: 'Ảo ảnh có thêm 50% máu.' },
    ],
    [
      { name: 'Hoán Vị Câm Lặng', desc: 'Đổi chỗ bằng Phi Dao câm lặng thêm 1s.' },
      { name: 'Hộp Nổ Kép', desc: 'Hộp Tử Thần để lại sương khói làm chậm 50% trong 3s.' },
      { name: 'Tàn Ảnh Rộng Mở', desc: 'Tàn Ảnh lướt xa thêm 2 đv.' },
    ],
    [
      { name: 'Ảo Ảnh Đao Phong', desc: 'Ảo ảnh đánh 60% sát thương (thay vì 35%).' },
      { name: 'Thoát Hiểm Kép', desc: 'Đại Thoát Hiểm hồi 80s.' },
      { name: 'Dấu Ấn Xuyên Thấu', desc: 'Dấu Ấn Tàn Ảnh nổ xuyên 50% Hộ Giáp.' },
    ],
    [
      { name: 'Vụ Nổ Phân Thân Hủy Diệt', desc: 'Phân Thân Hoàn Hảo nổ mạnh hơn 50% và cấm dây móc 3s.' },
      { name: 'Hoán Vị Không Giới Hạn', desc: 'Đổi chỗ với phân thân hồi 1.5s.' },
      { name: 'Ảo Ấn Tử Thần', desc: 'Kích nổ Ảo Ấn giảm 1s hồi chiêu S1 và S2.' },
    ],
    [
      { name: 'Ảo Mộng Tuyệt Đối', desc: 'Phong cách: chiêu cuối tạo 2 Phân Thân Hoàn Hảo.' },
      { name: 'Ván Cược Cứu Rỗi', desc: 'Phong cách: Alice hoặc Luca bị hạ gục → +30% Công Phép vĩnh viễn và làm mới mọi hồi chiêu.' },
      { name: 'Sân Khấu Vĩnh Hằng', desc: '+15% hồi chiêu.', stats: { cdr: 0.15 } },
    ],
  ];
})();
