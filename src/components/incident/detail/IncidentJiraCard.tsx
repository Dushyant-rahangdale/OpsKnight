'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import {
  ExternalLink,
  Link2,
  Plus,
  RefreshCw,
  Tickets,
  Trash2,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  createJiraIssueFromIncident,
  linkJiraIssueToIncident,
  unlinkJiraIssueFromIncident,
  syncIncidentJiraIssue,
} from '@/app/(app)/incidents/jira/actions';

type JiraLink = {
  id: string;
  externalKey: string;
  externalUrl: string;
  externalStatus: string | null;
  externalAssignee: string | null;
  syncState: string;
  lastSyncedAt: Date | null;
};

interface IncidentJiraCardProps {
  incidentId: string;
  serviceSettingsHref: string;
  jiraLinks: JiraLink[];
  jiraEnabled: boolean;
  serviceJiraMapped: boolean;
  canManage: boolean;
}

function statusColor(status: string | null): string {
  if (!status) return 'bg-slate-100 text-slate-600';
  const lower = status.toLowerCase();
  if (lower === 'done' || lower === 'closed' || lower === 'resolved')
    return 'bg-emerald-100 text-emerald-700';
  if (lower === 'in progress' || lower === 'in review') return 'bg-blue-100 text-blue-700';
  if (lower === 'to do' || lower === 'open' || lower === 'backlog')
    return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export default function IncidentJiraCard({
  incidentId,
  serviceSettingsHref,
  jiraLinks,
  jiraEnabled,
  serviceJiraMapped,
  canManage,
}: IncidentJiraCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkKey, setLinkKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const res = await createJiraIssueFromIncident(incidentId);
      if (!res.success && res.error) {
        setError(res.error);
      }
    });
  };

  const handleLink = () => {
    if (!linkKey.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await linkJiraIssueToIncident(incidentId, linkKey.trim());
      if (!res.success && res.error) {
        setError(res.error);
      } else {
        setLinkKey('');
        setShowLinkForm(false);
      }
    });
  };

  const handleUnlink = (linkId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await unlinkJiraIssueFromIncident(linkId, incidentId);
      if (!res.success && res.error) {
        setError(res.error);
      }
    });
  };

  const handleSync = (linkId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await syncIncidentJiraIssue(linkId, incidentId);
      if (!res.success && res.error) {
        setError(res.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Tickets className="h-4 w-4 text-blue-600" />
          Jira Issues
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!jiraEnabled && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-muted-foreground">
            <p className="mb-3">Connect Jira to create or link issues from this incident.</p>
            {canManage && (
              <Button asChild variant="outline" size="sm" className="h-8">
                <Link href="/settings/integrations/jira">Configure Jira</Link>
              </Button>
            )}
          </div>
        )}
        {jiraEnabled && !serviceJiraMapped && (
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="mb-3">
              Add a Jira project mapping for this service before creating new Jira issues.
            </p>
            {canManage && (
              <Button asChild variant="outline" size="sm" className="h-8 bg-white">
                <Link href={serviceSettingsHref}>Configure Service Jira</Link>
              </Button>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="py-2">
            <XCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Linked issues */}
        {jiraLinks.map(link => (
          <div
            key={link.id}
            className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
          >
            <div className="min-w-0 flex-1">
              <a
                href={link.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                {link.externalKey}
                <ExternalLink className="h-3 w-3" />
              </a>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColor(link.externalStatus)}`}
                >
                  {link.externalStatus ?? 'Unknown'}
                </span>
                {link.externalAssignee && (
                  <span className="text-xs text-muted-foreground truncate">
                    {link.externalAssignee}
                  </span>
                )}
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleSync(link.id)}
                  disabled={isPending}
                  title="Sync status"
                >
                  <RefreshCw className={`h-3 w-3 ${isPending ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleUnlink(link.id)}
                  disabled={isPending}
                  title="Unlink"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Link form */}
        {showLinkForm && (
          <div className="flex items-center gap-2">
            <Input
              value={linkKey}
              onChange={e => setLinkKey(e.target.value)}
              placeholder="PROJECT-123"
              className="h-8 text-sm"
              disabled={isPending}
              onKeyDown={e => e.key === 'Enter' && handleLink()}
            />
            <Button
              size="sm"
              className="h-8"
              onClick={handleLink}
              disabled={isPending || !linkKey.trim()}
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Link'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                setShowLinkForm(false);
                setLinkKey('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Action buttons */}
        {canManage && jiraEnabled && !showLinkForm && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleCreate}
              disabled={isPending || !serviceJiraMapped}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-3 w-3" />
              )}
              Create Issue
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setShowLinkForm(true)}
              disabled={isPending}
            >
              <Link2 className="mr-1.5 h-3 w-3" />
              Link Existing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
