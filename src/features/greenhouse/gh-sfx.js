// gh-sfx.js: greenhouse sound effects, made by the browser (Web Audio), so there are no sound files to ship.
// Usage: import { sfx } from "./gh-sfx.js";  sfx.click(); sfx.outage(); ...
// The mute choice is remembered in localStorage and can be flipped with sfx.toggle().
let ctx = null;
let master = null;
let noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem("gh-sfx-muted") === "1"; } catch { /* storage can be blocked */ }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// one note: frequency (optionally gliding to `to`), start delay, length, wave, volume
function tone(freq, at, dur, type = "sine", vol = 0.12, to = null) {
  const c = ac(); if (!c || muted) return;
  const t = c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.015, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.03);
}
// a burst of filtered noise (pouring, sparks, static)
function noise(at, dur, vol = 0.1, freq = 1800, q = 0.8, type = "bandpass") {
  const c = ac(); if (!c || muted) return;
  const t = c.currentTime + at;
  const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t); s.stop(t + dur + 0.03);
}

export const sfx = {
  get muted() { return muted; },
  toggle() {
    muted = !muted;
    try { localStorage.setItem("gh-sfx-muted", muted ? "1" : "0"); } catch { /* ignore */ }
    if (!muted) { ac(); tone(660, 0, 0.08, "triangle", 0.1); tone(880, 0.07, 0.1, "triangle", 0.1); }
    return muted;
  },
  unlock() { ac(); },

  // ---- general ----
  click() { tone(720, 0, 0.05, "triangle", 0.07, 520); },
  open() { tone(420, 0, 0.07, "triangle", 0.08); tone(630, 0.06, 0.09, "triangle", 0.08); },
  close() { tone(520, 0, 0.06, "triangle", 0.07); tone(340, 0.05, 0.08, "triangle", 0.07); },
  good() { tone(660, 0, 0.09, "triangle", 0.11); tone(990, 0.08, 0.14, "triangle", 0.11); },
  bad() { tone(240, 0, 0.22, "sawtooth", 0.09, 120); },
  buzz() { tone(150, 0, 0.26, "square", 0.08); tone(140, 0.02, 0.26, "sawtooth", 0.05); },
  success() { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.22, "triangle", 0.12)); },
  fail() { [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.3, "triangle", 0.11)); },

  // ---- power ----
  outage() {                       // lights going out: a power-down sweep, a zap and a few low thumps
    noise(0, 0.25, 0.14, 3200, 0.6);
    tone(700, 0, 0.9, "sawtooth", 0.09, 45);
    tone(120, 0.15, 0.7, "square", 0.05, 40);
    [0.5, 0.85, 1.2].forEach((t) => tone(95, t, 0.18, "sine", 0.13, 60));
  },
  powerOn() {                      // power coming back: a rising whirr and a bright chime
    tone(160, 0, 0.55, "sawtooth", 0.06, 900);
    noise(0.05, 0.2, 0.06, 2600, 0.7);
    tone(784, 0.5, 0.18, "triangle", 0.12); tone(1175, 0.62, 0.3, "triangle", 0.12);
  },
  connect() { tone(520, 0, 0.06, "square", 0.05); tone(880, 0.05, 0.1, "triangle", 0.1); noise(0, 0.08, 0.05, 4000, 1); },
  zap() { noise(0, 0.18, 0.1, 2800, 0.5); tone(300, 0, 0.18, "sawtooth", 0.07, 80); },

  // ---- radiation / shields ----
  alarm(level = 2) {               // 1 = yellow caution (two beeps), 2 = red danger (three alternating beeps)
    if (level <= 1) { tone(880, 0, 0.14, "square", 0.07); tone(880, 0.22, 0.14, "square", 0.07); return; }
    [0, 0.26, 0.52].forEach((t, i) => { tone(i % 2 ? 740 : 1000, t, 0.2, "square", 0.09); });
  },
  turn() { tone(300, 0, 0.04, "square", 0.06); tone(430, 0.04, 0.05, "square", 0.06); },
  shieldUp() { tone(380, 0, 0.5, "triangle", 0.1, 1300); tone(1568, 0.45, 0.35, "sine", 0.1); noise(0, 0.4, 0.04, 5000, 0.6); },

  // ---- soil lab ----
  pour() { noise(0, 0.38, 0.09, 1200, 0.7); noise(0.05, 0.3, 0.05, 700, 0.9); },
  start() { tone(392, 0, 0.1, "triangle", 0.1); tone(587, 0.09, 0.14, "triangle", 0.1); },
  beep() { tone(900, 0, 0.08, "sine", 0.1); },
  ding() { tone(1046, 0, 0.28, "sine", 0.12); tone(1318, 0.16, 0.4, "sine", 0.12); },

  // ---- compost / plants ----
  plant() { tone(260, 0, 0.14, "sine", 0.12, 620); noise(0, 0.1, 0.04, 900, 1); },
  harvest() { [440, 554, 659].forEach((f, i) => tone(f, i * 0.07, 0.14, "triangle", 0.11)); },
  catchOrb() { tone(800, 0, 0.07, "sine", 0.09, 1200); },
};