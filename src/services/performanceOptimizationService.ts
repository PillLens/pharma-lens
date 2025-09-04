// Performance optimization service for production builds
export class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private initialized = false;

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Add resource hints
    this.addResourceHints();
    
    // Monitor performance metrics
    this.setupPerformanceMonitoring();
    
    // Optimize images on viewport entry
    this.setupLazyLoading();
    
    // Preload critical resources
    this.preloadCriticalResources();
  }

  private addResourceHints() {
    const hints = [
      { rel: 'dns-prefetch', href: 'https://bquxkkaipevuakmqqilk.supabase.co' },
      { rel: 'dns-prefetch', href: 'https://onesignal.com' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
      { rel: 'preconnect', href: 'https://onesignal.com' },
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossorigin) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  private setupPerformanceMonitoring() {
    if (!('performance' in window)) return;

    // Monitor Core Web Vitals
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const metrics = {
          fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
          lcp: this.getLCP(),
          cls: this.getCLS(),
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
        };

        // Log performance metrics (remove in production)
        if (process.env.NODE_ENV === 'development') {
          console.log('Performance Metrics:', metrics);
        }

        // Send to analytics if available
        this.sendPerformanceMetrics(metrics);
      }, 1000);
    });
  }

  private getLCP(): number | undefined {
    let lcp = 0;
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcp = lastEntry.startTime;
    });
    
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      return lcp;
    } catch (e) {
      return undefined;
    }
  }

  private getCLS(): number | undefined {
    let cls = 0;
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }
    });
    
    try {
      observer.observe({ entryTypes: ['layout-shift'] });
      return cls;
    } catch (e) {
      return undefined;
    }
  }

  private setupLazyLoading() {
    // Add intersection observer for images
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    // Observe all images with data-src
    setTimeout(() => {
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }, 100);
  }

  private preloadCriticalResources() {
    const criticalResources = [
      '/assets/hero-optimized.webp',
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.webp') ? 'image' : 'fetch';
      document.head.appendChild(link);
    });
  }

  private sendPerformanceMetrics(metrics: any) {
    // This could send to analytics service
    // For now, just store in sessionStorage for debugging
    sessionStorage.setItem('performanceMetrics', JSON.stringify(metrics));
  }

  // Optimize bundle loading
  prefetchChunk(chunkName: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/assets/${chunkName}`;
    document.head.appendChild(link);
  }

  // Critical CSS inlining
  inlineCriticalCSS(css: string) {
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.appendChild(style);
  }
}

export const performanceOptimizationService = PerformanceOptimizationService.getInstance();