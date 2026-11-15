// hud.js — the side panel (Member 3): mission clock, hazard meter, solar storm bar and EVA status,
// plus the red alarm screen and the big MISSION FAILED screen. It works on its own (needs only the map).
//
//   • MISSION CLOCK: Sol + time, as a flip clock (1 real second = 1 game minute)
//   • HAZARD METER: radiation goes up while you are OUTSIDE on the roads (+0.5 per game minute, kid-friendly),
//     stops inside any building, and the Cliff zone (canyon) gives 10% shade.
//     In the Command Center (radiation shelter) the needle slides back into the green part (to 37).
//   • SOLAR STORM: sometimes (random) a storm hits while you are outside: hazard rises 1.5x faster,
//     and a pop-up tells the kid to go to the radiation shelter in the Command Center.
//     It passes by itself after a while (a place, like the shelter, can also end it: MarsHUD.endStorm())
//   • EVA STATUS: GO (green, under 50) · CAUTION (yellow, 50-79) · NO GO (red, 80+ or a solar storm)
//   • YELLOW WARNING: hazard in the yellow (50-79) while outside -> softer yellow glow, banner and beep-beep
//   • RED ALARM: hazard in the red while outside -> the whole screen flashes red with a siren
//   • MISSION FAILED: hazard meter full -> big screen with what went wrong, a tip, and Try again
//
// Demos: ?storm (a storm will come), ?alarm (red alarm now), ?fail (Mission failed screen now).
// Other places can use: MarsHUD.getHazard(), MarsHUD.isStorm(), MarsHUD.startStorm(), MarsHUD.endStorm(),
//   MarsHUD.addHazard(n), MarsHUD.status() ('go' | 'caution' | 'nogo'), MarsHUD.newSol()
// Everything here starts with hud- so it can't clash with other places. Its look is in hud.css.

