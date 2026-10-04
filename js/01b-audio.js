'use strict';
// ===== Âm thanh: nhạc nền + hiệu ứng =====
// Dùng HTMLAudioElement để chạy được cả khi mở index.html trực tiếp (file://).
const SND = {
  // hiệu ứng: [file, âm lượng gốc, khoảng cách tối thiểu giữa 2 lần phát (giây)]
  sfx: {
    slash_light: ['sfx/slash_light.mp3', 0.45, 0.05],
    slash_heavy: ['sfx/slash_heavy.mp3', 0.55, 0.08],
    sword_cut:   ['sfx/sword_cut.mp3', 0.5, 0.06],
    sword_clash: ['sfx/sword_clash.mp3', 0.55, 0.08],
    armor_hit:   ['sfx/armor_hit.mp3', 0.6, 0.1],
    impact:      ['sfx/impact.mp3', 0.55, 0.05],
    flesh_hit:   ['sfx/flesh_hit.mp3', 0.5, 0.04],
    splat:       ['sfx/splat.mp3', 0.55, 0.1],
    bow_shoot:   ['sfx/bow_shoot.mp3', 0.4, 0.05],
    gun_shot:    ['sfx/gun_shot.mp3', 0.16, 0.11],
    shotgun:     ['sfx/shotgun.mp3', 0.45, 0.15],
    gun_reload:  ['sfx/gun_reload.mp3', 0.5, 0.3],
    boom_small:  ['sfx/boom_small.mp3', 0.5, 0.06],
    explosion:   ['sfx/explosion.mp3', 0.6, 0.1],
    boom_big:    ['sfx/boom_big.mp3', 0.7, 0.2],
    magic_spell: ['sfx/magic_spell.mp3', 0.45, 0.1],
    magic_burst: ['sfx/magic_burst.mp3', 0.6, 0.2],
    note_1: ['sfx/note_1.mp3', 0.5, 0.05], note_2: ['sfx/note_2.mp3', 0.5, 0.05],
    note_3: ['sfx/note_3.mp3', 0.5, 0.05], note_4: ['sfx/note_4.mp3', 0.5, 0.05],
    spin:        ['sfx/spin.mp3', 0.45, 0.15],
    robot:       ['sfx/robot.mp3', 0.6, 0.3],
    applause:    ['sfx/applause.mp3', 0.6, 1],
    boss_sting:  ['sfx/boss_sting.mp3', 0.8, 1],
    select:      ['ui/select.mp3', 0.45, 0.04],
    fight:       ['voice/fight.mp3', 0.8, 1],
    // âm thanh mới
    crow_caw:    ['sfx/crow_caw.mp3', 0.5, 1.2],
    magic_strike:['sfx/magic_strike.mp3', 0.5, 0.08],
    target_lock: ['sfx/target_lock.mp3', 0.4, 0.3],
    wind_magic:  ['sfx/wind_magic.mp3', 0.45, 0.15],
    sniper:      ['sfx/sniper.mp3', 0.5, 0.2],
    rifle_burst: ['sfx/rifle_burst.mp3', 0.28, 0.25],
    reload_big:  ['sfx/reload_big.mp3', 0.5, 0.4],
    flame:       ['sfx/flame.mp3', 0.35, 1.5],
    gatling:     ['sfx/gatling.mp3', 0.25, 1.2],
    rifle_ar:    ['sfx/rifle_ar.mp3', 0.3, 0.12],
    smg:         ['sfx/smg.mp3', 0.22, 0.1],
    gun_auto:    ['sfx/gun_auto.mp3', 0.28, 0.3],
    plasma:      ['sfx/plasma.mp3', 0.35, 0.12],
    laser:       ['sfx/laser.mp3', 0.4, 0.2],
    energy_charge:  ['sfx/energy_charge.mp3', 0.45, 0.6],
    energy_charge2: ['sfx/energy_charge2.mp3', 0.45, 0.4],
  },
  // nhạc nền theo danh sách phát: hết bài thì tự chuyển bài khác cùng nhóm (đỡ nhàm)
  music: {
    menu:   ['music/menu_fantasy_quest.mp3', 'music/menu_celestial_kingdom.mp3', 'music/menu_fantasy_paulyudin.mp3'],
    hub:    ['music/hub_gaming.mp3', 'music/hub_wonderland_melody.mp3', 'music/hub_sitar_bottles.mp3'],
    tour:   ['music/tour_heroic_orchestra.mp3', 'music/tour_imperial_march.mp3', 'music/tour_cinematic_flair.mp3', 'music/tour_last_beacon.mp3'],
    // nhạc trận chung kết / trùm
    boss:   ['music/tour_boss_fight.mp3', 'music/tour_epic_trailer.mp3', 'music/tour_deception_epic.mp3', 'music/tour_epic_battle.mp3', 'music/tour_heroic_orchestra.mp3'],
    battle: ['music/battle_epic.mp3', 'music/battle_kingdom.mp3', 'music/battle_alexgrohl.mp3', 'music/battle_warrior_drums.mp3', 'music/battle_drums.mp3',
      'music/battle_wellerman_shanty.mp3', 'music/battle_jonasblakewood.mp3', 'music/battle_nastelbom.mp3', 'music/battle_paulyudin.mp3',
      'music/battle_stereo_drum.mp3', 'music/battle_mountain_beat.mp3', 'music/battle_mountain_drop.mp3'],
  },
};

