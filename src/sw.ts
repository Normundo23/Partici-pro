import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// Precache all assets generated by Vite
precacheAndRoute(self.__WB_MANIFEST);

// Cache Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30
      })
    ]
  })
);

// Network-first strategy for API calls
registerRoute(
  /^https:\/\/api\./,
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
        maxEntries: 50
      })
    ]
  })
);

// Cache static assets
registerRoute(
  /\.(?:js|css|png|jpg|jpeg|svg|gif)$/,
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        maxEntries: 60
      })
    ]
  })
);

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});