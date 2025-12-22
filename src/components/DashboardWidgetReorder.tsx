'use client';

import { useState, useEffect } from 'react';

type WidgetReorderProps = {
  children: React.ReactNode;
  widgetId: string;
  defaultOrder?: number;
};

export default function DashboardWidgetReorder({ children, widgetId, defaultOrder = 0 }: WidgetReorderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [order, setOrder] = useState(defaultOrder);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard-widget-order');
    if (saved) {
      try {
        const orders = JSON.parse(saved);
        if (orders[widgetId] !== undefined) {
          setOrder(orders[widgetId]);
        }
      } catch (e) {
        console.error('Failed to load widget order', e);
      }
    }
  }, [widgetId]);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', widgetId);
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedWidgetId = e.dataTransfer.getData('text/plain');
    
    if (draggedWidgetId !== widgetId) {
      // Swap orders
      const saved = localStorage.getItem('dashboard-widget-order');
      const orders = saved ? JSON.parse(saved) : {};
      const draggedOrder = orders[draggedWidgetId] ?? defaultOrder;
      const currentOrder = orders[widgetId] ?? defaultOrder;
      
      orders[draggedWidgetId] = currentOrder;
      orders[widgetId] = draggedOrder;
      
      localStorage.setItem('dashboard-widget-order', JSON.stringify(orders));
      
      // Trigger re-render by updating state
      setOrder(draggedOrder);
      
      // Dispatch custom event to trigger parent re-render
      window.dispatchEvent(new CustomEvent('widget-reordered'));
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative'
      }}
      title="Drag to reorder"
    >
      <div
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
          padding: '0.25rem 0.5rem',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          zIndex: 10,
          pointerEvents: 'none'
        }}
      >
        <span>⋮⋮</span>
        <span>Drag</span>
      </div>
      {children}
    </div>
  );
}

