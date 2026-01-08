'use client';

import React, { useEffect, useState, useCallback, useRef, memo } from 'react';

type LiveClockProps = {
  timeZone?: string;
};

/**
 * Validates if a timezone string is valid
 */
function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * LiveClock Component
 * Displays a live-updating clock with timezone support
 * Handles hydration mismatch by showing placeholder during SSR
 */
const LiveClock = memo(function LiveClock({ timeZone = 'UTC' }: LiveClockProps) {
  const [time, setTime] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Validate and normalize timezone
  const validTimeZone = isValidTimeZone(timeZone) ? timeZone : 'UTC';

  const formatTime = useCallback(() => {
    try {
      return new Date().toLocaleTimeString('en-US', {
        hour12: false,
        timeZone: validTimeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      // Ultimate fallback
      return new Date().toISOString().slice(11, 19);
    }
  }, [validTimeZone]);

  useEffect(() => {
    // Mark as mounted to enable client-side rendering
    setIsMounted(true);

    // Set initial time after mount to avoid hydration mismatch
    setTime(formatTime());

    // Update every second
    timerRef.current = setInterval(() => {
      setTime(formatTime());
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [formatTime]);

  // During SSR or before hydration, show a placeholder with consistent dimensions
  if (!isMounted || time === null) {
    return (
      <div
        className="font-mono text-sm text-white/60 bg-black/20 px-2 py-1 rounded border border-white/5 tracking-wide flex items-center gap-2 min-w-[100px]"
        aria-label="Loading clock"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" aria-hidden="true" />
        <span className="opacity-50">--:--:--</span>
      </div>
    );
  }

  const displayTimeZone = validTimeZone === 'UTC' ? 'UTC' : '';

  return (
    <div
      className="font-mono text-sm text-white/60 bg-black/20 px-2 py-1 rounded border border-white/5 tracking-wide flex items-center gap-2 min-w-[100px]"
      role="timer"
      aria-label={`Current time: ${time} ${displayTimeZone}`.trim()}
      aria-live="off"
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] shrink-0"
        aria-hidden="true"
      />
      <span>
        {time}
        {displayTimeZone && ` ${displayTimeZone}`}
      </span>
    </div>
  );
});

export default LiveClock;
