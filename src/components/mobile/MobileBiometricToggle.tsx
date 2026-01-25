'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/shadcn/switch';
import { Fingerprint } from 'lucide-react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const BIOMETRIC_ENABLED_KEY = 'opsknight-biometric-enabled';

export default function MobileBiometricToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check support
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      (
        window.PublicKeyCredential as unknown as {
          isUserVerifyingPlatformAuthenticatorAvailable: () => Promise<boolean>;
        }
      ).isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
        setIsSupported(available);
        if (available) {
          const stored = window.localStorage.getItem(BIOMETRIC_ENABLED_KEY);
          setIsEnabled(stored === 'true');
        }
      });
    }
  }, []);

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      // Verify user can actually auth before enabling
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'OpsKnight Mobile' },
            user: {
              id: new Uint8Array(16),
              name: 'mobile-user',
              displayName: 'Mobile User',
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
            attestation: 'none',
          },
        });

        // Success
        window.localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        setIsEnabled(true);
      } catch (error) {
        logger.warn('mobile.biometric.enable_failed', { error });
        // Don't enable if they cancelled or failed
      }
    } else {
      window.localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-2xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
          <Fingerprint className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[color:var(--text-primary)]">App Lock</div>
          <div className="text-xs text-[color:var(--text-secondary)]">Require FaceID to open</div>
        </div>
      </div>
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        className={cn(
          'data-[state=checked]:bg-purple-600',
          'data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700'
        )}
      />
    </div>
  );
}
