'use client';

import { useBrowserTimezone } from '@/contexts/TimezoneContext';
import { formatDateTime } from '@/lib/timezone';

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
    const browserTimeZone = useBrowserTimezone();
    
    if (announcements.length === 0) return null;

    return (
        <section style={{ marginBottom: 'clamp(2rem, 6vw, 4rem)' }}>
            <div style={{ marginBottom: 'clamp(1rem, 3vw, 1.5rem)' }}>
                <h2 style={{ 
                    fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', 
                    fontWeight: '800', 
                    marginBottom: '0.25rem',
                    color: 'var(--status-text-strong, #0f172a)',
                    letterSpacing: '-0.02em',
                }}>
                    Announcements
                </h2>
                <p style={{ 
                    fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)', 
                    color: 'var(--status-text-muted, #64748b)',
                    margin: 0,
                }}>
                    Important updates and notifications
                </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 1.25rem)' }}>
                {announcements.map((announcement, index) => {
                    const color = TYPE_COLORS[announcement.type as keyof typeof TYPE_COLORS] || TYPE_COLORS.INFO;
                    const label = TYPE_LABELS[announcement.type as keyof typeof TYPE_LABELS] || 'Information';

                    return (
                        <div
                            key={announcement.id}
                            style={{
                                padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                                background: 'var(--status-panel-bg, #ffffff)',
                                border: '1px solid var(--status-panel-border, #e5e7eb)',
                                borderRadius: '0.875rem',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: 'var(--status-card-shadow, 0 4px 12px rgba(15, 23, 42, 0.05))',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = 'var(--status-card-shadow, 0 6px 16px rgba(15, 23, 42, 0.06))';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'var(--status-card-shadow, 0 4px 12px rgba(15, 23, 42, 0.05))';
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            {/* Accent bar */}
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '3px',
                                background: `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)`,
                            }} />
                            
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'start', 
                                marginBottom: 'clamp(0.75rem, 2vw, 1rem)', 
                                flexWrap: 'wrap', 
                                gap: 'clamp(0.75rem, 2vw, 1rem)',
                                paddingLeft: 'clamp(0.75rem, 2vw, 1rem)',
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 'clamp(0.5rem, 2vw, 0.875rem)',
                                    flex: '1 1 200px',
                                    minWidth: 0,
                                    flexWrap: 'wrap',
                                }}>
                                    <span style={{
                                        padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.625rem, 2vw, 0.875rem)',
                                        borderRadius: '0.45rem',
                                        fontSize: 'clamp(0.6875rem, 1.5vw, 0.75rem)',
                                        fontWeight: '700',
                                        background: `linear-gradient(135deg, ${color}20 0%, ${color}15 100%)`,
                                        color: color,
                                        border: `1px solid ${color}35`,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {label}
                                    </span>
                                    <h3 style={{ 
                                        fontSize: 'clamp(1.125rem, 3vw, 1.25rem)', 
                                        fontWeight: '700', 
                                        color: 'var(--status-text, #111827)', 
                                        margin: 0,
                                        letterSpacing: '-0.01em',
                                        wordBreak: 'break-word',
                                    }}>
                                        {announcement.title}
                                    </h3>
                                </div>
                                <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)', 
                                    color: 'var(--status-text-muted, #6b7280)',
                                    flexShrink: 0,
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    {formatDateTime(announcement.startDate, browserTimeZone, { format: 'date' })}
                                </div>
                            </div>
                            <p style={{ 
                                color: 'var(--status-text, #374151)', 
                                lineHeight: '1.75', 
                                whiteSpace: 'pre-wrap',
                                margin: 0,
                                paddingLeft: 'clamp(0.75rem, 2vw, 1rem)',
                                fontSize: 'clamp(0.875rem, 2vw, 0.9375rem)',
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






