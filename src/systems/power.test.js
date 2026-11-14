// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POWER_CONFIG, createPowerState, solarOutput, chargeForNewSol, canAfford, spend, powerStatus } from './power.js';

test('clear sol makes full solar power', () => {
  assert.equal(solarOutput({ dustStorm: false }), POWER_CONFIG.solarPerSol);
});

test('dust storm cuts solar power', () => {
  assert.ok(solarOutput({ dustStorm: true }) < POWER_CONFIG.solarPerSol);
});

test('charging never goes above battery capacity', () => {
  const full = { ...createPowerState(), stored: POWER_CONFIG.batteryCapacity - 5 };
  const next = chargeForNewSol(full);
  assert.equal(next.stored, POWER_CONFIG.batteryCapacity);
  assert.equal(next.wastedToday, POWER_CONFIG.solarPerSol - 5);
});

test('spending reduces stored power', () => {
  const r = spend(createPowerState(), 5, 'oxygen');
  assert.equal(r.ok, true);
  assert.equal(r.power.stored, POWER_CONFIG.startBattery - 5);
});

test('cannot overspend', () => {
  const p = { ...createPowerState(), stored: 3 };
  const r = spend(p, 5, 'oxygen');
  assert.equal(r.ok, false);
  assert.equal(r.power.stored, 3);
});

test('negative or broken costs are refused', () => {
  const p = createPowerState();
  assert.equal(canAfford(p, -2), false);
  assert.equal(canAfford(p, NaN), false);
});

test('functions do not change the original state', () => {
  const p = createPowerState();
  spend(p, 5);
  chargeForNewSol(p);
  assert.equal(p.stored, POWER_CONFIG.startBattery);
});

test('status levels', () => {
  assert.equal(powerStatus({ stored: 0 }), 'empty');
  assert.equal(powerStatus({ stored: POWER_CONFIG.lowThreshold - 1 }), 'low');
  assert.equal(powerStatus({ stored: POWER_CONFIG.lowThreshold }), 'ok');
});