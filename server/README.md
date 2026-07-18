# Morrow API

The optional Morrow API exposes the same deterministic model used by the browser application. It is stateless: there are no accounts, secrets, database writes, or server-side scenario records.

## Run

```bash
npm run dev:api
```

The safe default is `127.0.0.1:8787`. For a container or private listener behind an edge:

```bash
MORROW_HOST=0.0.0.0 MORROW_PORT=8787 npm run start:api
```

`MORROW_TRUST_PROXY_HOPS` defaults to `0`, so rate limits use the directly observed address. Set it to `1` only when exactly one controlled reverse proxy sits in front of Morrow, or `2` for exactly two controlled hops. Do not enable forwarded-address trust for arbitrary proxies. Multi-replica deployments also need a distributed edge limit because the built-in counters are per process.

Build and verify:

```bash
npm run typecheck:api
npm run test:api
npm run build:api
```

## Contract

- `GET /api/health` — liveness plus model and dataset versions.
- `GET /api/scenarios` — the three supported scenario presets and valid starting state.
- `POST /api/simulate` — `{ "scenario": Scenario, "samples"?: 8..96 }`.
- `POST /api/optimize` — `{ "scenario": Scenario, "candidates"?: 40..320 }`.
- `GET /api/context-events?mode=auto|snapshot` — bounded, validated NASA/USGS context with `live`, `partial`, or synthetic-demo fallback status.

Start from `GET /api/scenarios`; send one returned `scenario` unchanged or with valid control changes. The API returns HTTP 409 if its `modelVersion` or `datasetVersion` is stale rather than silently changing the meaning of a stored scenario.

Simulation and search responses include an `outputDisclosure` contract. Metric field names are deliberately explicit—such as `protectionProxy`, `lossProxyDelta`, `inclusionProxy`, and `stabilityComposite`—and every definition is tagged `illustrative_unvalidated`. Context-event responses include `contextOnly: true`; their `displayScore` is a Morrow visualization heuristic, never provider severity or model input.

Optimize responses also include `search` diagnostics: the number of direct-model candidates screened, the number of unique winners receiving full simulation (never more than four), 48 variation samples per winner, and the `two-stage-seeded-search` method identifier. The route yields between bounded compute batches so health checks and unrelated requests can progress during a search.

## Operational limits

- Request bodies: 64 KiB.
- Global rate limit: 120 requests/minute per resolved client IP under the configured trusted-hop policy.
- Simulate: 30/minute; optimize: 12/minute.
- Upstream context payloads: 1 MB each and a four-second timeout.
- No wildcard CORS is enabled. Serve the UI and `/api` on one origin through a reverse proxy, or add an explicit allowlist at the deployment edge.

Run a single API process per CPU when optimizer traffic is sustained. Rate limiting and context-event caching are in memory and intentionally not shared or persisted.
