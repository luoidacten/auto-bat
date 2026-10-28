// Predict only voluntary movement. Damage, knockback, cooldowns and KO remain authoritative.
export function presentNetwork(
  match,
  previous,
  pending,
  team,
  now,
  receivedAt,
) {
  const saved = match.fighters.map((f) => [f, f.x, f.y]);
  const alpha = Math.max(0, Math.min(1, (now - receivedAt) / 50));
  for (const fighter of match.fighters) {
    if (fighter.team !== team) {
      const old = previous?.fighters.find((f) => f.id === fighter.id);
      if (old && Math.hypot(old.x - fighter.x, old.y - fighter.y) < 100) {
        fighter.x = old.x + (fighter.x - old.x) * alpha;
        fighter.y = old.y + (fighter.y - old.y) * alpha;
      }
      continue;
    }
    if (
      !fighter.alive ||
      !fighter.canMove() ||
      fighter.dash ||
      fighter.hitstun > 0
    )
      continue;
    let dx = 0,
      dy = 0,
      budget = 0.15;
    for (let i = 0; i < pending.length && budget > 0; i++) {
      const duration = Math.max(
        0,
        Math.min(
          0.05,
          ((pending[i + 1]?.at || now) - pending[i].at) / 1000,
          budget,
        ),
      );
      const speed = fighter.speed * (fighter.action?.move ?? 1);
      dx += pending[i].frame.x * speed * duration;
      dy += pending[i].frame.y * speed * duration;
      budget -= duration;
    }
    const point = { x: fighter.x + dx, y: fighter.y + dy, r: fighter.r };
    if (
      match.arena.inside(point.x, point.y, 4) &&
      !match.arena.nearPillar(point, 0)
    ) {
      fighter.x = point.x;
      fighter.y = point.y;
    }
  }
  return () => {
    for (const [f, x, y] of saved) {
      f.x = x;
      f.y = y;
    }
  };
}
