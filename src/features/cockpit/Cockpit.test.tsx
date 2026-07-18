import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { createScenario } from '../../data/catalog'
import { simulateScenario } from '../../domain/simulator'
import { snapshotEvents } from '../../services/liveEvents'
import { Cockpit } from './Cockpit'

describe('cockpit accessibility contract', () => {
  it('has no automatically detectable violations in the primary command view', async () => {
    const scenario = createScenario()
    const { container } = render(
      <Cockpit
        view="command"
        scenario={scenario}
        result={simulateScenario(scenario, 8)}
        events={snapshotEvents}
        signalMode="snapshot"
        selectedHour={24}
        portfolios={[]}
        optimizing={false}
        briefOpen={false}
        onViewChange={vi.fn()}
        onScenarioChange={vi.fn()}
        onAllocationChange={vi.fn()}
        onPresetChange={vi.fn()}
        onHourChange={vi.fn()}
        onOptimize={vi.fn()}
        onApplyPortfolio={vi.fn()}
        onRedTeam={vi.fn()}
        onOpenCommands={vi.fn()}
        onOpenBrief={vi.fn()}
        onCloseBrief={vi.fn()}
        onCopyShare={vi.fn()}
        onLeave={vi.fn()}
        notify={vi.fn()}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
