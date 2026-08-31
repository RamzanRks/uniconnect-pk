const CACHE_NAME = 'uniconnect-v1';
const OFFLINE_URL = '/offline.html';

// Install: Cache the offline shell immediately
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting(); // Skip waiting so updates apply immediately
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim(); // Take control of all tabs immediately
});

// Fetch: Network-first for API, Cache-first for UI/Assets, Offline shell for pages
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request).catch(() => new Response('{"message":"Offline"}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});

// Listen for "Update Now" message from the frontend
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});