import { getIntervention, getPreset, interventions } from '../data/catalog'
import type {
  InterventionSensitivity,
  SensitivityPoint,
  ImpactMetrics,
  InterventionId,
  RiskState,
  Scenario,
  SimulationResult,
  SystemNodeId,
  TrajectoryPoint,
} from './types'
import { mulberry32, normalish } from './rng'
import { getPathway, sampleDelayedRisk } from './pathways'
import { assertNotAborted, normalizedBatchSize, yieldToEventLoop, type CooperativeOptions } from './cooperative'

export const RISK_KEYS: (keyof RiskState)[] = [
  'communications',
  'infrastructure',
  'displacement',
  'water',
  'food',
  'health',
  'markets',
]

interface ModelVariation {
  hazard: number
  fragility: number
  cascade: number
}

interface CoreRun {
  trajectory: TrajectoryPoint[]
  metrics: ImpactMetrics
}

const DEFAULT_VARIATION: ModelVariation = { hazard: 1, fragility: 1, cascade: 1 }

const clamp = (value: number, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value))
const round = (value: number, places = 0) => Number(value.toFixed(places))
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)

function smoothstep(value: number): number {
  const x = clamp(value, 0, 1)
  return x * x * (3 - 2 * x)
}

function percentile(values: number[], percentileValue: number): number {
  const ordered = [...values].sort((a, b) => a - b)
  const index = (ordered.length - 1) * percentileValue
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return ordered[lower] ?? 0
  const weight = index - lower
  return (ordered[lower] ?? 0) * (1 - weight) + (ordered[upper] ?? 0) * weight
}

function getAmount(scenario: Scenario, id: InterventionId): number {
  return scenario.allocations.find((allocation) => allocation.id === id)?.amount ?? 0
}

export function interventionReadiness(deployDelay: number, hour: number): number {
  return deployDelay <= 0 ? 1 : smoothstep((hour - deployDelay) / 18)
}

function allocationStrength(scenario: Scenario, id: InterventionId, hour: number): number {
  const definition = getIntervention(id)
  const amount = clamp(getAmount(scenario, id), 0, definition.maxAllocation)
  const normalized = amount / definition.maxAllocation
  const saturation = (1 - Math.exp(-3 * normalized)) / (1 - Math.exp(-3))
  const readiness = interventionReadiness(definition.deployDelay, hour)
  return clamp(saturation * readiness, 0, 1)
}

function hazardAt(scenario: Scenario, hour: number, variation: ModelVariation): number {
  const preset = getPreset(scenario.presetId)
  const intensity = scenario.hazardIntensity * variation.hazard
  if (scenario.presetId === 'urban-earthquake') {
    const mainShock = Math.exp(-Math.pow((hour - preset.peakHour) / 5.5, 2))
    const afterShock = 0.34 * Math.exp(-Math.pow((hour - 32) / 15, 2))
    return clamp(intensity * (mainShock + afterShock))
  }
  if (scenario.presetId === 'heat-water-grid') {
    const arrival = 1 / (1 + Math.exp(-(hour - 8) / 4))
    const easing = 1 - 0.18 / (1 + Math.exp(-(hour - 58) / 5))
    return clamp(intensity * arrival * easing)
  }
  const approach = 0.13 / (1 + Math.exp(-(hour - 3) / 3))
  const landfall = 0.9 * Math.exp(-Math.pow((hour - preset.peakHour) / 13, 2))
  const tail = hour > preset.peakHour ? 0.18 * Math.exp(-(hour - preset.peakHour) / 32) : 0
  return clamp(intensity * (approach + landfall + tail))
}

