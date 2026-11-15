import { spend } from '../../systems/commandCenter.js';
import { COSTS } from '../../systems/power.js';
import { getGame, setGame, pauseClock, onGameChange } from '../../state/gameStore.js';

const map = window.MarsMap;

// ================= THE BUILDING ON THE BASE MAP =================
// Drawn the same way as the Command Center building (ccBuilding.js): a navy name tag,
// a light wall with a tiled floor, and small machines inside — CO2 Intake → MOXIE → 3 oxygen
// tanks on top, the power cell and the water recycler below. Same size as the Command Center.
// The oxygen tanks show the real oxygen level. Everything starts with ls- so nothing clashes.
const W = 226, H = 160;                      // the drawing's size (the same as the Command Center's)
const SCALE = 0.7;                           // the Command Center is drawn at 0.7 on the map
const O2_TOP = 54, O2_HEIGHT = 34;           // where the blue oxygen sits inside each tank

const tank = (x) => `
  <rect x="${x + 4}" y="44" width="8" height="5" rx="1.5" fill="#2B2A3A"/>
  <rect x="${x}" y="48" width="16" height="44" rx="8" fill="#FFFFFF" stroke="#2B2A3A" stroke-width="2"/>
  <rect class="ls-o2" x="${x + 3}" y="${O2_TOP}" width="10" height="${O2_HEIGHT}" rx="4" fill="#3EC6F0"/>`;

const BUILDING = `
  <!-- name tag -->
  <rect x="0" y="-16" width="168" height="40" rx="9" fill="#2B2A3A"/>
  <circle cx="21" cy="4" r="7" fill="#3EC6F0" stroke="#FFFFFF" stroke-width="2"/>
  <text x="98" y="11" font-size="20" text-anchor="middle" fill="#FFFFFF">Life Support</text>
  <!-- walls + tiled floor -->
  <rect class="ls-wall" x="0" y="32" width="${W}" height="128" rx="16" fill="#E6E4EA" stroke="#2B2A3A" stroke-width="3"/>
  <rect x="7" y="39" width="212" height="114" rx="10" fill="url(#ctile)" stroke="#2B2A3A" stroke-width="2.5"/>
  <!-- CO2 Intake: vents + 3 red lights -->
  <rect x="16" y="52" width="46" height="34" rx="6" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2"/>
  <path d="M23 60 h32 M23 66 h32" stroke="#9AA0AD" stroke-width="2.5" stroke-linecap="round"/>
  <g fill="#E0605A" stroke="#2B2A3A" stroke-width="1.2"><circle cx="29" cy="77" r="3"/><circle cx="39" cy="77" r="3"/><circle cx="49" cy="77" r="3"/></g>
  <!-- pipe with arrow -->
  <rect x="62" y="64" width="20" height="10" fill="#AEB7C9" stroke="#2B2A3A" stroke-width="1.5"/>
  <path d="M66 69 h9 M73 66 l3 3 l-3 3" fill="none" stroke="#2B2A3A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- MOXIE: grey machine, dark screen, yellow light, 3 knobs -->
  <rect x="94" y="46" width="22" height="6" rx="2" fill="#B8BFCB" stroke="#2B2A3A" stroke-width="1.5"/>
  <rect class="ls-moxie" x="82" y="50" width="56" height="42" rx="7" fill="#737D91" stroke="#2B2A3A" stroke-width="2"/>
  <rect x="88" y="56" width="30" height="16" rx="3" fill="#30384A"/>
  <text x="103" y="67" font-size="7" text-anchor="middle" fill="#EEF0F5">MOXIE</text>
  <rect x="124" y="57" width="8" height="8" rx="1.5" fill="#FFD23F" stroke="#2B2A3A" stroke-width="1"/>
  <g fill="#5B6577" stroke="#2B2A3A" stroke-width="1.2"><circle cx="94" cy="83" r="3"/><circle cx="104" cy="83" r="3"/><circle cx="114" cy="83" r="3"/></g>
  <!-- pipe with arrow -->
  <rect x="138" y="64" width="16" height="10" fill="#AEB7C9" stroke="#2B2A3A" stroke-width="1.5"/>
  <path d="M141 69 h7 M146 66 l3 3 l-3 3" fill="none" stroke="#2B2A3A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- 3 oxygen tanks -->
  ${tank(156)}${tank(174)}${tank(192)}
  <!-- power cell: 3 yellow cells -->
  <rect x="34" y="106" width="12" height="5" rx="1.5" fill="#B8BFCB" stroke="#2B2A3A" stroke-width="1.2"/>
  <rect x="20" y="110" width="40" height="30" rx="5" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2"/>
  <g fill="#FFD23F" stroke="#2B2A3A" stroke-width="1.2"><rect x="26" y="116" width="8" height="18" rx="2"/><rect x="36" y="116" width="8" height="18" rx="2"/><rect x="46" y="116" width="8" height="18" rx="2"/></g>
  <!-- water recycler: clean water, filter, cup, power -->
  <rect x="136" y="106" width="74" height="38" rx="6" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2"/>
  <rect x="142" y="112" width="13" height="26" rx="3" fill="#FFFFFF" stroke="#2B2A3A" stroke-width="1.3"/><rect x="143.5" y="126" width="10" height="10.5" rx="2" fill="#3EC6F0"/>
  <rect x="159" y="112" width="13" height="26" rx="3" fill="#B98A5E" stroke="#2B2A3A" stroke-width="1.3"/><path d="M162 119 h7 M162 125 h7 M162 131 h7" stroke="#7A5634" stroke-width="1.2"/>
  <rect x="176" y="112" width="13" height="26" rx="3" fill="#FFFFFF" stroke="#2B2A3A" stroke-width="1.3"/>
  <rect x="193" y="112" width="13" height="26" rx="3" fill="#9B6BF2" stroke="#2B2A3A" stroke-width="1.3"/><path d="M200.5 117 l-3 7 h4 l-3 7" fill="none" stroke="#FFD23F" stroke-width="1.5" stroke-linejoin="round"/>
  <text x="98" y="130" font-size="10" text-anchor="middle" fill="#2B2A3A" class="ls-label">Air + water</text>`;

