// COMMAND CENTER LAYOUT (Member 1): where the paths, props and interaction spots are.
// All numbers are on the 1512 x 1032 room stage (same layout as the Command Center design).
// The tan paths are drawn from ROOM_PATHS, and the player can only walk on ROOM_PATHS
// plus SHELTER_PATHS (inside the storm shelter, not drawn).

export const ROOM_STAGE = { width: 1512, height: 1032 };

export const ROOM_PATH_WIDTH = 45;

// each path is a straight line [x1, y1, x2, y2]
export const ROOM_PATHS = [
  [492, 282, 492, 484],    // up to the switchboard
  [138, 484, 690, 484],    // the main corridor, from the battery bank to the shelter door
  [286, 484, 286, 606],    // down to mission control
  [567, 484, 567, 862],    // down to the exit door
  [440, 362, 492, 362],    // short step left to the wardrobe
];

// walkable but invisible: inside the storm shelter, from the door to the bunks
export const SHELTER_PATHS = [
  [690, 484, 905, 484],
];

export const SHELTER_DOOR_X = 700;   // further right than this = inside the shelter

// where the player starts (just inside the exit door)
export const ROOM_SPAWN = { x: 567, y: 815 };

// walking down onto the orange door at the bottom (further down than this) leaves the room
export const EXIT_DOOR_Y = 852;

// spots the player can walk up to (x, y = the place on the path in front of it)
export const ROOM_SPOTS = {
  switchboard: { x: 492, y: 290, range: 45 },
  battery: { x: 150, y: 484, range: 45 },
  bunks: { x: 895, y: 484, range: 45 },
  wardrobe: { x: 440, y: 362, range: 24 },
};

// how to walk to each spot from the corridor (used by the tests)
export const SPOT_ROUTES = {
  wardrobe: [[492, 484], [492, 362], [440, 362]],
};