const CACHE_NAME = 'knot-shell-v1'
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/mark.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
]

async function precacheShell() {
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(APP_SHELL)

  try {
    const response = await fetch('./index.html', { cache: 'reload' })
    if (!response.ok) return
    const html = await response.text()
    const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter(
        (url) =>
          !url.startsWith('http') &&
          !url.startsWith('data:') &&
          !url.startsWith('#') &&
          !url.startsWith('mailto:'),
      )
    await Promise.all(
      assetUrls.map((url) =>
        cache.add(new URL(url, self.registration.scope).href).catch(() => undefined),
      ),
    )
  } catch {
    // A missing asset should not prevent the shell from installing.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          return cached || caches.match('./index.html')
        }),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
