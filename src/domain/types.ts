export const INTERVENTION_IDS = [
  'early-warning',
  'evacuation',
  'mobile-clinics',
  'clean-water',
  'cash-support',
  'road-recovery',
  'microgrids',
  'supply-staging',
] as const

export type InterventionId = (typeof INTERVENTION_IDS)[number]

export const PRESET_IDS = ['coastal-cyclone', 'heat-water-grid', 'urban-earthquake'] as const
export type PresetId = (typeof PRESET_IDS)[number]

export const SYSTEM_NODE_IDS = [
  'hazard',
  'communications',
  'infrastructure',
  'displacement',
  'water',
  'food',
  'health',
  'markets',
] as const

export type SystemNodeId = (typeof SYSTEM_NODE_IDS)[number]

export type ModelOutputStatus = 'illustrative_unvalidated'

export interface InterventionAssumptionRefs {
  deployDelay: string
  maxAllocation: string
  effects: Partial<Record<SystemNodeId, string>>
}

export interface InterventionDefinition {
  id: InterventionId
  name: string
  shortName: string
  category: string
  description: string
  deployDelay: number
  maxAllocation: number
  color: string
  assumptionIds: InterventionAssumptionRefs
  effects: Partial<Record<SystemNodeId, number>>
}

export interface InterventionAllocation {
  id: InterventionId
  amount: number
}

export interface CrisisPreset {
  id: PresetId
  eyebrow: string
  name: string
  location: string
  narrative: string
  coordinates: [number, number]
  populationAtRisk: number
  economicExposure: number
  defaultIntensity: number
  defaultFragility: number
  peakHour: number
  biases: Record<Exclude<SystemNodeId, 'hazard'>, number>
}

export interface Scenario {
  schemaVersion: 1
  modelVersion: string
  datasetVersion: string
  id: string
  name: string
  presetId: PresetId
  seed: number
  budget: number
  hazardIntensity: number
  fragility: number
  stress: number
  allocations: InterventionAllocation[]
  createdAt: string
}

export type RiskState = Record<Exclude<SystemNodeId, 'hazard'>, number>

export interface TrajectoryPoint extends RiskState {
  hour: number
  hazard: number
  systemRisk: number
}

export interface SensitivityPoint {
  hour: number
  p10: number
  p50: number
  p90: number
}

export interface ImpactMetrics {
  protectionProxy: number
  lossProxyDelta: number
  unmetNeedProxy: number
  mobilizationHours: number
  pressureStability: number
  inclusionProxy: number
  stabilityComposite: number
  scenarioLossProxy: number
  affectedPeopleProxy: number
}

export interface InterventionSensitivity {
  id: InterventionId
  normalizedSensitivity: number
  label: string
}

export interface SimulationResult {
  scenarioId: string
  trajectory: TrajectoryPoint[]
  baselineTrajectory: TrajectoryPoint[]
  sensitivity: SensitivityPoint[]
  metrics: ImpactMetrics
  baselineMetrics: ImpactMetrics
  interventionSensitivity: InterventionSensitivity[]
  checksum: string
  generatedAt: string
}

export type OptimizerObjective = 'balanced' | 'early-action' | 'vulnerability-intent' | 'stability'

export interface PortfolioOption {
  id: string
  label: string
  objective: OptimizerObjective
  allocations: InterventionAllocation[]
  metrics: ImpactMetrics
  score: number
}

export interface EvidenceSource {
  id: string
  organization: string
  title: string
  year: string
  url: string
  kind: 'official data' | 'official report' | 'illustrative assumption'
  role: 'context_only' | 'observational_feed' | 'assumption_registry'
  calibratesCoefficients: false
  note: string
}

export interface AssumptionRange {
  minimum: number
  maximum: number
  unit: string
  meaning: 'model_admissible_range'
}

export interface NumericAssumption {
  id: string
  packVersion: string
  status: ModelOutputStatus
  interventionId: InterventionId
  interventionLabel: string
  parameter: 'deploy_delay' | 'allocation_cap' | `effect.${Exclude<SystemNodeId, 'hazard'>}`
  parameterLabel: string
  selectedValue: number
  range: AssumptionRange
  rationale: string
  contextOnlySourceIds: string[]
}

export interface MetricMetadata {
  status: ModelOutputStatus
  unit: string
  proxyDefinition: string
  assumptionPackVersion: string
}

export type SignalMode = 'live' | 'partial' | 'snapshot'

export interface LiveEvent {
  id: string
  title: string
  category: 'storm' | 'wildfire' | 'earthquake' | 'volcano' | 'other'
  coordinates: [number, number]
  displayScore: number
  occurredAt?: string
  source: 'NASA EONET' | 'USGS' | 'Morrow synthetic demo'
  url?: string
}
