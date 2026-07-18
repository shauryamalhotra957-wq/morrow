import type {
  InterventionDefinition,
  InterventionId,
  NumericAssumption,
  SystemNodeId,
} from '../domain/types'

export const ASSUMPTION_PACK_VERSION = 'morrow-assumption-pack-1.0.0'

type EffectNode = Exclude<SystemNodeId, 'hazard'>

interface InterventionAssumptionBundle {
  deployDelay: NumericAssumption
  maxAllocation: NumericAssumption
  effects: Partial<Record<EffectNode, NumericAssumption>>
}
interface AssumptionInput {
  id: string
  interventionId: InterventionId
  interventionLabel: string
  parameter: NumericAssumption['parameter']
  parameterLabel: string
  selectedValue: number
  minimum: number
  maximum: number
  unit: string
  rationale: string
  contextOnlySourceIds?: string[]
}

function assumption(input: AssumptionInput): NumericAssumption {
  return {
    id: input.id,
    packVersion: ASSUMPTION_PACK_VERSION,
    status: 'illustrative_unvalidated',
    interventionId: input.interventionId,
    interventionLabel: input.interventionLabel,
    parameter: input.parameter,
    parameterLabel: input.parameterLabel,
    selectedValue: input.selectedValue,
    range: {
      minimum: input.minimum,
      maximum: input.maximum,
      unit: input.unit,
      meaning: 'model_admissible_range',
    },
    rationale: input.rationale,
    contextOnlySourceIds: input.contextOnlySourceIds ?? [],
  }
}

function delay(
  id: string,
  interventionId: InterventionId,
  interventionLabel: string,
  selectedValue: number,
): NumericAssumption {
  return assumption({
    id,
    interventionId,
    interventionLabel,
    parameter: 'deploy_delay',
    parameterLabel: 'Deployment delay',
    selectedValue,
    minimum: 0,
    maximum: 72,
    unit: 'hours',
    rationale: 'Teaching value chosen to make timing trade-offs visible; it is not estimated from deployment records.',
  })
}

function cap(
  id: string,
  interventionId: InterventionId,
  interventionLabel: string,
  selectedValue: number,
): NumericAssumption {
  return assumption({
    id,
    interventionId,
    interventionLabel,
    parameter: 'allocation_cap',
    parameterLabel: 'Scenario allocation cap',
    selectedValue,
    minimum: 0,
    maximum: 80,
    unit: 'USD millions (illustrative)',
    rationale: 'Teaching ceiling chosen to create a constrained portfolio exercise; it is not a procurement or cost estimate.',
  })
}

function effect(
  id: string,
  interventionId: InterventionId,
  interventionLabel: string,
  node: EffectNode,
  selectedValue: number,
  contextOnlySourceIds: string[] = [],
): NumericAssumption {
  return assumption({
    id,
    interventionId,
    interventionLabel,
    parameter: `effect.${node}`,
    parameterLabel: `Effect on ${node}`,
    selectedValue,
    minimum: 0,
    maximum: 1,
    unit: 'dimensionless model strength',
    rationale: `Illustrative attenuation strength applied to the ${node} pressure node; it is not a measured or proven causal effect.`,
    contextOnlySourceIds,
  })
}

