import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadLiveEvents } from './liveEvents'
import { relativeTime } from '../utils/format'

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } })
}

afterEach(() => vi.unstubAllGlobals())

describe('context event loading', () => {
  it('reports partial context when exactly one public feed succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('eonet')) throw new Error('NASA unavailable')
      return jsonResponse({
        features: [{
          id: 'test-quake',
          geometry: { coordinates: [80, 20, 10] },
          properties: { mag: 5.2, title: 'M5.2 test event', url: 'https://earthquake.usgs.gov/example' },
        }],
      })
    }))

    const result = await loadLiveEvents()
    expect(result.mode).toBe('partial')
    expect(result.events).toHaveLength(1)
    expect(result.events[0]?.source).toBe('USGS')
  })

  it('preserves an unknown provider timestamp instead of inventing recency', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('eonet')) throw new Error('NASA unavailable')
      return jsonResponse({
        features: [{
          id: 'undated-quake',
          geometry: { coordinates: [80, 20] },
          properties: { mag: 5.1, title: 'Undated event' },
        }],
      })
    }))

    const result = await loadLiveEvents()
    expect(result.events[0]?.occurredAt).toBeUndefined()
    expect(relativeTime(result.events[0]?.occurredAt)).toBe('timestamp unavailable')
  })

  it('falls back to clearly labeled synthetic events when both feeds fail', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const result = await loadLiveEvents()
    expect(result.mode).toBe('snapshot')
    expect(result.events.every((event) => event.source === 'Morrow synthetic demo')).toBe(true)
    expect(result.events.every((event) => event.title.startsWith('[Synthetic demo]'))).toBe(true)
    expect(result.events.every((event) => event.occurredAt === undefined)).toBe(true)
    expect(result.events.every((event) => relativeTime(event.occurredAt) === 'timestamp unavailable')).toBe(true)
  })
})
