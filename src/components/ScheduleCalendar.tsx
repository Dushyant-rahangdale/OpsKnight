'use client';

import { useMemo, useState } from 'react';
import {
  addDaysToDateKey,
  formatDateKeyInTimeZone,
  formatDateTime,
  getDatePartsInTimeZone,
  startOfDayInTimeZone,
  startOfDayFromDateKey,
  startOfNextDayFromDateKey,
} from '@/lib/timezone';
import { getDefaultAvatar } from '@/lib/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalendarShift = {
  id: string;
  start: string;
  end: string;
  label: string;
  user?: {
    name: string;
    avatarUrl?: string | null;
    gender?: string | null;
  };
};

type CalendarCell = {
  date: Date;
  inMonth: boolean;
  shifts: CalendarShift[];
};

type ScheduleCalendarProps = {
  shifts: CalendarShift[];
  timeZone: string;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekdayIndex(dateKey: string, timeZone: string): number {
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(startOfDayFromDateKey(dateKey, timeZone));
  const index = weekdayLabels.indexOf(day);
  return index === -1 ? 0 : index;
}

function getDayNumber(dateKey: string): number {
  const parts = dateKey.split('-');
  return Number(parts[2]);
}

function buildCalendar(baseDate: Date, shifts: CalendarShift[], timeZone: string) {
  const { year, month } = getDatePartsInTimeZone(baseDate, timeZone);
  const firstDayKey = `${year}-${String(month).padStart(2, '0')}-01`;
  const firstDayIndex = getWeekdayIndex(firstDayKey, timeZone);
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totalCells = Math.ceil((firstDayIndex + totalDays) / 7) * 7;
  const firstCellKey = addDaysToDateKey(firstDayKey, -firstDayIndex);
  const cells: CalendarCell[] = [];

  const shiftsForDateKey = (dateKey: string) => {
    const dayStart = startOfDayFromDateKey(dateKey, timeZone);
    const dayEnd = startOfNextDayFromDateKey(dateKey, timeZone);

    // Filter shifts that overlap with this day
    const overlapping = shifts.filter(shift => {
      const start = new Date(shift.start);
      const end = new Date(shift.end);
      return start < dayEnd && end > dayStart;
    });

    // Group by layer - show only ONE shift per layer per day
    const byLayer = new Map<string, CalendarShift>();
    overlapping.forEach(shift => {
      const layerName = shift.label.split(':')[0].trim();

      // If we haven't seen this layer yet, or if this shift starts on this day (preferred)
      if (!byLayer.has(layerName)) {
        byLayer.set(layerName, shift);
      } else {
        const existing = byLayer.get(layerName)!;
        const shiftStart = new Date(shift.start).getTime();
        const existingStart = new Date(existing.start).getTime();
        const dayStartTime = dayStart.getTime();
        const dayEndTime = dayEnd.getTime();

        // Prefer shift that starts on this day
        const shiftStartsToday = shiftStart >= dayStartTime && shiftStart < dayEndTime;
        const existingStartsToday = existingStart >= dayStartTime && existingStart < dayEndTime;

        if (shiftStartsToday && !existingStartsToday) {
          byLayer.set(layerName, shift);
        } else if (!shiftStartsToday && !existingStartsToday) {
          // If neither starts today, prefer the one with more overlap
          const shiftOverlap =
            Math.min(new Date(shift.end).getTime(), dayEndTime) -
            Math.max(new Date(shift.start).getTime(), dayStartTime);
          const existingOverlap =
            Math.min(new Date(existing.end).getTime(), dayEndTime) -
            Math.max(existingStart, dayStartTime);
          if (shiftOverlap > existingOverlap) {
            byLayer.set(layerName, shift);
          }
        }
      }
    });

    // Return only one shift per layer, sorted by layer name for consistency
    return Array.from(byLayer.values()).sort((a, b) => {
      const layerA = a.label.split(':')[0].trim();
      const layerB = b.label.split(':')[0].trim();
      return layerA.localeCompare(layerB);
    });
  };

  for (let i = 0; i < totalCells; i++) {
    const dateKey = addDaysToDateKey(firstCellKey, i);
    const date = startOfDayFromDateKey(dateKey, timeZone);
    const inMonth = dateKey.startsWith(`${year}-${String(month).padStart(2, '0')}-`);
    cells.push({ date, inMonth, shifts: shiftsForDateKey(dateKey) });
  }

  return cells;
}

export default function ScheduleCalendar({ shifts, timeZone }: ScheduleCalendarProps) {
  const [cursor, setCursor] = useState(() => new Date());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone,
      }).format(cursor),
    [cursor, timeZone]
  );

  const calendarCells = useMemo(
    () => buildCalendar(cursor, shifts, timeZone),
    [cursor, shifts, timeZone]
  );
  const todayKey = useMemo(() => formatDateKeyInTimeZone(new Date(), timeZone), [timeZone]);

  const toggleExpand = (dateKey: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  const handlePrev = () => {
    setCursor(prev => {
      const { year, month } = getDatePartsInTimeZone(prev, timeZone);
      const previousMonthIndex = month - 2;
      const newYear = year + Math.floor(previousMonthIndex / 12);
      const newMonth = (((previousMonthIndex % 12) + 12) % 12) + 1;
      const monthKey = `${newYear}-${String(newMonth).padStart(2, '0')}-01`;
      return startOfDayFromDateKey(monthKey, timeZone);
    });
  };

  const handleNext = () => {
    setCursor(prev => {
      const { year, month } = getDatePartsInTimeZone(prev, timeZone);
      const nextMonthIndex = month;
      const newYear = year + Math.floor(nextMonthIndex / 12);
      const newMonth = (nextMonthIndex % 12) + 1;
      const monthKey = `${newYear}-${String(newMonth).padStart(2, '0')}-01`;
      return startOfDayFromDateKey(monthKey, timeZone);
    });
  };

  const handleToday = () => {
    setCursor(startOfDayInTimeZone(new Date(), timeZone));
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              On-call Calendar
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Shows all active layers. Multiple layers can be active simultaneously.
            </p>
          </div>
          <Badge variant="secondary" size="xs" className="gap-1.5 shrink-0">
            <Clock className="h-3 w-3" />
            {monthLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Navigation Controls */}
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handlePrev} className="h-8 px-3">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} className="h-8 px-3">
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext} className="h-8 px-3">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdayLabels.map(day => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map(cell => {
              const dateKey = formatDateKeyInTimeZone(cell.date, timeZone);
              const isToday = dateKey === todayKey;
              const isExpanded = expandedDates.has(dateKey);
              const preview = cell.shifts.slice(0, 2);
              const remaining = cell.shifts.length - preview.length;
              const showAll = isExpanded || cell.shifts.length <= 2;

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'min-h-24 p-2 rounded-lg border transition-all',
                    cell.inMonth
                      ? 'bg-card border-border hover:border-primary/30'
                      : 'bg-muted/30 border-transparent',
                    isToday && 'ring-2 ring-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        !cell.inMonth && 'text-muted-foreground',
                        isToday && 'text-primary font-bold'
                      )}
                    >
                      {getDayNumber(dateKey)}
                    </span>
                    {isToday && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>

                  {cell.shifts.length > 0 && (
                    <div className="space-y-1.5">
                      {(showAll ? cell.shifts : preview).map(shift => {
                        const start = new Date(shift.start);
                        const end = new Date(shift.end);
                        const startTime = formatDateTime(start, timeZone, { format: 'time' });
                        const endTime = formatDateTime(end, timeZone, { format: 'time' });
                        const isMultiDay = start.toDateString() !== end.toDateString();

                        return (
                          <div
                            key={shift.id}
                            className="group relative rounded-md bg-primary/10 border border-primary/20 p-1.5 text-xs hover:bg-primary/15 transition-colors cursor-default"
                            title={`${startTime} - ${endTime}${isMultiDay ? ' (spans multiple days)' : ''}`}
                          >
                            {shift.user ? (
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={
                                    shift.user.avatarUrl ||
                                    getDefaultAvatar(shift.user.gender, shift.user.name)
                                  }
                                  alt={`Avatar of ${shift.user.name}`}
                                  className="h-4 w-4 rounded-full object-cover flex-shrink-0 ring-1 ring-white/50"
                                />
                                <span className="font-medium text-foreground truncate flex-1 min-w-0">
                                  {shift.user.name}
                                </span>
                              </div>
                            ) : (
                              <span className="font-medium text-foreground truncate block">
                                {shift.label}
                              </span>
                            )}
                            {isMultiDay && (
                              <Badge
                                variant="outline"
                                size="xs"
                                className="mt-1 h-4 border-primary/30"
                              >
                                multi-day
                              </Badge>
                            )}
                          </div>
                        );
                      })}

                      {/* Show More/Less Button */}
                      {remaining > 0 && !isExpanded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            toggleExpand(dateKey);
                          }}
                          className="w-full h-6 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1"
                        >
                          <ChevronDown className="h-3 w-3" />+{remaining} more
                        </Button>
                      )}
                      {isExpanded && cell.shifts.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            toggleExpand(dateKey);
                          }}
                          className="w-full h-6 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1"
                        >
                          <ChevronUp className="h-3 w-3" />
                          Show less
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
