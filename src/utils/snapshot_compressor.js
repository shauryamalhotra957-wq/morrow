/**
 * Local-First Rehearsal Snapshot Delta Compressor.
 * Extracts differential changes between consecutive crisis rehearsal runs
 * to optimize IndexedDB storage footprint during offline execution.
 */
export class RehearsalSnapshotCompressor {
  static computeDelta(baseState, currentState) {
    const delta = {};

    for (const [key, val] of Object.entries(currentState)) {
      if (baseState[key] === undefined) {
        delta[key] = { action: 'ADD', value: val };
      } else if (JSON.stringify(baseState[key]) !== JSON.stringify(val)) {
        delta[key] = { action: 'UPDATE', value: val };
      }
    }

    for (const key of Object.keys(baseState)) {
      if (currentState[key] === undefined) {
        delta[key] = { action: 'REMOVE' };
      }
    }

    return delta;
  }

  static applyDelta(baseState, delta) {
    const result = { ...baseState };

    for (const [key, change] of Object.entries(delta)) {
      if (change.action === 'ADD' || change.action === 'UPDATE') {
        result[key] = change.value;
      } else if (change.action === 'REMOVE') {
        delete result[key];
      }
    }

    return result;
  }
}
