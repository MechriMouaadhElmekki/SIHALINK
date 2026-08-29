'use client';
/**
 * Next.js App Router global error boundary.
 * Shown when the root layout itself throws — the most severe case.
 * Must include its own <html> and <body> tags because the root
 * layout is replaced when this renders.
 *
 * This file is automatically used by Next.js — do not rename.
 */
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    import('@sentry/nextjs')
      .then(({ captureException }) => captureException(error))
      .catch(() => {});
    console.error('[global-error.tsx]', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '1.5rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#0f172a',
          color: '#f8fafc',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'rgba(239,68,68,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle style={{ width: 32, height: 32, color: '#ef4444' }} />
        </div>

        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            خطأ حرج في التطبيق
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', maxWidth: 360 }}>
            حدث خطأ حرج يمنع تحميل التطبيق. يرجى المحاولة مجدداً أو الاتصال بالدعم.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.5rem' }}>
              {error.digest}
            </p>
          )}
        </div>

        <button
          onClick={reset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: 8,
            border: '1px solid #334155',
            background: 'transparent',
            color: '#f8fafc',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <RefreshCw style={{ width: 16, height: 16 }} />
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
