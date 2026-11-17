/// <reference lib="webworker" />
/* Wearther Mode service worker: offline app shell, cached closet photos, morning push. */
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// App navigations work offline; the API never goes through the app shell.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/api\//] }));
registerRoute(({ url }) => url.hostname.startsWith('fonts.g'), new CacheFirst({ cacheName: 'fonts' }));
registerRoute(({ url }) => url.pathname.startsWith('/api/images/'), new CacheFirst({ cacheName: 'closet-photos' }));

self.addEventListener('push', (event) => {
  let data = { title: 'Wearther Mode', body: 'Your outfit for today is ready.' };
  try {
    data = { ...data, ...(event.data?.json() ?? {}) };
  } catch {
    /* plain-text payload */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body, icon: 'pwa-192.png', badge: 'pwa-192.png', tag: 'morning-outfit' }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list[0];
      return open ? open.focus() : self.clients.openWindow('./');
    }),
  );
});
