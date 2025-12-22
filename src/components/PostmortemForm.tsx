'use client';

import { useState, useTransition } from 'react';
import { upsertPostmortem, type PostmortemData } from '@/app/(app)/postmortems/actions';
import { Button, Card, FormField } from '@/components/ui';
import { useRouter } from 'next/navigation';
import PostmortemTimelineBuilder, { type TimelineEvent } from './postmortem/PostmortemTimelineBuilder';
import PostmortemImpactInput, { type ImpactMetrics } from './postmortem/PostmortemImpactInput';
import PostmortemActionItems, { type ActionItem } from './postmortem/PostmortemActionItems';

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
    users?: Array<{ id: string; name: string; email: string }>;
};

export default function PostmortemForm({ incidentId, initialData, users = [] }: PostmortemFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Parse initial data with proper types
    const parseTimeline = (timeline: any): TimelineEvent[] => {
        if (!timeline || !Array.isArray(timeline)) return [];
        return timeline.map((e: any) => ({
            id: e.id || `event-${Date.now()}-${Math.random()}`,
            timestamp: e.timestamp || new Date().toISOString(),
            type: e.type || 'DETECTION',
            title: e.title || '',
            description: e.description || '',
            actor: e.actor,
        }));
    };

    const parseImpact = (impact: any): ImpactMetrics => {
        if (!impact || typeof impact !== 'object') return {};
        return {
            usersAffected: impact.usersAffected,
            downtimeMinutes: impact.downtimeMinutes,
            errorRate: impact.errorRate,
            servicesAffected: Array.isArray(impact.servicesAffected) ? impact.servicesAffected : [],
            slaBreaches: impact.slaBreaches,
            revenueImpact: impact.revenueImpact,
            apiErrors: impact.apiErrors,
            performanceDegradation: impact.performanceDegradation,
        };
    };

    const parseActionItems = (actionItems: any): ActionItem[] => {
        if (!actionItems || !Array.isArray(actionItems)) return [];
        return actionItems.map((item: any) => ({
            id: item.id || `action-${Date.now()}-${Math.random()}`,
            title: item.title || '',
            description: item.description || '',
            owner: item.owner,
            dueDate: item.dueDate,
            status: item.status || 'OPEN',
            priority: item.priority || 'MEDIUM',
        }));
    };

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

    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(parseTimeline(initialData?.timeline));
    const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics>(parseImpact(initialData?.impact));
    const [actionItems, setActionItems] = useState<ActionItem[]>(parseActionItems(initialData?.actionItems));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        // Combine all data before submitting
        const submitData: PostmortemData = {
            ...formData,
            timeline: timelineEvents,
            impact: impactMetrics,
            actionItems: actionItems,
        };

        startTransition(async () => {
            try {
                const result = await upsertPostmortem(incidentId, submitData);
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

