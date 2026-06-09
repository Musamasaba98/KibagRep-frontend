/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

// Workbox precache manifest injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA offline fallback — all navigation requests (pull-to-refresh, direct URL, back/forward)
// serve the cached index.html so React Router handles routing, not the browser's offline page.
const handler = createHandlerBoundToURL('/index.html');
registerRoute(
  new NavigationRoute(handler, {
    denylist: [/^\/api\//],
  })
);

// ─── Push notification handler ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    urgent?: boolean;
  };

  try {
    data = event.data.json();
  } catch {
    data = { title: 'KibagRep', body: event.data.text() };
  }

  // vibrate is valid in service worker notifications but absent from TS DOM types
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag ?? 'kibagrep',
    data: { url: data.url ?? '/rep-page/reports' },
    vibrate: data.urgent ? [200, 100, 200, 100, 400] : [200, 100, 200],
    requireInteraction: data.urgent ?? false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── Notification click — open / focus the app ───────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url ?? '/rep-page/reports') as string;
  const fullUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // If app already open, focus it and navigate
        for (const client of clients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.focus();
            (client as WindowClient).navigate(fullUrl);
            return;
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(fullUrl);
      })
  );
});
