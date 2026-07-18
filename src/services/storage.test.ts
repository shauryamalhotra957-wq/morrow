import { beforeEach, describe, expect, it } from 'vitest'
import { createScenario } from '../data/catalog'
import { clearLocalData, deleteScenario, loadScenarios, saveScenario } from './storage'

describe('local scenario persistence', () => {
  beforeEach(() => localStorage.clear())

  it('saves immutable versions, deletes, and clears validated scenarios', () => {
    const scenario = createScenario()
    const first = saveScenario(scenario)
    expect(first).toHaveLength(1)
    expect(first[0]?.id).not.toBe(scenario.id)
    scenario.name = 'Updated response'
    const versions = saveScenario(scenario)
    expect(versions).toHaveLength(2)
    expect(loadScenarios()[0]?.name).toBe('Updated response')
    expect(deleteScenario(versions[0]!.id)).toHaveLength(1)
    expect(deleteScenario(versions[1]!.id)).toHaveLength(0)
    saveScenario(scenario)
    clearLocalData()
    expect(loadScenarios()).toEqual([])
  })

  it('recovers safely from corrupt and oversized records', () => {
    localStorage.setItem('morrow.saved-scenarios.v1', '{broken')
    expect(loadScenarios()).toEqual([])
    localStorage.setItem('morrow.saved-scenarios.v1', 'x'.repeat(256_001))
    expect(loadScenarios()).toEqual([])
  })
})
