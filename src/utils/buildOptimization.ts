// Build optimization utilities for production deployment

import React from 'react';

export const BuildOptimizer = {
  // Remove console logs in production
  removeDebugCode: () => {
    if (process.env.NODE_ENV === 'production') {
      // Override console methods in production
      const noop = () => {};
      console.log = noop;
      console.debug = noop;
      console.info = noop;
      // Keep console.warn and console.error for important messages
    }
  },

  // Lazy load components
  createLazyComponent: (importFn: () => Promise<any>) => {
    return React.lazy(importFn);
  },

  // Performance budget checker
  checkPerformanceBudget: () => {
    if ('performance' in window) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      // Alert if load time exceeds 3 seconds
      if (loadTime > 3000) {
        console.warn(`Performance budget exceeded: ${loadTime}ms load time`);
      }
    }
  },

  // Resource hints for preloading
  addResourceHints: () => {
    const hints = [
      { rel: 'dns-prefetch', href: 'https://bquxkkaipevuakmqqilk.supabase.co' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if ('crossorigin' in hint) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  },

  // Critical CSS inlining
  inlineCriticalCSS: (css: string) => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  },

  // Async CSS loading to prevent render blocking
  loadCSSAsync: (href: string, media = 'all') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => {
      link.onload = null;
      link.rel = 'stylesheet';
      link.media = media;
    };
    document.head.appendChild(link);
    
    // Fallback for browsers without preload support
    setTimeout(() => {
      if (link.rel !== 'stylesheet') {
        link.rel = 'stylesheet';
      }
    }, 3000);
  },

  // Service Worker registration
  registerServiceWorker: async () => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
};

// Auto-initialize optimizations
if (typeof window !== 'undefined') {
  BuildOptimizer.removeDebugCode();
  BuildOptimizer.addResourceHints();
  
  window.addEventListener('load', () => {
    BuildOptimizer.checkPerformanceBudget();
    BuildOptimizer.registerServiceWorker();
  });
}

export default BuildOptimizer;
