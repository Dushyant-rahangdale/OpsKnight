import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import StatusBadge from '@/components/incident/StatusBadge';
import IncidentCard from '@/components/incident/IncidentCard';
import HoverLink from '@/components/service/HoverLink';

import { deleteService } from '../actions';

// Next.js 15: params is a Promise
export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const service = await prisma.service.findUnique({
        where: { id },
        include: {
            team: true,
            policy: {
                include: {
                    steps: {
                        include: { targetUser: true },
                        orderBy: { stepOrder: 'asc' }
                    }
                }
            },
            incidents: {
                include: {
                    service: true,
                    assignee: true
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            },
            _count: {
                select: { incidents: true }
            }
        }
    });

    if (!service) {
        notFound();
    }

    // Calculate dynamic status
    const openIncidents = service.incidents.filter(i => i.status !== 'RESOLVED');
    const hasCritical = openIncidents.some(i => i.urgency === 'HIGH');
    const dynamicStatus = hasCritical ? 'CRITICAL' : openIncidents.length > 0 ? 'DEGRADED' : 'OPERATIONAL';

    // Bind delete action
    const deleteServiceWithId = deleteService.bind(null, service.id);

    // Get more incident stats
    const resolvedIncidents = service.incidents.filter(i => i.status === 'RESOLVED');
    const criticalIncidents = openIncidents.filter(i => i.urgency === 'HIGH');
    const totalIncidents = service._count.incidents;

    return (
        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
            <HoverLink 
                href="/services"
                style={{ 
                    marginBottom: '1.5rem', 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none', 
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Services
            </HoverLink>

            {/* Header Section */}
            <div style={{ 
                padding: '2rem', 
                marginBottom: '2rem', 
                background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 60%, #f3f4f6 100%)', 
                border: '1px solid #e6e8ef', 
                borderRadius: '0px',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)' 
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <StatusBadge status={dynamicStatus as any} size="lg" showDot />
                        </div>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            {service.name}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '720px', lineHeight: 1.6 }}>
                            {service.description || 'No description provided.'}
                        </p>
                    </div>
                </div>

                {/* Service Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ 
                        background: 'linear-gradient(180deg, rgba(211,47,47,0.06) 0%, #ffffff 90%)', 
                        border: '1px solid rgba(211,47,47,0.15)', 
                        borderRadius: '0px', 
                        padding: '1.25rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: '600' }}>Owner Team</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {service.team?.name || 'Unassigned'}
                        </div>
                    </div>
                    <div style={{ 
                        background: 'linear-gradient(180deg, rgba(34,197,94,0.06) 0%, #ffffff 90%)', 
                        border: '1px solid rgba(34,197,94,0.15)', 
                        borderRadius: '0px', 
                        padding: '1.25rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: '600' }}>Total Incidents</div>
                        <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                            {totalIncidents}
                        </div>
                        {resolvedIncidents.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {resolvedIncidents.length} resolved
                            </div>
                        )}
                    </div>
                    <div style={{ 
                        background: openIncidents.length > 0 
                            ? 'linear-gradient(180deg, rgba(239,68,68,0.08) 0%, #ffffff 90%)' 
                            : 'linear-gradient(180deg, rgba(34,197,94,0.06) 0%, #ffffff 90%)', 
                        border: openIncidents.length > 0 
                            ? '1px solid rgba(239,68,68,0.2)' 
                            : '1px solid rgba(34,197,94,0.15)', 
                        borderRadius: '0px', 
                        padding: '1.25rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: '600' }}>Open Incidents</div>
                        <div style={{ fontWeight: 700, fontSize: '1.5rem', color: openIncidents.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
                            {openIncidents.length}
                        </div>
                        {criticalIncidents.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.25rem', fontWeight: '600' }}>
                                {criticalIncidents.length} critical
                            </div>
                        )}
                    </div>
                    {service.policy ? (
                        <div style={{ 
                            background: 'linear-gradient(180deg, rgba(59,130,246,0.06) 0%, #ffffff 90%)', 
                            border: '1px solid rgba(59,130,246,0.15)', 
                            borderRadius: '0px', 
                            padding: '1.25rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        >
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: '600' }}>Escalation Policy</div>
                            <HoverLink 
                                href={`/policies/${service.policy.id}`}
                                style={{ 
                                    color: 'var(--primary)', 
                                    fontWeight: 700, 
                                    fontSize: '1.1rem', 
                                    textDecoration: 'none',
                                    display: 'inline-block'
                                }}
                            >
                                {service.policy.name}
                            </HoverLink>
                        </div>
                    ) : (
                        <div style={{ 
                            background: 'linear-gradient(180deg, rgba(156,163,175,0.06) 0%, #ffffff 90%)', 
                            border: '1px solid rgba(156,163,175,0.15)', 
                            borderRadius: '0px', 
                            padding: '1.25rem'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: '600' }}>Escalation Policy</div>
                            <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                                Not assigned
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                    <Link 
                        href={`/services/${id}/integrations`} 
                        className="glass-button primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                        Manage Integrations
                    </Link>
                    <Link 
                        href={`/services/${id}/settings`} 
                        className="glass-button"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
                        </svg>
                        Settings
                    </Link>
                    <Link 
                        href={`/incidents/create?serviceId=${id}`}
                        className="glass-button"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        Create Incident
                    </Link>
                    <form action={deleteServiceWithId} style={{ marginLeft: 'auto' }}>
                        <button 
                            type="submit" 
                            style={{ 
                                background: 'var(--danger)', 
                                color: 'white', 
                                border: 'none', 
                                padding: '0.75rem 1.5rem', 
                                borderRadius: '0px', 
                                cursor: 'pointer', 
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-error-dark)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--danger)'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Delete Service
                        </button>
                    </form>
                </div>
            </div>

            {/* Recent Incidents Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Recent Incidents
                    </h2>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        {service.incidents.length > 0 
                            ? `Showing ${service.incidents.length} most recent incidents for this service`
                            : 'No incidents recorded for this service'}
                    </p>
                    {totalIncidents > service.incidents.length && (
                        <Link 
                            href={`/incidents?service=${id}`}
                            style={{ 
                                fontSize: '0.85rem', 
                                color: 'var(--primary)', 
                                textDecoration: 'none',
                                fontWeight: '500',
                                marginTop: '0.5rem',
                                display: 'inline-block'
                            }}
                        >
                            View all {totalIncidents} incidents →
                        </Link>
                    )}
                </div>
                <Link 
                    href={`/incidents/create?serviceId=${id}`}
                    className="glass-button primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    Create Incident
                </Link>
            </div>

            {service.incidents.length === 0 ? (
                <div className="glass-panel" style={{ 
                    padding: '4rem 2rem', 
                    color: 'var(--text-muted)', 
                    background: 'white', 
                    textAlign: 'center', 
                    borderRadius: '0px',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        No incidents recorded
                    </h3>
                    <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                        This service has no recorded incidents. The system appears to be healthy.
                    </p>
                    <Link href={`/incidents/create?serviceId=${id}`} className="glass-button primary" style={{ display: 'inline-block' }}>
                        Create First Incident
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
                    {service.incidents.map((incident: any) => (
                        <IncidentCard 
                            key={incident.id}
                            incident={incident}
                            showSLA={true}
                            showEscalation={true}
                            compact={false}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
