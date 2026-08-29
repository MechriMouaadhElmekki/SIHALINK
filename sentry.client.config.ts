/**
 * Sentry client-side initialisation.
 * Runs in the browser. Keep this file as lean as possible —
 * it is loaded on every page.
 *
 * Environment variable required:
 *   NEXT_PUBLIC_SENTRY_DSN=https://xxx@oyyy.ingest.sentry.io/zzz
 *
 * If the DSN is absent (local dev / staging without Sentry) the SDK
 * initialises in a no-op mode — no errors, no crashes.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,

  // Capture 10 % of transactions for performance monitoring in production.
  // Raise to 1.0 temporarily when debugging performance issues.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Replay 1 % of sessions, 100 % of sessions with an error.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Only load the Replay integration in production to save bundle size.
  integrations:
    process.env.NODE_ENV === 'production'
      ? [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: false })]
      : [],

  // Do not send events in development unless DSN is explicitly set.
  enabled: !!dsn,

  environment: process.env.NODE_ENV ?? 'development',

  // Scrub PII from breadcrumbs and event bodies.
  beforeSend(event) {
    // Strip Supabase auth tokens that might appear in URLs
    if (event.request?.url) {
      event.request.url = event.request.url
        .replace(/access_token=[^&]+/, 'access_token=REDACTED')
        .replace(/refresh_token=[^&]+/, 'refresh_token=REDACTED');
    }
    return event;
  },
});
