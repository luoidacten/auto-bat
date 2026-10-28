"use strict";
// Local-only TURN/TCP fixture for browsers whose managed policy disables direct UDP.
// Credentials are generated per run, stored in a private temp directory, and never logged.
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  net = require("node:net"),
  crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const ROOT = path.resolve(__dirname, "..");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function freePort() {
  const socket = net.createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}
async function waitPort(port, child) {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null)
      throw new Error("Local fixture process exited before startup");
    const open = await new Promise((resolve) => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => resolve(false));
    });
    if (open) return;
    await sleep(50);
  }
  throw new Error("Local fixture startup timed out");
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), sleep(2000)]);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
    await once(child, "exit");
  }
}
async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "legacy-rtc-"));
  fs.chmodSync(temp, 0o700);
  let turn, server;
  try {
    const turnPort = await freePort(),
      serve = process.argv.includes("--serve");
    const port = serve ? Number(process.env.PORT || 8002) : await freePort();
    const username = "legacy-" + crypto.randomBytes(6).toString("hex"),
      credential = crypto.randomBytes(24).toString("hex");
    const config = path.join(temp, "turn.conf"),
      ice = path.join(temp, "ice.json");
    fs.writeFileSync(
      config,
      [
        `listening-port=${turnPort}`,
        "listening-ip=127.0.0.1",
        "relay-ip=127.0.0.1",
        "min-port=49160",
        "max-port=49223",
        "fingerprint",
        "lt-cred-mech",
        "realm=legacy-test.local",
        `user=${username}:${credential}`,
        "no-cli",
        "no-tls",
        "no-dtls",
        "no-udp",
        "no-tcp-relay",
        "no-multicast-peers",
        "allow-loopback-peers",
        "relay-threads=1",
        `userdb=${path.join(temp, "turn.sqlite")}`,
        `pidfile=${path.join(temp, "turn.pid")}`,
        `log-file=${path.join(temp, "turn.log")}`,
        "simple-log",
        "no-stdout-log",
      ].join("\n"),
      { mode: 0o600 },
    );
    fs.writeFileSync(
      ice,
      JSON.stringify([
        {
          urls: `turn:127.0.0.1:${turnPort}?transport=tcp`,
          username,
          credential,
        },
      ]),
      { mode: 0o600 },
    );
    const turnEnv = { ...process.env };
    if (process.env.LEGACY_TURN_LIB_DIR)
      turnEnv.LD_LIBRARY_PATH = process.env.LEGACY_TURN_LIB_DIR;
    turn = spawn(process.env.TURNSERVER || "turnserver", ["-c", config], {
      env: turnEnv,
      stdio: [
        "ignore",
        fs.openSync(path.join(temp, "stdout.log"), "w", 0o600),
        fs.openSync(path.join(temp, "stderr.log"), "w", 0o600),
      ],
    });
    let missing = false;
    turn.on("error", () => {
      missing = true;
    });
    await sleep(100);
    if (missing)
      throw new Error(
        "coturn is required for this TCP-relay test. Install coturn or set TURNSERVER to its binary.",
      );
    await waitPort(turnPort, turn);
    server = spawn(process.execPath, ["server/main.mjs"], {
      cwd: ROOT,
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: String(port),
        RTC_ICE_SERVERS: "",
        RTC_ICE_SERVERS_FILE: ice,
      },
      stdio: ["ignore", "ignore", "inherit"],
    });
    await waitPort(port, server);
    if (serve) {
      process.stdout.write(
        `Legacy P2P with local TURN/TCP test fixture running on port ${port}\n`,
      );
      await new Promise((resolve) => {
        process.once("SIGINT", resolve);
        process.once("SIGTERM", resolve);
      });
    } else {
      const browser = spawn(
        process.env.PYTHON_BIN || "python3",
        ["tools/browser-smoke.py", `http://127.0.0.1:${port}`],
        { cwd: ROOT, stdio: "inherit" },
      );
      const [code] = await once(browser, "exit");
      if (code !== 0) throw new Error("WebRTC browser checks failed");
    }
  } finally {
    await stop(server);
    await stop(turn);
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
