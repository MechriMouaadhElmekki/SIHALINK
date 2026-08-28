import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'سيهالينك | SIHALINK', template: '%s | SIHALINK' },
  description: 'منصة التنسيق الرقمي للطوارئ والرعاية الصحية في الجزائر | Plateforme de coordination d\'urgence et de soins de santé | Emergency and Healthcare Coordination Platform',
  keywords: ['طوارئ', 'صحة', 'الجزائر', 'urgence', 'santé', 'Algérie', 'emergency', 'healthcare', 'Algeria'],
  openGraph: {
    type: 'website',
    siteName: 'SIHALINK',
    title: 'SIHALINK - منصة الطوارئ والرعاية الصحية',
    description: 'منصة رقمية متكاملة للطوارئ والرعاية الصحية',
  },
  robots: { index: false, follow: false }, // Private app - don't index
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
