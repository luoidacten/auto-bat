import { SKILL_GUIDES } from "./skill-guides.mjs";

export function validAimTarget(fighter, target) {
  return (
    !!target &&
    target.team !== fighter.team &&
    target.alive &&
    !target.dead &&
    !target.hidden &&
    !(target.falling > 0) &&
    !(target.respawnT > 0) &&
    !target.has?.("untargetable") &&
    !target.has?.("invis")
  );
}
export function aimTarget(match, team, preferred = null) {
  const own = match?.lead(team);
  if (!own?.alive) return null;
  const targets = match.fighters.filter((target) =>
    validAimTarget(own, target),
  );
  return (
    targets.find((target) => target.id === preferred) ||
    targets.sort(
      (a, b) =>
        Math.hypot(a.x - own.x, a.y - own.y) -
        Math.hypot(b.x - own.x, b.y - own.y),
    )[0] ||
    null
  );
}
export function worldToScreen(match, x, y, width, height) {
  return {
    x: width / 2 + x * match.zoom,
    y: height / 2 - 40 * 0.27 + (height < 520 ? 10 : 0) + y * match.zoom,
  };
}
export function targetAtPoint({ match, team, width, height }, x, y) {
  const own = match?.lead(team);
  if (!own || !match.zoom) return null;
  return (
    match.fighters
      .filter((target) => validAimTarget(own, target))
      .map((target) => ({
        target,
        point: worldToScreen(
          match,
          target.x,
          target.y - (target.z || 0) * 0.6,
          width,
          height,
        ),
      }))
      .sort(
        (a, b) =>
          Math.hypot(a.point.x - x, a.point.y - y) -
          Math.hypot(b.point.x - x, b.point.y - y),
      )
      .find(
        ({ target, point }) =>
          Math.hypot(point.x - x, point.y - y) <=
          Math.max(28, target.r * match.zoom + 14),
      )?.target || null
  );
}
export function skillGuide(fighter, key) {
  const id =
    fighter.form?.startsWith("luca_copy_") && ["A", "B", "C"].includes(key)
      ? fighter.ws.copyId
      : fighter.charId;
  return (
    SKILL_GUIDES[id]?.[key] || {
      shape: "line",
      range: fighter.weapon.skills[key]?.ai?.max || 150,
      width: 24,
      estimated: true,
    }
  );
}

export function drawAimGuide(ctx, match, team, input, width, height) {
  const own = match?.lead(team),
    gesture = input.gesture;
  if (!own?.alive || !match.zoom || !input.enabled || !input.touchMode) return;
  const target =
    input.targetAssist && !gesture?.manual && !input.manualAim
      ? aimTarget(match, team, input.targetId)
      : null;
  const guide = gesture ? skillGuide(own, gesture.key) : null;
  const center = worldToScreen(match, 0, 0, width, height);
  const color = gesture?.cancelled
    ? "#ff8795"
    : guide &&
        own.channelKey !== gesture.key &&
        own.charging?.key !== gesture.key &&
        !own.canUse(gesture.key, match)
      ? "#a5abb8"
      : "#76d8ff";
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.scale(match.zoom, match.zoom);
  ctx.lineWidth = 2 / match.zoom;
  if (target) {
    const radius = target.r + 12 / match.zoom;
    ctx.strokeStyle = "#ffd17b";
    ctx.fillStyle = "#ffd17b18";
    ctx.beginPath();
    ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.moveTo(
        target.x + Math.cos(angle) * radius,
        target.y + Math.sin(angle) * radius,
      );
      ctx.lineTo(
        target.x + Math.cos(angle) * (radius + 10 / match.zoom),
        target.y + Math.sin(angle) * (radius + 10 / match.zoom),
      );
    }
    ctx.stroke();
  }
  if (guide) {
    ctx.translate(own.x, own.y);
    ctx.rotate(input.aim);
    ctx.strokeStyle = color;
    ctx.fillStyle = gesture.cancelled ? "#ff87951c" : "#76d8ff1e";
    ctx.setLineDash(guide.estimated ? [7 / match.zoom, 5 / match.zoom] : []);
    const range = guide.range;
    ctx.beginPath();
    if (guide.shape === "circle") ctx.arc(0, 0, range, 0, Math.PI * 2);
    else if (guide.shape === "area") {
      ctx.setLineDash([6 / match.zoom, 5 / match.zoom]);
      ctx.arc(0, 0, range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(range, 0, guide.radius, 0, Math.PI * 2);
    } else if (guide.shape === "cone") {
      const arc = (Math.min(350, guide.arc) * Math.PI) / 180;
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, range, -arc / 2, arc / 2);
      ctx.closePath();
    } else ctx.rect(0, -guide.width / 2, range, guide.width);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    const tip = guide.shape === "circle" ? Math.min(range, 80) : range;
    ctx.beginPath();
    ctx.moveTo(own.r, 0);
    ctx.lineTo(tip, 0);
    ctx.moveTo(tip - 12 / match.zoom, -7 / match.zoom);
    ctx.lineTo(tip, 0);
    ctx.lineTo(tip - 12 / match.zoom, 7 / match.zoom);
    ctx.stroke();
  }
  ctx.restore();
}
