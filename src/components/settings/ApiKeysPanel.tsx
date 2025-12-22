'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createApiKey, revokeApiKey } from '@/app/(app)/settings/actions';
import CopyButton from './CopyButton';
import ConfirmDialog from './ConfirmDialog';

type ApiKey = {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    createdAt: string;
    lastUsedAt?: string | null;
    revokedAt?: string | null;
};

type State = {
    error?: string | null;
    success?: boolean;
    token?: string | null;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button className="glass-button primary" type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create API Key'}
        </button>
    );
}

export default function ApiKeysPanel({ keys }: { keys: ApiKey[] }) {
    const [state, formAction] = useActionState<State, FormData>(createApiKey, { error: null, success: false, token: null });
    const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);

    const handleRevoke = async (keyId: string) => {
        const formData = new FormData();
        formData.append('keyId', keyId);
        await revokeApiKey(formData);
        setRevokeKeyId(null);
        window.location.reload();
    };

    return (
        <>
            <div className="settings-panel-modern">
                <div className="settings-panel-header">
                    <h3>Create New API Key</h3>
                    <p>Generate a new API key for automation and integrations</p>
                </div>
                
                <form action={formAction} className="settings-form">
                    <div className="settings-field">
                        <label>Key Name</label>
                        <input 
                            name="name" 
                            placeholder="e.g., Production Automation" 
                            required 
                        />
                        <p className="settings-field-hint">A descriptive name to identify this key</p>
                    </div>
                    
                    <div className="settings-field">
                        <label>Permissions</label>
                        <div className="settings-scopes-grid">
                            <label className="settings-scope-item">
                                <input type="checkbox" name="scopes" value="events:write" defaultChecked />
                                <span>
                                    <strong>Events Write</strong>
                                    <small>Create and update events</small>
                                </span>
                            </label>
                            <label className="settings-scope-item">
                                <input type="checkbox" name="scopes" value="incidents:read" />
                                <span>
                                    <strong>Incidents Read</strong>
                                    <small>View incident data</small>
                                </span>
                            </label>
                            <label className="settings-scope-item">
                                <input type="checkbox" name="scopes" value="incidents:write" />
                                <span>
                                    <strong>Incidents Write</strong>
                                    <small>Create and update incidents</small>
                                </span>
                            </label>
                            <label className="settings-scope-item">
                                <input type="checkbox" name="scopes" value="services:read" />
                                <span>
                                    <strong>Services Read</strong>
                                    <small>View service information</small>
                                </span>
                            </label>
                            <label className="settings-scope-item">
                                <input type="checkbox" name="scopes" value="schedules:read" />
                                <span>
                                    <strong>Schedules Read</strong>
                                    <small>View on-call schedules</small>
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <SubmitButton />
                </form>

                {state?.token && (
                    <div className="settings-success-banner">
                        <div className="settings-success-header">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" fill="#22c55e"/>
                                <path d="M7 10L9 12L13 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <strong>API Key Created</strong>
                        </div>
                        <p>Copy this key now. You won't be able to see it again.</p>
                        <div className="api-key-display">
                            <code>{state.token}</code>
                            <CopyButton text={state.token} />
                        </div>
                    </div>
                )}

                {state?.error && (
                    <div className="settings-error-banner">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" fill="#dc2626"/>
                            <path d="M10 6V10M10 14H10.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span>{state.error}</span>
                    </div>
                )}
            </div>

            {keys.length === 0 ? (
                <div className="settings-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor" fillOpacity="0.1"/>
                        <path d="M12 14C7.58172 14 4 16.2386 4 19V22H20V19C20 16.2386 16.4183 14 12 14Z" fill="currentColor" fillOpacity="0.1"/>
                    </svg>
                    <h3>No API Keys</h3>
                    <p>Create your first API key to get started with automation</p>
                </div>
            ) : (
                <div className="settings-panel-modern">
                    <div className="settings-panel-header">
                        <h3>Active API Keys</h3>
                        <p>{keys.length} {keys.length === 1 ? 'key' : 'keys'} configured</p>
                    </div>
                    
                    <div className="api-keys-list">
                        {keys.map((key) => (
                            <div key={key.id} className={`api-key-item ${key.revokedAt ? 'revoked' : ''}`}>
                                <div className="api-key-info">
                                    <div className="api-key-header">
                                        <h4>{key.name}</h4>
                                        {key.revokedAt ? (
                                            <span className="api-key-badge revoked">Revoked</span>
                                        ) : (
                                            <span className="api-key-badge active">Active</span>
                                        )}
                                    </div>
                                    <div className="api-key-details">
                                        <code>{key.prefix}••••••••</code>
                                        <span className="api-key-meta">
                                            Created {key.createdAt}
                                            {key.lastUsedAt && ` • Last used ${key.lastUsedAt}`}
                                        </span>
                                    </div>
                                    <div className="api-key-scopes">
                                        {key.scopes.length > 0 ? (
                                            key.scopes.map((scope) => (
                                                <span key={scope} className="api-key-scope">{scope}</span>
                                            ))
                                        ) : (
                                            <span className="api-key-scope empty">No scopes</span>
                                        )}
                                    </div>
                                </div>
                                {!key.revokedAt && (
                                    <button
                                        type="button"
                                        onClick={() => setRevokeKeyId(key.id)}
                                        className="api-key-revoke"
                                    >
                                        Revoke
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={revokeKeyId !== null}
                title="Revoke API Key"
                message="Are you sure you want to revoke this API key? This action cannot be undone and any applications using this key will stop working immediately."
                confirmLabel="Revoke Key"
                cancelLabel="Cancel"
                onConfirm={() => revokeKeyId && handleRevoke(revokeKeyId)}
                onCancel={() => setRevokeKeyId(null)}
                variant="danger"
            />
        </>
    );
}
