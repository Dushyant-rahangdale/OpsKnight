'use client';

import { Card } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Switch } from '@/components/ui/shadcn/switch';
import type { FormData } from './types';

type GeneralSectionProps = {
  formData: FormData;
  setFormData: (data: FormData) => void;
};

export default function GeneralSection({ formData, setFormData }: GeneralSectionProps) {
  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Basic Settings</h2>
          <p className="text-sm text-gray-500 mb-6">
            Define the identity and presentation name displayed on your public status page.
          </p>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Status Page Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Status Page"
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-gray-500">Displayed in the header of your status page</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-sm font-medium text-gray-700">
                Organization Name
              </Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={e => setFormData({ ...formData, organizationName: e.target.value })}
                placeholder="Acme Inc."
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-gray-500">Your company or organization name</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Domain Settings */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Domain Settings</h2>
          <p className="text-sm text-gray-500 mb-6">
            Configure subdomain and custom domain for your status page.
          </p>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="subdomain" className="text-sm font-medium text-gray-700">
                Subdomain
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  value={formData.subdomain}
                  onChange={e => setFormData({ ...formData, subdomain: e.target.value })}
                  placeholder="status"
                  className="bg-white border-gray-300 max-w-[200px]"
                />
                <span className="text-sm text-gray-500">.yourdomain.com</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customDomain" className="text-sm font-medium text-gray-700">
                Custom Domain
              </Label>
              <Input
                id="customDomain"
                value={formData.customDomain}
                onChange={e => setFormData({ ...formData, customDomain: e.target.value })}
                placeholder="status.example.com"
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-gray-500">Point your CNAME to your status subdomain</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Visibility Settings */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Visibility</h2>
          <p className="text-sm text-gray-500 mb-6">
            Control what is shown on your public status page.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Enable Status Page</Label>
                <p className="text-xs text-gray-500">Make your status page publicly accessible</p>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={checked => setFormData({ ...formData, enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Show Services</Label>
                <p className="text-xs text-gray-500">Display service status on the page</p>
              </div>
              <Switch
                checked={formData.showServices}
                onCheckedChange={checked => setFormData({ ...formData, showServices: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Show Incidents</Label>
                <p className="text-xs text-gray-500">Display incident history on the page</p>
              </div>
              <Switch
                checked={formData.showIncidents}
                onCheckedChange={checked => setFormData({ ...formData, showIncidents: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <Label className="text-sm font-medium text-gray-700">Show Metrics</Label>
                <p className="text-xs text-gray-500">Display uptime metrics and charts</p>
              </div>
              <Switch
                checked={formData.showMetrics}
                onCheckedChange={checked => setFormData({ ...formData, showMetrics: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium text-gray-700">Show Subscribe Button</Label>
                <p className="text-xs text-gray-500">Allow visitors to subscribe to updates</p>
              </div>
              <Switch
                checked={formData.showSubscribe}
                onCheckedChange={checked => setFormData({ ...formData, showSubscribe: checked })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Contact Information</h2>
          <p className="text-sm text-gray-500 mb-6">
            Provide contact details for your status page visitors.
          </p>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">
                Contact Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="support@example.com"
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactUrl" className="text-sm font-medium text-gray-700">
                Contact URL
              </Label>
              <Input
                id="contactUrl"
                type="url"
                value={formData.contactUrl}
                onChange={e => setFormData({ ...formData, contactUrl: e.target.value })}
                placeholder="https://example.com/contact"
                className="bg-white border-gray-300"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
