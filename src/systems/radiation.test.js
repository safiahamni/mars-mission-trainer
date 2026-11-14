// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RAD_CONFIG, ROUTES, hazardRate, addHazard, routeRate, routeTotal, inCanyon, hazardLevel } from './radiation.js';

test('outside: base rate, doubled in a solar storm, 10% less in cliff shade', () => {
  assert.equal(hazardRate({ where: 'outside' }), 1);
  assert.equal(hazardRate({ where: 'outside', storm: true }), 2);
  assert.equal(hazardRate({ where: 'outside', storm: true, shaded: true }), 1.8);
});

test('buildings are safe on a calm day', () => {
  assert.equal(hazardRate({ where: 'room' }), 0);
  assert.equal(hazardRate({ where: 'core' }), 0);
  assert.equal(hazardRate({ where: 'lab', storm: true }), 0);
});

test('in a storm the shelter core beats the room, and every water tank helps', () => {
  const room = hazardRate({ where: 'room', storm: true });
  const rates = [0, 1, 2, 3].map((tanks) => hazardRate({ where: 'core', storm: true, tanks }));
  assert.ok(rates[0] < room);
  for (let i = 1; i < rates.length; i++) assert.ok(rates[i] < rates[i - 1]);
  assert.equal(rates[3], 0.1);
});

test('route cards: cliff route is longer but takes less radiation', () => {
  assert.equal(routeTotal(ROUTES.open, false), 10);
  assert.equal(routeTotal(ROUTES.cliff, false), 9.9);
  assert.equal(routeTotal(ROUTES.open, true), 20);
  assert.equal(routeTotal(ROUTES.cliff, true), 19.8);
  assert.equal(routeRate(ROUTES.cliff, true), 1.8);
});

test('hazard meter never goes past 0 or 100', () => {
  assert.equal(addHazard(99, 2, 5), RAD_CONFIG.max);
  assert.equal(addHazard(10, 1.5, 2), 13);
});

test('canyon check', () => {
  const canyon = [[0, 0], [100, 0]];
  assert.equal(inCanyon(50, 10, canyon), true);
  assert.equal(inCanyon(50, 40, canyon), false);
});

test('hazard colours', () => {
  assert.equal(hazardLevel(10), 'safe');
  assert.equal(hazardLevel(60), 'careful');
  assert.equal(hazardLevel(90), 'danger');
});