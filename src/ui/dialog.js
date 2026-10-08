'use strict';
// ===== HỘP THOẠI TRONG GAME (thay alert/confirm/prompt của trình duyệt) =====
// Lý do: trong khung xem thử (trang nhúng) và một số ứng dụng điện thoại, alert/confirm/prompt bị chặn hoặc không hiện.
//   G.Dlg.alert(text)                       → Promise
//   G.Dlg.confirm(text, okLabel, noLabel)   → Promise<boolean>
//   G.Dlg.choose(text, [{label, value}])    → Promise<value | null>   (null = bỏ qua)
// Hộp thoại nằm trên mọi màn hình (kể cả HUD trong trận), đóng bằng nút hoặc phím Esc (= bỏ qua).
(function () {
  const G = globalThis.G || (globalThis.G = {});
  const esc = (s) => (G.esc ? G.esc(s) : String(s));
  let box = null, done = null;
  function ensure() {
    if (box) return box;
    box = document.createElement('div');
    box.id = 'dlg'; box.className = 'dlg hidden';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    document.body.appendChild(box);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (b) finish(+b.dataset.i);
    });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && done) { e.preventDefault(); finish(-1); } });
    return box;
  }
  let opts = null;
  function finish(i) {
    const f = done, o = opts; done = null; opts = null;
    box.classList.add('hidden'); box.innerHTML = '';
    if (f) f(i >= 0 && o ? o.buttons[i].value : o ? o.cancel : null);
  }
  // o: { text (html đã thoát), buttons: [{label, value, cls}], cancel: giá trị khi bỏ qua }
  function show(o) {
    ensure();
    if (done) finish(-1);
    opts = o;
    box.innerHTML = `<div class="dlgin"><div class="dlgtx">${o.text}</div><div class="dlgbt">${o.buttons.map((b, i) => `<button data-i="${i}" class="${b.cls || ''}">${esc(b.label)}</button>`).join('')}</div></div>`;
    box.classList.remove('hidden');
    const first = box.querySelector('button.big') || box.querySelector('button');
    if (first) try { first.focus(); } catch (e) { /* bỏ qua */ }
    return new Promise((res) => { done = res; });
  }
  G.Dlg = {
    show,
    alert(text) { return show({ text: esc(text), buttons: [{ label: 'OK', value: true, cls: 'big' }], cancel: true }); },
    confirm(text, ok, no) { return show({ text: esc(text), buttons: [{ label: ok || 'Đồng ý', value: true, cls: 'big' }, { label: no || 'Thôi', value: false }], cancel: false }); },
    choose(text, list) { return show({ text: esc(text), buttons: list.map((x, i) => ({ label: x.label, value: x.value, cls: i === 0 ? 'big' : x.cls })).concat([{ label: 'Thôi', value: null }]), cancel: null }); },
  };
})();
