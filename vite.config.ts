import { cpSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function copyLegalArtifacts(): Plugin {
  return {
    name: 'morrow-copy-legal-artifacts',
    apply: 'build',
    closeBundle() {
      const root = process.cwd()
      cpSync(resolve(root, 'LICENSE'), resolve(root, 'dist', 'LICENSE'))
      cpSync(resolve(root, 'THIRD_PARTY_NOTICES.md'), resolve(root, 'dist', 'THIRD_PARTY_NOTICES.md'))
      cpSync(resolve(root, 'licenses'), resolve(root, 'dist', 'licenses'), { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [react(), copyLegalArtifacts()],
  server: {
    port: 4173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
  },
})
