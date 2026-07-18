import { afterEach, describe, expect, it } from 'vitest'
import { createScenario, DATASET_VERSION, MODEL_VERSION } from '../src/data/catalog'
import type { ContextEventsLoader } from './context-events'
import { buildServer } from './app'

const openServers: Awaited<ReturnType<typeof buildServer>>[] = []

async function testServer(contextEventsLoader?: ContextEventsLoader) {
  const app = await buildServer(contextEventsLoader ? { contextEventsLoader } : {})
  openServers.push(app)
  return app
}

afterEach(async () => {
  await Promise.all(openServers.splice(0).map((app) => app.close()))
})

describe('Morrow API', () => {
  it('reports health and hardened response headers without exposing a framework banner', async () => {
    const app = await testServer()
    const response = await app.inject({ method: 'GET', url: '/api/health' })
    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body).toMatchObject({ status: 'ok', modelVersion: MODEL_VERSION, datasetVersion: DATASET_VERSION })
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('DENY')
    expect(response.headers['x-request-id']).toBeTruthy()
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('lists every built-in scenario with current version metadata', async () => {
    const app = await testServer()
    const response = await app.inject({ method: 'GET', url: '/api/scenarios' })
    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.scenarios).toHaveLength(3)
    expect(body.scenarios.map((scenario: { id: string }) => scenario.id)).toEqual([
      'coastal-cyclone',
      'heat-water-grid',
      'urban-earthquake',
    ])
    expect(response.headers['cache-control']).toContain('max-age=3600')
  })

  it('simulates deterministically and returns a checksum header', async () => {
    const app = await testServer()
    const payload = { scenario: createScenario('heat-water-grid'), samples: 16 }
    const first = await app.inject({ method: 'POST', url: '/api/simulate', payload })
    const second = await app.inject({ method: 'POST', url: '/api/simulate', payload })
    const firstBody = first.json()
    const secondBody = second.json()

    expect(first.statusCode).toBe(200)
    expect(firstBody.result.checksum).toBe(secondBody.result.checksum)
    expect(firstBody.result.trajectory).toEqual(secondBody.result.trajectory)
    expect(first.headers['x-morrow-checksum']).toBe(firstBody.result.checksum)
    expect(first.headers['x-ratelimit-limit']).toBe('30')
  })

  it('rejects invalid allocations and stale model versions', async () => {
    const app = await testServer()
    const overBudget = createScenario()
    overBudget.allocations = overBudget.allocations.map((allocation) => ({ ...allocation, amount: 8 }))
    const invalidResponse = await app.inject({
      method: 'POST',
      url: '/api/simulate',
      payload: { scenario: overBudget },
    })
    expect(invalidResponse.statusCode).toBe(400)
    expect(invalidResponse.json().error.code).toBe('INVALID_REQUEST')

    const stale = createScenario()
    stale.modelVersion = 'morrow-cascade-0.9.0'
    const staleResponse = await app.inject({
      method: 'POST',
      url: '/api/simulate',
      payload: { scenario: stale },
    })
    expect(staleResponse.statusCode).toBe(409)
    expect(staleResponse.json().error.code).toBe('MODEL_VERSION_MISMATCH')
  })

  it('returns four bounded optimizer portfolios', async () => {
    const app = await testServer()
    const scenario = createScenario('urban-earthquake')
    const response = await app.inject({
      method: 'POST',
      url: '/api/optimize',
      payload: { scenario, candidates: 40 },
    })
    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.portfolios.map((portfolio: { objective: string }) => portfolio.objective)).toEqual([
      'balanced',
      'early-action',
      'vulnerability-intent',
      'stability',
    ])
    expect(body.search).toMatchObject({
      screenedCandidates: 40,
      variationSamplesPerWinner: 48,
      method: 'two-stage-seeded-search',
    })
    expect(body.search.fullSimulations).toBeGreaterThan(0)
    expect(body.search.fullSimulations).toBeLessThanOrEqual(4)
    for (const portfolio of body.portfolios) {
      const spent = portfolio.allocations.reduce((sum: number, allocation: { amount: number }) => sum + allocation.amount, 0)
      expect(spent).toBeLessThanOrEqual(scenario.budget + 0.02)
    }
    expect(response.headers['x-ratelimit-limit']).toBe('12')
  })

  it('serves validated context events through an injectable source boundary', async () => {
    const loader: ContextEventsLoader = async () => ({
      mode: 'snapshot',
      fetchedAt: '2026-07-17T00:00:00.000Z',
      events: [{
        id: 'test-event',
        title: 'Test event',
        category: 'other',
        coordinates: [0, 0],
        displayScore: 50,
        source: 'Morrow synthetic demo',
      }],
    })
    const app = await testServer(loader)
    const response = await app.inject({ method: 'GET', url: '/api/context-events?mode=snapshot' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ mode: 'snapshot', events: [{ id: 'test-event' }] })
    expect(response.headers['cache-control']).toBe('public, max-age=15')
  })

  it('returns bounded errors for unsupported routes and oversized bodies', async () => {
    const app = await testServer()
    const missing = await app.inject({ method: 'GET', url: '/api/unknown' })
    expect(missing.statusCode).toBe(404)
    expect(missing.json().error.code).toBe('NOT_FOUND')

    const oversized = await app.inject({
      method: 'POST',
      url: '/api/simulate',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ padding: 'x'.repeat(70_000) }),
    })
    expect(oversized.statusCode).toBe(413)
    expect(oversized.json().error.code).toBe('BODY_TOO_LARGE')
  })

  it('returns a stable rate-limit contract instead of converting limits to 500 errors', async () => {
    const app = await testServer()
    for (let index = 0; index < 30; index += 1) {
      const response = await app.inject({ method: 'POST', url: '/api/simulate', payload: {} })
      expect(response.statusCode).toBe(400)
    }
    const limited = await app.inject({ method: 'POST', url: '/api/simulate', payload: {} })
    expect(limited.statusCode).toBe(429)
    expect(limited.json().error.code).toBe('RATE_LIMITED')
    expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0)

    const optimizeApp = await testServer()
    for (let index = 0; index < 12; index += 1) {
      const response = await optimizeApp.inject({ method: 'POST', url: '/api/optimize', payload: {} })
      expect(response.statusCode).toBe(400)
    }
    const optimizeLimited = await optimizeApp.inject({ method: 'POST', url: '/api/optimize', payload: {} })
    expect(optimizeLimited.statusCode).toBe(429)
    expect(optimizeLimited.json().error.code).toBe('RATE_LIMITED')
    expect(Number(optimizeLimited.headers['retry-after'])).toBeGreaterThan(0)
  })
})
