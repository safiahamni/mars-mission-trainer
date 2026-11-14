// STATION PANELS: HTML overlay on top of the Phaser canvas.
// Each owner adds their station with registerPanel():
//
//   import { registerPanel } from '../ui/panels.js';
//   registerPanel('greenhouse', (body, close) => { body.innerHTML = '<p>Plant crops here</p>'; });
//
// Options: { room: true } opens a full-screen room (like the Greenhouse design)
// instead of a small pop-up. Rooms draw their own header and "Back to base map" link.

import { icon } from './icons.js';

const panels = {};
let current = null;
let onCloseCb = null;

export function registerPanel(stationId, render, options = {}) {
  panels[stationId] = { render, room: !!options.room };
}

export function isPanelOpen() {
  return current !== null;
}

export function openPanel(station, onClose) {
  if (current) return;
  current = station.id;
  onCloseCb = onClose || null;

  const root = document.getElementById('panel-root');
  const p = panels[station.id];
  root.classList.add('open');

  if (p && p.room) {
    // full-screen room: the room draws everything itself
    root.innerHTML = `<div class="room" role="dialog" aria-label="${station.name}"></div>`;
    p.render(root.querySelector('.room'), closePanel);
  } else {
    root.innerHTML = `
      <div class="panel" role="dialog" aria-label="${station.name}">
        <div class="panel-head">
          <h2>${station.name}</h2>
          <button class="panel-close" aria-label="Close">${icon('close', 22)}</button>
        </div>
        <div class="panel-body"></div>
        <p class="panel-hint">Press Esc to go back to the base</p>
      </div>`;
    const body = root.querySelector('.panel-body');
    if (p) p.render(body, closePanel);
    else body.innerHTML = `<p>${icon('construction')} This station is coming soon.</p><p class="muted">Owner: ${station.owner} · ID: <code>${station.id}</code></p>`;
    root.querySelector('.panel-close').addEventListener('click', closePanel);
  }

  // let other parts of the game know a station was opened (used by the Start Hub checklist)
  window.dispatchEvent(new CustomEvent('station:open', { detail: station.id }));
}

export function closePanel() {
  if (!current) return;
  const root = document.getElementById('panel-root');
  root.classList.remove('open');
  root.innerHTML = '';
  current = null;
  if (onCloseCb) onCloseCb();
  onCloseCb = null;
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePanel();
});