// footsteps.js — the sound of the astronaut's boots while walking (Member 3).
// =====================================================================
//  Works everywhere without touching anyone's walking code: every walker in the game uses the shared
//  avatar (src/map/avatar.js), which gets the class "walking" while its legs move. This file listens
//  for that class (on the base map, in the Command Center room, the shelter game, the solar panel yard,
//  and inside the Science Lab / Life Support / Greenhouse) and plays the steps.
//
//   • OUTSIDE on the Mars roads: a soft, cozy step in sand (a short rounded "pff" + a little "thup")
//   • INSIDE a building: the same soft step, shorter and lighter
//   • about 2 steps a second: calm, not rushed
//   • The sounds are made by the browser (Web Audio), no sound files.
//   • Press M to switch the footsteps off / on (remembered in this browser).
//
//  Other code can use: MarsFootsteps.setMuted(true/false), MarsFootsteps.isMuted()
// =====================================================================

(function () {
  const STEP_EVERY = 0.45;       // seconds between steps: one step per walk cycle of the avatar's legs (calm, not rushed)
  const VOLUME = 0.6;            // the steps play a lot: loud enough to hear, not too loud
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
      if (Math.random() < 0.006) grain = 0.3 + Math.random() * 0.4;   // a new grain
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
  // one step on SOFT SAND, cozy-game style: a short, rounded "pff" (soft sand puffing under the boot)
  // on a little low "thup". Short and gentle so it never gets tiring to hear. Indoors: the same, lighter.
  function step(outside) {
    const c = ctx;
    if (!c || c.state !== 'running') return;
    const t = c.currentTime;
    foot = 1 - foot;
    const vary = 0.92 + Math.random() * 0.16;          // no two steps sound exactly the same
    const pitch = foot ? 1 : 0.88;                      // left and right foot a little different
    const len = (outside ? 0.13 : 0.09) * vary;

    // the sand puff: soft noise, only the low-middle part (rounded, not scratchy)
    const src = c.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = 0.7 + Math.random() * 0.2;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 1.2;
    const top = (outside ? 1300 : 1800) * vary * pitch;
    lp.frequency.setValueAtTime(top, t);
    lp.frequency.exponentialRampToValueAtTime(top * 0.4, t + len);  // the puff closes as the sand settles
    const hp = c.createBiquadFilter();                                // no rumble
    hp.type = 'highpass';
    hp.frequency.value = 180;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(VOLUME * (outside ? 1 : 0.65), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(lp).connect(hp).connect(g).connect(c.destination);
    src.start(t, Math.random() * 0.3, len + 0.03);

    // the little "thup" of the boot
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime((outside ? 150 : 190) * vary * pitch, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.07);
    const og = c.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(VOLUME * 0.45, t + 0.006);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(og).connect(c.destination);
    o.start(t); o.stop(t + 0.1);
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
