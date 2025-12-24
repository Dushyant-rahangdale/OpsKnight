'use client';

import { useEffect } from 'react';

// Type definition for Web Vitals Metric
type Metric = {
  name: string;
  value: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
};

/**
 * Web Vitals Reporter Component
 * 
 * Collects and reports Core Web Vitals and other performance metrics
 * to help monitor real user performance.
 * 
 * Metrics tracked:
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FID (First Input Delay): Interactivity
 * - FCP (First Contentful Paint): Perceived load speed
 * - LCP (Largest Contentful Paint): Loading performance
 * - TTFB (Time to First Byte): Server response time
 * - INP (Interaction to Next Paint): Responsiveness (replaces FID)
 */
export default function WebVitalsReporter() {
  useEffect(() => {
    // Function to send metrics to our API
    const reportMetric = async (metric: Metric) => {
      // Only report in production or when explicitly enabled
      if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS) {
        return;
      }

      try {
        // Send to our API endpoint
        await fetch('/api/web-vitals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: metric.name,
            value: metric.value,
            id: metric.id,
            rating: metric.rating,
            delta: metric.delta,
            navigationType: metric.navigationType,
            // Additional context
            url: window.location.pathname,
            timestamp: Date.now(),
          }),
          // Don't block on this request
          keepalive: true,
        });
      } catch (error) {
        // Silently fail - don't impact user experience
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to report Web Vital:', error);
        }
      }
    };

    // Dynamically import web-vitals to avoid SSR issues
    // Use web-vitals package directly if next/web-vitals is not available
    const initWebVitals = async () => {
      try {
        // Try to import from next/web-vitals first
        const webVitals = await import('next/web-vitals');
        
        // Register all Web Vitals if available
        if (webVitals.onCLS) webVitals.onCLS(reportMetric);
        if (webVitals.onFID) webVitals.onFID(reportMetric);
        if (webVitals.onFCP) webVitals.onFCP(reportMetric);
        if (webVitals.onLCP) webVitals.onLCP(reportMetric);
        if (webVitals.onTTFB) webVitals.onTTFB(reportMetric);
        if (webVitals.onINP) webVitals.onINP(reportMetric);

        // Log metrics in development for debugging
        if (process.env.NODE_ENV === 'development') {
          const logMetric = (metric: Metric) => {
            console.log(`[Web Vitals] ${metric.name}:`, {
              value: `${metric.value.toFixed(2)}ms`,
              rating: metric.rating,
              id: metric.id,
            });
          };

          if (webVitals.onCLS) webVitals.onCLS(logMetric);
          if (webVitals.onFID) webVitals.onFID(logMetric);
          if (webVitals.onFCP) webVitals.onFCP(logMetric);
          if (webVitals.onLCP) webVitals.onLCP(logMetric);
          if (webVitals.onTTFB) webVitals.onTTFB(logMetric);
          if (webVitals.onINP) webVitals.onINP(logMetric);
        }
      } catch (error) {
        // Fallback: try using web-vitals package directly
        try {
          const webVitals = await import('web-vitals');
          
          if (webVitals.onCLS) webVitals.onCLS(reportMetric);
          if (webVitals.onFID) webVitals.onFID(reportMetric);
          if (webVitals.onFCP) webVitals.onFCP(reportMetric);
          if (webVitals.onLCP) webVitals.onLCP(reportMetric);
          if (webVitals.onTTFB) webVitals.onTTFB(reportMetric);
          if (webVitals.onINP) webVitals.onINP(reportMetric);
        } catch (fallbackError) {
          // Silently fail if web-vitals is not available
          if (process.env.NODE_ENV === 'development') {
            console.warn('Web Vitals not available:', error);
          }
        }
      }
    };

    initWebVitals();
  }, []);

  // This component doesn't render anything
  return null;
}

