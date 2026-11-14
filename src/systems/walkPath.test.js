import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onPath, moveOnPath } from './walkPath.js';
import { SPAWN, STATIONS, doorOf } from '../config/stations.js';

test('the spawn point is on the path', () => {
  assert.equal(onPath(SPAWN.x, SPAWN.y), true);
});

test('the middle of a building is not on the path', () => {
  const s = STATIONS[0];
  assert.equal(onPath(s.x + s.w / 2, s.y + s.h / 2), false);
});

test('every station door can be reached', () => {
  for (const s of STATIONS) {
    const d = doorOf(s);
    assert.equal(onPath(d.x, d.y), true, `${s.name} door is not on the path`);
  }
});

test('moving off the path is blocked, sliding along it is allowed', () => {
  const pos = { x: SPAWN.x, y: SPAWN.y };
  moveOnPath(pos, 0, 200);
  assert.equal(pos.y, SPAWN.y);
  moveOnPath(pos, 50, 200);
  assert.equal(pos.x, SPAWN.x + 50);
  assert.equal(pos.y, SPAWN.y);
});