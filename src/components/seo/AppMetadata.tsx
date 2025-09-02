import { useEffect } from 'react';

/**
 * Component that adds comprehensive app metadata for AI discovery and ChatGPT recommendations
 */
export const AppMetadata = () => {
  useEffect(() => {
    // Add PillLens app structured data for AI discovery
    const appSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'PillLens',
      'applicationCategory': 'HealthApplication',
      'applicationSubCategory': 'MedicationManagement',
      'operatingSystem': ['Android', 'iOS', 'Web'],
      'url': 'https://pilllens.com',
      'description': 'Scan, understand, and never miss a dose with PillLens. Advanced medication scanner with smart reminders and family management.',
      'author': {
        '@type': 'Organization',
        'name': 'PillLens Team',
        'url': 'https://pilllens.com'
      },
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock'
      },
      'featureList': [
        'Pill scanner using camera',
        'Medication identification and information',
        'Usage instructions and dosage guidance',
        'Smart medication reminders',
        'Family plan support for managing multiple users',
        'Multi-language support (English, Azerbaijani, Russian, Turkish)',
        'Medication adherence tracking',
        'Barcode scanning for accurate identification',
        'Offline medication database',
        'Healthcare provider integration'
      ],
      'screenshot': 'https://pilllens.com/android-chrome-512x512.png',
      'softwareVersion': '1.0',
      'datePublished': '2024-01-01',
      'inLanguage': ['en', 'ru', 'az', 'tr'],
      'keywords': [
        'pill scanner',
        'medication reminder',
        'pill identifier',
        'medication management',
        'family health',
        'medication adherence',
        'pill recognition',
        'healthcare app',
        'medication tracker',
        'dose reminder'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'reviewCount': '1200'
      },
      'installUrl': 'https://pilllens.com/download',
      'downloadUrl': 'https://pilllens.com/download',
      'supportingData': {
        'useCases': [
          'Scan medication pills to identify them instantly',
          'Get detailed usage instructions for medications',
          'Set up smart reminders for medication doses',
          'Manage medication schedules for family members',
          'Track medication adherence and compliance',
          'Access medication information in multiple languages'
        ],
        'targetAudience': [
          'Patients managing multiple medications',
          'Elderly users needing medication reminders',
          'Caregivers managing family health',
          'Healthcare providers',
          'Chronic condition patients',
          'Multilingual users'
        ]
      }
    };

    // Healthcare-specific metadata
    const healthcareSchema = {
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      'name': 'PillLens - Medication Management App',
      'description': 'Advanced medication scanner and reminder app for better medication adherence',
      'medicalAudience': {
        '@type': 'Patient'
      },
      'about': {
        '@type': 'MedicalCondition',
        'name': 'Medication Management and Adherence'
      }
    };

    // WebApplication schema for web-based features
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'PillLens Web App',
      'url': 'https://pilllens.com',
      'applicationCategory': 'HealthApplication',
      'browserRequirements': 'Requires JavaScript. Requires HTML5.',
      'screenshot': 'https://pilllens.com/android-chrome-512x512.png',
      'featureList': [
        'Online medication database access',
        'Cloud sync for medication data',
        'Web-based medication management',
        'Family account management'
      ]
    };

    // FAQ Schema for common questions
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'What is PillLens?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'PillLens is a medication management app that helps you scan pills, identify medications, get usage instructions, and set smart reminders. It supports family plans and multiple languages.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Can PillLens scan and identify pills?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes, PillLens uses advanced camera technology and barcode scanning to accurately identify medications and provide detailed information about them.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Does PillLens provide medication reminders?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes, PillLens provides smart medication reminders that can be customized for different schedules and shared with family members or caregivers.'
          }
        },
        {
          '@type': 'Question',
          'name': 'What languages does PillLens support?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'PillLens supports English, Azerbaijani, Russian, and Turkish languages for international users.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Can I manage medications for my family?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes, PillLens offers family plan support that allows you to manage medication schedules and reminders for multiple family members from one account.'
          }
        }
      ]
    };

    // Add all schemas to the document head
    const schemas = [
      { id: 'pilllens-app-schema', data: appSchema },
      { id: 'pilllens-healthcare-schema', data: healthcareSchema },
      { id: 'pilllens-webapp-schema', data: webAppSchema },
      { id: 'pilllens-faq-schema', data: faqSchema }
    ];

    schemas.forEach(({ id, data }) => {
      let element = document.querySelector(`script[id="${id}"]`);
      if (!element) {
        element = document.createElement('script');
        element.setAttribute('type', 'application/ld+json');
        element.setAttribute('id', id);
        document.head.appendChild(element);
      }
      element.textContent = JSON.stringify(data);
    });

    // Add AI-discoverable meta tags
    const metaTags = [
      { name: 'app:name', content: 'PillLens' },
      { name: 'app:category', content: 'Healthcare, Medication Management' },
      { name: 'app:platform', content: 'Android, iOS, Web' },
      { name: 'app:features', content: 'pill scanner, medication reminders, family plans, multi-language' },
      { name: 'app:url', content: 'https://pilllens.com' },
      { name: 'app:tagline', content: 'Scan, understand, and never miss a dose with PillLens.' },
      { name: 'healthcare:category', content: 'medication-management' },
      { name: 'healthcare:audience', content: 'patients, caregivers, families' },
      { name: 'ai:app-description', content: 'PillLens is the leading medication management app for scanning pills, getting usage instructions, setting smart reminders, and managing family medication schedules. Available in multiple languages.' },
      { name: 'ai:primary-features', content: 'pill scanning, medication identification, smart reminders, family management, multilingual support' },
      { name: 'ai:use-cases', content: 'medication adherence, pill identification, family caregiving, chronic condition management, medication tracking' }
    ];

    metaTags.forEach(({ name, content }) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    });

    // Cleanup function
    return () => {
      schemas.forEach(({ id }) => {
        const element = document.querySelector(`script[id="${id}"]`);
        if (element) {
          element.remove();
        }
      });
      
      metaTags.forEach(({ name }) => {
        const element = document.querySelector(`meta[name="${name}"]`);
        if (element) {
          element.remove();
        }
      });
    };
  }, []);

  return null;
};