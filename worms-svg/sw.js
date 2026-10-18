// Funciona sem internet: guarda os arquivos do jogo no aparelho.
// Rede primeiro (para receber versões novas na hora); sem rede, usa a cópia guardada.
const CACHE = 'monstrinhos-18-10-a';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon192.png', './icons/icon512.png',
  './js/sfx.js', './js/data.js', './js/art.js', './js/art2.js', './js/animated-kanto.js', './js/gl.js', './js/ai-worker.js', './js/game.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
