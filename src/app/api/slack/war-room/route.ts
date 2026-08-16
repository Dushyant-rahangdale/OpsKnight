/**
 * War-Room API endpoint
 * Handles manual war-room creation and archival from the incident detail page
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createIncidentWarRoom, archiveWarRoomChannel } from '@/lib/chatops/war-room';
import { getUserPermissions, assertCanModifyIncident } from '@/lib/rbac';

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

    // Authenticated is not sufficient — creating or archiving a war-room is an
    // incident mutation, so require modify rights on this specific incident.
    try {
      await assertCanModifyIncident(incidentId);
    } catch (authzError) {
      const message =
        authzError instanceof Error ? authzError.message : 'Unauthorized';
      return NextResponse.json(
        { error: message },
        { status: message === 'Incident not found' ? 404 : 403 }
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
      // Explicit operator action — not subject to the archiveOnResolve setting
      const result = await archiveWarRoomChannel(incidentId, { force: true });
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
