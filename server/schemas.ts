import { z } from 'zod'
import { scenarioSchema } from '../src/domain/scenarioSchema'

export const simulateRequestSchema = z
  .object({
    scenario: scenarioSchema,
    samples: z.number().int().min(8).max(96).default(48),
  })
  .strict()

export const optimizeRequestSchema = z
  .object({
    scenario: scenarioSchema,
    candidates: z.number().int().min(40).max(320).default(160),
  })
  .strict()

export const contextEventsQuerySchema = z
  .object({
    mode: z.enum(['auto', 'snapshot']).default('auto'),
  })
  .strict()

export type SimulateRequest = z.infer<typeof simulateRequestSchema>
export type OptimizeRequest = z.infer<typeof optimizeRequestSchema>
