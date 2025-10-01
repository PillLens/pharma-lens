import React, { useState } from 'react';
import { Crown, Check, X, Star, Users, FileText, Shield, Smartphone, AlertCircle, ArrowLeft, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { TranslatedText } from '@/components/TranslatedText';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PaywallSheet } from '@/components/subscription/PaywallSheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { PageSEO } from '@/components/seo/PageSEO';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, canStartTrial, isInTrial, trialDaysRemaining } = useSubscription();
  const [isYearly, setIsYearly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleUpgrade = async (plan: 'pro_individual') => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan, billing_cycle: isYearly ? 'yearly' : 'monthly' }
      });

      if (error) throw error;

      if (data?.url) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          window.location.href = data.url;
        } else {
          const newWindow = window.open(data.url, '_blank');
          if (!newWindow || newWindow.closed) {
            window.location.href = data.url;
          }
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started',
      features: [
        { name: 'Basic medication scanning', included: true },
        { name: '1 medication reminder', included: true },
        { name: '3 AI voice chat minutes/month', included: true },
        { name: '1 device only', included: true },
        { name: 'Family groups', included: false },
        { name: 'Advanced reports & exports', included: false },
        { name: 'HIPAA compliance reports', included: false },
        { name: 'Priority support', included: false }
      ],
      buttonText: 'Current Plan',
      isCurrentPlan: subscription.plan === 'free' && !isInTrial,
      popular: false
    },
    {
      name: 'Pro Individual',
      price: { monthly: 5.99, yearly: 39.99 },
      description: 'Complete medication management',
      features: [
        { name: 'Everything in Free', included: true },
        { name: 'Unlimited medication reminders', included: true },
        { name: '10 AI voice chat minutes/month', included: true },
        { name: 'Up to 3 devices', included: true },
        { name: 'Family group management', included: true },
        { name: 'Advanced reports & exports', included: true },
        { name: 'HIPAA compliance reports', included: true },
        { name: 'Priority support', included: true }
      ],
      buttonText: canStartTrial && !isInTrial ? 'Start Free Trial' : 'Upgrade Now',
      isCurrentPlan: subscription.plan === 'pro_individual' || isInTrial,
      popular: true
    }
  ];

  return (
    <ProfessionalMobileLayout
      title="Pricing Plans"
      showHeader={true}
      className="bg-background"
      leftAction={
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      }
    >
      <PageSEO
        title="Pricing Plans - PillLens Pro"
        description="Choose the right plan for your medication management needs. Start with our free plan or upgrade to Pro for unlimited features."
        keywords={['medication app pricing', 'healthcare app plans', 'prescription management cost', 'family medication plans']}
        path="/pricing"
      />

      <div className="px-4 py-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you need more features. All plans include our core medication management tools.
          </p>
        </div>

        {/* Trial Banner */}
        {canStartTrial && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800">14-Day Free Trial</h3>
                  <p className="text-sm text-amber-700">
                    Try all Pro Individual features free for 14 days. No credit card required.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={`text-sm ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
            Yearly
          </span>
          {isYearly && (
            <Badge variant="secondary" className="text-xs">
              Save 30%
            </Badge>
          )}
        </div>

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative overflow-hidden ${
                plan.popular ? 'ring-2 ring-primary shadow-lg' : ''
              } ${plan.isCurrentPlan ? 'bg-primary/5' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-glow text-white">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="pb-4">
                <div className="text-center space-y-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      ${isYearly ? plan.price.yearly : plan.price.monthly}
                    </div>
                    {plan.price.monthly > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {isYearly ? '/year' : '/month'}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        feature.included ? 'text-foreground' : 'text-muted-foreground line-through'
                      }`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <Button
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-primary to-primary-glow text-white'
                      : plan.isCurrentPlan 
                        ? 'bg-muted text-muted-foreground' 
                        : ''
                  }`}
                  variant={plan.popular ? 'default' : plan.isCurrentPlan ? 'secondary' : 'outline'}
                  disabled={plan.isCurrentPlan || loading}
                  onClick={() => plan.name === 'Pro Individual' ? handleUpgrade('pro_individual') : undefined}
                >
                  {plan.isCurrentPlan ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Current Plan
                    </>
                  ) : (
                    <>
                      {plan.name === 'Pro Individual' && <Crown className="w-4 h-4 mr-2" />}
                      {plan.buttonText}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Voice Assistant Highlight */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                  AI Voice Assistant - Premium Health Support
                </h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                  Have natural voice conversations with your AI health assistant powered by OpenAI's GPT-4 and ElevenLabs premium voices. Get instant answers about medications, set reminders, and manage your health - all hands-free.
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-indigo-800 dark:text-indigo-200">Real-time voice responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-indigo-800 dark:text-indigo-200">Natural conversations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-indigo-800 dark:text-indigo-200">Medication guidance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-indigo-800 dark:text-indigo-200">24/7 availability</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  icon: AlertCircle, 
                  name: 'Medication Reminders', 
                  free: '1 reminder', 
                  pro: 'Unlimited',
                  color: 'text-blue-500'
                },
                { 
                  icon: Smartphone, 
                  name: 'Device Access', 
                  free: '1 device', 
                  pro: 'Up to 3 devices',
                  color: 'text-green-500'
                },
                { 
                  icon: Users, 
                  name: 'Family Management', 
                  free: 'Not available', 
                  pro: 'Full family groups',
                  color: 'text-purple-500'
                },
                { 
                  icon: FileText, 
                  name: 'Reports & Exports', 
                  free: 'Basic only', 
                  pro: 'Advanced reports',
                  color: 'text-orange-500'
                },
                { 
                  icon: Shield, 
                  name: 'HIPAA Compliance', 
                  free: 'Not available', 
                  pro: 'Full compliance',
                  color: 'text-red-500'
                },
                { 
                  icon: Bot, 
                  name: 'AI Voice Assistant', 
                  free: '3 minutes/month', 
                  pro: '10 minutes/month',
                  color: 'text-indigo-500'
                }
              ].map((feature, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <feature.icon className={`w-4 h-4 ${feature.color}`} />
                    <span className="text-sm font-medium">{feature.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground text-center">
                    {feature.free}
                  </div>
                  <div className="text-sm font-medium text-center">
                    {feature.pro}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                question: 'Can I cancel my subscription anytime?',
                answer: 'Yes, you can cancel your subscription at any time. Your Pro features will remain active until the end of your billing period.'
              },
              {
                question: 'What happens to my data if I downgrade?',
                answer: 'Your data is always safe. If you downgrade, you\'ll lose access to Pro features but all your medications and reminders will be preserved.'
              },
              {
                question: 'Is the free trial really free?',
                answer: 'Yes! The 14-day trial is completely free with no credit card required. You\'ll have access to all Pro features during the trial.'
              },
              {
                question: 'Can I upgrade or downgrade my plan?',
                answer: 'Absolutely! You can change your plan at any time from your account settings. Changes take effect immediately.'
              },
              {
                question: 'How does the AI Voice Assistant work?',
                answer: 'Our AI Voice Assistant uses OpenAI\'s GPT-4 and ElevenLabs premium voices for natural conversations. Free users get 3 minutes per month, Pro users get 10 minutes. Perfect for hands-free medication management!'
              }
            ].map((faq, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-medium text-foreground">{faq.question}</h4>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Testimonials */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-lg font-medium italic">
              "PillLens Pro has transformed how I manage my family's medications. The reminders and reports are invaluable."
            </blockquote>
            <cite className="text-sm text-muted-foreground">- Sarah M., Pro User</cite>
          </CardContent>
        </Card>
      </div>

      <PaywallSheet 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </ProfessionalMobileLayout>
  );
};

export default Pricing;