import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions, revokeUserSessions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getAppUrl } from '@/lib/app-url';
import { randomBytes, createHash } from 'crypto';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // 1. Auth Check (Admin Only)
    const session = await getServerSession(await getAuthOptions());
    const sessionUser = session?.user as { id: string; role: string; email: string } | undefined;

    if (!sessionUser || sessionUser.role !== 'ADMIN') {
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

    // Invalidate any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    // Revoke existing sessions (admin initiated)
    await revokeUserSessions(user.id);

    // 2. Generate Token
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // 3. Save Token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: tokenHash,
        expires,
      },
    });

    // 4. Construct Link
    const appUrl = await getAppUrl();
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    // 5. Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_GENERATED_RESET_LINK',
        entityType: 'USER',
        entityId: user.id,
        actorId: sessionUser.id,
        details: { targetEmail: user.email },
      },
    });

    return NextResponse.json({ link: resetLink });
  } catch (error) {
    logger.error('API Error /admin/generate-reset-link', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
