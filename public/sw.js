const CACHE_NAME = 'alethia-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/fonts/OpenDyslexic-Regular.woff2',
  '/fonts/OpenDyslexic-Regular.woff',
  '/fonts/OpenDyslexic-Bold.woff2',
  '/fonts/OpenDyslexic-Bold.woff',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Network-first for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for static assets, fonts, JSON bible data y Piper/Kokoro WASM (cross-origin)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const isJson = request.url.endsWith('.json') || request.url.includes('/data/bibles/');
        const isFont = request.url.includes('/fonts/');
        const isKokoro = request.url.includes('huggingface.co') && (request.url.includes('Kokoro') || request.url.includes('piper-voices') || request.url.includes('rhasspy'));
        const isOnnx = request.url.endsWith('.onnx') || request.url.endsWith('.wasm') || request.url.endsWith('.onnx.json') || request.url.endsWith('.bin');
        if (response.ok && (isJson || isFont || isKokoro || isOnnx)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => caches.match(request));
    })
  );
});
