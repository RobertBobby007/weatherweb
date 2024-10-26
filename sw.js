self.addEventListener('install', event => {
    event.waitUntil(
        // Nejprve vymaž staré cache
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );

    event.waitUntil(
        caches.open('weather-cache').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/style.css',
                '/scripts3.js',
                '/manifest.json',
                '/NRWW.png',
            ]).catch(error => {
                console.error('Chyba při ukládání do cache:', error);
            });
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
