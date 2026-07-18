import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  BookOpenCheck,
  BrainCircuit,
  ChevronDown,
  Command,
  FileOutput,
  GitCompareArrows,
  Menu,
  Radio,
  Share2,
} from 'lucide-react'
import { Brand } from '../../components/Brand'
import { StatusPill } from '../../components/StatusPill'
import { presets } from '../../data/catalog'
import type { CockpitView } from '../../App'
import type { LiveEvent, PortfolioOption, PresetId, Scenario, SignalMode, SimulationResult } from '../../domain/types'
import { currencyMillions } from '../../utils/format'
import { CommandCenter } from './CommandCenter'
import { CascadeView } from '../cascade/CascadeView'
import { CompareView } from '../compare/CompareView'
import { EvidenceView } from '../evidence/EvidenceView'
import { DecisionBrief } from '../brief/DecisionBrief'

interface CockpitProps {
  view: CockpitView
  scenario: Scenario
  result: SimulationResult
  events: LiveEvent[]
  signalMode: SignalMode
  selectedHour: number
  portfolios: PortfolioOption[]
  optimizing: boolean
  briefOpen: boolean
  onViewChange: (view: CockpitView) => void
  onScenarioChange: (scenario: Scenario) => void
  onAllocationChange: (id: Scenario['allocations'][number]['id'], value: number) => void
  onPresetChange: (id: PresetId) => void
  onHourChange: (hour: number) => void
  onOptimize: () => void
  onApplyPortfolio: (portfolio: PortfolioOption) => void
  onRedTeam: () => void
  onOpenCommands: () => void
  onOpenBrief: () => void
  onCloseBrief: () => void
  onCopyShare: () => void
  onLeave: () => void
  notify: (text: string, kind?: 'success' | 'warning' | 'error') => void
}

const navigation: { id: CockpitView; label: string; icon: typeof Activity }[] = [
  { id: 'command', label: 'Command', icon: Activity },
  { id: 'cascade', label: 'Cascade', icon: BrainCircuit },
  { id: 'compare', label: 'Optimize', icon: GitCompareArrows },
  { id: 'evidence', label: 'Evidence', icon: BookOpenCheck },
]

export function Cockpit(props: CockpitProps) {
  const mainRef = useRef<HTMLElement>(null)
  const spent = props.scenario.allocations.reduce((sum, allocation) => sum + allocation.amount, 0)
  const routeKey = `${props.view}-${props.scenario.presetId}`

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const heading = mainRef.current?.querySelector('h1')
      if (heading instanceof HTMLElement) {
        heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [routeKey])

  return (
    <div className="cockpit-shell">
      <header className="cockpit-topbar">
        <div className="topbar-brand"><Brand onClick={props.onLeave} /><span className="topbar-separator" /></div>
        <div className="scenario-switcher">
          <span className="signal-icon"><Radio size={15} aria-hidden="true" /></span>
          <label htmlFor="scenario-preset"><span>ACTIVE SCENARIO</span><strong>{presets.find((preset) => preset.id === props.scenario.presetId)?.name}</strong></label>
          <select id="scenario-preset" value={props.scenario.presetId} onChange={(event) => props.onPresetChange(event.target.value as PresetId)}>
            {presets.map((preset) => <option value={preset.id} key={preset.id}>{preset.name} — {preset.location}</option>)}
          </select>
          <ChevronDown size={15} className="select-chevron" aria-hidden="true" />
        </div>
        <div className="topbar-status">
          <StatusPill tone={props.signalMode === 'live' ? 'green' : props.signalMode === 'partial' ? 'amber' : 'blue'} pulse={props.signalMode === 'live'}>
            {props.signalMode === 'live' ? 'LIVE CONTEXT · NOT MODEL INPUT' : props.signalMode === 'partial' ? 'PARTIAL CONTEXT · NOT MODEL INPUT' : 'SYNTHETIC DEMO EVENTS'}
          </StatusPill>
          <span className="budget-chip"><small>COMMITTED</small><strong>{currencyMillions(spent)}</strong><i>/ {currencyMillions(props.scenario.budget)}</i></span>
          <button className="command-trigger" type="button" onClick={props.onOpenCommands} aria-label="Open command palette">
            <Command size={15} /><span>Command</span><kbd>⌘ K</kbd>
          </button>
          <button className="icon-button" type="button" onClick={props.onCopyShare} aria-label="Copy reproducible scenario link"><Share2 size={18} /></button>
          <button className="button button-primary topbar-brief" type="button" onClick={props.onOpenBrief}><FileOutput size={16} /> Brief</button>
          <button className="icon-button mobile-menu" type="button" onClick={props.onOpenCommands} aria-label="Open menu"><Menu size={20} /></button>
        </div>
      </header>

      <aside className="cockpit-sidebar">
        <nav aria-label="Cockpit views">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={props.view === item.id ? 'active' : ''}
                onClick={() => props.onViewChange(item.id)}
                aria-current={props.view === item.id ? 'page' : undefined}
              >
                <Icon size={20} strokeWidth={1.8} /><span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-health" title="All local systems operational">
          <i /><span>LOCAL<br />READY</span>
        </div>
      </aside>

      <main ref={mainRef} id="main-content" className="cockpit-main">
        {props.view !== 'command' && (
          <div className="view-disclosure" role="note" aria-label="Model interpretation boundary">
            <StatusPill tone="red">FICTIONAL TRAINING SCENARIO</StatusPill>
            <StatusPill tone="amber">UNVALIDATED MODEL OUTPUTS</StatusPill>
            <span>Compare teaching-model proxies; do not treat them as forecasts or operational instructions.</span>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={routeKey}
            className="view-stage"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {props.view === 'command' && (
              <CommandCenter
                scenario={props.scenario}
                result={props.result}
                events={props.events}
                signalMode={props.signalMode}
                selectedHour={props.selectedHour}
                onHourChange={props.onHourChange}
                onAllocationChange={props.onAllocationChange}
                onOptimize={() => { props.onViewChange('compare'); props.onOptimize() }}
                onRedTeam={props.onRedTeam}
                onOpenBrief={props.onOpenBrief}
              />
            )}
            {props.view === 'cascade' && (
              <CascadeView
                scenario={props.scenario}
                result={props.result}
                selectedHour={props.selectedHour}
                onHourChange={props.onHourChange}
                onScenarioChange={props.onScenarioChange}
              />
            )}
            {props.view === 'compare' && (
              <CompareView
                scenario={props.scenario}
                result={props.result}
                portfolios={props.portfolios}
                optimizing={props.optimizing}
                onOptimize={props.onOptimize}
                onApply={props.onApplyPortfolio}
              />
            )}
            {props.view === 'evidence' && <EvidenceView signalMode={props.signalMode} events={props.events} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile cockpit views">
        {navigation.map((item) => {
          const Icon = item.icon
          return <button key={item.id} type="button" className={props.view === item.id ? 'active' : ''} onClick={() => props.onViewChange(item.id)} aria-current={props.view === item.id ? 'page' : undefined}><Icon size={19} /><span>{item.label}</span></button>
        })}
      </nav>

      <DecisionBrief
        open={props.briefOpen}
        scenario={props.scenario}
        result={props.result}
        onClose={props.onCloseBrief}
        onCopyShare={props.onCopyShare}
        notify={props.notify}
      />
    </div>
  )
}