function protectionsAt(scenario: Scenario, hour: number): RiskState {
  const protection = Object.fromEntries(RISK_KEYS.map((key) => [key, 0])) as RiskState

  for (const definition of interventions) {
    const strength = allocationStrength(scenario, definition.id, hour)
    for (const [node, effect] of Object.entries(definition.effects) as [SystemNodeId, number][]) {
      if (node === 'hazard') continue
      protection[node] = 1 - (1 - protection[node]) * (1 - effect * strength)
    }
  }

  const warning = allocationStrength(scenario, 'early-warning', hour)
  const evacuation = allocationStrength(scenario, 'evacuation', hour)
  const clinics = allocationStrength(scenario, 'mobile-clinics', hour)
  const water = allocationStrength(scenario, 'clean-water', hour)
  const roads = allocationStrength(scenario, 'road-recovery', hour)
  const microgrids = allocationStrength(scenario, 'microgrids', hour)
  const supplies = allocationStrength(scenario, 'supply-staging', hour)

  protection.displacement = clamp(protection.displacement + warning * evacuation * 0.1, 0, 0.88)
  protection.health = clamp(protection.health + clinics * microgrids * 0.08 + clinics * water * 0.08, 0, 0.88)
  protection.food = clamp(protection.food + roads * supplies * 0.1, 0, 0.88)
  return protection
}

function systemRisk(state: RiskState): number {
  return (
    state.communications * 0.08 +
    state.infrastructure * 0.19 +
    state.displacement * 0.15 +
    state.water * 0.14 +
    state.food * 0.13 +
    state.health * 0.2 +
    state.markets * 0.11
  )
}

function emptyRisk(): RiskState {
  return {
    communications: 0,
    infrastructure: 0,
    displacement: 0,
    water: 0,
    food: 0,
    health: 0,
    markets: 0,
  }
}

function createMetrics(scenario: Scenario, trajectory: TrajectoryPoint[]): ImpactMetrics {
  const preset = getPreset(scenario.presetId)
  const afterPeak = trajectory.filter((point) => point.hour >= Math.max(6, preset.peakHour - 6))
  const riskMean = average(afterPeak.map((point) => point.systemRisk))
  const riskPeak = Math.max(...trajectory.map((point) => point.systemRisk))
  const healthNeed = average(afterPeak.map((point) => (point.health + point.water + point.food) / 3))
  const infraMarket = average(afterPeak.map((point) => point.infrastructure * 0.68 + point.markets * 0.32))
  const affectedShare = clamp(riskMean * 0.0068 + riskPeak * 0.0028, 0, 0.92)
  const affectedPeopleProxy = Math.round(preset.populationAtRisk * affectedShare)
  const scenarioLossProxy = preset.economicExposure * clamp(infraMarket / 92, 0, 1)

  const early = allocationStrength(scenario, 'early-warning', 24)
  const staging = allocationStrength(scenario, 'supply-staging', 24)
  const roads = allocationStrength(scenario, 'road-recovery', 36)
  const mobilizationHours = clamp(31 - early * 9 - staging * 5 - roads * 3, 6, 36)

  const total = scenario.allocations.reduce((sum, allocation) => sum + allocation.amount, 0)
  const shares = scenario.allocations.map((allocation) => (total > 0 ? allocation.amount / total : 0))
  const concentration = shares.reduce((sum, share) => sum + share * share, 0)
  const cash = allocationStrength(scenario, 'cash-support', 48)
  const water = allocationStrength(scenario, 'clean-water', 48)
  const warning = allocationStrength(scenario, 'early-warning', 24)
  const evacuation = allocationStrength(scenario, 'evacuation', 24)
  const inclusionProxy = clamp(38 + cash * 22 + water * 13 + warning * 12 + evacuation * 8 - Math.max(0, concentration - 0.24) * 45)
  const pressureStability = clamp(100 - riskMean * 0.62 - riskPeak * 0.22)
  const stabilityComposite = clamp(pressureStability * 0.62 + inclusionProxy * 0.2 + (100 - scenario.stress) * 0.18)

  return {
    protectionProxy: 0,
    lossProxyDelta: 0,
    unmetNeedProxy: Math.round(affectedPeopleProxy * clamp(healthNeed / 112, 0.05, 0.92)),
    mobilizationHours: round(mobilizationHours, 1),
    pressureStability: round(pressureStability, 1),
    inclusionProxy: round(inclusionProxy, 1),
    stabilityComposite: round(stabilityComposite, 1),
    scenarioLossProxy: round(scenarioLossProxy, 2),
    affectedPeopleProxy,
  }
}

