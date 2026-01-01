import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import MobileCard from '@/components/mobile/MobileCard';
import Link from 'next/link';

export default async function MobileNotificationsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/m/login');
    }

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
        where: {
            userId: session.user.id,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 50,
        include: {
            incident: {
                select: {
                    id: true,
                    title: true,
                }
            }
        }
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    // Mark all as read when page is viewed
    if (unreadCount > 0) {
        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                read: false,
            },
            data: {
                read: true,
            }
        });
    }

    return (
        <div style={{ padding: '1rem', paddingBottom: '100px' }}>
            <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '1rem'
            }}>
                Notifications
            </h1>

            {notifications.length === 0 ? (
                <MobileCard>
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'var(--text-muted)'
                    }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🔔</span>
                        <p style={{ margin: 0 }}>No notifications yet</p>
                        <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0', opacity: 0.7 }}>
                            You&apos;ll be notified about incidents and updates here
                        </p>
                    </div>
                </MobileCard>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {notifications.map((notification) => (
                        <Link
                            key={notification.id}
                            href={notification.incident ? `/m/incidents/${notification.incident.id}` : '#'}
                            style={{ textDecoration: 'none' }}
                        >
                            <MobileCard>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <span style={{
                                        fontSize: '1.25rem',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        background: notification.type === 'INCIDENT' ? 'var(--badge-error-bg)' : 'var(--bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {notification.type === 'INCIDENT' ? '🚨' :
                                            notification.type === 'ESCALATION' ? '📈' :
                                                notification.type === 'SCHEDULE' ? '📅' : '🔔'}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: '600',
                                            fontSize: '0.9rem',
                                            color: 'var(--text-primary)',
                                            marginBottom: '2px'
                                        }}>
                                            {notification.title}
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {notification.message}
                                        </div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--text-muted)',
                                            marginTop: '4px',
                                            opacity: 0.7
                                        }}>
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </MobileCard>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
