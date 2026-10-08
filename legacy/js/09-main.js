'use strict';
// ===== Khởi động & vòng lặp =====
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
// điện thoại: tắt bóng đổ (shadowBlur rất tốn GPU) — các lệnh gán shadowBlur sẽ bị bỏ qua
if (IS_MOBILE) Object.defineProperty(ctx, 'shadowBlur', { get: () => 0, set: () => {} });
let VW = 0, VH = 0;
function resize() {
  const dpr = Math.min(IS_MOBILE ? 1.5 : 2, window.devicePixelRatio || 1);
  VW = window.innerWidth; VH = window.innerHeight;
  cv.width = Math.floor(VW * dpr); cv.height = Math.floor(VH * dpr);
  cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (G.match) MatchUI.refresh();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
resize();
// toàn màn hình + khóa màn ngang (Android); iPhone không hỗ trợ khóa nên chỉ toàn màn hình nếu được
function goFullscreen() {
  const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) { UI.toast('Trình duyệt không hỗ trợ toàn màn hình — hãy xoay ngang điện thoại'); return; }
  if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
  Promise.resolve(req.call(el)).then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {});
}

function startDemo() {
  if (G.demo || G.match) return;
  const a = genOpponent(5);
  let b = genOpponent(5);
  while (isFamilyPair(a.weapon, b.weapon) || a.charId === b.charId) b = genOpponent(5);
  G.demo = new Match({ arena: pick(Object.keys(ARENA_DEFS)), stocks: 2, timeLimit: 90, noHud: true, mods: offerMods(2),
    a: { cfg: a, tactic: pick(tacticPool(a.charId)), commands: aiCommands(a.charId), aiCoach: true }, b: { cfg: b, tactic: pick(tacticPool(b.charId)) },
    onEnd: () => { G.demo = null; startDemo(); } });
  G.demo.state = 'fight';
}
function stopDemo() { G.demo = null; }

let last = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000);
  last = ts;
  if (G.match) {
    if (!G.paused) for (let i = 0; i < G.speed; i++) { if (!G.match) break; G.match.update(dt); }
    if (G.match) { G.match.draw(ctx, VW, VH); MatchUI.tick(); }
  } else if (G.demo) {
    // điện thoại: trận nền ở menu chạy 30 khung/giây cho đỡ hao pin
    if (IS_MOBILE && (G.demoSkip = !G.demoSkip)) { requestAnimationFrame(frame); return; }
    G.demo.update(dt);
    if (IS_MOBILE && G.demo) G.demo.update(dt);
    if (G.demo) G.demo.draw(ctx, VW, VH);
    ctx.fillStyle = 'rgba(5,8,15,0.55)'; ctx.fillRect(0, 0, VW, VH);
  } else { ctx.fillStyle = '#0b1018'; ctx.fillRect(0, 0, VW, VH); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener('keydown', (e) => {
  if (!G.match) return;
  if (/^[1-9]$/.test(e.key)) { const id = G.match.cmds[0][+e.key - 1]; if (id) G.match.command(0, id); }
  if (e.key === '0') { const id = G.match.cmds[0][9]; if (id) G.match.command(0, id); }
  if (e.key === ' ') { G.paused = !G.paused; MatchUI.refresh(); e.preventDefault(); }
});

function audioBtns() {
  document.getElementById('btn-music').classList.toggle('off', Sound.cfg.muteMusic);
  document.getElementById('btn-sfx').classList.toggle('off', Sound.cfg.muteSfx);
}
if (IS_MOBILE) document.body.classList.add('mobile');
Sound.init();
audioBtns();
UI.menu();
