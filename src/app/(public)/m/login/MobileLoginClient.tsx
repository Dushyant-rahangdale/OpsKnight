'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import SsoButton from '@/components/auth/SsoButton';
import Spinner from '@/components/ui/Spinner';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  X,
  CheckCircle2,
  Check,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculatePasswordStrength } from '@/lib/password-strength';

type Props = {
  callbackUrl: string;
  ssoEnabled: boolean;
  ssoProviderType?: string | null;
  ssoProviderLabel?: string | null;
  errorCode?: string | null;
  ssoError?: string | null;
  passwordSet?: boolean;
};

function formatError(message: string | null | undefined) {
  if (!message) return '';
  if (message === 'CredentialsSignin') return 'Invalid email or password';
  if (message === 'AccessDenied') return 'Access denied';
  if (message === 'Configuration') return 'Server configuration error';
  return 'Authentication failed';
}

export default function MobileLoginClient({
  callbackUrl,
  errorCode,
  passwordSet,
  ssoError,
  ssoEnabled,
  ssoProviderType,
  ssoProviderLabel,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSSOLoading, setIsSSOLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Password strength
  const passwordStrength = calculatePasswordStrength(password);

  const notices: Array<{
    id: string;
    tone: 'success' | 'warning';
    title: string;
    message: string;
  }> = [];

  if (passwordSet) {
    notices.push({
      id: 'password-set',
      tone: 'success',
      title: 'Password updated',
      message: 'Sign in with your new credentials.',
    });
  }

  if (ssoError) {
    notices.push({
      id: 'sso-error',
      tone: 'warning',
      title: 'SSO unavailable',
      message: ssoError,
    });
  }

  useEffect(() => {
    if (errorCode) setError(formatError(errorCode));
  }, [errorCode]);

  useEffect(() => {
    setIsValid(Boolean(email) && Boolean(password));
  }, [email, password]);

  let safeCallbackUrl = callbackUrl;
  // Ensure we redirect to mobile dashboard /m unless specific deep link
  if (
    !safeCallbackUrl ||
    safeCallbackUrl === '/' ||
    safeCallbackUrl.includes('/login') ||
    safeCallbackUrl.includes('/auth') || // Catches /auth/signout
    !safeCallbackUrl.startsWith('/m')
  ) {
    safeCallbackUrl = '/m';
  }

  const handleSSO = async () => {
    setIsSSOLoading(true);
    setError('');
    try {
      let finalCallbackUrl = callbackUrl;
      if (
        !finalCallbackUrl ||
        finalCallbackUrl === '/' ||
        finalCallbackUrl.includes('/login') ||
        finalCallbackUrl.includes('/auth/signout')
      ) {
        finalCallbackUrl = '/m';
      }
      await signIn('oidc', { callbackUrl: finalCallbackUrl });
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
        rememberMe: String(rememberMe),
        callbackUrl: safeCallbackUrl,
      });

      if (result?.error) {
        setError(formatError(result.error));
        setIsSubmitting(false);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      } else if (result?.ok) {
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
          // Force use of sanitized URL to prevent 404s from bad callbacks
          window.location.href = safeCallbackUrl;
        }, 800);
      }
    } catch {
      setError('Unexpected error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center pt-12 pb-8">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="OpsKnight" className="h-10 w-10" />
          <span className="text-xl font-bold tracking-tight">OpsKnight</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 pb-8">
        <div className="w-full max-w-sm mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-display">
              {isSuccess ? 'Access Granted' : 'Secure Mobile Login'}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {isSuccess
                ? 'Redirecting to your mobile command center.'
                : 'Verify your identity to reach OpsKnight Mobile.'}
            </p>
          </div>

          {/* Notices */}
          {notices.length > 0 && (
            <div className="mb-6 space-y-3">
              {notices.map(notice => {
                const isSuccessTone = notice.tone === 'success';
                const Icon = isSuccessTone ? Sparkles : AlertTriangle;
                return (
                  <div
                    key={notice.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 text-sm',
                      isSuccessTone
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 mt-0.5 shrink-0',
                        isSuccessTone ? 'text-emerald-400' : 'text-amber-400'
                      )}
                    />
                    <div>
                      <p className="font-medium">{notice.title}</p>
                      <p className="text-white/60 text-xs mt-0.5">{notice.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className={cn(
                'mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm flex items-start gap-3',
                isShaking && 'animate-shake'
              )}
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <p className="flex-1 text-red-200">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* SSO Button */}
          {ssoEnabled && (
            <div className="mb-6">
              <SsoButton
                providerType={ssoProviderType as 'google' | 'okta' | 'azure' | 'auth0' | 'custom'}
                providerLabel={ssoProviderLabel}
                onClick={handleSSO}
                loading={isSSOLoading}
                disabled={isSubmitting || isSuccess}
              />
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0a0a0a] px-4 text-white/40">or</span>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleCredentials} className="space-y-5">
            {/* Email Field */}
            {/* Email Field */}
            <div className="group space-y-2">
              <label
                className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                  emailTouched && email && !isEmailValid
                    ? 'text-rose-400'
                    : 'text-white/60 group-focus-within:text-white/80'
                }`}
              >
                Identification
              </label>
              <div className="relative group/input">
                <div className="absolute inset-0 bg-white/5 rounded-xl transition duration-300 group-hover/input:bg-white/10" />
                <div className="absolute inset-[1px] bg-[#0a0a0a] rounded-[11px]" />

                <div className="relative flex items-center pr-3 group-focus-within:border-white/30 group-focus-within:bg-white/5 rounded-xl border border-white/10 transition-colors duration-300">
                  <div className="flex items-center justify-center pl-4 pr-3 py-3.5 border-r border-white/10">
                    <Mail className="h-5 w-5 text-white/40 transition-colors group-focus-within/input:text-white/70" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    onBlur={() => setEmailTouched(true)}
                    className="w-full bg-transparent px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-colors"
                    placeholder="you@opsknight.com"
                    disabled={isSubmitting || isSuccess}
                  />
                  {emailTouched && email && !isEmailValid && (
                    <div className="absolute right-3 text-rose-400 animate-in fade-in zoom-in duration-200">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
              {emailTouched && email && !isEmailValid && (
                <p className="text-[10px] text-rose-400 font-medium pl-1 animate-in slide-in-from-top-1">
                  Please enter a valid email address
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="group space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white/60 transition-colors duration-300 group-focus-within:text-white/80">
                  Access Key
                </label>
                <Link
                  href="/m/forgot-password"
                  className="text-xs font-medium text-emerald-500/80 hover:text-emerald-400 transition-colors focus:outline-none focus:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative group/input">
                <div className="absolute inset-0 bg-white/5 rounded-xl transition duration-300 group-hover/input:bg-white/10" />
                <div className="absolute inset-[1px] bg-[#0a0a0a] rounded-[11px]" />

                <div className="relative flex items-center pr-3 group-focus-within:border-white/30 group-focus-within:bg-white/5 rounded-xl border border-white/10 transition-all duration-300">
                  <div className="flex items-center justify-center pl-4 pr-3 py-3.5 border-r border-white/10">
                    <Lock className="h-5 w-5 text-white/40 transition-colors group-focus-within/input:text-white/70" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    onKeyDown={e => {
                      if (e.getModifierState('CapsLock')) {
                        setCapsLockOn(true);
                      } else {
                        setCapsLockOn(false);
                      }
                    }}
                    className="w-full bg-transparent px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-colors"
                    placeholder="••••••••"
                    disabled={isSubmitting || isSuccess}
                  />
                  <div className="flex items-center border-l border-white/10 pl-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-white/30 hover:text-white/80 transition-colors focus:outline-none p-1 rounded-md"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {password && !isSuccess && (
                <div className="space-y-1 pt-1 duration-200 animate-in fade-in slide-in-from-top-1">
                  <div className="flex gap-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        className={cn(
                          'h-full flex-1 transition-all duration-500',
                          level <= (passwordStrength.score + 1) * 1.25
                            ? passwordStrength.color
                            : 'bg-transparent'
                        )}
                      />
                    ))}
                  </div>
                  <p
                    className={cn('text-[10px] font-medium text-right', passwordStrength.textColor)}
                  >
                    Strength: {passwordStrength.label}
                  </p>
                </div>
              )}

              {capsLockOn && (
                <div className="flex items-center gap-2 text-amber-400 text-xs animate-pulse font-medium pl-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Caps Lock is ON</span>
                </div>
              )}
            </div>

            {/* Remember Me */}
            <div
              className="flex items-center group cursor-pointer"
              onClick={() => !isSubmitting && !isSuccess && setRememberMe(!rememberMe)}
            >
              <div
                className={cn(
                  'h-5 w-5 rounded-md border flex items-center justify-center transition-all duration-200',
                  rememberMe
                    ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 border-white/20 group-hover:border-white/40 group-hover:bg-white/10'
                )}
              >
                {rememberMe && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
              </div>
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                disabled={isSubmitting || isSuccess}
                className="sr-only"
              />
              <label className="ml-3 text-sm text-white/60 group-hover:text-white transition-colors cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isSSOLoading || !isValid || isSuccess}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200',
                isSuccess
                  ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20'
              )}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Success</span>
                </>
              ) : isSubmitting ? (
                <>
                  <Spinner size="sm" variant="black" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-white/40">Protected by OpsKnight</p>
        </div>
      </main>
    </div>
  );
}
