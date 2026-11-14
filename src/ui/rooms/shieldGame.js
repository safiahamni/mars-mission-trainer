// SHIELD THE SHELTER (Member 3's mini-game, moved inside the Command Center's storm shelter core).
// When a solar storm is coming and the crew is in the core, this pop-up opens:
//   1. pump water into the tanks (costs 25 power, from the Power Budget)
//   2. walk onto a tank to pick it up, carry it to an empty shelf (3 shelves)
// Every tank lowers the radiation inside the core. Rules live in systems/radiation.js
// and systems/commandCenter.js; this file is only the screen.
//
//   const shield = createShieldGame(stageEl, { getGame, setGame, say });
//   shield.open();  shield.step(dt, dx, dy);  shield.isOpen();
import './shieldGame.css';
import { createAvatar } from '../avatar.js';
import { dressAvatar } from '../outfit.js';
import { icon } from '../icons.js';
import { COSTS } from '../../systems/power.js';
import { RAD_CONFIG, hazardRate, hazardLevel } from '../../systems/radiation.js';
import { fillTanks, placeTank, stormActive } from '../../systems/commandCenter.js';

// one water tank picture (Member 3)
const TANK = '<svg width="44" height="56" viewBox="0 0 44 56" aria-hidden="true"><rect x="3" y="6" width="38" height="47" rx="12" fill="#3EC6F0" stroke="#2B2A3A" stroke-width="3"/><rect x="14" y="1.5" width="16" height="7" rx="2" fill="#9AA3AE" stroke="#2B2A3A" stroke-width="2.5"/><path d="M22 18 C15 28 15 34 22 38 C29 34 29 28 22 18 Z" fill="#FFFFFF" stroke="#2B2A3A" stroke-width="2"/></svg>';

const ROOM_W = 320;
const ROOM_H = 280;                                         // floor size inside the grey wall
const FEET = { x1: 18, y1: 40, x2: ROOM_W - 18, y2: ROOM_H - 6 };
const CREW_START = { x: 160, y: 170 };
const PICK_DIST = 24;                                       // how close the feet must get to grab a tank
const SLOT_REACH = 12;                                      // how close to a shelf = tank put on it
const SPEED = 160;
const SLOTS = ['back', 'left', 'right'];

