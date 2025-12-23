'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface Service {
    id: string;
    name: string;
    status: string;
    _count: {
        incidents: number;
    };
}

interface StatusPageService {
    id: string;
    serviceId: string;
    displayName?: string | null;
    showOnPage: boolean;
}

interface StatusPageServicesProps {
    services: Service[];
    statusPageServices: StatusPageService[];
    uptime90: Record<string, number>;
    incidents: Array<{
        serviceId: string;
        createdAt: string;
        resolvedAt?: string | null;
        status: string;
        urgency: string;
    }>;
}

const STATUS_CONFIG = {
    OPERATIONAL: {
        color: '#16a34a',
        label: 'Operational',
        background: '#dcfce7',
        border: '#86efac',
    },
    DEGRADED: {
        color: '#d97706',
        label: 'Degraded',
        background: '#fef3c7',
        border: '#fcd34d',
    },
    PARTIAL_OUTAGE: {
        color: '#d97706',
        label: 'Partial Outage',
        background: '#fef3c7',
        border: '#fcd34d',
    },
    MAJOR_OUTAGE: {
        color: '#dc2626',
        label: 'Major Outage',
        background: '#fee2e2',
        border: '#fca5a5',
    },
    MAINTENANCE: {
        color: '#2563eb',
        label: 'Maintenance',
        background: '#dbeafe',
        border: '#93c5fd',
    },
};

const HISTORY_STATUS_COLORS: Record<'operational' | 'degraded' | 'outage' | 'future', string> = {
    operational: '#22c55e',
    degraded: '#fbbf24',
    outage: '#f87171',
    future: '#e2e8f0',
};

type HoveredBar = {
    serviceId: string;
    date: string;
    left: number;
    width: number;
};

type TimelineSliceStatus = 'operational' | 'degraded' | 'outage' | 'future';

type TimelineData = {
    date: string;
    status: TimelineSliceStatus[];
};

