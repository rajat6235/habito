// Habito Service Worker
// Strategy:
//   - Static assets (JS/CSS/fonts): Cache First, 30-day TTL
//   - API requests:                 Network First, fall back to cache (5-min TTL)
//   - Pages:                        Stale-While-Revalidate
//   - Offline fallback:             /offline.html

const CACHE_VERSION  = 'v1';
const STATIC_CACHE   = `habito-static-${CACHE_VERSION}`;
const API_CACHE      = `habito-api-${CACHE_VERSION}`;
const PAGE_CACHE     = `habito-pages-${CACHE_VERSION}`;
const OFFLINE_URL    = '/offline.html';

const STATIC_ASSETS = [
  '/',
  OFFLINE_URL,
];

// IndexedDB write queue for offline mutations
const WRITE_QUEUE_DB = 'habito-offline-queue';
const WRITE_QUEUE_STORE = 'requests';

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Remove old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('habito-') && ![STATIC_CACHE, API_CACHE, PAGE_CACHE].includes(k))
            .map((k) => caches.delete(k)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Don't intercept: non-GET mutations (handled by offline queue elsewhere)
  if (event.request.method !== 'GET') return;

  // API: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, API_CACHE, 5 * 60));
    return;
  }

  // Static assets (Next.js chunks): Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE, 30 * 24 * 60 * 60));
    return;
  }

  // HTML pages: Stale-While-Revalidate
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(event.request, PAGE_CACHE));
    return;
  }
});

// ── Strategies ────────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);
  const age      = cached ? getAge(cached) : Infinity;

  if (cached && age < maxAgeSeconds) return cached;

  try {
    const fresh = await fetch(request);
    if (fresh.ok) await cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return cached ?? offlineFallback(request);
  }
}

async function networkFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request, { signal: AbortSignal.timeout(8000) });
    if (fresh.ok) await cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    return cached ?? offlineFallback(request);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((fresh) => {
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  });

  return cached ?? fetchPromise;
}

function offlineFallback(request) {
  if (request.headers.get('accept')?.includes('text/html')) {
    return caches.match(OFFLINE_URL);
  }
  return new Response(JSON.stringify({ error: 'offline' }), {
    status:  503,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getAge(response) {
  const date = response.headers.get('date');
  if (!date) return Infinity;
  return (Date.now() - new Date(date).getTime()) / 1000;
}

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Habito', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Habito', {
      body:    payload.body,
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/badge-72x72.png',
      data:    payload.data,
      actions: payload.actions ?? [],
      tag:     payload.tag ?? 'habito-notification',
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? '/app';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    }),
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'habito-flush-queue') {
    event.waitUntil(flushOfflineQueue());
  }
});

async function flushOfflineQueue() {
  // Open IndexedDB write queue and replay mutations
  const db = await openDB();
  const tx  = db.transaction(WRITE_QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(WRITE_QUEUE_STORE);
  const items = await promisifyRequest(store.getAll());

  for (const item of items) {
    try {
      await fetch(item.url, {
        method:  item.method,
        headers: item.headers,
        body:    item.body,
      });
      await promisifyRequest(store.delete(item.id));
    } catch {
      // Leave in queue for next sync attempt
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(WRITE_QUEUE_DB, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(WRITE_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}
