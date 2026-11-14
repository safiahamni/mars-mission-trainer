// STATIONS: one shared list every teammate imports.
// Positions match Member 4's base map design (1408 x 840).
// x, y = top-left corner of the building; w, h = size.

export const MAP = { width: 1408, height: 840 };

export const STATION_IDS = {
  POWER: 'power',
  MED: 'med-fitness',
  SHELTER: 'radiation-shelter',
  HABITAT: 'central-habitat',
  HUB: 'start-hub',
  SCIENCE_LAB: 'science-lab',
  GREENHOUSE: 'greenhouse',
  EVA: 'eva-airlock',
  LIFE_SUPPORT: 'life-support',
};

export const STATIONS = [
  { id: STATION_IDS.POWER,        name: 'Power',             owner: 'Member 1', x: 237, y: 78,  w: 241, h: 142, color: 0xf2c94c },
  { id: STATION_IDS.MED,          name: 'Med / Fitness',     owner: 'TBD',      x: 584, y: 78,  w: 241, h: 142, color: 0x9fd8c8 },
  { id: STATION_IDS.SHELTER,      name: 'Radiation Shelter', owner: 'Member 3', x: 931, y: 78,  w: 241, h: 142, color: 0xe0605a },
  { id: STATION_IDS.HABITAT,      name: 'Central Habitat',   owner: 'Member 2', x: 237, y: 332, w: 241, h: 142, color: 0x5b8ad6 },
  { id: STATION_IDS.HUB,          name: 'Start Hub',         owner: 'Member 1', x: 623, y: 322, w: 160, h: 160, color: 0x2a8a9a, round: true },
  { id: STATION_IDS.SCIENCE_LAB,  name: 'Science Lab',       owner: 'Member 5', x: 931, y: 332, w: 241, h: 142, color: 0xa47be0 },
  { id: STATION_IDS.GREENHOUSE,   name: 'Greenhouse',        owner: 'Member 4', x: 237, y: 586, w: 241, h: 142, color: 0x7cc35c },
  { id: STATION_IDS.EVA,          name: 'EVA / Airlock',     owner: 'Member 3', x: 584, y: 586, w: 241, h: 142, color: 0xd9b47e },
  { id: STATION_IDS.LIFE_SUPPORT, name: 'Life Support',      owner: 'Member 2', x: 931, y: 586, w: 241, h: 142, color: 0x6ec3e8 },
];

// Walkable paths (sandy strips). Numbers are the centre line.
export const PATHS = [
  { x1: 255, y1: 253, x2: 1152, y2: 253 },
  { x1: 255, y1: 507, x2: 1300, y2: 507 },
  { x1: 255, y1: 760, x2: 1152, y2: 760 },
  { x1: 530, y1: 238, x2: 530, y2: 775 },
  { x1: 877, y1: 238, x2: 877, y2: 775 },
];
export const PATH_WIDTH = 34;

// Where the player starts: on the path in front of the Start Hub
export const SPAWN = { x: 703, y: 507 };

// The door is the middle of each building's bottom edge
export function doorOf(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h + 14 };
}