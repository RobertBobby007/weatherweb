self.addEventListener('install', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            return caches.open('weather-cache').then(cache => {
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
            });
        })
    );
});
