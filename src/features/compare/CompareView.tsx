import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeDollarSign,
  Gauge,
  GitCompareArrows,
  HeartHandshake,
  Scale,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from 'lucide-react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getIntervention } from '../../data/catalog'
import type { PortfolioOption, Scenario, SimulationResult } from '../../domain/types'
import { compactNumber, currencyBillions, currencyMillions } from '../../utils/format'

interface CompareViewProps {
  scenario: Scenario
  result: SimulationResult
  portfolios: PortfolioOption[]
  optimizing: boolean
  onOptimize: () => void
  onApply: (portfolio: PortfolioOption) => void
}

const objectiveMeta = {
  balanced: { icon: Scale, color: '#b9ff66', display: 'BALANCED', description: 'Balances four explicit, unvalidated model proxies.' },
  'early-action': { icon: TimerReset, color: '#39d9ff', display: 'EARLY ACTION', description: 'Front-loads actions with shorter assumed deployment delays.' },
  'vulnerability-intent': { icon: HeartHandshake, color: '#dba7ff', display: 'VULNERABILITY INTENT', description: 'Weights cash, water, warning, evacuation, and diversification proxies.' },
  stability: { icon: ShieldCheck, color: '#ffba69', display: 'STABILITY PROXY', description: 'Weights the stability composite under the selected exercise stress.' },
} as const

