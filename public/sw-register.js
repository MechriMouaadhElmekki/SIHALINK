/**
 * Service Worker registration.
 * Loaded as a regular <script> in the root layout.
 * Checks for support, registers /sw.js, and logs lifecycle events.
 * Safe no-op in browsers that don't support service workers.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(function (reg) {
        console.log('[SW] Registered, scope:', reg.scope);

        reg.addEventListener('updatefound', function () {
          var newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', function () {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              // A new version is available — could show a toast here
              console.log('[SW] New version available. Refresh to update.');
            }
          });
        });
      })
      .catch(function (err) {
        console.warn('[SW] Registration failed:', err);
      });
  });
})();
