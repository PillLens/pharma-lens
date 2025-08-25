import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n' // Initialize i18n
import { environmentService } from './services/environmentService'

// Initialize OneSignal if enabled
const initializeOneSignal = async () => {
  try {
    if (environmentService.isFeatureEnabled('push-notifications')) {
      const { oneSignalService } = await import('./services/oneSignalService');
      const success = await oneSignalService.initialize(environmentService.env.oneSignalAppId);
      if (success) {
        console.log('OneSignal initialized successfully');
      } else {
        console.warn('OneSignal initialization failed');
      }
    }
  } catch (error) {
    console.error('Failed to initialize OneSignal:', error);
  }
};

// Initialize OneSignal after DOM is ready
initializeOneSignal();

createRoot(document.getElementById("root")!).render(<App />);