// put the building in the map, in the middle of the Life Support spot (in place of the picture)
const place = document.getElementById('place-life');
const spot = place?.querySelector('.mm-spot');
let building = null;
if (place && spot) {
  const num = (name) => Number(spot.getAttribute(name)) || 0;
  const cx = num('x') + num('width') / 2;
  const cy = num('y') + num('height') / 2;
  place.innerHTML = `<g id="ls-building" transform="translate(${cx - (W * SCALE) / 2} ${cy - (H * SCALE) / 2}) scale(${SCALE})">${BUILDING}</g>`;
  building = document.getElementById('ls-building');

  const style = document.createElement('style');
  style.textContent = `
    #ls-building text { font-family: 'Nunito', sans-serif; font-weight: 900; }
    #ls-building .ls-label { font-weight: 800; opacity: 0.55; }
    #ls-building.ls-inside .ls-wall { stroke: #5CE0B5; stroke-width: 6; }          /* crew inside: green outline */
    #ls-building .ls-o2 { transition: y 0.6s, height 0.6s; }
    #ls-building.ls-low .ls-o2 { fill: #FF5A5A; animation: ls-pulse 0.8s infinite alternate; }  /* low oxygen: red */
    @keyframes ls-pulse { to { opacity: 0.4; } }`;
  document.head.append(style);
}

// the tanks show the real oxygen level
function showOxygen() {
  if (!building) return;
  const level = Math.max(0, Math.min(100, getGame().oxygen ?? 0)) / 100;
  const height = Math.max(2, O2_HEIGHT * level);
  building.querySelectorAll('.ls-o2').forEach(rect => {
    rect.setAttribute('y', O2_TOP + O2_HEIGHT - height);
    rect.setAttribute('height', height);
  });
  building.classList.toggle('ls-low', level < 0.25);
}
showOxygen();
onGameChange(showOxygen);

// green outline while the crew is inside
map.on('enter', where => building?.classList.toggle('ls-inside', where === 'life'));
map.on('leave', () => building?.classList.remove('ls-inside'));
building?.classList.toggle('ls-inside', map.isInside() === 'life');

const room = document.createElement('section');
room.hidden = true;
Object.assign(room.style, {
  position: 'fixed', inset: '0', zIndex: '1000',
  background: '#c65a2e radial-gradient(#ad4b24 1.4px, transparent 1.6px) 0 0 / 22px 22px'   // dotted Mars ground, like the map
});


const frame = document.createElement('iframe');
frame.title = 'Life Support';
Object.assign(frame.style, {
  position: 'absolute', inset: '0', width: '100%',
  height: '100%', border: '0'   // walk out through the door on the left wall to go back
});

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow || room.hidden) return;
  const { type, resource, value } = event.data ?? {};
  if (type === 'mars-life:leave') {
    leaveRoom();
    return;
  }
  if (type !== 'mars-life:resource' || !['oxygen', 'water'].includes(resource)
    || !Number.isFinite(value) || value < 0 || value > 100) return;
  setGame({ ...getGame(), [resource]: value });
});

window.MarsLifeSupport = {
  runMoxie() {
    if (room.hidden) return null;
    const game = getGame();
    if (game.over || game.chapter < 2 || game.done.moxie || game.oxygen >= 100) return null;
    const result = spend(game, COSTS.moxie, 'MOXIE');
    if (!result.ok) return null;
    const oxygen = Math.min(100, game.oxygen + 20);
    setGame({ ...result.game, oxygen, done: { ...game.done, moxie: true } });
    return oxygen;
  },
  moxieCost: COSTS.moxie
};

room.append(frame);
document.body.append(room);

// The room sits next to the left column of cards (not on top of it), so the
// sol, hazard and power/oxygen/water/food cards stay visible while you play.
function placeRoom() {
  const column = document.getElementById('mm-topbar');
  if (!column) return;
  const col = column.getBoundingClientRect();
  const stacked = col.width > window.innerWidth / 2;   // narrow screens: the cards are a row on top
  room.style.left = stacked ? '0px' : `${Math.round(col.right + 16)}px`;
  room.style.top = stacked ? `${Math.round(col.bottom + 12)}px` : '0px';
}
window.addEventListener('resize', placeRoom);

function syncResources() {
  if (room.hidden) return;
  const { oxygen, water, sol, chapter, done } = getGame();
  frame.contentWindow?.postMessage({ type: 'mars-life:sync', oxygen, water, sol, scienceStars: chapter - 1, moxieRan: !!done.moxie }, location.origin);
}
frame.addEventListener('load', syncResources);

map.on('enter', place => {
  if (place !== 'life' || !room.hidden) return;
  map.releaseKeys();
  map.pause(true);
  pauseClock(true);
  if (!frame.hasAttribute('src')) frame.src = 'src/places/life-support/index.html';
  placeRoom();
  room.hidden = false;
  syncResources();
  frame.focus();
});

function leaveRoom() {
  room.hidden = true;
  map.leave('left');
  map.releaseKeys();
  map.pause(false);
  pauseClock(false);
  window.focus();
}