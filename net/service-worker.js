const CACHE_NAME = 'game-cache-v5';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/main.js',
  '/style.css',
  '/game/puzzle/level1.js',
  '/game/puzzle/level2.js',
  '/game/puzzle/level3.js',
  '/game/puzzle/player.js',
  '/game/puzzle/box.js',
  '/game/puzzle/button.js',
  '/game/puzzle/pauseMenu.js',
  '/game/puzzle/physics.js',
  '/game/puzzle/plataform.js',
  '/game/puzzle/wall.js',
  '/game/puzzle/secret.js',
  '/game/puzzle/puzzles.js',
  '/engine/loader.js',
  '/engine/entity.js',
  '/engine/stateManager.js',
  '/net/ws-client.js'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching files');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch((err) => console.log('[SW] Cache error:', err))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            // Return offline page or blank response
            console.log('[SW] Fetch failed, offline:', event.request.url);
          });
      })
  );
});
