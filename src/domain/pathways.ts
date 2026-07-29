import type { RiskState, SystemNodeId, TrajectoryPoint } from './types'

export interface CascadePathway {
  from: SystemNodeId
  to: Exclude<SystemNodeId, 'hazard'>
  weight: number
  delay: number
  assumptionId: string
}

export const CASCADE_PATHWAYS: readonly CascadePathway[] = [
  { from: 'hazard', to: 'communications', weight: 0.58, delay: 0, assumptionId: 'ASM-PATH-001' },
  { from: 'hazard', to: 'infrastructure', weight: 0.63, delay: 0, assumptionId: 'ASM-PATH-002' },
  { from: 'communications', to: 'displacement', weight: 0.05, delay: 3, assumptionId: 'ASM-PATH-003' },
  { from: 'infrastructure', to: 'displacement', weight: 0.21, delay: 4, assumptionId: 'ASM-PATH-004' },
  { from: 'infrastructure', to: 'water', weight: 0.2, delay: 8, assumptionId: 'ASM-PATH-005' },
  { from: 'infrastructure', to: 'markets', weight: 0.16, delay: 10, assumptionId: 'ASM-PATH-006' },
  { from: 'displacement', to: 'water', weight: 0.07, delay: 6, assumptionId: 'ASM-PATH-007' },
  { from: 'displacement', to: 'markets', weight: 0.08, delay: 10, assumptionId: 'ASM-PATH-008' },
  { from: 'displacement', to: 'health', weight: 0.12, delay: 6, assumptionId: 'ASM-PATH-009' },
  { from: 'water', to: 'health', weight: 0.17, delay: 8, assumptionId: 'ASM-PATH-010' },
  { from: 'markets', to: 'food', weight: 0.16, delay: 12, assumptionId: 'ASM-PATH-011' },
  { from: 'food', to: 'health', weight: 0.09, delay: 12, assumptionId: 'ASM-PATH-012' },
] as const

export function getPathway(from: SystemNodeId, to: Exclude<SystemNodeId, 'hazard'>): CascadePathway {
  const pathway = CASCADE_PATHWAYS.find((candidate) => candidate.from === from && candidate.to === to)
  if (!pathway) throw new Error(`Unknown cascade pathway: ${from} -> ${to}`)
  return pathway
}

export function sampleDelayedRisk(
  history: readonly TrajectoryPoint[],
  key: keyof RiskState,
  targetHour: number,
  current?: { hour: number; value: number },
): number {
  if (targetHour < 0) return 0

  const samples = history.map((point) => ({ hour: point.hour, value: point[key] }))
  if (current && current.hour >= targetHour) samples.push(current)
  samples.sort((a, b) => a.hour - b.hour)

  const exact = samples.find((sample) => sample.hour === targetHour)
  if (exact) return exact.value

  let before: { hour: number; value: number } | undefined
  let after: { hour: number; value: number } | undefined
  for (const sample of samples) {
    if (sample.hour < targetHour) before = sample
    if (sample.hour > targetHour) {
      after = sample
      break
    }
  }
  if (!before || !after) return before?.value ?? 0
  const progress = (targetHour - before.hour) / (after.hour - before.hour)
  return before.value + (after.value - before.value) * progress
}