export const interventionAssumptionBundles: Record<InterventionId, InterventionAssumptionBundle> = {
  'early-warning': {
    deployDelay: delay('ASM-EW-DELAY', 'early-warning', 'Last-mile early warning', 0),
    maxAllocation: cap('ASM-EW-CAP', 'early-warning', 'Last-mile early warning', 8),
    effects: {
      communications: effect('ASM-EW-COMMS', 'early-warning', 'Last-mile early warning', 'communications', 0.72, ['wmo-mhews-2025']),
      displacement: effect('ASM-EW-DISPLACE', 'early-warning', 'Last-mile early warning', 'displacement', 0.2, ['wmo-mhews-2025']),
      health: effect('ASM-EW-HEALTH', 'early-warning', 'Last-mile early warning', 'health', 0.12, ['wmo-mhews-2025']),
    },
  },
  evacuation: {
    deployDelay: delay('ASM-EVAC-DELAY', 'evacuation', 'Assisted evacuation', 3),
    maxAllocation: cap('ASM-EVAC-CAP', 'evacuation', 'Assisted evacuation', 11),
    effects: {
      displacement: effect('ASM-EVAC-DISPLACE', 'evacuation', 'Assisted evacuation', 'displacement', 0.56),
      health: effect('ASM-EVAC-HEALTH', 'evacuation', 'Assisted evacuation', 'health', 0.25),
      infrastructure: effect('ASM-EVAC-INFRA', 'evacuation', 'Assisted evacuation', 'infrastructure', 0.08),
    },
  },
  'mobile-clinics': {
    deployDelay: delay('ASM-CLINIC-DELAY', 'mobile-clinics', 'Mobile health teams', 8),
    maxAllocation: cap('ASM-CLINIC-CAP', 'mobile-clinics', 'Mobile health teams', 10),
    effects: {
      health: effect('ASM-CLINIC-HEALTH', 'mobile-clinics', 'Mobile health teams', 'health', 0.68, ['who-climate-health-2025']),
      water: effect('ASM-CLINIC-WATER', 'mobile-clinics', 'Mobile health teams', 'water', 0.1, ['who-climate-health-2025']),
    },
  },
  'clean-water': {
    deployDelay: delay('ASM-WATER-DELAY', 'clean-water', 'Emergency clean water', 6),
    maxAllocation: cap('ASM-WATER-CAP', 'clean-water', 'Emergency clean water', 9),
    effects: {
      water: effect('ASM-WATER-WATER', 'clean-water', 'Emergency clean water', 'water', 0.76),
      health: effect('ASM-WATER-HEALTH', 'clean-water', 'Emergency clean water', 'health', 0.24),
      displacement: effect('ASM-WATER-DISPLACE', 'clean-water', 'Emergency clean water', 'displacement', 0.08),
    },
  },
  'cash-support': {
    deployDelay: delay('ASM-CASH-DELAY', 'cash-support', 'Targeted cash support', 10),
    maxAllocation: cap('ASM-CASH-CAP', 'cash-support', 'Targeted cash support', 10),
    effects: {
      markets: effect('ASM-CASH-MARKETS', 'cash-support', 'Targeted cash support', 'markets', 0.54, ['wfp-aa-2025']),
      food: effect('ASM-CASH-FOOD', 'cash-support', 'Targeted cash support', 'food', 0.42, ['wfp-aa-2025']),
      displacement: effect('ASM-CASH-DISPLACE', 'cash-support', 'Targeted cash support', 'displacement', 0.16, ['wfp-aa-2025']),
    },
  },
  'road-recovery': {
    deployDelay: delay('ASM-ROADS-DELAY', 'road-recovery', 'Critical route recovery', 14),
    maxAllocation: cap('ASM-ROADS-CAP', 'road-recovery', 'Critical route recovery', 12),
    effects: {
      infrastructure: effect('ASM-ROADS-INFRA', 'road-recovery', 'Critical route recovery', 'infrastructure', 0.62),
      food: effect('ASM-ROADS-FOOD', 'road-recovery', 'Critical route recovery', 'food', 0.24),
      markets: effect('ASM-ROADS-MARKETS', 'road-recovery', 'Critical route recovery', 'markets', 0.18),
      health: effect('ASM-ROADS-HEALTH', 'road-recovery', 'Critical route recovery', 'health', 0.1),
    },
  },
  microgrids: {
    deployDelay: delay('ASM-GRID-DELAY', 'microgrids', 'Critical-facility microgrids', 12),
    maxAllocation: cap('ASM-GRID-CAP', 'microgrids', 'Critical-facility microgrids', 10),
    effects: {
      infrastructure: effect('ASM-GRID-INFRA', 'microgrids', 'Critical-facility microgrids', 'infrastructure', 0.38, ['iea-weo-2025']),
      communications: effect('ASM-GRID-COMMS', 'microgrids', 'Critical-facility microgrids', 'communications', 0.26, ['iea-weo-2025']),
      health: effect('ASM-GRID-HEALTH', 'microgrids', 'Critical-facility microgrids', 'health', 0.16, ['iea-weo-2025']),
      water: effect('ASM-GRID-WATER', 'microgrids', 'Critical-facility microgrids', 'water', 0.14, ['iea-weo-2025']),
    },
  },
  'supply-staging': {
    deployDelay: delay('ASM-SUPPLY-DELAY', 'supply-staging', 'Pre-positioned essentials', 2),
    maxAllocation: cap('ASM-SUPPLY-CAP', 'supply-staging', 'Pre-positioned essentials', 10),
    effects: {
      food: effect('ASM-SUPPLY-FOOD', 'supply-staging', 'Pre-positioned essentials', 'food', 0.64, ['wfp-aa-2025']),
      health: effect('ASM-SUPPLY-HEALTH', 'supply-staging', 'Pre-positioned essentials', 'health', 0.18, ['wfp-aa-2025']),
      displacement: effect('ASM-SUPPLY-DISPLACE', 'supply-staging', 'Pre-positioned essentials', 'displacement', 0.14, ['wfp-aa-2025']),
      markets: effect('ASM-SUPPLY-MARKETS', 'supply-staging', 'Pre-positioned essentials', 'markets', 0.12, ['wfp-aa-2025']),
    },
  },
}

export const assumptionLedger: NumericAssumption[] = Object.values(interventionAssumptionBundles).flatMap((bundle) => [
  bundle.deployDelay,
  bundle.maxAllocation,
  ...Object.values(bundle.effects).filter((entry): entry is NumericAssumption => Boolean(entry)),
])

export function assumedInterventionParameters(
  interventionId: InterventionId,
): Pick<InterventionDefinition, 'deployDelay' | 'maxAllocation' | 'effects' | 'assumptionIds'> {
  const bundle = interventionAssumptionBundles[interventionId]
  const effectEntries = Object.entries(bundle.effects) as [EffectNode, NumericAssumption][]
  return {
    deployDelay: bundle.deployDelay.selectedValue,
    maxAllocation: bundle.maxAllocation.selectedValue,
    effects: Object.fromEntries(effectEntries.map(([node, entry]) => [node, entry.selectedValue])) as Partial<Record<SystemNodeId, number>>,
    assumptionIds: {
      deployDelay: bundle.deployDelay.id,
      maxAllocation: bundle.maxAllocation.id,
      effects: Object.fromEntries(effectEntries.map(([node, entry]) => [node, entry.id])) as Partial<Record<SystemNodeId, string>>,
    },
  }
}
