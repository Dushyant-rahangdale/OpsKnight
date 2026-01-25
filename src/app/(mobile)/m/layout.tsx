import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MobileNav from '@/components/mobile/MobileNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import { ToastProvider } from '@/components/ToastProvider';
import '@/app/globals.css';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import MobileSwipeNavigator from '@/components/mobile/MobileSwipeNavigator';
import MobileNetworkBanner from '@/components/mobile/MobileNetworkBanner';
import { TimezoneProvider } from '@/contexts/TimezoneContext';
import { UserAvatarProvider } from '@/contexts/UserAvatarContext';

// Force all app routes to be dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(await getAuthOptions());

  if (!session?.user?.email) {
    redirect('/m/login');
  }

  // Fetch full user details to handle avatar/timezone
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      gender: true,
      timeZone: true,
    },
  });

  if (!dbUser) {
    // Session is stale or user was deleted
    redirect('/api/auth/signout?callbackUrl=/m/login');
  }

  // Incident Counts Logic (Same as Desktop)
  let criticalOpenCount = 0;
  let mediumOpenCount = 0;
  let lowOpenCount = 0;

  try {
    const openUrgencyCounts = await prisma.incident.groupBy({
      by: ['urgency'],
      where: {
        status: { notIn: ['RESOLVED', 'SNOOZED', 'SUPPRESSED'] as const },
      },
      _count: { _all: true },
    });

    for (const entry of openUrgencyCounts) {
      if (entry.urgency === 'HIGH') criticalOpenCount = entry._count._all;
      else if (entry.urgency === 'MEDIUM') mediumOpenCount = entry._count._all;
      else if (entry.urgency === 'LOW') lowOpenCount = entry._count._all;
    }
  } catch (error) {
    console.error('Failed to load incident counts', error);
  }

  // Determine System Status
  let systemStatus: 'ok' | 'warning' | 'danger' = 'ok';
  if (criticalOpenCount > 0) systemStatus = 'danger';
  else if (mediumOpenCount > 0) systemStatus = 'warning';

  return (
    <ToastProvider>
      <TimezoneProvider initialTimeZone={dbUser.timeZone || 'UTC'}>
        <UserAvatarProvider
          currentUserId={dbUser.id}
          currentUserAvatar={dbUser.avatarUrl}
          currentUserGender={dbUser.gender}
          currentUserName={dbUser.name || 'User'}
        >
          <div
            className={`mobile-shell flex min-h-[100dvh] flex-col bg-background transition-colors ${
              systemStatus === 'danger'
                ? 'bg-red-50/30 dark:bg-red-950/10'
                : systemStatus === 'warning'
                  ? 'bg-amber-50/30 dark:bg-amber-950/10'
                  : ''
            }`}
            data-status={systemStatus}
          >
            <MobileHeader systemStatus={systemStatus} />
            <main className="flex-1 overflow-y-auto pb-[calc(70px+env(safe-area-inset-bottom))]">
              <MobileNetworkBanner />
              <MobileSwipeNavigator>
                <PullToRefresh>{children}</PullToRefresh>
              </MobileSwipeNavigator>
            </main>
            <MobileNav />
          </div>
        </UserAvatarProvider>
      </TimezoneProvider>
    </ToastProvider>
  );
}
