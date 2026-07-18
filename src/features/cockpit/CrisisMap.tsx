import { useMemo } from 'react'
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { Crosshair, Radio, ScanLine } from 'lucide-react'
import world from 'world-atlas/countries-110m.json'
import { getPreset } from '../../data/catalog'
import type { LiveEvent, Scenario, SignalMode, SimulationResult } from '../../domain/types'
import { relativeTime } from '../../utils/format'
import { StatusPill } from '../../components/StatusPill'

interface CrisisMapProps {
  scenario: Scenario
  result: SimulationResult
  events: LiveEvent[]
  signalMode: SignalMode
  selectedHour: number
  onHourChange: (hour: number) => void
}

export function CrisisMap({ scenario, result, events, signalMode, selectedHour, onHourChange }: CrisisMapProps) {
  const preset = getPreset(scenario.presetId)
  const geometry = useMemo(() => {
    const collection = feature(world as never, world.objects.countries as never) as unknown as FeatureCollection<Geometry>
    const projection = geoNaturalEarth1().fitExtent([[18, 18], [882, 408]], collection)
    const path = geoPath(projection)
    return { collection, projection, path, graticule: path(geoGraticule10()) ?? '' }
  }, [])
  const point = result.trajectory.reduce((closest, candidate) =>
    Math.abs(candidate.hour - selectedHour) < Math.abs(closest.hour - selectedHour) ? candidate : closest,
  )
  const epicenter = geometry.projection(preset.coordinates) ?? [450, 210]
  const signalPoints = events.flatMap((event) => {
    const projected = geometry.projection(event.coordinates)
    return projected ? [{ event, projected }] : []
  })

  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <header className="panel-header map-header">
        <div>
          <span className="panel-kicker"><ScanLine size={14} /> CONCEPTUAL REHEARSAL FIELD</span>
          <h2 id="map-title">System-pressure canvas</h2>
        </div>
        <div className="map-status">
          <StatusPill tone={signalMode === 'live' ? 'green' : signalMode === 'partial' ? 'amber' : 'blue'} pulse={signalMode === 'live'}>{signalMode === 'live' ? `${events.length} LIVE CONTEXT EVENTS` : signalMode === 'partial' ? `${events.length} PARTIAL CONTEXT EVENTS` : 'SYNTHETIC DEMO EVENTS'}</StatusPill>
          <span className="map-clock"><i /> T+{selectedHour.toString().padStart(2, '0')}:00</span>
        </div>
      </header>
      <div className="world-map-wrap">
        <svg className="world-map" viewBox="0 0 900 430" role="img" aria-labelledby="map-svg-title map-svg-desc">
          <title id="map-svg-title">Conceptual rehearsal canvas for {preset.name}</title>
          <desc id="map-svg-desc">The illustrative field centers on {preset.location}. It is not a geospatial impact or country-risk model. Current system-pressure proxy is {Math.round(point.systemRisk)} out of 100.</desc>
          <defs>
            <radialGradient id="impactField">
              <stop offset="0%" stopColor="#b9ff66" stopOpacity="0.32" />
              <stop offset="48%" stopColor="#39d9ff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#39d9ff" stopOpacity="0" />
            </radialGradient>
            <filter id="softGlow"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>
          <rect width="900" height="430" fill="transparent" />
          <path d={geometry.graticule} className="map-graticule" />
          {geometry.collection.features.map((country: Feature<Geometry>, index) => (
            <path key={String(country.id ?? index)} d={geometry.path(country) ?? ''} fill="rgba(104, 221, 171, .10)" className="map-country" />
          ))}
          <circle cx={epicenter[0]} cy={epicenter[1]} r={120 + point.hazard * 0.45} fill="url(#impactField)" className="impact-halo" />
          <circle cx={epicenter[0]} cy={epicenter[1]} r="27" className="epicenter-ring ring-outer" />
          <circle cx={epicenter[0]} cy={epicenter[1]} r="12" className="epicenter-ring ring-inner" />
          <circle cx={epicenter[0]} cy={epicenter[1]} r="4" className="epicenter-dot" />
          {signalPoints.slice(0, 18).map(({ event, projected }) => (
            <g key={event.id} className={`event-point event-${event.category}`}>
              <circle cx={projected[0]} cy={projected[1]} r="7" className="event-wave" />
              <circle cx={projected[0]} cy={projected[1]} r="2.7" />
            </g>
          ))}
        </svg>
        <div className="map-location-card">
          <span><Crosshair size={14} /> PRIMARY IMPACT</span>
          <strong>{preset.location}</strong>
          <small>{preset.coordinates[1].toFixed(1)}°N · {preset.coordinates[0].toFixed(1)}°E</small>
        </div>
        <div className="map-legend" aria-hidden="true"><span>LOW</span><i /><span>CONCEPTUAL PRESSURE</span><i /><span>HIGH</span></div>
      </div>
      <div className="timeline-control">
        <div className="timeline-label"><span>BEFORE IMPACT</span><span className="landfall-marker">PEAK HAZARD · T+{preset.peakHour}H</span><span>STABILIZATION</span></div>
        <label htmlFor="crisis-timeline" className="sr-only">Crisis timeline hour</label>
        <input id="crisis-timeline" type="range" min="0" max="72" step="6" value={selectedHour} onChange={(event) => onHourChange(Number(event.target.value))} style={{ '--progress': `${(selectedHour / 72) * 100}%` } as React.CSSProperties} />
        <div className="timeline-ticks">{Array.from({ length: 13 }, (_, index) => <span key={index}>{index % 2 === 0 ? `${index * 6}H` : ''}</span>)}</div>
      </div>
      <details className="accessible-data map-data">
        <summary><Radio size={14} /> Read signal list and modeled map values</summary>
        <p>Conceptual field only—not geospatial impact. At T+{selectedHour}h: hazard {Math.round(point.hazard)}/100; system-pressure proxy {Math.round(point.systemRisk)}/100; scenario location {preset.location}.</p>
        <ul>{events.slice(0, 8).map((event) => <li key={event.id}><strong>{event.title}</strong> — {event.source}, {relativeTime(event.occurredAt)}</li>)}</ul>
      </details>
    </section>
  )
}
