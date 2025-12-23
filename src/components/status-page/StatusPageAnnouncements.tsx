'use client';

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: string;
    startDate: Date;
    endDate?: Date | null;
    incidentId?: string | null;
}

interface StatusPageAnnouncementsProps {
    announcements: Announcement[];
}

const TYPE_COLORS = {
    INCIDENT: '#ef4444',
    WARNING: '#f59e0b',
    MAINTENANCE: '#3b82f6',
    UPDATE: '#10b981',
    INFO: '#6b7280',
};

const TYPE_LABELS = {
    INCIDENT: 'Incident',
    WARNING: 'Warning',
    MAINTENANCE: 'Maintenance',
    UPDATE: 'Update',
    INFO: 'Information',
};

export default function StatusPageAnnouncements({ announcements }: StatusPageAnnouncementsProps) {
    if (announcements.length === 0) return null;

    return (
        <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                marginBottom: '1rem',
                color: '#0f172a',
            }}>
                Announcements
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {announcements.map((announcement) => {
                    const color = TYPE_COLORS[announcement.type as keyof typeof TYPE_COLORS] || TYPE_COLORS.INFO;
                    const label = TYPE_LABELS[announcement.type as keyof typeof TYPE_LABELS] || 'Information';

                    return (
                        <div
                            key={announcement.id}
                            style={{
                                padding: '1.5rem',
                                background: 'white',
                                border: `1px solid ${color}40`,
                                borderRadius: '0.75rem',
                                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(15, 23, 42, 0.08)';
                                e.currentTarget.style.borderColor = color;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = `${color}40`;
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: `${color}20`,
                                        color: color,
                                    }}>
                                        {label}
                                    </span>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                                        {announcement.title}
                                    </h3>
                                </div>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    {new Date(announcement.startDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                            <p style={{ 
                                color: '#374151', 
                                lineHeight: '1.7', 
                                whiteSpace: 'pre-wrap',
                                margin: 0,
                            }}>
                                {announcement.message}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}






