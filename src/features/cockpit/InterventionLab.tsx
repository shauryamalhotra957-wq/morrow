import { Cpu, Sparkles, WalletCards } from 'lucide-react'
import { getIntervention } from '../../data/catalog'
import type { Scenario } from '../../domain/types'
import { currencyMillions } from '../../utils/format'

interface InterventionLabProps {
  scenario: Scenario
  onChange: (id: Scenario['allocations'][number]['id'], value: number) => void
  onOptimize: () => void
}

export function InterventionLab({ scenario, onChange, onOptimize }: InterventionLabProps) {
  const spent = scenario.allocations.reduce((sum, allocation) => sum + allocation.amount, 0)
  const remaining = Math.max(0, scenario.budget - spent)
  return (
    <section className="panel intervention-panel" aria-labelledby="intervention-title">
      <header className="panel-header intervention-header">
        <div><span className="panel-kicker"><WalletCards size={14} /> POLICY PORTFOLIO</span><h2 id="intervention-title">Allocate the response</h2></div>
        <div className="budget-orb" aria-label={`${currencyMillions(remaining)} unallocated`}>
          <svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" /><circle cx="22" cy="22" r="18" style={{ strokeDashoffset: 113 - (spent / scenario.budget) * 113 }} /></svg>
          <span><strong>{currencyMillions(remaining)}</strong><small>LEFT</small></span>
        </div>
      </header>
      <div className="allocation-list">
        {scenario.allocations.map((allocation) => {
          const definition = getIntervention(allocation.id)
          const maxAvailable = Math.min(definition.maxAllocation, allocation.amount + remaining)
          return (
            <div className="allocation-row" key={allocation.id} style={{ '--intervention': definition.color } as React.CSSProperties}>
              <div className="allocation-copy">
                <span className="allocation-dot" />
                <label htmlFor={`allocation-${allocation.id}`}>{definition.shortName}<small>{definition.category} · {definition.deployDelay === 0 ? 'immediate readiness' : `onset +${definition.deployDelay}h · full +${definition.deployDelay + 18}h`}</small></label>
                <output htmlFor={`allocation-${allocation.id}`}>{currencyMillions(allocation.amount)}</output>
              </div>
              <input
                id={`allocation-${allocation.id}`}
                type="range"
                min="0"
                max={definition.maxAllocation}
                step="0.5"
                value={allocation.amount}
                aria-valuetext={`${currencyMillions(allocation.amount)} allocated to ${definition.name}`}
                onChange={(event) => onChange(allocation.id, Math.min(Number(event.target.value), maxAvailable))}
                style={{ '--progress': `${(allocation.amount / definition.maxAllocation) * 100}%` } as React.CSSProperties}
              />
              <p className="allocation-description">{definition.description}</p>
            </div>
          )
        })}
      </div>
      <div className="allocation-footer">
        <div><span>Committed</span><strong>{currencyMillions(spent)} <small>of {currencyMillions(scenario.budget)}</small></strong></div>
        <button className="button button-primary optimize-button" type="button" onClick={onOptimize}><Sparkles size={16} /> Find efficient portfolios</button>
        <p><Cpu size={13} /> 160 deterministic candidates · runs locally</p>
      </div>
    </section>
  )
}
