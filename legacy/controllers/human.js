"use strict";
const INPUT_BUTTONS = ["A", "B", "C", "D", "U", "E"];
function cleanInput(value) {
  if (
    !value ||
    typeof value !== "object" ||
    !Number.isSafeInteger(value.seq) ||
    value.seq < 0 ||
    value.seq > 2147483647
  )
    return null;
  if (
    ![value.x, value.y, value.aim].every(Number.isFinite) ||
    Math.abs(value.x) > 1 ||
    Math.abs(value.y) > 1 ||
    Math.abs(value.aim) > TAU * 2
  )
    return null;
  for (const field of ["pressed", "held", "released"])
    if (
      !Array.isArray(value[field]) ||
      value[field].length > INPUT_BUTTONS.length ||
      value[field].some((k) => !INPUT_BUTTONS.includes(k)) ||
      new Set(value[field]).size !== value[field].length
    )
      return null;
  if (
    value.targetId != null &&
    (!Number.isSafeInteger(value.targetId) || value.targetId < 1)
  )
    return null;
  if (value.cancelled != null && typeof value.cancelled !== "boolean")
    return null;
  return {
    seq: value.seq,
    x: value.x,
    y: value.y,
    aim: value.aim,
    pressed: [...value.pressed],
    held: [...value.held],
    released: [...value.released],
    targetId: value.targetId ?? null,
    cancelled: value.cancelled === true,
  };
}
function neutralInput(seq = 0, aim = 0) {
  return {
    seq,
    x: 0,
    y: 0,
    aim,
    pressed: [],
    held: [],
    released: [],
    targetId: null,
    cancelled: false,
  };
}
function humanInputMode(f, key) {
  const skill = f.weapon.skills[key];
  const weapon = f.form?.startsWith("luca_copy_")
    ? ROSTER_BY_ID[f.ws.copyId]?.weapon
    : f.form || f.weaponId;
  if (skill?.hold && key === "B") return "charge";
  if ((skill?.hold && key === "C") || (weapon === "con" && key === "C"))
    return "channel";
  if (
    (["hand", "mech"].includes(weapon) && ["A", "D"].includes(key)) ||
    (weapon === "song_kiem" && key === "C") ||
    (weapon === "luc_xoay" && key === "B")
  )
    return "variant";
  return "regular";
}
function endHumanChannel(f) {
  if (f.channelAction && f.channelAction === f.action) {
    if (f.ws.pole) f.ws.pole.hold = Math.max(0.01, f.ws.pole.t);
    else f.action.t = f.action.dur;
  }
  f.channelKey = null;
  f.channelAction = null;
}
function stopHumanInput(f) {
  endHumanChannel(f);
  f.cancelledCharge ||= {};
  for (const key of Object.keys(f.holdSince || {}))
    f.cancelledCharge[key] = true;
  f.holdSince = {};
  f.charging = null;
  f.basicHeldActive = false;
  f.moveDir = { x: 0, y: 0 };
}
function applyHumanInput(f, input, match, fresh) {
  if (input?.cancelled) {
    stopHumanInput(f);
    return;
  }
  if (!input || !f.alive || match.state !== "fight") {
    f.moveDir = { x: 0, y: 0 };
    return;
  }
  const length = Math.max(1, Math.hypot(input.x, input.y));
  f.moveDir = { x: input.x / length, y: input.y / length };
  f.castAngle = input.aim;
  if (!f.action || !f.action.lock) f.facing = input.aim;
  f.controlTarget = input.targetId;
  f.holdSince ||= {};
  f.cancelledCharge ||= {};
  for (const key of INPUT_BUTTONS) {
    if (input.held.includes(key) && f.holdSince[key] == null) {
      f.holdSince[key] = match.time;
      delete f.cancelledCharge[key];
    }
    if (input.held.includes(key) && humanInputMode(f, key) === "charge") {
      f.charging = {
        key,
        elapsed: Math.min(
          f.weapon.skills[key].hold,
          match.time - f.holdSince[key],
        ),
      };
      if (!f.canAct()) f.cancelledCharge[key] = true;
      f.moveDir.x *= 0.35;
      f.moveDir.y *= 0.35;
    }
  }
  const buttons = fresh ? input.pressed : [];
  for (const key of buttons) {
    if (!f.weapon.skills[key]) continue;
    const mode = humanInputMode(f, key);
    if (["charge", "variant"].includes(mode)) continue;
    f.manualHold = mode === "channel" ? f.weapon.skills[key].hold || 3 : 0.05;
    f.intent = { hold: false };
    const used = f.tryUse(key, match);
    if (mode === "channel" && used) {
      f.channelKey = key;
      f.channelAction = f.action;
    }
    if (key === "A") f.basicHeldActive = true;
  }
  const releases = fresh
    ? [
        ...new Set([
          ...input.released,
          ...input.pressed.filter((key) => !input.held.includes(key)),
        ]),
      ]
    : [];
  for (const key of releases) {
    const mode = humanInputMode(f, key),
      duration = Math.min(
        f.weapon.skills[key]?.hold || 3,
        Math.max(0.05, match.time - (f.holdSince[key] ?? match.time)),
      );
    if (["charge", "variant"].includes(mode) && !f.cancelledCharge[key]) {
      f.manualHold = duration;
      f.intent = { hold: duration >= 0.25 };
      if (f.tryUse(key, match) && mode === "charge" && f.action?.charge) {
        const charge = f.action.charge;
        f.action.events = f.action.events.map(([t, fn]) => [
          Math.max(0, t - charge),
          fn,
        ]);
        f.action.dur = Math.max(0.1, f.action.dur - charge);
        f.action.charge = 0;
      }
    }
    if (f.channelKey === key) {
      endHumanChannel(f);
    }
    if (key === "A") f.basicHeldActive = false;
    delete f.holdSince[key];
    delete f.cancelledCharge[key];
    if (f.charging?.key === key) f.charging = null;
  }
  // Holding the basic attack is an explicit player command, never a tactical AI decision.
  if (
    input.held.includes("A") &&
    f.basicHeldActive &&
    !buttons.includes("A") &&
    humanInputMode(f, "A") === "regular"
  ) {
    f.intent = { hold: false };
    f.tryUse("A", match);
  }
}
