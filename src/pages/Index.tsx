import { useState } from "react";
import { Camera, Scan, Shield, Globe2, Clock, BookOpen, LogOut, History, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/CameraCapture";
import { MedicationCard } from "@/components/MedicationCard";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ScanHistory } from "./ScanHistory";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import heroImage from "@/assets/medical-hero.jpg";

const Index = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [language, setLanguage] = useState("AZ");
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const features = [
    {
      icon: Shield,
      title: "Safety First",
      description: "Medical-grade accuracy with official source verification"
    },
    {
      icon: Globe2,
      title: "Multi-Language",
      description: "Support for AZ, EN, RU, TR languages"
    },
    {
      icon: Clock,
      title: "Instant Results",
      description: "On-device OCR for immediate medication information"
    },
    {
      icon: BookOpen,
      title: "Evidence-Based",
      description: "Only official label information, no generated content"
    }
  ];

  if (showCamera) {
    return (
      <CameraCapture 
        onClose={() => setShowCamera(false)}
        language={language}
      />
    );
  }

  if (showHistory) {
    return <ScanHistory />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/30 to-secondary-light/20">
      {/* Header */}
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
            <Button variant="ghost" onClick={() => setShowHistory(true)} className="gap-2">
              <History className="h-4 w-4" />
              History
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary-light text-primary font-medium">
            Privacy-First • Safety-Focused
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Snap. Scan. Understand.
            <br />
            <span className="text-primary">Your Medication</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get instant, evidence-based medication information by capturing photos of medicine boxes or leaflets. 
            Safe, accurate, and sourced from official labels only.
          </p>

          {/* Hero Image */}
          <div className="relative mb-8 mx-auto max-w-2xl">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-elevated">
              <img 
                src={heroImage} 
                alt="Medical OCR scanning interface"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={() => setShowCamera(true)}
              className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-medical text-lg px-8 py-6 h-auto"
            >
              <Camera className="w-6 h-6 mr-3" />
              Scan Medication
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowHistory(true)}
              className="border-2 border-primary text-primary hover:bg-primary-light text-lg px-8 py-6 h-auto"
            >
              <History className="w-6 h-6 mr-3" />
              View History
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-card transition-all duration-300 border-2 border-transparent hover:border-primary-light">
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Safety Notice */}
        <Card className="bg-warning/10 border-warning/30 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Important Safety Information</h3>
              <p className="text-sm text-muted-foreground">
                PharmaLens provides information extracted from official medication labels and leaflets. 
                This is not medical advice. Always consult your healthcare provider or pharmacist for 
                personalized medical guidance, especially for high-risk medications.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Index;
