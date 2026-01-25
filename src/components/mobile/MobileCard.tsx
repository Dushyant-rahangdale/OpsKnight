'use client';

import { ReactNode, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

type MobileCardProps = {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
};

const paddingSizes = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantStyles: Record<string, string> = {
  default:
    'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-900 dark:bg-slate-950',
  elevated:
    'rounded-2xl border border-slate-200/60 bg-white shadow-lg dark:border-slate-900/70 dark:bg-slate-950',
  outlined: 'rounded-2xl border border-slate-200 bg-transparent dark:border-slate-900',
  gradient:
    'rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm dark:border-slate-900/70 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950',
};

export default function MobileCard({
  children,
  variant = 'default',
  padding = 'md',
  onClick,
  className = '',
}: MobileCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cn(
        'transition active:scale-[0.99]',
        onClick ? 'cursor-pointer' : 'cursor-default',
        variantStyles[variant],
        paddingSizes[padding],
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

// Card Header sub-component
export function MobileCardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn('flex items-start justify-between', subtitle ? 'mb-2' : 'mb-3')}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Card Section sub-component
export function MobileCardSection({
  children,
  noPadding = false,
}: {
  children: ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div
      className={cn('border-t border-slate-200 dark:border-slate-800', noPadding ? 'p-0' : 'py-3')}
    >
      {children}
    </div>
  );
}
