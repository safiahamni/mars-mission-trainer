import { spend } from '../../systems/commandCenter.js';
import { COSTS } from '../../systems/power.js';
import { getGame, setGame, pauseClock } from '../../state/gameStore.js';

const map = window.MarsMap;
const room = document.createElement('section');
room.hidden = true;
Object.assign(room.style, {
  position: 'fixed', inset: '0', zIndex: '1000', background: '#2b2a3a'
});

const back = document.createElement('button');
back.type = 'button';
back.textContent = 'Back to base map';
Object.assign(back.style, {
  position: 'absolute', right: '1rem', top: '.5rem', zIndex: '1',
  padding: '.55rem .9rem', borderRadius: '.7rem', background: '#ffd647'
});

const frame = document.createElement('iframe');
frame.title = 'Life Support';
Object.assign(frame.style, {
  position: 'absolute', inset: '3rem 0 0', width: '100%',
  height: 'calc(100% - 3rem)', border: '0'
});

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow || room.hidden) return;
  const { type, resource, value } = event.data ?? {};
  if (type !== 'mars-life:resource' || !['oxygen', 'water'].includes(resource)
    || !Number.isFinite(value) || value < 0 || value > 100) return;
  setGame({ ...getGame(), [resource]: value });
});

window.MarsLifeSupport = {
  runMoxie() {
    if (room.hidden) return null;
    const game = getGame();
    if (game.oxygen >= 100) return null;
    const result = spend(game, COSTS.moxie, 'MOXIE');
    if (!result.ok) return null;
    const oxygen = Math.min(100, game.oxygen + 20);
    setGame({ ...result.game, oxygen });
    return oxygen;
  },
  moxieCost: COSTS.moxie
};

room.append(back, frame);
document.body.append(room);

function syncResources() {
  if (room.hidden) return;
  const { oxygen, water } = getGame();
  frame.contentWindow?.postMessage({ type: 'mars-life:sync', oxygen, water }, location.origin);
}
frame.addEventListener('load', syncResources);

map.on('enter', place => {
  if (place !== 'life' || !room.hidden) return;
  map.releaseKeys();
  map.pause(true);
  pauseClock(true);
  if (!frame.hasAttribute('src')) frame.src = 'src/places/life-support/index.html';
  room.hidden = false;
  syncResources();
  frame.focus();
});

back.addEventListener('click', () => {
  room.hidden = true;
  map.leave('left');
  map.releaseKeys();
  map.pause(false);
  pauseClock(false);
  window.focus();
});
