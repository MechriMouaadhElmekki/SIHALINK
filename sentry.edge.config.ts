/**
 * Sentry Edge Runtime initialisation.
 * Runs in middleware.ts (Vercel Edge Network).
 * The Edge SDK is a strict subset — no Node.js APIs.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  enabled: !!dsn,
  environment: process.env.NODE_ENV ?? 'development',
});
