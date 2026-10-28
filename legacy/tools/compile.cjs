"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("acorn");
const { createHash } = require("node:crypto");
const ROOT = path.resolve(__dirname, "..");
function bindings(source) {
  const names = [];
  for (const node of parse(source, {
    ecmaVersion: "latest",
    sourceType: "script",
  }).body) {
    if (["FunctionDeclaration", "ClassDeclaration"].includes(node.type))
      names.push(node.id.name);
    if (node.type === "VariableDeclaration")
      for (const declaration of node.declarations)
        if (declaration.id.type === "Identifier")
          names.push(declaration.id.name);
  }
  return names;
}
function compile() {
  const files = JSON.parse(
    fs.readFileSync(path.join(ROOT, "engine/sources.json"), "utf8"),
  );
  let source = files
    .map(
      (file) =>
        "\n// Source: " +
        file +
        "\n" +
        fs.readFileSync(path.join(ROOT, file), "utf8"),
    )
    .join("\n");
  const version = createHash("sha256")
    .update(source)
    .digest("hex")
    .slice(0, 12);
  source = source.replace(
    /(["'])legacy-online-1\1/,
    JSON.stringify("legacy-online-1-" + version),
  );
  const names = bindings(source);
  const runtime = source + "\nexport { " + names.join(", ") + " };\n";
  const renderSource = [
    "js/06c-slash.js",
    "js/06f-vfx.js",
    "client/coach-render.js",
  ]
    .map(
      (file) =>
        fs
          .readFileSync(path.join(ROOT, file), "utf8")
          .split("// Only the old coach UI adapts")[0],
    )
    .join("\n");
  const local = new Set(bindings(renderSource));
  const renderer =
    "import { " +
    names.filter((name) => !local.has(name)).join(", ") +
    " } from '../engine/runtime.mjs';\n" +
    renderSource;
  fs.writeFileSync(path.join(ROOT, "engine/runtime.mjs"), runtime);
  fs.writeFileSync(path.join(ROOT, "client/render.mjs"), renderer);
  return {
    "engine/runtime.mjs": Buffer.from(runtime),
    "client/render.mjs": Buffer.from(renderer),
  };
}
if (require.main === module) compile();
module.exports = { compile };
