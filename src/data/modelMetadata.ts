import type { ImpactMetrics, MetricMetadata, ModelOutputStatus } from '../domain/types'
import { ASSUMPTION_PACK_VERSION } from './assumptions'

export const MODEL_OUTPUT_STATUS: ModelOutputStatus = 'illustrative_unvalidated'

function metric(unit: string, proxyDefinition: string): MetricMetadata {
  return {
    status: MODEL_OUTPUT_STATUS,
    unit,
    proxyDefinition,
    assumptionPackVersion: ASSUMPTION_PACK_VERSION,
  }
}

export const KPI_METADATA: Record<keyof ImpactMetrics, MetricMetadata> = {
  protectionProxy: metric(
    'modeled affected-person equivalent',
    'Difference between the no-action and selected-portfolio affected-person proxies. It is not an observed or forecast count of people protected.',
  ),
  lossProxyDelta: metric(
    'illustrative USD billions',
    'Difference between no-action and selected-portfolio economic-exposure proxies. It is not an economic loss estimate or forecast.',
  ),
  unmetNeedProxy: metric(
    'modeled need-equivalent people',
    'Affected-person proxy multiplied by illustrative health, water, and food pressure. It is not an assessed humanitarian caseload.',
  ),
  mobilizationHours: metric(
    'illustrative hours',
    'Rule-based mobilization proxy derived from selected intervention delays. It is not a measured or promised response time.',
  ),
  pressureStability: metric(
    '0–100 illustrative index',
    'Composite of modeled mean and peak system-pressure proxies. It is not a validated resilience measure.',
  ),
  inclusionProxy: metric(
    '0–100 spending-mix proxy',
    'Composite of selected action categories and allocation concentration. It does not measure fairness or benefit distribution across population groups.',
  ),
  stabilityComposite: metric(
    '0–100 illustrative index',
    'Composite model score adjusted by spread under the selected assumption-variation set. It is not a calibrated probability of success.',
  ),
  scenarioLossProxy: metric(
    'illustrative USD billions',
    'Economic-exposure assumption multiplied by modeled infrastructure and market pressure. It is not an observed or forecast loss.',
  ),
  affectedPeopleProxy: metric(
    'modeled affected-person equivalent',
    'Population-at-risk assumption multiplied by an illustrative risk-to-population conversion. It is not an observed or forecast affected population.',
  ),
}

export const SYSTEM_PRESSURE_METADATA: MetricMetadata = metric(
  '0–100 illustrative pressure index',
  'Weighted combination of uncalibrated model-node pressures. It is a rehearsal proxy, not an official risk level or probability.',
)

export const SENSITIVITY_ENVELOPE_DEFINITION =
  'p10/p50/p90 percentiles across seeded variations in selected hazard, fragility, and cascade assumptions; not a confidence interval, forecast interval, or calibrated probability.'