export function createShieldGame(stage, { getGame, setGame, say }) {
  stage.insertAdjacentHTML('beforeend', `
  <div class="rs-shield" data-s="shield" hidden role="dialog" aria-modal="true" aria-labelledby="rs-shieldTitle">
    <div class="rs-shield-card">
      <h2 id="rs-shieldTitle" data-s="title">Shield the Shelter!</h2>
      <p class="rs-shield-msg" data-s="msg"></p>
      <div class="rs-shield-body">
        <div class="rs-room" data-s="room" aria-label="Shelter seen from above. Use the arrow keys or tap the floor to walk.">
          <div class="rs-slot rs-slot-back" data-slot="back" role="img" aria-label="Back shelf"><span>Back shelf</span>${TANK}</div>
          <div class="rs-slot rs-slot-left" data-slot="left" role="img" aria-label="Left shelf"><span>Left shelf</span>${TANK}</div>
          <div class="rs-slot rs-slot-right" data-slot="right" role="img" aria-label="Right shelf"><span>Right shelf</span>${TANK}</div>
          <div class="rs-floor-tank rs-ft-0" data-tank="0">${TANK}</div>
          <div class="rs-floor-tank rs-ft-1" data-tank="1">${TANK}</div>
          <div class="rs-floor-tank rs-ft-2" data-tank="2">${TANK}</div>
          <div class="rs-carried" data-s="carried" hidden>${TANK}</div>
        </div>
        <div class="rs-shield-stats">
          <div class="rs-stat rs-fill" data-s="fill"></div>
          <div class="rs-stat"><span>Outside rate</span><b class="rs-out-rate" data-s="out"></b></div>
          <div class="rs-stat"><span>Inside the core</span><b data-s="in"></b>
            <div class="rs-in-bar"><div data-s="inbar"></div></div></div>
          <div class="rs-stat"><span>Water tanks</span><b data-s="count"></b></div>
          <div class="rs-stat"><span>${icon('radiation', 16)} Hazard meter</span><b data-s="hazard"></b></div>
          <p class="rs-shield-fact">Water is great at stopping solar storm particles. That's why real shelter plans put water around the crew.</p>
        </div>
      </div>
      <button type="button" class="rs-go-out" data-s="close">Back to the room</button>
    </div>
  </div>`);

  const el = (name) => stage.querySelector(`[data-s="${name}"]`);
  const shield = el('shield');
  const room = el('room');
  const carried = el('carried');
  const floorTanks = [...room.querySelectorAll('[data-tank]')];
  const slots = [...room.querySelectorAll('[data-slot]')];

  const crew = createAvatar(room);
  crew.el.classList.add('rs-room-avatar');
  let cx = CREW_START.x;
  let cy = CREW_START.y;
  let holding = false;
  let walkTo = null;
  let placed = [];          // which shelves have a tank, in the order they were filled
  let lastMsg = '';

  function setMsg(text, good = false) {
    lastMsg = text;
    el('msg').textContent = text;
    el('msg').classList.toggle('rs-ready', good);
  }

  function crewPlace() {
    crew.moveTo(cx, cy);
    if (holding) {
      carried.style.left = `${cx - 13}px`;
      carried.style.top = `${cy - 92}px`;
    }
  }

  // draw the pop-up from the game state
  function render() {
    const g = getGame();
    if (g.tanks < placed.length) {           // a new sol started: empty the shelves
      placed = [];
      holding = false;
    }
    const storm = g.storm === 'storm';
    const used = placed.length + (holding ? 1 : 0);
    floorTanks.forEach((t, i) => {
      t.classList.toggle('rs-used', i < used);
      t.classList.toggle('rs-empty', !g.tanksFilled);
    });
    slots.forEach((s) => s.classList.toggle('rs-placed', placed.includes(s.dataset.slot)));
    carried.hidden = !holding;
    room.classList.toggle('rs-carrying', holding);

    const outside = hazardRate({ where: 'outside', storm: true });
    const inside = hazardRate({ where: 'core', storm: true, tanks: g.tanks });
    el('out').textContent = `+${outside.toFixed(1)} / min`;
    el('in').textContent = `+${inside.toFixed(1)} / min`;
    el('inbar').style.width = `${(inside / RAD_CONFIG.coreRates[0]) * 100}%`;
    el('count').textContent = `${g.tanks} / ${RAD_CONFIG.tanks}`;
    el('hazard').textContent = `${Math.floor(g.hazard)} / ${RAD_CONFIG.max}`;
    el('hazard').className = `rs-haz-${hazardLevel(g.hazard)}`;

    // step 1: pump water into the tanks
    if (g.tanksFilled) {
      el('fill').innerHTML = `<span>Step 1</span><b class="rs-ok">${icon('check', 18)} Tanks filled</b>`;
    } else {
      const need = COSTS.shielding - g.power.battery;
      el('fill').innerHTML = `<span>Step 1</span>
        <button type="button" class="rs-fill-btn" data-s="fillbtn" ${need > 0 || !stormActive(g) ? 'disabled' : ''}>
          ${icon('droplet', 18)} Pump water into the tanks · ${icon('zap', 14)} ${COSTS.shielding}
        </button>${need > 0 ? `<small class="rs-need">Need ${need} more power</small>` : ''}`;
    }

    // title + message
    if (g.storm === 'over' || g.storm === 'none') {
      el('title').textContent = 'All clear!';
      setMsg('The storm has passed. You can go back out.', true);
    } else {
      el('title').textContent = storm ? 'Shield the Shelter!' : 'Get ready: storm coming!';
      if (g.tanks >= RAD_CONFIG.tanks) setMsg(`Shielding ready! Radiation inside is only +${inside.toFixed(1)} / min.`, true);
      else if (!g.tanksFilled) setMsg('Pump water into the tanks first. Then carry them onto the shelves.');
      else if (holding) setMsg('Got it! Now carry the tank to an empty shelf.');
      else if (!lastMsg.startsWith('Tank on the shelf')) setMsg('Walk to a water tank to pick it up, then put it on a shelf.');
    }
  }

  function open() {
    if (!shield.hidden) return;
    shield.hidden = false;
    cx = CREW_START.x;
    cy = CREW_START.y;
    walkTo = null;
    lastMsg = '';
    dressAvatar(crew, getGame());
    crew.face('down');
    crewPlace();
    render();
  }

  function close() {
    shield.hidden = true;
    crew.setWalking(false);
  }

  // the empty shelf the feet are standing at
  function slotUnderFeet() {
    return slots.find((sl) => !placed.includes(sl.dataset.slot)
      && cx >= sl.offsetLeft - SLOT_REACH && cx <= sl.offsetLeft + sl.offsetWidth + SLOT_REACH
      && cy >= sl.offsetTop - SLOT_REACH && cy <= sl.offsetTop + sl.offsetHeight + SLOT_REACH);
  }

  // every frame while open: dx, dy = which way the keys point (-1, 0, 1)
  function step(dt, dx, dy) {
    let move = SPEED * dt;
    if (dx || dy) {
      walkTo = null;
      if (dx && dy) move *= Math.SQRT1_2;
      cx += dx * move;
      cy += dy * move;
    } else if (walkTo) {
      const ddx = walkTo.x - cx;
      const ddy = walkTo.y - cy;
      const d = Math.hypot(ddx, ddy);
      if (d <= move) { cx = walkTo.x; cy = walkTo.y; walkTo = null; } else {
        cx += (ddx / d) * move;
        cy += (ddy / d) * move;
        dx = Math.abs(ddx) > d * 0.38 ? Math.sign(ddx) : 0;
        dy = Math.abs(ddy) > d * 0.38 ? Math.sign(ddy) : 0;
      }
    }
    cx = Math.max(FEET.x1, Math.min(FEET.x2, cx));
    cy = Math.max(FEET.y1, Math.min(FEET.y2, cy));
    const moving = !!(dx || dy);
    if (moving) crew.faceToward(dx, dy);
    crew.setWalking(moving);

    const g = getGame();
    if (g.tanksFilled && stormActive(g) && g.tanks < RAD_CONFIG.tanks) {
      if (!holding) {
        const used = placed.length;
        const t = floorTanks.find((ft, i) => i >= used
          && Math.hypot(cx - (ft.offsetLeft + ft.offsetWidth / 2), cy - (ft.offsetTop + ft.offsetHeight)) < PICK_DIST);
        if (t) { holding = true; render(); }
      } else {
        const slot = slotUnderFeet();
        if (slot) {
          const r = placeTank(getGame());
          if (r.ok) {
            placed.push(slot.dataset.slot);
            holding = false;
            setGame(r.game);
            const left = RAD_CONFIG.tanks - r.game.tanks;
            setMsg(left ? `Tank on the shelf! Inside rate is now +${hazardRate({ where: 'core', storm: true, tanks: r.game.tanks }).toFixed(1)} / min. ${left} to go.` : 'All 3 tanks are on the shelves!', !left);
            render();
          }
        }
      }
    }
    crewPlace();
  }

  // tap / click the floor: walk there
  room.addEventListener('pointerdown', (e) => {
    const r = room.getBoundingClientRect();
    const scale = r.width / room.offsetWidth || 1;
    walkTo = { x: (e.clientX - r.left) / scale - room.clientLeft, y: (e.clientY - r.top) / scale - room.clientTop };
  });

  shield.addEventListener('click', (e) => {
    if (e.target.closest('[data-s="close"]')) return close();
    if (e.target.closest('[data-s="fillbtn"]')) {
      const r = fillTanks(getGame());
      if (r.ok) setGame(r.game);
      say(r.message);
      render();
    }
  });

  return { open, close, step, render, isOpen: () => !shield.hidden };
}