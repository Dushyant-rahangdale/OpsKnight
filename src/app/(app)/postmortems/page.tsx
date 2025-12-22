import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllPostmortems } from './actions';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';

export default async function PostmortemsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect('/login');
    }

    const params = await searchParams;
    const status = params.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined;

    const postmortems = await getAllPostmortems(status);

    return (
        <div style={{ padding: 'var(--spacing-6)' }}>
            <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>
                    Postmortems
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-base)' }}>
                    Learn from incidents and improve your incident response process
                </p>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-2)' }}>
                <Link
                    href="/postmortems"
                    style={{
                        padding: 'var(--spacing-2) var(--spacing-4)',
                        borderRadius: 'var(--radius-md)',
                        background: !status ? 'var(--primary)' : 'var(--color-neutral-100)',
                        color: !status ? 'white' : 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: 'var(--font-size-sm)',
                    }}
                >
                    All
                </Link>
                <Link
                    href="/postmortems?status=PUBLISHED"
                    style={{
                        padding: 'var(--spacing-2) var(--spacing-4)',
                        borderRadius: 'var(--radius-md)',
                        background: status === 'PUBLISHED' ? 'var(--primary)' : 'var(--color-neutral-100)',
                        color: status === 'PUBLISHED' ? 'white' : 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: 'var(--font-size-sm)',
                    }}
                >
                    Published
                </Link>
                <Link
                    href="/postmortems?status=DRAFT"
                    style={{
                        padding: 'var(--spacing-2) var(--spacing-4)',
                        borderRadius: 'var(--radius-md)',
                        background: status === 'DRAFT' ? 'var(--primary)' : 'var(--color-neutral-100)',
                        color: status === 'DRAFT' ? 'white' : 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: 'var(--font-size-sm)',
                    }}
                >
                    Drafts
                </Link>
            </div>

            {/* Postmortems List */}
            {postmortems.length === 0 ? (
                <Card>
                    <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-base)' }}>
                            {status
                                ? `No ${status.toLowerCase()} postmortems found.`
                                : 'No postmortems found. Create one from a resolved incident.'}
                        </p>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    {postmortems.map((postmortem) => (
                        <Card key={postmortem.id} variant="elevated">
                            <div style={{ padding: 'var(--spacing-5)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-3)' }}>
                                    <div style={{ flex: 1 }}>
                                        <Link
                                            href={`/postmortems/${postmortem.incidentId}`}
                                            style={{
                                                fontSize: 'var(--font-size-lg)',
                                                fontWeight: 'var(--font-weight-semibold)',
                                                color: 'var(--text-primary)',
                                                textDecoration: 'none',
                                                display: 'block',
                                                marginBottom: 'var(--spacing-1)',
                                            }}
                                        >
                                            {postmortem.title}
                                        </Link>
                                        <Link
                                            href={`/incidents/${postmortem.incidentId}`}
                                            style={{
                                                fontSize: 'var(--font-size-sm)',
                                                color: 'var(--text-muted)',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            Incident: {postmortem.incident.title}
                                        </Link>
                                    </div>
                                    <Badge
                                        variant={
                                            postmortem.status === 'PUBLISHED'
                                                ? 'success'
                                                : postmortem.status === 'ARCHIVED'
                                                ? 'default'
                                                : 'warning'
                                        }
                                    >
                                        {postmortem.status}
                                    </Badge>
                                </div>

                                {postmortem.summary && (
                                    <p
                                        style={{
                                            color: 'var(--text-muted)',
                                            fontSize: 'var(--font-size-sm)',
                                            marginBottom: 'var(--spacing-3)',
                                            lineHeight: 'var(--line-height-base)',
                                        }}
                                    >
                                        {postmortem.summary.substring(0, 200)}
                                        {postmortem.summary.length > 200 ? '...' : ''}
                                    </p>
                                )}

                                <div style={{ display: 'flex', gap: 'var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                    <span>
                                        Created by {postmortem.createdBy.name}
                                    </span>
                                    <span>
                                        {postmortem.createdAt.toLocaleDateString()}
                                    </span>
                                    {postmortem.publishedAt && (
                                        <span>
                                            Published {postmortem.publishedAt.toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

