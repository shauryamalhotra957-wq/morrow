import { ASSUMPTION_PACK_VERSION, assumptionLedger } from '../data/assumptions'
import {
  KPI_METADATA,
  MODEL_OUTPUT_STATUS,
  SENSITIVITY_ENVELOPE_DEFINITION,
  SYSTEM_PRESSURE_METADATA,
} from '../data/modelMetadata'
import { evidenceSources } from '../data/sources'
import type { Scenario, SimulationResult } from '../domain/types'

function safeFilename(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'scenario'
}

function download(content: BlobPart, type: string, filename: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

function csvCell(value: string | number): string {
  const text = String(value)
  const formulaSafe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${formulaSafe.replace(/"/g, '""')}"`
}

function taggedKpis(metrics: SimulationResult['metrics']) {
  return Object.fromEntries(
    (Object.entries(metrics) as [keyof SimulationResult['metrics'], number][]).map(([id, value]) => [
      id,
      { value, ...KPI_METADATA[id] },
    ]),
  )
}

export function buildScenarioExport(scenario: Scenario, result: SimulationResult, exportedAt = new Date().toISOString()) {
  return {
    exportSchemaVersion: 2,
    exportedAt,
    disclosure: {
      outputStatus: MODEL_OUTPUT_STATUS,
      assumptionPackVersion: ASSUMPTION_PACK_VERSION,
      warning: 'All model outputs are illustrative, unvalidated rehearsal proxies. They are not observations, forecasts, causal estimates, official risk levels, or operational recommendations.',
      systemPressure: SYSTEM_PRESSURE_METADATA,
      sensitivityEnvelope: {
        status: MODEL_OUTPUT_STATUS,
        assumptionPackVersion: ASSUMPTION_PACK_VERSION,
        definition: SENSITIVITY_ENVELOPE_DEFINITION,
      },
    },
    kpis: taggedKpis(result.metrics),
    baselineKpis: taggedKpis(result.baselineMetrics),
    assumptionLedger,
    evidenceRegistry: evidenceSources,
    scenario,
    result,
  }
}

export function exportScenarioJson(scenario: Scenario, result: SimulationResult): void {
  const payload = JSON.stringify(buildScenarioExport(scenario, result), null, 2)
  download(payload, 'application/json;charset=utf-8', `${safeFilename(scenario.name)}-${result.checksum}.json`)
}

export function buildTrajectoryCsv(result: SimulationResult): string {
  const headers = [
    'output_status',
    'assumption_pack_version',
    'system_pressure_proxy_definition',
    'sensitivity_envelope_definition',
    'hour',
    'system_pressure_index',
    'baseline_pressure_index',
    'sensitivity_p10',
    'sensitivity_p50',
    'sensitivity_p90',
    'health_pressure',
    'water_pressure',
    'food_pressure',
    'infrastructure_pressure',
  ]
  const rows = result.trajectory.map((point, index) => {
    const baseline = result.baselineTrajectory[index]
    const sensitivity = result.sensitivity[index]
    return [
      MODEL_OUTPUT_STATUS,
      ASSUMPTION_PACK_VERSION,
      SYSTEM_PRESSURE_METADATA.proxyDefinition,
      SENSITIVITY_ENVELOPE_DEFINITION,
      point.hour,
      point.systemRisk,
      baseline?.systemRisk ?? '',
      sensitivity?.p10 ?? '',
      sensitivity?.p50 ?? '',
      sensitivity?.p90 ?? '',
      point.health,
      point.water,
      point.food,
      point.infrastructure,
    ]
  })
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export function exportTrajectoryCsv(scenario: Scenario, result: SimulationResult): void {
  const csv = buildTrajectoryCsv(result)
  download(csv, 'text/csv;charset=utf-8', `${safeFilename(scenario.name)}-trajectory.csv`)
}
