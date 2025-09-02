import React, { useState, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { CameraCapture } from "@/components/CameraCapture";
import { ScanResultDialog } from "@/components/ScanResultDialog";
import { ScanHistory } from "./ScanHistory";
import MobileDashboard from "@/components/mobile/MobileDashboard";
import MobileHeroSection from "@/components/home/MobileHeroSection";

// Lazy load heavy desktop components for better performance
const HeroSection = React.lazy(() => import("@/components/home/HeroSection"));
const FeaturesSection = React.lazy(() => import("@/components/home/FeaturesSection"));
const HowItWorksSection = React.lazy(() => import("@/components/home/HowItWorksSection"));
const TrustSection = React.lazy(() => import("@/components/home/TrustSection"));
const CallToActionSection = React.lazy(() => import("@/components/home/CallToActionSection"));

// Loading skeleton for Suspense fallback
const SectionSkeleton = React.memo(() => (
  <div className="animate-pulse space-y-6 mb-12">
    <div className="h-32 bg-muted/30 rounded-lg"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-muted/20 rounded-lg"></div>
      ))}
    </div>
  </div>
));

const Index = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showScanResult, setShowScanResult] = useState(false);
  const [scanResultData, setScanResultData] = useState(null);
  
  const { user, signOut } = useAuth();
  const { t, language } = useTranslation();
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

  const handleScanPress = () => setShowCamera(true);
  const handleHistoryPress = () => setShowHistory(true);

  // Early returns for different app states
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

  // Mobile-optimized rendering with dashboard
  if (isMobile) {
    return (
      <div className="edge-to-edge min-h-screen bg-background flex flex-col device-rounded" 
           style={{ minHeight: '100dvh', backgroundColor: 'hsl(var(--background))' }}>
        <main className="flex-1 min-h-0 overflow-y-auto main-scroll remove-last-margin safe-area-x safe-area-top" 
              data-scrollable>
          <div className="min-h-full">
            <MobileHeroSection />
            <MobileDashboard onScanPress={handleScanPress} language={language} />
          </div>
        </main>
        
        {showScanResult && (
          <ScanResultDialog
            open={showScanResult}
            onClose={() => setShowScanResult(false)}
            medicationData={scanResultData}
          />
        )}
      </div>
    );
  }

  // Desktop rendering with lazy-loaded sections for optimal performance
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src="/android-chrome-192x192.png" 
                alt="PillLens" 
                className="w-12 h-12"
                loading="eager"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">PillLens</h1>
              <p className="text-sm text-muted-foreground font-medium">Smart Medication Assistant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Lazy Loading for Performance */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <Suspense fallback={<SectionSkeleton />}>
          <HeroSection onScanPress={handleScanPress} onHistoryPress={handleHistoryPress} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <FeaturesSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HowItWorksSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <TrustSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <CallToActionSection onScanPress={handleScanPress} />
        </Suspense>
      </main>

      {showScanResult && (
        <ScanResultDialog
          open={showScanResult}
          onClose={() => setShowScanResult(false)}
          medicationData={scanResultData}
        />
      )}
    </div>
  );
};

export default Index;