// TEMPORARY mission store (sol number + stations visited today).
// Member 2's gameState.js will replace this.

export const MISSION = { maxSols: 7 };

let sol = 1;
let visitedToday = new Set();

export function getSol() { return sol; }
export function nextSol() { sol += 1; visitedToday = new Set(); return sol; }
export function isMissionOver() { return sol > MISSION.maxSols; }

export function markVisited(stationId) { visitedToday.add(stationId); }
export function wasVisited(stationId) { return visitedToday.has(stationId); }

// Remember every station the player opens today (for the checklist)
window.addEventListener('station:open', (e) => markVisited(e.detail));