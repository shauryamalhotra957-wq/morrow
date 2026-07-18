import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { createScenario } from '../../data/catalog'
import { simulateScenario } from '../../domain/simulator'
import { Landing } from './Landing'

describe('landing experience', () => {
  it('presents a working primary journey and key trust claims', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn()
    render(<Landing result={simulateScenario(createScenario(), 8)} onEnter={onEnter} />)
    expect(screen.getByRole('heading', { name: /inspect the cascade/i })).toBeInTheDocument()
    expect(screen.getByText(/futures are scenarios, not predictions/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /run the 72-hour rehearsal/i }))
    expect(onEnter).toHaveBeenCalledOnce()
  })

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<Landing result={simulateScenario(createScenario(), 8)} onEnter={() => undefined} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
