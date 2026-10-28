import {
  ArenaSession,
  ENGINE_VERSION,
  cleanInput,
  ROSTER_BY_ID,
  ARENA_DEFS,
} from "../engine/runtime.mjs";
export const OFFLINE_SAVE_KEY = "legacy_arena_offline_v1";
export class LocalSession {
  constructor(options) {
    this.options = { ...options, mode: "offline" };
    this.engine = new ArenaSession(this.options);
    this.frames = [];
  }
  step(input) {
    const frame = cleanInput(input);
    if (!frame) throw new Error("Invalid local input");
    if (this.frames.length >= 18000) throw new Error("Offline replay is full");
    this.frames.push(frame);
    return this.engine.step([frame]);
  }
  serialize() {
    return JSON.stringify({
      schemaVersion: 1,
      version: ENGINE_VERSION,
      options: this.options,
      frames: this.frames,
    });
  }
  save(storage = localStorage) {
    try {
      storage.setItem(OFFLINE_SAVE_KEY, this.serialize());
      return true;
    } catch {
      return false;
    }
  }
  static async restore(text, progress = () => {}) {
    const data = JSON.parse(text);
    if (
      data.schemaVersion !== 1 ||
      data.version !== ENGINE_VERSION ||
      !Array.isArray(data.frames) ||
      data.frames.length > 18000 ||
      !Array.isArray(data.options?.heroes) ||
      data.options.heroes.length !== 2 ||
      !data.options.heroes.every((id) => Object.hasOwn(ROSTER_BY_ID, id)) ||
      !Object.hasOwn(ARENA_DEFS, data.options.arena) ||
      typeof data.options.seed !== "string" ||
      data.options.seed.length > 100
    )
      throw new Error("Bản lưu không tương thích. Bản lưu gốc vẫn được giữ.");
    const options = {
      heroes: data.options.heroes,
      arena: data.options.arena,
      seed: data.options.seed,
      mode: "offline",
    };
    const local = new LocalSession(options);
    for (let i = 0; i < data.frames.length; i++) {
      const frame = cleanInput(data.frames[i]);
      if (!frame) throw new Error("Bản lưu chứa lệnh không hợp lệ.");
      local.step(frame);
      if (i % 240 === 0) {
        progress(i / Math.max(1, data.frames.length));
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    return local;
  }
}
