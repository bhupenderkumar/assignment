// src/lib/services/performanceMonitoringService.ts

/**
 * Performance monitoring service to track application performance metrics
 */
class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: Map<string, any[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = true;

  private constructor() {
    this.initializeObservers();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    try {
      // Navigation timing observer
      if ('PerformanceObserver' in window) {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric('navigation', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              type: entry.entryType,
              timestamp: Date.now()
            });
          });
        });

        try {
          navObserver.observe({ entryTypes: ['navigation'] });
          this.observers.set('navigation', navObserver);
        } catch (e) {
          console.warn('Navigation timing not supported');
        }

        // Resource timing observer
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            // Only track significant resources
            if (entry.duration > 100) {
              this.recordMetric('resource', {
                name: entry.name,
                duration: entry.duration,
                size: (entry as any).transferSize || 0,
                type: entry.entryType,
                timestamp: Date.now()
              });
            }
          });
        });

        try {
          resourceObserver.observe({ entryTypes: ['resource'] });
          this.observers.set('resource', resourceObserver);
        } catch (e) {
          console.warn('Resource timing not supported');
        }

        // Largest Contentful Paint observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('lcp', {
            value: lastEntry.startTime,
            timestamp: Date.now()
          });
        });

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          this.observers.set('lcp', lcpObserver);
        } catch (e) {
          console.warn('LCP not supported');
        }

        // First Input Delay observer
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            // Cast to any to access processingStart property which exists on PerformanceEventTiming
            const eventEntry = entry as any;
            this.recordMetric('fid', {
              value: eventEntry.processingStart ? eventEntry.processingStart - entry.startTime : entry.duration,
              timestamp: Date.now()
            });
          });
        });

        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
          this.observers.set('fid', fidObserver);
        } catch (e) {
          console.warn('FID not supported');
        }
      }
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }

  /**
   * Record a custom metric
   */
  public recordMetric(category: string, data: any): void {
    if (!this.isEnabled) return;

    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }

    const metrics = this.metrics.get(category)!;
    metrics.push({
      ...data,
      timestamp: data.timestamp || Date.now()
    });

    // Keep only last 100 entries per category
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  /**
   * Track component render time
   */
  public trackComponentRender(componentName: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric('component-render', {
        component: componentName,
        duration,
        startTime,
        endTime
      });

      if (process.env.NODE_ENV === 'development' && duration > 16) {
        console.warn(`Slow component render: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Track API call performance
   */
  public trackApiCall(endpoint: string, method: string = 'GET'): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric('api-call', {
        endpoint,
        method,
        duration,
        startTime,
        endTime
      });

      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`Slow API call: ${method} ${endpoint} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Track bundle loading time
   */
  public trackBundleLoad(bundleName: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric('bundle-load', {
        bundle: bundleName,
        duration,
        startTime,
        endTime
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`Bundle loaded: ${bundleName} in ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    for (const [category, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue;

      const durations = metrics
        .filter(m => typeof m.duration === 'number')
        .map(m => m.duration);

      if (durations.length > 0) {
        summary[category] = {
          count: metrics.length,
          avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          lastRecorded: Math.max(...metrics.map(m => m.timestamp))
        };
      } else {
        summary[category] = {
          count: metrics.length,
          lastRecorded: Math.max(...metrics.map(m => m.timestamp))
        };
      }
    }

    return summary;
  }

  /**
   * Get Core Web Vitals
   */
  public getCoreWebVitals(): Record<string, number | null> {
    const lcp = this.metrics.get('lcp');
    const fid = this.metrics.get('fid');

    return {
      lcp: lcp && lcp.length > 0 ? lcp[lcp.length - 1].value : null,
      fid: fid && fid.length > 0 ? fid[fid.length - 1].value : null,
      cls: this.calculateCLS()
    };
  }

  /**
   * Calculate Cumulative Layout Shift
   */
  private calculateCLS(): number | null {
    try {
      const entries = performance.getEntriesByType('layout-shift') as any[];
      let cls = 0;

      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });

      return cls;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get slow components
   */
  public getSlowComponents(threshold: number = 16): Array<{ component: string; avgDuration: number }> {
    const componentMetrics = this.metrics.get('component-render') || [];
    const componentStats: Record<string, number[]> = {};

    componentMetrics.forEach(metric => {
      if (!componentStats[metric.component]) {
        componentStats[metric.component] = [];
      }
      componentStats[metric.component].push(metric.duration);
    });

    return Object.entries(componentStats)
      .map(([component, durations]) => ({
        component,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length
      }))
      .filter(stat => stat.avgDuration > threshold)
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Disable performance monitoring
   */
  public disable(): void {
    this.isEnabled = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): string {
    const data = {
      summary: this.getPerformanceSummary(),
      coreWebVitals: this.getCoreWebVitals(),
      slowComponents: this.getSlowComponents(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    return JSON.stringify(data, null, 2);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitoringService.getInstance();

// Auto-report performance summary in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const summary = performanceMonitor.getPerformanceSummary();
    const vitals = performanceMonitor.getCoreWebVitals();

    if (Object.keys(summary).length > 0) {
      console.group('Performance Summary');
      console.table(summary);
      console.log('Core Web Vitals:', vitals);
      console.groupEnd();
    }
  }, 30000); // Every 30 seconds
}
