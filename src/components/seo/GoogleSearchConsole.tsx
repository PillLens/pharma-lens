import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { environmentService } from '@/services/environmentService';

export const GoogleSearchConsole = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Only load in production
    if (!environmentService.env.isProduction) {
      return;
    }
    
    // Google Analytics 4
    const gtag = document.createElement('script');
    gtag.async = true;
    gtag.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'; // Replace with your GA4 ID
    document.head.appendChild(gtag);
    
    const gtagConfig = document.createElement('script');
    gtagConfig.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX', {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true
      });
    `;
    document.head.appendChild(gtagConfig);
    
    // Google Search Console verification
    const gscVerification = document.createElement('meta');
    gscVerification.name = 'google-site-verification';
    gscVerification.content = 'your-google-verification-code'; // Replace with your verification code
    document.head.appendChild(gscVerification);
    
    // Bing Webmaster Tools verification
    const bingVerification = document.createElement('meta');
    bingVerification.name = 'msvalidate.01';
    bingVerification.content = 'your-bing-verification-code'; // Replace with your verification code
    document.head.appendChild(bingVerification);
    
    return () => {
      // Cleanup scripts on unmount
      document.querySelectorAll('script[src*="googletagmanager"]').forEach(el => el.remove());
      document.querySelectorAll('meta[name="google-site-verification"]').forEach(el => el.remove());
      document.querySelectorAll('meta[name="msvalidate.01"]').forEach(el => el.remove());
    };
  }, []);
  
  useEffect(() => {
    // Track page views on route changes
    if (environmentService.env.isProduction && window.gtag) {
      window.gtag('config', 'G-XXXXXXXXXX', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname
      });
    }
  }, [location]);
  
  return null;
};

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}