import {
  ROSTER,
  ROSTER_BY_ID,
  WEAPONS,
  ARENA_DEFS,
  ENGINE_VERSION,
  hydrateView,
  humanInputMode,
} from "../engine/runtime.mjs";
import "./render.mjs";
import { PlayerInput } from "./input.mjs";
import { LocalSession, OFFLINE_SAVE_KEY } from "../offline/session.mjs";
import { PROTOCOL_VERSION } from "../protocol/version.mjs";
import { presentNetwork } from "./presentation.mjs";
import { PeerSession, measureHost } from "./p2p-session.mjs";

const $ = (selector) => document.querySelector(selector);
const canvas = $("#arena"),
  context = canvas.getContext("2d");
const state = {
  mode: "menu",
  local: null,
  match: null,
  socket: null,
  team: 0,
  room: null,
  paused: false,
  result: false,
  accumulator: 0,
  last: 0,
  sendAt: 0,
  previousView: null,
  snapshotAt: 0,
  reconnect: null,
  pending: [],
  peer: null,
};
let toastTimer;
function toast(message) {
  $("#status").textContent = message;
  $("#status").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#status").classList.remove("show"), 4500);
}
function storageGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}
const input = new PlayerInput(canvas, (x, y) => {
  const match = state.match,
    fighter = match?.lead(state.team);
  if (!fighter || !match.zoom) return state.team ? Math.PI : 0;
  const offsetY = innerHeight / 2 - 40 * 0.27 + (innerHeight < 520 ? 10 : 0);
  return Math.atan2(
    (y - offsetY) / match.zoom - fighter.y,
    (x - innerWidth / 2) / match.zoom - fighter.x,
  );
});

function resize() {
  const scale = Math.min(2, devicePixelRatio || 1);
  canvas.width = innerWidth * scale;
  canvas.height = innerHeight * scale;
  context.setTransform(scale, 0, 0, scale, 0, 0);
}
addEventListener("resize", resize);
resize();
document.body.classList.toggle(
  "touch",
  matchMedia("(pointer: coarse)").matches,
);
for (const hero of ROSTER) {
  for (const select of [$("#hero"), $("#bot-hero")]) {
    const option = document.createElement("option");
    option.value = hero.id;
    option.textContent = hero.name;
    select.appendChild(option);
  }
}
for (const [id, arena] of Object.entries(ARENA_DEFS)) {
  const option = document.createElement("option");
  option.value = id;
  option.textContent = arena.name;
  $("#arena-pick").appendChild(option);
}
$("#bot-hero").value = "zero";
try {
  const pref = JSON.parse(localStorage.getItem("legacy_arena_preferences_v1"));
  if (Object.hasOwn(ROSTER_BY_ID, pref?.hero)) $("#hero").value = pref.hero;
} catch {}
function describeHero() {
  const hero = ROSTER_BY_ID[$("#hero").value],
    weapon = WEAPONS[hero.weapon];
  $("#hero-info").textContent = hero.role + " · " + hero.style;
  $("#skills-info").replaceChildren(
    ...["A", "B", "C", "D", "U"]
      .filter((k) => weapon.skills[k])
      .map((k) => {
        const div = document.createElement("div"),
          label = document.createElement("b");
        label.textContent = k;
        div.append(label, document.createTextNode(weapon.skills[k].name));
        div.title = weapon.skills[k].desc || "";
        return div;
      }),
  );
  try {
    localStorage.setItem(
      "legacy_arena_preferences_v1",
      JSON.stringify({ schemaVersion: 1, hero: hero.id }),
    );
  } catch {}
  if (state.room) send({ type: "pick", hero: hero.id });
}
$("#hero").onchange = describeHero;
describeHero();
$("#resume-offline").hidden = !storageGet(localStorage, OFFLINE_SAVE_KEY);

