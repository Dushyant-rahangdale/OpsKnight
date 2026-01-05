'use client';

import { useState, useEffect, useCallback } from 'react';
import SettingsHeader from '@/components/settings/SettingsHeader';
import SettingRow from '@/components/settings/SettingRow';
import StickyActionBar from '@/components/settings/StickyActionBar';
import ConfirmDialog from '@/components/settings/ConfirmDialog';
import { Trash2, AlertTriangle, CheckCircle2, RotateCcw, Clock, BarChart3, Database, FileText, Bell } from 'lucide-react';

interface RetentionPolicy {
  incidentRetentionDays: number;
  alertRetentionDays: number;
  logRetentionDays: number;
  metricsRetentionDays: number;
  realTimeWindowDays: number;
}

interface StorageStats {
  incidents: { total: number; byStatus: Record<string, number>; oldest: string | null };
  alerts: { total: number; oldest: string | null };
  logs: { total: number; oldest: string | null };
  rollups: { total: number; oldest: string | null };
}

interface Preset {
  name: string;
  incidentRetentionDays: number;
  alertRetentionDays: number;
  logRetentionDays: number;
  metricsRetentionDays: number;
  realTimeWindowDays: number;
}

interface CleanupResult {
  incidents: number;
  alerts: number;
  logs: number;
  metrics: number;
  events: number;
  executionTimeMs: number;
  dryRun: boolean;
}

const DEFAULT_POLICY: RetentionPolicy = {
  incidentRetentionDays: 730,
  alertRetentionDays: 365,
  logRetentionDays: 90,
  metricsRetentionDays: 365,
  realTimeWindowDays: 90
};

