#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const platform = args[0] || 'all'; // android, ios, or all
const buildType = args[1] || 'debug'; // debug or release

console.log(`📱 Starting mobile build for ${platform} (${buildType})`);

try {
  // 1. Build web assets first
  console.log('🏗️  Building web assets...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Copy production Capacitor config
  console.log('⚙️  Setting up production Capacitor config...');
  if (buildType === 'release') {
    fs.copyFileSync('capacitor.config.production.ts', 'capacitor.config.ts');
  }

  // 3. Sync Capacitor
  console.log('🔄 Syncing Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit' });

  // 4. Add platforms if not already added
  if (platform === 'android' || platform === 'all') {
    console.log('🤖 Setting up Android...');
    try {
      execSync('npx cap add android', { stdio: 'inherit' });
    } catch (error) {
      console.log('Android platform already exists');
    }
  }

  if (platform === 'ios' || platform === 'all') {
    console.log('🍎 Setting up iOS...');
    try {
      execSync('npx cap add ios', { stdio: 'inherit' });
    } catch (error) {
      console.log('iOS platform already exists');
    }
  }

  // 5. Build native apps
  if (buildType === 'release') {
    console.log('📦 Building release APK/AAB...');
    if (platform === 'android' || platform === 'all') {
      buildAndroidRelease();
    }

    if (platform === 'ios' || platform === 'all') {
      buildiOSRelease();
    }
  } else {
    console.log('🔧 Debug builds can be done through Android Studio/Xcode');
    console.log('Run: npx cap open android (for Android Studio)');
    console.log('Run: npx cap open ios (for Xcode)');
  }

  console.log('✅ Mobile build process completed!');

} catch (error) {
  console.error('❌ Mobile build failed:', error.message);
  process.exit(1);
} finally {
  // Restore original capacitor config
  if (buildType === 'release' && fs.existsSync('capacitor.config.backup.ts')) {
    fs.copyFileSync('capacitor.config.backup.ts', 'capacitor.config.ts');
    fs.unlinkSync('capacitor.config.backup.ts');
  }
}

function buildAndroidRelease() {
  console.log('🤖 Building Android release...');
  
  // Check if keystore exists
  const keystorePath = path.join('android', 'keystores', 'release.keystore');
  if (!fs.existsSync(keystorePath)) {
    console.log('⚠️  No release keystore found. Generating debug-signed APK...');
    execSync('cd android && ./gradlew assembleDebug', { stdio: 'inherit' });
    console.log('📦 Debug APK generated: android/app/build/outputs/apk/debug/app-debug.apk');
  } else {
    execSync('cd android && ./gradlew assembleRelease', { stdio: 'inherit' });
    console.log('📦 Release APK generated: android/app/build/outputs/apk/release/app-release.apk');
  }

  // Generate AAB for Play Store
  try {
    execSync('cd android && ./gradlew bundleRelease', { stdio: 'inherit' });
    console.log('📦 Release AAB generated: android/app/build/outputs/bundle/release/app-release.aab');
  } catch (error) {
    console.warn('⚠️  AAB generation failed, APK only');
  }
}

function buildiOSRelease() {
  console.log('🍎 Building iOS release...');
  
  try {
    // Archive the iOS app
    execSync(`
      cd ios/App &&
      xcodebuild -workspace App.xcworkspace 
                 -scheme App 
                 -configuration Release 
                 -destination generic/platform=iOS 
                 -archivePath ./build/CareCapsule.xcarchive 
                 archive
    `, { stdio: 'inherit' });

    console.log('📦 iOS archive generated: ios/App/build/CareCapsule.xcarchive');
    console.log('ℹ️  Use Xcode Organizer to export IPA for distribution');

  } catch (error) {
    console.warn('⚠️  iOS build requires Xcode. Please build manually through Xcode.');
    console.log('Run: npx cap open ios');
  }
}

function generateSigningInstructions() {
  const instructions = `
# Mobile App Signing Instructions

## Android Signing

1. Generate a release keystore:
   keytool -genkey -v -keystore android/keystores/release.keystore -alias carecapsule -keyalg RSA -keysize 2048 -validity 10000

2. Update android/app/build.gradle with signing config:
   signingConfigs {
     release {
       storeFile file('../keystores/release.keystore')
       storePassword 'your_store_password'
       keyAlias 'carecapsule'
       keyPassword 'your_key_password'
     }
   }

## iOS Signing

1. Set up certificates in Apple Developer Console
2. Create provisioning profiles for distribution
3. Configure signing in Xcode project settings
4. Use Xcode Organizer for IPA export

## Play Store Upload

1. Use the generated AAB file: android/app/build/outputs/bundle/release/app-release.aab
2. Upload through Google Play Console
3. Complete store listing and content rating

## App Store Upload

1. Export IPA through Xcode Organizer
2. Use Application Loader or Xcode to upload
3. Complete App Store Connect listing
`;

  fs.writeFileSync('MOBILE_SIGNING.md', instructions);
  console.log('📄 Signing instructions saved to MOBILE_SIGNING.md');
}