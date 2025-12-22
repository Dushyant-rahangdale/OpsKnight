'use client';

import { useState, useEffect } from 'react';

type WidgetToggleProps = {
  widgetId: string;
  defaultVisible?: boolean;
  children: React.ReactNode;
  title: string;
};

export default function DashboardWidgetToggle({ 
  widgetId, 
  defaultVisible = true, 
  children,
  title 
}: WidgetToggleProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible);

  useEffect(() => {
    const saved = localStorage.getItem(`widget-${widgetId}`);
    if (saved !== null) {
      setIsVisible(saved === 'true');
    }
  }, [widgetId]);

  const toggleVisibility = () => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    localStorage.setItem(`widget-${widgetId}`, String(newVisible));
  };

  if (!isVisible) {
    return (
      <div className="glass-panel" style={{ background: 'white', padding: '1rem', opacity: 0.6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: 'var(--text-muted)' }}>
            {title} (Hidden)
          </h3>
          <button
            onClick={toggleVisibility}
            style={{
              padding: '0.4rem 0.8rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}
          >
            Show
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={toggleVisibility}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.1)',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          transition: 'all 0.2s ease'
        }}
        title="Hide widget"
      >
        ×
      </button>
      {children}
    </div>
  );
}

