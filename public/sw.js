/* eslint-disable no-restricted-globals */
const CACHE = "kaleido-v2";
const APP_SHELL = ["/","/index.html","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type === "opaque") return res;
        const clone = res.clone(); caches.open(CACHE).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => cached);
    })
  );
});
