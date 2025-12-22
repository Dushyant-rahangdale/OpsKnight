'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/app/(app)/settings/actions';

type Props = {
    name: string;
    email: string | null;
    role: string;
    memberSince: string;
};

type State = {
    error?: string | null;
    success?: boolean;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button className="glass-button primary settings-submit" type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Changes'}
        </button>
    );
}

export default function ProfileForm({ name, email, role, memberSince }: Props) {
    const [state, formAction] = useActionState<State, FormData>(updateProfile, { error: null, success: false });
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    // Refresh the page after successful update to show the new name everywhere
    useEffect(() => {
        if (state?.success) {
            // Small delay to show success message, then refresh to update all components
            // The JWT callback will fetch the latest name from DB on next request
            const timer = setTimeout(() => {
                router.refresh();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [state?.success, router]);

    return (
        <form ref={formRef} action={formAction} className="settings-panel-modern">
            <div className="settings-panel-header">
                <h3>Profile Information</h3>
                <p>Update your display name and view account details</p>
            </div>

            <div className="settings-form">
                <div className="settings-field">
                    <label>Display Name</label>
                    <input 
                        key={name} // Force re-render when name changes
                        name="name" 
                        defaultValue={name} 
                        placeholder="Enter your display name"
                        required
                    />
                    <p className="settings-field-hint">This is how your name appears to other team members</p>
                </div>
                
                <div className="settings-field">
                    <label>Email Address</label>
                    <input 
                        value={email ?? 'Not available'} 
                        readOnly 
                        style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                    <p className="settings-field-hint">Email is managed by your identity provider</p>
                </div>
                
                <div className="settings-field">
                    <label>Role</label>
                    <input 
                        value={role} 
                        readOnly 
                        style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                    <p className="settings-field-hint">Your workspace role determines your permissions</p>
                </div>
                
                <div className="settings-field">
                    <label>Member Since</label>
                    <input 
                        value={memberSince} 
                        readOnly 
                        style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                    <p className="settings-field-hint">Date you joined this workspace</p>
                </div>
            </div>
            
            <SubmitButton />
            
            {state?.error && (
                <div className="settings-error-banner">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" fill="#dc2626"/>
                        <path d="M10 6V10M10 14H10.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>{state.error}</span>
                </div>
            )}
            
            {state?.success && (
                <div className="settings-success-banner">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" fill="#22c55e"/>
                        <path d="M7 10L9 12L13 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Profile updated successfully</span>
                </div>
            )}
        </form>
    );
}
