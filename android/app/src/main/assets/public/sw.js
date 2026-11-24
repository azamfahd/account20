/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-435d9fc8'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "version.json",
    "revision": "9cc30c468d46e2569171b9566205d91a"
  }, {
    "url": "manifest.webmanifest",
    "revision": "19c81fa7b8bc0167260e78c17501ee50"
  }, {
    "url": "manifest.json",
    "revision": "ff79d4a5e43d65b3b56d2ee6d9f42467"
  }, {
    "url": "index.html",
    "revision": "1d0d9cd0640b31444c7eadc4b86b5bf4"
  }, {
    "url": "icon.svg",
    "revision": "00d4b7713fc05c8160de1d0418c900bf"
  }, {
    "url": "icon.png",
    "revision": "b40954c3aedfadda560e5bda16c2ca89"
  }, {
    "url": "icons/icon-512.png",
    "revision": "b40954c3aedfadda560e5bda16c2ca89"
  }, {
    "url": "icons/icon-192.png",
    "revision": "b40954c3aedfadda560e5bda16c2ca89"
  }, {
    "url": "icons/apple-touch-icon.png",
    "revision": "b40954c3aedfadda560e5bda16c2ca89"
  }, {
    "url": "fonts/fonts.css",
    "revision": "259e1271fa4d23f4b75951af83160409"
  }, {
    "url": "fonts/font_9.woff2",
    "revision": "3c577e3e44483c7aa38a883944ff6793"
  }, {
    "url": "fonts/font_8.woff2",
    "revision": "4c0c89d4620a664ecf7ad7cce9b81f04"
  }, {
    "url": "fonts/font_7.woff2",
    "revision": "bb99562a6788232db3c2b10595a81b9c"
  }, {
    "url": "fonts/font_6.woff2",
    "revision": "034ef8ba89c4746a0742971fdd8f9a2a"
  }, {
    "url": "fonts/font_5.woff2",
    "revision": "9e49303c70a55644c2a703d5bc75ef0f"
  }, {
    "url": "fonts/font_4.woff2",
    "revision": "b640f7cc591829e5c15f75cbce147288"
  }, {
    "url": "fonts/font_3.woff2",
    "revision": "2f4baa37acd59bb82deddd7e19072588"
  }, {
    "url": "fonts/font_22.woff2",
    "revision": "225bec38cef74d1d52c7820c330b70cd"
  }, {
    "url": "fonts/font_21.woff2",
    "revision": "d43bdaf8c4b964042d4dfc36afd8db59"
  }, {
    "url": "fonts/font_20.woff2",
    "revision": "8919692b60d10a862ed1013967a66fea"
  }, {
    "url": "fonts/font_2.woff2",
    "revision": "19ca2417ce10dc2c51841e3982076e6f"
  }, {
    "url": "fonts/font_19.woff2",
    "revision": "4a4c2fbb8107b87c4ca7efc5af4b915d"
  }, {
    "url": "fonts/font_18.woff2",
    "revision": "3c9597566d23234e05dc818314188491"
  }, {
    "url": "fonts/font_17.woff2",
    "revision": "2ef88f3a969dc5395f2dca66e6259630"
  }, {
    "url": "fonts/font_16.woff2",
    "revision": "4d90a59cb1819bdd41f970549ab90a16"
  }, {
    "url": "fonts/font_15.woff2",
    "revision": "4c5c0287a8138f758681dacfc6372183"
  }, {
    "url": "fonts/font_14.woff2",
    "revision": "3d88475e0c28c2b6e362201a78e01dbb"
  }, {
    "url": "fonts/font_13.woff2",
    "revision": "35cc62ea9b6fb81feec20df945383dbc"
  }, {
    "url": "fonts/font_12.woff2",
    "revision": "bfb9ffaad3d9b4368a6b496e5274212b"
  }, {
    "url": "fonts/font_11.woff2",
    "revision": "8b9cb606b1961f68b460c89ef8a5e4fe"
  }, {
    "url": "fonts/font_10.woff2",
    "revision": "6d1c9ee88b97ac7d6a586ab755d563fa"
  }, {
    "url": "fonts/font_1.woff2",
    "revision": "72fc5452fa477d3831af7c78736adabc"
  }, {
    "url": "assets/vendor-Dl0vyk7S.js",
    "revision": null
  }, {
    "url": "assets/vectorEngine-CdE-Q0AN.js",
    "revision": null
  }, {
    "url": "assets/index-kfygFDfG.js",
    "revision": null
  }, {
    "url": "assets/index-DXPXlReC.css",
    "revision": null
  }, {
    "url": "assets/index-CQ5V5bRc.js",
    "revision": null
  }, {
    "url": "assets/index-B_yTljSw.js",
    "revision": null
  }, {
    "url": "assets/icons-CCAYq9zq.js",
    "revision": null
  }, {
    "url": "assets/firebase-BHWpklJs.js",
    "revision": null
  }, {
    "url": "assets/db-0w_aRDHb.js",
    "revision": null
  }, {
    "url": "assets/charts-LBAWia7P.js",
    "revision": null
  }, {
    "url": "assets/SmartImport-CprTO94J.js",
    "revision": null
  }, {
    "url": "assets/SmartAnalytics-rRBVJ5jY.js",
    "revision": null
  }, {
    "url": "assets/SettingsView-DvS-J0Cu.js",
    "revision": null
  }, {
    "url": "icon.png",
    "revision": "b40954c3aedfadda560e5bda16c2ca89"
  }, {
    "url": "icon.svg",
    "revision": "00d4b7713fc05c8160de1d0418c900bf"
  }, {
    "url": "manifest.json",
    "revision": "ff79d4a5e43d65b3b56d2ee6d9f42467"
  }, {
    "url": "fonts/fonts.css",
    "revision": "259e1271fa4d23f4b75951af83160409"
  }, {
    "url": "icons/apple-touch-icon.png",
    "revision": "b40954c3aedfadda560e5bda16c2ca89"
  }, {
    "url": "icons/icon-192.png",
    "revision": "b40954c3aedfadda560e5bda16c2ca89"
  }, {
    "url": "icons/icon-512.png",
    "revision": "b40954c3aedfadda560e5bda16c2ca89"
  }, {
    "url": "manifest.webmanifest",
    "revision": "19c81fa7b8bc0167260e78c17501ee50"
  }], {
    "ignoreURLParametersMatching": [/.*/]
  });
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    allowlist: [/^(?!\/__).*/],
    denylist: [/\.apk$/i, /.*\.apk.*/i, /^\/api\/.*/, /^https?:\/\/github\.com\/.*/i, /^https?:\/\/.*githubusercontent\.com\/.*/i]
  }));
  workbox.registerRoute(({
    request,
    url
  }) => url.origin === self.location.origin && (request.destination === "script" || request.destination === "style" || request.destination === "worker" || url.pathname.startsWith("/assets/")), new workbox.StaleWhileRevalidate({
    "cacheName": "app-assets-cache",
    plugins: [new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(({
    request,
    url
  }) => url.origin === self.location.origin && (request.destination === "font" || url.pathname.startsWith("/fonts/") || url.pathname.endsWith(".woff2") || url.pathname.endsWith(".woff") || url.pathname.endsWith(".ttf")), new workbox.CacheFirst({
    "cacheName": "app-local-fonts",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(({
    request,
    url
  }) => url.origin === self.location.origin && (request.destination === "image" || url.pathname.startsWith("/icons/") || url.pathname.endsWith(".png") || url.pathname.endsWith(".svg") || url.pathname.endsWith(".ico")), new workbox.CacheFirst({
    "cacheName": "app-images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 5184000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-stylesheets",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-webfonts",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 30,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
