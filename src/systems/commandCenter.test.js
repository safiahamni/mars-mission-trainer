// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CC_CONFIG, WATER_CONFIG, createGame, tick, todaysMissions, pullLever, fillTanks, placeTank,
  enterShelter, leaveShelter, sleep, spentToday, setOutfit, setShirt, setWhere, currentHazardRate,
} from './commandCenter.js';
import { COSTS, POWER_CONFIG } from './power.js';
import { RAD_CONFIG } from './radiation.js';

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

test('solar storm: in the shelter core when it hits = mission done', () => {
  let g = enterShelter(run(createGame(), CC_CONFIG.solarStorms[1]).game);
  const r = run(g, CC_CONFIG.warningLength);
  assert.ok(r.events.includes('storm-safe'));
  assert.equal(r.game.done.shelter, true);
});

test('solar storm: caught in the room = storm-hit and a faster hazard meter', () => {
  const r = run(createGame(), CC_CONFIG.solarStorms[1] + CC_CONFIG.warningLength);
  assert.ok(r.events.includes('storm-hit'));
  assert.notEqual(r.game.done.shelter, true);
  assert.equal(currentHazardRate(r.game), RAD_CONFIG.roomStorm);
});

test('shield the shelter: pay 25 to fill the tanks, then place 3', () => {
  let g = run(createGame(), CC_CONFIG.solarStorms[1]).game;   // warning
  assert.equal(placeTank(g).ok, false);                         // not filled yet
  const f = fillTanks(g);
  assert.equal(f.ok, true);
  assert.equal(f.game.power.battery, g.power.battery - COSTS.shielding);
  g = f.game;
  for (let i = 0; i < RAD_CONFIG.tanks; i++) g = placeTank(g).game;
  assert.equal(g.tanks, RAD_CONFIG.tanks);
  assert.equal(placeTank(g).ok, false);                         // max 3
  assert.equal(g.done.tanks, true);
});

test('shield the shelter: not without enough power, and not on a calm day', () => {
  assert.equal(fillTanks(createGame()).ok, false);
  const g = run({ ...createGame(), power: { ...createGame().power, battery: 10 } }, CC_CONFIG.solarStorms[1]).game;
  const r = fillTanks(g);
  assert.equal(r.ok, false);
  assert.match(r.message, /Need 15 more/);
});

test('hazard: tanks in the core make the storm much safer', () => {
  const stormNow = (tanks) => {
    let g = enterShelter(run(createGame(), CC_CONFIG.solarStorms[1]).game);
    g = { ...fillTanks(g).game };
    for (let i = 0; i < tanks; i++) g = placeTank(g).game;
    return run(g, CC_CONFIG.warningLength + CC_CONFIG.stormLength).game.hazard;
  };
  assert.ok(stormNow(3) < stormNow(0));
  assert.ok(stormNow(0) > 0);
});

test('hazard: outside on the map rises even on a calm day (Member 3 sets where)', () => {
  const g = run(setWhere(createGame(), 'outside'), 10).game;
  assert.equal(g.hazard, 10);
  assert.equal(run(createGame(), 10).game.hazard, 0);
});

test('a new sol resets the hazard meter and the tanks', () => {
  let g = enterShelter(run(createGame(), CC_CONFIG.solarStorms[1]).game);
  g = placeTank(fillTanks(g).game).game;
  g = run(g, CC_CONFIG.dayLength).game;
  const r = sleep(g);
  assert.ok(r.report.hazard > 0);
  assert.equal(r.game.hazard, 0);
  assert.equal(r.game.tanks, 0);
  assert.equal(r.game.tanksFilled, false);
});

test('you cannot leave the shelter during the storm', () => {
  const g = run(enterShelter(createGame()), CC_CONFIG.solarStorms[1] + CC_CONFIG.warningLength).game;
  assert.equal(leaveShelter(g).ok, false);
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

test('sols without a solar storm do not show the storm mission', () => {
  assert.equal(todaysMissions({ ...createGame(), sol: 2 }).some((m) => m.id === 'shelter'), false);
});