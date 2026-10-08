'use strict';
// ===== Chiến đấu: sát thương, hồi máu, hiệu ứng, lướt/đẩy, đạn, vùng, truy vấn diện tích =====
// Gắn vào Match.prototype (xem match.js). Mọi hàm kích hoạt đều kiểm tra dữ liệu trước khi dùng
// và đi qua bộ đếm độ sâu để chặn vòng lặp phản đòn (bản cũ từng treo trận vì 2 lỗi này).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, STATUS = G.STATUS;

  const isUnit = (u) => !!(u && typeof u === 'object' && typeof u.x === 'number' && u.st);
  const SKEY = { s1: 1, s2: 1, s3: 1, s4: 1, sub: 1 };
  const ownerOf = (u) => (u && u.owner && u.owner.alive !== undefined ? u.owner : u);

  const Combat = {
    // ---------- tiện ích ----------
    isEnemy(a, b) { return a.team !== b.team && b.team !== C.NEUTRAL; },
    // gọi hook an toàn: không bao giờ để một lỗi trong nội tại làm treo trận
    hook(fn, ...args) {
      if (typeof fn !== 'function') return undefined;
      if (this.depth > C.MAX_TRIGGER_DEPTH) return undefined;
      this.depth++;
      try { return fn(...args); } catch (e) { this.error('hook', e); return undefined; } finally { this.depth--; }
    },
    error(where, e) {
      this.errors.push(`${G.U.mmss(this.time)} ${where}: ${e && e.message ? e.message : e}`);
      if (this.errors.length > 50) this.errors.length = 50;
    },
    heroHook(u, name, ...args) {
      const def = u && u.hero; if (!def || u.decoy) return undefined;   // ảo ảnh không kích hoạt nội tại của tướng gốc
      const p = def.passive;
      const r = p ? this.hook(p[name], this, u, ...args) : undefined;
      const l = u.fxl && u.fxl[name];           // trang bị + nhánh tiến hóa
      if (l) for (let i = 0; i < l.length; i++) this.hook(l[i], this, u, ...args);
      return r;
    },

    // ---------- giảm trừ sát thương ----------
    mitigate(src, tgt, amt, type, penX) {
      if (type === 'true') return amt;
      let res = type === 'phys' ? tgt.st.armor : tgt.st.mr;
      if (src && src.st && res > 0) {
        const pen = type === 'phys' ? src.st.armorPen : src.st.magicPen;
        const flat = type === 'phys' ? src.st.armorPenFlat : src.st.magicPenFlat;
        res = res * (1 - Math.min(0.9, (pen || 0) + (penX || 0))) - (flat || 0); if (res < 0) res = 0;
      }
      return amt * (res >= 0 ? 100 / (100 + res) : 2 - 100 / (100 - res));
    },

    // ---------- gây sát thương ----------
    // o: { tag, auto, crit, aoe, noHook, proc }
    damage(src, tgt, amt, type, o) {
      if (!isUnit(tgt) || !tgt.alive || !(amt > 0)) return 0;
      if (this.depth > C.MAX_TRIGGER_DEPTH) return 0;
      if (++this.evCount > C.MAX_EVENTS_PER_TICK) { if (this.evCount === C.MAX_EVENTS_PER_TICK + 1) this.error('damage', 'quá nhiều sự kiện trong 1 bước'); return 0; }
      if (tgt.has('invuln')) return 0;
      o = o || {};
      const owner = ownerOf(src);
      const info = { amt, type, tag: o.tag || '', auto: !!o.auto, crit: !!o.crit, aoe: !!o.aoe, src, owner, byp: o.byp || 0 };
      this.depth++;
      try {
        if (!o.noHook) {
          if (owner && owner.hero) this.heroHook(owner, 'onDeal', tgt, info);
          if (tgt.hero) this.heroHook(tgt, 'onTake', owner, info);
        }
        if (!(info.amt > 0) || !tgt.alive) {
          // GĐ8: đỡ trọn đòn (thế thủ / chặn) → nội tại "đỡ đòn" của mảnh hồn
          if (tgt.alive && tgt.fxl && tgt.fxl.onBlock && owner && owner.team !== tgt.team && owner.kind === 'hero') this.heroHook(tgt, 'onBlock', owner);
          return 0;
        }
        // vòng quyết đấu: không ai đánh được ai qua vòng (kể cả bo, quái)
        if (!o.duel && this.duelBlocks(owner, tgt)) return 0;
        // Áo Choàng Thánh Linh: chặn 1 chiêu của tướng địch
        if (tgt.bonus.spellShield && owner && owner.kind === 'hero' && owner.team !== tgt.team && G.ITEM_IS_SKILL(info) && this.spellBlock(tgt)) return 0;
        let a = info.amt;
        if (owner && owner.st) {
          a *= 1 + (owner.st.dmgAmp || 0);
          if (info.type === 'phys' && owner.st.physAmp) a *= 1 + owner.st.physAmp;           // GĐ8: Công Vật Lý %
          else if (info.type === 'magic' && owner.st.magicAmp) a *= 1 + owner.st.magicAmp;    // GĐ8: Công Phép %
        }
        if (owner && owner.hi && !tgt.hi && (owner.kind === 'hero' || owner.kind === 'pet')) a *= 1 + C.HIGH.dmg;                    // GĐ7: đánh từ trên cao xuống
        if (owner && owner.ultRageT > this.time && !info.auto) a *= 2;                                                 // GĐ7b: Tuyệt Kỹ Nộ (mảnh hồn Đỏ)
        if (owner && owner.kind === 'hero' && tgt.kind === 'hero') a *= 0.95 * C.PVP_DMG * (this.time < C.PVP_EARLY.full ? C.PVP_EARLY.k0 + (1 - C.PVP_EARLY.k0) * this.time / C.PVP_EARLY.full : 1);   // giảm nhẹ sát thương PvP để trận căng hơn và khó đoán hơn
        if (owner && owner.mastMul && tgt.kind === 'hero') a *= owner.mastMul;
        if (owner && owner.kind === 'hero' && G.heroCurve) a *= 1 + G.heroCurve(owner);                                 // GĐ5c: giai đoạn mạnh của tướng
        if (tgt.kind === 'monster' && owner && owner.bonus && owner.bonus.monsterAmp) a *= 1 + owner.bonus.monsterAmp;
        if (info.type === 'magic' && tgt.cursedT > this.time) a *= 1.1;
        if (info.crit && tgt.bonus.critRed) a *= 1 - tgt.bonus.critRed * 0.5;
        if (info.auto && tgt.bonus.autoRed && owner && owner.kind === 'hero') a *= 1 - tgt.bonus.autoRed;
        a *= 1 - (tgt.st.dmgRed || 0);
        if (tgt.st.vuln) a *= 1 + tgt.st.vuln;
        // Ngủ: trúng đòn của đối phương thì tỉnh giấc (đòn đánh thức có thể mạnh hơn)
        if (tgt.statuses.length && owner && owner.team !== tgt.team && info.tag !== 'dot') {
          const sl = tgt.has('sleep');
          if (sl) { if (sl.v > 1) a *= sl.v; sl.t = 0; tgt.statuses = tgt.statuses.filter((x) => x !== sl); }
        }
        a = this.mitigate(owner && owner.st ? owner : null, tgt, a, info.type, info.penX);
        // GĐ5e: AI tuyển thủ ghi nhớ sát thương thật của từng chiêu lên lính/quái (để biết chiêu nào kết liễu được lính)
        if (owner && owner.ai && owner.ai.noteSkill && tgt.kind === 'monster' && SKEY[info.tag]) owner.ai.noteSkill(info.tag, a);
        // khiên hấp thụ
        if (a > 0) for (const s of tgt.statuses) {
          if (s.type !== 'shield' || s.v <= 0) continue;
          const take = Math.min(s.v, a); s.v -= take; a -= take;
          if (s.v <= 0) s.t = 0;
          if (a <= 0) break;
        }
        // GĐ8: HỘ GIÁP — gánh phần sát thương không xuyên thủng; phần xuyên thủng đi thẳng vào máu (bão đánh thẳng vào máu)
        let gaDealt = 0;
        if (a > 0 && tgt.ga > 0 && info.tag !== 'zone') {
          let bp = 0;
          if (owner && owner.st) { bp = Math.max(owner.st.bypass || 0, info.byp || 0); if (info.tag === 'dot') bp = Math.max(bp, owner.st.dotByp || 0); }
          if (owner && owner.statuses && owner.hasKey && owner.hasKey('corrosive_oil')) {
            bp += 0.5;
            const st = owner.statuses.find((x) => x.key === 'corrosive_oil');
            if (st) {
              st.charges = (st.charges != null ? st.charges : 4) - 1;
              if (st.charges <= 0) owner.statuses = owner.statuses.filter((x) => x !== st);
            }
          }
          bp = Math.max(0, Math.min(1, bp - (tgt.st.antiByp || 0)));
          gaDealt = Math.min(tgt.ga, a * (1 - bp));
          tgt.ga -= gaDealt; a -= gaDealt;
          if (tgt.ga <= 0.5 && gaDealt > 0) { tgt.ga = 0; this.gaBreak(tgt, owner, info); }
        }
        if (tgt.cast && (tgt.cast.key === 'recall' || tgt.cast.key === 'tp' || tgt.cast.key === 'chest') && (a > 0 || gaDealt > 0)) tgt.cast = null;     // biến về / Dịch Chuyển / mở rương bị đứt khi trúng đòn
        // GĐ7b: uống bình bị ngắt khi trúng đòn (không mất bình) — trừ mảnh hồn Tím "Cẩn Thận"; bo / dot không ngắt
        if (tgt.cast && tgt.cast.key === 'potion' && (a > 0 || gaDealt > 0) && owner && info.tag !== 'dot' && !(tgt.perks && tgt.perks.has('can_than'))) {
          tgt.cast = null; tgt.stats.potBroken = (tgt.stats.potBroken || 0) + 1;
          if (this.fxOn) this.fx({ type: 'callout', id: tgt.id, text: '💔 Ngắt uống bình', color: '#ffb0b0' });
        }
        const before = tgt.hp;
        tgt.hp -= a;
        // GĐ8: Hồn Đoạt Mệnh Trảm Quyết — mục tiêu dưới 15% máu bị hành quyết
        if (info.exec && tgt.hp > 0 && tgt.hp < tgt.st.maxHp * 0.15) { tgt.hp = 0; tgt.ga = 0; if (this.fxOn) this.fx({ type: 'callout', id: tgt.id, text: '☠ Hành quyết', color: '#ff6a6a' }); }
        if (tgt.hp < 1 && tgt.has('undying')) tgt.hp = 1;
        const dealt = before - Math.max(0, tgt.hp), tot = dealt + gaDealt;
        info.hpDealt = dealt; info.gaDealt = gaDealt;
        // sổ sách
        tgt.lastDmgT = this.time;
        // kẻ vừa đánh (mọi loại: tướng, vật triệu hồi, quái) — hộ vệ của chủ dùng để nhắm kẻ đánh chủ
        if (owner && owner !== tgt && tot > 0) {
          tgt.lastAtt = owner; tgt.lastAttT = this.time;
          (tgt.lastAttBy || (tgt.lastAttBy = new Map())).set(owner.id, this.time);
        }
        if (tgt.kind === 'monster' && owner) this.monsterHit(tgt, owner, tot);
        // GĐ8: bùa Rồng (Long Hỏa) — mọi đòn thiêu đốt, ngăn hồi máu, phá tàng hình
        if (owner && owner.kind === 'hero' && tot > 0 && info.tag !== 'dot' && owner.statuses.length && owner.hasKey('buff_long') && tgt.alive && tgt !== owner) this.dragonBurn(owner, tgt);
        if (owner && owner.kind === 'hero') {
          owner.combatT = this.time;
          if (owner.statuses.length && owner.hasKey('fu_an')) this.removeStatus(owner, 'stealth', 'fu_an');   // Phù Ẩn Thân: ra đòn thì lộ
          if (tgt.kind === 'hero') {
            tgt.dmgBy.set(owner.id, this.time); tgt.combatT = this.time; if (tot > 0) owner.ws.lastHeroHitT = this.time;
            // sổ sát thương 10s gần nhất (nhận biết kền kền ăn mạng; AI thù dai)
            const lg = tgt.dmgLog || (tgt.dmgLog = new Map()), rec = lg.get(owner.id);
            if (!rec || this.time - rec.t > C.ASSIST_WINDOW) lg.set(owner.id, { amt: tot, t: this.time }); else { rec.amt += tot; rec.t = this.time; }
            owner.stats.dmgHero += tot; tgt.stats.dmgTaken += tot;
            if ((tgt.allyRec || tgt.permWith) && G.Persona) G.Persona.allyHit(this, owner, tgt, tot);   // GĐ7b: trúng nhầm đồng minh (GĐ9b: cả người cùng phe nhà cái)
            this.heroHit.push({ att: owner, vic: tgt, t: this.time });
          }
          // GĐ8: hút máu tính trên mọi sát thương gây ra (đánh thường 100%, chiêu đơn 60%, chiêu diện rộng 30%; không tính độc / bão)
          if (owner.st.lifesteal > 0 && tot > 0 && info.tag !== 'dot') {
            const want = tot * owner.st.lifesteal * (info.auto ? 1 : info.aoe ? 0.3 : 0.6), got = this.heal(owner, owner, want, true);
            if (info.auto && owner.bonus.overheal && want - got > 0.5) this.overheal(owner, want - got);
          }
        }
        if (owner && owner.hero && tot > 0) this.heroHook(owner, 'afterDeal', tgt, info, tot);
        if (tgt.hero && tot > 0 && tgt.alive && owner) this.heroHook(tgt, 'afterTake', owner, info, dealt);
        if (info.post) for (const fn of info.post) this.hook(fn, this);
        if (this.fxOn && (tgt.kind === 'hero' || (owner && owner.kind === 'hero')) && tot >= 1)
          this.fx({ type: 'dmg', x: tgt.x, y: tgt.y, v: tot, ga: gaDealt >= 1 && dealt < 1, dt: info.type, crit: info.crit, team: tgt.team, hero: tgt.kind === 'hero', auto: !!info.auto,
            c: owner ? (owner.hero ? owner.hero.color : owner.owner && owner.owner.hero ? owner.owner.hero.color : null) : null, ox: owner && owner.kind === 'hero' ? owner.x : null, oy: owner && owner.kind === 'hero' ? owner.y : null });
        if (tgt.hp <= 0) this.kill(tgt, owner, src);
        return tot;
      } catch (e) { this.error('damage', e); return 0; } finally { this.depth--; }
    },
    // GĐ8: Hộ Giáp vỡ (nội tại mảnh hồn / Giáp Hoàng Kim; Hồn Chân Hỏa Thiêu Hồn của kẻ đánh: choáng 1s)
    gaBreak(u, by, info) {
      if (u.kind !== 'hero') return;
      u.stats.gaBreak = (u.stats.gaBreak || 0) + 1;
      if (this.fxOn) this.fx({ type: 'callout', id: u.id, text: '💥 Vỡ Hộ Giáp', color: '#9fd8ff' });
      this.heroHook(u, 'onGaBreak', by);
      if (info && info.gaStun && by && by.team !== u.team && u.alive) this.addStatus(u, 'stun', 1, 1, { src: by });
    },
    heal(src, tgt, amt, quiet) {
      if (!isUnit(tgt) || !tgt.alive || !(amt > 0)) return 0;
      if (tgt.has('wound')) amt *= 0.6;
      const h = Math.min(amt, tgt.st.maxHp - tgt.hp);
      tgt.hp += h;
      if (h > 0 && src && src.stats && src !== tgt) src.stats.heal += h;
      if (src && src.fxl && src.fxl.onAllyCare && src !== tgt && src.team === tgt.team && !quiet) this.heroHook(src, 'onAllyCare', tgt);
      if (!quiet && this.fxOn && h >= 5) this.fx({ type: 'heal', x: tgt.x, y: tgt.y, v: h });
      return h;
    },
    shield(src, tgt, amt, dur) {
      if (!isUnit(tgt) || !tgt.alive) return null;
      if (src && src.stats && src !== tgt) src.stats.heal += amt * 0.5;
      if (src && src.fxl && src.fxl.onAllyCare && src !== tgt && src.team === tgt.team) this.heroHook(src, 'onAllyCare', tgt);
      return this.addStatus(tgt, 'shield', dur, amt, { src });
    },

    // ---------- hiệu ứng ----------
    // o: { src, key, mods, stack: 'refresh' | 'add', max }
    addStatus(tgt, type, dur, v, o) {
      if (!isUnit(tgt) || !tgt.alive || !(dur > 0)) return null;
      o = o || {};
      const def = STATUS[type] || {};
      const owner = ownerOf(o.src);
      if (type === 'blind' && tgt.shOn && tgt.shOn.has('G_VIS_03')) return null;   // GĐ9: Phá Ảo Chân Thị miễn nhiễm mù
      if (def.cc && owner && owner.team !== tgt.team) {
        if (tgt.has('unstop') || tgt.has('invuln')) return null;
        if (tgt.bonus['imm_' + type]) return null;               // miễn nhiễm riêng (nhánh tiến hóa)
        // GĐ8: mảnh hồn tự giải khống chế cứng (Hồn Ngưng Đọng Thời Không)
        if (def.hard && tgt.fxl && tgt.fxl.onHardCC) { let blk = false; for (const fn of tgt.fxl.onHardCC) if (this.hook(fn, this, tgt, owner)) { blk = true; break; } if (blk) return null; }
        if ((def.hard || type === 'root' || type === 'silence') && tgt.bonus.spellShield && owner.kind === 'hero' && this.spellBlock(tgt)) return null;
        if (!def.noTenacity) dur *= 1 - Math.min(0.6, tgt.st.tenacity || 0);
        if (owner.kind === 'hero' && tgt.kind === 'hero') { tgt.dmgBy.set(owner.id, this.time); owner.stats.ccTime += dur; }
        if (def.hard) {
          tgt.windup = null;
          if (tgt.cast && !tgt.cast.unstop) this.interrupt(tgt);
          if (tgt.dash && !tgt.dash.cc && !tgt.dash.unstop) tgt.dash = null;
        }
      }
      let s = null;
      if (o.key) s = tgt.statuses.find((x) => x.key === o.key && x.type === type) || null;
      else if (type !== 'shield' && type !== 'buff' && type !== 'dot' && type !== 'slow' && type !== 'haste' && type !== 'reduce') s = tgt.has(type);
      if (s) {
        if (o.stack === 'add') s.n = Math.min(o.max || 99, (s.n || 1) + 1);
        s.t = Math.max(s.t, dur); s.dur = Math.max(s.dur || 0, dur);
        if (v !== undefined && v !== null) s.v = type === 'slow' || type === 'haste' ? Math.max(s.v || 0, v) : v;
        if (o.mods) s.mods = o.mods;
        if (o.src) s.src = o.src;
        return s;
      }
      s = { type, t: dur, dur, v, key: o.key || null, mods: o.mods || null, src: o.src || null, n: 1, tick: o.tick || 0, tickT: o.tick || 0, dmg: o.dmg || 0, dtype: o.dtype || 'magic', persist: !!o.persist, onEnd: o.onEnd || null };
      tgt.statuses.push(s);
      if (type === 'charm' && o.src) tgt.charmBy = o.src;
      return s;
    },
    // lá chắn phép (Áo Choàng Thánh Linh): sẵn sàng → chặn và hồi 40s; trong 0.25s sau đó chặn tiếp phần còn lại của cùng chiêu
    spellBlock(u) {
      if (u.istate.blockT > this.time) return true;
      if ((u.icd.ao_thanh_linh || 0) > this.time) return false;
      u.icd.ao_thanh_linh = this.time + 40; u.istate.blockT = this.time + 0.25;
      if (this.fxOn) this.fx({ type: 'aura', id: u.id, color: '#c8a0ff', life: 0.6 });
      return true;
    },
    // Huyết Kiếm: hút máu dư thành lá chắn
    overheal(u, v) {
      const cap = 60 + 12 * u.level;
      let s = u.hasKey('overheal');
      if (!s) s = this.addStatus(u, 'shield', 25, 0, { key: 'overheal' });
      if (s) { s.v = Math.min(cap, s.v + v); s.t = 25; }
    },
    removeStatus(tgt, type, key) {
      if (!isUnit(tgt)) return;
      tgt.statuses = tgt.statuses.filter((s) => !(s.type === type && (!key || s.key === key)));
    },
    cleanse(u) { if (isUnit(u)) u.statuses = u.statuses.filter((s) => !(STATUS[s.type] && STATUS[s.type].cc)); },
    interrupt(u) {
      if (!u.cast) return;
      const c = u.cast; u.cast = null;
      if (c.onInterrupt) this.hook(c.onInterrupt, this, u, c);
    },
    // sát thương theo thời gian (thiêu, độc, chảy máu): dps mỗi giây trong dur giây
    dot(src, tgt, dps, dur, dtype, key, o) {
      return this.addStatus(tgt, 'dot', dur, dps, Object.assign({ src, key, tick: 0.5, dtype: dtype || 'magic' }, o || {}));
    },

    // ---------- di chuyển cưỡng bức ----------
    // đẩy tgt theo hướng (dx,dy) một quãng dist trong dur giây; o.onWall(m, tgt, wall) khi đập tường
    knock(src, tgt, dx, dy, dist, dur, o) {
      if (!isUnit(tgt) || !tgt.alive) return false;
      if (tgt.has('unstop') || tgt.has('invuln') || tgt.anchorT > this.time || (tgt.big && tgt.kind === 'monster')) return false;
      o = o || {};
      if (!(dist > 0) || !Number.isFinite(dx) || !Number.isFinite(dy)) return false;   // dữ liệu hỏng: bỏ qua thay vì làm tọa độ thành NaN
      const L = Math.sqrt(dx * dx + dy * dy) || 1;
      dur = Math.max(0.05, dur);
      tgt.dash = { vx: dx / L * dist / dur, vy: dy / L * dist / dur, t: dur, cc: true, src, onWall: o.onWall || null, wallHit: false };
      tgt.windup = null; if (tgt.cast && !tgt.cast.unstop) this.interrupt(tgt);
      const owner = ownerOf(src);
      if (owner && owner.kind === 'hero' && tgt.kind === 'hero') tgt.dmgBy.set(owner.id, this.time);
      return true;
    },
    knockup(src, tgt, dur) { if (!isUnit(tgt) || tgt.anchorT > this.time) return null; return this.addStatus(tgt, 'knockup', dur, 1, { src }); },
    // tự lướt tới (x,y) với tốc độ speed; o: { onContact(m,u,e), onEnd(m,u), invuln, untarget, unstop, wall: true (xuyên tường) }
    dashTo(u, x, y, speed, o) {
      if (!isUnit(u) || !u.alive) return false;
      o = o || {};
      const dx = x - u.x, dy = y - u.y, L = Math.sqrt(dx * dx + dy * dy);
      if (!Number.isFinite(L)) return false;
      if (L < 0.05) { if (o.onEnd) this.hook(o.onEnd, this, u); return true; }
      const t = L / speed;
      u.dash = { vx: dx / L * speed, vy: dy / L * speed, t, cc: false, self: true, onContact: o.onContact || null, onEnd: o.onEnd || null, hitSet: new Set(), passWall: !!o.wall, unstop: !!o.unstop };
      if (o.invuln) this.addStatus(u, 'invuln', t + 0.05, 1);
      if (o.untarget) this.addStatus(u, 'untarget', t + 0.05, 1);
      u.fx = dx / L; u.fy = dy / L; u.windup = null;
      if (o.hookItem) u.dash.hookItem = true;
      if (u.kind === 'hero') this.heroHook(u, 'onDash', u.dash);   // GĐ9: mảnh hồn "khi lướt / bay dây móc"
      return true;
    },
    // dịch chuyển tức thời (không xuyên được ra ngoài bản đồ; tránh kẹt trong tường)
    blink(u, x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const p = { x, y }; G.MAP.pushOut(p, u.r);
      if (this.fxOn) this.fx({ type: 'blink', x: u.x, y: u.y, x2: p.x, y2: p.y, team: u.team });
      u.x = p.x; u.y = p.y; u.dash = null; u.navP = null;
    },

    // ---------- đạn & vùng ----------
    // o: { owner, x, y, dx, dy, speed, range, r, target (đuổi theo), pierce, hitHeroes, hitMinions, onHit(m,p,u), onEnd(m,p), kind, color }
    proj(o) {
      const p = Object.assign({ dead: false, trav: 0, hit: new Set(), r: 0.35, hitHeroes: true, hitMinions: true, pierce: false }, o);
      p.team = o.owner.team;
      if (!p.target) { const L = Math.sqrt(p.dx * p.dx + p.dy * p.dy) || 1; p.dx /= L; p.dy /= L; }
      p.id = this.nextId++;
      this.projs.push(p);
      return p;
    },
    // o: { owner, x, y, r, life, every, tick(m,z), onEnd(m,z), kind, color, follow }
    zone(o) {
      const z = Object.assign({ dead: false, age: 0, acc: 0, every: 0.5 }, o);
      z.team = o.owner.team; z.id = this.nextId++;
      this.zones.push(z);
      return z;
    },
    later(t, fn) { this.queue.push({ at: this.time + t, seq: this.seq++, fn }); },
    // báo trước vùng sắp trúng chiêu (thiên thạch, pháo kích, dậm đất…): AI đọc được để né; có đồ họa thì vẽ vòng cảnh báo
    // GĐ8: nhiều hình cảnh báo — shape: 'circle' (mặc định: x,y,r) • 'ring' (vành khăn: x,y,r0..r) • 'line' (dải: x,y → x2,y2, rộng w)
    //   • 'cone' (quạt: đỉnh x,y, hướng dx,dy, bán kính r, nửa góc có cos = c)
    telegraph(o) {
      const z = { id: this.nextId++, shape: o.shape || 'circle', x: o.x, y: o.y, r: o.r || 0, r0: o.r0 || 0, x2: o.x2, y2: o.y2, w: o.w || 0, dx: o.dx, dy: o.dy, c: o.c, until: this.time + (o.life || 0.5), team: o.team, boss: !!o.boss };
      this.dangers.push(z);
      if (this.fxOn) this.fx(Object.assign({ type: 'warn' }, o, { shape: z.shape }));
      return z;
    },
    // vành khăn: fn(u) với mỗi địch có khoảng cách tới tâm trong [r0, r]
    hitRing(src, x, y, r0, r, fn, o) {
      const owner = ownerOf(src), list = this.enemiesIn(owner.team, x, y, r + 1, o).filter((u) => { const d = G.M.dist(u, { x, y }); return d >= r0 - u.r * 0.5 && d <= r + u.r * 0.5; });
      for (const u of list) this.hook(fn, u);
      if (this.fxOn && !(o && o.noFx)) this.fx({ type: 'ring', x, y, r, color: (o && o.color) || null, team: owner.team });
      return list;
    },

    // ---------- truy vấn ----------
    // các đơn vị địch (tướng, quái, vật triệu hồi) trong vòng tròn
    enemiesIn(team, x, y, R, o) {
      const out = [];
      this.grid.query(x, y, R, (u) => {
        if (!u.alive || u.team === team || !u.targetable) return;
        if (o && o.heroesOnly && u.kind !== 'hero') return;
        out.push(u);
      }, true);
      return out;
    },
    alliesIn(team, x, y, R, o) {
      const out = [];
      this.grid.query(x, y, R, (u) => {
        if (!u.alive || u.team !== team) return;
        if (o && o.heroesOnly && u.kind !== 'hero') return;
        out.push(u);
      }, true);
      return out;
    },
    // vòng tròn: fn(u) với mỗi địch
    hitCircle(src, x, y, R, fn, o) {
      const owner = ownerOf(src);
      const list = this.enemiesIn(owner.team, x, y, R, o);
      for (const u of list) this.hook(fn, u);
      if (this.barrels && this.barrels.length) this.barrelsIn(x, y, R, owner);   // GĐ7: chiêu diện rộng kích nổ thùng thuốc nổ
      if (this.fxOn && !(o && o.noFx)) this.fx({ type: 'ring', x, y, r: R, color: (o && o.color) || null, team: owner.team, fx: (o && o.fx) || null });
      return list;
    },
    // đoạn thẳng từ (x,y) theo hướng (dx,dy) dài len, rộng w
    hitLine(src, x, y, dx, dy, len, w, fn, o) {
      const owner = ownerOf(src);
      const L = Math.sqrt(dx * dx + dy * dy) || 1; dx /= L; dy /= L;
      const ex = x + dx * len, ey = y + dy * len;
      const out = [];
      this.grid.query((x + ex) / 2, (y + ey) / 2, len / 2 + w, (u) => {
        if (!u.alive || u.team === owner.team || !u.targetable) return;
        if (o && o.heroesOnly && u.kind !== 'hero') return;
        if (G.M.segDist(u.x, u.y, x, y, ex, ey) <= w / 2 + u.r) out.push(u);
      }, true);
      // sắp theo khoảng cách từ điểm đầu (đơn vị gần trúng trước)
      out.sort((a, b) => ((a.x - x) * dx + (a.y - y) * dy) - ((b.x - x) * dx + (b.y - y) * dy) || a.id - b.id);
      const hits = o && o.first ? out.slice(0, o.first) : out;
      for (const u of hits) this.hook(fn, u);
      if (this.fxOn && !(o && o.noFx)) this.fx({ type: 'line', x, y, x2: ex, y2: ey, w, color: (o && o.color) || null, team: owner.team, fx: (o && o.fx) || null });
      return hits;
    },
    // hình nón bán kính R, nửa góc mở có cos = cosHalf
    hitCone(src, x, y, dx, dy, R, cosHalf, fn, o) {
      const owner = ownerOf(src);
      const L = Math.sqrt(dx * dx + dy * dy) || 1; dx /= L; dy /= L;
      const out = [];
      this.grid.query(x, y, R, (u) => {
        if (!u.alive || u.team === owner.team || !u.targetable) return;
        if (o && o.heroesOnly && u.kind !== 'hero') return;
        const vx = u.x - x, vy = u.y - y, d = Math.sqrt(vx * vx + vy * vy);
        if (d < u.r + 0.3 || (vx * dx + vy * dy) / d >= cosHalf) out.push(u);
      }, true);
      for (const u of out) this.hook(fn, u);
      if (this.fxOn && !(o && o.noFx)) this.fx({ type: 'cone', x, y, dx, dy, r: R, c: cosHalf, color: (o && o.color) || null, team: owner.team, fx: (o && o.fx) || null });
      return out;
    },
    nearestEnemyHero(u, R, visibleOnly) {
      let best = null, bd = R;
      for (const h of this.heroes) {
        if (!h.alive || h.team === u.team || !h.targetable) continue;
        if (visibleOnly && !h.vis[u.team]) continue;
        const d = G.M.dist(u, h); if (d < bd) { bd = d; best = h; }
      }
      return best;
    },
  };
  // ===== GĐ8: hình học vùng cảnh báo (AI đọc để né: đứng trong không, nên chạy về đâu) =====
  const Danger = {
    inside(z, x, y, pad) {
      pad = pad || 0;
      const dx = x - z.x, dy = y - z.y, d = Math.sqrt(dx * dx + dy * dy);
      switch (z.shape) {
        case 'ring': return d >= z.r0 - pad && d <= z.r + pad;
        case 'line': return G.M.segDist(x, y, z.x, z.y, z.x2, z.y2) <= z.w / 2 + pad;
        case 'cone': { if (d > z.r + pad) return false; if (d < 0.5 + pad) return true; const L = Math.sqrt(z.dx * z.dx + z.dy * z.dy) || 1; return (dx * z.dx + dy * z.dy) / (d * L) >= z.c - pad / Math.max(1, d); }
        default: return d <= z.r + pad;
      }
    },
    // điểm thoát gần nhất (theo hướng dẫn: dải/quạt → dạt ngang theo pháp tuyến; vòng quanh → ra ngoài bán kính;
    // vành khăn → gần tâm thì lao vào tâm an toàn, xa thì chạy ra ngoài)
    escape(z, u) {
      const dx = u.x - z.x, dy = u.y - z.y, d = Math.sqrt(dx * dx + dy * dy) || 0.001, m = u.r + 0.8;
      switch (z.shape) {
        case 'ring': {
          if (d <= 5 && z.r0 > u.r + 0.6) { const k = Math.max(0, z.r0 - m) / d; return { x: z.x + dx * k * 0.5, y: z.y + dy * k * 0.5 }; }
          return { x: z.x + dx / d * (z.r + m), y: z.y + dy / d * (z.r + m) };
        }
        case 'line': {
          const ex = z.x2 - z.x, ey = z.y2 - z.y, L = Math.sqrt(ex * ex + ey * ey) || 1, ux = ex / L, uy = ey / L;
          const along = Math.max(0, Math.min(L, dx * ux + dy * uy)), px = z.x + ux * along, py = z.y + uy * along;
          let side = (dx * uy - dy * ux) >= 0 ? 1 : -1; if (Math.abs(dx * uy - dy * ux) < 0.05) side = (u.id & 1) ? 1 : -1;
          const off = z.w / 2 + m;
          return { x: px + uy * side * off, y: py - ux * side * off };
        }
        case 'cone': {
          if (d > z.r * 0.65) return { x: z.x + dx / d * (z.r + m), y: z.y + dy / d * (z.r + m) };
          const L = Math.sqrt(z.dx * z.dx + z.dy * z.dy) || 1, ax = z.dx / L, ay = z.dy / L, h = Math.acos(Math.max(-1, Math.min(1, z.c))) + 0.35;
          const side = (dx * ay - dy * ax) >= 0 ? -1 : 1, a = Math.atan2(ay, ax) + side * h, rr = Math.max(d, 2.5);
          return { x: z.x + Math.cos(a) * rr, y: z.y + Math.sin(a) * rr };
        }
        default: return { x: z.x + dx / d * (z.r + m), y: z.y + dy / d * (z.r + m) };
      }
    },
  };
  G.Danger = Danger;
  G.Combat = Combat;
  G.ownerOf = ownerOf;
})();
