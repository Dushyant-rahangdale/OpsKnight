'use client';

import { useState, useEffect, useCallback } from 'react';

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
}

export default function RetentionPolicySettings() {
  const [policy, setPolicy] = useState<RetentionPolicy | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/retention');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setPolicy(data.policy);
      setStats(data.stats);
      setPresets(data.presets);
    } catch (err) {
      setError('Failed to load retention settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!policy) return;

    try {
      setSaving(true);
      setError(null);
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
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePreset = (preset: Preset) => {
    setPolicy({
      incidentRetentionDays: preset.incidentRetentionDays,
      alertRetentionDays: preset.alertRetentionDays,
      logRetentionDays: preset.logRetentionDays,
      metricsRetentionDays: preset.metricsRetentionDays,
      realTimeWindowDays: preset.realTimeWindowDays,
    });
    setSuccess(null);
    setError(null);
  };

  const handleCleanup = async (dryRun: boolean) => {
    try {
      setSaving(true);
      setError(null);
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
        fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run cleanup');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDays = (days: number) => {
    if (days >= 365) {
      const years = Math.round((days / 365) * 10) / 10;
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="retention-settings">
        <div className="retention-loading">Loading retention settings...</div>
      </div>
    );
  }

  return (
    <div className="retention-settings">
      <div className="retention-header">
        <h2>Data Retention Policy</h2>
        <p className="retention-description">
          Configure how long to keep different types of data. This affects storage usage and query
          performance. Data older than the retention period may be automatically archived or
          deleted.
        </p>
      </div>

      {error && <div className="retention-alert retention-alert-error">{error}</div>}

      {success && <div className="retention-alert retention-alert-success">{success}</div>}

      {/* Quick Presets */}
      <div className="retention-section">
        <h3>Quick Presets</h3>
        <div className="retention-presets">
          {presets.map(preset => (
            <button
              key={preset.name}
              className="retention-preset-btn"
              onClick={() => handlePreset(preset)}
              disabled={saving}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Retention Settings */}
      {policy && (
        <div className="retention-section">
          <h3>Retention Periods</h3>
          <div className="retention-grid">
            <div className="retention-field">
              <label htmlFor="incidentRetention">
                Incident Data
                <span className="retention-hint">How long to keep resolved incidents</span>
              </label>
              <div className="retention-input-group">
                <input
                  id="incidentRetention"
                  type="number"
                  min="30"
                  max="3650"
                  value={policy.incidentRetentionDays}
                  onChange={e =>
                    setPolicy({ ...policy, incidentRetentionDays: parseInt(e.target.value) || 30 })
                  }
                  disabled={saving}
                />
                <span className="retention-unit">
                  days ({formatDays(policy.incidentRetentionDays)})
                </span>
              </div>
            </div>

            <div className="retention-field">
              <label htmlFor="alertRetention">
                Alert Data
                <span className="retention-hint">How long to keep alert history</span>
              </label>
              <div className="retention-input-group">
                <input
                  id="alertRetention"
                  type="number"
                  min="7"
                  max="3650"
                  value={policy.alertRetentionDays}
                  onChange={e =>
                    setPolicy({ ...policy, alertRetentionDays: parseInt(e.target.value) || 7 })
                  }
                  disabled={saving}
                />
                <span className="retention-unit">
                  days ({formatDays(policy.alertRetentionDays)})
                </span>
              </div>
            </div>

            <div className="retention-field">
              <label htmlFor="logRetention">
                Log Entries
                <span className="retention-hint">How long to keep system logs</span>
              </label>
              <div className="retention-input-group">
                <input
                  id="logRetention"
                  type="number"
                  min="1"
                  max="365"
                  value={policy.logRetentionDays}
                  onChange={e =>
                    setPolicy({ ...policy, logRetentionDays: parseInt(e.target.value) || 1 })
                  }
                  disabled={saving}
                />
                <span className="retention-unit">days ({formatDays(policy.logRetentionDays)})</span>
              </div>
            </div>

            <div className="retention-field">
              <label htmlFor="metricsRetention">
                Metric Rollups
                <span className="retention-hint">
                  Pre-aggregated metrics for fast historical queries
                </span>
              </label>
              <div className="retention-input-group">
                <input
                  id="metricsRetention"
                  type="number"
                  min="30"
                  max="3650"
                  value={policy.metricsRetentionDays}
                  onChange={e =>
                    setPolicy({ ...policy, metricsRetentionDays: parseInt(e.target.value) || 30 })
                  }
                  disabled={saving}
                />
                <span className="retention-unit">
                  days ({formatDays(policy.metricsRetentionDays)})
                </span>
              </div>
            </div>

            <div className="retention-field">
              <label htmlFor="realTimeWindow">
                Real-Time Window
                <span className="retention-hint">
                  Period for live queries (older data uses rollups)
                </span>
              </label>
              <div className="retention-input-group">
                <input
                  id="realTimeWindow"
                  type="number"
                  min="7"
                  max="365"
                  value={policy.realTimeWindowDays}
                  onChange={e =>
                    setPolicy({ ...policy, realTimeWindowDays: parseInt(e.target.value) || 7 })
                  }
                  disabled={saving}
                />
                <span className="retention-unit">
                  days ({formatDays(policy.realTimeWindowDays)})
                </span>
              </div>
            </div>
          </div>

          <div className="retention-actions">
            <button
              className="retention-btn retention-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Storage Statistics */}
      {stats && (
        <div className="retention-section">
          <h3>Storage Statistics</h3>
          <div className="retention-stats-grid">
            <div className="retention-stat-card">
              <div className="retention-stat-label">Incidents</div>
              <div className="retention-stat-value">{stats.incidents.total.toLocaleString()}</div>
              <div className="retention-stat-detail">
                Oldest: {formatDate(stats.incidents.oldest)}
              </div>
              <div className="retention-stat-breakdown">
                {Object.entries(stats.incidents.byStatus).map(([status, count]) => (
                  <span key={status} className="retention-stat-tag">
                    {status}: {count}
                  </span>
                ))}
              </div>
            </div>

            <div className="retention-stat-card">
              <div className="retention-stat-label">Alerts</div>
              <div className="retention-stat-value">{stats.alerts.total.toLocaleString()}</div>
              <div className="retention-stat-detail">Oldest: {formatDate(stats.alerts.oldest)}</div>
            </div>

            <div className="retention-stat-card">
              <div className="retention-stat-label">Log Entries</div>
              <div className="retention-stat-value">{stats.logs.total.toLocaleString()}</div>
              <div className="retention-stat-detail">Oldest: {formatDate(stats.logs.oldest)}</div>
            </div>

            <div className="retention-stat-card">
              <div className="retention-stat-label">Metric Rollups</div>
              <div className="retention-stat-value">{stats.rollups.total.toLocaleString()}</div>
              <div className="retention-stat-detail">
                Oldest: {formatDate(stats.rollups.oldest)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Cleanup */}
      <div className="retention-section">
        <h3>Data Cleanup</h3>
        <p className="retention-description">
          Run cleanup to remove data older than the retention periods. Use &quot;Preview&quot; first
          to see what would be deleted.
        </p>

        <div className="retention-cleanup-actions">
          <button
            className="retention-btn retention-btn-secondary"
            onClick={() => handleCleanup(true)}
            disabled={saving}
          >
            {saving ? 'Running...' : 'Preview Cleanup'}
          </button>
          <button
            className="retention-btn retention-btn-danger"
            onClick={() => {
              if (
                confirm(
                  'Are you sure? This will permanently delete data older than the retention periods.'
                )
              ) {
                handleCleanup(false);
              }
            }}
            disabled={saving}
          >
            {saving ? 'Running...' : 'Run Cleanup Now'}
          </button>
        </div>

        {cleanupResult && (
          <div className="retention-cleanup-result">
            <h4>Cleanup {cleanupResult.executionTimeMs ? 'Results' : 'Preview'}</h4>
            <ul>
              <li>Incidents: {cleanupResult.incidents.toLocaleString()}</li>
              <li>Events: {cleanupResult.events.toLocaleString()}</li>
              <li>Alerts: {cleanupResult.alerts.toLocaleString()}</li>
              <li>Logs: {cleanupResult.logs.toLocaleString()}</li>
              <li>Metric Rollups: {cleanupResult.metrics.toLocaleString()}</li>
            </ul>
            {cleanupResult.executionTimeMs > 0 && (
              <p className="retention-cleanup-time">
                Completed in {(cleanupResult.executionTimeMs / 1000).toFixed(2)}s
              </p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .retention-settings {
          padding: 1.5rem;
          max-width: 900px;
        }

        .retention-header h2 {
          margin: 0 0 0.5rem;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .retention-description {
          color: var(--color-text-secondary, #6b7280);
          font-size: 0.875rem;
          margin: 0 0 1.5rem;
          line-height: 1.5;
        }

        .retention-loading {
          padding: 2rem;
          text-align: center;
          color: var(--color-text-secondary);
        }

        .retention-alert {
          padding: 0.75rem 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .retention-alert-error {
          background: var(--color-error-bg, #fef2f2);
          color: var(--color-error, #dc2626);
          border: 1px solid var(--color-error-border, #fecaca);
        }

        .retention-alert-success {
          background: var(--color-success-bg, #f0fdf4);
          color: var(--color-success, #16a34a);
          border: 1px solid var(--color-success-border, #bbf7d0);
        }

        .retention-section {
          background: var(--color-bg-secondary, #f9fafb);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .retention-section h3 {
          margin: 0 0 1rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .retention-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .retention-preset-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-bg, white);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .retention-preset-btn:hover:not(:disabled) {
          background: var(--color-bg-hover, #f3f4f6);
          border-color: var(--color-primary, #3b82f6);
        }

        .retention-preset-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .retention-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .retention-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .retention-field label {
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .retention-hint {
          font-size: 0.75rem;
          font-weight: 400;
          color: var(--color-text-tertiary, #9ca3af);
        }

        .retention-input-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .retention-input-group input {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          font-size: 0.875rem;
          width: 100px;
        }

        .retention-input-group input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light, rgba(59, 130, 246, 0.1));
        }

        .retention-unit {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .retention-actions {
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border);
        }

        .retention-btn {
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .retention-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .retention-btn-primary {
          background: var(--color-primary, #3b82f6);
          color: white;
          border: none;
        }

        .retention-btn-primary:hover:not(:disabled) {
          background: var(--color-primary-dark, #2563eb);
        }

        .retention-btn-secondary {
          background: var(--color-bg);
          color: var(--color-text);
          border: 1px solid var(--color-border);
        }

        .retention-btn-secondary:hover:not(:disabled) {
          background: var(--color-bg-hover);
        }

        .retention-btn-danger {
          background: var(--color-error, #dc2626);
          color: white;
          border: none;
        }

        .retention-btn-danger:hover:not(:disabled) {
          background: var(--color-error-dark, #b91c1c);
        }

        .retention-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .retention-stat-card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 1rem;
        }

        .retention-stat-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .retention-stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0.25rem 0;
        }

        .retention-stat-detail {
          font-size: 0.75rem;
          color: var(--color-text-tertiary);
        }

        .retention-stat-breakdown {
          margin-top: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .retention-stat-tag {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          background: var(--color-bg-secondary);
          border-radius: 4px;
          color: var(--color-text-secondary);
        }

        .retention-cleanup-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .retention-cleanup-result {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 6px;
        }

        .retention-cleanup-result h4 {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .retention-cleanup-result ul {
          margin: 0;
          padding-left: 1.25rem;
          font-size: 0.875rem;
          line-height: 1.75;
        }

        .retention-cleanup-time {
          margin: 0.75rem 0 0;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
