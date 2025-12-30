'use client';

import { useState } from 'react';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (res.ok) {
                setIsSent(true);
                setMessage(data.message);
            } else {
                setError(data.message || 'Something went wrong.');
            }
        } catch (_err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="login-shell" role="main">
            <div className="login-bg-animation">
                <div className="login-bg-orb login-bg-orb-1"></div>
                <div className="login-bg-orb login-bg-orb-2"></div>
                <div className="login-bg-orb login-bg-orb-3"></div>
            </div>

            <div className="login-card glass-panel" style={{
                maxWidth: '480px',
                margin: 'auto',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 'auto',
                gridTemplateColumns: 'none',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
                <section className="login-form" aria-label="Forgot Password form" style={{
                    width: '100%',
                    padding: '2.5rem 2rem',
                    background: 'transparent',
                    boxShadow: 'none'
                }}>
                    <div className="login-form-wrapper">
                        <div className="login-form-header" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div className="login-form-logo" style={{ marginBottom: '1rem' }}>
                                <img src="/logo.svg" alt="OpsSentinal" className="login-form-logo-img" />
                            </div>
                            <div className="login-form-branding">
                                <h2 className="login-title" style={{ fontSize: '1.5rem' }}>Reset Password</h2>
                                <p className="login-subtitle">
                                    Enter your email to receive instructions
                                </p>
                            </div>
                        </div>

                        {isSent ? (
                            <div className="login-alert success" role="alert" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-success)'
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 500 }}>
                                    Check your inbox
                                </div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {message}
                                </p>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <Link href="/login" className="login-btn login-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', width: 'auto', padding: '0.6rem 1.5rem' }}>
                                        Return to Sign In
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="login-form-fields" noValidate>
                                <div className="login-field">
                                    <label htmlFor="email">Email address</label>
                                    <div className="login-input-wrapper">
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="login-input"
                                            disabled={isSubmitting}
                                            style={{ background: 'rgba(255, 255, 255, 0.8)' }}
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
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <span>Send Instructions</span>
                                    )}
                                </button>

                                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <p style={{ marginBottom: '1rem' }}>
                                        If you don't receive an email or SMS,<br />
                                        please contact your administrator.
                                    </p>
                                    <Link href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                                        Back to Sign In
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
