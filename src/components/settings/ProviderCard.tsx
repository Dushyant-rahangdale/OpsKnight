'use client';

import { useState } from 'react';
import { useTimezone } from '@/contexts/TimezoneContext';
import { formatDateTime } from '@/lib/timezone';
import type { ProviderRecord, ProviderConfigSchema, SaveStatus } from '@/types/notification-types';
import styles from './Settings.module.css';

interface ProviderCardProps {
  providerConfig: ProviderConfigSchema;
  existing?: ProviderRecord;
  isExpanded: boolean;
  onToggle: () => void;
  twilioProvider?: ProviderRecord;
}

export default function ProviderCard({
  providerConfig,
  existing,
  isExpanded,
  onToggle,
  twilioProvider,
}: ProviderCardProps) {
  const { userTimeZone } = useTimezone();

  const initialEnabled =
    providerConfig.key === 'whatsapp'
      ? !!(
          (existing?.config as Record<string, unknown>)?.whatsappEnabled &&
          (existing?.config as Record<string, unknown>)?.whatsappNumber
        )
      : existing?.enabled || false;

  const hasRequiredConfig =
    existing?.config &&
    Object.keys(existing.config).length > 0 &&
    providerConfig.fields
      .filter(f => f.required)
      .every(f => {
        const value = (existing.config as Record<string, unknown>)[f.name];
        return value && String(value).trim() !== '';
      });

  const [enabled, setEnabled] = useState(initialEnabled);
  const [config, setConfig] = useState<Record<string, unknown>>(
    (existing?.config as Record<string, unknown>) || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    setError(null);

    try {
      if (enabled) {
        const requiredFields = providerConfig.fields.filter(f => f.required);
        for (const field of requiredFields) {
          const value = config[field.name];
          if (!value || String(value).trim() === '') {
            throw new Error(`${field.label} is required`);
          }
        }
      }

      if (providerConfig.key === 'whatsapp') {
        const { updateNotificationProvider } = await import('@/app/(app)/settings/system/actions');
        if (!twilioProvider) {
          await updateNotificationProvider(null, 'twilio', false, {
            whatsappNumber: (config.whatsappNumber as string) || '',
            whatsappEnabled: enabled,
            whatsappContentSid: (config.whatsappContentSid as string) || '',
            whatsappAccountSid: (config.whatsappAccountSid as string) || '',
            whatsappAuthToken: (config.whatsappAuthToken as string) || '',
          });
        } else {
          const twilioConfig = twilioProvider.config as Record<string, unknown>;
          await updateNotificationProvider(twilioProvider.id, 'twilio', twilioProvider.enabled, {
            ...twilioConfig,
            whatsappNumber:
              (config.whatsappNumber as string) || (twilioConfig.whatsappNumber as string) || '',
            whatsappEnabled: enabled,
            whatsappContentSid:
              (config.whatsappContentSid as string) ||
              (twilioConfig.whatsappContentSid as string) ||
              '',
            whatsappAccountSid:
              (config.whatsappAccountSid as string) ||
              (twilioConfig.whatsappAccountSid as string) ||
              '',
            whatsappAuthToken:
              (config.whatsappAuthToken as string) ||
              (twilioConfig.whatsappAuthToken as string) ||
              '',
          });
        }
      } else {
        const { updateNotificationProvider } = await import('@/app/(app)/settings/system/actions');
        await updateNotificationProvider(existing?.id || null, providerConfig.key, enabled, config);
      }

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async (newEnabled: boolean) => {
    if (newEnabled && !hasRequiredConfig) {
      // eslint-disable-next-line no-alert
      alert('Please configure this provider first before enabling it.');
      return;
    }

    setEnabled(newEnabled);

    try {
      const { updateNotificationProvider } = await import('@/app/(app)/settings/system/actions');
      if (providerConfig.key === 'whatsapp') {
        if (!twilioProvider) {
          await updateNotificationProvider(null, 'twilio', false, {
            whatsappNumber: (config.whatsappNumber as string) || '',
            whatsappEnabled: newEnabled,
          });
        } else {
          const twilioConfig = twilioProvider.config as Record<string, unknown>;
          await updateNotificationProvider(twilioProvider.id, 'twilio', twilioProvider.enabled, {
            ...twilioConfig,
            whatsappNumber:
              (config.whatsappNumber as string) || (twilioConfig.whatsappNumber as string) || '',
            whatsappEnabled: newEnabled,
          });
        }
      } else {
        await updateNotificationProvider(
          existing?.id || null,
          providerConfig.key,
          newEnabled,
          config
        );
      }
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setEnabled(!newEnabled);
      // eslint-disable-next-line no-alert
      alert(
        `Failed to ${newEnabled ? 'enable' : 'disable'} provider: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className={styles.providerCard}>
      <div className={styles.providerHeader}>
        <div className={styles.providerMeta}>
          <div className={styles.providerTitle}>
            <h3>{providerConfig.name}</h3>
            <span className={enabled ? styles.statusEnabled : styles.statusDisabled}>
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className={styles.providerDescription}>{providerConfig.description}</p>
        </div>
        <div className={styles.providerActions}>
          <div className={styles.toggleContainer}>
            <button
              type="button"
              className={`${styles.toggle} ${enabled ? styles.toggleEnabled : ''} ${!hasRequiredConfig && !enabled ? styles.toggleDisabled : ''}`}
              onClick={() => handleToggleEnabled(!enabled)}
              disabled={isSaving || (!enabled && !hasRequiredConfig)}
              title={!hasRequiredConfig && !enabled ? 'Configure this provider first' : ''}
              aria-label={enabled ? 'Disable provider' : 'Enable provider'}
            />
            <span className={styles.toggleLabel}>{enabled ? 'On' : 'Off'}</span>
          </div>

          <button type="button" onClick={onToggle} className={styles.configureBtn}>
            {isExpanded ? 'Collapse' : 'Configure'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <form onSubmit={handleSave} className={styles.providerForm}>
          <div className={styles.fieldGroup}>
            {providerConfig.fields.map(field => (
              <div key={field.name}>
                <label className={styles.fieldLabel}>
                  {field.label}
                  {field.required && <span className={styles.fieldRequired}>*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={(config[field.name] as string) || ''}
                    onChange={e => setConfig({ ...config, [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                    required={field.required && enabled}
                    rows={4}
                    className={`${styles.fieldInput} ${styles.fieldTextarea} ${styles.fieldInputMono}`}
                  />
                ) : field.type === 'checkbox' ? (
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={(config[field.name] as boolean) || false}
                      onChange={e => setConfig({ ...config, [field.name]: e.target.checked })}
                    />
                    {field.label}
                  </label>
                ) : (
                  <input
                    type={field.type}
                    value={(config[field.name] as string) || ''}
                    onChange={e => setConfig({ ...config, [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                    required={field.required && enabled}
                    className={`${styles.fieldInput} ${field.type === 'password' ? styles.fieldInputMono : ''}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className={styles.formFooter}>
            <button type="submit" disabled={isSaving} className={styles.primaryBtn}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
            {saveStatus === 'success' && (
              <div className={`${styles.alert} ${styles.alertSuccess}`}>✓ Saved successfully</div>
            )}
            {saveStatus === 'error' && error && (
              <div className={`${styles.alert} ${styles.alertError}`}>✕ {error}</div>
            )}
          </div>
        </form>
      )}

      {existing && !isExpanded && (
        <p className={styles.lastUpdated}>
          Last updated: {formatDateTime(existing.updatedAt, userTimeZone, { format: 'datetime' })}
        </p>
      )}
    </div>
  );
}
