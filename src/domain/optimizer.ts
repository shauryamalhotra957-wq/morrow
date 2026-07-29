import { getIntervention, interventions } from '../data/catalog'
import { evaluateScenario, simulateScenario, simulateScenarioCooperatively } from './simulator'
import { mulberry32 } from './rng'
import { assertNotAborted, normalizedBatchSize, yieldToEventLoop, type CooperativeOptions } from './cooperative'
import type { ImpactMetrics, InterventionAllocation, OptimizerObjective, PortfolioOption, Scenario } from './types'

const objectives: OptimizerObjective[] = ['balanced', 'early-action', 'vulnerability-intent', 'stability']
const DEFAULT_CANDIDATE_COUNT = 160
const WINNER_VARIATION_SAMPLES = 48

interface ScreenedWinner {
  index: number
  allocations: InterventionAllocation[]
  screeningScore: number
}

export interface PortfolioSearchDiagnostics {
  screenedCandidates: number
  fullSimulations: number
  variationSamplesPerWinner: number
  method: 'two-stage-seeded-search'
}

export interface PortfolioSearchResult {
  portfolios: PortfolioOption[]
  diagnostics: PortfolioSearchDiagnostics
}

function allocateBudget(scenario: Scenario, random: () => number, biasIndex: number): InterventionAllocation[] {
  const weights = interventions.map((_, index) => {
    const bias = index === biasIndex ? 1.7 : 1
    return (0.12 + random() ** 1.7) * bias
  })
  const allocations = interventions.map((definition, index) => ({
    id: definition.id,
    amount: 0,
    weight: weights[index] ?? 0,
  }))
  let remaining = scenario.budget

  for (let pass = 0; pass < 4 && remaining > 0.01; pass += 1) {
    const eligible = allocations.filter((item) => item.amount < getIntervention(item.id).maxAllocation - 0.01)
    const weightTotal = eligible.reduce((sum, item) => sum + item.weight, 0)
    if (weightTotal <= 0) break
    for (const item of eligible) {
      const definition = getIntervention(item.id)
      const share = remaining * (item.weight / weightTotal)
      const addition = Math.min(share, definition.maxAllocation - item.amount)
      item.amount += addition
    }
    remaining = scenario.budget - allocations.reduce((sum, item) => sum + item.amount, 0)
  }

  const rounded = allocations.map(({ id, amount }) => ({ id, amount: Number(amount.toFixed(2)) }))
  const roundedTotal = rounded.reduce((sum, allocation) => sum + allocation.amount, 0)
  const correction = Number((scenario.budget - roundedTotal).toFixed(2))
  if (Math.abs(correction) >= 0.01) {
    const target = rounded.find((allocation) =>
      correction > 0 ? allocation.amount + correction <= getIntervention(allocation.id).maxAllocation : allocation.amount + correction >= 0,
    )
    if (target) target.amount = Number((target.amount + correction).toFixed(2))
  }
  return rounded
}

export function scorePortfolio(metrics: PortfolioOption['metrics'], objective: OptimizerObjective): number {
  const protectionScore = metrics.protectionProxy / 12_000
  const lossScore = metrics.lossProxyDelta * 6
  if (objective === 'early-action') return protectionScore * 0.45 + (36 - metrics.mobilizationHours) * 2.4 + lossScore * 0.15
  if (objective === 'vulnerability-intent') return metrics.inclusionProxy * 1.2 + protectionScore * 0.34 + metrics.pressureStability * 0.2
  if (objective === 'stability') return metrics.stabilityComposite * 1.12 + metrics.pressureStability * 0.55 + protectionScore * 0.25
  return protectionScore * 0.42 + lossScore * 0.24 + metrics.inclusionProxy * 0.18 + metrics.stabilityComposite * 0.28
}

function candidateCount(candidates: number): number {
  return Math.max(40, Math.min(Math.trunc(candidates), 320))
}

function labelForObjective(objective: OptimizerObjective): string {
  if (objective === 'balanced') return 'Balanced objective'
  if (objective === 'early-action') return 'Early-action objective'
  if (objective === 'vulnerability-intent') return 'Vulnerability-intent objective'
  return 'Stability-proxy objective'
}

function screenCandidate(
  best: Map<OptimizerObjective, ScreenedWinner>,
  index: number,
  allocations: InterventionAllocation[],
  metrics: ImpactMetrics,
): void {
  for (const objective of objectives) {
    const screeningScore = scorePortfolio(metrics, objective)
    const incumbent = best.get(objective)
    if (!incumbent || screeningScore > incumbent.screeningScore) {
      best.set(objective, { index, allocations, screeningScore })
    }
  }
}

