/**
 * War-Room API endpoint
 * Handles manual war-room creation and archival from the incident detail page
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createIncidentWarRoom, archiveWarRoomChannel } from '@/lib/chatops/war-room';
import { getUserPermissions } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const permissions = await getUserPermissions();
    if (!permissions) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { incidentId, action } = body;

    if (!incidentId || !action) {
      return NextResponse.json(
        { error: 'Missing incidentId or action' },
        { status: 400 }
      );
    }

    if (action === 'create') {
      const result = await createIncidentWarRoom(incidentId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json(result);
    }

    if (action === 'archive') {
      const result = await archiveWarRoomChannel(incidentId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Unknown action. Use "create" or "archive".' },
      { status: 400 }
    );
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    logger.error('[ChatOps] War-room API error', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
