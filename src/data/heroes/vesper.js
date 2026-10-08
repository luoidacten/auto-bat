'use strict';
// ===== Vesper — Dao Găm • Đi rừng / Đường giữa • sát thủ tàng hình • mana • vật lý =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const STEALTH = 'ves_stealth', POISON = 'ves_poison';
  const behind = (u, t) => ((u.x - t.x) * t.fx + (u.y - t.y) * t.fy) < 0;
  const backAmp = (u) => (H.T(u, '3a') ? 0.6 : 0.4);
  function backPoint(t, d) { return { x: t.x - t.fx * (t.r + d), y: t.y - t.fy * (t.r + d) }; }
  function unveil(m, u) { if (u.hasKey(STEALTH)) m.removeStatus(u, 'stealth', STEALTH); }
  function stealth(m, u, T) {
    m.addStatus(u, 'stealth', T, 1, { key: STEALTH });
    m.addStatus(u, 'haste', T, H.T(u, '1a') ? 0.6 : 0.4, { key: STEALTH });
    // Ảo Ảnh Phân Thân: 2 phân thân chạy về 2 hướng
    if (H.T(u, '12a')) for (const s of [-1, 1]) {
      const a = M.atan2(u.fy, u.fx) + s * 0.9;
      m.makeDecoy(u, u.x, u.y, { life: 2.5, hp: 0.25, runTo: { x: u.x + M.cos(a) * 9, y: u.y + M.sin(a) * 9 } });
    }
  }
  H.def({
    id: 'vesper', name: 'Vesper', color: '#b07aff', gfx: 'dagger', kit: 'fighter', pos: ['jungle', 'mid'], dmgType: 'phys',
    ranged: false, r: 0.56, resource: 'mana',
    stats: { hp: 560, hpG: 86, mp: 300, mpG: 36, mpr: 1.5, mprG: 0.08, ad: 64, adG: 4.0, armor: 27, armorG: 3.6, mr: 30, mrG: 1.4, as: 0.78, asG: 0.03, ms: 3.65, range: 1.35 },
    passive: {
      name: 'Đâm Sau Lưng',
      desc: 'Đòn đánh và chiêu từ sau lưng mục tiêu +40% sát thương và câm lặng 0.75s (mỗi mục tiêu 1 lần mỗi 8s). Đòn đánh đầu tiên khi chưa bị phát hiện gây gấp đôi (x2) sát thương. Đánh thường là những nhát chém nhanh.',
      init(m, u) { u.ws.combo = {}; u.ws.unseenStrike = true; },
      update(m, u) {
        // S3 nội tại: ngụy trang sau 5s ngoài giao tranh, bị lộ trong bán kính 2.5 đv
        const ooc = m.time - (u.combatT || -99) > 5 && m.time - (u.lastDmgT || -99) > 5;
        if (ooc && !u.cast && !u.dash && u.alive) {
          const closeEnemy = m.heroes.some((e) => e.alive && e.team !== u.team && M.dist(e, u) < 2.5);
          if (closeEnemy && u.hasKey('ves_camo')) m.removeStatus(u, 'stealth', 'ves_camo');
          else if (!closeEnemy && !u.has('stealth')) m.addStatus(u, 'stealth', 0.6, 1, { key: 'ves_camo' });
        }
      },
      onDeal(m, u, t, info) {
        if (info.tag === 'dot' || info.tag === 'item' || t.kind === 'tower' || t.kind === 'nexus') return;
        if (!behind(u, t)) return;
        let amp = backAmp(u);
        if (H.T(u, '12c') && t.kind === 'hero' && t.hpPct < 0.3) amp = 0.8;
        info.amt *= 1 + amp;
        if (t.kind === 'hero' && H.ready(m, u, 'bs' + t.id, 8)) m.later(0, (mm) => mm.addStatus(t, 'silence', 0.75, 1, { src: u }));
      },
      onAuto(m, u, t, info) {
        const isUnseen = !t.vis || !t.vis[u.team] || u.has('stealth') || (u.bush >= 0 && u.bush !== t.bush);
        unveil(m, u);
        if (u.hasKey('ves_camo')) m.removeStatus(u, 'stealth', 'ves_camo');
        if (isUnseen) {
          info.amt *= 2;
          if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🗡 ĐỘT KÍCH x2', color: '#b07aff' });
        }
        if (u.ws.ultHit > m.time) {
          u.ws.ultHit = 0;
          info.amt *= H.T(u, '9b') ? 2.5 : 2;
          if (u.ws.unseenUlt) {
            info.penX = Math.max(info.penX || 0, 0.5);
            info.byp = 1.0;
            if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '☠ XUYÊN HỘ GIÁP 100%', color: '#ff55aa' });
          }
        }
        // Độc Sát Chuyên Nghiệp: 3 đòn liên tiếp lên cùng tướng trong 3s → choáng + câm lặng 1s
        if (H.T(u, '12b') && t.kind === 'hero') {
          const c = u.ws.combo; if (c.id !== t.id || m.time - c.t > 3) { c.id = t.id; c.n = 0; }
          c.n++; c.t = m.time;
          if (c.n >= 3 && H.ready(m, u, 'dscn' + t.id, 8)) { c.n = 0; info.extra.push(() => { m.addStatus(t, 'stun', 1, 1, { src: u }); m.addStatus(t, 'silence', 1, 1, { src: u }); }); }
        }
      },
      onSkill(m, u, key) {
        if (key !== 's3') {
          unveil(m, u);
          if (u.hasKey('ves_camo')) m.removeStatus(u, 'stealth', 'ves_camo');
        }
      },
      onKill(m, u, v) { if (H.T(u, '3c') && v.kind === 'hero') stealth(m, u, 2); },
      onFatal(m, u) {
        if (!H.T(u, '9c') || !H.ready(m, u, 'tt', 90)) return false;
        const e = H.nearestEnemyHero(m, u, 8), v = e ? H.dirTo(e, u) : { x: -u.fx, y: -u.fy };
        u.hp = 1; m.blink(u, u.x + v.x * 4, u.y + v.y * 4); m.addStatus(u, 'invuln', 0.5, 1); stealth(m, u, 1.5);
        return true;
      },
    },
    skills: {
      s1: {
        name: 'Phi Dao Ảnh Bộ', desc: 'Ném dao độc 7 đv: sát thương, câm lặng 1s, độc 3s. Trúng thì trong 2s dùng lại để dịch chuyển ra sau lưng mục tiêu.',
        cd: [9, 8.5, 8, 7.5, 7], cost: [45, 45, 45, 45, 45], castTime: 0.12,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([50, 80, 110, 140, 170]), 0.5), poison = (8 + 2 * u.level) * (H.T(u, '1b') ? 1.4 : 1);
          H.shoot(m, u, ctx.pt, { speed: 22, range: 7, r: 0.4, kind: 'arrow', onHit: (mm, p, e) => {
            mm.damage(u, e, dmg, 'phys', { tag: 's1' }); mm.addStatus(e, 'silence', 1, 1, { src: u }); mm.dot(u, e, poison, 3, 'magic', POISON);
            if (e.kind !== 'hero' && e.kind !== 'monster') return;
            mm.allowRecast(u, 's1', 2, (m3, u3) => {
              if (!e.alive) return;
              if (H.T(u3, '6b')) {   // Đổi Hướng Đột Kích: ra trước mặt, đá hất tung
                m3.blink(u3, e.x + e.fx * (e.r + 0.8), e.y + e.fy * (e.r + 0.8)); u3.face(e.x, e.y);
                m3.knockup(u3, e, 0.75); m3.damage(u3, e, H.amt(u3, 30 + 6 * u3.level, 0.4), 'phys', { tag: 's1' });
                return;
              }
              const bp = backPoint(e, 0.9); m3.blink(u3, bp.x, bp.y); u3.face(e.x, e.y);
              if (H.T(u3, '3b')) m3.addStatus(e, 'blind', 1.5, 1, { src: u3 });
              u3.atkT = 0;
            });
          } });
        },
        ai: { use: 'engage', range: 6.8, aim: 'point', speed: 22, skillshot: true, recastWhen: (m, u, t) => !!t },
      },
      s2: {
        name: 'Xuyên Tâm', desc: 'Lao 4 đv xuyên qua kẻ địch, chém mạnh mọi kẻ trên đường (từ sau lưng mạnh hơn).',
        cd: [8, 7.5, 7, 6.5, 6], cost: [40, 40, 40, 40, 40],
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 4, false), dmg = H.amt(u, ctx.v([60, 95, 130, 165, 200]), 0.7);
          m.dashTo(u, p.x, p.y, 20, { onContact: (mm, uu, e) => {
            const back = behind(u, e);
            mm.damage(u, e, dmg, 'phys', { tag: 's2' });
            if (back && H.T(u, '6a')) mm.addStatus(e, 'root', 1, 1, { src: u });
          } });
        },
        ai: { use: 'burst', range: 3.8, aim: 'unit', alsoEscape: true, farm: 3 },
      },
      s3: {
        name: 'Ẩn Thân', desc: 'Tàng hình 2.5s, +40% tốc chạy. Nội tại: ngụy trang sau 5s ngoài giao tranh (lộ khi đứng trong 2.5 đv).',
        cd: [16, 15, 14, 13, 12], cost: [60, 60, 60, 60, 60],
        use(m, u) { stealth(m, u, H.T(u, '6c') ? 3.5 : 2.5); },
        ai: { use: 'escape', range: 4, aim: 'self', alsoEngage: true },
      },
      s4: {
        name: 'Bão Phi Đao', desc: 'Phóng 10 dao quanh người (6 đv); trúng tướng thì dịch chuyển ra sau lưng tướng gần nhất bị trúng, đòn đánh kế tiếp trong 3s gây gấp đôi. Nếu tung khi chưa bị phát hiện: nhận 50% xuyên giáp và 100% xuyên Hộ Giáp (đánh thẳng vào Máu Đỏ).',
        cd: [100, 85, 70], cost: [100, 100, 100], castTime: 0.15,
        use(m, u, ctx) {
          u.ws.unseenUlt = !u.visAny || u.has('stealth') || u.bush >= 0;
          const n = H.T(u, '9a') ? 14 : 10, dmg = H.amt(u, ctx.v([50, 80, 110]), 0.35);
          const hit = [];
          for (let i = 0; i < n; i++) {
            const a = i * 6.2831853 / n;
            m.proj({ owner: u, x: u.x, y: u.y, dx: M.cos(a), dy: M.sin(a), speed: 20, range: 6, r: 0.4, kind: 'arrow', pierce: true,
              onHit: (mm, p, e) => { mm.damage(u, e, dmg, 'phys', { tag: 's4' }); if (e.kind === 'hero') hit.push(e); } });
          }
          m.later(0.35, (mm) => {
            if (!u.alive) return;
            const t = hit.filter((e) => e.alive).sort((a, b) => M.dist2(a, u) - M.dist2(b, u) || a.id - b.id)[0];
            if (!t) return;
            const bp = backPoint(t, 0.9); mm.blink(u, bp.x, bp.y); u.face(t.x, t.y);
            u.ws.ultHit = mm.time + 3; u.atkT = 0;
          });
        },
        ai: { use: 'ult', aim: 'self', range: 5, aoe: 6 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 6, role: 'assassin', flank: 'behind', hitRun: true },
    tags: ['stealth', 'dive'],
  });
  G.HEROES.vesper.tree = [
    [
      { name: 'Bộ Pháp Vô Hình', desc: 'Ẩn Thân tăng 60% tốc chạy (thay vì 40%).' },
      { name: 'Độc Ăn Mòn', desc: 'Độc của Phi Dao mạnh hơn 40%.' },
      { name: 'Đoản Đao', desc: '+15% tốc đánh.', stats: { asPct: 0.15 } },
    ],
    [
      { name: 'Tử Huyệt Sau Lưng', desc: 'Đòn sau lưng +60% sát thương (thay vì +40%).' },
      { name: 'Ám Kích Chớp Nhoáng', desc: 'Dịch chuyển của Phi Dao gây mù mục tiêu 1.5s.' },
      { name: 'Bóng Ma Mất Dấu', desc: 'Hạ gục tướng: lập tức Ẩn Thân 2s.' },
    ],
    [
      { name: 'Lướt Xiên Bóng Đêm', desc: 'Xuyên Tâm chém trúng từ sau lưng: trói chân 1s.' },
      { name: 'Đổi Hướng Đột Kích', desc: 'Dịch chuyển của Phi Dao ra TRƯỚC MẶT mục tiêu kèm cú đá hất tung 0.75s.' },
      { name: 'Bước Đi Không Vết', desc: 'Ẩn Thân kéo dài 3.5s.' },
    ],
    [
      { name: 'Bão Dao Đoạt Mệnh', desc: 'Bão Phi Đao phóng 14 dao (thay vì 10).' },
      { name: 'Sát Thủ Hoàn Hảo', desc: 'Đòn đánh sau Bão Phi Đao gây ×2.5 (thay vì ×2).' },
      { name: 'Thế Thân', desc: 'Đòn chí tử: để lại khúc gỗ thế thân, dịch chuyển 4 đv và tàng hình 1.5s với 1 máu (hồi 90s).' },
    ],
    [
      { name: 'Ảo Ảnh Phân Thân', desc: 'Ẩn Thân tạo thêm 2 phân thân chạy về 2 hướng, đánh lạc hướng đối thủ.' },
      { name: 'Độc Sát Chuyên Nghiệp', desc: 'Đánh trúng cùng một tướng 3 lần trong 3s: choáng + câm lặng 1s (mỗi mục tiêu 8s).' },
      { name: 'Lưỡi Dao Đoạt Mạng', desc: 'Đòn sau lưng lên tướng dưới 30% máu: +80% sát thương.' },
    ],
  ];
})();
