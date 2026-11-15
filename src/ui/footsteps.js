// footsteps.js — the sound of the astronaut's boots while walking (Member 3).
// =====================================================================
//  Works everywhere without touching anyone's walking code: every walker in the game uses the shared
//  avatar (src/map/avatar.js), which gets the class "walking" while its legs move. This file listens
//  for that class (on the base map, in the Command Center room, the shelter game, the solar panel yard,
//  and inside the Science Lab / Life Support / Greenhouse) and plays one step per foot.
//
//   • OUTSIDE on the Mars roads: soft ground, a muffled step in sand and red dust
//   • INSIDE a building: the same soft step, a little lighter
//   • The sounds are made by the browser (Web Audio), no sound files.
//   • Press M to switch the footsteps off / on (remembered in this browser).
//
//  Other code can use: MarsFootsteps.setMuted(true/false), MarsFootsteps.isMuted()
// =====================================================================

(function () {
  const STEP_EVERY = 0.225;      // seconds between steps = half of the avatar's 0.45 s leg animation (one per foot)
  const VOLUME = 0.6;            // soft-ground steps are low sounds: they need a bit more volume to be heard
  const KEY = 'mars-footsteps-muted';

  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch { /* storage can be blocked */ }

  // ---- sound ----
  let ctx = null, noise = null;
  function audio() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // half a second of white noise, reused for every step
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  // the browser only allows sound after the player pressed a key or clicked
  const unlock = () => { const c = audio(); if (c && c.state === 'suspended') c.resume(); };
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('pointerdown', unlock, true);

  let foot = 0;
  // one step on SOFT GROUND: a muffled "pff" of sand/dust (low-passed noise that swells in and fades out
  // slowly, no sharp click) plus a soft low thump of the boot sinking in. Indoors it is a bit lighter.
  function step(outside) {
    const c = ctx;
    if (!c || c.state !== 'running') return;
    const t = c.currentTime;
    foot = 1 - foot;
    const vary = 0.9 + Math.random() * 0.2;            // no two steps sound exactly the same

    // the sand: noise through a low-pass filter that closes as the foot settles
    const src = c.createBufferSource();
    src.buffer = noise;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.5;
    const top = (outside ? 650 : 1100) * vary * (foot ? 1 : 0.9);
    filter.frequency.setValueAtTime(top, t);
    filter.frequency.exponentialRampToValueAtTime(top * 0.35, t + 0.16);
    const g = c.createGain();
    const len = outside ? 0.2 : 0.13;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(VOLUME * (outside ? 1 : 0.7), t + 0.025);   // soft start: no click
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(filter).connect(g).connect(c.destination);
    src.start(t, Math.random() * 0.25, len + 0.03);

    // the boot sinking in: a gentle low thump
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime((outside ? 70 : 90) * vary, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const og = c.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(VOLUME * 0.6, t + 0.02);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(og).connect(c.destination);
    o.start(t); o.stop(t + 0.16);
  }

  // ---- who is walking? ----
  const visible = el => !el.classList.contains('hidden') && el.getClientRects().length > 0;
  function walkingIn(doc) {
    return [...doc.querySelectorAll('.avatar.walking')].filter(visible);
  }
  // returns null (nobody walks), 'outside' or 'inside'
  function whoWalks() {
    // inside a place that runs in its own frame (Science Lab, Life Support): its avatar counts as inside
    for (const f of document.querySelectorAll('iframe')) {
      if (!visible(f)) continue;
      let doc = null;
      try { doc = f.contentDocument; } catch { /* another site: skip */ }
      if (doc && walkingIn(doc).length) return 'inside';
    }
    const walkers = walkingIn(document);
    if (!walkers.length) return null;
    // outside = the base-map astronaut on the roads or in the solar panel yard (incl. the automatic walk);
    // any other walker is in a room (Command Center, Shield the Shelter, ...)
    const map = window.MarsMap;
    const onRoad = map && !map.isInside() && walkers.includes(map.player?.el);
    return onRoad ? 'outside' : 'inside';
  }

  let last = performance.now(), sinceStep = STEP_EVERY;   // the first step sounds right away
  (function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const where = muted ? null : whoWalks();
    if (where) {
      sinceStep += dt;
      if (sinceStep >= STEP_EVERY) { sinceStep = 0; step(where === 'outside'); }
    } else {
      sinceStep = STEP_EVERY;
    }
    requestAnimationFrame(loop);
  })(last);

  // ---- M = footsteps off / on ----
  function setMuted(on) {
    muted = !!on;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* ignore */ }
    window.MarsMap?.toast?.(muted ? 'Footsteps off (press M to turn on)' : 'Footsteps on');
  }
  window.addEventListener('keydown', e => {
    if (e.code !== 'KeyM' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    setMuted(!muted);
  });

  window.MarsFootsteps = { setMuted, isMuted: () => muted };
})();
