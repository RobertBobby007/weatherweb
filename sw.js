// sw.js
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('weather-cache').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/style.css',
                '/scripts3.js',
                '/manifest.json',
                '/NRWW.png',
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
