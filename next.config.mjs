import createNextIntlPlugin from 'next-intl/plugin';

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
      // localhost for dev + staging/production domains
      // Add your Vercel preview URL pattern if needed: *.vercel.app
      allowedOrigins: [
        'localhost:3000',
        'sihalink.dz',
        'www.sihalink.dz',
        '*.sihalink.dz',
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
              'camera=(self)',          // needed for emergency media upload
              'microphone=()',
              'geolocation=(self)',     // needed for location reporting
              'payment=()',
              'usb=()',
              'interest-cohort=()',     // opt out of FLoC
            ].join(', '),
          },
          // Content Security Policy
          // - default-src self covers most assets
          // - connect-src allows Supabase REST/Realtime/Storage
          // - img-src allows Supabase storage + data URIs (for map tiles)
          // - frame-ancestors none prevents iframe embedding
          // NOTE: tighten script-src further once you have a nonce strategy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // tighten with nonce in v2
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "media-src 'self' blob: https://*.supabase.co",
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

export default withNextIntl(nextConfig);
