'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/shadcn/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowUp, Zap } from 'lucide-react';

type PriorityBadgeProps = {
  priority: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
};

function PriorityBadge({ priority, size = 'md', showLabel = true, className }: PriorityBadgeProps) {
  if (!priority) return null;

  const config: Record<string, { label: string; color: string; icon: any }> = {
    P1: {
      label: 'Crisis',
      color: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
      icon: Zap,
    },
    P2: {
      label: 'High',
      color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
      icon: ArrowUp,
    },
    P3: {
      label: 'Medium',
      color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200',
      icon: AlertCircle,
    },
    P4: {
      label: 'Low',
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
      icon: null,
    },
    P5: {
      label: 'Info',
      color: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
      icon: null,
    },
  };

  const {
    label,
    color,
    icon: Icon,
  } = config[priority] || {
    label: priority,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: null,
  };

  const textClass =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0.5'
      : size === 'lg'
        ? 'text-sm px-3 py-1'
        : 'text-xs px-2.5 py-0.5';
  const displayLabel =
    size === 'sm' && !showLabel ? priority : showLabel ? `${priority} - ${label}` : priority;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-bold border shadow-sm flex items-center gap-1.5 shrink-0 transition-colors',
        color,
        textClass,
        className
      )}
    >
      {Icon && <Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      <span>{displayLabel}</span>
    </Badge>
  );
}

export default memo(PriorityBadge);
