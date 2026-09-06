/**
 * RAKCHA GAME - Service Worker Registration Handler
 * Registers /sw.js to support full offline caching and AI gameplay.
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Service Worker registered successfully with scope:', registration.scope);

        // Check for updates periodically or on page focus
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[SW] New content is available; please refresh.');
                } else {
                  console.log('[SW] Content is cached for offline use.');
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.warn('[SW] Service Worker registration failed:', error);
      });
  });

  // Track online / offline transitions globally
  window.addEventListener('online', () => {
    console.log('[SW] Device is ONLINE');
  });

  window.addEventListener('offline', () => {
    console.log('[SW] Device is OFFLINE - Offline AI Game Mode Active');
  });
}
