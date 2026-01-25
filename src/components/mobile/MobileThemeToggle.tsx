'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import MobileCard from '@/components/mobile/MobileCard';

export default function MobileThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <MobileCard variant="default" padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎨</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Appearance</span>
          </div>
          <div className="h-7 w-12 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </MobileCard>
    );
  }

  // Use resolvedTheme for actual dark/light detection (handles 'system' correctly)
  const isDark = resolvedTheme === 'dark';
  const isSystemTheme = theme === 'system';

  const handleToggle = () => {
    if (isDark) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const handleSystemReset = () => {
    setTheme('system');
  };

  return (
    <MobileCard variant="default" padding="md">
      <div
        className="flex items-center justify-between"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleToggle();
          }
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{isDark ? '🌙' : '☀️'}</span>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </div>
            {!isSystemTheme && (
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleSystemReset();
                }}
                className="mt-1 text-[11px] font-semibold text-primary"
              >
                Reset to System
              </button>
            )}
          </div>
        </div>

        <div
          className={`relative h-8 w-14 rounded-full p-1 transition ${
            isDark
              ? 'bg-slate-900 shadow-[0_4px_10px_rgba(0,0,0,0.45)]'
              : 'bg-slate-200 dark:bg-slate-900'
          }`}
        >
          <div
            className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs shadow transition dark:bg-slate-800 ${
              isDark ? 'translate-x-7' : 'translate-x-1'
            }`}
          >
            {isDark ? '🌙' : '☀️'}
          </div>
        </div>
      </div>
    </MobileCard>
  );
}
