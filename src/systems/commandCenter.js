// COMMAND CENTER (Member 1): the sol clock, water, solar storms, the storm shelter,
// today's missions from Mission control, the wardrobe, and sleeping to end the sol.
// Power rules live in power.js (Power Budget). Radiation rules live in radiation.js (Member 3).
// This file owns the ONE solar storm the whole game shares (Mission control, the map storm bar,
// and Member 3's "Shield the Shelter" all read game.storm).
// Pure functions: they return new copies.
import {
  POWER_CONFIG, COSTS, createPowerState, setSwitch, spendPower, nightPower, morningCharge,
} from './power.js';
import { RAD_CONFIG, hazardRate, addHazard } from './radiation.js';

export const CC_CONFIG = {
  maxSols: 7,
  dayLength: 90,       // seconds of daylight in one sol (then it is night until you sleep)
  warningLength: 25,   // seconds between the solar storm warning and the storm
  stormLength: 25,     // seconds the solar storm lasts
  solarStorms: { 1: 35, 3: 25, 5: 50 },   // sol: seconds after sunrise when the warning comes
  dustStorms: [4],     // sols that start with a dust storm (+5 morning charge, panels get dusty)
};

export const WATER_CONFIG = {
  start: 48,
  recycler: 15,        // water gained when the recycler runs
  crewPerNight: 10,    // water the crew uses every night
  target: 40,          // Science Lab chapters need water 40+
};

export const SHIRT_COLORS = ['blue', 'teal', 'purple', 'orange', 'red'];

// Today's checklist on the Mission control screen.
// check(game) = true means done. Missions with only() are only shown on some sols.
export const MISSIONS = [
  { id: 'moxie', text: `Run MOXIE so it makes oxygen`, check: (g) => !!g.power.ranToday.moxie },
  { id: 'recycler', text: `Run the water recycler`, check: (g) => !!g.power.ranToday.recycler },
  { id: 'shelter', text: 'Be in the storm shelter core when the solar storm hits', only: (g) => hasSolarStorm(g.sol) },
  { id: 'tanks', text: 'Shield the shelter with 3 water tanks', only: (g) => hasSolarStorm(g.sol), check: (g) => g.tanks >= RAD_CONFIG.tanks },
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
    storm: 'none',       // 'none' | 'warning' | 'storm' | 'over'
    stormTimer: 0,
    where: 'room',       // 'room' (in the Command Center) | 'outside' | 'lab'  (Member 3's map sets this)
    shaded: false,       // in the cliff shade (Member 3's map sets this)
    inShelter: false,    // in the storm shelter core
    hazard: 0,           // radiation hazard meter, 0-100 (Member 3)
    tanksFilled: false,  // paid to pump water into the shielding tanks today
    tanks: 0,            // water tanks placed on the shelter shelves (0-3)
    outfit: 'crew',      // 'crew' | 'suit'
    shirt: 'blue',
    done: {},
    stars: 0,
    coldNights: 0,
    over: false,
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function hasSolarStorm(sol) {
  return CC_CONFIG.solarStorms[sol] !== undefined;
}

export function isDustStormSol(sol) {
  return CC_CONFIG.dustStorms.includes(sol);
}

export function isDay(game) {
  return game.phase === 'day';
}

export function todaysMissions(game) {
  return MISSIONS.filter((m) => !m.only || m.only(game)).map((m) => ({ id: m.id, text: m.text, done: !!game.done[m.id] }));
}

function checkMissions(game) {
  const done = { ...game.done };
  for (const m of MISSIONS) {
    if (m.check && (!m.only || m.only(game)) && m.check(game)) done[m.id] = true;
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

export function stormActive(game) {
  return game.storm === 'warning' || game.storm === 'storm';
}

// Where the crew is, for the hazard meter: 'core' | 'room' | 'outside' | 'lab'
export function crewPlace(game) {
  return game.inShelter ? 'core' : game.where;
}

export function currentHazardRate(game) {
  return hazardRate({ where: crewPlace(game), storm: game.storm === 'storm', tanks: game.tanks, shaded: game.shaded });
}

// Member 3's map tells the game where the crew is ('room' | 'outside' | 'lab')
export function setWhere(game, where, shaded = false) {
  return { ...game, where, shaded, inShelter: where === 'room' ? game.inShelter : false };
}

// "Shield the Shelter" step 1: pump water into the shielding tanks (Power Budget: shielding 25)
export function fillTanks(game) {
  if (!stormActive(game)) return { ok: false, game, message: 'The tanks are only filled when a solar storm is coming.' };
  if (game.tanksFilled) return { ok: false, game, message: 'The tanks are already full.' };
  const r = spend(game, COSTS.shielding, 'Pump water into the tanks');
  if (!r.ok) return r;
  return { ok: true, game: { ...r.game, tanksFilled: true }, message: 'Tanks filled! Carry them onto the shelves.' };
}

// "Shield the Shelter" step 2: one tank onto a shelf
export function placeTank(game) {
  if (!game.tanksFilled || !stormActive(game) || game.tanks >= RAD_CONFIG.tanks) return { ok: false, game };
  return { ok: true, game: checkMissions({ ...game, tanks: game.tanks + 1 }) };
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
  let g = { ...game, clock: game.clock + dt };
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

  // solar storm: warning -> storm -> over
  const warnAt = CC_CONFIG.solarStorms[g.sol];
  if (g.storm === 'none' && warnAt !== undefined && g.clock >= warnAt) {
    g.storm = 'warning';
    g.stormTimer = CC_CONFIG.warningLength;
    events.push('storm-warning');
  } else if (g.storm === 'warning') {
    g.stormTimer = Math.max(0, g.stormTimer - dt);
    if (g.stormTimer === 0) {
      g.storm = 'storm';
      g.stormTimer = CC_CONFIG.stormLength;
      if (g.inShelter) {
        g.done = { ...g.done, shelter: true };
        events.push('storm-safe');
      } else {
        events.push('storm-hit');
      }
    }
  } else if (g.storm === 'storm') {
    g.stormTimer = Math.max(0, g.stormTimer - dt);
    if (g.stormTimer === 0) {
      g.storm = 'over';
      events.push('storm-over');
    }
  }

  // radiation: the hazard meter rises by where the crew is (1 real second = 1 game minute)
  const before = g.hazard;
  g.hazard = addHazard(g.hazard, currentHazardRate(g), dt);
  if (before < RAD_CONFIG.max && g.hazard >= RAD_CONFIG.max) events.push('hazard-full');

  return { game: checkMissions(g), events };
}

export function enterShelter(game) {
  return { ...game, inShelter: true };
}

export function leaveShelter(game) {
  if (game.storm === 'storm') return { ok: false, game, message: 'Stay inside! The storm is still outside.' };
  return { ok: true, game: { ...game, inShelter: false } };
}

// What the player spent today (for the sunset message from Mission control)
export function spentToday(game) {
  return Math.max(0, game.startBattery - game.power.battery);
}

// Sleep in the bunks: night uses the reserve, the crew drinks water,
// stars are counted, and a new sol starts with the morning solar charge.
export function sleep(game) {
  if (!game.inShelter) return { ok: false, game, message: 'The bunks are inside the storm shelter.' };
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
    hazard: game.hazard,
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
    storm: 'none',
    stormTimer: 0,
    hazard: 0,          // a new sol: the hazard meter resets (Member 3's newSol)
    tanksFilled: false,
    tanks: 0,
    done: {},
    stars: game.stars + earned,
    coldNights: game.coldNights + (night.cold ? 1 : 0),
    over: last,
  };
  return { ok: true, game: g, report };
}