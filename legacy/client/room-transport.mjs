import { PeerRoomSocket } from "./peer-room.mjs";

export function roomTransport(location, config = {}) {
  const choice =
    config.transport || new URLSearchParams(location.search).get("rooms");
  if (choice === "peer" || choice === "server") return choice;
  return location.hostname.endsWith(".github.io") ? "peer" : "server";
}

export function createRoomSocket(firstMessage, resumeTransport) {
  const config = globalThis.LEGACY_ONLINE_CONFIG || {};
  if ((resumeTransport || roomTransport(location, config)) === "peer")
    return new PeerRoomSocket(firstMessage, config);
  const socket = new WebSocket(
    config.signalingURL ||
      (location.protocol === "https:" ? "wss:" : "ws:") +
        "//" +
        location.host +
        "/socket",
  );
  socket.transport = "server";
  return socket;
}
