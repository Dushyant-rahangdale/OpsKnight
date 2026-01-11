'use client';

import { useMemo } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
  minLength?: number;
}

interface StrengthResult {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  color: string;
  bgColor: string;
  percentage: number;
}

interface Requirement {
  label: string;
  met: boolean;
}

function calculateStrength(password: string, minLength: number): StrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'weak',
      color: 'text-slate-400',
      bgColor: 'bg-slate-200',
      percentage: 0,
    };
  }

  let score = 0;

  // Length scoring
  if (password.length >= minLength) score += 1;
  if (password.length >= minLength + 2) score += 1;
  if (password.length >= minLength + 5) score += 1;

  // Character diversity
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Patterns (negative scoring)
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
  if (/^[a-z]+$/.test(password)) score -= 1; // Only lowercase
  if (/^[0-9]+$/.test(password)) score -= 1; // Only numbers

  // Normalize score 0-10
  score = Math.max(0, Math.min(10, score));

  if (score <= 2) {
    return {
      score,
      label: 'weak',
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      percentage: 20,
    };
  }
  if (score <= 4) {
    return {
      score,
      label: 'fair',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      percentage: 40,
    };
  }
  if (score <= 6) {
    return {
      score,
      label: 'good',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      percentage: 60,
    };
  }
  if (score <= 8) {
    return {
      score,
      label: 'strong',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500',
      percentage: 80,
    };
  }
  return {
    score,
    label: 'very-strong',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-600',
    percentage: 100,
  };
}

function getRequirements(password: string, minLength: number): Requirement[] {
  return [
    {
      label: `At least ${minLength} characters`,
      met: password.length >= minLength,
    },
    {
      label: 'Contains uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Contains lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      label: 'Contains number',
      met: /[0-9]/.test(password),
    },
    {
      label: 'Contains special character',
      met: /[^a-zA-Z0-9]/.test(password),
    },
  ];
}

export default function PasswordStrengthMeter({
  password,
  showRequirements = true,
  minLength = 10,
}: PasswordStrengthMeterProps) {
  const strength = useMemo(() => calculateStrength(password, minLength), [password, minLength]);
  const requirements = useMemo(() => getRequirements(password, minLength), [password, minLength]);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">Password strength</span>
          <span className={`font-semibold capitalize ${strength.color}`}>
            {strength.label.replace('-', ' ')}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full transition-all duration-300 ${strength.bgColor}`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1 pt-1">
          {requirements.map((req, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 text-xs transition-colors ${
                req.met ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {req.met ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Utility function to check if password meets minimum requirements
 */
export function isPasswordStrong(password: string, minLength: number = 10): boolean {
  if (password.length < minLength) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Utility function to get password validation error
 */
export function getPasswordError(password: string, minLength: number = 10): string | null {
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain a lowercase letter';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain an uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain a number';
  }
  return null;
}
