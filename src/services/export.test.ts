import { describe, expect, it } from 'vitest'
import { ASSUMPTION_PACK_VERSION, assumptionLedger } from '../data/assumptions'
import { KPI_METADATA } from '../data/modelMetadata'
import { createScenario } from '../data/catalog'
import { simulateScenario } from '../domain/simulator'
import { buildScenarioExport, buildTrajectoryCsv } from './export'

describe('evidence-aware exports', () => {
  it('tags every KPI with proxy status, definition, unit, and assumption pack', () => {
    const scenario = createScenario()
    const result = simulateScenario(scenario, 8)
    const payload = buildScenarioExport(scenario, result, '2026-07-17T00:00:00.000Z')

    expect(payload.disclosure.outputStatus).toBe('illustrative_unvalidated')
    expect(payload.assumptionLedger).toHaveLength(assumptionLedger.length)
    for (const key of Object.keys(result.metrics) as (keyof typeof result.metrics)[]) {
      const tagged = payload.kpis[key]
      if (!tagged) throw new Error(`Missing tagged KPI metadata for ${key}`)
      expect(tagged.value).toBe(result.metrics[key])
      expect(tagged.status).toBe('illustrative_unvalidated')
      expect(tagged.assumptionPackVersion).toBe(ASSUMPTION_PACK_VERSION)
      expect(tagged.proxyDefinition).toBe(KPI_METADATA[key].proxyDefinition)
      expect(tagged.unit.length).toBeGreaterThan(0)
    }
  })

  it('names sensitivity percentiles honestly in the self-describing CSV', () => {
    const result = simulateScenario(createScenario(), 8)
    const csv = buildTrajectoryCsv(result)
    const header = csv.split('\r\n')[0]
    expect(header).toContain('output_status')
    expect(header).toContain('assumption_pack_version')
    expect(header).toContain('sensitivity_envelope_definition')
    expect(header).toContain('sensitivity_p10')
    expect(header).not.toContain('confidence')
  })
})
