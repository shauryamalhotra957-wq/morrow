import { describe, expect, it } from 'vitest'
import { createScenario } from '../data/catalog'
import { scenarioSchema } from './scenarioSchema'

describe('scenario schema', () => {
  it('accepts the documented nominal stress floor', () => {
    expect(scenarioSchema.safeParse({ ...createScenario(), stress: 15 }).success).toBe(true)
    expect(scenarioSchema.safeParse({ ...createScenario(), stress: 14 }).success).toBe(false)
  })

  it('accepts the documented stress ceiling', () => {
    expect(scenarioSchema.safeParse({ ...createScenario(), stress: 80 }).success).toBe(true)
  })

  it('rejects stress above the documented control range', () => {
    const parsed = scenarioSchema.safeParse({ ...createScenario(), stress: 81 })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: ['stress'], code: 'too_big' }),
      ]))
    }
  })
})
