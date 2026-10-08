'use strict';
// ===== GIAO DIỆN TÙY CHỈNH SOLO 1V1 — ĐẦY ĐỦ CẤP, NÂNG CẤP, Ý NIỆM, MẢNH HỒN, TRANG BỊ, TƯỚNG =====
(function () {
  const G = globalThis.G || (globalThis.G = {});

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  const ROLE_NAMES = {
    marksman: 'Xạ Thủ',
    mage: 'Pháp Sư',
    fighter: 'Đấu Sĩ',
    tank: 'Đỡ Đòn',
    support: 'Hỗ Trợ',
    assassin: 'Sát Thủ',
  };

  const DEFAULT_FIGHTER = (heroId, lv, yn) => {
    heroId = heroId || 'ryoma';
    lv = lv || 15;
    yn = yn != null ? yn : 6;
    const H = G.HEROES[heroId] || G.HEROES.ryoma;
    const tree = [0, 0, 0, 0, 0];
    const recSouls = getRecommendedSouls(heroId, yn);
    const recItems = getRecommendedItems(heroId);
    return {
      hero: heroId,
      level: lv,
      yNiem: yn,
      tree,
      souls: recSouls,
      items: recItems,
      pots: ['hp_l', 'ga_l', 'mp_l'],
      gold: 10000,
      mastery: 100,
      pers: 'hieuchien',
      playerStats: { meca: 18, fight: 18, map: 16, disc: 16 },
    };
  };

  function getRecommendedSouls(heroId, yn) {
    const H = G.HEROES[heroId];
    const ranged = H ? !!H.ranged : false;
    const isMagic = H ? H.dmgType === 'magic' : false;
    const cap = Math.min(6, yn != null ? yn : 6);
    let pool = [];

    if (ranged) {
      pool = ['RAD_VIS_01', 'RAD_RNG_01', 'RAD_RL_01', 'R_RNG_01', 'van_menh', 'WP1'];
    } else if (isMagic) {
      pool = ['RAD_VIS_01', 'tuyet_ky_no', 'co_menh', 'van_menh', 'BP3', 'WP2'];
    } else {
      pool = ['RAD_AS_01', 'RAD_VIS_01', 'R_RNG_02', 'G_RNG_04', 'van_menh', 'BA1'];
    }
    // Lọc theo các ID hợp lệ trong G.SHARDS
    pool = pool.filter((id) => G.SHARDS && G.SHARDS[id]);
    return pool.slice(0, cap);
  }

  function getRecommendedItems(heroId) {
    const H = G.HEROES[heroId];
    if (!H) return ['dao_pha_quan', 'cung_gio_loc', 'huyet_kiem', 'mui_khoan', 'song_dao', 'giay_cuong_chien'];
    if (H.build && H.build.core) {
      const b = (H.build.core || []).slice(0, 5);
      if (H.build.boots) b.push(H.build.boots);
      return b;
    }
    const arch = H.kit || 'fighter';
    if (arch === 'marksman') return ['dao_pha_quan', 'cung_gio_loc', 'huyet_kiem', 'mui_khoan', 'song_dao', 'giay_cuong_chien'];
    if (arch === 'mage') return ['ngoc_hien_triet', 'mu_hoa_than', 'truong_hu_vo', 'dong_ho_cat', 'mat_na', 'giay_khai_sang'];
    if (arch === 'tank') return ['vuong_mien', 'giap_gai', 'ao_thanh_linh', 'tim_cu_thach', 'khien_bang', 'giay_thep'];
    return ['riu_hac_thiet', 'xich_hon', 'song_dao', 'giap_gai', 'tim_cu_thach', 'giay_thep'];
  }

  const SoloUI = {
    app: null,
    cfg: null,
    picker: null, // { type: 'shard'|'item', side: 0|1, slot: 0..5 }

    open(app, existingCfg) {
      this.app = app;
      const seed = (existingCfg && existingCfg.seed) || ('solo-' + Math.floor(Math.random() * 100000));
      this.cfg = {
        seed,
        mode: 'solo',
        soloArena: (existingCfg && existingCfg.soloArena) || 'legacy_da',
        soloCenter: true,
        soloZoneR: 38,
        noRevive: true,
        fighters: [
          (existingCfg && existingCfg.fighters && existingCfg.fighters[0]) || DEFAULT_FIGHTER('ryoma', 15, 6),
          (existingCfg && existingCfg.fighters && existingCfg.fighters[1]) || DEFAULT_FIGHTER('kazuki', 15, 6),
        ],
      };
      this.render();
    },

    render() {
      const app = this.app;
      if (!app) return;
      app.show('setup');
      const root = document.querySelector('#setup');
      if (!root) return;

      const f0 = this.cfg.fighters[0];
      const f1 = this.cfg.fighters[1];

      root.innerHTML = `
        <div class="solo-wrap">
          <div class="solo-header">
            <h2>⚔️ SÀN ĐẤU SOLO 1V1 — TÙY CHỈNH TOÀN DIỆN</h2>
            <p>Tự do thiết lập Tướng tham chiến, Cấp độ, Cây tiến hóa, Ý niệm vũ khí, Mảnh hồn, Trang bị và Quy tắc sàn đấu.</p>
          </div>

          <div class="solo-bar">
            <button class="big" id="soloGo" style="background:linear-gradient(#d4af37,#aa8010);border-color:#ffd24a;color:#111;font-weight:800;padding:0.6em 1.4em">▶ BẮT ĐẦU SOLO</button>
            <button id="soloFast" style="font-weight:700">⏩ Mô Phỏng Nhanh</button>
            <button id="soloSwap">⇄ Đổi Bên</button>
            <button id="soloBalance">⚖️ Cân Bằng Cấp & Ý Niệm</button>
            <button id="soloRand">🎲 Ngẫu Nhiên 2 Tướng</button>
            <button id="soloBack">← Quay Lại</button>

            <div class="solo-rules">
              <label>🏟️ Sàn Đấu:
                <select id="soloArena">
                  <option value="legacy_da" ${this.cfg.soloArena === 'legacy_da' || !this.cfg.soloArena || this.cfg.soloArena === 'center' ? 'selected' : ''}>🪨 Đấu Trường Đá (Legacy)</option>
                  <option value="legacy_go" ${this.cfg.soloArena === 'legacy_go' ? 'selected' : ''}>🪵 Sân Gỗ Lộng Gió (Legacy)</option>
                  <option value="legacy_bang" ${this.cfg.soloArena === 'legacy_bang' ? 'selected' : ''}>❄️ Hồ Băng Vĩnh Cửu (Legacy)</option>
                  <option value="legacy_lava" ${this.cfg.soloArena === 'legacy_lava' ? 'selected' : ''}>🌋 Miệng Hỏa Sơn (Legacy)</option>
                  <option value="legacy_ngai" ${this.cfg.soloArena === 'legacy_ngai' ? 'selected' : ''}>👑 Ngai Võ Thần (Legacy)</option>
                  <option value="legacy_troi" ${this.cfg.soloArena === 'legacy_troi' ? 'selected' : ''}>☁️ Đảo Thiên Không (Legacy)</option>
                  <option value="corner" ${this.cfg.soloArena === 'corner' ? 'selected' : ''}>🗺️ Bản Đồ Sinh Tồn Đầy Đủ (612m)</option>
                </select>
              </label>

              <label>⭕ Vòng Bo:
                <select id="soloZone">
                  <option value="tight" ${this.cfg.soloZoneR === 38 ? 'selected' : ''}>Bo Võ Đài Thu Hẹp Nhanh (R=38m)</option>
                  <option value="medium" ${this.cfg.soloZoneR === 55 ? 'selected' : ''}>Bo Vừa Phải (R=55m)</option>
                  <option value="normal" ${this.cfg.soloZoneR === 999 ? 'selected' : ''}>Bo Bình Thường</option>
                </select>
              </label>

              <label>⚔️ Sinh Tử:
                <select id="soloRevive">
                  <option value="none" ${this.cfg.noRevive ? 'selected' : ''}>Tử Chiến 1 Mạng (Chết Là Thua)</option>
                  <option value="revive" ${!this.cfg.noRevive ? 'selected' : ''}>Có Hồi Sinh 1 Lần</option>
                </select>
              </label>

              <label>Hạt giống:
                <input id="soloSeed" value="${esc(this.cfg.seed)}" style="width:110px">
              </label>
            </div>
          </div>

          <div class="solo-grid">
            <div class="solo-card blue" id="soloSide0">${this.renderFighter(0, f0)}</div>
            <div class="solo-card red" id="soloSide1">${this.renderFighter(1, f1)}</div>
          </div>
        </div>

        <div id="soloPickerHost"></div>
      `;

      this.bindEvents(root);
    },

    renderFighter(side, f) {
      const H = G.HEROES[f.hero] || G.HEROES.ryoma;
      const col = side === 0 ? 'var(--blue)' : 'var(--red)';
      const sideName = side === 0 ? 'ĐỘI XANH (P1)' : 'ĐỘI ĐỎ (P2)';
      const heroes = Object.keys(G.HEROES).sort();

      // Chỉ số tính thử theo cấp
      const b = H.base || {};
      const L = (f.level || 1) - 1;
      const hpEst = Math.round((b.hp || 500) + (b.hpG || 80) * L);
      const adEst = Math.round((b.ad || 60) + (b.adG || 3.5) * L);
      const armEst = Math.round((b.armor || 25) + (b.armorG || 3.5) * L);
      const mrEst = Math.round((b.mr || 30) + (b.mrG || 1.5) * L);

      // Tùy chọn tướng
      const heroOptions = heroes.map((hid) => {
        const hh = G.HEROES[hid];
        const rk = ROLE_NAMES[hh.kit] || ROLE_NAMES[hh.role] || hh.kit || 'Tướng';
        return `<option value="${hid}" ${hid === f.hero ? 'selected' : ''}>${esc(hh.name)} (${rk})</option>`;
      }).join('');

      // Ý Niệm Buttons (0..6)
      const ynTiers = [
        { lv: 0, name: 'Thường', col: '#9aa8bf', dmg: '+0%' },
        { lv: 1, name: 'Trắng', col: '#eef2f8', dmg: '+10%' },
        { lv: 2, name: 'Xanh', col: '#2f8cff', dmg: '+20%' },
        { lv: 3, name: 'Tím', col: '#9a4dff', dmg: '+30%' },
        { lv: 4, name: 'Vàng', col: '#ffd21a', dmg: '+40%' },
        { lv: 5, name: 'Đỏ', col: '#ff2e2e', dmg: '+50%' },
        { lv: 6, name: 'Rực Rỡ', col: '#fff099', dmg: '+60%' },
      ];
      const yniemBtns = ynTiers.map((yt) => {
        const act = f.yNiem === yt.lv;
        return `<button class="solo-yniem-btn ${act ? 'active' : ''}" data-side="${side}" data-yn="${yt.lv}" style="color:${yt.col};border-color:${act ? yt.col : 'var(--line)'}">${yt.name}<br><small style="font-weight:400">${yt.dmg}</small></button>`;
      }).join('');

      // Cây Tiến Hóa
      const TIERS = [1, 3, 6, 9, 12];
      const treeHtml = (H.tree || []).map((tBlock, tIdx) => {
        const reqLv = TIERS[tIdx];
        const unlocked = f.level >= reqLv;
        const curPick = (f.tree && f.tree[tIdx]) != null ? f.tree[tIdx] : 0;
        const branchBtns = (tBlock || []).map((br, bIdx) => {
          const isSel = curPick === bIdx;
          return `
            <button class="solo-branch-btn ${isSel ? 'active' : ''}" data-side="${side}" data-tier="${tIdx}" data-branch="${bIdx}" title="${esc(br.desc || '')}">
              <b style="color:${isSel ? '#ffd24a' : 'var(--text)'}">${'ABC'[bIdx]}. ${esc(br.name || 'Nhánh')}</b>
              <small>${esc(br.desc || '')}</small>
            </button>
          `;
        }).join('');

        return `
          <div class="solo-tree-tier" style="${unlocked ? '' : 'opacity:0.45'}">
            <div class="solo-tier-head">
              <span>Mốc Cấp ${reqLv} ${unlocked ? '✓ Đã mở' : '🔒 Khóa (yêu cầu cấp ' + reqLv + ')'}</span>
              <small>Nhánh đang chọn: ${'ABC'[curPick]}</small>
            </div>
            <div class="solo-tier-branches">${branchBtns}</div>
          </div>
        `;
      }).join('');

      // Mốc 15 & 18 nếu Ý Niệm == 6
      let extraTreeHtml = '';
      if ((f.yNiem || 0) >= 6) {
        extraTreeHtml = `
          <div class="solo-tree-tier" style="border:1px dashed #ffd24a;background:rgba(255,210,74,0.06)">
            <div class="solo-tier-head" style="color:#fff099">
              <span>👑 Ý Niệm Rực Rỡ — Mốc Tiến Hóa Đặc Biệt Cấp 15 & 18</span>
            </div>
            <div style="font-size:0.75em;color:var(--dim)">Khi đạt cấp 15 và 18 trong trận, tướng tự động mở thêm nhánh bổ sung (Tối Thượng Nộ / Thần Lực / Nhánh Phụ) gia tăng sức mạnh vượt bậc.</div>
          </div>
        `;
      }

      // Mảnh Hồn Slots (Tối đa 6 ô)
      const maxSlots = Math.min(6, f.yNiem || 0);
      const soulSlots = [0, 1, 2, 3, 4, 5].map((sIdx) => {
        const isLocked = sIdx >= maxSlots;
        const sid = f.souls && f.souls[sIdx];
        const sh = sid && G.SHARDS && G.SHARDS[sid];
        const T = sh && G.SOUL_TIER && G.SOUL_TIER[sh.t];
        const col = T ? T.color : '#888';

        if (isLocked) {
          return `
            <div class="solo-slot-box locked" title="Nâng Ý Niệm lên cấp ${sIdx + 1} để mở khóa ô này">
              <div class="solo-slot-name" style="color:var(--dim)">🔒 Ô ${sIdx + 1} Khóa</div>
              <div class="solo-slot-desc">Cần Ý Niệm ≥ ${sIdx + 1}</div>
            </div>
          `;
        }

        if (sh) {
          return `
            <div class="solo-slot-box has-val" style="border-color:${col}" data-side="${side}" data-soulslot="${sIdx}">
              <span class="solo-slot-del" data-delsoul="${sIdx}" data-side="${side}" title="Xóa mảnh này">✕</span>
              <div class="solo-slot-name" style="color:${col}">${G.shardIcon ? G.shardIcon(sh.id) : '💠'} ${esc(sh.n)}</div>
              <div class="solo-slot-desc" title="${esc(G.shardText ? G.shardText(sh) : '')}">${esc(G.shardText ? G.shardText(sh) : '')}</div>
            </div>
          `;
        }

        return `
          <div class="solo-slot-box" data-side="${side}" data-soulslot="${sIdx}">
            <div class="solo-slot-name" style="color:#6aa0e0">+ Thêm Mảnh Ô ${sIdx + 1}</div>
            <div class="solo-slot-desc">Bấm để chọn mảnh hồn</div>
          </div>
        `;
      }).join('');

      // Trang Bị Slots (6 ô)
      const itemSlots = [0, 1, 2, 3, 4, 5].map((iIdx) => {
        const iid = f.items && f.items[iIdx];
        const it = iid && G.ITEMS && G.ITEMS[iid];

        if (it) {
          return `
            <div class="solo-slot-box has-val" style="border-color:#ffd24a" data-side="${side}" data-itemslot="${iIdx}">
              <span class="solo-slot-del" data-delitem="${iIdx}" data-side="${side}" title="Tháo trang bị">✕</span>
              <div class="solo-slot-name" style="color:#ffe08a">⚔️ ${esc(it.name)}</div>
              <div class="solo-slot-desc" title="${esc(it.statText || '')}">${esc(it.statText || '')}</div>
            </div>
          `;
        }

        return `
          <div class="solo-slot-box" data-side="${side}" data-itemslot="${iIdx}">
            <div class="solo-slot-name" style="color:#6aa0e0">+ Chọn Món ${iIdx + 1}</div>
            <div class="solo-slot-desc">Trang bị hoàn chỉnh</div>
          </div>
        `;
      }).join('');

      return `
        <div class="solo-sec-title" style="color:${col}">
          <span>🛡️ ${sideName}</span>
          <small>Thành thạo: ${f.mastery}%</small>
        </div>

        <!-- 1. CHỌN TƯỚNG -->
        <div class="solo-hero-head">
          <div class="solo-avatar" style="background:${H.color || '#333'}">${(H.name || 'T')[0]}</div>
          <div class="solo-hero-meta">
            <select class="solo-hero-sel" data-side="${side}">${heroOptions}</select>
            <div class="solo-hero-role">
              <span><b>${esc(H.name)}</b> — ${esc(H.title || '')}</span>
              <button class="btn sm" data-side="${side}" data-randhero="1" style="min-height:22px;padding:0 6px;font-size:0.75em">🎲 Đổi Tướng</button>
            </div>
          </div>
        </div>

        <!-- 2. CẤP ĐỘ -->
        <div>
          <div class="solo-sec-title">
            <span>📊 CẤP ĐỘ: <b class="solo-lvl-num" style="color:#ffd24a">Cấp ${f.level}</b></span>
            <div class="solo-quick-btns">
              <button data-side="${side}" data-setlvl="1">Lv.1</button>
              <button data-side="${side}" data-setlvl="6">Lv.6</button>
              <button data-side="${side}" data-setlvl="12">Lv.12</button>
              <button data-side="${side}" data-setlvl="15">Lv.15</button>
              <button data-side="${side}" data-setlvl="18">Lv.18</button>
            </div>
          </div>
          <div class="solo-lvl-row">
            <input type="range" min="1" max="18" value="${f.level}" class="solo-lvl-range" data-side="${side}" style="flex:1">
          </div>
          <div class="solo-stats-strip">
            <span>Máu: <b>${hpEst}</b></span>
            <span>Công: <b>${adEst}</b></span>
            <span>Giáp: <b>${armEst}</b></span>
            <span>Kháng Phép: <b>${mrEst}</b></span>
          </div>
        </div>

        <!-- 3. Ý NIỆM VŨ KHÍ -->
        <div>
          <div class="solo-sec-title">
            <span>✨ Ý NIỆM VŨ KHÍ: <b style="color:${ynTiers[f.yNiem].col}">${ynTiers[f.yNiem].name} (Bậc ${f.yNiem})</b></span>
            <small style="color:${ynTiers[f.yNiem].col}">${ynTiers[f.yNiem].dmg} Sát Thương • ${Math.min(6, f.yNiem)} Ô Mảnh</small>
          </div>
          <div class="solo-yniem-row">${yniemBtns}</div>
        </div>

        <!-- 4. NÂNG CẤP TIẾN HÓA -->
        <div>
          <div class="solo-sec-title">
            <span>🌳 CÂY TIẾN HÓA (KỸ NĂNG & NÂNG CẤP)</span>
            <button class="btn sm" data-side="${side}" data-randtree="1" style="min-height:22px;padding:0 6px;font-size:0.75em">🎲 Ngẫu Nhiên Nhánh</button>
          </div>
          ${treeHtml}
          ${extraTreeHtml}
        </div>

        <!-- 5. MẢNH HỒN -->
        <div>
          <div class="solo-sec-title">
            <span>💠 MẢNH HỒN (${(f.souls || []).length}/${maxSlots} ô đang gắn)</span>
            <div class="solo-quick-btns">
              <button data-side="${side}" data-preset-souls="rad" style="color:#fff099">👑 Hoàng Kim</button>
              <button data-side="${side}" data-preset-souls="dmg" style="color:#ff7a7a">⚔️ Công Kích</button>
              <button data-side="${side}" data-preset-souls="def" style="color:#7ab0ff">🛡️ Bất Tử</button>
              <button data-side="${side}" data-preset-souls="rec">⚡ Khuyên Dùng</button>
              <button data-side="${side}" data-preset-souls="clear">🧹 Xóa</button>
            </div>
          </div>
          <div class="solo-slots-grid">${soulSlots}</div>
        </div>

        <!-- 6. TRANG BỊ -->
        <div>
          <div class="solo-sec-title">
            <span>⚔️ TRANG BỊ HOÀN CHỈNH (6 Ô)</span>
            <div class="solo-quick-btns">
              <button data-side="${side}" data-preset-items="core">⚔️ Đồ Chuẩn</button>
              <button data-side="${side}" data-preset-items="ad">⚡ Full AD</button>
              <button data-side="${side}" data-preset-items="tank">🛡️ Full Tank</button>
              <button data-side="${side}" data-preset-items="none">🚫 Không Đồ</button>
            </div>
          </div>
          <div class="solo-slots-grid">${itemSlots}</div>
        </div>

        <!-- 7. TÍNH CÁCH VÀ BẢN LĨNH -->
        <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:6px 10px;font-size:0.85em;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <label>🧠 Tính Cách AI:
            <select class="solo-pers-sel" data-side="${side}">
              <option value="hieuchien" ${f.pers === 'hieuchien' ? 'selected' : ''}>Hiếu Chiến (Ép giao tranh)</option>
              <option value="canthan" ${f.pers === 'canthan' ? 'selected' : ''}>Cẩn Trọng (Thả diều an toàn)</option>
              <option value="kenca" ${f.pers === 'kenca' ? 'selected' : ''}>Đồ Tể (Dồn dame dứt điểm)</option>
              <option value="kroam" ${f.pers === 'kroam' ? 'selected' : ''}>Kỷ Luật (Phản xạ chuẩn mực)</option>
            </select>
          </label>
          <label>🏆 Thành thạo:
            <select class="solo-mast-sel" data-side="${side}">
              <option value="100" ${f.mastery === 100 ? 'selected' : ''}>100% Cao Thủ (+6% ST combo)</option>
              <option value="80" ${f.mastery === 80 ? 'selected' : ''}>80% Khá (+2% ST combo)</option>
              <option value="50" ${f.mastery === 50 ? 'selected' : ''}>50% Bình Thường</option>
            </select>
          </label>
        </div>
      `;
    },

    bindEvents(root) {
      // Top actions
      root.querySelector('#soloGo').onclick = () => {
        const cfg = this.buildMatchConfig();
        this.app.startMatch(cfg);
      };

      root.querySelector('#soloFast').onclick = () => {
        const cfg = this.buildMatchConfig();
        this.app.quickSim(cfg);
      };

      root.querySelector('#soloBack').onclick = () => {
        this.app.menu();
      };

      root.querySelector('#soloSwap').onclick = () => {
        const t = this.cfg.fighters[0];
        this.cfg.fighters[0] = this.cfg.fighters[1];
        this.cfg.fighters[1] = t;
        this.render();
      };

      root.querySelector('#soloBalance').onclick = () => {
        const f0 = this.cfg.fighters[0];
        const f1 = this.cfg.fighters[1];
        const maxLv = Math.max(f0.level, f1.level);
        const maxYN = Math.max(f0.yNiem, f1.yNiem);
        f0.level = f1.level = maxLv;
        f0.yNiem = f1.yNiem = maxYN;
        this.render();
      };

      root.querySelector('#soloRand').onclick = () => {
        const all = Object.keys(G.HEROES);
        const r1 = all[Math.floor(Math.random() * all.length)];
        let r2 = all[Math.floor(Math.random() * all.length)];
        if (r2 === r1) r2 = all[(all.indexOf(r1) + 1) % all.length];
        this.cfg.fighters[0] = DEFAULT_FIGHTER(r1, this.cfg.fighters[0].level, this.cfg.fighters[0].yNiem);
        this.cfg.fighters[1] = DEFAULT_FIGHTER(r2, this.cfg.fighters[1].level, this.cfg.fighters[1].yNiem);
        this.render();
      };

      // Arena Rules
      const arenaSel = root.querySelector('#soloArena');
      if (arenaSel) arenaSel.onchange = (e) => {
        this.cfg.soloArena = e.target.value;
        this.cfg.soloCenter = e.target.value !== 'corner';
      };

      const zoneSel = root.querySelector('#soloZone');
      if (zoneSel) zoneSel.onchange = (e) => {
        this.cfg.soloZoneR = e.target.value === 'tight' ? 38 : e.target.value === 'medium' ? 55 : 999;
      };

      const revSel = root.querySelector('#soloRevive');
      if (revSel) revSel.onchange = (e) => { this.cfg.noRevive = e.target.value === 'none'; };

      const seedIn = root.querySelector('#soloSeed');
      if (seedIn) seedIn.onchange = (e) => { this.cfg.seed = e.target.value.trim() || this.cfg.seed; };

      // Change Hero
      root.querySelectorAll('.solo-hero-sel').forEach((sel) => {
        sel.onchange = (e) => {
          const side = +e.target.dataset.side;
          const hid = e.target.value;
          this.cfg.fighters[side] = DEFAULT_FIGHTER(hid, this.cfg.fighters[side].level, this.cfg.fighters[side].yNiem);
          this.render();
        };
      });

      // Random Hero individual button
      root.querySelectorAll('[data-randhero]').forEach((btn) => {
        btn.onclick = (e) => {
          const side = +btn.dataset.side;
          const all = Object.keys(G.HEROES);
          const hid = all[Math.floor(Math.random() * all.length)];
          this.cfg.fighters[side] = DEFAULT_FIGHTER(hid, this.cfg.fighters[side].level, this.cfg.fighters[side].yNiem);
          this.render();
        };
      });

      // Level Range
      root.querySelectorAll('.solo-lvl-range').forEach((range) => {
        range.oninput = (e) => {
          const side = +range.dataset.side;
          this.cfg.fighters[side].level = +e.target.value;
          this.render();
        };
      });

      // Quick Level buttons
      root.querySelectorAll('[data-setlvl]').forEach((btn) => {
        btn.onclick = () => {
          const side = +btn.dataset.side;
          this.cfg.fighters[side].level = +btn.dataset.setlvl;
          this.render();
        };
      });

      // Ý Niệm Buttons
      root.querySelectorAll('.solo-yniem-btn').forEach((btn) => {
        btn.onclick = () => {
          const side = +btn.dataset.side;
          const yn = +btn.dataset.yn;
          this.cfg.fighters[side].yNiem = yn;
          // Cắt bớt souls nếu vượt quá số ô
          if (this.cfg.fighters[side].souls.length > yn) {
            this.cfg.fighters[side].souls = this.cfg.fighters[side].souls.slice(0, yn);
          }
          this.render();
        };
      });

      // Branch Buttons (Talents)
      root.querySelectorAll('.solo-branch-btn').forEach((btn) => {
        btn.onclick = () => {
          const side = +btn.dataset.side;
          const tier = +btn.dataset.tier;
          const branch = +btn.dataset.branch;
          this.cfg.fighters[side].tree[tier] = branch;
          this.render();
        };
      });

      // Random Talents Button
      root.querySelectorAll('[data-randtree]').forEach((btn) => {
        btn.onclick = () => {
          const side = +btn.dataset.side;
          this.cfg.fighters[side].tree = [
            Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 3),
          ];
          this.render();
        };
      });

      // Preset Souls
      root.querySelectorAll('[data-preset-souls]').forEach((btn) => {
        btn.onclick = () => {
          const side = +btn.dataset.side;
          const mode = btn.dataset.presetSouls;
          const f = this.cfg.fighters[side];
          const yn = f.yNiem;
          if (mode === 'clear') {
            f.souls = [];
          } else if (mode === 'rad') {
            f.yNiem = 6;
            f.souls = ['RAD_VIS_01', 'RAD_RNG_01', 'RAD_AS_01', 'RAD_RL_02', 'R_RNG_01', 'R_RNG_02'];
          } else if (mode === 'dmg') {
            f.souls = ['RAD_AS_01', 'RAD_RNG_01', 'R_RNG_01', 'GP1', 'WP1', 'BP2'].slice(0, yn);
          } else if (mode === 'def') {
            f.souls = ['RAD_VIS_01', 'R_RNG_02', 'van_menh', 'BA1', 'WA1', 'P01'].slice(0, yn);
          } else if (mode === 'rec') {
            f.souls = getRecommendedSouls(f.hero, yn);
          }
          this.render();
        };
      });

      // Preset Items
      root.querySelectorAll('[data-preset-items]').forEach((btn) => {
        btn.onclick = () => {
          const side = +btn.dataset.side;
          const mode = btn.dataset.presetItems;
          const f = this.cfg.fighters[side];
          if (mode === 'none') {
            f.items = [];
          } else if (mode === 'core') {
            f.items = getRecommendedItems(f.hero);
          } else if (mode === 'ad') {
            f.items = ['dao_pha_quan', 'cung_gio_loc', 'huyet_kiem', 'mui_khoan', 'song_dao', 'giay_cuong_chien'];
          } else if (mode === 'tank') {
            f.items = ['vuong_mien', 'giap_gai', 'ao_thanh_linh', 'tim_cu_thach', 'khien_bang', 'giay_thep'];
          }
          this.render();
        };
      });

      // Delete Soul from slot
      root.querySelectorAll('[data-delsoul]').forEach((del) => {
        del.onclick = (e) => {
          e.stopPropagation();
          const side = +del.dataset.side;
          const sIdx = +del.dataset.delsoul;
          this.cfg.fighters[side].souls.splice(sIdx, 1);
          this.render();
        };
      });

      // Click Soul slot -> open Shard Picker Modal
      root.querySelectorAll('[data-soulslot]').forEach((slotEl) => {
        slotEl.onclick = () => {
          const side = +slotEl.dataset.side;
          const sIdx = +slotEl.dataset.soulslot;
          this.openShardPicker(side, sIdx);
        };
      });

      // Delete Item from slot
      root.querySelectorAll('[data-delitem]').forEach((del) => {
        del.onclick = (e) => {
          e.stopPropagation();
          const side = +del.dataset.side;
          const iIdx = +del.dataset.delitem;
          this.cfg.fighters[side].items.splice(iIdx, 1);
          this.render();
        };
      });

      // Click Item slot -> open Item Picker Modal
      root.querySelectorAll('[data-itemslot]').forEach((slotEl) => {
        slotEl.onclick = () => {
          const side = +slotEl.dataset.side;
          const iIdx = +slotEl.dataset.itemslot;
          this.openItemPicker(side, iIdx);
        };
      });

      // Personality select
      root.querySelectorAll('.solo-pers-sel').forEach((sel) => {
        sel.onchange = (e) => {
          const side = +sel.dataset.side;
          this.cfg.fighters[side].pers = e.target.value;
        };
      });

      // Mastery select
      root.querySelectorAll('.solo-mast-sel').forEach((sel) => {
        sel.onchange = (e) => {
          const side = +sel.dataset.side;
          this.cfg.fighters[side].mastery = +e.target.value;
        };
      });
    },

    openShardPicker(side, slotIdx) {
      const host = document.querySelector('#soloPickerHost');
      if (!host) return;

      const f = this.cfg.fighters[side];
      const maxTier = f.yNiem || 6;
      let activeTab = 'all';

      const renderModal = () => {
        const list = (G.SHARD_LIST || []).filter((sh) => {
          if (activeTab === 'all') return true;
          return sh.t === +activeTab;
        });

        const tabs = [
          { id: 'all', label: 'Tất Cả' },
          { id: '6', label: '👑 Hoàng Kim 6★', col: '#fff099' },
          { id: '5', label: '🔴 Đỏ 5★', col: '#ff2e2e' },
          { id: '4', label: '🟡 Vàng 4★', col: '#ffd21a' },
          { id: '3', label: '🟣 Tím 3★', col: '#9a4dff' },
          { id: '2', label: '🔵 Xanh 2★', col: '#2f8cff' },
          { id: '1', label: '⚪ Trắng 1★', col: '#eef2f8' },
        ];

        const tabsHtml = tabs.map((t) => {
          const isAct = activeTab === t.id;
          return `<button class="${isAct ? 'active' : ''}" data-stab="${t.id}" style="${t.col ? 'color:' + t.col : ''}">${t.label}</button>`;
        }).join('');

        const itemsHtml = list.map((sh) => {
          const T = G.SOUL_TIER && G.SOUL_TIER[sh.t];
          const col = T ? T.color : '#fff';
          const txt = G.shardText ? G.shardText(sh) : '';
          return `
            <div class="solo-pick-item" data-pickshard="${sh.id}">
              <b style="color:${col}">${G.shardIcon ? G.shardIcon(sh.id) : '💠'} [${T ? T.name : 'Bậc ' + sh.t}] ${esc(sh.n)}</b>
              <small>${esc(txt)}</small>
            </div>
          `;
        }).join('');

        host.innerHTML = `
          <div class="solo-picker-modal" id="soloModal">
            <div class="solo-picker-inner">
              <div class="solo-picker-top">
                <h3>💠 CHỌN MẢNH HỒN CHO Ô ${slotIdx + 1} (${side === 0 ? 'Đội Xanh' : 'Đội Đỏ'})</h3>
                <button class="btn sm" id="closePicker">✕ Đóng</button>
              </div>
              <div class="solo-picker-tabs">${tabsHtml}</div>
              <div class="solo-picker-body">${itemsHtml}</div>
            </div>
          </div>
        `;

        host.querySelector('#closePicker').onclick = () => { host.innerHTML = ''; };
        host.querySelector('#soloModal').onclick = (e) => {
          if (e.target.id === 'soloModal') host.innerHTML = '';
        };

        host.querySelectorAll('[data-stab]').forEach((tbtn) => {
          tbtn.onclick = () => {
            activeTab = tbtn.dataset.stab;
            renderModal();
          };
        });

        host.querySelectorAll('[data-pickshard]').forEach((pEl) => {
          pEl.onclick = () => {
            const sid = pEl.dataset.pickshard;
            this.cfg.fighters[side].souls[slotIdx] = sid;
            host.innerHTML = '';
            this.render();
          };
        });
      };

      renderModal();
    },

    openItemPicker(side, slotIdx) {
      const host = document.querySelector('#soloPickerHost');
      if (!host) return;

      let activeCat = 'all';

      const renderModal = () => {
        const rawList = Object.values(G.ITEMS || {}).filter((it) => !it.isComp && it.cost > 0);
        const list = rawList.filter((it) => {
          if (activeCat === 'all') return true;
          return it.cat === activeCat;
        });

        const cats = [
          { id: 'all', label: 'Tất Cả' },
          { id: 'ad', label: '⚔️ Công Vật Lý' },
          { id: 'ap', label: '✨ Phép Thuật' },
          { id: 'def', label: '🛡️ Phòng Thủ' },
          { id: 'boots', label: '👟 Giày' },
        ];

        const tabsHtml = cats.map((c) => {
          const isAct = activeCat === c.id;
          return `<button class="${isAct ? 'active' : ''}" data-icat="${c.id}">${c.label}</button>`;
        }).join('');

        const itemsHtml = list.map((it) => {
          return `
            <div class="solo-pick-item" data-pickitem="${it.id}">
              <b style="color:#ffe08a">⚔️ ${esc(it.name)} <small style="color:var(--dim)">(${it.cost} vàng)</small></b>
              <small>${esc(it.statText || it.desc || '')}</small>
            </div>
          `;
        }).join('');

        host.innerHTML = `
          <div class="solo-picker-modal" id="soloItemModal">
            <div class="solo-picker-inner">
              <div class="solo-picker-top">
                <h3>⚔️ CHỌN TRANG BỊ CHO Ô ${slotIdx + 1} (${side === 0 ? 'Đội Xanh' : 'Đội Đỏ'})</h3>
                <button class="btn sm" id="closeItemPicker">✕ Đóng</button>
              </div>
              <div class="solo-picker-tabs">${tabsHtml}</div>
              <div class="solo-picker-body">${itemsHtml}</div>
            </div>
          </div>
        `;

        host.querySelector('#closeItemPicker').onclick = () => { host.innerHTML = ''; };
        host.querySelector('#soloItemModal').onclick = (e) => {
          if (e.target.id === 'soloItemModal') host.innerHTML = '';
        };

        host.querySelectorAll('[data-icat]').forEach((tbtn) => {
          tbtn.onclick = () => {
            activeCat = tbtn.dataset.icat;
            renderModal();
          };
        });

        host.querySelectorAll('[data-pickitem]').forEach((pEl) => {
          pEl.onclick = () => {
            const iid = pEl.dataset.pickitem;
            this.cfg.fighters[side].items[slotIdx] = iid;
            host.innerHTML = '';
            this.render();
          };
        });
      };

      renderModal();
    },

    buildMatchConfig() {
      const f0 = this.cfg.fighters[0];
      const f1 = this.cfg.fighters[1];

      const makePick = (f, i) => {
        return {
          hero: f.hero,
          level: f.level,
          yNiem: f.yNiem,
          tree: f.tree ? f.tree.slice() : [0, 0, 0, 0, 0],
          souls: (f.souls || []).filter(Boolean),
          items: (f.items || []).filter(Boolean),
          pots: (f.pots || []).filter(Boolean),
          gold: f.gold || 10000,
          mastery: f.mastery != null ? f.mastery : 100,
          pers: f.pers || 'hieuchien',
          playerStats: Object.assign({}, f.playerStats || {}),
        };
      };

      const isCorner = this.cfg.soloArena === 'corner';
      const themeKey = !isCorner ? (this.cfg.soloArena && this.cfg.soloArena.startsWith('legacy_') ? this.cfg.soloArena.slice(7) : (this.cfg.soloArena || 'da')) : null;

      return {
        seed: this.cfg.seed || ('solo-' + Math.floor(Math.random() * 100000)),
        mode: 'solo',
        soloArena: this.cfg.soloArena || 'legacy_da',
        soloTheme: themeKey,
        soloCenter: !isCorner,
        soloZoneR: this.cfg.soloZoneR || 38,
        noRevive: !!this.cfg.noRevive,
        picks: [makePick(f0, 0), makePick(f1, 1)],
      };
    },
  };

  G.SoloUI = SoloUI;
})();
