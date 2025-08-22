export interface Environment {
  isDevelopment: boolean;
  isProduction: boolean;
  isTesting: boolean;
  appVersion: string;
  apiEndpoint: string;
  enableLogging: boolean;
  enableAnalytics: boolean;
}

class EnvironmentService {
  private environment: Environment;

  constructor() {
    this.environment = this.detectEnvironment();
  }

  private detectEnvironment(): Environment {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isLovablePreview = hostname.includes('lovableproject.com');
    const isProduction = !isLocalhost && !isLovablePreview;

    return {
      isDevelopment: isLocalhost,
      isProduction: isProduction,
      isTesting: process.env.NODE_ENV === 'test',
      appVersion: '1.0.0', // Will be replaced by build process
      apiEndpoint: 'https://bquxkkaipevuakmqqilk.supabase.co',
      enableLogging: !isProduction,
      enableAnalytics: true
    };
  }

  get env(): Environment {
    return { ...this.environment };
  }

  isFeatureEnabled(feature: string): boolean {
    const featureFlags = {
      'advanced-ocr': true,
      'drug-interactions': true,
      'family-sharing': true,
      'offline-mode': true,
      'push-notifications': this.environment.isProduction,
      'debug-tools': this.environment.isDevelopment
    };

    return featureFlags[feature as keyof typeof featureFlags] ?? false;
  }

  getApiEndpoint(service?: string): string {
    if (service) {
      return `${this.environment.apiEndpoint}/functions/v1/${service}`;
    }
    return this.environment.apiEndpoint;
  }
}

export const environmentService = new EnvironmentService();