const KEY = {
  KeyQ: "A",
  KeyE: "B",
  KeyR: "C",
  KeyF: "D",
  Space: "U",
  ShiftLeft: "E",
  ShiftRight: "E",
};
export class PlayerInput {
  constructor(canvas, aimFromPoint) {
    this.canvas = canvas;
    this.aimFromPoint = aimFromPoint;
    this.seq = 0;
    this.keys = new Set();
    this.held = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.aim = 0;
    this.stick = { x: 0, y: 0 };
    this.enabled = false;
    window.addEventListener("keydown", (e) => {
      if (!this.enabled || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))
        return;
      if (
        ["KeyW", "KeyA", "KeyS", "KeyD", ...Object.keys(KEY)].includes(e.code)
      )
        e.preventDefault();
      this.keys.add(e.code);
      if (KEY[e.code] && !e.repeat) this.down(KEY[e.code]);
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
      if (KEY[e.code]) this.up(KEY[e.code]);
    });
    window.addEventListener("blur", () => this.clear());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.clear();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (this.enabled && e.pointerType !== "touch") this.point(e);
    });
    canvas.addEventListener("pointerdown", (e) => {
      if (this.enabled) {
        this.point(e);
        this.down(e.button === 2 ? "C" : "A");
        canvas.setPointerCapture(e.pointerId);
      }
    });
    canvas.addEventListener("pointerup", (e) =>
      this.up(e.button === 2 ? "C" : "A"),
    );
    canvas.addEventListener("pointercancel", () => this.clear());
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    this.bindStick();
  }
  point(e) {
    this.aim = this.aimFromPoint(e.clientX, e.clientY);
  }
  down(key) {
    if (!this.enabled) return;
    this.held.add(key);
    this.pressed.add(key);
  }
  up(key) {
    this.held.delete(key);
    this.released.add(key);
  }
  clear() {
    this.cancelled = true;
    this.keys.clear();
    this.held.clear();
    this.pressed.clear();
    this.released.clear();
    this.stick = { x: 0, y: 0 };
  }
  frame() {
    const x =
      Number(this.keys.has("KeyD")) -
      Number(this.keys.has("KeyA")) +
      this.stick.x;
    const y =
      Number(this.keys.has("KeyS")) -
      Number(this.keys.has("KeyW")) +
      this.stick.y;
    const length = Math.max(1, Math.hypot(x, y));
    const result = {
      seq: this.seq++,
      x: x / length,
      y: y / length,
      aim: this.aim,
      pressed: [...this.pressed],
      held: [...this.held],
      released: [...this.released],
      targetId: null,
      cancelled: this.cancelled === true,
    };
    this.cancelled = false;
    this.pressed.clear();
    this.released.clear();
    return result;
  }
  bindSkills(bar) {
    for (const button of bar.querySelectorAll("[data-skill]")) {
      const key = button.dataset.skill;
      let origin = null,
        cancelled = false;
      button.addEventListener("pointerdown", (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        origin = { x: e.clientX, y: e.clientY };
        cancelled = false;
        button.setPointerCapture(e.pointerId);
        button.classList.add("charging");
        if (e.pointerType === "touch")
          document.querySelector("#cancel-skill").style.display = "block";
        if (e.pointerType !== "touch" || button.dataset.control === "channel")
          this.down(key);
        else this.held.add(key);
      });
      button.addEventListener("pointermove", (e) => {
        if (!origin) return;
        const dx = e.clientX - origin.x,
          dy = e.clientY - origin.y;
        if (Math.hypot(dx, dy) > 16) this.aim = Math.atan2(dy, dx);
        const rect = document
          .querySelector("#cancel-skill")
          .getBoundingClientRect();
        cancelled =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        button.style.opacity = cancelled ? ".35" : "";
      });
      const release = (e) => {
        if (!origin) return;
        if (e.pointerType === "touch" && !cancelled) this.down(key);
        if (cancelled) {
          this.pressed.delete(key);
          this.cancelled = true;
        }
        this.up(key);
        origin = null;
        button.classList.remove("charging");
        button.style.opacity = "";
        document.querySelector("#cancel-skill").style.display = "none";
      };
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", (e) => {
        cancelled = true;
        release(e);
      });
    }
  }
  bindStick() {
    const element = document.querySelector("#stick"),
      knob = element.querySelector("i");
    let active = null;
    const move = (e) => {
      if (active !== e.pointerId) return;
      const rect = element.getBoundingClientRect(),
        dx = e.clientX - rect.left - rect.width / 2,
        dy = e.clientY - rect.top - rect.height / 2;
      const length = Math.max(rect.width * 0.35, Math.hypot(dx, dy));
      this.stick = { x: dx / length, y: dy / length };
      knob.style.transform = `translate(${this.stick.x * 30}px,${this.stick.y * 30}px)`;
    };
    element.addEventListener("pointerdown", (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      active = e.pointerId;
      element.setPointerCapture(active);
      move(e);
    });
    element.addEventListener("pointermove", move);
    const end = () => {
      active = null;
      this.stick = { x: 0, y: 0 };
      knob.style.transform = "";
    };
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
  }
}
