import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n' // Initialize i18n
import { environmentService } from './services/environmentService'
import { pwaEnhancementService } from './services/pwaEnhancementService'
import { mobileOptimizationService } from './services/mobileOptimizationService'

// Initialize PWA enhancements and mobile optimizations
pwaEnhancementService.init()
mobileOptimizationService.init()

// Initialize OneSignal if enabled and ensure user registration
const initializeOneSignal = async () => {
  try {
    if (environmentService.isFeatureEnabled('push-notifications')) {
      const { oneSignalService } = await import('./services/oneSignalService');
      
      // Wrap OneSignal initialization in try-catch to prevent app crashes
      try {
        const success = await oneSignalService.initialize(environmentService.env.oneSignalAppId);
        if (success) {
          console.log('OneSignal initialized successfully');
          
          // Check if user is already authenticated and register them
          try {
            const { data: { session } } = await (await import('./integrations/supabase/client')).supabase.auth.getSession();
            if (session?.user) {
              setTimeout(async () => {
                try {
                  await oneSignalService.registerUser(session.user.id);
                  console.log('Existing user registered with OneSignal');
                } catch (error) {
                  console.error('Failed to register existing user with OneSignal:', error);
                  // Don't throw - this is not critical for app functionality
                }
              }, 2000); // Give OneSignal more time to fully initialize
            }
          } catch (sessionError) {
            console.error('Failed to get session for OneSignal registration:', sessionError);
            // Don't throw - this is not critical
          }
        } else {
          console.warn('OneSignal initialization failed - continuing without push notifications');
        }
      } catch (oneSignalError) {
        console.error('OneSignal service error:', oneSignalError);
        // Don't throw - app should continue to work without OneSignal
      }
    }
  } catch (error) {
    console.error('Failed to initialize OneSignal module:', error);
    // Don't throw - app should continue to work without push notifications
  }
};

// Initialize OneSignal after DOM is ready - but don't block app initialization
setTimeout(() => {
  initializeOneSignal().catch(error => {
    console.error('OneSignal initialization failed:', error);
    // Don't throw - this should not crash the app
  });
}, 1000); // Delay to ensure app loads first

createRoot(document.getElementById("root")!).render(<App />);
