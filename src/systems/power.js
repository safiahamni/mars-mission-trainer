// POWER (Member 1): the 0-100 battery every station spends from.
// Follows the team's "Mars Outpost: Power Budget":
//   - each action has a price and spends it when it runs
//   - the solar field adds a charge every morning (+55 clean, +20 dusty, +5 dust storm)
//   - 20 power is always kept for heaters + life support at night (the night line)
// Pure functions: they never change the state you pass in; they return a new copy.

export const POWER_CONFIG = {
  max: 100,            // charge above 100 is lost
  start: 60,           // battery at the start of the mission
  nightReserve: 20,    // heaters + life support at night
  solar: { clean: 55, dusty: 20, storm: 5 },   // morning charge
};

// Prices from the Power Budget (keep every number here so the team can tune them)
export const COSTS = {
  moxieUnlock: 10,   // one time
  moxie: 5,          // per sol
  recycler: 5,       // per sol
  growLights: 5,     // per sol (the Greenhouse room pays this itself, it's not on the switchboard)
  eva: 5,            // per trip
  rover: 5,          // per use
  shielding: 25,     // solar storm only
};

// The switchboard levers, in the order of the Switchboard Kit.
// cost = price to run it today. perSol levers switch off every morning, so the crew plans again.
export const SWITCHES = [
  { id: 'heater', name: 'Heaters', plate: 'HEATERS', cost: 0, locked: true, note: 'Uses the night reserve' },
  { id: 'recycler', name: 'Water recycler', plate: 'WATER<br>RECYCLER', cost: COSTS.recycler, perSol: true },
  { id: 'lab', name: 'Lab equipment', plate: 'LAB<br>EQUIP', cost: 0, note: 'Chapters cost their own power' },
  { id: 'moxie', name: 'MOXIE', plate: 'MOXIE', cost: COSTS.moxie, unlockCost: COSTS.moxieUnlock, perSol: true },
];

export function createPowerState() {
  return {
    battery: POWER_CONFIG.start,
    switches: { heater: true, recycler: false, lab: true, moxie: false },
    ranToday: {},          // which per-sol systems were already paid for today
    moxieUnlocked: false,
    panels: 'clean',       // 'clean' | 'dusty'
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Other stations use this, e.g. isCircuitOn(power, 'moxie')
export function isCircuitOn(power, id) {
  return !!power.switches[id];
}

// Spendable today = battery - night reserve
export function spendable(power) {
  return Math.max(0, power.battery - POWER_CONFIG.nightReserve);
}

// How much power is missing to get back to the night line (0 if fine)
export function shortForNight(power) {
  return Math.max(0, POWER_CONFIG.nightReserve - power.battery);
}

// Any station can spend power: spendPower(power, COSTS.eva, 'EVA trip')
export function spendPower(power, cost, label = 'That') {
  if (cost > power.battery) return { ok: false, power, message: `${label} needs ${cost} power. Need ${cost - power.battery} more.` };
  return { ok: true, power: { ...power, battery: power.battery - cost }, message: `${label}: −${cost} power.` };
}

// Price of switching a lever on right now (0 if already paid today)
export function leverCost(power, id) {
  const sw = SWITCHES.find((s) => s.id === id);
  if (!sw || power.ranToday[id]) return 0;
  return sw.cost + (sw.unlockCost && !power.moxieUnlocked ? sw.unlockCost : 0);
}

// Life Support unlocks MOXIE once (pays COSTS.moxieUnlock). Until then the MOXIE lever is locked.
export function unlockMoxie(power) {
  if (power.moxieUnlocked) return { ok: false, power, message: 'MOXIE is already unlocked.' };
  const r = spendPower(power, COSTS.moxieUnlock, 'Unlock MOXIE');
  if (!r.ok) return r;
  return { ok: true, power: { ...r.power, moxieUnlocked: true }, message: `MOXIE unlocked! −${COSTS.moxieUnlock} power.` };
}

export function setSwitch(power, id, on) {
  const sw = SWITCHES.find((s) => s.id === id);
  if (!sw) return { ok: false, power, message: 'Unknown switch.' };
  if (sw.locked) return { ok: false, power, message: `${sw.name} must stay on. They use the night reserve.` };
  if (on && id === 'moxie' && !power.moxieUnlocked) return { ok: false, power, message: 'MOXIE is locked. Unlock it in Life Support first.' };
  if (!on) {
    const note = power.ranToday[id] ? ' (power already used today)' : '';
    return { ok: true, power: { ...power, switches: { ...power.switches, [id]: false } }, message: `${sw.name} off${note}.` };
  }
  const cost = leverCost(power, id);
  if (cost > power.battery) return { ok: false, power, message: `${sw.name} needs ${cost} power. Need ${cost - power.battery} more.` };
  const next = {
    ...power,
    battery: power.battery - cost,
    switches: { ...power.switches, [id]: true },
    ranToday: cost > 0 || sw.perSol ? { ...power.ranToday, [id]: true } : power.ranToday,
    moxieUnlocked: power.moxieUnlocked || id === 'moxie',
  };
  const unlocked = id === 'moxie' && !power.moxieUnlocked ? ' MOXIE unlocked!' : '';
  return { ok: true, power: next, cost, message: `${sw.name} on${cost ? `: −${cost} power` : ''}.${unlocked}` };
}

// Night: heaters + life support use the night reserve. Below it, the crew gets cold.
export function nightPower(power) {
  const cold = power.battery < POWER_CONFIG.nightReserve;
  return { power: { ...power, battery: Math.max(0, power.battery - POWER_CONFIG.nightReserve) }, cold };
}

// Morning: the solar field charges the battery, and per-sol systems switch off to be planned again
export function morningCharge(power, { dustStorm = false } = {}) {
  const gained = dustStorm ? POWER_CONFIG.solar.storm : POWER_CONFIG.solar[power.panels];
  const switches = { ...power.switches };
  SWITCHES.filter((s) => s.perSol).forEach((s) => { switches[s.id] = false; });
  return {
    power: {
      ...power,
      battery: clamp(power.battery + gained, 0, POWER_CONFIG.max),
      switches,
      ranToday: {},
      panels: dustStorm ? 'dusty' : power.panels,
    },
    gained,
  };
}

// EVA / airlock team: cleaning the panels brings the morning charge back to clean (+55)
export function cleanPanels(power) {
  return { ...power, panels: 'clean' };
}

// 'ok' | 'low' | 'empty': used for warning colours
export function powerStatus(power) {
  if (power.battery <= 0) return 'empty';
  if (power.battery < POWER_CONFIG.nightReserve) return 'low';
  return 'ok';
}