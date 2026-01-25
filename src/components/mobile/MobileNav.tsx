'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type CSSProperties } from 'react';
import { MOBILE_NAV_ITEMS, MOBILE_MORE_ROUTES } from '@/components/mobile/mobileNavItems';

export default function MobileNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const moreIndex = MOBILE_NAV_ITEMS.findIndex(item => item.href === '/m/more');

  // Fetch notification count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications?limit=1');
        if (res.ok) {
          const data = await res.json();
          const unread = (data.notifications || []).filter(
            (n: { unread: boolean }) => n.unread
          ).length;
          setUnreadCount(data.unreadCount || unread);
        }
      } catch {
        // Silent fail
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const resolveActiveIndex = () => {
    const directIndex = MOBILE_NAV_ITEMS.findIndex(item => {
      if (item.href === '/m') return pathname === '/m';
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    });
    if (directIndex >= 0) return directIndex;
    if (
      moreIndex >= 0 &&
      MOBILE_MORE_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))
    ) {
      return moreIndex;
    }
    return -1;
  };

  // Calculate active index for slider position
  const activeIndex = resolveActiveIndex();
  const sliderIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex min-h-[calc(68px+env(safe-area-inset-bottom))] items-center justify-around border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] pt-2 text-slate-600 backdrop-blur-xl transition-all dark:border-slate-900 dark:bg-slate-950 dark:text-slate-200"
      style={{ '--mobile-nav-count': MOBILE_NAV_ITEMS.length } as CSSProperties}
    >
      {/* Animated active indicator */}
      <div
        className="absolute bottom-0 left-0 h-full rounded-t-xl bg-gradient-to-b from-primary/10 to-transparent transition-transform duration-300 ease-out"
        style={{
          width: `calc(100% / ${MOBILE_NAV_ITEMS.length})`,
          transform: `translateX(${sliderIndex * 100}%)`,
        }}
        aria-hidden="true"
      />

      {MOBILE_NAV_ITEMS.map((item, index) => {
        const active = index === activeIndex;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative z-10 flex flex-1 max-w-[80px] flex-col items-center justify-center p-1 text-slate-600 transition-all active:scale-95 dark:text-slate-200 ${
              active ? 'text-slate-900 dark:text-white' : ''
            }`}
          >
            {/* Active Top Bar Indicator */}
            {active && (
              <span className="absolute -top-[9px] h-[3px] w-[30%] rounded-b bg-primary shadow-[0_1px_6px_rgba(var(--primary),0.4)]" />
            )}

            <span className="relative flex items-center justify-center">
              {active ? item.iconActive : item.icon}
              {/* Notification badge */}
              {'hasBadge' in item && item.hasBadge && unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] animate-[pulse_2s_ease-in-out_infinite] items-center justify-center rounded-full bg-red-600 px-0.5 text-[0.6rem] font-bold text-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <span
              className={`mt-0.5 text-[0.65rem] font-semibold leading-none transition-all ${
                active ? 'font-bold scale-105' : ''
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
