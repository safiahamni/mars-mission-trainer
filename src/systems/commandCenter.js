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
  maxSols: 7,
  dustStorms: [4],     // sols that start with a dust storm (+5 morning charge, panels get dusty, no chapter)
};

// SCIENCE LAB CHAPTERS: one per day. The day ends (sunset) when today's chapter is finished.
// Chapters never fail. The only thing that can stop one is the gate:
//   needs = what you must HAVE to start it, cost = power it uses when it starts.
// Numbers follow the Science Lab's missions.js (id = the Lab's mission id).
export const CHAPTERS = [
  { n: 1, id: 'rover-rescue',    name: 'Rover Rescue',     needs: { power: 15 },                                   cost: 10 },
  { n: 2, id: 'mystery-rocks',   name: 'Mystery Rocks',    needs: { power: 25, oxygen: 60 },                       cost: 15 },
  { n: 3, id: 'cosmic-claw',     name: 'Cosmic Claw',      needs: { power: 35, water: 40 },                        cost: 20 },
  { n: 4, id: 'snapshot-safari', name: 'Snapshot Safari',  needs: { power: 30, food: 50 },                         cost: 15 },
  { n: 5, id: 'lost-lake',       name: 'The Lost Lake',    needs: { power: 45, oxygen: 65, water: 50 },            cost: 25 },
  { n: 6, id: 'message-earth',   name: 'Message to Earth', needs: { power: 50, oxygen: 60, food: 40, water: 40 },  cost: 30 },
];

export const WATER_CONFIG = {
  start: 48,
  recycler: 15,        // water gained when the recycler runs
  crewPerNight: 10,    // water the crew uses every night
  target: 40,          // Science Lab chapters need water 40+
};

// Air and food work like water: systems add them during the day, the crew uses some every night.
export const OXYGEN_CONFIG = {
  start: 55,
  moxie: 15,           // oxygen MOXIE makes when it runs (once per sol)
  crewPerNight: 10,    // oxygen the crew breathes every night
};
export const FOOD_CONFIG = {
  start: 40,
  crewPerNight: 10,    // food the crew eats every night (packaged food + greenhouse harvests)
};

export const SHIRT_COLORS = ['blue', 'teal', 'purple', 'orange', 'red'];

// STARS: up to 2 per sol, no checklist to read.
//   chapter: finish today's Science Lab chapter (on the dust storm sol: get through the storm)
//   warm:    go to bed with 20+ power, so the crew stays warm
export const STARS = [
  { id: 'chapter', text: "Finish today's chapter" },
  { id: 'warm', text: 'Warm night: 20+ power at bedtime' },
];

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

// The stars for one sol. warmNight = the battery is at the night line or above.
export function solStars(game) {
  const chapter = !!game.done.chapter || (isDustStormSol(game.sol) && !game.inChapter);
  const warm = game.power.battery >= POWER_CONFIG.nightReserve;
  return [
    { ...STARS[0], earned: chapter },
    { ...STARS[1], earned: warm },
  ];
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

// The chapter for today, or null (dust storm day, or all 6 chapters done)
export function todaysChapter(game) {
  if (isDustStormSol(game.sol)) return null;
  return CHAPTERS.find((c) => c.n === game.chapter) || null;
}

// Can the crew start today's chapter? { ok, chapter, missing: ['power 15', ...], reason }
export function chapterCheck(game) {
  const chapter = todaysChapter(game);
  if (!chapter) return { ok: false, chapter: null, missing: [], reason: isDustStormSol(game.sol) ? 'dust-storm' : 'all-done' };
  if (!isDay(game)) return { ok: false, chapter, missing: [], reason: 'night' };
  if (game.done.chapter) return { ok: false, chapter, missing: [], reason: 'done-today' };
  const have = { power: game.power.battery, water: game.water, oxygen: game.oxygen, food: game.food };
  const missing = Object.entries(chapter.needs)
    .filter(([k, v]) => have[k] < v)
    .map(([k, v]) => `${k} ${v}`);
  return { ok: missing.length === 0, chapter, missing, reason: missing.length ? 'not-enough' : null };
}

// Start today's chapter: pays its power cost. The Science Lab calls this when the chapter opens.
export function startChapter(game) {
  const check = chapterCheck(game);
  if (!check.ok) {
    const why = {
      'dust-storm': 'No chapter today: a dust storm is blocking the sky. Look after the base and rest.',
      'all-done': 'All 6 chapters are done!',
      night: "It's night. Chapters open again in the morning.",
      'done-today': "Today's chapter is already done. Sleep to start the next sol.",
      'not-enough': `Not enough to start Chapter ${check.chapter?.n}. Need: ${check.missing.join(', ')}.`,
    }[check.reason];
    return { ok: false, game, message: why };
  }
  const r = spendPower(game.power, check.chapter.cost, `Chapter ${check.chapter.n}`);
  if (!r.ok) return { ok: false, game, message: r.message };
  return { ok: true, game: { ...game, power: r.power, inChapter: true }, chapter: check.chapter, message: r.message };
}

// The chapter is complete (chapters never fail): tick it off and the sun sets.
export function finishChapter(game) {
  if (!game.inChapter) return { ok: false, game, events: [], message: 'No chapter is being played.' };
  const g = { ...game, inChapter: false, chapter: game.chapter + 1, done: { ...game.done, chapter: true } };
  const r = sunset(g);
  return { ok: true, game: r.game, events: r.events, message: `Chapter ${game.chapter} complete!` };
}

// Rest day: no chapter today (not enough power, or a dust storm). The crew ends the day early.
export function endDayEarly(game) {
  if (!isDay(game)) return { ok: false, game, events: [], message: "It's already night." };
  if (game.inChapter) return { ok: false, game, events: [], message: 'Finish the chapter first.' };
  const r = sunset(game);
  return { ok: true, game: r.game, events: r.events, message: 'The crew rests today. Sleep to start the next sol.' };
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
export function sleep(game) {
  if (!game.inShelter) return { ok: false, game, message: 'The bunks are inside the radiation shelter.' };
  if (game.phase === 'day') return { ok: false, game, message: "It's still daytime. Sleep after sunset." };

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
    power: morning.power,
    water,
    oxygen,
    food,
    startBattery: morning.power.battery,
    done: {},
    stars: game.stars + earned,
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
