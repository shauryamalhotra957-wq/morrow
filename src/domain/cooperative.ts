export interface CooperativeOptions {
  signal?: AbortSignal
  batchSize?: number
  yieldControl?: () => Promise<void>
}

export class ComputationAbortedError extends Error {
  override readonly name = 'AbortError'

  constructor() {
    super('The computation was cancelled.')
  }
}

export function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new ComputationAbortedError()
}

export function normalizedBatchSize(requested: number | undefined, fallback: number): number {
  if (!Number.isFinite(requested)) return fallback
  return Math.max(1, Math.min(32, Math.trunc(requested ?? fallback)))
}

export function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
