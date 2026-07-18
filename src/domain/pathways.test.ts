import { describe, expect, it } from 'vitest'
import { createScenario } from '../data/catalog'
import { interventionReadiness, simulateScenario } from './simulator'
import { sampleDelayedRisk } from './pathways'
import type { TrajectoryPoint } from './types'

function point(hour: number, infrastructure: number): TrajectoryPoint {
  return {
    hour,
    hazard: 0,
    systemRisk: 0,
    communications: 0,
    infrastructure,
    displacement: 0,
    water: 0,
    food: 0,
    health: 0,
    markets: 0,
  }
}

describe('declared cascade delays', () => {
  it('does not let a value arrive before its lag and interpolates between ticks', () => {
    const history = [point(0, 0), point(6, 60)]
    expect(sampleDelayedRisk(history, 'infrastructure', -1)).toBe(0)
    expect(sampleDelayedRisk(history, 'infrastructure', 3)).toBe(30)
    expect(sampleDelayedRisk([point(0, 0)], 'infrastructure', 3, { hour: 6, value: 60 })).toBe(30)
  })

  it('keeps downstream health pressure at zero before the first complete pathway can arrive', () => {
    const scenario = createScenario('urban-earthquake')
    scenario.allocations = scenario.allocations.map((allocation) => ({ ...allocation, amount: 0 }))
    const result = simulateScenario(scenario, 8)
    expect(result.trajectory.find((entry) => entry.hour === 0)?.health).toBe(0)
    expect(result.trajectory.find((entry) => entry.hour === 6)?.health).toBe(0)
    expect(result.trajectory.find((entry) => entry.hour === 12)?.health).toBeGreaterThan(0)
  })

  it('makes red-team stress visibly degrade the named access and power nodes', () => {
    const nominal = createScenario('coastal-cyclone')
    nominal.stress = 15
    const stressed = { ...nominal, stress: 68 }
    const nominalResult = simulateScenario(nominal, 16)
    const stressedResult = simulateScenario(stressed, 16)
    const nominalPeak = nominalResult.trajectory.find((entry) => entry.hour === 24)!
    const stressedPeak = stressedResult.trajectory.find((entry) => entry.hour === 24)!
    expect(stressedPeak.infrastructure).toBeGreaterThan(nominalPeak.infrastructure)
    expect(stressedPeak.communications).toBeGreaterThan(nominalPeak.communications)
    expect(stressedResult.metrics.stabilityComposite).toBeLessThan(nominalResult.metrics.stabilityComposite)
  })

  it('pins immediate and delayed intervention-readiness semantics', () => {
    expect(interventionReadiness(0, 0)).toBe(1)
    expect(interventionReadiness(6, 5)).toBe(0)
    expect(interventionReadiness(6, 6)).toBe(0)
    expect(interventionReadiness(6, 15)).toBeCloseTo(0.5)
    expect(interventionReadiness(6, 24)).toBe(1)
  })
})
