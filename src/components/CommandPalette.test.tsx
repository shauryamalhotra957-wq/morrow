import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { CommandPalette } from './CommandPalette'

describe('command palette', () => {
  it('exposes an announced active option and a touch-accessible close action', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(
      <CommandPalette
        open
        commands={[{ id: 'command', label: 'Open command center', hint: 'VIEW', action: vi.fn() }]}
        onClose={onClose}
      />,
    )
    const input = screen.getByRole('combobox', { name: /search commands/i })
    expect(input).toHaveAttribute('aria-controls', 'command-options')
    expect(input).toHaveAttribute('aria-activedescendant', 'command-option-command')
    await user.click(screen.getByRole('button', { name: /close command palette/i }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('searches labels and hints, then wraps keyboard navigation', async () => {
    const user = userEvent.setup()
    const firstAction = vi.fn()
    const secondAction = vi.fn()
    render(
      <CommandPalette
        open
        commands={[
          { id: 'command', label: 'Open command center', hint: 'VIEW', action: firstAction },
          { id: 'brief', label: 'Export decision brief', hint: 'DOCUMENT', action: secondAction },
        ]}
        onClose={vi.fn()}
      />,
    )

    const input = screen.getByRole('combobox', { name: /search commands/i })
    await user.type(input, 'document')
    expect(screen.getByRole('option', { name: /export decision brief/i })).toBeVisible()
    expect(screen.queryByRole('option', { name: /open command center/i })).not.toBeInTheDocument()

    await user.clear(input)
    await user.keyboard('{ArrowUp}{Enter}')
    expect(secondAction).toHaveBeenCalledOnce()
  })
})