function runCore(scenario: Scenario, variation: ModelVariation = DEFAULT_VARIATION): CoreRun {
  const preset = getPreset(scenario.presetId)
  const fragility = (scenario.fragility / 100) * variation.fragility
  // The first 15 points are the nominal exercise setting. Above that, one
  // shared shock degrades route access and power/communications together.
  const correlatedStress = clamp((scenario.stress - 15) / 65, 0, 1)
  const routeFailure = 1 + correlatedStress * 0.34
  const powerFailure = 1 + correlatedStress * 0.29
  const marketFailure = 1 + correlatedStress * 0.2
  let previous = emptyRisk()
  const trajectory: TrajectoryPoint[] = []

  for (let hour = 0; hour <= 72; hour += 6) {
    const hazard = hazardAt(scenario, hour, variation)
    const h = hazard / 100
    const protection = protectionsAt(scenario, hour)
    const bias = preset.biases
    const cascade = variation.cascade * (1 + correlatedStress * 0.18)

    // Access and power failures reduce the realized effect of interventions
    // that depend on roads, electricity, communications, or cold chains.
    protection.infrastructure *= 1 - correlatedStress * 0.3
    protection.communications *= 1 - correlatedStress * 0.24
    protection.food *= 1 - correlatedStress * 0.2
    protection.health *= 1 - correlatedStress * 0.14
    protection.water *= 1 - correlatedStress * 0.12

    const communications = clamp(
      (previous.communications * 0.53 + h * fragility * getPathway('hazard', 'communications').weight * 100 * bias.communications * powerFailure) *
        (1 - protection.communications * 0.76),
    )
    const infrastructure = clamp(
      (previous.infrastructure * 0.65 + h * fragility * getPathway('hazard', 'infrastructure').weight * 100 * bias.infrastructure * routeFailure) *
        (1 - protection.infrastructure * 0.7),
    )

    const delayed = (
      key: keyof RiskState,
      delay: number,
      current?: number,
    ) => sampleDelayedRisk(trajectory, key, hour - delay, current === undefined ? undefined : { hour, value: current })

    const communicationsToDisplacement = getPathway('communications', 'displacement')
    const infrastructureToDisplacement = getPathway('infrastructure', 'displacement')
    const displacement = clamp(
      (previous.displacement * 0.69 +
        delayed('infrastructure', infrastructureToDisplacement.delay, infrastructure) * infrastructureToDisplacement.weight * cascade * bias.displacement +
        delayed('communications', communicationsToDisplacement.delay, communications) * communicationsToDisplacement.weight * cascade * bias.displacement) *
        (1 - protection.displacement * 0.73),
    )

    const infrastructureToWater = getPathway('infrastructure', 'water')
    const displacementToWater = getPathway('displacement', 'water')
    const water = clamp(
      (previous.water * 0.67 +
        delayed('infrastructure', infrastructureToWater.delay, infrastructure) * infrastructureToWater.weight * cascade * powerFailure * bias.water +
        delayed('displacement', displacementToWater.delay, displacement) * displacementToWater.weight * cascade * bias.water) *
        (1 - protection.water * 0.78),
    )

    const infrastructureToMarkets = getPathway('infrastructure', 'markets')
    const displacementToMarkets = getPathway('displacement', 'markets')
    const markets = clamp(
      (previous.markets * 0.72 +
        delayed('infrastructure', infrastructureToMarkets.delay, infrastructure) * infrastructureToMarkets.weight * cascade * routeFailure * bias.markets +
        delayed('displacement', displacementToMarkets.delay, displacement) * displacementToMarkets.weight * cascade * bias.markets) *
        (1 - protection.markets * 0.7) * marketFailure,
    )

    const marketsToFood = getPathway('markets', 'food')
    const food = clamp(
      (previous.food * 0.74 + delayed('markets', marketsToFood.delay, markets) * marketsToFood.weight * cascade * routeFailure * bias.food) *
        (1 - protection.food * 0.76),
    )

    const displacementToHealth = getPathway('displacement', 'health')
    const waterToHealth = getPathway('water', 'health')
    const foodToHealth = getPathway('food', 'health')
    const health = clamp(
      (previous.health * 0.66 +
        delayed('displacement', displacementToHealth.delay, displacement) * displacementToHealth.weight * cascade * bias.health +
        delayed('water', waterToHealth.delay, water) * waterToHealth.weight * cascade * bias.health +
        delayed('food', foodToHealth.delay, food) * foodToHealth.weight * cascade * bias.health) *
        (1 - protection.health * 0.78),
    )

    previous = { communications, infrastructure, displacement, water, food, health, markets }
    trajectory.push({ hour, hazard: round(hazard, 2), ...previous, systemRisk: round(systemRisk(previous), 2) })
  }

  return { trajectory, metrics: createMetrics(scenario, trajectory) }
}

