import React, { useState } from 'react';
import { 
  Users, Heart, Shield, UserPlus, Video, Calendar, 
  Phone, MessageCircle, Activity, Plus, ChevronRight,
  Clock, Star, Zap, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/hooks/useTranslation';

interface EnhancedFamilyEmptyStateProps {
  onCreateGroup: () => void;
  onImportContacts?: () => void;
  onWatchDemo?: () => void;
}

const EnhancedFamilyEmptyState: React.FC<EnhancedFamilyEmptyStateProps> = ({ 
  onCreateGroup, 
  onImportContacts,
  onWatchDemo 
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const benefits = [
    {
      icon: Heart,
      title: 'Medication Sharing',
      description: 'Share medication schedules and track adherence together',
      color: 'primary'
    },
    {
      icon: Shield,
      title: 'Safety Monitoring',
      description: 'Get alerts for missed medications and emergency situations',
      color: 'success'
    },
    {
      icon: Activity,
      title: 'Health Insights',
      description: 'View family health trends and compliance analytics',
      color: 'blue'
    },
    {
      icon: Video,
      title: 'Remote Care',
      description: 'Video calls and check-ins with family members',
      color: 'purple'
    }
  ];

  const steps = [
    {
      title: 'Create Your Family Group',
      description: 'Start by creating your first family care group',
      icon: Users,
      action: 'Create Group',
      primary: true
    },
    {
      title: 'Invite Family Members',
      description: 'Add caregivers, patients, and healthcare providers',
      icon: UserPlus,
      action: 'Import Contacts'
    },
    {
      title: 'Share Medications',
      description: 'Set up shared medication schedules and reminders',
      icon: Calendar,
      action: 'Share Meds'
    },
    {
      title: 'Start Caring Together',
      description: 'Monitor health, send reminders, and stay connected',
      icon: Heart,
      action: 'Begin Care'
    }
  ];

  const templates = [
    {
      name: 'Elderly Care',
      description: 'Perfect for caring for aging parents',
      members: ['Patient', 'Primary Caregiver', 'Family Member'],
      icon: Heart,
      color: 'from-primary/10 to-primary/20',
      popular: true
    },
    {
      name: 'Child Care',
      description: 'Manage medications for children',
      members: ['Child', 'Parent', 'Guardian'],
      icon: Shield,
      color: 'from-success/10 to-success/20'
    },
    {
      name: 'Chronic Condition',
      description: 'Support for ongoing health conditions',
      members: ['Patient', 'Caregiver', 'Healthcare Provider'],
      icon: Activity,
      color: 'from-blue-500/10 to-blue-500/20'
    }
  ];

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      {/* Hero Section */}
      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-primary/5 via-background to-success/5 mb-8">
        <CardContent className="p-8 text-center">
          {/* Animated Illustration */}
          <div className="relative mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center shadow-xl animate-pulse">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-success/20 to-success/30 flex items-center justify-center animate-bounce delay-100">
                  <Heart className="w-4 h-4 text-success" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/30 flex items-center justify-center animate-bounce delay-200">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div className="absolute top-0 -left-4 w-6 h-6 rounded-full bg-gradient-to-br from-warning/20 to-warning/30 flex items-center justify-center animate-bounce delay-300">
                  <Zap className="w-3 h-3 text-warning" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to Family Care
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Create your family care network to share medications, monitor health, 
              and keep everyone safe together.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-primary" />
                <span>Connect Family</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-success" />
                <span>Share Care</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Stay Safe</span>
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={onCreateGroup}
              size="lg"
              className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] bg-gradient-to-r from-primary to-primary/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Group
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={onWatchDemo}
              className="rounded-xl border-2 hover:bg-muted/50"
            >
              <Video className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <Card key={index} className="border-0 bg-gradient-to-br from-muted/20 to-muted/30 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    benefit.color === 'primary' ? 'bg-primary/20 text-primary' :
                    benefit.color === 'success' ? 'bg-success/20 text-success' :
                    benefit.color === 'blue' ? 'bg-blue-500/20 text-blue-600' :
                    'bg-purple-500/20 text-purple-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Setup Templates */}
      <Card className="border-0 bg-muted/20 mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Quick Setup Templates
          </CardTitle>
          <p className="text-sm text-muted-foreground">Choose a template to get started quickly</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template, index) => {
              const Icon = template.icon;
              return (
                <Card key={index} className={`border-0 bg-gradient-to-br ${template.color} hover:shadow-lg transition-all cursor-pointer group`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <h4 className="font-semibold">{template.name}</h4>
                      </div>
                      {template.popular && (
                        <Badge className="bg-primary/20 text-primary text-xs">Popular</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <div className="space-y-1 mb-4">
                      {template.members.map((member, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          {member}
                        </div>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="w-full justify-between group-hover:bg-background/50"
                      onClick={onCreateGroup}
                    >
                      Use Template
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Steps */}
      <Card className="border-0 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Getting Started in 4 Easy Steps
          </CardTitle>
          <Progress value={(currentStep + 1) * 25} className="h-2 mt-3" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={index} className={`p-4 rounded-lg border-2 transition-all ${
                  isActive ? 'border-primary bg-primary/5' :
                  isCompleted ? 'border-success bg-success/5' :
                  'border-border bg-background'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-primary text-primary-foreground' :
                      isCompleted ? 'bg-success text-success-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
                  <Button 
                    size="sm" 
                    variant={step.primary ? "default" : "outline"}
                    className="w-full h-8"
                    onClick={step.primary ? onCreateGroup : undefined}
                  >
                    {step.action}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedFamilyEmptyState;