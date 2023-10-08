// Offline First
// Author  : Faizal Chan. @moefc32
// license : MIT
// https://github.com/moefc32/offline-first

'use strict';

// If exists, put HTML file here
const htmlPath = '';

// If exists, put static assets here
const assetFiles = [];

const defaultHtml = `
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
`;

(function (o) {
    var e = navigator.serviceWorker;
    if (!e) return this.offlineFirst = null, o;
    var s = false, n = 'font-weight: bold; color: #00f;';

    var serviceWorkerCode = `
        var _CACHE_NAME_PREFIX = 'offline-cache', _calculateHash = function (e) {
            var t, n = 0, s = (e = e.toString()).length;
            if (0 === s) return n;
            for (t = 0; t < s; t++) n = (n << 5) - n + e.charCodeAt(t), n |= 0;
            return n;
        };

        self.addEventListener('message', function (e) {
            'set-settings' === e.data.action && _parseSettingsAndCache(e.data.settings);
        }), self.addEventListener('fetch', function (t) {
            t.respondWith(fetch(t.request).catch(function () {
            return caches.match(t.request).then(function (e) {
                return e || ('navigate' === t.request.mode || 'GET' === t.request.method && t.request.headers.get('accept').includes('text/html') ? caches.match('sw-offline-content') : void 0);
            });
            }));
        });

        var _parseSettingsAndCache = function (e) {
            var t = _CACHE_NAME_PREFIX + '-' + (e['cache-version'] ? e['cache-version'] + '-' : '') + _calculateHash(e.content + e['content-url'] + e.assets);
            return caches.open(t).then(function (t) {
            return e.assets && t.addAll(e.assets.map(function (e) {
                return new Request(e, {mode: 'no-cors'});
            })), e['content-url'] ? fetch(e['content-url'], {mode: 'no-cors'}).then(function (e) {
                return t.put('sw-offline-content', e);
            }) : e.content ? t.put('sw-offline-content', _buildResponse(e.content)) : t.put('sw-offline-content', _buildResponse('You are offline'));
            }).then(function () {
            return caches.keys().then(function (e) {
                return Promise.all(e.map(function (e) {
                if (e.startsWith(_CACHE_NAME_PREFIX) && t !== e) return caches.delete(e);
                }));
            });
            });
        }, _buildResponse = function (e) {
            return new Response(e, {headers: {'Content-Type': 'text/html'}});
        };

        offlineFirst.start({
            'content-url': ${htmlPath ?? defaultHtml},
            'assets': ${assetFiles},
        });
    `;

    var blob = new Blob([serviceWorkerCode], { type: 'application/javascript' });
    var serviceWorkerUrl = URL.createObjectURL(blob);

    this.offlineFirst = {
        start: function (t) {
            this.addSettings(t);
            e.register(serviceWorkerUrl, {}).then(function (t) {
                s && console.log('Service worker registration successful with scope : %c' + t.scope, n);
                (t.installing || e.controller || t.active).postMessage({ action: 'set-settings', settings: t });
            }).catch(function (t) {
                s && console.error('Service worker registration failed : %c' + t, n);
            });
        },
    };
}.call(this));
