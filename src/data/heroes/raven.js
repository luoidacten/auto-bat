'use strict';
// ===== Raven — Súng Bắn Tỉa • Hỗ trợ / Xạ thủ • trinh sát, bắn tỉa • mana • vật lý =====
(function () {
  const G = globalThis.G, H = G.H, M = G.M;
  const OCA = 'oca_mark';
  const MAG = 30, MAG_B = 5, RL_B = 6, NIGHT = 'raven_night';
  // GĐ9 (theo bản Legacy): hai băng đạn độc lập — súng trường (A) 30 viên, súng tỉa (B) 5 viên; chỉ nạp khi bắn cạn băng
  const magA = (u) => H.mag(u, H.T(u, '9b') ? 45 : MAG), magB = (u) => H.mag(u, MAG_B);
  // tầm súng tỉa: +7.5 đv; Oca còn sống thì gần như vô hạn (bắn bất cứ kẻ nào Oca / Raven nhìn thấy)
  const scopeR = (u) => (u.ws.oca && u.ws.oca.alive ? G.C.MAP : 7.5);
  function reveal(m, u) { if (!H.T(u, '9a') && u.has('stealth')) u.revealedT = Math.max(u.revealedT, m.time + 1.2); }
  // ===== Quạ Cơ Giới Oca (GĐ6c): vật bay thật — bay thẳng qua tường tới điểm thả, lượn vòng trên đầu con mồi gần nhất,
  // cho tầm nhìn 8 đv (lộ tàng hình), mỗi giây thả bom mini. Có máu, BỊ BẮN HẠ được. =====
  const OCA_R = 10, OCA_LEASH = 60, OCA_HUNT = 26;   // GĐ9: Oca bay rất xa, tự tìm con mồi yếu máu
  function ocaBase(u) { return { hp: 120 + 28 * u.level, armor: 12 + u.level, mr: 12 + u.level, ad: 0, as: 0.1, ms: 11, range: 0 }; }
  function makeOca(m, u, pt, life) {
    if (u.ws.oca && u.ws.oca.alive) { u.ws.oca.expired = true; m.kill(u.ws.oca, null); }
    const o = new G.Unit(m, { kind: 'pet', team: u.team, x: u.x + u.fx * 0.6, y: u.y + u.fy * 0.6, r: 0.42, ranged: false, base: ocaBase(u) });
    o.owner = u; o.name = 'Oca'; o.gfx = 'crow'; o.color = '#2a3140'; o.fly = true; o.noCollide = true; o.scoutPet = true;
    o.visionR = OCA_R; o.trueSight = true;
    o.anchor = { x: pt.x, y: pt.y }; o.until = m.time + life; o.bombT = m.time + 0.8; o.orbit = 0; o.petThink = ocaThink;
    o.onDeath = (mm) => {
      if (u.ws.oca === o) u.ws.oca = null;   // súng tỉa vẫn giữ, nhưng tầm co về +7.5 (AI tự đổi chỗ nếu mục tiêu ngoài tầm)
      if (!o.expired) { if (mm.fxOn) { mm.fx({ type: 'burst', x: o.x, y: o.y, color: '#8aa0c8' }); mm.fx({ type: 'callout', id: u.id, text: '🐦 Oca bị bắn hạ!', color: '#ff9a9a' }); } }
      else if (H.T(u, '12b')) {   // Oca Tự Sát: hết giờ thì lao xuống tướng bị đánh dấu gần nhất
        const t = mm.heroes.filter((h) => h.alive && h.team !== u.team && h.hasKey(OCA) && M.dist(h, o) < 10).sort((a, b) => M.dist2(a, o) - M.dist2(b, o) || a.id - b.id)[0];
        if (t) mm.hitCircle(u, t.x, t.y, 3, (e) => { mm.damage(u, e, H.amt(u, 100 + 20 * u.level, 0.8), 'phys', { tag: 's2', aoe: true }); mm.addStatus(e, 'stun', 1.5, 1, { src: u }); }, { color: '#6a7a9a' });
      }
    };
    m.addUnit(o); m.pets.push(o);
    u.ws.oca = o;
    if (m.fxOn) m.fx({ type: 'sfx', name: 'crow_caw' });
    return o;
  }
  // mỗi bước logic: bay thẳng (không vướng tường), lượn quanh điểm neo; điểm neo bám con mồi gần nhất trong tầm nhìn quạ
  function ocaThink(m, o) {
    const u = o.owner, dt = G.C.TICK;
    if (!u || !u.alive || m.time >= o.until) { o.expired = true; m.kill(o, null); return; }
    o.goal = null; o.attackTarget = null;
    // con mồi: kẻ địch Raven đang thấy trong 26 đv quanh quạ — ưu tiên máu thấp, đã bị đánh dấu
    const prey = m.heroes.filter((h) => h.alive && h.team !== u.team && M.dist(h, o) < OCA_HUNT && h.vis[u.team])
      .sort((a, b) => (a.hpPct - (a.hasKey(OCA) ? 0.1 : 0)) - (b.hpPct - (b.hasKey(OCA) ? 0.1 : 0)) || M.dist2(a, o) - M.dist2(b, o) || a.id - b.id)[0];
    o.prey = prey || null;
    if (prey) { o.anchor.x += (prey.x - o.anchor.x) * Math.min(1, dt * 2); o.anchor.y += (prey.y - o.anchor.y) * Math.min(1, dt * 2); }
    // không bay quá xa Raven
    const dA = M.dist(o.anchor, u); if (dA > OCA_LEASH) { o.anchor.x = u.x + (o.anchor.x - u.x) / dA * OCA_LEASH; o.anchor.y = u.y + (o.anchor.y - u.y) / dA * OCA_LEASH; }
    o.anchor.x = Math.max(2, Math.min(G.C.MAP - 2, o.anchor.x)); o.anchor.y = Math.max(2, Math.min(G.C.MAP - 2, o.anchor.y));
    const far = M.dist(o, o.anchor) > 3.2;
    o.orbit += dt * (far ? 0 : 1.7);
    const R = 2.2, gx = o.anchor.x + M.cos(o.orbit) * R, gy = o.anchor.y + M.sin(o.orbit) * R;
    const dx = gx - o.x, dy = gy - o.y, L = Math.sqrt(dx * dx + dy * dy);
    if (L > 1e-4) { const st = Math.min(L, o.st.ms * dt); o.x += dx / L * st; o.y += dy / L * st; o.fx = dx / L; o.fy = dy / L; }
    // bom mini mỗi giây: rơi từ quạ xuống kẻ địch gần nhất trong 4 đv (đạn thấy được)
    if (m.time >= o.bombT) {
      o.bombT = m.time + 1;
      const e = m.enemiesIn(u.team, o.x, o.y, 4).filter((x) => x !== o && x.kind !== 'monster').sort((a, b) => (b.kind === 'hero') - (a.kind === 'hero') || M.dist2(a, o) - M.dist2(b, o) || a.id - b.id)[0];
      if (e) m.proj({ owner: u, x: o.x, y: o.y, target: e, speed: 14, r: 0.3, kind: 'bomb', onHit: (mm, p, t) => {
        mm.damage(u, t, 20 + 5 * u.level + 0.2 * u.st.ad, 'phys', { tag: 's2', aoe: true });
        mm.addStatus(t, 'slow', 1, 0.3, { src: u, key: 'oca_slow' }); mm.addStatus(t, 'mark', 4, 1, { key: OCA, src: u });
        if (H.T(u, '9c')) mm.addStatus(t, 'vuln', 4, 0.1, { key: 'oca_vuln', src: u });
        if (H.T(u, '3c')) { const v = H.dirTo(o, t); mm.knock(u, t, v.x, v.y, 0.8, 0.15); }
        if (mm.fxOn) mm.fx({ type: 'boom', x: t.x, y: t.y, r: 0.9, color: '#8aa0c8' });
      } });
    }
  }
  // ===== Súng ngắm: đứng yên, bắn xa qua tầm nhìn của Oca (tầm +7.5, chậm hơn, mỗi viên mạnh hơn) =====
  const SCOPE = 'raven_scope';
  function startScope(m, u) {
    u.ws.scope = true; u.ws.scopeT = m.time; u.ws.scopeIdle = m.time; u.projKindNow = 'sniper';
    m.addStatus(u, 'buff', 0.3, 1, { key: SCOPE, mods: { range: scopeR(u), asPct: -0.35 } });
    if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🎯 Ngắm bắn tỉa', color: '#cfe0ff' });
  }
  function endScope(m, u) {
    if (!u.ws.scope) return;
    u.ws.scope = false; u.projKindNow = null;
    u.statuses = u.statuses.filter((st) => st.key !== SCOPE); u.dirty = true;
    if (m.fxOn && u.alive) m.fx({ type: 'callout', id: u.id, text: '🔫 Đổi súng trường', color: '#cfd8e0' });
  }
  // ===== AI riêng: tìm chỗ an toàn → thả quạ về phía đối thủ → đổi súng ngắm, đứng bắn qua tầm nhìn của quạ =====
  // Bị áp sát (< 6 đv), bị đánh, máu < 30%, phải rút lui / chạy bo → đổi lại súng trường, đánh như thường.
  function ravenMicro(ai, enemies) {
    const m = ai.m, u = ai.u, near = enemies.filter((e) => M.dist(e, u) < 6.5);
    const hitByHero = m.time - (u.lastAttT || -99) < 0.8 && u.lastAtt && u.lastAtt.kind === 'hero' && M.dist(u.lastAtt, u) < 10;
    const busy = ai.act === 'retreat' || ai.act === 'zone' || ai.act === 'heal' || ai.act === 'shop' || (m.zoneSt.dps > 0 && !m.inZone(u, 0)) || u.duel;
    const arR = u.base.range + u.r;                                       // tầm súng trường
    const visFoes = () => m.heroes.filter((h) => h.alive && h.team !== u.team && h.vis[u.team] && !(G.Persona && G.Persona.isAlly && G.Persona.isAlly(m, u, h)));
    if (u.ws.scope) {
      // bị áp sát / bị đánh / máu thấp / phải chạy → đổi súng trường, thả diều như thường
      if (near.length || hitByHero || u.hpPct < 0.3 || busy) { endScope(m, u); ai.scopePlan = null; return false; }
      const R = u.st.range + u.r;
      const cand = visFoes().filter((h) => M.dist(h, u) <= R + h.r).sort((a, b) => (b.hasKey(OCA) ? 1 : 0) - (a.hasKey(OCA) ? 1 : 0) || a.hpPct - b.hpPct || a.id - b.id);
      u.goal = null;
      const t = cand[0];
      if (t) {
        u.ws.scopeIdle = m.time;
        ai.mode = 'fight'; ai.target = t; u.attackTarget = t; u.face(t.x, t.y);
        if (m.canCast(u, 's1') && M.dist(t, u) < 13.5) ai.useSkills(t, ['poke'], false);
        return true;
      }
      u.attackTarget = null; if (ai.mode === 'fight') ai.mode = 'idle';
      // không ai trong tầm súng tỉa: biết vị trí con mồi ở xa (≤ 60 đv, thấy trong 8s) → bỏ ngắm, đi tìm chỗ bắn mới
      if (m.time - u.ws.scopeIdle > 1.5) {
        let best = null, bd = 99;
        for (const [id, k] of ai.mem || []) { const e = m.heroById(id); if (!e || !e.alive || m.time - k.t > 8) continue; const d = Math.hypot(k.x - u.x, k.y - u.y); if (d < bd && d < 60) { bd = d; best = { id, x: k.x, y: k.y }; } }
        endScope(m, u);
        if (best) { ai.scopePlan = null; ai.relocate = { tgt: best, until: m.time + 6 }; ai.callout('🔭 Đổi chỗ bắn tỉa', '#cfe0ff'); }
        return false;
      }
      return true;
    }
    if (busy || near.length || u.hpPct < 0.45 || u.cast || u.dash) { ai.scopePlan = null; ai.relocate = null; return false; }
    // 1) thấy kẻ địch ngoài tầm súng trường nhưng trong tầm súng tỉa → đứng lại ngắm ngay (không cần quạ)
    const R1 = arR + scopeR(u);
    const far = visFoes().filter((h) => { const d = M.dist(h, u); return d > arR + 0.5 && d <= R1 + h.r; });
    if (far.length && m.rngAI.next() < 0.35 + 0.55 * ai.sk('fight')) { startScope(m, u); ai.relocate = null; return true; }
    // 2) đang đi tìm chỗ bắn mới: tới cách con mồi một quãng an toàn (ngoài tầm đánh của nó) rồi ngắm
    if (ai.relocate && m.time < ai.relocate.until) {
      const g = ai.relocate.tgt, k = ai.mem && ai.mem.get(g.id), at = k ? { x: k.x, y: k.y } : g, e0 = m.heroById(g.id);
      const want = Math.max(10, (e0 ? e0.st.range + e0.r : 6) + 4.5), d = Math.hypot(at.x - u.x, at.y - u.y);
      if (d > want + 2) { const v = H.dirTo(at, u), spot = { x: at.x + v.x * want, y: at.y + v.y * want }; G.MAP.pushOut(spot, u.r); u.attackTarget = null; ai.goTo(spot); return true; }
      ai.relocate = null;
    }
    // 3) thả quạ: S2 sẵn sàng, biết vị trí một đối thủ ở xa (8–40 đv, thấy trong 8s gần nhất)
    if (!m.canCast(u, 's2')) { ai.scopePlan = null; return false; }
    let plan = ai.scopePlan;
    if (!plan || m.time > plan.until) {
      let best = null, bd = 99;
      for (const [id, k] of ai.mem || []) {
        const e = m.heroById(id); if (!e || !e.alive || m.time - k.t > 8) continue;
        const d = Math.hypot(k.x - u.x, k.y - u.y); if (d < 8 || d > 40) continue;
        // Oca thích con mồi yếu máu
        const sc = d - (1 - (k.hp != null ? k.hp : e.hpPct)) * 15;
        if (sc < bd) { bd = sc; best = { id, x: k.x, y: k.y }; }
      }
      if (!best) { ai.scopePlan = null; return false; }
      if (m.rngAI.next() > 0.35 + 0.5 * ai.sk('fight')) { ai.scopePlan = { none: true, until: m.time + 3 }; return false; }
      // chỗ an toàn: ngoài tầm đánh của đối thủ (tầm + 4.5, tối thiểu 12 đv); có bụi gần đó thì núp bụi
      const e0 = m.heroById(best.id), reach = e0 ? e0.st.range + e0.r + u.r : 6;
      const want = Math.max(12, reach + 4.5), v = H.dirTo(best, u), dNow = Math.hypot(best.x - u.x, best.y - u.y);
      let spot = dNow >= want ? { x: u.x, y: u.y } : { x: best.x + v.x * want, y: best.y + v.y * want };
      for (const b of G.MAP.bushes) { const db = M.dist(b, best); if (M.dist(b, u) < 7 && db >= want - 1 && db <= 30) { spot = { x: b.x, y: b.y }; break; } }
      G.MAP.pushOut(spot, u.r);
      if (m.zoneSt.dps > 0 && !m.inZone(spot, 1)) spot = { x: u.x, y: u.y };
      plan = ai.scopePlan = { tgt: best, spot, until: m.time + 1 + M.dist(u, spot) / Math.max(1, u.st.ms) };
      ai.callout('🐦 Tìm chỗ thả quạ', '#cfe0ff');
    }
    if (plan.none) return false;
    if (M.dist(u, plan.spot) > 0.8 && m.time < plan.until) { u.attackTarget = null; ai.goTo(plan.spot); return true; }
    // tới nơi: thả quạ về phía đối thủ rồi ngắm bắn tỉa
    const e = m.heroById(plan.tgt.id), k = ai.mem && ai.mem.get(plan.tgt.id);
    const pt = e && e.vis[u.team] ? { x: e.x, y: e.y } : k ? { x: k.x, y: k.y } : plan.tgt;
    u.goal = null; u.attackTarget = null;
    u.ws.wantScope = true;
    const ok = m.castSkill(u, 's2', null, pt);
    if (!ok) u.ws.wantScope = false;
    ai.scopePlan = null;
    return !!ok;
  }
  H.def({
    id: 'raven', name: 'Raven', color: '#6a7a9a', gfx: 'rifle', kit: 'marksman', pos: ['sup', 'adc'], dmgType: 'phys',
    ranged: true, projSpeed: 34, projKind: 'bullet', r: 0.58, resource: 'mana',
    // băng đang dùng: súng tỉa khi đang ngắm, súng trường khi thường
    gun: (m, u) => (u.ws.scope ? { n: u.ws.ammoB, max: magB(u), rl: u.ws.rlB, rlMax: u.ws.rlBMax || RL_B } : { n: u.ws.ammo, max: magA(u), rl: u.ws.rl, rlMax: u.ws.rlMax || 3 }),
    gunSet(m, u, n) {
      if (u.ws.scope) { u.ws.ammoB = n; if (n > 0 && u.ws.rlB > 0) { u.ws.rlB = 0; H.reloadDone(m, u); u.atkT = Math.min(u.atkT, 0.15); } return; }
      u.ws.ammo = n; if (n > 0 && u.ws.rl > 0) { u.ws.rl = 0; H.reloadDone(m, u); u.atkT = Math.min(u.atkT, 0.15); }
    },
    // đạn súng tỉa: bay rất nhanh; mục tiêu bị Oca đánh dấu thì xuyên địa hình
    autoProj: (m, u, t) => (u.ws.scope ? { speed: H.T(u, '1c') ? 80 : 60, passWall: !!(t && t.hasKey && t.hasKey(OCA)) } : null),
    stats: { range: 7.2, ad: 55, adG: 3.3, as: 0.6, asG: 0.025, hp: 550, ms: 3.35 },
    passive: {
      name: 'Sát Thủ Chuyên Nghiệp',
      desc: 'Hai băng đạn độc lập (bản Legacy): SÚNG TRƯỜNG 30 viên (mỗi phát 3 viên, nạp 3s) — mục tiêu càng xa đạn càng mạnh (tối đa +25% từ 8 đv) • SÚNG TỈA 5 viên (nạp 6s, mỗi viên ×1.6 sát thương). Thấy kẻ địch ngoài tầm súng trường thì đứng lại NGẮM: tầm +7.5; khi quạ Oca còn sống, tầm gần như vô hạn — bắn bất cứ kẻ nào Oca / Raven nhìn thấy, liên tục tới khi Oca bị hạ. Di chuyển là thôi ngắm. Chỉ nạp khi bắn cạn băng; tốc đánh và Tốc Nạp rút ngắn thời gian nạp.',
      init(m, u) { u.ws.ammo = MAG; u.ws.rl = 0; u.ws.ammoB = MAG_B; u.ws.rlB = 0; },
      update(m, u, dt) {
        // súng ngắm: giữ khi Oca còn sống và Raven đứng yên; di chuyển / Oca chết thì đổi lại súng trường
        if (u.ws.scope) {
          const oca = u.ws.oca;
          if ((H.moving(u) && m.time - u.ws.scopeT > 0.4) || u.dash) endScope(m, u);
          else {
            const st = u.hasKey(SCOPE), R = scopeR(u);
            if (st && st.mods.range === R) st.t = 0.3; else { u.statuses = u.statuses.filter((x) => x.key !== SCOPE); m.addStatus(u, 'buff', 0.3, 1, { key: SCOPE, mods: { range: R, asPct: -0.35 } }); u.dirty = true; }
            // băng súng tỉa: chỉ nạp khi cạn
            if (u.ws.ammoB <= 0) { if (!(u.ws.rlB > 0)) { u.ws.rlB = u.ws.rlBMax = H.rlTime(u, RL_B); H.reloadStart(m, u); } u.atkT = Math.max(u.atkT, u.ws.rlB); }
          }
        }
        if (u.ws.rlB > 0) { u.ws.rlB -= dt; if (u.ws.rlB <= 0) { u.ws.ammoB = magB(u); if (u.ws.scope) H.reloadDone(m, u); } }
        const mag = magA(u);
        const rlA = () => { u.ws.rl = u.ws.rlMax = H.rlTime(u, H.T(u, '1a') ? 2.2 : 3); H.reloadStart(m, u); };   // GĐ9: theo tốc đánh + Tốc Nạp
        if (u.ws.rl > 0) { u.ws.rl -= dt; if (u.ws.rl <= 0) { u.ws.ammo = mag; H.reloadDone(m, u); } }
        if (u.ws.ammo <= 0) { if (u.ws.rl <= 0) rlA(); u.atkT = Math.max(u.atkT, u.ws.rl); }
        if (u.ws.ammo < mag && u.ws.rl <= 0 && m.time - u.combatT > 5) rlA();
      },
      onAuto(m, u, t, info) {
        if (u.ws.scope) {   // phát súng tỉa: tốn 1 viên băng súng tỉa, mạnh hơn 60%
          u.ws.ammoB = Math.max(0, u.ws.ammoB - 1);
          info.amt *= 1.6; reveal(m, u);
          if (u.ws.night > m.time) info.amt *= 1.3;
          return;
        }
        u.ws.ammo = Math.max(0, u.ws.ammo - 3);
        const d = M.dist(u, t);
        info.amt *= 1 + 0.25 * Math.max(0, Math.min(1, (d - 3) / 5));
        if (u.ws.night > m.time) info.amt *= 1.3;
        if (H.T(u, '12a')) info.amt *= 0.6;
        reveal(m, u);
        if (H.T(u, '6c')) info.extra.push(() => { for (const p of m.projs) if (!p.dead && p.team !== u.team && M.dist(p, u) < 3 && p.kind !== 'giantarrow') { p.dead = true; break; } });
      },
      onSkill(m, u) { reveal(m, u); },
      onKill(m, u, v) { if (H.T(u, '12c') && v.kind === 'hero' && u.ws.night > m.time) { u.ws.night += 3; m.nightOthers(u.team, u.ws.night); m.addStatus(u, 'stealth', u.ws.night - m.time, 1, { key: NIGHT }); } },
    },
    skills: {
      s1: {
        name: 'Bắn Tỉa Xuyên Phá', desc: 'Ngắm 0.75s rồi bắn 1 phát tầm cực xa (14 đv). Bị áp sát (dưới 2.2 đv): lăn lùi 3 đv (né đòn khi lăn) rồi mới bóp cò. Mục tiêu bị Oca đánh dấu: đạn xuyên địa hình và phá lá chắn.',
        cd: [10, 9.5, 9, 8.5, 8], cost: [50, 55, 60, 65, 70],
        // bị áp sát: lăn lùi trước khi ngắm
        castTime(m, u) {
          const e = m.enemiesIn(u.team, u.x, u.y, 2.2 + u.r, { heroesOnly: true })[0];
          if (!e) return 0.75;
          const v = H.dirTo(e, u), q = { x: u.x + v.x * 3, y: u.y + v.y * 3 }; G.MAP.pushOut(q, u.r);
          m.dashTo(u, q.x, q.y, 16, { invuln: true });
          if (m.fxOn) m.fx({ type: 'dashtrail', id: u.id, x: u.x, y: u.y, x2: q.x, y2: q.y, color: '#8aa0c8' });
          return 0.6;
        },
        use(m, u, ctx) {
          if (H.T(u, '12a')) u.cd.s1 *= 0.5;
          const dmg = H.amt(u, ctx.v([100, 150, 200, 250, 300]), 1.0);
          const t = ctx.tgt && ctx.tgt.alive ? ctx.tgt : null;
          const aim = t && u.ai ? u.ai.lead(t, H.T(u, '1c') ? 60 : 40) : ctx.pt;
          const marked = t && t.hasKey(OCA);
          const p0 = { x: u.x, y: u.y };
          H.shoot(m, u, aim, { speed: H.T(u, '1c') ? 60 : 40, range: 14, r: 0.4, kind: 'bigarrow', passWall: !!marked, onHit: (mm, p, e) => {
            if (e.hasKey(OCA)) { mm.removeStatus(e, 'shield'); if (H.T(u, '3a')) mm.addStatus(e, 'root', 1, 1, { src: u }); }
            const far = H.T(u, '12a') && M.dist(p0, e) > 10 ? 1.5 : 1;
            mm.damage(u, e, dmg * far, 'phys', { tag: 's1' });
            // Phát Bắn Bồi: dùng lại để nổ điểm ghim, đẩy lùi thêm
            if (H.T(u, '6a')) mm.allowRecast(u, 's1', 1, (m3, u3) => { if (e.alive) { const v = H.dirTo(u3, e); m3.damage(u3, e, dmg * 0.3, 'phys', { tag: 's1' }); m3.knock(u3, e, v.x, v.y, 2, 0.2); } });
          } });
        },
        ai: { use: 'poke', range: 13, aim: 'point', speed: 40, heroOnly: true, recastWhen: () => true },
      },
      s2: {
        name: 'Quạ Cơ Giới Oca', desc: 'Thả quạ cơ giới bay thẳng (qua cả tường) tới điểm trong 40 đv rồi TỰ TÌM CON MỒI YẾU MÁU (trong 26 đv quanh nó), lượn trên đầu nó 20s: cho tầm nhìn 10 đv, lộ tàng hình; mỗi giây thả bom mini vào 1 kẻ địch trong 4 đv — làm chậm 30% và đánh dấu 4s. Oca có máu riêng và có thể bị bắn hạ. Oca còn sống: tầm súng tỉa gần như vô hạn. Thả quạ từ chỗ an toàn thì Raven đổi sang SÚNG NGẮM: đứng yên, tầm bắn +7.5 (bắn qua tầm nhìn của quạ), chậm hơn 35% nhưng mỗi viên mạnh hơn 45%; di chuyển hoặc Oca chết thì đổi lại súng trường.',
        cd: [22, 21, 20, 19, 18], cost: [60, 60, 60, 60, 60],
        use(m, u, ctx) {
          const p = H.toward(u, ctx.pt, 40, true), life = H.T(u, '9c') ? 30 : 20;
          const o = makeOca(m, u, p, life);
          if (u.ws.wantScope) { u.ws.wantScope = false; startScope(m, u); }
          return o;
        },
        // AI dùng chiêu này qua ravenMicro (tìm chỗ an toàn → thả quạ → súng ngắm), không ném bừa trong giao tranh
        ai: { use: 'custom', range: 40, aim: 'point', pick: () => null, noMonster: true },
      },
      s3: {
        name: 'Kỹ Thuật Ẩn Nấp', desc: 'Bom khói bán kính 3 trong 3s: Raven tàng hình khi đứng trong khói, kẻ địch trong khói bị mù.',
        cd: [18, 17, 16, 15, 14], cost: [50, 50, 50, 50, 50],
        use(m, u, ctx) {
          if (H.T(u, '6b')) {   // Dây Đu Thoát Hiểm
            const p = H.toward(u, ctx.pt, 6, false); m.dashTo(u, p.x, p.y, 22, { wall: true, untarget: true }); return;
          }
          const R = H.T(u, '1b') ? 3.9 : 3, T = H.T(u, '1b') ? 4.5 : 3, c = { x: u.x, y: u.y };
          m.zone({ owner: u, x: c.x, y: c.y, r: R, life: T, every: 0.2, kind: 'smoke', tick: (mm, z) => {
            if (M.dist(u, z) <= z.r) mm.addStatus(u, 'stealth', 0.35, 1, { key: 'raven_smoke' });
            mm.hitCircle(u, z.x, z.y, z.r, (e) => { mm.addStatus(e, 'blind', 0.35, 1, { src: u }); if (H.T(u, '3b') && e.kind === 'hero') mm.addStatus(e, 'silence', 0.35, 1, { src: u }); }, { noFx: true });
          } });
        },
        ai: { use: 'escape', range: 4, aim: 'away' },
      },
      s4: {
        name: 'Màn Đêm Vĩnh Cửu', desc: '5s: tầm nhìn mọi tướng đối phương co còn 40%; Raven tàng hình (nổ súng thì lộ 1.2s), đạn +30% sát thương.',
        cd: [120, 100, 80], cost: [100, 100, 100], castTime: 0.2,
        use(m, u) {
          u.ws.night = m.time + 5; m.nightOthers(u.team, u.ws.night);
          m.addStatus(u, 'stealth', 5, 1, { key: NIGHT });
          if (m.fxOn) m.fx({ type: 'night', by: u.team, x: u.x, y: u.y, life: 5 });
        },
        ai: { use: 'ult', aim: 'self', range: 9 },
      },
    },
    ai: { order: ['s1', 's2', 's3'], engageRange: 7, role: 'adc', micro: ravenMicro },
    tags: ['stealth', 'poke'],
  });
  G.HEROES.raven.tree = [
    [
      { name: 'Nạp Đạn Nhanh', desc: 'Nạp băng súng trường 2.2s (thay vì 3s).' },
      { name: 'Khói Dày', desc: 'Bom khói tồn tại lâu hơn 1.5s và rộng hơn 30%.' },
      { name: 'Đạn Sơ Tốc Cao', desc: 'Đạn bắn tỉa bay nhanh hơn 50%.' },
    ],
    [
      { name: 'Cắt Gân Tầm Xa', desc: 'Bắn tỉa trúng mục tiêu bị Oca đánh dấu: trói chân 1s.' },
      { name: 'Khói Độc Thần Kinh', desc: 'Tướng địch trong khói bị câm lặng.' },
      { name: 'Oca Vũ Trang', desc: 'Bom mini của Oca đẩy văng nhẹ.' },
    ],
    [
      { name: 'Phát Bắn Bồi', desc: 'Bắn tỉa trúng: trong 1s dùng lại để nổ điểm ghim — thêm 30% sát thương và đẩy lùi 2 đv.' },
      { name: 'Dây Đu Thoát Hiểm', desc: 'Bom khói thay bằng dây móc: đu người 6 đv (xuyên tường, không thể bị chọn).' },
      { name: 'Đạn Hợp Kim Titan', desc: 'Mỗi phát súng trường phá tan 1 đạn đạo nhỏ đang bay quanh Raven.' },
    ],
    [
      { name: 'Kẻ Đi Săn Vô Hình', desc: 'Nổ súng khi đang tàng hình không còn làm lộ diện.' },
      { name: 'Băng Đạn Mở Rộng', desc: 'Băng súng trường 45 viên.' },
      { name: 'Mắt Quạ Tử Thần', desc: 'Oca tồn tại 30s (thay vì 20s); mục tiêu bị đánh dấu nhận thêm 10% sát thương.' },
    ],
    [
      { name: 'Thiện Xạ Độc Hành', desc: 'Bắn tỉa hồi nhanh gấp đôi và ×1.5 khi bắn xa trên 10 đv; đánh thường −40% sát thương.' },
      { name: 'Oca Tự Sát', desc: 'Hết giờ, Oca lao xuống tướng bị đánh dấu gần nhất: nổ bán kính 3, choáng 1.5s.' },
      { name: 'Vọng Âm Đêm Tối', desc: 'Trong Màn Đêm, mỗi lần hạ gục tướng kéo dài bóng tối thêm 3s.' },
    ],
  ];
})();
