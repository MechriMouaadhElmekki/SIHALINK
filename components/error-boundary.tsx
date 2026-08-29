'use client';
/**
 * Reusable React ErrorBoundary.
 *
 * Wraps any subtree. If Sentry is initialised it will capture the error;
 * if not (no DSN / local dev) it degrades gracefully — the UI fallback
 * still renders and the error is logged to the console.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Something went wrong.</p>}>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 * Or use the default full-page fallback by omitting the fallback prop.
 */
import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Custom fallback UI. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called after the error is captured (e.g. additional logging). */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Send to Sentry if available; silently skip if not initialised.
    try {
      // Dynamic import avoids hard dep — if @sentry/nextjs is not yet
      // installed the catch swallows the module-not-found error.
      import('@sentry/nextjs').then(({ captureException }) => {
        captureException(error, { extra: { componentStack: info.componentStack } });
      }).catch(() => {});
    } catch {
      // Sentry not available — log locally
    }
    console.error('[ErrorBoundary]', error, info);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(this.state.error!, this.reset);
    }

    // Default full-page fallback
    return (
      <div
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-background"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            نعتذر عن هذا الخطأ. تم إرسال تقرير تلقائي لفريق الدعم.
          </p>
        </div>
        <Button onClick={this.reset} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }
}

export default ErrorBoundary;
