import { FileOutput, ShieldAlert } from 'lucide-react'
import { getPreset } from '../../data/catalog'
import type { LiveEvent, Scenario, SignalMode, SimulationResult } from '../../domain/types'
import { StatusPill } from '../../components/StatusPill'
import { MetricDeck } from './MetricDeck'
import { CrisisMap } from './CrisisMap'
import { InterventionLab } from './InterventionLab'
import { RiskChart } from './RiskChart'
import { ImpactPanel } from './ImpactPanel'

interface CommandCenterProps {
  scenario: Scenario
  result: SimulationResult
  events: LiveEvent[]
  signalMode: SignalMode
  selectedHour: number
  onHourChange: (hour: number) => void
  onAllocationChange: (id: Scenario['allocations'][number]['id'], value: number) => void
  onOptimize: () => void
  onRedTeam: () => void
  onOpenBrief: () => void
}

export function CommandCenter(props: CommandCenterProps) {
  const preset = getPreset(props.scenario.presetId)
  return (
    <div className="command-center">
      <section className="mission-strip">
        <div>
          <div className="mission-eyebrow"><StatusPill tone="red">FICTIONAL TRAINING SCENARIO</StatusPill><StatusPill tone="amber">UNVALIDATED OUTPUTS</StatusPill><span>SCENARIO / {props.scenario.presetId.toUpperCase()}</span></div>
          <h1>{preset.name} <span>— {preset.location}</span></h1>
          <p>{preset.narrative}</p>
        </div>
        <div className="mission-actions">
          <div><span>HAZARD</span><strong>{props.scenario.hazardIntensity}</strong><i> / 100</i></div>
          <div><span>FRAGILITY</span><strong>{props.scenario.fragility}</strong><i> / 100</i></div>
          {props.scenario.stress >= 50 && <StatusPill tone="red" pulse><ShieldAlert size={13} /> RED TEAM ACTIVE</StatusPill>}
          <button type="button" className="button button-quiet" onClick={props.onOpenBrief}><FileOutput size={15} /> Generate brief</button>
        </div>
      </section>
      <MetricDeck result={props.result} />
      <div className="command-grid">
        <CrisisMap scenario={props.scenario} result={props.result} events={props.events} signalMode={props.signalMode} selectedHour={props.selectedHour} onHourChange={props.onHourChange} />
        <InterventionLab scenario={props.scenario} onChange={props.onAllocationChange} onOptimize={props.onOptimize} />
        <RiskChart result={props.result} />
        <ImpactPanel scenario={props.scenario} result={props.result} onRedTeam={props.onRedTeam} onOpenBrief={props.onOpenBrief} />
      </div>
    </div>
  )
}
