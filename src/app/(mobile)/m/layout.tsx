import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import MobileNav from '@/components/mobile/MobileNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import MobileHeaderLoader from '@/components/mobile/MobileHeaderLoader';
import '@/app/globals.css';
import './mobile.css';
import './mobile-premium.css';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import MobileSwipeNavigator from '@/components/mobile/MobileSwipeNavigator';
import MobileNetworkBanner from '@/components/mobile/MobileNetworkBanner';
import { TimezoneProvider } from '@/contexts/TimezoneContext';
import { UserAvatarProvider } from '@/contexts/UserAvatarContext';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import MobileBiometricGuard from '@/components/mobile/MobileBiometricGuard';

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

  return (
    <TimezoneProvider initialTimeZone={dbUser.timeZone || 'UTC'}>
      <UserAvatarProvider
        currentUserId={dbUser.id}
        currentUserAvatar={dbUser.avatarUrl}
        currentUserGender={dbUser.gender}
        currentUserName={dbUser.name || 'User'}
      >
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <MobileBiometricGuard>
            <div className="mobile-shell">
              <Suspense fallback={<MobileHeader systemStatus="ok" />}>
                <MobileHeaderLoader />
              </Suspense>

              <main className="mobile-content">
                <MobileNetworkBanner />
                <MobileSwipeNavigator>
                  <PullToRefresh>{children}</PullToRefresh>
                </MobileSwipeNavigator>
              </main>
              <MobileNav />
            </div>
          </MobileBiometricGuard>
        </ThemeProvider>
      </UserAvatarProvider>
    </TimezoneProvider>
  );
}
