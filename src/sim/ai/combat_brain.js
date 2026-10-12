'use strict';
// ===== GĐ11: BỘ NÃO CHIẾN ĐẤU (theo tài liệu "Duel Brain & Anti-Potion Loop" + "Damage Inference" + "Skill Taxonomy & Anti-Kite" + "Zone Tactics") =====
// 1. Tax      — phân loại kỹ năng tường minh (Damage / Mobility / CrowdControl / Defense / CounterParry + vai phụ GapCloser, EscapeDash,
//               HardCC, SoftCC, Knock, BurstDamage, ShieldBarrier, ProjectileParry…) suy ra từ dữ liệu chiêu; chiêu có thể ghi đè bằng def.tax.
// 2. Sanity   — kỷ luật bình máu: khóa uống khi đang chịu đòn / trong tầm xạ thủ / trong solo; chỉ uống khi đã cắt tầm nhìn, sau vật cản
//               hoặc cách xa > 12 đv. Ngoài bo không bao giờ đứng uống.
// 3. LastStand— "Đường Cùng Phản Sát": máu < 25%, không thoát được (kẻ đuổi nhanh hơn / xạ thủ bám sát, không chỗ nấp) → quay đầu khô máu.
// 4. Hit      — suy luận hướng đòn: ghi kẻ đánh, hướng đòn (cận chiến chính xác, tầm xa ±5°, vùng/bẫy = môi trường), trả đũa +ưu tiên,
//               xoay về hướng bị đánh, bắn trả mù dọc trục đạn, tướng mỏng lách ngang/tìm chỗ nấp.
// 5. AntiKite — nhận diện bị thả diều (ngoài tầm + đối thủ lùi + vừa trúng đòn tầm xa 2s) → lướt chéo 45° áp sát rồi khống chế;
//               hết chiêu cơ động thì zíc-zắc tìm chỗ nấp, không chạy thẳng làm bia.
// 6. Duel     — Solo 1v1: máy trạng thái NEUTRAL → ENGAGE → RESET → EXECUTE, lực hút tâm sàn, lực tách thân, quay mặt về đối thủ.
// 7. Zone     — ép bo: gác cổng (không bước ra ngoài bo đánh), khóa chân kẻ ngoài bão bằng khống chế, đứng phía trong để đẩy văng
//               kẻ sát mép ra ngoài (ring-out); ngoài bo máu thấp thì dùng chiêu cơ động chạy vào.
// 8. Bond     — liên minh vĩnh cửu (Luca ↔ Alice): bạn đánh nhau trong 35 đv → tới bọc lót, mở chiêu chia lửa; rảnh thì đi cùng.
// 9. Snap     — luật Snapback chung cho chiêu "dùng lại để về điểm neo": nguy → giật về; bị đuổi sát lúc sắp hết hạn → giật về;
//               đang ngoài bo mà điểm neo trong bo → giật về; còn lại không phí (hết hạn thì thôi).
// 10. Boss    — canh boss theo tính cách: Kền Kền đứng 15–20 đv chờ boss dưới 20% mới lao vào cướp; Ám Sát rình kẻ đang đánh boss;
//               Võ Sĩ / Bắt Nạt quay sang đánh người tranh boss; ai cũng biết "cửa sổ kết liễu" (đủ sát thương thì xả hết chiêu + Trừng Phạt).
// 11. Quiet   — kỷ luật âm thanh khi farm: nghe có tướng địch gần (≤ 35 đv) → không đốt chiêu cơ động / không xả mana dưới 40%.
// 12. Bind    — gắn hành vi theo nhánh tiến hóa đã chọn: nhánh "sau lưng" → đi vòng ra sau; "đỡ/phản đòn" → luôn đọc đòn để phản;
//               "mũi kiếm / cự ly" → giữ đúng cự ly ngọt; "kết liễu" → ưu tiên mục tiêu máu thấp; "không bị ngắt" → không tự hủy chiêu.
(function () {
  const G = globalThis.G;
  const M = G.M, MAP = G.MAP;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const low = (s) => String(s || '').toLowerCase();

  // ===================== 1. PHÂN LOẠI KỸ NĂNG =====================
  const CAT = { Damage: 1, Mobility: 2, CrowdControl: 4, Defense: 8, CounterParry: 16 };
  function tax(def, key) {
    if (!def) return null;
    if (def._tax) return def._tax;
    const a = def.ai || {}, t = low(def.name + ' ' + (def.desc || '')), o = { cat: 0, sub: {}, range: a.range || 3, dir: a.aim === 'point' || a.aim === 'away', wall: /xuyên tường|vượt tường|xuyên địa hình/.test(t), key };
    const add = (c) => { o.cat |= CAT[c]; };
    const sub = (s) => { o.sub[s] = 1; };
    if (/sát thương/.test(t) || ['poke', 'burst', 'ult'].includes(a.use)) add('Damage');
    if (a.use === 'burst' || a.use === 'ult') sub('BurstDamage');
    if (/máu đã mất|kết liễu|hành quyết|dưới \d+% máu/.test(t)) sub('ExecuteDamage');
    if (a.aim === 'away' || a.use === 'escape' || a.alsoEscape) { add('Mobility'); sub('EscapeDash'); }
    if (a.use === 'engage' || (/lướt|lao|nhảy|dịch chuyển|blink|tốc biến|xung phong/.test(t) && a.aim === 'point')) { add('Mobility'); sub('GapCloser'); if (a.aim === 'point') sub('SkillshotDodge'); }
    if (/choáng|trói|hất tung|câm lặng|giam|đóng băng|ngủ|kéo về/.test(t) || a.use === 'cc') { add('CrowdControl'); sub('HardCC'); }
    if (/làm chậm|chậm \d+%/.test(t)) { add('CrowdControl'); sub('SoftCC'); }
    if (/đẩy lùi|đẩy văng|hất văng|húc văng|ủi|đẩy kẻ/.test(t)) { add('CrowdControl'); sub('Knock'); }
    if (/khiên|giáp ảo|giảm \d+% sát thương|giảm sát thương|bất tử|miễn sát thương|hồi .*máu/.test(t) || a.use === 'defend' || a.use === 'support') { add('Defense'); sub('ShieldBarrier'); }
    if (/phản (đạn|đòn|lại)|chặn|đỡ|nuốt .*đạn|phản xạ|thế thủ|vòm/.test(t)) { add('CounterParry'); if (/đạn|tầm xa/.test(t)) sub('ProjectileParry'); else sub('MeleeRiposte'); }
    if (def.tax) { o.cat = 0; for (const c of def.tax.cat || []) add(c); o.sub = {}; for (const s of def.tax.sub || []) sub(s); }
    Object.defineProperty(def, '_tax', { value: o, enumerable: false });
    return o;
  }
  const has = (x, c) => !!(x && (x.cat & CAT[c]));
  // các chiêu sẵn sàng có nhãn
  function ready(ai, pred) {
    const m = ai.m, u = ai.u, out = [];
    for (const k of ['s1', 's2', 's3', 'sub', 's4']) {
      const def = u.hero.skills[k]; if (!def || (k !== 'sub' && !(u.ranks[k] > 0))) continue;
      if (!m.canCast(u, k) || u.recast[k]) continue;
      const x = tax(def, k); if (x && pred(x, def)) out.push({ k, def, x });
    }
    return out;
  }

  // ===================== 2. KỶ LUẬT BÌNH MÁU =====================
  const HARD = ['stun', 'root', 'knockup', 'charm', 'sleep'];
  const ccLeft = (e) => (e.statuses ? e.statuses.reduce((a, s) => (HARD.includes(s.type) ? Math.max(a, s.t) : a), 0) : 0);
  function covered(u, e) { return MAP.blocked(u.x, u.y, e.x, e.y, 0, true); }
  // trả lời: được phép đứng uống bình (máu / Hộ Vệ) lúc này không — lý do ghi vào ai.healWhy để xem
  function healOk(m, u) {
    const ai = u.ai; if (!ai) return true;
    const why = (s) => { ai.healWhy = s; return false; };
    if (m.zoneSt && m.zoneSt.dps > 0 && !m.inZone(u)) return why('ngoài bo — bình gần như vô dụng');
    if (u.duel && u.duel.state === 'fight') { const o = u.duel.a === u ? u.duel.b : u.duel.a; if (o && o.alive && ccLeft(o) < 2) return why('đang solo, đối thủ còn tự do'); }
    if (m.time - (u.lastAttT || -99) < 3 && u.lastAtt && (u.lastAtt.kind === 'hero' || (u.lastAtt.owner && u.lastAtt.owner.kind === 'hero'))) return why('vừa trúng đòn của tướng (< 3s)');
    let near = false;
    for (const e of m.heroes) {
      if (!e.alive || e === u || e.team === u.team || (G.H.isAlly && G.H.isAlly(m, u, e))) continue;
      const seen = e.vis && e.vis[u.team], d = dist(u, e);
      if (!seen) continue;                                                     // đã cắt tầm nhìn
      if (ccLeft(e) >= 2) continue;                                            // đối thủ bị khống chế cứng ≥ 2s
      const threat = e.ranged ? e.st.range + 4 : 6;
      if (d < threat && !covered(u, e)) return why('trong tầm bắn thẳng của ' + e.hero.name);
      if (d <= 12 && !covered(u, e)) near = true;
    }
    if (near) return why('đối thủ còn trong 12 đv, chưa có vật cản');
    ai.healWhy = null;
    return true;
  }

  // ===================== 3. ĐƯỜNG CÙNG PHẢN SÁT =====================
  function lastStand(ai, enemies) {
    const m = ai.m, u = ai.u;
    if (u.hpPct >= 0.25 || !enemies.length || ai.turnT > m.time) return false;
    let c = null, cd = 99; for (const e of enemies) { const d = dist(e, u); if (d < cd) { cd = d; c = e; } }
    if (!c || cd > 9) return false;
    const faster = c.st.ms >= u.st.ms * 0.95 && cd < 6;
    const sniper = c.ranged && cd <= c.st.range + c.r + u.r + 2;
    if (!faster && !sniper) return false;
    const bush = MAP.bushes.some((b) => dist(b, u) < 4);
    const esc = G.SkillAI.mobility(ai, false).length > 0 || ready(ai, (x) => x.sub.EscapeDash || x.sub.ShieldBarrier).length > 0;
    if (bush || esc || covered(u, c)) return false;
    ai.turnT = m.time + 3.5; ai.turnTgt = c; ai.clutch = (ai.clutch || 0) + 1; u.stats.clutch = (u.stats.clutch || 0) + 1;
    u.face(c.x, c.y);
    if (m.fxOn) m.fx({ type: 'callout', id: u.id, text: '🔥 Đường cùng — phản sát!', color: '#ff8a5a' });
    return true;
  }

  // ===================== 4. SUY LUẬN HƯỚNG ĐÒN & TRẢ ĐŨA =====================
  function onHit(m, tgt, owner, info, tot) {
    const ai = tgt.ai; if (!ai || !(tot > 0)) return;
    if (!owner || owner === tgt) return;
    const env = info.tag === 'zone' || info.tag === 'duel' || owner.kind === 'monster' || info.tag === 'dot';
    const src = info.src && info.src.x != null ? info.src : owner;
    const melee = dist(src, tgt) < 2.5 + (src.r || 0);
    let dx = src.x - tgt.x, dy = src.y - tgt.y;
    if (!melee && !env) { const a = Math.atan2(dy, dx) + (m.rngAI.next() - 0.5) * 0.17; const L = Math.hypot(dx, dy); dx = Math.cos(a) * L; dy = Math.sin(a) * L; }   // tầm xa: ±5°
    const hero = owner.kind === 'hero' ? owner : owner.owner && owner.owner.kind === 'hero' ? owner.owner : null;
    ai.hit = { t: m.time, x: tgt.x + dx, y: tgt.y + dy, dx, dy, melee, env, by: hero, unseen: !!(hero && hero.vis && hero.vis[tgt.team] === false) };
  }
  // phản ứng sau khi hết độ trễ nhận thức (ai.cog.freezeT đã chặn trước đó)
  function react(ai, enemies) {
    const m = ai.m, u = ai.u, h = ai.hit;
    if (!h || h.env || !h.by || !h.by.alive || m.time - h.t > 1.5 || h.done || u.cast || u.dash) return false;
    if (!h.unseen) { h.done = true; return false; }                         // thấy rồi: tầng chọn mục tiêu lo
    h.done = true;
    u.face(h.x, h.y);                                                          // xoay nón tầm nhìn về hướng bị đánh
    const est = { x: h.x, y: h.y }, d = dist(u, est);
    // bắn trả mù dọc trục đạn bằng chiêu định hướng / diện rộng
    const shot = ready(ai, (x, def) => has(x, 'Damage') && x.dir && (def.ai || {}).use !== 'ult' && x.range + 1.5 >= d);
    if (shot.length && m.rngAI.next() < 0.35 + 0.5 * ai.sk('fight')) {
      if (m.castSkill(u, shot[0].k, null, est)) { ai.callout('🎯 Bắn trả mù', '#ffb070'); u.stats.blindShot = (u.stats.blindShot || 0) + 1; return true; }
    }
    // mỏng manh / yếu máu: lách vuông góc trục đạn về phía bụi / vật cản
    if (u.ranged || u.hpPct < 0.5) {
      const L = Math.hypot(h.dx, h.dy) || 1, side = (u.id & 1) ? 1 : -1;
      let p = { x: u.x - h.dy / L * 4 * side, y: u.y + h.dx / L * 4 * side };
      const bush = MAP.bushes.find((b) => dist(b, u) < 8 && dist(b, est) > dist(u, est));
      if (bush) p = { x: bush.x, y: bush.y };
      MAP.pushOut(p, u.r);
      ai.goTo(p); ai.callout('🛡 Tránh trục đạn', '#cfe8ff');
      return true;
    }
    // đấu sĩ: lao về hướng bị đánh tìm kẻ đánh lén
    ai.goTo(est);
    return true;
  }

  // ===================== 5. CHỐNG THẢ DIỀU =====================
  function antiKite(ai, t, enemies) {
    const m = ai.m, u = ai.u;
    if (u.ranged || !t || t.kind !== 'hero' || u.cast || u.dash || m.time < (ai.akT || 0)) return false;
    const d = dist(u, t), reach = u.st.range + u.r + t.r;
    const away = ((t.vx || 0) * (t.x - u.x) + (t.vy || 0) * (t.y - u.y)) > 0;
    const hitRanged = m.time - (u.lastAttT || -99) < 2 && u.lastAtt && u.lastAtt.ranged;
    if (!(d > reach + 0.5 && away && hitRanged)) return false;
    ai.akT = m.time + 0.6;
    const v = M.dir(u, t);
    const closers = ready(ai, (x) => x.sub.GapCloser && x.range + 1 >= Math.min(d - reach, 6));
    if (closers.length) {
      const o = closers[0];
      // đối thủ đang niệm / có đạn đang bay tới → lướt chéo 45° (vừa né vừa thu hẹp); đang chạy lùi → lướt thẳng đón đầu
      const danger = (t.cast && t.cast.total > 0.2) || m.projs.some((p) => !p.dead && p.owner && p.owner.team !== u.team && dist(p, u) < 6);
      let p;
      if (danger) { const side = (u.id & 1) ? 1 : -1, px = -v.y * side, py = v.x * side, dx = v.x * 0.7 + px * 0.7, dy = v.y * 0.7 + py * 0.7, L = Math.hypot(dx, dy); p = { x: u.x + dx / L * o.x.range, y: u.y + dy / L * o.x.range }; }
      else { const lead = Math.min(1, d / 14); p = { x: t.x + (t.vx || 0) * lead, y: t.y + (t.vy || 0) * lead }; }
      MAP.pushOut(p, u.r);
      if (m.castSkill(u, o.k, t, p)) { ai.akCC = m.time + 1.5; ai.callout(danger ? '↗ Lướt chéo áp sát' : '⤴ Lướt đón đầu', '#ffe09a'); u.stats.antiKite = (u.stats.antiKite || 0) + 1; return true; }
    }
    // không có chiêu cơ động: zíc-zắc vào chỗ nấp, không chạy thẳng làm bia
    const bush = MAP.bushes.filter((b) => dist(b, u) < 9).sort((a, b) => dist(a, u) - dist(b, u))[0];
    const side = Math.sin(m.time * 3) > 0 ? 1 : -1;
    const g = bush ? { x: bush.x, y: bush.y } : { x: u.x + (v.x * 0.5 - v.y * side) * 3, y: u.y + (v.y * 0.5 + v.x * side) * 3 };
    MAP.pushOut(g, u.r); u.attackTarget = null; u.goal = g;
    ai.callout('〰 Zíc-zắc tìm chỗ nấp', '#cfe8ff');
    return true;
  }
  // vừa lướt tới: khóa đánh thường, khống chế trước rồi dồn sát thương
  function arrival(ai, t) {
    const m = ai.m, u = ai.u;
    if (!(ai.akCC > m.time) || u.dash || u.cast) return false;
    const cc = ready(ai, (x) => (x.sub.SoftCC || x.sub.HardCC) && x.range + t.r + 0.5 >= dist(u, t));
    if (cc.length && m.castSkill(u, cc[0].k, t, { x: t.x, y: t.y })) { ai.akCC = 0; return true; }
    return false;
  }

  // ===================== 6. SOLO 1V1 =====================
  function duel(ai, o) {
    const m = ai.m, u = ai.u, g = m.duelSt && m.duelSt.gate;
    const R = g && g.realm ? (G.C.DUEL_REALM || { r: 24 }).r : G.C.DUEL.ring;
    const c = g ? { x: g.x, y: g.y } : { x: u.x, y: u.y };
    u.face(o.x, o.y);                                                          // luôn quay mặt về đối thủ
    const d = dist(u, o), reach = u.st.range + u.r + o.r;
    const burst = G.SkillAI.burstOf(ai, o) * G.C.PVP_DMG;
    const down = ['s1', 's2', 's3'].filter((k) => u.ranks[k] > 0 && (u.cd[k] || 0) > 1.5).length;
    const keyReady = ready(ai, (x) => has(x, 'Damage') || has(x, 'CrowdControl')).length;
    let st;
    if (o.hp <= burst || o.hpPct < 0.2) st = 'execute';
    else if (keyReady && d < reach + 6) st = 'engage';
    else if (down >= 2 && u.fstyle !== 'allin' && u.persId !== 'cuongloan') st = 'reset';
    else st = 'neutral';
    ai.duelState = st;
    if (st === 'execute' || st === 'engage') { ai.fightMicro(o, [o], [u], true); }
    else if (st === 'reset') {
      // lùi zíc-zắc về phía tâm sàn chờ hồi chiêu; tầm xa vẫn bắn khi đòn sẵn
      if (u.ranged && u.atkT <= 0.15 && d <= reach) { u.attackTarget = o; u.goal = null; }
      else { const v = M.dir(o, u), side = Math.sin(m.time * 2.5 + u.id) > 0 ? 1 : -1; u.attackTarget = null; u.goal = { x: u.x + (v.x + -v.y * side * 0.8) * 3, y: u.y + (v.y + v.x * side * 0.8) * 3 }; }
    } else {
      // NEUTRAL: tầm xa đi vòng giữ 70–90% tầm bắn; cận chiến áp sát hình sin
      if (u.ranged) {
        const want = u.st.range * 0.8 + u.r + o.r, v = M.dir(o, u), side = ai.kiteSide || 1;
        if (u.atkT <= 0.15 && d <= reach) { u.attackTarget = o; u.goal = null; }
        else { u.attackTarget = null; u.goal = { x: o.x + v.x * want - v.y * side * 2, y: o.y + v.y * want + v.x * side * 2 }; }
      } else {
        const v = M.dir(u, o), w = Math.sin(m.time * 3 + u.id) * 0.8;
        if (d <= reach + 0.3) { u.attackTarget = o; u.goal = null; }
        else { u.attackTarget = null; u.goal = { x: u.x + (v.x - v.y * w) * 3, y: u.y + (v.y + v.x * w) * 3 }; }
      }
    }
    // lực hút tâm sàn + lực tách thân (chống kẹt góc, chống dính hitbox)
    if (u.goal) {
      const dc = dist(u.goal, c);
      if (dc > R * 0.7) { const k = Math.min(1, (dc - R * 0.7) / (R * 0.3)) * 0.8, v = M.dir(u.goal, c); u.goal.x += v.x * (dc - R * 0.7) * k; u.goal.y += v.y * (dc - R * 0.7) * k; }
      const sep = u.r + o.r + 0.5;
      if (dist(u.goal, o) < sep && st !== 'execute' && st !== 'engage') { const v = M.dir(o, u.goal); u.goal.x = o.x + v.x * sep; u.goal.y = o.y + v.y * sep; }
    }
    // tầm xa bị dính sát: lướt ra / đi vòng, không đứng dính
    if (u.ranged && d < u.r + o.r + 0.5 && !u.dash && !u.cast) {
      const esc = G.SkillAI.bestEscape(ai, [o], c, false);
      if (esc) G.SkillAI.castMob(ai, esc.o, esc.land);
    }
    return true;
  }

  // ===================== 7. ÉP BO =====================
  function zoneFight(ai, t, enemies) {
    const m = ai.m, u = ai.u, z = m.zoneSt;
    if (!z || !(z.dps > 0) || !t || t.kind !== 'hero' || u.cast || u.dash) return false;
    const cur = z.cur, inMe = m.inZone(u, 0.5), dT = dist(t, cur), edge = cur.r - dT;
    if (!inMe) return false;
    // khóa chân trong bão: đối thủ đang ở ngoài bo cố chạy vào → xả khống chế cứng
    if (edge < 0) {
      const cc = ready(ai, (x) => x.sub.HardCC || x.sub.SoftCC || x.sub.Knock).filter((o) => o.x.range + t.r + 1 >= dist(u, t));
      if (cc.length && m.castSkill(u, cc[0].k, t, { x: t.x, y: t.y })) { ai.callout('☣ Giữ chân ngoài bão', '#b0ff70'); u.stats.zoneLock = (u.stats.zoneLock || 0) + 1; return true; }
      // gác cổng: không bước ra ngoài bo đánh — đứng mép trong chờ
      if (edge < -1) { const v = M.dir(cur, t), p = { x: cur.x + v.x * (cur.r - 1.5), y: cur.y + v.y * (cur.r - 1.5) }; MAP.pushOut(p, u.r); if (dist(u, t) > u.st.range + u.r + t.r) { u.attackTarget = null; u.goal = p; return true; } }
      return false;
    }
    // ring-out: đối thủ sát mép (< 6 đv) → đứng phía trong rồi tung chiêu đẩy văng ra ngoài
    if (edge < 6) {
      const knocks = ready(ai, (x) => x.sub.Knock).filter((o) => o.x.range + t.r + 1 >= dist(u, t));
      if (knocks.length) {
        const vIn = M.dir(t, cur), vMe = M.dir(t, u);
        if (vIn.x * vMe.x + vIn.y * vMe.y > 0.5) { if (m.castSkill(u, knocks[0].k, t, { x: t.x, y: t.y })) { ai.callout('💨 Đẩy ra ngoài bo!', '#b0ff70'); u.stats.ringOut = (u.stats.ringOut || 0) + 1; return true; } }
        else { const p = { x: t.x + vIn.x * (u.r + t.r + 1.2), y: t.y + vIn.y * (u.r + t.r + 1.2) }; MAP.pushOut(p, u.r); u.attackTarget = null; u.goal = p; return true; }
      }
    }
    return false;
  }
  // ngoài bo + máu thấp: không đứng uống, dùng chiêu cơ động chạy vào
  function zoneEscape(ai) {
    const m = ai.m, u = ai.u, z = m.zoneSt;
    if (!z || !(z.dps > 0) || m.inZone(u) || u.cast || u.dash || m.time < (ai.zeT || 0)) return false;
    const opts = G.SkillAI.mobility(ai, true).concat(ready(ai, (x) => x.sub.GapCloser || x.sub.EscapeDash).map((o) => ({ k: o.k, r: o.x.range, wall: o.x.wall })));
    if (!opts.length) return false;
    ai.zeT = m.time + 1;
    const v = M.dir(u, z.cur), o = opts[0], land = G.SkillAI.landing(u, v.x, v.y, o.r || 4, o.wall);
    if (m.castSkill(u, o.k, null, land)) { ai.callout('🏃 Lướt vào bo', '#b0ff70'); return true; }
    return false;
  }

  // ===================== 8. LIÊN MINH VĨNH CỬU =====================
  function bond(ai, enemies) {
    const m = ai.m, u = ai.u;
    if (!G.eternal || m.aliveCount() <= 2 || u.hpPct < 0.3 || ai.act === 'retreat' || ai.act === 'zone' || u.cast || u.dash) return false;
    const p = m.heroes.find((h) => h.alive && h !== u && G.eternal(u.heroId, h.heroId)); if (!p) return false;
    const dp = dist(u, p); if (dp > 35) return false;
    let foe = p.ai && p.ai.mode === 'fight' && p.ai.target && p.ai.target.kind === 'hero' && p.ai.target.alive ? p.ai.target : null;
    if (!foe && p.lastAtt && m.time - (p.lastAttT || -99) < 3) { const a = G.ownerOf(p.lastAtt); if (a && a.kind === 'hero' && a.alive && a !== u) foe = a; }
    if (foe && (foe === u || G.eternal(u.heroId, foe.heroId))) foe = null;
    if (foe) {
      if (ai.target && ai.target.kind === 'hero' && ai.target !== foe && ai.target.alive && dist(u, ai.target) < 6) return false;   // đang dính đối thủ khác sát người
      if (!(m.time < (ai.bondT || 0))) { ai.bondT = m.time + 8; ai.callout('🤝 Bọc lót ' + p.hero.name, '#ff9ac0'); u.stats.bond = (u.stats.bond || 0) + 1; }
      const df = dist(u, foe);
      if (df > 9 || !foe.vis[u.team]) { u.attackTarget = null; ai.goTo({ x: (p.x + foe.x) / 2, y: (p.y + foe.y) / 2 }); return true; }
      const bo = u.hero.ai.bondOpen; if (bo && bo(m, u, foe, p)) return true;   // Luca: mở Sân Khấu chia lửa
      ai.mode = 'fight'; ai.target = foe; ai.fightMicro(foe, enemies.includes(foe) ? enemies : enemies.concat([foe]), [p]); return true;
    }
    // rảnh: đi cùng nhau, giữ cách 3–6 đv
    if (!enemies.length && dp > 7 && dp < 25 && (ai.act === 'roam' || ai.act === 'hide') && !(p.ai && p.ai.act === 'retreat')) {
      u.attackTarget = null; ai.goTo({ x: p.x + (u.x - p.x) / dp * 4, y: p.y + (u.y - p.y) / dp * 4 }); return true;
    }
    return false;
  }

  // ===================== 9. SNAPBACK =====================
  // trả true = giật về ngay • false = giữ (kể cả lúc sắp hết hạn) • null = không phải chiêu có điểm neo, để luật cũ quyết
  function snapWhen(ai, k, rc) {
    const m = ai.m, u = ai.u, A = rc.anchor; if (!A) return null;
    const foes = ai.visibleEnemyHeroes(9), near = foes.length ? foes.reduce((a, b) => (dist(a, u) < dist(b, u) ? a : b)) : null;
    const safer = !near || dist(A, near) > dist(u, near) + 1.5;
    const z = m.zoneSt;
    let why = null;
    // GĐ12: né chiêu lớn bằng snapback — đang đứng trong vùng cảnh báo sắp nổ (< 0.7s) mà điểm neo nằm ngoài vùng
    const big = m.dangers.find((d) => d.until > m.time && d.until - m.time < 0.7 && d.team !== u.team && G.Danger.inside(d, u.x, u.y, u.r) && !G.Danger.inside(d, A.x, A.y, u.r));
    if (big) why = 'dodge';
    else if (z && z.dps > 0 && !m.inZone(u) && m.inZone(A)) why = 'zone';
    else if (near && u.hpPct < 0.4 && m.time - (u.lastDmgT || -99) < 1.5 && safer) why = 'danger';
    else if (near && rc.until - m.time < 0.3 && dist(near, u) < 6 && safer) why = 'expire';
    if (!why) return false;
    u.stats.snap = (u.stats.snap || 0) + 1;
    ai.callout(why === 'zone' ? '↩ Giật về trong bo' : '↩ Giật về điểm neo', '#e0c0ff');
    return true;
  }

  // ===================== 10. CANH BOSS THEO TÍNH CÁCH =====================
  function bossTiming(ai, B, home) {
    const m = ai.m, u = ai.u, C = G.C;
    const rivals = m.heroes.filter((h) => h.alive && h !== u && !G.H.isAlly(m, u, h) && dist(h, B) < C.LEASH + B.r + 4);
    // cửa sổ kết liễu: tổng sát thương sẵn sàng ≥ máu boss → xả hết (kể cả chiêu cuối) + Trừng Phạt
    const lethal = G.SkillAI.burstOf(ai, B) * 0.8 + (m.bagCount && m.bagCount(u, 'smite') > 0 ? 500 + 60 * u.level : 0);
    if (B.hp <= lethal && dist(u, B) < u.st.range + u.r + B.r + 4) {
      if (!(m.time < (ai.lethalT || 0))) { ai.lethalT = m.time + 3; ai.callout('⚡ Cửa sổ kết liễu boss!', '#ffd24a'); u.stats.bossLethal = (u.stats.bossLethal || 0) + 1; }
      for (const k of ['s4', 's1', 's2', 's3']) { const d = u.hero.skills[k]; if (!d || !d.ai || ['escape', 'support', 'defend'].includes(d.ai.use)) continue; if (m.canCast(u, k) && m.castSkill(u, k, B, { x: B.x, y: B.y })) return true; }
      return false;
    }
    if (!rivals.length) return false;
    const id = u.persId;
    // Kền Kền: đứng 15–20 đv chờ boss < 20% (người khác gánh đòn)
    if ((id === 'kenken' || id === 'nguyquan' || id === 'honloan') && B.hpPct > 0.2) {
      const v = M.dir(home, u), p = { x: home.x + v.x * (C.LEASH + B.r + 6), y: home.y + v.y * (C.LEASH + B.r + 6) }; MAP.pushOut(p, u.r);
      if (!(m.time < (ai.vultT || 0))) { ai.vultT = m.time + 6; ai.callout('🦅 Chờ boss yếu rồi cướp', '#ffb0a0'); u.stats.bossWait = (u.stats.bossWait || 0) + 1; }
      u.attackTarget = null; ai.goTo(p); return true;
    }
    // Ám Sát / Bắt Nạt / Võ Sĩ: kẻ đang đánh boss bị thương → đánh người, không đánh boss
    const weak = rivals.find((r) => r.hpPct < 0.55 && r.vis[u.team]);
    if (weak && (id === 'amsat' || id === 'batnat' || id === 'vosi' || id === 'tramtuong' || u.hero.ai.role === 'assassin')) {
      if (!(m.time < (ai.vultT || 0))) { ai.vultT = m.time + 6; ai.callout('🗡 Đánh kẻ tranh boss', '#ffb0a0'); }
      ai.mode = 'fight'; ai.target = weak; ai.fightMicro(weak, [weak], ai.alliesNear || []); return true;
    }
    return false;
  }

  // ===================== 11. KỶ LUẬT ÂM THANH KHI FARM =====================
  function quiet(ai) {
    const m = ai.m, u = ai.u;
    if (m.time < (ai.quietChk || 0)) return ai.quietOn;
    ai.quietChk = m.time + 1;
    ai.quietOn = m.heroes.some((h) => h.alive && h !== u && !G.H.isAlly(m, u, h) && dist(h, u) < 35 && (h.vis[u.team] || m.time - (h.lastAtkT || h.lastDmgT || -99) < 3));
    return ai.quietOn;
  }

  // ===================== 12. GẮN HÀNH VI THEO NHÁNH TIẾN HÓA =====================
  function bind(u) {
    const B = u.bind || (u.bind = {});
    for (const b of u.tfx || []) {
      const t = low(b.name + ' ' + (b.desc || ''));
      if (/sau lưng|từ phía sau|đánh lén/.test(t)) B.flank = 1;
      if (/đỡ được|phản đòn|phản kích|thế thủ|chặn đòn|đỡ đòn/.test(t)) B.parry = 1;
      if (/mũi kiếm|điểm ngọt|cự ly|ở mép tầm/.test(t)) B.tip = 1;
      if (/kết liễu|hành quyết|dưới \d+% máu|máu thấp/.test(t)) B.exec = 1;
      if (/không bị ngắt|không thể bị ngắt|không bị gián đoạn|gồng/.test(t)) B.noCancel = 1;
    }
    return B;
  }
  // gác cổng / khóa bão — không thả diều ra ngoài bo
  G.Brain = { CAT, tax, has, ready, healOk, lastStand, onHit, react, antiKite, arrival, duel, zoneFight, zoneEscape, ccLeft, bond, snapWhen, bossTiming, quiet, bind };
})();
