import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface UseSEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export const useSEO = ({
  title,
  description,
  keywords = [],
  canonical,
  ogImage,
  noIndex = false
}: UseSEOProps) => {
  const location = useLocation();
  const { language } = useTranslation();
  
  const baseUrl = 'https://pilllens.com'; // Replace with your actual domain
  const defaultOgImage = `${baseUrl}/lovable-uploads/efbf41f7-9e35-4eb9-b847-9d959c18b76f.png`;
  
  const fullTitle = title ? `${title} | PillLens` : 'PillLens — Scan, Track & Manage Your Medications Easily';
  const metaDescription = description || 'PillLens helps you stay on top of your health. Scan pill barcodes, identify medications instantly, set smart reminders, and share schedules with family or caregivers.';
  const canonicalUrl = canonical || `${baseUrl}${location.pathname}`;
  const imageUrl = ogImage || defaultOgImage;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', metaDescription);
    }

    // Update keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && keywords.length > 0) {
      metaKeywords.setAttribute('content', keywords.join(', '));
    }

    // Update canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', metaDescription);
    }

    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) {
      ogImg.setAttribute('content', imageUrl);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    }

    // Update Twitter Card tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', fullTitle);
    }

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) {
      twitterDesc.setAttribute('content', metaDescription);
    }

    const twitterImg = document.querySelector('meta[name="twitter:image"]');
    if (twitterImg) {
      twitterImg.setAttribute('content', imageUrl);
    }

    // Update robots meta tag
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      robotsMeta.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');
    }

  }, [fullTitle, metaDescription, keywords, canonicalUrl, imageUrl, noIndex, location.pathname]);

  return {
    title: fullTitle,
    description: metaDescription,
    canonical: canonicalUrl,
    image: imageUrl
  };
};