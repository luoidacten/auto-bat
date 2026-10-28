"use strict";
// Cross-project audit only; neither game's runtime imports the other game.
const path = require("node:path");
const root = path.resolve(__dirname, "..");
require("./compile.cjs").compile();
async function main() {
  const { ROSTER: roster } = await import("../engine/runtime.mjs");
  const game = require(path.resolve(root, "../tools/nap.js"));
  const battleground = Object.values(game.HEROES).filter(
    (hero) => !hero.hidden && !hero.dummy,
  );
  const aliases = { songluc: "chrononeo" };
  const canonical = (id) => aliases[id] || id;
  const legacyIds = new Set(roster.map((hero) => canonical(hero.id)));
  const battlegroundIds = new Set(battleground.map((hero) => hero.id));
  console.log(
    JSON.stringify(
      {
        battleground: battleground.length,
        legacy: roster.length,
        shared: battleground.filter((hero) => legacyIds.has(hero.id)).length,
        aliases,
        missing: battleground
          .filter((hero) => !legacyIds.has(hero.id))
          .map(({ id, name }) => ({ id, name })),
        legacyOnly: roster
          .filter((hero) => !battlegroundIds.has(canonical(hero.id)))
          .map(({ id, name }) => ({ id, name })),
      },
      null,
      2,
    ),
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
