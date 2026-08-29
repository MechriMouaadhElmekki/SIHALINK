/**
 * Sentry server-side initialisation.
 * Runs in Node.js (API routes, Server Components, Route Handlers).
 *
 * Environment variable required:
 *   SENTRY_DSN=https://xxx@oyyy.ingest.sentry.io/zzz
 *   (or NEXT_PUBLIC_SENTRY_DSN — Sentry falls back automatically)
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  enabled: !!dsn,

  environment: process.env.NODE_ENV ?? 'development',

  // Never log to console in production
  debug: process.env.NODE_ENV === 'development',

  beforeSend(event) {
    // Redact Supabase service-role key if it ever leaks into an error message
    if (event.exception) {
      const raw = JSON.stringify(event.exception);
      if (raw.includes('service_role') || raw.includes('eyJ')) {
        return null; // drop the event entirely
      }
    }
    return event;
  },
});
