const CACHE_PREFIX = 'chronogrid-nexus';
const CACHE_VERSION = 'v6';
const CACHES = {
  PRECACHE: `${CACHE_PREFIX}-precache-${CACHE_VERSION}`,
  RUNTIME: `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}-api-${CACHE_VERSION}`
};

const PRECACHE_URLS = [
  './',
  './index.html',
  './app.bundle.js',
  './app.css',
  './favicon.png',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-512x512.png',
  './screenshots/screenshot-desktop.png',
  './screenshots/screenshot-mobile.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHES.PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.log('Precache error:', err))
  );
});

self.addEventListener('activate', event => {
  const currentCaches = Object.values(CACHES);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName) && cacheName.startsWith(CACHE_PREFIX)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

const handleApiRequest = async (request) => {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHES.API);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    return new Response(JSON.stringify({
      error: true,
      message: 'Network offline. Loading fallback data.',
      listStory: []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const handleResourceRequest = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHES.RUNTIME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a basic fallback if necessary, or let it fail
    return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
  }
};

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (event.request.method !== 'GET') return;

  if (url.origin.includes('story-api.dicoding.dev')) {
    event.respondWith(handleApiRequest(event.request));
  } else {
    event.respondWith(handleResourceRequest(event.request));
  }
});

self.addEventListener('push', event => {
  let pushData = { title: 'Notification', body: 'You have a new update.' };

  if (event.data) {
    try {
      pushData = event.data.json();
    } catch (e) {
      pushData.body = event.data.text();
    }
  }

  const options = {
    body: pushData.body || 'New content is available!',
    icon: './icons/icon-192x192.png',
    badge: './favicon.png',
    data: {
      url: pushData.id ? `/#/detail/${pushData.id}` : '/#/'
    },
    actions: [{ action: 'view', title: 'Open App' }]
  };

  event.waitUntil(self.registration.showNotification(pushData.title || 'ChronoGrid System Alert', options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/#/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-new-stories') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        windowClients.forEach(client => {
          client.postMessage({ type: 'SYNC_OFFLINE_STORIES' });
        });
      })
    );
  }
});