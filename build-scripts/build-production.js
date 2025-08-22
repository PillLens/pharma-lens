#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PRODUCTION_CONFIG = {
  NODE_ENV: 'production',
  VITE_APP_VERSION: process.env.npm_package_version || '1.0.0',
  VITE_BUILD_TIME: new Date().toISOString()
};

console.log('🚀 Starting production build...');

try {
  // 1. Clean dist directory
  console.log('📁 Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // 2. Set environment variables
  console.log('🔧 Setting production environment...');
  Object.entries(PRODUCTION_CONFIG).forEach(([key, value]) => {
    process.env[key] = value;
  });

  // 3. Build the project
  console.log('🏗️  Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  // 4. Generate build info
  console.log('📄 Generating build info...');
  const buildInfo = {
    version: PRODUCTION_CONFIG.VITE_APP_VERSION,
    buildTime: PRODUCTION_CONFIG.VITE_BUILD_TIME,
    environment: 'production',
    gitCommit: getGitCommit(),
    nodeVersion: process.version,
    buildSize: getBuildSize()
  };

  fs.writeFileSync(
    path.join('dist', 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );

  // 5. Copy additional production files
  console.log('📋 Copying production files...');
  copyProductionFiles();

  // 6. Generate security headers file
  console.log('🔒 Generating security headers...');
  generateSecurityHeaders();

  console.log('✅ Production build completed successfully!');
  console.log(`📦 Build size: ${buildInfo.buildSize}`);
  console.log(`🏷️  Version: ${buildInfo.version}`);
  
} catch (error) {
  console.error('❌ Production build failed:', error.message);
  process.exit(1);
}

function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getBuildSize() {
  try {
    const stats = fs.statSync('dist');
    const sizeInMB = (getDirectorySize('dist') / 1024 / 1024).toFixed(2);
    return `${sizeInMB} MB`;
  } catch {
    return 'unknown';
  }
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const items = fs.readdirSync(itemPath);
      items.forEach(item => calculateSize(path.join(itemPath, item)));
    }
  }
  
  calculateSize(dirPath);
  return totalSize;
}

function copyProductionFiles() {
  const productionFiles = [
    'robots.txt',
    'manifest.json'
  ];

  productionFiles.forEach(file => {
    const sourcePath = path.join('public', file);
    const destPath = path.join('dist', file);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`  ✓ Copied ${file}`);
    }
  });
}

function generateSecurityHeaders() {
  const headers = {
    "/*": {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self' data:;"
    }
  };

  fs.writeFileSync(
    path.join('dist', '_headers'),
    Object.entries(headers).map(([path, rules]) => 
      `${path}\n${Object.entries(rules).map(([key, value]) => `  ${key}: ${value}`).join('\n')}`
    ).join('\n\n')
  );
}