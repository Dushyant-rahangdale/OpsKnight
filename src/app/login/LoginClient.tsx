'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import SsoButton from '@/components/auth/SsoButton';
import LoginAnimation from '@/components/auth/LoginAnimation';

type Props = {
  callbackUrl: string;
  errorCode?: string | null;
  passwordSet?: boolean;
  ssoError?: string | null;
  ssoEnabled: boolean;
  ssoProviderType?: string | null;
  ssoProviderLabel?: string | null;
};

function formatError(message: string | null | undefined) {
  if (!message) return '';
  if (message === 'CredentialsSignin') return 'Invalid credentials';
  if (message === 'AccessDenied') return 'Access denied';
  return 'Authentication failed';
}

export default function LoginClient({
  callbackUrl,
  errorCode,
  passwordSet,
  ssoError,
  ssoEnabled,
  ssoProviderType,
  ssoProviderLabel,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSSOLoading, setIsSSOLoading] = useState(false);

  useEffect(() => {
    if (errorCode) setError(formatError(errorCode));
  }, [errorCode]);

  useEffect(() => {
    setIsValid(Boolean(email) && Boolean(password));
  }, [email, password]);

  const handleSSO = async () => {
    setIsSSOLoading(true);
    try {
      await signIn('oidc', { callbackUrl });
    } catch {
      setError('Connection failed');
      setIsSSOLoading(false);
    }
  };

  const handleCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password,
        rememberMe: String(rememberMe), // Pass as string since credentials are strings
        callbackUrl,
      });

      if (result?.error) {
        setError(formatError(result.error));
        setIsSubmitting(false);
      } else if (result?.ok) {
        router.push(result?.url || callbackUrl);
      }
    } catch {
      setError('Unexpected error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-background text-primary-foreground font-sans selection:bg-primary/20">
      {/* Dynamic Background - Command Center Theme Match */}
      {/* Base Layer: Primary Color (Deep Blue in Light Mode, White/Dark in Dark Mode) */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />

      {/* Texture: Subtle Grid (Light on Dark, Dark on Light) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />

      {/* Radial Glows for Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.1),transparent_25%),radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.05),transparent_25%)] mix-blend-overlay" />

      {/* Content Container - Ultra Wide for Big Screens */}
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1920px] flex-col px-6 py-6 sm:px-12 lg:px-16 xl:px-24">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 py-4 border-b border-white/10 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 shadow-inner">
              <img src="/logo.svg" alt="OpsSentinal" className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white">OpsSentinal</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></span>
            System Operational
          </div>
        </header>

        <main className="mt-8 grid flex-1 items-center gap-20 lg:grid-cols-2 lg:gap-32 xl:gap-48">
          {/* Left Side: Animated Hero */}
          <section className="hidden lg:flex h-full w-full items-center justify-center min-h-[500px]">
            <LoginAnimation />
          </section>

          {/* Right Side: Login Card (Theme Based) */}
          <section className="flex justify-center w-full lg:justify-end">
            <div className="relative w-full max-w-[480px]">
              {/* Backlight */}
              <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-b from-primary/10 to-transparent blur-3xl opacity-20" />

              <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-10 shadow-2xl backdrop-blur-2xl">
                <div className="mb-10">
                  <h2 className="text-3xl font-semibold text-card-foreground tracking-tight">
                    Access Console
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Authenticate securely to enter the workspace.
                  </p>
                </div>

                {passwordSet && (
                  <div className="mb-8 rounded bg-primary/5 border-l-2 border-primary px-4 py-3 text-sm text-foreground">
                    Password updated successfully.
                  </div>
                )}

                {/* Error & Alerts */}
                {(error || ssoError) && (
                  <div className="mb-8 rounded bg-destructive/10 border-l-2 border-destructive px-4 py-3 text-sm text-destructive-foreground">
                    {error || ssoError}
                  </div>
                )}

                {ssoEnabled && (
                  <div className="space-y-6 mb-8">
                    <SsoButton
                      providerType={ssoProviderType as any}
                      providerLabel={ssoProviderLabel}
                      onClick={handleSSO}
                      loading={isSSOLoading}
                      disabled={isSubmitting || isSSOLoading}
                    />
                    <div className="relative flex items-center gap-4">
                      <div className="flex-1 border-t border-border" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Or
                      </span>
                      <div className="flex-1 border-t border-border" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleCredentials} className="space-y-6" noValidate>
                  <div className="group space-y-2">
                    <label
                      htmlFor="email-input"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-foreground transition-colors"
                    >
                      Email
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      className="w-full rounded-none border-b border-border bg-transparent px-4 py-3 text-base text-foreground placeholder-muted-foreground outline-none transition-all focus:border-foreground focus:bg-foreground/5 hover:bg-foreground/[0.02]"
                      placeholder="user@org.com"
                      required
                      disabled={isSubmitting || isSSOLoading}
                    />
                  </div>

                  <div className="group space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label
                        htmlFor="password-input"
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-focus-within:text-foreground transition-colors"
                      >
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-muted-foreground hover:text-foreground transition"
                      >
                        Reset?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        className="w-full rounded-none border-b border-border bg-transparent px-4 py-3 pr-12 text-base text-foreground placeholder-muted-foreground outline-none transition-all focus:border-foreground focus:bg-foreground/5 hover:bg-foreground/[0.02]"
                        placeholder="••••••••"
                        required
                        disabled={isSubmitting || isSSOLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground transition"
                      >
                        {showPassword ? (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/20 focus:ring-offset-0"
                    />
                    <label
                      htmlFor="remember-me"
                      className="text-sm text-muted-foreground select-none cursor-pointer hover:text-foreground transition"
                    >
                      Keep me signed in
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isSSOLoading || !isValid}
                    className="relative w-full overflow-hidden rounded-lg bg-foreground px-4 py-4 text-sm font-bold text-background shadow-lg transition-transform hover:scale-[1.01] hover:bg-foreground/90 focus:outline-none focus:ring-4 focus:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" variant="default" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>

                  <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest text-muted-foreground mt-8">
                    <span>Secure Connection</span>
                    <span>•</span>
                    <span>Enforced Audit</span>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
