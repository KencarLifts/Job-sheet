/* Service worker: caches the app shell so the app opens instantly and offline.
   Supabase (cross-origin) requests are never cached. Bump VERSION after every update. */
const VERSION = 'jobsheets-v12';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'config.js', 'embed.js', 'manifest.json',
  'assets/logo.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'vendor/supabase.js', 'vendor/591.supabase.js', 'vendor/jspdf.umd.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u=>c.add(u).catch(()=>console.warn('SW: could not cache',u))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  if (new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)).catch(() => {}); }
      return res;
    }).catch(() => hit || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    return hit || net;
  }));
});
