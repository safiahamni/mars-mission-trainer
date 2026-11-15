// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CC_CONFIG, WATER_CONFIG, CHAPTERS, createGame, tick, solStars, pullLever,
  enterShelter, leaveShelter, sleep, spentToday, setOutfit, setShirt,
  todaysChapter, chapterCheck, startChapter, finishChapter, endDayEarly, unlockMoxieSystem, runSystem,
} from './commandCenter.js';
import { COSTS, POWER_CONFIG } from './power.js';

const night = (g) => endDayEarly(g).game;
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
  const g = { ...createGame(), power: { ...createGame().power, battery: 10 } };
  const r = endDayEarly(g);
  assert.ok(r.events.includes('sunset-low'));
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

test('stars: up to 2 per sol (chapter + warm night)', () => {
  const played = playChapter(createGame()).game;
  assert.deepEqual(solStars(played).map((x) => x.earned), [true, true]);
  const cold = { ...createGame(), power: { ...createGame().power, battery: 10 } };
  assert.deepEqual(solStars(cold).map((x) => x.earned), [false, false]);
  const r = sleep(enterShelter(played));
  assert.equal(r.report.earned, 2);
  assert.equal(r.game.stars, 2);
});

test('stars: the dust storm sol gives the chapter star for getting through it', () => {
  const g = { ...createGame(), sol: CC_CONFIG.dustStorms[0] };
  assert.equal(solStars(g)[0].earned, true);
});

test('you can always walk out of the shelter core', () => {
  assert.equal(leaveShelter(enterShelter(createGame())).ok, true);
});
test('chapter: starting pays its cost, finishing moves to the next chapter and sets the sun', () => {
  const g0 = createGame();
  const s = startChapter(g0);
  assert.equal(s.ok, true);
  assert.equal(s.game.power.battery, g0.power.battery - CHAPTERS[0].cost);
  const f = finishChapter(s.game);
  assert.equal(f.game.phase, 'night');
  assert.equal(f.game.chapter, 2);
  assert.equal(f.game.done.chapter, true);
});

test('chapter: not enough power = cannot start, the crew can rest instead', () => {
  const g = { ...createGame(), power: { ...createGame().power, battery: 10 } };
  const c = chapterCheck(g);
  assert.equal(c.ok, false);
  assert.deepEqual(c.missing, ['power 15']);
  assert.equal(startChapter(g).ok, false);
  const r = endDayEarly(g);
  assert.equal(r.game.phase, 'night');
  assert.equal(r.game.chapter, 1);   // the same chapter waits for tomorrow
});

test('chapter: none on a dust storm sol, and only one per day', () => {
  assert.equal(todaysChapter({ ...createGame(), sol: CC_CONFIG.dustStorms[0] }), null);
  const done = playChapter(createGame()).game;
  assert.equal(startChapter(done).ok, false);
});

test('chapter: finishing without starting does nothing', () => {
  assert.equal(finishChapter(createGame()).ok, false);
});

test('MOXIE adds oxygen; at night the crew breathes, drinks and eats', () => {
  const g0 = createGame();
  const g = runSystem(unlockMoxieSystem(g0).game, 'moxie').game;
  assert.equal(g.oxygen, g0.oxygen + 15);
  const r = sleep(enterShelter(night(g)));
  assert.equal(r.game.oxygen, g.oxygen - 10);
  assert.equal(r.game.food, g.food - 10);
});

test('chapter gates use oxygen and food too (Chapter 2 needs oxygen 60)', () => {
  const g = { ...playChapter(createGame()).game, phase: 'day', done: {}, oxygen: 50 };
  const c = chapterCheck(g);
  assert.equal(c.chapter.n, 2);
  assert.deepEqual(c.missing, ['oxygen 60']);
});

test('changeResource: add food, cannot use more water than you have', async () => {
  const { changeResource } = await import('./commandCenter.js');
  assert.equal(changeResource(createGame(), 'food', 20, 'Harvest').game.food, 60);
  assert.equal(changeResource({ ...createGame(), water: 3 }, 'water', -5, 'Watering').ok, false);
});
