import { useState, useRef } from "react";
import { Camera as CameraIcon, X, RotateCcw, CheckCircle, AlertTriangle, Loader2, Scan, Star, ImageIcon, Upload } from "lucide-react";
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
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();

  const lookupProductByBarcode = async (barcode: string) => {
    try {
      const { data, error } = await (supabase as any)
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

  // Map language to region
  const getRegionFromLanguage = (lang: string): string => {
    const languageRegionMap: { [key: string]: string } = {
      'AZ': 'AZ', // Azerbaijan
      'EN': 'US', // English - United States
      'RU': 'RU', // Russian - Russia  
      'TR': 'TR'  // Turkish - Turkey
    };
    return languageRegionMap[lang] || 'US';
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
          region: getRegionFromLanguage(language),
          images: capturedImage ? [capturedImage] : [],
        } as any)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const newSessionId = (sessionData as any)?.id;
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
          } as any);

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
      flags.push(t('scanner.lowConfidenceWarning'));
    }

    // Check for high-risk medication keywords
    const highRiskKeywords = ['insulin', 'warfarin', 'digoxin', 'lithium', 'chemotherapy'];
    const medicationText = `${medicationData.brand_name || ''} ${medicationData.generic_name || ''}`.toLowerCase();
    
    if (highRiskKeywords.some(keyword => medicationText.includes(keyword))) {
      flags.push(t('scanner.highRiskWarning'));
    }

    return flags;
  };

  const validateSafetyThresholds = (confidence: number, extractedData: any) => {
    const warnings: string[] = [];

    // Only show warnings if confidence is below 70%
    if (confidence < 0.7) {
      warnings.push(t('scanner.lowQuality'));
    }

    if (confidence < 0.5) {
      warnings.push(t('scanner.criticalWarning'));
    }

    // Only set warnings if confidence is below 70%
    setSafetyWarnings(confidence < 0.7 ? warnings : []);

    // Only block results if extraction completely failed or confidence is extremely low
    const hasValidExtraction = extractedData?.brand_name && (extractedData.confidence_score || 0) > 0.5;
    return hasValidExtraction;
  };

  const extractMedicationInfo = async (text: string, barcode?: string, sessionId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-medication', {
        body: { 
          text, 
          barcode,
          language,
          region: getRegionFromLanguage(language),
          sessionId
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
          title: t('errors.cameraError'),
          description: t('errors.permissionDenied'),
          variant: "destructive",
        });
    }
  };

  const selectFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      setCapturedImage(image.dataUrl || null);
      
      if (image.dataUrl) {
        await processImage(image.dataUrl);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      toast({
        title: t('errors.galleryError'),
        description: t('errors.permissionDenied'),
        variant: "destructive",
      });
    }
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    let barcodeValue: string | undefined;
    let medicationData: any = null;

    try {
      console.log('Starting image processing...');
      
      // Step 1: Check for barcode
      setProcessingStep("Scanning for barcode...");
      console.log('Step 1: Starting barcode scan...');
      const barcode = await barcodeService.scanBarcode(imageData);
      console.log('Barcode scan result:', barcode);
      
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
      console.log('Step 2: Starting OCR processing...');
      await ocrService.initialize();
      console.log('OCR service initialized');
      
      const ocrResult = await ocrService.processImage(imageData);
      console.log('OCR processing result:', ocrResult);
      
      setOcrText(ocrResult.text);
      setConfidence(ocrResult.confidence);

      // Step 3: Create session first to get session ID
      setProcessingStep("Creating scan session...");
      const sessionId = await saveSession(barcodeValue);
      const currentSessionId = sessionId;

      // Step 4: Extract medication info if we have OCR text or barcode
      if (ocrResult.text.trim().length > 10 || barcodeValue) {
        setProcessingStep("Analyzing medication information...");
        medicationData = await extractMedicationInfo(ocrResult.text, barcodeValue, currentSessionId);
        setExtractedData(medicationData);

        // Show success message if we have any data
        if (medicationData) {
          toast({
            title: t('common.success'),
            description: barcodeValue ? t('scanner.barcodeFound') : t('scanner.medicationFound'),
          });
        }
      } else {
        // If no text and no barcode, show a helpful message
        toast({
          title: t('common.info'),
          description: "Please try scanning a clearer image of the medication package or barcode",
          variant: "default",
        });
      }

      setScanComplete(true);

    } catch (error) {
      console.error('Error processing image:', error);
        toast({
          title: t('errors.processingFailed'),
          description: error instanceof Error ? error.message : t('errors.scanFailed'),
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
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-6 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">{t('scanner.scanMedication')}</h1>
          </div>
          <Badge variant="outline" className="text-xs">
            {language}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-safe">
        {!capturedImage ? (
          /* Camera Interface */
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-primary-light flex items-center justify-center">
                <CameraIcon className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t('scanner.alignMedication')}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('scanner.scanInstructions')}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Button 
                size="lg"
                onClick={captureImage}
                className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-medical text-lg px-8 py-6 h-auto"
              >
                <CameraIcon className="w-6 h-6 mr-3" />
                {t('scanner.takePhoto')}
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                onClick={selectFromGallery}
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg px-8 py-6 h-auto"
              >
                <ImageIcon className="w-6 h-6 mr-3" />
                {t('scanner.uploadFromGallery')}
              </Button>
            </div>

            <div className="mt-8 grid gap-4 text-sm text-muted-foreground max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>{t('scanner.goodLighting')}</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>{t('medications.brandName')} and {t('medications.strength')}</span>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <span>{t('scanner.onDeviceProcessing')}</span>
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
                  {t('scanner.scanAgain')}
                </Button>
                
                {!isProcessing && scanComplete && extractedData && (
                  <Button 
                    onClick={handleContinue}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-medical"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('scanner.continue')}
                  </Button>
                )}
              </div>
            </Card>

            {/* Processing Status */}
            {isProcessing && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="font-medium">{t('scanner.processingImage')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {processingStep || t('scanner.extractingInfo')}
                </p>
              </Card>
            )}

            {/* Processing Complete Message */}
            {(barcodeData || ocrText) && !isProcessing && (
              <Card className="p-6">
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>{t('common.success')}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Image Quality Warnings - Hidden for confidence < 70% */}

            {/* Critical Extraction Failures */}
            {safetyWarnings.length > 0 && !isProcessing && !extractedData && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Extraction Failed:</p>
                    {safetyWarnings.map((warning, index) => (
                      <p key={index}>{warning}</p>
                    ))}
                    <p className="text-sm mt-2">Please retake the photo with better lighting and focus.</p>
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
              <Card className="p-6 border-success">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <h3 className="font-semibold text-foreground">{t('scanner.extractedMedicationInfo')}</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-foreground text-lg">{extractedData.brand_name}</h4>
                    {extractedData.generic_name && (
                      <p className="text-sm text-muted-foreground">{t('medications.genericName')}: {extractedData.generic_name}</p>
                    )}
                    {extractedData.strength && (
                      <p className="text-sm text-muted-foreground">{t('medications.strength')}: {extractedData.strength}</p>
                    )}
                    {extractedData.form && (
                      <p className="text-sm text-muted-foreground">{t('medications.form')}: {extractedData.form}</p>
                    )}
                    {extractedData.manufacturer && (
                      <p className="text-sm text-muted-foreground">{t('medications.manufacturer')}: {extractedData.manufacturer}</p>
                    )}
                  </div>

                  {extractedData.indications && extractedData.indications.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-1">{t('medications.indications')}:</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {extractedData.indications.map((indication: string, index: number) => (
                          <li key={index}>• {indication}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {extractedData.warnings && extractedData.warnings.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm text-warning mb-1">{t('safety.warnings')}:</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {extractedData.warnings.map((warning: string, index: number) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Badge variant={extractedData.confidence_score >= 0.8 ? "default" : "secondary"}>
                      {t('common.confidence')}: {Math.round((extractedData.confidence_score || 0) * 100)}%
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