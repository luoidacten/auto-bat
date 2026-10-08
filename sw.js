// Bộ nhớ đệm để chơi không cần mạng (chỉ mã & ảnh; nhạc phát trực tiếp)
const CACHE = 'kdc-gd9b';
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.endsWith('.mp3')) return;
  e.respondWith(caches.open(CACHE).then((c) => fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => c.match(e.request))));
});
