import { aimTarget, targetAtPoint } from "./aiming.mjs";

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
  constructor(canvas, aimFromPoint, getAimContext = () => null) {
    this.canvas = canvas;
    this.aimFromPoint = aimFromPoint;
    this.getAimContext = getAimContext;
    this.seq = 0;
    this.keys = new Set();
    this.held = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.aim = 0;
    this.targetId = null;
    this.stick = { x: 0, y: 0 };
    this.enabled = false;
    this.touchMode = matchMedia("(pointer: coarse)").matches;
    this.targetAssist = true;
    this.gesture = null;
    this.manualAim = false;
    this.manualUntil = 0;
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
      if (this.enabled && e.pointerType !== "touch") {
        this.touchMode = false;
        this.point(e);
      }
    });
    canvas.addEventListener("pointerdown", (e) => {
      if (!this.enabled) return;
      if (e.pointerType === "touch") {
        this.touchMode = true;
        const context = this.getAimContext();
        const target = context && targetAtPoint(context, e.clientX, e.clientY);
        if (target) {
          this.targetId = target.id;
          this.targetAssist = true;
          this.manualAim = false;
          this.updateAim();
        } else {
          this.targetAssist = false;
          this.point(e);
        }
        return;
      }
      this.touchMode = false;
      this.point(e);
      this.down(e.button === 2 ? "C" : "A");
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointerup", (e) => {
      if (e.pointerType !== "touch") this.up(e.button === 2 ? "C" : "A");
    });
    canvas.addEventListener("pointercancel", () => this.clear());
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    this.bindStick();
  }
  point(e) {
    this.aim = this.aimFromPoint(e.clientX, e.clientY);
  }
  updateAim() {
    if (!this.enabled || !this.touchMode) return;
    const context = this.getAimContext(),
      own = context?.match?.lead(context.team);
    if (!own) return;
    if (
      this.gesture?.manual ||
      (this.manualAim && (performance.now() < this.manualUntil || own.action))
    )
      return;
    this.manualAim = false;
    if (!this.targetAssist) {
      this.targetId = null;
      return;
    }
    const target = aimTarget(context.match, context.team, this.targetId);
    this.targetId = target?.id ?? null;
    if (target) this.aim = Math.atan2(target.y - own.y, target.x - own.x);
  }
  toggleTarget() {
    this.touchMode = true;
    this.targetAssist = this.manualAim ? true : !this.targetAssist;
    this.manualAim = false;
    this.targetId = null;
    this.updateAim();
  }
  down(key) {
    if (this.enabled) {
      this.held.add(key);
      this.pressed.add(key);
    }
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
    this.resetStick?.();
    this.manualAim = false;
    if (this.gesture) {
      this.gesture.button.classList.remove("charging");
      this.gesture.button.style.opacity = "";
      this.gesture = null;
    }
    const cancel = document.querySelector("#cancel-skill");
    if (cancel) cancel.style.display = "none";
    const knob = document.querySelector("#stick i");
    if (knob) knob.style.transform = "";
  }
  frame() {
    this.updateAim();
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
      targetId:
        this.touchMode && this.targetAssist && !this.manualAim
          ? this.targetId
          : null,
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
      button.addEventListener("pointerdown", (e) => {
        if (!this.enabled || this.gesture) return;
        e.preventDefault();
        const touch = e.pointerType === "touch";
        this.touchMode = touch;
        this.manualAim = false;
        this.updateAim();
        this.gesture = {
          key,
          button,
          pointerId: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          touch,
          manual: false,
          cancelled: false,
        };
        button.setPointerCapture(e.pointerId);
        button.classList.add("charging");
        if (touch)
          document.querySelector("#cancel-skill").style.display = "block";
        if (!touch || button.dataset.control === "channel") this.down(key);
        else this.held.add(key);
      });
      button.addEventListener("pointermove", (e) => {
        const gesture = this.gesture;
        if (!gesture || gesture.pointerId !== e.pointerId) return;
        const dx = e.clientX - gesture.x,
          dy = e.clientY - gesture.y;
        if (Math.hypot(dx, dy) > 16) {
          gesture.manual = this.manualAim = true;
          this.aim = Math.atan2(dy, dx);
        }
        const rect = document
          .querySelector("#cancel-skill")
          .getBoundingClientRect();
        gesture.cancelled =
          gesture.touch &&
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        button.style.opacity = gesture.cancelled ? ".35" : "";
      });
      const release = (e, cancelled = false) => {
        const gesture = this.gesture;
        if (!gesture || gesture.pointerId !== e.pointerId) return;
        cancelled ||= gesture.cancelled || !this.enabled;
        if (gesture.touch && !cancelled) this.down(key);
        if (cancelled) {
          this.pressed.delete(key);
          this.cancelled = true;
        }
        this.up(key);
        this.manualUntil = performance.now() + 300;
        this.gesture = null;
        button.classList.remove("charging");
        button.style.opacity = "";
        document.querySelector("#cancel-skill").style.display = "none";
      };
      button.addEventListener("pointerup", (e) => release(e));
      button.addEventListener("pointercancel", (e) => release(e, true));
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
    this.resetStick = end;
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
  }
}
