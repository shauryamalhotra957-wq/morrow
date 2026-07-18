import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import Fastify, { type FastifyInstance, type FastifyReply } from 'fastify'
import type { ZodError } from 'zod'
import { createScenario, DATASET_VERSION, MODEL_VERSION, presets } from '../src/data/catalog'
import { KPI_METADATA, MODEL_OUTPUT_STATUS, SENSITIVITY_ENVELOPE_DEFINITION } from '../src/data/modelMetadata'
import { optimizePortfoliosCooperatively } from '../src/domain/optimizer'
import { parseScenario } from '../src/domain/scenarioSchema'
import { simulateScenario } from '../src/domain/simulator'
import { createContextEventsLoader, type ContextEventsLoader } from './context-events'
import { contextEventsQuerySchema, optimizeRequestSchema, simulateRequestSchema } from './schemas'

const BODY_LIMIT_BYTES = 64 * 1024
const OUTPUT_DISCLOSURE = {
  status: MODEL_OUTPUT_STATUS,
  assumptionPackVersion: DATASET_VERSION,
  kpis: KPI_METADATA,
  sensitivityEnvelope: SENSITIVITY_ENVELOPE_DEFINITION,
  warning: 'Training proxies only; not observations, forecasts, probabilities, fairness measures, or operational recommendations.',
} as const

interface BuildServerOptions {
  logger?: boolean
  contextEventsLoader?: ContextEventsLoader
  trustProxy?: false | number
}

interface ApiIssue {
  path: string
  message: string
}

function validationIssues(error: ZodError): ApiIssue[] {
  return error.issues.slice(0, 20).map((issue) => ({
    path: issue.path.map(String).join('.') || '$',
    message: issue.message,
  }))
}

function invalidRequest(reply: FastifyReply, error: ZodError) {
  return reply.code(400).send({
    error: {
      code: 'INVALID_REQUEST',
      message: 'The request did not match the Morrow API contract.',
      issues: validationIssues(error),
    },
  })
}

function currentScenarioOrReply(input: unknown, reply: FastifyReply) {
  const scenario = parseScenario(input)
  const supplied = input as { modelVersion?: unknown; datasetVersion?: unknown }
  if (supplied.modelVersion !== MODEL_VERSION || supplied.datasetVersion !== DATASET_VERSION) {
    void reply.code(409).send({
      error: {
        code: 'MODEL_VERSION_MISMATCH',
        message: 'This scenario targets a different model or dataset version.',
        expected: { modelVersion: MODEL_VERSION, datasetVersion: DATASET_VERSION },
        received: { modelVersion: supplied.modelVersion, datasetVersion: supplied.datasetVersion },
      },
    })
    return null
  }
  return scenario
}

function rejectStaleVersion(body: unknown, reply: FastifyReply): boolean {
  if (!body || typeof body !== 'object' || !('scenario' in body)) return false
  const scenario = body.scenario
  if (!scenario || typeof scenario !== 'object') return false
  const supplied = scenario as { modelVersion?: unknown; datasetVersion?: unknown }
  if (
    (typeof supplied.modelVersion === 'string' && supplied.modelVersion !== MODEL_VERSION) ||
    (typeof supplied.datasetVersion === 'string' && supplied.datasetVersion !== DATASET_VERSION)
  ) {
    void reply.code(409).send({
      error: {
        code: 'MODEL_VERSION_MISMATCH',
        message: 'This scenario targets a different model or dataset version.',
        expected: { modelVersion: MODEL_VERSION, datasetVersion: DATASET_VERSION },
        received: { modelVersion: supplied.modelVersion, datasetVersion: supplied.datasetVersion },
      },
    })
    return true
  }
  return false
}

