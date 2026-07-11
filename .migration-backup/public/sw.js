const CACHE_NAME = 'kzdash-v1';
const STATIC = ['/', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Push notification dari server (jika ada)
self.addEventListener('push', e => {
  if (!e.data) return;
  const { title, body, icon, data } = e.data.json();
  e.waitUntil(
    self.registration.showNotification(title, {
      body, icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'kz-critical',
      renotify: true,
      data,
      actions: [{ action: 'open', title: 'Lihat Detail' }],
    })
  );
});

// Klik notifikasi → buka app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Background sync — cek isu kritis tiap waktu tertentu
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-critical') {
    e.waitUntil(checkCritical());
  }
});

async function checkCritical() {
  try {
    const res = await fetch('/api/data');
    const { data } = await res.json();
    if (!data) return;
    const critical = data.issues?.filter(i => i.severity === 'critical' && i.status !== 'fixed') ?? [];
    if (critical.length > 0) {
      await self.registration.showNotification('Isu Kritis di Channel @kz.tutorial!', {
        body: `${critical.length} isu kritis belum diselesaikan. Cek sekarang!`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'kz-critical',
        renotify: false,
        data: { url: '/?tab=issues' },
        actions: [{ action: 'open', title: 'Buka Dashboard' }],
      });
    }
  } catch {}
}
