import { Serwist, CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'serwist';

const serwist = new Serwist({
  precacheEntries: [],
  skipWaiting: true,
  clientsClaim: true,
});

serwist.setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    return new Response('offline', { status: 503, statusText: 'Offline' });
  }
  return Response.error();
});

serwist.addEventListeners();
