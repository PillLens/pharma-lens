import { Card } from '@/components/ui/card';
import { Star, Users, Building2, Award } from 'lucide-react';

export const SocialProofSection = () => {
  const trustLogos = [
    { name: 'FDA', description: 'Approved Data' },
    { name: 'HIPAA', description: 'Compliant' },
    { name: 'SOC 2', description: 'Certified' },
    { name: 'ISO 27001', description: 'Secure' }
  ];

  const stats = [
    { icon: Users, value: '15,000+', label: 'Active Users' },
    { icon: Star, value: '4.8/5', label: 'App Store Rating' },
    { icon: Building2, value: '100+', label: 'Healthcare Partners' },
    { icon: Award, value: '99.2%', label: 'Accuracy Rate' }
  ];

  return (
    <section className="mb-20">
      {/* Trust Badges */}
      <div className="text-center mb-12">
        <p className="text-sm text-muted-foreground mb-6">
          Trusted by healthcare professionals and families worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8">
          {trustLogos.map((logo, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary-light/20 flex items-center justify-center shadow-soft">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <div className="text-xs font-semibold text-foreground">{logo.name}</div>
              <div className="text-xs text-muted-foreground">{logo.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 text-center border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medical">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary-light/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Featured In */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">As featured in</p>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
          {['TechCrunch', 'Healthcare Weekly', 'Digital Health News', 'MedTech Today'].map((publication, index) => (
            <div key={index} className="text-sm font-semibold text-muted-foreground">
              {publication}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
