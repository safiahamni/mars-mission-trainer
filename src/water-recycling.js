import './life-adapted.css';

// life.js — LIFE SUPPORT: the WATER RECYCLING SYSTEM (Member 2's place).
// Each time the game starts, ONE random problem breaks the water recycler:
//   filter : the filter is clogged  -> grab the dirty filter, throw it in the trash (a new one pops in)
//   brine  : the brine bag is full  -> grab the full bag, throw it in the trash (a new one pops in)
//   water  : germs in the water     -> click the germs to zap them
// Walk into Life Support: the pop-up opens and you fix it. Then the tank fills up. 🎉
// You can see the problem from outside too (on the map).
// Demos: add ?clog (or ?filter), ?brine or ?water to the page address to pick the problem.
// Based on the real Water Recovery System on the International Space Station (NASA).
// This version lives INSIDE the Life Support (Air) room: initWaterRecycler(room, { onClose }).
// Everything here starts with ls- so it can't clash with the room. Its look is in life-adapted.css.

export function initWaterRecycler(room, { onClose, onFull } = {}) {   // onClose: called when the pop-up closes
  if (!room) throw new Error('WaterRecycler needs the existing .room element');
  if (room.querySelector('#ls-water-station')) return window.WaterRecycler;

  const FILL_TIME = 3;              // seconds for the tank to fill once it is fixed

  const GERMS = 6;                  // germs to zap in the bad water problem

  const PROBLEMS = {
    filter: {
      alarm: 'Oh no! The filter is clogged!',
      todo: 'Grab the dirty filter and throw it in the trash 🗑️',
      introTitle: 'Oh no! The filter needs changing!',
      introText: 'It is clogged with dirt, so the water can\'t get through. Throw the dirty filter in the trash and a new one will pop in.',
      fact: 'Filters catch the dirt first. On the International Space Station, the water system recycles 98% of the water ' +
            'astronauts bring with them, even from sweat, breath and urine.',
    },
    brine: {
      alarm: 'Oh no! The brine bag is full!',
      todo: 'Grab the full bag and throw it in the trash 🗑️',
      introTitle: 'Oh no! The brine bag needs changing!',
      introText: 'It is full of salty leftovers from cleaning urine, so the machine stopped. Throw the full bag in the trash and a new one will pop in.',
      fact: 'When urine is cleaned, a salty leftover called brine is left. NASA\'s Brine Processor squeezes the last water out of it, ' +
            'and astronauts really change its bag. It helped the space station reach 98% water recycling.',
    },
    water: {
      alarm: 'Oh no! The Cleaner stopped and germs are getting through!',
      todo: 'Click the germs to zap them! ⚡',
      introTitle: 'Oh no! The Cleaner stopped!',
      introText: 'Dirty water always has germs in it. The Cleaner kills them by heating the water, but it stopped, ' +
                 'so germs are getting into the clean water! Zap every germ to help the Cleaner.',
      fact: 'On the space station, the water passes through a hot "reactor" that kills germs, and a little iodine is added ' +
            'so germs can\'t grow again. Sensors check the water, and if it is not safe it is sent back and cleaned again.',
    },
  };

  const q = new URLSearchParams(location.search);
  const problem = (q.has('clog') || q.has('filter')) ? 'filter' : q.has('brine') ? 'brine' : q.has('water') ? 'water'
                : ['filter', 'brine', 'water'][Math.floor(Math.random() * 3)];
  const P = PROBLEMS[problem];

  let level = 30;                   // % of clean water in the tank
  let fixed = false, full = false;
  let germsLeft = GERMS;

  // ================= WATER STATION INSIDE THE EXISTING ROOM =================
  // a station like the CO2 / MOXIE ones: a title + the same little machine as on the base map.
  // Walk up to it (oxygenchallenge.js opens it), or click it.
  const station = document.createElement('div');
  station.id = 'ls-water-station';
  station.className = 'station ls-water-station ls-water-broken';
  station.setAttribute('role', 'button');
  station.setAttribute('tabindex', '0');
  station.setAttribute('aria-label', 'Water Recycler');
  station.innerHTML = `
    <div class="station-title">Water Recycler</div>
    <svg class="ls-mini-rack" viewBox="482 432 152 74" aria-hidden="true">
      <g id="ls-recycler-map" class="ls-prob-${problem} ls-map-broken">
        <rect x="484" y="434" width="148" height="70" rx="9" fill="#E9EEF3" stroke="#2B2A3A" stroke-width="3"/>
        <rect x="484" y="434" width="148" height="9" rx="4" fill="#B9C2CC"/>
        <path d="M484 443 H632" stroke="#2B2A3A" stroke-width="2"/>
        <circle class="ls-map-light" cx="623" cy="439" r="3.5" stroke="#2B2A3A" stroke-width="1.5"/>
        <path d="M496 472 H620" stroke="#9AA3AE" stroke-width="5" stroke-linecap="round"/>
        <path d="M496 472 H620" stroke="#3EC6F0" stroke-width="2" stroke-dasharray="4 4" class="ls-map-flow"/>
        <rect x="490" y="448" width="28" height="48" rx="5" fill="#FFFFFF" stroke="#2B2A3A" stroke-width="2.5"/>
        <clipPath id="ls-tankClip"><rect x="492" y="450" width="24" height="44" rx="4"/></clipPath>
        <rect id="ls-mapLevel" class="ls-map-water" x="492" y="450" width="24" height="44" clip-path="url(#ls-tankClip)"/>
        <path class="ls-map-drop" d="M504 458 C499 466 499 470 504 473 C509 470 509 466 504 458 Z" stroke="#2B2A3A" stroke-width="1.5"/>
        <rect class="ls-map-filter" x="526" y="448" width="28" height="48" rx="5" stroke="#2B2A3A" stroke-width="2.5"/>
        <path d="M531 456 H549 M531 463 H549 M531 481 H549 M531 488 H549" stroke="#2B2A3A" stroke-width="1.5" opacity="0.5"/>
        <rect x="534" y="469" width="12" height="6" rx="3" fill="#2B2A3A"/>
        <rect x="562" y="448" width="28" height="48" rx="5" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2.5"/>
        <path class="ls-map-bag-flat" d="M569 456 H583 V486 Q576 490 569 486 Z" fill="#E8F7FF" stroke="#2B2A3A" stroke-width="1.5"/>
        <path class="ls-map-bag-full" d="M576 452 C590 452 591 470 588 484 Q576 496 564 484 C561 470 562 452 576 452 Z" fill="#E8C76A" stroke="#2B2A3A" stroke-width="2"/>
        <rect x="598" y="448" width="28" height="48" rx="5" fill="#9B6BFF" stroke="#2B2A3A" stroke-width="2.5"/>
        <path d="M610 456 l7 0 l-4 9 l6 0 l-10 14 l3 -10 l-6 0 Z" fill="#FFD84A" stroke="#2B2A3A" stroke-width="1"/>
      </g>
    </svg>
    <div class="ls-station-state">⚠ Needs fixing</div>`;
  room.appendChild(station);

  // ================= THE POP-UP =================
  const DROP = '<svg viewBox="0 0 20 26" aria-hidden="true"><path d="M10 2 C4 11 3 15 3 18 a7 7 0 0 0 14 0 C17 15 16 11 10 2 Z" fill="#3EC6F0" stroke="#2B2A3A" stroke-width="2"/></svg>';
  const BOLT = '<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><path d="M22 6 h9 l-6 12 h9 l-15 22 l5 -15 h-9 Z" fill="#FFD84A" stroke="#2B2A3A" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  room.insertAdjacentHTML('beforeend', `
<div class="ls-popup" id="ls-popup" hidden role="dialog" aria-modal="true" aria-labelledby="ls-title">
  <div class="ls-card">
    <h2 id="ls-title">Water Recycling System</h2>
    <p class="ls-alarm" id="ls-alarm"></p>
    <p class="ls-todo" id="ls-todo"></p>
    <div class="ls-stage">
      <div class="ls-machine" id="ls-machine">
        <div class="ls-rack-top"><i class="ls-led"></i><b>WATER RECOVERY SYSTEM</b><i class="ls-screw"></i><i class="ls-screw"></i></div>
        <div class="ls-bays">
          <div class="ls-part" id="ls-inPart"><span>1. Dirty water in</span><div class="ls-box ls-inlet"><div class="ls-dirty-water"><i></i><i></i><i></i><i></i><i></i></div></div></div>
          <div class="ls-part" id="ls-filterPart"><span>2. Filter</span><div class="ls-box ls-slot" id="ls-filterSlot"></div></div>
          <div class="ls-part" id="ls-bagPart"><span>3. Brine bag</span><div class="ls-box ls-slot ls-bag-bay" id="ls-bagSlot"></div></div>
          <div class="ls-part" id="ls-cleanPart"><span>4. Cleaner</span><div class="ls-box ls-cleaner">${BOLT}<i class="ls-vents"></i></div></div>
          <div class="ls-part" id="ls-tankPart"><span>5. Clean water</span><div class="ls-box ls-tank"><div class="ls-drips">${DROP}${DROP}${DROP}</div><div id="ls-tankFill"></div><b id="ls-tankNum"></b></div></div>
          <div class="ls-germs" id="ls-germs"></div>
        </div>
        <div class="ls-rack-base"></div>
      </div>
      <div class="ls-tools" id="ls-tools"></div>
    </div>
    <div class="ls-confetti" id="ls-confetti"></div>
    <!-- the first pop-up: what needs fixing -->
    <div class="ls-intro" id="ls-intro" hidden>
      <div class="ls-intro-card" role="alertdialog" aria-labelledby="ls-introTitle">
        <div class="ls-intro-icon" id="ls-introIcon"></div>
        <h3 id="ls-introTitle"></h3>
        <p id="ls-introText"></p>
        <button type="button" class="ls-intro-go" id="ls-introGo">Let's fix it!</button>
      </div>
    </div>
    <p class="ls-fact" id="ls-fact" hidden></p>
    <button type="button" class="ls-done" id="ls-done" hidden>Done</button>
  </div>
</div>`);
  const $ = id => document.getElementById(id);
  const popup = $('ls-popup');
  station.addEventListener('click', open);
  station.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

  // ================= SOUNDS (made by the browser) =================
  let audio = null;
  function tone(freq, start, len, type = 'sine', vol = 0.15) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    audio = audio || new AC(); if (audio.state === 'suspended') audio.resume();
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + start;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(audio.destination); o.start(t); o.stop(t + len + 0.02);
  }
  const alarm = () => [0, 0.3, 0.6].forEach(s => { tone(880, s, 0.12, 'square', 0.06); tone(660, s + 0.14, 0.12, 'square', 0.06); });
  const snap  = () => { tone(520, 0, 0.08); tone(900, 0.05, 0.1); };
  const buzz  = () => tone(140, 0, 0.25, 'sawtooth', 0.08);
  const zap   = () => [0, 0.25, 0.5, 0.75, 1.0].forEach(s => tone(300 + Math.random() * 600, s, 0.15, 'sawtooth', 0.05));
  const yay   = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, i === 3 ? 0.6 : 0.18, 'triangle', 0.14));

  // ================= LITTLE PIECES (drawn with HTML + CSS) =================
  const filterItem = (id, dirty, on, isNew) => `<button type="button" class="ls-item ls-filter-item${dirty ? ' ls-dirty' : ''}${isNew ? ' ls-new' : ''}" id="${id}"${on ? '' : ' disabled'} aria-label="${dirty ? 'Dirty' : 'Clean'} filter"><i></i></button>`;
  const bagItem    = (id, isFull, on, isNew) => `<button type="button" class="ls-item ls-bag-item${isFull ? ' ls-full' : ''}${isNew ? ' ls-new' : ''}" id="${id}"${on ? '' : ' disabled'} aria-label="${isFull ? 'Full' : 'Empty'} brine bag"></button>`;
  // where the germs sit (in % of the machine)
  const GERM_SPOTS = [[48, 6], [68, 8], [88, 5], [66, 50], [50, 91], [80, 90]];   // 3 in the dirty water, 1 in a pipe, 2 in the tank

  // ================= DRAW EVERYTHING =================
  function render() {
    const alarmEl = $('ls-alarm');
    alarmEl.textContent = full ? 'Great job, crew! The tank is full! 🎉'
                        : fixed ? 'Fixed! Here comes the clean water…' : '⚠ ' + P.alarm;
    alarmEl.classList.toggle('ls-ok', fixed);
    $('ls-todo').textContent = fixed ? '' : P.todo + (problem === 'water' ? `  (${germsLeft} left)` : '');
    $('ls-todo').hidden = fixed;

    // the broken part flashes red
    const broken = { filter: 'ls-filterPart', brine: 'ls-bagPart', water: 'ls-cleanPart' }[problem];
    ['ls-tankPart', 'ls-filterPart', 'ls-bagPart', 'ls-cleanPart'].forEach(id => $(id).classList.toggle('ls-alert', !fixed && id === broken));
    $('ls-machine').classList.toggle('ls-flowing', fixed);
    $('ls-machine').classList.toggle('ls-broken', !fixed);
    $('ls-machine').classList.toggle('ls-bad-water', problem === 'water' && !fixed);

    // what is inside the machine
    $('ls-filterSlot').innerHTML = (problem === 'filter' && !fixed) ? filterItem('ls-oldFilter', true, true)
                                 : filterItem('ls-fIn', false, false, problem === 'filter');
    $('ls-bagSlot').innerHTML = (problem === 'brine' && !fixed) ? bagItem('ls-fullBag', true, true)
                              : bagItem('ls-bIn', false, false, problem === 'brine');

    // the trash on the right (not needed for germs)
    const side = problem !== 'water';
    document.querySelector('.ls-stage').classList.toggle('ls-no-side', !side);
    $('ls-tools').innerHTML = side ? `<div class="ls-trash${fixed ? ' ls-gulp' : ''}" id="ls-trash"><b class="ls-emoji">🗑️</b><span>Trash</span></div>` : '';

    // germs
    $('ls-germs').innerHTML = (problem === 'water' && !fixed)
      ? GERM_SPOTS.slice(0, GERMS).map(([x, y], i) => `<button type="button" class="ls-germ" data-i="${i}" style="left:${x}%;top:${y}%;animation-delay:${-i * 0.37}s" aria-label="Germ">🦠</button>`).join('')
      : '';
    $('ls-germs').querySelectorAll('.ls-germ').forEach((g, i) => { if (i >= germsLeft) g.remove(); else g.onclick = () => zapGerm(g); });

    if (problem === 'filter' && !fixed) drag('ls-oldFilter', 'ls-trash');
    if (problem === 'brine' && !fixed) drag('ls-fullBag', 'ls-trash');

    $('ls-fact').hidden = !full;
    $('ls-fact').innerHTML = '<b>Real NASA science:</b> ' + P.fact;
    $('ls-done').hidden = !full;
    drawTank();
  }

  function drawTank() {
    $('ls-tankFill').style.height = level + '%';
    $('ls-tankNum').textContent = Math.round(level) + '%';
    const h = 44 * level / 100, lv = $('ls-mapLevel');        // the little machine in the room fills up too
    lv.setAttribute('y', 494 - h); lv.setAttribute('height', h);
  }
  function fix() {
    fixed = true;
    station.classList.add('ls-water-fixed'); station.classList.remove('ls-water-broken');
    $('ls-recycler-map').classList.remove('ls-map-broken');
    station.querySelector('.ls-station-state').textContent = '✓ Repaired';
    render();
  }

  // ================= GERMS: click to zap =================
  function zapGerm(g) {
    if (g.classList.contains('ls-zapped')) return;
    g.classList.add('ls-zapped');
    tone(900, 0, 0.06, 'square', 0.07); tone(1400, 0.05, 0.12, 'triangle', 0.1);
    const cl = $('ls-cleanPart'); cl.classList.add('ls-zap');      // the Cleaner flashes: you're helping it
    tone(220, 0.02, 0.18, 'sawtooth', 0.05);
    setTimeout(() => cl.classList.remove('ls-zap'), 350);
    germsLeft--;
    $('ls-todo').textContent = P.todo + `  (${germsLeft} left)`;
    setTimeout(() => { g.remove(); if (germsLeft === 0 && !fixed) fix(); }, 300);
  }

  // ================= DRAG TO THE TRASH (or just click) =================
  function drag(id, targetId) {
    const el = $(id), target = $(targetId);
    target.classList.add('ls-target');                       // glows: "drop it here"
    let sx = 0, sy = 0, down = false, moved = false, dragged = false, used = false, zoom = 1;
    const NEAR = 40;                                         // "close enough" (pixels): easy to hit
    const over = () => {                                     // is the thing you hold touching (or near) the trash?
      const a = el.getBoundingClientRect(), r = target.getBoundingClientRect();
      return a.right > r.left - NEAR && a.left < r.right + NEAR && a.bottom > r.top - NEAR && a.top < r.bottom + NEAR;
    };
    el.addEventListener('pointerdown', e => {
      down = true; moved = false; dragged = false; sx = e.clientX; sy = e.clientY;
      const r = el.getBoundingClientRect();                     // the glove grabs where you clicked
      el.style.setProperty('--hx', (e.clientX - r.left) + 'px'); el.style.setProperty('--hy', (e.clientY - r.top) + 'px');
      const card = popup.querySelector('.ls-card');            // the page may be shrunk to fit the screen
      zoom = card.getBoundingClientRect().width / card.offsetWidth || 1;
      el.setPointerCapture(e.pointerId); el.classList.add('ls-dragging');
    });
    el.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = (e.clientX - sx) / zoom, dy = (e.clientY - sy) / zoom;   // so it stays under the mouse
      if (Math.hypot(dx, dy) > 6) moved = true;
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(-6deg)`;
      const near = over();
      if (near && !target.classList.contains('ls-hover')) tone(660, 0, 0.06, 'triangle', 0.08);   // little "pop!"
      target.classList.toggle('ls-hover', near);
    });
    el.addEventListener('pointerup', e => {
      if (!down) return;
      const near = over();                                     // check BEFORE letting go (the filter shakes again after)
      down = false; el.classList.remove('ls-dragging'); target.classList.remove('ls-hover');
      if (!moved) { el.style.transform = ''; return; }        // a plain click: the click handler does it
      dragged = true;
      if (near) dropped(); else { el.style.transform = ''; buzz(); }
    });
    el.addEventListener('pointercancel', () => { down = false; el.style.transform = ''; el.classList.remove('ls-dragging'); });
    el.addEventListener('click', () => { if (dragged) { dragged = false; return; } dropped(); });
    function dropped() {
      if (used) return; used = true;
      snap(); setTimeout(snap, 250);                          // in the trash... and the new one pops in
      target.classList.remove('ls-target', 'ls-hover'); target.classList.add('ls-gulp');
      fix();
    }
  }

  // ================= HOORAY: stars fly up =================
  function confetti() {
    const c = $('ls-confetti');
    c.innerHTML = Array.from({ length: 18 }, (_, i) =>
      `<span style="left:${5 + Math.random() * 90}%;animation-delay:${Math.random() * 0.4}s">${['⭐', '💧', '✨'][i % 3]}</span>`).join('');
    setTimeout(() => { c.innerHTML = ''; }, 2200);
  }

  // ================= TIMER: filling the tank =================
  let last = performance.now();
  (function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!popup.hidden && fixed && !full) {
      level = Math.min(100, level + dt * 70 / FILL_TIME);
      if (level >= 100) { full = true; onFull?.(); yay(); confetti(); render(); $('ls-done').focus(); }
      else drawTank();
    }
    requestAnimationFrame(tick);
  })(last);

  // ================= OPEN / CLOSE =================
  function open() {
    popup.hidden = false;
    render();
    if (!fixed) alarm();
    if (!fixed && !introSeen) { showIntro(); return; }
    const first = popup.querySelector('.ls-item:not([disabled]), .ls-germ, #ls-done:not([hidden])');
    if (first) first.focus();
  }
  function close() {
    if (popup.hidden) return;
    popup.hidden = true;
    if (onClose) onClose();
  }
  $('ls-done').addEventListener('click', close);

  // ================= THE FIRST POP-UP: "Oh no! ... needs changing!" =================
  let introSeen = false;
  function showIntro() {
    $('ls-introIcon').innerHTML = problem === 'filter' ? filterItem('ls-iconFilter', true, false)
                                : problem === 'brine' ? bagItem('ls-iconBag', true, false) : '<b>🦠</b>';
    $('ls-introTitle').textContent = P.introTitle;
    $('ls-introText').textContent = P.introText;
    $('ls-intro').hidden = false;
    $('ls-introGo').focus();
  }
  $('ls-introGo').addEventListener('click', () => {
    introSeen = true;
    $('ls-intro').hidden = true;
    snap();
    const first = popup.querySelector('.ls-item:not([disabled]), .ls-germ');
    if (first) first.focus();
  });
  document.addEventListener('keydown', e => { if (!popup.hidden && e.key === 'Escape') close(); });

  drawTank();

  const WaterRecycler = {
    problem: () => problem,
    isFixed: () => fixed,
    isClogged: () => !fixed && problem === 'filter',
    level: () => level,
    syncLevel(value) {
      level = value;
      full = level >= 100;
      render();
    },
    open,
    close,
    isOpen: () => !popup.hidden,
    station,                       // the station in the room (to check if the astronaut is near it)
  };
  window.WaterRecycler = WaterRecycler;
  return WaterRecycler;
}
