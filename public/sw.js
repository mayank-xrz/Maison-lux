const SHELL_CACHE = 'maison-shell-v1';
const IMAGE_CACHE = 'maison-images-v1';
const SHELL_URLS = ['/', '/index.html', '/css/styles.css'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const keep = new Set([SHELL_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache-first for Unsplash images
  if (url.hostname === 'images.unsplash.com') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(resp => { cache.put(request, resp.clone()); return resp; });
        })
      )
    );
    return;
  }

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response('{"error":"offline"}', { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Stale-while-revalidate for app shell
  if (request.mode === 'navigate' || SHELL_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(resp => { cache.put(request, resp.clone()); return resp; });
          return cached || fetchPromise;
        })
      ).catch(() => caches.match('/index.html'))
    );
  }
});
