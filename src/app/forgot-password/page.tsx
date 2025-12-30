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

            // As a security measure, we treat all responses as success in UI if 200, but API also always returns success msg on 200.
            if (res.ok) {
                setIsSent(true);
                setMessage(data.message);
            } else {
                setError(data.message || 'Something went wrong.');
            }
        } catch (err) {
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

            <div className="login-card" style={{
                maxWidth: '480px',
                margin: 'auto',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 'auto',
                gridTemplateColumns: 'none' // Override grid
            }}>
                <section className="login-form" aria-label="Forgot Password form" style={{ width: '100%', padding: '0 2rem' }}>
                    <div className="login-form-wrapper">
                        <div className="login-form-header">
                            <div className="login-form-logo">
                                <img src="/logo.svg" alt="OpsSentinal" className="login-form-logo-img" />
                            </div>
                            <div className="login-form-branding">
                                <h2 className="login-title">Reset Password</h2>
                                <p className="login-subtitle">
                                    Enter your email to receive reset instructions
                                </p>
                            </div>
                        </div>

                        {isSent ? (
                            <div className="login-alert success" role="alert">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{message}</span>
                                <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                                    <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
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

                                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                    <Link href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
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
