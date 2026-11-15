import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeWalker, isNear } from './roomWalk.js';
import { ROOM_PATHS, SHELTER_PATHS, ROOM_PATH_WIDTH, ROOM_SPAWN, ROOM_SPOTS, SPOT_ROUTES, CORRIDOR_X, CORRIDOR_Y, EXITS } from '../config/commandCenterLayout.js';

const walk = makeWalker([...ROOM_PATHS, ...SHELTER_PATHS], ROOM_PATH_WIDTH);

const goTo = (pos, x, y) => {
  for (let i = 0; i < 400 && (pos.x !== x || pos.y !== y); i++) {
    const dx = Math.sign(x - pos.x) * Math.min(4, Math.abs(x - pos.x));
    const dy = Math.sign(y - pos.y) * Math.min(4, Math.abs(y - pos.y));
    pos = dy ? walk.move(pos, 0, dy) : walk.move(pos, dx, 0);
  }
  return pos;
};

test('the player starts on the path in the middle of the room', () => {
  assert.equal(walk.onPath(ROOM_SPAWN.x, ROOM_SPAWN.y), true);
});

test('the player cannot walk off the path', () => {
  const onUpDown = { x: CORRIDOR_X, y: 250 };   // on the up-down corridor, away from side paths
  assert.equal(walk.move(onUpDown, 200, 0).x, onUpDown.x);
});

test('the player can reach every spot from the door', () => {
  for (const [name, spot] of Object.entries(ROOM_SPOTS)) {
    let pos = { ...ROOM_SPAWN };
    const route = SPOT_ROUTES[name] || [[spot.x, CORRIDOR_Y], [spot.x, spot.y]];
    for (const [x, y] of route) pos = goTo(pos, x, y);
    assert.equal(isNear(pos, spot), true, `could not reach ${name}`);
  }
});

test('no spot is "near" from the door', () => {
  for (const spot of Object.values(ROOM_SPOTS)) assert.equal(isNear(ROOM_SPAWN, spot), false);
});

test('walking up to the switchboard does not open the wardrobe', () => {
  let pos = goTo({ ...ROOM_SPAWN }, ROOM_SPOTS.switchboard.x, CORRIDOR_Y);
  for (let y = CORRIDOR_Y; y > ROOM_SPOTS.switchboard.y; y -= 4) {
    pos = goTo(pos, ROOM_SPOTS.switchboard.x, y);
    assert.equal(isNear(pos, ROOM_SPOTS.wardrobe), false);
  }
});

test('each of the four doors can be reached from the middle', () => {
  const ends = { left: [EXITS.left.x, CORRIDOR_Y], right: [EXITS.right.x, CORRIDOR_Y], up: [CORRIDOR_X, EXITS.up.y], down: [CORRIDOR_X, EXITS.down.y] };
  for (const [dir, [x, y]] of Object.entries(ends)) {
    const pos = goTo({ ...ROOM_SPAWN }, x, y);
    assert.deepEqual([pos.x, pos.y], [x, y], `could not reach the ${dir} door`);
  }
});