function show(screen) {
  for (const id of ["menu", "lobby", "game-hud", "result"])
    $("#" + id).hidden = id !== screen;
  const playing = screen === "game-hud";
  document.body.classList.toggle("playing", playing);
  input.enabled = playing;
  input.clear();
}
function skillBar() {
  const fighter = state.match?.lead(state.team);
  if (!fighter) return;
  const keys = ["A", "B", "C", "D", "U", "E"].filter(
    (k) => fighter.weapon.skills[k],
  );
  const signature =
    fighter.weaponId +
    ":" +
    fighter.form +
    ":" +
    keys.map((k) => fighter.weapon.skills[k].name).join("|");
  if ($("#skill-bar").dataset.signature === signature) return;
  $("#skill-bar").dataset.signature = signature;
  const labels = { A: "Q", B: "E", C: "R", D: "F", U: "Space", E: "Shift" };
  $("#skill-bar").replaceChildren(
    ...keys.map((key) => {
      const button = document.createElement("button");
      button.dataset.skill = key;
      button.dataset.control = humanInputMode(fighter, key);
      button.title = fighter.weapon.skills[key].desc || "";
      button.innerHTML =
        '<b></b><small></small><kbd></kbd><span class="cooldown" hidden></span>';
      button.querySelector("b").textContent = key === "U" ? "NỘ" : key;
      button.querySelector("small").textContent =
        fighter.weapon.skills[key].name;
      button.querySelector("kbd").textContent = labels[key];
      return button;
    }),
  );
  input.bindSkills($("#skill-bar"));
}
function enterMatch() {
  state.result = false;
  state.paused = false;
  state.accumulator = 0;
  state.pending = [];
  $("#pause").hidden = state.mode === "online";
  $("#pause").textContent = "Tạm dừng";
  $("#mode-label").textContent =
    state.mode === "online"
      ? "ONLINE P2P · BẠN LÀ " + (state.team + 1)
      : "OFFLINE · BẠN ĐẤU BOT";
  show("game-hud");
  skillBar();
}
function endMatch(winner, description = "") {
  if (state.result) return;
  state.result = true;
  input.enabled = false;
  input.clear();
  $("#result-title").textContent =
    winner === state.team
      ? "Bạn thắng!"
      : winner === -1
        ? "Hòa trận"
        : "Bạn đã thua";
  $("#result-description").textContent =
    description || "Tích điểm văng, chọn vị trí và canh thời điểm phản đòn.";
  show("result");
  if (state.local) state.local.save();
}
function beginOffline() {
  disconnect();
  state.mode = "offline";
  state.team = 0;
  input.seq = 0;
  input.aim = 0;
  state.local = new LocalSession({
    heroes: [$("#hero").value, $("#bot-hero").value],
    arena: $("#arena-pick").value,
    seed: "offline-" + Date.now(),
  });
  state.match = state.local.engine.match;
  enterMatch();
}
$("#offline").onclick = beginOffline;
$("#resume-offline").onclick = async () => {
  try {
    toast("Đang khôi phục trận offline…");
    const local = await LocalSession.restore(
      storageGet(localStorage, OFFLINE_SAVE_KEY),
    );
    disconnect();
    state.mode = "offline";
    state.team = 0;
    state.local = local;
    state.match = local.engine.match;
    input.seq = Math.max(0, ...local.engine.lastSeq) + 1;
    enterMatch();
    if (state.match.state === "over") endMatch(state.match.winner);
  } catch (error) {
    toast(error.message);
  }
};
$("#export-save").onclick = () => {
  const text =
    state.local?.serialize() || storageGet(localStorage, OFFLINE_SAVE_KEY);
  if (!text) {
    toast("Chưa có trận offline để xuất.");
    return;
  }
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "legacy-offline.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("#import-save").onchange = async (event) => {
  try {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) throw new Error("Bản lưu quá lớn.");
    const local = await LocalSession.restore(await file.text());
    if (!local.save())
      throw new Error("Không đủ dung lượng lưu trên thiết bị.");
    $("#resume-offline").hidden = false;
    toast("Đã nhập bản lưu offline.");
  } catch (error) {
    toast(error.message);
  } finally {
    event.target.value = "";
  }
};

