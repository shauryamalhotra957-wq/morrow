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
  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return commands
    return commands.filter((command) => {
      const searchable = `${command.label} ${command.hint}`.toLowerCase()
      return tokens.every((token) => searchable.includes(token))
    })
  }, [commands, query])
  const safeActiveIndex = filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1)

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

  useEffect(() => {
    const active = filtered[safeActiveIndex]
    if (!active) return
    document.getElementById(`command-option-${active.id}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [filtered, safeActiveIndex])

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
            if (filtered.length === 0) return
            if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => (index + 1) % filtered.length) }
            if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => (index - 1 + filtered.length) % filtered.length) }
            if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0) }
            if (event.key === 'End') { event.preventDefault(); setActiveIndex(filtered.length - 1) }
            if (event.key === 'Enter' && filtered[safeActiveIndex]) run(filtered[safeActiveIndex])
          }}
          placeholder="Go somewhere or run an action…"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls="command-options"
          aria-activedescendant={filtered[safeActiveIndex] ? `command-option-${filtered[safeActiveIndex].id}` : undefined}
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
            aria-selected={index === safeActiveIndex}
            className={index === safeActiveIndex ? 'active' : ''}
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
        <span className="command-count" role="status" aria-live="polite">{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
        <span className="command-signature">Morrow command fabric</span>
      </footer>
    </dialog>
  )
}
