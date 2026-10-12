'use strict';
// ===== GĐ12: CHIẾN THUẬT MỚI CHO AI =====
// 1. Assassin — Pháp Sư Sát Thủ (Thanh Phong, Alice, Dahlia, Luca, Mirage): đọc vị mục tiêu (Máu Giấy / Trâu Bò / Hỗ Trợ),
//               Dive-and-Bail với máu giấy, Kite-to-Execute với trâu bò (chỉ all-in khi máu ≤ 35% hoặc ≤ 90% combo),
//               cửa sổ hụt chiêu (địch vừa tung trượt chiêu lớn → ưu tiên ×2, lao vào 2–4s);
//               FSM 4 trạng thái: POKE_AND_BAIT → DIVE_ENGAGE → BURST_EXECUTE → TACTICAL_BAIL.
// 2. Aim      — bắn đón đầu có sai số người thật ±0.2–0.6 đv (thay nhiễu cũ); check bụi bằng chiêu rẻ khi vừa mất dấu < 3s;
//               chiêu "vu vơ" 3–5% mỗi 4s khi đối thủ ở 6–9 đv.
// 3. Wall     — quét 3 tia sau lưng: lùi vào tường thì trượt theo tiếp tuyến; kẹt góc (cả 3 tia chạm tường, địch sát) → lướt
//               XUYÊN qua địch, không có chiêu lướt thì Đường Cùng.
// 4. Dash     — lướt vừa đủ: thoát vùng nguy hiểm thì chỉ lướt tới mép + 0.8 đv; đường lướt đụng tường thì dừng trước tường 0.5 đv.
// 5. Flee     — kỷ luật bỏ chạy: chỉ chạy ở 5–10% máu (tính cách hèn / tướng mỏng: 10–25%); đang chạy mà bị đánh trong 2s,
//               kẻ đuổi sát và nhanh hơn, hoặc kẹt tường → TỬ THỦ ALL-IN 3.5s: khống chế cứng trước, rồi dồn sát thương/chiêu cuối,
//               rồi đánh thường + trang bị.
// 6. Missed   — ghi nhận "hụt chiêu lớn" (chiêu cuối / chiêu hồi ≥ 9s không trúng tướng nào trong 1s).
(function () {
  const G = globalThis.G;
  const M = G.M, MAP = G.MAP;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const ASSASSIN = new Set(['thanhphong', 'alice', 'dahlia', 'luca', 'mirage']);

  // ===================== 6. HỤT CHIÊU LỚN =====================
  function noteCast(m, u, key) {
    if (u.kind !== 'hero') return;
    const def = u.hero.skills[key]; if (!def || key === 'sub') return;
    const cd = m.cdOf ? m.cdOf(u, key) : 0;
    if (key !== 's4' && !(cd >= 9)) return;
    const x = G.Brain.tax(def, key), a = def.ai || {};
    if (!x || a.aim === 'self' || !((x.cat & G.Brain.CAT.Damage) || x.sub.HardCC) || (x.cat & G.Brain.CAT.Defense)) return;   // chỉ chiêu tấn công thật
    const big = { t: m.time, key, hit: false };
    u.bigCast = big;
    m.later(1.0, () => { if (u.bigCast === big && !big.hit) u.bigMissT = m.time; });
  }
  function noteHit(owner, tgt, info) {
    const b = owner && owner.bigCast;
    if (b && !b.hit && tgt.kind === 'hero' && info && info.tag && (info.tag === b.key || String(info.tag).indexOf(b.key) === 0)) b.hit = true;
  }
  const vulnerable = (m, t) => t && t.bigMissT != null && m.time - t.bigMissT < 3;

  // ===================== 1. PHÁP SƯ SÁT THỦ =====================
  function profile(t) {
    if (!t || t.kind !== 'hero') return 'tank';
    const kit = t.hero.kit, role = t.hero.ai && t.hero.ai.role;
    if (kit === 'support' || role === 'support') return 'support';
    const tough = (t.st.armor || 0) + (t.st.mr || 0) > 120 || t.st.maxHp > 2600 || (t.ga || 0) > t.st.maxHp * 0.25;
    if (kit === 'tank' || (kit === 'fighter' && !t.ranged) || tough) return 'tank';
    return 'squishy';
  }
  function comboDmg(ai, t) { return G.SkillAI.burstOf(ai, t); }
  function dmgReady(ai) { return G.Brain.ready(ai, (x) => (x.cat & G.Brain.CAT.Damage) && !x.sub.EscapeDash).length; }
  function setSt(ai, st, dur) {
    const a = ai.asn; a.st = st; a.t0 = ai.m.time; a.until = ai.m.time + (dur || 9);
    const L = { POKE_AND_BAIT: '🎯 Cấu & dụ', DIVE_ENGAGE: '🗡 Lao vào', BURST_EXECUTE: '💥 Dồn sát thương', TACTICAL_BAIL: '↩ Rút chiến thuật' };
    ai.callout(L[st], '#e0b0ff');
    ai.u.stats['asn_' + st] = (ai.u.stats['asn_' + st] || 0) + 1;
  }
  // điều phối mỗi nhịp fightMicro; trả true khi đã ra lệnh
  function assassin(ai, t, enemies, allies) {
    const m = ai.m, u = ai.u;
    if (u.fstyle !== 'assassin' || !t || t.kind !== 'hero' || u.cast || u.dash) return false;
    if (u.duel || ai.turnT > m.time) return false;                   // quyết đấu / tử thủ: để bộ não khác lo
    const a = ai.asn || (ai.asn = { st: 'POKE_AND_BAIT', t0: 0, until: 0, tid: 0 });
    if (a.tid !== t.id) { a.tid = t.id; a.st = 'POKE_AND_BAIT'; a.t0 = m.time; a.prof = profile(t); }
    const d = dist(u, t), prof = a.prof, combo = comboDmg(ai, t);
    const exec = t.hpPct <= 0.35 || t.hp <= combo * 0.9;
    const vul = vulnerable(m, t);
    if (vul && a.vulT !== t.bigMissT) { a.vulT = t.bigMissT; u.stats.asnVuln = (u.stats.asnVuln || 0) + 1; ai.callout('⚡ Hụt chiêu — lao!', '#ffe09a'); }
    const nearFoes = enemies.filter((e) => e !== t && e.kind === 'hero' && dist(e, t) < 6).length;
    switch (a.st) {
      case 'POKE_AND_BAIT': {
        const ready = dmgReady(ai), closer = G.Brain.ready(ai, (x) => x.sub.GapCloser).length > 0 || d < u.st.range + u.r + t.r + 1.5;
        const go = vul || (prof !== 'tank' && ready >= 2 && closer && nearFoes <= 1 && u.hpPct > 0.4) || (exec && ready >= 1 && closer);
        if (go) { setSt(ai, 'DIVE_ENGAGE', vul ? 2 + 2 * ai.sk('fight') : 2.5); return false; }
        // trâu bò: thả diều tới ngưỡng kết liễu — cấu rỉa từ mép tầm chiêu, không ăn đòn
        ai.useSkills(t, ['poke', 'cc'], false);
        if (u.cast || u.dash) return true;
        const keep = Math.max(u.st.range + u.r + t.r - 0.3, Math.min(7, (u.hero.ai.engageRange || 6)));
        if (prof === 'tank' && !exec) { ai.kite(t, enemies, u.atkT <= 0.15, d); if (!u.goal) u.goal = ai.strafeGoal(t, keep, allies, enemies); slide(ai, u.goal); return true; }
        return false;
      }
      case 'DIVE_ENGAGE': {
        const gc = G.Brain.ready(ai, (x) => x.sub.GapCloser);
        if (d > u.st.range + u.r + t.r + 0.5 && gc.length) {
          const o = gc[0], p = { x: t.x + (t.vx || 0) * 0.3, y: t.y + (t.vy || 0) * 0.3 };
          if (m.castSkill(u, o.k, t, p)) { setSt(ai, 'BURST_EXECUTE', 2.5); return true; }
        }
        if (d <= Math.max(u.st.range + u.r + t.r + 0.5, 5)) { setSt(ai, 'BURST_EXECUTE', 2.5); return false; }
        if (m.time > a.until) { setSt(ai, 'POKE_AND_BAIT'); return false; }
        u.attackTarget = null; u.goal = { x: t.x, y: t.y }; return true;
      }
      case 'BURST_EXECUTE': {
        // khống chế trước, rồi dồn sát thương & chiêu cuối
        if (ai.useSkills(t, ['cc'], false) || ai.useSkills(t, ['burst', 'ult', 'poke', 'engage'], false)) return true;
        const spent = dmgReady(ai) === 0;
        const bail = !t.alive || (prof !== 'tank' && spent && !exec && t.hpPct > u.hpPct) || u.hpPct < 0.25 || (m.time > a.until && spent);
        if (bail && !(exec && u.hpPct > 0.2)) { setSt(ai, 'TACTICAL_BAIL', 1.2 + 0.8 * (1 - ai.sk('fight'))); return bailStep(ai, t, enemies, allies); }
        return false;                                                    // đánh thường giữa các chiêu
      }
      case 'TACTICAL_BAIL': {
        if (m.time > a.until || (dmgReady(ai) >= 1 && u.hpPct > 0.35)) { setSt(ai, 'POKE_AND_BAIT'); return false; }
        return bailStep(ai, t, enemies, allies);
      }
    }
    return false;
  }
  function bailStep(ai, t, enemies, allies) {
    const m = ai.m, u = ai.u, a = ai.asn;
    // chiêu có điểm neo (snapback) → giật về; còn chiêu thoát thân → lướt ra
    for (const k in u.recast) { const rc = u.recast[k]; if (rc && rc.until > m.time && rc.anchor && m.castSkill(u, k, t, { x: t.x, y: t.y })) { u.stats.asnSnap = (u.stats.asnSnap || 0) + 1; return true; } }
    if (!a.dashed && dist(u, t) < 4.5) {
      const esc = G.SkillAI.bestEscape(ai, [t], ai.safeSpot(), false);
      if (esc && G.SkillAI.castMob(ai, esc.o, esc.land)) { a.dashed = true; return true; }
    }
    if (m.time - a.t0 < 0.2) a.dashed = false;
    u.attackTarget = null; u.goal = ai.strafeGoal(t, Math.max(7, (u.hero.ai.engageRange || 6) + 1.5), allies, enemies); slide(ai, u.goal);
    ai.fleeing = true;
    return true;
  }

  // ===================== 2. NGẮM: SAI SỐ NGƯỜI THẬT, CHECK BỤI, CHIÊU VU VƠ =====================
  function humanErr(ai) {
    const m = ai.m, e = 0.2 + 0.4 * (1 - ai.sk('meca')), a = m.rngAI.next() * 6.2831853, r = e * (0.5 + 0.5 * m.rngAI.next());
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
  function lead(ai, t, speed, extra) {
    const u = ai.u, d = dist(u, t), tt = Math.min(1.4, (speed ? d / speed : 0) + (extra || 0));
    const acc = 0.8 + 0.2 * ai.sk('meca'), e = humanErr(ai);
    return { x: t.x + (t.vx || 0) * tt * acc + e.x, y: t.y + (t.vy || 0) * tt * acc + e.y };
  }
  // chiêu "rẻ": không phải chiêu cuối, không phải chiêu cơ động, có gây sát thương & cần điểm
  function cheapPoke(ai, maxR) {
    const m = ai.m, u = ai.u;
    for (const k of ['s1', 's2', 's3']) {
      const def = u.hero.skills[k]; if (!def || !(u.ranks[k] > 0) || !m.canCast(u, k) || u.recast[k]) continue;
      const x = G.Brain.tax(def, k), a = def.ai || {};
      if (!x || !(x.cat & G.Brain.CAT.Damage) || (x.cat & G.Brain.CAT.Mobility) || a.aim === 'self' || a.aim === 'unit' || a.aim === 'away') continue;
      if ((a.range || 4) + 0.5 < maxR) continue;
      if (u.resource === 'mana' && u.mp < u.st.maxMp * 0.35) continue;
      return k;
    }
    return null;
  }
  // gọi mỗi vòng nghĩ khi không giao tranh
  function idle(ai, enemies) {
    const m = ai.m, u = ai.u;
    if (u.cast || u.dash || u.disabled || m.time < (ai.t12T || 0)) return false;
    // check bụi: vừa mất dấu (≤ 3s), vị trí cuối sát bụi → ném chiêu rẻ vào bụi
    const tr = ai.track;
    if (tr && m.time - tr.kt <= 3 && !enemies.length) {
      let b = null, bd = 3.2; for (const bs of MAP.bushes) { const dd = dist(bs, tr.p); if (dd < bd) { bd = dd; b = bs; } }
      if (b && !tr.poked) {
        const k = cheapPoke(ai, dist(u, b));
        if (k) { tr.poked = true; ai.t12T = m.time + 2; if (m.castSkill(u, k, null, { x: b.x, y: b.y })) { u.stats.bushCheck = (u.stats.bushCheck || 0) + 1; ai.callout('🌿 Thăm dò bụi', '#a8e0a0'); return true; } }
      }
    }
    // chiêu vu vơ: đối thủ đứng 6–9 đv (chưa giao tranh), cứ 4s có 3–5% tung một chiêu cấu đón đầu
    if (m.time >= (ai.specT || 0)) {
      ai.specT = m.time + 4;
      const t = enemies.find((e) => e.kind === 'hero' && e.alive && dist(u, e) >= 6 && dist(u, e) <= 9);
      if (t && m.rngAI.next() < 0.03 + 0.02 * ai.sk('meca')) {
        const k = cheapPoke(ai, dist(u, t));
        if (k) { const def = u.hero.skills[k]; const p = lead(ai, t, (def.ai && def.ai.speed) || 0, def.castTime || 0); if (m.castSkill(u, k, t, p)) { u.stats.specPoke = (u.stats.specPoke || 0) + 1; ai.callout('🎲 Ném thử', '#ffe09a'); return true; } }
      }
    }
    return false;
  }

  // ===================== 3. TƯỜNG SAU LƯNG =====================
  // quét 3 tia (thẳng, ±30°) dài L theo hướng v; trả số tia chạm tường
  function rays(u, v, L) {
    let n = 0; const out = [];
    for (const a of [0, 0.52, -0.52]) {
      const c = Math.cos(a), s = Math.sin(a), x = v.x * c - v.y * s, y = v.x * s + v.y * c;
      const hit = !!MAP.blocked(u.x, u.y, u.x + x * L, u.y + y * L, u.r * 0.8);
      out.push(hit); if (hit) n++;
    }
    return { n, out };
  }
  // chỉnh điểm đến: lùi vào tường → trượt theo tiếp tuyến (ưu tiên phía xa địch / phía không chạm tường)
  function slide(ai, g) {
    const u = ai.u; if (!g) return g;
    const dx = g.x - u.x, dy = g.y - u.y, L = Math.hypot(dx, dy); if (L < 0.5) return g;
    const v = { x: dx / L, y: dy / L }, R = rays(u, v, Math.min(3, L + 0.5));
    if (!R.out[0]) return g;
    const sides = [{ x: -v.y, y: v.x }, { x: v.y, y: -v.x }];
    let best = null;
    for (const w of sides) { if (MAP.blocked(u.x, u.y, u.x + w.x * 2.5, u.y + w.y * 2.5, u.r * 0.8)) continue; best = w; break; }
    if (!best) return g;
    g.x = u.x + best.x * Math.min(3, L); g.y = u.y + best.y * Math.min(3, L); MAP.pushOut(g, u.r);
    u.stats.wallSlide = (u.stats.wallSlide || 0) + 1;
    return g;
  }
  // kẹt góc: lùi thì cả 3 tia chạm tường và kẻ địch đã sát → lướt xuyên qua địch (hoặc báo Đường Cùng)
  function cornered(ai, chaser) {
    const m = ai.m, u = ai.u; if (!chaser || u.cast || u.dash) return false;
    const v = M.dir(chaser, u), R = rays(u, v, 2.5);
    if (R.n < 3 || dist(u, chaser) > 4.5) return false;
    const mob = G.SkillAI.mobility(ai, false).filter((o) => !o.back);
    for (const o of mob) {
      const w = M.dir(u, chaser), reach = Math.min(o.r, dist(u, chaser) + 2.2);
      const land = G.SkillAI.landing(u, w.x, w.y, reach, o.wall);
      if (dist(land, chaser) > 1 && dist(u, land) > dist(u, chaser) && G.SkillAI.castMob(ai, o, land)) { u.stats.dashThrough = (u.stats.dashThrough || 0) + 1; ai.callout('↯ Lướt xuyên địch', '#ffe09a'); return true; }
    }
    return 'trapped';
  }

  // ===================== 4. LƯỚT VỪA ĐỦ =====================
  function clampDash(ai, o, land) {
    const m = ai.m, u = ai.u;
    const dx = land.x - u.x, dy = land.y - u.y, L = Math.hypot(dx, dy); if (L < 0.8 || o.back) return land;
    const v = { x: dx / L, y: dy / L };
    let want = L;
    // đang trong vùng nguy hiểm: chỉ cần ra khỏi mép + 0.8 đv
    for (const z of m.dangers) {
      if (z.until <= m.time || z.team === u.team || !G.Danger.inside(z, u.x, u.y, u.r)) continue;
      let lo = 0, hi = L; for (let i = 0; i < 7; i++) { const mid = (lo + hi) / 2; if (G.Danger.inside(z, u.x + v.x * mid, u.y + v.y * mid, u.r)) lo = mid; else hi = mid; }
      if (hi < L) want = Math.min(L, Math.max(want === L ? 0 : want, hi + 0.8));
    }
    // tường trên đường lướt (chiêu không vượt tường): dừng trước 0.5 đv
    if (!o.wall && MAP.blocked(u.x, u.y, land.x, land.y, u.r * 0.8)) {
      let lo = 0, hi = L; for (let i = 0; i < 6; i++) { const mid = (lo + hi) / 2; if (MAP.blocked(u.x, u.y, u.x + v.x * mid, u.y + v.y * mid, u.r * 0.8)) hi = mid; else lo = mid; }
      want = Math.min(want, Math.max(0.6, lo - 0.5));
    }
    if (want < L - 0.05) { u.stats.dashClamp = (u.stats.dashClamp || 0) + 1; return { x: u.x + v.x * want, y: u.y + v.y * want }; }
    return land;
  }

  // ===================== 5. KỶ LUẬT BỎ CHẠY & TỬ THỦ =====================
  const COWARD = new Set(['chuotlui', 'hoabinh', 'thoatxac', 'doimang', 'cauton']);
  function retreatHp(ai, base) {
    const u = ai.u;
    if (base <= 0) return 0;
    const fragile = u.hero.kit === 'marksman' || u.hero.kit === 'support' || u.st.maxHp < 1400;
    if (COWARD.has(u.persId)) return Math.max(0.1, Math.min(0.25, base));
    if (fragile) return Math.max(0.08, Math.min(0.14, base));
    return Math.max(0.05, Math.min(0.1, base));
  }
  // đang chạy: xét có phải quay đầu tử thủ không
  function berserk(ai, enemies) {
    const m = ai.m, u = ai.u;
    if (ai.turnT > m.time || !enemies.length || u.fstyle === 'allin') return false;
    let c = null, cd = 99; for (const e of enemies) { if (e.kind !== 'hero') continue; const d = dist(e, u); if (d < cd) { cd = d; c = e; } }
    if (!c || cd > 7) return false;
    const hitRecent = m.time - (u.lastAttT || -99) < 2 && u.lastAtt === c;
    const faster = c.st.ms > u.st.ms * 1.02 && cd < 4;
    const cn = cornered(ai, c);
    if (cn === true) return true;
    const escape = G.SkillAI.mobility(ai, false).length > 0;
    if (!(cn === 'trapped' || (hitRecent && faster && !escape) || (faster && !escape && cd < 2 && u.hpPct < 0.15))) return false;
    ai.turnT = m.time + 3.5; ai.turnTgt = c; ai.berserkT = m.time + 3.5;
    u.stats.berserk = (u.stats.berserk || 0) + 1;
    u.face(c.x, c.y);
    if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🩸 TỬ THỦ ALL-IN!', color: '#ff6a5a' });
    return true;
  }
  // thứ tự ra đòn khi tử thủ: khống chế cứng → dồn sát thương / chiêu cuối → đánh thường + trang bị
  function berserkSkills(ai, t) {
    if (!(ai.berserkT > ai.m.time) || !t) return false;
    return ai.useSkills(t, ['cc'], false) || ai.useSkills(t, ['burst', 'ult', 'poke', 'engage'], false);
  }

  // ===================== 7. HOÁN VỊ / NHỊP KIẾM =====================
  // Kazuki: chọn nhịp 2 chữ trước Kiếm Thế Quyết — AA khi ≥ 2 địch sát bên (xoay), AB khi cần choáng (địch đang niệm / bỏ chạy / máu cao),
  // BA khi đối thủ hồi máu nhiều (hút máu, đang có hồi máu) → Vết Thương Sâu, BB khi cần lunge chém xa.
  function kazukiPlan(ai, t, enemies) {
    const u = ai.u, m = ai.m; if (!t || t.kind !== 'hero') return 'AB';
    const close = enemies.filter((e) => e.kind === 'hero' && dist(e, u) < 3.2).length;
    if (close >= 2) return 'AA';
    if ((t.st.lifesteal || 0) > 0.08 || (t.statuses.length && t.statuses.some((s) => s.type === 'hot' || s.type === 'regen'))) return 'BA';
    if (t.cast || (H_moving(t) && dist(u, t) > 2.5) || t.hpPct > 0.6) return 'AB';
    return 'BB';
  }
  const H_moving = (t) => (t.vx || 0) * (t.vx || 0) + (t.vy || 0) * (t.vy || 0) > 0.04;
  function kazuki(ai, enemies) {
    const m = ai.m, u = ai.u, t = ai.target; if (!t || !t.alive || u.cast || u.dash || dist(u, t) > 3.2) return false;
    const seq = (u.ws.seq || []).map((x) => x.c).join(''), want = ai.kzPlan && seq.length ? ai.kzPlan : (ai.kzPlan = kazukiPlan(ai, t, enemies));
    if (seq.length >= 2) { if (seq !== want) u.stats.kzMiss = (u.stats.kzMiss || 0) + 1; ai.kzPlan = null; return m.canCast(u, 's3') && m.castSkill(u, 's3', t, { x: t.x, y: t.y }) ? (u.stats['kz_' + seq] = (u.stats['kz_' + seq] || 0) + 1, true) : false; }
    const next = want[seq.length] === 'A' ? 's1' : 's2';
    if (m.canCast(u, next) && m.canCast(u, 's3') !== undefined) return !!m.castSkill(u, next, t, { x: t.x, y: t.y });
    return false;
  }
  // Ryoma: ghép cặp — BB choáng khi địch niệm chiêu / sắp chạy thoát; BC khi đuổi theo; CC khi bị thả diều hoặc máu thấp (gió xoáy làm chậm)
  // + Kiếm Khí chém nát đạn đang bay tới mình.
  function ryoma(ai, enemies) {
    const m = ai.m, u = ai.u; if (u.cast || u.dash) return false;
    if (u.ws.kk > 0 && m.canCast(u, 'sub')) {
      const p = m.projs.find((q) => !q.dead && q.owner && q.owner.team !== u.team && !q.target && dist(q, u) < 5 && ((u.x - q.x) * q.dx + (u.y - q.y) * q.dy) > 0);
      if (p && m.castSkill(u, 'sub', null, { x: p.x, y: p.y })) { u.stats.kkCut = (u.stats.kkCut || 0) + 1; ai.callout('⚔ Kiếm Khí chém đạn', '#ffd0dc'); return true; }
    }
    const t = ai.target; if (!t || !t.alive || t.kind !== 'hero') return false;
    const d = dist(u, t), first = u.ws.last && m.time - u.ws.lastT <= 2 ? u.ws.last : null;
    const want = t.cast || (t.hpPct < 0.35 && d < 4) ? ['s2', 's2'] : d > 3.5 ? ['s2', 's3'] : (u.hpPct < 0.4 || t.ranged) ? ['s3', 's3'] : null;
    if (!want) return false;
    const k = first ? (want[0] === first ? want[1] : want.find((x) => x !== first) || want[1]) : want[0];
    if (d > 6 || !m.canCast(u, k)) return false;
    if (m.castSkill(u, k, t, { x: t.x, y: t.y })) { if (first) u.stats.ryPair = (u.stats.ryPair || 0) + 1; return true; }
    return false;
  }
  // Dahlia: máu < 25% bị áp sát → Thoát Nguy đổi chỗ với quái / ảo ảnh XA kẻ địch nhất
  function dahliaEscape(ai, enemies) {
    const m = ai.m, u = ai.u; if (u.hpPct >= 0.25 || u.cast || u.dash || !m.canCast(u, 's1')) return false;
    const foe = enemies.find((e) => e.kind === 'hero' && dist(e, u) < 6); if (!foe) return false;
    const c = m.units.filter((x) => x.alive && x !== u && x.kind !== 'hero' && (x.kind === 'monster' || x.kind === 'pet') && !x.boss && !x.big && dist(x, u) <= 8)
      .sort((a, b) => dist(b, foe) - dist(a, foe) || a.id - b.id)[0];
    if (!c || dist(c, foe) < dist(u, foe) + 2) return false;
    if (m.castSkill(u, 's1', null, { x: c.x, y: c.y })) { u.stats.dahSwapEsc = (u.stats.dahSwapEsc || 0) + 1; ai.callout('🎩 Đổi chỗ thoát thân', '#c040ff'); return true; }
    return false;
  }
  // khai thác mất phương hướng: vừa hoán vị xong (≤ 1.2s) → vòng ra sau lưng nạn nhân rồi đánh
  function backstab(ai, t) {
    const m = ai.m, u = ai.u; if (!t || !(u.ws.swapT2 > m.time) || u.cast || u.dash || u.ranged) return false;
    const R = t.r + u.r + 0.4, g = { x: t.x - (t.fx || 0) * R, y: t.y - (t.fy || 0) * R }; MAP.pushOut(g, u.r);
    if (dist(u, g) > 0.5) { u.attackTarget = null; u.goal = g; return true; }
    u.stats.backstab = (u.stats.backstab || 0) + 1; return false;
  }

  G.T12 = { kazuki, ryoma, dahliaEscape, backstab, ASSASSIN, profile, vulnerable, noteCast, noteHit, assassin, lead, humanErr, idle, rays, slide, cornered, clampDash, retreatHp, berserk, berserkSkills };
})();
