'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';

type Props = {
  initialStatus?: string;
  initialService?: string;
  initialAssignee?: string;
  services: { id: string; name: string }[];
  users: { id: string; name: string }[];
};

export default function DashboardFilters({
  initialStatus,
  initialService,
  initialAssignee,
  services,
  users,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <form
      method="get"
      className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 items-end"
    >
      <div>
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Status
        </Label>
        <select
          name="status"
          value={initialStatus || 'ALL'}
          onChange={e => handleFilterChange('status', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-sm text-sm bg-neutral-50 text-foreground font-medium transition-all"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="RESOLVED">Resolved</option>
          <option value="SNOOZED">Snoozed</option>
          <option value="SUPPRESSED">Suppressed</option>
        </select>
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Service
        </Label>
        <select
          name="service"
          value={initialService || ''}
          onChange={e => handleFilterChange('service', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-sm text-sm bg-neutral-50 text-foreground font-medium transition-all"
        >
          <option value="">All Services</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Assignee
        </Label>
        <select
          name="assignee"
          value={initialAssignee || ''}
          onChange={e => handleFilterChange('assignee', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-sm text-sm bg-neutral-50 text-foreground font-medium transition-all"
        >
          <option value="">All Assignees</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
          <a href="/">Clear</a>
        </Button>
      </div>
    </form>
  );
}
