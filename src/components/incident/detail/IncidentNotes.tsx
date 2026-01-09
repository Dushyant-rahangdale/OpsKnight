'use client';

import NoteCard from '../NoteCard';
import { Button } from '@/components/ui/shadcn/button';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { MessageSquare, Send, Lock, Sparkles } from 'lucide-react';

type Note = {
  id: string;
  content: string;
  user: { name: string; email: string };
  createdAt: Date;
};

type IncidentNotesProps = {
  notes: Note[];
  canManage: boolean;
  onAddNote: (formData: FormData) => void;
};

export default function IncidentNotes({ notes, canManage, onAddNote }: IncidentNotesProps) {
  return (
    <div className="space-y-6">
      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="py-12 px-8 text-center bg-gradient-to-br from-white to-[var(--color-neutral-50)] border border-[var(--border)] rounded-[var(--radius-lg)]">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[var(--accent)] to-blue-600 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">No notes yet</p>
            <p className="text-xs text-[var(--text-muted)]">
              Start the conversation by adding a note.
            </p>
          </div>
        ) : (
          notes.map(note => (
            <NoteCard
              key={note.id}
              content={note.content}
              userName={note.user.name}
              createdAt={note.createdAt}
              isResolution={note.content.startsWith('Resolution:')}
            />
          ))
        )}
      </div>

      {/* Add Note Form */}
      {canManage ? (
        <div className="p-5 bg-gradient-to-br from-white to-[var(--color-neutral-50)] border border-[var(--border)] rounded-[var(--radius-lg)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-blue-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Add Note</h4>
          </div>
          <form action={onAddNote} className="space-y-4">
            <Textarea
              name="content"
              placeholder="Add a note... (supports **bold**, *italic*, `code`, links)"
              required
              rows={4}
              className="resize-none bg-white border-[var(--border)] focus:border-[var(--accent)] focus:ring-[var(--accent)]/20"
            />
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" />
                Supports Markdown formatting
              </p>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] hover:from-[var(--primary-dark)] hover:to-[var(--primary)] text-white"
              >
                <Send className="mr-2 h-4 w-4" />
                Post Note
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-5 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 rounded-[var(--radius-lg)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-warning)]/20 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-[var(--color-warning)]" />
            </div>
            <p className="text-sm text-[var(--color-warning-dark)] font-medium">
              You don't have permission to add notes. Responder role or above required.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
