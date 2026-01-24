import { NextRequest, NextResponse } from 'next/server';
import { saveSlackOAuthConfig } from '@/app/(app)/settings/slack-oauth/actions';
import { assertAdmin } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    await assertAdmin();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized. Admin access required.' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const result = await saveSlackOAuthConfig(formData);

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertAdmin();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const prisma = (await import('@/lib/prisma')).default;
    await prisma.slackOAuthConfig.deleteMany({});

    const { logAudit } = await import('@/lib/audit');
    const user = await import('@/lib/rbac').then(m => m.getCurrentUser());

    await logAudit({
      action: 'slack.oauth.config.deleted',
      entityType: 'USER',
      entityId: user.id,
      actorId: user.id,
      details: { configType: 'slack-oauth' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 });
  }
}
