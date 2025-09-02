import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';

const MobileHeroSection: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <Badge className="mb-4 bg-primary-light text-primary border-primary/20">
        <TranslatedText translationKey="hero.badge" fallback="Privacy-First • Safety-Focused" />
      </Badge>
      <h2 className="text-2xl font-bold text-foreground mb-4 leading-tight">
        <TranslatedText translationKey="hero.title1" fallback="Snap. Scan. Understand." />
        <br />
        <span className="text-primary">
          <TranslatedText translationKey="hero.title2" fallback="Your AI Medication Guide" />
        </span>
      </h2>
      <p className="text-base text-muted-foreground mb-8">
        <TranslatedText translationKey="hero.description" fallback="Scan any pill box, barcode, or leaflet to get safe, evidence-based details — what it is, how to take it, and important warnings" />
      </p>
    </div>
  );
};

export default React.memo(MobileHeroSection);