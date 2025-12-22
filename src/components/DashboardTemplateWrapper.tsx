'use client';

import { useState, useEffect, ReactNode } from 'react';

type TemplateLayout = {
  showMetrics: boolean;
  showCharts: boolean;
  showTimeline: boolean;
  showActivity: boolean;
  showServiceHealth: boolean;
  showPerformance: boolean;
  showComparison: boolean;
};

type DashboardTemplateWrapperProps = {
  widgetType: keyof TemplateLayout;
  children: ReactNode;
};

export default function DashboardTemplateWrapper({ widgetType, children }: DashboardTemplateWrapperProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const visibility = localStorage.getItem('dashboard-widget-visibility');
    if (visibility) {
      try {
        const layout: TemplateLayout = JSON.parse(visibility);
        setIsVisible(layout[widgetType] ?? true);
      } catch (e) {
        console.error('Failed to parse widget visibility', e);
      }
    }
  }, [widgetType]);

  // On client-side, listen for storage changes to update visibility
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = () => {
      const visibility = localStorage.getItem('dashboard-widget-visibility');
      if (visibility) {
        try {
          const layout: TemplateLayout = JSON.parse(visibility);
          setIsVisible(layout[widgetType] ?? true);
        } catch (e) {
          console.error('Failed to parse widget visibility', e);
        }
      }
    };

    // Listen for custom storage events (template changes)
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events in same tab
    window.addEventListener('dashboard-template-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dashboard-template-changed', handleStorageChange);
    };
  }, [widgetType, mounted]);

  if (!mounted) {
    // Server-side render: show by default to avoid hydration issues
    return <>{children}</>;
  }

  if (!isVisible) {
    return null;
  }

  return <>{children}</>;
}

