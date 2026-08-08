'use server';

import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { assertAdmin } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

type ChatOpsConfigState = {
  success?: boolean;
  error?: string | null;
};

export async function saveChatOpsConfig(
  _prevState: ChatOpsConfigState | undefined,
  formData: FormData
): Promise<ChatOpsConfigState> {
  try {
    await assertAdmin();
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unauthorized. Admin access required.',
    };
  }

  try {
    const enabledValue = formData.get('enabled');
    const enabled = enabledValue === 'on' || enabledValue === 'true';
    const channelPrefix = ((formData.get('channelPrefix') as string | null) ?? 'inc').trim();
    const autoCreateOnUrgency = formData.getAll('autoCreateOnUrgency') as string[];
    const autoCreateOnPriority = formData.getAll('autoCreateOnPriority') as string[];
    const archiveOnResolveValue = formData.get('archiveOnResolve');
    const archiveOnResolve = archiveOnResolveValue === 'on' || archiveOnResolveValue === 'true';
    const defaultVideoBridge = (formData.get('defaultVideoBridge') as string | null) ?? 'NONE';
    const customBridgeUrlTemplate = ((formData.get('customBridgeUrlTemplate') as string | null) ?? '').trim();

    await prisma.chatOpsConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        enabled,
        channelPrefix,
        autoCreateOnUrgency,
        autoCreateOnPriority,
        archiveOnResolve,
        defaultVideoBridge,
        customBridgeUrlTemplate: customBridgeUrlTemplate || null,
      },
      update: {
        enabled,
        channelPrefix,
        autoCreateOnUrgency,
        autoCreateOnPriority,
        archiveOnResolve,
        defaultVideoBridge,
        customBridgeUrlTemplate: customBridgeUrlTemplate || null,
      },
    });

    await logAudit({
      action: 'chatops.config.updated',
      entityType: 'SERVICE',
      entityId: 'chatops-config',
      details: {
        enabled,
        channelPrefix,
        defaultVideoBridge,
      },
    });

    revalidatePath('/settings/integrations');
    revalidatePath('/settings/integrations/chatops');

    return { success: true, error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to save ChatOps configuration.' };
  }
}
