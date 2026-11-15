// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  POWER_CONFIG, COSTS, createPowerState, spendable, shortForNight, spendPower, leverCost,
  setSwitch, nightPower, morningCharge, cleanPanels, powerStatus, isCircuitOn,
} from './power.js';

const fresh = (extra = {}) => ({ ...createPowerState(), ...extra });

test('spendable today = battery minus the 20 night reserve', () => {
  assert.equal(spendable(fresh({ battery: 55 })), 35);
  assert.equal(spendable(fresh({ battery: 15 })), 0);
  assert.equal(shortForNight(fresh({ battery: 15 })), 5);
});

test('first MOXIE run costs unlock + run (15), then 5 the next sol', () => {
  const r = setSwitch(fresh({ battery: 55 }), 'moxie', true);
  assert.equal(r.power.battery, 55 - COSTS.moxieUnlock - COSTS.moxie);
  assert.equal(r.power.moxieUnlocked, true);
  const tomorrow = morningCharge(r.power).power;
  assert.equal(leverCost(tomorrow, 'moxie'), COSTS.moxie);
});

test('a lever is only paid once per sol', () => {
  let p = setSwitch(fresh(), 'recycler', true).power;
  p = setSwitch(p, 'recycler', false).power;
  const again = setSwitch(p, 'recycler', true);
  assert.equal(again.power.battery, p.battery);
});

test('not enough power: the action fails and says how much more is needed', () => {
  const r = setSwitch(fresh({ battery: 3 }), 'recycler', true);
  assert.equal(r.ok, false);
  assert.match(r.message, /Need 2 more/);
  assert.equal(spendPower(fresh({ battery: 10 }), COSTS.shielding, 'Shielding').ok, false);
});

test('heaters cannot be switched off', () => {
  assert.equal(setSwitch(fresh(), 'heater', false).ok, false);
  assert.equal(isCircuitOn(fresh(), 'heater'), true);
});

test('night uses the reserve; below it the crew gets cold', () => {
  assert.deepEqual(nightPower(fresh({ battery: 35 })), { power: fresh({ battery: 15 }), cold: false });
  const cold = nightPower(fresh({ battery: 10 }));
  assert.equal(cold.cold, true);
  assert.equal(cold.power.battery, 0);
});

test('morning charge: +55 clean, +20 dusty, +5 in a dust storm, never above 100', () => {
  assert.equal(morningCharge(fresh({ battery: 30 })).power.battery, 85);
  assert.equal(morningCharge(fresh({ battery: 30, panels: 'dusty' })).power.battery, 50);
  const storm = morningCharge(fresh({ battery: 30 }), { dustStorm: true });
  assert.equal(storm.power.battery, 35);
  assert.equal(storm.power.panels, 'dusty');
  assert.equal(morningCharge(fresh({ battery: 90 })).power.battery, POWER_CONFIG.max);
  assert.equal(morningCharge(cleanPanels(fresh({ battery: 0, panels: 'dusty' }))).gained, POWER_CONFIG.solar.clean);
});

test('morning switches per-sol systems off so the crew plans again', () => {
  let p = setSwitch(fresh(), 'recycler', true).power;
  p = morningCharge(p).power;
  assert.equal(p.switches.recycler, false);
  assert.equal(p.switches.lab, true);
});

test('functions do not change the original state', () => {
  const p = fresh();
  setSwitch(p, 'moxie', true); nightPower(p); morningCharge(p); spendPower(p, 5);
  assert.deepEqual(p, fresh());
});

test('status levels', () => {
  assert.equal(powerStatus({ battery: 0 }), 'empty');
  assert.equal(powerStatus({ battery: POWER_CONFIG.nightReserve - 1 }), 'low');
  assert.equal(powerStatus({ battery: POWER_CONFIG.nightReserve }), 'ok');
});