// RADIATION (Member 3's rules, as shared pure functions): the hazard meter, solar storm
// rates, cliff shade, the two routes, and water-tank shielding in the storm shelter core.
// Used by the Command Center now, and by Member 3's map (shelter-game.js) once it is merged.
// 1 real second = 1 game minute.

export const RAD_CONFIG = {
  max: 100,          // hazard meter is full at 100
  baseRate: 1,       // hazard points per game minute on the paths outside
  stormX: 2,         // a solar storm makes outside radiation 2x faster
  cliffX: 0.9,       // cliff shade: 10% less (game value; Curiosity measured about 4% next to a butte)
  roomStorm: 1.5,    // inside the Command Center during a storm, but NOT in the storm shelter core
  // inside the storm shelter core during a storm, by water tanks on the shelves (0, 1, 2, 3)
  coreRates: [1.0, 0.6, 0.3, 0.1],
  tanks: 3,          // water tanks to carry onto the shelves
};

// The two ways to the Science Lab (Member 3's route chooser)
export const ROUTES = {
  open: { id: 'open', name: 'Normal path', minutes: 10, shade: 1 },
  cliff: { id: 'cliff', name: 'Cliff route', minutes: 11, shade: RAD_CONFIG.cliffX },
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round1 = (v) => Math.round(v * 10) / 10;

// Hazard points per game minute right now.
// where: 'outside' | 'room' (in a building) | 'core' (storm shelter core) | 'lab'
export function hazardRate({ where = 'room', storm = false, tanks = 0, shaded = false } = {}) {
  if (where === 'outside') {
    return round1(RAD_CONFIG.baseRate * (storm ? RAD_CONFIG.stormX : 1) * (shaded ? RAD_CONFIG.cliffX : 1));
  }
  if (!storm) return 0;                       // buildings keep you safe on a calm day
  if (where === 'core') return RAD_CONFIG.coreRates[clamp(tanks, 0, RAD_CONFIG.tanks)];
  if (where === 'room') return RAD_CONFIG.roomStorm;
  return 0;                                   // the Science Lab is shielded
}

export function addHazard(hazard, rate, minutes) {
  return round1(clamp(hazard + rate * minutes, 0, RAD_CONFIG.max));
}

// Numbers for the route chooser cards (so the cards and the game always match)
export function routeRate(route, storm) {
  return round1(RAD_CONFIG.baseRate * (storm ? RAD_CONFIG.stormX : 1) * route.shade);
}
export function routeTotal(route, storm) {
  return round1(route.minutes * routeRate(route, storm));
}

// Is point (px, py) inside the canyon? canyon = [[ax, ay], [bx, by]] along the cliff route
export function inCanyon(px, py, canyon, width = 26) {
  const [[ax, ay], [bx, by]] = canyon;
  const vx = bx - ax;
  const vy = by - ay;
  const t = clamp(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy), 0, 1);
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy)) < width;
}

// 'safe' | 'careful' | 'danger': colours for the hazard meter (green / yellow / red)
export function hazardLevel(hazard) {
  if (hazard >= 80) return 'danger';
  if (hazard >= 50) return 'careful';
  return 'safe';
}