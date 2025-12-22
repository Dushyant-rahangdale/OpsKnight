'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type DashboardTemplate = {
  id: string;
  name: string;
  description: string;
  layout: {
    showMetrics: boolean;
    showCharts: boolean;
    showTimeline: boolean;
    showActivity: boolean;
    showServiceHealth: boolean;
    showPerformance: boolean;
    showComparison: boolean;
  };
};

// Extend the layout type to include all widget types
type ExtendedLayout = {
  showMetrics: boolean;
  showCharts: boolean;
  showTimeline: boolean;
  showActivity: boolean;
  showServiceHealth: boolean;
  showPerformance: boolean;
  showComparison: boolean;
};

const templates: DashboardTemplate[] = [
  {
    id: 'executive',
    name: 'Executive',
    description: 'High-level overview with key metrics and trends',
    layout: {
      showMetrics: true,
      showCharts: true,
      showTimeline: false,
      showActivity: false,
      showServiceHealth: true,
      showPerformance: true,
      showComparison: true
    }
  },
  {
    id: 'operator',
    name: 'Operator',
    description: 'Detailed view for incident management',
    layout: {
      showMetrics: true,
      showCharts: true,
      showTimeline: true,
      showActivity: true,
      showServiceHealth: true,
      showPerformance: true,
      showComparison: false
    }
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Balanced view with metrics and performance',
    layout: {
      showMetrics: true,
      showCharts: true,
      showTimeline: false,
      showActivity: true,
      showServiceHealth: true,
      showPerformance: true,
      showComparison: true
    }
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Your personalized layout',
    layout: {
      showMetrics: true,
      showCharts: true,
      showTimeline: true,
      showActivity: true,
      showServiceHealth: true,
      showPerformance: true,
      showComparison: true
    }
  }
];

export default function DashboardTemplates() {
  const router = useRouter();
  const [currentTemplate, setCurrentTemplate] = useState<string>('custom');

  useEffect(() => {
    const saved = localStorage.getItem('dashboard-template');
    if (saved) {
      setCurrentTemplate(saved);
    }
  }, []);

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      localStorage.setItem('dashboard-template', templateId);
      localStorage.setItem('dashboard-widget-visibility', JSON.stringify(template.layout));
      setCurrentTemplate(templateId);
      // Dispatch custom event to update widgets in same tab
      window.dispatchEvent(new Event('dashboard-template-changed'));
      router.refresh();
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Template:</span>
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => applyTemplate(template.id)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              border: '1px solid var(--border)',
              background: currentTemplate === template.id ? 'var(--primary)' : 'white',
              color: currentTemplate === template.id ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            title={template.description}
          >
            {template.name}
            {currentTemplate === template.id && (
              <span style={{ marginLeft: '0.25rem' }}>✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

