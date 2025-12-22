'use client';

import DashboardStatusChart from './DashboardStatusChart';

type UrgencyDistributionData = {
  label: string;
  value: number;
  color: string;
};

type DashboardUrgencyDistributionProps = {
  data: UrgencyDistributionData[];
};

export default function DashboardUrgencyDistribution({ data }: DashboardUrgencyDistributionProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ padding: '0' }}>

      {total === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, margin: '0 auto 0.5rem' }}>
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ margin: 0 }}>No urgency data available</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <DashboardStatusChart data={data} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.map((item) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              return (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.85rem',
                    padding: '0.5rem 0.75rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease'
                  }}
                  className="dashboard-urgency-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: item.color,
                        border: '2px solid white',
                        boxShadow: '0 0 0 1px var(--border)'
                      }}
                    />
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{percentage}%</span>
                    <span style={{ fontWeight: '700', color: item.color, minWidth: '2.5rem', textAlign: 'right' }}>
                      {item.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

