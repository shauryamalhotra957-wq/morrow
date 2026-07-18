import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Command, Search, X } from 'lucide-react'

export interface CommandItem {
  id: string
  label: string
  hint: string
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  commands: CommandItem[]
  onClose: () => void
}

export function CommandPalette({ open, commands, onClose }: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const filtered = useMemo(
    () => commands.filter((command) => command.label.toLowerCase().includes(query.trim().toLowerCase())),
    [commands, query],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      window.requestAnimationFrame(() => inputRef.current?.focus())
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const run = (command: CommandItem) => {
    command.action()
    setQuery('')
    setActiveIndex(0)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="command-dialog"
      aria-labelledby="command-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="command-search">
        <Search size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="command-query" id="command-title">Search commands</label>
        <input
          ref={inputRef}
          id="command-query"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(0) }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, filtered.length - 1)) }
            if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)) }
            if (event.key === 'Enter' && filtered[activeIndex]) run(filtered[activeIndex])
          }}
          placeholder="Go somewhere or run an action…"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls="command-options"
          aria-activedescendant={filtered[activeIndex] ? `command-option-${filtered[activeIndex].id}` : undefined}
        />
        <kbd>ESC</kbd>
        <button className="command-close" type="button" onClick={onClose} aria-label="Close command palette"><X size={18} /></button>
      </div>
      <div id="command-options" className="command-list" role="listbox" aria-label="Available commands">
        {filtered.map((command, index) => (
          <button
            key={command.id}
            id={`command-option-${command.id}`}
            type="button"
            role="option"
            tabIndex={-1}
            aria-selected={index === activeIndex}
            className={index === activeIndex ? 'active' : ''}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => run(command)}
          >
            <span><Command size={15} aria-hidden="true" /> {command.label}</span>
            <span className="command-hint">{command.hint} <ArrowUpRight size={14} aria-hidden="true" /></span>
          </button>
        ))}
        {filtered.length === 0 && <p className="empty-command">No command matches “{query}”.</p>}
      </div>
      <footer>
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>↵</kbd> run</span>
        <span className="command-signature">Morrow command fabric</span>
      </footer>
    </dialog>
  )
}
