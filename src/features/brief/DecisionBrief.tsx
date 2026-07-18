import { useEffect, useRef } from 'react'
import {
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileJson,
  FileSpreadsheet,
  Printer,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Brand } from '../../components/Brand'
import { getIntervention, getPreset } from '../../data/catalog'
import { evidenceSources } from '../../data/sources'
import type { Scenario, SimulationResult } from '../../domain/types'
import { exportScenarioJson, exportTrajectoryCsv } from '../../services/export'
import { saveScenario } from '../../services/storage'
import { compactNumber, currencyBillions, currencyMillions } from '../../utils/format'

interface DecisionBriefProps {
  open: boolean
  scenario: Scenario
  result: SimulationResult
  onClose: () => void
  onCopyShare: () => void
  notify: (text: string, kind?: 'success' | 'warning' | 'error') => void
}

export function DecisionBrief({ open, scenario, result, onClose, onCopyShare, notify }: DecisionBriefProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const preset = getPreset(scenario.presetId)
  const final = result.trajectory.at(-1)!
  const residual = [
    ['Health load', final.health],
    ['Food insecurity', final.food],
    ['Water insecurity', final.water],
    ['Infrastructure failure', final.infrastructure],
    ['Market disruption', final.markets],
  ].sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 3)
  const committed = scenario.allocations.reduce((sum, item) => sum + item.amount, 0)
  const largestResidual = String(residual[0]?.[0] ?? 'System pressure')
  const strongestSensitivity = result.interventionSensitivity[0]?.label
  const executiveHeadline = committed <= 0 || result.metrics.protectionProxy <= 0
    ? `No modeled improvement is produced; ${largestResidual.toLowerCase()} is the largest residual at T+72h.`
    : `Modeled pressure falls relative to no action; ${largestResidual.toLowerCase()} is the largest residual at T+72h.`
  const funded = new Map(scenario.allocations.map((allocation) => [allocation.id, allocation.amount]))
  const exercisePrompt = (funded.get('road-recovery') ?? 0) > 0 || (funded.get('supply-staging') ?? 0) > 0
    ? 'Exercise prompt: delay route recovery and staged-supply access by 12 hours, then compare the resulting residual-risk shape.'
    : (funded.get('microgrids') ?? 0) > 0
      ? 'Exercise prompt: delay mobile power by 12 hours, then inspect communications, water, and health pressure.'
      : (funded.get('early-warning') ?? 0) > 0 || (funded.get('evacuation') ?? 0) > 0
        ? 'Exercise prompt: reduce assumed warning reach, then inspect displacement and downstream health pressure.'
        : 'Exercise prompt: fund one early action and one recovery action, then compare the result with this no-action baseline.'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="brief-dialog"
      aria-labelledby="brief-title"
      onClose={onClose}
      onCancel={(event) => { event.preventDefault(); onClose() }}
    >
      <div className="brief-toolbar no-print">
        <div><Brand /><span>DECISION BRIEF PREVIEW</span></div>
        <div>
          <button className="button button-quiet" type="button" onClick={() => { try { saveScenario(scenario); notify('A new immutable scenario version was saved locally.') } catch (error) { notify(error instanceof Error ? error.message : 'Scenario save failed.', 'error') } }}><Save size={15} /><span>Save</span></button>
          <button className="button button-quiet" type="button" onClick={onCopyShare}><ClipboardCopy size={15} /><span>Share</span></button>
          <button className="button button-quiet" type="button" onClick={() => exportTrajectoryCsv(scenario, result)}><FileSpreadsheet size={15} /><span>CSV</span></button>
          <button className="button button-quiet" type="button" onClick={() => exportScenarioJson(scenario, result)}><FileJson size={15} /><span>JSON</span></button>
          <button className="button button-primary" type="button" onClick={() => window.print()}><Printer size={15} /><span>Print / PDF</span></button>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close decision brief"><X size={19} /></button>
        </div>
      </div>
      <article className="decision-brief">
        <header className="brief-cover">
          <div className="brief-cover-top"><Brand /><span>FICTIONAL TRAINING SCENARIO · UNVALIDATED OUTPUTS</span></div>
          <div className="brief-title-block">
            <span>{preset.eyebrow}</span>
            <h1 id="brief-title">{preset.name}<br /><small>{preset.location}</small></h1>
            <p>{preset.narrative}</p>
          </div>
          <div className="brief-fingerprint"><span>SCENARIO FINGERPRINT</span><strong>{result.checksum}</strong><small>MODEL {scenario.modelVersion} · ASSUMPTION PACK {scenario.datasetVersion}</small></div>
        </header>

        <section className="brief-executive">
          <div className="brief-section-label">01 / EXECUTIVE SIGNAL</div>
          <div className="executive-grid">
            <div><h2>{executiveHeadline}</h2><p>This is a deterministic training comparison using unvalidated proxies. {strongestSensitivity ? `${strongestSensitivity} has the largest normalized one-at-a-time model sensitivity.` : 'No funded action produces an ablation sensitivity.'} It is not an estimate of real people, loss, or operational performance.</p></div>
            <div className="brief-verdict"><ShieldCheck size={28} /><span>STABILITY COMPOSITE</span><strong>{Math.round(result.metrics.stabilityComposite)}<small>/100</small></strong><p>Composite score under this seeded assumption-variation set; not calibrated confidence or probability.</p></div>
          </div>
        </section>

        <section className="brief-outcomes">
          <div className="brief-section-label">02 / MODELED OUTCOMES</div>
          <div className="brief-kpis">
            <div><span>PROTECTION PROXY</span><strong>{compactNumber(result.metrics.protectionProxy)}</strong><small>modeled equivalent delta</small></div>
            <div><span>LOSS PROXY DELTA</span><strong>{currencyBillions(result.metrics.lossProxyDelta)}</strong><small>illustrative exposure formula</small></div>
            <div><span>MOBILIZATION PROXY</span><strong>{result.metrics.mobilizationHours}h</strong><small>assumed deployment delays</small></div>
            <div><span>INCLUSION PROXY</span><strong>{Math.round(result.metrics.inclusionProxy)}</strong><small>portfolio-intent formula</small></div>
          </div>
        </section>

        <section className="brief-two-column">
          <div>
            <div className="brief-section-label">03 / RESPONSE PORTFOLIO</div>
            <div className="brief-allocations">
              {scenario.allocations.filter((allocation) => allocation.amount > 0).sort((a, b) => b.amount - a.amount).map((allocation) => {
                const definition = getIntervention(allocation.id)
                return <div key={allocation.id}><i style={{ background: definition.color }} /><span><strong>{definition.shortName}</strong><small>{definition.category} · {definition.deployDelay === 0 ? 'immediate readiness' : `onset +${definition.deployDelay}h · full +${definition.deployDelay + 18}h`}</small></span><b>{currencyMillions(allocation.amount)}</b></div>
              })}
            </div>
            <div className="brief-budget"><span>TOTAL COMMITTED</span><strong>{currencyMillions(committed)}</strong><small> / {currencyMillions(scenario.budget)} ceiling</small></div>
          </div>
          <div>
            <div className="brief-section-label">04 / RESIDUAL RISK</div>
            <div className="brief-residuals">
              {residual.map(([label, value], index) => <div key={String(label)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{label}</strong><i><b style={{ width: `${Number(value)}%` }} /></i><small>{Math.round(Number(value))}</small></div>)}
            </div>
            <div className="brief-action"><CheckCircle2 size={18} /><p><strong>Facilitator prompt</strong> {exercisePrompt}</p></div>
          </div>
        </section>

        <section className="brief-sources">
          <div className="brief-section-label">05 / EVIDENCE & LIMITS</div>
          <div className="brief-source-grid">
            <div>
              <h3>Context sources (not coefficient calibration)</h3>
              {evidenceSources.filter((source) => source.kind !== 'illustrative assumption').slice(0, 5).map((source) => <p key={source.id}><span>[{source.id}]</span><strong>{source.organization}</strong> — {source.title}, {source.year}</p>)}
            </div>
            <div>
              <h3>Required interpretation</h3>
              <ul><li>Fictional scenario and unvalidated outputs; not an operational forecast.</li><li>Intervention effects are transparent teaching assumptions, not proven causal estimates.</li><li>The assumption-variation envelope is not a confidence or probability interval.</li><li>Do not use for individual eligibility, resource denial, or authoritative warnings.</li></ul>
            </div>
          </div>
        </section>
        <footer className="brief-footer"><span>MORROW / OPEN DECISION REHEARSAL</span><p>Generated locally. No personal data, account, or telemetry.</p><span>{result.checksum}</span></footer>
      </article>
      <div className="brief-download no-print"><Download size={16} /> Use “Print / PDF” for the designed briefing artifact, or JSON/CSV for reproducible analysis.</div>
    </dialog>
  )
}
