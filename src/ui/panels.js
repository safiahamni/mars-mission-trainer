// STATION PANELS: HTML overlay on top of the Phaser canvas.
// Placeholder shell; Member 2 styles the real one.
// Each owner adds their panel content with registerPanel():
//
//   import { registerPanel } from '../ui/panels.js';
//   registerPanel('greenhouse', (body) => { body.innerHTML = '<p>Plant crops here</p>'; });

const renderers = {};
let current = null;
let onCloseCb = null;

export function registerPanel(stationId, render) {
  renderers[stationId] = render;
}

export function isPanelOpen() {
  return current !== null;
}

export function openPanel(station, onClose) {
  if (current) return;
  current = station.id;
  onCloseCb = onClose || null;

  const root = document.getElementById('panel-root');
  root.innerHTML = `
    <div class="panel" role="dialog" aria-label="${station.name}">
      <div class="panel-head">
        <h2>${station.name}</h2>
        <button class="panel-close" aria-label="Close">✕</button>
      </div>
      <div class="panel-body"></div>
      <p class="panel-hint">Press Esc to go back to the base</p>
    </div>`;
  root.classList.add('open');

  const body = root.querySelector('.panel-body');
  if (renderers[station.id]) renderers[station.id](body);
  else body.innerHTML = `<p>🚧 This station is coming soon.</p><p class="muted">Owner: ${station.owner} · ID: <code>${station.id}</code></p>`;

  root.querySelector('.panel-close').addEventListener('click', closePanel);
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