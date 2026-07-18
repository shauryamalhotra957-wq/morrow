import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const noticesPath = join(root, 'THIRD_PARTY_NOTICES.md')
const notices = readFileSync(noticesPath, 'utf8')
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const failures = []

const requiredFiles = [
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  'licenses/MIT.txt',
  'licenses/ISC.txt',
  'licenses/SIL-OFL-1.1.txt',
  'licenses/Apache-2.0.txt',
  'dist/LICENSE',
  'dist/THIRD_PARTY_NOTICES.md',
  'dist/licenses/MIT.txt',
  'dist/licenses/ISC.txt',
  'dist/licenses/SIL-OFL-1.1.txt',
  'dist/licenses/Apache-2.0.txt',
]

for (const relativePath of requiredFiles) {
  if (!existsSync(join(root, relativePath))) failures.push(`missing ${relativePath}`)
}

for (const dependency of Object.keys(packageJson.dependencies ?? {})) {
  if (!notices.includes(`\`${dependency}\``)) failures.push(`unlisted direct dependency ${dependency}`)
}

const bundledPackages = new Set()
const assetDirectory = join(root, 'dist', 'assets')
if (existsSync(assetDirectory)) {
  for (const fileName of readdirSync(assetDirectory).filter((name) => name.endsWith('.map'))) {
    const map = JSON.parse(readFileSync(join(assetDirectory, fileName), 'utf8'))
    for (const source of map.sources ?? []) {
      const normalized = source.replaceAll('\\', '/')
      const marker = 'node_modules/'
      const markerIndex = normalized.lastIndexOf(marker)
      if (markerIndex < 0) continue
      const parts = normalized.slice(markerIndex + marker.length).split('/')
      const packageName = parts[0]?.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]
      if (packageName) bundledPackages.add(packageName)
    }
  }
}

for (const dependency of bundledPackages) {
  if (!notices.includes(`\`${dependency}\``)) failures.push(`unlisted bundled package ${dependency}`)
}

const licenseSignatures = new Map([
  ['licenses/MIT.txt', 'Permission is hereby granted, free of charge'],
  ['licenses/ISC.txt', 'with or without fee is hereby granted'],
  ['licenses/SIL-OFL-1.1.txt', 'SIL OPEN FONT LICENSE Version 1.1'],
  ['licenses/Apache-2.0.txt', 'TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION'],
])

for (const [relativePath, signature] of licenseSignatures) {
  if (!readFileSync(join(root, relativePath), 'utf8').includes(signature)) {
    failures.push(`invalid or truncated ${relativePath}`)
  }
}

if (!readFileSync(join(root, 'Dockerfile.api'), 'utf8').includes('THIRD_PARTY_NOTICES.md')) {
  failures.push('Dockerfile.api does not preserve third-party notices')
}

if (failures.length > 0) {
  console.error(`Legal artifact verification failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`Legal artifacts verified: ${bundledPackages.size} bundled packages and ${Object.keys(packageJson.dependencies).length} direct runtime dependencies.`)
