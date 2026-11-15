// route-chooser.js — the "Which way to the Science Lab?" pop-up (shared map feature).
//   • leave the Command Center by ▲, walk up to the fork -> pick the Normal path or the Cliff route
//   • leave the Science Lab -> "Which way back to the Command Center?"
//   • after picking, the avatar walks the route by itself and the hazard meter shows the cost
// Moved here from the old radiation-shelter/shelter-game.js, so it works without the shelter.
// Needs map.js (MarsMap). Uses hud.js (MarsHUD) for the hazard numbers if it is loaded.

const RouteChooser = (function () {
  const map = window.MarsMap;
  const hud = () => window.MarsHUD;          // may be missing: then the cards still work
  const player = map.player;
  const S = map.GRID.SPLIT;

  // same numbers as the side panel (hud.js)
  const BASE_RATE = 1;     // hazard points per game minute outside
  const CLIFF_X   = 0.9;   // cliffs block some radiation: 10% less (real Curiosity measurement ~4%)
  const STORM_X   = 2;     // solar storm: 2x faster
  const stormX = () => (hud()?.isStorm() ? STORM_X : 1);

  const ROUTES = {
    open:  { name: 'Normal path', minutes: 10, shade: 1,       points: S.normalPts },
    cliff: { name: 'Cliff route', minutes: 11, shade: CLIFF_X, points: S.cliffPts },
  };
  const routeRate  = r => BASE_RATE * stormX() * r.shade;
  const routeTotal = r => r.minutes * routeRate(r);

  // GOING TO THE LAB: route -> into the lab door.  GOING HOME: route backwards -> shared road -> Command Center
  const TO_LAB = {}, TO_HOME = {};
  for (const [id, r] of Object.entries(ROUTES)) {
    const end = r.points[r.points.length - 1], start = r.points[0];
    TO_LAB[id]  = { ...r, tail: [end, end] };
    TO_HOME[id] = { ...r, points: [...r.points].reverse(), tail: [start, ...[...S.stemPts].reverse()] };
  }
  // walking speed, so the route takes exactly its minutes (1 real second = 1 game minute)
  for (const t of [...Object.values(TO_LAB), ...Object.values(TO_HOME)]) {
    let len = 0;
    for (let i = 1; i < t.points.length; i++) len += Math.hypot(t.points[i][0] - t.points[i - 1][0], t.points[i][1] - t.points[i - 1][1]);
    t.speed = len / t.minutes;
  }

  // ---------- the pop-up ----------
  const SUN = `<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="9" fill="#FFD84A" stroke="#2B2A3A" stroke-width="2.5"/><g stroke="#FFD84A" stroke-width="3.5" stroke-linecap="round"><line x1="22" y1="3" x2="22" y2="8"/><line x1="22" y1="36" x2="22" y2="41"/><line x1="3" y1="22" x2="8" y2="22"/><line x1="36" y1="22" x2="41" y2="22"/><line x1="8.5" y1="8.5" x2="12" y2="12"/><line x1="32" y1="32" x2="35.5" y2="35.5"/><line x1="8.5" y1="35.5" x2="12" y2="32"/><line x1="32" y1="12" x2="35.5" y2="8.5"/></g></svg>`;
  const CLIFF = `<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><polygon points="2,40 15,12 24,26 30,18 42,40" fill="#9C3E22" stroke="#2B2A3A" stroke-width="2.5" stroke-linejoin="round"/><polygon points="15,12 19,21 13,20" fill="#E07A52"/><polygon points="30,18 34,25 28,24" fill="#E07A52"/></svg>`;
  const card = (id, icon, name, note, key) => `
      <button type="button" class="rc-route rc-route-${id}" data-route="${id}">
        <span class="rc-route-icon">${icon}</span>
        <span class="rc-route-name">${name}</span>
        <span class="rc-route-row"><span>Time</span><b id="rc-${id}Time"></b></span>
        <span class="rc-route-row"><span>Radiation</span><b id="rc-${id}Rate"></b></span>
        <span class="rc-route-row rc-total"><span>Total</span><b id="rc-${id}Total"></b></span>
        <span class="rc-route-note">${note}</span>
        <span class="rc-route-key">Press ${key}</span>
      </button>`;

  const scene = document.getElementById('mm-scene');
  scene.insertAdjacentHTML('beforeend', `
<div class="rc-chooser" id="rc-chooser" hidden role="dialog" aria-modal="true" aria-labelledby="rc-title">
  <div class="rc-card">
    <h2 id="rc-title">Which way to the Science Lab?</h2>
    <p class="rc-sub" id="rc-sub">Pick the route that keeps you safest!</p>
    <div class="rc-routes">
      ${card('open', SUN, 'Normal path', 'Short and near, but no shade at all.', 1)}
      ${card('cliff', CLIFF, 'Cliff route', 'Long and far, but the cliffs block some radiation.', 2)}
    </div>
    <button type="button" class="rc-info-btn" id="rc-infoBtn" aria-expanded="false" aria-controls="rc-info">ⓘ Why do cliffs help?</button>
    <div class="rc-info" id="rc-info" hidden>
      <p>Radiation on Mars comes from space, from almost every direction in the sky.
         A tall cliff blocks part of the sky, so fewer particles can reach you.</p>
      <p><b>Real science:</b> when NASA's Curiosity rover parked next to a butte (a small cliff hill)
         that blocked 19% of the sky, its radiation dose dropped by about 4%.
         Our game uses 10% so it's easier to see.</p>
    </div>
    <button type="button" class="rc-walk-self" id="rc-walkSelf">I'll walk myself</button>
  </div>
</div>
<div class="rc-banner" id="rc-banner" hidden></div>`);

  const $ = id => document.getElementById(id);
  const chooser = $('rc-chooser'), banner = $('rc-banner');
  let tripMode = 'lab';   // 'lab' = to the Science Lab, 'home' = back to the Command Center
  let auto = null;        // set while the avatar walks a chosen route by itself
  let toFork = false;     // true after leaving the Command Center by ▲, until reaching the fork
  const isOpen = () => !chooser.hidden;

  function fillCards() {
    for (const [id, r] of Object.entries(ROUTES)) {
      $(`rc-${id}Time`).textContent  = `${r.minutes} min`;
      $(`rc-${id}Rate`).textContent  = `+${routeRate(r).toFixed(1)} per min`;
      $(`rc-${id}Total`).textContent = `+${routeTotal(r).toFixed(1)}`;
    }
  }

  function show(mode) {
    map.releaseKeys();
    map.pause(true);                       // the game waits for your answer
    tripMode = mode;
    player.setWalking(false);
    $('rc-title').textContent = mode === 'lab' ? 'Which way to the Science Lab?' : 'Which way back to the Command Center?';
    $('rc-sub').textContent = (hud()?.isStorm() ? 'Solar storm! ' : '') +
      (mode === 'lab' ? 'Pick the route that keeps you safest!' : 'Pick the safest way back to the Command Center.');
    fillCards();
    $('rc-info').hidden = true;
    $('rc-infoBtn').setAttribute('aria-expanded', 'false');
    chooser.hidden = false;
    chooser.querySelector('.rc-route').focus();
  }
  function hide() { chooser.hidden = true; map.pause(false); }

  function choose(id) {
    hide();
    const route = (tripMode === 'lab' ? TO_LAB : TO_HOME)[id];
    map.setPos(route.points[0][0], route.points[0][1]);
    auto = { route, next: 1, inTail: false, startHazard: hud()?.getHazard() ?? 0, routeHazard: 0 };
    map.setAutopilot(true);
    hud()?.setRouteShade?.(route.shade);   // the whole route gets its shade (like the cards say)
    banner.textContent = tripMode === 'lab'
      ? `Following the ${route.name.toLowerCase()} to the Science Lab…`
      : `Heading back on the ${route.name.toLowerCase()}…`;
    banner.hidden = false;
  }

  function stopAuto() {
    auto = null;
    map.setAutopilot(false);
    hud()?.setRouteShade?.(null);
    banner.hidden = true;
  }

  // move along the route's points, then along its tail (leftover steps carry on to the next point,
  // so the route takes exactly its minutes)
  function autoWalk(dt) {
    let { x, y } = map.getPos();
    let left = (auto.inTail ? map.SPEED : auto.route.speed) * dt;   // how far to walk this frame
    while (auto && left > 0) {
      const pts = auto.inTail ? auto.route.tail : auto.route.points;
      const [tx, ty] = pts[auto.next];
      const ddx = tx - x, ddy = ty - y, dist = Math.hypot(ddx, ddy);
      if (dist > 0.01) player.faceToward(Math.abs(ddx) > dist * 0.38 ? Math.sign(ddx) : 0, Math.abs(ddy) > dist * 0.38 ? Math.sign(ddy) : 0);
      if (dist > left) { x += ddx / dist * left; y += ddy / dist * left; left = 0; break; }
      x = tx; y = ty; left -= dist;
      auto.next++;
      if (auto.next < pts.length) continue;
      if (!auto.inTail) {
        auto.routeHazard = (hud()?.getHazard() ?? 0) - auto.startHazard;   // the route part is done
        auto.inTail = true; auto.next = 1;
        hud()?.setRouteShade?.(null);
        left = 0;                                    // the tail starts next frame, at normal speed
        if (tripMode === 'home') banner.textContent = 'Walking round to the Command Center…';
      } else {
        const other = auto.route.name === ROUTES.open.name ? ROUTES.cliff : ROUTES.open;
        const result = hud()
          ? `${auto.route.name}: hazard +${auto.routeHazard.toFixed(1)} (the ${other.name.toLowerCase()} would be +${routeTotal(other).toFixed(1)}).`
          : '';
        map.setPos(x, y);
        stopAuto();
        if (tripMode === 'lab') map.enter('lab', 'Arrived safe at the Science Lab! ' + result);
        else map.enter('shelter', 'Back in the Command Center! ' + result);
        return;
      }
    }
    map.setPos(x, y);
  }

  // ---------- buttons and keys ----------
  chooser.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click', () => choose(b.dataset.route)));
  $('rc-walkSelf').addEventListener('click', () => {
    hide();
    map.toast(tripMode === 'lab' ? 'OK! Walk yourself along the road to the Science Lab.'
                                 : 'OK! Walk back yourself along either road to the Command Center.');
  });
  $('rc-infoBtn').addEventListener('click', e => {
    const info = $('rc-info');
    info.hidden = !info.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!info.hidden));
  });
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === '1') choose('open');
    if (e.key === '2') choose('cliff');
    if (e.key === 'Escape') hide();
  });

  // ---------- hooking into the map ----------
  map.on('enter', () => { toFork = false; });
  map.on('leave', (place, dir) => {
    if (place === 'shelter' && dir === 'up') {
      toFork = true;
      map.status('Walk up the road to the fork, then pick your route.');
    } else if (place === 'lab') {
      show('home');                         // "Which way back to the Command Center?"
    }
  });
  map.on('update', dt => {
    if (!auto) return;
    if (hud()?.isFailed?.()) { stopAuto(); return; }
    if (!map.isInside()) { autoWalk(dt); if (auto) player.setWalking(true); }
  });
  map.on('afterMove', () => {
    if (toFork && !auto && !map.isInside()) {
      const { x, y } = map.getPos();
      if (Math.hypot(x - S.fork[0], y - S.fork[1]) < 14) { toFork = false; show('lab'); }
    }
  });

  return { show, isOpen, isWalking: () => !!auto };
})();
window.RouteChooser = RouteChooser;   // shared: RouteChooser.show('lab') / ('home')
