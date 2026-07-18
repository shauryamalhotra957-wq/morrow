export function compactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function currencyMillions(value: number): string {
  const sign = value < 0 ? '-' : ''
  const absolute = Math.abs(value)
  return `${sign}$${absolute.toFixed(absolute % 1 === 0 ? 0 : 1)}M`
}

export function currencyBillions(value: number): string {
  const sign = value < 0 ? '-' : ''
  return `${sign}$${Math.abs(value).toFixed(2)}B`
}

export function relativeTime(iso?: string): string {
  if (!iso) return 'timestamp unavailable'
  const timestamp = new Date(iso).getTime()
  if (!Number.isFinite(timestamp)) return 'timestamp unavailable'
  const elapsedHours = Math.max(0, Math.round((Date.now() - timestamp) / 3_600_000))
  if (elapsedHours < 1) return 'less than 1h ago'
  if (elapsedHours < 24) return `${elapsedHours}h ago`
  return `${Math.round(elapsedHours / 24)}d ago`
}
