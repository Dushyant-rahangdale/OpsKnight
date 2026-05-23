'use server';

import prisma from '@/lib/prisma';
import { assertAdminOrResponder } from '@/lib/rbac';
import {
  createJiraIssueAndLink,
  linkExistingJiraIssue,
  syncExternalIssueLink,
} from '@/lib/jira-sync';
import { revalidatePath } from 'next/cache';

export async function createJiraIssueFromActionItem(actionItemId: string) {
  await assertAdminOrResponder();

  const actionItem = await prisma.actionItem.findUnique({
    where: { id: actionItemId },
    include: {
      incident: {
        include: {
          service: {
            include: {
              jiraServiceMapping: true,
            },
          },
        },
      },
    },
  });

  if (!actionItem) throw new Error('Action item not found.');

  const mapping = actionItem.incident?.service?.jiraServiceMapping;

  const jiraConfig = await prisma.jiraConfig.findUnique({
    where: { id: 'default' },
    select: { defaultProjectKey: true, enabled: true },
  });

  if (!jiraConfig?.enabled) throw new Error('Jira is not configured or is disabled.');

  const projectKey = mapping?.projectKey ?? jiraConfig.defaultProjectKey;
  if (!projectKey) throw new Error('No Jira project key configured.');

  const issueType = mapping?.actionItemIssueType ?? 'Task';
  const labels = mapping?.defaultLabels ?? ['opsknight'];
  const component = mapping?.defaultComponent ?? null;

  const { issue } = await createJiraIssueAndLink({
    actionItemId,
    projectKey,
    issueType,
    summary: actionItem.title,
    description: actionItem.description || actionItem.title,
    labels,
    component,
  });

  revalidatePath(`/postmortems/${actionItem.incidentId}`);
  revalidatePath('/action-items');
  return { key: issue.key, url: issue.url };
}

export async function linkJiraIssueToActionItem(actionItemId: string, jiraKey: string) {
  await assertAdminOrResponder();

  const actionItem = await prisma.actionItem.findUnique({
    where: { id: actionItemId },
    select: { id: true, incidentId: true },
  });
  if (!actionItem) throw new Error('Action item not found.');

  const { issue } = await linkExistingJiraIssue({
    actionItemId,
    jiraKey,
  });

  revalidatePath(`/postmortems/${actionItem.incidentId}`);
  revalidatePath('/action-items');
  return { key: issue.key, url: issue.url };
}

export async function unlinkJiraIssueFromActionItem(linkId: string) {
  await assertAdminOrResponder();

  const link = await prisma.externalIssueLink.findUnique({
    where: { id: linkId },
    select: { id: true, actionItem: { select: { incidentId: true } } },
  });
  if (!link) throw new Error('Link not found.');

  await prisma.externalIssueLink.delete({
    where: { id: linkId },
  });

  if (link.actionItem?.incidentId) {
    revalidatePath(`/postmortems/${link.actionItem.incidentId}`);
  }
  revalidatePath('/action-items');
}

export async function syncActionItemJiraIssue(linkId: string) {
  await assertAdminOrResponder();

  const link = await prisma.externalIssueLink.findUnique({
    where: { id: linkId },
    select: { actionItem: { select: { incidentId: true } } },
  });

  await syncExternalIssueLink(linkId);

  if (link?.actionItem?.incidentId) {
    revalidatePath(`/postmortems/${link.actionItem.incidentId}`);
  }
  revalidatePath('/action-items');
}
