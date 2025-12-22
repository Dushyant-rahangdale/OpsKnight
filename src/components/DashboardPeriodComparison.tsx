'use client';

type PeriodComparisonProps = {
  current: {
    total: number;
    open: number;
    resolved: number;
    acknowledged: number;
    critical: number;
  };
  previous: {
    total: number;
    open: number;
    resolved: number;
    acknowledged: number;
    critical: number;
  };
  periodLabel: string;
  previousPeriodLabel: string;
};

export default function DashboardPeriodComparison({
  current,
  previous,
  periodLabel,
  previousPeriodLabel
}: PeriodComparisonProps) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? { percent: 100, absolute: current, isPositive: true } : { percent: 0, absolute: 0, isPositive: false };
    }
    const percent = ((current - previous) / previous) * 100;
    const absolute = current - previous;
    return {
      percent: Math.abs(percent),
      absolute: Math.abs(absolute),
      isPositive: percent > 0,
      isNegative: percent < 0
    };
  };

  const totalChange = calculateChange(current.total, previous.total);
  const openChange = calculateChange(current.open, previous.open);
  const resolvedChange = calculateChange(current.resolved, previous.resolved);
  const acknowledgedChange = calculateChange(current.acknowledged, previous.acknowledged);
  const criticalChange = calculateChange(current.critical, previous.critical);

  const metrics = [
    { label: 'Total Incidents', current: current.total, previous: previous.total, change: totalChange, color: 'var(--text-primary)' },
    { label: 'Open', current: current.open, previous: previous.open, change: openChange, color: '#dc2626' },
    { label: 'Resolved', current: current.resolved, previous: previous.resolved, change: resolvedChange, color: '#16a34a' },
    { label: 'Acknowledged', current: current.acknowledged, previous: previous.acknowledged, change: acknowledgedChange, color: '#2563eb' },
    { label: 'Critical', current: current.critical, previous: previous.critical, change: criticalChange, color: '#ef5350' }
  ];

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span style={{ fontWeight: '600' }}>{periodLabel}</span> vs <span style={{ fontWeight: '600' }}>{previousPeriodLabel}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', fontWeight: '600' }}>
              {metric.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: metric.color }}>
                {metric.current}
              </div>
              {metric.change.percent > 0 && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: metric.change.isPositive ? '#ef5350' : '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <span>{metric.change.isPositive ? '↑' : '↓'}</span>
                  <span>{metric.change.percent.toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Previous: {metric.previous}
            </div>
            {metric.change.absolute > 0 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {metric.change.isPositive ? '+' : '-'}{metric.change.absolute} change
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

