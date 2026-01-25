'use client';
import Link from 'next/link';
import MobileQuickSwitcher from '@/components/mobile/MobileQuickSwitcher';

type MobileHeaderProps = {
  systemStatus?: 'ok' | 'warning' | 'danger';
};

export default function MobileHeader({ systemStatus = 'ok' }: MobileHeaderProps) {
  const status = (() => {
    switch (systemStatus) {
      case 'ok':
        return 'All Systems Operational';
      case 'warning':
        return 'Degraded Performance';
      case 'danger':
        return 'Critical Issues';
    }
  })();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-950/80">
      <Link href="/m" className="flex items-center gap-2">
        {/* Using img instead of Next.js Image for SVG - no optimization benefit for vectors */}
        <img src="/logo.svg" alt="OpsKnight" width={48} height={48} />
        <span className="text-xl font-extrabold tracking-tight text-foreground">OpsKnight</span>
      </Link>

      <div className="flex items-center gap-2">
        <MobileQuickSwitcher />
        <div
          className={`relative flex items-center gap-2 overflow-hidden rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-sm ${
            systemStatus === 'danger'
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400'
              : systemStatus === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-400'
                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300'
          }`}
        >
          {/* Status Indicator Dot/Icon */}
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full bg-white/50 shadow-sm ring-1 ring-inset dark:bg-slate-900/70 ${
              systemStatus === 'danger'
                ? 'text-red-600 ring-red-200 dark:bg-red-900/40 dark:text-red-400 dark:ring-red-800'
                : systemStatus === 'warning'
                  ? 'text-amber-600 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:ring-amber-800'
                  : 'text-emerald-600 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:ring-emerald-800'
            }`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3">
              <path
                d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8.5 12.5h7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="whitespace-nowrap">{status}</span>

          {/* Animated Sheen Effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </header>
  );
}
