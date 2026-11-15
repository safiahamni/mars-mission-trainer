// shelter-game.js — the RADIATION SHELTER games (Member 3), in the Command Center's storm shelter core.
//   • hazard meter + mission clock (radiation rises while you are outside)
//   • cliff shade: the canyon blocks some radiation
//   • route chooser at the fork: open route or cliff route, then the avatar walks it by itself
//   • solar storm -> run to the shelter -> "Shield the Shelter": carry water tanks onto the shelves
// Needs main.js (MarsMap) and shelter.js (the pieces on the page) loaded first.
//
// Everything is wrapped inside RadiationShelter, so names stay private and can't clash with teammates' code.
const RadiationShelter = (function () {
  const map     = MarsMap;
  const player  = map.player;
  const SPEED   = map.SPEED;
  const shelter = document.getElementById('rs-shelter');
  const G = map.GRID;
  const S = G.SPLIT;
  const CC_DOOR  = S.ccDoor;                        // where the roads meet the Command Center
  const LAB_DOOR = S.labDoor;                       // the Science Lab
  function box(x1, y1, x2, y2) { return { x1, y1, x2, y2 }; }
  function inBox(b, px, py) { return px >= b.x1 && px <= b.x2 && py >= b.y1 && py <= b.y2; }
  const where = () => map.isInside();

  // =========================================================
  //  HAZARD METER, CLOCK, CLIFF SHADE
  // =========================================================
  const MAX_HAZARD = 100;
  const BASE_RATE  = 1;     // hazard points per game minute on the paths
  const STORM_X    = 2;     // during a solar storm: 2x faster
  const STORM_HITS_AFTER = 6;              // the storm hits after 6 game minutes on the paths
  const STORM_LEFT_WHEN_READY = 12;        // after all 3 tanks, the storm passes in 12 game minutes
  const INSIDE_RATES = [1.0, 0.6, 0.3, 0.1];   // shelter inside rate during a storm, by water tanks placed
  const CLIFF_X    = 0.9;   // cliff shade: 10% less (game value; real Curiosity measurement ~4%)
  // inside the canyon = close to the stretch of the cliff route between the cliff walls
  function inCanyon(px, py) {
    const [[ax, ay], [bx, by]] = S.canyon, vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(px - (ax + t * vx), py - (ay + t * vy)) < 26;
  }

  let hazard = 0;
  let gameMinutes = 10 * 60;   // 10:00 on Sol 3 (1 real second = 1 game minute)

  // ---- solar storm ----
  let storm = false;              // is a storm happening right now?
  let stormDone = false;          // already passed today (one storm per Sol)
  let untilStorm = STORM_HITS_AFTER;
  let stormLeft = 0;              // countdown after the shelter is shielded
  let tanks = 0;                  // water tanks placed in the shelter (0-3)
  function stormX() { return storm ? STORM_X : 1; }

  function hazardRate() {
    const insideOf = where();
    if (insideOf === 'shelter' && storm) return INSIDE_RATES[tanks];   // shielding lowers the inside rate
    if (insideOf) return 0;                                  // buildings keep you safe
    if (auto && !auto.inTail) return BASE_RATE * stormX() * auto.route.shade;
    let r = BASE_RATE * stormX();
    const { x, y } = map.getPos();
    if (inCanyon(x, y)) r *= CLIFF_X;
    return r;
  }

  function updateHud() {
    const insideOf = where();
    const pct = Math.min(100, hazard / MAX_HAZARD * 100);
    document.getElementById('rs-hazNum').textContent = Math.floor(hazard);
    document.getElementById('rs-hazNeedle').style.left = pct + '%';
    document.getElementById('rs-hazMeter').setAttribute('aria-valuenow', Math.floor(hazard));
    const h = Math.floor(gameMinutes / 60) % 24, m = Math.floor(gameMinutes % 60);
    document.getElementById('rs-clock').textContent = `Sol 3 · ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    document.getElementById('rs-rate').textContent = insideOf && hazardRate() === 0 ? 'Safe: +0' : `+${hazardRate().toFixed(1)} per min`;
    const { x, y } = map.getPos();
    const shaded = !insideOf && inCanyon(x, y);
    document.getElementById('rs-shadeBadge').classList.toggle('rs-on', shaded);
    player.el.classList.toggle('rs-shaded', shaded);
  }

  // =========================================================
  //  ROUTE CHOOSER (Dora-style) + AUTO-WALK
  //  At the fork: "Which way to the Science Lab?"
  //  Leaving the lab: "Which way back to the shelter?"
  // =========================================================
  const ROUTES = {
    // NORMAL PATH (the "open" route): short and near, no shade
    open:  { name: 'Normal path', minutes: 10, shade: 1,       points: S.normalPts },
    // CLIFF ROUTE: long and far, through the canyon between the cliff walls
    cliff: { name: 'Cliff route', minutes: 11, shade: CLIFF_X, points: S.cliffPts },
  };
  // rate and total right now (they go up during a storm)
  const routeRate  = r => BASE_RATE * stormX() * r.shade;
  const routeTotal = r => r.minutes * routeRate(r);
  // GOING TO THE LAB: (at the fork) route -> the joined road -> into the lab door
  const TO_LAB = {};
  // GOING HOME: (outside the lab) the joined road -> the same route backwards -> the road to the shelter door
  const TO_SHELTER = {};
  for (const [id, r] of Object.entries(ROUTES)) {
    const end = r.points[r.points.length - 1], start = r.points[0];
    TO_LAB[id]     = { ...r, tail: [end, end] };                                     // the road ends at the Science Lab
    TO_SHELTER[id] = { ...r, points: [...r.points].reverse(), tail: [start, ...[...S.stemPts].reverse()] };  // ...then down the shared road to the Command Center
  }
  // walking speed for each trip, so the route part takes exactly its minutes (1 real second = 1 game minute)
  for (const t of [...Object.values(TO_LAB), ...Object.values(TO_SHELTER)]) {
    let len = 0;
    for (let i = 1; i < t.points.length; i++) {
      len += Math.hypot(t.points[i][0] - t.points[i - 1][0], t.points[i][1] - t.points[i - 1][1]);
    }
    t.speed = len / t.minutes;
  }
  // put the numbers on the cards (so cards and game always match)
  function fillCards() {
    for (const [id, r] of Object.entries(ROUTES)) {
      document.getElementById(`rs-${id}Time`).textContent  = `${r.minutes} min`;
      document.getElementById(`rs-${id}Rate`).textContent  = `+${routeRate(r).toFixed(1)} per min`;
      document.getElementById(`rs-${id}Total`).textContent = `+${routeTotal(r).toFixed(1)}`;
    }
  }

  const chooser = document.getElementById('rs-chooser');
  const banner  = document.getElementById('rs-routeBanner');
  let tripMode = 'lab';     // 'lab' = going to the Science Lab, 'home' = going back to the shelter
  let auto = null;          // set while the character walks a chosen route by itself
    let toFork = false;       // true after leaving the Command Center by ▲, until the crew reaches the fork

  function chooserOpen() { return !chooser.hidden; }

  function showChooser(mode) {
    map.releaseKeys();
    map.pause(true);                         // the game waits for your answer
    tripMode = mode;
    // stand exactly where both routes start: the fork, or the meeting point by the lab
    player.setWalking(false);
    player.setWalking(false);
    document.getElementById('rs-chooserTitle').textContent =
      mode === 'lab' ? 'Which way to the Science Lab?' : 'Which way back to the Command Center?';
    document.querySelector('.rs-chooser-sub').textContent =
      (storm ? 'Solar storm! ' : '') +
      (mode === 'lab' ? 'Pick the route that keeps you safest!'
                      : 'Pick the safest way back to the Command Center.');
    fillCards();
    document.getElementById('rs-info').hidden = true;
    document.getElementById('rs-infoBtn').setAttribute('aria-expanded', 'false');
    chooser.hidden = false;
    chooser.querySelector('.rs-route').focus();
  }
  function hideChooser() { chooser.hidden = true; map.pause(false); }

  function chooseRoute(id) {
    hideChooser();
    const route = (tripMode === 'lab' ? TO_LAB : TO_SHELTER)[id];
    // stand at the start of the chosen road (point 0), then walk it
    map.setPos(route.points[0][0], route.points[0][1]);
    auto = { route, next: 1, startHazard: hazard, inTail: false, routeHazard: 0 };
    map.setAutopilot(true);
    banner.textContent = tripMode === 'lab'
      ? `Following the ${route.name.toLowerCase()} to the Science Lab…`
      : `Heading back on the ${route.name.toLowerCase()}…`;
    banner.hidden = false;
  }

  function stopAuto() {
    auto = null;
    map.setAutopilot(false);
    banner.hidden = true;
  }

  // move along the route's points, one at a time, then along its tail
  function autoWalk(dt) {
    let { x, y } = map.getPos();
    const pts = auto.inTail ? auto.route.tail : auto.route.points;
    const [tx, ty] = pts[auto.next];
    const ddx = tx - x, ddy = ty - y;
    const dist = Math.hypot(ddx, ddy);
    const step = (auto.inTail ? SPEED : auto.route.speed) * dt;   // the last few steps are normal speed
    // face the way you walk (curves turn smoothly between straight and diagonal)
    player.faceToward(Math.abs(ddx) > dist * 0.38 ? Math.sign(ddx) : 0, Math.abs(ddy) > dist * 0.38 ? Math.sign(ddy) : 0);
    if (dist <= step) {
      x = tx; y = ty;
      auto.next++;
      if (auto.next >= pts.length) {
        if (!auto.inTail) {
          auto.routeHazard = hazard - auto.startHazard;      // the route itself is done
          auto.inTail = true; auto.next = 1;
          if (tripMode === 'home') banner.textContent = 'Walking round to the airlock…';
        } else {
          const other = auto.route.name === ROUTES.open.name ? ROUTES.cliff : ROUTES.open;
          const result = `${auto.route.name}: hazard +${auto.routeHazard.toFixed(1)} ` +
                         `(the ${other.name.toLowerCase()} would be +${routeTotal(other).toFixed(1)}).`;
          map.setPos(x, y);
          stopAuto();
          if (tripMode === 'lab') map.enter('lab', 'Arrived safe at the Science Lab! ' + result);
          else map.enter('shelter', 'Back in the Command Center! ' + result);
          return;
        }
      }
    } else {
      x += ddx / dist * step;
      y += ddy / dist * step;
    }
    map.setPos(x, y);
  }

  chooser.querySelectorAll('[data-route]').forEach(btn =>
    btn.addEventListener('click', () => chooseRoute(btn.dataset.route)));
  document.getElementById('rs-walkSelf').addEventListener('click', () => {
    hideChooser();
    map.toast(tripMode === 'lab'
      ? 'OK! Walk yourself along the road to the Science Lab.'
      : 'OK! Walk back yourself along either road to the Command Center.');
  });
  document.getElementById('rs-infoBtn').addEventListener('click', e => {
    const info = document.getElementById('rs-info');
    info.hidden = !info.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!info.hidden));
  });
  // keys 1 / 2 / Esc while the chooser is open
  document.addEventListener('keydown', e => {
    if (!chooserOpen()) return;
    if (e.key === '1') chooseRoute('open');
    if (e.key === '2') chooseRoute('cliff');
    if (e.key === 'Escape') hideChooser();
  });

  // =========================================================
  //  SOLAR STORM + "SHIELD THE SHELTER" MINI-GAME
  // =========================================================
  const stormBar = document.getElementById('rs-stormBar');
  const shield   = document.getElementById('rs-shield');

  function startStorm() {
    storm = true;
    stormBar.classList.remove('rs-calm');
    document.getElementById('rs-stormText').textContent =
      'SOLAR STORM · hazard rises 2× faster outside. Head to the shelter!';
    shelter.classList.add('rs-storm');
    map.toast('SOLAR STORM! Your radiation meter is rising faster. Head to the shelter!');
    if (!where()) map.status('SOLAR STORM! Go back to the Command Center and into the storm shelter core.');
  }

  function endStorm() {
    storm = false;
    stormDone = true;
    stormBar.classList.add('rs-calm');
    document.getElementById('rs-stormText').textContent = 'All clear · the storm has passed. Normal background radiation.';
    shelter.classList.remove('rs-storm');
    document.getElementById('rs-shieldTitle').textContent = 'All clear!';
    setShieldMsg('The storm has passed. You can go back outside and finish the mission.', true);
    document.getElementById('rs-goOut').hidden = false;
    document.getElementById('rs-goOut').focus();
  }

  function setShieldMsg(text, good) {
    const m = document.getElementById('rs-shieldMsg');
    m.textContent = text;
    m.classList.toggle('rs-ready', !!good);
  }

  // =========================================================
  //  INSIDE THE SHELTER: your avatar walks around the room,
  //  walks onto a water tank to pick it up, and puts it on a wall shelf.
  // =========================================================
  const room      = document.getElementById('rs-room');
  const roomTanks = [...room.querySelectorAll('[data-tank]')];
  const carried   = document.getElementById('rs-carried');
  const crew      = createAvatar(room);          // the same character, inside the room
  crew.el.classList.add('rs-room-avatar');
  const ROOM_W = 320, ROOM_H = 280;              // floor size inside the grey wall
  const FEET   = { x1: 18, y1: 40, x2: ROOM_W - 18, y2: ROOM_H - 6 };   // where the feet can go
  const CREW_START = { x: 160, y: 170 };
  const PICK_DIST  = 24;                         // how close the feet must get to grab a tank
  const SLOT_REACH = 12;                         // how close to a shelf = tank put on it
  let cx = CREW_START.x, cy = CREW_START.y;      // the room avatar's feet
  let holding = null;                            // the tank being carried (or null)
  let walkTo  = null;                            // tap-to-walk target {x, y}
  const roomKeys = {};

  function crewPlace() {
    crew.moveTo(cx, cy);
    if (holding) {                               // the tank floats above the head
      carried.style.left = (cx - 13) + 'px';
      carried.style.top  = (cy - 92) + 'px';
    }
  }

  // copy the room onto the small shelter building on the map
  function syncMap() {
    roomTanks.forEach(t => document.querySelector(`[data-map-tank="${t.dataset.tank}"]`)
      ?.classList.toggle('rs-used', t.classList.contains('rs-used')));
    room.querySelectorAll('[data-slot]').forEach(sl => document.querySelector(`[data-map-shelf="${sl.dataset.slot}"]`)
      ?.classList.toggle('rs-placed', sl.classList.contains('rs-placed')));
  }

  function resetRoom() {
    cx = CREW_START.x; cy = CREW_START.y; holding = null; walkTo = null;
    for (const k in roomKeys) roomKeys[k] = false;
    roomTanks.forEach(t => t.classList.remove('rs-used'));
    carried.hidden = true;
    crew.face('down'); crew.setWalking(false);
    crewPlace();
    syncMap();
  }

  function openShield() {
    shield.hidden = false;
    document.getElementById('rs-goOut').hidden = true;
    document.getElementById('rs-shieldTitle').textContent = 'Shield the Shelter!';
    if (tanks < 3) setShieldMsg('Walk to a water tank to pick it up, then put it on a shelf.');
    crewPlace();
    updateShield();
  }

  function updateShield() {
    document.getElementById('rs-outRate').textContent = `+${(BASE_RATE * STORM_X).toFixed(1)} / min`;
    document.getElementById('rs-inRate').textContent  = `+${INSIDE_RATES[tanks].toFixed(1)} / min`;
    document.getElementById('rs-inBar').style.width   = (INSIDE_RATES[tanks] / INSIDE_RATES[0] * 100) + '%';
    document.getElementById('rs-tankCount').textContent = `${tanks} / 3`;
    if (tanks === 3 && storm) {
      const s = Math.ceil(stormLeft);
      setShieldMsg(`Shielding ready! The storm passes in 0:${String(s).padStart(2, '0')}…`, true);
    }
  }

  // put one tank on a wall shelf
  function placeTank(slot) {
    if (!slot || slot.classList.contains('rs-placed') || !storm || tanks >= 3) return false;
    slot.classList.add('rs-placed');
    slot.setAttribute('aria-label', slot.getAttribute('aria-label').replace('Place a', 'Placed a'));
    tanks++;
    syncMap();
    if (tanks === 3) stormLeft = STORM_LEFT_WHEN_READY;
    else setShieldMsg(`Tank on the shelf! Inside rate is now +${INSIDE_RATES[tanks].toFixed(1)} / min. ${3 - tanks} to go.`);
    updateShield();
    return true;
  }

  // the wall shelf the feet are standing at (only empty ones count)
  function slotUnderFeet() {
    return [...room.querySelectorAll('[data-slot]:not(.rs-placed)')].find(sl =>
      cx >= sl.offsetLeft - SLOT_REACH && cx <= sl.offsetLeft + sl.offsetWidth + SLOT_REACH &&
      cy >= sl.offsetTop  - SLOT_REACH && cy <= sl.offsetTop + sl.offsetHeight + SLOT_REACH);
  }

  // runs every frame while the shelter is open
  function updateRoom(dt) {
    let dx = (roomKeys.right ? 1 : 0) - (roomKeys.left ? 1 : 0);
    let dy = (roomKeys.down ? 1 : 0) - (roomKeys.up ? 1 : 0);
    let step = SPEED * dt;
    if (dx || dy) {
      walkTo = null;                                     // keys win over tapping
      if (dx && dy) step *= Math.SQRT1_2;
      cx += dx * step; cy += dy * step;
    } else if (walkTo) {                                 // walking to where you tapped
      const ddx = walkTo.x - cx, ddy = walkTo.y - cy, d = Math.hypot(ddx, ddy);
      if (d <= step) { cx = walkTo.x; cy = walkTo.y; walkTo = null; }
      else {
        cx += ddx / d * step; cy += ddy / d * step;
        dx = Math.abs(ddx) > d * 0.38 ? Math.sign(ddx) : 0;   // which way to face
        dy = Math.abs(ddy) > d * 0.38 ? Math.sign(ddy) : 0;
      }
    }
    cx = Math.max(FEET.x1, Math.min(FEET.x2, cx));
    cy = Math.max(FEET.y1, Math.min(FEET.y2, cy));
    const moving = !!(dx || dy);
    if (moving) crew.faceToward(dx, dy);
    crew.setWalking(moving);

    if (storm && tanks < 3) {
      // pick up: walk onto a tank on the floor
      if (!holding) {
        const t = roomTanks.find(t => !t.classList.contains('rs-used') &&
          Math.hypot(cx - (t.offsetLeft + t.offsetWidth / 2), cy - (t.offsetTop + t.offsetHeight)) < PICK_DIST);
        if (t) {
          holding = t;
          t.classList.add('rs-used');
          carried.hidden = false;
          syncMap();
          setShieldMsg('Got it! Now carry the tank to an empty shelf.');
        }
      }
      // drop: walk up to an empty shelf while carrying
      else {
        const slot = slotUnderFeet();
        if (slot && placeTank(slot)) {
          holding = null;
          carried.hidden = true;
        }
      }
    }
    room.classList.toggle('rs-carrying', !!holding);   // empty shelves glow
    crewPlace();
  }

  // tap / click the floor: the avatar walks there
  room.addEventListener('pointerdown', e => {
    if (shield.hidden) return;
    const r = room.getBoundingClientRect();
    const scale = r.width / room.offsetWidth || 1;           // in case the page is zoomed
    walkTo = { x: (e.clientX - r.left) / scale - room.clientLeft,
               y: (e.clientY - r.top)  / scale - room.clientTop };
  });

  resetRoom();

  document.getElementById('rs-goOut').addEventListener('click', () => {
    shield.hidden = true;
    map.leave('up');                          // out on the normal path side -> the route chooser
  });

  // =========================================================
  //  HOOKING INTO THE MAIN MAP
  // =========================================================
  const roomActive = () => where() === 'shelter' && !shield.hidden && storm;

  // arrow keys: walking inside the shelter, or blocked during a route / storm
  map.on('key', dir => {
    if (auto) return true;                                  // walking a route by itself
    if (roomActive()) { roomKeys[dir] = true; return true; }   // walking inside the shelter
    if (where() === 'shelter') {
      if (storm) { map.status('Wait for the all-clear before going outside!'); return true; }
      shield.hidden = true;                                 // main.js takes you outside
    }
    return false;
  });
  map.on('keyUp', dir => { roomKeys[dir] = false; });
  map.on('release', () => { for (const k in roomKeys) roomKeys[k] = false; });

  map.on('enter', place => {
        toFork = false;
    if (place === 'shelter') {
      shelter.classList.add('rs-inside');
      if (storm) {
        map.status('In the storm shelter core. Shield it with water tanks and wait for the all-clear.');
        openShield();
      }
    }
    updateHud();
  });

  map.on('leave', (place, dir) => {
    if (place === 'shelter') {
      shelter.classList.remove('rs-inside');
      map.status(storm ? 'Out through the airlock. Careful, solar storm!' : 'Out through the airlock.');
      // out by ▲ = the Science Lab road: walk up to the fork, then pick a route there
      if (dir === 'up') { toFork = true; map.status('Walk up the road to the fork, then pick your route.'); }
    } else if (place === 'lab') {
      map.status('Leaving the Science Lab…');
      showChooser('home');                       // "Which way back to the Command Center?"
    }
    updateHud();
  });

  // every frame
  map.on('update', dt => {
    gameMinutes += dt;                                // 1 real second = 1 game minute
    hazard = Math.min(MAX_HAZARD, hazard + hazardRate() * dt);

    // the storm arrives after a few minutes on the paths (once per Sol)
    if (!storm && !stormDone && !where()) {
      untilStorm -= dt;
      if (untilStorm <= 0) startStorm();
    }
    // shelter fully shielded -> the storm passes after a countdown
    if (storm && tanks === 3) {
      stormLeft -= dt;
      if (!shield.hidden) updateShield();
      if (stormLeft <= 0) endStorm();
    }

    if (!shield.hidden) updateRoom(dt);               // walking around inside the shelter

    if (auto && !where()) {
      autoWalk(dt);
      if (auto) player.setWalking(true);
    }
  });

  // every frame, after the avatar moved
  map.on('afterMove', () => {
        // reached the fork: the road splits here -> pick the cliff path or the normal path
    if (toFork && !auto && !map.isInside()) {
      const { x, y } = map.getPos();
      if (Math.hypot(x - S.fork[0], y - S.fork[1]) < 14) { toFork = false; showChooser('lab'); return; }
    }
    if (!where()) {
      const { x, y } = map.getPos();
      // too much radiation -> rush into the nearest building
      if (hazard >= MAX_HAZARD) {
        stopAuto();
        const toLab = Math.hypot(x - LAB_DOOR[0], y - LAB_DOOR[1]) < Math.hypot(x - CC_DOOR[0], y - CC_DOOR[1]);
        map.enter(toLab ? 'lab' : 'shelter', 'Hazard meter full! The crew rushed into the nearest building.');
      }
    }
    if (!chooserOpen()) updateHud();
  });

  if (where() === 'shelter') shelter.classList.add('rs-inside');
  map.status('Mission: get to the Science Lab. Leave the Command Center by ▲ and walk up to the fork.');
  updateHud();

  // =========================================================
  //  PUBLIC: the only things other teammates' code can use
  //  e.g.  RadiationShelter.getHazard()   RadiationShelter.newSol()
  // =========================================================
  return {
    getHazard: () => hazard,
    whereIsCrew: () => where() || 'paths',   // 'shelter' | 'lab' | 'paths'
    // call when a new Sol starts: resets the hazard meter
    newSol() {
      hazard = 0;
      storm = false; stormDone = false; untilStorm = STORM_HITS_AFTER; tanks = 0;
      shield.querySelectorAll('[data-slot]').forEach(s => {
        s.classList.remove('rs-placed');
        s.setAttribute('aria-label', s.getAttribute('aria-label').replace('Placed a', 'Place a'));
      });
      resetRoom();
      stormBar.classList.add('rs-calm');
      document.getElementById('rs-stormText').textContent = 'Calm skies · normal background radiation.';
      shelter.classList.remove('rs-storm');
      updateHud();
    },
    isStorm: () => storm,
  };
})();
// shared with the other places (e.g. the Command Center room asks isStorm(), newSol())
window.RadiationShelter = RadiationShelter;
