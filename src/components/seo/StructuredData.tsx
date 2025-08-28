import { useEffect } from 'react';
import { seoService } from '@/services/seoService';

interface StructuredDataProps {
  type: 'organization' | 'webapp' | 'medical' | 'faq' | 'breadcrumb';
  data?: Record<string, any>;
  faqs?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  pageName?: string;
  pageDescription?: string;
}

export const StructuredData = ({ 
  type, 
  data, 
  faqs, 
  breadcrumbs, 
  pageName, 
  pageDescription 
}: StructuredDataProps) => {
  useEffect(() => {
    let schemaData: Record<string, any> = {};
    
    switch (type) {
      case 'organization':
        schemaData = seoService.getOrganizationSchema();
        break;
        
      case 'webapp':
        schemaData = seoService.getWebApplicationSchema();
        break;
        
      case 'medical':
        if (pageName && pageDescription) {
          schemaData = seoService.getMedicalWebPageSchema(pageName, pageDescription);
        }
        break;
        
      case 'faq':
        if (faqs) {
          schemaData = seoService.getFAQSchema(faqs);
        }
        break;
        
      case 'breadcrumb':
        if (breadcrumbs) {
          schemaData = {
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((crumb, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: crumb.name,
              item: crumb.url
            }))
          };
        }
        break;
        
      default:
        if (data) {
          schemaData = data;
        }
    }
    
    if (Object.keys(schemaData).length > 0) {
      const scriptId = `structured-data-${type}`;
      let element = document.querySelector(`script[id="${scriptId}"]`);
      
      if (!element) {
        element = document.createElement('script');
        element.setAttribute('type', 'application/ld+json');
        element.setAttribute('id', scriptId);
        document.head.appendChild(element);
      }
      
      element.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        ...schemaData
      });
    }
    
    return () => {
      // Cleanup on unmount
      const scriptId = `structured-data-${type}`;
      const element = document.querySelector(`script[id="${scriptId}"]`);
      if (element) {
        element.remove();
      }
    };
  }, [type, data, faqs, breadcrumbs, pageName, pageDescription]);
  
  return null;
};