const MarsHUD = (function () {
  const map = MarsMap;
  const S = map.GRID.SPLIT;
  const q = new URLSearchParams(location.search);

  // ----- game numbers -----
  const MAX_HAZARD = 100;
  const CAUTION_AT = 50, DANGER_AT = 80;   // the meter turns yellow / red here
  const BASE_RATE = 0.5;                   // hazard points per game minute outside (0.5 = kid-friendly: ~200 s outside before 100)
  const CLIFF_X = 0.9;                     // cliff zone shade: 10% less
  const STORM_X = 1.5;                     // a solar storm makes the rate 1.5x faster outside (gentler for kids)
  const SAFE_LEVEL = 37;                   // in the Command Center (radiation shelter) the needle slides back to here (green part)
  const STORM_CHANCE = 0.35;               // chance of a storm on a Sol
  const STORM_AFTER = [4, 20];             // it comes after 4-20 game minutes outside
  const STORM_LENGTH = 15;                 // it passes after 15 game minutes
  const FORCE_STORM = q.has('storm'), FORCE_ALARM = q.has('alarm'), FORCE_FAIL = q.has('fail');

  let sol = 1, gameMinutes = 10 * 60;      // Sol 3 · 10:00
  let hazard = 0;
  let storm = false, stormDone = false, stormLeft = 0, untilStorm = rollStorm();
  function rollStorm() {
    if (!FORCE_STORM && Math.random() >= STORM_CHANCE) return Infinity;
    return STORM_AFTER[0] + Math.random() * (STORM_AFTER[1] - STORM_AFTER[0]);
  }
  function inCanyon({ x, y }) {            // close to the stretch of road between the cliff walls
    const [[ax, ay], [bx, by]] = S.canyon, vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(x - (ax + t * vx), y - (ay + t * vy)) < 26;
  }
  const outside = () => !map.isInside();
  let routeShade = null;                   // set by the route chooser while the avatar walks a route by itself
  function rate() {
    // inside a building the radiation stops, except in the Greenhouse (glass walls): it follows the outside rate
    if (!outside() && map.isInside() !== 'greenhouse') return 0;
    const shade = routeShade !== null ? routeShade : (inCanyon(map.getPos()) ? CLIFF_X : 1);
    return BASE_RATE * (storm ? STORM_X : 1) * shade;
  }

  // ================= THE PANEL =================
  document.getElementById('mm-topbar').insertAdjacentHTML('beforeend', `
<div class="hud-card hud-clock" role="timer" aria-label="Mission clock" id="hud-clock">
  <div class="hud-sol"><span>SOL</span><b id="hud-solNum">3</b></div>
  <div class="hud-flip"><b class="hud-d">1</b><b class="hud-d">0</b><span class="hud-colon">:</span><b class="hud-d">0</b><b class="hud-d">0</b></div>
</div>
<div class="hud-card hud-hazard">
  <div class="hud-lbl">HAZARD <span class="hud-num" id="hud-hazNum">0</span> / 100</div>
  <div class="hud-meter" role="meter" aria-label="Hazard" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="hud-meter"><div class="hud-needle" id="hud-needle"></div></div>
  <div class="hud-row">
    <div><div class="hud-lbl">HAZARD RATE</div><b class="hud-tile" id="hud-rate">Safe: +0</b></div>
    <div class="hud-shade" id="hud-shade">Cliff shade: −10%</div>
  </div>
</div>
<div class="hud-card hud-storm hud-calm" id="hud-storm"><span class="hud-light"></span><span id="hud-stormText">Calm skies · normal background radiation.</span></div>
<div class="hud-card hud-eva hud-go" id="hud-eva" role="status">
  <div class="hud-eva-box"><span>EVA</span><b id="hud-evaWord">GO</b></div>
  <div><div class="hud-lbl">GOING OUTSIDE</div><span class="hud-eva-text" id="hud-evaText">Safe to go outside</span></div>
</div>`);
  const $ = id => document.getElementById(id);
  const digits = [...document.querySelectorAll('#hud-clock .hud-d')];

  // ================= RED ALARM + MISSION FAILED screens =================
  document.body.insertAdjacentHTML('beforeend', `
<div class="hud-alarm" id="hud-alarm" hidden aria-hidden="true"><div class="hud-alarm-banner">⚠ RADIATION CRITICAL · GET INSIDE NOW! ⚠</div></div>
<div class="hud-warn" id="hud-warn" hidden aria-hidden="true"><div class="hud-warn-banner">⚠ RADIATION RISING · HEAD BACK SOON ⚠</div></div>
<div class="hud-stormpop" id="hud-stormPop" hidden role="alertdialog" aria-modal="true" aria-labelledby="hud-stormPopTitle">
  <div class="hud-stormpop-card">
    <h2 id="hud-stormPopTitle">Solar storm!</h2>
    <p>The Sun just threw out a big burst of radiation.<br>
       <b>Head to the radiation shelter inside the Command Center</b>: the <b>water</b> around its storm shelter core blocks the radiation!</p>
    <p class="hud-stormpop-fact"><b>NASA:</b> water is great at stopping solar storm particles, so real shelter plans put water around the crew.</p>
    <button type="button" class="hud-stormpop-go" id="hud-stormPopGo">Go to the shelter!</button>
  </div>
</div>
<div class="hud-fail" id="hud-fail" hidden role="alertdialog" aria-labelledby="hud-failTitle">
  <h1 class="hud-fail-title" id="hud-failTitle">MISSION FAILED</h1>
  <p class="hud-fail-why">The crew got too much radiation.</p>
  <div class="hud-fail-card">
    <div class="hud-fail-stats">
      <div><span>TIME OUTSIDE</span><b id="hud-fTime">0 min</b></div>
      <div><span>ROUTE</span><b id="hud-fRoute">Clear zone</b></div>
      <div><span>SOLAR STORM</span><b id="hud-fStorm">No</b></div>
    </div>
    <p class="hud-fail-tip"><b>TIP</b> <span id="hud-fTip"></span></p>
    <p class="hud-fail-fact">In real life, NASA limits how much radiation each astronaut can get in their whole career.
      Too much, and they are not allowed to fly to space again.</p>
    <button type="button" class="hud-retry" id="hud-retry">Try again</button>
  </div>
</div>`);

  // ================= SOUNDS (made by the browser) =================
  let audio = null;
  function tone(f0, f1, start, len, type, vol) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    audio = audio || new AC(); if (audio.state === 'suspended') audio.resume();
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + start;
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) { o.frequency.linearRampToValueAtTime(f1, t + len / 2); o.frequency.linearRampToValueAtTime(f0, t + len); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(audio.destination); o.start(t); o.stop(t + len + 0.05);
  }
  const wail = () => tone(500, 900, 0, 1.0, 'sawtooth', 0.05);
  const beepBeep = () => { tone(740, 0, 0, 0.15, 'square', 0.035); tone(740, 0, 0.22, 0.15, 'square', 0.035); };   // yellow warning
  const failSound = () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0, 0.25 + i * 0.32, i === 3 ? 1.2 : 0.3, 'triangle', 0.16));

  // ================= STORMS =================
  function startStorm() {
    if (storm) return;
    storm = true; stormDone = true; stormLeft = STORM_LENGTH;
    $('hud-storm').classList.remove('hud-calm');
    $('hud-stormText').textContent = 'SOLAR STORM · hazard rises 1.5× faster outside. Get inside!';
    map.toast('SOLAR STORM! Radiation rises 1.5× faster outside. Head to the shelter!');
    showStormPopup();
  }
  // pop-up when the storm starts: tells the kid what to do (the game waits for "Go to the shelter!")
  function showStormPopup() {
    map.releaseKeys(); map.pause(true);
    $('hud-stormPop').hidden = false;
    $('hud-stormPopGo').focus();
  }
  function hideStormPopup() {
    if ($('hud-stormPop').hidden) return;
    $('hud-stormPop').hidden = true;
    map.pause(false);
  }
  $('hud-stormPopGo').addEventListener('click', hideStormPopup);
  document.addEventListener('keydown', e => {
    if ($('hud-stormPop').hidden) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); hideStormPopup(); }
  });

  function endStorm() {
    if (!storm) return;
    storm = false;
    $('hud-storm').classList.add('hud-calm');
    $('hud-stormText').textContent = 'Calm skies · normal background radiation.';
    map.toast('The solar storm has passed. Calm skies again.');
  }

  // ================= DRAWING =================
  let lastMin = -1;
  function drawClock() {
    const m = Math.floor(gameMinutes); if (m === lastMin) return; lastMin = m;
    const t = String(Math.floor(m / 60) % 24).padStart(2, '0') + String(m % 60).padStart(2, '0');
    $('hud-solNum').textContent = sol;
    digits.forEach((d, i) => {
      if (d.textContent === t[i]) return;
      d.textContent = t[i];
      d.classList.remove('hud-flipping'); void d.offsetWidth; d.classList.add('hud-flipping');
    });
    $('hud-clock').setAttribute('aria-label', `Mission clock: Sol ${sol}, ${t.slice(0, 2)}:${t.slice(2)}`);
  }
  function evaLevel() {
    const h = FORCE_ALARM ? DANGER_AT + 5 : hazard;
    if (storm) return { lvl: 'nogo', word: 'NO GO', text: 'Solar storm! Stay inside.' };
    if (h >= DANGER_AT) return { lvl: 'nogo', word: 'NO GO', text: 'Radiation too high. Stay inside!' };
    if (h >= CAUTION_AT) return { lvl: 'caution', word: 'CAUTION', text: 'Short trips only. Get back soon!' };
    return { lvl: 'go', word: 'GO', text: 'Safe to go outside' };
  }
  let lastLvl = 'go';
  function drawPanel() {
    const shown = FORCE_ALARM ? DANGER_AT + 5 : hazard;
    $('hud-hazNum').textContent = Math.floor(shown);
    $('hud-needle').style.left = Math.min(100, shown / MAX_HAZARD * 100) + '%';
    $('hud-meter').setAttribute('aria-valuenow', Math.floor(shown));
    const r = rate();
    $('hud-rate').textContent = r === 0 ? 'Safe: +0' : `+${Math.round(r * 100) / 100} /min`;
    $('hud-shade').classList.toggle('hud-on', outside() && inCanyon(map.getPos()));
    const s = evaLevel();
    if (s.lvl !== lastLvl) {
      $('hud-eva').className = 'hud-card hud-eva hud-' + s.lvl;
      if (s.lvl === 'nogo') map.toast('EVA status: NO GO! ' + s.text);
      else if (s.lvl === 'caution') map.toast('EVA status: CAUTION. Short trips only!');
      lastLvl = s.lvl;
    }
    $('hud-evaWord').textContent = s.word;
    $('hud-evaText').textContent = s.text;
  }

  // ================= MISSION FAILED =================
  let failed = false, outsideTime = 0, usedCliff = false, stormHit = false;
  function missionFailed() {
    failed = true;
    map.releaseKeys(); map.pause(true);
    $('hud-fTime').textContent = Math.round(outsideTime) + ' min';
    $('hud-fRoute').textContent = usedCliff ? 'Cliff zone' : 'Clear zone';
    $('hud-fStorm').textContent = stormHit ? 'Yes' : 'No';
    $('hud-fTip').textContent =
        stormHit ? 'When a solar storm starts, get inside a building straight away.'
      : !usedCliff ? 'Take the Cliff zone: the canyon gives 10% shade from radiation.'
      : 'Go back inside as soon as EVA says NO GO (red).';
    $('hud-alarm').hidden = true; $('hud-warn').hidden = true;
    document.querySelector('.mm-page').classList.add('hud-failed');
    $('hud-fail').hidden = false;
    failSound();
    setTimeout(() => $('hud-retry').focus(), 1200);
  }
  $('hud-retry').addEventListener('click', () => location.reload());   // start the Sol again

  // ================= EVERY FRAME =================
  let alarmOn = false, nextWail = 0, warnOn = false, nextBeep = 0;
  let timeScale = 1;                       // > 1 = game time runs faster (the route chooser's automatic walk)
  map.on('update', realDt => {
    if (failed) return;
    const dt = realDt * timeScale;         // game minutes this frame (1 real second = 1 game minute, x timeScale)
    gameMinutes += dt;
    hazard = Math.min(MAX_HAZARD, hazard + rate() * dt);
    if (outside()) {
      outsideTime += dt;
      if (inCanyon(map.getPos())) usedCliff = true;
      if (storm) stormHit = true;
      if (!storm && !stormDone) { untilStorm -= dt; if (untilStorm <= 0) startStorm(); }
    }
    if (storm) { stormLeft -= dt; if (stormLeft <= 0) endStorm(); }
    drawClock();
    drawPanel();
    // red alarm: hazard in the red AND outside
    const on = (FORCE_ALARM || (hazard >= DANGER_AT && outside()));
    if (on !== alarmOn) { $('hud-alarm').hidden = !on; alarmOn = on; nextWail = 0; }
    if (on) { nextWail -= realDt; if (nextWail <= 0) { wail(); nextWail = 1.6; } }
    // yellow warning: hazard in the yellow (50-79) AND outside (softer than the red alarm)
    const warn = !on && hazard >= CAUTION_AT && hazard < DANGER_AT && outside();
    if (warn !== warnOn) { $('hud-warn').hidden = !warn; warnOn = warn; nextBeep = 0; }
    if (warn) { nextBeep -= realDt; if (nextBeep <= 0) { beepBeep(); nextBeep = 2.4; } }
    if (hazard >= MAX_HAZARD) missionFailed();
  });

  // in the radiation shelter (Command Center) the needle slides back into the green part.
  // Runs on its own clock, so it also works while the Command Center room has the game paused.
  let lastSafe = performance.now();
  (function safeRoom(now) {
    const dt = Math.min(0.1, Math.max(0, (now - lastSafe) / 1000)); lastSafe = now;
    if (map.isInside()) {                                // inside a building: the alarms stop (even while a room pauses the game)
      if (warnOn) { $('hud-warn').hidden = true; warnOn = false; }
      if (alarmOn && !FORCE_ALARM) { $('hud-alarm').hidden = true; alarmOn = false; }
    }
    if (!failed && map.isInside() === 'shelter' && hazard > SAFE_LEVEL) {
      hazard = Math.max(SAFE_LEVEL, hazard - 25 * dt);   // about 2 seconds from red back to green
      drawPanel();
    }
    requestAnimationFrame(safeRoom);
  })(lastSafe);
  map.on('leave', () => { if (evaLevel().lvl === 'nogo') map.toast('⚠ EVA NO GO! It is not safe outside. Go back in!'); });
  if (FORCE_FAIL) setTimeout(missionFailed, 600);
  drawClock(); drawPanel();

  return {
    getHazard: () => hazard,
    getRate: () => rate(),
    setTimeScale: k => { timeScale = k > 0 ? k : 1; },   // route chooser: fast-forward while the avatar walks a route by itself
    setRouteShade: v => { routeShade = (v === null || v === undefined) ? null : v; },   // route chooser: whole-route shade
    addHazard(n) { hazard = Math.max(0, Math.min(MAX_HAZARD, hazard + n)); drawPanel(); },
    isStorm: () => storm,
    startStorm, endStorm,
    status: () => evaLevel().lvl,
    isFailed: () => failed,
    newSol() { sol++; gameMinutes = 6 * 60; hazard = 0; stormDone = false; untilStorm = rollStorm(); endStorm(); },
  };
})();
window.MarsHUD = MarsHUD;   // shared, so other places can use it: MarsHUD.getHazard(), MarsHUD.endStorm()