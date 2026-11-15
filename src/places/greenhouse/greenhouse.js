// greenhouse.js — Greenhouse place (Member 4).
// Walk to the greenhouse door on the shared map -> the greenhouse screen opens on top of the map.
// The game itself lives in src/features/greenhouse/ (panel, controller, art, CSS).
// This file only connects it to the shared map (MarsMap), so nobody else's code changes.
import '../../features/greenhouse/greenhouse.css';
import '../../features/greenhouse/stations.css';
import '../../features/greenhouse/crops.css';
import { createGreenhouseDemoController } from '../../features/greenhouse/greenhouseDemoController.js';
import { mountGreenhousePanel } from '../../features/greenhouse/GreenhousePanel.js';

import { getGame, setGame } from '../../state/gameStore.js';

import { spend } from '../../systems/commandCenter.js';
import { dressAvatar } from '../../ui/outfit.js';

// Same numbers as the base map's side panel (MarsHUD): the hazard meter and the radiation warning.
// 0 = calm · 1 = CAUTION (yellow, hazard 50+) · 2 = NO GO (red: hazard 80+ or a solar storm)
const radiationLevel = () => {
  if (window.RadiationShelter?.isStorm?.() || window.MarsHUD?.isStorm?.()) return 2;
  const st = window.MarsHUD?.status?.();
  return st === 'nogo' ? 2 : st === 'caution' ? 1 : 0;
};

const controller = createGreenhouseDemoController({
  readSol: () => getGame().sol,
  readRadiation: radiationLevel,
  onEvent: (msg) => window.MarsMap?.toast?.(msg),
  readResources() {
    const game = getGame();
    return { water: game.water, power: game.power.battery, food: game.food };
  },
  chargeSupplies({ water, power }) {
    const game = getGame();
    if (game.water < water) return false;
    const result = spend(game, power, 'Greenhouse');
    if (!result.ok) return false;
    setGame({ ...result.game, water: game.water - water });
    return true;
  }
}); // created once, so crops/progress are kept between visits
controller.subscribe(({ resources }) => {
  const game = getGame();
  if (resources.food !== game.food) setGame({ ...game, food: resources.food });
});
let overlay = null;
let unmount = null;

// keep the greenhouse in step with the outside (a storm starting or a new sol), even while it is open
setInterval(() => controller.refresh(), 1000);

function closeOverlay() {
  if (unmount) { unmount(); unmount = null; }
  if (overlay) { overlay.remove(); overlay = null; }
}

function leaveGreenhouse() {
  closeOverlay();
  if (typeof MarsMap.leave === 'function') MarsMap.leave('greenhouse');
}

// While the greenhouse is open the arrow keys / WASD belong to the greenhouse, not to the base map
// (otherwise the map walks the crew out to the Command Center behind the greenhouse screen).
MarsMap.on('key', () => !!overlay);
// If the map ever takes the crew out of the greenhouse by itself, the screen closes too.
MarsMap.on('leave', (place) => { if (place === 'greenhouse') closeOverlay(); });

// The greenhouse sits next to the left column (not on top of it), like the Command Center,
// so the clock, hazard, power / oxygen / water / food cards stay visible and up to date inside.
function placeGreenhouse() {
  if (!overlay) return;
  const col = document.getElementById('mm-topbar').getBoundingClientRect();
  const stacked = col.width > window.innerWidth / 2;   // narrow screens: the cards are a row on top
  overlay.style.left = stacked ? '0px' : `${Math.round(col.right + 16)}px`;
  overlay.style.top = stacked ? `${Math.round(col.bottom + 12)}px` : '0px';
}
window.addEventListener('resize', placeGreenhouse);

function openGreenhouse() {
  if (overlay) return;
  MarsMap.releaseKeys();
  controller.syncFood(getGame().food);
  overlay = document.createElement('div');
  overlay.id = 'gh-overlay';
  overlay.style.cssText = 'position:fixed;right:0;bottom:0;z-index:50;overflow:hidden;background-color:#c65a2e;background-image:radial-gradient(#ad4b24 1.4px,transparent 1.6px);background-size:22px 22px;';
  document.body.appendChild(overlay);
  placeGreenhouse();
  unmount = mountGreenhousePanel(overlay, controller, {
    onExit: leaveGreenhouse,
    dressAvatar: (avatar) => dressAvatar(avatar, getGame()),   // the outfit picked in the Command Center wardrobe
  });
}

MarsMap.on('enter', (place) => {
  if (place === 'greenhouse') openGreenhouse();
});