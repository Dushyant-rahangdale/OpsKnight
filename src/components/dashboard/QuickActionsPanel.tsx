'use client';

import Link from 'next/link';
import SidebarWidget, { WIDGET_ICON_BG } from '@/components/dashboard/SidebarWidget';

interface QuickActionsPanelProps {
  greeting: string;
  userName: string;
}

export default function QuickActionsPanel({ greeting, userName }: QuickActionsPanelProps) {
  const actions = [
    {
      href: '/incidents/create',
      label: 'Trigger Incident',
      icon: '🚨',
      variant: 'primary' as const,
    },
    {
      href: '/analytics',
      label: 'View Analytics',
      icon: '📊',
      variant: 'secondary' as const,
    },
    {
      href: '/services',
      label: 'Manage Services',
      icon: '⚙️',
      variant: 'secondary' as const,
    },
  ];

  return (
    <SidebarWidget
      title={`${greeting}, ${userName}`}
      iconBg={WIDGET_ICON_BG.slate}
      icon={<span className="text-lg text-white">⚡</span>}
    >
      <div className="flex flex-col gap-2">
        {actions.map((action, idx) => (
          <Link
            key={idx}
            href={action.href}
            className={
              action.variant === 'primary'
                ? 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm bg-primary text-white border border-primary font-medium text-sm transition-all hover:bg-primary/90 hover:shadow-sm hover:-translate-y-px no-underline'
                : 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm bg-neutral-50 text-secondary-foreground border border-border font-medium text-sm transition-all hover:bg-neutral-100 hover:-translate-y-px no-underline'
            }
          >
            <span className="text-sm opacity-90">{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>
    </SidebarWidget>
  );
}
