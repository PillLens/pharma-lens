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
    <div className={`${!isMobile ? 'min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-secondary-light/10' : ''}`}>
      {/* Desktop Header */}
      {!isMobile && (
        <header className="px-4 py-6 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">PillLens</h1>
                <p className="text-sm text-muted-foreground">Medication Guide</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector value={language} onChange={setLanguage} />
              <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="gap-2">
                <History className="h-4 w-4" />
                <TranslatedText translationKey="navigation.history" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/medications")} className="gap-2">
                <Pill className="h-4 w-4" />
                <TranslatedText translationKey="navigation.medications" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/family")} className="gap-2">
                <Users className="h-4 w-4" />
                <TranslatedText translationKey="navigation.family" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/reminders")} className="gap-2">
                <Bell className="h-4 w-4" />
                <TranslatedText translationKey="navigation.reminders" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/security")} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <TranslatedText translationKey="navigation.security" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                <TranslatedText translationKey="auth.signOut" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`${!isMobile ? 'max-w-4xl mx-auto px-4 py-8' : 'px-4 py-6'}`}>
        {/* Hero Section */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-primary-light text-primary border-primary/20">
            <TranslatedText translationKey="hero.badge" fallback="Privacy-First • Safety-Focused" />
          </Badge>
          <h2 className={`font-bold text-foreground mb-4 leading-tight ${
            isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'
          }`}>
            <TranslatedText translationKey="hero.title1" fallback="Snap. Scan. Understand." />
            <br />
            <span className="text-primary">
              <TranslatedText translationKey="hero.title2" fallback="Your Medication" />
            </span>
          </h2>
          <p className={`text-muted-foreground mb-8 ${
            isMobile ? 'text-base' : 'text-xl max-w-2xl mx-auto'
          }`}>
            <TranslatedText translationKey="hero.description" fallback="Get instant, evidence-based medication information by capturing photos of medicine boxes or leaflets." />
          </p>

          {/* Hero Image */}
          {!isMobile && (
            <div className="relative mb-8 mx-auto max-w-2xl">
              <div className="rounded-lg overflow-hidden shadow-card aspect-video">
                <img 
                  src={heroImage} 
                  alt="Medical OCR scanning interface"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          {/* Action Buttons - Only show scan button on mobile, FAB handles it */}
          {!isMobile && (
            <div className="flex gap-4 justify-center items-center flex-col sm:flex-row">
              <MobileButton 
                size="lg"
                onClick={() => setShowCamera(true)}
                className="w-full sm:w-auto"
              >
                <Camera className="w-5 h-5" />
                <TranslatedText translationKey="scanner.scanMedication" fallback="Scan Medication" />
              </MobileButton>
              
              <MobileButton 
                variant="outline"
                size="lg"
                onClick={() => setShowHistory(true)}
                className="w-full sm:w-auto"
              >
                <History className="w-5 h-5" />
                <TranslatedText translationKey="navigation.history" fallback="View History" />
              </MobileButton>
            </div>
          )}
        </div>

        {/* Premium Features Grid */}
        <div className={`grid gap-4 mb-8 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          {features.map((feature, index) => (
            <MobileCard 
              key={index} 
              variant="medical" 
              interactive
              className="text-center group hover:border-primary/30 transition-all duration-300"
            >
              <MobileCardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-medical flex items-center justify-center mx-auto mb-4 shadow-medical group-hover:shadow-floating group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <MobileCardTitle className="text-base group-hover:text-primary transition-colors">
                  {feature.title}
                </MobileCardTitle>
              </MobileCardHeader>
              <MobileCardContent>
                <MobileCardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </MobileCardDescription>
              </MobileCardContent>
            </MobileCard>
          ))}
        </div>

        {/* Premium Safety Notice */}
        <MobileCard variant="glass" className="border-warning/40 bg-gradient-to-r from-warning/5 to-warning/10 shadow-medical">
          <MobileCardHeader>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center flex-shrink-0 shadow-medical">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <MobileCardTitle className="text-base mb-3 text-warning-foreground">
                  <TranslatedText translationKey="safety.importantInfo" fallback="Important Medical Information" />
                </MobileCardTitle>
                <MobileCardDescription className="text-sm leading-relaxed text-muted-foreground">
                  <TranslatedText translationKey="safety.disclaimer" fallback="PillLens provides information extracted from official medication labels and leaflets. This is not medical advice. Always consult your healthcare provider or pharmacist for personalized medical guidance and treatment decisions." />
                </MobileCardDescription>
              </div>
            </div>
          </MobileCardHeader>
        </MobileCard>
      </main>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <FloatingActionButton onClick={() => setShowCamera(true)} />
      )}

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
      <ProfessionalMobileLayout title={t('app.title', 'PillLens')} showHeader={false}>
        <MobileDashboard 
          onScanPress={() => setShowCamera(true)}
          language={language}
        />
        
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
      </ProfessionalMobileLayout>
    );
  }

  return content;
};

export default Index;