export function CompareView({ scenario, result, portfolios, optimizing, onOptimize, onApply }: CompareViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = portfolios.find((portfolio) => portfolio.id === selectedId) ?? portfolios[0]
  const maxProtected = Math.max(result.metrics.protectionProxy, ...portfolios.map((item) => item.metrics.protectionProxy), 1)
  const maxLoss = Math.max(result.metrics.lossProxyDelta, ...portfolios.map((item) => item.metrics.lossProxyDelta), 0.1)
  const radarData = selected ? [
    { metric: 'Protection proxy', current: (result.metrics.protectionProxy / maxProtected) * 100, candidate: (selected.metrics.protectionProxy / maxProtected) * 100 },
    { metric: 'Loss-proxy delta', current: (result.metrics.lossProxyDelta / maxLoss) * 100, candidate: (selected.metrics.lossProxyDelta / maxLoss) * 100 },
    { metric: 'Inclusion proxy', current: result.metrics.inclusionProxy, candidate: selected.metrics.inclusionProxy },
    { metric: 'Pressure stability', current: result.metrics.pressureStability, candidate: selected.metrics.pressureStability },
    { metric: 'Stability composite', current: result.metrics.stabilityComposite, candidate: selected.metrics.stabilityComposite },
    { metric: 'Timing proxy', current: ((36 - result.metrics.mobilizationHours) / 30) * 100, candidate: ((36 - selected.metrics.mobilizationHours) / 30) * 100 },
  ] : []

  return (
    <div className="compare-view page-view">
      <header className="page-heading compare-heading">
        <div>
          <span className="page-kicker"><GitCompareArrows size={14} /> SEEDED PORTFOLIO SEARCH</span>
          <h1>There is no single “best” plan.</h1>
          <p>Morrow searches the same {currencyMillions(scenario.budget)} budget across four explicit scoring rules—timing, vulnerability intent, stability, and balance—so the trade-off stays a human decision.</p>
        </div>
        <button className="button button-primary button-large" type="button" onClick={onOptimize} disabled={optimizing}>
          <Sparkles size={17} /> {optimizing ? 'Searching 160 portfolios…' : portfolios.length ? 'Re-run search' : 'Find objective winners'}
        </button>
      </header>

      {optimizing && (
        <section className="optimizer-running" aria-live="polite">
          <div className="optimizer-orbit"><i /><i /><i /><span><Gauge size={25} /><strong>160</strong><small>CANDIDATES</small></span></div>
          <div><span className="panel-kicker">COOPERATIVE LOCAL SEARCH</span><h2>Screening constrained portfolios.</h2><p>All 160 budget-valid candidates receive the direct model; the four objective winners then receive the full 48-variation sensitivity run. Work yields in small batches so navigation and cancellation remain responsive.</p><div className="optimizer-progress"><i /></div></div>
        </section>
      )}

      {!optimizing && portfolios.length === 0 && (
        <section className="optimizer-empty panel">
          <div className="empty-constellation" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} style={{ '--i': index } as React.CSSProperties} />)}</div>
          <Sparkles size={28} />
          <h2>Four explicit objective winners are one search away.</h2>
          <p>Run the local search to compare balanced, early-action, vulnerability-intent, and stability-proxy portfolios.</p>
          <button className="button button-primary" type="button" onClick={onOptimize}>Start reproducible search <ArrowRight size={16} /></button>
        </section>
      )}

      {!optimizing && portfolios.length > 0 && (
        <>
          <section className="portfolio-grid" aria-label="Optimized portfolio options">
            {portfolios.map((portfolio, index) => {
              const meta = objectiveMeta[portfolio.objective]
              const Icon = meta.icon
              const active = selected?.id === portfolio.id
              return (
                <motion.button
                  type="button"
                  className={`portfolio-card${active ? ' selected' : ''}`}
                  key={portfolio.id}
                  onClick={() => setSelectedId(portfolio.id)}
                  style={{ '--portfolio-color': meta.color } as React.CSSProperties}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  aria-pressed={active}
                >
                  <div className="portfolio-top"><span className="portfolio-icon"><Icon size={20} /></span><span className="portfolio-rank">0{index + 1}</span></div>
                  <span className="portfolio-objective">{meta.display}</span>
                  <h2>{portfolio.label}</h2>
                  <p>{meta.description}</p>
                  <div className="portfolio-metrics">
                    <div><span>PROTECTION PROXY</span><strong>{compactNumber(portfolio.metrics.protectionProxy)}</strong></div>
                    <div><span>STABILITY</span><strong>{Math.round(portfolio.metrics.stabilityComposite)}</strong></div>
                    <div><span>INCLUSION</span><strong>{Math.round(portfolio.metrics.inclusionProxy)}</strong></div>
                  </div>
                  <span className="select-portfolio">{active ? 'SELECTED FOR INSPECTION' : 'INSPECT PORTFOLIO'} <ArrowRight size={14} /></span>
                </motion.button>
              )
            })}
          </section>

          {selected && (
            <div className="comparison-layout">
              <section className="panel comparison-radar">
                <header className="panel-header"><div><span className="panel-kicker"><Scale size={14} /> TRADE-OFF SHAPE</span><h2>Current plan vs. {selected.label}</h2></div><div className="radar-legend"><span><i className="current" /> CURRENT</span><span><i className="candidate" /> CANDIDATE</span></div></header>
                <div className="radar-wrap" role="img" aria-label={`Radar comparison of current plan and ${selected.label}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="72%" accessibilityLayer>
                      <PolarGrid stroke="rgba(160,199,187,.16)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#8fa59e', fontSize: 10, fontFamily: 'Space Mono' }} />
                      <Tooltip contentStyle={{ background: '#0b1915', border: '1px solid rgba(185,255,102,.2)', borderRadius: 10, fontSize: 11 }} formatter={(value) => `${Math.round(Number(value))}`} />
                      <Radar name="Current" dataKey="current" stroke="#668078" fill="#668078" fillOpacity={0.13} strokeWidth={1.5} />
                      <Radar name={selected.label} dataKey="candidate" stroke={objectiveMeta[selected.objective].color} fill={objectiveMeta[selected.objective].color} fillOpacity={0.18} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <details className="accessible-data"><summary>Open comparison values</summary><table><thead><tr><th>Metric</th><th>Current</th><th>Candidate</th></tr></thead><tbody>{radarData.map((item) => <tr key={item.metric}><td>{item.metric}</td><td>{Math.round(item.current)}</td><td>{Math.round(item.candidate)}</td></tr>)}</tbody></table></details>
              </section>

              <section className="panel allocation-compare">
                <header className="panel-header"><div><span className="panel-kicker"><BadgeDollarSign size={14} /> BUDGET DELTA</span><h2>What changes</h2></div><span className="exact-budget">EXACTLY {currencyMillions(scenario.budget)}</span></header>
                <div className="allocation-comparison-list">
                  {scenario.allocations.map((allocation) => {
                    const definition = getIntervention(allocation.id)
                    const candidate = selected.allocations.find((item) => item.id === allocation.id)?.amount ?? 0
                    const delta = candidate - allocation.amount
                    return (
                      <div key={allocation.id}>
                        <div><span><i style={{ background: definition.color }} />{definition.shortName}</span><strong className={delta > 0.01 ? 'delta-up' : delta < -0.01 ? 'delta-down' : ''}>{delta > 0 ? '+' : ''}{currencyMillions(delta)}</strong></div>
                        <div className="compare-bars"><i className="current" style={{ width: `${(allocation.amount / definition.maxAllocation) * 100}%` }} /><i className="candidate" style={{ width: `${(candidate / definition.maxAllocation) * 100}%`, background: definition.color }} /></div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="panel candidate-summary">
                <header><span className="panel-kicker"><ShieldCheck size={14} /> OUTCOME DELTA</span><h2>{selected.label}</h2><p>Relative to your current portfolio under the same scenario and budget.</p></header>
                <div className="summary-metrics">
                  <div><span>Modeled protection proxy</span><strong>{compactNumber(selected.metrics.protectionProxy)}</strong><small>{selected.metrics.protectionProxy >= result.metrics.protectionProxy ? '+' : ''}{compactNumber(selected.metrics.protectionProxy - result.metrics.protectionProxy)} vs current</small></div>
                  <div><span>Loss-proxy delta</span><strong>{currencyBillions(selected.metrics.lossProxyDelta)}</strong><small>{currencyBillions(selected.metrics.lossProxyDelta - result.metrics.lossProxyDelta)} vs. current plan</small></div>
                  <div><span>Mobilization-time proxy</span><strong>{selected.metrics.mobilizationHours}h</strong><small>{(selected.metrics.mobilizationHours - result.metrics.mobilizationHours).toFixed(1)}h delta</small></div>
                  <div><span>Stability composite</span><strong>{Math.round(selected.metrics.stabilityComposite)}</strong><small>{(selected.metrics.stabilityComposite - result.metrics.stabilityComposite).toFixed(1)} points</small></div>
                </div>
                <button className="button button-primary button-large" type="button" onClick={() => onApply(selected)}>Apply this portfolio <ArrowRight size={17} /></button>
                <p className="model-caveat">Unvalidated training outputs. Selection remains a human judgment; search scores are not recommendations, fairness measures, forecasts, or probabilities.</p>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
