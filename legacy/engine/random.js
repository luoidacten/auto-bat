"use strict";
// A session owns its random stream. Rendering and other matches cannot advance it.
let activeRandom = Math.random;
function random() {
  return activeRandom();
}
function seededRandom(seed) {
  let state = 2166136261;
  for (const c of String(seed))
    state = Math.imul(state ^ c.charCodeAt(0), 16777619) >>> 0;
  const rng = () => {
    state += 0x6d2b79f5;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
  rng.state = () => state >>> 0;
  return rng;
}
function withRandom(rng, fn) {
  const previous = activeRandom;
  activeRandom = rng;
  try {
    return fn();
  } finally {
    activeRandom = previous;
  }
}
