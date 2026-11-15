// COMMAND CENTER (Member 1): the sol clock, water, today's missions from Mission control,
// the wardrobe, the storm shelter core's bunks, and sleeping to end the sol.
// Power rules live in power.js (Power Budget).
// Radiation (hazard meter, solar storm, cliff shade, Shield the Shelter) is Member 3's:
// src/places/radiation-shelter/shelter-game.js
// Pure functions: they return new copies.
import {
  POWER_CONFIG, createPowerState, setSwitch, spendPower, nightPower, morningCharge,
} from './power.js';

export const CC_CONFIG = {
  maxSols: 7,
  dayLength: 90,       // seconds of daylight in one sol (then it is night until you sleep)
  dustStorms: [4],     // sols that start with a dust storm (+5 morning charge, panels get dusty)
};

export const WATER_CONFIG = {
  start: 48,
  recycler: 15,        // water gained when the recycler runs
  crewPerNight: 10,    // water the crew uses every night
  target: 40,          // Science Lab chapters need water 40+
};

export const SHIRT_COLORS = ['blue', 'teal', 'purple', 'orange', 'red'];

// Today's checklist on the Mission control screen. check(game) = true means done.
export const MISSIONS = [
  { id: 'moxie', text: 'Run MOXIE so it makes oxygen', check: (g) => !!g.power.ranToday.moxie },
  { id: 'recycler', text: 'Run the water recycler', check: (g) => !!g.power.ranToday.recycler },
  { id: 'reserve', text: `Keep ${POWER_CONFIG.nightReserve} power for the night` },
  { id: 'sleep', text: 'Sleep in the bunks to end the sol' },
];

export function createGame() {
  return {
    sol: 1,
    clock: 0,            // seconds since sunrise
    phase: 'day',        // 'day' | 'night'
    power: createPowerState(),
    water: WATER_CONFIG.start,
    startBattery: createPowerState().battery,   // battery at sunrise (for the sunset report)
    inShelter: false,    // in the storm shelter core (where the bunks are)
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

export function todaysMissions(game) {
  return MISSIONS.map((m) => ({ id: m.id, text: m.text, done: !!game.done[m.id] }));
}

function checkMissions(game) {
  const done = { ...game.done };
  for (const m of MISSIONS) {
    if (m.check && m.check(game)) done[m.id] = true;
  }
  return { ...game, done };
}

// Flip a lever on the switchboard. The water recycler adds water when it runs.
export function pullLever(game, id, on) {
  const r = setSwitch(game.power, id, on);
  if (!r.ok) return { ok: false, game, message: r.message };
  let water = game.water;
  let message = r.message;
  if (id === 'recycler' && on && !game.power.ranToday.recycler) {
    water = clamp(water + WATER_CONFIG.recycler, 0, 100);
    message += ` Water +${WATER_CONFIG.recycler}.`;
  }
  return { ok: true, game: checkMissions({ ...game, power: r.power, water }), message };
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

// One second of time. Returns the new game and what happened.
export function tick(game, dt = 1) {
  if (game.over) return { game, events: [] };
  const g = { ...game, clock: game.clock + dt };
  const events = [];

  // sunset: check the night line
  if (g.phase === 'day' && g.clock >= CC_CONFIG.dayLength) {
    g.phase = 'night';
    if (g.power.battery >= POWER_CONFIG.nightReserve) {
      g.done = { ...g.done, reserve: true };
      events.push('sunset-safe');
    } else {
      events.push('sunset-low');
    }
  }
  return { game: checkMissions(g), events };
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
  if (!game.inShelter) return { ok: false, game, message: 'The bunks are inside the storm shelter core.' };
  if (game.phase === 'day') return { ok: false, game, message: "It's still daytime. Sleep after sunset." };

  const night = nightPower(game.power);
  const water = clamp(game.water - WATER_CONFIG.crewPerNight, 0, 100);
  const done = { ...game.done, sleep: true };
  const missions = todaysMissions({ ...game, done });
  const earned = missions.filter((m) => m.done).length;

  const last = game.sol >= CC_CONFIG.maxSols;
  const nextSol = last ? game.sol : game.sol + 1;
  const dustStorm = !last && isDustStormSol(nextSol);
  const morning = last ? { power: night.power, gained: 0 } : morningCharge(night.power, { dustStorm });

  const report = {
    sol: game.sol,
    earned,
    total: missions.length,
    bedtime: game.power.battery,
    afterNight: night.power.battery,
    gained: morning.gained,
    morning: morning.power.battery,
    cold: night.cold,
    dustStorm,
    waterFrom: game.water,
    waterTo: water,
  };

  const g = {
    ...game,
    sol: nextSol,
    clock: 0,
    phase: 'day',
    power: morning.power,
    water,
    startBattery: morning.power.battery,
    done: {},
    stars: game.stars + earned,
    coldNights: game.coldNights + (night.cold ? 1 : 0),
    over: last,
  };
  return { ok: true, game: g, report };
}