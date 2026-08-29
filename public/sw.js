/**
 * SIHALINK Service Worker
 *
 * Strategy:
 *   - App Shell (/, /login, /offline.html): Cache-first, update in background
 *   - API routes (/api/*): Network-only — never serve stale health/emergency data
 *   - Static assets (_next/static/*): Cache-first, long TTL
 *   - Navigation fallback: serve /offline.html when network is unavailable
 *
 * NOTE: This SW is registered manually via /sw-register.js.
 * It does NOT use Workbox to avoid a build-step dependency.
 */

const CACHE_VERSION = 'sihalink-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;

const SHELL_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('sihalink-') && k !== STATIC_CACHE && k !== SHELL_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET or cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // 2. API routes: network-only (health/emergency data must never be stale)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // 3. Next.js static chunks: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // 4. Navigation requests: network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() =>
          caches.match('/offline.html').then(
            (r) => r ?? new Response('Offline', { status: 503 })
          )
        )
    );
    return;
  }

  // 5. Shell assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request))
  );
});
