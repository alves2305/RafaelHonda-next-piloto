const PANEL_CACHE_PREFIX = "painel-honda-";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(PANEL_CACHE_PREFIX))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Atende ao requisito de instalação sem armazenar respostas autenticadas.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

// O painel é intencionalmente online: nenhum dado é salvo em cache.
