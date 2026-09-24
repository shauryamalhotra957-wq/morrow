import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RehearsalSnapshotCompressor } from '../src/utils/snapshot_compressor.js';

describe('RehearsalSnapshotCompressor Test Suite', () => {
  test('computes differential delta correctly', () => {
    const base = { step: 1, fuel: 100, status: 'STABLE' };
    const current = { step: 2, fuel: 85, status: 'STABLE', alert: 'LOW_RESERVE' };

    const delta = RehearsalSnapshotCompressor.computeDelta(base, current);
    assert.deepStrictEqual(delta.step, { action: 'UPDATE', value: 2 });
    assert.deepStrictEqual(delta.fuel, { action: 'UPDATE', value: 85 });
    assert.deepStrictEqual(delta.alert, { action: 'ADD', value: 'LOW_RESERVE' });
    assert.strictEqual(delta.status, undefined); // Unchanged
  });

  test('reconstructs target state from base + delta', () => {
    const base = { step: 1, fuel: 100 };
    const current = { step: 2, fuel: 70, evacuated: true };

    const delta = RehearsalSnapshotCompressor.computeDelta(base, current);
    const restored = RehearsalSnapshotCompressor.applyDelta(base, delta);
    assert.deepStrictEqual(restored, current);
  });
});
