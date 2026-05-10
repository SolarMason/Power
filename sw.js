/* NEPA-PRO Power Tracker — Service Worker */
const VERSION = 'v1.1.0';
const SHELL_CACHE = 'power-shell-' + VERSION;
const DATA_CACHE  = 'power-data-' + VERSION;

const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js',
  'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js',
  'https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { credentials: 'omit' })))).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== SHELL_CACHE && k !== DATA_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isApiRequest(url) {
  return url.includes('openenergyhub.ornl.gov')
      || url.includes('ornl.opendatasoft.com')  // legacy fallback during transition
      || url.includes('api.weather.gov');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = req.url;

  // Network-first, cache fallback for API
  if (isApiRequest(url)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200) {
          const cache = await caches.open(DATA_CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response(JSON.stringify({ results: [], features: [] }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })());
    return;
  }

  // Cache-first for shell + static
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200 && (url.startsWith(self.location.origin) || url.includes('jsdelivr.net') || url.includes('fonts.gstatic.com') || url.includes('fonts.googleapis.com'))) {
        const cache = await caches.open(SHELL_CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      // Offline fallback to root
      if (req.mode === 'navigate') {
        const root = await caches.match('/');
        if (root) return root;
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
