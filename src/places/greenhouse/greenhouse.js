// greenhouse.js — Greenhouse place (Member 4).
// Walk to the greenhouse door on the shared map -> the greenhouse screen opens on top of the map.
// The game itself lives in src/features/greenhouse/ (panel, controller, art, CSS).
// This file only connects it to the shared map (MarsMap), so nobody else's code changes.
import '../../features/greenhouse/greenhouse.css';
import '../../features/greenhouse/stations.css';
import '../../features/greenhouse/crops.css';
import { createGreenhouseDemoController } from '../../features/greenhouse/greenhouseDemoController.js';
import { mountGreenhousePanel } from '../../features/greenhouse/GreenhousePanel.js';

const controller = createGreenhouseDemoController(); // created once, so crops/progress are kept between visits
let overlay = null;
let unmount = null;

function leaveGreenhouse() {
  if (unmount) { unmount(); unmount = null; }
  if (overlay) { overlay.remove(); overlay = null; }
  if (typeof MarsMap.leave === 'function') MarsMap.leave('greenhouse');
}

function openGreenhouse() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'gh-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;background:#c65a30;';
  document.body.appendChild(overlay);
  unmount = mountGreenhousePanel(overlay, controller, { onExit: leaveGreenhouse });
}

MarsMap.on('enter', (place) => {
  if (place === 'greenhouse') openGreenhouse();
});