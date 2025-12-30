'use client';

import { useState } from 'react';
import Spinner from '@/components/ui/Spinner';

type Props = {
    userId: string;
    userName: string;
    className?: string;
};

export default function GenerateResetLinkButton({ userId, userName, className }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [resetLink, setResetLink] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!confirm(`Generate a password reset link for ${userName}? This will invalidate any existing tokens.`)) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setResetLink(null);

        try {
            const res = await fetch('/api/admin/generate-reset-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();

            if (res.ok && data.link) {
                setResetLink(data.link);
            } else {
                setError(data.error || 'Failed to generate link');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (resetLink) {
            navigator.clipboard.writeText(resetLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (resetLink) {
        return (
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                    onClick={copyToClipboard}
                    className="glass-button"
                    style={{
                        padding: '0.35rem 0.7rem',
                        fontSize: '0.7rem',
                        background: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                    }}
                    title="Click to copy reset link"
                >
                    {copied ? 'Copied!' : 'Copy Link'}
                    <span onClick={(e) => {
                        e.stopPropagation();
                        setResetLink(null);
                    }} style={{ marginLeft: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>×</span>
                </button>
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={handleGenerate}
                className={`glass-button ${className || ''}`}
                style={{
                    padding: '0.35rem 0.7rem',
                    fontSize: '0.7rem',
                    background: '#f0fdf4', // Light green hint
                    color: '#15803d',
                    border: '1px solid #dcfce7'
                }}
                disabled={isLoading}
                title="Generate Password Reset Link (Manual Fallback)"
            >
                {isLoading ? '...' : 'Reset Pwd'}
            </button>
            {error && (
                <span style={{ fontSize: '0.7rem', color: '#dc2626', marginLeft: '0.5rem' }} title={error}>!</span>
            )}
        </>
    );
}
