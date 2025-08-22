import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a2b03c66e69a49a495741cb9e4a8bd22',
  appName: 'care-capsule-scribe',
  webDir: 'dist',
  server: {
    url: 'https://a2b03c66-e69a-49a4-9574-1cb9e4a8bd22.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;