const Sound = {
  base: 'sound/',
  pools: {}, last: {},
  active() { let n = 0; for (const k in this.pools) for (const a of this.pools[k]) if (!a.paused && !a.ended) n++; return n; },
  cfg: { music: 0.45, sfx: 0.8, muteMusic: false, muteSfx: false },
  cur: null, curKey: null, unlocked: false, wantKey: null,
  init() {
    try { Object.assign(this.cfg, JSON.parse(localStorage.getItem('ai_battle_audio')) || {}); } catch (e) {}
    // trình duyệt chỉ cho phát âm thanh sau thao tác đầu tiên của người chơi
    const unlock = () => { this.unlocked = true; if (this.wantKey) this.music(this.wantKey, true); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    // tiếng bấm nút cho mọi nút trong giao diện
    document.addEventListener('click', (e) => {
      if (e.target.closest('button, .wcard, .tal.pick, .node, .tac')) this.play('select');
    }, true);
  },
  saveCfg() { try { localStorage.setItem('ai_battle_audio', JSON.stringify(this.cfg)); } catch (e) {} },
  // phát 1 hiệu ứng (o.vol hệ số âm lượng, o.rate tốc độ phát)
  play(name, o = {}) {
    if (this.cfg.muteSfx || !this.unlocked) return;
    const d = SND.sfx[name]; if (!d) return;
    const now = performance.now() / 1000;
    if (now - (this.last[name] || 0) < d[2]) return;
    if (this.active() > 10) return;
    this.last[name] = now;
    const pool = this.pools[name] || (this.pools[name] = []);
    let a = pool.find((x) => x.paused || x.ended);
    if (!a) {
      if (pool.length >= 5) return;
      a = new Audio(this.base + d[0]); a.preload = 'auto';
      pool.push(a);
    }
    a.volume = clamp(d[1] * (o.vol ?? 1) * this.cfg.sfx, 0, 1);
    a.playbackRate = o.rate || (o.vary === false ? 1 : rand(0.92, 1.08));
    a.preservesPitch = false;
    try { a.currentTime = 0; } catch (e) {}
    a.play().catch(() => {});
  },
  // đổi nhạc nền (mờ dần sang bài mới)
  music(key, force) {
    if (key && key.startsWith('series:')) { if (force) this.curKey = null; return this.seriesMusic(key.slice(7)); }
    this.wantKey = key;
    if (!this.unlocked) return;
    if (!force && key === this.curKey && this.cur && !this.cur.paused) return;
    const old = this.cur;
    if (old) this.fade(old, 0, 600, () => old.pause());
    this.curKey = key; this.cur = null;
    if (!key || this.cfg.muteMusic) return;
    this.playTrack(key);
  },
  // phát 1 bài ngẫu nhiên trong nhóm (tránh lặp lại bài vừa nghe); hết bài thì chuyển bài khác
  playTrack(key) {
    const list = SND.music[key]; if (!list) return;
    const last = (this.lastTrack || {})[key];
    const pool = list.length > 1 ? list.filter((s) => s !== last) : list;
    const src = pick(pool);
    (this.lastTrack || (this.lastTrack = {}))[key] = src;
    const a = new Audio(this.base + src);
    a.loop = list.length === 1; a.volume = 0;
    a.addEventListener('ended', () => { if (this.cur === a && this.curKey === key) this.playTrack(key); });
    a.play().catch(() => {});
    this.cur = a;
    this.fade(a, this.cfg.music, 900);
  },
  battleMusic(boss) { this.music(boss ? 'boss' : 'battle'); },
  // nhạc trận theo LOẠT ĐẤU: chọn 1 bài khi bắt đầu Bo3/Bo5 và lặp lại bài đó tới hết loạt (không đổi giữa các ván)
  pickSeriesTrack(boss) {
    const list = SND.music[boss ? 'boss' : 'battle'], last = (this.lastTrack || {}).series;
    const src = pick(list.length > 1 ? list.filter((s) => s !== last) : list);
    (this.lastTrack || (this.lastTrack = {})).series = src;
    return src;
  },
  seriesMusic(src) {
    const key = 'series:' + src;
    this.wantKey = key;
    if (!this.unlocked || this.cfg.muteMusic) return;
    if (this.curKey === key && this.cur && !this.cur.paused) return;
    const old = this.cur;
    if (old) this.fade(old, 0, 600, () => old.pause());
    const a = new Audio(this.base + src);
    a.loop = true; a.volume = 0;
    a.play().catch(() => {});
    this.cur = a; this.curKey = key;
    this.fade(a, this.cfg.music, 900);
  },
  fade(a, to, ms, done) {
    const from = a.volume, t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = clamp(from + (to - from) * k, 0, 1);
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    };
    step();
  },
  toggleMusic() {
    this.cfg.muteMusic = !this.cfg.muteMusic; this.saveCfg();
    if (this.cfg.muteMusic) { if (this.cur) this.cur.pause(); this.cur = null; } else this.music(this.wantKey, true);
  },
  toggleSfx() { this.cfg.muteSfx = !this.cfg.muteSfx; this.saveCfg(); },
};