export default function RetentionPolicySettings() {
  const [policy, setPolicy] = useState<RetentionPolicy | null>(null);
  const [initialPolicy, setInitialPolicy] = useState<RetentionPolicy | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Field-level validation errors
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof RetentionPolicy, string>>>({});

  // Confirm Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCleanupAction, setPendingCleanupAction] = useState<(() => void) | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/retention');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setPolicy(data.policy);
      setInitialPolicy(data.policy);
      setStats(data.stats);
      setPresets(data.presets);
    } catch (err) {
      setGeneralError('Failed to load retention settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validatePolicy = (currentPolicy: RetentionPolicy): boolean => {
    const errors: Partial<Record<keyof RetentionPolicy, string>> = {};
    let isValid = true;

    if (currentPolicy.incidentRetentionDays < 30) {
      errors.incidentRetentionDays = 'Must be at least 30 days';
      isValid = false;
    }
    if (currentPolicy.alertRetentionDays < 7) {
      errors.alertRetentionDays = 'Must be at least 7 days';
      isValid = false;
    }
    if (currentPolicy.logRetentionDays < 1) {
      errors.logRetentionDays = 'Must be at least 1 day';
      isValid = false;
    }
    if (currentPolicy.metricsRetentionDays < 30) {
      errors.metricsRetentionDays = 'Must be at least 30 days';
      isValid = false;
    }
    if (currentPolicy.realTimeWindowDays < 1) {
      errors.realTimeWindowDays = 'Must be at least 1 day';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const isDirty = JSON.stringify(policy) !== JSON.stringify(initialPolicy);

  const handleSave = async () => {
    if (!policy) return;

    if (!validatePolicy(policy)) {
      setGeneralError('Please fix the validation errors below.');
      return;
    }

    try {
      setSaving(true);
      setGeneralError(null);
      setSuccess(null);

      const res = await fetch('/api/settings/retention', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess('Retention policy updated successfully');
      setInitialPolicy(policy);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const executeCleanup = async (dryRun: boolean) => {
    try {
      setSaving(true);
      setGeneralError(null);
      setCleanupResult(null);

      const res = await fetch('/api/settings/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to run cleanup');
      }

      const data = await res.json();
      setCleanupResult(data.result);

      if (!dryRun) {
        setSuccess('Data cleanup completed successfully');
        // Refresh stats after cleanup
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to run cleanup');
    } finally {
      setSaving(false);
    }
  };

  const handleCleanupClick = (dryRun: boolean) => {
    if (dryRun) {
      executeCleanup(true);
    } else {
      setPendingCleanupAction(() => () => executeCleanup(false));
      setConfirmOpen(true);
    }
  };

  const handleResetDefaults = () => {
    setPolicy(DEFAULT_POLICY);
    setValidationErrors({});
    setSuccess('Restored defaults (unsaved).');
  };

  const handleResetChanges = () => {
    if (initialPolicy) {
      setPolicy(initialPolicy);
      setValidationErrors({});
    }
  };

  const handleInputChange = (field: keyof RetentionPolicy, value: string) => {
    const num = parseInt(value);
    if (!policy) return;

    // Clear error for this field when user types
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
      if (Object.keys(validationErrors).length <= 1) setGeneralError(null);
    }

    if (value === '') {

      setPolicy({ ...policy, [field]: '' });
      return;
    }
    if (isNaN(num)) return;
    setPolicy({ ...policy, [field]: num });
  };

  const handlePresetClick = (preset: Preset) => {
    setPolicy({
      incidentRetentionDays: preset.incidentRetentionDays,
      alertRetentionDays: preset.alertRetentionDays,
      logRetentionDays: preset.logRetentionDays,
      metricsRetentionDays: preset.metricsRetentionDays,
      realTimeWindowDays: preset.realTimeWindowDays,
    });
    setValidationErrors({});
    setGeneralError(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div>
      <SettingsHeader
        title="Data Retention"
        description="Configure lifecycle policies and manage storage usage."
      />

      <div className="settings-form-stack">
        {generalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center gap-2 mb-4 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{generalError}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative flex items-center gap-2 mb-4 text-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Horizontal Stats Bar */}
        {stats && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <CompactStatRowItem icon={<Database className="w-4 h-4 text-blue-600" />} label="Incidents" value={stats.incidents.total} oldest={stats.incidents.oldest} />
            <CompactStatRowItem icon={<Bell className="w-4 h-4 text-orange-600" />} label="Alerts" value={stats.alerts.total} oldest={stats.alerts.oldest} />
            <CompactStatRowItem icon={<FileText className="w-4 h-4 text-gray-600" />} label="Logs" value={stats.logs.total} oldest={stats.logs.oldest} />
            <CompactStatRowItem icon={<BarChart3 className="w-4 h-4 text-purple-600" />} label="Metrics" value={stats.rollups.total} oldest={stats.rollups.oldest} />
          </div>
        )}

        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Retention Rules</h3>
            </div>
            {/* Presets */}
            <div className="flex bg-gray-100 p-0.5 rounded-md">
              {presets.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  disabled={saving}
                  className={`
                                text-xs font-medium px-3 py-1.5 rounded-sm transition-all
                                ${JSON.stringify({
                    incidentRetentionDays: policy?.incidentRetentionDays,
                    alertRetentionDays: policy?.alertRetentionDays,
                    logRetentionDays: policy?.logRetentionDays,
                    metricsRetentionDays: policy?.metricsRetentionDays,
                    realTimeWindowDays: policy?.realTimeWindowDays
                  }) === JSON.stringify({
                    incidentRetentionDays: preset.incidentRetentionDays,
                    alertRetentionDays: preset.alertRetentionDays,
                    logRetentionDays: preset.logRetentionDays,
                    metricsRetentionDays: preset.metricsRetentionDays,
                    realTimeWindowDays: preset.realTimeWindowDays
                  })
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'}
                            `}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {policy && (
              <>
                <SettingRow
                  label="Incident History"
                  description="Resolved incidents and postmortems."
                  className="!border-none"
                  error={validationErrors.incidentRetentionDays}
                >
                  <CompactInput
                    value={policy.incidentRetentionDays}
                    onChange={(v) => handleInputChange('incidentRetentionDays', v)}
                    unit="days"
                    min={30}
                    hasError={!!validationErrors.incidentRetentionDays}
                  />
                </SettingRow>

                <SettingRow
                  label="Alert Logs"
                  description="Raw alerts from integrations."
                  className="!border-none"
                  error={validationErrors.alertRetentionDays}
                >
                  <CompactInput
                    value={policy.alertRetentionDays}
                    onChange={(v) => handleInputChange('alertRetentionDays', v)}
                    unit="days"
                    min={7}
                    hasError={!!validationErrors.alertRetentionDays}
                  />
                </SettingRow>

                <SettingRow
                  label="System Logs"
                  description="Audit trails and debug events."
                  className="!border-none"
                  error={validationErrors.logRetentionDays}
                >
                  <CompactInput
                    value={policy.logRetentionDays}
                    onChange={(v) => handleInputChange('logRetentionDays', v)}
                    unit="days"
                    min={1}
                    hasError={!!validationErrors.logRetentionDays}
                  />
                </SettingRow>

                <SettingRow
                  label="Metric Rollups"
                  description="Aggregated performance data (hourly/daily)."
                  className="!border-none"
                  error={validationErrors.metricsRetentionDays}
                >
                  <CompactInput
                    value={policy.metricsRetentionDays}
                    onChange={(v) => handleInputChange('metricsRetentionDays', v)}
                    unit="days"
                    min={30}
                    hasError={!!validationErrors.metricsRetentionDays}
                  />
                </SettingRow>

                <SettingRow
                  label="High-Precision Metrics"
                  description="Raw, real-time metric data points."
                  className="!border-none"
                  error={validationErrors.realTimeWindowDays}
                >
                  <CompactInput
                    value={policy.realTimeWindowDays}
                    onChange={(v) => handleInputChange('realTimeWindowDays', v)}
                    unit="days"
                    min={1}
                    hasError={!!validationErrors.realTimeWindowDays}
                  />
                </SettingRow>
              </>
            )}
          </div>
        </section>

        <section className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <div className="bg-gray-100 p-1.5 rounded-full">
              <Trash2 className="w-4 h-4 text-gray-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Data Cleanup</h3>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 max-w-xl">
                Run the cleanup job to permanently delete data older than your configured retention policy.
                We recommend running a <strong>Preview</strong> first.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleCleanupClick(true)}
                  disabled={saving}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-all"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleCleanupClick(false)}
                  disabled={saving}
                  className="px-3 py-1.5 bg-red-600 border border-transparent rounded text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 shadow-sm transition-all"
                >
                  Execute
                </button>
              </div>
            </div>

            {cleanupResult && (
              <div className={`mt-6 rounded border p-4 animate-in fade-in slide-in-from-top-2 ${cleanupResult.dryRun ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
                  <h5 className={`text-sm font-semibold flex items-center gap-2 ${cleanupResult.dryRun ? 'text-blue-800' : 'text-green-800'}`}>
                    {cleanupResult.dryRun ? 'Simulation Result' : 'Cleanup Complete'}
                    <span className={`text-xs font-normal px-1.5 py-0.5 rounded ${cleanupResult.dryRun ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {cleanupResult.executionTimeMs}ms
                    </span>
                  </h5>
                </div>
                <div className="flex gap-8 text-sm">
                  <StatItem label="Incidents" value={cleanupResult.incidents} />
                  <StatItem label="Alerts" value={cleanupResult.alerts} />
                  <StatItem label="Logs" value={cleanupResult.logs} />
                  <StatItem label="Metrics" value={cleanupResult.metrics} />
                </div>
                {cleanupResult.dryRun && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>No data was permanently deleted.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <StickyActionBar>
        {isDirty && (
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-sm text-yellow-600 font-medium">Unsaved changes</span>
            <button
              onClick={handleResetChanges}
              className="text-sm text-gray-500 hover:text-gray-900 underline decoration-dotted"
            >
              Discard
            </button>
          </div>
        )}

        {!isDirty && (
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-sm text-gray-500 hover:text-gray-700 mr-auto flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Controls
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="settings-primary-button"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </StickyActionBar>

      <ConfirmDialog
        open={confirmOpen}
        title="Permanently Delete Data?"
        message="This action will permanently delete all data older than the configured retention periods. This action cannot be undone."
        confirmLabel="Yes, Delete Data"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (pendingCleanupAction) pendingCleanupAction();
          setConfirmOpen(false);
        }}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingCleanupAction(null);
        }}
      />
    </div>
  );
}

// Compact Subcomponents

function CompactStatRowItem({ icon, label, value, oldest }: { icon: React.ReactNode, label: string, value: number, oldest: string | null }) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex-1 px-4 py-2 md:py-0 flex items-center justify-between md:block">
      <div className="flex items-center gap-2 mb-0 md:mb-1">
        {icon}
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-right md:text-left">
        <div className="text-lg font-semibold text-gray-900 leading-none">{value.toLocaleString()}</div>
        {oldest && (
          <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-end md:justify-start gap-1">
            <Clock className="w-3 h-3" />
            Oldest: {formatDate(oldest)}
          </div>
        )}
      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</span>
      <span className="font-mono font-medium text-gray-900">{value.toLocaleString()}</span>
    </div>
  )
}


interface CompactInputProps {
  value: number | string;
  onChange: (val: string) => void;
  unit: string;
  min?: number;
  hasError?: boolean;
}

function CompactInput({ value, onChange, unit, min, hasError }: CompactInputProps) {
  return (
    <div className="flex rounded-md shadow-sm w-40">
      <input
        type="number"
        min={min}
        className={`settings-input block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 h-9 ${hasError ? 'border-red-300 focus:border-red-500 text-red-900 placeholder-red-300' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className={`inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-xs font-medium h-9 ${hasError ? 'border-red-300 bg-red-50 text-red-700' : ''}`}>
        {unit}
      </span>
    </div>
  )
}
