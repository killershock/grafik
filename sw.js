/* Офлайн-кэш приложения «Графики работы» */
const CACHE = "grafik-v7";
const VERSION = "7";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.svg"
];

// Скачиваем каждый файл с уникальным ?v=, чтобы обойти кэш GitHub Pages:
// иначе после обновления в офлайн-кэш мог попасть старый index.html.
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async (u) => {
      try {
        const res = await fetch(new Request(u + (u.includes("?") ? "&" : "?") + "v=" + VERSION, { cache: "reload" }));
        if (res && res.ok) await cache.put(u, res.clone());
      } catch (e) { /* файл просто не закэшируется */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Страницы: сначала сеть (чтобы подтянуть обновление), иначе кэш.
  // Неудачные ответы (нет сети, 5xx) тоже считаем поводом отдать кэш.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(res => {
        if (!res || !res.ok) throw new Error("bad response");
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(() => {});
        return res;
      }).catch(() =>
        caches.match("./index.html").then(hit => hit || caches.match("./"))
      )
    );
    return;
  }

  // Остальное: сначала кэш, потом сеть
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
