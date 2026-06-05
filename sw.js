```javascript
const CACHE_NAME = 'gigpanion-v1';

// The essential files required to load the app offline
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
  // Add any local icon paths here, e.g., '/icon-192x192.png'
];

// 1. Install event: Cache essential files
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the new service worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate event: Clean up old caches if the CACHE_NAME changes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open pages immediately
  );
});

// 3. Fetch event: Stale-while-revalidate strategy for maximum reliability
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // IMPORTANT: Bypass Firestore/Firebase to prevent breaking the "Live Sync" feature
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Fetch the latest version from the network asynchronously
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache valid responses (status 200) AND opaque responses (status 0) from CDNs like Tailwind/FontAwesome
        if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((error) => {
        console.log('[Service Worker] Network request failed (Offline):', event.request.url);
      });

      // Return the cached response IMMEDIATELY if it exists, otherwise wait for the network
      return cachedResponse || fetchPromise;
    })
  );
});


```
