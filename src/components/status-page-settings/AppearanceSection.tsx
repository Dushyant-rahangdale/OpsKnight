'use client';

import { Card } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import {
  STATUS_PAGE_TEMPLATES,
  TEMPLATE_FILTERS,
  type TemplateCategory,
  type FormData,
} from './types';
import { useState } from 'react';

type AppearanceSectionProps = {
  formData: FormData;
  setFormData: (data: FormData) => void;
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  onApplyTemplate: (template: { id: string; file: string }) => void;
};

export default function AppearanceSection({
  formData,
  setFormData,
  selectedTemplateId,
  setSelectedTemplateId,
  onApplyTemplate,
}: AppearanceSectionProps) {
  const [templateFilter, setTemplateFilter] = useState<'all' | TemplateCategory>('all');

  const filteredTemplates = STATUS_PAGE_TEMPLATES.filter(
    t => templateFilter === 'all' || t.category === templateFilter
  );

  return (
    <div className="space-y-6">
      {/* Theme Templates */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Theme Templates</h2>
          <p className="text-sm text-gray-500 mb-4">
            Choose a pre-built theme for your status page
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TEMPLATE_FILTERS.map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setTemplateFilter(filter.id)}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                  templateFilter === filter.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setSelectedTemplateId(template.id);
                  onApplyTemplate(template);
                }}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedTemplateId === template.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Color Preview */}
                <div className="flex gap-1 mb-2">
                  {template.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{template.name}</p>
                <p className="text-xs text-gray-500 capitalize">{template.category}</p>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Custom Colors */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Custom Colors</h2>
          <p className="text-sm text-gray-500 mb-4">Override theme colors with your own</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Background Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={e => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={e => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="flex-1 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Text Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={e => setFormData({ ...formData, textColor: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                />
                <Input
                  value={formData.textColor}
                  onChange={e => setFormData({ ...formData, textColor: e.target.value })}
                  className="flex-1 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Branding */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Branding</h2>
          <p className="text-sm text-gray-500 mb-4">Customize your status page branding</p>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Logo URL</Label>
              <Input
                value={formData.logoUrl}
                onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.svg"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Favicon URL</Label>
              <Input
                value={formData.faviconUrl}
                onChange={e => setFormData({ ...formData, faviconUrl: e.target.value })}
                placeholder="https://example.com/favicon.ico"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Footer Text</Label>
              <Input
                value={formData.footerText}
                onChange={e => setFormData({ ...formData, footerText: e.target.value })}
                placeholder="© 2024 Your Company"
                className="bg-white"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* SEO Settings */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">SEO Settings</h2>
          <p className="text-sm text-gray-500 mb-4">Optimize your status page for search engines</p>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Meta Title</Label>
              <Input
                value={formData.metaTitle}
                onChange={e => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="System Status"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Meta Description</Label>
              <Input
                value={formData.metaDescription}
                onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Check the current status of our services"
                className="bg-white"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
