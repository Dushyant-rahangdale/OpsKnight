import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/rbac';
import { getDecryptedJiraConfig, testJiraConnection } from '@/lib/jira';

export async function POST() {
  try {
    await assertAdmin();
    const config = await getDecryptedJiraConfig();
    if (!config) {
      return NextResponse.json(
        { error: 'Jira is not configured or is disabled.' },
        { status: 400 }
      );
    }

    const result = await testJiraConnection(config);
    return NextResponse.json({
      ok: true,
      accountId: result.accountId,
      displayName: result.displayName,
      emailAddress: result.emailAddress,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to test Jira connection.' },
      { status: 500 }
    );
  }
}
