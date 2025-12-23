'use client';

import { useEffect, useState } from 'react';

interface StatusPageHeaderProps {
    statusPage: {
        name: string;
        contactEmail?: string | null;
        contactUrl?: string | null;
    };
    overallStatus: 'operational' | 'degraded' | 'outage';
    branding?: any;
    lastUpdated?: string;
}

const STATUS_CONFIG = {
    operational: {
        badge: 'Operational',
        text: 'All systems operational',
        color: '#16a34a',
        background: '#dcfce7',
        border: '#86efac',
    },
    degraded: {
        badge: 'Degraded',
        text: 'Some systems experiencing issues',
        color: '#d97706',
        background: '#fef3c7',
        border: '#fcd34d',
    },
    outage: {
        badge: 'Outage',
        text: 'Some systems are down',
        color: '#dc2626',
        background: '#fee2e2',
        border: '#fca5a5',
    },
};

export default function StatusPageHeader({ statusPage, overallStatus, branding = {}, lastUpdated }: StatusPageHeaderProps) {
    const status = STATUS_CONFIG[overallStatus];
    const logoUrl = branding.logoUrl;
    const primaryColor = branding.primaryColor || '#667eea';
    const textColor = branding.textColor || '#111827';
    const [updatedLabel, setUpdatedLabel] = useState<string | null>(null);

    useEffect(() => {
        if (!lastUpdated) {
            setUpdatedLabel(null);
            return;
        }

        const parsed = new Date(lastUpdated);
        if (Number.isNaN(parsed.getTime())) {
            setUpdatedLabel(null);
            return;
        }

        const label = new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(parsed);
        setUpdatedLabel(label);
    }, [lastUpdated]);

    return (
        <header
            className="status-page-header"
            style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
            }}
        >
            <div style={{ width: '100%', margin: '0 auto', padding: '2.5rem 2rem', boxSizing: 'border-box' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '260px' }}>
                        {logoUrl && (
                            <img
                                src={logoUrl}
                                alt={statusPage.name}
                                style={{
                                    height: '40px',
                                    maxWidth: '200px',
                                    objectFit: 'contain',
                                    display: 'block',
                                }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        )}
                        <div>
                            <h1 style={{
                                fontSize: '2.25rem',
                                fontWeight: '700',
                                margin: 0,
                                color: textColor,
                                letterSpacing: '-0.02em',
                            }}>
                                {statusPage.name}
                            </h1>
                            <p style={{ marginTop: '0.4rem', color: '#475569', fontSize: '0.95rem' }}>
                                {status.text}
                            </p>
                            <p
                                suppressHydrationWarning
                                style={{ marginTop: '0.25rem', color: '#94a3b8', fontSize: '0.8rem' }}
                            >
                                {updatedLabel ? `Updated ${updatedLabel}` : ''}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <span style={{
                            padding: '0.4rem 0.85rem',
                            background: status.background,
                            color: status.color,
                            border: `1px solid ${status.border}`,
                            borderRadius: '999px',
                            fontSize: '0.8125rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}>
                            {status.badge}
                        </span>
                        {(statusPage.contactEmail || statusPage.contactUrl) && (
                            <a
                                href={statusPage.contactUrl || `mailto:${statusPage.contactEmail}`}
                                style={{
                                    padding: '0.55rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: `1px solid ${primaryColor}`,
                                    color: primaryColor,
                                    textDecoration: 'none',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                }}
                            >
                                Contact
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
