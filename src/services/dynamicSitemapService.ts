export class DynamicSitemapService {
  private getCurrentDomain(): string {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return 'https://pilllens.com'; // Fallback for SSR
  }

  generateSitemap(): string {
    const baseUrl = this.getCurrentDomain();
    const now = new Date().toISOString();
    const supportedLanguages = ['en', 'ru', 'az', 'tr'];
    
    const routes = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/auth', priority: 0.9, changefreq: 'monthly' },
      { path: '/privacy-policy', priority: 0.7, changefreq: 'yearly' },
      { path: '/terms-of-service', priority: 0.7, changefreq: 'yearly' }
    ];

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

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;
  }

  generateRobotsTxt(): string {
    const baseUrl = this.getCurrentDomain();
    
    return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

Sitemap: ${baseUrl}/sitemap.xml

# Healthcare content guidelines
User-agent: *
Crawl-delay: 1

# Block sensitive areas
Disallow: /api/private/
Disallow: /admin/
Disallow: /*.json$
Disallow: /user-uploads/
Disallow: /temp/

# Allow important public content
Allow: /auth
Allow: /privacy-policy
Allow: /terms-of-service`;
  }
}

export const dynamicSitemapService = new DynamicSitemapService();