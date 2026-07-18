import type { Scenario } from '../domain/types'
import { parseScenario } from '../domain/scenarioSchema'

const STORAGE_KEY = 'morrow.saved-scenarios.v1'
const MAX_SAVED_SCENARIOS = 10

function notifyStorageChanged(): void {
  window.dispatchEvent(new CustomEvent('morrow:storage-changed'))
}

export function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw || raw.length > 256_000) return []
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value.slice(0, MAX_SAVED_SCENARIOS).flatMap((item) => {
      try {
        return [parseScenario(item)]
      } catch {
        return []
      }
    })
  } catch {
    return []
  }
}

export function saveScenario(scenario: Scenario): Scenario[] {
  const valid = parseScenario({
    ...scenario,
    id: `saved-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  })
  const next = [valid, ...loadScenarios()].slice(0, MAX_SAVED_SCENARIOS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    throw new Error('This browser could not save the scenario. Check private-mode or storage limits.')
  }
  notifyStorageChanged()
  return next
}

export function deleteScenario(id: string): Scenario[] {
  const next = loadScenarios().filter((scenario) => scenario.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    throw new Error('This browser could not update local scenario storage.')
  }
  notifyStorageChanged()
  return next
}

export function clearLocalData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('morrow.onboarding.complete')
  } catch {
    throw new Error('This browser could not clear local scenario storage.')
  }
  notifyStorageChanged()
}
