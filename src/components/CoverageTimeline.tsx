/* eslint-disable */
'use client';

import { useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/shadcn/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { getDefaultAvatar } from '@/lib/avatar';
import { Sun, Moon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type CoverageBlock = {
  userName: string;
  userAvatar?: string | null;
  userGender?: string | null;
  layerName: string;
  start: Date;
  end: Date;
};

type CoverageTimelineProps = {
  shifts: CoverageBlock[];
  timeZone: string;
};

const LAYER_COLORS = [
  { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-500', light: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-sky-500', light: 'bg-sky-100', text: 'text-sky-700' },
];

export default function CoverageTimeline({ shifts, timeZone }: CoverageTimelineProps) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Filter shifts to today only
  const todayShifts = useMemo(() => {
    return shifts
      .filter(shift => {
        return shift.start < todayEnd && shift.end > todayStart;
      })
      .map(shift => ({
        ...shift,
        // Clamp to today's bounds
        displayStart: new Date(Math.max(shift.start.getTime(), todayStart.getTime())),
        displayEnd: new Date(Math.min(shift.end.getTime(), todayEnd.getTime())),
      }));
  }, [shifts, todayStart, todayEnd]);

  // Get unique layer names for color assignment
  const layerColorMap = useMemo(() => {
    const uniqueLayers = [...new Set(todayShifts.map(s => s.layerName))];
    const map = new Map<string, (typeof LAYER_COLORS)[0]>();
    uniqueLayers.forEach((layer, index) => {
      map.set(layer, LAYER_COLORS[index % LAYER_COLORS.length]);
    });
    return map;
  }, [todayShifts]);

  // Current hour position
  const currentHourPosition = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;

  // Generate hour markers
  const hourMarkers = [0, 6, 12, 18];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          <Clock className="h-3 w-3" />
          Today's Coverage
        </div>
        <span className="text-[10px] text-slate-400">
          {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative rounded-lg border border-slate-200 bg-white overflow-hidden">
        {/* Hour Grid */}
        <div className="absolute inset-0 flex">
          {/* Night (0-6) */}
          <div className="w-1/4 bg-slate-50/50 border-r border-slate-100" />
          {/* Day (6-12) */}
          <div className="w-1/4 bg-amber-50/30 border-r border-slate-100" />
          {/* Day (12-18) */}
          <div className="w-1/4 bg-amber-50/30 border-r border-slate-100" />
          {/* Night (18-24) */}
          <div className="w-1/4 bg-slate-50/50" />
        </div>

        {/* Shift Blocks */}
        <div className="relative h-10">
          {todayShifts.map((shift, index) => {
            const startMinutes =
              shift.displayStart.getHours() * 60 + shift.displayStart.getMinutes();
            const endMinutes =
              shift.displayEnd.getHours() * 60 + shift.displayEnd.getMinutes() || 24 * 60;
            const leftPercent = (startMinutes / (24 * 60)) * 100;
            const widthPercent = ((endMinutes - startMinutes) / (24 * 60)) * 100;
            const color = layerColorMap.get(shift.layerName) || LAYER_COLORS[0];

            return (
              <TooltipProvider key={`${shift.layerName}-${index}`} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'absolute top-1 h-8 rounded-md flex items-center gap-1.5 px-1.5 cursor-pointer transition-all hover:ring-2 hover:ring-offset-1',
                        color.bg,
                        'hover:ring-slate-300'
                      )}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${Math.max(widthPercent, 2)}%`,
                      }}
                    >
                      {widthPercent > 8 && (
                        <>
                          <Avatar className="h-5 w-5 ring-1 ring-white/30">
                            <AvatarImage
                              src={
                                shift.userAvatar ||
                                getDefaultAvatar(shift.userGender, shift.userName)
                              }
                            />
                            <AvatarFallback className="text-[8px] bg-white/20 text-white">
                              {shift.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {widthPercent > 15 && (
                            <span className="text-[10px] font-medium text-white truncate">
                              {shift.userName.split(' ')[0]}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-medium">{shift.userName}</div>
                    <div className="text-slate-400">
                      {shift.displayStart.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                      {' → '}
                      {shift.displayEnd.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </div>
                    <div className="text-slate-500">{shift.layerName}</div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}

          {/* Current Time Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{ left: `${currentHourPosition}%` }}
          >
            <div className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-red-500" />
          </div>
        </div>

        {/* Hour Labels */}
        <div className="relative h-4 border-t border-slate-100 flex text-[9px] text-slate-400">
          {hourMarkers.map(hour => (
            <div
              key={hour}
              className="absolute flex items-center gap-0.5"
              style={{ left: `${(hour / 24) * 100}%` }}
            >
              {hour === 6 && <Sun className="h-2.5 w-2.5 text-amber-400" />}
              {hour === 18 && <Moon className="h-2.5 w-2.5 text-slate-400" />}
              <span>
                {hour === 0
                  ? '12am'
                  : hour === 12
                    ? '12pm'
                    : hour < 12
                      ? `${hour}am`
                      : `${hour - 12}pm`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {todayShifts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...layerColorMap.entries()].map(([layer, color]) => (
            <div key={layer} className="flex items-center gap-1.5">
              <div className={cn('h-2 w-2 rounded-sm', color.bg)} />
              <span className="text-[10px] text-slate-500">{layer}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {todayShifts.length === 0 && (
        <div className="text-center py-3">
          <p className="text-xs text-slate-400">No shifts scheduled for today</p>
        </div>
      )}
    </div>
  );
}
