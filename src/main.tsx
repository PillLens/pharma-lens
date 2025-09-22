import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n' // Initialize i18n
import { environmentService } from './services/environmentService'
import { pwaEnhancementService } from './services/pwaEnhancementService'
import { mobileOptimizationService } from './services/mobileOptimizationService'
import { performanceOptimizationService } from './services/performanceOptimizationService'

// Initialize PWA enhancements and mobile optimizations
pwaEnhancementService.init()
mobileOptimizationService.init()
performanceOptimizationService.init()

// Initialize unified notification manager (lazy loaded)
const initializeNotifications = async () => {
  try {
    if (environmentService.isFeatureEnabled('push-notifications')) {
        // Lazy load notification manager only when needed and avoid duplication
        const { unifiedNotificationManager } = await import('./services/unifiedNotificationManager');
        
        // Prevent multiple initializations
        if (!unifiedNotificationManager.isServiceInitialized()) {
          await unifiedNotificationManager.initialize();
          console.log('Notification manager initialized successfully');
        }
    }
  } catch (error) {
    console.error('Failed to initialize notification manager:', error);
  }
};

// Initialize notifications after DOM is ready
window.addEventListener('load', initializeNotifications);

createRoot(document.getElementById("root")!).render(<App />);
