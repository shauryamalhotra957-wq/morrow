import { describe, expect, it, vi } from 'vitest'
import { createContextEventsLoader } from './context-events'

describe('context-event adapter', () => {
  it('validates, normalizes, and caches official upstream responses', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.includes('eonet')) {
        return new Response(JSON.stringify({
          events: [{
            id: 'E1',
            title: 'Wildfire event',
            categories: [{ title: 'Wildfires' }],
            geometry: [{ date: '2026-07-17T00:00:00.000Z', coordinates: [12, 34] }],
            link: 'https://eonet.gsfc.nasa.gov/api/v3/events/E1',
          }],
        }), { status: 200, headers: { 'content-type': 'application/json' } })
      }
      return new Response(JSON.stringify({
        features: [{
          id: 'Q1',
          geometry: { coordinates: [40, 20, 10] },
          properties: { mag: 5.4, time: 1_768_435_200_000, title: 'M5.4 test', url: 'https://earthquake.usgs.gov/earthquakes/eventpage/Q1' },
        }],
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    })
    const loader = createContextEventsLoader({ fetcher, now: () => 1_768_435_200_000 })

    const first = await loader()
    const second = await loader()
    expect(first.mode).toBe('live')
    expect(first.events.map((event) => event.source)).toEqual(['NASA EONET', 'USGS'])
    expect(second).toBe(first)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('fails closed to the documented snapshot when upstreams fail', async () => {
    const loader = createContextEventsLoader({
      fetcher: vi.fn<typeof fetch>(async () => { throw new Error('offline') }),
      now: () => 1_768_435_200_000,
    })
    const result = await loader()

    expect(result.mode).toBe('snapshot')
    expect(result.events).toHaveLength(3)
    expect(result.events.every((event) => event.source === 'Morrow synthetic demo')).toBe(true)
    expect(result.events.every((event) => event.occurredAt === undefined)).toBe(true)
  })

  it('reports partial availability and preserves an unknown event timestamp', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      if (String(input).includes('eonet')) {
        return new Response(JSON.stringify({
          events: [{
            id: 'E2',
            title: 'Untimed storm',
            categories: [{ title: 'Severe Storms' }],
            geometry: [{ coordinates: [15, 25] }],
          }],
        }), { status: 200, headers: { 'content-type': 'application/json' } })
      }
      throw new Error('USGS unavailable')
    })
    const result = await createContextEventsLoader({ fetcher, now: () => 1_768_435_200_000 })()

    expect(result.mode).toBe('partial')
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({ source: 'NASA EONET', displayScore: 70 })
    expect(result.events[0]?.occurredAt).toBeUndefined()
  })
})
