import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { createScenario, getIntervention } from '../data/catalog'
import { evaluateScenario, simulateScenario, simulateScenarioCooperatively } from './simulator'

describe('Morrow cascade engine', () => {
  it('is deterministic for the same scenario and seed', () => {
    const scenario = createScenario()
    const first = simulateScenario(scenario, 16)
    const second = simulateScenario(scenario, 16)
    expect(second.checksum).toBe(first.checksum)
    expect(second.trajectory).toEqual(first.trajectory)
    expect(second.sensitivity).toEqual(first.sensitivity)
    expect(second.metrics).toEqual(first.metrics)
  })

  it('produces identical modeled outputs when run cooperatively', async () => {
    const scenario = createScenario('heat-water-grid')
    const synchronous = simulateScenario(scenario, 16)
    let yields = 0
    const cooperative = await simulateScenarioCooperatively(scenario, 16, {
      batchSize: 3,
      yieldControl: async () => { yields += 1 },
    })
    expect(cooperative.checksum).toBe(synchronous.checksum)
    expect(cooperative.metrics).toEqual(synchronous.metrics)
    expect(cooperative.trajectory).toEqual(synchronous.trajectory)
    expect(cooperative.sensitivity).toEqual(synchronous.sensitivity)
    expect(yields).toBeGreaterThan(0)
  })

  it('keeps every risk and sensitivity percentile inside documented bounds', () => {
    const result = simulateScenario(createScenario('urban-earthquake'), 24)
    for (const point of result.trajectory) {
      for (const value of Object.values(point)) {
        expect(Number.isFinite(value)).toBe(true)
      }
      expect(point.systemRisk).toBeGreaterThanOrEqual(0)
      expect(point.systemRisk).toBeLessThanOrEqual(100)
    }
    for (const point of result.sensitivity) {
      expect(point.p10).toBeLessThanOrEqual(point.p50)
      expect(point.p50).toBeLessThanOrEqual(point.p90)
      expect(point.p10).toBeGreaterThanOrEqual(0)
      expect(point.p90).toBeLessThanOrEqual(100)
    }
  })

  it('never reports protection for the no-action portfolio', () => {
    const scenario = createScenario()
    scenario.allocations = scenario.allocations.map((allocation) => ({ ...allocation, amount: 0 }))
    const result = simulateScenario(scenario, 8)
    expect(result.metrics.protectionProxy).toBe(0)
    expect(result.metrics.lossProxyDelta).toBe(0)
  })

  it('improves modeled outcomes when a fully funded portfolio is feasible', () => {
    const scenario = createScenario()
    scenario.budget = 80
    scenario.allocations = scenario.allocations.map((allocation) => ({
      ...allocation,
      amount: getIntervention(allocation.id).maxAllocation,
    }))
    const { metrics, baselineMetrics } = evaluateScenario(scenario)
    expect(metrics.affectedPeopleProxy).toBeLessThan(baselineMetrics.affectedPeopleProxy)
    expect(metrics.scenarioLossProxy).toBeLessThan(baselineMetrics.scenarioLossProxy)
    expect(metrics.protectionProxy).toBeGreaterThan(0)
    expect(metrics.lossProxyDelta).toBeGreaterThan(0)
  })

  it('satisfies numeric invariants across generated valid model controls', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('coastal-cyclone', 'heat-water-grid', 'urban-earthquake'),
        fc.integer({ min: 20, max: 100 }),
        fc.integer({ min: 10, max: 100 }),
        fc.integer({ min: 15, max: 80 }),
        fc.integer({ min: 0, max: 0xffffffff }),
        (preset, hazard, fragility, stress, seed) => {
          const scenario = createScenario(preset)
          scenario.hazardIntensity = hazard
          scenario.fragility = fragility
          scenario.stress = stress
          scenario.seed = seed
          const result = simulateScenario(scenario, 8)
          expect(result.trajectory).toHaveLength(13)
          expect(result.metrics.protectionProxy).toBeGreaterThanOrEqual(0)
          expect(result.metrics.lossProxyDelta).toBeGreaterThanOrEqual(0)
          expect(result.metrics.pressureStability).toBeGreaterThanOrEqual(0)
          expect(result.metrics.pressureStability).toBeLessThanOrEqual(100)
        },
      ),
      { numRuns: 35 },
    )
  })
})
