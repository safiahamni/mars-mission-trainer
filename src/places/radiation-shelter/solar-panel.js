// solar-panel.js — CLEAN SOLAR DUST mission (Member 3, Radiation Shelter).
// =====================================================================
//  Inside the Command Center press ▼: you go out through the airlock into the solar panel yard.
//  In the yard you can walk anywhere (this code moves the avatar there, so main.js needs no change).
//  Walk up to a panel: a pop-up opens for THAT panel. Move the hand over the dust to wipe it off
//  (mouse, finger or arrow keys). Clean all 3 panels! Walk back up to the airlock to go inside.
//  Everything for the solar panels is in this file (the yard and the panels on the map too).
//  Its look is in solar-panel.css (sd- classes). Load it AFTER shelter.js and shelter-game.js.
//  Sounds are made by the browser (no sound files).
// =====================================================================
const SolarMission = (function () {
  const map = MarsMap;
  const player = map.player;

  // ================= THE YARD + PANELS ON THE MAP (map design numbers, like main.html) =================
  const SOLAR = {
    yard:   { x1: -40, y1: 382, x2: 500, y2: 544 },   // the open ground you can walk on (big!)
    panels: [                                           // the 3 big panels, 46 apart, far down from the airlock
      { x1: 150, y1: 462, x2: 208, y2: 528 },
      { x1: 254, y1: 462, x2: 312, y2: 528 },           // Panel 2 is in the middle, under the airlock (x 283)
      { x1: 358, y1: 462, x2: 416, y2: 528 },
    ],
    rover:  { x1: 0, y1: 432, x2: 49, y2: 495 },       // the parked rover (you walk around it)
    rocks:  [{ x1: 420, y1: 514, x2: 442, y2: 534 }],   // the map's rock in the bottom corner (you walk around it)
    door:   [283, 386],                                 // the airlock: walk here to go back inside
  };
  const YARD_D = SOLAR.yard;
  const MAP_DUST = [   // dust on each panel: [x, y, size] from the panel's top-left corner
    [[23, 15, 6.4], [11, 38, 5.1], [28, 11, 3.9], [27, 56, 4.1], [18, 44, 7.8], [35, 30, 7.9], [10, 58, 4.8], [15, 14, 4.9]],
    [[44, 17, 6.1], [37, 29, 6.0], [11, 10, 4.4], [44, 49, 4.6], [34, 38, 7.4], [42, 23, 7.9], [13, 32, 6.9]],
    [[15, 36, 3.7], [39, 53, 6.1], [46, 25, 6.6], [35, 41, 5.6], [45, 56, 5.6], [39, 10, 6.7], [21, 30, 6.5]],
  ];
  // the AIRLOCK (the door out to the yard). shelter.js draws it with the Command Center; if shelter.js
  // isn't loaded (no #rs-shelter), we draw the same airlock here, on the bottom edge of the Command Center.
  if (!document.getElementById('rs-shelter')) {
    document.getElementById('place-shelter').insertAdjacentHTML('beforeend', `
<g id="sd-airlock" transform="translate(319 287) scale(0.7) translate(-319 -287)">
  <rect x="180" y="384" width="56" height="20" rx="7" fill="#2B2A3A"/><text x="208" y="398" font-size="11" text-anchor="middle" fill="#FFFFFF">Airlock</text>
  <rect x="240" y="368" width="56" height="48" rx="9" fill="#E6E4EA" stroke="#2B2A3A" stroke-width="3"/>
  <rect x="244" y="378" width="7" height="24" rx="3" fill="#F28C3A" stroke="#2B2A3A" stroke-width="1.5"/><rect x="285" y="378" width="7" height="24" rx="3" fill="#F28C3A" stroke="#2B2A3A" stroke-width="1.5"/>
  <rect x="255" y="380" width="26" height="16" rx="4" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2"/><rect x="260" y="386" width="16" height="4" rx="2" fill="#5CE0B5" stroke="#2B2A3A" stroke-width="1"/>
  <rect x="250" y="404" width="36" height="7" rx="1.5" fill="#FFD84A" stroke="#2B2A3A" stroke-width="1.5"/>
  <path d="M255 411 l4 -7 M263 411 l4 -7 M271 411 l4 -7 M279 411 l4 -7" stroke="#2B2A3A" stroke-width="2.2"/>
</g>`);
  }
  // the drawing goes into the Command Center's group on the map (shelter.js has already drawn the building)
  document.getElementById('place-shelter').insertAdjacentHTML('beforeend', `
<g id="sd-field-map">
  <!-- the yard: open ground you can walk on -->
  <rect x="${YARD_D.x1}" y="${YARD_D.y1}" width="${YARD_D.x2 - YARD_D.x1}" height="${YARD_D.y2 - YARD_D.y1}" rx="18"
        fill="#E8B98A" fill-opacity="0.45" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="2" stroke-dasharray="6 5"/>
  <rect x="${SOLAR.yard.x2 - 74}" y="390" width="64" height="18" rx="6" fill="#2B2A3A"/><text x="${SOLAR.yard.x2 - 42}" y="403" font-size="10" text-anchor="middle" fill="#FFFFFF">Solar panels</text>
  <!-- the rover, parked in the yard (same drawing as before, at 0.95 size) -->
  <g transform="translate(${SOLAR.rover.x1} ${SOLAR.rover.y1}) scale(0.95) translate(-76 -475)">
    <g stroke="#2B2A3A" stroke-linejoin="round">
      <!-- wheels -->
      <rect x="76" y="482" width="10" height="17" rx="3" fill="#45445A" stroke-width="2.5"/><rect x="118" y="482" width="10" height="17" rx="3" fill="#45445A" stroke-width="2.5"/>
      <rect x="76" y="516" width="10" height="17" rx="3" fill="#45445A" stroke-width="2.5"/><rect x="118" y="516" width="10" height="17" rx="3" fill="#45445A" stroke-width="2.5"/>
      <!-- body -->
      <rect x="83" y="475" width="38" height="66" rx="9" fill="#F4F2EE" stroke-width="3"/>
      <!-- windshield -->
      <rect x="89" y="480" width="26" height="15" rx="4" fill="#86C9F2" stroke-width="2"/>
      <!-- vent -->
      <rect x="89" y="500" width="26" height="13" rx="3" fill="#45445A" stroke-width="2"/>
      <path d="M95 503 V510 M100 503 V510 M105 503 V510 M110 503 V510" stroke="#F4F2EE" stroke-width="1.6" stroke-linecap="round"/>
      <!-- orange dial -->
      <circle cx="102" cy="527" r="8" fill="#F28C3A" stroke-width="2"/>
      <circle cx="102" cy="527" r="3.5" fill="#F4F2EE" stroke-width="1.5"/><path d="M102 527 L105 524" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="115" y="535" width="8" height="6" rx="1.5" fill="#F28C3A" stroke-width="1.5"/>
    </g>
  </g>
  <rect x="${SOLAR.rover.x1 + 4}" y="${SOLAR.rover.y2 + 5}" width="42" height="15" rx="5" fill="#2B2A3A"/><text x="${SOLAR.rover.x1 + 25}" y="${SOLAR.rover.y2 + 16}" font-size="10" text-anchor="middle" fill="#FFFFFF">Rover</text>
  <!-- ROVER REPAIR: "Needs repair!" sign + loading bar (shown by the repair mission) -->
  <g id="sd-roverBroken" class="sd-rover-broken" style="display:none">
    <rect x="${SOLAR.rover.x1 - 8}" y="${SOLAR.rover.y1 - 22}" width="66" height="16" rx="6" fill="#FF5A5A" stroke="#2B2A3A" stroke-width="2"/>
    <text x="${SOLAR.rover.x1 + 25}" y="${SOLAR.rover.y1 - 10.5}" font-size="9" text-anchor="middle" fill="#FFFFFF">Needs repair!</text>
    <path d="M${SOLAR.rover.x1 + 21} ${SOLAR.rover.y1 - 6} l4 5 l4 -5 Z" fill="#FF5A5A" stroke="#2B2A3A" stroke-width="1.5" stroke-linejoin="round"/>
  </g>
  <g id="sd-roverBar" style="display:none">
    <text id="sd-roverBarText" x="${SOLAR.rover.x1 + 25}" y="${SOLAR.rover.y1 - 14}" font-size="8" text-anchor="middle" fill="#FFFFFF" stroke="#2B2A3A" stroke-width="2.4" paint-order="stroke">Repairing… 0%</text>
    <rect x="${SOLAR.rover.x1 - 6}" y="${SOLAR.rover.y1 - 10}" width="62" height="8" rx="4" fill="#45445A" stroke="#2B2A3A" stroke-width="2"/>
    <rect id="sd-roverBarFill" x="${SOLAR.rover.x1 - 5}" y="${SOLAR.rover.y1 - 9}" width="0" height="6" rx="3" fill="#5CE0B5"/>
  </g>
  ${SOLAR.panels.map((P, i) => {
    const x = P.x1, y = P.y1, w = P.x2 - P.x1, h = P.y2 - P.y1, cx = x + w / 2;
    let cells = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) cells += `<rect x="${x + 5 + c * (w - 10) / 3}" y="${y + 5 + r * (h - 10) / 4}" width="${(w - 10) / 3 - 3}" height="${(h - 10) / 4 - 3}" rx="1.5"/>`;
    return `<g class="sd-map-panel" data-sd-panel="${i}">
    <rect x="${cx - 4}" y="${y + h - 2}" width="8" height="8" fill="#9AA3AE" stroke="#2B2A3A" stroke-width="2"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#24508F" stroke="#2B2A3A" stroke-width="3"/>
    <g fill="#3F7FDB" stroke="#9CC8F5" stroke-width="0.8">${cells}</g>
    <g class="sd-map-dust" fill="#C98F5E">${MAP_DUST[i].map(([dx, dy, r]) => `<circle cx="${x + dx}" cy="${y + dy}" r="${r}"/>`).join('')}</g>
    <g class="sd-map-check" transform="translate(${cx} ${y + h / 2})"><circle r="11" fill="#5CE0B5" stroke="#2B2A3A" stroke-width="2.5"/><path d="M-5 0 L-1.5 4 L5.5 -4" fill="none" stroke="#2B2A3A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
    <text x="${cx}" y="${y - 4}" font-size="9" text-anchor="middle" fill="#FFFFFF">Panel ${i + 1}</text>
  </g>`;
  }).join('\n  ')}
</g>`);

  // ---------- the yard and panels in map pixels (for walking and touching) ----------
  const ART = { x: 90, y: 7, s: 1.6 };    // same numbers as the map drawing: <g transform="translate(90 7) scale(1.6)">
  const toMap = ([dx, dy]) => [ART.x + dx * ART.s, ART.y + dy * ART.s];
  const rectPx = r => { const [x1, y1] = toMap([r.x1, r.y1]), [x2, y2] = toMap([r.x2, r.y2]); return { x1, y1, x2, y2 }; };
  const YARD   = rectPx(SOLAR.yard);
  const PANELS = SOLAR.panels.map(rectPx);       // the 3 panels on the map (map pixels), left to right
  const DOOR   = toMap(SOLAR.door);              // the airlock
  const OUT    = toMap([SOLAR.door[0], SOLAR.door[1] + 20]);   // where you stand after going out
  const BLOCKS = [...PANELS, rectPx(SOLAR.rover), ...SOLAR.rocks.map(rectPx)];   // things you walk around
  const EDGE = 6, BUMP = 5, DOOR_R = 14;  // feet stay inside the yard edge / away from blocks; airlock size
  const TOUCH = 12;                       // feet this close to a panel = start cleaning it
  const AWAY_AGAIN = 20;                  // after closing, step this far away from that panel before it can open again
  // how far the feet are from a panel's edge (0 = touching)
  const distTo = (P, x, y) => Math.hypot(Math.max(P.x1 - x, 0, x - P.x2), Math.max(P.y1 - y, 0, y - P.y2));

  const START_POWER = 40;    // % power when all panels are dusty
  const RUB_CLEAN   = 0.016; // dust wiped off per pixel of rubbing (1 = a whole dust spot)
  const HAND_REACH  = 20;    // the hand cleans dust this close to its middle (pixels)
  const KEY_SPEED   = 320;   // hand speed with the arrow keys (pixels per second)

  // dust spots on each big panel in the pop-up: [x, y, size] inside a 260 x 330 panel
  const DUST = [
    [[40, 40, 62], [150, 34, 46], [214, 92, 54], [96, 118, 58], [36, 192, 48], [170, 176, 64], [226, 250, 44], [100, 262, 56], [40, 296, 36]],
    [[200, 44, 60], [92, 50, 50], [30, 120, 44], [150, 124, 62], [226, 186, 46], [80, 200, 58], [180, 264, 54], [44, 280, 46], [120, 306, 34]],
    [[60, 36, 48], [176, 60, 62], [100, 130, 54], [226, 140, 40], [30, 214, 58], [150, 214, 50], [220, 290, 56], [90, 290, 46], [160, 316, 30]],
  ];

  // ================= SOUND EFFECTS (made with the Web Audio API) =================
  let audio = null, muted = false, noise = null, lastScrub = 0;
  function ac() {                       // start sound on the first key press / mouse move
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
      noise = audio.createBuffer(1, audio.sampleRate * 0.25, audio.sampleRate);   // a little "shh" sound
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }
  function tone(freq, start, length, type = 'sine', vol = 0.18) {
    const a = ac(); if (!a || muted) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + start;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + length + 0.02);
  }
  const SOUND = {
    scrub() {                           // brush sound while rubbing (not too often)
      const a = ac(); if (!a || muted) return;
      const now = performance.now(); if (now - lastScrub < 90) return; lastScrub = now;
      const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
      src.buffer = noise;
      f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 1400; f.Q.value = 0.9;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      src.connect(f).connect(g).connect(a.destination);
      src.start(t); src.stop(t + 0.14);
    },
    pop()   { tone(620, 0, 0.08, 'sine', 0.14); tone(930, 0.04, 0.09, 'sine', 0.12); },        // a dust spot is gone
    ding()  { tone(880, 0, 0.5, 'triangle', 0.2); tone(1320, 0.1, 0.6, 'triangle', 0.16); },  // a panel is clean
    yay()   { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, i === 3 ? 0.7 : 0.2, 'square', 0.08)); },  // all clean
  };

  // ================= THE POP-UP (one panel at a time) =================
  const HAND = `<svg width="56" height="64" viewBox="0 0 56 64" aria-hidden="true">
    <g stroke="#2B2A3A" stroke-width="3" stroke-linejoin="round" fill="#F4F2EE">
      <rect x="10" y="8" width="9" height="28" rx="4.5"/><rect x="19" y="3" width="9" height="32" rx="4.5"/>
      <rect x="28" y="5" width="9" height="30" rx="4.5"/><rect x="37" y="11" width="9" height="26" rx="4.5"/>
      <path d="M8 30 Q8 24 13 24 L44 24 Q48 24 48 30 L48 40 Q48 50 38 52 L20 52 Q8 50 8 40 Z"/>
      <path d="M10 34 Q2 30 4 24 Q7 21 12 26 L15 31" />
    </g>
    <rect x="14" y="50" width="30" height="11" rx="4" fill="#F28C3A" stroke="#2B2A3A" stroke-width="3"/>
  </svg>`;

  document.getElementById('mm-toast').insertAdjacentHTML('beforebegin', `
<div class="sd-popup" id="sd-popup" hidden role="dialog" aria-modal="true" aria-labelledby="sd-title">
  <div class="sd-card">
    <button type="button" class="sd-sound" id="sd-sound" aria-label="Sound on" title="Sound on/off">🔊</button>
    <h2 id="sd-title">Clean Panel 1!</h2>
    <p class="sd-msg" id="sd-msg">Move the hand over the dust to wipe it off!</p>
    <div class="sd-power">
      <span>Base power</span>
      <div class="sd-power-bar"><div id="sd-powerBar"></div></div>
      <b id="sd-powerNum">${START_POWER}%</b>
    </div>
    <div class="sd-field" id="sd-field" aria-label="A dusty solar panel. Move the hand with the mouse, your finger or the arrow keys to wipe off the dust.">
      <div class="sd-panel" id="sd-panel">
        <div class="sd-cells">${'<span></span>'.repeat(20)}</div>
        <div id="sd-dustLayer"></div>
        <div class="sd-done">✓ Clean!</div>
      </div>
      <div class="sd-hand" id="sd-hand">${HAND}</div>
    </div>
    <div class="sd-dots" id="sd-dots" aria-hidden="true"></div>
    <p class="sd-fact" id="sd-fact" hidden><b>Real science:</b> dust is a big problem for solar panels on Mars.
      NASA's InSight lander slowly lost power as dust piled up on its panels, and its mission ended in 2022.
      The rovers Spirit and Opportunity were luckier: gusts of wind sometimes blew their panels clean!</p>
    <div class="sd-buttons">
      <button type="button" class="sd-stop" id="sd-stop">Stop for now</button>
      <button type="button" class="sd-back" id="sd-back" hidden>Done</button>
    </div>
  </div>
</div>`);

  // ================= THE MISSION POP-UP (when you first step into the yard) =================
  document.getElementById('mm-toast').insertAdjacentHTML('beforebegin', `
<div class="sd-intro" id="sd-intro" hidden role="dialog" aria-modal="true" aria-labelledby="sd-introTitle">
  <div class="sd-intro-card">
    <svg class="sd-intro-pic" width="120" height="96" viewBox="0 0 120 96" aria-hidden="true">
      <rect x="54" y="78" width="12" height="14" fill="#9AA3AE" stroke="#2B2A3A" stroke-width="3"/>
      <rect x="14" y="6" width="92" height="74" rx="6" fill="#24508F" stroke="#2B2A3A" stroke-width="4"/>
      <g fill="#3F7FDB" stroke="#9CC8F5" stroke-width="1.2">
        <rect x="21" y="13" width="23" height="18" rx="2"/><rect x="49" y="13" width="23" height="18" rx="2"/><rect x="77" y="13" width="23" height="18" rx="2"/>
        <rect x="21" y="35" width="23" height="18" rx="2"/><rect x="49" y="35" width="23" height="18" rx="2"/><rect x="77" y="35" width="23" height="18" rx="2"/>
        <rect x="21" y="57" width="23" height="17" rx="2"/><rect x="49" y="57" width="23" height="17" rx="2"/><rect x="77" y="57" width="23" height="17" rx="2"/>
      </g>
      <g fill="#C98F5E"><circle cx="34" cy="24" r="9"/><circle cx="70" cy="44" r="12"/><circle cx="90" cy="20" r="7"/><circle cx="40" cy="62" r="8"/><circle cx="88" cy="64" r="6"/></g>
    </svg>
    <h2 id="sd-introTitle">Oh no, dusty panels!</h2>
    <p>Mars dust has settled all over the solar panels, so the base is only getting <b>${START_POWER}% power</b>.</p>
    <p>Walk up to each panel and wipe the dust off to get the power back to 100%!</p>
    <p class="sd-intro-rover" id="sd-introRover" hidden>🔧 Also, the <b>rover is broken</b>! Stand next to it to repair it.</p>
    <button type="button" class="sd-intro-go" id="sd-introGo">Let's clean them!</button>
  </div>
</div>`);
  const intro = document.getElementById('sd-intro');
  let introSeen = false;                       // the pop-up shows the first time you step into the yard
  function showIntro() {
    introSeen = true;
    document.getElementById('sd-introRover').hidden = !roverBroken;
    map.releaseKeys();
    map.pause(true);                           // the map waits while you read
    intro.hidden = false;
    document.getElementById('sd-introGo').focus();
  }
  function hideIntro() {
    intro.hidden = true;
    map.pause(false);
    map.status('Mission: clean the 3 solar panels. Walk up to a panel to clean it! (Walk back up to the airlock to go inside.)');
  }
  document.getElementById('sd-introGo').addEventListener('click', hideIntro);
  document.addEventListener('keydown', e => {
    if (intro.hidden) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); hideIntro(); }
  });

  const popup  = document.getElementById('sd-popup');
  const field  = document.getElementById('sd-field');
  const panelEl = document.getElementById('sd-panel');
  const dustLayer = document.getElementById('sd-dustLayer');
  const hand   = document.getElementById('sd-hand');
  const msg    = document.getElementById('sd-msg');
  const mapPanels = [...document.querySelectorAll('[data-sd-panel]')];   // the big panels on the map

  // dust left on every spot: 1 = full, 0 = clean
  const dirt = DUST.map(spots => spots.map(() => 1));
  let current = 0;                  // the panel being cleaned in the pop-up
  let waitPanel = -1;               // the panel just closed: it won't open again until the crew steps away
  let hx = 0, hy = 0;               // the hand's middle, inside the field (pixels)
  const keys = {};
  let rubTimer;

  const panelLeft  = p => dirt[p].reduce((a, b) => a + b, 0) / dirt[p].length;   // 0..1 dust on one panel
  const panelClean = p => dirt[p].every(d => d === 0);
  const allClean   = () => dirt.every((_, p) => panelClean(p));
  const power      = () => Math.round(START_POWER + (100 - START_POWER) * (1 - dirt.flat().reduce((a, b) => a + b, 0) / dirt.flat().length));

  function drawMap() {
    mapPanels.forEach(g => {
      const p = +g.dataset.sdPanel;
      g.querySelector('.sd-map-dust').style.opacity = panelLeft(p);
      g.classList.toggle('sd-clean', panelClean(p));
    });
  }
  function draw() {
    dustLayer.querySelectorAll('.sd-dust').forEach((el, d) => { el.style.opacity = dirt[current][d]; });
    panelEl.classList.toggle('sd-clean', panelClean(current));
    document.getElementById('sd-powerNum').textContent = power() + '%';
    document.getElementById('sd-powerBar').style.width = power() + '%';
    document.getElementById('sd-dots').innerHTML = dirt.map((_, p) =>
      `<span class="${panelClean(p) ? 'sd-dot-done' : ''} ${p === current ? 'sd-dot-now' : ''}">Panel ${p + 1}${panelClean(p) ? ' ✓' : ''}</span>`).join('');
    drawMap();
  }

  function placeHand(x, y) {
    hx = Math.max(0, Math.min(field.clientWidth, x));
    hy = Math.max(0, Math.min(field.clientHeight, y));
    hand.style.left = hx + 'px';
    hand.style.top  = hy + 'px';
  }

  // the hand moved from (ax, ay) to here: wipe the dust it passed over
  function rub(ax, ay) {
    if (panelClean(current)) return;
    const moved = Math.hypot(hx - ax, hy - ay);
    if (!moved) return;
    hand.classList.add('sd-rubbing');
    clearTimeout(rubTimer);
    rubTimer = setTimeout(() => hand.classList.remove('sd-rubbing'), 150);
    let touching = false;
    dustLayer.querySelectorAll('.sd-dust').forEach((el, d) => {
      if (!dirt[current][d]) return;
      const cx = panelEl.offsetLeft + panelEl.clientLeft + el.offsetLeft + el.offsetWidth / 2;
      const cy = panelEl.offsetTop + panelEl.clientTop + el.offsetTop + el.offsetHeight / 2;
      if (Math.hypot(hx - cx, hy - cy) < el.offsetWidth / 2 + HAND_REACH) {
        touching = true;
        dirt[current][d] = Math.max(0, dirt[current][d] - moved * RUB_CLEAN);
        if (dirt[current][d] < 0.04) { dirt[current][d] = 0; SOUND.pop(); }
      }
    });
    if (touching) SOUND.scrub();
    draw();
    if (panelClean(current)) panelDone();
  }

  function panelDone() {
    hand.classList.remove('sd-rubbing');
    popup.classList.add('sd-finished');
    document.getElementById('sd-stop').hidden = true;
    const back = document.getElementById('sd-back');
    back.hidden = false;
    if (allClean()) {
      SOUND.yay();
      msg.textContent = 'All 3 panels are clean! Base power is back to 100%. Great job, crew!';
      document.getElementById('sd-fact').hidden = false;
      back.textContent = 'Back to the base';
    } else {
      SOUND.ding();
      const left = dirt.map((_, p) => p).filter(p => !panelClean(p)).map(p => p + 1);
      msg.textContent = `Panel ${current + 1} is clean! Now walk to Panel ${left.join(' and Panel ')}.`;
      back.textContent = 'Next panel';
    }
    back.focus();
  }

  function open(p) {
    current = p;
    map.releaseKeys();
    map.pause(true);                 // the map waits while you clean
    // put this panel's dust on the big panel
    dustLayer.innerHTML = DUST[p].map(([x, y, s]) =>
      `<div class="sd-dust" style="left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px"></div>`).join('');
    document.getElementById('sd-title').textContent = `Clean Panel ${p + 1}!`;
    msg.textContent = 'Move the hand over the dust to wipe it off!';
    popup.classList.remove('sd-finished');
    document.getElementById('sd-stop').hidden = false;
    document.getElementById('sd-back').hidden = true;
    document.getElementById('sd-fact').hidden = true;
    popup.hidden = false;
    placeHand(field.clientWidth / 2, field.clientHeight - 30);
    draw();
    field.focus();
  }

  function close() {
    popup.hidden = true;
    for (const k in keys) keys[k] = false;
    map.pause(false);
    waitPanel = current;
    if (allClean()) map.status('All solar panels clean, base power 100%! Walk back up to the airlock to go inside.');
    else {
      const left = dirt.map((_, p) => p).filter(p => !panelClean(p)).map(p => `Panel ${p + 1}`);
      map.status(`Base power ${power()}%. Still dusty: ${left.join(', ')}. Walk up to a panel to clean it.`);
    }
  }

  // ---------- moving the hand: mouse / finger ----------
  field.tabIndex = 0;
  function handFromPointer(e) {
    const f = field.getBoundingClientRect();     // the page may be zoomed to fit the window
    placeHand((e.clientX - f.left) * field.clientWidth / f.width, (e.clientY - f.top) * field.clientHeight / f.height);
  }
  field.addEventListener('pointermove', e => { const ax = hx, ay = hy; handFromPointer(e); rub(ax, ay); });
  field.addEventListener('pointerdown', e => { e.preventDefault(); ac(); field.focus(); handFromPointer(e); });

  // ---------- moving the hand: arrow keys / WASD ----------
  const KEYMAP = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
  document.addEventListener('keydown', e => {
    if (popup.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    const dir = KEYMAP[e.key];
    if (!dir || panelClean(current)) return;
    e.preventDefault();
    ac();
    keys[dir] = true;
  });
  document.addEventListener('keyup', e => { const dir = KEYMAP[e.key]; if (dir) keys[dir] = false; });
  let last = performance.now();
  (function keyLoop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!popup.hidden) {
      const dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (dx || dy) {
        const ax = hx, ay = hy, step = KEY_SPEED * dt * (dx && dy ? Math.SQRT1_2 : 1);
        placeHand(hx + dx * step, hy + dy * step);
        rub(ax, ay);
      }
    }
    requestAnimationFrame(keyLoop);
  })(last);

  document.getElementById('sd-stop').addEventListener('click', close);
  document.getElementById('sd-back').addEventListener('click', close);
  const soundBtn = document.getElementById('sd-sound');
  soundBtn.addEventListener('click', () => {
    muted = !muted;
    soundBtn.textContent = muted ? '🔇' : '🔊';
    soundBtn.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on');
    if (!muted) { ac(); SOUND.pop(); }
    field.focus();
  });

  // ================= ROVER REPAIR (a random mission) =================
  // Some Sols the rover breaks down. Stand next to it: the astronaut repairs it while a loading bar fills.
  // Walk away = the repair pauses (it keeps its progress). Add ?repair to the page address to always get it.
  const ROVER_BREAK_CHANCE = 0.5;   // chance the rover is broken on a Sol (about 1 in 2)
  const REPAIR_TIME = 5;            // seconds of repairing to fix it
  const FORCE_REPAIR = new URLSearchParams(location.search).has('repair');
  const ROVER = rectPx(SOLAR.rover);
  let roverBroken = FORCE_REPAIR || Math.random() < ROVER_BREAK_CHANCE;
  let repairDone = 0;               // 0..1
  let repairing = false, lastClank = 0;
  const brokenSign = document.getElementById('sd-roverBroken');
  const repairBar  = document.getElementById('sd-roverBar');
  // the wrench in the astronaut's hand (map pixels, on top of the map)
  map.scene.insertAdjacentHTML('beforeend', `<div class="sd-wrench" id="sd-wrench" hidden aria-hidden="true">
    <svg width="26" height="26" viewBox="0 0 26 26"><path d="M17 3 a6 6 0 0 0 -5.6 8 L3.5 18.9 a2.2 2.2 0 0 0 3.1 3.1 L14.5 14.1 a6 6 0 0 0 8 -5.6 l-3.4 3.4 -3.6 -1 -1 -3.6 Z"
      fill="#B9C2CC" stroke="#2B2A3A" stroke-width="2" stroke-linejoin="round"/></svg>
    <span class="sd-spark"></span><span class="sd-spark sd-spark2"></span></div>`);
  const wrench = document.getElementById('sd-wrench');
  const show = (el, on) => { el.style.display = on ? '' : 'none'; };   // SVG parts: show / hide
  function drawRover() {
    show(brokenSign, roverBroken && !repairing);
    show(repairBar, roverBroken && (repairing || repairDone > 0));
    const pct = Math.round(repairDone * 100);
    document.getElementById('sd-roverBarFill').setAttribute('width', 60 * repairDone);
    document.getElementById('sd-roverBarText').textContent = repairing ? `Repairing… ${pct}%` : `Paused ${pct}%`;
  }
  function setRepairing(on, x, y) {
    if (on !== repairing) {
      repairing = on;
      player.el.classList.toggle('sd-repairing', on);
      wrench.hidden = !on;
      if (on) map.status('Repairing the rover… stay next to it until the bar is full!');
    }
    if (on) {
      const side = Math.sign((ROVER.x1 + ROVER.x2) / 2 - x) || 1;   // the rover is on this side
      player.faceToward(side, 0);
      wrench.style.left = (x + side * 16 - 13) + 'px';
      wrench.style.top  = (y - 34) + 'px';
      wrench.classList.toggle('sd-flip', side < 0);
    }
    drawRover();
  }
  function roverFixed() {
    roverBroken = false;
    setRepairing(false);
    show(repairBar, false);
    SOUND.yay();
    map.toast('Rover repaired! It is ready to drive again. 🚙');
    map.status(allClean() ? 'Rover repaired! Walk back up to the airlock to go inside.'
                          : 'Rover repaired! Now clean the dusty solar panels.');
  }
  // every frame in the yard (called from the walking code below)
  function updateRepair(dt, x, y, moving) {
    if (!roverBroken) return;
    const near = distTo(ROVER, x, y) < TOUCH;
    if (near && !moving) {
      setRepairing(true, x, y);
      repairDone = Math.min(1, repairDone + dt / REPAIR_TIME);
      const now = performance.now();
      if (now - lastClank > 380) { lastClank = now; tone(170 + Math.random() * 60, 0, 0.09, 'square', 0.07); SOUND.scrub(); }
      drawRover();
      if (repairDone >= 1) roverFixed();
    } else if (repairing) {
      setRepairing(false);
      if (repairDone > 0) map.status(`Rover repair paused at ${Math.round(repairDone * 100)}%. Stand next to the rover to keep going.`);
    }
  }
  drawRover();

  // ================= WALKING IN THE YARD =================
  let inYard = false;
  const walkKeys = {};
  const canStand = (px, py) =>
    px > YARD.x1 + EDGE && px < YARD.x2 - EDGE && py > YARD.y1 + EDGE && py < YARD.y2 - EDGE &&
    !BLOCKS.some(b => px > b.x1 - BUMP && px < b.x2 + BUMP && py > b.y1 - BUMP && py < b.y2 + BUMP);

  function goOut() {
    map.leave('left');               // main.js has no ▼ door: leave the Command Center...
    map.setAutopilot(true);          // ...then this code walks the avatar in the yard
    inYard = true;
    map.setPos(OUT[0], OUT[1]);
    player.faceToward(0, 1);
    if (allClean()) {
      map.status(roverBroken ? 'The panels are clean, but the rover is broken! Stand next to it to repair it.'
                             : 'Solar panel yard. The panels are clean! Walk back up to the airlock to go inside.');
    } else if (!introSeen) {
      showIntro();                    // first time out here: "Oh no, dusty panels!"
    } else {
      const left = dirt.map((_, p) => p).filter(p => !panelClean(p)).map(p => `Panel ${p + 1}`);
      map.toast(`Still dusty: ${left.join(', ')}.` + (roverBroken ? ' The rover still needs repair!' : ' Walk up to a panel to clean it!'));
      map.status(`Base power ${power()}%. Walk up to a dusty panel to clean it. (Walk back up to the airlock to go inside.)`);
    }
  }
  function stopYard() {
    inYard = false;
    if (repairing) setRepairing(false);
    for (const k in walkKeys) walkKeys[k] = false;
    map.setAutopilot(false);
  }

  // ▼ in the Command Center = out through the airlock; in the yard the arrow keys walk you around
  map.on('key', dir => {
    if (map.isInside() === 'shelter' && dir === 'down') { goOut(); return true; }
    if (inYard) { walkKeys[dir] = true; return true; }
    return false;
  });
  map.on('keyUp', dir => { walkKeys[dir] = false; });
  map.on('release', () => { for (const k in walkKeys) walkKeys[k] = false; });
  // tell the player about ▼ in the Command Center's "Go out" message
  map.on('enter', place => {
    const st = document.getElementById('mm-status');
    if (place === 'shelter' && st.textContent.includes('Go out:')) st.textContent += ' · ▼ solar panels';
  });

  map.on('update', dt => {
    if (!inYard) return;
    if (map.isInside()) { stopYard(); return; }        // something else took the crew inside
    const dx = (walkKeys.right ? 1 : 0) - (walkKeys.left ? 1 : 0);
    const dy = (walkKeys.down ? 1 : 0) - (walkKeys.up ? 1 : 0);
    let { x, y } = map.getPos();
    if (dx || dy) {
      player.faceToward(dx, dy);
      const step = map.SPEED * dt * (dx && dy ? Math.SQRT1_2 : 1);
      if (canStand(x + dx * step, y + dy * step)) { x += dx * step; y += dy * step; }
      else if (canStand(x + dx * step, y)) x += dx * step;      // slide along a panel or the edge
      else if (canStand(x, y + dy * step)) y += dy * step;
      map.setPos(x, y);
    }
    player.setWalking(!!(dx || dy));
    updateRepair(dt, x, y, !!(dx || dy));
    // back at the airlock = go inside
    if (Math.hypot(x - DOOR[0], y - DOOR[1]) < DOOR_R) { stopYard(); map.enter('shelter'); }
  });

  // ---------- starting the mission on the map ----------
  map.on('afterMove', () => {
    if (!inYard || map.isInside() || !popup.hidden) return;
    const { x, y } = map.getPos();
    if (waitPanel >= 0 && distTo(PANELS[waitPanel], x, y) > AWAY_AGAIN) waitPanel = -1;
    const near = PANELS.findIndex((P, i) => i !== waitPanel && distTo(P, x, y) < TOUCH);
    if (near < 0) return;
    if (panelClean(near)) { map.toast(`Panel ${near + 1} is already clean!`); waitPanel = near; }
    else open(near);
  });

  drawMap();

  // for teammates / testing
  return {
    isClean: allClean,
    roverBroken: () => roverBroken,
    repairProgress: () => repairDone,
    panelClean,
    power,
    open,
  };
})();
window.SolarMission = SolarMission;   // shared, so teammates (and tests) can ask: SolarMission.isClean(), .power()
