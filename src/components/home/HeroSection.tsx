import React from 'react';
import { Camera, History, Shield, Lock, Award, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import heroImage from '@/assets/medical-hero.jpg';

interface HeroSectionProps {
  onScanPress: () => void;
  onHistoryPress: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onScanPress, onHistoryPress }) => {
  return (
    <section className="grid lg:grid-cols-2 gap-12 items-center mb-20">
      {/* Left Column - Content */}
      <div className="space-y-8">
        <div className="space-y-6">
          <Badge className="bg-gradient-to-r from-primary/10 to-primary-light/10 text-primary border-primary/20 px-4 py-2 font-medium">
            <Shield className="w-4 h-4 mr-2" />
            <TranslatedText translationKey="hero.badge" fallback="Privacy-First • Safety-Focused" />
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            <span className="block">
              <TranslatedText translationKey="hero.title1" fallback="Snap. Scan." />
            </span>
            <span className="block text-primary bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              <TranslatedText translationKey="hero.title2" fallback="Understand." />
            </span>
            <span className="block text-3xl md:text-4xl text-primary font-medium mt-2 bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Your AI Medication Guide
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
            <TranslatedText translationKey="hero.description" fallback="Scan any pill box, barcode, or leaflet to get safe, evidence-based details — what it is, how to take it, and important warnings" />
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 py-8 border-t border-b border-border/50">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">99.2%</div>
            <div className="text-sm text-muted-foreground font-medium">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">50K+</div>
            <div className="text-sm text-muted-foreground font-medium">Medications Scanned</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">15K+</div>
            <div className="text-sm text-muted-foreground font-medium">Active Users</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            size="lg" 
            onClick={onScanPress} 
            className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-primary-foreground shadow-medical hover:shadow-floating transition-all duration-300 px-8"
          >
            <Camera className="w-5 h-5 mr-2" />
            <TranslatedText translationKey="scanner.scanMedication" fallback="Start Scanning" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            onClick={onHistoryPress} 
            className="border-primary/20 hover:bg-primary/5 px-8"
          >
            <History className="w-5 h-5 mr-2" />
            <TranslatedText translationKey="navigation.history" fallback="View History" />
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center gap-6 pt-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">FDA Approved Data</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Medical Grade</span>
          </div>
        </div>
      </div>

      {/* Right Column - Visual */}
      <div className="relative">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-background to-muted/30">
          <div className="aspect-[4/3] relative overflow-hidden">
            <img 
              src={heroImage} 
              alt="Medical OCR scanning interface" 
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
          </div>
          
          {/* Clean Floating Badges */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg shadow-lg">
            AI Powered
          </div>
          
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-warning text-warning-foreground text-sm font-medium rounded-lg shadow-lg">
            ⚡ Instant
          </div>
          
          <div className="absolute bottom-4 left-4 px-4 py-2 bg-success text-success-foreground text-sm font-semibold rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            99.2% Accurate
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(HeroSection);