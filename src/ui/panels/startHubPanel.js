// START HUB (Mission Control) panel (Member 1)
// Shows the sol, today's checklist, a quick status, and the End Sol button.
import { registerPanel } from '../panels.js';
import { icon } from '../icons.js';
import { STATION_IDS } from '../../config/stations.js';
import { chargeForNewSol, powerStatus } from '../../systems/power.js';
import { onEndSol, runEndSol } from '../../systems/endSol.js';
import { getPower, setPower, isDustStorm } from '../../state/powerTempStore.js';
import { MISSION, getSol, nextSol, isMissionOver, wasVisited } from '../../state/missionTempStore.js';

// Placeholder checklist. Member 5 will replace this with the real daily missions.
// A task is done when the player opens that station today.
const PLACEHOLDER_TASKS = [
  { station: STATION_IDS.POWER, label: 'Check the battery at the Power Station' },
  { station: STATION_IDS.LIFE_SUPPORT, label: 'Make sure Life Support is running' },
  { station: STATION_IDS.GREENHOUSE, label: 'Check on the crops in the Greenhouse' },
  { station: STATION_IDS.SCIENCE_LAB, label: 'Do an experiment in the Science Lab' },
];

// Power recharges at the end of every sol.
// (Later, Member 2's gameController can own this step.)
onEndSol('Power', () => {
  const next = chargeForNewSol(getPower(), { dustStorm: isDustStorm() });
  setPower(next);
  let msg = `Solar panels made ${next.producedToday} power.`;
  if (next.wastedToday) msg += ` ${next.wastedToday} was wasted because the battery was full.`;
  return msg;
});

registerPanel(STATION_IDS.HUB, (body) => {
  let reports = [];

  function render() {
    const sol = getSol();
    const p = getPower();

    if (isMissionOver()) {
      body.innerHTML = `
        <div class="hub-done">
          <div class="hub-big">${icon('satellite', 40)}</div>
          <h3>Mission complete!</h3>
          <p>Your crew lasted all ${MISSION.maxSols} sols on Mars.</p>
          <p class="muted">Final transmission to Earth: coming soon (Member 3).</p>
        </div>`;
      return;
    }

    const dots = Array.from({ length: MISSION.maxSols }, (_, i) =>
      `<span class="hub-dot ${i + 1 < sol ? 'past' : i + 1 === sol ? 'now' : ''}"></span>`).join('');

    const tasks = PLACEHOLDER_TASKS.map((t) => {
      const done = wasVisited(t.station);
      return `<li class="${done ? 'done' : ''}">${icon(done ? 'check' : 'circle', 20)} ${t.label}</li>`;
    }).join('');

    body.innerHTML = `
      <div class="hub-sol">
        <div>${icon('flag', 20)} <strong>Sol ${sol}</strong> of ${MISSION.maxSols}</div>
        <div class="hub-dots">${dots}</div>
      </div>

      ${reports.length ? `<div class="hub-report">${icon('sun', 18)} <div>${reports.map((r) => `<p>${r}</p>`).join('')}</div></div>` : ''}

      <h3 class="hub-h">${icon('clipboard', 20)} Today's tasks</h3>
      <ul class="hub-tasks">${tasks}</ul>

      <h3 class="hub-h">Base status</h3>
      <div class="hub-status">
        <div class="hub-stat ${powerStatus(p)}">${icon('zap', 18)} Power <strong>${p.stored}/${p.capacity}</strong></div>
        <div class="hub-stat soon">${icon('wind', 18)} Oxygen <small>soon</small></div>
        <div class="hub-stat soon">${icon('droplet', 18)} Water <small>soon</small></div>
        <div class="hub-stat soon">${icon('carrot', 18)} Food <small>soon</small></div>
      </div>

      <button class="hub-end" data-act="end">${icon('moon', 22)} End Sol ${sol}</button>
      <p class="muted">Ending the sol recharges the battery. Later it will also use up air, water and food.</p>
    `;

    body.querySelector('[data-act="end"]').onclick = () => {
      reports = runEndSol({ sol });
      nextSol();
      render();
    };
  }

  render();
});