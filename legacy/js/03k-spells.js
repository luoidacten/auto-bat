'use strict';
// ===== Phép Bổ Trợ (chọn trước mỗi hiệp — mặc định mang 1, có 🔮 Bùa Song Phép thì mang 2) =====
// Mỗi phép: cd (giây), react (AI xét mỗi khung hình kể cả khi đang bay/choáng), when(f,t,m,d,br) điều kiện AI tự dùng,
// use(f,m,t) hiệu ứng • counters: tướng nên mang phép này để khắc chế (HLV máy dựa vào đây đổi phép giữa hiệp).
function spellReady(f, id) { return !((f.scd && f.scd[id]) > 0); }
function liveRiskOut(f, m) { return f.falling <= 0 && flyingOut(f, m); }
const SPELLS = {
  flash: { name: 'Tốc Biến Vực Sâu', icon: '🌀', cd: 45, react: true, counters: ['death', 'clint', 'valerius'],
    desc: 'Dịch chuyển tức thời 3.5m theo hướng di chuyển — dùng được cả khi đang bị đánh văng trên không / rơi khỏi mép (giật ngược về sàn).',
    when: (f, t, m) => liveRiskOut(f, m) || (t && m.time - (t._ultAt ?? -9) < 0.4 && ['truong', 'con'].includes(t.weaponId) && dist(f, t) < 300),
    use(f, m) {
      const out = liveRiskOut(f, m) || f.falling > 0;
      const a = out ? Math.atan2(-f.y, -f.x) : (f.moveDir.x || f.moveDir.y) ? Math.atan2(f.moveDir.y, f.moveDir.x) : f.facing;
      const p = m.arena.clamp({ x: f.x + Math.cos(a) * 140, y: f.y + Math.sin(a) * 140 }, f.r + 30);
      m.fx({ type: 'ghost', x: f.x, y: f.y, r: f.r, color: '#a080ff', life: 0.35 });
      f.x = p.x; f.y = p.y; f.vx = f.vy = 0; f.hitstun = 0; f.pendingKnock = null; f.falling = 0; f.z = 0; f.vz = 0; f.cancelDash();
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 36, color: '#a080ff', life: 0.35, w: 5 });
    } },
  anchor: { name: 'Neo Trọng Lực', icon: '⚓', cd: 35, react: true, counters: ['borg', 'theron', 'victoria'],
    desc: 'Ghim chân 3s: +80% kháng đẩy lùi (không thể bị hất tung hay trượt) nhưng -40% tốc chạy.',
    when: (f, t, m, d) => m.arena.edgeDist(f.x, f.y) < 80 && t && d < 200 && t.action && t.action.atk,
    use(f, m) { f._anchorT = m.time + 3; f.addStatus('slow', 3, 0.4); m.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#9ab0c0', life: 3, w: 4 }); } },
  pulse: { name: 'Sóng Xung Lực', icon: '💥', cd: 30, counters: [],
    desc: 'Sóng chấn động 360° bán kính 2.5m: sát thương nhẹ nhưng lực đẩy văng cực lớn.',
    when: (f, t, m, d) => t && d < 100 && (m.arena.edgeDist(t.x, t.y) < 70 || t.percent > 90 || m.enemiesOf(f).filter((e) => dist(e, f) < 110).length > 1),
    use(f, m) { m.hitCircle(f, { r: 100, dmg: 3, kb: 320, kg: 5, tag: 'X' }); m.fx({ type: 'ring', x: f.x, y: f.y, r: 100, color: '#ffe07a', life: 0.4, w: 10 }); m.shake(8); } },
  cleanse: { name: 'Bất Khuất', icon: '✊', cd: 40, react: true, counters: ['wukong', 'florian', 'thanhphong', 'galo'],
    desc: 'Thanh tẩy 100% hiệu ứng bất lợi (Choáng, Mù, Câm, Ngủ, Độc...) và Miễn Khống Chế 1.5s.',
    when: (f) => (f.has('stun') && f.has('stun').t > 0.7) || (f.has('root') && f.has('root').t > 0.8) || f.has('charm') || (f.has('silence') && f.has('silence').t > 1.2) || f._stoneUntil > 0 && f.has('stun'),
    use(f, m) { f.cleanse(); f._sleepT = 0; f.hitstun = 0; f.focus = null; f.addStatus('unstoppable', 1.5); m.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#ffffff', life: 0.35, w: 6 }); } },
  grapple: { name: 'Dây Móc Động Năng', icon: '🪝', cd: 35, react: true, counters: ['elara', 'percy', 'zero'],
    desc: 'Bắn cáp từ tính: đang văng khỏi sàn → kéo về tâm sàn • trúng kẻ địch (≤8m) → kéo về phía mình và làm chậm 50% 1.5s.',
    when: (f, t, m, d) => liveRiskOut(f, m) || (t && !f.weapon.ai.ranged && d > 200 && d < 320 && f.canAct()),
    use(f, m, t) {
      if (liveRiskOut(f, m) || f.falling > 0) {
        const p = m.arena.clamp({ x: f.x * 0.6, y: f.y * 0.6 }, f.r + 40);
        m.fx({ type: 'line', x1: f.x, y1: f.y, x2: 0, y2: 0, color: '#cfe8ff', life: 0.35, w: 3 });
        f.x = p.x; f.y = p.y; f.vx = f.vy = 0; f.hitstun = 0; f.pendingKnock = null; f.falling = 0; f.z = 0; f.cancelDash();
        return;
      }
      t = t || m.nearestEnemy(f);
      if (!t || dist(f, t) > 320) return;
      m.fx({ type: 'line', x1: f.x, y1: f.y, x2: t.x, y2: t.y, color: '#cfe8ff', life: 0.35, w: 3 });
      if (!t.has('unstoppable')) pullTo(f, t, f.r + t.r + 20, 900, 0.35);
      t.addStatus('slow', 1.5, 0.5);
    } },
  purge: { name: 'Thanh Lọc Thể Trọng', icon: '💧', cd: 50, counters: ['galo', 'ignatius'],
    desc: 'Giảm ngay 30% điểm văng hiện tại và nhận khiên hồi phục 4s.',
    when: (f) => f.percent >= 90,
    use(f, m) { const d = f.percent * 0.3; f.percent -= d; f.addStatus('shield', 4, 6); f.removeStatus('poison'); f.removeStatus('burn'); m.text(f.x, f.y - 56, `💧 -${d.toFixed(0)}%`, '#7ad0ff', 15); } },
  deflect: { name: 'Phản Chấn Tương Đối', icon: '🪞', cd: 25, react: true, counters: ['raven', 'clint', 'percy'],
    desc: 'Dựng màn phản xạ hình nón trước mặt 1s: dội ngược 100% đạn bay tới về phía kẻ bắn, hất ngã kẻ cận chiến đánh vào khiên.',
    when: (f, t, m, d, br) => m.projs.some((p) => !p.dead && p.owner.team !== f.team && Math.hypot(p.x - f.x, p.y - f.y) < 170 && (p.r > 6 || p.kind === 'bigarrow' || (p.hit && p.hit.kb > 150))) || (t && d < 110 && t.action && t.action.atk && (t.action.windup || t.action.dur > 0.45)),
    use(f, m, t) { if (t) f.facing = angTo(f, t); f._deflectT = m.time + 1; m.fx({ type: 'ring', x: f.x + Math.cos(f.facing) * 30, y: f.y + Math.sin(f.facing) * 30, r: 34, color: '#d0e0ff', life: 1, w: 4 }); } },
  sight: { name: 'Thấu Thị Nhãn', icon: '👁️', cd: 30, counters: ['alice', 'vesper', 'thanhphong'],
    desc: 'Rada quét toàn sàn 6s: lộ mọi mục tiêu tàng hình; phá hủy 100% ảo ảnh/phân thân, kẻ tạo ảo ảnh bị lộ và nhận thêm 15% sát thương.',
    when: (f, t, m) => m.minions.some((x) => x.team !== f.team && x.kind === 'illusion') || (t && (t.has('invis') || t.has('untargetable'))),
    use(f, m) {
      f._seeAll = m.time + 6;
      for (const x of m.minions.slice()) if (x.team !== f.team && (x.kind === 'illusion' || x.fakeMain)) { m.fx({ type: 'ring', x: x.x, y: x.y, r: 26, color: '#ffffff', life: 0.3, w: 3 }); m.removeMinion(x); x.owner._exposed = m.time + 6; }
      for (const e of m.fighters) if (e.team !== f.team) { e.removeStatus('invis'); e.removeStatus('untargetable'); if (e.focus) {} }
      for (const e of m.fighters) if (e.team === f.team) e.focus = null;
      m.fx({ type: 'ring', x: f.x, y: f.y, r: 500, color: '#ffffff', life: 0.6, w: 3 });
    } },
  exhaust: { name: 'Kiệt Sức', icon: '🥀', cd: 40, counters: ['galo', 'wukong'],
    desc: 'Nguyền 1 kẻ địch trong 5m suy nhược 3s: -40% sát thương, -50% tốc chạy, -50% lực đẩy văng gây ra.',
    when: (f, t, m, d) => t && d < 220 && (m.time - (t._ultAt ?? -9) < 3 || (t.weaponId === 'binh_doc' && t.ws.beast > 0) || t.has('unstoppable') || t.has('empower')),
    use(f, m, t) { t = t || m.nearestEnemy(f); if (!t || dist(f, t) > 220) return; t._exhaustT = m.time + 3; t.addStatus('slow', 3, 0.5); m.fx({ type: 'line', x1: f.x, y1: f.y, x2: t.x, y2: t.y, color: '#a070a0', life: 0.3, w: 3 }); m.text(t.x, t.y - 60, '🥀 KIỆT SỨC', '#c090c0', 15); } },
  well: { name: 'Trói Hư Không', icon: '🕳️', cd: 35, counters: ['kazuki', 'ryoma', 'florian'],
    desc: 'Ném thiết bị trọng lực: sau 0.5s mở vùng từ trường bán kính 3m trong 3s — hút mục tiêu về tâm và CẤM Lướt/Nhảy/Tốc biến.',
    when: (f, t, m, d) => t && d < 300 && d > 80 && (t.weapon.ai.ranged || m.arena.edgeDist(t.x, t.y) < 150),
    use(f, m, t) {
      t = t || m.nearestEnemy(f); if (!t) return;
      const p = m.arena.clamp({ x: t.x + t.vx * 0.4, y: t.y + t.vy * 0.4 }, 20);
      m.fx({ type: 'ring', x: p.x, y: p.y, r: 120, color: '#7050c0', life: 0.5, w: 2 });
      m.later(0.5, () => m.zone({ owner: f, x: p.x, y: p.y, r: 120, life: 3, every: 0.1, kind: 'well', color: 'rgba(90,60,170,0.22)',
        tick: (mm, z) => { for (const e of mm.enemiesOf(f)) { const dd = Math.hypot(e.x - z.x, e.y - z.y); if (dd > z.r + e.r) continue; e.addStatus('nodash', 0.2); if (dd > 10 && !e.superArmor) { const a = Math.atan2(z.y - e.y, z.x - e.x); e.vx += Math.cos(a) * 45; e.vy += Math.sin(a) * 45; } } } }));
    } },
  wall: { name: 'Rào Chắn Từ Tính', icon: '🧲', cd: 35, react: true, counters: ['theron', 'clint', 'victoria'],
    desc: 'Dựng tường từ tính dài 4m trong 4s: bản thân văng vào tường được giữ lại trên sàn; kẻ địch bị đánh văng đập vào tường nảy ngược và CHOÁNG 1s.',
    when: (f, t, m, d) => (m.arena.edgeDist(f.x, f.y) < 100 && t && d < 220) || (t && d < 200 && m.arena.edgeDist(t.x, t.y) < 120 && t.percent > 70),
    use(f, m, t) {
      t = t || m.nearestEnemy(f);
      // tự cứu: tường sát mép phía sau lưng • tấn công: tường sau lưng đối thủ
      const self = m.arena.edgeDist(f.x, f.y) < 110 || !t;
      const c = self ? f : t, a = nearestEdgeAngle(m, c.x, c.y);
      const q = { x: c.x + Math.cos(a) * 50, y: c.y + Math.sin(a) * 50 }, px = -Math.sin(a) * 80, py = Math.cos(a) * 80;
      m.walls.push({ owner: f, kind: 'mag', x1: q.x - px, y1: q.y - py, x2: q.x + px, y2: q.y + py, t: 0, life: 4, hit: new Set() });
    } },
  overclock: { name: 'Quá Tải Xung Nhịp', icon: '⚙️', cd: 45, counters: ['ryoma', 'kazuki', 'wukong'],
    desc: 'Quá tải 3.5s: giảm ngay 50% hồi chiêu hiện tại của A/B/C, ra đòn nhanh hơn 30% và hồi chiêu chạy nhanh hơn.',
    when: (f, t, m, d) => t && d < 200 && (t.has('stun') || t.has('root') || (f.cd.A > 0.3 && f.cd.B > 0.5 && t.percent > 60)),
    use(f, m) { for (const k of ['A', 'B', 'C']) f.cd[k] *= 0.5; f._overT = m.time + 3.5; f.addStatus('haste', 3.5, 0.15); m.fx({ type: 'ring', x: f.x, y: f.y, r: 40, color: '#ffb030', life: 0.35, w: 5 }); } },
};
const SPELL_IDS = Object.keys(SPELLS);
// số ô phép mang theo: 1, có Bùa Song Phép thì 2
function spellSlots(cfg) { return 1 + (Object.values(cfg.equip || {}).includes('it_twinrune') ? 1 : 0); }

// ----- hiệu ứng duy trì & móc vào trận đấu -----
function spellUpdate(f, m, dt) {
  if (f.scd) for (const k in f.scd) if (f.scd[k] > 0) f.scd[k] -= dt * (f.T && f.T('it_twinrune') ? 1.1 : 1);
  if (f._anchorT > m.time) { f.frameWeight *= 1.8; if (f.z > 0 && f.vz > 0) f.vz = 0; }
  if (f._overT > m.time) for (const k of ['A', 'B', 'C']) if (f.cd[k] > 0) f.cd[k] -= dt * 0.5;
  // Phản Chấn: dội ngược đạn trong hình nón phía trước
  if (f._deflectT > m.time) for (const p of m.projs) {
    if (p.dead || p.owner.team === f.team || Math.hypot(p.x - f.x, p.y - f.y) > 70) continue;
    if (Math.abs(angDiff(f.facing, Math.atan2(p.y - f.y, p.x - f.x))) > 1.3) continue;
    const b = p.owner; p.owner = f; p.hitSet = new Set(); p.traveled = 0;
    const a = b && b.alive ? Math.atan2(b.y - p.y, b.x - p.x) : p.ang + Math.PI;
    p.ang = a; p.vx = Math.cos(a) * p.speed; p.vy = Math.sin(a) * p.speed;
    m.text(f.x, f.y - 56, '🪞 PHẢN CHẤN!', '#d0e0ff', 13);
  }
}
// Rào Chắn Từ Tính: giữ đồng minh lại, kẻ địch đập vào nảy ngược + choáng
function spellWalls(m) {
  for (const w of m.walls) {
    if (w.kind !== 'mag') continue;
    for (const e of m.bodies) {
      if (!e.alive || segDist(e.x, e.y, w) > e.r + 10) continue;
      const sp = Math.hypot(e.vx, e.vy); if (sp < 120) continue;
      if (e.team === w.owner.team) { e.vx *= 0.05; e.vy *= 0.05; e.hitstun = Math.min(e.hitstun, 0.1); }
      else if (!w.hit.has(e)) { w.hit.add(e); e.vx *= -0.5; e.vy *= -0.5; e.addStatus('stun', 1); m.text(e.x, e.y - 56, '🧲 ĐẬP TƯỜNG!', '#7ab0ff', 15); m.shake(6); }
    }
  }
}
// đòn đánh vào kẻ đang Phản Chấn (cận chiến bị hất ngã)
function spellIncoming(t, att, hit, m) {
  if (!(t._deflectT > m.time) || !att || att.isEnv || hit.proj || hit.quiet) return true;
  const o = att.owner || att;
  if (Math.abs(angDiff(t.facing, angTo(t, o))) > 1.3) return true;
  if (o.alive && dist(o, t) < 160) { m.applyHit(t, o, { dmg: 2, kb: 160, kg: 2, stun: 0.6, tag: 'X', angle: angTo(t, o), quiet: true }); m.text(t.x, t.y - 56, '🪞 PHẢN CHẤN!', '#d0e0ff', 14); }
  return false;
}
// sửa sát thương / lực văng: Kiệt Sức (kẻ đánh), Thấu Thị (kẻ tạo ảo ảnh bị lộ nhận thêm 15%)
function spellDeal(att, t, hit, info, m) {
  const a = att.owner || att;
  if (a._exhaustT > m.time) { info.mult *= 0.6; info.kbMult *= 0.5; }
  if (t._exposed > m.time) info.mult *= 1.15;
}
// rơi khỏi mép: Tốc Biến / Dây Móc cứu nguy (tự động khi sẵn sàng)
function spellOnFall(f, m) {
  for (const id of ['flash', 'grapple']) {
    if (!(f.spells || []).includes(id) || !spellReady(f, id) || f.has('stun') && id === 'grapple') continue;
    castSpell(f, m, id, null);
    m.text(f.x, f.y - 70, `${SPELLS[id].icon} CỨU NGUY!`, '#c0a0ff', 17);
    return false;
  }
  return true;
}
function castSpell(f, m, id, t) {
  const S = SPELLS[id];
  if (!S || !spellReady(f, id) || !f.spells || !f.spells.includes(id)) return false;
  (f.scd || (f.scd = {}))[id] = S.cd;
  S.use(f, m, t || m.nearestEnemy(f));
  m.text(f.x, f.y - 84, `${S.icon} ${S.name.toUpperCase()}`, '#e0c8ff', 15);
  m.sfx('energy_charge2', { vol: 0.6 });
  const sv = SPELL_VFX[id]; if (sv) vfx(m, sv[0], f.x, f.y, id === 'sight' ? 110 : 52, sv[1], { life: 0.7 });
  noteActive(f, m, 'spell', id);
  return true;
}
// HLV máy chọn phép theo đối thủ ("đổi giữa hiệp khi...")
function coachPickSpells(me, opp, n) {
  const oc = opp && opp.charId;
  const score = (id) => (SPELLS[id].counters.includes(oc) ? 3 : 0) + Math.random() * 1.5
    + (id === 'flash' ? 1 : 0) + (id === 'purge' ? 0.6 : 0)
    + (id === 'grapple' && !isRanged(me) ? 0.6 : 0) + (id === 'overclock' && ['ryoma', 'kazuki', 'wukong'].includes(me.charId) ? 1 : 0);
  return SPELL_IDS.slice().sort((a, b) => score(b) - score(a)).slice(0, n);
}
// lệnh HLV "dùng phép" — mỗi phép đang mang sinh ra 1 nút lệnh riêng (ngoài 3 ô mệnh lệnh)
for (const id of SPELL_IDS) COMMANDS['sp_' + id] = { name: `${SPELLS[id].name}!`, icon: SPELLS[id].icon, spell: true, spellUse: id,
  desc: `Phép bổ trợ: ${SPELLS[id].desc} (hồi ${SPELLS[id].cd}s)`, ai: () => false };
