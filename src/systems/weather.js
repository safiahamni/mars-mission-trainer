// WEATHER (Member 1): the outside temperature on Mars for each sol.
// Game numbers, close to what NASA's rovers measure: about -10 to -25 °C in the afternoon,
// about -65 to -80 °C before sunrise. A dust storm keeps days cooler and nights warmer.
// Pure functions.
import { CC_CONFIG } from './commandCenter.js';

// one entry per sol (sol 1 = first)
export const SOL_WEATHER = [
  { high: -12, low: -78 },
  { high: -10, low: -80 },
  { high: -15, low: -76 },
  { high: -25, low: -66 },   // sol 4: dust storm
  { high: -11, low: -79 },
  { high: -9, low: -77 },
  { high: -14, low: -81 },
];

export function solWeather(sol) {
  return SOL_WEATHER[Math.min(Math.max(sol, 1), SOL_WEATHER.length) - 1];
}

const PEAK = 0.85;          // the warmest moment is a bit after midday
const NIGHT_COOLING = 1.5;  // degrees colder every second after sunset

// The temperature right now, in whole degrees C.
export function temperatureNow(game) {
  const { high, low } = solWeather(game.sol);
  const t = Math.min(game.clock / CC_CONFIG.dayLength, 1);
  const day = low + (high - low) * Math.sin(Math.PI * t * PEAK);
  if (game.phase === 'day') return Math.round(day);
  const afterSunset = Math.max(0, game.clock - CC_CONFIG.dayLength);
  return Math.round(Math.max(low, day - afterSunset * NIGHT_COOLING));
}