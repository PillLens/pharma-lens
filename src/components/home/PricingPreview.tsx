import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PricingPreview = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      features: [
        'Unlimited medication scans',
        'Basic medication tracking',
        'Up to 3 reminders',
        'Scan history (30 days)',
        'Email support'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: '/month',
      description: 'For individuals & families',
      features: [
        'Everything in Free',
        'Unlimited reminders',
        'Family management (up to 5)',
        'Drug interaction checker',
        'Priority support',
        'Advanced analytics',
        'Export health reports'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Family',
      price: '$19.99',
      period: '/month',
      description: 'Complete family care solution',
      features: [
        'Everything in Premium',
        'Unlimited family members',
        'Caregiver coordination',
        'Healthcare provider sharing',
        'Emergency contacts',
        'Voice assistant',
        'Dedicated account manager'
      ],
      cta: 'Start Free Trial',
      popular: false
    }
  ];

  return (
    <section className="mb-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Simple, Transparent Pricing</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Choose Your Plan
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Start free, upgrade anytime. All plans include our core medication tracking features.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative p-8 border-border/50 transition-all duration-300 hover:shadow-elegant ${
              plan.popular ? 'border-primary shadow-medical scale-105' : ''
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {plan.description}
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-foreground">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => navigate('/pricing')}
              variant={plan.popular ? 'default' : 'outline'}
              className="w-full"
              size="lg"
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
};
