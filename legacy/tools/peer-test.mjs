// Local PeerServer plus Git-tracked static files. There is deliberately no /socket.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import { PeerServer } from "peer";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const tracked = new Set(
  execFileSync("git", ["ls-files", "-z"], { cwd: root }).toString().split("\0"),
);
const brokerSockets = new Set();
const broker = await new Promise((resolve) =>
  PeerServer(
    { host: "127.0.0.1", port: 0, path: "/legacy", allow_discovery: false },
    resolve,
  ),
);
broker.on("connection", (socket) => {
  brokerSockets.add(socket);
  socket.on("close", () => brokerSockets.delete(socket));
});
let stopped = false;
async function stopBroker() {
  if (stopped) return;
  stopped = true;
  for (const socket of brokerSockets) socket.destroy();
  await new Promise((resolve) => broker.close(resolve));
}
const mime = {
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".html": "text/html",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};
const staticServer = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/__test__/stop-broker" && request.method === "POST") {
    await stopBroker();
    response.end("stopped");
    return;
  }
  let file;
  try {
    file = decodeURIComponent(url.pathname).replace(/^\/auto-bat\//, "");
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (file.endsWith("/")) file += "index.html";
  if (!url.pathname.startsWith("/auto-bat/") || !tracked.has(file)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "Content-Type": mime[path.extname(file)] || "application/octet-stream",
  });
  fs.createReadStream(path.join(root, file)).pipe(response);
});
staticServer.listen(0, "127.0.0.1");
await once(staticServer, "listening");
let exitCode = 1;
try {
  const browser = spawn(
    process.env.PYTHON_BIN || "python3",
    ["tools/peer-smoke.py", `http://127.0.0.1:${staticServer.address().port}`],
    {
      cwd: path.join(root, "legacy"),
      env: {
        ...process.env,
        LEGACY_PEER_TEST_PORT: String(broker.address().port),
        LEGACY_PEER_TEST_ICE_FILE: process.argv[2],
      },
      stdio: "inherit",
    },
  );
  const [code] = await once(browser, "exit");
  exitCode = code === 0 ? 0 : 1;
} finally {
  await stopBroker();
  staticServer.closeAllConnections();
  await new Promise((resolve) => staticServer.close(resolve));
}
// PeerServer retains housekeeping timers after HTTP shutdown; this fixture owns
// the process and has already closed its browsers and listening sockets.
if (exitCode) throw new Error("Static PeerJS browser subprocess failed");
process.exit(0);
