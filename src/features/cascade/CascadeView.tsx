import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Antenna,
  Building2,
  CircleDollarSign,
  CloudLightning,
  Droplets,
  HeartPulse,
  Pause,
  Play,
  Route,
  Utensils,
} from 'lucide-react'
import { getPreset } from '../../data/catalog'
import type { RiskState, Scenario, SimulationResult, SystemNodeId } from '../../domain/types'
import { CASCADE_PATHWAYS, getPathway } from '../../domain/pathways'
import { StatusPill } from '../../components/StatusPill'

interface CascadeViewProps {
  scenario: Scenario
  result: SimulationResult
  selectedHour: number
  onHourChange: (hour: number) => void
  onScenarioChange: (scenario: Scenario) => void
}

type NodeDefinition = {
  id: SystemNodeId
  label: string
  shortLabel: string
  x: number
  y: number
  icon: typeof Activity
  color: string
  description: string
  equation: string
}

const nodes: NodeDefinition[] = [
  { id: 'hazard', label: 'Primary hazard', shortLabel: 'HAZARD', x: 10, y: 51, icon: CloudLightning, color: '#ffba69', description: 'Exogenous shock intensity across the selected scenario timeline.', equation: 'intensity × hazard profile × uncertainty' },
  { id: 'communications', label: 'Communications gap', shortLabel: 'COMMS', x: 29, y: 17, icon: Antenna, color: '#dba7ff', description: 'Loss of warning reach, network availability, and local coordination.', equation: `53% persistence + direct (${getPathway('hazard', 'communications').delay}h-lag) hazard pressure` },
  { id: 'infrastructure', label: 'Infrastructure failure', shortLabel: 'INFRA', x: 29, y: 75, icon: Building2, color: '#ff7b7b', description: 'Failure pressure on routes, ports, power, and critical facilities.', equation: '65% persistence + hazard × fragility' },
  { id: 'displacement', label: 'Displacement pressure', shortLabel: 'DISPLACE', x: 49, y: 49, icon: Route, color: '#39d9ff', description: 'Pressure created by unsafe housing, inaccessible services, and evacuation.', equation: '69% persistence + delayed infrastructure + communications' },
  { id: 'water', label: 'Water insecurity', shortLabel: 'WATER', x: 66, y: 17, icon: Droplets, color: '#5f8dff', description: 'Loss of safe water access and rising contamination risk.', equation: '67% persistence + 20% infrastructure + displacement' },
  { id: 'markets', label: 'Market disruption', shortLabel: 'MARKETS', x: 65, y: 78, icon: CircleDollarSign, color: '#f4e65d', description: 'Price, access, and livelihood disruption through logistics and demand shocks.', equation: '72% persistence + infrastructure + displacement' },
  { id: 'food', label: 'Food insecurity', shortLabel: 'FOOD', x: 83, y: 72, icon: Utensils, color: '#63efb0', description: 'Food access pressure transmitted through routes, markets, and displacement.', equation: '74% persistence + markets + logistics' },
  { id: 'health', label: 'Health-system load', shortLabel: 'HEALTH', x: 88, y: 31, icon: HeartPulse, color: '#b9ff66', description: 'Combined care pressure from exposure, injuries, unsafe water, and food insecurity.', equation: '66% persistence + water + food + displacement' },
]

const edges = CASCADE_PATHWAYS

function nodeValue(id: SystemNodeId, result: SimulationResult, hour: number): number {
  const point = result.trajectory.reduce((closest, candidate) => Math.abs(candidate.hour - hour) < Math.abs(closest.hour - hour) ? candidate : closest)
  return id === 'hazard' ? point.hazard : point[id as keyof RiskState]
}

