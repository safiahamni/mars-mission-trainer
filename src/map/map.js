// map.js — the shared Mars base map: walking on the roads, doors, keyboard, game loop.
// Needs avatar.js first (it provides createAvatar). src/main.js loads them in the right order.
// Everyone shares this file. Your own place's game goes in YOUR OWN file and talks to the map
// through MarsMap (see "FOR TEAMMATES" at the bottom).
const MarsMap = (function () {
  // =========================================================
  //  SETUP
  // =========================================================
  const scene    = document.getElementById('mm-scene');
  const statusEl = document.getElementById('mm-status');
  const SPEED    = 180;    // walking speed, pixels per second (faster = less time outside)

  // =========================================================
  //  THE MAP
  //  The drawing in index.html uses small "design" numbers inside
  //  <g transform="translate(90 7) scale(1.6)">. ART turns design numbers into map pixels.
  //
  //                       cliff route (canyon)
  //                          /    \________  Science Lab
  //                     FORK  \_ normal path _/
  //                       |
  //    Greenhouse ---- COMMAND CENTER ----+
  //                       |               |
  //                    airlock        Life Support
  //                       :
  //                  solar panel
  // =========================================================
  const ART = { x: 90, y: 7, s: 1.6 };
  const toMap = ([dx, dy]) => [ART.x + dx * ART.s, ART.y + dy * ART.s];
  const H = 13;            // how far from the middle of a road the feet can go (map pixels)

  // ROADS (design numbers, the same curves as in the drawing): [start, control 1, control 2, end]
  const q2c = (a, c, b) => [a, [a[0] + 2 / 3 * (c[0] - a[0]), a[1] + 2 / 3 * (c[1] - a[1])],
                               [b[0] + 2 / 3 * (c[0] - b[0]), b[1] + 2 / 3 * (c[1] - b[1])], b];
  const ROADS = {
    // Command Center -> Greenhouse, straight to the LEFT
    greenhouse: [[[250, 318], [188, 318], [126, 318], [65, 318]]],
    // Command Center -> THE FORK: one road up, then it splits into the two routes to the Science Lab
    lab:        [[[300, 236], [300, 215], [299, 195], [298, 178]]],
    // fork -> Science Lab, the FAR way: up through the canyon, then a big loop over to the lab's left side
    cliff: [
      [[298, 178], [300, 165], [308, 154], [318, 144]],
      [[318, 144], [340, 122], [362, 100], [384, 78]],      // between the cliff walls
      [[384, 78], [398, 62], [410, 28], [455, 28]],
      [[455, 28], [500, 28], [512, 62], [540, 62]],
    ],
    // fork -> Science Lab, the NEAR way: right, under the canyon, then a smooth curve up to the bottom of the lab
    normal: [
      [[298, 178], [304, 200], [330, 205], [370, 205]],
      [[370, 205], [460, 205], [560, 170], [575, 106]],
    ],
    // Command Center -> Life Support: straight right, then down
    life:       [[[390, 300], [430, 300], [470, 300], [510, 300]],      // straight right out of the Command Center
                 [[510, 300], [522, 300], [522, 320], [522, 340]],      // round the corner
                 [[522, 340], [522, 420], [522, 500], [540, 500]]],     // then down into Life Support
  };
  const CC_BOX = { x1: 240, y1: 227, x2: 398, y2: 347 };   // the Command Center building + its name tags (design numbers)
  const CANYON = [[318, 144], [384, 78]];                  // the stretch of the cliff route between the cliff walls
  const FORK   = [298, 178];                               // where the road splits into the cliff path and the normal path
  // turn a curve into lots of small straight steps (design numbers)
  function curvePoints(pieces) {
    const pts = [];
    for (const [a, b, c, d] of pieces) {
      for (let i = pts.length ? 1 : 0; i <= 40; i++) {
        const t = i / 40, u = 1 - t;
        pts.push([u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0],
                  u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]);
      }
    }
    return pts;
  }
  const insideCC = ([dx, dy]) => dx > CC_BOX.x1 && dx < CC_BOX.x2 && dy > CC_BOX.y1 && dy < CC_BOX.y2;
  // each road in map pixels, starting where it leaves the Command Center wall
  const R = {};
  for (const [name, pieces] of Object.entries(ROADS)) {
    R[name] = curvePoints(pieces).filter(p => !insideCC(p)).map(toMap);
  }
  const CURVE_PTS = Object.values(R);

  // ---- PLACES: name + the arrow keys that take you out (and onto which road) ----
  const DOOR_R = 14;                         // how close to a door you must get
  const firstPt = pts => pts[0], lastPt = pts => pts[pts.length - 1];
  function exitAt(pts, fromEnd, label) {     // a spot a few steps along the road, facing away from the door
    const door = fromEnd ? lastPt(pts) : firstPt(pts);
    const list = fromEnd ? [...pts].reverse() : pts;
    const out  = list.find(p => Math.hypot(p[0] - door[0], p[1] - door[1]) > DOOR_R + 6) || list[list.length - 1];
    return { x: out[0], y: out[1], dx: Math.sign(Math.round(out[0] - door[0])), dy: Math.sign(Math.round(out[1] - door[1])), label };
  }
  const PLACES = {
    shelter:    { name: 'Command Center', exits: {
                    left:  exitAt(R.greenhouse, false, 'Greenhouse road'),
                    up:    exitAt(R.lab,        false, 'Science Lab road'),
                    right: exitAt(R.life,       false, 'Life Support road') } },
    greenhouse: { name: 'Greenhouse',   exits: { right: exitAt(R.greenhouse, true, 'road') } },
    lab:        { name: 'Science Lab',  exits: { down: exitAt(R.normal, true, 'normal path'), left: exitAt(R.cliff, true, 'cliff route') } },
    life:       { name: 'Life Support', exits: { left: exitAt(R.life, true, 'road') } },
  };
  // ---- DOORS: walk to the end of a road = go inside ----
  const DOORS = [
    { place: 'shelter',    at: firstPt(R.greenhouse) }, { place: 'shelter', at: firstPt(R.lab) },
    { place: 'shelter',    at: firstPt(R.life) },
    { place: 'greenhouse', at: lastPt(R.greenhouse) },
    { place: 'lab',        at: lastPt(R.normal) },      { place: 'lab',     at: lastPt(R.cliff) },
    { place: 'life',       at: lastPt(R.life) },
  ];
  const START_INSIDE = 'shelter';            // the crew starts inside the Command Center

  // the two routes to the Science Lab (used by the Radiation Shelter's route chooser)
  const SPLIT = {
    normalPts: R.normal, cliffPts: R.cliff, canyon: CANYON.map(toMap),
    stemPts: R.lab, fork: toMap(FORK),           // the shared road: Command Center door -> fork
    ccDoor: firstPt(R.lab), labDoor: lastPt(R.normal),
  };

  const ARROW = { up: '▲', down: '▼', left: '◀', right: '▶' };

  const player = createAvatar(scene);
  let x = PLACES.shelter.exits.up.x, y = PLACES.shelter.exits.up.y;   // the avatar's feet
  let insideOf = null;            // null = on the roads, otherwise a place ('shelter', 'lab', ...)
  let paused = false;             // true while a pop-up wants the game to wait
  let autopilot = false;          // true while someone else's code is moving the avatar
  const keys = {};

  // ---- events teammates can listen to (MarsMap.on('enter', fn) ...) ----
  const listeners = { update: [], afterMove: [], enter: [], leave: [], key: [], keyUp: [], release: [] };
  function on(event, fn) { listeners[event].push(fn); }
  function emit(event, ...args) { for (const fn of listeners[event]) fn(...args); }

  // =========================================================
  //  MOVING (the feet stay on the roads)
  // =========================================================
  function nearestOnRoads(px, py) {
    let best = null;
    for (const pts of CURVE_PTS) {
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const vx = bx - ax, vy = by - ay, len2 = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len2));
        const qx = ax + t * vx, qy = ay + t * vy, d = Math.hypot(px - qx, py - qy);
        if (!best || d < best.d) best = { d, qx, qy, tx: vx / Math.sqrt(len2), ty: vy / Math.sqrt(len2) };
      }
    }
    return best;
  }
  function onPath(px, py) {
    const n = nearestOnRoads(px, py);
    return !!n && n.d <= H;
  }

  // draw the roads into the map (#mm-roads, design numbers): sandy edge, dashed white line, sandy middle
  (function drawRoads() {
    const g = document.getElementById('mm-roads');
    if (!g) return;
    const d = Object.values(ROADS).map(pieces =>
      pieces.map(([a, b, c, e], i) => (i ? '' : `M${a[0]} ${a[1]} `) + `C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${e[0]} ${e[1]}`).join(' ')).join(' ');
    const layers = [['url(#mm-dots)', 28, ''], ['#FFFFFF', 22, '6 6'], ['url(#mm-dots)', 18, '']];
    for (const [stroke, width, dash] of layers) {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.setAttribute('stroke', stroke);
      p.setAttribute('stroke-width', width);
      if (dash) { p.setAttribute('stroke-dasharray', dash); p.setAttribute('stroke-opacity', '0.85'); p.setAttribute('stroke-linecap', 'butt'); }
      g.appendChild(p);
    }
  })();

  function walk(dx, dy, dt) {
    player.faceToward(dx, dy);
    const step = SPEED * dt * (dx && dy ? Math.SQRT1_2 : 1);   // same speed diagonally
    const startX = x, startY = y;
    // try the move; if it leaves the road, slide along the road the way you are pushing
    if (onPath(x + dx * step, y + dy * step)) { x += dx * step; y += dy * step; }
    else if (onPath(x + dx * step, y)) x += dx * step;
    else if (onPath(x, y + dy * step)) y += dy * step;
    if (Math.hypot(x - startX, y - startY) < step * 0.5) {
      const n = nearestOnRoads(x, y);
      if (n) {
        const along = Math.sign(dx * n.tx + dy * n.ty);
        if (along) {
          const nx = x + n.tx * along * step, ny = y + n.ty * along * step;
          const m = nearestOnRoads(nx, ny);
          if (m && m.d <= H) { x = nx; y = ny; }
          else if (m) { x = m.qx; y = m.qy; }
        }
      }
    }
    player.moveTo(x, y);
  }

  // =========================================================
  //  MESSAGES
  // =========================================================
  function setStatus(text) { statusEl.textContent = text; }

  let toastTimer;
  function toast(text) {
    const t = document.getElementById('mm-toast');
    t.textContent = text;
    t.classList.add('mm-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('mm-show'), Math.max(1800, text.length * 55));   // longer text stays longer
  }

  // =========================================================
  //  GOING IN AND OUT OF PLACES
  // =========================================================
  function releaseKeys() { for (const k in keys) keys[k] = false; emit('release'); }

  function exitHint(place) {
    const ex = PLACES[place].exits, dirs = Object.keys(ex);
    return dirs.length === 1 ? `Press ${ARROW[dirs[0]]} to go back out.`
      : 'Go out: ' + dirs.map(d => `${ARROW[d]} ${ex[d].label}`).join(' · ');
  }

  function enter(place, message) {
    releaseKeys();
    insideOf = place;
    player.hide();
    player.setWalking(false);
    document.getElementById('place-' + place)?.classList.add('mm-inside');
    setStatus(message || `Safe inside the ${PLACES[place].name}! ${exitHint(place)}`);
    emit('enter', place);
  }

  // leave by an arrow key (each key = a different road); no key = the first way out
  function leave(dir) {
    const place = insideOf;
    if (!place) return;
    const exits = PLACES[place].exits;
    if (!exits[dir]) dir = Object.keys(exits)[0];
    const ex = exits[dir];
    insideOf = null;
    document.getElementById('place-' + place)?.classList.remove('mm-inside');
    x = ex.x; y = ex.y;
    player.faceToward(ex.dx, ex.dy);
    player.moveTo(x, y);
    player.show();
    setStatus(`Out of the ${PLACES[place].name}.`);
    emit('leave', place, dir);
  }

  // =========================================================
  //  KEYBOARD + ON-SCREEN ARROWS
  // =========================================================
  const KEYMAP = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down',
                   ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
                   KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };   // W A S D also work with Caps Lock or a Korean keyboard
  function press(dir) {
    for (const fn of listeners.key) if (fn(dir)) return;   // a teammate's game used this key
    if (insideOf) {
      if (PLACES[insideOf].exits[dir]) leave(dir);
      return;
    }
    keys[dir] = true;
  }
  function unpress(dir) { keys[dir] = false; emit('keyUp', dir); }

  document.addEventListener('keydown', e => {
    if (paused) return;                    // a pop-up is open: no walking
    const dir = (KEYMAP[e.key] || KEYMAP[e.code]);
    if (!dir) return;
    e.preventDefault();
    press(dir);
  });
  document.addEventListener('keyup', e => { const dir = (KEYMAP[e.key] || KEYMAP[e.code]); if (dir) unpress(dir); });
  document.querySelectorAll('[data-dir]').forEach(btn => {
    const dir = btn.dataset.dir;
    btn.addEventListener('pointerdown', () => { if (!paused) press(dir); });
    ['pointerup', 'pointerleave'].forEach(ev => btn.addEventListener(ev, () => unpress(dir)));
  });

  // =========================================================
  //  GAME LOOP (about 60 times a second)
  // =========================================================
  let last = performance.now();
  function loop(now) {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));   // seconds since last frame (never backwards)
    last = now;
    if (paused) { requestAnimationFrame(loop); return; }

    emit('update', dt);                              // teammates' games run here

    const dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    const moving = !!(dx || dy);
    if (!insideOf && !autopilot) {
      if (moving) walk(dx, dy, dt);
      player.setWalking(moving);
      // reached the end of a road = a door -> go in
      for (const d of DOORS) {
        if (Math.hypot(x - d.at[0], y - d.at[1]) < DOOR_R) { enter(d.place); break; }
      }
    }

    emit('afterMove', dt);                           // after the avatar moved this frame
    requestAnimationFrame(loop);
  }

  player.moveTo(x, y);
  // the crew starts inside the Command Center
  insideOf = START_INSIDE;
  player.hide();
  document.getElementById('place-' + START_INSIDE)?.classList.add('mm-inside');
  setStatus(`Safe inside the ${PLACES[START_INSIDE].name}! ${exitHint(START_INSIDE)}`);
  requestAnimationFrame(loop);

  // =========================================================
  //  FOR TEAMMATES: what your own code can use
  //
  //  MarsMap.on('update',    dt => {...})   every frame (dt = seconds)
  //  MarsMap.on('afterMove', dt => {...})   every frame, after the avatar moved
  //  MarsMap.on('enter',  place => {...})   the crew walked into a place ('shelter', 'lab', 'greenhouse', 'life')
  //  MarsMap.on('leave',  (place, dir) => {...})   the crew came back out (dir = the arrow they pressed)
  //  MarsMap.on('key',    dir => true)      return true to use an arrow key yourself
  //  MarsMap.on('keyUp',  dir => {...})     an arrow key / button was let go
  //  MarsMap.on('release', () => {...})     all keys were let go (e.g. on entering a place)
  //
  //  MarsMap.getPos() / setPos(x, y)        where the avatar's feet are
  //  MarsMap.isInside()                     null on the roads, or the place name
  //  MarsMap.enter(place, msg) / leave(dir)
  //  MarsMap.pause(true/false)              stop the game while your pop-up is open
  //  MarsMap.setAutopilot(true/false)       you move the avatar yourself (keys + doors ignored)
  //  MarsMap.status(text) / toast(text)     show a message
  //  MarsMap.player                         the avatar (face, setWalking, el, ...)
  //  MarsMap.PLACES, MarsMap.SPEED, MarsMap.scene
  //  MarsMap.GRID.SPLIT                     the two routes to the Science Lab (points, canyon, doors)
  // =========================================================
  return {
    scene, player, SPEED, PLACES,
    GRID: { SPLIT },
    on,
    getPos: () => ({ x, y }),
    setPos(nx, ny) { x = nx; y = ny; player.moveTo(x, y); },
    isInside: () => insideOf,
    enter, leave,
    pause(v) { paused = !!v; },
    isPaused: () => paused,
    setAutopilot(v) { autopilot = !!v; },
    releaseKeys,
    status: setStatus,
    toast,
  };
})();
// shared with every place (they use MarsMap without importing it)
window.MarsMap = MarsMap;

// ===== Fit the whole page in the window: as big as possible, centered =====
(function () {
  const page = document.querySelector('.mm-page');
  page.style.width = 'max-content';   // page is only as wide as the map
  page.style.margin = '0 auto';       // centered
  // how big the page can be with a layout (measured at full size)
  function sizeFor(stacked) {
    page.classList.toggle('mm-stacked', stacked);
    page.style.zoom = 1;
    return Math.min(innerWidth / page.scrollWidth, innerHeight / page.scrollHeight);
  }
  function fitToWindow() {
    page.style.minHeight = '0';
    const wide = sizeFor(false);      // info left · map · arrows right (wide screens)
    const tall = sizeFor(true);       // info on top · map · arrows below (narrow / split screens)
    const stacked = tall > wide;      // use whichever makes the map bigger
    page.classList.toggle('mm-stacked', stacked);
    page.style.zoom = stacked ? tall : wide;
  }
  window.addEventListener('resize', fitToWindow);
  window.addEventListener('load', fitToWindow);            // again after teammates' scripts add their parts
  document.fonts?.ready.then(fitToWindow);                 // and after the font loads
  fitToWindow();
})();