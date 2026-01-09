'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Button } from '@/components/ui/shadcn/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcn/avatar';
import { Badge } from '@/components/ui/shadcn/badge';
import { Users, Lock, Trash2 } from 'lucide-react';

type Watcher = {
  id: string;
  user: { id: string; name: string; email: string };
  role: string;
};

type IncidentWatchersProps = {
  watchers: Watcher[];
  users: Array<{ id: string; name: string; email: string }>;
  canManage: boolean;
  onAddWatcher: (formData: FormData) => void;
  onRemoveWatcher: (formData: FormData) => void;
};

export default function IncidentWatchers({
  watchers,
  users,
  canManage,
  onAddWatcher,
  onRemoveWatcher,
}: IncidentWatchersProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Watchers
        </h4>
        <Badge
          variant="outline"
          className="text-[10px] font-normal text-muted-foreground border-border bg-transparent"
        >
          Visibility
        </Badge>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="p-4 space-y-4">
          {canManage ? (
            <form action={onAddWatcher} className="grid gap-3">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Select name="watcherId">
                  <SelectTrigger className="bg-background h-9 text-sm">
                    <SelectValue placeholder="Select user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select name="watcherRole" defaultValue="FOLLOWER">
                  <SelectTrigger className="w-[110px] bg-background h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FOLLOWER">Follower</SelectItem>
                    <SelectItem value="STAKEHOLDER">Stakeholder</SelectItem>
                    <SelectItem value="EXEC">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" className="w-full font-semibold h-8 text-xs">
                <Users className="h-3.5 w-3.5 mr-2" />
                Add Watcher
              </Button>
            </form>
          ) : (
            <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Only responders can manage watchers
            </div>
          )}

          {watchers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-2">No watchers yet</p>
          ) : (
            <div className="space-y-2">
              {watchers.map(watcher => (
                <div
                  key={watcher.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {watcher.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {watcher.user.name}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {watcher.role.toLowerCase()}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <form action={onRemoveWatcher}>
                      <input type="hidden" name="watcherMemberId" value={watcher.id} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
