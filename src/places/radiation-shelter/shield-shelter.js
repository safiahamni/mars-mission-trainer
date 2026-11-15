import { getGame } from '../../state/gameStore.js';

// shield-shelter.js — "Shield the Shelter!": the water-tank game in a solar storm (Member 3).
// Moved from the laptop version (radiation-shelter/shelter-game.js) and connected to the side panel (MarsHUD).
//
//   • a solar storm starts (MarsHUD) -> the kid walks back into the Command Center (the room opens as usual)
//   • walking into the room's RADIATION SHELTER (where the bunks are) opens "Shield the Shelter!":
//     walk onto a water tank to pick it up, carry it to an empty shelf (3 tanks, 3 shelves)
//   • during the storm the hazard bar keeps rising inside, slower with every tank:
//     +0.5 -> +0.3 -> +0.2 -> +0.1 per min  (outside in a storm: +0.75)
//   • as soon as all 3 tanks are on the shelves -> "All clear!" -> back to the Command Center room
//   • while it is open the game time runs (the room normally pauses it), so the storm and the hazard go on
//   • (no storm: the Command Center room opens as usual and the needle slides back to green)
// Real science: water is one of the best shields against solar storm particles, so shelter plans put water round the crew.

(function () {
  const map = window.MarsMap;
  const hud = () => window.MarsHUD;
  if (!map) return;

  const INSIDE_RATES = [0.5, 0.3, 0.2, 0.1];   // inside the shelter during a storm, by tanks placed
  const SPEED = 140;                           // walking speed inside the room (px per second)
  const num = n => String(Math.round(n * 100) / 100);

  // window.RadiationShelter: what the other places ask Member 3's radiation code
  //   getHazard() the Command Center's end-of-sol summary
  //   newSol()    called when the crew sleeps: fresh tanks on the floor for the next storm
  //   isStorm()   asked by the Command Center room ("stay closed in a storm"): answers false, so the room opens
  //               in a storm too and this game pops up in its radiation shelter (the Greenhouse also asks MarsHUD)
  window.RadiationShelter = {
    isStorm: () => false,
    getHazard: () => hud()?.getHazard() ?? 0,
    newSol: () => { if (typeof resetRoom === 'function') resetRoom(); },
  };

  const TANK = '<svg width="44" height="56" viewBox="0 0 44 56" aria-hidden="true"><rect x="3" y="6" width="38" height="47" rx="12" fill="#3EC6F0" stroke="#2B2A3A" stroke-width="3"/><rect x="14" y="1.5" width="16" height="7" rx="2" fill="#9AA3AE" stroke="#2B2A3A" stroke-width="2.5"/><path d="M22 18 C15 28 15 34 22 38 C29 34 29 28 22 18 Z" fill="#FFFFFF" stroke="#2B2A3A" stroke-width="2"/></svg>';

  document.body.insertAdjacentHTML('beforeend', `
<div class="rs-shield" id="rs-shield" hidden role="dialog" aria-modal="true" aria-labelledby="rs-shieldTitle">
  <div class="rs-shield-card">
    <h2 id="rs-shieldTitle">Shield the Shelter!</h2>
    <p class="rs-shield-msg" id="rs-shieldMsg">Walk to a water tank to pick it up, then put it on a shelf.</p>
    <div class="rs-shield-body">
      <div class="rs-room" id="rs-room" aria-label="Shelter seen from above. Use the arrow keys or tap the floor to walk.">
        <div class="rs-slot rs-slot-back" data-slot="back" role="img" aria-label="Place a water tank on the back shelf"><span>Back shelf</span>${TANK}</div>
        <div class="rs-slot rs-slot-left" data-slot="left" role="img" aria-label="Place a water tank on the left shelf"><span>Left shelf</span>${TANK}</div>
        <div class="rs-slot rs-slot-right" data-slot="right" role="img" aria-label="Place a water tank on the right shelf"><span>Right shelf</span>${TANK}</div>
        <div class="rs-floor-tank rs-ft-0" data-tank="0">${TANK}</div>
        <div class="rs-floor-tank rs-ft-1" data-tank="1">${TANK}</div>
        <div class="rs-floor-tank rs-ft-2" data-tank="2">${TANK}</div>
        <div class="rs-carried" id="rs-carried" hidden>${TANK}</div>
      </div>
      <div class="rs-shield-stats">
        <div class="rs-stat"><span>Outside rate</span><b class="rs-out-rate" id="rs-outRate">+0.75 / min</b></div>
        <div class="rs-stat"><span>Inside rate</span><b id="rs-inRate">+0.5 / min</b>
          <div class="rs-in-bar"><div id="rs-inBar" style="width:100%"></div></div></div>
        <div class="rs-stat"><span>Water tanks</span><b id="rs-tankCount">0 / 3</b></div>
        <p class="rs-shield-fact">Water is great at stopping solar storm particles. That's why real shelter plans put water around the crew.</p>
      </div>
    </div>
    <button type="button" class="rs-go-out" id="rs-goOut" hidden>Back to the Command Center</button>
  </div>
</div>`);

  const $ = id => document.getElementById(id);
  const shield = $('rs-shield'), room = $('rs-room'), carried = $('rs-carried');
  const roomTanks = [...room.querySelectorAll('[data-tank]')];
  const crew = window.createAvatar(room);
  crew.el.classList.add('rs-room-avatar');

  const ROOM_W = 320, ROOM_H = 280;
  const FEET = { x1: 18, y1: 40, x2: ROOM_W - 18, y2: ROOM_H - 6 };
  const CREW_START = { x: 160, y: 170 };
  const PICK_DIST = 24, SLOT_REACH = 12;
  let cx = CREW_START.x, cy = CREW_START.y, holding = null, walkTo = null;
  let tanks = 0, wasStorm = false;
  const roomKeys = {};

  const isOpen = () => !shield.hidden;
  const storm = () => !!hud()?.isStorm();
  function setMsg(text, good) { const m = $('rs-shieldMsg'); m.textContent = text; m.classList.toggle('rs-ready', !!good); }
  function tellHud() { hud()?.setShelterRate?.(storm() ? INSIDE_RATES[tanks] : null); }

  function crewPlace() {
    crew.moveTo(cx, cy);
    if (holding) { carried.style.left = (cx - 13) + 'px'; carried.style.top = (cy - 92) + 'px'; }
  }
  function resetRoom() {
    cx = CREW_START.x; cy = CREW_START.y; holding = null; walkTo = null; tanks = 0;
    for (const k in roomKeys) roomKeys[k] = false;
    roomTanks.forEach(t => t.classList.remove('rs-used'));
    room.querySelectorAll('[data-slot]').forEach(s => s.classList.remove('rs-placed'));
    carried.hidden = true;
    crew.face('down'); crew.setWalking(false);
    crewPlace();
  }
  function updateStats() {
    $('rs-inRate').textContent = `+${num(INSIDE_RATES[tanks])} / min`;
    $('rs-inBar').style.width = (INSIDE_RATES[tanks] / INSIDE_RATES[0] * 100) + '%';
    $('rs-tankCount').textContent = `${tanks} / 3`;
  }

  let pausedBefore = false;              // the Command Center room pauses the map: let time run while shielding
  function open() {
    map.releaseKeys();
    pausedBefore = map.isPaused();
    map.pause(false);
    shield.hidden = false;
    $('rs-goOut').hidden = true;
    $('rs-shieldTitle').textContent = 'Shield the Shelter!';
    if (tanks < 3) setMsg('Walk to a water tank to pick it up, then put it on a shelf.');
    map.status('In the radiation shelter. Shield it with water tanks and wait for the all-clear.');
    tellHud(); crewPlace(); updateStats();
  }
  function allClear() {
    $('rs-shieldTitle').textContent = 'All clear!';
    setMsg(tanks === 3 ? 'All 3 water tanks are on the shelves. The shelter is shielded! Go back to the Command Center.'
                       : 'The storm has passed. Go back to the Command Center and finish the mission.', true);
    $('rs-goOut').hidden = false;
    $('rs-goOut').focus();
    tellHud();
  }

  function placeTank(slot) {
    if (!slot || slot.classList.contains('rs-placed') || !storm() || tanks >= 3) return false;
    slot.classList.add('rs-placed');
    tanks++;
    if (tanks === 3) { hud()?.endStorm?.(); allClear(); }   // all 3 tanks on the shelves: shielded, the kid can go back
    else setMsg(`Tank on the shelf! Inside rate is now +${num(INSIDE_RATES[tanks])} / min. ${3 - tanks} to go.`);
    tellHud(); updateStats();
    return true;
  }
  function slotUnderFeet() {
    return [...room.querySelectorAll('[data-slot]:not(.rs-placed)')].find(sl =>
      cx >= sl.offsetLeft - SLOT_REACH && cx <= sl.offsetLeft + sl.offsetWidth + SLOT_REACH &&
      cy >= sl.offsetTop - SLOT_REACH && cy <= sl.offsetTop + sl.offsetHeight + SLOT_REACH);
  }

  // walking inside the room (arrow keys / W A S D / the iPad joystick, or tap the floor)
  function updateRoom(dt) {
    let dx = (roomKeys.right ? 1 : 0) - (roomKeys.left ? 1 : 0);
    let dy = (roomKeys.down ? 1 : 0) - (roomKeys.up ? 1 : 0);
    let step = SPEED * dt;
    if (dx || dy) {
      walkTo = null;
      if (dx && dy) step *= Math.SQRT1_2;
      cx += dx * step; cy += dy * step;
    } else if (walkTo) {
      const ddx = walkTo.x - cx, ddy = walkTo.y - cy, d = Math.hypot(ddx, ddy);
      if (d <= step) { cx = walkTo.x; cy = walkTo.y; walkTo = null; }
      else {
        cx += ddx / d * step; cy += ddy / d * step;
        dx = Math.abs(ddx) > d * 0.38 ? Math.sign(ddx) : 0;
        dy = Math.abs(ddy) > d * 0.38 ? Math.sign(ddy) : 0;
      }
    }
    cx = Math.max(FEET.x1, Math.min(FEET.x2, cx));
    cy = Math.max(FEET.y1, Math.min(FEET.y2, cy));
    const moving = !!(dx || dy);
    if (moving) crew.faceToward(dx, dy);
    crew.setWalking(moving);
    if (storm() && tanks < 3) {
      if (!holding) {
        const t = roomTanks.find(t => !t.classList.contains('rs-used') &&
          Math.hypot(cx - (t.offsetLeft + t.offsetWidth / 2), cy - (t.offsetTop + t.offsetHeight)) < PICK_DIST);
        if (t) { holding = t; t.classList.add('rs-used'); carried.hidden = false; setMsg('Got it! Now carry the tank to an empty shelf.'); }
      } else {
        const slot = slotUnderFeet();
        if (slot && placeTank(slot)) { holding = null; carried.hidden = true; }
      }
    }
    room.classList.toggle('rs-carrying', !!holding);
    crewPlace();
  }

  room.addEventListener('pointerdown', e => {
    if (!isOpen()) return;
    const r = room.getBoundingClientRect();
    const scale = r.width / room.offsetWidth || 1;
    walkTo = { x: (e.clientX - r.left) / scale - room.clientLeft, y: (e.clientY - r.top) / scale - room.clientTop };
  });
  const DIRS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                 KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  // while it is open the keys walk in THIS room only (not the Command Center room behind it, not out of a door)
  window.addEventListener('keydown', e => {
    if (!isOpen()) return;
    e.stopImmediatePropagation();
    const d = DIRS[e.key] || DIRS[e.code];
    if (d) { roomKeys[d] = true; e.preventDefault(); }
    if ((e.key === 'Enter' || e.key === ' ') && !$('rs-goOut').hidden) { e.preventDefault(); $('rs-goOut').click(); }
  }, true);
  window.addEventListener('keyup', e => {
    const d = DIRS[e.key] || DIRS[e.code];
    if (d) roomKeys[d] = false;
    // key-ups always go through, so the Command Center room never keeps a key "held" from before the pop-up
  }, true);
  map.on('key', () => isOpen());

  $('rs-goOut').addEventListener('click', () => {
    shield.hidden = true;
    // the tanks stay on the shelf in the Command Center room (until the next storm or the next sol)
    cx = CREW_START.x; cy = CREW_START.y; holding = null; walkTo = null; carried.hidden = true;
    for (const k in roomKeys) roomKeys[k] = false;
    tellHud();
    if (pausedBefore && document.querySelector('[data-b="shelter"]')) map.pause(true);   // back to the Command Center room
  });

  // ---- hooking into the map + side panel ----
  // ---- the water tanks + shelf drawn in the Command Center room's radiation shelter ----
  //   3 tanks wait on the floor; the ones the kid put on the shelves in the game stand on the room's shelf
  const MINI_TANK = TANK.replace('width="44" height="56"', 'width="26" height="33"');
  let shownTanks = -1, decorated = null;
  function syncRoomShelter() {
    const sh = document.querySelector('[data-b="shelter"]');
    if (!sh) { decorated = null; return; }
    if (decorated !== sh) {
      sh.insertAdjacentHTML('beforeend', `
        <div class="rs-cc-floor-tanks" aria-hidden="true">${('<span class="rs-cc-tank">' + MINI_TANK + '</span>').repeat(3)}</div>
        <div class="rs-cc-shelf" aria-label="Water tank shelf">${('<span class="rs-cc-spot">' + MINI_TANK + '</span>').repeat(3)}</div>`);
      decorated = sh; shownTanks = -1;
    }
    if (shownTanks === tanks) return;
    shownTanks = tanks;
    sh.querySelectorAll('.rs-cc-floor-tanks .rs-cc-tank').forEach((t, i) => t.classList.toggle('rs-cc-gone', i < tanks));
    sh.querySelectorAll('.rs-cc-spot').forEach((t, i) => t.classList.toggle('rs-cc-full', i < tanks));
  }

  // open when the astronaut walks into the Command Center room's radiation shelter during a storm
  let wasInShelter = false;
  (function watch() {
    syncRoomShelter();
    const inShelter = !!getGame()?.inShelter && !!document.querySelector('[data-b="shelter"]');
    if (inShelter && !wasInShelter && storm() && !isOpen()) open();
    wasInShelter = inShelter;
    requestAnimationFrame(watch);
  })();
  map.on('update', dt => {
    const s = storm();
    if (s && !wasStorm) { resetRoom(); }                // a new storm: fresh tanks on the floor
    wasStorm = s;
    tellHud();
    if (!isOpen()) return;
    updateRoom(dt);
    if (!s && $('rs-goOut').hidden) allClear();         // the storm ended (by itself or after shielding)
  });

  resetRoom();
  window.ShieldShelter = { open, isOpen, tanks: () => tanks };
})();
