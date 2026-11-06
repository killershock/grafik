/* РћС„Р»Р°Р№РЅ-РєСЌС€ РїСЂРёР»РѕР¶РµРЅРёСЏ В«Р“СЂР°С„РёРєРё СЂР°Р±РѕС‚С‹В» */
const CACHE = "grafik-v10";
const VERSION = "10";
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

// РЎРєР°С‡РёРІР°РµРј РєР°Р¶РґС‹Р№ С„Р°Р№Р» СЃ СѓРЅРёРєР°Р»СЊРЅС‹Рј ?v=, С‡С‚РѕР±С‹ РѕР±РѕР№С‚Рё РєСЌС€ GitHub Pages:
// РёРЅР°С‡Рµ РїРѕСЃР»Рµ РѕР±РЅРѕРІР»РµРЅРёСЏ РІ РѕС„Р»Р°Р№РЅ-РєСЌС€ РјРѕРі РїРѕРїР°СЃС‚СЊ СЃС‚Р°СЂС‹Р№ index.html.
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async (u) => {
      try {
        const res = await fetch(new Request(u + (u.includes("?") ? "&" : "?") + "v=" + VERSION, { cache: "reload" }));
        if (res && res.ok) await cache.put(u, res.clone());
      } catch (e) { /* С„Р°Р№Р» РїСЂРѕСЃС‚Рѕ РЅРµ Р·Р°РєСЌС€РёСЂСѓРµС‚СЃСЏ */ }
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

  // РЎС‚СЂР°РЅРёС†С‹: СЃРЅР°С‡Р°Р»Р° СЃРµС‚СЊ (С‡С‚РѕР±С‹ РїРѕРґС‚СЏРЅСѓС‚СЊ РѕР±РЅРѕРІР»РµРЅРёРµ), РёРЅР°С‡Рµ РєСЌС€.
  // РќРµСѓРґР°С‡РЅС‹Рµ РѕС‚РІРµС‚С‹ (РЅРµС‚ СЃРµС‚Рё, 5xx) С‚РѕР¶Рµ СЃС‡РёС‚Р°РµРј РїРѕРІРѕРґРѕРј РѕС‚РґР°С‚СЊ РєСЌС€.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { cache: "no-store" }).then(res => {
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

  // РћСЃС‚Р°Р»СЊРЅРѕРµ: СЃРЅР°С‡Р°Р»Р° РєСЌС€, РїРѕС‚РѕРј СЃРµС‚СЊ
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
