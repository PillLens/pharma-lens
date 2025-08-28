/**
 * PWA Enhancement Service
 * Provides native-like features for mobile web apps
 */

export class PWAEnhancementService {
  private static instance: PWAEnhancementService;

  static getInstance(): PWAEnhancementService {
    if (!PWAEnhancementService.instance) {
      PWAEnhancementService.instance = new PWAEnhancementService();
    }
    return PWAEnhancementService.instance;
  }

  /**
   * Initialize PWA features
   */
  init() {
    this.setupInstallPrompt();
    this.enhanceScrolling();
    this.setupTouchFeedback();
    this.optimizeViewport();
  }

  /**
   * Setup install prompt for PWA
   */
  private setupInstallPrompt() {
    let deferredPrompt: any = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      deferredPrompt = e;
      
      // Show custom install button or banner
      this.showInstallBanner(deferredPrompt);
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      deferredPrompt = null;
    });
  }

  /**
   * Show custom install banner
   */
  private showInstallBanner(deferredPrompt: any) {
    // Only show if not already installed and user hasn't dismissed
    if (this.isStandalone() || localStorage.getItem('pwa-install-dismissed')) {
      return;
    }

    const banner = document.createElement('div');
    banner.className = 'fixed bottom-20 left-4 right-4 z-50 bg-background border border-border rounded-lg p-4 shadow-lg animate-slide-up';
    banner.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div>
            <div class="font-medium text-sm">Install CareCapsule</div>
            <div class="text-xs text-muted-foreground">Get the full app experience</div>
          </div>
        </div>
        <div class="flex gap-2">
          <button id="dismiss-install" class="text-xs px-3 py-2 text-muted-foreground">Dismiss</button>
          <button id="install-pwa" class="text-xs px-3 py-2 bg-primary text-primary-foreground rounded-md">Install</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Handle install button
    banner.querySelector('#install-pwa')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User ${outcome} the A2HS prompt`);
        deferredPrompt = null;
      }
      banner.remove();
    });

    // Handle dismiss button
    banner.querySelector('#dismiss-install')?.addEventListener('click', () => {
      localStorage.setItem('pwa-install-dismissed', 'true');
      banner.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  }

  /**
   * Check if app is running in standalone mode
   */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Enhance scrolling behavior for mobile
   */
  private enhanceScrolling() {
    // Add momentum scrolling for iOS with proper TypeScript handling
    const docStyle = document.documentElement.style as any;
    docStyle.webkitOverflowScrolling = 'touch';
    
    // Prevent overscroll on mobile
    document.body.addEventListener('touchmove', (e) => {
      if ((e.target as Element).closest('.scroll-area')) {
        return; // Allow scrolling in designated areas
      }
      
      const element = e.target as Element;
      const scrollable = element.closest('[data-scrollable]');
      if (!scrollable) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  /**
   * Setup haptic feedback for interactions
   */
  private setupTouchFeedback() {
    // Add touch feedback to interactive elements
    const addTouchFeedback = (selector: string) => {
      document.addEventListener('touchstart', (e) => {
        const target = (e.target as Element).closest(selector);
        if (target) {
          target.classList.add('active:scale-95');
          
          // Haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(10);
          }
        }
      });
    };

    addTouchFeedback('button');
    addTouchFeedback('[role="button"]');
    addTouchFeedback('.clickable');
  }

  /**
   * Optimize viewport for mobile
   */
  private optimizeViewport() {
    // Set viewport height property for mobile browsers
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 100);
    });
  }

  /**
   * Add app shortcuts for PWA
   */
  registerShortcuts() {
    if ('serviceWorker' in navigator && 'shortcuts' in navigator) {
      // Shortcuts are defined in manifest.json
      console.log('App shortcuts supported');
    }
  }

  /**
   * Setup offline notification
   */
  setupOfflineNotification() {
    window.addEventListener('online', () => {
      this.showToast('Back online!', 'success');
    });

    window.addEventListener('offline', () => {
      this.showToast('You are offline', 'warning');
    });
  }

  /**
   * Show native-like toast notification
   */
  private showToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-4 right-4 z-50 p-3 rounded-lg shadow-lg animate-slide-down ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' :
      'bg-red-500 text-white'
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('animate-slide-up');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Setup pull-to-refresh functionality
   */
  setupPullToRefresh(callback: () => Promise<void>) {
    let startY = 0;
    let isRefreshing = false;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (isRefreshing || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 100) {
        // Show refresh indicator
        this.showRefreshIndicator();
      }
    });

    document.addEventListener('touchend', async (e) => {
      if (isRefreshing || window.scrollY > 0) return;

      const endY = e.changedTouches[0].clientY;
      const pullDistance = endY - startY;

      if (pullDistance > 100) {
        isRefreshing = true;
        try {
          await callback();
        } finally {
          isRefreshing = false;
          this.hideRefreshIndicator();
        }
      }
    });
  }

  private showRefreshIndicator() {
    // Implementation for refresh indicator
  }

  private hideRefreshIndicator() {
    // Implementation for hiding refresh indicator
  }
}

export const pwaEnhancementService = PWAEnhancementService.getInstance();