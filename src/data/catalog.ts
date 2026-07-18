import type { CrisisPreset, InterventionDefinition, Scenario, SystemNodeId } from '../domain/types'
import { ASSUMPTION_PACK_VERSION, assumedInterventionParameters } from './assumptions'

export const MODEL_VERSION = 'morrow-cascade-1.0.0'
export const DATASET_VERSION = ASSUMPTION_PACK_VERSION

export const interventions: InterventionDefinition[] = [
  {
    id: 'early-warning',
    name: 'Last-mile early warning',
    shortName: 'Early warning',
    category: 'Preparedness',
    description: 'Multichannel alerts, local coordinators, and accessible evacuation instructions.',
    ...assumedInterventionParameters('early-warning'),
    color: '#b9ff66',
  },
  {
    id: 'evacuation',
    name: 'Assisted evacuation',
    shortName: 'Evacuation',
    category: 'Protection',
    description: 'Accessible transport, shelters, route control, and family reunification.',
    ...assumedInterventionParameters('evacuation'),
    color: '#39d9ff',
  },
  {
    id: 'mobile-clinics',
    name: 'Mobile health teams',
    shortName: 'Mobile clinics',
    category: 'Health',
    description: 'Deployable primary care, trauma stabilization, surveillance, and medicines.',
    ...assumedInterventionParameters('mobile-clinics'),
    color: '#ff7b7b',
  },
  {
    id: 'clean-water',
    name: 'Emergency clean water',
    shortName: 'Clean water',
    category: 'WASH',
    description: 'Mobile treatment, safe storage, testing, and rapid repair of water points.',
    ...assumedInterventionParameters('clean-water'),
    color: '#5f8dff',
  },
  {
    id: 'cash-support',
    name: 'Targeted cash support',
    shortName: 'Cash support',
    category: 'Livelihoods',
    description: 'Rapid, privacy-preserving transfers prioritized by vulnerability.',
    ...assumedInterventionParameters('cash-support'),
    color: '#dba7ff',
  },
  {
    id: 'road-recovery',
    name: 'Critical route recovery',
    shortName: 'Route recovery',
    category: 'Logistics',
    description: 'Clear priority corridors and repair access to hospitals, ports, and shelters.',
    ...assumedInterventionParameters('road-recovery'),
    color: '#ffba69',
  },
  {
    id: 'microgrids',
    name: 'Critical-facility microgrids',
    shortName: 'Microgrids',
    category: 'Energy',
    description: 'Mobile storage and islandable power for clinics, water systems, and towers.',
    ...assumedInterventionParameters('microgrids'),
    color: '#f4e65d',
  },
  {
    id: 'supply-staging',
    name: 'Pre-positioned essentials',
    shortName: 'Supply staging',
    category: 'Logistics',
    description: 'Food, medical kits, shelter, and water supplies staged ahead of impact.',
    ...assumedInterventionParameters('supply-staging'),
    color: '#63efb0',
  },
]

const baseBiases: Record<Exclude<SystemNodeId, 'hazard'>, number> = {
  communications: 1,
  infrastructure: 1,
  displacement: 1,
  water: 1,
  food: 1,
  health: 1,
  markets: 1,
}

export const presets: CrisisPreset[] = [
  {
    id: 'coastal-cyclone',
    eyebrow: '72-hour response rehearsal',
    name: 'Cyclone Nila',
    location: 'Bay of Bengal coast',
    narrative: 'A severe cyclone closes a regional port, cuts critical roads, and pushes clinics and food markets toward failure.',
    coordinates: [89.3, 20.9],
    populationAtRisk: 2_800_000,
    economicExposure: 12.4,
    defaultIntensity: 82,
    defaultFragility: 68,
    peakHour: 18,
    biases: { ...baseBiases, water: 1.18, displacement: 1.16, food: 1.08 },
  },
  {
    id: 'heat-water-grid',
    eyebrow: '7-day compound shock compressed to 72h',
    name: 'The Long Heat',
    location: 'Northern India',
    narrative: 'A heat dome collides with low reservoirs and peak electricity demand, cascading into water, health, and market stress.',
    coordinates: [78.2, 28.6],
    populationAtRisk: 8_600_000,
    economicExposure: 18.7,
    defaultIntensity: 76,
    defaultFragility: 61,
    peakHour: 30,
    biases: { ...baseBiases, water: 1.3, health: 1.22, infrastructure: 0.84, markets: 1.08 },
  },
  {
    id: 'urban-earthquake',
    eyebrow: 'Rapid-onset urban response',
    name: 'Faultline 7.4',
    location: 'Eastern Mediterranean',
    narrative: 'A shallow earthquake disables transport and hospital capacity while aftershocks slow search, rescue, and resupply.',
    coordinates: [28.9, 37.2],
    populationAtRisk: 3_400_000,
    economicExposure: 27.5,
    defaultIntensity: 86,
    defaultFragility: 73,
    peakHour: 8,
    biases: { ...baseBiases, infrastructure: 1.32, health: 1.18, communications: 1.12, water: 0.96 },
  },
]

export const defaultAllocations = [
  { id: 'early-warning', amount: 4 },
  { id: 'evacuation', amount: 5 },
  { id: 'mobile-clinics', amount: 3 },
  { id: 'clean-water', amount: 3 },
  { id: 'cash-support', amount: 2 },
  { id: 'road-recovery', amount: 2 },
  { id: 'microgrids', amount: 2 },
  { id: 'supply-staging', amount: 4 },
] satisfies Scenario['allocations']

export function getPreset(id: Scenario['presetId']): CrisisPreset {
  return presets.find((preset) => preset.id === id) ?? presets[0]!
}

export function getIntervention(id: Scenario['allocations'][number]['id']): InterventionDefinition {
  return interventions.find((intervention) => intervention.id === id) ?? interventions[0]!
}

export function createScenario(presetId: Scenario['presetId'] = 'coastal-cyclone'): Scenario {
  const preset = getPreset(presetId)
  return {
    schemaVersion: 1,
    modelVersion: MODEL_VERSION,
    datasetVersion: DATASET_VERSION,
    id: `scenario-${crypto.randomUUID()}`,
    name: `${preset.name} response`,
    presetId: preset.id,
    seed: 26072026,
    budget: 40,
    hazardIntensity: preset.defaultIntensity,
    fragility: preset.defaultFragility,
    stress: 15,
    allocations: defaultAllocations.map((allocation) => ({ ...allocation })),
    createdAt: new Date().toISOString(),
  }
}
