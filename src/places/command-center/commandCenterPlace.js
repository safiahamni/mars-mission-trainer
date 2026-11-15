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
import { isDay, chapterCheck } from '../../systems/commandCenter.js';
import { POWER_CONFIG } from '../../systems/power.js';

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
  placeRoom();
  renderCommandCenter(roomEl, { onExit: closeRoom });
}

// The room sits next to the left column (not on top of it), so the cards stay visible inside.
function placeRoom() {
  if (!roomEl) return;
  const col = document.getElementById('mm-topbar').getBoundingClientRect();
  const stacked = col.width > window.innerWidth / 2;   // narrow screens: the cards are a row on top
  roomEl.style.left = stacked ? '0px' : `${Math.round(col.right + 16)}px`;
  roomEl.style.top = stacked ? `${Math.round(col.bottom + 12)}px` : '0px';
}
window.addEventListener('resize', placeRoom);

// dir = the door the player walked through: the astronaut comes out onto that road on the map
function closeRoom(dir) {
  if (!roomEl) return;
  roomEl.remove();                       // the room cleans up its own keys and timers
  roomEl = null;
  map.pause(false);
  update();
  if (dir === 'left' || dir === 'up' || dir === 'right') {
    map.leave(dir);                      // Greenhouse / Science Lab / Life Support road
  } else if (dir === 'down') {
    // the airlock and solar panel yard (radiation-shelter/solar-panel.js) open with ▼ from the Command Center
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true }));
  } else {
    map.status('In the Command Center. Go out: ◀ Greenhouse · ▲ Science Lab · ▶ Life Support · ▼ Airlock');
  }
}

map.on('enter', (place) => {
  if (place === 'shelter') openRoom();
});

// ---------- resources card in the left column (on the map AND next to the room) ----------
// Power, oxygen, water and food. A black line on each bar = what today's chapter needs.
document.getElementById('mm-topbar').insertAdjacentHTML('beforeend', '<div class="cc-res" id="cc-res" role="status"></div>');
const card = document.getElementById('cc-res');
const BARS = [
  { id: 'power', name: 'Power', icon: 'zap' },
  { id: 'oxygen', name: 'Oxygen', icon: 'wind' },
  { id: 'water', name: 'Water', icon: 'droplet' },
  { id: 'food', name: 'Food', icon: 'carrot' },
];

let dressed = '';
function update() {
  const g = getGame();
  // the avatar on the map wears what was picked in the wardrobe
  if (dressed !== `${g.outfit}-${g.shirt}`) {
    dressed = `${g.outfit}-${g.shirt}`;
    dressAvatar(map.player, g);
  }
  const have = { power: g.power.battery, oxygen: g.oxygen, water: g.water, food: g.food };
  const ch = chapterCheck(g);
  const showNeeds = isDay(g) && ch.chapter && !g.done.chapter;
  const title = !isDay(g) ? 'Sleep in the Command Center'
    : g.done.chapter ? 'Done! Sleep in the Command Center'
    : ch.reason === 'dust-storm' ? 'Dust storm: no chapter today'
    : ch.reason === 'all-done' ? 'All chapters done!'
    : `Chapter ${ch.chapter.n}: ${ch.chapter.name}`;

  card.innerHTML = `
    <div class="cc-res-head"><strong>${title}</strong><span>${icon('star', 16)} ${g.stars}</span></div>
    ${BARS.map((b) => {
      const v = have[b.id];
      const need = showNeeds ? ch.chapter.needs[b.id] : null;
      let chip = '';
      if (!isDay(g) && b.id === 'power') {
        chip = v >= POWER_CONFIG.nightReserve ? '<em class="ok">warm night ✓</em>' : '<em class="no">cold night!</em>';
      } else if (need != null) {
        chip = v >= need ? '<em class="ok">✓</em>' : `<em class="no">+${need - v} needed</em>`;
      }
      return `<div class="cc-res-row cc-res-${b.id}">
        <div class="cc-res-top">${icon(b.icon, 16)} ${b.name} ${chip}<b>${v}</b></div>
        <div class="cc-res-track"><i style="width:${Math.max(0, Math.min(100, v))}%"></i>
          ${need != null ? `<span class="cc-res-need" style="left:${need}%"></span>` : ''}
          ${b.id === 'power' ? `<span class="cc-res-night" style="left:${POWER_CONFIG.nightReserve}%"></span>` : ''}
        </div>
      </div>`;
    }).join('')}`;
  card.setAttribute('aria-label', `${title}. ${BARS.map((b) => `${b.name} ${have[b.id]}`).join(', ')}.`);
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
update();
if (map.isInside() === 'shelter') openRoom();