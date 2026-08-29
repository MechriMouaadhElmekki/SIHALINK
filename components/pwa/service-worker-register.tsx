'use client';
/**
 * ServiceWorkerRegister
 *
 * Registers /sw.js after the page has fully hydrated.
 * Must be a 'use client' component so it only runs in the browser —
 * navigator.serviceWorker is not available on the server.
 *
 * Usage: render <ServiceWorkerRegister /> once inside the root layout body.
 */
import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          // updateViaCache: 'none' forces the browser to always revalidate
          // sw.js from the network rather than using the HTTP cache.
          // This ensures SW updates are picked up on every page load.
          updateViaCache: 'none',
        });

        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            if (
              newSW.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // A new SW version is waiting — safe to show a "refresh" toast
              // here in a future iteration. For now, just log.
              console.info('[SW] New version available. Refresh to update.');
            }
          });
        });

        if (process.env.NODE_ENV === 'development') {
          console.info('[SW] Registered, scope:', reg.scope);
        }
      } catch (err) {
        console.warn('[SW] Registration failed:', err);
      }
    };

    // Defer until after the load event so SW registration doesn't compete
    // with critical resource fetches on first paint.
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []); // run once on mount

  // Renders nothing — side-effect only
  return null;
}
