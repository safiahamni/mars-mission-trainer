import { greenhouseRequirement } from '../places/science-lab/src/missions.js';
// COMMAND CENTER (Member 1): the sol clock, water, stars,
// the wardrobe, the radiation shelter's bunks, and sleeping to end the sol.
// Power rules live in power.js (Power Budget).
// Radiation (hazard meter, solar storm, cliff shade, Shield the Shelter) is Member 3's:
// src/places/radiation-shelter/shelter-game.js
// Pure functions: they return new copies.
import {
  POWER_CONFIG, createPowerState, setSwitch, spendPower, nightPower, morningCharge, unlockMoxie,
} from './power.js';

export const CC_CONFIG = {
  maxSols: 6,
  dustStorms: [4],     // morning storm charge; the indoor chapter remains available
};

// SCIENCE LAB CHAPTERS: one per day. The day ends (sunset) when today's chapter is finished.
// Chapters never fail. Numbers are the Science Lab's (its chapter screens):
//   needs = what you must HAVE to start it
//   uses  = what it uses up when it is completed
export const CHAPTERS = [
  { n: 1, id: 'rover-rescue',    name: 'Rover Rescue',     needs: { power: 15, oxygen: 10, water: 5,  food: 5 },  uses: { power: 10, oxygen: 10, water: 5,  food: 5 } },
  { n: 2, id: 'mystery-rocks',   name: 'Mystery Rocks',    needs: { power: 25, oxygen: 60, water: 4,  food: 4 },  uses: { power: 15, oxygen: 8,  water: 4,  food: 4 } },
  { n: 3, id: 'cosmic-claw',     name: 'Cosmic Claw',      needs: { power: 35, oxygen: 6,  water: 40, food: 5 },  uses: { power: 20, oxygen: 6,  water: 10, food: 5 } },
  { n: 4, id: 'snapshot-safari', name: 'Snapshot Safari',  needs: { power: 30, oxygen: 5,  water: 5,  food: 50 }, uses: { power: 15, oxygen: 5,  water: 5,  food: 10 } },
  { n: 5, id: 'lost-lake',       name: 'The Lost Lake',    needs: { power: 45, oxygen: 65, water: 50, food: 6 },  uses: { power: 25, oxygen: 12, water: 8,  food: 6 } },
  { n: 6, id: 'message-earth',   name: 'Message to Earth', needs: { power: 50, oxygen: 60, water: 40, food: 40 }, uses: { power: 30, oxygen: 8,  water: 6,  food: 6 } },
];

export const WATER_CONFIG = {
  start: 48,
  recycler: 15,        // water gained when the recycler runs
  crewPerNight: 0,     // 0: the chapters use water (night only uses power)
  target: 40,          // Science Lab chapters need water 40+
};

// Air and food work like water: systems add them during the day, the crew uses some every night.
export const OXYGEN_CONFIG = {
  start: 60,           // same as the Science Lab
  moxie: 15,           // oxygen MOXIE makes when it runs (once per sol)
  crewPerNight: 0,     // 0: the chapters use oxygen (night only uses power)
};
export const FOOD_CONFIG = {
  start: 30,           // same as the Science Lab
  crewPerNight: 0,     // 0: the chapters use food (night only uses power)
};

export const SHIRT_COLORS = ['blue', 'teal', 'purple', 'orange', 'red'];

const CHAPTER_STAR = { id: 'chapter', text: 'Complete today?s Science Lab chapter' };

