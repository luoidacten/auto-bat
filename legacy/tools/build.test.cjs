"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { build, ROOT, MARKER } = require("./build.cjs");

test("standalone export contains all local runtime assets and preserves existing work", async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "legacy-export-test-"));
  const out = path.join(temp, "game");
  const assetsRoot = path.resolve(ROOT, "..");
  try {
    const first = build({ out, assetsRoot });
    await t.test(
      "HTML, scripts, images and every configured audio file exist inside the export",
      () => {
        const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
        for (const match of html.matchAll(/(?:src|href)="([^"?#]+)"/g))
          assert.ok(fs.statSync(path.join(out, match[1])).isFile(), match[1]);
        const script = (file) =>
          fs.readFileSync(path.join(out, "js", file), "utf8");
        for (const file of Object.keys(first.files).filter((file) =>
          file.endsWith(".js"),
        )) {
          const text = fs.readFileSync(path.join(out, file), "utf8");
          assert.doesNotMatch(text, /\.\.\/(?:img|sound)\//, file);
          for (const match of text.matchAll(/['"](img\/[^'"]+)['"]/g))
            assert.ok(fs.statSync(path.join(out, match[1])).isFile(), match[1]);
        }
        for (const match of script("01b-audio.js").matchAll(
          /['"]((?:sfx|ui|voice|music)\/[^'"]+\.mp3)['"]/g,
        ))
          assert.ok(
            fs.statSync(path.join(out, "sound", match[1])).isFile(),
            match[1],
          );
        assert.ok(fs.statSync(path.join(out, "sound/NGUON.txt")).isFile());
        for (const [file, digest] of Object.entries(first.files))
          assert.equal(
            crypto
              .createHash("sha256")
              .update(fs.readFileSync(path.join(out, file)))
              .digest("hex"),
            digest,
            file,
          );
      },
    );
    await t.test("rebuild is reproducible", () => {
      assert.deepEqual(build({ out, assetsRoot }).files, first.files);
    });
    await t.test("source deployment resolves its entry points, manifest and shared offline media", () => {
      const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
      for (const match of html.matchAll(/(?:src|href)="([^"?#]+)"/g))
        assert.ok(fs.statSync(path.resolve(ROOT, match[1])).isFile(), match[1]);
      const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.webmanifest"), "utf8"));
      for (const icon of manifest.icons)
        assert.ok(fs.statSync(path.resolve(ROOT, icon.src)).isFile(), icon.src);
      const paths = JSON.parse(fs.readFileSync(path.join(ROOT, "precache.json"), "utf8"));
      for (const file of paths)
        assert.ok(fs.statSync(path.resolve(ROOT, file)).isFile(), file);
      assert.ok(paths.includes("engine/runtime.mjs"));
      assert.ok(paths.includes("client/render.mjs"));
      assert.ok(paths.includes("client/host-worker.mjs"));
      assert.ok(paths.includes("../img/icon.svg"));
      const worker = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
      assert.doesNotMatch(worker, /__CACHE_VERSION__/);
      const previous = [JSON.stringify(paths), worker];
      build({ out, assetsRoot });
      assert.deepEqual([
        JSON.stringify(JSON.parse(fs.readFileSync(path.join(ROOT, "precache.json"), "utf8"))),
        fs.readFileSync(path.join(ROOT, "sw.js"), "utf8"),
      ], previous);
      const standaloneManifest = JSON.parse(fs.readFileSync(path.join(out, "manifest.webmanifest"), "utf8"));
      assert.equal(standaloneManifest.icons[0].src, "img/icon.svg");
    });
    await t.test("missing media leaves the last good build intact", () => {
      const before = fs.readFileSync(path.join(out, MARKER), "utf8");
      assert.throws(() => build({ out, assetsRoot: temp }), /ENOENT/);
      assert.equal(fs.readFileSync(path.join(out, MARKER), "utf8"), before);
    });
    await t.test("source and user-owned or edited output are protected", () => {
      assert.throws(
        () => build({ out: path.join(ROOT, "js"), assetsRoot }),
        /Use legacy\/dist/,
      );
      const foreign = path.join(temp, "user-files");
      fs.mkdirSync(foreign);
      fs.writeFileSync(path.join(foreign, "keep.txt"), "user work");
      assert.throws(
        () => build({ out: foreign, assetsRoot }),
        /Refusing to overwrite/,
      );
      fs.appendFileSync(path.join(out, "index.html"), "\n<!-- user edit -->");
      assert.throws(() => build({ out, assetsRoot }), /Output was edited/);
      assert.equal(
        fs.readFileSync(path.join(foreign, "keep.txt"), "utf8"),
        "user work",
      );
      assert.match(
        fs.readFileSync(path.join(out, "index.html"), "utf8"),
        /user edit/,
      );
    });
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