export function CascadeView({ scenario, result, selectedHour, onHourChange, onScenarioChange }: CascadeViewProps) {
  const [selectedNode, setSelectedNode] = useState<SystemNodeId>('health')
  const [playing, setPlaying] = useState(false)
  const preset = getPreset(scenario.presetId)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      onHourChange(selectedHour >= 72 ? 0 : selectedHour + 6)
      if (selectedHour >= 72) setPlaying(false)
    }, 520)
    return () => window.clearInterval(timer)
  }, [onHourChange, playing, selectedHour])

  const selected = nodes.find((node) => node.id === selectedNode) ?? nodes[0]!
  const selectedValue = nodeValue(selected.id, result, selectedHour)
  const incoming = edges.filter((edge) => edge.to === selected.id)
  const outgoing = edges.filter((edge) => edge.from === selected.id)
  const riskRanking = useMemo(
    () => nodes.map((node) => ({ ...node, value: nodeValue(node.id, result, selectedHour) })).sort((a, b) => b.value - a.value),
    [result, selectedHour],
  )

  return (
    <div className="cascade-view page-view">
      <header className="page-heading cascade-heading">
        <div>
          <span className="page-kicker"><BrainCircuitIcon /> SYSTEMS ATLAS / {preset.name.toUpperCase()}</span>
          <h1>See how the model propagates pressure.</h1>
          <p>Select any node to inspect its inputs, delay, formula, and present modeled pressure. All coefficients are visible teaching assumptions.</p>
        </div>
        <div className="cascade-controls">
          <button className="button button-primary" type="button" onClick={() => { if (selectedHour >= 72) onHourChange(0); setPlaying((value) => !value) }}>
            {playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />} {playing ? 'Pause cascade' : 'Replay cascade'}
          </button>
          <StatusPill tone="blue">T+{selectedHour}H</StatusPill>
        </div>
      </header>

      <div className="cascade-layout">
        <section className="panel causal-canvas" aria-label="Interactive systems cascade graph">
          <div className="canvas-toolbar">
            <span><i /> TIMELINE ACTIVE</span>
            <div><span>Edge thickness = relative influence</span><span>Animation = direction</span></div>
          </div>
          <div className="causal-stage">
            <div className="causal-grid" />
            <svg viewBox="0 0 1000 540" aria-hidden="true">
              <defs>
                <marker id="edgeArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
              </defs>
              {edges.map((edge) => {
                const from = nodes.find((node) => node.id === edge.from)!
                const to = nodes.find((node) => node.id === edge.to)!
                const x1 = from.x * 10
                const y1 = from.y * 5.4
                const x2 = to.x * 10
                const y2 = to.y * 5.4
                const curve = Math.max(25, Math.abs(y2 - y1) * 0.24)
                const path = `M ${x1} ${y1} C ${x1 + (x2 - x1) * 0.42} ${y1 - curve}, ${x1 + (x2 - x1) * 0.58} ${y2 + curve}, ${x2} ${y2}`
                const related = edge.from === selectedNode || edge.to === selectedNode
                const active = selectedHour >= edge.delay && nodeValue(edge.from, result, selectedHour) > 8
                return <path key={`${edge.from}-${edge.to}`} d={path} className={`causal-edge${related ? ' related' : ''}${active ? ' flowing' : ''}`} style={{ strokeWidth: 1 + edge.weight * 5 }} markerEnd="url(#edgeArrow)" />
              })}
            </svg>
            {nodes.map((node) => {
              const Icon = node.icon
              const value = nodeValue(node.id, result, selectedHour)
              return (
                <button
                  key={node.id}
                  type="button"
                  className={`causal-node${selectedNode === node.id ? ' selected' : ''}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%`, '--node-color': node.color, '--node-risk': `${value}%` } as React.CSSProperties}
                  onClick={() => setSelectedNode(node.id)}
                  aria-label={`${node.label}, modeled pressure ${Math.round(value)} out of 100`}
                >
                  <span className="node-icon"><Icon size={19} /></span>
                  <span className="node-copy"><small>{node.shortLabel}</small><strong>{Math.round(value)}</strong></span>
                  <i />
                </button>
              )
            })}
          </div>
          <div className="cascade-scrubber">
            <span>0H</span>
            <label htmlFor="cascade-hour" className="sr-only">Cascade replay hour</label>
            <input id="cascade-hour" type="range" min="0" max="72" step="6" value={selectedHour} onChange={(event) => { setPlaying(false); onHourChange(Number(event.target.value)) }} style={{ '--progress': `${(selectedHour / 72) * 100}%` } as React.CSSProperties} />
            <span>72H</span>
          </div>
        </section>

        <aside className="panel node-inspector" aria-live="polite">
          <header><span className="node-inspector-icon" style={{ color: selected.color }}><selected.icon size={21} /></span><div><span>SELECTED NODE</span><h2>{selected.label}</h2></div><strong style={{ color: selected.color }}>{Math.round(selectedValue)}</strong></header>
          <p>{selected.description}</p>
          <div className="risk-meter"><span><i style={{ width: `${selectedValue}%`, background: selected.color }} /></span><small>0</small><b>{selectedValue >= 70 ? 'SEVERE' : selectedValue >= 40 ? 'ELEVATED' : 'MANAGED'}</b><small>100</small></div>
          <div className="inspector-section">
            <span className="inspector-label">MODEL EQUATION</span>
            <code>{selected.equation}</code>
          </div>
          <div className="inspector-section">
            <span className="inspector-label">INCOMING PATHWAYS</span>
            {incoming.length ? incoming.map((edge) => {
              const source = nodes.find((node) => node.id === edge.from)!
              return <div className="edge-fact" key={edge.from}><span>{source.label}</span><strong>+{edge.weight.toFixed(2)}</strong><small>{edge.delay}h lag · {edge.assumptionId}</small></div>
            }) : <p className="empty-path">Exogenous scenario input; no upstream model node.</p>}
          </div>
          <div className="inspector-section">
            <span className="inspector-label">DOWNSTREAM PATHWAYS</span>
            {outgoing.length ? outgoing.map((edge) => <div className="edge-fact" key={edge.to}><span>{nodes.find((node) => node.id === edge.to)?.label}</span><strong>+{edge.weight.toFixed(2)}</strong><small>{edge.delay}h lag · {edge.assumptionId}</small></div>) : <p className="empty-path">Terminal outcome in this teaching model.</p>}
          </div>
          <div className="assumption-box"><span>ASSUMPTION STATUS</span><strong>Illustrative · challengeable</strong><p>Coefficient is not presented as a proven causal estimate. See methodology and sources.</p></div>
        </aside>
      </div>

      <div className="cascade-bottom-grid">
        <section className="panel sensitivity-panel">
          <div><span className="panel-kicker">RED-TEAM CONTROL</span><h2>Correlated access + power stress</h2><p>One disclosed shared shock degrades route-dependent delivery, infrastructure, power, communications, and the seeded assumption-variation envelope together.</p></div>
          <div className="sensitivity-control"><label htmlFor="cascade-stress">Stress intensity <strong>{scenario.stress}%</strong></label><input id="cascade-stress" type="range" min="15" max="80" step="1" value={scenario.stress} onChange={(event) => onScenarioChange({ ...scenario, stress: Number(event.target.value) })} style={{ '--progress': `${((scenario.stress - 15) / 65) * 100}%` } as React.CSSProperties} /><div><span>NOMINAL · 15%</span><span>HIGH SHARED STRESS · 80%</span></div></div>
        </section>
        <section className="panel ranking-panel">
          <div className="panel-header"><div><span className="panel-kicker">T+{selectedHour}H PRESSURE</span><h2>System ranking</h2></div></div>
          <div>{riskRanking.slice(0, 5).map((node, index) => <div key={node.id}><span>{String(index + 1).padStart(2, '0')}</span><i style={{ background: node.color }} /><strong>{node.label}</strong><b>{Math.round(node.value)}</b></div>)}</div>
        </section>
      </div>
    </div>
  )
}

function BrainCircuitIcon() {
  return <Activity size={14} aria-hidden="true" />
}
