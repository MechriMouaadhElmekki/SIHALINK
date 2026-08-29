import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SIHALINK | صحة لينك',
    template: '%s | SIHALINK',
  },
  description: 'منصة الطوارئ والرعاية الصحية الرقمية للجزائر | SIHALINK - Digital Emergency & Healthcare Platform for Algeria',
  keywords: ['emergency', 'healthcare', 'Algeria', 'طوارئ', 'صحة', 'الجزائر'],
  authors: [{ name: 'SIHALINK Team' }],
  openGraph: {
    type: 'website',
    siteName: 'SIHALINK',
    title: 'SIHALINK | منصة الطوارئ والرعاية الصحية',
    description: 'منصة رقمية لإدارة الطوارئ والرعاية الصحية في الجزائر',
  },
  robots: {
    index: false, // Don't index app pages
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
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
        <link rel="icon" href="/favicon.ico" />
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
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
