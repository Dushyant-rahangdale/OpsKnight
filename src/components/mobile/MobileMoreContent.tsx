import Link from 'next/link';
import type { ReactNode } from 'react';
import MobileThemeToggle from '@/components/mobile/MobileThemeToggle';
import PushNotificationToggle from '@/components/mobile/PushNotificationToggle';
import { MobileAvatar } from '@/components/mobile/MobileUtils';
import PwaInstallCard from '@/components/mobile/PwaInstallCard';
import MobileSignOutButton from '@/components/mobile/MobileSignOutButton';

type Tone = 'blue' | 'teal' | 'amber' | 'green' | 'slate' | 'red';

type ShortcutItem = {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
  tone: Tone;
};

type ListItem = {
  href?: string;
  label: string;
  description?: string;
  icon: ReactNode;
  tone: Tone;
  rightElement?: ReactNode;
  danger?: boolean;
};

type MobileMoreContentProps = {
  name: string;
  email: string;
  role: string;
};

const chevronIcon = (
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
);

const iconTeams = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="16" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M3 20c0-3 3-5 5-5s5 2 5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M13 20c0-2.5 2.5-4.5 5-4.5 1.5 0 3 .5 4 1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const iconUsers = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const iconSchedules = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M7 3v4M17 3v4M3 10h18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M8 14h4M8 17h8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const iconPolicies = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path
      d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M9 12l2 2 4-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const iconAnalytics = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path
      d="M4 19V5M4 19h16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M8 15l3-4 3 2 4-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const iconPostmortems = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path d="M7 3h7l4 4v14H7z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M9 13h6M9 17h4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const iconStatus = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path
      d="M4 12h4l2-4 4 8 2-4h4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const iconSettings = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path
      d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M4 12h2M18 12h2M12 4v2M12 18v2M6.5 6.5l1.4 1.4M16.1 16.1l1.4 1.4M6.5 17.5l1.4-1.4M16.1 7.9l1.4-1.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const iconHelp = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M9.5 9a2.5 2.5 0 0 1 4.4 1.5c0 1.5-1.6 2-2.2 2.5-.4.4-.5.8-.5 1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="17.5" r="0.9" fill="currentColor" />
  </svg>
);

const iconDesktop = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <rect
      x="3"
      y="5"
      width="18"
      height="12"
      rx="2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M8 21h8M12 17v4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const iconSignOut = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path
      d="M9 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M3 12h12M9 8l4 4-4 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const getToneClasses = (tone: Tone) => {
  switch (tone) {
    case 'blue':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    case 'teal':
      return 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-300';
    case 'amber':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
    case 'green':
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
    case 'red':
      return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
    case 'slate':
    default:
      return 'bg-slate-100/50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300';
  }
};

