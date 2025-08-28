/**
 * Mobile Optimization Service
 * Handles touch interactions, gestures, and mobile-specific features
 */

export class MobileOptimizationService {
  private static instance: MobileOptimizationService;

  static getInstance(): MobileOptimizationService {
    if (!MobileOptimizationService.instance) {
      MobileOptimizationService.instance = new MobileOptimizationService();
    }
    return MobileOptimizationService.instance;
  }

  /**
   * Initialize mobile optimizations
   */
  init() {
    this.setupTouchOptimizations();
    this.setupGestureHandling();
    this.optimizeScrolling();
    this.setupHapticFeedback();
    this.optimizeInputs();
  }

  /**
   * Setup touch optimizations
   */
  private setupTouchOptimizations() {
    // Prevent 300ms click delay on mobile
    document.documentElement.style.touchAction = 'manipulation';
    
    // Add touch states to interactive elements
    this.addTouchStates();
    
    // Optimize button sizes for mobile
    this.optimizeButtonSizes();
  }

  /**
   * Add touch states to interactive elements
   */
  private addTouchStates() {
    const touchableSelectors = [
      'button',
      '[role="button"]',
      '.clickable',
      '.mobile-card',
      '.touch-target'
    ];

    touchableSelectors.forEach(selector => {
      document.addEventListener('touchstart', (e) => {
        const target = (e.target as Element).closest(selector);
        if (target && !target.classList.contains('no-touch-feedback')) {
          target.classList.add('touch-active');
          
          // Add haptic feedback
          this.triggerHapticFeedback('light');
        }
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        const target = (e.target as Element).closest(selector);
        if (target) {
          // Delayed removal for visual feedback
          setTimeout(() => {
            target.classList.remove('touch-active');
          }, 150);
        }
      }, { passive: true });

      document.addEventListener('touchcancel', (e) => {
        const target = (e.target as Element).closest(selector);
        if (target) {
          target.classList.remove('touch-active');
        }
      }, { passive: true });
    });
  }

