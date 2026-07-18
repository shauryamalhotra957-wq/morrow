import { z } from 'zod'
import type { LiveEvent, SignalMode } from '../src/domain/types'

const MAX_UPSTREAM_BYTES = 1_000_000
const UPSTREAM_TIMEOUT_MS = 4_000
const LIVE_CACHE_MS = 60_000
const PARTIAL_CACHE_MS = 30_000
const SNAPSHOT_CACHE_MS = 15_000

const coordinatesSchema = z
  .tuple([
    z.number().finite().min(-180).max(180),
    z.number().finite().min(-90).max(90),
  ])
  .rest(z.number().finite())

const nasaResponseSchema = z
  .object({
    events: z
      .array(
        z
          .object({
            id: z.union([z.string(), z.number()]).optional(),
            title: z.string().max(500).optional(),
            link: z.string().max(2_048).optional(),
            categories: z.array(z.object({ title: z.string().max(120).optional() }).passthrough()).max(20).optional(),
            geometry: z
              .array(
                z
                  .object({
                    date: z.string().max(64).optional(),
                    coordinates: coordinatesSchema.optional(),
                  })
                  .passthrough(),
              )
              .max(100)
              .optional(),
          })
          .passthrough(),
      )
      .max(100),
  })
  .passthrough()

const usgsResponseSchema = z
  .object({
    features: z
      .array(
        z
          .object({
            id: z.union([z.string(), z.number()]).optional(),
            geometry: z.object({ coordinates: coordinatesSchema.optional() }).passthrough().optional(),
            properties: z
              .object({
                mag: z.number().finite().optional(),
                time: z.number().finite().optional(),
                title: z.string().max(500).optional(),
                url: z.string().max(2_048).optional(),
              })
              .passthrough()
              .optional(),
          })
          .passthrough(),
      )
      .max(100),
  })
  .passthrough()

export type ContextEventsMode = 'auto' | 'snapshot'

export interface ContextEventsResult {
  events: LiveEvent[]
  mode: SignalMode
  fetchedAt: string
}

export type ContextEventsLoader = (mode?: ContextEventsMode) => Promise<ContextEventsResult>

interface ContextEventsLoaderOptions {
  fetcher?: typeof fetch
  now?: () => number
}

const snapshotEvents: LiveEvent[] = [
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

function validDate(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined
}

function officialUrl(value: string | undefined, allowedHost: (hostname: string) => boolean): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && allowedHost(url.hostname) ? url.href : undefined
  } catch {
    return undefined
  }
}

async function fetchJsonBounded(fetcher: typeof fetch, url: string): Promise<unknown> {
  const response = await fetcher(url, {
    headers: { Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Upstream returned ${response.status}.`)

  const declaredLength = Number(response.headers.get('content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPSTREAM_BYTES) {
    throw new Error('Upstream payload exceeded the response limit.')
  }
  if (!response.body) throw new Error('Upstream response had no body.')

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_UPSTREAM_BYTES) {
      await reader.cancel()
      throw new Error('Upstream payload exceeded the response limit.')
    }
    chunks.push(value)
  }

  const payload = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    payload.set(chunk, offset)
    offset += chunk.byteLength
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(payload)) as unknown
}

function mapNasaEvents(value: unknown): LiveEvent[] | null {
  const parsed = nasaResponseSchema.safeParse(value)
  if (!parsed.success) return null

  return parsed.data.events.slice(0, 20).flatMap((event): LiveEvent[] => {
    const latest = event.geometry?.at(-1)
    if (!latest?.coordinates) return []
    const categoryText = event.categories?.map((category) => category.title ?? '').join(' ').toLowerCase() ?? ''
    const category: LiveEvent['category'] = categoryText.includes('wildfire')
      ? 'wildfire'
      : categoryText.includes('storm')
        ? 'storm'
        : categoryText.includes('volcano')
          ? 'volcano'
          : 'other'

    const url = officialUrl(event.link, (hostname) => hostname === 'nasa.gov' || hostname.endsWith('.nasa.gov'))
    const occurredAt = validDate(latest.date)
    return [{
      id: `nasa-${String(event.id ?? latest.coordinates.join('-')).slice(0, 80)}`,
      title: (event.title ?? 'Natural event').slice(0, 120),
      category,
      coordinates: [latest.coordinates[0], latest.coordinates[1]],
      displayScore: category === 'storm' ? 70 : 55,
      source: 'NASA EONET',
      ...(occurredAt ? { occurredAt } : {}),
      ...(url ? { url } : {}),
    }]
  })
}

function mapUsgsEvents(value: unknown): LiveEvent[] | null {
  const parsed = usgsResponseSchema.safeParse(value)
  if (!parsed.success) return null

  return parsed.data.features.slice(0, 20).flatMap((feature): LiveEvent[] => {
    const coordinates = feature.geometry?.coordinates
    const magnitude = feature.properties?.mag ?? 0
    if (!coordinates || magnitude < 4.5) return []

    const url = officialUrl(feature.properties?.url, (hostname) => hostname === 'earthquake.usgs.gov')
    const occurredAt = validDate(feature.properties?.time)
    return [{
      id: `usgs-${String(feature.id ?? coordinates.join('-')).slice(0, 80)}`,
      title: (feature.properties?.title ?? `M${magnitude.toFixed(1)} earthquake`).slice(0, 120),
      category: 'earthquake',
      coordinates: [coordinates[0], coordinates[1]],
      displayScore: Math.min(95, Math.max(35, magnitude * 11)),
      source: 'USGS',
      ...(occurredAt ? { occurredAt } : {}),
      ...(url ? { url } : {}),
    }]
  })
}

async function loadUpstreamEvents(fetcher: typeof fetch, now: () => number): Promise<ContextEventsResult> {
  const fetchedAt = new Date(now()).toISOString()
  const settled = await Promise.allSettled([
    fetchJsonBounded(fetcher, 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20'),
    fetchJsonBounded(fetcher, 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson'),
  ])
  const nasa = settled[0]?.status === 'fulfilled' ? mapNasaEvents(settled[0].value) : null
  const usgs = settled[1]?.status === 'fulfilled' ? mapUsgsEvents(settled[1].value) : null
  const succeededFeeds = Number(nasa !== null) + Number(usgs !== null)
  const events = [
    ...(nasa ?? []),
    ...(usgs ?? []),
  ].slice(0, 30)

  if (succeededFeeds === 0) {
    return { events: snapshotEvents.map((event) => ({ ...event })), mode: 'snapshot', fetchedAt }
  }
  return { events, mode: succeededFeeds === 2 ? 'live' : 'partial', fetchedAt }
}

export function createContextEventsLoader(options: ContextEventsLoaderOptions = {}): ContextEventsLoader {
  const fetcher = options.fetcher ?? fetch
  const now = options.now ?? Date.now
  let cached: { expiresAt: number; value: ContextEventsResult } | null = null
  let inFlight: Promise<ContextEventsResult> | null = null

  return async (mode = 'auto') => {
    const fetchedAt = new Date(now()).toISOString()
    if (mode === 'snapshot') {
      return { events: snapshotEvents.map((event) => ({ ...event })), mode: 'snapshot', fetchedAt }
    }
    if (cached && cached.expiresAt > now()) return cached.value
    if (inFlight) return inFlight

    inFlight = loadUpstreamEvents(fetcher, now)
      .then((value) => {
        cached = {
          expiresAt: now() + (value.mode === 'live' ? LIVE_CACHE_MS : value.mode === 'partial' ? PARTIAL_CACHE_MS : SNAPSHOT_CACHE_MS),
          value,
        }
        return value
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }
}
