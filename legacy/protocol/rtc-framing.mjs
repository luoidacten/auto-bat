const MAGIC = 0x4c475032,
  HEADER = 16,
  CHUNK = 12 * 1024,
  MAX = 512 * 1024;
const encoder = new TextEncoder(),
  decoder = new TextDecoder();
export function encodePacket(packet, id) {
  const payload = encoder.encode(JSON.stringify(packet));
  if (payload.length > MAX) throw new Error("Peer packet too large");
  const count = Math.ceil(payload.length / CHUNK) || 1;
  return Array.from({ length: count }, (_, index) => {
    const data = payload.subarray(index * CHUNK, (index + 1) * CHUNK),
      buffer = new Uint8Array(HEADER + data.length),
      header = new DataView(buffer.buffer);
    header.setUint32(0, MAGIC);
    header.setUint32(4, id >>> 0);
    header.setUint16(8, index);
    header.setUint16(10, count);
    header.setUint32(12, payload.length);
    buffer.set(data, HEADER);
    return buffer;
  });
}
export class PacketReader {
  constructor() {
    this.pending = new Map();
  }
  accept(buffer, now = performance.now()) {
    if (
      !(buffer instanceof ArrayBuffer) ||
      buffer.byteLength < HEADER ||
      buffer.byteLength > HEADER + CHUNK
    )
      return null;
    for (const [id, entry] of this.pending)
      if (now - entry.at > 2000) this.pending.delete(id);
    const header = new DataView(buffer);
    if (header.getUint32(0) !== MAGIC) return null;
    const id = header.getUint32(4),
      index = header.getUint16(8),
      count = header.getUint16(10),
      size = header.getUint32(12);
    if (
      !size ||
      size > MAX ||
      count !== Math.ceil(size / CHUNK) ||
      index >= count
    )
      return null;
    const data = new Uint8Array(buffer, HEADER);
    if (data.length !== Math.min(CHUNK, size - index * CHUNK)) return null;
    if (!this.pending.has(id)) {
      if (this.pending.size >= 4)
        this.pending.delete(this.pending.keys().next().value);
      this.pending.set(id, {
        parts: new Array(count),
        at: now,
        size,
        count,
        received: 0,
      });
    }
    const entry = this.pending.get(id);
    if (entry.size !== size || entry.count !== count) return null;
    if (!entry.parts[index]) {
      entry.parts[index] = data;
      entry.received++;
    }
    if (entry.received !== count) return null;
    this.pending.delete(id);
    const payload = new Uint8Array(size);
    entry.parts.forEach((part, i) => payload.set(part, i * CHUNK));
    try {
      return JSON.parse(decoder.decode(payload));
    } catch {
      return null;
    }
  }
}
