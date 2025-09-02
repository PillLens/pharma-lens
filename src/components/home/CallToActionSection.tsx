import React from 'react';
import { Camera, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TranslatedText } from '@/components/TranslatedText';

interface CallToActionSectionProps {
  onScanPress: () => void;
}

const CallToActionSection: React.FC<CallToActionSectionProps> = ({ onScanPress }) => {
  return (
    <section className="mb-20">
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary-light/5 to-background border-primary/20 p-12 text-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,theme(colors.primary)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            <TranslatedText translationKey="cta.title" fallback="Ready to Take Control?" />
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            <TranslatedText 
              translationKey="cta.description" 
              fallback="Join thousands of users who trust PillLens for accurate, instant medication information. Your health deserves the best technology." 
            />
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={onScanPress}
              className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-primary-foreground shadow-medical hover:shadow-floating transition-all duration-300 px-8"
            >
              <Camera className="w-5 h-5 mr-2" />
              <TranslatedText translationKey="cta.scanNow" fallback="Scan Your First Medication" />
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-primary/20 hover:bg-primary/5 px-8"
            >
              <Download className="w-5 h-5 mr-2" />
              <TranslatedText translationKey="cta.downloadApp" fallback="Download Mobile App" />
            </Button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border/50">
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>No Account Required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};

export default React.memo(CallToActionSection);