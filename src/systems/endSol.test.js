import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { onEndSol, runEndSol, clearEndSolHandlers } from './endSol.js';

beforeEach(() => clearEndSolHandlers());

test('runs every handler and collects messages', () => {
  onEndSol('A', () => 'first');
  onEndSol('B', () => 'second');
  assert.deepEqual(runEndSol(), ['first', 'second']);
});

test('handlers that return nothing add no message', () => {
  onEndSol('Quiet', () => undefined);
  assert.deepEqual(runEndSol(), []);
});

test('one broken handler does not stop the others', () => {
  onEndSol('Broken', () => { throw new Error('oops'); });
  onEndSol('Fine', () => 'still ran');
  const reports = runEndSol();
  assert.equal(reports.length, 2);
  assert.equal(reports[1], 'still ran');
});