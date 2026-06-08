// Minimal service worker for PWA support
// This file prevents the MIME type error in production

// Increment this version to force cache clearing on all users
const CACHE_NAME = 'tileturnover-v4';
const OLD_CACHES = ['tileturnover-v1', 'tileturnover-v2', 'tileturnover-v3']; // Add old cache names here when updating

function isCacheableRequest(request) {
  if (request.method !== 'GET') {
    return false;
  }
  // Range requests produce 206 responses, which Cache.put rejects
  if (request.headers.get('range')) {
    return false;
  }
  const url = new URL(request.url);
  // Don't cache dynamic API / proxy responses
  if (url.pathname.startsWith('/.netlify/functions/')) {
    return false;
  }
  return true;
}

function isCacheableResponse(response) {
  // Cache API only supports full 200 responses (not 206 partial content)
  return (
    response &&
    response.status === 200 &&
    (response.type === 'basic' || response.type === 'cors')
  );
}

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
  if (!isCacheableRequest(event.request)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (isCacheableResponse(response)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            return cache.put(event.request, responseToCache);
          }).catch(() => {
            // Ignore cache write failures (e.g. quota, unsupported response)
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});
