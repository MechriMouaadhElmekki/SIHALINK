/**
 * SIHALINK Service Worker
 *
 * Strategy:
 *   - Static assets (/offline.html, /manifest.json, icons): Cache-first
 *   - Next.js static chunks (_next/static/*): Cache-first, long TTL
 *   - API routes (/api/*): Network-only — never serve stale health/emergency data
 *   - Navigation requests: Network-first, fallback to /offline.html
 *   - Everything else: Network-first, fallback to cache
 *
 * To force clients to pick up a new SW version, increment CACHE_VERSION.
 *
 * NOTE: Registered by components/pwa/service-worker-register.tsx via useEffect.
 * The public/sw-register.js file is kept as a reference only.
 */

const CACHE_VERSION = 'sihalink-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const SHELL_CACHE  = `${CACHE_VERSION}-shell`;

// Pre-cache only truly static, auth-independent assets.
// '/' is intentionally excluded — it is a dynamic SSR route and
// pre-caching it could serve stale or session-specific content.
const SHELL_URLS = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable.svg',
];

// ── Install: pre-cache static shell assets ────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge stale cache versions ──────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k.startsWith('sihalink-') &&
                k !== STATIC_CACHE &&
                k !== SHELL_CACHE
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET or cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // 2. API routes: strict network-only.
  //    Emergency/health data must NEVER be served from cache.
  //    Return a structured 503 JSON when offline so clients can handle it.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            JSON.stringify({ error: 'offline', code: 503 }),
            {
              status: 503,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
              },
            }
          )
      )
    );
    return;
  }

  // 3. Next.js content-hashed static chunks: cache-first.
  //    Safe because filenames include a content hash — a new deploy
  //    produces new filenames, so stale entries are never accidentally served.
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

  // 4. Navigation (HTML page) requests: network-first.
  //    Fall back to /offline.html only when the network is truly unreachable.
  //    Never serve a cached HTML page for authenticated app routes.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match('/offline.html')
          .then((r) => r ?? new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // 5. Shell/static assets (manifest, icons, offline page itself):
  //    cache-first, fall back to network.
  event.respondWith(
    caches
      .match(request)
      .then((cached) => cached ?? fetch(request))
  );
});
