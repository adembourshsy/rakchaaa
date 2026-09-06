/* RAKCHA GAME - Production Mobile-Optimized Offline Service Worker */
const CORE_CACHE = 'rakcha-core-v2';
const MEDIA_CACHE = 'rakcha-media-v2';

// 1. Critical App Shell Assets (Pre-cached for immediate instant startup)
const CORE_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest'
];

// Offline SVG Image Fallback for uncached image requests when completely offline
const OFFLINE_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="20" fill="#1E293B"/>
  <circle cx="60" cy="48" r="22" fill="#47A5FF" opacity="0.5"/>
  <path d="M25,100 C25,75 40,65 60,65 C80,65 95,75 95,100 Z" fill="#47A5FF" opacity="0.5"/>
</svg>`;

// Helper: Identify media/image/audio assets for Lazy Caching
function isMediaAsset(url) {
  const pathname = url.pathname.toLowerCase();
  return (
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.mp3') ||
    pathname.endsWith('.wav') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    url.hostname.includes('dicebear.com') ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('googleusercontent.com')
  );
}

// Helper: Identify core JS/CSS script assets
function isCoreCodeAsset(url) {
  const pathname = url.pathname.toLowerCase();
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  );
}

// 1. Install Event - Pre-cache core shell only (lightweight & fast initial install on mobile)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => {
      console.log('[ServiceWorker] Pre-caching core app shell');
      return cache.addAll(CORE_SHELL_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event - Clear obsolete caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CORE_CACHE && key !== MEDIA_CACHE)
          .map((key) => {
            console.log('[ServiceWorker] Deleting legacy cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event - Optimized Dual-Layer Caching Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET, WebSockets, Firebase, or internal API calls
  if (
    request.method !== 'GET' ||
    url.protocol.startsWith('ws') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebase')
  ) {
    return;
  }

  // STRATEGY A: Single Page Application Navigation (App Shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CORE_CACHE).then((cache) => cache.put('/', copy));
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('[ServiceWorker] Serving offline SPA shell for navigation');
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // STRATEGY B: Core Code Assets (JS & CSS Bundles) - Stale-While-Revalidate
  if (isCoreCodeAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CORE_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // STRATEGY C: Media & Non-Essential Assets - Lazy Cache-First with Network Update & SVG Fallback
  if (isMediaAsset(url)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Lazy revalidate in background when online
            fetch(request).then((netResponse) => {
              if (netResponse && netResponse.status === 200) {
                cache.put(request, netResponse);
              }
            }).catch(() => {/* Silent background failure when offline */});
            return cachedResponse;
          }

          // Otherwise fetch from network and store in media cache lazily
          return fetch(request).then((netResponse) => {
            if (netResponse && netResponse.status === 200) {
              cache.put(request, netResponse.clone());
            }
            return netResponse;
          }).catch(() => {
            // If offline and request was for an image, serve clean SVG placeholder
            if (request.destination === 'image' || isMediaAsset(url)) {
              return new Response(OFFLINE_IMAGE_SVG, {
                headers: { 'Content-Type': 'image/svg+xml' }
              });
            }
          });
        });
      })
    );
    return;
  }

  // STRATEGY D: Generic Fallback
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).catch(() => {/* Ignore generic failures */});
    })
  );
});
