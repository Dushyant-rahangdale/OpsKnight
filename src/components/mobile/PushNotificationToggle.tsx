'use client';

import { useState, useEffect } from 'react';
import MobileCard from '@/components/mobile/MobileCard';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, char => char.charCodeAt(0));
}

function normalizeVapidKey(rawKey: string) {
  const trimmed = rawKey.trim();
  if (!trimmed) {
    return { error: 'Push notifications not configured (missing VAPID key)' };
  }

  if (trimmed.includes('BEGIN PUBLIC KEY') || trimmed.includes('END PUBLIC KEY')) {
    return { error: 'Invalid VAPID public key. Use the base64url public key, not a PEM block.' };
  }

  let cleaned = trimmed.replace(/^['"]|['"]$/g, '').replace(/\s+/g, '');
  cleaned = cleaned.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

  if (!/^[A-Za-z0-9\-_]+$/.test(cleaned)) {
    return { error: 'Invalid VAPID public key format.' };
  }

  return { key: cleaned };
}

export default function PushNotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const serviceWorkerPath = '/sw-push.js';

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  async function ensureServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }
    const existing = await navigator.serviceWorker.getRegistration();
    const targetUrl = new URL(serviceWorkerPath, window.location.origin).toString();
    const existingUrl = existing?.active?.scriptURL;
    const shouldRegister = !existing || !existingUrl || existingUrl !== targetUrl;
    const registration = shouldRegister
      ? await navigator.serviceWorker.register(serviceWorkerPath, { scope: '/' })
      : existing;
    await navigator.serviceWorker.ready;
    return registration;
  }

  async function checkSubscription() {
    try {
      const registration = await ensureServiceWorker();
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error: unknown) {
      logger.error('Failed to check push subscription', {
        component: 'PushNotificationToggle',
        error,
      });
    }
  }

  async function subscribe() {
    setLoading(true);
    setError('');
    try {
      if (Notification.permission === 'denied') {
        throw new Error('Notifications blocked. Please enable in browser settings.');
      }

      // Race condition to prevent infinite hanging
      const registration = (await Promise.race([
        ensureServiceWorker(),
        new Promise<ServiceWorkerRegistration>((_, reject) =>
          setTimeout(
            () => reject(new Error('Service Worker taking too long. Try reloading.')),
            4000
          )
        ),
      ])) as ServiceWorkerRegistration;

      // Fetch VAPID Key from API (supports DB or Env)
      const keyRes = await fetch('/api/system/vapid-public-key');
      if (!keyRes.ok) throw new Error('VAPID Configuration missing. Please contact admin.');
      const { key: vapidKey } = await keyRes.json();
      const normalized = normalizeVapidKey(String(vapidKey || ''));
      if (normalized.error || !normalized.key) {
        throw new Error(normalized.error || 'Invalid VAPID public key');
      }

      let applicationServerKey: Uint8Array;
      try {
        applicationServerKey = urlBase64ToUint8Array(normalized.key);
      } catch {
        throw new Error('Invalid VAPID public key format. Generate a new VAPID key pair.');
      }
      if (applicationServerKey.length !== 65) {
        throw new Error('Invalid VAPID public key length. Generate a new VAPID key pair.');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });

      // Send to server
      const res = await fetch('/api/user/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) throw new Error('Failed to save subscription');

      setIsSubscribed(true);
      setError('');
    } catch (error: unknown) {
      logger.error('Push subscription failed', { component: 'PushNotificationToggle', error });
      const message = error instanceof Error ? error.message : 'Failed to subscribe';
      setError(message);
      if (Notification.permission === 'denied') {
        setError('Notifications blocked. Please enable in browser settings.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const registration = await ensureServiceWorker();
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const response = await fetch('/api/user/push-subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription');
      }
      setIsSubscribed(false);
    } catch (error: unknown) {
      logger.error('Failed to unsubscribe from push notifications', {
        component: 'PushNotificationToggle',
        error,
      });
      setError(
        error instanceof Error ? error.message : 'Failed to unsubscribe from push notifications'
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendTestPush() {
    setIsTesting(true);
    setTestMessage('');
    try {
      const response = await fetch('/api/notifications/test-push', { method: 'POST' });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test push.');
      }
      setTestMessage(data.message || 'Test push sent. Check your device.');
    } catch (error: unknown) {
      logger.error('Push test failed', { component: 'PushNotificationToggle', error });
      const message = error instanceof Error ? error.message : 'Failed to send test push.';
      setTestMessage(message);
    } finally {
      setIsTesting(false);
    }
  }

  if (!isSupported) return null;

  return (
    <MobileCard padding="md" className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-xl">🔔</span>
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
              Push Notifications
            </h3>
            <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
              Active incident and page alerts
            </p>
          </div>
        </div>
        {/* Toggle UI */}
        <button
          type="button"
          onClick={loading ? undefined : isSubscribed ? unsubscribe : subscribe}
          disabled={loading}
          className={cn(
            'flex h-9 min-w-[90px] items-center justify-center rounded-lg px-3 text-xs font-semibold transition',
            loading ? 'cursor-not-allowed opacity-70' : 'active:scale-[0.98]',
            isSubscribed
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-primary text-white'
          )}
        >
          {loading ? (
            <div
              className={cn(
                'h-3.5 w-3.5 animate-spin rounded-full border-2',
                isSubscribed
                  ? 'border-red-700 border-t-transparent dark:border-red-300'
                  : 'border-white border-t-transparent'
              )}
            />
          ) : isSubscribed ? (
            'Disable'
          ) : (
            'Enable'
          )}
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          Error: {error}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={sendTestPush}
          disabled={!isSubscribed || isTesting || loading}
          className={cn(
            'flex min-h-[40px] items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition',
            isSubscribed && !isTesting && !loading
              ? 'border-primary/30 bg-primary text-white'
              : 'cursor-not-allowed border-[color:var(--border)] bg-[color:var(--bg-secondary)] text-[color:var(--text-muted)]'
          )}
        >
          {isTesting ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending test...
            </>
          ) : (
            <>
              <span className="text-base">🔔</span>
              Send test push
            </>
          )}
        </button>
        {testMessage && (
          <div
            className={cn(
              'rounded-lg px-3 py-2 text-center text-xs font-medium',
              testMessage.includes('successfully') || testMessage.includes('sent')
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300'
            )}
          >
            {testMessage}
          </div>
        )}
      </div>
    </MobileCard>
  );
}
