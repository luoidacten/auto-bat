'use strict';
// ===== GĐ9b: NHÀ CÁI TRONG TRẬN — người của nhà cái + can thiệp bằng tiền =====
// Gắn vào Match.prototype.
//   • cfg.house = ['aria', 'percy', …]: những tướng (có mặt trong trận) là NGƯỜI CỦA NHÀ CÁI. Họ kết LIÊN MINH LÂU DÀI với nhau
//     (src/sim/ai/persona.js — setupHouse): gặp nhau thì lướt qua, không đánh, không làm kền kền nhau, đổi đồ thật thà, chung tầm nhìn.
//     Không ai được báo ai là người của nhà cái — người chơi phải đọc dấu hiệu.
//   • Can thiệp (người chơi trả tiền cho nhà cái): gọi thính (thính Vàng thêm, rơi trong vòng bo kế), hồi sinh boss (ổ đang trống trong bo),
//     thu bo (vòng bo đang chờ co sau 10s). Mỗi lần can thiệp ghi (tick, loại) vào m.intervLog; cfg.interv phát lại đúng tick đó
//     ở CUỐI bước logic → "xem lại" diễn ra y hệt.
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const C = G.C, MAP = G.MAP;
  const { dist } = G.M;

  const KINDS = {
    drop: { name: 'Gọi thính', icon: '📦', desc: 'Thả thêm một thính (mảnh hồn Vàng + ý niệm Vàng) — rơi ở một điểm trong vòng bo kế tiếp, ai đi tranh là do AI tự quyết.' },
    boss: { name: 'Hồi sinh boss', icon: '👑', desc: 'Một ổ boss đang trống (trong bo) gọi boss ra sau 20s.' },
    zone: { name: 'Thu bo', icon: '🌀', desc: 'Vòng bo đang chờ bắt đầu co sau 10s — ảnh hưởng mọi tướng.' },
  };

  const HouseMix = {
    setupHouse() {
      this.intervLog = [];
      this.ivQ = (this.cfg.interv || []).slice().sort((a, b) => a.tick - b.tick);
      const ids = (this.cfg.house || []).filter((id) => this.heroes.some((h) => h.heroId === id));
      this.houseIds = ids;
      if (ids.length && G.Persona && G.Persona.setupHouse) G.Persona.setupHouse(this, ids);
    },
    // phát lại can thiệp đã ghi (gọi ở cuối step)
    replayInterv() {
      const Q = this.ivQ;
      while (Q && Q.length && Q[0].tick <= this.tick) { const iv = Q.shift(); if (iv.tick === this.tick) this.intervene(iv.kind, true); }
    },
    // có làm được không (và vì sao không)
    canIntervene(kind) {
      if (this.over) return 'trận đã hết';
      if (kind === 'drop') return this.time < this.maxTime - 120 ? null : 'sắp hết trận';
      if (kind === 'boss') return this.bossLairFree() ? null : 'không ổ boss nào đang trống trong bo';
      if (kind === 'zone') { const z = this.zoneSt; return z && z.next && !z.shrinking && z.shrinkAt - this.time > 15 ? null : 'bo đang co hoặc sắp co'; }
      return 'không rõ';
    },
    bossLairFree() {
      return (this.lairSt || []).find((S) => !S.unit && S.nextAt - this.time > 30 && this.inZone(S.lair, -S.lair.r)) || null;
    },
    intervene(kind, replay) {
      if (this.canIntervene(kind)) return null;
      let info = {};
      if (kind === 'drop') {
        const D = C.DROP, n = (this.ivDrops = (this.ivDrops || 0) + 1);
        const d = { id: 100 + n, at: this.time + 25, warned: false, landed: false, taken: false, x: 0, y: 0, openBy: null, openT: 0, by: null, extra: true };
        if (d.at - D.warn <= this.time) { d.warned = true; const p = this.dropSpot(); d.x = p.x; d.y = p.y; this.addFeed({ type: 'drop_warn', id: d.id, x: d.x, y: d.y, at: d.at, called: true }); }
        this.drops.push(d); info = { x: d.x, y: d.y, at: d.at };
      } else if (kind === 'boss') {
        const S = this.bossLairFree(); S.nextAt = this.time + 20; S.warned = false; info = { lair: S.lair.id };
      } else if (kind === 'zone') {
        const z = this.zoneSt, len = z.shrinkEnd - z.shrinkAt;
        z.shrinkAt = this.time + 10; z.shrinkEnd = z.shrinkAt + len;
        this.addFeed({ type: 'zone_next', phase: z.phase + 1, at: z.shrinkAt, forced: true });
      }
      if (!replay) this.intervLog.push({ tick: this.tick, kind });
      this.addFeed({ type: 'interv', kind, info });
      return info;
    },
  };
  G.HouseMix = HouseMix;
  G.INTERV = KINDS;
})();
