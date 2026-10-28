// Service Worker untuk PWA Bananta Sultan
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // Biarkan fetch berjalan normal (buat nge-cache bisa ditambah nanti)
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// Listener Notifikasi Push (Kalau nanti pakai Web Push)
self.addEventListener('push', (e) => {
  const data = e.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200]
  });
});