// POWER SYSTEM (Member 1)
// Power is the "currency" every station spends.
// These are pure functions: they never change the state you pass in,
// they return a new copy. Member 2's gameController applies the result.

// Game numbers (simplified for kids, documented in the README):
// - On Mars, sunlight is weaker than on Earth, and dust storms can block it for weeks.
// - NASA's Opportunity rover ran on solar panels and had to save power during dust storms.
export const POWER_CONFIG = {
  solarPerSol: 20,        // energy made on a clear sol
  dustStormFactor: 0.4,   // a dust storm leaves only 40% of normal sunlight
  batteryCapacity: 40,    // the most energy the battery can store
  startBattery: 20,       // energy at the start of the mission
  lowThreshold: 8,        // below this, show a low-power warning
};

// Starting power state. Member 2 puts this inside the shared game state.
export function createPowerState() {
  return {
    stored: POWER_CONFIG.startBattery,
    capacity: POWER_CONFIG.batteryCapacity,
    producedToday: 0,
    wastedToday: 0,
  };
}

// How much energy the solar panels make this sol.
// env.dustStorm: true during a dust storm (comes from Member 3's events.js)
export function solarOutput(env = {}) {
  const factor = env.dustStorm ? POWER_CONFIG.dustStormFactor : 1;
  return Math.round(POWER_CONFIG.solarPerSol * factor);
}

// Called once at the start of each sol: charge the battery with today's sunlight.
// Anything above capacity is wasted (the battery is full).
export function chargeForNewSol(power, env = {}) {
  const made = solarOutput(env);
  const room = power.capacity - power.stored;
  const added = Math.min(made, room);
  return {
    ...power,
    stored: power.stored + added,
    producedToday: made,
    wastedToday: made - added,
  };
}

// Can we pay this much energy right now?
export function canAfford(power, cost) {
  return Number.isFinite(cost) && cost >= 0 && power.stored >= cost;
}

// Try to spend energy. Never goes below zero.
// Returns { ok, power, message } so the UI can show what happened.
export function spend(power, cost, reason = 'equipment') {
  if (!canAfford(power, cost)) {
    return {
      ok: false,
      power,
      message: `Not enough power for ${reason}. You need ${cost} but only have ${power.stored}.`,
    };
  }
  return {
    ok: true,
    power: { ...power, stored: power.stored - cost },
    message: `Used ${cost} power for ${reason}.`,
  };
}

// 'ok' | 'low' | 'empty': used for warnings and colours in the HUD
export function powerStatus(power) {
  if (power.stored <= 0) return 'empty';
  if (power.stored < POWER_CONFIG.lowThreshold) return 'low';
  return 'ok';
}

export const SOLAR_FACT =
  'Mars gets less than half the sunlight Earth does, because it is farther from the Sun. ' +
  'Dust storms can block even more. NASA\'s Opportunity rover had to rest and save power during big dust storms.';