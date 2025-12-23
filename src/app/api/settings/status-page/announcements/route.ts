import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { assertAdmin } from '@/lib/rbac';

type AnnouncementInput = {
    statusPageId: string;
    title: string;
    message: string;
    type?: string;
    startDate: string;
    endDate?: string | null;
    isActive?: boolean;
};

function parseDate(value: string, fieldName: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid ${fieldName}`);
    }
    return parsed;
}

export async function POST(req: NextRequest) {
    try {
        await assertAdmin();
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unauthorized' },
            { status: 403 }
        );
    }

    try {
        const body: AnnouncementInput = await req.json();
        const { statusPageId, title, message, type, startDate, endDate, isActive } = body;

        if (!statusPageId || !title || !message || !startDate) {
            return NextResponse.json(
                { error: 'statusPageId, title, message, and startDate are required' },
                { status: 400 }
            );
        }

        const announcement = await prisma.statusPageAnnouncement.create({
            data: {
                statusPageId,
                title: title.trim(),
                message: message.trim(),
                type: type || 'INFO',
                startDate: parseDate(startDate, 'startDate'),
                endDate: endDate ? parseDate(endDate, 'endDate') : null,
                isActive: isActive !== false,
            },
        });

        return NextResponse.json({ announcement });
    } catch (error: any) {
        console.error('Status page announcement create error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create announcement' },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await assertAdmin();
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unauthorized' },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();
        const { id, title, message, type, startDate, endDate, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const updated = await prisma.statusPageAnnouncement.update({
            where: { id },
            data: {
                ...(title !== undefined ? { title: title.trim() } : {}),
                ...(message !== undefined ? { message: message.trim() } : {}),
                ...(type !== undefined ? { type } : {}),
                ...(startDate ? { startDate: parseDate(startDate, 'startDate') } : {}),
                ...(endDate !== undefined ? { endDate: endDate ? parseDate(endDate, 'endDate') : null } : {}),
                ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
            },
        });

        return NextResponse.json({ announcement: updated });
    } catch (error: any) {
        console.error('Status page announcement update error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update announcement' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await assertAdmin();
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unauthorized' },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.statusPageAnnouncement.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Status page announcement delete error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete announcement' },
            { status: 500 }
        );
    }
}
