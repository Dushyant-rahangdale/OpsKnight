'use client';

import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/timezone';
import { getDefaultAvatar } from '@/lib/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/shadcn/avatar';
import { Badge } from '@/components/ui/shadcn/badge';
import { Clock, UserCheck, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/shadcn/separator';

type CoverageBlock = {
  id: string;
  userName: string;
  userAvatar?: string | null;
  userGender?: string | null;
  layerName: string;
  start: Date | string;
  end: Date | string;
};

type CurrentCoverageDisplayProps = {
  initialBlocks: CoverageBlock[];
  scheduleTimeZone: string;
};

export default function CurrentCoverageDisplay({
  initialBlocks,
  scheduleTimeZone,
}: CurrentCoverageDisplayProps) {
  const formatTime = (date: Date) => {
    return formatDateTime(date, scheduleTimeZone, { format: 'time' });
  };

  const normalizedBlocks = initialBlocks.map(block => ({
    ...block,
    start: new Date(block.start),
    end: new Date(block.end),
  }));

  const [activeBlocks, setActiveBlocks] = useState(normalizedBlocks);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const calculateActive = () => {
      const now = new Date();
      setCurrentTime(now);
      const nowTime = now.getTime();
      const normalized = initialBlocks.map(block => ({
        ...block,
        start: new Date(block.start),
        end: new Date(block.end),
      }));
      const active = normalized.filter(block => {
        return block.start.getTime() <= nowTime && block.end.getTime() > nowTime;
      });
      setActiveBlocks(active);
    };
    calculateActive();
    const interval = setInterval(calculateActive, 30000);
    return () => clearInterval(interval);
  }, [initialBlocks]);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  const hasCoverage = activeBlocks.length > 0;

  return (
    <Card
      className={cn(
        'overflow-hidden border-none shadow-md',
        hasCoverage
          ? 'bg-gradient-to-b from-emerald-600 to-teal-700'
          : 'bg-gradient-to-b from-slate-700 to-slate-800'
      )}
    >
      <CardHeader className="pb-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
              {hasCoverage ? (
                <ShieldCheck className="h-5 w-5 text-white" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-wide uppercase opacity-90">
                On-Call Now
              </CardTitle>
              <p className="text-[10px] text-white/70 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(currentTime)}
              </p>
            </div>
          </div>
          <div
            className={cn(
              'h-2 w-2 rounded-full animate-pulse',
              hasCoverage ? 'bg-white' : 'bg-red-400'
            )}
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-white/95 backdrop-blur-xl min-h-[100px] shadow-inner">
        {!hasCoverage ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <UserCheck className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No Active Responders</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[180px]">
              No shifts are currently scheduled. Check configuration.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeBlocks.map((block, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
              >
                <Avatar className="h-10 w-10 ring-2 ring-emerald-100 shadow-sm">
                  <AvatarImage
                    src={block.userAvatar || getDefaultAvatar(block.userGender, block.userName)}
                  />
                  <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-bold">
                    {getInitials(block.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 truncate pr-2">
                      {block.userName}
                    </h4>
                    <Badge
                      variant="secondary"
                      className="text-[9px] h-4 px-1.5 bg-slate-100 text-slate-500 font-semibold border-slate-200"
                    >
                      {block.layerName}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <p className="text-xs text-slate-500 font-medium truncate">
                      Until {formatTime(new Date(block.end))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {hasCoverage && (
          <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              OpsSentinal Coverage
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