function withoutAllocations(scenario: Scenario): Scenario {
  return { ...scenario, allocations: scenario.allocations.map((allocation) => ({ ...allocation, amount: 0 })) }
}

function compareMetrics(current: ImpactMetrics, baseline: ImpactMetrics): ImpactMetrics {
  return {
    ...current,
    protectionProxy: Math.max(0, baseline.affectedPeopleProxy - current.affectedPeopleProxy),
    lossProxyDelta: round(Math.max(0, baseline.scenarioLossProxy - current.scenarioLossProxy), 2),
  }
}

function scenarioChecksum(scenario: Scenario, metrics: ImpactMetrics): string {
  const canonical = JSON.stringify({
    modelVersion: scenario.modelVersion,
    datasetVersion: scenario.datasetVersion,
    presetId: scenario.presetId,
    seed: scenario.seed,
    budget: scenario.budget,
    hazardIntensity: scenario.hazardIntensity,
    fragility: scenario.fragility,
    stress: scenario.stress,
    allocations: [...scenario.allocations].sort((a, b) => a.id.localeCompare(b.id)),
    metrics,
  })
  let hash = 0x811c9dc5
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `MRW-${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}`
}

function calculateInterventionSensitivity(scenario: Scenario, metrics: ImpactMetrics): InterventionSensitivity[] {
  const raw = scenario.allocations
    .filter((allocation) => allocation.amount > 0)
    .map((allocation) => {
      const counterfactual = {
        ...scenario,
        allocations: scenario.allocations.map((candidate) =>
          candidate.id === allocation.id ? { ...candidate, amount: 0 } : candidate,
        ),
      }
      const counterfactualMetrics = runCore(counterfactual).metrics
      const contribution =
        Math.max(0, counterfactualMetrics.affectedPeopleProxy - metrics.affectedPeopleProxy) / 1000 +
        Math.max(0, counterfactualMetrics.scenarioLossProxy - metrics.scenarioLossProxy) * 18
      return { id: allocation.id, contribution, label: getIntervention(allocation.id).shortName }
    })
    .sort((a, b) => b.contribution - a.contribution)
  const total = raw.reduce((sum, item) => sum + item.contribution, 0)
  return raw.map((item) => ({
    id: item.id,
    label: item.label,
    normalizedSensitivity: round(total > 0 ? (item.contribution / total) * 100 : 0, 1),
  }))
}

export function evaluateScenario(scenario: Scenario): { metrics: ImpactMetrics; baselineMetrics: ImpactMetrics } {
  const current = runCore(scenario)
  const baseline = runCore(withoutAllocations(scenario))
  return { metrics: compareMetrics(current.metrics, baseline.metrics), baselineMetrics: baseline.metrics }
}

interface SimulationAccumulator {
  current: CoreRun
  baseline: CoreRun
  metrics: ImpactMetrics
  random: () => number
  riskRuns: number[][]
  benefitVariationSamples: number[]
}

function createSimulationAccumulator(scenario: Scenario): SimulationAccumulator {
  const current = runCore(scenario)
  const baseline = runCore(withoutAllocations(scenario))
  return {
    current,
    baseline,
    metrics: compareMetrics(current.metrics, baseline.metrics),
    random: mulberry32(scenario.seed),
    riskRuns: [],
    benefitVariationSamples: [],
  }
}

