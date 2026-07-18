import type { Scenario } from './types'
import { parseScenario } from './scenarioSchema'

const MAX_SHARE_LENGTH = 16_384
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

function assertNoPollutionKeys(value: unknown, depth = 0): void {
  if (depth > 12) throw new Error('Scenario structure is too deeply nested.')
  if (!value || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error('Scenario contains a forbidden object key.')
    assertNoPollutionKeys(nested, depth + 1)
  }
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Share code contains invalid characters.')
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeScenario(scenario: Scenario): string {
  const payload = toBase64Url(JSON.stringify(scenario))
  if (payload.length > MAX_SHARE_LENGTH) throw new Error('Scenario is too large to share in a URL.')
  return `v1.${payload}`
}

export function decodeScenario(code: string): Scenario {
  if (code.length > MAX_SHARE_LENGTH) throw new Error('Share code exceeds the 16 KB safety limit.')
  const [version, payload, extra] = code.split('.')
  if (version !== 'v1' || !payload || extra) throw new Error('Unsupported or malformed share code.')
  const decoded: unknown = JSON.parse(fromBase64Url(payload))
  assertNoPollutionKeys(decoded)
  return parseScenario(decoded)
}

export function scenarioFromHash(hash: string): Scenario | null {
  const match = hash.match(/(?:^|[&#])s=([^&]+)/)
  if (!match?.[1]) return null
  return decodeScenario(decodeURIComponent(match[1]))
}

export function createShareUrl(scenario: Scenario): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/cockpit&s=${encodeURIComponent(encodeScenario(scenario))}`
}
