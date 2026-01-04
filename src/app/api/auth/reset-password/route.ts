import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { revokeUserSessions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // 1. Verify Token
    // The token passed in query param is the raw random bytes (hex).
    // The DB stores the SHA256 hash of it.
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Look up token
    // Schema: VerificationToken { identifier, token (unique), expires }
    // Note: the `token` column in DB is `tokenHash` in our logic.
    const record = await prisma.verificationToken.findUnique({
      where: { token: tokenHash }, // It has a unique constraint on 'token' in schema? no, @@unique([identifier, token]).
      // Actually, `token` field is `@unique` on line 677: `token String @unique`. So we can search by it directly.
    });

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Check expiration
    if (record.expires < new Date()) {
      // Delete expired token to cleanup
      await prisma.verificationToken.delete({ where: { token: tokenHash } });
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    const email = record.identifier;

    // 2. Update User Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        status: 'ACTIVE', // Reactivate if invited/disabled (optional, but safe for invited users)
        invitedAt: null,
      },
    });
    // Revoke any existing sessions after a password reset.
    const updatedUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (updatedUser) {
      await revokeUserSessions(updatedUser.id);
    }

    // 3. Cleanup Token
    await prisma.verificationToken.delete({
      where: { token: tokenHash },
    });

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'USER',
        entityId: email, // or fetch user id. Let's assume email is sufficient ref here or generic.
        details: { email },
      },
    });

    return NextResponse.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    logger.error('API Error /auth/reset-password', { error });
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
