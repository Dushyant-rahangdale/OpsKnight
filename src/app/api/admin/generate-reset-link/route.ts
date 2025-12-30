import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { randomBytes, createHash } from 'crypto';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check (Admin Only)
        const session = await getServerSession(await getAuthOptions());
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Generate Token
        const token = randomBytes(32).toString('hex');
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // 3. Save Token
        await prisma.verificationToken.upsert({
            where: {
                identifier_token: {
                    identifier: user.email,
                    token: tokenHash // This is unlikely to collide but strictly we should check. Upsert works if we misuse identifier? 
                    // VerifyToken has @@unique([identifier, token]).
                    // Ideally we want to allow multiple tokens or overwrite? 
                    // Create is safer if we want multiple simultaneous tokens (which schema supports).
                    // But if we want to invalidate old ones? Nah, let's just create.
                } as any // Prisma types for composite unique can be tricky in upsert `where`.
            },
            create: {
                identifier: user.email,
                token: tokenHash,
                expires
            },
            update: {
                // If it coincidentally exists (impossible), update it.
                expires
            }
        });

        // 4. Construct Link
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

        // 5. Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'ADMIN_GENERATED_RESET_LINK',
                entityType: 'USER',
                entityId: user.id,
                actorId: (session.user as any).id,
                details: { targetEmail: user.email }
            }
        });

        return NextResponse.json({ link: resetLink });

    } catch (error) {
        logger.error('API Error /admin/generate-reset-link', { error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
