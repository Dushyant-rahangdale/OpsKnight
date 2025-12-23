'use client';

type HistoryStatus = 'operational' | 'degraded' | 'outage';

interface StatusHistoryEntry {
    date: string;
    status: HistoryStatus;
}

interface StatusPageHistoryProps {
    history: StatusHistoryEntry[];
}

const STATUS_STYLES: Record<HistoryStatus, { label: string; color: string }> = {
    operational: { label: 'Operational', color: '#16a34a' },
    degraded: { label: 'Degraded', color: '#f59e0b' },
    outage: { label: 'Outage', color: '#ef4444' },
};

export default function StatusPageHistory({ history }: StatusPageHistoryProps) {
    if (history.length === 0) return null;

    return (
        <section style={{ marginBottom: '2.5rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                gap: '1rem',
                flexWrap: 'wrap',
            }}>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#0f172a',
                    margin: 0,
                }}>
                    Status history
                </h2>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Last 90 days
                </span>
            </div>

            <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '1rem',
                background: '#ffffff',
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${history.length}, minmax(0, 1fr))`,
                    gap: '2px',
                    height: '24px',
                    marginBottom: '0.75rem',
                }}>
                    {history.map((entry) => (
                        <div
                            key={entry.date}
                            title={`${entry.date} - ${STATUS_STYLES[entry.status].label}`}
                            style={{
                                background: STATUS_STYLES[entry.status].color,
                                borderRadius: '2px',
                            }}
                        />
                    ))}
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    fontSize: '0.8125rem',
                    color: '#64748b',
                }}>
                    {Object.entries(STATUS_STYLES).map(([key, value]) => (
                        <div
                            key={key}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '2px',
                                background: value.color,
                                display: 'inline-block',
                            }} />
                            <span>{value.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
