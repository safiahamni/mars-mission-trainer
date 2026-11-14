// WALK PATH: keeps the player on the sandy paths.
// Based on Member 4's path.js (onPath / moveOnPath), but the lines come from
// PATHS in config/stations.js, so the drawn paths and the walkable area can never get out of sync.
import { STATIONS, PATHS, PATH_WIDTH, doorOf } from '../config/stations.js';

const HALF = PATH_WIDTH / 2 - 3;   // how far from the centre line the player may go

// 1. the main paths
const LINES = PATHS.map((p) => [[p.x1, p.y1], [p.x2, p.y2]]);

// 2. a short "door stub" from every station door down to the nearest path
for (const s of STATIONS) {
  const d = doorOf(s);
  const below = PATHS
    .filter((p) => p.y1 === p.y2 && p.y1 >= d.y && d.x >= p.x1 && d.x <= p.x2)
    .sort((a, b) => a.y1 - b.y1)[0];
  if (below) LINES.push([[d.x, d.y - 6], [d.x, below.y1]]);
}

// Turn every straight piece into a box the player must stay inside
const BOXES = [];
for (const line of LINES) {
  for (let i = 1; i < line.length; i++) {
    const [x1, y1] = line[i - 1];
    const [x2, y2] = line[i];
    BOXES.push({
      x1: Math.min(x1, x2) - HALF, x2: Math.max(x1, x2) + HALF,
      y1: Math.min(y1, y2) - HALF, y2: Math.max(y1, y2) + HALF,
    });
  }
}

// Is this spot on the path?
export function onPath(x, y) {
  return BOXES.some((b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
}

// Move by dx, dy but never leave the path (slides along the edge instead)
export function moveOnPath(pos, dx, dy) {
  if (onPath(pos.x + dx, pos.y)) pos.x += dx;
  if (onPath(pos.x, pos.y + dy)) pos.y += dy;
  return pos;
}

export const WALK_LINES = LINES;   // exported for tests / debugging