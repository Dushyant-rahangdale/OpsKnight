'use client';

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/shadcn/avatar';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/shadcn/dialog';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Professional cartoon avatars matching the screenshot style
const AVATAR_STYLES = [
  // Row 1 - Business Professionals (like screenshot top row)
  { id: 'biz-male-1', style: 'big-smile', seed: 'john-doe', bg: 'b91c1c', label: 'Professional 1' },
  {
    id: 'biz-female-1',
    style: 'big-smile',
    seed: 'jane-smith',
    bg: '65a30d',
    label: 'Professional 2',
  },
  {
    id: 'biz-male-2',
    style: 'big-smile',
    seed: 'robert-jones',
    bg: '7c3aed',
    label: 'Professional 3',
  },

  // Row 2 - Business Team (like screenshot middle row)
  {
    id: 'biz-female-2',
    style: 'big-smile',
    seed: 'sarah-williams',
    bg: 'ea580c',
    label: 'Professional 4',
  },
  {
    id: 'biz-creative',
    style: 'big-smile',
    seed: 'alex-creative',
    bg: '0d9488',
    label: 'Professional 5',
  },
  {
    id: 'biz-female-3',
    style: 'big-smile',
    seed: 'emily-brown',
    bg: 'be123c',
    label: 'Professional 6',
  },

  // Row 3 - Support Team (like screenshot bottom row with headsets)
  { id: 'support-1', style: 'big-smile', seed: 'support-alice', bg: '0891b2', label: 'Support 1' },
  { id: 'support-2', style: 'big-smile', seed: 'support-david', bg: '6366f1', label: 'Support 2' },
  { id: 'support-3', style: 'big-smile', seed: 'support-mike', bg: '84cc16', label: 'Support 3' },

  // Additional Professional Styles
  { id: 'eng-1', style: 'big-smile', seed: 'engineer-sam', bg: 'dc2626', label: 'Engineer 1' },
  { id: 'eng-2', style: 'big-smile', seed: 'engineer-kate', bg: '059669', label: 'Engineer 2' },
  { id: 'eng-3', style: 'big-smile', seed: 'engineer-tom', bg: 'db2777', label: 'Engineer 3' },

  { id: 'mgr-1', style: 'big-smile', seed: 'manager-lisa', bg: '2563eb', label: 'Manager 1' },
  { id: 'mgr-2', style: 'big-smile', seed: 'manager-chris', bg: 'c026d3', label: 'Manager 2' },
  { id: 'mgr-3', style: 'big-smile', seed: 'manager-anna', bg: '16a34a', label: 'Manager 3' },

  { id: 'dev-1', style: 'big-smile', seed: 'developer-mark', bg: '7c2d12', label: 'Developer 1' },
  { id: 'dev-2', style: 'big-smile', seed: 'developer-nina', bg: '0284c7', label: 'Developer 2' },
  { id: 'dev-3', style: 'big-smile', seed: 'developer-paul', bg: '9333ea', label: 'Developer 3' },

  { id: 'ops-1', style: 'big-smile', seed: 'ops-james', bg: 'ca8a04', label: 'Ops Team 1' },
  { id: 'ops-2', style: 'big-smile', seed: 'ops-rachel', bg: 'd946ef', label: 'Ops Team 2' },
  { id: 'ops-3', style: 'big-smile', seed: 'ops-kevin', bg: '0f766e', label: 'Ops Team 3' },

  { id: 'exec-1', style: 'big-smile', seed: 'exec-michael', bg: '4338ca', label: 'Executive 1' },
  { id: 'exec-2', style: 'big-smile', seed: 'exec-sophia', bg: 'be185d', label: 'Executive 2' },
  { id: 'exec-3', style: 'big-smile', seed: 'exec-daniel', bg: '15803d', label: 'Executive 3' },
];

interface AvatarPickerProps {
  currentAvatarUrl?: string | null;
  onSelect: (avatarUrl: string) => void;
  userName: string;
}

export function AvatarPicker({ currentAvatarUrl, onSelect, userName }: AvatarPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const generateAvatarUrl = (style: string, seed: string, bg: string) => {
    // Remove # from hex color
    const bgColor = bg.replace('#', '');
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=${bgColor}&radius=50`;
  };

  const handleSelect = (avatarId: string) => {
    const avatar = AVATAR_STYLES.find(a => a.id === avatarId);
    if (avatar) {
      const url = generateAvatarUrl(avatar.style, avatar.seed, avatar.bg);
      setSelectedId(avatarId);
      onSelect(url);
      setOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        Choose Avatar Style
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Your Avatar</DialogTitle>
            <DialogDescription>
              Select a professional avatar that represents you. These avatars will be visible to
              your team.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-6 gap-3 py-4">
            {AVATAR_STYLES.map(avatar => {
              const avatarUrl = generateAvatarUrl(avatar.style, avatar.seed, avatar.bg);
              const isSelected = currentAvatarUrl === avatarUrl;

              return (
                <button
                  key={avatar.id}
                  onClick={() => handleSelect(avatar.id)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-md hover:scale-105',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-transparent hover:border-muted-foreground/20'
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-16 w-16 ring-2 ring-background shadow-lg">
                      <AvatarImage src={avatarUrl} alt={avatar.label} />
                      <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                    </Avatar>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {avatar.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Or upload your own photo from the main profile section
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
