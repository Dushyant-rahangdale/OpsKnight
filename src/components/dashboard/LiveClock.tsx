'use client';

import React, { useEffect, useState } from 'react';

type LiveClockProps = {
  timeZone?: string;
};

export default function LiveClock({ timeZone = 'UTC' }: LiveClockProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const formatTime = () => {
      try {
        return new Date().toLocaleTimeString('en-US', {
          hour12: false,
          timeZone: timeZone,
        });
      } catch (e) {
        console.error('Invalid timeZone:', timeZone, e);
        // Fallback to UTC if timezone is invalid
        return new Date().toLocaleTimeString('en-US', {
          hour12: false,
          timeZone: 'UTC',
        });
      }
    };

    // Initial set
    setTime(formatTime());

    const timer = setInterval(() => {
      setTime(formatTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeZone]);

  if (!time) return null; // Prevent hydration mismatch

  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        color: 'rgba(255, 255, 255, 0.6)',
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        letterSpacing: '0.05em',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#22c55e', // Green dot
          boxShadow: '0 0 8px #22c55e',
        }}
      />
      {time} {timeZone === 'UTC' ? 'UTC' : ''}
    </div>
  );
}
