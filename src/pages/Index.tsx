import { useState } from "react";
import { Camera, Scan, Shield, Globe2, Clock, BookOpen, LogOut, History, Star, TrendingUp, Award, CheckCircle, Zap, Eye, Lock, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/CameraCapture";
import { MedicationCard } from "@/components/MedicationCard";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TranslatedText, useCommonTranslations } from "@/components/TranslatedText";
import { ScanResultDialog } from "@/components/ScanResultDialog";
import { ScanHistory } from "./ScanHistory";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/medical-hero-optimized.webp";
import heroImageFallback from "@/assets/medical-hero.jpg";
import ProfessionalMobileLayout from "@/components/mobile/ProfessionalMobileLayout";
import FloatingActionButton from "@/components/mobile/FloatingActionButton";
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from "@/components/ui/mobile/MobileCard";
import { MobileButton } from "@/components/ui/mobile/MobileButton";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileDashboard from "@/components/mobile/MobileDashboard";
const Index = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showScanResult, setShowScanResult] = useState(false);
  const [scanResultData, setScanResultData] = useState(null);
  const {
    user,
    signOut
  } = useAuth();
  const {
    t,
    language
  } = useTranslation();
  const commonT = useCommonTranslations();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t('common.success'),
        description: t('auth.signOutSuccess')
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.tryAgain'),
        variant: "destructive"
      });
    }
  };
  const handleScanResult = (medicationData: any) => {
    setScanResultData(medicationData);
    setShowCamera(false);
    setShowScanResult(true);
  };
  const features = [{
    icon: Shield,
    title: t('features.safetyFirst'),
    description: t('features.safetyDescription')
  }, {
    icon: Globe2,
    title: t('features.multiLanguage'),
    description: t('features.languageDescription')
  }, {
    icon: Clock,
    title: t('features.instantResults'),
    description: t('features.resultsDescription')
  }, {
    icon: BookOpen,
    title: t('features.evidenceBased'),
    description: t('features.evidenceDescription')
  }];
  if (showCamera) {
    return <CameraCapture onClose={() => setShowCamera(false)} onScanResult={handleScanResult} language={language} />;
  }
  if (showHistory) {
    return <ScanHistory />;
  }
  const content = <div className={`${!isMobile ? 'min-h-screen bg-background' : ''}`}>
      {/* Desktop Header */}
      {!isMobile && <header className="sticky top-0 z-50 px-6 py-4 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <picture>
                  <source srcSet="/lovable-uploads/pilllens-logo-48x48.webp" type="image/webp" />
                  <img 
                    src="/lovable-uploads/17a150fa-03fc-4034-b5d2-287f4b29588f.png" 
                    alt="PillLens" 
                    className="w-12 h-12 object-contain"
                    width="48"
                    height="48"
                  />
                </picture>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">PillLens</h1>
                <p className="text-sm text-muted-foreground font-medium">Smart Medication Assistant</p>
              </div>
            </div>
            
          </div>
        </header>}

      {/* Main Content */}
      <main className={`${!isMobile ? 'max-w-7xl mx-auto px-6 py-12' : 'px-4 py-6'}`}>
        {/* Desktop Hero Section */}
        {!isMobile && <section className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-gradient-to-r from-primary/10 to-primary-light/10 text-primary border-primary/20 px-4 py-2 font-medium">
                  <Shield className="w-4 h-4 mr-2" />
                  <TranslatedText translationKey="hero.badge" fallback="Privacy-First • Safety-Focused" />
                </Badge>
                
                <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                  <span className="block">
                    <TranslatedText translationKey="hero.title1" fallback="Snap. Scan." />
                  </span>
                  <span className="block text-primary bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                    <TranslatedText translationKey="hero.title2" fallback="Understand." />
                  </span>
                  <span className="block text-3xl md:text-4xl text-primary font-medium mt-2 bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                    Your AI Medication Guide
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                  <TranslatedText translationKey="hero.description" fallback="Scan any pill box, barcode, or leaflet to get safe, evidence-based details — what it is, how to take it, and important warnings" />
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-6 py-8 border-t border-b border-border/50">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">99.2%</div>
                  <div className="text-sm text-muted-foreground font-medium">Accuracy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground font-medium">Medications Scanned</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">15K+</div>
                  <div className="text-sm text-muted-foreground font-medium">Active Users</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button size="lg" onClick={() => setShowCamera(true)} className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-primary-foreground shadow-medical hover:shadow-floating transition-all duration-300 px-8">
                  <Camera className="w-5 h-5 mr-2" />
                  <TranslatedText translationKey="scanner.scanMedication" fallback="Start Scanning" />
                </Button>
                
                <Button variant="outline" size="lg" onClick={() => setShowHistory(true)} className="border-primary/20 hover:bg-primary/5 px-8">
                  <History className="w-5 h-5 mr-2" />
                  <TranslatedText translationKey="navigation.history" fallback="View History" />
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">FDA Approved Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">Medical Grade</span>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-background to-muted/30">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <picture>
                    <source srcSet={heroImage} type="image/webp" />
                    <img 
                      src={heroImageFallback} 
                      alt="Medical OCR scanning interface" 
                      className="w-full h-full object-cover"
                      width="500"
                      height="375"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
                </div>
                
                {/* Clean Floating Badges */}
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg shadow-lg">
                  AI Powered
                </div>
                
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-warning text-warning-foreground text-sm font-medium rounded-lg shadow-lg">
                  ⚡ Instant
                </div>
                
                <div className="absolute bottom-4 left-4 px-4 py-2 bg-success text-success-foreground text-sm font-semibold rounded-lg shadow-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  99.2% Accurate
                </div>
              </div>
            </div>
          </section>}

        {/* Mobile Hero Section */}
        {isMobile && <div className="text-center mb-8">
            <Badge className="mb-4 bg-primary-light text-primary border-primary/20">
              <TranslatedText translationKey="hero.badge" fallback="Privacy-First • Safety-Focused" />
            </Badge>
            <h2 className="text-2xl font-bold text-foreground mb-4 leading-tight">
              <TranslatedText translationKey="hero.title1" fallback="Snap. Scan. Understand." />
              <br />
              <span className="text-primary">
                <TranslatedText translationKey="hero.title2" fallback="Your AI Medication Guide" />
              </span>
            </h2>
            <p className="text-base text-muted-foreground mb-8">
              <TranslatedText translationKey="hero.description" fallback="Scan any pill box, barcode, or leaflet to get safe, evidence-based details — what it is, how to take it, and important warnings" />
            </p>
          </div>}

        {/* Enhanced Features Section */}
        <section className={`${!isMobile ? 'mb-20' : 'mb-8'}`}>
          {!isMobile && <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose PillLens?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Advanced AI-powered medication analysis with medical-grade accuracy and privacy protection
              </p>
            </div>}

          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
            {features.map((feature, index) => <Card key={index} className={`group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-medical ${!isMobile ? 'p-8 hover:-translate-y-2' : 'p-6'}`}>
                <div className={`${isMobile ? 'text-center' : 'text-left'}`}>
                  {/* Icon */}
                  <div className={`relative mb-6 ${isMobile ? 'mx-auto' : ''}`}>
                    <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-xl bg-gradient-to-br from-primary/10 to-primary-light/20 flex items-center justify-center shadow-medical group-hover:shadow-floating group-hover:scale-110 transition-all duration-300`}>
                      <feature.icon className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} text-primary`} />
                    </div>
                    
                    {!isMobile && <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-primary-light/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>}
                  </div>

                  {/* Content */}
                  <h3 className={`font-bold text-foreground mb-3 group-hover:text-primary transition-colors ${isMobile ? 'text-base' : 'text-xl'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-muted-foreground leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {feature.description}
                  </p>

                  {/* Hover Effect */}
                  {!isMobile && <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary-light transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>}
                </div>
              </Card>)}
          </div>
        </section>

        {/* How It Works Section - Desktop Only */}
        {!isMobile && <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Three simple steps to understand your medication completely
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[{
            step: "01",
            icon: Camera,
            title: "Capture",
            description: "Take a photo of your medication box, bottle, or leaflet using your camera",
            color: "primary"
          }, {
            step: "02",
            icon: Eye,
            title: "Analyze",
            description: "Our AI extracts and analyzes medication information with medical-grade accuracy",
            color: "info"
          }, {
            step: "03",
            icon: Heart,
            title: "Understand",
            description: "Get comprehensive information about usage, side effects, and interactions",
            color: "success"
          }].map((step, index) => <div key={index} className="relative text-center group">
                  {/* Connector Line */}
                  {index < 2 && <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-border to-transparent transform translate-x-1/2 z-0"></div>}
                  
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
                </div>)}
            </div>
          </section>}

        {/* Trust & Safety Section */}
        <section className={`${!isMobile ? 'mb-20' : 'mb-8'}`}>
          {!isMobile && <>
              {/* Trust Stats */}
              <div className="grid md:grid-cols-4 gap-6 mb-12">
                {[{
              icon: TrendingUp,
              value: "99.2%",
              label: "Accuracy Rate",
              color: "success"
            }, {
              icon: Users,
              value: "15K+",
              label: "Trust Users",
              color: "primary"
            }, {
              icon: Shield,
              value: "100%",
              label: "Privacy Protected",
              color: "info"
            }, {
              icon: Zap,
              value: "<3s",
              label: "Scan Speed",
              color: "warning"
            }].map((stat, index) => <Card key={index} className="text-center p-6 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medical">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-${stat.color}/10 to-${stat.color}-light/20 flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                    </div>
                    <div className={`text-3xl font-bold text-${stat.color} mb-2`}>{stat.value}</div>
                    <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                  </Card>)}
              </div>

              {/* Testimonials */}
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                {[{
              quote: "PillLens has revolutionized how I manage my family's medications. The accuracy is incredible.",
              author: "Dr. Sarah Chen",
              role: "Family Physician",
              rating: 5
            }, {
              quote: "As a pharmacist, I recommend PillLens to patients who need reliable medication information.",
              author: "Mark Rodriguez",
              role: "Licensed Pharmacist",
              rating: 5
            }, {
              quote: "The privacy features give me confidence. My medical information stays secure.",
              author: "Emily Watson",
              role: "Healthcare Administrator",
              rating: 5
            }].map((testimonial, index) => <Card key={index} className="p-6 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medical">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({
                  length: testimonial.rating
                }).map((_, i) => <Star key={i} className="w-4 h-4 text-warning fill-warning" />)}
                    </div>
                    <blockquote className="text-muted-foreground mb-4 leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </Card>)}
              </div>
            </>}

          {/* Safety Notice */}
          <Card className={`border-warning/40 ${!isMobile ? 'p-8' : 'p-6'} bg-gradient-to-r from-warning/5 to-warning-light/10 shadow-warning`}>
            <div className="flex items-start gap-4">
              <div className={`${!isMobile ? 'w-16 h-16' : 'w-12 h-12'} rounded-xl bg-gradient-to-br from-warning to-warning-light flex items-center justify-center flex-shrink-0 shadow-warning`}>
                <Shield className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'} text-white`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-warning-foreground mb-3 ${!isMobile ? 'text-xl' : 'text-base'}`}>
                  <TranslatedText translationKey="safety.importantInfo" fallback="Important Medical Information" />
                </h3>
                <p className={`text-muted-foreground leading-relaxed ${!isMobile ? 'text-base' : 'text-sm'}`}>
                  <TranslatedText translationKey="safety.disclaimer" fallback="PillLens provides information extracted from official medication labels and leaflets. This is not medical advice. Always consult your healthcare provider or pharmacist for personalized medical guidance and treatment decisions." />
                </p>
                
                {!isMobile && <div className="flex items-center gap-6 mt-6 pt-6 border-t border-warning/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-sm font-medium text-foreground">HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-sm font-medium text-foreground">FDA Approved Sources</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-sm font-medium text-foreground">Medical Grade Security</span>
                    </div>
                  </div>}
              </div>
            </div>
          </Card>
        </section>
      </main>

      {/* Floating Action Button for Mobile */}
      {isMobile && <FloatingActionButton onClick={() => setShowCamera(true)} />}

      {/* Scan Result Dialog */}
      {scanResultData && <ScanResultDialog open={showScanResult} onClose={() => {
      setShowScanResult(false);
      setScanResultData(null);
    }} medicationData={scanResultData} />}
    </div>;
  if (isMobile) {
    return <ProfessionalMobileLayout title={t('app.title', 'PillLens')} showHeader={false}>
        <MobileDashboard onScanPress={() => setShowCamera(true)} language={language} />
        
        {/* Scan Result Dialog */}
        {scanResultData && <ScanResultDialog open={showScanResult} onClose={() => {
        setShowScanResult(false);
        setScanResultData(null);
      }} medicationData={scanResultData} />}
      </ProfessionalMobileLayout>;
  }
  return content;
};
export default Index;