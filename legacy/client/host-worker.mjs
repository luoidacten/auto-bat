import { HostSimulation, benchmarkHost } from "./host-simulation.mjs";
import { RECONNECT_MS } from "../protocol/version.mjs";

let host = null,
  timer = null,
  last = 0,
  accumulator = 0,
  remoteTeam = 1,
  disconnectedAt = null,
  resultSent = false;
function publish() {
  postMessage({ type: "state", state: host.snapshot() });
}
function result() {
  if (host.result && !resultSent) {
    resultSent = true;
    publish();
    postMessage({ type: "result", ...host.result });
    postMessage({
      type: "checkpoint",
      checkpoint: JSON.stringify(host.checkpoint()),
    });
    clearInterval(timer);
  }
}
function tick() {
  if (!host) return;
  const now = performance.now();
  accumulator = Math.min(5, accumulator + ((now - last) * 60) / 1000);
  last = now;
  if (disconnectedAt !== null && now - disconnectedAt > RECONNECT_MS)
    host.forfeit(remoteTeam, "disconnect");
  while (accumulator >= 1 && !host.result) {
    host.step(now);
    accumulator--;
    if (host.session.tick % 3 === 0) publish();
    if (host.session.tick % 120 === 0)
      postMessage({
        type: "checkpoint",
        checkpoint: JSON.stringify(host.checkpoint()),
      });
  }
  result();
}
self.onmessage = (event) => {
  try {
    const message = event.data;
    if (message.type === "benchmark") {
      postMessage({
        type: "benchmark",
        id: message.id,
        benchmark: benchmarkHost(),
      });
      return;
    }
    if (message.type === "start") {
      clearInterval(timer);
      host = new HostSimulation(message.descriptor, message.checkpoint);
      remoteTeam = 1 - message.descriptor.hostTeam;
      resultSent = false;
      last = performance.now();
      accumulator = 0;
      disconnectedAt = null;
      publish();
      postMessage({
        type: "checkpoint",
        checkpoint: JSON.stringify(host.checkpoint()),
      });
      timer = setInterval(tick, 8);
      result();
      return;
    }
    if (!host) return;
    if (message.type === "input")
      host.input(message.team, message.frame, performance.now());
    if (message.type === "peer") {
      if (message.connected) {
        disconnectedAt = null;
        host.resetPeer(remoteTeam);
        publish();
      } else if (disconnectedAt === null) disconnectedAt = performance.now();
    }
    if (message.type === "snapshot") publish();
    if (message.type === "forfeit") {
      host.forfeit(message.team, message.reason);
      result();
    }
  } catch (error) {
    postMessage({ type: "error", message: error.message });
    clearInterval(timer);
  }
};
