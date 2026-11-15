// TEMPORARY game store so the Command Center can be built and tested now.
// When Member 2's gameState.js / gameController.js are ready,
// delete this file and read/write the game through their controller instead.
import { createGame, tick } from '../systems/commandCenter.js';

let game = { ...createGame(), oxygen: 60, food: 30 };
const listeners = [];

export function getGame() { return game; }

export function setGame(next, events = []) {
  game = next;
  listeners.forEach((fn) => fn(game, events));
}

// returns a function that stops listening
export function onGameChange(fn) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

// The game clock: every second the sun, the storm and the battery update.
// It stops while a chapter or mini-game pop-up is open (see pauseClock below).
let clockPaused = false;

// Call pauseClock(true) when your pop-up game opens and pauseClock(false) when it closes,
// so kids don't lose daylight while they play. (The Command Center room does NOT pause it:
// planning power is part of the day.)
export function pauseClock(on) { clockPaused = !!on; }
export function isClockPaused() { return clockPaused; }

setInterval(() => {
  if (clockPaused) return;
  const r = tick(game, 1);
  setGame(r.game, r.events);
}, 1000);