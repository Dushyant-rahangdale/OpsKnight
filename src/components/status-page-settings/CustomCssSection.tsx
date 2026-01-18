'use client';

import { Card } from '@/components/ui/shadcn/card';
import { Label } from '@/components/ui/shadcn/label';
import { Textarea } from '@/components/ui/shadcn/textarea';
import type { FormData } from './types';

type CustomCssSectionProps = {
  formData: FormData;
  setFormData: (data: FormData) => void;
};

export default function CustomCssSection({ formData, setFormData }: CustomCssSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Custom CSS</h2>
          <p className="text-sm text-gray-500 mb-4">
            Add custom CSS to further customize your status page appearance. This CSS will be
            injected into your public status page.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">CSS Code</Label>
              <Textarea
                value={formData.customCss}
                onChange={e => setFormData({ ...formData, customCss: e.target.value })}
                placeholder={`/* Example custom CSS */
.status-page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.service-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}`}
                className="font-mono text-sm bg-gray-50 min-h-[300px]"
              />
              <p className="text-xs text-gray-500">
                Use CSS selectors to target status page elements. Changes will be applied
                immediately in preview.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-medium text-amber-800 mb-2">⚠️ Important Notes</h3>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Custom CSS is applied after theme styles and will override them</li>
                <li>Avoid using !important unless absolutely necessary</li>
                <li>Test your CSS thoroughly before publishing</li>
                <li>Invalid CSS may break your status page layout</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Common Selectors</h2>
          <p className="text-sm text-gray-500 mb-4">Reference for commonly used CSS selectors</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono text-blue-600">.status-page-container</code>
              <p className="text-xs text-gray-500 mt-1">Main container element</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono text-blue-600">.status-page-header</code>
              <p className="text-xs text-gray-500 mt-1">Header section</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono text-blue-600">.service-card</code>
              <p className="text-xs text-gray-500 mt-1">Individual service cards</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono text-blue-600">.incident-item</code>
              <p className="text-xs text-gray-500 mt-1">Incident list items</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono text-blue-600">.status-operational</code>
              <p className="text-xs text-gray-500 mt-1">Operational status indicator</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono text-blue-600">.status-degraded</code>
              <p className="text-xs text-gray-500 mt-1">Degraded status indicator</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
