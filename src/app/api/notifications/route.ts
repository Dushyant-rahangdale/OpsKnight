import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        // Build where clause
        const where: any = {
            userId: user.id
        };

        // Fetch notifications with incident details
        const notifications = await prisma.notification.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                incident: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        urgency: true,
                        priority: true
                    }
                }
            }
        });

        // Transform notifications to match component format
        const formattedNotifications = notifications.map((notification) => {
            const incident = notification.incident;
            const timeAgo = getTimeAgo(notification.createdAt);
            
            // Determine notification type and content based on incident status
            let type: 'incident' | 'service' | 'schedule' = 'incident';
            let title = 'Incident Update';
            let message = notification.message || '';

            if (incident) {
                if (incident.status === 'RESOLVED') {
                    title = 'Incident Resolved';
                    message = message || `Incident "${incident.title}" has been resolved`;
                } else if (incident.status === 'ACKNOWLEDGED') {
                    title = 'Incident Acknowledged';
                    message = message || `Incident "${incident.title}" has been acknowledged`;
                } else {
                    title = 'New Incident';
                    message = message || `New incident "${incident.title}" requires attention`;
                }
            }

            return {
                id: notification.id,
                title,
                message,
                time: timeAgo,
                unread: notification.status === 'PENDING' || notification.status === 'SENT',
                type,
                incidentId: notification.incidentId,
                channel: notification.channel,
                createdAt: notification.createdAt.toISOString()
            };
        });

        // Filter unread if requested
        const filteredNotifications = unreadOnly
            ? formattedNotifications.filter(n => n.unread)
            : formattedNotifications;

        const unreadCount = formattedNotifications.filter(n => n.unread).length;

        return NextResponse.json({
            notifications: filteredNotifications,
            unreadCount,
            total: notifications.length
        });
    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await req.json();
        const { notificationIds, markAllAsRead } = body;

        if (markAllAsRead) {
            // Mark all user notifications as delivered (read)
            await prisma.notification.updateMany({
                where: {
                    userId: user.id,
                    status: { in: ['PENDING', 'SENT'] }
                },
                data: {
                    status: 'DELIVERED',
                    deliveredAt: new Date()
                }
            });

            return NextResponse.json({ success: true, message: 'All notifications marked as read' });
        }

        if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: user.id
                },
                data: {
                    status: 'DELIVERED',
                    deliveredAt: new Date()
                }
            });

            return NextResponse.json({ success: true, message: 'Notifications marked as read' });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error('Mark notifications as read error:', error);
        return NextResponse.json(
            { error: 'Failed to update notifications' },
            { status: 500 }
        );
    }
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
}

