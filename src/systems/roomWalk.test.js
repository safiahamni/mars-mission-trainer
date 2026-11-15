import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeWalker, isNear } from './roomWalk.js';
import { ROOM_PATHS, SHELTER_PATHS, ROOM_PATH_WIDTH, ROOM_SPAWN, ROOM_SPOTS, SPOT_ROUTES } from '../config/commandCenterLayout.js';

const walk = makeWalker([...ROOM_PATHS, ...SHELTER_PATHS], ROOM_PATH_WIDTH);

const goTo = (pos, x, y) => {
  for (let i = 0; i < 400 && (pos.x !== x || pos.y !== y); i++) {
    const dx = Math.sign(x - pos.x) * Math.min(4, Math.abs(x - pos.x));
    const dy = Math.sign(y - pos.y) * Math.min(4, Math.abs(y - pos.y));
    pos = dy ? walk.move(pos, 0, dy) : walk.move(pos, dx, 0);
  }
  return pos;
};

test('the player starts on the path at the exit door', () => {
  assert.equal(walk.onPath(ROOM_SPAWN.x, ROOM_SPAWN.y), true);
});

test('the player cannot walk off the path', () => {
  assert.equal(walk.move(ROOM_SPAWN, 200, 0).x, ROOM_SPAWN.x);
});

test('the player can reach every spot from the door', () => {
  for (const [name, spot] of Object.entries(ROOM_SPOTS)) {
    let pos = goTo({ ...ROOM_SPAWN }, ROOM_SPAWN.x, 484);   // up to the corridor
    const route = SPOT_ROUTES[name] || [[spot.x, 484], [spot.x, spot.y]];
    for (const [x, y] of route) pos = goTo(pos, x, y);
    assert.equal(isNear(pos, spot), true, `could not reach ${name}`);
  }
});

test('no spot is "near" from the door', () => {
  for (const spot of Object.values(ROOM_SPOTS)) assert.equal(isNear(ROOM_SPAWN, spot), false);
});

test('walking up to the switchboard does not open the wardrobe', () => {
  let pos = goTo({ ...ROOM_SPAWN }, ROOM_SPAWN.x, 484);
  pos = goTo(pos, 492, 484);
  for (let y = 484; y > 290; y -= 4) {
    pos = goTo(pos, 492, y);
    assert.equal(isNear(pos, ROOM_SPOTS.wardrobe), false);
  }
});