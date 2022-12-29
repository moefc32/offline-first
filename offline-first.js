// Offline First
// Author  : Faizal Chan. @moefc32
// license : MIT
// https://github.com/moefc32/offline-first

'use strict';

let _CACHE_NAME_PREFIX = 'upup-cache';

let _calculateHash = (input) => {
    input = input.toString();
    let hash = 0, i, chr, len = input.length;

    if (len === 0) {
        return hash;
    }

    for (i = 0; i < len; i++) {
        chr = input.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }

    return hash;
};

self.addEventListener('message', (e) => {
    if (e.data.action === 'set-settings') {
        _parseSettingsAndCache(e.data.settings);
    }
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request).catch(() => {
            return caches.match(e.request).then((response) => {
                if (response) {
                    return response;
                }

                if (e.request.mode === 'navigate' || (e.request.method === 'GET'
                    && e.request.headers.get('accept').includes('text/html'))) {
                    return caches.match('sw-offline-content');
                }
            });
        })
    );
});

let _parseSettingsAndCache = (settings) => {
    let newCacheName =
        _CACHE_NAME_PREFIX + '-' +
        (settings['cache-version'] ? (settings['cache-version'] + '-') : '') +
        _calculateHash(settings['content'] + settings['content-url'] + settings['assets']);
    return caches.open(newCacheName).then((cache) => {
        if (settings['assets']) {
            cache.addAll(settings['assets'].map((urlToPrefetch) => {
                return new Request(urlToPrefetch, { mode: 'no-cors' });
            }));
        }

        if (settings['content-url']) {
            return fetch(settings['content-url'], { mode: 'no-cors' }).then((response) => {
                return cache.put('sw-offline-content', response);
            });
        } else (settings.content) {
            return cache.put('sw-offline-content', _buildResponse(settings.content));
        }
    }).then(() => {
        return caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName.startsWith(_CACHE_NAME_PREFIX)
                        && newCacheName !== cacheName) {
                        return caches.delete(cacheName);
                    }
                })
            );
        });
    });
};

let _buildResponse = (content) => {
    return new Response(content, {
        headers: { 'Content-Type': 'text/html' },
    });
};


(function (undefined) {

    let _root = this;
    let _serviceWorker = navigator.serviceWorker;

    if (!_serviceWorker) {
        _root.offlineFirst = null;
        return undefined;
    }

    let config = {
        'registration-options': {},
        'content': `
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100vh;
                    padding: 30px;
                    text-align: center;
                    box-sizing: border-box;
                }
            </style>
        </head>
        
        <body>
            <h1>Offline</h1>
            <p>You are currently offline, please check your connection or try again later.</p>
        </body>
        
        </html>
        `
    };

    _root.offlineFirst = {
        start: (settings) => {
            this.addSettings(settings);

            _serviceWorker.register(config['registration-options']).then((registration) => {
                let messenger = registration.installing || _serviceWorker.controller || registration.active;
                messenger.postMessage({ 'action': 'set-settings', 'settings': config });
            });
        },
        addSettings: (settings) => {
            settings = settings || {};

            if (typeof settings === 'string') {
                settings = { content: settings };
            }

            ['content-url', 'assets', 'cache-version'].forEach((settingName) => {
                if (settings[settingName] !== undefined) {
                    config[settingName] = settings[settingName];
                }
            });

            if (settings['scope'] !== undefined) {
                config['registration-options']['scope'] = settings['scope'];
            }
        }
    };
}.call(this));

offlineFirst.start({
    // 'content-url': 'offline.html',
    // 'assets': [
    //     'favicon.png',
    // ]
});
