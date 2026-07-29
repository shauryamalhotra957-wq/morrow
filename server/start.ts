import { z } from 'zod'
import { buildServer } from './app'

const environmentSchema = z.object({
  MORROW_HOST: z.string().min(1).max(255).default('127.0.0.1'),
  MORROW_PORT: z.coerce.number().int().min(1).max(65_535).default(8787),
  MORROW_TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(2).default(0),
})

async function main(): Promise<void> {
  const environment = environmentSchema.parse(process.env)
  const app = await buildServer({
    logger: true,
    trustProxy: environment.MORROW_TRUST_PROXY_HOPS === 0 ? false : environment.MORROW_TRUST_PROXY_HOPS,
  })
  let closing = false

  const shutdown = async (signal: string) => {
    if (closing) return
    closing = true
    app.log.info({ signal }, 'Graceful shutdown started')
    await app.close()
  }

  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))

  await app.listen({ host: environment.MORROW_HOST, port: environment.MORROW_PORT })
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Morrow API failed to start.')
  process.exitCode = 1
}
