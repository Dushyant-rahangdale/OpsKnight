'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveChatOpsConfig } from '@/app/(app)/settings/integrations/chatops/actions';
import { SettingsSection } from '@/components/settings/layout/SettingsSection';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { Badge } from '@/components/ui/shadcn/badge';
import { CheckCircle2, Loader2, XCircle, MessageCircle, Video, Hash, Archive, AlertTriangle } from 'lucide-react';

type ChatOpsConfigView = {
  enabled: boolean;
  channelPrefix: string;
  autoCreateOnUrgency: string[];
  autoCreateOnPriority: string[];
  archiveOnResolve: boolean;
  defaultVideoBridge: string;
  customBridgeUrlTemplate: string | null;
  updatedAt: Date;
} | null;

const URGENCY_OPTIONS = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'P4', label: 'P4' },
  { value: 'P5', label: 'P5' },
];

const VIDEO_BRIDGE_OPTIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'JITSI', label: 'Jitsi Meet' },
  { value: 'SLACK_HUDDLE', label: 'Slack Channel Huddle 🎧' },
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'GOOGLE_MEET', label: 'Google Meet' },
];

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save ChatOps Configuration
    </Button>
  );
}

export default function ChatOpsSettingsPage({
  config,
  isAdmin,
  isSlackConnected,
}: {
  config: ChatOpsConfigView;
  isAdmin: boolean;
  isSlackConnected: boolean;
}) {
  const [state, formAction] = useActionState(saveChatOpsConfig, {
    error: null,
    success: false,
  });

  const selectedUrgencies = config ? config.autoCreateOnUrgency : ['HIGH'];
  const selectedPriorities = config ? config.autoCreateOnPriority : ['P1', 'P2'];

  return (
    <div className="space-y-6">
      <SettingsSection
        title="ChatOps Settings"
        description="Configure automatic Slack channels and video war rooms for incidents."
        action={
          <Badge variant={config?.enabled ? 'default' : 'secondary'}>
            {config?.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        }
      >
        <form action={formAction} className="space-y-6 py-6">
          {!isSlackConnected && (
             <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertDescription>Slack is not connected. ChatOps requires an active Slack integration to create channels.</AlertDescription>
             </Alert>
          )}
          {state?.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state?.success && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription>ChatOps configuration saved.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
             <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={config?.enabled ?? false}
                  disabled={!isAdmin}
                  className="h-4 w-4"
                />
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Enable ChatOps workflows
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                    <Label htmlFor="channelPrefix" className="flex items-center gap-2">
                      <Hash className="h-4 w-4" /> Channel Prefix
                    </Label>
                    <Input
                      id="channelPrefix"
                      name="channelPrefix"
                      defaultValue={config?.channelPrefix ?? 'inc'}
                      placeholder="inc"
                      disabled={!isAdmin}
                      required
                    />
                 </div>
              </div>
          </div>

          <div className="rounded-md border p-4 space-y-4">
             <Label className="text-sm font-medium">Auto-create channels on Incident Urgency</Label>
             <div className="grid gap-2 sm:grid-cols-3">
               {URGENCY_OPTIONS.map(option => (
                 <label key={option.value} className="flex items-center gap-2 text-sm">
                   <input
                     type="checkbox"
                     name="autoCreateOnUrgency"
                     value={option.value}
                     defaultChecked={selectedUrgencies.includes(option.value)}
                     disabled={!isAdmin}
                     className="h-4 w-4"
                   />
                   {option.label}
                 </label>
               ))}
             </div>
             
             <Label className="text-sm font-medium mt-4 block">Auto-create channels on Incident Priority</Label>
             <div className="grid gap-2 sm:grid-cols-5">
               {PRIORITY_OPTIONS.map(option => (
                 <label key={option.value} className="flex items-center gap-2 text-sm">
                   <input
                     type="checkbox"
                     name="autoCreateOnPriority"
                     value={option.value}
                     defaultChecked={selectedPriorities.includes(option.value)}
                     disabled={!isAdmin}
                     className="h-4 w-4"
                   />
                   {option.label}
                 </label>
               ))}
             </div>
          </div>

          <div className="space-y-4 rounded-md border p-4">
             <Label className="text-sm font-medium flex items-center gap-2 mb-4">
                <Video className="h-4 w-4" /> Video War Room
             </Label>
             <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                    <Label htmlFor="defaultVideoBridge">Default Video Bridge</Label>
                    <select
                      id="defaultVideoBridge"
                      name="defaultVideoBridge"
                      defaultValue={config?.defaultVideoBridge ?? 'NONE'}
                      disabled={!isAdmin}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {VIDEO_BRIDGE_OPTIONS.map(option => (
                         <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="customBridgeUrlTemplate">Custom Bridge URL Template</Label>
                    <Input
                      id="customBridgeUrlTemplate"
                      name="customBridgeUrlTemplate"
                      defaultValue={config?.customBridgeUrlTemplate ?? ''}
                      placeholder="https://meet.company.com/{incidentId}"
                      disabled={!isAdmin}
                    />
                 </div>
             </div>
          </div>
          
          <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
             <input
               type="checkbox"
               name="archiveOnResolve"
               defaultChecked={config?.archiveOnResolve ?? true}
               disabled={!isAdmin}
               className="h-4 w-4"
             />
             <Archive className="h-4 w-4 text-muted-foreground" />
             Archive Slack channel on resolve
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {config
                ? `Last updated on ${new Date(config.updatedAt).toLocaleDateString()}`
                : 'No ChatOps configuration yet.'}
            </div>
            <div className="flex gap-2">
              <SubmitButton disabled={!isAdmin} />
            </div>
          </div>
        </form>
      </SettingsSection>
    </div>
  );
}
