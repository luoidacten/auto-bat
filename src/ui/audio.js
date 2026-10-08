'use strict';
// ===== Âm thanh: nhạc nền + hiệu ứng (giữ nguyên bộ âm thanh của bản cũ) =====
// Dùng HTMLAudioElement để chạy được cả khi mở index.html trực tiếp (file://).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const SND = {
    sfx: {
      slash_light: ['sfx/slash_light.mp3', 0.35, 0.08], slash_heavy: ['sfx/slash_heavy.mp3', 0.5, 0.1],
      sword_cut: ['sfx/sword_cut.mp3', 0.45, 0.08], sword_clash: ['sfx/sword_clash.mp3', 0.5, 0.1],
      armor_hit: ['sfx/armor_hit.mp3', 0.5, 0.15], impact: ['sfx/impact.mp3', 0.5, 0.08], flesh_hit: ['sfx/flesh_hit.mp3', 0.4, 0.08],
      splat: ['sfx/splat.mp3', 0.5, 0.15], bow_shoot: ['sfx/bow_shoot.mp3', 0.3, 0.1], gun_shot: ['sfx/gun_shot.mp3', 0.14, 0.12],
      shotgun: ['sfx/shotgun.mp3', 0.35, 0.18], gun_reload: ['sfx/gun_reload.mp3', 0.4, 0.4], boom_small: ['sfx/boom_small.mp3', 0.4, 0.1],
      explosion: ['sfx/explosion.mp3', 0.5, 0.15], boom_big: ['sfx/boom_big.mp3', 0.65, 0.3], magic_spell: ['sfx/magic_spell.mp3', 0.4, 0.12],
      magic_burst: ['sfx/magic_burst.mp3', 0.55, 0.3], spin: ['sfx/spin.mp3', 0.4, 0.2], robot: ['sfx/robot.mp3', 0.5, 0.4],
      applause: ['sfx/applause.mp3', 0.6, 1], boss_sting: ['sfx/boss_sting.mp3', 0.7, 1], select: ['ui/select.mp3', 0.4, 0.04],
      fight: ['voice/fight.mp3', 0.75, 1], crow_caw: ['sfx/crow_caw.mp3', 0.45, 1.2], magic_strike: ['sfx/magic_strike.mp3', 0.45, 0.1],
      target_lock: ['sfx/target_lock.mp3', 0.35, 0.4], wind_magic: ['sfx/wind_magic.mp3', 0.4, 0.2], sniper: ['sfx/sniper.mp3', 0.45, 0.25],
      flame: ['sfx/flame.mp3', 0.3, 1.5], laser: ['sfx/laser.mp3', 0.35, 0.25], energy_charge: ['sfx/energy_charge.mp3', 0.4, 0.6],
      note_1: ['sfx/note_1.mp3', 0.4, 0.08], note_2: ['sfx/note_2.mp3', 0.4, 0.08], note_3: ['sfx/note_3.mp3', 0.4, 0.08], note_4: ['sfx/note_4.mp3', 0.4, 0.08],
    },
    music: {
      menu: ['music/menu_fantasy_quest.mp3', 'music/menu_celestial_kingdom.mp3', 'music/menu_fantasy_paulyudin.mp3'],
      hub: ['music/hub_gaming.mp3', 'music/hub_wonderland_melody.mp3', 'music/hub_sitar_bottles.mp3'],
      battle: ['music/battle_epic.mp3', 'music/battle_kingdom.mp3', 'music/battle_alexgrohl.mp3', 'music/battle_warrior_drums.mp3', 'music/battle_drums.mp3',
        'music/battle_wellerman_shanty.mp3', 'music/battle_jonasblakewood.mp3', 'music/battle_nastelbom.mp3', 'music/battle_paulyudin.mp3',
        'music/battle_stereo_drum.mp3', 'music/battle_mountain_beat.mp3', 'music/battle_mountain_drop.mp3'],
      tour: ['music/tour_heroic_orchestra.mp3', 'music/tour_imperial_march.mp3', 'music/tour_cinematic_flair.mp3', 'music/tour_last_beacon.mp3'],
    },
  };
  const KEY = 'dthlv_moba_v1_audio';
  const Sound = {
    base: 'sound/', pools: {}, last: {}, cur: null, curKey: null, unlocked: false, wantKey: null, lastTrack: {},
    cfg: { music: 0.4, sfx: 0.75, muteMusic: false, muteSfx: false },
    init() {
      try { Object.assign(this.cfg, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* bỏ qua */ }
      const unlock = () => { this.unlocked = true; if (this.wantKey) this.music(this.wantKey, true); };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
      document.addEventListener('click', (e) => { if (e.target.closest('button')) this.play('select'); }, true);
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.cfg)); } catch (e) { /* bỏ qua */ } },
    active() { let n = 0; for (const k in this.pools) for (const a of this.pools[k]) if (!a.paused && !a.ended) n++; return n; },
    play(name, o) {
      o = o || {};
      if (this.cfg.muteSfx || !this.unlocked) return;
      const d = SND.sfx[name]; if (!d) return;
      const now = performance.now() / 1000;
      if (now - (this.last[name] || 0) < d[2]) return;
      if (this.active() > 8) return;
      this.last[name] = now;
      const pool = this.pools[name] || (this.pools[name] = []);
      let a = pool.find((x) => x.paused || x.ended);
      if (!a) { if (pool.length >= 4) return; a = new Audio(this.base + d[0]); a.preload = 'auto'; pool.push(a); }
      a.volume = Math.max(0, Math.min(1, d[1] * (o.vol == null ? 1 : o.vol) * this.cfg.sfx));
      a.playbackRate = o.rate || 0.94 + Math.random() * 0.12;
      a.preservesPitch = false;
      try { a.currentTime = 0; } catch (e) { /* bỏ qua */ }
      a.play().catch(() => {});
    },
    music(key, force) {
      this.wantKey = key;
      if (!this.unlocked) return;
      if (!force && key === this.curKey && this.cur && !this.cur.paused) return;
      const old = this.cur;
      if (old) this.fade(old, 0, 600, () => old.pause());
      this.curKey = key; this.cur = null;
      if (!key || this.cfg.muteMusic) return;
      this.playTrack(key);
    },
    playTrack(key) {
      let list = SND.music[key]; if (!list) return;
      if (G.MUSIC_ONLY) { list = list.filter((f) => G.MUSIC_ONLY.includes(f)); if (!list.length) return; }   // bản chơi thử chỉ mang theo vài bài
      const last = this.lastTrack[key];
      const pool = list.length > 1 ? list.filter((s) => s !== last) : list;
      const src = pool[Math.floor(Math.random() * pool.length)];
      this.lastTrack[key] = src;
      const a = new Audio(this.base + src);
      a.loop = list.length === 1; a.volume = 0;
      a.addEventListener('ended', () => { if (this.cur === a && this.curKey === key) this.playTrack(key); });
      a.play().catch(() => {});
      this.cur = a; this.fade(a, this.cfg.music, 900);
    },
    fade(a, to, ms, done) {
      const from = a.volume, t0 = performance.now();
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
        if (k < 1) requestAnimationFrame(step); else if (done) done();
      };
      step();
    },
    toggleMusic() { this.cfg.muteMusic = !this.cfg.muteMusic; this.save(); if (this.cfg.muteMusic) { if (this.cur) this.cur.pause(); this.cur = null; } else this.music(this.wantKey, true); },
    toggleSfx() { this.cfg.muteSfx = !this.cfg.muteSfx; this.save(); },
  };
  G.Sound = Sound;
})();
