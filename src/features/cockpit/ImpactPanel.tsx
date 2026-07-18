import { ArrowRight, FileOutput, ShieldAlert, Sparkles } from 'lucide-react'
import { getIntervention } from '../../data/catalog'
import type { Scenario, SimulationResult } from '../../domain/types'

interface ImpactPanelProps {
  scenario: Scenario
  result: SimulationResult
  onRedTeam: () => void
  onOpenBrief: () => void
}

export function ImpactPanel({ scenario, result, onRedTeam, onOpenBrief }: ImpactPanelProps) {
  const stressed = scenario.stress >= 50
  const top = result.interventionSensitivity[0]
  return (
    <section className={`panel impact-panel${stressed ? ' stress-active' : ''}`} aria-labelledby="impact-title">
      <header className="panel-header">
        <div><span className="panel-kicker"><Sparkles size={14} /> MODEL EXPLAINS ITSELF</span><h2 id="impact-title">Why this plan moves</h2></div>
        <span className="fingerprint">{result.checksum}</span>
      </header>
      <div className="impact-narrative">
        <div className="impact-score"><span>STABILITY COMPOSITE</span><strong>{Math.round(result.metrics.stabilityComposite)}</strong><i style={{ '--score': `${result.metrics.stabilityComposite}%` } as React.CSSProperties} /></div>
        {stressed ? (
          <div><span className="failure-label"><ShieldAlert size={14} /> CORRELATED STRESS ACTIVE</span><h3>Access and power degrade together.</h3><p>The exercise applies a shared failure to infrastructure, route-dependent delivery, power, communications, and the assumption-variation envelope. Re-run portfolio search to inspect a stress-aware objective winner.</p></div>
        ) : (
          <div><span className="success-label">LARGEST ABLATION SENSITIVITY</span><h3>{top ? `${getIntervention(top.id).shortName} has the largest marginal modeled effect.` : 'Allocate an intervention to begin.'}</h3><p>{top ? `Removing this action produces ${top.normalizedSensitivity}% of the normalized one-at-a-time sensitivity shown below. Values can overlap through interactions and are not additive shares of real-world benefit.` : 'The baseline currently runs without an active response portfolio.'}</p></div>
        )}
      </div>
      <div className="attribution-list" aria-label="One-at-a-time model sensitivity by intervention">
        <div className="attribution-title"><span>ONE-AT-A-TIME SENSITIVITY</span><span>NORMALIZED WITHIN THIS LIST</span></div>
        {result.interventionSensitivity.slice(0, 4).map((item) => (
          <div key={item.id}><span>{item.label}</span><i><b style={{ width: `${item.normalizedSensitivity}%`, background: getIntervention(item.id).color }} /></i><strong>{item.normalizedSensitivity}%</strong></div>
        ))}
      </div>
      <div className="impact-actions">
        <button type="button" className={`button ${stressed ? 'button-ghost' : 'button-danger'}`} onClick={onRedTeam}><ShieldAlert size={16} /> {stressed ? 'Clear stress test' : 'Break my plan'}</button>
        <button type="button" className="text-action" onClick={onOpenBrief}><FileOutput size={15} /> Decision brief <ArrowRight size={14} /></button>
      </div>
      <p className="model-caveat">Unvalidated training output—not an operational forecast. Correlation does not establish causation.</p>
    </section>
  )
}
