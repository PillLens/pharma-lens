const fs = require('fs');
const path = require('path');

// This script updates the sitemap and robots.txt with the actual deployed domain
// Run this during the build process or deployment

function updateSitemapDomain(domain) {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Update sitemap.xml
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    let sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    sitemapContent = sitemapContent.replace(/https:\/\/YOUR_DOMAIN_HERE/g, domain);
    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log('✅ Updated sitemap.xml with domain:', domain);
  }
  
  // Update robots.txt
  const robotsPath = path.join(publicDir, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    let robotsContent = fs.readFileSync(robotsPath, 'utf8');
    robotsContent = robotsContent.replace(/https:\/\/YOUR_DOMAIN_HERE/g, domain);
    fs.writeFileSync(robotsPath, robotsContent);
    console.log('✅ Updated robots.txt with domain:', domain);
  }
}

// Get domain from command line argument or environment variable
const domain = process.argv[2] || process.env.DEPLOYED_DOMAIN || 'https://pilllens.com';

if (domain === 'https://YOUR_DOMAIN_HERE') {
  console.log('⚠️  Warning: Please provide the actual domain as an argument or set DEPLOYED_DOMAIN environment variable');
  console.log('Usage: node update-sitemap-domain.js https://yourdomain.com');
} else {
  updateSitemapDomain(domain);
}

module.exports = { updateSitemapDomain };