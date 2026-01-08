'use client';

import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Button } from '@/components/ui/shadcn/button';
import { Plus, ChevronDown } from 'lucide-react';

type QuickAction = {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
};

type QuickActionsProps = {
  canCreate?: boolean;
};

const quickActions: QuickAction[] = [
  {
    label: 'New Incident',
    href: '/incidents/create',
    description: 'Create a new incident',
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 3 2.5 20h19L12 3Zm0 6 4.5 9h-9L12 9Zm0 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'New Postmortem',
    href: '/postmortems/create',
    description: 'Create postmortem for resolved incident',
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 13H8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 17H8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'New Service',
    href: '/services',
    description: 'Add a new service',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M4 6h16v5H4V6Zm0 7h16v5H4v-5Z" />
      </svg>
    ),
  },
  {
    label: 'New Team',
    href: '/teams',
    description: 'Create a new team',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M7 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm10 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM3 19a4 4 0 0 1 8 0v1H3v-1Zm10 1v-1a4 4 0 0 1 8 0v1h-8Z" />
      </svg>
    ),
  },
  {
    label: 'New Schedule',
    href: '/schedules',
    description: 'Set up on-call schedule',
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M7 3v3m10-3v3M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'New Policy',
    href: '/policies',
    description: 'Create escalation policy',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5Z" />
      </svg>
    ),
  },
];

export default function QuickActions({ canCreate = true }: QuickActionsProps) {
  const router = useRouter();

  if (!canCreate) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-9 gap-1 font-semibold shadow-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
          <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {quickActions.map(action => (
          <DropdownMenuItem
            key={action.href}
            onClick={() => router.push(action.href)}
            className="cursor-pointer py-2 focus:bg-muted"
          >
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-muted-foreground">{action.icon}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{action.label}</span>
                {action.description && (
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                )}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
