import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const serverDirectory = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  // The API artifact is deliberately code-only. Client PWA assets are emitted
  // by the separate client build and must not be copied into the server image.
  publicDir: false,
  build: {
    ssr: fileURLToPath(new URL('./start.ts', import.meta.url)),
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    target: 'node20',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        entryFileNames: 'server.js',
      },
    },
  },
  resolve: {
    alias: {
      '@server': serverDirectory,
    },
  },
})
