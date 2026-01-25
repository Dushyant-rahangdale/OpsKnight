'use client';

import { useEffect } from 'react';
import MobileButton from '@/components/mobile/MobileButton';
import { logger } from '@/lib/logger';

export default function MobileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Mobile error boundary triggered', { error });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-3xl">😟</div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h2>
      <p className="max-w-[280px] text-sm text-slate-500 dark:text-slate-400">
        We encountered an error while loading this page.
      </p>
      <MobileButton onClick={reset} variant="primary">
        Try Again
      </MobileButton>
    </div>
  );
}
