'use strict';
// ===== GĐ9b: NHÀ CÁI & ĐẶT CƯỢC — logic (không cần giao diện, chạy được trong Node) =====
//   G.Run    — một ván (run): tiền, chặng, chỉ tiêu, charm, vay, bực bội ẩn của nhà cái, nhật ký nói dối.
//   G.Bookie — nhà cái của MỘT trận: tỷ lệ cược trước trận, câu đầu (Sống / Top 1 / Top 3) + Giao Kèo,
//              câu hỏi giữa trận theo sự kiện (Ai thắng? Ai giết boss? Ai lấy thính? Ai bị hạ tiếp? Kền kền?),
//              phân xử từ dòng sự kiện của trận, can thiệp bằng tiền, điều khoản ẩn, trả thưởng.
// Nhà cái KHÔNG rút số từ các luồng ngẫu nhiên của trận (chỉ dùng G.Rng riêng theo hạt giống) → trận vẫn tất định;
// chỉ có can thiệp mới đổi diễn biến trận (và được ghi lại để xem lại y hệt).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const B = () => G.BET, CH = () => G.CHARMS;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const r2 = (x) => Math.round(x * 100) / 100;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const pickLine = (R, k) => { const L = G.HOUSE_LINES[k] || ['…']; return L[R.int(0, L.length - 1)]; };

  // ================= RUN =================
  class Run {
    constructor(seed) {
      this.v = 1; this.seed = seed || 'run-' + Date.now().toString(36);
      this.money = B().startMoney; this.stage = 0; this.idx = 0;
      this.charms = []; this.annoy = 0; this.loans = [];
      this.log = [];        // nhật ký nhà cái (lời nói dối đã lộ, người của nhà cái đã lộ…)
      this.hist = [];       // lịch sử từng trận
      this.fx = { badOdds: 0, fine: 0, extraHouse: 0 };   // mặt trái của quà (số trận còn hiệu lực)
      this.quotaCut = 0; this.final = false; this.over = false; this.result = null;
      this.shop = null;     // cửa hàng sau trận hiện tại
    }
    static from(o) { const r = new Run(o.seed); Object.assign(r, o); return r; }
    has(id) { return this.charms.includes(id); }
    matchNo() { return this.stage * B().perStage + this.idx + 1; }
    totalMatches() { return B().stages.length * B().perStage; }
    quota() { const S = B().stages[Math.min(this.stage, B().stages.length - 1)]; return Math.round(S.quota * (1 - Math.min(0.5, this.quotaCut)) / 10) * 10; }
    mood() { return this.annoy >= 6 ? 2 : this.annoy >= 3 ? 1 : 0; }
    rng(tag) { return new G.Rng(this.seed + ':' + this.stage + ':' + this.idx + (this.final ? ':F' : '') + ':' + tag); }
    addAnnoy(n, why) { this.annoy = Math.max(0, this.annoy + n); if (why) this.annoyWhy = why; }
    // dàn tướng trận kế + người của nhà cái (số người theo chặng, bực bội, quà "Ân Huệ"; chặng sau có thể có người mới)
    nextConfig() {
      const cfg = G.arenaConfig(this.seed + '-t' + this.matchNo() + (this.final ? 'F' : ''));
      const R = this.rng('house'), H = B().house;
      let want = this.final ? 4 : Math.min(4, R.int(0, 1 + this.stage) + (this.annoy >= 4 ? 1 : 0) + (this.annoy >= 7 ? 1 : 0) + (this.fx.extraHouse ? 1 : 0));
      if (this.fx.extraHouse) { this.fx.extraHouse = 0; this.log.push({ t: this.matchNo(), txt: '🎁 Mặt trái của Ân Huệ: trận này nhà cái cài thêm 1 người.' }); }
      const present = cfg.picks.filter((p) => H.includes(p.hero)).map((p) => p.hero);
      const missing = R.shuffle(H.filter((id) => !present.includes(id)));
      while (present.length < want && missing.length) {
        const free = cfg.picks.map((p, i) => i).filter((i) => !H.includes(cfg.picks[i].hero));
        const i = free[R.int(0, free.length - 1)], id = missing.pop();
        cfg.picks[i] = { hero: id, player: G.heroChar ? G.heroChar(id) : undefined };
        present.push(id);
      }
      const house = R.shuffle(present.slice()).slice(0, want);
      // chặng 2 trở đi: nhà cái có thể mua chuộc thêm một người mới (không nằm trong danh sách cũ)
      if (!this.final && this.stage >= 1 && house.length && R.next() < 0.35) {
        const others = cfg.picks.map((p) => p.hero).filter((id) => !H.includes(id));
        if (others.length) house.push(others[R.int(0, others.length - 1)]);
      }
      cfg.house = house;
      return cfg;
    }
    // ----- sau trận -----
    afterMatch(sum) {
      const lines = [];
      if (this.has('ket_sat')) { const g = Math.min(300, Math.round(this.money * 0.05)); if (g > 0) { this.money += g; lines.push(`🔐 Két Sắt: +${g}`); } }
      if (this.has('xieng_no')) { const owe = this.loans.reduce((a, l) => a + l.amt, 0), g = Math.min(this.money, Math.round(owe * 0.08)); if (g > 0) { this.money -= g; lines.push(`⛓ Xiềng Nợ: −${g} tiền lãi`); } }
      for (const k of ['badOdds', 'fine']) if (this.fx[k] > 0) this.fx[k]--;
      this.hist.push({ n: this.matchNo(), delta: sum.delta, money: this.money, final: this.final });
      if (this.final) { this.over = true; this.result = this.money >= B().finalNeed ? 'free' : 'house'; return lines; }
      this.idx++;
      this.shop = this.makeShop();
      return lines;
    }
    stageEnd() { return !this.final && this.idx >= B().perStage; }
    // ----- cửa hàng: 3 charm (mua tối đa 1), quà nhà cái, vay / trả nợ -----
    makeShop() {
      const R = this.rng('shop');
      const pool = Object.keys(CH()).filter((id) => CH()[id].kind === 'shop' && !this.has(id));
      const offer = R.shuffle(pool).slice(0, 3).map((id) => ({ id, price: Math.round(CH()[id].price * (1 + 0.1 * this.stage) / 10) * 10 }));
      const gifts = Object.keys(CH()).filter((id) => CH()[id].kind === 'gift' && !this.has(id));
      const gift = gifts.length && R.next() < 0.5 ? gifts[R.int(0, gifts.length - 1)] : null;
      return { offer, gift, bought: false, giftDone: !gift };
    }
    freeSlots() { return B().slots - this.charms.length; }
    buy(id) {
      const S = this.shop, o = S && S.offer.find((x) => x.id === id);
      if (!o || S.bought) return 'Mỗi lần chỉ chọn 1 trong 3.';
      if (this.money < o.price) return 'Không đủ tiền.';
      if (this.freeSlots() <= 0) return 'Hết ô charm (bỏ bớt một charm).';
      this.money -= o.price; this.charms.push(id); S.bought = true; return null;
    }
    drop(id) { const C0 = CH()[id]; if (!C0 || C0.kind === 'bad') return 'Charm xấu chỉ gỡ được khi trả nợ.'; this.charms = this.charms.filter((x) => x !== id); return null; }
    takeGift(yes) {
      const S = this.shop; if (!S || !S.gift || S.giftDone) return;
      S.giftDone = true;
      if (!yes) return;
      const id = S.gift;
      if (this.freeSlots() > 0) this.charms.push(id);
      this.addAnnoy(-1);
      if (id === 'an_hue') { this.quotaCut += 0.2; this.fx.extraHouse = 1; }
      if (id === 'qua_nho') { this.money += 400; this.fx.badOdds = this.annoy >= 5 ? 3 : 2; }
      if (id === 'loi_hua') { this.quotaCut += 0.1; this.fx.fine = 3; }
    }
    borrow(amt) {
      if (!B().loans.includes(amt)) return 'Khoản vay không hợp lệ.';
      if (this.freeSlots() <= 0) return 'Charm xấu cần một ô trống.';
      const R = this.rng('loan' + this.loans.length), bad = ['xieng_no', 'mat_mo', 'tay_nhon'];
      const id = bad[R.int(0, bad.length - 1)];
      this.money += amt; this.loans.push({ amt, due: Math.round(amt * B().loanRate), charm: id }); this.charms.push(id);
      this.addAnnoy(-1);   // nhà cái thích con nợ
      return null;
    }
    repay(i) {
      const L = this.loans[i]; if (!L) return 'Không có khoản vay.';
      if (this.money < L.due) return 'Không đủ tiền trả.';
      this.money -= L.due; this.loans.splice(i, 1);
      const k = this.charms.indexOf(L.charm); if (k >= 0) this.charms.splice(k, 1);
      return null;
    }
    // chỉ tiêu = mức tiền phải CÓ khi hết chặng; chặng giữa nộp góp một nửa, chặng cuối trả hết (kèm mọi khoản vay)
    isLast() { return this.stage >= B().stages.length - 1; }
    loanDue() { return this.loans.reduce((a, l) => a + l.due, 0); }
    quotaNeed() { return this.quota() + (this.isLast() ? this.loanDue() : 0); }
    quotaPay() { return this.isLast() ? this.quotaNeed() : Math.round(this.quota() * B().installment / 10) * 10; }
    payQuota() {
      const need = this.quotaNeed();
      if (this.money < need) { this.over = true; this.result = 'debt'; return false; }
      this.money -= this.quotaPay(); this.paid = (this.paid || 0) + this.quotaPay();
      if (this.isLast()) { for (const l of this.loans) { const k = this.charms.indexOf(l.charm); if (k >= 0) this.charms.splice(k, 1); } this.loans = []; }
      this.stage++; this.idx = 0; this.quotaCut = 0;
      if (this.stage >= B().stages.length) {
        if (this.annoy >= B().angryEnd) this.final = true;
        else { this.over = true; this.result = 'free'; }
      }
      return true;
    }
  }

  // ================= TỶ LỆ =================
  // xác suất gốc từ thống kê mô phỏng (src/data/odds.js — tools/tyle.js), co về mức trung bình khi ít dữ liệu
  function prior(id) {
    const o = (G.HERO_ODDS || {})[id];
    return o ? { t1: (o.w + 1) / (o.n + 10), t3: (o.t3 + 3) / (o.n + 10) } : { t1: 0.1, t3: 0.3 };
  }
  const oddOf = (p, margin) => clamp(Math.round(((1 - margin) / Math.max(0.02, p)) * 20) / 20, 1.05, 30);

  // ================= NHÀ CÁI MỘT TRẬN =================
  class Bookie {
    constructor(m, run) {
      this.m = m; this.run = run; this.cfg = m.cfg;
      this.m.bookie = this;
      this.R = new G.Rng(m.seed + ':bookie');
      this.qs = []; this.bets = []; this.talk = []; this.pending = null;
      this.nMid = 0; this.lastQ = -999; this.seen = m.feedTotal || 0;
      this.pairs = new Map(); this.contract = null; this.ivN = { drop: 0, boss: 0, zone: 0 }; this.ivT = -999;
      this.rerolled = false; this.forgiven = false; this.delta = 0; this.vultureGain = 0; this.house = (this.cfg.house || []).slice();
      this.pre = this.preMatch();
      this.say(pickLine(this.R, 'greet'));
    }
    get money() { return this.run.money; }
    set money(v) { this.run.money = v; }
    say(txt, kind) { this.talk.push({ t: this.m.time, txt, kind: kind || 'house' }); }
    margin() {
      const run = this.run;
      return B().margin + 0.015 * run.annoy + (run.fx.badOdds > 0 ? 0.1 : 0) + (this.m.time - this.ivT < 60 ? 0.05 : 0);
    }
    // ----- trước trận -----
    preMatch() {
      const run = this.run, R = new G.Rng(this.m.seed + ':pre'), mg = this.margin();
      const ids = this.cfg.picks.map((p) => p.hero), raw = ids.map(prior);
      const s1 = raw.reduce((a, r) => a + r.t1, 0), s3 = raw.reduce((a, r) => a + r.t3, 0);
      const rows = ids.map((id, i) => ({ id, slot: i, p1: raw[i].t1 / s1, p3: Math.min(0.9, raw[i].t3 / s3 * 3) }));
      // "mồi": nhà cái thổi phồng một tướng không phải người của mình (sức mạnh ×1.5, tỷ lệ ×0.8 — trông như cửa trên)
      const cand = rows.filter((r) => !this.house.includes(r.id)).sort((a, b) => a.p1 - b.p1).slice(0, 5);
      const bait = cand.length ? cand[R.int(0, cand.length - 1)].id : null;
      const top = rows.slice().sort((a, b) => b.p1 - a.p1)[0].p1;
      const noise = run.has('kinh_lup') ? 0 : run.has('mat_mo') ? 0.3 : 0.15;
      for (const r of rows) {
        const baitK = r.id === bait ? 1 : 0;
        r.est = Math.round((r.p1 / top) * 100 * (baitK && !run.has('kinh_lup') ? 1.5 : 1) * (1 + (R.next() * 2 - 1) * noise));
        // người của nhà cái: nhà cái biết họ có lợi nên rút ngắn tỷ lệ — nhưng chỉ một phần (hắn nghĩ không ai để ý)
        const hk = this.house.includes(r.id) ? 0.9 : 1;
        r.o1 = oddOf(r.p1, mg) * (baitK ? 0.8 : 1) * hk; r.oS = oddOf(Math.min(0.95, r.p1 * 1.12), mg) * (baitK ? 0.8 : 1) * hk;
        r.o1 = Math.max(1.05, Math.round(r.o1 * 20) / 20); r.oS = Math.max(1.05, Math.round(r.oS * 20) / 20);
        r.pers = G.personalityOf(r.id);
      }
      // tin đồn (có tin giả)
      const rum = [], nm = (id) => G.HEROES[id].name;
      const H = this.house, nonH = ids.filter((id) => !H.includes(id));
      const truthHouse = H.length >= 2 && R.next() < 0.6;
      if (truthHouse) rum.push({ txt: `Nghe nói ${nm(H[0])} và ${nm(H[1])} hay uống rượu với nhà cái.`, truth: true });
      else if (nonH.length >= 2) { const a = nonH[R.int(0, nonH.length - 1)], b = nonH.filter((x) => x !== a)[R.int(0, nonH.length - 2)]; rum.push({ txt: `Nghe nói ${nm(a)} và ${nm(b)} hay uống rượu với nhà cái.`, truth: false }); }
      if (bait) rum.push({ txt: `${nm(bait)} đang sung lắm, tập luyện cả tuần.`, truth: false });
      const tr = ids.find((id) => G.personalityOf(id).trader);
      if (tr) rum.push({ txt: `${nm(tr)} mang theo một túi hàng — ai muốn mua bán thì tìm.`, truth: true });
      const weak = rows.slice().sort((a, b) => a.p1 - b.p1)[0];
      rum.push({ txt: `${nm(weak.id)} chẳng ai đặt cửa — cửa dưới mà.`, truth: true });
      R.shuffle(rum);
      // Tình Báo: lộ 1 người của nhà cái
      const spy = run.has('tinh_bao') && H.length ? H[R.int(0, H.length - 1)] : null;
      return { rows, bait, rumors: rum.slice(0, 3), spy, margin: mg };
    }
    // ----- câu đầu trận -----
    startQuestion() {
      const q = { id: 1, type: 'start', t: 0, text: pickLine(this.R, 'askStart'), modes: ['survive', 'top1', 'top3'], fine: { top1: G.BET_FINE.top1.solo }, contractN: this.expectN() };
      this.qs.push(q); this.pending = q; return q;
    }
    expectN() { return 4 + Math.min(2, this.run.stage) + (this.run.final ? 1 : 0); }   // giao kèo: 4 / 5 / 6 câu
    // pick: {mode, ids:[...], stake, contract: stake?} hoặc {skip:true, contract?}
    answerStart(pick) {
      const q = this.pending; if (!q || q.type !== 'start') return 'Không có câu hỏi.';
      if (pick.contract) {
        const cs = Math.round(pick.contract);
        if (cs < B().minBet || cs > this.money) return 'Tiền giao kèo không hợp lệ.';
        this.money -= cs; this.delta -= cs;
        this.contract = { stake: cs, ok: true, n: 0, need: this.expectN(), escrow: 0 };
        this.say(pickLine(this.R, 'contract'));
      }
      if (pick.skip) { this.pending = null; q.done = true; this.say(pickLine(this.R, 'skip')); return null; }
      const st = Math.round(pick.stake || 0);
      if (st < B().minBet || st > this.money) return 'Tiền cược không hợp lệ.';
      const rows = this.pre.rows, by = (id) => rows.find((r) => r.id === id);
      let odds = 0, f = 1;
      if (pick.mode === 'top3') {
        if (!pick.ids || pick.ids.length !== 3 || new Set(pick.ids).size !== 3) return 'Chọn đủ 3 tướng khác nhau.';
        const mean = pick.ids.reduce((a, id) => a + by(id).p3, 0) / 3;
        f = clamp(0.3 / mean, 0.5, 2.5);
        const fav = rows.slice().sort((a, b) => b.p1 - a.p1).slice(0, 4).map((r) => r.id);
        if (pick.ids.every((id) => fav.includes(id))) { f *= 0.5; this.say(pickLine(this.R, 'cheese'), 'cheese'); this.run.addAnnoy(1, 'chọn toàn cửa trên'); }
        f = r2(f);
      } else {
        const r = by(pick.ids && pick.ids[0]); if (!r) return 'Chọn một tướng.';
        odds = pick.mode === 'top1' ? r.o1 : r.oS;
      }
      this.money -= st; this.delta -= st;
      this.bets.push({ q, mode: pick.mode, ids: pick.ids.slice(), stake: st, odds, f, status: 'open', start: true });
      this.pending = null; q.done = true;
      return null;
    }
    // ----- giữa trận: gọi sau mỗi bước logic -----
    tick() {
      const m = this.m;
      const nNew = (m.feedTotal || 0) - this.seen; this.seen = m.feedTotal || 0;
      const evs = nNew > 0 ? m.feed.slice(Math.max(0, m.feed.length - nNew)) : [];
      for (const e of evs) this.onEvent(e);
      if (m.tick % 10 === 0) { this.trackPairs(); this.timeouts(); }
      if (this.pending || m.over) return null;
      if (m.tick % 10 !== 0) return null;
      return this.maybeAsk(evs);
    }
    // cặp đang đánh nhau (từ m.heroHit)
    trackPairs() {
      const m = this.m, H = m.heroHit;
      for (let i = H.length - 1; i >= 0; i--) {
        const h = H[i]; if (m.time - h.t > 0.6) break;
        const a = h.att && h.att.kind === 'hero' ? h.att : h.att && h.att.owner && h.att.owner.kind === 'hero' ? h.att.owner : null, b = h.vic;
        if (!a || !b || a === b || b.kind !== 'hero') continue;
        const k = Math.min(a.id, b.id) + ':' + Math.max(a.id, b.id);
        let P = this.pairs.get(k); if (!P) { P = { a: a.id < b.id ? a : b, b: a.id < b.id ? b : a, t0: m.time, last: m.time, ab: 0, ba: 0 }; this.pairs.set(k, P); }
        if (m.time - P.last > 8) { P.t0 = m.time; P.ab = 0; P.ba = 0; }
        P.last = m.time; if (a === P.a) P.ab = m.time; else P.ba = m.time;
      }
      if (m.tick % 200 === 0) for (const [k, P] of this.pairs) if (m.time - P.last > 15) this.pairs.delete(k);
    }
    maybeAsk(evs) {
      const m = this.m, Bt = B();
      if (m.time < Bt.midFirst || this.nMid >= Bt.midMax || m.time - this.lastQ < Bt.midGap || m.aliveCount() < 3) return null;
      if (m.time - this.ivT < 20) return null;   // vừa can thiệp: kèo phải chốt trước rồi mới can thiệp
      let q = null;
      const cnt = (t) => this.qs.filter((x) => x.type === t).length, CAP = { fight: 3, vulture: 2, death: 2, drop: 2, boss: 2, solo_duel: 2 };
      const ok = (t) => cnt(t) < CAP[t];
      const bh = ok('boss') && evs.find((e) => e.type === 'boss_hit');
      if (bh) q = this.mkBoss(bh);
      if (!q && ok('drop')) { const dw = evs.find((e) => e.type === 'drop_warn'); if (dw) q = this.mkDrop(dw); }
      if (!q && ok('solo_duel') && m.aliveCount() >= 4 && !m.duelActive() && this.R.next() < 0.45) q = this.mkSoloDuel();
      if (!q && ok('fight')) q = this.mkFight();
      if (!q && ok('vulture')) q = this.mkVulture();
      if (!q && ok('death') && m.time - this.lastQ > 160 && m.aliveCount() >= 4) q = this.mkDeath();
      if (!q) return null;
      return this.ask(q);
    }
    ask(q) {
      q.id = this.qs.length + 1; q.t = this.m.time; q.mid = true;
      const c = this.contract;
      q.contract = !!(c && c.ok && c.n + this.openContractQs() < c.need);
      if (q.contract) this.easyForm(q);   // câu trong giao kèo: "dễ hơn về xác suất" (dạng có / không) — nhưng điều khoản chữ nhỏ hay gặp hơn
      // điều khoản ẩn: hay gặp hơn khi đang giao kèo, khi nhà cái bực, khi dính "Lời Hứa Ngọt"
      const F = G.BET_FINE[q.type];
      if (F) {
        const p = 0.15 + (q.contract ? 0.45 : 0) + 0.05 * this.run.annoy + (this.run.fx.fine > 0 ? 1 : 0);
        if (this.R.next() < p) { const ks = Object.keys(F).filter((k) => !(q.drawOpt && k === 'drawLose')); q.fineKey = ks[this.R.int(0, ks.length - 1)]; q.fine = F[q.fineKey]; }
      }
      this.qs.push(q); this.pending = q; this.nMid++; this.lastQ = this.m.time;
      return q;
    }
    openContractQs() { return this.qs.filter((x) => x.contract && !x.done).length; }
    // biến câu hỏi thành dạng dễ (2 cửa, cửa trên ~60–80%) khi đang giao kèo
    easyForm(q) {
      const pick2 = (a, b) => this.priceOpts([a, b]);
      if (q.type === 'fight') {   // thêm cửa "không ai gục" (thay cho hủy kèo)
        const pd = 0.45, k = 1 - pd;
        q.opts = this.priceOpts(q.opts.map((o) => ({ key: o.key, hero: o.hero, p: o.p * k })).concat([{ key: 'draw', label: 'Không ai gục trong 40 giây', p: pd }]));
        q.drawOpt = true;
      } else if (q.type === 'death') {
        const S = q.opts.slice().sort((x, y) => y.p - x.p), top = S.slice(0, 3), pt = top.reduce((a, o) => a + o.p, 0);
        q.group = top.map((o) => o.hero);
        q.opts = pick2({ key: 'grp', label: 'Một trong: ' + top.map((o) => o.hero.hero.name).join(', '), p: pt }, { key: 'rest', label: 'Người khác', p: 1 - pt });
      } else if (q.type === 'drop') {
        const o = q.opts.filter((x) => x.hero).sort((x, y) => y.p - x.p)[0];
        q.who = o.hero;
        q.opts = pick2({ key: 'yes', label: o.hero.hero.name + ' lấy được', p: o.p }, { key: 'no', label: 'Không phải ' + o.hero.hero.name, p: 1 - o.p });
      } else if (q.type === 'boss') {
        q.opts = pick2({ key: 'die', label: 'Boss chết trong 3 phút', p: 0.65 }, { key: 'live', label: 'Boss còn sống sau 3 phút', p: 0.35 });
        q.binBoss = true;
      }
    }
    // làm tròn tỷ lệ cho các lựa chọn theo xác suất p (chuẩn hóa)
    priceOpts(opts) {
      const s = opts.reduce((a, o) => a + o.p, 0) || 1, mg = this.margin() * 0.6;   // câu giữa trận: nhà cái ăn ít hơn (người xem trận có lợi thế đọc vị)
      for (const o of opts) { o.p = o.p / s; o.odds = oddOf(o.p, mg); }
      return opts;
    }
    power(h) { return h.ai && h.ai.power ? Math.max(1, h.ai.power(h)) : 100; }
    mkFight() {
      const m = this.m;
      let best = null;
      for (const P of this.pairs.values()) {
        const { a, b } = P;
        if (!a.alive || !b.alive || m.time - P.ab > 2.5 || m.time - P.ba > 2.5) continue;   // phải đánh qua lại
        if (a.hpPct < 0.45 || b.hpPct < 0.45 || P.asked) continue;
        const locked = a.ai && b.ai && a.ai.target === b && b.ai.target === a;   // hai bên đã nhắm nhau — giao tranh thật, không phải cấu một phát
        if (!locked) continue;
        if (this.qs.some((q) => q.type === 'fight' && !q.done && (q.a === a || q.b === b || q.a === b || q.b === a))) continue;
        best = P; break;
      }
      if (!best) return null;
      best.asked = true;
      const { a, b } = best, pa = Math.pow(this.power(a) * a.hpPct, 1.5), pb = Math.pow(this.power(b) * b.hpPct, 1.5);
      const p = 0.1 + 0.8 * pa / (pa + pb);
      return { type: 'fight', a, b, until: m.time + 99999, pvpDeathRequired: true, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, opts: this.priceOpts([{ key: 'h' + a.id, hero: a, p }, { key: 'h' + b.id, hero: b, p: 1 - p }]) };
    }
    mkSoloDuel() {
      const m = this.m, alive = m.heroes.filter((h) => h.alive && !h.duel);
      if (alive.length < 2) return null;
      const shuffled = this.R.shuffle(alive.slice());
      const a = shuffled[0], b = shuffled[1];
      const pa = Math.pow(this.power(a) * a.hpPct, 1.4), pb = Math.pow(this.power(b) * b.hpPct, 1.4);
      const pWinA = 0.44 * pa / (pa + pb);
      const pWinB = 0.44 * pb / (pa + pb);
      const pDraw = 0.12;
      const opts = [
        { key: 'h' + a.id, hero: a, p: pWinA, label: a.hero.name + ' thắng' },
        { key: 'h' + b.id, hero: b, p: pWinB, label: b.hero.name + ' thắng' },
        { key: 'draw', label: 'Không ai thắng (hết giờ)', p: pDraw }
      ];
      const realm = G.C.DUEL_REALM || { cx: 1200, cy: 1200, r: 24 };
      return {
        type: 'solo_duel',
        a, b,
        until: m.time + 55,
        x: realm.cx,
        y: realm.cy,
        opts: this.priceOpts(opts)
      };
    }
    mkBoss(e) {
      const m = this.m, S = (m.lairSt || []).find((x) => x.lair.id === e.lair), boss = S && S.unit;
      if (!boss || !boss.alive) return null;
      const near = m.heroes.filter((h) => h.alive && dist(h, boss) < 40).sort((x, y) => dist(x, boss) - dist(y, boss)).slice(0, 4);
      if (!near.length) return null;
      const opts = near.map((h) => ({ key: 'h' + h.id, hero: h, p: Math.sqrt(this.power(h)) * (0.3 + h.hpPct) / (1 + dist(h, boss) / 12) }));
      const s = opts.reduce((a, o) => a + o.p, 0); for (const o of opts) o.p = o.p / s * 0.75;
      opts.push({ key: 'other', label: 'Người khác / boss sống quá 3 phút', p: 0.25 });
      return { type: 'boss', boss, lair: e.lair, bossId: boss.bossId, until: m.time + 180, x: boss.x, y: boss.y, opts: this.priceOpts(opts) };
    }
    mkDrop(e) {
      const m = this.m, d = (m.drops || []).find((x) => x.id === e.id);
      if (!d) return null;
      const near = m.heroes.filter((h) => h.alive).sort((x, y) => dist(x, d) - dist(y, d)).slice(0, 4);
      const opts = near.map((h) => ({ key: 'h' + h.id, hero: h, p: (0.4 + h.hpPct) * Math.sqrt(this.power(h)) / (1 + dist(h, d) / 15) }));
      const s = opts.reduce((a, o) => a + o.p, 0); for (const o of opts) o.p = o.p / s * 0.65;
      opts.push({ key: 'other', label: 'Người khác', p: 0.35 });
      return { type: 'drop', drop: d, dropId: d.id, until: d.at + 150, x: d.x, y: d.y, opts: this.priceOpts(opts) };
    }
    mkDeath() {
      const m = this.m, alive = m.heroes.filter((h) => h.alive);
      const mx = Math.max(...alive.map((h) => this.power(h)));
      const opts = alive.map((h) => ({ key: 'h' + h.id, hero: h, p: (1.2 - h.hpPct) * (m.inZone(h, 0) ? 1 : 1.6) * (1.3 - 0.6 * this.power(h) / mx) }));
      return { type: 'death', until: m.time + 9999, opts: this.priceOpts(opts) };
    }
    mkVulture() {
      const m = this.m;
      for (const P of this.pairs.values()) {
        const { a, b } = P;
        if (!a.alive || !b.alive || P.vAsked || m.time - P.t0 < 10 || m.time - P.last > 2) continue;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const n = m.heroes.filter((h) => h.alive && h !== a && h !== b && dist(h, mid) < 35).length;
        if (!n) continue;
        P.vAsked = true;
        const py = clamp(0.12 + 0.08 * n, 0.15, 0.5);
        return { type: 'vulture', a, b, until: m.time + 30, x: mid.x, y: mid.y, opts: this.priceOpts([{ key: 'yes', label: 'Có — kẻ thứ ba ăn mạng', p: py }, { key: 'no', label: 'Không', p: 1 - py }]) };
      }
      return null;
    }
    // Lật Câu Hỏi: đổi câu đang hỏi sang loại khác (1 lần mỗi trận)
    reroll() {
      const q = this.pending; if (!q || !q.mid || this.rerolled || !this.run.has('lat_cau')) return null;
      this.rerolled = true;
      const tries = [() => this.mkDeath(), () => this.mkVulture(), () => this.mkFight()].filter(() => true);
      for (const f of tries) { const n = f(); if (n && n.type !== q.type) { this.qs = this.qs.filter((x) => x !== q); this.pending = null; this.nMid--; return this.ask(n); } }
      return q;
    }
    answer(key, stake) {
      const q = this.pending; if (!q || q.type === 'start') return 'Không có câu hỏi.';
      const o = q.opts.find((x) => x.key === key); if (!o) return 'Lựa chọn không hợp lệ.';
      const st = Math.round(stake || 0);
      if (st < B().minBet || st > this.money) return 'Tiền cược không hợp lệ.';
      this.money -= st; this.delta -= st;
      this.bets.push({ q, key, stake: st, odds: o.odds, status: 'open', contract: q.contract });
      q.picked = key; this.pending = null;
      if (q.type === 'solo_duel' && !q.duelTriggered && this.m.startSoloDuelRealm) {
        q.duelTriggered = true; this.m.startSoloDuelRealm(q.a, q.b, q);
      }
      return null;
    }
    skip() {
      const q = this.pending; if (!q) return;
      this.pending = null; q.skipped = true; q.done = true;
      if (q.type === 'solo_duel' && !q.duelTriggered && this.m.startSoloDuelRealm) {
        q.duelTriggered = true; this.m.startSoloDuelRealm(q.a, q.b, q);
      }
      if (q.type === 'start') { q.done = true; return; }
      if (this.contract && this.contract.ok && q.contract) this.contractWrong(q, 'bỏ qua');
      else this.say(pickLine(this.R, 'skip'));
    }
    // ----- phân xử -----
    onEvent(e) {
      const m = this.m;
      if (e.type === 'kill' && e.vulture && this.run.has('mat_ken_ken')) { this.money += 60; this.delta += 60; this.vultureGain += 60; }
      for (const q of this.qs) {
        if (q.done || !q.mid) continue;
        if ((q.type === 'fight' || q.type === 'solo_duel') && e.type === 'kill' && (e.victim === q.a || e.victim === q.b)) {
          (q.dead || (q.dead = [])).push({ v: e.victim, k: e.killer, t: m.time });
          this.resolveFight(q);
        }
        if (q.type === 'vulture' && e.type === 'kill' && (e.victim === q.a || e.victim === q.b)) {
          const third = e.killer && e.killer.kind === 'hero' && e.killer !== q.a && e.killer !== q.b;
          if (third) this.resolve(q, 'yes');
          else if (e.killer === q.a || e.killer === q.b) this.resolve(q, 'no');   // hai người tự phân thắng bại — không có kền kền
        }
        if (q.type === 'boss' && e.type === 'boss_kill' && e.lair === q.lair) {
          if (q.fineKey === 'fast90' && m.time - q.t > 90) { this.resolve(q, null); continue; }
          if (q.binBoss) { this.resolve(q, 'die'); continue; }
          const o = e.hero && q.opts.find((x) => x.hero === e.hero); this.resolve(q, o ? o.key : 'other');
        }
        if (q.type === 'drop' && e.type === 'drop_take' && e.id === q.dropId) {
          if (q.fineKey === 'fast60' && q.drop.at && m.time - q.drop.at > 60) { this.resolve(q, null); continue; }
          if (q.who) { this.resolve(q, e.hero === q.who ? 'yes' : 'no'); continue; }
          const o = q.opts.find((x) => x.hero === e.hero); this.resolve(q, o ? o.key : 'other');
        }
        if (q.type === 'death' && e.type === 'kill' && e.victim && e.victim.kind === 'hero') {
          if (q.fineKey === 'noZone' && e.cause === 'zone') continue;
          if (q.group) { this.resolve(q, q.group.includes(e.victim) ? 'grp' : 'rest'); continue; }
          const o = q.opts.find((x) => x.hero === e.victim); this.resolve(q, o ? o.key : null);
        }
      }
    }
    timeouts() {
      const m = this.m;
      for (const q of this.qs) {
        if (q.done || !q.mid) continue;
        if (q.type === 'fight') continue; // Điều kiện trận PVP bắt buộc phải có người chết mới phân xử
        if (m.time < q.until) continue;
        if (q.type === 'solo_duel') this.resolveFight(q);
        else if (q.type === 'vulture') this.resolve(q, 'no');
        else if (q.type === 'boss') this.resolve(q, q.fineKey === 'fast90' ? null : q.binBoss ? 'live' : 'other');
        else if (q.type === 'drop') this.resolve(q, q.fineKey === 'fast60' ? null : 'void');
      }
    }
    resolveFight(q) {
      const D = q.dead || [];
      if (D.length >= 1) {
        const w = D[0].v === q.a ? q.b : q.a;
        if (q.fineKey === 'killerOnly' && D[0].k !== w) { this.resolve(q, null); return; }
        this.resolve(q, 'h' + w.id);
      } else if (q.type === 'solo_duel') {
        this.resolve(q, 'draw'); // hết giờ không ai hạ được ai
      } else {
        this.resolve(q, q.drawOpt ? 'draw' : q.fineKey === 'drawLose' ? null : 'void');
      }
    }
    // win: key thắng • null: mọi cửa thua • 'void': hủy kèo
    resolve(q, win) {
      if (q.done) return;
      q.done = true; q.result = win; q.rt = this.m.time;
      for (const b of this.bets) if (b.q === q && b.status === 'open') {
        if (win === 'void') { b.status = 'void'; this.money += b.stake; this.delta += b.stake; continue; }
        if (b.key === win) this.payWin(b, b.stake * b.odds);
        else { b.status = 'lost'; if (b.contract) this.contractWrong(q, 'sai'); if (b.stake >= 500) this.run.addAnnoy(-1); }
      }
      // câu trong giao kèo mà KHÔNG trả lời (bỏ qua) đã xử ở skip()
      if (this.contract && this.contract.ok && q.contract && q.picked && win !== 'void') this.contract.n++;
      if (this.contract && this.contract.ok && q.contract && q.picked && win === 'void') q.contract = false;   // hủy kèo: không tính, câu sau bù vào
    }
    payWin(b, amt) {
      const run = this.run;
      amt *= (run.has('dong_xu') ? 1.1 : 1) * (run.has('tay_nhon') ? 0.9 : 1);
      amt = Math.round(amt);
      b.status = 'won'; b.payout = amt; b.justWon = true;
      if (b.contract && this.contract && this.contract.ok) this.contract.escrow += amt;   // giữ lại tới cuối trận
      else { this.money += amt; this.delta += amt; }
      if (amt >= 1000 && amt >= b.stake * 5) { this.run.addAnnoy(1, 'thắng đậm'); this.say(pickLine(this.R, 'winBig')); }
    }
    contractWrong(q, why) {
      const c = this.contract; if (!c || !c.ok) return;
      if (this.run.has('bao_hiem') && !this.forgiven) { this.forgiven = true; this.say('📜 Bảo Hiểm Giao Kèo đỡ cho bạn ta một lần. Chỉ một lần thôi.'); return; }
      c.ok = false; c.failQ = q.id; c.why = why;
      this.say(pickLine(this.R, 'contractFail'));
    }
    // ----- can thiệp -----
    price(kind) {
      return 999999;
    }
    intervene(kind) {
      return 'Không thể can thiệp trận đấu nữa.';
    }
    // ----- hết trận -----
    finish() {
      const m = this.m, run = this.run, lines = [];
      // câu còn treo
      for (const q of this.qs) if (!q.done && q.mid) {
        if (q.type === 'fight') this.resolveFight(q);
        else if (q.type === 'vulture') this.resolve(q, 'no');
        else this.resolve(q, 'void');
      }
      const top = m.heroes.filter((h) => h.place === 1), placeOf = (id) => { const h = m.heroes.find((x) => x.heroId === id); return h ? h.place || 1 : 99; };
      for (const b of this.bets) if (b.start && b.status === 'open') {
        let win = false, mult = 0;
        if (b.mode === 'survive') { win = placeOf(b.ids[0]) === 1; mult = b.odds; }
        else if (b.mode === 'top1') { win = placeOf(b.ids[0]) === 1 && top.length === 1; mult = b.odds; if (placeOf(b.ids[0]) === 1 && top.length > 1) lines.push('📜 Điều khoản: đồng hạng 1 không phải Top 1.'); }
        else if (b.mode === 'top3') {
          const pos = b.ids.map((id, i) => placeOf(id) === i + 1), nPos = pos.filter(Boolean).length, inTop = b.ids.filter((id) => placeOf(id) <= 3).length;
          const base = nPos === 3 ? 6 : nPos === 2 ? 3 : inTop === 3 ? 2 : nPos === 1 ? 1 : 0;
          win = base > 0; mult = base * (base > 1 ? b.f : 1);
        }
        if (win) this.payWin(b, b.stake * mult);
        else {
          b.status = 'lost';
          if (run.has('luoi_an_toan')) { const g = Math.round(b.stake * 0.5); this.money += g; this.delta += g; lines.push(`🕸 Lưới An Toàn hoàn ${g}`); }
          if (b.stake >= 500) run.addAnnoy(-1);
        }
      }
      // giao kèo
      const c = this.contract;
      if (c) {
        if (c.ok) {
          const g = c.stake * 10 + c.escrow; this.money += g; this.delta += g;
          lines.push(`📜 Giao kèo trọn vẹn (${c.n} câu): +${c.stake * 10} (×10) + ${c.escrow} tiền thắng giữ lại`);
          this.say(pickLine(this.R, 'contractWin')); run.addAnnoy(2, 'thắng giao kèo');
        } else lines.push(`📜 Giao kèo vỡ ở câu ${c.failQ} (${c.why}) — mất ${c.stake} + ${c.escrow} tiền thắng giữ lại`);
      }
      if (this.delta < 0) this.say(pickLine(this.R, 'lose'));
      // nhật ký nhà cái: lời nói dối / người của nhà cái lộ ra sau trận
      const nm = (id) => (G.HEROES[id] ? G.HEROES[id].name : id), n = run.matchNo();
      if (this.house.length) run.log.push({ t: n, txt: `Người của nhà cái trận ${n}: ${this.house.map(nm).join(', ')}.` });
      else run.log.push({ t: n, txt: `Trận ${n}: không có người của nhà cái.` });
      if (this.pre.bait) run.log.push({ t: n, txt: `Trận ${n}: nhà cái thổi phồng ${nm(this.pre.bait)} (sức mạnh ×1.5, tỷ lệ thấp hơn thật 20%).` });
      for (const r of this.pre.rumors) if (!r.truth) run.log.push({ t: n, txt: `Trận ${n}: tin đồn giả — "${r.txt}"` });
      return { delta: this.delta, lines, vulture: this.vultureGain };
    }
  }

  G.Run = Run; G.Bookie = Bookie; G.betOdd = oddOf;
})();
