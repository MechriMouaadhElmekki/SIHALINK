import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SIHALINK | صحة لينك',
    template: '%s | SIHALINK',
  },
  description: 'منصة الطوارئ والرعاية الصحية الرقمية للجزائر | SIHALINK - Digital Emergency & Healthcare Platform for Algeria',
  keywords: ['emergency', 'healthcare', 'Algeria', 'طوارئ', 'صحة', 'الجزائر'],
  authors: [{ name: 'SIHALINK Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SIHALINK',
  },
  openGraph: {
    type: 'website',
    siteName: 'SIHALINK',
    title: 'SIHALINK | منصة الطوارئ والرعاية الصحية',
    description: 'منصة رقمية لإدارة الطوارئ والرعاية الصحية في الجزائر',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)',  color: '#1e3a5f' },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/*
          favicon.ico — legacy browsers
          icon-192.svg — modern browsers (SVG, scalable)
          /icon.png and /apple-icon.png are injected automatically by Next.js
          from app/icon.tsx and app/apple-icon.tsx — do NOT declare them here
          to avoid duplicate <link> tags.
        */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
            <Toaster />
            {/* Registers /sw.js after hydration — client-only, renders nothing */}
            <ServiceWorkerRegister />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
