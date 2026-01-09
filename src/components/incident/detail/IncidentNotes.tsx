'use client';

import NoteCard from '../NoteCard';
import { Button } from '@/components/ui/shadcn/button';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar';
import { Badge } from '@/components/ui/shadcn/badge';
import { MessageSquare, Send, Lock, User } from 'lucide-react';

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
      {/* Add Note Form */}
      {canManage ? (
        <div className="p-4 bg-muted/30 rounded-lg border">
          <form action={onAddNote} className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 bg-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  name="content"
                  placeholder="Add a note... (supports Markdown)"
                  required
                  rows={3}
                  className="resize-none bg-background"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 pl-11">
              <p className="text-xs text-muted-foreground">Supports **bold**, *italic*, `code`</p>
              <Button type="submit" size="sm">
                <Send className="mr-2 h-4 w-4" />
                Post Note
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <Lock className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-orange-900">Notes Restricted</p>
            <p className="text-xs text-orange-700">Responder role required to add notes</p>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
            <p className="text-sm text-muted-foreground">
              Start the conversation by adding a note above.
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
    </div>
  );
}
