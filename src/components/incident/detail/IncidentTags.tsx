'use client';

import { logger } from '@/lib/logger';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../ToastProvider';
import {
  addTagToIncident,
  removeTagFromIncident,
  getAllTags,
} from '@/app/(app)/incidents/tag-actions';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { Input } from '@/components/ui/shadcn/input';

type IncidentTagsProps = {
  incidentId: string;
  tags: Array<{ id: string; name: string; color?: string | null }>;
  canManage: boolean;
};

export default function IncidentTags({ incidentId, tags, canManage }: IncidentTagsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string }>>([]);
  const [isPending, startTransition] = useTransition();

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    startTransition(async () => {
      try {
        await addTagToIncident(incidentId, newTagName.trim());
        showToast('Tag added successfully', 'success');
        setNewTagName('');
        setIsAdding(false);
        router.refresh();
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to add tag', 'error');
      }
    });
  };

  const handleRemoveTag = async (tagId: string) => {
    startTransition(async () => {
      try {
        await removeTagFromIncident(incidentId, tagId);
        showToast('Tag removed successfully', 'success');
        router.refresh();
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to remove tag', 'error');
      }
    });
  };

  const loadAvailableTags = async () => {
    try {
      const allTags = await getAllTags();
      setAvailableTags(allTags);
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to load tags', { error: error.message });
      } else {
        logger.error('Failed to load tags', { error: String(error) });
      }
    }
  };

  const getTagColor = (tagName: string) => {
    // Simple hash-based color generation
    const colors = [
      { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
      { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
      { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
      { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
      { bg: '#fce7f3', color: '#9f1239', border: '#fbcfe8' },
      { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
    ];
    const hash = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</h4>
        {canManage && !isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(true);
              loadAvailableTags();
            }}
            className="h-6 px-2 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/10"
          >
            + Add Tag
          </Button>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map(tag => {
            const tagColors = getTagColor(tag.name);
            return (
              <Badge
                key={tag.id}
                variant="outline"
                className="rounded-sm border px-2 py-0.5 text-xs font-semibold transition-all hover:scale-105"
                style={{
                  backgroundColor: tagColors.bg,
                  color: tagColors.color,
                  borderColor: tagColors.border,
                }}
              >
                #{tag.name}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id)}
                    disabled={isPending}
                    className="ml-1.5 hover:opacity-70 disabled:opacity-50"
                  >
                    ×
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}

      {isAdding && canManage && (
        <div className="flex gap-2 items-start">
          <Input
            type="text"
            value={newTagName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              } else if (e.key === 'Escape') {
                setIsAdding(false);
                setNewTagName('');
              }
            }}
            placeholder="Tag name..."
            autoFocus
            className="h-8 text-xs"
            list="available-tags"
          />
          <datalist id="available-tags">
            {availableTags.map(tag => (
              <option key={tag.id} value={tag.name} />
            ))}
          </datalist>
          <Button
            size="sm"
            onClick={handleAddTag}
            disabled={isPending || !newTagName.trim()}
            className="h-8 px-3 text-xs"
          >
            Add
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setNewTagName('');
            }}
            className="h-8 px-3 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {tags.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground italic">No tags assigned</p>
      )}
    </div>
  );
}
