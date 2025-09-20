// Parthmax Premium Calculator - Service Worker
// Version 1.0 - Luxury Calculations Offline
const CACHE_NAME = 'parthmax-premium-calculator-v1.0';
const CACHE_VERSION = '1.0.0';

// Assets to cache for offline functionality
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add any additional assets like custom fonts, icons, etc.
];

// Advanced caching strategies for premium experience
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_THEN_NETWORK: 'cache-then-network'
};

// Install event - Cache essential resources
self.addEventListener('install', event => {
  console.log('🚀 Parthmax Premium Calculator - Service Worker Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell and essential resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Cache setup complete - Ready for offline use');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Cache setup failed:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('⚡ Parthmax Premium Calculator - Service Worker Activated');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old cache versions
            if (cacheName !== CACHE_NAME && cacheName.startsWith('parthmax-premium-calculator-')) {
              console.log('🧹 Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('🎯 Cache cleanup complete');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - Serve cached content with fallback strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests and essential resources
  if (url.origin === location.origin) {
    event.respondWith(handleRequest(request));
  }
});

// Advanced request handling with multiple strategies
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy: Cache First (for app shell and static assets)
    if (request.method === 'GET') {
      return await cacheFirstStrategy(request);
    }
    
    // For non-GET requests, go to network
    return await fetch(request);
    
  } catch (error) {
    console.error('🔥 Request handling error:', error);
    return await handleOfflineFallback(request);
  }
}

// Cache First Strategy - Perfect for static assets
async function cacheFirstStrategy(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('⚡ Served from cache:', request.url);
      
      // Background cache update for freshness
      updateCacheInBackground(request);
      
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('📥 Cached new resource:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('🌐 Network error, serving from cache:', error);
    return await caches.match(request) || await handleOfflineFallback(request);
  }
}

// Background cache update for optimal user experience
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      console.log('🔄 Background cache update:', request.url);
    }
  } catch (error) {
    // Silent fail for background updates
    console.log('🔇 Background update failed (normal in offline mode)');
  }
}

// Offline fallback handling
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For HTML requests, serve the main app
  if (request.headers.get('accept')?.includes('text/html')) {
    const cachedApp = await caches.match('/index.html') || await caches.match('/');
    if (cachedApp) {
      return cachedApp;
    }
  }
  
  // Return a custom offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'Parthmax Premium Calculator is currently offline. Please check your connection.',
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

// Message handling for communication with the app
self.addEventListener('message', event => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      caches.has(CACHE_NAME).then(hasCache => {
        event.ports[0].postMessage({
          type: 'CACHE_STATUS',
          cached: hasCache,
          version: CACHE_VERSION
        });
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_CLEARED',
          success: true
        });
      });
      break;
      
    default:
      console.log('🤔 Unknown message type:', type);
  }
});

// Background sync for enhanced offline capabilities (if supported)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement any background sync logic here
  // For a calculator, this might be syncing calculation history
  console.log('✨ Background sync completed');
}

// Push notifications (for future features)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Calculator',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Parthmax Premium Calculator', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🌟 Parthmax Premium Calculator Service Worker - Ready for luxury calculations!');
