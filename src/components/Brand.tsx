import { Orbit } from 'lucide-react'

interface BrandProps {
  compact?: boolean
  onClick?: () => void
}

export function Brand({ compact = false, onClick }: BrandProps) {
  const content = (
    <>
      <span className="brand-mark" aria-hidden="true">
        <Orbit size={19} strokeWidth={1.8} />
        <span />
      </span>
      {!compact && (
        <span className="brand-word">
          MORROW <small>REHEARSAL LAB</small>
        </span>
      )}
    </>
  )

  return onClick ? (
    <button className="brand brand-button" type="button" onClick={onClick} aria-label="Return to Morrow home">
      {content}
    </button>
  ) : (
    <div className="brand">{content}</div>
  )
}
