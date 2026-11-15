import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoController} from '../src/science.js';
import {directions, drive, newRoute} from '../src/rover.js';
import {totalPoints} from '../src/missions.js';

test('a complete route exists and grants the first reward exactly once', () => {
  const queue = [newRoute()];
  const seen = new Set();
  let finish;
  for (const route of queue) {
    if (route.finished) { finish = route; break; }
    for (const direction of Object.keys(directions)) {
      const next = drive(route, direction);
      const key = JSON.stringify(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  assert.ok(finish);
  assert.equal(finish.beacons.length, 3);
  assert.equal(finish.battery, true);
  const controller = createDemoController();
  assert.equal(controller.complete('rover-rescue', newRoute()), false);
  assert.equal(controller.complete('rover-rescue', finish), true);
  assert.equal(controller.complete('rover-rescue', finish), false);
  assert.deepEqual(controller.snapshot(), {power:70, oxygen:50, science:15, stars:1, moxieUnlocked:true, lostLakeClue:false});
  assert.equal(createDemoController(9).complete('rover-rescue', finish), false);
  assert.equal(totalPoints, 75);
});

test('Mystery Rocks requires MOXIE and awards its reward once', () => {
  const controller = createDemoController();
  const finds = new Set(['layers', 'crystals', 'spots']);
  assert.equal(controller.runMoxie(), false);
  assert.equal(controller.completeMysteryRocks(finds), false);
  controller.complete('rover-rescue', {finished:true});
  assert.equal(controller.availability('mystery-rocks'), 'Refill Oxygen with MOXIE');
  assert.equal(controller.runMoxie(), true);
  assert.equal(controller.completeMysteryRocks(new Set()), false);
  assert.equal(controller.completeMysteryRocks(finds), true);
  assert.equal(controller.completeMysteryRocks(finds), false);
  assert.equal(controller.snapshot().science, 25);
  assert.equal(controller.snapshot().power, 50);
  assert.equal(controller.snapshot().lostLakeClue, true);
});

test('Cosmic Claw and Safari spend equipment power once', () => {
  const game = createDemoController(80, {testCosmicClaw:true});
  const sample = {target:'rockytop', cored:true, sealed:true};
  assert.equal(game.completeCosmicClaw(sample), true);
  assert.equal(game.completeCosmicClaw(sample), false);
  assert.equal(game.snapshot().power, 60);
  game.harvestFood();
  const photos = new Set(['delta', 'layers', 'ripples']);
  assert.equal(game.completeSnapshotSafari(photos), true);
  assert.equal(game.completeSnapshotSafari(photos), false);
  assert.equal(game.snapshot().power, 45);
});
