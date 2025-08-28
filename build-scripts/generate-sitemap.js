const fs = require('fs');
const path = require('path');

const baseUrl = 'https://pilllens.com'; // Replace with your actual domain
const supportedLanguages = ['en', 'ru', 'az', 'tr'];

const routes = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/auth', priority: 0.8, changefreq: 'monthly' },
  { path: '/dashboard', priority: 0.9, changefreq: 'daily' },
  { path: '/medications', priority: 0.9, changefreq: 'daily' },
  { path: '/reminders', priority: 0.8, changefreq: 'daily' },
  { path: '/family', priority: 0.8, changefreq: 'weekly' },
  { path: '/scan-history', priority: 0.7, changefreq: 'weekly' },
  { path: '/settings', priority: 0.6, changefreq: 'monthly' },
  { path: '/privacy-policy', priority: 0.5, changefreq: 'yearly' },
  { path: '/terms-of-service', priority: 0.5, changefreq: 'yearly' }
];

function generateSitemap() {
  const now = new Date().toISOString();
  
  const urlEntries = routes.map(route => {
    const alternates = supportedLanguages.map(lang => 
      `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${route.path}?lang=${lang}" />`
    ).join('\n');

    return `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
${alternates}
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;

  return sitemap;
}

function generateImageSitemap() {
  const imageSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/lovable-uploads/39c4089d-d2bb-4326-941f-1de6a17a137c.png</image:loc>
      <image:caption>PillLens - Smart Medication Management App Logo</image:caption>
      <image:title>PillLens Logo</image:title>
    </image:image>
    <image:image>
      <image:loc>${baseUrl}/assets/medical-hero.jpg</image:loc>
      <image:caption>Medical professionals and healthcare technology</image:caption>
      <image:title>Healthcare Technology</image:title>
    </image:image>
  </url>
</urlset>`;

  return imageSitemap;
}

// Generate both sitemaps
const sitemap = generateSitemap();
const imageSitemap = generateImageSitemap();

// Write sitemaps to public directory
const publicDir = path.join(__dirname, '..', 'public');

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(publicDir, 'sitemap-images.xml'), imageSitemap);

console.log('✅ Generated sitemap.xml and sitemap-images.xml');

// Generate sitemap index
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-images.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

fs.writeFileSync(path.join(publicDir, 'sitemap-index.xml'), sitemapIndex);
console.log('✅ Generated sitemap-index.xml');

module.exports = { generateSitemap, generateImageSitemap };