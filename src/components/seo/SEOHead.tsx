import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  noIndex?: boolean;
  structuredData?: Record<string, any>;
}

export const SEOHead = ({
  title,
  description,
  keywords = [],
  canonical,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noIndex = false,
  structuredData
}: SEOHeadProps) => {
  const location = useLocation();
  const { language } = useTranslation();
  
  const baseUrl = 'https://pilllens.com'; // Replace with your actual domain
  const defaultOgImage = `${baseUrl}/android-chrome-512x512.png`;
  
  const fullTitle = title ? `${title} | PillLens` : 'PillLens — Scan, Track & Manage Your Medications Easily';
  const metaDescription = description || 'PillLens helps you stay on top of your health. Scan pill barcodes, identify medications instantly, set smart reminders, and share schedules with family or caregivers.';
  const canonicalUrl = canonical || `${baseUrl}${location.pathname}`;
  const imageUrl = ogImage || defaultOgImage;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    updateMetaTag('description', metaDescription);
    updateMetaTag('keywords', keywords.join(', '));
    updateMetaTag('author', 'PillLens Team');
    updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    
    // Language and hreflang
    updateMetaTag('language', language);
    document.documentElement.lang = language;
    
    // Canonical URL
    updateLinkTag('canonical', canonicalUrl);
    
    // Open Graph tags
    updateMetaProperty('og:title', fullTitle);
    updateMetaProperty('og:description', metaDescription);
    updateMetaProperty('og:type', ogType);
    updateMetaProperty('og:url', canonicalUrl);
    updateMetaProperty('og:image', imageUrl);
    updateMetaProperty('og:image:alt', 'PillLens - Smart Medication Management');
    updateMetaProperty('og:site_name', 'PillLens');
    updateMetaProperty('og:locale', getOGLocale(language));
    
    // Twitter Card tags
    updateMetaName('twitter:card', twitterCard);
    updateMetaName('twitter:site', '@pilllens');
    updateMetaName('twitter:title', fullTitle);
    updateMetaName('twitter:description', metaDescription);
    updateMetaName('twitter:image', imageUrl);
    updateMetaName('twitter:image:alt', 'PillLens - Smart Medication Management');
    
    // Medical/Healthcare specific meta tags
    updateMetaName('medical-disclaimer', 'This app is for informational purposes only and does not replace professional medical advice.');
    updateMetaName('health-category', 'medication-management');
    updateMetaName('audience', 'patients, caregivers, healthcare');
    
    // Mobile and PWA meta tags
    updateMetaName('theme-color', '#0891b2');
    updateMetaName('apple-mobile-web-app-capable', 'yes');
    updateMetaName('apple-mobile-web-app-status-bar-style', 'default');
    updateMetaName('apple-mobile-web-app-title', 'PillLens');
    
    // Google Search Console verification (replace with your actual verification code)
    updateMetaName('google-site-verification', 'your-google-verification-code');
    
    // Bing Webmaster verification
    updateMetaName('msvalidate.01', 'your-bing-verification-code');
    
    // Structured Data
    if (structuredData) {
      updateStructuredData('seo-structured-data', structuredData);
    }
    
    // Hreflang tags for multilingual support
    updateHreflangTags(location.pathname);
    
  }, [fullTitle, metaDescription, keywords, canonicalUrl, imageUrl, ogType, twitterCard, noIndex, language, structuredData, location.pathname]);

  return null; // This component doesn't render anything
};

// Utility functions
function updateMetaTag(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateMetaProperty(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateMetaName(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function updateStructuredData(id: string, data: Record<string, any>) {
  let element = document.querySelector(`script[id="${id}"]`);
  if (!element) {
    element = document.createElement('script');
    element.setAttribute('type', 'application/ld+json');
    element.setAttribute('id', id);
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    ...data
  });
}

function updateHreflangTags(pathname: string) {
  // Remove existing hreflang tags
  document.querySelectorAll('link[hreflang]').forEach(el => el.remove());
  
  const baseUrl = 'https://pilllens.com';
  const languages = ['en', 'ru', 'az', 'tr'];
  
  languages.forEach(lang => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', lang);
    link.setAttribute('href', `${baseUrl}${pathname}?lang=${lang}`);
    document.head.appendChild(link);
  });
  
  // Add x-default for international users
  const defaultLink = document.createElement('link');
  defaultLink.setAttribute('rel', 'alternate');
  defaultLink.setAttribute('hreflang', 'x-default');
  defaultLink.setAttribute('href', `${baseUrl}${pathname}`);
  document.head.appendChild(defaultLink);
}

function getOGLocale(language: string): string {
  const localeMap: Record<string, string> = {
    'en': 'en_US',
    'ru': 'ru_RU',
    'az': 'az_AZ',
    'tr': 'tr_TR'
  };
  return localeMap[language] || 'en_US';
}