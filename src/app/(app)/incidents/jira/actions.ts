'use server';

import prisma from '@/lib/prisma';
import { assertAdminOrResponder } from '@/lib/rbac';
import {
  createJiraIssueAndLink,
  linkExistingJiraIssue,
  syncExternalIssueLink,
} from '@/lib/jira-sync';
import { revalidatePath } from 'next/cache';

export async function createJiraIssueFromIncident(incidentId: string) {
  await assertAdminOrResponder();

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      service: {
        include: {
          jiraServiceMapping: true,
        },
      },
    },
  });

  if (!incident) throw new Error('Incident not found.');

  const mapping = incident.service?.jiraServiceMapping;

  const jiraConfig = await prisma.jiraConfig.findUnique({
    where: { id: 'default' },
    select: { enabled: true },
  });

  if (!jiraConfig?.enabled) throw new Error('Jira is not configured or is disabled.');

  const projectKey = mapping?.projectKey;
  if (!projectKey) {
    throw new Error('Configure a Jira project for this service before creating Jira issues.');
  }

  const issueType = mapping?.incidentIssueType ?? 'Bug';
  const labels = mapping?.defaultLabels ?? ['opsknight'];
  const component = mapping?.defaultComponent ?? null;

  const summary = `[Incident] ${incident.title}`;
  const description = incident.description || `OpsKnight Incident: ${incident.title}`;

  let issue;
  try {
    const result = await createJiraIssueAndLink({
      incidentId,
      projectKey,
      issueType,
      summary,
      description,
      labels,
      component,
    });
    issue = result.issue;
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error);
    if (rawMsg.includes("target project doesn't exist")) {
      throw new Error(
        `Jira project "${projectKey}" does not exist or your API token lacks permissions. Check Services → Settings → Jira Mapping.`
      );
    }
    if (rawMsg.includes('issue type')) {
      throw new Error(
        `Jira issue type "${issueType}" is invalid for project "${projectKey}". Check Services → Settings → Jira Mapping.`
      );
    }
    throw new Error(`Jira issue creation failed: ${rawMsg}`);
  }

  // Create timeline event
  await prisma.incidentEvent.create({
    data: {
      incidentId,
      type: 'COMMENT',
      message: `Jira issue ${issue.key} created`,
    },
  });

  revalidatePath(`/incidents/${incidentId}`);
  return { key: issue.key, url: issue.url };
}

export async function linkJiraIssueToIncident(incidentId: string, jiraKey: string) {
  await assertAdminOrResponder();

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    select: { id: true },
  });
  if (!incident) throw new Error('Incident not found.');

  const { issue } = await linkExistingJiraIssue({
    incidentId,
    jiraKey,
  });

  await prisma.incidentEvent.create({
    data: {
      incidentId,
      type: 'COMMENT',
      message: `Jira issue ${issue.key} linked`,
    },
  });

  revalidatePath(`/incidents/${incidentId}`);
  return { key: issue.key, url: issue.url };
}

export async function unlinkJiraIssueFromIncident(linkId: string, incidentId: string) {
  await assertAdminOrResponder();

  const link = await prisma.externalIssueLink.findUnique({
    where: { id: linkId },
    select: { id: true, externalKey: true, incidentId: true },
  });
  if (!link || link.incidentId !== incidentId) throw new Error('Link not found.');

  await prisma.externalIssueLink.delete({
    where: { id: linkId },
  });

  await prisma.incidentEvent.create({
    data: {
      incidentId,
      type: 'COMMENT',
      message: `Jira issue ${link.externalKey} unlinked`,
    },
  });

  revalidatePath(`/incidents/${incidentId}`);
}

export async function syncIncidentJiraIssue(linkId: string, incidentId: string) {
  await assertAdminOrResponder();
  await syncExternalIssueLink(linkId);
  revalidatePath(`/incidents/${incidentId}`);
}
