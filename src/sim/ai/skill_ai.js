'use strict';
// ===== UTILITY AI CHO CHIÊU & KHI BỊ ĐUỔI (GĐ5e) =====
// Chuỗi chiêu giao tranh với tướng vẫn là luật riêng từng tướng (HeroAI.useSkills). Ngoài ra tuyển thủ chấm điểm 0–1
// (trung bình nhân các yếu tố qua đường cong phản hồi, như Utility AI quyết định lớn) cho:
//   • ĂN / DỌN / ĐẨY LÍNH bằng chiêu: chiêu kết liễu được lính mà đánh thường không kịp, chiêu diện rộng trúng nhiều lính.
//     Sát thương chiêu lên lính được "học" từ những lần trúng trước (lần đầu đoán dè dặt).
//   • DI CHUYỂN: lướt theo hướng đi khi phải đi xa (đảo đường, về thủ, tới mục tiêu); chiêu xuyên tường thì thử lướt thẳng
//     qua tường nếu rút ngắn được đường đi (VƯỢT ĐỊA HÌNH).
//   • BỊ ĐUỔI: chạy thẳng về chỗ an toàn • dùng chiêu thoát thân / Tốc Biến (chọn điểm đáp: xa kẻ đuổi, gần chỗ an toàn,
//     bên kia tường, trong bụi, ngoài tầm trụ địch) • cắt đuôi qua bụi (mất tầm nhìn thì kẻ đuổi buông) • quay lại đánh
//     (thắng thế, kẻ đuổi sắp chết, hoặc hết đường chạy thì liều).
// Chỉ dùng thông tin trong tầm nhìn của đội (vis[team]); nhiễu lấy từ luồng ngẫu nhiên "ai" có hạt giống.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, M = G.M, MAP = G.MAP;
  const { dist } = M;
  const MS = C.MS || 1;
  const cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const { lin, logi, floor } = G.UtilityAI.Curve;
  const gmean = (f) => { let p = 1; for (const [, v] of f) p *= Math.max(0, v); return Math.pow(p, 1 / f.length); };
  const why = (f) => f.map(([l, v]) => `${l} ${Math.round(v * 100)}%`).join(' · ');

  // chiêu di chuyển dùng được không cần mục tiêu (đo bằng cách thử từng chiêu): r = tầm lướt,
  // back = nhảy lùi (bật ngược hướng nhìn / tránh xa địch gần nhất), wall = xuyên tường
  const MOBILITY = {
    clint: { s3: { r: 4 } }, ignatius: { s3: { r: 6, wall: true } }, elara: { s3: { r: 3.5, back: true } }, zero: { s3: { r: 3, back: true } },
    alice: { s2: { r: 4 } }, thanhphong: { s3: { r: 4 } }, roxie: { s3: { r: 3, back: true } }, joker: { s3: { r: 3 } },
    percy: { s3: { r: 4 } }, chrononeo: { s3: { r: 4 } }, jack: { s3: { r: 3.5 } }, raven: { s3: { r: 6, wall: true } },
  };
  const isMob = (u, k) => !!(MOBILITY[u.heroId] && MOBILITY[u.heroId][k]);

  // các chiêu lướt đang dùng được
  function mobility(ai, travel) {
    const m = ai.m, u = ai.u, out = [];
    const T = MOBILITY[u.heroId] || {};
    for (const k in T) {
      const def = u.hero.skills[k];
      if (!def || !def.ai || def.ai.aim !== 'away' || !(def.ai.use === 'escape' || def.ai.alsoEscape)) continue;   // bản cập nhật đổi chiêu → bỏ qua
      if (!m.canCast(u, k)) continue;
      out.push({ k, r: T[k].r, back: !!T[k].back, wall: !!T[k].wall, cd: m.cdOf(u, k), cost: m.costOf(u, k), name: def.name });
    }
    return out;
  }
  // điểm đáp khi lướt theo hướng (vx, vy): lướt thường dừng ở chân tường, xuyên tường thì bị đẩy ra khỏi tường ở cuối
  function landing(u, vx, vy, r, wall) {
    const clampP = (p) => { p.x = Math.max(1.5, Math.min(C.MAP - 1.5, p.x)); p.y = Math.max(1.5, Math.min(C.MAP - 1.5, p.y)); return p; };
    const p = clampP({ x: u.x + vx * r, y: u.y + vy * r });
    if (wall) { MAP.pushOut(p, u.r); return p; }
    if (!MAP.blocked(u.x, u.y, p.x, p.y, u.r * 0.8)) return p;
    let lo = 0, hi = 1;
    for (let i = 0; i < 6; i++) { const t = (lo + hi) / 2; if (MAP.blocked(u.x, u.y, u.x + vx * r * t, u.y + vy * r * t, u.r * 0.8)) hi = t; else lo = t; }
    return { x: u.x + vx * r * lo, y: u.y + vy * r * lo };
  }
  function castMob(ai, o, land) {
    const m = ai.m, u = ai.u;
    const pt = o.back ? { x: 2 * u.x - land.x, y: 2 * u.y - land.y } : land;      // nhảy lùi: chỉ về phía ngược lại
    return m.castSkill(u, o.k, null, pt);
  }
  // sát thương ước lượng của một chiêu lên lính (học từ thực tế; chưa từng trúng thì đoán dè dặt)
  function estDmg(ai, k) {
    const u = ai.u, L = ai.skDmg && ai.skDmg[k];
    if (L && L.n >= 1) return L.v;
    const rk = ai.m.rankOf(u, k);
    return (35 + 30 * rk + 0.45 * Math.max(u.st.ad, u.st.ap || 0)) * 0.8;
  }
  // tiềm năng sát thương của mình lên t trong ~3s (đối xứng với HeroAI.threat)
  function burstOf(ai, t) {
    const m = ai.m, u = ai.u;
    let ready = 0; for (const k of ['s1', 's2', 's3']) if (u.ranks[k] > 0 && (u.cd[k] || 0) <= 0.5) ready++;
    const ult = u.ranks.s4 > 0 && (u.cd.s4 || 0) <= 0.5 ? 1 : 0;
    return m.mitigate(u, t, u.st.ad, 'phys') * u.st.as * 3 + ready * (45 + 18 * u.level) + ult * (90 + 35 * u.level);
  }
  function note(ai, kind, name, s, f) { ai.skLast = { kind, name, s: Math.round(s * 100) / 100, why: why(f), t: ai.m.time }; }

  // ===================== ĂN / DỌN / ĐẨY LÍNH BẰNG CHIÊU =====================
  // mode: 'jungle' (ăn quái rừng / đánh boss). Các mode cũ của bản MOBA ('lane', 'clear', 'push') vẫn hiểu được nhưng đấu trường không dùng.
  const FARM_USE = { poke: 1, burst: 1, cc: 0.7 };
  function farm(ai, mode) {
    const m = ai.m, u = ai.u;
    if (m.time < ai.readyT || u.cast || u.dash || m.time < (ai.farmT || 0)) return false;
    ai.farmT = m.time + 0.25;
    const foes = (ai.enemiesNear || []).filter((e) => dist(e, u) < 10);
    const noise = 0.03 + 0.05 * (1 - ai.sk('refl'));
    let best = null;
    const tops = [];
    for (const k of ['s1', 's2', 's3']) {
      const def = u.hero.skills[k]; if (!def || !def.ai) continue;
      const A = def.ai, w = FARM_USE[A.use];
      if (!w || A.heroOnly || isMob(u, k) || !m.canCast(u, k)) continue;
      const R = (A.range || 3) + 0.3;
      const aoe = !!(A.farm || A.aoe), rad = A.aoe || (A.farm ? 2.2 : 0);
      const mins = [];
      m.grid.query(u.x, u.y, R + 2, (v) => {
        if (!v.alive || v.team === u.team || !v.vis[u.team]) return;
        if (v.kind !== 'monster') return;
        if (dist(u, v) > R + v.r) return;
        mins.push(v);
      }, true);
      if (!mins.length) continue;
      if (A.cond) { let ok = false; try { ok = !!A.cond(m, u, mins[0]); } catch (e) { ok = false; } if (!ok) continue; }
      const dmg = estDmg(ai, k);
      let tgt = null, nHit = 0, kills = 0;
      if (aoe) {
        let bn = -1;
        for (const c of mins) {
          let n = 0, kk = 0;
          for (const v of mins) if (dist(c, v) <= rad + v.r) { n++; if (v.hp <= dmg) kk++; }
          if (n + kk * 0.5 > bn) { bn = n + kk * 0.5; tgt = c; nHit = n; kills = kk; }
        }
      } else {
        // lính sắp chết mà đánh thường không kịp (ngoài tầm, đang hồi đòn) hoặc có 2 lính cùng sắp chết
        const autoOk = (v) => v.hp <= ai.autoDmg(v) && dist(u, v) - u.r - v.r <= u.st.range && u.atkT <= 0.3;
        const lows = mins.filter((v) => v.hp <= dmg * 0.95).sort((a, b) => a.hp - b.hp);
        const miss = lows.filter((v) => !autoOk(v));
        if (miss.length) { tgt = miss[0]; kills = 1; } else if (lows.length >= 2) { tgt = lows[1]; kills = 1; }
        else if (mode !== 'lane') tgt = mins.reduce((a, v) => (v.hp > a.hp ? v : a));
        nHit = tgt ? 1 : 0;
      }
      if (!tgt) continue;
      const need = Math.max(2, (A.farm || 3) - (mode === 'clear' || mode === 'jungle' ? 1 : 0));
      const val = aoe ? cl(0.55 * lin(nHit, 1, need) + 0.22 * Math.min(2, kills) + (mode === 'clear' || mode === 'jungle' ? 0.15 : 0))
        : kills ? 0.8 : mode === 'lane' ? 0 : 0.35;
      if (val <= 0) continue;
      const mp = u.resource === 'mana' && u.st.maxMp > 0 ? (u.mp - m.costOf(u, k)) / u.st.maxMp : 1;
      const reserve = 0.1 + (foes.length ? 0.15 : 0) + (mode === 'lane' && m.time < 360 ? 0.08 : 0);
      const needK = mode === 'clear' || mode === 'jungle' ? 1 : mode === 'push' ? 0.9 : kills ? 0.8 : 0.3;
      const f = [['lợi ích', val], ['mana', u.resource === 'mana' ? lin(mp, reserve, reserve + 0.4) : 1], ['hồi chiêu', floor(lin(m.cdOf(u, k), 18, 5), 0.3)],
        ['nhu cầu', needK], ['giữ chiêu đấu', foes.length ? (A.use === 'poke' ? 0.75 : A.use === 'cc' ? 0.3 : 0.45) : 1],
        ['tay nghề', floor(0.5 * ai.sk('farm') + 0.5 * ai.mastK, 0.45) * w]];
      const s = gmean(f) + m.rngAI.range(-noise, noise);
      tops.push({ k, s, f, name: def.name });
      if (s > 0.45 && (!best || s > best.s)) best = { k, s, f, tgt, A, name: def.name };
    }
    if (!best) return false;
    const t = best.tgt, A = best.A;
    const pt = A.aim === 'point' && A.speed ? ai.lead(t, A.speed, 0.1) : { x: t.x, y: t.y };
    if (!m.castSkill(u, best.k, t, pt)) return false;
    note(ai, 'farm', `${best.name} → ${mode === 'jungle' ? 'quái' : 'lính'}`, best.s, best.f);
    return true;
  }

  // ===================== LƯỚT ĐỂ DI CHUYỂN (kể cả xuyên tường) =====================
  const URG = { zone: 1, drop: 0.9, boss: 0.85, hunt: 0.8, heal: 0.6, vulture: 0.6, shop: 0.5, farm: 0.5, hide: 0.5, roam: 0.4 };
  function travel(ai) {
    const m = ai.m, u = ai.u;
    if (m.time < (ai.travelT || 0) || u.cast || u.dash || ai.fleeing || ai.mode === 'fight' || !u.goal) return false;
    ai.travelT = m.time + 0.5;
    if ((ai.enemiesNear || []).some((e) => dist(e, u) < 14)) return false;
    const opts = mobility(ai, true); if (!opts.length) return false;
    const fin = (ai.dir && ai.dir.point) || u.goal;
    const L0 = G.NAV.pathLen(u, fin);
    if (L0 < 12 * MS) return false;
    // địch mất tích / vừa thấy gần đây: giữ chiêu lướt để thoát thân
    let missing = 0, near = 0;
    for (const e of m.heroes) {
      if (e.team === u.team || !e.alive) continue;
      const k = ai.mem && ai.mem.get(e.id);
      if (!e.vis[u.team] && m.time - e.visT[u.team] > 6) missing++;
      else if (k && m.time - k.t < 8 && Math.hypot(k.x - u.x, k.y - u.y) < 25) near++;
    }
    const nx = G.NAV.nextPoint(u, fin);
    let best = null;
    for (const o of opts) {
      const dirs = [M.dir(u, nx)];
      if (o.wall && (nx.x !== fin.x || nx.y !== fin.y)) dirs.push(M.dir(u, fin));      // xuyên tường: thử lướt thẳng về đích
      for (const v of dirs) {
        const land = landing(u, v.x, v.y, o.r, o.wall);
        const gain = L0 - G.NAV.pathLen(land, fin);
        const over = gain > o.r * 1.6;                                                // đường vòng dài hơn hẳn: vượt tường
        const f = [['đường xa', lin(L0, 12 * MS, 45 * MS)], ['rút ngắn', over ? 1 : lin(gain, 0.4 * o.r, 0.95 * o.r)],
          ['mana', u.resource === 'mana' && u.st.maxMp > 0 ? lin((u.mp - o.cost) / u.st.maxMp, 0.3, 0.65) : 1],
          ['hồi chiêu ngắn', floor(lin(o.cd, 22, 7), over ? 0.5 : 0.15)], ['gấp', URG[ai.act] || 0.4],
          ['giữ chiêu thoát thân', floor(lin(missing + 1.5 * near, 4, 0.5), 0.25)], ['tay nghề', floor(ai.mastK, 0.4)]];
        if (over) f.push(['vượt tường', 1]);
        const s = gmean(f);
        if (s > 0.5 && (!best || s > best.s)) best = { o, land, s, f, over };
      }
    }
    if (!best) return false;
    if (!castMob(ai, best.o, best.land)) return false;
    note(ai, 'travel', `${best.o.name}${best.over ? ' vượt tường' : ' để di chuyển'}`, best.s, best.f);
    if (best.over) ai.callout('🧗 Vượt tường', '#cfe8ff');
    return true;
  }

  // ===================== BỊ ĐUỔI =====================
  // điểm đáp tốt nhất cho chiêu thoát thân
  function bestEscape(ai, chasers, safe, desperate) {
    const u = ai.u;
    const opts = mobility(ai, false);
    if (!opts.length) return null;
    const minPath = (p) => { let d = Infinity; for (const c of chasers) d = Math.min(d, G.NAV.pathLen(c, p)); return d; };
    const minStraight = (p) => { let d = Infinity; for (const c of chasers) d = Math.min(d, dist(c, p)); return d; };
    const d0 = minStraight(u), s0 = G.NAV.pathLen(u, safe);
    let best = null;
    for (const o of opts) {
      const dirs = [];
      if (o.back) { let e = null, bd = 9; for (const c of chasers) { const d = dist(c, u); if (d < bd) { bd = d; e = c; } } dirs.push(e ? M.dir(e, u) : { x: -u.fx, y: -u.fy }); }
      else for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; dirs.push({ x: Math.cos(a), y: Math.sin(a) }); }
      for (const v of dirs) {
        const land = landing(u, v.x, v.y, o.r, o.wall);
        if (dist(u, land) < 1) continue;
        const dc = minPath(land), straight = minStraight(land), ds = G.NAV.pathLen(land, safe);
        const f = [['xa kẻ đuổi', lin(dc - d0, -1, o.r + 2)], ['về chỗ an toàn', floor(lin(s0 - ds, -o.r, o.r), 0.2)],
          ['trong bo', ai.m.zoneSt.dps > 0 && !ai.m.inZone(land, 0) ? 0.3 : 1]];
        if (dc - straight > 2) f.push(['vượt tường', 0.5 + 0.5 * lin(dc - straight, 2, 10)]);
        if (MAP.bushAt(land.x, land.y) >= 0) f.push(['vào bụi', 1]);
        // Kỹ Năng Cá Nhân thấp: chọn hướng kém chính xác hơn (nhiễu theo từng hướng)
        const s = gmean(f) + ai.m.rngAI.range(-1, 1) * 0.12 * (1 - ai.sk('meca'));
        if (!best || s > best.s) best = { o, land, s, f };
      }
    }
    return best;
  }
  // bụi gần, nằm về phía xa kẻ đuổi, không có kẻ đuổi đứng sẵn
  function jukeSpot(ai, chasers, safe) {
    const u = ai.u;
    let cx = 0, cy = 0; for (const c of chasers) { cx += c.x; cy += c.y; } cx /= chasers.length; cy /= chasers.length;
    const away = M.dir({ x: cx, y: cy }, u), s0 = G.NAV.pathLen(u, safe);
    let best = null, bs = 0;
    for (const b of MAP.bushes) {
      const d = dist(u, b); if (d > 10 || d < b.r * 0.5) continue;
      const v = M.dir(u, b), cos = v.x * away.x + v.y * away.y;
      if (cos < 0.15) continue;
      if (chasers.some((c) => dist(c, b) < b.r + 2.5) || (ai.m.zoneSt.dps > 0 && !ai.m.inZone(b, 1))) continue;
      const toward = G.NAV.pathLen(b, safe) <= s0 + 4;
      const s = (1 - d / 12) * (0.6 + 0.4 * cos) * (toward ? 1 : 0.6);
      if (s > bs) { bs = s; best = { x: b.x, y: b.y, d, id: b.id, r: b.r }; }
    }
    return best;
  }
  const HOLD = { run: 0.6, skill: 0.3, juke: 1.2, fight: 1.8 };
  // trả về: false (không ai đuổi / chạy bình thường), true (đã xử lý), 'fight' (quay lại đánh: ai.turnTgt)
  function evade(ai, enemies) {
    const m = ai.m, u = ai.u;
    const mem = ai.evMem || (ai.evMem = new Map());
    const chasers = [];
    for (const e of enemies) {
      if (!(e.kind === 'hero' || e.decoy)) continue;
      const d = dist(e, u); if (d > 9) { mem.delete(e.id); continue; }
      const prev = mem.get(e.id);
      if (!prev || m.time - prev.t > 0.4) mem.set(e.id, { d, t: m.time });
      const facing = ((u.x - e.x) * (e.fx || 0) + (u.y - e.y) * (e.fy || 0)) / Math.max(0.1, d) > 0.6;
      const closing = prev && m.time - prev.t < 1 && d < prev.d - 0.15;
      if (e.attackTarget === u || (e.windup && e.windup.target === u) || (facing && d < 7) || closing) chasers.push(e);
    }
    const cur = ai.evade;
    if (!chasers.length) { ai.evade = null; return false; }
    // giữ lựa chọn trong thời gian tối thiểu
    if (cur && m.time < cur.until) return apply(ai, cur, chasers);
    const safe = ai.safeSpot();
    const myMs = Math.max(0.5, u.st.ms);
    let theirMs = 0, reach = 0, gap = Infinity;
    for (const e of chasers) { theirMs = Math.max(theirMs, e.st.ms || 3); reach = Math.max(reach, (e.st.range || 1.5) + (e.r || 0.5) + u.r); gap = Math.min(gap, dist(e, u)); }
    const tSafe = G.NAV.pathLen(u, safe) / myMs;
    // thời gian còn nằm trong tầm đánh của kẻ đuổi trên đường chạy: nhanh hơn thì thoát dần khỏi tầm, chậm hơn thì bị bám tới nơi
    const dv = myMs - theirMs;
    const expose = dv >= 0 ? (gap <= reach ? Math.min(tSafe, (reach - gap) / (dv + 0.3)) : 0)
      : Math.max(0, tSafe - (gap > reach ? (gap - reach) / -dv : 0));
    let sh = 0; for (const s of u.statuses) if (s.type === 'shield') sh += s.v;
    const survive = (u.hp + sh) / Math.max(1, ai.threat(chasers) / 5);     // số giây chịu được khi vừa chạy vừa bị đánh (đang đuổi thì không dồn đủ chiêu)
    const margin = Math.max(-20, Math.min(20, survive - expose));            // > 0: chạy được về chỗ an toàn
    const opts = [];
    opts.push({ k: 'run', name: 'Chạy về chỗ an toàn', f: [['kịp về', logi(margin, -0.5, 1.2)], ['đường ngắn', floor(lin(tSafe, 12, 2), 0.55)]] });
    const esc = bestEscape(ai, chasers, safe, margin < 0);
    if (esc) opts.push({ k: 'skill', name: `${esc.o.name} thoát thân`, esc,
      f: [['khẩn', lin(margin, 2, -2)], ['bị áp sát', lin(gap - reach, 3, 0.4)], ['điểm đáp', esc.s]] });
    const bush = jukeSpot(ai, chasers, safe);
    if (bush) opts.push({ k: 'juke', name: 'Cắt đuôi qua bụi', bush,
      f: [['có bụi gần', lin(bush.d, 10, 2)], ['còn khoảng cách', lin(gap - reach, 0.3, 3.5)], ['Đọc Bản Đồ', floor(ai.sk('map'), 0.3)], ['không về kịp', floor(lin(margin, 2, -1), 0.4)]] });
    let weakest = null; for (const e of chasers) if (e.kind === 'hero' && (!weakest || e.hp < weakest.hp)) weakest = e;
    if (weakest) {
      // quay lại đánh chỉ khi: thắng thế rõ (và còn máu), kẻ đuổi sắp chết trong tầm dồn sát thương, hoặc bị áp sát mà hết đường chạy
      const ratio = ai.fightRatio || 1;
      const win = logi(ratio, 1.4, 7) * floor(lin(u.hpPct, 0.2, 0.6), 0.2);
      const kill = weakest.hpPct < 0.3 && weakest.hp < burstOf(ai, weakest) * 0.65 ? 0.78 * floor(lin(u.hpPct, 0.06, 0.3), 0.4) : 0;
      const trapped = margin < -2 && !esc && gap <= reach + 0.6 && u.hpPct < 0.5 ? 0.5 + 0.2 * cl(ai.aggr - 0.6) : 0;
      const style = !u.pers ? 1 : u.pers.style === 'aggro' ? 1.1 : u.pers.style === 'safe' ? 0.88 : 1;
      const fb = Math.max(win, kill, trapped);
      const lbl = fb === trapped ? 'Hết đường chạy — quay lại liều' : fb === kill ? 'Quay lại hạ kẻ đuổi' : 'Đánh trả';
      opts.push({ k: 'fight', name: lbl, tgt: weakest, max: cl(fb * style), f: [['thắng thế', win], ['hạ được', kill], ['hết đường', trapped]] });
    }
    const noise = 0.03 + 0.08 * (1 - ai.sk('refl'));
    for (const o of opts) { o.s = (o.max != null ? o.max : gmean(o.f)) + m.rngAI.range(-noise, noise) + (cur && cur.k === o.k ? 0.08 : 0); }
    opts.sort((a, b) => b.s - a.s);
    const pick = opts[0];
    pick.until = m.time + HOLD[pick.k];
    ai.evade = pick;
    ai.evTop = opts.slice(0, 3).map((o) => ({ name: o.name, s: Math.round(o.s * 100) / 100, why: why(o.f) }));
    ai.evT = m.time; if (G.EV_DEBUG && pick.k === 'fight') G.EV_DEBUG.push({ lbl: pick.name, margin, expose, survive, tSafe, gap, reach, hp: u.hpPct, myMs, theirMs, ratio: ai.fightRatio, n: chasers.length });
    if (!cur || cur.k !== pick.k) ai.callout({ run: '🏃 Chạy', skill: '💨 Thoát', juke: '🌿 Cắt đuôi', fight: '↩ Quay lại đánh' }[pick.k], '#ffe9a0');
    return apply(ai, pick, chasers);
  }
  function apply(ai, o, chasers) {
    const m = ai.m, u = ai.u;
    const near = chasers.reduce((a, e) => (dist(e, u) < dist(a, u) ? e : a));
    if (o.k === 'fight') {
      const t = o.tgt && o.tgt.alive && o.tgt.vis[u.team] ? o.tgt : near;
      ai.turnT = m.time + 1.8; ai.turnTgt = t;
      return 'fight';
    }
    if (o.k === 'skill' && o.esc && !o.done) {
      o.done = true;
      if (castMob(ai, o.esc.o, o.esc.land)) return true;
    }
    // vừa chạy vừa khống chế / làm chậm kẻ đuổi gần nhất
    if (dist(near, u) < 5) ai.useSkills(near, ['defend', 'cc', 'custom'], true);
    if (u.cast || u.dash) return true;
    if (o.k === 'juke' && o.bush) {
      if (dist(u, o.bush) < o.bush.r * 0.6) { o.until = 0; return false; }             // đã vào bụi: lần sau chọn lại (thường là chạy tiếp, đổi hướng)
      ai.goTo(o.bush); return true;
    }
    return false;                                                                         // chạy: để phần rút lui đi về chỗ an toàn
  }

  G.SkillAI = { MOBILITY, mobility, landing, castMob, farm, travel, evade, bestEscape, jukeSpot, estDmg, burstOf };
})();
