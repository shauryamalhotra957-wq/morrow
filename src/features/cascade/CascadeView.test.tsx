import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createScenario } from '../../data/catalog'
import { getPathway } from '../../domain/pathways'
import { simulateScenario } from '../../domain/simulator'
import { CascadeView } from './CascadeView'

describe('cascade assumption atlas', () => {
  it('describes the communications pathway with the same zero lag used by the model', () => {
    const scenario = createScenario()
    render(
      <CascadeView
        scenario={scenario}
        result={simulateScenario(scenario, 8)}
        selectedHour={24}
        onHourChange={vi.fn()}
        onScenarioChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /communications gap/i }))
    const declaredDelay = getPathway('hazard', 'communications').delay
    expect(declaredDelay).toBe(0)
    expect(screen.getByText(`53% persistence + direct (${declaredDelay}h-lag) hazard pressure`)).toBeVisible()
    expect(screen.getByText(new RegExp(`${declaredDelay}h lag`))).toBeVisible()
  })
})
