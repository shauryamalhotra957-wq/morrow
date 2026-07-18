import { describe, expect, it } from 'vitest'
import { createScenario, getIntervention } from '../data/catalog'
import {
  optimizePortfolios,
  optimizePortfoliosCooperatively,
  optimizePortfoliosWithDiagnostics,
  scorePortfolio,
} from './optimizer'

describe('portfolio optimizer', () => {
  it('returns one reproducible candidate per explicit objective', () => {
    const scenario = createScenario()
    const first = optimizePortfolios(scenario, 50)
    const second = optimizePortfolios(scenario, 50)
    expect(first).toEqual(second)
    expect(first.map((item) => item.objective)).toEqual(['balanced', 'early-action', 'vulnerability-intent', 'stability'])
  })

  it('respects budget and per-intervention allocation caps', () => {
    const scenario = createScenario()
    for (const portfolio of optimizePortfolios(scenario, 50)) {
      const spent = portfolio.allocations.reduce((sum, allocation) => sum + allocation.amount, 0)
      expect(spent).toBeLessThanOrEqual(scenario.budget + 0.02)
      expect(spent).toBeGreaterThan(scenario.budget - 0.2)
      for (const allocation of portfolio.allocations) {
        expect(allocation.amount).toBeGreaterThanOrEqual(0)
        expect(allocation.amount).toBeLessThanOrEqual(getIntervention(allocation.id).maxAllocation)
      }
    }
  })

  it('returns visible scores computed from each winner’s full sensitivity metrics', () => {
    const scenario = createScenario('heat-water-grid')
    for (const portfolio of optimizePortfolios(scenario, 40)) {
      expect(portfolio.score).toBe(Number(scorePortfolio(portfolio.metrics, portfolio.objective).toFixed(2)))
    }
  })

  it('screens every candidate but runs the full variation model at most once per objective winner', () => {
    const { portfolios, diagnostics } = optimizePortfoliosWithDiagnostics(createScenario(), 160)
    expect(portfolios).toHaveLength(4)
    expect(diagnostics).toEqual({
      screenedCandidates: 160,
      fullSimulations: expect.any(Number),
      variationSamplesPerWinner: 48,
      method: 'two-stage-seeded-search',
    })
    expect(diagnostics.fullSimulations).toBeGreaterThan(0)
    expect(diagnostics.fullSimulations).toBeLessThanOrEqual(4)
  })

  it('cooperatively yields without changing the deterministic search result', async () => {
    const scenario = createScenario('urban-earthquake')
    let yields = 0
    const cooperative = await optimizePortfoliosCooperatively(scenario, 40, {
      batchSize: 5,
      yieldControl: async () => { yields += 1 },
    })
    expect(cooperative.portfolios).toEqual(optimizePortfolios(scenario, 40))
    expect(yields).toBeGreaterThanOrEqual(8)
  })

  it('can be cancelled at a cooperative yield boundary', async () => {
    const controller = new AbortController()
    const search = optimizePortfoliosCooperatively(createScenario(), 160, {
      batchSize: 4,
      signal: controller.signal,
      yieldControl: async () => { controller.abort() },
    })
    await expect(search).rejects.toMatchObject({ name: 'AbortError' })
  })
})
