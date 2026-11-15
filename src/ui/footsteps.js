// footsteps.js — the sound of the astronaut's boots while walking (Member 3).
// =====================================================================
//  Works everywhere without touching anyone's walking code: every walker in the game uses the shared
//  avatar (src/map/avatar.js), which gets the class "walking" while its legs move. This file listens
//  for that class (on the base map, in the Command Center room, the shelter game, the solar panel yard,
//  and inside the Science Lab / Life Support / Greenhouse) and plays the steps.
//
//   • a dry, crunchy grass step ("kshh", like crumpling dry leaves), a different variant every step
//   • INSIDE a building: the same step, quieter and a bit shorter
//   • about 2 steps a second: a calm walking pace
//   • The sounds are made by the browser (Web Audio), no sound files.
//   • Press M to switch the footsteps off / on (remembered in this browser).
//
//  Other code can use: MarsFootsteps.setMuted(true/false), MarsFootsteps.isMuted()
// =====================================================================

(function () {
  const STEP_EVERY = 0.5;        // seconds between steps: about 2 a second, a calm walking pace
  const VOLUME = 0.12;           // the steps play a lot: loud enough to hear, not too loud
  const KEY = 'mars-footsteps-muted';

  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch { /* storage can be blocked */ }

  // ---- sound ----
  // A grass step is a dry "kshh", like crumpling a handful of dry leaves. We make VARIANTS of it
  // (each with its own random crackles) and pick a different one every step, so it never sounds like
  // the same clip on repeat.
  const VARIANTS = 6;
  let ctx = null, steps = [];
  function makeCrumple(c) {
    const sr = c.sampleRate, n = Math.floor(sr * 0.32);
    const buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0);
    // 4-7 little crunch "clusters" in the first ~0.2 s, each a burst of tiny crackles, getting quieter
    const clusters = 4 + Math.floor(Math.random() * 4);
    const env = new Float32Array(n);
    for (let k = 0; k < clusters; k++) {
      const at = Math.floor(sr * (k === 0 ? 0 : Math.random() * 0.2));
      const len = Math.floor(sr * (0.015 + Math.random() * 0.035));
      const amp = (k === 0 ? 1 : 0.35 + Math.random() * 0.55) * (1 - at / n);
      for (let i = 0; i < len && at + i < n; i++) {
        const shape = Math.sin(Math.PI * i / len);              // each cluster swells and fades
        env[at + i] = Math.max(env[at + i], amp * shape);
      }
    }
    let grain = 0;
    for (let i = 0; i < n; i++) {
      if (Math.random() < 0.02) grain = 0.2 + Math.random() * 0.3;   // gentle crackles: soft leaves
      grain *= 0.97;
      const fade = Math.min(1, i / (sr * 0.015)) * Math.pow(1 - i / n, 1.5);   // no click, then dies away
      d[i] = (Math.random() * 2 - 1) * (0.15 + grain) * (0.12 + env[i]) * fade;
    }
    return buf;
  }
  function audio() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    for (let v = 0; v < VARIANTS; v++) steps.push(makeCrumple(ctx));
    return ctx;
  }
  // the browser only allows sound after the player pressed a key or clicked
  const unlock = () => { const c = audio(); if (c && c.state === 'suspended') c.resume(); };
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('pointerdown', unlock, true);

  let lastVariant = -1;
  // one step: a random crumple variant (never the same one twice in a row), a little random pitch,
  // shaped to the dry middle frequencies of grass. Indoors: the same, quieter and a bit shorter.
  function step(outside) {
    const c = ctx;
    if (!c || c.state !== 'running') return;
    const t = c.currentTime;
    let v = Math.floor(Math.random() * VARIANTS);
    if (v === lastVariant) v = (v + 1) % VARIANTS;
    lastVariant = v;

    const src = c.createBufferSource();
    src.buffer = steps[v];
    src.playbackRate.value = 0.85 + Math.random() * 0.3;      // a little higher / lower each step
    const hp = c.createBiquadFilter();                        // no rumble
    hp.type = 'highpass';
    hp.frequency.value = 500;
    const peak = c.createBiquadFilter();                      // the dry, papery middle of the crunch
    peak.type = 'peaking';
    peak.frequency.value = 2400;
    peak.gain.value = 0;
    peak.Q.value = 0.8;
    const lp = c.createBiquadFilter();                        // very soft: only the low, muffled part of the crunch
    lp.type = 'lowpass';
    lp.frequency.value = outside ? 2400 : 2000;
    const g = c.createGain();
    g.gain.value = VOLUME * (outside ? 1 : 0.6);
    src.connect(hp).connect(peak).connect(lp).connect(g).connect(c.destination);
    src.start(t, 0, outside ? 0.32 : 0.22);
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
