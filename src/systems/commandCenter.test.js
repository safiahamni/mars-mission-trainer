// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CC_CONFIG, WATER_CONFIG, createGame, tick, todaysMissions, pullLever,
  enterShelter, leaveShelter, sleep, spentToday, setOutfit, setShirt,
} from './commandCenter.js';
import { COSTS, POWER_CONFIG } from './power.js';

const run = (g, seconds) => {
  const events = [];
  for (let i = 0; i < seconds; i++) {
    const r = tick(g, 1);
    g = r.game;
    events.push(...r.events);
  }
  return { game: g, events };
};
const night = (g) => run(g, CC_CONFIG.dayLength).game;

test('running MOXIE and the recycler ticks off missions; the recycler adds water', () => {
  let g = pullLever(createGame(), 'moxie', true).game;
  g = pullLever(g, 'recycler', true).game;
  assert.equal(g.done.moxie, true);
  assert.equal(g.done.recycler, true);
  assert.equal(g.water, WATER_CONFIG.start + WATER_CONFIG.recycler);
  assert.equal(spentToday(g), COSTS.moxieUnlock + COSTS.moxie + COSTS.recycler);
});

test('sunset with 20+ power = night reserve mission done', () => {
  const r = run(createGame(), CC_CONFIG.dayLength);
  assert.equal(r.game.phase, 'night');
  assert.ok(r.events.includes('sunset-safe'));
  assert.equal(r.game.done.reserve, true);
});

test('sunset below the night line = warning, mission not done', () => {
  const g = { ...createGame(), power: { ...createGame().power, battery: 10 } };
  const r = run(g, CC_CONFIG.dayLength);
  assert.ok(r.events.includes('sunset-low'));
  assert.notEqual(r.game.done.reserve, true);
});

test('you can only sleep at night, inside the shelter', () => {
  assert.equal(sleep(enterShelter(createGame())).ok, false);
  assert.equal(sleep(night(createGame())).ok, false);
  assert.equal(sleep(enterShelter(night(createGame()))).ok, true);
});

test('sleeping: night uses 20, crew drinks water, +40 in the morning, next sol', () => {
  const g = enterShelter(night(createGame()));
  const r = sleep(g);
  assert.equal(r.report.afterNight, g.power.battery - POWER_CONFIG.nightReserve);
  assert.equal(r.game.power.battery, Math.min(100, r.report.afterNight + POWER_CONFIG.solar.clean));
  assert.equal(r.game.water, g.water - WATER_CONFIG.crewPerNight);
  assert.equal(r.game.sol, 2);
  assert.equal(r.game.stars, r.report.earned);
});

test('a dust storm sol gives only +5 in the morning', () => {
  const g = enterShelter(night({ ...createGame(), sol: CC_CONFIG.dustStorms[0] - 1 }));
  const r = sleep(g);
  assert.equal(r.report.gained, POWER_CONFIG.solar.storm);
  assert.equal(r.game.power.panels, 'dusty');
});

test('sleeping below the night line = a cold night', () => {
  const g = enterShelter(night({ ...createGame(), power: { ...createGame().power, battery: 10 } }));
  const r = sleep(g);
  assert.equal(r.report.cold, true);
  assert.equal(r.game.coldNights, 1);
});

test('the mission ends after the last sol', () => {
  const g = enterShelter(night({ ...createGame(), sol: CC_CONFIG.maxSols }));
  assert.equal(sleep(g).game.over, true);
});

test('wardrobe: change outfit and shirt colour', () => {
  assert.equal(setOutfit(createGame(), 'suit').outfit, 'suit');
  assert.equal(setShirt(createGame(), 'teal').shirt, 'teal');
  assert.equal(setShirt(createGame(), 'gold').shirt, 'blue');
});

test('the checklist has the 4 daily missions', () => {
  assert.deepEqual(todaysMissions(createGame()).map((m) => m.id), ['moxie', 'recycler', 'reserve', 'sleep']);
});

test('you can always walk out of the shelter core', () => {
  assert.equal(leaveShelter(enterShelter(createGame())).ok, true);
});