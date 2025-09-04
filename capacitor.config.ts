import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a2b03c66e69a49a495741cb9e4a8bd22',
  appName: 'PillLens',
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
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#ffffff',
      overlaysWebView: true
    },
    App: {
      statusBarStyle: 'light'
    }
  },
  android: {
    buildOptions: {
      keystorePath: 'android/keystores/release.keystore',
      keystoreAlias: 'pilllens',
      releaseType: 'AAB'
    }
  },
  ios: {
    scheme: 'PillLens'
  }
};

export default config;