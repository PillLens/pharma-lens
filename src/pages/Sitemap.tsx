import { useEffect, useState } from 'react';
import { dynamicSitemapService } from '@/services/dynamicSitemapService';

export const Sitemap = () => {
  const [sitemapContent, setSitemapContent] = useState<string>('');

  useEffect(() => {
    // Generate sitemap with current domain
    const sitemap = dynamicSitemapService.generateSitemap();
    setSitemapContent(sitemap);
    
    // Set content type for XML
    document.querySelector('meta[http-equiv="Content-Type"]')?.remove();
    const metaContentType = document.createElement('meta');
    metaContentType.setAttribute('http-equiv', 'Content-Type');
    metaContentType.setAttribute('content', 'application/xml; charset=utf-8');
    document.head.appendChild(metaContentType);
  }, []);

  // Return raw XML content
  return (
    <div style={{ fontFamily: 'monospace', whiteSpace: 'pre', padding: '20px' }}>
      {sitemapContent}
    </div>
  );
};

export default Sitemap;