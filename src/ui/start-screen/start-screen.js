// =========================================================
//  MARTIANAUTS START SCREEN
//  Shows a full-screen menu (PLAY) before the game, then the spaceship landing,
//  then a short tour of the base (Welcome card + a spotlight on each place).
//  The game waits (MarsMap.pause) until the player presses PLAY.
//  Load it after the map + side panel and BEFORE the places (src/main.js). Skip it with  ?nostart  in the address.
// =========================================================
(function () {
  const map = window.MarsMap || (typeof MarsMap !== 'undefined' ? MarsMap : null);
  if (/[?&]nostart\b/.test(location.search)) return;

  // ---------- the astronaut (same look as the team astronaut) ----------
  const INK = '#2B2A3A', TRIM = '#F28C3A', VISOR = '#A9DDE0';
  function astronaut() {
    return `
  <rect x="-32" y="-8" width="64" height="44" rx="12" fill="#B9C2CC" stroke="${INK}" stroke-width="4"/>
  <rect x="-40" y="0" width="16" height="34" rx="8" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>
  <circle cx="-32" cy="36" r="8" fill="${TRIM}" stroke="${INK}" stroke-width="4"/>
  <g class="st-wave"><rect x="24" y="-28" width="16" height="36" rx="8" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>
    <circle cx="32" cy="-30" r="8" fill="${TRIM}" stroke="${INK}" stroke-width="4"/></g>
  <rect x="-26" y="-6" width="52" height="50" rx="16" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>
  <rect x="-12" y="6" width="24" height="18" rx="4" fill="${TRIM}" stroke="${INK}" stroke-width="3"/>
  <circle cx="-5" cy="15" r="2.2" fill="#3EC6F0"/><circle cx="1" cy="15" r="2.2" fill="#5CE0B5"/><circle cx="7" cy="15" r="2.2" fill="#FFD84A"/>
  <rect x="-20" y="40" width="17" height="20" rx="5" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>
  <rect x="3" y="40" width="17" height="20" rx="5" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>
  <rect x="-20" y="50" width="17" height="4" fill="${TRIM}"/><rect x="3" y="50" width="17" height="4" fill="${TRIM}"/>
  <rect x="-23" y="56" width="21" height="12" rx="5" fill="#3A3950" stroke="${INK}" stroke-width="3"/>
  <rect x="2" y="56" width="21" height="12" rx="5" fill="#3A3950" stroke="${INK}" stroke-width="3"/>
  <circle cx="0" cy="-34" r="34" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>
  <ellipse cx="0" cy="-32" rx="24" ry="21" fill="${VISOR}" stroke="${INK}" stroke-width="3.5"/>
  <path d="M-18 -42 Q-6 -54 14 -46 Q8 -40 -2 -40 Q-12 -40 -18 -42 Z" fill="#3A3950"/>
  <circle cx="-8" cy="-31" r="2.6" fill="${INK}"/><circle cx="8" cy="-31" r="2.6" fill="${INK}"/>
  <path d="M-6 -23 Q0 -18 6 -23" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-16 -44 Q-12 -50 -4 -51" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  <circle class="st-light" cx="-24" cy="-58" r="6" fill="${TRIM}" stroke="${INK}" stroke-width="3"/>`;
  }

  // the little astronaut head that is the second "A" of the title (MARTIAN-A-UTS):
  // a round helmet inside a big orange A (the helmet is the A's crossbar, with a light at the tip)
  const A_POLE = 'M6 58 L30 -18 L54 58';
  const HELMET = `<svg class="st-helmet" viewBox="0 0 60 62" aria-hidden="true">
    <path d="${A_POLE}" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${A_POLE}" fill="none" stroke="#FF8A3D" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="30" cy="31" r="27" fill="#fff" stroke="${INK}" stroke-width="5"/>
    <rect x="11" y="17" width="38" height="28" rx="14" fill="${VISOR}" stroke="${INK}" stroke-width="4"/>
    <circle cx="24" cy="30" r="2.6" fill="${INK}"/><circle cx="36" cy="30" r="2.6" fill="${INK}"/>
    <path d="M25 36 Q30 40 35 36" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="18" cy="22" rx="4" ry="2.4" fill="#fff" opacity=".8"/>
    <circle class="st-light" cx="30" cy="-24" r="5.5" fill="${TRIM}" stroke="${INK}" stroke-width="2.5"/></svg>`;

  const title = [...'MARTIANAUTS'].map((ch, i) =>
    `<span style="animation-delay:${(i * 0.12).toFixed(2)}s">${i === 7 ? HELMET : ch}</span>`).join('');

  // stars (fixed pattern so it looks the same every time)
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let stars = '';
  for (let i = 0; i < 170; i++) {
    stars += `<circle class="${i % 4 ? '' : 'st-star'}" style="animation-delay:${(rnd() * 3).toFixed(2)}s" cx="${(rnd() * 1600) | 0}" cy="${(rnd() * 650) | 0}" r="${[1, 1, 1.5, 2, 2.5][(rnd() * 5) | 0]}" fill="#fff" opacity="${[0.5, 0.7, 0.9, 1][(rnd() * 4) | 0]}"/>`;
  }

  // ---------- build the screen ----------
  const el = document.createElement('div');
  el.className = 'st-screen';
  el.innerHTML = `
  <svg class="st-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    ${stars}
    <path d="M0 690 C280 630 520 720 820 668 C1080 622 1330 690 1600 640 V900 H0Z" fill="#C65A30" stroke="${INK}" stroke-width="6"/>
    <path d="M0 770 C330 735 650 790 960 755 C1200 728 1420 760 1600 748 V900 H0Z" fill="#B24E29"/>
    <g fill="#A9471F" stroke="${INK}" stroke-width="4" stroke-linejoin="round">
      <polygon points="1240,702 1262,688 1280,704 1266,720 1244,716"/>
      <polygon points="180,800 196,790 210,802 200,814 184,812"/>
      <polygon points="1460,790 1480,780 1494,794 1482,806 1464,802"/>
    </g>
    <g transform="translate(250 600)">
      <rect x="0" y="0" width="190" height="84" rx="20" fill="#E6E4EA" stroke="${INK}" stroke-width="6"/>
      <path d="M24 0 Q95 -54 166 0" fill="#E6E4EA" stroke="${INK}" stroke-width="6"/>
      <rect x="22" y="18" width="146" height="38" rx="12" fill="#9FD3F2" stroke="${INK}" stroke-width="5"/>
      <line x1="150" y1="-30" x2="150" y2="-70" stroke="${INK}" stroke-width="5"/>
      <path d="M150 -70 L186 -60 L150 -50Z" fill="${TRIM}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    </g>
    <path d="M440 700 C560 712 700 708 900 714" fill="none" stroke="#9C3E22" stroke-width="6" stroke-dasharray="4 14" stroke-linecap="round" opacity=".7"/>
    <g transform="translate(1010 640) scale(1.7)"><g class="st-astro">${astronaut()}</g></g>
  </svg>

  <div class="st-front">
    <div class="st-title" role="heading" aria-level="1" aria-label="Martianauts">${title}</div>
    <div class="st-tag">ONE ASTRONAUT · ONE MARS BASE · SURVIVE</div>
    <div class="st-menu">
      <button type="button" class="st-btn st-play" id="st-play">PLAY</button>
    </div>
  </div>
  `;
  document.body.appendChild(el);

  // ---------- keep the game waiting while the menu is up ----------
  // Other pop-ups may call MarsMap.pause() meanwhile; remember what they wanted.
  let open = true, wanted = false;
  if (map && map.pause) {
    const realPause = map.pause.bind(map);
    wanted = map.isPaused ? map.isPaused() : false;
    map.pause = v => { wanted = !!v; if (!open) realPause(v); };
    realPause(true);
    el._restore = () => { map.pause = realPause; realPause(wanted); };
  }

  // ---------- sounds (tiny, made in the browser) ----------
  let ctx;
  function beep(freqs, len = 0.09) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * len;
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + len * 1.6);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + len * 1.7);
      });
    } catch (e) { /* no sound, that's fine */ }
  }


  // ---------- PLAY: hide the menu, then the spaceship drops the astronaut at the Command Center ----------
  let menu = true;        // the menu is on screen
  let skipIntro = null;   // set while the landing animation plays

  function play() {
    if (!menu) return;
    menu = false;
    beep([523, 659, 784, 1047]);
    el.classList.add('st-hide');
    setTimeout(() => { el.hidden = true; }, 650);
    landing(() => tour(startGame));
  }

  function startGame() {
    if (!open) return;
    open = false;                              // keys and the game clock start now
    if (map && map.releaseKeys) map.releaseKeys();
    if (el._restore) el._restore();
    if (map && map.toast) map.toast('You landed on Mars! First mission: walk up the road to the Science Lab.');
  }

  // a "whoosh" sound that slides from one pitch to another
  function whoosh(from, to, len) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = 'sawtooth'; o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + len);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + len * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + len + 0.05);
    } catch (e) { /* no sound */ }
  }

  const SHIP = `<svg viewBox="-80 -70 160 170" width="150" height="160" aria-hidden="true">
    <g class="st-flame"><path d="M-16 52 Q0 100 16 52 Z" fill="#FFD84A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-8 52 Q0 80 8 52 Z" fill="#FF8A3D"/></g>
    <path d="M-34 30 L-58 62 L-30 52 Z" fill="${TRIM}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M34 30 L58 62 L30 52 Z" fill="${TRIM}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="-20" y="40" width="40" height="16" rx="5" fill="#B9C2CC" stroke="${INK}" stroke-width="4"/>
    <path d="M0 -62 C34 -50 42 -6 38 46 L-38 46 C-42 -6 -34 -50 0 -62 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M-39 18 L39 18 L38.6 30 L-38.6 30 Z" fill="${TRIM}" stroke="${INK}" stroke-width="3"/>
    <circle cx="0" cy="-14" r="17" fill="${VISOR}" stroke="${INK}" stroke-width="5"/>
    <path d="M-9 -21 Q-5 -27 2 -27" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="0" cy="-58" r="5" fill="#FF7AA8" stroke="${INK}" stroke-width="3"/>
  </svg>`;

  function landing(done) {
    // WHERE TO DROP: on the road just above the Command Center (the Science Lab road),
    // where the astronaut stands after going out by ▲.  Falls back to the Command Center building.
    let tx, ty, onRoad = false;
    const ex = map && map.PLACES && map.PLACES.shelter && map.PLACES.shelter.exits && map.PLACES.shelter.exits.up;
    const sc = map && map.scene;
    if (ex && sc && sc.offsetWidth) {
      const sr = sc.getBoundingClientRect(), k = sr.width / sc.offsetWidth;   // in case the page is zoomed
      tx = sr.left + (sc.clientLeft + ex.x) * k;
      ty = sr.top + (sc.clientTop + ex.y) * k;                                 // the astronaut's feet
      onRoad = true;
    } else {
      const cc = document.querySelector('#place-shelter .cc-wall') || document.querySelector('#place-shelter .mm-spot') ||
                 document.getElementById('place-shelter');
      const r = cc ? cc.getBoundingClientRect() : null;
      if (r && r.width) { tx = r.left + r.width / 2; ty = r.top + r.height / 2; }
    }
    if (tx === undefined || !document.body.animate) { done(); return; }
    // put the real avatar on the road (outside, facing up the road), like walking out by ▲
    let placed = false;
    const putAstronaut = () => {
      if (placed || !onRoad) return;
      placed = true;
      if (map.isInside && map.isInside() === 'shelter' && map.leave) map.leave('up');
    };
    const hoverY = Math.max(90, ty - 190);
    const W = window.innerWidth;

    const box = document.createElement('div');
    box.className = 'st-intro';
    box.innerHTML = `
      <div class="st-ishadow"></div>
      <div class="st-beam"></div>
      <div class="st-drop"><svg viewBox="-45 -100 90 175" width="54" height="105" aria-hidden="true">${astronaut()}</svg></div>
      <div class="st-puff"></div>
      <div class="st-ship">${SHIP}</div>
      <div class="st-skip">click or press Enter to skip</div>`;
    document.body.appendChild(box);
    const q = c => box.querySelector(c);
    const at = (x, y) => `translate(${x}px, ${y}px)`;
    const anims = [];
    const go = (node, frames, opt) => anims.push(node.animate(frames, { fill: 'both', ...opt }));

    // 1. fly in from the top-left and stop above the Command Center
    go(q('.st-ship'), [
      { transform: at(-220, -220) + ' rotate(28deg)' },
      { transform: at(tx - 75, hoverY - 120) + ' rotate(-6deg)', offset: 0.85 },
      { transform: at(tx - 75, hoverY - 80) + ' rotate(0deg)' }], { duration: 1700, easing: 'ease-out' });
    go(q('.st-ishadow'), [
      { transform: at(tx - 60, ty - 10) + ' scale(.2)', opacity: 0 },
      { transform: at(tx - 60, ty - 10) + ' scale(1)', opacity: 1 }], { duration: 1700, easing: 'ease-out' });
    // 2. hover wobble + light beam
    go(q('.st-ship'), [
      { transform: at(tx - 75, hoverY - 80) },
      { transform: at(tx - 75, hoverY - 88) },
      { transform: at(tx - 75, hoverY - 80) }], { duration: 1600, delay: 1700, easing: 'ease-in-out', fill: 'none' });
    const beam = q('.st-beam');
    beam.style.left = (tx - 55) + 'px'; beam.style.top = (hoverY - 4) + 'px'; beam.style.height = (ty - hoverY + 10) + 'px';
    go(beam, [{ opacity: 0, transform: 'scaleY(0)' }, { opacity: 1, transform: 'scaleY(1)' }], { duration: 350, delay: 1750, easing: 'ease-out' });
    // 3. the astronaut floats down the beam into the Command Center
    const footY = 101;                        // the drop drawing's feet, from its top (px)
    const endS = onRoad ? 0.42 : 0.3;         // about the size of the avatar on the map
    go(q('.st-drop'), [
      { transform: at(tx - 27, hoverY - 40) + ' scale(.9) rotate(0deg)', opacity: 0 },
      { transform: at(tx - 27, hoverY - 20) + ' scale(.9) rotate(-8deg)', opacity: 1, offset: 0.15 },
      { transform: at(tx - 27, ty - footY) + ` scale(${endS}) rotate(6deg)`, opacity: 1, offset: 0.85 },
      { transform: at(tx - 27, ty - footY) + ` scale(${endS}) rotate(0deg)`, opacity: 0 }], { duration: 1400, delay: 2050, easing: 'ease-in-out' });
    go(q('.st-puff'), [
      { transform: at(tx - 40, ty - 40) + ' scale(.2)', opacity: 0 },
      { transform: at(tx - 40, ty - 40) + ' scale(.4)', opacity: 1, offset: 0.2 },
      { transform: at(tx - 40, ty - 40) + ' scale(1.3)', opacity: 0 }], { duration: 700, delay: 3300, easing: 'ease-out' });
    go(beam, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 3550, fill: 'forwards' });
    // 4. fly away to the top-right
    go(q('.st-ship'), [
      { transform: at(tx - 75, hoverY - 80) + ' rotate(0deg)' },
      { transform: at(W + 200, -260) + ' rotate(35deg)' }], { duration: 1200, delay: 3800, easing: 'ease-in', fill: 'forwards' });
    go(q('.st-ishadow'), [{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 3800, fill: 'forwards' });

    const timers = [
      setTimeout(() => whoosh(900, 160, 1.4), 0),
      setTimeout(() => beep([440, 554, 659], 0.12), 1800),
      setTimeout(() => beep([330], 0.2), 3300),
      setTimeout(putAstronaut, 3250),
      setTimeout(() => whoosh(180, 1000, 1.1), 3800),
    ];
    let ended = false;
    function end() {
      if (ended) return;
      ended = true; skipIntro = null;
      timers.forEach(clearTimeout);
      anims.forEach(a => a.cancel());
      putAstronaut();
      box.classList.add('st-intro-out');
      setTimeout(() => box.remove(), 300);
      done();
    }
    timers.push(setTimeout(end, 5000));
    skipIntro = end;
    box.addEventListener('click', end);
  }


  // =========================================================
  //  TOUR: "Welcome to Mars!" + a spotlight on each place (Next / Back / Skip)
  // =========================================================
  // Each place: CSS selectors to light up (all matches together), or a spot in map design numbers
  // (the same numbers as the map drawing in index.html) if the selector isn't on the page.
  const PLACES = [
    { sel: ['#place-shelter .cc-wall'], alt: ['#place-shelter .mm-spot'], pad: [44, 12, 12, 12], side: 'right', ico: '🏠', title: 'Command Center',
      text: 'Your home on Mars! Sleep here, check today’s missions and switch on the power. In a solar storm, hide in the <b>storm shelter core</b> inside.',
      fact: '<b>NASA:</b> on the Space Station, astronauts also sleep in tiny cabins and get their jobs from Mission Control.' },
    { sel: ['#sd-airlock'], design: [218, 339, 89, 42], side: 'right', ico: '🚪', title: 'Airlock',
      text: 'The door between inside and outside. It keeps the air <b>inside</b> the base. Put on your spacesuit before you step out!',
      fact: '<b>NASA:</b> the Space Station’s airlock is called <b>Quest</b>. Spacewalkers get ready there.' },
    { sel: ['.sd-map-panel'], pad: [26, 12, 12, 12], side: 'top', ico: '☀️', title: 'Solar panels',
      text: 'They turn <b>sunlight</b> into electricity for the whole base. Mars dust covers them, so <b>clean them</b> to get the power back!',
      fact: '<b>NASA:</b> the rover Opportunity got its dusty panels cleaned by lucky Mars winds!' },
    { design: [-10, 402, 70, 128], side: 'right', ico: '🚙', title: 'Rover',
      text: 'Your Mars car! Drive it to explore places too far to walk. If it breaks down, <b>fix it</b> with your tools.',
      fact: '<b>NASA:</b> the Curiosity and Perseverance rovers are each about the size of a car.' },
    { sel: ['#place-greenhouse'], side: 'right', ico: '🌱', title: 'Greenhouse',
      text: 'Grow your own <b>food</b> here, like lettuce and potatoes. Plants also help make <b>oxygen</b> to breathe.',
      fact: '<b>NASA:</b> astronauts grew and ate lettuce on the Space Station with a garden called <b>Veggie</b>.' },
    { sel: ['#place-life'], side: 'left', ico: '💧', title: 'Life Support',
      text: 'Makes <b>clean air</b> and <b>recycles water</b>. When it breaks, change the filter, empty the brine bag and zap the germs!',
      fact: '<b>NASA:</b> the Space Station recycles about <b>98%</b> of its water, even sweat!' },
    { sel: ['.sc-zone-cliff'], design: [284, 40, 134, 145], side: 'left', ico: '⛰️', title: 'Cliff',
      text: 'Tall cliffs block part of the sky, so <b>less space radiation</b> reaches you. The cliff route is a little safer!',
      fact: '<b>NASA:</b> next to a small cliff, the Curiosity rover measured about <b>4% less</b> radiation.' },
    { sel: ['#place-lab'], side: 'left', ico: '🔬', title: 'Science Lab',
      text: 'Study Mars <b>rocks and soil</b> here. Today’s mission: walk up the road and reach the lab. Pick the safest route!',
      fact: '<b>NASA:</b> Perseverance is collecting Mars rock samples to send back to Earth one day.' },
  ];
  let tourKey = null;        // the keyboard handler while the tour is on screen

  // where a place is on the screen right now: {x, y, w, h}
  function placeRect(pl) {
    let R = null;
    const add = r => {
      if (!r.width && !r.height) return;
      R = R ? { l: Math.min(R.l, r.left), t: Math.min(R.t, r.top), r: Math.max(R.r, r.right), b: Math.max(R.b, r.bottom) }
            : { l: r.left, t: r.top, r: r.right, b: r.bottom };
    };
    for (const list of [pl.sel, pl.alt]) {
      if (R || !list) continue;
      list.forEach(sel => document.querySelectorAll(sel).forEach(e => add(e.getBoundingClientRect())));
    }
    if (!R && pl.design) {                 // map design numbers -> screen
      const g = document.getElementById('place-shelter')?.parentNode;
      const m = g && g.getScreenCTM && g.getScreenCTM();
      if (m) {
        const [x, y, w, h] = pl.design;
        const a = new DOMPoint(x, y).matrixTransform(m), b = new DOMPoint(x + w, y + h).matrixTransform(m);
        R = { l: a.x, t: a.y, r: b.x, b: b.y };
      }
    }
    if (!R) return null;
    const [pt, pr, pb, pl2] = pl.pad || [12, 12, 12, 12];
    return { x: R.l - pl2, y: R.t - pt, w: R.r - R.l + pl2 + pr, h: R.b - R.t + pt + pb };
  }

  function tour(done) {
    const N = PLACES.length;
    const wrap = document.createElement('div');
    wrap.className = 'tt';
    wrap.innerHTML = `
      <div class="tt-block"></div>
      <div class="tt-hole" hidden></div>
      <button type="button" class="tt-skip" hidden>Skip tour ✕</button>
      <div class="tt-card tt-welcome" role="dialog" aria-label="Welcome to Mars">
        <svg class="tt-astro" viewBox="-60 -100 120 175" aria-hidden="true">${astronaut()}</svg>
        <div class="tt-title">Welcome to Mars!</div>
        <p class="tt-text">You just landed at the Mars base. You are the <b>only astronaut</b> here, so the base needs <b>YOU</b>!<br>
          Let’s take a quick tour so you know what every place is for.</p>
        <div class="tt-foot"><button type="button" class="tt-btn tt-skipW">Skip tour</button><button type="button" class="tt-btn tt-next" data-go="next">Next →</button></div>
      </div>
      <div class="tt-card tt-place" role="dialog" aria-live="polite" hidden>
        <div class="tt-step"></div>
        <div class="tt-head"><div class="tt-ico"></div><div class="tt-title"></div></div>
        <p class="tt-text"></p>
        <div class="tt-fact"></div>
        <div class="tt-foot"><div class="tt-dots">${'<i></i>'.repeat(N)}</div>
          <div class="tt-btns"><button type="button" class="tt-btn" data-go="back">← Back</button><button type="button" class="tt-btn tt-next" data-go="next">Next →</button></div></div>
      </div>`;
    document.body.appendChild(wrap);
    const q = c => wrap.querySelector(c);
    const hole = q('.tt-hole'), card = q('.tt-place'), welcome = q('.tt-welcome'), skipBtn = q('.tt-skip');
    let step = -1;           // -1 = the welcome card

    function placeCard(r, side) {
      const W = window.innerWidth, H = window.innerHeight, cw = card.offsetWidth, ch = card.offsetHeight, gap = 26;
      const fits = { right: r.x + r.w + gap + cw < W - 12, left: r.x - gap - cw > 12, top: r.y - gap - ch > 12, bottom: r.y + r.h + gap + ch < H - 12 };
      const order = [side, 'right', 'left', 'top', 'bottom'];
      const sd = order.find(o => fits[o]) || side;
      let x, y;
      if (sd === 'right')  { x = r.x + r.w + gap; y = r.y + r.h / 2 - ch / 2; }
      if (sd === 'left')   { x = r.x - gap - cw;  y = r.y + r.h / 2 - ch / 2; }
      if (sd === 'top')    { x = r.x + r.w / 2 - cw / 2; y = r.y - gap - ch; }
      if (sd === 'bottom') { x = r.x + r.w / 2 - cw / 2; y = r.y + r.h + gap; }
      card.style.left = Math.max(12, Math.min(W - cw - 12, x)) + 'px';
      card.style.top  = Math.max(12, Math.min(H - ch - 12, y)) + 'px';
    }

    function render() {
      if (step < 0) {
        welcome.hidden = false; card.hidden = true; hole.hidden = true; skipBtn.hidden = true;
        wrap.classList.add('tt-dark');
        welcome.querySelector('.tt-next').focus();
        return;
      }
      const pl = PLACES[step];
      welcome.hidden = true; card.hidden = false; skipBtn.hidden = false;
      wrap.classList.remove('tt-dark');
      q('.tt-place .tt-step').textContent = `PLACE ${step + 1} OF ${N}`;
      q('.tt-place .tt-ico').textContent = pl.ico;
      q('.tt-place .tt-title').textContent = pl.title;
      q('.tt-place .tt-text').innerHTML = pl.text;
      q('.tt-place .tt-fact').innerHTML = pl.fact;
      wrap.querySelectorAll('.tt-dots i').forEach((d, i) => d.classList.toggle('on', i === step));
      q('.tt-place .tt-next').textContent = step === N - 1 ? 'Let’s go! 🚀' : 'Next →';
      const r = placeRect(pl) || { x: window.innerWidth / 2 - 60, y: window.innerHeight / 2 - 60, w: 120, h: 120 };
      hole.hidden = false;
      Object.assign(hole.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
      card.classList.remove('tt-pop'); void card.offsetWidth; card.classList.add('tt-pop');
      placeCard(r, pl.side);
      q('.tt-place .tt-next').focus();
    }

    function go(d) {
      const next = step + d;
      if (next < -1) return;
      if (next >= N) { finish(); return; }
      step = next;
      beep(d > 0 ? [660, 880] : [520], 0.07);
      render();
    }
    function finish() {
      tourKey = null;
      window.removeEventListener('resize', render);
      wrap.classList.add('tt-out');
      setTimeout(() => wrap.remove(), 300);
      done();
    }

    wrap.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.go === 'next') go(1);
      else if (b.dataset.go === 'back') go(-1);
      else if (b.classList.contains('tt-skip') || b.classList.contains('tt-skipW')) finish();
    });
    tourKey = e => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); go(-1); }
      else if (e.key === 'Escape') finish();
    };
    window.addEventListener('resize', render);
    render();
  }

  el.querySelector('#st-play').addEventListener('click', play);

  // keys: block walking while the menu is up; Enter / Space = play (or close the help card)
  window.addEventListener('keydown', e => {
    if (!open) return;
    e.stopImmediatePropagation();
    if (!menu) {
      if (skipIntro) {                             // the landing animation is playing
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); skipIntro(); }
      } else if (tourKey) tourKey(e);              // the tour is on screen
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
  }, true);
  window.addEventListener('keyup', e => { if (open) e.stopImmediatePropagation(); }, true);

  el.querySelector('#st-play').focus();
  window.MartianoutsStart = { play, isOpen: () => open, isLanding: () => !!skipIntro, isTour: () => !!tourKey };
})();
