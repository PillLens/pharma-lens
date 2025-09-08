import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { hapticService } from '@/services/hapticService';
import { Pill, Camera, Clock, Users, Shield, CheckCircle, Zap, Heart } from 'lucide-react';

const Loading = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const steps = [
    { icon: Pill, title: "Smart Pill Recognition", subtitle: "AI-powered medication identification" },
    { icon: Camera, title: "Instant Scanning", subtitle: "Just point and scan any medication" },
    { icon: Clock, title: "Never Miss a Dose", subtitle: "Intelligent reminder system" },
    { icon: Users, title: "Family Health Hub", subtitle: "Care for your loved ones" },
    { icon: Shield, title: "Secure & Private", subtitle: "Your health data protected" }
  ];

  useEffect(() => {
    setShowContent(true);
    
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          hapticService.feedback('light');
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    const completionTimer = setTimeout(() => {
      hapticService.feedback('success');
      navigate('/');
    }, 8500);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(completionTimer);
    };
  }, [navigate]);

  const handleSkip = () => {
    hapticService.feedback('light');
    navigate('/');
  };

  const handleContinue = () => {
    hapticService.feedback('success');
    navigate('/');
  };

  if (!isMobile) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <Pill className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">PillLens Mobile Experience</h1>
          <p className="text-muted-foreground mb-6">
            This promotional experience is optimized for mobile devices. Please view on your phone or tablet for the full interactive experience.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary-glow edge-to-edge">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Floating Pills Animation */}
        <div className="absolute top-1/4 left-1/4 w-4 h-8 bg-success/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-warning/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-3 h-6 bg-info/20 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '3.5s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-5 h-5 bg-success/20 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '2s' }} />
        
        {/* Scan Lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-primary-foreground to-transparent animate-scan-line" />
        </div>
        
        {/* Medical Cross Pattern */}
        <div className="absolute top-16 right-8 w-6 h-6 opacity-20">
          <Heart className="w-full h-full text-primary-foreground animate-medical-pulse" />
        </div>
        <div className="absolute bottom-20 left-8 w-8 h-8 opacity-20">
          <Zap className="w-full h-full text-primary-foreground animate-medical-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
        {/* Logo Section */}
        <div className={`mb-12 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="w-24 h-24 mx-auto mb-6 bg-primary-foreground/10 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-glow animate-medical-pulse">
            <Pill className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">PillLens</h1>
          <p className="text-primary-foreground/80 text-lg">Your Smart Medication Assistant</p>
        </div>

        {/* Feature Steps */}
        <div className="w-full max-w-sm mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isVisible = index <= currentStep;
            const isActive = index === currentStep;
            
            return (
              <div
                key={index}
                className={`flex items-center mb-6 transition-all duration-700 ${
                  isVisible 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-8'
                } ${isActive ? 'scale-105' : ''}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 transition-all duration-500 ${
                  isActive 
                    ? 'bg-success shadow-success bg-success animate-success-bounce' 
                    : isVisible 
                      ? 'bg-primary-foreground/20 backdrop-blur-sm'
                      : 'bg-primary-foreground/10'
                }`}>
                  {isActive && index === currentStep && currentStep === steps.length - 1 ? (
                    <CheckCircle className="w-6 h-6 text-success-foreground" />
                  ) : (
                    <Icon className={`w-6 h-6 ${
                      isActive ? 'text-success-foreground' : 'text-primary-foreground'
                    }`} />
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-primary-foreground font-semibold text-lg">{step.title}</h3>
                  <p className="text-primary-foreground/70 text-sm">{step.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className="w-full max-w-xs mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  index <= currentStep 
                    ? 'bg-success shadow-success' 
                    : 'bg-primary-foreground/20'
                }`}
              />
            ))}
          </div>
          <div className="w-full bg-primary-foreground/20 rounded-full h-1">
            <div 
              className="bg-success h-1 rounded-full transition-all duration-700 shadow-success"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 w-full max-w-xs">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 px-6 rounded-xl bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground border border-primary-foreground/20 font-medium transition-all duration-300 hover:bg-primary-foreground/20 hover:scale-105 touch-target"
          >
            Skip
          </button>
          
          {currentStep === steps.length - 1 && (
            <button
              onClick={handleContinue}
              className="flex-1 py-3 px-6 rounded-xl bg-success text-success-foreground font-medium transition-all duration-300 hover:bg-success-glow hover:scale-105 shadow-success animate-success-bounce touch-target"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Bottom Safe Area */}
        <div className="h-safe-area-inset-bottom" />
      </div>

      {/* Tap Anywhere Hint */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-primary-foreground/60 text-sm animate-pulse">
          Tap anywhere to continue
        </p>
      </div>

      {/* Tap to Skip Overlay */}
      <button
        onClick={handleSkip}
        className="absolute inset-0 w-full h-full bg-transparent z-0"
        aria-label="Skip loading animation"
      />
    </div>
  );
};

export default Loading;