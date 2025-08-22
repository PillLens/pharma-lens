import React, { useState } from 'react';
import { Camera, X, Zap, ZapOff, RotateCcw, CheckCircle } from 'lucide-react';
import { MobileButton } from './MobileButton';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from './MobileCard';
import { cn } from '@/lib/utils';

interface MobileScanInterfaceProps {
  isActive: boolean;
  onClose: () => void;
  onScanResult: (result: any) => void;
  scanningState: 'idle' | 'scanning' | 'detected';
  detectedData?: any;
}

export const MobileScanInterface: React.FC<MobileScanInterfaceProps> = ({
  isActive,
  onClose,
  onScanResult,
  scanningState,
  detectedData
}) => {
  const [flashEnabled, setFlashEnabled] = useState(false);

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  const resetScanning = () => {
    // Reset scanning logic would go here
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Premium Medical Header */}
      <header className="medical-surface text-foreground p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Medical Scanner</h1>
              <p className="text-sm text-muted-foreground">
                {scanningState === 'scanning' && 'Analyzing medication...'}
                {scanningState === 'detected' && 'Medication detected!'}
                {scanningState === 'idle' && 'Position medication clearly'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MobileButton
              variant="ghost"
              size="icon"
              onClick={toggleFlash}
              className="text-foreground hover:bg-muted/60"
            >
              {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </MobileButton>
            
            {scanningState === 'detected' && (
              <MobileButton
                variant="ghost"
                size="icon"
                onClick={resetScanning}
                className="text-foreground hover:bg-muted/60"
              >
                <RotateCcw className="w-5 h-5" />
              </MobileButton>
            )}
            
            <MobileButton
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-foreground hover:bg-muted/60"
            >
              <X className="w-5 h-5" />
            </MobileButton>
          </div>
        </div>
      </header>

      {/* Camera Viewport with Medical Overlay */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {/* Camera feed would go here */}
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-white text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Camera Feed</p>
            <p className="text-sm opacity-70">Would show live camera here</p>
          </div>
        </div>
        
        {/* Medical Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Premium Scanning Frame */}
            <div 
              className={cn(
                "w-80 h-48 border-2 rounded-xl transition-all duration-300",
                scanningState === 'detected' 
                  ? "border-success shadow-lg shadow-success/50 bg-success/10" 
                  : scanningState === 'scanning' 
                    ? "border-primary animate-medical-pulse bg-primary/5" 
                    : "border-white/60 bg-white/5"
              )}
            >
              {/* Medical Corner Indicators */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-current rounded-tl-lg" />
              <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-current rounded-tr-lg" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-current rounded-bl-lg" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-current rounded-br-lg" />
              
              {/* Scanning Animation */}
              {scanningState === 'scanning' && (
                <div className="absolute inset-x-4 top-4 h-0.5 bg-primary animate-scan-line rounded-full" />
              )}
              
              {/* Success Indicator */}
              {scanningState === 'detected' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center animate-success-bounce shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Medical Instructions */}
            <MobileCard 
              variant="glass" 
              className="mt-6 text-center text-white border-white/20"
            >
              <MobileCardContent className="p-4">
                <p className="text-sm font-medium">
                  {scanningState === 'scanning' && 'Hold steady while analyzing...'}
                  {scanningState === 'detected' && 'Medication successfully scanned!'}
                  {scanningState === 'idle' && 'Position medication box or leaflet in frame'}
                </p>
              </MobileCardContent>
            </MobileCard>
          </div>
        </div>

        {/* Medical Status Indicator */}
        <div className="absolute top-4 left-4">
          <div className={cn(
            "w-4 h-4 rounded-full shadow-lg",
            scanningState === 'scanning' ? 'bg-primary animate-medical-pulse' :
            scanningState === 'detected' ? 'bg-success animate-success-bounce' :
            'bg-white/60'
          )} />
        </div>

        {/* Professional Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* Medical Action Bar */}
      <div className="medical-surface p-4 safe-area-bottom">
        <div className="flex justify-center">
          <MobileButton
            onClick={onClose}
            variant="outline"
            size="lg"
            className="border-white/20 text-foreground hover:bg-muted/60"
          >
            Cancel Scan
          </MobileButton>
        </div>
      </div>
    </div>
  );
};