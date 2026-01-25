'use client';

import { signOut } from 'next-auth/react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  icon: ReactNode;
  label: string;
  description: string;
  tone: 'red' | 'slate' | 'blue' | 'teal' | 'amber' | 'green';
};

const getToneClasses = (tone: Props['tone']) => {
  switch (tone) {
    case 'red':
      return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
    case 'blue':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    case 'teal':
      return 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-300';
    case 'amber':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
    case 'green':
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
    case 'slate':
    default:
      return 'bg-slate-100/50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300';
  }
};

export default function MobileSignOutButton({ icon, label, description, tone }: Props) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: '/m/login' });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={cn(
        'relative flex w-full items-center gap-3.5 bg-background p-4 text-left text-foreground transition-all hover:bg-red-50/50 active:bg-red-100/50 dark:hover:bg-red-900/10',
        isSigningOut && 'opacity-70 cursor-wait'
      )}
    >
      <div
        className={cn(
          'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] transition-colors',
          getToneClasses(tone)
        )}
      >
        {isSigningOut ? (
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.95rem] font-semibold text-red-600 dark:text-red-400">
          {isSigningOut ? 'Signing out...' : label}
        </span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <svg className="h-[18px] w-[18px] opacity-60" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9 6l6 6-6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
