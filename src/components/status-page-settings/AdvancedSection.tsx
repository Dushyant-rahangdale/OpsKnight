'use client';

import { Card } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Switch } from '@/components/ui/shadcn/switch';
import type { FormData } from './types';

type AdvancedSectionProps = {
  formData: FormData;
  setFormData: (data: FormData) => void;
};

export default function AdvancedSection({ formData, setFormData }: AdvancedSectionProps) {
  return (
    <div className="space-y-6">
      {/* Uptime Thresholds */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Uptime Thresholds</h2>
          <p className="text-sm text-gray-500 mb-4">
            Define uptime percentages for status indicators
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Excellent Threshold (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.uptimeExcellentThreshold}
                onChange={e =>
                  setFormData({
                    ...formData,
                    uptimeExcellentThreshold: parseFloat(e.target.value) || 99.9,
                  })
                }
                className="bg-white"
              />
              <p className="text-xs text-gray-500">Above this = Excellent (green)</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Good Threshold (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.uptimeGoodThreshold}
                onChange={e =>
                  setFormData({
                    ...formData,
                    uptimeGoodThreshold: parseFloat(e.target.value) || 99.0,
                  })
                }
                className="bg-white"
              />
              <p className="text-xs text-gray-500">
                Above this = Good (yellow), below = Degraded (red)
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Display Options */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Display Options</h2>
          <p className="text-sm text-gray-500 mb-4">
            Configure what additional information to show
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Show by Region</Label>
                <p className="text-xs text-gray-500">Group services by their region</p>
              </div>
              <Switch
                checked={formData.showServicesByRegion}
                onCheckedChange={checked =>
                  setFormData({ ...formData, showServicesByRegion: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Show Service Owners</Label>
                <p className="text-xs text-gray-500">Display team responsible for each service</p>
              </div>
              <Switch
                checked={formData.showServiceOwners}
                onCheckedChange={checked =>
                  setFormData({ ...formData, showServiceOwners: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Show SLA Tier</Label>
                <p className="text-xs text-gray-500">Display service SLA tier information</p>
              </div>
              <Switch
                checked={formData.showServiceSlaTier}
                onCheckedChange={checked =>
                  setFormData({ ...formData, showServiceSlaTier: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Show Region Heatmap</Label>
                <p className="text-xs text-gray-500">Visual map of service status by region</p>
              </div>
              <Switch
                checked={formData.showRegionHeatmap}
                onCheckedChange={checked =>
                  setFormData({ ...formData, showRegionHeatmap: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Show Changelog</Label>
                <p className="text-xs text-gray-500">Display system changelog section</p>
              </div>
              <Switch
                checked={formData.showChangelog}
                onCheckedChange={checked => setFormData({ ...formData, showChangelog: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Show Post-Incident Review
                </Label>
                <p className="text-xs text-gray-500">Display post-mortem details</p>
              </div>
              <Switch
                checked={formData.showPostIncidentReview}
                onCheckedChange={checked =>
                  setFormData({ ...formData, showPostIncidentReview: checked })
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* API Settings */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">API Settings</h2>
          <p className="text-sm text-gray-500 mb-4">Configure API access and rate limiting</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Enable Uptime Exports</Label>
                <p className="text-xs text-gray-500">Allow downloading uptime data</p>
              </div>
              <Switch
                checked={formData.enableUptimeExports}
                onCheckedChange={checked =>
                  setFormData({ ...formData, enableUptimeExports: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Require API Token</Label>
                <p className="text-xs text-gray-500">Require authentication for API access</p>
              </div>
              <Switch
                checked={formData.statusApiRequireToken}
                onCheckedChange={checked =>
                  setFormData({ ...formData, statusApiRequireToken: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Enable Rate Limiting</Label>
                <p className="text-xs text-gray-500">Limit API requests per client</p>
              </div>
              <Switch
                checked={formData.statusApiRateLimitEnabled}
                onCheckedChange={checked =>
                  setFormData({ ...formData, statusApiRateLimitEnabled: checked })
                }
              />
            </div>

            {formData.statusApiRateLimitEnabled && (
              <div className="grid grid-cols-2 gap-4 pt-2 pl-4 border-l-2 border-blue-200">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Max Requests</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.statusApiRateLimitMax}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        statusApiRateLimitMax: parseInt(e.target.value) || 120,
                      })
                    }
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Window (seconds)</Label>
                  <Input
                    type="number"
                    min="10"
                    value={formData.statusApiRateLimitWindowSec}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        statusApiRateLimitWindowSec: parseInt(e.target.value) || 60,
                      })
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Auto Refresh */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Auto Refresh</h2>
          <p className="text-sm text-gray-500 mb-4">Configure automatic page refresh settings</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium text-gray-700">Enable Auto Refresh</Label>
                <p className="text-xs text-gray-500">Automatically refresh status page</p>
              </div>
              <Switch
                checked={formData.autoRefresh}
                onCheckedChange={checked => setFormData({ ...formData, autoRefresh: checked })}
              />
            </div>

            {formData.autoRefresh && (
              <div className="space-y-2 max-w-xs">
                <Label className="text-sm font-medium text-gray-700">
                  Refresh Interval (seconds)
                </Label>
                <Input
                  type="number"
                  min="10"
                  max="300"
                  value={formData.refreshInterval}
                  onChange={e =>
                    setFormData({ ...formData, refreshInterval: parseInt(e.target.value) || 60 })
                  }
                  className="bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
