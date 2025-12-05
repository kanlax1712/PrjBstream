// Service Worker for Bstream PWA
const CACHE_NAME = 'bstream-v1';
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/live',
  '/search',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache only same-origin resources, skip external URLs
        return Promise.allSettled(
          urlsToCache.map(url => {
            // Only cache same-origin URLs
            if (url.startsWith('/') || url.startsWith(self.location.origin)) {
              return cache.add(url).catch(err => {
                console.log('Failed to cache:', url, err);
                return null;
              });
            }
            return Promise.resolve(null);
          })
        );
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // COMPLETELY SKIP external requests - don't intercept them at all
  // This prevents CSP violations
  if (url.origin !== self.location.origin) {
    // Let the browser handle external requests normally
    // Don't call event.respondWith() for external requests
    return;
  }
  
  // CRITICAL: Skip Next.js internal files - let browser handle them directly
  // These files must be served fresh from the dev server
  if (url.pathname.startsWith('/_next/') || 
      url.pathname.startsWith('/_next-static/') ||
      url.pathname.includes('/_next/static/') ||
      url.pathname.includes('/_next/image') ||
      url.pathname.includes('/_next/webpack-hmr')) {
    // Let the browser handle Next.js internal files normally
    // Don't intercept these requests at all
    return;
  }
  
  // Skip non-GET requests (POST, PUT, DELETE, etc.)
  // Cache API only supports GET requests
  if (request.method !== 'GET') {
    // Let the browser handle non-GET requests normally
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Fetch from network and cache for same-origin requests only
        return fetch(request)
          .then((networkResponse) => {
            // Only cache successful same-origin GET responses
            if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                })
                .catch((err) => {
                  console.log('Cache put failed:', err);
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log('Fetch failed:', request.url, error);
            // Return a basic offline response if available
            return caches.match('/');
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

