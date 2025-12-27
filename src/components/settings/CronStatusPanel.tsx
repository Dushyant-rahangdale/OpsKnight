import { getCronSchedulerStatus } from '@/lib/cron-scheduler';

export default function CronStatusPanel() {
    const status = getCronSchedulerStatus();
    const internalCronEnabled = process.env.ENABLE_INTERNAL_CRON === 'true' || process.env.NODE_ENV === 'production';
    const banner = !internalCronEnabled
        ? {
            tone: '#92400e',
            background: '#fef3c7',
            border: '#fbbf24',
            text: 'Internal cron is disabled. Set ENABLE_INTERNAL_CRON=true or run in production to enable it.'
        }
        : !status.running
            ? {
                tone: '#991b1b',
                background: '#fee2e2',
                border: '#fecaca',
                text: 'Internal cron is not running in this process. Restart the app to start it.'
            }
            : null;

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {banner ? (
                <div style={{
                    padding: '0.75rem 1rem',
                    border: `1px solid ${banner.border}`,
                    background: banner.background,
                    color: banner.tone,
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                }}>
                    {banner.text}
                </div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Internal Cron Scheduler
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Status reflects this server process only.
                    </div>
                </div>
                <a href="/settings/system" className="glass-button" style={{ padding: '0.5rem 0.9rem' }}>
                    Refresh
                </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Running</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: status.running ? '#22c55e' : '#dc2626' }}>
                        {status.running ? 'Yes' : 'No'}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Schedule</div>
                    <div style={{ fontSize: '1rem', fontWeight: 500 }}>{status.schedule}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last Run</div>
                    <div style={{ fontSize: '0.95rem' }}>{status.lastRunAt ? status.lastRunAt.toISOString() : '—'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last Success</div>
                    <div style={{ fontSize: '0.95rem' }}>{status.lastSuccessAt ? status.lastSuccessAt.toISOString() : '—'}</div>
                </div>
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: status.lastError ? '#dc2626' : 'var(--text-muted)' }}>
                {status.lastError ? `Last Error: ${status.lastError}` : 'No recent errors.'}
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Internal cron enabled: {internalCronEnabled ? 'Yes' : 'No'} (set `ENABLE_INTERNAL_CRON=true` to force in non-production)
            </div>
        </div>
    );
}
