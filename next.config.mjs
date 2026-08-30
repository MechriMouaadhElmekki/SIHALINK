import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework version
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  experimental: {
    serverActions: {
      // Exact origins only — Next.js does not support wildcard strings here.
      // Add Vercel preview URLs explicitly if/when preview deployments are used.
      allowedOrigins: [
        'localhost:3000',
        'sihalink.dz',
        'www.sihalink.dz',
      ],
    },
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          // Prevent the page from being embedded in iframes (clickjacking)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Stop browsers from MIME-sniffing away from declared content-type
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enforce HTTPS for 2 years, include subdomains
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Limit referrer info on cross-origin requests
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Disable browser features the app doesn't need
          {
            key: 'Permissions-Policy',
            value: [
              'camera=(self)',       // needed for emergency media upload
              'microphone=()',
              'geolocation=(self)', // needed for location reporting
              'payment=()',
              'usb=()',
              'interest-cohort=()', // opt out of FLoC
            ].join(', '),
          },
          // Content Security Policy
          // connect-src includes Sentry ingest endpoint
          // NOTE: tighten script-src with nonce strategy in v2
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self'",
              // Sentry ingest added to connect-src
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io",
              "media-src 'self' blob: https://*.supabase.co",
              // Allow service worker scripts from same origin
              "worker-src 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          // Cross-Origin policies for SharedArrayBuffer safety
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

// Compose: withSentryConfig wraps withNextIntl(nextConfig)
// All existing security headers and config are preserved unchanged.
const sentryWebpackPluginOptions = {
  // Suppress the Sentry CLI output during builds
  silent: true,
  // Upload source maps only in CI/production (SENTRY_AUTH_TOKEN must be set)
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  // Disable source map upload if auth token missing — avoids build failure
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  // Org and project — set via env or hardcode once project is created
  org: process.env.SENTRY_ORG ?? 'sihalink',
  project: process.env.SENTRY_PROJECT ?? 'sihalink-web',
  // Automatically tree-shake Sentry logger statements in production
  disableLogger: true,
  // Tunnel Sentry requests through /monitoring to avoid ad-blockers
  tunnelRoute: '/monitoring',
};

export default withSentryConfig(
  withNextIntl(nextConfig),
  sentryWebpackPluginOptions,
);
