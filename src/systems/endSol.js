// END SOL: what happens when the player finishes a day.
// Any system can say "run this when the sol ends".
// The Start Hub's End Sol button calls runEndSol().
//
//   import { onEndSol } from '../systems/endSol.js';
//   onEndSol('Food', (ctx) => { /* eat food */ return 'The crew ate 3 meals.'; });
//
// Member 3 (sol progression) can add air, water and food use here.

const handlers = [];

export function onEndSol(name, fn) {
  handlers.push({ name, fn });
}

// Runs every handler in order. Returns a list of short messages for the player.
// If one system has a bug, the others still run.
export function runEndSol(ctx = {}) {
  const reports = [];
  for (const h of handlers) {
    try {
      const msg = h.fn(ctx);
      if (msg) reports.push(msg);
    } catch (err) {
      console.error(`End sol step "${h.name}" failed:`, err);
      reports.push(`${h.name}: something went wrong (see console).`);
    }
  }
  return reports;
}

// Only used by tests
export function clearEndSolHandlers() {
  handlers.length = 0;
}