// YugaVerse Kids - Copyright (c) 2026 mayurj476. All rights reserved.
// Not for copying, reuse or redistribution without written permission. See LICENSE.
// Offline support: the game keeps working with no internet after the first visit.
const CACHE = 'yugaverse-kids-v9';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './games/animals.js',
  './games/colors.js',
  './games/coloring.js',
  './games/talkingcat.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Newest files from the network first; the cache is only used when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
