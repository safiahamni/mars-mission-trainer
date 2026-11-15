import './victory.css';
import { getGame, setGame } from '../../state/gameStore.js';
import { CC_CONFIG, startChapter, finishChapter } from '../../systems/commandCenter.js';

// Older map builds do not yet include the shared mission clock.
const clockStores = import.meta.glob('../../state/gameStore.js', {
  eager: true,
  import: 'pauseClock'
});
const pauseClock = clockStores['../../state/gameStore.js'];

window.MarsScienceResources = {
  read() {
    const game = getGame();
    return { power: game.power.battery, oxygen: game.oxygen, water: game.water,
      food: game.food, greenhouseProgress: game.greenhouseProgress, roverReady: game.roverReady, sol: game.sol, maxSols: CC_CONFIG.maxSols, phase: game.phase, chapter: game.chapter, radiation: window.MarsHUD?.getHazard() };
  },
  spendMission(id, powerCost, supplies) {
    const game = getGame();
    const start = startChapter(game);
    if (!start.ok || start.chapter.id !== id) return false;
    const result = finishChapter(start.game, { ...supplies, power: powerCost });
    if (result.ok) setGame(result.game, result.events);
    return result.ok;
  }
};

const map = window.MarsMap;

// ================= THE BUILDING ON THE BASE MAP =================
// Drawn in the same style as the Life Support and Command Center buildings: a light wall and
// a small copy of the inside of the lab — the purple tiled floor, the 6 chapter stations and PIP.
// Doors: left (the cliff route ends here) and bottom (the normal path ends here).
// Numbers are the Science Lab group's own (its spot is x 476-636, y 44-138).
// a station: a dark screen with a white rim and a small drawing on it
const LAB_STATION = (x, y, art, colour = '#81DFD2') => `
  <rect x="${x}" y="${y}" width="40" height="27" rx="5" fill="#2E424D" stroke="#E8E8EF" stroke-width="2.5"/>
  <g transform="translate(${x + 20} ${y + 13.5}) scale(1.35)" fill="none" stroke="${colour}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${art}</g>`;
const LAB_BUILDING = `
<g id="lab-building">
  <defs>
    <pattern id="lab-floor" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#A88CDB"/><path d="M9 0V9H0" fill="none" stroke="#8E72C4" stroke-width="0.8"/></pattern>
  </defs>
  <rect class="lab-wall" x="476" y="44" width="160" height="94" rx="14" fill="#E6E4EA" stroke="#2B2A3A" stroke-width="3"/>
  <rect x="482" y="50" width="148" height="82" rx="9" fill="url(#lab-floor)" stroke="#2B2A3A" stroke-width="2.5"/>
  <!-- doors: left (cliff route) and bottom (normal path) -->
  <g stroke="#2B2A3A" stroke-width="2" fill="#E8843F">
    <rect x="472" y="74" width="8" height="15" rx="2.5"/>
    <rect x="516" y="134" width="15" height="8" rx="2.5"/>
  </g>
  <!-- chapters 1-3 (top row) -->
  ${LAB_STATION(489, 56, '<rect x="-6" y="-4" width="12" height="5" rx="1.5"/><circle cx="-4" cy="3" r="1.8"/><circle cx="4" cy="3" r="1.8"/>', '#FFE481')}
  ${LAB_STATION(536, 56, '<path d="M-6 3 l2.5 -6 l5 -1.5 l4.5 4 l-2 4 z"/>')}
  ${LAB_STATION(583, 56, '<path d="M0 -5 v3 M-3 -2 h6 l-1 4 h-4 z M-3 2 l-2 2.5 M3 2 l2 2.5"/>')}
  <!-- chapters 4-6 (bottom row) -->
  ${LAB_STATION(489, 92, '<rect x="-6" y="-4" width="12" height="8" rx="1.5"/><circle r="2.4"/>')}
  ${LAB_STATION(536, 92, '<path d="M-6 -1 q3 -3 6 0 t6 0 M-6 3 q3 -3 6 0 t6 0"/>')}
  ${LAB_STATION(583, 92, '<path d="M0 4 v-5 M-3 -3 q3 -3 6 0 M-5.5 -5.5 q5.5 -5.5 11 0"/>')}
  <!-- PIP the robot -->
  <g transform="translate(576 126) scale(0.9)">
    <rect x="-7" y="-5" width="14" height="10" rx="3.5" fill="#EEF0F5" stroke="#2B2A3A" stroke-width="1.6"/>
    <rect x="-4.5" y="-2.5" width="9" height="4.5" rx="1.4" fill="#2E424D"/>
    <circle cx="-2" cy="-0.3" r="1" fill="#81DFD2"/><circle cx="2" cy="-0.3" r="1" fill="#81DFD2"/>
    <path d="M0 -5 v-2.5" stroke="#2B2A3A" stroke-width="1.3"/><circle cy="-8.5" r="1.5" fill="#FFD23F" stroke="#2B2A3A" stroke-width="0.9"/>
  </g>
</g>`;

