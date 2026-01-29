'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/shadcn/sheet';
import { Button } from '@/components/ui/shadcn/button';
import { Label } from '@/components/ui/shadcn/label';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
import { addHours, format } from 'date-fns';
import UserAvatar from '@/components/UserAvatar';

type OverrideFormProps = {
  scheduleId: string;
  users: Array<{ id: string; name: string; avatarUrl?: string | null; gender?: string | null }>;
  canManageSchedules: boolean;
  createOverride: (
    scheduleId: string,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
};

export default function OverrideForm({
  scheduleId,
  users,
  canManageSchedules,
  createOverride,
}: OverrideFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [replacesUserId, setReplacesUserId] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Helper for datetime-local format: YYYY-MM-DDTHH:mm
  const toLocalISOString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleQuickDuration = (hours: number) => {
    const now = new Date();
    // Round up to next 15 mins for cleanliness
    const remainder = 15 - (now.getMinutes() % 15);
    now.setMinutes(now.getMinutes() + remainder);
    now.setSeconds(0);
    now.setMilliseconds(0);

    const end = addHours(now, hours);

    setStartTime(toLocalISOString(now));
    setEndTime(toLocalISOString(end));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedUserId) {
      showToast('Please select a responder', 'error');
      return;
    }
    if (!startTime || !endTime) {
      showToast('Please set start and end times', 'error');
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await createOverride(scheduleId, formData);
        if (result?.error) {
          showToast(result.error, 'error');
        } else {
          const userName = users.find(u => u.id === selectedUserId)?.name || 'User';
          showToast(`Override created for ${userName}`, 'success');
          // Reset form
          setSelectedUserId('');
          setReplacesUserId('');
          setStartTime('');
          setEndTime('');
          router.refresh();
          setOpen(false);
        }
      } catch {
        showToast('Failed to create override', 'error');
      }
    });
  };

  if (!canManageSchedules) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full h-10 gap-2 text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 shadow-sm">
          <Clock className="h-3.5 w-3.5" />
          Add Override
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </span>
            Add Coverage Override
          </SheetTitle>
          <SheetDescription>
            Temporarily replace the on-call responder for a specific time window.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden inputs for FormData */}
          <input type="hidden" name="userId" value={selectedUserId} />
          <input type="hidden" name="replacesUserId" value={replacesUserId} />
          <input type="hidden" name="start" value={startTime} />
          <input type="hidden" name="end" value={endTime} />

          {/* Who takes coverage - Dropdown */}
          <div className="space-y-3">
            <Label>Who takes coverage? *</Label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full h-11 text-sm rounded-lg border-2 border-slate-200 bg-white pl-4 pr-10 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium appearance-none"
                required
              >
                <option value="">Select responder...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {/* Dropdown arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Who are they replacing (Optional) - Dropdown */}
          <div className="space-y-3">
            <Label>
              Replacing <span className="text-slate-400 font-normal">(Optional)</span>
            </Label>
            <div className="relative">
              <select
                value={replacesUserId}
                onChange={e => setReplacesUserId(e.target.value)}
                className="w-full h-11 text-sm rounded-lg border-2 border-slate-200 bg-white pl-4 pr-10 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium appearance-none"
              >
                <option value="">Everyone (override all)</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {/* Dropdown arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Duration */}
          <div className="space-y-3">
            <Label>Quick Duration</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '1h', hours: 1 },
                { label: '4h', hours: 4 },
                { label: '8h', hours: 8 },
                { label: '24h', hours: 24 },
              ].map(({ label, hours }) => (
                <Button
                  key={hours}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDuration(hours)}
                  className="text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date/Time inputs - using native datetime-local */}
          <div className="space-y-3">
            <Label>Start Date & Time *</Label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
              disabled={isPending}
              className="w-full h-11 text-sm rounded-lg border-2 border-slate-200 bg-white px-3 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <Label>End Date & Time *</Label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
              disabled={isPending}
              className="w-full h-11 text-sm rounded-lg border-2 border-slate-200 bg-white px-3 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            />
          </div>

          {/* Preview */}
          {startTime && endTime && selectedUserId && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
              <p className="font-medium text-amber-800">
                {users.find(u => u.id === selectedUserId)?.name} will be on-call
              </p>
              <p className="text-amber-600 text-xs mt-1">
                {format(new Date(startTime), 'MMM d, h:mm a')} →{' '}
                {format(new Date(endTime), 'MMM d, h:mm a')}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending || !selectedUserId || !startTime || !endTime}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Override...
              </>
            ) : (
              'Confirm Override'
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
