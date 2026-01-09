'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { CheckCircle2, Lock, Loader2, Target } from 'lucide-react';

type IncidentResolutionProps = {
  incidentId: string;
  canManage: boolean;
  onResolve: (formData: FormData) => void;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-11 font-semibold bg-gradient-to-r from-[var(--color-success)] to-emerald-600 hover:from-emerald-600 hover:to-[var(--color-success)] text-white shadow-[var(--shadow-success)]"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Resolving Incident...
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Resolve Incident
        </>
      )}
    </Button>
  );
}

export default function IncidentResolution({
  incidentId: _incidentId,
  canManage,
  onResolve,
}: IncidentResolutionProps) {
  if (!canManage) {
    return (
      <div className="p-5 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 rounded-[var(--radius-lg)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-warning)]/20 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-[var(--color-warning)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-warning-dark)]">
              Permission Required
            </p>
            <p className="text-xs text-[var(--color-warning)]">
              Responder role or above required to resolve incidents.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-[var(--radius-lg)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-success)] to-emerald-600 flex items-center justify-center shadow-[var(--shadow-success)]">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[var(--text-primary)]">Resolution</h4>
          <p className="text-xs text-[var(--text-muted)]">
            Mark this incident as resolved with a summary note
          </p>
        </div>
      </div>

      <form action={onResolve} className="space-y-4">
        <div className="space-y-2">
          <Textarea
            name="resolution"
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            placeholder="Root cause, fix applied, or summary..."
            className="resize-none bg-white border-emerald-200 focus:border-[var(--color-success)] focus:ring-[var(--color-success)]/20"
          />
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            10-1000 characters. Supports Markdown formatting.
          </p>
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
