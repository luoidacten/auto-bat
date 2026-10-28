import { ENGINE_VERSION, cleanInput } from "../engine/runtime.mjs";
import { PROTOCOL_VERSION, RECONNECT_MS } from "../protocol/version.mjs";
import { encodePacket, PacketReader } from "../protocol/rtc-framing.mjs";

export function measureHost() {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./host-worker.mjs", import.meta.url), {
      type: "module",
    });
    const timer = setTimeout(() => {
      worker.terminate();
      reject(
        new Error(
          "Không đo được hiệu năng máy. Hãy đóng tác vụ nặng rồi thử lại.",
        ),
      );
    }, 10_000);
    worker.onmessage = (event) => {
      if (event.data.type === "benchmark") {
        clearTimeout(timer);
        worker.terminate();
        resolve(event.data.benchmark);
      }
      if (event.data.type === "error") {
        clearTimeout(timer);
        worker.terminate();
        reject(new Error(event.data.message));
      }
    };
    worker.onerror = () => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error("Không khởi động được bộ mô phỏng."));
    };
    worker.postMessage({ type: "benchmark", id: "host" });
  });
}

export class PeerSession {
  constructor({
    descriptor,
    team,
    signal,
    onState,
    onResult,
    onStatus,
    onError,
    onCheckpoint,
    checkpoint = null,
  }) {
    this.descriptor = descriptor;
    this.team = team;
    this.isHost = descriptor.hostTeam === team;
    this.signal = signal;
    this.onState = onState;
    this.onResult = onResult;
    this.onStatus = onStatus;
    this.onError = onError;
    this.onCheckpoint = onCheckpoint;
    this.checkpoint = checkpoint;
    this.worker = null;
    this.pc = null;
    this.channels = {};
    this.packetId = 0;
    this.lastTick = -1;
    this.closed = false;
    this.opened = false;
    this.finished = false;
    this.result = null;
    this.remoteCandidates = [];
    this.remoteMissingAt = null;
    this.lastRemoteAt = performance.now();
    this.lastRenegotiate = performance.now();
    this.helloSent = false;
    this.watchdog = setInterval(() => this.watch(), 1000);
    this.negotiate(descriptor).catch((error) => this.fail(error));
  }
  async negotiate(descriptor) {
    if (this.closed || descriptor.id !== this.descriptor.id) return;
    if (this.pc && descriptor.generation <= this.descriptor.generation) return;
    this.descriptor = descriptor;
    this.opened = false;
    this.helloSent = false;
    this.remoteCandidates = [];
    this.lastRenegotiate = performance.now();
    const previous = this.pc;
    this.pc = null;
    previous?.close();
    this.channels = {};
    if (this.worker)
      this.worker.postMessage({ type: "peer", connected: false });
    this.onStatus("connecting", descriptor);
    const pc = new RTCPeerConnection({
      iceServers: descriptor.iceServers || [],
    });
    this.pc = pc;
    pc.onicecandidate = (event) => {
      if (this.pc === pc && event.candidate)
        this.signal({
          type: "signal",
          matchId: descriptor.id,
          generation: descriptor.generation,
          data: { type: "candidate", candidate: event.candidate.toJSON() },
        });
    };
    pc.onconnectionstatechange = () => {
      if (this.pc !== pc || this.closed) return;
      if (["disconnected", "failed", "closed"].includes(pc.connectionState))
        this.missing();
    };
    pc.ondatachannel = (event) => {
      if (this.pc === pc) this.channel(event.channel, pc);
    };
    if (this.team === 0) {
      this.channel(
        pc.createDataChannel("legacy-control", { ordered: true }),
        pc,
      );
      this.channel(
        pc.createDataChannel("legacy-state", {
          ordered: false,
          maxRetransmits: 0,
        }),
        pc,
      );
      try {
        const offer = await pc.createOffer();
        if (this.pc !== pc) return;
        await pc.setLocalDescription(offer);
        if (this.pc !== pc) return;
        this.signal({
          type: "signal",
          matchId: descriptor.id,
          generation: descriptor.generation,
          data: { type: "offer", sdp: pc.localDescription.sdp },
        });
      } catch (error) {
        if (this.pc === pc) this.fail(error);
      }
    }
  }
  channel(channel, pc) {
    const kind =
      channel.label === "legacy-control"
        ? "control"
        : channel.label === "legacy-state"
          ? "state"
          : null;
    if (!kind) {
      channel.close();
      return;
    }
    channel.binaryType = "arraybuffer";
    this.channels[kind] = channel;
    const reader = new PacketReader();
    let count = 0,
      windowAt = performance.now();
    channel.onmessage = (event) => {
      if (this.pc !== pc || this.closed) return;
      const packet = reader.accept(event.data);
      if (!packet) return;
      const now = performance.now();
      if (now - windowAt > 1000) {
        count = 0;
        windowAt = now;
      }
      if (++count > 120) {
        this.fail(new Error("Đối thủ gửi quá nhiều dữ liệu."));
        return;
      }
      this.receive(packet, kind);
    };
    const opened = () => {
      if (this.pc !== pc || this.closed) return;
      if (
        Object.values(this.channels).filter((ch) => ch.readyState === "open")
          .length === 2 &&
        !this.helloSent
      ) {
        this.helloSent = true;
        this.transmit({ type: "hello", team: this.team }, "control");
      }
    };
    channel.onopen = opened;
    if (channel.readyState === "open") opened();
    channel.onclose = () => {
      if (this.pc === pc && !this.closed) this.missing();
    };
    channel.onerror = () => {
      if (this.pc === pc && !this.closed) this.missing();
    };
  }
  async signalMessage(message) {
    if (
      this.closed ||
      message.matchId !== this.descriptor.id ||
      message.generation !== this.descriptor.generation
    )
      return;
    const pc = this.pc,
      data = message.data;
    try {
      if (data.type === "offer" && this.team === 1) {
        await pc.setRemoteDescription({ type: "offer", sdp: data.sdp });
        if (this.pc !== pc) return;
        for (const candidate of this.remoteCandidates)
          await pc.addIceCandidate(candidate);
        this.remoteCandidates = [];
        const answer = await pc.createAnswer();
        if (this.pc !== pc) return;
        await pc.setLocalDescription(answer);
        if (this.pc !== pc) return;
        this.signal({
          type: "signal",
          matchId: this.descriptor.id,
          generation: this.descriptor.generation,
          data: { type: "answer", sdp: pc.localDescription.sdp },
        });
      } else if (data.type === "answer" && this.team === 0) {
        await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
        if (this.pc !== pc) return;
        for (const candidate of this.remoteCandidates)
          await pc.addIceCandidate(candidate);
        this.remoteCandidates = [];
      } else if (data.type === "candidate") {
        if (pc.remoteDescription) await pc.addIceCandidate(data.candidate);
        else if (this.remoteCandidates.length < 64)
          this.remoteCandidates.push(data.candidate);
      }
    } catch (error) {
      if (this.pc === pc) this.fail(error);
    }
  }
  transmit(message, kind = "control") {
    const channel = this.channels[kind];
    if (
      this.closed ||
      channel?.readyState !== "open" ||
      channel.bufferedAmount > (kind === "state" ? 512 * 1024 : 128 * 1024)
    )
      return false;
    try {
      const packet = {
        v: PROTOCOL_VERSION,
        version: ENGINE_VERSION,
        matchId: this.descriptor.id,
        generation: this.descriptor.generation,
        sender: this.team,
        ...message,
      };
      for (const part of encodePacket(packet, ++this.packetId))
        channel.send(part);
      return true;
    } catch (error) {
      if (kind === "control") this.fail(error);
      return false;
    }
  }
  receive(packet, kind) {
    if (
      packet?.v !== PROTOCOL_VERSION ||
      packet.version !== ENGINE_VERSION ||
      packet.matchId !== this.descriptor.id ||
      packet.generation !== this.descriptor.generation ||
      packet.sender !== 1 - this.team
    )
      return;
    this.lastRemoteAt = performance.now();
    if (packet.type === "hello" && kind === "control") {
      const wasOpen = this.opened;
      this.opened = true;
      this.remoteMissingAt = null;
      this.onStatus("connected", this.descriptor);
      this.signal({ type: "peer-connected", matchId: this.descriptor.id });
      if (this.isHost) {
        if (!this.worker) this.startWorker();
        else {
          this.sendReliableState = true;
          this.worker.postMessage({ type: "peer", connected: true });
          this.worker.postMessage({ type: "snapshot" });
        }
      }
      if (!wasOpen) this.transmit({ type: "ping", at: performance.now() });
      return;
    }
    if (packet.type === "ping" && kind === "control") {
      this.transmit({ type: "pong", at: packet.at });
      return;
    }
    if (packet.type === "pong") return;
    if (
      packet.type === "input" &&
      kind === "control" &&
      this.isHost &&
      this.opened
    ) {
      const frame = cleanInput(packet.frame);
      if (frame)
        this.worker?.postMessage({ type: "input", team: 1 - this.team, frame });
      return;
    }
    if (packet.type === "state" && !this.isHost && this.opened) {
      const value = packet.state;
      if (
        !value ||
        value.version !== ENGINE_VERSION ||
        !Number.isSafeInteger(value.tick) ||
        value.tick < this.lastTick ||
        !Array.isArray(value.fighters) ||
        value.fighters.length > 100 ||
        !value.view ||
        !Array.isArray(value.fighterIds) ||
        value.fighterIds.length !== 2
      )
        return;
      this.lastTick = value.tick;
      this.onState(value);
      return;
    }
    if (packet.type === "result" && !this.isHost && kind === "control") {
      if (![0, 1].includes(packet.winner)) return;
      this.finished = true;
      this.result = { winner: packet.winner, reason: packet.reason };
      this.onResult(this.result);
      this.transmit({ type: "result-ack" });
      return;
    }
    if (packet.type === "leave" && kind === "control")
      this.peerLeft(1 - this.team);
  }
  startWorker() {
    this.worker = new Worker(new URL("./host-worker.mjs", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (event) => {
      if (this.closed) return;
      const message = event.data;
      if (message.type === "state") {
        this.onState(message.state);
        this.transmit({ type: "state", state: message.state }, "state");
        if (this.sendReliableState) {
          this.transmit({ type: "state", state: message.state });
          this.sendReliableState = false;
        }
      }
      if (message.type === "result") {
        this.finished = true;
        this.result = { winner: message.winner, reason: message.reason };
        this.transmit({ type: "result", ...this.result });
        this.signal({
          type: "peer-result",
          matchId: this.descriptor.id,
          ...this.result,
        });
        this.onResult(this.result);
      }
      if (message.type === "checkpoint") this.onCheckpoint(message.checkpoint);
      if (message.type === "error") this.fail(new Error(message.message));
    };
    this.worker.onerror = () =>
      this.fail(new Error("Bộ mô phỏng của host đã dừng."));
    this.sendReliableState = true;
    const recoveringWithoutCheckpoint =
      this.descriptor.resuming && !this.checkpoint;
    const { id, hostTeam, heroes, arena, seed } = this.descriptor;
    this.worker.postMessage({
      type: "start",
      descriptor: { id, hostTeam, heroes, arena, seed },
      checkpoint: this.checkpoint,
    });
    this.checkpoint = null;
    if (recoveringWithoutCheckpoint)
      this.worker.postMessage({
        type: "forfeit",
        team: this.team,
        reason: "host-reload",
      });
  }
  input(frame) {
    if (!this.opened || this.closed || this.finished) return false;
    if (this.isHost) {
      this.worker?.postMessage({ type: "input", team: this.team, frame });
      return true;
    }
    return this.transmit({ type: "input", frame });
  }
  missing() {
    if (this.closed || this.finished) return;
    this.opened = false;
    if (this.remoteMissingAt === null) this.remoteMissingAt = performance.now();
    this.worker?.postMessage({ type: "peer", connected: false });
    this.onStatus("reconnecting", this.descriptor);
  }
  watch() {
    if (this.closed) return;
    if (this.finished) {
      if (this.isHost && this.result && this.opened)
        this.transmit({ type: "result", ...this.result });
      return;
    }
    const now = performance.now();
    if (this.opened) {
      if (now - this.lastRemoteAt > 5000) this.missing();
      else this.transmit({ type: "ping", at: now });
    }
    if (!this.opened) {
      if (this.remoteMissingAt === null) this.remoteMissingAt = now;
      if (
        now - this.lastRenegotiate >
        (this.pc?.connectionState === "connecting" ||
        this.pc?.connectionState === "new"
          ? 8000
          : 3000)
      ) {
        this.lastRenegotiate = now;
        this.signal({ type: "renegotiate", matchId: this.descriptor.id });
      }
      if (now - this.remoteMissingAt > RECONNECT_MS) {
        if (this.isHost)
          this.worker?.postMessage({
            type: "forfeit",
            team: 1 - this.team,
            reason: "disconnect",
          });
        else {
          this.finished = true;
          this.onResult({ winner: this.team, reason: "host-lost" });
        }
      }
    }
  }
  peerLeft(team) {
    if (this.finished) return;
    if (this.isHost)
      this.worker?.postMessage({ type: "forfeit", team, reason: "left" });
    else {
      this.finished = true;
      this.onResult({ winner: this.team, reason: "left" });
    }
  }
  leave() {
    this.transmit({ type: "leave" });
    if (this.isHost)
      this.worker?.postMessage({
        type: "forfeit",
        team: this.team,
        reason: "left",
      });
    setTimeout(() => this.close(), 1000);
  }
  fail(error) {
    this.onError(error.message || "Không kết nối được hai máy.");
    this.missing();
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.watchdog);
    this.worker?.terminate();
    const pc = this.pc;
    this.pc = null;
    pc?.close();
    this.channels = {};
  }
}
