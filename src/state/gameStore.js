// TEMPORARY game store so the Command Center can be built and tested now.
// When Member 2's gameState.js / gameController.js are ready,
// delete this file and read/write the game through their controller instead.
import { createGame, tick, startChapter, finishChapter, endDayEarly, spend, changeResource } from '../systems/commandCenter.js';

let game = createGame();
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

// ---------- for teammates (Science Lab chapters) ----------
// When the chapter opens:   const r = startTodaysChapter(); if (!r.ok) showMessage(r.message);
// When the chapter is done: finishTodaysChapter();   -> sunset, "head back and sleep"
export function startTodaysChapter() {
  const r = startChapter(game);
  if (r.ok) setGame(r.game);
  return r;
}
export function finishTodaysChapter() {
  const r = finishChapter(game);
  if (r.ok) setGame(r.game, r.events);
  return r;
}
export function restToday() {
  const r = endDayEarly(game);
  if (r.ok) setGame(r.game, r.events);
  return r;
}

// ---------- for every room: read and change the shared numbers ----------
// See docs/SHARED_GAME_STATE.md for examples.

// Everything a room usually needs, as plain numbers
export function getResources() {
  const g = getGame();
  return { sol: g.sol, phase: g.phase, power: g.power.battery, water: g.water, oxygen: g.oxygen, food: g.food, stars: g.stars, chapter: g.chapter };
}

// Pay power: usePower(5, 'Grow lights') -> { ok, message }. Not enough = ok false, nothing changes.
export function usePower(cost, label) {
  const r = spend(game, cost, label);
  if (r.ok) setGame(r.game);
  return r;
}

// Water / oxygen / food: addResource('food', 20, 'Harvest') or addResource('water', -5, 'Watering')
export function addResource(name, amount, label) {
  const r = changeResource(game, name, amount, label);
  if (r.ok) setGame(r.game);
  return r;
}

// One object on window, so code that can't import (like the Science Lab iframe) can use it:
//   const game = window.parent.MarsGame;   game.resources(), game.start(), game.finish() ...
// Also handy in the browser console for testing: MarsGame.start() then MarsGame.finish()
if (typeof window !== 'undefined') {
  window.MarsGame = {
    get: getGame,
    resources: getResources,
    usePower,
    addResource,
    start: startTodaysChapter,
    finish: finishTodaysChapter,
    rest: restToday,
    onChange: onGameChange,
  };
}