  /**
   * Optimize button sizes for mobile touch
   */
  private optimizeButtonSizes() {
    const style = document.createElement('style');
    style.textContent = `
      .touch-active {
        transform: scale(0.98);
        opacity: 0.8;
        transition: all 0.1s ease-out;
      }
      
      /* Ensure minimum touch target size */
      button, [role="button"], .clickable {
        min-height: 44px;
        min-width: 44px;
      }
      
      /* Mobile-specific button styles */
      @media (max-width: 768px) {
        .mobile-button {
          padding: 12px 16px;
          font-size: 16px;
          border-radius: 12px;
        }
        
        .mobile-card {
          border-radius: 16px;
          padding: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup gesture handling
   */
  private setupGestureHandling() {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!startX || !startY) return;

      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;

      const diffX = startX - currentX;
      const diffY = startY - currentY;

      // Detect swipe gestures
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > 100) {
          const direction = diffX > 0 ? 'left' : 'right';
          this.handleSwipe(direction, e.target as Element);
        }
      } else {
        // Vertical swipe
        if (Math.abs(diffY) > 100) {
          const direction = diffY > 0 ? 'up' : 'down';
          this.handleSwipe(direction, e.target as Element);
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      startX = 0;
      startY = 0;
      currentX = 0;
      currentY = 0;
    }, { passive: true });
  }

  /**
   * Handle swipe gestures
   */
  private handleSwipe(direction: 'left' | 'right' | 'up' | 'down', target: Element) {
    const swipeableCard = target.closest('.swipeable-card');
    if (swipeableCard) {
      this.handleCardSwipe(swipeableCard, direction);
      return;
    }

    // Global swipe handling for navigation
    if (direction === 'right' && window.scrollX === 0) {
      // Back navigation gesture
      this.handleBackGesture();
    }
  }

  /**
   * Handle card swipe actions
   */
  private handleCardSwipe(card: Element, direction: 'left' | 'right' | 'up' | 'down') {
    const swipeActions = card.getAttribute('data-swipe-actions');
    if (!swipeActions) return;

    const actions = JSON.parse(swipeActions);
    const action = actions[direction];
    
    if (action) {
      // Trigger haptic feedback
      this.triggerHapticFeedback('medium');
      
      // Dispatch custom event
      card.dispatchEvent(new CustomEvent('swipeAction', {
        detail: { action, direction }
      }));
    }
  }

  /**
   * Handle back gesture
   */
  private handleBackGesture() {
    // Check if we can go back
    if (history.length > 1) {
      history.back();
      this.triggerHapticFeedback('light');
    }
  }

  /**
   * Optimize scrolling for mobile
   */
  private optimizeScrolling() {
    // Add momentum scrolling
    document.body.style.webkitOverflowScrolling = 'touch';
    document.body.style.overflowScrolling = 'touch';

    // Prevent scroll chaining
    const scrollAreas = document.querySelectorAll('.scroll-area');
    scrollAreas.forEach(area => {
      area.addEventListener('touchstart', (e) => {
        const scrollTop = (area as HTMLElement).scrollTop;
        const scrollHeight = (area as HTMLElement).scrollHeight;
        const height = (area as HTMLElement).clientHeight;

        if (scrollTop === 0) {
          (area as HTMLElement).scrollTop = 1;
        } else if (scrollTop + height === scrollHeight) {
          (area as HTMLElement).scrollTop = scrollHeight - height - 1;
        }
      });
    });
  }

  /**
   * Setup haptic feedback
   */
  private setupHapticFeedback() {
    // Register haptic patterns
    this.hapticPatterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [100, 100, 100],
      notification: [50, 30, 50]
    };
  }

  private hapticPatterns: Record<string, number[]> = {};

  /**
   * Trigger haptic feedback
   */
  triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'notification' = 'light') {
    if ('vibrate' in navigator) {
      const pattern = this.hapticPatterns[type] || this.hapticPatterns.light;
      navigator.vibrate(pattern);
    }
  }

  /**
   * Optimize input fields for mobile
   */
  private optimizeInputs() {
    const style = document.createElement('style');
    style.textContent = `
      /* Prevent zoom on iOS when focusing inputs */
      @media screen and (max-width: 768px) {
        input[type="text"],
        input[type="email"],
        input[type="tel"],
        input[type="password"],
        textarea,
        select {
          font-size: 16px !important;
        }
      }
      
      /* Better mobile form styling */
      .mobile-input {
        padding: 16px;
        border-radius: 12px;
        border: 2px solid #e2e8f0;
        font-size: 16px;
        transition: border-color 0.2s ease;
      }
      
      .mobile-input:focus {
        border-color: #3b82f6;
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    `;
    document.head.appendChild(style);

    // Add mobile-specific input behaviors
    document.addEventListener('focusin', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
        // Scroll input into view on mobile
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });
  }

  /**
   * Setup pull-to-refresh
   */
  setupPullToRefresh(element: HTMLElement, onRefresh: () => Promise<void>) {
    let startY = 0;
    let pullDistance = 0;
    let isRefreshing = false;
    let canPull = false;

    element.addEventListener('touchstart', (e) => {
      if (element.scrollTop === 0) {
        canPull = true;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
      if (!canPull || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      pullDistance = Math.max(0, currentY - startY);

      if (pullDistance > 0) {
        e.preventDefault();
        
        // Visual feedback
        const pullRatio = Math.min(pullDistance / 100, 1);
        element.style.transform = `translateY(${pullDistance * 0.5}px)`;
        element.style.opacity = `${1 - pullRatio * 0.2}`;

        if (pullDistance > 100) {
          this.triggerHapticFeedback('light');
        }
      }
    });

    element.addEventListener('touchend', async () => {
      if (!canPull || isRefreshing) return;

      if (pullDistance > 100) {
        isRefreshing = true;
        this.triggerHapticFeedback('success');
        
        try {
          await onRefresh();
        } finally {
          isRefreshing = false;
        }
      }

      // Reset visual state
      element.style.transform = '';
      element.style.opacity = '';
      canPull = false;
      pullDistance = 0;
    });
  }

  /**
   * Add long press handling
   */
  setupLongPress(element: HTMLElement, onLongPress: () => void, duration = 500) {
    let pressTimer: NodeJS.Timeout;

    element.addEventListener('touchstart', (e) => {
      pressTimer = setTimeout(() => {
        this.triggerHapticFeedback('medium');
        onLongPress();
      }, duration);
    }, { passive: true });

    element.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
    }, { passive: true });

    element.addEventListener('touchmove', () => {
      clearTimeout(pressTimer);
    }, { passive: true });
  }
}

export const mobileOptimizationService = MobileOptimizationService.getInstance();