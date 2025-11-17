// ============================================
// SERVICE WORKER v6 - PWA AVANZADO
// ============================================
// Cache strategy: Cache-first para assets, Network-first para dinámico

const CACHE_NAME = 'polarity-twins-v6';
const STATIC_CACHE = 'polarity-static-v6';
const DYNAMIC_CACHE = 'polarity-dynamic-v6';
const RUNTIME_CACHE = 'polarity-runtime-v6';

// Archivos críticos (HTML, CSS, JS)
const CRITICAL_FILES = [
  '/',
  '/index.html',
  '/main.js',
  '/style.css',
  '/manifest.json'
];

// Archivos estáticos (módulos del juego)
const STATIC_FILES = [
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
  '/engine/loader.js',
  '/engine/entity.js',
  '/engine/stateManager.js',
  '/net/ws-client.js'
];

// Assets dinámicos (imágenes, sonidos) - se cachean bajo demanda
const ASSETS_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp3', '.wav', '.ogg'];

// ============================================
// INSTALL EVENT - Pre-cache críticos
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW v6] Instalando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache de archivos críticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Cacheando archivos críticos');
        return cache.addAll(CRITICAL_FILES).catch(err => {
          console.warn('[SW] Error cacheando críticos:', err);
        });
      }),
      // Cache de módulos estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Cacheando módulos estáticos');
        return cache.addAll(STATIC_FILES).catch(err => {
          console.warn('[SW] Error cacheando módulos:', err);
        });
      })
    ])
  );
  
  // Activar inmediatamente
  self.skipWaiting();
  console.log('[SW] Instalación completada');
});

// ============================================
// ACTIVATE EVENT - Limpiar caches antiguos
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker v6...');
  
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, RUNTIME_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar control de todas las páginas
  self.clients.claim();
  console.log('[SW] Activación completada');
});

// ============================================
// FETCH EVENT - Estrategia de caching inteligente
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests no-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Determinar estrategia basada en el tipo de recurso
  if (isAsset(url.pathname)) {
    // Assets: Cache-first (usa cache si está disponible)
    event.respondWith(cacheFirstStrategy(request));
  } else if (isModule(url.pathname)) {
    // Módulos JS: Cache-first con update
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // HTML/API: Network-first (intenta red primero)
    event.respondWith(networkFirstStrategy(request));
  }
});

// ============================================
// ESTRATEGIAS DE CACHING
// ============================================

/**
 * Cache-first: Usa cache si existe, si no intenta red
 * Ideal para: Assets estáticos, módulos, imágenes
 */
function cacheFirstStrategy(request) {
  return caches.match(request).then((response) => {
    if (response) {
      console.log('[SW] Sirviendo desde cache:', request.url);
      return response;
    }
    
    // No está en cache, intentar red
    return fetch(request)
      .then((response) => {
        // Validar respuesta
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Clonar y guardar en cache
        const responseToCache = response.clone();
        const cacheName = isAsset(request.url) ? DYNAMIC_CACHE : STATIC_CACHE;
        
        caches.open(cacheName).then((cache) => {
          cache.put(request, responseToCache);
          console.log('[SW] Cacheado:', request.url);
        });
        
        return response;
      })
      .catch(() => {
        // Error de red y no está en cache
        console.warn('[SW] Recurso no disponible offline:', request.url);
        return createOfflineResponse(request.url);
      });
  });
}

/**
 * Network-first: Intenta red primero, fallback a cache
 * Ideal para: HTML, API calls
 */
function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      // Guardar en cache dinámico
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
      return response;
    })
    .catch(() => {
      // Si falla la red, usar cache
      return caches.match(request).then((response) => {
        if (response) {
          console.log('[SW] Sirviendo desde cache (offline):', request.url);
          return response;
        }
        
        // No está en cache tampoco
        console.warn('[SW] Recurso no disponible:', request.url);
        return createOfflineResponse(request.url);
      });
    });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Determina si es un asset (imagen, audio, etc)
 */
function isAsset(pathname) {
  return ASSETS_EXTENSIONS.some(ext => pathname.toLowerCase().endsWith(ext));
}

/**
 * Determina si es un módulo JavaScript
 */
function isModule(pathname) {
  return pathname.includes('/game/') || pathname.includes('/engine/') || pathname.includes('/net/');
}

/**
 * Crea respuesta offline
 */
function createOfflineResponse(url) {
  if (url.includes('/api/')) {
    // API call - retornar JSON error
    return new Response(
      JSON.stringify({ error: 'Offline', status: 'offline' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'application/json' })
      }
    );
  }
  
  // Para otros recursos, retornar página en blanco
  return new Response('No disponible offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({ 'Content-Type': 'text/plain' })
  });
}

// ============================================
// MESSAGE EVENT - Comunicación con el cliente
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    });
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getEstimatedCacheSize().then((size) => {
      event.ports[0].postMessage({ cacheSize: size });
    });
  }
});

/**
 * Obtiene tamaño estimado del cache
 */
async function getEstimatedCacheSize() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return Math.round(estimate.usage / 1024 / 1024) + ' MB';
  }
  return 'Desconocido';
}

// ============================================
// LOGS
// ============================================
console.log('[SW v6] Service Worker v6 listo');
console.log('[SW v6] Estrategia: Cache-first para assets, Network-first para HTML');
console.log('[SW v6] Modo: Offline-first con sincronización');
