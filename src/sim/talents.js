'use strict';
// ===== CÂY TIẾN HÓA: 5 mốc (cấp 1/3/6/9/12), mỗi mốc chọn 1 trong 3 nhánh =====
// Nhánh = { name, desc, stats?, init?(m,u), hook… } — hook dùng chung tên với trang bị (onAuto, afterDeal, onTake, afterTake,
// tick, onKill, onSkill, onMonsterKill…). Chiêu kiểm tra nhánh bằng H.T(u, '6b') ngay trong mã chiêu.
// HLV chọn nhánh ở GĐ3; chưa chọn thì AI chọn ngẫu nhiên theo hạt giống trận (để mô phỏng đo được mọi nhánh).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const TIERS = [1, 3, 6, 9, 12];
  const EXTRA = [15, 18];   // GĐ8: chỉ mở khi có Ý Niệm Rực Rỡ
  const GEN = {
    toi_thuong: { name: 'Tối Thượng Nộ', desc: 'Chiêu cuối hồi nhanh hơn 35%.', onSkill(m, u, key) { if (key === 's4' && u.cd.s4 > 0) u.cd.s4 *= 0.65; } },
    than_luc: { name: 'Thần Lực', desc: '+20% Công Vật Lý và Công Phép.', stats: { physAmp: 0.2, magicAmp: 0.2 } },
  };
  const code = (ti, j) => TIERS[ti] + 'abc'[j];
  const TreeMix = {
    initTree(u, choice) {
      const tree = u.hero.tree;
      u.tset = {}; u.tfx = [];
      if (!tree) { u.tree = null; return; }
      const rng = this.treeRng || (this.treeRng = new G.Rng(this.seed + ':tree'));
      u.tree = TIERS.map((_, i) => {
        const c = choice && choice[i];
        return c === 0 || c === 1 || c === 2 ? c : rng.int(0, 2);
      });
      u.treeOn = 0;
      this.unlockTree(u);
    },
    // mở các nhánh đã đủ cấp
    unlockTree(u) {
      const tree = u.hero.tree;
      if (!tree || !u.tree) return;
      let changed = false;
      while (u.treeOn < TIERS.length && u.level >= TIERS[u.treeOn]) {
        const i = u.treeOn, b = tree[i] && tree[i][u.tree[i]];
        u.treeOn++;
        if (!b) continue;
        u.tset[code(i, u.tree[i])] = true;
        u.tfx.push(b);
        if (b.init) this.hook(b.init, this, u);
        changed = true;
      }
      // GĐ8: Ý Niệm Rực Rỡ (Hoàng Kim) mở thêm 2 mốc cấp 15 và 18, mỗi mốc 3 lựa chọn:
      //   cấp 15 — học thêm nhánh còn lại của mốc 3 / mốc 6 / mốc 9 • cấp 18 — thêm nhánh của mốc 12 / Tối Thượng Nộ / Thần Lực
      if ((u.yNiem || 0) >= 6) {
        u.treeX = u.treeX || [];
        for (const lv of EXTRA) {
          if (u.level < lv || u.treeX.some((x) => x.lv === lv)) continue;
          const rng = this.treeRng || (this.treeRng = new G.Rng(this.seed + ':tree'));
          const opts = lv === 15 ? [1, 2, 3].map((ti) => ({ ti })) : [{ ti: 4 }, { gen: 'toi_thuong' }, { gen: 'than_luc' }];
          const o = opts[rng.int(0, opts.length - 1)];
          let name = '', cd = null;
          if (o.ti != null) {
            const left = [0, 1, 2].filter((j) => j !== u.tree[o.ti] && !u.tset[code(o.ti, j)]);
            if (!left.length) continue;
            const j = left[rng.int(0, left.length - 1)], b = tree[o.ti] && tree[o.ti][j];
            if (!b) continue;
            cd = code(o.ti, j); u.tset[cd] = true; u.tfx.push(b); if (b.init) this.hook(b.init, this, u); name = b.name;
          } else { const g = GEN[o.gen]; u.tfx.push(g); name = g.name; cd = o.gen; }
          u.treeX.push({ lv, code: cd, name });
          this.addFeed({ type: 'tree_x', hero: u, lv, name });
          changed = true;
        }
      }
      if (changed) this.recalcItems(u);
    },
    // danh sách mã nhánh đang có (báo cáo)
    treeCodes(u) { return u.tree ? u.tree.map((c, i) => code(i, c)).concat((u.treeX || []).map((x) => x.code)) : []; },
  };
  G.TreeMix = TreeMix;
  G.TREE_TIERS = TIERS; G.TREE_EXTRA = EXTRA; G.TREE_GEN = GEN;
  G.treeCode = code;
})();