const labPlace = document.getElementById('place-lab');
const labSpot = labPlace?.querySelector('.mm-spot');
if (labSpot) {
  labSpot.insertAdjacentHTML('afterend', LAB_BUILDING);
  labPlace.querySelector('circle')?.setAttribute('fill', '#A88CDB');   // purple dot on the name tag, like the floor
  const style = document.createElement('style');
  style.textContent = `
    #place-lab.mm-inside .lab-wall { stroke: #5CE0B5; stroke-width: 6; }   /* crew inside: green outline */`;
  document.head.append(style);
}

const frame = document.createElement('iframe');
frame.title = 'Science Lab';
frame.allow = 'autoplay';
frame.hidden = true;
Object.assign(frame.style, {
  position: 'fixed', inset: '0', width: '100%', height: '100%',
  border: '0', zIndex: '1000', background: '#2b2a3a'
});
document.body.append(frame);

const victory = document.createElement('dialog');
victory.className = 'science-victory';
victory.setAttribute('aria-labelledby', 'science-victory-title');
victory.innerHTML = `
  <div class="science-victory-confetti" aria-hidden="true">
    ${Array.from({ length: 84 }, (_, i) => `<span style="--x:${i * 37 % 100}%;--delay:${i % 19 * 37}ms;--drift:${(i % 2 ? 1 : -1) * (20 + i % 5 * 13)}px"></span>`).join('')}
  </div>
  <div class="science-victory-card">
    <div class="science-victory-pip" aria-hidden="true"></div>
    <p class="science-victory-message">Earth received your report!</p>
    <h2 id="science-victory-title">Congratulations,<br> Martianaut!</h2>
    <p class="science-victory-badge">Junior Mars Scientist</p>
    <div class="science-victory-stars" role="img" aria-label="Six Science Stars">
      ${Array.from({ length: 6 }, (_, i) => `<span style="--star-index:${i}">&#9733;</span>`).join('')}
    </div>
    <p>All six Mars missions complete.</p>
    <div class="science-victory-actions">
      <button type="button" data-victory-journal>View Discovery Journal</button>
      <button type="button" data-victory-restart>Start over</button>
    </div>
  </div>
`;
document.body.append(victory);

function showVictory() {
  map.pause(true);
  pauseClock?.(true);
  if (!victory.open) victory.showModal();
}

victory.addEventListener('cancel', event => event.preventDefault());
victory.querySelector('[data-victory-journal]').addEventListener('click', () => {
  const journalButton = frame.contentDocument?.getElementById('science-collection');
  const journal = frame.contentDocument?.getElementById('keepsakes');
  if (!journalButton || !journal) return;
  victory.close();
  frame.hidden = false;
  journal.addEventListener('close', () => {
    frame.hidden = true;
    showVictory();
  }, { once: true });
  frame.focus();
  journalButton.click();
});
victory.querySelector('[data-victory-restart]').addEventListener('click', () => {
  try {
    for (const key of ['mars-keepsakes', 'mars-rock-collection', 'mars-skinner-ridge']) {
      localStorage.removeItem(key);
    }
  } finally {
    location.reload();
  }
});

map.on('enter', place => {
  if (place !== 'lab' || !frame.hidden) return;
  map.releaseKeys();
  map.pause(true);
  pauseClock?.(true);
  if (!frame.hasAttribute('src')) {
    const url = new URL('src/places/science-lab/index.html', document.baseURI);
    url.searchParams.set('embedded', '1');
    frame.src = url.href;
  }
  frame.hidden = false;
  frame.contentWindow?.dispatchEvent(new Event('mars-science:refresh'));
  frame.focus();
});

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow
    || event.data !== 'mars-science:leave' || frame.hidden) return;
  frame.hidden = true;
  map.leave('down');
  map.releaseKeys();
  if (getGame().over && getGame().chapter > 6) {
    showVictory();
  } else {
    map.pause(false);
    pauseClock?.(false);
    window.focus();
  }
});


