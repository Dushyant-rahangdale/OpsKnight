'use client';

import { useActionState } from 'react';
import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';
import TimeZoneSelect from './TimeZoneSelect';

type ScheduleCreateFormProps = {
    action: (prevState: any, formData: FormData) => Promise<{ error?: string } | { success?: boolean }>; // eslint-disable-line @typescript-eslint/no-explicit-any
    canCreate: boolean;
};

type FormState = {
    error?: string | null;
    success?: boolean;
};

export default function ScheduleCreateForm({ action, canCreate }: ScheduleCreateFormProps) {
    const [state, formAction] = useActionState<FormState, FormData>(action, { error: null, success: false });
    const formRef = useRef<HTMLFormElement | null>(null);
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        if (state.success) {
            showToast('Schedule created successfully', 'success');
            formRef.current?.reset();
            router.refresh();
        } else if (state.error) {
            showToast(state.error, 'error');
        }
    }, [state, router, showToast]);

    if (!canCreate) {
        return (
            <div className="glass-panel" style={{ 
                padding: '1.5rem', 
                background: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                opacity: 0.7 
            }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    New Schedule
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    ⚠️ You don't have access to create schedules. Admin or Responder role required.
                </p>
                <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
                    <form className="schedule-form">
                        <label className="schedule-field">
                            Name
                            <input name="name" placeholder="Primary on-call" disabled />
                        </label>
                        <label className="schedule-field">
                            Time zone
                            <TimeZoneSelect name="timeZone" defaultValue="UTC" disabled />
                        </label>
                        <button className="glass-button primary schedule-submit" disabled>
                            Create schedule
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div id="new-schedule" className="glass-panel" style={{ 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px'
        }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                New Schedule
            </h3>
            <form ref={formRef} action={formAction} style={{ display: 'grid', gap: '1rem' }}>
                <div>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '0.4rem', 
                        fontSize: '0.85rem', 
                        fontWeight: '500',
                        color: 'var(--text-primary)'
                    }}>
                        Name
                    </label>
                    <input 
                        name="name" 
                        placeholder="Primary on-call" 
                        required
                        style={{
                            width: '100%',
                            padding: '0.6rem 0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            background: 'white'
                        }}
                    />
                </div>
                <div>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '0.4rem', 
                        fontSize: '0.85rem', 
                        fontWeight: '500',
                        color: 'var(--text-primary)'
                    }}>
                        Time Zone
                    </label>
                    <TimeZoneSelect name="timeZone" defaultValue="UTC" />
                </div>
                <button 
                    type="submit" 
                    className="glass-button primary"
                    style={{ width: '100%' }}
                >
                    Create Schedule
                </button>
            </form>
        </div>
    );
}




