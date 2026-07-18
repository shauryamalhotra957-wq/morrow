import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  Database,
  FileWarning,
  Fingerprint,
  Globe2,
  LockKeyhole,
  Radio,
  Scale,
  ShieldCheck,
} from 'lucide-react'
import { StatusPill } from '../../components/StatusPill'
import { ASSUMPTION_PACK_VERSION, assumptionLedger } from '../../data/assumptions'
import { KPI_METADATA, MODEL_OUTPUT_STATUS, SENSITIVITY_ENVELOPE_DEFINITION } from '../../data/modelMetadata'
import { evidenceSources } from '../../data/sources'
import type { LiveEvent, SignalMode } from '../../domain/types'
import { relativeTime } from '../../utils/format'

interface EvidenceViewProps {
  signalMode: SignalMode
  events: LiveEvent[]
}

type Filter = 'all' | 'context' | 'observations' | 'assumptions'

export function EvidenceView({ signalMode, events }: EvidenceViewProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const visibleSources = useMemo(
    () => evidenceSources.filter((source) =>
      filter === 'all' ||
      (filter === 'context' && source.role === 'context_only') ||
      (filter === 'observations' && source.role === 'observational_feed'),
    ),
    [filter],
  )
  const showSources = filter !== 'assumptions'
  const showAssumptions = filter === 'all' || filter === 'assumptions'
  const assumptionGroups = useMemo(() => {
    const grouped = new Map<string, typeof assumptionLedger>()
    for (const entry of assumptionLedger) {
      grouped.set(entry.interventionId, [...(grouped.get(entry.interventionId) ?? []), entry])
    }
    return [...grouped.values()]
  }, [])
  return (
    <div className="evidence-view page-view" id="methodology">
      <header className="page-heading evidence-heading">
        <div>
          <span className="page-kicker"><BookOpenCheck size={14} /> EVIDENCE & MODEL LEDGER</span>
          <h1>Trust is a product feature.</h1>
          <p>Morrow separates observations, published evidence, and illustrative assumptions. Every run states what it knows, what it models, and what it cannot claim.</p>
        </div>
        <div className="trust-stamp"><ShieldCheck size={24} /><div><span>MODEL STATUS</span><strong>ILLUSTRATIVE · UNVALIDATED</strong></div><small>v1.0</small></div>
      </header>

      <section className="trust-metrics" aria-label="Trust and provenance summary">
        <div><Database size={20} /><span><strong>{evidenceSources.filter((source) => source.role === 'context_only').length}</strong> context sources</span><small>never coefficient calibration</small></div>
        <div><Fingerprint size={20} /><span><strong>100%</strong> deterministic</span><small>same seed, same result</small></div>
        <div><FileWarning size={20} /><span><strong>{assumptionLedger.length}</strong> numeric assumptions</span><small>{MODEL_OUTPUT_STATUS}</small></div>
        <div><Scale size={20} /><span><strong>1</strong> versioned pack</span><small>{ASSUMPTION_PACK_VERSION}</small></div>
      </section>

      <div className="evidence-layout">
        <section className="panel methodology-card">
          <header className="panel-header"><div><span className="panel-kicker">MODEL MECHANISM</span><h2>A small system you can inspect</h2></div><StatusPill tone="green">OPEN FORMULA</StatusPill></header>
          <div className="formula-block">
            <span>risk<sub>node,t</sub></span>
            <b>=</b>
            <div><strong>persistence</strong><small>previous state × decay</small></div>
            <b>+</b>
            <div><strong>upstream cascade</strong><small>Σ edge weight × delayed input</small></div>
            <b>−</b>
            <div><strong>intervention</strong><small>saturation × readiness × effect</small></div>
          </div>
          <div className="method-facts">
            <div><span>TIME STEP</span><strong>6 hours</strong><p>13 points over the 72-hour rehearsal.</p></div>
            <div><span>SENSITIVITY</span><strong>48 variations</strong><p>Seeded changes in selected hazard, fragility, and cascade assumptions.</p></div>
            <div><span>OUTPUT</span><strong>p10 / p50 / p90</strong><p>Assumption-variation percentiles—not confidence or forecast intervals.</p></div>
          </div>
          <div className="method-warning"><FileWarning size={18} /><p><strong>Illustrative systems model.</strong> Coefficients demonstrate transparent decision modeling; they have not been calibrated for operational deployment. Outputs are scenarios, not forecasts.</p></div>
        </section>

        <section className="panel lineage-card">
          <header className="panel-header"><div><span className="panel-kicker">DATA LINEAGE</span><h2>From signal to brief</h2></div></header>
          <ol className="lineage-flow">
            <li><span><Radio size={17} /></span><div><strong>Context feed</strong><p>NASA EONET + USGS overlays do not alter the rehearsal model</p></div><small>OBSERVED CONTEXT</small></li>
            <li><span><Database size={17} /></span><div><strong>Scenario baseline</strong><p>Documented archetype and exposure assumptions</p></div><small>ASSUMED</small></li>
            <li><span><Globe2 size={17} /></span><div><strong>Cascade engine</strong><p>Signed edges, delays, saturation, synergies</p></div><small>MODELED</small></li>
            <li><span><Fingerprint size={17} /></span><div><strong>Decision artifact</strong><p>Metrics, caveats, sources, and reproducible hash</p></div><small>AUDITABLE</small></li>
          </ol>
        </section>
      </div>

      <section className="source-section">
        <div className="source-section-heading">
          <div><span className="page-kicker">SOURCE REGISTRY</span><h2>Context is not coefficient calibration.</h2></div>
          <div className="filter-tabs" role="group" aria-label="Filter evidence sources">
            {(['all', 'context', 'observations', 'assumptions'] as const).map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
        </div>
        {showSources && <div className="source-grid">
          {visibleSources.map((source, index) => (
            <article className="source-card" key={source.id}>
              <div className="source-card-top"><span>{String(index + 1).padStart(2, '0')}</span><StatusPill tone={source.role === 'observational_feed' ? 'green' : 'blue'}>{source.role === 'observational_feed' ? 'OBSERVATIONAL FEED' : 'CONTEXT ONLY'}</StatusPill></div>
              <span className="source-org">{source.organization} · {source.year}</span>
              <h3>{source.title}</h3>
              <p>{source.note}</p>
              <span className="source-calibration"><FileWarning size={13} /> DOES NOT CALIBRATE COEFFICIENTS</span>
              {source.url.startsWith('https://') ? <a href={source.url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={14} /></a> : <span className="internal-source"><BadgeCheck size={14} /> Documented below</span>}
            </article>
          ))}
        </div>}
      </section>

      {showAssumptions && <section className="source-section assumption-section" aria-labelledby="assumption-ledger-title">
        <div className="source-section-heading">
          <div><span className="page-kicker">NUMERIC ASSUMPTION LEDGER</span><h2 id="assumption-ledger-title">Every intervention number has an ID.</h2></div>
          <StatusPill tone="amber">{ASSUMPTION_PACK_VERSION}</StatusPill>
        </div>
        <p className="ledger-disclosure"><FileWarning size={15} /> Every value below is <strong>{MODEL_OUTPUT_STATUS}</strong>. Ranges are model-admissible control bounds, not evidence-based confidence intervals. Context-source links never calibrate these values.</p>
        <div className="source-grid assumption-grid">
          {assumptionGroups.map((entries) => (
            <article className="source-card assumption-card" key={entries[0]?.interventionId}>
              <div className="source-card-top"><span>{entries[0]?.interventionId.toUpperCase()}</span><StatusPill tone="amber">UNVALIDATED</StatusPill></div>
              <span className="source-org">INTERVENTION ASSUMPTIONS</span>
              <h3>{entries[0]?.interventionLabel}</h3>
              <ul className="assumption-list">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <div><code>{entry.id}</code><strong>{entry.parameterLabel}</strong></div>
                    <span>selected {entry.selectedValue} {entry.range.unit}</span>
                    <span>range {entry.range.minimum}–{entry.range.maximum} {entry.range.unit}</span>
                    <p>{entry.rationale}</p>
                    {entry.contextOnlySourceIds.length > 0 && <small>Context only: {entry.contextOnlySourceIds.join(', ')} · does not calibrate this value</small>}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>}

      <section className="source-section output-contract" aria-labelledby="output-contract-title">
        <div className="source-section-heading">
          <div><span className="page-kicker">OUTPUT CONTRACT</span><h2 id="output-contract-title">Every KPI is an illustrative proxy.</h2></div>
          <StatusPill tone="amber">{MODEL_OUTPUT_STATUS}</StatusPill>
        </div>
        <p className="ledger-disclosure"><Scale size={15} /> Sensitivity envelope: {SENSITIVITY_ENVELOPE_DEFINITION}</p>
        <div className="source-grid metric-contract-grid">
          {(Object.entries(KPI_METADATA) as [string, (typeof KPI_METADATA)[keyof typeof KPI_METADATA]][]).map(([id, metadata]) => (
            <article className="source-card metric-contract-card" key={id}>
              <div className="source-card-top"><code>{id}</code><StatusPill tone="amber">UNVALIDATED</StatusPill></div>
              <span className="source-org">{metadata.unit}</span>
              <p>{metadata.proxyDefinition}</p>
              <span className="internal-source"><Fingerprint size={13} /> {metadata.assumptionPackVersion}</span>
            </article>
          ))}
        </div>
      </section>

      <div className="evidence-bottom">
        <section className="panel live-ledger">
          <header className="panel-header"><div><span className="panel-kicker"><Radio size={14} /> CONTEXT LEDGER · NEVER MODEL INPUT</span><h2>{signalMode === 'live' ? 'Live public context events' : signalMode === 'partial' ? 'Partial public context events' : 'Synthetic demo events'}</h2></div><StatusPill tone={signalMode === 'live' ? 'green' : signalMode === 'partial' ? 'amber' : 'blue'} pulse={signalMode === 'live'}>{signalMode.toUpperCase()}</StatusPill></header>
          <div className="signal-table" role="table" aria-label="Current hazard signals">
            <div role="row" className="signal-table-head"><span role="columnheader">EVENT</span><span role="columnheader">TYPE</span><span role="columnheader">SOURCE</span><span role="columnheader">FRESHNESS</span><span role="columnheader">ILLUSTRATIVE DISPLAY SCORE</span></div>
            {events.slice(0, 6).map((event) => <div role="row" key={event.id}><span role="cell"><i className={`signal-dot event-${event.category}`} />{event.title}</span><span role="cell">{event.category}</span><span role="cell">{event.source}</span><span role="cell">{relativeTime(event.occurredAt)}</span><span role="cell"><b style={{ width: `${event.displayScore}%` }} /><strong>{Math.round(event.displayScore)}</strong></span></div>)}
          </div>
          <p className="signal-disclaimer">Events are display context only and never change a scenario automatically. The display score is a Morrow visualization heuristic—not provider severity. Morrow does not issue alerts or replace competent authorities.</p>
        </section>

        <section className="panel model-card">
          <header className="panel-header"><div><span className="panel-kicker">MODEL CARD</span><h2>Intended boundaries</h2></div></header>
          <div className="model-boundary intended"><BadgeCheck size={18} /><div><strong>Designed for</strong><ul><li>University teaching and tabletop exercises</li><li>Early-stage program comparison</li><li>Exploring causal assumptions and trade-offs</li></ul></div></div>
          <div className="model-boundary prohibited"><FileWarning size={18} /><div><strong>Not designed for</strong><ul><li>Authoritative emergency warnings</li><li>Individual eligibility or resource denial</li><li>Autonomous operational decisions</li></ul></div></div>
          <div className="privacy-line"><LockKeyhole size={15} /> No personal data · no exact vulnerable-person locations · no telemetry</div>
        </section>
      </div>
    </div>
  )
}
