import type { LiveEvent, SignalMode } from '../domain/types'

export const snapshotEvents: LiveEvent[] = [
  {
    id: 'snapshot-cyclone',
    title: '[Synthetic demo] Severe tropical storm watch',
    category: 'storm',
    coordinates: [89.3, 20.9],
    displayScore: 84,
    source: 'Morrow synthetic demo',
  },
  {
    id: 'snapshot-wildfire',
    title: '[Synthetic demo] Mediterranean wildfire complex',
    category: 'wildfire',
    coordinates: [22.2, 38.5],
    displayScore: 61,
    source: 'Morrow synthetic demo',
  },
  {
    id: 'snapshot-earthquake',
    title: '[Synthetic demo] M6.1 seismic event',
    category: 'earthquake',
    coordinates: [-72.1, -18.2],
    displayScore: 66,
    source: 'Morrow synthetic demo',
  },
]

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
    redirect: 'error',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
  if (!response.ok) throw new Error(`Signal source returned ${response.status}.`)
  const length = Number(response.headers.get('content-length') ?? 0)
  if (length > 2_000_000) throw new Error('Signal response exceeded the 2 MB safety limit.')
  const text = await response.text()
  if (new TextEncoder().encode(text).byteLength > 2_000_000) throw new Error('Signal response exceeded the 2 MB safety limit.')
  return JSON.parse(text) as unknown
}

function nasaEvents(value: unknown): LiveEvent[] | null {
  if (!value || typeof value !== 'object' || !('events' in value) || !Array.isArray(value.events)) return null
  return value.events.slice(0, 20).flatMap((item): LiveEvent[] => {
    if (!item || typeof item !== 'object') return []
    const event = item as Record<string, unknown>
    const geometry = Array.isArray(event.geometry) ? event.geometry.at(-1) : null
    if (!geometry || typeof geometry !== 'object') return []
    const point = geometry as Record<string, unknown>
    const coordinates = Array.isArray(point.coordinates) ? point.coordinates : []
    if (typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') return []
    const categoryText = JSON.stringify(event.categories ?? '').toLowerCase()
    const category: LiveEvent['category'] = categoryText.includes('wildfire')
      ? 'wildfire'
      : categoryText.includes('storm')
        ? 'storm'
        : categoryText.includes('volcano')
          ? 'volcano'
          : 'other'
    return [
      {
        id: `nasa-${String(event.id ?? coordinates.join('-')).slice(0, 80)}`,
        title: String(event.title ?? 'Natural event').slice(0, 120),
        category,
        coordinates: [coordinates[0], coordinates[1]],
        displayScore: category === 'storm' ? 70 : 55,
        occurredAt: typeof point.date === 'string' ? point.date : undefined,
        source: 'NASA EONET',
        url: typeof event.link === 'string' && event.link.startsWith('https://') ? event.link : undefined,
      },
    ]
  })
}

function usgsEvents(value: unknown): LiveEvent[] | null {
  if (!value || typeof value !== 'object' || !('features' in value) || !Array.isArray(value.features)) return null
  return value.features.slice(0, 20).flatMap((item): LiveEvent[] => {
    if (!item || typeof item !== 'object') return []
    const feature = item as Record<string, unknown>
    const geometry = feature.geometry as Record<string, unknown> | undefined
    const properties = feature.properties as Record<string, unknown> | undefined
    const coordinates = Array.isArray(geometry?.coordinates) ? geometry.coordinates : []
    const magnitude = typeof properties?.mag === 'number' ? properties.mag : 0
    if (typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number' || magnitude < 4.5) return []
    const eventUrl = typeof properties?.url === 'string' && properties.url.startsWith('https://earthquake.usgs.gov/') ? properties.url : undefined
    return [
      {
        id: `usgs-${String(feature.id ?? coordinates.join('-')).slice(0, 80)}`,
        title: String(properties?.title ?? `M${magnitude.toFixed(1)} earthquake`).slice(0, 120),
        category: 'earthquake',
        coordinates: [coordinates[0], coordinates[1]],
        displayScore: Math.min(95, Math.max(35, magnitude * 11)),
        occurredAt: typeof properties?.time === 'number' ? new Date(properties.time).toISOString() : undefined,
        source: 'USGS',
        url: eventUrl,
      },
    ]
  })
}

export async function loadLiveEvents(): Promise<{ events: LiveEvent[]; mode: SignalMode }> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 7_000)
  try {
    const settled = await Promise.allSettled([
      fetchJson('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20', controller.signal),
      fetchJson('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', controller.signal),
    ])
    const nasa = settled[0]?.status === 'fulfilled' ? nasaEvents(settled[0].value) : null
    const usgs = settled[1]?.status === 'fulfilled' ? usgsEvents(settled[1].value) : null
    const events = [...(nasa ?? []), ...(usgs ?? [])]
    if (events.length === 0) return { events: snapshotEvents, mode: 'snapshot' }
    const bothFeedsAvailable = nasa !== null && usgs !== null
    return { events: events.slice(0, 30), mode: bothFeedsAvailable ? 'live' : 'partial' }
  } catch {
    return { events: snapshotEvents, mode: 'snapshot' }
  } finally {
    window.clearTimeout(timeout)
  }
}
