import { describe, expect, it } from 'vitest'
import { createScenario } from '../data/catalog'
import { decodeScenario, encodeScenario, scenarioFromHash } from './share'

describe('scenario share codec', () => {
  it('round-trips a valid scenario without changing its decision state', () => {
    const scenario = createScenario('heat-water-grid')
    const decoded = decodeScenario(encodeScenario(scenario))
    expect(decoded).toEqual(scenario)
    expect(scenarioFromHash(`#/cockpit&s=${encodeURIComponent(encodeScenario(scenario))}`)).toEqual(scenario)
  })

  it('rejects malformed and oversized share codes', () => {
    expect(() => decodeScenario('v2.not-supported')).toThrow()
    expect(() => decodeScenario('v1.%%%')).toThrow()
    expect(() => decodeScenario(`v1.${'a'.repeat(17_000)}`)).toThrow(/16 KB/)
  })

  it('rejects unknown fields and over-budget allocations', () => {
    const scenario = createScenario()
    const invalid = { ...scenario, unexpected: true }
    const payload = btoa(JSON.stringify(invalid)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    expect(() => decodeScenario(`v1.${payload}`)).toThrow()

    scenario.allocations = scenario.allocations.map((allocation) => ({ ...allocation, amount: 8 }))
    const overBudget = btoa(JSON.stringify(scenario)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    expect(() => decodeScenario(`v1.${overBudget}`)).toThrow(/budget/)
  })

  it('rejects links from a different model or assumption-pack version', () => {
    const scenario = createScenario()
    const obsolete = { ...scenario, modelVersion: 'morrow-cascade-0.9.0' }
    const payload = btoa(JSON.stringify(obsolete)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    expect(() => decodeScenario(`v1.${payload}`)).toThrow()
  })
})