export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger
      ? {
          level: process.env.MORROW_LOG_LEVEL ?? 'info',
          redact: {
            paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
            censor: '[REDACTED]',
          },
        }
      : false,
    bodyLimit: BODY_LIMIT_BYTES,
    requestTimeout: 15_000,
    connectionTimeout: 10_000,
    keepAliveTimeout: 5_000,
    routerOptions: { maxParamLength: 128 },
    trustProxy: options.trustProxy ?? false,
    return503OnClosing: true,
  })

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
  })

  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: '1 minute',
    cache: 10_000,
    ban: 3,
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (_request, context) => ({
      statusCode: context.statusCode,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Retry after the indicated delay.',
        retryAfterSeconds: Math.max(1, Math.ceil(context.ttl / 1_000)),
      },
    }),
  })

  const loadContextEvents = options.contextEventsLoader ?? createContextEventsLoader()

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-request-id', request.id)
    if (!reply.hasHeader('cache-control')) reply.header('cache-control', 'no-store')
    return payload
  })

  app.get('/api/health', { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } }, async () => ({
    status: 'ok',
    service: 'morrow-api',
    modelVersion: MODEL_VERSION,
    datasetVersion: DATASET_VERSION,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  }))

  app.get('/api/scenarios', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (_request, reply) => {
    reply.header('cache-control', 'public, max-age=3600, stale-while-revalidate=86400')
    return {
      modelVersion: MODEL_VERSION,
      datasetVersion: DATASET_VERSION,
      scenarios: presets.map((preset) => ({
        id: preset.id,
        name: preset.name,
        location: preset.location,
        narrative: preset.narrative,
        peakHour: preset.peakHour,
        scenario: createScenario(preset.id),
      })),
      outputDisclosure: OUTPUT_DISCLOSURE,
    }
  })

  app.post('/api/simulate', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (request, reply) => {
    if (rejectStaleVersion(request.body, reply)) return reply
    const parsed = simulateRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidRequest(reply, parsed.error)
    const scenario = currentScenarioOrReply(parsed.data.scenario, reply)
    if (!scenario) return reply

    const startedAt = performance.now()
    const result = simulateScenario(scenario, parsed.data.samples)
    reply.header('x-morrow-checksum', result.checksum)
    return {
      modelVersion: MODEL_VERSION,
      datasetVersion: DATASET_VERSION,
      samples: parsed.data.samples,
      elapsedMs: Number((performance.now() - startedAt).toFixed(2)),
      outputDisclosure: OUTPUT_DISCLOSURE,
      result,
    }
  })

  app.post('/api/optimize', { config: { rateLimit: { max: 12, timeWindow: '1 minute' } } }, async (request, reply) => {
    if (rejectStaleVersion(request.body, reply)) return reply
    const parsed = optimizeRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidRequest(reply, parsed.error)
    const scenario = currentScenarioOrReply(parsed.data.scenario, reply)
    if (!scenario) return reply

    const startedAt = performance.now()
    const search = await optimizePortfoliosCooperatively(scenario, parsed.data.candidates, { batchSize: 8 })
    return {
      modelVersion: MODEL_VERSION,
      datasetVersion: DATASET_VERSION,
      candidates: parsed.data.candidates,
      elapsedMs: Number((performance.now() - startedAt).toFixed(2)),
      outputDisclosure: OUTPUT_DISCLOSURE,
      portfolios: search.portfolios,
      search: search.diagnostics,
    }
  })

  app.get('/api/context-events', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (request, reply) => {
    const parsed = contextEventsQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidRequest(reply, parsed.error)
    const result = await loadContextEvents(parsed.data.mode)
    reply.header('cache-control', result.mode === 'live' ? 'public, max-age=30, stale-while-revalidate=120' : 'public, max-age=15')
    return {
      ...result,
      contextOnly: true,
      changesScenarioAutomatically: false,
      displayScoreDefinition: 'Morrow visualization heuristic; not provider severity or an official risk level.',
    }
  })

  app.setNotFoundHandler(async (_request, reply) => reply.code(404).send({
    error: { code: 'NOT_FOUND', message: 'The requested Morrow API route does not exist.' },
  }))

  app.setErrorHandler(async (error, request, reply) => {
    const suppliedStatus = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number'
      ? error.statusCode
      : 500
    const statusCode = Math.min(599, Math.max(400, suppliedStatus))
    const rateLimitError = typeof error === 'object' && error && 'error' in error &&
      typeof error.error === 'object' && error.error && 'code' in error.error && error.error.code === 'RATE_LIMITED'
    if (statusCode >= 500 && !rateLimitError) request.log.error({ err: error }, 'Unhandled API error')
    const code = rateLimitError
      ? 'RATE_LIMITED'
      : statusCode === 413
      ? 'BODY_TOO_LARGE'
      : statusCode === 415
        ? 'UNSUPPORTED_MEDIA_TYPE'
        : statusCode === 429
          ? 'RATE_LIMITED'
          : statusCode >= 500
            ? 'INTERNAL_ERROR'
            : 'BAD_REQUEST'
    return reply.code(statusCode).send({
      error: {
        code,
        message: rateLimitError
          ? 'Too many requests. Retry after the indicated delay.'
          : statusCode >= 500
          ? 'The API could not complete the request.'
          : statusCode === 413
            ? `Request bodies are limited to ${BODY_LIMIT_BYTES} bytes.`
            : error instanceof Error ? error.message : 'The request was invalid.',
        ...(rateLimitError && typeof error.error === 'object' && error.error && 'retryAfterSeconds' in error.error && typeof error.error.retryAfterSeconds === 'number'
          ? { retryAfterSeconds: error.error.retryAfterSeconds }
          : {}),
      },
    })
  })

  return app
}
