import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertNotAborted,
  normalizedBatchSize,
  yieldToEventLoop,
} from './cooperative'

afterEach(() => vi.useRealTimers())

describe('cooperative computation utilities', () => {
  it('normalizes invalid, low, fractional, and oversized batches', () => {
    expect(normalizedBatchSize(undefined, 8)).toBe(8)
    expect(normalizedBatchSize(Number.NaN, 8)).toBe(8)
    expect(normalizedBatchSize(0, 8)).toBe(1)
    expect(normalizedBatchSize(6.9, 8)).toBe(6)
    expect(normalizedBatchSize(100, 8)).toBe(32)
  })

  it('throws the standard abort-shaped error only for an aborted signal', () => {
    const controller = new AbortController()
    expect(() => assertNotAborted(controller.signal)).not.toThrow()
    controller.abort()
    expect(() => assertNotAborted(controller.signal)).toThrow(expect.objectContaining({ name: 'AbortError' }))
  })

  it('yields through a zero-delay event-loop task', async () => {
    vi.useFakeTimers()
    const yielded = yieldToEventLoop()
    await vi.runAllTimersAsync()
    await expect(yielded).resolves.toBeUndefined()
  })
})