function send(message) {
  if (state.socket?.readyState !== WebSocket.OPEN) return false;
  state.socket.send(
    JSON.stringify({
      v: PROTOCOL_VERSION,
      version: ENGINE_VERSION,
      ...message,
    }),
  );
  return true;
}
function disconnect() {
  clearTimeout(state.reconnect);
  state.reconnect = null;
  state.peer?.close();
  state.peer = null;
  if (state.socket) {
    const socket = state.socket;
    state.socket = null;
    socket.close();
  }
  state.room = null;
  try {
    sessionStorage.removeItem("legacy_arena_session");
  } catch {}
}
function peerState(value) {
  const view = hydrateView(value);
  state.previousView = state.match;
  state.match = view;
  state.snapshotAt = performance.now();
  input.seq = Math.max(input.seq, value.lastSeq[state.team] + 1);
  state.pending = state.pending.filter(
    (item) => item.frame.seq > value.lastSeq[state.team],
  );
  if (state.mode !== "online" || ($("#game-hud").hidden && !state.result)) {
    state.mode = "online";
    state.local = null;
    enterMatch();
  }
  if (view.state === "over") endMatch(view.winner);
}
function peerResult(result) {
  const descriptions = {
    disconnect: "Đối thủ không kết nối lại trong thời gian cho phép.",
    left: "Một người chơi đã rời trận.",
    "host-lost": "Máy host đã mất kết nối.",
    "host-reload": "Host không khôi phục được trận sau khi tải lại.",
  };
  endMatch(result.winner, descriptions[result.reason] || "");
}
function beginPeer(descriptor) {
  if (
    descriptor.version !== ENGINE_VERSION ||
    ![0, 1].includes(descriptor.hostTeam) ||
    !Array.isArray(descriptor.heroes) ||
    descriptor.heroes.length !== 2 ||
    !descriptor.heroes.every((id) => Object.hasOwn(ROSTER_BY_ID, id))
  )
    return;
  if (state.peer?.descriptor.id === descriptor.id) {
    state.peer.negotiate(descriptor).catch((error) => toast(error.message));
    return;
  }
  state.peer?.close();
  state.peer = null;
  state.result = false;
  state.local = null;
  state.mode = "online";
  let checkpoint = null;
  if (descriptor.hostTeam === state.team) {
    try {
      const saved = JSON.parse(
        storageGet(sessionStorage, "legacy_arena_host_checkpoint"),
      );
      if (saved?.version === ENGINE_VERSION && saved.matchId === descriptor.id)
        checkpoint = saved;
    } catch {}
  }
  let peer;
  peer = new PeerSession({
    descriptor,
    team: state.team,
    signal: send,
    checkpoint,
    onState: (value) => {
      if (state.peer === peer) peerState(value);
    },
    onResult: (result) => {
      if (state.peer === peer) peerResult(result);
    },
    onError: (message) => {
      if (state.peer === peer) toast(message);
    },
    onCheckpoint: (value) => {
      if (state.peer !== peer) return;
      try {
        sessionStorage.setItem(
          "legacy_arena_host_checkpoint",
          typeof value === "string" ? value : JSON.stringify(value),
        );
      } catch {
        toast("Không đủ dung lượng lưu host. Tải lại tab có thể làm mất trận.");
      }
    },
    onStatus: (status, description) => {
      const label = $("#peer-status");
      label.dataset.transport = "webrtc";
      label.dataset.hostTeam = String(description.hostTeam);
      label.dataset.state = status;
      label.textContent =
        (status === "connected"
          ? "WebRTC · Host máy "
          : status === "connecting"
            ? "Đang nối hai máy · Host máy "
            : "Đang kết nối lại · Host máy ") +
        (description.hostTeam + 1);
      label.title =
        "Host được chọn từ độ ổn định và thời gian mô phỏng của hai máy trước trận.";
      if (status !== "connected") {
        input.enabled = false;
        input.clear();
        state.pending = [];
      } else if (state.match && !state.result) input.enabled = true;
    },
  });
  state.peer = peer;
}
function connect(firstMessage) {
  clearTimeout(state.reconnect);
  const socket = new WebSocket(
    (location.protocol === "https:" ? "wss:" : "ws:") +
      "//" +
      location.host +
      "/socket",
  );
  state.socket = socket;
  socket.onopen = () => send(firstMessage);
  socket.onmessage = (event) => {
    if (state.socket !== socket) return;
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (message.type === "seat") {
      state.mode = "online";
      state.team = message.team;
      state.room = message.room;
      input.aim = state.team ? Math.PI : 0;
      try {
        sessionStorage.setItem(
          "legacy_arena_session",
          JSON.stringify({ token: message.token }),
        );
      } catch {}
    }
    if (message.type === "room") {
      state.room = message.code;
      $("#lobby-code").textContent = message.code;
      $("#lobby-players").textContent = message.players
        .map((player, i) =>
          player
            ? `${i + 1}. ${ROSTER_BY_ID[player.hero]?.name || player.hero} · ${player.connected ? (player.ready ? "Sẵn sàng" : "Đang chọn") : "Đang nối lại phòng"}`
            : `${i + 1}. Đang chờ người chơi`,
        )
        .join("\n");
      $("#ready").disabled = !!message.players[state.team]?.ready;
      if (message.phase === "lobby") {
        if (state.peer?.finished) {
          state.peer.close();
          state.peer = null;
        }
        state.local = null;
        state.mode = "online";
        show("lobby");
      }
      if (message.phase === "connecting")
        $("#lobby-players").textContent +=
          "\nĐang kết nối WebRTC, host là máy " + (message.hostTeam + 1) + ".";
    }
    if (message.type === "peer-start") {
      try {
        beginPeer(message.descriptor);
      } catch (error) {
        toast(error.message);
      }
    }
    if (message.type === "signal") state.peer?.signalMessage(message);
    if (
      message.type === "peer-left" &&
      state.peer?.descriptor.id === message.matchId
    )
      state.peer.peerLeft(message.team);
    if (message.type === "peer-result" && [0, 1].includes(message.winner))
      peerResult(message);
    if (message.type === "error") {
      toast(message.message);
      if (message.expired) {
        disconnect();
        state.mode = "menu";
        show("menu");
      }
    }
  };
  socket.onclose = () => {
    if (state.socket !== socket) return;
    state.socket = null;
    if (!state.peer?.opened) input.clear();
    const saved = storageGet(sessionStorage, "legacy_arena_session");
    if (saved && state.room) {
      toast(
        state.peer?.opened
          ? "Máy ghép phòng mất kết nối; trận P2P vẫn tiếp tục."
          : "Đang thử kết nối lại phòng…",
      );
      state.reconnect = setTimeout(
        () =>
          connect({
            type: "resume",
            token: JSON.parse(saved).token,
            peerAlive: !!state.peer?.opened,
          }),
        1000,
      );
    } else
      toast("Không kết nối được máy ghép phòng. Chế độ offline vẫn chơi được.");
  };
  socket.onerror = () => {};
}
$("#create-room").onclick = () => {
  disconnect();
  connect({
    type: "create",
    hero: $("#hero").value,
    arena: $("#arena-pick").value,
  });
};
$("#join-room").onclick = () => {
  const code = $("#room-code").value.trim().toUpperCase();
  if (!/^[A-F0-9]{6}$/.test(code)) {
    toast("Nhập mã phòng 6 ký tự.");
    return;
  }
  disconnect();
  connect({ type: "join", code, hero: $("#hero").value });
};
async function ready() {
  const room = state.room;
  $("#ready").disabled = true;
  $("#ready").textContent = "Đang đo hai máy…";
  try {
    const benchmark = await measureHost();
    if (state.room !== room) return;
    if (!send({ type: "ready", benchmark })) {
      toast("Chưa kết nối lại được máy ghép phòng. Hãy thử lại.");
      $("#ready").disabled = false;
    }
  } catch (error) {
    toast(error.message);
    $("#ready").disabled = false;
  } finally {
    $("#ready").textContent = "Sẵn sàng";
  }
}
$("#ready").onclick = ready;
function menu() {
  if (state.local) state.local.save();
  if (state.room) send({ type: "leave" });
  if (state.peer) {
    state.peer.leave();
    state.peer = null;
  }
  disconnect();
  state.mode = "menu";
  state.local = null;
  state.match = null;
  state.result = false;
  $("#resume-offline").hidden = !storageGet(localStorage, OFFLINE_SAVE_KEY);
  show("menu");
}
$("#leave-room").onclick = menu;
$("#back-menu").onclick = menu;
$("#quit").onclick = menu;
$("#play-again").onclick = () => {
  if (state.mode === "online") {
    state.result = false;
    ready();
  } else beginOffline();
};
function pause() {
  if (state.mode !== "offline" || state.result) return;
  state.paused = !state.paused;
  input.clear();
  input.enabled = !state.paused;
  $("#pause").textContent = state.paused ? "Tiếp tục" : "Tạm dừng";
}
$("#pause").onclick = pause;
addEventListener("keydown", (event) => {
  if (event.code === "Escape") pause();
});
addEventListener("pagehide", () => {
  if (state.local) state.local.save();
});

