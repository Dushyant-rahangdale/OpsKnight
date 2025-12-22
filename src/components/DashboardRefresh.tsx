'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRefresh() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 500);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
        Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="command-button"
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          border: 'none',
          background: 'white',
          cursor: isRefreshing ? 'not-allowed' : 'pointer',
          color: '#1f2937',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: isRefreshing ? 0.6 : 1,
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
        title="Refresh dashboard data"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ 
          animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
          transformOrigin: 'center'
        }}>
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </button>
    </div>
  );
}

