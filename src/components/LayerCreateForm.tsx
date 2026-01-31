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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Layers, Loader2, Plus, Info } from 'lucide-react';

type LayerCreateFormProps = {
  scheduleId: string;
  canManageSchedules: boolean;
  createLayer: (scheduleId: string, formData: FormData) => Promise<{ error?: string } | undefined>;
  defaultStartDate: string;
};

export default function LayerCreateForm({
  scheduleId,
  canManageSchedules,
  createLayer,
  defaultStartDate,
}: LayerCreateFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Local state for quick interactions
  const [rotationDuration, setRotationDuration] = useState<string>('168'); // Default 1 week hours

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await createLayer(scheduleId, formData);
        if (result?.error) {
          showToast(result.error, 'error');
        } else {
          showToast('Layer created successfully', 'success');
          setOpen(false);
          router.refresh();
        }
      } catch (error) {
        showToast('Failed to create layer', 'error');
      }
    });
  };

  const setQuickDuration = (hours: number) => {
    setRotationDuration(hours.toString());
  };

  if (!canManageSchedules) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full h-10 gap-2 text-sm font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm">
          <Plus className="h-3.5 w-3.5" />
          Add Rotation
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </span>
            Add Rotation Layer
          </SheetTitle>
          <SheetDescription>
            Create a new rotation sequence. Defines who is on-call and for how long.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name">Layer Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Primary On-Call, Weekday Shift"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-3">
            <Label>Rotation Length (Handover)</Label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <Button
                type="button"
                variant={rotationDuration === '6' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setQuickDuration(6)}
                className="text-xs"
              >
                6h
              </Button>
              <Button
                type="button"
                variant={rotationDuration === '9' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setQuickDuration(9)}
                className="text-xs"
              >
                9h
              </Button>
              <Button
                type="button"
                variant={rotationDuration === '12' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setQuickDuration(12)}
                className="text-xs"
              >
                12h
              </Button>
              <Button
                type="button"
                variant={rotationDuration === '24' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setQuickDuration(24)}
                className="text-xs"
              >
                Daily
              </Button>
              <Button
                type="button"
                variant={rotationDuration === '168' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setQuickDuration(168)}
                className="text-xs"
              >
                Weekly
              </Button>
              <Button
                type="button"
                variant={rotationDuration === '336' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setQuickDuration(336)}
                className="text-xs"
              >
                2 Weeks
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                name="rotationLengthHours"
                value={rotationDuration}
                onChange={e => setRotationDuration(e.target.value)}
                required
                min="1"
                disabled={isPending}
                className="w-28"
              />
              <span className="text-sm text-slate-500">hours</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="shiftLengthHours" className="flex items-center">
              Shift Duration (Optional)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-2 text-slate-400 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>If set, this defines how long the user is actually on-call within their rotation period.</p>
                    <p className="mt-1 text-xs text-slate-400">Example: For 12h shifts every day (18:00-06:00), set Rotation = 24h and Shift Duration = 12h.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="shiftLengthHours"
              name="shiftLengthHours"
              type="number"
              min="1"
              placeholder="Leave empty to match Rotation Length"
              disabled={isPending}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="start">Start Date & Time</Label>
            <input
              type="datetime-local"
              name="start"
              defaultValue={defaultStartDate}
              required
              disabled={isPending}
              className="w-full h-11 text-sm rounded-lg border-2 border-slate-200 bg-white px-3 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[10px] text-slate-500">First shift starts at this time.</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="end">
              End Date & Time <span className="text-slate-400 font-normal">(Optional)</span>
            </Label>
            <input
              type="datetime-local"
              name="end"
              disabled={isPending}
              className="w-full h-11 text-sm rounded-lg border-2 border-slate-200 bg-white px-3 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[10px] text-slate-500">Leave empty for an ongoing rotation.</p>
          </div>

          {/* Restrictions Section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              Restrictions <span className="text-slate-400 font-normal">(Optional)</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-slate-400 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>Limit when this layer is active. Use for business-hours-only or weekday-only schedules.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>

            {/* Days of Week - Toggle Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Active Days</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form');
                      [1,2,3,4,5].forEach(i => {
                        const cb = form?.querySelector(`input[name="daysOfWeek"][value="${i}"]`) as HTMLInputElement;
                        if (cb) cb.checked = true;
                      });
                      [0,6].forEach(i => {
                        const cb = form?.querySelector(`input[name="daysOfWeek"][value="${i}"]`) as HTMLInputElement;
                        if (cb) cb.checked = false;
                      });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                  >
                    Weekdays
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form');
                      [0,6].forEach(i => {
                        const cb = form?.querySelector(`input[name="daysOfWeek"][value="${i}"]`) as HTMLInputElement;
                        if (cb) cb.checked = true;
                      });
                      [1,2,3,4,5].forEach(i => {
                        const cb = form?.querySelector(`input[name="daysOfWeek"][value="${i}"]`) as HTMLInputElement;
                        if (cb) cb.checked = false;
                      });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                  >
                    Weekends
                  </button>
                </div>
              </div>
              <div className="flex gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <label
                    key={i}
                    className="relative flex-1"
                  >
                    <input
                      type="checkbox"
                      name="daysOfWeek"
                      value={i}
                      disabled={isPending}
                      className="peer sr-only"
                    />
                    <div className="h-9 flex items-center justify-center rounded-lg border-2 border-slate-200 bg-white text-sm font-semibold text-slate-400 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-disabled:opacity-50 peer-disabled:cursor-not-allowed hover:border-slate-300 peer-checked:hover:border-primary">
                      {day}
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Select days when this layer is active. Leave empty for all days.</p>
            </div>

            {/* Time Range - Dropdowns with Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Active Hours</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form');
                      const startInput = form?.querySelector('select[name="restrictStartHour"]') as HTMLSelectElement;
                      const endInput = form?.querySelector('select[name="restrictEndHour"]') as HTMLSelectElement;
                      if (startInput) startInput.value = '9';
                      if (endInput) endInput.value = '17';
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                  >
                    9-5
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form');
                      const startInput = form?.querySelector('select[name="restrictStartHour"]') as HTMLSelectElement;
                      const endInput = form?.querySelector('select[name="restrictEndHour"]') as HTMLSelectElement;
                      if (startInput) startInput.value = '18';
                      if (endInput) endInput.value = '6';
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                  >
                    Nights
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form');
                      const startInput = form?.querySelector('select[name="restrictStartHour"]') as HTMLSelectElement;
                      const endInput = form?.querySelector('select[name="restrictEndHour"]') as HTMLSelectElement;
                      if (startInput) startInput.value = '';
                      if (endInput) endInput.value = '';
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  name="restrictStartHour"
                  disabled={isPending}
                  className="flex-1 h-10 text-sm rounded-lg border-2 border-slate-200 bg-white px-3 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">Start time</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00 {i < 12 ? 'AM' : 'PM'}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-400 font-medium">to</span>
                <select
                  name="restrictEndHour"
                  disabled={isPending}
                  className="flex-1 h-10 text-sm rounded-lg border-2 border-slate-200 bg-white px-3 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">End time</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00 {i < 12 ? 'AM' : 'PM'}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-500">Leave empty for 24-hour coverage.</p>
            </div>
          </div>

          {/* User ordering hint */}
          <div className="p-3 rounded-md bg-blue-50/70 border border-blue-100 text-xs text-blue-700">
            <strong>Tip:</strong> You can add users and reorder the rotation after creating the
            layer.
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Layer'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
