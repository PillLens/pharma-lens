import { SEOHead } from './SEOHead';
import { StructuredData } from './StructuredData';

interface PageSEOProps {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  structuredDataType?: 'medical' | 'faq';
  faqs?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export const PageSEO = ({
  title,
  description,
  keywords = [],
  path,
  structuredDataType,
  faqs,
  breadcrumbs
}: PageSEOProps) => {
  const baseUrl = 'https://pilllens.com';
  const canonical = `${baseUrl}${path}`;

  return (
    <>
      <SEOHead
        title={title}
        description={description}
        keywords={keywords}
        canonical={canonical}
      />
      
      {structuredDataType === 'medical' && (
        <StructuredData
          type="medical"
          pageName={title}
          pageDescription={description}
        />
      )}
      
      {structuredDataType === 'faq' && faqs && (
        <StructuredData
          type="faq"
          faqs={faqs}
        />
      )}
      
      {breadcrumbs && (
        <StructuredData
          type="breadcrumb"
          breadcrumbs={breadcrumbs}
        />
      )}
    </>
  );
};