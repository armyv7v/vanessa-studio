const CACHE_NAME = 'vanessa-nails-studio-cache-v1';
const urlsToCache = [
  '/',
  '/extra-cupos',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Instalación del Service Worker: abre el caché y guarda los archivos principales.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta las solicitudes de red.
self.addEventListener('fetch', (event) => {
  // Solo maneja solicitudes GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si la respuesta está en el caché, la devuelve.
        // Si no, la busca en la red.
        return response || fetch(event.request);
      })
  );
});