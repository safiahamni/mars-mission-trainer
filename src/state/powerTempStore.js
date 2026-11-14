// TEMPORARY power store so the Power Station can be tested now.
// When Member 2's gameState.js / gameController.js are ready,
// delete this file and read/write power through their controller instead.
import { createPowerState } from '../systems/power.js';

let power = createPowerState();
let dustStorm = false;
const listeners = [];

export function getPower() { return power; }
export function setPower(next) { power = next; listeners.forEach((fn) => fn(power)); }
export function isDustStorm() { return dustStorm; }
export function setDustStorm(on) { dustStorm = on; }
export function onPowerChange(fn) { listeners.push(fn); }