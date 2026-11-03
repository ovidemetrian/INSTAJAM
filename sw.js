// InstaJam offline worker
// Pages, manifest and scripts: network first, so every update reaches the phone; the stored copy is used only when offline.
// Videos and icons: stored copy first (they rarely change and are the heaviest files).
const CACHE = "instajam-v66";
const FILES = ["./", "index.html", "mix.html", "studio.html", "manifest.json", "icon-192.png", "icon-512.png", "intro.mp4", "mobius.mp4"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const heavy = /\.(mp4|png)$/i.test(url.pathname);
  if (heavy) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res;
    })));
    return;
  }
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
    return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