function hud() {
  if (!state.match) return;
  const own = state.match.lead(state.team),
    enemy = state.match.lead(1 - state.team);
  for (const [selector, fighter] of [
    ["#player-score", own],
    ["#opponent-score", enemy],
  ]) {
    if (!fighter) continue;
    const node = $(selector);
    node.replaceChildren(document.createTextNode(fighter.name + " "));
    const strong = document.createElement("strong");
    strong.textContent = Math.round(fighter.percent) + "%";
    node.append(
      strong,
      document.createElement("br"),
      document.createTextNode("♥".repeat(Math.max(0, fighter.stocks))),
    );
  }
  const left = Math.max(0, state.match.timeLimit - state.match.clock);
  $("#clock").textContent =
    `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, "0")}`;
  skillBar();
  for (const button of $("#skill-bar").querySelectorAll("[data-skill]")) {
    const key = button.dataset.skill,
      cd = own.cd[key] || 0,
      label = button.querySelector(".cooldown");
    label.hidden = cd <= 0;
    if (cd > 0) label.textContent = cd.toFixed(1);
    if (own.charging?.key === key) {
      label.hidden = false;
      label.textContent = own.charging.elapsed.toFixed(1) + "s";
    }
    button.classList.toggle(
      "charging",
      input.held.has(key) || own.charging?.key === key,
    );
    button.style.borderColor = key === "U" && !own.ultReady() ? "#3a4960" : "";
  }
}
function frame(now) {
  const dt = Math.min(0.1, (now - (state.last || now)) / 1000);
  state.last = now;
  try {
    if (state.local && !state.paused && !state.result) {
      state.accumulator += dt;
      let count = 0;
      while (state.accumulator >= 1 / 60 && count++ < 6) {
        state.local.step(input.frame());
        state.accumulator -= 1 / 60;
        if (state.local.engine.tick % 120 === 0 && !state.local.save())
          toast("Không đủ dung lượng tự lưu. Bạn có thể xuất bản lưu.");
        if (state.match.state === "over") {
          endMatch(state.match.winner);
          break;
        }
      }
    }
    if (state.mode === "online" && input.enabled && now - state.sendAt > 33) {
      state.sendAt = now;
      const frame = input.frame();
      if (state.peer?.input(frame)) {
        state.pending.push({ frame, at: now });
        if (state.pending.length > 30) state.pending.shift();
      }
    }
    if (state.match) {
      const restore =
        state.mode === "online"
          ? presentNetwork(
              state.match,
              state.previousView,
              state.pending,
              state.team,
              now,
              state.snapshotAt,
            )
          : null;
      try {
        state.match.draw(context, innerWidth, innerHeight);
      } finally {
        restore?.();
      }
      hud();
    } else {
      context.fillStyle = "#0c1321";
      context.fillRect(0, 0, innerWidth, innerHeight);
    }
  } catch (error) {
    input.enabled = false;
    state.paused = true;
    toast("Trận đã tạm dừng: " + error.message);
    console.error(error);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then(async () => {
      await navigator.serviceWorker.ready;
      $("#offline-status").textContent =
        "Đã sẵn sàng chơi offline · không cần tải nhạc";
    })
    .catch(() => {
      $("#offline-status").textContent =
        "Chưa tải xong bản offline. Giữ kết nối rồi tải lại trang.";
    });
} else
  $("#offline-status").textContent =
    "Trình duyệt chưa hỗ trợ cài bản offline; có thể chơi từ máy chủ cục bộ.";
const saved = storageGet(sessionStorage, "legacy_arena_session");
if (saved) {
  try {
    connect({ type: "resume", token: JSON.parse(saved).token });
  } catch {}
}
