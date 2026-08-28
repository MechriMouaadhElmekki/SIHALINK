import type { Metadata } from 'next';
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
  description: 'منصة الطوارئ والرعاية الصحية الرقمية للجزائر',
  keywords: ['طوارئ', 'صحة', 'أطباء', 'مواعيد', 'الجزائر', 'urgence', 'santé', 'emergency', 'healthcare'],
  openGraph: {
    type: 'website',
    locale: 'ar_DZ',
    alternateLocale: ['fr_DZ', 'en'],
    title: 'SIHALINK',
    description: 'منصة الطوارئ والرعاية الصحية الرقمية',
    siteName: 'SIHALINK',
  },
  robots: {
    index: false, // Don't index dashboard pages
  },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
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
