// footsteps.js — the sound of the astronaut's boots while walking (Member 3).
// =====================================================================
//  Works everywhere without touching anyone's walking code: every walker in the game uses the shared
//  avatar (src/map/avatar.js), which gets the class "walking" while its legs move. This file listens
//  for that class (on the base map, in the Command Center room, the shelter game, the solar panel yard,
//  and inside the Science Lab / Life Support / Greenhouse) and plays one step per foot.
//
//   • OUTSIDE on the Mars roads: like walking on beach sand (a soft "shhk" of grains shifting)
//   • INSIDE a building: the same sandy step (dust on the boots), shorter and lighter
//   • The sounds are made by the browser (Web Audio), no sound files.
//   • Press M to switch the footsteps off / on (remembered in this browser).
//
//  Other code can use: MarsFootsteps.setMuted(true/false), MarsFootsteps.isMuted()
// =====================================================================

(function () {
  const STEP_EVERY = 0.225;      // seconds between steps = half of the avatar's 0.45 s leg animation (one per foot)
  const VOLUME = 0.55;           // the steps play a lot: loud enough to hear, not too loud
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
    // half a second of "sand": noise made of lots of tiny grains (short random bursts), like sand
    // grains rubbing and shifting under a foot. Reused for every step.
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const d = noise.getChannelData(0);
    let grain = 0;
    for (let i = 0; i < d.length; i++) {
      if (Math.random() < 0.012) grain = 0.4 + Math.random() * 0.6;   // a new grain
      grain *= 0.985;                                                    // ...that fades in ~2 ms
      d[i] = (Math.random() * 2 - 1) * (0.25 + grain);
    }
    return ctx;
  }
  // the browser only allows sound after the player pressed a key or clicked
  const unlock = () => { const c = audio(); if (c && c.state === 'suspended') c.resume(); };
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('pointerdown', unlock, true);

  let foot = 0;
  // one step in BEACH SAND: the foot presses in (a soft "shhk" of grains shifting, which swells and then
  // slides away) with a gentle low thump under it. Indoors it is the same, shorter and lighter.
  function step(outside) {
    const c = ctx;
    if (!c || c.state !== 'running') return;
    const t = c.currentTime;
    foot = 1 - foot;
    const vary = 0.9 + Math.random() * 0.2;            // no two steps sound exactly the same
    const len = (outside ? 0.26 : 0.16) * vary;

    // the sand shifting: grainy noise in the middle frequencies, the "shhk"
    const src = c.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = 0.85 + Math.random() * 0.3;
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.8;
    const f0 = (outside ? 1600 : 2200) * vary * (foot ? 1 : 0.9);
    band.frequency.setValueAtTime(f0 * 0.7, t);
    band.frequency.linearRampToValueAtTime(f0, t + len * 0.4);       // the grains slide as the weight rolls forward
    band.frequency.linearRampToValueAtTime(f0 * 0.6, t + len);
    const soft = c.createBiquadFilter();                               // take the sharp top off: soft, not scratchy
    soft.type = 'lowpass';
    soft.frequency.value = 4200;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(VOLUME * (outside ? 1 : 0.7), t + 0.04);   // the foot sinks in
    g.gain.setValueAtTime(VOLUME * (outside ? 0.8 : 0.55), t + len * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);                         // the sand settles
    src.connect(band).connect(soft).connect(g).connect(c.destination);
    src.start(t, Math.random() * 0.2, len + 0.05);

    // the foot pressing in: a gentle low thump
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime((outside ? 75 : 95) * vary, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
    const og = c.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(VOLUME * 0.35, t + 0.02);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(og).connect(c.destination);
    o.start(t); o.stop(t + 0.14);
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
