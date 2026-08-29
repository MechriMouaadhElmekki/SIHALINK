'use client';
/**
 * Next.js App Router segment-level error boundary.
 * Shown when any Server Component or client component inside
 * the same route segment throws an unhandled error.
 *
 * This file is automatically used by Next.js — do not rename.
 */
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    // Capture in Sentry if available; degrade gracefully if not.
    import('@sentry/nextjs')
      .then(({ captureException }) => captureException(error))
      .catch(() => {});
    console.error('[error.tsx]', error);
  }, [error]);

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-background"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">حدث خطأ</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          حدث خطأ غير متوقع في هذه الصفحة. تم إعلام فريق الدعم تلقائياً.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            رقم الخطأ: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
        <Button variant="outline" asChild>
          <Link href="/" className="gap-2 flex items-center">
            <Home className="w-4 h-4" />
            الصفحة الرئيسية
          </Link>
        </Button>
      </div>
    </div>
  );
}
