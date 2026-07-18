import { describe, expect, it } from 'vitest'
import { interventions } from './catalog'
import { ASSUMPTION_PACK_VERSION, assumptionLedger } from './assumptions'
import { evidenceSources } from './sources'

describe('assumption and evidence provenance', () => {
  it('maps every numeric intervention parameter to one explicit ledger record', () => {
    const byId = new Map(assumptionLedger.map((entry) => [entry.id, entry]))
    expect(byId.size).toBe(assumptionLedger.length)

    for (const intervention of interventions) {
      const delay = byId.get(intervention.assumptionIds.deployDelay)
      const cap = byId.get(intervention.assumptionIds.maxAllocation)
      expect(delay?.selectedValue).toBe(intervention.deployDelay)
      expect(delay?.parameter).toBe('deploy_delay')
      expect(cap?.selectedValue).toBe(intervention.maxAllocation)
      expect(cap?.parameter).toBe('allocation_cap')

      for (const [node, value] of Object.entries(intervention.effects)) {
        const assumptionId = intervention.assumptionIds.effects[node as keyof typeof intervention.assumptionIds.effects]
        const entry = assumptionId ? byId.get(assumptionId) : undefined
        expect(entry?.selectedValue).toBe(value)
        expect(entry?.parameter).toBe(`effect.${node}`)
      }
      expect(Object.keys(intervention.assumptionIds.effects).sort()).toEqual(Object.keys(intervention.effects).sort())
    }
  })

  it('labels every numeric assumption as illustrative and unvalidated', () => {
    for (const entry of assumptionLedger) {
      expect(entry.packVersion).toBe(ASSUMPTION_PACK_VERSION)
      expect(entry.status).toBe('illustrative_unvalidated')
      expect(entry.rationale.length).toBeGreaterThan(30)
      expect(entry.range.minimum).toBeLessThanOrEqual(entry.selectedValue)
      expect(entry.range.maximum).toBeGreaterThanOrEqual(entry.selectedValue)
    }
  })

  it('never presents an external source as coefficient calibration', () => {
    expect(evidenceSources.length).toBeGreaterThan(0)
    for (const source of evidenceSources) {
      expect(source.calibratesCoefficients).toBe(false)
      expect(['context_only', 'observational_feed']).toContain(source.role)
    }
  })
})