export default function MobileMoreContent({ name, email, role }: MobileMoreContentProps) {
  const shortcuts: ShortcutItem[] = [
    {
      href: '/m/teams',
      label: 'Teams',
      description: 'On-call rosters',
      icon: iconTeams,
      tone: 'blue',
    },
    {
      href: '/m/users',
      label: 'Users',
      description: 'Directory & roles',
      icon: iconUsers,
      tone: 'teal',
    },
    {
      href: '/m/schedules',
      label: 'Schedules',
      description: 'Rotations',
      icon: iconSchedules,
      tone: 'green',
    },
    {
      href: '/m/policies',
      label: 'Policies',
      description: 'Escalations',
      icon: iconPolicies,
      tone: 'amber',
    },
  ];

  const resources: ListItem[] = [
    {
      href: '/m/analytics',
      label: 'Analytics',
      description: 'Trends & uptime',
      icon: iconAnalytics,
      tone: 'teal',
    },
    {
      href: '/m/postmortems',
      label: 'Postmortems',
      description: 'Incident reviews',
      icon: iconPostmortems,
      tone: 'amber',
    },
    {
      href: '/m/status',
      label: 'Status Page',
      description: 'Public updates',
      icon: iconStatus,
      tone: 'green',
    },
  ];

  const account: ListItem[] = [
    {
      href: '/settings/profile',
      label: 'Settings',
      description: 'Profile and security',
      icon: iconSettings,
      tone: 'slate',
    },
    {
      href: '/help',
      label: 'Help & Documentation',
      description: 'Guides and support',
      icon: iconHelp,
      tone: 'blue',
    },
  ];

  const actions: ListItem[] = [
    {
      href: '/api/prefer-desktop',
      label: 'Switch to Desktop Mode',
      description: 'Full dashboard view',
      icon: iconDesktop,
      tone: 'slate',
    },
  ];

  const renderItem = (item: ListItem) => {
    const toneClasses = getToneClasses(item.tone);
    const content = (
      <>
        <div
          className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] transition-colors ${toneClasses}`}
        >
          {item.icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={`text-[0.95rem] font-semibold ${item.danger ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}
          >
            {item.label}
          </span>
          {item.description && (
            <span className="text-xs text-muted-foreground">{item.description}</span>
          )}
        </div>
        {item.rightElement ? (
          <div className="ml-auto flex items-center">{item.rightElement}</div>
        ) : (
          chevronIcon
        )}
      </>
    );

    if (item.href) {
      return (
        <Link
          key={item.label}
          href={item.href}
          className="relative flex items-center gap-3.5 bg-background p-4 text-foreground transition-colors after:absolute after:bottom-0 after:left-[3.75rem] after:right-0 after:h-[1px] after:bg-border last:after:hidden hover:bg-muted/50 active:bg-muted"
        >
          {content}
        </Link>
      );
    }

    return (
      <div
        key={item.label}
        className="relative flex items-center gap-3.5 bg-background p-4 text-foreground transition-colors after:absolute after:bottom-0 after:left-[3.75rem] after:right-0 after:h-[1px] after:bg-border last:after:hidden hover:bg-muted/50 active:bg-muted"
      >
        {content}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Hero Section */}
      <section className="relative -mx-4 -mt-4 overflow-hidden rounded-b-[28px] border-b bg-gradient-to-br from-blue-500/10 to-teal-500/10 px-6 pb-8 pt-10 shadow-[0_18px_40px_rgba(0,0,0,0.05)] dark:from-blue-900/20 dark:to-teal-900/20">
        {/* Ambient Blobs */}
        <div className="absolute -right-[60px] -top-[80px] h-[180px] w-[180px] animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-cyan-600/10 blur-3xl" />
        <div className="absolute -bottom-[120px] -left-[80px] h-[180px] w-[180px] animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-blue-600/10 blur-3xl delay-1000" />

        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-background p-1 shadow-lg">
            <MobileAvatar name={name} size="xl" />
          </div>

          <div className="mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{name}</h1>
            <p className="text-sm text-muted-foreground">{email || 'No email on file'}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border bg-background/50 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-foreground backdrop-blur-sm">
                {role}
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link
              href="/m/notifications"
              className="rounded-full border border-blue-200 bg-blue-50/50 px-4 py-2 text-xs font-semibold text-blue-700 transition-active active:scale-95 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
            >
              View Alerts
            </Link>
          </div>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="px-2">
        <h2 className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Shortcuts
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-background p-4 shadow-sm transition-all active:scale-95 active:bg-muted"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${getToneClasses(
                  item.tone
                )}`}
              >
                {item.icon}
              </div>
              <div className="flex min-h-[3rem] flex-col gap-1">
                <span className="text-[0.95rem] font-semibold leading-tight text-foreground">
                  {item.label}
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {item.description}
                </span>
              </div>

              {/* Decorative blob */}
              <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-gradient-radial from-blue-500/20 to-transparent opacity-60 dark:from-blue-500/10" />
            </Link>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section className="px-2">
        <h2 className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Resources
        </h2>
        <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          {resources.map(renderItem)}
        </div>
      </section>

      {/* Preferences */}
      <section className="px-2">
        <h2 className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Preferences
        </h2>
        <div className="flex flex-col gap-3">
          <PwaInstallCard />
          <MobileThemeToggle />
          <PushNotificationToggle />
        </div>
      </section>

      {/* Account */}
      <section className="px-2">
        <h2 className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Account
        </h2>
        <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          {account.map(renderItem)}
        </div>
      </section>

      {/* Actions */}
      <section className="mb-4 px-2">
        <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          {actions.map(renderItem)}
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl shadow-sm">
          <MobileSignOutButton
            icon={iconSignOut}
            label="Sign Out"
            description="Sign out of OpsKnight"
            tone="red"
          />
        </div>
      </section>

      <div className="pb-4 text-center text-xs text-muted-foreground opacity-70">
        OpsKnight Mobile v1.0.0
      </div>
    </div>
  );
}
