export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{ hreflang: string; href: string }>;
}

export interface SeoMeta {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  schema?: Record<string, any>;
}

class SeoService {
  private baseUrl = 'https://pilllens.com'; // Replace with your actual domain
  private defaultLanguage = 'en';
  private supportedLanguages = ['en', 'ru', 'az', 'tr'];

  generateSitemap(urls: SitemapUrl[]): string {
    const sitemapUrls = urls.map(url => {
      let urlEntry = `  <url>
    <loc>${this.baseUrl}${url.loc}</loc>`;
      
      if (url.lastmod) {
        urlEntry += `
    <lastmod>${url.lastmod}</lastmod>`;
      }
      
      if (url.changefreq) {
        urlEntry += `
    <changefreq>${url.changefreq}</changefreq>`;
      }
      
      if (url.priority) {
        urlEntry += `
    <priority>${url.priority}</priority>`;
      }

      // Add hreflang alternates for multilingual support
      if (url.alternates) {
        url.alternates.forEach(alt => {
          urlEntry += `
    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`;
        });
      }
      
      urlEntry += `
  </url>`;
      return urlEntry;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapUrls}
</urlset>`;
  }

  getDefaultSitemapUrls(): SitemapUrl[] {
    const now = new Date().toISOString();
    
    return [
      // Homepage - highest priority
      {
        loc: '/',
        lastmod: now,
        changefreq: 'daily',
        priority: 1.0,
        alternates: this.generateAlternates('/')
      },
      // Auth pages
      {
        loc: '/auth',
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.8,
        alternates: this.generateAlternates('/auth')
      },
      // Main app features
      {
        loc: '/dashboard',
        lastmod: now,
        changefreq: 'daily',
        priority: 0.9,
        alternates: this.generateAlternates('/dashboard')
      },
      {
        loc: '/medications',
        lastmod: now,
        changefreq: 'daily',
        priority: 0.9,
        alternates: this.generateAlternates('/medications')
      },
      {
        loc: '/reminders',
        lastmod: now,
        changefreq: 'daily',
        priority: 0.8,
        alternates: this.generateAlternates('/reminders')
      },
      {
        loc: '/family',
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.8,
        alternates: this.generateAlternates('/family')
      },
      {
        loc: '/scan-history',
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.7,
        alternates: this.generateAlternates('/scan-history')
      },
      // Settings and legal pages
      {
        loc: '/settings',
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.6,
        alternates: this.generateAlternates('/settings')
      },
      {
        loc: '/privacy-policy',
        lastmod: now,
        changefreq: 'yearly',
        priority: 0.5,
        alternates: this.generateAlternates('/privacy-policy')
      },
      {
        loc: '/terms-of-service',
        lastmod: now,
        changefreq: 'yearly',
        priority: 0.5,
        alternates: this.generateAlternates('/terms-of-service')
      }
    ];
  }

  private generateAlternates(path: string) {
    return this.supportedLanguages.map(lang => ({
      hreflang: lang,
      href: `${this.baseUrl}${path}?lang=${lang}`
    }));
  }

  generateStructuredData(type: string, data: Record<string, any>): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };
    
    return JSON.stringify(schema, null, 2);
  }

  getOrganizationSchema() {
    return {
      '@type': 'Organization',
      name: 'PillLens',
      description: 'Smart medication management and reminder system',
      url: this.baseUrl,
      logo: `${this.baseUrl}/pilllens-logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@pilllens.com'
      },
      sameAs: [
        'https://twitter.com/pilllens',
        'https://facebook.com/pilllens'
      ]
    };
  }

  getWebApplicationSchema() {
    return {
      '@type': 'WebApplication',
      name: 'PillLens',
      description: 'Scan, track, and manage your medications easily with smart reminders and family sharing',
      url: this.baseUrl,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web, iOS, Android',
      permissions: 'camera, notifications',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      author: {
        '@type': 'Organization',
        name: 'PillLens'
      },
      screenshots: [
        `${this.baseUrl}/assets/screenshots/dashboard.png`,
        `${this.baseUrl}/assets/screenshots/scanner.png`
      ]
    };
  }

  getMedicalWebPageSchema(pageName: string, description: string) {
    return {
      '@type': 'MedicalWebPage',
      name: pageName,
      description: description,
      url: `${this.baseUrl}${window.location.pathname}`,
      medicalAudience: {
        '@type': 'Patient'
      },
      about: {
        '@type': 'MedicalCondition',
        name: 'Medication Management'
      },
      mainContentOfPage: {
        '@type': 'WebPageElement',
        cssSelector: 'main'
      }
    };
  }

  getFAQSchema(faqs: Array<{ question: string; answer: string }>) {
    return {
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${this.baseUrl}/sitemap.xml

# Healthcare content guidelines
User-agent: *
Crawl-delay: 1

# Block sensitive areas
Disallow: /api/
Disallow: /admin/
Disallow: /*.json$`;
  }

  generateSecurityHeaders(): string {
    return `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://bquxkkaipevuakmqqilk.supabase.co https://onesignal.com;`;
  }
}

export const seoService = new SeoService();