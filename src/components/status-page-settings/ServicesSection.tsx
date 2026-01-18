'use client';

import { Card } from '@/components/ui/shadcn/card';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import type { Service, ServiceConfig } from './types';

type ServicesSectionProps = {
  allServices: Service[];
  selectedServices: Set<string>;
  setSelectedServices: (services: Set<string>) => void;
  serviceConfigs: Record<string, ServiceConfig>;
  updateServiceConfig: (serviceId: string, updates: Partial<ServiceConfig>) => void;
};

export default function ServicesSection({
  allServices,
  selectedServices,
  setSelectedServices,
  serviceConfigs,
  updateServiceConfig,
}: ServicesSectionProps) {
  const handleToggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
      // Initialize config if not exists
      if (!serviceConfigs[serviceId]) {
        updateServiceConfig(serviceId, {
          displayName: '',
          order: newSelected.size - 1,
          showOnPage: true,
        });
      }
    }
    setSelectedServices(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedServices.size === allServices.length) {
      setSelectedServices(new Set());
    } else {
      const allIds = new Set(allServices.map(s => s.id));
      setSelectedServices(allIds);
      // Initialize configs for all
      allServices.forEach((service, index) => {
        if (!serviceConfigs[service.id]) {
          updateServiceConfig(service.id, {
            displayName: '',
            order: index,
            showOnPage: true,
          });
        }
      });
    }
  };

  const selectedCount = selectedServices.size;
  const totalCount = allServices.length;

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Services</h2>
              <p className="text-sm text-gray-500">
                Select which services to display on your status page
              </p>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
            {selectedCount} of {totalCount} services selected
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allServices.map(service => {
              const isSelected = selectedServices.has(service.id);
              const config = serviceConfigs[service.id];

              return (
                <div
                  key={service.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleService(service.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{service.name}</span>
                        {service.region && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {service.region}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <div className="mt-3 space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Display Name (optional)</Label>
                            <Input
                              value={config?.displayName || ''}
                              onChange={e =>
                                updateServiceConfig(service.id, { displayName: e.target.value })
                              }
                              placeholder={service.name}
                              className="h-8 text-sm bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {allServices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No services found.</p>
                <p className="text-sm mt-1">
                  Create services first to add them to your status page.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
