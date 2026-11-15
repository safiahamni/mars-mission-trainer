// COMMAND CENTER on the base map (Member 1).
// - When the crew goes into the 'shelter' place (the Command Center), the Command Center room opens.
//   The room's exit door brings you back to the map, still in the Command Center,
//   so the arrow keys pick a road (◀ Greenhouse · ▲ Science Lab · ▶ Life Support).
// - During Member 3's solar storm the room stays closed: their "Shield the Shelter" pop-up
//   opens on the map instead (src/places/radiation-shelter/shelter-game.js).
// - Shows a small status card in the map's top bar (sol, time, power, water, stars)
//   and sunset messages on the map. Radiation is in Member 3's top bar.
import './commandCenterPlace.css';
import { renderCommandCenter } from '../../ui/rooms/commandCenter.js';
import { icon } from '../../ui/icons.js';
import { dressAvatar } from '../../ui/outfit.js';
import { getGame, onGameChange } from '../../state/gameStore.js';
import { CC_CONFIG, isDay, todaysChapter } from '../../systems/commandCenter.js';
import { POWER_CONFIG, spendable } from '../../systems/power.js';

const map = window.MarsMap;
let roomEl = null;

const stormNow = () => !!window.RadiationShelter?.isStorm();

// ---------- the Command Center room ----------
function openRoom() {
  if (roomEl || stormNow()) return;      // in a storm, Member 3's Shield the Shelter opens instead
  map.releaseKeys();
  map.pause(true);                       // the map waits while the room is open
  roomEl = document.createElement('div');
  document.body.appendChild(roomEl);
  renderCommandCenter(roomEl, { onExit: closeRoom });
}

function closeRoom() {
  if (!roomEl) return;
  roomEl.remove();                       // the room cleans up its own keys and timers
  roomEl = null;
  map.pause(false);
  map.status('In the Command Center. Go out: ◀ Greenhouse · ▲ Science Lab · ▶ Life Support');
  update();
}

map.on('enter', (place) => {
  if (place === 'shelter') openRoom();
});

// ---------- status card in the map's top bar ----------
document.getElementById('mm-topbar').insertAdjacentHTML('beforeend', '<div class="cc-mapbar" id="cc-mapbar"></div>');
const bar = document.getElementById('cc-mapbar');

let dressed = '';
function update() {
  const g = getGame();
  // the avatar on the map wears what was picked in the wardrobe
  if (dressed !== `${g.outfit}-${g.shirt}`) {
    dressed = `${g.outfit}-${g.shirt}`;
    dressAvatar(map.player, g);
  }
  const p = g.power;
  const low = p.battery < POWER_CONFIG.nightReserve;
  const ch = todaysChapter(g);
  const time = !isDay(g) ? `${icon('moon', 16)} Night: sleep in the Command Center`
    : g.done.chapter || !ch ? `${icon('sun', 16)} Day · no chapter today`
    : `${icon('sun', 16)} Day · Chapter ${ch.n} in the Science Lab`;
  bar.innerHTML = `
    <div class="cc-mapbar-row"><strong>Sol ${g.sol} of ${CC_CONFIG.maxSols}</strong><span>${icon('star', 16)} ${g.stars}</span></div>
    <div class="cc-mapbar-row">${time}</div>
    <div class="cc-mapbar-row ${low ? 'bad' : ''}">${icon('zap', 16)} Power ${p.battery}/100 <small>${low ? `${POWER_CONFIG.nightReserve - p.battery} short for night` : `${spendable(p)} to spend`}</small></div>
    <div class="cc-mapbar-row">${icon('droplet', 16)} Water ${g.water}</div>`;
}

// ---------- messages on the map (only while the room is closed; the room has its own) ----------
onGameChange((g, events) => {
  update();
  if (roomEl) return;
  for (const ev of events) {
    if (ev === 'sunset-safe' || ev === 'sunset-low') map.toast('Sunset! Head back to the Command Center to sleep.');
  }
});

// The crew starts inside the Command Center, so the game opens in the room
// (unless the start screen is showing: then the spaceship drops the crew on the road outside instead)
update();
if (map.isInside() === 'shelter' && !window.MartianoutsStart?.isOpen()) openRoom();