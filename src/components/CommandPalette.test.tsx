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
})
