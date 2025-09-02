import React from 'react';
import { TrendingUp, Users, Shield, Zap, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TrustSection: React.FC = () => {
  const stats = React.useMemo(() => [
    {
      icon: TrendingUp,
      value: "99.2%",
      label: "Accuracy Rate",
      color: "success"
    },
    {
      icon: Users,
      value: "15K+",
      label: "Trust Users",
      color: "primary"
    },
    {
      icon: Shield,
      value: "100%",
      label: "Privacy Protected",
      color: "info"
    },
    {
      icon: Zap,
      value: "<3s",
      label: "Scan Speed",
      color: "warning"
    }
  ], []);

  const testimonials = React.useMemo(() => [
    {
      quote: "PillLens has revolutionized how I manage my family's medications. The accuracy is incredible.",
      author: "Dr. Sarah Chen",
      role: "Family Physician",
      rating: 5
    },
    {
      quote: "As a pharmacist, I'm impressed by the comprehensive drug information and safety warnings.",
      author: "Michael Rodriguez",
      role: "Clinical Pharmacist",
      rating: 5
    },
    {
      quote: "The multilingual support helped my elderly parents understand their medications better.",
      author: "Emma Thompson",
      role: "Caregiver",
      rating: 5
    }
  ], []);

  return (
    <section className="mb-20">
      {/* Trust Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center p-6 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medical">
            <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-${stat.color}/10 to-${stat.color}-light/20 flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}`} />
            </div>
            <div className={`text-3xl font-bold text-${stat.color} mb-2`}>{stat.value}</div>
            <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Testimonials */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="p-8 text-center border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medical">
            <div className="flex justify-center mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-warning fill-current" />
              ))}
            </div>
            
            <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
              "{testimonial.quote}"
            </blockquote>
            
            <div>
              <div className="font-semibold text-foreground">{testimonial.author}</div>
              <div className="text-sm text-muted-foreground">{testimonial.role}</div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default React.memo(TrustSection);