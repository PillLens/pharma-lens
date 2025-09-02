import React from 'react';
import { Camera, Eye, Heart } from 'lucide-react';

const HowItWorksSection: React.FC = () => {
  const steps = React.useMemo(() => [
    {
      step: "01",
      icon: Camera,
      title: "Capture",
      description: "Take a photo of your medication box, bottle, or leaflet using your camera",
      color: "primary"
    },
    {
      step: "02",
      icon: Eye,
      title: "Analyze",
      description: "Our AI extracts and analyzes medication information with medical-grade accuracy",
      color: "info"
    },
    {
      step: "03",
      icon: Heart,
      title: "Understand",
      description: "Get comprehensive information about usage, side effects, and interactions",
      color: "success"
    }
  ], []);

  return (
    <section className="mb-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          How It Works
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Three simple steps to understand your medication completely
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <div key={index} className="relative text-center group">
            {/* Connector Line */}
            {index < 2 && (
              <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-border to-transparent transform translate-x-1/2 z-0"></div>
            )}
            
            {/* Step Content */}
            <div className="relative z-10 bg-background">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/5 to-primary-light/10 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-${step.color} to-${step.color}-light flex items-center justify-center shadow-medical`}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                
                {/* Step Number */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default React.memo(HowItWorksSection);