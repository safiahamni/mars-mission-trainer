// POWER STATION panel (Member 1)
import { registerPanel } from '../panels.js';
import { icon } from '../icons.js';
import { STATION_IDS } from '../../config/stations.js';
import { chargeForNewSol, spend, canAfford, powerStatus, solarOutput, SOLAR_FACT } from '../../systems/power.js';
import { getPower, setPower, isDustStorm, setDustStorm } from '../../state/powerTempStore.js';

registerPanel(STATION_IDS.POWER, (body) => {
  let message = '';

  function render() {
    const p = getPower();
    const status = powerStatus(p);
    const pct = Math.round((p.stored / p.capacity) * 100);
    const solarToday = solarOutput({ dustStorm: isDustStorm() });
    const batteryIcon = status === 'ok' ? 'battery-full' : status === 'low' ? 'battery-low' : 'battery-warning';

    body.innerHTML = `
      <div class="power-grid">
        <div class="power-card">
          <div class="power-label">${icon('sun', 18)} Solar panels make</div>
          <div class="power-big">${solarToday} ${icon('zap', 24)} <small>per sol</small></div>
          ${isDustStorm() ? `<div class="power-warn">${icon('tornado', 16)} Dust storm! Less sunlight reaches the panels.</div>` : ''}
        </div>
        <div class="power-card">
          <div class="power-label">${icon(batteryIcon, 18)} Battery</div>
          <div class="power-big">${p.stored} / ${p.capacity} ${icon('zap', 24)}</div>
          <div class="power-bar"><i class="${status}" style="width:${pct}%"></i></div>
          ${status === 'low' ? `<div class="power-warn">${icon('alert', 16)} Power is low! Save energy for life support.</div>` : ''}
          ${status === 'empty' ? `<div class="power-warn">${icon('alert', 16)} Battery empty! Machines will stop.</div>` : ''}
        </div>
      </div>

      <p class="power-msg">${message}</p>

      <div class="power-actions">
        <button data-act="spend" ${canAfford(p, 5) ? '' : 'disabled'}>${icon('zap', 18)} Run a machine (−5)</button>
        <button data-act="sol">${icon('sun', 18)} Next sol (charge)</button>
        <button data-act="dust">${icon('tornado', 18)} ${isDustStorm() ? 'End dust storm' : 'Start dust storm'}</button>
      </div>
      <p class="muted">Test buttons: other stations will spend power through power.js.</p>

      <details class="power-fact"><summary>${icon('lightbulb', 18)} Why is power hard on Mars?</summary><p>${SOLAR_FACT}</p></details>
    `;

    body.querySelector('[data-act="spend"]').onclick = () => {
      const r = spend(getPower(), 5, 'a machine');
      if (r.ok) setPower(r.power);
      message = r.message;
      render();
    };
    body.querySelector('[data-act="sol"]').onclick = () => {
      const next = chargeForNewSol(getPower(), { dustStorm: isDustStorm() });
      setPower(next);
      message = `The panels made ${next.producedToday} power.` + (next.wastedToday ? ` ${next.wastedToday} was wasted because the battery was full.` : '');
      render();
    };
    body.querySelector('[data-act="dust"]').onclick = () => {
      setDustStorm(!isDustStorm());
      message = '';
      render();
    };
  }

  render();
});