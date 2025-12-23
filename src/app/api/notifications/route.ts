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
        const limit = parseLimit(searchParams.get('limit'));
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        const baseWhere = {
            userId: user.id
        };

        const where = unreadOnly
            ? { ...baseWhere, readAt: null }
            : baseWhere;

        const [notifications, unreadCount, total] = await Promise.all([
            prisma.inAppNotification.findMany({
                where,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.inAppNotification.count({
                where: { ...baseWhere, readAt: null }
            }),
            prisma.inAppNotification.count({
                where: baseWhere
            })
        ]);

        const formattedNotifications = notifications.map((notification) => {
            const timeAgo = getTimeAgo(notification.createdAt);
            const typeKey = notification.type.toLowerCase();
            const typeMap: Record<string, 'incident' | 'service' | 'schedule'> = {
                incident: 'incident',
                schedule: 'schedule',
                service: 'service',
                team: 'service'
            };
            const type = typeMap[typeKey] || 'incident';
            const incidentId = notification.entityType === 'INCIDENT'
                ? notification.entityId
                : null;

            return {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                time: timeAgo,
                unread: !notification.readAt,
                type,
                incidentId,
                createdAt: notification.createdAt.toISOString()
            };
        });

        return NextResponse.json({
            notifications: formattedNotifications,
            unreadCount,
            total
        });
    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

function parseLimit(value: string | null) {
    const limit = Number(value);
    if (Number.isNaN(limit) || limit <= 0) return 50;
    return Math.min(limit, 200);
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
            await prisma.inAppNotification.updateMany({
                where: {
                    userId: user.id,
                    readAt: null
                },
                data: {
                    readAt: new Date()
                }
            });

            return NextResponse.json({ success: true, message: 'All notifications marked as read' });
        }

        if (notificationIds && Array.isArray(notificationIds)) {
            await prisma.inAppNotification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: user.id
                },
                data: {
                    readAt: new Date()
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

