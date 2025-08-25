import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n' // Initialize i18n
import { environmentService } from './services/environmentService'

// Initialize OneSignal if enabled and ensure user registration
const initializeOneSignal = async () => {
  try {
    if (environmentService.isFeatureEnabled('push-notifications')) {
      const { oneSignalService } = await import('./services/oneSignalService');
      const success = await oneSignalService.initialize(environmentService.env.oneSignalAppId);
      if (success) {
        console.log('OneSignal initialized successfully');
        
        // Check if user is already authenticated and register them
        const { data: { session } } = await (await import('./integrations/supabase/client')).supabase.auth.getSession();
        if (session?.user) {
          setTimeout(async () => {
            try {
              await oneSignalService.registerUser(session.user.id);
              console.log('Existing user registered with OneSignal');
            } catch (error) {
              console.error('Failed to register existing user with OneSignal:', error);
            }
          }, 2000); // Give OneSignal more time to fully initialize
        }
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
