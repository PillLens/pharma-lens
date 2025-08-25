import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, Zap, ZapOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { barcodeService } from '@/services/barcodeService';
import { capacitorService } from '@/services/capacitorService';
import { useTranslation } from '@/hooks/useTranslation';
import { TranslatedText } from '@/components/TranslatedText';
import { toast } from 'sonner';

interface RealtimeBarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export const RealtimeBarcodeScanner: React.FC<RealtimeBarcodeScannerProps> = ({
  onBarcodeDetected,
  onClose,
  isActive
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const lastDetectionRef = useRef<number>(0);
  
  const [isScanning, setIsScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [scanningState, setScanningState] = useState<'idle' | 'scanning' | 'detected'>('idle');

  // Camera constraints for optimal barcode scanning
  const getCameraConstraints = useCallback(() => {
    return {
      video: {
        facingMode: 'environment', // Use back camera
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        aspectRatio: 16/9,
        frameRate: { ideal: 30, min: 15 },
        focusMode: 'continuous',
        zoom: 1.0
      },
      audio: false
    };
  }, []);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!isActive) return;
    
    try {
      // Check permissions first
      if (capacitorService.isNative()) {
        const hasPermissions = await capacitorService.checkPermissions();
        if (!hasPermissions) {
          const granted = await capacitorService.requestPermissions();
          if (!granted) {
            toast.error(t('errors.cameraPermissionRequired'));
            return;
          }
        }
      }

      const constraints = getCameraConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        setScanningState('scanning');
      }
      
    } catch (error) {
      console.error('Error initializing camera:', error);
      toast.error(t('errors.cameraAccess'));
    }
  }, [isActive, getCameraConstraints]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsScanning(false);
    setScanningState('idle');
  }, []);

  // Scan frame for barcodes
  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning || !isActive) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Throttle barcode detection to avoid too frequent calls
    const now = Date.now();
    if (now - lastDetectionRef.current < 500) { // 500ms throttle
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    
    lastDetectionRef.current = now;
    
    try {
      // Detect barcode in current frame
      const result = await barcodeService.detectBarcodeInVideo(video);
      
      if (result && result.confidence > 0.7) {
        setDetectedBarcode(result.code);
        setScanningState('detected');
        
        // Vibrate on detection (if supported)
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        // Call the callback after a short delay to show detection animation
        setTimeout(() => {
          onBarcodeDetected(result.code);
        }, 500);
        
        return; // Stop scanning after successful detection
      }
    } catch (error) {
      // Silently continue scanning on errors
      console.warn('Barcode detection error:', error);
    }
    
    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [isScanning, isActive, onBarcodeDetected]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if ('torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } else {
        toast.info(t('scanner.flashNotSupported'));
      }
    } catch (error) {
      console.error('Error toggling flash:', error);
      toast.error(t('errors.flashToggleFailed'));
    }
  }, [flashEnabled]);

  // Reset scanning
  const resetScanning = useCallback(() => {
    setDetectedBarcode(null);
    setScanningState('scanning');
    lastDetectionRef.current = 0;
    
    // Resume scanning
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [scanFrame]);

  // Initialize camera when component becomes active
  useEffect(() => {
    if (isActive) {
      initializeCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isActive, initializeCamera, stopCamera]);

  // Start scanning when video is ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleLoadedMetadata = () => {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [scanFrame]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 text-white">
        <div className="flex items-center gap-3">
          <Camera className="w-6 h-6" />
          <div>
            <h2 className="text-lg font-semibold">
              <TranslatedText translationKey="scanner.barcodeScanner" />
            </h2>
            <p className="text-sm text-gray-300">
              {scanningState === 'scanning' && <TranslatedText translationKey="scanner.scanningBarcodes" />}
              {scanningState === 'detected' && <TranslatedText translationKey="scanner.barcodeDetected" />}
              {scanningState === 'idle' && <TranslatedText translationKey="scanner.initializingCamera" />}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFlash}
            className="text-white hover:bg-white/20"
          >
            {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
          </Button>
          
          {scanningState === 'detected' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetScanning}
              className="text-white hover:bg-white/20"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Hidden canvas for frame processing */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Scanning frame */}
          <div className="relative">
            <div 
              className={`w-64 h-40 border-2 rounded-lg transition-colors duration-300 ${
                scanningState === 'detected' 
                  ? 'border-green-400 shadow-lg shadow-green-400/50' 
                  : scanningState === 'scanning' 
                    ? 'border-blue-400 animate-pulse' 
                    : 'border-gray-400'
              }`}
            >
              {/* Corner indicators */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-current rounded-tl-md" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-current rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-current rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-current rounded-br-md" />
              
              {/* Scanning line animation */}
              {scanningState === 'scanning' && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-400 animate-bounce" />
              )}
              
              {/* Detection checkmark */}
              {scanningState === 'detected' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center animate-ping">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            {/* Instructions */}
            <p className="text-white text-center mt-4 text-sm">
              {scanningState === 'scanning' && <TranslatedText translationKey="scanner.positionBarcode" />}
              {scanningState === 'detected' && detectedBarcode && `${t('scanner.found')}: ${detectedBarcode}`}
              {scanningState === 'idle' && <TranslatedText translationKey="scanner.initializingCamera" />}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-4 left-4">
          <div className={`w-3 h-3 rounded-full ${
            scanningState === 'scanning' ? 'bg-blue-400 animate-pulse' :
            scanningState === 'detected' ? 'bg-green-400' :
            'bg-gray-400'
          }`} />
        </div>
      </div>

      {/* Bottom actions */}
      <div className="p-4 bg-black/80">
        <div className="flex justify-center">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <TranslatedText translationKey="scanner.cancelScanning" />
          </Button>
        </div>
      </div>
    </div>
  );
};