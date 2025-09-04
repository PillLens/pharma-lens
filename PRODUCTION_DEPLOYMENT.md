# Production Deployment Guide

This guide covers the complete production deployment infrastructure implemented for PillLens.

## 🚀 Overview

The production deployment system includes:

- **Environment Configuration**: Development vs production environment management
- **Error Monitoring**: Comprehensive error tracking and crash reporting
- **Performance Monitoring**: Real-time performance metrics and optimization
- **Mobile App Store Builds**: Production-ready APK/IPA generation
- **Build Optimization**: Service workers, caching, and performance budgets

## 📋 Quick Start

### 1. Environment Setup

The app automatically detects the environment:
- **Development**: `localhost` or `127.0.0.1`
- **Production**: All other domains

Environment configuration is managed by `src/services/environmentService.ts`.

### 2. Production Build

```bash
# Standard Vite build
npm run build

# Production build with optimizations
npm run build:production

# Mobile builds
npm run build:mobile          # Both platforms
npm run build:mobile:android  # Android only
npm run build:mobile:ios      # iOS only
```

### 3. Mobile Setup

First-time setup for mobile platforms:

```bash
# Sync Capacitor
npm run cap:sync

# Open in native IDEs
npm run cap:android  # Android Studio
npm run cap:ios      # Xcode
```

## 🔧 Production Infrastructure

### Environment Service (`src/services/environmentService.ts`)

Manages environment detection and feature flags:

```typescript
import { environmentService } from '@/services/environmentService';

// Check environment
if (environmentService.env.isProduction) {
  // Production-only code
}

// Feature flags
if (environmentService.isFeatureEnabled('push-notifications')) {
  // Enable notifications
}
```

### Error Monitoring (`src/services/errorMonitoringService.ts`)

Comprehensive error tracking:

- **Global error handling**: JavaScript errors, promise rejections
- **React error boundaries**: Component-level error capture
- **Offline queueing**: Errors stored locally when offline
- **Structured logging**: Replace all `console.error` calls

```typescript
import { errorMonitoringService } from '@/services/errorMonitoringService';

// Log different severity levels
errorMonitoringService.logError('Critical error occurred', { context });
errorMonitoringService.logWarning('Warning message', { data });
errorMonitoringService.logInfo('Info message');
errorMonitoringService.logDebug('Debug info'); // Development only
```

### Performance Monitoring (`src/services/performanceMonitoringService.ts`)

Real-time performance tracking:

- **Load time metrics**: App startup, page loads
- **Scan performance**: OCR accuracy, processing times
- **Memory usage**: Heap size monitoring
- **API response times**: Network performance

```typescript
import { performanceMonitoringService } from '@/services/performanceMonitoringService';

// Track scan performance
performanceMonitoringService.trackScanPerformance({
  scanMethod: 'camera',
  processingTime: 1500,
  confidence: 0.95,
  success: true,
  deviceType: 'mobile'
});

// Track API calls
performanceMonitoringService.trackApiCall('/api/medications', 340, true);
```

### Error Boundary (`src/components/ErrorBoundary.tsx`)

React error boundary with:
- **Graceful error UI**: User-friendly error displays
- **Error reporting**: Automatic error capture and reporting
- **Recovery options**: Retry, reload, report issue buttons
- **Development details**: Error IDs and stack traces in dev mode

## 📱 Mobile Production Builds

### Android

1. **Release Build**:
```bash
npm run build:mobile:android
```

2. **Signing Setup** (first time):
```bash
# Generate keystore
keytool -genkey -v -keystore android/keystores/release.keystore -alias pilllens -keyalg RSA -keysize 2048 -validity 10000

# Update android/app/build.gradle with signing config
```

3. **Outputs**:
   - `android/app/build/outputs/apk/release/app-release.apk` (APK)
   - `android/app/build/outputs/bundle/release/app-release.aab` (Play Store)

### iOS

1. **Setup Requirements**:
   - macOS with Xcode
   - Apple Developer account
   - Provisioning profiles

2. **Build**:
```bash
npm run build:mobile:ios
```

3. **Manual Steps**:
   - Open in Xcode: `npm run cap:ios`
   - Configure signing & certificates
   - Archive & export IPA

## 🔒 Security Features

### Security Headers

Production builds include security headers:
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: MIME type protection
- **Content Security Policy**: XSS protection
- **Referrer Policy**: Control referrer information

### Data Protection

- **Row Level Security**: All database tables use RLS
- **Error sanitization**: No sensitive data in error logs
- **Offline data encryption**: Local storage security

## 📊 Monitoring Dashboard

Access the production dashboard at `/dashboard` (admin only):

### Key Metrics
- **App Uptime**: Availability monitoring
- **Performance Score**: Overall app performance (0-100)
- **Scan Accuracy**: OCR success rates
- **Error Rate**: Application stability metrics

### Performance Tracking
- **Load Times**: Page and app startup metrics
- **API Response**: Backend performance
- **Memory Usage**: Resource consumption

### Error Analytics
- **Error Rate**: Application error frequency
- **Crash Reports**: Mobile app stability
- **Critical Issues**: High-priority problems

## 🚦 Production Checklist

Before deploying to production:

### Environment
- [ ] Environment detection working
- [ ] Feature flags configured
- [ ] Logging levels appropriate

### Security
- [ ] All console.error replaced with error monitoring
- [ ] Security headers configured
- [ ] RLS policies tested
- [ ] Sensitive data sanitized

### Performance
- [ ] Load times < 3 seconds
- [ ] Service worker registered
- [ ] Critical CSS inlined
- [ ] Resource hints added

### Mobile
- [ ] Capacitor sync completed
- [ ] Native permissions configured
- [ ] Push notifications tested
- [ ] App store metadata ready

### Monitoring
- [ ] Error monitoring active
- [ ] Performance tracking enabled
- [ ] Dashboard accessible
- [ ] Alerting configured

## 📈 Performance Optimization

### Build Optimizations
- **Code splitting**: Lazy-loaded routes and components
- **Tree shaking**: Remove unused code
- **Minification**: Compressed assets
- **Compression**: Gzip/Brotli enabled

### Runtime Optimizations
- **Service Worker**: Offline functionality and caching
- **Resource Hints**: DNS prefetch, preconnect
- **Critical CSS**: Above-the-fold styling
- **Performance Budget**: 3-second load time limit

### Mobile Optimizations
- **Native performance**: Capacitor optimizations
- **Battery efficiency**: Background task management
- **Memory usage**: Heap size monitoring
- **Network efficiency**: Request batching

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Clear `node_modules` and reinstall
   - Verify TypeScript configuration

2. **Mobile Build Issues**
   - Ensure Capacitor is synced: `npx cap sync`
   - Check native dependencies
   - Verify platform-specific requirements

3. **Performance Issues**
   - Check performance budget alerts
   - Monitor memory usage
   - Analyze bundle size

### Error Resolution

1. **Check Error Dashboard**: Review error reports and patterns
2. **Performance Monitoring**: Identify bottlenecks
3. **Console Logs**: Development environment debugging
4. **Network Analysis**: API response times

## 📞 Support

For production deployment issues:
1. Check monitoring dashboard
2. Review error reports
3. Analyze performance metrics
4. Contact development team with error IDs

---

## 🔄 Continuous Deployment

This infrastructure is designed for:
- **Automated builds**: CI/CD pipeline integration
- **Staged deployments**: Development → staging → production
- **Rollback capabilities**: Quick recovery from issues
- **Monitoring integration**: Real-time health checks

The production deployment system ensures PillLens maintains high availability, performance, and user experience across web and mobile platforms.