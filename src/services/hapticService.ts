/**
 * Haptic Feedback Service
 * Provides tactile feedback for mobile interactions using native capabilities
 */

import { capacitorService } from './capacitorService';

export type HapticPattern = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'selection'
  | 'notification';

export type HapticSequence = {
  pattern: HapticPattern;
  delay?: number;
}[];

class HapticService {
  private isEnabled: boolean = true;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  private async checkSupport() {
    try {
      // Check if we're on a mobile device with haptic support
      if (typeof navigator !== 'undefined') {
        // Check for Web Vibration API
        this.isSupported = 'vibrate' in navigator;
        
        // Also check for Capacitor haptic support
        if (capacitorService.isNative()) {
          // Skip Capacitor haptics check for now since package isn't installed
          this.isSupported = true;
        }
      }
    } catch (error) {
      console.log('Haptic feedback not supported on this device');
      this.isSupported = false;
    }
  }

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('haptic-enabled', enabled.toString());
  }

  /**
   * Check if haptic feedback is enabled
   */
  isHapticEnabled(): boolean {
    if (!this.isSupported) return false;
    
    const stored = localStorage.getItem('haptic-enabled');
    return stored !== null ? stored === 'true' : this.isEnabled;
  }

  /**
   * Trigger haptic feedback with specific pattern
   */
  async feedback(pattern: HapticPattern = 'light') {
    if (!this.isHapticEnabled()) return;

    try {
      if (capacitorService.isNative()) {
        await this.capacitorHaptic(pattern);
      } else {
        await this.webHaptic(pattern);
      }
    } catch (error) {
      console.log('Haptic feedback failed:', error);
    }
  }

  /**
   * Play a sequence of haptic patterns
   */
  async sequence(patterns: HapticSequence) {
    if (!this.isHapticEnabled()) return;

    for (const { pattern, delay = 100 } of patterns) {
      await this.feedback(pattern);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Capacitor native haptic feedback
   */
  private async capacitorHaptic(pattern: HapticPattern) {
    try {
      // Skip Capacitor haptics implementation for now
      console.log('Capacitor haptics not available, using web vibration fallback');
      await this.webHaptic(pattern);
    } catch (error) {
      console.log('Capacitor haptic feedback failed:', error);
      // Fallback to web vibration
      await this.webHaptic(pattern);
    }
  }

  /**
   * Web vibration API haptic feedback
   */
  private async webHaptic(pattern: HapticPattern) {
    if (!('vibrate' in navigator)) return;

    const vibrationPatterns = {
      light: [10],
      medium: [20],
      heavy: [50],
      success: [10, 50, 10, 50],
      warning: [100, 50, 100],
      error: [200, 100, 200, 100, 200],
      selection: [5],
      notification: [100, 50, 100]
    };

    const vibration = vibrationPatterns[pattern] || vibrationPatterns.light;
    navigator.vibrate(vibration);
  }

  /**
   * Predefined haptic patterns for common interactions
   */
  async buttonPress() {
    await this.feedback('light');
  }

  async scanSuccess() {
    await this.sequence([
      { pattern: 'medium', delay: 50 },
      { pattern: 'success', delay: 0 }
    ]);
  }

  async scanFailure() {
    await this.sequence([
      { pattern: 'error', delay: 0 }
    ]);
  }

  async reminderAlert() {
    await this.sequence([
      { pattern: 'notification', delay: 100 },
      { pattern: 'medium', delay: 100 },
      { pattern: 'light', delay: 0 }
    ]);
  }

  async cardSwipe() {
    await this.feedback('selection');
  }

  async longPress() {
    await this.feedback('heavy');
  }

  async navigationBack() {
    await this.feedback('light');
  }

  async toggleSwitch() {
    await this.feedback('medium');
  }

  async errorOccurred() {
    await this.feedback('error');
  }

  async actionCompleted() {
    await this.feedback('success');
  }
}

export const hapticService = new HapticService();