import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createScenario } from '../../data/catalog'
import { InterventionLab } from './InterventionLab'

describe('intervention lab', () => {
  it('exposes labeled keyboard-operable allocation controls', async () => {
    const scenario = createScenario()
    const onChange = vi.fn()
    render(<InterventionLab scenario={scenario} onChange={onChange} onOptimize={() => undefined} />)
    const slider = screen.getByRole('slider', { name: /early warning/i })
    fireEvent.change(slider, { target: { value: '4.5' } })
    expect(onChange).toHaveBeenCalledWith('early-warning', 4.5)
    expect(screen.getByRole('button', { name: /find efficient portfolios/i })).toBeInTheDocument()
  })
})
