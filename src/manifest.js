'use strict';
// ===== Danh sách tệp theo thứ tự nạp — dùng chung cho trình duyệt (index.html) và Node (tools/nap.js) =====
// LOGIC: core + data + sim (chạy được không cần DOM). GIAO DIỆN: ui (chỉ trình duyệt).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  G.FILES_LOGIC = [
    'core/util.js',
    'core/rng.js',
    'core/grid.js',
    'sim/consts.js',
    'sim/map.js',
    'sim/nav.js',
    'sim/unit.js',
    'sim/combat.js',
    'sim/neutral.js',
    'sim/bosses.js',
    'sim/arena.js',
    'data/shards.js',
    'sim/extras.js',
    'sim/house.js',
    'data/consumables.js',
    'sim/bag.js',
    'sim/props.js',
    'sim/items.js',
    'sim/talents.js',
    'sim/decoy.js',
    'data/items.js',
    'data/builds.js',
    'data/personality.js',
    'data/bookie.js',
    'data/odds.js',
    'sim/match.js',
    'sim/lineup.js',
    'sim/bookie.js',
    'data/heroes/common.js',
    'data/heroes/valerius.js',
    'data/heroes/gideon.js',
    'data/heroes/koda.js',
    'data/heroes/clint.js',
    'data/heroes/ignatius.js',
    'data/heroes/ryoma.js',
    'data/heroes/elara.js',
    'data/heroes/zero.js',
    'data/heroes/aria.js',
    'data/heroes/death.js',
    'data/heroes/borg.js',
    'data/heroes/florian.js',
    'data/heroes/kazuki.js',
    'data/heroes/theron.js',
    'data/heroes/wukong.js',
    'data/heroes/vesper.js',
    'data/heroes/galo.js',
    'data/heroes/alice.js',
    'data/heroes/thanhphong.js',
    'data/heroes/roxie.js',
    'data/heroes/joker.js',
    'data/heroes/percy.js',
    'data/heroes/chrononeo.js',
    'data/heroes/jack.js',
    'data/heroes/victoria.js',
    'data/heroes/raven.js',
    'data/heroes/lyra.js',
    'data/curves.js',
    'sim/ai/utility.js',
    'sim/ai/skill_ai.js',
    'sim/ai/persona.js',
    'sim/ai/hero_ai.js',
  ];
  G.FILES_UI = [
    'ui/dialog.js',
    'ui/audio.js',
    'ui/draw_hero.js',
    'ui/map_art.js',
    'ui/vfx.js',
    'ui/render.js',
    'ui/hud.js',
    'ui/bet_ui.js',
    'ui/solo_ui.js',
    'ui/app.js',
  ];
  // Trình duyệt: chèn thẻ script theo đúng thứ tự (async=false giữ thứ tự thực thi)
  if (typeof document !== 'undefined' && document.currentScript) {
    const base = document.currentScript.src.replace(/manifest\.js.*$/, '');
    const v = document.currentScript.getAttribute('data-v') || '';
    for (const f of G.FILES_LOGIC.concat(G.FILES_UI)) {
      const s = document.createElement('script');
      s.src = base + f + (v ? '?v=' + v : '');
      s.async = false;
      document.head.appendChild(s);
    }
  }
})();
