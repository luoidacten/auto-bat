'use strict';
// ===== GĐ10: BỘ NÃO NHẬN THỨC (theo tài liệu bổ sung — Utility AI sinh tồn & mô phỏng con người) =====
// 1. TreeAI — chọn nhánh cây tiến hóa lúc mở mốc bằng điểm tiện ích:
//      U(N) = 0.35·S_Build + 0.30·S_Counter + 0.20·S_Zone + 0.15·S_Persona   (bỏ chọn ngẫu nhiên)
// 2. Cog — trễ nhận thức: T = T_base(kiểu tướng) + ΔT bất ngờ + ΔT mù tiêu điểm; hoảng loạn (máu tụt nhanh) → bấm nhầm / lệch góc.
// 3. Afford — véc-tơ khả dụng của chiêu (sát thương / cơ động / khống chế / phòng thủ) suy ra từ dữ liệu chiêu, dùng cho mọi tướng mới.
// Không phụ thuộc tên tướng: mọi suy luận đọc từ mô tả nhánh, dữ liệu chiêu, chỉ số và tính cách.
(function () {
  const G = globalThis.G;
  const M = G.M;
  const low = (s) => String(s || '').toLowerCase();
  const has = (txt, re) => re.test(txt);

  // ---------- nhãn của một nhánh (đọc từ tên + mô tả + chỉ số) ----------
  const TAG_RE = {
    ap: /công phép|smpt|sát thương phép|phép/,
    atk: /tốc đánh|băng đạn|viên|nạp đạn|đánh thường|chí mạng|xuyên giáp|công vật lý|đòn đánh/,
    tank: /giáp|khiên|hồi .*máu|máu tối đa|giảm .*sát thương|kháng|hút máu|bất tử|chí tử|thoát chết/,
    antiRanged: /phản|đạn|khói|lướt|dịch chuyển|né|áp sát|tiếp cận/,
    antiArmor: /sát thương chuẩn|xuyên|hộ giáp|phá giáp|phá .*giáp|bỏ qua/,
    antiStealth: /lộ diện|tàng hình|radar|quét|bẫy|soi|chân thị/,
    farm: /quái|farm|tốc chạy|mana|hồi chiêu|nội năng|năng lượng/,
    late: /choáng|trói|hất|cấm|bất tử|chí tử|thoát chết|diện rộng|bán kính|vây|nhốt|giam/,
    exec: /kết liễu|máu thấp|dưới \d+%|hành quyết|cướp/,
    stealth: /tàng hình|ngụy trang|bụi/,
    burst: /sát thương|chí mạng|sau lưng|bùng nổ|nổ/,
  };
  function tagsOf(b) {
    if (b._tags) return b._tags;
    const t = low(b.name + ' ' + (b.desc || '')), o = {};
    for (const k in TAG_RE) if (has(t, TAG_RE[k])) o[k] = 1;
    const s = b.stats || {};
    if (s.ap || s.magicAmp || s.magicPen) o.ap = 1;
    if (s.ad || s.physAmp || s.asPct || s.crit || s.armorPen) o.atk = 1;
    if (s.hp || s.armor || s.mr || s.gaMax || s.tenacity) o.tank = 1;
    if (s.msPct || s.cdr || s.mpr) o.farm = 1;
    Object.defineProperty(b, '_tags', { value: o, enumerable: false });
    return o;
  }
  // thiên hướng lối build hiện tại (0..1 mỗi trục)
  function buildLean(u) {
    const st = u.st, base = u.base || {};
    const ap = Math.min(1, (st.ap || 0) / 120 + (st.magicAmp || 0)), atk = Math.min(1, Math.max(0, (st.ad - (base.ad || st.ad)) / 80) + Math.max(0, st.asBonus - (base.asBonus || 0)) + (st.crit || 0));
    const tank = Math.min(1, Math.max(0, (st.maxHp / Math.max(1, (base.hp || st.maxHp)) - 1)) + (st.armor > 60 ? 0.3 : 0) + (u.bonus.gaMax ? 0.2 : 0));
    const k = u.hero.dmgType === 'magic' ? { ap: 0.5, atk: 0, tank: 0 } : { ap: 0, atk: 0.5, tank: 0 };
    if (u.hero.kit === 'tank') k.tank += 0.5;
    return { ap: Math.min(1, ap + k.ap), atk: Math.min(1, atk + k.atk), tank: Math.min(1, tank + k.tank) };
  }
  // thành phần sảnh đấu còn sống
  function lobby(m, u) {
    const L = m.heroes.filter((h) => h.alive && h !== u);
    return {
      ranged: L.filter((h) => h.hero.kit === 'marksman' || h.hero.gun || (h.hero.tags || []).includes('gun')).length,
      armored: L.filter((h) => h.hero.kit === 'tank' || (h.st.maxGa || 0) > 900 || h.st.armor > 90).length,
      stealth: L.filter((h) => (h.hero.tags || []).some((t) => t === 'stealth' || t === 'illusion')).length,
    };
  }
  const PERS_LIKES = {
    kenken: ['exec'], thamfarm: ['farm'], chuotlui: ['stealth', 'tank'], amsat: ['burst', 'exec'], tramtuong: ['burst'], cuongloan: ['burst', 'tank'],
    hobao: ['burst'], vosi: ['burst'], cuongtin: ['tank'], nguyquan: ['stealth'], bipbom: ['stealth'], cauton: ['tank', 'farm'], hoabinh: ['tank'],
  };
  function scoreBranch(m, u, b, ti) {
    const T = tagsOf(b), lean = buildLean(u), lob = lobby(m, u), phase = m.zoneSt ? m.zoneSt.phase : -1;
    const sBuild = Math.min(1, (T.ap ? lean.ap * 0.8 : 0) + (T.atk ? lean.atk * 0.9 : 0) + (T.tank ? lean.tank * 0.8 : 0) + 0.15);
    let sCounter = 0.2;
    if (lob.ranged >= 3 && T.antiRanged) sCounter += 0.5;
    if (lob.armored >= 2 && T.antiArmor) sCounter += 0.5;
    if (lob.stealth >= 2 && T.antiStealth) sCounter += 0.4;
    // bị khắc chế thường xuyên (bị cận chiến áp sát ngắt chiêu) → nhánh phòng thủ
    if ((u.stats.potBroken || 0) + (u.stats.d || 0) > 2 && T.tank) sCounter += 0.3;
    sCounter = Math.min(1, sCounter);
    let sZone = 0.3;
    if (phase <= 2 && T.farm) sZone += 0.5;
    if (phase >= 3) { if (T.late) sZone += 0.6; if (T.farm) sZone -= 0.2; }
    // mốc cao (12) là "phong cách" — chơi lâu dài nên cộng nhẹ cho nhánh kết thúc trận
    if (ti >= 4 && T.late) sZone += 0.1;
    sZone = Math.max(0, Math.min(1, sZone));
    const likes = PERS_LIKES[u.persId] || [];
    const sPers = Math.min(1, 0.25 + likes.reduce((s, k) => s + (T[k] ? 0.45 : 0), 0));
    const U = 0.35 * sBuild + 0.30 * sCounter + 0.20 * sZone + 0.15 * sPers;
    // lý do nổi bật nhất (hiện trên thẻ tướng)
    const parts = [[0.35 * sBuild, 'hợp lối build'], [0.30 * sCounter, lob.armored >= 2 && T.antiArmor ? 'sảnh nhiều tướng giáp dày' : lob.ranged >= 3 && T.antiRanged ? 'sảnh nhiều xạ thủ' : lob.stealth >= 2 && T.antiStealth ? 'sảnh có kẻ tàng hình' : 'khắc chế đối thủ'], [0.20 * sZone, phase >= 3 ? 'bo hẹp' : 'đầu trận cần farm'], [0.15 * sPers, 'đúng tính cách']];
    parts.sort((a, b) => b[0] - a[0]);
    return { U, why: parts[0][1] };
  }
  const TreeAI = {
    // chọn nhánh cho mốc ti (0..4) lúc vừa mở — hỗ trợ mốc có ít hơn 3 nhánh
    pick(m, u, ti) {
      const opts = (u.hero.tree && u.hero.tree[ti]) || [];
      const rng = m.treeRng || (m.treeRng = new G.Rng(m.seed + ':tree'));
      let best = -1, bestU = -1, why = '';
      for (let j = 0; j < opts.length; j++) {
        if (!opts[j]) continue;
        const s = scoreBranch(m, u, opts[j], ti), U = s.U + rng.range(0, 0.06);   // nhiễu nhỏ: cùng tình huống vẫn có lúc chọn khác
        if (U > bestU) { bestU = U; best = j; why = s.why; }
      }
      if (best < 0) return 0;
      (u.treeWhy || (u.treeWhy = []))[ti] = why;
      return best;
    },
    scoreBranch,
  };

  // ---------- véc-tơ khả dụng của chiêu ----------
  const USE_VEC = {
    poke: { dmg: 0.6, mob: 0, cc: 0.1, def: 0 }, burst: { dmg: 0.9, mob: 0.1, cc: 0.1, def: 0 }, engage: { dmg: 0.5, mob: 0.8, cc: 0.3, def: 0 },
    cc: { dmg: 0.4, mob: 0, cc: 0.9, def: 0.1 }, escape: { dmg: 0.1, mob: 0.9, cc: 0, def: 0.3 }, defend: { dmg: 0.1, mob: 0, cc: 0.1, def: 0.9 },
    support: { dmg: 0, mob: 0.1, cc: 0, def: 0.8 }, ult: { dmg: 0.9, mob: 0.2, cc: 0.5, def: 0.2 }, custom: { dmg: 0.4, mob: 0.3, cc: 0.3, def: 0.3 },
  };
  function Afford(def) {
    if (!def) return null;
    if (def._aff) return def._aff;
    const a = def.ai || {}, v = Object.assign({}, USE_VEC[a.use] || USE_VEC.custom), t = low(def.name + ' ' + (def.desc || ''));
    if (/lướt|dịch chuyển|nhảy|lao|tốc chạy/.test(t)) v.mob = Math.max(v.mob, 0.7);
    if (/choáng|trói|hất|câm lặng|làm chậm|kéo|giam/.test(t)) v.cc = Math.max(v.cc, 0.6);
    if (/khiên|giáp ảo|giảm .*sát thương|bất tử|miễn|hồi .*máu/.test(t)) v.def = Math.max(v.def, 0.6);
    if (/sát thương/.test(t)) v.dmg = Math.max(v.dmg, 0.5);
    if (a.alsoEscape) v.mob = Math.max(v.mob, 0.6);
    v.range = a.range || 3; v.type = a.aim === 'self' ? 'instant' : a.speed > 0 ? 'projectile' : a.aim === 'away' ? 'dash_directional' : 'instant';
    Object.defineProperty(def, '_aff', { value: v, enumerable: false });
    return v;
  }

  // ---------- trễ nhận thức & hoảng loạn ----------
  // khung phản xạ (giây) theo kiểu hành vi — đã nén ×0.6 so với tài liệu vì vòng nghĩ của mô phỏng chỉ là phần "nhận biết", chưa gồm thao tác tay
  function archetype(u) {
    const kit = u.hero.kit, st = u.fstyle, role = u.hero.ai && u.hero.ai.role;
    if (role === 'assassin' || (kit === 'fighter' && st !== 'allin')) return [0.13, 0.19];
    if (st === 'allin' || u.persId === 'cuongloan') return [0.30, 0.42];
    if (kit === 'marksman' || kit === 'tank') return [0.20, 0.28];
    return [0.38, 0.52];
  }
  const Cog = {
    init(ai) {
      const m = ai.m, u = ai.u, r = archetype(u);
      ai.cog = { base: (r[0] + m.rngAI.next() * (r[1] - r[0])) * 0.6, freezeT: 0, tunnelT: 0, panic: 0, hpLog: [], surprised: 0, panics: 0, fat: 0, miss: 0 };
    },
    // cộng vào thời gian nghĩ (được gọi trong reactTime)
    extra(ai) { const c = ai.cog; return c ? c.base * 0.5 : 0; },
    frozen(ai) { const c = ai.cog; return !!(c && c.freezeT > ai.m.time); },
    // trúng đòn: bất ngờ (kẻ đánh đang tàng hình / ngoài tầm nhìn) hoặc mù tiêu điểm (đang dí mục tiêu máu thấp, bị đánh từ sườn)
    onHit(m, tgt, owner, tot) {
      const ai = tgt.ai, c = ai && ai.cog; if (!c || !owner || owner === tgt || owner.kind !== 'hero' || !(tot > 0)) return;
      const unseen = (owner.vis && owner.vis[tgt.team] === false) || (owner.statuses.length && owner.has('stealth')) || (m.time - (owner.revealT || -9) < 0.4);
      if (unseen && m.time > c.freezeT + 1.5) { c.freezeT = m.time + 0.25 + m.rngAI.next() * 0.25; c.surprised++; if (m.fxOn && m.rngAI.next() < 0.35) m.fx({ type: 'callout', id: tgt.id, text: '❗ Giật mình', color: '#ffd0a0' }); return; }
      const t = ai.target;
      if (t && t.alive && t.hpPct < 0.25 && t !== owner && m.time > c.tunnelT) {
        const fx = tgt.fx, fy = tgt.fy, dx = owner.x - tgt.x, dy = owner.y - tgt.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
        if ((fx * dx + fy * dy) / L < 0.866) { c.freezeT = Math.max(c.freezeT, m.time + 0.2 + m.rngAI.next() * 0.15); c.tunnelT = m.time + 3; }
      }
    },
    // nhật ký máu → chỉ số hoảng loạn (máu tụt > 40% trong 0.5s → vọt lên; tự nguội dần)
    tick(ai) {
      const c = ai.cog, u = ai.u, m = ai.m; if (!c) return;
      c.hpLog.push(u.hp); if (c.hpLog.length > 5) c.hpLog.shift();   // ~0.5s (mỗi 0.1s một mẫu)
      const drop = (c.hpLog[0] - u.hp) / u.st.maxHp;
      if (drop > 0.4) { if (c.panic < 0.7) c.panics++; c.panic = 1; }
      else if (drop > 0.2) c.panic = Math.max(c.panic, 0.6 + drop);
      c.panic = Math.max(0, c.panic - 0.04 * (m.tick % 10 === 0 ? 1 : 0));
    },
    // hoảng loạn khi ra chiêu: 20% bấm nhầm chiêu (theo véc-tơ khả dụng), 25% lệch góc 15–40°
    perturb(m, u, key, tgt, pt) {
      const ai = u.ai, c = ai && ai.cog; if (!c || c.panic <= 0.7 || key === 's4') return null;
      const S = u.hero.skills, want = Afford(S[key]);
      if (want && m.rngAI.next() < 0.2) {
        // định chạy mà bấm nhầm chiêu đánh (hoặc ngược lại)
        const alt = ['s1', 's2', 's3', 'sub'].filter((k) => k !== key && S[k] && m.canCast(u, k) && !u.recast[k]).map((k) => ({ k, a: Afford(S[k]) }))
          .sort((a, b) => (want.mob > 0.6 ? b.a.dmg - a.a.dmg : b.a.def - a.a.def) || (a.k < b.k ? -1 : 1))[0];
        if (alt) { c.fat++; return { key: alt.k, tgt, pt }; }
      }
      if (pt && m.rngAI.next() < 0.25) {
        const dx = pt.x - u.x, dy = pt.y - u.y, a = (15 + 25 * m.rngAI.next()) * Math.PI / 180 * (m.rngAI.next() < 0.5 ? -1 : 1), cs = Math.cos(a), sn = Math.sin(a);
        c.miss++;
        return { key, tgt, pt: { x: u.x + dx * cs - dy * sn, y: u.y + dx * sn + dy * cs } };
      }
      return null;
    },
  };
  // ---------- câu thoại quan hệ khi gặp nhau lần đầu ----------
  const Rel = {
    check(m) {
      if (!G.relLine || m.tick % 10 !== 0) return;
      for (const a of m.heroes) {
        if (!a.alive) continue;
        for (const b of m.heroes) {
          if (b === a || !b.alive || (a.metRel && a.metRel[b.heroId]) || !b.vis || !b.vis[a.team] || M.dist(a, b) > 14) continue;
          const line = G.relLine(a.heroId, b.heroId); (a.metRel || (a.metRel = {}))[b.heroId] = 1;
          if (line && m.fxOn) m.fx({ type: 'callout', id: a.id, text: '💬 ' + line, color: '#e8d8ff' });
          if (line) m.addFeed && m.addFeed({ type: 'rel_line', hero: a, other: b, text: line });
        }
      }
    },
  };
  G.TreeAI = TreeAI; G.Afford = Afford; G.Cog = Cog; G.RelTalk = Rel;
})();
