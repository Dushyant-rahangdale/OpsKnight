'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';

type LayerCreateFormProps = {
    scheduleId: string;
    canManageSchedules: boolean;
    createLayer: (scheduleId: string, formData: FormData) => Promise<{ error?: string } | undefined>;
    defaultStartDate: string;
};

function formatDateInput(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function LayerCreateForm({
    scheduleId,
    canManageSchedules,
    createLayer,
    defaultStartDate
}: LayerCreateFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await createLayer(scheduleId, formData);
            if (result?.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Layer created successfully', 'success');
                router.refresh();
            }
        });
    };

    if (!canManageSchedules) {
        return (
            <div className="glass-panel" style={{
                padding: '1.5rem',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                opacity: 0.7
            }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    Add Layer
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    ⚠️ You don't have access to create layers. Admin or Responder role required.
                </p>
                <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
                    <form style={{ display: 'grid', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500' }}>
                                Layer name
                            </label>
                            <input name="name" placeholder="Primary rotation" disabled style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500' }}>
                                Rotation length (hours)
                            </label>
                            <input name="rotationLengthHours" type="number" min="1" defaultValue="24" disabled style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500' }}>
                                    Start
                                </label>
                                <input type="datetime-local" name="start" defaultValue={defaultStartDate} disabled style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500' }}>
                                    End (optional)
                                </label>
                                <input type="datetime-local" name="end" disabled style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px' }} />
                            </div>
                        </div>
                        <button type="button" disabled className="glass-button primary" style={{ opacity: 0.5 }}>
                            Create layer
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            marginTop: '1.5rem'
        }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Add Layer
            </h4>
            <form action={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500' }}>
                        Layer name
                    </label>
                    <input
                        name="name"
                        placeholder="Primary rotation"
                        required
                        disabled={isPending}
                        style={{
                            width: '100%',
                            padding: '0.6rem',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            background: 'white'
                        }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500' }}>
                        Rotation length (hours)
                    </label>
                    <input
                        name="rotationLengthHours"
                        type="number"
                        min="1"
                        defaultValue="24"
                        required
                        disabled={isPending}
                        style={{
                            width: '100%',
                            padding: '0.6rem',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            background: 'white'
                        }}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500' }}>
                            Start
                        </label>
                        <input
                            type="datetime-local"
                            name="start"
                            defaultValue={defaultStartDate}
                            required
                            disabled={isPending}
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                background: 'white'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500' }}>
                            End (optional)
                        </label>
                        <input
                            type="datetime-local"
                            name="end"
                            disabled={isPending}
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                background: 'white'
                            }}
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="glass-button primary"
                    style={{ width: '100%' }}
                >
                    {isPending ? 'Creating...' : 'Create Layer'}
                </button>
            </form>
        </div>
    );
}

