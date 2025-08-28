import { useEffect } from 'react';
import { dynamicSitemapService } from '@/services/dynamicSitemapService';

export const SitemapGenerator = () => {
  useEffect(() => {
    // Check if we're in browser and add route handlers
    if (typeof window !== 'undefined') {
      // Create a simple route handler for sitemap requests
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        
        if (url.endsWith('/sitemap.xml')) {
          const sitemap = dynamicSitemapService.generateSitemap();
          return new Response(sitemap, {
            headers: {
              'Content-Type': 'application/xml',
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
        
        if (url.endsWith('/robots.txt')) {
          const robots = dynamicSitemapService.generateRobotsTxt();
          return new Response(robots, {
            headers: {
              'Content-Type': 'text/plain',
              'Cache-Control': 'public, max-age=86400'
            }
          });
        }
        
        return originalFetch(input, init);
      };
    }
  }, []);

  return null;
};