# Deployment and Rollback

Morrow is a static application. The production artifact is the `dist/` directory; the core rehearsal requires no backend, account, database, or API key.

## Requirements

- Node.js 20.19 or newer
- npm with the committed lockfile
- an HTTPS static host
- deployment at the origin root unless the Vite base path and service-worker paths are deliberately changed and retested

## Release build

From the project root:

```bash
npm ci
npm run check
npm run test:e2e
npm audit
```

`npm run check` runs lint, strict TypeScript, unit/component/property tests, and the production build. End-to-end tests and the dependency audit are separate release gates.

The successful build writes `dist/`. Do not deploy `src/`, `node_modules/`, coverage output, test traces, or local environment files.

## Host configuration

1. Publish the contents of `dist/` at the site root.
2. Require HTTPS; service workers are unavailable on ordinary insecure origins.
3. Configure the headers in `public/_headers` if the host does not support that file format directly.
4. Preserve `index.html`, `manifest.webmanifest`, `morrow-mark.svg`, `sw.js`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, and `licenses/` at their root paths.
5. Hash routing needs no server rewrite, but the root document must return normally.

Compatible static hosts include Cloudflare Pages, Netlify, Vercel static output, GitHub Pages with an appropriate root/base configuration, S3 plus CloudFront, and an institution-controlled HTTPS server.

## Cache versioning

`public/sw.js` currently uses the cache name `morrow-v2`. Change the cache name for a release that must invalidate a previous offline shell. Rebuild, redeploy, and confirm that activation removes the old named cache.

Do not change the cache name without a release note in `CHANGELOG.md`.

## Production smoke test

Test the deployed URL in a clean browser profile:

1. Landing page renders with no console error.
2. The cockpit opens and all four views are reachable.
3. Changing an allocation changes the scenario result.
4. The Cascade timeline and node inspector work.
5. Portfolio search returns four objective-weighted candidates.
6. Share URL opens the same validated scenario and fingerprint.
7. JSON and CSV download; Print/PDF renders legibly.
8. Evidence links open the expected primary source.
9. Public-event connector failure falls back to the demo snapshot without changing simulation output.
10. After one successful online load, disconnect networking, close the tab, reopen the installed/cached application, and run the core rehearsal.
11. Test keyboard navigation, reduced motion, and 375, 768, 1024, and 1440-pixel viewports.

## Security verification

Confirm the production response headers include the intended Content Security Policy, frame denial, MIME sniffing protection, referrer policy, permissions policy, and cross-origin opener policy. Browser developer tools should show no mixed content and no connector outside the allowlist.

The public connectors provide display context only. A successful connector response is not a calibration or operational-readiness check.

## Release record

For each release, record:

- git commit and version;
- model, dataset, and schema versions;
- test and audit results;
- cache name;
- host and deployment time;
- known limitations;
- rollback artifact location.

## Rollback

1. Keep the previous verified `dist/` artifact immutable.
2. Redeploy that complete artifact, including its matching `sw.js` and headers.
3. If a broken service worker has already activated, deploy a new cache name that serves the last known-good assets; do not rely only on restoring hashed files.
4. Verify the clean-profile and offline smoke tests again.
5. Document the incident and rollback in `CHANGELOG.md` before the next release.

Never roll back only the JavaScript bundle while leaving a mismatched model card, methodology, source registry, or service worker.

## Optional stateless API

The browser application remains fully functional without a backend. Deploy `server/dist/server.js` only when a shared HTTP simulation surface is useful for integrations or controlled demonstrations.

```bash
npm ci
npm run typecheck:api
npm run test:api
npm run build:api
npm prune --omit=dev
MORROW_HOST=0.0.0.0 MORROW_PORT=8787 node server/dist/server.js
```

The order is intentional: `server/dist/` is generated and is not committed, while its TypeScript/Vite build tools are development dependencies. The multi-stage `Dockerfile.api` performs the same build/runtime separation automatically.

Reverse-proxy `/api/*` to the API on the same HTTPS origin as the static application. Keep the API bound to a private interface behind the proxy and do not enable wildcard CORS. Direct deployments leave `MORROW_TRUST_PROXY_HOPS=0` (the default). Behind exactly one controlled proxy, set `MORROW_TRUST_PROXY_HOPS=1`; behind two controlled hops, set it to `2`. Never trust forwarded client IPs from arbitrary hops. The service intentionally has no accounts, secrets, or persistence. Its rate limiter and context-event cache are per-process memory, so enforce an additional distributed limit at the edge when running multiple replicas.

Use `GET /api/health` for liveness. Graceful shutdown handles `SIGINT` and `SIGTERM`; allow the process to drain before terminating the container. The complete endpoint contract and operational limits are documented in [`server/README.md`](./server/README.md).

For a reproducible non-root API image:

```bash
docker build -f Dockerfile.api -t morrow-api:1.0.0 .
docker run --rm -p 127.0.0.1:8787:8787 morrow-api:1.0.0
```

The image has an HTTP health check, contains only production dependencies plus the built API artifact, and exposes no database or secret volume.
