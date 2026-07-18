# Security

## Scope

Morrow's core is a static local-first application. Its optional stateless API has no account, database, secret, payment path, or analytics collector. The main security surfaces are imported/shared scenarios, local persistence, downloads, live public-data responses, service-worker caching, HTTP model execution, and third-party dependencies.

## Threat model

### Untrusted share or import state

Threats: oversized payload, non-finite numbers, unknown fields, budget bypass, prototype-pollution keys, extreme nesting, malformed base64, and denial of service.

Controls:

- 16 KB share-code limit;
- base64url character validation;
- maximum nesting depth;
- explicit rejection of `__proto__`, `prototype`, and `constructor`;
- strict Zod object schemas;
- finite numeric bounds;
- exact intervention count and uniqueness;
- per-intervention maxima and budget validation;
- explicit rejection of stale model/data versions rather than silent reinterpretation.

### Corrupted local persistence

Threats: invalid JSON, stale schema, oversized storage, and partial records.

Controls:

- 256 KB record limit;
- every loaded record is reparsed through the strict scenario schema;
- corrupt entries are discarded without crashing;
- no more than ten scenarios are retained;
- one-command local-data deletion.

### Spreadsheet injection

Threat: exported text beginning with `=`, `+`, `-`, or `@` can become a formula.

Control: CSV cells with a formula prefix receive a leading apostrophe and every value is quoted.

### Malicious live response

Threats: unexpected JSON, huge response, unsafe links, invalid geometry, and connector timeout.

Controls:

- 2 MB declared and measured browser-response limit;
- seven-second browser abort;
- bounded record count;
- runtime type checks and string truncation;
- only HTTPS NASA/USGS endpoints are called;
- only official USGS links survive validation;
- failure returns a local snapshot.

### Cross-site scripting and framing

Controls:

- no `dangerouslySetInnerHTML`, dynamic evaluation, or user HTML;
- production Content Security Policy;
- `frame-ancestors 'none'` and `X-Frame-Options: DENY`;
- `object-src 'none'`, restricted `connect-src`, and same-origin assets;
- external links use `noreferrer`;
- no runtime CDN scripts or fonts.

### Service worker

Controls:

- caches only same-origin GET resources;
- asset discovery is bounded to 200 items;
- optional missing assets do not block the offline shell;
- old named caches are deleted on activation;
- network responses are cached only when successful.

Release note: change the cache name whenever a deployment needs a forced offline refresh.

### Dependency compromise

Controls:

- committed lockfile;
- CI uses `npm ci`;
- dependency audit in the release checklist;
- static production bundle has no runtime package installation.

### Optional stateless API

Controls:

- Fastify request bodies are capped at 64 KiB and parsed with its secure JSON parser;
- all simulation and optimizer bodies pass the shared strict Zod scenario schema;
- stale model or dataset versions receive HTTP 409 instead of silent reinterpretation;
- simulation samples and optimizer candidates have explicit upper bounds;
- global and route-specific in-memory rate limits protect CPU-bound endpoints;
- security headers deny framing, MIME sniffing, and cross-origin resource embedding;
- no wildcard CORS, account state, cookies, file uploads, database, or server-side scenario storage;
- server logs redact authorization and cookie headers;
- upstream NASA/USGS payloads are streamed through a 1 MB cap, a four-second timeout, strict Zod adapters, and official-link allowlists;
- `SIGINT` and `SIGTERM` trigger graceful Fastify shutdown.

Run multiple replicas only behind an edge-level distributed rate limit. Keep the default direct-IP trust model unless the deployment has an explicit, tested `MORROW_TRUST_PROXY_HOPS` value of one or two controlled hops.

## Security headers

`public/_headers` configures:

- Content Security Policy;
- X-Content-Type-Options;
- X-Frame-Options;
- Referrer-Policy;
- Permissions-Policy;
- Cross-Origin-Opener-Policy.

Hosts that do not support `_headers` must reproduce these settings in platform configuration.

## Current verification

At release 1.0:

- `npm audit` reports zero known vulnerabilities;
- ESLint and strict TypeScript pass;
- share-code malformed/oversized/unknown/over-budget cases are tested;
- local corrupt and oversized storage recovery is tested;
- no browser console warnings or errors appear in the core journey.

## Residual risk

- Official connectors can change shape or availability.
- A static host can misconfigure headers or HTTPS.
- Browser extensions can access page content outside Morrow’s control.
- Local users can modify client code or storage; output fingerprints establish reproducibility, not authenticity.
- A determined denial-of-service input outside the exposed schema may still consume browser resources.

Do not store confidential operational plans in the current release.

## Reporting a vulnerability

Do not open a public issue containing exploit details or private information. Send the maintainer a minimal reproduction, affected version, impact, and suggested embargo window through the repository’s private security-reporting channel. Until a public repository exists, share it directly with the project owner.
