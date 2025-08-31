import React, { useEffect, useState } from 'react';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Only run in development or when explicitly enabled
    const isDevelopment = import.meta.env?.MODE === 'development' || 
                         typeof window !== 'undefined' && window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      // Monitor First Contentful Paint (FCP)
      if ('PerformanceObserver' in window) {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
            console.log('FCP:', fcpEntry.startTime);
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Monitor Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
            console.log('LCP:', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
            console.log('FID:', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Monitor Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          setMetrics(prev => ({ ...prev, cls: clsValue }));
          console.log('CLS:', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Monitor Time to First Byte (TTFB)
        const navigationEntry = performance.getEntriesByType('navigation')[0];
        if (navigationEntry) {
          const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
          setMetrics(prev => ({ ...prev, ttfb }));
          console.log('TTFB:', ttfb);
        }

        return () => {
          fcpObserver.disconnect();
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
        };
      }
    }
  }, []);

  // Calculate performance score
  const getPerformanceScore = () => {
    let score = 100;
    
    // FCP scoring (target: < 1.8s)
    if (metrics.fcp > 1800) score -= 20;
    else if (metrics.fcp > 1000) score -= 10;
    
    // LCP scoring (target: < 2.5s)
    if (metrics.lcp > 2500) score -= 20;
    else if (metrics.lcp > 1000) score -= 10;
    
    // FID scoring (target: < 100ms)
    if (metrics.fid > 100) score -= 20;
    else if (metrics.fid > 50) score -= 10;
    
    // CLS scoring (target: < 0.1)
    if (metrics.cls > 0.1) score -= 20;
    else if (metrics.cls > 0.05) score -= 10;
    
    // TTFB scoring (target: < 600ms)
    if (metrics.ttfb > 600) score -= 10;
    
    return Math.max(0, score);
  };

  const performanceScore = getPerformanceScore();

  // Only show in development
  const isDevelopment = import.meta.env?.MODE === 'development' || 
                       typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  if (!isDevelopment) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      {/* Header with toggle button */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-800">Performance</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title={isExpanded ? 'Minimize' : 'Maximize'}
        >
          {isExpanded ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Minimized view - just score */}
      {!isExpanded && (
        <div className="p-2">
          <div className="text-center">
            <div className={`text-lg font-bold ${
              performanceScore >= 90 ? 'text-green-600' : 
              performanceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {performanceScore}/100
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        </div>
      )}
      
      {/* Expanded view - full metrics */}
      {isExpanded && (
        <div className="p-3 max-w-xs">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>FCP:</span>
              <span className={metrics.fcp && metrics.fcp < 1000 ? 'text-green-600' : 'text-red-600'}>
                {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>LCP:</span>
              <span className={metrics.lcp && metrics.lcp < 2500 ? 'text-green-600' : 'text-red-600'}>
                {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>FID:</span>
              <span className={metrics.fid && metrics.fid < 100 ? 'text-green-600' : 'text-red-600'}>
                {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>CLS:</span>
              <span className={metrics.cls && metrics.cls < 0.1 ? 'text-green-600' : 'text-red-600'}>
                {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>TTFB:</span>
              <span className={metrics.ttfb && metrics.ttfb < 600 ? 'text-red-600' : 'text-green-600'}>
                {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'N/A'}
              </span>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Score:</span>
                <span className={
                  performanceScore >= 90 ? 'text-green-600' : 
                  performanceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                }>
                  {performanceScore}/100
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
