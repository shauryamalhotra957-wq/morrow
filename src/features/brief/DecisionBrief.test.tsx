import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { createScenario } from '../../data/catalog'
import { simulateScenario } from '../../domain/simulator'
import { DecisionBrief } from './DecisionBrief'

describe('decision brief claim safety', () => {
  it('does not assert an intervention benefit for a zero-allocation scenario', () => {
    const scenario = createScenario()
    scenario.allocations = scenario.allocations.map((allocation) => ({ ...allocation, amount: 0 }))
    const result = simulateScenario(scenario, 8)
    const { container } = render(
      <DecisionBrief
        open={false}
        scenario={scenario}
        result={result}
        onClose={() => undefined}
        onCopyShare={() => undefined}
        notify={vi.fn()}
      />,
    )

    expect(screen.getByText(/no modeled improvement is produced/i)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/interrupts the cascade/i)
    expect(container.textContent).not.toMatch(/people protected/i)
    expect(container.textContent).not.toMatch(/loss avoided/i)
    expect(screen.getByText(/fictional training scenario/i)).toBeInTheDocument()
  })

  it('has no automatically detectable accessibility violations when open', async () => {
    const scenario = createScenario()
    const { container } = render(
      <DecisionBrief
        open
        scenario={scenario}
        result={simulateScenario(scenario, 8)}
        onClose={() => undefined}
        onCopyShare={() => undefined}
        notify={vi.fn()}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
