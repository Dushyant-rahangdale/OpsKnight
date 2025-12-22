import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPostmortem } from '../actions';
import { notFound } from 'next/navigation';
import PostmortemForm from '@/components/PostmortemForm';
import { getUserPermissions } from '@/lib/rbac';
import Link from 'next/link';

export default async function PostmortemPage({
    params,
}: {
    params: Promise<{ incidentId: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect('/login');
    }

    const { incidentId } = await params;
    const postmortem = await getPostmortem(incidentId);
    const permissions = await getUserPermissions();
    const canEdit = permissions.isResponderOrAbove;

    if (!postmortem) {
        // Check if incident exists and is resolved
        const prisma = (await import('@/lib/prisma')).default;
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId },
            select: { id: true, title: true, status: true },
        });

        if (!incident) {
            notFound();
        }

        if (incident.status !== 'RESOLVED') {
            return (
                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-2)' }}>
                            Incident Not Resolved
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-4)' }}>
                            Postmortems can only be created for resolved incidents.
                        </p>
                        <Link
                            href={`/incidents/${incidentId}`}
                            style={{
                                display: 'inline-block',
                                padding: 'var(--spacing-2) var(--spacing-4)',
                                background: 'var(--primary)',
                                color: 'white',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                            }}
                        >
                            View Incident
                        </Link>
                    </div>
                </div>
            );
        }

        // Show create form for new postmortem
        return (
            <div style={{ padding: 'var(--spacing-6)', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                    <Link
                        href="/postmortems"
                        style={{
                            color: 'var(--text-muted)',
                            textDecoration: 'none',
                            fontSize: 'var(--font-size-sm)',
                            marginBottom: 'var(--spacing-2)',
                            display: 'inline-block',
                        }}
                    >
                        ← Back to Postmortems
                    </Link>
                    <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                        Create Postmortem
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        For incident: {incident.title}
                    </p>
                </div>

                {canEdit ? (
                    <PostmortemForm incidentId={incidentId} />
                ) : (
                    <div style={{ padding: 'var(--spacing-4)', background: 'var(--color-warning-light)', borderRadius: 'var(--radius-md)' }}>
                        <p>You don't have permission to create postmortems.</p>
                    </div>
                )}
            </div>
        );
    }

    // Show existing postmortem
    return (
        <div style={{ padding: 'var(--spacing-6)', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <Link
                    href="/postmortems"
                    style={{
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: 'var(--font-size-sm)',
                        marginBottom: 'var(--spacing-2)',
                        display: 'inline-block',
                    }}
                >
                    ← Back to Postmortems
                </Link>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                    {postmortem.title}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Postmortem for{' '}
                    <Link
                        href={`/incidents/${incidentId}`}
                        style={{ color: 'var(--primary)', textDecoration: 'none' }}
                    >
                        {postmortem.incident.title}
                    </Link>
                </p>
            </div>

            {canEdit ? (
                <PostmortemForm incidentId={incidentId} initialData={postmortem} />
            ) : (
                <div>
                    {/* Read-only view */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                        {postmortem.summary && (
                            <div>
                                <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-2)' }}>
                                    Summary
                                </h2>
                                <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                    {postmortem.summary}
                                </p>
                            </div>
                        )}

                        {postmortem.rootCause && (
                            <div>
                                <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-2)' }}>
                                    Root Cause
                                </h2>
                                <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                    {postmortem.rootCause}
                                </p>
                            </div>
                        )}

                        {postmortem.resolution && (
                            <div>
                                <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-2)' }}>
                                    Resolution
                                </h2>
                                <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                    {postmortem.resolution}
                                </p>
                            </div>
                        )}

                        {postmortem.lessons && (
                            <div>
                                <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-2)' }}>
                                    Lessons Learned
                                </h2>
                                <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                    {postmortem.lessons}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

