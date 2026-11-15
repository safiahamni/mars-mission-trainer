// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CC_CONFIG, WATER_CONFIG, CHAPTERS, createGame, tick, solStars, pullLever,
  enterShelter, leaveShelter, sleep, spentToday, setOutfit, setShirt,
  todaysChapter, chapterCheck, startChapter, finishChapter, endDayEarly, unlockMoxieSystem, runSystem,
} from './commandCenter.js';
import { COSTS, POWER_CONFIG } from './power.js';

const night = (g) => ({ ...g, phase: 'night', done: { chapter: true }, greenhouseProgress: { ...g.greenhouseProgress, greensPlantedSol: g.sol } });
const playChapter = (g) => finishChapter(startChapter(g).game);

test('running MOXIE and the recycler costs power; the recycler adds water', () => {
  let g = pullLever(unlockMoxieSystem(createGame()).game, 'moxie', true).game;
  g = pullLever(g, 'recycler', true).game;
  assert.equal(g.water, WATER_CONFIG.start + WATER_CONFIG.recycler);
  assert.equal(spentToday(g), COSTS.moxieUnlock + COSTS.moxie + COSTS.recycler);
});

test('time alone never ends the day', () => {
  let g = createGame();
  for (let i = 0; i < 1000; i++) g = tick(g, 1).game;
  assert.equal(g.phase, 'day');
});

test('finishing the chapter = sunset with 20+ power = safe night', () => {
  const r = playChapter(createGame());
  assert.equal(r.game.phase, 'night');
  assert.ok(r.events.includes('sunset-safe'));
});

test('sunset below the night line = warning', () => {
  const g = { ...createGame(), power: { ...createGame().power, battery: 15 } };
  const r = playChapter(g);
  assert.ok(r.events.includes('sunset-low'));
});

test('you can only sleep at night, inside the shelter', () => {
  assert.equal(sleep(enterShelter(createGame())).ok, false);
  assert.equal(sleep(night(createGame())).ok, false);
  assert.equal(sleep(enterShelter(night(createGame()))).ok, true);
});

test('sleeping uses the night reserve, recharges and resets panels for the next Sol', () => {
  const g = enterShelter(night(createGame()));
  const r = sleep(g);
  assert.equal(r.report.afterNight, g.power.battery - POWER_CONFIG.nightReserve);
  assert.equal(r.game.power.battery, Math.min(100, r.report.afterNight + POWER_CONFIG.solar.clean));
  assert.equal(r.game.water, g.water - WATER_CONFIG.crewPerNight);
  assert.equal(r.game.sol, 2);
  assert.equal(r.game.power.panels, 'dusty');
  assert.equal(r.game.stars, g.stars);
});

test('a dust storm sol gives only +5 in the morning', () => {
  const g = enterShelter(night({ ...createGame(), sol: CC_CONFIG.dustStorms[0] - 1, food: 50 }));
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

test('the final chapter ends the mission on Sol 6', () => {
  const g = { ...createGame(), sol: CC_CONFIG.maxSols, chapter: 6, food: 60,
    greenhouseProgress: { advancedCropHarvested: true } };
  const result = playChapter(g);
  assert.equal(result.ok, true);
  assert.equal(result.game.over, true);
  assert.equal(result.game.sol, 6);
});

test('sleep needs clean panels unless EVA is unsafe', () => {
  const g = enterShelter(night(createGame()));
  const dusty = { ...g, power: { ...g.power, panels: 'dusty' } };
  assert.equal(sleep(dusty).ok, false);
  assert.equal(sleep(dusty, { evaUnsafe: true }).ok, true);
});

test('wardrobe: change outfit and shirt colour', () => {
  assert.equal(setOutfit(createGame(), 'suit').outfit, 'suit');
  assert.equal(setShirt(createGame(), 'teal').shirt, 'teal');
  assert.equal(setShirt(createGame(), 'gold').shirt, 'blue');
});

test('stars: one per chapter, awarded before sleep', () => {
  const played = playChapter(createGame()).game;
  assert.deepEqual(solStars(played).map((x) => x.earned), [true]);
  const cold = { ...createGame(), power: { ...createGame().power, battery: 10 } };
  assert.deepEqual(solStars(cold).map((x) => x.earned), [false]);
  const r = sleep(enterShelter({ ...played, greenhouseProgress: { greensPlantedSol: 1 } }));
  assert.equal(r.report.earned, 1);
  assert.equal(played.stars, 1);
  assert.equal(r.game.stars, 1);
});

test('stars: the storm does not award a chapter star', () => {
  const g = { ...createGame(), sol: CC_CONFIG.dustStorms[0] };
  assert.equal(solStars(g)[0].earned, false);
});

test('you can always walk out of the shelter core', () => {
  assert.equal(leaveShelter(enterShelter(createGame())).ok, true);
});
test('chapter: finishing uses its power, oxygen, water and food, then the sun sets', () => {
  const g0 = createGame();
  const s = startChapter(g0);
  assert.equal(s.ok, true);
  assert.equal(s.game.power.battery, g0.power.battery);   // nothing is paid when it starts
  const f = finishChapter(s.game);
  const u = CHAPTERS[0].uses;
  assert.equal(f.game.power.battery, g0.power.battery - u.power);
  assert.equal(f.game.oxygen, g0.oxygen - u.oxygen);
  assert.equal(f.game.water, g0.water - u.water);
  assert.equal(f.game.food, g0.food - u.food);
  assert.equal(finishChapter(startChapter(g0).game, { power: 8 }).game.power.battery, g0.power.battery - 8);
  assert.equal(f.game.phase, 'night');
  assert.equal(f.game.chapter, 2);
  assert.equal(f.game.done.chapter, true);
});

test('chapter: low power cannot skip today?s chapter', () => {
  const g = { ...createGame(), power: { ...createGame().power, battery: 10 } };
  const c = chapterCheck(g);
  assert.equal(c.ok, false);
  assert.deepEqual(c.missing, ['power 15']);
  assert.equal(startChapter(g).ok, false);
  const r = endDayEarly(g);
  assert.equal(r.ok, false);
  assert.equal(r.game, g);
});

test('chapter: available on a dust storm Sol, and only one per day', () => {
  assert.equal(todaysChapter({ ...createGame(), sol: CC_CONFIG.dustStorms[0] }).id, CHAPTERS[0].id);
  const done = playChapter(createGame()).game;
  assert.equal(startChapter(done).ok, false);
});

test('chapter: finishing without starting does nothing', () => {
  assert.equal(finishChapter(createGame()).ok, false);
});

test('MOXIE adds oxygen; the night only uses power', () => {
  const g0 = createGame();
  const g = runSystem(unlockMoxieSystem(g0).game, 'moxie').game;
  assert.equal(g.oxygen, g0.oxygen + 15);
  const r = sleep(enterShelter(night(g)));
  assert.equal(r.game.oxygen, g.oxygen);
  assert.equal(r.game.food, g.food);
});

test('chapter gates use oxygen and food too (Chapter 2 needs oxygen 60)', () => {
  const g = { ...playChapter(createGame()).game, phase: 'day', done: {}, oxygen: 50 };
  const c = chapterCheck(g);
  assert.equal(c.chapter.n, 2);
  assert.deepEqual(c.missing, ['oxygen 60']);
});

test('changeResource: add food, cannot use more water than you have', async () => {
  const { changeResource } = await import('./commandCenter.js');
  assert.equal(changeResource(createGame(), 'food', 20, 'Harvest').game.food, createGame().food + 20);
  assert.equal(changeResource({ ...createGame(), water: 3 }, 'water', -5, 'Watering').ok, false);
});