export function createGame() {
  return {
    sol: 1,
    clock: 0,            // seconds since sunrise (only for the clock picture; it does NOT end the day)
    phase: 'day',        // 'day' | 'night'. Night starts when today's chapter is finished (or the crew rests)
    chapter: 1,          // the next Science Lab chapter to play
    inChapter: false,    // true while a chapter is being played
    power: createPowerState(),
    water: WATER_CONFIG.start,
    oxygen: OXYGEN_CONFIG.start,
    food: FOOD_CONFIG.start,
    startBattery: createPowerState().battery,   // battery at sunrise (for the sunset report)
    inShelter: false,    // in the radiation shelter (where the bunks are)
    outfit: 'crew',      // 'crew' | 'suit'
    shirt: 'blue',
    done: {},
    stars: 0,
    coldNights: 0,
    over: false,
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function isDustStormSol(sol) {
  return CC_CONFIG.dustStorms.includes(sol);
}

export function isDay(game) {
  return game.phase === 'day';
}

export function solStars(game) {
  return [{ ...CHAPTER_STAR, earned: !!game.done.chapter }];
}

export function cropPrepTask(game) {
  const greenhouse = game.greenhouseProgress ?? {};
  if (game.sol < 3 && greenhouse.greensPlantedSol !== game.sol) {
    return 'Plant leafy greens in the Greenhouse before sleeping.';
  }
  if (game.sol === 3 && game.food + (greenhouse.foodReadyBySol4 ?? 0) < CHAPTERS[3].needs.food) {
    return 'Plant enough greens to reach 50 Food by Sol 4.';
  }
  if (game.sol === 4 && !greenhouse.advancedCropHarvested && !greenhouse.advancedCropReadyBySol6) {
    return 'Plant potatoes so they can mature by Sol 6.';
  }
  return '';
}

// Flip a lever on the switchboard. The water recycler adds water when it runs.
export function pullLever(game, id, on) {
  const r = setSwitch(game.power, id, on);
  if (!r.ok) return { ok: false, game, message: r.message };
  let water = game.water;
  let oxygen = game.oxygen;
  let message = r.message;
  if (id === 'recycler' && on && !game.power.ranToday.recycler) {
    water = clamp(water + WATER_CONFIG.recycler, 0, 100);
    message += ` Water +${WATER_CONFIG.recycler}.`;
  }
  if (id === 'moxie' && on && !game.power.ranToday.moxie) {
    oxygen = clamp(oxygen + OXYGEN_CONFIG.moxie, 0, 100);
    message += ` Oxygen +${OXYGEN_CONFIG.moxie}.`;
  }
  return { ok: true, game: { ...game, power: r.power, water, oxygen }, message };
}

// Any station can spend power through the game: spend(game, COSTS.eva, 'EVA trip')
export function spend(game, cost, label) {
  const r = spendPower(game.power, cost, label);
  return { ok: r.ok, game: r.ok ? { ...game, power: r.power } : game, message: r.message };
}

export function setOutfit(game, outfit) {
  return { ...game, outfit };
}

export function setShirt(game, shirt) {
  return SHIRT_COLORS.includes(shirt) ? { ...game, shirt } : game;
}

// One second of time. It only moves the clock picture: the day ends with the chapter, not a timer.
export function tick(game, dt = 1) {
  if (game.over) return { game, events: [] };
  return { game: { ...game, clock: game.clock + dt }, events: [] };
}

// Sunset: night starts and the night line is checked. Returns { game, events }.
function sunset(game) {
  const g = { ...game, phase: 'night', sunsetAt: game.clock };
  const events = [];
  if (g.power.battery >= POWER_CONFIG.nightReserve) {
    events.push('sunset-safe');
  } else {
    events.push('sunset-low');
  }
  return { game: g, events };
}

// ---------- today's chapter ----------

// The chapter for today, or null after all six chapters are done.
export function todaysChapter(game) {
  return CHAPTERS.find((c) => c.n === game.chapter) || null;
}

// Can the crew start today's chapter? { ok, chapter, missing: ['power 15', ...], reason }
export function chapterCheck(game) {
  const chapter = todaysChapter(game);
  if (!chapter) return { ok: false, chapter: null, missing: [], reason: 'all-done' };
  if (!isDay(game)) return { ok: false, chapter, missing: [], reason: 'night' };
  if (game.done.chapter) return { ok: false, chapter, missing: [], reason: 'done-today' };
  if (chapter.id === 'rover-rescue' && game.roverReady === false) return { ok: false, chapter, missing: ['repair the rover'], reason: 'not-enough' };
  const have = { power: game.power.battery, water: game.water, oxygen: game.oxygen, food: game.food };
  const missing = Object.entries(chapter.needs)
    .filter(([k, v]) => have[k] < v)
    .map(([k, v]) => `${k} ${v}`);
  const greenhouseTask = greenhouseRequirement(chapter.id, game.greenhouseProgress);
  if (greenhouseTask) missing.push(greenhouseTask);
  return { ok: missing.length === 0, chapter, missing, reason: missing.length ? 'not-enough' : null };
}

// Start today's chapter: pays its power cost. The Science Lab calls this when the chapter opens.
export function startChapter(game) {
  const check = chapterCheck(game);
  if (!check.ok) {
    const why = {
      'all-done': 'All 6 chapters are done!',
      night: "It's night. Chapters open again in the morning.",
      'done-today': "Today's chapter is already done. Sleep to start the next sol.",
      'not-enough': `Not enough to start Chapter ${check.chapter?.n}. Need: ${check.missing.join(', ')}.`,
    }[check.reason];
    return { ok: false, game, message: why };
  }
  // nothing is paid yet: like the Lab, the chapter uses its resources when it is completed
  return { ok: true, game: { ...game, inChapter: true }, chapter: check.chapter, message: `Chapter ${check.chapter.n} started.` };
}

// The chapter is complete (chapters never fail): it uses its resources, then the sun sets.
// uses: optional, e.g. { power: 8 } when the Lab's route choice made it cheaper.
export function finishChapter(game, uses = {}) {
  if (!game.inChapter) return { ok: false, game, events: [], message: 'No chapter is being played.' };
  const ch = CHAPTERS.find((c) => c.n === game.chapter);
  const u = { ...ch.uses, ...uses };
  const power = { ...game.power, battery: clamp(game.power.battery - u.power, 0, 100) };
  const g = {
    ...game, power, stars: game.stars + 1,
    oxygen: clamp(game.oxygen - u.oxygen, 0, 100),
    water: clamp(game.water - u.water, 0, 100),
    food: clamp(game.food - u.food, 0, 100),
    inChapter: false, chapter: game.chapter + 1, done: { ...game.done, chapter: true },
  };
  if (game.chapter === CHAPTERS.length) {
    return { ok: true, game: { ...g, over: true }, events: [], message: 'Mission complete!' };
  }
  const r = sunset(g);
  return { ok: true, game: r.game, events: r.events, message: `Chapter ${game.chapter} complete!` };
}

// A six-Sol run requires today's chapter before advancing.
export function endDayEarly(game) {
  return { ok: false, game, events: [], message: 'Complete today?s chapter before sleeping.' };
}

export function enterShelter(game) {
  return { ...game, inShelter: true };
}

export function leaveShelter(game) {
  return { ok: true, game: { ...game, inShelter: false } };
}

// What the player spent today (for the sunset message from Mission control)
export function spentToday(game) {
  return Math.max(0, game.startBattery - game.power.battery);
}

// Sleep in the bunks: night uses the reserve, the crew drinks water,
// stars are counted, and a new sol starts with the morning solar charge.
export function sleepRequirement(game, { evaUnsafe = false } = {}) {
  if (game.over) return 'The mission is complete.';
  if (!game.done.chapter) return 'Complete today?s chapter before sleeping.';
  if (game.power.panels !== 'clean' && !evaUnsafe) return 'Clean all three solar panels before sleeping.';
  return cropPrepTask(game);
}

export function sleep(game, options) {
  if (!game.inShelter) return { ok: false, game, message: 'The bunks are inside the radiation shelter.' };
  const message = sleepRequirement(game, options);
  if (message || game.phase !== 'night') return { ok: false, game, message: message || 'Sleep after sunset.' };

  const night = nightPower(game.power);
  const water = clamp(game.water - WATER_CONFIG.crewPerNight, 0, 100);
  const oxygen = clamp(game.oxygen - OXYGEN_CONFIG.crewPerNight, 0, 100);
  const food = clamp(game.food - FOOD_CONFIG.crewPerNight, 0, 100);
  const stars = solStars(game);
  const earned = stars.filter((s) => s.earned).length;

  const last = game.sol >= CC_CONFIG.maxSols;
  const nextSol = last ? game.sol : game.sol + 1;
  const dustStorm = !last && isDustStormSol(nextSol);
  const morning = last ? { power: night.power, gained: 0 } : morningCharge(night.power, { dustStorm });

  const report = {
    sol: game.sol,
    earned,
    total: stars.length,
    stars,
    bedtime: game.power.battery,
    afterNight: night.power.battery,
    gained: morning.gained,
    morning: morning.power.battery,
    cold: night.cold,
    dustStorm,
    waterFrom: game.water,
    waterTo: water,
    oxygenFrom: game.oxygen,
    oxygenTo: oxygen,
    foodFrom: game.food,
    foodTo: food,
    hungry: food === 0,
  };

  const g = {
    ...game,
    sol: nextSol,
    clock: 0,
    phase: 'day',
    power: { ...morning.power, panels: 'dusty' },
    water,
    oxygen,
    food,
    startBattery: morning.power.battery,
    done: {},
    coldNights: game.coldNights + (night.cold ? 1 : 0),
    over: last,
  };
  return { ok: true, game: g, report };
}
// ---------- for other rooms (Greenhouse, Life Support, Science Lab): pure helpers ----------
const RESOURCES = ['water', 'oxygen', 'food'];

// Add (positive) or use (negative) water / oxygen / food. Using more than you have = not ok.
export function changeResource(game, name, amount, label = 'That') {
  if (!RESOURCES.includes(name)) return { ok: false, game, message: `Unknown resource: ${name}.` };
  if (amount < 0 && game[name] < -amount) return { ok: false, game, message: `${label} needs ${-amount} ${name}. You have ${game[name]}.` };
  const next = clamp(game[name] + amount, 0, 100);
  return { ok: true, game: { ...game, [name]: next }, message: `${label}: ${amount > 0 ? '+' : ''}${amount} ${name}.` };
}

// Life Support: unlock MOXIE once (10 power). After that runSystem(game, 'moxie') works.
export function unlockMoxieSystem(game) {
  const r = unlockMoxie(game.power);
  return { ok: r.ok, game: r.ok ? { ...game, power: r.power } : game, message: r.message };
}

// Life Support runs a system for today: 'moxie' (+oxygen) or 'recycler' (+water).
// The Command Center switchboard only SHOWS what is running.
export function runSystem(game, id) {
  if (game.power.ranToday[id]) return { ok: false, game, message: 'Already ran today.' };
  return pullLever(game, id, true);
}
