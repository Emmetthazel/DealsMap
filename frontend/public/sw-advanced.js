importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Enable Workbox logging
workbox.setConfig({ debug: false });

// Cache names
const CACHE_NAMES = {
  STATIC: 'dealsmap-static-v2',
  DYNAMIC: 'dealsmap-dynamic-v2',
  API: 'dealsmap-api-v2',
  IMAGES: 'dealsmap-images-v2'
};

// Cache strategies
const STATIC_CACHE_STRATEGY = new workbox.strategies.CacheFirst({
  cacheName: CACHE_NAMES.STATIC,
  plugins: [
    new workbox.expiration.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    }),
  ],
});

const DYNAMIC_CACHE_STRATEGY = new workbox.strategies.NetworkFirst({
  cacheName: CACHE_NAMES.DYNAMIC,
  plugins: [
    new workbox.expiration.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 24 * 60 * 60, // 24 hours
    }),
  ],
});

const API_CACHE_STRATEGY = new workbox.strategies.NetworkFirst({
  cacheName: CACHE_NAMES.API,
  plugins: [
    new workbox.expiration.ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 60 * 60, // 1 hour
    }),
  ],
});

const IMAGE_CACHE_STRATEGY = new workbox.strategies.CacheFirst({
  cacheName: CACHE_NAMES.IMAGES,
  plugins: [
    new workbox.expiration.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    }),
  ],
});

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      console.log('Opened static cache');
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/vite.svg'
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event with advanced routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip unsupported request schemes
  if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:' || url.protocol === 'moz-extension:' || 
      url.protocol === 'edge:' || url.protocol === 'safari:' || url.protocol === 'opera:') {
    return;
  }

  // Skip browser extension requests
  if (url.hostname.includes('chrome-extension') || url.hostname.includes('moz-extension') || 
      url.hostname.includes('edge-extension') || url.hostname.includes('safari-extension')) {
    return;
  }

  // Route API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(API_CACHE_STRATEGY.handle(event));
    return;
  }

  // Route image requests
  if (request.destination === 'image') {
    event.respondWith(IMAGE_CACHE_STRATEGY.handle(event));
    return;
  }

  // Route static assets
  if (request.destination === 'document' || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(STATIC_CACHE_STRATEGY.handle(event));
    return;
  }

  // Route other requests
  event.respondWith(DYNAMIC_CACHE_STRATEGY.handle(event));
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Background sync triggered')
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from DealsMap',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Deals'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DealsMap', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/deals')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