function accumulateVariation(scenario: Scenario, accumulator: SimulationAccumulator): void {
    // One shared draw creates correlated route/power/cascade deterioration;
    // independent draws keep the envelope from collapsing to one dimension.
    const sharedShock = normalish(accumulator.random)
    const stressScale = 0.7 + (scenario.stress / 100) * 0.8
    const variation: ModelVariation = {
      hazard: clamp(1 + sharedShock * 0.1 * stressScale + normalish(accumulator.random) * 0.12, 0.45, 1.65),
      fragility: clamp(1 + sharedShock * 0.09 * stressScale + normalish(accumulator.random) * 0.09, 0.5, 1.6),
      cascade: clamp(1 + sharedShock * 0.12 * stressScale + normalish(accumulator.random) * 0.1, 0.45, 1.75),
    }
    const sample = runCore(scenario, variation)
    const sampleBaseline = runCore(withoutAllocations(scenario), variation)
    const compared = compareMetrics(sample.metrics, sampleBaseline.metrics)
    accumulator.riskRuns.push(sample.trajectory.map((point) => point.systemRisk))
    accumulator.benefitVariationSamples.push(compared.protectionProxy / 1000 + compared.lossProxyDelta * 25)
}

function finalizeSimulation(scenario: Scenario, accumulator: SimulationAccumulator): SimulationResult {
  const sensitivity: SensitivityPoint[] = accumulator.current.trajectory.map((point, pointIndex) => {
    const values = accumulator.riskRuns.map((run) => run[pointIndex] ?? point.systemRisk)
    return {
      hour: point.hour,
      p10: round(percentile(values, 0.1), 1),
      p50: round(percentile(values, 0.5), 1),
      p90: round(percentile(values, 0.9), 1),
    }
  })

  const medianBenefit = Math.max(1, percentile(accumulator.benefitVariationSamples, 0.5))
  const spread = percentile(accumulator.benefitVariationSamples, 0.9) - percentile(accumulator.benefitVariationSamples, 0.1)
  accumulator.metrics.stabilityComposite = round(clamp(accumulator.metrics.stabilityComposite - (spread / medianBenefit) * 18), 1)

  return {
    scenarioId: scenario.id,
    trajectory: accumulator.current.trajectory,
    baselineTrajectory: accumulator.baseline.trajectory,
    sensitivity,
    metrics: accumulator.metrics,
    baselineMetrics: accumulator.baseline.metrics,
    interventionSensitivity: calculateInterventionSensitivity(scenario, accumulator.metrics),
    checksum: scenarioChecksum(scenario, accumulator.metrics),
    generatedAt: new Date().toISOString(),
  }
}

export function simulateScenario(scenario: Scenario, samples = 48): SimulationResult {
  const accumulator = createSimulationAccumulator(scenario)
  const sampleCount = Math.max(8, Math.min(samples, 96))
  for (let index = 0; index < sampleCount; index += 1) accumulateVariation(scenario, accumulator)
  return finalizeSimulation(scenario, accumulator)
}

/**
 * Runs the same deterministic simulation as `simulateScenario`, but yields
 * between small variation batches so browsers and API servers remain
 * responsive. The metrics and checksum are identical to the synchronous run.
 */
export async function simulateScenarioCooperatively(
  scenario: Scenario,
  samples = 48,
  options: CooperativeOptions = {},
): Promise<SimulationResult> {
  const accumulator = createSimulationAccumulator(scenario)
  const sampleCount = Math.max(8, Math.min(samples, 96))
  const batchSize = normalizedBatchSize(options.batchSize, 4)
  const yieldControl = options.yieldControl ?? yieldToEventLoop

  assertNotAborted(options.signal)
  for (let index = 0; index < sampleCount; index += 1) {
    accumulateVariation(scenario, accumulator)
    if ((index + 1) % batchSize === 0 && index + 1 < sampleCount) {
      await yieldControl()
      assertNotAborted(options.signal)
    }
  }
  assertNotAborted(options.signal)
  return finalizeSimulation(scenario, accumulator)
}
