// Service Worker para PWA
const CACHE_NAME = 'bolos-design-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalar Service Worker e fazer cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(() => {
          console.log('Alguns arquivos não puderam ser cacheados');
        });
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estratégia: Network first, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Não cachear responses que não são 200
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clonar a response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Se a requisição falhar, retornar do cache
        return caches.match(event.request)
          .then(response => {
            return response || new Response('Offline - Página não disponível no cache', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});
