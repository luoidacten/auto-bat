import {
  PeerRoom,
  parseRoomToken,
  peerRoomId,
  roomCode,
} from "../protocol/peer-room.mjs";
import { ENGINE_VERSION } from "../engine/runtime.mjs";
import { PROTOCOL_VERSION } from "../protocol/version.mjs";

const STORAGE = "legacy_arena_peer_room";
const readSaved = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE));
  } catch {
    return null;
  }
};
const save = (value) => {
  try {
    sessionStorage.setItem(STORAGE, JSON.stringify(value));
  } catch {}
};

// WebSocket-compatible adapter. PeerJS brokers the initial connection; lobby and
// SDP thereafter travel on a reliable peer DataChannel, not through Pages.
export class PeerRoomSocket {
  constructor(firstMessage, config = {}) {
    this.transport = "peer";
    this.readyState = 0;
    this.config = config;
    this.first = firstMessage;
    this.peer = null;
    this.connection = null;
    this.coordinator = null;
    this.authenticated = false;
    this.failureMessage = "";
    this.attempts = 0;
    this.start().catch(() =>
      this.fail("Không tải được bộ kết nối P2P. Hãy tải lại trang."),
    );
  }
  deliver(message) {
    if (this.readyState !== 3)
      queueMicrotask(() => {
        if (this.readyState !== 3)
          this.onmessage?.({ data: JSON.stringify(message) });
      });
  }
  async start() {
    await import("../vendor/peerjs.min.js");
    if (this.readyState === 3) return;
    const token =
      this.first.type === "resume" ? parseRoomToken(this.first.token) : null;
    if (this.first.type === "resume" && !token) {
      this.deliver({
        type: "error",
        message: "Phiên P2P đã hết hạn.",
        expired: true,
      });
      return;
    }
    this.team = token?.team ?? (this.first.type === "create" ? 0 : 1);
    this.code = token?.code || (this.team === 0 ? roomCode() : this.first.code);
    if (!/^[A-F0-9]{6}$/.test(this.code)) {
      this.fail("Mã phòng không hợp lệ.");
      return;
    }
    if (this.team === 0) {
      const saved = token ? readSaved() : null;
      if (
        token &&
        (!saved ||
          saved.code !== this.code ||
          saved.players?.[0]?.token !== token.token)
      ) {
        this.deliver({
          type: "error",
          message: "Không còn dữ liệu khôi phục phòng.",
          expired: true,
        });
        return;
      }
      this.coordinator = new PeerRoom({
        code: this.code,
        arena: this.first.arena,
        saved,
        emit: (team, message) =>
          team === 0 ? this.deliver(message) : this.sendRemote(message),
        persist: save,
      });
    }
    this.openBroker();
  }
  openBroker() {
    if (this.readyState === 3) return;
    const options = { debug: 0, ...this.config.peerjs };
    if (this.config.iceServers)
      options.config = { iceServers: this.config.iceServers };
    const peer = new globalThis.Peer(
      this.team === 0 ? peerRoomId(this.code) : undefined,
      options,
    );
    this.peer = peer;
    this.iceServers = peer.options.config.iceServers;
    if (this.coordinator) this.coordinator.iceServers = this.iceServers;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(
      () =>
        this.fail(
          "Máy ghép phòng P2P chưa phản hồi. Kiểm tra mạng rồi thử lại.",
        ),
      18_000,
    );
    peer.on("open", () => {
      if (this.peer !== peer || this.readyState === 3) return;
      if (this.team === 0) this.open();
      else
        this.bind(
          peer.connect(peerRoomId(this.code), {
            label: "legacy-room",
            serialization: "json",
            reliable: true,
          }),
        );
    });
    peer.on("connection", (connection) => {
      if (this.team !== 0 || connection.label !== "legacy-room") {
        connection.close();
        return;
      }
      // Authenticate before replacing an existing channel: a reloaded guest may
      // reconnect before the old browser's channel has finished closing.
      const timeout = setTimeout(() => connection.close(), 20_000);
      connection.on("close", () => clearTimeout(timeout));
      connection.once("data", (message) => {
        clearTimeout(timeout);
        const player = this.coordinator.players[1];
        const allowed =
          message?.v === PROTOCOL_VERSION &&
          message.version === ENGINE_VERSION &&
          ((message.type === "resume" &&
            player &&
            message.token === player.token) ||
            (message.type === "join" &&
              !player &&
              this.coordinator.phase === "lobby"));
        if (!allowed) {
          connection.send({
            type: "error",
            message: "Phòng đã đủ hai người hoặc phiên kết nối không hợp lệ.",
          });
          setTimeout(() => connection.close(), 150);
          return;
        }
        const old = this.connection;
        this.connection = null;
        old?.close();
        this.bind(connection, message);
      });
    });
    peer.on("error", (error) => {
      if (this.peer !== peer || this.readyState === 3) return;
      if (
        this.connection?.open &&
        ["network", "socket-error", "server-error", "socket-closed"].includes(
          error.type,
        )
      )
        return;
      if (
        error.type === "unavailable-id" &&
        this.first.type === "resume" &&
        this.attempts++ < 8
      ) {
        peer.destroy();
        this.retry = setTimeout(() => this.openBroker(), 1000);
        return;
      }
      if (
        error.type === "unavailable-id" &&
        this.first.type === "create" &&
        this.attempts++ < 3
      ) {
        peer.destroy();
        this.code = roomCode();
        this.coordinator.code = this.code;
        this.openBroker();
        return;
      }
      this.fail(
        error.type === "peer-unavailable"
          ? "Không tìm thấy phòng. Kiểm tra mã phòng và tải lại cả hai trang."
          : "Không kết nối được dịch vụ P2P. Kiểm tra mạng rồi thử lại.",
      );
    });
    peer.on("disconnected", () => {
      if (this.readyState !== 3 && !this.connection?.open)
        this.retry = setTimeout(() => {
          if (this.peer === peer && !peer.destroyed) peer.reconnect();
        }, 1500);
    });
  }
  open() {
    clearTimeout(this.timeout);
    this.readyState = 1;
    this.onopen?.();
  }
  bind(connection, firstMessage = null) {
    this.connection = connection;
    this.authenticated = false;
    let count = 0,
      windowAt = performance.now();
    let authenticate;
    const opened = () => {
      authenticate = setTimeout(() => {
        if (
          this.team === 0 &&
          this.connection === connection &&
          !this.authenticated
        )
          connection.close();
      }, 5000);
      if (this.team === 1) this.open();
    };
    connection.on("open", opened);
    const receive = (message) => {
      if (this.connection !== connection || this.readyState === 3) return;
      const now = performance.now();
      if (now - windowAt > 1000) {
        windowAt = now;
        count = 0;
      }
      if (
        ++count > 100 ||
        !message ||
        typeof message !== "object" ||
        JSON.stringify(message).length > 32_768
      ) {
        connection.close();
        return;
      }
      if (this.team === 0) {
        if (!this.authenticated && !["join", "resume"].includes(message.type))
          return;
        const accepted = this.coordinator.receive(1, message);
        if (!this.authenticated) {
          if (accepted) {
            this.authenticated = true;
            clearTimeout(authenticate);
          } else setTimeout(() => connection.close(), 150);
        }
      } else {
        if (message.type === "error") this.failureMessage = message.message;
        if (message.type === "peer-left" && message.team === 0)
          this.closedByPeer = true;
        this.deliver(message);
      }
    };
    connection.on("data", receive);
    connection.on("close", () => {
      clearTimeout(authenticate);
      if (this.connection !== connection || this.readyState === 3) return;
      this.connection = null;
      if (this.team === 0) {
        if (this.authenticated) this.coordinator.detach(1);
        this.authenticated = false;
        if (this.peer?.disconnected && !this.peer.destroyed)
          this.peer.reconnect();
      } else this.finish();
    });
    connection.on("error", () => {
      if (this.team === 1)
        this.fail(
          "Không nối được hai máy. Thử mạng khác hoặc kiểm tra dịch vụ TURN.",
        );
      else connection.close();
    });
    if (connection.open) opened();
    if (firstMessage) receive(firstMessage);
  }
  sendRemote(message) {
    if (this.connection?.open) this.connection.send(message);
  }
  send(data) {
    if (this.readyState !== 1) return;
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (this.team === 0) this.coordinator.receive(0, message);
    else this.sendRemote(message);
  }
  fail(message) {
    this.failureMessage = message;
    this.onerror?.();
    this.finish();
  }
  finish() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    clearTimeout(this.timeout);
    clearTimeout(this.retry);
    this.peer?.destroy();
    this.onclose?.();
  }
  close() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    clearTimeout(this.timeout);
    clearTimeout(this.retry);
    // Let a final leave packet flush before closing the metadata DataChannel.
    setTimeout(() => this.peer?.destroy(), 150);
    this.onclose?.();
  }
}