function portfolioFromWinner(objective: OptimizerObjective, winner: ScreenedWinner, metrics: ImpactMetrics): PortfolioOption {
  return {
    id: `${objective}-${winner.index}`,
    label: labelForObjective(objective),
    objective,
    allocations: winner.allocations,
    metrics,
    score: Number(scorePortfolio(metrics, objective).toFixed(2)),
  }
}

function searchDiagnostics(screenedCandidates: number, fullSimulations: number): PortfolioSearchDiagnostics {
  return {
    screenedCandidates,
    fullSimulations,
    variationSamplesPerWinner: WINNER_VARIATION_SAMPLES,
    method: 'two-stage-seeded-search',
  }
}

export function optimizePortfoliosWithDiagnostics(
  scenario: Scenario,
  candidates = DEFAULT_CANDIDATE_COUNT,
): PortfolioSearchResult {
  const random = mulberry32(scenario.seed ^ 0x9e3779b9)
  const best = new Map<OptimizerObjective, ScreenedWinner>()
  const screenedCandidates = candidateCount(candidates)

  for (let index = 0; index < screenedCandidates; index += 1) {
    const allocations = allocateBudget(scenario, random, index % interventions.length)
    const candidateScenario = { ...scenario, allocations }
    screenCandidate(best, index, allocations, evaluateScenario(candidateScenario).metrics)
  }

  const fullMetrics = new Map<number, ImpactMetrics>()
  const portfolios = objectives.flatMap((objective) => {
    const winner = best.get(objective)
    if (!winner) return []
    let metrics = fullMetrics.get(winner.index)
    if (!metrics) {
      metrics = simulateScenario({ ...scenario, allocations: winner.allocations }, WINNER_VARIATION_SAMPLES).metrics
      fullMetrics.set(winner.index, metrics)
    }
    return [portfolioFromWinner(objective, winner, metrics)]
  })

  return { portfolios, diagnostics: searchDiagnostics(screenedCandidates, fullMetrics.size) }
}

export function optimizePortfolios(scenario: Scenario, candidates = DEFAULT_CANDIDATE_COUNT): PortfolioOption[] {
  return optimizePortfoliosWithDiagnostics(scenario, candidates).portfolios
}

export async function optimizePortfoliosCooperatively(
  scenario: Scenario,
  candidates = DEFAULT_CANDIDATE_COUNT,
  options: CooperativeOptions = {},
): Promise<PortfolioSearchResult> {
  const random = mulberry32(scenario.seed ^ 0x9e3779b9)
  const best = new Map<OptimizerObjective, ScreenedWinner>()
  const screenedCandidates = candidateCount(candidates)
  const batchSize = normalizedBatchSize(options.batchSize, 8)
  const yieldControl = options.yieldControl ?? yieldToEventLoop

  assertNotAborted(options.signal)
  for (let index = 0; index < screenedCandidates; index += 1) {
    const allocations = allocateBudget(scenario, random, index % interventions.length)
    const candidateScenario = { ...scenario, allocations }
    screenCandidate(best, index, allocations, evaluateScenario(candidateScenario).metrics)
    if ((index + 1) % batchSize === 0 && index + 1 < screenedCandidates) {
      await yieldControl()
      assertNotAborted(options.signal)
    }
  }

  const fullMetrics = new Map<number, ImpactMetrics>()
  const portfolios: PortfolioOption[] = []
  const simulationOptions: CooperativeOptions = {
    batchSize: 4,
    yieldControl,
    ...(options.signal ? { signal: options.signal } : {}),
  }
  for (const objective of objectives) {
    const winner = best.get(objective)
    if (!winner) continue
    let metrics = fullMetrics.get(winner.index)
    if (!metrics) {
      await yieldControl()
      assertNotAborted(options.signal)
      metrics = (
        await simulateScenarioCooperatively(
          { ...scenario, allocations: winner.allocations },
          WINNER_VARIATION_SAMPLES,
          simulationOptions,
        )
      ).metrics
      fullMetrics.set(winner.index, metrics)
    }
    portfolios.push(portfolioFromWinner(objective, winner, metrics))
  }

  assertNotAborted(options.signal)
  return { portfolios, diagnostics: searchDiagnostics(screenedCandidates, fullMetrics.size) }
}
