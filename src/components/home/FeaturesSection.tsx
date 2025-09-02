import React from 'react';
import { Shield, Globe2, Clock, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { useIsMobile } from '@/hooks/use-mobile';

const FeaturesSection: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const features = React.useMemo(() => [
    {
      icon: Shield,
      title: t('features.safetyFirst'),
      description: t('features.safetyDescription')
    },
    {
      icon: Globe2,
      title: t('features.multiLanguage'),
      description: t('features.languageDescription')
    },
    {
      icon: Clock,
      title: t('features.instantResults'),
      description: t('features.resultsDescription')
    },
    {
      icon: BookOpen,
      title: t('features.evidenceBased'),
      description: t('features.evidenceDescription')
    }
  ], [t]);

  return (
    <section className={`${!isMobile ? 'mb-20' : 'mb-8'}`}>
      {!isMobile && (
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose PillLens?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Advanced AI-powered medication analysis with medical-grade accuracy and privacy protection
          </p>
        </div>
      )}

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        {features.map((feature, index) => (
          <Card 
            key={index} 
            className={`group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-medical ${!isMobile ? 'p-8 hover:-translate-y-2' : 'p-6'}`}
          >
            <div className={`${isMobile ? 'text-center' : 'text-left'}`}>
              {/* Icon */}
              <div className={`relative mb-6 ${isMobile ? 'mx-auto' : ''}`}>
                <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-xl bg-gradient-to-br from-primary/10 to-primary-light/20 flex items-center justify-center shadow-medical group-hover:shadow-floating group-hover:scale-110 transition-all duration-300`}>
                  <feature.icon className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} text-primary`} />
                </div>
                
                {!isMobile && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-primary-light/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                )}
              </div>

              {/* Content */}
              <h3 className={`font-bold text-foreground mb-3 group-hover:text-primary transition-colors ${isMobile ? 'text-base' : 'text-xl'}`}>
                {feature.title}
              </h3>
              <p className={`text-muted-foreground leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
                {feature.description}
              </p>

              {/* Hover Effect */}
              {!isMobile && (
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary-light transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default React.memo(FeaturesSection);