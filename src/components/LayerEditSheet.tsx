'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';

import { formatDateForInput } from '@/lib/timezone';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/shadcn/sheet';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Layers, Loader2, Edit3 } from 'lucide-react';

type LayerEditSheetProps = {
  layer: {
    id: string;
    name: string;
    start: Date;
    end: Date | null;
    rotationLengthHours: number;
  };
  timeZone: string;
  updateLayer: (layerId: string, formData: FormData) => Promise<{ error?: string } | undefined>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function LayerEditSheet({
  layer,
  timeZone,
  updateLayer,
  open,
  onOpenChange,
}: LayerEditSheetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Local state for quick interactions
  const [rotationDuration, setRotationDuration] = useState<string>(
    layer.rotationLengthHours.toString()
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateLayer(layer.id, formData);
        if (result?.error) {
          showToast(result.error, 'error');
        } else {
          showToast('Layer updated successfully', 'success');
          onOpenChange(false);
          router.refresh();
        }
      } catch {
        showToast('Failed to update layer', 'error');
      }
    });
  };

  const setQuickDuration = (hours: number) => {
    setRotationDuration(hours.toString());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Edit3 className="h-5 w-5" />
            </span>
            Edit Rotation Layer
          </SheetTitle>
          <SheetDescription>
            Update the rotation settings for <strong>{layer.name}</strong>.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name">Layer Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={layer.name}
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
            <Label htmlFor="start">Start Date & Time</Label>
            <input
              type="datetime-local"
              name="start"
              defaultValue={formatDateForInput(layer.start, timeZone)}
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
              defaultValue={layer.end ? formatDateForInput(layer.end, timeZone) : ''}
              disabled={isPending}
              className="w-full h-11 text-sm rounded-lg border-2 border-slate-200 bg-white px-3 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[10px] text-slate-500">Leave empty for an ongoing rotation.</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
