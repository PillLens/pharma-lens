import { useState, useRef } from "react";
import { Camera as CameraIcon, X, RotateCcw, CheckCircle, AlertTriangle, Loader2, Scan, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedicationCard } from "./MedicationCard";
import { FeedbackDialog } from "./FeedbackDialog";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "@capacitor/camera";
import { CameraResultType, CameraSource } from "@capacitor/camera";
import { supabase } from "@/integrations/supabase/client";
import { ocrService } from "@/services/ocrService";
import { barcodeService } from "@/services/barcodeService";
import { useAuth } from "@/hooks/useAuth";

interface CameraCaptureProps {
  onClose: () => void;
  onScanResult?: (medicationData: any) => void;
  language: string;
}

export const CameraCapture = ({ onClose, onScanResult, language }: CameraCaptureProps) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [barcodeData, setBarcodeData] = useState<any>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [productFromDb, setProductFromDb] = useState<any>(null);
  const [safetyWarnings, setSafetyWarnings] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const lookupProductByBarcode = async (barcode: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Barcode lookup error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to lookup product by barcode:', error);
      return null;
    }
  };

  const saveSession = async (barcodeValue?: string, extractionData?: any) => {
    if (!user) return null;

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          barcode_value: barcodeValue || null,
          language,
          region: 'AZ',
          images: capturedImage ? [capturedImage] : [],
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const newSessionId = sessionData.id;
      setSessionId(newSessionId);

      // Save extraction data if available
      if (extractionData) {
        const { error: extractionError } = await supabase
          .from('extractions')
          .insert({
            user_id: user.id,
            extracted_json: extractionData,
            quality_score: extractionData.confidence_score || 0,
            risk_flags: calculateRiskFlags(extractionData),
          });

        if (extractionError) {
          console.error('Error saving extraction:', extractionError);
        }
      }

      return newSessionId;
    } catch (error) {
      console.error('Error saving session:', error);
      return null;
    }
  };

  const calculateRiskFlags = (medicationData: any): string[] => {
    const flags: string[] = [];
    
    // Check confidence score
    if ((medicationData.confidence_score || 0) < 0.7) {
      flags.push("Low confidence extraction - verification recommended");
    }

    // Check for high-risk medication keywords
    const highRiskKeywords = ['insulin', 'warfarin', 'digoxin', 'lithium', 'chemotherapy'];
    const medicationText = `${medicationData.brand_name || ''} ${medicationData.generic_name || ''}`.toLowerCase();
    
    if (highRiskKeywords.some(keyword => medicationText.includes(keyword))) {
      flags.push("High-risk medication - requires careful monitoring");
    }

    return flags;
  };

  const validateSafetyThresholds = (confidence: number, extractedData: any) => {
    const warnings: string[] = [];

    if (confidence < 0.7) {
      warnings.push("Image quality too low for reliable extraction. Please retake with better lighting.");
    }

    if (confidence < 0.5) {
      warnings.push("Critical: Cannot reliably extract medication information from this image.");
    }

    if (!extractedData?.brand_name) {
      warnings.push("Unable to identify medication brand name. Manual verification required.");
    }

    setSafetyWarnings(warnings);
    return warnings.length === 0;
  };

  const extractMedicationInfo = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-medication', {
        body: { 
          text, 
          language,
          region: 'AZ'
        }
      });

      if (error) {
        console.error('Extraction error:', error);
        throw error;
      }

      return data?.data;
    } catch (error) {
      console.error('Failed to extract medication info:', error);
      throw error;
    }
  };

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
    let barcodeValue: string | undefined;
    let medicationData: any = null;

    try {
      // Step 1: Check for barcode
      setProcessingStep("Scanning for barcode...");
      const barcode = await barcodeService.scanBarcode(imageData);
      if (barcode) {
        setBarcodeData(barcode);
        barcodeValue = barcode.code;
        console.log('Detected barcode:', barcode);

        // Try to lookup product from database
        const product = await lookupProductByBarcode(barcodeValue);
        if (product) {
          setProductFromDb(product);
          setProcessingStep("Found medication in database...");
        }
      }

      // Step 2: Perform OCR
      setProcessingStep("Extracting text from image...");
      await ocrService.initialize();
      const ocrResult = await ocrService.processImage(imageData);
      
      setOcrText(ocrResult.text);
      setConfidence(ocrResult.confidence);

      // Step 3: Extract medication info if we have sufficient text
      if (ocrResult.text.trim().length > 10) {
        setProcessingStep("Analyzing medication information...");
        medicationData = await extractMedicationInfo(ocrResult.text);
        setExtractedData(medicationData);

        // Validate safety thresholds
        const isSafe = validateSafetyThresholds(ocrResult.confidence, medicationData);
        
        if (!isSafe) {
          toast({
            title: "Safety Warning",
            description: "Please review the warnings before proceeding.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: "Medication information extracted successfully.",
          });
        }
      } else {
        throw new Error("Insufficient text detected in image. Please try a clearer photo.");
      }

      // Save session to database
      await saveSession(barcodeValue, medicationData);
      setScanComplete(true);

    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setOcrText("");
    setConfidence(0);
    setExtractedData(null);
    setBarcodeData(null);
    setProcessingStep("");
    setIsProcessing(false);
    setSessionId(null);
    setScanComplete(false);
    setProductFromDb(null);
    setSafetyWarnings([]);
  };

  const handleContinue = () => {
    if (onScanResult && extractedData) {
      onScanResult(extractedData);
    } else {
      setShowFeedback(true);
    }
  };

  const handleFeedbackComplete = () => {
    onClose();
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
                
                {!isProcessing && scanComplete && (
                  <Button 
                    onClick={handleContinue}
                    className="flex-1 bg-gradient-to-r from-secondary to-secondary text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Continue
                  </Button>
                )}
              </div>
            </Card>

            {/* Processing Status */}
            {isProcessing && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="font-medium">Processing Image...</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {processingStep || "Analyzing your medication image..."}
                </p>
              </Card>
            )}

            {(barcodeData || ocrText) && !isProcessing && (
              <Card className="p-6">
                <div className="space-y-4">
                  {barcodeData && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Scan className="h-4 w-4" />
                        Detected Barcode:
                      </h4>
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <p><strong>Code:</strong> {barcodeData.code}</p>
                        <p><strong>Format:</strong> {barcodeData.format}</p>
                        <p><strong>Confidence:</strong> {(barcodeData.confidence * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  )}
                  
                  {ocrText && (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm text-muted-foreground">Extracted Text:</h4>
                        <Badge 
                          {...getConfidenceBadge(confidence)}
                          className="text-xs"
                        >
                          {Math.round(confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {ocrText}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Analysis completed successfully</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Safety Warnings */}
            {safetyWarnings.length > 0 && !isProcessing && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {safetyWarnings.map((warning, index) => (
                      <p key={index}>{warning}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Database Product Match */}
            {productFromDb && !isProcessing && (
              <Card className="p-6 border-success">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <h3 className="font-semibold text-foreground">Product Found in Database</h3>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">{productFromDb.brand_name}</h4>
                  {productFromDb.generic_name && (
                    <p className="text-sm text-muted-foreground">Generic: {productFromDb.generic_name}</p>
                  )}
                  {productFromDb.strength && (
                    <p className="text-sm text-muted-foreground">Strength: {productFromDb.strength}</p>
                  )}
                  {productFromDb.form && (
                    <p className="text-sm text-muted-foreground">Form: {productFromDb.form}</p>
                  )}
                  {productFromDb.manufacturer && (
                    <p className="text-sm text-muted-foreground">Manufacturer: {productFromDb.manufacturer}</p>
                  )}
                </div>
              </Card>
            )}

            {/* Extracted Medication Information */}
            {extractedData && !isProcessing && (
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  {productFromDb ? "OCR Verification" : "Extracted Medication Information"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground">{extractedData.brand_name}</h4>
                    {extractedData.generic_name && (
                      <p className="text-sm text-muted-foreground">Generic: {extractedData.generic_name}</p>
                    )}
                    {extractedData.strength && (
                      <p className="text-sm text-muted-foreground">Strength: {extractedData.strength}</p>
                    )}
                    {extractedData.form && (
                      <p className="text-sm text-muted-foreground">Form: {extractedData.form}</p>
                    )}
                    {extractedData.manufacturer && (
                      <p className="text-sm text-muted-foreground">Manufacturer: {extractedData.manufacturer}</p>
                    )}
                  </div>

                  {extractedData.indications && extractedData.indications.length > 0 && (
                    <div>
                      <h5 className="font-medium text-foreground mb-2">Indications:</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {extractedData.indications.map((indication: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground">{indication}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {extractedData.warnings && extractedData.warnings.length > 0 && (
                    <div>
                      <h5 className="font-medium text-foreground mb-2">Warnings:</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {extractedData.warnings.map((warning: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {extractedData.dosage && (
                    <div>
                      <h5 className="font-medium text-foreground">Dosage:</h5>
                      <p className="text-sm text-muted-foreground">{extractedData.dosage}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Badge variant={extractedData.confidence_score >= 0.8 ? "default" : "secondary"}>
                      Confidence: {Math.round((extractedData.confidence_score || 0) * 100)}%
                    </Badge>
                    {calculateRiskFlags(extractedData).length > 0 && (
                      <Badge variant="destructive">
                        {calculateRiskFlags(extractedData).length} Risk Flag{calculateRiskFlags(extractedData).length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={showFeedback}
        onOpenChange={setShowFeedback}
        sessionId={sessionId || undefined}
        onComplete={handleFeedbackComplete}
      />
    </div>
  );
};