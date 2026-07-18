const CACHE = 'morrow-v2'
const CORE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/morrow-mark.svg',
  '/LICENSE',
  '/THIRD_PARTY_NOTICES.md',
  '/licenses/MIT.txt',
  '/licenses/ISC.txt',
  '/licenses/SIL-OFL-1.1.txt',
  '/licenses/Apache-2.0.txt',
]

async function precacheBuild() {
  const cache = await caches.open(CACHE)
  await cache.addAll(CORE)
  const seen = new Set()
  const queue = []
  const indexResponse = await fetch('/index.html', { cache: 'no-store' })
  const indexText = await indexResponse.text()
  const htmlReferences = [...indexText.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1])
  queue.push(...htmlReferences)

  while (queue.length > 0 && seen.size < 200) {
    const reference = queue.shift()
    if (!reference) continue
    const url = new URL(reference, self.location.origin)
    if (url.origin !== self.location.origin || seen.has(url.href)) continue
    seen.add(url.href)
    try {
      const response = await fetch(url.href, { cache: 'no-store' })
      if (!response.ok) continue
      await cache.put(url.href, response.clone())
      const type = response.headers.get('content-type') ?? ''
      if (!type.includes('javascript') && !type.includes('css') && !type.includes('html')) continue
      const text = await response.text()
      const nested = [...text.matchAll(/["'(`](\.?\/?[^"'()`\s]+\.(?:js|css|woff2?|svg|png|webp))["')`]/g)]
        .map((match) => match[1])
        .filter((path) => path && (path.startsWith('./') || path.startsWith('/assets/')))
      queue.push(...nested.map((path) => new URL(path, url.href).href))
    } catch {
      // A missing optional asset must not prevent the offline shell from installing.
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await precacheBuild()
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE)
            await cache.put('/index.html', response.clone())
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match('/index.html')
          return cached ?? Response.error()
        }),
    )
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE)
          await cache.put(event.request, response.clone())
        }
        return response
      })
      .catch(async () => (await caches.match(event.request, { ignoreVary: true })) ?? Response.error()),
  )
})
