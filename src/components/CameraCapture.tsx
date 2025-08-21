import { useState, useRef } from "react";
import { Camera as CameraIcon, X, RotateCcw, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "@capacitor/camera";
import { CameraResultType, CameraSource } from "@capacitor/camera";

interface CameraCaptureProps {
  onClose: () => void;
  language: string;
}

export const CameraCapture = ({ onClose, language }: CameraCaptureProps) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const { toast } = useToast();

  const captureImage = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      setCapturedImage(image.dataUrl || null);
      
      if (image.dataUrl) {
        await processImage(image.dataUrl);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    try {
      // Simulate OCR processing for demo
      setTimeout(() => {
        // Mock extracted text for demonstration
        const mockText = language === 'AZ' 
          ? "Panadol Extra Ağrı Kesici - 500mg Paracetamol"
          : language === 'RU'
          ? "Парацетамол - болеутоляющее средство 500мг"
          : language === 'TR'
          ? "Panadol Extra Ağrı Kesici - 500mg Parasetamol"
          : "Panadol Extra Pain Relief - 500mg Paracetamol";
        
        setOcrText(mockText);
        setConfidence(0.92);
        setIsProcessing(false);
        
        toast({
          title: "Text Extracted",
          description: "Medication information detected successfully",
        });
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      toast({
        title: "Processing Error",
        description: "Could not process the image",
        variant: "destructive",
      });
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setOcrText("");
    setConfidence(0);
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "text-success";
    if (conf >= 0.6) return "text-warning";
    return "text-destructive";
  };

  const getConfidenceBadge = (conf: number) => {
    if (conf >= 0.8) return { variant: "default" as const, className: "bg-success text-success-foreground" };
    if (conf >= 0.6) return { variant: "secondary" as const, className: "bg-warning text-warning-foreground" };
    return { variant: "destructive" as const };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-6 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Capture Medication</h1>
          </div>
          <Badge variant="outline" className="text-xs">
            {language}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {!capturedImage ? (
          /* Camera Interface */
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-primary-light flex items-center justify-center">
                <CameraIcon className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Position Your Medication</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Point your camera at the medication box, blister pack, or leaflet. 
                Make sure the text is clearly visible and well-lit.
              </p>
            </div>

            <Button 
              size="lg"
              onClick={captureImage}
              className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-medical text-lg px-8 py-6 h-auto"
            >
              <CameraIcon className="w-6 h-6 mr-3" />
              Take Photo
            </Button>

            <div className="mt-8 grid gap-4 text-sm text-muted-foreground max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Ensure good lighting and focus</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Include brand name and strength</span>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <span>Images are processed on-device for privacy</span>
              </div>
            </div>
          </div>
        ) : (
          /* Image Review */
          <div className="space-y-6">
            <Card className="p-6">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                <img 
                  src={capturedImage} 
                  alt="Captured medication"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={retakePhoto}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                
                {!isProcessing && ocrText && (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-secondary to-secondary text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Continue
                  </Button>
                )}
              </div>
            </Card>

            {/* OCR Results */}
            {isProcessing && (
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-muted-foreground">Processing image...</span>
                </div>
              </Card>
            )}

            {ocrText && !isProcessing && (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Extracted Text</h3>
                  <Badge 
                    {...getConfidenceBadge(confidence)}
                    className="text-xs"
                  >
                    {Math.round(confidence * 100)}% confidence
                  </Badge>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="font-mono text-sm text-foreground">{ocrText}</p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Text extracted successfully</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};