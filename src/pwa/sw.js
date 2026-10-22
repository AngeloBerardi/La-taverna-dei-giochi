/* Service worker della Taverna. __BUILD__ è sostituito da scripts/build.js (hash della pagina):
   a ogni deploy cambia, quindi cambia la cache e i telefoni prendono la versione nuova. */
const BUILD = '__BUILD__';
const CACHE = 'taverna-' + BUILD;
const VENDOR = 'taverna-vendor'; // librerie con hash nel nome: non cambiano mai, restano tra un deploy e l'altro
const VENDOR_URL = /*VENDOR*/[];
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => caches.open(VENDOR)).then(c => Promise.all(VENDOR_URL.map(u => c.match(u).then(h => h || c.add(u).catch(() => {}))))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('taverna-') && k !== CACHE && k !== VENDOR).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Pagina: prima la rete (versione aggiornata), con ripiego sulla copia se offline o lenta (> 4 s).
function paginaRete(req) {
  return new Promise(res => {
    let fatto = false;
    const dallaCache = () => caches.match('/').then(r => r || Response.error());
    const t = setTimeout(() => { if (!fatto) { fatto = true; dallaCache().then(res); } }, 4000);
    fetch(req).then(r => {
      clearTimeout(t);
      if (r.ok) caches.open(CACHE).then(c => c.put('/', r.clone()));
      if (!fatto) { fatto = true; res(r); }
    }).catch(() => { clearTimeout(t); if (!fatto) { fatto = true; dallaCache().then(res); } });
  });
}

// Il resto: subito dalla cache, e si aggiorna in sottofondo.
function vecchioNuovo(req, nome) {
  return caches.open(nome).then(c => c.match(req).then(hit => {
    const rete = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r }).catch(() => hit);
    return hit || rete;
  }));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (req.mode === 'navigate') return e.respondWith(paginaRete(req));
    if (u.pathname === '/sw.js') return;
    if (u.pathname.startsWith('/vendor/')) return e.respondWith(caches.open(VENDOR).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r }))));
    return e.respondWith(vecchioNuovo(req, CACHE));
  }
});

// Notifiche push (usate quando si collega Firebase Cloud Messaging): { title, body, url }
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  const dati = d.data || d;
  e.waitUntil(self.registration.showNotification(dati.title || 'La Taverna dei Giochi', {
    body: dati.body || 'Tocca a te!', icon: '/icon-192.png', badge: '/icon-192.png',
    tag: dati.tag || 'taverna', data: { url: dati.url || '/' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) if ('focus' in w) { if ('navigate' in w && url !== '/') w.navigate(url); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
