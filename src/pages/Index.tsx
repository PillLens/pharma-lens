import { useState } from "react";
import { Camera, Scan, Shield, Globe2, Clock, BookOpen, LogOut, History, Search, Pill, Users, BarChart3, Bell } from "lucide-react";
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
import heroImage from "@/assets/medical-hero.jpg";
import MobileLayout from "@/components/MobileLayout";
import EnhancedMobileLayout from "@/components/EnhancedMobileLayout";
import { EnhancedCard } from "@/components/ui/enhanced/EnhancedCard";
import { EnhancedButton } from "@/components/ui/enhanced/EnhancedButton";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showScanResult, setShowScanResult] = useState(false);
  const [scanResultData, setScanResultData] = useState(null);
  const [language, setLanguage] = useState("AZ");
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const commonT = useCommonTranslations();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t('common.success'),
        description: t('auth.signOutSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.tryAgain'),
        variant: "destructive",
      });
    }
  };

  const handleScanResult = (medicationData: any) => {
    setScanResultData(medicationData);
    setShowCamera(false);
    setShowScanResult(true);
  };
  
  const features = [
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
  ];

  if (showCamera) {
    return (
      <CameraCapture 
        onClose={() => setShowCamera(false)}
        onScanResult={handleScanResult}
        language={language}
      />
    );
  }

  if (showHistory) {
    return <ScanHistory />;
  }

  const content = (
    <div className={`min-h-screen ${!isMobile ? 'bg-gradient-to-br from-background via-primary-light/30 to-secondary-light/20' : ''}`}>
      {/* Desktop Header */}
      {!isMobile && (
        <header className="px-4 py-6 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">PharmaLens</h1>
                <p className="text-sm text-muted-foreground">Medication Guide</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector value={language} onChange={setLanguage} />
              <Button variant="ghost" onClick={() => navigate("/history")} className="gap-2">
                <History className="h-4 w-4" />
                <TranslatedText translationKey="navigation.history" />
              </Button>
              <Button variant="ghost" onClick={() => navigate("/medications")} className="gap-2">
                <Pill className="h-4 w-4" />
                <TranslatedText translationKey="navigation.medications" />
              </Button>
              <Button variant="ghost" onClick={() => navigate("/family")} className="gap-2">
                <Users className="h-4 w-4" />
                <TranslatedText translationKey="navigation.family" />
              </Button>
              <Button variant="ghost" onClick={() => navigate("/reminders")} className="gap-2">
                <Bell className="h-4 w-4" />
                <TranslatedText translationKey="navigation.reminders" />
              </Button>
              <Button variant="ghost" onClick={() => navigate("/security")} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <TranslatedText translationKey="navigation.security" />
              </Button>
              <Button variant="ghost" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                <TranslatedText translationKey="auth.signOut" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`${!isMobile ? 'max-w-4xl mx-auto px-4 py-8' : ''}`}>
        {/* Hero Section */}
        <div className={`text-center ${!isMobile ? 'mb-12' : 'mb-8'}`}>
          <Badge className={`mb-4 bg-primary-light text-primary font-medium ${isMobile ? 'text-xs' : ''}`}>
            <TranslatedText translationKey="hero.badge" fallback="Privacy-First • Safety-Focused" />
          </Badge>
          <h2 className={`font-bold text-foreground mb-6 leading-tight ${
            isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'
          }`}>
            <TranslatedText translationKey="hero.title1" fallback="Snap. Scan. Understand." />
            <br />
            <span className="text-primary">
              <TranslatedText translationKey="hero.title2" fallback="Your Medication" />
            </span>
          </h2>
          <p className={`text-muted-foreground mb-8 max-w-2xl mx-auto ${
            isMobile ? 'text-base px-2' : 'text-xl'
          }`}>
            <TranslatedText translationKey="hero.description" fallback="Get instant, evidence-based medication information by capturing photos of medicine boxes or leaflets. Safe, accurate, and sourced from official labels only." />
          </p>

          {/* Hero Image - Show smaller on mobile */}
          <div className={`relative mb-8 mx-auto ${isMobile ? 'max-w-sm' : 'max-w-2xl'}`}>
            <div className={`rounded-2xl overflow-hidden shadow-elevated ${isMobile ? 'aspect-square' : 'aspect-video'}`}>
              <img 
                src={heroImage} 
                alt="Medical OCR scanning interface"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
          </div>
          
          <div className={`flex gap-4 justify-center items-center ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}>
            <EnhancedButton 
              size="lg"
              onClick={() => setShowCamera(true)}
              className={`animate-scale-in ${
                isMobile ? 'w-full' : ''
              }`}
              style={{ animationDelay: '0.2s' }}
            >
              <Camera className="w-6 h-6" />
              <TranslatedText translationKey="scanner.scanMedication" fallback="Scan Medication" />
            </EnhancedButton>
            
            <EnhancedButton 
              variant="outline"
              size="lg"
              onClick={() => setShowHistory(true)}
              className={`animate-scale-in ${
                isMobile ? 'w-full' : ''
              }`}
              style={{ animationDelay: '0.4s' }}
            >
              <History className="w-6 h-6" />
              <TranslatedText translationKey="navigation.history" fallback="View History" />
            </EnhancedButton>
          </div>
        </div>

        {/* Features Grid */}
        <div className={`grid gap-6 mb-12 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          {features.map((feature, index) => (
            <EnhancedCard 
              key={index} 
              variant="glass"
              className={`text-center animate-fade-in-up ${
                isMobile ? 'p-5' : 'p-6'
              }`}
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              <div className={`rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4 shadow-glow ${
                isMobile ? 'w-12 h-12' : 'w-14 h-14'
              }`}>
                <feature.icon className={`text-primary ${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} />
              </div>
              <h3 className={`font-bold text-foreground mb-3 ${isMobile ? 'text-base' : 'text-lg'}`}>{feature.title}</h3>
              <p className={`text-muted-foreground leading-relaxed ${isMobile ? 'text-sm' : 'text-sm'}`}>{feature.description}</p>
            </EnhancedCard>
          ))}
        </div>

        {/* Safety Notice */}
        <EnhancedCard 
          variant="gradient" 
          className={`bg-gradient-to-r from-warning/10 to-destructive/5 border-warning/30 animate-fade-in-up ${isMobile ? 'p-5' : 'p-6'}`}
          style={{ animationDelay: '1.2s' }}
        >
          <div className="flex items-start gap-4">
            <div className={`rounded-2xl bg-warning/20 flex items-center justify-center flex-shrink-0 shadow-glow ${
              isMobile ? 'w-10 h-10' : 'w-12 h-12'
            }`}>
              <Shield className={`text-warning ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </div>
            <div>
              <h3 className={`font-bold text-foreground mb-3 ${isMobile ? 'text-base' : 'text-lg'}`}>
                <TranslatedText translationKey="safety.importantInfo" fallback="Important Safety Information" />
              </h3>
              <p className={`text-muted-foreground leading-relaxed ${isMobile ? 'text-sm' : 'text-sm'}`}>
                <TranslatedText translationKey="safety.disclaimer" fallback="PharmaLens provides information extracted from official medication labels and leaflets. This is not medical advice. Always consult your healthcare provider or pharmacist for personalized medical guidance, especially for high-risk medications." />
              </p>
            </div>
          </div>
        </EnhancedCard>
      </main>

      {/* Scan Result Dialog */}
      {scanResultData && (
        <ScanResultDialog
          open={showScanResult}
          onClose={() => {
            setShowScanResult(false);
            setScanResultData(null);
          }}
          medicationData={scanResultData}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <EnhancedMobileLayout title={t('app.title', 'PharmaLens')}>
        {content}
      </EnhancedMobileLayout>
    );
  }

  return content;
};

export default Index;
