// Generated into sw.js by tools/build.cjs for source and standalone deployments.
const PREFIX = 'legacy-arena-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = PREFIX + 'a377de062cab8dbb';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const paths = await fetch(new URL('precache.json', self.registration.scope), { cache: 'no-store' }).then(response => { if (!response.ok) throw new Error('Missing offline manifest'); return response.json(); });
    const cache = await caches.open(CACHE);
    await cache.addAll(paths.map(path => new URL(path, self.registration.scope).href));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Source deployments share ../img with Battleground. A controlled Legacy page
  // must be able to read those precached images while offline as well.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('.mp3') || url.pathname.endsWith('/health')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE), cached = await cache.match(event.request);
    if (cached) return cached;
    if (event.request.mode === 'navigate' && url.href.startsWith(self.registration.scope)) { try { return await fetch(event.request); } catch { return (await cache.match(new URL('index.html', self.registration.scope))) || Response.error(); } }
    return fetch(event.request);
  })());
});
