import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraPhoto {
  webPath?: string;
  format: string;
  saved: boolean;
}

class CapacitorService {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  getPlatform(): string {
    return Capacitor.getPlatform();
  }

  async takePicture(): Promise<CameraPhoto | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return {
        webPath: photo.dataUrl,
        format: photo.format,
        saved: false
      };
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }

  async selectFromGallery(): Promise<CameraPhoto | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      return {
        webPath: photo.dataUrl,
        format: photo.format,
        saved: false
      };
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      return null;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Performance optimization for mobile
  optimizeForMobile(): void {
    if (this.isNative()) {
      // Disable certain features on mobile for better performance
      document.body.classList.add('mobile-optimized');
      
      // Reduce animation duration
      document.documentElement.style.setProperty('--animation-duration', '200ms');
      
      // Add mobile-specific CSS classes
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
    }
  }

  // Handle app lifecycle events
  setupAppLifecycleListeners(): void {
    if (this.isNative()) {
      document.addEventListener('pause', () => {
        console.log('App paused');
        // Save any pending data
      });

      document.addEventListener('resume', () => {
        console.log('App resumed');
        // Refresh data if needed
      });
    }
  }

  // Network status for mobile
  getNetworkStatus(): Promise<{ connected: boolean; connectionType: string }> {
    return new Promise((resolve) => {
      if (navigator.onLine) {
        resolve({ connected: true, connectionType: 'unknown' });
      } else {
        resolve({ connected: false, connectionType: 'none' });
      }
    });
  }

  // Device info for analytics
  async getDeviceInfo(): Promise<Record<string, any>> {
    const info: Record<string, any> = {
      platform: this.getPlatform(),
      isNative: this.isNative(),
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio
      }
    };

    // Add more device-specific info if available
    if ('hardwareConcurrency' in navigator) {
      info.cores = navigator.hardwareConcurrency;
    }

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      info.network = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }

    return info;
  }
}

export const capacitorService = new CapacitorService();