export default function StatusPageServices({ services, statusPageServices, uptime90, incidents }: StatusPageServicesProps) {
    const [hoveredBar, setHoveredBar] = useState<HoveredBar | null>(null);
    const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null);
    const [visibleDays, setVisibleDays] = useState(90);
    const timelineCache = useRef(new Map<string, TimelineData>());
    const now = useMemo(() => new Date(), []);
    const daysToShow = 90;

    useEffect(() => {
        const updateVisibleDays = () => {
            const width = window.innerWidth;
            if (width < 720) {
                setVisibleDays(30);
            } else if (width < 1024) {
                setVisibleDays(60);
            } else {
                setVisibleDays(90);
            }
        };

        updateVisibleDays();
        window.addEventListener('resize', updateVisibleDays);
        return () => window.removeEventListener('resize', updateVisibleDays);
    }, []);

    const incidentsByService = useMemo(() => {
        const map: Record<string, Array<{
            createdAt: Date;
            resolvedAt?: Date | null;
            status: string;
            urgency: string;
        }>> = {};

        incidents.forEach((incident) => {
            if (!map[incident.serviceId]) {
                map[incident.serviceId] = [];
            }

            map[incident.serviceId].push({
                createdAt: new Date(incident.createdAt),
                resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : null,
                status: incident.status,
                urgency: incident.urgency,
            });
        });

        return map;
    }, [incidents]);

    const historyByService = useMemo(() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (daysToShow - 1));

        const historyMap: Record<string, Array<{ date: string; status: 'operational' | 'degraded' | 'outage' }>> = {};
        services.forEach((service) => {
            historyMap[service.id] = [];
        });

        for (let i = 0; i < daysToShow; i += 1) {
            const dayStart = new Date(start);
            dayStart.setDate(start.getDate() + i);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayStart.getDate() + 1);
            const dayKey = formatLocalDateKey(dayStart);

            services.forEach((service) => {
                const active = (incidentsByService[service.id] || []).filter((incident) => {
                    if (incident.status === 'SUPPRESSED' || incident.status === 'SNOOZED') {
                        return false;
                    }
                    const incidentEnd = incident.resolvedAt || now;
                    return incident.createdAt < dayEnd && incidentEnd >= dayStart;
                });

                const hasOutage = active.some((incident) => incident.urgency === 'HIGH');
                const hasDegraded = active.some((incident) => incident.urgency === 'LOW');
                const status = hasOutage ? 'outage' : hasDegraded ? 'degraded' : 'operational';

                historyMap[service.id].push({
                    date: dayKey,
                    status,
                });
            });
        }

        return historyMap;
    }, [services, incidentsByService, now]);

    const getTimelineData = (serviceId: string, date: string): TimelineData => {
        const cacheKey = `${serviceId}-${date}`;
        const cached = timelineCache.current.get(cacheKey);
        if (cached) {
            return cached;
        }

        const [year, month, day] = date.split('-').map(Number);
        const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
        const dayEnd = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

        const slices: TimelineSliceStatus[] = new Array(144).fill('operational');
        const relevantIncidents = (incidentsByService[serviceId] || []).filter((incident) => {
            if (incident.status === 'SUPPRESSED' || incident.status === 'SNOOZED') {
                return false;
            }
            const incidentEnd = incident.resolvedAt || now;
            return incident.createdAt < dayEnd && incidentEnd > dayStart;
        });

        const severityRank: Record<TimelineSliceStatus, number> = {
            operational: 0,
            degraded: 1,
            outage: 2,
            future: -1,
        };

        relevantIncidents.forEach((incident) => {
            const incidentStart = incident.createdAt > dayStart ? incident.createdAt : dayStart;
            const incidentEnd = (incident.resolvedAt || now) < dayEnd ? (incident.resolvedAt || now) : dayEnd;
            const startIndex = Math.floor((incidentStart.getTime() - dayStart.getTime()) / (10 * 60 * 1000));
            const endIndex = Math.ceil((incidentEnd.getTime() - dayStart.getTime()) / (10 * 60 * 1000)) - 1;

            const statusForIncident: TimelineSliceStatus = incident.urgency === 'HIGH'
                ? 'outage'
                : incident.urgency === 'LOW'
                    ? 'degraded'
                    : 'operational';

            for (let i = Math.max(0, startIndex); i <= Math.min(143, endIndex); i += 1) {
                if (severityRank[statusForIncident] > severityRank[slices[i]]) {
                    slices[i] = statusForIncident;
                }
            }
        });

        const isToday = dayStart.toDateString() === now.toDateString();
        if (isToday) {
            const currentIndex = Math.floor((now.getTime() - dayStart.getTime()) / (10 * 60 * 1000));
            for (let i = Math.max(0, currentIndex + 1); i < slices.length; i += 1) {
                slices[i] = 'future';
            }
        }

        const timeline = { date, status: slices };
        timelineCache.current.set(cacheKey, timeline);
        return timeline;
    };

    const getIncidentStartMarkers = (serviceId: string, date: string) => {
        const [year, month, day] = date.split('-').map(Number);
        const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
        const dayEnd = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

        const markerMap = new Map<number, string>();
        const times: string[] = [];
        (incidentsByService[serviceId] || []).forEach((incident) => {
            if (incident.status === 'SUPPRESSED' || incident.status === 'SNOOZED') {
                return;
            }
            if (incident.resolvedAt) {
                return;
            }
            if (incident.createdAt < dayStart || incident.createdAt >= dayEnd) {
                return;
            }
            const index = Math.floor((incident.createdAt.getTime() - dayStart.getTime()) / (10 * 60 * 1000));
            const hours = String(incident.createdAt.getHours()).padStart(2, '0');
            const minutes = String(incident.createdAt.getMinutes()).padStart(2, '0');
            const label = `${hours}:${minutes}`;
            markerMap.set(Math.max(0, Math.min(143, index)), label);
            times.push(label);
        });

        return {
            markers: Array.from(markerMap.entries()).map(([index, label]) => ({ index, label })),
            times: times.sort(),
        };
    };

    const formatTooltipDate = (dateKey: string) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day, 0, 0, 0, 0);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };
    // If statusPageServices is empty, show all services
    // Otherwise, only show configured services
    let visibleServices: any[] = [];

    if (statusPageServices.length === 0) {
        // No services configured, show all services
        visibleServices = services.map(service => ({
            ...service,
            displayName: service.name,
        }));
    } else {
        // Show only configured services
        visibleServices = statusPageServices
            .filter(sp => sp.showOnPage)
            .map(sp => {
                const service = services.find(s => s.id === sp.serviceId);
                if (!service) return null;
                return {
                    ...service,
                    displayName: sp.displayName || service.name,
                };
            })
            .filter(Boolean);
    }

    if (visibleServices.length === 0) return null;

    return (
        <section style={{ marginBottom: '3rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                gap: '1rem',
                flexWrap: 'wrap',
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#0f172a',
                    margin: 0,
                }}>
                    Services
                </h2>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Last {visibleDays} days
                </span>
            </div>
            <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '1rem',
                fontSize: '0.8125rem',
                color: '#64748b',
            }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: HISTORY_STATUS_COLORS.operational }} />
                    Operational
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: HISTORY_STATUS_COLORS.degraded }} />
                    Degraded
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: HISTORY_STATUS_COLORS.outage }} />
                    Outage
                </span>
            </div>
            <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                background: '#ffffff',
                overflow: 'visible',
            }}>
                {visibleServices.map((service: any, index: number) => {
                    const serviceStatus = service.status || 'OPERATIONAL';
                    const statusConfig = STATUS_CONFIG[serviceStatus as keyof typeof STATUS_CONFIG] || {
                        color: '#475569',
                        label: 'Unknown',
                        background: '#f1f5f9',
                        border: '#cbd5e1',
                    };
                    const activeIncidents = service._count.incidents;
                    const serviceHistory = historyByService[service.id] || [];
                    const displayedHistory = serviceHistory.slice(-visibleDays);
                    const uptimeValue90 = uptime90[service.id];
                    const hoveredTimeline = hoveredBar && hoveredBar.serviceId === service.id
                        ? getTimelineData(service.id, hoveredBar.date)
                        : null;
                    const hoveredMarkerData = hoveredBar && hoveredBar.serviceId === service.id
                        ? getIncidentStartMarkers(service.id, hoveredBar.date)
                        : { markers: [], times: [] };
                    const isRowHovered = hoveredServiceId === service.id;

                    return (
                        <div
                            key={service.id}
                            className="status-service-card"
                            data-service-row="true"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                padding: '1rem 1.25rem',
                                borderTop: index === 0 ? 'none' : '1px solid #e2e8f0',
                                position: 'relative',
                                background: isRowHovered ? '#f8fafc' : '#ffffff',
                                borderLeft: `4px solid ${isRowHovered ? statusConfig.color : 'transparent'}`,
                                transition: 'background 0.15s ease, border-color 0.15s ease',
                            }}
                            onMouseEnter={() => setHoveredServiceId(service.id)}
                            onMouseLeave={() => {
                                setHoveredServiceId((current) => (current === service.id ? null : current));
                                setHoveredBar((current) => current && current.serviceId === service.id ? null : current);
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: '#0f172a',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {service.displayName}
                                    </div>
                                    {activeIncidents > 0 && (
                                        <div style={{
                                            fontSize: '0.8125rem',
                                            color: '#dc2626',
                                            marginTop: '0.25rem',
                                        }}>
                                            {activeIncidents} active incident{activeIncidents !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.7rem',
                                        borderRadius: '999px',
                                        fontSize: '0.68rem',
                                        fontWeight: '600',
                                        color: statusConfig.color,
                                        background: statusConfig.background,
                                        border: `1px solid ${statusConfig.border}`,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {statusConfig.label}
                                    </span>
                                    {uptimeValue90 !== undefined && (
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            90d uptime {uptimeValue90.toFixed(2)}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${displayedHistory.length || visibleDays}, minmax(0, 1fr))`,
                                gap: '2px',
                                height: '18px',
                                borderTop: '1px solid #e2e8f0',
                                paddingTop: '0.6rem',
                                minWidth: '100%',
                                overflow: 'hidden',
                            }}>
                                {(displayedHistory.length ? displayedHistory : new Array(visibleDays).fill(null)).map((entry, barIndex) => {
                                    const barStatus = entry?.status || 'operational';
                                    const isHovered = hoveredBar?.serviceId === service.id && hoveredBar?.date === entry?.date;

                                    return (
                                        <div
                                            key={`${service.id}-${barIndex}`}
                                            style={{
                                                position: 'relative',
                                                background: HISTORY_STATUS_COLORS[barStatus as 'operational' | 'degraded' | 'outage'],
                                                borderRadius: '3px',
                                                boxShadow: isHovered ? '0 0 0 1px #0f172a' : 'none',
                                                cursor: entry ? 'pointer' : 'default',
                                                transition: 'all 0.15s ease',
                                            }}
                                            onMouseEnter={(event) => {
                                                if (entry) {
                                                    const barRect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                                                    const rowElement = (event.currentTarget as HTMLDivElement).closest('[data-service-row]');
                                                    const rowRect = rowElement ? rowElement.getBoundingClientRect() : barRect;
                                                    const tooltipWidth = Math.max(240, Math.min(400, rowRect.width - 24));
                                                    const center = barRect.left - rowRect.left + barRect.width / 2;
                                                    const half = tooltipWidth / 2;
                                                    const padding = 12;
                                                    const clamped = Math.max(half + padding, Math.min(rowRect.width - half - padding, center));

                                                    setHoveredBar({
                                                        serviceId: service.id,
                                                        date: entry.date,
                                                        left: clamped,
                                                        width: tooltipWidth,
                                                    });
                                                }
                                            }}
                                            onClick={(event) => {
                                                if (!entry) return;
                                                const barRect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                                                const rowElement = (event.currentTarget as HTMLDivElement).closest('[data-service-row]');
                                                const rowRect = rowElement ? rowElement.getBoundingClientRect() : barRect;
                                                const tooltipWidth = Math.max(240, Math.min(400, rowRect.width - 24));
                                                const center = barRect.left - rowRect.left + barRect.width / 2;
                                                const half = tooltipWidth / 2;
                                                const padding = 12;
                                                const clamped = Math.max(half + padding, Math.min(rowRect.width - half - padding, center));

                                                setHoveredBar((current) => {
                                                    if (current && current.serviceId === service.id && current.date === entry.date) {
                                                        return null;
                                                    }
                                                    return {
                                                        serviceId: service.id,
                                                        date: entry.date,
                                                        left: clamped,
                                                        width: tooltipWidth,
                                                    };
                                                });
                                            }}
                                            onTouchStart={(event) => {
                                                if (!entry) return;
                                                const barRect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                                                const rowElement = (event.currentTarget as HTMLDivElement).closest('[data-service-row]');
                                                const rowRect = rowElement ? rowElement.getBoundingClientRect() : barRect;
                                                const tooltipWidth = Math.max(240, Math.min(400, rowRect.width - 24));
                                                const center = barRect.left - rowRect.left + barRect.width / 2;
                                                const half = tooltipWidth / 2;
                                                const padding = 12;
                                                const clamped = Math.max(half + padding, Math.min(rowRect.width - half - padding, center));

                                                setHoveredBar((current) => {
                                                    if (current && current.serviceId === service.id && current.date === entry.date) {
                                                        return null;
                                                    }
                                                    return {
                                                        serviceId: service.id,
                                                        date: entry.date,
                                                        left: clamped,
                                                        width: tooltipWidth,
                                                    };
                                                });
                                            }}
                                        />
                                    );
                                })}
                            </div>
                            {hoveredBar && hoveredBar.serviceId === service.id && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${hoveredBar.left}px`,
                                    top: '100%',
                                    marginTop: '0.5rem',
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.75rem',
                                    padding: '0.75rem',
                                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                                    zIndex: 20,
                                    width: `${hoveredBar.width}px`,
                                    maxWidth: '90vw',
                                    transform: 'translateX(-50%)',
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        top: '-6px',
                                        left: '50%',
                                        width: '10px',
                                        height: '10px',
                                        background: '#ffffff',
                                        borderLeft: '1px solid #e2e8f0',
                                        borderTop: '1px solid #e2e8f0',
                                        transform: 'translateX(-50%) rotate(45deg)',
                                    }} />
                                    <button
                                        type="button"
                                        arixlabel="Close"
                                        onClick={() => setHoveredBar(null)}
                                        style={{
                                            position: 'absolute',
                                            top: '6px',
                                            right: '6px',
                                            border: 'none',
                                            background: 'transparent',
                                            color: '#94a3b8',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ×
                                    </button>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                                        {formatTooltipDate(hoveredBar.date)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                        Local time
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.75rem',
                                        flexWrap: 'wrap',
                                        fontSize: '0.75rem',
                                        color: '#64748b',
                                        marginBottom: '0.5rem',
                                    }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: HISTORY_STATUS_COLORS.operational }} />
                                            Operational
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: HISTORY_STATUS_COLORS.degraded }} />
                                            Degraded
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: HISTORY_STATUS_COLORS.outage }} />
                                            Outage
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: HISTORY_STATUS_COLORS.future }} />
                                            Upcoming
                                        </span>
                                    </div>
                                    {hoveredTimeline && (
                                        <div>
                                            <div style={{
                                                position: 'relative',
                                                width: '100%',
                                            }}>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(144, minmax(0, 1fr))',
                                                    gap: '1px',
                                                    height: '28px',
                                                }}>
                                                    {hoveredTimeline.status.map((sliceStatus, sliceIndex) => (
                                                        <div
                                                            key={`${service.id}-${hoveredBar.date}-${sliceIndex}`}
                                                            style={{
                                                                background: HISTORY_STATUS_COLORS[sliceStatus],
                                                                borderRadius: '1px',
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                {hoveredMarkerData.markers.map((marker) => (
                                                    <span
                                                        key={`${service.id}-${hoveredBar.date}-marker-${marker.index}`}
                                                        title={marker.label}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-6px',
                                                            left: `${(marker.index / 144) * 100}%`,
                                                            width: '2px',
                                                            height: '40px',
                                                            background: '#0f172a',
                                                            opacity: 0.7,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            {hoveredMarkerData.times.length > 0 && (
                                                <div style={{
                                                    marginTop: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    color: '#64748b',
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '0.4rem',
                                                }}>
                                                    <span style={{ fontWeight: '600', color: '#475569' }}>Starts:</span>
                                                    {hoveredMarkerData.times.map((time, timeIndex) => (
                                                        <span key={`${service.id}-${hoveredBar.date}-time-${timeIndex}`} style={{
                                                            padding: '0.15rem 0.4rem',
                                                            borderRadius: '0.4rem',
                                                            background: '#f1f5f9',
                                                        }}>
                                                            {time}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '0.7rem',
                                                color: '#94a3b8',
                                                marginTop: '0.35rem',
                                            }}>
                                                <span>00:00</span>
                                                <span>06:00</span>
                                                <span>12:00</span>
                                                <span>18:00</span>
                                                <span>24:00</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function formatLocalDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

