import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Camera, Bell, Users, Shield, CheckCircle, ArrowRight, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    icon: Camera,
    title: 'Scan Medications',
    description: 'Simply scan any pill bottle, box, or leaflet to instantly identify medications and get detailed information.',
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    icon: Bell,
    title: 'Set Reminders',
    description: 'Never miss a dose again. Set smart reminders that adapt to your schedule and send timely notifications.',
    color: 'text-warning',
    bgColor: 'bg-warning/10'
  },
  {
    icon: Users,
    title: 'Family Management',
    description: 'Manage medications for your whole family. Share schedules with caregivers and stay connected.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30'
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'Your health data is encrypted and secure. We never share your information without permission.',
    color: 'text-success',
    bgColor: 'bg-success/10'
  }
];

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsOpen(false);
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const currentStepData = onboardingSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0"
            onClick={handleSkip}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Progress */}
          <div className="mb-8 mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {onboardingSteps.length}
              </span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Content */}
          <div className="text-center py-8">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${currentStepData.bgColor} flex items-center justify-center`}>
              <Icon className={`w-10 h-10 ${currentStepData.color}`} />
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-4">
              {currentStepData.title}
            </h3>

            <p className="text-muted-foreground leading-relaxed mb-8">
              {currentStepData.description}
            </p>

            {/* Step indicators */}
            <div className="flex justify-center gap-2 mb-8">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : index < currentStep
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-border'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip Tour
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1"
              >
                {currentStep === onboardingSteps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
