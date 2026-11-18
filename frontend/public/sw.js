const OFFLINE_CACHE = 'quiz-battle-offline-v1';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache => cache.add('/offline.html')));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('quiz-battle-offline-') && key !== OFFLINE_CACHE).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

// Never cache authenticated responses, game sessions, API calls or Socket.IO.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate'
    || url.origin !== self.location.origin || /^\/(api|socket\.io)(\/|$)/.test(url.pathname)) return;
  event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
});
