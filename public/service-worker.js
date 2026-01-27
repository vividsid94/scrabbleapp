// Minimal service worker for PWA support
// This file prevents the MIME type error in production

// Increment this version to force cache clearing on all users
const CACHE_NAME = 'tileturnover-v2';
const OLD_CACHES = ['tileturnover-v1']; // Add old cache names here when updating

// Install: Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation of new service worker
});

// Activate: Delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches
            return OLD_CACHES.includes(cacheName) || 
                   (cacheName.startsWith('tileturnover-') && cacheName !== CACHE_NAME);
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch: Network-first strategy for better updates
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network request succeeds, cache and return it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});
