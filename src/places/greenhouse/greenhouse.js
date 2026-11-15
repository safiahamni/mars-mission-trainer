import { CROP_CATALOG } from '../../features/greenhouse/food.js';
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

import { CC_CONFIG, spend } from '../../systems/commandCenter.js';

// The radiation warning outside (solar storm, or radiation too high = the red alarm) is the same warning inside.
const radiationWarning = () => {
  const hud = window.RadiationShelter || window.MarsHUD;
  return !!(hud?.isStorm?.() || window.MarsHUD?.isStorm?.() || window.MarsHUD?.status?.() === 'nogo');
};

const controller = createGreenhouseDemoController({
  readChapterStars: () => getGame().chapter - 1,
  maxSols: CC_CONFIG.maxSols,
  readSol: () => getGame().sol,
  readRadiation: radiationWarning,
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
controller.subscribe(({ resources, soilPerchlorate, advancedCropHarvested, greenhouse, sol }) => {
  const game = getGame();
  const previous = game.greenhouseProgress ?? {};
  const bedsUnlocked = Boolean(previous.bedsUnlocked || soilPerchlorate < 30);
  let greensPlantedSol = previous.greensPlantedSol;
  let foodReadyBySol4 = 0;
  let advancedCropReadyBySol6 = false;
  for (const plot of Object.values(greenhouse.plots)) {
    const crop = CROP_CATALOG[plot.cropId];
    if (!crop) continue;
    if (crop.id === 'greens' && plot.plantedSol === sol) greensPlantedSol = sol;
    const readySol = sol + Math.max(0, crop.growthSols - plot.growthSols);
    if (readySol <= 4) foodReadyBySol4 += crop.foodReward;
    if (readySol <= 6 && crop.id !== 'greens') advancedCropReadyBySol6 = true;
  }
  const progress = { greensPlantedSol, bedsUnlocked, advancedCropHarvested, foodReadyBySol4, advancedCropReadyBySol6 };
  if (resources.food !== game.food || Object.keys(progress).some(key => progress[key] !== previous[key])) {
    setGame({ ...game, food: resources.food, greenhouseProgress: progress });
  }
});
let overlay = null;
let unmount = null;

// keep the greenhouse in step with the outside (a storm starting or a new sol), even while it is open
setInterval(() => controller.refresh(), 1000);

function leaveGreenhouse() {
  if (unmount) { unmount(); unmount = null; }
  if (overlay) { overlay.remove(); overlay = null; }
  if (typeof MarsMap.leave === 'function') MarsMap.leave('greenhouse');
}

function openGreenhouse() {
  if (overlay) return;
  controller.syncFood(getGame().food);
  overlay = document.createElement('div');
  overlay.id = 'gh-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;background:#c65a30;';
  document.body.appendChild(overlay);
  unmount = mountGreenhousePanel(overlay, controller, { onExit: leaveGreenhouse });
}

MarsMap.on('enter', (place) => {
  if (place === 'greenhouse') openGreenhouse();
});