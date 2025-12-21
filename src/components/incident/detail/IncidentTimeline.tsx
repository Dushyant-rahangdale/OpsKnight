'use client';

import TimelineEvent from '../TimelineEvent';

type Event = {
    id: string;
    message: string;
    createdAt: Date;
};

type IncidentTimelineProps = {
    events: Event[];
};

export default function IncidentTimeline({ events }: IncidentTimelineProps) {
    // Group events by date
    const groupedEvents = events.reduce((acc, event) => {
        const date = new Date(event.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let groupKey: string;
        if (date >= today) {
            groupKey = 'Today';
        } else if (date >= yesterday) {
            groupKey = 'Yesterday';
        } else {
            groupKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(event);
        return acc;
    }, {} as Record<string, Event[]>);

    return (
        <div className="glass-panel" style={{ 
            padding: '1.5rem', 
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', 
            border: '1px solid #e6e8ef', 
            borderRadius: '0px',
            boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)' 
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Timeline</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Event history for this incident</div>
                </div>
                <div style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.12em',
                    fontWeight: 600,
                    padding: '0.35rem 0.75rem',
                    background: '#f9fafb',
                    border: '1px solid var(--border)',
                    borderRadius: '0px'
                }}>
                    Activity
                </div>
            </div>

            {events.length === 0 ? (
                <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center', 
                    color: 'var(--text-muted)', 
                    fontStyle: 'italic',
                    background: '#f9fafb',
                    border: '1px dashed var(--border)',
                    borderRadius: '0px'
                }}>
                    No timeline events yet. Events will appear here as the incident is updated.
                </div>
            ) : (
                <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                    {Object.entries(groupedEvents).map(([groupKey, groupEvents], groupIndex) => (
                        <div key={groupKey} style={{ marginBottom: groupIndex < Object.keys(groupedEvents).length - 1 ? '2rem' : '0' }}>
                            <div style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                color: 'var(--text-muted)', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                marginBottom: '1rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '1px solid var(--border)'
                            }}>
                                {groupKey}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {groupEvents.map((event, index) => (
                                    <TimelineEvent
                                        key={event.id}
                                        message={event.message}
                                        createdAt={event.createdAt}
                                        isFirst={index === 0 && groupIndex === 0}
                                        isLast={index === groupEvents.length - 1 && groupIndex === Object.keys(groupedEvents).length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
