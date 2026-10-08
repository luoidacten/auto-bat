'use strict';
// ===== Joker — Bài • Đường giữa / Hỗ trợ • bài may rủi • mana • phép =====
// Mọi may rủi dùng bộ sinh số chiến đấu của trận (tất định theo hạt giống).
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const SUN = 'jk_sun', MOON = 'jk_moon';
  const SUITS = ['bich', 'tep', 'ro', 'co', 'joker'];
  const NAME = { bich: '♠ Bích', tep: '♣ Tép', ro: '♦ Rô', co: '♥ Cơ', joker: '🃏 Joker', all: '★ Toàn Năng' };
  function drawSuit(m, u) {
    if (H.T(u, '12a')) { const r = m.rng.next(); return r < 0.25 ? 'joker' : ['bich', 'tep', 'ro'][m.rng.int(0, 2)]; }
    const r = m.rng.next(); return r < 0.1 ? 'joker' : ['bich', 'tep', 'ro', 'co'][m.rng.int(0, 3)];
  }
  // Ấn Mặt Trời (Rô/Cơ) + Ấn Mặt Trăng (Bích/Tép), mỗi loại 2 tầng → choáng 1.5s
  function seal(m, u, e, key) {
    if (!e.alive || e.kind !== 'hero') return;
    m.addStatus(e, 'mark', 6, 1, { key, src: u, stack: 'add', max: 2 });
    if (H.stacks(e, SUN) >= 2 && H.stacks(e, MOON) >= 2) {
      m.removeStatus(e, 'mark', SUN); m.removeStatus(e, 'mark', MOON);
      m.addStatus(e, 'stun', 1.5, 1, { src: u });
      if (m.fxOn) m.fx({ type: 'burst', x: e.x, y: e.y, color: '#ffd24a' });
    }
  }
  function applyCard(m, u, suit, e, dmg) {
    if (!e || !e.alive) return;
    const ex = H.T(u, '12a') && suit !== 'joker' && suit !== 'all' ? ['bich', 'tep', 'ro'][m.rng.int(0, 2)] : null;
    const run = (s) => {
      if (s === 'bich') { m.damage(u, e, dmg * 1.3 * (H.T(u, '3a') && e.hpPct < 0.4 ? 1.4 : 1), 'magic', { tag: 's1' }); seal(m, u, e, MOON); }
      else if (s === 'tep') {
        m.damage(u, e, dmg * 0.8, 'magic', { tag: 's1' });
        const k = m.rng.int(0, 2), plus = H.T(u, '3b') ? 0.5 : 0;
        if (k === 0) m.addStatus(e, 'slow', 1.5 + plus, 0.4, { src: u }); else if (k === 1) m.addStatus(e, 'silence', 1 + plus, 1, { src: u }); else m.addStatus(e, 'root', 0.75 + plus, 1, { src: u });
        seal(m, u, e, MOON);
      } else if (s === 'ro') { m.hitCircle(u, e.x, e.y, 2, (x) => { m.damage(u, x, dmg * 0.9, 'magic', { tag: 's1', aoe: true }); seal(m, u, x, SUN); }, { color: '#ff5a5a' }); }
      else if (s === 'co') { m.damage(u, e, dmg * 0.7, 'magic', { tag: 's1' }); for (const a of H.alliesNear(m, u, 5, true)) m.heal(u, a, 30 + 8 * u.level + 0.2 * u.st.ap); seal(m, u, e, SUN); }
      else if (s === 'joker') { m.damage(u, e, dmg * 0.8, 'magic', { tag: 's1' }); if (e.kind === 'hero' && M.dist(u, e) < 9) { const x = u.x, y = u.y; m.blink(u, e.x, e.y); e.x = x; e.y = y; e.navP = null; } }
    };
    if (suit === 'all') { for (const s of ['bich', 'tep', 'ro', 'co']) run(s); return; }
    run(suit); if (ex && ex !== suit) run(ex);
  }
  function lucky(m, u, key) {
    const p = key === 's1' ? (H.T(u, '9c') ? 0.4 : 0.25) : (H.T(u, '9c') ? 0.2 : 0.1);
    if (!m.rng.chance(p)) return false;
    if (H.T(u, '6a')) { u.mp = Math.min(u.st.maxMp, u.mp + 30); m.addStatus(u, 'haste', 2, 0.2, { key: 'jk_fun' }); }
    if (m.fxOn) m.fx({ type: 'aura', id: u.id, color: '#ffd24a', life: 0.4 });
    return true;
  }
  function throwCard(m, u, pt, suit, dmg) {
    const fast = H.T(u, '1a'), v = H.dirTo(u, pt);
    const angles = H.T(u, '6b') ? [-0.25, 0, 0.25] : [0];
    for (const a of angles) {
      const c = M.cos(a), s = M.sin(a);
      m.proj({ owner: u, x: u.x, y: u.y, dx: v.x * c - v.y * s, dy: v.x * s + v.y * c, speed: fast ? 28 : 20, range: fast ? 9 : 7, r: 0.4, kind: 'card', onHit: (mm, p, e) => applyCard(mm, u, suit, e, dmg) });
    }
  }
  // Giả Ngây Ngô (bản cũ): né hoàn toàn đòn đánh của tướng nam — cục súc dễ bị lừa nhất, kẻ lão luyện khó lừa hơn; tướng nữ gần như không bị lừa
  const JK_FEM = new Set(['elara', 'aria', 'roxie', 'alice', 'vesper', 'victoria', 'joker']);
  const JK_LOW = ['borg', 'koda', 'clint'], JK_DISC = ['gideon', 'valerius', 'ryoma', 'kazuki'];
  const naive = (id) => (JK_FEM.has(id) ? 0.03 : JK_LOW.includes(id) ? 0.3 : JK_DISC.includes(id) ? 0.1 : 0.16);
  H.def({
    id: 'joker', name: 'Joker', color: '#ffd24a', gfx: 'cards', kit: 'mage', pos: ['mid', 'sup'], dmgType: 'magic',
    ranged: true, projSpeed: 20, projKind: 'card', r: 0.58, resource: 'mana',
    stats: { range: 5.2 },
    passive: {
      name: 'Bịp Bợm',
      desc: 'Phi Bài 25%, Rút Bài và Tráo Bài 10% được nhân đôi. Lá Rô/Cơ gắn Ấn Mặt Trời, lá Bích/Tép gắn Ấn Mặt Trăng: một tướng mang đủ 2 Mặt Trời + 2 Mặt Trăng thì choáng 1.5s. Joker luôn giữ một lá bài (Phi Bài ném lá đang giữ). Giả Ngây Ngô: né hoàn toàn đòn đánh thường của tướng nam (cục súc Borg/Koda/Clint 30% • lão luyện Gideon/Valerius/Ryoma/Kazuki 10% • còn lại 16%); tướng nữ chỉ 3%.',
      init(m, u) { u.ws.card = 'bich'; if (H.T(u, '1b')) u.gold += 300; },
      onTake(m, u, att, info) {
        if (!info.auto || !att || att.kind !== 'hero' || att === u) return;
        const ch = naive(att.heroId) + (H.T(u, '3c') ? 0.15 : 0);
        if (!m.rng.chance(ch)) return;
        info.amt = 0;
        if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: JK_FEM.has(att.heroId) ? '😏 NÉ!' : '😉 ẤY~ NÉ!', color: '#ffd24a' });
      },
    },
    skills: {
      s1: {
        name: 'Phi Bài Sắc Cạnh', desc: 'Ném lá bài đang giữ 7 đv, áp hiệu ứng theo chất: ♠ sát thương lớn • ♣ khống chế ngẫu nhiên • ♦ nổ lan • ♥ hồi máu đồng minh quanh Joker • 🃏 đổi chỗ với mục tiêu.',
        cd: [4, 4, 3.75, 3.5, 3.25], cost: [40, 45, 50, 55, 60], castTime: 0.12,
        use(m, u, ctx) {
          const dmg = H.amt(u, ctx.v([55, 85, 115, 145, 175]), 0, 0.55);
          throwCard(m, u, ctx.pt, u.ws.card, dmg);
          if (lucky(m, u, 's1')) { const pt = { x: ctx.pt.x, y: ctx.pt.y }; m.later(0.2, (mm) => u.alive && throwCard(mm, u, pt, u.ws.card, dmg)); }
        },
        ai: { use: 'poke', range: 6.8, aim: 'point', speed: 20, farm: 3 },
      },
      s2: {
        name: 'Rút Bài May Rủi', desc: 'Rút một lá: ♠ sát thương • ♣ khống chế ngẫu nhiên • ♦ nổ lan • ♥ hồi máu đồng minh • 🃏 đổi chỗ — áp lên tướng địch gần nhất trong 6 đv, rồi giữ lá đó. 10% rút hụt (hoàn 50% hồi chiêu).',
        cd: [6, 6, 5.5, 5.5, 5], cost: [50, 50, 50, 50, 50], castTime: 0.1,
        use(m, u, ctx) {
          if (!H.T(u, '9b') && m.rng.chance(0.1)) { u.cd.s2 *= 0.5; if (m.fxOn) m.fx({ type: 'miss', x: u.x, y: u.y }); return; }
          const dmg = H.amt(u, ctx.v([50, 75, 100, 125, 150]), 0, 0.5);
          const go = (mm) => {
            const s = drawSuit(mm, u); u.ws.card = s;
            const t = ctx.tgt && ctx.tgt.alive && M.dist(u, ctx.tgt) < 6.5 ? ctx.tgt : H.nearestEnemyHero(mm, u, 6);
            if (s === 'co' && !t) { for (const a of H.alliesNear(mm, u, 5, true)) mm.heal(u, a, 30 + 8 * u.level + 0.2 * u.st.ap); return; }
            if (t) applyCard(mm, u, s, t, dmg);
            if (mm.fxOn) mm.fx({ type: 'note', id: u.id, k: s });
          };
          go(m);
          if (lucky(m, u, 's2')) m.later(0.2, (mm) => u.alive && go(mm));
        },
        ai: { use: 'burst', range: 6, aim: 'unit' },
      },
      s3: {
        name: 'Tráo Bài', desc: 'Lướt 3 đv và đổi lá bài đang giữ.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [40, 40, 40, 40, 40],
        use(m, u, ctx) {
          const from = { x: u.x, y: u.y };
          const p = H.toward(u, ctx.pt, 3, false); m.dashTo(u, p.x, p.y, 18, {});
          u.ws.card = drawSuit(m, u);
          if (lucky(m, u, 's3')) u.cd.s3 = 0;
          // Bài Ảo Đánh Lạc Hướng: hình nhân bài giấy phát nổ
          if (H.T(u, '6c')) m.makeDecoy(u, from.x, from.y, { life: 3, hp: 0.15, onDeath: (mm, d) => mm.hitCircle(u, d.x, d.y, 2, (e) => { mm.damage(u, e, 40 + 10 * u.level + 0.3 * u.st.ap, 'magic', { tag: 's3', aoe: true }); mm.addStatus(e, 'slow', 1.5, 0.4, { src: u }); }, { color: '#ffd24a' }) });
        },
        ai: { use: 'escape', range: 3, aim: 'away' },
      },
      sub: {
        name: 'Mượn Tý Nha!', desc: 'Khi ai đó trong tầm nhìn dùng món kích hoạt, vật phẩm tiêu hao hoặc phép bổ trợ, Joker có 10s để dùng bản sao của nó (hồi chiêu 0s).',
        cd: 0,
        can(m, u) { const L = m.lastUse; return !!(L && m.time - L.t <= 10 && L.by !== u && (L.by.team === u.team || L.by.vis[u.team])); },
        use(m, u, ctx) {
          const L = m.lastUse; if (!L) return;
          const c = { enemies: u.ai ? u.ai.visibleEnemyHeroes(13) : [], allies: [], target: u.ai && u.ai.target, fleeing: u.ai && u.ai.fleeing, fight: u.ai && u.ai.mode === 'fight' };
          if (L.kind === 'bag') { if (G.BAG_USE && G.BAG_USE[L.id]) G.BAG_USE[L.id](m, u, ctx.tgt, ctx.pt); }
          else if (L.kind === 'spell') { const S = G.SPELLS && G.SPELLS[L.id]; if (S) { const o = (S.ai && S.ai(m, u, c)) || { tgt: ctx.tgt, pt: ctx.pt }; m.hook(S.use, m, u, o); } }
          else if (G.ITEMS && G.ITEMS[L.id] && G.ITEMS[L.id].active) { const A = G.ITEMS[L.id].active; const o = (A.ai && A.ai(m, u, c)) || { tgt: ctx.tgt, pt: ctx.pt }; m.hook(A.use, m, u, o); }
          if (H.T(u, '9a')) m.addStatus(u, 'buff', 3, 1, { key: 'jk_thief', mods: { dmgAmp: 0.3 } });
          if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🃏 Mượn Tý Nha!', color: '#ffd24a' });
          m.lastUse = null;
        },
        ai: { use: 'burst', aim: 'unit', range: 7, cond: (m, u) => {
          const L = m.lastUse; if (!L) return false;
          if (L.kind === 'bag') return true;
          const c = { enemies: u.ai ? u.ai.enemiesNear || [] : [], allies: u.ai ? u.ai.alliesNear || [] : [], target: u.ai && u.ai.target, fleeing: u.ai && u.ai.fleeing, fight: u.ai && u.ai.mode === 'fight' };
          const fn = L.kind === 'spell' ? (G.SPELLS && G.SPELLS[L.id] && G.SPELLS[L.id].ai) : (G.ITEMS && G.ITEMS[L.id] && G.ITEMS[L.id].active && G.ITEMS[L.id].active.ai);
          return !fn || !!m.hook(fn, m, u, c);
        } },
      },
      s4: {
        name: 'Ván Cờ Đổi Chiều', desc: 'Tung hộp bài lên trời: 45% Lá Toàn Năng (mọi chất cùng lúc lên mục tiêu) • 30% Đại Bác Bài (quét đường thẳng 10 đv) • 20% Tráo Sinh Mệnh (đổi % máu với tướng địch, chênh tối đa 30%) • 4.8% Cơn Ác Mộng (choáng 2.5s, kẻ quanh đó 1.5s) • 0.2% Thần Chết Bịp Bợm (kết liễu lập tức).',
        cd: [110, 90, 70], cost: [100, 100, 100], castTime: 0.2,
        can(m, u) { const t = u.ai && u.ai.target; return !!(t && t.kind === 'hero' && M.dist(u, t) < 7.5); },
        use(m, u, ctx) {
          const t = ctx.tgt && ctx.tgt.kind === 'hero' ? ctx.tgt : u.ai && u.ai.target; if (!t || !t.alive) return;
          const low = u.hpPct < 0.35;
          let r = m.rng.next(), pick;
          if (H.T(u, '12b')) pick = low ? 'swap' : 'all';
          else if (H.T(u, '12c') && low) pick = r < 0.25 ? 'night' : r < 0.6 ? 'all' : r < 0.8 ? 'cannon' : 'swap';
          else pick = r < 0.45 ? 'all' : r < 0.75 ? 'cannon' : r < 0.95 ? 'swap' : r < 0.998 ? 'night' : 'death';
          if (pick === 'death') {   // Thần Chết Bịp Bợm
            if (m.fxOn) m.fx({ type: 'callout', id: t.id, text: '☠ THẦN CHẾT BỊP BỢM', color: '#ff4a4a' });
            m.damage(u, t, t.hp + 9999, 'true', { tag: 's4' }); return;
          }
          const dmg = H.amt(u, ctx.v([150, 250, 350]), 0, 0.8);
          if (pick === 'all') applyCard(m, u, 'all', t, dmg * 0.55);
          else if (pick === 'cannon') { const v = H.dirTo(u, t); m.hitLine(u, u.x, u.y, v.x, v.y, 10, 2.5, (e) => m.damage(u, e, dmg, 'magic', { tag: 's4' }), { color: '#ffd24a' }); }
          else if (pick === 'swap') {
            const a = u.hpPct, b = t.hpPct;
            const na = Math.min(b, a + 0.3), nb = Math.max(a, b - 0.3);
            u.hp = Math.max(1, u.st.maxHp * na); t.hp = Math.max(1, t.st.maxHp * nb);
            if (m.fxOn) m.fx({ type: 'chain', a: u.id, b: t.id, life: 0.6 });
          } else {
            m.addStatus(t, 'stun', 2.5, 1, { src: u });
            for (const e of m.enemiesIn(u.team, t.x, t.y, 3, { heroesOnly: true })) if (e !== t) m.addStatus(e, 'stun', 1.5, 1, { src: u });
          }
          if (m.fxOn) m.fx({ type: 'note', id: u.id, k: pick });
        },
        ai: { use: 'ult', aim: 'unit', range: 7, heroOnly: true },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 6, role: 'mage' },
    tags: ['heal', 'cc', 'poke'],
  });
  G.HEROES.joker.cardName = NAME;
  G.HEROES.joker.tree = [
    [
      { name: 'Tay Nhanh Hơn Mắt', desc: 'Phi Bài bay nhanh hơn 40% và xa thêm 2 đv.' },
      { name: 'Trộm Vặt', desc: 'Bắt đầu trận với thêm 300 vàng.' },
      { name: 'Nhà Cái Kiếm Tiền', desc: '+10% vàng nhận được.', stats: { goldPct: 0.1 } },
    ],
    [
      { name: 'Bích Độc Đao', desc: 'Lá Bích +40% sát thương lên mục tiêu dưới 40% máu.' },
      { name: 'Tép Ngạt Khí', desc: 'Khống chế của lá Tép kéo dài thêm 0.5s.' },
      { name: 'Lừa Tình Tuyệt Đỉnh', desc: 'Giả Ngây Ngô: +15% tỉ lệ né đòn đánh thường của tướng.' },
    ],
    [
      { name: 'Vui Thôi Nào!', desc: 'Mỗi lần Bịp Bợm nhân đôi: hồi 30 mana và +20% tốc chạy 2s.' },
      { name: 'Phi Ba Lá', desc: 'Phi Bài phóng rẻ quạt 3 lá cùng chất.' },
      { name: 'Bài Ảo Đánh Lạc Hướng', desc: 'Tráo Bài để lại hình nhân bài giấy 3s, bị phá thì phát nổ làm chậm.' },
    ],
    [
      { name: 'Đạo Tặc Thần Tốc', desc: 'Dùng bản sao từ Mượn Tý Nha!: +30% sát thương 3s.' },
      { name: 'Bàn Tay Điêu Luyện', desc: 'Rút Bài không còn rút hụt.' },
      { name: 'Bộ Bài Vô Tận', desc: 'Tỉ lệ nhân đôi của Phi Bài lên 40%, Rút Bài và Tráo Bài lên 20%.' },
    ],
    [
      { name: 'Thần Bài Gian Lận', desc: 'Bỏ lá Cơ, lá Joker 25%; lá Bích/Tép/Rô mang thêm hiệu ứng của một chất ngẫu nhiên.' },
      { name: 'Gian Lận Tối Thượng', desc: 'Ván Cờ luôn ra Lá Toàn Năng, hoặc Tráo Sinh Mệnh khi Joker dưới 35% máu.' },
      { name: 'Ván Cược Sinh Tử', desc: 'Dưới 35% máu: Ván Cờ có 25% ra Cơn Ác Mộng.' },
    ],
  ];
})();
