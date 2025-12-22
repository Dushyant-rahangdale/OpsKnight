'use client';

import { useState, useTransition } from 'react';
import { upsertPostmortem, type PostmortemData } from '@/app/(app)/postmortems/actions';
import { Button, Card, FormField } from '@/components/ui';
import { useRouter } from 'next/navigation';

type PostmortemFormProps = {
    incidentId: string;
    initialData?: {
        id: string;
        title: string;
        summary?: string | null;
        timeline?: any;
        impact?: any;
        rootCause?: string | null;
        resolution?: string | null;
        actionItems?: any;
        lessons?: string | null;
        status?: string;
    };
};

export default function PostmortemForm({ incidentId, initialData }: PostmortemFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<PostmortemData>({
        title: initialData?.title || '',
        summary: initialData?.summary || '',
        rootCause: initialData?.rootCause || '',
        resolution: initialData?.resolution || '',
        lessons: initialData?.lessons || '',
        status: (initialData?.status as any) || 'DRAFT',
        timeline: initialData?.timeline || [],
        impact: initialData?.impact || {},
        actionItems: initialData?.actionItems || [],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        startTransition(async () => {
            try {
                const result = await upsertPostmortem(incidentId, formData);
                if (result.success) {
                    router.refresh();
                } else {
                    setError('Failed to save postmortem');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to save postmortem');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                <FormField
                    label="Title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />

                <FormField
                    label="Executive Summary"
                    type="textarea"
                    rows={4}
                    value={formData.summary || ''}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    helperText="Brief overview of the incident and its impact"
                />

                <FormField
                    label="Root Cause Analysis"
                    type="textarea"
                    rows={6}
                    value={formData.rootCause || ''}
                    onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                    helperText="What was the underlying cause of this incident?"
                />

                <FormField
                    label="Resolution"
                    type="textarea"
                    rows={4}
                    value={formData.resolution || ''}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    helperText="How was the incident resolved?"
                />

                <FormField
                    label="Lessons Learned"
                    type="textarea"
                    rows={6}
                    value={formData.lessons || ''}
                    onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
                    helperText="What did we learn? How can we prevent this in the future?"
                />

                <FormField
                    label="Status"
                    type="select"
                    value={formData.status || 'DRAFT'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    options={[
                        { value: 'DRAFT', label: 'Draft' },
                        { value: 'PUBLISHED', label: 'Published' },
                        { value: 'ARCHIVED', label: 'Archived' },
                    ]}
                />

                {error && (
                    <div style={{ padding: 'var(--spacing-3)', background: 'var(--color-error-light)', borderRadius: 'var(--radius-md)', color: 'var(--color-error-dark)' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.back()}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isPending}
                    >
                        {initialData ? 'Update' : 'Create'} Postmortem
                    </Button>
                </div>
            </div>
        </form>
    );
}

