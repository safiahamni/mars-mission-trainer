// COMMAND CENTER LAYOUT (Member 1): where the paths, props and interaction spots are.
// All numbers are on the 1512 x 1032 room stage. The floor is x 66-1058, y 132-872.
// A cross-shaped corridor with a door on each side, matching the roads on the base map:
//   left = Greenhouse, up = Science Lab, right = Life Support, down = Airlock / solar panels.
// The tan paths are drawn from ROOM_PATHS, and the player can only walk on ROOM_PATHS
// plus SHELTER_PATHS (inside the radiation shelter, not drawn).

export const ROOM_STAGE = { width: 1512, height: 1032 };

export const ROOM_PATH_WIDTH = 45;

export const CORRIDOR_Y = 503;   // the left-right corridor
export const CORRIDOR_X = 562;   // the up-down corridor

// each path is a straight line [x1, y1, x2, y2]
export const ROOM_PATHS = [
  [70, CORRIDOR_Y, 1054, CORRIDOR_Y],      // left door <-> right door
  [CORRIDOR_X, 140, CORRIDOR_X, 864],      // top door <-> bottom door
  [422, 296, 422, CORRIDOR_Y],             // up to the switchboard
  [246, 365, 246, CORRIDOR_Y],             // up to the wardrobe
  [786, 380, 786, CORRIDOR_Y],             // up to mission control
  [321, CORRIDOR_Y, 321, 580],             // down to the battery bank
  [830, CORRIDOR_Y, 830, 572],             // down to the radiation shelter door
];

// walkable but invisible: inside the radiation shelter, from its door down to the bunks
export const SHELTER_PATHS = [
  [830, 572, 830, 690],
];

export const SHELTER_DOOR_Y = 572;   // further down than this (on the shelter path) = inside the shelter

// where the player starts: the middle of the room
export const ROOM_SPAWN = { x: CORRIDOR_X, y: CORRIDOR_Y };

// walking past these lines through a door leaves the room that way
export const EXITS = {
  left: { x: 78 },
  right: { x: 1046 },
  up: { y: 148 },
  down: { y: 856 },
};

// spots the player can walk up to (x, y = the place on the path in front of it)
export const ROOM_SPOTS = {
  switchboard: { x: 422, y: 300, range: 45 },
  battery: { x: 321, y: 576, range: 45 },
  bunks: { x: 830, y: 665, range: 45 },
  wardrobe: { x: 246, y: 369, range: 24 },
};

// how to walk to each spot from the corridor (used by the tests); default = along the corridor, then straight to it
export const SPOT_ROUTES = {};