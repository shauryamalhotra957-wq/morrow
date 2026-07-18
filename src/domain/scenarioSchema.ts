import { z } from 'zod'
import { getIntervention, MODEL_VERSION, DATASET_VERSION } from '../data/catalog'
import { INTERVENTION_IDS, PRESET_IDS, type Scenario } from './types'

const interventionIdSchema = z.enum(INTERVENTION_IDS)

const allocationSchema = z
  .object({
    id: interventionIdSchema,
    amount: z.number().finite().min(0).max(100),
  })
  .strict()

export const scenarioSchema = z
  .object({
    schemaVersion: z.literal(1),
    modelVersion: z.literal(MODEL_VERSION),
    datasetVersion: z.literal(DATASET_VERSION),
    id: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
    name: z.string().trim().min(1).max(80),
    presetId: z.enum(PRESET_IDS),
    seed: z.number().int().min(0).max(4_294_967_295),
    budget: z.number().finite().min(1).max(80),
    hazardIntensity: z.number().finite().min(20).max(100),
    fragility: z.number().finite().min(10).max(100),
    stress: z.number().finite().min(15).max(80),
    allocations: z.array(allocationSchema).length(INTERVENTION_IDS.length),
    createdAt: z.string().max(64),
  })
  .strict()
  .superRefine((scenario, context) => {
    const ids = new Set(scenario.allocations.map((allocation) => allocation.id))
    if (ids.size !== INTERVENTION_IDS.length) {
      context.addIssue({ code: 'custom', path: ['allocations'], message: 'Each intervention must appear exactly once.' })
    }
    for (const allocation of scenario.allocations) {
      if (allocation.amount > getIntervention(allocation.id).maxAllocation) {
        context.addIssue({ code: 'custom', path: ['allocations'], message: `${allocation.id} exceeds its safe maximum.` })
      }
    }
    const total = scenario.allocations.reduce((sum, allocation) => sum + allocation.amount, 0)
    if (total > scenario.budget + 0.02) {
      context.addIssue({ code: 'custom', path: ['allocations'], message: 'Allocations exceed the available budget.' })
    }
  })

export function parseScenario(input: unknown): Scenario {
  const parsed = scenarioSchema.parse(input)
  return {
    ...parsed,
    allocations: parsed.allocations.map((allocation) => ({ ...allocation })),
  }
}
