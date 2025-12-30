'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import _Link from 'next/link';
import Spinner from '@/components/ui/Spinner';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="login-alert error">
                Invalid or missing reset token. Please request a new link.
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to reset password');
            } else {
                setSuccess(true);
                // Redirect after success
                setTimeout(() => {
                    router.push('/login?password=1');
                }, 2000);
            }
        } catch (_err) {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="login-alert success" role="alert">
                <span>Password reset successfully! Redirecting to login...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="login-form-fields" noValidate>
            <div className="login-field">
                <label htmlFor="password">New Password</label>
                <div className="login-input-wrapper">
                    <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New password"
                        className="login-input"
                        disabled={isSubmitting}
                        autoComplete="new-password"
                    />
                </div>
            </div>

            <div className="login-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="login-input-wrapper">
                    <input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="login-input"
                        disabled={isSubmitting}
                        autoComplete="new-password"
                    />
                </div>
            </div>

            {error && (
                <div className="login-alert error" role="alert">
                    <span>{error}</span>
                </div>
            )}

            <button
                type="submit"
                className="login-btn login-btn-primary"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Spinner size="sm" variant="white" />
                        <span>Updating...</span>
                    </>
                ) : (
                    <span>Set New Password</span>
                )}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="login-shell" role="main">
            <div className="login-bg-animation">
                <div className="login-bg-orb login-bg-orb-1"></div>
                <div className="login-bg-orb login-bg-orb-2"></div>
                <div className="login-bg-orb login-bg-orb-3"></div>
            </div>

            <div className="login-card" style={{
                maxWidth: '480px',
                margin: 'auto',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 'auto',
                gridTemplateColumns: 'none' // Override grid
            }}>
                <section className="login-form" aria-label="Reset Password form" style={{ width: '100%', padding: '0 2rem' }}>
                    <div className="login-form-wrapper">
                        <div className="login-form-header">
                            <div className="login-form-logo">
                                <img src="/logo.svg" alt="OpsSentinal" className="login-form-logo-img" />
                            </div>
                            <div className="login-form-branding">
                                <h2 className="login-title">Create New Password</h2>
                                <p className="login-subtitle">
                                    Secure your account with a strong password
                                </p>
                            </div>
                        </div>

                        <Suspense fallback={<Spinner />}>
                            <ResetPasswordForm />
                        </Suspense>
                    </div>
                </section>
            </div>
        </main>
    );
}
