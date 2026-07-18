import type { ReactNode } from 'react'

interface StatusPillProps {
  children: ReactNode
  tone?: 'green' | 'blue' | 'amber' | 'red' | 'neutral'
  pulse?: boolean
}

export function StatusPill({ children, tone = 'neutral', pulse = false }: StatusPillProps) {
  return <span className={`status-pill status-${tone}${pulse ? ' status-pulse' : ''}`}>{children}</span>
}
