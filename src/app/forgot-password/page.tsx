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
        body: JSON.stringify({ email }),
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
    <div className="relative min-h-[100dvh] overflow-hidden bg-slate-950 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(148,163,184,0.18),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(100,116,139,0.16),transparent_30%),radial-gradient(circle_at_42%_78%,rgba(71,85,105,0.14),transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-15" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-950" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.6),rgba(15,23,42,0.25),rgba(15,23,42,0.6))] opacity-50 mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.45),transparent_58%)]" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col items-center justify-center px-5 py-6">
        {/* Header */}
        <header className="absolute top-6 left-5 right-5 flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-2.5 backdrop-blur-sm max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 shadow-lg shadow-black/20">
              <img src="/logo.svg" alt="OpsSentinal logo" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
                OpsSentinal
              </p>
              <p className="text-sm text-slate-200/80">Incident control surface</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse" />
            Systems steady
          </div>
        </header>

        {/* Main Card */}
        <div className="relative w-full max-w-[460px] overflow-hidden rounded-2xl border border-white/10 bg-white/95 text-slate-900 shadow-2xl shadow-slate-900/30">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900" />
          <div className="relative space-y-5 px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Account recovery
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">Reset Password</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Enter your email address and we&apos;ll send you instructions to reset your
                  password.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                <img src="/logo.svg" alt="OpsSentinal" className="h-6 w-6" />
              </div>
            </div>

            {isSent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <svg
                      className="h-6 w-6 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-emerald-800">Check your inbox</p>
                    <p className="mt-1 text-sm text-emerald-700">{message}</p>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-[1px] hover:bg-slate-800"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 shadow-inner shadow-slate-200 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                    placeholder="name@company.com"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 enabled:hover:-translate-y-[1px] enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition group-hover:animate-[shimmer_1.4s_ease_infinite]" />
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" variant="white" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Instructions</span>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.3}
                          d="M5 12h14M12 5l7 7-7 7"
                        />
                      </svg>
                    </>
                  )}
                </button>

                <div className="space-y-3 pt-2 text-center">
                  <p className="text-xs text-slate-400">
                    If you don&apos;t receive an email, please contact your administrator.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 transition hover:text-slate-900"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}

            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <span>Audit-ready by default</span>
              <span>Data stays in your cloud</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
